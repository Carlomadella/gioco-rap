"use strict";

const assert=require("node:assert");
const audition=require("./owned-beats/audio-to-midi-audition");

const out=audition.selfTest();
assert.strictEqual(out.mode,"FAME_AUDIO_TO_MIDI_AUDITION_SELF_TEST_PASS");
assert.strictEqual(typeof out.rendererId,"string");
assert.strictEqual(out.pitchRenderer,"FAME_DRUM_PITCH_RENDERER_SELF_TEST_PASS");
assert.strictEqual(audition.DEFAULT_FAMILY,"FAME000126");

console.log("owned-beats-audio-to-midi-audition-test: PASS");
