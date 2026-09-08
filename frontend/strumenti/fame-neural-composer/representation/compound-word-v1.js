"use strict";

const {
  EVENT_TYPE_ORDER,
  CHORD_QUALITIES,
  KICK_ROLES,
  BASS_ROLES,
  MOTIF_IDS
} = require("../core");
const { POSITION_TICKS, DURATION_TICKS, LINEAGES, MODES } = require("../vocabulary");
const {
  bin01,
  unbin01,
  quantizedEvents,
  quantizedHarmony,
  prepareRepresentationInput,
  buildDecodedSequence,
  normalizePhase4Bar,
  phase4Snapshot
} = require("./common");

const PHASE4_FEATURES = ["energy", "vocalSpace", "tension", "density"];
const FIELD_CARDINALITIES = Object.freeze({
  kind: 5,
  bpm: 201,
  key: 12,
  mode: MODES.length,
  lineage: LINEAGES.length,
  bar: 128,
  position: POSITION_TICKS.length,
  eventType: EVENT_TYPE_ORDER.length,
  velocity: 10,
  note: 129,
  duration: DURATION_TICKS.length + 1,
  role: new Set(["none", ...KICK_ROLES, ...BASS_ROLES]).size,
  motif: MOTIF_IDS.size + 1,
  glideTo: 129,
  glideDuration: DURATION_TICKS.length + 1,
  chordRoot: 13,
  chordQuality: CHORD_QUALITIES.size + 1,
  chordBass: 13,
  energy: 11,
  vocalSpace: 11,
  tension: 11,
  density: 11
});
const VOCAB_SIZE = Object.values(FIELD_CARDINALITIES).reduce((sum, value) => sum + value, 0);

const CAPABILITIES = Object.freeze({
  canonicalEvents: true,
  timing: true,
  harmony: true,
  velocity: "10-bin-field",
  bass808Glide: true,
  phase4Energy: "10-bin-bar-field",
  phase4VocalSpace: "10-bin-bar-field",
  phase4Tension: "10-bin-bar-field",
  phase4Density: "10-bin-bar-field",
  phase4MotifFamilies: false,
  phase4Kick808Relation: false,
  phase4HatRolls: false,
  phase4TransitionStrength: false,
  note: "Compound Word V1: un timestep per header/bar/chord/event, con 4 scalar bar feature FASE 4 in campi paralleli."
});

function prepare(input) {
  return prepareRepresentationInput(input, ["energy", "vocalSpace", "tension"]);
}

function encode(sequence) {
  const words = [{
    kind: "HEADER",
    bpm: sequence.timing.bpm,
    key: sequence.tonality.rootPitchClass,
    mode: sequence.tonality.mode,
    lineage: sequence.meta.lineage
  }];
  const events = quantizedEvents(sequence);
  const harmony = quantizedHarmony(sequence);

  for (let bar = 0; bar < sequence.timing.bars; bar += 1) {
    const phase = sequence._phase4 && sequence._phase4.bars && sequence._phase4.bars[bar] || {};
    words.push({
      kind: "BAR",
      bar,
      energy: bin01(phase.energy ?? sequence.bars[bar].energy),
      vocalSpace: bin01(phase.vocalSpace ?? sequence.bars[bar].vocalSpace),
      tension: bin01(phase.tension ?? sequence.bars[bar].tension),
      density: bin01(phase.density)
    });

    const items = [
      ...harmony.filter(item => item.bar === bar).map(item => ({ kind: "CHORD", item })),
      ...events.filter(item => item.bar === bar).map(item => ({ kind: "EVENT", item }))
    ].sort((a, b) => a.item.position - b.item.position || a.kind.localeCompare(b.kind));

    for (const entry of items) {
      if (entry.kind === "CHORD") words.push({ kind: "CHORD", ...entry.item });
      else words.push({ kind: "EVENT", ...entry.item });
    }
  }
  words.push({ kind: "EOS" });
  return words;
}

function decode(words) {
  if (!Array.isArray(words) || !words.length || words[0].kind !== "HEADER") throw new Error("Compound: HEADER mancante");
  const headerWord = words[0];
  const header = {
    bpm: headerWord.bpm,
    rootPitchClass: headerWord.key,
    mode: headerWord.mode,
    lineage: headerWord.lineage
  };
  const harmony = [];
  const events = [];
  const phase4Bars = [];
  let bars = 0;
  let sawEos = false;

  for (let i = 1; i < words.length; i += 1) {
    const word = words[i];
    if (word.kind === "EOS") { sawEos = true; break; }
    if (word.kind === "BAR") {
      bars = Math.max(bars, word.bar + 1);
      phase4Bars[word.bar] = normalizePhase4Bar({
        energy: unbin01(word.energy),
        vocalSpace: unbin01(word.vocalSpace),
        tension: unbin01(word.tension),
        density: unbin01(word.density)
      }, word.bar);
    } else if (word.kind === "CHORD") {
      harmony.push({ ...word });
    } else if (word.kind === "EVENT") {
      events.push({ ...word });
    } else {
      throw new Error(`Compound: kind non valido ${word.kind}`);
    }
  }
  if (!sawEos) throw new Error("Compound: EOS mancante");
  return buildDecodedSequence(header, bars, harmony, events, phase4Bars);
}

function integerIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validateWord(word) {
  if (!word || typeof word !== "object" || Array.isArray(word)) throw new Error("Compound word non oggetto");
  if (word.kind === "HEADER") {
    if (!integerIn(word.bpm, 40, 240)) throw new Error("bpm");
    if (!integerIn(word.key, 0, 11)) throw new Error("key");
    if (!MODES.includes(word.mode)) throw new Error("mode");
    if (!LINEAGES.includes(word.lineage)) throw new Error("lineage");
    return;
  }
  if (word.kind === "EOS") return;
  if (word.kind === "BAR") {
    if (!integerIn(word.bar, 0, 127)) throw new Error("bar");
    for (const key of ["energy", "vocalSpace", "tension", "density"]) if (!integerIn(word[key], 0, 9)) throw new Error(key);
    return;
  }
  if (word.kind === "CHORD") {
    if (!integerIn(word.bar, 0, 127) || !POSITION_TICKS.includes(word.position) || !DURATION_TICKS.includes(word.duration)) throw new Error("chord timing");
    if (!integerIn(word.rootPitchClass, 0, 11) || !integerIn(word.bassPitchClass, 0, 11) || !CHORD_QUALITIES.has(word.quality)) throw new Error("chord identity");
    return;
  }
  if (word.kind === "EVENT") {
    if (!integerIn(word.bar, 0, 127) || !POSITION_TICKS.includes(word.position)) throw new Error("event timing");
    if (!EVENT_TYPE_ORDER.includes(word.type) || !integerIn(word.velocityBin, 0, 9)) throw new Error("event core");
    if (word.note != null && !integerIn(word.note, 0, 127)) throw new Error("event note");
    if (word.duration != null && !DURATION_TICKS.includes(word.duration)) throw new Error("event duration");
    if (word.glideTo != null && !integerIn(word.glideTo, 0, 127)) throw new Error("glideTo");
    if (word.glideDuration != null && !DURATION_TICKS.includes(word.glideDuration)) throw new Error("glideDuration");
    return;
  }
  throw new Error(`kind ${word.kind}`);
}

function validateEncoded(words) {
  try {
    if (!Array.isArray(words) || words.length < 2) throw new Error("stream corto");
    if (words[0].kind !== "HEADER" || words.at(-1).kind !== "EOS") throw new Error("boundary words");
    let expectedBar = 0;
    for (let i = 1; i < words.length - 1; i += 1) {
      const word = words[i];
      if (word.kind === "BAR") {
        if (word.bar !== expectedBar) throw new Error(`BAR attesa ${expectedBar}, trovata ${word.bar}`);
        expectedBar += 1;
      } else if (word.bar !== expectedBar - 1) {
        throw new Error(`item fuori barra: ${word.kind}`);
      }
    }
    decode(words);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function validateVocabulary(words) {
  for (const word of words) validateWord(word);
  return true;
}

module.exports = {
  id: "compound-word-v1",
  family: "compound-word",
  version: 1,
  unitName: "compound-word",
  vocabSize: VOCAB_SIZE,
  metadata: {
    fieldCardinalities: FIELD_CARDINALITIES,
    fieldCardinalitySum: VOCAB_SIZE,
    phase4FeatureCoverage: PHASE4_FEATURES.length
  },
  capabilities: CAPABILITIES,
  phase4Features: PHASE4_FEATURES,
  phase4Snapshot: sequence => phase4Snapshot(sequence, PHASE4_FEATURES),
  prepare,
  encode,
  decode,
  validateEncoded,
  validateVocabulary
};
