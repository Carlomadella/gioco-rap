"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const {validate:validateWorkspaceManifest}=require("./bootstrap");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"audio-to-midi-p6-independent-evaluation-v1.json");
const DEVELOPMENT_PROTOCOL_FILE=path.join(HERE,"audio-to-midi-development-protocol-v1.json");
const AUDIO_ANALYSIS_HOLDOUT_FILE=path.join(HERE,"audio-analysis-holdout-cohort-r1-v2.json");
const PRIOR_AUDIO_TO_MIDI_EVAL_FILE=path.join(HERE,"audio-to-midi-independent-evaluation-cohort-v1.json");
const COHORT_ID="audio-to-midi-p6-independent-evaluation-v1";
const IDENTITY_FIELDS=["compositionFamilyId","sourceRecordId","sourceAssetId","sha256"];

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function stableJson(value){return JSON.stringify(value,null,2)+"\n"}
function sha256Text(value){return crypto.createHash("sha256").update(value).digest("hex")}
function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}
function identity(record){
  const out={};
  for(const field of IDENTITY_FIELDS){
    const value=record?.[field];
    if(typeof value!=="string"||!value.trim())throw new Error("Missing identity field "+field+" for "+(record?.sourceRecordId||"record"));
    out[field]=value;
  }
  if(!/^FAME\d{6,}$/.test(out.sourceRecordId))throw new Error("Invalid sourceRecordId: "+out.sourceRecordId);
  if(!/^[a-f0-9]{64}$/.test(out.sha256))throw new Error("Invalid sha256: "+out.sourceRecordId);
  if(out.sourceAssetId!=="sha256:"+out.sha256)throw new Error("sourceAssetId/sha256 mismatch: "+out.sourceRecordId);
  return out;
}
function sortedIdentities(records){
  return records.map(identity).sort((a,b)=>
    a.compositionFamilyId.localeCompare(b.compositionFamilyId)||
    a.sourceRecordId.localeCompare(b.sourceRecordId)||
    a.sourceAssetId.localeCompare(b.sourceAssetId)||
    a.sha256.localeCompare(b.sha256)
  );
}
function identityDigest(records){return sha256Text(stableJson(sortedIdentities(records)))}
function validateProtocol(){
  const p=readJson(PROTOCOL_FILE);
  if(
    p.schema!=="fame-owned-beats-audio-to-midi-p6-independent-evaluation-protocol-v1"||
    p.version!==1||
    p.status!=="FROZEN_BEFORE_P6_FRESH_COHORT_SELECTION"||
    p.sourceCorpus?.expectedRecords!==131||
    p.sourceCorpus?.expectedCompositionFamilies!==131||
    p.cohort?.cohortId!==COHORT_ID||
    p.cohort?.plannedSplit!=="audio-to-midi-p6-evaluation-v1"||
    p.cohort?.expectedFamilies!==12||
    p.cohort?.selection?.algorithm!=="opaque-identity-sha256-rank-v1"||
    p.cohort?.selection?.usesAudioContentOrDerivedMetrics!==false||
    JSON.stringify(p.cohort?.selection?.identityFields)!==JSON.stringify(IDENTITY_FIELDS)||
    p.frozenPipeline?.drums?.armId!=="tsumugi-drums-v1_5"||
    p.frozenPipeline?.lowEnd?.armId!=="librosa-pyin-lowend-v1"||
    p.gate?.technical!=="ALL_12_FAMILIES_PASS"||
    p.gate?.drums?.medianUsefulnessAtLeast!==2||
    p.gate?.drums?.familiesAtOrAbove2AtLeast!==9||
    p.gate?.lowEnd?.medianUsefulnessAtLeast!==2||
    p.gate?.lowEnd?.familiesAtOrAbove2AtLeast!==9||
    p.safety?.cohortSelectionMayOpenAudio!==false||
    p.safety?.cohortSelectionMayHashAudio!==false||
    p.safety?.evaluationMayRetunePipeline!==false||
    p.safety?.batch131Authorized!==false||
    p.safety?.trainingAuthorized!==false||
    p.implementation?.selectorPath!==path.basename(__filename)||
    p.implementation?.selectorGitBlobSha!==gitBlobSha(__filename)
  ) throw new Error("P6 independent evaluation protocol mismatch");
  return p;
}
function validateGlobalIdentityIntegrity(manifest,p){
  if(manifest.records.length!==p.sourceCorpus.expectedRecords)throw new Error("Owned-beats record count mismatch");
  const seen={compositionFamilyId:new Set(),sourceRecordId:new Set(),sourceAssetId:new Set(),sha256:new Set()};
  for(const record of manifest.records){
    const id=identity(record);
    for(const field of Object.keys(seen)){
      if(seen[field].has(id[field]))throw new Error("Duplicate manifest "+field+": "+id[field]);
      seen[field].add(id[field]);
    }
  }
  if(seen.compositionFamilyId.size!==p.sourceCorpus.expectedCompositionFamilies)throw new Error("Composition-family count mismatch");
}
function untouchedForP6(record){
  if(record.presentInScan===false)return false;
  if(record.split!==undefined&&record.split!==null&&String(record.split).trim()!=="")return false;
  if(Array.isArray(record.pilotCohorts)&&record.pilotCohorts.length)return false;
  if(record.qa&&typeof record.qa==="object"&&Object.keys(record.qa).length)return false;
  const roles=record.roles||{};
  for(const role of ["drums","lowend","tonal","full"]){
    const state=roles[role];
    if(!state||state.processing!=="PENDING"||state.review!=="NOT_PROCESSED"||state.artifactId!==null)return false;
  }
  return true;
}
function priorExcludedIdentities(){
  const dev=readJson(DEVELOPMENT_PROTOCOL_FILE);
  const hold=readJson(AUDIO_ANALYSIS_HOLDOUT_FILE);
  const priorEval=readJson(PRIOR_AUDIO_TO_MIDI_EVAL_FILE);
  const sourceIds=new Set(dev.sourceSeparation?.expectedSourceRecordIds||[]);
  const familyIds=new Set();
  for(const group of [hold.records||[],priorEval.records||[]]){
    for(const row of group){
      sourceIds.add(row.sourceRecordId);
      if(row.compositionFamilyId)familyIds.add(row.compositionFamilyId);
    }
  }
  return{sourceIds,familyIds};
}
function rankFor(record,seed){
  const id=identity(record);
  return sha256Text(seed+"|"+IDENTITY_FIELDS.map(k=>id[k]).join("|"));
}
function select(manifest,p){
  validateWorkspaceManifest(manifest);
  validateGlobalIdentityIntegrity(manifest,p);
  const excluded=priorExcludedIdentities();
  const eligible=manifest.records.filter(record=>{
    const id=identity(record);
    return untouchedForP6(record)&&!excluded.sourceIds.has(id.sourceRecordId)&&!excluded.familyIds.has(id.compositionFamilyId);
  });
  if(eligible.length<p.cohort.expectedFamilies)throw new Error("Insufficient fresh untouched P6 families: "+eligible.length);
  const ranked=eligible.map(record=>({record,rankSha256:rankFor(record,p.cohort.selection.seed)}))
    .sort((a,b)=>a.rankSha256.localeCompare(b.rankSha256)||a.record.sourceRecordId.localeCompare(b.record.sourceRecordId));
  const chosen=ranked.slice(0,p.cohort.expectedFamilies).map((item,index)=>({
    ...identity(item.record),selectionRank:index+1,rankSha256:item.rankSha256
  }));
  return{
    eligible,chosen,
    eligibleUniverseDigestSha256:identityDigest(eligible),
    cohortDigestSha256:identityDigest(chosen)
  };
}
function referenceFrom(manifest,p,selection){
  return{
    schema:"fame-owned-beats-audio-to-midi-p6-evaluation-cohort-reference-v1",
    version:1,cohortId:p.cohort.cohortId,
    status:"SELECTED_METADATA_ONLY_AWAITING_REPO_FREEZE",
    purpose:p.purpose,createdAt:new Date().toISOString(),
    expectedFamilies:p.cohort.expectedFamilies,plannedSplit:p.cohort.plannedSplit,
    identityFields:IDENTITY_FIELDS,
    selection:{
      algorithm:p.cohort.selection.algorithm,seed:p.cohort.selection.seed,
      usesAudioContentOrDerivedMetrics:false,
      eligibleFamilyCount:selection.eligible.length,
      eligibleUniverseDigestSha256:selection.eligibleUniverseDigestSha256
    },
    sourceManifest:{
      schema:manifest.schema,version:manifest.version,recordCount:manifest.records.length,
      identityDigestSha256:identityDigest(manifest.records)
    },
    cohortDigestSha256:selection.cohortDigestSha256,
    records:selection.chosen,
    safety:{
      audioFileOpenedByThisCommand:false,audioFileHashedByThisCommand:false,
      audioDecodedByThisCommand:false,derivedAudioMetricsReadByThisCommand:false,
      sourceManifestMutated:false,splitAssignmentsChanged:false,
      batch131Authorized:false,trainingAuthorized:false,taskDataReadyMayBeDeclared:false
    }
  };
}
function loadManifest(workspace){
  const file=path.join(path.resolve(workspace),"manifest","owned-beats-manifest.json");
  if(!fs.existsSync(file))throw new Error("Owned-beats manifest missing: "+file);
  return{file,manifest:readJson(file)};
}
function preview(workspace){
  const p=validateProtocol(),{manifest}=loadManifest(workspace),selection=select(manifest,p),reference=referenceFrom(manifest,p,selection);
  return{
    mode:"AUDIO_TO_MIDI_P6_COHORT_PREVIEW",cohortId:reference.cohortId,status:reference.status,
    expectedFamilies:reference.expectedFamilies,eligibleFamilyCount:reference.selection.eligibleFamilyCount,
    eligibleUniverseDigestSha256:reference.selection.eligibleUniverseDigestSha256,
    sourceManifestIdentityDigestSha256:reference.sourceManifest.identityDigestSha256,
    cohortDigestSha256:reference.cohortDigestSha256,selectedRecords:reference.records,
    audioFileOpenedByThisCommand:false,audioFileHashedByThisCommand:false,audioDecodedByThisCommand:false,
    sourceManifestMutated:false,splitAssignmentsChanged:false,batch131Authorized:false,trainingAuthorized:false,
    nextAction:"FREEZE_P6_COHORT_REFERENCE_IN_REPOSITORY_BEFORE_ANY_AUDIO_ACCESS"
  };
}
function selfTest(){
  const p=validateProtocol(),excluded=priorExcludedIdentities();
  const fixture=[];
  for(let i=1;i<=131;i++){
    const rid="FAME"+String(i).padStart(6,"0"),sha=crypto.createHash("sha256").update("p6-fixture-"+rid).digest("hex");
    fixture.push({
      sourceRecordId:rid,sourceAssetId:"sha256:"+sha,compositionFamilyId:"FAM-"+rid,sha256:sha,
      sourcePaths:["fixture/"+rid+".wav"],localPath:"sources/"+sha+"/source.wav",
      familyStatus:"CONFIRMED",presentInScan:true,split:null,qa:{},pilotCohorts:[],
      roles:Object.fromEntries(["drums","lowend","tonal","full"].map(role=>[role,{processing:"PENDING",review:"NOT_PROCESSED",artifactId:null}]))
    });
  }
  for(const row of fixture){
    if(excluded.sourceIds.has(row.sourceRecordId))row.split="historically-consumed";
  }
  const manifest={schema:"fame-owned-beats-workspace-v1",version:1,records:fixture};
  const a=select(manifest,p),c=select(manifest,p);
  if(a.chosen.length!==12)throw new Error("P6 selector did not choose 12 families");
  if(a.cohortDigestSha256!==c.cohortDigestSha256||JSON.stringify(a.chosen)!==JSON.stringify(c.chosen))throw new Error("P6 selection is not deterministic");
  if(a.chosen.some(x=>excluded.sourceIds.has(x.sourceRecordId)||excluded.familyIds.has(x.compositionFamilyId)))throw new Error("P6 selector chose historically excluded identity");
  return{
    mode:"AUDIO_TO_MIDI_P6_SELECTOR_SELF_TEST_PASS",
    selectedFamilies:12,deterministic:true,
    historicalSourceIdsExcluded:excluded.sourceIds.size,
    audioFileOpenedByThisCommand:false,audioFileHashedByThisCommand:false
  };
}
function main(args=process.argv.slice(2)){
  const[command,workspace]=args;
  let out;
  if(command==="self-test")out=selfTest();
  else if(command==="preview"){
    if(!workspace)throw new Error("Workspace required");
    out=preview(workspace);
  }else throw new Error("Usage: node prepare-audio-to-midi-p6-independent-evaluation.js <self-test|preview> [workspace]");
  process.stdout.write(stableJson(out));
}
if(require.main===module){try{main()}catch(error){console.error("AUDIO TO MIDI P6 PREPARATION FAILED: "+error.message);process.exitCode=1}}
module.exports={identity,identityDigest,untouchedForP6,priorExcludedIdentities,rankFor,select,preview,selfTest};
