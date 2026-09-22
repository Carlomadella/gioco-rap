#!/usr/bin/env python3
"""P5 candidate: independent multi-label spectral drum onset detectors."""
import argparse
import json
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
RUN_ID="audio-to-midi-p5-multilabel-spectral-v1-001"
CANDIDATE_ID="drums-independent-multilabel-spectral-v1"

ROLE_TO_NOTE={"kick":36,"snare":38,"hihat":42}
ROLE_TO_BAND={"kick":"low","snare":"mid","hihat":"high"}

def run_root(workspace):
    return Path(workspace).resolve()/"runs"/"audio-to-midi-p5-multilabel-spectral"/RUN_ID

def p3_root(workspace):
    return Path(workspace).resolve()/"runs"/"audio-to-midi-p3-controlled-baseline"/P3_RUN_ID

def validate_p5_protocol():
    p=read_json(P5_PROTOCOL_FILE)
    if p.get("schema")!="fame-owned-beats-audio-to-midi-p5-drums-comparison-v1" or p.get("version")!=1:
        raise RuntimeError("Unsupported P5 comparison protocol")
    if p.get("status")!="FROZEN_BEFORE_FIRST_P5_VARIANT_RESULT":
        raise RuntimeError("P5 comparison protocol is not frozen")
    candidate=next((x for x in p.get("candidates",[]) if x.get("id")==CANDIDATE_ID),None)
    if not candidate:
        raise RuntimeError("P5 multilabel candidate missing from protocol")
    freeze=candidate.get("implementationFreeze",{})
    if freeze.get("classBandMapping")!=ROLE_TO_BAND:
        raise RuntimeError("P5 class-band mapping mismatch")
    if freeze.get("newLearnedParameters")!=0 or freeze.get("newTunedThresholds")!=0:
        raise RuntimeError("P5 candidate must not introduce learned/tuned parameters")
    return p

def band_flux_envelope(y,sr,hop,n_fft,lo,hi):
    spectrum=np.abs(librosa.stft(y=y,n_fft=n_fft,hop_length=hop,win_length=n_fft,center=True)).astype(np.float64)
    freqs=librosa.fft_frequencies(sr=sr,n_fft=n_fft)
    mask=(freqs>=float(lo))&(freqs<float(hi))
    if not np.any(mask):
        raise RuntimeError(f"Empty spectral band {lo}-{hi} Hz")
    band=spectrum[mask,:]
    db=librosa.amplitude_to_db(band,ref=np.max)
    env=librosa.onset.onset_strength(
        sr=sr,
        S=db,
        hop_length=hop,
        aggregate=np.median,
        center=True,
        max_size=1,
    )
    return np.asarray(env,dtype=float)

def detect_role(y,role,baseline,dev):
    cfg=dev["drums"]
    sr=int(cfg["decodeSampleRate"])
    hop=int(cfg["hopLength"])
    n_fft=int(cfg["nFft"])
    lo,hi=cfg["spectralBandsHz"][ROLE_TO_BAND[role]]
    env=band_flux_envelope(y,sr,hop,n_fft,lo,hi)
    frames=librosa.onset.onset_detect(
        onset_envelope=env,
        sr=sr,
        hop_length=hop,
        units="frames",
        backtrack=False,
        pre_max=1,
        post_max=1,
        pre_avg=3,
        post_avg=3,
        delta=float(cfg["onset"]["delta"]),
        wait=int(cfg["onset"]["waitFrames"]),
    )
    frames=np.asarray(frames,dtype=int)
    strengths=[float(env[f]) for f in frames if 0<=f<len(env)]
    events=[]
    for f in frames:
        if f<0 or f>=len(env):
            continue
        events.append({
            "timeSeconds":round(float(librosa.frames_to_time(f,sr=sr,hop_length=hop)),6),
            "frame":int(f),
            "role":role,
            "midiNote":ROLE_TO_NOTE[role],
            "velocity":baseline.velocity_map(env[f],strengths),
            "sourceStem":"drums",
            "detector":"independent-band-spectral-flux",
            "bandHz":[float(lo),float(hi)],
            "onsetStrength":round(float(env[f]),6),
        })
    return events,{
        "role":role,
        "bandHz":[float(lo),float(hi)],
        "frames":[int(x) for x in frames],
        "timesSeconds":[round(float(librosa.frames_to_time(x,sr=sr,hop_length=hop)),6) for x in frames],
        "peakCount":len(events),
    }

def transcribe_multilabel(y,baseline,dev):
    events=[]
    diagnostics=[]
    for role in ("kick","snare","hihat"):
        role_events,diag=detect_role(y,role,baseline,dev)
        events.extend(role_events)
        diagnostics.append(diag)
    events.sort(key=lambda x:(float(x["timeSeconds"]),int(x["midiNote"]),x["role"]))
    return events,diagnostics

def controlled_gate(rows):
    by={x["fixtureId"]:x for x in rows}
    required_perfect=[
        "D01_KICK_ISOLATED","D02_SNARE_ISOLATED","D03_HIHAT_ISOLATED",
        "D04_KICK_SNARE_SIMULTANEOUS","D05_KICK_HIHAT_SIMULTANEOUS",
        "D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED",
    ]
    checks=[]
    for fid in required_perfect:
        metric=by[fid]["candidatePrimary30ms"]
        checks.append({
            "fixtureId":fid,
            "pass":metric["precision"]==1.0 and metric["recall"]==1.0 and metric["f1"]==1.0,
            "precision":metric["precision"],
            "recall":metric["recall"],
            "f1":metric["f1"],
        })
    regressions=[]
    for fid in ("D01_KICK_ISOLATED","D03_HIHAT_ISOLATED","D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED"):
        base=by[fid]["baselinePrimary30ms"]
        cand=by[fid]["candidatePrimary30ms"]
        if cand["f1"]<base["f1"]:
            regressions.append(fid)
    return {
        "pass":all(x["pass"] for x in checks) and not regressions,
        "requiredChecks":checks,
        "baselinePassFixtureRegressions":regressions,
        "syntheticOnly":True,
        "promotesCandidate":False,
        "nextIfPass":"FREEZE_REAL_EASY_IDENTITIES_AND_REFERENCES_BEFORE_PAIRED_COMPARISON",
        "nextIfFail":"LOCALIZE_CANDIDATE_FAILURE_WITHOUT_TUNING_ON_CONSUMED_EVALUATION",
    }

def execute(workspace):
    workspace=Path(workspace).resolve()
    p5=validate_p5_protocol()
    fixture_protocol=read_json(FIXTURE_PROTOCOL_FILE)
    dev=read_json(DEV_PROTOCOL_FILE)
    baseline_blob=validate_environment_and_frozen_baseline(dev)
    fixtures_root,manifest,by_id=validate_fixture_manifest(workspace,fixture_protocol)

    old_root=p3_root(workspace)
    old_summary_file=old_root/"summary.json"
    if not old_summary_file.is_file():
        raise RuntimeError("P3 controlled baseline summary missing")
    old_summary=read_json(old_summary_file)
    if old_summary.get("status")!="CONTROLLED_BASELINE_COMPLETE_DIAGNOSTIC_ONLY":
        raise RuntimeError("Unexpected P3 controlled baseline state")
    if old_summary.get("fixtureManifestSha256")!=sha256_file(fixtures_root/"fixture-manifest.json"):
        raise RuntimeError("P3/P5 fixture manifest mismatch")

    baseline=load_module(BASELINE_FILE,"fame_p5_frozen_baseline")
    root=run_root(workspace)
    if root.exists():
        raise RuntimeError(f"Append-only P5 run already exists: {root}")
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
            candidate_events,diagnostics=transcribe_multilabel(y,baseline,dev)
            primary=drum_metrics(ref.get("drumEvents",[]),candidate_events,float(fixture_protocol["metrics"]["drums"]["onsetToleranceSeconds"]))
            secondary=drum_metrics(ref.get("drumEvents",[]),candidate_events,float(fixture_protocol["metrics"]["drums"]["secondaryToleranceSeconds"]))

            old_result=read_json(old_root/fid/"result.json")
            baseline_primary=old_result["drums"]["primary30ms"]

            out=temp/fid
            out.mkdir()
            bpm=float(fixture_protocol["audio"]["bpm"])
            ppq=int(dev["output"]["midiPpq"])
            baseline.write_midi(
                out/"drums-multilabel.mid",
                candidate_events,
                bpm,
                ppq,
                int(dev["output"]["drumChannelZeroBased"]),
                drum=True,
            )
            result={
                "schema":"fame-owned-beats-audio-to-midi-p5-multilabel-spectral-result-v1",
                "version":1,
                "runId":RUN_ID,
                "candidateId":CANDIDATE_ID,
                "fixtureId":fid,
                "factor":fixture["factor"],
                "sourceCondition":"CONTROLLED_CLEAN_STEM_NO_SOURCE_SEPARATION",
                "fixtureHashes":by_id[fid]["files"],
                "diagnostics":{"perRoleDetectors":diagnostics},
                "events":candidate_events,
                "metrics":{"primary30ms":primary,"secondary50ms":secondary},
                "baseline":{"runId":P3_RUN_ID,"primary30ms":baseline_primary},
                "midi":"drums-multilabel.mid",
                "safety":{
                    "freshOwnedBeatFamiliesConsumed":0,
                    "sourceSeparationExecuted":False,
                    "retuningPerformed":False,
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
                "candidateEvents":len(candidate_events),
            })

        gate=controlled_gate(rows)
        summary={
            "schema":"fame-owned-beats-audio-to-midi-p5-multilabel-spectral-summary-v1",
            "version":1,
            "status":"CONTROLLED_COMPARISON_COMPLETE_DIAGNOSTIC_ONLY",
            "runId":RUN_ID,
            "candidateId":CANDIDATE_ID,
            "records":len(rows),
            "fixtureManifestSha256":sha256_file(fixtures_root/"fixture-manifest.json"),
            "p5ProtocolSha256":sha256_file(P5_PROTOCOL_FILE),
            "fixtureProtocolSha256":sha256_file(FIXTURE_PROTOCOL_FILE),
            "developmentProtocolSha256":sha256_file(DEV_PROTOCOL_FILE),
            "frozenBaselineGitBlobSha1":baseline_blob,
            "librosaVersion":librosa.__version__,
            "pythonVersion":sys.version.split()[0],
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
        "mode":"FAME_NEURAL_P5_MULTILABEL_SPECTRAL_CONTROLLED_COMPLETE",
        "runId":RUN_ID,
        "candidateId":CANDIDATE_ID,
        "records":len(rows),
        "controlledGatePass":gate["pass"],
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
    p5=validate_p5_protocol()
    if p5["candidates"][0]["implementationFreeze"]["newTunedThresholds"]!=0:
        raise RuntimeError("Unexpected tuned threshold")
    rows=[]
    for fid in [
        "D01_KICK_ISOLATED","D02_SNARE_ISOLATED","D03_HIHAT_ISOLATED",
        "D04_KICK_SNARE_SIMULTANEOUS","D05_KICK_HIHAT_SIMULTANEOUS",
        "D06_HIHAT_TRIPLETS","D07_KICK_SYNCOPATED",
    ]:
        perfect={"tp":1,"fp":0,"fn":0,"precision":1.0,"recall":1.0,"f1":1.0}
        rows.append({"fixtureId":fid,"baselinePrimary30ms":perfect,"candidatePrimary30ms":perfect})
    rows.append({
        "fixtureId":"D08_UNSUPPORTED_CLAP_RIM",
        "baselinePrimary30ms":{"tp":0,"fp":4,"fn":0,"precision":0.0,"recall":0.0,"f1":0.0},
        "candidatePrimary30ms":{"tp":0,"fp":4,"fn":0,"precision":0.0,"recall":0.0,"f1":0.0},
    })
    gate=controlled_gate(rows)
    if not gate["pass"] or gate["promotesCandidate"] is not False:
        raise RuntimeError("Controlled gate self-test failed")
    return {
        "mode":"FAME_NEURAL_P5_MULTILABEL_SPECTRAL_SELF_TEST_PASS",
        "candidateId":CANDIDATE_ID,
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
        print(f"FAME NEURAL P5 MULTILABEL SPECTRAL FAILED: {exc}",file=sys.stderr)
        raise SystemExit(1)
