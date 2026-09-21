"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");
const tool=require("./owned-beats/verify-audio-to-midi-selected-integration.js");

const src=fs.readFileSync(path.join(__dirname,"owned-beats","verify-audio-to-midi-selected-integration.js"),"utf8");

for(const needle of [
  'AUDIO_TO_MIDI_SELECTED_INTEGRATION_VERIFY_PASS',
  'SELECTED_DEVELOPMENT_INTEGRATION_VERIFIED',
  'byteIdenticalMidiFilesVerified:16',
  'knownIssueSourceRecordId:EXPECTED_KNOWN_ISSUE_ID',
  'EXPECTED_KNOWN_ISSUE_ID="FAME000040"',
  'UPSTREAM_SOURCE_SEPARATION_CONTAMINATION',
  'transcriptionRootCause:false',
  'sameBytes(drumsSource,drumsOut',
  'sameBytes(lowSource,lowOut',
  'finalHoldoutAccessedByThisCommand:false',
  'trainingAuthorized:false'
]) assert(src.includes(needle),needle);

assert(!src.includes("child_process"));
assert(!src.includes("ffmpeg"));
assert(!src.includes("predict("));
assert.equal(tool.selfTest().mode,"AUDIO_TO_MIDI_SELECTED_INTEGRATION_VERIFY_SELF_TEST_PASS");

console.log("owned-beats-audio-to-midi-selected-integration-verify-test: PASS");
