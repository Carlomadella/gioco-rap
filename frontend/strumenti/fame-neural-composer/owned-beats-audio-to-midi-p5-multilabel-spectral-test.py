#!/usr/bin/env python3
import importlib.util
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"
sys.path.insert(0,str(OWNED))

def load(path,name):
    spec=importlib.util.spec_from_file_location(name,path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def main():
    protocol=json.loads((OWNED/"audio-to-midi-p5-drums-comparison-v1.json").read_text(encoding="utf-8"))
    assert protocol["schema"]=="fame-owned-beats-audio-to-midi-p5-drums-comparison-v1"
    assert protocol["status"]=="FROZEN_BEFORE_FIRST_P5_VARIANT_RESULT"
    assert protocol["scope"]=="DRUMS_ONLY_LOWEND_FROZEN"
    assert protocol["budget"]["controlledFixtures"]==8
    assert protocol["budget"]["consumedIndependentEvaluationFamilies"]==0
    assert protocol["safety"]["lowEndMayBeRetuned"] is False
    candidate=next(x for x in protocol["candidates"] if x["id"]=="drums-independent-multilabel-spectral-v1")
    freeze=candidate["implementationFreeze"]
    assert freeze["classBandMapping"]=={"kick":"low","snare":"mid","hihat":"high"}
    assert freeze["newLearnedParameters"]==0
    assert freeze["newTunedThresholds"]==0
    module=load(OWNED/"audio-to-midi-p5-multilabel-spectral.py","fame_p5_multilabel_test")
    result=module.self_test()
    assert result["mode"]=="FAME_NEURAL_P5_MULTILABEL_SPECTRAL_SELF_TEST_PASS"
    assert result["candidateId"]=="drums-independent-multilabel-spectral-v1"
    print("owned-beats-audio-to-midi-p5-multilabel-spectral-test: PASS")

if __name__=="__main__":
    main()
