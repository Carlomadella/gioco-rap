import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_worker_v3 as w


class Fake:
    def __init__(self,replies=None,mode=None):
        self.replies=list(replies or [])
        self.mode=mode
        self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':return {'version':'test'}
        if endpoint=='/api/tags':return {'models':[{'name':w.MODEL,'digest':'wrong' if self.mode=='digest' else w.DIGEST}]}
        if endpoint=='/api/show':return {}
        self.calls.append(payload)
        if self.mode=='timeout':raise TimeoutError('test')
        answer=self.replies.pop(0)
        return dict(done=True,done_reason='stop',message=dict(content=json.dumps(answer)))


class WorkerV3Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'desk'
        self.p=w.package('pfnmf-review-v1')
        with contextlib.redirect_stdout(io.StringIO()):w.init(self.root,'pfnmf-review-v1')

    def good(self):
        return {'results':[
            {'code':'GATE_AND_CAUSE','supported':True,'evidenceIds':['U02','U03']},
            {'code':'D06_ERRORS','supported':True,'evidenceIds':['U03']},
            {'code':'BIC_SCOPE','supported':True,'evidenceIds':['U06']},
            {'code':'TRAINING_OPEN','supported':False,'evidenceIds':[]},
        ]}

    def bad(self):
        value=json.loads(json.dumps(self.good()))
        value['results'][0]={'code':'GATE_AND_CAUSE','supported':False,'evidenceIds':[]}
        value['results'][1]['evidenceIds']=['U02']
        return value

    def run_worker(self,f):
        with contextlib.redirect_stdout(io.StringIO()):return w.run(self.root,f)

    def test_diagnostic_package_loads(self):
        p=w.package('review-boundary-repair-v3')
        self.assertEqual(p['taskId'],'review-boundary-repair-v3')
        self.assertEqual(len(p['units']),8)
        self.assertEqual(len(p['checks']),7)
        self.assertIn('non e una nuova evaluation indipendente',p['scope'])

    def test_first_pass_stays_one_call(self):
        f=Fake([self.good()]);r=self.run_worker(f)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW')
        self.assertTrue(r['firstAttemptPass'])
        self.assertFalse(r['acceptedAfterRepair'])
        self.assertEqual(r['modelCalls'],1)
        self.assertEqual(len(f.calls),1)
        self.assertFalse((self.root/'attempt-2').exists())

    def test_repair_can_accept_second_attempt(self):
        f=Fake([self.bad(),self.good()]);r=self.run_worker(f)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW_AFTER_REPAIR')
        self.assertFalse(r['firstAttemptPass'])
        self.assertTrue(r['acceptedAfterRepair'])
        self.assertEqual(r['modelCalls'],2)
        self.assertEqual(len(f.calls),2)
        self.assertTrue((self.root/'attempt-2/review.md').exists())

    def test_repair_does_not_replay_previous_candidate(self):
        bad=self.bad()
        f=Fake([bad,self.good()]);self.run_worker(f)
        second=f.calls[1]
        roles=[m['role'] for m in second['messages']]
        self.assertEqual(roles,['system','user','user'])
        serialized=json.dumps(second,ensure_ascii=False)
        self.assertNotIn(json.dumps(bad,ensure_ascii=False),serialized)
        self.assertNotIn('"role": "assistant"',serialized)
        meta=json.loads((self.root/'attempt-2/repair-feedback.json').read_text(encoding='utf-8'))
        self.assertFalse(meta['previousCandidateReplayed'])
        self.assertTrue(meta['freshReconstruction'])

    def test_repair_feedback_is_generic_not_oracle(self):
        f=Fake([self.bad(),self.good()]);self.run_worker(f)
        feedback=f.calls[1]['messages'][-1]['content']
        self.assertIn('SOME_CONCLUSION_INCORRECT',feedback)
        self.assertIn('SOME_EVIDENCE_COVERAGE_INSUFFICIENT',feedback)
        self.assertNotIn('GATE_AND_CAUSE',feedback)
        self.assertNotIn('D06_ERRORS',feedback)
        request=json.dumps(f.calls[1],ensure_ascii=False)
        self.assertNotIn('requiredGroups',request)
        self.assertNotIn('benignContext',request)
        self.assertNotIn('"rubric"',request)

    def test_repair_explicitly_requests_fresh_reasoning_checks(self):
        f=Fake([self.bad(),self.good()]);self.run_worker(f)
        feedback=f.calls[1]['messages'][-1]['content']
        self.assertIn('ricostruire',feedback)
        self.assertIn('negazioni',feedback)
        self.assertIn('condizioni',feedback)
        self.assertIn('quantificatori',feedback)

    def test_two_bad_attempts_rejected(self):
        f=Fake([self.bad(),self.bad()]);r=self.run_worker(f)
        self.assertEqual(r['status'],'REJECTED')
        self.assertEqual(r['modelCalls'],2)
        self.assertFalse((self.root/'attempt-2/answer.json').exists())

    def test_preflight_error_does_not_repair(self):
        f=Fake([self.good()],mode='digest');r=self.run_worker(f)
        self.assertEqual(r['status'],'ERROR')
        self.assertEqual(f.calls,[])
        self.assertFalse((self.root/'attempt-2').exists())

    def test_transport_error_does_not_repair(self):
        f=Fake(mode='timeout');r=self.run_worker(f)
        self.assertEqual(r['status'],'ERROR')
        self.assertEqual(len(f.calls),1)
        self.assertFalse((self.root/'attempt-2').exists())

    def test_status_reproduces_repaired_result(self):
        self.run_worker(Fake([self.bad(),self.good()]))
        r=w.status(self.root)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW_AFTER_REPAIR')
        self.assertTrue(r['acceptedAfterRepair'])
        self.assertFalse(r['previousCandidateReplayed'])

    def test_no_reexecution_after_consumed_run(self):
        f=Fake([self.good()]);self.run_worker(f)
        with self.assertRaises(FileExistsError):self.run_worker(f)
        self.assertEqual(len(f.calls),1)


if __name__=='__main__':unittest.main()
