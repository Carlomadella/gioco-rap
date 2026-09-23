#!/usr/bin/env python3
"""Read-only summary for the completed Tsumugi V1 pitch-score diagnostic."""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path

RUN_ID="audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1-001"
RUN_DIR="audio-to-midi-p5-tsumugi-v1-score-diagnostic"
SOURCE_CONTROLLED_RUN_ID="audio-to-midi-p5-tsumugi-controlled-v1-001"
SOURCE_CONTROLLED_DIR="audio-to-midi-p5-tsumugi-controlled"
EXPECTED_STATUS="TSUMUGI_V1_SCORE_DIAGNOSTIC_COMPLETE_NO_RETUNING"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def summarize(summary, controlled_events_by_fixture):
    if summary.get("status") != EXPECTED_STATUS:
        raise RuntimeError(f"Unexpected V1 score diagnostic status: {summary.get('status')}")
    if summary.get("runId") != RUN_ID:
        raise RuntimeError(f"Unexpected V1 score diagnostic runId: {summary.get('runId')}")

    results=summary.get("results") or []
    if len(results)!=8:
        raise RuntimeError(f"Expected 8 V1 score diagnostic records, got {len(results)}")

    localization_counts=Counter()
    supported_role_rows=0
    absent_target_supported_role_rows=0
    absent_target_positive_role_rows=0
    absent_target_nonpositive_role_rows=0
    fixtures=[]

    for row in results:
        roles=[]
        fixture_id=row.get("fixtureId")
        controlled_events=controlled_events_by_fixture.get(fixture_id)
        if controlled_events is None:
            raise RuntimeError(f"Persisted controlled events missing for {fixture_id}")
        raw_pitch_counts=Counter(int(event["rawPitch"]) for event in controlled_events)
        for role in row.get("expectedRoleDiagnostics") or []:
            supported_role_rows+=1
            source_count=int(role.get("sourceControlledDecodedIntervalCount") or 0)
            target_pitches=[int(value) for value in (role.get("targetPitches") or [])]
            target_raw_pitch_counts={
                str(pitch):int(raw_pitch_counts.get(pitch,0))
                for pitch in target_pitches
            }
            target_event_count=sum(target_raw_pitch_counts.values())
            any_positive=bool(role.get("anyPositiveIntervalScore"))
            if target_event_count>0:
                localization="SOURCE_CONTROLLED_TARGET_PITCH_EVENTS_PRESENT"
            elif any_positive:
                localization="POSITIVE_TARGET_SCORE_BUT_SOURCE_TARGET_PITCH_ABSENT"
            else:
                localization="EXPECTED_ROLE_TARGET_SCORES_NONPOSITIVE"
            localization_counts[localization]+=1
            if target_event_count==0:
                absent_target_supported_role_rows+=1
                if any_positive:
                    absent_target_positive_role_rows+=1
                else:
                    absent_target_nonpositive_role_rows+=1
            roles.append({
                "role":role.get("role"),
                "targetPitches":target_pitches,
                "bestMaxEventScore":role.get("bestMaxEventScore"),
                "anyPositiveIntervalScore":any_positive,
                "sourceControlledDecodedIntervalCount":source_count,
                "sourceControlledTargetPitchEventCount":target_event_count,
                "sourceControlledTargetRawPitchCounts":target_raw_pitch_counts,
                "storedLocalization":role.get("localization"),
                "localization":localization,
            })
        fixtures.append({
            "fixtureId":row.get("fixtureId"),
            "factor":row.get("factor"),
            "expectedSupportedRoles":row.get("expectedSupportedRoles") or [],
            "sourceControlledDecodedIntervalCount":int(row.get("sourceControlledDecodedIntervalCount") or 0),
            "roles":roles,
        })

    return {
        "mode":"FAME_NEURAL_P5_TSUMUGI_V1_SCORE_DIAGNOSTIC_REPORT",
        "runId":RUN_ID,
        "records":len(results),
        "runtime":summary.get("runtime") or {},
        "localizationCounts":dict(sorted(localization_counts.items())),
        "supportedRoleRows":supported_role_rows,
        "absentTargetPitchSupportedRoleRows":absent_target_supported_role_rows,
        "absentTargetPitchPositiveScoreRoleRows":absent_target_positive_role_rows,
        "absentTargetPitchNonpositiveScoreRoleRows":absent_target_nonpositive_role_rows,
        "fixtures":fixtures,
        "localizationRecomputedFromPersistedControlledEvents":True,
        "sourceAudioOpenedByThisCommand":False,
        "ownedBeatAudioOpenedByThisCommand":False,
        "fixtureAudioOpenedByThisCommand":False,
        "diagnosticModelForwardExecutedByThisCommand":False,
        "semiCrfDecodeExecutedByThisCommand":False,
        "finalTranscriptionExecutedByThisCommand":False,
        "retuningPerformedByThisCommand":False,
        "trainingAuthorized":False,
        "batch131Authorized":False,
        "taskDataReadyMayBeDeclared":False,
        "nextAction":"HUMAN_REVIEW_V1_SCORE_MARGINS_AND_LOCALIZATION_COUNTS",
    }


def report(workspace):
    workspace=Path(workspace).resolve()
    summary_file=workspace/"runs"/RUN_DIR/RUN_ID/"summary.json"
    if not summary_file.is_file():
        raise RuntimeError(f"V1 score diagnostic summary missing: {summary_file}")
    summary=read_json(summary_file)
    controlled_events_by_fixture={}
    for row in summary.get("results") or []:
        fixture_id=str(row.get("fixtureId"))
        result_file=(
            workspace/"runs"/SOURCE_CONTROLLED_DIR/SOURCE_CONTROLLED_RUN_ID
            /fixture_id/"result.json"
        )
        if not result_file.is_file():
            raise RuntimeError(f"Controlled result missing for V1 score review: {result_file}")
        controlled_result=read_json(result_file)
        controlled_events_by_fixture[fixture_id]=controlled_result.get("events") or []
    out=summarize(summary,controlled_events_by_fixture)
    out["summaryFile"]=str(summary_file)
    out["sourceControlledRunId"]=SOURCE_CONTROLLED_RUN_ID
    return out


def self_test():
    fake={
        "status":EXPECTED_STATUS,
        "runId":RUN_ID,
        "runtime":{"semiCrfVersion":"v1"},
        "results":[]
    }
    for index in range(8):
        roles=[]
        if index<3:
            roles=[{
                "role":"kick",
                "targetPitches":[35,36],
                "bestMaxEventScore":1.0 if index==0 else -0.5,
                "anyPositiveIntervalScore":index==0,
                "sourceControlledDecodedIntervalCount":0,
                "sourceControlledTargetPitchEventCount":0,
                "sourceControlledTargetRawPitchCounts":{"35":0,"36":0},
                "localization":(
                    "POSITIVE_TARGET_SCORE_BUT_SOURCE_TARGET_PITCH_ABSENT"
                    if index==0 else
                    "EXPECTED_ROLE_TARGET_SCORES_NONPOSITIVE"
                )
            }]
        fake["results"].append({
            "fixtureId":f"D{index+1:02d}",
            "factor":"test",
            "expectedSupportedRoles":["kick"] if roles else [],
            "sourceControlledDecodedIntervalCount":0,
            "expectedRoleDiagnostics":roles,
        })
    controlled_events_by_fixture={
        "D01":[{"rawPitch":35}],
        "D02":[],
        "D03":[],
        "D04":[],
        "D05":[],
        "D06":[],
        "D07":[],
        "D08":[],
    }
    out=summarize(fake,controlled_events_by_fixture)
    assert out["records"]==8
    assert out["supportedRoleRows"]==3
    assert out["absentTargetPitchPositiveScoreRoleRows"]==0
    assert out["absentTargetPitchNonpositiveScoreRoleRows"]==2
    assert out["localizationCounts"]["SOURCE_CONTROLLED_TARGET_PITCH_EVENTS_PRESENT"]==1
    return {"mode":"FAME_NEURAL_P5_TSUMUGI_V1_SCORE_DIAGNOSTIC_REPORT_SELF_TEST_PASS"}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("command",choices=["self-test","report"])
    ap.add_argument("workspace",nargs="?")
    args=ap.parse_args()
    if args.command=="self-test":
        out=self_test()
    else:
        if not args.workspace:
            ap.error("workspace is required for report")
        out=report(args.workspace)
    print(json.dumps(out,ensure_ascii=False,indent=2))


if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL TSUMUGI V1 SCORE DIAGNOSTIC REPORT FAILED: {exc}",file=__import__("sys").stderr)
        raise SystemExit(1)
