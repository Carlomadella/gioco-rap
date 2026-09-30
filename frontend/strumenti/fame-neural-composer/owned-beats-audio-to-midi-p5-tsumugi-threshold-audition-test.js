"use strict";

const assert=require("node:assert");
const audition=require("./owned-beats/audio-to-midi-p5-tsumugi-threshold-audition");

const out=audition.selfTest();
assert.strictEqual(out.mode,"FAME_TSUMUGI_THRESHOLD_AUDITION_SELF_TEST_PASS");
assert.deepStrictEqual(out.thresholds,[-3,-2,-1,0]);
assert.deepStrictEqual(out.families,["FAME000040","FAME000080","FAME000126"]);

console.log("owned-beats-audio-to-midi-p5-tsumugi-threshold-audition-test: PASS");
