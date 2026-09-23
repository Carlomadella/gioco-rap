import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_queue_v2 as q
import direct_qa_worker_v2 as w


COORD='coordinator-architecture-v2'
AUTHORING='package-authoring-v2'


def coordinator_good():
    return {'results':[
        {'code':'NETWORK_SCOPE','supported':True,'evidenceIds':['U01','U02']},
        {'code':'NO_MAJORITY_OR_AUTO_REASSIGN','supported':True,'evidenceIds':['U02']},
        {'code':'GLOBAL_VALIDATION_GATE','supported':True,'evidenceIds':['U05']},
        {'code':'PARALLEL_MODEL_COPIES','supported':False,'evidenceIds':[]},
        {'code':'AUTONOMOUS_PROJECT_MODIFICATION','supported':False,'evidenceIds':[]},
    ]}


def authoring_good():
    return {'results':[
        {'code':'SEMANTIC_UNIT_RULE','supported':True,'evidenceIds':['U01']},
        {'code':'RERUN_CONSUMED_TASK','supported':False,'evidenceIds':[]},
        {'code':'FREEZE_BEFORE_MODEL_CALL','supported':True,'evidenceIds':['U03']},
        {'code':'NEGATIVE_CHECK_EVIDENCE_REQUIRED','supported':False,'evidenceIds':[]},
        {'code':'PACKAGE_TEST_REQUIREMENTS','supported':True,'evidenceIds':['U03']},
    ]}


class MultiDeskV2PackageTests(unittest.TestCase):
    def test_coordinator_package_loads(self):
        p=w.package(COORD)
        self.assertEqual(p['taskId'],COORD)
        self.assertEqual(len(p['units']),7)
        self.assertEqual(len(p['checks']),5)

    def test_authoring_package_loads(self):
        p=w.package(AUTHORING)
        self.assertEqual(p['taskId'],AUTHORING)
        self.assertEqual(len(p['units']),3)
        self.assertEqual(len(p['checks']),5)

    def test_coordinator_expected_answer_is_accepted(self):
        result=w.assess(coordinator_good(),w.package(COORD))
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_authoring_expected_answer_is_accepted(self):
        result=w.assess(authoring_good(),w.package(AUTHORING))
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_coordinator_scope_needs_architecture_and_execution_evidence(self):
        answer=json.loads(json.dumps(coordinator_good()))
        answer['results'][0]['evidenceIds']=['U01']
        result=w.assess(answer,w.package(COORD))
        self.assertFalse(result['accepted'])
        self.assertIn('NETWORK_SCOPE:INSUFFICIENT_EVIDENCE',result['errors'])

    def test_authoring_consumed_task_cannot_be_promoted_to_rerunnable(self):
        answer=json.loads(json.dumps(authoring_good()))
        answer['results'][1]={'code':'RERUN_CONSUMED_TASK','supported':True,'evidenceIds':['U02']}
        result=w.assess(answer,w.package(AUTHORING))
        self.assertFalse(result['accepted'])
        self.assertIn('RERUN_CONSUMED_TASK:INCORRECT_CONCLUSION',result['errors'])

    def test_payloads_do_not_expose_host_rubrics(self):
        for task in (COORD,AUTHORING):
            request=json.dumps(w.payload(w.package(task)),ensure_ascii=False)
            self.assertNotIn('requiredGroups',request)
            self.assertNotIn('benignContext',request)
            self.assertNotIn('"rubric"',request)

    def test_two_desk_queue_initializes_pending_without_model_calls(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q'
            q.init(root,[COORD,AUTHORING])
            state=q.state(root)
            self.assertEqual(state['status'],'PENDING')
            self.assertEqual(
                [(r['taskId'],r['status'],r['modelCalls']) for r in state['results']],
                [(COORD,'NOT_RUN',0),(AUTHORING,'NOT_RUN',0)]
            )


if __name__=='__main__':
    unittest.main()
