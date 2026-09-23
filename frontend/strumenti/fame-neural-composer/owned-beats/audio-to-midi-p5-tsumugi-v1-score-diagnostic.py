#!/usr/bin/env python3
"""Append-only V1 score diagnostic for the frozen Tsumugi controlled fixtures.

The frozen drums_v1_5 checkpoint is a V1 Semi-CRF checkpoint. This diagnostic
runs only the frozen model forward pass and inspects pitch-wise interval scores.
It does not run a new Semi-CRF decode, final transcription, source separation,
retuning, training, or owned-beat audio access.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from types import SimpleNamespace

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1.json"
CONTROLLED_PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-controlled-protocol-v1.json"
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


def run_text(args, cwd=None):
    result = subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def role_from_reference(reference):
    supported = {"kick", "snare", "hihat"}
    return sorted({
        str(event.get("role"))
        for event in reference.get("drumEvents", [])
        if event.get("role") in supported
    })


def validate_protocol_contract(protocol, controlled, env_spec):
    if protocol.get("status") != "FROZEN_BEFORE_FIRST_V1_SCORE_DIAGNOSTIC_RUN":
        raise RuntimeError("V1 score diagnostic protocol is not frozen")
    if controlled.get("status") != "FROZEN_BEFORE_FIRST_TSUMUGI_FIXTURE_AUDIO_ACCESS":
        raise RuntimeError("Frozen Tsumugi controlled protocol is unavailable")
    if env_spec.get("status") != "PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS":
        raise RuntimeError("Frozen Tsumugi environment preflight is unavailable")
    if protocol.get("candidateId") != controlled.get("candidateId"):
        raise RuntimeError("Diagnostic and controlled candidateId differ")
    if protocol.get("candidateId") != env_spec.get("candidateId"):
        raise RuntimeError("Diagnostic and environment candidateId differ")
    if protocol.get("sourceRunId") != controlled.get("runId"):
        raise RuntimeError("Diagnostic sourceRunId differs from controlled runId")
    if list(protocol.get("fixtures") or []) != list((controlled.get("input") or {}).get("fixtures") or []):
        raise RuntimeError("Diagnostic fixture set differs from controlled fixture set")

    checkpoint_contract = protocol.get("checkpointContract") or {}
    if checkpoint_contract != {
        "semiCrfVersion": "v1",
        "numPitchSlots": 1,
        "numPitches": 88,
        "midiRange": [21, 108],
        "checkpointSha256": env_spec["checkpoint"]["sha256"],
    }:
        raise RuntimeError("V1 checkpoint contract differs from frozen environment")

    controlled_inference = controlled.get("inference") or {}
    contract = protocol.get("inferenceContract") or {}
    expected = {
        "reuseControlledCheckpointAndEnvironment": True,
        "device": controlled_inference.get("device"),
        "amp": controlled_inference.get("amp"),
        "compile": controlled_inference.get("compile"),
        "instrumentFilter": controlled_inference.get("instrumentFilter"),
        "noteBias": controlled_inference.get("noteBias"),
        "semiCrfBackend": controlled_inference.get("semiCrfBackend"),
        "noParameterMutation": True,
        "semiCrfDecodeInThisDiagnostic": False,
        "finalTranscriptionInThisDiagnostic": False,
    }
    if contract != expected:
        raise RuntimeError("V1 diagnostic inference contract differs from controlled inference")
    return checkpoint_contract, contract


def execute(workspace: Path):
    workspace = workspace.resolve()
    protocol = read_json(PROTOCOL_FILE)
    controlled = read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)
    checkpoint_contract, inference_contract = validate_protocol_contract(
        protocol, controlled, env_spec
    )

    source_root = workspace / env_spec["workspace"]["sourceRelativePath"]
    checkpoint = workspace / env_spec["workspace"]["checkpointRelativePath"]
    if not source_root.is_dir():
        raise RuntimeError(f"Tsumugi source root missing: {source_root}")
    if not checkpoint.is_file():
        raise RuntimeError(f"Tsumugi checkpoint missing: {checkpoint}")
    source_head = run_text(["git", "rev-parse", "HEAD"], cwd=source_root)
    source_status = run_text(["git", "status", "--porcelain"], cwd=source_root)
    if source_head != env_spec["source"]["commit"]:
        raise RuntimeError(f"Tsumugi source HEAD mismatch: {source_head}")
    if source_status:
        raise RuntimeError("Tsumugi source checkout is not clean")
    if sha256_file(checkpoint) != checkpoint_contract["checkpointSha256"]:
        raise RuntimeError("Tsumugi checkpoint SHA mismatch")
    if checkpoint.stat().st_size != int(env_spec["checkpoint"]["bytes"]):
        raise RuntimeError("Tsumugi checkpoint byte-size mismatch")

    source_root_run = (
        workspace / "runs" / "audio-to-midi-p5-tsumugi-controlled" / protocol["sourceRunId"]
    )
    source_summary_file = source_root_run / "summary.json"
    if not source_summary_file.is_file():
        raise RuntimeError(f"Source controlled summary missing: {source_summary_file}")
    source_summary = read_json(source_summary_file)
    if source_summary.get("status") != "CONTROLLED_TSUMUGI_INFERENCE_COMPLETE_DIAGNOSTIC_ONLY":
        raise RuntimeError("Unexpected source controlled summary status")

    fixture_root = (
        workspace / "runs" / "audio-to-midi-p3-controlled-fixtures" / controlled["fixtureRunId"]
    )
    manifest_file = fixture_root / "fixture-manifest.json"
    if not manifest_file.is_file():
        raise RuntimeError(f"Fixture manifest missing: {manifest_file}")
    if sha256_file(manifest_file) != controlled["fixtureManifestSha256"]:
        raise RuntimeError("Frozen fixture manifest SHA mismatch")

    sys.path.insert(0, str(source_root))
    import torch
    from instrument_agnostic_amt.amt.cli.infer import (
        load_model,
        resolve_inference_settings,
    )
    from instrument_agnostic_amt.amt.data.constants import MIN_MIDI_PITCH, MAX_MIDI_PITCH, NUM_PITCHES
    from instrument_agnostic_amt.amt.inference.audio import load_audio
    from instrument_agnostic_amt.amt.modeling.heads.semi_crf import _build_interval_score

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; CPU fallback forbidden")
    device_name = torch.cuda.get_device_name(0)
    if device_name != env_spec["observedPreflight"]["deviceName"]:
        raise RuntimeError(f"CUDA device changed since preflight: {device_name}")
    device = torch.device("cuda")

    model, model_config, training_args = load_model(checkpoint, device=device)
    if str(model_config.semi_crf_version) != checkpoint_contract["semiCrfVersion"]:
        raise RuntimeError(
            f"Checkpoint Semi-CRF head mismatch: {model_config.semi_crf_version}"
        )
    if int(model_config.num_pitch_slots) != int(checkpoint_contract["numPitchSlots"]):
        raise RuntimeError(
            f"Checkpoint num_pitch_slots mismatch: {model_config.num_pitch_slots}"
        )
    if int(NUM_PITCHES) != int(checkpoint_contract["numPitches"]):
        raise RuntimeError(f"Unexpected pitch count: {NUM_PITCHES}")
    if [int(MIN_MIDI_PITCH), int(MAX_MIDI_PITCH)] != [
        int(x) for x in checkpoint_contract["midiRange"]
    ]:
        raise RuntimeError("Tsumugi MIDI range mismatch")

    frozen = controlled["inference"]
    args = SimpleNamespace(
        window_ms=None,
        stride_ms=None,
        semi_crf_track_batch_size=None,
        window_batch_size=int(frozen["windowBatchSize"]),
        merge_gap_ms=frozen["mergeGapMs"],
        merge_onset_ms=float(frozen["mergeOnsetMs"]),
        silence_gate_rms_dbfs=float(frozen["silenceGateRmsDbfs"]),
        note_bias=float(inference_contract["noteBias"]),
        disable_tqdm=True,
        no_boundary_head=not bool(frozen["useBoundaryHead"]),
        semi_crf_backend=str(inference_contract["semiCrfBackend"]),
        semi_crf_sparse_decode=False,
        semi_crf_sparse_topk_per_start=16,
        semi_crf_sparse_score_threshold=None,
        semi_crf_sparse_max_span_ms=None,
        instrument_pair_infer_topk=int(frozen["instrumentPairInferTopk"]),
        instrument_pair_gate_threshold=float(frozen["instrumentPairGateThreshold"]),
        instrument_pair_max_pairs=int(frozen["instrumentPairMaxPairs"]),
    )
    settings = resolve_inference_settings(model_config, training_args, args)
    if float(settings.note_bias) != float(inference_contract["noteBias"]):
        raise RuntimeError("Resolved note_bias differs from V1 diagnostic contract")
    if str(settings.semi_crf_backend) != str(inference_contract["semiCrfBackend"]):
        raise RuntimeError("Resolved Semi-CRF backend differs from V1 diagnostic contract")

    source_resolved = source_summary.get("resolvedInferenceSettings") or {}
    expected_resolved = {
        "sampleRate": int(model_config.sample_rate),
        "windowMs": int(settings.window_ms),
        "strideMs": int(settings.stride_ms),
        "trackBatchSize": int(settings.track_batch_size),
        "windowBatchSize": int(settings.window_batch_size),
        "noteBias": float(settings.note_bias),
        "semiCrfBackend": str(settings.semi_crf_backend),
        "device": inference_contract["device"],
        "ampEnabled": False,
        "compileEnabled": False,
    }
    for key, value in expected_resolved.items():
        if source_resolved.get(key) != value:
            raise RuntimeError(
                f"Resolved V1 diagnostic setting differs from source controlled run: "
                f"{key}={value} source={source_resolved.get(key)}"
            )

    target_midis = [int(x) for x in protocol["pitchDiagnostics"]["targetPitches"]]
    role_groups = {
        role: [int(x) for x in pitches]
        for role, pitches in protocol["pitchDiagnostics"]["roleGroups"].items()
    }

    run_root = (
        workspace / "runs" / "audio-to-midi-p5-tsumugi-v1-score-diagnostic" / protocol["runId"]
    )
    if run_root.exists():
        raise RuntimeError(f"Append-only V1 score diagnostic already exists: {run_root}")
    run_root.parent.mkdir(parents=True, exist_ok=True)
    temp_root = run_root.parent / f".{protocol['runId']}.tmp-{uuid.uuid4().hex}"
    temp_root.mkdir()

    rows = []
    try:
        for fixture_id in protocol["fixtures"]:
            fixture_dir = fixture_root / fixture_id
            audio_file = fixture_dir / "drums.wav"
            reference_file = fixture_dir / "reference.json"
            source_result_file = source_root_run / fixture_id / "result.json"
            if not audio_file.is_file() or not reference_file.is_file():
                raise RuntimeError(f"Frozen fixture files missing: {fixture_id}")
            if not source_result_file.is_file():
                raise RuntimeError(f"Source controlled result missing: {source_result_file}")

            reference = read_json(reference_file)
            source_result = read_json(source_result_file)
            waveform = load_audio(audio_file, target_sample_rate=int(model_config.sample_rate))
            if waveform.dim() != 2:
                raise RuntimeError("Unexpected Tsumugi waveform shape")
            expected_channels = int(getattr(model_config, "input_audio_channels", 2))
            if int(waveform.shape[0]) != expected_channels:
                if expected_channels == 1 and int(waveform.shape[0]) > 1:
                    waveform = waveform.mean(dim=0, keepdim=True)
                elif expected_channels == 2 and int(waveform.shape[0]) == 1:
                    waveform = waveform.expand(2, -1).contiguous()
                else:
                    raise RuntimeError("Unexpected Tsumugi input channel count")

            sample_rate = int(model_config.sample_rate)
            window_audio_frames = int(round(float(settings.window_ms) * sample_rate / 1000.0))
            valid_audio_frames = int(waveform.shape[-1])
            if valid_audio_frames > window_audio_frames:
                raise RuntimeError("V1 score diagnostic assumes one controlled window per fixture")
            padded = torch.zeros(
                (int(waveform.shape[0]), window_audio_frames), dtype=waveform.dtype
            )
            padded[:, :valid_audio_frames] = waveform
            batch_waveform = padded.unsqueeze(0).to(device)
            valid_audio_frames_tensor = torch.tensor(
                [valid_audio_frames], dtype=torch.long, device=device
            )

            with torch.inference_mode():
                outputs = model(
                    batch_waveform,
                    valid_audio_frames=valid_audio_frames_tensor,
                    include_aux_outputs=False,
                    include_frame_instrument_logits=False,
                )

            required = ("interval_query", "interval_key", "interval_diag", "frame_valid_mask")
            missing = [name for name in required if outputs.get(name) is None]
            if missing:
                raise RuntimeError(f"V1 diagnostic outputs missing: {missing}")
            if outputs.get("pair_gate_logits") is not None:
                raise RuntimeError("Unexpected pair_gate_logits on frozen V1 checkpoint")

            frame_valid_mask = outputs["frame_valid_mask"]
            valid_length = int(frame_valid_mask[0].to(dtype=torch.long).sum().item())
            if valid_length <= 0:
                raise RuntimeError(f"No valid model frames: {fixture_id}")
            interval_query = outputs["interval_query"]
            interval_key = outputs["interval_key"]
            interval_diag = outputs["interval_diag"]
            if int(interval_query.shape[2]) != int(NUM_PITCHES):
                raise RuntimeError(
                    f"Unexpected V1 track count: {int(interval_query.shape[2])}"
                )

            target_rows = []
            for midi_pitch in target_midis:
                pitch_index = midi_pitch - int(MIN_MIDI_PITCH)
                query = interval_query[0, :valid_length, pitch_index, :].unsqueeze(1)
                key = interval_key[0, :valid_length, pitch_index, :].unsqueeze(1)
                diag = interval_diag[0, :valid_length, pitch_index].unsqueeze(1)
                score = _build_interval_score(
                    query,
                    key,
                    diag,
                    length_scaling=str(model_config.semi_crf_length_scaling),
                    length_penalty=float(model_config.semi_crf_length_penalty),
                    note_bias=float(settings.note_bias),
                )[:, :, 0].float()
                diagonal = torch.diagonal(score)
                strict_lower = torch.tril(
                    torch.ones(valid_length, valid_length, device=device, dtype=torch.bool),
                    diagonal=-1,
                )
                non_singleton = score[strict_lower]
                max_singleton = (
                    float(diagonal.max().item()) if diagonal.numel() else float("-inf")
                )
                max_non_singleton = (
                    float(non_singleton.max().item())
                    if non_singleton.numel()
                    else float("-inf")
                )
                max_event = max(max_singleton, max_non_singleton)
                target_rows.append({
                    "midiPitch": midi_pitch,
                    "pitchIndex": pitch_index,
                    "maxSingletonScore": round(max_singleton, 9),
                    "positiveSingletonCount": int((diagonal > 0).sum().item()),
                    "maxNonSingletonScore": round(max_non_singleton, 9),
                    "positiveNonSingletonCount": int((non_singleton > 0).sum().item()),
                    "maxEventScore": round(max_event, 9),
                    "positiveIntervalScorePresent": bool(max_event > 0.0),
                })

            target_by_pitch = {row["midiPitch"]: row for row in target_rows}
            expected_roles = role_from_reference(reference)
            source_decoder = source_result.get("decoderStats") or {}
            source_decoded_intervals = int(
                source_decoder.get("decoded_interval_count")
                if "decoded_interval_count" in source_decoder
                else source_decoder.get("decodedIntervalCount") or 0
            )
            source_events = source_result.get("events") or []
            role_rows = []
            for role in expected_roles:
                role_pitch_set = set(role_groups[role])
                role_targets = [
                    target_by_pitch[pitch]
                    for pitch in role_groups[role]
                    if pitch in target_by_pitch
                ]
                best = max((row["maxEventScore"] for row in role_targets), default=None)
                any_positive = any(
                    row["positiveIntervalScorePresent"] for row in role_targets
                )
                source_target_events = [
                    event for event in source_events
                    if int(event.get("rawPitch", -1)) in role_pitch_set
                ]
                source_target_event_count = len(source_target_events)
                source_target_raw_pitch_counts = {
                    str(pitch): sum(
                        1 for event in source_target_events
                        if int(event.get("rawPitch", -1)) == pitch
                    )
                    for pitch in role_groups[role]
                }
                if source_target_event_count > 0:
                    localization = "SOURCE_CONTROLLED_TARGET_PITCH_EVENTS_PRESENT"
                elif any_positive:
                    localization = "POSITIVE_TARGET_SCORE_BUT_SOURCE_TARGET_PITCH_ABSENT"
                else:
                    localization = "EXPECTED_ROLE_TARGET_SCORES_NONPOSITIVE"
                role_rows.append({
                    "role": role,
                    "targetPitches": role_groups[role],
                    "bestMaxEventScore": best,
                    "anyPositiveIntervalScore": any_positive,
                    "sourceControlledDecodedIntervalCount": source_decoded_intervals,
                    "sourceControlledTargetPitchEventCount": source_target_event_count,
                    "sourceControlledTargetRawPitchCounts": source_target_raw_pitch_counts,
                    "localization": localization,
                })

            result = {
                "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-result-v1",
                "version": 1,
                "runId": protocol["runId"],
                "candidateId": protocol["candidateId"],
                "fixtureId": fixture_id,
                "factor": reference.get("factor"),
                "expectedSupportedRoles": expected_roles,
                "input": {
                    "audioSha256": sha256_file(audio_file),
                    "referenceSha256": sha256_file(reference_file),
                    "sourceControlledResultSha256": sha256_file(source_result_file),
                },
                "resolved": {
                    "semiCrfVersion": str(model_config.semi_crf_version),
                    "numPitchSlots": int(model_config.num_pitch_slots),
                    "sampleRate": sample_rate,
                    "validAudioFrames": valid_audio_frames,
                    "validModelFrames": valid_length,
                    "numPitches": int(NUM_PITCHES),
                    "noteBias": float(settings.note_bias),
                    "semiCrfBackend": str(settings.semi_crf_backend),
                    "semiCrfLengthScaling": str(model_config.semi_crf_length_scaling),
                    "semiCrfLengthPenalty": float(model_config.semi_crf_length_penalty),
                    "blankNoiseScore": 0.0,
                },
                "sourceControlled": {
                    "rawPredictedNoteCount": int(source_result.get("rawPredictedNoteCount") or 0),
                    "decodedIntervalCount": source_decoded_intervals,
                    "decoderStats": source_decoder,
                },
                "targetPitchDiagnostics": target_rows,
                "expectedRoleDiagnostics": role_rows,
                "safety": {
                    "sourceAudioOpened": False,
                    "ownedBeatAudioOpened": False,
                    "fixtureAudioOpened": True,
                    "diagnosticModelForwardExecuted": True,
                    "semiCrfDecodeExecuted": False,
                    "finalTranscriptionExecuted": False,
                    "sourceSeparationExecuted": False,
                    "retuningPerformed": False,
                    "trainingAuthorized": False,
                    "batch131Authorized": False,
                    "taskDataReadyMayBeDeclared": False,
                },
            }
            result_dir = temp_root / fixture_id
            result_dir.mkdir()
            result_file = result_dir / "result.json"
            result_file.write_text(stable_json(result), encoding="utf-8")
            rows.append({
                "fixtureId": fixture_id,
                "factor": reference.get("factor"),
                "expectedSupportedRoles": expected_roles,
                "sourceControlledDecodedIntervalCount": source_decoded_intervals,
                "expectedRoleDiagnostics": role_rows,
                "resultSha256": sha256_file(result_file),
            })
            del outputs, batch_waveform, interval_query, interval_key, interval_diag
            torch.cuda.empty_cache()

        summary = {
            "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-summary-v1",
            "version": 1,
            "status": "TSUMUGI_V1_SCORE_DIAGNOSTIC_COMPLETE_NO_RETUNING",
            "runId": protocol["runId"],
            "candidateId": protocol["candidateId"],
            "records": len(rows),
            "protocolSha256": sha256_file(PROTOCOL_FILE),
            "controlledProtocolSha256": sha256_file(CONTROLLED_PROTOCOL_FILE),
            "environmentSpecSha256": sha256_file(ENV_SPEC_FILE),
            "sourceControlledSummarySha256": sha256_file(source_summary_file),
            "checkpointSha256": sha256_file(checkpoint),
            "sourceCommit": source_head,
            "runtime": {
                "device": "cuda",
                "deviceName": device_name,
                "semiCrfVersion": str(model_config.semi_crf_version),
                "numPitchSlots": int(model_config.num_pitch_slots),
                "noteBias": float(settings.note_bias),
                "semiCrfBackend": str(settings.semi_crf_backend),
                "semiCrfLengthScaling": str(model_config.semi_crf_length_scaling),
                "semiCrfLengthPenalty": float(model_config.semi_crf_length_penalty),
            },
            "results": rows,
            "safety": {
                "sourceAudioOpenedByThisCommand": False,
                "ownedBeatAudioOpenedByThisCommand": False,
                "fixtureAudioOpenedByThisCommand": True,
                "diagnosticModelForwardExecutedByThisCommand": True,
                "semiCrfDecodeExecutedByThisCommand": False,
                "finalTranscriptionExecutedByThisCommand": False,
                "sourceSeparationExecutedByThisCommand": False,
                "retuningPerformedByThisCommand": False,
                "trainingAuthorized": False,
                "batch131Authorized": False,
                "taskDataReadyMayBeDeclared": False,
            },
            "nextAction": "REVIEW_V1_PITCH_SCORE_MARGINS_BEFORE_ANY_REAL_EASY_ACCESS",
        }
        (temp_root / "summary.json").write_text(stable_json(summary), encoding="utf-8")
        temp_root.rename(run_root)
    except Exception:
        shutil.rmtree(temp_root, ignore_errors=True)
        raise

    return {
        "mode": "FAME_NEURAL_P5_TSUMUGI_V1_SCORE_DIAGNOSTIC_COMPLETE",
        "runId": protocol["runId"],
        "candidateId": protocol["candidateId"],
        "records": len(rows),
        "semiCrfVersion": str(model_config.semi_crf_version),
        "numPitchSlots": int(model_config.num_pitch_slots),
        "sourceAudioOpenedByThisCommand": False,
        "ownedBeatAudioOpenedByThisCommand": False,
        "fixtureAudioOpenedByThisCommand": True,
        "diagnosticModelForwardExecutedByThisCommand": True,
        "semiCrfDecodeExecutedByThisCommand": False,
        "finalTranscriptionExecutedByThisCommand": False,
        "retuningPerformedByThisCommand": False,
        "trainingAuthorized": False,
        "batch131Authorized": False,
        "taskDataReadyMayBeDeclared": False,
        "summaryFile": str(run_root / "summary.json"),
        "nextAction": summary["nextAction"],
    }


def self_test():
    protocol = read_json(PROTOCOL_FILE)
    controlled = read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)
    checkpoint_contract, inference_contract = validate_protocol_contract(
        protocol, controlled, env_spec
    )
    return {
        "mode": "FAME_NEURAL_P5_TSUMUGI_V1_SCORE_DIAGNOSTIC_SELF_TEST_PASS",
        "semiCrfVersion": checkpoint_contract["semiCrfVersion"],
        "numPitchSlots": checkpoint_contract["numPitchSlots"],
        "numPitches": checkpoint_contract["numPitches"],
        "noteBias": inference_contract["noteBias"],
        "semiCrfDecodeInThisDiagnostic": inference_contract["semiCrfDecodeInThisDiagnostic"],
        "finalTranscriptionInThisDiagnostic": inference_contract["finalTranscriptionInThisDiagnostic"],
        "fixtureSetBindingVerified": True,
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
            ap.error("workspace is required for execute")
        out = execute(Path(args.workspace))
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL TSUMUGI V1 SCORE DIAGNOSTIC FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
