"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const {validate:validateWorkspaceManifest}=require("./bootstrap");
const {review}=require("./review-decisions");
const selector=require("./prepare-audio-to-midi-independent-evaluation.js");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"audio-to-midi-independent-evaluation-v1.json");
const REFERENCE_FILE=path.join(HERE,"audio-to-midi-independent-evaluation-cohort-v1.json");
const SPLIT_DECISION_FILE=path.join(HERE,"audio-to-midi-independent-evaluation-split-v1.json");
const CONTRACT_FILE=path.join(HERE,"audio-to-midi-independent-evaluation-reservation-contract-v1.json");
const COHORT_ID="audio-to-midi-independent-evaluation-v1";
const PLANNED_SPLIT="audio-to-midi-evaluation-v1";
const EXPECTED_FAMILIES=12;

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function stableJson(value){return JSON.stringify(value,null,2)+"\n"}
function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}
function atomicNew(file,content){
  const temp=file+"."+crypto.randomUUID()+".tmp";
  try{
    fs.writeFileSync(temp,content,{flag:"wx"});
    fs.renameSync(temp,file);
  }finally{
    if(fs.existsSync(temp))fs.unlinkSync(temp);
  }
}
function sameRecords(a,b){
  return JSON.stringify(a)===JSON.stringify(b);
}
function validateFrozenFiles(){
  const contract=readJson(CONTRACT_FILE);
  const protocol=readJson(PROTOCOL_FILE);
  const reference=readJson(REFERENCE_FILE);
  const splitDecision=readJson(SPLIT_DECISION_FILE);

  if(
    contract.schema!=="fame-owned-beats-audio-to-midi-evaluation-reservation-contract-v1"||
    contract.version!==1||
    contract.status!=="FROZEN_BEFORE_EVALUATION_RESERVATION"||
    contract.cohortId!==COHORT_ID||
    contract.plannedSplit!==PLANNED_SPLIT||
    contract.expectedFamilies!==EXPECTED_FAMILIES||
    contract.files?.gatePath!==path.basename(__filename)||
    contract.files?.gateGitBlobSha!==gitBlobSha(__filename)||
    contract.files?.protocolGitBlobSha!==gitBlobSha(PROTOCOL_FILE)||
    contract.files?.referenceGitBlobSha!==gitBlobSha(REFERENCE_FILE)||
    contract.files?.splitDecisionGitBlobSha!==gitBlobSha(SPLIT_DECISION_FILE)||
    contract.files?.selectorGitBlobSha!==gitBlobSha(path.join(HERE,"prepare-audio-to-midi-independent-evaluation.js"))
  ) throw new Error("Audio→MIDI evaluation reservation contract mismatch");

  if(
    protocol.schema!=="fame-owned-beats-audio-to-midi-independent-evaluation-protocol-v1"||
    protocol.version!==1||
    protocol.status!=="FROZEN_BEFORE_FRESH_COHORT_SELECTION"||
    protocol.cohort?.cohortId!==COHORT_ID||
    protocol.cohort?.plannedSplit!==PLANNED_SPLIT||
    protocol.cohort?.expectedFamilies!==EXPECTED_FAMILIES||
    protocol.safety?.cohortSelectionMayOpenAudio!==false||
    protocol.safety?.evaluationMayRetunePipeline!==false||
    protocol.safety?.batch131Authorized!==false||
    protocol.safety?.trainingAuthorized!==false
  ) throw new Error("Frozen Audio→MIDI evaluation protocol mismatch");

  if(
    reference.schema!=="fame-owned-beats-audio-to-midi-evaluation-cohort-reference-v1"||
    reference.version!==1||
    reference.cohortId!==COHORT_ID||
    reference.status!=="FROZEN_FRESH_COHORT_BEFORE_AUDIO_ACCESS"||
    reference.expectedFamilies!==EXPECTED_FAMILIES||
    reference.plannedSplit!==PLANNED_SPLIT||
    !Array.isArray(reference.records)||
    reference.records.length!==EXPECTED_FAMILIES||
    reference.selection?.usesAudioContentOrDerivedMetrics!==false||
    reference.cohortDigestSha256!==selector.identityDigest(reference.records)||
    reference.safety?.audioFileOpenedBeforeFreeze!==false||
    reference.safety?.audioFileHashedBeforeFreeze!==false||
    reference.safety?.audioDecodedBeforeFreeze!==false||
    reference.safety?.derivedAudioMetricsUsedForSelection!==false
  ) throw new Error("Frozen Audio→MIDI evaluation cohort reference mismatch");

  reference.records.forEach((row,index)=>{
    if(row.selectionRank!==index+1)throw new Error("Frozen cohort rank mismatch: "+row.sourceRecordId);
    if(row.rankSha256!==selector.rankFor(row,reference.selection.seed))throw new Error("Frozen cohort rank hash mismatch: "+row.sourceRecordId);
  });

  const ids=reference.records.map(x=>x.sourceRecordId);
  const decision=splitDecision.decisions?.[0];
  if(
    splitDecision.schema!=="fame-owned-beats-review-v1"||
    splitDecision.version!==1||
    splitDecision.reviewId!=="audio-to-midi-independent-evaluation-v1-split-freeze"||
    splitDecision.decisions?.length!==1||
    !decision||
    JSON.stringify(decision.sourceRecordIds)!==JSON.stringify(ids)||
    decision.set?.split!==PLANNED_SPLIT
  ) throw new Error("Frozen Audio→MIDI evaluation split decision mismatch");

  return{contract,protocol,reference,splitDecision};
}
function localPreparationFile(workspace){
  return path.join(
    workspace,
    "runs",
    "audio-to-midi-independent-evaluation-preparation",
    COHORT_ID,
    "cohort-reference.json"
  );
}
function reservationFile(workspace){
  return path.join(
    workspace,
    "runs",
    "audio-to-midi-independent-evaluation-usage",
    COHORT_ID+"-reservation.json"
  );
}
function validateReservation(receipt,frozen){
  if(
    receipt.schema!=="fame-owned-beats-audio-to-midi-evaluation-reservation-v1"||
    receipt.version!==1||
    receipt.cohortId!==COHORT_ID||
    receipt.status!=="RESERVED_BEFORE_AUDIO_ACCESS"||
    receipt.plannedSplit!==PLANNED_SPLIT||
    receipt.expectedFamilies!==EXPECTED_FAMILIES||
    receipt.cohortDigestSha256!==frozen.reference.cohortDigestSha256||
    receipt.cohortReferenceGitBlobSha!==frozen.contract.files.referenceGitBlobSha||
    receipt.protocolGitBlobSha!==frozen.contract.files.protocolGitBlobSha||
    receipt.splitDecisionGitBlobSha!==frozen.contract.files.splitDecisionGitBlobSha||
    receipt.audioAccessPerformedByReservationCommand!==false||
    receipt.audioDecodedByReservationCommand!==false||
    receipt.sourceSeparationExecutedByReservationCommand!==false||
    receipt.transcriptionExecutedByReservationCommand!==false||
    receipt.batch131Authorized!==false||
    receipt.trainingAuthorized!==false||
    receipt.taskDataReadyMayBeDeclared!==false
  ) throw new Error("Audio→MIDI evaluation reservation receipt mismatch");
  return receipt;
}
function buildContext(workspaceRoot){
  const workspace=path.resolve(workspaceRoot);
  if(!fs.existsSync(workspace)||!fs.statSync(workspace).isDirectory())throw new Error("Workspace missing: "+workspace);
  const frozen=validateFrozenFiles();

  const manifestFile=path.join(workspace,"manifest","owned-beats-manifest.json");
  if(!fs.existsSync(manifestFile))throw new Error("Owned-beats manifest missing");
  const manifest=validateWorkspaceManifest(readJson(manifestFile));
  if(
    manifest.records.length!==131||
    selector.identityDigest(manifest.records)!==frozen.reference.sourceManifest.identityDigestSha256
  ) throw new Error("Owned-beats manifest identity snapshot differs from frozen cohort source");

  const prepFile=localPreparationFile(workspace);
  if(!fs.existsSync(prepFile))throw new Error("Local metadata-only cohort preparation missing");
  const local=readJson(prepFile);
  if(
    local.cohortId!==COHORT_ID||
    local.cohortDigestSha256!==frozen.reference.cohortDigestSha256||
    local.selection?.eligibleFamilyCount!==frozen.reference.selection.eligibleFamilyCount||
    local.selection?.eligibleUniverseDigestSha256!==frozen.reference.selection.eligibleUniverseDigestSha256||
    local.sourceManifest?.identityDigestSha256!==frozen.reference.sourceManifest.identityDigestSha256||
    !sameRecords(local.records,frozen.reference.records)
  ) throw new Error("Local prepared cohort differs from committed frozen reference");

  const byId=new Map(manifest.records.map(r=>[r.sourceRecordId,r]));
  const selectedIds=new Set(frozen.reference.records.map(r=>r.sourceRecordId));
  const selected=[];
  for(const expected of frozen.reference.records){
    const record=byId.get(expected.sourceRecordId);
    if(!record)throw new Error("Frozen evaluation record missing from manifest: "+expected.sourceRecordId);
    const actual=selector.identity(record);
    for(const field of frozen.reference.identityFields){
      if(actual[field]!==expected[field])throw new Error("Frozen identity mismatch "+field+": "+expected.sourceRecordId);
    }
    selected.push(record);
  }

  const foreignPlanned=manifest.records.filter(r=>r.split===PLANNED_SPLIT&&!selectedIds.has(r.sourceRecordId));
  if(foreignPlanned.length)throw new Error("Unexpected record already uses evaluation split: "+foreignPlanned[0].sourceRecordId);

  const splitStates=new Set(selected.map(r=>{
    const value=r.split;
    return value===undefined||value===null||String(value).trim()===""?"UNASSIGNED":String(value);
  }));
  if(splitStates.size!==1)throw new Error("Frozen evaluation cohort has mixed split state");
  const only=[...splitStates][0];
  if(only!=="UNASSIGNED"&&only!==PLANNED_SPLIT)throw new Error("Frozen evaluation cohort has unexpected split: "+only);

  const receiptFile=reservationFile(workspace);
  let receipt=null;
  if(fs.existsSync(receiptFile))receipt=validateReservation(readJson(receiptFile),frozen);

  let state;
  if(receipt){
    if(only!==PLANNED_SPLIT)throw new Error("Reservation exists but cohort split is not assigned");
    state="RESERVED";
  }else if(only===PLANNED_SPLIT){
    state="SPLIT_ASSIGNED_AWAITING_RESERVATION_RECEIPT";
  }else{
    state="READY_TO_RESERVE";
  }

  return{workspace,frozen,manifestFile,manifest,prepFile,selected,receiptFile,receipt,state};
}
function preflight(workspaceRoot){
  const ctx=buildContext(workspaceRoot);
  return{
    mode:"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_PREFLIGHT_PASS",
    cohortId:COHORT_ID,
    state:ctx.state,
    expectedFamilies:EXPECTED_FAMILIES,
    eligibleFamilyCount:ctx.frozen.reference.selection.eligibleFamilyCount,
    cohortDigestSha256:ctx.frozen.reference.cohortDigestSha256,
    selectedSourceRecordIds:ctx.frozen.reference.records.map(x=>x.sourceRecordId),
    localPreparationMatchesFrozenReference:true,
    manifestIdentitySnapshotMatches:true,
    audioFileOpenedByThisCommand:false,
    audioFileHashedByThisCommand:false,
    audioDecodedByThisCommand:false,
    sourceSeparationExecutedByThisCommand:false,
    transcriptionExecutedByThisCommand:false,
    sourceManifestMutatedByThisCommand:false,
    batch131Authorized:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false,
    nextAction:ctx.state==="READY_TO_RESERVE"?"RESERVE_COHORT_BEFORE_ANY_AUDIO_ACCESS":
      ctx.state==="SPLIT_ASSIGNED_AWAITING_RESERVATION_RECEIPT"?"RECOVER_RESERVATION_RECEIPT":
      "COHORT_ALREADY_RESERVED"
  };
}
function reserve(workspaceRoot){
  let ctx=buildContext(workspaceRoot);
  if(ctx.state==="RESERVED"){
    return{
      mode:"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_RESERVED",
      cohortId:COHORT_ID,
      status:"RESERVED_BEFORE_AUDIO_ACCESS",
      expectedFamilies:EXPECTED_FAMILIES,
      cohortDigestSha256:ctx.frozen.reference.cohortDigestSha256,
      alreadyReserved:true,
      reservationFile:ctx.receiptFile,
      audioFileOpenedByThisCommand:false,
      audioDecodedByThisCommand:false,
      sourceSeparationExecutedByThisCommand:false,
      transcriptionExecutedByThisCommand:false,
      batch131Authorized:false,
      trainingAuthorized:false,
      taskDataReadyMayBeDeclared:false,
      nextAction:"PREPARE_FROZEN_EVALUATION_EXECUTION_NO_RETUNING"
    };
  }

  if(ctx.state==="READY_TO_RESERVE"){
    const applied=review(ctx.workspace,SPLIT_DECISION_FILE,true);
    if(applied.reviewId!=="audio-to-midi-independent-evaluation-v1-split-freeze")throw new Error("Unexpected split review result");
    ctx=buildContext(ctx.workspace);
    if(ctx.state!=="SPLIT_ASSIGNED_AWAITING_RESERVATION_RECEIPT")throw new Error("Evaluation split assignment did not reach expected state");
  }

  if(ctx.state!=="SPLIT_ASSIGNED_AWAITING_RESERVATION_RECEIPT")throw new Error("Evaluation cohort cannot be reserved from state "+ctx.state);

  const receipt={
    schema:"fame-owned-beats-audio-to-midi-evaluation-reservation-v1",
    version:1,
    cohortId:COHORT_ID,
    status:"RESERVED_BEFORE_AUDIO_ACCESS",
    plannedSplit:PLANNED_SPLIT,
    expectedFamilies:EXPECTED_FAMILIES,
    cohortDigestSha256:ctx.frozen.reference.cohortDigestSha256,
    cohortReferenceGitBlobSha:ctx.frozen.contract.files.referenceGitBlobSha,
    protocolGitBlobSha:ctx.frozen.contract.files.protocolGitBlobSha,
    splitDecisionGitBlobSha:ctx.frozen.contract.files.splitDecisionGitBlobSha,
    selectorGitBlobSha:ctx.frozen.contract.files.selectorGitBlobSha,
    gateGitBlobSha:ctx.frozen.contract.files.gateGitBlobSha,
    sourceManifestIdentityDigestSha256:ctx.frozen.reference.sourceManifest.identityDigestSha256,
    selectedSourceRecordIds:ctx.frozen.reference.records.map(x=>x.sourceRecordId),
    splitAssignmentReviewId:"audio-to-midi-independent-evaluation-v1-split-freeze",
    reservedAt:new Date().toISOString(),
    audioAccessPerformedByReservationCommand:false,
    audioDecodedByReservationCommand:false,
    sourceSeparationExecutedByReservationCommand:false,
    transcriptionExecutedByReservationCommand:false,
    batch131Authorized:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false
  };
  fs.mkdirSync(path.dirname(ctx.receiptFile),{recursive:true});
  atomicNew(ctx.receiptFile,stableJson(receipt));
  ctx=buildContext(ctx.workspace);
  if(ctx.state!=="RESERVED")throw new Error("Reservation receipt failed post-write verification");

  return{
    mode:"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_RESERVED",
    cohortId:COHORT_ID,
    status:"RESERVED_BEFORE_AUDIO_ACCESS",
    expectedFamilies:EXPECTED_FAMILIES,
    cohortDigestSha256:ctx.frozen.reference.cohortDigestSha256,
    alreadyReserved:false,
    reservationFile:ctx.receiptFile,
    selectedSourceRecordIds:ctx.frozen.reference.records.map(x=>x.sourceRecordId),
    sourceManifestMutatedByThisCommand:true,
    splitAssignmentsChangedByThisCommand:true,
    audioFileOpenedByThisCommand:false,
    audioDecodedByThisCommand:false,
    sourceSeparationExecutedByThisCommand:false,
    transcriptionExecutedByThisCommand:false,
    batch131Authorized:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false,
    nextAction:"PREPARE_FROZEN_EVALUATION_EXECUTION_NO_RETUNING"
  };
}
function check(workspaceRoot){
  const ctx=buildContext(workspaceRoot);
  if(ctx.state!=="RESERVED")throw new Error("Evaluation cohort is not fully reserved: "+ctx.state);
  return{
    mode:"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_RESERVATION_CHECK_PASS",
    cohortId:COHORT_ID,
    status:"RESERVED_BEFORE_AUDIO_ACCESS",
    expectedFamilies:EXPECTED_FAMILIES,
    cohortDigestSha256:ctx.frozen.reference.cohortDigestSha256,
    selectedSourceRecordIds:ctx.frozen.reference.records.map(x=>x.sourceRecordId),
    allSelectedRecordsUsePlannedSplit:true,
    foreignRecordsUsingPlannedSplit:0,
    audioFileOpenedByThisCommand:false,
    audioDecodedByThisCommand:false,
    sourceSeparationExecutedByThisCommand:false,
    transcriptionExecutedByThisCommand:false,
    batch131Authorized:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false,
    nextAction:"PREPARE_FROZEN_EVALUATION_EXECUTION_NO_RETUNING"
  };
}
function selfTest(){
  const frozen=validateFrozenFiles();
  if(frozen.reference.records.length!==12)throw new Error("Frozen evaluation cohort self-test family count failed");
  if(frozen.reference.selection.eligibleFamilyCount!==103)throw new Error("Frozen evaluation eligible count self-test failed");
  if(frozen.reference.cohortDigestSha256!=="287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788")throw new Error("Frozen evaluation digest self-test failed");
  return{
    mode:"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_GATE_SELF_TEST_PASS",
    expectedFamilies:12,
    eligibleFamiliesAtSelection:103,
    audioFileOpenedByThisCommand:false,
    audioFileHashedByThisCommand:false
  };
}
function main(args=process.argv.slice(2)){
  const[command,workspace]=args;let out;
  if(command==="self-test")out=selfTest();
  else{
    if(!workspace)throw new Error("Usage: node audio-to-midi-independent-evaluation-gate.js <preflight|reserve|check> <workspace>");
    if(command==="preflight")out=preflight(workspace);
    else if(command==="reserve")out=reserve(workspace);
    else if(command==="check")out=check(workspace);
    else throw new Error("Unknown command");
  }
  process.stdout.write(stableJson(out));
}
if(require.main===module){try{main()}catch(error){console.error("AUDIO TO MIDI INDEPENDENT EVALUATION GATE FAILED: "+error.message);process.exitCode=1}}
module.exports={validateFrozenFiles,buildContext,preflight,reserve,check,selfTest};
