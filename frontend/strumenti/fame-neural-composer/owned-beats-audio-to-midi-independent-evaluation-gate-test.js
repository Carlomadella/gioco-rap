"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");
const gate=require("./owned-beats/audio-to-midi-independent-evaluation-gate.js");

const owned=path.join(__dirname,"owned-beats");
const source=fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-gate.js"),"utf8");
const contract=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-reservation-contract-v1.json"),"utf8"));
const reference=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-cohort-v1.json"),"utf8"));

assert.equal(contract.schema,"fame-owned-beats-audio-to-midi-evaluation-reservation-contract-v1");
assert.equal(contract.version,1);
assert.equal(contract.status,"FROZEN_BEFORE_EVALUATION_RESERVATION");
assert.equal(contract.cohortId,"audio-to-midi-independent-evaluation-v1");
assert.equal(contract.plannedSplit,"audio-to-midi-evaluation-v1");
assert.equal(contract.expectedFamilies,12);
assert.equal(contract.files.gateGitBlobSha,"fbdf8835bcd60d0d94004f6a8e2e196f2ba8df27");
assert.equal(contract.files.referenceGitBlobSha,"f7b93c8647c70b5f0f4caa66a741f98fc0da0e48");
assert.equal(contract.files.protocolGitBlobSha,"7ad299fddc9fc1430f15d6ae65327e9d53205c65");
assert.equal(contract.files.splitDecisionGitBlobSha,"da7fd393472bbb25d52f7a2eac885eb1ff5503cd");
assert.equal(contract.files.selectorGitBlobSha,"305fe132ba54d4b777d8d2a76e66262fd39ea554");

assert.equal(reference.selection.eligibleFamilyCount,103);
assert.equal(reference.cohortDigestSha256,"287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788");

for(const needle of [
  'review(ctx.workspace,SPLIT_DECISION_FILE,true)',
  'SPLIT_ASSIGNED_AWAITING_RESERVATION_RECEIPT',
  'RESERVED_BEFORE_AUDIO_ACCESS',
  'audioFileOpenedByThisCommand:false',
  'sourceSeparationExecutedByThisCommand:false',
  'transcriptionExecutedByThisCommand:false',
  'batch131Authorized:false',
  'trainingAuthorized:false'
]) assert(source.includes(needle),needle);

assert(!source.includes("ffmpeg"));
assert(!source.includes("ffprobe"));
assert(!source.includes("createReadStream("));
assert(!source.includes("decodeAudio"));

const self=gate.selfTest();
assert.equal(self.mode,"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_GATE_SELF_TEST_PASS");
assert.equal(self.expectedFamilies,12);
assert.equal(self.eligibleFamiliesAtSelection,103);

console.log("owned-beats-audio-to-midi-independent-evaluation-gate-test: PASS");
