"use strict";

const crypto = require("node:crypto");
const {
  PLAN_NUMERIC_FIELDS,
  headerOf,
  barsOf,
  signedPitchDelta
} = require("./retrieval-baseline");

const EVENT_TYPES = Object.freeze([
  "kick", "snare", "clap", "hat_closed", "hat_open", "perc", "808", "harmony", "lead", "texture", "fx"
]);


function normalizedBinDistance(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 1;
  return Math.min(1, Math.abs(x - y) / 9);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hashSeed(text) {
  const digest = crypto.createHash("sha256").update(String(text), "utf8").digest();
  return digest.readUInt32BE(0) >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(array, rng) {
  if (!array.length) return null;
  return array[Math.min(array.length - 1, Math.floor(rng() * array.length))];
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

function barItems(units, barIndex) {
  return units.filter(word => word && word.kind !== "HEADER" && word.kind !== "EOS" && word.bar === barIndex);
}

function profileFromRecord(record) {
  const header = headerOf(record);
  const profiles = [];
  for (const bar of barsOf(record)) {
    const items = barItems(record.units, bar.bar);
    const counts = Object.fromEntries(EVENT_TYPES.map(type => [type, 0]));
    let chords = 0;
    let hatRolls = 0;
    for (const word of items) {
      if (word.kind === "EVENT" && counts[word.type] !== undefined) counts[word.type] += 1;
      else if (word.kind === "CHORD") chords += 1;
      else if (word.kind === "HAT_ROLL") hatRolls += 1;
    }
    profiles.push({
      phraseId: record.phraseId,
      groupId: record.groupId,
      sourceCollection: record.sourceCollection,
      sourceKey: header.key,
      bar: clone(bar),
      counts,
      chords,
      hatRolls
    });
  }
  return profiles;
}

function buildModel(trainingRecords) {
  const eventPools = Object.fromEntries(EVENT_TYPES.map(type => [type, []]));
  const chordPool = [];
  const hatRollPool = [];
  const profiles = [];

  for (const record of trainingRecords) {
    const header = headerOf(record);
    profiles.push(...profileFromRecord(record));
    for (const word of record.units) {
      if (!word || typeof word !== "object") continue;
      const entry = {
        phraseId: record.phraseId,
        groupId: record.groupId,
        sourceCollection: record.sourceCollection,
        sourceKey: header.key,
        word: clone(word)
      };
      if (word.kind === "EVENT" && eventPools[word.type]) eventPools[word.type].push(entry);
      else if (word.kind === "CHORD") chordPool.push(entry);
      else if (word.kind === "HAT_ROLL") hatRollPool.push(entry);
    }
  }

  return { trainingRecords, profiles, eventPools, chordPool, hatRollPool };
}

function barPlanDistance(targetBar, profileBar) {
  let total = 0;
  let weight = 0;
  const add = (value, w = 1) => {
    total += value * w;
    weight += w;
  };
  for (const field of PLAN_NUMERIC_FIELDS) add(normalizedBinDistance(targetBar[field], profileBar[field]), 1);
  add(targetBar.motifRelation === profileBar.motifRelation ? 0 : 1, 0.5);
  return weight ? total / weight : 1;
}

function chooseProfile(targetBar, profiles, rng, topK = 16) {
  if (!profiles.length) throw new Error("Nessun profilo train disponibile");
  const ranked = profiles
    .map(profile => ({ profile, distance: barPlanDistance(targetBar, profile.bar) }))
    .sort((a, b) => a.distance - b.distance || a.profile.phraseId.localeCompare(b.profile.phraseId) || a.profile.bar.bar - b.profile.bar.bar);
  const pool = ranked.slice(0, Math.min(topK, ranked.length));
  const chosen = pick(pool, rng);
  return chosen;
}

function adaptDonorWord(entry, targetBarIndex, targetKey) {
  const word = clone(entry.word);
  word.bar = targetBarIndex;
  const delta = signedPitchDelta(entry.sourceKey, targetKey);
  if (word.kind === "EVENT") {
    if (Number.isInteger(word.note)) word.note = transposeMidi(word.note, delta);
    if (Number.isInteger(word.glideTo)) word.glideTo = transposeMidi(word.glideTo, delta);
  } else if (word.kind === "CHORD") {
    if (Number.isInteger(word.rootPitchClass)) word.rootPitchClass = transposePc(word.rootPitchClass, delta);
    if (Number.isInteger(word.bassPitchClass)) word.bassPitchClass = transposePc(word.bassPitchClass, delta);
  }
  return word;
}

function eventIdentity(word) {
  const copy = clone(word);
  if (Object.prototype.hasOwnProperty.call(copy, "bar")) copy.bar = 0;
  return JSON.stringify(copy);
}

function sampleUniqueWords(pool, count, rng, targetBarIndex, targetKey, donors, seen) {
  const out = [];
  if (!pool.length || count <= 0) return out;
  const maxAttempts = Math.max(12, count * 10);
  let attempts = 0;
  while (out.length < count && attempts < maxAttempts) {
    attempts += 1;
    const entry = pick(pool, rng);
    if (!entry) break;
    const word = adaptDonorWord(entry, targetBarIndex, targetKey);
    const identity = eventIdentity(word);
    if (seen.has(identity)) continue;
    seen.add(identity);
    out.push(word);
    donors.add(entry.groupId);
  }
  return out;
}

function nearestLag(kickPositions, bassPositions) {
  if (!kickPositions.length || !bassPositions.length) return null;
  const lags = [];
  for (const kick of kickPositions) {
    let best = null;
    for (const bass of bassPositions) {
      const lag = bass - kick;
      if (best === null || Math.abs(lag) < Math.abs(best)) best = lag;
    }
    if (best !== null) lags.push(best);
  }
  if (!lags.length) return null;
  const mean = lags.reduce((s, v) => s + v, 0) / lags.length;
  const rounded = Math.round(mean / 10) * 10;
  return Math.max(-960, Math.min(960, rounded));
}

function ratioBin(value) {
  return Math.max(0, Math.min(9, Math.round(Number(value || 0) * 9)));
}

function buildBarWord(targetBar, barIndex, events, hatRolls) {
  const kicks = events.filter(word => word.kind === "EVENT" && word.type === "kick").map(word => word.position);
  const basses = events.filter(word => word.kind === "EVENT" && word.type === "808").map(word => word.position);
  const available = kicks.length > 0 && basses.length > 0;
  let exact = 0;
  let proximity = 0;
  if (available) {
    for (const kick of kicks) {
      if (basses.includes(kick)) exact += 1;
      if (basses.some(bass => Math.abs(bass - kick) <= 240)) proximity += 1;
    }
  }
  const exactRatio = kicks.length ? exact / kicks.length : 0;
  const proximityRatio = kicks.length ? proximity / kicks.length : 0;
  const strength = available ? Math.min(1, exactRatio * 0.6 + proximityRatio * 0.4) : 0;
  const maxRollNotes = hatRolls.length ? Math.max(...hatRolls.map(word => Number(word.notes || 0))) : 0;

  return {
    kind: "BAR",
    bar: barIndex,
    energy: targetBar.energy,
    vocalSpace: targetBar.vocalSpace,
    tension: targetBar.tension,
    density: targetBar.density,
    transitionFrom: targetBar.transitionFrom,
    transitionTo: targetBar.transitionTo,
    motifFamily: Number.isInteger(targetBar.motifFamily) ? targetBar.motifFamily : 0,
    motifRelation: targetBar.motifRelation,
    motifSimilarity: targetBar.motifSimilarity,
    kick808Available: available,
    kickCount: Math.min(128, kicks.length),
    bassCount: Math.min(128, basses.length),
    kickExact: ratioBin(exactRatio),
    kickProximity: ratioBin(proximityRatio),
    kickLag: available ? nearestLag(kicks, basses) : null,
    kickStrength: ratioBin(strength),
    hatRollCount: Math.min(128, hatRolls.length),
    hatMaxRollNotes: Math.min(128, maxRollNotes)
  };
}

function sortMusicalItems(a, b) {
  const kindOrder = { CHORD: 0, EVENT: 1 };
  return Number(a.position || 0) - Number(b.position || 0) ||
    (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9) ||
    String(a.type || "").localeCompare(String(b.type || ""));
}

function generate(target, model, options = {}) {
  const targetHeader = headerOf(target);
  const targetBars = barsOf(target);
  const rng = mulberry32(hashSeed(`${options.seed || 6201}:${target.phraseId}`));
  const units = [{
    kind: "HEADER",
    bpm: targetHeader.bpm,
    key: targetHeader.key,
    mode: targetHeader.mode,
    lineage: targetHeader.lineage
  }];
  const donorGroups = new Set();
  const profileDonors = new Set();

  for (let barIndex = 0; barIndex < targetBars.length; barIndex += 1) {
    const targetBar = targetBars[barIndex];
    const chosen = chooseProfile(targetBar, model.profiles, rng, options.topK || 16);
    const profile = chosen.profile;
    profileDonors.add(profile.groupId);
    donorGroups.add(profile.groupId);
    const seen = new Set();
    const items = [];

    for (const type of EVENT_TYPES) {
      const count = Math.min(24, Math.max(0, Number(profile.counts[type] || 0)));
      items.push(...sampleUniqueWords(model.eventPools[type], count, rng, barIndex, targetHeader.key, donorGroups, seen));
    }
    items.push(...sampleUniqueWords(model.chordPool, Math.min(8, profile.chords), rng, barIndex, targetHeader.key, donorGroups, seen));
    const hatRolls = sampleUniqueWords(model.hatRollPool, Math.min(8, profile.hatRolls), rng, barIndex, targetHeader.key, donorGroups, seen)
      .sort((a, b) => Number(a.start || 0) - Number(b.start || 0) || Number(a.end || 0) - Number(b.end || 0));
    items.sort(sortMusicalItems);

    const events = items.filter(word => word.kind === "EVENT");
    units.push(buildBarWord(targetBar, barIndex, events, hatRolls));
    units.push(...hatRolls);
    units.push(...items);
  }

  units.push({ kind: "EOS" });
  return {
    units,
    donorGroups: [...donorGroups].sort(),
    profileDonorGroups: [...profileDonors].sort()
  };
}

function normalizedBarSignature(units, barIndex) {
  const words = units
    .filter(word => word && word.kind !== "HEADER" && word.kind !== "EOS" && word.bar === barIndex)
    .map(word => {
      const copy = clone(word);
      copy.bar = 0;
      return copy;
    });
  return JSON.stringify(words);
}

function phraseSignature(units) {
  return JSON.stringify(units);
}

function trainingNoveltyIndex(trainingRecords) {
  const phrases = new Set();
  const bars = new Set();
  for (const record of trainingRecords) {
    phrases.add(phraseSignature(record.units));
    const count = barsOf(record).length;
    for (let bar = 0; bar < count; bar += 1) bars.add(normalizedBarSignature(record.units, bar));
  }
  return { phrases, bars };
}

module.exports = {
  EVENT_TYPES,
  hashSeed,
  mulberry32,
  profileFromRecord,
  buildModel,
  barPlanDistance,
  chooseProfile,
  adaptDonorWord,
  buildBarWord,
  generate,
  normalizedBarSignature,
  phraseSignature,
  trainingNoveltyIndex
};
