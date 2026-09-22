#!/usr/bin/env python3
"""Run frozen Audio-to-MIDI v1 on clean controlled P3 fixtures."""
import argparse, shutil, sys, uuid
from pathlib import Path
import librosa

from audio_to_midi_p3_metrics import drum_metrics, unsupported_drum, lowend_metrics, full_pyin, glide_diagnostic
from audio_to_midi_p3_runtime import (
    FIXTURE_PROTOCOL_FILE, DEV_PROTOCOL_FILE, BASELINE_FILE, RUN_ID,
    stable_json, read_json, sha256_file, load_module,
    validate_environment_and_frozen_baseline, validate_fixture_manifest, run_root,
)

def execute(workspace):
    fixture_protocol=read_json(FIXTURE_PROTOCOL_FILE); dev=read_json(DEV_PROTOCOL_FILE)
    baseline_blob=validate_environment_and_frozen_baseline(dev)
    fixtures_root,manifest,by_id=validate_fixture_manifest(workspace,fixture_protocol)
    baseline=load_module(BASELINE_FILE,"fame_p3_frozen_audio_to_midi_baseline")
    root=run_root(workspace)
    if root.exists(): raise RuntimeError(f"Append-only P3 controlled baseline run already exists: {root}")
    root.parent.mkdir(parents=True,exist_ok=True); temp=root.parent/f".{RUN_ID}.tmp-{uuid.uuid4().hex}"; temp.mkdir(); rows=[]
    try:
        for fixture in fixture_protocol["fixtures"]:
            fid=fixture["id"]; src=fixtures_root/fid; ref=read_json(src/"reference.json")
            drums=baseline.decode_mono_f32(src/"drums.wav",int(dev["drums"]["decodeSampleRate"]))
            bass=baseline.decode_mono_f32(src/"bass.wav",int(dev["lowEnd"]["primaryArm"]["sampleRate"]))
            bass_drums=bass if int(dev["lowEnd"]["primaryArm"]["sampleRate"])==int(dev["drums"]["decodeSampleRate"]) else baseline.decode_mono_f32(src/"bass.wav",int(dev["drums"]["decodeSampleRate"]))
            sr=int(dev["drums"]["decodeSampleRate"]); hop=int(dev["drums"]["hopLength"])
            _de,df=baseline.detect_onsets(drums,sr,hop,dev["drums"]["onset"]["delta"],dev["drums"]["onset"]["waitFrames"])
            _be,bf=baseline.detect_onsets(bass_drums,sr,hop,dev["drums"]["onset"]["delta"],dev["drums"]["onset"]["waitFrames"])
            drums_only=baseline.transcribe_drums_only(drums,dev)
            bass_kicks=baseline.bass_kick_candidates(bass_drums,dev)
            fusion=baseline.fuse_kick_events(drums_only,bass_kicks,dev["drums"]["kickFusion"]["deduplicateWithinSeconds"])
            low=baseline.transcribe_lowend_pyin(bass,dev); pyin=full_pyin(bass,dev)
            primary=drum_metrics(ref.get("drumEvents",[]),fusion,float(fixture_protocol["metrics"]["drums"]["onsetToleranceSeconds"]))
            secondary=drum_metrics(ref.get("drumEvents",[]),fusion,float(fixture_protocol["metrics"]["drums"]["secondaryToleranceSeconds"]))
            unsupported=unsupported_drum(ref.get("drumEvents",[]),fusion,float(fixture_protocol["metrics"]["drums"]["onsetToleranceSeconds"]))
            note_metrics=lowend_metrics(ref.get("lowEndNotes",[]),low["notes"],fixture_protocol["metrics"]["lowEnd"]) if ref.get("lowEndNotes") else None
            glide=glide_diagnostic(ref.get("lowEndPitchReference",[]),pyin)
            out=temp/fid; out.mkdir(); bpm=float(fixture_protocol["audio"]["bpm"]); ppq=int(dev["output"]["midiPpq"])
            baseline.write_midi(out/"drums-only.mid",drums_only,bpm,ppq,int(dev["output"]["drumChannelZeroBased"]),drum=True)
            baseline.write_midi(out/"drums-fusion.mid",fusion,bpm,ppq,int(dev["output"]["drumChannelZeroBased"]),drum=True)
            baseline.write_midi(out/"low-end.mid",low["notes"],bpm,ppq,int(dev["output"]["bassChannelZeroBased"]),drum=False)
            result={
              "schema":"fame-owned-beats-audio-to-midi-p3-controlled-baseline-result-v1","version":1,"runId":RUN_ID,
              "fixtureId":fid,"domain":fixture["domain"],"factor":fixture["factor"],"sourceCondition":"CONTROLLED_CLEAN_STEM_NO_SOURCE_SEPARATION",
              "fixtureHashes":by_id[fid]["files"],"timing":{"bpm":bpm,"midiPpq":ppq},
              "intermediate":{
                "drumsOnsetFrames":[int(x) for x in df],
                "drumsOnsetTimesSeconds":[round(float(librosa.frames_to_time(x,sr=sr,hop_length=hop)),6) for x in df],
                "bassOnsetFrames":[int(x) for x in bf],
                "bassOnsetTimesSeconds":[round(float(librosa.frames_to_time(x,sr=sr,hop_length=hop)),6) for x in bf],
                "pyinAllFrames":pyin
              },
              "drums":{"drumsOnlyEvents":drums_only,"bassKickCandidates":bass_kicks,"fusionEvents":fusion,"primary30ms":primary,"secondary50ms":secondary,"unsupportedReferenceDiagnostic":unsupported},
              "lowEnd":{"notes":low["notes"],"filteredPitchContour":low["pitchContour"],"noteMetrics":note_metrics,"glideDiagnostic":glide,"voicedFrameCount":low["voicedFrameCount"],"frameCount":low["frameCount"]},
              "midi":{"drumsOnly":"drums-only.mid","drumsFusion":"drums-fusion.mid","lowEnd":"low-end.mid"},
              "safety":{"freshOwnedBeatFamiliesConsumed":0,"sourceSeparationExecuted":False,"retuningPerformed":False,"trainingAuthorized":False,"batch131Authorized":False,"taskDataReadyMayBeDeclared":False}
            }
            result_file=out/"result.json"; result_file.write_text(stable_json(result),encoding="utf-8")
            rows.append({"fixtureId":fid,"domain":fixture["domain"],"factor":fixture["factor"],"resultSha256":sha256_file(result_file),"drumsF1Primary":primary["f1"],"drumsRecallPrimary":primary["recall"],"lowEndF1":None if note_metrics is None else note_metrics["f1"],"unsupportedMappedCount":unsupported["mappedToSupportedRoleCount"],"glideMedianPitchErrorCents":None if glide is None else glide["medianAbsolutePitchErrorCents"],"pyinDecisionCounts":pyin["decisionCounts"]})
        summary={
          "schema":"fame-owned-beats-audio-to-midi-p3-controlled-baseline-summary-v1","version":1,"status":"CONTROLLED_BASELINE_COMPLETE_DIAGNOSTIC_ONLY","runId":RUN_ID,
          "records":len(rows),"fixtureManifestSha256":sha256_file(fixtures_root/"fixture-manifest.json"),"fixtureProtocolSha256":sha256_file(FIXTURE_PROTOCOL_FILE),"developmentProtocolSha256":sha256_file(DEV_PROTOCOL_FILE),
          "frozenBaselineGitBlobSha1":baseline_blob,"librosaVersion":librosa.__version__,"pythonVersion":sys.version.split()[0],"results":rows,
          "safety":{"freshOwnedBeatFamiliesConsumed":0,"sourceSeparationExecuted":False,"retuningPerformed":False,"trainingAuthorized":False,"batch131Authorized":False,"taskDataReadyMayBeDeclared":False},
          "nextAction":"REVIEW_CONTROLLED_CASES_AND_LOCALIZE_FIRST_FAILURE_LEVEL_BEFORE_REAL_EASY_BEATS"
        }
        (temp/"summary.json").write_text(stable_json(summary),encoding="utf-8"); temp.rename(root)
    except Exception:
        shutil.rmtree(temp,ignore_errors=True); raise
    return {"mode":"FAME_NEURAL_P3_CONTROLLED_BASELINE_COMPLETE","runId":RUN_ID,"records":len(rows),"freshOwnedBeatFamiliesConsumed":0,"sourceSeparationExecutedByThisCommand":False,"retuningPerformedByThisCommand":False,"trainingAuthorized":False,"batch131Authorized":False,"taskDataReadyMayBeDeclared":False,"summaryFile":str(root/"summary.json"),"results":rows,"nextAction":"REVIEW_CONTROLLED_CASES_AND_LOCALIZE_FIRST_FAILURE_LEVEL_BEFORE_REAL_EASY_BEATS"}

def self_test():
    refs=[{"timeSeconds":.5,"role":"kick"},{"timeSeconds":.5,"role":"snare"}]; est=[{"timeSeconds":.512,"role":"kick"},{"timeSeconds":.490,"role":"snare"}]
    dm=drum_metrics(refs,est,.03)
    if dm["f1"]!=1.0 or dm["tp"]!=2: raise RuntimeError("Drum simultaneous matching self-test failed")
    if drum_metrics(refs,[{"timeSeconds":.55,"role":"kick"}],.03)["tp"]!=0: raise RuntimeError("Drum tolerance self-test failed")
    low_refs=[{"startSeconds":.5,"endSeconds":1.5,"midiNote":45}]; cfg={"onsetToleranceSeconds":.05,"pitchToleranceCents":50.0,"offsetRatio":.2,"offsetMinimumSeconds":.05}
    if lowend_metrics(low_refs,[{"startSeconds":.53,"endSeconds":1.66,"midiNote":45}],cfg)["f1"]!=1.0: raise RuntimeError("Low-end matching self-test failed")
    if lowend_metrics(low_refs,[{"startSeconds":.53,"endSeconds":1.75,"midiNote":45}],cfg)["f1"]!=0.0: raise RuntimeError("Low-end offset tolerance self-test failed")
    return {"mode":"FAME_NEURAL_P3_CONTROLLED_BASELINE_SELF_TEST_PASS","drumSimultaneousMatches":2,"drumPrimaryToleranceSeconds":.03,"lowEndOnsetToleranceSeconds":.05,"lowEndOffsetRatio":.2}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("command",choices=["self-test","execute"]); ap.add_argument("workspace",nargs="?"); a=ap.parse_args()
    result=self_test() if a.command=="self-test" else execute(a.workspace) if a.workspace else (_ for _ in ()).throw(RuntimeError("execute requires workspace"))
    print(stable_json(result),end="")
if __name__=="__main__":
    try: main()
    except Exception as exc: print(f"FAME NEURAL P3 CONTROLLED BASELINE FAILED: {exc}",file=sys.stderr); raise SystemExit(1)
