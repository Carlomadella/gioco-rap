#!/usr/bin/env python3
import importlib.util
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
TARGET = HERE / "audio-analysis-v2-config-001.py"

spec = importlib.util.spec_from_file_location("fame_v2_config001_test", TARGET)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load config-001")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

assert mod.CANDIDATE_ID == "audio-analysis-v2-config-001"
assert mod.TOOL_VERSION == "owned-beats-audio-analysis-v2-config-001"
assert mod.SECTION_CONFIG["contextBeatsEachSide"] == 8
assert mod.SECTION_CONFIG["peakHeightRobustZ"] == 1.5
assert mod.SECTION_CONFIG["peakProminenceRobustZ"] == 1.0
assert mod.SECTION_CONFIG["peakDistanceBeats"] == 8

# Il candidate deve delegare esplicitamente beat/BPM/meter al V1 congelato.
assert mod.tempo_and_beats is mod._v1.tempo_and_beats
assert mod.meter_candidate is mod._v1.meter_candidate
assert mod.decode_audio is mod._v1.decode_audio
assert mod.probe is mod._v1.probe

# Fixture di contrasto strutturale: cambio di stato netto prima/dopo beat 32.
features = np.zeros((25, 64), dtype=float)
features[:, 32:] = 2.0
indices, raw, robust_z = mod.contextual_contrast(features, 8)

assert len(indices) == len(raw) == len(robust_z)
assert len(indices) > 0
peak_k = int(indices[int(np.argmax(raw))])
assert abs(peak_k - 32) <= 1, peak_k

print("AUDIO ANALYSIS V2 CONFIG-001 TEST: PASS")
