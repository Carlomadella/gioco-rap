"use strict";

const { BAR_TICKS, createSequence } = require("./core");
const { TOKEN_TO_ID } = require("./vocabulary");

const pitchClassNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function bin01(value) {
  return Math.max(0, Math.min(9, Math.round(Number(value || 0) * 9)));
}

function keyPitchClass(seq) {
  const h = seq.harmony && seq.harmony[0];
  if (h && Number.isFinite(Number(h.rootPitchClass))) return Math.max(0, Math.min(11, Math.round(Number(h.rootPitchClass))));
  if (h && typeof h.root === "string") {
    const idx = pitchClassNames.indexOf(h.root.toUpperCase().replace("♯", "#"));
    if (idx >= 0) return idx;
  }
  return 0;
}

function nearestDurationToken(durationTicks) {
  const d = Math.max(120, Math.min(BAR_TICKS * 2, Math.round(Number(durationTicks) || 120)));
  return Math.max(120, Math.round(d / 120) * 120);
}

function nearestPositionToken(relativeTick) {
  // Preferisce la posizione reale se appartiene alle griglie ufficiali; altrimenti 1/32 più vicino.
  const rel = Math.max(0, Math.min(BAR_TICKS - 1, Math.round(Number(relativeTick) || 0)));
  if (rel % 120 === 0 || rel % 160 === 0 || rel % 320 === 0) return rel;
  return Math.max(0, Math.min(BAR_TICKS - 120, Math.round(rel / 120) * 120));
}

function tokenForEvent(event, barIndex) {
  const tokens = [`EV=${event.type}`, `POS=${nearestPositionToken(event.tick - barIndex * BAR_TICKS)}`, `VEL=${bin01(event.velocity)}`];
  if (Number.isFinite(event.note)) tokens.push(`NOTE=${Math.max(24, Math.min(84, Math.round(event.note)))}`);
  if (Number.isFinite(event.durationTicks)) tokens.push(`DUR=${nearestDurationToken(event.durationTicks)}`);
  if (Number.isFinite(event.glideTo)) tokens.push(`GLIDE_TO=${Math.max(24, Math.min(84, Math.round(event.glideTo)))}`);
  if (event.type === "kick" && event.role) tokens.push(`KICK_ROLE=${event.role}`);
  if (event.type === "808" && event.role) tokens.push(`BASS_ROLE=${event.role}`);
  tokens.push("<EV_END>");
  return tokens;
}

function encode(input) {
  const seq = createSequence(input);
  const mode = (seq.harmony[0] && seq.harmony[0].mode) || "minor";
  const tokens = [
    "<BOS>",
    "GENRE=trap",
    `LINEAGE=${seq.meta.lineage}`,
    `BPM=${seq.timing.bpm}`,
    `KEY_PC=${keyPitchClass(seq)}`,
    `MODE=${mode}`
  ];

  for (const bar of seq.bars) {
    tokens.push(
      `BAR=${bar.index}`,
      `ENERGY=${bin01(bar.energy)}`,
      `VSPACE=${bin01(bar.vocalSpace)}`,
      `TENSION=${bin01(bar.tension)}`,
      `LOWEND=${bin01(bar.lowEndDensity)}`,
      `DRUMS=${bin01(bar.drumDensity)}`,
      `MELODY=${bin01(bar.melodicDensity)}`,
      `MOTIF=${bar.motif}`,
      `TREAT=${bar.motifTreatment}`,
      `TRANSITION=${bar.transitionIntent}`,
      `FUNCTION=${bar.functionRole}`
    );
    const start = bar.index * BAR_TICKS;
    const end = start + BAR_TICKS;
    seq.events.filter(e => e.tick >= start && e.tick < end).forEach(e => tokens.push(...tokenForEvent(e, bar.index)));
    tokens.push("<BAR_END>");
  }
  tokens.push("<EOS>");
  return tokens;
}

function toIds(tokens) {
  return tokens.map((token, i) => {
    const id = TOKEN_TO_ID.get(token);
    if (id == null) throw new Error(`token fuori vocabolario a indice ${i}: ${token}`);
    return id;
  });
}

module.exports = { encode, toIds, bin01, nearestDurationToken, nearestPositionToken };
