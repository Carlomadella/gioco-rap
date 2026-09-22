#!/usr/bin/env python3
"""Read-only environment doctor for the frozen Tsumugi drums_v1_5 candidate."""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC_FILE = HERE / "audio-to-midi-p5-tsumugi-environment-v1.json"

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def sha256_file(path):
    h=hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def git_blob_sha1(path):
    data=Path(path).read_bytes()
    header=f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header+data).hexdigest()

def run_text(args,cwd=None):
    result=subprocess.run(args,cwd=cwd,check=True,capture_output=True,text=True)
    return result.stdout.strip()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source-root",required=True)
    ap.add_argument("--checkpoint",required=True)
    args=ap.parse_args()

    spec=read_json(SPEC_FILE)
    source=Path(args.source_root).resolve()
    checkpoint=Path(args.checkpoint).resolve()

    if not source.is_dir():
        raise RuntimeError(f"Tsumugi source root missing: {source}")
    if not checkpoint.is_file():
        raise RuntimeError(f"Tsumugi checkpoint missing: {checkpoint}")

    head=run_text(["git","rev-parse","HEAD"],cwd=source)
    status=run_text(["git","status","--porcelain"],cwd=source)
    if head != spec["source"]["commit"]:
        raise RuntimeError(f"Tsumugi source HEAD mismatch: {head}")
    if status:
        raise RuntimeError("Tsumugi source checkout is not clean")

    blob_checks={}
    for key,relative,expected in [
        ("license","LICENSE",spec["source"]["licenseGitBlobSha1"]),
        ("pyproject","pyproject.toml",spec["source"]["pyprojectGitBlobSha1"]),
        ("uvLock","uv.lock",spec["source"]["uvLockGitBlobSha1"]),
    ]:
        actual=git_blob_sha1(source/relative)
        if actual!=expected:
            raise RuntimeError(f"Tsumugi {relative} blob mismatch: {actual} != {expected}")
        blob_checks[key]=actual

    checkpoint_bytes=checkpoint.stat().st_size
    checkpoint_sha=sha256_file(checkpoint)
    if checkpoint_bytes!=int(spec["checkpoint"]["bytes"]):
        raise RuntimeError(f"Checkpoint byte size mismatch: {checkpoint_bytes}")
    if checkpoint_sha!=spec["checkpoint"]["sha256"]:
        raise RuntimeError(f"Checkpoint SHA256 mismatch: {checkpoint_sha}")

    sys.path.insert(0,str(source))
    import torch
    import torchaudio
    from instrument_agnostic_amt.amt.modeling.checkpoints import (
        extract_model_config,
        extract_training_args,
        load_checkpoint,
    )
    from instrument_agnostic_amt.amt.cli.infer import MODEL_CHECKPOINT_FILENAMES

    if MODEL_CHECKPOINT_FILENAMES.get("drums_v1_5") != spec["checkpoint"]["filename"]:
        raise RuntimeError("Tsumugi source does not map drums_v1_5 to the frozen checkpoint filename")

    raw=load_checkpoint(checkpoint)
    model_config=extract_model_config(raw)
    training_args=extract_training_args(raw)

    cuda_available=bool(torch.cuda.is_available())
    if not cuda_available:
        raise RuntimeError("CUDA unavailable in frozen Tsumugi environment; no CPU fallback is permitted for this preflight")
    device_name=torch.cuda.get_device_name(0)
    capability=list(torch.cuda.get_device_capability(0))

    selected_fields={}
    for key in [
        "sample_rate","hop_length","n_fft","semi_crf_version",
        "num_instrument_classes","num_pitch_slots","input_audio_channels"
    ]:
        if key in model_config:
            selected_fields[key]=model_config[key]

    out={
        "mode":"FAME_NEURAL_TSUMUGI_ENVIRONMENT_DOCTOR_PASS",
        "candidateId":spec["candidateId"],
        "source":{
            "root":str(source),
            "head":head,
            "clean":True,
            "blobChecks":blob_checks,
        },
        "checkpoint":{
            "path":str(checkpoint),
            "bytes":checkpoint_bytes,
            "sha256":checkpoint_sha,
            "modelRepoRevision":spec["checkpoint"]["revision"],
        },
        "python":{
            "version":sys.version.split()[0],
            "executable":sys.executable,
        },
        "torch":{
            "version":torch.__version__,
            "torchaudioVersion":torchaudio.__version__,
            "cudaAvailable":cuda_available,
            "cudaVersion":torch.version.cuda,
            "deviceName":device_name,
            "deviceCapability":capability,
        },
        "checkpointMetadata":{
            "modelConfig":selected_fields,
            "trainingArgsKeys":sorted(training_args.keys()),
        },
        "sourceAudioOpenedByThisCommand":False,
        "fixtureAudioOpenedByThisCommand":False,
        "transcriptionExecutedByThisCommand":False,
        "sourceSeparationExecutedByThisCommand":False,
        "trainingAuthorized":False,
        "batch131Authorized":False,
        "taskDataReadyMayBeDeclared":False,
    }
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAME NEURAL TSUMUGI ENVIRONMENT DOCTOR FAILED: {exc}",file=sys.stderr)
        raise SystemExit(1)
