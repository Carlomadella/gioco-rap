"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const specPath = path.join(root, "owned-beats", "source-separation-environment-v1.json");
const scriptPath = path.join(root, "owned-beats", "prepare-source-separation-environment.ps1");

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const script = fs.readFileSync(scriptPath, "utf8");

assert.equal(spec.schema, "fame-owned-beats-source-separation-environment-v1");
assert.equal(spec.python.requiredMajorMinor, "3.10");
assert.equal(spec.packages.torch.version, "2.4.1+cpu");
assert.equal(spec.packages.openvino.version, "2024.6.0");
assert.equal(spec.safety.reuseAudioAnalysisVenv, false);
assert.equal(spec.safety.sourceAudioAccessAllowedDuringSetup, false);
assert.equal(spec.safety.inferenceAllowedDuringSetup, false);
assert.equal(spec.safety.finalHoldoutAccessAllowedDuringSetup, false);
assert.equal(spec.freezePolicy.bootstrapPinsAreNotTheFinalLock, true);

assert(script.includes("venv-source-separation"));
assert(script.includes("pip freeze --all"));
assert(script.includes("source-separation-env-v1-001"));
assert(script.includes("REVIEW_AND_COMMIT_EXACT_PIP_FREEZE"));
assert(script.includes("sourceAudioOpenedByThisCommand = $false"));
assert(script.includes("sourceSeparationExecutedByThisCommand = $false"));
assert(script.includes("finalHoldoutAccessedByThisCommand = $false"));
assert(!script.includes("venv-audio-analysis"));
assert(!script.includes("source-separation-pilot-v1-001\\stems"));

console.log("owned-beats-source-separation-environment-test: PASS");
