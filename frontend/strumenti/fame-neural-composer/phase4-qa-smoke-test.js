"use strict";

const assert = require("node:assert/strict");
const {
  invariantIssues,
  runQa,
  markdownReport,
  quantile,
  reviewFlags
} = require("./annotation/qa");

function annotation(id, source, values, bars = 4) {
  const barList = [];
  for (let i = 0; i < bars; i += 1) {
    barList.push({
      index: i,
      energy: values.energy,
      density: values.density,
      tension: values.tension,
      vocalSpace: values.vocalSpace,
      rhythmicSyncopation: 0.1,
      harmonyCoverage: 0.2,
      roles: { drums: true, "808": Boolean(values.with808), harmony: true, lead: false },
      counts: {},
      phraseBoundary: { before: i === 0 ? 1 : 0.1, after: i === bars - 1 ? 1 : 0.1 },
      transitionStrength: { fromPrevious: i === 0 ? 0 : 0.1, toNext: i === bars - 1 ? 0.15 : 0.1 },
      motif: { familyId: `M${i + 1}`, relation: "new", similarity: 1, fingerprint: `f${i}` },
      harmony: { present: true, chordOnsets: 1, changeCount: 0, chords: [] },
      bass808: { present: Boolean(values.with808) },
      kick808: { available: Boolean(values.with808), relationStrength: values.with808 ? values.kick808RelationStrength : 0 },
      hats: { count: values.roll ? 3 : 0, density: 0.1, rollCount: values.roll ? 1 : 0, maxRollNotes: values.roll ? 3 : 0, rolls: [] }
    });
  }
  return {
    schema: "fame-neural-musical-annotation-v1",
    version: 1,
    phraseId: id,
    sourceDatasetItemId: `${source}:${id}`,
    sourceCollection: source,
    phraseBars: bars,
    method: { id: "fame-neural-auto-annotator-v1", deterministic: true },
    confidence: {},
    global: {
      energy: values.energy,
      energyRange: 0,
      density: values.density,
      densityRange: 0,
      tension: values.tension,
      tensionRange: 0,
      vocalSpace: values.vocalSpace,
      vocalSpaceRange: 0,
      transitionStrength: 0.1,
      maxTransitionStrength: 0.1,
      kick808RelationStrength: values.with808 ? values.kick808RelationStrength : 0
    },
    motifs: {
      familyCount: bars,
      returnCount: 0,
      variationCount: 0,
      families: barList.map((_, i) => ({ id: `M${i + 1}`, representativeBar: i, bars: [i] }))
    },
    bars: barList
  };
}

const items = [];
for (let i = 0; i < 12; i += 1) {
  items.push(annotation(`a:${i}`, "source-a", {
    energy: Number((0.2 + i * 0.04).toFixed(6)),
    density: Number((0.25 + i * 0.035).toFixed(6)),
    tension: Number((0.1 + i * 0.02).toFixed(6)),
    vocalSpace: Number((0.9 - i * 0.025).toFixed(6)),
    with808: i % 2 === 0,
    kick808RelationStrength: i % 2 === 0 ? 0.6 : 0,
    roll: i === 11
  }));
}
for (let i = 0; i < 8; i += 1) {
  items.push(annotation(`b:${i}`, "source-b", {
    energy: Number((0.35 + i * 0.03).toFixed(6)),
    density: Number((0.3 + i * 0.025).toFixed(6)),
    tension: Number((0.2 + i * 0.015).toFixed(6)),
    vocalSpace: Number((0.82 - i * 0.02).toFixed(6)),
    with808: false,
    kick808RelationStrength: 0,
    roll: false
  }));
}

assert.equal(invariantIssues(items[0]).length, 0);
assert.equal(quantile([0, 10], 0.5), 5);

const reportA = runQa(items, { perSource: 6 });
const reportB = runQa([...items].reverse(), { perSource: 6 });
assert.equal(reportA.schema, "fame-neural-annotation-qa-v1");
assert.equal(reportA.totals.annotations, 20);
assert.equal(reportA.totals.sources, 2);
assert.equal(reportA.totals.invariantFailures, 0);
assert.deepEqual(reportA.reviewSample, reportB.reviewSample, "campione QA deve essere deterministico indipendentemente dall'ordine input");
assert.ok(reportA.reviewSample.some(item => item.sourceCollection === "source-a"));
assert.ok(reportA.reviewSample.some(item => item.sourceCollection === "source-b"));
assert.ok(markdownReport(reportA).includes("Campione stratificato"));
assert.equal(reportA.calibration.decision, "HUMAN_REVIEW_REQUIRED");
assert.equal(reportA.stats.global.kick808RelationStrength.count, 6, "kick↔808 stats devono includere solo phrase con relazione disponibile");
const denseWithSpace = annotation("a:dense-space", "source-a", {
  energy: 0.7, density: 0.9, tension: 0.2, vocalSpace: 0.95,
  with808: false, kick808RelationStrength: 0, roll: false
});
assert.ok(!reviewFlags(denseWithSpace, reportA.stats.sources).includes("cross-check:dense-but-high-vocal-space"), "densita' alta + vocal space alto non e' una contraddizione automatica");

const broken = JSON.parse(JSON.stringify(items[0]));
broken.global.energy = 0.99;
assert.ok(invariantIssues(broken).some(issue => issue.message.includes("global.energy != media barre")));

const duplicateReport = runQa([items[0], items[0]], { perSource: 4 });
assert.ok(duplicateReport.totals.invariantFailures >= 1);
assert.equal(duplicateReport.calibration.decision, "BLOCKED");

console.log("FASE 4 / BLOCCO 2A / QA STRATIFICATO");
console.log("INVARIANTI ANNOTAZIONE: OK");
console.log("QUANTILI + DISTRIBUZIONI: OK");
console.log("SAMPLE STRATIFICATO DETERMINISTICO: OK");
console.log("CASI ESTREMI + CROSS-CHECK: OK");
console.log("CALIBRATION GUARD: OK");
console.log("PHASE4 BLOCK2A SMOKE TEST: OK");
