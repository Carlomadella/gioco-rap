"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const tool=require("./owned-beats/basic-pitch-lowend-comparison-v2.js");

const protocol=JSON.parse(fs.readFileSync(path.join(__dirname,"owned-beats","basic-pitch-lowend-comparison-v2.json"),"utf8"));

assert.equal(protocol.schema,"fame-owned-beats-basic-pitch-lowend-comparison-v2");
assert.equal(protocol.version,2);
assert.equal(protocol.reviewId,"basic-pitch-lowend-blind-comparison-v1-002");
assert.equal(protocol.supersedesReviewId,"basic-pitch-lowend-blind-comparison-v1-001");
assert.equal(protocol.supersedesReason,"CANDIDATE_RENDER_DURATION_TRUNCATED_TO_LAST_DETECTED_EVENT");
assert.equal(protocol.renderer.outputDurationSource,"reference-bass-stem");
assert.equal(protocol.renderer.outputDurationMustMatchReference,true);
assert.equal(protocol.renderer.silenceAfterLastDetectedEventPreserved,true);

function standardWav(durationSeconds,sr=22050){
  const samples=Math.ceil(durationSeconds*sr);
  const dataBytes=samples*2;
  const b=Buffer.alloc(44+dataBytes);
  b.write("RIFF",0,"ascii");
  b.writeUInt32LE(36+dataBytes,4);
  b.write("WAVE",8,"ascii");
  b.write("fmt ",12,"ascii");
  b.writeUInt32LE(16,16);
  b.writeUInt16LE(1,20);
  b.writeUInt16LE(1,22);
  b.writeUInt32LE(sr,24);
  b.writeUInt32LE(sr*2,28);
  b.writeUInt16LE(2,32);
  b.writeUInt16LE(16,34);
  b.write("data",36,"ascii");
  b.writeUInt32LE(dataBytes,40);
  return b;
}

function renderedDuration(buffer){
  assert.equal(buffer.toString("ascii",0,4),"RIFF");
  assert.equal(buffer.toString("ascii",8,12),"WAVE");
  const byteRate=buffer.readUInt32LE(28);
  const dataBytes=buffer.readUInt32LE(40);
  return dataBytes/byteRate;
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"fame-lowend-duration-"));
try{
  const reference=path.join(tmp,"bass.wav");
  fs.writeFileSync(reference,standardWav(5.25));
  const actual=tool.wavDurationSeconds(reference);
  assert(Math.abs(actual-5.25)<=1/22050);

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
  const basicPitch={
    noteEvents:[{startSeconds:0,endSeconds:.3,midiNote:45,pitchBends:[0,1,0]}]
  };
  const noNotes={noteEvents:[]};

  const pyinWav=tool.renderPyin(pyin,protocol,actual);
  const bpWav=tool.renderBasicPitch(basicPitch,protocol,actual);
  const silenceWav=tool.renderBasicPitch(noNotes,protocol,actual);

  for(const [label,wav] of [["pYIN",pyinWav],["Basic Pitch",bpWav],["Basic Pitch zero-note",silenceWav]]){
    const duration=renderedDuration(wav);
    assert(Math.abs(duration-actual)<=1/protocol.renderer.sampleRate,label+" duration="+duration+" reference="+actual);
  }

  // Regression: a candidate whose last detected event ends at 0.3s must still
  // render for the full 5.25s reference duration.
  assert(renderedDuration(bpWav)>5.24);
  assert.equal(silenceWav.length,44+Math.ceil(actual*protocol.renderer.sampleRate)*2);
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}

const src=fs.readFileSync(path.join(__dirname,"owned-beats","basic-pitch-lowend-comparison-v2.js"),"utf8");
assert(src.includes("ABORTED_BEFORE_FINAL_SUBMISSION_RENDER_DURATION_BUG"));
assert(src.includes("referenceDurationSeconds:wavDurationSeconds(referenceFile)"));
assert(src.includes("renderBasicPitch(bpResult(workspace,rid),p,family.referenceDurationSeconds)"));
assert(src.includes("renderPyin(pyinResult(workspace,rid),p,family.referenceDurationSeconds)"));
assert(src.includes("Reference duration changed after package freeze"));
assert(!src.includes("Math.max(1,...events.map(n=>n.endSeconds+.1))"));

console.log("owned-beats-basic-pitch-lowend-comparison-v2-test: PASS");
