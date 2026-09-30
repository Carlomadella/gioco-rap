import unittest
import direct_qa_worker as w


class QaTransferProtocolDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("qa-transfer-protocol-review-v1")

    def answer(self):
        return {"results": [
            {"code": "TRANSFER_NOT_BLIND_OR_GENERAL_LEARNING_TEST", "supported": True, "evidenceIds": ["U02"]},
            {"code": "TRANSFER_PASS_STRICTER_THAN_VALIDATED", "supported": True, "evidenceIds": ["U03"]},
            {"code": "SURPLUS_EVIDENCE_SALVAGE_LIMIT", "supported": True, "evidenceIds": ["U03"]},
            {"code": "HUMAN_REVIEW_COST_NOT_ASSUMED", "supported": True, "evidenceIds": ["U03"]},
            {"code": "RUBRIC_DEFECT_CAN_BE_RETROACTIVELY_PROMOTED", "supported": False, "evidenceIds": []},
        ]}

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_transfer_pass_requires_criteria_block(self):
        answer = self.answer()
        answer["results"][1]["evidenceIds"] = ["U02"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("TRANSFER_PASS_STRICTER_THAN_VALIDATED:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_rubric_defect_negative_control(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "RUBRIC_DEFECT_CAN_BE_RETROACTIVELY_PROMOTED",
            "supported": True,
            "evidenceIds": ["U05"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn(
            "RUBRIC_DEFECT_CAN_BE_RETROACTIVELY_PROMOTED:INCORRECT_CONCLUSION",
            result["errors"],
        )


if __name__ == "__main__":
    unittest.main()
