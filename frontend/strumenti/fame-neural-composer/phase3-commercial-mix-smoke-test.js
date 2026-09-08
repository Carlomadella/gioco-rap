"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { selectFamilies, writeSelection } = require("./dataset/select-free-midi-chords");
const { buildComposition } = require("./dataset/generate-fame-original-seed");
const { mergePhraseDirs } = require("./dataset/merge-phrase-corpora");

function touchMidi(filePath, byte) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from([0x4d, 0x54, 0x68, 0x64, byte]));
}

console.log("FASE 3 / COMMERCIAL MIX V1");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "fame-free-chords-fixture-"));
const cfg = {
  repository: "ldrolez/free-midi-chords",
  releaseTag: "vTEST",
  assetName: "fixture.zip",
  downloadUrl: "https://example.invalid/fixture.zip",
  sha256: "a".repeat(64),
  licenseId: "MIT",
  creator: "Ludovic Drolez",
  maxFamilies: 4,
  categories: ["Minor", "Modal"],
  styles: ["hiphop2 style", "soul style", "pop2 style"]
};

for (const key of ["01 - C Major - A minor", "02 - Db Major - Bb minor"]) {
  touchMidi(path.join(root, key, "4 Progression", "Minor", "hiphop2 style", "A - i VI III VII - Dark.mid"), 1);
  touchMidi(path.join(root, key, "4 Progression", "Minor", "hiphop2 style", "A - i iv VI V - Cold.mid"), 2);
  touchMidi(path.join(root, key, "4 Progression", "Modal", "soul style", "C - I bVII IV I - Modal.mid"), 3);
}
touchMidi(path.join(root, "01 - C Major - A minor", "1 Triad", "Minor", "i - Am.mid"), 9);

const selected = selectFamilies(root, cfg);
assert.equal(selected.candidates.length, 6);
assert.equal(selected.families.length, 3);
assert.equal(selected.selected.length, 3);
assert.ok(selected.selected.every(x => x.variants === 2));
console.log("TRANSPOSITION FAMILY COLLAPSE: OK");

const out = path.join(root, "selected");
const report = writeSelection(root, out, cfg);
assert.equal(report.totals.selectedFamilies, 3);
assert.equal(fs.readdirSync(out).filter(name => name.endsWith(".mid")).length, 3);
assert.equal(fs.readdirSync(out).filter(name => name.endsWith(".provenance.json")).length, 3);
assert.ok(fs.existsSync(path.join(out, "LICENSE.free-midi-chords.txt")));
console.log("MIT PROVENANCE + SELECTION: OK");

const seed = buildComposition(0);
assert.equal(seed.midi.slice(0, 4).toString("ascii"), "MThd");
assert.equal(seed.provenance.commercialTrainingAllowed, true);
assert.ok(seed.summary.bassNotes > 20 && seed.summary.harmonyNotes > 20 && seed.summary.leadNotes > 20);
console.log("FAME ORIGINAL SEED: OK");

const p1 = path.join(root, "phrases-a");
const p2 = path.join(root, "phrases-b");
const merged = path.join(root, "merged");
fs.mkdirSync(p1); fs.mkdirSync(p2);
const phraseA = {
  schema: "fame-neural-phrase-item-v1",
  phraseId: "a:phrase:0",
  sourceDatasetItemId: "a",
  provenance: { sourceId: "fame-original-seed-v1:a" }
};
const phraseB = {
  schema: "fame-neural-phrase-item-v1",
  phraseId: "b:phrase:0",
  sourceDatasetItemId: "b",
  provenance: { sourceId: "free-midi-chords:b" }
};
fs.writeFileSync(path.join(p1, "a.phrase-item.json"), JSON.stringify(phraseA));
fs.writeFileSync(path.join(p2, "b.phrase-item.json"), JSON.stringify(phraseB));
const merge = mergePhraseDirs(merged, [p1, p2]);
assert.equal(merge.totals.phrases, 2);
assert.deepEqual([...new Set(merge.phrases.map(x => x.sourceCollection))].sort(), ["fame-original-seed-v1", "free-midi-chords"]);
console.log("TWO-SOURCE PHRASE MERGE: OK");

fs.rmSync(root, { recursive: true, force: true });

console.log("COMMERCIAL MIX V1 SMOKE TEST: OK");
