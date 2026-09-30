import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import fame_adaptive_qa as front


class AdaptiveFrontDoorTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.state=Path(self.temp.name)/'state'
        self.env=mock.patch.dict(os.environ,{'FAME_ADAPTIVE_STATE_DIR':str(self.state)})
        self.env.start()
        self.addCleanup(self.env.stop)

    def test_committed_registry_contains_measured_adaptive_cases(self):
        consumed=front.committed_consumed()
        self.assertIn('adaptive-v2-tsumugi-architecture-pilot-v1',consumed)
        self.assertIn('adaptive-v3-first-attempt-pass-pilot-v1',consumed)
        self.assertIn('adaptive-v3-controlled-failure-pilot-v1',consumed)

    def test_init_blocks_committed_consumed_case_before_delegate(self):
        root=Path(self.temp.name)/'new-root'
        with mock.patch.object(front.v3,'init') as delegate:
            with self.assertRaisesRegex(ValueError,'Case adaptive gia consumato'):
                front.init(root,'adaptive-v3-first-attempt-pass-pilot-v1')
            delegate.assert_not_called()
        self.assertFalse(root.exists())

    def test_init_allows_fresh_case_and_delegates_to_v3(self):
        root=Path(self.temp.name)/'fresh-root'
        with mock.patch.object(front.v3,'init') as delegate:
            front.init(root,'future-fresh-case-v1')
            delegate.assert_called_once_with(root.resolve(),'future-fresh-case-v1')

    def test_model_response_marks_local_case_consumed(self):
        root=Path(self.temp.name)/'run-root'
        (root/'single-agent'/'attempt-1').mkdir(parents=True)
        (root/'adaptive.json').write_text(
            json.dumps({'caseId':'future-fresh-case-v1'}),encoding='utf-8'
        )
        (root/'single-agent'/'attempt-1'/'response.json').write_text('{}',encoding='utf-8')
        case_id=front.record_consumed_from_root(root)
        self.assertEqual(case_id,'future-fresh-case-v1')
        self.assertIn('future-fresh-case-v1',front.local_consumed())

    def test_local_consumption_blocks_new_root_but_not_existing_run(self):
        front.mark_local('future-fresh-case-v1')
        new_root=Path(self.temp.name)/'new-root'
        with mock.patch.object(front.v3,'init') as delegate:
            with self.assertRaisesRegex(ValueError,'Case adaptive gia consumato'):
                front.init(new_root,'future-fresh-case-v1')
            delegate.assert_not_called()

        existing=Path(self.temp.name)/'existing'
        existing.mkdir()
        fake={'status':'PROPOSED_FOR_HUMAN_REVIEW','modelCalls':1}
        with mock.patch.object(front.v3,'run',return_value=fake) as delegate,              mock.patch.object(front,'record_consumed_from_root',return_value='future-fresh-case-v1'):
            self.assertEqual(front.run(existing),fake)
            delegate.assert_called_once_with(existing.resolve())

    def test_no_response_does_not_consume_case(self):
        root=Path(self.temp.name)/'empty-root'
        root.mkdir()
        (root/'adaptive.json').write_text(
            json.dumps({'caseId':'future-empty-case-v1'}),encoding='utf-8'
        )
        self.assertIsNone(front.record_consumed_from_root(root))
        self.assertNotIn('future-empty-case-v1',front.local_consumed())

    def test_local_ledger_is_idempotent_and_sorted(self):
        front.mark_local('z-case')
        front.mark_local('a-case')
        front.mark_local('z-case')
        data=json.loads((self.state/'adaptive-consumed-v1.json').read_text(encoding='utf-8'))
        self.assertEqual(data['schema'],front.LOCAL_SCHEMA)
        self.assertEqual(data['caseIds'],['a-case','z-case'])


if __name__=='__main__':
    unittest.main()
