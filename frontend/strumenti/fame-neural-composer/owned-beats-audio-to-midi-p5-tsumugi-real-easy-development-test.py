#!/usr/bin/env python3
import ast
import copy
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"

def load_module():
    path=OWNED/"audio-to-midi-p5-tsumugi-real-easy-development.py"
    spec=importlib.util.spec_from_file_location("tsumugi_real_easy_test",path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def main():
    protocol=json.loads((OWNED/"audio-to-midi-p5-tsumugi-real-easy-development-v1.json").read_text(encoding="utf-8"))
    controlled=json.loads((OWNED/"audio-to-midi-p5-tsumugi-controlled-protocol-v1.json").read_text(encoding="utf-8"))
    env_spec=json.loads((OWNED/"audio-to-midi-p5-tsumugi-environment-v1.json").read_text(encoding="utf-8"))
    assert protocol["status"]=="FROZEN_BEFORE_FIRST_TSUMUGI_REAL_EASY_STEM_ACCESS"
    assert [x["sourceRecordId"] for x in protocol["selectedDevelopmentRecords"]]==["FAME000040","FAME000080","FAME000126"]
    assert all(x["priorHumanDrumsUsefulness"]==3 for x in protocol["selectedDevelopmentRecords"])
    assert protocol["selectionPolicy"]["freshIndependentEvaluationFamiliesConsumed"]==0
    assert protocol["output"]["automaticPromotion"] is False
    assert protocol["output"]["humanReviewRequired"] is True

    source=(OWNED/"audio-to-midi-p5-tsumugi-real-easy-development.py").read_text(encoding="utf-8")
    ast.parse(source)
    for needle in [
        "PITCH_SLOT_TRACK_COUNT_V1",
        "freshIndependentEvaluationFamiliesConsumed",
        "originalSourceAudioOpenedByThisCommand",
        "PREPARE_HUMAN_REVIEW_OF_3_REAL_EASY_DEVELOPMENT_OUTPUTS"
    ]:
        assert needle in source

    module=load_module()
    module.validate_protocol(protocol,controlled,env_spec)

    bad=copy.deepcopy(protocol)
    bad["selectedDevelopmentRecords"][0]["sourceRecordId"]="FAME000011"
    try:
        module.validate_protocol(bad,controlled,env_spec)
    except RuntimeError:
        pass
    else:
        raise AssertionError("development identity mutation not rejected")

    bad=copy.deepcopy(protocol)
    bad["selectionPolicy"]["freshIndependentEvaluationFamiliesConsumed"]=1
    try:
        module.validate_protocol(bad,controlled,env_spec)
    except RuntimeError:
        pass
    else:
        raise AssertionError("independent-evaluation consumption mutation not rejected")

    bad=copy.deepcopy(protocol)
    bad["inference"]["reuseControlledInferenceSettings"]=False
    try:
        module.validate_protocol(bad,controlled,env_spec)
    except RuntimeError:
        pass
    else:
        raise AssertionError("controlled-inference reuse mutation not rejected")

    print("owned-beats-audio-to-midi-p5-tsumugi-real-easy-development-test: PASS")

if __name__=="__main__":
    main()
