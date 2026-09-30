import unittest
import direct_qa_worker as w


class P2MeasurementExportDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("p2-measurement-export-review-v1")

    def answer(self):
        return {"results": [
            {"code": "CONSUMED_COHORT_SCOPE", "supported": True, "evidenceIds": ["U01"]},
            {"code": "P2_JSON_MIDI_AUDIT", "supported": True, "evidenceIds": ["U03"]},
            {"code": "V1_RENDERER_DURATION_BEHAVIOR", "supported": True, "evidenceIds": ["U04"]},
            {"code": "P2_CAUSAL_LIMITS", "supported": True, "evidenceIds": ["U05"]},
            {"code": "P2_AUTHORIZES_TRAINING_OR_BATCH131", "supported": False, "evidenceIds": []},
        ]}

    def test_package_has_no_heading_only_units(self):
        for unit in self.p["units"]:
            text = unit["text"].strip()
            self.assertFalse(text.startswith("#") and "\n" not in text)

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_causal_limits_require_interpretation_block(self):
        answer = self.answer()
        answer["results"][3]["evidenceIds"] = ["U03"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("P2_CAUSAL_LIMITS:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_negative_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "P2_AUTHORIZES_TRAINING_OR_BATCH131",
            "supported": True,
            "evidenceIds": ["U06"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("P2_AUTHORIZES_TRAINING_OR_BATCH131:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":
    unittest.main()
