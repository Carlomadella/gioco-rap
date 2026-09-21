"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const executorPath=path.join(owned,"basic-pitch-development-execute.py");
const executionContractPath=path.join(owned,"basic-pitch-execution-contract-v1.json");
const implementationPath=path.join(owned,"basic-pitch-execution-implementation-v1.json");
const wrapperPath=path.join(owned,"run-basic-pitch-development-inference.ps1");

function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}

const execution=JSON.parse(fs.readFileSync(executionContractPath,"utf8"));
const implementation=JSON.parse(fs.readFileSync(implementationPath,"utf8"));
const executor=fs.readFileSync(executorPath,"utf8");
const wrapper=fs.readFileSync(wrapperPath,"utf8");

assert.equal(execution.status,"FROZEN_BEFORE_FIRST_BASIC_PITCH_OUTPUT");
assert.equal(implementation.status,"FROZEN_BEFORE_FIRST_BASIC_PITCH_INFERENCE");
assert.equal(implementation.runId,"basic-pitch-development-inference-v1-001");
assert.equal(implementation.executionContractGitBlobSha,gitBlobSha(executionContractPath));
assert.equal(implementation.executor.gitBlobSha,gitBlobSha(executorPath));
assert.equal(implementation.executor.gitBlobSha,"f677c82f1761fe7441fe0e09364bd7635c9931a3");
assert.equal(implementation.runtime.modelLoadedOncePerProcess,true);
assert.equal(implementation.output.atomicPerFamily,true);
assert.equal(implementation.output.resumeByValidatedReceipt,true);
assert.equal(implementation.output.rawModelOutputPersisted,false);
assert.equal(implementation.safety.expectedFamilies,8);
assert.equal(implementation.safety.finalHoldoutAllowed,false);
assert.equal(implementation.safety.batch131Allowed,false);
assert.equal(implementation.safety.trainingAuthorized,false);

for(const needle of [
  'from basic_pitch.inference import Model, predict',
  'model = Model(model_path)',
  'for index, source in enumerate(receipt["sources"], start=1):',
  'model_or_model_path=model',
  'onset_threshold=float(receipt["inference"]["onsetThreshold"])',
  'frame_threshold=float(receipt["inference"]["frameThreshold"])',
  'minimum_note_length=float(receipt["inference"]["minimumNoteLengthMs"])',
  'minimum_frequency=float(receipt["inference"]["minimumFrequencyHz"])',
  'maximum_frequency=float(receipt["inference"]["maximumFrequencyHz"])',
  'multiple_pitch_bends=bool(receipt["inference"]["multiplePitchBends"])',
  'melodia_trick=bool(receipt["inference"]["melodiaTrick"])',
  'midi_tempo=float(source["midiTempo"])',
  'os.replace(temp_dir, final_dir)',
  '"INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"',
  '"RUN_BASIC_PITCH_TECHNICAL_QA_AND_PREPARE_BLIND_LOW_END_COMPARISON"'
]) assert(executor.includes(needle),needle);

assert.equal((executor.match(/model = Model\(model_path\)/g)||[]).length,1);
assert(executor.includes('del model_output'));
assert(!executor.includes("np.savez"));
assert(!executor.includes("final-holdout"));
assert(!executor.includes("batch131.wav"));

for(const needle of [
  "verify-basic-pitch-environment-lock.ps1",
  "basic-pitch-development-inference.js",
  "basic-pitch-development-execute.py",
  " self-test",
  " execute $Workspace --run-id $RunId"
]) assert(wrapper.includes(needle),needle);

const checkPos=wrapper.indexOf(" check $Workspace $RunId");
const executePos=wrapper.indexOf(" execute $Workspace --run-id $RunId");
assert(checkPos>=0 && executePos>checkPos);

console.log("owned-beats-basic-pitch-execution-test: PASS");
