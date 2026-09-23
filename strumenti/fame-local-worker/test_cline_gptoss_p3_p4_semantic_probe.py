import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import cline_gptoss_p3_p4_semantic_probe as probe


class P3P4SemanticProbeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'probe'
        with contextlib.redirect_stdout(io.StringIO()):
            probe.init(self.root)

    def valid_answer(self):
        return {'results': [
            {'code': 'D02_FAILURE_LAYER', 'supported': True, 'evidenceIds': ['U003']},
            {'code': 'SIMULTANEOUS_ROLE_LIMIT', 'supported': True, 'evidenceIds': ['U003']},
            {'code': 'SYNTHETIC_THRESHOLD_TUNING_AUTHORIZED', 'supported': False, 'evidenceIds': []},
            {'code': 'P5_FIRST_VARIANT_SCOPE', 'supported': True, 'evidenceIds': ['U010', 'U012']},
        ]}

    def write_answer(self, value=None):
        (self.root / 'desk/answer.json').write_text(
            json.dumps(value or self.valid_answer()), encoding='utf-8')

    def run_grade(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return probe.grade(self.root)

    def test_semantic_units_are_complete_blocks(self):
        units = {u['evidenceId']: u['text'] for u in probe.semantic_units(probe.case_text())}
        self.assertEqual(len(units), 12)
        self.assertIn('Fixture drums:', units['U003'])
        self.assertIn('D02 snare isolato', units['U003'])
        self.assertIn('D05 kick+hi-hat simultanei', units['U003'])
        self.assertIn('highRatio >= 0.28 OR centroid >= 3500 Hz', units['U007'])
        self.assertIn('non autorizza a ricavare nuove soglie', units['U007'])

    def test_decision_unit_keeps_complete_gate_block(self):
        units = {u['evidenceId']: u['text'] for u in probe.semantic_units(probe.case_text())}
        self.assertIn('1. Non modificare il low-end.', units['U010'])
        self.assertIn('10. P6 resta obbligatorio', units['U010'])

    def test_valid_artifact_passes_without_attestation(self):
        self.write_answer()
        result = self.run_grade()
        self.assertEqual(result['status'], 'ARTIFACT_PASS_SESSION_UNVERIFIED')
        self.assertTrue(result['artifactCorrect'])

    def test_composite_p5_scope_needs_both_complete_units(self):
        answer = self.valid_answer()
        answer['results'][3]['evidenceIds'] = ['U010']
        self.write_answer(answer)
        result = self.run_grade()
        self.assertIn('RECORD_3_INSUFFICIENT_EVIDENCE', result['answerErrors'])

    def test_false_threshold_authorization_is_required(self):
        answer = self.valid_answer()
        answer['results'][2] = {
            'code': 'SYNTHETIC_THRESHOLD_TUNING_AUTHORIZED',
            'supported': True,
            'evidenceIds': ['U007'],
        }
        self.write_answer(answer)
        result = self.run_grade()
        self.assertIn('RECORD_2_INCORRECT_CONCLUSION', result['answerErrors'])

    def test_benign_context_is_warning_not_failure(self):
        answer = self.valid_answer()
        answer['results'][0]['evidenceIds'] = ['U003', 'U005']
        self.write_answer(answer)
        result = self.run_grade()
        self.assertNotEqual(result['status'], 'FAIL')
        self.assertEqual(result['assessments'][0]['precisionWarnings'], ['U005'])

    def test_unreviewed_unit_fails_precision_check(self):
        answer = self.valid_answer()
        answer['results'][0]['evidenceIds'] = ['U003', 'U008']
        self.write_answer(answer)
        result = self.run_grade()
        self.assertIn('RECORD_0_UNREVIEWED_EVIDENCE', result['answerErrors'])

    def test_changed_report_units_fails_integrity(self):
        self.write_answer()
        path = self.root / 'desk/report-units.md'
        path.write_text(path.read_text(encoding='utf-8') + '\nchanged', encoding='utf-8')
        self.assertEqual(self.run_grade()['status'], 'FAIL')

    def test_attestation_is_explicit(self):
        self.write_answer()
        path = self.root / 'operator/session.json'
        session = json.loads(path.read_text(encoding='utf-8'))
        session.update(
            cleanSession=True,
            toolReadWriteObserved=True,
            onlyLocalModelObserved=True,
            scopeRespected=True,
            interventions=0,
            clineVersion='test',
            ollamaVersion='test',
            modelDigest='test',
        )
        path.write_text(json.dumps(session), encoding='utf-8')
        self.assertEqual(self.run_grade()['status'], 'PASS_OPERATOR_ATTESTED')

    def test_grade_is_one_shot(self):
        self.write_answer()
        self.run_grade()
        with self.assertRaises(FileExistsError):
            self.run_grade()


if __name__ == '__main__':
    unittest.main()
