"use strict";

const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = __dirname;
const owned = path.join(root, "owned-beats");
const reviewPath = path.join(owned, "source-separation-pilot-review-v1.json");
const qa = require(path.join(owned, "source-separation-development-qa.js"));

function sha256Bytes(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "fame-source-sep-qa-"));
const runId = "source-separation-development-inference-v1-test";
const runDir = path.join(workspace, "runs", "source-separation-development-inference", runId);
fs.mkdirSync(path.join(runDir, "results"), { recursive: true });

const stems = ["drums", "bass", "other", "vocals"];
const sources = [];

for (let i = 0; i < 8; i++) {
  const sourceRecordId = `FAME_TEST_${String(i + 1).padStart(3, "0")}`;
  const outputRelativePath = path.posix.join("outputs", sourceRecordId);
  const outputDir = path.join(runDir, outputRelativePath);
  fs.mkdirSync(outputDir, { recursive: true });

  const source = {
    compositionFamilyId: `family-${i + 1}`,
    sourceRecordId,
    sourceAssetId: `sha256:source-${i + 1}`,
    sha256: `source-${i + 1}`,
    outputRelativePath
  };
  sources.push(source);

  const stemMeta = {};
  for (const stem of stems) {
    const bytes = Buffer.from(`${sourceRecordId}:${stem}:fixture\n`, "utf8");
    const file = path.join(outputDir, `${stem}.wav`);
    fs.writeFileSync(file, bytes);
    stemMeta[stem] = {
      path: file,
      sha256: sha256Buffer(bytes),
      samplesPerChannel: 44100,
      channels: 2,
      sampleRate: 44100,
      finite: true,
      peakAbs: 0.5,
      rms: 0.1
    };
  }

  fs.writeFileSync(
    path.join(runDir, "results", `${sourceRecordId}.json`),
    JSON.stringify({
      schema: "fame-owned-beats-source-separation-development-inference-result-v1",
      version: 1,
      runId,
      source: {
        compositionFamilyId: source.compositionFamilyId,
        sourceRecordId: source.sourceRecordId,
        sourceAssetId: source.sourceAssetId,
        sha256: source.sha256
      },
      adapterResult: {
        mode: "SOURCE_SEPARATION_STANDALONE_FILE_PASS",
        sourceSha256: source.sha256,
        sampleRate: 44100,
        sourceTechnical: {
          samplesPerChannel: 44100,
          channels: 2,
          sampleRate: 44100,
          finite: true,
          peakAbs: 0.9,
          rms: 0.2
        },
        technicalValidation: {
          allStemsFinite: true,
          allStemsStereo: true,
          allStemsSampleRate44100: true,
          allStemsSameSamplesAsSource: true,
          stemSumResidualRms: 0.01,
          stemSumResidualRmsRatio: 0.05
        },
        stems: stemMeta,
        finalHoldoutAccessedByThisCommand: false
      }
    }, null, 2) + "\n"
  );
}

fs.writeFileSync(
  path.join(runDir, "execution-receipt.json"),
  JSON.stringify({
    schema: "fame-owned-beats-source-separation-development-inference-v1",
    version: 1,
    status: "AUTHORIZED_NO_INFERENCE",
    runId,
    reviewSha256: sha256Bytes(reviewPath),
    sources,
    safety: {
      split: "development",
      sourceFamiliesLocked: true,
      finalHoldoutExcluded: true,
      batch131Authorized: false,
      trainingAuthorized: false
    }
  }, null, 2) + "\n"
);

fs.writeFileSync(
  path.join(runDir, "inference-summary.json"),
  JSON.stringify({
    schema: "fame-owned-beats-source-separation-development-inference-summary-v1",
    version: 1,
    status: "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
    runId,
    records: 8,
    technicalValidationPassed: true,
    safety: {
      split: "development",
      finalHoldoutAccessed: false,
      batch131Executed: false,
      trainingAuthorized: false,
      taskDataReadyMayBeDeclared: false
    }
  }, null, 2) + "\n"
);

try {
  const result = qa.technical(workspace, runId);
  assert.equal(result.mode, "SOURCE_SEPARATION_TECHNICAL_QA_PASS");
  assert.equal(result.technicalGate, "ALL_8_FAMILIES_PASS");
  assert.equal(result.recordsVerified, 8);
  assert.equal(result.stemsVerified, 32);
  assert.equal(result.finalHoldoutAccessedByThisCommand, false);
  assert.equal(result.batch131AccessedByThisCommand, false);
  assert.equal(result.trainingAuthorized, false);

  const corrupt = path.join(runDir, "outputs", sources[0].sourceRecordId, "drums.wav");
  fs.appendFileSync(corrupt, "corrupt");
  assert.throws(
    () => qa.technical(workspace, runId),
    /Stem artifact verification failed/
  );
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}

console.log("owned-beats-source-separation-development-qa-test: PASS");
