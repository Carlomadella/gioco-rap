#!/usr/bin/env python3
"""P5 controlled candidate: transient-level subset selection with NNLS+BIC."""
import argparse
import itertools
import json
import math
import shutil
import sys
import uuid
from pathlib import Path

import librosa
import numpy as np
from scipy.optimize import nnls

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
RUN_ID="audio-to-midi-p5-transient-subset-bic-v1-001"
CANDIDATE_ID="drums-transient-subset-bic-v1"
ROLES=("kick","snare","hihat")
ROLE_TO_NOTE={"kick":36,"snare":38,"hihat":42}

def run_root(workspace):
    return Path(workspace).resolve()/"runs"/"audio-to-midi-p5-transient-subset-bic"/RUN_ID

def p3_root(workspace):
    return Path(workspace).resolve()/"runs"/"audio-to-midi-p3-controlled-baseline"/P3_RUN_ID

def validate_protocol():
    p=read_json(P5_PROTOCOL_FILE)
    if p.get("schema")!="fame-owned-beats-audio-to-midi-p5-drums-comparison-v1" or p.get("version")!=1:
        raise RuntimeError("Unsupported P5 protocol")
    candidate=next((x for x in p.get("candidates",[]) if x.get("id")==CANDIDATE_ID),None)
    if not candidate or candidate.get("status")!="IMPLEMENTATION_FROZEN_BEFORE_FIRST_RESULT":
        raise RuntimeError("Transient subset BIC candidate is not frozen")
    freeze=candidate.get("implementationFreeze",{})
    if freeze.get("subsetSearch")!="all 7 non-empty subsets of kick/snare/hihat":
        raise RuntimeError("Subset search freeze mismatch")
    if freeze.get("amplitudeFit")!="scipy.optimize.nnls":
        raise RuntimeError("NNLS freeze mismatch")
    if freeze.get("newLearnedParameters")!=0 or freeze.get("newTunedThresholds")!=0:
        raise RuntimeError("Candidate must not add learned/tuned parameters")
    return p,candidate

def magnitude_stft(y,n_fft,hop):
    return np.abs(librosa.stft(
        y=y,
        n_fft=int(n_fft),
        hop_length=int(hop),
        win_length=int(n_fft),
        center=True,
    )).astype(np.float64)

def vector_at_frame(V,frame,half_frames):
    lo=max(0,int(frame)-int(half_frames))
    hi=min(V.shape[1],int(frame)+int(half_frames)+1)
    if hi<=lo:
        raise RuntimeError("Empty transient spectral window")
    vector=np.median(V[:,lo:hi],axis=1)
    norm=float(np.linalg.norm(vector))
    if not math.isfinite(norm) or norm<=0:
        raise RuntimeError("Invalid transient spectral vector")
    return vector/norm

def build_templates(fixtures_root,fixture_protocol,baseline,dev,candidate):
    freeze=candidate["implementationFreeze"]
    sr=int(dev["drums"]["decodeSampleRate"])
    hop=int(dev["drums"]["hopLength"])
    n_fft=int(dev["drums"]["nFft"])
    window_seconds=0.08
    half_frames=max(1,int(round((window_seconds/2.0)*sr/hop)))
    protocol_by_id={x["id"]:x for x in fixture_protocol["fixtures"]}
    columns=[]
    metadata=[]
    for role in ROLES:
        fid=freeze["templateSources"][role]
        if fid not in protocol_by_id:
            raise RuntimeError(f"Template fixture missing: {fid}")
        root=fixtures_root/fid
        ref=read_json(root/"reference.json")
        y=baseline.decode_mono_f32(root/"drums.wav",sr)
        V=magnitude_stft(y,n_fft,hop)
        vectors=[]
        for event in ref.get("drumEvents",[]):
            if event.get("role")!=role:
                continue
            frame=int(round(float(event["timeSeconds"])*sr/hop))
            vectors.append(vector_at_frame(V,frame,half_frames))
        if not vectors:
            raise RuntimeError(f"No template events for {role}")
        template=np.median(np.stack(vectors,axis=1),axis=1)
        norm=float(np.linalg.norm(template))
        if not math.isfinite(norm) or norm<=0:
            raise RuntimeError(f"Invalid median template for {role}")
        template=template/norm
        columns.append(template)
        metadata.append({
            "role":role,
            "fixtureId":fid,
            "eventCount":len(vectors),
            "windowSeconds":window_seconds,
            "normalization":"L2",
            "l2Norm":round(float(np.linalg.norm(template)),12),
        })
    return np.stack(columns,axis=1),metadata,half_frames

def subset_models():
    out=[]
    for size in (1,2,3):
        for combo in itertools.combinations(range(3),size):
            out.append(combo)
    return out

def choose_subset(observed,templates):
    eps=1e-12
    n=int(observed.size)
    scored=[]
    for subset in subset_models():
        A=templates[:,subset]
        coeff,residual_norm=nnls(A,observed)
        predicted=A@coeff
        residual=observed-predicted
        rss=float(np.sum(np.square(residual)))
        k=len(subset)
        bic=float(n*math.log(rss/max(n,1)+eps)+k*math.log(max(n,1)))
        scored.append({
            "roles":[ROLES[i] for i in subset],
            "indices":[int(i) for i in subset],
            "coefficients":[float(x) for x in coeff],
            "rss":rss,
            "bic":bic,
            "nnlsResidualNorm":float(residual_norm),
        })
    scored.sort(key=lambda x:(x["bic"],len(x["roles"]),x["roles"]))
    return scored[0],scored

def transcribe(y,baseline,dev,templates,half_frames):
    cfg=dev["drums"]
    sr=int(cfg["decodeSampleRate"])
    hop=int(cfg["hopLength"])
    n_fft=int(cfg["nFft"])
    envelope,frames=baseline.detect_onsets(
        y,sr,hop,cfg["onset"]["delta"],cfg["onset"]["waitFrames"]
    )
    V=magnitude_stft(y,n_fft,hop)
    strengths=[float(envelope[f]) for f in frames if 0<=f<len(envelope)]
    events=[]
    diagnostics=[]
    for frame in frames:
        if frame<0 or frame>=len(envelope):
            continue
        observed=vector_at_frame(V,frame,half_frames)
        winner,models=choose_subset(observed,templates)
        time_seconds=round(float(librosa.frames_to_time(frame,sr=sr,hop_length=hop)),6)
        velocity=baseline.velocity_map(envelope[frame],strengths)
        for role in winner["roles"]:
            events.append({
                "timeSeconds":time_seconds,
                "frame":int(frame),
                "role":role,
                "midiNote":ROLE_TO_NOTE[role],
                "velocity":velocity,
                "sourceStem":"drums",
                "detector":"frozen-baseline-onset+nnls-bic-subset",
            })
        diagnostics.append({
            "frame":int(frame),
            "timeSeconds":time_seconds,
            "selectedRoles":winner["roles"],
            "selectedBic":winner["bic"],
            "models":[
                {
                    "roles":m["roles"],
                    "coefficients":[round(float(x),9) for x in m["coefficients"]],
                    "rss":round(float(m["rss"]),12),
                    "bic":round(float(m["bic"]),9),
                }
                for m in models
            ],
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
        checks.append({
            "fixtureId":fid,
            "pass":passed,
            "precision":metric["precision"],
            "recall":metric["recall"],
            "f1":metric["f1"],
        })
    regressions=[]
    for fid in ("D01_KICK_ISOLATED","D03_HIHAT_ISOLATED","D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED"):
        if by[fid]["candidatePrimary30ms"]["f1"]<by[fid]["baselinePrimary30ms"]["f1"]:
            regressions.append(fid)
    return {
        "pass":all(x["pass"] for x in checks) and not regressions,
        "requiredChecks":checks,
        "baselinePassFixtureRegressions":regressions,
        "mechanicsOnly":True,
        "syntheticTemplateSourceLeakagePresent":True,
        "promotesCandidate":False,
        "nextIfPass":"FREEZE_REAL_TEMPLATE_PROVENANCE_AND_REAL_EASY_REFERENCES_BEFORE_ANY_REAL_BEAT_COMPARISON",
        "nextIfFail":"STOP_CONTROLLED_NONLEARNED_VARIANT_LOOP_AND_REASSESS_REAL_TEMPLATE_OR_LEARNED_MULTI_LABEL_PATH",
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

    baseline=load_module(BASELINE_FILE,"fame_p5_subset_bic_baseline")
    templates,template_metadata,half_frames=build_templates(
        fixtures_root,fixture_protocol,baseline,dev,candidate
    )

    root=run_root(workspace)
    if root.exists():
        raise RuntimeError(f"Append-only P5 subset-BIC run already exists: {root}")
    root.parent.mkdir(parents=True,exist_ok=True)
    temp=root.parent/f".{RUN_ID}.tmp-{uuid.uuid4().hex}"
    temp.mkdir()
    rows=[]
    try:
        for fixture in fixture_protocol["fixtures"]:
            if fixture["domain"]!="drums":
                continue
            fid=fixture["id"]
            src=fixtures_root/fid
            ref=read_json(src/"reference.json")
            y=baseline.decode_mono_f32(src/"drums.wav",int(dev["drums"]["decodeSampleRate"]))
            events,diagnostics=transcribe(y,baseline,dev,templates,half_frames)
            primary=drum_metrics(
                ref.get("drumEvents",[]),
                events,
                float(fixture_protocol["metrics"]["drums"]["onsetToleranceSeconds"])
            )
            secondary=drum_metrics(
                ref.get("drumEvents",[]),
                events,
                float(fixture_protocol["metrics"]["drums"]["secondaryToleranceSeconds"])
            )
            old_result=read_json(old_root/fid/"result.json")
            baseline_primary=old_result["drums"]["primary30ms"]
            out=temp/fid
            out.mkdir()
            baseline.write_midi(
                out/"drums-subset-bic.mid",
                events,
                float(fixture_protocol["audio"]["bpm"]),
                int(dev["output"]["midiPpq"]),
                int(dev["output"]["drumChannelZeroBased"]),
                drum=True,
            )
            result={
                "schema":"fame-owned-beats-audio-to-midi-p5-transient-subset-bic-result-v1",
                "version":1,
                "runId":RUN_ID,
                "candidateId":CANDIDATE_ID,
                "fixtureId":fid,
                "factor":fixture["factor"],
                "sourceCondition":"CONTROLLED_CLEAN_STEM_NO_SOURCE_SEPARATION",
                "templateMetadata":template_metadata,
                "diagnostics":{"transients":diagnostics},
                "events":events,
                "metrics":{"primary30ms":primary,"secondary50ms":secondary},
                "baseline":{"runId":P3_RUN_ID,"primary30ms":baseline_primary},
                "midi":"drums-subset-bic.mid",
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
                "selectedSubsets":[x["selectedRoles"] for x in diagnostics],
            })

        gate=controlled_gate(rows)
        summary={
            "schema":"fame-owned-beats-audio-to-midi-p5-transient-subset-bic-summary-v1",
            "version":1,
            "status":"CONTROLLED_SUBSET_BIC_COMPARISON_COMPLETE_MECHANICS_ONLY",
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
        "mode":"FAME_NEURAL_P5_TRANSIENT_SUBSET_BIC_CONTROLLED_COMPLETE",
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
    t=np.array([
        [1.0,0.0,0.0],
        [0.0,1.0,0.0],
        [0.0,0.0,1.0],
        [0.6,0.2,0.1],
    ],dtype=float)
    t=t/np.linalg.norm(t,axis=0,keepdims=True)
    isolated=t[:,0]
    winner,_=choose_subset(isolated,t)
    if winner["roles"]!=["kick"]:
        raise RuntimeError(f"Subset-BIC isolated self-test failed: {winner['roles']}")
    mixture=t[:,0]+0.8*t[:,1]
    mixture=mixture/np.linalg.norm(mixture)
    winner,_=choose_subset(mixture,t)
    if winner["roles"]!=["kick","snare"]:
        raise RuntimeError(f"Subset-BIC mixture self-test failed: {winner['roles']}")
    return {
        "mode":"FAME_NEURAL_P5_TRANSIENT_SUBSET_BIC_SELF_TEST_PASS",
        "candidateId":CANDIDATE_ID,
        "subsetModels":7,
        "newLearnedParameters":0,
        "newTunedThresholds":0,
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
        print(f"FAME NEURAL P5 TRANSIENT SUBSET BIC FAILED: {exc}",file=sys.stderr)
        raise SystemExit(1)
