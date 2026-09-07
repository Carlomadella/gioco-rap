"use strict";

const {
  PPQ,
  BAR_TICKS,
  EVENT_TYPE_ORDER,
  CHORD_QUALITIES,
  KICK_ROLES,
  BASS_ROLES,
  MOTIF_IDS
} = require("./core");

const LINEAGES = ["cinematic_street", "musical_church", "dark_minimal", "psychedelic", "bright_spacey", "melodic_emo"];
const MODES = ["minor", "major", "dorian", "phrygian"];
const TRANSITIONS = ["stable", "build", "release", "drop", "turnaround"];
const TREATMENTS = ["none", "establish", "return", "variation", "fragment", "silence"];
const FUNCTIONS = ["none", "intro", "verse", "hook", "prehook", "break", "bridge", "outro"];

function range(start, end, step = 1) {
  const out = [];
  for (let n = start; n <= end; n += step) out.push(n);
  return out;
}

function unionSorted(...arrays) {
  return [...new Set(arrays.flat())].sort((a, b) => a - b);
}

// Posizioni onset supportate nella prima grammatica neurale:
// 1/32 straight, 1/16 triplet e 1/8 triplet.
const POSITION_TICKS = unionSorted(
  range(0, BAR_TICKS - 120, 120),
  range(0, BAR_TICKS - 160, 160),
  range(0, BAR_TICKS - 320, 320)
);

// Durate fino a due barre sulle stesse famiglie di griglia.
const DURATION_TICKS = unionSorted(
  range(120, BAR_TICKS * 2, 120),
  range(160, BAR_TICKS * 2, 160),
  range(320, BAR_TICKS * 2, 320)
);

const MIDI_NOTES = range(0, 127);
const VELOCITY_BINS = range(0, 9);
const DENSITY_BINS = range(0, 9);

function buildVocabulary() {
  const tokens = [
    "<PAD>", "<BOS>", "<EOS>", "<BAR_END>", "<EV_END>", "<CH_START>", "<CH_END>",
    "GLIDE_TO=NONE", "GLIDE_DUR=NONE"
  ];

  tokens.push("GENRE=trap");
  LINEAGES.forEach(v => tokens.push(`LINEAGE=${v}`));
  MODES.forEach(v => tokens.push(`MODE=${v}`));
  range(40, 240).forEach(v => tokens.push(`BPM=${v}`));
  range(0, 11).forEach(v => tokens.push(`KEY_PC=${v}`));
  range(0, 127).forEach(v => tokens.push(`BAR=${v}`));

  DENSITY_BINS.forEach(v => {
    tokens.push(`ENERGY=${v}`, `VSPACE=${v}`, `TENSION=${v}`, `LOWEND=${v}`, `DRUMS=${v}`, `MELODY=${v}`);
  });

  [...MOTIF_IDS].forEach(v => tokens.push(`MOTIF=${v}`, `EV_MOTIF=${v}`));
  TREATMENTS.forEach(v => tokens.push(`TREAT=${v}`));
  TRANSITIONS.forEach(v => tokens.push(`TRANSITION=${v}`));
  FUNCTIONS.forEach(v => tokens.push(`FUNCTION=${v}`));

  EVENT_TYPE_ORDER.forEach(v => tokens.push(`EV=${v}`));
  POSITION_TICKS.forEach(v => tokens.push(`POS=${v}`));
  DURATION_TICKS.forEach(v => tokens.push(`DUR=${v}`, `GLIDE_DUR=${v}`));
  MIDI_NOTES.forEach(v => tokens.push(`NOTE=${v}`, `GLIDE_TO=${v}`));
  VELOCITY_BINS.forEach(v => tokens.push(`VEL=${v}`));

  [...KICK_ROLES].forEach(v => tokens.push(`KICK_ROLE=${v}`));
  [...BASS_ROLES].forEach(v => tokens.push(`BASS_ROLE=${v}`));

  range(0, 11).forEach(v => tokens.push(`CH_ROOT=${v}`, `CH_BASS=${v}`));
  [...CHORD_QUALITIES].forEach(v => tokens.push(`CH_QUALITY=${v}`));

  return Object.freeze(tokens);
}

const TOKENS = buildVocabulary();
const TOKEN_TO_ID = new Map(TOKENS.map((token, id) => [token, id]));
const ID_TO_TOKEN = Object.freeze([...TOKENS]);

module.exports = {
  PPQ,
  BAR_TICKS,
  POSITION_TICKS,
  DURATION_TICKS,
  TOKENS,
  TOKEN_TO_ID,
  ID_TO_TOKEN,
  vocabSize: TOKENS.length,
  LINEAGES,
  MODES,
  TRANSITIONS,
  TREATMENTS,
  FUNCTIONS
};
