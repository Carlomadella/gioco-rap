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
    candidate=next(x for x in protocol["candidates"] if x["id"]=="drums-pfnmf-template-activation-v1")
    assert candidate["status"]=="IMPLEMENTATION_FROZEN_BEFORE_FIRST_RESULT"
    freeze=candidate["implementationFreeze"]
    assert freeze["scope"]=="CONTROLLED_MECHANICS_ONLY"
    assert freeze["factorization"]["harmonicRank"]==0
    assert freeze["factorization"]["dictionaryAdaptation"] is False
    assert freeze["factorization"]["method"]=="fixed drum dictionary NMF with KL-divergence multiplicative H update"
    assert freeze["onsetExtraction"]["adaptiveThreshold"]=="median of previous 0.1 seconds + 0.12 * global novelty maximum"
    assert freeze["newLearnedParameters"]==0
    assert freeze["tunedOnConsumedEvaluation"] is False
    module=load(OWNED/"audio-to-midi-p5-pfnmf-template.py","fame_p5_pfnmf_test")
    result=module.self_test()
    assert result["mode"]=="FAME_NEURAL_P5_PFNMF_SELF_TEST_PASS"
    assert result["candidateId"]=="drums-pfnmf-template-activation-v1"
    print("owned-beats-audio-to-midi-p5-pfnmf-test: PASS")

if __name__=="__main__":
    main()
