#!/usr/bin/env python3
"""Read-only failure localization for the persisted Tsumugi controlled run."""
from __future__ import annotations
import argparse
from collections import Counter
import json
from pathlib import Path

RUN_ID="audio-to-midi-p5-tsumugi-controlled-v1-001"
PROTOCOL_FILE=Path(__file__).resolve().parent/"audio-to-midi-p5-tsumugi-controlled-protocol-v1.json"
TSUMUGI_NUM_PITCHES=88
FROZEN_CHECKPOINT_SEMI_CRF_VERSION="v1"
FROZEN_CHECKPOINT_NUM_PITCH_SLOTS=1

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def pick(stats, *names):
    for name in names:
        if name in stats:
            return stats.get(name)
    return None

def localization_hint(result, protocol):
    stats=result.get("decoderStats") or {}
    raw_count=int(result.get("rawPredictedNoteCount") or 0)
    window_count=pick(stats,"window_count","windowCount")
    decoded_windows=pick(stats,"decoded_window_count","decodedWindowCount")
    skipped=pick(stats,"skipped_silent_window_count","skippedSilentWindowCount")
    selected_pairs=pick(stats,"selected_pair_count","selectedPairCount")
    decoded_intervals=pick(stats,"decoded_interval_count","decodedIntervalCount")
    boundary_no_onset=pick(stats,"boundary_no_onset_count","boundaryNoOnsetCount")
    boundary_no_offset=pick(stats,"boundary_no_offset_count","boundaryNoOffsetCount")

    resolved=result.get("resolvedInferenceSettings") or {}
    allowed_ids=resolved.get("allowedInstrumentIds") or []
    topk=int(protocol.get("inference",{}).get("instrumentPairInferTopk",0))
    expected_v1_track_count=TSUMUGI_NUM_PITCHES*FROZEN_CHECKPOINT_NUM_PITCH_SLOTS

    if raw_count>0:
        hint="PREDICTED_NOTES_PRESENT"
    elif window_count is not None and skipped is not None and int(window_count)>0 and int(skipped)==int(window_count):
        hint="ALL_WINDOWS_SKIPPED_BY_SILENCE_GATE"
    elif decoded_intervals is not None and int(decoded_intervals)==0:
        hint="V1_PITCH_TRACKS_PRESENT_NO_INTERVALS_DECODED"
    elif decoded_intervals is not None and int(decoded_intervals)>0:
        hint="INTERVALS_DECODED_BUT_NO_FINAL_NOTES"
    else:
        hint="UNRESOLVED_FROM_PERSISTED_STATS"

    return {
        "hint":hint,
        "windowCount":window_count,
        "decodedWindowCount":decoded_windows,
        "skippedSilentWindowCount":skipped,
        "selectedPairCount":selected_pairs,
        "decodedIntervalCount":decoded_intervals,
        "boundaryNoOnsetCount":boundary_no_onset,
        "boundaryNoOffsetCount":boundary_no_offset,
        "checkpointSemiCrfVersion":FROZEN_CHECKPOINT_SEMI_CRF_VERSION,
        "expectedV1PitchTrackCount":expected_v1_track_count,
        "instrumentPairInferTopk":topk,
        "allowedInstrumentIds":allowed_ids,
        "selectedPairCountMeaning":"PITCH_SLOT_TRACK_COUNT",
        "selectedPairCountIsGateConfidenceEvidence":False,
    }

def summarize_result(result, protocol):
    events=result.get("events") or []
    raw_pitch_counts=Counter(int(e["rawPitch"]) for e in events)
    canonical_pitch_counts=Counter(int(e["canonicalPitch"]) for e in events)
    role_counts=Counter(str(e["role"]) for e in events)
    metric=(result.get("metrics") or {}).get("primary30ms") or {}
    return {
        "fixtureId":result.get("fixtureId"),
        "factor":result.get("factor"),
        "rawPredictedNoteCount":int(result.get("rawPredictedNoteCount") or 0),
        "primary30ms":{
            "tp":metric.get("tp"),
            "fp":metric.get("fp"),
            "fn":metric.get("fn"),
            "precision":metric.get("precision"),
            "recall":metric.get("recall"),
            "f1":metric.get("f1"),
        },
        "decoder":localization_hint(result,protocol),
        "rawPitchCounts":{str(k):v for k,v in sorted(raw_pitch_counts.items())},
        "canonicalPitchCounts":{str(k):v for k,v in sorted(canonical_pitch_counts.items())},
        "roleCounts":dict(sorted(role_counts.items())),
        "events":[
            {
                "timeSeconds":e.get("timeSeconds"),
                "endSeconds":e.get("endSeconds"),
                "role":e.get("role"),
                "rawPitch":e.get("rawPitch"),
                "canonicalPitch":e.get("canonicalPitch"),
                "slotIndex":e.get("slotIndex"),
            }
            for e in events
        ],
        "decoderStats":result.get("decoderStats") or {},
    }

def report(workspace):
    root=Path(workspace).resolve()/"runs"/"audio-to-midi-p5-tsumugi-controlled"/RUN_ID
    summary_file=root/"summary.json"
    if not summary_file.is_file():
        raise RuntimeError(f"Tsumugi controlled summary missing: {summary_file}")
    summary=read_json(summary_file)
    if summary.get("status")!="CONTROLLED_TSUMUGI_INFERENCE_COMPLETE_DIAGNOSTIC_ONLY":
        raise RuntimeError(f"Unexpected Tsumugi summary status: {summary.get('status')}")
    protocol=read_json(PROTOCOL_FILE)
    fixtures=[]
    for row in summary.get("results",[]):
        fid=row["fixtureId"]
        result_file=root/fid/"result.json"
        if not result_file.is_file():
            raise RuntimeError(f"Tsumugi result missing: {result_file}")
        fixtures.append(summarize_result(read_json(result_file),protocol))
    return {
        "mode":"FAME_NEURAL_P5_TSUMUGI_CONTROLLED_FAILURE_REPORT",
        "runId":RUN_ID,
        "controlledGatePass":bool((summary.get("controlledGate") or {}).get("pass")),
        "records":len(fixtures),
        "fixtures":fixtures,
        "sourceAudioOpenedByThisCommand":False,
        "fixtureAudioOpenedByThisCommand":False,
        "transcriptionExecutedByThisCommand":False,
        "sourceSeparationExecutedByThisCommand":False,
        "retuningPerformedByThisCommand":False,
        "freshOwnedBeatFamiliesConsumed":0,
        "consumedIndependentEvaluationFamiliesUsedForTuning":0,
        "trainingAuthorized":False,
        "batch131Authorized":False,
        "taskDataReadyMayBeDeclared":False,
    }

def self_test():
    a={
        "rawPredictedNoteCount":0,
        "decoderStats":{"window_count":1,"skipped_silent_window_count":0,"selected_pair_count":0,"decoded_interval_count":0}
    }
    protocol={"inference":{"instrumentPairInferTopk":0}}
    assert localization_hint(a,protocol)["hint"]=="V1_PITCH_TRACKS_PRESENT_NO_INTERVALS_DECODED"
    b={
        "rawPredictedNoteCount":0,
        "decoderStats":{"window_count":1,"skipped_silent_window_count":1,"selected_pair_count":0,"decoded_interval_count":0}
    }
    assert localization_hint(b,protocol)["hint"]=="ALL_WINDOWS_SKIPPED_BY_SILENCE_GATE"
    c={
        "rawPredictedNoteCount":0,
        "decoderStats":{"window_count":1,"skipped_silent_window_count":0,"selected_pair_count":3,"decoded_interval_count":0}
    }
    assert localization_hint(c,protocol)["hint"]=="V1_PITCH_TRACKS_PRESENT_NO_INTERVALS_DECODED"
    assert localization_hint(c,protocol)["selectedPairCountMeaning"]=="PITCH_SLOT_TRACK_COUNT"
    assert localization_hint(c,protocol)["selectedPairCountIsGateConfidenceEvidence"] is False
    return {"mode":"FAME_NEURAL_P5_TSUMUGI_FAILURE_REPORT_SELF_TEST_PASS"}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("command",choices=["self-test","report"])
    ap.add_argument("workspace",nargs="?")
    args=ap.parse_args()
    out=self_test() if args.command=="self-test" else report(args.workspace)
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
