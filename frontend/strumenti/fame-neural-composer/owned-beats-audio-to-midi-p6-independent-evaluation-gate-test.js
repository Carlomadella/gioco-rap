"use strict";
const assert=require("node:assert");
const gate=require("./owned-beats/audio-to-midi-p6-independent-evaluation-gate");
function main(){
  const out=gate.selfTest();
  assert.strictEqual(out.mode,"AUDIO_TO_MIDI_P6_RESERVATION_GATE_SELF_TEST_PASS");
  assert.strictEqual(out.expectedFamilies,12);
  assert.strictEqual(out.eligibleFamiliesAtSelection,91);
  assert.strictEqual(out.audioFileOpenedByThisCommand,false);
  assert.strictEqual(out.audioFileHashedByThisCommand,false);
  console.log("owned-beats-audio-to-midi-p6-independent-evaluation-gate-test: PASS");
}
main();
