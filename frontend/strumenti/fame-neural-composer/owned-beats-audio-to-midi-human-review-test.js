"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");

const root=__dirname;
const owned=path.join(root,"owned-beats");
const mod=require(path.join(owned,"audio-to-midi-human-review.js"));
const protocol=JSON.parse(fs.readFileSync(path.join(owned,"audio-to-midi-human-review-v1.json"),"utf8"));
const source=fs.readFileSync(path.join(owned,"audio-to-midi-human-review.js"),"utf8");
const launcher=fs.readFileSync(path.join(owned,"start-audio-to-midi-human-review.ps1"),"utf8");

assert.equal(protocol.status,"FROZEN_BEFORE_FIRST_AUDIO_TO_MIDI_LISTENING");
assert.equal(protocol.blindness.drums,true);
assert.equal(protocol.blindness.armIdentityExposedDuringReview,false);
assert.equal(protocol.renderer.sameRendererForBothDrumArms,true);
assert.equal(protocol.drumsSelectionRule.qualification.medianUsefulnessAtLeast,2);
assert.equal(protocol.drumsSelectionRule.qualification.familiesAtOrAbove2AtLeast,6);
assert.equal(protocol.lowEndGate.medianUsefulnessAtLeast,2);
assert.equal(protocol.lowEndGate.familiesAtOrAbove2AtLeast,6);

assert.equal(mod.median([0,0,2,2,2,2,3,3]),2);
const stats={
  "drums-only-spectral-onset-v1":{medianUsefulness:2.5,familiesAtOrAbove2:7,totalUsefulness:19,pass:true},
  "drums-bass-kick-fusion-v1":{medianUsefulness:2.5,familiesAtOrAbove2:8,totalUsefulness:20,pass:true}
};
assert.equal(mod.chooseDrums(stats),"drums-bass-kick-fusion-v1");

const tie={
  "drums-only-spectral-onset-v1":{medianUsefulness:2.5,familiesAtOrAbove2:8,totalUsefulness:20,pass:true},
  "drums-bass-kick-fusion-v1":{medianUsefulness:2.5,familiesAtOrAbove2:8,totalUsefulness:20,pass:true}
};
assert.equal(mod.chooseDrums(tie),"drums-only-spectral-onset-v1");

const drumWav=mod.renderDrums([
  {timeSeconds:0.0,role:"kick"},
  {timeSeconds:0.25,role:"snare"},
  {timeSeconds:0.5,role:"hihat"}
]);
assert.equal(drumWav.toString("ascii",0,4),"RIFF");
assert.equal(drumWav.toString("ascii",8,12),"WAVE");

const bassWav=mod.renderBassNotes([
  {startSeconds:0,endSeconds:0.5,midiNote:45}
]);
assert.equal(bassWav.toString("ascii",0,4),"RIFF");

const contourWav=mod.renderContour([
  {timeSeconds:0,frequencyHz:110},
  {timeSeconds:0.01,frequencyHz:111},
  {timeSeconds:0.02,frequencyHz:112}
]);
assert.equal(contourWav.toString("ascii",0,4),"RIFF");

const pkg={
  reviewId:"audio-to-midi-human-review-v1-001",
  packageDigestSha256:"digest",
  families:Array.from({length:8},(_,i)=>({sourceRecordId:"FAME_TEST_"+(i+1)}))
};
const key={mapping:{}};
for(const [i,f] of pkg.families.entries()){
  key.mapping[f.sourceRecordId]=i%2===0
    ?{A:"drumsOnly",B:"drumsBassKickFusion"}
    :{A:"drumsBassKickFusion",B:"drumsOnly"};
}
const doc={
  schema:"fame-owned-beats-audio-to-midi-human-review-submission-v1",
  version:1,
  reviewId:pkg.reviewId,
  packageDigestSha256:"digest",
  families:pkg.families.map(f=>({
    sourceRecordId:f.sourceRecordId,
    drums:{A:{score:2,note:""},B:{score:3,note:""}},
    lowEnd:{score:2,note:""},
    reviewerAttested:true
  }))
};
assert.doesNotThrow(()=>mod.validateSubmission(doc,pkg));
const finalized=mod.finalizeSubmission(doc,pkg,key,protocol);
assert.equal(finalized.gate.lowEnd.pass,true);
assert.equal(finalized.gate.drums.pass,true);
assert.equal(finalized.gate.pass,true);

assert(source.includes("drumsArmIdentityExposedToReviewer:false"));
assert(!source.includes("kick_do"));
assert(!source.includes("bassKickCandidateCount"));
assert(launcher.includes(" prepare $Workspace $ReviewId"));
assert(launcher.includes(" serve $Workspace $ReviewId $Port"));
assert(!launcher.includes("audio-to-midi-development-baseline.py"));
assert(!launcher.includes(" execute "));
assert(launcher.includes("[int]$Port = 0"));

console.log("owned-beats-audio-to-midi-human-review-test: PASS");
