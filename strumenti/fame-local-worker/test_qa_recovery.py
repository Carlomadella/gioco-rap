import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import qa_coordinator as coord
import qa_recovery as recovery
import qa_transfer
from test_qa_coordinator import Fake

class OriginalFake(Fake):
    def request(self,endpoint,payload=None):
        response=super().request(endpoint,payload)
        if endpoint=='/api/chat' and json.loads(payload['messages'][1]['content'])['task']['code']==recovery.PARENT:
            response['message']['content']=json.dumps(dict(supported=True,evidenceIds=['E155']))
        return response

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base=Path(self.tmp.name)
        self.source=self.base/'original'
        self.root=self.base/'recovery'
        coord.init(self.source)
        with contextlib.redirect_stdout(io.StringIO()):
            coord.run(self.source,client=OriginalFake(qa_transfer.build_engine()))
        self.before={str(p.relative_to(self.source)):p.read_bytes() for p in self.source.rglob('*') if p.is_file()}
        recovery.init(self.root,self.source)
    def run_recovery(self,client):
        with contextlib.redirect_stdout(io.StringIO()):
            return recovery.run(self.root,client)
    def test_two_calls_merge_preserve_original(self):
        client=Fake(recovery.build_engine())
        result=self.run_recovery(client)
        self.assertEqual(result['status'],'VALIDATED_AFTER_RECOVERY')
        self.assertEqual(result['firstPassAccepted'],13)
        self.assertFalse(result['firstPassPassed'])
        self.assertEqual(result['afterRecoveryAccepted'],14)
        self.assertEqual(len(result['findings']),10)
        self.assertEqual(len(client.calls),2)
        for payload in client.calls:
            data=json.loads(payload['messages'][1]['content'])
            self.assertEqual(set(data),{'task','report'})
            self.assertEqual(len(data['report']),216)
            self.assertEqual(set(data['task']),{'code','assertion'})
        self.assertEqual(self.before,{str(p.relative_to(self.source)):p.read_bytes() for p in self.source.rglob('*') if p.is_file()})
        self.assertTrue(list((self.root/'recovery-results').glob('*/answer.json')))
        self.run_recovery(client)
        self.assertEqual(len(client.calls),2)
    def test_child_failure_not_promoted_or_retried(self):
        client=Fake(recovery.build_engine(),corrupt='RELEASE_CAUSE_UNPROVEN')
        result=self.run_recovery(client)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertEqual(result['afterRecoveryAccepted'],13)
        self.assertFalse(list((self.root/'recovery-results').glob('*/answer.json')))
        self.run_recovery(client)
        self.assertEqual(len(client.calls),2)
    def test_wrong_child_evidence_rejected(self):
        engine=recovery.build_engine()
        response={'done':True,'message':{'content':json.dumps(dict(supported=True,evidenceIds=['E155']))}}
        self.assertEqual(coord.grade(engine,engine.case_text(),'RELEASE_CAUSE_UNPROVEN',response)['status'],'SEMANTIC_FAIL')
    def test_source_changed_no_calls(self):
        (self.source/'report.md').write_text('changed')
        client=Fake(recovery.build_engine())
        with self.assertRaises(ValueError): self.run_recovery(client)
        self.assertEqual(client.calls,[])
    def test_source_changed_in_flight_no_promotion(self):
        client=Fake(recovery.build_engine(),callback=lambda:(self.source/'report.md').write_text('changed'))
        with self.assertRaises(ValueError): self.run_recovery(client)
        self.assertFalse((self.root/'recovery-results').exists())
    def test_response_tamper_detected(self):
        self.run_recovery(Fake(recovery.build_engine()))
        (self.root/'desks/RELEASE_CAUSE_UNPROVEN/attempt-1/response.json').write_text('{}')
        with self.assertRaises(ValueError): recovery.evaluate(self.root)
    def test_nested_root_rejected(self):
        with self.assertRaises(ValueError): recovery.init(self.source/'nested',self.source)
    def test_inapplicable_source_rejected(self):
        fresh=self.base/'fresh'
        coord.init(fresh)
        with self.assertRaises(ValueError): recovery.init(self.base/'other',fresh)

if __name__=='__main__': unittest.main()
