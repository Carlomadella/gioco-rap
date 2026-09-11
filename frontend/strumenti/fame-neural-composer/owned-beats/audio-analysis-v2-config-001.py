#!/usr/bin/env python3
"""
FAME Neural — Audio Analysis V2 config-001.

Scope deliberatamente stretto:
- beat tracker V1 invariato;
- BPM V1 invariato;
- meter V1 invariato;
- cambia solo il detector delle section boundary.

La novelty V1 confronta beat adiacenti. config-001 confronta invece la media
delle feature nei 8 beat precedenti con gli 8 beat successivi, mantenendo
MFCC13+chroma12 beat-synchronous e una peak policy globale uguale per tutte
le tracce.
"""
import importlib.util
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import find_peaks

HERE = Path(__file__).resolve().parent
BASELINE_FILE = HERE / "audio-analysis.py"
BASELINE_SOURCE_GIT_BLOB_SHA1 = "fcabcf8b069fe2a65edc6ce171d86226e1bcaecb"

TOOL_VERSION = "owned-beats-audio-analysis-v2-config-001"
CANDIDATE_ID = "audio-analysis-v2-config-001"

SECTION_CONFIG = {
    "method": "beat-context-contrast-v2-config-001",
    "featureSet": "MFCC13_PLUS_CHROMA12_BEAT_SYNC_SAME_AS_V1",
    "contextBeatsEachSide": 8,
    "contrast": "EUCLIDEAN_DISTANCE_BETWEEN_LEFT_AND_RIGHT_CONTEXT_MEANS",
    "robustNormalization": "MEDIAN_MAD_1_4826",
    "peakHeightRobustZ": 1.5,
    "peakProminenceRobustZ": 1.0,
    "peakDistanceBeats": 8,
    "edgeMarginSeconds": 2.0,
    "semanticLabelsAssigned": False,
}


def _git_blob(path):
    return subprocess.check_output(
        ["git", "hash-object", str(path)],
        cwd=HERE,
        text=True,
    ).strip()


if _git_blob(BASELINE_FILE) != BASELINE_SOURCE_GIT_BLOB_SHA1:
    raise RuntimeError(
        "Frozen V1 source differs from config-001 baseline dependency"
    )


def _load_v1():
    spec = importlib.util.spec_from_file_location(
        "fame_audio_analysis_v1_for_v2_config001",
        BASELINE_FILE,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load frozen audio-analysis.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_v1 = _load_v1()

# Esplicito: tutto ciò che non riguarda le sections resta V1.
probe = _v1.probe
decode_audio = _v1.decode_audio
tempo_and_beats = _v1.tempo_and_beats
meter_candidate = _v1.meter_candidate
librosa = _v1.librosa
SR = _v1.SR
HOP = _v1.HOP


def _beat_sync_features(y, beats):
    mfcc = librosa.feature.mfcc(
        y=y,
        sr=SR,
        n_mfcc=13,
        hop_length=HOP,
    )
    chroma = librosa.feature.chroma_stft(
        y=y,
        sr=SR,
        hop_length=HOP,
    )

    last_frame = min(mfcc.shape[1], chroma.shape[1]) - 1
    frames = np.clip(np.asarray(beats, dtype=int), 0, last_frame)

    features = np.vstack([
        mfcc[:, frames],
        chroma[:, frames],
    ]).astype(float)

    features = features - features.mean(axis=1, keepdims=True)
    features = features / (
        features.std(axis=1, keepdims=True) + 1e-9
    )
    return features


def contextual_contrast(features, context_beats=None):
    """
    Restituisce (boundary_beat_indices, raw_contrast, robust_z).

    Ogni indice k rappresenta la boundary prima del beat k:
      left  = beat [k-context, k)
      right = beat [k, k+context)
    """
    context = int(
        context_beats
        if context_beats is not None
        else SECTION_CONFIG["contextBeatsEachSide"]
    )
    if context < 2:
        raise ValueError("context_beats must be >= 2")

    features = np.asarray(features, dtype=float)
    if features.ndim != 2:
        raise ValueError("features must be 2D [feature, beat]")

    beat_count = features.shape[1]
    if beat_count < context * 2 + 1:
        return (
            np.asarray([], dtype=int),
            np.asarray([], dtype=float),
            np.asarray([], dtype=float),
        )

    indices = np.arange(
        context,
        beat_count - context + 1,
        dtype=int,
    )

    raw = np.empty(len(indices), dtype=float)
    for pos, k in enumerate(indices):
        left = features[:, k - context:k].mean(axis=1)
        right = features[:, k:k + context].mean(axis=1)
        raw[pos] = float(np.linalg.norm(right - left))

    median = float(np.median(raw))
    mad = float(np.median(np.abs(raw - median))) + 1e-9
    robust_z = (raw - median) / (1.4826 * mad)

    return indices, raw, robust_z


def section_candidates(y, beats, duration):
    context = int(SECTION_CONFIG["contextBeatsEachSide"])

    if len(beats) < context * 2 + 1:
        return {
            "status": "UNKNOWN",
            "method": SECTION_CONFIG["method"],
            "semanticLabelsAssigned": False,
            "config": dict(SECTION_CONFIG),
            "boundaries": [],
        }

    features = _beat_sync_features(y, beats)
    indices, raw, robust_z = contextual_contrast(features, context)

    if robust_z.size < 3:
        return {
            "status": "UNKNOWN",
            "method": SECTION_CONFIG["method"],
            "semanticLabelsAssigned": False,
            "config": dict(SECTION_CONFIG),
            "boundaries": [],
        }

    peak_positions, properties = find_peaks(
        robust_z,
        height=float(SECTION_CONFIG["peakHeightRobustZ"]),
        prominence=float(SECTION_CONFIG["peakProminenceRobustZ"]),
        distance=int(SECTION_CONFIG["peakDistanceBeats"]),
    )

    beat_times = librosa.frames_to_time(
        np.asarray(beats, dtype=int),
        sr=SR,
        hop_length=HOP,
    )

    boundaries = []
    for peak_order, peak_position in enumerate(peak_positions):
        beat_index = int(indices[int(peak_position)])
        if beat_index >= len(beat_times):
            continue

        time_seconds = float(beat_times[beat_index])
        edge = float(SECTION_CONFIG["edgeMarginSeconds"])
        if time_seconds < edge or time_seconds > float(duration) - edge:
            continue

        boundaries.append({
            "timeSeconds": round(time_seconds, 6),
            "beatIndex": beat_index,
            "changeScore": round(float(robust_z[peak_position]), 6),
            "rawContextContrast": round(float(raw[peak_position]), 6),
            "prominence": round(
                float(properties["prominences"][peak_order]),
                6,
            ),
        })

    return {
        "status": "CANDIDATE_ONLY",
        "method": SECTION_CONFIG["method"],
        "semanticLabelsAssigned": False,
        "config": dict(SECTION_CONFIG),
        "boundaries": boundaries,
    }
