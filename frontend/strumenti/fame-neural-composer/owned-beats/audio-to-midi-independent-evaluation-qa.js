"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const PROTOCOL_FILE = path.join(HERE, "audio-to-midi-independent-evaluation-v1.json");
const EXECUTION_CONTRACT_FILE = path.join(HERE, "audio-to-midi-independent-evaluation-execution-v1.json");
const COHORT_FILE = path.join(HERE, "audio-to-midi-independent-evaluation-cohort-v1.json");
const DEFAULT_RUN_ID = "audio-to-midi-independent-evaluation-v1-001";
const COHORT_ID = "audio-to-midi-independent-evaluation-v1";
const SPLIT = "audio-to-midi-evaluation-v1";
const EXPECTED_IDS = [
  "FAME000001", "FAME000102", "FAME000006", "FAME000129",
  "FAME000020", "FAME000073", "FAME000092", "FAME000121",
  "FAME000010", "FAME000071", "FAME000116", "FAME000101"
];
const EXPECTED_STEMS = ["drums", "bass", "other", "vocals"];

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

function validateMidi(file, label, expectedChannel, expectedNoteOnCount, allowedNotes = null) {
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
  const channels = new Set();
  const notes = new Set();

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

    if (status >= 0xf0) throw new Error(`Unsupported MIDI system event: ${label}`);

    const kind = status & 0xf0;
    const channel = status & 0x0f;
    if (kind === 0x80 || kind === 0x90) {
      if (offset + 2 > b.length) throw new Error(`Truncated MIDI note event: ${label}`);
      const note = b[offset++];
      const velocity = b[offset++];
      if (note > 127 || velocity > 127) throw new Error(`Invalid MIDI note data: ${label}`);
      channels.add(channel);
      notes.add(note);
      if (kind === 0x90 && velocity > 0) noteOnCount += 1;
      else noteOffCount += 1;
      continue;
    }

    const dataBytes = [0xc0, 0xd0].includes(kind) ? 1 : 2;
    if (offset + dataBytes > b.length) throw new Error(`Truncated MIDI channel event: ${label}`);
    offset += dataBytes;
  }

  if (!endOfTrack || tempoCount !== 1 || noteOnCount !== noteOffCount) {
    throw new Error(`Invalid MIDI event balance: ${label}`);
  }
  if (noteOnCount !== expectedNoteOnCount) {
    throw new Error(`MIDI/result event count mismatch: ${label}`);
  }
  if ([...channels].some(channel => channel !== expectedChannel)) {
    throw new Error(`Unexpected MIDI channel: ${label}`);
  }
  if (allowedNotes && [...notes].some(note => !allowedNotes.has(note))) {
    throw new Error(`Unexpected MIDI note for selected arm: ${label}`);
  }

  return {
    sha256: sha256File(file),
    bytes: b.length,
    noteOnCount,
    noteOffCount,
    tempoCount,
    ppq: division,
    channels: [...channels].sort((a, b2) => a - b2),
    notes: [...notes].sort((a, b2) => a - b2)
  };
}

function validateDrumEvent(event, rid, index) {
  finiteNumber(event.timeSeconds, `${rid}.drums.events[${index}].timeSeconds`);
  if (event.timeSeconds < 0) throw new Error(`Negative drum time: ${rid}[${index}]`);
  if (!Number.isInteger(event.frame) || event.frame < 0) throw new Error(`Invalid drum frame: ${rid}[${index}]`);
  if (!["kick", "snare", "hihat"].includes(event.role)) throw new Error(`Invalid drum role: ${rid}[${index}]`);
  const expectedNote = { kick: 36, snare: 38, hihat: 42 }[event.role];
  if (event.midiNote !== expectedNote) throw new Error(`Drum MIDI note mismatch: ${rid}[${index}]`);
  if (!Number.isInteger(event.velocity) || event.velocity < 1 || event.velocity > 127) {
    throw new Error(`Invalid drum velocity: ${rid}[${index}]`);
  }
  if (!["drums", "bass", "drums+bass"].includes(event.sourceStem)) {
    throw new Error(`Invalid drum source stem: ${rid}[${index}]`);
  }
}

function validateLowEnd(low, rid) {
  if (!low || low.armId !== "librosa-pyin-lowend-v1") {
    throw new Error(`Missing selected low-end arm: ${rid}`);
  }
  if (!Array.isArray(low.notes) || low.noteCount !== low.notes.length) {
    throw new Error(`Low-end note count mismatch: ${rid}`);
  }
  if (!Array.isArray(low.pitchContour)) throw new Error(`Low-end pitch contour missing: ${rid}`);
  if (!Number.isInteger(low.voicedFrameCount) || !Number.isInteger(low.frameCount)
      || low.voicedFrameCount < 0 || low.frameCount < low.voicedFrameCount
      || low.pitchContour.length !== low.voicedFrameCount) {
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
    if (note.medianPitchHz <= 0 || note.medianVoicedProbability < 0 || note.medianVoicedProbability > 1) {
      throw new Error(`Invalid low-end note metrics: ${rid}[${i}]`);
    }
  }

  for (const [i, point] of low.pitchContour.entries()) {
    finiteNumber(point.timeSeconds, `${rid}.lowEnd.pitchContour[${i}].timeSeconds`);
    finiteNumber(point.frequencyHz, `${rid}.lowEnd.pitchContour[${i}].frequencyHz`);
    finiteNumber(point.midiFloat, `${rid}.lowEnd.pitchContour[${i}].midiFloat`);
    finiteNumber(point.voicedProbability, `${rid}.lowEnd.pitchContour[${i}].voicedProbability`);
    if (point.timeSeconds < 0 || point.frequencyHz <= 0 || point.voicedProbability < 0 || point.voicedProbability > 1) {
      throw new Error(`Invalid low-end contour point: ${rid}[${i}]`);
    }
  }
}

function sameArray(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function technical(workspaceRoot, runId = DEFAULT_RUN_ID) {
  runId = safeRunId(runId);
  const workspace = path.resolve(workspaceRoot);
  const protocol = readJson(PROTOCOL_FILE);
  const contract = readJson(EXECUTION_CONTRACT_FILE);
  const cohort = readJson(COHORT_FILE);
  const runDir = path.join(workspace, "runs", "audio-to-midi-independent-evaluation-execution", runId);
  const receiptFile = path.join(runDir, "execution-receipt.json");
  const summaryFile = path.join(runDir, "summary.json");

  for (const file of [PROTOCOL_FILE, EXECUTION_CONTRACT_FILE, COHORT_FILE, receiptFile, summaryFile]) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new Error(`Required technical QA artifact missing: ${file}`);
    }
  }

  if (
    protocol.schema !== "fame-owned-beats-audio-to-midi-independent-evaluation-protocol-v1" ||
    protocol.version !== 1 ||
    protocol.status !== "FROZEN_BEFORE_FRESH_COHORT_SELECTION" ||
    protocol.cohort?.cohortId !== COHORT_ID ||
    protocol.cohort?.plannedSplit !== SPLIT ||
    protocol.cohort?.expectedFamilies !== 12 ||
    protocol.gate?.technical !== "ALL_12_FAMILIES_PASS" ||
    protocol.frozenPipeline?.drums?.armId !== "drums-bass-kick-fusion-v1" ||
    protocol.frozenPipeline?.lowEnd?.armId !== "librosa-pyin-lowend-v1" ||
    protocol.frozenPipeline?.basicPitch?.mayReenterThisEvaluation !== false ||
    protocol.safety?.evaluationMayRetunePipeline !== false ||
    protocol.safety?.batch131Authorized !== false ||
    protocol.safety?.trainingAuthorized !== false ||
    protocol.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Frozen independent evaluation protocol invalid");
  }

  if (
    contract.schema !== "fame-owned-beats-audio-to-midi-independent-evaluation-execution-v1" ||
    contract.version !== 1 ||
    contract.status !== "FROZEN_BEFORE_FIRST_EVALUATION_AUDIO_ACCESS" ||
    contract.runId !== runId ||
    contract.cohortId !== COHORT_ID ||
    contract.split !== SPLIT ||
    contract.expectedFamilies !== 12 ||
    contract.pipeline?.sourceSeparation?.armId !== "intel-openvino-htdemucs-v4-97fc578" ||
    contract.pipeline?.drums?.armId !== "drums-bass-kick-fusion-v1" ||
    contract.pipeline?.lowEnd?.armId !== "librosa-pyin-lowend-v1" ||
    contract.pipeline?.basicPitch?.enabled !== false ||
    contract.retuningAllowed !== false ||
    contract.qa?.technicalBeforeHuman !== true ||
    contract.qa?.humanReviewMustNotRetunePipeline !== true ||
    contract.safety?.batch131Authorized !== false ||
    contract.safety?.trainingAuthorized !== false ||
    contract.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Frozen independent evaluation execution contract invalid");
  }

  if (
    cohort.schema !== "fame-owned-beats-audio-to-midi-evaluation-cohort-reference-v1" ||
    cohort.version !== 1 ||
    cohort.status !== "FROZEN_FRESH_COHORT_BEFORE_AUDIO_ACCESS" ||
    cohort.cohortId !== COHORT_ID ||
    cohort.plannedSplit !== SPLIT ||
    cohort.expectedFamilies !== 12 ||
    cohort.cohortDigestSha256 !== contract.cohortDigestSha256 ||
    !Array.isArray(cohort.records) ||
    !sameArray(cohort.records.map(x => x.sourceRecordId), EXPECTED_IDS)
  ) {
    throw new Error("Frozen independent evaluation cohort invalid");
  }

  const receipt = readJson(receiptFile);
  if (
    receipt.schema !== "fame-owned-beats-audio-to-midi-independent-evaluation-execution-receipt-v1" ||
    receipt.version !== 1 ||
    receipt.status !== "AUTHORIZED_NO_EVALUATION_AUDIO_ACCESSED" ||
    receipt.runId !== runId ||
    receipt.cohortId !== COHORT_ID ||
    receipt.split !== SPLIT ||
    receipt.expectedFamilies !== 12 ||
    receipt.cohortDigestSha256 !== contract.cohortDigestSha256 ||
    !Array.isArray(receipt.sources) ||
    receipt.sources.length !== 12 ||
    !sameArray(receipt.sources.map(x => x.sourceRecordId), EXPECTED_IDS) ||
    receipt.evidence?.evaluationAudioOpenedByPrepareCommand !== false ||
    receipt.evidence?.sourceSeparationExecutedByPrepareCommand !== false ||
    receipt.evidence?.transcriptionExecutedByPrepareCommand !== false ||
    receipt.evidence?.humanReferenceUsedAsInput !== false ||
    receipt.safety?.retuningAllowed !== false ||
    receipt.safety?.batch131Authorized !== false ||
    receipt.safety?.trainingAuthorized !== false ||
    receipt.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Independent evaluation execution receipt invalid");
  }

  const summary = readJson(summaryFile);
  if (
    summary.schema !== "fame-owned-beats-audio-to-midi-independent-evaluation-summary-v1" ||
    summary.version !== 1 ||
    summary.status !== "EVALUATION_OUTPUT_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA" ||
    summary.runId !== runId ||
    summary.cohortId !== COHORT_ID ||
    summary.split !== SPLIT ||
    summary.records !== 12 ||
    summary.cohortDigestSha256 !== contract.cohortDigestSha256 ||
    summary.selectedDrumsArm !== "drums-bass-kick-fusion-v1" ||
    summary.selectedLowEndArm !== "librosa-pyin-lowend-v1" ||
    summary.basicPitchExecuted !== false ||
    summary.humanReferenceUsedAsInput !== false ||
    summary.retuningPerformed !== false ||
    summary.safety?.batch131Authorized !== false ||
    summary.safety?.trainingAuthorized !== false ||
    summary.safety?.taskDataReadyMayBeDeclared !== false ||
    !Array.isArray(summary.results) ||
    summary.results.length !== 12 ||
    !sameArray(summary.results.map(x => x.sourceRecordId), EXPECTED_IDS)
  ) {
    throw new Error("Independent evaluation summary invalid");
  }

  const receiptById = new Map(receipt.sources.map(x => [x.sourceRecordId, x]));
  const cohortById = new Map(cohort.records.map(x => [x.sourceRecordId, x]));
  const diagnostics = [];
  let stemFilesVerified = 0;
  let midiFilesVerified = 0;

  for (const row of summary.results) {
    const rid = row.sourceRecordId;
    const source = receiptById.get(rid);
    const frozen = cohortById.get(rid);
    if (!source || !frozen) throw new Error(`Evaluation identity missing: ${rid}`);

    for (const field of ["compositionFamilyId", "sourceRecordId", "sourceAssetId"]) {
      if (source[field] !== frozen[field]) throw new Error(`Frozen identity mismatch ${field}: ${rid}`);
    }
    if (source.sha256 !== frozen.sha256) throw new Error(`Frozen source SHA mismatch: ${rid}`);

    const familyDir = path.join(runDir, "results", rid);
    const resultFile = path.join(familyDir, "result.json");
    if (!fs.existsSync(resultFile) || !fs.statSync(resultFile).isFile()) {
      throw new Error(`Evaluation result missing: ${rid}`);
    }
    if (sha256File(resultFile) !== row.resultSha256) {
      throw new Error(`Evaluation result receipt SHA mismatch: ${rid}`);
    }

    const result = readJson(resultFile);
    if (
      result.schema !== "fame-owned-beats-audio-to-midi-independent-evaluation-family-v1" ||
      result.version !== 1 ||
      result.runId !== runId ||
      result.cohortId !== COHORT_ID ||
      result.split !== SPLIT ||
      result.sourceRecordId !== rid ||
      result.compositionFamilyId !== source.compositionFamilyId ||
      result.sourceAssetId !== source.sourceAssetId ||
      result.sourceSha256 !== source.sha256 ||
      result.bpmSource !== "audio-analysis-v2-config-001 autonomous frozen V1 BPM" ||
      result.humanReferenceUsedAsInput !== false ||
      result.retuningPerformed !== false ||
      result.sourceSeparation?.armId !== "intel-openvino-htdemucs-v4-97fc578" ||
      result.sourceSeparation?.modelRevision !== contract.pipeline.sourceSeparation.modelRevision ||
      result.drums?.armId !== "drums-bass-kick-fusion-v1" ||
      result.lowEnd?.armId !== "librosa-pyin-lowend-v1" ||
      result.safety?.batch131Authorized !== false ||
      result.safety?.trainingAuthorized !== false ||
      result.safety?.taskDataReadyMayBeDeclared !== false
    ) {
      throw new Error(`Evaluation family result contract invalid: ${rid}`);
    }

    finiteNumber(result.bpm, `${rid}.bpm`);
    if (result.bpm <= 0) throw new Error(`Invalid BPM: ${rid}`);

    const tech = result.sourceSeparation.technicalValidation || {};
    if (
      tech.allStemsFinite !== true ||
      tech.allStemsStereo !== true ||
      tech.allStemsSampleRate44100 !== true ||
      tech.allStemsSameSamplesAsSource !== true
    ) {
      throw new Error(`Source Separation technical gate failed: ${rid}`);
    }

    const stemNames = Object.keys(result.stems || {}).sort();
    if (!sameArray(stemNames, [...EXPECTED_STEMS].sort())) {
      throw new Error(`Unexpected stem set: ${rid}`);
    }
    const sampleCounts = new Set();
    for (const stem of EXPECTED_STEMS) {
      const meta = result.stems[stem];
      const stemFile = path.join(familyDir, "stems", `${stem}.wav`);
      if (
        !fs.existsSync(stemFile) || !fs.statSync(stemFile).isFile() ||
        sha256File(stemFile) !== meta.sha256 ||
        meta.sampleRate !== 44100 || meta.channels !== 2 ||
        !Number.isInteger(meta.samplesPerChannel) || meta.samplesPerChannel <= 0
      ) {
        throw new Error(`Stem artifact verification failed: ${rid}/${stem}`);
      }
      sampleCounts.add(meta.samplesPerChannel);
      stemFilesVerified += 1;
    }
    if (sampleCounts.size !== 1) throw new Error(`Stem sample-count mismatch: ${rid}`);

    const drums = result.drums;
    if (
      !Array.isArray(drums.events) ||
      drums.eventCount !== drums.events.length ||
      !Number.isInteger(drums.bassKickCandidateCount) || drums.bassKickCandidateCount < 0 ||
      drums.midiFile !== "drums.mid"
    ) {
      throw new Error(`Selected drums result invalid: ${rid}`);
    }
    drums.events.forEach((event, index) => validateDrumEvent(event, rid, index));
    const countedRoles = { kick: 0, snare: 0, hihat: 0 };
    for (const event of drums.events) countedRoles[event.role] += 1;
    for (const role of Object.keys(countedRoles)) {
      if (drums.roleCounts?.[role] !== countedRoles[role]) {
        throw new Error(`Drum role count mismatch: ${rid}/${role}`);
      }
    }

    validateLowEnd(result.lowEnd, rid);
    if (result.lowEnd.midiFile !== "low-end.mid") {
      throw new Error(`Selected low-end MIDI filename invalid: ${rid}`);
    }

    const drumsMidiFile = path.join(familyDir, "drums.mid");
    const lowEndMidiFile = path.join(familyDir, "low-end.mid");
    for (const file of [drumsMidiFile, lowEndMidiFile]) {
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        throw new Error(`MIDI missing: ${rid}/${path.basename(file)}`);
      }
    }
    if (sha256File(drumsMidiFile) !== result.drumsMidiSha256 || result.drumsMidiSha256 !== row.drumsMidiSha256) {
      throw new Error(`Drums MIDI SHA mismatch: ${rid}`);
    }
    if (sha256File(lowEndMidiFile) !== result.lowEndMidiSha256 || result.lowEndMidiSha256 !== row.lowEndMidiSha256) {
      throw new Error(`Low-end MIDI SHA mismatch: ${rid}`);
    }

    const drumsMidi = validateMidi(drumsMidiFile, `${rid}/drums.mid`, 9, drums.eventCount, new Set([36, 38, 42]));
    const lowEndMidi = validateMidi(lowEndMidiFile, `${rid}/low-end.mid`, 0, result.lowEnd.noteCount, null);
    midiFilesVerified += 2;

    diagnostics.push({
      sourceRecordId: rid,
      bpm: result.bpm,
      stemsVerified: EXPECTED_STEMS.length,
      stemSamplesPerChannel: [...sampleCounts][0],
      drums: {
        eventCount: drums.eventCount,
        bassKickCandidateCount: drums.bassKickCandidateCount,
        roleCounts: drums.roleCounts,
        midi: drumsMidi
      },
      lowEnd: {
        noteCount: result.lowEnd.noteCount,
        voicedFrameCount: result.lowEnd.voicedFrameCount,
        frameCount: result.lowEnd.frameCount,
        contourPointCount: result.lowEnd.pitchContour.length,
        midi: lowEndMidi
      }
    });
  }

  if (diagnostics.length !== 12 || stemFilesVerified !== 48 || midiFilesVerified !== 24) {
    throw new Error(
      `Technical QA coverage mismatch: records=${diagnostics.length}, stems=${stemFilesVerified}, midi=${midiFilesVerified}`
    );
  }

  return {
    mode: "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_TECHNICAL_QA_PASS",
    runId,
    cohortId: COHORT_ID,
    technicalGate: "ALL_12_FAMILIES_PASS",
    recordsVerified: diagnostics.length,
    stemFilesVerified,
    midiFilesVerified,
    selectedDrumsArm: "drums-bass-kick-fusion-v1",
    selectedLowEndArm: "librosa-pyin-lowend-v1",
    diagnostics,
    diagnosticsAreNotMusicalQualityScores: true,
    evaluationSourceAudioOpenedByThisCommand: false,
    humanReferenceUsedAsInput: false,
    retuningPerformedByThisCommand: false,
    basicPitchExecutedByThisCommand: false,
    batch131AccessedByThisCommand: false,
    trainingAuthorized: false,
    taskDataReadyMayBeDeclared: false,
    nextAction: "PREPARE_AND_RUN_BLIND_HUMAN_QA_ON_12_EVALUATION_FAMILIES"
  };
}

function main(args = process.argv.slice(2)) {
  const [command, workspace, runId] = args;
  if (command !== "technical" || !workspace) {
    throw new Error(
      "Usage: node audio-to-midi-independent-evaluation-qa.js technical <workspace> [run-id]"
    );
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
  validateMidi,
  validateDrumEvent,
  validateLowEnd
};
