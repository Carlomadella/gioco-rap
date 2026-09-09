"use strict";

const assert = require("node:assert/strict");
const registry = require("./dataset/task-admissibility-policy.v1.json");
const {
  validateTaskPolicyRegistry,
  getTaskPolicy,
  evaluateTaskAdmissibility,
  summarizeDecisions,
  selectAllowedDecisions,
  readinessForTask
} = require("./dataset/task-admissibility");

function assertion(state, ref) {
  return { state, evidenceRefs: ref ? [ref] : [] };
}

function ccFixture({
  usage = "allowed",
  drums = "present",
  groove = "verified",
  technical = "pass",
  roleFit = "pass",
  domainTrap = "pass",
  musicalCoherence = "pass",
  rappability = "pass"
} = {}) {
  return {
    usage: {
      pretraining: assertion(usage, "ev:usage"),
      debug: assertion(usage, "ev:usage"),
      augmentation: assertion("unknown"),
      musicalTarget: assertion(usage, "ev:usage")
    },
    observedContent: {
      drums: assertion(drums, "ev:drums"),
      lowEnd: assertion("unknown"),
      harmony: assertion("unknown"),
      lead: assertion("unknown")
    },
    capabilities: {
      DRUM_GROOVE: assertion(groove, groove === "unknown" ? null : "ev:groove"),
      DRUM_FILL: assertion("unknown"),
      LOW_END: assertion("unknown"),
      TONAL_HARMONY: assertion("unknown"),
      TONAL_MELODY: assertion("unknown"),
      FULL_ARRANGEMENT: assertion("unknown")
    },
    quality: {
      technical: assertion(technical, technical === "unknown" ? null : "ev:technical"),
      roleFit: assertion(roleFit, roleFit === "unknown" ? null : "ev:roleFit"),
      domainTrap: assertion(domainTrap, domainTrap === "unknown" ? null : "ev:domainTrap"),
      musicalCoherence: assertion(musicalCoherence, musicalCoherence === "unknown" ? null : "ev:coherence"),
      rappability: assertion(rappability, rappability === "unknown" ? null : "ev:rappability")
    },
    evidence: []
  };
}

function overlayFixture(cc = ccFixture()) {
  return {
    phraseId: "fixture:001",
    linkage: {
      sourceId: "gmd-v1.0.0:fixture",
      compositionFamily: "fixture-family"
    },
    contentCapabilities: cc
  };
}

function phraseFixture(rights = true) {
  return {
    rights: {
      commercialTrainingAllowed: rights,
      commercialOutputAllowed: rights
    },
    provenance: {
      commercialTrainingAllowed: rights,
      commercialOutputAllowed: rights
    }
  };
}

const validation = validateTaskPolicyRegistry(registry);
assert.equal(validation.ok, true, validation.errors.join("; "));

const pretraining = getTaskPolicy(registry, "drum-groove-pretraining-v1");

const allowed = evaluateTaskAdmissibility(overlayFixture(), pretraining, {
  phrase: phraseFixture(true),
  sourceCollectionId: "gmd-v1.0.0"
});
assert.equal(allowed.decision, "allowed");
assert.deepEqual(allowed.reasons, []);

const candidate = evaluateTaskAdmissibility(
  overlayFixture(ccFixture({ usage: "candidate" })),
  pretraining,
  { phrase: phraseFixture(true), sourceCollectionId: "gmd-v1.0.0" }
);
assert.equal(candidate.decision, "unknown");
assert.ok(candidate.reasons.some(item => item.code === "USAGE_CANDIDATE"));

const unknownCapability = evaluateTaskAdmissibility(
  overlayFixture(ccFixture({ groove: "unknown" })),
  pretraining,
  { phrase: phraseFixture(true), sourceCollectionId: "gmd-v1.0.0" }
);
assert.equal(unknownCapability.decision, "unknown");
assert.ok(unknownCapability.reasons.some(item => item.code === "CAPABILITY_UNKNOWN"));

const noDrums = evaluateTaskAdmissibility(
  overlayFixture(ccFixture({ drums: "not_observed" })),
  pretraining,
  { phrase: phraseFixture(true), sourceCollectionId: "gmd-v1.0.0" }
);
assert.equal(noDrums.decision, "blocked");
assert.ok(noDrums.reasons.some(item => item.code === "OBSERVED_CONTENT_NOT_PRESENT"));

const qualityFail = evaluateTaskAdmissibility(
  overlayFixture(ccFixture({ roleFit: "fail" })),
  pretraining,
  { phrase: phraseFixture(true), sourceCollectionId: "gmd-v1.0.0" }
);
assert.equal(qualityFail.decision, "blocked");
assert.ok(qualityFail.reasons.some(item => item.code === "QUALITY_FAIL"));

const rightsBlocked = evaluateTaskAdmissibility(
  overlayFixture(),
  pretraining,
  { phrase: phraseFixture(false), sourceCollectionId: "gmd-v1.0.0" }
);
assert.equal(rightsBlocked.decision, "blocked");
assert.ok(rightsBlocked.reasons.some(item => item.code === "RIGHTS_TRAINING_BLOCKED"));

const usageBlocked = evaluateTaskAdmissibility(
  overlayFixture(ccFixture({ usage: "blocked" })),
  pretraining,
  { phrase: phraseFixture(true), sourceCollectionId: "gmd-v1.0.0" }
);
assert.equal(usageBlocked.decision, "blocked");
assert.ok(usageBlocked.reasons.some(item => item.code === "USAGE_BLOCKED"));

const sourceRestrictedPolicy = {
  ...pretraining,
  taskId: "source-restricted-fixture",
  sourceCollections: { allow: ["gmd-v1.0.0"], block: [] }
};
const sourceBlocked = evaluateTaskAdmissibility(
  overlayFixture(),
  sourceRestrictedPolicy,
  { phrase: phraseFixture(true), sourceCollectionId: "pdmx-v2025" }
);
assert.equal(sourceBlocked.decision, "blocked");
assert.ok(sourceBlocked.reasons.some(item => item.code === "SOURCE_COLLECTION_NOT_ALLOWED"));

const missingSource = evaluateTaskAdmissibility(
  overlayFixture(),
  sourceRestrictedPolicy,
  { phrase: phraseFixture(true), sourceCollectionId: null }
);
assert.equal(missingSource.decision, "unknown");
assert.ok(missingSource.reasons.some(item => item.code === "SOURCE_COLLECTION_UNKNOWN"));

const mixed = [allowed, candidate, noDrums, rightsBlocked];
assert.deepEqual(summarizeDecisions(mixed).counts, {
  allowed: 1,
  blocked: 2,
  unknown: 1
});
assert.deepEqual(selectAllowedDecisions(mixed).map(item => item.subjectPhraseId), ["fixture:001"]);

assert.deepEqual(
  readinessForTask(getTaskPolicy(registry, "debug-smoke-v1"), { allowed: 47, blocked: 0, unknown: 455 }),
  { taskReady: true, trainingReady: null }
);
assert.deepEqual(
  readinessForTask(pretraining, { allowed: 0, blocked: 333, unknown: 169 }),
  { taskReady: false, trainingReady: false }
);
assert.deepEqual(
  readinessForTask(pretraining, { allowed: 1, blocked: 0, unknown: 0 }),
  { taskReady: true, trainingReady: true }
);

assert.deepEqual(
  evaluateTaskAdmissibility(overlayFixture(), pretraining, {
    phrase: phraseFixture(true),
    sourceCollectionId: "gmd-v1.0.0"
  }),
  allowed
);

console.log("FASE 7A / BLOCCO 3 / TASK ADMISSIBILITY");
console.log("Policy registry validation: OK");
console.log("Allowed path: OK");
console.log("Candidate -> unknown / fail closed: OK");
console.log("Unknown capability -> unknown / fail closed: OK");
console.log("Observed content blocker: OK");
console.log("Quality blocker: OK");
console.log("Rights blocker: OK");
console.log("Usage blocker: OK");
console.log("Source restriction blocker/unknown: OK");
console.log("Only allowed enters selector: OK");
console.log("Task readiness vs training readiness semantics: OK");
console.log("Deterministic decision: OK");
console.log("FASE 7A BLOCCO 3 TASK ADMISSIBILITY SMOKE TEST: OK");
