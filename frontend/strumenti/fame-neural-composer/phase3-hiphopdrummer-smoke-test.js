"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const gen = require("./dataset/generate-hiphopdrummer-corpus");
const review = require("./dataset/review-hiphopdrummer");
const slice = require("./dataset/select-hiphopdrummer-role-slice");
const runner = require("./dataset/run-hiphopdrummer-expansion-v1");

console.log("FASE 3 / HIPHOPDRUMMER ROLE CLOSER");

const r1 = gen.seededRandom("same-seed");
const r2 = gen.seededRandom("same-seed");
assert.deepEqual(
  Array.from({ length: 20 }, () => r1()),
  Array.from({ length: 20 }, () => r2())
);
console.log("DETERMINISTIC PRNG: OK");

function vlq(value) {
  let buffer = value & 0x7f;
  const out = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    out.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return out;
}

function format0(trackName, channel, notes, drum = false) {
  const td = [];
  td.push(0, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);
  const name = Buffer.from(trackName, "ascii");
  td.push(0, 0xff, 0x03, name.length, ...name);
  td.push(0, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20); // 120 BPM
  const events = [];
  for (const note of notes) {
    events.push({ tick: note.tick, on: true, note: note.note, vel: note.vel || 100 });
    events.push({ tick: note.tick + (note.dur || 240), on: false, note: note.note, vel: 64 });
  }
  events.sort((a,b) => a.tick-b.tick || (a.on ? -1 : 1));
  let last = 0;
  for (const e of events) {
    td.push(...vlq(e.tick - last), (e.on ? 0x90 : 0x80) | channel, e.note, e.vel);
    last = e.tick;
  }
  td.push(...vlq(8 * 3840 - last), 0xff, 0x2f, 0x00);

  const track = Buffer.from(td);
  const out = Buffer.alloc(22 + track.length);
  out.write("MThd",0,"ascii"); out.writeUInt32BE(6,4); out.writeUInt16BE(0,8); out.writeUInt16BE(1,10); out.writeUInt16BE(960,12);
  out.write("MTrk",14,"ascii"); out.writeUInt32BE(track.length,18); track.copy(out,22);
  return out;
}

const drumNotes = [];
for (let bar = 0; bar < 8; bar++) {
  drumNotes.push({ tick: bar*3840, note: 36, dur: 120 });
  drumNotes.push({ tick: bar*3840+960, note: 38, dur: 120 });
  drumNotes.push({ tick: bar*3840+1920, note: 36, dur: 120 });
  drumNotes.push({ tick: bar*3840+2880, note: 38, dur: 120 });
  for (let s=0;s<8;s++) drumNotes.push({tick:bar*3840+s*480,note:42,dur:80,vel:80});
}
const bassNotes = Array.from({length:16},(_,i)=>({tick:i*1920,note:36+(i%3),dur:960}));
const leadNotes = Array.from({length:16},(_,i)=>({tick:i*1920,note:72+(i%5),dur:480}));

const merged808 = gen.mergeFormat0Tracks([
  format0("Drums", 9, drumNotes, true),
  format0("Bass", 0, bassNotes)
]);
const mergedLead = gen.mergeFormat0Tracks([
  format0("Drums", 9, drumNotes, true),
  format0("Synth Lead", 4, leadNotes)
]);

assert.equal(merged808.readUInt16BE(8), 1);
assert.equal(merged808.readUInt16BE(10), 2);
assert.equal(mergedLead.readUInt16BE(10), 2);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-hhd-smoke-"));
try {
  const fameRoot = path.join(__dirname);
  const importerPath = path.join(fameRoot, "midi", "import-midi.js");
  assert.ok(fs.existsSync(importerPath), "real FAME importer richiesto nello smoke");
  const { importMidiFile } = require(importerPath);

  function prov(kind) {
    return {
      sourceId: `hiphopdrummer:${kind}:test:abc`,
      originType: "licensed_dataset",
      creator: "Keith Adler / HHD test",
      licenseId: "HHD-GENERATED-OUTPUT-TEST",
      compositionFamily: `hiphopdrummer:${kind}:test:abc`,
      sourceUri: "https://github.com/keithadler/hiphopdrummer",
      rightsEvidence: ["smoke fixture"],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true
    };
  }

  const p808 = path.join(tmp,"808.mid"); fs.writeFileSync(p808, merged808);
  const pLead = path.join(tmp,"lead.mid"); fs.writeFileSync(pLead, mergedLead);

  const i808 = importMidiFile(p808, prov("808"), {});
  const iLead = importMidiFile(pLead, prov("lead"), {});

  assert.equal(i808.eligibility.technical, true);
  assert.equal(i808.eligibility.commercialTraining, true);
  assert.equal(i808.canonical.timing.bars, 8);
  const c808 = gen.countCanonicalRoles(i808);
  assert.ok(c808.drums >= 16);
  assert.ok(c808["808"] >= 4);
  assert.equal(c808.lead, 0);

  assert.equal(iLead.eligibility.technical, true);
  assert.equal(iLead.eligibility.commercialTraining, true);
  assert.equal(iLead.canonical.timing.bars, 8);
  const cLead = gen.countCanonicalRoles(iLead);
  assert.ok(cLead.drums >= 16);
  assert.ok(cLead.lead >= 4);
  assert.equal(cLead["808"], 0);
  console.log("FORMAT1 MERGE -> REAL FAME IMPORTER (DRUMS+808 / DRUMS+LEAD): OK");
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}

const curation = {
  dispositions: [
    { itemId:"a", provenance:{sourceId:"hiphopdrummer:808:crunk:a"} },
    { itemId:"b", provenance:{sourceId:"hiphopdrummer:808:crunk:b"} }
  ]
};
const queue = {
  items: [
    { itemId:"a", relationalSignals:[], reviewSignals:[{code:"RHYTHM_REVIEW_GROUP",detail:"same-rhythm"}] },
    { itemId:"b", relationalSignals:[], reviewSignals:[{code:"RHYTHM_REVIEW_GROUP",detail:"same-rhythm"}] }
  ]
};
const resolved = review.buildResolution(curation,queue);
assert.equal(resolved.report.totals.queueItems,2);
assert.equal(resolved.report.totals.acceptedKeepers,1);
assert.equal(resolved.report.totals.rejected,1);
console.log("HHD RHYTHM GROUP CONSERVATIVE DEDUP: OK");

assert.equal(slice.computeMaxSourcePhrases(322,0.20),80);
const targets = slice.targetsFromInventory({
  roleCoverage:{drums:113,"808":61,lead:48}
},{
  gateTargets:{drums:150,"808":75,lead:75},
  slice:{attempts:[{buffer808:8,bufferLead:10,bufferDrums:10}]}
},0);
assert.deepEqual(
  {need808:targets.need808,needLead:targets.needLead,needDrums:targets.needDrums,desired808:targets.desired808,desiredLead:targets.desiredLead},
  {need808:14,needLead:27,needDrums:37,desired808:22,desiredLead:37}
);
console.log("ROLE DEFICIT TARGETING + 20% CAP (MAX 80): OK");

assert.equal(runner.roleGatesClosed({roleCoverage:{drums:150,"808":75,lead:75}},{gateTargets:{drums:150,"808":75,lead:75}}),true);
assert.equal(runner.roleGatesClosed({roleCoverage:{drums:149,"808":75,lead:75}},{gateTargets:{drums:150,"808":75,lead:75}}),false);
console.log("ROLE GATE ASSERTIONS: OK");

console.log("HIPHOPDRUMMER ROLE CLOSER SMOKE TEST: OK");
