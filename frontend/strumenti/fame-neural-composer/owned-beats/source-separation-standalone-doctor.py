#!/usr/bin/env python3
"""FAME Neural Source Separation standalone backend doctor.

Read-only environment probe. It does not open source audio, run inference,
modify Audacity, install packages, or touch the final Audio Analysis holdout.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib
import importlib.metadata
import json
from pathlib import Path
import shutil
import subprocess
import sys

EXPECTED_BIN_SHA256 = "7aa84fa1f2b534bd6865a5609b8b5b028802fe761d6a09b1d30a1564f8fac6f8"
EXPECTED_XML_SHA256 = "304e24325756089d6bb6583171dd1bea2327505e87c6cb6e010afea7463d9f0a"


def sha256_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def package_probe(import_name: str, dist_name: str):
    try:
        module = importlib.import_module(import_name)
    except Exception as exc:
        return {
            "available": False,
            "version": None,
            "importError": f"{type(exc).__name__}: {exc}",
            "module": None,
        }
    try:
        version = importlib.metadata.version(dist_name)
    except Exception:
        version = getattr(module, "__version__", None)
    return {
        "available": True,
        "version": version,
        "importError": None,
        "module": module,
    }


def ffmpeg_probe():
    exe = shutil.which("ffmpeg")
    if not exe:
        return {"available": False, "path": None, "versionLine": None}
    try:
        cp = subprocess.run([exe, "-version"], capture_output=True, text=True, timeout=15)
        first = (cp.stdout or cp.stderr or "").splitlines()[0] if (cp.stdout or cp.stderr) else None
    except Exception as exc:
        first = f"{type(exc).__name__}: {exc}"
    return {"available": True, "path": exe, "versionLine": first}


def serialize_shape(shape):
    try:
        return str(shape)
    except Exception:
        return repr(shape)


def openvino_model_probe(module, xml_path: Path):
    if module is None or not xml_path.is_file():
        return {
            "readable": False,
            "availableDevices": [],
            "inputs": [],
            "outputs": [],
            "error": None,
        }
    try:
        core = module.Core()
        model = core.read_model(str(xml_path))
        inputs = []
        for i, value in enumerate(model.inputs):
            try:
                name = value.get_any_name()
            except Exception:
                name = f"input-{i}"
            inputs.append({
                "index": i,
                "name": name,
                "elementType": str(value.get_element_type()),
                "partialShape": serialize_shape(value.get_partial_shape()),
            })
        outputs = []
        for i, value in enumerate(model.outputs):
            try:
                name = value.get_any_name()
            except Exception:
                name = f"output-{i}"
            outputs.append({
                "index": i,
                "name": name,
                "elementType": str(value.get_element_type()),
                "partialShape": serialize_shape(value.get_partial_shape()),
            })
        return {
            "readable": True,
            "availableDevices": list(core.available_devices),
            "inputs": inputs,
            "outputs": outputs,
            "error": None,
        }
    except Exception as exc:
        return {
            "readable": False,
            "availableDevices": [],
            "inputs": [],
            "outputs": [],
            "error": f"{type(exc).__name__}: {exc}",
        }


def self_test():
    payload = b"fame-source-separation-doctor"
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "x.bin"
        p.write_bytes(payload)
        assert sha256_file(p) == hashlib.sha256(payload).hexdigest()
        assert sha256_file(Path(td) / "missing.bin") is None
    print("source-separation-standalone-doctor self-test: PASS")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audacity-root", default=r"C:\Program Files\Audacity")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        self_test()
        return

    root = Path(args.audacity_root).resolve()
    model_dir = root / "openvino-models"
    model_bin = model_dir / "htdemucs_v4.bin"
    model_xml = model_dir / "htdemucs_v4.xml"

    bin_hash = sha256_file(model_bin)
    xml_hash = sha256_file(model_xml)
    exact_model = bin_hash == EXPECTED_BIN_SHA256 and xml_hash == EXPECTED_XML_SHA256

    torch_probe = package_probe("torch", "torch")
    openvino_probe = package_probe("openvino", "openvino")
    ffmpeg = ffmpeg_probe()

    torch_module = torch_probe.pop("module")
    openvino_module = openvino_probe.pop("module")

    torch_capabilities = {
        "stft": bool(torch_module and hasattr(torch_module, "stft")),
        "istft": bool(torch_module and hasattr(torch_module, "istft")),
        "cudaAvailable": bool(
            torch_module
            and hasattr(torch_module, "cuda")
            and torch_module.cuda.is_available()
        ),
    }

    model_probe = openvino_model_probe(openvino_module, model_xml)

    runtime_ready = (
        exact_model
        and torch_probe["available"]
        and torch_capabilities["stft"]
        and torch_capabilities["istft"]
        and openvino_probe["available"]
        and model_probe["readable"]
        and ffmpeg["available"]
    )

    if runtime_ready:
        next_action = "IMPLEMENT_CLEAN_STANDALONE_HTDEMUCS_ADAPTER"
    elif not exact_model:
        next_action = "RESTORE_FROZEN_HTDEMUCS_OPENVINO_MODEL"
    else:
        next_action = "CREATE_DEDICATED_SOURCE_SEPARATION_VENV_AND_LOCK"

    print(json.dumps({
        "mode": "SOURCE_SEPARATION_STANDALONE_BACKEND_DOCTOR",
        "python": {
            "executable": sys.executable,
            "version": sys.version.split()[0],
        },
        "frozenModel": {
            "binPath": str(model_bin),
            "binSha256": bin_hash,
            "binMatches": bin_hash == EXPECTED_BIN_SHA256,
            "xmlPath": str(model_xml),
            "xmlSha256": xml_hash,
            "xmlMatches": xml_hash == EXPECTED_XML_SHA256,
            "exactFrozenArtifact": exact_model,
        },
        "torch": {
            **torch_probe,
            **torch_capabilities,
        },
        "openvino": openvino_probe,
        "openvinoModel": model_probe,
        "ffmpeg": ffmpeg,
        "runtimeReadyForAdapterDevelopment": runtime_ready,
        "sourceAudioOpenedByThisCommand": False,
        "sourceSeparationExecutedByThisCommand": False,
        "packagesInstalledByThisCommand": False,
        "audacityModifiedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "nextAction": next_action,
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"SOURCE SEPARATION STANDALONE DOCTOR FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
