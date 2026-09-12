#!/usr/bin/env python3
"""FAME Neural — metadata-only gate for the remediated one-shot Audio Analysis holdout.

R1 hardening:
- the historical `evaluation-holdout` cohort remains provenance-insufficient and is NOT
  accepted as the final holdout;
- the final cohort is bound to a committed immutable reference file containing the full
  identity tuple compositionFamilyId/sourceRecordId/sourceAssetId/sha256;
- the cohort digest is recomputed and checked before any reservation;
- sourceRecordId/sourceAssetId/sha256 are globally unique across the manifest, so an
  asset cannot cross development/holdout by changing family id;
- reservation checks are identity-aware, not family-only.

`preflight` never opens, hashes, probes or decodes holdout audio.
`reserve` is intentionally separate and irreversible.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-analysis-v2-protocol.json"
CONFIG_FILE = HERE / "audio-analysis-v2-config-001.json"
CANDIDATE_FREEZE_MODULE = HERE / "candidate_freeze.py"
HOLDOUT_REFERENCE_FILE = HERE / "audio-analysis-holdout-cohort-r1-v2.json"

MANIFEST_SCHEMA = "fame-owned-beats-workspace-v1"
PROTOCOL_SCHEMA = "fame-owned-beats-audio-analysis-v2-evaluation-protocol"
CONFIG_SCHEMA = "fame-owned-beats-audio-analysis-v2-development-config"
REFERENCE_SCHEMA = "fame-owned-beats-holdout-cohort-reference-v2"
REFERENCE_VERSION = 2
REFERENCE_STATUS = "FROZEN_NEW_UNTOUCHED_HOLDOUT_BEFORE_OBSERVATION"
REFERENCE_COHORT_ID = "audio-analysis-holdout-r1-v2"
LEGACY_HOLDOUT_SPLIT = "evaluation-holdout"
DEVELOPMENT_SPLIT = "development"
EXPECTED_CANDIDATE = "audio-analysis-v2-config-001"
IDENTITY_FIELDS = (
    "compositionFamilyId",
    "sourceRecordId",
    "sourceAssetId",
    "sha256",
)


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


def stable_json(value):
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def identity_from_record(record):
    family_id = record.get("compositionFamilyId")
    record_id = record.get("sourceRecordId")
    asset_id = record.get("sourceAssetId")
    source_sha = record.get("sha256")
    if (
        not isinstance(family_id, str) or not family_id.strip()
        or not isinstance(record_id, str) or not record_id.strip()
        or not isinstance(asset_id, str) or not asset_id.strip()
        or not isinstance(source_sha, str)
        or not re.fullmatch(r"[0-9a-f]{64}", source_sha)
        or asset_id != f"sha256:{source_sha}"
    ):
        raise RuntimeError("Incomplete or inconsistent holdout identity metadata")
    return {
        "compositionFamilyId": family_id,
        "sourceRecordId": record_id,
        "sourceAssetId": asset_id,
        "sha256": source_sha,
    }


def sorted_identities(records):
    identities = [identity_from_record(record) for record in records]
    return sorted(
        identities,
        key=lambda item: (
            item["compositionFamilyId"],
            item["sourceRecordId"],
            item["sourceAssetId"],
            item["sha256"],
        ),
    )


def cohort_digest_from_identities(identities):
    canonical = sorted(
        identities,
        key=lambda item: (
            item["compositionFamilyId"],
            item["sourceRecordId"],
            item["sourceAssetId"],
            item["sha256"],
        ),
    )
    return hashlib.sha256(stable_json(canonical).encode("utf-8")).hexdigest()


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
        or holdout.get("name") != LEGACY_HOLDOUT_SPLIT
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


def verify_reference_freeze_commit(reference):
    frozen = (reference.get("repo") or {}).get("commitAtFreeze")
    if not isinstance(frozen, str) or not re.fullmatch(r"[0-9a-f]{40}", frozen):
        raise RuntimeError("Holdout reference missing valid commitAtFreeze")

    source_commit = subprocess.run(
        ["git", "cat-file", "-e", f"{frozen}^{{commit}}"],
        cwd=HERE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if source_commit.returncode != 0:
        raise RuntimeError("Holdout reference commitAtFreeze is not available in repository")

    repo_root = Path(
        subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=HERE,
            text=True,
        ).strip()
    ).resolve()
    try:
        reference_rel = HOLDOUT_REFERENCE_FILE.resolve().relative_to(repo_root).as_posix()
    except ValueError as exc:
        raise RuntimeError("Holdout reference is outside repository") from exc

    status = subprocess.check_output(
        ["git", "status", "--porcelain", "--", reference_rel],
        cwd=repo_root,
        text=True,
    ).strip()
    if status:
        raise RuntimeError("Holdout reference must be committed and clean")

    history = [
        line.strip()
        for line in subprocess.check_output(
            ["git", "log", "--format=%H", "--", reference_rel],
            cwd=repo_root,
            text=True,
        ).splitlines()
        if line.strip()
    ]
    if len(history) != 1:
        raise RuntimeError("Holdout reference must be immutable after introduction")

    reference_commit = history[0]
    current = subprocess.check_output(
        ["git", "rev-parse", "HEAD"],
        cwd=repo_root,
        text=True,
    ).strip()
    ancestry = subprocess.run(
        ["git", "merge-base", "--is-ancestor", reference_commit, current],
        cwd=repo_root,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if ancestry.returncode != 0:
        raise RuntimeError("Holdout reference introduction commit is not an ancestor of checkout")


def validate_holdout_reference(reference, protocol):
    expected = int(protocol["splits"]["evaluationHoldout"]["expectedFamilies"])
    records = reference.get("records")
    safety = reference.get("safety") or {}
    legacy = reference.get("legacyOriginalHoldout") or {}
    selection = reference.get("selection") or {}
    planned_split = reference.get("plannedSplit")

    if (
        reference.get("schema") != REFERENCE_SCHEMA
        or reference.get("version") != REFERENCE_VERSION
        or reference.get("cohortId") != REFERENCE_COHORT_ID
        or reference.get("status") != REFERENCE_STATUS
        or reference.get("expectedFamilies") != expected
        or not isinstance(planned_split, str)
        or not planned_split.strip()
        or planned_split == LEGACY_HOLDOUT_SPLIT
        or not isinstance(records, list)
        or len(records) != expected
        or legacy.get("auditVerdict") != "PARTIAL"
        or legacy.get("policy") != "PROVENANCE_INSUFFICIENT_DO_NOT_USE_AS_FINAL_HOLDOUT"
        or legacy.get("reusedInNewCohort") is not False
        or selection.get("usesAudioContentOrDerivedMetrics") is not False
        or safety.get("holdoutAudioAccessPerformed") is not False
        or safety.get("holdoutObserved") is not False
        or safety.get("reservationCreated") is not False
    ):
        raise RuntimeError("Invalid or unsafe remediated holdout reference")

    identities = sorted_identities(records)
    for field in IDENTITY_FIELDS:
        values = [item[field] for item in identities]
        if len(values) != len(set(values)):
            raise RuntimeError(f"Duplicate holdout identity in reference: {field}")

    actual_digest = cohort_digest_from_identities(identities)
    if reference.get("cohortDigestSha256") != actual_digest:
        raise RuntimeError("Holdout reference cohort digest mismatch")

    verify_reference_freeze_commit(reference)
    return reference


def validate_manifest_identity_integrity(manifest):
    family_splits = {}
    unique_fields = {
        "sourceRecordId": {},
        "sourceAssetId": {},
        "sha256": {},
    }

    for record in manifest["records"]:
        # Identity is required for every manifest record; this prevents cross-split
        # asset reuse hidden behind a family rename.
        identity = identity_from_record(record)
        split = record.get("split")

        for field in unique_fields:
            value = identity[field]
            prior = unique_fields[field].get(value)
            if prior is not None:
                raise RuntimeError(
                    f"Duplicate manifest {field}: {value} "
                    f"({prior} vs {identity['sourceRecordId']})"
                )
            unique_fields[field][value] = identity["sourceRecordId"]

        family_id = identity["compositionFamilyId"]
        if split:
            prior_split = family_splits.get(family_id)
            if prior_split is not None and prior_split != split:
                raise RuntimeError(
                    f"Composition family crosses splits: {family_id} "
                    f"({prior_split} vs {split})"
                )
            family_splits[family_id] = split


def select_holdout_records(manifest, protocol, reference):
    """Select ONLY the exact remediated cohort metadata. Never touches localPath contents."""
    validate_manifest(manifest)
    validate_protocol(protocol)
    validate_holdout_reference(reference, protocol)
    validate_manifest_identity_integrity(manifest)

    planned_split = reference["plannedSplit"]
    selected = [
        record
        for record in manifest["records"]
        if record.get("presentInScan") is not False
        and record.get("split") == planned_split
    ]

    expected = int(protocol["splits"]["evaluationHoldout"]["expectedFamilies"])
    families = {}
    for record in selected:
        identity = identity_from_record(record)
        families.setdefault(identity["compositionFamilyId"], []).append(record)

    if len(families) != expected:
        raise RuntimeError(
            f"Remediated holdout family count mismatch: {len(families)}, expected {expected}"
        )
    if len(selected) != expected:
        raise RuntimeError(
            "One-shot remediated holdout requires exactly one source record per frozen composition family"
        )
    for family_id, records in families.items():
        if len(records) != 1:
            raise RuntimeError(
                f"Remediated holdout family must map to exactly one source record: {family_id}"
            )

    selected_identities = sorted_identities(selected)
    reference_identities = sorted_identities(reference["records"])
    if selected_identities != reference_identities:
        raise RuntimeError(
            "Remediated holdout manifest identities do not exactly match frozen cohort reference"
        )

    actual_digest = cohort_digest_from_identities(selected_identities)
    if actual_digest != reference["cohortDigestSha256"]:
        raise RuntimeError("Remediated holdout cohort digest differs from frozen reference")

    return sorted(
        selected,
        key=lambda record: (
            str(record["compositionFamilyId"]),
            str(record["sourceRecordId"]),
        ),
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


def identity_sets(records):
    identities = sorted_identities(records)
    return {
        "families": {item["compositionFamilyId"] for item in identities},
        "sourceRecordIds": {item["sourceRecordId"] for item in identities},
        "sourceAssetIds": {item["sourceAssetId"] for item in identities},
        "sha256s": {item["sha256"] for item in identities},
    }


def prior_identity_sets(prior):
    records = prior.get("records")
    if isinstance(records, list):
        try:
            return identity_sets(records)
        except RuntimeError:
            raise RuntimeError("Malformed prior holdout reservation identity metadata")

    # Legacy reservations may contain only family ids.
    return {
        "families": set(prior.get("families") or []),
        "sourceRecordIds": set(prior.get("sourceRecordIds") or []),
        "sourceAssetIds": set(prior.get("sourceAssetIds") or []),
        "sha256s": set(prior.get("sha256s") or []),
    }


def assert_no_prior_holdout_usage(workspace, records, reference):
    current = identity_sets(records)
    for file in prior_usage_files(workspace):
        prior = read_json(file)
        if prior.get("cohortDigestSha256") == reference["cohortDigestSha256"]:
            raise RuntimeError("Remediated holdout cohort already reserved/observed")
        used = prior_identity_sets(prior)
        for field in current:
            if current[field].intersection(used[field]):
                raise RuntimeError(
                    f"Holdout identities already reserved/observed: overlap in {field}"
                )


def build_preflight(workspace, candidate_freeze_file):
    workspace = Path(workspace).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")

    protocol = validate_protocol(read_json(PROTOCOL_FILE))
    config = validate_candidate_config(read_json(CONFIG_FILE), protocol)

    if not HOLDOUT_REFERENCE_FILE.is_file():
        raise RuntimeError(f"Remediated holdout reference missing: {HOLDOUT_REFERENCE_FILE}")
    reference = validate_holdout_reference(read_json(HOLDOUT_REFERENCE_FILE), protocol)

    manifest_path = workspace / "manifest" / "owned-beats-manifest.json"
    if not manifest_path.is_file():
        raise RuntimeError(f"Owned Beats manifest missing: {manifest_path}")
    manifest = validate_manifest(read_json(manifest_path))
    records = select_holdout_records(manifest, protocol, reference)

    # Freeze verification is code/config/environment only; it never opens holdout audio.
    verified_freeze = freeze_gate.verify_freeze(
        candidate_freeze_file,
        HERE,
        config,
    )
    if verified_freeze.get("candidateId") != EXPECTED_CANDIDATE:
        raise RuntimeError("Candidate freeze points to unexpected candidate")

    assert_no_prior_holdout_usage(workspace, records, reference)

    return {
        "workspace": workspace,
        "protocol": protocol,
        "config": config,
        "manifestPath": manifest_path,
        "records": records,
        "reference": reference,
        "referenceDigestSha256": sha256_file(HOLDOUT_REFERENCE_FILE),
        "freeze": verified_freeze,
    }


def preflight_result(context):
    return {
        "mode": "HOLDOUT_PREFLIGHT_PASS",
        "candidateId": context["freeze"]["candidateId"],
        "freezeDigestSha256": context["freeze"]["freezeDigestSha256"],
        "cohortId": context["reference"]["cohortId"],
        "cohortDigestSha256": context["reference"]["cohortDigestSha256"],
        "cohortReferenceDigestSha256": context["referenceDigestSha256"],
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
        context["reference"],
        config_hash=context["config"]["configHash"],
        protocol_digest_sha256=sha256_file(PROTOCOL_FILE),
        cohort_reference_digest_sha256=context["referenceDigestSha256"],
    )
    return {
        "mode": "HOLDOUT_RESERVED_BEFORE_AUDIO_ACCESS",
        "candidateId": context["freeze"]["candidateId"],
        "freezeDigestSha256": context["freeze"]["freezeDigestSha256"],
        "cohortId": context["reference"]["cohortId"],
        "cohortDigestSha256": context["reference"]["cohortDigestSha256"],
        "cohortReferenceDigestSha256": context["referenceDigestSha256"],
        "holdoutFamilies": len(context["records"]),
        "reservationPath": reservation,
        "reservationCreated": True,
        "holdoutAudioAccessPerformed": False,
        "holdoutObserved": False,
        "nextAction": "CREATE_BLIND_HOLDOUT_HUMAN_REFERENCE_BEFORE_SCORING",
    }


def stable_pretty_json(value):
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

    print(stable_pretty_json(result), end="")


if __name__ == "__main__":
    main()
