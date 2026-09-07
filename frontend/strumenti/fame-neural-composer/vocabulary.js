"use strict";

const { PPQ, BAR_TICKS } = require("./core");

const EVENT_TYPES = ["kick", "808", "snare", "clap", "hat_closed", "hat_open", "perc", "harmony", "lead", "texture", "fx"];
const LINEAGES = ["cinematic_street", "musical_church", "dark_minimal", "psychedelic", "bright_spacey", "melodic_emo"];
const MODES = ["minor", "major", "dorian", "phrygian"];
const TRANSITIONS = ["stable", "build", "release", "drop", "turnaround"];
const TREATMENTS = ["none", "establish", "return", "variation", "fragment", "silence"];
const FUNCTIONS = ["none", "intro", "verse", "hook", "prehook", "break", "bridge", "outro"];
const KICK_ROLES = ["REINFORCE", "ANTICIPATE", "RESPONSE"];

function range(start, end, step = 1) {
  const out = [];
  for (let n = start; n <= end; n += step) out.push(n);
  return out;
}

function unionSorted(...arrays) {
  return [...new Set(arrays.flat())].sort((a, b) => a - b);
}

// Onset esprimibili su 1/32 straight e sulle griglie triplet previste dalla Bibbia FAME.
const POSITION_TICKS = unionSorted(
  range(0, BAR_TICKS - 120, 120),
  range(0, BAR_TICKS - 160, 160),
  range(0, BAR_TICKS - 320, 320)
);
const DURATION_TICKS = range(120, BAR_TICKS * 2, 120);
const MIDI_NOTES = range(24, 84);
const VELOCITY_BINS = range(0, 9);
const DENSITY_BINS = range(0, 9);

function buildVocabulary() {
  const tokens = ["<PAD>", "<BOS>", "<EOS>", "<BAR_END>", "<EV_END>"];
  tokens.push("GENRE=trap");
  LINEAGES.forEach(v => tokens.push(`LINEAGE=${v}`));
  MODES.forEach(v => tokens.push(`MODE=${v}`));
  range(40, 240).forEach(v => tokens.push(`BPM=${v}`));
  range(0, 11).forEach(v => tokens.push(`KEY_PC=${v}`));
  range(0, 127).forEach(v => tokens.push(`BAR=${v}`));
  DENSITY_BINS.forEach(v => {
    tokens.push(`ENERGY=${v}`, `VSPACE=${v}`, `TENSION=${v}`, `LOWEND=${v}`, `DRUMS=${v}`, `MELODY=${v}`);
  });
  ["NONE", "A", "B", "C", "D"].forEach(v => tokens.push(`MOTIF=${v}`));
  TREATMENTS.forEach(v => tokens.push(`TREAT=${v}`));
  TRANSITIONS.forEach(v => tokens.push(`TRANSITION=${v}`));
  FUNCTIONS.forEach(v => tokens.push(`FUNCTION=${v}`));
  EVENT_TYPES.forEach(v => tokens.push(`EV=${v}`));
  POSITION_TICKS.forEach(v => tokens.push(`POS=${v}`));
  DURATION_TICKS.forEach(v => tokens.push(`DUR=${v}`));
  MIDI_NOTES.forEach(v => tokens.push(`NOTE=${v}`, `GLIDE_TO=${v}`));
  VELOCITY_BINS.forEach(v => tokens.push(`VEL=${v}`));
  KICK_ROLES.forEach(v => tokens.push(`KICK_ROLE=${v}`));
  ["root", "fifth", "octave", "passing", "approach", "pedal", "other"].forEach(v => tokens.push(`BASS_ROLE=${v}`));
  return Object.freeze(tokens);
}

const TOKENS = buildVocabulary();
const TOKEN_TO_ID = new Map(TOKENS.map((token, id) => [token, id]));

module.exports = {
  PPQ,
  BAR_TICKS,
  POSITION_TICKS,
  DURATION_TICKS,
  TOKENS,
  TOKEN_TO_ID,
  vocabSize: TOKENS.length
};
