#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"

def main():
    spec=json.loads((OWNED/"audio-to-midi-p5-tsumugi-environment-v1.json").read_text(encoding="utf-8"))
    assert spec["schema"]=="fame-owned-beats-audio-to-midi-p5-tsumugi-environment-v1"
    assert spec["status"]=="FROZEN_PREFLIGHT_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS"
    assert spec["candidateId"]=="tsumugi-drums-v1_5"
    assert spec["source"]["commit"]=="f7411471a4de0ad3d430191de11b8623d67e5b38"
    assert spec["source"]["license"]=="MIT"
    assert spec["source"]["uvLockGitBlobSha1"]=="0430dd7bedece5d98524024f9aa0ef7d18475c23"
    assert spec["checkpoint"]["revision"]=="89aefa28abf0a54f859505f41f211d273662c7c7"
    assert spec["checkpoint"]["filename"]=="best_model_drums_v1_5.pth"
    assert spec["checkpoint"]["bytes"]==57150497
    assert spec["checkpoint"]["sha256"]=="65138ad1dd919f33fb0ce56e54c0c23c87deaad6511132d69137cf4901ee9319"
    assert spec["runtime"]["torch"]=="2.13.0"
    assert spec["runtime"]["torchaudio"]=="2.11.0"
    assert spec["controlledEvaluation"]["freshOwnedBeatFamiliesConsumed"]==0
    assert spec["controlledEvaluation"]["consumedIndependentEvaluationFamiliesUsed"]==0
    assert spec["controlledEvaluation"]["trainingRunsAuthorized"]==0
    assert spec["safety"]["sourceAudioAccessAllowedDuringSetup"] is False
    assert spec["safety"]["fixtureAudioAccessAllowedDuringSetup"] is False
    assert spec["safety"]["transcriptionAllowedDuringSetup"] is False
    assert spec["safety"]["trainingAuthorized"] is False
    doctor=(OWNED/"audio-to-midi-p5-tsumugi-environment-doctor.py").read_text(encoding="utf-8")
    runner=(OWNED/"prepare-audio-to-midi-p5-tsumugi-environment.ps1").read_text(encoding="utf-8")
    for needle in [
        "CUDA unavailable",
        "Checkpoint SHA256 mismatch",
        "MODEL_CHECKPOINT_FILENAMES",
        "fixtureAudioOpenedByThisCommand",
        "transcriptionExecutedByThisCommand"
    ]:
        assert needle in doctor
    for needle in [
        "uv sync --locked --no-dev",
        "git -C $sourceRoot fetch --depth 1 origin",
        "Invoke-WebRequest",
        "PREFLIGHT_ENVIRONMENT_READY_NO_AUDIO_ACCESSED"
    ]:
        assert needle in runner
    print("owned-beats-audio-to-midi-p5-tsumugi-environment-test: PASS")

if __name__=="__main__":
    main()
