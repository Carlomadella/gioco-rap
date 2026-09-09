"use strict";

const assert = require("node:assert/strict");
const { buildDatasetItem } = require("./midi/dataset-item");
const {
  SOURCE_FIDELITY_SCHEMA,
  PHRASE_SOURCE_FIDELITY_SCHEMA,
  DRUM_MAPPING_ID,
  buildSourceFidelity,
  buildPhraseSourceFidelity,
  validateSourceFidelity
} = require("./midi/source-fidelity");
const { buildPhraseItem, canonicalSequencesFromSource } = require("./dataset/phrase-builder");

function u16(value) {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(value);
  return b;
}
function u32(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value);
  return b;
}
function vlq(value) {
  const bytes = [value & 0x7f];
  value >>>= 7;
  while (value) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  return Buffer.from(bytes);
}
function meta(delta, type, data) {
  return Buffer.concat([vlq(delta), Buffer.from([0xff, type]), vlq(data.length), data]);
}
function midi(delta, status, a, b) {
  return Buffer.concat([vlq(delta), Buffer.from([status, a, b])]);
}
function track(events) {
  const body = Buffer.concat([...events, meta(0, 0x2f, Buffer.alloc(0))]);
  return Buffer.concat([Buffer.from("MTrk"), u32(body.length), body]);
}
function tempoData(bpm) {
  const us = Math.round(60000000 / bpm);
  return Buffer.from([(us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff]);
}

function makeDrumFixture() {
  const ppq = 1920;
  const conductor = track([
    meta(0, 0x03, Buffer.from("Conductor")),
    meta(0, 0x51, tempoData(140)),
    meta(0, 0x58, Buffer.from([4, 2, 24, 8]))
  ]);
  const drums = track([
    meta(0, 0x03, Buffer.from("Drums")),
    midi(1, 0x99, 49, 100),
    midi(1, 0x99, 51, 90),
    midi(19, 0x89, 49, 0),
    midi(0, 0x89, 51, 0),
    midi(ppq * 4 - 21, 0x99, 38, 110),
    midi(20, 0x89, 38, 0),
    midi(ppq * 4, 0x99, 42, 80),
    midi(20, 0x89, 42, 0),
    midi(ppq * 8, 0x99, 36, 120),
    midi(20, 0x89, 36, 0),
    midi(ppq * 4, 0x99, 38, 105),
    midi(20, 0x89, 38, 0)
  ]);
  const header = Buffer.concat([Buffer.from("MThd"), u32(6), u16(1), u16(2), u16(ppq)]);
  return Buffer.concat([header, conductor, drums]);
}

const provenance = {
  sourceId: "block4-source-fidelity-fixture",
  originType: "original",
  creator: "FAME Neural Test Fixture",
  licenseId: "FAME-ORIGINAL-TEST",
  compositionFamily: "phase7a-block4-fixture",
  rightsEvidence: ["Fixture MIDI sintetica per test source fidelity."],
  commercialTrainingAllowed: true,
  commercialOutputAllowed: true
};

const itemA = buildDatasetItem({
  buffer: makeDrumFixture(),
  fileName: "block4.mid",
  provenance,
  options: { seed: "block4" }
});
const itemB = buildDatasetItem({
  buffer: makeDrumFixture(),
  fileName: "block4.mid",
  provenance,
  options: { seed: "block4" }
});

assert.equal(itemA.import.status, "ok");
assert.equal(itemA.sourceFidelity.schema, SOURCE_FIDELITY_SCHEMA);
assert.equal(itemA.sourceFidelity.sourcePpq, 1920);
assert.equal(itemA.sourceFidelity.mapping.id, DRUM_MAPPING_ID);
assert.equal(validateSourceFidelity(itemA.sourceFidelity, itemA.itemId).ok, true);
assert.deepEqual(itemA.sourceFidelity, itemB.sourceFidelity);
assert.ok(itemA.sourceFidelity.drumEvents.length >= 6);

const raw49 = itemA.sourceFidelity.drumEvents.find(event => event.midiNote === 49);
const raw51 = itemA.sourceFidelity.drumEvents.find(event => event.midiNote === 51);
assert.ok(raw49);
assert.ok(raw51);
assert.equal(raw49.canonicalProjection.type, "perc");
assert.equal(raw51.canonicalProjection.type, "perc");
assert.equal(raw49.startTick, 1);
assert.equal(raw51.startTick, 2);
assert.equal(raw49.canonicalProjection.tick, 1);
assert.equal(raw51.canonicalProjection.tick, 1);
assert.equal(raw49.canonicalProjection.tick, raw51.canonicalProjection.tick);
assert.notEqual(raw49.sourceEventId, raw51.sourceEventId);
assert.notEqual(raw49.startTick, raw51.startTick);

const canonicalPerc = itemA.canonical.events.filter(event => event.type === "perc");
assert.ok(canonicalPerc.length >= 2);
assert.ok(canonicalPerc.every(event => event.note == null));
assert.ok(canonicalPerc.every(event => event.sourceEventId == null));

const sequences = canonicalSequencesFromSource(itemA);
assert.equal(sequences.length, 1);
assert.equal(sequences[0].sourceSegmentId, "canonical");
assert.equal(sequences[0].sourceSegmentStartTick, 0);

const phrase = buildPhraseItem(
  itemA,
  "block4.dataset-item.json",
  "canonical",
  itemA.canonical,
  0,
  4,
  0
);
assert.equal(phrase.sourceFidelity.schema, PHRASE_SOURCE_FIDELITY_SCHEMA);
assert.equal(phrase.sourceFidelity.sourcePpq, 1920);
assert.equal(phrase.sourceFidelity.sourceTickStart, 0);
assert.equal(phrase.sourceFidelity.sourceTickEndExclusive, 1920 * 4 * 4);
assert.ok(phrase.sourceFidelity.drumEvents.length > 0);
assert.ok(phrase.sourceFidelity.drumEvents.every(event => event.startTick < phrase.sourceFidelity.sourceTickEndExclusive));
assert.ok(phrase.sourceFidelity.drumEvents.every(event => Number.isInteger(event.phraseSourceTick)));
assert.ok(phrase.sourceFidelity.drumEvents.every(event => Number.isInteger(event.phraseCanonicalTick)));

const slice = buildPhraseSourceFidelity(itemA.sourceFidelity, {
  sourceDatasetItemId: itemA.itemId,
  sourceSegmentId: "canonical",
  sourceSegmentStartTick: 0,
  startBar: 4,
  phraseBars: 4
});
assert.equal(slice.sourceTickStart, 1920 * 4 * 4);
assert.ok(slice.drumEvents.every(event => event.startTick >= slice.sourceTickStart));
assert.ok(slice.drumEvents.every(event => event.startTick < slice.sourceTickEndExclusive));

const syntheticParsed = {
  ppq: 480,
  tempos: [],
  timeSignatures: [],
  tracks: [{
    index: 3,
    notes: [
      { channel: 9, note: 36, velocity: 100, velocityOff: 0, startTick: 0, durationTicks: 10, program: 0 },
      { channel: 9, note: 36, velocity: 100, velocityOff: 0, startTick: 0, durationTicks: 10, program: 0 }
    ]
  }]
};
const duplicateHits = buildSourceFidelity(syntheticParsed, "duplicate-item");
assert.equal(duplicateHits.drumEvents.length, 2);
assert.notEqual(duplicateHits.drumEvents[0].sourceEventId, duplicateHits.drumEvents[1].sourceEventId);

console.log("FASE 7A / BLOCCO 4 / SOURCE FIDELITY");
console.log("Raw GM drum note identity preserved: OK");
console.log("Raw source ticks preserved before canonical rounding: OK");
console.log("Canonical V1 unchanged / no raw drum note injection: OK");
console.log("Deterministic sourceEventId: OK");
console.log("Phrase fidelity slice/linkage: OK");
console.log("Duplicate simultaneous hit identity: OK");
console.log("FASE 7A BLOCCO 4 SOURCE FIDELITY SMOKE TEST: OK");
