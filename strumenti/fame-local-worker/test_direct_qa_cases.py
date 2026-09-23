import unittest
import direct_qa_worker as w


class DirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("subset-bic-review-v1")

    def answer(self):
        return {"results": [
            {"code": "GATE_AND_D06_PATTERN", "supported": True, "evidenceIds": ["U04", "U07"]},
            {"code": "BOTTLENECK_AND_STOP", "supported": True, "evidenceIds": ["U10", "U12"]},
            {"code": "TSUMUGI_PREFLIGHT_SCOPE", "supported": True, "evidenceIds": ["U12"]},
            {"code": "TRAINING_OPEN", "supported": False, "evidenceIds": []},
            {"code": "MT3_FIRST_CHOICE_CLEARED", "supported": False, "evidenceIds": []},
        ]}

    def test_subset_bic_package_and_target_pass(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_subset_bic_gate_requires_outcome_and_d06_evidence(self):
        answer = self.answer()
        answer["results"][0]["evidenceIds"] = ["U07"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("GATE_AND_D06_PATTERN:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_subset_bic_safety_claims_cannot_flip_true(self):
        for index, evidence in ((3, ["U12"]), (4, ["U15"])):
            answer = self.answer()
            answer["results"][index]["supported"] = True
            answer["results"][index]["evidenceIds"] = evidence
            result = w.assess(answer, self.p)
            self.assertFalse(result["accepted"])
            self.assertIn(answer["results"][index]["code"] + ":INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":
    unittest.main()
