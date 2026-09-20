#!/usr/bin/env python3
import importlib.util
import json
import math
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
MODULE_FILE = HERE / "audio-to-midi-development-baseline.py"
PROTOCOL_FILE = HERE / "audio-to-midi-development-protocol-v1.json"


def load_module():
    spec = importlib.util.spec_from_file_location("fame_audio_to_midi_baseline_tested", MODULE_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load Audio→MIDI baseline")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    mod = load_module()
    protocol = mod.require_protocol()

    assert protocol["status"] == "FROZEN_BEFORE_FIRST_TRANSCRIPTION_OUTPUT"
    assert mod.python_major_minor() == protocol["baselineEnvironment"]["python"]
    assert protocol["scope"]["expectedFamilies"] == 8
    assert protocol["scope"]["finalHoldoutAccessAllowed"] is False
    assert protocol["scope"]["batch131Authorized"] is False
    assert protocol["scope"]["trainingAuthorized"] is False
    assert protocol["scope"]["taskDataReadyMayBeDeclared"] is False
    assert protocol["implementation"]["baselineGitBlobSha1"] == mod.git_blob_sha1(MODULE_FILE)
    assert protocol["audioAnalysis"]["humanReferenceAsTranscriptionInputAllowed"] is False
    assert protocol["lowEnd"]["candidateArm"]["status"] == (
        "BLOCKED_PENDING_DEDICATED_ENVIRONMENT_AND_MODEL_FREEZE"
    )

    cfg = protocol["drums"]["classification"]
    assert mod.classify_drum_ratios(
        {"lowRatio": 0.70, "midRatio": 0.20, "highRatio": 0.10, "centroidHz": 400.0},
        cfg,
    ) == "kick"
    assert mod.classify_drum_ratios(
        {"lowRatio": 0.10, "midRatio": 0.15, "highRatio": 0.75, "centroidHz": 6500.0},
        cfg,
    ) == "hihat"
    assert mod.classify_drum_ratios(
        {"lowRatio": 0.20, "midRatio": 0.70, "highRatio": 0.10, "centroidHz": 1400.0},
        cfg,
    ) == "snare"

    drums = [
        {
            "timeSeconds": 1.000,
            "role": "kick",
            "midiNote": 36,
            "velocity": 60,
            "sourceStem": "drums",
        },
        {
            "timeSeconds": 1.500,
            "role": "snare",
            "midiNote": 38,
            "velocity": 80,
            "sourceStem": "drums",
        },
    ]
    bass_kicks = [
        {
            "timeSeconds": 1.020,
            "role": "kick",
            "midiNote": 36,
            "velocity": 90,
            "sourceStem": "bass",
        },
        {
            "timeSeconds": 2.000,
            "role": "kick",
            "midiNote": 36,
            "velocity": 75,
            "sourceStem": "bass",
        },
    ]
    fused = mod.fuse_kick_events(drums, bass_kicks, 0.05)
    assert len(fused) == 3
    first_kick = next(item for item in fused if abs(item["timeSeconds"] - 1.0) < 1e-9)
    assert first_kick["sourceStem"] == "drums+bass"
    assert first_kick["velocity"] == 90
    assert any(abs(item["timeSeconds"] - 2.0) < 1e-9 for item in fused)

    times = np.arange(0, 1.0, 0.01)
    f0 = np.full(len(times), np.nan)
    voiced = np.zeros(len(times), dtype=bool)
    probs = np.zeros(len(times), dtype=float)

    # A2 ~= 110 Hz for 0.10–0.39 s, B2 ~= 123.47 Hz for 0.50–0.79 s.
    first = (times >= 0.10) & (times < 0.40)
    second = (times >= 0.50) & (times < 0.80)
    f0[first] = 110.0
    f0[second] = 123.470825
    voiced[first | second] = True
    probs[first | second] = 0.95

    segments, midi_float = mod.lowend_segments_from_contour(
        times,
        f0,
        probs,
        voiced,
        minimum_note_duration_seconds=0.06,
        maximum_gap_frames=2,
    )
    assert len(segments) == 2, segments
    assert segments[0]["midiNote"] == 45
    assert segments[1]["midiNote"] == 47
    assert math.isfinite(midi_float[first][0])

    midi = mod.build_midi_bytes(
        [
            {"timeSeconds": 0.0, "midiNote": 36, "velocity": 100},
            {"timeSeconds": 0.5, "midiNote": 38, "velocity": 90},
        ],
        bpm=120.0,
        ppq=480,
        channel=9,
        drum=True,
    )
    assert midi[:4] == b"MThd"
    assert b"MTrk" in midi
    assert midi.endswith(b"\x00\xff\x2f\x00")

    low_midi = mod.build_midi_bytes(
        [
            {
                "startSeconds": 0.1,
                "endSeconds": 0.5,
                "midiNote": 45,
                "velocity": 82,
            }
        ],
        bpm=140.0,
        ppq=480,
        channel=0,
        drum=False,
    )
    assert low_midi[:4] == b"MThd"

    text = MODULE_FILE.read_text(encoding="utf-8")
    assert "basic_pitch" not in text
    assert "evaluation-holdout" not in text
    assert '"humanReferenceUsedAsInput": False' in text
    assert '"finalHoldoutAccessed": False' in text
    assert '"batch131Accessed": False' in text
    assert '"trainingAuthorized": False' in text

    prepare_wrapper = (HERE / "prepare-audio-to-midi-development-baseline.ps1").read_text(encoding="utf-8")
    run_wrapper = (HERE / "run-audio-to-midi-development-baseline.ps1").read_text(encoding="utf-8")
    assert " preflight $Workspace" in prepare_wrapper
    assert " execute $Workspace --run-id $RunId" not in prepare_wrapper
    assert " preflight $Workspace" in run_wrapper
    assert " execute $Workspace --run-id $RunId" in run_wrapper

    frozen = json.loads(PROTOCOL_FILE.read_text(encoding="utf-8"))
    assert frozen["drums"]["arms"][0]["id"] == "drums-only-spectral-onset-v1"
    assert frozen["drums"]["arms"][1]["id"] == "drums-bass-kick-fusion-v1"
    assert frozen["lowEnd"]["primaryArm"]["id"] == "librosa-pyin-lowend-v1"

    print("audio-to-midi-development-baseline-test: PASS")


if __name__ == "__main__":
    main()
