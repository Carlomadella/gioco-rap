"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  buildIntakePlan,
  stageCommercialSources
} = require("./dataset/source-intake");

function writeMidi(filePath, byte) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from([0x4d, 0x54, 0x68, 0x64, byte]));
}

function writeSidecar(midiPath, payload) {
  const ext = path.extname(midiPath);
  const stem = midiPath.slice(0, -ext.length);
  fs.writeFileSync(`${stem}.provenance.json`, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function provenance(sourceId, family, allowed, originType = "original") {
  return {
    sourceId,
    originType,
    creator: "Phase 3 Source Expansion Fixture",
    licenseId: allowed ? "FAME-ORIGINAL-TEST" : "REFERENCE-ONLY",
    compositionFamily: family,
    sourceUri: null,
    rightsEvidence: ["Fixture test rights evidence."],
    commercialTrainingAllowed: allowed,
    commercialOutputAllowed: allowed
  };
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "fame-neural-intake-"));
const staging = path.join(root, "staging");
const a = path.join(root, "original", "beat-a.mid");
const b = path.join(root, "reference", "beat-b.midi");
const c = path.join(root, "missing", "beat-c.mid");
const d = path.join(root, "bad", "beat-d.mid");

writeMidi(a, 1);
writeMidi(b, 2);
writeMidi(c, 3);
writeMidi(d, 4);

writeSidecar(a, provenance("fame-original:beat-a", "family-a", true));
writeSidecar(b, provenance("reference:beat-b", "family-b", false, "third_party_unknown"));
writeSidecar(d, { sourceId: "broken" });

const plan = buildIntakePlan(root);
assert.equal(plan.totals.discovered, 4);
assert.equal(plan.totals.commercialCleared, 1);
assert.equal(plan.totals.analysisOnly, 1);
assert.equal(plan.totals.missingProvenance, 1);
assert.equal(plan.totals.invalidProvenance, 1);

const staged = stageCommercialSources(plan, staging);
assert.equal(staged.length, 1);
assert.equal(fs.readdirSync(staging).filter(x => x.endsWith(".mid")).length, 1);
assert.equal(fs.readdirSync(staging).filter(x => x.endsWith(".provenance.json")).length, 1);

const stagedSidecar = JSON.parse(
  fs.readFileSync(path.join(staging, staged[0].stagedSidecar), "utf8")
);
assert.equal(stagedSidecar.commercialTrainingAllowed, true);
assert.equal(stagedSidecar.sourceId, "fame-original:beat-a");

fs.rmSync(root, { recursive: true, force: true });

console.log("FASE 3 / SOURCE EXPANSION");
console.log("RECURSIVE MIDI DISCOVERY: OK");
console.log("COMMERCIAL RIGHTS FILTER: OK");
console.log("ANALYSIS-ONLY QUARANTINE: OK");
console.log("MISSING/INVALID PROVENANCE QUARANTINE: OK");
console.log("CLEARED STAGING: OK");
console.log("SOURCE EXPANSION SMOKE TEST: OK");
