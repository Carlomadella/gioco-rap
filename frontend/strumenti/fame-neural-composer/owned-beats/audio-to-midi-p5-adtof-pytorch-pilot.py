#!/usr/bin/env python3
"""Development-only ADTOF-pytorch five-class drum pilot on FAME000126."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import uuid

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-to-midi-p5-adtof-pytorch-pilot-v1.json"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def stable_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git_output(source_root: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(source_root), *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout.strip()


def git_porcelain_status(source_root: Path) -> str:
    proc = subprocess.run(
        ["git", "-C", str(source_root), "status", "--porcelain"],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout.rstrip("\r\n")


def classify_porcelain_status(status: str) -> tuple[list[str], list[str], list[str]]:
    allowed_generated_prefixes = ("src/adtof_pytorch.egg-info/",)
    unsafe_tracked_dirty: list[str] = []
    generated_tracked_dirty: list[str] = []
    untracked_build_artifacts: list[str] = []

    for raw_line in status.splitlines():
        if not raw_line:
            continue
        if raw_line.startswith("?? "):
            untracked_build_artifacts.append(raw_line[3:].replace("\\", "/"))
            continue
        if len(raw_line) < 4 or raw_line[2] != " ":
            unsafe_tracked_dirty.append(raw_line)
            continue

        changed_path = raw_line[3:].replace("\\", "/").strip()
        if changed_path.startswith(allowed_generated_prefixes):
            generated_tracked_dirty.append(changed_path)
        else:
            unsafe_tracked_dirty.append(raw_line)

    return unsafe_tracked_dirty, generated_tracked_dirty, untracked_build_artifacts


def validate_protocol() -> dict:
    p = read_json(PROTOCOL_FILE)
    inf = p.get("inference", {})
    ext = p.get("externalSource", {})
    safety = p.get("safety", {})
    labels = inf.get("labels", [])

    if (
        p.get("schema") != "fame-owned-beats-audio-to-midi-p5-adtof-pytorch-pilot-v1"
        or p.get("version") != 1
        or p.get("status") != "FROZEN_BEFORE_ADTOF_PILOT_AUDIO_ACCESS"
        or p.get("sourceRecordId") != "FAME000126"
        or ext.get("commit") != "85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9"
        or ext.get("weightGitBlobSha1") != "773d228e4a4250ed278aecb9fe61e5d0ed611324"
        or ext.get("productionPromotionAllowed") is not False
        or inf.get("fps") != 100
        or inf.get("thresholds") != [0.22, 0.24, 0.32, 0.22, 0.30]
        or [x.get("pitch") for x in labels] != [35, 38, 47, 42, 49]
        or [x.get("role") for x in labels] != ["kick", "snare", "tom", "hihat", "cymbal"]
        or inf.get("retuningAllowed") is not False
    ):
        raise RuntimeError("ADTOF pilot protocol mismatch")

    required_false = (
        "originalSourceAudioAccessAllowed",
        "independentEvaluationAccessAllowed",
        "finalHoldoutAccessAllowed",
        "sourceSeparationExecutionAllowed",
        "trainingAuthorized",
        "batch131Authorized",
        "taskDataReadyMayBeDeclared",
    )
    if (
        safety.get("split") != "development"
        or safety.get("sourceSeparationStemAccessAllowed") is not True
        or any(safety.get(key) is not False for key in required_false)
    ):
        raise RuntimeError("Unsafe ADTOF pilot protocol")
    return p


def validate_environment(workspace: Path, protocol: dict) -> dict:
    runtime = protocol["runtime"]
    ext = protocol["externalSource"]
    source_root = workspace / runtime["sourceRelativePath"]
    if not source_root.is_dir():
        raise RuntimeError(f"ADTOF source missing: {source_root}")

    head = git_output(source_root, "rev-parse", "HEAD")
    if head != ext["commit"]:
        raise RuntimeError(f"ADTOF source HEAD mismatch: {head}")

    status = git_porcelain_status(source_root)
    (
        unsafe_tracked_dirty,
        generated_tracked_dirty,
        untracked_build_artifacts,
    ) = classify_porcelain_status(status)
    if unsafe_tracked_dirty:
        raise RuntimeError(
            "ADTOF pinned source has unsafe tracked modifications: "
            + " | ".join(unsafe_tracked_dirty)
        )

    weight = source_root / ext["weightRelativePath"]
    if not weight.is_file():
        raise RuntimeError(f"ADTOF bundled weights missing: {weight}")
    blob = git_output(source_root, "hash-object", str(weight))
    if blob != ext["weightGitBlobSha1"]:
        raise RuntimeError("ADTOF bundled weight Git blob mismatch")

    return {
        "sourceRoot": source_root,
        "weightFile": weight,
        "sourceHead": head,
        "weightGitBlobSha1": blob,
        "weightSha256": sha256_file(weight),
        "generatedTrackedArtifacts": generated_tracked_dirty,
        "untrackedBuildArtifacts": untracked_build_artifacts,
    }


def validate_development_stem(workspace: Path, protocol: dict) -> dict:
    run_id = protocol["sourceSeparation"]["runId"]
    rid = protocol["sourceRecordId"]
    root = workspace / "runs" / "source-separation-development-inference" / run_id
    receipt_file = root / "execution-receipt.json"
    result_file = root / "results" / f"{rid}.json"

    for file in (receipt_file, result_file):
        if not file.is_file():
            raise RuntimeError(f"Required frozen source-separation artifact missing: {file}")

    receipt = read_json(receipt_file)
    result = read_json(result_file)
    if receipt.get("status") != "AUTHORIZED_NO_INFERENCE":
        raise RuntimeError("Unexpected source-separation receipt status")
    safety = receipt.get("safety", {})
    if safety.get("split") != "development" or safety.get("finalHoldoutExcluded") is not True:
        raise RuntimeError("Source-separation split safety mismatch")

    row = next(
        (x for x in receipt.get("sources", []) if x.get("sourceRecordId") == rid),
        None,
    )
    if row is None:
        raise RuntimeError(f"Development source not found in receipt: {rid}")

    stem = root / Path(row["outputRelativePath"]) / "drums.wav"
    expected = (
        (result.get("adapterResult") or {})
        .get("stems", {})
        .get("drums", {})
        .get("sha256")
    )
    if not stem.is_file() or not expected or sha256_file(stem) != expected:
        raise RuntimeError("Frozen FAME000126 drums stem SHA mismatch")

    return {
        "stem": stem,
        "stemSha256": expected,
        "compositionFamilyId": row.get("compositionFamilyId"),
    }


def preflight(workspace_root: str) -> dict:
    workspace = Path(workspace_root).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")

    protocol = validate_protocol()
    env = validate_environment(workspace, protocol)
    stem = validate_development_stem(workspace, protocol)

    import torch
    import adtof_pytorch
    from adtof_pytorch import FRAME_RNN_THRESHOLDS, LABELS_5, get_default_weights_path

    if str(torch.__version__).split("+", 1)[0] != protocol["runtime"]["torchVersion"]:
        raise RuntimeError(f"Unexpected torch version: {torch.__version__}")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; CPU fallback forbidden for this pilot")

    if list(LABELS_5) != [35, 38, 47, 42, 49]:
        raise RuntimeError(f"ADTOF LABELS_5 changed: {list(LABELS_5)}")
    if [float(x) for x in FRAME_RNN_THRESHOLDS] != [0.22, 0.24, 0.32, 0.22, 0.30]:
        raise RuntimeError(f"ADTOF default thresholds changed: {FRAME_RNN_THRESHOLDS}")

    installed_weight = Path(get_default_weights_path() or "")
    if not installed_weight.is_file():
        raise RuntimeError("Installed ADTOF packaged weights missing")

    return {
        "mode": "FAME_ADTOF_PYTORCH_PILOT_PREFLIGHT_PASS",
        "runId": protocol["runId"],
        "sourceRecordId": protocol["sourceRecordId"],
        "sourceHead": env["sourceHead"],
        "sourceWeightSha256": env["weightSha256"],
        "installedWeightSha256": sha256_file(installed_weight),
        "generatedTrackedArtifacts": env["generatedTrackedArtifacts"],
        "untrackedBuildArtifacts": env["untrackedBuildArtifacts"],
        "labels": list(LABELS_5),
        "thresholds": [float(x) for x in FRAME_RNN_THRESHOLDS],
        "torchVersion": str(torch.__version__),
        "cudaAvailable": True,
        "deviceName": torch.cuda.get_device_name(0),
        "stemSha256": stem["stemSha256"],
        "productionPromotionAllowed": False,
        "licenseStatus": protocol["externalSource"]["observedLicenseStatus"],
        "sourceAudioOpenedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "independentEvaluationAccessedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
    }


def execute(workspace_root: str) -> dict:
    workspace = Path(workspace_root).resolve()
    protocol = validate_protocol()
    env = validate_environment(workspace, protocol)
    source = validate_development_stem(workspace, protocol)

    import torch
    import pretty_midi
    from adtof_pytorch import (
        FRAME_RNN_THRESHOLDS,
        LABELS_5,
        get_default_weights_path,
        transcribe_to_midi,
    )

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; CPU fallback forbidden for this pilot")
    if list(LABELS_5) != [x["pitch"] for x in protocol["inference"]["labels"]]:
        raise RuntimeError("Installed ADTOF class mapping differs from frozen protocol")
    thresholds = [float(x) for x in protocol["inference"]["thresholds"]]
    if thresholds != [float(x) for x in FRAME_RNN_THRESHOLDS]:
        raise RuntimeError("Frozen pilot thresholds differ from installed ADTOF defaults")

    installed_weight = Path(get_default_weights_path() or "")
    if not installed_weight.is_file():
        raise RuntimeError("Installed ADTOF packaged weights missing")

    run_root = (
        workspace
        / "runs"
        / "audio-to-midi-p5-adtof-pytorch-pilot"
        / protocol["runId"]
    )
    if run_root.exists():
        raise RuntimeError(f"Append-only ADTOF pilot already exists: {run_root}")
    run_root.parent.mkdir(parents=True, exist_ok=True)
    temp = run_root.parent / f".{protocol['runId']}.tmp-{uuid.uuid4().hex}"
    family_dir = temp / protocol["sourceRecordId"]
    family_dir.mkdir(parents=True)

    try:
        midi_file = family_dir / "adtof-pytorch-drums.mid"
        transcribe_to_midi(
            source["stem"],
            midi_file,
            thresholds=thresholds,
            fps=int(protocol["inference"]["fps"]),
            weights=installed_weight,
            device="cuda",
        )
        if not midi_file.is_file() or midi_file.read_bytes()[:4] != b"MThd":
            raise RuntimeError("ADTOF did not produce a valid MIDI header")

        midi = pretty_midi.PrettyMIDI(str(midi_file))
        notes = [
            note
            for instrument in midi.instruments
            if instrument.is_drum
            for note in instrument.notes
        ]
        allowed = {int(x["pitch"]): x for x in protocol["inference"]["labels"]}
        bad = sorted({int(note.pitch) for note in notes if int(note.pitch) not in allowed})
        if bad:
            raise RuntimeError(f"ADTOF emitted unexpected pitches: {bad}")

        events = []
        for note in notes:
            pitch = int(note.pitch)
            meta = allowed[pitch]
            events.append({
                "timeSeconds": round(float(note.start), 6),
                "endSeconds": round(float(note.end), 6),
                "durationSeconds": round(max(0.0, float(note.end - note.start)), 6),
                "rawPitch": pitch,
                "canonicalPitch": pitch,
                "role": meta["role"],
                "adtofLabel": meta["adtofLabel"],
                "velocity": int(note.velocity),
            })
        events.sort(key=lambda x: (x["timeSeconds"], x["canonicalPitch"]))

        pitch_counts = dict(sorted(Counter(x["canonicalPitch"] for x in events).items()))
        role_counts = {
            role: sum(1 for x in events if x["role"] == role)
            for role in ("kick", "snare", "tom", "hihat", "cymbal")
        }

        result = {
            "schema": "fame-owned-beats-audio-to-midi-p5-adtof-pytorch-pilot-result-v1",
            "version": 1,
            "status": "DEVELOPMENT_PILOT_COMPLETE_AWAITING_HUMAN_REVIEW",
            "runId": protocol["runId"],
            "candidateId": protocol["candidateId"],
            "sourceRecordId": protocol["sourceRecordId"],
            "compositionFamilyId": source["compositionFamilyId"],
            "input": {
                "condition": "ALREADY_CONSUMED_DEVELOPMENT_SOURCE_SEPARATION_DRUMS_STEM",
                "drumsStemSha256": source["stemSha256"],
                "originalSourceAudioOpened": False,
            },
            "model": {
                "repository": protocol["externalSource"]["repository"],
                "commit": env["sourceHead"],
                "weightSha256": sha256_file(installed_weight),
                "classes": protocol["inference"]["labels"],
                "thresholds": thresholds,
                "fps": int(protocol["inference"]["fps"]),
            },
            "output": {
                "midiRelativePath": "adtof-pytorch-drums.mid",
                "midiSha256": sha256_file(midi_file),
                "eventCount": len(events),
                "distinctPitchCount": len(pitch_counts),
                "pitchCounts": pitch_counts,
                "roleCounts": role_counts,
                "events": events,
            },
            "license": {
                "productionPromotionAllowed": False,
                "observedPortLicenseStatus": protocol["externalSource"]["observedLicenseStatus"],
                "upstreamOriginalLicense": protocol["externalSource"]["upstreamOriginalLicense"],
                "blockReason": protocol["externalSource"]["productionBlockReason"],
            },
            "safety": {
                "split": "development",
                "freshIndependentEvaluationFamiliesConsumed": 0,
                "independentEvaluationAccessedByThisCommand": False,
                "finalHoldoutAccessedByThisCommand": False,
                "sourceSeparationExecutedByThisCommand": False,
                "trainingAuthorized": False,
                "batch131Authorized": False,
                "taskDataReadyMayBeDeclared": False,
            },
        }
        result_file = family_dir / "result.json"
        result_file.write_text(stable_json(result), encoding="utf-8")

        summary = {
            "schema": "fame-owned-beats-audio-to-midi-p5-adtof-pytorch-pilot-summary-v1",
            "version": 1,
            "status": "DEVELOPMENT_PILOT_COMPLETE_AWAITING_HUMAN_REVIEW",
            "runId": protocol["runId"],
            "candidateId": protocol["candidateId"],
            "sourceRecordId": protocol["sourceRecordId"],
            "eventCount": len(events),
            "distinctPitchCount": len(pitch_counts),
            "roleCounts": role_counts,
            "automaticPromotion": False,
            "productionPromotionAllowed": False,
            "humanReviewRequired": True,
            "nextAction": "AUDITION_REFERENCE_VS_TSUMUGI_VS_ADTOF_IF_OUTPUT_IS_TECHNICALLY_VALID",
        }
        (temp / "summary.json").write_text(stable_json(summary), encoding="utf-8")
        temp.rename(run_root)
    except Exception:
        shutil.rmtree(temp, ignore_errors=True)
        raise

    return {
        "mode": "FAME_ADTOF_PYTORCH_PILOT_COMPLETE",
        "runId": protocol["runId"],
        "sourceRecordId": protocol["sourceRecordId"],
        "eventCount": len(events),
        "distinctPitchCount": len(pitch_counts),
        "roleCounts": role_counts,
        "midiSha256": result["output"]["midiSha256"],
        "productionPromotionAllowed": False,
        "freshIndependentEvaluationFamiliesConsumed": 0,
        "independentEvaluationAccessedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "summaryFile": str(run_root / "summary.json"),
    }


def self_test() -> dict:
    p = validate_protocol()
    mapping = {int(x["pitch"]): x["role"] for x in p["inference"]["labels"]}
    expected = {35: "kick", 38: "snare", 47: "tom", 42: "hihat", 49: "cymbal"}
    if mapping != expected:
        raise RuntimeError(f"ADTOF class mapping self-test failed: {mapping}")

    unsafe, generated, untracked = classify_porcelain_status(
        " M src/adtof_pytorch.egg-info/PKG-INFO\n"
        "?? build/\n"
    )
    if unsafe or generated != ["src/adtof_pytorch.egg-info/PKG-INFO"] or untracked != ["build/"]:
        raise RuntimeError(
            "ADTOF porcelain parser self-test failed: "
            f"unsafe={unsafe}, generated={generated}, untracked={untracked}"
        )

    unsafe_code, _, _ = classify_porcelain_status(" M src/adtof_pytorch/model.py\n")
    if unsafe_code != [" M src/adtof_pytorch/model.py"]:
        raise RuntimeError(f"ADTOF unsafe change parser self-test failed: {unsafe_code}")

    return {
        "mode": "FAME_ADTOF_PYTORCH_PILOT_SELF_TEST_PASS",
        "sourceRecordId": p["sourceRecordId"],
        "classes": mapping,
        "productionPromotionAllowed": False,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=("self-test", "preflight", "execute"))
    ap.add_argument("workspace", nargs="?")
    args = ap.parse_args()

    if args.command == "self-test":
        out = self_test()
    else:
        if not args.workspace:
            ap.error("workspace is required")
        out = preflight(args.workspace) if args.command == "preflight" else execute(args.workspace)

    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME ADTOF PYTORCH PILOT FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
