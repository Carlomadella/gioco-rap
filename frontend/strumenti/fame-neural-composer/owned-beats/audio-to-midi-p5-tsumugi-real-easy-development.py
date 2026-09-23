#!/usr/bin/env python3
"""Append-only Tsumugi diagnostic on three already-consumed clear development drums stems."""
from __future__ import annotations
import argparse
from collections import Counter
from dataclasses import replace
import hashlib
import json
import shutil
import sys
import uuid
from pathlib import Path
from types import SimpleNamespace

HERE=Path(__file__).resolve().parent
PROTOCOL_FILE=HERE/"audio-to-midi-p5-tsumugi-real-easy-development-v1.json"
CONTROLLED_PROTOCOL_FILE=HERE/"audio-to-midi-p5-tsumugi-controlled-protocol-v1.json"
ENV_SPEC_FILE=HERE/"audio-to-midi-p5-tsumugi-environment-v1.json"

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def stable_json(value):
    return json.dumps(value,ensure_ascii=False,indent=2,sort_keys=False)+"\n"

def sha256_file(path):
    h=hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def validate_protocol(protocol,controlled,env_spec):
    if protocol.get("status")!="FROZEN_BEFORE_FIRST_TSUMUGI_REAL_EASY_STEM_ACCESS":
        raise RuntimeError("Real-easy protocol is not frozen")
    if protocol.get("candidateId")!=controlled.get("candidateId") or protocol.get("candidateId")!=env_spec.get("candidateId"):
        raise RuntimeError("Candidate identity mismatch")
    if protocol.get("sourceControlledRunId")!=controlled.get("runId"):
        raise RuntimeError("Controlled run identity mismatch")
    rows=protocol.get("selectedDevelopmentRecords") or []
    ids=[row.get("sourceRecordId") for row in rows]
    if ids!=["FAME000040","FAME000080","FAME000126"]:
        raise RuntimeError("Frozen development identities changed")
    if any(int(row.get("priorHumanDrumsUsefulness",-1))!=3 for row in rows):
        raise RuntimeError("Frozen real-easy selection no longer has usefulness 3")
    policy=protocol.get("selectionPolicy") or {}
    if policy.get("noTsumugiOutputUsedForSelection") is not True:
        raise RuntimeError("Real-easy selection is not independent of Tsumugi output")
    if int(policy.get("freshIndependentEvaluationFamiliesConsumed",-1))!=0:
        raise RuntimeError("Independent evaluation consumption is forbidden")
    inf=protocol.get("inference") or {}
    if inf.get("reuseControlledInferenceSettings") is not True:
        raise RuntimeError("Controlled inference settings must be reused")
    if inf.get("expectedSemiCrfVersion")!="v1" or int(inf.get("expectedNumPitchSlots",-1))!=1:
        raise RuntimeError("Frozen checkpoint head contract changed")
    safety=protocol.get("safety") or {}
    required_false=[
        "originalSourceAudioAccessAllowed","independentEvaluationAccessAllowed",
        "finalHoldoutAccessAllowed","sourceSeparationExecutionAllowed","retuningAllowed",
        "trainingAuthorized","p6Authorized","batch131Authorized","taskDataReadyMayBeDeclared"
    ]
    if any(safety.get(key) is not False for key in required_false):
        raise RuntimeError("Unsafe real-easy protocol")
    return ids

def validate_source_separation(workspace,protocol):
    ss=protocol["sourceSeparation"]
    root=workspace/"runs"/"source-separation-development-inference"/ss["runId"]
    receipt_file=root/"execution-receipt.json"
    summary_file=root/"inference-summary.json"
    review_file=workspace/"reviews"/"source-separation-development"/ss["reviewId"]/"report.json"
    for file in (receipt_file,summary_file,review_file):
        if not file.is_file():
            raise RuntimeError(f"Required Source Separation artifact missing: {file}")
    receipt=read_json(receipt_file)
    summary=read_json(summary_file)
    review=read_json(review_file)
    if receipt.get("status")!="AUTHORIZED_NO_INFERENCE":
        raise RuntimeError("Unexpected Source Separation receipt status")
    if receipt.get("safety",{}).get("split")!="development" or receipt.get("safety",{}).get("finalHoldoutExcluded") is not True:
        raise RuntimeError("Source Separation split safety mismatch")
    if summary.get("status")!="INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA" or summary.get("technicalValidationPassed") is not True:
        raise RuntimeError("Source Separation technical evidence is not valid")
    if review.get("reviewId")!=ss["reviewId"] or review.get("records")!=8:
        raise RuntimeError("Source Separation review identity mismatch")
    if review.get("packageDigestSha256")!=ss["packageDigestSha256"] or review.get("submissionDigestSha256")!=ss["submissionDigestSha256"]:
        raise RuntimeError("Source Separation review digest mismatch")
    if review.get("gate",{}).get("pass") is not True or review.get("gate",{}).get("outcome")!=ss["requiredOutcome"]:
        raise RuntimeError("Source Separation human gate no longer matches frozen evidence")

    selected=set(row["sourceRecordId"] for row in protocol["selectedDevelopmentRecords"])
    by_id={}
    for source in receipt.get("sources") or []:
        rid=source.get("sourceRecordId")
        if rid not in selected:
            continue
        result_file=root/"results"/f"{rid}.json"
        if not result_file.is_file():
            raise RuntimeError(f"Source Separation result missing: {rid}")
        result=read_json(result_file)
        stem=root/Path(source["outputRelativePath"])/"drums.wav"
        expected=(result.get("adapterResult") or {}).get("stems",{}).get("drums",{}).get("sha256")
        if not stem.is_file() or sha256_file(stem)!=expected:
            raise RuntimeError(f"Frozen drums stem SHA mismatch: {rid}")
        by_id[rid]={
            "stem":stem,
            "stemSha256":expected,
            "compositionFamilyId":source.get("compositionFamilyId")
        }
    if set(by_id)!=selected:
        raise RuntimeError(f"Selected development stem coverage mismatch: {sorted(by_id)}")
    return by_id

def map_note(note,sample_rate,controlled):
    aliases={int(k):int(v) for k,v in controlled["drumPitchPolicy"]["aliasesBeforeScoring"].items()}
    raw=int(note.pitch)
    canonical=aliases.get(raw,raw)
    role=None
    for candidate,pitches in controlled["drumPitchPolicy"]["supportedRoleMapping"].items():
        if canonical in [int(x) for x in pitches]:
            role=candidate
            break
    if role is None:
        role=f"unsupported_pitch_{canonical}"
    return {
        "timeSeconds":round(float(note.start_sample)/float(sample_rate),6),
        "endSeconds":round(float(note.end_sample)/float(sample_rate),6),
        "durationSeconds":round(max(0.0,float(note.end_sample-note.start_sample)/float(sample_rate)),6),
        "role":role,
        "rawPitch":raw,
        "canonicalPitch":canonical,
        "velocity":int(note.velocity),
        "instrumentId":int(note.instrument_id),
        "slotIndex":int(note.slot_index),
        "hasOnset":bool(note.has_onset),
        "hasOffset":bool(note.has_offset)
    }

def execute(workspace):
    workspace=Path(workspace).resolve()
    protocol=read_json(PROTOCOL_FILE)
    controlled=read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec=read_json(ENV_SPEC_FILE)
    ids=validate_protocol(protocol,controlled,env_spec)
    sources=validate_source_separation(workspace,protocol)

    source_root=workspace/env_spec["workspace"]["sourceRelativePath"]
    checkpoint=workspace/env_spec["workspace"]["checkpointRelativePath"]
    if not source_root.is_dir() or not checkpoint.is_file():
        raise RuntimeError("Frozen Tsumugi source/checkpoint missing")
    if sha256_file(checkpoint)!=env_spec["checkpoint"]["sha256"]:
        raise RuntimeError("Frozen Tsumugi checkpoint SHA mismatch")

    sys.path.insert(0,str(source_root))
    import torch
    from instrument_agnostic_amt.amt.cli.infer import load_model,resolve_inference_settings,resolve_instrument_id
    from instrument_agnostic_amt.amt.inference.audio import load_audio
    from instrument_agnostic_amt.amt.inference.windowed import decode_notes
    from instrument_agnostic_amt.amt.inference.midi import build_midi

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; CPU fallback forbidden")
    if torch.cuda.get_device_name(0)!=env_spec["observedPreflight"]["deviceName"]:
        raise RuntimeError("CUDA device identity changed since preflight")
    device=torch.device("cuda")
    model,model_config,training_args=load_model(checkpoint,device=device)
    if str(model_config.semi_crf_version)!="v1" or int(model_config.num_pitch_slots)!=1:
        raise RuntimeError("Checkpoint no longer matches frozen V1 head contract")

    frozen=controlled["inference"]
    drum_id=int(resolve_instrument_id(frozen["instrumentFilter"]))
    args=SimpleNamespace(
        window_ms=None,stride_ms=None,semi_crf_track_batch_size=None,
        window_batch_size=int(frozen["windowBatchSize"]),
        merge_gap_ms=frozen["mergeGapMs"],
        merge_onset_ms=float(frozen["mergeOnsetMs"]),
        silence_gate_rms_dbfs=float(frozen["silenceGateRmsDbfs"]),
        note_bias=float(frozen["noteBias"]),
        disable_tqdm=True,
        no_boundary_head=not bool(frozen["useBoundaryHead"]),
        semi_crf_backend=str(frozen["semiCrfBackend"]),
        semi_crf_sparse_decode=bool(frozen["semiCrfSparseDecode"]),
        semi_crf_sparse_topk_per_start=16,
        semi_crf_sparse_score_threshold=None,
        semi_crf_sparse_max_span_ms=None,
        instrument_pair_infer_topk=int(frozen["instrumentPairInferTopk"]),
        instrument_pair_gate_threshold=float(frozen["instrumentPairGateThreshold"]),
        instrument_pair_max_pairs=int(frozen["instrumentPairMaxPairs"])
    )
    settings=resolve_inference_settings(model_config,training_args,args)
    settings=replace(settings,allowed_instrument_ids=(drum_id,))

    run_root=workspace/"runs"/"audio-to-midi-p5-tsumugi-real-easy-development"/protocol["runId"]
    if run_root.exists():
        raise RuntimeError(f"Append-only real-easy run already exists: {run_root}")
    run_root.parent.mkdir(parents=True,exist_ok=True)
    temp=run_root.parent/f".{protocol['runId']}.tmp-{uuid.uuid4().hex}"
    temp.mkdir()
    rows=[]
    try:
        for rid in ids:
            waveform=load_audio(sources[rid]["stem"],target_sample_rate=int(model_config.sample_rate))
            notes,stats=decode_notes(
                model,model_config,waveform,
                instrument_filter_id=drum_id,device=device,
                amp_enabled=False,amp_dtype=torch.float32,settings=settings,
                velocity=int(frozen["velocity"]),forward_model=None
            )
            events=[map_note(note,int(model_config.sample_rate),controlled) for note in notes]
            events.sort(key=lambda x:(float(x["timeSeconds"]),int(x["canonicalPitch"]),int(x["slotIndex"])))
            role_counts={role:sum(1 for e in events if e["role"]==role) for role in ("kick","snare","hihat")}
            unsupported=[e for e in events if str(e["role"]).startswith("unsupported_pitch_")]
            unsupported_counts=dict(sorted(Counter(int(e["canonicalPitch"]) for e in unsupported).items()))

            family_dir=temp/rid
            family_dir.mkdir()
            midi,midi_stats=build_midi(
                notes,sample_rate=int(model_config.sample_rate),instrument_id=drum_id,
                min_midi_note_ms=float(frozen["minMidiNoteMs"]),
                max_midi_melodic_instruments=0,instrument_volumes=None,
                drum_pitch_aliases={int(k):int(v) for k,v in controlled["drumPitchPolicy"]["aliasesBeforeScoring"].items()},
                return_stats=True
            )
            midi_file=family_dir/"tsumugi-drums-v1_5.mid"
            midi.write(str(midi_file))

            result={
                "schema":"fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-development-result-v1",
                "version":1,"runId":protocol["runId"],"candidateId":protocol["candidateId"],
                "sourceRecordId":rid,"compositionFamilyId":sources[rid]["compositionFamilyId"],
                "input":{
                    "condition":"ALREADY_CONSUMED_DEVELOPMENT_SOURCE_SEPARATION_DRUMS_STEM",
                    "drumsStemSha256":sources[rid]["stemSha256"],
                    "originalSourceAudioOpened":False
                },
                "resolvedInferenceSettings":{
                    "sampleRate":int(model_config.sample_rate),
                    "semiCrfVersion":str(model_config.semi_crf_version),
                    "numPitchSlots":int(model_config.num_pitch_slots),
                    "windowMs":int(settings.window_ms),"strideMs":int(settings.stride_ms),
                    "trackBatchSize":int(settings.track_batch_size),
                    "windowBatchSize":int(settings.window_batch_size),
                    "noteBias":float(settings.note_bias),
                    "semiCrfBackend":str(settings.semi_crf_backend),
                    "drumInstrumentId":drum_id,"device":"cuda","ampEnabled":False,"compileEnabled":False
                },
                "decoderStats":{
                    **stats,
                    "selectedPairCountMeaning":"PITCH_SLOT_TRACK_COUNT_V1",
                    "selectedPairCountIsGateConfidenceEvidence":False
                },
                "rawPredictedNoteCount":len(notes),"roleCounts":role_counts,
                "unsupportedOutputPitchCount":len(unsupported),
                "unsupportedOutputPitchCounts":unsupported_counts,
                "events":events,
                "midi":{"relativePath":"tsumugi-drums-v1_5.mid","sha256":sha256_file(midi_file),"stats":midi_stats},
                "safety":{
                    "split":"development","reusedAlreadyConsumedDevelopmentFamily":True,
                    "originalSourceAudioOpened":False,"independentEvaluationAccessed":False,
                    "finalHoldoutAccessed":False,"sourceSeparationExecuted":False,
                    "retuningPerformed":False,"trainingAuthorized":False,"p6Authorized":False,
                    "batch131Authorized":False,"taskDataReadyMayBeDeclared":False
                }
            }
            result_file=family_dir/"result.json"
            result_file.write_text(stable_json(result),encoding="utf-8")
            rows.append({
                "sourceRecordId":rid,"compositionFamilyId":sources[rid]["compositionFamilyId"],
                "drumsStemSha256":sources[rid]["stemSha256"],
                "rawPredictedNoteCount":len(notes),"roleCounts":role_counts,
                "unsupportedOutputPitchCount":len(unsupported),
                "decodedIntervalCount":int(stats.get("decoded_interval_count") or 0),
                "resultSha256":sha256_file(result_file),"midiSha256":sha256_file(midi_file)
            })

        summary={
            "schema":"fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-development-summary-v1",
            "version":1,
            "status":"REAL_EASY_DEVELOPMENT_DIAGNOSTIC_COMPLETE_AWAITING_HUMAN_REVIEW",
            "runId":protocol["runId"],"candidateId":protocol["candidateId"],"records":len(rows),
            "protocolSha256":sha256_file(PROTOCOL_FILE),
            "controlledProtocolSha256":sha256_file(CONTROLLED_PROTOCOL_FILE),
            "environmentSpecSha256":sha256_file(ENV_SPEC_FILE),
            "results":rows,
            "safety":{
                "split":"development","reusedDevelopmentFamilies":len(rows),
                "freshIndependentEvaluationFamiliesConsumed":0,
                "originalSourceAudioOpenedByThisCommand":False,
                "developmentDrumsStemAudioOpenedByThisCommand":True,
                "independentEvaluationAccessedByThisCommand":False,
                "finalHoldoutAccessedByThisCommand":False,
                "sourceSeparationExecutedByThisCommand":False,
                "retuningPerformedByThisCommand":False,
                "trainingAuthorized":False,"p6Authorized":False,
                "batch131Authorized":False,"taskDataReadyMayBeDeclared":False
            },
            "automaticPromotion":False,"humanReviewRequired":True,
            "nextAction":"PREPARE_HUMAN_REVIEW_OF_3_REAL_EASY_DEVELOPMENT_OUTPUTS"
        }
        (temp/"summary.json").write_text(stable_json(summary),encoding="utf-8")
        temp.rename(run_root)
    except Exception:
        shutil.rmtree(temp,ignore_errors=True)
        raise

    return {
        "mode":"FAME_NEURAL_P5_TSUMUGI_REAL_EASY_DEVELOPMENT_COMPLETE",
        "runId":protocol["runId"],"candidateId":protocol["candidateId"],"records":len(rows),
        "reusedDevelopmentFamilies":len(rows),"freshIndependentEvaluationFamiliesConsumed":0,
        "originalSourceAudioOpenedByThisCommand":False,
        "developmentDrumsStemAudioOpenedByThisCommand":True,
        "independentEvaluationAccessedByThisCommand":False,
        "finalHoldoutAccessedByThisCommand":False,
        "sourceSeparationExecutedByThisCommand":False,"retuningPerformedByThisCommand":False,
        "trainingAuthorized":False,"p6Authorized":False,"batch131Authorized":False,
        "taskDataReadyMayBeDeclared":False,
        "summaryFile":str(run_root/"summary.json"),
        "nextAction":"PREPARE_HUMAN_REVIEW_OF_3_REAL_EASY_DEVELOPMENT_OUTPUTS"
    }

def self_test():
    protocol=read_json(PROTOCOL_FILE)
    controlled=read_json(CONTROLLED_PROTOCOL_FILE)
    env_spec=read_json(ENV_SPEC_FILE)
    ids=validate_protocol(protocol,controlled,env_spec)
    return {
        "mode":"FAME_NEURAL_P5_TSUMUGI_REAL_EASY_DEVELOPMENT_SELF_TEST_PASS",
        "records":len(ids),"sourceRecordIds":ids,"candidateId":protocol["candidateId"],
        "expectedSemiCrfVersion":protocol["inference"]["expectedSemiCrfVersion"],
        "freshIndependentEvaluationFamiliesConsumed":0,
        "originalSourceAudioOpenedByThisCommand":False,
        "developmentStemAudioOpenedByThisCommand":False,
        "transcriptionExecutedByThisCommand":False,
        "retuningPerformedByThisCommand":False,"trainingAuthorized":False
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
            ap.error("workspace is required for execute")
        out=execute(args.workspace)
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL TSUMUGI REAL-EASY DEVELOPMENT FAILED: {exc}",file=sys.stderr)
        raise SystemExit(1)
