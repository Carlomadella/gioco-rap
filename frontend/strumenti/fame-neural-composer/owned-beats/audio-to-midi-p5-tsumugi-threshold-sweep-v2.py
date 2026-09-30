#!/usr/bin/env python3
"""Development-only Tsumugi pair-gate threshold sweep V2.

V1 was diagnostically invalid because instrument_pair_infer_topk=256 unions
top-k candidates back into threshold selection. With one allowed drum
instrument and fewer than 256 pitch pairs, every tested threshold kept the
same candidate set. V2 freezes top-k to zero so the threshold can actually
filter pair candidates.
"""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import replace
import hashlib
import importlib.util
import json
import shutil
import sys
import uuid
from pathlib import Path
from types import SimpleNamespace

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-threshold-sweep-v2.json"
REAL_EASY_FILE = HERE / "audio-to-midi-p5-tsumugi-real-easy-development.py"
REAL_EASY_PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-real-easy-development-v1.json"
CONTROLLED_PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-controlled-protocol-v1.json"
ENV_SPEC_FILE = HERE / "audio-to-midi-p5-tsumugi-environment-v1.json"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_real_easy_module():
    spec = importlib.util.spec_from_file_location("fame_tsumugi_real_easy", REAL_EASY_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load frozen Tsumugi real-easy module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def threshold_slug(value):
    value = float(value)
    sign = "neg" if value < 0 else "pos"
    body = f"{abs(value):.1f}".replace(".", "p")
    return f"{sign}{body}"


def validate_protocol():
    p = read_json(PROTOCOL_FILE)
    sweep = p.get("sweep", {})
    if (
        p.get("schema") != "fame-owned-beats-audio-to-midi-p5-tsumugi-threshold-sweep-v2"
        or p.get("version") != 2
        or p.get("status") != "FROZEN_BEFORE_THRESHOLD_SWEEP_V2_INFERENCE"
        or p.get("sourceRecordIds") != ["FAME000040", "FAME000080", "FAME000126"]
        or sweep.get("parameter") != "instrumentPairGateThreshold"
        or sweep.get("frozenValues") != [-3.0, 0.0, 0.5, 1.0, 2.0]
        or int(sweep.get("instrumentPairInferTopk", -1)) != 0
        or int(sweep.get("instrumentPairMaxPairs", -1)) != 512
        or sweep.get("allOtherInferenceSettingsFrozen") is not True
    ):
        raise RuntimeError("Threshold sweep V2 protocol mismatch")

    safety = p.get("safety", {})
    if (
        safety.get("split") != "development"
        or safety.get("reuseConsumedDevelopmentFamilies") is not True
        or safety.get("originalSourceAudioAllowed") is not False
        or safety.get("developmentDrumsStemAccessAllowed") is not True
        or safety.get("independentEvaluationAllowed") is not False
        or safety.get("finalHoldoutAllowed") is not False
        or safety.get("sourceSeparationExecutionAllowed") is not False
        or safety.get("trainingAuthorized") is not False
        or safety.get("batch131Authorized") is not False
        or safety.get("taskDataReadyMayBeDeclared") is not False
    ):
        raise RuntimeError("Unsafe threshold sweep V2 protocol")
    return p


def shared_inputs(workspace):
    protocol = validate_protocol()
    real_easy = load_real_easy_module()
    real_protocol = read_json(REAL_EASY_PROTOCOL_FILE)
    controlled = read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)

    ids = real_easy.validate_protocol(real_protocol, controlled, env_spec)
    if ids != protocol["sourceRecordIds"]:
        raise RuntimeError("Threshold sweep V2 source identities mismatch")
    sources = real_easy.validate_source_separation(workspace, real_protocol)

    source_root = workspace / env_spec["workspace"]["sourceRelativePath"]
    checkpoint = workspace / env_spec["workspace"]["checkpointRelativePath"]
    if not source_root.is_dir() or not checkpoint.is_file():
        raise RuntimeError("Frozen Tsumugi source/checkpoint missing")
    if sha256_file(checkpoint) != env_spec["checkpoint"]["sha256"]:
        raise RuntimeError("Frozen Tsumugi checkpoint SHA mismatch")

    return protocol, real_easy, controlled, env_spec, sources, source_root, checkpoint


def preflight(workspace_root):
    workspace = Path(workspace_root).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")
    protocol, _real_easy, _controlled, env_spec, _sources, _source_root, _checkpoint = shared_inputs(workspace)
    return {
        "mode": "FAME_TSUMUGI_THRESHOLD_SWEEP_V2_PREFLIGHT_PASS",
        "runId": protocol["runId"],
        "records": len(protocol["sourceRecordIds"]),
        "sourceRecordIds": protocol["sourceRecordIds"],
        "thresholds": protocol["sweep"]["frozenValues"],
        "instrumentPairInferTopk": protocol["sweep"]["instrumentPairInferTopk"],
        "checkpointSha256": env_spec["checkpoint"]["sha256"],
        "developmentDrumsStemAudioOpenedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "independentEvaluationAccessedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "trainingAuthorized": False,
        "batch131Authorized": False,
    }


def execute(workspace_root):
    workspace = Path(workspace_root).resolve()
    protocol, real_easy, controlled, env_spec, sources, source_root, checkpoint = shared_inputs(workspace)

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
        raise RuntimeError("CUDA unavailable; CPU fallback forbidden")
    if torch.cuda.get_device_name(0) != env_spec["observedPreflight"]["deviceName"]:
        raise RuntimeError("CUDA device identity changed since frozen preflight")

    device = torch.device("cuda")
    model, model_config, training_args = load_model(checkpoint, device=device)
    if str(model_config.semi_crf_version) != "v1" or int(model_config.num_pitch_slots) != 1:
        raise RuntimeError("Checkpoint no longer matches frozen V1 head contract")

    frozen = controlled["inference"]
    drum_id = int(resolve_instrument_id(frozen["instrumentFilter"]))
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
        instrument_pair_infer_topk=int(protocol["sweep"]["instrumentPairInferTopk"]),
        instrument_pair_gate_threshold=float(frozen["instrumentPairGateThreshold"]),
        instrument_pair_max_pairs=int(protocol["sweep"]["instrumentPairMaxPairs"]),
    )
    base_settings = resolve_inference_settings(model_config, training_args, args)
    base_settings = replace(base_settings, allowed_instrument_ids=(drum_id,))

    run_root = (
        workspace
        / "runs"
        / "audio-to-midi-p5-tsumugi-threshold-sweep-v2"
        / protocol["runId"]
    )
    if run_root.exists():
        raise RuntimeError(f"Append-only threshold sweep V2 already exists: {run_root}")
    run_root.parent.mkdir(parents=True, exist_ok=True)
    temp = run_root.parent / f".{protocol['runId']}.tmp-{uuid.uuid4().hex}"
    temp.mkdir()

    aliases = {int(k): int(v) for k, v in controlled["drumPitchPolicy"]["aliasesBeforeScoring"].items()}
    rows = []
    try:
        waveforms = {
            rid: load_audio(
                sources[rid]["stem"],
                target_sample_rate=int(model_config.sample_rate),
            )
            for rid in protocol["sourceRecordIds"]
        }

        for threshold in protocol["sweep"]["frozenValues"]:
            threshold = float(threshold)
            settings = replace(base_settings, instrument_pair_gate_threshold=threshold)
            if int(settings.instrument_pair_infer_topk) != 0:
                raise RuntimeError("Threshold sweep V2 requires instrument_pair_infer_topk=0")

            threshold_dir = temp / threshold_slug(threshold)
            threshold_dir.mkdir()
            print(f"=== Tsumugi effective pair-gate threshold {threshold:.1f} ===", file=sys.stderr, flush=True)

            for rid in protocol["sourceRecordIds"]:
                print(rid, file=sys.stderr, flush=True)
                notes, stats = decode_notes(
                    model,
                    model_config,
                    waveforms[rid],
                    instrument_filter_id=drum_id,
                    device=device,
                    amp_enabled=False,
                    amp_dtype=torch.float32,
                    settings=settings,
                    velocity=int(frozen["velocity"]),
                    forward_model=None,
                )

                events = [
                    real_easy.map_note(note, int(model_config.sample_rate), controlled)
                    for note in notes
                ]
                events.sort(key=lambda x: (
                    float(x["timeSeconds"]),
                    int(x["canonicalPitch"]),
                    int(x["slotIndex"]),
                ))
                pitch_counts = dict(sorted(Counter(int(e["canonicalPitch"]) for e in events).items()))
                supported_roles = {
                    role: sum(1 for e in events if e["role"] == role)
                    for role in ("kick", "snare", "hihat")
                }
                unsupported = [e for e in events if str(e["role"]).startswith("unsupported_pitch_")]

                family_dir = threshold_dir / rid
                family_dir.mkdir()
                midi, midi_stats = build_midi(
                    notes,
                    sample_rate=int(model_config.sample_rate),
                    instrument_id=drum_id,
                    min_midi_note_ms=float(frozen["minMidiNoteMs"]),
                    max_midi_melodic_instruments=0,
                    instrument_volumes=None,
                    drum_pitch_aliases=aliases,
                    return_stats=True,
                )
                midi_file = family_dir / "tsumugi-drums.mid"
                midi.write(str(midi_file))

                result = {
                    "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-threshold-sweep-result-v2",
                    "version": 2,
                    "runId": protocol["runId"],
                    "sourceRecordId": rid,
                    "candidateId": protocol["baseCandidateId"],
                    "instrumentPairGateThreshold": threshold,
                    "instrumentPairInferTopk": int(settings.instrument_pair_infer_topk),
                    "rawPredictedNoteCount": len(notes),
                    "distinctCanonicalPitchCount": len(pitch_counts),
                    "canonicalPitchCounts": pitch_counts,
                    "supportedRoleCounts": supported_roles,
                    "unsupportedOutputPitchCount": len(unsupported),
                    "events": events,
                    "decoderStats": stats,
                    "midi": {
                        "relativePath": "tsumugi-drums.mid",
                        "sha256": sha256_file(midi_file),
                        "stats": midi_stats,
                    },
                    "safety": {
                        "split": "development",
                        "reusedAlreadyConsumedDevelopmentFamily": True,
                        "originalSourceAudioOpened": False,
                        "independentEvaluationAccessed": False,
                        "finalHoldoutAccessed": False,
                        "sourceSeparationExecuted": False,
                        "trainingAuthorized": False,
                        "batch131Authorized": False,
                        "taskDataReadyMayBeDeclared": False,
                    },
                }
                result_file = family_dir / "result.json"
                result_file.write_text(stable_json(result), encoding="utf-8")
                rows.append({
                    "threshold": threshold,
                    "sourceRecordId": rid,
                    "rawPredictedNoteCount": len(notes),
                    "distinctCanonicalPitchCount": len(pitch_counts),
                    "unsupportedOutputPitchCount": len(unsupported),
                    "canonicalPitchCounts": pitch_counts,
                    "resultSha256": sha256_file(result_file),
                    "midiSha256": sha256_file(midi_file),
                })

        variant_diagnostics = []
        for rid in protocol["sourceRecordIds"]:
            family_rows = [row for row in rows if row["sourceRecordId"] == rid]
            unique_hashes = sorted({row["midiSha256"] for row in family_rows})
            variant_diagnostics.append({
                "sourceRecordId": rid,
                "uniqueMidiVariants": len(unique_hashes),
                "eventCountsByThreshold": {
                    str(row["threshold"]): row["rawPredictedNoteCount"]
                    for row in family_rows
                },
                "distinctPitchCountsByThreshold": {
                    str(row["threshold"]): row["distinctCanonicalPitchCount"]
                    for row in family_rows
                },
            })

        threshold_effect_observed = any(x["uniqueMidiVariants"] > 1 for x in variant_diagnostics)

        summary = {
            "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-threshold-sweep-summary-v2",
            "version": 2,
            "status": (
                "DEVELOPMENT_THRESHOLD_SWEEP_V2_COMPLETE_AWAITING_HUMAN_REVIEW"
                if threshold_effect_observed
                else "DEVELOPMENT_THRESHOLD_SWEEP_V2_NO_EFFECT"
            ),
            "runId": protocol["runId"],
            "candidateId": protocol["baseCandidateId"],
            "records": len(rows),
            "thresholds": protocol["sweep"]["frozenValues"],
            "families": protocol["sourceRecordIds"],
            "instrumentPairInferTopk": protocol["sweep"]["instrumentPairInferTopk"],
            "variantDiagnostics": variant_diagnostics,
            "thresholdEffectObserved": threshold_effect_observed,
            "results": rows,
            "automaticWinner": False,
            "humanListeningRequired": threshold_effect_observed,
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
            "nextAction": (
                "AUDITION_THRESHOLDS_IF_VARIANTS_DIFFER"
                if threshold_effect_observed
                else "REJECT_PAIR_GATE_THRESHOLD_TUNING_NO_EFFECT"
            ),
        }
        (temp / "summary.json").write_text(stable_json(summary), encoding="utf-8")
        temp.rename(run_root)
    except Exception:
        shutil.rmtree(temp, ignore_errors=True)
        raise

    return {
        "mode": "FAME_TSUMUGI_THRESHOLD_SWEEP_V2_COMPLETE",
        "runId": protocol["runId"],
        "records": len(rows),
        "thresholds": protocol["sweep"]["frozenValues"],
        "sourceRecordIds": protocol["sourceRecordIds"],
        "instrumentPairInferTopk": protocol["sweep"]["instrumentPairInferTopk"],
        "thresholdEffectObserved": threshold_effect_observed,
        "variantDiagnostics": variant_diagnostics,
        "freshIndependentEvaluationFamiliesConsumed": 0,
        "independentEvaluationAccessedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "trainingAuthorized": False,
        "batch131Authorized": False,
        "summaryFile": str(run_root / "summary.json"),
    }


def self_test():
    p = validate_protocol()
    expected = ["neg3p0", "pos0p0", "pos0p5", "pos1p0", "pos2p0"]
    actual = [threshold_slug(x) for x in p["sweep"]["frozenValues"]]
    if actual != expected:
        raise RuntimeError(f"Threshold slug self-test failed: {actual}")
    return {
        "mode": "FAME_TSUMUGI_THRESHOLD_SWEEP_V2_SELF_TEST_PASS",
        "thresholds": p["sweep"]["frozenValues"],
        "instrumentPairInferTopk": p["sweep"]["instrumentPairInferTopk"],
        "records": len(p["sourceRecordIds"]),
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
        print(f"FAME TSUMUGI THRESHOLD SWEEP V2 FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
