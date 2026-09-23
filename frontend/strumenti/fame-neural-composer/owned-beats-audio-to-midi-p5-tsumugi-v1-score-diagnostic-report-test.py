#!/usr/bin/env python3
import ast
import importlib.util
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SCRIPT=ROOT/"owned-beats"/"audio-to-midi-p5-tsumugi-v1-score-diagnostic-report.py"


def main():
    source=SCRIPT.read_text(encoding="utf-8")
    ast.parse(source)
    for needle in [
        "absentTargetPitchPositiveScoreRoleRows",
        "absentTargetPitchNonpositiveScoreRoleRows",
        "sourceControlledTargetPitchEventCount",
        "localizationRecomputedFromPersistedControlledEvents",
        "SOURCE_CONTROLLED_TARGET_PITCH_EVENTS_PRESENT",
        "POSITIVE_TARGET_SCORE_BUT_SOURCE_TARGET_PITCH_ABSENT",
        "HUMAN_REVIEW_V1_SCORE_MARGINS_AND_LOCALIZATION_COUNTS",
        "fixtureAudioOpenedByThisCommand",
        "semiCrfDecodeExecutedByThisCommand",
    ]:
        assert needle in source

    spec=importlib.util.spec_from_file_location("tsumugi_v1_score_report_test",SCRIPT)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    out=module.self_test()
    assert out["mode"]=="FAME_NEURAL_P5_TSUMUGI_V1_SCORE_DIAGNOSTIC_REPORT_SELF_TEST_PASS"
    print("owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-report-test: PASS")


if __name__=="__main__":
    main()
