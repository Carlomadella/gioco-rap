import unittest
import direct_qa_worker as w


class TsumugiScoreDiagnosticDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("tsumugi-score-diagnostic-review-v1")

    def answer(self):
        return {"results": [
            {"code": "RAW_PITCH_RECONSTRUCTION", "supported": True, "evidenceIds": ["U02", "U03"]},
            {"code": "SCORE_HEAD_FAILURE_LOCALIZED", "supported": True, "evidenceIds": ["U04", "U06"]},
            {"code": "NO_SYNTHETIC_DECODER_TUNING", "supported": True, "evidenceIds": ["U07"]},
            {"code": "REAL_EASY_COHORT_SCOPE", "supported": True, "evidenceIds": ["U08"]},
            {"code": "FRESH_EVALUATION_OR_PROMOTION_AUTHORIZED", "supported": False, "evidenceIds": []},
        ]}

    def test_package_has_no_heading_only_units(self):
        for unit in self.p["units"]:
            text = unit["text"].strip()
            self.assertFalse(text.startswith("#") and "\n" not in text)

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_raw_pitch_reconstruction_needs_method_and_counts(self):
        answer = self.answer()
        answer["results"][0]["evidenceIds"] = ["U03"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("RAW_PITCH_RECONSTRUCTION:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_score_head_localization_needs_misses_and_interpretation(self):
        answer = self.answer()
        answer["results"][1]["evidenceIds"] = ["U04"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("SCORE_HEAD_FAILURE_LOCALIZED:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_negative_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "FRESH_EVALUATION_OR_PROMOTION_AUTHORIZED",
            "supported": True,
            "evidenceIds": ["U09"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("FRESH_EVALUATION_OR_PROMOTION_AUTHORIZED:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":unittest.main()
