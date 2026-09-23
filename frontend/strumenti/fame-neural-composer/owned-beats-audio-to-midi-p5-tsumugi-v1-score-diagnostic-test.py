#!/usr/bin/env python3
import ast
import copy
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"


def load_module():
    path=OWNED/"audio-to-midi-p5-tsumugi-v1-score-diagnostic.py"
    spec=importlib.util.spec_from_file_location("tsumugi_v1_score_diagnostic_test",path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    protocol=json.loads((OWNED/"audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1.json").read_text(encoding="utf-8"))
    controlled=json.loads((OWNED/"audio-to-midi-p5-tsumugi-controlled-protocol-v1.json").read_text(encoding="utf-8"))
    env_spec=json.loads((OWNED/"audio-to-midi-p5-tsumugi-environment-v1.json").read_text(encoding="utf-8"))
    assert protocol["status"]=="FROZEN_BEFORE_FIRST_V1_SCORE_DIAGNOSTIC_RUN"
    assert protocol["checkpointContract"]["semiCrfVersion"]=="v1"
    assert protocol["checkpointContract"]["numPitchSlots"]==1
    assert protocol["checkpointContract"]["numPitches"]==88
    assert protocol["inferenceContract"]["noteBias"]==0.0
    assert protocol["inferenceContract"]["semiCrfDecodeInThisDiagnostic"] is False
    assert protocol["inferenceContract"]["finalTranscriptionInThisDiagnostic"] is False
    assert protocol["safety"]["ownedBeatAudioAccessAllowed"] is False

    runner=(OWNED/"audio-to-midi-p5-tsumugi-v1-score-diagnostic.py").read_text(encoding="utf-8")
    ast.parse(runner)
    for needle in [
        "_build_interval_score",
        "interval_query",
        "interval_key",
        "interval_diag",
        "EXPECTED_ROLE_TARGET_SCORES_NONPOSITIVE",
        "POSITIVE_TARGET_SCORE_BUT_SOURCE_TARGET_PITCH_ABSENT",
        "SOURCE_CONTROLLED_TARGET_PITCH_EVENTS_PRESENT",
        "sourceControlledTargetPitchEventCount",
        "sourceControlledTargetRawPitchCounts",
        "semiCrfDecodeExecutedByThisCommand",
        "finalTranscriptionExecutedByThisCommand",
        "Unexpected pair_gate_logits on frozen V1 checkpoint",
    ]:
        assert needle in runner

    module=load_module()
    module.validate_protocol_contract(protocol,controlled,env_spec)

    wrapper=(OWNED/"run-audio-to-midi-p5-tsumugi-v1-score-diagnostic.ps1").read_text(encoding="utf-8")
    for needle in [
        "TSUMUGI_V1_SCORE_DIAGNOSTIC_COMPLETE_NO_RETUNING",
        "already complete; reusing persisted append-only run",
        "INCOMPLETE_APPEND_ONLY_V1_SCORE_DIAGNOSTIC",
        "Do not delete or overwrite it; freeze a new runId",
        "audio-to-midi-p5-tsumugi-v1-score-diagnostic-report.py",
    ]:
        assert needle in wrapper


    mutations=[
        ("semiCrfVersion","v2"),
        ("numPitchSlots",2),
        ("numPitches",87),
    ]
    for key,value in mutations:
        bad=copy.deepcopy(protocol)
        bad["checkpointContract"][key]=value
        try:
            module.validate_protocol_contract(bad,controlled,env_spec)
        except RuntimeError:
            pass
        else:
            raise AssertionError(f"checkpoint contract divergence not rejected: {key}")

    for key,value in [
        ("noteBias",0.25),
        ("semiCrfBackend","other"),
        ("amp",True),
        ("compile",True),
        ("instrumentFilter","other"),
        ("semiCrfDecodeInThisDiagnostic",True),
        ("finalTranscriptionInThisDiagnostic",True),
    ]:
        bad=copy.deepcopy(protocol)
        bad["inferenceContract"][key]=value
        try:
            module.validate_protocol_contract(bad,controlled,env_spec)
        except RuntimeError:
            pass
        else:
            raise AssertionError(f"inference contract divergence not rejected: {key}")

    bad=copy.deepcopy(protocol)
    bad["fixtures"]=list(reversed(bad["fixtures"]))
    try:
        module.validate_protocol_contract(bad,controlled,env_spec)
    except RuntimeError:
        pass
    else:
        raise AssertionError("fixture-set divergence not rejected")

    print("owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-test: PASS")


if __name__=="__main__":
    main()
