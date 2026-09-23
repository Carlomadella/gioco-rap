import unittest
import direct_qa_worker as w


class TsumugiControlledDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("tsumugi-controlled-review-v1")

    def answer(self):
        return {"results": [
            {"code": "GATE_WITH_PARTIAL_CAPABILITY", "supported": True, "evidenceIds": ["U05", "U06"]},
            {"code": "TIMBRE_HYPOTHESIS_LIMIT", "supported": True, "evidenceIds": ["U06"]},
            {"code": "TOPK_PAIR_CONFIDENCE_LIMIT", "supported": True, "evidenceIds": ["U08", "U09"]},
            {"code": "SYNTHETIC_DIAGNOSTIC_SCOPE", "supported": True, "evidenceIds": ["U09"]},
            {"code": "REAL_EASY_ALREADY_OPEN", "supported": False, "evidenceIds": []},
        ]}

    def test_package_has_no_heading_only_units(self):
        for unit in self.p["units"]:
            text = unit["text"].strip()
            self.assertFalse(text.startswith("#") and "\n" not in text)

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_pair_confidence_needs_topk_and_restricted_conclusion(self):
        answer = self.answer()
        answer["results"][2]["evidenceIds"] = ["U08"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("TOPK_PAIR_CONFIDENCE_LIMIT:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_real_easy_false_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "REAL_EASY_ALREADY_OPEN",
            "supported": True,
            "evidenceIds": ["U07"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("REAL_EASY_ALREADY_OPEN:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":
    unittest.main()
