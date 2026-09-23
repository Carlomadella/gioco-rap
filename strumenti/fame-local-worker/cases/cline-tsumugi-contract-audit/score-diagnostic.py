#!/usr/bin/env python3
"""Append-only score diagnostic for frozen Tsumugi controlled fixtures.

This diagnostic does not change inference parameters and does not emit a new
transcription. It runs the frozen model forward on the already-authorized
synthetic fixtures and records pair-gate logits plus Semi-CRF interval-score
margins at note_bias=0.
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
DIAG_PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-score-diagnostic-v1.json"
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

def max_or_none(values):
    values = list(values)
    return None if not values else max(values)

def finite_or_none(value):
    value = float(value)
    return value if math.isfinite(value) else None

def execute(workspace: Path):
    workspace = workspace.resolve()
    diag_protocol = read_json(DIAG_PROTOCOL_FILE)
    controlled = read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)

    if diag_protocol.get("status") != "FROZEN_BEFORE_FIRST_SCORE_DIAGNOSTIC_RUN":
        raise RuntimeError("Tsumugi score diagnostic protocol is not frozen")
    if controlled.get("status") != "FROZEN_BEFORE_FIRST_TSUMUGI_FIXTURE_AUDIO_ACCESS":
        raise RuntimeError("Frozen Tsumugi controlled protocol is unavailable")
    if env_spec.get("status") != "PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS":
        raise RuntimeError("Frozen Tsumugi environment preflight is unavailable")

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
    if sha256_file(checkpoint) != env_spec["checkpoint"]["sha256"]:
        raise RuntimeError("Tsumugi checkpoint SHA mismatch")
    if checkpoint.stat().st_size != int(env_spec["checkpoint"]["bytes"]):
        raise RuntimeError("Tsumugi checkpoint byte-size mismatch")

    source_summary_file = (
        workspace
        / "runs"
        / "audio-to-midi-p5-tsumugi-controlled"
        / diag_protocol["sourceRunId"]
        / "summary.json"
    )
    if not source_summary_file.is_file():
        raise RuntimeError(f"Source controlled summary missing: {source_summary_file}")
    source_summary = read_json(source_summary_file)
    if source_summary.get("status") != "CONTROLLED_TSUMUGI_INFERENCE_COMPLETE_DIAGNOSTIC_ONLY":
        raise RuntimeError("Unexpected source controlled summary status")

    fixture_root = (
        workspace
        / "runs"
        / "audio-to-midi-p3-controlled-fixtures"
        / controlled["fixtureRunId"]
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
        resolve_instrument_id,
    )
    from instrument_agnostic_amt.amt.data.constants import (
        MIN_MIDI_PITCH,
        MAX_MIDI_PITCH,
        NUM_PITCHES,
    )
    from instrument_agnostic_amt.amt.inference.audio import load_audio
    from instrument_agnostic_amt.amt.modeling.heads.semi_crf import (
        build_factorized_interval_score,
    )

    if int(NUM_PITCHES) != int(diag_protocol["pitchDiagnostics"]["numPitches"]):
        raise RuntimeError(f"Unexpected Tsumugi pitch count: {NUM_PITCHES}")
    if [int(MIN_MIDI_PITCH), int(MAX_MIDI_PITCH)] != [
        int(x) for x in diag_protocol["pitchDiagnostics"]["midiRange"]
    ]:
        raise RuntimeError("Tsumugi MIDI pitch range mismatch")

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; CPU fallback forbidden")
    device_name = torch.cuda.get_device_name(0)
    if device_name != env_spec["observedPreflight"]["deviceName"]:
        raise RuntimeError(f"CUDA device changed since preflight: {device_name}")
    device = torch.device("cuda")

    model, model_config, training_args = load_model(checkpoint, device=device)
    drum_instrument_id = int(resolve_instrument_id("drums"))

    frozen = controlled["inference"]
    args = SimpleNamespace(
        window_ms=None,
        stride_ms=None,
        semi_crf_track_batch_size=None,
        window_batch_size=int(frozen["windowBatchSize"]),
        merge_gap_ms=frozen["mergeGapMs"],
        merge_onset_ms=float(frozen["mergeOnsetMs"]),
        silence_gate_rms_dbfs=float(frozen["silenceGateRmsDbfs"]),
        note_bias=float(frozen["noteBias"]),
        disable_tqdm=True,
        no_boundary_head=not bool(frozen["useBoundaryHead"]),
        semi_crf_backend=str(frozen["semiCrfBackend"]),
        semi_crf_sparse_decode=bool(frozen["semiCrfSparseDecode"]),
        semi_crf_sparse_topk_per_start=16,
        semi_crf_sparse_score_threshold=None,
        semi_crf_sparse_max_span_ms=None,
        instrument_pair_infer_topk=int(frozen["instrumentPairInferTopk"]),
        instrument_pair_gate_threshold=float(frozen["instrumentPairGateThreshold"]),
        instrument_pair_max_pairs=int(frozen["instrumentPairMaxPairs"]),
    )
    settings = resolve_inference_settings(model_config, training_args, args)
    settings = __import__("dataclasses").replace(
        settings, allowed_instrument_ids=(drum_instrument_id,)
    )

    source_resolved = source_summary.get("resolvedInferenceSettings") or {}
    expected_resolved = {
        "sampleRate": int(model_config.sample_rate),
        "windowMs": int(settings.window_ms),
        "strideMs": int(settings.stride_ms),
        "trackBatchSize": int(settings.track_batch_size),
        "windowBatchSize": int(settings.window_batch_size),
        "noteBias": float(settings.note_bias),
        "semiCrfBackend": str(settings.semi_crf_backend),
        "drumInstrumentId": drum_instrument_id,
        "device": "cuda",
    }
    for key, value in expected_resolved.items():
        if source_resolved.get(key) != value:
            raise RuntimeError(
                f"Resolved diagnostic setting differs from source controlled run: "
                f"{key}={value} source={source_resolved.get(key)}"
            )

    length_scaling = str(model_config.semi_crf_length_scaling)
    length_penalty = float(model_config.semi_crf_length_penalty)
    note_bias = float(settings.note_bias)
    if note_bias != float(diag_protocol["inferenceContract"]["noteBias"]):
        raise RuntimeError("note_bias differs from frozen score diagnostic contract")

    target_midis = [int(x) for x in diag_protocol["pitchDiagnostics"]["targetPitches"]]
    role_groups = {
        role: [int(x) for x in pitches]
        for role, pitches in diag_protocol["pitchDiagnostics"]["roleGroups"].items()
    }
    threshold = float(settings.instrument_pair_gate_threshold)
    top_n = int(diag_protocol["pitchDiagnostics"]["topPairGatePitchesToReport"])

    run_root = (
        workspace
        / "runs"
        / "audio-to-midi-p5-tsumugi-score-diagnostic"
        / diag_protocol["runId"]
    )
    if run_root.exists():
        raise RuntimeError(f"Append-only score diagnostic already exists: {run_root}")
    run_root.parent.mkdir(parents=True, exist_ok=True)
    temp_root = run_root.parent / f".{diag_protocol['runId']}.tmp-{uuid.uuid4().hex}"
    temp_root.mkdir()

    rows = []
    try:
        for fixture_id in diag_protocol["fixtures"]:
            fixture_dir = fixture_root / fixture_id
            audio_file = fixture_dir / "drums.wav"
            reference_file = fixture_dir / "reference.json"
            if not audio_file.is_file() or not reference_file.is_file():
                raise RuntimeError(f"Frozen fixture files missing: {fixture_id}")
            reference = read_json(reference_file)

            waveform = load_audio(
                audio_file, target_sample_rate=int(model_config.sample_rate)
            )
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
            window_audio_frames = int(
                round(float(settings.window_ms) * sample_rate / 1000.0)
            )
            valid_audio_frames = int(waveform.shape[-1])
            if valid_audio_frames > window_audio_frames:
                raise RuntimeError(
                    "Score diagnostic assumes one frozen controlled window per 4s fixture"
                )
            padded = torch.zeros(
                (int(waveform.shape[0]), window_audio_frames),
                dtype=waveform.dtype,
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
                )

            frame_valid_mask = outputs["frame_valid_mask"]
            valid_length = int(
                frame_valid_mask[0].to(dtype=torch.long).sum().item()
            )
            if valid_length <= 0:
                raise RuntimeError(f"No valid model frames: {fixture_id}")

            pair_gate_logits = outputs["pair_gate_logits"][0].float()
            drum_gate_scores = pair_gate_logits[drum_instrument_id]
            score_rows = [
                {
                    "midiPitch": int(MIN_MIDI_PITCH) + idx,
                    "pitchIndex": idx,
                    "pairGateLogit": float(drum_gate_scores[idx].item()),
                }
                for idx in range(int(NUM_PITCHES))
            ]
            ranked_gate = sorted(
                score_rows,
                key=lambda row: (-row["pairGateLogit"], row["midiPitch"]),
            )
            gate_rank = {
                row["midiPitch"]: rank + 1
                for rank, row in enumerate(ranked_gate)
            }

            target_indices = torch.tensor(
                [midi - int(MIN_MIDI_PITCH) for midi in target_midis],
                dtype=torch.long,
                device=device,
            )
            pair_batch_indices = torch.zeros(
                len(target_midis), dtype=torch.long, device=device
            )
            pair_instrument_indices = torch.full(
                (len(target_midis),),
                drum_instrument_id,
                dtype=torch.long,
                device=device,
            )

            interval_score = build_factorized_interval_score(
                outputs["pitch_interval_query"][:, :valid_length],
                outputs["pitch_interval_key"][:, :valid_length],
                outputs["pitch_interval_diag"][:, :valid_length],
                outputs["instrument_interval_query"],
                outputs["instrument_interval_key"],
                outputs["instrument_interval_diag"],
                pair_batch_indices,
                pair_instrument_indices,
                target_indices,
                length_scaling=length_scaling,
                length_penalty=length_penalty,
                note_bias=note_bias,
            ).float()

            target_rows = []
            strict_lower_mask = torch.tril(
                torch.ones(
                    valid_length,
                    valid_length,
                    device=device,
                    dtype=torch.bool,
                ),
                diagonal=-1,
            )
            for target_index, midi_pitch in enumerate(target_midis):
                score_matrix = interval_score[:, :, target_index]
                diagonal = torch.diagonal(score_matrix)
                non_singleton = score_matrix[strict_lower_mask]
                max_singleton = float(diagonal.max().item()) if diagonal.numel() else float("-inf")
                max_non_singleton = (
                    float(non_singleton.max().item())
                    if non_singleton.numel()
                    else float("-inf")
                )
                max_event = max(max_singleton, max_non_singleton)
                gate_score = float(
                    drum_gate_scores[midi_pitch - int(MIN_MIDI_PITCH)].item()
                )
                target_rows.append({
                    "midiPitch": midi_pitch,
                    "pairGateLogit": round(gate_score, 9),
                    "pairGateMarginToThreshold": round(gate_score - threshold, 9),
                    "pairGateRankAmong88": int(gate_rank[midi_pitch]),
                    "pairGateAboveThreshold": bool(gate_score >= threshold),
                    "maxSingletonScore": round(max_singleton, 9),
                    "positiveSingletonCount": int((diagonal > 0).sum().item()),
                    "maxNonSingletonScore": round(max_non_singleton, 9),
                    "positiveNonSingletonCount": int((non_singleton > 0).sum().item()),
                    "maxEventScore": round(max_event, 9),
                    "eventScoreAboveBlankPath": bool(max_event > 0.0),
                })

            target_by_pitch = {row["midiPitch"]: row for row in target_rows}
            expected_roles = role_from_reference(reference)
            expected_role_rows = []
            for role in expected_roles:
                role_targets = [
                    target_by_pitch[pitch]
                    for pitch in role_groups[role]
                    if pitch in target_by_pitch
                ]
                best_gate = max_or_none(row["pairGateLogit"] for row in role_targets)
                best_event = max_or_none(row["maxEventScore"] for row in role_targets)
                any_gate = any(row["pairGateAboveThreshold"] for row in role_targets)
                any_event = any(row["eventScoreAboveBlankPath"] for row in role_targets)
                if not any_gate:
                    localization = "EXPECTED_ROLE_PAIR_GATE_BELOW_THRESHOLD"
                elif not any_event:
                    localization = "EXPECTED_ROLE_GATE_OK_INTERVAL_SCORES_NONPOSITIVE"
                else:
                    localization = "EXPECTED_ROLE_HAS_POSITIVE_INTERVAL_EVIDENCE"
                expected_role_rows.append({
                    "role": role,
                    "targetPitches": role_groups[role],
                    "bestPairGateLogit": best_gate,
                    "anyPairGateAboveThreshold": any_gate,
                    "bestMaxEventScore": best_event,
                    "anyEventScoreAboveBlankPath": any_event,
                    "localization": localization,
                })

            top_gate = [
                {
                    "rank": rank + 1,
                    "midiPitch": row["midiPitch"],
                    "pairGateLogit": round(row["pairGateLogit"], 9),
                    "aboveThreshold": bool(row["pairGateLogit"] >= threshold),
                }
                for rank, row in enumerate(ranked_gate[:top_n])
            ]

            result = {
                "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-score-diagnostic-result-v1",
                "version": 1,
                "runId": diag_protocol["runId"],
                "candidateId": diag_protocol["candidateId"],
                "fixtureId": fixture_id,
                "factor": reference.get("factor"),
                "expectedSupportedRoles": expected_roles,
                "input": {
                    "audioSha256": sha256_file(audio_file),
                    "referenceSha256": sha256_file(reference_file),
                },
                "resolved": {
                    "sampleRate": sample_rate,
                    "validAudioFrames": valid_audio_frames,
                    "validModelFrames": valid_length,
                    "drumInstrumentId": drum_instrument_id,
                    "numPitches": int(NUM_PITCHES),
                    "instrumentPairGateThreshold": threshold,
                    "instrumentPairInferTopk": int(settings.instrument_pair_infer_topk),
                    "topkCoversAllAllowedDrumPitches": bool(
                        int(settings.instrument_pair_infer_topk) >= int(NUM_PITCHES)
                    ),
                    "noteBias": note_bias,
                    "semiCrfLengthScaling": length_scaling,
                    "semiCrfLengthPenalty": length_penalty,
                    "blankNoiseScore": 0.0,
                },
                "topPairGatePitches": top_gate,
                "targetPitchDiagnostics": target_rows,
                "expectedRoleDiagnostics": expected_role_rows,
                "safety": {
                    "sourceAudioOpened": False,
                    "ownedBeatAudioOpened": False,
                    "fixtureAudioOpened": True,
                    "diagnosticModelForwardExecuted": True,
                    "transcriptionExecuted": False,
                    "sourceSeparationExecuted": False,
                    "retuningPerformed": False,
                    "freshOwnedBeatFamiliesConsumed": 0,
                    "consumedIndependentEvaluationFamiliesUsedForTuning": 0,
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
                "expectedRoleDiagnostics": expected_role_rows,
                "resultSha256": sha256_file(result_file),
            })

            del outputs, batch_waveform, interval_score
            torch.cuda.empty_cache()

        summary = {
            "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-score-diagnostic-summary-v1",
            "version": 1,
            "status": "TSUMUGI_SCORE_DIAGNOSTIC_COMPLETE_NO_RETUNING",
            "runId": diag_protocol["runId"],
            "candidateId": diag_protocol["candidateId"],
            "records": len(rows),
            "diagnosticProtocolSha256": sha256_file(DIAG_PROTOCOL_FILE),
            "controlledProtocolSha256": sha256_file(CONTROLLED_PROTOCOL_FILE),
            "environmentSpecSha256": sha256_file(ENV_SPEC_FILE),
            "sourceControlledSummarySha256": sha256_file(source_summary_file),
            "checkpointSha256": sha256_file(checkpoint),
            "sourceCommit": source_head,
            "runtime": {
                "device": "cuda",
                "deviceName": device_name,
                "noteBias": note_bias,
                "instrumentPairGateThreshold": threshold,
                "instrumentPairInferTopk": int(settings.instrument_pair_infer_topk),
                "numPitches": int(NUM_PITCHES),
                "topkCoversAllAllowedDrumPitches": bool(
                    int(settings.instrument_pair_infer_topk) >= int(NUM_PITCHES)
                ),
                "semiCrfLengthScaling": length_scaling,
                "semiCrfLengthPenalty": length_penalty,
            },
            "results": rows,
            "safety": {
                "sourceAudioOpenedByThisCommand": False,
                "ownedBeatAudioOpenedByThisCommand": False,
                "fixtureAudioOpenedByThisCommand": True,
                "diagnosticModelForwardExecutedByThisCommand": True,
                "transcriptionExecutedByThisCommand": False,
                "sourceSeparationExecutedByThisCommand": False,
                "retuningPerformedByThisCommand": False,
                "freshOwnedBeatFamiliesConsumed": 0,
                "consumedIndependentEvaluationFamiliesUsedForTuning": 0,
                "trainingAuthorized": False,
                "batch131Authorized": False,
                "taskDataReadyMayBeDeclared": False,
            },
            "nextAction": "REVIEW_PAIR_GATE_AND_INTERVAL_SCORE_MARGINS_BEFORE_ANY_REAL_EASY_ACCESS",
        }
        (temp_root / "summary.json").write_text(stable_json(summary), encoding="utf-8")
        temp_root.rename(run_root)
    except Exception:
        shutil.rmtree(temp_root, ignore_errors=True)
        raise

    return {
        "mode": "FAME_NEURAL_P5_TSUMUGI_SCORE_DIAGNOSTIC_COMPLETE",
        "runId": diag_protocol["runId"],
        "candidateId": diag_protocol["candidateId"],
        "records": len(rows),
        "topkCoversAllAllowedDrumPitches": summary["runtime"]["topkCoversAllAllowedDrumPitches"],
        "semiCrfLengthScaling": length_scaling,
        "semiCrfLengthPenalty": length_penalty,
        "sourceAudioOpenedByThisCommand": False,
        "ownedBeatAudioOpenedByThisCommand": False,
        "fixtureAudioOpenedByThisCommand": True,
        "diagnosticModelForwardExecutedByThisCommand": True,
        "transcriptionExecutedByThisCommand": False,
        "retuningPerformedByThisCommand": False,
        "freshOwnedBeatFamiliesConsumed": 0,
        "consumedIndependentEvaluationFamiliesUsedForTuning": 0,
        "trainingAuthorized": False,
        "batch131Authorized": False,
        "taskDataReadyMayBeDeclared": False,
        "summaryFile": str(run_root / "summary.json"),
        "results": rows,
        "nextAction": summary["nextAction"],
    }

def self_test():
    diag = read_json(DIAG_PROTOCOL_FILE)
    controlled = read_json(CONTROLLED_PROTOCOL_FILE)
    if diag["status"] != "FROZEN_BEFORE_FIRST_SCORE_DIAGNOSTIC_RUN":
        raise RuntimeError("Score diagnostic freeze self-test failed")
    if diag["inferenceContract"]["noteBias"] != 0.0:
        raise RuntimeError("Score diagnostic must preserve note_bias=0")
    if diag["pitchDiagnostics"]["numPitches"] != 88:
        raise RuntimeError("Unexpected frozen Tsumugi pitch count")
    if controlled["inference"]["instrumentPairInferTopk"] < 88:
        raise RuntimeError("Expected top-k to cover all allowed drum pitches")
    return {
        "mode": "FAME_NEURAL_P5_TSUMUGI_SCORE_DIAGNOSTIC_SELF_TEST_PASS",
        "numPitches": 88,
        "instrumentPairInferTopk": controlled["inference"]["instrumentPairInferTopk"],
        "topkCoversAllAllowedDrumPitches": True,
        "noteBias": diag["inferenceContract"]["noteBias"],
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["self-test", "execute"])
    ap.add_argument("workspace", nargs="?")
    args = ap.parse_args()
    out = self_test() if args.command == "self-test" else execute(Path(args.workspace))
    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL TSUMUGI SCORE DIAGNOSTIC FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
