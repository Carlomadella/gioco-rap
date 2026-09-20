"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const REVIEW_FILE = path.join(HERE, "source-separation-pilot-review-v1.json");
const DEFAULT_RUN_ID = "source-separation-development-inference-v1-001";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function sha256File(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    while (true) {
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!bytes) break;
      h.update(buffer.subarray(0, bytes));
    }
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex");
}

function sha256Bytes(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function safeRunId(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(value || "")) {
    throw new Error("run-id must match [A-Za-z0-9][A-Za-z0-9._-]{2,79}");
  }
  return value;
}

function identityKey(record) {
  return [
    record.compositionFamilyId,
    record.sourceRecordId,
    record.sourceAssetId,
    record.sha256
  ].join("\u0000");
}

function finiteNumberOrNull(value, label) {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Non-finite metric ${label}: ${value}`);
  }
  return value;
}

function technical(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const workspace = path.resolve(workspaceRoot);
  const runDir = path.join(workspace, "runs", "source-separation-development-inference", runId);
  const receiptFile = path.join(runDir, "execution-receipt.json");
  const summaryFile = path.join(runDir, "inference-summary.json");

  for (const file of [receiptFile, summaryFile, REVIEW_FILE]) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new Error(`Required QA artifact missing: ${file}`);
    }
  }

  const receipt = readJson(receiptFile);
  const summary = readJson(summaryFile);
  const review = readJson(REVIEW_FILE);

  if (
    receipt.schema !== "fame-owned-beats-source-separation-development-inference-v1" ||
    receipt.version !== 1 ||
    receipt.status !== "AUTHORIZED_NO_INFERENCE" ||
    receipt.runId !== runId ||
    !Array.isArray(receipt.sources) ||
    receipt.sources.length !== 8 ||
    receipt.safety?.split !== "development" ||
    receipt.safety?.sourceFamiliesLocked !== true ||
    receipt.safety?.finalHoldoutExcluded !== true ||
    receipt.safety?.batch131Authorized !== false ||
    receipt.safety?.trainingAuthorized !== false
  ) {
    throw new Error("Unsafe or unsupported development inference receipt");
  }

  if (
    review.schema !== "fame-owned-beats-source-separation-pilot-review-v1" ||
    review.status !== "FROZEN_BEFORE_FIRST_PILOT_OUTPUT" ||
    review.scope?.expectedFamilies !== 8 ||
    review.scope?.holdoutAllowed !== false ||
    review.scope?.batch131Allowed !== false ||
    sha256Bytes(REVIEW_FILE) !== receipt.reviewSha256
  ) {
    throw new Error("Frozen Source Separation review rubric mismatch");
  }

  if (
    summary.schema !== "fame-owned-beats-source-separation-development-inference-summary-v1" ||
    summary.version !== 1 ||
    summary.runId !== runId ||
    summary.status !== "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA" ||
    summary.records !== 8 ||
    summary.technicalValidationPassed !== true ||
    summary.safety?.split !== "development" ||
    summary.safety?.finalHoldoutAccessed !== false ||
    summary.safety?.batch131Executed !== false ||
    summary.safety?.trainingAuthorized !== false ||
    summary.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Inference summary does not satisfy frozen technical QA prerequisites");
  }

  const expectedStems = review.technicalValidation.requiredStems;
  const expectedIds = new Set(receipt.sources.map(identityKey));
  const metrics = [];
  const verifiedRecords = [];

  for (const source of receipt.sources) {
    const resultFile = path.join(runDir, "results", `${source.sourceRecordId}.json`);
    if (!fs.existsSync(resultFile) || !fs.statSync(resultFile).isFile()) {
      throw new Error(`Result receipt missing: ${source.sourceRecordId}`);
    }

    const item = readJson(resultFile);
    const adapter = item.adapterResult;
    if (
      item.schema !== "fame-owned-beats-source-separation-development-inference-result-v1" ||
      item.version !== 1 ||
      item.runId !== runId ||
      identityKey(item.source) !== identityKey(source) ||
      !expectedIds.has(identityKey(item.source)) ||
      adapter?.mode !== "SOURCE_SEPARATION_STANDALONE_FILE_PASS" ||
      adapter.sourceSha256 !== source.sha256 ||
      adapter.sampleRate !== review.technicalValidation.requiredSampleRate ||
      adapter.finalHoldoutAccessedByThisCommand !== false
    ) {
      throw new Error(`Invalid result receipt: ${source.sourceRecordId}`);
    }

    const stemNames = Object.keys(adapter.stems || {}).sort();
    if (JSON.stringify(stemNames) !== JSON.stringify([...expectedStems].sort())) {
      throw new Error(`Unexpected stem set: ${source.sourceRecordId}`);
    }

    const tech = adapter.technicalValidation || {};
    if (
      tech.allStemsFinite !== true ||
      tech.allStemsStereo !== true ||
      tech.allStemsSampleRate44100 !== true ||
      tech.allStemsSameSamplesAsSource !== true
    ) {
      throw new Error(`Technical stem gate failed: ${source.sourceRecordId}`);
    }

    const outputDir = path.join(runDir, source.outputRelativePath);
    const stemMetrics = {};
    for (const stem of expectedStems) {
      const meta = adapter.stems[stem];
      const stemFile = path.join(outputDir, `${stem}.wav`);
      if (
        !fs.existsSync(stemFile) ||
        !fs.statSync(stemFile).isFile() ||
        sha256File(stemFile) !== meta.sha256 ||
        meta.sampleRate !== review.technicalValidation.requiredSampleRate ||
        meta.channels !== review.technicalValidation.requiredChannels ||
        meta.samplesPerChannel !== adapter.sourceTechnical.samplesPerChannel ||
        meta.finite !== true
      ) {
        throw new Error(`Stem artifact verification failed: ${source.sourceRecordId}/${stem}`);
      }

      stemMetrics[stem] = {
        peakAbs: finiteNumberOrNull(meta.peakAbs, `${source.sourceRecordId}/${stem}/peakAbs`),
        rms: finiteNumberOrNull(meta.rms, `${source.sourceRecordId}/${stem}/rms`)
      };
    }

    const residualRatio = finiteNumberOrNull(
      tech.stemSumResidualRmsRatio,
      `${source.sourceRecordId}/stemSumResidualRmsRatio`
    );

    metrics.push({
      sourceRecordId: source.sourceRecordId,
      stemSumResidualRmsRatio: residualRatio,
      stems: stemMetrics
    });
    verifiedRecords.push(source.sourceRecordId);
  }

  if (verifiedRecords.length !== 8) {
    throw new Error(`Technical QA expected 8 records, verified ${verifiedRecords.length}`);
  }

  return {
    mode: "SOURCE_SEPARATION_TECHNICAL_QA_PASS",
    runId,
    technicalGate: "ALL_8_FAMILIES_PASS",
    recordsVerified: verifiedRecords.length,
    stemsVerified: verifiedRecords.length * expectedStems.length,
    requiredStems: expectedStems,
    metricsMeasuredWithoutHardThreshold: review.technicalValidation.measureWithoutHardThreshold,
    metrics,
    finalHoldoutAccessedByThisCommand: false,
    batch131AccessedByThisCommand: false,
    trainingAuthorized: false,
    nextAction: "PERFORM_FROZEN_HUMAN_REVIEW_DRUMS_AND_BASS"
  };
}

function main(args = process.argv.slice(2)) {
  const [command, workspace, runId] = args;
  if (command !== "technical" || !workspace) {
    throw new Error(
      "Usage: node source-separation-development-qa.js technical <workspace> [run-id]"
    );
  }
  process.stdout.write(JSON.stringify(technical(workspace, runId || DEFAULT_RUN_ID), null, 2) + "\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { technical };
