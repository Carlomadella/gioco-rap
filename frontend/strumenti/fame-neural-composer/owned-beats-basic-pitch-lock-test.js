"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const lockPath=path.join(owned,"requirements-basic-pitch-lock.txt");
const spec=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-environment-v1.json"),"utf8"));
const protocol=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-lowend-candidate-protocol-v1.json"),"utf8"));
const verifier=fs.readFileSync(path.join(owned,"verify-basic-pitch-environment-lock.ps1"),"utf8");

const lock=fs.readFileSync(lockPath);
const sha=crypto.createHash("sha256").update(lock).digest("hex");
const packages=lock.toString("utf8").split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith("#"));

assert.equal(sha,"3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad");
assert.equal(spec.status,"EXACT_TRANSITIVE_LOCK_COMMITTED");
assert.equal(spec.lock.repositoryCanonicalSha256,sha);
assert.equal(spec.lock.sourcePipFreezeAllSha256,"9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f");
assert.equal(spec.lock.packageCount,44);
assert.equal(spec.lock.reviewed,true);
assert.equal(spec.lock.committed,true);

assert.equal(protocol.status,"ENVIRONMENT_AND_MODEL_FROZEN_AWAITING_PREINFERENCE_VERIFY");
assert.equal(protocol.environment.repositoryLockSha256,sha);
assert.equal(protocol.environment.packageCount,44);
assert.equal(protocol.environment.lockCommitted,true);
assert.equal(protocol.environment.lockReviewed,true);
assert.equal(protocol.environment.packagedModel.sha256,"2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec");
assert.equal(protocol.safety.noBasicPitchInferenceUntilPreinferenceVerify,true);

assert.equal(packages.length,44);
for(const line of [
  "basic-pitch==0.4.0",
  "onnxruntime==1.23.2",
  "numpy==2.2.6",
  "librosa==0.11.0",
  "pip==25.2",
  "setuptools==80.9.0",
  "wheel==0.45.1"
]) assert(packages.includes(line),line);

for(const needle of [
  "BASIC_PITCH_ENVIRONMENT_LOCK_VERIFY_PASS",
  "repositoryCanonicalSha256",
  "packageSetMatchesFreeze = $true",
  "PREPARE_BASIC_PITCH_PREINFERENCE_GATE"
]) assert(verifier.includes(needle),needle);

assert(!verifier.includes("predict("));
assert(!verifier.includes("predict_and_save"));
assert(!verifier.includes("bass.wav"));

console.log("owned-beats-basic-pitch-lock-test: PASS");
