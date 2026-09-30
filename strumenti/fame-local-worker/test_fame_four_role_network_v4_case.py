import unittest
import fame_four_role_network_v4 as n


class V4RealCaseTests(unittest.TestCase):
    def test_runtime_result_case_loads_and_is_host_bounded(self):
        p=n.package('runtime-contract-result-network-v4')
        self.assertEqual(p['expectedAnswerOptionId'],'ANSWER_NO')
        self.assertEqual(p['requiredFinalEvidenceGroups'],[['U01'],['U02'],['U03']])
        self.assertEqual(p['optionalContext'],['U04'])
        public=n.public_case(p)
        self.assertNotIn('expectedAnswerOptionId',public)
        self.assertNotIn('requiredFinalEvidenceGroups',public)
        self.assertFalse(p['executionAuthorized'])
        self.assertFalse(p['trainingAuthorized'])
        self.assertFalse(p['networkProductionReady'])


if __name__=='__main__':
    unittest.main()
