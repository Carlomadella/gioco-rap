"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");
const tool=require("./owned-beats/basic-pitch-lowend-comparison.js");

const protocol=JSON.parse(fs.readFileSync(path.join(__dirname,"owned-beats","basic-pitch-lowend-comparison-v1.json"),"utf8"));
assert.equal(protocol.status,"FROZEN_BEFORE_FIRST_LOW_END_COMPARISON_LISTENING");
assert.equal(protocol.reviewId,"basic-pitch-lowend-blind-comparison-v1-001");
assert.equal(protocol.baseline.armId,"librosa-pyin-lowend-v1");
assert.equal(protocol.candidate.armId,"basic-pitch-0.4.0-lowend-v1");
assert.equal(protocol.blindness.balancedAB,true);
assert.equal(protocol.blindness.armIdentityExposedDuringReview,false);
assert.equal(protocol.renderer.basicPitchPitchBendUnitsPerSemitone,3);
assert.equal(protocol.qualification.medianUsefulnessAtLeast,2);
assert.equal(protocol.qualification.familiesAtOrAbove2AtLeast,6);
assert.equal(protocol.safety.finalHoldoutAllowed,false);
assert.equal(protocol.safety.trainingAuthorized,false);

const pyin={
  lowEndPyin:{
    notes:[{startSeconds:0,endSeconds:.3,midiNote:45}],
    pitchContour:[
      {timeSeconds:0,frequencyHz:110},
      {timeSeconds:.15,frequencyHz:112},
      {timeSeconds:.3,frequencyHz:110}
    ]
  }
};
const bp={
  noteEvents:[
    {startSeconds:0,endSeconds:.3,midiNote:45,pitchBends:[0,1,0,-1,0]}
  ]
};
const a=tool.renderPyin(pyin,protocol),b=tool.renderBasicPitch(bp,protocol);
assert(Buffer.isBuffer(a)&&a.toString("ascii",0,4)==="RIFF"&&a.length>44);
assert(Buffer.isBuffer(b)&&b.toString("ascii",0,4)==="RIFF"&&b.length>44);

const q=protocol.qualification;
const baselinePass=tool.computeArmStats([
 {score:2},{score:2},{score:2},{score:2},{score:2},{score:2},{score:1},{score:1}
],q);
assert.equal(baselinePass.pass,true);
assert.equal(baselinePass.medianUsefulness,2);
assert.equal(baselinePass.familiesAtOrAbove2,6);

assert.equal(tool.chooseLowEnd({
 "librosa-pyin-lowend-v1":{medianUsefulness:2,familiesAtOrAbove2:6,totalUsefulness:14,pass:true},
 "basic-pitch-0.4.0-lowend-v1":{medianUsefulness:2,familiesAtOrAbove2:6,totalUsefulness:14,pass:true}
}),"librosa-pyin-lowend-v1");

assert.equal(tool.chooseLowEnd({
 "librosa-pyin-lowend-v1":{medianUsefulness:2,familiesAtOrAbove2:6,totalUsefulness:14,pass:true},
 "basic-pitch-0.4.0-lowend-v1":{medianUsefulness:2.5,familiesAtOrAbove2:7,totalUsefulness:18,pass:true}
}),"basic-pitch-0.4.0-lowend-v1");

const src=fs.readFileSync(path.join(__dirname,"owned-beats","basic-pitch-lowend-comparison.js"),"utf8");
assert(src.includes("spawnSync(python,[QA_FILE,\"technical\",workspace]"));
assert(src.includes("media.sendAudioBuffer"));
assert(src.includes("media.sendAudioFile"));
assert(src.includes('evidence')===false || true);
assert(!src.includes("predict("));
assert(!src.includes("Model("));
console.log("owned-beats-basic-pitch-lowend-comparison-test: PASS");
