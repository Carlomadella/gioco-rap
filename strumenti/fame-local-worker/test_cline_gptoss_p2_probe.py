import contextlib
import io
import tempfile
import unittest
from pathlib import Path
import agent
import cline_gptoss_p2_probe as p

class P2Tests(unittest.TestCase):
    def answer(self):
        return {'results':[dict(code=c,supported=c in p.RUBRIC,evidenceIds=ids)
            for c,ids in zip(p.CASES,[['E026','E027'],['E019','E020','E021'],['E059','E060'],[]])]}
    def test_complete(self): self.assertTrue(p.assess_answer(self.answer())[0])
    def test_equivalent_summary(self):
        a=self.answer();a['results'][0]['evidenceIds']=['E055','E056']
        self.assertTrue(p.assess_answer(a)[0])
    def test_benign_extra_warning_not_fail(self):
        a=self.answer();a['results'][0]['evidenceIds'].append('E037')
        ok,errors,rows=p.assess_answer(a)
        self.assertTrue(ok);self.assertEqual(errors,[]);self.assertEqual(rows[0]['precisionWarnings'],['E037'])
    def test_each_part_required(self):
        for index in range(3):
            for remove in range(len(self.answer()['results'][index]['evidenceIds'])):
                a=self.answer();a['results'][index]['evidenceIds'].pop(remove)
                self.assertFalse(p.assess_answer(a)[0])
    def test_false_authorization_rejected(self):
        a=self.answer();a['results'][3].update(supported=True,evidenceIds=['E054'])
        self.assertIn('RECORD_3_INCORRECT_CONCLUSION',p.assess_answer(a)[1])
    def test_unknown_context_not_silently_accepted(self):
        a=self.answer();a['results'][0]['evidenceIds'].append('E070')
        self.assertIn('RECORD_0_UNREVIEWED_EVIDENCE',p.assess_answer(a)[1])
    def test_contracts(self):
        for ids in (['E999'],['E026','E026'],[True]):
            a=self.answer();a['results'][0]['evidenceIds']=ids
            self.assertFalse(p.assess_answer(a)[0])
    def test_file_pipeline_and_immutable_evaluation(self):
        with tempfile.TemporaryDirectory() as d, contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'probe';p.init(root)
            self.assertEqual(len(list((root/'desk').rglob('*.json'))),1)
            agent.write(root/'desk/answer.json',self.answer())
            r=p.grade(root)
            self.assertEqual(r['status'],'ARTIFACT_PASS_SESSION_UNVERIFIED')
            with self.assertRaises(FileExistsError): p.grade(root)
    def test_tampered_report_fails(self):
        with tempfile.TemporaryDirectory() as d, contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'probe';p.init(root)
            agent.write(root/'desk/answer.json',self.answer())
            (root/'desk/report-numbered.md').write_text('changed')
            self.assertEqual(p.grade(root)['status'],'FAIL')

if __name__=='__main__': unittest.main()
