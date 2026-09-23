import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_queue_v2 as q
import direct_qa_worker_v2 as w


class Fake:
    def __init__(self,replies=None,mode=None):
        self.replies=list(replies or []);self.mode=mode;self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':return {'version':'test'}
        if endpoint=='/api/tags':return {'models':[{'name':w.MODEL,'digest':w.DIGEST}]}
        if endpoint=='/api/show':return {}
        self.calls.append(payload)
        if self.mode=='timeout':raise TimeoutError('test')
        return dict(done=True,message=dict(content=json.dumps(self.replies.pop(0))),done_reason='stop')


def good():
    return {'results':[
        {'code':'GATE_AND_CAUSE','supported':True,'evidenceIds':['U02','U03']},
        {'code':'D06_ERRORS','supported':True,'evidenceIds':['U03']},
        {'code':'BIC_SCOPE','supported':True,'evidenceIds':['U06']},
        {'code':'TRAINING_OPEN','supported':False,'evidenceIds':[]},
    ]}


def bad():
    value=good();value=json.loads(json.dumps(value))
    value['results'][0]={'code':'GATE_AND_CAUSE','supported':False,'evidenceIds':[]}
    return value


class QueueV2Tests(unittest.TestCase):
    def test_first_pass_queue(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q';q.init(root,['pfnmf-review-v1'])
            f=Fake([good()]);r=q.run(root,f)
            self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW');self.assertEqual(len(f.calls),1)

    def test_repaired_queue(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q';q.init(root,['pfnmf-review-v1'])
            f=Fake([bad(),good()]);r=q.run(root,f)
            self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW_AFTER_REPAIR');self.assertEqual(len(f.calls),2)
            self.assertTrue(r['results'][0]['acceptedAfterRepair'])

    def test_queue_does_not_rerun_consumed_desk(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q';q.init(root,['pfnmf-review-v1'])
            f=Fake([good()]);q.run(root,f);q.run(root,f)
            self.assertEqual(len(f.calls),1)

    def test_error_is_not_hidden_by_remaining_pending_tasks(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q'
            q.init(root,['pfnmf-review-v1','subset-bic-review-v1'])
            f=Fake(mode='timeout');r=q.run(root,f)
            self.assertEqual(r['status'],'NEEDS_REVIEW')
            self.assertEqual([row['status'] for row in r['results']],['ERROR','NOT_RUN'])
            self.assertEqual(len(f.calls),1)


if __name__=='__main__':unittest.main()
