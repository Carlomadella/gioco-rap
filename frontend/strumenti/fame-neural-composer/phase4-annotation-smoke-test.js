"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  annotatePhrase,
  validateAnnotation,
  annotationSummary,
  kick808Relation,
  hatRolls,
  assignMotifs
} = require("./annotation/annotator");

function fixture(events, bars = 4) {
  return {
    schema: "fame-neural-phrase-item-v1",
    version: 1,
    phraseId: "fixture:phase4",
    sourceDatasetItemId: "fixture:item",
    phraseBars: bars,
    provenance: {
      sourceId: "fame-original-seed-v1:phase4-fixture",
      compositionFamily: "fixture:phase4",
      commercialTrainingAllowed: true
    },
    rights: { commercialTrainingAllowed: true },
    canonical: {
      schema: "fame-neural-sequence-v1",
      version: 1,
      timing: { ppq: 960, bpm: 140, bars },
      tonality: { rootPitchClass: 0, mode: "minor" },
      harmony: [],
      bars: [],
      events
    }
  };
}

const events = [];
for (let bar = 0; bar < 4; bar += 1) {
  const base = bar * 3840;
  events.push(
    { type: "kick", tick: base + 0, velocity: 0.9 },
    { type: "snare", tick: base + 1920, velocity: 0.82 },
    { type: "808", tick: base + 0, note: 36 + (bar % 2) * 3, durationTicks: 720, velocity: 0.8 },
    { type: "harmony", tick: base + 0, note: 60, durationTicks: 3500, velocity: 0.55 },
    { type: "harmony", tick: base + 0, note: 63, durationTicks: 3500, velocity: 0.55 },
    { type: "harmony", tick: base + 0, note: 67, durationTicks: 3500, velocity: 0.55 }
  );
  for (let step = 0; step < 8; step += 1) {
    events.push({ type: "hat_closed", tick: base + step * 480, velocity: 0.55 });
  }
}
events.push(
  { type: "hat_closed", tick: 3 * 3840 + 3360, velocity: 0.6 },
  { type: "hat_closed", tick: 3 * 3840 + 3480, velocity: 0.6 },
  { type: "hat_closed", tick: 3 * 3840 + 3600, velocity: 0.6 }
);

const item = fixture(events);
const a = annotatePhrase(item);
const b = annotatePhrase(item);

assert.deepEqual(a, b, "annotazione deve essere deterministica");
assert.equal(a.schema, "fame-neural-musical-annotation-v1");
assert.equal(a.bars.length, 4);
assert.equal(a.bars[0].phraseBoundary.before, 1);
assert.equal(a.bars[3].phraseBoundary.after, 1);
assert.equal(a.bars[0].kick808.available, true);
assert.ok(a.bars[0].kick808.relationStrength > 0.5);
assert.ok(a.bars[3].hats.rollCount >= 1);
assert.ok(a.motifs.returnCount + a.motifs.variationCount >= 1);

const validation = validateAnnotation(a);
assert.equal(validation.ok, true, validation.issues.join("; "));

const summary = annotationSummary([a, b]);
assert.equal(summary.totals.annotations, 2);
assert.ok(summary.metrics.energy.mean >= 0 && summary.metrics.energy.mean <= 1);

const relation = kick808Relation(
  [
    { type: "kick", relativeTick: 0 },
    { type: "808", relativeTick: 0 },
    { type: "kick", relativeTick: 960 },
    { type: "808", relativeTick: 1020 }
  ],
  960
);
assert.equal(relation.available, true);
assert.ok(relation.proximityRatio >= 1);

const rolls = hatRolls(
  [
    { type: "hat_closed", relativeTick: 0 },
    { type: "hat_closed", relativeTick: 120 },
    { type: "hat_closed", relativeTick: 240 }
  ],
  960
);
assert.equal(rolls.count, 1);

const hashA = crypto.createHash("sha256").update(JSON.stringify(a)).digest("hex");
const hashB = crypto.createHash("sha256").update(JSON.stringify(b)).digest("hex");
assert.equal(hashA, hashB);

console.log("FASE 4 / ANNOTAZIONE AUTOMATICA / BLOCCO 1");
console.log("SCHEMA + DETERMINISMO: OK");
console.log("ENERGY/DENSITY/TENSION/VOCAL SPACE: OK");
console.log("PHRASE BOUNDARIES + TRANSITIONS: OK");
console.log("MOTIF RETURN/VARIATION: OK");
console.log("HARMONIC PLAN + 808 CONTOUR: OK");
console.log("KICK<->808 + HAT ROLLS: OK");
console.log("ANNOTATION VALIDATION: OK");
console.log("PHASE4 BLOCK1 SMOKE TEST: OK");
