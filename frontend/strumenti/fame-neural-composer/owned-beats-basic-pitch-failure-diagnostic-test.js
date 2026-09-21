"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const diag=fs.readFileSync(path.join(owned,"diagnose-basic-pitch-inference-failure.ps1"),"utf8");

for(const needle of [
  "verify-basic-pitch-environment-lock.ps1",
  "basic-pitch-development-inference.js",
  "basic-pitch-environment-doctor.py",
  "basic-pitch-development-execute.py",
  "--load-model-smoke",
  "BASIC_PITCH_INFERENCE_FAILURE_DIAGNOSTIC_COMPLETE",
  "audioDecodedByThisDiagnostic = $false",
  "basicPitchInferenceExecutedByThisDiagnostic = $false",
  "midiWrittenByThisDiagnostic = $false"
]) assert(diag.includes(needle),needle);

assert(!diag.includes(" execute $Workspace"));
assert(!diag.includes("predict("));
assert(!diag.includes("predict_and_save"));
assert(!diag.includes("Set-Content -LiteralPath $midi"));\nassert(!diag.includes("Move-Item -LiteralPath"));
console.log("owned-beats-basic-pitch-failure-diagnostic-test: PASS");
