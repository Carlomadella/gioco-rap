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
    candidate=next(x for x in protocol["candidates"] if x["id"]=="drums-transient-subset-bic-v1")
    assert candidate["status"]=="IMPLEMENTATION_FROZEN_BEFORE_FIRST_RESULT"
    freeze=candidate["implementationFreeze"]
    assert freeze["subsetSearch"]=="all 7 non-empty subsets of kick/snare/hihat"
    assert freeze["amplitudeFit"]=="scipy.optimize.nnls"
    assert freeze["modelSelection"]=="BIC = nBins * ln(RSS/nBins + eps) + k * ln(nBins)"
    assert freeze["newLearnedParameters"]==0
    assert freeze["newTunedThresholds"]==0
    module=load(OWNED/"audio-to-midi-p5-transient-subset-bic.py","fame_p5_subset_bic_test")
    result=module.self_test()
    assert result["mode"]=="FAME_NEURAL_P5_TRANSIENT_SUBSET_BIC_SELF_TEST_PASS"
    assert result["candidateId"]=="drums-transient-subset-bic-v1"
    assert result["subsetModels"]==7
    print("owned-beats-audio-to-midi-p5-transient-subset-bic-test: PASS")

if __name__=="__main__":
    main()
