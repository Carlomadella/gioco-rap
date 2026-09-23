import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import cline_gptoss_tsumugi_contract_compact_diagnostic as probe


class TsumugiContractCompactDiagnosticTests(unittest.TestCase):
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

    def test_only_one_source_payload_file(self):
        desk = self.root / "desk"
        self.assertTrue((desk / "source-audit.md").is_file())
        self.assertFalse((desk / "source").exists())

    def test_combined_source_contains_all_four_files_once(self):
        text = (self.root / "desk/source-audit.md").read_text(encoding="utf-8")
        for name in probe.base.FILES:
            self.assertEqual(text.count(f"===== BEGIN FILE: {name} ====="), 1)
            self.assertEqual(text.count(f"===== END FILE: {name} ====="), 1)

    def test_combined_source_contains_complete_runner_tail(self):
        text = (self.root / "desk/source-audit.md").read_text(encoding="utf-8")
        self.assertIn('if __name__ == "__main__":', text)
        self.assertIn("FAME NEURAL TSUMUGI SCORE DIAGNOSTIC FAILED", text)

    def test_protocol_marks_diagnostic_repeat(self):
        protocol = json.loads((self.root / "operator/protocol.json").read_text(encoding="utf-8"))
        self.assertTrue(protocol["diagnosticOnly"])
        self.assertTrue(protocol["sameSemanticChecksAsPriorRun"])
        self.assertEqual(protocol["priorFailureClass"], "TOOL_LAYER_FAILURE_BEFORE_ARTIFACT")

    def test_valid_artifact_passes_unverified(self):
        self.write()
        result = self.grade()
        self.assertEqual(result["status"], "ARTIFACT_PASS_SESSION_UNVERIFIED")
        self.assertTrue(result["artifactCorrect"])
        self.assertTrue(result["diagnosticOnly"])

    def test_wrong_semantic_answer_fails(self):
        value = self.valid()
        value["results"][1]["status"] = "ENFORCED"
        self.write(value)
        result = self.grade()
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("RECORD_1_INCORRECT", result["answerErrors"])

    def test_changed_consolidated_source_fails_integrity(self):
        self.write()
        path = self.root / "desk/source-audit.md"
        path.write_text(path.read_text(encoding="utf-8") + "\nchanged\n", encoding="utf-8")
        self.assertEqual(self.grade()["status"], "FAIL")

    def test_attestation_is_explicit(self):
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
