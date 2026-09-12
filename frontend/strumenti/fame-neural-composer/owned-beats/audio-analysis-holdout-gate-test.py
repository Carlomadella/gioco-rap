#!/usr/bin/env python3
"""Regression tests for the metadata-only one-shot holdout gate."""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent

spec = importlib.util.spec_from_file_location(
    "fame_audio_analysis_holdout_gate",
    HERE / "audio-analysis-holdout-gate.py",
)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def record(i, split, family=None):
    n = str(i).zfill(6)
    sha = str(i % 10) * 64
    return {
        "sourceRecordId": f"FAME{n}",
        "sourceAssetId": f"sha256:{sha}",
        "compositionFamilyId": family or f"family-{n}",
        "sha256": sha,
        "localPath": f"DO_NOT_OPEN/{sha}/source.wav",
        "presentInScan": True,
        "split": split,
    }


def protocol():
    return {
        "schema": gate.PROTOCOL_SCHEMA,
        "version": 1,
        "status": "FROZEN_PRE_TUNING",
        "splits": {
            "development": {"name": gate.DEVELOPMENT_SPLIT, "expectedFamilies": 8},
            "evaluationHoldout": {
                "name": gate.HOLDOUT_SPLIT,
                "expectedFamilies": 10,
                "allowedDuringTuning": False,
                "requiresFrozenCandidate": True,
                "maxFinalEvaluationRuns": 1,
                "retuningAfterViewingResults": "REQUIRES_NEW_UNTOUCHED_HOLDOUT",
            },
            "crossSplitFamilyOverlapAllowed": False,
        },
        "decision": {
            "developmentRule": {"holdoutMayOpenOnlyFor": "V2_WINS"},
            "holdoutRule": {"retuneAfterViewingHoldoutAllowed": False},
        },
    }


def manifest():
    dev = [record(i + 1, gate.DEVELOPMENT_SPLIT) for i in range(8)]
    holdout = [record(i + 101, gate.HOLDOUT_SPLIT) for i in range(10)]
    return {
        "schema": gate.MANIFEST_SCHEMA,
        "version": 1,
        "records": dev + holdout,
    }


class HoldoutGateTests(unittest.TestCase):
    def test_selects_exactly_ten_holdout_families_without_audio(self):
        selected = gate.select_holdout_records(manifest(), protocol())
        self.assertEqual(len(selected), 10)
        self.assertTrue(all(r["split"] == gate.HOLDOUT_SPLIT for r in selected))
        for item in selected:
            self.assertFalse(Path(item["localPath"]).exists())

    def test_rejects_wrong_family_count(self):
        m = manifest()
        m["records"] = m["records"][:-1]
        with self.assertRaisesRegex(RuntimeError, "family count mismatch"):
            gate.select_holdout_records(m, protocol())

    def test_rejects_cross_split_family(self):
        m = manifest()
        m["records"][8]["compositionFamilyId"] = m["records"][0]["compositionFamilyId"]
        with self.assertRaisesRegex(RuntimeError, "crosses splits"):
            gate.select_holdout_records(m, protocol())

    def test_rejects_multiple_records_in_same_holdout_family(self):
        m = manifest()
        duplicate = dict(m["records"][8])
        duplicate["sourceRecordId"] = "FAME999999"
        duplicate["sha256"] = "9" * 64
        duplicate["localPath"] = "DO_NOT_OPEN/duplicate/source.wav"
        m["records"].append(duplicate)
        with self.assertRaisesRegex(RuntimeError, "exactly one source record"):
            gate.select_holdout_records(m, protocol())

    def test_prior_usage_blocks_any_overlap(self):
        selected = gate.select_holdout_records(manifest(), protocol())
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            usage = root / "runs" / "evaluation-holdout-usage"
            usage.mkdir(parents=True)
            (usage / "old.json").write_text(
                json.dumps({
                    "status": "RESERVED_BEFORE_AUDIO_ACCESS",
                    "families": [selected[0]["compositionFamilyId"]],
                    "candidateId": "another-candidate",
                }),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(RuntimeError, "already reserved/observed"):
                gate.assert_no_prior_holdout_usage(root, selected)

    def test_reservation_is_one_shot_and_does_not_touch_audio(self):
        selected = gate.select_holdout_records(manifest(), protocol())
        fake_freeze = {
            "freezeDigestSha256": "a" * 64,
            "candidateId": gate.EXPECTED_CANDIDATE,
        }
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            reservation = gate.freeze_gate.reserve_holdout(root, fake_freeze, selected)
            reservation_path = Path(reservation)
            self.assertTrue(reservation_path.is_file())
            payload = json.loads(reservation_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["status"], "RESERVED_BEFORE_AUDIO_ACCESS")
            self.assertEqual(len(payload["families"]), 10)
            self.assertTrue(all(not Path(r["localPath"]).exists() for r in selected))
            with self.assertRaisesRegex(RuntimeError, "already reserved/observed"):
                gate.freeze_gate.reserve_holdout(root, fake_freeze, selected)


if __name__ == "__main__":
    unittest.main()
