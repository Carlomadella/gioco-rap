"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const prior=require("./basic-pitch-development-inference.js");

const HERE=__dirname;
const CONTRACT_FILE=path.join(HERE,"basic-pitch-execution-contract-v2.json");
const DEFAULT_RUN_ID="basic-pitch-development-inference-v1-002";
const PRIOR_RUN_ID="basic-pitch-development-inference-v1-001";
const SCHEMA="fame-owned-beats-basic-pitch-development-inference-v2";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function sha256File(file){const h=crypto.createHash("sha256");const fd=fs.openSync(file,"r");try{const b=Buffer.allocUnsafe(1024*1024);while(true){const n=fs.readSync(fd,b,0,b.length,null);if(!n)break;h.update(b.subarray(0,n))}}finally{fs.closeSync(fd)}return h.digest("hex")}
function gitBlobSha(file){const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n"),bytes=Buffer.from(text,"utf8");return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex")}
function safeId(v,label){if(typeof v!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(v))throw new Error(label+" invalid");return v}
function isWithin(root,target){const rel=path.relative(root,target);return rel===""||(!rel.startsWith("..")&&!path.isAbsolute(rel))}
function resolveWithin(root,relative,label){if(typeof relative!=="string"||!relative.trim()||path.isAbsolute(relative))throw new Error("Unsafe "+label+" path");const target=path.resolve(root,relative);if(!isWithin(root,target))throw new Error(label+" escapes workspace");return target}

function validateContract(){
 const c=readJson(CONTRACT_FILE);
 if(
   c.schema!=="fame-owned-beats-basic-pitch-execution-contract-v2"||
   c.version!==2||
   c.status!=="FROZEN_BEFORE_FIRST_V2_BASIC_PITCH_OUTPUT"||
   c.candidateId!=="basic-pitch-0.4.0-lowend-v1"||
   c.output?.runId!==DEFAULT_RUN_ID||
   c.supersedes?.runId!==PRIOR_RUN_ID||
   c.supersedes?.algorithmChanged!==false||
   c.supersedes?.implementationOnlyFix!==true||
   c.inference?.api!=="basic_pitch.inference.predict"||
   c.inference?.onsetThreshold!==0.5||
   c.inference?.frameThreshold!==0.3||
   Number(c.inference?.minimumNoteLengthMs)!==127.7||
   c.inference?.minimumFrequencyHz!==25||
   c.inference?.maximumFrequencyHz!==300||
   c.inference?.multiplePitchBends!==true||
   c.inference?.melodiaTrick!==true||
   c.receiptRunner?.path!==path.basename(__filename)||
   c.receiptRunner?.gitBlobSha!==gitBlobSha(__filename)
 ) throw new Error("Basic Pitch v2 execution contract invalid");
 return c;
}

function priorRoot(workspace){return path.join(workspace,"runs","basic-pitch-development-inference",PRIOR_RUN_ID)}
function newRoot(workspace){return path.join(workspace,"runs","basic-pitch-development-inference",DEFAULT_RUN_ID)}

function validatePriorAbortedState(workspace){
 prior.check(workspace,PRIOR_RUN_ID);
 const root=priorRoot(workspace),receiptFile=path.join(root,"execution-receipt.json");
 const summary=path.join(root,"inference-summary.json");
 if(fs.existsSync(summary))throw new Error("Prior Basic Pitch run already has a summary; cannot supersede as aborted");
 const outputs=path.join(root,"outputs");
 let familyDirs=[];
 if(fs.existsSync(outputs))familyDirs=fs.readdirSync(outputs,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
 if(familyDirs.length!==0)throw new Error("Prior Basic Pitch run has completed family directories; manual review required before superseding");
 const tempDirs=fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith(".")&&x.name.endsWith(".tmp")).map(x=>x.name);
 if(tempDirs.length!==0)throw new Error("Prior Basic Pitch run has leftover temp directories; manual review required");
 return{root,receiptFile,receipt:readJson(receiptFile)};
}

function markPriorAborted(workspace,state){
 const file=path.join(state.root,"aborted-attempt.json");
 const payload={
   schema:"fame-owned-beats-basic-pitch-aborted-attempt-v1",
   version:1,
   runId:PRIOR_RUN_ID,
   status:"ABORTED_IMPLEMENTATION_ATTEMPT_NO_PERSISTED_FAMILY_OUTPUT",
   recordedAt:new Date().toISOString(),
   executionReceiptSha256:sha256File(state.receiptFile),
   observedState:{
     completedFamilyDirectories:0,
     inferenceSummaryExists:false,
     leftoverTempDirectories:0
   },
   discoveredImplementationDefect:{
     code:"OUTPUT_PARENT_NOT_CREATED_BEFORE_ATOMIC_RENAME",
     description:"Executor v1 attempted atomic rename into root/outputs/<sourceRecordId> without ensuring root/outputs exists.",
     algorithmChangedBySupersedingRun:false
   },
   limitation:"The wrapper did not preserve the original Python exception text, so this record does not claim the discovered defect was the only possible failure before the rename point.",
   nextRunId:DEFAULT_RUN_ID
 };
 if(fs.existsSync(file)){
   const existing=readJson(file);
   if(existing.runId!==PRIOR_RUN_ID||existing.nextRunId!==DEFAULT_RUN_ID)throw new Error("Existing prior abort marker is incompatible");
   return{file,payload:existing};
 }
 fs.writeFileSync(file,JSON.stringify(payload,null,2)+"\n",{flag:"wx"});
 return{file,payload};
}

function prepare(workspaceRoot,runId=DEFAULT_RUN_ID){
 const workspace=path.resolve(workspaceRoot);
 runId=safeId(runId,"run-id");
 if(runId!==DEFAULT_RUN_ID)throw new Error("Only frozen superseding Basic Pitch run-id is allowed");
 if(!fs.existsSync(workspace)||!fs.statSync(workspace).isDirectory())throw new Error("Workspace missing: "+workspace);

 const contract=validateContract();
 const priorState=validatePriorAbortedState(workspace);
 const abort=markPriorAborted(workspace,priorState);
 const old=priorState.receipt;

 if(old.status!=="AUTHORIZED_NO_INFERENCE"||!Array.isArray(old.sources)||old.sources.length!==8)throw new Error("Prior receipt is not eligible for superseding run");
 if(JSON.stringify(old.inference)!==JSON.stringify(contract.inference))throw new Error("Superseding contract changed Basic Pitch inference parameters");

 const sources=old.sources.map(source=>{
   const stem=resolveWithin(workspace,source.relativePath,"bass stem");
   if(!fs.existsSync(stem)||!fs.statSync(stem).isFile())throw new Error("Bass stem missing: "+source.sourceRecordId);
   if(fs.statSync(stem).size!==source.bytes||sha256File(stem)!==source.sha256)throw new Error("Bass stem changed: "+source.sourceRecordId);
   return{...source,outputRelativePath:path.posix.join("outputs",source.sourceRecordId)};
 });

 const root=newRoot(workspace);
 if(fs.existsSync(root))throw new Error("Append-only superseding Basic Pitch run already exists: "+root);
 const parent=path.dirname(root);fs.mkdirSync(parent,{recursive:true});
 const temp=path.join(parent,"."+runId+"."+crypto.randomUUID()+".preparing");fs.mkdirSync(temp,{recursive:false});
 const payload={
   schema:SCHEMA,
   version:2,
   status:"AUTHORIZED_NO_INFERENCE",
   runId,
   candidateId:old.candidateId,
   preparedAt:new Date().toISOString(),
   supersedes:{
     runId:PRIOR_RUN_ID,
     executionReceiptSha256:sha256File(priorState.receiptFile),
     abortMarkerSha256:sha256File(abort.file),
     reason:"IMPLEMENTATION_ONLY_FIX_OUTPUT_PARENT_FOR_ATOMIC_RENAME",
     algorithmChanged:false
   },
   executionContractSha256:sha256File(CONTRACT_FILE),
   receiptRunner:{path:path.basename(__filename),gitBlobSha:gitBlobSha(__filename)},
   environmentReceipt:old.environmentReceipt,
   model:old.model,
   humanReview:old.humanReview,
   audioAnalysis:old.audioAnalysis,
   inference:old.inference,
   sources,
   safety:old.safety,
   evidence:{
     priorRunValidatedAndMarkedAborted:true,
     bassStemIntegrityBytesReadByPrepareCommand:true,
     audioDecodedByPrepareCommand:false,
     basicPitchInferenceExecutedByPrepareCommand:false,
     midiWrittenByPrepareCommand:false
   },
   nextAction:"EXECUTE_SUPERSEDING_BASIC_PITCH_DEVELOPMENT_INFERENCE_APPEND_ONLY"
 };
 try{
   fs.writeFileSync(path.join(temp,"execution-receipt.json"),JSON.stringify(payload,null,2)+"\n",{flag:"wx"});
   fs.renameSync(temp,root);
 }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error}
 return{
   mode:"BASIC_PITCH_SUPERSEDING_INFERENCE_RECEIPT_PREPARED",
   runId,
   supersedesRunId:PRIOR_RUN_ID,
   records:8,
   status:"AUTHORIZED_NO_INFERENCE",
   algorithmChanged:false,
   basicPitchInferenceExecutedByThisCommand:false,
   midiWrittenByThisCommand:false,
   finalHoldoutAccessedByThisCommand:false,
   batch131AccessedByThisCommand:false,
   trainingAuthorized:false,
   nextAction:"EXECUTE_SUPERSEDING_BASIC_PITCH_DEVELOPMENT_INFERENCE_APPEND_ONLY"
 };
}

function check(workspaceRoot,runId=DEFAULT_RUN_ID){
 const workspace=path.resolve(workspaceRoot),contract=validateContract(),root=newRoot(workspace),file=path.join(root,"execution-receipt.json");
 if(runId!==DEFAULT_RUN_ID||!fs.existsSync(file))throw new Error("Superseding Basic Pitch receipt missing");
 const r=readJson(file);
 if(r.schema!==SCHEMA||r.version!==2||r.status!=="AUTHORIZED_NO_INFERENCE"||r.runId!==DEFAULT_RUN_ID||r.executionContractSha256!==sha256File(CONTRACT_FILE)||r.receiptRunner?.gitBlobSha!==gitBlobSha(__filename)||r.supersedes?.runId!==PRIOR_RUN_ID||r.supersedes?.algorithmChanged!==false||JSON.stringify(r.inference)!==JSON.stringify(contract.inference)||!Array.isArray(r.sources)||r.sources.length!==8)throw new Error("Superseding Basic Pitch receipt invalid");
 for(const source of r.sources){const stem=resolveWithin(workspace,source.relativePath,"bass stem");if(!fs.existsSync(stem)||fs.statSync(stem).size!==source.bytes||sha256File(stem)!==source.sha256)throw new Error("Superseding receipt stem changed: "+source.sourceRecordId)}
 return{mode:"BASIC_PITCH_SUPERSEDING_INFERENCE_RECEIPT_CHECK",runId,status:r.status,records:8,algorithmChanged:false,nextAction:r.nextAction};
}

function main(args=process.argv.slice(2)){
 const[command,workspace,runId]=args;if(!command||!workspace)throw new Error("Usage: node basic-pitch-development-inference-v2.js <prepare|check> <workspace> [run-id]");
 const out=command==="prepare"?prepare(workspace,runId||DEFAULT_RUN_ID):command==="check"?check(workspace,runId||DEFAULT_RUN_ID):(()=>{throw new Error("Unknown command")})();
 process.stdout.write(JSON.stringify(out,null,2)+"\n");
}
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={prepare,check,validateContract,validatePriorAbortedState};
