#!/usr/bin/env python3
"""Regression tests for R1-hardened metadata-only one-shot holdout gate."""
import importlib.util
import json
import subprocess
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


def record(i, split=None, family=None):
    n = str(i).zfill(6)
    sha = f"{i:064x}"[-64:]
    item = {
        "sourceRecordId": f"FAME{n}",
        "sourceAssetId": f"sha256:{sha}",
        "compositionFamilyId": family or f"family-{n}",
        "sha256": sha,
        "localPath": f"DO_NOT_OPEN/{sha}/source.wav",
        "presentInScan": True,
    }
    if split is not None:
        item["split"] = split
    return item


def protocol():
    return {
        "schema": gate.PROTOCOL_SCHEMA,
        "version": 1,
        "status": "FROZEN_PRE_TUNING",
        "splits": {
            "development": {"name": gate.DEVELOPMENT_SPLIT, "expectedFamilies": 8},
            "evaluationHoldout": {
                "name": gate.LEGACY_HOLDOUT_SPLIT,
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
    legacy = [record(i + 101, gate.LEGACY_HOLDOUT_SPLIT) for i in range(10)]
    remediated = [record(i + 201, "evaluation-holdout-r1-v2") for i in range(10)]
    return {
        "schema": gate.MANIFEST_SCHEMA,
        "version": 1,
        "records": dev + legacy + remediated,
    }


def reference(m=None):
    m = m or manifest()
    selected = [
        r for r in m["records"]
        if r.get("split") == "evaluation-holdout-r1-v2"
    ]
    identities = gate.sorted_identities(selected)
    return {
        "schema": gate.REFERENCE_SCHEMA,
        "version": gate.REFERENCE_VERSION,
        "cohortId": gate.REFERENCE_COHORT_ID,
        "status": gate.REFERENCE_STATUS,
        "expectedFamilies": 10,
        "plannedSplit": "evaluation-holdout-r1-v2",
        "legacyOriginalHoldout": {
            "auditVerdict": "PARTIAL",
            "policy": "PROVENANCE_INSUFFICIENT_DO_NOT_USE_AS_FINAL_HOLDOUT",
            "reusedInNewCohort": False,
        },
        "selection": {
            "usesAudioContentOrDerivedMetrics": False,
        },
        "repo": {
            # validate_holdout_reference's Git ancestry check is isolated below by
            # patching the function in setUp; unit tests focus metadata behavior.
            "commitAtFreeze": "0" * 40,
        },
        "cohortDigestSha256": gate.cohort_digest_from_identities(identities),
        "records": identities,
        "safety": {
            "holdoutAudioAccessPerformed": False,
            "holdoutObserved": False,
            "reservationCreated": False,
        },
    }


class HoldoutGateTests(unittest.TestCase):
    def setUp(self):
        self._verify_reference_freeze_commit = gate.verify_reference_freeze_commit
        gate.verify_reference_freeze_commit = lambda _reference: None

    def tearDown(self):
        gate.verify_reference_freeze_commit = self._verify_reference_freeze_commit

    def test_reference_lineage_uses_reference_introduction_commit(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            subprocess.check_call(["git", "init", "-q"], cwd=repo)
            subprocess.check_call(["git", "config", "user.email", "r1-test@example.invalid"], cwd=repo)
            subprocess.check_call(["git", "config", "user.name", "R1 Test"], cwd=repo)

            (repo / "base.txt").write_text("base\n", encoding="utf-8")
            subprocess.check_call(["git", "add", "base.txt"], cwd=repo)
            subprocess.check_call(["git", "commit", "-q", "-m", "base"], cwd=repo)
            base = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=repo, text=True
            ).strip()

            subprocess.check_call(["git", "checkout", "-q", "-b", "selection-source"], cwd=repo)
            (repo / "source.txt").write_text("selection source\n", encoding="utf-8")
            subprocess.check_call(["git", "add", "source.txt"], cwd=repo)
            subprocess.check_call(["git", "commit", "-q", "-m", "selection source"], cwd=repo)
            source_commit = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=repo, text=True
            ).strip()

            subprocess.check_call(["git", "checkout", "-q", "-b", "evaluation-branch", base], cwd=repo)
            reference_path = repo / "audio-analysis-holdout-cohort-r1-v2.json"
            reference_path.write_text("{}\n", encoding="utf-8")
            subprocess.check_call(
                ["git", "add", "audio-analysis-holdout-cohort-r1-v2.json"], cwd=repo
            )
            subprocess.check_call(["git", "commit", "-q", "-m", "freeze reference"], cwd=repo)

            old_here = gate.HERE
            old_reference = gate.HOLDOUT_REFERENCE_FILE
            try:
                gate.HERE = repo
                gate.HOLDOUT_REFERENCE_FILE = reference_path
                self._verify_reference_freeze_commit(
                    {"repo": {"commitAtFreeze": source_commit}}
                )

                reference_path.write_text('{"tampered":true}\n', encoding="utf-8")
                subprocess.check_call(
                    ["git", "add", "audio-analysis-holdout-cohort-r1-v2.json"], cwd=repo
                )
                subprocess.check_call(["git", "commit", "-q", "-m", "tamper reference"], cwd=repo)
                with self.assertRaisesRegex(RuntimeError, "immutable after introduction"):
                    self._verify_reference_freeze_commit(
                        {"repo": {"commitAtFreeze": source_commit}}
                    )
            finally:
                gate.HERE = old_here
                gate.HOLDOUT_REFERENCE_FILE = old_reference

    def test_selects_exact_frozen_remediated_cohort_without_audio(self):
        m = manifest()
        selected = gate.select_holdout_records(m, protocol(), reference(m))
        self.assertEqual(len(selected), 10)
        self.assertTrue(all(r["split"] == "evaluation-holdout-r1-v2" for r in selected))
        for item in selected:
            self.assertFalse(Path(item["localPath"]).exists())

    def test_rejects_wrong_family_count(self):
        m = manifest()
        m["records"] = m["records"][:-1]
        ref = reference(manifest())
        with self.assertRaisesRegex(RuntimeError, "family count mismatch"):
            gate.select_holdout_records(m, protocol(), ref)

    def test_rejects_cross_split_family(self):
        m = manifest()
        new_holdout = next(r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2")
        new_holdout["compositionFamilyId"] = m["records"][0]["compositionFamilyId"]
        with self.assertRaisesRegex(RuntimeError, "crosses splits"):
            gate.select_holdout_records(m, protocol(), reference(manifest()))

    def test_rejects_multiple_records_in_same_holdout_family(self):
        m = manifest()
        selected = [r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2"]
        duplicate = dict(selected[0])
        duplicate["sourceRecordId"] = "FAME999999"
        duplicate["sha256"] = "f" * 64
        duplicate["sourceAssetId"] = "sha256:" + duplicate["sha256"]
        duplicate["localPath"] = "DO_NOT_OPEN/duplicate/source.wav"
        m["records"].append(duplicate)
        with self.assertRaisesRegex(RuntimeError, "exactly one source record"):
            gate.select_holdout_records(m, protocol(), reference(manifest()))

    def test_rejects_renamed_family_even_if_asset_is_same(self):
        m = manifest()
        selected = [r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2"]
        selected[0]["compositionFamilyId"] = "renamed-family"
        with self.assertRaisesRegex(RuntimeError, "do not exactly match"):
            gate.select_holdout_records(m, protocol(), reference(manifest()))

    def test_rejects_replaced_asset_inside_same_family(self):
        m = manifest()
        selected = [r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2"]
        selected[0]["sha256"] = "e" * 64
        selected[0]["sourceAssetId"] = "sha256:" + selected[0]["sha256"]
        with self.assertRaisesRegex(RuntimeError, "do not exactly match"):
            gate.select_holdout_records(m, protocol(), reference(manifest()))

    def test_rejects_duplicate_sha_or_asset_across_splits(self):
        m = manifest()
        selected = [r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2"]
        m["records"][0]["sha256"] = selected[0]["sha256"]
        m["records"][0]["sourceAssetId"] = selected[0]["sourceAssetId"]
        with self.assertRaisesRegex(RuntimeError, "Duplicate manifest"):
            gate.select_holdout_records(m, protocol(), reference(manifest()))

    def test_rejects_duplicate_source_record_id_across_splits(self):
        m = manifest()
        selected = [r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2"]
        m["records"][0]["sourceRecordId"] = selected[0]["sourceRecordId"]
        with self.assertRaisesRegex(RuntimeError, "Duplicate manifest sourceRecordId"):
            gate.select_holdout_records(m, protocol(), reference(manifest()))

    def test_rejects_altered_cohort_with_same_count(self):
        original = manifest()
        m = manifest()
        selected = [r for r in m["records"] if r.get("split") == "evaluation-holdout-r1-v2"]
        legacy = [r for r in m["records"] if r.get("split") == gate.LEGACY_HOLDOUT_SPLIT]
        selected[0].pop("split")
        legacy[0]["split"] = "evaluation-holdout-r1-v2"
        with self.assertRaisesRegex(RuntimeError, "do not exactly match"):
            gate.select_holdout_records(m, protocol(), reference(original))

    def test_rejects_tampered_reference_digest(self):
        ref = reference()
        ref["cohortDigestSha256"] = "a" * 64
        with self.assertRaisesRegex(RuntimeError, "cohort digest mismatch"):
            gate.validate_holdout_reference(ref, protocol())

    def test_prior_usage_blocks_sha_overlap_even_if_family_changes(self):
        m = manifest()
        ref = reference(m)
        selected = gate.select_holdout_records(m, protocol(), ref)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            usage = root / "runs" / "evaluation-holdout-usage"
            usage.mkdir(parents=True)
            identity = gate.identity_from_record(selected[0])
            (usage / "old.json").write_text(
                json.dumps({
                    "status": "RESERVED_BEFORE_AUDIO_ACCESS",
                    "records": [{
                        "compositionFamilyId": "different-family",
                        "sourceRecordId": "FAME888888",
                        "sourceAssetId": identity["sourceAssetId"],
                        "sha256": identity["sha256"],
                    }],
                }),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(RuntimeError, "overlap"):
                gate.assert_no_prior_holdout_usage(root, selected, ref)

    def test_reservation_requires_reference_and_binds_full_identity(self):
        m = manifest()
        ref = reference(m)
        selected = gate.select_holdout_records(m, protocol(), ref)
        config_hash = "a" * 64
        protocol_hash = "b" * 64
        reference_hash = "c" * 64
        fake_freeze = {
            "freezeDigestSha256": "d" * 64,
            "candidateId": gate.EXPECTED_CANDIDATE,
            "configHash": config_hash,
            "protocolDigestSha256": protocol_hash,
        }

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            with self.assertRaisesRegex(RuntimeError, "requires frozen cohort reference"):
                gate.freeze_gate.reserve_holdout(root, fake_freeze, selected)

            reservation = gate.freeze_gate.reserve_holdout(
                root,
                fake_freeze,
                selected,
                ref,
                config_hash=config_hash,
                protocol_digest_sha256=protocol_hash,
                cohort_reference_digest_sha256=reference_hash,
            )
            payload = json.loads(Path(reservation).read_text(encoding="utf-8"))
            self.assertEqual(payload["status"], "RESERVED_BEFORE_AUDIO_ACCESS")
            self.assertEqual(payload["cohortId"], ref["cohortId"])
            self.assertEqual(payload["cohortDigestSha256"], ref["cohortDigestSha256"])
            self.assertEqual(payload["cohortReferenceDigestSha256"], reference_hash)
            self.assertEqual(payload["configHash"], config_hash)
            self.assertEqual(payload["protocolDigestSha256"], protocol_hash)
            self.assertEqual(len(payload["records"]), 10)
            self.assertEqual(len(payload["sourceRecordIds"]), 10)
            self.assertEqual(len(payload["sourceAssetIds"]), 10)
            self.assertEqual(len(payload["sha256s"]), 10)

            with self.assertRaisesRegex(RuntimeError, "already reserved/observed"):
                gate.freeze_gate.reserve_holdout(
                    root,
                    fake_freeze,
                    selected,
                    ref,
                    config_hash=config_hash,
                    protocol_digest_sha256=protocol_hash,
                    cohort_reference_digest_sha256=reference_hash,
                )


if __name__ == "__main__":
    unittest.main()
