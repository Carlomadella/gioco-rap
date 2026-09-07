"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { evaluateCorpusDirectory } = require("./midi/corpus-gate");

function sha(char) {
  return String(char).repeat(64).slice(0, 64);
}

function validItem(index, overrides = {}) {
  const sourceSha256 = overrides.sourceSha256 || sha(String(index));
  const family = overrides.compositionFamily || `phase2-real-family-${Math.ceil(index / 2)}`;
  return {
    schema: "fame-neural-dataset-item-v1",
    version: 1,
    itemId: overrides.itemId || `phase2-source-${index}:${sourceSha256.slice(0, 16)}`,
    source: { fileName: `fixture-${index}.mid`, sha256: sourceSha256, midi: { format: 1, sourcePpq: 480, trackCount: 2, tracks: [] } },
    provenance: {
      sourceId: `phase2-source-${index}`,
      originType: "original",
      creator: "FAME Neural Final Gate Fixture",
      licenseId: "FAME-ORIGINAL-TEST",
      compositionFamily: family,
      sourceUri: null,
      rightsEvidence: ["Fixture originale generata esclusivamente per il test automatico del gate."],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true,
      notes: ""
    },
    rights: {
      status: overrides.rightsStatus || "commercial-cleared",
      validationErrors: [],
      commercialTrainingAllowed: overrides.commercialTrainingAllowed !== false,
      commercialOutputAllowed: true
    },
    import: { status: "ok", errors: [], warnings: [], analysis: {} },
    eligibility: {
      technical: true,
      commercialTraining: overrides.commercialTraining !== false,
      reason: overrides.commercialTraining === false ? "rights-not-cleared" : "cleared"
    },
    canonical: {
      schema: "fame-neural-sequence-v1",
      version: 1,
      meta: {},
      timing: { ppq: 960, bpm: 140, bars: 1 },
      tonality: { rootPitchClass: 0, mode: "minor" },
      harmony: [],
      bars: [{}],
      events: []
    },
    canonicalSegments: []
  };
}

function writeItem(dir, name, item) {
  fs.writeFileSync(path.join(dir, `${name}.dataset-item.json`), `${JSON.stringify(item, null, 2)}\n`, "utf8");
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-neural-phase2-final-"));
try {
  const readyDir = path.join(tmp, "ready");
  fs.mkdirSync(readyDir);
  writeItem(readyDir, "a", validItem(1));
  writeItem(readyDir, "b", validItem(2));
  writeItem(readyDir, "c", validItem(3));

  const ready = evaluateCorpusDirectory(readyDir, { minItems: 3, minCompositionFamilies: 2 });
  assert.equal(ready.ready, true, ready.blockingIssues.join("; "));
  assert.equal(ready.totals.discovered, 3);
  assert.equal(ready.totals.valid, 3);
  assert.equal(ready.totals.compositionFamilies, 2);
  assert.equal(ready.totals.canonicalSequences, 3);
  assert.equal(ready.manifest.length, 3);

  const duplicateDir = path.join(tmp, "duplicate");
  fs.mkdirSync(duplicateDir);
  const duplicatedSha = sha("d");
  writeItem(duplicateDir, "a", validItem(1, { sourceSha256: duplicatedSha }));
  writeItem(duplicateDir, "b", validItem(2, { sourceSha256: duplicatedSha }));
  writeItem(duplicateDir, "c", validItem(3));
  const duplicate = evaluateCorpusDirectory(duplicateDir, { minItems: 3 });
  assert.equal(duplicate.ready, false);
  assert.equal(duplicate.totals.duplicateSourceSha256, 1);
  assert.ok(duplicate.blockingIssues.some(issue => issue.includes("SHA-256")));

  const rightsDir = path.join(tmp, "rights");
  fs.mkdirSync(rightsDir);
  writeItem(rightsDir, "a", validItem(1));
  writeItem(rightsDir, "b", validItem(2, { commercialTraining: false, commercialTrainingAllowed: false, rightsStatus: "analysis-only" }));
  writeItem(rightsDir, "c", validItem(3));
  const rights = evaluateCorpusDirectory(rightsDir, { minItems: 3 });
  assert.equal(rights.ready, false);
  assert.equal(rights.totals.invalid, 1);
  assert.ok(rights.items.find(item => item.fileName === "b.dataset-item.json").issues.some(issue => issue.includes("commercialTraining")));

  const tooSmallDir = path.join(tmp, "small");
  fs.mkdirSync(tooSmallDir);
  writeItem(tooSmallDir, "a", validItem(1));
  const tooSmall = evaluateCorpusDirectory(tooSmallDir, { minItems: 3 });
  assert.equal(tooSmall.ready, false);
  assert.ok(tooSmall.blockingIssues.some(issue => issue.includes("almeno 3")));

  console.log("FASE 2 / GATE FINALE");
  console.log(`READY corpus: ${ready.totals.valid}/${ready.totals.discovered}, family=${ready.totals.compositionFamilies}, sequence=${ready.totals.canonicalSequences}`);
  console.log("EXACT SOURCE DUPLICATE BLOCK: OK");
  console.log("RIGHTS BLOCK: OK");
  console.log("MINIMUM CORPUS BLOCK: OK");
  console.log("MANIFEST READY: OK");
  console.log("FASE 2 FINAL GATE SMOKE TEST: OK");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
