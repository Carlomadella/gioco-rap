import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import cline_gptoss_real_qa_probe as probe


class RealQaProbeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'probe'
        with contextlib.redirect_stdout(io.StringIO()):
            probe.init(self.root)

    def evidence_ids(self, *lines):
        qa, text = probe.engine_and_text()
        by_line = {row['line']: row['evidenceId'] for row in qa.evidence_records(text)}
        return [by_line[line] for line in lines]

    def valid_answer(self):
        return {'results': [
            {'code': 'DRUMS_FAIL', 'supported': True, 'evidenceIds': self.evidence_ids(262)},
            {'code': 'LOWEND_CAUSES_UNPROVEN', 'supported': True, 'evidenceIds': self.evidence_ids(217, 235)},
            {'code': 'BATCH_AUTHORIZED', 'supported': False, 'evidenceIds': []},
            {'code': 'RENDERER_LIMITS', 'supported': True, 'evidenceIds': self.evidence_ids(245, 250)},
        ]}

    def write_answer(self, value=None):
        (self.root / 'desk/answer.json').write_text(json.dumps(value or self.valid_answer()), encoding='utf-8')

    def run_grade(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return probe.grade(self.root)

    def test_direct_real_qa_artifact_passes_without_session_attestation(self):
        self.write_answer()
        result = self.run_grade()
        self.assertEqual(result['status'], 'ARTIFACT_PASS_SESSION_UNVERIFIED')
        self.assertTrue(result['artifactCorrect'])

    def test_contextual_lowend_bundle_is_accepted(self):
        answer = self.valid_answer()
        answer['results'][1]['evidenceIds'] = self.evidence_ids(217, 230, 232, 233)
        self.write_answer(answer)
        self.assertTrue(self.run_grade()['artifactCorrect'])

    def test_incomplete_lowend_evidence_fails(self):
        answer = self.valid_answer()
        answer['results'][1]['evidenceIds'] = self.evidence_ids(217)
        self.write_answer(answer)
        self.assertEqual(self.run_grade()['status'], 'FAIL')

    def test_wrong_negative_conclusion_fails(self):
        answer = self.valid_answer()
        answer['results'][2].update(supported=True, evidenceIds=self.evidence_ids(100))
        self.write_answer(answer)
        self.assertEqual(self.run_grade()['status'], 'FAIL')

    def test_surplus_evidence_fails_precision_gate(self):
        answer = self.valid_answer()
        answer['results'][0]['evidenceIds'] += self.evidence_ids(43)
        self.write_answer(answer)
        result = self.run_grade()
        self.assertIn('RECORD_0_SURPLUS_EVIDENCE', result['answerErrors'])

    def test_modified_report_fails_integrity(self):
        self.write_answer()
        (self.root / 'desk/report.md').write_text('altered', encoding='utf-8')
        self.assertTrue(self.run_grade()['integrityErrors'])

    def test_extra_file_fails_integrity(self):
        self.write_answer()
        (self.root / 'desk/run.py').write_text('pass', encoding='utf-8')
        self.assertEqual(self.run_grade()['status'], 'FAIL')

    def test_expected_answer_not_exposed_in_desk(self):
        names = {p.relative_to(self.root / 'desk').as_posix() for p in (self.root / 'desk').rglob('*') if p.is_file()}
        self.assertNotIn('expected.json', names)
        self.assertNotIn('evaluation.json', names)

    def test_attestation_is_explicit(self):
        self.write_answer()
        path = self.root / 'operator/session.json'
        session = json.loads(path.read_text(encoding='utf-8'))
        session.update(cleanSession=True, toolReadWriteObserved=True, onlyLocalModelObserved=True,
                       scopeRespected=True, interventions=0, clineVersion='test',
                       ollamaVersion='test', modelDigest='test')
        path.write_text(json.dumps(session), encoding='utf-8')
        self.assertEqual(self.run_grade()['status'], 'PASS_OPERATOR_ATTESTED')

    def test_grade_is_one_shot(self):
        self.write_answer()
        self.run_grade()
        with self.assertRaises(FileExistsError):
            self.run_grade()


if __name__ == '__main__':
    unittest.main()
