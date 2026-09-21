"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"basic-pitch-lowend-candidate-protocol-v1.json");
const ENV_SPEC_FILE=path.join(HERE,"basic-pitch-environment-v1.json");
const LOCK_FILE=path.join(HERE,"requirements-basic-pitch-lock.txt");

const REVIEW_ID="audio-to-midi-human-review-v1-001";
const BASELINE_RUN_ID="audio-to-midi-development-baseline-v1-001";
const SOURCE_SEP_RUN_ID="source-separation-development-inference-v1-001";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function sha256File(file){const h=crypto.createHash("sha256");const fd=fs.openSync(file,"r");try{const b=Buffer.allocUnsafe(1024*1024);while(true){const n=fs.readSync(fd,b,0,b.length,null);if(!n)break;h.update(b.subarray(0,n))}}finally{fs.closeSync(fd)}return h.digest("hex")}
function safeId(v,label){if(typeof v!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(v))throw new Error(label+" invalid");return v}
function isWithin(root,target){const rel=path.relative(root,target);return rel===""||(!rel.startsWith("..")&&!path.isAbsolute(rel))}
function resolveWithin(root,relative,label){if(typeof relative!=="string"||!relative.trim()||path.isAbsolute(relative))throw new Error("Unsafe "+label+" path");const target=path.resolve(root,relative);if(!isWithin(root,target))throw new Error(label+" path escapes root");return target}

function validateFrozenRepo(){
 const p=readJson(PROTOCOL_FILE),e=readJson(ENV_SPEC_FILE);
 if(
   p.schema!=="fame-owned-beats-basic-pitch-lowend-candidate-protocol-v1"||
   p.version!==1||
   p.status!=="ENVIRONMENT_AND_MODEL_FROZEN_AWAITING_PREINFERENCE_VERIFY"||
   p.candidateId!=="basic-pitch-0.4.0-lowend-v1"||
   p.scope?.split!=="development"||
   p.scope?.expectedFamilies!==8||
   p.scope?.inputStem!=="bass"||
   p.scope?.finalHoldoutAllowed!==false||
   p.scope?.batch131Allowed!==false||
   p.scope?.trainingAuthorized!==false||
   p.scope?.taskDataReadyMayBeDeclared!==false||
   p.input?.sourceSeparationRunId!==SOURCE_SEP_RUN_ID||
   p.input?.stem!=="bass"||
   p.input?.sourceAudioOriginalAllowed!==false||
   p.input?.humanReferenceAsInputAllowed!==false||
   p.environment?.lockCommitted!==true||
   p.environment?.lockReviewed!==true||
   p.environment?.packagedModel?.committed!==true||
   p.safety?.noBasicPitchInferenceUntilPreinferenceVerify!==true
 ) throw new Error("Basic Pitch candidate protocol is not frozen at pre-inference boundary");

 if(
   e.schema!=="fame-owned-beats-basic-pitch-environment-v1"||
   e.version!==1||
   e.status!=="EXACT_TRANSITIVE_LOCK_COMMITTED"||
   e.lock?.committed!==true||
   e.lock?.reviewed!==true||
   e.lock?.packageCount!==44
 ) throw new Error("Basic Pitch environment spec not exact-lock committed");

 const lockSha=sha256File(LOCK_FILE);
 if(lockSha!==e.lock.repositoryCanonicalSha256||lockSha!==p.environment.repositoryLockSha256){
   throw new Error("Basic Pitch repository lock SHA mismatch");
 }
 if(e.runtime?.packagedModel?.sha256!==p.environment?.packagedModel?.sha256){
   throw new Error("Basic Pitch model freeze mismatch between spec and protocol");
 }
 return{protocol:p,env:e,lockSha};
}

function validateHumanReview(workspace,p){
 const reportFile=path.join(workspace,"reviews","audio-to-midi-development",REVIEW_ID,"report.json");
 const submissionFile=path.join(workspace,"reviews","audio-to-midi-development",REVIEW_ID,"submission.json");
 if(!fs.existsSync(reportFile)||!fs.existsSync(submissionFile))throw new Error("Audio→MIDI Human Review report/submission missing");
 const report=readJson(reportFile);
 if(
   report.schema!=="fame-owned-beats-audio-to-midi-human-review-report-v1"||
   report.version!==1||
   report.reviewId!==REVIEW_ID||
   report.runId!==BASELINE_RUN_ID||
   report.records!==8||
   report.submissionDigestSha256!==p.prerequisite.humanReviewSubmissionDigestSha256||
   sha256File(submissionFile)!==p.prerequisite.humanReviewSubmissionDigestSha256||
   report.gate?.technical!==p.prerequisite.baselineTechnicalGate||
   report.gate?.drums?.selectedArm!==p.prerequisite.selectedDrumsArm||
   report.gate?.drums?.pass!==true||
   report.gate?.lowEnd?.armId!=="librosa-pyin-lowend-v1"||
   report.gate?.lowEnd?.pass!==true||
   report.gate?.pass!==true||
   report.gate?.outcome!=="OPEN_AUDIO_TO_MIDI_QA_INTEGRATION"||
   report.safety?.finalHoldoutAccessed!==false||
   report.safety?.batch131Accessed!==false||
   report.safety?.trainingAuthorized!==false
 ) throw new Error("Audio→MIDI Human Review no longer matches Basic Pitch prerequisite");
 return{reportFile,submissionFile,report};
}

function validateBassStems(workspace,p){
 const runDir=path.join(workspace,"runs","source-separation-development-inference",SOURCE_SEP_RUN_ID);
 const receiptFile=path.join(runDir,"execution-receipt.json");
 const summaryFile=path.join(runDir,"inference-summary.json");
 if(!fs.existsSync(receiptFile)||!fs.existsSync(summaryFile))throw new Error("Source Separation run artifacts missing");
 const receipt=readJson(receiptFile),summary=readJson(summaryFile);
 if(
   receipt.schema!=="fame-owned-beats-source-separation-development-inference-v1"||
   receipt.status!=="AUTHORIZED_NO_INFERENCE"||
   receipt.runId!==SOURCE_SEP_RUN_ID||
   receipt.safety?.split!=="development"||
   receipt.safety?.sourceFamiliesLocked!==true||
   receipt.safety?.finalHoldoutExcluded!==true||
   receipt.safety?.batch131Authorized!==false||
   receipt.safety?.trainingAuthorized!==false||
   summary.status!=="INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"||
   summary.records!==8||
   summary.technicalValidationPassed!==true
 ) throw new Error("Source Separation run is not eligible as Basic Pitch input");

 const expected=p.scope.sourceRecordIds;
 if(!Array.isArray(receipt.sources)||receipt.sources.length!==8)throw new Error("Source Separation source coverage mismatch");
 const ids=receipt.sources.map(x=>x.sourceRecordId);
 if(JSON.stringify(ids)!==JSON.stringify(expected))throw new Error("Source Separation source order/identity differs from frozen Basic Pitch cohort");
 if(new Set(receipt.sources.map(x=>x.compositionFamilyId)).size!==8)throw new Error("Basic Pitch cohort requires 8 distinct development families");

 const stems=[];
 for(const source of receipt.sources){
   safeId(source.sourceRecordId,"sourceRecordId");
   const resultFile=path.join(runDir,"results",source.sourceRecordId+".json");
   if(!fs.existsSync(resultFile))throw new Error("Source Separation result missing: "+source.sourceRecordId);
   const result=readJson(resultFile);
   const meta=result.adapterResult?.stems?.bass;
   if(!meta?.sha256)throw new Error("Bass stem receipt SHA missing: "+source.sourceRecordId);
   const outputDir=resolveWithin(runDir,source.outputRelativePath,"Source Separation output");
   const stemFile=path.join(outputDir,"bass.wav");
   if(!fs.existsSync(stemFile)||!fs.statSync(stemFile).isFile())throw new Error("Bass stem file missing: "+source.sourceRecordId);
   const actual=sha256File(stemFile);
   if(actual!==meta.sha256)throw new Error("Bass stem SHA mismatch: "+source.sourceRecordId);
   stems.push({
     compositionFamilyId:source.compositionFamilyId,
     sourceRecordId:source.sourceRecordId,
     relativePath:path.relative(workspace,stemFile).split(path.sep).join("/"),
     sha256:actual,
     bytes:fs.statSync(stemFile).size
   });
 }
 return{receiptFile,summaryFile,stems};
}

function preflight(workspaceRoot){
 const workspace=path.resolve(workspaceRoot);
 if(!fs.existsSync(workspace)||!fs.statSync(workspace).isDirectory())throw new Error("Workspace missing: "+workspace);
 const frozen=validateFrozenRepo();
 const review=validateHumanReview(workspace,frozen.protocol);
 const sep=validateBassStems(workspace,frozen.protocol);

 return{
   mode:"BASIC_PITCH_PREINFERENCE_DATA_GATE_PASS",
   candidateId:frozen.protocol.candidateId,
   split:"development",
   records:sep.stems.length,
   sourceRecordIds:sep.stems.map(x=>x.sourceRecordId),
   repositoryLockSha256:frozen.lockSha,
   modelSha256:frozen.protocol.environment.packagedModel.sha256,
   humanReviewSubmissionDigestSha256:frozen.protocol.prerequisite.humanReviewSubmissionDigestSha256,
   selectedDrumsArm:frozen.protocol.prerequisite.selectedDrumsArm,
   pyinBaselineQualified:true,
   bassStems:sep.stems,
   bassStemIntegrityBytesReadByThisCommand:true,
   audioDecodedByThisCommand:false,
   basicPitchInferenceExecutedByThisCommand:false,
   midiWrittenByThisCommand:false,
   originalSourceAudioOpenedByThisCommand:false,
   finalHoldoutAccessedByThisCommand:false,
   batch131AccessedByThisCommand:false,
   trainingAuthorized:false,
   taskDataReadyMayBeDeclared:false,
   nextAction:"PREPARE_BASIC_PITCH_APPEND_ONLY_INFERENCE_RECEIPT"
 };
}

function main(args=process.argv.slice(2)){
 const[command,workspace]=args;
 if(command!=="preflight"||!workspace)throw new Error("Usage: node basic-pitch-preinference.js preflight <workspace>");
 process.stdout.write(JSON.stringify(preflight(workspace),null,2)+"\n");
}
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={preflight,validateFrozenRepo,validateHumanReview,validateBassStems};
