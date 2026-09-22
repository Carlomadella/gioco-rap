#!/usr/bin/env python3
import importlib.util, json, pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parent
OWNED=ROOT/"owned-beats"
sys.path.insert(0,str(OWNED))

def load(path,name):
    spec=importlib.util.spec_from_file_location(name,path)
    if spec is None or spec.loader is None: raise RuntimeError(f"cannot load {path}")
    module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); return module

def main():
    p=json.loads((OWNED/"audio-to-midi-p3-controlled-fixtures-v1.json").read_text(encoding="utf-8"))
    assert p["schema"]=="fame-owned-beats-audio-to-midi-p3-controlled-fixtures-v1"
    assert p["status"]=="FROZEN_BEFORE_FIRST_P3_FIXTURE_BASELINE_RUN"
    assert len(p["fixtures"])==12 and p["safety"]["freshOwnedBeatFamiliesConsumed"]==0
    assert p["safety"]["sourceSeparationRequiredForControlledStage"] is False
    assert p["metrics"]["drums"]["onsetToleranceSeconds"]==0.03
    assert p["metrics"]["lowEnd"]["onsetToleranceSeconds"]==0.05
    assert p["metrics"]["lowEnd"]["pitchToleranceCents"]==50.0
    assert p["metrics"]["lowEnd"]["offsetRatio"]==0.2
    assert p["advancement"]["scorePolicy"]=="DIAGNOSTIC_ONLY_NO_POST_HOC_PROMOTION_THRESHOLD"
    assert [x["id"] for x in p["fixtures"]]==[
      "D01_KICK_ISOLATED","D02_SNARE_ISOLATED","D03_HIHAT_ISOLATED",
      "D04_KICK_SNARE_SIMULTANEOUS","D05_KICK_HIHAT_SIMULTANEOUS",
      "D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED","D08_UNSUPPORTED_CLAP_RIM",
      "L01_SUSTAINED_NOTE","L02_NOTE_CHANGE","L03_GLIDE","L04_GAP_RELEASE"
    ]
    generator=load(OWNED/"audio-to-midi-p3-fixtures.py","fame_p3_fixture_generator_test")
    baseline=load(OWNED/"audio-to-midi-p3-controlled-baseline.py","fame_p3_controlled_baseline_test")
    gen=generator.self_test(); base=baseline.self_test()
    assert gen["mode"]=="FAME_NEURAL_P3_CONTROLLED_FIXTURE_SELF_TEST_PASS" and gen["fixtures"]==12 and gen["freshOwnedBeatFamiliesConsumed"]==0
    assert base["mode"]=="FAME_NEURAL_P3_CONTROLLED_BASELINE_SELF_TEST_PASS" and base["drumSimultaneousMatches"]==2
    print("owned-beats-audio-to-midi-p3-controlled-test: PASS")

if __name__=="__main__": main()
