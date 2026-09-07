"use strict";

const crypto = require("node:crypto");

const PITCHED_TYPES = new Set(["808", "harmony", "lead"]);

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function quantize(value, quantum) {
  const number = stableNumber(value, 0);
  if (!quantum || quantum <= 1) return Math.round(number);
  return Math.round(number / quantum) * quantum;
}

function canonicalSequencesFromItem(item) {
  const sequences = [];
  if (item && item.canonical && item.canonical.schema === "fame-neural-sequence-v1") {
    sequences.push({ id: "canonical", sequence: item.canonical });
  }
  if (Array.isArray(item && item.canonicalSegments)) {
    item.canonicalSegments.forEach((segment, index) => {
      if (segment && segment.canonical && segment.canonical.schema === "fame-neural-sequence-v1") {
        sequences.push({ id: `segment:${index}`, sequence: segment.canonical });
      }
    });
  }
  return sequences;
}

function normalizedEvent(event, options = {}) {
  const timingQuantum = Number.isInteger(options.timingQuantum) && options.timingQuantum > 0
    ? options.timingQuantum
    : 1;
  const durationQuantum = Number.isInteger(options.durationQuantum) && options.durationQuantum > 0
    ? options.durationQuantum
    : timingQuantum;
  const includePitch = options.includePitch !== false;
  const includeVelocity = options.includeVelocity === true;
  const pitchAnchor = Number.isFinite(options.pitchAnchor) ? options.pitchAnchor : null;

  const out = {
    type: String(event && event.type || "unknown"),
    tick: quantize(event && event.tick, timingQuantum)
  };

  if (event && Number.isFinite(Number(event.durationTicks))) {
    out.durationTicks = Math.max(1, quantize(event.durationTicks, durationQuantum));
  }

  if (includePitch && PITCHED_TYPES.has(out.type) && Number.isFinite(Number(event && event.note))) {
    const note = Math.round(Number(event.note));
    out.note = pitchAnchor == null ? note : note - pitchAnchor;
  }

  if (includePitch && out.type === "808" && Number.isFinite(Number(event && event.glideTo))) {
    const glideTo = Math.round(Number(event.glideTo));
    out.glideTo = pitchAnchor == null ? glideTo : glideTo - pitchAnchor;
    if (Number.isFinite(Number(event.glideTicks))) {
      out.glideTicks = Math.max(1, quantize(event.glideTicks, durationQuantum));
    }
  }

  if (includeVelocity && Number.isFinite(Number(event && event.velocity))) {
    out.velocity = Math.max(0, Math.min(127, Math.round(Number(event.velocity) * 127)));
  }

  return out;
}

function sortedEvents(sequence) {
  const events = Array.isArray(sequence && sequence.events) ? sequence.events : [];
  return [...events].sort((a, b) => {
    const tickDiff = stableNumber(a && a.tick) - stableNumber(b && b.tick);
    if (tickDiff) return tickDiff;
    const typeDiff = String(a && a.type || "").localeCompare(String(b && b.type || ""));
    if (typeDiff) return typeDiff;
    return stableNumber(a && a.note, -1) - stableNumber(b && b.note, -1);
  });
}

function firstPitchAnchor(events) {
  for (const event of events) {
    if (PITCHED_TYPES.has(String(event && event.type || "")) && Number.isFinite(Number(event && event.note))) {
      return Math.round(Number(event.note));
    }
  }
  return null;
}

function sequenceFingerprint(sequence, mode = "exact", options = {}) {
  const events = sortedEvents(sequence);
  const timing = sequence && sequence.timing || {};
  const bars = Math.max(1, Math.round(stableNumber(timing.bars, 1)));
  const bpm = Math.max(1, Math.round(stableNumber(timing.bpm, 120)));
  const ppq = Math.max(1, Math.round(stableNumber(timing.ppq, 960)));

  if (mode === "transposition") {
    const hasExternalAnchor = Number.isFinite(options.pitchAnchor);
    const anchor = hasExternalAnchor ? Math.round(Number(options.pitchAnchor)) : firstPitchAnchor(events);
    if (anchor == null) return null;
    const pitchedCount = events.filter(event => PITCHED_TYPES.has(String(event && event.type || "")) && Number.isFinite(Number(event && event.note))).length;
    if (!hasExternalAnchor && pitchedCount < (options.minPitchedEvents || 3)) return null;
    const normalized = events.map(event => normalizedEvent(event, {
      timingQuantum: options.timingQuantum || 1,
      durationQuantum: options.durationQuantum || 1,
      includePitch: true,
      includeVelocity: false,
      pitchAnchor: anchor
    }));
    return sha256(JSON.stringify({ mode, ppq, bars, events: normalized }));
  }

  if (mode === "rhythm") {
    const normalized = events.map(event => normalizedEvent(event, {
      timingQuantum: options.timingQuantum || 1,
      durationQuantum: options.durationQuantum || 1,
      includePitch: false,
      includeVelocity: false
    }));
    return sha256(JSON.stringify({ mode, ppq, bars, events: normalized }));
  }

  const normalized = events.map(event => normalizedEvent(event, {
    timingQuantum: options.timingQuantum || 1,
    durationQuantum: options.durationQuantum || 1,
    includePitch: true,
    includeVelocity: false
  }));
  return sha256(JSON.stringify({ mode: "exact", ppq, bpm, bars, events: normalized }));
}

function itemFingerprint(item, mode = "exact", options = {}) {
  const sequences = canonicalSequencesFromItem(item);
  if (!sequences.length) return null;

  let fingerprintOptions = options;
  if (mode === "transposition") {
    let pitchAnchor = null;
    let pitchedCount = 0;
    for (const entry of sequences) {
      for (const event of sortedEvents(entry.sequence)) {
        const type = String(event && event.type || "");
        if (!PITCHED_TYPES.has(type) || !Number.isFinite(Number(event && event.note))) continue;
        if (pitchAnchor == null) pitchAnchor = Math.round(Number(event.note));
        pitchedCount += 1;
      }
    }
    if (pitchAnchor == null || pitchedCount < (options.minPitchedEvents || 3)) return null;
    fingerprintOptions = { ...options, pitchAnchor };
  }

  const parts = [];
  for (const entry of sequences) {
    const fingerprint = sequenceFingerprint(entry.sequence, mode, fingerprintOptions);
    if (fingerprint == null) return null;
    parts.push(`${entry.id}:${fingerprint}`);
  }
  return sha256(parts.join("|"));
}

function eventSummary(item) {
  const sequences = canonicalSequencesFromItem(item);
  const byType = {};
  let events = 0;
  let pitchedEvents = 0;
  let bars = 0;
  for (const { sequence } of sequences) {
    bars += Math.max(1, Math.round(stableNumber(sequence && sequence.timing && sequence.timing.bars, 1)));
    for (const event of Array.isArray(sequence && sequence.events) ? sequence.events : []) {
      events += 1;
      const type = String(event && event.type || "unknown");
      byType[type] = (byType[type] || 0) + 1;
      if (PITCHED_TYPES.has(type) && Number.isFinite(Number(event && event.note))) pitchedEvents += 1;
    }
  }
  return { sequences: sequences.length, bars, events, pitchedEvents, byType };
}

module.exports = {
  PITCHED_TYPES,
  sha256,
  canonicalSequencesFromItem,
  normalizedEvent,
  sequenceFingerprint,
  itemFingerprint,
  eventSummary
};
