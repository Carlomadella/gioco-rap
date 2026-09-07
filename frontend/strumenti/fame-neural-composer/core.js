"use strict";

const PPQ = 960;
const BAR_TICKS = PPQ * 4;
const SUPPORTED_EVENT_TYPES = new Set([
  "kick", "808", "snare", "clap", "hat_closed", "hat_open", "perc",
  "harmony", "lead", "texture", "fx"
]);
const TRANSITION_INTENTS = new Set(["stable", "build", "release", "drop", "turnaround"]);
const MOTIF_TREATMENTS = new Set(["none", "establish", "return", "variation", "fragment", "silence"]);
const FUNCTION_ROLES = new Set(["none", "intro", "verse", "hook", "prehook", "break", "bridge", "outro"]);
const KICK_ROLES = new Set(["REINFORCE", "ANTICIPATE", "RESPONSE"]);

function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBar(bar, index) {
  const b = bar || {};
  return {
    index,
    energy: clamp01(b.energy, 0.5),
    vocalSpace: clamp01(b.vocalSpace, 0.5),
    tension: clamp01(b.tension, 0.5),
    motif: typeof b.motif === "string" && b.motif ? b.motif : "NONE",
    motifTreatment: MOTIF_TREATMENTS.has(b.motifTreatment) ? b.motifTreatment : "none",
    transitionIntent: TRANSITION_INTENTS.has(b.transitionIntent) ? b.transitionIntent : "stable",
    functionRole: FUNCTION_ROLES.has(b.functionRole) ? b.functionRole : "none",
    lowEndDensity: clamp01(b.lowEndDensity, 0.5),
    drumDensity: clamp01(b.drumDensity, 0.5),
    melodicDensity: clamp01(b.melodicDensity, 0.5)
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
  if (Number.isFinite(Number(e.note))) out.note = Math.round(Number(e.note));
  if (Number.isFinite(Number(e.glideTo))) out.glideTo = Math.round(Number(e.glideTo));
  if (typeof e.role === "string" && e.role) out.role = e.role;
  if (typeof e.motif === "string" && e.motif) out.motif = e.motif;
  return out;
}

function createSequence(input) {
  const src = input || {};
  const timing = src.timing || {};
  const bars = Math.max(1, Math.min(128, Math.round(Number(timing.bars) || (Array.isArray(src.bars) ? src.bars.length : 8))));
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
    harmony: Array.isArray(src.harmony) ? clone(src.harmony) : [],
    bars: Array.from({ length: bars }, (_, index) => normalizeBar(src.bars && src.bars[index], index)),
    events: Array.isArray(src.events) ? src.events.map(normalizeEvent).sort((a, b) => a.tick - b.tick || a.type.localeCompare(b.type)) : []
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

  seq.events.forEach((e, i) => {
    if (!SUPPORTED_EVENT_TYPES.has(e.type)) errors.push(`events[${i}].type non supportato: ${String(e.type)}`);
    if (e.tick < 0 || e.tick >= maxTick) errors.push(`events[${i}].tick fuori timeline: ${e.tick}`);
    if (e.type === "kick" && e.role && !KICK_ROLES.has(e.role)) errors.push(`events[${i}].role kick non valido: ${e.role}`);
    if ((e.type === "808" || e.type === "harmony" || e.type === "lead") && !Number.isFinite(e.note)) {
      errors.push(`events[${i}] ${e.type} richiede note MIDI`);
    }
    if (e.type === "808" && !Number.isFinite(e.durationTicks)) errors.push(`events[${i}] 808 richiede durationTicks`);
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

module.exports = {
  PPQ,
  BAR_TICKS,
  SUPPORTED_EVENT_TYPES,
  TRANSITION_INTENTS,
  MOTIF_TREATMENTS,
  FUNCTION_ROLES,
  KICK_ROLES,
  createSequence,
  validateSequence,
  barIndexForTick,
  eventsInBar
};
