"use strict";

function summarizeHarmonyEvents(events, options = {}) {
  const toleranceTicks = Math.max(0, Math.round(Number(options.toleranceTicks) || 0));
  const harmony = (events || [])
    .filter(event => event.type === "harmony" && Number.isFinite(event.note))
    .sort((a, b) => a.tick - b.tick || a.note - b.note || (a.durationTicks || 0) - (b.durationTicks || 0));

  const groups = [];
  for (const event of harmony) {
    let group = groups.at(-1);
    if (!group || event.tick - group.anchorTick > toleranceTicks) {
      group = { anchorTick: event.tick, events: [] };
      groups.push(group);
    }
    group.events.push({
      tick: event.tick,
      note: event.note,
      durationTicks: event.durationTicks || 0,
      velocity: event.velocity
    });
  }

  const chordNoteGroups = groups.map((group, index) => {
    const notes = group.events.map(event => event.note);
    const pitchClasses = [...new Set(notes.map(note => ((note % 12) + 12) % 12))].sort((a, b) => a - b);
    return {
      index,
      startTick: Math.min(...group.events.map(event => event.tick)),
      eventCount: group.events.length,
      notes,
      pitchClasses,
      minDurationTicks: Math.min(...group.events.map(event => event.durationTicks)),
      maxDurationTicks: Math.max(...group.events.map(event => event.durationTicks)),
      chordLike: pitchClasses.length >= 3,
      events: group.events
    };
  });

  return {
    eventCount: harmony.length,
    groupCount: chordNoteGroups.length,
    chordLikeGroupCount: chordNoteGroups.filter(group => group.chordLike).length,
    inferenceApplied: false,
    chordNoteGroups
  };
}

module.exports = {
  summarizeHarmonyEvents
};
