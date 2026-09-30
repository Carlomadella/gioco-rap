import unittest

import fame_four_role_network_v4 as network


class AdaptiveTransferPilotCaseTests(unittest.TestCase):
    def test_case_loads_and_keeps_host_rubric_private(self):
        p=network.package('adaptive-transfer-protocol-pilot-v1')
        self.assertEqual(p['expectedAnswerOptionId'],'ANSWER_DISCIPLINED_TRANSFER_PASS')
        self.assertEqual(
            p['requiredFinalEvidenceGroups'],
            [['U01'],['U02'],['U03'],['U04'],['U05'],['U06'],['U07']]
        )
        self.assertEqual(p['optionalContext'],[])
        public=network.public_case(p)
        self.assertNotIn('expectedAnswerOptionId',public)
        self.assertNotIn('requiredFinalEvidenceGroups',public)
        self.assertFalse(p['executionAuthorized'])
        self.assertFalse(p['trainingAuthorized'])
        self.assertFalse(p['networkProductionReady'])


if __name__=='__main__':
    unittest.main()
