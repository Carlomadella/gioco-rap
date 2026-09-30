import unittest
import direct_qa_worker as w


class TsumugiV1ArchitectureFailureDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("tsumugi-v1-architecture-failure-review-v1")

    def answer(self):
        return {"results": [
            {"code": "CONTROLLED_FAILURE_BEFORE_PUBLISH", "supported": True, "evidenceIds": ["U02"]},
            {"code": "V1_V2_OUTPUT_MISMATCH", "supported": True, "evidenceIds": ["U03"]},
            {"code": "UNVERIFIED_ARCH_ASSUMPTION", "supported": True, "evidenceIds": ["U03", "U04"]},
            {"code": "V1_REPLACEMENT_SCOPE", "supported": True, "evidenceIds": ["U05"]},
            {"code": "FAILURE_AUTHORIZES_MUSICAL_EXECUTION", "supported": False, "evidenceIds": []},
        ]}

    def test_package_has_no_heading_only_units(self):
        for unit in self.p["units"]:
            text = unit["text"].strip()
            self.assertFalse(text.startswith("#") and "\n" not in text)

    def test_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_arch_assumption_needs_architecture_and_interpretation(self):
        answer = self.answer()
        answer["results"][2]["evidenceIds"] = ["U04"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("UNVERIFIED_ARCH_ASSUMPTION:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_negative_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "FAILURE_AUTHORIZES_MUSICAL_EXECUTION",
            "supported": True,
            "evidenceIds": ["U05"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("FAILURE_AUTHORIZES_MUSICAL_EXECUTION:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":unittest.main()
