#!/usr/bin/env python3
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import librosa
import numpy as np
import scipy
from scipy.signal import find_peaks

TOOL_VERSION = "owned-beats-audio-analysis-v1"
DEFAULT_COHORT = "owned-beats-pilot-v1"

SR = 22050
HOP = 512

CONFIG = {
    "decodeSampleRate": SR,
    "hopLength": HOP,
    "tempoMethod": "librosa.beat.beat_track",
    "meterMethod": "beat-accent-cycle-v1",
    "sectionMethod": "beat-feature-change-v1"
}


def sha256_file(path):
    h = hashlib.sha256()

    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)

    return h.hexdigest()


def run_command(args, binary=False):
    cp = subprocess.run(args, capture_output=True)

    if cp.returncode:
        error = cp.stderr.decode("utf-8", "replace")
        raise RuntimeError(
            error.strip() or f"Command failed: {args[0]}"
        )

    if binary:
        return cp.stdout

    return cp.stdout.decode("utf-8", "replace")


def require_command(name):
    path = shutil.which(name)

    if not path:
        raise RuntimeError(f"{name} not found in PATH")

    return path


def command_version(name):
    output = run_command([
        require_command(name),
        "-version"
    ])

    return output.splitlines()[0].strip()


def git_commit():
    try:
        repo = Path(__file__).resolve().parents[4]

        cp = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo,
            capture_output=True,
            text=True
        )

        if cp.returncode == 0:
            return cp.stdout.strip()

    except Exception:
        pass

    return None


def probe(path):
    data = json.loads(
        run_command([
            require_command("ffprobe"),
            "-v", "error",
            "-show_format",
            "-show_streams",
            "-of", "json",
            str(path)
        ])
    )

    audio = next(
        (
            stream
            for stream in data.get("streams", [])
            if stream.get("codec_type") == "audio"
        ),
        None
    )

    if not audio:
        raise RuntimeError("No audio stream found")

    fmt = data.get("format", {})

    duration = float(
        audio.get("duration")
        or fmt.get("duration")
        or 0
    )

    if duration <= 0:
        raise RuntimeError("Invalid audio duration")

    return {
        "durationSeconds": round(duration, 6),
        "codec": audio.get("codec_name"),
        "sampleRate": (
            int(audio["sample_rate"])
            if audio.get("sample_rate")
            else None
        ),
        "channels": audio.get("channels"),
        "channelLayout": audio.get("channel_layout"),
        "formatName": fmt.get("format_name")
    }


def decode_audio(path):
    raw = run_command(
        [
            require_command("ffmpeg"),
            "-v", "error",
            "-i", str(path),
            "-vn",
            "-ac", "1",
            "-ar", str(SR),
            "-f", "f32le",
            "pipe:1"
        ],
        binary=True
    )

    y = np.frombuffer(
        raw,
        dtype="<f4"
    ).astype(
        np.float32,
        copy=False
    )

    if y.size == 0:
        raise RuntimeError("Decoded audio is empty")

    if not np.isfinite(y).all():
        raise RuntimeError(
            "Decoded audio contains invalid samples"
        )

    return y


def tempo_and_beats(y):
    onset = librosa.onset.onset_strength(
        y=y,
        sr=SR,
        hop_length=HOP
    )

    tempo, beats = librosa.beat.beat_track(
        onset_envelope=onset,
        sr=SR,
        hop_length=HOP,
        units="frames"
    )

    tempo_array = np.asarray(tempo).reshape(-1)

    bpm = (
        float(tempo_array[0])
        if tempo_array.size
        else 0.0
    )

    beats = np.asarray(
        beats,
        dtype=int
    )

    beat_times = librosa.frames_to_time(
        beats,
        sr=SR,
        hop_length=HOP
    )

    if len(beat_times) >= 3:
        intervals = np.diff(beat_times)

        median_interval = float(
            np.median(intervals)
        )

        mad = float(
            np.median(
                np.abs(
                    intervals - median_interval
                )
            )
        )

        stability = max(
            0.0,
            min(
                1.0,
                1.0
                - 5.0
                * mad
                / max(
                    median_interval,
                    1e-9
                )
            )
        )
    else:
        stability = 0.0

    alternative_bpms = sorted({
        round(candidate, 6)
        for candidate in (
            bpm / 2,
            bpm,
            bpm * 2
        )
        if 40 <= candidate <= 240
    })

    result = {
        "status": "CANDIDATE_ONLY",
        "bpm": (
            round(bpm, 6)
            if bpm > 0
            else None
        ),
        "alternativeBpms": alternative_bpms,
        "beatCount": int(len(beats)),
        "stabilityScore": round(
            stability,
            6
        ),
        "stabilityScoreIsCorrectnessProbability": False,
        "method": "librosa.beat.beat_track"
    }

    return onset, beats, result


def meter_candidate(onset, beats):
    if len(beats) < 12:
        return {
            "status": "UNKNOWN",
            "value": None,
            "method": "beat-accent-cycle-v1",
            "candidates": []
        }

    strengths = onset[
        np.clip(
            beats,
            0,
            len(onset) - 1
        )
    ].astype(float)

    spread = float(
        np.std(strengths)
    ) + 1e-9

    labels = {
        3: "3/4",
        4: "4/4",
        6: "6/8"
    }

    candidates = []

    for cycle in (3, 4, 6):
        phase_means = [
            float(
                np.mean(
                    strengths[
                        phase::cycle
                    ]
                )
            )
            for phase
            in range(cycle)
        ]

        score = max(
            0.0,
            (
                max(phase_means)
                - float(
                    np.median(
                        phase_means
                    )
                )
            )
            / spread
        )

        candidates.append({
            "value": labels[cycle],
            "cycleBeats": cycle,
            "score": round(
                score,
                6
            )
        })

    candidates.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return {
        "status": "CANDIDATE_ONLY",
        "value": candidates[0]["value"],
        "method": "beat-accent-cycle-v1",
        "scoreIsCorrectnessProbability": False,
        "candidates": candidates
    }


def section_candidates(
    y,
    beats,
    duration
):
    if len(beats) < 16:
        return {
            "status": "UNKNOWN",
            "method": "beat-feature-change-v1",
            "semanticLabelsAssigned": False,
            "boundaries": []
        }

    mfcc = librosa.feature.mfcc(
        y=y,
        sr=SR,
        n_mfcc=13,
        hop_length=HOP
    )

    chroma = librosa.feature.chroma_stft(
        y=y,
        sr=SR,
        hop_length=HOP
    )

    last_frame = (
        min(
            mfcc.shape[1],
            chroma.shape[1]
        )
        - 1
    )

    frames = np.clip(
        beats,
        0,
        last_frame
    )

    features = np.vstack([
        mfcc[:, frames],
        chroma[:, frames]
    ]).astype(float)

    features = (
        features
        - features.mean(
            axis=1,
            keepdims=True
        )
    )

    features = (
        features
        / (
            features.std(
                axis=1,
                keepdims=True
            )
            + 1e-9
        )
    )

    change = np.linalg.norm(
        np.diff(
            features,
            axis=1
        ),
        axis=0
    )

    smooth = np.convolve(
        change,
        np.ones(5) / 5.0,
        mode="same"
    )

    median = float(
        np.median(smooth)
    )

    mad = float(
        np.median(
            np.abs(
                smooth - median
            )
        )
    ) + 1e-9

    robust_z = (
        smooth - median
    ) / (
        1.4826 * mad
    )

    peaks, _ = find_peaks(
        robust_z,
        height=2.5,
        distance=8,
        prominence=0.5
    )

    beat_times = librosa.frames_to_time(
        beats,
        sr=SR,
        hop_length=HOP
    )

    boundaries = []

    for peak in peaks:
        beat_index = int(
            peak + 1
        )

        if beat_index >= len(beat_times):
            continue

        time_seconds = float(
            beat_times[
                beat_index
            ]
        )

        if (
            time_seconds < 2.0
            or time_seconds > duration - 2.0
        ):
            continue

        boundaries.append({
            "timeSeconds": round(
                time_seconds,
                6
            ),
            "beatIndex": beat_index,
            "changeScore": round(
                float(
                    robust_z[peak]
                ),
                6
            )
        })

    return {
        "status": "CANDIDATE_ONLY",
        "method": "beat-feature-change-v1",
        "semanticLabelsAssigned": False,
        "boundaries": boundaries
    }


def analyze(path):
    technical = probe(path)

    y = decode_audio(path)

    onset, beats, tempo = (
        tempo_and_beats(y)
    )

    return {
        "technical": technical,
        "tempo": tempo,
        "meterCandidate": meter_candidate(
            onset,
            beats
        ),
        "sectionCandidates": (
            section_candidates(
                y,
                beats,
                technical[
                    "durationSeconds"
                ]
            )
        )
    }


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "workspace"
    )

    parser.add_argument(
        "--cohort",
        default=DEFAULT_COHORT
    )

    parser.add_argument(
        "--summary",
        action="store_true"
    )

    args = parser.parse_args()

    workspace = Path(
        args.workspace
    ).resolve()

    manifest_path = (
        workspace
        / "manifest"
        / "owned-beats-manifest.json"
    )

    manifest = json.loads(
        manifest_path.read_text(
            encoding="utf-8"
        )
    )

    if (
        manifest.get("schema")
        != "fame-owned-beats-workspace-v1"
        or manifest.get("version") != 1
    ):
        raise RuntimeError(
            "Unsupported owned-beats manifest"
        )

    records = [
        record
        for record
        in manifest.get(
            "records",
            []
        )
        if args.cohort
        in (
            record.get(
                "pilotCohorts"
            )
            or []
        )
    ]

    if not records:
        raise RuntimeError(
            "No records found "
            f"for cohort: {args.cohort}"
        )

    result = {
        "schema": (
            "fame-owned-beats-"
            "audio-analysis-preview-v1"
        ),
        "version": 1,
        "mode": "PREVIEW",
        "toolVersion": TOOL_VERSION,
        "cohortId": args.cohort,
        "recordsAnalyzed": len(records),
        "environment": {
            "gitCommit": git_commit(),
            "python": sys.version.split()[0],
            "librosa": librosa.__version__,
            "numpy": np.__version__,
            "scipy": scipy.__version__,
            "ffmpeg": command_version(
                "ffmpeg"
            ),
            "ffprobe": command_version(
                "ffprobe"
            )
        },
        "config": CONFIG,
        "results": []
    }

    for index, record in enumerate(
        records,
        1
    ):
        record_id = record[
            "sourceRecordId"
        ]

        source = (
            workspace
            / Path(
                record["localPath"]
            )
        )

        print(
            f"[{index}/{len(records)}] "
            f"{record_id}",
            file=sys.stderr,
            flush=True
        )

        if not source.is_file():
            raise RuntimeError(
                "Missing source copy: "
                + record_id
            )

        actual_sha = sha256_file(
            source
        )

        if (
            actual_sha
            != record["sha256"]
        ):
            raise RuntimeError(
                "Source SHA256 mismatch: "
                + record_id
            )

        result["results"].append({
            "sourceRecordId": record_id,
            "sourceAssetId": (
                record.get(
                    "sourceAssetId"
                )
            ),
            "sourceSha256": actual_sha,
            "analysis": analyze(
                source
            )
        })

    if args.summary:
        summary = {
            "mode": result["mode"],
            "toolVersion": result[
                "toolVersion"
            ],
            "cohortId": result[
                "cohortId"
            ],
            "recordsAnalyzed": result[
                "recordsAnalyzed"
            ],
            "results": []
        }

        for item in result[
            "results"
        ]:
            analysis = item[
                "analysis"
            ]

            summary[
                "results"
            ].append({
                "sourceRecordId": (
                    item[
                        "sourceRecordId"
                    ]
                ),
                "durationSeconds": (
                    analysis[
                        "technical"
                    ][
                        "durationSeconds"
                    ]
                ),
                "bpmCandidate": (
                    analysis[
                        "tempo"
                    ][
                        "bpm"
                    ]
                ),
                "alternativeBpms": (
                    analysis[
                        "tempo"
                    ][
                        "alternativeBpms"
                    ]
                ),
                "beatCount": (
                    analysis[
                        "tempo"
                    ][
                        "beatCount"
                    ]
                ),
                "meterCandidate": (
                    analysis[
                        "meterCandidate"
                    ][
                        "value"
                    ]
                ),
                "sectionBoundaryCount": len(
                    analysis[
                        "sectionCandidates"
                    ][
                        "boundaries"
                    ]
                )
            })

        print(
            json.dumps(
                summary,
                ensure_ascii=False,
                indent=2
            )
        )

    else:
        print(
            json.dumps(
                result,
                ensure_ascii=False,
                indent=2
            )
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(
            str(exc),
            file=sys.stderr
        )
        raise SystemExit(1)