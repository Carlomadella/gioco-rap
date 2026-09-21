#!/usr/bin/env python3
"""Technical QA for the frozen Basic Pitch v1-003 development run.

Read-only: validates receipt/summary/results/MIDI/integrity. It does not run
Basic Pitch, does not decode source audio and does not write musical outputs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUN_ID = "basic-pitch-development-inference-v1-003"
CANDIDATE_ID = "basic-pitch-0.4.0-lowend-v1"
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
CONTRACT_FILE = HERE / "basic-pitch-execution-contract-v3.json"
IMPLEMENTATION_FILE = HERE / "basic-pitch-execution-implementation-v3.json"
EXECUTOR_FILE = HERE / "basic-pitch-development-execute-v3.py"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git_blob_sha1(path: Path) -> str:
    data = path.read_bytes().replace(b"\r\n", b"\n")
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def finite(value, label):
    value = float(value)
    if not math.isfinite(value):
        raise RuntimeError(f"Non-finite value: {label}")
    return value


def validate_note_event(event, rid, index):
    start = finite(event.get("startSeconds"), f"{rid}.note[{index}].start")
    end = finite(event.get("endSeconds"), f"{rid}.note[{index}].end")
    duration = finite(event.get("durationSeconds"), f"{rid}.note[{index}].duration")
    amplitude = finite(event.get("amplitude"), f"{rid}.note[{index}].amplitude")
    note = event.get("midiNote")
    bends = event.get("pitchBends")

    if start < 0 or end <= start or duration <= 0 or abs((end - start) - duration) > 1e-4:
        raise RuntimeError(f"Invalid note timing: {rid}[{index}]")
    if not isinstance(note, int) or note < 0 or note > 127:
        raise RuntimeError(f"Invalid MIDI note: {rid}[{index}]")
    if amplitude < 0 or amplitude > 1.0 + 1e-9:
        raise RuntimeError(f"Invalid amplitude: {rid}[{index}]")
    if bends is not None:
        if not isinstance(bends, list) or any(not isinstance(x, int) or x < -25 or x > 25 for x in bends):
            raise RuntimeError(f"Invalid pitch bends: {rid}[{index}]")


def validate_midi(path: Path, expected_notes: int, expected_bends: int):
    import pretty_midi

    if not path.is_file() or path.stat().st_size <= 0:
        raise RuntimeError(f"MIDI missing/empty: {path}")

    midi = pretty_midi.PrettyMIDI(str(path))
    notes = [n for inst in midi.instruments for n in inst.notes]
    bends = [b for inst in midi.instruments for b in inst.pitch_bends]

    if len(notes) != expected_notes:
        raise RuntimeError(f"MIDI note count mismatch: {path}")
    if len(bends) != expected_bends:
        raise RuntimeError(f"MIDI pitch bend count mismatch: {path}")

    for i, note in enumerate(notes):
        if (
            not math.isfinite(float(note.start))
            or not math.isfinite(float(note.end))
            or note.start < 0
            or note.end <= note.start
            or not 0 <= int(note.pitch) <= 127
            or not 1 <= int(note.velocity) <= 127
        ):
            raise RuntimeError(f"Invalid MIDI note after reload: {path}[{i}]")

    for i, bend in enumerate(bends):
        if not math.isfinite(float(bend.time)) or bend.time < 0 or not -8192 <= int(bend.pitch) <= 8191:
            raise RuntimeError(f"Invalid MIDI pitch bend after reload: {path}[{i}]")

    return {
        "sha256": sha256_file(path),
        "bytes": path.stat().st_size,
        "noteCount": len(notes),
        "pitchBendPointCount": len(bends),
        "instrumentCount": len(midi.instruments),
        "durationSeconds": round(float(midi.get_end_time()), 6),
    }


def technical(workspace_root: str):
    workspace = Path(workspace_root).resolve()
    run_dir = workspace / "runs" / "basic-pitch-development-inference" / RUN_ID
    receipt_file = run_dir / "execution-receipt.json"
    summary_file = run_dir / "inference-summary.json"

    if not receipt_file.is_file() or not summary_file.is_file():
        raise RuntimeError("Basic Pitch v1-003 receipt/summary missing")

    contract = read_json(CONTRACT_FILE)
    implementation = read_json(IMPLEMENTATION_FILE)
    receipt = read_json(receipt_file)
    summary = read_json(summary_file)

    if (
        contract.get("schema") != "fame-owned-beats-basic-pitch-execution-contract-v3"
        or contract.get("version") != 3
        or contract.get("output", {}).get("runId") != RUN_ID
        or contract.get("candidateId") != CANDIDATE_ID
        or contract.get("scope", {}).get("split") != "development"
        or contract.get("scope", {}).get("expectedFamilies") != 8
        or contract.get("scope", {}).get("finalHoldoutAccessAllowed") is not False
        or contract.get("scope", {}).get("batch131Authorized") is not False
        or contract.get("scope", {}).get("trainingAuthorized") is not False
    ):
        raise RuntimeError("Frozen Basic Pitch v3 execution contract invalid")

    if (
        implementation.get("schema") != "fame-owned-beats-basic-pitch-execution-implementation-v3"
        or implementation.get("version") != 3
        or implementation.get("runId") != RUN_ID
        or implementation.get("executor", {}).get("gitBlobSha") != git_blob_sha1(EXECUTOR_FILE)
        or implementation.get("executionContractGitBlobSha") != git_blob_sha1(CONTRACT_FILE)
    ):
        raise RuntimeError("Frozen Basic Pitch v3 implementation identity mismatch")

    if (
        receipt.get("schema") != "fame-owned-beats-basic-pitch-development-inference-v3"
        or receipt.get("version") != 3
        or receipt.get("status") != "AUTHORIZED_NO_INFERENCE"
        or receipt.get("runId") != RUN_ID
        or receipt.get("candidateId") != CANDIDATE_ID
        or receipt.get("executionContractSha256") != sha256_file(CONTRACT_FILE)
        or receipt.get("inference") != contract.get("inference")
        or receipt.get("evidence") != contract.get("receiptEvidence")
        or receipt.get("safety", {}).get("split") != "development"
        or receipt.get("safety", {}).get("finalHoldoutExcluded") is not True
        or receipt.get("safety", {}).get("batch131Authorized") is not False
        or receipt.get("safety", {}).get("trainingAuthorized") is not False
        or receipt.get("safety", {}).get("taskDataReadyMayBeDeclared") is not False
    ):
        raise RuntimeError("Basic Pitch v1-003 receipt invalid")

    if (
        summary.get("schema") != "fame-owned-beats-basic-pitch-development-inference-summary-v3"
        or summary.get("version") != 3
        or summary.get("status") != "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"
        or summary.get("runId") != RUN_ID
        or summary.get("candidateId") != CANDIDATE_ID
        or summary.get("records") != 8
        or summary.get("executionReceiptSha256") != sha256_file(receipt_file)
        or summary.get("executionContractSha256") != sha256_file(CONTRACT_FILE)
        or summary.get("implementationContractSha256") != sha256_file(IMPLEMENTATION_FILE)
        or summary.get("executorGitBlobSha") != git_blob_sha1(EXECUTOR_FILE)
        or summary.get("modelLoadedOncePerProcess") is not True
        or summary.get("rawModelOutputPersisted") is not False
        or summary.get("safety", {}).get("split") != "development"
        or summary.get("safety", {}).get("originalSourceAudioAccessed") is not False
        or summary.get("safety", {}).get("finalHoldoutAccessed") is not False
        or summary.get("safety", {}).get("batch131Accessed") is not False
        or summary.get("safety", {}).get("trainingAuthorized") is not False
        or summary.get("safety", {}).get("taskDataReadyMayBeDeclared") is not False
    ):
        raise RuntimeError("Basic Pitch v1-003 summary invalid")

    sources = receipt.get("sources")
    rows = summary.get("results")
    if not isinstance(sources, list) or len(sources) != 8 or not isinstance(rows, list) or len(rows) != 8:
        raise RuntimeError("Basic Pitch v1-003 8-family coverage mismatch")
    if [x.get("sourceRecordId") for x in sources] != EXPECTED_IDS:
        raise RuntimeError("Basic Pitch receipt source IDs/order mismatch")
    if [x.get("sourceRecordId") for x in rows] != EXPECTED_IDS:
        raise RuntimeError("Basic Pitch summary source IDs/order mismatch")

    source_by_id = {x["sourceRecordId"]: x for x in sources}
    diagnostics = []
    midi_verified = 0
    total_notes = 0
    total_bends = 0

    for row in rows:
        rid = row["sourceRecordId"]
        source = source_by_id[rid]
        family_dir = run_dir / source["outputRelativePath"]
        result_file = family_dir / "result.json"
        midi_file = family_dir / "basic-pitch.mid"
        stem_file = workspace / Path(source["relativePath"])

        if not result_file.is_file() or sha256_file(result_file) != row.get("resultSha256"):
            raise RuntimeError(f"Basic Pitch result SHA mismatch: {rid}")
        if not stem_file.is_file() or stem_file.stat().st_size != source.get("bytes") or sha256_file(stem_file) != source.get("sha256"):
            raise RuntimeError(f"Basic Pitch input stem integrity mismatch: {rid}")

        result = read_json(result_file)
        if (
            result.get("schema") != "fame-owned-beats-basic-pitch-development-inference-result-v3"
            or result.get("version") != 3
            or result.get("runId") != RUN_ID
            or result.get("candidateId") != CANDIDATE_ID
            or result.get("sourceRecordId") != rid
            or result.get("compositionFamilyId") != source.get("compositionFamilyId")
            or result.get("input", {}).get("stem") != "bass"
            or result.get("input", {}).get("sha256") != source.get("sha256")
            or result.get("input", {}).get("bytes") != source.get("bytes")
            or result.get("midiTempo") != source.get("midiTempo")
            or result.get("inference") != contract.get("inference")
            or result.get("model", {}).get("sha256") != contract.get("package", {}).get("modelSha256")
            or result.get("model", {}).get("loadedOncePerProcess") is not True
            or result.get("implementationContractSha256") != sha256_file(IMPLEMENTATION_FILE)
            or result.get("executorGitBlobSha") != git_blob_sha1(EXECUTOR_FILE)
            or result.get("safety", {}).get("split") != "development"
            or result.get("safety", {}).get("originalSourceAudioAccessed") is not False
            or result.get("safety", {}).get("finalHoldoutAccessed") is not False
            or result.get("safety", {}).get("batch131Accessed") is not False
            or result.get("safety", {}).get("trainingAuthorized") is not False
            or result.get("safety", {}).get("taskDataReadyMayBeDeclared") is not False
        ):
            raise RuntimeError(f"Basic Pitch result contract invalid: {rid}")

        events = result.get("noteEvents")
        if not isinstance(events, list) or result.get("noteCount") != len(events):
            raise RuntimeError(f"Basic Pitch note event count mismatch: {rid}")
        for i, event in enumerate(events):
            validate_note_event(event, rid, i)

        bend_values = sum(len(x["pitchBends"]) for x in events if x.get("pitchBends") is not None)
        if bend_values != result.get("noteEventPitchBendValueCount"):
            raise RuntimeError(f"Basic Pitch note-event bend value count mismatch: {rid}")

        midi_meta = result.get("midi", {})
        midi = validate_midi(midi_file, len(events), int(midi_meta.get("pitchBendPointCount", -1)))
        if (
            midi["sha256"] != midi_meta.get("sha256")
            or midi["sha256"] != row.get("midiSha256")
            or midi["bytes"] != midi_meta.get("bytes")
            or midi["noteCount"] != midi_meta.get("noteCount")
            or midi["noteCount"] != row.get("noteCount")
            or midi["pitchBendPointCount"] != midi_meta.get("pitchBendPointCount")
            or midi["pitchBendPointCount"] != row.get("pitchBendPointCount")
            or midi["instrumentCount"] != midi_meta.get("instrumentCount")
            or abs(midi["durationSeconds"] - float(midi_meta.get("durationSeconds", -1))) > 1e-5
        ):
            raise RuntimeError(f"Basic Pitch MIDI metadata mismatch: {rid}")

        notes = [x["midiNote"] for x in events]
        diagnostics.append({
            "sourceRecordId": rid,
            "compositionFamilyId": source["compositionFamilyId"],
            "midiTempo": source["midiTempo"],
            "noteCount": len(events),
            "noteEventPitchBendValueCount": bend_values,
            "midiPitchBendPointCount": midi["pitchBendPointCount"],
            "instrumentCount": midi["instrumentCount"],
            "durationSeconds": midi["durationSeconds"],
            "minimumMidiNote": min(notes) if notes else None,
            "maximumMidiNote": max(notes) if notes else None,
            "midiBytes": midi["bytes"],
        })
        midi_verified += 1
        total_notes += len(events)
        total_bends += midi["pitchBendPointCount"]

    return {
        "mode": "BASIC_PITCH_DEVELOPMENT_TECHNICAL_QA_PASS",
        "runId": RUN_ID,
        "candidateId": CANDIDATE_ID,
        "technicalGate": "ALL_8_FAMILIES_PASS",
        "recordsVerified": len(diagnostics),
        "midiFilesVerified": midi_verified,
        "totalNotes": total_notes,
        "totalMidiPitchBendPoints": total_bends,
        "diagnostics": diagnostics,
        "diagnosticsAreNotMusicalQualityScores": True,
        "originalSourceAudioOpenedByThisCommand": False,
        "basicPitchInferenceExecutedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "batch131AccessedByThisCommand": False,
        "trainingAuthorized": False,
        "taskDataReadyMayBeDeclared": False,
        "nextAction": "PREPARE_BLIND_LOW_END_COMPARISON",
    }


def self_test():
    valid = {
        "startSeconds": 0.0,
        "endSeconds": 0.3,
        "durationSeconds": 0.3,
        "midiNote": 45,
        "amplitude": 0.7,
        "pitchBends": [0, 1, -1],
    }
    validate_note_event(valid, "FIXTURE", 0)
    return {
        "mode": "BASIC_PITCH_DEVELOPMENT_QA_SELF_TEST_PASS",
        "technicalQaExecutedByThisCommand": False,
        "basicPitchInferenceExecutedByThisCommand": False,
    }


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("self-test")
    technical_parser = sub.add_parser("technical")
    technical_parser.add_argument("workspace")
    args = parser.parse_args()

    result = self_test() if args.command == "self-test" else technical(args.workspace)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=__import__("sys").stderr)
        raise SystemExit(1)
