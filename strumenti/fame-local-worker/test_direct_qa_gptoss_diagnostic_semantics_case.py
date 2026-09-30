import unittest
import direct_qa_worker as w


class GptossDiagnosticSemanticsDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("gptoss-diagnostic-semantics-review-v1")

    def answer(self):
        return {"results": [
            {"code": "LOW_THINKING_IS_SINGLE_VARIATION", "supported": True, "evidenceIds": ["U01"]},
            {"code": "OUTPUT_TRUNCATED_NOT_SEMANTIC", "supported": True, "evidenceIds": ["U03"]},
            {"code": "SEMANTIC_FAIL_REQUIRES_FINAL_JSON", "supported": True, "evidenceIds": ["U03"]},
            {"code": "ERROR_IS_OPERATIONAL_NOT_MODEL_INCAPACITY", "supported": True, "evidenceIds": ["U03"]},
            {"code": "TRUNCATION_PROVES_MODEL_SEMANTIC_FAILURE", "supported": False, "evidenceIds": []},
        ]}

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_truncation_requires_interpretation_block(self):
        answer = self.answer()
        answer["results"][1]["evidenceIds"] = ["U01"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("OUTPUT_TRUNCATED_NOT_SEMANTIC:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_semantic_failure_negative_control(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "TRUNCATION_PROVES_MODEL_SEMANTIC_FAILURE",
            "supported": True,
            "evidenceIds": ["U03"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn(
            "TRUNCATION_PROVES_MODEL_SEMANTIC_FAILURE:INCORRECT_CONCLUSION",
            result["errors"],
        )


if __name__ == "__main__":
    unittest.main()
