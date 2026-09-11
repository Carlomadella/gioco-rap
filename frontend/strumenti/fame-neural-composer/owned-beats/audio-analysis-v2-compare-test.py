#!/usr/bin/env python3
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE / "audio-analysis-v2-compare.py"

spec = importlib.util.spec_from_file_location("fame_v2_compare_test", TARGET)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load V2 compare")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

x = mod.metric_decision(0.0, 0.06, True)
assert x["metricGate"] == "V2_WINS_METRICALLY"
assert x["officialDevelopmentDecision"] == "INCONCLUSIVE_REVIEW_PENDING"
assert x["holdoutMayOpen"] is False

x = mod.metric_decision(0.0, 0.02, True)
assert x["officialDevelopmentDecision"] == "INCONCLUSIVE"

x = mod.metric_decision(-0.03, 0.2, True)
assert x["officialDevelopmentDecision"] == "V1_WINS"

x = mod.metric_decision(0.2, 0.2, False)
assert x["officialDevelopmentDecision"] == "V1_WINS"

print("AUDIO ANALYSIS V2 COMPARE TEST: PASS")
