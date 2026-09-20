"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = __dirname;
const owned = path.join(root, "owned-beats");
const modulePath = path.join(owned, "source-separation-development-inference.js");
const prepareWrapperPath = path.join(owned, "prepare-source-separation-development-inference.ps1");
const runWrapperPath = path.join(owned, "run-source-separation-development-inference.ps1");
const adapterPath = path.join(owned, "source-separation-standalone-adapter.py");
const contractPath = path.join(owned, "source-separation-execution-contract-v1.json");

const mod = require(modulePath);
const source = fs.readFileSync(modulePath, "utf8");
const prepareWrapper = fs.readFileSync(prepareWrapperPath, "utf8");
const runWrapper = fs.readFileSync(runWrapperPath, "utf8");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

mod.validateContract(contract);
assert.equal(mod.canonicalGitBlobSha(adapterPath), contract.adapter.gitBlobSha);
assert.equal(contract.execution.cacheRelativePath, "cache/source-separation-openvino");
assert.equal(contract.execution.audioIO.decodeSampleRate, 44100);
assert.equal(contract.execution.audioIO.channels, 2);
assert.equal(contract.execution.audioIO.internalSampleFormat, "float32");
assert.equal(contract.execution.audioIO.stemContainer, "wav");
assert.equal(contract.execution.audioIO.stemCodec, "pcm_f32le");
assert.equal(contract.nextAction, "PREPARE_APPEND_ONLY_DEVELOPMENT_INFERENCE_RECEIPT");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-source-sep-receipt-"));
try {
  const inside = mod.resolveWithin(temp, "sources/file.wav", "test");
  assert.equal(inside, path.join(temp, "sources", "file.wav"));
  assert.throws(() => mod.resolveWithin(temp, "../escape.wav", "test"), /escapes workspace/);
  assert.throws(() => mod.resolveWithin(temp, path.resolve(temp, "absolute.wav"), "test"), /Unsafe test relative path/);

  const previous = process.env.FAME_SOURCE_SEP_PREINFERENCE_GATE;
  delete process.env.FAME_SOURCE_SEP_PREINFERENCE_GATE;
  try {
    assert.throws(
      () => mod.prepare(temp, "source-separation-development-inference-v1-test"),
      /Pre-inference gate evidence missing/
    );
  } finally {
    if (previous === undefined) delete process.env.FAME_SOURCE_SEP_PREINFERENCE_GATE;
    else process.env.FAME_SOURCE_SEP_PREINFERENCE_GATE = previous;
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

assert(source.includes('status: "AUTHORIZED_NO_INFERENCE"'));
assert(source.includes('sourceFamiliesLocked: true'));
assert(source.includes('finalHoldoutExcluded: true'));
assert(source.includes('batch131Authorized: false'));
assert(source.includes('trainingAuthorized: false'));
assert(source.includes('taskDataReadyMayBeDeclared: false'));
assert(source.includes('"separate-file"'));
assert(source.includes('Partial output without append-only result receipt'));
assert(source.includes('INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA'));
assert(source.includes('stemSumResidualRmsRatio'));
assert(source.includes('sourcePilotManifestSha256'));
assert(source.includes('executionContractSha256'));
assert(source.includes('environmentLockSha256'));

assert(prepareWrapper.includes("verify-source-separation-pre-inference.ps1"));
assert(prepareWrapper.includes('FAME_SOURCE_SEP_PREINFERENCE_GATE = "PASS"'));
assert(prepareWrapper.includes(" prepare $Workspace $RunId $Model"));
assert(!prepareWrapper.includes(" execute $Workspace"));

assert(runWrapper.includes(" check $Workspace $RunId"));
assert(runWrapper.includes(" execute $Workspace $RunId"));
assert(!runWrapper.includes(" prepare $Workspace"));

console.log("owned-beats-source-separation-development-inference-test: PASS");
