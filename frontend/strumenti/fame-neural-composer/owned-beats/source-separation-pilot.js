"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validate: validateManifest } = require("./bootstrap");

const HERE = __dirname;
const PROTOCOL_FILE = path.join(HERE, "source-separation-pilot-protocol-v1.json");
const HOLDOUT_REFERENCE_FILE = path.join(HERE, "audio-analysis-holdout-cohort-r1-v2.json");
const DEFAULT_RUN_ID = "source-separation-pilot-v1-001";
const RUN_SCHEMA = "fame-owned-beats-source-separation-run-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function sha256Bytes(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);
    stream.on("data", chunk => h.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(h.digest("hex")));
  });
}

function safeRunId(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(value || "")) {
    throw new Error("run-id must match [A-Za-z0-9][A-Za-z0-9._-]{2,79}");
  }
  return value;
}

function identity(record) {
  return {
    compositionFamilyId: record.compositionFamilyId,
    sourceRecordId: record.sourceRecordId,
    sourceAssetId: record.sourceAssetId,
    sha256: record.sha256
  };
}

function identityKey(record) {
  const x = identity(record);
  return `${x.compositionFamilyId}\u0000${x.sourceRecordId}\u0000${x.sourceAssetId}\u0000${x.sha256}`;
}

function validateProtocol(protocol) {
  if (
    protocol?.schema !== "fame-owned-beats-source-separation-pilot-protocol-v1" ||
    protocol.version !== 1 ||
    protocol.status !== "OPENING_PROTOCOL" ||
    protocol.sourceCollectionId !== "fame-owned-beats-v1" ||
    protocol.selection?.split !== "development" ||
    protocol.selection?.expectedFamilies !== 8 ||
    !Array.isArray(protocol.selection?.blockedSplits) ||
    protocol.separatorCandidate?.mode !== "4_STEM" ||
    JSON.stringify(protocol.separatorCandidate?.expectedStems) !== JSON.stringify(["drums", "bass", "other", "vocals"]) ||
    protocol.safety?.holdoutAccessAllowed !== false ||
    protocol.safety?.trainingAuthorized !== false ||
    protocol.safety?.taskDataReadyMayBeDeclared !== false ||
    protocol.safety?.batch131Authorized !== false
  ) {
    throw new Error("Unsupported or unsafe source-separation pilot protocol");
  }
  return protocol;
}

function selectedDevelopmentRecords(manifest, protocol) {
  if (manifest.sourceCollectionId !== protocol.sourceCollectionId) {
    throw new Error("Unexpected sourceCollectionId");
  }
  const selected = manifest.records.filter(record =>
    record.presentInScan !== false && record.split === protocol.selection.split
  );
  if (selected.length !== protocol.selection.expectedFamilies) {
    throw new Error(`Expected ${protocol.selection.expectedFamilies} development records, found ${selected.length}`);
  }
  const families = selected.map(record => record.compositionFamilyId);
  if (
    families.some(value => typeof value !== "string" || !value.trim()) ||
    new Set(families).size !== selected.length
  ) {
    throw new Error("Development selection must contain one unique compositionFamilyId per record");
  }
  for (const record of selected) {
    if (
      typeof record.localPath !== "string" || !record.localPath.trim() ||
      typeof record.sourceAssetId !== "string" ||
      record.sourceAssetId !== `sha256:${record.sha256}`
    ) {
      throw new Error(`Incomplete development identity: ${record.sourceRecordId}`);
    }
    if (protocol.selection.blockedSplits.includes(record.split)) {
      throw new Error(`Blocked holdout split selected: ${record.sourceRecordId}`);
    }
  }
  return selected.slice().sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId));
}

function assertNoHoldoutIdentityOverlap(selected) {
  if (!fs.existsSync(HOLDOUT_REFERENCE_FILE)) {
    throw new Error("R1 v2 holdout reference missing; cannot prove pilot separation from final holdout");
  }
  const reference = readJson(HOLDOUT_REFERENCE_FILE);
  const blocked = new Set((reference.records || []).map(identityKey));
  for (const record of selected) {
    if (blocked.has(identityKey(record))) {
      throw new Error(`Development record overlaps frozen final holdout identity: ${record.sourceRecordId}`);
    }
  }
}

function context(workspaceRoot) {
  const workspace = path.resolve(workspaceRoot);
  const manifestFile = path.join(workspace, "manifest", "owned-beats-manifest.json");
  if (!fs.existsSync(manifestFile)) throw new Error(`Owned-beats manifest missing: ${manifestFile}`);
  const protocol = validateProtocol(readJson(PROTOCOL_FILE));
  const manifest = validateManifest(readJson(manifestFile));
  const records = selectedDevelopmentRecords(manifest, protocol);
  assertNoHoldoutIdentityOverlap(records);
  return {
    workspace,
    protocol,
    protocolDigestSha256: sha256Bytes(PROTOCOL_FILE),
    records
  };
}

function preflight(workspaceRoot) {
  const c = context(workspaceRoot);
  return {
    mode: "SOURCE_SEPARATION_PILOT_PREFLIGHT_PASS",
    sourceCollectionId: c.protocol.sourceCollectionId,
    split: c.protocol.selection.split,
    records: c.records.length,
    compositionFamilies: new Set(c.records.map(r => r.compositionFamilyId)).size,
    separatorCandidateId: c.protocol.separatorCandidate.id,
    expectedStems: c.protocol.separatorCandidate.expectedStems,
    protocolDigestSha256: c.protocolDigestSha256,
    holdoutAccessAllowed: false,
    sourceAudioAccessPerformedByThisCommand: false,
    trainingAuthorized: false,
    batch131Authorized: false,
    nextAction: "PREPARE_SOURCE_SEPARATION_PILOT_RUN"
  };
}

async function prepare(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const c = context(workspaceRoot);
  const runsRoot = path.join(c.workspace, "runs", "source-separation-pilot");
  const finalDir = path.join(runsRoot, runId);
  if (fs.existsSync(finalDir)) throw new Error(`Append-only source-separation run already exists: ${finalDir}`);

  const sources = [];
  for (let i = 0; i < c.records.length; i++) {
    const record = c.records[i];
    process.stderr.write(`[${i + 1}/${c.records.length}] verify source ${record.sourceRecordId}\n`);
    const source = path.resolve(c.workspace, record.localPath);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      throw new Error(`Source copy missing: ${record.sourceRecordId}`);
    }
    const actual = await sha256File(source);
    if (actual !== record.sha256) throw new Error(`Source SHA256 mismatch: ${record.sourceRecordId}`);
    sources.push({
      ...identity(record),
      format: record.format,
      bytes: record.bytes,
      localPath: record.localPath
    });
  }

  const payload = {
    schema: RUN_SCHEMA,
    version: 1,
    status: "PREPARED_NO_INFERENCE",
    runId,
    preparedAt: new Date().toISOString(),
    sourceCollectionId: c.protocol.sourceCollectionId,
    split: c.protocol.selection.split,
    protocolDigestSha256: c.protocolDigestSha256,
    separatorCandidate: c.protocol.separatorCandidate,
    expectedStems: c.protocol.separatorCandidate.expectedStems,
    sources,
    safety: {
      finalHoldoutExcluded: true,
      trainingAuthorized: false,
      taskDataReadyMayBeDeclared: false,
      batch131Authorized: false
    },
    nextAction: "IMPLEMENT_AND_VERIFY_BATCH_SEPARATOR_ADAPTER"
  };

  fs.mkdirSync(runsRoot, { recursive: true });
  const temp = path.join(runsRoot, `.${runId}.${crypto.randomUUID()}.preparing`);
  fs.mkdirSync(temp, { recursive: false });
  try {
    fs.writeFileSync(path.join(temp, "run-manifest.json"), JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
    fs.renameSync(temp, finalDir);
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }

  return {
    mode: "SOURCE_SEPARATION_PILOT_PREPARED",
    runId,
    runDirectory: finalDir,
    records: sources.length,
    sourceBytesVerified: true,
    separationExecutedByThisCommand: false,
    holdoutAudioAccessPerformedByThisCommand: false,
    trainingAuthorized: false,
    nextAction: "IMPLEMENT_AND_VERIFY_BATCH_SEPARATOR_ADAPTER"
  };
}

function check(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const c = context(workspaceRoot);
  const file = path.join(c.workspace, "runs", "source-separation-pilot", runId, "run-manifest.json");
  if (!fs.existsSync(file)) throw new Error(`Source-separation run not found: ${runId}`);
  const run = readJson(file);
  if (
    run.schema !== RUN_SCHEMA ||
    run.version !== 1 ||
    run.status !== "PREPARED_NO_INFERENCE" ||
    run.runId !== runId ||
    run.protocolDigestSha256 !== c.protocolDigestSha256 ||
    !Array.isArray(run.sources) ||
    run.sources.length !== c.records.length
  ) {
    throw new Error("Prepared run no longer matches the opening protocol");
  }
  const expected = c.records.map(identityKey).sort();
  const actual = run.sources.map(identityKey).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error("Prepared run source identities differ from development selection");
  }
  return {
    mode: "SOURCE_SEPARATION_PILOT_CHECK",
    runId,
    records: run.sources.length,
    status: run.status,
    separatorCandidateId: run.separatorCandidate.id,
    separationExecuted: false,
    holdoutExcluded: true,
    taskDataReady: false,
    trainingAuthorized: false,
    nextAction: run.nextAction
  };
}

async function main(args = process.argv.slice(2)) {
  const [command, workspace, runId] = args;
  if (!command || !workspace) {
    throw new Error("Usage: node source-separation-pilot.js <preflight|prepare|check> <workspace> [run-id]");
  }
  let result;
  if (command === "preflight") result = preflight(workspace);
  else if (command === "prepare") result = await prepare(workspace, runId || DEFAULT_RUN_ID);
  else if (command === "check") result = check(workspace, runId || DEFAULT_RUN_ID);
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
  preflight,
  prepare,
  check,
  selectedDevelopmentRecords,
  validateProtocol
};
