#!/usr/bin/env python3
import importlib.util
import shutil
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent

MODULE = (
    HERE
    / "owned-beats"
    / "audio-analysis.py"
)

spec = importlib.util.spec_from_file_location(
    "owned_audio_analysis",
    MODULE
)

mod = importlib.util.module_from_spec(
    spec
)

spec.loader.exec_module(mod)

root = Path(
    tempfile.mkdtemp(
        prefix="fame-audio-test-"
    )
)

try:
    wav = root / "click.wav"

    sr = 22050
    duration = 24.0

    y = np.zeros(
        int(sr * duration),
        dtype=np.float32
    )

    hit = np.exp(
        -np.linspace(
            0,
            8,
            int(sr * 0.05)
        )
    ).astype(
        np.float32
    )

    for n, time_seconds in enumerate(
        np.arange(
            0.5,
            duration - 0.5,
            0.5
        )
    ):
        start = int(
            time_seconds * sr
        )

        amplitude = (
            0.95
            if n % 4 == 0
            else 0.55
        )

        length = min(
            len(hit),
            len(y) - start
        )

        y[
            start:start + length
        ] += (
            amplitude
            * hit[:length]
        )

    sf.write(
        wav,
        y,
        sr,
        subtype="PCM_16"
    )

    result = mod.analyze(
        wav
    )

    assert (
        result[
            "technical"
        ][
            "durationSeconds"
        ] > 20
    )

    assert (
        result[
            "tempo"
        ][
            "bpm"
        ] is not None
    )

    assert (
        result[
            "tempo"
        ][
            "beatCount"
        ] > 10
    )

    assert (
        result[
            "meterCandidate"
        ][
            "status"
        ]
        in (
            "CANDIDATE_ONLY",
            "UNKNOWN"
        )
    )

    assert (
        result[
            "sectionCandidates"
        ][
            "status"
        ]
        in (
            "CANDIDATE_ONLY",
            "UNKNOWN"
        )
    )

    print(
        "OWNED BEATS AUDIO ANALYSIS: PASS"
    )

finally:
    shutil.rmtree(
        root,
        ignore_errors=True
    )