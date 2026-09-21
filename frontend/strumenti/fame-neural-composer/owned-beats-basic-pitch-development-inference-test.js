"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const mod=require(path.join(owned,"basic-pitch-development-inference.js"));
const contract=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-execution-contract-v1.json"),"utf8"));
const wrapper=fs.readFileSync(path.join(owned,"prepare-basic-pitch-development-inference.ps1"),"utf8");

assert.doesNotThrow(()=>mod.validateContract(contract));
assert.equal(contract.status,"FROZEN_BEFORE_FIRST_BASIC_PITCH_OUTPUT");
assert.equal(contract.inference.api,"basic_pitch.inference.predict");
assert.equal(contract.inference.onsetThreshold,0.5);
assert.equal(contract.inference.frameThreshold,0.3);
assert.equal(contract.inference.minimumNoteLengthMs,127.7);
assert.equal(contract.inference.minimumFrequencyHz,25);
assert.equal(contract.inference.maximumFrequencyHz,300);
assert.equal(contract.inference.multiplePitchBends,true);
assert.equal(contract.inference.melodiaTrick,true);
assert.equal(contract.scope.expectedFamilies,8);
assert.equal(contract.scope.finalHoldoutAccessAllowed,false);
assert.equal(contract.scope.batch131Authorized,false);
assert.equal(contract.scope.trainingAuthorized,false);

const frozen=mod.validateRepo();
assert.equal(frozen.contract.candidateId,"basic-pitch-0.4.0-lowend-v1");
assert.equal(frozen.lockSha,"3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad");

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"fame-basic-pitch-bpm-"));
try{
  const dir=path.join(tmp,"runs","audio-analysis-evaluation-v2","v2-config-001-development-001");
  fs.mkdirSync(dir,{recursive:true});
  const ids=["FAME000011","FAME000012","FAME000023","FAME000040","FAME000046","FAME000058","FAME000080","FAME000126"];
  fs.writeFileSync(path.join(dir,"report.json"),JSON.stringify({
    candidateId:"audio-analysis-v2-config-001",
    runId:"v2-config-001-development-001",
    split:"development",
    holdoutObserved:false,
    trainingAuthorized:false,
    families:ids.map((sourceRecordId,i)=>({sourceRecordId,bpm:{estimated:120+i}}))
  },null,2)+"\n");
  const result=mod.bpmBySource(tmp,ids);
  assert.equal(Object.keys(result.out).length,8);
  assert.equal(result.out.FAME000011,120);
  assert.equal(result.out.FAME000126,127);
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}

assert(wrapper.includes("verify-basic-pitch-pre-inference.ps1"));
assert(wrapper.includes('$env:FAME_BASIC_PITCH_PREINFERENCE_GATE = "PASS"'));
assert(wrapper.includes("basic-pitch-development-inference.js"));
assert(wrapper.includes(" prepare $Workspace $RunId"));
assert(!wrapper.includes("predict("));
assert(!wrapper.includes("predict_and_save"));
assert(!wrapper.includes(" execute "));

const source=fs.readFileSync(path.join(owned,"basic-pitch-development-inference.js"),"utf8");
assert(source.includes('status:"AUTHORIZED_NO_INFERENCE"'));
assert(source.includes('audioDecodedByPrepareCommand:false'));
assert(source.includes('basicPitchInferenceExecutedByPrepareCommand:false'));
assert(source.includes('midiWrittenByPrepareCommand:false'));
assert(!source.includes("predict("));
assert(!source.includes("predict_and_save"));

console.log("owned-beats-basic-pitch-development-inference-test: PASS");
