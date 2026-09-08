"use strict";

const {
  BAR_TICKS,
  EVENT_TYPE_ORDER,
  createSequence,
  harmonySlicesInBar,
  compareEvents
} = require("../core");
const { POSITION_TICKS, DURATION_TICKS } = require("../vocabulary");

const PHASE4_FEATURES = Object.freeze([
  "energy",
  "vocalSpace",
  "tension",
  "density",
  "motifFamilies",
  "kick808Relation",
  "hatRolls",
  "transitionStrength"
]);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function bin01(value) {
  return Math.max(0, Math.min(9, Math.round((Number(value) || 0) * 9)));
}

function unbin01(value) {
  return Math.max(0, Math.min(9, Math.round(Number(value) || 0))) / 9;
}

function nearestFromSorted(value, values) {
  const n = Number(value) || 0;
  let best = values[0];
  let bestDistance = Math.abs(n - best);
  for (let index = 1; index < values.length; index += 1) {
    const distance = Math.abs(n - values[index]);
    if (distance < bestDistance || (distance === bestDistance && values[index] < best)) {
      best = values[index];
      bestDistance = distance;
    }
  }
  return best;
}

function quantizePosition(relativeTick) {
  const bounded = Math.max(0, Math.min(BAR_TICKS - 1, Math.round(Number(relativeTick) || 0)));
  return nearestFromSorted(bounded, POSITION_TICKS);
}

function quantizeDuration(durationTicks) {
  const bounded = Math.max(DURATION_TICKS[0], Math.min(DURATION_TICKS.at(-1), Math.round(Number(durationTicks) || DURATION_TICKS[0])));
  return nearestFromSorted(bounded, DURATION_TICKS);
}

function eventRank(type) {
  const rank = EVENT_TYPE_ORDER.indexOf(type);
  return rank >= 0 ? rank : EVENT_TYPE_ORDER.length;
}

function eventWordFields(event) {
  const out = {
    type: event.type,
    velocityBin: bin01(event.velocity)
  };
  if (Number.isFinite(Number(event.note))) out.note = clamp(Math.round(Number(event.note)), 0, 127);
  if (Number.isFinite(Number(event.durationTicks))) out.duration = quantizeDuration(event.durationTicks);
  if (event.role) out.role = String(event.role);
  if (event.motif) out.motif = String(event.motif);
  if (Number.isFinite(Number(event.glideTo)) && Number.isFinite(Number(event.glideTicks))) {
    out.glideTo = clamp(Math.round(Number(event.glideTo)), 0, 127);
    out.glideDuration = quantizeDuration(event.glideTicks);
  }
  return out;
}

function quantizedEvents(sequence) {
  const seq = createSequence(sequence);
  return seq.events.map(event => {
    const bar = Math.max(0, Math.min(seq.timing.bars - 1, Math.floor(event.tick / BAR_TICKS)));
    return {
      ...eventWordFields(event),
      bar,
      position: quantizePosition(event.tick - bar * BAR_TICKS)
    };
  }).sort((a, b) =>
    a.bar - b.bar
    || a.position - b.position
    || eventRank(a.type) - eventRank(b.type)
    || (a.note ?? -1) - (b.note ?? -1)
    || (a.duration ?? 0) - (b.duration ?? 0)
    || String(a.role || "").localeCompare(String(b.role || ""))
    || String(a.motif || "").localeCompare(String(b.motif || ""))
  );
}

function quantizedHarmony(sequence) {
  const seq = createSequence(sequence);
  const out = [];
  for (let bar = 0; bar < seq.timing.bars; bar += 1) {
    for (const chord of harmonySlicesInBar(seq, bar)) {
      out.push({
        bar,
        position: quantizePosition(chord.startTick - bar * BAR_TICKS),
        duration: quantizeDuration(chord.durationTicks),
        rootPitchClass: chord.rootPitchClass,
        quality: chord.quality,
        bassPitchClass: chord.bassPitchClass
      });
    }
  }
  return out.sort((a, b) =>
    a.bar - b.bar
    || a.position - b.position
    || a.rootPitchClass - b.rootPitchClass
    || a.quality.localeCompare(b.quality)
    || a.bassPitchClass - b.bassPitchClass
  );
}

function mergeHarmonySlices(slices) {
  const sorted = [...slices].sort((a, b) =>
    a.startTick - b.startTick
    || a.rootPitchClass - b.rootPitchClass
    || a.quality.localeCompare(b.quality)
    || a.bassPitchClass - b.bassPitchClass
  );
  const merged = [];
  for (const chord of sorted) {
    const previous = merged.at(-1);
    const sameIdentity = previous
      && previous.rootPitchClass === chord.rootPitchClass
      && previous.quality === chord.quality
      && previous.bassPitchClass === chord.bassPitchClass;
    if (sameIdentity && previous.startTick + previous.durationTicks === chord.startTick) {
      previous.durationTicks += chord.durationTicks;
    } else {
      merged.push({ ...chord });
    }
  }
  return merged;
}

function annotationBar(input, index) {
  return input && input._phase4 && Array.isArray(input._phase4.bars)
    ? input._phase4.bars[index] || null
    : null;
}

function normalizePhase4Bar(bar, index) {
  const source = bar || {};
  const motif = source.motif || {};
  const kick808 = source.kick808 || {};
  const hats = source.hats || {};
  const transition = source.transitionStrength || {};
  return {
    index,
    energy: Number(source.energy) || 0,
    vocalSpace: Number(source.vocalSpace) || 0,
    tension: Number(source.tension) || 0,
    density: Number(source.density) || 0,
    motifFamilies: {
      familyId: motif.familyId || "NONE",
      relation: motif.relation || "none",
      similarity: Number(motif.similarity) || 0
    },
    kick808Relation: {
      available: kick808.available === true,
      kickCount: Math.max(0, Math.round(Number(kick808.kickCount) || 0)),
      bassCount: Math.max(0, Math.round(Number(kick808.bassCount) || 0)),
      exactCoincidenceRatio: Number(kick808.exactCoincidenceRatio) || 0,
      proximityRatio: Number(kick808.proximityRatio) || 0,
      meanSignedLagTicks: Number.isFinite(Number(kick808.meanSignedLagTicks)) ? Number(kick808.meanSignedLagTicks) : null,
      strength: Number(kick808.relationStrength) || 0
    },
    hatRolls: {
      rollCount: Math.max(0, Math.round(Number(hats.rollCount) || 0)),
      maxRollNotes: Math.max(0, Math.round(Number(hats.maxRollNotes) || 0)),
      runs: Array.isArray(hats.rolls) ? hats.rolls.map(run => ({
        startTick: Math.max(0, Math.round(Number(run.startTick) || 0)),
        endTick: Math.max(0, Math.round(Number(run.endTick) || 0)),
        notes: Math.max(0, Math.round(Number(run.notes) || 0))
      })) : []
    },
    transitionStrength: {
      fromPrevious: Number(transition.fromPrevious) || 0,
      toNext: Number(transition.toNext) || 0
    }
  };
}

function prepareRepresentationInput(input, directFeatures = []) {
  const sequence = createSequence(input.sequence);
  const bars = Array.isArray(input.annotation && input.annotation.bars) ? input.annotation.bars : [];
  sequence._phase4 = {
    bars: Array.from({ length: sequence.timing.bars }, (_, index) => normalizePhase4Bar(bars[index], index))
  };
  for (let index = 0; index < sequence.bars.length; index += 1) {
    const source = sequence._phase4.bars[index];
    if (directFeatures.includes("energy")) sequence.bars[index].energy = source.energy;
    if (directFeatures.includes("vocalSpace")) sequence.bars[index].vocalSpace = source.vocalSpace;
    if (directFeatures.includes("tension")) sequence.bars[index].tension = source.tension;
  }
  return sequence;
}

function phase4Snapshot(sequence, supportedFeatures) {
  const features = new Set(supportedFeatures || []);
  const bars = Array.from({ length: Number(sequence && sequence.timing && sequence.timing.bars) || 0 }, (_, index) => {
    const phase = annotationBar(sequence, index);
    const canonical = sequence && sequence.bars && sequence.bars[index] || {};
    const out = { index };
    if (features.has("energy")) out.energy = phase ? phase.energy : canonical.energy;
    if (features.has("vocalSpace")) out.vocalSpace = phase ? phase.vocalSpace : canonical.vocalSpace;
    if (features.has("tension")) out.tension = phase ? phase.tension : canonical.tension;
    if (features.has("density")) out.density = phase ? phase.density : null;
    if (features.has("motifFamilies")) out.motifFamilies = phase ? deepClone(phase.motifFamilies) : null;
    if (features.has("kick808Relation")) out.kick808Relation = phase ? deepClone(phase.kick808Relation) : null;
    if (features.has("hatRolls")) out.hatRolls = phase ? deepClone(phase.hatRolls) : null;
    if (features.has("transitionStrength")) out.transitionStrength = phase ? deepClone(phase.transitionStrength) : null;
    return out;
  });
  return { bars };
}

function decodeEvent(word) {
  const event = {
    type: word.type,
    tick: word.bar * BAR_TICKS + word.position,
    velocity: unbin01(word.velocityBin)
  };
  if (word.note != null) event.note = word.note;
  if (word.duration != null) event.durationTicks = word.duration;
  if (word.role && word.role !== "none") event.role = word.role;
  if (word.motif && word.motif !== "NONE") event.motif = word.motif;
  if (word.glideTo != null && word.glideDuration != null) {
    event.glideTo = word.glideTo;
    event.glideTicks = word.glideDuration;
  }
  return event;
}

function buildDecodedSequence(header, bars, harmonyWords, eventWords, phase4Bars = null) {
  const sequence = createSequence({
    meta: {
      seed: "decoded",
      source: "representation",
      genre: "trap",
      lineage: header.lineage || "dark_minimal",
      prompt: ""
    },
    timing: { ppq: 960, bpm: header.bpm, bars },
    tonality: { rootPitchClass: header.rootPitchClass, mode: header.mode },
    harmony: mergeHarmonySlices(harmonyWords.map(word => ({
      startTick: word.bar * BAR_TICKS + word.position,
      durationTicks: word.duration,
      rootPitchClass: word.rootPitchClass,
      quality: word.quality,
      bassPitchClass: word.bassPitchClass
    }))),
    bars: Array.from({ length: bars }, (_, index) => ({ index })),
    events: eventWords.map(decodeEvent).sort(compareEvents)
  });
  if (phase4Bars) {
    sequence._phase4 = { bars: deepClone(phase4Bars) };
    for (let index = 0; index < sequence.bars.length; index += 1) {
      const phase = phase4Bars[index] || {};
      if (Number.isFinite(Number(phase.energy))) sequence.bars[index].energy = Number(phase.energy);
      if (Number.isFinite(Number(phase.vocalSpace))) sequence.bars[index].vocalSpace = Number(phase.vocalSpace);
      if (Number.isFinite(Number(phase.tension))) sequence.bars[index].tension = Number(phase.tension);
    }
  }
  return sequence;
}

module.exports = {
  PHASE4_FEATURES,
  deepClone,
  bin01,
  unbin01,
  quantizePosition,
  quantizeDuration,
  quantizedEvents,
  quantizedHarmony,
  mergeHarmonySlices,
  prepareRepresentationInput,
  normalizePhase4Bar,
  phase4Snapshot,
  buildDecodedSequence
};
