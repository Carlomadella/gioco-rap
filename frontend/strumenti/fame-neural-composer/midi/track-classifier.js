"use strict";

const DRUM_MAP = new Map([
  [35, "kick"], [36, "kick"],
  [37, "perc"], [38, "snare"], [39, "clap"], [40, "snare"],
  [41, "perc"], [42, "hat_closed"], [43, "perc"], [44, "hat_closed"],
  [45, "perc"], [46, "hat_open"], [47, "perc"], [48, "perc"], [49, "perc"],
  [50, "perc"], [51, "perc"], [52, "perc"], [53, "perc"], [54, "perc"],
  [55, "perc"], [56, "perc"], [57, "perc"], [58, "perc"], [59, "perc"],
  [60, "perc"], [61, "perc"], [62, "perc"], [63, "perc"], [64, "perc"],
  [65, "perc"], [66, "perc"], [67, "perc"], [68, "perc"], [69, "perc"],
  [70, "perc"], [71, "perc"], [72, "perc"], [73, "perc"], [74, "perc"],
  [75, "perc"], [76, "perc"], [77, "perc"], [78, "perc"], [79, "perc"],
  [80, "perc"], [81, "perc"]
]);

function cleanName(track) {
  return `${track.name || ""} ${track.instrumentName || ""}`.trim().toLowerCase();
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isMostlyMonophonic(notes) {
  if (notes.length < 2) return true;
  const events = [];
  for (const note of notes) {
    events.push([note.startTick, 1]);
    events.push([note.startTick + note.durationTicks, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0;
  let polyMoments = 0;
  for (const [, delta] of events) {
    active += delta;
    if (active > 1) polyMoments += 1;
  }
  return polyMoments <= Math.max(1, Math.floor(notes.length * 0.1));
}

function dominantProgram(notes) {
  const counts = new Map();
  for (const note of notes) counts.set(note.program, (counts.get(note.program) || 0) + 1);
  let winner = null;
  let max = -1;
  for (const [program, count] of counts) {
    if (count > max) {
      winner = program;
      max = count;
    }
  }
  return winner;
}

function classifyMelodicTrack(track) {
  const notes = track.notes.filter(n => n.channel !== 9);
  if (!notes.length) return { role: "none", confidence: 1, reasons: ["nessuna nota melodica"] };

  const name = cleanName(track);
  const pitches = notes.map(n => n.note);
  const med = median(pitches);
  const mono = isMostlyMonophonic(notes);
  const program = dominantProgram(notes);
  const reasons = [];

  if (/\b(808|sub|subbass|sub bass|bass)\b/.test(name)) {
    return { role: "808", confidence: 0.98, reasons: ["nome track indica bass/808"] };
  }
  if (/\b(chord|chords|harmony|harm|piano|keys|keyboard|pad|guitar|strings|organ|rhodes)\b/.test(name)) {
    return { role: "harmony", confidence: 0.94, reasons: ["nome track indica parte armonica"] };
  }
  if (/\b(lead|melody|melodic|arp|arpeggio|pluck|bell|flute|synth lead|countermelody)\b/.test(name)) {
    return { role: "lead", confidence: 0.94, reasons: ["nome track indica linea melodica"] };
  }

  if (program != null && program >= 32 && program <= 39) {
    reasons.push(`GM program bass ${program}`);
    if (mono) return { role: "808", confidence: 0.86, reasons: [...reasons, "tessitura principalmente monofonica"] };
  }
  if (program != null && ((program >= 0 && program <= 7) || (program >= 16 && program <= 23) || (program >= 40 && program <= 55))) {
    reasons.push(`GM program armonico ${program}`);
    if (!mono) return { role: "harmony", confidence: 0.78, reasons: [...reasons, "presenza di polifonia"] };
  }
  if (med != null && med <= 45 && mono) {
    return { role: "808", confidence: 0.68, reasons: [`mediana pitch bassa ${med}`, "tessitura principalmente monofonica"] };
  }
  if (!mono) {
    return { role: "harmony", confidence: 0.62, reasons: ["tessitura polifonica senza nome affidabile"] };
  }

  return { role: "unknown", confidence: 0.35, reasons: ["track melodica ambigua: serve conferma o mapping esplicito"] };
}

function classifyTrack(track) {
  const drumNotes = track.notes.filter(n => n.channel === 9);
  const melodicNotes = track.notes.filter(n => n.channel !== 9);
  const melodic = classifyMelodicTrack(track);
  return {
    trackIndex: track.index,
    name: track.name || "",
    instrumentName: track.instrumentName || "",
    hasDrums: drumNotes.length > 0,
    drumNoteCount: drumNotes.length,
    melodicNoteCount: melodicNotes.length,
    melodicRole: melodic.role,
    confidence: melodic.confidence,
    reasons: melodic.reasons,
    mixedChannels: drumNotes.length > 0 && melodicNotes.length > 0
  };
}

function drumEventType(note) {
  return DRUM_MAP.get(note) || "perc";
}

module.exports = {
  classifyTrack,
  classifyMelodicTrack,
  drumEventType,
  isMostlyMonophonic
};
