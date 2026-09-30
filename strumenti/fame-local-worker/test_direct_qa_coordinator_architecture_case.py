import unittest
import direct_qa_worker as w


class CoordinatorArchitectureDirectQaCaseTests(unittest.TestCase):
    def setUp(self):
        self.p = w.package("coordinator-architecture-review-v1")

    def answer(self):
        return {"results": [
            {"code": "COORDINATOR_SCOPE", "supported": True, "evidenceIds": ["U01"]},
            {"code": "DESK_ISOLATION_AND_HOST_CONTROL", "supported": True, "evidenceIds": ["U02"]},
            {"code": "DISTINCT_PROTOCOL_LIMIT", "supported": True, "evidenceIds": ["U03"]},
            {"code": "GLOBAL_STATE_SEMANTICS", "supported": True, "evidenceIds": ["U05"]},
            {"code": "COORDINATOR_AUTHORIZES_FAME_MODS_OR_TRAINING", "supported": False, "evidenceIds": []},
        ]}

    def test_source_reconstructs_and_target_answer_passes(self):
        result = w.assess(self.answer(), self.p)
        self.assertTrue(result["accepted"])
        self.assertEqual(len(result["assessments"]), 5)

    def test_state_semantics_requires_state_block(self):
        answer = self.answer()
        answer["results"][3]["evidenceIds"] = ["U03"]
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("GLOBAL_STATE_SEMANTICS:INSUFFICIENT_EVIDENCE", result["errors"])

    def test_negative_control_cannot_flip_true(self):
        answer = self.answer()
        answer["results"][4] = {
            "code": "COORDINATOR_AUTHORIZES_FAME_MODS_OR_TRAINING",
            "supported": True,
            "evidenceIds": ["U07"],
        }
        result = w.assess(answer, self.p)
        self.assertFalse(result["accepted"])
        self.assertIn("COORDINATOR_AUTHORIZES_FAME_MODS_OR_TRAINING:INCORRECT_CONCLUSION", result["errors"])


if __name__ == "__main__":
    unittest.main()
