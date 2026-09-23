#!/usr/bin/env python3
import ast
import copy
import importlib.util
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
        "validate_protocol_contract",
        "validate_resolved_contract",
        "runtimeContractBindingVerified",
        "fixtureSetBindingVerified",
    ]:
        assert needle in runner

    spec=importlib.util.spec_from_file_location(
        "tsumugi_score_diagnostic_contract_test",
        OWNED/"audio-to-midi-p5-tsumugi-score-diagnostic.py",
    )
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    controlled=json.loads((OWNED/"audio-to-midi-p5-tsumugi-controlled-protocol-v1.json").read_text(encoding="utf-8"))
    env_spec=json.loads((OWNED/"audio-to-midi-p5-tsumugi-environment-v1.json").read_text(encoding="utf-8"))
    module.validate_protocol_contract(protocol,controlled,env_spec)

    mutations=[
        ("instrumentPairGateThreshold",-2.5),
        ("instrumentPairInferTopk",128),
        ("noteBias",0.25),
        ("semiCrfBackend","other"),
        ("amp",True),
        ("compile",True),
        ("instrumentFilter","other"),
    ]
    for key,value in mutations:
        bad=copy.deepcopy(protocol)
        bad["inferenceContract"][key]=value
        try:
            module.validate_protocol_contract(bad,controlled,env_spec)
        except RuntimeError:
            pass
        else:
            raise AssertionError(f"contract divergence not rejected: {key}")

    bad=copy.deepcopy(protocol)
    bad["fixtures"]=list(reversed(bad["fixtures"]))
    try:
        module.validate_protocol_contract(bad,controlled,env_spec)
    except RuntimeError:
        pass
    else:
        raise AssertionError("fixture-set divergence not rejected")

    bad=copy.deepcopy(protocol)
    bad["sourceRunId"]="wrong-run"
    try:
        module.validate_protocol_contract(bad,controlled,env_spec)
    except RuntimeError:
        pass
    else:
        raise AssertionError("sourceRunId divergence not rejected")

    print("owned-beats-audio-to-midi-p5-tsumugi-score-diagnostic-test: PASS")

if __name__=="__main__":
    main()
