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
  quantizePosition,
  quantizedEvents,
  quantizedHarmony,
  prepareRepresentationInput,
  buildDecodedSequence,
  normalizePhase4Bar,
  phase4Snapshot
} = require("./common");

const PHASE4_FEATURES = [
  "energy",
  "vocalSpace",
  "tension",
  "density",
  "motifFamilies",
  "kick808Relation",
  "hatRolls",
  "transitionStrength"
];
const MOTIF_RELATIONS = ["none", "new", "exact-return", "variation"];
const FIELD_CARDINALITIES = Object.freeze({
  kind: 6,
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
  scalar01: 10,
  motifFamily: 129,
  motifRelation: MOTIF_RELATIONS.length,
  kick808Available: 2,
  kickBassCount: 129,
  kickLag: 193,
  hatRollCount: 129,
  hatRollNotes: 129
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
  phase4MotifFamilies: "family/relation/similarity-bar-fields",
  phase4Kick808Relation: "availability/counts/ratios/lag/strength-bar-fields",
  phase4HatRolls: "bar-summary-plus-roll-words",
  phase4TransitionStrength: "from/to-10-bin-bar-fields",
  note: "FAME Compound V1: compound words custom Trap, sidecar FASE 4 esplicito e roll hi-hat come unit dedicate."
});

function prepare(input) {
  return prepareRepresentationInput(input, ["energy", "vocalSpace", "tension"]);
}

function motifFamilyNumber(value) {
  const match = /^M(\d+)$/i.exec(String(value || ""));
  return match ? Math.max(1, Math.min(128, Number(match[1]) || 1)) : 0;
}

function lagBin(value) {
  if (!Number.isFinite(Number(value))) return null;
  const rounded = Math.round(Number(value) / 10) * 10;
  return Math.max(-960, Math.min(960, rounded));
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
    const phase = sequence._phase4 && sequence._phase4.bars && sequence._phase4.bars[bar]
      ? sequence._phase4.bars[bar]
      : normalizePhase4Bar({}, bar);
    words.push({
      kind: "BAR",
      bar,
      energy: bin01(phase.energy),
      vocalSpace: bin01(phase.vocalSpace),
      tension: bin01(phase.tension),
      density: bin01(phase.density),
      transitionFrom: bin01(phase.transitionStrength.fromPrevious),
      transitionTo: bin01(phase.transitionStrength.toNext),
      motifFamily: motifFamilyNumber(phase.motifFamilies.familyId),
      motifRelation: MOTIF_RELATIONS.includes(phase.motifFamilies.relation) ? phase.motifFamilies.relation : "none",
      motifSimilarity: bin01(phase.motifFamilies.similarity),
      kick808Available: phase.kick808Relation.available === true,
      kickCount: Math.max(0, Math.min(128, phase.kick808Relation.kickCount || 0)),
      bassCount: Math.max(0, Math.min(128, phase.kick808Relation.bassCount || 0)),
      kickExact: bin01(phase.kick808Relation.exactCoincidenceRatio),
      kickProximity: bin01(phase.kick808Relation.proximityRatio),
      kickLag: lagBin(phase.kick808Relation.meanSignedLagTicks),
      kickStrength: bin01(phase.kick808Relation.strength),
      hatRollCount: Math.max(0, Math.min(128, phase.hatRolls.rollCount || 0)),
      hatMaxRollNotes: Math.max(0, Math.min(128, phase.hatRolls.maxRollNotes || 0))
    });

    for (const run of phase.hatRolls.runs || []) {
      words.push({
        kind: "HAT_ROLL",
        bar,
        start: quantizePosition(run.startTick),
        end: quantizePosition(run.endTick),
        notes: Math.max(0, Math.min(128, run.notes || 0))
      });
    }

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
  if (!Array.isArray(words) || !words.length || words[0].kind !== "HEADER") throw new Error("FAME Compound: HEADER mancante");
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
  const pendingRuns = new Map();
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
        density: unbin01(word.density),
        transitionStrength: {
          fromPrevious: unbin01(word.transitionFrom),
          toNext: unbin01(word.transitionTo)
        },
        motif: {
          familyId: word.motifFamily > 0 ? `M${word.motifFamily}` : "NONE",
          relation: word.motifRelation,
          similarity: unbin01(word.motifSimilarity)
        },
        kick808: {
          available: word.kick808Available === true,
          kickCount: word.kickCount,
          bassCount: word.bassCount,
          exactCoincidenceRatio: unbin01(word.kickExact),
          proximityRatio: unbin01(word.kickProximity),
          meanSignedLagTicks: word.kickLag == null ? null : word.kickLag,
          relationStrength: unbin01(word.kickStrength)
        },
        hats: {
          rollCount: word.hatRollCount,
          maxRollNotes: word.hatMaxRollNotes,
          rolls: []
        }
      }, word.bar);
    } else if (word.kind === "HAT_ROLL") {
      if (!pendingRuns.has(word.bar)) pendingRuns.set(word.bar, []);
      pendingRuns.get(word.bar).push({ startTick: word.start, endTick: word.end, notes: word.notes });
    } else if (word.kind === "CHORD") {
      harmony.push({ ...word });
    } else if (word.kind === "EVENT") {
      events.push({ ...word });
    } else {
      throw new Error(`FAME Compound: kind non valido ${word.kind}`);
    }
  }
  if (!sawEos) throw new Error("FAME Compound: EOS mancante");
  for (const [bar, runs] of pendingRuns) {
    if (!phase4Bars[bar]) phase4Bars[bar] = normalizePhase4Bar({}, bar);
    phase4Bars[bar].hatRolls.runs = runs;
    phase4Bars[bar].hatRolls.rollCount = runs.length;
    phase4Bars[bar].hatRolls.maxRollNotes = runs.length ? Math.max(...runs.map(run => run.notes)) : 0;
  }
  return buildDecodedSequence(header, bars, harmony, events, phase4Bars);
}

function integerIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validateWord(word) {
  if (!word || typeof word !== "object" || Array.isArray(word)) throw new Error("FAME word non oggetto");
  if (word.kind === "HEADER") {
    if (!integerIn(word.bpm, 40, 240) || !integerIn(word.key, 0, 11)) throw new Error("header numeric");
    if (!MODES.includes(word.mode) || !LINEAGES.includes(word.lineage)) throw new Error("header categorical");
    return;
  }
  if (word.kind === "EOS") return;
  if (word.kind === "BAR") {
    if (!integerIn(word.bar, 0, 127)) throw new Error("bar");
    for (const key of ["energy", "vocalSpace", "tension", "density", "transitionFrom", "transitionTo", "motifSimilarity", "kickExact", "kickProximity", "kickStrength"]) {
      if (!integerIn(word[key], 0, 9)) throw new Error(key);
    }
    if (!integerIn(word.motifFamily, 0, 128) || !MOTIF_RELATIONS.includes(word.motifRelation)) throw new Error("motif family");
    if (typeof word.kick808Available !== "boolean" || !integerIn(word.kickCount, 0, 128) || !integerIn(word.bassCount, 0, 128)) throw new Error("kick808");
    if (word.kickLag != null && (!Number.isInteger(word.kickLag) || word.kickLag < -960 || word.kickLag > 960 || word.kickLag % 10 !== 0)) throw new Error("kick lag");
    if (!integerIn(word.hatRollCount, 0, 128) || !integerIn(word.hatMaxRollNotes, 0, 128)) throw new Error("hat summary");
    return;
  }
  if (word.kind === "HAT_ROLL") {
    if (!integerIn(word.bar, 0, 127) || !POSITION_TICKS.includes(word.start) || !POSITION_TICKS.includes(word.end) || !integerIn(word.notes, 0, 128)) throw new Error("hat roll");
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
    if (!Array.isArray(words) || words.length < 2 || words[0].kind !== "HEADER" || words.at(-1).kind !== "EOS") throw new Error("boundaries");
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
  id: "fame-compound-v1",
  family: "fame-compound",
  version: 1,
  unitName: "compound-word",
  vocabSize: VOCAB_SIZE,
  metadata: {
    fieldCardinalities: FIELD_CARDINALITIES,
    fieldCardinalitySum: VOCAB_SIZE,
    phase4FeatureCoverage: PHASE4_FEATURES.length,
    domainSpecificUnits: ["HAT_ROLL"]
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
