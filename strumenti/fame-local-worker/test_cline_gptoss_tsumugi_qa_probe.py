import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import cline_gptoss_tsumugi_qa_probe as probe
import qa_worker as qa


class TsumugiQaProbeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'probe'
        with contextlib.redirect_stdout(io.StringIO()):
            probe.init(self.root)

    def ids(self, *lines):
        text, _ = probe.text_and_tasks()
        by_line = {row['line']: row['evidenceId'] for row in qa.evidence_records(text)}
        return [by_line[line] for line in lines]

    def valid_answer(self):
        return {'results': [
            {'code': 'MISSING_EVENTS', 'supported': True, 'evidenceIds': self.ids(57, 58)},
            {'code': 'TIMBRE_HYPOTHESIS', 'supported': True, 'evidenceIds': self.ids(61)},
            {'code': 'ONSET_TOLERANCE_CAUSE', 'supported': False, 'evidenceIds': []},
            {'code': 'PAIR_CONFIDENCE_UNKNOWN', 'supported': True, 'evidenceIds': self.ids(89)},
        ]}

    def write_answer(self, value=None):
        (self.root / 'desk/answer.json').write_text(
            json.dumps(value or self.valid_answer()), encoding='utf-8')

    def run_grade(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return probe.grade(self.root)

    def test_real_qa_artifact_passes_without_session_attestation(self):
        self.write_answer()
        result = self.run_grade()
        self.assertEqual(result['status'], 'ARTIFACT_PASS_SESSION_UNVERIFIED')
        self.assertTrue(result['artifactCorrect'])

    def test_missing_one_compound_component_fails(self):
        answer = self.valid_answer()
        answer['results'][0]['evidenceIds'] = self.ids(57)
        self.write_answer(answer)
        self.assertIn('RECORD_0_INSUFFICIENT_EVIDENCE', self.run_grade()['answerErrors'])

    def test_wrong_negative_conclusion_fails(self):
        answer = self.valid_answer()
        answer['results'][2].update(supported=True, evidenceIds=self.ids(38))
        self.write_answer(answer)
        self.assertIn('RECORD_2_INCORRECT_CONCLUSION', self.run_grade()['answerErrors'])

    def test_surplus_evidence_fails_precision_gate(self):
        answer = self.valid_answer()
        answer['results'][1]['evidenceIds'] += self.ids(38)
        self.write_answer(answer)
        self.assertIn('RECORD_1_SURPLUS_EVIDENCE', self.run_grade()['answerErrors'])

    def test_wrong_order_fails_contract(self):
        answer = self.valid_answer()
        answer['results'][0], answer['results'][1] = answer['results'][1], answer['results'][0]
        self.write_answer(answer)
        self.assertIn('RECORD_0_CONTRACT', self.run_grade()['answerErrors'])

    def test_modified_report_fails_integrity(self):
        self.write_answer()
        (self.root / 'desk/report.md').write_text('altered', encoding='utf-8')
        self.assertTrue(self.run_grade()['integrityErrors'])

    def test_extra_file_fails_integrity(self):
        self.write_answer()
        (self.root / 'desk/run.py').write_text('pass', encoding='utf-8')
        self.assertEqual(self.run_grade()['status'], 'FAIL')

    def test_expected_answer_not_exposed_in_desk(self):
        names = {p.relative_to(self.root / 'desk').as_posix()
                 for p in (self.root / 'desk').rglob('*') if p.is_file()}
        self.assertNotIn('expected.json', names)
        self.assertNotIn('evaluation.json', names)

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
