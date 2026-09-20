"use strict";

const assert = require("node:assert");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const owned = path.join(root, "owned-beats");
const adapterPath = path.join(owned, "source-separation-standalone-adapter.py");
const protocolPath = path.join(owned, "source-separation-pilot-protocol-v1.json");
const contractPath = path.join(owned, "source-separation-execution-contract-v1.json");
const reviewPath = path.join(owned, "source-separation-pilot-review-v1.json");
const preInferencePath = path.join(owned, "verify-source-separation-pre-inference.ps1");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function gitBlobSha(file) {
  const bytes = fs.readFileSync(file);
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return crypto.createHash("sha1").update(header).update(bytes).digest("hex");
}

const adapter = fs.readFileSync(adapterPath, "utf8");
const protocol = JSON.parse(fs.readFileSync(protocolPath, "utf8"));
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
const preInference = fs.readFileSync(preInferencePath, "utf8");

assert.equal(protocol.schema, "fame-owned-beats-source-separation-pilot-protocol-v1");
assert.equal(protocol.separatorCandidate.executionAdapterStatus, "NEXT_BLOCK");
assert.equal(protocol.selection.split, "development");
assert.equal(protocol.selection.expectedFamilies, 8);
assert.equal(protocol.safety.holdoutAccessAllowed, false);
assert.equal(protocol.safety.batch131Authorized, false);

assert.equal(contract.schema, "fame-owned-beats-source-separation-execution-contract-v1");
assert.equal(contract.status, "FROZEN_BEFORE_FIRST_PILOT_OUTPUT");
assert.equal(contract.sourceRunId, "source-separation-pilot-v1-001");
assert.equal(contract.openingProtocol.gitBlobSha, "a8667e89360605336d51bb121a4780cff7d6bc05");
assert.equal(contract.openingProtocol.runDigestMustBeVerifiedFromPreparedManifest, true);
assert.equal(contract.execution.sampleRate, 44100);
assert.equal(contract.execution.device, "CPU");
assert.equal(contract.execution.shifts, 1);
assert.equal(contract.execution.shiftSeed, 0);
assert.equal(contract.execution.overlap, 0.25);
assert.equal(contract.execution.segmentSamples, 343980);
assert.deepEqual(contract.execution.expectedStems, ["drums", "bass", "other", "vocals"]);
assert.equal(contract.preInferenceGate.sourceAudioAccessAllowed, false);
assert.equal(contract.preInferenceGate.inferenceAllowed, false);
assert.equal(contract.safety.finalHoldoutAccessAllowed, false);
assert.equal(contract.adapter.gitBlobSha, gitBlobSha(adapterPath));
assert.equal(contract.adapter.implementationCommit, "15269866226f6685c2cf9adbf75f07d8a43ef51c");
assert.equal(contract.adapter.modelTypeValidation.expectedSemanticType, "float32");
assert.deepEqual(
  contract.adapter.modelTypeValidation.acceptedOpenVinoStringForms,
  ["f32", "<Type: 'float32'>"]
);
assert.equal(contract.adapter.modelTypeValidation.rejectNonFloat32, true);

assert.equal(review.schema, "fame-owned-beats-source-separation-pilot-review-v1");
assert.equal(review.status, "FROZEN_BEFORE_FIRST_PILOT_OUTPUT");
assert.equal(review.scope.expectedFamilies, 8);
assert.equal(review.scope.holdoutAllowed, false);
assert.equal(review.pilotGate.drums.medianDownstreamUsefulnessAtLeast, 2);
assert.equal(review.pilotGate.bass.medianDownstreamUsefulnessAtLeast, 2);
assert.equal(
  sha256(reviewPath),
  "82a94dbe434c218cd9467f929ac19b0c7d5afada9d379a6fac12e7e2aa8f0096"
);

assert(adapter.includes("SOURCE_SEPARATION_STANDALONE_ADAPTER_SELF_TEST_PASS"));
assert(adapter.includes("SOURCE_SEPARATION_STANDALONE_ADAPTER_MODEL_CHECK_PASS"));
assert(adapter.includes("SOURCE_SEPARATION_STANDALONE_FILE_PASS"));
assert(adapter.includes("SAMPLE_RATE = 44_100"));
assert(adapter.includes("SEGMENT_SAMPLES = (SAMPLE_RATE * 39) // 5"));
assert(adapter.includes("DEFAULT_OVERLAP = 0.25"));
assert(adapter.includes("DEFAULT_SHIFTS = 1"));
assert(adapter.includes("DEFAULT_SHIFT_SEED = 0"));
assert(adapter.includes('("input.25", (1, 4, 2048, 336))'));
assert(adapter.includes('("input.1", (1, 2, 343980))'));
assert(adapter.includes('("4172", (1, 16, 2048, 336))'));
assert(adapter.includes('("4262", (1, 8, 343980))'));
assert(adapter.includes('normalized == "f32" or "float32" in normalized'));
assert(adapter.includes('_is_float32_element_type("<Type: \'float32\'>")'));
assert(adapter.includes('_is_float32_element_type("float16")'));
assert(adapter.includes('_is_float32_element_type("bf16")'));


assert(preInference.includes("verify-source-separation-environment-lock.ps1"));
assert(preInference.includes("source-separation-pilot.js"));
assert(preInference.includes(" self-test"));
assert(preInference.includes(" inspect-model "));
assert(preInference.includes("SOURCE_SEPARATION_PRE_INFERENCE_GATE_PASS"));
assert(preInference.includes("sourceAudioOpenedByThisCommand = $false"));
assert(preInference.includes("sourceSeparationExecutedByThisCommand = $false"));
assert(preInference.includes("packagesInstalledByThisCommand = $false"));
assert(!preInference.includes("separate-file"));
assert(!preInference.includes("pip install"));

const py = process.platform === "win32" ? "python" : "python3";
const syntax = cp.spawnSync(
  py,
  ["-m", "py_compile", adapterPath],
  { encoding: "utf8" }
);
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

console.log("owned-beats-source-separation-standalone-adapter-test: PASS");
