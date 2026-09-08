"use strict";

const assert = require("node:assert/strict");
const { fixtures } = require("./fixtures");
const { buildRepresentationInput } = require("./representation/input");
const { benchmarkRepresentation } = require("./representation/benchmark");
const flat = require("./representation/flat-v1");
const remi = require("./representation/remi-plus-v1");
const compound = require("./representation/compound-word-v1");
const fame = require("./representation/fame-compound-v1");

const sequence = fixtures[0];
const phraseId = "phase5-block2-smoke:fixture-0:phrase:canonical:0+8";
const phrase = {
  schema: "fame-neural-phrase-item-v1",
  version: 1,
  phraseId,
  phraseBars: sequence.timing.bars,
  provenance: { sourceId: "phase5-block2-smoke:fixture" },
  canonical: sequence
};

const bars = Array.from({ length: sequence.timing.bars }, (_, index) => ({
  index,
  energy: 0.25 + index * 0.06,
  density: 0.30 + index * 0.05,
  vocalSpace: 0.85 - index * 0.04,
  tension: 0.20 + index * 0.07,
  rhythmicSyncopation: 0.3,
  harmonyCoverage: 0.4,
  roles: { drums: true, "808": index % 2 === 0, harmony: false, lead: true },
  counts: {},
  phraseBoundary: { before: index === 0 ? 1 : 0.2, after: index === sequence.timing.bars - 1 ? 1 : 0.3 },
  transitionStrength: { fromPrevious: index === 0 ? 0 : 0.2 + index * 0.03, toNext: index === sequence.timing.bars - 1 ? 0.2 : 0.25 + index * 0.04 },
  motif: { familyId: index < 4 ? "M1" : "M2", relation: index === 0 || index === 4 ? "new" : "variation", similarity: index === 0 || index === 4 ? 1 : 0.82 },
  harmony: {},
  bass808: {},
  kick808: {
    available: index % 2 === 0,
    kickCount: index % 2 === 0 ? 2 : 0,
    bassCount: index % 2 === 0 ? 2 : 0,
    exactCoincidenceRatio: index % 2 === 0 ? 0.5 : 0,
    proximityRatio: index % 2 === 0 ? 1 : 0,
    meanSignedLagTicks: index % 2 === 0 ? 20 : null,
    relationStrength: index % 2 === 0 ? 0.85 : 0
  },
  hats: {
    count: 6,
    closed: 6,
    open: 0,
    density: 0.375,
    rollCount: index === 2 ? 1 : 0,
    maxRollNotes: index === 2 ? 4 : 0,
    rolls: index === 2 ? [{ startTick: 120, endTick: 480, notes: 4 }] : []
  }
}));

const annotation = {
  schema: "fame-neural-musical-annotation-v1",
  version: 1,
  phraseId,
  sourceCollection: "phase5-block2-smoke",
  phraseBars: sequence.timing.bars,
  global: {},
  motifs: { familyCount: 2, returnCount: 0, variationCount: 6, families: [] },
  bars
};

const input = buildRepresentationInput(phrase, annotation);
const adapters = [flat, remi, compound, fame];
const reports = Object.fromEntries(adapters.map(adapter => [adapter.id, benchmarkRepresentation([input], adapter)]));

for (const adapter of adapters) {
  const report = reports[adapter.id];
  assert.equal(report.totals.inputs, 1, `${adapter.id}: inputs`);
  assert.equal(report.totals.benchmarked, 1, `${adapter.id}: benchmarked`);
  assert.equal(report.totals.failures, 0, `${adapter.id}: failures`);
  assert.equal(report.totals.grammarFailures, 0, `${adapter.id}: grammar`);
  assert.equal(report.totals.vocabularyFailures, 0, `${adapter.id}: vocabulary`);
  assert.equal(report.reconstruction.structureExactRate, 1, `${adapter.id}: structure`);
}

assert.equal(reports["flat-poc-v1"].phase4.supportedFeatureCount, 3);
assert.equal(reports["remi-plus-v1"].phase4.supportedFeatureCount, 0);
assert.equal(reports["compound-word-v1"].phase4.supportedFeatureCount, 4);
assert.equal(reports["fame-compound-v1"].phase4.supportedFeatureCount, 8);
assert.equal(reports["remi-plus-v1"].totals.canonicalRoundTripFailures, 0);
assert.equal(reports["compound-word-v1"].totals.canonicalRoundTripFailures, 0);
assert.equal(reports["fame-compound-v1"].totals.canonicalRoundTripFailures, 0);
assert.ok(reports["compound-word-v1"].context.meanUnitsPerBar < reports["flat-poc-v1"].context.meanUnitsPerBar);
assert.ok(reports["fame-compound-v1"].context.meanUnitsPerBar < reports["flat-poc-v1"].context.meanUnitsPerBar);
assert.ok(reports["fame-compound-v1"].phase4.numericMae <= 0.06);

console.log("FASE 5 / BLOCCO 2 / REPRESENTATION ADAPTERS");
console.log("FLAT BASELINE RE-RUN: OK");
console.log("REMI+ ADAPTER: OK");
console.log("COMPOUND WORD ADAPTER: OK");
console.log("FAME COMPOUND CUSTOM: OK");
console.log("PHASE4 FEATURE COVERAGE 3/0/4/8: OK");
console.log("NEW ADAPTER ROUND-TRIP STABILITY: OK");
console.log("PHASE5 BLOCK2 SMOKE TEST: OK");
