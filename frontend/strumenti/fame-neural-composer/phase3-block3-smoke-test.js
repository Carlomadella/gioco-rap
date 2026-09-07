"use strict";

const assert = require("node:assert/strict");
const { auditItems } = require("./dataset/auditor");

function sequence(events, bars = 4, bpm = 140) {
  return {
    schema: "fame-neural-sequence-v1",
    version: 1,
    timing: { ppq: 960, bpm, bars },
    events
  };
}

function validItem(index, canonical, overrides = {}) {
  const hex = (index % 16).toString(16);
  const sha = (overrides.sha || hex.repeat(64)).slice(0, 64);
  return {
    schema: "fame-neural-dataset-item-v1",
    version: 1,
    itemId: overrides.itemId || `phase3-block3-item-${index}`,
    source: { sha256: sha },
    provenance: {
      sourceId: overrides.sourceId || `phase3-block3-source-${index}`,
      creator: "FAME Neural Phase 3 Block 3 Fixture",
      licenseId: "FAME-ORIGINAL-TEST",
      compositionFamily: overrides.family || `phase3-block3-family-${index}`,
      rightsEvidence: ["Fixture sintetica BLOCCO 3."],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    rights: {
      status: "commercial-cleared",
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    import: {
      status: "ok",
      analysis: { skippedTracks: overrides.skippedTracks || [] }
    },
    eligibility: { technical: true, commercialTraining: true },
    canonical
  };
}

function wrap(items) {
  return items.map((item, index) => ({ fileName: `block3-${index}.dataset-item.json`, item }));
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
    { type: "lead", tick: 2160, note: 67, durationTicks: 480, velocity: 0.7 }
  ];
}

function variedFourBars() {
  const out = [];
  for (let bar = 0; bar < 4; bar += 1) {
    const o = bar * 3840;
    out.push({ type: "kick", tick: o + bar * 120, velocity: 0.9 });
    out.push({ type: "snare", tick: o + 960, velocity: 0.8 });
    out.push({ type: "lead", tick: o + 1200 + bar * 120, note: 60 + bar * 2, durationTicks: 240, velocity: 0.7 });
  }
  return out;
}

function repeatedFourBars() {
  const out = [];
  for (let bar = 0; bar < 4; bar += 1) {
    const o = bar * 3840;
    out.push({ type: "kick", tick: o, velocity: 0.9 });
    out.push({ type: "snare", tick: o + 960, velocity: 0.8 });
    out.push({ type: "lead", tick: o + 1200, note: 60, durationTicks: 240, velocity: 0.7 });
  }
  return out;
}

const similarityOff = { similarity: { enabled: false } };

console.log("FASE 3 / BLOCCO 3");

const clean = auditItems(wrap([
  validItem(1, sequence(variedFourBars()), { family: "b3-clean-a", sha: "1".repeat(64) }),
  validItem(2, sequence([...variedFourBars(), { type: "hat_open", tick: 15000, velocity: 0.5 }]), { family: "b3-clean-b", sha: "2".repeat(64) })
]), similarityOff);
assert.equal(clean.block3Ready, true);
assert.equal(clean.internalQuality.totals.blockingItems, 0);
console.log("CLEAN INTERNAL QUALITY: OK");

const duplicated = baseEvents().flatMap(event => [event, { ...event, velocity: Math.max(0.1, event.velocity - 0.1) }]);
const duplicateLayer = auditItems(wrap([
  validItem(3, sequence(duplicated, 2), { family: "b3-dup-a", sha: "3".repeat(64) })
]), similarityOff);
assert.equal(duplicateLayer.internalQuality.totals.blockingItems, 1);
assert.equal(duplicateLayer.block3Ready, false);
assert.equal(duplicateLayer.block2Ready, true);
console.log("DUPLICATE LAYER SUSPECT: OK");

const repetitive = auditItems(wrap([
  validItem(4, sequence(repeatedFourBars()), { family: "b3-repeat-a", sha: "4".repeat(64) })
]), similarityOff);
assert.equal(repetitive.internalQuality.totals.blockingItems, 0);
assert.equal(repetitive.internalQuality.totals.repeatedBarReviewItems, 1);
assert.equal(repetitive.block3Ready, true);
console.log("REPEATED BAR REVIEW NON-BLOCKING: OK");

const skipped = auditItems(wrap([
  validItem(5, sequence(variedFourBars()), {
    family: "b3-skip-a",
    sha: "5".repeat(64),
    skippedTracks: [{ trackIndex: 2, noteCount: 12 }]
  })
]), similarityOff);
assert.equal(skipped.internalQuality.totals.reviewItems, 1);
assert.equal(skipped.block3Ready, true);
console.log("SKIPPED MELODIC NOTES REVIEW: OK");

console.log("FASE 3 BLOCCO 3 SMOKE TEST: OK");
