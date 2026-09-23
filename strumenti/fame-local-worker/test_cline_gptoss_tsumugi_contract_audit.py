import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import cline_gptoss_tsumugi_contract_audit as probe


class TsumugiContractAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "probe"
        with contextlib.redirect_stdout(io.StringIO()):
            probe.init(self.root)

    def valid(self):
        return {"results": [
            {"code": "NOTE_BIAS_RUNTIME_BINDING", "status": "ENFORCED"},
            {"code": "PAIR_GATE_THRESHOLD_RUNTIME_BINDING", "status": "NOT_ENFORCED"},
            {"code": "PAIR_TOPK_RUNTIME_BINDING", "status": "NOT_ENFORCED"},
            {"code": "FIXTURE_SET_RUNTIME_BINDING", "status": "NOT_ENFORCED"},
        ]}

    def write(self, value=None):
        (self.root / "desk/audit.json").write_text(
            json.dumps(value or self.valid()), encoding="utf-8")

    def grade(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return probe.grade(self.root)

    def test_snapshots_exist(self):
        for name in probe.FILES:
            self.assertTrue((self.root / "desk/source" / name).is_file())

    def test_valid_artifact_passes_unverified(self):
        self.write()
        result = self.grade()
        self.assertEqual(result["status"], "ARTIFACT_PASS_SESSION_UNVERIFIED")
        self.assertTrue(result["artifactCorrect"])

    def test_wrong_threshold_fails(self):
        answer = self.valid()
        answer["results"][1]["status"] = "ENFORCED"
        self.write(answer)
        self.assertIn("RECORD_1_INCORRECT", self.grade()["answerErrors"])

    def test_wrong_topk_fails(self):
        answer = self.valid()
        answer["results"][2]["status"] = "ENFORCED"
        self.write(answer)
        self.assertIn("RECORD_2_INCORRECT", self.grade()["answerErrors"])

    def test_wrong_fixture_binding_fails(self):
        answer = self.valid()
        answer["results"][3]["status"] = "ENFORCED"
        self.write(answer)
        self.assertIn("RECORD_3_INCORRECT", self.grade()["answerErrors"])

    def test_changed_source_fails_integrity(self):
        self.write()
        path = self.root / "desk/source/score-diagnostic.py"
        path.write_text(path.read_text(encoding="utf-8") + "\n# changed\n", encoding="utf-8")
        self.assertEqual(self.grade()["status"], "FAIL")

    def test_extra_file_fails_integrity(self):
        self.write()
        (self.root / "desk/extra.txt").write_text("x", encoding="utf-8")
        self.assertEqual(self.grade()["status"], "FAIL")

    def test_attestation_requires_explicit_fields(self):
        self.write()
        path = self.root / "operator/session.json"
        session = json.loads(path.read_text(encoding="utf-8"))
        session.update(
            cleanSession=True,
            toolReadWriteObserved=True,
            onlyLocalModelObserved=True,
            scopeRespected=True,
            interventions=0,
            clineVersion="test",
            ollamaVersion="test",
            modelDigest="test",
        )
        path.write_text(json.dumps(session), encoding="utf-8")
        self.assertEqual(self.grade()["status"], "PASS_OPERATOR_ATTESTED")

    def test_grade_is_one_shot(self):
        self.write()
        self.grade()
        with self.assertRaises(FileExistsError):
            self.grade()


if __name__ == "__main__":
    unittest.main()
