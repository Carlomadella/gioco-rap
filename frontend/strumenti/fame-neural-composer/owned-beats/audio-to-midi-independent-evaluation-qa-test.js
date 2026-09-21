"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const qa = require("./audio-to-midi-independent-evaluation-qa.js");

function vlq(value) {
  value = Math.max(0, Number(value) | 0);
  let buffer = value & 0x7f;
  const out = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    out.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return Buffer.from(out);
}

function writeMidi(file, channel, notes) {
  const chunks = [Buffer.from([0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20])];
  for (const note of notes) {
    chunks.push(Buffer.concat([vlq(0), Buffer.from([0x90 | channel, note, 100])]));
    chunks.push(Buffer.concat([vlq(120), Buffer.from([0x80 | channel, note, 0])]));
  }
  chunks.push(Buffer.from([0x00, 0xff, 0x2f, 0x00]));
  const track = Buffer.concat(chunks);
  const header = Buffer.alloc(14);
  header.write("MThd", 0, "ascii");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(1, 10);
  header.writeUInt16BE(480, 12);
  const trackHeader = Buffer.alloc(8);
  trackHeader.write("MTrk", 0, "ascii");
  trackHeader.writeUInt32BE(track.length, 4);
  fs.writeFileSync(file, Buffer.concat([header, trackHeader, track]));
}

function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-eval-qa-"));
  try {
    const drums = path.join(temp, "drums.mid");
    const low = path.join(temp, "low-end.mid");
    writeMidi(drums, 9, [36, 38, 42]);
    writeMidi(low, 0, [40]);

    const drumsMidi = qa.validateMidi(drums, "fixture/drums.mid", 9, 3, new Set([36, 38, 42]));
    const lowMidi = qa.validateMidi(low, "fixture/low-end.mid", 0, 1, null);
    assert.strictEqual(drumsMidi.noteOnCount, 3);
    assert.strictEqual(lowMidi.noteOnCount, 1);

    qa.validateDrumEvent(
      { timeSeconds: 0.1, frame: 4, role: "kick", midiNote: 36, velocity: 90, sourceStem: "drums+bass" },
      "FIXTURE",
      0
    );

    qa.validateLowEnd({
      armId: "librosa-pyin-lowend-v1",
      noteCount: 1,
      voicedFrameCount: 1,
      frameCount: 2,
      notes: [{
        startSeconds: 0,
        endSeconds: 0.1,
        durationSeconds: 0.1,
        midiNote: 40,
        velocity: 80,
        medianPitchHz: 82.406889,
        medianMidiFloat: 40,
        medianVoicedProbability: 0.9
      }],
      pitchContour: [{
        timeSeconds: 0,
        frequencyHz: 82.406889,
        midiFloat: 40,
        voicedProbability: 0.9
      }]
    }, "FIXTURE");

    assert.throws(
      () => qa.validateMidi(drums, "fixture/wrong-channel.mid", 0, 3, new Set([36, 38, 42])),
      /Unexpected MIDI channel/
    );
    assert.throws(
      () => qa.validateDrumEvent(
        { timeSeconds: 0.1, frame: 4, role: "kick", midiNote: 38, velocity: 90, sourceStem: "drums" },
        "FIXTURE",
        0
      ),
      /Drum MIDI note mismatch/
    );

    process.stdout.write("AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_QA_TEST_PASS\n");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main();
