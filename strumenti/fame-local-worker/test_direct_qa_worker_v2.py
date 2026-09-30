import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_worker_v2 as w


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


class WorkerV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'desk'
        self.p=w.package('direct-qa-v2-regression-fixture-v1')
        with contextlib.redirect_stdout(io.StringIO()):w.init(self.root,'direct-qa-v2-regression-fixture-v1')

    def good(self):
        return {'results':[
            {'code':'CONTROLLED_FAILURE_BEFORE_PUBLISH','supported':True,'evidenceIds':['U02']},
            {'code':'V1_V2_OUTPUT_MISMATCH','supported':True,'evidenceIds':['U03']},
            {'code':'UNVERIFIED_ARCH_ASSUMPTION','supported':True,'evidenceIds':['U03','U04']},
            {'code':'V1_REPLACEMENT_SCOPE','supported':True,'evidenceIds':['U05']},
            {'code':'FAILURE_AUTHORIZES_MUSICAL_EXECUTION','supported':False,'evidenceIds':[]},
        ]}

    def bad(self):
        value=json.loads(json.dumps(self.good()))
        value['results'][0]={'code':'CONTROLLED_FAILURE_BEFORE_PUBLISH','supported':False,'evidenceIds':[]}
        value['results'][2]['evidenceIds']=['U04']
        return value

    def run_worker(self,f):
        with contextlib.redirect_stdout(io.StringIO()):return w.run(self.root,f)

    def test_first_pass_stays_one_call(self):
        f=Fake([self.good()]);r=self.run_worker(f)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW');self.assertTrue(r['firstAttemptPass'])
        self.assertFalse(r['acceptedAfterRepair']);self.assertEqual(r['modelCalls'],1);self.assertEqual(len(f.calls),1)
        self.assertFalse((self.root/'attempt-2').exists())

    def test_repair_can_accept_second_attempt(self):
        f=Fake([self.bad(),self.good()]);r=self.run_worker(f)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW_AFTER_REPAIR')
        self.assertFalse(r['firstAttemptPass']);self.assertTrue(r['acceptedAfterRepair'])
        self.assertEqual(r['modelCalls'],2);self.assertEqual(len(f.calls),2)
        self.assertTrue((self.root/'attempt-1/receipt.json').exists())
        self.assertTrue((self.root/'attempt-2/review.md').exists())

    def test_repair_feedback_is_generic_not_oracle(self):
        f=Fake([self.bad(),self.good()]);self.run_worker(f)
        feedback=f.calls[1]['messages'][-1]['content']
        self.assertIn('SOME_CONCLUSION_INCORRECT',feedback)
        self.assertIn('SOME_EVIDENCE_COVERAGE_INSUFFICIENT',feedback)
        self.assertNotIn('CONTROLLED_FAILURE_BEFORE_PUBLISH',feedback)
        self.assertNotIn('UNVERIFIED_ARCH_ASSUMPTION',feedback)
        request=json.dumps(f.calls[1],ensure_ascii=False)
        self.assertNotIn('requiredGroups',request)
        self.assertNotIn('benignContext',request)

    def test_surplus_evidence_is_salvaged_after_required_coverage(self):
        answer=self.good()
        answer['results'][0]['evidenceIds']=['U02','U01']
        sanitized,validation=w.salvage_surplus_evidence(answer,self.p)

        self.assertTrue(validation['accepted'])
        self.assertEqual(
            sanitized['results'][0]['evidenceIds'],
            ['U02']
        )
        self.assertEqual(
            validation['droppedEvidence'],
            {'CONTROLLED_FAILURE_BEFORE_PUBLISH':['U01']}
        )
        self.assertTrue(validation['hostSalvageApplied'])

    def test_two_bad_attempts_rejected(self):
        f=Fake([self.bad(),self.bad()]);r=self.run_worker(f)
        self.assertEqual(r['status'],'REJECTED');self.assertEqual(r['modelCalls'],2)
        self.assertFalse((self.root/'attempt-2/answer.json').exists())

    def test_preflight_error_does_not_repair(self):
        f=Fake([self.good()],mode='digest');r=self.run_worker(f)
        self.assertEqual(r['status'],'ERROR');self.assertEqual(f.calls,[])
        self.assertFalse((self.root/'attempt-2').exists())

    def test_transport_error_does_not_repair(self):
        f=Fake(mode='timeout');r=self.run_worker(f)
        self.assertEqual(r['status'],'ERROR');self.assertEqual(len(f.calls),1)
        self.assertFalse((self.root/'attempt-2').exists())

    def test_status_reproduces_repaired_result(self):
        self.run_worker(Fake([self.bad(),self.good()]))
        r=w.status(self.root)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW_AFTER_REPAIR')
        self.assertTrue(r['acceptedAfterRepair'])

    def test_consumed_tasks_cannot_be_initialized_in_v2(self):
        other=Path(self.temp.name)/'consumed'
        for task in ('pfnmf-review-v1','tsumugi-score-diagnostic-review-v1','tsumugi-v1-architecture-failure-review-v1','p2-measurement-export-review-v1','coordinator-architecture-review-v1','rubric-audit-semantics-review-v1','package-authoring-rules-review-v1','recovery-protocol-review-v1','gptoss-diagnostic-semantics-review-v1'):
            with self.assertRaises(ValueError):
                w.init(other,task)
            self.assertFalse(other.exists())

    def test_cli_run_and_status_do_not_require_task(self):
        parser=w.build_parser()
        self.assertIsNone(parser.parse_args(['run','--root',str(self.root)]).task)
        self.assertIsNone(parser.parse_args(['status','--root',str(self.root)]).task)

    def test_no_reexecution_after_consumed_run(self):
        f=Fake([self.good()]);self.run_worker(f)
        with self.assertRaises(FileExistsError):self.run_worker(f)
        self.assertEqual(len(f.calls),1)


if __name__=='__main__':unittest.main()
