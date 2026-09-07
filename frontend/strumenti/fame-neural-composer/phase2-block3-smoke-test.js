"use strict";

const assert = require("node:assert/strict");
const { buildDatasetItem } = require("./midi/dataset-item");
const { parseSmf } = require("./midi/smf-parser");
const { buildTempoSegments } = require("./midi/tempo-segments");

function u16(value) {
  const b = Buffer.alloc(2); b.writeUInt16BE(value); return b;
}
function u32(value) {
  const b = Buffer.alloc(4); b.writeUInt32BE(value); return b;
}
function vlq(value) {
  const bytes = [value & 0x7f];
  value >>>= 7;
  while (value) { bytes.unshift((value & 0x7f) | 0x80); value >>>= 7; }
  return Buffer.from(bytes);
}
function meta(delta, type, data) {
  return Buffer.concat([vlq(delta), Buffer.from([0xff, type]), vlq(data.length), data]);
}
function midi(delta, status, a, b) {
  return Buffer.concat([vlq(delta), Buffer.from(b == null ? [status, a] : [status, a, b])]);
}
function track(events) {
  const body = Buffer.concat([...events, meta(0, 0x2f, Buffer.alloc(0))]);
  return Buffer.concat([Buffer.from("MTrk"), u32(body.length), body]);
}
function tempoData(bpm) {
  const us = Math.round(60000000 / bpm);
  return Buffer.from([(us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff]);
}
function makeTempoHarmonyFixture() {
  const ppq = 480;
  const conductor = track([
    meta(0, 0x03, Buffer.from("Conductor")),
    meta(0, 0x51, tempoData(140)),
    meta(0, 0x58, Buffer.from([4, 2, 24, 8])),
    meta(0, 0x59, Buffer.from([0, 1])),
    meta(960, 0x51, tempoData(150))
  ]);

  const harmony = track([
    meta(0, 0x03, Buffer.from("Harmony Keys")),
    midi(0, 0xc0, 0),
    midi(0, 0x90, 60, 90),
    midi(0, 0x90, 63, 86),
    midi(0, 0x90, 67, 84),
    midi(480, 0x80, 60, 0),
    midi(0, 0x80, 63, 0),
    midi(0, 0x80, 67, 0),
    midi(480, 0x90, 63, 92),
    midi(0, 0x90, 67, 88),
    midi(0, 0x90, 70, 86),
    midi(960, 0x80, 63, 0),
    midi(0, 0x80, 67, 0),
    midi(0, 0x80, 70, 0)
  ]);

  const header = Buffer.concat([Buffer.from("MThd"), u32(6), u16(1), u16(2), u16(ppq)]);
  return Buffer.concat([header, conductor, harmony]);
}

const provenance = {
  sourceId: "phase2-block3-original",
  originType: "original",
  creator: "FAME Neural Test Fixture",
  licenseId: "FAME-ORIGINAL-TEST",
  compositionFamily: "phase2-block3-fixtures",
  rightsEvidence: ["Fixture MIDI generata interamente dal test automatico."],
  commercialTrainingAllowed: true,
  commercialOutputAllowed: true
};

const buffer = makeTempoHarmonyFixture();
const parsed = parseSmf(buffer);
const plan = buildTempoSegments(parsed);
assert.equal(plan.length, 2);
assert.equal(plan[0].bpm, 140);
assert.equal(plan[1].bpm, 150);
assert.equal(plan[0].sourceStartTick, 0);
assert.equal(plan[0].sourceEndTick, 960);
assert.equal(plan[1].sourceStartTick, 960);

const blocked = buildDatasetItem({
  buffer,
  fileName: "tempo-harmony.mid",
  provenance,
  options: { tempoMapStrategy: "block" }
});
assert.equal(blocked.eligibility.technical, false);
assert.ok(blocked.import.errors.some(error => error.code === "TEMPO_MAP_UNSUPPORTED"));

const segmented = buildDatasetItem({
  buffer,
  fileName: "tempo-harmony.mid",
  provenance,
  options: { tempoMapStrategy: "segment" }
});
assert.equal(segmented.eligibility.technical, true, segmented.import.errors.map(e => e.message).join("; "));
assert.equal(segmented.eligibility.commercialTraining, true);
assert.equal(segmented.canonical, null);
assert.equal(segmented.canonicalSegments.length, 2);
assert.equal(segmented.canonicalSegments[0].canonical.timing.bpm, 140);
assert.equal(segmented.canonicalSegments[1].canonical.timing.bpm, 150);

for (const segment of segmented.canonicalSegments) {
  const harmonyEvents = segment.canonical.events.filter(event => event.type === "harmony");
  assert.equal(harmonyEvents.length, 3);
  assert.equal(segment.analysis.harmonyNotes.eventCount, 3);
  assert.equal(segment.analysis.harmonyNotes.groupCount, 1);
  assert.equal(segment.analysis.harmonyNotes.chordLikeGroupCount, 1);
  assert.equal(segment.analysis.harmonyNotes.inferenceApplied, false);
  assert.equal(segment.analysis.harmonyNotes.chordNoteGroups[0].notes.length, 3);
}

const invalidStrategy = buildDatasetItem({
  buffer,
  fileName: "tempo-harmony.mid",
  provenance,
  options: { tempoMapStrategy: "warp" }
});
assert.equal(invalidStrategy.eligibility.technical, false);
assert.ok(invalidStrategy.import.errors.some(error => error.code === "TEMPO_MAP_STRATEGY_INVALID"));

console.log("FASE 2 / BLOCCO 3");
console.log(`Tempo map: ${parsed.tempos.length} eventi -> ${segmented.canonicalSegments.length} segmenti canonici`);
console.log(`Segmenti BPM: ${segmented.canonicalSegments.map(s => s.canonical.timing.bpm).join(" -> ")}`);
console.log(`Harmony: ${segmented.canonicalSegments.map(s => s.analysis.harmonyNotes.eventCount).join(" + ")} note preservate`);
console.log("DEFAULT TEMPO MAP BLOCK: OK");
console.log("SEGMENTED TEMPO MAP IMPORT: OK");
console.log("HARMONY CHORD-NOTE PRESERVATION: OK");
console.log("NO PREMATURE CHORD INFERENCE: OK");
console.log("FASE 2 BLOCCO 3 SMOKE TEST: OK");
