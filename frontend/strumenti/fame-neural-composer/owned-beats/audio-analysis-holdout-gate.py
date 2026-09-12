#!/usr/bin/env python3
"""FAME Neural — metadata-only gate for the one-shot Audio Analysis holdout.

`preflight` validates authority, frozen candidate identity, manifest split integrity and
prior holdout usage without opening, hashing, probing or decoding any holdout audio.

`reserve` is intentionally separate and irreversible: it records the selected holdout
family set before any future audio access. This command must not be used during tooling
development or dry runs.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-analysis-v2-protocol.json"
CONFIG_FILE = HERE / "audio-analysis-v2-config-001.json"
CANDIDATE_FREEZE_MODULE = HERE / "candidate_freeze.py"

MANIFEST_SCHEMA = "fame-owned-beats-workspace-v1"
PROTOCOL_SCHEMA = "fame-owned-beats-audio-analysis-v2-evaluation-protocol"
CONFIG_SCHEMA = "fame-owned-beats-audio-analysis-v2-development-config"
HOLDOUT_SPLIT = "evaluation-holdout"
DEVELOPMENT_SPLIT = "development"
EXPECTED_CANDIDATE = "audio-analysis-v2-config-001"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_candidate_freeze_module():
    spec = importlib.util.spec_from_file_location(
        "fame_audio_analysis_candidate_freeze",
        CANDIDATE_FREEZE_MODULE,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load candidate_freeze.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


freeze_gate = load_candidate_freeze_module()


def validate_protocol(protocol):
    holdout = (protocol.get("splits") or {}).get("evaluationHoldout") or {}
    development = (protocol.get("splits") or {}).get("development") or {}
    decision = protocol.get("decision") or {}
    holdout_rule = decision.get("holdoutRule") or {}
    if (
        protocol.get("schema") != PROTOCOL_SCHEMA
        or protocol.get("version") != 1
        or protocol.get("status") != "FROZEN_PRE_TUNING"
        or development.get("name") != DEVELOPMENT_SPLIT
        or holdout.get("name") != HOLDOUT_SPLIT
        or holdout.get("allowedDuringTuning") is not False
        or holdout.get("requiresFrozenCandidate") is not True
        or int(holdout.get("expectedFamilies", -1)) != 10
        or int(holdout.get("maxFinalEvaluationRuns", -1)) != 1
        or holdout.get("retuningAfterViewingResults") != "REQUIRES_NEW_UNTOUCHED_HOLDOUT"
        or (protocol.get("splits") or {}).get("crossSplitFamilyOverlapAllowed") is not False
        or (decision.get("developmentRule") or {}).get("holdoutMayOpenOnlyFor") != "V2_WINS"
        or holdout_rule.get("retuneAfterViewingHoldoutAllowed") is not False
    ):
        raise RuntimeError("Frozen protocol does not authorize the required one-shot holdout boundary")
    return protocol


def validate_candidate_config(config, protocol):
    if (
        config.get("schema") != CONFIG_SCHEMA
        or config.get("version") != 1
        or config.get("candidateId") != EXPECTED_CANDIDATE
        or config.get("configurationIndex") != 1
        or config.get("status") != "FROZEN_BEFORE_DEVELOPMENT_OBSERVATION"
        or config.get("split") != DEVELOPMENT_SPLIT
        or config.get("holdoutAccessAllowed") is not False
    ):
        raise RuntimeError("Unexpected or unfrozen candidate config")
    if config.get("protocolDigestSha256") != sha256_file(PROTOCOL_FILE):
        raise RuntimeError("Candidate config protocol digest mismatch")
    if freeze_gate.config_digest(config) != config.get("configHash"):
        raise RuntimeError("Candidate configHash mismatch")
    return config


def validate_manifest(manifest):
    if (
        manifest.get("schema") != MANIFEST_SCHEMA
        or manifest.get("version") != 1
        or not isinstance(manifest.get("records"), list)
    ):
        raise RuntimeError("Unsupported owned-beats manifest")
    return manifest


def select_holdout_records(manifest, protocol):
    """Select holdout metadata only. Never touches localPath contents."""
    validate_manifest(manifest)
    validate_protocol(protocol)

    family_splits = {}
    for record in manifest["records"]:
        family_id = record.get("compositionFamilyId")
        split = record.get("split")
        if family_id and split:
            prior = family_splits.get(family_id)
            if prior is not None and prior != split:
                raise RuntimeError(
                    f"Composition family crosses splits: {family_id} ({prior} vs {split})"
                )
            family_splits[family_id] = split

    selected = [
        record
        for record in manifest["records"]
        if record.get("presentInScan") is not False
        and record.get("split") == HOLDOUT_SPLIT
    ]

    expected = int(protocol["splits"]["evaluationHoldout"]["expectedFamilies"])
    families = {}
    source_ids = set()
    for record in selected:
        rid = record.get("sourceRecordId")
        family_id = record.get("compositionFamilyId")
        local_path = record.get("localPath")
        source_sha = record.get("sha256")
        if (
            not isinstance(rid, str) or not rid
            or not isinstance(family_id, str) or not family_id
            or not isinstance(local_path, str) or not local_path
            or not isinstance(source_sha, str) or len(source_sha) != 64
        ):
            raise RuntimeError("Incomplete holdout manifest metadata")
        if rid in source_ids:
            raise RuntimeError(f"Duplicate holdout sourceRecordId: {rid}")
        source_ids.add(rid)
        families.setdefault(family_id, []).append(record)

    if len(families) != expected:
        raise RuntimeError(
            f"Holdout family count mismatch: {len(families)}, expected {expected}"
        )
    if len(selected) != expected:
        raise RuntimeError(
            "One-shot holdout requires exactly one source record per frozen composition family"
        )
    for family_id, records in families.items():
        if len(records) != 1:
            raise RuntimeError(
                f"Holdout family must map to exactly one source record: {family_id}"
            )

    return sorted(
        selected,
        key=lambda r: (str(r["compositionFamilyId"]), str(r["sourceRecordId"])),
    )


def holdout_usage_root(workspace):
    return Path(workspace) / "runs" / "evaluation-holdout-usage"


def prior_usage_files(workspace):
    root = holdout_usage_root(workspace)
    if not root.exists():
        return []
    lock = root / "reservation.lock"
    if lock.exists():
        raise RuntimeError("Holdout reservation.lock already exists; manual inspection required")
    return sorted(root.glob("*.json"))


def assert_no_prior_holdout_usage(workspace, records):
    identities = {record["compositionFamilyId"] for record in records}
    for file in prior_usage_files(workspace):
        prior = read_json(file)
        used = set(prior.get("families") or [])
        overlap = identities.intersection(used)
        if overlap:
            raise RuntimeError(
                "Holdout families already reserved/observed; one-shot evaluation cannot run again"
            )


def build_preflight(workspace, candidate_freeze_file):
    workspace = Path(workspace).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")

    protocol = validate_protocol(read_json(PROTOCOL_FILE))
    config = validate_candidate_config(read_json(CONFIG_FILE), protocol)

    manifest_path = workspace / "manifest" / "owned-beats-manifest.json"
    if not manifest_path.is_file():
        raise RuntimeError(f"Owned Beats manifest missing: {manifest_path}")
    manifest = validate_manifest(read_json(manifest_path))
    records = select_holdout_records(manifest, protocol)

    # Freeze verification is code/config/environment only; it never opens holdout audio.
    verified_freeze = freeze_gate.verify_freeze(
        candidate_freeze_file,
        HERE,
        config,
    )
    if verified_freeze.get("candidateId") != EXPECTED_CANDIDATE:
        raise RuntimeError("Candidate freeze points to unexpected candidate")

    assert_no_prior_holdout_usage(workspace, records)

    return {
        "workspace": workspace,
        "protocol": protocol,
        "config": config,
        "manifestPath": manifest_path,
        "records": records,
        "freeze": verified_freeze,
    }


def preflight_result(context):
    return {
        "mode": "HOLDOUT_PREFLIGHT_PASS",
        "candidateId": context["freeze"]["candidateId"],
        "freezeDigestSha256": context["freeze"]["freezeDigestSha256"],
        "holdoutFamilies": len(context["records"]),
        "maxFinalEvaluationRuns": 1,
        "priorHoldoutUsage": False,
        "reservationCreated": False,
        "holdoutAudioAccessPerformed": False,
        "holdoutObserved": False,
        "nextAction": "EXPLICIT_RESERVATION_BEFORE_ANY_HOLDOUT_AUDIO_ACCESS",
    }


def reserve(workspace, candidate_freeze_file):
    context = build_preflight(workspace, candidate_freeze_file)
    reservation = freeze_gate.reserve_holdout(
        context["workspace"],
        context["freeze"],
        context["records"],
    )
    return {
        "mode": "HOLDOUT_RESERVED_BEFORE_AUDIO_ACCESS",
        "candidateId": context["freeze"]["candidateId"],
        "freezeDigestSha256": context["freeze"]["freezeDigestSha256"],
        "holdoutFamilies": len(context["records"]),
        "reservationPath": reservation,
        "reservationCreated": True,
        "holdoutAudioAccessPerformed": False,
        "holdoutObserved": False,
        "nextAction": "CREATE_BLIND_HOLDOUT_HUMAN_REFERENCE_BEFORE_SCORING",
    }


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["preflight", "reserve"])
    parser.add_argument("workspace")
    parser.add_argument("--candidate-freeze", required=True)
    args = parser.parse_args()

    if args.command == "preflight":
        context = build_preflight(args.workspace, args.candidate_freeze)
        result = preflight_result(context)
    else:
        result = reserve(args.workspace, args.candidate_freeze)

    print(stable_json(result), end="")


if __name__ == "__main__":
    main()
