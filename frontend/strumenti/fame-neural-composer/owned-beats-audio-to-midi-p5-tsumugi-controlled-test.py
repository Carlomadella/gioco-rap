#!/usr/bin/env python3
import ast
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"

def main():
    protocol=json.loads((OWNED/"audio-to-midi-p5-tsumugi-controlled-protocol-v1.json").read_text(encoding="utf-8"))
    env=json.loads((OWNED/"audio-to-midi-p5-tsumugi-environment-v1.json").read_text(encoding="utf-8"))
    assert protocol["schema"]=="fame-owned-beats-audio-to-midi-p5-tsumugi-controlled-protocol-v1"
    assert protocol["status"]=="FROZEN_BEFORE_FIRST_TSUMUGI_FIXTURE_AUDIO_ACCESS"
    assert protocol["candidateId"]=="tsumugi-drums-v1_5"
    assert protocol["fixtureManifestSha256"]=="f68eddc1fab7919f90a8bd391e24e444401a168d36fa06f22af0ec6d70d33d0b"
    assert protocol["inference"]["device"]=="cuda"
    assert protocol["inference"]["allowCpuFallback"] is False
    assert protocol["inference"]["amp"] is False
    assert protocol["inference"]["compile"] is False
    assert protocol["inference"]["instrumentFilter"]=="drums"
    assert protocol["drumPitchPolicy"]["supportedRoleMapping"]=={
        "kick":[35,36],
        "snare":[38],
        "hihat":[42,44,46],
    }
    assert protocol["drumPitchPolicy"]["aliasesBeforeScoring"]=={"40":38,"57":49}
    assert protocol["metrics"]["primaryOnsetToleranceSeconds"]==0.03
    assert protocol["metrics"]["secondaryOnsetToleranceSeconds"]==0.05
    assert len(protocol["controlledGate"]["requiredPerfectPrimary30ms"])==7
    assert protocol["controlledGate"]["syntheticPassPromotesCandidate"] is False
    assert env["status"]=="PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS"
    assert env["observedPreflight"]["cudaAvailable"] is True
    assert env["observedPreflight"]["installedPackagesSha256"]=="b14b2b16bd95bc164e7ab5c57a2dd0c035ea6353acae99cdb5a13913b7b22704"
    runner=(OWNED/"audio-to-midi-p5-tsumugi-controlled.py").read_text(encoding="utf-8")
    ast.parse(runner)
    for needle in [
        "CPU fallback forbidden",
        "instrument_filter_id=drum_instrument_id",
        "unsupported_pitch_",
        "fixtureAudioOpenedByThisCommand",
        "trainingAuthorized",
        "controlled_gate",
    ]:
        assert needle in runner
    print("owned-beats-audio-to-midi-p5-tsumugi-controlled-test: PASS")

if __name__=="__main__":
    main()
