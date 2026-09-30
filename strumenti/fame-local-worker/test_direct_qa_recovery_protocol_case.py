import unittest
import direct_qa_worker as w


class RecoveryProtocolDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("recovery-protocol-review-v1")

    def answer(self):
        return {"results": [
            {"code": "RECOVERY_PRESERVES_FIRST_PASS", "supported": True, "evidenceIds": ["U04"]},
            {"code": "RECOVERY_BOUNDED_TWO_SUBTASKS", "supported": True, "evidenceIds": ["U02"]},
            {"code": "NO_AUTOMATIC_RETRY_OR_RECREATION", "supported": True, "evidenceIds": ["U03"]},
            {"code": "RECOVERY_STATUS_SEMANTICS", "supported": True, "evidenceIds": ["U04"]},
            {"code": "RECOVERY_PROVES_GENERALIZATION_OR_AUTHORIZES_TRAINING", "supported": False, "evidenceIds": []},
        ]}

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_first_pass_invariance_accepts_minimal_u04(self):
        result = w.assess(self.answer(), self.p)
        row = next(x for x in result["assessments"] if x["code"] == "RECOVERY_PRESERVES_FIRST_PASS")
        self.assertTrue(row["conclusionCorrect"])
        self.assertEqual(row["coverage"], "SUFFICIENT")

    def test_retry_rule_requires_execution_block(self):
        answer = self.answer()
        answer["results"][2]["evidenceIds"] = ["U02"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("NO_AUTOMATIC_RETRY_OR_RECREATION:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_negative_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "RECOVERY_PROVES_GENERALIZATION_OR_AUTHORIZES_TRAINING",
            "supported": True,
            "evidenceIds": ["U05"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn(
            "RECOVERY_PROVES_GENERALIZATION_OR_AUTHORIZES_TRAINING:INCORRECT_CONCLUSION",
            result["errors"],
        )


if __name__ == "__main__":
    unittest.main()
