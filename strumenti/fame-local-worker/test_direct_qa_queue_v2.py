import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_queue_v2 as q
import direct_qa_worker_v2 as w


class Fake:
    def __init__(self,replies):
        self.replies=list(replies);self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':return {'version':'test'}
        if endpoint=='/api/tags':return {'models':[{'name':w.MODEL,'digest':w.DIGEST}]}
        if endpoint=='/api/show':return {}
        self.calls.append(payload)
        return dict(done=True,message=dict(content=json.dumps(self.replies.pop(0))),done_reason='stop')


def good():
    return {'results':[
        {'code':'CONTROLLED_FAILURE_BEFORE_PUBLISH','supported':True,'evidenceIds':['U02']},
        {'code':'V1_V2_OUTPUT_MISMATCH','supported':True,'evidenceIds':['U03']},
        {'code':'UNVERIFIED_ARCH_ASSUMPTION','supported':True,'evidenceIds':['U03','U04']},
        {'code':'V1_REPLACEMENT_SCOPE','supported':True,'evidenceIds':['U05']},
        {'code':'FAILURE_AUTHORIZES_MUSICAL_EXECUTION','supported':False,'evidenceIds':[]},
    ]}


def bad():
    value=good();value=json.loads(json.dumps(value))
    value['results'][0]={'code':'CONTROLLED_FAILURE_BEFORE_PUBLISH','supported':False,'evidenceIds':[]}
    return value


class QueueV2Tests(unittest.TestCase):
    def test_first_pass_queue(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q';q.init(root,['direct-qa-v2-regression-fixture-v1'])
            f=Fake([good()]);r=q.run(root,f)
            self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW');self.assertEqual(len(f.calls),1)

    def test_repaired_queue(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q';q.init(root,['direct-qa-v2-regression-fixture-v1'])
            f=Fake([bad(),good()]);r=q.run(root,f)
            self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW_AFTER_REPAIR');self.assertEqual(len(f.calls),2)
            self.assertTrue(r['results'][0]['acceptedAfterRepair'])

    def test_queue_rejects_consumed_task_before_creating_root(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q'
            for task in ('tsumugi-v1-architecture-failure-review-v1','p2-measurement-export-review-v1','coordinator-architecture-review-v1','rubric-audit-semantics-review-v1','package-authoring-rules-review-v1','recovery-protocol-review-v1'):
                with self.assertRaises(ValueError):q.init(root,[task])
            self.assertFalse(root.exists())

    def test_cli_run_and_status_do_not_require_tasks(self):
        parser=q.build_parser()
        self.assertIsNone(parser.parse_args(['run','--root','x']).tasks)
        self.assertIsNone(parser.parse_args(['status','--root','x']).tasks)

    def test_queue_does_not_rerun_consumed_desk(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q';q.init(root,['direct-qa-v2-regression-fixture-v1'])
            f=Fake([good()]);q.run(root,f);q.run(root,f)
            self.assertEqual(len(f.calls),1)


if __name__=='__main__':unittest.main()
