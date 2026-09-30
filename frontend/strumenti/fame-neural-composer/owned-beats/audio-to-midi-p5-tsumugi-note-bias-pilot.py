#!/usr/bin/env python3
"""Development-only Tsumugi V1 note-bias pilot on one consumed family.

This pilot targets the parameter that actually participates in V1 pitch
interval decoding. It reuses the frozen checkpoint and the already-consumed
FAME000126 development drums stem. It never touches independent evaluation or
final holdout data.
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
PROTOCOL_FILE = HERE / "audio-to-midi-p5-tsumugi-note-bias-pilot-v1.json"
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


def bias_slug(value):
    value = float(value)
    sign = "neg" if value < 0 else "pos"
    body = f"{abs(value):.2f}".replace(".", "p")
    return f"{sign}{body}"


def validate_protocol():
    p = read_json(PROTOCOL_FILE)
    sweep = p.get("sweep", {})
    if (
        p.get("schema") != "fame-owned-beats-audio-to-midi-p5-tsumugi-note-bias-pilot-v1"
        or p.get("version") != 1
        or p.get("status") != "FROZEN_BEFORE_NOTE_BIAS_PILOT_INFERENCE"
        or p.get("sourceRecordId") != "FAME000126"
        or sweep.get("parameter") != "noteBias"
        or sweep.get("frozenValues") != [0.0, -0.25, -0.5, -1.0, -2.0]
        or sweep.get("allOtherInferenceSettingsFrozen") is not True
    ):
        raise RuntimeError("Note-bias pilot protocol mismatch")

    safety = p.get("safety", {})
    if (
        safety.get("split") != "development"
        or safety.get("reuseConsumedDevelopmentFamily") is not True
        or safety.get("originalSourceAudioAllowed") is not False
        or safety.get("developmentDrumsStemAccessAllowed") is not True
        or safety.get("independentEvaluationAllowed") is not False
        or safety.get("finalHoldoutAllowed") is not False
        or safety.get("sourceSeparationExecutionAllowed") is not False
        or safety.get("trainingAuthorized") is not False
        or safety.get("batch131Authorized") is not False
        or safety.get("taskDataReadyMayBeDeclared") is not False
    ):
        raise RuntimeError("Unsafe note-bias pilot protocol")
    return p


def prepare_inputs(workspace):
    protocol = validate_protocol()
    real_easy = load_real_easy_module()
    real_protocol = read_json(REAL_EASY_PROTOCOL_FILE)
    controlled = read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec = read_json(ENV_SPEC_FILE)

    ids = real_easy.validate_protocol(real_protocol, controlled, env_spec)
    rid = protocol["sourceRecordId"]
    if rid not in ids:
        raise RuntimeError("Pilot family is not part of the frozen consumed development set")
    sources = real_easy.validate_source_separation(workspace, real_protocol)

    source_root = workspace / env_spec["workspace"]["sourceRelativePath"]
    checkpoint = workspace / env_spec["workspace"]["checkpointRelativePath"]
    if not source_root.is_dir() or not checkpoint.is_file():
        raise RuntimeError("Frozen Tsumugi source/checkpoint missing")
    if sha256_file(checkpoint) != env_spec["checkpoint"]["sha256"]:
        raise RuntimeError("Frozen Tsumugi checkpoint SHA mismatch")

    return protocol, real_easy, controlled, env_spec, sources[rid], source_root, checkpoint


def preflight(workspace_root):
    workspace = Path(workspace_root).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")
    protocol, _real_easy, _controlled, env_spec, _source, _source_root, _checkpoint = prepare_inputs(workspace)
    return {
        "mode": "FAME_TSUMUGI_NOTE_BIAS_PILOT_PREFLIGHT_PASS",
        "runId": protocol["runId"],
        "sourceRecordId": protocol["sourceRecordId"],
        "noteBiasValues": protocol["sweep"]["frozenValues"],
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
    protocol, real_easy, controlled, env_spec, source, source_root, checkpoint = prepare_inputs(workspace)

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
        raise RuntimeError("Pilot requires the frozen V1 checkpoint contract")

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
        instrument_pair_infer_topk=int(frozen["instrumentPairInferTopk"]),
        instrument_pair_gate_threshold=float(frozen["instrumentPairGateThreshold"]),
        instrument_pair_max_pairs=int(frozen["instrumentPairMaxPairs"]),
    )
    base_settings = resolve_inference_settings(model_config, training_args, args)
    base_settings = replace(base_settings, allowed_instrument_ids=(drum_id,))

    rid = protocol["sourceRecordId"]
    waveform = load_audio(
        source["stem"],
        target_sample_rate=int(model_config.sample_rate),
    )
    aliases = {
        int(k): int(v)
        for k, v in controlled["drumPitchPolicy"]["aliasesBeforeScoring"].items()
    }

    run_root = (
        workspace
        / "runs"
        / "audio-to-midi-p5-tsumugi-note-bias-pilot"
        / protocol["runId"]
    )
    if run_root.exists():
        raise RuntimeError(f"Append-only note-bias pilot already exists: {run_root}")
    run_root.parent.mkdir(parents=True, exist_ok=True)
    temp = run_root.parent / f".{protocol['runId']}.tmp-{uuid.uuid4().hex}"
    temp.mkdir()

    rows = []
    try:
        for note_bias in protocol["sweep"]["frozenValues"]:
            note_bias = float(note_bias)
            settings = replace(base_settings, note_bias=note_bias)
            bias_dir = temp / bias_slug(note_bias)
            bias_dir.mkdir()

            print(
                f"=== Tsumugi V1 note_bias {note_bias:.2f} / {rid} ===",
                file=sys.stderr,
                flush=True,
            )
            notes, stats = decode_notes(
                model,
                model_config,
                waveform,
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
            unsupported = [
                e for e in events if str(e["role"]).startswith("unsupported_pitch_")
            ]

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
            midi_file = bias_dir / "tsumugi-drums.mid"
            midi.write(str(midi_file))

            result = {
                "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-note-bias-pilot-result-v1",
                "version": 1,
                "runId": protocol["runId"],
                "sourceRecordId": rid,
                "candidateId": protocol["candidateId"],
                "semiCrfVersion": str(model_config.semi_crf_version),
                "noteBias": note_bias,
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
            result_file = bias_dir / "result.json"
            result_file.write_text(stable_json(result), encoding="utf-8")
            rows.append({
                "noteBias": note_bias,
                "rawPredictedNoteCount": len(notes),
                "distinctCanonicalPitchCount": len(pitch_counts),
                "unsupportedOutputPitchCount": len(unsupported),
                "canonicalPitchCounts": pitch_counts,
                "midiSha256": sha256_file(midi_file),
                "resultSha256": sha256_file(result_file),
            })

        unique_hashes = sorted({row["midiSha256"] for row in rows})
        variant_count = len(unique_hashes)
        baseline_count = next(row["rawPredictedNoteCount"] for row in rows if row["noteBias"] == 0.0)
        diagnostics = {
            "uniqueMidiVariants": variant_count,
            "eventCountsByNoteBias": {
                str(row["noteBias"]): row["rawPredictedNoteCount"] for row in rows
            },
            "distinctPitchCountsByNoteBias": {
                str(row["noteBias"]): row["distinctCanonicalPitchCount"] for row in rows
            },
            "unsupportedCountsByNoteBias": {
                str(row["noteBias"]): row["unsupportedOutputPitchCount"] for row in rows
            },
            "baselineEventCount": baseline_count,
        }
        effect_observed = variant_count > 1

        summary = {
            "schema": "fame-owned-beats-audio-to-midi-p5-tsumugi-note-bias-pilot-summary-v1",
            "version": 1,
            "status": (
                "NOTE_BIAS_PILOT_COMPLETE_VARIANTS_DIFFER"
                if effect_observed
                else "NOTE_BIAS_PILOT_COMPLETE_NO_EFFECT"
            ),
            "runId": protocol["runId"],
            "candidateId": protocol["candidateId"],
            "sourceRecordId": rid,
            "noteBiasValues": protocol["sweep"]["frozenValues"],
            "effectObserved": effect_observed,
            "variantDiagnostics": diagnostics,
            "results": rows,
            "automaticWinner": False,
            "humanListeningRequired": effect_observed,
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
                "AUDITION_NOTE_BIAS_VARIANTS"
                if effect_observed
                else "REJECT_NOTE_BIAS_TUNING_NO_EFFECT"
            ),
        }
        (temp / "summary.json").write_text(stable_json(summary), encoding="utf-8")
        temp.rename(run_root)
    except Exception:
        shutil.rmtree(temp, ignore_errors=True)
        raise

    return {
        "mode": "FAME_TSUMUGI_NOTE_BIAS_PILOT_COMPLETE",
        "runId": protocol["runId"],
        "sourceRecordId": rid,
        "noteBiasValues": protocol["sweep"]["frozenValues"],
        "effectObserved": effect_observed,
        "variantDiagnostics": diagnostics,
        "freshIndependentEvaluationFamiliesConsumed": 0,
        "independentEvaluationAccessedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "trainingAuthorized": False,
        "batch131Authorized": False,
        "summaryFile": str(run_root / "summary.json"),
    }


def self_test():
    p = validate_protocol()
    slugs = [bias_slug(x) for x in p["sweep"]["frozenValues"]]
    if slugs != ["pos0p00", "neg0p25", "neg0p50", "neg1p00", "neg2p00"]:
        raise RuntimeError(f"Note-bias slug self-test failed: {slugs}")
    return {
        "mode": "FAME_TSUMUGI_NOTE_BIAS_PILOT_SELF_TEST_PASS",
        "sourceRecordId": p["sourceRecordId"],
        "noteBiasValues": p["sweep"]["frozenValues"],
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
        print(f"FAME TSUMUGI NOTE-BIAS PILOT FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
