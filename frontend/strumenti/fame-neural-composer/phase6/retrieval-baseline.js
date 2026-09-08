"use strict";

const crypto = require("node:crypto");

const PLAN_NUMERIC_FIELDS = Object.freeze([
  "energy",
  "vocalSpace",
  "tension",
  "density",
  "transitionFrom",
  "transitionTo",
  "motifSimilarity"
]);

function shaBucket(text) {
  const digest = crypto.createHash("sha256").update(String(text), "utf8").digest();
  return Number(digest.readBigUInt64BE(0) % 100n);
}

function splitName(groupId) {
  const bucket = shaBucket(groupId);
  if (bucket < 80) return "train";
  if (bucket < 90) return "val";
  return "test";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function headerOf(recordOrUnits) {
  const units = Array.isArray(recordOrUnits)
    ? recordOrUnits
    : recordOrUnits && Array.isArray(recordOrUnits.units)
      ? recordOrUnits.units
      : [];
  const header = units.find(unit => unit && unit.kind === "HEADER");
  if (!header) throw new Error("HEADER mancante");
  return header;
}

function barsOf(recordOrUnits) {
  const units = Array.isArray(recordOrUnits)
    ? recordOrUnits
    : recordOrUnits && Array.isArray(recordOrUnits.units)
      ? recordOrUnits.units
      : [];
  return units.filter(unit => unit && unit.kind === "BAR");
}

function normalizedBinDistance(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 1;
  return Math.min(1, Math.abs(x - y) / 9);
}

function planDistance(target, candidate) {
  const th = headerOf(target);
  const ch = headerOf(candidate);
  const tb = barsOf(target);
  const cb = barsOf(candidate);
  if (tb.length !== cb.length) return Number.POSITIVE_INFINITY;

  let total = 0;
  let weight = 0;
  const add = (value, w = 1) => {
    total += value * w;
    weight += w;
  };

  add(Math.min(1, Math.abs(Number(th.bpm) - Number(ch.bpm)) / 60), 0.5);
  add(th.mode === ch.mode ? 0 : 1, 1);
  add(th.lineage === ch.lineage ? 0 : 1, 1);

  for (let i = 0; i < tb.length; i += 1) {
    const a = tb[i];
    const b = cb[i];
    for (const field of PLAN_NUMERIC_FIELDS) add(normalizedBinDistance(a[field], b[field]), 1);
    add(a.motifRelation === b.motifRelation ? 0 : 1, 0.5);
  }

  return weight ? total / weight : 1;
}

function candidateTier(target, candidate) {
  const th = headerOf(target);
  const ch = headerOf(candidate);
  if (barsOf(target).length !== barsOf(candidate).length) return 99;
  const sameMode = th.mode === ch.mode;
  const sameLineage = th.lineage === ch.lineage;
  if (sameMode && sameLineage) return 0;
  if (sameMode) return 1;
  if (sameLineage) return 2;
  return 3;
}

function retrieveTemplate(target, trainingRecords) {
  const candidates = trainingRecords.filter(candidate =>
    candidate.groupId !== target.groupId &&
    barsOf(candidate).length === barsOf(target).length
  );
  if (!candidates.length) {
    throw new Error(`Nessun template train leakage-safe con ${barsOf(target).length} barre per ${target.phraseId}`);
  }

  const bestTier = Math.min(...candidates.map(candidate => candidateTier(target, candidate)));
  const ranked = candidates
    .filter(candidate => candidateTier(target, candidate) === bestTier)
    .map(candidate => ({ candidate, score: planDistance(target, candidate) }))
    .sort((a, b) => a.score - b.score || String(a.candidate.phraseId).localeCompare(String(b.candidate.phraseId)));

  return { template: ranked[0].candidate, tier: bestTier, score: ranked[0].score };
}

function signedPitchDelta(fromPc, toPc) {
  let delta = ((Number(toPc) - Number(fromPc)) % 12 + 12) % 12;
  if (delta > 6) delta -= 12;
  return delta;
}

function transposeMidi(note, delta) {
  if (!Number.isInteger(note)) return note;
  let value = note + delta;
  while (value < 0) value += 12;
  while (value > 127) value -= 12;
  return value;
}

function transposePc(pc, delta) {
  if (!Number.isInteger(pc)) return pc;
  return ((pc + delta) % 12 + 12) % 12;
}

function adaptTemplate(target, template) {
  const targetHeader = headerOf(target);
  const templateHeader = headerOf(template);
  const delta = signedPitchDelta(templateHeader.key, targetHeader.key);
  const units = clone(template.units);

  for (const word of units) {
    if (!word || typeof word !== "object") continue;
    if (word.kind === "HEADER") {
      word.bpm = targetHeader.bpm;
      word.key = targetHeader.key;
    } else if (word.kind === "EVENT") {
      if (Number.isInteger(word.note)) word.note = transposeMidi(word.note, delta);
      if (Number.isInteger(word.glideTo)) word.glideTo = transposeMidi(word.glideTo, delta);
    } else if (word.kind === "CHORD") {
      if (Number.isInteger(word.rootPitchClass)) word.rootPitchClass = transposePc(word.rootPitchClass, delta);
      if (Number.isInteger(word.bassPitchClass)) word.bassPitchClass = transposePc(word.bassPitchClass, delta);
    }
  }

  return { units, pitchDelta: delta };
}

function planMae(target, generatedUnits) {
  const tb = barsOf(target);
  const gb = barsOf(generatedUnits);
  if (tb.length !== gb.length) return 1;
  let total = 0;
  let count = 0;
  for (let i = 0; i < tb.length; i += 1) {
    for (const field of PLAN_NUMERIC_FIELDS) {
      total += normalizedBinDistance(tb[i][field], gb[i][field]);
      count += 1;
    }
  }
  return count ? total / count : 1;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

module.exports = {
  PLAN_NUMERIC_FIELDS,
  shaBucket,
  splitName,
  headerOf,
  barsOf,
  planDistance,
  candidateTier,
  retrieveTemplate,
  signedPitchDelta,
  adaptTemplate,
  planMae,
  percentile
};
