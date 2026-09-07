"use strict";

const assert = require("node:assert/strict");
const { buildPhrases, sliceSequence } = require("./dataset/phrase-builder");
const { auditPhraseEntries } = require("./dataset/phrase-corpus");

function sequence(events, bars = 8, bpm = 140) {
  return {
    schema: "fame-neural-sequence-v1",
    version: 1,
    meta: { genre: "trap" },
    timing: { ppq: 960, bpm, bars },
    tonality: { rootPitchClass: 0, mode: "minor" },
    harmony: [],
    bars: Array.from({ length: bars }, (_, index) => ({ index })),
    events
  };
}

function sourceItem(index, canonical, overrides = {}) {
  const hex = (index % 16).toString(16);
  return {
    schema: "fame-neural-dataset-item-v1",
    version: 1,
    itemId: overrides.itemId || `phase3-block5-source-${index}`,
    source: { sha256: (overrides.sha || hex.repeat(64)).slice(0, 64) },
    provenance: {
      sourceId: `phase3-block5-origin-${index}`,
      creator: "FAME Neural Block 5 Fixture",
      licenseId: "FAME-ORIGINAL-TEST",
      compositionFamily: overrides.family || `phase3-block5-family-${index}`,
      rightsEvidence: ["Fixture sintetica BLOCCO 5."],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    rights: {
      status: "commercial-cleared",
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    },
    import: { status: "ok", analysis: { skippedTracks: [] } },
    eligibility: { technical: true, commercialTraining: true },
    canonical
  };
}

function eightBarEvents(offsetPitch = 0) {
  const out = [];
  for (let bar = 0; bar < 8; bar += 1) {
    const o = bar * 3840;
    out.push({ type: "kick", tick: o + (bar % 2) * 120, velocity: 0.9 });
    out.push({ type: "snare", tick: o + 960, velocity: 0.8 });
    out.push({ type: "hat_closed", tick: o + 480, velocity: 0.6 });
    out.push({ type: "lead", tick: o + 1200 + bar * 60, note: 60 + offsetPitch + bar, durationTicks: 360, velocity: 0.7 });
  }
  out.push({ type: "lead", tick: 4 * 3840 - 120, note: 72 + offsetPitch, durationTicks: 480, velocity: 0.6 });
  return out;
}

function wrap(items) {
  return items.map((item, index) => ({ fileName: `block5-source-${index}.dataset-item.json`, item }));
}

console.log("FASE 3 / BLOCCO 5");

const clipped = sliceSequence(sequence(eightBarEvents()), 0, 4);
const boundary = clipped.events.find(event => event.note === 72);
assert.ok(boundary);
assert.equal(boundary.durationTicks, 120);
console.log("PHRASE BOUNDARY CLIPPING: OK");

const sources = wrap([
  sourceItem(1, sequence(eightBarEvents(0)), { family: "b5-family-a", sha: "1".repeat(64) }),
  sourceItem(2, sequence(eightBarEvents(5)), { family: "b5-family-b", sha: "2".repeat(64) })
]);

const onlyFirstManifest = {
  schema: "fame-neural-curated-corpus-manifest-v1",
  items: [{ itemId: sources[0].item.itemId }]
};
const filtered = buildPhrases(sources, onlyFirstManifest, { phraseBars: [4], minEvents: 4 });
assert.equal(filtered.totals.phrasesProduced, 2);
assert.ok(filtered.phrases.every(item => item.sourceDatasetItemId === sources[0].item.itemId));
console.log("CURATION MANIFEST FILTER: OK");

const all = buildPhrases(sources, null, { phraseBars: [4], minEvents: 4 });
assert.equal(all.totals.phrasesProduced, 4);
assert.equal(new Set(all.phrases.map(item => item.phraseId)).size, 4);
assert.ok(all.phrases.every(item => item.phraseBars === 4));
console.log("4-BAR PHRASE BUILD: OK");

const phraseEntries = all.phrases.map((item, index) => ({
  fileName: `phrase-${index}.phrase-item.json`,
  item
}));
const audit = auditPhraseEntries(phraseEntries, {
  targetMinPhrases: 500,
  similarity: { enabled: false }
});
assert.equal(audit.block5Ready, true);
assert.equal(audit.targetReached, false);
assert.equal(audit.gate1Candidate, false);
assert.equal(audit.sourceLeakage.length, 0);
console.log("PHRASE CORPUS + SOURCE LEAKAGE: OK");

const duplicateSources = wrap([
  sourceItem(3, sequence(eightBarEvents(0)), { family: "b5-dup-a", sha: "3".repeat(64) }),
  sourceItem(4, sequence(eightBarEvents(0)), { family: "b5-dup-b", sha: "4".repeat(64) })
]);
const duplicatePhrases = buildPhrases(duplicateSources, null, { phraseBars: [4], minEvents: 4 });
const duplicateAudit = auditPhraseEntries(
  duplicatePhrases.phrases.map((item, index) => ({ fileName: `dup-${index}.phrase-item.json`, item })),
  { targetMinPhrases: 500, similarity: { enabled: false } }
);
assert.equal(duplicateAudit.block5Ready, true);
assert.equal(duplicateAudit.corpusClean, false);
assert.ok(duplicateAudit.totals.exactDuplicateGroups > 0);
console.log("DUPLICATE PHRASE DETECTION: OK");

console.log("FASE 3 BLOCCO 5 SMOKE TEST: OK");
