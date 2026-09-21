"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const v1ContractPath=path.join(owned,"basic-pitch-execution-contract-v1.json");
const v2ContractPath=path.join(owned,"basic-pitch-execution-contract-v2.json");
const v1ExecutorPath=path.join(owned,"basic-pitch-development-execute.py");
const v2ExecutorPath=path.join(owned,"basic-pitch-development-execute-v2.py");
const v2ImplPath=path.join(owned,"basic-pitch-execution-implementation-v2.json");
const v2ReceiptRunnerPath=path.join(owned,"basic-pitch-development-inference-v2.js");
const preparePath=path.join(owned,"prepare-basic-pitch-development-inference-v2.ps1");
const runPath=path.join(owned,"run-basic-pitch-development-inference-v2.ps1");

function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}

const v1=JSON.parse(fs.readFileSync(v1ContractPath,"utf8"));
const v2=JSON.parse(fs.readFileSync(v2ContractPath,"utf8"));
const impl=JSON.parse(fs.readFileSync(v2ImplPath,"utf8"));
const execV1=fs.readFileSync(v1ExecutorPath,"utf8");
const execV2=fs.readFileSync(v2ExecutorPath,"utf8");
const receiptV2=fs.readFileSync(v2ReceiptRunnerPath,"utf8");
const prepare=fs.readFileSync(preparePath,"utf8");
const run=fs.readFileSync(runPath,"utf8");

assert.equal(v1.output.runId,"basic-pitch-development-inference-v1-001");
assert.equal(v2.output.runId,"basic-pitch-development-inference-v1-002");
assert.deepEqual(v2.inference,v1.inference);
assert.equal(v2.supersedes.runId,v1.output.runId);
assert.equal(v2.supersedes.algorithmChanged,false);
assert.equal(v2.supersedes.implementationOnlyFix,true);
assert.equal(v2.supersedes.defectCode,"OUTPUT_PARENT_NOT_CREATED_BEFORE_ATOMIC_RENAME");
assert.equal(v2.receiptRunner.gitBlobSha,gitBlobSha(v2ReceiptRunnerPath));

assert.equal(impl.status,"FROZEN_BEFORE_FIRST_V2_BASIC_PITCH_INFERENCE");
assert.equal(impl.runId,"basic-pitch-development-inference-v1-002");
assert.equal(impl.executionContractGitBlobSha,gitBlobSha(v2ContractPath));
assert.equal(impl.executor.gitBlobSha,gitBlobSha(v2ExecutorPath));
assert.equal(impl.executor.gitBlobSha,"677b7d658261efbe713375c0190f1107b82cbd00");
assert.equal(impl.output.outputRootCreatedBeforeInference,true);
assert.equal(impl.supersedes.algorithmChanged,false);
assert.equal(impl.failureCapture.appendOnlyFirstFailure,true);

assert(execV1.includes('DEFAULT_RUN_ID = "basic-pitch-development-inference-v1-001"'));
assert(execV2.includes('DEFAULT_RUN_ID = "basic-pitch-development-inference-v1-002"'));

const mkdirPos=execV2.indexOf('output_root.mkdir(parents=False, exist_ok=True)');
const importPos=execV2.indexOf('from basic_pitch.inference import Model, predict');
const modelPos=execV2.indexOf('model = Model(model_path)');
const loopPos=execV2.indexOf('for index, source in enumerate(receipt["sources"], start=1):');
assert(mkdirPos>=0 && importPos>mkdirPos && modelPos>importPos && loopPos>modelPos);

assert(execV2.includes('"version": 2'));
assert(execV2.includes('write_failure_report(root, run_id, "MODEL_LOAD", None, error)'));
assert(execV2.includes('write_failure_report(root, run_id, "FAMILY_INFERENCE_OR_PERSIST", rid, error)'));
assert(execV2.includes('"BASIC_PITCH_SUPERSEDING_DEVELOPMENT_INFERENCE_COMPLETE"'));

assert(receiptV2.includes("ABORTED_IMPLEMENTATION_ATTEMPT_NO_PERSISTED_FAMILY_OUTPUT"));
assert(receiptV2.includes("OUTPUT_PARENT_NOT_CREATED_BEFORE_ATOMIC_RENAME"));
assert(receiptV2.includes("algorithmChanged:false"));
assert(receiptV2.includes("completedFamilyDirectories:0"));

assert(prepare.includes("basic-pitch-development-inference-v2.js"));
assert(!prepare.includes(" execute "));
assert(run.includes("basic-pitch-development-execute-v2.py"));
assert(run.includes("BASIC_PITCH_FAILURE_REPORT"));
assert(run.indexOf(" check $Workspace $RunId") < run.indexOf(" execute $Workspace --run-id $RunId"));

console.log("owned-beats-basic-pitch-superseding-test: PASS");
