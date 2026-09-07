"use strict";

const PPQ = 960;
const BAR_TICKS = PPQ * 4;

const EVENT_TYPE_ORDER = [
  "harmony", "808", "kick", "snare", "clap", "hat_closed", "hat_open", "perc", "lead", "texture", "fx"
];
const SUPPORTED_EVENT_TYPES = new Set(EVENT_TYPE_ORDER);
const TRANSITION_INTENTS = new Set(["stable", "build", "release", "drop", "turnaround"]);
const MOTIF_TREATMENTS = new Set(["none", "establish", "return", "variation", "fragment", "silence"]);
const FUNCTION_ROLES = new Set(["none", "intro", "verse", "hook", "prehook", "break", "bridge", "outro"]);
const KICK_ROLES = new Set(["none", "REINFORCE", "ANTICIPATE", "RESPONSE"]);
const BASS_ROLES = new Set(["none", "root", "fifth", "octave", "passing", "approach", "pedal", "other"]);
const CHORD_QUALITIES = new Set([
  "major", "minor", "diminished", "augmented", "sus2", "sus4", "power",
  "maj7", "min7", "dom7", "halfdim7", "dim7", "maj9", "min9", "dom9", "add9"
]);
const MODES = new Set(["minor", "major", "dorian", "phrygian"]);
const MOTIF_IDS = new Set(["NONE", "A", "B", "C", "D"]);

function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizePitchClass(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(11, Math.round(n)));
}

function normalizeMidiNote(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(127, Math.round(n)));
}

function normalizeBar(bar, index) {
  const b = bar || {};
  const motif = typeof b.motif === "string" && MOTIF_IDS.has(b.motif) ? b.motif : "NONE";
  return {
    index,
    energy: clamp01(b.energy, 0.5),
    vocalSpace: clamp01(b.vocalSpace, 0.5),
    tension: clamp01(b.tension, 0.5),
    motif,
    motifTreatment: MOTIF_TREATMENTS.has(b.motifTreatment) ? b.motifTreatment : "none",
    transitionIntent: TRANSITION_INTENTS.has(b.transitionIntent) ? b.transitionIntent : "stable",
    functionRole: FUNCTION_ROLES.has(b.functionRole) ? b.functionRole : "none",
    lowEndDensity: clamp01(b.lowEndDensity, 0.5),
    drumDensity: clamp01(b.drumDensity, 0.5),
    melodicDensity: clamp01(b.melodicDensity, 0.5)
  };
}

function normalizeHarmonySegment(segment) {
  const h = segment || {};
  const modeFallback = h.mode === "major" ? "major" : "minor";
  const quality = CHORD_QUALITIES.has(h.quality) ? h.quality : modeFallback;
  const rootPitchClass = normalizePitchClass(h.rootPitchClass, 0);
  const bassPitchClass = h.bassPitchClass == null ? rootPitchClass : normalizePitchClass(h.bassPitchClass, rootPitchClass);
  return {
    startTick: Math.max(0, Math.round(Number(h.startTick) || 0)),
    durationTicks: Math.max(1, Math.round(Number(h.durationTicks) || BAR_TICKS)),
    rootPitchClass,
    quality,
    bassPitchClass
  };
}

function normalizeEvent(event) {
  const e = event || {};
  const out = {
    type: e.type,
    tick: Math.max(0, Math.round(Number(e.tick) || 0)),
    velocity: clamp01(e.velocity, 0.8)
  };

  if (Number.isFinite(Number(e.durationTicks))) out.durationTicks = Math.max(1, Math.round(Number(e.durationTicks)));
  const note = normalizeMidiNote(e.note);
  if (note != null) out.note = note;
  const glideTo = normalizeMidiNote(e.glideTo);
  if (glideTo != null) out.glideTo = glideTo;
  if (Number.isFinite(Number(e.glideTicks))) out.glideTicks = Math.max(1, Math.round(Number(e.glideTicks)));
  if (typeof e.role === "string" && e.role) out.role = e.role;
  if (typeof e.motif === "string" && MOTIF_IDS.has(e.motif)) out.motif = e.motif;
  return out;
}

function eventTypeRank(type) {
  const rank = EVENT_TYPE_ORDER.indexOf(type);
  return rank >= 0 ? rank : EVENT_TYPE_ORDER.length;
}

function compareEvents(a, b) {
  return a.tick - b.tick
    || eventTypeRank(a.type) - eventTypeRank(b.type)
    || (a.note ?? -1) - (b.note ?? -1)
    || (a.durationTicks ?? 0) - (b.durationTicks ?? 0)
    || String(a.role || "").localeCompare(String(b.role || ""))
    || String(a.motif || "").localeCompare(String(b.motif || ""));
}

function compareHarmony(a, b) {
  return a.startTick - b.startTick
    || a.rootPitchClass - b.rootPitchClass
    || a.quality.localeCompare(b.quality)
    || a.bassPitchClass - b.bassPitchClass
    || a.durationTicks - b.durationTicks;
}

function createSequence(input) {
  const src = input || {};
  const timing = src.timing || {};
  const bars = Math.max(1, Math.min(128, Math.round(Number(timing.bars) || (Array.isArray(src.bars) ? src.bars.length : 8))));
  const rawHarmony = Array.isArray(src.harmony) ? src.harmony : [];
  const firstHarmony = rawHarmony[0] || {};
  const tonalityInput = src.tonality || {};
  const mode = MODES.has(tonalityInput.mode)
    ? tonalityInput.mode
    : (MODES.has(firstHarmony.mode) ? firstHarmony.mode : "minor");
  const rootPitchClass = Number.isFinite(Number(tonalityInput.rootPitchClass))
    ? normalizePitchClass(tonalityInput.rootPitchClass)
    : normalizePitchClass(firstHarmony.rootPitchClass, 0);

  return {
    schema: "fame-neural-sequence-v1",
    version: 1,
    meta: {
      seed: String(src.meta && src.meta.seed != null ? src.meta.seed : "0"),
      source: (src.meta && src.meta.source) || "symbolic",
      genre: (src.meta && src.meta.genre) || "trap",
      lineage: (src.meta && src.meta.lineage) || "dark_minimal",
      prompt: (src.meta && src.meta.prompt) || ""
    },
    timing: {
      ppq: PPQ,
      bpm: Math.max(40, Math.min(240, Math.round(Number(timing.bpm) || 140))),
      bars
    },
    tonality: { rootPitchClass, mode },
    harmony: rawHarmony.map(normalizeHarmonySegment).sort(compareHarmony),
    bars: Array.from({ length: bars }, (_, index) => normalizeBar(src.bars && src.bars[index], index)),
    events: Array.isArray(src.events) ? src.events.map(normalizeEvent).sort(compareEvents) : []
  };
}

function validateSequence(input) {
  const seq = createSequence(input);
  const errors = [];
  const warnings = [];
  const maxTick = seq.timing.bars * BAR_TICKS;

  if (input && input.schema && input.schema !== seq.schema) errors.push(`schema non supportato: ${input.schema}`);
  if (input && input.timing && Number(input.timing.ppq) !== PPQ) errors.push(`PPQ deve essere ${PPQ}`);
  if (!Array.isArray(input && input.bars)) errors.push("bars deve essere un array");
  if (!Array.isArray(input && input.events)) errors.push("events deve essere un array");
  if (!MODES.has(seq.tonality.mode)) errors.push(`mode non supportato: ${seq.tonality.mode}`);

  if (Array.isArray(input && input.harmony)) {
    input.harmony.forEach((raw, i) => {
      if (raw && raw.quality != null && !CHORD_QUALITIES.has(raw.quality)) errors.push(`harmony[${i}].quality non supportata: ${raw.quality}`);
      if (raw && raw.rootPitchClass != null && (!Number.isFinite(Number(raw.rootPitchClass)) || Number(raw.rootPitchClass) < 0 || Number(raw.rootPitchClass) > 11)) {
        errors.push(`harmony[${i}].rootPitchClass fuori range: ${raw.rootPitchClass}`);
      }
      if (raw && raw.bassPitchClass != null && (!Number.isFinite(Number(raw.bassPitchClass)) || Number(raw.bassPitchClass) < 0 || Number(raw.bassPitchClass) > 11)) {
        errors.push(`harmony[${i}].bassPitchClass fuori range: ${raw.bassPitchClass}`);
      }
    });
  }

  seq.harmony.forEach((h, i) => {
    if (h.startTick < 0 || h.startTick >= maxTick) errors.push(`harmony[${i}].startTick fuori timeline: ${h.startTick}`);
    if (h.durationTicks <= 0) errors.push(`harmony[${i}].durationTicks non valido: ${h.durationTicks}`);
    if (h.startTick + h.durationTicks > maxTick) errors.push(`harmony[${i}] supera la fine della timeline`);
    if (!CHORD_QUALITIES.has(h.quality)) errors.push(`harmony[${i}].quality non supportata: ${h.quality}`);
  });

  for (let i = 1; i < seq.harmony.length; i++) {
    const prev = seq.harmony[i - 1];
    const curr = seq.harmony[i];
    if (prev.startTick + prev.durationTicks > curr.startTick) {
      errors.push(`harmony[${i - 1}] e harmony[${i}] si sovrappongono`);
    }
  }

  if (Array.isArray(input && input.events)) {
    input.events.forEach((raw, i) => {
      if (raw && raw.note != null && (!Number.isFinite(Number(raw.note)) || Number(raw.note) < 0 || Number(raw.note) > 127)) {
        errors.push(`events[${i}].note MIDI fuori range: ${raw.note}`);
      }
      if (raw && raw.glideTo != null && (!Number.isFinite(Number(raw.glideTo)) || Number(raw.glideTo) < 0 || Number(raw.glideTo) > 127)) {
        errors.push(`events[${i}].glideTo MIDI fuori range: ${raw.glideTo}`);
      }
    });
  }

  seq.events.forEach((e, i) => {
    if (!SUPPORTED_EVENT_TYPES.has(e.type)) errors.push(`events[${i}].type non supportato: ${String(e.type)}`);
    if (e.tick < 0 || e.tick >= maxTick) errors.push(`events[${i}].tick fuori timeline: ${e.tick}`);
    if (e.type === "kick" && e.role && !KICK_ROLES.has(e.role)) errors.push(`events[${i}].role kick non valido: ${e.role}`);
    if (e.type === "808" && e.role && !BASS_ROLES.has(e.role)) errors.push(`events[${i}].role 808 non valido: ${e.role}`);
    if ((e.type === "808" || e.type === "harmony" || e.type === "lead") && !Number.isFinite(e.note)) {
      errors.push(`events[${i}] ${e.type} richiede note MIDI`);
    }
    if ((e.type === "808" || e.type === "harmony" || e.type === "lead") && !Number.isFinite(e.durationTicks)) {
      errors.push(`events[${i}] ${e.type} richiede durationTicks`);
    }
    if (e.glideTo != null || e.glideTicks != null) {
      if (e.type !== "808") errors.push(`events[${i}] glide consentito solo su 808`);
      if (!Number.isFinite(e.glideTo)) errors.push(`events[${i}] glideTo mancante/non valido`);
      if (!Number.isFinite(e.glideTicks)) errors.push(`events[${i}] glideTicks mancante/non valido`);
      if (Number.isFinite(e.durationTicks) && Number.isFinite(e.glideTicks) && e.glideTicks > e.durationTicks) {
        errors.push(`events[${i}] glideTicks supera durationTicks`);
      }
    }
    if (e.durationTicks && e.tick + e.durationTicks > maxTick + BAR_TICKS) {
      warnings.push(`events[${i}] supera di oltre una barra la fine della timeline`);
    }
  });

  return { ok: errors.length === 0, errors, warnings, sequence: seq };
}

function barIndexForTick(tick) {
  return Math.floor(tick / BAR_TICKS);
}

function eventsInBar(seq, barIndex, type) {
  const start = barIndex * BAR_TICKS;
  const end = start + BAR_TICKS;
  return seq.events.filter(e => e.tick >= start && e.tick < end && (!type || e.type === type));
}

function harmonySlicesInBar(seq, barIndex) {
  const barStart = barIndex * BAR_TICKS;
  const barEnd = barStart + BAR_TICKS;
  return seq.harmony
    .filter(h => h.startTick < barEnd && h.startTick + h.durationTicks > barStart)
    .map(h => {
      const startTick = Math.max(h.startTick, barStart);
      const endTick = Math.min(h.startTick + h.durationTicks, barEnd);
      return {
        startTick,
        durationTicks: endTick - startTick,
        rootPitchClass: h.rootPitchClass,
        quality: h.quality,
        bassPitchClass: h.bassPitchClass
      };
    })
    .sort(compareHarmony);
}

module.exports = {
  PPQ,
  BAR_TICKS,
  EVENT_TYPE_ORDER,
  SUPPORTED_EVENT_TYPES,
  TRANSITION_INTENTS,
  MOTIF_TREATMENTS,
  FUNCTION_ROLES,
  KICK_ROLES,
  BASS_ROLES,
  CHORD_QUALITIES,
  MODES,
  MOTIF_IDS,
  createSequence,
  validateSequence,
  compareEvents,
  compareHarmony,
  barIndexForTick,
  eventsInBar,
  harmonySlicesInBar
};
