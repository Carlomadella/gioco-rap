#!/usr/bin/env python3
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE / "audio-analysis-correction-cost-review.py"
METHOD = HERE / "audio-analysis-correction-cost-review-method-v1.json"

spec = importlib.util.spec_from_file_location("fame_correction_cost_review", TARGET)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load correction-cost review tool")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

method = json.loads(METHOD.read_text(encoding="utf-8"))
assert method["status"] == "FROZEN_BEFORE_REVIEW_OBSERVATION"
assert method["scope"]["expectedDevelopmentFamilies"] == 8
assert method["metric"]["minimumComparableFamilies"] == 6
assert method["metric"]["automaticWinBlockedIfMedianRelativeIncreaseStrictlyExceeds"] == 0.25
assert method["blinding"]["armIdentityHiddenFromReviewer"] is True
assert method["blinding"]["humanReferenceHiddenFromReviewer"] is True
assert method["blinding"]["baselineFirstFamilies"] == 4
assert method["blinding"]["candidateFirstFamilies"] == 4
assert method["holdoutObserved"] is False

# Relative correction cost: (V2/V1)-1.
assert abs(m.comparable_relative(50.0, 40.0) - 0.25) < 1e-12
assert m.comparable_relative(20.0, 0.0) is None

# Exactly +25% does NOT veto because protocol says "exceeds".
gate = m.review_gate([0.25] * 8, minimum=6, threshold=0.25)
assert gate["status"] == "REVIEW_COMPLETE"
assert gate["automaticWinBlocked"] is False
assert gate["medianRelativeIncrease"] == 0.25

# Above +25% median vetoes.
gate = m.review_gate([0.30, 0.40, 0.28, 0.27, 0.35, 0.31, -0.10, 0.00], minimum=6, threshold=0.25)
assert gate["status"] == "REVIEW_COMPLETE"
assert gate["automaticWinBlocked"] is True

# Fewer than six comparable families cannot decide.
gate = m.review_gate([0.0, 0.1, 0.2, 0.3, 0.4], minimum=6, threshold=0.25)
assert gate["status"] == "MISSING_REQUIRED_REVIEW"
assert gate["automaticWinBlocked"] is None

# Basic boundary QA matcher.
qa = m.event_match([10.0, 20.0, 30.0], [10.1, 19.8, 40.0], 0.5)
assert qa["matches"] == 2
assert qa["falsePositives"] == 1
assert qa["omissions"] == 1
assert abs(qa["fMeasure"] - 0.666667) < 1e-6

# UI never contains explicit V1/V2 arm labels in the visible review instructions.
assert "BASELINE" not in m.REVIEW_HTML
assert "CANDIDATE" not in m.REVIEW_HTML
assert "reference congelata non è mostrata" in m.REVIEW_HTML

print("audio-analysis-correction-cost-review-test: OK")

# UI regression: the reviewer must show the live audio position on the waveform.
assert 'id="audioPos"' in m.REVIEW_HTML
assert "function drawPlayhead()" in m.REVIEW_HTML
assert 'strokeStyle="#ff4d6d"' in m.REVIEW_HTML
assert "requestAnimationFrame(updatePlayhead)" in m.REVIEW_HTML
assert 'audio.addEventListener("seeked"' in m.REVIEW_HTML


# UI regression: marker selection, move and delete must have explicit working state.
assert 'UI_REVISION="controls-v3"' in m.REVIEW_HTML
assert 'id="selectionStatus"' in m.REVIEW_HTML
assert "function hasValidSelection()" in m.REVIEW_HTML
assert "function moveSelectedTo(timeSeconds)" in m.REVIEW_HTML
assert "function deleteSelected()" in m.REVIEW_HTML
assert "function markerIndexNearCanvasX" in m.REVIEW_HTML
assert 'document.getElementById("moveBtn").onclick=()=>{moveSelectedTo(audio.currentTime)}' in m.REVIEW_HTML
assert 'document.getElementById("deleteBtn").onclick=()=>{deleteSelected()}' in m.REVIEW_HTML
assert 'for(const id of ["moveBtn","deleteBtn","deselectBtn"])document.getElementById(id).disabled=!hasSelection;' in m.REVIEW_HTML
