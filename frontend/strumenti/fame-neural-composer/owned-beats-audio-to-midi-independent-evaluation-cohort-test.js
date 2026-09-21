"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");
const tool=require("./owned-beats/prepare-audio-to-midi-independent-evaluation.js");

const owned=path.join(__dirname,"owned-beats");
const protocol=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-v1.json"),"utf8"));
const reference=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-independent-evaluation-cohort-v1.json"),"utf8"));
const dev=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-development-protocol-v1.json"),"utf8"));
const consumed=JSON.parse(fs.readFileSync(path.join(owned,"audio-analysis-holdout-cohort-r1-v2.json"),"utf8"));

assert.equal(reference.schema,"fame-owned-beats-audio-to-midi-evaluation-cohort-reference-v1");
assert.equal(reference.version,1);
assert.equal(reference.cohortId,"audio-to-midi-independent-evaluation-v1");
assert.equal(reference.status,"FROZEN_FRESH_COHORT_BEFORE_AUDIO_ACCESS");
assert.equal(reference.expectedFamilies,12);
assert.equal(reference.plannedSplit,"audio-to-midi-evaluation-v1");
assert.equal(reference.selection.algorithm,"opaque-identity-sha256-rank-v1");
assert.equal(reference.selection.seed,protocol.cohort.selection.seed);
assert.equal(reference.selection.usesAudioContentOrDerivedMetrics,false);
assert.equal(reference.selection.eligibleFamilyCount,103);
assert.equal(reference.selection.eligibleUniverseDigestSha256,"60c77d0fb6f12fc3e9df4f66a329ccb1b7bef60954264e70924851dddf98904f");
assert.equal(reference.sourceManifest.recordCount,131);
assert.equal(reference.sourceManifest.identityDigestSha256,"a459b2df4c9e3a0fe0b268e58833e15c9b45097231b115a1d85311e993557f38");
assert.equal(reference.repo.selectorGitBlobSha,protocol.implementation.selectorGitBlobSha);
assert.equal(reference.repo.protocolGitBlobSha,"7ad299fddc9fc1430f15d6ae65327e9d53205c65");

assert.equal(reference.records.length,12);
assert.equal(tool.identityDigest(reference.records),"287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788");
assert.equal(reference.cohortDigestSha256,"287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788");

const expectedIds=[
  "FAME000001","FAME000102","FAME000006","FAME000129",
  "FAME000020","FAME000073","FAME000092","FAME000121",
  "FAME000010","FAME000071","FAME000116","FAME000101"
];
assert.deepEqual(reference.records.map(x=>x.sourceRecordId),expectedIds);

for(const [index,row] of reference.records.entries()){
  assert.equal(row.selectionRank,index+1);
  assert.equal(row.rankSha256,tool.rankFor(row,reference.selection.seed));
}

const devIds=new Set(dev.sourceSeparation.expectedSourceRecordIds);
const consumedIds=new Set(consumed.records.map(x=>x.sourceRecordId));
const consumedFamilies=new Set(consumed.records.map(x=>x.compositionFamilyId));
for(const row of reference.records){
  assert(!devIds.has(row.sourceRecordId),"development overlap: "+row.sourceRecordId);
  assert(!consumedIds.has(row.sourceRecordId),"consumed Audio Analysis holdout overlap: "+row.sourceRecordId);
  assert(!consumedFamilies.has(row.compositionFamilyId),"consumed Audio Analysis holdout family overlap: "+row.compositionFamilyId);
}

assert.equal(reference.safety.audioFileOpenedBeforeFreeze,false);
assert.equal(reference.safety.audioFileHashedBeforeFreeze,false);
assert.equal(reference.safety.audioDecodedBeforeFreeze,false);
assert.equal(reference.safety.derivedAudioMetricsUsedForSelection,false);
assert.equal(reference.safety.sourceManifestMutatedBySelection,false);
assert.equal(reference.safety.splitAssignmentsChangedBySelection,false);
assert.equal(reference.safety.batch131Authorized,false);
assert.equal(reference.safety.trainingAuthorized,false);
assert.equal(reference.safety.taskDataReadyMayBeDeclared,false);

console.log("owned-beats-audio-to-midi-independent-evaluation-cohort-test: PASS");
