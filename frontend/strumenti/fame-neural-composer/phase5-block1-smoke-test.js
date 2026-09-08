"use strict";

const assert = require("node:assert/strict");
const { fixtures } = require("./fixtures");
const { buildRepresentationInput } = require("./representation/input");
const flat = require("./representation/flat-v1");
const { benchmarkRepresentation } = require("./representation/benchmark");

const sequence = fixtures[0];
const phraseId = "phase5-smoke:fixture-0:phrase:canonical:0+8";
const phrase = {
  schema: "fame-neural-phrase-item-v1",
  version: 1,
  phraseId,
  phraseBars: sequence.timing.bars,
  provenance: { sourceId: "phase5-smoke:fixture" },
  canonical: sequence
};
const annotation = {
  schema: "fame-neural-musical-annotation-v1",
  version: 1,
  phraseId,
  sourceCollection: "phase5-smoke",
  phraseBars: sequence.timing.bars,
  global: {},
  motifs: { familyCount: 0, returnCount: 0, variationCount: 0, families: [] },
  bars: Array.from({ length: sequence.timing.bars }, (_, index) => ({
    index,
    energy: index % 2 ? 0.7 : 0.3,
    density: 0.5,
    tension: 0.2,
    vocalSpace: 0.8
  }))
};

const input = buildRepresentationInput(phrase, annotation);
const prepared = flat.prepare(input);
assert.equal(prepared.bars[0].energy, 0.3);
assert.equal(prepared.bars[1].vocalSpace, 0.8);

const report = benchmarkRepresentation([input], flat);
assert.equal(report.schema, "fame-neural-representation-benchmark-v1");
assert.equal(report.totals.inputs, 1);
assert.equal(report.totals.benchmarked, 1);
assert.equal(report.totals.failures, 0);
assert.equal(report.totals.grammarFailures, 0);
assert.equal(report.totals.vocabularyFailures, 0);
assert.equal(report.totals.canonicalRoundTripFailures, 0);
assert.equal(report.totals.structureExactPhrases, 1);
assert.equal(report.reconstruction.eventType.accuracy, 1);
assert.equal(report.reconstruction.pitch.accuracy, 1);
assert.ok(report.context.meanUnitsPerBar > 0);
assert.ok(report.representation.vocabSize > 0);
assert.equal(report.representation.capabilities.phase4Density, false);

console.log("FASE 5 / BLOCCO 1 / BENCHMARK HARNESS");
console.log("REPRESENTATION INPUT + FASE4 OVERLAY: OK");
console.log("FLAT POC ADAPTER: OK");
console.log("VOCAB + GRAMMAR: OK");
console.log("CANONICAL ROUND-TRIP: OK");
console.log("RECONSTRUCTION METRICS: OK");
console.log("PHASE5 BLOCK1 SMOKE TEST: OK");
