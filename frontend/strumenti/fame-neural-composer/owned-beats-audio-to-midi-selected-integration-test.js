"use strict";

const assert=require("node:assert");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const tool=require("./owned-beats/audio-to-midi-selected-integration.js");

const owned=path.join(__dirname,"owned-beats");
const protocolPath=path.join(owned,"audio-to-midi-selected-integration-v1.json");
const runnerPath=path.join(owned,"audio-to-midi-selected-integration.js");
const protocol=JSON.parse(fs.readFileSync(protocolPath,"utf8"));
const runner=fs.readFileSync(runnerPath,"utf8");

function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}

assert.equal(protocol.schema,"fame-owned-beats-audio-to-midi-selected-integration-v1");
assert.equal(protocol.version,1);
assert.equal(protocol.status,"FROZEN_BEFORE_FIRST_SELECTED_INTEGRATION_OUTPUT");
assert.equal(protocol.runId,"audio-to-midi-selected-integration-v1-001");
assert.equal(protocol.split,"development");
assert.equal(protocol.expectedFamilies,8);
assert.deepEqual(protocol.expectedSourceRecordIds,[
  "FAME000011","FAME000012","FAME000023","FAME000040",
  "FAME000046","FAME000058","FAME000080","FAME000126"
]);

assert.equal(protocol.selection.drums.armId,"drums-bass-kick-fusion-v1");
assert.equal(protocol.selection.lowEnd.armId,"librosa-pyin-lowend-v1");
assert.equal(protocol.selection.lowEnd.requiredOutcome,"KEEP_PYIN_LOW_END");
assert.deepEqual(protocol.selection.lowEnd.requiredStats,{
  medianUsefulness:2,
  familiesAtOrAbove2:7,
  totalUsefulness:17,
  pass:true
});

assert.equal(protocol.knownIssuePolicy.expectedBelowThresholdLowEndFamilies,1);
assert.equal(protocol.knownIssuePolicy.expectedScore,1);
assert.equal(protocol.knownIssuePolicy.classification,"UPSTREAM_SOURCE_SEPARATION_CONTAMINATION");
assert.equal(protocol.knownIssuePolicy.rootCauseLayer,"source-separation");
assert.equal(protocol.knownIssuePolicy.transcriptionRootCause,false);
assert.equal(protocol.knownIssuePolicy.retainAsDevelopmentRegressionCase,true);

assert.equal(protocol.integration.noRetranscription,true);
assert.equal(protocol.integration.noMidiReencoding,true);
assert.equal(protocol.integration.copySelectedMidiByteIdentical,true);
assert.equal(protocol.integration.appendOnly,true);
assert.equal(protocol.safety.finalHoldoutAllowed,false);
assert.equal(protocol.safety.batch131Allowed,false);
assert.equal(protocol.safety.trainingAuthorized,false);
assert.equal(protocol.safety.taskDataReadyMayBeDeclared,false);

assert.equal(protocol.implementation.runnerPath,"audio-to-midi-selected-integration.js");
assert.equal(protocol.implementation.runnerGitBlobSha,gitBlobSha(runnerPath));
assert.equal(protocol.implementation.runnerGitBlobSha,"aff86ecca58a8d4cf16b87e79578fa7bf4a6d149");

assert(runner.includes('pkg.renderer?.outputDurationSource!=="reference-bass-stem"'));
assert(runner.includes('pkg.renderer?.outputDurationMustMatchReference!==true'));
assert(runner.includes('pkg.renderer?.silenceAfterLastDetectedEventPreserved!==true'));
assert(runner.includes('sha256File(packageFile)!==sel.requiredPackageDigestSha256'));
assert(runner.includes('sha256File(submissionFile)!==sel.requiredSubmissionDigestSha256'));
assert(runner.includes('classification:p.knownIssuePolicy.classification'));
assert(runner.includes('transcriptionRootCause:false'));
assert(runner.includes('fs.copyFileSync(srcDrums,dstDrums,fs.constants.COPYFILE_EXCL)'));
assert(runner.includes('fs.copyFileSync(srcLow,dstLow,fs.constants.COPYFILE_EXCL)'));
assert(runner.includes('sha256File(dstDrums)!==drumsSha'));
assert(runner.includes('sha256File(dstLow)!==lowSha'));
assert(!runner.includes("child_process"));
assert(!runner.includes("spawn("));
assert(!runner.includes("execFile("));
assert(!runner.includes("ffmpeg"));
assert(!runner.includes("predict("));
assert(!runner.includes("python.exe"));

assert.deepEqual(tool.armStats([1,2,2,2,2,2,3,3]),{
  medianUsefulness:2,
  familiesAtOrAbove2:7,
  totalUsefulness:17,
  pass:true
});
assert.equal(tool.selfTest().mode,"AUDIO_TO_MIDI_SELECTED_INTEGRATION_SELF_TEST_PASS");

console.log("owned-beats-audio-to-midi-selected-integration-test: PASS");
