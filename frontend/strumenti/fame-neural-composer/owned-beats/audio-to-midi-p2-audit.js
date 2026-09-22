"use strict";

const fs = require("node:fs");
const path = require("node:path");
const renderer = require("./audio-to-midi-human-review-v2.js");

const HERE = __dirname;
const PROTOCOL_FILE = path.join(HERE, "audio-to-midi-p2-protocol-v1.json");
const DEFAULT_RUN_ID = "audio-to-midi-independent-evaluation-v1-001";
const EXPECTED_IDS = [
  "FAME000001", "FAME000102", "FAME000006", "FAME000129",
  "FAME000020", "FAME000073", "FAME000092", "FAME000121",
  "FAME000010", "FAME000071", "FAME000116", "FAME000101"
];

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function finite(value, label) { if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(label + " must be finite"); return value; }

function readVlq(buffer, offset) {
  let value = 0, bytes = 0;
  while (offset + bytes < buffer.length && bytes < 4) {
    const octet = buffer[offset + bytes]; value = (value << 7) | (octet & 0x7f); bytes += 1;
    if ((octet & 0x80) === 0) return { value, bytes };
  }
  throw new Error("Invalid MIDI VLQ");
}

function parseMidi(file) {
  const b = fs.readFileSync(file);
  assert(b.length >= 22 && b.toString("ascii", 0, 4) === "MThd", "Invalid MIDI header: " + file);
  assert(b.readUInt32BE(4) === 6 && b.readUInt16BE(8) === 0 && b.readUInt16BE(10) === 1, "Unsupported MIDI format: " + file);
  const ppq = b.readUInt16BE(12); assert(ppq > 0, "Invalid MIDI PPQ");
  assert(b.toString("ascii", 14, 18) === "MTrk", "Missing MIDI track");
  const trackLength = b.readUInt32BE(18); assert(22 + trackLength === b.length, "MIDI track length mismatch");

  let offset = 22, tick = 0, runningStatus = null, tempoUs = null, pitchBendCount = 0;
  const active = new Map(), notes = [];
  while (offset < b.length) {
    const delta = readVlq(b, offset); offset += delta.bytes; tick += delta.value;
    let status = b[offset];
    if (status < 0x80) { assert(runningStatus !== null, "Invalid running status"); status = runningStatus; }
    else { offset += 1; if (status < 0xf0) runningStatus = status; }

    if (status === 0xff) {
      const type = b[offset++], len = readVlq(b, offset); offset += len.bytes;
      assert(offset + len.value <= b.length, "Truncated meta event");
      if (type === 0x51) { assert(len.value === 3 && tempoUs === null, "Invalid/multiple MIDI tempo"); tempoUs = b.readUIntBE(offset, 3); }
      offset += len.value; continue;
    }
    assert(status < 0xf0, "Unsupported MIDI system event");
    const kind = status & 0xf0, channel = status & 0x0f;
    if (kind === 0x80 || kind === 0x90) {
      assert(offset + 2 <= b.length, "Truncated MIDI note event");
      const note = b[offset++], velocity = b[offset++], key = `${channel}:${note}`;
      const isOn = kind === 0x90 && velocity > 0;
      if (isOn) {
        const queue = active.get(key) || []; queue.push({ startTick: tick, note, velocity, channel }); active.set(key, queue);
      } else {
        const queue = active.get(key) || []; assert(queue.length, `Unmatched note-off ${key}`);
        const on = queue.shift(); if (!queue.length) active.delete(key); else active.set(key, queue);
        notes.push({ ...on, endTick: tick });
      }
      continue;
    }
    if (kind === 0xe0) pitchBendCount += 1;
    const dataBytes = [0xc0, 0xd0].includes(kind) ? 1 : 2;
    assert(offset + dataBytes <= b.length, "Truncated MIDI channel event"); offset += dataBytes;
  }
  assert(active.size === 0, "Unclosed MIDI notes");
  assert(tempoUs !== null, "Missing MIDI tempo");
  notes.sort((a, b) => a.startTick - b.startTick || a.note - b.note || a.velocity - b.velocity || a.endTick - b.endTick);
  return { ppq, tempoUs, pitchBendCount, notes };
}

function halfTickSeconds(bpm, ppq) { return 0.5 * 60 / (finite(bpm, "bpm") * ppq) + 1e-9; }
function tickSeconds(tick, bpm, ppq) { return tick * 60 / (bpm * ppq); }

function compareEvents(jsonEvents, parsed, bpm, channel, drum) {
  const tolerance = halfTickSeconds(bpm, parsed.ppq), unused = new Set(parsed.notes.map((_, i) => i));
  const matches = [];
  for (const [index, event] of jsonEvents.entries()) {
    const expectedStart = drum ? finite(event.timeSeconds, `events[${index}].timeSeconds`) : finite(event.startSeconds, `notes[${index}].startSeconds`);
    const expectedEnd = drum
      ? expectedStart + Math.max(0.03, 60 / bpm / 16)
      : finite(event.endSeconds, `notes[${index}].endSeconds`);
    const note = Number(event.midiNote), velocity = Math.max(1, Math.min(127, Number(event.velocity ?? 80)));
    let best = null;
    for (const candidateIndex of unused) {
      const actual = parsed.notes[candidateIndex];
      if (actual.channel !== channel || actual.note !== note || actual.velocity !== velocity) continue;
      const startError = Math.abs(tickSeconds(actual.startTick, bpm, parsed.ppq) - expectedStart);
      const endError = Math.abs(tickSeconds(actual.endTick, bpm, parsed.ppq) - expectedEnd);
      const score = startError + endError;
      if (!best || score < best.score) best = { candidateIndex, actual, startError, endError, score };
    }
    assert(best, `No MIDI event matches JSON index ${index} note=${note} velocity=${velocity}`);
    assert(best.startError <= tolerance, `MIDI onset mismatch JSON index ${index}: ${best.startError}s > ${tolerance}s`);
    assert(best.endError <= tolerance, `MIDI offset mismatch JSON index ${index}: ${best.endError}s > ${tolerance}s`);
    unused.delete(best.candidateIndex);
    matches.push({ jsonIndex: index, startErrorSeconds: best.startError, endErrorSeconds: best.endError });
  }
  assert(unused.size === 0, `MIDI contains ${unused.size} unmatched note events`);
  assert(parsed.pitchBendCount === 0, `Unexpected pitch-bend events: ${parsed.pitchBendCount}`);
  const expectedTempo = 60000000 / bpm;
  assert(Math.abs(parsed.tempoUs - expectedTempo) <= 1.0, `MIDI tempo mismatch: ${parsed.tempoUs} vs ${expectedTempo}`);
  return { events: jsonEvents.length, maxStartErrorSeconds: Math.max(0, ...matches.map(x => x.startErrorSeconds)), maxEndErrorSeconds: Math.max(0, ...matches.map(x => x.endErrorSeconds)), pitchBendCount: parsed.pitchBendCount };
}

function referenceDuration(result, stem) {
  const meta = result?.stems?.[stem];
  assert(meta && Number.isInteger(meta.samplesPerChannel) && meta.samplesPerChannel > 0, `Missing ${stem} samplesPerChannel`);
  assert(Number.isInteger(meta.sampleRate) && meta.sampleRate > 0, `Missing ${stem} sampleRate`);
  return meta.samplesPerChannel / meta.sampleRate;
}

function v1Durations(result) {
  return {
    drums: Math.max(1, ...result.drums.events.map(e => e.timeSeconds + 0.35)),
    bass: Math.max(1, ...result.lowEnd.notes.map(n => n.endSeconds + 0.1)),
    contour: Math.max(1, ...result.lowEnd.pitchContour.map(p => p.timeSeconds + 0.05))
  };
}

function auditFamily(familyDir, result) {
  const bpm = finite(result.bpm, "result.bpm"), drumsDuration = referenceDuration(result, "drums"), bassDuration = referenceDuration(result, "bass");
  const drumsInspect = renderer.inspectDrums(result.drums.events, drumsDuration);
  const bassInspect = renderer.inspectBassNotes(result.lowEnd.notes, bassDuration);
  const contourInspect = renderer.inspectContour(result.lowEnd.pitchContour, bassDuration);
  const drumsMidi = parseMidi(path.join(familyDir, result.drums.midiFile));
  const lowMidi = parseMidi(path.join(familyDir, result.lowEnd.midiFile));
  assert(drumsMidi.ppq === 480 && lowMidi.ppq === 480, "Unexpected PPQ");
  const drumsEq = compareEvents(result.drums.events, drumsMidi, bpm, 9, true);
  const lowEq = compareEvents(result.lowEnd.notes, lowMidi, bpm, 0, false);
  const old = v1Durations(result);
  return {
    sourceRecordId: result.sourceRecordId,
    referenceDurationSeconds: { drums: drumsDuration, bass: bassDuration },
    historicalV1DurationSeconds: old,
    historicalV1TrailingDifferenceSeconds: {
      drums: drumsDuration - old.drums,
      bass: bassDuration - old.bass,
      contour: bassDuration - old.contour
    },
    rendererV2: { drums: drumsInspect, bass: bassInspect, contour: contourInspect },
    jsonMidiEquivalence: { drums: drumsEq, lowEnd: lowEq },
    pass: drumsInspect.overflow.length === 0 && bassInspect.overflow.length === 0 && contourInspect.overflow.length === 0
  };
}

function validateProtocol(protocol) {
  assert(protocol.schema === "fame-owned-beats-audio-to-midi-p2-measurement-protocol-v1", "P2 protocol schema mismatch");
  assert(protocol.status === "FROZEN_BEFORE_P2_DIAGNOSTIC_AUDIT", "P2 protocol not frozen");
  assert(protocol.renderer.historicalRendererImmutable === true, "Historical renderer must remain immutable");
  assert(protocol.renderer.candidateRendererId === renderer.RENDERER_ID, "Renderer v2 id mismatch");
  assert(protocol.safety.sourceAudioMayBeOpened === false && protocol.safety.transcriptionMayRun === false, "P2 safety mismatch");
  return protocol;
}

function audit(workspaceRoot, runId = DEFAULT_RUN_ID) {
  const protocol = validateProtocol(readJson(PROTOCOL_FILE));
  assert(runId === protocol.diagnosticCohort.runId, "Only frozen consumed evaluation run is allowed in P2 audit");
  const runDir = path.resolve(workspaceRoot, "runs", "audio-to-midi-independent-evaluation-execution", runId);
  const summary = readJson(path.join(runDir, "summary.json"));
  assert(summary.records === 12 && summary.split === protocol.diagnosticCohort.split, "P2 run summary mismatch");
  const ids = summary.results.map(x => x.sourceRecordId);
  assert(JSON.stringify(ids) === JSON.stringify(EXPECTED_IDS), "P2 consumed cohort identity/order mismatch");
  const families = [];
  for (const rid of ids) {
    const familyDir = path.join(runDir, "results", rid), result = readJson(path.join(familyDir, "result.json"));
    families.push(auditFamily(familyDir, result));
  }
  const overflowFamilies = families.filter(x => !x.pass).map(x => x.sourceRecordId);
  const truncation = families.map(x => ({
    sourceRecordId: x.sourceRecordId,
    drumsTrailingDifferenceSeconds: x.historicalV1TrailingDifferenceSeconds.drums,
    bassTrailingDifferenceSeconds: x.historicalV1TrailingDifferenceSeconds.bass,
    contourTrailingDifferenceSeconds: x.historicalV1TrailingDifferenceSeconds.contour
  }));
  return {
    mode: "FAME_NEURAL_P2_DIAGNOSTIC_AUDIT_PASS",
    runId,
    records: families.length,
    rendererId: renderer.RENDERER_ID,
    jsonMidiEquivalentFamilies: families.length,
    overflowFamilies,
    historicalV1DurationDifferences: truncation,
    families,
    sourceAudioOpenedByThisCommand: false,
    sourceSeparationExecutedByThisCommand: false,
    transcriptionExecutedByThisCommand: false,
    retuningPerformedByThisCommand: false,
    historicalArtifactsModifiedByThisCommand: false,
    historicalVotesModifiedByThisCommand: false,
    trainingAuthorized: false,
    batch131Authorized: false,
    taskDataReadyMayBeDeclared: false,
    nextAction: "P2_REVIEW_AUDIT_THEN_USE_RENDERER_V2_FOR_FUTURE_COMPARISONS"
  };
}

function main(args = process.argv.slice(2)) {
  const [command, workspace, runId] = args;
  if (command !== "audit" || !workspace) throw new Error("Usage: node audio-to-midi-p2-audit.js audit <workspace> [run-id]");
  process.stdout.write(JSON.stringify(audit(workspace, runId || DEFAULT_RUN_ID), null, 2) + "\n");
}

if (require.main === module) {
  try { main(); } catch (error) { console.error("FAME NEURAL P2 AUDIT FAILED: " + error.message); process.exitCode = 1; }
}

module.exports = { readVlq, parseMidi, compareEvents, referenceDuration, v1Durations, auditFamily, audit, validateProtocol };
