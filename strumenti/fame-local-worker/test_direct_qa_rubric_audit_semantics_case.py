import unittest
import direct_qa_worker as w


class RubricAuditSemanticsDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("rubric-audit-semantics-review-v1")

    def answer(self):
        return {"results": [
            {"code": "SEMANTIC_FAIL_LABEL_LIMIT", "supported": True, "evidenceIds": ["U01"]},
            {"code": "CONTEXTUAL_VS_DIRECT_EVIDENCE", "supported": True, "evidenceIds": ["U01"]},
            {"code": "SIDECAR_PRESERVES_HISTORY", "supported": True, "evidenceIds": ["U03"]},
            {"code": "NEXT_PROTOCOL_DISCIPLINE", "supported": True, "evidenceIds": ["U05"]},
            {"code": "AUDIT_PROMOTES_NETWORK_OR_INDEPENDENT_EVAL", "supported": False, "evidenceIds": []},
        ]}

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_sidecar_history_requires_separation_block(self):
        answer = self.answer()
        answer["results"][2]["evidenceIds"] = ["U01"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("SIDECAR_PRESERVES_HISTORY:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_negative_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "AUDIT_PROMOTES_NETWORK_OR_INDEPENDENT_EVAL",
            "supported": True,
            "evidenceIds": ["U03"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("AUDIT_PROMOTES_NETWORK_OR_INDEPENDENT_EVAL:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":
    unittest.main()
