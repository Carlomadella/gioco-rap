"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const spec=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-environment-v1.json"),"utf8"));
const protocol=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-lowend-candidate-protocol-v1.json"),"utf8"));
const verifier=fs.readFileSync(path.join(owned,"verify-basic-pitch-environment-bootstrap.ps1"),"utf8");

assert.equal(spec.status,"BOOTSTRAP_COMPLETE_AWAITING_EXACT_TRANSITIVE_LOCK_COMMIT");
assert.equal(spec.python.observedVersion,"3.10.11");
assert.equal(spec.runtime.observedOnnxRuntimeVersion,"1.23.2");
assert.equal(spec.runtime.packagedModel.filename,"nmp.onnx");
assert.equal(spec.runtime.packagedModel.bytes,230444);
assert.equal(spec.runtime.packagedModel.sha256,"2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec");
assert.equal(spec.lock.sourcePipFreezeAllSha256,"9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f");
assert.equal(spec.lock.committed,false);

assert.equal(protocol.status,"ENVIRONMENT_BOOTSTRAP_COMPLETE_AWAITING_LOCK_COMMIT");
assert.equal(protocol.environment.observedBackend,"ONNX");
assert.equal(protocol.environment.observedOnnxRuntimeVersion,"1.23.2");
assert.equal(protocol.environment.packagedModel.sha256,"2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec");
assert.equal(protocol.environment.packagedModel.committed,true);
assert.equal(protocol.environment.sourcePipFreezeAllSha256,"9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f");
assert.equal(protocol.safety.noBasicPitchInferenceUntilLockAndModelFreeze,true);

for(const needle of [
  "BASIC_PITCH_ENVIRONMENT_BOOTSTRAP_VERIFY_PASS",
  "Get-FileHash -LiteralPath $freezePath -Algorithm SHA256",
  '"basic-pitch==0.4.0"',
  '"onnxruntime==1.23.2"',
  '"pip==25.2"',
  '"setuptools==80.9.0"',
  '"wheel==0.45.1"',
  "transcriptionExecutedByThisCommand = $false",
  "lockCommitted = $false",
  "modelShaCommitted = $true"
]){
  assert(verifier.includes(needle),needle);
}
assert(!verifier.includes("predict("));
assert(!verifier.includes("bass.wav"));
assert(!verifier.includes("source-separation-development-inference"));

console.log("owned-beats-basic-pitch-bootstrap-verify-test: PASS");
