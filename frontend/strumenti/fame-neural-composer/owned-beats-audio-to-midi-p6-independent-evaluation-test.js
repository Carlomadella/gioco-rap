"use strict";
const assert=require("node:assert");
const tool=require("./owned-beats/prepare-audio-to-midi-p6-independent-evaluation");
function main(){
  const fs=require("node:fs"),path=require("node:path");
  const source=fs.readFileSync(path.join(__dirname,"owned-beats","prepare-audio-to-midi-p6-independent-evaluation.js"),"utf8");
  assert.strictEqual(source.includes('require("./bootstrap")'),false);
  assert.strictEqual(source.includes("audio-analysis-holdout-cohort-r1-v2.json"),false);
  assert.strictEqual(source.includes("audio-to-midi-development-protocol-v1.json"),false);
  assert.strictEqual(source.includes("audio-to-midi-independent-evaluation-cohort-v1.json"),false);
  const out=tool.selfTest();
  assert.strictEqual(out.mode,"AUDIO_TO_MIDI_P6_SELECTOR_SELF_TEST_PASS");
  assert.strictEqual(out.selectedFamilies,12);
  assert.strictEqual(out.deterministic,true);
  assert.strictEqual(out.audioFileOpenedByThisCommand,false);
  assert.strictEqual(out.audioFileHashedByThisCommand,false);
  console.log("owned-beats-audio-to-midi-p6-independent-evaluation-test: PASS");
}
main();
