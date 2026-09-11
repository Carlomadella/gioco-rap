#!/usr/bin/env python3
"""
FAME Neural — diagnostica sezioni V1.

Non modifica audio-analysis.py e non apre l'holdout.
Riproduce il trace del detector sezioni V1 congelato e rende osservabili:
- curva robust_z;
- picchi selezionati dal V1;
- picchi locali scartati;
- relazione tra boundary umane e picchi V1 a 0.5s / 3s.

L'output è diagnostico: non modifica soglie e non costituisce una candidata V2.
"""

import argparse
import hashlib
import importlib.util
import json
import math
import re
import sys
import uuid
from collections import Counter
from pathlib import Path

import mir_eval
import numpy as np
from scipy.signal import find_peaks, peak_prominences

SCHEMA = "fame-owned-beats-audio-analysis-section-diagnostics-v1"
VERSION = 1
DEVELOPMENT_SPLIT = "development"
DEFAULT_REVIEW_ID = "audio-analysis-v2-dev-reference-precision-v3"
DEFAULT_BASELINE_RUN_ID = "v1-baseline-development-002"
DEFAULT_RUN_ID = "sections-v1-baseline002-diagnostic-001"

HERE = Path(__file__).resolve().parent
V1_FILE = HERE / "audio-analysis.py"

STRICT_HEIGHT = 2.5
STRICT_DISTANCE = 8
STRICT_PROMINENCE = 0.5
EDGE_MARGIN_SECONDS = 2.0


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


def load_v1():
    spec = importlib.util.spec_from_file_location("fame_audio_analysis_v1_diag", V1_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load audio-analysis.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def finite(value):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None


def rounded(value, digits=6):
    value = finite(value)
    return None if value is None else round(value, digits)


def strict_boundaries_from_trace(v1, robust_z, beats, duration):
    peaks, properties = find_peaks(
        robust_z,
        height=STRICT_HEIGHT,
        distance=STRICT_DISTANCE,
        prominence=STRICT_PROMINENCE,
    )
    beat_times = v1.librosa.frames_to_time(beats, sr=v1.SR, hop_length=v1.HOP)
    rows = []
    for idx, peak in enumerate(peaks):
        beat_index = int(peak + 1)
        if beat_index >= len(beat_times):
            continue
        t = float(beat_times[beat_index])
        if t < EDGE_MARGIN_SECONDS or t > duration - EDGE_MARGIN_SECONDS:
            continue
        rows.append(
            {
                "traceIndex": int(peak),
                "beatIndex": beat_index,
                "timeSeconds": round(t, 6),
                "robustZ": round(float(robust_z[peak]), 6),
                "prominence": round(float(properties["prominences"][idx]), 6),
            }
        )
    return rows


def local_peaks_from_trace(v1, robust_z, beats, duration, strict_indices):
    local, _ = find_peaks(robust_z)
    prominences = peak_prominences(robust_z, local)[0] if len(local) else np.asarray([])
    beat_times = v1.librosa.frames_to_time(beats, sr=v1.SR, hop_length=v1.HOP)
    rows = []
    strict_indices = set(int(v) for v in strict_indices)
    for idx, peak in enumerate(local):
        beat_index = int(peak + 1)
        if beat_index >= len(beat_times):
            continue
        t = float(beat_times[beat_index])
        if t < EDGE_MARGIN_SECONDS or t > duration - EDGE_MARGIN_SECONDS:
            continue
        rows.append(
            {
                "traceIndex": int(peak),
                "beatIndex": beat_index,
                "timeSeconds": round(t, 6),
                "robustZ": round(float(robust_z[peak]), 6),
                "prominence": round(float(prominences[idx]), 6),
                "selectedByV1": int(peak) in strict_indices,
            }
        )
    return rows


def section_trace(v1, y, beats, duration):
    if len(beats) < 16:
        return {
            "status": "UNKNOWN_TOO_FEW_BEATS",
            "beatCount": int(len(beats)),
            "robustZ": [],
            "strictPeaks": [],
            "localPeaks": [],
        }

    mfcc = v1.librosa.feature.mfcc(y=y, sr=v1.SR, n_mfcc=13, hop_length=v1.HOP)
    chroma = v1.librosa.feature.chroma_stft(y=y, sr=v1.SR, hop_length=v1.HOP)
    last_frame = min(mfcc.shape[1], chroma.shape[1]) - 1
    frames = np.clip(beats, 0, last_frame)

    features = np.vstack([mfcc[:, frames], chroma[:, frames]]).astype(float)
    features = features - features.mean(axis=1, keepdims=True)
    features = features / (features.std(axis=1, keepdims=True) + 1e-9)

    change = np.linalg.norm(np.diff(features, axis=1), axis=0)
    smooth = np.convolve(change, np.ones(5) / 5.0, mode="same")
    median = float(np.median(smooth))
    mad = float(np.median(np.abs(smooth - median))) + 1e-9
    robust_z = (smooth - median) / (1.4826 * mad)

    strict, _ = find_peaks(
        robust_z,
        height=STRICT_HEIGHT,
        distance=STRICT_DISTANCE,
        prominence=STRICT_PROMINENCE,
    )
    strict_rows = strict_boundaries_from_trace(v1, robust_z, beats, duration)
    local_rows = local_peaks_from_trace(v1, robust_z, beats, duration, strict)

    return {
        "status": "TRACE_AVAILABLE",
        "beatCount": int(len(beats)),
        "parameters": {
            "height": STRICT_HEIGHT,
            "distanceBeats": STRICT_DISTANCE,
            "prominence": STRICT_PROMINENCE,
            "edgeMarginSeconds": EDGE_MARGIN_SECONDS,
            "smoothingBeats": 5,
        },
        "medianSmooth": round(median, 6),
        "madSmooth": round(mad, 6),
        "robustZ": [round(float(v), 6) for v in robust_z],
        "strictPeaks": strict_rows,
        "localPeaks": local_rows,
    }


def match_pairs(reference, estimated, tolerance):
    ref = np.asarray(reference, dtype=float)
    est = np.asarray(estimated, dtype=float)
    matches = mir_eval.util.match_events(ref, est, window=float(tolerance))
    return [(int(i), int(j)) for i, j in matches]


def nearest_row(time_seconds, rows):
    if not rows:
        return None
    row = min(rows, key=lambda x: abs(float(x["timeSeconds"]) - float(time_seconds)))
    result = dict(row)
    result["absoluteErrorSeconds"] = round(
        abs(float(row["timeSeconds"]) - float(time_seconds)), 6
    )
    return result


def classify_reference(ref_time, selected_rows, local_rows):
    selected = nearest_row(ref_time, selected_rows)
    local = nearest_row(ref_time, local_rows)

    if selected is not None and selected["absoluteErrorSeconds"] <= 0.5:
        label = "MATCH_500MS"
    elif selected is not None and selected["absoluteErrorSeconds"] <= 3.0:
        label = "MATCH_3S_ONLY"
    elif local is not None and local["absoluteErrorSeconds"] <= 0.5:
        if float(local["robustZ"]) < STRICT_HEIGHT:
            label = "LOCAL_PEAK_BELOW_HEIGHT"
        elif float(local["prominence"]) < STRICT_PROMINENCE:
            label = "LOCAL_PEAK_BELOW_PROMINENCE"
        elif not local["selectedByV1"]:
            label = "LOCAL_PEAK_DISTANCE_SUPPRESSED_OR_FILTERED"
        else:
            label = "SELECTED_PEAK_OUTSIDE_500MS"
    elif local is not None and local["absoluteErrorSeconds"] <= 3.0:
        label = "LOCAL_PEAK_WITHIN_3S_NOT_SELECTED"
    else:
        label = "NO_LOCAL_PEAK_WITHIN_3S"

    return {
        "referenceTimeSeconds": round(float(ref_time), 6),
        "classification": label,
        "nearestSelectedPeak": selected,
        "nearestLocalPeak": local,
    }


def safe_run_id(value):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{2,79}", value or ""):
        raise RuntimeError("Invalid run-id")
    return value


def analyze(workspace, baseline_report_path, review_id, run_id):
    workspace = Path(workspace).resolve()
    baseline_report_path = Path(baseline_report_path).resolve()

    baseline = read_json(baseline_report_path)
    if baseline.get("runId") != DEFAULT_BASELINE_RUN_ID:
        raise RuntimeError("Diagnostics v1 requires v1-baseline-development-002")
    if baseline.get("provenance", {}).get("humanReferenceReviewId") != review_id:
        raise RuntimeError("Baseline/reference reviewId mismatch")
    if baseline.get("holdoutObserved") is not False:
        raise RuntimeError("Holdout must remain unobserved")

    snapshot_path = (
        workspace
        / "references"
        / "audio-analysis-v2"
        / DEVELOPMENT_SPLIT
        / f"{review_id}.json"
    )
    snapshot = read_json(snapshot_path)
    submission = snapshot.get("submission")
    if not isinstance(submission, dict):
        raise RuntimeError("Human Reference snapshot has no submission")
    if submission.get("candidateOutputsExposed") is not False:
        raise RuntimeError("Candidate outputs exposed in reference")

    reference_by_id = {
        family["sourceRecordId"]: family
        for family in submission["families"]
    }
    manifest = read_json(workspace / "manifest" / "owned-beats-manifest.json")
    records = {r.get("sourceRecordId"): r for r in manifest["records"]}

    v1 = load_v1()
    families = []

    for index, baseline_family in enumerate(baseline["families"], 1):
        rid = baseline_family["sourceRecordId"]
        print(f"[{index}/8] section diagnostic {rid}", file=sys.stderr, flush=True)

        family = reference_by_id[rid]
        record = records.get(rid)
        if not record or record.get("split") != DEVELOPMENT_SPLIT:
            raise RuntimeError(f"Invalid/missing development manifest record: {rid}")

        source = workspace / record["localPath"]
        if sha256_file(source) != family["sourceSha256"]:
            raise RuntimeError(f"Source SHA mismatch: {rid}")

        y = v1.decode_audio(source)
        onset, beats, tempo = v1.tempo_and_beats(y)
        trace = section_trace(v1, y, beats, float(family["decodedDurationSeconds"]))

        selected = [row["timeSeconds"] for row in trace["strictPeaks"]]
        frozen_estimated = baseline_family["sections"]["estimatedBoundariesSeconds"]
        if len(selected) != len(frozen_estimated) or any(
            abs(float(a) - float(b)) > 1e-6
            for a, b in zip(selected, frozen_estimated)
        ):
            raise RuntimeError(
                f"Diagnostic trace does not reproduce frozen V1 sections: {rid}"
            )

        reference = [float(v) for v in family["sections"]["boundariesSeconds"]]
        match05 = match_pairs(reference, selected, 0.5)
        match3 = match_pairs(reference, selected, 3.0)

        frozen_metrics = baseline_family["sections"]["metrics"]
        if len(match05) != (
            len(reference) - int(frozen_metrics["primary500ms"]["omissions"])
        ):
            raise RuntimeError(f"0.5s match count differs from baseline002: {rid}")

        refs = [
            classify_reference(ref_time, trace["strictPeaks"], trace["localPeaks"])
            for ref_time in reference
        ]

        rejected = [
            row for row in trace["localPeaks"]
            if not row["selectedByV1"]
        ]
        rejected.sort(
            key=lambda x: (float(x["robustZ"]), float(x["prominence"])),
            reverse=True,
        )

        families.append(
            {
                "sourceRecordId": rid,
                "compositionFamilyId": family["compositionFamilyId"],
                "referenceBoundaryCount": len(reference),
                "selectedBoundaryCount": len(selected),
                "matches500ms": len(match05),
                "matches3s": len(match3),
                "referenceBoundariesSeconds": [round(v, 6) for v in reference],
                "selectedBoundariesSeconds": selected,
                "referenceDiagnostics": refs,
                "topRejectedLocalPeaks": rejected[:12],
                "trace": trace,
            }
        )

    classifications = Counter(
        item["classification"]
        for family in families
        for item in family["referenceDiagnostics"]
    )
    aggregate = {
        "families": len(families),
        "referenceBoundaryCount": sum(f["referenceBoundaryCount"] for f in families),
        "selectedBoundaryCount": sum(f["selectedBoundaryCount"] for f in families),
        "matches500ms": sum(f["matches500ms"] for f in families),
        "matches3s": sum(f["matches3s"] for f in families),
        "zeroSelectedFamilies": sum(f["selectedBoundaryCount"] == 0 for f in families),
        "referenceClassificationCounts": dict(sorted(classifications.items())),
        "holdoutObserved": False,
        "interpretation": "DIAGNOSTIC_ONLY_NO_V2_TUNING_APPLIED",
    }

    run_id = safe_run_id(run_id)
    root = workspace / "runs" / "audio-analysis-section-diagnostics-v1"
    final_dir = root / run_id
    if final_dir.exists():
        raise RuntimeError(f"Append-only diagnostic run already exists: {final_dir}")
    temp_dir = root / f".{run_id}.tmp-{uuid.uuid4().hex}"
    root.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir()

    result = {
        "schema": SCHEMA,
        "version": VERSION,
        "runId": run_id,
        "split": DEVELOPMENT_SPLIT,
        "reviewId": review_id,
        "humanReferenceSubmissionDigestSha256": snapshot["submissionDigestSha256"],
        "baselineRunId": baseline["runId"],
        "baselineReportSha256": sha256_file(baseline_report_path),
        "baselineCodeCommit": baseline["provenance"]["codeCommit"],
        "baselineSourceGitBlobSha1": baseline["provenance"]["baselineSourceGitBlobSha1"],
        "sectionDetector": {
            "method": "beat-feature-change-v1",
            "sourceFile": str(V1_FILE),
            "sourceGitBlobSha1ExpectedFromBaseline": baseline["provenance"][
                "baselineSourceGitBlobSha1"
            ],
            "parameters": {
                "height": STRICT_HEIGHT,
                "distanceBeats": STRICT_DISTANCE,
                "prominence": STRICT_PROMINENCE,
                "edgeMarginSeconds": EDGE_MARGIN_SECONDS,
                "smoothingBeats": 5,
            },
        },
        "aggregate": aggregate,
        "families": families,
    }

    try:
        report_path = temp_dir / "report.json"
        report_path.write_text(stable_json(result), encoding="utf-8")
        temp_dir.rename(final_dir)
    except Exception:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return final_dir / "report.json", result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("workspace")
    parser.add_argument("--baseline-report", required=True)
    parser.add_argument("--review-id", default=DEFAULT_REVIEW_ID)
    parser.add_argument("--run-id", default=DEFAULT_RUN_ID)
    args = parser.parse_args()

    path, result = analyze(
        args.workspace,
        args.baseline_report,
        args.review_id,
        args.run_id,
    )

    summary = {
        "mode": "SECTION_DIAGNOSTIC",
        "runId": result["runId"],
        "reportPath": str(path),
        **result["aggregate"],
    }
    print(stable_json(summary), end="")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)