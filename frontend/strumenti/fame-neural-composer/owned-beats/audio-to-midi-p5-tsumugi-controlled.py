#!/usr/bin/env python3
"""Append-only controlled Tsumugi drums_v1_5 evaluation on frozen P3 fixtures."""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import replace
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path
from types import SimpleNamespace
import uuid

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-controlled-protocol-v1.json"
ENV_SPEC_FILE = HERE / "audio-to-midi-p5-tsumugi-environment-v1.json"

def read_json(path: Path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False) + "\n"

def sha256_file(path: Path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def prf(tp, fp, fn):
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "tp": int(tp), "fp": int(fp), "fn": int(fn),
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1": round(f1, 6),
    }

def match(adjacency, n_est):
    owner = [-1] * n_est
    def visit(i, seen):
        for j in adjacency[i]:
            if seen[j]:
                continue
            seen[j] = True
            if owner[j] < 0 or visit(owner[j], seen):
                owner[j] = i
                return True
        return False
    tp = sum(1 for i in range(len(adjacency)) if visit(i, [False] * n_est))
    pairs = sorted((i, j) for j, i in enumerate(owner) if i >= 0)
    return tp, pairs

def drum_metrics(refs, ests, tolerance):
    supported_roles = {"kick", "snare", "hihat"}
    refs = [x for x in refs if x.get("role") in supported_roles]
    adjacency = [
        [
            j for j, event in enumerate(ests)
            if event.get("role") == ref.get("role")
            and abs(float(event["timeSeconds"]) - float(ref["timeSeconds"])) <= tolerance
        ]
        for ref in refs
    ]
    tp, pairs = match(adjacency, len(ests)) if refs else (0, [])
    out = prf(tp, len(ests) - tp, len(refs) - tp)
    out.update({
        "referenceSupportedEvents": len(refs),
        "estimatedEvents": len(ests),
        "onsetToleranceSeconds": float(tolerance),
        "matches": [
            {
                "referenceIndex": i,
                "estimatedIndex": j,
                "role": refs[i]["role"],
                "referenceTimeSeconds": refs[i]["timeSeconds"],
                "estimatedTimeSeconds": ests[j]["timeSeconds"],
                "absoluteErrorSeconds": round(
                    abs(float(ests[j]["timeSeconds"]) - float(refs[i]["timeSeconds"])), 6
                ),
            }
            for i, j in pairs
        ],
    })
    by_class = {}
    for role in sorted(supported_roles):
        rr = [x for x in refs if x["role"] == role]
        ee = [x for x in ests if x.get("role") == role]
        aa = [
            [
                j for j, event in enumerate(ee)
                if abs(float(event["timeSeconds"]) - float(ref["timeSeconds"])) <= tolerance
            ]
            for ref in rr
        ]
        class_tp, _ = match(aa, len(ee)) if rr else (0, [])
        by_class[role] = prf(class_tp, len(ee) - class_tp, len(rr) - class_tp)
    out["byClass"] = by_class
    return out

def unsupported_reference_diagnostic(refs, ests, tolerance):
    rows = []
    for ref in [x for x in refs if x.get("unsupportedByBaseline") is True]:
        near = [
            {
                "role": event.get("role"),
                "rawPitch": event.get("rawPitch"),
                "canonicalPitch": event.get("canonicalPitch"),
                "timeSeconds": event.get("timeSeconds"),
                "absoluteErrorSeconds": round(
                    abs(float(event["timeSeconds"]) - float(ref["timeSeconds"])), 6
                ),
            }
            for event in ests
            if abs(float(event["timeSeconds"]) - float(ref["timeSeconds"])) <= tolerance
        ]
        rows.append({
            "referenceRole": ref.get("role"),
            "referenceTimeSeconds": ref.get("timeSeconds"),
            "predictedEventsNearReference": near,
        })
    return {
        "unsupportedReferenceEvents": len(rows),
        "events": rows,
        "policy": "diagnostic only; clap/rim are not relabeled for controlled PASS",
    }

def controlled_gate(rows, protocol):
    by_id = {x["fixtureId"]: x for x in rows}
    checks = []
    gate = protocol["controlledGate"]
    for fixture_id in gate["requiredPerfectPrimary30ms"]:
        metric = by_id[fixture_id]["candidatePrimary30ms"]
        passed = (
            metric["precision"] == float(gate["requiredPrecision"])
            and metric["recall"] == float(gate["requiredRecall"])
            and metric["f1"] == float(gate["requiredF1"])
        )
        checks.append({
            "fixtureId": fixture_id,
            "pass": passed,
            "precision": metric["precision"],
            "recall": metric["recall"],
            "f1": metric["f1"],
        })
    return {
        "pass": all(x["pass"] for x in checks),
        "requiredChecks": checks,
        "D08": "DIAGNOSTIC_ONLY",
        "syntheticOnly": True,
        "promotesCandidate": False,
    }

def validate_preflight(workspace: Path, env_spec):
    run_id = env_spec["workspace"]["environmentRunId"]
    receipt_path = (
        workspace
        / env_spec["workspace"]["environmentRunsRelativePath"]
        / run_id
        / "environment-receipt.json"
    )
    if not receipt_path.is_file():
        raise RuntimeError(f"Tsumugi preflight receipt missing: {receipt_path}")
    receipt = read_json(receipt_path)
    expected = env_spec["observedPreflight"]
    if receipt.get("status") != "PREFLIGHT_ENVIRONMENT_READY_NO_AUDIO_ACCESSED":
        raise RuntimeError("Unexpected Tsumugi preflight receipt status")
    comparisons = {
        "candidateId": env_spec["candidateId"],
        "sourceCommit": env_spec["source"]["commit"],
        "checkpointSha256": env_spec["checkpoint"]["sha256"],
        "checkpointBytes": int(env_spec["checkpoint"]["bytes"]),
        "installedPackagesSha256": expected["installedPackagesSha256"],
    }
    actuals = {
        "candidateId": receipt.get("candidateId"),
        "sourceCommit": receipt.get("sourceCommit"),
        "checkpointSha256": receipt.get("checkpoint", {}).get("sha256"),
        "checkpointBytes": int(receipt.get("checkpoint", {}).get("bytes", -1)),
        "installedPackagesSha256": receipt.get("installedPackagesSha256"),
    }
    for key, expected_value in comparisons.items():
        if actuals[key] != expected_value:
            raise RuntimeError(f"Tsumugi preflight receipt mismatch for {key}: {actuals[key]} != {expected_value}")
    for key in [
        "sourceAudioOpenedByThisCommand",
        "fixtureAudioOpenedByThisCommand",
        "transcriptionExecutedByThisCommand",
        "sourceSeparationExecutedByThisCommand",
        "trainingAuthorized",
        "batch131Authorized",
        "taskDataReadyMayBeDeclared",
    ]:
        if receipt.get(key) is not False:
            raise RuntimeError(f"Tsumugi preflight safety mismatch: {key}")
    return receipt_path, receipt

def map_note(note, sample_rate, protocol):
    raw_pitch = int(note.pitch)
    alias_map = {int(k): int(v) for k, v in protocol["drumPitchPolicy"]["aliasesBeforeScoring"].items()}
    canonical_pitch = alias_map.get(raw_pitch, raw_pitch)
    role = None
    for candidate_role, pitches in protocol["drumPitchPolicy"]["supportedRoleMapping"].items():
        if canonical_pitch in [int(x) for x in pitches]:
            role = candidate_role
            break
    if role is None:
        role = f"unsupported_pitch_{canonical_pitch}"
    return {
        "timeSeconds": round(float(note.start_sample) / float(sample_rate), 6),
        "endSeconds": round(float(note.end_sample) / float(sample_rate), 6),
        "durationSeconds": round(
            max(0.0, float(note.end_sample - note.start_sample) / float(sample_rate)), 6
        ),
        "role": role,
        "rawPitch": raw_pitch,
        "canonicalPitch": canonical_pitch,
        "velocity": int(note.velocity),
        "instrumentId": int(note.instrument_id),
        "slotIndex": int(note.slot_index),
        "hasOnset": bool(note.has_onset),
        "hasOffset": bool(note.has_offset),
    }

def execute(workspace: Path):
    workspace = workspace.resolve()
    protocol = read_json(PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)
    if protocol.get("status") != "FROZEN_BEFORE_FIRST_TSUMUGI_FIXTURE_AUDIO_ACCESS":
        raise RuntimeError("Tsumugi controlled protocol is not frozen")
    if env_spec.get("status") != "PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS":
        raise RuntimeError("Tsumugi environment preflight is not locked")

    receipt_path, receipt = validate_preflight(workspace, env_spec)

    fixture_root = (
        workspace / "runs" / "audio-to-midi-p3-controlled-fixtures" / protocol["fixtureRunId"]
    )
    manifest_file = fixture_root / "fixture-manifest.json"
    if not manifest_file.is_file():
        raise RuntimeError(f"Fixture manifest missing: {manifest_file}")
    if sha256_file(manifest_file) != protocol["fixtureManifestSha256"]:
        raise RuntimeError("Fixture manifest SHA mismatch")
    manifest = read_json(manifest_file)
    if manifest.get("records") != 12:
        raise RuntimeError("Unexpected frozen fixture manifest record count")

    source_root = workspace / env_spec["workspace"]["sourceRelativePath"]
    checkpoint = workspace / env_spec["workspace"]["checkpointRelativePath"]
    if not source_root.is_dir() or not checkpoint.is_file():
        raise RuntimeError("Frozen Tsumugi source/checkpoint missing")
    if sha256_file(checkpoint) != env_spec["checkpoint"]["sha256"]:
        raise RuntimeError("Frozen Tsumugi checkpoint SHA mismatch before inference")
    if checkpoint.stat().st_size != int(env_spec["checkpoint"]["bytes"]):
        raise RuntimeError("Frozen Tsumugi checkpoint size mismatch before inference")

    sys.path.insert(0, str(source_root))
    import torch
    from instrument_agnostic_amt.amt.cli.infer import (
        load_model,
        resolve_inference_settings,
        resolve_instrument_id,
    )
    from instrument_agnostic_amt.amt.inference.audio import load_audio
    from instrument_agnostic_amt.amt.inference.windowed import decode_notes
    from instrument_agnostic_amt.amt.inference.midi import build_midi

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA became unavailable; CPU fallback forbidden")
    if torch.cuda.get_device_name(0) != env_spec["observedPreflight"]["deviceName"]:
        raise RuntimeError("CUDA device identity changed since preflight")
    device = torch.device("cuda")

    model, model_config, training_args = load_model(checkpoint, device=device)
    drum_instrument_id = int(resolve_instrument_id(protocol["inference"]["instrumentFilter"]))

    args = SimpleNamespace(
        window_ms=None,
        stride_ms=None,
        semi_crf_track_batch_size=None,
        window_batch_size=int(protocol["inference"]["windowBatchSize"]),
        merge_gap_ms=protocol["inference"]["mergeGapMs"],
        merge_onset_ms=float(protocol["inference"]["mergeOnsetMs"]),
        silence_gate_rms_dbfs=float(protocol["inference"]["silenceGateRmsDbfs"]),
        note_bias=float(protocol["inference"]["noteBias"]),
        disable_tqdm=True,
        no_boundary_head=not bool(protocol["inference"]["useBoundaryHead"]),
        semi_crf_backend=str(protocol["inference"]["semiCrfBackend"]),
        semi_crf_sparse_decode=bool(protocol["inference"]["semiCrfSparseDecode"]),
        semi_crf_sparse_topk_per_start=16,
        semi_crf_sparse_score_threshold=None,
        semi_crf_sparse_max_span_ms=None,
        instrument_pair_infer_topk=int(protocol["inference"]["instrumentPairInferTopk"]),
        instrument_pair_gate_threshold=float(protocol["inference"]["instrumentPairGateThreshold"]),
        instrument_pair_max_pairs=int(protocol["inference"]["instrumentPairMaxPairs"]),
    )
    settings = resolve_inference_settings(model_config, training_args, args)
    settings = replace(settings, allowed_instrument_ids=(drum_instrument_id,))

    resolved_settings = {
        "sampleRate": int(model_config.sample_rate),
        "windowMs": int(settings.window_ms),
        "strideMs": int(settings.stride_ms),
        "trackBatchSize": int(settings.track_batch_size),
        "windowBatchSize": int(settings.window_batch_size),
        "mergeGapMs": settings.merge_gap_ms,
        "mergeOnsetMs": float(settings.merge_onset_ms),
        "silenceGateRmsDbfs": settings.silence_gate_rms_dbfs,
        "noteBias": float(settings.note_bias),
        "useBoundaryHead": bool(settings.use_boundary_head),
        "semiCrfBackend": str(settings.semi_crf_backend),
        "allowedInstrumentIds": list(settings.allowed_instrument_ids or ()),
        "drumInstrumentId": drum_instrument_id,
        "ampEnabled": False,
        "compileEnabled": False,
        "device": "cuda",
    }

    output_root = workspace / "runs" / "audio-to-midi-p5-tsumugi-controlled" / protocol["runId"]
    if output_root.exists():
        raise RuntimeError(f"Append-only Tsumugi controlled run already exists: {output_root}")
    output_root.parent.mkdir(parents=True, exist_ok=True)
    temp_root = output_root.parent / f".{protocol['runId']}.tmp-{uuid.uuid4().hex}"
    temp_root.mkdir()

    rows = []
    try:
        for fixture_id in protocol["input"]["fixtures"]:
            fixture_dir = fixture_root / fixture_id
            audio_file = fixture_dir / "drums.wav"
            reference_file = fixture_dir / "reference.json"
            if not audio_file.is_file() or not reference_file.is_file():
                raise RuntimeError(f"Frozen fixture files missing: {fixture_id}")
            reference = read_json(reference_file)

            waveform = load_audio(audio_file, target_sample_rate=int(model_config.sample_rate))
            notes, decoder_stats = decode_notes(
                model,
                model_config,
                waveform,
                instrument_filter_id=drum_instrument_id,
                device=device,
                amp_enabled=False,
                amp_dtype=torch.float32,
                settings=settings,
                velocity=int(protocol["inference"]["velocity"]),
                forward_model=None,
            )
            events = [
                map_note(note, int(model_config.sample_rate), protocol)
                for note in notes
            ]
            events.sort(key=lambda x: (
                float(x["timeSeconds"]),
                int(x["canonicalPitch"]),
                int(x["slotIndex"]),
            ))
            primary = drum_metrics(
                reference.get("drumEvents", []),
                events,
                float(protocol["metrics"]["primaryOnsetToleranceSeconds"]),
            )
            secondary = drum_metrics(
                reference.get("drumEvents", []),
                events,
                float(protocol["metrics"]["secondaryOnsetToleranceSeconds"]),
            )
            unsupported_predictions = [
                x for x in events if str(x["role"]).startswith("unsupported_pitch_")
            ]
            unsupported_pitch_counts = dict(sorted(Counter(
                int(x["canonicalPitch"]) for x in unsupported_predictions
            ).items()))

            result_dir = temp_root / fixture_id
            result_dir.mkdir()
            midi, midi_stats = build_midi(
                notes,
                sample_rate=int(model_config.sample_rate),
                instrument_id=drum_instrument_id,
                min_midi_note_ms=float(protocol["inference"]["minMidiNoteMs"]),
                max_midi_melodic_instruments=0,
                instrument_volumes=None,
                drum_pitch_aliases={
                    int(k): int(v)
                    for k, v in protocol["drumPitchPolicy"]["aliasesBeforeScoring"].items()
                },
                return_stats=True,
            )
            midi_file = result_dir / "tsumugi-drums-v1_5.mid"
            midi.write(str(midi_file))

            result = {
                "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-controlled-result-v1",
                "version": 1,
                "runId": protocol["runId"],
                "candidateId": protocol["candidateId"],
                "fixtureId": fixture_id,
                "factor": reference.get("factor"),
                "sourceCondition": protocol["input"]["condition"],
                "input": {
                    "audioRelativePath": f"{fixture_id}/drums.wav",
                    "audioSha256": sha256_file(audio_file),
                    "referenceRelativePath": f"{fixture_id}/reference.json",
                    "referenceSha256": sha256_file(reference_file),
                },
                "resolvedInferenceSettings": resolved_settings,
                "decoderStats": decoder_stats,
                "rawPredictedNoteCount": len(notes),
                "events": events,
                "unsupportedOutputPitchCount": len(unsupported_predictions),
                "unsupportedOutputPitchCounts": unsupported_pitch_counts,
                "metrics": {
                    "primary30ms": primary,
                    "secondary50ms": secondary,
                    "unsupportedReferenceDiagnostic": unsupported_reference_diagnostic(
                        reference.get("drumEvents", []),
                        events,
                        float(protocol["metrics"]["primaryOnsetToleranceSeconds"]),
                    ),
                },
                "midi": {
                    "relativePath": "tsumugi-drums-v1_5.mid",
                    "sha256": sha256_file(midi_file),
                    "bytes": midi_file.stat().st_size,
                    "stats": midi_stats,
                },
                "safety": {
                    "sourceAudioOpened": False,
                    "fixtureAudioOpened": True,
                    "sourceSeparationExecuted": False,
                    "retuningPerformed": False,
                    "consumedIndependentEvaluationFamiliesUsedForTuning": 0,
                    "freshOwnedBeatFamiliesConsumed": 0,
                    "trainingAuthorized": False,
                    "batch131Authorized": False,
                    "taskDataReadyMayBeDeclared": False,
                },
            }
            result_file = result_dir / "result.json"
            result_file.write_text(stable_json(result), encoding="utf-8")
            rows.append({
                "fixtureId": fixture_id,
                "factor": reference.get("factor"),
                "resultSha256": sha256_file(result_file),
                "candidatePrimary30ms": primary,
                "candidateSecondary50ms": secondary,
                "predictedEvents": len(events),
                "unsupportedOutputPitchCount": len(unsupported_predictions),
                "unsupportedOutputPitchCounts": unsupported_pitch_counts,
            })

        gate = controlled_gate(rows, protocol)
        summary = {
            "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-controlled-summary-v1",
            "version": 1,
            "status": "CONTROLLED_TSUMUGI_INFERENCE_COMPLETE_DIAGNOSTIC_ONLY",
            "runId": protocol["runId"],
            "candidateId": protocol["candidateId"],
            "records": len(rows),
            "environmentReceiptSha256": sha256_file(receipt_path),
            "protocolSha256": sha256_file(PROTOCOL_FILE),
            "environmentSpecSha256": sha256_file(ENV_SPEC_FILE),
            "fixtureManifestSha256": sha256_file(manifest_file),
            "checkpointSha256": sha256_file(checkpoint),
            "resolvedInferenceSettings": resolved_settings,
            "results": rows,
            "controlledGate": gate,
            "safety": {
                "sourceAudioOpenedByThisCommand": False,
                "fixtureAudioOpenedByThisCommand": True,
                "sourceSeparationExecutedByThisCommand": False,
                "retuningPerformedByThisCommand": False,
                "consumedIndependentEvaluationFamiliesUsedForTuning": 0,
                "freshOwnedBeatFamiliesConsumed": 0,
                "trainingAuthorized": False,
                "batch131Authorized": False,
                "taskDataReadyMayBeDeclared": False,
            },
            "nextAction": protocol["nextIfPass"] if gate["pass"] else protocol["nextIfFail"],
        }
        (temp_root / "summary.json").write_text(stable_json(summary), encoding="utf-8")
        temp_root.rename(output_root)
    except Exception:
        shutil.rmtree(temp_root, ignore_errors=True)
        raise

    return {
        "mode": "FAME_NEURAL_P5_TSUMUGI_CONTROLLED_COMPLETE",
        "runId": protocol["runId"],
        "candidateId": protocol["candidateId"],
        "records": len(rows),
        "controlledGatePass": gate["pass"],
        "sourceAudioOpenedByThisCommand": False,
        "fixtureAudioOpenedByThisCommand": True,
        "sourceSeparationExecutedByThisCommand": False,
        "retuningPerformedByThisCommand": False,
        "freshOwnedBeatFamiliesConsumed": 0,
        "consumedIndependentEvaluationFamiliesUsedForTuning": 0,
        "trainingAuthorized": False,
        "batch131Authorized": False,
        "taskDataReadyMayBeDeclared": False,
        "summaryFile": str(output_root / "summary.json"),
        "resolvedInferenceSettings": resolved_settings,
        "results": rows,
        "nextAction": summary["nextAction"],
    }

def self_test():
    protocol = read_json(PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)
    if protocol["status"] != "FROZEN_BEFORE_FIRST_TSUMUGI_FIXTURE_AUDIO_ACCESS":
        raise RuntimeError("Protocol freeze self-test failed")
    if env_spec["status"] != "PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS":
        raise RuntimeError("Environment preflight lock self-test failed")
    fake_note = SimpleNamespace(
        pitch=40,
        start_sample=22050,
        end_sample=23152,
        velocity=100,
        instrument_id=1,
        slot_index=0,
        has_onset=True,
        has_offset=True,
    )
    event = map_note(fake_note, 22050, protocol)
    if event["canonicalPitch"] != 38 or event["role"] != "snare":
        raise RuntimeError("Tsumugi drum alias/mapping self-test failed")
    rows = []
    perfect = {
        "tp": 1, "fp": 0, "fn": 0,
        "precision": 1.0, "recall": 1.0, "f1": 1.0,
    }
    for fixture_id in protocol["controlledGate"]["requiredPerfectPrimary30ms"]:
        rows.append({"fixtureId": fixture_id, "candidatePrimary30ms": perfect})
    rows.append({"fixtureId": "D08_UNSUPPORTED_CLAP_RIM", "candidatePrimary30ms": {
        "tp": 0, "fp": 1, "fn": 0, "precision": 0.0, "recall": 0.0, "f1": 0.0
    }})
    gate = controlled_gate(rows, protocol)
    if gate["pass"] is not True or gate["promotesCandidate"] is not False:
        raise RuntimeError("Tsumugi controlled gate self-test failed")
    return {
        "mode": "FAME_NEURAL_P5_TSUMUGI_CONTROLLED_SELF_TEST_PASS",
        "candidateId": protocol["candidateId"],
        "mappedPitch40": event["canonicalPitch"],
        "mappedRole40": event["role"],
        "controlledFixtures": len(protocol["input"]["fixtures"]),
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["self-test", "execute"])
    ap.add_argument("workspace", nargs="?")
    args = ap.parse_args()
    if args.command == "self-test":
        out = self_test()
    else:
        if not args.workspace:
            raise RuntimeError("execute requires workspace")
        out = execute(Path(args.workspace))
    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL P5 TSUMUGI CONTROLLED FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
