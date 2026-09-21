"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const pre=require("./basic-pitch-preinference");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"basic-pitch-lowend-candidate-protocol-v1.json");
const ENV_SPEC_FILE=path.join(HERE,"basic-pitch-environment-v1.json");
const CONTRACT_FILE=path.join(HERE,"basic-pitch-execution-contract-v1.json");
const LOCK_FILE=path.join(HERE,"requirements-basic-pitch-lock.txt");

const DEFAULT_RUN_ID="basic-pitch-development-inference-v1-001";
const SCHEMA="fame-owned-beats-basic-pitch-development-inference-v1";
const ENV_RUN_ID="basic-pitch-env-v1-001";
const AUDIO_ANALYSIS_RUN_ID="v2-config-001-development-001";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function sha256File(file){const h=crypto.createHash("sha256");const fd=fs.openSync(file,"r");try{const b=Buffer.allocUnsafe(1024*1024);while(true){const n=fs.readSync(fd,b,0,b.length,null);if(!n)break;h.update(b.subarray(0,n))}}finally{fs.closeSync(fd)}return h.digest("hex")}
function safeId(v,label){if(typeof v!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(v))throw new Error(label+" invalid");return v}
function isWithin(root,target){const rel=path.relative(root,target);return rel===""||(!rel.startsWith("..")&&!path.isAbsolute(rel))}
function resolveWithin(root,relative,label){if(typeof relative!=="string"||!relative.trim()||path.isAbsolute(relative))throw new Error("Unsafe "+label+" relative path");const target=path.resolve(root,relative);if(!isWithin(root,target))throw new Error(label+" path escapes workspace");return target}

function validateContract(contract){
 if(
   contract?.schema!=="fame-owned-beats-basic-pitch-execution-contract-v1"||
   contract.version!==1||
   contract.status!=="FROZEN_BEFORE_FIRST_BASIC_PITCH_OUTPUT"||
   contract.candidateId!=="basic-pitch-0.4.0-lowend-v1"||
   contract.package?.version!=="0.4.0"||
   contract.package?.repositoryTagCommit!=="9991303bba609a3b93089d13ec80d1d495083596"||
   contract.package?.modelSha256!=="2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec"||
   contract.package?.backend!=="ONNX"||
   contract.package?.onnxRuntimeVersion!=="1.23.2"||
   contract.environment?.pythonVersion!=="3.10.11"||
   contract.environment?.repositoryLockSha256!=="3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad"||
   contract.environment?.packageCount!==44||
   contract.inference?.api!=="basic_pitch.inference.predict"||
   contract.inference?.onsetThreshold!==0.5||
   contract.inference?.frameThreshold!==0.3||
   contract.inference?.minimumNoteLengthMs!==127.70||
   contract.inference?.minimumFrequencyHz!==25||
   contract.inference?.maximumFrequencyHz!==300||
   contract.inference?.multiplePitchBends!==true||
   contract.inference?.melodiaTrick!==true||
   contract.inference?.appendOnly!==true||
   contract.scope?.split!=="development"||
   contract.scope?.expectedFamilies!==8||
   contract.scope?.inputStem!=="bass"||
   contract.scope?.finalHoldoutAccessAllowed!==false||
   contract.scope?.batch131Authorized!==false||
   contract.scope?.trainingAuthorized!==false||
   contract.scope?.taskDataReadyMayBeDeclared!==false||
   contract.output?.runId!==DEFAULT_RUN_ID
 ) throw new Error("Unsupported or unsafe Basic Pitch execution contract");
 return contract;
}

function validateRepo(){
 const protocol=readJson(PROTOCOL_FILE),env=readJson(ENV_SPEC_FILE),contract=validateContract(readJson(CONTRACT_FILE));
 if(
   protocol.status!=="ENVIRONMENT_AND_MODEL_FROZEN_AWAITING_PREINFERENCE_VERIFY"||
   env.status!=="EXACT_TRANSITIVE_LOCK_COMMITTED"||
   env.lock?.committed!==true||
   env.lock?.reviewed!==true||
   sha256File(LOCK_FILE)!==contract.environment.repositoryLockSha256||
   protocol.environment?.repositoryLockSha256!==contract.environment.repositoryLockSha256||
   protocol.environment?.packagedModel?.sha256!==contract.package.modelSha256
 ) throw new Error("Basic Pitch repository freeze no longer matches execution contract");
 return{
   protocol,env,contract,
   protocolSha256:sha256File(PROTOCOL_FILE),
   environmentSpecSha256:sha256File(ENV_SPEC_FILE),
   contractSha256:sha256File(CONTRACT_FILE),
   lockSha256:sha256File(LOCK_FILE)
 };
}

function validateEnvironmentReceipt(workspace,frozen){
 const file=path.join(workspace,"runs","basic-pitch-environment",ENV_RUN_ID,"environment-receipt.json");
 if(!fs.existsSync(file))throw new Error("Basic Pitch environment receipt missing");
 const receipt=readJson(file);
 if(
   receipt.schema!=="fame-owned-beats-basic-pitch-environment-receipt-v1"||
   receipt.runId!==ENV_RUN_ID||
   receipt.basicPitch?.version!==frozen.contract.package.version||
   receipt.runtime?.selectedBackend!==frozen.contract.package.backend||
   receipt.runtime?.onnxRuntimeVersion!==frozen.contract.package.onnxRuntimeVersion||
   receipt.packagedModel?.sha256!==frozen.contract.package.modelSha256||
   receipt.packagedModel?.bytes!==frozen.env.runtime.packagedModel.bytes||
   receipt.pipFreezeAllSha256!==frozen.env.lock.sourcePipFreezeAllSha256||
   receipt.sourceAudioOpenedByThisCommand!==false||
   receipt.transcriptionExecutedByThisCommand!==false||
   receipt.finalHoldoutAccessedByThisCommand!==false||
   receipt.batch131AccessedByThisCommand!==false||
   receipt.trainingAuthorized!==false
 ) throw new Error("Basic Pitch environment receipt no longer matches frozen environment");
 const py=path.join(workspace,"venv-basic-pitch","Scripts","python.exe");
 if(!fs.existsSync(py)||!fs.statSync(py).isFile())throw new Error("Basic Pitch venv Python missing: "+py);
 return{file,receipt,python:py};
}

function bpmBySource(workspace,expectedIds){
 const file=path.join(workspace,"runs","audio-analysis-evaluation-v2",AUDIO_ANALYSIS_RUN_ID,"report.json");
 if(!fs.existsSync(file))throw new Error("Promoted Audio Analysis development report missing");
 const report=readJson(file);
 if(
   report.candidateId!=="audio-analysis-v2-config-001"||
   report.runId!==AUDIO_ANALYSIS_RUN_ID||
   report.split!=="development"||
   report.holdoutObserved!==false||
   report.trainingAuthorized!==false||
   !Array.isArray(report.families)||
   report.families.length!==8
 ) throw new Error("Unexpected Audio Analysis development report");
 const out={};
 for(const item of report.families){
   const rid=item.sourceRecordId,bpm=item.bpm?.estimated;
   if(!expectedIds.includes(rid)||typeof bpm!=="number"||!Number.isFinite(bpm)||bpm<=0)throw new Error("Invalid autonomous BPM: "+rid);
   out[rid]=bpm;
 }
 if(JSON.stringify(Object.keys(out).sort())!==JSON.stringify([...expectedIds].sort()))throw new Error("Autonomous BPM coverage mismatch");
 return{file,report,out};
}

function executionRoot(workspace){return path.join(workspace,"runs","basic-pitch-development-inference")}
function executionDir(workspace,runId){return path.join(executionRoot(workspace),runId)}

function prepare(workspaceRoot,runId=DEFAULT_RUN_ID){
 if(process.env.FAME_BASIC_PITCH_PREINFERENCE_GATE!=="PASS"){
   throw new Error("Pre-inference gate evidence missing; use prepare-basic-pitch-development-inference.ps1");
 }
 runId=safeId(runId,"run-id");
 if(runId!==DEFAULT_RUN_ID)throw new Error("Only frozen Basic Pitch run-id is allowed");
 const workspace=path.resolve(workspaceRoot);
 const frozen=validateRepo();
 const gate=pre.preflight(workspace);
 if(gate.mode!=="BASIC_PITCH_PREINFERENCE_DATA_GATE_PASS"||gate.records!==8||gate.basicPitchInferenceExecutedByThisCommand!==false){
   throw new Error("Basic Pitch pre-inference data gate did not pass");
 }
 const environment=validateEnvironmentReceipt(workspace,frozen);
 const bpm=bpmBySource(workspace,frozen.protocol.scope.sourceRecordIds);

 const sources=gate.bassStems.map(item=>{
   const file=resolveWithin(workspace,item.relativePath,"bass stem");
   const actual=sha256File(file);
   if(actual!==item.sha256)throw new Error("Bass stem changed after pre-inference gate: "+item.sourceRecordId);
   return{
     compositionFamilyId:item.compositionFamilyId,
     sourceRecordId:item.sourceRecordId,
     inputStem:"bass",
     relativePath:item.relativePath,
     sha256:item.sha256,
     bytes:item.bytes,
     midiTempo:bpm.out[item.sourceRecordId],
     outputRelativePath:path.posix.join("outputs",item.sourceRecordId)
   };
 });
 if(sources.length!==8||new Set(sources.map(x=>x.compositionFamilyId)).size!==8)throw new Error("Basic Pitch receipt requires 8 distinct development families");

 const finalDir=executionDir(workspace,runId);
 if(fs.existsSync(finalDir))throw new Error("Append-only Basic Pitch run already exists: "+finalDir);

 const payload={
   schema:SCHEMA,
   version:1,
   status:"AUTHORIZED_NO_INFERENCE",
   runId,
   candidateId:frozen.contract.candidateId,
   preparedAt:new Date().toISOString(),
   protocolSha256:frozen.protocolSha256,
   executionContractSha256:frozen.contractSha256,
   environmentSpecSha256:frozen.environmentSpecSha256,
   environmentLockSha256:frozen.lockSha256,
   environmentReceipt:{
     runId:ENV_RUN_ID,
     receiptSha256:sha256File(environment.file),
     python:environment.python,
     pipFreezeAllSha256:environment.receipt.pipFreezeAllSha256,
     backend:environment.receipt.runtime.selectedBackend,
     onnxRuntimeVersion:environment.receipt.runtime.onnxRuntimeVersion
   },
   model:{
     path:environment.receipt.packagedModel.path,
     filename:environment.receipt.packagedModel.filename,
     bytes:environment.receipt.packagedModel.bytes,
     sha256:environment.receipt.packagedModel.sha256
   },
   humanReview:{
     reviewId:frozen.protocol.prerequisite.humanReviewId,
     submissionDigestSha256:frozen.protocol.prerequisite.humanReviewSubmissionDigestSha256,
     selectedDrumsArm:frozen.protocol.prerequisite.selectedDrumsArm,
     pyinBaselineQualified:true
   },
   audioAnalysis:{
     runId:AUDIO_ANALYSIS_RUN_ID,
     candidateId:"audio-analysis-v2-config-001",
     reportSha256:sha256File(bpm.file),
     humanReferenceUsedAsInput:false
   },
   inference:{...frozen.contract.inference},
   sources,
   safety:{
     split:"development",
     sourceFamiliesLocked:true,
     inputStem:"bass",
     originalSourceAudioAllowed:false,
     finalHoldoutExcluded:true,
     batch131Authorized:false,
     trainingAuthorized:false,
     taskDataReadyMayBeDeclared:false
   },
   evidence:{
     preInferenceGatePassedImmediatelyBeforeReceipt:true,
     bassStemIntegrityBytesReadByPrepareCommand:true,
     audioDecodedByPrepareCommand:false,
     basicPitchInferenceExecutedByPrepareCommand:false,
     midiWrittenByPrepareCommand:false
   },
   nextAction:"EXECUTE_BASIC_PITCH_DEVELOPMENT_INFERENCE_APPEND_ONLY"
 };

 const root=executionRoot(workspace);fs.mkdirSync(root,{recursive:true});
 const temp=path.join(root,"."+runId+"."+crypto.randomUUID()+".preparing");fs.mkdirSync(temp,{recursive:false});
 try{
   fs.writeFileSync(path.join(temp,"execution-receipt.json"),JSON.stringify(payload,null,2)+"\n",{flag:"wx"});
   fs.renameSync(temp,finalDir);
 }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error}

 return{
   mode:"BASIC_PITCH_DEVELOPMENT_INFERENCE_RECEIPT_PREPARED",
   runId,
   runDirectory:finalDir,
   records:sources.length,
   status:"AUTHORIZED_NO_INFERENCE",
   sourceFamiliesLocked:true,
   bassStemIntegrityBytesReadByThisCommand:true,
   audioDecodedByThisCommand:false,
   basicPitchInferenceExecutedByThisCommand:false,
   midiWrittenByThisCommand:false,
   finalHoldoutAccessedByThisCommand:false,
   batch131AccessedByThisCommand:false,
   trainingAuthorized:false,
   nextAction:"EXECUTE_BASIC_PITCH_DEVELOPMENT_INFERENCE_APPEND_ONLY"
 };
}

function check(workspaceRoot,runId=DEFAULT_RUN_ID){
 runId=safeId(runId,"run-id");const workspace=path.resolve(workspaceRoot),frozen=validateRepo();
 const file=path.join(executionDir(workspace,runId),"execution-receipt.json");
 if(!fs.existsSync(file))throw new Error("Basic Pitch execution receipt missing: "+file);
 const receipt=readJson(file);
 if(
   receipt.schema!==SCHEMA||
   receipt.version!==1||
   receipt.status!=="AUTHORIZED_NO_INFERENCE"||
   receipt.runId!==runId||
   receipt.candidateId!==frozen.contract.candidateId||
   receipt.protocolSha256!==frozen.protocolSha256||
   receipt.executionContractSha256!==frozen.contractSha256||
   receipt.environmentSpecSha256!==frozen.environmentSpecSha256||
   receipt.environmentLockSha256!==frozen.lockSha256||
   receipt.model?.sha256!==frozen.contract.package.modelSha256||
   receipt.humanReview?.submissionDigestSha256!==frozen.protocol.prerequisite.humanReviewSubmissionDigestSha256||
   !Array.isArray(receipt.sources)||receipt.sources.length!==8||
   receipt.safety?.split!=="development"||
   receipt.safety?.finalHoldoutExcluded!==true||
   receipt.safety?.batch131Authorized!==false||
   receipt.safety?.trainingAuthorized!==false
 ) throw new Error("Basic Pitch execution receipt no longer matches frozen repository artifacts");

 for(const source of receipt.sources){
   const stem=resolveWithin(workspace,source.relativePath,"bass stem");
   if(!fs.existsSync(stem)||sha256File(stem)!==source.sha256)throw new Error("Basic Pitch receipt stem changed: "+source.sourceRecordId);
 }
 return{
   mode:"BASIC_PITCH_DEVELOPMENT_INFERENCE_RECEIPT_CHECK",
   runId,
   status:receipt.status,
   records:receipt.sources.length,
   sourceFamiliesLocked:receipt.safety.sourceFamiliesLocked,
   inputStem:receipt.safety.inputStem,
   finalHoldoutExcluded:receipt.safety.finalHoldoutExcluded,
   batch131Authorized:receipt.safety.batch131Authorized,
   trainingAuthorized:receipt.safety.trainingAuthorized,
   nextAction:receipt.nextAction
 };
}

function main(args=process.argv.slice(2)){
 const[command,workspace,runId]=args;if(!command||!workspace)throw new Error("Usage: node basic-pitch-development-inference.js <prepare|check> <workspace> [run-id]");
 const result=command==="prepare"?prepare(workspace,runId||DEFAULT_RUN_ID):command==="check"?check(workspace,runId||DEFAULT_RUN_ID):(()=>{throw new Error("Unknown command")})();
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
}
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={prepare,check,validateContract,validateRepo,bpmBySource};
