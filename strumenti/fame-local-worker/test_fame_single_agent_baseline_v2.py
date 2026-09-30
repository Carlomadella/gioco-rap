import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v3 as network
import fame_single_agent_baseline_v2 as baseline


class Fake:
    def __init__(self,response):
        self.response=response
        self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':network.MODEL,'digest':network.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.calls.append(payload)
        if isinstance(self.response,Exception):
            raise self.response
        if callable(self.response):
            return self.response(payload)
        return self.response


class BaselineV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'baseline'
        self.real_case_dir=network.CASE_DIR
        p=network.package('matched-package-authoring-v1')
        self.fixture_id='matched-baseline-v2-fixture'
        fixture=dict(p)
        fixture['caseId']=self.fixture_id
        fixture_dir=Path(self.temp.name)/'cases'
        fixture_dir.mkdir()
        (fixture_dir/(self.fixture_id+'.json')).write_text(
            json.dumps(fixture,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'
        )
        network.CASE_DIR=fixture_dir
        self.addCleanup(setattr,network,'CASE_DIR',self.real_case_dir)
        with contextlib.redirect_stdout(io.StringIO()):
            baseline.init(self.root,self.fixture_id)

    def answer(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'claims':[
                {'claimId':'C1','statement':'Consumed tasks are preserved.','evidenceIds':['U02']},
                {'claimId':'C2','statement':'Minimal sufficient evidence avoids redundant background.','evidenceIds':['U04']},
            ],
            'answer':'No.',
            'limitations':[],
        }

    def response(self,answer=None,done_reason='stop',eval_count=80):
        content=json.dumps(answer if answer is not None else self.answer(),ensure_ascii=False)
        return {
            'done':True,'done_reason':done_reason,
            'message':{'content':content},
            'total_duration':1000,'load_duration':100,
            'prompt_eval_count':50,'eval_count':eval_count,
        }

    def test_request_uses_16384_generation_tokens(self):
        p=network.package(self.fixture_id)
        req=baseline.request_for(p)
        self.assertEqual(req['options']['num_predict'],16384)
        self.assertEqual(req['options']['num_ctx'],network.OPTIONS['num_ctx'])
        self.assertEqual(req['options']['temperature'],network.OPTIONS['temperature'])
        self.assertEqual(req['options']['seed'],network.OPTIONS['seed'])

    def test_successful_run_is_reproducible(self):
        fake=Fake(self.response())
        with contextlib.redirect_stdout(io.StringIO()):
            first=baseline.run(self.root,fake)
            second=baseline.status(self.root)
        self.assertEqual(first,second)
        self.assertEqual(first['status'],baseline.FINAL_ACCEPTED)
        self.assertEqual(len(fake.calls),1)
        self.assertEqual(first['result']['metrics']['eval_count'],80)

    def test_truncated_response_preserves_metrics_and_errors(self):
        response=self.response(done_reason='length',eval_count=16384)
        response['message']['content']='{"answerOptionId":"ANSWER_NO"'
        fake=Fake(response)
        with contextlib.redirect_stdout(io.StringIO()):
            result=baseline.run(self.root,fake)
            replay=baseline.status(self.root)
        self.assertEqual(result,replay)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        row=result['result']
        self.assertEqual(row['status'],'ERROR')
        self.assertIn('Risposta incompleta',row['errors'][0])
        self.assertEqual(row['metrics']['done_reason'],'length')
        self.assertEqual(row['metrics']['eval_count'],16384)
        self.assertTrue((self.root/'attempt-1'/'response.json').exists())

    def test_no_response_transport_error_keeps_empty_metrics(self):
        fake=Fake(TimeoutError('test'))
        with contextlib.redirect_stdout(io.StringIO()):
            result=baseline.run(self.root,fake)
        self.assertEqual(result['result']['status'],'ERROR')
        self.assertEqual(result['result']['metrics'],{})
        self.assertFalse((self.root/'attempt-1'/'response.json').exists())


if __name__=='__main__':
    unittest.main()
