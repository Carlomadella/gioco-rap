"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const owned=path.join(__dirname,"owned-beats");
const mod=require(path.join(owned,"basic-pitch-preinference.js"));
const wrapper=fs.readFileSync(path.join(owned,"verify-basic-pitch-pre-inference.ps1"),"utf8");

function sha(file){return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}

const frozen=mod.validateFrozenRepo();
assert.equal(frozen.protocol.status,"ENVIRONMENT_AND_MODEL_FROZEN_AWAITING_PREINFERENCE_VERIFY");
assert.equal(frozen.env.status,"EXACT_TRANSITIVE_LOCK_COMMITTED");
assert.equal(frozen.protocol.scope.expectedFamilies,8);
assert.equal(frozen.protocol.environment.packageCount,44);
assert.equal(frozen.lockSha,"3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad");

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"fame-basic-pitch-pre-"));
try{
  const reviewDir=path.join(tmp,"reviews","audio-to-midi-development","audio-to-midi-human-review-v1-001");
  fs.mkdirSync(reviewDir,{recursive:true});
  const submissionFile=path.join(reviewDir,"submission.json");
  fs.writeFileSync(submissionFile,JSON.stringify({fixture:true})+"\n");
  const submissionSha=sha(submissionFile);
  fs.writeFileSync(path.join(reviewDir,"report.json"),JSON.stringify({
    schema:"fame-owned-beats-audio-to-midi-human-review-report-v1",
    version:1,
    reviewId:"audio-to-midi-human-review-v1-001",
    runId:"audio-to-midi-development-baseline-v1-001",
    records:8,
    submissionDigestSha256:submissionSha,
    gate:{
      technical:"ALL_8_FAMILIES_PASS",
      drums:{selectedArm:"drums-bass-kick-fusion-v1",pass:true},
      lowEnd:{armId:"librosa-pyin-lowend-v1",pass:true},
      pass:true,
      outcome:"OPEN_AUDIO_TO_MIDI_QA_INTEGRATION"
    },
    safety:{finalHoldoutAccessed:false,batch131Accessed:false,trainingAuthorized:false}
  },null,2)+"\n");

  const review=mod.validateHumanReview(tmp,{
    prerequisite:{
      humanReviewSubmissionDigestSha256:submissionSha,
      baselineTechnicalGate:"ALL_8_FAMILIES_PASS",
      selectedDrumsArm:"drums-bass-kick-fusion-v1"
    }
  });
  assert.equal(review.report.records,8);

  const ids=["FAME000011","FAME000012","FAME000023","FAME000040","FAME000046","FAME000058","FAME000080","FAME000126"];
  const sepDir=path.join(tmp,"runs","source-separation-development-inference","source-separation-development-inference-v1-001");
  fs.mkdirSync(path.join(sepDir,"results"),{recursive:true});
  const sources=[];
  for(let i=0;i<ids.length;i++){
    const rid=ids[i],rel=path.posix.join("outputs",rid),out=path.join(sepDir,"outputs",rid);
    fs.mkdirSync(out,{recursive:true});
    const stem=path.join(out,"bass.wav");
    fs.writeFileSync(stem,Buffer.from("fake-bass-"+rid));
    const stemSha=sha(stem);
    sources.push({sourceRecordId:rid,compositionFamilyId:"family-"+(i+1),outputRelativePath:rel});
    fs.writeFileSync(path.join(sepDir,"results",rid+".json"),JSON.stringify({
      adapterResult:{stems:{bass:{sha256:stemSha}}}
    },null,2)+"\n");
  }
  fs.writeFileSync(path.join(sepDir,"execution-receipt.json"),JSON.stringify({
    schema:"fame-owned-beats-source-separation-development-inference-v1",
    status:"AUTHORIZED_NO_INFERENCE",
    runId:"source-separation-development-inference-v1-001",
    safety:{split:"development",sourceFamiliesLocked:true,finalHoldoutExcluded:true,batch131Authorized:false,trainingAuthorized:false},
    sources
  },null,2)+"\n");
  fs.writeFileSync(path.join(sepDir,"inference-summary.json"),JSON.stringify({
    status:"INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
    records:8,
    technicalValidationPassed:true
  },null,2)+"\n");

  const checked=mod.validateBassStems(tmp,{scope:{sourceRecordIds:ids}});
  assert.equal(checked.stems.length,8);
  assert(checked.stems.every(x=>x.bytes>0));

  fs.appendFileSync(path.join(sepDir,"outputs",ids[0],"bass.wav"),"corrupt");
  assert.throws(()=>mod.validateBassStems(tmp,{scope:{sourceRecordIds:ids}}),/Bass stem SHA mismatch/);
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}

for(const needle of [
  "verify-basic-pitch-environment-lock.ps1",
  "basic-pitch-preinference.js",
  "BASIC_PITCH_PREINFERENCE_GATE_PASS",
  "basicPitchInferenceExecutedByThisCommand = $false",
  "audioDecodedByThisCommand = $false",
  "PREPARE_BASIC_PITCH_APPEND_ONLY_INFERENCE_RECEIPT"
]) assert(wrapper.includes(needle),needle);

assert(!wrapper.includes("predict("));
assert(!wrapper.includes("predict_and_save"));

console.log("owned-beats-basic-pitch-preinference-test: PASS");
