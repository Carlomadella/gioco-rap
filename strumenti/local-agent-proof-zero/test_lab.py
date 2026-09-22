import contextlib
import io
import tempfile
import unittest
from pathlib import Path
import lab


class ProofZeroTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'experiment'
        self.quiet(lab.init, self.root)

    def quiet(self, fn, *args):
        with contextlib.redirect_stdout(io.StringIO()):
            return fn(*args)

    def prepare(self, phase):
        self.quiet(lab.prepare, self.root, phase)
        return self.root / 'desks' / phase

    def grade(self, phase, interventions=0, clean=True):
        return self.quiet(lab.grade, self.root, phase, interventions, clean, 12.0)

    def teach(self):
        desk = self.prepare('teach')
        (desk / 'memory' / 'procedure.md').write_text(lab.TEACH, encoding='utf-8')
        self.quiet(lab.freeze, self.root)
        return desk

    def test_no_overwrite(self):
        with self.assertRaises(FileExistsError):
            lab.init(self.root)
        self.prepare('baseline')
        with self.assertRaises(FileExistsError):
            lab.prepare(self.root, 'baseline')

    def test_baseline_requires_missing_rule(self):
        desk = self.prepare('baseline')
        lab.dump(desk / 'answer.json', {'procedure_status': 'NEED_RULE', 'results': []})
        self.assertTrue(self.grade('baseline')['pass'])
        lab.dump(desk / 'answer.json', lab.expected(lab.records('baseline')))
        self.assertFalse(self.grade('baseline')['pass'])

    def test_transfer_exact_and_corruption(self):
        self.teach()
        for phase in ('transfer-1', 'transfer-2', 'transfer-3'):
            desk = self.prepare(phase)
            lab.dump(desk / 'answer.json', lab.expected(lab.records(phase)))
            self.assertTrue(self.grade(phase)['pass'])
        answer = lab.read(desk / 'answer.json')
        answer['results'][2]['route'] = 'ETA'
        lab.dump(desk / 'answer.json', answer)
        self.assertFalse(self.grade('transfer-3')['pass'])

    def test_reference_boundaries(self):
        result = lab.expected(lab.records('transfer-2'))['results']
        self.assertEqual([x['route'] for x in result], ['ETA', 'HOLD', 'HOLD', 'OUTSIDE', 'ETA'])
        self.assertEqual(result[0]['ticket'], 'ETA:501:7')
        self.assertEqual(lab.expected(lab.records('transfer-1'))['results'][0]['route'], 'ZETA')

    def test_input_and_memory_tampering(self):
        self.teach()
        desk = self.prepare('transfer-1')
        lab.dump(desk / 'answer.json', lab.expected(lab.records('transfer-1')))
        lab.dump(desk / 'input.json', [])
        (desk / 'memory' / 'procedure.md').write_text('changed', encoding='utf-8')
        result = self.grade('transfer-1')
        self.assertFalse(result['pass'])
        self.assertEqual(len(result['integrityErrors']), 2)

    def test_teach_requires_memory(self):
        desk = self.prepare('teach')
        lab.dump(desk / 'answer.json', lab.expected(lab.records('teach')))
        self.assertFalse(self.grade('teach')['pass'])

    def test_control_has_same_inputs_no_memory(self):
        self.teach()
        first = self.prepare('transfer-1')
        second = self.prepare('without-memory')
        self.assertEqual((first / 'input.json').read_bytes(), (second / 'input.json').read_bytes())
        self.assertFalse((second / 'memory' / 'procedure.md').exists())

    def test_intervention_or_old_session_not_pass(self):
        desk = self.prepare('baseline')
        lab.dump(desk / 'answer.json', {'procedure_status': 'NEED_RULE', 'results': []})
        self.assertFalse(self.grade('baseline', interventions=1)['pass'])
        self.assertFalse(self.grade('baseline', clean=False)['pass'])

    def test_missing_malformed_and_extra_files(self):
        desk = self.prepare('baseline')
        self.assertFalse(self.grade('baseline')['pass'])
        (desk / 'answer.json').write_text('{', encoding='utf-8')
        self.assertFalse(self.grade('baseline')['pass'])
        lab.dump(desk / 'answer.json', {'procedure_status': 'NEED_RULE', 'results': []})
        (desk / 'unexpected.py').write_text('pass', encoding='utf-8')
        self.assertFalse(self.grade('baseline')['pass'])

    def test_transfer_requires_intact_frozen_memory(self):
        with self.assertRaises(FileNotFoundError):
            self.prepare('transfer-1')
        self.teach()
        (self.root / 'operator' / 'frozen-memory.md').write_text('changed', encoding='utf-8')
        with self.assertRaises(ValueError):
            self.prepare('transfer-1')


if __name__ == '__main__':
    unittest.main()
