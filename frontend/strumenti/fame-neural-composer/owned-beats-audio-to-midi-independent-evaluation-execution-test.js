"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const py=fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-execution.py"),"utf8");
const ps=fs.readFileSync(path.join(owned,"run-audio-to-midi-independent-evaluation-execution.ps1"),"utf8");
const contract=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-execution-v1.json"),"utf8"));

assert.equal(contract.status,"FROZEN_BEFORE_FIRST_EVALUATION_AUDIO_ACCESS");
assert.equal(contract.runId,"audio-to-midi-independent-evaluation-v1-001");
assert.equal(contract.expectedFamilies,12);
assert.equal(contract.retuningAllowed,false);
assert.equal(contract.pipeline.drums.armId,"drums-bass-kick-fusion-v1");
assert.equal(contract.pipeline.lowEnd.armId,"librosa-pyin-lowend-v1");
assert.equal(contract.pipeline.basicPitch.enabled,false);
assert.equal(contract.safety.batch131Authorized,false);
assert.equal(contract.safety.trainingAuthorized,false);
assert.equal(contract.safety.taskDataReadyMayBeDeclared,false);

for(const needle of[
  'def execute(workspace_root, model_xml=DEFAULT_MODEL):',
  'status": "EVALUATION_OUTPUT_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"',
  '"basicPitchExecuted": False',
  '"humanReferenceUsedAsInput": False',
  '"retuningPerformed": False',
  '"batch131Authorized": False',
  '"trainingAuthorized": False',
  '"taskDataReadyMayBeDeclared": False',
  'RUN_INDEPENDENT_EVALUATION_TECHNICAL_QA_THEN_BLIND_HUMAN_QA'
]) assert(py.includes(needle),needle);

assert(ps.includes('& $python $tool check $Workspace --model $Model'));
assert(ps.includes('& $python $tool execute $Workspace --model $Model'));
assert(ps.indexOf(' check $Workspace') < ps.indexOf(' execute $Workspace'));
assert(!ps.includes('prepare $Workspace'));

console.log("owned-beats-audio-to-midi-independent-evaluation-execution-test: PASS");
