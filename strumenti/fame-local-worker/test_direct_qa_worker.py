import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import agent
import direct_qa_worker as w

class Fake:
    def __init__(self,answer=None,mode=None,callback=None):self.calls=[];self.answer=answer;self.mode=mode;self.callback=callback
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':return {'version':'test'}
        if endpoint=='/api/tags':return {'models':[{'name':w.MODEL,'digest':'wrong' if self.mode=='digest' else w.DIGEST}]}
        if endpoint=='/api/show':return {}
        self.calls.append(payload)
        if self.callback:self.callback()
        if self.mode=='timeout':raise TimeoutError('test')
        return dict(done=True,done_reason='length' if self.mode=='length' else 'stop',message=dict(content=json.dumps(self.answer)))

class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)/'desk'
        self.p=w.package('pfnmf-review-v1')
        with contextlib.redirect_stdout(io.StringIO()):w.init(self.root,'pfnmf-review-v1')
    def answer(self):
        return {'results':[dict(code=c['code'],supported=c['code']!='TRAINING_OPEN',evidenceIds=e)
            for c,e in zip(self.p['checks'],[['U02','U03'],['U03'],['U06'],[]])]}
    def run_worker(self,f):
        with contextlib.redirect_stdout(io.StringIO()):return w.run(self.root,f)
    def test_pass_no_oracle_and_reproducible_status(self):
        f=Fake(self.answer());r=self.run_worker(f)
        self.assertEqual(r['status'],'VALIDATED_FOR_REVIEW');self.assertEqual(len(f.calls),1)
        req=f.calls[0];self.assertNotIn('tools',req)
        sent=json.loads(req['messages'][1]['content']);self.assertNotIn('rubric',sent)
        self.assertNotIn('requiredGroups',json.dumps(req));self.assertEqual(w.status(self.root),r)
        self.assertTrue((self.root/'attempt-1/review.md').exists())
    def test_no_reexecution(self):
        f=Fake(self.answer());self.run_worker(f)
        with self.assertRaises(FileExistsError):self.run_worker(f)
        self.assertEqual(len(f.calls),1)
    def test_incomplete_coverage(self):
        a=self.answer();a['results'][0]['evidenceIds']=['U02']
        r=self.run_worker(Fake(a));self.assertEqual(r['status'],'REJECTED')
        self.assertFalse((self.root/'attempt-1/answer.json').exists())
    def test_benign_extra_warning(self):
        a=self.answer();a['results'][0]['evidenceIds'].append('U05')
        v=w.assess(a,self.p);self.assertTrue(v['accepted']);self.assertEqual(v['assessments'][0]['precisionWarnings'],['U05'])
    def test_false_authorization_rejected(self):
        a=self.answer();a['results'][3].update(supported=True,evidenceIds=['U06'])
        self.assertFalse(w.assess(a,self.p)['accepted'])
    def test_truncated(self):
        self.assertEqual(self.run_worker(Fake(self.answer(),mode='length'))['status'],'REJECTED')
    def test_wrong_digest_zero_calls(self):
        f=Fake(self.answer(),mode='digest');self.assertEqual(self.run_worker(f)['status'],'ERROR');self.assertEqual(f.calls,[])
    def test_tamper_before_no_calls(self):
        (self.root/'snapshot.json').write_text('{}');f=Fake(self.answer())
        with self.assertRaises(ValueError):self.run_worker(f)
        self.assertEqual(f.calls,[])
    def test_tamper_during_no_promotion(self):
        f=Fake(self.answer(),callback=lambda:(self.root/'snapshot.json').write_text('{}'))
        self.assertEqual(self.run_worker(f)['status'],'ERROR');self.assertFalse((self.root/'attempt-1/answer.json').exists())
    def test_transport_preserved(self):
        f=Fake(mode='timeout');self.assertEqual(self.run_worker(f)['status'],'ERROR')
        with self.assertRaises(FileExistsError):self.run_worker(f)
    def test_output_tamper(self):
        self.run_worker(Fake(self.answer()));(self.root/'attempt-1/response.json').write_text('{}')
        with self.assertRaises(ValueError):w.status(self.root)
    def test_bad_contracts(self):
        for ids in ([],['U99'],['U03','U03'],[True]):
            a=self.answer();a['results'][1]['evidenceIds']=ids;self.assertFalse(w.assess(a,self.p)['accepted'])
    def test_unknown_unit_requires_review(self):
        a=self.answer();a['results'][0]['evidenceIds'].append('U07')
        self.assertIn('GATE_AND_CAUSE:UNREVIEWED_EVIDENCE',w.assess(a,self.p)['errors'])
    def test_task_path_rejected(self):
        with self.assertRaises(ValueError):w.package('../other')

if __name__=='__main__':unittest.main()
