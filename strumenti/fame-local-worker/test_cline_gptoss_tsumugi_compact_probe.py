import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import cline_gptoss_tsumugi_compact_probe as probe
import cline_gptoss_tsumugi_qa_probe as base
import qa_worker as qa


class TsumugiCompactProbeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'probe'
        with contextlib.redirect_stdout(io.StringIO()):
            probe.init(self.root)

    def ids(self, *lines):
        text = qa.case_text()
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

    def test_compact_desk_has_no_evidence_json(self):
        names = {p.relative_to(self.root / 'desk').as_posix()
                 for p in (self.root / 'desk').rglob('*') if p.is_file()}
        self.assertIn('report-numbered.md', names)
        self.assertNotIn('evidence.json', names)
        self.assertNotIn('report.md', names)

    def test_numbered_report_contains_stable_ids(self):
        content = (self.root / 'desk/report-numbered.md').read_text(encoding='utf-8')
        self.assertIn('E001 |', content)
        pair_confidence_id = self.ids(89)[0]
        self.assertIn(f'{pair_confidence_id} |', content)

    def test_valid_artifact_passes_without_attestation(self):
        self.write_answer()
        result = self.run_grade()
        self.assertEqual(result['status'], 'ARTIFACT_PASS_SESSION_UNVERIFIED')
        self.assertTrue(result['artifactCorrect'])
        self.assertTrue(result['diagnosticOnly'])

    def test_semantic_failure_is_still_detected(self):
        answer = self.valid_answer()
        answer['results'][0]['evidenceIds'] = self.ids(57)
        self.write_answer(answer)
        self.assertIn('RECORD_0_INSUFFICIENT_EVIDENCE', self.run_grade()['answerErrors'])

    def test_integrity_failure_is_detected(self):
        self.write_answer()
        (self.root / 'desk/report-numbered.md').write_text('altered', encoding='utf-8')
        self.assertEqual(self.run_grade()['status'], 'FAIL')

    def test_same_semantic_grader_as_full_probe(self):
        valid = self.valid_answer()
        compact_ok, compact_errors, compact_assessments = base.assess_answer(valid)
        self.assertTrue(compact_ok)
        self.assertEqual(compact_errors, [])
        self.write_answer(valid)
        result = self.run_grade()
        self.assertEqual(result['assessments'], compact_assessments)

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
