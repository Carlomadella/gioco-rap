"use strict";

const assert = require("node:assert/strict");
const { parseSmf, MidiParseError } = require("./midi/smf-parser");
const { classifyTrack } = require("./midi/track-classifier");
const { normalizeParsedMidi } = require("./midi/normalize-midi");
const { validateProvenance } = require("./midi/provenance");
const { DATASET_SCHEMA, buildDatasetItem } = require("./midi/dataset-item");

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
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return Buffer.from(bytes);
}

function meta(delta, type, data) {
  return Buffer.concat([vlq(delta), Buffer.from([0xff, type]), vlq(data.length), data]);
}

function midiEvent(delta, status, ...data) {
  return Buffer.concat([vlq(delta), Buffer.from([status, ...data])]);
}

function trackChunk(parts) {
  const body = Buffer.concat([...parts, meta(0, 0x2f, Buffer.alloc(0))]);
  return Buffer.concat([Buffer.from("MTrk"), u32(body.length), body]);
}

function makeFixture({ tempoChange = false } = {}) {
  const ppq = 480;
  const tempo140 = Math.round(60000000 / 140);
  const tempo130 = Math.round(60000000 / 130);
  const conductor = [
    meta(0, 0x03, Buffer.from("Conductor")),
    meta(0, 0x51, Buffer.from([(tempo140 >> 16) & 0xff, (tempo140 >> 8) & 0xff, tempo140 & 0xff])),
    meta(0, 0x58, Buffer.from([4, 2, 24, 8])),
    meta(0, 0x59, Buffer.from([0xfd, 1])) // -3 flats, minor => C minor
  ];
  if (tempoChange) {
    conductor.push(meta(480, 0x51, Buffer.from([(tempo130 >> 16) & 0xff, (tempo130 >> 8) & 0xff, tempo130 & 0xff])));
  }

  const bass = [
    meta(0, 0x03, Buffer.from("808 Bass")),
    midiEvent(0, 0xc0, 38),
    midiEvent(0, 0x90, 36, 110),
    midiEvent(480, 0x80, 36, 0),
    midiEvent(0, 0x90, 39, 100),
    midiEvent(480, 0x80, 39, 0)
  ];

  const drums = [
    meta(0, 0x03, Buffer.from("Drums")),
    midiEvent(0, 0x99, 36, 120), midiEvent(60, 0x89, 36, 0),
    midiEvent(420, 0x99, 38, 118), midiEvent(60, 0x89, 38, 0),
    midiEvent(180, 0x99, 42, 88), midiEvent(30, 0x89, 42, 0),
    midiEvent(210, 0x99, 46, 82), midiEvent(30, 0x89, 46, 0)
  ];

  const lead = [
    meta(0, 0x03, Buffer.from("Lead Pluck")),
    midiEvent(0, 0xc1, 81),
    midiEvent(240, 0x91, 72, 96), midiEvent(240, 0x81, 72, 0),
    midiEvent(240, 0x91, 75, 92), midiEvent(240, 0x81, 75, 0)
  ];

  const tracks = [trackChunk(conductor), trackChunk(bass), trackChunk(drums), trackChunk(lead)];
  const header = Buffer.concat([Buffer.from("MThd"), u32(6), u16(1), u16(tracks.length), u16(ppq)]);
  return Buffer.concat([header, ...tracks]);
}

const good = makeFixture();
const parsed = parseSmf(good);
assert.equal(parsed.format, 1);
assert.equal(parsed.ppq, 480);
assert.equal(parsed.trackCount, 4);
assert.equal(parsed.tracks[1].notes.length, 2);
assert.equal(parsed.tracks[2].notes.length, 4);
assert.equal(parsed.tempos.length, 1);
assert.equal(parsed.timeSignatures[0].numerator, 4);
assert.equal(parsed.keySignatures[0].minor, true);

const bassClass = classifyTrack(parsed.tracks[1]);
const drumClass = classifyTrack(parsed.tracks[2]);
const leadClass = classifyTrack(parsed.tracks[3]);
assert.equal(bassClass.melodicRole, "808");
assert.equal(drumClass.hasDrums, true);
assert.equal(leadClass.melodicRole, "lead");

const normalized = normalizeParsedMidi(parsed, { seed: "phase2-fixture" });
assert.equal(normalized.ok, true, normalized.errors.map(e => e.message).join("; "));
assert.equal(normalized.sequence.timing.ppq, 960);
assert.equal(normalized.sequence.timing.bpm, 140);
assert.equal(normalized.sequence.tonality.rootPitchClass, 0);
assert.equal(normalized.sequence.tonality.mode, "minor");
assert.ok(normalized.sequence.events.some(e => e.type === "808" && e.tick === 0 && e.durationTicks === 960));
assert.ok(normalized.sequence.events.some(e => e.type === "kick"));
assert.ok(normalized.sequence.events.some(e => e.type === "snare"));
assert.ok(normalized.sequence.events.some(e => e.type === "lead"));

const clearedProvenance = {
  sourceId: "fixture-original-001",
  originType: "original",
  creator: "FAME Neural Test Fixture",
  licenseId: "FAME-ORIGINAL-TEST",
  compositionFamily: "phase2-fixtures",
  rightsEvidence: ["Fixture MIDI generata interamente dal test automatico."],
  commercialTrainingAllowed: true,
  commercialOutputAllowed: true
};
const provenanceCheck = validateProvenance(clearedProvenance);
assert.equal(provenanceCheck.valid, true);
assert.equal(provenanceCheck.rightsStatus, "commercial-cleared");

const item = buildDatasetItem({ buffer: good, fileName: "fixture.mid", provenance: clearedProvenance, options: { seed: "phase2-fixture" } });
assert.equal(item.schema, DATASET_SCHEMA);
assert.equal(item.source.sha256.length, 64);
assert.equal(item.import.status, "ok");
assert.equal(item.eligibility.technical, true);
assert.equal(item.eligibility.commercialTraining, true);
assert.equal(item.rights.status, "commercial-cleared");

const analysisOnly = buildDatasetItem({
  buffer: good,
  fileName: "fixture.mid",
  provenance: { ...clearedProvenance, commercialTrainingAllowed: false },
  options: { seed: "phase2-analysis-only" }
});
assert.equal(analysisOnly.eligibility.technical, true);
assert.equal(analysisOnly.eligibility.commercialTraining, false);
assert.equal(analysisOnly.rights.status, "analysis-only");

const badProvenance = validateProvenance({});
assert.equal(badProvenance.valid, false);
assert.ok(badProvenance.errors.length >= 6);

const tempoMap = normalizeParsedMidi(parseSmf(makeFixture({ tempoChange: true })));
assert.equal(tempoMap.ok, false);
assert.ok(tempoMap.errors.some(e => e.code === "TEMPO_MAP_UNSUPPORTED"));

assert.throws(() => parseSmf(Buffer.from("not midi")), MidiParseError);

console.log("FASE 2 / BLOCCO 1");
console.log(`SMF parser: ${parsed.trackCount} track, PPQ ${parsed.ppq}`);
console.log(`Canonical: ${normalized.sequence.events.length} eventi, ${normalized.sequence.timing.bars} barre, ${normalized.sequence.timing.bpm} BPM`);
console.log(`Classificazione: bass=${bassClass.melodicRole}, drums=${drumClass.hasDrums ? "drums" : "no"}, lead=${leadClass.melodicRole}`);
console.log(`Dataset schema: ${item.schema}`);
console.log(`Rights gate: cleared=${item.eligibility.commercialTraining}, analysis-only=${analysisOnly.eligibility.commercialTraining}`);
console.log("TEMPO MAP BLOCK: OK");
console.log("CORRUPT MIDI BLOCK: OK");
console.log("FASE 2 BLOCCO 1 SMOKE TEST: OK");
