"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const renderer = require("./owned-beats/audio-to-midi-human-review-v2.js");
const audit = require("./owned-beats/audio-to-midi-p2-audit.js");

function vlq(value) {
  value = Math.max(0, Math.trunc(value)); let buffer = value & 0x7f, out = [];
  while ((value >>= 7)) { buffer <<= 8; buffer |= (value & 0x7f) | 0x80; }
  while (true) { out.push(buffer & 0xff); if (buffer & 0x80) buffer >>= 8; else break; }
  return Buffer.from(out);
}
function ticks(seconds, bpm, ppq) { return Math.round(seconds * bpm * ppq / 60); }
function midi(events, bpm, channel, drum = false, ppq = 480) {
  const tempoUs = Math.round(60000000 / bpm), list = [{ tick: 0, order: 0, payload: Buffer.from([0xff,0x51,0x03,(tempoUs>>16)&255,(tempoUs>>8)&255,tempoUs&255]) }];
  for (const e of events) {
    const startSeconds = drum ? e.timeSeconds : e.startSeconds;
    const endSeconds = drum ? e.timeSeconds + Math.max(0.03,60/bpm/16) : e.endSeconds;
    const start = ticks(startSeconds,bpm,ppq), end = Math.max(start+1,ticks(endSeconds,bpm,ppq));
    list.push({tick:start,order:2,payload:Buffer.from([0x90|channel,e.midiNote,e.velocity])});
    list.push({tick:end,order:1,payload:Buffer.from([0x80|channel,e.midiNote,0])});
  }
  list.sort((a,b)=>a.tick-b.tick||a.order-b.order||Buffer.compare(a.payload,b.payload));
  let prev=0, track=[];
  for(const e of list){track.push(vlq(e.tick-prev),e.payload);prev=e.tick}
  track.push(Buffer.from([0,0xff,0x2f,0])); const t=Buffer.concat(track);
  const h=Buffer.alloc(22);h.write("MThd",0,"ascii");h.writeUInt32BE(6,4);h.writeUInt16BE(0,8);h.writeUInt16BE(1,10);h.writeUInt16BE(ppq,12);h.write("MTrk",14,"ascii");h.writeUInt32BE(t.length,18);
  return Buffer.concat([h,t]);
}

const silence = renderer.renderDrums([], 2.0, 22050);
assert.equal(renderer.wavInfo(silence).samples, 44100);
assert.equal(renderer.wavInfo(silence).durationSeconds, 2.0);
const simultaneous = [{timeSeconds:0.5,role:"kick",midiNote:36,velocity:100},{timeSeconds:0.5,role:"snare",midiNote:38,velocity:90}];
assert.equal(renderer.inspectDrums(simultaneous, 2).overflow.length,0);
assert.throws(()=>renderer.renderDrums([{timeSeconds:2.01,role:"kick",midiNote:36,velocity:100}],2),/exceeds reference duration/);
const bass=[{startSeconds:0.25,endSeconds:1.75,midiNote:45,velocity:80}];
assert.equal(renderer.wavInfo(renderer.renderBassNotes(bass,2)).durationSeconds,2);
assert.throws(()=>renderer.renderBassNotes([{startSeconds:1.9,endSeconds:2.1,midiNote:45,velocity:80}],2),/exceeds reference duration/);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"fame-p2-"));
try{
  const drumsFile=path.join(tmp,"drums.mid"),bassFile=path.join(tmp,"bass.mid");
  fs.writeFileSync(drumsFile,midi(simultaneous,120,9,true));fs.writeFileSync(bassFile,midi(bass,120,0,false));
  const pd=audit.parseMidi(drumsFile),pb=audit.parseMidi(bassFile);
  assert.equal(pd.notes.length,2);assert.equal(pb.notes.length,1);
  assert.equal(audit.compareEvents(simultaneous,pd,120,9,true).events,2);
  assert.equal(audit.compareEvents(bass,pb,120,0,false).events,1);
  const bad=Buffer.from(fs.readFileSync(bassFile));
  const at=bad.indexOf(Buffer.from([0x90,45,80]));assert.ok(at>0);bad[at+2]=79;fs.writeFileSync(path.join(tmp,"bad.mid"),bad);
  assert.throws(()=>audit.compareEvents(bass,audit.parseMidi(path.join(tmp,"bad.mid")),120,0,false),/No MIDI event matches JSON/);
}finally{fs.rmSync(tmp,{recursive:true,force:true})}

const protocol=JSON.parse(fs.readFileSync(path.join(__dirname,"owned-beats","audio-to-midi-p2-protocol-v1.json"),"utf8"));
assert.equal(protocol.renderer.historicalRendererImmutable,true);
assert.equal(protocol.renderer.candidateRendererId,renderer.RENDERER_ID);
assert.equal(protocol.safety.historicalArtifactsMayBeOverwritten,false);
assert.equal(protocol.safety.consumedEvaluationMayBeUsedForTuning,false);
console.log("owned-beats-audio-to-midi-p2-test: PASS");
