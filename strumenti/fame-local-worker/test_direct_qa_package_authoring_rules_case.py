import unittest
import direct_qa_worker as w


class PackageAuthoringRulesDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("package-authoring-rules-review-v1")

    def answer(self):
        return {"results": [
            {"code": "SEMANTIC_UNIT_RULE", "supported": True, "evidenceIds": ["U01"]},
            {"code": "FROZEN_RUN_RULE", "supported": True, "evidenceIds": ["U02"]},
            {"code": "PRE_RUN_AUTHORING_DISCIPLINE", "supported": True, "evidenceIds": ["U03"]},
            {"code": "MINIMAL_SUFFICIENT_EVIDENCE", "supported": True, "evidenceIds": ["U04"]},
            {"code": "CONSUMED_TASK_CAN_BE_RETUNED_AND_RERUN", "supported": False, "evidenceIds": []},
        ]}

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_minimal_evidence_requires_minimal_rule_block(self):
        answer = self.answer()
        answer["results"][3]["evidenceIds"] = ["U03"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("MINIMAL_SUFFICIENT_EVIDENCE:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_consumed_rerun_negative_control(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "CONSUMED_TASK_CAN_BE_RETUNED_AND_RERUN",
            "supported": True,
            "evidenceIds": ["U02"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("CONSUMED_TASK_CAN_BE_RETUNED_AND_RERUN:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":
    unittest.main()
