#!/usr/bin/env python3
"""FAME Neural — Basic Pitch development-only low-end inference.

Consumes ONLY the append-only AUTHORIZED_NO_INFERENCE receipt created for
basic-pitch-development-inference-v1-001.

Safety:
- only the frozen 8 development bass stems;
- no original source audio;
- no final holdout;
- no batch131;
- no training;
- append-only per-family outputs;
- model loaded exactly once per process/run;
- raw model tensors are not persisted.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata as metadata
import json
import math
import os
import shutil
import sys
import traceback
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "basic-pitch-lowend-candidate-protocol-v1.json"
ENV_SPEC_FILE = HERE / "basic-pitch-environment-v1.json"
EXECUTION_CONTRACT_FILE = HERE / "basic-pitch-execution-contract-v3.json"
IMPLEMENTATION_CONTRACT_FILE = HERE / "basic-pitch-execution-implementation-v3.json"
LOCK_FILE = HERE / "requirements-basic-pitch-lock.txt"

DEFAULT_RUN_ID = "basic-pitch-development-inference-v1-003"
RECEIPT_SCHEMA = "fame-owned-beats-basic-pitch-development-inference-v3"
RESULT_SCHEMA = "fame-owned-beats-basic-pitch-development-inference-result-v3"
SUMMARY_SCHEMA = "fame-owned-beats-basic-pitch-development-inference-summary-v3"

EXPECTED_IDS = [
    "FAME000011",
    "FAME000012",
    "FAME000023",
    "FAME000040",
    "FAME000046",
    "FAME000058",
    "FAME000080",
    "FAME000126",
]


def read_json(path: Path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git_blob_sha1(path: Path) -> str:
    data = Path(path).read_bytes().replace(b"\r\n", b"\n")
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def ensure_within(root: Path, target: Path, label: str) -> Path:
    root = root.resolve()
    target = target.resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise RuntimeError(f"{label} escapes expected root: {target}") from exc
    return target


def safe_id(value: str, label: str) -> str:
    if not isinstance(value, str) or not value or len(value) > 80:
        raise RuntimeError(f"Invalid {label}")
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
    if value[0] not in allowed or any(ch not in allowed for ch in value):
        raise RuntimeError(f"Invalid {label}: {value}")
    return value


def finite_number(value, label: str) -> float:
    value = float(value)
    if not math.isfinite(value):
        raise RuntimeError(f"Non-finite numeric value: {label}")
    return value


def validate_execution_contract(contract):
    if (
        contract.get("schema") != "fame-owned-beats-basic-pitch-execution-contract-v3"
        or contract.get("version") != 3
        or contract.get("status") != "FROZEN_BEFORE_FIRST_V3_BASIC_PITCH_OUTPUT"
        or contract.get("candidateId") != "basic-pitch-0.4.0-lowend-v1"
        or contract.get("package", {}).get("version") != "0.4.0"
        or contract.get("package", {}).get("modelSha256")
        != "2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec"
        or contract.get("package", {}).get("backend") != "ONNX"
        or contract.get("package", {}).get("onnxRuntimeVersion") != "1.23.2"
        or contract.get("environment", {}).get("pythonVersion") != "3.10.11"
        or contract.get("environment", {}).get("repositoryLockSha256")
        != "3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad"
        or contract.get("inference", {}).get("api") != "basic_pitch.inference.predict"
        or contract.get("inference", {}).get("onsetThreshold") != 0.5
        or contract.get("inference", {}).get("frameThreshold") != 0.3
        or float(contract.get("inference", {}).get("minimumNoteLengthMs", -1)) != 127.7
        or contract.get("inference", {}).get("minimumFrequencyHz") != 25
        or contract.get("inference", {}).get("maximumFrequencyHz") != 300
        or contract.get("inference", {}).get("multiplePitchBends") is not True
        or contract.get("inference", {}).get("melodiaTrick") is not True
        or contract.get("inference", {}).get("appendOnly") is not True
        or contract.get("scope", {}).get("split") != "development"
        or contract.get("scope", {}).get("expectedFamilies") != 8
        or contract.get("scope", {}).get("inputStem") != "bass"
        or contract.get("scope", {}).get("finalHoldoutAccessAllowed") is not False
        or contract.get("scope", {}).get("batch131Authorized") is not False
        or contract.get("scope", {}).get("trainingAuthorized") is not False
        or contract.get("scope", {}).get("taskDataReadyMayBeDeclared") is not False
        or contract.get("output", {}).get("runId") != DEFAULT_RUN_ID
        or contract.get("supersedes", {}).get("runId") != "basic-pitch-development-inference-v1-002"
        or contract.get("supersedes", {}).get("algorithmChanged") is not False
        or contract.get("supersedes", {}).get("implementationOnlyFix") is not True
        or contract.get("supersedes", {}).get("defectCode") != "RECEIPT_EVIDENCE_PRODUCER_CONSUMER_MISMATCH"
        or contract.get("receiptEvidence") != {
            "preInferenceGatePassedImmediatelyBeforeReceipt": True,
            "priorRunValidatedAndMarkedAborted": True,
            "bassStemIntegrityBytesReadByPrepareCommand": True,
            "audioDecodedByPrepareCommand": False,
            "basicPitchInferenceExecutedByPrepareCommand": False,
            "midiWrittenByPrepareCommand": False,
        }
    ):
        raise RuntimeError("Unsupported or unsafe Basic Pitch execution contract")
    return contract


def validate_implementation_contract(contract):
    if (
        contract.get("schema") != "fame-owned-beats-basic-pitch-execution-implementation-v3"
        or contract.get("version") != 3
        or contract.get("status") != "FROZEN_BEFORE_FIRST_V3_BASIC_PITCH_INFERENCE"
        or contract.get("runId") != DEFAULT_RUN_ID
        or contract.get("executor", {}).get("path") != Path(__file__).name
        or contract.get("executor", {}).get("gitBlobSha") != git_blob_sha1(Path(__file__))
        or contract.get("output", {}).get("atomicPerFamily") is not True
        or contract.get("output", {}).get("resumeByValidatedReceipt") is not True
        or contract.get("output", {}).get("rawModelOutputPersisted") is not False
        or contract.get("runtime", {}).get("modelLoadedOncePerProcess") is not True
    ):
        raise RuntimeError("Basic Pitch execution implementation is not frozen")
    return contract


def validate_repository_freeze():
    protocol = read_json(PROTOCOL_FILE)
    env = read_json(ENV_SPEC_FILE)
    execution = validate_execution_contract(read_json(EXECUTION_CONTRACT_FILE))
    implementation = validate_implementation_contract(read_json(IMPLEMENTATION_CONTRACT_FILE))

    if (
        protocol.get("status") != "ENVIRONMENT_AND_MODEL_FROZEN_AWAITING_PREINFERENCE_VERIFY"
        or env.get("status") != "EXACT_TRANSITIVE_LOCK_COMMITTED"
        or env.get("lock", {}).get("committed") is not True
        or env.get("lock", {}).get("reviewed") is not True
        or sha256_file(LOCK_FILE) != execution["environment"]["repositoryLockSha256"]
        or protocol.get("environment", {}).get("repositoryLockSha256")
        != execution["environment"]["repositoryLockSha256"]
        or protocol.get("environment", {}).get("packagedModel", {}).get("sha256")
        != execution["package"]["modelSha256"]
        or implementation.get("executionContractGitBlobSha") != git_blob_sha1(EXECUTION_CONTRACT_FILE)
    ):
        raise RuntimeError("Basic Pitch repository freeze no longer matches execution implementation")

    return {
        "protocol": protocol,
        "environment": env,
        "execution": execution,
        "implementation": implementation,
        "protocolSha256": sha256_file(PROTOCOL_FILE),
        "environmentSpecSha256": sha256_file(ENV_SPEC_FILE),
        "executionContractSha256": sha256_file(EXECUTION_CONTRACT_FILE),
        "implementationContractSha256": sha256_file(IMPLEMENTATION_CONTRACT_FILE),
        "lockSha256": sha256_file(LOCK_FILE),
        "executorGitBlobSha": git_blob_sha1(Path(__file__)),
    }


def run_directory(workspace: Path, run_id: str) -> Path:
    return workspace / "runs" / "basic-pitch-development-inference" / run_id


def validate_receipt(workspace: Path, run_id: str, frozen):
    run_id = safe_id(run_id, "run-id")
    if run_id != DEFAULT_RUN_ID:
        raise RuntimeError("Only frozen Basic Pitch run-id is allowed")

    root = run_directory(workspace, run_id)
    receipt_file = root / "execution-receipt.json"
    if not receipt_file.is_file():
        raise RuntimeError(f"Basic Pitch execution receipt missing: {receipt_file}")
    receipt = read_json(receipt_file)

    if (
        receipt.get("schema") != RECEIPT_SCHEMA
        or receipt.get("version") != 3
        or receipt.get("status") != "AUTHORIZED_NO_INFERENCE"
        or receipt.get("runId") != run_id
        or receipt.get("candidateId") != frozen["execution"]["candidateId"]
        or receipt.get("protocolSha256") != frozen["protocolSha256"]
        or receipt.get("executionContractSha256") != frozen["executionContractSha256"]
        or receipt.get("environmentSpecSha256") != frozen["environmentSpecSha256"]
        or receipt.get("environmentLockSha256") != frozen["lockSha256"]
        or receipt.get("model", {}).get("sha256")
        != frozen["execution"]["package"]["modelSha256"]
        or receipt.get("model", {}).get("filename")
        != frozen["execution"]["package"]["modelFilename"]
        or receipt.get("receiptRunner", {}).get("gitBlobSha")
        != frozen["execution"]["receiptRunner"]["gitBlobSha"]
        or receipt.get("inference") != frozen["execution"]["inference"]
        or receipt.get("humanReview", {}).get("submissionDigestSha256")
        != frozen["protocol"]["prerequisite"]["humanReviewSubmissionDigestSha256"]
        or receipt.get("safety", {}).get("split") != "development"
        or receipt.get("safety", {}).get("sourceFamiliesLocked") is not True
        or receipt.get("safety", {}).get("inputStem") != "bass"
        or receipt.get("safety", {}).get("originalSourceAudioAllowed") is not False
        or receipt.get("safety", {}).get("finalHoldoutExcluded") is not True
        or receipt.get("safety", {}).get("batch131Authorized") is not False
        or receipt.get("safety", {}).get("trainingAuthorized") is not False
        or receipt.get("safety", {}).get("taskDataReadyMayBeDeclared") is not False
        or receipt.get("evidence") != frozen["execution"]["receiptEvidence"]
    ):
        raise RuntimeError("Basic Pitch receipt no longer matches frozen repository artifacts")

    sources = receipt.get("sources")
    if not isinstance(sources, list) or len(sources) != 8:
        raise RuntimeError("Basic Pitch receipt must contain exactly 8 sources")
    ids = [item.get("sourceRecordId") for item in sources]
    if ids != EXPECTED_IDS:
        raise RuntimeError(f"Basic Pitch receipt cohort mismatch: {ids}")
    families = [item.get("compositionFamilyId") for item in sources]
    if any(not isinstance(x, str) or not x for x in families) or len(set(families)) != 8:
        raise RuntimeError("Basic Pitch receipt requires 8 distinct composition families")

    for source in sources:
        safe_id(source["sourceRecordId"], "sourceRecordId")
        if source.get("inputStem") != "bass":
            raise RuntimeError(f"Unexpected input stem: {source['sourceRecordId']}")
        rel = source.get("relativePath")
        if not isinstance(rel, str) or not rel:
            raise RuntimeError(f"Missing relative input path: {source['sourceRecordId']}")
        stem = ensure_within(workspace, workspace / Path(rel), "bass stem")
        if not stem.is_file():
            raise RuntimeError(f"Bass stem missing: {source['sourceRecordId']}")
        if stem.stat().st_size != int(source.get("bytes", -1)):
            raise RuntimeError(f"Bass stem size mismatch: {source['sourceRecordId']}")
        if sha256_file(stem) != source.get("sha256"):
            raise RuntimeError(f"Bass stem SHA mismatch: {source['sourceRecordId']}")
        bpm = finite_number(source.get("midiTempo"), f"{source['sourceRecordId']}.midiTempo")
        if bpm <= 0:
            raise RuntimeError(f"Invalid MIDI tempo: {source['sourceRecordId']}")

    model_path = Path(receipt.get("model", {}).get("path", ""))
    if not model_path.is_file():
        raise RuntimeError(f"Frozen Basic Pitch model missing: {model_path}")
    if model_path.name != frozen["execution"]["package"]["modelFilename"]:
        raise RuntimeError("Basic Pitch model filename mismatch")
    if model_path.stat().st_size != int(receipt["model"]["bytes"]):
        raise RuntimeError("Basic Pitch model size mismatch")
    if sha256_file(model_path) != frozen["execution"]["package"]["modelSha256"]:
        raise RuntimeError("Basic Pitch model SHA mismatch")

    return root, receipt_file, receipt, model_path


def validate_runtime(frozen):
    version = metadata.version("basic-pitch")
    onnx_version = metadata.version("onnxruntime")
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    if python_version != frozen["execution"]["environment"]["pythonVersion"]:
        raise RuntimeError(
            f"Basic Pitch executor requires Python {frozen['execution']['environment']['pythonVersion']}, "
            f"found {python_version}"
        )
    if version != frozen["execution"]["package"]["version"]:
        raise RuntimeError(f"Basic Pitch version mismatch: {version}")
    if onnx_version != frozen["execution"]["package"]["onnxRuntimeVersion"]:
        raise RuntimeError(f"ONNX Runtime version mismatch: {onnx_version}")

    return {
        "pythonVersion": python_version,
        "basicPitchVersion": version,
        "onnxRuntimeVersion": onnx_version,
    }


def serialize_note_events(note_events):
    output = []
    for index, event in enumerate(note_events):
        if len(event) != 5:
            raise RuntimeError(f"Unexpected Basic Pitch note event shape at index {index}")
        start, end, pitch, amplitude, bends = event
        start = finite_number(start, f"noteEvents[{index}].startSeconds")
        end = finite_number(end, f"noteEvents[{index}].endSeconds")
        amplitude = finite_number(amplitude, f"noteEvents[{index}].amplitude")
        pitch = int(pitch)
        if start < 0 or end <= start:
            raise RuntimeError(f"Invalid Basic Pitch note timing at index {index}")
        if pitch < 0 or pitch > 127:
            raise RuntimeError(f"Invalid Basic Pitch MIDI pitch at index {index}: {pitch}")
        if amplitude < 0:
            raise RuntimeError(f"Invalid Basic Pitch amplitude at index {index}")
        bend_values = None
        if bends is not None:
            bend_values = [int(value) for value in bends]
        output.append(
            {
                "startSeconds": round(start, 6),
                "endSeconds": round(end, 6),
                "durationSeconds": round(end - start, 6),
                "midiNote": pitch,
                "amplitude": round(amplitude, 8),
                "pitchBends": bend_values,
            }
        )
    return output


def validate_midi_file(midi_path: Path, expected_note_count: int):
    import pretty_midi

    if not midi_path.is_file() or midi_path.stat().st_size <= 0:
        raise RuntimeError(f"Basic Pitch MIDI missing/empty: {midi_path}")

    midi = pretty_midi.PrettyMIDI(str(midi_path))
    notes = []
    pitch_bends = []
    for instrument in midi.instruments:
        notes.extend(instrument.notes)
        pitch_bends.extend(instrument.pitch_bends)

    if len(notes) != int(expected_note_count):
        raise RuntimeError(
            f"Basic Pitch MIDI note count mismatch: expected={expected_note_count} actual={len(notes)}"
        )

    for index, note in enumerate(notes):
        if (
            not math.isfinite(float(note.start))
            or not math.isfinite(float(note.end))
            or note.start < 0
            or note.end <= note.start
            or int(note.pitch) < 0
            or int(note.pitch) > 127
            or int(note.velocity) < 1
            or int(note.velocity) > 127
        ):
            raise RuntimeError(f"Invalid MIDI note after write/reload: {index}")

    for index, bend in enumerate(pitch_bends):
        if not math.isfinite(float(bend.time)) or bend.time < 0 or not isinstance(bend.pitch, int):
            raise RuntimeError(f"Invalid MIDI pitch bend after write/reload: {index}")

    return {
        "sha256": sha256_file(midi_path),
        "bytes": midi_path.stat().st_size,
        "noteCount": len(notes),
        "pitchBendPointCount": len(pitch_bends),
        "instrumentCount": len(midi.instruments),
        "durationSeconds": round(float(midi.get_end_time()), 6),
    }


def validate_existing_family_output(root: Path, source, frozen):
    family_dir = ensure_within(root, root / Path(source["outputRelativePath"]), "family output")
    result_file = family_dir / "result.json"
    midi_file = family_dir / "basic-pitch.mid"
    if not result_file.is_file() or not midi_file.is_file():
        raise RuntimeError(f"Partial Basic Pitch output without complete result receipt: {source['sourceRecordId']}")

    result = read_json(result_file)
    if (
        result.get("schema") != RESULT_SCHEMA
        or result.get("version") != 3
        or result.get("runId") != DEFAULT_RUN_ID
        or result.get("candidateId") != frozen["execution"]["candidateId"]
        or result.get("sourceRecordId") != source["sourceRecordId"]
        or result.get("compositionFamilyId") != source["compositionFamilyId"]
        or result.get("input", {}).get("sha256") != source["sha256"]
        or result.get("input", {}).get("stem") != "bass"
        or result.get("midiTempo") != source["midiTempo"]
        or result.get("implementationContractSha256") != frozen["implementationContractSha256"]
        or result.get("executorGitBlobSha") != frozen["executorGitBlobSha"]
        or result.get("safety", {}).get("split") != "development"
        or result.get("safety", {}).get("finalHoldoutAccessed") is not False
        or result.get("safety", {}).get("batch131Accessed") is not False
        or result.get("safety", {}).get("trainingAuthorized") is not False
        or result.get("safety", {}).get("taskDataReadyMayBeDeclared") is not False
        or not isinstance(result.get("noteEvents"), list)
        or result.get("noteCount") != len(result["noteEvents"])
    ):
        raise RuntimeError(f"Existing Basic Pitch result contract mismatch: {source['sourceRecordId']}")

    midi = validate_midi_file(midi_file, result["noteCount"])
    if result.get("midi", {}).get("sha256") != midi["sha256"]:
        raise RuntimeError(f"Existing Basic Pitch MIDI SHA mismatch: {source['sourceRecordId']}")
    return result, midi


def write_failure_report(root: Path, run_id: str, stage: str, source_record_id, error: Exception):
    report_file = root / "failure-report.json"
    payload = {
        "schema": "fame-owned-beats-basic-pitch-inference-failure-v3",
        "version": 3,
        "runId": run_id,
        "status": "FAILED_BEFORE_COMPLETE_SUMMARY",
        "recordedAt": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
        "stage": stage,
        "sourceRecordId": source_record_id,
        "errorType": type(error).__name__,
        "errorMessage": str(error),
        "traceback": traceback.format_exc(),
        "finalHoldoutAccessed": False,
        "batch131Accessed": False,
        "trainingAuthorized": False,
    }
    if not report_file.exists():
        report_file.write_text(stable_json(payload), encoding="utf-8", newline="\n")


def execute(workspace_root: str, run_id: str = DEFAULT_RUN_ID):
    workspace = Path(workspace_root).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace missing: {workspace}")

    root = run_directory(workspace, run_id)
    try:
        frozen = validate_repository_freeze()
        runtime = validate_runtime(frozen)
        root, receipt_file, receipt, model_path = validate_receipt(workspace, run_id, frozen)
    except Exception as error:
        if root.is_dir():
            write_failure_report(root, run_id, "PRE_EXECUTION_VALIDATION", None, error)
        raise
    summary_file = root / "inference-summary.json"

    if summary_file.exists():
        summary = read_json(summary_file)
        if (
            summary.get("schema") != SUMMARY_SCHEMA
            or summary.get("version") != 3
            or summary.get("status") != "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"
            or summary.get("runId") != run_id
            or summary.get("records") != 8
            or summary.get("executionReceiptSha256") != sha256_file(receipt_file)
            or summary.get("implementationContractSha256") != frozen["implementationContractSha256"]
        ):
            raise RuntimeError("Existing Basic Pitch inference summary is invalid")
        return {
            "mode": "BASIC_PITCH_V1_003_DEVELOPMENT_INFERENCE_ALREADY_COMPLETE",
            "runId": run_id,
            "records": 8,
            "status": summary["status"],
            "nextAction": summary.get("nextAction"),
        }

    output_root = root / "outputs"
    if output_root.exists() and not output_root.is_dir():
        raise RuntimeError(f"Basic Pitch output root exists but is not a directory: {output_root}")
    output_root.mkdir(parents=False, exist_ok=True)

    # Import only after all repository/runtime/receipt checks have passed.
    from basic_pitch.inference import Model, predict

    print("Load frozen Basic Pitch ONNX model once for development run...", file=sys.stderr, flush=True)
    try:
        model = Model(model_path)
    except Exception as error:
        write_failure_report(root, run_id, "MODEL_LOAD", None, error)
        raise

    results = []
    for index, source in enumerate(receipt["sources"], start=1):
        rid = source["sourceRecordId"]
        final_dir = ensure_within(root, root / Path(source["outputRelativePath"]), "family output")

        if final_dir.exists():
            result, midi = validate_existing_family_output(root, source, frozen)
            results.append(
                {
                    "sourceRecordId": rid,
                    "resultSha256": sha256_file(final_dir / "result.json"),
                    "midiSha256": midi["sha256"],
                    "noteCount": result["noteCount"],
                    "pitchBendPointCount": midi["pitchBendPointCount"],
                }
            )
            print(f"[{index}/8] verified existing {rid}", file=sys.stderr, flush=True)
            continue

        stem = ensure_within(workspace, workspace / Path(source["relativePath"]), "bass stem")
        if sha256_file(stem) != source["sha256"]:
            raise RuntimeError(f"Bass stem changed before inference: {rid}")

        print(f"[{index}/8] Basic Pitch low-end {rid}", file=sys.stderr, flush=True)
        temp_dir = root / f".{rid}.{uuid.uuid4().hex}.tmp"
        if temp_dir.exists():
            raise RuntimeError(f"Unexpected temp collision: {temp_dir}")
        temp_dir.mkdir(parents=False)

        try:
            model_output, midi_data, note_events = predict(
                audio_path=stem,
                model_or_model_path=model,
                onset_threshold=float(receipt["inference"]["onsetThreshold"]),
                frame_threshold=float(receipt["inference"]["frameThreshold"]),
                minimum_note_length=float(receipt["inference"]["minimumNoteLengthMs"]),
                minimum_frequency=float(receipt["inference"]["minimumFrequencyHz"]),
                maximum_frequency=float(receipt["inference"]["maximumFrequencyHz"]),
                multiple_pitch_bends=bool(receipt["inference"]["multiplePitchBends"]),
                melodia_trick=bool(receipt["inference"]["melodiaTrick"]),
                debug_file=None,
                midi_tempo=float(source["midiTempo"]),
            )

            # Raw model output must not be persisted; keep it only long enough to
            # prove that the call returned the expected dictionary shape.
            if not isinstance(model_output, dict) or not {"note", "onset", "contour"}.issubset(model_output):
                raise RuntimeError(f"Unexpected Basic Pitch raw output keys: {rid}")
            del model_output

            serialized = serialize_note_events(note_events)
            midi_file = temp_dir / "basic-pitch.mid"
            midi_data.write(str(midi_file))
            midi = validate_midi_file(midi_file, len(serialized))

            pitch_bend_values = sum(
                len(item["pitchBends"]) for item in serialized if item["pitchBends"] is not None
            )
            result = {
                "schema": RESULT_SCHEMA,
                "version": 3,
                "runId": run_id,
                "candidateId": receipt["candidateId"],
                "sourceRecordId": rid,
                "compositionFamilyId": source["compositionFamilyId"],
                "completedAt": __import__("datetime").datetime.now(
                    __import__("datetime").timezone.utc
                ).isoformat(),
                "input": {
                    "stem": "bass",
                    "relativePath": source["relativePath"],
                    "sha256": source["sha256"],
                    "bytes": source["bytes"],
                },
                "midiTempo": source["midiTempo"],
                "inference": receipt["inference"],
                "runtime": runtime,
                "model": {
                    "filename": receipt["model"]["filename"],
                    "bytes": receipt["model"]["bytes"],
                    "sha256": receipt["model"]["sha256"],
                    "loadedOncePerProcess": True,
                },
                "noteEvents": serialized,
                "noteCount": len(serialized),
                "noteEventPitchBendValueCount": pitch_bend_values,
                "midi": {
                    "file": "basic-pitch.mid",
                    **midi,
                },
                "implementationContractSha256": frozen["implementationContractSha256"],
                "executorGitBlobSha": frozen["executorGitBlobSha"],
                "safety": {
                    "split": "development",
                    "originalSourceAudioAccessed": False,
                    "finalHoldoutAccessed": False,
                    "batch131Accessed": False,
                    "trainingAuthorized": False,
                    "taskDataReadyMayBeDeclared": False,
                },
            }

            result_file = temp_dir / "result.json"
            result_file.write_text(stable_json(result), encoding="utf-8", newline="\n")
            os.replace(temp_dir, final_dir)

            results.append(
                {
                    "sourceRecordId": rid,
                    "resultSha256": sha256_file(final_dir / "result.json"),
                    "midiSha256": midi["sha256"],
                    "noteCount": len(serialized),
                    "pitchBendPointCount": midi["pitchBendPointCount"],
                }
            )
        except Exception as error:
            write_failure_report(root, run_id, "FAMILY_INFERENCE_OR_PERSIST", rid, error)
            shutil.rmtree(temp_dir, ignore_errors=True)
            raise

    if len(results) != 8 or [item["sourceRecordId"] for item in results] != EXPECTED_IDS:
        raise RuntimeError("Basic Pitch inference did not complete the frozen 8-family cohort")

    summary = {
        "schema": SUMMARY_SCHEMA,
        "version": 3,
        "status": "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
        "runId": run_id,
        "candidateId": receipt["candidateId"],
        "completedAt": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
        "records": len(results),
        "executionReceiptSha256": sha256_file(receipt_file),
        "executionContractSha256": frozen["executionContractSha256"],
        "implementationContractSha256": frozen["implementationContractSha256"],
        "executorGitBlobSha": frozen["executorGitBlobSha"],
        "modelLoadedOncePerProcess": True,
        "rawModelOutputPersisted": False,
        "results": results,
        "safety": {
            "split": "development",
            "originalSourceAudioAccessed": False,
            "finalHoldoutAccessed": False,
            "batch131Accessed": False,
            "trainingAuthorized": False,
            "taskDataReadyMayBeDeclared": False,
        },
        "nextAction": "RUN_BASIC_PITCH_TECHNICAL_QA_AND_PREPARE_BLIND_LOW_END_COMPARISON",
    }
    summary_file.write_text(stable_json(summary), encoding="utf-8", newline="\n")

    return {
        "mode": "BASIC_PITCH_V1_003_DEVELOPMENT_INFERENCE_COMPLETE",
        "runId": run_id,
        "records": 8,
        "status": summary["status"],
        "modelLoadedOncePerProcess": True,
        "rawModelOutputPersisted": False,
        "finalHoldoutAccessedByThisCommand": False,
        "batch131AccessedByThisCommand": False,
        "trainingAuthorized": False,
        "taskDataReadyMayBeDeclared": False,
        "nextAction": summary["nextAction"],
    }


def self_test():
    fixture = [
        (0.0, 0.25, 45, 0.8, [0, 10, -10]),
        (0.5, 1.0, 47, 0.5, None),
    ]
    serial = serialize_note_events(fixture)
    if (
        len(serial) != 2
        or serial[0]["midiNote"] != 45
        or serial[0]["pitchBends"] != [0, 10, -10]
        or serial[1]["pitchBends"] is not None
    ):
        raise RuntimeError("Basic Pitch executor self-test failed")
    return {
        "mode": "BASIC_PITCH_V1_003_EXECUTOR_SELF_TEST_PASS",
        "noteEvents": len(serial),
        "audioDecodedByThisCommand": False,
        "basicPitchInferenceExecutedByThisCommand": False,
        "midiWrittenByThisCommand": False,
    }


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("self-test")

    execute_parser = sub.add_parser("execute")
    execute_parser.add_argument("workspace")
    execute_parser.add_argument("--run-id", default=DEFAULT_RUN_ID)

    args = parser.parse_args()
    if args.command == "self-test":
        result = self_test()
    elif args.command == "execute":
        result = execute(args.workspace, args.run_id)
    else:
        raise RuntimeError("Unknown command")

    print(stable_json(result), end="")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
