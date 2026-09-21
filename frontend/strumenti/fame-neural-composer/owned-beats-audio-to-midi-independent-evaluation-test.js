"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const tool=require("./owned-beats/prepare-audio-to-midi-independent-evaluation.js");

const owned=path.join(__dirname,"owned-beats");
const protocolPath=path.join(owned,"audio-to-midi-independent-evaluation-v1.json");
const selectorPath=path.join(owned,"prepare-audio-to-midi-independent-evaluation.js");
const protocol=JSON.parse(fs.readFileSync(protocolPath,"utf8"));
const src=fs.readFileSync(selectorPath,"utf8");

function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}

assert.equal(protocol.schema,"fame-owned-beats-audio-to-midi-independent-evaluation-protocol-v1");
assert.equal(protocol.version,1);
assert.equal(protocol.status,"FROZEN_BEFORE_FRESH_COHORT_SELECTION");
assert.equal(protocol.sourceCorpus.expectedRecords,131);
assert.equal(protocol.sourceCorpus.expectedCompositionFamilies,131);
assert.equal(protocol.cohort.expectedFamilies,12);
assert.equal(protocol.cohort.selection.algorithm,"opaque-identity-sha256-rank-v1");
assert.equal(protocol.cohort.selection.usesAudioContentOrDerivedMetrics,false);
assert.equal(protocol.cohort.independence.excludeConsumedAudioAnalysisHoldout,true);
assert.equal(protocol.gate.drums.familiesAtOrAbove2AtLeast,9);
assert.equal(protocol.gate.lowEnd.familiesAtOrAbove2AtLeast,9);
assert.equal(protocol.frozenPipeline.drums.armId,"drums-bass-kick-fusion-v1");
assert.equal(protocol.frozenPipeline.lowEnd.armId,"librosa-pyin-lowend-v1");
assert.equal(protocol.frozenPipeline.basicPitch.mayReenterThisEvaluation,false);
assert.equal(protocol.safety.cohortSelectionMayOpenAudio,false);
assert.equal(protocol.safety.cohortSelectionMayHashAudio,false);
assert.equal(protocol.safety.batch131Authorized,false);
assert.equal(protocol.safety.trainingAuthorized,false);
assert.equal(protocol.safety.taskDataReadyMayBeDeclared,false);
assert.equal(protocol.implementation.selectorPath,"prepare-audio-to-midi-independent-evaluation.js");
assert.equal(protocol.implementation.selectorGitBlobSha,gitBlobSha(selectorPath));
assert.equal(protocol.implementation.selectorGitBlobSha,"305fe132ba54d4b777d8d2a76e66262fd39ea554");

for(const needle of [
  "untouchedForEvaluation(record)",
  "CONSUMED_HOLDOUT_REFERENCE_FILE",
  "priorExcludedIdentities()",
  "rankFor(record,seed)",
  "eligibleUniverseDigestSha256",
  "cohortDigestSha256",
  "audioFileOpenedByThisCommand:false",
  "audioFileHashedByThisCommand:false",
  "sourceManifestMutated:false",
  "splitAssignmentsChanged:false"
]) assert(src.includes(needle),needle);

assert(!src.includes("ffmpeg"));
assert(!src.includes("ffprobe"));
assert(!src.includes("decodeAudio"));
assert(!src.includes("createReadStream(record.localPath"));

const self=tool.selfTest();
assert.equal(self.mode,"AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_SELECTOR_SELF_TEST_PASS");
assert.equal(self.eligibleFamilies,113);
assert.equal(self.selectedFamilies,12);

console.log("owned-beats-audio-to-midi-independent-evaluation-test: PASS");
