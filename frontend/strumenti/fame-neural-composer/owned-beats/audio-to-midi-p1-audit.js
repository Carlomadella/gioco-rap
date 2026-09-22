"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const HERE = __dirname;
const PROTOCOL_FILE = path.join(HERE, "audio-to-midi-diagnostic-protocol-v1.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function splitName(value) {
  return typeof value === "string" && value.trim() ? value : "<unset>";
}

function rolePending(record, role) {
  const state = record?.roles?.[role];
  return !!state &&
    state.processing === "PENDING" &&
    state.review === "NOT_PROCESSED" &&
    state.artifactId === null;
}

function qaIsEmpty(record) {
  return !record.qa || (typeof record.qa === "object" && !Array.isArray(record.qa) && Object.keys(record.qa).length === 0);
}

function pilotIsEmpty(record) {
  return !Array.isArray(record.pilotCohorts) || record.pilotCohorts.filter(Boolean).length === 0;
}

function isFreshUnassigned(record) {
  return record.presentInScan !== false &&
    splitName(record.split) === "<unset>" &&
    pilotIsEmpty(record) &&
    qaIsEmpty(record) &&
    ["drums", "lowend", "tonal", "full"].every(role => rolePending(record, role));
}

function validateIdentity(record) {
  assert(/^FAME\d{6,}$/.test(record.sourceRecordId || ""), `Invalid sourceRecordId: ${record.sourceRecordId}`);
  assert(typeof record.compositionFamilyId === "string" && record.compositionFamilyId.trim(), `Missing compositionFamilyId: ${record.sourceRecordId}`);
  assert(/^[a-f0-9]{64}$/.test(record.sha256 || ""), `Invalid sha256: ${record.sourceRecordId}`);
  assert(record.sourceAssetId === `sha256:${record.sha256}`, `sourceAssetId mismatch: ${record.sourceRecordId}`);
}

function validateProtocol(protocol) {
  assert(protocol.schema === "fame-owned-beats-audio-to-midi-diagnostic-protocol-v1", "P1 protocol schema mismatch");
  assert(protocol.version === 1, "P1 protocol version mismatch");
  assert(protocol.status === "FROZEN_P1_INVENTORY_AND_DIAGNOSTIC_RULES", "P1 protocol not frozen");
  assert(protocol.inventory.expectedRecords === 131, "P1 expectedRecords mismatch");
  assert(protocol.inventory.expectedCompositionFamilies === 131, "P1 expectedCompositionFamilies mismatch");
  assert(protocol.inventory.expectedFreshUnassignedFamilies === 91, "P1 fresh-family expectation mismatch");
  assert(protocol.metrics.drums.primaryEventMatching.onsetToleranceSeconds === 0.03, "Drum primary tolerance must be 30 ms");
  assert(protocol.metrics.drums.secondaryTimingDiagnostic.onsetToleranceSeconds === 0.05, "Drum secondary tolerance must be 50 ms");
  assert(protocol.metrics.lowEnd.noteMatching.onsetToleranceSeconds === 0.05, "Low-end onset tolerance must be 50 ms");
  assert(protocol.metrics.lowEnd.noteMatching.pitchToleranceCents === 50, "Low-end pitch tolerance must be 50 cents");
  assert(protocol.metrics.lowEnd.noteMatching.offsetTolerance.ratioOfReferenceDuration === 0.2, "Low-end offset ratio must be 20%");
  assert(protocol.metrics.lowEnd.noteMatching.offsetTolerance.minimumSeconds === 0.05, "Low-end minimum offset tolerance must be 50 ms");
  assert(protocol.easyDiagnostic.historicalExternalSet.rightsStatus === "USER_CONFIRMED_USABLE", "Historical easy rights status mismatch");
  assert(protocol.easyDiagnostic.realBeatSet.freezeBeforeFirstP3Run === true, "Real easy set must freeze before P3");
  assert(protocol.safety.p1MayOpenAudio === false, "P1 must not open audio");
  assert(protocol.safety.p1MayHashSourceAudio === false, "P1 must not hash source audio");
  assert(protocol.safety.p1MayModifyManifest === false, "P1 must not modify manifest");
  assert(protocol.safety.trainingAuthorized === false, "Training must stay closed");
  return protocol;
}

function audit(workspaceRoot, protocol = validateProtocol(readJson(PROTOCOL_FILE))) {
  const workspace = path.resolve(workspaceRoot);
  const manifestFile = path.join(workspace, "manifest", "owned-beats-manifest.json");
  assert(fs.existsSync(manifestFile) && fs.statSync(manifestFile).isFile(), `Owned-beats manifest missing: ${manifestFile}`);

  const manifest = readJson(manifestFile);
  assert(manifest.schema === "fame-owned-beats-workspace-v1" && manifest.version === 1, "Unsupported workspace manifest");
  assert(Array.isArray(manifest.records), "Manifest records missing");
  assert(manifest.records.length === protocol.inventory.expectedRecords, `Manifest record count mismatch: ${manifest.records.length}`);

  const ids = new Set();
  const families = new Set();
  const hashes = new Set();
  for (const record of manifest.records) {
    validateIdentity(record);
    assert(!ids.has(record.sourceRecordId), `Duplicate sourceRecordId: ${record.sourceRecordId}`);
    assert(!families.has(record.compositionFamilyId), `Duplicate compositionFamilyId: ${record.compositionFamilyId}`);
    assert(!hashes.has(record.sha256), `Duplicate sha256: ${record.sha256}`);
    ids.add(record.sourceRecordId);
    families.add(record.compositionFamilyId);
    hashes.add(record.sha256);
  }
  assert(families.size === protocol.inventory.expectedCompositionFamilies, `Composition family count mismatch: ${families.size}`);

  const splitCounts = {};
  for (const record of manifest.records) {
    const split = splitName(record.split);
    splitCounts[split] = (splitCounts[split] || 0) + 1;
  }
  for (const [split, expected] of Object.entries(protocol.inventory.expectedSplitCounts)) {
    assert((splitCounts[split] || 0) === expected, `Split count mismatch ${split}: ${(splitCounts[split] || 0)} != ${expected}`);
  }

  const development = protocol.knownExposures.development.sourceRecordIds;
  for (const rid of development) {
    const record = manifest.records.find(r => r.sourceRecordId === rid);
    assert(record, `Development record missing: ${rid}`);
    assert(record.split === protocol.knownExposures.development.split, `Development split mismatch: ${rid}`);
  }

  const consumed = protocol.knownExposures.consumedAudioToMidiEvaluation.sourceRecordIds;
  for (const rid of consumed) {
    const record = manifest.records.find(r => r.sourceRecordId === rid);
    assert(record, `Consumed evaluation record missing: ${rid}`);
    assert(record.split === protocol.knownExposures.consumedAudioToMidiEvaluation.split, `Consumed evaluation split mismatch: ${rid}`);
  }

  const fresh = manifest.records.filter(isFreshUnassigned);
  assert(fresh.length === protocol.inventory.expectedFreshUnassignedFamilies,
    `Fresh unassigned family count mismatch: ${fresh.length} != ${protocol.inventory.expectedFreshUnassignedFamilies}`);

  const easyHashes = new Set(protocol.easyDiagnostic.historicalExternalSet.tracks.map(x => x.sha256));
  const easyManifestMatches = manifest.records.filter(r => easyHashes.has(r.sha256)).map(r => r.sourceRecordId);

  return {
    mode: "FAME_NEURAL_P1_PROTOCOL_AUDIT_PASS",
    protocolStatus: protocol.status,
    manifestSha256: sha256File(manifestFile),
    records: manifest.records.length,
    compositionFamilies: families.size,
    splitCounts,
    freshUnassignedFamilies: fresh.length,
    developmentFamiliesVerified: development.length,
    consumedAudioToMidiEvaluationFamiliesVerified: consumed.length,
    historicalEasyTracksExpected: protocol.easyDiagnostic.historicalExternalSet.tracks.length,
    historicalEasyManifestMatches: easyManifestMatches,
    historicalEasyAvailability: protocol.easyDiagnostic.historicalExternalSet.status,
    realEasySetStatus: protocol.easyDiagnostic.realBeatSet.status,
    p2MayProceed: protocol.advancement.p2.mayProceedWithRealEasyIdentityPending,
    p3RealEasyFreezeRequired: protocol.easyDiagnostic.realBeatSet.freezeBeforeFirstP3Run,
    audioOpenedByThisCommand: false,
    sourceAudioHashedByThisCommand: false,
    manifestMutatedByThisCommand: false,
    trainingAuthorized: false,
    batch131Authorized: false,
    taskDataReadyMayBeDeclared: false,
    nextAction: protocol.nextAction
  };
}

function fixtureRecord(index, split = null) {
  const sha = crypto.createHash("sha256").update(`fixture-${index}`).digest("hex");
  return {
    sourceRecordId: `FAME${String(index).padStart(6, "0")}`,
    compositionFamilyId: `FAM-FAME${String(index).padStart(6, "0")}`,
    sourceAssetId: `sha256:${sha}`,
    sha256: sha,
    split,
    presentInScan: true,
    pilotCohorts: null,
    qa: {},
    roles: Object.fromEntries(["drums", "lowend", "tonal", "full"].map(role => [role, {
      processing: "PENDING", review: "NOT_PROCESSED", artifactId: null
    }]))
  };
}

function selfTest() {
  const protocol = validateProtocol(readJson(PROTOCOL_FILE));
  const records = Array.from({ length: 131 }, (_, i) => fixtureRecord(i + 1));
  const dev = new Set(protocol.knownExposures.development.sourceRecordIds);
  const consumed = new Set(protocol.knownExposures.consumedAudioToMidiEvaluation.sourceRecordIds);

  for (const r of records) {
    if (dev.has(r.sourceRecordId)) r.split = "development";
    if (consumed.has(r.sourceRecordId)) r.split = "audio-to-midi-evaluation-v1";
  }

  const stillUnset = records.filter(r => !r.split);
  stillUnset.slice(0, 10).forEach(r => { r.split = "evaluation-holdout"; });
  stillUnset.slice(10, 20).forEach(r => { r.split = "evaluation-holdout-r1-v2"; });

  const fresh = records.filter(isFreshUnassigned);
  assert(fresh.length === 91, `Self-test fresh count failed: ${fresh.length}`);
  assert(fresh.every(r => pilotIsEmpty(r) && qaIsEmpty(r)), "Null/empty exposure handling failed");

  const altered = JSON.parse(JSON.stringify(fresh[0]));
  altered.pilotCohorts = ["pilot-x"];
  assert(isFreshUnassigned(altered) === false, "Pilot exposure must remove freshness");
  altered.pilotCohorts = null;
  altered.qa = { technical: "PASS" };
  assert(isFreshUnassigned(altered) === false, "QA exposure must remove freshness");
  altered.qa = {};
  altered.roles.drums.processing = "DONE";
  assert(isFreshUnassigned(altered) === false, "Role processing must remove freshness");

  return {
    mode: "FAME_NEURAL_P1_AUDIT_SELF_TEST_PASS",
    syntheticRecords: records.length,
    syntheticFreshUnassignedFamilies: fresh.length,
    nullPilotAndEmptyQaHandledAsUnexposed: true
  };
}

function main(args = process.argv.slice(2)) {
  const [command, workspace] = args;
  let result;
  if (command === "self-test") {
    result = selfTest();
  } else if (command === "audit") {
    if (!workspace) throw new Error("Usage: node audio-to-midi-p1-audit.js <self-test|audit> [workspace]");
    result = audit(workspace);
  } else {
    throw new Error("Usage: node audio-to-midi-p1-audit.js <self-test|audit> [workspace]");
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error("FAME NEURAL P1 AUDIT FAILED: " + error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  readJson,
  validateProtocol,
  splitName,
  rolePending,
  qaIsEmpty,
  pilotIsEmpty,
  isFreshUnassigned,
  audit,
  selfTest
};
