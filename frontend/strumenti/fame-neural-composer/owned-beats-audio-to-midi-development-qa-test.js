"use strict";

const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = __dirname;
const owned = path.join(root, "owned-beats");
const qa = require(path.join(owned, "audio-to-midi-development-qa.js"));
const protocolFile = path.join(owned, "audio-to-midi-development-protocol-v1.json");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function midiOneNote(note, channel) {
  const track = Buffer.from([
    0x00,0xff,0x51,0x03,0x07,0xa1,0x20,
    0x00,0x90 | channel,note,100,
    0x78,0x80 | channel,note,0,
    0x00,0xff,0x2f,0x00
  ]);
  const header = Buffer.alloc(14);
  header.write("MThd",0,"ascii");
  header.writeUInt32BE(6,4);
  header.writeUInt16BE(0,8);
  header.writeUInt16BE(1,10);
  header.writeUInt16BE(480,12);
  const chunk = Buffer.alloc(8);
  chunk.write("MTrk",0,"ascii");
  chunk.writeUInt32BE(track.length,4);
  return Buffer.concat([header,chunk,track]);
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(),"fame-a2m-qa-"));
const runId = "audio-to-midi-development-baseline-v1-001";
const runDir = path.join(workspace,"runs","audio-to-midi-development-baseline",runId);
fs.mkdirSync(runDir,{recursive:true});

const ids = [
  "FAME000011","FAME000012","FAME000023","FAME000040",
  "FAME000046","FAME000058","FAME000080","FAME000126"
];

const summaryRows = [];
for (const [i,rid] of ids.entries()) {
  const dir = path.join(runDir,rid);
  fs.mkdirSync(dir,{recursive:true});

  const event = {
    timeSeconds:0.5,
    frame:43,
    role:"kick",
    midiNote:36,
    velocity:100,
    sourceStem:"drums",
    spectral:{lowRatio:0.7,midRatio:0.2,highRatio:0.1,centroidHz:500}
  };
  const fusion = {...event,sourceStem:"drums+bass"};
  const note = {
    startSeconds:0.5,
    endSeconds:1.0,
    durationSeconds:0.5,
    midiNote:45,
    medianPitchHz:110,
    medianMidiFloat:45,
    medianVoicedProbability:0.95,
    velocity:90
  };
  const contour = {
    timeSeconds:0.5,
    frequencyHz:110,
    midiFloat:45,
    voicedProbability:0.95
  };

  fs.writeFileSync(path.join(dir,"drums-only.mid"),midiOneNote(36,9));
  fs.writeFileSync(path.join(dir,"drums-bass-kick-fusion.mid"),midiOneNote(36,9));
  fs.writeFileSync(path.join(dir,"bass-pyin.mid"),midiOneNote(45,0));

  const result = {
    schema:"fame-owned-beats-audio-to-midi-development-baseline-result-v1",
    version:1,
    runId,
    sourceRecordId:rid,
    compositionFamilyId:`family-${i+1}`,
    sourceSeparation:{
      runId:"source-separation-development-inference-v1-001",
      drumsStemSha256:"drums-sha",
      bassStemSha256:"bass-sha"
    },
    timing:{
      bpm:120,
      bpmSource:"audio-analysis-v2-config-001 development estimated output",
      humanReferenceUsedAsInput:false,
      midiPpq:480
    },
    drumsOnly:{
      armId:"drums-only-spectral-onset-v1",
      events:[event],
      eventCount:1,
      roleCounts:{kick:1,snare:0,hihat:0},
      midiFile:"drums-only.mid"
    },
    drumsBassKickFusion:{
      armId:"drums-bass-kick-fusion-v1",
      events:[fusion],
      eventCount:1,
      bassKickCandidateCount:1,
      roleCounts:{kick:1,snare:0,hihat:0},
      midiFile:"drums-bass-kick-fusion.mid"
    },
    lowEndPyin:{
      armId:"librosa-pyin-lowend-v1",
      notes:[note],
      noteCount:1,
      pitchContour:[contour],
      voicedFrameCount:1,
      frameCount:10,
      midiFile:"bass-pyin.mid"
    },
    safety:{
      split:"development",
      finalHoldoutAccessed:false,
      batch131Accessed:false,
      trainingAuthorized:false,
      taskDataReadyMayBeDeclared:false
    }
  };
  const resultFile=path.join(dir,"result.json");
  fs.writeFileSync(resultFile,JSON.stringify(result,null,2)+"\n");
  summaryRows.push({
    sourceRecordId:rid,
    resultSha256:sha256(resultFile),
    drumsOnlyEvents:1,
    fusionEvents:1,
    bassNotes:1
  });
}

fs.writeFileSync(path.join(runDir,"summary.json"),JSON.stringify({
  schema:"fame-owned-beats-audio-to-midi-development-baseline-summary-v1",
  version:1,
  status:"BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
  runId,
  records:8,
  protocolSha256:sha256(protocolFile),
  results:summaryRows,
  safety:{
    split:"development",
    finalHoldoutAccessed:false,
    batch131Accessed:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false
  },
  nextAction:"RUN_AUDIO_TO_MIDI_BASELINE_QA_AND_PREPARE_BASIC_PITCH_ARM"
},null,2)+"\n");

try {
  const result=qa.technical(workspace,runId);
  assert.equal(result.mode,"AUDIO_TO_MIDI_DEVELOPMENT_TECHNICAL_QA_PASS");
  assert.equal(result.technicalGate,"ALL_8_FAMILIES_PASS");
  assert.equal(result.recordsVerified,8);
  assert.equal(result.midiFilesVerified,24);
  assert.equal(result.finalHoldoutAccessedByThisCommand,false);
  assert.equal(result.batch131AccessedByThisCommand,false);
  assert.equal(result.trainingAuthorized,false);

  const corrupt=path.join(runDir,ids[0],"drums-only.mid");
  fs.appendFileSync(corrupt,Buffer.from([0x00]));
  assert.throws(()=>qa.technical(workspace,runId),/MIDI track length mismatch/);
} finally {
  fs.rmSync(workspace,{recursive:true,force:true});
}

console.log("owned-beats-audio-to-midi-development-qa-test: PASS");
