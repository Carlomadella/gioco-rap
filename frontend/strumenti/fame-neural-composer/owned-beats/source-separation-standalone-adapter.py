#!/usr/bin/env python3
"""Standalone HTDemucs/OpenVINO adapter for the FAME Neural owned-beats pilot.

The adapter is intentionally isolated from the frozen Audio Analysis environment.
Commands `self-test` and `inspect-model` do not open source audio and do not run
inference. Actual separation is available only through the explicit
`separate-file` command.

The signal-processing path follows the public Meta Demucs HTDemucs inference
contract (MIT) and the frozen OpenVINO model signature used by Intel's Audacity
plugin. No Audacity runtime is required.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import random
import shutil
import subprocess
import sys
from typing import Iterable

import numpy as np
import torch
from torch.nn import functional as F

SAMPLE_RATE = 44_100
N_FFT = 4_096
HOP_LENGTH = 1_024
SEGMENT_SAMPLES = (SAMPLE_RATE * 39) // 5  # 343980 = 7.8 s
MAX_SHIFT_SAMPLES = SAMPLE_RATE // 2
DEFAULT_OVERLAP = 0.25
DEFAULT_SHIFTS = 1
DEFAULT_SHIFT_SEED = 0
SOURCES = ("drums", "bass", "other", "vocals")

EXPECTED_XML_SHA256 = "304e24325756089d6bb6583171dd1bea2327505e87c6cb6e010afea7463d9f0a"
EXPECTED_BIN_SHA256 = "7aa84fa1f2b534bd6865a5609b8b5b028802fe761d6a09b1d30a1564f8fac6f8"

EXPECTED_INPUTS = (
    ("input.25", (1, 4, 2048, 336)),
    ("input.1", (1, 2, 343980)),
)
EXPECTED_OUTPUTS = (
    ("4172", (1, 16, 2048, 336)),
    ("4262", (1, 8, 343980)),
)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_frozen_model(xml_path: Path) -> dict:
    xml_path = xml_path.resolve()
    bin_path = xml_path.with_suffix(".bin")
    if not xml_path.is_file():
        raise FileNotFoundError(f"OpenVINO XML model missing: {xml_path}")
    if not bin_path.is_file():
        raise FileNotFoundError(f"OpenVINO BIN model missing: {bin_path}")

    xml_sha = sha256_file(xml_path)
    bin_sha = sha256_file(bin_path)
    if xml_sha != EXPECTED_XML_SHA256:
        raise RuntimeError(f"Unexpected HTDemucs XML SHA256: {xml_sha}")
    if bin_sha != EXPECTED_BIN_SHA256:
        raise RuntimeError(f"Unexpected HTDemucs BIN SHA256: {bin_sha}")

    return {
        "xmlPath": str(xml_path),
        "xmlSha256": xml_sha,
        "binPath": str(bin_path),
        "binSha256": bin_sha,
        "exactFrozenArtifact": True,
    }


def _shape(port) -> tuple[int, ...]:
    return tuple(int(value) for value in port.shape)


def _signature(compiled_model) -> dict:
    inputs = [
        {
            "name": port.get_any_name(),
            "shape": list(_shape(port)),
            "elementType": str(port.get_element_type()),
        }
        for port in compiled_model.inputs
    ]
    outputs = [
        {
            "name": port.get_any_name(),
            "shape": list(_shape(port)),
            "elementType": str(port.get_element_type()),
        }
        for port in compiled_model.outputs
    ]
    return {"inputs": inputs, "outputs": outputs}


def _validate_signature(compiled_model) -> dict:
    signature = _signature(compiled_model)

    actual_inputs = tuple((item["name"], tuple(item["shape"])) for item in signature["inputs"])
    actual_outputs = tuple((item["name"], tuple(item["shape"])) for item in signature["outputs"])

    if actual_inputs != EXPECTED_INPUTS:
        raise RuntimeError(f"Unexpected HTDemucs input signature: {actual_inputs!r}")
    if actual_outputs != EXPECTED_OUTPUTS:
        raise RuntimeError(f"Unexpected HTDemucs output signature: {actual_outputs!r}")

    for item in signature["inputs"] + signature["outputs"]:
        if "f32" not in item["elementType"].lower():
            raise RuntimeError(f"Unexpected HTDemucs tensor type: {item}")

    return signature


def compile_frozen_model(xml_path: Path, device: str = "CPU", cache_dir: Path | None = None):
    import openvino as ov

    model_info = verify_frozen_model(xml_path)
    core = ov.Core()
    available = list(core.available_devices)
    if device not in available:
        raise RuntimeError(f"Requested OpenVINO device {device!r} unavailable; available={available}")

    if cache_dir is not None:
        cache_dir = cache_dir.resolve()
        cache_dir.mkdir(parents=True, exist_ok=True)
        core.set_property({"CACHE_DIR": str(cache_dir)})

    compiled = core.compile_model(str(xml_path.resolve()), device)
    signature = _validate_signature(compiled)
    return compiled, {
        "model": model_info,
        "device": device,
        "availableDevices": available,
        "signature": signature,
    }


def pad1d_reflect(x: torch.Tensor, left: int, right: int) -> torch.Tensor:
    original_length = x.shape[-1]
    if left < 0 or right < 0:
        raise ValueError("Padding must be non-negative")

    work = x
    max_pad = max(left, right)
    reflect_left = left
    reflect_right = right

    if original_length <= max_pad:
        extra = max_pad - original_length + 1
        extra_right = min(right, extra)
        extra_left = extra - extra_right
        reflect_left -= extra_left
        reflect_right -= extra_right
        work = F.pad(work, (extra_left, extra_right))

    out = F.pad(work, (reflect_left, reflect_right), mode="reflect")
    if out.shape[-1] != original_length + left + right:
        raise RuntimeError("pad1d_reflect produced an unexpected length")
    return out


def htdemucs_spec(mix: torch.Tensor) -> torch.Tensor:
    length = mix.shape[-1]
    frames = math.ceil(length / HOP_LENGTH)
    pad = (HOP_LENGTH // 2) * 3

    padded = pad1d_reflect(
        mix,
        pad,
        pad + frames * HOP_LENGTH - length,
    )

    flat = padded.reshape(-1, padded.shape[-1])
    window = torch.hann_window(N_FFT, dtype=flat.dtype, device=flat.device)
    z = torch.stft(
        flat,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        win_length=N_FFT,
        window=window,
        center=True,
        pad_mode="reflect",
        normalized=True,
        onesided=True,
        return_complex=True,
    )
    z = z.view(mix.shape[0], mix.shape[1], z.shape[-2], z.shape[-1])
    z = z[..., :-1, :]
    z = z[..., 2:2 + frames]

    if tuple(z.shape) != (mix.shape[0], mix.shape[1], 2048, frames):
        raise RuntimeError(f"Unexpected HTDemucs STFT shape: {tuple(z.shape)}")
    return z


def htdemucs_magnitude(z: torch.Tensor) -> torch.Tensor:
    batch, channels, freqs, frames = z.shape
    real = torch.view_as_real(z).permute(0, 1, 4, 2, 3)
    return real.reshape(batch, channels * 2, freqs, frames)


def htdemucs_mask_no_z(m: torch.Tensor) -> torch.Tensor:
    batch, sources, channels2, freqs, frames = m.shape
    if channels2 % 2:
        raise RuntimeError("Complex-as-channels tensor has an odd channel count")
    out = m.view(batch, sources, channels2 // 2, 2, freqs, frames)
    out = out.permute(0, 1, 2, 4, 5, 3).contiguous()
    return torch.view_as_complex(out)


def htdemucs_ispec(z: torch.Tensor, length: int) -> torch.Tensor:
    z = F.pad(z, (0, 0, 0, 1))
    z = F.pad(z, (2, 2))

    pad = (HOP_LENGTH // 2) * 3
    istft_length = HOP_LENGTH * math.ceil(length / HOP_LENGTH) + 2 * pad

    other = z.shape[:-2]
    freqs = z.shape[-2]
    frames = z.shape[-1]
    n_fft = 2 * freqs - 2
    flat = z.reshape(-1, freqs, frames)
    window = torch.hann_window(n_fft, dtype=flat.real.dtype, device=flat.device)
    wave = torch.istft(
        flat,
        n_fft=n_fft,
        hop_length=HOP_LENGTH,
        win_length=n_fft,
        window=window,
        center=True,
        normalized=True,
        onesided=True,
        length=istft_length,
    )
    wave = wave.view(*other, wave.shape[-1])
    return wave[..., pad:pad + length]


class TensorChunk:
    def __init__(self, tensor: torch.Tensor | "TensorChunk", offset: int = 0, length: int | None = None):
        total_length = tensor.shape[-1]
        if offset < 0 or offset >= total_length:
            raise ValueError(f"Invalid chunk offset {offset} for length {total_length}")

        if length is None:
            length = total_length - offset
        else:
            length = min(total_length - offset, length)

        if isinstance(tensor, TensorChunk):
            self.tensor = tensor.tensor
            self.offset = tensor.offset + offset
        else:
            self.tensor = tensor
            self.offset = offset
        self.length = int(length)

    @property
    def shape(self):
        shape = list(self.tensor.shape)
        shape[-1] = self.length
        return tuple(shape)

    def padded(self, target_length: int) -> torch.Tensor:
        delta = target_length - self.length
        if delta < 0:
            raise ValueError("Target length shorter than chunk")

        total_length = self.tensor.shape[-1]
        start = self.offset - delta // 2
        end = start + target_length
        correct_start = max(0, start)
        correct_end = min(total_length, end)
        left = correct_start - start
        right = end - correct_end

        out = F.pad(self.tensor[..., correct_start:correct_end], (left, right))
        if out.shape[-1] != target_length:
            raise RuntimeError("TensorChunk.padded produced an unexpected length")
        return out


def center_trim(tensor: torch.Tensor, reference_length: int) -> torch.Tensor:
    delta = tensor.shape[-1] - reference_length
    if delta < 0:
        raise RuntimeError("Cannot center-trim a tensor shorter than the reference")
    if delta == 0:
        return tensor
    left = delta // 2
    return tensor[..., left:left + reference_length]


class OpenVinoHTDemucs:
    def __init__(
        self,
        xml_path: Path,
        *,
        device: str = "CPU",
        cache_dir: Path | None = None,
        overlap: float = DEFAULT_OVERLAP,
        shifts: int = DEFAULT_SHIFTS,
        shift_seed: int = DEFAULT_SHIFT_SEED,
    ):
        if not (0.0 <= overlap < 1.0):
            raise ValueError("overlap must be in [0, 1)")
        if shifts < 1:
            raise ValueError("shifts must be >= 1")

        self.compiled_model, self.model_check = compile_frozen_model(xml_path, device, cache_dir)
        self.overlap = float(overlap)
        self.shifts = int(shifts)
        self.shift_seed = int(shift_seed)

    def _infer_segment(self, mix: torch.Tensor) -> torch.Tensor:
        if tuple(mix.shape) != (1, 2, SEGMENT_SAMPLES):
            raise RuntimeError(f"Unexpected segment shape: {tuple(mix.shape)}")

        z = htdemucs_spec(mix)
        freq = htdemucs_magnitude(z)
        batch, channels, freqs, frames = freq.shape

        mean = freq.mean(dim=(1, 2, 3), keepdim=True)
        std = freq.std(dim=(1, 2, 3), keepdim=True)
        freq_in = ((freq - mean) / (1e-5 + std)).contiguous().to(torch.float32)

        time_mean = mix.mean(dim=(1, 2), keepdim=True)
        time_std = mix.std(dim=(1, 2), keepdim=True)
        time_in = ((mix - time_mean) / (1e-5 + time_std)).contiguous().to(torch.float32)

        results = self.compiled_model([
            freq_in.numpy(),
            time_in.numpy(),
        ])
        freq_out = torch.from_numpy(
            np.array(results[self.compiled_model.output(0)], dtype=np.float32, copy=True)
        )
        time_out = torch.from_numpy(
            np.array(results[self.compiled_model.output(1)], dtype=np.float32, copy=True)
        )

        freq_out = freq_out.view(batch, len(SOURCES), -1, freqs, frames)
        freq_out = freq_out * std[:, None] + mean[:, None]
        complex_out = htdemucs_mask_no_z(freq_out)
        freq_wave = htdemucs_ispec(complex_out, SEGMENT_SAMPLES)

        time_out = time_out.view(batch, len(SOURCES), -1, SEGMENT_SAMPLES)
        time_out = time_out * time_std[:, None] + time_mean[:, None]

        return time_out + freq_wave

    def _apply_chunk(self, chunk: TensorChunk) -> torch.Tensor:
        padded = chunk.padded(SEGMENT_SAMPLES)
        estimated = self._infer_segment(padded)
        return center_trim(estimated, chunk.shape[-1])

    def _apply_split(self, chunk: TensorChunk) -> torch.Tensor:
        batch, channels, length = chunk.shape
        out = torch.zeros(batch, len(SOURCES), channels, length, dtype=torch.float32)
        sum_weight = torch.zeros(length, dtype=torch.float32)

        stride = int((1.0 - self.overlap) * SEGMENT_SAMPLES)
        if stride <= 0:
            raise RuntimeError("Invalid overlap produced a zero stride")

        weight = torch.cat([
            torch.arange(1, SEGMENT_SAMPLES // 2 + 1, dtype=torch.float32),
            torch.arange(SEGMENT_SAMPLES - SEGMENT_SAMPLES // 2, 0, -1, dtype=torch.float32),
        ])
        weight = weight / weight.max()

        for offset in range(0, length, stride):
            part = TensorChunk(chunk, offset, SEGMENT_SAMPLES)
            estimate = self._apply_chunk(part)
            part_length = estimate.shape[-1]
            out[..., offset:offset + part_length] += weight[:part_length] * estimate
            sum_weight[offset:offset + part_length] += weight[:part_length]

        if torch.any(sum_weight <= 0):
            raise RuntimeError("Split overlap produced uncovered output samples")
        return out / sum_weight

    def _apply_shifts(self, mix: torch.Tensor) -> torch.Tensor:
        length = mix.shape[-1]
        padded = TensorChunk(mix).padded(length + 2 * MAX_SHIFT_SAMPLES)
        rng = random.Random(self.shift_seed)

        accumulated = None
        for _ in range(self.shifts):
            # Intel's C++ path uses rand() % max_shift, so the upper bound is excluded.
            offset = rng.randrange(MAX_SHIFT_SAMPLES)
            shifted = TensorChunk(
                padded,
                offset,
                length + MAX_SHIFT_SAMPLES - offset,
            )
            estimate = self._apply_split(shifted)
            estimate = estimate[..., MAX_SHIFT_SAMPLES - offset:]
            accumulated = estimate if accumulated is None else accumulated + estimate

        return accumulated / self.shifts

    def separate(self, stereo: np.ndarray) -> np.ndarray:
        if stereo.dtype != np.float32:
            stereo = stereo.astype(np.float32, copy=False)
        if stereo.ndim != 2 or stereo.shape[0] != 2:
            raise ValueError(f"Expected stereo [2, samples] float32 audio, found {stereo.shape}")
        if stereo.shape[1] < 2:
            raise ValueError("Audio is too short")

        mix = torch.from_numpy(np.ascontiguousarray(stereo)).to(torch.float32)
        ref = mix.mean(dim=0)
        ref_mean = ref.mean()
        ref_std = ref.std()
        if not torch.isfinite(ref_std) or float(ref_std) <= 1e-12:
            raise ValueError("Audio has zero/invalid variance")

        normalized = ((mix - ref_mean) / ref_std).unsqueeze(0)
        sources = self._apply_shifts(normalized).squeeze(0)
        sources = sources * ref_std + ref_mean

        if tuple(sources.shape) != (len(SOURCES), 2, stereo.shape[1]):
            raise RuntimeError(f"Unexpected separated output shape: {tuple(sources.shape)}")
        if not torch.isfinite(sources).all():
            raise RuntimeError("Separated output contains non-finite samples")

        return sources.detach().cpu().numpy().astype(np.float32, copy=False)


def find_ffmpeg() -> str:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found on PATH")
    return ffmpeg


def decode_stereo_f32(source: Path) -> np.ndarray:
    ffmpeg = find_ffmpeg()
    cp = subprocess.run(
        [
            ffmpeg,
            "-v", "error",
            "-i", str(source),
            "-vn",
            "-f", "f32le",
            "-acodec", "pcm_f32le",
            "-ac", "2",
            "-ar", str(SAMPLE_RATE),
            "pipe:1",
        ],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if cp.returncode != 0:
        raise RuntimeError(f"ffmpeg decode failed: {cp.stderr.decode(errors='replace').strip()}")

    data = np.frombuffer(cp.stdout, dtype="<f4")
    if data.size == 0 or data.size % 2:
        raise RuntimeError("ffmpeg returned invalid stereo float32 data")
    return data.reshape(-1, 2).T.copy()


def write_stereo_f32_wav(destination: Path, stereo: np.ndarray) -> None:
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite stem: {destination}")
    if stereo.shape[0] != 2:
        raise ValueError("Stem must be stereo")

    ffmpeg = find_ffmpeg()
    destination.parent.mkdir(parents=True, exist_ok=True)
    payload = np.ascontiguousarray(stereo.T, dtype="<f4").tobytes()

    cp = subprocess.run(
        [
            ffmpeg,
            "-v", "error",
            "-n",
            "-f", "f32le",
            "-ar", str(SAMPLE_RATE),
            "-ac", "2",
            "-i", "pipe:0",
            "-c:a", "pcm_f32le",
            str(destination),
        ],
        input=payload,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if cp.returncode != 0:
        raise RuntimeError(f"ffmpeg stem write failed: {cp.stderr.decode(errors='replace').strip()}")


def technical_stats(stereo: np.ndarray) -> dict:
    peak = float(np.max(np.abs(stereo))) if stereo.size else 0.0
    rms = float(np.sqrt(np.mean(np.square(stereo, dtype=np.float64)))) if stereo.size else 0.0
    return {
        "samplesPerChannel": int(stereo.shape[1]),
        "channels": int(stereo.shape[0]),
        "sampleRate": SAMPLE_RATE,
        "finite": bool(np.isfinite(stereo).all()),
        "peakAbs": peak,
        "rms": rms,
    }


def self_test() -> dict:
    base = torch.arange(12, dtype=torch.float32).view(1, 2, 6)
    chunk = TensorChunk(base, 2, 3)
    padded = chunk.padded(7)
    if chunk.shape != (1, 2, 3):
        raise RuntimeError("TensorChunk shape self-test failed")
    if tuple(padded.shape) != (1, 2, 7):
        raise RuntimeError("TensorChunk padding self-test failed")

    trim_source = torch.arange(10, dtype=torch.float32).view(1, 1, 10)
    trimmed = center_trim(trim_source, 6)
    if trimmed.flatten().tolist() != [2.0, 3.0, 4.0, 5.0, 6.0, 7.0]:
        raise RuntimeError("center_trim self-test failed")

    return {
        "mode": "SOURCE_SEPARATION_STANDALONE_ADAPTER_SELF_TEST_PASS",
        "sampleRate": SAMPLE_RATE,
        "segmentSamples": SEGMENT_SAMPLES,
        "expectedSources": list(SOURCES),
        "sourceAudioOpenedByThisCommand": False,
        "sourceSeparationExecutedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "nextAction": "RUN_MODEL_SIGNATURE_CHECK_NO_AUDIO",
    }


def inspect_model(xml_path: Path, device: str, cache_dir: Path | None) -> dict:
    _compiled, check = compile_frozen_model(xml_path, device, cache_dir)
    return {
        "mode": "SOURCE_SEPARATION_STANDALONE_ADAPTER_MODEL_CHECK_PASS",
        **check,
        "sourceAudioOpenedByThisCommand": False,
        "sourceSeparationExecutedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "nextAction": "FREEZE_PILOT_EXECUTION_RECEIPT_THEN_RUN_DEVELOPMENT_INFERENCE",
    }


def separate_file(
    source: Path,
    output_dir: Path,
    model_xml: Path,
    device: str,
    cache_dir: Path | None,
    shifts: int,
    shift_seed: int,
) -> dict:
    source = source.resolve()
    if not source.is_file():
        raise FileNotFoundError(f"Source audio missing: {source}")
    if output_dir.exists() and any(output_dir.iterdir()):
        raise RuntimeError(f"Output directory must be empty/absent: {output_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)

    stereo = decode_stereo_f32(source)
    separator = OpenVinoHTDemucs(
        model_xml,
        device=device,
        cache_dir=cache_dir,
        overlap=DEFAULT_OVERLAP,
        shifts=shifts,
        shift_seed=shift_seed,
    )
    separated = separator.separate(stereo)

    stems = {}
    for index, name in enumerate(SOURCES):
        stem_path = output_dir / f"{name}.wav"
        stem_audio = separated[index]
        write_stereo_f32_wav(stem_path, stem_audio)
        stems[name] = {
            "path": str(stem_path),
            "sha256": sha256_file(stem_path),
            **technical_stats(stem_audio),
        }

    return {
        "mode": "SOURCE_SEPARATION_STANDALONE_FILE_PASS",
        "source": str(source),
        "sourceSha256": sha256_file(source),
        "device": device,
        "sampleRate": SAMPLE_RATE,
        "overlap": DEFAULT_OVERLAP,
        "shifts": shifts,
        "shiftSeed": shift_seed,
        "stems": stems,
        "sourceAudioOpenedByThisCommand": True,
        "sourceSeparationExecutedByThisCommand": True,
        "finalHoldoutAccessedByThisCommand": False,
        "nextAction": "TECHNICAL_VALIDATE_AND_HUMAN_REVIEW_PILOT_OUTPUT",
    }


def parse_args(argv: Iterable[str] | None = None):
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="command", required=True)

    sub.add_parser("self-test")

    inspect = sub.add_parser("inspect-model")
    inspect.add_argument(
        "--model",
        default=r"C:\Program Files\Audacity\openvino-models\htdemucs_v4.xml",
    )
    inspect.add_argument("--device", default="CPU")
    inspect.add_argument("--cache-dir")

    separate = sub.add_parser("separate-file")
    separate.add_argument("source")
    separate.add_argument("output_dir")
    separate.add_argument(
        "--model",
        default=r"C:\Program Files\Audacity\openvino-models\htdemucs_v4.xml",
    )
    separate.add_argument("--device", default="CPU")
    separate.add_argument("--cache-dir")
    separate.add_argument("--shifts", type=int, default=DEFAULT_SHIFTS)
    separate.add_argument("--shift-seed", type=int, default=DEFAULT_SHIFT_SEED)

    return ap.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv)

    if args.command == "self-test":
        result = self_test()
    elif args.command == "inspect-model":
        result = inspect_model(
            Path(args.model),
            args.device,
            Path(args.cache_dir) if args.cache_dir else None,
        )
    elif args.command == "separate-file":
        result = separate_file(
            Path(args.source),
            Path(args.output_dir),
            Path(args.model),
            args.device,
            Path(args.cache_dir) if args.cache_dir else None,
            args.shifts,
            args.shift_seed,
        )
    else:
        raise RuntimeError(f"Unsupported command: {args.command}")

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"SOURCE SEPARATION STANDALONE ADAPTER FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
