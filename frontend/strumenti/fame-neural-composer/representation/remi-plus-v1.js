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
  quantizedEvents,
  quantizedHarmony,
  prepareRepresentationInput,
  buildDecodedSequence,
  phase4Snapshot
} = require("./common");

const SPECIALS = ["<BOS>", "<EOS>", "<ITEM_END>"];
const VELOCITY_BINS = Array.from({ length: 10 }, (_, i) => i);
const NOTES = Array.from({ length: 128 }, (_, i) => i);
const BARS = Array.from({ length: 128 }, (_, i) => i);
const BPMS = Array.from({ length: 201 }, (_, i) => 40 + i);
const KEY_PCS = Array.from({ length: 12 }, (_, i) => i);
const ROLES = [...new Set(["none", ...KICK_ROLES, ...BASS_ROLES])];
const MOTIFS = [...MOTIF_IDS];

const VOCAB_SIZE =
  SPECIALS.length
  + BPMS.length
  + KEY_PCS.length
  + MODES.length
  + LINEAGES.length
  + BARS.length
  + POSITION_TICKS.length
  + EVENT_TYPE_ORDER.length
  + VELOCITY_BINS.length
  + NOTES.length
  + DURATION_TICKS.length
  + ROLES.length
  + MOTIFS.length
  + NOTES.length
  + DURATION_TICKS.length
  + CHORD_QUALITIES.size
  + KEY_PCS.length * 2;

const CAPABILITIES = Object.freeze({
  canonicalEvents: true,
  timing: true,
  harmony: true,
  velocity: "10-bin",
  bass808Glide: true,
  phase4Energy: false,
  phase4VocalSpace: false,
  phase4Tension: false,
  phase4Density: false,
  phase4MotifFamilies: false,
  phase4Kick808Relation: false,
  phase4HatRolls: false,
  phase4TransitionStrength: false,
  note: "REMI+-inspired V1 sul canonico FAME: bar/position/event attributes, senza sidecar FASE 4 high-level."
});

function prepare(input) {
  return prepareRepresentationInput(input, []);
}

function eventTokens(word) {
  const tokens = [`POS=${word.position}`, `EV=${word.type}`, `VEL=${word.velocityBin}`];
  if (word.note != null) tokens.push(`NOTE=${word.note}`);
  if (word.duration != null) tokens.push(`DUR=${word.duration}`);
  if (word.role) tokens.push(`ROLE=${word.role}`);
  if (word.motif) tokens.push(`MOTIF=${word.motif}`);
  if (word.glideTo != null && word.glideDuration != null) {
    tokens.push(`GLIDE_TO=${word.glideTo}`, `GLIDE_DUR=${word.glideDuration}`);
  }
  tokens.push("<ITEM_END>");
  return tokens;
}

function chordTokens(word) {
  return [
    `POS=${word.position}`,
    `CH_ROOT=${word.rootPitchClass}`,
    `CH_QUALITY=${word.quality}`,
    `CH_BASS=${word.bassPitchClass}`,
    `DUR=${word.duration}`,
    "<ITEM_END>"
  ];
}

function encode(sequence) {
  const events = quantizedEvents(sequence);
  const harmony = quantizedHarmony(sequence);
  const tokens = [
    "<BOS>",
    `TEMPO=${sequence.timing.bpm}`,
    `KEY_PC=${sequence.tonality.rootPitchClass}`,
    `MODE=${sequence.tonality.mode}`,
    `LINEAGE=${sequence.meta.lineage}`
  ];

  for (let bar = 0; bar < sequence.timing.bars; bar += 1) {
    tokens.push(`BAR=${bar}`);
    const items = [
      ...harmony.filter(item => item.bar === bar).map(item => ({ kind: "chord", item })),
      ...events.filter(item => item.bar === bar).map(item => ({ kind: "event", item }))
    ].sort((a, b) => a.item.position - b.item.position || a.kind.localeCompare(b.kind));
    for (const entry of items) tokens.push(...(entry.kind === "chord" ? chordTokens(entry.item) : eventTokens(entry.item)));
  }
  tokens.push("<EOS>");
  return tokens;
}

function parseIntToken(token, prefix) {
  if (!String(token).startsWith(prefix)) throw new Error(`atteso ${prefix}*: ${token}`);
  const value = Number.parseInt(String(token).slice(prefix.length), 10);
  if (!Number.isInteger(value)) throw new Error(`valore intero non valido: ${token}`);
  return value;
}

function decode(tokens) {
  let i = 0;
  const take = () => tokens[i++];
  if (take() !== "<BOS>") throw new Error("REMI+: BOS mancante");
  const header = {
    bpm: parseIntToken(take(), "TEMPO="),
    rootPitchClass: parseIntToken(take(), "KEY_PC="),
    mode: String(take()).slice("MODE=".length),
    lineage: String(take()).slice("LINEAGE=".length)
  };
  const harmony = [];
  const events = [];
  let bars = 0;
  let currentBar = -1;

  while (i < tokens.length && tokens[i] !== "<EOS>") {
    currentBar = parseIntToken(take(), "BAR=");
    bars = Math.max(bars, currentBar + 1);
    while (i < tokens.length && tokens[i] !== "<EOS>" && !String(tokens[i]).startsWith("BAR=")) {
      const position = parseIntToken(take(), "POS=");
      if (String(tokens[i]).startsWith("CH_ROOT=")) {
        const rootPitchClass = parseIntToken(take(), "CH_ROOT=");
        const quality = String(take()).slice("CH_QUALITY=".length);
        const bassPitchClass = parseIntToken(take(), "CH_BASS=");
        const duration = parseIntToken(take(), "DUR=");
        if (take() !== "<ITEM_END>") throw new Error("REMI+: CH item non terminato");
        harmony.push({ bar: currentBar, position, rootPitchClass, quality, bassPitchClass, duration });
        continue;
      }

      const typeToken = take();
      if (!String(typeToken).startsWith("EV=")) throw new Error(`REMI+: evento non valido ${typeToken}`);
      const word = {
        bar: currentBar,
        position,
        type: String(typeToken).slice(3),
        velocityBin: parseIntToken(take(), "VEL=")
      };
      while (i < tokens.length && tokens[i] !== "<ITEM_END>") {
        const token = String(take());
        if (token.startsWith("NOTE=")) word.note = Number.parseInt(token.slice(5), 10);
        else if (token.startsWith("DUR=")) word.duration = Number.parseInt(token.slice(4), 10);
        else if (token.startsWith("ROLE=")) word.role = token.slice(5);
        else if (token.startsWith("MOTIF=")) word.motif = token.slice(6);
        else if (token.startsWith("GLIDE_TO=")) word.glideTo = Number.parseInt(token.slice(9), 10);
        else if (token.startsWith("GLIDE_DUR=")) word.glideDuration = Number.parseInt(token.slice(10), 10);
        else throw new Error(`REMI+: attributo evento non valido ${token}`);
      }
      if (take() !== "<ITEM_END>") throw new Error("REMI+: EV item non terminato");
      events.push(word);
    }
  }
  if (take() !== "<EOS>") throw new Error("REMI+: EOS mancante");
  return buildDecodedSequence(header, bars, harmony, events, null);
}

function validateEncoded(tokens) {
  try {
    if (!Array.isArray(tokens) || tokens.length < 6) throw new Error("stream vuoto/corto");
    const decoded = decode(tokens);
    if (!decoded || decoded.schema !== "fame-neural-sequence-v1") throw new Error("decode non canonico");
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function validateVocabulary(tokens) {
  const sets = {
    pos: new Set(POSITION_TICKS),
    dur: new Set(DURATION_TICKS),
    type: new Set(EVENT_TYPE_ORDER),
    quality: new Set(CHORD_QUALITIES),
    mode: new Set(MODES),
    lineage: new Set(LINEAGES),
    role: new Set(ROLES),
    motif: new Set(MOTIFS)
  };
  for (const raw of tokens) {
    const token = String(raw);
    if (SPECIALS.includes(token)) continue;
    if (token.startsWith("TEMPO=")) { const v = Number(token.slice(6)); if (v < 40 || v > 240) throw new Error(token); continue; }
    if (token.startsWith("KEY_PC=")) { const v = Number(token.slice(7)); if (v < 0 || v > 11) throw new Error(token); continue; }
    if (token.startsWith("MODE=")) { if (!sets.mode.has(token.slice(5))) throw new Error(token); continue; }
    if (token.startsWith("LINEAGE=")) { if (!sets.lineage.has(token.slice(8))) throw new Error(token); continue; }
    if (token.startsWith("BAR=")) { const v = Number(token.slice(4)); if (v < 0 || v > 127) throw new Error(token); continue; }
    if (token.startsWith("POS=")) { if (!sets.pos.has(Number(token.slice(4)))) throw new Error(token); continue; }
    if (token.startsWith("EV=")) { if (!sets.type.has(token.slice(3))) throw new Error(token); continue; }
    if (token.startsWith("VEL=")) { const v = Number(token.slice(4)); if (v < 0 || v > 9) throw new Error(token); continue; }
    if (token.startsWith("NOTE=")) { const v = Number(token.slice(5)); if (v < 0 || v > 127) throw new Error(token); continue; }
    if (token.startsWith("DUR=")) { if (!sets.dur.has(Number(token.slice(4)))) throw new Error(token); continue; }
    if (token.startsWith("ROLE=")) { if (!sets.role.has(token.slice(5))) throw new Error(token); continue; }
    if (token.startsWith("MOTIF=")) { if (!sets.motif.has(token.slice(6))) throw new Error(token); continue; }
    if (token.startsWith("GLIDE_TO=")) { const v = Number(token.slice(9)); if (v < 0 || v > 127) throw new Error(token); continue; }
    if (token.startsWith("GLIDE_DUR=")) { if (!sets.dur.has(Number(token.slice(10)))) throw new Error(token); continue; }
    if (token.startsWith("CH_ROOT=") || token.startsWith("CH_BASS=")) { const v = Number(token.slice(token.indexOf("=") + 1)); if (v < 0 || v > 11) throw new Error(token); continue; }
    if (token.startsWith("CH_QUALITY=")) { if (!sets.quality.has(token.slice(11))) throw new Error(token); continue; }
    throw new Error(`token REMI+ fuori vocabolario: ${token}`);
  }
  return true;
}

module.exports = {
  id: "remi-plus-v1",
  family: "remi-plus",
  version: 1,
  unitName: "token",
  vocabSize: VOCAB_SIZE,
  metadata: {
    positionBins: POSITION_TICKS.length,
    durationBins: DURATION_TICKS.length,
    phase4FeatureCoverage: 0
  },
  capabilities: CAPABILITIES,
  phase4Features: [],
  phase4Snapshot: sequence => phase4Snapshot(sequence, []),
  prepare,
  encode,
  decode,
  validateEncoded,
  validateVocabulary
};
