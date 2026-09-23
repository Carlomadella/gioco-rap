#!/usr/bin/env python3
"""Read-only summary for the completed Tsumugi V1 pitch-score diagnostic."""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path

RUN_ID="audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1-001"
RUN_DIR="audio-to-midi-p5-tsumugi-v1-score-diagnostic"
EXPECTED_STATUS="TSUMUGI_V1_SCORE_DIAGNOSTIC_COMPLETE_NO_RETUNING"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def summarize(summary):
    if summary.get("status") != EXPECTED_STATUS:
        raise RuntimeError(f"Unexpected V1 score diagnostic status: {summary.get('status')}")
    if summary.get("runId") != RUN_ID:
        raise RuntimeError(f"Unexpected V1 score diagnostic runId: {summary.get('runId')}")

    results=summary.get("results") or []
    if len(results)!=8:
        raise RuntimeError(f"Expected 8 V1 score diagnostic records, got {len(results)}")

    localization_counts=Counter()
    supported_role_rows=0
    zero_interval_supported_role_rows=0
    zero_interval_positive_role_rows=0
    zero_interval_nonpositive_role_rows=0
    fixtures=[]

    for row in results:
        roles=[]
        for role in row.get("expectedRoleDiagnostics") or []:
            localization=str(role.get("localization"))
            localization_counts[localization]+=1
            supported_role_rows+=1
            source_count=int(role.get("sourceControlledDecodedIntervalCount") or 0)
            if source_count==0:
                zero_interval_supported_role_rows+=1
                if bool(role.get("anyPositiveIntervalScore")):
                    zero_interval_positive_role_rows+=1
                else:
                    zero_interval_nonpositive_role_rows+=1
            roles.append({
                "role":role.get("role"),
                "targetPitches":role.get("targetPitches") or [],
                "bestMaxEventScore":role.get("bestMaxEventScore"),
                "anyPositiveIntervalScore":bool(role.get("anyPositiveIntervalScore")),
                "sourceControlledDecodedIntervalCount":source_count,
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
        "zeroIntervalSupportedRoleRows":zero_interval_supported_role_rows,
        "zeroIntervalPositiveTargetScoreRoleRows":zero_interval_positive_role_rows,
        "zeroIntervalNonpositiveTargetScoreRoleRows":zero_interval_nonpositive_role_rows,
        "fixtures":fixtures,
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
    summary_file=(
        Path(workspace).resolve()
        /"runs"/RUN_DIR/RUN_ID/"summary.json"
    )
    if not summary_file.is_file():
        raise RuntimeError(f"V1 score diagnostic summary missing: {summary_file}")
    out=summarize(read_json(summary_file))
    out["summaryFile"]=str(summary_file)
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
                "localization":(
                    "POSITIVE_TARGET_SCORE_BUT_SOURCE_DECODED_ZERO_INTERVALS"
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
    out=summarize(fake)
    assert out["records"]==8
    assert out["supportedRoleRows"]==3
    assert out["zeroIntervalPositiveTargetScoreRoleRows"]==1
    assert out["zeroIntervalNonpositiveTargetScoreRoleRows"]==2
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
