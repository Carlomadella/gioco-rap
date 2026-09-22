"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const owned = path.join(__dirname, "owned-beats");
const protocolFile = path.join(owned, "audio-to-midi-diagnostic-protocol-v1.json");
const auditFile = path.join(owned, "audio-to-midi-p1-audit.js");
const tool = require(auditFile);
const protocol = JSON.parse(fs.readFileSync(protocolFile, "utf8"));
const src = fs.readFileSync(auditFile, "utf8");

assert.equal(protocol.schema, "fame-owned-beats-audio-to-midi-diagnostic-protocol-v1");
assert.equal(protocol.version, 1);
assert.equal(protocol.status, "FROZEN_P1_INVENTORY_AND_DIAGNOSTIC_RULES");
assert.equal(protocol.inventory.expectedRecords, 131);
assert.equal(protocol.inventory.expectedCompositionFamilies, 131);
assert.equal(protocol.inventory.expectedFreshUnassignedFamilies, 91);
assert.equal(protocol.knownExposures.development.expectedFamilies, 8);
assert.equal(protocol.knownExposures.consumedAudioToMidiEvaluation.expectedFamilies, 12);
assert.equal(protocol.easyDiagnostic.historicalExternalSet.tracks.length, 3);
assert.equal(protocol.easyDiagnostic.historicalExternalSet.rightsStatus, "USER_CONFIRMED_USABLE");
assert.equal(protocol.easyDiagnostic.controlledFixturePlan.fixtures.length, 12);
assert.equal(protocol.easyDiagnostic.realBeatSet.status, "IDENTITIES_PENDING_BEFORE_P3");
assert.equal(protocol.metrics.drums.primaryEventMatching.onsetToleranceSeconds, 0.03);
assert.equal(protocol.metrics.drums.secondaryTimingDiagnostic.onsetToleranceSeconds, 0.05);
assert.equal(protocol.metrics.lowEnd.noteMatching.onsetToleranceSeconds, 0.05);
assert.equal(protocol.metrics.lowEnd.noteMatching.pitchToleranceCents, 50);
assert.equal(protocol.metrics.lowEnd.noteMatching.offsetTolerance.ratioOfReferenceDuration, 0.2);
assert.equal(protocol.metrics.lowEnd.noteMatching.offsetTolerance.minimumSeconds, 0.05);
assert.equal(protocol.advancement.p2.mayProceedWithRealEasyIdentityPending, true);
assert.equal(protocol.advancement.p3.maySelectAlgorithmForIndependentPromotion, false);
assert.equal(protocol.safety.p1MayOpenAudio, false);
assert.equal(protocol.safety.p1MayHashSourceAudio, false);
assert.equal(protocol.safety.p1MayModifyManifest, false);
assert.equal(protocol.safety.trainingAuthorized, false);
assert.equal(protocol.safety.batch131Authorized, false);
assert.equal(protocol.safety.taskDataReadyMayBeDeclared, false);

for (const needle of [
  "pilotIsEmpty(record)",
  "qaIsEmpty(record)",
  "isFreshUnassigned(record)",
  "sourceAudioHashedByThisCommand: false",
  "manifestMutatedByThisCommand: false"
]) assert(src.includes(needle), needle);

assert(!src.includes("ffmpeg"));
assert(!src.includes("ffprobe"));
assert(!src.includes("createReadStream"));

const result = tool.selfTest();
assert.equal(result.mode, "FAME_NEURAL_P1_AUDIT_SELF_TEST_PASS");
assert.equal(result.syntheticRecords, 131);
assert.equal(result.syntheticFreshUnassignedFamilies, 91);
assert.equal(result.nullPilotAndEmptyQaHandledAsUnexposed, true);

console.log("owned-beats-audio-to-midi-p1-audit-test: PASS");
