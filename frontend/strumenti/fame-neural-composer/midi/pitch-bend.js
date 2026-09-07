"use strict";

function semitonesForBend(value, rangeSemitones = 2) {
  const normalized = Math.max(-8192, Math.min(8191, Number(value) || 0)) / 8192;
  return normalized * rangeSemitones;
}

function bendsForNote(track, note) {
  const endTick = note.startTick + note.durationTicks;
  return track.pitchBends
    .filter(b => b.channel === note.channel && b.tick >= note.startTick && b.tick <= endTick)
    .sort((a, b) => a.tick - b.tick);
}

function directionChanges(values) {
  let prevSign = 0;
  let changes = 0;
  for (const value of values) {
    const sign = Math.sign(value);
    if (!sign) continue;
    if (prevSign && sign !== prevSign) changes += 1;
    prevSign = sign;
  }
  return changes;
}

function inferSimple808Glide(track, note, sourcePpq, scaleTick, options = {}) {
  const rangeSemitones = Number.isFinite(Number(options.pitchBendRangeSemitones))
    ? Number(options.pitchBendRangeSemitones)
    : 2;
  const bends = bendsForNote(track, note);
  if (!bends.length) return { glide: null, consumed: 0, warning: null };

  const semitones = bends.map(b => semitonesForBend(b.value, rangeSemitones));
  const significant = bends
    .map((bend, i) => ({ bend, semitones: semitones[i] }))
    .filter(x => Math.abs(x.semitones) >= 0.45);

  if (!significant.length) return { glide: null, consumed: bends.length, warning: null };
  if (directionChanges(significant.map(x => x.semitones)) > 0) {
    return {
      glide: null,
      consumed: bends.length,
      warning: "Pitch bend cambia direzione dentro la nota 808: non riducibile in modo lossless a un singolo glide V1."
    };
  }

  const first = significant[0];
  const last = significant.at(-1);
  const targetOffset = Math.round(last.semitones);
  if (targetOffset === 0) return { glide: null, consumed: bends.length, warning: null };

  const target = note.note + targetOffset;
  if (target < 0 || target > 127) {
    return {
      glide: null,
      consumed: bends.length,
      warning: `Target glide fuori range MIDI: ${target}.`
    };
  }

  const noteEnd = note.startTick + note.durationTicks;
  const glideStart = first.bend.tick;
  const glideTicksSource = Math.max(1, noteEnd - glideStart);
  return {
    glide: {
      glideTo: target,
      glideTicks: Math.max(1, scaleTick(glideTicksSource, sourcePpq))
    },
    consumed: bends.length,
    warning: Math.abs(last.semitones - targetOffset) > 0.2
      ? `Pitch bend finale ${last.semitones.toFixed(2)} semitoni quantizzato a ${targetOffset}.`
      : null
  };
}

module.exports = {
  semitonesForBend,
  bendsForNote,
  inferSimple808Glide
};
