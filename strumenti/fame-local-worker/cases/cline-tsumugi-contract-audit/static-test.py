#!/usr/bin/env python3
import ast
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"

def main():
    protocol=json.loads((OWNED/"audio-to-midi-p5-tsumugi-score-diagnostic-v1.json").read_text(encoding="utf-8"))
    assert protocol["schema"]=="fame-owned-beats-audio-to-midi-p5-tsumugi-score-diagnostic-v1"
    assert protocol["status"]=="FROZEN_BEFORE_FIRST_SCORE_DIAGNOSTIC_RUN"
    assert protocol["candidateId"]=="tsumugi-drums-v1_5"
    assert protocol["inferenceContract"]["device"]=="cuda"
    assert protocol["inferenceContract"]["amp"] is False
    assert protocol["inferenceContract"]["compile"] is False
    assert protocol["inferenceContract"]["instrumentFilter"]=="drums"
    assert protocol["inferenceContract"]["instrumentPairGateThreshold"]==-3.0
    assert protocol["inferenceContract"]["instrumentPairInferTopk"]==256
    assert protocol["inferenceContract"]["noteBias"]==0.0
    assert protocol["pitchDiagnostics"]["numPitches"]==88
    assert protocol["pitchDiagnostics"]["targetPitches"]==[35,36,38,40,42,44,46]
    assert protocol["safety"]["ownedBeatAudioAccessAllowed"] is False
    assert protocol["safety"]["fixtureAudioAccessAllowed"] is True
    assert protocol["safety"]["trainingAuthorized"] is False

    runner=(OWNED/"audio-to-midi-p5-tsumugi-score-diagnostic.py").read_text(encoding="utf-8")
    ast.parse(runner)
    for needle in [
        "build_factorized_interval_score",
        "pairGateMarginToThreshold",
        "maxNonSingletonScore",
        "topkCoversAllAllowedDrumPitches",
        "diagnosticModelForwardExecutedByThisCommand",
        "transcriptionExecutedByThisCommand",
        "retuningPerformedByThisCommand",
    ]:
        assert needle in runner
    print("owned-beats-audio-to-midi-p5-tsumugi-score-diagnostic-test: PASS")

if __name__=="__main__":
    main()
