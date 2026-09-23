"use strict";
const assert=require("node:assert");
const tool=require("./owned-beats/prepare-audio-to-midi-p6-independent-evaluation");
function main(){
  const out=tool.selfTest();
  assert.strictEqual(out.mode,"AUDIO_TO_MIDI_P6_SELECTOR_SELF_TEST_PASS");
  assert.strictEqual(out.selectedFamilies,12);
  assert.strictEqual(out.deterministic,true);
  assert.strictEqual(out.audioFileOpenedByThisCommand,false);
  assert.strictEqual(out.audioFileHashedByThisCommand,false);
  console.log("owned-beats-audio-to-midi-p6-independent-evaluation-test: PASS");
}
main();
