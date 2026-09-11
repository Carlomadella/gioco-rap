#!/usr/bin/env python3
"""Paired development comparison: V2 config-001 vs frozen V1 baseline002."""
import argparse
import hashlib
import json
import statistics
import uuid
from pathlib import Path

BASELINE_RUN_ID = "v1-baseline-development-002"
CANDIDATE_RUN_ID = "v2-config-001-development-001"
COMPARISON_RUN_ID = "v2-config-001-vs-v1-baseline002-001"
REFERENCE_ID = "audio-analysis-v2-dev-reference-precision-v3"
REFERENCE_DIGEST = "6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af"
BASELINE_REPORT_SHA256 = "4bebe4af0ed4bd8b0d1796432c54099c1705a3494d258c2eb10bc85033e2b714"


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


def median(values):
    return round(float(statistics.median(values)), 6)


def metric_decision(beat_delta, section_delta, technical_integrity):
    beat_noninferior = beat_delta >= -0.02
    section_noninferior = section_delta >= -0.03
    material = beat_delta >= 0.03 or section_delta >= 0.05

    if not technical_integrity or not beat_noninferior or not section_noninferior:
        return {
            "metricGate": "V1_WINS",
            "officialDevelopmentDecision": "V1_WINS",
            "holdoutMayOpen": False,
            "reason": "technical failure or target non-inferiority break",
        }

    if material:
        return {
            "metricGate": "V2_WINS_METRICALLY",
            "officialDevelopmentDecision": "INCONCLUSIVE_REVIEW_PENDING",
            "holdoutMayOpen": False,
            "reason": (
                "metric gate passes, but required candidate human correction-cost "
                "review is not yet complete"
            ),
        }

    return {
        "metricGate": "INCONCLUSIVE",
        "officialDevelopmentDecision": "INCONCLUSIVE",
        "holdoutMayOpen": False,
        "reason": "non-inferior but no target metric reaches material-improvement threshold",
    }


def compare(workspace, candidate_run_id, comparison_run_id):
    workspace = Path(workspace).resolve()

    baseline_path = (
        workspace / "runs" / "audio-analysis-evaluation-v1"
        / BASELINE_RUN_ID / "report.json"
    )
    candidate_path = (
        workspace / "runs" / "audio-analysis-evaluation-v2"
        / candidate_run_id / "report.json"
    )
    if not baseline_path.is_file() or not candidate_path.is_file():
        raise RuntimeError("Baseline002 or V2 candidate report missing")

    if sha256_file(baseline_path) != BASELINE_REPORT_SHA256:
        raise RuntimeError("baseline002 report digest mismatch")

    baseline = read_json(baseline_path)
    candidate = read_json(candidate_path)

    if baseline.get("holdoutObserved") is not False or candidate.get("holdoutObserved") is not False:
        raise RuntimeError("Holdout must remain unobserved")

    for report in (baseline, candidate):
        provenance = report.get("provenance", {})
        if (
            provenance.get("humanReferenceReviewId") != REFERENCE_ID
            or provenance.get("humanReferenceSubmissionDigestSha256") != REFERENCE_DIGEST
        ):
            raise RuntimeError("Paired comparison reference mismatch")

    if candidate.get("candidateId") != "audio-analysis-v2-config-001":
        raise RuntimeError("Unexpected V2 candidateId")

    base_by = {f["sourceRecordId"]: f for f in baseline["families"]}
    cand_by = {f["sourceRecordId"]: f for f in candidate["families"]}
    if set(base_by) != set(cand_by) or len(base_by) != 8:
        raise RuntimeError("Paired family set mismatch")

    families = []
    beat_invariance = True
    for rid in sorted(base_by):
        b = base_by[rid]
        c = cand_by[rid]

        same_beat = (
            b["bpm"] == c["bpm"]
            and b["meter"] == c["meter"]
            and b["beatGrid"] == c["beatGrid"]
        )
        beat_invariance = beat_invariance and same_beat

        beat_b = float(b["beatGrid"]["family"]["fMeasure70ms"])
        beat_c = float(c["beatGrid"]["family"]["fMeasure70ms"])
        sec_b = float(b["sections"]["metrics"]["primary500ms"]["fMeasure"])
        sec_c = float(c["sections"]["metrics"]["primary500ms"]["fMeasure"])

        families.append({
            "sourceRecordId": rid,
            "beatF1V1": round(beat_b, 6),
            "beatF1V2": round(beat_c, 6),
            "beatDelta": round(beat_c - beat_b, 6),
            "sectionF1V1": round(sec_b, 6),
            "sectionF1V2": round(sec_c, 6),
            "sectionDelta": round(sec_c - sec_b, 6),
            "sectionBoundariesV1": len(b["sections"]["estimatedBoundariesSeconds"]),
            "sectionBoundariesV2": len(c["sections"]["estimatedBoundariesSeconds"]),
            "sectionFalsePositivesV1": b["sections"]["metrics"]["primary500ms"]["falsePositives"],
            "sectionFalsePositivesV2": c["sections"]["metrics"]["primary500ms"]["falsePositives"],
            "sectionOmissionsV1": b["sections"]["metrics"]["primary500ms"]["omissions"],
            "sectionOmissionsV2": c["sections"]["metrics"]["primary500ms"]["omissions"],
            "beatOutputsExactlyInvariant": same_beat,
        })

    beat_delta = median([f["beatDelta"] for f in families])
    section_delta = median([f["sectionDelta"] for f in families])

    decision = metric_decision(
        beat_delta,
        section_delta,
        technical_integrity=beat_invariance,
    )

    report = {
        "schema": "fame-owned-beats-audio-analysis-v2-paired-development-comparison",
        "version": 1,
        "runId": comparison_run_id,
        "split": "development",
        "candidateId": candidate["candidateId"],
        "configurationIndex": candidate["configurationIndex"],
        "baselineRunId": BASELINE_RUN_ID,
        "candidateRunId": candidate_run_id,
        "humanReferenceReviewId": REFERENCE_ID,
        "humanReferenceSubmissionDigestSha256": REFERENCE_DIGEST,
        "holdoutObserved": False,
        "technicalIntegrity": {
            "pass": beat_invariance,
            "beatTrackerOutputsExactlyInvariant": beat_invariance,
            "sameFamilySet": True,
            "sameHumanReference": True,
        },
        "pairedMedianDeltas": {
            "beatFMeasure70ms": beat_delta,
            "sectionFMeasure500ms": section_delta,
        },
        "thresholds": {
            "beatFMeasure70ms": {
                "materialImprovement": 0.03,
                "nonInferiorityFloor": -0.02,
            },
            "sectionFMeasure500ms": {
                "materialImprovement": 0.05,
                "nonInferiorityFloor": -0.03,
            },
        },
        "candidateReviewCost": {
            "available": False,
            "status": "REQUIRED_REVIEW_PENDING_BEFORE_V2_WINS_AND_HOLDOUT",
        },
        "families": families,
        "decision": decision,
    }

    root = workspace / "runs" / "audio-analysis-v2-comparisons"
    final_dir = root / comparison_run_id
    if final_dir.exists():
        raise RuntimeError(f"Append-only comparison already exists: {final_dir}")
    temp_dir = root / f".{comparison_run_id}.tmp-{uuid.uuid4().hex}"
    root.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir()
    try:
        path = temp_dir / "report.json"
        path.write_text(stable_json(report), encoding="utf-8")
        temp_dir.rename(final_dir)
    except Exception:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return final_dir / "report.json", report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("workspace")
    parser.add_argument("--candidate-run-id", default=CANDIDATE_RUN_ID)
    parser.add_argument("--comparison-run-id", default=COMPARISON_RUN_ID)
    args = parser.parse_args()

    path, report = compare(
        args.workspace,
        args.candidate_run_id,
        args.comparison_run_id,
    )
    print(stable_json({
        "mode": "PAIRED_DEVELOPMENT_COMPARISON",
        "reportPath": str(path),
        "candidateId": report["candidateId"],
        "pairedMedianDeltas": report["pairedMedianDeltas"],
        "technicalIntegrity": report["technicalIntegrity"],
        "decision": report["decision"],
        "holdoutObserved": False,
    }), end="")


if __name__ == "__main__":
    main()
