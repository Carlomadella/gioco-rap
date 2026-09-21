"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");

const qa=fs.readFileSync(path.join(__dirname,"owned-beats","basic-pitch-development-qa.py"),"utf8");
const wrapper=fs.readFileSync(path.join(__dirname,"owned-beats","run-basic-pitch-development-qa.ps1"),"utf8");

for(const needle of [
  'RUN_ID = "basic-pitch-development-inference-v1-003"',
  '"BASIC_PITCH_DEVELOPMENT_TECHNICAL_QA_PASS"',
  '"ALL_8_FAMILIES_PASS"',
  '"midiFilesVerified": midi_verified',
  '"diagnosticsAreNotMusicalQualityScores": True',
  '"basicPitchInferenceExecutedByThisCommand": False',
  '"finalHoldoutAccessedByThisCommand": False',
  '"PREPARE_BLIND_LOW_END_COMPARISON"'
]) assert(qa.includes(needle),needle);

assert(qa.includes("pretty_midi.PrettyMIDI"));
assert(qa.includes("sha256_file(result_file)"));
assert(qa.includes("sha256_file(stem_file)"));
assert(qa.includes('result.get("noteEvents")'));
assert(!qa.includes("predict("));
assert(!qa.includes("Model("));

assert(wrapper.includes("basic-pitch-development-qa.py"));
assert(wrapper.includes(" technical $Workspace"));
assert(!wrapper.includes("execute"));
console.log("owned-beats-basic-pitch-development-qa-test: PASS");
