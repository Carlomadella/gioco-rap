#!/usr/bin/env python3
"""
FAME Neural — evaluator development per Audio Analysis V2 candidate.

Riusa le metriche e la validazione reference del valutatore baseline002,
ma analizza la candidate config-001 e scrive un run append-only separato.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import sys
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE_EVALUATOR_FILE = HERE / "audio-analysis-v1-evaluate-v2.py"
CANDIDATE_FILE = HERE / "audio-analysis-v2-config-001.py"
CONFIG_FILE = HERE / "audio-analysis-v2-config-001.json"
LOCK_FILE = HERE / "requirements-audio-analysis-lock.txt"

DEFAULT_REVIEW_ID = "audio-analysis-v2-dev-reference-precision-v3"
DEFAULT_RUN_ID = "v2-config-001-development-001"
DEVELOPMENT_SPLIT = "development"

SCHEMA = "fame-owned-beats-audio-analysis-v2-development-evaluation"
VERSION = 1
EVALUATOR_VERSION = "audio-analysis-v2-evaluator-v1"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


base = load_module(BASE_EVALUATOR_FILE, "fame_v1_evaluator_for_v2")
candidate = load_module(CANDIDATE_FILE, "fame_audio_analysis_v2_config001")


def config_hash(value):
    return hashlib.sha256(
        json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=True,
        ).encode("utf-8")
    ).hexdigest()


def require_candidate_config():
    cfg = read_json(CONFIG_FILE)
    if (
        cfg.get("schema") != "fame-owned-beats-audio-analysis-v2-development-config"
        or cfg.get("version") != 1
        or cfg.get("candidateId") != "audio-analysis-v2-config-001"
        or cfg.get("configurationIndex") != 1
        or cfg.get("status") != "FROZEN_BEFORE_DEVELOPMENT_OBSERVATION"
        or cfg.get("split") != DEVELOPMENT_SPLIT
        or cfg.get("holdoutAccessAllowed") is not False
    ):
        raise RuntimeError("Invalid/unfrozen V2 config-001")

    if cfg.get("protocolDigestSha256") != base.sha256_file(base.PROTOCOL_FILE):
        raise RuntimeError("V2 config protocol digest mismatch")

    if cfg.get("baselineSourceGitBlobSha1") != base.git_blob_sha1(base.BASELINE_FILE):
        raise RuntimeError("V2 config baseline source blob mismatch")

    if cfg.get("candidateSourceGitBlobSha1") != base.git_blob_sha1(CANDIDATE_FILE):
        raise RuntimeError("V2 candidate source blob mismatch")

    actual_config_hash = config_hash(cfg.get("algorithmConfig"))
    if actual_config_hash != cfg.get("configHash"):
        raise RuntimeError("V2 configHash mismatch")

    if candidate.CANDIDATE_ID != cfg["candidateId"]:
        raise RuntimeError("CandidateId differs between source/config")

    if candidate.SECTION_CONFIG["method"] != cfg["algorithmConfig"]["sectionMethod"]:
        raise RuntimeError("Candidate section method differs from config")

    return cfg


def build_context(workspace, review_id):
    cfg = require_candidate_config()
    base_context = base.build_context(workspace, review_id)

    if review_id != cfg["developmentReferenceReviewId"]:
        raise RuntimeError("V2 config reviewId mismatch")
    if (
        base_context["snapshot"]["submissionDigestSha256"]
        != cfg["developmentReferenceDigestSha256"]
    ):
        raise RuntimeError("V2 config Human Reference digest mismatch")

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe must both be available in PATH")

    return {
        **base_context,
        "candidate": candidate,
        "candidateConfig": cfg,
    }


def safe_run_id(value):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{2,79}", value or ""):
        raise RuntimeError("Invalid run-id")
    return value


def preflight_result(workspace, review_id, context):
    cfg = context["candidateConfig"]
    return {
        "mode": "PREFLIGHT_PASS",
        "workspace": str(workspace),
        "split": DEVELOPMENT_SPLIT,
        "candidateId": cfg["candidateId"],
        "configurationIndex": cfg["configurationIndex"],
        "configHash": cfg["configHash"],
        "candidateToolVersion": candidate.TOOL_VERSION,
        "candidateSourceGitBlobSha1": base.git_blob_sha1(CANDIDATE_FILE),
        "baselineSourceGitBlobSha1": base.git_blob_sha1(base.BASELINE_FILE),
        "reviewId": review_id,
        "submissionDigestSha256": context["snapshot"]["submissionDigestSha256"],
        "protocolDigestSha256": base.sha256_file(base.PROTOCOL_FILE),
        "dependencyLockHashSha256": sha256_file(LOCK_FILE),
        "codeCommit": base.git_commit(),
        "holdoutObserved": False,
        "trainingAuthorized": False,
    }


def evaluate(workspace, review_id, run_id, context):
    run_id = safe_run_id(run_id)
    runs_root = workspace / "runs" / "audio-analysis-evaluation-v2"
    final_dir = runs_root / run_id
    if final_dir.exists():
        raise RuntimeError(f"Append-only V2 run already exists: {final_dir}")

    results = []
    for index, (family, record, source) in enumerate(context["selected"], 1):
        print(
            f"[{index}/{len(context['selected'])}] V2 config-001 evaluate "
            f"{family['sourceRecordId']}",
            file=sys.stderr,
            flush=True,
        )
        results.append(
            base.analyze_family(
                context["candidate"],
                family,
                record,
                source,
                context["protocol"],
            )
        )

    aggregate = base.aggregate_report(results)
    aggregate["decisionStatus"] = (
        "CANDIDATE_ONLY_PENDING_PAIRED_COMPARISON_AND_REQUIRED_REVIEW"
    )

    cfg = context["candidateConfig"]
    report = {
        "schema": SCHEMA,
        "version": VERSION,
        "mode": "DEVELOPMENT_CANDIDATE",
        "evaluatorVersion": EVALUATOR_VERSION,
        "runId": run_id,
        "candidateId": cfg["candidateId"],
        "configurationIndex": cfg["configurationIndex"],
        "configHash": cfg["configHash"],
        "split": DEVELOPMENT_SPLIT,
        "holdoutObserved": False,
        "trainingAuthorized": False,
        "sourceSeparationAuthorized": False,
        "audioToMidiAuthorized": False,
        "provenance": {
            "codeCommit": base.git_commit(),
            "candidateToolVersion": candidate.TOOL_VERSION,
            "candidateSourceGitBlobSha1": base.git_blob_sha1(CANDIDATE_FILE),
            "baselineSourceGitBlobSha1": base.git_blob_sha1(base.BASELINE_FILE),
            "candidateConfigDigestSha256": sha256_file(CONFIG_FILE),
            "protocolDigestSha256": base.sha256_file(base.PROTOCOL_FILE),
            "dependencyLockHashSha256": sha256_file(LOCK_FILE),
            "mirEvalVersion": base.mir_eval.__version__,
            "humanReferenceReviewId": review_id,
            "humanReferenceSubmissionDigestSha256": (
                context["snapshot"]["submissionDigestSha256"]
            ),
            "humanReferenceSnapshotPath": str(context["snapshotPath"]),
            "manifestPath": str(context["manifestPath"]),
        },
        "algorithmConfig": cfg["algorithmConfig"],
        "referenceAnnotationCost": {
            "interpretation": (
                "GROUND_TRUTH_CREATION_COST_ONLY_NOT_V1_V2_CORRECTION_COST"
            ),
            "candidateReviewCostAvailable": False,
        },
        "families": results,
        "aggregate": aggregate,
    }

    temp_dir = runs_root / f".{run_id}.tmp-{uuid.uuid4().hex}"
    runs_root.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir(parents=False, exist_ok=False)
    try:
        report_path = temp_dir / "report.json"
        report_path.write_text(stable_json(report), encoding="utf-8")
        if final_dir.exists():
            raise RuntimeError(f"Append-only V2 run appeared concurrently: {final_dir}")
        temp_dir.rename(final_dir)
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return final_dir / "report.json", report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("workspace")
    parser.add_argument("--review-id", default=DEFAULT_REVIEW_ID)
    parser.add_argument("--run-id", default=DEFAULT_RUN_ID)
    parser.add_argument("--preflight", action="store_true")
    args = parser.parse_args()

    workspace = Path(args.workspace).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")

    context = build_context(workspace, args.review_id)
    if args.preflight:
        print(stable_json(preflight_result(workspace, args.review_id, context)), end="")
        return

    report_path, report = evaluate(
        workspace,
        args.review_id,
        args.run_id,
        context,
    )
    print(
        stable_json({
            "mode": report["mode"],
            "candidateId": report["candidateId"],
            "configurationIndex": report["configurationIndex"],
            "runId": report["runId"],
            "reportPath": str(report_path),
            "families": report["aggregate"]["families"],
            "medianBeatFMeasure70ms": report["aggregate"]["medianBeatFMeasure70ms"],
            "medianSectionFMeasure500ms": report["aggregate"]["medianSectionFMeasure500ms"],
            "holdoutObserved": False,
        }),
        end="",
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
