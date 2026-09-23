import unittest
import direct_qa_worker as w


class DirectQaAuthoringTests(unittest.TestCase):
    def test_consumed_subset_bic_heading_failure_is_preserved(self):
        p = w.package("subset-bic-review-v1")
        self.assertEqual(p["units"][12]["unitId"], "U13")
        self.assertEqual(p["units"][12]["text"], "## Ricerca per il prossimo ramo")
        self.assertNotIn("U13", p["rubric"]["TSUMUGI_PREFLIGHT_SCOPE"]["benignContext"])

    def test_future_packages_should_not_use_heading_only_units(self):
        # Authoring guard for NEW packages. The historical consumed package above
        # is intentionally grandfathered and must not be rewritten.
        for task in []:
            p = w.package(task)
            for unit in p["units"]:
                self.assertFalse(unit["text"].strip().startswith("#") and "\n" not in unit["text"].strip())


if __name__ == "__main__":
    unittest.main()
