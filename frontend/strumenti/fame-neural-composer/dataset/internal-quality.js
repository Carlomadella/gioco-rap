"use strict";

const crypto = require("node:crypto");
const { canonicalSequencesFromItem } = require("./fingerprint");

const INTERNAL_QUALITY_SCHEMA = "fame-neural-internal-quality-v1";

function stableNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeInternalQualityOptions(input = {}) {
  return {
    minDuplicateEventExcess: Number.isInteger(input.minDuplicateEventExcess) && input.minDuplicateEventExcess >= 1
      ? input.minDuplicateEventExcess : 8,
    minDistinctDuplicateKeys: Number.isInteger(input.minDistinctDuplicateKeys) && input.minDistinctDuplicateKeys >= 1
      ? input.minDistinctDuplicateKeys : 6,
    minDuplicateTypes: Number.isInteger(input.minDuplicateTypes) && input.minDuplicateTypes >= 1
      ? input.minDuplicateTypes : 2,
    duplicateEventRatioBlocking: Number.isFinite(Number(input.duplicateEventRatioBlocking))
      ? Math.max(0, Math.min(1, Number(input.duplicateEventRatioBlocking))) : 0.15,
    repeatedBarReviewRatio: Number.isFinite(Number(input.repeatedBarReviewRatio))
      ? Math.max(0, Math.min(1, Number(input.repeatedBarReviewRatio))) : 0.75,
    repeatedBarMinBars: Number.isInteger(input.repeatedBarMinBars) && input.repeatedBarMinBars >= 2
      ? input.repeatedBarMinBars : 4,
    maxEventsPerBarReview: Number.isInteger(input.maxEventsPerBarReview) && input.maxEventsPerBarReview >= 1
      ? input.maxEventsPerBarReview : 96,
    maxPitchRangeReview: Number.isInteger(input.maxPitchRangeReview) && input.maxPitchRangeReview >= 1
      ? input.maxPitchRangeReview : 60,
    skippedMelodicNotesReview: Number.isInteger(input.skippedMelodicNotesReview) && input.skippedMelodicNotesReview >= 0
      ? input.skippedMelodicNotesReview : 1
  };
}

function eventKey(event, relativeTick = null) {
  const payload = {
    type: String(event && event.type || "unknown"),
    tick: relativeTick == null ? Math.round(stableNumber(event && event.tick)) : Math.round(relativeTick)
  };
  if (Number.isFinite(Number(event && event.note))) payload.note = Math.round(Number(event.note));
  if (Number.isFinite(Number(event && event.durationTicks))) payload.durationTicks = Math.round(Number(event.durationTicks));
  if (Number.isFinite(Number(event && event.glideTo))) payload.glideTo = Math.round(Number(event.glideTo));
  if (Number.isFinite(Number(event && event.glideTicks))) payload.glideTicks = Math.round(Number(event.glideTicks));
  return JSON.stringify(payload);
}

function sequenceDuplicateStats(sequence) {
  const events = Array.isArray(sequence && sequence.events) ? sequence.events : [];
  const counts = new Map();
  const typesByKey = new Map();

  for (const event of events) {
    const key = eventKey(event);
    counts.set(key, (counts.get(key) || 0) + 1);
    typesByKey.set(key, String(event && event.type || "unknown"));
  }

  const duplicateEntries = [...counts.entries()].filter(([, count]) => count > 1);
  const duplicateExcess = duplicateEntries.reduce((sum, [, count]) => sum + (count - 1), 0);
  const duplicateTypes = [...new Set(duplicateEntries.map(([key]) => typesByKey.get(key)))].sort();

  return {
    eventCount: events.length,
    duplicateExcess,
    distinctDuplicateKeys: duplicateEntries.length,
    duplicateTypes,
    duplicateRatio: events.length ? duplicateExcess / events.length : 0
  };
}

function barPatternStats(sequence) {
  const timing = sequence && sequence.timing || {};
  const ppq = Math.max(1, Math.round(stableNumber(timing.ppq, 960)));
  const bars = Math.max(1, Math.round(stableNumber(timing.bars, 1)));
  const barTicks = ppq * 4;
  const events = Array.isArray(sequence && sequence.events) ? sequence.events : [];
  const byBar = Array.from({ length: bars }, () => []);

  for (const event of events) {
    const tick = Math.max(0, Math.round(stableNumber(event && event.tick)));
    const barIndex = Math.min(bars - 1, Math.floor(tick / barTicks));
    byBar[barIndex].push(eventKey(event, tick - barIndex * barTicks));
  }

  const signatures = byBar.map(eventsInBar => {
    const normalized = [...eventsInBar].sort();
    return crypto.createHash("sha256").update(normalized.join("|")).digest("hex");
  });

  const groups = new Map();
  signatures.forEach((signature, index) => {
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(index);
  });

  const repeated = [...groups.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([signature, indexes]) => ({ signature, bars: indexes, count: indexes.length }))
    .sort((a, b) => b.count - a.count || a.signature.localeCompare(b.signature));

  const maxRepeatedBars = repeated.length ? repeated[0].count : 1;
  const maxRepeatedCoverage = bars ? maxRepeatedBars / bars : 0;
  const eventsPerBar = byBar.map(x => x.length);

  return {
    bars,
    repeatedBarGroups: repeated,
    maxRepeatedBars,
    maxRepeatedCoverage,
    maxEventsPerBar: eventsPerBar.length ? Math.max(...eventsPerBar) : 0,
    silentBars: eventsPerBar.filter(count => count === 0).length
  };
}

function itemPitchRange(item) {
  let min = Infinity;
  let max = -Infinity;
  for (const { sequence } of canonicalSequencesFromItem(item)) {
    for (const event of Array.isArray(sequence && sequence.events) ? sequence.events : []) {
      if (!Number.isFinite(Number(event && event.note))) continue;
      const note = Math.round(Number(event.note));
      min = Math.min(min, note);
      max = Math.max(max, note);
    }
  }
  return Number.isFinite(min) && Number.isFinite(max) ? max - min : 0;
}

function skippedMelodicNotes(item) {
  const skipped = item && item.import && item.import.analysis && Array.isArray(item.import.analysis.skippedTracks)
    ? item.import.analysis.skippedTracks
    : [];
  return skipped.reduce((sum, track) => sum + Math.max(0, Math.round(stableNumber(track && track.noteCount))), 0);
}

function analyzeInternalQuality(entry, options = {}) {
  const cfg = normalizeInternalQualityOptions(options);
  const sequences = canonicalSequencesFromItem(entry.item);
  const duplicateStats = sequences.map(({ id, sequence }) => ({ id, ...sequenceDuplicateStats(sequence) }));
  const barStats = sequences.map(({ id, sequence }) => ({ id, ...barPatternStats(sequence) }));

  const totalEvents = duplicateStats.reduce((sum, x) => sum + x.eventCount, 0);
  const duplicateExcess = duplicateStats.reduce((sum, x) => sum + x.duplicateExcess, 0);
  const distinctDuplicateKeys = duplicateStats.reduce((sum, x) => sum + x.distinctDuplicateKeys, 0);
  const duplicateTypes = [...new Set(duplicateStats.flatMap(x => x.duplicateTypes))].sort();
  const duplicateRatio = totalEvents ? duplicateExcess / totalEvents : 0;

  const duplicateLayerSuspect =
    duplicateExcess >= cfg.minDuplicateEventExcess &&
    distinctDuplicateKeys >= cfg.minDistinctDuplicateKeys &&
    duplicateTypes.length >= cfg.minDuplicateTypes &&
    duplicateRatio >= cfg.duplicateEventRatioBlocking;

  const totalBars = barStats.reduce((sum, x) => sum + x.bars, 0);
  const maxRepeatedCoverage = barStats.length ? Math.max(...barStats.map(x => x.maxRepeatedCoverage)) : 0;
  const maxEventsPerBar = barStats.length ? Math.max(...barStats.map(x => x.maxEventsPerBar)) : 0;
  const silentBars = barStats.reduce((sum, x) => sum + x.silentBars, 0);
  const pitchRange = itemPitchRange(entry.item);
  const skippedNotes = skippedMelodicNotes(entry.item);

  const reviewIssues = [];
  const reviewCodes = [];

  if (totalBars >= cfg.repeatedBarMinBars && maxRepeatedCoverage >= cfg.repeatedBarReviewRatio) {
    reviewCodes.push("HIGH_BAR_REPETITION");
    reviewIssues.push(`ripetizione barre elevata: ${(maxRepeatedCoverage * 100).toFixed(1)}%`);
  }
  if (maxEventsPerBar > cfg.maxEventsPerBarReview) {
    reviewCodes.push("EXTREME_EVENT_DENSITY");
    reviewIssues.push(`densita' estrema: ${maxEventsPerBar} eventi in una barra`);
  }
  if (pitchRange > cfg.maxPitchRangeReview) {
    reviewCodes.push("EXTREME_PITCH_RANGE");
    reviewIssues.push(`range pitched ampio: ${pitchRange} semitoni`);
  }
  if (skippedNotes >= cfg.skippedMelodicNotesReview && skippedNotes > 0) {
    reviewCodes.push("SKIPPED_MELODIC_NOTES");
    reviewIssues.push(`note melodiche non classificate/importate: ${skippedNotes}`);
  }
  if (totalBars >= cfg.repeatedBarMinBars && silentBars / totalBars >= 0.5) {
    reviewCodes.push("MANY_SILENT_BARS");
    reviewIssues.push(`barre completamente vuote: ${silentBars}/${totalBars}`);
  }

  return {
    itemId: entry.itemId,
    fileName: entry.fileName,
    duplicateLayerSuspect,
    duplicateExcess,
    distinctDuplicateKeys,
    duplicateTypes,
    duplicateRatio,
    totalEvents,
    totalBars,
    maxRepeatedCoverage,
    maxEventsPerBar,
    silentBars,
    pitchRange,
    skippedMelodicNotes: skippedNotes,
    reviewCodes,
    reviewIssues,
    sequenceDuplicateStats: duplicateStats,
    sequenceBarStats: barStats
  };
}

function auditInternalQuality(entries, options = {}) {
  const cfg = normalizeInternalQualityOptions(options);
  const items = entries.map(entry => analyzeInternalQuality(entry, cfg));

  const blockingFindings = items
    .filter(item => item.duplicateLayerSuspect)
    .map(item => ({
      itemId: item.itemId,
      fileName: item.fileName,
      code: "DUPLICATE_LAYER_SUSPECT",
      duplicateExcess: item.duplicateExcess,
      distinctDuplicateKeys: item.distinctDuplicateKeys,
      duplicateTypes: item.duplicateTypes,
      duplicateRatio: item.duplicateRatio
    }));

  const reviewFindings = items
    .filter(item => item.reviewIssues.length > 0)
    .map(item => ({
      itemId: item.itemId,
      fileName: item.fileName,
      codes: item.reviewCodes,
      issues: item.reviewIssues
    }));

  return {
    schema: INTERNAL_QUALITY_SCHEMA,
    version: 1,
    options: cfg,
    totals: {
      items: items.length,
      blockingItems: blockingFindings.length,
      reviewItems: reviewFindings.length,
      repeatedBarReviewItems: items.filter(item => item.reviewCodes.includes("HIGH_BAR_REPETITION")).length,
      duplicateEventExcess: items.reduce((sum, item) => sum + item.duplicateExcess, 0)
    },
    blockingFindings,
    reviewFindings,
    items
  };
}

module.exports = {
  INTERNAL_QUALITY_SCHEMA,
  normalizeInternalQualityOptions,
  eventKey,
  sequenceDuplicateStats,
  barPatternStats,
  analyzeInternalQuality,
  auditInternalQuality
};
