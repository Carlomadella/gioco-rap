#!/usr/bin/env python3
import hashlib
import importlib.metadata as metadata
import json
import pathlib
import platform
import sys

def sha256_file(path):
    h = hashlib.sha256()
    with pathlib.Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    import basic_pitch
    from basic_pitch import ICASSP_2022_MODEL_PATH, ONNX_PRESENT, TF_PRESENT, TFLITE_PRESENT, CT_PRESENT

    model = pathlib.Path(ICASSP_2022_MODEL_PATH).resolve()
    if not model.is_file():
        raise RuntimeError(f"Basic Pitch packaged model missing: {model}")

    package_version = metadata.version("basic-pitch")
    onnx_version = metadata.version("onnxruntime") if ONNX_PRESENT else None

    payload = {
        "schema": "fame-owned-beats-basic-pitch-environment-doctor-v1",
        "version": 1,
        "python": {
            "version": platform.python_version(),
            "majorMinor": f"{sys.version_info.major}.{sys.version_info.minor}",
            "executable": sys.executable,
        },
        "basicPitch": {
            "version": package_version,
            "onnxPresent": bool(ONNX_PRESENT),
            "tensorflowPresent": bool(TF_PRESENT),
            "tflitePresent": bool(TFLITE_PRESENT),
            "coremlPresent": bool(CT_PRESENT),
        },
        "runtime": {
            "selectedBackend": "ONNX" if ONNX_PRESENT and model.suffix.lower() == ".onnx" else "OTHER",
            "onnxRuntimeVersion": onnx_version,
        },
        "model": {
            "path": str(model),
            "filename": model.name,
            "bytes": model.stat().st_size,
            "sha256": sha256_file(model),
        },
        "sourceAudioOpenedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "batch131AccessedByThisCommand": False,
        "trainingAuthorized": False,
    }
    print(json.dumps(payload, indent=2))

if __name__ == "__main__":
    main()
