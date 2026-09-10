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
    / "audio-analysis-v2.py"
)

spec = importlib.util.spec_from_file_location(
    "owned_audio_analysis",
    MODULE
)

mod = importlib.util.module_from_spec(
    spec
)

spec.loader.exec_module(mod)


def assert_raises(fn, text):
    try:
        fn()
    except Exception as exc:
        assert text in str(exc), str(exc)
        return
    raise AssertionError(
        f"Expected error containing: {text}"
    )


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

    expected_beats = np.arange(
        0.5,
        duration - 0.5,
        0.5
    )

    for n, time_seconds in enumerate(
        expected_beats
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

    technical = result[
        "technical"
    ]

    assert (
        technical[
            "declaredDurationSeconds"
        ] > 20
    )

    assert abs(
        technical[
            "decodedDurationSeconds"
        ] - duration
    ) <= (1.0 / sr)

    assert abs(
        technical[
            "durationDifferenceSeconds"
        ]
    ) < 0.01

    assert (
        result[
            "timeReference"
        ][
            "basis"
        ]
        == "DECODED_AUDIO_START"
    )

    tempo = result[
        "tempo"
    ]

    assert tempo["bpm"] is not None

    # Known synthetic fixture: 120 BPM.
    # librosa's frame/tempo discretization can report ~117.45,
    # so this verifies real accuracy without pretending exact equality.
    assert abs(
        tempo["bpm"] - 120.0
    ) < 4.0

    assert (
        tempo[
            "beatCount"
        ] > 10
    )

    beat_times = np.asarray(
        tempo[
            "beatTimesSeconds"
        ],
        dtype=float
    )

    assert len(beat_times) == tempo[
        "beatCount"
    ]

    assert len(
        tempo[
            "beatFrameIndices"
        ]
    ) == tempo[
        "beatCount"
    ]

    nearest_errors = np.min(
        np.abs(
            beat_times[:, None]
            - expected_beats[
                None,
                :
            ]
        ),
        axis=1
    )

    assert float(
        np.median(
            nearest_errors
        )
    ) < 0.04

    assert float(
        np.quantile(
            nearest_errors,
            0.95
        )
    ) < 0.06

    meter = result[
        "meterCandidate"
    ]

    assert meter["status"] in (
        "CANDIDATE_ONLY",
        "UNKNOWN"
    )

    assert meter[
        "timeSignatureInferred"
    ] is False

    assert meter["value"] is None

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

    # Development mode must fail closed if a holdout record
    # accidentally remains inside the pilot cohort.
    manifest = {
        "schema": "fame-owned-beats-workspace-v1",
        "version": 1,
        "records": [
            {
                "sourceRecordId": "FAME000001",
                "compositionFamilyId": "FAM-A",
                "split": "development",
                "pilotCohorts": [
                    "owned-beats-pilot-v1"
                ]
            },
            {
                "sourceRecordId": "FAME000002",
                "compositionFamilyId": "FAM-B",
                "split": "evaluation-holdout",
                "pilotCohorts": [
                    "owned-beats-pilot-v1"
                ]
            }
        ]
    }

    assert_raises(
        lambda: mod.select_records(
            manifest,
            "development",
            None
        ),
        "non-development records"
    )

    manifest[
        "records"
    ][1][
        "pilotCohorts"
    ] = []

    selected, cohort = mod.select_records(
        manifest,
        "development",
        None
    )

    assert cohort == (
        "owned-beats-pilot-v1"
    )

    assert [
        r["sourceRecordId"]
        for r in selected
    ] == [
        "FAME000001"
    ]

    evaluation, eval_cohort = (
        mod.select_records(
            manifest,
            "evaluation-holdout",
            None
        )
    )

    assert eval_cohort is None

    assert [
        r["sourceRecordId"]
        for r in evaluation
    ] == [
        "FAME000002"
    ]

    # Evaluation path requires an explicit confirmation flag.
    assert_raises(
        lambda: mod.authorize_analysis_mode(
            "evaluation-holdout",
            False
        ),
        "--confirm-evaluation-holdout"
    )

    mod.authorize_analysis_mode(
        "evaluation-holdout",
        True
    )

    # Same composition family may never cross split boundaries.
    manifest[
        "records"
    ][1][
        "compositionFamilyId"
    ] = "FAM-A"

    assert_raises(
        lambda: mod.validate_manifest(
            manifest
        ),
        "Composition family crosses splits"
    )

    print(
        "OWNED BEATS AUDIO ANALYSIS V2 PRE-TUNING: PASS "
        "(beat-grid export, duration, split guards, synthetic accuracy)"
    )

finally:
    shutil.rmtree(
        root,
        ignore_errors=True
    )
