"use strict";

const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const protocolPath = path.join(
  HERE,
  "owned-beats",
  "audio-analysis-v2-protocol.json"
);
const docPath = path.join(
  ROOT,
  "documentazione",
  "fame-neural",
  "OWNED_BEATS_AUDIO_ANALYSIS_V2_APERTURA_2026-09-10.md"
);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const p = JSON.parse(fs.readFileSync(protocolPath, "utf8"));
const doc = fs.readFileSync(docPath, "utf8");

assert(
  p.schema === "fame-owned-beats-audio-analysis-v2-evaluation-protocol",
  "Unexpected protocol schema"
);
assert(p.version === 1, "Unexpected protocol version");
assert(p.status === "FROZEN_PRE_TUNING", "Protocol must be frozen pre-tuning");

assert(p.scope.stage === "AUDIO_ANALYSIS_ONLY", "Scope must stay Audio Analysis only");
assert(p.scope.trainingAuthorized === false, "Training must remain forbidden");
assert(p.scope.sourceSeparationAuthorized === false, "Source Separation must remain forbidden");
assert(p.scope.audioToMidiAuthorized === false, "Audio->MIDI must remain forbidden");

assert(p.splits.groupBy === "compositionFamilyId", "Split grouping must use compositionFamilyId");
assert(p.splits.development.name === "development", "Development split name changed");
assert(p.splits.development.expectedFamilies === 8, "Development must remain 8 families");
assert(p.splits.development.allowedDuringTuning === true, "Development must be usable during tuning");
assert(
  p.splits.evaluationHoldout.name === "evaluation-holdout",
  "Evaluation holdout split name changed"
);
assert(
  p.splits.evaluationHoldout.expectedFamilies === 10,
  "Evaluation holdout must remain 10 families"
);
assert(
  p.splits.evaluationHoldout.allowedDuringTuning === false,
  "Evaluation holdout must be forbidden during tuning"
);
assert(
  p.splits.evaluationHoldout.requiresFrozenCandidate === true,
  "Holdout must require a frozen candidate"
);
assert(
  p.splits.evaluationHoldout.maxFinalEvaluationRuns === 1,
  "Holdout must allow one final evaluation run"
);
assert(
  p.splits.evaluationHoldout.retuningAfterViewingResults ===
    "REQUIRES_NEW_UNTOUCHED_HOLDOUT",
  "Retuning after holdout must require a new untouched holdout"
);
assert(
  p.splits.crossSplitFamilyOverlapAllowed === false,
  "Composition families may not cross splits"
);

const beatRef = p.references.beatGrid;
assert(beatRef.windowsPerFamily === 3, "Beat reference must use 3 windows");
assert(beatRef.windowSeconds === 12, "Beat reference windows must be 12 seconds");
assert(beatRef.edgeMarginSeconds === 5, "Beat reference edge margin must be 5 seconds");
assert(
  JSON.stringify(beatRef.positions) === JSON.stringify(["EARLY", "MIDDLE", "LATE"]),
  "Beat reference positions changed"
);
assert(beatRef.selection === "DETERMINISTIC_FROM_DECODED_DURATION", "Beat windows must be deterministic");
assert(beatRef.sameReferenceForV1AndV2 === true, "V1/V2 must share beat references");
assert(beatRef.metricLevelAnnotationRequired === true, "Metric level annotation is required");

assert(p.references.sections.coverage === "FULL_TRACK", "Sections must use the full track");
assert(p.references.sections.labelsRequired === false, "Section labels must remain optional");
assert(p.references.sections.internalBoundariesOnly === true, "Only internal boundaries are scored");
assert(p.references.sections.sameReferenceForV1AndV2 === true, "V1/V2 must share section references");

assert(
  p.metrics.beatGrid.primary.metric === "F_MEASURE" &&
    p.metrics.beatGrid.primary.matchingWindowSeconds === 0.07,
  "Primary beat metric must be F-measure @ 70 ms"
);
assert(
  p.metrics.beatGrid.secondary.some(
    m => m.metric === "CEMGIL" && m.sigmaSeconds === 0.04
  ),
  "Cemgil sigma must remain 40 ms"
);
assert(
  p.metrics.sections.primary.metric === "BOUNDARY_F_MEASURE" &&
    p.metrics.sections.primary.matchingWindowSeconds === 0.5,
  "Primary section metric must be boundary F-measure @ 0.5 s"
);
assert(
  p.metrics.sections.secondary.some(
    m =>
      m.metric === "BOUNDARY_F_MEASURE" &&
      m.matchingWindowSeconds === 3 &&
      m.purpose === "PERMISSIVE_DIAGNOSTIC_ONLY"
  ),
  "3 s section metric must remain diagnostic only"
);
assert(
  p.metrics.bpm.halfDoubleNeverCountsAsExact === true,
  "Half/double tempo may never be silently counted as exact"
);

assert(p.tuning.developmentOnly === true, "Tuning must remain development-only");
assert(p.tuning.maxV2CandidateConfigurations === 8, "V2 tuning budget must remain 8 candidates");
assert(p.tuning.holdoutObservationForbidden === true, "Holdout observation must remain forbidden");
assert(
  p.tuning.earlyStop === "FIRST_V2_WIN_WITH_COMPLETE_REQUIRED_REVIEW",
  "Early-stop rule changed"
);

assert(
  p.decision.aggregation === "MEDIAN_PAIRED_FAMILY_DELTA_V2_MINUS_V1",
  "Comparison must remain paired by family"
);
assert(
  p.decision.targetMetrics.beatFMeasure70ms.materialImprovement === 0.03 &&
    p.decision.targetMetrics.beatFMeasure70ms.nonInferiorityFloor === -0.02,
  "Beat comparison deltas changed"
);
assert(
  p.decision.targetMetrics.sectionFMeasure500ms.materialImprovement === 0.05 &&
    p.decision.targetMetrics.sectionFMeasure500ms.nonInferiorityFloor === -0.03,
  "Section comparison deltas changed"
);
assert(
  p.decision.developmentRule.holdoutMayOpenOnlyFor === "V2_WINS",
  "Holdout may only open after a development V2 win"
);
assert(
  p.decision.holdoutRule.retuneAfterViewingHoldoutAllowed === false,
  "Retuning after viewing holdout must remain forbidden"
);

assert(p.candidateFreeze.requiredBeforeHoldout === true, "Candidate freeze is mandatory");
assert(
  p.candidateFreeze.configurationImmutableDuringHoldout === true,
  "Frozen configuration must stay immutable during holdout"
);

assert(
  doc.includes("audio-analysis-v2-protocol.json"),
  "Opening document must reference the machine-readable protocol"
);
assert(
  doc.includes("FROZEN_PRE_TUNING"),
  "Opening document must expose the frozen protocol status"
);
assert(
  doc.includes("3 x 12 s"),
  "Opening document must state the beat-reference sampling"
);
assert(
  doc.includes("INCONCLUSIVE"),
  "Opening document must preserve the inconclusive outcome"
);

console.log("OWNED BEATS AUDIO ANALYSIS V2 PROTOCOL FREEZE: PASS");
console.log("Holdout during tuning: FORBIDDEN");
console.log("Beat reference: 3 x 12s per family");
console.log("Sections reference: full track");
console.log("Max V2 candidates: 8");
