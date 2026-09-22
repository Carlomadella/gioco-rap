"use strict";

const RENDERER_ID = "fame-neutral-midi-audition-renderer-v2-reference-duration";

function finite(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(label + " must be finite");
  return value;
}

function referenceSamples(referenceDurationSeconds, sampleRate = 22050) {
  const duration = finite(referenceDurationSeconds, "referenceDurationSeconds");
  const sr = finite(sampleRate, "sampleRate");
  if (duration <= 0 || !Number.isInteger(sr) || sr <= 0) throw new Error("Invalid renderer duration/sample-rate");
  return Math.max(1, Math.round(duration * sr));
}

function wavHeader(dataBytes, sampleRate = 22050) {
  const b = Buffer.alloc(44);
  b.write("RIFF", 0, "ascii"); b.writeUInt32LE(36 + dataBytes, 4); b.write("WAVE", 8, "ascii");
  b.write("fmt ", 12, "ascii"); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sampleRate, 24); b.writeUInt32LE(sampleRate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36, "ascii"); b.writeUInt32LE(dataBytes, 40);
  return b;
}

function toWav(samples, sampleRate = 22050) {
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  const scale = peak > 0.98 ? 0.98 / peak : 1;
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i] * scale));
    pcm.writeInt16LE(Math.round(x * 32767), i * 2);
  }
  return Buffer.concat([wavHeader(pcm.length, sampleRate), pcm]);
}

function seededNoise(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return (state / 4294967296) * 2 - 1;
  };
}

function addDrum(samples, sampleRate, event, index) {
  const start = Math.max(0, Math.floor(event.timeSeconds * sampleRate));
  if (event.role === "kick") {
    const duration = Math.floor(0.22 * sampleRate); let phase = 0;
    for (let i = 0; i < duration && start + i < samples.length; i++) {
      const t = i / sampleRate, env = Math.exp(-t * 18), f = 45 + 85 * Math.exp(-t * 25);
      phase += 2 * Math.PI * f / sampleRate; samples[start + i] += 0.75 * env * Math.sin(phase);
    }
  } else if (event.role === "snare") {
    const duration = Math.floor(0.16 * sampleRate), rnd = seededNoise(index * 7919 + 17);
    let phase = 0, hpPrev = 0, xPrev = 0;
    for (let i = 0; i < duration && start + i < samples.length; i++) {
      const t = i / sampleRate, env = Math.exp(-t * 22), x = rnd(), hp = 0.93 * (hpPrev + x - xPrev);
      hpPrev = hp; xPrev = x; phase += 2 * Math.PI * 180 / sampleRate;
      samples[start + i] += 0.32 * env * hp + 0.18 * env * Math.sin(phase);
    }
  } else {
    const duration = Math.floor(0.07 * sampleRate), rnd = seededNoise(index * 104729 + 23);
    let hpPrev = 0, xPrev = 0;
    for (let i = 0; i < duration && start + i < samples.length; i++) {
      const t = i / sampleRate, env = Math.exp(-t * 55), x = rnd(), hp = 0.97 * (hpPrev + x - xPrev);
      hpPrev = hp; xPrev = x; samples[start + i] += 0.22 * env * hp;
    }
  }
}

function midiHz(note) { return 440 * Math.pow(2, (note - 69) / 12); }

function inspectDrums(events, referenceDurationSeconds) {
  const duration = finite(referenceDurationSeconds, "referenceDurationSeconds");
  const overflow = [];
  for (const [index, event] of events.entries()) {
    finite(event.timeSeconds, `drums[${index}].timeSeconds`);
    if (event.timeSeconds < 0 || event.timeSeconds > duration) overflow.push({ index, kind: "onset", timeSeconds: event.timeSeconds });
  }
  return { rendererId: RENDERER_ID, referenceDurationSeconds: duration, eventCount: events.length, overflow };
}

function inspectBassNotes(notes, referenceDurationSeconds) {
  const duration = finite(referenceDurationSeconds, "referenceDurationSeconds");
  const overflow = [];
  for (const [index, note] of notes.entries()) {
    finite(note.startSeconds, `notes[${index}].startSeconds`); finite(note.endSeconds, `notes[${index}].endSeconds`);
    if (note.startSeconds < 0 || note.startSeconds > duration) overflow.push({ index, kind: "start", timeSeconds: note.startSeconds });
    if (note.endSeconds < note.startSeconds || note.endSeconds > duration) overflow.push({ index, kind: "end", timeSeconds: note.endSeconds });
  }
  return { rendererId: RENDERER_ID, referenceDurationSeconds: duration, noteCount: notes.length, overflow };
}

function inspectContour(points, referenceDurationSeconds) {
  const duration = finite(referenceDurationSeconds, "referenceDurationSeconds");
  const overflow = [];
  for (const [index, point] of points.entries()) {
    finite(point.timeSeconds, `points[${index}].timeSeconds`);
    if (point.timeSeconds < 0 || point.timeSeconds > duration) overflow.push({ index, kind: "point", timeSeconds: point.timeSeconds });
  }
  return { rendererId: RENDERER_ID, referenceDurationSeconds: duration, pointCount: points.length, overflow };
}

function requireNoOverflow(diagnostics) {
  if (diagnostics.overflow.length) throw new Error(`Renderer event exceeds reference duration: ${JSON.stringify(diagnostics.overflow[0])}`);
  return diagnostics;
}

function renderDrums(events, referenceDurationSeconds, sampleRate = 22050) {
  requireNoOverflow(inspectDrums(events, referenceDurationSeconds));
  const samples = new Float32Array(referenceSamples(referenceDurationSeconds, sampleRate));
  events.forEach((event, index) => addDrum(samples, sampleRate, event, index));
  return toWav(samples, sampleRate);
}

function renderBassNotes(notes, referenceDurationSeconds, sampleRate = 22050) {
  requireNoOverflow(inspectBassNotes(notes, referenceDurationSeconds));
  const samples = new Float32Array(referenceSamples(referenceDurationSeconds, sampleRate));
  for (const note of notes) {
    const start = Math.max(0, Math.floor(note.startSeconds * sampleRate));
    const stop = Math.min(samples.length, Math.ceil(note.endSeconds * sampleRate));
    const f = midiHz(note.midiNote); let phase = 0;
    for (let i = start; i < stop; i++) {
      const t = (i - start) / sampleRate, remain = (stop - i) / sampleRate;
      const env = Math.min(1, t / 0.01, remain / 0.04);
      phase += 2 * Math.PI * f / sampleRate;
      samples[i] += 0.36 * env * (Math.sin(phase) + 0.22 * Math.sin(2 * phase));
    }
  }
  return toWav(samples, sampleRate);
}

function renderContour(points, referenceDurationSeconds, sampleRate = 22050) {
  requireNoOverflow(inspectContour(points, referenceDurationSeconds));
  const samples = new Float32Array(referenceSamples(referenceDurationSeconds, sampleRate));
  if (points.length >= 2) {
    let phase = 0;
    for (let j = 0; j < points.length - 1; j++) {
      const a = points[j], b = points[j + 1], gap = b.timeSeconds - a.timeSeconds;
      if (gap <= 0 || gap > 0.05) continue;
      const start = Math.max(0, Math.floor(a.timeSeconds * sampleRate));
      const stop = Math.min(samples.length, Math.ceil(b.timeSeconds * sampleRate));
      for (let i = start; i < stop; i++) {
        const u = (i / sampleRate - a.timeSeconds) / gap;
        const f = a.frequencyHz + (b.frequencyHz - a.frequencyHz) * Math.max(0, Math.min(1, u));
        phase += 2 * Math.PI * f / sampleRate; samples[i] += 0.32 * Math.sin(phase);
      }
    }
  }
  return toWav(samples, sampleRate);
}

function wavInfo(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("Invalid WAV buffer");
  const sampleRate = buffer.readUInt32LE(24), dataBytes = buffer.readUInt32LE(40);
  return { sampleRate, samples: dataBytes / 2, durationSeconds: (dataBytes / 2) / sampleRate };
}

module.exports = {
  RENDERER_ID, referenceSamples, inspectDrums, inspectBassNotes, inspectContour,
  renderDrums, renderBassNotes, renderContour, wavInfo
};
