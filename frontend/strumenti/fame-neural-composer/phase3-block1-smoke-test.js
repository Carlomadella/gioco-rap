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
    itemId: overrides.itemId || `phase3-item-${index}`,
    source: { sha256: sha },
    provenance: {
      sourceId: overrides.sourceId || `phase3-source-${index}`,
      creator: "FAME Neural Phase 3 Fixture",
      licenseId: "FAME-ORIGINAL-TEST",
      compositionFamily: overrides.family || `family-${index}`,
      rightsEvidence: ["Fixture sintetica del test FASE 3."],
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

function eventsA(shift = 0) {
  return [
    { type: "kick", tick: 0, velocity: 0.9 },
    { type: "808", tick: 0, note: 36 + shift, durationTicks: 720, velocity: 0.8 },
    { type: "hat_closed", tick: 480, velocity: 0.6 },
    { type: "lead", tick: 720, note: 60 + shift, durationTicks: 240, velocity: 0.7 },
    { type: "snare", tick: 960, velocity: 0.8 },
    { type: "lead", tick: 1200, note: 63 + shift, durationTicks: 240, velocity: 0.7 },
    { type: "kick", tick: 1920, velocity: 0.9 },
    { type: "lead", tick: 2160, note: 67 + shift, durationTicks: 480, velocity: 0.7 }
  ];
}

function eventsB() {
  return [
    { type: "kick", tick: 0, velocity: 0.9 },
    { type: "808", tick: 240, note: 41, durationTicks: 480, velocity: 0.8 },
    { type: "hat_closed", tick: 480, velocity: 0.6 },
    { type: "snare", tick: 960, velocity: 0.8 },
    { type: "lead", tick: 1440, note: 69, durationTicks: 360, velocity: 0.7 },
    { type: "kick", tick: 2040, velocity: 0.9 },
    { type: "hat_open", tick: 2400, velocity: 0.6 },
    { type: "lead", tick: 2880, note: 72, durationTicks: 240, velocity: 0.7 }
  ];
}

function wrap(items) {
  return items.map((item, index) => ({ fileName: `fixture-${index}.dataset-item.json`, item }));
}

console.log("FASE 3 / BLOCCO 1");

const clean = auditItems(wrap([
  validItem(1, sequence(eventsA()), { family: "family-a" }),
  validItem(2, sequence(eventsB()), { family: "family-b" }),
  validItem(3, sequence([...eventsB(), { type: "lead", tick: 3360, note: 76, durationTicks: 240, velocity: 0.6 }], 2, 146), { family: "family-c" })
]));
assert.equal(clean.block1Ready, true);
assert.equal(clean.splitManifest.leakageSafe, true);
console.log("CLEAN CORPUS: OK");

const exact = auditItems(wrap([
  validItem(4, sequence(eventsA()), { family: "family-d", sha: "4".repeat(64) }),
  validItem(5, sequence(eventsA()), { family: "family-e", sha: "5".repeat(64) })
]));
assert.equal(exact.duplicates.exactMusic.length, 1);
assert.equal(exact.block1Ready, false);
assert.equal(exact.splitManifest.leakageSafe, true);
assert.equal(exact.splitManifest.items[0].split, exact.splitManifest.items[1].split);
console.log("EXACT CANONICAL DUPLICATE: OK");

const transposed = auditItems(wrap([
  validItem(6, sequence(eventsA(0)), { family: "family-f", sha: "6".repeat(64) }),
  validItem(7, sequence(eventsA(5)), { family: "family-g", sha: "7".repeat(64) })
]));
assert.equal(transposed.duplicates.transpositionEquivalent.length, 1);
assert.equal(transposed.block1Ready, false);
assert.equal(transposed.splitManifest.leakageSafe, true);
assert.equal(transposed.splitManifest.items[0].split, transposed.splitManifest.items[1].split);
console.log("TRANSPOSITION EQUIVALENCE: OK");

const sameFamily = auditItems(wrap([
  validItem(8, sequence(eventsA()), { family: "family-shared", sha: "8".repeat(64) }),
  validItem(9, sequence(eventsB()), { family: "family-shared", sha: "9".repeat(64) }),
  validItem(0, sequence([...eventsB(), { type: "lead", tick: 3500, note: 80, durationTicks: 120, velocity: 0.5 }]), { family: "family-other", sha: "0".repeat(64), itemId: "phase3-item-10" })
]));
const sharedSplits = new Set(sameFamily.splitManifest.items.filter(item => item.compositionFamily === "family-shared").map(item => item.split));
assert.equal(sharedSplits.size, 1);
assert.equal(sameFamily.splitManifest.leakageSafe, true);
console.log("COMPOSITION FAMILY SPLIT SAFETY: OK");

const sparse = auditItems(wrap([
  validItem(11, sequence([{ type: "kick", tick: 0, velocity: 1 }]), { family: "family-sparse", sha: "a".repeat(64) })
]));
assert.equal(sparse.qualityFlags.length, 1);
console.log("QUALITY FLAG: OK");

console.log("FASE 3 BLOCCO 1 SMOKE TEST: OK");
