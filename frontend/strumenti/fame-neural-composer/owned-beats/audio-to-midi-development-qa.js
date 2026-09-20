"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const PROTOCOL_FILE = path.join(HERE, "audio-to-midi-development-protocol-v1.json");
const DEFAULT_RUN_ID = "audio-to-midi-development-baseline-v1-001";
const EXPECTED_IDS = [
  "FAME000011",
  "FAME000012",
  "FAME000023",
  "FAME000040",
  "FAME000046",
  "FAME000058",
  "FAME000080",
  "FAME000126"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function sha256File(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    while (true) {
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!bytes) break;
      h.update(buffer.subarray(0, bytes));
    }
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex");
}

function finiteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Non-finite numeric value at ${label}`);
  }
  return value;
}

function safeRunId(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(value || "")) {
    throw new Error("Invalid run-id");
  }
  return value;
}

function readVlq(buffer, offset) {
  let value = 0;
  let bytes = 0;
  while (offset + bytes < buffer.length && bytes < 4) {
    const octet = buffer[offset + bytes];
    value = (value << 7) | (octet & 0x7f);
    bytes += 1;
    if ((octet & 0x80) === 0) return { value, bytes };
  }
  throw new Error("Invalid MIDI VLQ");
}

function validateMidi(file, label) {
  const b = fs.readFileSync(file);
  if (b.length < 22 || b.toString("ascii", 0, 4) !== "MThd") {
    throw new Error(`Invalid MIDI header: ${label}`);
  }
  const headerLength = b.readUInt32BE(4);
  if (headerLength !== 6) throw new Error(`Unsupported MIDI header length: ${label}`);
  const format = b.readUInt16BE(8);
  const tracks = b.readUInt16BE(10);
  const division = b.readUInt16BE(12);
  if (format !== 0 || tracks !== 1 || division !== 480) {
    throw new Error(`Unexpected MIDI format/tracks/PPQ: ${label}`);
  }
  if (b.toString("ascii", 14, 18) !== "MTrk") {
    throw new Error(`Missing MIDI track: ${label}`);
  }
  const trackLength = b.readUInt32BE(18);
  if (22 + trackLength !== b.length) {
    throw new Error(`MIDI track length mismatch: ${label}`);
  }

  let offset = 22;
  let runningStatus = null;
  let noteOnCount = 0;
  let noteOffCount = 0;
  let tempoCount = 0;
  let endOfTrack = false;

  while (offset < b.length) {
    const delta = readVlq(b, offset);
    offset += delta.bytes;
    if (offset >= b.length) throw new Error(`Truncated MIDI event: ${label}`);

    let status = b[offset];
    if (status < 0x80) {
      if (runningStatus === null) throw new Error(`Invalid MIDI running status: ${label}`);
      status = runningStatus;
    } else {
      offset += 1;
      if (status < 0xf0) runningStatus = status;
    }

    if (status === 0xff) {
      if (offset >= b.length) throw new Error(`Truncated MIDI meta event: ${label}`);
      const type = b[offset++];
      const len = readVlq(b, offset);
      offset += len.bytes;
      if (offset + len.value > b.length) throw new Error(`Truncated MIDI meta payload: ${label}`);
      if (type === 0x51) {
        if (len.value !== 3) throw new Error(`Invalid MIDI tempo event: ${label}`);
        tempoCount += 1;
      }
      if (type === 0x2f) {
        if (len.value !== 0) throw new Error(`Invalid MIDI end-of-track: ${label}`);
        endOfTrack = true;
      }
      offset += len.value;
      continue;
    }

    const kind = status & 0xf0;
    if (kind === 0x80 || kind === 0x90) {
      const usesRunning = b[offset - 1] < 0x80;
      if (offset + 2 > b.length) throw new Error(`Truncated MIDI note event: ${label}`);
      const note = b[offset++];
      const velocity = b[offset++];
      if (note > 127 || velocity > 127) throw new Error(`Invalid MIDI note data: ${label}`);
      if (kind === 0x90 && velocity > 0) noteOnCount += 1;
      else noteOffCount += 1;
      void usesRunning;
      continue;
    }

    const dataBytes = [0xc0, 0xd0].includes(kind) ? 1 : 2;
    if (offset + dataBytes > b.length) throw new Error(`Truncated MIDI channel event: ${label}`);
    offset += dataBytes;
  }

  if (!endOfTrack || tempoCount !== 1 || noteOnCount !== noteOffCount) {
    throw new Error(`Invalid MIDI event balance: ${label}`);
  }

  return {
    sha256: sha256File(file),
    bytes: b.length,
    noteOnCount,
    noteOffCount,
    tempoCount,
    ppq: division
  };
}

function validateDrumEvent(event, arm, index) {
  finiteNumber(event.timeSeconds, `${arm}.events[${index}].timeSeconds`);
  if (event.timeSeconds < 0) throw new Error(`Negative drum time at ${arm}[${index}]`);
  if (!Number.isInteger(event.frame) || event.frame < 0) throw new Error(`Invalid drum frame at ${arm}[${index}]`);
  if (!["kick", "snare", "hihat"].includes(event.role)) throw new Error(`Invalid drum role at ${arm}[${index}]`);
  const expectedNote = { kick: 36, snare: 38, hihat: 42 }[event.role];
  if (event.midiNote !== expectedNote) throw new Error(`Drum MIDI note mismatch at ${arm}[${index}]`);
  if (!Number.isInteger(event.velocity) || event.velocity < 1 || event.velocity > 127) {
    throw new Error(`Invalid drum velocity at ${arm}[${index}]`);
  }
  if (!["drums", "bass", "drums+bass"].includes(event.sourceStem)) {
    throw new Error(`Invalid drum source stem at ${arm}[${index}]`);
  }
}

function validateLowEnd(result, rid) {
  const low = result.lowEndPyin;
  if (!low || low.armId !== "librosa-pyin-lowend-v1") {
    throw new Error(`Missing pYIN low-end arm: ${rid}`);
  }
  if (!Array.isArray(low.notes) || low.noteCount !== low.notes.length) {
    throw new Error(`Low-end note count mismatch: ${rid}`);
  }
  if (!Array.isArray(low.pitchContour)) throw new Error(`Low-end pitch contour missing: ${rid}`);
  if (!Number.isInteger(low.voicedFrameCount) || !Number.isInteger(low.frameCount)
      || low.voicedFrameCount < 0 || low.frameCount < low.voicedFrameCount) {
    throw new Error(`Invalid low-end frame counts: ${rid}`);
  }

  for (const [i, note] of low.notes.entries()) {
    finiteNumber(note.startSeconds, `${rid}.lowEnd.notes[${i}].startSeconds`);
    finiteNumber(note.endSeconds, `${rid}.lowEnd.notes[${i}].endSeconds`);
    finiteNumber(note.durationSeconds, `${rid}.lowEnd.notes[${i}].durationSeconds`);
    finiteNumber(note.medianPitchHz, `${rid}.lowEnd.notes[${i}].medianPitchHz`);
    finiteNumber(note.medianMidiFloat, `${rid}.lowEnd.notes[${i}].medianMidiFloat`);
    finiteNumber(note.medianVoicedProbability, `${rid}.lowEnd.notes[${i}].medianVoicedProbability`);
    if (!(note.endSeconds > note.startSeconds) || note.durationSeconds <= 0) {
      throw new Error(`Invalid low-end note timing: ${rid}[${i}]`);
    }
    if (!Number.isInteger(note.midiNote) || note.midiNote < 0 || note.midiNote > 127) {
      throw new Error(`Invalid low-end MIDI note: ${rid}[${i}]`);
    }
    if (!Number.isInteger(note.velocity) || note.velocity < 1 || note.velocity > 127) {
      throw new Error(`Invalid low-end velocity: ${rid}[${i}]`);
    }
  }

  for (const [i, point] of low.pitchContour.entries()) {
    finiteNumber(point.timeSeconds, `${rid}.contour[${i}].timeSeconds`);
    finiteNumber(point.frequencyHz, `${rid}.contour[${i}].frequencyHz`);
    finiteNumber(point.midiFloat, `${rid}.contour[${i}].midiFloat`);
    finiteNumber(point.voicedProbability, `${rid}.contour[${i}].voicedProbability`);
    if (point.frequencyHz <= 0 || point.voicedProbability < 0 || point.voicedProbability > 1) {
      throw new Error(`Invalid low-end contour point: ${rid}[${i}]`);
    }
  }
}

function technical(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const workspace = path.resolve(workspaceRoot);
  const protocol = readJson(PROTOCOL_FILE);
  const runDir = path.join(workspace, "runs", "audio-to-midi-development-baseline", runId);
  const summaryFile = path.join(runDir, "summary.json");

  if (
    protocol.schema !== "fame-owned-beats-audio-to-midi-development-protocol-v1" ||
    protocol.version !== 1 ||
    protocol.status !== "FROZEN_BEFORE_FIRST_TRANSCRIPTION_OUTPUT" ||
    protocol.scope?.split !== "development" ||
    protocol.scope?.expectedFamilies !== 8 ||
    protocol.scope?.finalHoldoutAccessAllowed !== false ||
    protocol.scope?.batch131Authorized !== false ||
    protocol.scope?.trainingAuthorized !== false
  ) {
    throw new Error("Frozen Audio→MIDI protocol invalid");
  }

  if (!fs.existsSync(summaryFile)) throw new Error(`Audio→MIDI summary missing: ${summaryFile}`);
  const summary = readJson(summaryFile);
  if (
    summary.schema !== "fame-owned-beats-audio-to-midi-development-baseline-summary-v1" ||
    summary.version !== 1 ||
    summary.status !== "BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA" ||
    summary.runId !== runId ||
    summary.records !== 8 ||
    summary.protocolSha256 !== sha256File(PROTOCOL_FILE) ||
    summary.safety?.split !== "development" ||
    summary.safety?.finalHoldoutAccessed !== false ||
    summary.safety?.batch131Accessed !== false ||
    summary.safety?.trainingAuthorized !== false ||
    summary.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Audio→MIDI summary does not match frozen protocol/safety");
  }

  if (!Array.isArray(summary.results) || summary.results.length !== 8) {
    throw new Error("Audio→MIDI summary result coverage mismatch");
  }
  const summaryIds = summary.results.map(x => x.sourceRecordId);
  if (JSON.stringify(summaryIds) !== JSON.stringify(EXPECTED_IDS)) {
    throw new Error(`Audio→MIDI summary source IDs/order mismatch: ${summaryIds.join(",")}`);
  }

  const diagnostics = [];
  let midiVerified = 0;

  for (const row of summary.results) {
    const rid = row.sourceRecordId;
    const familyDir = path.join(runDir, rid);
    const resultFile = path.join(familyDir, "result.json");
    if (!fs.existsSync(resultFile) || sha256File(resultFile) !== row.resultSha256) {
      throw new Error(`Audio→MIDI result receipt SHA mismatch: ${rid}`);
    }

    const result = readJson(resultFile);
    if (
      result.schema !== "fame-owned-beats-audio-to-midi-development-baseline-result-v1" ||
      result.version !== 1 ||
      result.runId !== runId ||
      result.sourceRecordId !== rid ||
      result.timing?.humanReferenceUsedAsInput !== false ||
      result.timing?.midiPpq !== 480 ||
      result.safety?.split !== "development" ||
      result.safety?.finalHoldoutAccessed !== false ||
      result.safety?.batch131Accessed !== false ||
      result.safety?.trainingAuthorized !== false ||
      result.safety?.taskDataReadyMayBeDeclared !== false
    ) {
      throw new Error(`Audio→MIDI result contract invalid: ${rid}`);
    }

    finiteNumber(result.timing.bpm, `${rid}.timing.bpm`);
    if (result.timing.bpm <= 0) throw new Error(`Invalid BPM: ${rid}`);

    const drumsOnly = result.drumsOnly;
    const fusion = result.drumsBassKickFusion;
    if (
      drumsOnly?.armId !== "drums-only-spectral-onset-v1" ||
      fusion?.armId !== "drums-bass-kick-fusion-v1" ||
      !Array.isArray(drumsOnly.events) ||
      !Array.isArray(fusion.events) ||
      drumsOnly.eventCount !== drumsOnly.events.length ||
      fusion.eventCount !== fusion.events.length ||
      row.drumsOnlyEvents !== drumsOnly.eventCount ||
      row.fusionEvents !== fusion.eventCount
    ) {
      throw new Error(`Drum arm/result counts invalid: ${rid}`);
    }

    drumsOnly.events.forEach((event, index) => validateDrumEvent(event, `${rid}.drumsOnly`, index));
    fusion.events.forEach((event, index) => validateDrumEvent(event, `${rid}.fusion`, index));

    for (const arm of [drumsOnly, fusion]) {
      const counted = { kick: 0, snare: 0, hihat: 0 };
      for (const event of arm.events) counted[event.role] += 1;
      for (const role of Object.keys(counted)) {
        if (arm.roleCounts?.[role] !== counted[role]) {
          throw new Error(`Drum role count mismatch: ${rid}/${arm.armId}/${role}`);
        }
      }
    }

    validateLowEnd(result, rid);
    if (row.bassNotes !== result.lowEndPyin.noteCount) {
      throw new Error(`Low-end summary note count mismatch: ${rid}`);
    }

    const midi = {};
    const mappings = [
      ["drumsOnly", drumsOnly.midiFile, drumsOnly.eventCount],
      ["drumsBassKickFusion", fusion.midiFile, fusion.eventCount],
      ["lowEndPyin", result.lowEndPyin.midiFile, result.lowEndPyin.noteCount]
    ];
    for (const [key, name, expectedNotes] of mappings) {
      const file = path.join(familyDir, name);
      if (!fs.existsSync(file)) throw new Error(`MIDI missing: ${rid}/${name}`);
      const checked = validateMidi(file, `${rid}/${name}`);
      if (checked.noteOnCount !== expectedNotes) {
        throw new Error(`MIDI/result event count mismatch: ${rid}/${name}`);
      }
      midi[key] = checked;
      midiVerified += 1;
    }

    diagnostics.push({
      sourceRecordId: rid,
      bpm: result.timing.bpm,
      drumsOnly: {
        eventCount: drumsOnly.eventCount,
        roleCounts: drumsOnly.roleCounts
      },
      drumsBassKickFusion: {
        eventCount: fusion.eventCount,
        bassKickCandidateCount: fusion.bassKickCandidateCount,
        roleCounts: fusion.roleCounts
      },
      lowEndPyin: {
        noteCount: result.lowEndPyin.noteCount,
        voicedFrameCount: result.lowEndPyin.voicedFrameCount,
        frameCount: result.lowEndPyin.frameCount,
        contourPointCount: result.lowEndPyin.pitchContour.length
      },
      midi
    });
  }

  return {
    mode: "AUDIO_TO_MIDI_DEVELOPMENT_TECHNICAL_QA_PASS",
    runId,
    technicalGate: "ALL_8_FAMILIES_PASS",
    recordsVerified: diagnostics.length,
    midiFilesVerified: midiVerified,
    diagnostics,
    diagnosticsAreNotMusicalQualityScores: true,
    finalHoldoutAccessedByThisCommand: false,
    batch131AccessedByThisCommand: false,
    trainingAuthorized: false,
    taskDataReadyMayBeDeclared: false,
    nextAction: "PERFORM_FROZEN_HUMAN_QA_AND_PREPARE_BASIC_PITCH_ARM"
  };
}

function main(args = process.argv.slice(2)) {
  const [command, workspace, runId] = args;
  if (command !== "technical" || !workspace) {
    throw new Error("Usage: node audio-to-midi-development-qa.js technical <workspace> [run-id]");
  }
  process.stdout.write(JSON.stringify(technical(workspace, runId || DEFAULT_RUN_ID), null, 2) + "\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  technical,
  validateMidi
};
