#!/usr/bin/env python3
"""Read-only localization report for the completed P3 controlled baseline."""
import argparse
import json
from pathlib import Path

RUN_ID="audio-to-midi-p3-controlled-baseline-v1-001"
DEFAULT_TOLERANCE=0.03
DRUM_ROLES={"kick","snare","hihat"}

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def prf(tp,fp,fn):
    precision=tp/(tp+fp) if tp+fp else 0.0
    recall=tp/(tp+fn) if tp+fn else 0.0
    f1=2*precision*recall/(precision+recall) if precision+recall else 0.0
    return {"tp":tp,"fp":fp,"fn":fn,"precision":round(precision,6),"recall":round(recall,6),"f1":round(f1,6)}

def maximum_match(ref_times, est_times, tolerance):
    adjacency=[
        [j for j,e in enumerate(est_times) if abs(float(e)-float(r))<=tolerance]
        for r in ref_times
    ]
    owner=[-1]*len(est_times)
    def visit(i,seen):
        for j in adjacency[i]:
            if j in seen:
                continue
            seen.add(j)
            if owner[j]<0 or visit(owner[j],seen):
                owner[j]=i
                return True
        return False
    for i in range(len(ref_times)):
        visit(i,set())
    return sorted((i,j) for j,i in enumerate(owner) if i>=0)

def onset_metrics(reference_events,onset_times,tolerance):
    refs=[x for x in reference_events if x.get("role") in DRUM_ROLES]
    pairs=maximum_match([x["timeSeconds"] for x in refs],onset_times,tolerance)
    out=prf(len(pairs),len(onset_times)-len(pairs),len(refs)-len(pairs))
    out.update({
        "referenceSupportedEvents":len(refs),
        "detectedOnsets":len(onset_times),
        "matches":[
            {
                "referenceIndex":i,
                "onsetIndex":j,
                "role":refs[i]["role"],
                "referenceTimeSeconds":refs[i]["timeSeconds"],
                "detectedTimeSeconds":onset_times[j],
                "absoluteErrorSeconds":round(abs(float(onset_times[j])-float(refs[i]["timeSeconds"])),6)
            }
            for i,j in pairs
        ]
    })
    return out

def event_status(reference_events,onset_times,fusion_events,tolerance):
    rows=[]
    supported=[x for x in reference_events if x.get("role") in DRUM_ROLES]
    for ref in supported:
        near_onsets=[
            t for t in onset_times
            if abs(float(t)-float(ref["timeSeconds"]))<=tolerance
        ]
        near_events=[
            e for e in fusion_events
            if abs(float(e["timeSeconds"])-float(ref["timeSeconds"]))<=tolerance
        ]
        same_role=[e for e in near_events if e.get("role")==ref["role"]]
        if same_role:
            status="CORRECT"
        elif near_onsets:
            status="ONSET_PRESENT_ROLE_MISSING"
        else:
            status="ONSET_MISSING"
        rows.append({
            "referenceTimeSeconds":ref["timeSeconds"],
            "referenceRole":ref["role"],
            "status":status,
            "nearbyOnsetCount":len(near_onsets),
            "nearbyPredictedRoles":sorted({e.get("role") for e in near_events if e.get("role")})
        })
    return rows

def simultaneous_groups(reference_events):
    groups={}
    for event in reference_events:
        if event.get("role") not in DRUM_ROLES:
            continue
        key=round(float(event["timeSeconds"]),6)
        groups.setdefault(key,[]).append(event["role"])
    return [
        {"timeSeconds":time,"roles":sorted(roles),"distinctRoles":len(set(roles))}
        for time,roles in sorted(groups.items())
        if len(set(roles))>1
    ]

def localize_drum(result,tolerance=DEFAULT_TOLERANCE):
    ref=result["reference"].get("drumEvents",[])
    onsets=result["intermediate"].get("drumsOnsetTimesSeconds",[])
    fusion=result["drums"].get("fusionEvents",[])
    onset=onset_metrics(ref,onsets,tolerance)
    classification=result["drums"].get("primary30ms",{})
    statuses=event_status(ref,onsets,fusion,tolerance)
    counts={}
    for row in statuses:
        counts[row["status"]]=counts.get(row["status"],0)+1

    if not [x for x in ref if x.get("role") in DRUM_ROLES]:
        localization="NO_SUPPORTED_DRUM_REFERENCE"
    elif onset["recall"]<1.0:
        localization="DETECTION_FAILURE_PRESENT"
    elif classification.get("recall",0.0)<1.0:
        localization="ONSET_DETECTION_OK_CLASSIFICATION_OR_SINGLE_LABEL_FAILURE"
    else:
        localization="SUPPORTED_DRUM_REFERENCE_PASS"

    simultaneous=simultaneous_groups(ref)
    return {
        "fixtureId":result["fixtureId"],
        "factor":result["factor"],
        "localization":localization,
        "onsetDetection30ms":onset,
        "finalSupportedRoleMetrics30ms":classification,
        "eventStatusCounts":counts,
        "eventStatuses":statuses,
        "simultaneousReferenceGroups":simultaneous,
        "singleLabelPressurePresent":bool(simultaneous),
        "bassKickCandidates":len(result["drums"].get("bassKickCandidates",[])),
        "unsupportedReferenceDiagnostic":result["drums"].get("unsupportedReferenceDiagnostic")
    }

def summarize_lowend(result):
    return {
        "fixtureId":result["fixtureId"],
        "factor":result["factor"],
        "noteMetrics":result["lowEnd"].get("noteMetrics"),
        "glideDiagnostic":result["lowEnd"].get("glideDiagnostic"),
        "voicedFrameCount":result["lowEnd"].get("voicedFrameCount"),
        "frameCount":result["lowEnd"].get("frameCount"),
        "pyinDecisionCounts":result["intermediate"].get("pyinAllFrames",{}).get("decisionCounts",{})
    }

def report(workspace):
    root=Path(workspace).resolve()/"runs"/"audio-to-midi-p3-controlled-baseline"/RUN_ID
    summary_file=root/"summary.json"
    if not summary_file.is_file():
        raise RuntimeError(f"P3 summary missing: {summary_file}")
    summary=read_json(summary_file)
    if summary.get("status")!="CONTROLLED_BASELINE_COMPLETE_DIAGNOSTIC_ONLY" or summary.get("records")!=12:
        raise RuntimeError("Unexpected P3 controlled baseline summary")

    drums=[]
    lowend=[]
    for row in summary["results"]:
        result_file=root/row["fixtureId"]/"result.json"
        result=read_json(result_file)
        if result["domain"]=="drums":
            drums.append(localize_drum(result))
        elif result["domain"]=="lowend":
            lowend.append(summarize_lowend(result))

    first_supported_failure=next(
        (x["fixtureId"] for x in drums if x["localization"] not in {"SUPPORTED_DRUM_REFERENCE_PASS","NO_SUPPORTED_DRUM_REFERENCE"}),
        None
    )
    return {
        "mode":"FAME_NEURAL_P3_CONTROLLED_LOCALIZATION_REPORT",
        "runId":RUN_ID,
        "records":12,
        "firstSupportedDrumFailure":first_supported_failure,
        "drums":drums,
        "lowEnd":lowend,
        "sourceAudioOpenedByThisCommand":False,
        "sourceSeparationExecutedByThisCommand":False,
        "transcriptionExecutedByThisCommand":False,
        "retuningPerformedByThisCommand":False,
        "historicalArtifactsModifiedByThisCommand":False,
        "freshOwnedBeatFamiliesConsumed":0,
        "trainingAuthorized":False,
        "batch131Authorized":False,
        "taskDataReadyMayBeDeclared":False
    }

def self_test():
    result={
        "fixtureId":"T",
        "factor":"test",
        "reference":{"drumEvents":[{"timeSeconds":0.5,"role":"kick"},{"timeSeconds":0.5,"role":"snare"}]},
        "intermediate":{"drumsOnsetTimesSeconds":[0.51]},
        "drums":{
            "fusionEvents":[{"timeSeconds":0.51,"role":"kick"}],
            "primary30ms":{"tp":1,"fp":0,"fn":1,"precision":1.0,"recall":0.5,"f1":0.666667},
            "bassKickCandidates":[],
            "unsupportedReferenceDiagnostic":{"unsupportedReferenceEvents":0}
        }
    }
    out=localize_drum(result)
    assert out["onsetDetection30ms"]["recall"]==0.5
    assert out["localization"]=="DETECTION_FAILURE_PRESENT"
    assert out["singleLabelPressurePresent"] is True

    result["intermediate"]["drumsOnsetTimesSeconds"]=[0.49,0.51]
    out=localize_drum(result)
    assert out["onsetDetection30ms"]["recall"]==1.0
    assert out["localization"]=="ONSET_DETECTION_OK_CLASSIFICATION_OR_SINGLE_LABEL_FAILURE"
    return {"mode":"FAME_NEURAL_P3_LOCALIZATION_SELF_TEST_PASS"}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("command",choices=["self-test","report"])
    ap.add_argument("workspace",nargs="?")
    args=ap.parse_args()
    if args.command=="self-test":
        out=self_test()
    else:
        if not args.workspace:
            raise RuntimeError("report requires workspace")
        out=report(args.workspace)
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
