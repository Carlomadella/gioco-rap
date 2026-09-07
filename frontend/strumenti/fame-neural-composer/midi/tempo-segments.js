"use strict";

function timelineEndTick(parsed) {
  let endTick = Math.max(1, Number(parsed.ppq) * 4);
  for (const track of parsed.tracks || []) {
    endTick = Math.max(endTick, Number(track.endTick) || 0);
    for (const note of track.notes || []) {
      endTick = Math.max(endTick, note.startTick + note.durationTicks);
    }
  }
  for (const item of parsed.tempos || []) endTick = Math.max(endTick, Number(item.tick) || 0);
  for (const item of parsed.timeSignatures || []) endTick = Math.max(endTick, Number(item.tick) || 0);
  for (const item of parsed.keySignatures || []) endTick = Math.max(endTick, Number(item.tick) || 0);
  return Math.max(1, Math.round(endTick));
}

function canonicalTempoPoints(parsed) {
  const source = [...(parsed.tempos || [])].sort((a, b) => a.tick - b.tick || (a.trackIndex || 0) - (b.trackIndex || 0));
  const byTick = new Map();
  for (const tempo of source) {
    byTick.set(Math.max(0, Math.round(tempo.tick)), {
      tick: Math.max(0, Math.round(tempo.tick)),
      bpm: Number(tempo.bpm) || (60000000 / Number(tempo.usPerQuarter)),
      usPerQuarter: Number(tempo.usPerQuarter) || Math.round(60000000 / Number(tempo.bpm)),
      trackIndex: tempo.trackIndex ?? 0
    });
  }

  let points = [...byTick.values()].sort((a, b) => a.tick - b.tick);
  if (!points.length || points[0].tick > 0) {
    points.unshift({ tick: 0, bpm: 120, usPerQuarter: 500000, trackIndex: -1, implicitFallback: true });
  }

  const collapsed = [];
  for (const point of points) {
    const prev = collapsed.at(-1);
    if (prev && Math.round(prev.usPerQuarter) === Math.round(point.usPerQuarter)) continue;
    collapsed.push(point);
  }
  return collapsed;
}

function requiresTempoSegmentation(parsed) {
  const events = parsed.tempos || [];
  if (!events.length) return false;
  if (events.some(t => Number(t.tick) !== 0)) return true;
  const distinct = new Set(events.map(t => Math.round(Number(t.usPerQuarter) || (60000000 / Number(t.bpm)))));
  return distinct.size > 1;
}

function rebaseTimedItems(items, startTick, endTick) {
  return (items || [])
    .filter(item => item.tick >= startTick && item.tick < endTick)
    .map(item => ({ ...item, tick: item.tick - startTick }));
}

function effectiveMeta(items, startTick, endTick) {
  const sorted = [...(items || [])].sort((a, b) => a.tick - b.tick || (a.trackIndex || 0) - (b.trackIndex || 0));
  const before = sorted.filter(item => item.tick <= startTick).at(-1);
  const inside = sorted.filter(item => item.tick > startTick && item.tick < endTick);
  const out = [];
  if (before) out.push({ ...before, tick: 0 });
  out.push(...inside.map(item => ({ ...item, tick: item.tick - startTick })));
  return out;
}

function sliceTrack(track, startTick, endTick) {
  const notes = [];
  for (const note of track.notes || []) {
    const noteStart = note.startTick;
    const noteEnd = note.startTick + note.durationTicks;
    if (noteEnd <= startTick || noteStart >= endTick) continue;
    const clippedStart = Math.max(noteStart, startTick);
    const clippedEnd = Math.min(noteEnd, endTick);
    notes.push({
      ...note,
      startTick: clippedStart - startTick,
      durationTicks: Math.max(1, clippedEnd - clippedStart),
      segmentClippedStart: noteStart < startTick || undefined,
      segmentClippedEnd: noteEnd > endTick || undefined
    });
  }

  return {
    ...track,
    notes,
    programChanges: rebaseTimedItems(track.programChanges, startTick, endTick),
    pitchBends: rebaseTimedItems(track.pitchBends, startTick, endTick),
    controlChanges: rebaseTimedItems(track.controlChanges, startTick, endTick),
    meta: rebaseTimedItems(track.meta, startTick, endTick),
    endTick: Math.max(1, endTick - startTick)
  };
}

function buildTempoSegments(parsed) {
  const points = canonicalTempoPoints(parsed);
  const endTick = timelineEndTick(parsed);
  const segments = [];

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const startTick = point.tick;
    const nextTick = i + 1 < points.length ? points[i + 1].tick : endTick;
    const segmentEnd = Math.min(endTick, nextTick);
    if (segmentEnd <= startTick) continue;

    const tracks = (parsed.tracks || []).map(track => sliceTrack(track, startTick, segmentEnd));
    const segmentParsed = {
      ...parsed,
      tracks,
      trackCount: tracks.length,
      tempos: [{
        tick: 0,
        bpm: point.bpm,
        usPerQuarter: point.usPerQuarter,
        trackIndex: point.trackIndex
      }],
      timeSignatures: effectiveMeta(parsed.timeSignatures, startTick, segmentEnd),
      keySignatures: effectiveMeta(parsed.keySignatures, startTick, segmentEnd),
      warnings: [...(parsed.warnings || [])]
    };

    segments.push({
      index: segments.length,
      sourceStartTick: startTick,
      sourceEndTick: segmentEnd,
      sourceDurationTicks: segmentEnd - startTick,
      bpm: Math.round(point.bpm),
      implicitTempoFallback: !!point.implicitFallback,
      parsed: segmentParsed
    });
  }

  return segments;
}

module.exports = {
  timelineEndTick,
  canonicalTempoPoints,
  requiresTempoSegmentation,
  buildTempoSegments,
  sliceTrack
};
