import contextlib
import io
import tempfile
import unittest
from pathlib import Path
import lab


class V2Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'run'
        self.call(lab.init, self.root)
        self.log = Path(self.tmp.name) / 'operator-log.md'
        self.log.write_text('Synthetic test evidence, not a real Cline run.')

    def call(self, fn, *args, **kwargs):
        with contextlib.redirect_stdout(io.StringIO()):
            return fn(*args, **kwargs)

    def prepare(self, phase, trial=1):
        self.call(lab.prepare, self.root, phase, trial)
        return self.root / 'desks' / lab.desk_name(phase, trial)

    def grade(self, phase, trial=1, **kwargs):
        options = dict(log_path=self.log, behavior='pass', memory_read='yes')
        options.update(kwargs)
        return self.call(lab.grade, self.root, phase, 0, True, None, trial, **options)

    def teach(self):
        d = self.prepare('teach')
        (d / 'memory/procedure.md').write_text(lab.TEACH)
        lab.dump(d / 'answer.json', lab.expected(lab.records('teach')))
        self.call(lab.freeze, self.root)
        return d

    def test_wrapper_does_not_hide_semantics(self):
        target = lab.expected(lab.records('transfer-3'))
        scores = lab.score_answer(target['results'], target)
        self.assertFalse(scores['outputContract'])
        self.assertTrue(scores['semanticExact'])
        self.assertEqual(scores['semanticCorrectRecords'], 5)

    def test_logic_error_with_valid_wrapper(self):
        target = lab.expected(lab.records('transfer-2'))
        answer = lab.expected(lab.records('transfer-2'))
        answer['results'][0].update(route='RHO', ticket='RHO:174:7')
        scores = lab.score_answer(answer, target)
        self.assertTrue(scores['outputContract'])
        self.assertEqual(scores['semanticCorrectRecords'], 4)
        self.assertEqual(scores['wrongRecordIds'], ['EDGE-174'])

    def test_oracle_boundaries(self):
        self.assertEqual([r['route'] for r in lab.expected(lab.records('transfer-2'))['results']],
                         ['ETA', 'HOLD', 'HOLD', 'OUTSIDE', 'ETA'])
        self.assertEqual([r['route'] for r in lab.expected(lab.records('transfer-3'))['results']],
                         ['HOLD', 'HOLD', 'ZETA', 'RHO', 'OUTSIDE'])

    def test_repetitions_and_missing_memory_are_identical(self):
        self.teach()
        a = self.prepare('transfer-1', 1)
        b = self.prepare('transfer-1', 2)
        c = self.prepare('without-memory', 1)
        d = self.prepare('baseline', 1)
        for other in (b, c, d):
            self.assertEqual((a/'input.json').read_bytes(), (other/'input.json').read_bytes())
        self.assertFalse((c/'memory/procedure.md').exists())
        self.assertEqual((a/'memory/procedure.md').read_bytes(), (b/'memory/procedure.md').read_bytes())

    def test_fail_closed_without_behavior_review(self):
        d = self.prepare('baseline')
        lab.dump(d/'answer.json', dict(procedure_status='NEED_RULE', results=[]))
        result = self.grade('baseline', behavior='unknown')
        self.assertTrue(result['automatedPass'])
        self.assertFalse(result['pass'])
        self.assertFalse(self.grade('baseline', behavior='fail')['pass'])
        self.assertFalse(self.grade('baseline', log_path=None)['pass'])
        self.assertTrue(self.grade('baseline')['pass'])

    def test_transfer_requires_reported_read(self):
        self.teach()
        d = self.prepare('transfer-1')
        lab.dump(d/'answer.json', lab.expected(lab.records('transfer-1')))
        self.assertFalse(self.grade('transfer-1', memory_read='unknown')['pass'])
        self.assertTrue(self.grade('transfer-1')['pass'])

    def test_tamper_and_no_overwrite(self):
        self.teach()
        d = self.prepare('transfer-1')
        with self.assertRaises(FileExistsError):
            self.prepare('transfer-1')
        lab.dump(d/'answer.json', lab.expected(lab.records('transfer-1')))
        (d/'memory/procedure.md').write_text('changed')
        self.assertFalse(self.grade('transfer-1')['pass'])
        (self.root/'operator/frozen-memory.md').write_text('changed')
        with self.assertRaises(ValueError):
            self.prepare('transfer-2')

    def test_summary_preserves_first_failure(self):
        d = self.prepare('baseline')
        lab.dump(d/'answer.json', [])
        self.grade('baseline')
        lab.dump(d/'answer.json', dict(procedure_status='NEED_RULE', results=[]))
        self.grade('baseline')
        result = self.call(lab.summary, self.root)
        self.assertFalse(result['runs'][0]['pass'])
        self.assertFalse(result['pass'])
        self.assertEqual(len(result['missing']), 15)

    def test_complete_synthetic_run(self):
        self.teach()
        self.grade('teach')
        for p in lab.PHASES:
            if p == 'teach':
                continue
            for t in (1, 2, 3):
                d = self.prepare(p, t)
                target = dict(procedure_status='NEED_RULE', results=[]) if p in ('baseline', 'without-memory') else lab.expected(lab.records(p))
                lab.dump(d/'answer.json', target)
                self.assertTrue(self.grade(p, t)['pass'])
        self.assertTrue(self.call(lab.summary, self.root)['pass'])

    def test_bad_shapes_and_malformed_json(self):
        target = lab.expected(lab.records('transfer-1'))
        for value in (None, 0, {}, {'procedure_status': 'APPLIED', 'results': [None]}, {'procedure_status': [], 'results': []}):
            self.assertFalse(lab.score_answer(value, target)['outputContract'])
        d = self.prepare('baseline')
        (d/'answer.json').write_text('{')
        self.assertFalse(self.grade('baseline')['pass'])


if __name__ == '__main__':
    unittest.main()
