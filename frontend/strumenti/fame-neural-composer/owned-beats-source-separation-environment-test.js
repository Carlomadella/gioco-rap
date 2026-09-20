"use strict";

const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const specPath = path.join(root, "owned-beats", "source-separation-environment-v1.json");
const scriptPath = path.join(root, "owned-beats", "prepare-source-separation-environment.ps1");
const verifyScriptPath = path.join(root, "owned-beats", "verify-source-separation-environment-lock.ps1");
const lockPath = path.join(root, "owned-beats", "requirements-source-separation-lock.txt");

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const script = fs.readFileSync(scriptPath, "utf8");
const verifyScript = fs.readFileSync(verifyScriptPath, "utf8");
const lockBytes = fs.readFileSync(lockPath);
const lock = lockBytes.toString("utf8").replace(/^\uFEFF/, "");

assert.equal(spec.schema, "fame-owned-beats-source-separation-environment-v1");
assert.equal(spec.status, "EXACT_TRANSITIVE_LOCK_COMMITTED");
assert.equal(spec.python.requiredMajorMinor, "3.10");
assert.equal(spec.packages.torch.version, "2.4.1+cpu");
assert.equal(spec.packages.openvino.version, "2024.6.0");
assert.equal(spec.bootstrapTools.indexUrl, "https://pypi.org/simple");
assert.equal(spec.bootstrapTools.pip, "25.2");
assert.equal(spec.bootstrapTools.setuptools, "80.9.0");
assert.equal(spec.bootstrapTools.wheel, "0.45.1");
assert.equal(spec.safety.reuseAudioAnalysisVenv, false);
assert.equal(spec.safety.sourceAudioAccessAllowedDuringSetup, false);
assert.equal(spec.safety.inferenceAllowedDuringSetup, false);
assert.equal(spec.safety.finalHoldoutAccessAllowedDuringSetup, false);
assert.equal(spec.freezePolicy.bootstrapPinsAreNotTheFinalLock, true);

assert.equal(spec.lock.path, "requirements-source-separation-lock.txt");
assert.equal(spec.lock.sourceRunId, "source-separation-env-v1-001");
assert.equal(
  spec.lock.sourcePipFreezeAllSha256,
  "e7fd1df0076b79101923900aa280b3c53a46c5b0a166bad75cbf972b7794411a"
);
assert.equal(
  spec.lock.repositoryCanonicalSha256,
  "125c146cd2a007f11301e183fa976d3babe1d8e0959c7df56ee795b6828dc09a"
);
assert.equal(spec.lock.packageCount, 16);
assert.equal(spec.lock.reviewed, true);
assert.equal(spec.lock.committed, true);

const expectedPackages = [
  "filelock==4.0.1",
  "fsspec==2026.9.0",
  "Jinja2==3.1.6",
  "MarkupSafe==3.0.3",
  "mpmath==1.3.0",
  "networkx==3.4.2",
  "numpy==2.1.3",
  "openvino==2024.6.0",
  "openvino-telemetry==2025.2.0",
  "packaging==26.3",
  "pip==25.2",
  "setuptools==80.9.0",
  "sympy==1.14.0",
  "torch==2.4.1+cpu",
  "typing_extensions==4.16.0",
  "wheel==0.45.1"
];

const actualPackages = lock
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith("#"));

assert.deepEqual(actualPackages, expectedPackages);
assert.equal(
  crypto.createHash("sha256").update(lockBytes).digest("hex"),
  spec.lock.repositoryCanonicalSha256
);

assert(script.includes("venv-source-separation"));
assert(script.includes("pip freeze --all"));
assert(script.includes("source-separation-env-v1-001"));
assert(script.includes("REVIEW_AND_COMMIT_EXACT_PIP_FREEZE"));
assert(script.includes("--extra-index-url $torchIndex"));
assert(script.includes("--index-url $bootstrapIndex"));
assert(script.includes("pip==$pipBootstrapVersion"));
assert(script.includes("setuptools==$setuptoolsBootstrapVersion"));
assert(script.includes("wheel==$wheelBootstrapVersion"));
assert(script.includes("sourceAudioOpenedByThisCommand = $false"));
assert(script.includes("sourceSeparationExecutedByThisCommand = $false"));
assert(script.includes("finalHoldoutAccessedByThisCommand = $false"));
assert(!script.includes("venv-audio-analysis"));
assert(!script.includes("source-separation-pilot-v1-001\\stems"));

assert(verifyScript.includes("SOURCE_SEPARATION_ENVIRONMENT_LOCK_VERIFY_PASS"));
assert(verifyScript.includes("IMPLEMENT_CLEAN_STANDALONE_HTDEMUCS_ADAPTER"));
assert(verifyScript.includes("sourceAudioOpenedByThisCommand = $false"));
assert(verifyScript.includes("sourceSeparationExecutedByThisCommand = $false"));
assert(verifyScript.includes("finalHoldoutAccessedByThisCommand = $false"));
assert(!verifyScript.includes("ffmpeg "));
assert(!verifyScript.includes("openvino.Core"));
assert(!verifyScript.includes("torch."));

console.log("owned-beats-source-separation-environment-test: PASS");
