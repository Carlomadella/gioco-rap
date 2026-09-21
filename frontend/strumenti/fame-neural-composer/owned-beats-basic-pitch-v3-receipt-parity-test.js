"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const contractPath=path.join(owned,"basic-pitch-execution-contract-v3.json");
const runnerPath=path.join(owned,"basic-pitch-development-inference-v3.js");
const executorPath=path.join(owned,"basic-pitch-development-execute-v3.py");
const implementationPath=path.join(owned,"basic-pitch-execution-implementation-v3.json");
const preparePath=path.join(owned,"prepare-basic-pitch-development-inference-v3.ps1");
const runPath=path.join(owned,"run-basic-pitch-development-inference-v3.ps1");

function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}

const contract=JSON.parse(fs.readFileSync(contractPath,"utf8"));
const implementation=JSON.parse(fs.readFileSync(implementationPath,"utf8"));
const runner=fs.readFileSync(runnerPath,"utf8");
const executor=fs.readFileSync(executorPath,"utf8");
const prepare=fs.readFileSync(preparePath,"utf8");
const run=fs.readFileSync(runPath,"utf8");

const expectedEvidence={
  preInferenceGatePassedImmediatelyBeforeReceipt:true,
  priorRunValidatedAndMarkedAborted:true,
  bassStemIntegrityBytesReadByPrepareCommand:true,
  audioDecodedByPrepareCommand:false,
  basicPitchInferenceExecutedByPrepareCommand:false,
  midiWrittenByPrepareCommand:false
};

assert.equal(contract.schema,"fame-owned-beats-basic-pitch-execution-contract-v3");
assert.equal(contract.version,3);
assert.equal(contract.output.runId,"basic-pitch-development-inference-v1-003");
assert.equal(contract.supersedes.runId,"basic-pitch-development-inference-v1-002");
assert.equal(contract.supersedes.algorithmChanged,false);
assert.equal(contract.supersedes.implementationOnlyFix,true);
assert.equal(contract.supersedes.defectCode,"RECEIPT_EVIDENCE_PRODUCER_CONSUMER_MISMATCH");
assert.deepEqual(contract.receiptEvidence,expectedEvidence);
assert.equal(contract.receiptRunner.gitBlobSha,gitBlobSha(runnerPath));

assert.equal(implementation.schema,"fame-owned-beats-basic-pitch-execution-implementation-v3");
assert.equal(implementation.version,3);
assert.equal(implementation.runId,"basic-pitch-development-inference-v1-003");
assert.equal(implementation.executionContractGitBlobSha,gitBlobSha(contractPath));
assert.equal(implementation.executor.gitBlobSha,gitBlobSha(executorPath));
assert.equal(implementation.receiptValidation.evidenceObjectComparedAsWhole,true);
assert(implementation.failureCapture.stages.includes("PRE_EXECUTION_VALIDATION"));

assert(runner.includes("const pre=require(\"./basic-pitch-preinference.js\")"));
assert(runner.includes('evidence:{...contract.receiptEvidence}'));
assert(runner.includes('JSON.stringify(r.evidence)!==JSON.stringify(contract.receiptEvidence)'));
assert(runner.includes('preInferenceGatePassedImmediatelyBeforeReceipt:true'));
assert(runner.includes('ABORTED_PRE_EXECUTION_RECEIPT_VALIDATION_MISMATCH'));

assert(executor.includes('receipt.get("evidence") != frozen["execution"]["receiptEvidence"]'));
assert(!executor.includes('receipt.get("evidence", {}).get("preInferenceGatePassedImmediatelyBeforeReceipt")'));
assert(executor.includes('"PRE_EXECUTION_VALIDATION"'));
assert(executor.includes('output_root.mkdir(parents=False, exist_ok=True)'));
assert(executor.includes('DEFAULT_RUN_ID = "basic-pitch-development-inference-v1-003"'));

assert(prepare.includes("verify-basic-pitch-pre-inference.ps1"));
assert(prepare.includes("basic-pitch-development-inference-v3.js"));
assert(!prepare.includes(" execute "));

assert(run.includes("basic-pitch-development-inference-v3.js"));
assert(run.includes("basic-pitch-development-execute-v3.py"));
assert(run.includes("BASIC_PITCH_FAILURE_REPORT"));
assert(run.indexOf(" check $Workspace $RunId") < run.indexOf(" execute $Workspace --run-id $RunId"));

console.log("owned-beats-basic-pitch-v3-receipt-parity-test: PASS");
