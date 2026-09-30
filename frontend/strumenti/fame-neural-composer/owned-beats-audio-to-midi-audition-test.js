"use strict";

const assert=require("node:assert");
const audition=require("./owned-beats/audio-to-midi-audition");

const out=audition.selfTest();
assert.strictEqual(out.mode,"FAME_AUDIO_TO_MIDI_AUDITION_SELF_TEST_PASS");
assert.strictEqual(typeof out.rendererId,"string");
assert.strictEqual(out.pitchRenderer,"FAME_DRUM_PITCH_RENDERER_SELF_TEST_PASS");
assert.strictEqual(audition.DEFAULT_FAMILY,"FAME000126");

const tsumugiEvents=[
  {timeSeconds:0.1,canonicalPitch:36},
  {timeSeconds:0.2,canonicalPitch:37},
  {timeSeconds:0.3,canonicalPitch:39},
  {timeSeconds:0.4,canonicalPitch:70}
];
const clapRim=audition.buildClapRimEvents(tsumugiEvents);
assert.deepStrictEqual(clapRim.map(x=>x.canonicalPitch),[37,39]);

const hybrid=audition.buildAdtofTsumugiClapRimHybrid(
  [{timeSeconds:0.15,canonicalPitch:35}],
  tsumugiEvents
);
assert.deepStrictEqual(hybrid.map(x=>x.canonicalPitch),[35,37,39]);

console.log("owned-beats-audio-to-midi-audition-test: PASS");
