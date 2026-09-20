"use strict";

const cp = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const pilot = require("./source-separation-pilot");

const HERE = __dirname;
const CONTRACT_FILE = path.join(HERE, "source-separation-execution-contract-v1.json");
const REVIEW_FILE = path.join(HERE, "source-separation-pilot-review-v1.json");
const ENV_SPEC_FILE = path.join(HERE, "source-separation-environment-v1.json");
const ADAPTER_FILE = path.join(HERE, "source-separation-standalone-adapter.py");
const RUNNER_FILE = __filename;
const DEFAULT_RUN_ID = "source-separation-development-inference-v1-001";
const SCHEMA = "fame-owned-beats-source-separation-development-inference-v1";
const MODEL_DEFAULT = "C:\\Program Files\\Audacity\\openvino-models\\htdemucs_v4.xml";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function sha256Bytes(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
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

function canonicalGitBlobSha(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const bytes = Buffer.from(text, "utf8");
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return crypto.createHash("sha1").update(header).update(bytes).digest("hex");
}

function safeRunId(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(value || "")) {
    throw new Error("run-id must match [A-Za-z0-9][A-Za-z0-9._-]{2,79}");
  }
  return value;
}

function safeArtifactId(value, label) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$/.test(value || "")) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
  return value;
}

function isWithin(root, target) {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function resolveWithin(root, relativePath, label) {
  if (typeof relativePath !== "string" || !relativePath.trim() || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe ${label} relative path: ${relativePath}`);
  }
  const target = path.resolve(root, relativePath);
  if (!isWithin(root, target)) {
    throw new Error(`Unsafe ${label} path escapes workspace: ${relativePath}`);
  }
  return target;
}

function validateContract(contract) {
  if (
    contract?.schema !== "fame-owned-beats-source-separation-execution-contract-v1" ||
    contract.version !== 1 ||
    contract.status !== "FROZEN_BEFORE_FIRST_PILOT_OUTPUT" ||
    contract.sourceRunId !== "source-separation-pilot-v1-001" ||
    contract.execution?.sampleRate !== 44100 ||
    contract.execution?.device !== "CPU" ||
    contract.execution?.shifts !== 1 ||
    contract.execution?.shiftSeed !== 0 ||
    contract.execution?.overlap !== 0.25 ||
    contract.execution?.segmentSamples !== 343980 ||
    contract.execution?.cacheRelativePath !== "cache/source-separation-openvino" ||
    contract.execution?.audioIO?.decodeSampleRate !== 44100 ||
    contract.execution?.audioIO?.channels !== 2 ||
    contract.execution?.audioIO?.internalSampleFormat !== "float32" ||
    contract.execution?.audioIO?.stemContainer !== "wav" ||
    contract.execution?.audioIO?.stemCodec !== "pcm_f32le" ||
    JSON.stringify(contract.execution?.expectedStems) !== JSON.stringify(["drums", "bass", "other", "vocals"]) ||
    JSON.stringify(contract.execution?.technicalMeasures) !== JSON.stringify(["peakAbs", "rms", "stemSumResidualRmsRatio"]) ||
    contract.adapter?.path !== "source-separation-standalone-adapter.py" ||
    contract.batchRunner?.path !== "source-separation-development-inference.js" ||
    contract.safety?.split !== "development" ||
    contract.safety?.expectedFamilies !== 8 ||
    contract.safety?.finalHoldoutAccessAllowed !== false ||
    contract.safety?.batch131Authorized !== false ||
    contract.safety?.trainingAuthorized !== false ||
    contract.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Unsupported or unsafe Source Separation execution contract");
  }
  return contract;
}

function validateFrozenRepositoryArtifacts() {
  const contract = validateContract(readJson(CONTRACT_FILE));
  const review = readJson(REVIEW_FILE);
  const envSpec = readJson(ENV_SPEC_FILE);

  if (
    review.schema !== "fame-owned-beats-source-separation-pilot-review-v1" ||
    review.status !== "FROZEN_BEFORE_FIRST_PILOT_OUTPUT" ||
    review.scope?.split !== "development" ||
    review.scope?.expectedFamilies !== 8 ||
    review.scope?.holdoutAllowed !== false ||
    review.scope?.batch131Allowed !== false
  ) {
    throw new Error("Unsupported Source Separation review contract");
  }

  const reviewSha256 = sha256Bytes(REVIEW_FILE);
  if (reviewSha256 !== contract.review.sha256) {
    throw new Error(`Review SHA256 mismatch: ${reviewSha256}`);
  }

  const adapterGitBlobSha = canonicalGitBlobSha(ADAPTER_FILE);
  if (adapterGitBlobSha !== contract.adapter.gitBlobSha) {
    throw new Error(`Adapter Git blob mismatch: ${adapterGitBlobSha}`);
  }

  const runnerGitBlobSha = canonicalGitBlobSha(RUNNER_FILE);
  if (runnerGitBlobSha !== contract.batchRunner.gitBlobSha) {
    throw new Error(`Batch runner Git blob mismatch: ${runnerGitBlobSha}`);
  }

  const lockFile = path.join(HERE, envSpec.lock.path);
  const lockSha256 = sha256Bytes(lockFile);
  if (
    envSpec.status !== "EXACT_TRANSITIVE_LOCK_COMMITTED" ||
    envSpec.lock?.committed !== true ||
    envSpec.lock?.reviewed !== true ||
    lockSha256 !== envSpec.lock.repositoryCanonicalSha256 ||
    envSpec.lock.sourcePipFreezeAllSha256 !== contract.environment.sourcePipFreezeAllSha256
  ) {
    throw new Error("Source Separation environment lock no longer matches the frozen contract");
  }

  return {
    contract,
    review,
    envSpec,
    contractSha256: sha256Bytes(CONTRACT_FILE),
    reviewSha256,
    environmentSpecSha256: sha256Bytes(ENV_SPEC_FILE),
    lockSha256,
    adapterGitBlobSha,
    runnerGitBlobSha
  };
}

function modelIdentity(xmlPath, pilotRun) {
  const xml = path.resolve(xmlPath);
  if (!/\.xml$/i.test(xml)) throw new Error(`Model path must end in .xml: ${xml}`);
  const bin = xml.replace(/\.xml$/i, ".bin");
  if (!fs.existsSync(xml) || !fs.statSync(xml).isFile()) throw new Error(`Model XML missing: ${xml}`);
  if (!fs.existsSync(bin) || !fs.statSync(bin).isFile()) throw new Error(`Model BIN missing: ${bin}`);

  const expected = pilotRun.separatorCandidate?.modelArtifact?.files || {};
  const xmlSha256 = sha256File(xml);
  const binSha256 = sha256File(bin);
  if (xmlSha256 !== expected["htdemucs_v4.xml"]) throw new Error(`Frozen model XML SHA256 mismatch: ${xmlSha256}`);
  if (binSha256 !== expected["htdemucs_v4.bin"]) throw new Error(`Frozen model BIN SHA256 mismatch: ${binSha256}`);

  return { xmlPath: xml, xmlSha256, binPath: bin, binSha256, exactFrozenArtifact: true };
}

function probeFfmpeg() {
  const which = process.platform === "win32" ? "where.exe" : "which";
  const where = cp.spawnSync(which, ["ffmpeg"], { encoding: "utf8" });
  if (where.status !== 0) throw new Error("ffmpeg not found on PATH");
  const ffmpegPath = String(where.stdout || "").split(/\r?\n/).map(x => x.trim()).find(Boolean);
  if (!ffmpegPath) throw new Error("ffmpeg path could not be resolved");

  const version = cp.spawnSync(ffmpegPath, ["-version"], { encoding: "utf8" });
  if (version.status !== 0) throw new Error("ffmpeg -version failed");
  const versionLine = String(version.stdout || version.stderr || "").split(/\r?\n/)[0] || null;
  return { path: ffmpegPath, versionLine };
}

function venvPython(workspace) {
  return path.join(
    workspace,
    "venv-source-separation",
    process.platform === "win32" ? "Scripts" : "bin",
    process.platform === "win32" ? "python.exe" : "python"
  );
}

function pilotRunFile(workspace, runId) {
  return path.join(workspace, "runs", "source-separation-pilot", runId, "run-manifest.json");
}

function executionRoot(workspace) {
  return path.join(workspace, "runs", "source-separation-development-inference");
}

function executionDir(workspace, runId) {
  return path.join(executionRoot(workspace), runId);
}

function identity(source) {
  return {
    compositionFamilyId: source.compositionFamilyId,
    sourceRecordId: source.sourceRecordId,
    sourceAssetId: source.sourceAssetId,
    sha256: source.sha256
  };
}

function validateSource(source, workspace) {
  const sourcePath = resolveWithin(workspace, source.localPath, "source");
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error(`Prepared source missing: ${source.sourceRecordId}`);
  }
  const actual = sha256File(sourcePath);
  if (actual !== source.sha256) {
    throw new Error(`Prepared source SHA256 mismatch: ${source.sourceRecordId}`);
  }
  return sourcePath;
}

function parseAdapterJson(stdout) {
  const raw = String(stdout || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const marker = raw.lastIndexOf("\n{");
    if (marker >= 0) return JSON.parse(raw.slice(marker + 1));
    throw new Error("Standalone adapter did not return parseable JSON");
  }
}

function validateReceiptAgainstCurrent(workspace, runId) {
  const dir = executionDir(workspace, runId);
  const file = path.join(dir, "execution-receipt.json");
  if (!fs.existsSync(file)) throw new Error(`Execution receipt missing: ${runId}`);
  const receipt = readJson(file);
  const frozen = validateFrozenRepositoryArtifacts();

  if (
    receipt.schema !== SCHEMA ||
    receipt.version !== 1 ||
    receipt.status !== "AUTHORIZED_NO_INFERENCE" ||
    receipt.runId !== runId ||
    receipt.sourcePilotRunId !== frozen.contract.sourceRunId ||
    receipt.executionContractSha256 !== frozen.contractSha256 ||
    receipt.reviewSha256 !== frozen.reviewSha256 ||
    receipt.environmentSpecSha256 !== frozen.environmentSpecSha256 ||
    receipt.environmentLockSha256 !== frozen.lockSha256 ||
    receipt.adapter?.gitBlobSha !== frozen.adapterGitBlobSha ||
    receipt.batchRunner?.gitBlobSha !== frozen.runnerGitBlobSha ||
    !Array.isArray(receipt.sources) ||
    receipt.sources.length !== frozen.contract.safety.expectedFamilies
  ) {
    throw new Error("Execution receipt no longer matches frozen repository artifacts");
  }

  const pilotStatus = pilot.check(workspace, frozen.contract.sourceRunId);
  if (pilotStatus.status !== "PREPARED_NO_INFERENCE" || pilotStatus.records !== 8) {
    throw new Error("Prepared pilot is no longer valid for development inference");
  }

  const currentPilotSha = sha256Bytes(pilotRunFile(workspace, frozen.contract.sourceRunId));
  if (receipt.sourcePilotManifestSha256 !== currentPilotSha) {
    throw new Error("Prepared pilot manifest changed after receipt creation");
  }

  for (const source of receipt.sources) validateSource(source, workspace);
  return { dir, file, receipt, frozen };
}

function prepare(workspaceRoot, runId = DEFAULT_RUN_ID, modelXml = MODEL_DEFAULT) {
  if (process.env.FAME_SOURCE_SEP_PREINFERENCE_GATE !== "PASS") {
    throw new Error("Pre-inference gate evidence missing; use prepare-source-separation-development-inference.ps1");
  }

  runId = safeRunId(runId);
  const workspace = path.resolve(workspaceRoot);
  const frozen = validateFrozenRepositoryArtifacts();
  const pilotStatus = pilot.check(workspace, frozen.contract.sourceRunId);
  if (pilotStatus.status !== "PREPARED_NO_INFERENCE" || pilotStatus.records !== 8) {
    throw new Error("Prepared pilot is not eligible for inference receipt");
  }

  const preparedPilotFile = pilotRunFile(workspace, frozen.contract.sourceRunId);
  const preparedPilot = readJson(preparedPilotFile);
  const py = venvPython(workspace);
  if (!fs.existsSync(py) || !fs.statSync(py).isFile()) throw new Error(`Dedicated venv Python missing: ${py}`);

  const environmentReceiptFile = path.join(
    workspace,
    "runs",
    "source-separation-environment",
    frozen.contract.environment.sourceEnvironmentRunId,
    "environment-receipt.json"
  );
  if (!fs.existsSync(environmentReceiptFile)) throw new Error(`Environment receipt missing: ${environmentReceiptFile}`);
  const environmentReceipt = readJson(environmentReceiptFile);
  if (environmentReceipt.pipFreezeAllSha256 !== frozen.contract.environment.sourcePipFreezeAllSha256) {
    throw new Error("Local environment receipt no longer matches frozen pip freeze");
  }

  const model = modelIdentity(modelXml, preparedPilot);
  const ffmpeg = probeFfmpeg();

  const sources = preparedPilot.sources.map(source => {
    safeArtifactId(source.sourceRecordId, "sourceRecordId");
    validateSource(source, workspace);
    return {
      ...identity(source),
      format: source.format,
      bytes: source.bytes,
      localPath: source.localPath,
      outputRelativePath: path.posix.join("outputs", source.sourceRecordId)
    };
  });

  if (sources.length !== 8 || new Set(sources.map(s => s.compositionFamilyId)).size !== 8) {
    throw new Error("Inference receipt requires exactly 8 distinct development families");
  }

  const finalDir = executionDir(workspace, runId);
  if (fs.existsSync(finalDir)) throw new Error(`Append-only execution run already exists: ${finalDir}`);

  const payload = {
    schema: SCHEMA,
    version: 1,
    status: "AUTHORIZED_NO_INFERENCE",
    runId,
    preparedAt: new Date().toISOString(),
    sourcePilotRunId: frozen.contract.sourceRunId,
    sourcePilotManifestSha256: sha256Bytes(preparedPilotFile),
    openingProtocolDigestSha256: preparedPilot.protocolDigestSha256,
    executionContractSha256: frozen.contractSha256,
    reviewSha256: frozen.reviewSha256,
    environmentSpecSha256: frozen.environmentSpecSha256,
    environmentLockSha256: frozen.lockSha256,
    environmentReceipt: {
      runId: frozen.contract.environment.sourceEnvironmentRunId,
      pipFreezeAllSha256: environmentReceipt.pipFreezeAllSha256,
      python: py
    },
    adapter: {
      path: frozen.contract.adapter.path,
      gitBlobSha: frozen.adapterGitBlobSha,
      implementationCommit: frozen.contract.adapter.implementationCommit
    },
    batchRunner: {
      path: frozen.contract.batchRunner.path,
      gitBlobSha: frozen.runnerGitBlobSha,
      implementationCommit: frozen.contract.batchRunner.implementationCommit
    },
    model,
    ffmpeg,
    execution: {
      ...frozen.contract.execution
    },
    sources,
    safety: {
      split: "development",
      sourceFamiliesLocked: true,
      finalHoldoutExcluded: true,
      batch131Authorized: false,
      trainingAuthorized: false,
      taskDataReadyMayBeDeclared: false
    },
    evidence: {
      preInferenceGatePassedImmediatelyBeforeReceipt: true,
      sourceAudioOpenedByPrepareCommand: false,
      sourceSeparationExecutedByPrepareCommand: false
    },
    nextAction: "EXECUTE_DEVELOPMENT_INFERENCE_APPEND_ONLY"
  };

  const root = executionRoot(workspace);
  fs.mkdirSync(root, { recursive: true });
  const temp = path.join(root, `.${runId}.${crypto.randomUUID()}.preparing`);
  fs.mkdirSync(temp, { recursive: false });
  try {
    fs.writeFileSync(path.join(temp, "execution-receipt.json"), JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
    fs.renameSync(temp, finalDir);
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }

  return {
    mode: "SOURCE_SEPARATION_DEVELOPMENT_INFERENCE_RECEIPT_PREPARED",
    runId,
    runDirectory: finalDir,
    records: sources.length,
    status: payload.status,
    sourceFamiliesLocked: true,
    sourceAudioOpenedByThisCommand: false,
    sourceSeparationExecutedByThisCommand: false,
    finalHoldoutAccessedByThisCommand: false,
    nextAction: payload.nextAction
  };
}

function check(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const workspace = path.resolve(workspaceRoot);
  const checked = validateReceiptAgainstCurrent(workspace, runId);
  return {
    mode: "SOURCE_SEPARATION_DEVELOPMENT_INFERENCE_RECEIPT_CHECK",
    runId,
    status: checked.receipt.status,
    records: checked.receipt.sources.length,
    sourceFamiliesLocked: checked.receipt.safety.sourceFamiliesLocked,
    finalHoldoutExcluded: checked.receipt.safety.finalHoldoutExcluded,
    batch131Authorized: checked.receipt.safety.batch131Authorized,
    trainingAuthorized: checked.receipt.safety.trainingAuthorized,
    nextAction: checked.receipt.nextAction
  };
}

function validateAdapterResult(result, source, receipt, outputDir) {
  if (
    result?.mode !== "SOURCE_SEPARATION_STANDALONE_FILE_PASS" ||
    result.sourceSha256 !== source.sha256 ||
    result.device !== receipt.execution.device ||
    result.sampleRate !== receipt.execution.sampleRate ||
    result.shifts !== receipt.execution.shifts ||
    result.shiftSeed !== receipt.execution.shiftSeed ||
    result.overlap !== receipt.execution.overlap ||
    result.finalHoldoutAccessedByThisCommand !== false
  ) {
    throw new Error(`Adapter result contract mismatch: ${source.sourceRecordId}`);
  }

  const names = Object.keys(result.stems || {}).sort();
  const expected = [...receipt.execution.expectedStems].sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected stem set: ${source.sourceRecordId}`);
  }

  const tech = result.technicalValidation || {};
  if (
    tech.allStemsFinite !== true ||
    tech.allStemsStereo !== true ||
    tech.allStemsSampleRate44100 !== true ||
    tech.allStemsSameSamplesAsSource !== true
  ) {
    throw new Error(`Stem technical validation failed: ${source.sourceRecordId}`);
  }

  for (const stem of receipt.execution.expectedStems) {
    const item = result.stems[stem];
    const stemPath = path.join(outputDir, `${stem}.wav`);
    if (!fs.existsSync(stemPath) || sha256File(stemPath) !== item.sha256) {
      throw new Error(`Stem artifact SHA256 mismatch: ${source.sourceRecordId}/${stem}`);
    }
  }
}

function execute(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const workspace = path.resolve(workspaceRoot);
  const checked = validateReceiptAgainstCurrent(workspace, runId);
  const { dir, receipt } = checked;
  const summaryFile = path.join(dir, "inference-summary.json");
  if (fs.existsSync(summaryFile)) throw new Error(`Inference run already finalized: ${summaryFile}`);

  const resultsDir = path.join(dir, "results");
  fs.mkdirSync(resultsDir, { recursive: true });
  const cacheDir = resolveWithin(workspace, receipt.execution.cacheRelativePath, "OpenVINO cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  const py = receipt.environmentReceipt.python;
  const results = [];

  for (let i = 0; i < receipt.sources.length; i++) {
    const source = receipt.sources[i];
    const resultFile = path.join(resultsDir, `${source.sourceRecordId}.json`);
    const outputDir = resolveWithin(dir, source.outputRelativePath, "stem output");

    if (fs.existsSync(resultFile)) {
      const existing = readJson(resultFile);
      validateAdapterResult(existing.adapterResult, source, receipt, outputDir);
      results.push(existing);
      process.stderr.write(`[${i + 1}/${receipt.sources.length}] verified existing ${source.sourceRecordId}\n`);
      continue;
    }

    if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
      throw new Error(`Partial output without append-only result receipt: ${source.sourceRecordId}`);
    }

    const sourcePath = validateSource(source, workspace);
    process.stderr.write(`[${i + 1}/${receipt.sources.length}] separating ${source.sourceRecordId}\n`);

    const args = [
      ADAPTER_FILE,
      "separate-file",
      sourcePath,
      outputDir,
      "--model", receipt.model.xmlPath,
      "--device", receipt.execution.device,
      "--cache-dir", cacheDir,
      "--shifts", String(receipt.execution.shifts),
      "--shift-seed", String(receipt.execution.shiftSeed)
    ];
    const run = cp.spawnSync(py, args, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024
    });
    if (run.status !== 0) {
      throw new Error(
        `Adapter failed for ${source.sourceRecordId}: ${String(run.stderr || run.stdout || "").trim()}`
      );
    }

    const adapterResult = parseAdapterJson(run.stdout);
    validateAdapterResult(adapterResult, source, receipt, outputDir);

    const item = {
      schema: "fame-owned-beats-source-separation-development-inference-result-v1",
      version: 1,
      runId,
      completedAt: new Date().toISOString(),
      source: identity(source),
      adapterResult
    };
    fs.writeFileSync(resultFile, JSON.stringify(item, null, 2) + "\n", { flag: "wx" });
    results.push(item);
  }

  if (results.length !== receipt.sources.length) {
    throw new Error("Not all development sources produced an append-only result receipt");
  }

  const summary = {
    schema: "fame-owned-beats-source-separation-development-inference-summary-v1",
    version: 1,
    status: "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
    runId,
    completedAt: new Date().toISOString(),
    records: results.length,
    expectedStems: receipt.execution.expectedStems,
    technicalValidationPassed: results.every(item => {
      const t = item.adapterResult.technicalValidation;
      return t.allStemsFinite && t.allStemsStereo && t.allStemsSampleRate44100 && t.allStemsSameSamplesAsSource;
    }),
    stemSumResidualRmsRatios: results.map(item => ({
      sourceRecordId: item.source.sourceRecordId,
      value: item.adapterResult.technicalValidation.stemSumResidualRmsRatio
    })),
    safety: {
      split: "development",
      finalHoldoutAccessed: false,
      batch131Executed: false,
      trainingAuthorized: false,
      taskDataReadyMayBeDeclared: false
    },
    nextAction: "RUN_FROZEN_TECHNICAL_AND_HUMAN_QA"
  };
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2) + "\n", { flag: "wx" });

  return {
    mode: "SOURCE_SEPARATION_DEVELOPMENT_INFERENCE_COMPLETE",
    runId,
    records: results.length,
    status: summary.status,
    technicalValidationPassed: summary.technicalValidationPassed,
    finalHoldoutAccessedByThisCommand: false,
    batch131ExecutedByThisCommand: false,
    trainingAuthorized: false,
    nextAction: summary.nextAction
  };
}

async function main(args = process.argv.slice(2)) {
  const [command, workspace, runId, modelXml] = args;
  if (!command || !workspace) {
    throw new Error(
      "Usage: node source-separation-development-inference.js <prepare|check|execute> <workspace> [run-id] [model-xml]"
    );
  }

  let result;
  if (command === "prepare") result = prepare(workspace, runId || DEFAULT_RUN_ID, modelXml || MODEL_DEFAULT);
  else if (command === "check") result = check(workspace, runId || DEFAULT_RUN_ID);
  else if (command === "execute") result = execute(workspace, runId || DEFAULT_RUN_ID);
  else throw new Error(`Unknown command: ${command}`);

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  prepare,
  check,
  execute,
  validateContract,
  resolveWithin,
  canonicalGitBlobSha
};
