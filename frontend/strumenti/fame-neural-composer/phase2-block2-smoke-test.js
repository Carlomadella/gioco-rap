"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseSmf } = require("./midi/smf-parser");
const { normalizeParsedMidi } = require("./midi/normalize-midi");
const { classifyTrack } = require("./midi/track-classifier");
const { normalizeTrackOverrides } = require("./midi/track-overrides");
const { importMidiDirectory } = require("./midi/batch-import-midi");

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
  const bytes = b == null ? [status, a] : [status, a, b];
  return Buffer.concat([vlq(delta), Buffer.from(bytes)]);
}
function track(events) {
  const body = Buffer.concat([...events, meta(0, 0x2f, Buffer.alloc(0))]);
  return Buffer.concat([Buffer.from("MTrk"), u32(body.length), body]);
}
function tempoData(bpm) {
  const us = Math.round(60000000 / bpm);
  return Buffer.from([(us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff]);
}
function makeFixture({ ambiguous = false, complexBend = false } = {}) {
  const ppq = 480;
  const conductor = track([
    meta(0, 0x03, Buffer.from("Conductor")),
    meta(0, 0x51, tempoData(140)),
    meta(0, 0x58, Buffer.from([4, 2, 24, 8])),
    meta(0, 0x59, Buffer.from([0, 1]))
  ]);
  const bassName = ambiguous ? "Mystery Mono" : "808 Bass";
  const bassEvents = [
    meta(0, 0x03, Buffer.from(bassName)),
    midi(0, 0xc0, ambiguous ? 80 : 38),
    midi(0, 0x90, ambiguous ? 48 : 36, 110),
    midi(240, 0xe0, 0, 96)
  ];
  if (complexBend) bassEvents.push(midi(60, 0xe0, 0, 32));
  bassEvents.push(midi(complexBend ? 180 : 240, 0x80, ambiguous ? 48 : 36, 0));
  const bass = track(bassEvents);
  const header = Buffer.concat([Buffer.from("MThd"), u32(6), u16(1), u16(2), u16(ppq)]);
  return Buffer.concat([header, conductor, bass]);
}

const ambiguousBuffer = makeFixture({ ambiguous: true });
const parsedAmbiguous = parseSmf(ambiguousBuffer);
const automatic = classifyTrack(parsedAmbiguous.tracks[1]);
assert.equal(automatic.melodicRole, "unknown");

const withoutOverride = normalizeParsedMidi(parsedAmbiguous);
assert.equal(withoutOverride.sequence.events.filter(e => e.type === "808").length, 0);
assert.ok(withoutOverride.warnings.some(w => w.code === "UNCLASSIFIED_MELODIC_TRACK"));

const withOverride = normalizeParsedMidi(parsedAmbiguous, {
  trackOverrides: {
    tracks: [{ trackIndex: 1, melodicRole: "808", pitchBendRangeSemitones: 2, reason: "fixture confermata" }]
  }
});
assert.equal(withOverride.ok, true, withOverride.errors.map(e => e.message).join("; "));
assert.equal(withOverride.analysis.trackOverrideCount, 1);
assert.equal(withOverride.analysis.mappedGlides, 1);
const bassEvent = withOverride.sequence.events.find(e => e.type === "808");
assert.ok(bassEvent);
assert.equal(bassEvent.note, 48);
assert.equal(bassEvent.durationTicks, 960);
assert.equal(bassEvent.glideTo, 49);
assert.equal(bassEvent.glideTicks, 480);

const badOverrides = normalizeTrackOverrides({ tracks: [{ trackIndex: 1, melodicRole: "vocals" }] });
assert.equal(badOverrides.valid, false);
const badNormalized = normalizeParsedMidi(parsedAmbiguous, { trackOverrides: { tracks: [{ trackIndex: 1, melodicRole: "vocals" }] } });
assert.equal(badNormalized.ok, false);
assert.ok(badNormalized.errors.some(e => e.code === "TRACK_OVERRIDE_INVALID"));

const complex = normalizeParsedMidi(parseSmf(makeFixture({ complexBend: true })));
const complex808 = complex.sequence.events.find(e => e.type === "808");
assert.ok(complex808);
assert.equal(complex808.glideTo, undefined);
assert.ok(complex.warnings.some(w => w.code === "PITCH_BEND_GLIDE_QUANTIZED" || w.code === "PITCH_BEND_NO_SIMPLE_GLIDE"));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-neural-phase2-b2-"));
const inputDir = path.join(tmp, "in");
const outputDir = path.join(tmp, "out");
fs.mkdirSync(inputDir);
fs.writeFileSync(path.join(inputDir, "cleared.mid"), ambiguousBuffer);
fs.writeFileSync(path.join(inputDir, "missing.mid"), ambiguousBuffer);
fs.writeFileSync(path.join(inputDir, "cleared.provenance.json"), JSON.stringify({
  sourceId: "block2-cleared-001",
  originType: "original",
  creator: "FAME Neural Test Fixture",
  licenseId: "FAME-ORIGINAL-TEST",
  compositionFamily: "phase2-block2-fixtures",
  rightsEvidence: ["Fixture SMF generata dal test automatico."],
  commercialTrainingAllowed: true,
  commercialOutputAllowed: true
}, null, 2));

const batch = importMidiDirectory(inputDir, outputDir, {
  trackOverrides: { tracks: [{ trackIndex: 1, melodicRole: "808", reason: "fixture" }] }
});
assert.equal(batch.totals.discovered, 2);
assert.equal(batch.totals.imported, 1);
assert.equal(batch.totals.missingProvenance, 1);
assert.equal(batch.totals.failed, 0);
assert.ok(fs.existsSync(path.join(outputDir, "cleared.dataset-item.json")));

fs.rmSync(tmp, { recursive: true, force: true });

console.log("FASE 2 / BLOCCO 2");
console.log(`Override: ${automatic.melodicRole} -> 808`);
console.log(`Glide: MIDI ${bassEvent.note} -> ${bassEvent.glideTo}, glideTicks=${bassEvent.glideTicks}`);
console.log(`Batch: ${batch.totals.discovered} trovati, ${batch.totals.imported} cleared, ${batch.totals.missingProvenance} senza provenance`);
console.log("INVALID OVERRIDE BLOCK: OK");
console.log("COMPLEX PITCH BEND SAFE BLOCK: OK");
console.log("FASE 2 BLOCCO 2 SMOKE TEST: OK");
