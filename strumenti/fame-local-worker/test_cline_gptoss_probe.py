import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import cline_gptoss_probe as probe

class ProbeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'probe'
        with contextlib.redirect_stdout(io.StringIO()): probe.init(self.root)
    def answer(self,value=None):
        (self.root/'desk/answer.json').write_text(json.dumps(value or probe.expected()))
    def grade(self):
        with contextlib.redirect_stdout(io.StringIO()): return probe.grade(self.root)
    def test_correct_artifact_does_not_prove_session(self):
        self.answer();r=self.grade()
        self.assertEqual(r['status'],'ARTIFACT_PASS_SESSION_UNVERIFIED')
    def test_wrong_precedence_fails(self):
        a=probe.expected();a['results'][3].update(status='FAIL',reason='INTEGRITY')
        self.answer(a);self.assertEqual(self.grade()['status'],'FAIL')
    def test_modified_input_fails_even_correct_answer(self):
        self.answer();(self.root/'desk/reports/sample-1.json').write_text('{}')
        self.assertTrue(self.grade()['integrityErrors'])
    def test_extra_script_fails(self):
        self.answer();(self.root/'desk/run.py').write_text('pass')
        self.assertEqual(self.grade()['status'],'FAIL')
    def test_missing_answer_fails(self):
        self.assertEqual(self.grade()['status'],'FAIL')
    def test_no_overwrite(self):
        self.answer();self.grade()
        with self.assertRaises(FileExistsError): self.grade()
    def test_attestation_explicit(self):
        self.answer();p=self.root/'operator/session.json';s=json.loads(p.read_text())
        s.update(cleanSession=True,toolReadWriteObserved=True,onlyLocalModelObserved=True,
                 scopeRespected=True,interventions=0,clineVersion='test',ollamaVersion='test',modelDigest='test')
        p.write_text(json.dumps(s));self.assertEqual(self.grade()['status'],'PASS_OPERATOR_ATTESTED')
    def test_expected_not_in_desk(self):
        self.assertEqual({p.relative_to(self.root/'desk').as_posix() for p in (self.root/'desk').rglob('*') if p.is_file()},set(probe.files()))

if __name__=='__main__': unittest.main()
