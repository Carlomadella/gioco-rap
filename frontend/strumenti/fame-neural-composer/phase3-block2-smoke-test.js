"use strict";

const assert = require("node:assert/strict");
const { auditItems } = require("./dataset/auditor");

function sequence(events, bars = 2, bpm = 140) {
  return {
    schema: "fame-neural-sequence-v1",
    version: 1,
    timing: { ppq: 960, bpm, bars },
    events
  };
}

function validItem(index, canonical, overrides = {}) {
  const char = String((index % 10 + 10) % 10);
  const sha = (overrides.sha || char.repeat(64)).slice(0, 64);
  return {
    schema: "fame-neural-dataset-item-v1",
    version: 1,
    itemId: overrides.itemId || `phase3b2-item-${index}`,
    source: { sha256: sha },
    provenance: {
      sourceId: overrides.sourceId || `phase3b2-source-${index}`,
      creator: "FAME Neural Phase 3 Block 2 Fixture",
      licenseId: "FAME-ORIGINAL-TEST",
      compositionFamily: overrides.family || `phase3b2-family-${index}`,
      rightsEvidence: ["Fixture sintetica del test FASE 3 BLOCCO 2."],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    rights: {
      status: "commercial-cleared",
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    import: { status: "ok" },
    eligibility: { technical: true, commercialTraining: true },
    canonical
  };
}

function baseEvents() {
  return [
    { type: "kick", tick: 0, velocity: 0.9 },
    { type: "808", tick: 0, note: 36, durationTicks: 720, velocity: 0.8 },
    { type: "hat_closed", tick: 480, velocity: 0.6 },
    { type: "lead", tick: 720, note: 60, durationTicks: 240, velocity: 0.7 },
    { type: "snare", tick: 960, velocity: 0.8 },
    { type: "lead", tick: 1200, note: 63, durationTicks: 240, velocity: 0.7 },
    { type: "kick", tick: 1920, velocity: 0.9 },
    { type: "lead", tick: 2160, note: 67, durationTicks: 480, velocity: 0.7 },
    { type: "hat_closed", tick: 2400, velocity: 0.6 },
    { type: "snare", tick: 2880, velocity: 0.8 }
  ];
}

function reviewVariant() {
  let events = baseEvents().map(event => ({ ...event }));
  events.splice(2, 1);
  events = events.map((event, index) => index % 3 === 0 ? { ...event, tick: event.tick + 120 } : event);
  for (const event of events) {
    if (event.type === "lead" && event.note != null) event.note += 1;
  }
  events.push({ type: "hat_open", tick: 3300, velocity: 0.55 });
  events.push({ type: "kick", tick: 3500, velocity: 0.82 });
  return events;
}

function partialArrangement() {
  return [
    ...baseEvents().map(event => ({ ...event })),
    { type: "hat_open", tick: 3240, velocity: 0.55 },
    { type: "lead", tick: 3480, note: 70, durationTicks: 240, velocity: 0.62 }
  ];
}

function sameRhythmDifferentPitch() {
  const replacements = [36, 84, 40, 51];
  let pitchIndex = 0;
  return baseEvents().map(event => {
    if (event.note == null) return { ...event };
    const next = { ...event, note: replacements[pitchIndex % replacements.length] };
    pitchIndex += 1;
    return next;
  });
}

function unrelatedEvents() {
  return [
    { type: "kick", tick: 240, velocity: 0.9 },
    { type: "hat_closed", tick: 720, velocity: 0.6 },
    { type: "snare", tick: 1440, velocity: 0.8 },
    { type: "808", tick: 1680, note: 41, durationTicks: 300, velocity: 0.8 },
    { type: "lead", tick: 2600, note: 72, durationTicks: 120, velocity: 0.7 },
    { type: "hat_open", tick: 3000, velocity: 0.6 },
    { type: "kick", tick: 3500, velocity: 0.9 },
    { type: "lead", tick: 3700, note: 55, durationTicks: 120, velocity: 0.7 }
  ];
}

function wrap(items) {
  return items.map((item, index) => ({ fileName: `block2-fixture-${index}.dataset-item.json`, item }));
}

console.log("FASE 3 / BLOCCO 2");

const clean = auditItems(wrap([
  validItem(1, sequence(baseEvents()), { family: "clean-a", sha: "1".repeat(64) }),
  validItem(2, sequence(unrelatedEvents()), { family: "clean-b", sha: "2".repeat(64) })
]));
assert.equal(clean.block1Ready, true);
assert.equal(clean.block2Ready, true);
assert.equal(clean.duplicates.fuzzyNearDuplicates.blockingPairs.length, 0);
assert.equal(clean.duplicates.fuzzyNearDuplicates.reviewPairs.length, 0);
console.log("UNRELATED CORPUS: OK");

const review = auditItems(wrap([
  validItem(3, sequence(baseEvents()), { family: "review-a", sha: "3".repeat(64) }),
  validItem(4, sequence(reviewVariant()), { family: "review-b", sha: "4".repeat(64) })
]));
assert.equal(review.block1Ready, true);
assert.equal(review.block2Ready, true);
assert.equal(review.duplicates.fuzzyNearDuplicates.reviewPairs.length, 1);
assert.equal(review.duplicates.fuzzyNearDuplicates.blockingPairs.length, 0);
console.log("FUZZY REVIEW TIER: OK");

const partial = auditItems(wrap([
  validItem(5, sequence(baseEvents()), { family: "partial-a", sha: "5".repeat(64) }),
  validItem(6, sequence(partialArrangement()), { family: "partial-b", sha: "6".repeat(64) })
]));
assert.equal(partial.block1Ready, true);
assert.equal(partial.block2Ready, false);
assert.equal(partial.duplicates.fuzzyNearDuplicates.blockingPairs.length, 1);
const partialSplits = new Set(partial.splitManifest.items.map(item => item.split));
assert.equal(partialSplits.size, 1);
assert.equal(partial.splitManifest.leakageSafe, true);
console.log("PARTIAL ARRANGEMENT BLOCK + SPLIT SAFETY: OK");

const pitchDivergent = auditItems(wrap([
  validItem(7, sequence(baseEvents()), { family: "pitch-a", sha: "7".repeat(64) }),
  validItem(8, sequence(sameRhythmDifferentPitch()), { family: "pitch-b", sha: "8".repeat(64) })
]));
assert.equal(pitchDivergent.duplicates.fuzzyNearDuplicates.reviewPairs.length, 0);
assert.equal(pitchDivergent.duplicates.fuzzyNearDuplicates.blockingPairs.length, 0);
console.log("RHYTHM-ONLY FALSE POSITIVE GUARD: OK");

console.log("FASE 3 BLOCCO 2 SMOKE TEST: OK");
