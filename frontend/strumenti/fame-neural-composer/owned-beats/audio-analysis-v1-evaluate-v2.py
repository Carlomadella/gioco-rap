#!/usr/bin/env python3
"""
FAME Neural — V1 development baseline evaluator.

Non modifica audio-analysis.py. Strumenta l'algoritmo V1 congelato,
lo valuta contro la Human Reference development finalizzata e scrive
un report append-only nel workspace Owned Beats fuori da Git.
"""

import argparse
import hashlib
import importlib.util
import json
import math
import re
import shutil
import subprocess
import sys
import uuid
import warnings
from collections import Counter
from pathlib import Path

import mir_eval
import numpy as np

SCHEMA = "fame-owned-beats-audio-analysis-v1-development-evaluation"
VERSION = 1
EVALUATOR_VERSION = "audio-analysis-v1-evaluator-v2"

MANIFEST_SCHEMA = "fame-owned-beats-workspace-v1"
PROTOCOL_SCHEMA = "fame-owned-beats-audio-analysis-v2-evaluation-protocol"
SNAPSHOT_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-snapshot-v1"
SUBMISSION_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-v1"
INDEX_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-index-v1"
CONTRACT_SCHEMA = "fame-owned-beats-audio-analysis-evaluation-implementation-v2"

DEVELOPMENT_SPLIT = "development"
HOLDOUT_SPLIT = "evaluation-holdout"
DEFAULT_REVIEW_ID = "audio-analysis-v2-dev-reference-precision-v3"
DEFAULT_RUN_ID = "v1-baseline-development-002"

HERE = Path(__file__).resolve().parent
BASELINE_FILE = HERE / "audio-analysis.py"
PROTOCOL_FILE = HERE / "audio-analysis-v2-protocol.json"
CONTRACT_FILE = HERE / "audio-analysis-evaluation-implementation-v2.json"
LOCK_FILE = HERE / "requirements-audio-analysis-lock.txt"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def javascript_submission_digest(snapshot_path):
    # The Human Reference finalizer is JavaScript and hashes:
    # JSON.stringify(submission, null, 2) + "\\n".
    # Recompute with Node to avoid cross-language numeric serialization drift
    # (for example 66.0 in Python vs 66 in JSON.stringify).
    script = (
        "const fs=require('fs'),crypto=require('crypto');"
        "const raw=fs.readFileSync(process.argv[1],'utf8').replace(/^\\uFEFF/,'');"
        "const snapshot=JSON.parse(raw);"
        "const canonical=JSON.stringify(snapshot.submission,null,2)+'\\n';"
        "process.stdout.write(crypto.createHash('sha256').update(canonical).digest('hex'));"
    )
    return run_text(["node", "-e", script, str(snapshot_path)])


def run_text(args, cwd=None):
    cp = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if cp.returncode:
        raise RuntimeError(
            (cp.stderr or cp.stdout or "").strip()
            or f"Command failed: {args[0]}"
        )
    return cp.stdout.strip()


def repo_root():
    return HERE.parents[3]


def git_commit():
    try:
        return run_text(["git", "rev-parse", "HEAD"], cwd=repo_root())
    except Exception:
        return None


def git_blob_sha1(path):
    return run_text(["git", "hash-object", str(path)], cwd=repo_root())


def dependency_lock_hash():
    return sha256_file(LOCK_FILE)


def load_baseline_module():
    spec = importlib.util.spec_from_file_location(
        "fame_owned_beats_audio_analysis_v1",
        BASELINE_FILE,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load audio-analysis.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def require_contract():
    contract = read_json(CONTRACT_FILE)
    if (
        contract.get("schema") != CONTRACT_SCHEMA
        or contract.get("version") != 2
        or contract.get("status") != "FROZEN_BEFORE_BASELINE_OBSERVATION"
        or contract.get("split") != DEVELOPMENT_SPLIT
        or contract.get("holdoutAccessAllowed") is not False
    ):
        raise RuntimeError("Invalid or unfrozen evaluation implementation contract")

    actual_protocol_digest = sha256_file(PROTOCOL_FILE)
    if actual_protocol_digest != contract.get("protocolDigestSha256"):
        raise RuntimeError("Protocol digest differs from frozen evaluation contract")

    actual_protocol_blob = git_blob_sha1(PROTOCOL_FILE)
    if actual_protocol_blob != contract.get("protocolGitBlobSha1"):
        raise RuntimeError("Protocol Git blob differs from frozen evaluation contract")

    actual_baseline_blob = git_blob_sha1(BASELINE_FILE)
    if actual_baseline_blob != contract.get("baselineSourceGitBlobSha1"):
        raise RuntimeError(
            "V1 baseline source differs from frozen evaluation contract; "
            "refusing to evaluate a moving baseline"
        )

    if mir_eval.__version__ != contract.get("mirEvalVersion"):
        raise RuntimeError(
            f"mir_eval version mismatch: expected {contract.get('mirEvalVersion')}, "
            f"found {mir_eval.__version__}"
        )
    return contract


def validate_protocol(contract):
    protocol = read_json(PROTOCOL_FILE)
    if (
        protocol.get("schema") != PROTOCOL_SCHEMA
        or protocol.get("version") != 1
        or protocol.get("status") != "FROZEN_PRE_TUNING"
        or protocol.get("scope", {}).get("baseline") != "owned-beats-audio-analysis-v1"
        or protocol.get("scope", {}).get("stage") != "AUDIO_ANALYSIS_ONLY"
        or protocol.get("scope", {}).get("trainingAuthorized") is not False
        or protocol.get("scope", {}).get("sourceSeparationAuthorized") is not False
        or protocol.get("scope", {}).get("audioToMidiAuthorized") is not False
        or protocol.get("splits", {}).get("development", {}).get("name") != DEVELOPMENT_SPLIT
        or protocol.get("splits", {}).get("evaluationHoldout", {}).get("name") != HOLDOUT_SPLIT
        or protocol.get("splits", {}).get("evaluationHoldout", {}).get("allowedDuringTuning") is not False
        or protocol.get("tuning", {}).get("holdoutObservationForbidden") is not True
    ):
        raise RuntimeError("Frozen pre-tuning protocol / holdout lock requirements not met")

    beat_cfg = protocol["metrics"]["beatGrid"]
    section_cfg = protocol["metrics"]["sections"]
    if (
        float(beat_cfg["primary"]["matchingWindowSeconds"]) != 0.07
        or float(beat_cfg["secondary"][0]["sigmaSeconds"]) != 0.04
        or float(section_cfg["primary"]["matchingWindowSeconds"]) != 0.5
        or float(section_cfg["secondary"][0]["matchingWindowSeconds"]) != 3.0
    ):
        raise RuntimeError("Metric thresholds differ from evaluation implementation contract")

    if sha256_file(PROTOCOL_FILE) != contract["protocolDigestSha256"]:
        raise RuntimeError("Protocol digest mismatch")
    return protocol


def validate_post_hardening_window(window, reference_bpm, label):
    if not isinstance(window, dict):
        raise RuntimeError(f"Invalid Human Reference window: {label}")
    if window.get("reviewed") is not True:
        raise RuntimeError(f"Unreviewed Human Reference window: {label}")
    if not isinstance(window.get("rawTapTimesSeconds"), list):
        raise RuntimeError(f"Missing rawTapTimesSeconds in Human Reference: {label}")
    if not isinstance(window.get("quantizationHistory"), list):
        raise RuntimeError(f"Missing quantizationHistory in Human Reference: {label}")

    beats = window.get("beatTimesSeconds")
    if not isinstance(beats, list) or any(not isinstance(v, (int, float)) for v in beats):
        raise RuntimeError(f"Invalid beatTimesSeconds in Human Reference: {label}")
    coverage = window.get("coverage")
    notes = str(window.get("coverageNotes") or "").strip()
    duration = float(window.get("durationSeconds", 0.0) or 0.0)
    bpm = float(reference_bpm)

    if coverage == "COMPLETE":
        if len(beats) < 2:
            raise RuntimeError(f"COMPLETE window has too few beats: {label}")
        sparse = len(beats) < duration * bpm / 60.0 * 0.5
        if sparse and len(notes) < 10:
            raise RuntimeError(f"Sparse COMPLETE window requires coverage note: {label}")
    elif coverage == "NO_BEAT":
        if beats or len(notes) < 10:
            raise RuntimeError(f"Invalid NO_BEAT Human Reference window: {label}")
    else:
        raise RuntimeError(f"Human Reference coverage is not final: {label}:{coverage}")


def validate_reference(workspace, review_id, contract, protocol):
    if review_id != contract.get("reviewId"):
        raise RuntimeError("Only the frozen development reviewId is allowed by this contract")

    root = workspace / "references" / "audio-analysis-v2" / DEVELOPMENT_SPLIT
    snapshot_path = root / f"{review_id}.json"
    index_path = root / "index.json"
    if not snapshot_path.is_file():
        raise RuntimeError(f"Finalized Human Reference snapshot missing: {snapshot_path}")
    if not index_path.is_file():
        raise RuntimeError(f"Human Reference index missing: {index_path}")

    snapshot = read_json(snapshot_path)
    if (
        snapshot.get("schema") != SNAPSHOT_SCHEMA
        or snapshot.get("version") != 1
        or snapshot.get("split") != DEVELOPMENT_SPLIT
        or snapshot.get("reviewId") != review_id
        or snapshot.get("protocolDigestSha256") != contract["protocolDigestSha256"]
    ):
        raise RuntimeError("Unsupported or non-development Human Reference snapshot")

    submission = snapshot.get("submission")
    if not isinstance(submission, dict):
        raise RuntimeError("Human Reference snapshot has no submission")
    if (
        submission.get("schema") != SUBMISSION_SCHEMA
        or submission.get("version") != 1
        or submission.get("split") != DEVELOPMENT_SPLIT
        or submission.get("reviewId") != review_id
        or submission.get("candidateOutputsExposed") is not False
    ):
        raise RuntimeError("Human Reference submission is not a safe development reference")

    frozen_submission_digest = snapshot.get("submissionDigestSha256")
    actual_submission_digest = javascript_submission_digest(snapshot_path)
    if actual_submission_digest != frozen_submission_digest:
        raise RuntimeError("Human Reference submission digest mismatch inside snapshot")
    if frozen_submission_digest != contract.get("submissionDigestSha256"):
        raise RuntimeError("Human Reference differs from frozen evaluation contract")

    index = read_json(index_path)
    if (
        index.get("schema") != INDEX_SCHEMA
        or index.get("version") != 1
        or index.get("split") != DEVELOPMENT_SPLIT
        or not isinstance(index.get("entries"), list)
    ):
        raise RuntimeError("Unsupported Human Reference index")
    entries = [e for e in index["entries"] if e.get("reviewId") == review_id]
    if len(entries) != 1:
        raise RuntimeError("Human Reference index must contain exactly one matching reviewId")
    entry = entries[0]
    if (
        entry.get("submissionDigestSha256") != actual_submission_digest
        or entry.get("protocolDigestSha256") != contract["protocolDigestSha256"]
        or entry.get("file") != snapshot_path.name
    ):
        raise RuntimeError("Human Reference index entry does not match finalized snapshot")

    families = submission.get("families")
    expected = int(protocol["splits"]["development"]["expectedFamilies"])
    if not isinstance(families, list) or len(families) != expected:
        raise RuntimeError(
            f"Expected {expected} development reference families, found "
            f"{len(families) if isinstance(families, list) else 'invalid'}"
        )

    ids = set()
    for family in families:
        rid = family.get("sourceRecordId")
        if not isinstance(rid, str) or rid in ids:
            raise RuntimeError("Invalid or duplicate Human Reference sourceRecordId")
        ids.add(rid)
        beat = family.get("beatReference", {})
        windows = beat.get("windows")
        if (
            beat.get("metricLevel") != "PRIMARY_MUSICAL_BEAT"
            or beat.get("reviewed") is not True
            or not isinstance(beat.get("referenceBpm"), (int, float))
            or not isinstance(windows, list)
            or len(windows) != 3
            or family.get("meter", {}).get("reviewed") is not True
            or family.get("sections", {}).get("reviewed") is not True
        ):
            raise RuntimeError(f"Incomplete required Human Reference: {rid}")
        expected_positions = ["EARLY", "MIDDLE", "LATE"]
        actual_positions = [window.get("position") for window in windows]
        if actual_positions != expected_positions:
            raise RuntimeError(f"Unexpected Human Reference window positions: {rid}:{actual_positions}")
        for window in windows:
            validate_post_hardening_window(
                window,
                beat["referenceBpm"],
                f"{rid}:{window.get('position')}",
            )
    return snapshot_path, snapshot, submission


def validate_manifest_and_sources(workspace, submission, protocol):
    manifest_path = workspace / "manifest" / "owned-beats-manifest.json"
    if not manifest_path.is_file():
        raise RuntimeError(f"Owned Beats manifest missing: {manifest_path}")
    manifest = read_json(manifest_path)
    if (
        manifest.get("schema") != MANIFEST_SCHEMA
        or manifest.get("version") != 1
        or not isinstance(manifest.get("records"), list)
    ):
        raise RuntimeError("Unsupported Owned Beats manifest")

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

    records = {r.get("sourceRecordId"): r for r in manifest["records"]}
    selected = []
    cohort_id = submission.get("cohortId")
    for family in submission["families"]:
        rid = family["sourceRecordId"]
        record = records.get(rid)
        if not record:
            raise RuntimeError(f"Manifest record missing for Human Reference family: {rid}")
        if (
            record.get("split") != DEVELOPMENT_SPLIT
            or record.get("compositionFamilyId") != family.get("compositionFamilyId")
            or record.get("sha256") != family.get("sourceSha256")
            or record.get("sourceAssetId") != family.get("sourceAssetId")
            or cohort_id not in (record.get("pilotCohorts") or [])
        ):
            raise RuntimeError(f"Manifest/reference mismatch or non-development record: {rid}")

        source = workspace / Path(record.get("localPath", ""))
        if not source.is_file():
            raise RuntimeError(f"Missing source copy: {rid}")
        actual_sha = sha256_file(source)
        if actual_sha != record.get("sha256"):
            raise RuntimeError(f"Source SHA256 mismatch: {rid}")
        selected.append((family, record, source))

    expected = int(protocol["splits"]["development"]["expectedFamilies"])
    if len(selected) != expected:
        raise RuntimeError("Development source selection count mismatch")
    return manifest_path, selected


def finite_float(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def rounded(value, digits=6):
    value = finite_float(value)
    return None if value is None else round(value, digits)


def percentile(values, p):
    if not values:
        return None
    return round(float(np.percentile(np.asarray(values, dtype=float), p)), 6)


def precision_recall_f(tp, fp, fn):
    tp, fp, fn = int(tp), int(fp), int(fn)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f = 2.0 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "fMeasure": round(f, 6),
        "truePositives": tp,
        "falsePositives": fp,
        "omissions": fn,
    }


def event_match_summary(reference, estimated, window):
    ref = np.asarray(reference, dtype=float)
    est = np.asarray(estimated, dtype=float)
    matches = mir_eval.util.match_events(ref, est, window=float(window))
    errors = [abs(float(ref[i]) - float(est[j])) for i, j in matches]
    base = precision_recall_f(
        len(matches),
        len(est) - len(matches),
        len(ref) - len(matches),
    )
    base.update(
        {
            "matchingWindowSeconds": float(window),
            "matchedAbsoluteErrorSeconds": {
                "median": percentile(errors, 50),
                "p95": percentile(errors, 95),
            },
        }
    )
    return base, errors


def beat_window_metrics(reference, estimated, f_window=0.07, cemgil_sigma=0.04):
    ref = np.asarray(reference, dtype=float)
    est = np.asarray(estimated, dtype=float)

    match, errors = event_match_summary(ref, est, f_window)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        f_measure = float(
            mir_eval.beat.f_measure(
                ref,
                est,
                f_measure_threshold=float(f_window),
            )
        )
        cemgil_result = mir_eval.beat.cemgil(
            ref,
            est,
            cemgil_sigma=float(cemgil_sigma),
        )
        cemgil_score = float(cemgil_result[0])
        try:
            cmlc, cmlt, amlc, amlt = mir_eval.beat.continuity(ref, est)
            continuity = {
                "CMLc": rounded(cmlc),
                "CMLt": rounded(cmlt),
                "AMLc": rounded(amlc),
                "AMLt": rounded(amlt),
            }
        except Exception:
            continuity = {"CMLc": None, "CMLt": None, "AMLc": None, "AMLt": None}

    if abs(f_measure - match["fMeasure"]) > 1e-6:
        raise RuntimeError(
            f"Beat F-measure implementation mismatch: "
            f"mir_eval={f_measure}, counted={match['fMeasure']}"
        )

    return {
        "referenceBeatCount": int(len(ref)),
        "estimatedBeatCount": int(len(est)),
        "fMeasure70ms": rounded(f_measure),
        "match": match,
        "cemgil40ms": rounded(cemgil_score),
        "continuity": continuity,
        "absoluteTimingErrorSeconds": {
            "median": percentile(errors, 50),
            "p95": percentile(errors, 95),
        },
    }


def mean_available(values):
    values = [finite_float(v) for v in values]
    values = [v for v in values if v is not None]
    return None if not values else round(float(np.mean(values)), 6)


def family_beat_aggregate(window_results):
    tp = sum(item["metrics"]["match"]["truePositives"] for item in window_results)
    fp = sum(item["metrics"]["match"]["falsePositives"] for item in window_results)
    fn = sum(item["metrics"]["match"]["omissions"] for item in window_results)
    micro = precision_recall_f(tp, fp, fn)

    errors = []
    for item in window_results:
        errors.extend(item["_errors"])

    continuity = {}
    for key in ("CMLc", "CMLt", "AMLc", "AMLt"):
        continuity[key] = mean_available(
            item["metrics"]["continuity"][key] for item in window_results
        )

    return {
        "aggregation": "MICRO_MATCH_COUNTS_ACROSS_3_WINDOWS",
        "fMeasure70ms": micro["fMeasure"],
        "fMeasure70msMacroMeanAcrossWindowsDiagnostic": mean_available(
            item["metrics"]["fMeasure70ms"] for item in window_results
        ),
        "precision70ms": micro["precision"],
        "recall70ms": micro["recall"],
        "truePositives": micro["truePositives"],
        "falsePositives": micro["falsePositives"],
        "omissions": micro["omissions"],
        "cemgil40msMeanAcrossWindows": mean_available(
            item["metrics"]["cemgil40ms"] for item in window_results
        ),
        "continuityMeanAcrossWindows": continuity,
        "absoluteTimingErrorSecondsPooledMatches": {
            "median": percentile(errors, 50),
            "p95": percentile(errors, 95),
        },
    }


def boundaries_to_intervals(boundaries, duration):
    duration = float(duration)
    clean = sorted(
        {
            float(v)
            for v in boundaries
            if finite_float(v) is not None and 0.0 < float(v) < duration
        }
    )
    points = [0.0] + clean + [duration]
    return np.asarray(
        [[points[i], points[i + 1]] for i in range(len(points) - 1)],
        dtype=float,
    )


def section_metrics(reference, estimated, duration, primary_window=0.5, diagnostic_window=3.0):
    ref = np.asarray(sorted(float(v) for v in reference), dtype=float)
    est = np.asarray(sorted(float(v) for v in estimated), dtype=float)
    ref_intervals = boundaries_to_intervals(ref, duration)
    est_intervals = boundaries_to_intervals(est, duration)

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        p05, r05, f05 = mir_eval.segment.detection(
            ref_intervals,
            est_intervals,
            window=float(primary_window),
            trim=True,
        )
        p3, r3, f3 = mir_eval.segment.detection(
            ref_intervals,
            est_intervals,
            window=float(diagnostic_window),
            trim=True,
        )
        ref_to_est, est_to_ref = mir_eval.segment.deviation(
            ref_intervals,
            est_intervals,
            trim=True,
        )

    match05, errors05 = event_match_summary(ref, est, primary_window)
    if abs(float(f05) - match05["fMeasure"]) > 1e-6:
        raise RuntimeError(
            f"Section F-measure implementation mismatch: "
            f"mir_eval={float(f05)}, counted={match05['fMeasure']}"
        )

    return {
        "referenceBoundaryCount": int(len(ref)),
        "estimatedBoundaryCount": int(len(est)),
        "primary500ms": {
            "precision": rounded(p05),
            "recall": rounded(r05),
            "fMeasure": rounded(f05),
            "falsePositives": match05["falsePositives"],
            "omissions": match05["omissions"],
        },
        "diagnostic3s": {
            "precision": rounded(p3),
            "recall": rounded(r3),
            "fMeasure": rounded(f3),
        },
        "boundaryDeviationSeconds": {
            "referenceToEstimatedMedian": rounded(ref_to_est),
            "estimatedToReferenceMedian": rounded(est_to_ref),
        },
        "matchedAbsoluteErrorSeconds500ms": {
            "median": percentile(errors05, 50),
            "p95": percentile(errors05, 95),
        },
    }


def relative_close(value, target, tolerance):
    value = finite_float(value)
    target = finite_float(target)
    if value is None or target is None or target <= 0:
        return False
    return abs(value - target) / target <= float(tolerance)


def bpm_category(estimated_bpm, reference_bpm, tolerance=0.03):
    estimated = finite_float(estimated_bpm)
    reference = finite_float(reference_bpm)
    if estimated is None or estimated <= 0 or reference is None or reference <= 0:
        return "UNKNOWN"
    if relative_close(estimated, reference, tolerance):
        return "EXACT_METRIC_LEVEL"
    if relative_close(estimated, reference * 0.5, tolerance):
        return "HALF_TIME"
    if relative_close(estimated, reference * 2.0, tolerance):
        return "DOUBLE_TIME"
    return "OTHER"


def median_available(values):
    values = [finite_float(v) for v in values]
    values = [v for v in values if v is not None]
    return None if not values else round(float(np.median(values)), 6)


def analyze_family(v1, family, record, source, protocol):
    # Pure V1 instrumentation: stesse funzioni decode/onset/beat/meter/section
    # di audio-analysis.py; il sorgente baseline resta invariato.
    technical = v1.probe(source)
    y = v1.decode_audio(source)
    onset, beats, tempo = v1.tempo_and_beats(y)
    meter = v1.meter_candidate(onset, beats)
    sections = v1.section_candidates(y, beats, technical["durationSeconds"])

    beat_times_full = v1.librosa.frames_to_time(
        beats,
        sr=v1.SR,
        hop_length=v1.HOP,
    )
    beat_times_full = np.asarray(beat_times_full, dtype=float)

    beat_cfg = protocol["metrics"]["beatGrid"]
    f_window = float(beat_cfg["primary"]["matchingWindowSeconds"])
    cemgil_sigma = float(beat_cfg["secondary"][0]["sigmaSeconds"])

    window_results = []
    for window in family["beatReference"]["windows"]:
        start = float(window["startSeconds"])
        duration = float(window["durationSeconds"])
        end = start + duration
        selected = beat_times_full[
            (beat_times_full >= start) & (beat_times_full <= end)
        ] - start
        selected = [round(float(v), 6) for v in selected]
        metrics = beat_window_metrics(
            window["beatTimesSeconds"],
            selected,
            f_window=f_window,
            cemgil_sigma=cemgil_sigma,
        )
        matches = mir_eval.util.match_events(
            np.asarray(window["beatTimesSeconds"], dtype=float),
            np.asarray(selected, dtype=float),
            window=f_window,
        )
        window_results.append(
            {
                "position": window["position"],
                "startSeconds": round(start, 6),
                "durationSeconds": round(duration, 6),
                "estimatedBeatTimesSeconds": selected,
                "metrics": metrics,
                "_errors": [
                    abs(float(window["beatTimesSeconds"][i]) - float(selected[j]))
                    for i, j in matches
                ],
            }
        )

    beat_family = family_beat_aggregate(window_results)
    for item in window_results:
        item.pop("_errors", None)

    predicted_sections = [
        float(item["timeSeconds"])
        for item in sections.get("boundaries", [])
    ]
    section_cfg = protocol["metrics"]["sections"]
    section_result = section_metrics(
        family["sections"]["boundariesSeconds"],
        predicted_sections,
        family["decodedDurationSeconds"],
        primary_window=float(section_cfg["primary"]["matchingWindowSeconds"]),
        diagnostic_window=float(section_cfg["secondary"][0]["matchingWindowSeconds"]),
    )

    tolerance = float(protocol["metrics"]["bpm"]["relativeTolerance"])
    reference_bpm = float(family["beatReference"]["referenceBpm"])
    estimated_bpm = tempo.get("bpm")
    human_meter = family["meter"]["value"]
    estimated_meter = meter.get("value")

    return {
        "sourceRecordId": family["sourceRecordId"],
        "compositionFamilyId": family["compositionFamilyId"],
        "sourceSha256": family["sourceSha256"],
        "technical": technical,
        "bpm": {
            "reference": round(reference_bpm, 6),
            "estimated": rounded(estimated_bpm),
            "alternativeBpms": tempo.get("alternativeBpms", []),
            "category": bpm_category(estimated_bpm, reference_bpm, tolerance),
            "relativeTolerance": tolerance,
        },
        "meter": {
            "reference": human_meter,
            "estimatedCandidate": estimated_meter,
            "exactMatch": (
                estimated_meter == human_meter
                if estimated_meter is not None
                and human_meter not in ("AMBIGUOUS", "UNKNOWN")
                else None
            ),
            "diagnosticOnly": True,
            "candidate": meter,
        },
        "beatGrid": {
            "windows": window_results,
            "family": beat_family,
        },
        "sections": {
            "estimatedBoundariesSeconds": [
                round(v, 6) for v in predicted_sections
            ],
            "metrics": section_result,
            "candidate": sections,
        },
    }


def aggregate_report(families):
    bpm_counts = Counter(family["bpm"]["category"] for family in families)
    meter_values = [
        family["meter"]["exactMatch"]
        for family in families
        if family["meter"]["exactMatch"] is not None
    ]
    return {
        "families": len(families),
        "medianBeatFMeasure70ms": median_available(
            family["beatGrid"]["family"]["fMeasure70ms"]
            for family in families
        ),
        "medianSectionFMeasure500ms": median_available(
            family["sections"]["metrics"]["primary500ms"]["fMeasure"]
            for family in families
        ),
        "medianBeatCemgil40msMeanAcrossWindows": median_available(
            family["beatGrid"]["family"]["cemgil40msMeanAcrossWindows"]
            for family in families
        ),
        "bpmCategoryCounts": dict(sorted(bpm_counts.items())),
        "meterExactDiagnostics": {
            "comparableFamilies": len(meter_values),
            "exactFamilies": sum(value is True for value in meter_values),
        },
        "decisionStatus": "BASELINE_ONLY_NO_V2_COMPARISON",
        "holdoutObserved": False,
    }


def build_context(workspace, review_id):
    contract = require_contract()
    protocol = validate_protocol(contract)
    snapshot_path, snapshot, submission = validate_reference(
        workspace,
        review_id,
        contract,
        protocol,
    )
    manifest_path, selected = validate_manifest_and_sources(
        workspace,
        submission,
        protocol,
    )
    v1 = load_baseline_module()
    if getattr(v1, "TOOL_VERSION", None) != contract.get("baselineToolVersion"):
        raise RuntimeError("V1 TOOL_VERSION differs from frozen evaluation contract")
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe must both be available in PATH")

    return {
        "contract": contract,
        "protocol": protocol,
        "snapshotPath": snapshot_path,
        "snapshot": snapshot,
        "submission": submission,
        "manifestPath": manifest_path,
        "selected": selected,
        "v1": v1,
    }


def safe_run_id(value):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{2,79}", value or ""):
        raise RuntimeError("run-id must match [A-Za-z0-9][A-Za-z0-9._-]{2,79}")
    return value


def preflight_result(workspace, review_id, context):
    return {
        "mode": "PREFLIGHT_PASS",
        "workspace": str(workspace),
        "split": DEVELOPMENT_SPLIT,
        "reviewId": review_id,
        "families": len(context["selected"]),
        "baselineToolVersion": context["v1"].TOOL_VERSION,
        "baselineSourceGitBlobSha1": git_blob_sha1(BASELINE_FILE),
        "protocolDigestSha256": sha256_file(PROTOCOL_FILE),
        "submissionDigestSha256": context["snapshot"]["submissionDigestSha256"],
        "mirEvalVersion": mir_eval.__version__,
        "holdoutObserved": False,
        "trainingAuthorized": False,
    }


def evaluate(workspace, review_id, run_id, context):
    run_id = safe_run_id(run_id)
    runs_root = workspace / "runs" / "audio-analysis-evaluation-v1"
    final_dir = runs_root / run_id
    if final_dir.exists():
        raise RuntimeError(f"Append-only evaluation run already exists: {final_dir}")

    results = []
    for index, (family, record, source) in enumerate(context["selected"], 1):
        print(
            f"[{index}/{len(context['selected'])}] V1 evaluate "
            f"{family['sourceRecordId']}",
            file=sys.stderr,
            flush=True,
        )
        results.append(
            analyze_family(
                context["v1"],
                family,
                record,
                source,
                context["protocol"],
            )
        )

    report = {
        "schema": SCHEMA,
        "version": VERSION,
        "mode": "DEVELOPMENT_BASELINE",
        "evaluatorVersion": EVALUATOR_VERSION,
        "runId": run_id,
        "split": DEVELOPMENT_SPLIT,
        "holdoutObserved": False,
        "trainingAuthorized": False,
        "sourceSeparationAuthorized": False,
        "audioToMidiAuthorized": False,
        "provenance": {
            "codeCommit": git_commit(),
            "baselineToolVersion": context["v1"].TOOL_VERSION,
            "baselineSourceGitBlobSha1": git_blob_sha1(BASELINE_FILE),
            "evaluationImplementationDigestSha256": sha256_file(CONTRACT_FILE),
            "protocolDigestSha256": sha256_file(PROTOCOL_FILE),
            "dependencyLockHashSha256": dependency_lock_hash(),
            "mirEvalVersion": mir_eval.__version__,
            "humanReferenceReviewId": review_id,
            "humanReferenceSubmissionDigestSha256": (
                context["snapshot"]["submissionDigestSha256"]
            ),
            "humanReferenceSnapshotPath": str(context["snapshotPath"]),
            "manifestPath": str(context["manifestPath"]),
        },
        "implementation": context["contract"]["implementation"],
        "referenceAnnotationCost": {
            "interpretation": (
                "GROUND_TRUTH_CREATION_COST_ONLY_NOT_V1_CANDIDATE_REVIEW_COST"
            ),
            "familySeconds": {
                family["sourceRecordId"]: family["reviewCostSeconds"]
                for family in context["submission"]["families"]
            },
            "candidateReviewCostAvailable": False,
        },
        "families": results,
        "aggregate": aggregate_report(results),
    }

    temp_dir = runs_root / f".{run_id}.tmp-{uuid.uuid4().hex}"
    runs_root.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir(parents=False, exist_ok=False)
    try:
        report_path = temp_dir / "report.json"
        report_path.write_text(stable_json(report), encoding="utf-8")
        if final_dir.exists():
            raise RuntimeError(f"Append-only evaluation run appeared concurrently: {final_dir}")
        temp_dir.rename(final_dir)
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return final_dir / "report.json", report


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Evaluate the frozen V1 Owned Beats audio-analysis baseline "
            "against the finalized development Human Reference."
        )
    )
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
    summary = {
        "mode": report["mode"],
        "runId": report["runId"],
        "reportPath": str(report_path),
        "families": report["aggregate"]["families"],
        "medianBeatFMeasure70ms": report["aggregate"]["medianBeatFMeasure70ms"],
        "medianSectionFMeasure500ms": report["aggregate"]["medianSectionFMeasure500ms"],
        "bpmCategoryCounts": report["aggregate"]["bpmCategoryCounts"],
        "meterExactDiagnostics": report["aggregate"]["meterExactDiagnostics"],
        "decisionStatus": report["aggregate"]["decisionStatus"],
        "holdoutObserved": False,
    }
    print(stable_json(summary), end="")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
