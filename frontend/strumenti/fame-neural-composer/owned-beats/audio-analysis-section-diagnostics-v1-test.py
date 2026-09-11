#!/usr/bin/env python3
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE / "audio-analysis-section-diagnostics-v1.py"

spec = importlib.util.spec_from_file_location("fame_section_diag_test", TARGET)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load section diagnostics")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

selected = [
    {"timeSeconds": 10.0, "robustZ": 3.2, "prominence": 1.0, "selectedByV1": True},
]
local = [
    {"timeSeconds": 5.1, "robustZ": 1.8, "prominence": 0.8, "selectedByV1": False},
    {"timeSeconds": 10.0, "robustZ": 3.2, "prominence": 1.0, "selectedByV1": True},
    {"timeSeconds": 20.2, "robustZ": 2.7, "prominence": 0.2, "selectedByV1": False},
]

assert module.classify_reference(10.2, selected, local)["classification"] == "MATCH_500MS"
assert module.classify_reference(7.5, selected, local)["classification"] == "MATCH_3S_ONLY"
assert module.classify_reference(5.0, [], local)["classification"] == "LOCAL_PEAK_BELOW_HEIGHT"
assert module.classify_reference(20.0, [], local)["classification"] == "LOCAL_PEAK_BELOW_PROMINENCE"
assert module.classify_reference(30.0, [], local)["classification"] == "NO_LOCAL_PEAK_WITHIN_3S"

assert module.match_pairs([1.0, 2.0], [1.1, 4.0], 0.5) == [(0, 0)]
assert module.safe_run_id("sections-v1-baseline002-diagnostic-001") == "sections-v1-baseline002-diagnostic-001"

print("AUDIO ANALYSIS SECTION DIAGNOSTICS V1 TEST: PASS")