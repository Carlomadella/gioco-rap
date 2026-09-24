import json
import unittest

import direct_qa_worker_v3 as w


TASK='review-boundary-repair-v3'


def expected():
    return {'results':[
        {'code':'HOST_OWNS_ACTION_POLICY','supported':True,'evidenceIds':['U03']},
        {'code':'VALIDATED_NOT_EXECUTION_AUTH','supported':True,'evidenceIds':['U03']},
        {'code':'RETRY_ASSISTED_NOT_SPONTANEOUS','supported':True,'evidenceIds':['U04']},
        {'code':'V6_SALVAGE_IF_COVERAGE_COMPLETE','supported':True,'evidenceIds':['U08']},
        {'code':'V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING','supported':False,'evidenceIds':[]},
        {'code':'MODEL_HAS_REPO_SHELL','supported':False,'evidenceIds':[]},
        {'code':'SINGLE_REPORT_PROVES_NETWORK_READY','supported':False,'evidenceIds':[]},
    ]}


class RepairDiagnosticV3Tests(unittest.TestCase):
    def test_expected_answer_is_accepted(self):
        p=w.package(TASK)
        result=w.assess(expected(),p)
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_known_v2_semantic_error_is_rejected(self):
        answer=json.loads(json.dumps(expected()))
        answer['results'][4]={
            'code':'V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING',
            'supported':True,
            'evidenceIds':['U08'],
        }
        result=w.assess(answer,w.package(TASK))
        self.assertFalse(result['accepted'])
        self.assertEqual(
            result['errors'],
            ['V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING:INCORRECT_CONCLUSION'],
        )

    def test_payload_exposes_no_host_rubric_or_targets(self):
        payload=json.dumps(w.payload(w.package(TASK)),ensure_ascii=False)
        self.assertNotIn('requiredGroups',payload)
        self.assertNotIn('benignContext',payload)
        self.assertNotIn('"rubric"',payload)


if __name__=='__main__':unittest.main()
