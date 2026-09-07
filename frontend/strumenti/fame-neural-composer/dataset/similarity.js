"use strict";

const { PITCHED_TYPES, canonicalSequencesFromItem } = require("./fingerprint");

const SIMILARITY_SCHEMA = "fame-neural-fuzzy-similarity-v1";

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function pairKey(a, b) {
  return [String(a), String(b)].sort().join("|");
}

function normalizeSimilarityOptions(input = {}) {
  const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const integerOr = (value, fallback) => Number.isInteger(Number(value)) ? Number(value) : fallback;
  const reviewThreshold = clamp01(numberOr(input.reviewThreshold, 0.78));
  const blockingThreshold = Math.max(reviewThreshold, clamp01(numberOr(input.blockingThreshold, 0.94)));
  return {
    enabled: input.enabled !== false,
    timingToleranceTicks: Math.max(1, integerOr(input.timingToleranceTicks, 120)),
    pitchToleranceSemitones: Math.max(0, integerOr(input.pitchToleranceSemitones, 2)),
    durationToleranceTicks: Math.max(1, integerOr(input.durationToleranceTicks, 240)),
    reviewThreshold,
    blockingThreshold,
    minComparableEvents: Math.max(4, integerOr(input.minComparableEvents, 8)),
    minTypeCosine: clamp01(numberOr(input.minTypeCosine, 0.55)),
    minRhythmSketchJaccard: clamp01(numberOr(input.minRhythmSketchJaccard, 0.12)),
    sketchQuantumTicks: Math.max(30, integerOr(input.sketchQuantumTicks, 240)),
    maxPairComparisons: Math.max(1000, integerOr(input.maxPairComparisons, 250000))
  };
}

function scaleTick(value, ppq) {
  const sourcePpq = Number(ppq) > 0 ? Number(ppq) : 960;
  return Math.round((Number(value) || 0) * 960 / sourcePpq);
}

function itemProfile(entry, options = {}) {
  const cfg = normalizeSimilarityOptions(options);
  const sequences = canonicalSequencesFromItem(entry && entry.item);
  const events = [];
  let timelineOffset = 0;
  let bars = 0;

  for (const { sequence } of sequences) {
    const ppq = Number(sequence && sequence.timing && sequence.timing.ppq) || 960;
    const sequenceBars = Math.max(1, Math.round(Number(sequence && sequence.timing && sequence.timing.bars) || 1));
    const sequenceTicks = sequenceBars * 4 * 960;
    const sourceEvents = Array.isArray(sequence && sequence.events) ? sequence.events : [];
    for (const event of sourceEvents) {
      const type = String(event && event.type || "unknown");
      const profiled = {
        type,
        tick: timelineOffset + scaleTick(event && event.tick, ppq),
        durationTicks: Number.isFinite(Number(event && event.durationTicks))
          ? Math.max(1, scaleTick(event.durationTicks, ppq))
          : null,
        note: PITCHED_TYPES.has(type) && Number.isFinite(Number(event && event.note))
          ? Math.round(Number(event.note))
          : null
      };
      events.push(profiled);
    }
    timelineOffset += sequenceTicks;
    bars += sequenceBars;
  }

  events.sort((a, b) => a.tick - b.tick || a.type.localeCompare(b.type) || (a.note ?? -1) - (b.note ?? -1));
  const pitchAnchorEvent = events.find(event => event.note != null);
  const pitchAnchor = pitchAnchorEvent ? pitchAnchorEvent.note : null;
  for (const event of events) {
    event.relativePitch = event.note == null || pitchAnchor == null ? null : event.note - pitchAnchor;
  }

  const byType = {};
  const rhythmSketch = new Set();
  for (const event of events) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    const bucket = Math.round(event.tick / cfg.sketchQuantumTicks);
    rhythmSketch.add(`${event.type}@${bucket}`);
  }

  return {
    itemId: entry.itemId,
    fileName: entry.fileName,
    compositionFamily: entry.compositionFamily,
    bars,
    events,
    pitchedEvents: events.filter(event => event.note != null),
    byType,
    rhythmSketch
  };
}

function cosineCounts(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of keys) {
    const av = Number(a[key]) || 0;
    const bv = Number(b[key]) || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0;
  return clamp01(dot / Math.sqrt(normA * normB));
}

function setJaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
}

function matchEvents(aEvents, bEvents, cfg, pitchAware) {
  if (!aEvents.length || !bEvents.length) {
    return { matched: 0, f1: 0, containment: 0, closeness: 0 };
  }

  const source = aEvents.length <= bEvents.length ? aEvents : bEvents;
  const target = aEvents.length <= bEvents.length ? bEvents : aEvents;
  const used = new Set();
  let matched = 0;
  let closenessSum = 0;

  for (const event of source) {
    let bestIndex = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    let bestCloseness = 0;

    for (let index = 0; index < target.length; index += 1) {
      if (used.has(index)) continue;
      const candidate = target[index];
      if (candidate.type !== event.type) continue;

      const tickDiff = Math.abs(candidate.tick - event.tick);
      if (tickDiff > cfg.timingToleranceTicks) continue;

      let pitchDiff = 0;
      if (pitchAware && (event.relativePitch != null || candidate.relativePitch != null)) {
        if (event.relativePitch == null || candidate.relativePitch == null) continue;
        pitchDiff = Math.abs(candidate.relativePitch - event.relativePitch);
        if (pitchDiff > cfg.pitchToleranceSemitones) continue;
      }

      let durationDiff = 0;
      let durationPenalty = 0;
      if (event.durationTicks != null && candidate.durationTicks != null) {
        durationDiff = Math.abs(candidate.durationTicks - event.durationTicks);
        durationPenalty = Math.min(1, durationDiff / cfg.durationToleranceTicks);
      }

      const timePenalty = tickDiff / cfg.timingToleranceTicks;
      const pitchPenalty = pitchAware && cfg.pitchToleranceSemitones > 0
        ? pitchDiff / cfg.pitchToleranceSemitones
        : 0;
      const cost = timePenalty * 0.55 + pitchPenalty * 0.3 + durationPenalty * 0.15;
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = index;
        bestCloseness = clamp01(1 - cost);
      }
    }

    if (bestIndex >= 0) {
      used.add(bestIndex);
      matched += 1;
      closenessSum += bestCloseness;
    }
  }

  return {
    matched,
    f1: (2 * matched) / (aEvents.length + bEvents.length),
    containment: matched / Math.min(aEvents.length, bEvents.length),
    closeness: matched ? closenessSum / matched : 0
  };
}

function compareProfiles(a, b, options = {}) {
  const cfg = normalizeSimilarityOptions(options);
  const rhythm = matchEvents(a.events, b.events, cfg, false);
  const pitchedComparable = Math.min(a.pitchedEvents.length, b.pitchedEvents.length) >= 3;
  const pitch = pitchedComparable
    ? matchEvents(a.pitchedEvents, b.pitchedEvents, cfg, true)
    : null;
  const typeCosine = cosineCounts(a.byType, b.byType);
  const countBalance = Math.min(a.events.length, b.events.length) / Math.max(1, Math.max(a.events.length, b.events.length));
  const barBalance = Math.min(a.bars, b.bars) / Math.max(1, Math.max(a.bars, b.bars));

  let symmetric;
  let containment;
  if (pitch) {
    symmetric = 0.42 * rhythm.f1 + 0.33 * pitch.f1 + 0.15 * typeCosine + 0.10 * rhythm.closeness;
    containment = 0.40 * rhythm.containment + 0.35 * pitch.containment + 0.15 * typeCosine + 0.10 * rhythm.closeness;
  } else {
    symmetric = 0.65 * rhythm.f1 + 0.20 * typeCosine + 0.15 * rhythm.closeness;
    containment = 0.70 * rhythm.containment + 0.15 * typeCosine + 0.15 * rhythm.closeness;
  }

  const containmentPenalty = 0.85 + 0.15 * Math.sqrt(countBalance);
  const score = clamp01(Math.max(symmetric, containment * containmentPenalty));
  const minimumMatched = Math.min(cfg.minComparableEvents, Math.min(a.events.length, b.events.length));
  const enoughEvidence = rhythm.matched >= minimumMatched;
  const pitchContainmentOk = !pitch || pitch.containment >= 0.85;
  const blocking = enoughEvidence && score >= cfg.blockingThreshold && rhythm.containment >= 0.90 && pitchContainmentOk;
  const review = !blocking && enoughEvidence && score >= cfg.reviewThreshold;

  return {
    score,
    classification: blocking ? "blocking" : review ? "review" : "none",
    evidence: {
      matchedEvents: rhythm.matched,
      rhythmF1: rhythm.f1,
      rhythmContainment: rhythm.containment,
      timingCloseness: rhythm.closeness,
      pitchedF1: pitch ? pitch.f1 : null,
      pitchedContainment: pitch ? pitch.containment : null,
      typeCosine,
      countBalance,
      barBalance
    }
  };
}

function buildSimilarityReport(entries, options = {}, excludedPairs = new Set()) {
  const cfg = normalizeSimilarityOptions(options);
  if (!cfg.enabled) {
    return {
      schema: SIMILARITY_SCHEMA,
      version: 1,
      complete: true,
      disabled: true,
      options: cfg,
      totals: { items: entries.length, pairSpace: 0, excludedKnownPairs: 0, prefilteredOut: 0, comparedPairs: 0, reviewPairs: 0, blockingPairs: 0 },
      reviewPairs: [],
      blockingPairs: []
    };
  }

  const profiles = entries.map(entry => itemProfile(entry, cfg));
  const reviewPairs = [];
  const blockingPairs = [];
  const pairSpace = profiles.length * (profiles.length - 1) / 2;
  let excludedKnownPairs = 0;
  let prefilteredOut = 0;
  let comparedPairs = 0;
  let complete = true;

  outer:
  for (let aIndex = 0; aIndex < profiles.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < profiles.length; bIndex += 1) {
      const a = profiles[aIndex];
      const b = profiles[bIndex];
      const key = pairKey(a.itemId, b.itemId);
      if (excludedPairs.has(key)) {
        excludedKnownPairs += 1;
        continue;
      }

      const typeCosine = cosineCounts(a.byType, b.byType);
      const sketchJaccard = setJaccard(a.rhythmSketch, b.rhythmSketch);
      const countBalance = Math.min(a.events.length, b.events.length) / Math.max(1, Math.max(a.events.length, b.events.length));
      if (typeCosine < cfg.minTypeCosine || sketchJaccard < cfg.minRhythmSketchJaccard || countBalance < 0.25) {
        prefilteredOut += 1;
        continue;
      }

      if (comparedPairs >= cfg.maxPairComparisons) {
        complete = false;
        break outer;
      }
      comparedPairs += 1;
      const comparison = compareProfiles(a, b, cfg);
      if (comparison.classification === "none") continue;

      const result = {
        itemA: a.itemId,
        itemB: b.itemId,
        fileA: a.fileName,
        fileB: b.fileName,
        familyA: a.compositionFamily,
        familyB: b.compositionFamily,
        score: Number(comparison.score.toFixed(6)),
        classification: comparison.classification,
        evidence: Object.fromEntries(Object.entries(comparison.evidence).map(([name, value]) => [name, value == null ? null : Number(Number(value).toFixed(6))]))
      };
      if (comparison.classification === "blocking") blockingPairs.push(result);
      else reviewPairs.push(result);
    }
  }

  reviewPairs.sort((a, b) => b.score - a.score || pairKey(a.itemA, a.itemB).localeCompare(pairKey(b.itemA, b.itemB)));
  blockingPairs.sort((a, b) => b.score - a.score || pairKey(a.itemA, a.itemB).localeCompare(pairKey(b.itemA, b.itemB)));

  return {
    schema: SIMILARITY_SCHEMA,
    version: 1,
    complete,
    disabled: false,
    options: cfg,
    totals: {
      items: entries.length,
      pairSpace,
      excludedKnownPairs,
      prefilteredOut,
      comparedPairs,
      reviewPairs: reviewPairs.length,
      blockingPairs: blockingPairs.length
    },
    reviewPairs,
    blockingPairs
  };
}

module.exports = {
  SIMILARITY_SCHEMA,
  pairKey,
  normalizeSimilarityOptions,
  itemProfile,
  cosineCounts,
  setJaccard,
  matchEvents,
  compareProfiles,
  buildSimilarityReport
};
