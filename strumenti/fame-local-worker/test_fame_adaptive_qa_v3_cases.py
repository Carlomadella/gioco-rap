import unittest

import fame_four_role_network_v9 as network


class AdaptiveQaV3CasePackagesTests(unittest.TestCase):
    def test_second_fresh_controlled_failure_case_loads(self):
        p=network.package('adaptive-v3-controlled-failure-pilot-v1')
        self.assertEqual(
            p['expectedAnswerOptionId'],
            'ANSWER_REAL_SEMANTIC_AND_COVERAGE_FAILURE'
        )
        self.assertEqual(
            p['requiredFinalEvidenceGroups'],
            [['U01'],['U02'],['U03'],['U04'],['U06'],['U07']]
        )
        self.assertEqual(p['optionalContext'],['U05'])
        self.assertFalse(p['executionAuthorized'])
        self.assertFalse(p['trainingAuthorized'])
        self.assertFalse(p['networkProductionReady'])
        self.assertFalse(p['independentEvaluation'])


if __name__=='__main__':
    unittest.main()
