#!/usr/bin/env python3
"""P5 controlled fixed-template PF-NMF mechanics candidate."""
import argparse
import json
import math
import shutil
import sys
import uuid
from pathlib import Path

import librosa
import numpy as np

from audio_to_midi_p3_metrics import drum_metrics
from audio_to_midi_p3_runtime import (
    FIXTURE_PROTOCOL_FILE,
    DEV_PROTOCOL_FILE,
    BASELINE_FILE,
    stable_json,
    read_json,
    sha256_file,
    load_module,
    validate_environment_and_frozen_baseline,
    validate_fixture_manifest,
)

HERE=Path(__file__).resolve().parent
P5_PROTOCOL_FILE=HERE/"audio-to-midi-p5-drums-comparison-v1.json"
P3_RUN_ID="audio-to-midi-p3-controlled-baseline-v1-001"
RUN_ID="audio-to-midi-p5-pfnmf-template-v1-001"
CANDIDATE_ID="drums-pfnmf-template-activation-v1"
ROLES=("kick","snare","hihat")
ROLE_TO_NOTE={"kick":36,"snare":38,"hihat":42}

def run_root(workspace):
    return Path(workspace).resolve()/"runs"/"audio-to-midi-p5-pfnmf-template"/RUN_ID

def p3_root(workspace):
    return Path(workspace).resolve()/"runs"/"audio-to-midi-p3-controlled-baseline"/P3_RUN_ID

def validate_protocol():
    p=read_json(P5_PROTOCOL_FILE)
    if p.get("schema")!="fame-owned-beats-audio-to-midi-p5-drums-comparison-v1" or p.get("version")!=1:
        raise RuntimeError("Unsupported P5 protocol")
    candidate=next((x for x in p.get("candidates",[]) if x.get("id")==CANDIDATE_ID),None)
    if not candidate or candidate.get("status")!="IMPLEMENTATION_FROZEN_BEFORE_FIRST_RESULT":
        raise RuntimeError("PF-NMF candidate mechanics are not frozen")
    freeze=candidate.get("implementationFreeze",{})
    if freeze.get("factorization",{}).get("harmonicRank")!=0:
        raise RuntimeError("Controlled PF-NMF stage must use rH=0")
    if freeze.get("factorization",{}).get("dictionaryAdaptation") is not False:
        raise RuntimeError("Controlled PF-NMF stage must keep templates fixed")
    if freeze.get("newLearnedParameters")!=0 or freeze.get("tunedOnConsumedEvaluation") is not False:
        raise RuntimeError("PF-NMF controlled candidate safety mismatch")
    return p,candidate

def magnitude_stft(y,n_fft,hop):
    return np.abs(librosa.stft(
        y=y,
        n_fft=int(n_fft),
        hop_length=int(hop),
        win_length=int(n_fft),
        center=True,
    )).astype(np.float64)

def build_templates(fixtures_root,fixture_protocol,baseline,dev,candidate):
    freeze=candidate["implementationFreeze"]
    n_fft=int(dev["drums"]["nFft"])
    hop=int(dev["drums"]["hopLength"])
    sr=int(dev["drums"]["decodeSampleRate"])
    window_seconds=float(freeze["templateConstruction"]["eventWindowSeconds"])
    half_frames=max(1,int(round((window_seconds/2.0)*sr/hop)))
    protocol_by_id={x["id"]:x for x in fixture_protocol["fixtures"]}
    columns=[]
    metadata=[]
    for role in ROLES:
        fid=freeze["templateSources"][role]
        if fid not in protocol_by_id:
            raise RuntimeError(f"Template fixture missing from protocol: {fid}")
        root=fixtures_root/fid
        ref=read_json(root/"reference.json")
        y=baseline.decode_mono_f32(root/"drums.wav",sr)
        V=magnitude_stft(y,n_fft,hop)
        vectors=[]
        for event in ref.get("drumEvents",[]):
            if event.get("role")!=role:
                continue
            frame=int(round(float(event["timeSeconds"])*sr/hop))
            lo=max(0,frame-half_frames)
            hi=min(V.shape[1],frame+half_frames+1)
            if hi<=lo:
                continue
            vectors.append(np.median(V[:,lo:hi],axis=1))
        if not vectors:
            raise RuntimeError(f"No isolated template events for {role}")
        template=np.median(np.stack(vectors,axis=1),axis=1)
        template=np.maximum(template,0.0)
        total=float(np.sum(template))
        if not math.isfinite(total) or total<=0:
            raise RuntimeError(f"Invalid template energy for {role}")
        template=template/total
        columns.append(template)
        metadata.append({
            "role":role,
            "fixtureId":fid,
            "eventCount":len(vectors),
            "eventWindowSeconds":window_seconds,
            "l1Sum":round(float(np.sum(template)),12),
        })
    W=np.stack(columns,axis=1)
    return W,metadata

def kl_cost(V,WH,eps=1e-12):
    return float(np.sum(V*np.log((V+eps)/(WH+eps))-V+WH))

def fixed_kl_nmf(V,W,max_iterations,relative_tolerance):
    eps=1e-12
    projection=np.maximum(W.T@V,eps)
    scale=np.maximum(np.mean(projection,axis=1,keepdims=True),eps)
    H=np.maximum(projection/scale,eps)
    denom=np.maximum(W.T@np.ones_like(V),eps)
    previous=None
    history=[]
    converged=False
    iterations=0
    for iteration in range(1,int(max_iterations)+1):
        WH=np.maximum(W@H,eps)
        H*= (W.T@(V/WH))/denom
        H=np.maximum(H,eps)
        WH=np.maximum(W@H,eps)
        cost=kl_cost(V,WH,eps)
        if not math.isfinite(cost):
            raise RuntimeError("PF-NMF KL cost became non-finite")
        if iteration==1 or iteration%10==0:
            history.append({"iteration":iteration,"klCost":cost})
        if previous is not None:
            rel=abs(previous-cost)/max(abs(previous),eps)
            if rel<=float(relative_tolerance):
                converged=True
                iterations=iteration
                break
        previous=cost
        iterations=iteration
    return H,{
        "iterations":iterations,
        "converged":converged,
        "finalKlCost":history[-1]["klCost"] if history else None,
        "history":history,
    }

def activation_to_events(H,sr,hop,candidate,baseline):
    cfg=candidate["implementationFreeze"]["onsetExtraction"]
    window_frames=max(1,int(round(0.1*sr/hop)))
    offset_fraction=0.12
    events=[]
    diagnostics=[]
    for role_index,role in enumerate(ROLES):
        activation=np.asarray(H[role_index],dtype=float)
        novelty=np.maximum(0.0,np.diff(activation,prepend=0.0))
        global_max=float(np.max(novelty)) if novelty.size else 0.0
        offset=offset_fraction*global_max
        thresholds=np.zeros_like(novelty)
        peaks=[]
        for i in range(len(novelty)):
            lo=max(0,i-window_frames)
            previous=novelty[lo:i]
            med=float(np.median(previous)) if previous.size else 0.0
            thresholds[i]=med+offset
            left=novelty[i-1] if i>0 else -np.inf
            right=novelty[i+1] if i+1<len(novelty) else -np.inf
            if novelty[i]>thresholds[i] and novelty[i]>=left and novelty[i]>right:
                peaks.append(i)
        strengths=[float(novelty[i]) for i in peaks]
        for frame in peaks:
            events.append({
                "timeSeconds":round(float(librosa.frames_to_time(frame,sr=sr,hop_length=hop)),6),
                "frame":int(frame),
                "role":role,
                "midiNote":ROLE_TO_NOTE[role],
                "velocity":baseline.velocity_map(novelty[frame],strengths),
                "sourceStem":"drums",
                "detector":"fixed-template-kl-nmf-activation-difference",
                "activation":round(float(activation[frame]),9),
                "novelty":round(float(novelty[frame]),9),
                "adaptiveThreshold":round(float(thresholds[frame]),9),
            })
        diagnostics.append({
            "role":role,
            "activationFrameCount":len(activation),
            "globalNoveltyMaximum":global_max,
            "thresholdOffset":offset,
            "medianWindowFrames":window_frames,
            "peakCount":len(peaks),
            "peakFrames":[int(x) for x in peaks],
            "peakTimesSeconds":[round(float(librosa.frames_to_time(x,sr=sr,hop_length=hop)),6) for x in peaks],
        })
    events.sort(key=lambda x:(float(x["timeSeconds"]),int(x["midiNote"]),x["role"]))
    return events,diagnostics

def controlled_gate(rows):
    by={x["fixtureId"]:x for x in rows}
    required=[
        "D01_KICK_ISOLATED","D02_SNARE_ISOLATED","D03_HIHAT_ISOLATED",
        "D04_KICK_SNARE_SIMULTANEOUS","D05_KICK_HIHAT_SIMULTANEOUS",
        "D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED",
    ]
    checks=[]
    for fid in required:
        metric=by[fid]["candidatePrimary30ms"]
        passed=metric["precision"]==1.0 and metric["recall"]==1.0 and metric["f1"]==1.0
        checks.append({"fixtureId":fid,"pass":passed,"precision":metric["precision"],"recall":metric["recall"],"f1":metric["f1"]})
    baseline_regressions=[]
    for fid in ("D01_KICK_ISOLATED","D03_HIHAT_ISOLATED","D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED"):
        if by[fid]["candidatePrimary30ms"]["f1"]<by[fid]["baselinePrimary30ms"]["f1"]:
            baseline_regressions.append(fid)
    return {
        "pass":all(x["pass"] for x in checks) and not baseline_regressions,
        "requiredChecks":checks,
        "baselinePassFixtureRegressions":baseline_regressions,
        "syntheticTemplateSourceLeakagePresent":True,
        "mechanicsOnly":True,
        "promotesCandidate":False,
        "nextIfPass":"DESIGN_AUTHORIZED_REAL_TEMPLATE_PROVENANCE_AND_FREEZE_REAL_EASY_REFERENCES_BEFORE_ANY_REAL_BEAT_COMPARISON",
        "nextIfFail":"KEEP_PFNMF_AS_CONTROLLED_NEGATIVE_OR_PARTIAL_RESULT_AND_REASSESS_REPRESENTATION_BEFORE_REAL_EASY",
    }

def execute(workspace):
    workspace=Path(workspace).resolve()
    p5,candidate=validate_protocol()
    fixture_protocol=read_json(FIXTURE_PROTOCOL_FILE)
    dev=read_json(DEV_PROTOCOL_FILE)
    baseline_blob=validate_environment_and_frozen_baseline(dev)
    fixtures_root,manifest,by_id=validate_fixture_manifest(workspace,fixture_protocol)
    old_root=p3_root(workspace)
    old_summary=read_json(old_root/"summary.json")
    if old_summary.get("status")!="CONTROLLED_BASELINE_COMPLETE_DIAGNOSTIC_ONLY":
        raise RuntimeError("P3 controlled baseline missing or invalid")
    if old_summary.get("fixtureManifestSha256")!=sha256_file(fixtures_root/"fixture-manifest.json"):
        raise RuntimeError("P3/P5 fixture manifest mismatch")
    baseline=load_module(BASELINE_FILE,"fame_p5_pfnmf_baseline")
    W,template_metadata=build_templates(fixtures_root,fixture_protocol,baseline,dev,candidate)
    root=run_root(workspace)
    if root.exists():
        raise RuntimeError(f"Append-only P5 PF-NMF run already exists: {root}")
    root.parent.mkdir(parents=True,exist_ok=True)
    temp=root.parent/f".{RUN_ID}.tmp-{uuid.uuid4().hex}"
    temp.mkdir()
    rows=[]
    n_fft=int(dev["drums"]["nFft"])
    hop=int(dev["drums"]["hopLength"])
    sr=int(dev["drums"]["decodeSampleRate"])
    factor=candidate["implementationFreeze"]["factorization"]
    try:
        for fixture in fixture_protocol["fixtures"]:
            if fixture["domain"]!="drums":
                continue
            fid=fixture["id"]
            src=fixtures_root/fid
            ref=read_json(src/"reference.json")
            y=baseline.decode_mono_f32(src/"drums.wav",sr)
            V=magnitude_stft(y,n_fft,hop)
            H,nmf_diag=fixed_kl_nmf(
                V,W,
                factor["maxIterations"],
                factor["relativeCostTolerance"],
            )
            events,activation_diag=activation_to_events(H,sr,hop,candidate,baseline)
            primary=drum_metrics(ref.get("drumEvents",[]),events,float(fixture_protocol["metrics"]["drums"]["onsetToleranceSeconds"]))
            secondary=drum_metrics(ref.get("drumEvents",[]),events,float(fixture_protocol["metrics"]["drums"]["secondaryToleranceSeconds"]))
            old_result=read_json(old_root/fid/"result.json")
            baseline_primary=old_result["drums"]["primary30ms"]
            out=temp/fid
            out.mkdir()
            baseline.write_midi(
                out/"drums-pfnmf.mid",
                events,
                float(fixture_protocol["audio"]["bpm"]),
                int(dev["output"]["midiPpq"]),
                int(dev["output"]["drumChannelZeroBased"]),
                drum=True,
            )
            result={
                "schema":"fame-owned-beats-audio-to-midi-p5-pfnmf-template-result-v1",
                "version":1,
                "runId":RUN_ID,
                "candidateId":CANDIDATE_ID,
                "fixtureId":fid,
                "factor":fixture["factor"],
                "sourceCondition":"CONTROLLED_CLEAN_STEM_NO_SOURCE_SEPARATION",
                "templateMetadata":template_metadata,
                "nmfDiagnostics":nmf_diag,
                "activationDiagnostics":activation_diag,
                "events":events,
                "metrics":{"primary30ms":primary,"secondary50ms":secondary},
                "baseline":{"runId":P3_RUN_ID,"primary30ms":baseline_primary},
                "midi":"drums-pfnmf.mid",
                "safety":{
                    "freshOwnedBeatFamiliesConsumed":0,
                    "sourceSeparationExecuted":False,
                    "retuningPerformed":False,
                    "consumedEvaluationFamiliesUsedForTuning":0,
                    "trainingAuthorized":False,
                    "batch131Authorized":False,
                    "taskDataReadyMayBeDeclared":False
                }
            }
            result_file=out/"result.json"
            result_file.write_text(stable_json(result),encoding="utf-8")
            rows.append({
                "fixtureId":fid,
                "factor":fixture["factor"],
                "resultSha256":sha256_file(result_file),
                "baselinePrimary30ms":baseline_primary,
                "candidatePrimary30ms":primary,
                "candidateSecondary50ms":secondary,
                "candidateEvents":len(events),
                "nmfIterations":nmf_diag["iterations"],
                "nmfConverged":nmf_diag["converged"],
            })
        gate=controlled_gate(rows)
        summary={
            "schema":"fame-owned-beats-audio-to-midi-p5-pfnmf-template-summary-v1",
            "version":1,
            "status":"CONTROLLED_PFNMF_COMPARISON_COMPLETE_MECHANICS_ONLY",
            "runId":RUN_ID,
            "candidateId":CANDIDATE_ID,
            "records":len(rows),
            "fixtureManifestSha256":sha256_file(fixtures_root/"fixture-manifest.json"),
            "p5ProtocolSha256":sha256_file(P5_PROTOCOL_FILE),
            "fixtureProtocolSha256":sha256_file(FIXTURE_PROTOCOL_FILE),
            "developmentProtocolSha256":sha256_file(DEV_PROTOCOL_FILE),
            "frozenBaselineGitBlobSha1":baseline_blob,
            "templateMetadata":template_metadata,
            "results":rows,
            "controlledGate":gate,
            "safety":{
                "freshOwnedBeatFamiliesConsumed":0,
                "sourceSeparationExecuted":False,
                "retuningPerformed":False,
                "consumedEvaluationFamiliesUsedForTuning":0,
                "trainingAuthorized":False,
                "batch131Authorized":False,
                "taskDataReadyMayBeDeclared":False
            },
            "nextAction":gate["nextIfPass"] if gate["pass"] else gate["nextIfFail"]
        }
        (temp/"summary.json").write_text(stable_json(summary),encoding="utf-8")
        temp.rename(root)
    except Exception:
        shutil.rmtree(temp,ignore_errors=True)
        raise
    return {
        "mode":"FAME_NEURAL_P5_PFNMF_CONTROLLED_COMPLETE",
        "runId":RUN_ID,
        "candidateId":CANDIDATE_ID,
        "records":len(rows),
        "controlledGatePass":gate["pass"],
        "mechanicsOnly":True,
        "syntheticTemplateSourceLeakagePresent":True,
        "freshOwnedBeatFamiliesConsumed":0,
        "sourceSeparationExecutedByThisCommand":False,
        "retuningPerformedByThisCommand":False,
        "consumedEvaluationFamiliesUsedForTuning":0,
        "trainingAuthorized":False,
        "batch131Authorized":False,
        "taskDataReadyMayBeDeclared":False,
        "summaryFile":str(root/"summary.json"),
        "results":rows,
        "nextAction":summary["nextAction"],
    }

def self_test():
    p5,candidate=validate_protocol()
    freeze=candidate["implementationFreeze"]
    if freeze["onsetExtraction"]["adaptiveThreshold"]!="median of previous 0.1 seconds + 0.12 * global novelty maximum":
        raise RuntimeError("PF-NMF threshold freeze mismatch")
    V=np.array([[2.0,0.0,1.0],[0.0,2.0,1.0]],dtype=float)
    W=np.array([[1.0,0.0],[0.0,1.0]],dtype=float)
    H,diag=fixed_kl_nmf(V,W,50,1e-8)
    if H.shape!=(2,3) or not np.isfinite(H).all() or np.argmax(H[:,0])!=0 or np.argmax(H[:,1])!=1:
        raise RuntimeError("Fixed KL-NMF self-test failed")
    if not math.isfinite(diag["finalKlCost"]):
        raise RuntimeError("Fixed KL-NMF cost invalid")
    return {
        "mode":"FAME_NEURAL_P5_PFNMF_SELF_TEST_PASS",
        "candidateId":CANDIDATE_ID,
        "harmonicRank":0,
        "dictionaryAdaptation":False,
        "newLearnedParameters":0,
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("command",choices=["self-test","execute"])
    ap.add_argument("workspace",nargs="?")
    args=ap.parse_args()
    if args.command=="self-test":
        out=self_test()
    else:
        if not args.workspace:
            raise RuntimeError("execute requires workspace")
        out=execute(args.workspace)
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL P5 PF-NMF FAILED: {exc}",file=sys.stderr)
        raise SystemExit(1)
