"use strict";
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"audio-to-midi-p6-independent-evaluation-v1.json");
const REFERENCE_FILE=path.join(HERE,"audio-to-midi-p6-independent-evaluation-cohort-v1.json");
const SPLIT_FILE=path.join(HERE,"audio-to-midi-p6-independent-evaluation-split-v1.json");
const CONTRACT_FILE=path.join(HERE,"audio-to-midi-p6-independent-evaluation-reservation-contract-v1.json");
const SELECTOR_FILE=path.join(HERE,"prepare-audio-to-midi-p6-independent-evaluation.js");
const COHORT_ID="audio-to-midi-p6-independent-evaluation-v1";
const PLANNED_SPLIT="audio-to-midi-p6-evaluation-v1";
const REVIEW_ID="audio-to-midi-p6-independent-evaluation-v1-split-freeze";
const EXPECTED_FAMILIES=12;
const IDENTITY_FIELDS=["compositionFamilyId","sourceRecordId","sourceAssetId","sha256"];

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function stableJson(v){return JSON.stringify(v,null,2)+"\n"}
function sha256Text(v){return crypto.createHash("sha256").update(v).digest("hex")}
function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}
function identity(record){
  const out={};
  for(const field of IDENTITY_FIELDS){
    const value=record?.[field];
    if(typeof value!=="string"||!value.trim())throw new Error("Missing identity field "+field);
    out[field]=value;
  }
  if(!/^FAME\d{6,}$/.test(out.sourceRecordId)||!/^[a-f0-9]{64}$/.test(out.sha256)||out.sourceAssetId!=="sha256:"+out.sha256){
    throw new Error("Invalid frozen identity: "+out.sourceRecordId);
  }
  return out;
}
function identityDigest(records){
  const sorted=records.map(identity).sort((a,b)=>
    a.compositionFamilyId.localeCompare(b.compositionFamilyId)||
    a.sourceRecordId.localeCompare(b.sourceRecordId)||
    a.sourceAssetId.localeCompare(b.sourceAssetId)||
    a.sha256.localeCompare(b.sha256)
  );
  return sha256Text(stableJson(sorted));
}
function rankFor(record,seed){
  const id=identity(record);
  return sha256Text(seed+"|"+IDENTITY_FIELDS.map(k=>id[k]).join("|"));
}
function validateManifest(m){
  if(m?.schema!=="fame-owned-beats-workspace-v1"||m?.version!==1||!Array.isArray(m.records))throw new Error("Unsupported manifest schema");
  const ids=new Set(),hashes=new Set(),families=new Set();
  for(const r of m.records){
    const id=identity(r);
    if(ids.has(id.sourceRecordId)||hashes.has(id.sha256)||families.has(id.compositionFamilyId))throw new Error("Duplicate manifest identity");
    ids.add(id.sourceRecordId);hashes.add(id.sha256);families.add(id.compositionFamilyId);
    if(!Array.isArray(r.sourcePaths)||!r.roles)throw new Error("Invalid manifest record: "+id.sourceRecordId);
  }
  return m;
}
function csv(m){
  const roles=["drums","lowend","tonal","full"];
  const cols=["sourceRecordId","sourceAssetId","compositionFamilyId","familyStatus","sha256","localPath","sourcePaths","presentInScan","nativeExports","metadataStatus","taskAdmissibility","split","pilotCohorts","drums","lowend","tonal","full"];
  const q=v=>"\""+String(v??"").replace(/"/g,'""')+"\"";
  return [cols,...m.records.map(r=>[
    r.sourceRecordId,r.sourceAssetId,r.compositionFamilyId,r.familyStatus,r.sha256,r.localPath,
    (r.sourcePaths||[]).join(" | "),r.presentInScan,r.nativeExports,r.metadataStatus,r.taskAdmissibility,r.split,
    (r.pilotCohorts||[]).join(" | "),...roles.map(k=>r.roles?.[k]?.review)
  ])].map(row=>row.map(q).join(",")).join("\r\n")+"\r\n";
}
function atomic(file,content){
  const temp=file+"."+crypto.randomUUID()+".tmp";
  try{fs.writeFileSync(temp,content,{flag:"wx"});fs.renameSync(temp,file)}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
}
function validateFrozenFiles(){
  for(const f of [PROTOCOL_FILE,REFERENCE_FILE,SPLIT_FILE,CONTRACT_FILE,SELECTOR_FILE]){
    if(!fs.existsSync(f))throw new Error("Frozen P6 dependency missing: "+f);
  }
  const p=readJson(PROTOCOL_FILE),r=readJson(REFERENCE_FILE),s=readJson(SPLIT_FILE),c=readJson(CONTRACT_FILE);
  if(p.schema!=="fame-owned-beats-audio-to-midi-p6-independent-evaluation-protocol-v1"||
     p.version!==1||p.cohort?.cohortId!==COHORT_ID||p.cohort?.plannedSplit!==PLANNED_SPLIT||
     p.cohort?.expectedFamilies!==EXPECTED_FAMILIES||p.frozenPipeline?.drums?.armId!=="tsumugi-drums-v1_5"||
     p.frozenPipeline?.lowEnd?.armId!=="librosa-pyin-lowend-v1"||p.safety?.evaluationMayRetunePipeline!==false){
    throw new Error("Frozen P6 protocol mismatch");
  }
  if(r.schema!=="fame-owned-beats-audio-to-midi-p6-evaluation-cohort-reference-v1"||
     r.version!==1||r.cohortId!==COHORT_ID||r.status!=="FROZEN_FRESH_COHORT_BEFORE_AUDIO_ACCESS"||
     r.expectedFamilies!==EXPECTED_FAMILIES||r.plannedSplit!==PLANNED_SPLIT||
     !Array.isArray(r.records)||r.records.length!==EXPECTED_FAMILIES||
     r.cohortDigestSha256!==identityDigest(r.records)||
     r.safety?.audioFileOpenedBeforeFreeze!==false||r.safety?.audioFileHashedBeforeFreeze!==false){
    throw new Error("Frozen P6 cohort reference mismatch");
  }
  r.records.forEach((row,i)=>{
    if(row.selectionRank!==i+1||row.rankSha256!==rankFor(row,r.selection.seed))throw new Error("Frozen P6 selection rank mismatch: "+row.sourceRecordId);
  });
  const ids=r.records.map(x=>x.sourceRecordId),d=s.decisions?.[0];
  if(s.schema!=="fame-owned-beats-review-v1"||s.version!==1||s.reviewId!==REVIEW_ID||
     s.decisions?.length!==1||JSON.stringify(d?.sourceRecordIds)!==JSON.stringify(ids)||d?.set?.split!==PLANNED_SPLIT){
    throw new Error("Frozen P6 split decision mismatch");
  }
  if(c.schema!=="fame-owned-beats-audio-to-midi-p6-evaluation-reservation-contract-v1"||c.version!==1||
     c.status!=="FROZEN_BEFORE_P6_RESERVATION"||c.cohortId!==COHORT_ID||c.plannedSplit!==PLANNED_SPLIT||
     c.expectedFamilies!==EXPECTED_FAMILIES||
     c.files?.gateGitBlobSha!==gitBlobSha(__filename)||
     c.files?.protocolGitBlobSha!==gitBlobSha(PROTOCOL_FILE)||
     c.files?.referenceGitBlobSha!==gitBlobSha(REFERENCE_FILE)||
     c.files?.splitDecisionGitBlobSha!==gitBlobSha(SPLIT_FILE)||
     c.files?.selectorGitBlobSha!==gitBlobSha(SELECTOR_FILE)){
    throw new Error("Frozen P6 reservation contract mismatch");
  }
  return{p,r,s,c};
}
function receiptFile(workspace){return path.join(workspace,"runs","audio-to-midi-p6-independent-evaluation-usage",COHORT_ID+"-reservation.json")}
function buildContext(workspaceRoot){
  const workspace=path.resolve(workspaceRoot);
  if(!fs.existsSync(workspace)||!fs.statSync(workspace).isDirectory())throw new Error("Workspace missing: "+workspace);
  const frozen=validateFrozenFiles();
  const manifestFile=path.join(workspace,"manifest","owned-beats-manifest.json");
  if(!fs.existsSync(manifestFile))throw new Error("Owned-beats manifest missing");
  const manifest=validateManifest(readJson(manifestFile));
  if(manifest.records.length!==131||identityDigest(manifest.records)!==frozen.r.sourceManifest.identityDigestSha256){
    throw new Error("Manifest identity snapshot differs from frozen P6 source");
  }
  const byId=new Map(manifest.records.map(x=>[x.sourceRecordId,x]));
  const selected=frozen.r.records.map(expected=>{
    const record=byId.get(expected.sourceRecordId);
    if(!record)throw new Error("Frozen P6 record missing: "+expected.sourceRecordId);
    const actual=identity(record);
    for(const field of IDENTITY_FIELDS)if(actual[field]!==expected[field])throw new Error("Frozen identity mismatch "+field+": "+expected.sourceRecordId);
    if(record.presentInScan===false)throw new Error("Frozen P6 record not present in scan: "+expected.sourceRecordId);
    if(Array.isArray(record.pilotCohorts)&&record.pilotCohorts.length)throw new Error("Frozen P6 record entered pilot cohort: "+expected.sourceRecordId);
    if(record.qa&&typeof record.qa==="object"&&Object.keys(record.qa).length)throw new Error("Frozen P6 record gained QA evidence: "+expected.sourceRecordId);
    for(const role of ["drums","lowend","tonal","full"]){
      const state=record.roles?.[role];
      if(!state||state.processing!=="PENDING"||state.review!=="NOT_PROCESSED"||state.artifactId!==null)throw new Error("Frozen P6 record role state changed: "+expected.sourceRecordId+" "+role);
    }
    return record;
  });
  const selectedIds=new Set(selected.map(x=>x.sourceRecordId));
  const foreign=manifest.records.filter(r=>r.split===PLANNED_SPLIT&&!selectedIds.has(r.sourceRecordId));
  if(foreign.length)throw new Error("Foreign record already uses P6 split: "+foreign[0].sourceRecordId);
  const splitStates=new Set(selected.map(r=>r.split===undefined||r.split===null||String(r.split).trim()===""?"UNASSIGNED":String(r.split)));
  if(splitStates.size!==1)throw new Error("P6 cohort has mixed split state");
  const splitState=[...splitStates][0];
  if(splitState!=="UNASSIGNED"&&splitState!==PLANNED_SPLIT)throw new Error("P6 cohort has unexpected split: "+splitState);
  const rf=receiptFile(workspace);
  const receipt=fs.existsSync(rf)?readJson(rf):null;
  if(receipt){
    if(receipt.schema!=="fame-owned-beats-audio-to-midi-p6-evaluation-reservation-v1"||receipt.version!==1||
       receipt.cohortId!==COHORT_ID||receipt.status!=="RESERVED_BEFORE_P6_AUDIO_ACCESS"||
       receipt.cohortDigestSha256!==frozen.r.cohortDigestSha256||
       receipt.audioAccessPerformedByReservationCommand!==false||
       receipt.sourceSeparationExecutedByReservationCommand!==false||
       receipt.transcriptionExecutedByReservationCommand!==false){
      throw new Error("P6 reservation receipt mismatch");
    }
    if(splitState!==PLANNED_SPLIT)throw new Error("P6 reservation exists but split is not assigned");
  }
  const state=receipt?"RESERVED":splitState===PLANNED_SPLIT?"SPLIT_ASSIGNED_AWAITING_RECEIPT":"READY_TO_RESERVE";
  return{workspace,frozen,manifestFile,manifest,selected,rf,receipt,state};
}
function preflight(workspaceRoot){
  const ctx=buildContext(workspaceRoot);
  return{
    mode:"AUDIO_TO_MIDI_P6_RESERVATION_PREFLIGHT_PASS",cohortId:COHORT_ID,state:ctx.state,
    expectedFamilies:EXPECTED_FAMILIES,cohortDigestSha256:ctx.frozen.r.cohortDigestSha256,
    selectedSourceRecordIds:ctx.frozen.r.records.map(x=>x.sourceRecordId),
    manifestIdentitySnapshotMatches:true,
    audioFileOpenedByThisCommand:false,audioFileHashedByThisCommand:false,audioDecodedByThisCommand:false,
    sourceManifestMutatedByThisCommand:false,sourceSeparationExecutedByThisCommand:false,
    transcriptionExecutedByThisCommand:false,batch131Authorized:false,trainingAuthorized:false,
    nextAction:ctx.state==="READY_TO_RESERVE"?"RESERVE_P6_COHORT_BEFORE_ANY_AUDIO_ACCESS":
      ctx.state==="SPLIT_ASSIGNED_AWAITING_RECEIPT"?"RECOVER_P6_RESERVATION_RECEIPT":"P6_COHORT_ALREADY_RESERVED"
  };
}
function reserve(workspaceRoot){
  let ctx=buildContext(workspaceRoot);
  if(ctx.state==="RESERVED")return{
    mode:"AUDIO_TO_MIDI_P6_RESERVED",cohortId:COHORT_ID,status:"RESERVED_BEFORE_P6_AUDIO_ACCESS",
    alreadyReserved:true,reservationFile:ctx.rf,audioFileOpenedByThisCommand:false,
    sourceSeparationExecutedByThisCommand:false,transcriptionExecutedByThisCommand:false,
    batch131Authorized:false,trainingAuthorized:false,nextAction:"PREPARE_P6_FROZEN_EXECUTION"
  };
  if(ctx.state==="READY_TO_RESERVE"){
    const lock=path.join(ctx.workspace,"bootstrap.lock");let fd;
    try{
      fd=fs.openSync(lock,"wx");
      fs.writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString(),operation:"p6-reservation"}));
      const fresh=buildContext(ctx.workspace);
      if(fresh.state!=="READY_TO_RESERVE")throw new Error("P6 reservation state changed under lock: "+fresh.state);
      const m=JSON.parse(JSON.stringify(fresh.manifest));
      const ids=new Set(fresh.frozen.r.records.map(x=>x.sourceRecordId));
      for(const r of m.records)if(ids.has(r.sourceRecordId))r.split=PLANNED_SPLIT;
      m.reviewLog ||= [];
      if(!m.reviewLog.some(x=>x.reviewId===REVIEW_ID)){
        m.reviewLog.push({reviewId:REVIEW_ID,decisionDigestSha256:sha256Text(fs.readFileSync(SPLIT_FILE)),appliedAt:new Date().toISOString(),sourceFile:path.basename(SPLIT_FILE)});
      }
      validateManifest(m);
      atomic(path.join(ctx.workspace,"manifest","owned-beats-manifest.csv"),csv(m));
      atomic(fresh.manifestFile,stableJson(m));
    }finally{
      if(fd!==undefined){fs.closeSync(fd);if(fs.existsSync(lock))fs.unlinkSync(lock)}
    }
    ctx=buildContext(ctx.workspace);
    if(ctx.state!=="SPLIT_ASSIGNED_AWAITING_RECEIPT")throw new Error("P6 split assignment did not reach recovery state");
  }
  if(ctx.state!=="SPLIT_ASSIGNED_AWAITING_RECEIPT")throw new Error("Cannot write P6 reservation receipt from "+ctx.state);
  const receipt={
    schema:"fame-owned-beats-audio-to-midi-p6-evaluation-reservation-v1",version:1,
    cohortId:COHORT_ID,status:"RESERVED_BEFORE_P6_AUDIO_ACCESS",plannedSplit:PLANNED_SPLIT,
    expectedFamilies:EXPECTED_FAMILIES,cohortDigestSha256:ctx.frozen.r.cohortDigestSha256,
    sourceManifestIdentityDigestSha256:ctx.frozen.r.sourceManifest.identityDigestSha256,
    selectedSourceRecordIds:ctx.frozen.r.records.map(x=>x.sourceRecordId),
    reservedAt:new Date().toISOString(),
    audioAccessPerformedByReservationCommand:false,audioDecodedByReservationCommand:false,
    sourceSeparationExecutedByReservationCommand:false,transcriptionExecutedByReservationCommand:false,
    batch131Authorized:false,trainingAuthorized:false,taskDataReadyMayBeDeclared:false
  };
  fs.mkdirSync(path.dirname(ctx.rf),{recursive:true});
  atomic(ctx.rf,stableJson(receipt));
  ctx=buildContext(ctx.workspace);
  if(ctx.state!=="RESERVED")throw new Error("P6 reservation post-write check failed");
  return{
    mode:"AUDIO_TO_MIDI_P6_RESERVED",cohortId:COHORT_ID,status:"RESERVED_BEFORE_P6_AUDIO_ACCESS",
    alreadyReserved:false,reservationFile:ctx.rf,
    selectedSourceRecordIds:ctx.frozen.r.records.map(x=>x.sourceRecordId),
    sourceManifestMutatedByThisCommand:true,splitAssignmentsChangedByThisCommand:true,
    audioFileOpenedByThisCommand:false,audioDecodedByThisCommand:false,
    sourceSeparationExecutedByThisCommand:false,transcriptionExecutedByThisCommand:false,
    batch131Authorized:false,trainingAuthorized:false,taskDataReadyMayBeDeclared:false,
    nextAction:"PREPARE_P6_FROZEN_EXECUTION"
  };
}
function check(workspaceRoot){
  const ctx=buildContext(workspaceRoot);
  if(ctx.state!=="RESERVED")throw new Error("P6 cohort is not fully reserved: "+ctx.state);
  return{
    mode:"AUDIO_TO_MIDI_P6_RESERVATION_CHECK_PASS",cohortId:COHORT_ID,status:"RESERVED_BEFORE_P6_AUDIO_ACCESS",
    expectedFamilies:EXPECTED_FAMILIES,cohortDigestSha256:ctx.frozen.r.cohortDigestSha256,
    selectedSourceRecordIds:ctx.frozen.r.records.map(x=>x.sourceRecordId),
    allSelectedRecordsUsePlannedSplit:true,foreignRecordsUsingPlannedSplit:0,
    audioFileOpenedByThisCommand:false,audioDecodedByThisCommand:false,
    sourceSeparationExecutedByThisCommand:false,transcriptionExecutedByThisCommand:false,
    batch131Authorized:false,trainingAuthorized:false,taskDataReadyMayBeDeclared:false,
    nextAction:"PREPARE_P6_FROZEN_EXECUTION"
  };
}
function selfTest(){
  const frozen=validateFrozenFiles();
  if(frozen.r.records.length!==12||frozen.r.selection.eligibleFamilyCount!==91||
     frozen.r.cohortDigestSha256!=="3a4595b7bb7e1edc61fdf5ba45557d13949f7cb7c1233daa58ae2b273bfa0188"){
    throw new Error("P6 reservation frozen self-test mismatch");
  }
  return{mode:"AUDIO_TO_MIDI_P6_RESERVATION_GATE_SELF_TEST_PASS",expectedFamilies:12,eligibleFamiliesAtSelection:91,audioFileOpenedByThisCommand:false,audioFileHashedByThisCommand:false};
}
function main(args=process.argv.slice(2)){
  const[command,workspace]=args;let out;
  if(command==="self-test")out=selfTest();
  else{
    if(!workspace)throw new Error("Workspace required");
    if(command==="preflight")out=preflight(workspace);
    else if(command==="reserve")out=reserve(workspace);
    else if(command==="check")out=check(workspace);
    else throw new Error("Usage: node audio-to-midi-p6-independent-evaluation-gate.js <self-test|preflight|reserve|check> [workspace]");
  }
  process.stdout.write(stableJson(out));
}
if(require.main===module){try{main()}catch(error){console.error("AUDIO TO MIDI P6 RESERVATION FAILED: "+error.message);process.exitCode=1}}
module.exports={validateFrozenFiles,buildContext,preflight,reserve,check,selfTest};
