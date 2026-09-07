"use strict";

const assert = require("node:assert/strict");
const { curateEntries } = require("./dataset/curation");

function sequence(events, bars = 4, bpm = 140) {
  return { schema: "fame-neural-sequence-v1", version: 1, timing: { ppq: 960, bpm, bars }, events };
}

function validItem(index, canonical, overrides = {}) {
  const hex = (index % 16).toString(16);
  return {
    schema: "fame-neural-dataset-item-v1",
    version: 1,
    itemId: overrides.itemId || `phase3-block4-item-${index}`,
    source: { sha256: (overrides.sha || hex.repeat(64)).slice(0, 64) },
    provenance: {
      sourceId: `phase3-block4-source-${index}`,
      creator: "FAME Neural Phase 3 Block 4 Fixture",
      licenseId: "FAME-ORIGINAL-TEST",
      compositionFamily: overrides.family || `phase3-block4-family-${index}`,
      rightsEvidence: ["Fixture sintetica BLOCCO 4."],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    rights: {
      status: "commercial-cleared",
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    import: { status: "ok", analysis: { skippedTracks: overrides.skippedTracks || [] } },
    eligibility: { technical: true, commercialTraining: true },
    canonical
  };
}

function variedEvents(seed = 0) {
  const out = [];
  for (let bar = 0; bar < 4; bar += 1) {
    const o = bar * 3840;
    out.push({ type: "kick", tick: o + (bar + seed) * 120, velocity: 0.9 });
    out.push({ type: "snare", tick: o + 960, velocity: 0.8 });
    out.push({ type: "lead", tick: o + 1320 + bar * 120, note: 60 + seed + bar * 2, durationTicks: 240, velocity: 0.7 });
  }
  return out;
}

function repeatedEvents() {
  const out = [];
  for (let bar = 0; bar < 4; bar += 1) {
    const o = bar * 3840;
    out.push({ type: "kick", tick: o, velocity: 0.9 });
    out.push({ type: "snare", tick: o + 960, velocity: 0.8 });
    out.push({ type: "lead", tick: o + 1200, note: 60, durationTicks: 240, velocity: 0.7 });
  }
  return out;
}

function duplicateLayerEvents() {
  const base = [
    { type: "kick", tick: 0, velocity: 0.9 },
    { type: "808", tick: 0, note: 36, durationTicks: 720, velocity: 0.8 },
    { type: "hat_closed", tick: 480, velocity: 0.6 },
    { type: "lead", tick: 720, note: 60, durationTicks: 240, velocity: 0.7 },
    { type: "snare", tick: 960, velocity: 0.8 },
    { type: "lead", tick: 1200, note: 63, durationTicks: 240, velocity: 0.7 },
    { type: "kick", tick: 1920, velocity: 0.9 },
    { type: "lead", tick: 2160, note: 67, durationTicks: 480, velocity: 0.7 }
  ];
  return base.flatMap(event => [event, { ...event, velocity: Math.max(0.1, event.velocity - 0.1) }]);
}

function wrap(items) {
  return items.map((item, index) => ({ fileName: `block4-${index}.dataset-item.json`, item }));
}

const auditOptions = { similarity: { enabled: false } };
const curationOptions = { minAcceptedForTrainingSubset: 2, targetMinPhrases: 500 };

console.log("FASE 3 / BLOCCO 4");

const cleanEntries = wrap([
  validItem(1, sequence(variedEvents(0)), { sha: "1".repeat(64) }),
  validItem(2, sequence(variedEvents(3)), { sha: "2".repeat(64) }),
  validItem(3, sequence(variedEvents(6)), { sha: "3".repeat(64) })
]);
const clean = curateEntries(cleanEntries, {}, curationOptions, auditOptions);
assert.equal(clean.block4Ready, true);
assert.equal(clean.totals.accepted, 3);
assert.equal(clean.totals.hold, 0);
assert.equal(clean.trainingSubsetReady, true);
assert.equal(clean.manifest.targetReached, false);
assert.equal(clean.gate1Candidate, false);
console.log("CLEAN AUTO-ACCEPT + MANIFEST: OK");

const reviewEntries = wrap([
  validItem(4, sequence(repeatedEvents()), { sha: "4".repeat(64) }),
  validItem(5, sequence(variedEvents(8)), { sha: "5".repeat(64) })
]);
const review = curateEntries(reviewEntries, {}, { minAcceptedForTrainingSubset: 1, targetMinPhrases: 500 }, auditOptions);
assert.equal(review.block4Ready, true);
assert.equal(review.totals.hold, 1);
assert.equal(review.reviewQueue.totals.items, 1);
console.log("REVIEW -> HOLD: OK");

const reviewId = review.dispositions.find(item => item.status === "hold").itemId;
const acceptedReview = curateEntries(
  reviewEntries,
  {
    schema: "fame-neural-curation-decisions-v1",
    version: 1,
    reviewer: "phase3-test",
    decisions: [{ itemId: reviewId, action: "accept", reason: "ripetizione intenzionale verificata nel fixture" }]
  },
  { minAcceptedForTrainingSubset: 1, targetMinPhrases: 500 },
  auditOptions
);
assert.equal(acceptedReview.block4Ready, true);
assert.equal(acceptedReview.totals.hold, 0);
assert.equal(acceptedReview.totals.accepted, 2);
console.log("MANUAL REVIEW ACCEPT: OK");

const blockedEntries = wrap([
  validItem(6, sequence(duplicateLayerEvents(), 2), { sha: "6".repeat(64) })
]);
const blocked = curateEntries(
  blockedEntries,
  {
    schema: "fame-neural-curation-decisions-v1",
    version: 1,
    reviewer: "phase3-test",
    decisions: [{ itemId: "phase3-block4-item-6", action: "accept", reason: "tentativo non consentito" }]
  },
  { minAcceptedForTrainingSubset: 1, targetMinPhrases: 500 },
  auditOptions
);
assert.equal(blocked.totals.blocked, 1);
assert.equal(blocked.block4Ready, false);
assert.ok(blocked.decisionErrors.some(error => error.includes("impossibile accettare")));
console.log("ABSOLUTE BLOCK CANNOT BE ACCEPTED: OK");

const duplicateEntries = wrap([
  validItem(7, sequence(variedEvents(1)), { sha: "7".repeat(64), family: "dup-a" }),
  validItem(8, sequence(variedEvents(1)), { sha: "8".repeat(64), family: "dup-b" })
]);
const duplicateInitial = curateEntries(duplicateEntries, {}, { minAcceptedForTrainingSubset: 1, targetMinPhrases: 500 }, auditOptions);
assert.equal(duplicateInitial.totals.hold, 2);

const resolvedDuplicate = curateEntries(
  duplicateEntries,
  {
    schema: "fame-neural-curation-decisions-v1",
    version: 1,
    reviewer: "phase3-test",
    decisions: [
      { itemId: "phase3-block4-item-7", action: "accept", reason: "keeper canonico scelto" },
      { itemId: "phase3-block4-item-8", action: "reject", reason: "duplicato rimosso" }
    ]
  },
  { minAcceptedForTrainingSubset: 1, targetMinPhrases: 500 },
  auditOptions
);
assert.equal(resolvedDuplicate.block4Ready, true);
assert.equal(resolvedDuplicate.totals.accepted, 1);
assert.equal(resolvedDuplicate.totals.rejected, 1);
assert.equal(resolvedDuplicate.trainingSubsetReady, true);
console.log("RELATIONAL DUPLICATE KEEPER POLICY: OK");

console.log("FASE 3 BLOCCO 4 SMOKE TEST: OK");
