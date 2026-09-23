import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import agent
import qa_transfer
import qa_coordinator as coord


class Fake:
    def __init__(self, qa, corrupt=None, callback=None):
        self.qa=qa
        self.corrupt=corrupt
        self.callback=callback
        self.calls=[]
    def request(self, endpoint, payload=None):
        if endpoint=='/api/version': return {'version':'fake'}
        if endpoint=='/api/tags': return {'models':[{'name':coord.MODEL,'digest':coord.DIGEST}]}
        if endpoint=='/api/show': return {'thinking':{'values':['low','medium','high']}}
        self.calls.append(payload)
        if self.callback: self.callback()
        data=json.loads(payload['messages'][1]['content'])
        code=data['task']['code']
        if code==self.corrupt: return {'done':True,'done_reason':'length','message':{'content':''}}
        ids={row['line']:row['evidenceId'] for row in data['report']}
        rule=self.qa.RUBRIC.get(code)
        lines=sorted({min(group) for group in rule['required']}) if rule else []
        answer={'supported':rule is not None,'evidenceIds':[ids[n] for n in lines]}
        return {'done':True,'done_reason':'stop','message':{'content':json.dumps(answer)},'eval_count':100}


class CoordinatorTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)/'network'
        self.qa=qa_transfer.build_engine()
        coord.init(self.root)
        self.text=self.qa.case_text()
    def run_net(self,client,limit=14):
        with contextlib.redirect_stdout(io.StringIO()):
            return coord.run(self.root,limit,client)
    def test_fourteen_isolated_calls_and_complete_review(self):
        client=Fake(self.qa)
        result=self.run_net(client)
        self.assertEqual(result['status'],'VALIDATED_FOR_REVIEW')
        self.assertEqual(result['acceptedFindings'],10)
        self.assertEqual(result['acceptedDecisions'],14)
        self.assertEqual(len(client.calls),14)
        for payload in client.calls:
            self.assertEqual(len(payload['messages']),2)
            data=json.loads(payload['messages'][1]['content'])
            self.assertEqual(set(data),{'task','report'})
            self.assertEqual(len(data['report']),216)
            self.assertEqual(set(data['task']),{'code','assertion'})
            self.assertNotIn('tools',payload)
            self.assertEqual(payload['think'],'low')
            self.assertEqual(payload['options']['num_predict'],4096)
        self.assertFalse(result['executionAuthorized'])
        self.assertTrue(list((self.root/'summaries').glob('*/answer.json')))
    def test_resume_does_not_repeat_success_or_failure(self):
        client=Fake(self.qa,corrupt='TECHNICAL_ONLY')
        first=self.run_net(client,2)
        self.assertEqual(first['pending'],12)
        self.assertEqual(first['results'][0]['status'],'OUTPUT_TRUNCATED')
        second=self.run_net(client)
        self.assertEqual(len(client.calls),14)
        self.assertEqual(second['status'],'NEEDS_REVIEW')
        self.run_net(client)
        self.assertEqual(len(client.calls),14)
        self.assertFalse(list((self.root/'summaries').glob('*/answer.json')))
    def test_false_category_cannot_be_accepted_as_true(self):
        response={'done':True,'message':{'content':json.dumps({'supported':True,'evidenceIds':['E020']})}}
        r=coord.grade(self.qa,self.text,'BATCH_AUTHORIZED',response)
        self.assertEqual(r['status'],'SEMANTIC_FAIL')
    def test_true_category_cannot_be_omitted(self):
        response={'done':True,'message':{'content':json.dumps({'supported':False,'evidenceIds':[]})}}
        self.assertEqual(coord.grade(self.qa,self.text,'TECHNICAL_ONLY',response)['status'],'SEMANTIC_FAIL')
    def test_unsupported_must_have_empty_evidence(self):
        response={'done':True,'message':{'content':json.dumps({'supported':False,'evidenceIds':['E020']})}}
        self.assertEqual(coord.grade(self.qa,self.text,'BATCH_AUTHORIZED',response)['status'],'INVALID_RESPONSE')
    def test_input_tamper_no_model_call(self):
        (self.root/'desks/TECHNICAL_ONLY/TASK.json').write_text('{}')
        client=Fake(self.qa)
        with self.assertRaises(ValueError): self.run_net(client)
        self.assertFalse(client.calls)
        self.assertFalse((self.root/'coordinator.lock').exists())
    def test_response_tamper_detected_on_resume(self):
        client=Fake(self.qa)
        self.run_net(client,1)
        (self.root/'desks/TECHNICAL_ONLY/attempt-1/response.json').write_text('{}')
        with self.assertRaises(ValueError): self.run_net(client)
        self.assertEqual(len(client.calls),1)
    def test_interrupted_desk_not_reexecuted(self):
        (self.root/'desks/TECHNICAL_ONLY/attempt-1').mkdir()
        client=Fake(self.qa)
        r=self.run_net(client)
        self.assertEqual(len(client.calls),13)
        self.assertEqual(r['results'][0]['status'],'INTERRUPTED')
        self.assertEqual(r['status'],'NEEDS_REVIEW')
    def test_transport_failure_stops_queue_and_is_preserved(self):
        class Broken(Fake):
            def request(self,endpoint,payload=None):
                if endpoint=='/api/chat': raise TimeoutError('simulated')
                return super().request(endpoint,payload)
        r=self.run_net(Broken(self.qa))
        self.assertEqual(r['results'][0]['status'],'ERROR')
        self.assertEqual(r['pending'],13)
        client=Fake(self.qa)
        r=self.run_net(client)
        self.assertEqual(len(client.calls),13)
        self.assertEqual(r['status'],'NEEDS_REVIEW')
    def test_lock_blocks_second_coordinator(self):
        (self.root/'coordinator.lock').write_text('busy')
        with self.assertRaises(FileExistsError): self.run_net(Fake(self.qa))
    def test_inputs_changed_during_response_not_accepted(self):
        c=Fake(self.qa,callback=lambda:(self.root/'report.md').write_text('tamper'))
        with self.assertRaises(ValueError): self.run_net(c)
        self.assertFalse(list((self.root/'summaries').glob('*/answer.json')))


if __name__=='__main__': unittest.main()
