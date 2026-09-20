#!/usr/bin/env python3
"""FAME Neural — development-only Audio→MIDI baseline.

Scope:
- ONLY the 8 frozen development families;
- drums: coarse kick/snare/hihat onset baseline with two arms;
- low-end: librosa pYIN contour + note segmentation;
- append-only outputs;
- no final holdout, no batch131, no training.

This is a transparent baseline, not a claim of task-data readiness.
"""

import argparse
import hashlib
import json
import math
import shutil
import struct
import subprocess
import sys
import uuid
from pathlib import Path

import librosa
import numpy as np

HERE = Path(__file__).resolve().parent
PROTOCOL_FILE = HERE / "audio-to-midi-development-protocol-v1.json"
DEFAULT_RUN_ID = "audio-to-midi-development-baseline-v1-001"
SOURCE_SEP_RUN_ID = "source-separation-development-inference-v1-001"
SOURCE_SEP_REVIEW_ID = "source-separation-human-review-v1-001"
AUDIO_ANALYSIS_RUN_ID = "v2-config-001-development-001"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git_blob_sha1(path):
    data = Path(path).read_bytes().replace(b"\r\n", b"\n")
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def safe_run_id(value):
    if not value or len(value) > 80:
        raise RuntimeError("Invalid run-id")
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
    if value[0] not in allowed or any(ch not in allowed for ch in value):
        raise RuntimeError("Invalid run-id")
    return value


def require_command(name):
    found = shutil.which(name)
    if not found:
        raise RuntimeError(f"{name} not found on PATH")
    return found


def command_version(name):
    cp = subprocess.run(
        [require_command(name), "-version"],
        capture_output=True,
        text=True,
        check=False,
    )
    if cp.returncode:
        raise RuntimeError((cp.stderr or cp.stdout).strip() or f"{name} -version failed")
    return (cp.stdout or cp.stderr).splitlines()[0].strip()


def require_protocol():
    protocol = read_json(PROTOCOL_FILE)
    if (
        protocol.get("schema") != "fame-owned-beats-audio-to-midi-development-protocol-v1"
        or protocol.get("version") != 1
        or protocol.get("status") != "FROZEN_BEFORE_FIRST_TRANSCRIPTION_OUTPUT"
        or protocol.get("scope", {}).get("split") != "development"
        or protocol.get("scope", {}).get("expectedFamilies") != 8
        or protocol.get("scope", {}).get("finalHoldoutAccessAllowed") is not False
        or protocol.get("scope", {}).get("batch131Authorized") is not False
        or protocol.get("scope", {}).get("trainingAuthorized") is not False
        or protocol.get("scope", {}).get("taskDataReadyMayBeDeclared") is not False
        or protocol.get("sourceSeparation", {}).get("inferenceRunId") != SOURCE_SEP_RUN_ID
        or protocol.get("sourceSeparation", {}).get("reviewId") != SOURCE_SEP_REVIEW_ID
        or protocol.get("sourceSeparation", {}).get("requiredOutcome")
        != "OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT"
        or protocol.get("audioAnalysis", {}).get("candidateId") != "audio-analysis-v2-config-001"
        or protocol.get("audioAnalysis", {}).get("developmentRunId") != AUDIO_ANALYSIS_RUN_ID
        or protocol.get("audioAnalysis", {}).get("humanReferenceAsTranscriptionInputAllowed") is not False
        or protocol.get("lowEnd", {}).get("primaryArm", {}).get("id") != "librosa-pyin-lowend-v1"
        or protocol.get("lowEnd", {}).get("candidateArm", {}).get("status")
        != "BLOCKED_PENDING_DEDICATED_ENVIRONMENT_AND_MODEL_FREEZE"
    ):
        raise RuntimeError("Audio→MIDI protocol is not the frozen development-only contract")

    implementation = protocol.get("implementation", {})
    if implementation.get("baselinePath") != Path(__file__).name:
        raise RuntimeError("Audio→MIDI baseline path differs from frozen protocol")
    expected_blob = implementation.get("baselineGitBlobSha1")
    if not expected_blob or expected_blob != git_blob_sha1(__file__):
        raise RuntimeError("Audio→MIDI baseline Git blob differs from frozen protocol")

    return protocol


def decode_mono_f32(source, sample_rate):
    ffmpeg = require_command("ffmpeg")
    cp = subprocess.run(
        [
            ffmpeg,
            "-v",
            "error",
            "-i",
            str(source),
            "-vn",
            "-ac",
            "1",
            "-ar",
            str(sample_rate),
            "-f",
            "f32le",
            "pipe:1",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if cp.returncode:
        raise RuntimeError(
            f"ffmpeg decode failed for {source}: "
            + cp.stderr.decode("utf-8", "replace").strip()
        )
    y = np.frombuffer(cp.stdout, dtype="<f4").astype(np.float32, copy=False)
    if y.size == 0 or not np.isfinite(y).all():
        raise RuntimeError(f"Decoded audio invalid: {source}")
    return y


def rms(value):
    value = np.asarray(value, dtype=np.float64)
    if not value.size:
        return 0.0
    return float(np.sqrt(np.mean(np.square(value))))


def spectral_context(y, sr, hop_length, n_fft):
    spectrum = np.abs(
        librosa.stft(
            y,
            n_fft=n_fft,
            hop_length=hop_length,
            win_length=n_fft,
            center=True,
        )
    ).astype(np.float64)
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    return spectrum, freqs


def band_energy(spectrum, freqs, frame, lo, hi, radius=1):
    mask = (freqs >= float(lo)) & (freqs < float(hi))
    if not np.any(mask):
        return 0.0
    start = max(0, int(frame) - int(radius))
    end = min(spectrum.shape[1], int(frame) + int(radius) + 1)
    if end <= start:
        return 0.0
    return float(np.sum(spectrum[mask, start:end]))


def spectrum_ratios(spectrum, freqs, frame, bands):
    low = band_energy(spectrum, freqs, frame, *bands["low"])
    mid = band_energy(spectrum, freqs, frame, *bands["mid"])
    high = band_energy(spectrum, freqs, frame, *bands["high"])
    total = low + mid + high + 1e-12

    start = max(0, int(frame) - 1)
    end = min(spectrum.shape[1], int(frame) + 2)
    local = np.mean(spectrum[:, start:end], axis=1) if end > start else spectrum[:, int(frame)]
    local_sum = float(np.sum(local)) + 1e-12
    centroid = float(np.sum(freqs * local) / local_sum)

    return {
        "lowRatio": low / total,
        "midRatio": mid / total,
        "highRatio": high / total,
        "centroidHz": centroid,
    }


def classify_drum_ratios(features, config):
    if (
        features["lowRatio"] >= float(config["kickLowRatioAtLeast"])
        and features["centroidHz"] < float(config["kickCentroidBelowHz"])
    ):
        return "kick"
    if (
        features["highRatio"] >= float(config["hihatHighRatioAtLeast"])
        or features["centroidHz"] >= float(config["hihatCentroidAtLeastHz"])
    ):
        return "hihat"
    return "snare"


def velocity_map(strength, strengths):
    values = np.asarray(strengths, dtype=float)
    values = values[np.isfinite(values)]
    if not values.size:
        return 80
    lo = float(np.percentile(values, 10))
    hi = float(np.percentile(values, 95))
    if hi <= lo + 1e-12:
        return 80
    unit = max(0.0, min(1.0, (float(strength) - lo) / (hi - lo)))
    return int(round(42 + unit * 78))


def detect_onsets(y, sr, hop_length, delta, wait_frames):
    envelope = librosa.onset.onset_strength(
        y=y,
        sr=sr,
        hop_length=hop_length,
        aggregate=np.median,
    )
    frames = librosa.onset.onset_detect(
        onset_envelope=envelope,
        sr=sr,
        hop_length=hop_length,
        units="frames",
        backtrack=False,
        pre_max=1,
        post_max=1,
        pre_avg=3,
        post_avg=3,
        delta=float(delta),
        wait=int(wait_frames),
    )
    frames = np.asarray(frames, dtype=int)
    return envelope.astype(float), frames


def transcribe_drums_only(y, protocol):
    cfg = protocol["drums"]
    sr = int(cfg["decodeSampleRate"])
    hop = int(cfg["hopLength"])
    n_fft = int(cfg["nFft"])
    envelope, frames = detect_onsets(
        y,
        sr,
        hop,
        cfg["onset"]["delta"],
        cfg["onset"]["waitFrames"],
    )
    spectrum, freqs = spectral_context(y, sr, hop, n_fft)

    events = []
    strengths = [float(envelope[f]) for f in frames if 0 <= f < len(envelope)]
    for frame in frames:
        if frame < 0 or frame >= len(envelope):
            continue
        features = spectrum_ratios(
            spectrum,
            freqs,
            frame,
            cfg["spectralBandsHz"],
        )
        role = classify_drum_ratios(features, cfg["classification"])
        midi_note = next(
            int(item["midiNote"])
            for item in cfg["classes"]
            if item["role"] == role
        )
        events.append(
            {
                "timeSeconds": round(float(librosa.frames_to_time(frame, sr=sr, hop_length=hop)), 6),
                "frame": int(frame),
                "role": role,
                "midiNote": midi_note,
                "velocity": velocity_map(envelope[frame], strengths),
                "sourceStem": "drums",
                "spectral": {key: round(float(value), 6) for key, value in features.items()},
            }
        )
    return events


def bass_kick_candidates(y, protocol):
    cfg = protocol["drums"]
    fusion = cfg["kickFusion"]
    sr = int(cfg["decodeSampleRate"])
    hop = int(cfg["hopLength"])
    n_fft = int(cfg["nFft"])

    envelope, frames = detect_onsets(
        y,
        sr,
        hop,
        cfg["onset"]["delta"],
        cfg["onset"]["waitFrames"],
    )
    spectrum, freqs = spectral_context(y, sr, hop, n_fft)
    strengths = [float(envelope[f]) for f in frames if 0 <= f < len(envelope)]
    events = []

    for frame in frames:
        if frame < 0 or frame >= len(envelope):
            continue
        features = spectrum_ratios(
            spectrum,
            freqs,
            frame,
            cfg["spectralBandsHz"],
        )
        non_low = features["midRatio"] + features["highRatio"]
        if (
            features["lowRatio"] >= float(fusion["bassLowRatioAtLeast"])
            and non_low >= float(fusion["bassNonLowRatioAtLeast"])
        ):
            events.append(
                {
                    "timeSeconds": round(float(librosa.frames_to_time(frame, sr=sr, hop_length=hop)), 6),
                    "frame": int(frame),
                    "role": "kick",
                    "midiNote": 36,
                    "velocity": velocity_map(envelope[frame], strengths),
                    "sourceStem": "bass",
                    "spectral": {key: round(float(value), 6) for key, value in features.items()},
                }
            )
    return events


def fuse_kick_events(drums_events, bass_events, dedup_seconds):
    kept = [dict(event) for event in drums_events]
    drum_kicks = [event for event in kept if event["role"] == "kick"]

    for candidate in bass_events:
        nearest = None
        nearest_distance = None
        for event in drum_kicks:
            distance = abs(float(event["timeSeconds"]) - float(candidate["timeSeconds"]))
            if nearest_distance is None or distance < nearest_distance:
                nearest = event
                nearest_distance = distance

        if nearest is not None and nearest_distance <= float(dedup_seconds):
            if int(candidate["velocity"]) > int(nearest["velocity"]):
                nearest["velocity"] = int(candidate["velocity"])
            nearest["sourceStem"] = "drums+bass"
            continue

        kept.append(dict(candidate))
        drum_kicks.append(kept[-1])

    kept.sort(
        key=lambda item: (
            float(item["timeSeconds"]),
            int(item["midiNote"]),
            item["sourceStem"],
        )
    )
    return kept


def smooth_quantized_notes(midi_values, active, radius=2):
    midi_values = np.asarray(midi_values, dtype=float)
    active = np.asarray(active, dtype=bool)
    rounded = np.full(len(midi_values), np.nan, dtype=float)
    rounded[active] = np.rint(midi_values[active])

    out = rounded.copy()
    for index in range(len(rounded)):
        if not active[index]:
            continue
        start = max(0, index - radius)
        end = min(len(rounded), index + radius + 1)
        window = rounded[start:end]
        window = window[np.isfinite(window)]
        if window.size:
            values, counts = np.unique(window.astype(int), return_counts=True)
            out[index] = int(values[np.argmax(counts)])
    return out


def lowend_segments_from_contour(
    times,
    f0,
    voiced_prob,
    voiced_flag,
    minimum_note_duration_seconds,
    maximum_gap_frames,
):
    times = np.asarray(times, dtype=float)
    f0 = np.asarray(f0, dtype=float)
    voiced_prob = np.asarray(voiced_prob, dtype=float)
    voiced_flag = np.asarray(voiced_flag, dtype=bool)
    active = voiced_flag & np.isfinite(f0)

    midi_float = np.full(len(f0), np.nan, dtype=float)
    midi_float[active] = librosa.hz_to_midi(f0[active])
    smoothed = smooth_quantized_notes(midi_float, active)

    segments = []
    start = None
    last_active = None
    current_note = None

    def close_segment(end_index):
        nonlocal start, last_active, current_note
        if start is None or last_active is None:
            start = None
            last_active = None
            current_note = None
            return

        start_time = float(times[start])
        if last_active + 1 < len(times):
            end_time = float(times[last_active + 1])
        elif len(times) >= 2:
            end_time = float(times[last_active] + (times[-1] - times[-2]))
        else:
            end_time = float(times[last_active])

        duration = max(0.0, end_time - start_time)
        indexes = np.arange(start, last_active + 1)
        indexes = indexes[active[indexes]]
        if duration >= float(minimum_note_duration_seconds) and indexes.size:
            f0_values = f0[indexes]
            midi_values = midi_float[indexes]
            prob_values = voiced_prob[indexes]
            segments.append(
                {
                    "startSeconds": round(start_time, 6),
                    "endSeconds": round(end_time, 6),
                    "durationSeconds": round(duration, 6),
                    "midiNote": int(current_note),
                    "medianPitchHz": round(float(np.median(f0_values)), 6),
                    "medianMidiFloat": round(float(np.median(midi_values)), 6),
                    "medianVoicedProbability": round(float(np.median(prob_values)), 6),
                }
            )

        start = None
        last_active = None
        current_note = None

    for index in range(len(times)):
        if not active[index] or not np.isfinite(smoothed[index]):
            if start is not None and last_active is not None:
                if index - last_active > int(maximum_gap_frames):
                    close_segment(last_active)
            continue

        note = int(smoothed[index])
        if start is None:
            start = index
            last_active = index
            current_note = note
            continue

        if note != current_note:
            close_segment(last_active)
            start = index
            last_active = index
            current_note = note
            continue

        last_active = index

    close_segment(last_active)
    return segments, midi_float


def transcribe_lowend_pyin(y, protocol):
    cfg = protocol["lowEnd"]["primaryArm"]
    sr = int(cfg["sampleRate"])
    hop = int(cfg["hopLength"])

    f0, voiced_flag, voiced_prob = librosa.pyin(
        y=y,
        sr=sr,
        fmin=float(cfg["fminHz"]),
        fmax=float(cfg["fmaxHz"]),
        frame_length=int(cfg["frameLength"]),
        hop_length=hop,
        resolution=0.1,
    )
    f0 = np.asarray(f0, dtype=float)
    voiced_flag = np.asarray(voiced_flag, dtype=bool)
    voiced_prob = np.asarray(voiced_prob, dtype=float)
    active = voiced_flag & np.isfinite(f0) & (voiced_prob >= float(cfg["voicedProbabilityAtLeast"]))
    voiced_flag = active
    times = librosa.times_like(f0, sr=sr, hop_length=hop)

    segments, midi_float = lowend_segments_from_contour(
        times,
        f0,
        voiced_prob,
        voiced_flag,
        cfg["minimumNoteDurationSeconds"],
        cfg["maximumGapFrames"],
    )

    contour = []
    for index in range(len(times)):
        if not active[index]:
            continue
        contour.append(
            {
                "timeSeconds": round(float(times[index]), 6),
                "frequencyHz": round(float(f0[index]), 6),
                "midiFloat": round(float(midi_float[index]), 6),
                "voicedProbability": round(float(voiced_prob[index]), 6),
            }
        )

    if segments:
        local_rms = librosa.feature.rms(
            y=y,
            frame_length=2048,
            hop_length=hop,
            center=True,
        )[0]
        strengths = []
        for note in segments:
            start_frame = int(round(note["startSeconds"] * sr / hop))
            end_frame = int(round(note["endSeconds"] * sr / hop))
            start_frame = max(0, min(len(local_rms) - 1, start_frame))
            end_frame = max(start_frame + 1, min(len(local_rms), end_frame))
            strengths.append(float(np.mean(local_rms[start_frame:end_frame])))
        for note, strength in zip(segments, strengths):
            note["velocity"] = velocity_map(strength, strengths)

    return {
        "notes": segments,
        "pitchContour": contour,
        "voicedFrameCount": int(np.count_nonzero(active)),
        "frameCount": int(len(times)),
    }


def variable_length_quantity(value):
    value = max(0, int(value))
    buffer = value & 0x7F
    output = bytearray()
    while True:
        value >>= 7
        if value:
            buffer <<= 8
            buffer |= (value & 0x7F) | 0x80
        else:
            break
    while True:
        output.append(buffer & 0xFF)
        if buffer & 0x80:
            buffer >>= 8
        else:
            break
    return bytes(output)


def midi_ticks(seconds, bpm, ppq):
    return max(0, int(round(float(seconds) * float(bpm) * float(ppq) / 60.0)))


def build_midi_bytes(note_events, bpm, ppq, channel, drum=False):
    if not (math.isfinite(float(bpm)) and float(bpm) > 0):
        raise RuntimeError("Invalid BPM for MIDI rendering")
    ppq = int(ppq)
    channel = int(channel)
    if not (0 <= channel <= 15 and ppq > 0):
        raise RuntimeError("Invalid MIDI channel/PPQ")

    tempo_us = int(round(60_000_000 / float(bpm)))
    track_events = [
        (0, 0, bytes([0xFF, 0x51, 0x03]) + tempo_us.to_bytes(3, "big"))
    ]

    for event in note_events:
        start = midi_ticks(event["startSeconds"] if "startSeconds" in event else event["timeSeconds"], bpm, ppq)
        if drum:
            duration_seconds = max(0.03, 60.0 / float(bpm) / 16.0)
            end = midi_ticks(
                float(event["timeSeconds"]) + duration_seconds,
                bpm,
                ppq,
            )
        else:
            end = midi_ticks(event["endSeconds"], bpm, ppq)

        note = max(0, min(127, int(event["midiNote"])))
        velocity = max(1, min(127, int(event.get("velocity", 80))))
        track_events.append((start, 2, bytes([0x90 | channel, note, velocity])))
        track_events.append((max(start + 1, end), 1, bytes([0x80 | channel, note, 0])))

    track_events.sort(key=lambda item: (item[0], item[1], item[2]))
    track = bytearray()
    previous = 0
    for tick, _order, payload in track_events:
        delta = tick - previous
        track.extend(variable_length_quantity(delta))
        track.extend(payload)
        previous = tick
    track.extend(b"\x00\xFF\x2F\x00")

    header = b"MThd" + struct.pack(">IHHH", 6, 0, 1, ppq)
    return header + b"MTrk" + struct.pack(">I", len(track)) + bytes(track)


def write_midi(path, note_events, bpm, ppq, channel, drum=False):
    path = Path(path)
    if path.exists():
        raise RuntimeError(f"Refusing to overwrite MIDI: {path}")
    path.write_bytes(build_midi_bytes(note_events, bpm, ppq, channel, drum=drum))


def validate_source_separation(workspace, protocol):
    root = (
        workspace
        / "runs"
        / "source-separation-development-inference"
        / SOURCE_SEP_RUN_ID
    )
    receipt_path = root / "execution-receipt.json"
    summary_path = root / "inference-summary.json"
    review_path = (
        workspace
        / "reviews"
        / "source-separation-development"
        / SOURCE_SEP_REVIEW_ID
        / "report.json"
    )
    for required in (receipt_path, summary_path, review_path):
        if not required.is_file():
            raise RuntimeError(f"Required Source Separation artifact missing: {required}")

    receipt = read_json(receipt_path)
    summary = read_json(summary_path)
    review = read_json(review_path)

    expected_ids = protocol["sourceSeparation"]["expectedSourceRecordIds"]
    actual_ids = [item.get("sourceRecordId") for item in receipt.get("sources", [])]
    if actual_ids != expected_ids:
        raise RuntimeError(f"Source Separation development source order/identity mismatch: {actual_ids}")

    if (
        receipt.get("status") != "AUTHORIZED_NO_INFERENCE"
        or receipt.get("safety", {}).get("split") != "development"
        or receipt.get("safety", {}).get("finalHoldoutExcluded") is not True
        or receipt.get("safety", {}).get("batch131Authorized") is not False
        or receipt.get("safety", {}).get("trainingAuthorized") is not False
        or summary.get("status") != "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"
        or summary.get("records") != 8
        or summary.get("technicalValidationPassed") is not True
        or review.get("reviewId") != SOURCE_SEP_REVIEW_ID
        or review.get("records") != 8
        or review.get("gate", {}).get("pass") is not True
        or review.get("gate", {}).get("outcome")
        != protocol["sourceSeparation"]["requiredOutcome"]
        or review.get("packageDigestSha256")
        != protocol["sourceSeparation"]["packageDigestSha256"]
        or review.get("submissionDigestSha256")
        != protocol["sourceSeparation"]["submissionDigestSha256"]
        or review.get("safety", {}).get("finalHoldoutAccessed") is not False
        or review.get("safety", {}).get("batch131Accessed") is not False
        or review.get("safety", {}).get("trainingAuthorized") is not False
    ):
        raise RuntimeError("Source Separation gate no longer matches frozen Audio→MIDI protocol")

    by_id = {}
    for source in receipt["sources"]:
        rid = source["sourceRecordId"]
        result_path = root / "results" / f"{rid}.json"
        if not result_path.is_file():
            raise RuntimeError(f"Source Separation result missing: {rid}")
        result = read_json(result_path)
        output_dir = root / Path(source["outputRelativePath"])
        stems = {}
        for stem in ("drums", "bass"):
            file = output_dir / f"{stem}.wav"
            meta = result.get("adapterResult", {}).get("stems", {}).get(stem, {})
            if not file.is_file() or sha256_file(file) != meta.get("sha256"):
                raise RuntimeError(f"Source Separation stem SHA mismatch: {rid}/{stem}")
            stems[stem] = file
        by_id[rid] = {
            "source": source,
            "stems": stems,
        }
    return by_id


def validate_audio_analysis(workspace, protocol):
    report_path = (
        workspace
        / "runs"
        / "audio-analysis-evaluation-v2"
        / AUDIO_ANALYSIS_RUN_ID
        / "report.json"
    )
    if not report_path.is_file():
        raise RuntimeError(f"Promoted development Audio Analysis report missing: {report_path}")
    report = read_json(report_path)
    if (
        report.get("candidateId") != protocol["audioAnalysis"]["candidateId"]
        or report.get("runId") != AUDIO_ANALYSIS_RUN_ID
        or report.get("split") != "development"
        or report.get("holdoutObserved") is not False
        or report.get("trainingAuthorized") is not False
        or not isinstance(report.get("families"), list)
        or len(report["families"]) != 8
    ):
        raise RuntimeError("Unexpected Audio Analysis development report")

    bpm = {}
    for family in report["families"]:
        rid = family.get("sourceRecordId")
        estimated = family.get("bpm", {}).get("estimated")
        if (
            rid not in protocol["sourceSeparation"]["expectedSourceRecordIds"]
            or not isinstance(estimated, (int, float))
            or not math.isfinite(float(estimated))
            or float(estimated) <= 0
        ):
            raise RuntimeError(f"Invalid autonomous BPM input for Audio→MIDI: {rid}:{estimated}")
        bpm[rid] = float(estimated)

    if set(bpm) != set(protocol["sourceSeparation"]["expectedSourceRecordIds"]):
        raise RuntimeError("Audio Analysis BPM coverage mismatch")
    return report_path, bpm


def preflight(workspace_root):
    workspace = Path(workspace_root).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")
    protocol = require_protocol()

    required = protocol["baselineEnvironment"]
    if sys.version.split()[0] != str(required["python"]):
        raise RuntimeError(
            f"Audio→MIDI baseline requires Python {required['python']}, found {sys.version.split()[0]}"
        )
    if librosa.__version__ != required["requiredLibrosa"]:
        raise RuntimeError(
            f"Audio→MIDI baseline requires librosa {required['requiredLibrosa']}, found {librosa.__version__}"
        )

    sources = validate_source_separation(workspace, protocol)
    analysis_path, bpm = validate_audio_analysis(workspace, protocol)
    ffmpeg_version = command_version("ffmpeg")

    return {
        "mode": "AUDIO_TO_MIDI_DEVELOPMENT_BASELINE_PREFLIGHT_PASS",
        "runId": DEFAULT_RUN_ID,
        "records": len(sources),
        "sourceRecordIds": list(sources),
        "audioAnalysisReport": str(analysis_path),
        "autonomousBpmCoverage": len(bpm),
        "python": sys.version.split()[0],
        "librosa": librosa.__version__,
        "ffmpeg": ffmpeg_version,
        "sourceAudioOpenedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
        "batch131AccessedByThisCommand": False,
        "trainingAuthorized": False,
        "nextAction": "EXECUTE_APPEND_ONLY_BASELINE_ON_8_DEVELOPMENT_FAMILIES",
    }


def execute(workspace_root, run_id=DEFAULT_RUN_ID):
    run_id = safe_run_id(run_id)
    workspace = Path(workspace_root).resolve()
    protocol = require_protocol()
    preflight(workspace)

    sources = validate_source_separation(workspace, protocol)
    _analysis_path, bpm_by_id = validate_audio_analysis(workspace, protocol)

    runs_root = workspace / "runs" / "audio-to-midi-development-baseline"
    final_dir = runs_root / run_id
    if final_dir.exists():
        raise RuntimeError(f"Append-only Audio→MIDI run already exists: {final_dir}")

    temp_dir = runs_root / f".{run_id}.tmp-{uuid.uuid4().hex}"
    temp_dir.mkdir(parents=True, exist_ok=False)

    results = []
    try:
        for index, rid in enumerate(protocol["sourceSeparation"]["expectedSourceRecordIds"], 1):
            print(f"[{index}/8] Audio→MIDI baseline {rid}", file=sys.stderr, flush=True)
            source = sources[rid]
            drums_path = source["stems"]["drums"]
            bass_path = source["stems"]["bass"]

            drums_cfg = protocol["drums"]
            low_cfg = protocol["lowEnd"]["primaryArm"]

            drums_audio = decode_mono_f32(drums_path, int(drums_cfg["decodeSampleRate"]))
            bass_for_drums = decode_mono_f32(bass_path, int(drums_cfg["decodeSampleRate"]))
            bass_audio = (
                bass_for_drums
                if int(low_cfg["sampleRate"]) == int(drums_cfg["decodeSampleRate"])
                else decode_mono_f32(bass_path, int(low_cfg["sampleRate"]))
            )

            drums_only = transcribe_drums_only(drums_audio, protocol)
            bass_kicks = bass_kick_candidates(bass_for_drums, protocol)
            fusion = fuse_kick_events(
                drums_only,
                bass_kicks,
                drums_cfg["kickFusion"]["deduplicateWithinSeconds"],
            )
            lowend = transcribe_lowend_pyin(bass_audio, protocol)

            family_dir = temp_dir / rid
            family_dir.mkdir(parents=False, exist_ok=False)
            bpm = bpm_by_id[rid]
            ppq = int(protocol["output"]["midiPpq"])

            write_midi(
                family_dir / "drums-only.mid",
                drums_only,
                bpm,
                ppq,
                int(protocol["output"]["drumChannelZeroBased"]),
                drum=True,
            )
            write_midi(
                family_dir / "drums-bass-kick-fusion.mid",
                fusion,
                bpm,
                ppq,
                int(protocol["output"]["drumChannelZeroBased"]),
                drum=True,
            )
            write_midi(
                family_dir / "bass-pyin.mid",
                lowend["notes"],
                bpm,
                ppq,
                int(protocol["output"]["bassChannelZeroBased"]),
                drum=False,
            )

            result = {
                "schema": "fame-owned-beats-audio-to-midi-development-baseline-result-v1",
                "version": 1,
                "runId": run_id,
                "sourceRecordId": rid,
                "compositionFamilyId": source["source"]["compositionFamilyId"],
                "sourceSeparation": {
                    "runId": SOURCE_SEP_RUN_ID,
                    "drumsStemSha256": sha256_file(drums_path),
                    "bassStemSha256": sha256_file(bass_path),
                },
                "timing": {
                    "bpm": round(bpm, 6),
                    "bpmSource": "audio-analysis-v2-config-001 development estimated output",
                    "humanReferenceUsedAsInput": False,
                    "midiPpq": ppq,
                },
                "drumsOnly": {
                    "armId": "drums-only-spectral-onset-v1",
                    "events": drums_only,
                    "eventCount": len(drums_only),
                    "roleCounts": {
                        role: sum(1 for event in drums_only if event["role"] == role)
                        for role in ("kick", "snare", "hihat")
                    },
                    "midiFile": "drums-only.mid",
                },
                "drumsBassKickFusion": {
                    "armId": "drums-bass-kick-fusion-v1",
                    "events": fusion,
                    "eventCount": len(fusion),
                    "bassKickCandidateCount": len(bass_kicks),
                    "roleCounts": {
                        role: sum(1 for event in fusion if event["role"] == role)
                        for role in ("kick", "snare", "hihat")
                    },
                    "midiFile": "drums-bass-kick-fusion.mid",
                },
                "lowEndPyin": {
                    "armId": "librosa-pyin-lowend-v1",
                    "notes": lowend["notes"],
                    "noteCount": len(lowend["notes"]),
                    "pitchContour": lowend["pitchContour"],
                    "voicedFrameCount": lowend["voicedFrameCount"],
                    "frameCount": lowend["frameCount"],
                    "midiFile": "bass-pyin.mid",
                },
                "safety": {
                    "split": "development",
                    "finalHoldoutAccessed": False,
                    "batch131Accessed": False,
                    "trainingAuthorized": False,
                    "taskDataReadyMayBeDeclared": False,
                },
            }
            result_path = family_dir / "result.json"
            result_path.write_text(stable_json(result), encoding="utf-8")

            for name in ("drums-only.mid", "drums-bass-kick-fusion.mid", "bass-pyin.mid"):
                midi_path = family_dir / name
                if not midi_path.is_file() or not midi_path.read_bytes().startswith(b"MThd"):
                    raise RuntimeError(f"Invalid MIDI output: {rid}/{name}")

            results.append(
                {
                    "sourceRecordId": rid,
                    "resultSha256": sha256_file(result_path),
                    "drumsOnlyEvents": len(drums_only),
                    "fusionEvents": len(fusion),
                    "bassNotes": len(lowend["notes"]),
                }
            )

        summary = {
            "schema": "fame-owned-beats-audio-to-midi-development-baseline-summary-v1",
            "version": 1,
            "status": "BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
            "runId": run_id,
            "records": len(results),
            "protocolSha256": sha256_file(PROTOCOL_FILE),
            "results": results,
            "safety": {
                "split": "development",
                "finalHoldoutAccessed": False,
                "batch131Accessed": False,
                "trainingAuthorized": False,
                "taskDataReadyMayBeDeclared": False,
            },
            "nextAction": "RUN_AUDIO_TO_MIDI_BASELINE_QA_AND_PREPARE_BASIC_PITCH_ARM",
        }
        (temp_dir / "summary.json").write_text(stable_json(summary), encoding="utf-8")

        runs_root.mkdir(parents=True, exist_ok=True)
        if final_dir.exists():
            raise RuntimeError(f"Append-only Audio→MIDI run appeared concurrently: {final_dir}")
        temp_dir.rename(final_dir)
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return {
        "mode": "AUDIO_TO_MIDI_DEVELOPMENT_BASELINE_COMPLETE",
        "runId": run_id,
        "records": len(results),
        "status": "BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
        "finalHoldoutAccessedByThisCommand": False,
        "batch131AccessedByThisCommand": False,
        "trainingAuthorized": False,
        "nextAction": "RUN_AUDIO_TO_MIDI_BASELINE_QA_AND_PREPARE_BASIC_PITCH_ARM",
    }


def self_test():
    kick_cfg = {
        "kickLowRatioAtLeast": 0.45,
        "kickCentroidBelowHz": 1800,
        "hihatHighRatioAtLeast": 0.28,
        "hihatCentroidAtLeastHz": 3500,
    }
    assert classify_drum_ratios(
        {"lowRatio": 0.7, "midRatio": 0.2, "highRatio": 0.1, "centroidHz": 500},
        kick_cfg,
    ) == "kick"
    assert classify_drum_ratios(
        {"lowRatio": 0.1, "midRatio": 0.2, "highRatio": 0.7, "centroidHz": 6000},
        kick_cfg,
    ) == "hihat"
    assert classify_drum_ratios(
        {"lowRatio": 0.2, "midRatio": 0.7, "highRatio": 0.1, "centroidHz": 1500},
        kick_cfg,
    ) == "snare"

    fused = fuse_kick_events(
        [{"timeSeconds": 1.0, "role": "kick", "midiNote": 36, "velocity": 60, "sourceStem": "drums"}],
        [
            {"timeSeconds": 1.02, "role": "kick", "midiNote": 36, "velocity": 90, "sourceStem": "bass"},
            {"timeSeconds": 2.0, "role": "kick", "midiNote": 36, "velocity": 80, "sourceStem": "bass"},
        ],
        0.05,
    )
    assert len(fused) == 2
    assert fused[0]["sourceStem"] == "drums+bass"
    assert fused[0]["velocity"] == 90

    midi = build_midi_bytes(
        [{"timeSeconds": 0.5, "midiNote": 36, "velocity": 100}],
        120,
        480,
        9,
        drum=True,
    )
    assert midi.startswith(b"MThd") and b"MTrk" in midi

    return {
        "mode": "AUDIO_TO_MIDI_DEVELOPMENT_BASELINE_SELF_TEST_PASS",
        "sourceAudioOpenedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "finalHoldoutAccessedByThisCommand": False,
    }


def main(argv=None):
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("self-test")

    pre = sub.add_parser("preflight")
    pre.add_argument("workspace")

    run = sub.add_parser("execute")
    run.add_argument("workspace")
    run.add_argument("--run-id", default=DEFAULT_RUN_ID)

    args = parser.parse_args(argv)

    if args.command == "self-test":
        result = self_test()
    elif args.command == "preflight":
        result = preflight(args.workspace)
    elif args.command == "execute":
        result = execute(args.workspace, args.run_id)
    else:
        raise RuntimeError(f"Unsupported command: {args.command}")

    print(stable_json(result), end="")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"AUDIO TO MIDI DEVELOPMENT BASELINE FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
