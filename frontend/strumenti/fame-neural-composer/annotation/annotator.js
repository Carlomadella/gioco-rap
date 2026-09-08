"use strict";

const crypto = require("node:crypto");

const ANNOTATION_SCHEMA = "fame-neural-musical-annotation-v1";
const ANNOTATION_VERSION = 1;
const DEFAULT_PPQ = 960;

const DRUM_TYPES = new Set(["kick", "snare", "clap", "hat_closed", "hat_open", "perc", "cymbal", "tom"]);
const PITCHED_TYPES = new Set(["808", "harmony", "lead"]);
const HAT_TYPES = new Set(["hat_closed", "hat_open"]);

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round(value, digits = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function mean(values) {
  const nums = (values || []).map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function stddev(values) {
  const nums = (values || []).map(Number).filter(Number.isFinite);
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(nums.reduce((sum, value) => sum + (value - m) ** 2, 0) / nums.length);
}

function quantize(value, quantum) {
  const q = Math.max(1, Number(quantum) || 1);
  return Math.round((Number(value) || 0) / q) * q;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sourceCollection(item) {
  const sourceId = String(item && item.provenance && item.provenance.sourceId || "unknown");
  const colon = sourceId.indexOf(":");
  return colon > 0 ? sourceId.slice(0, colon) : sourceId;
}

function getTiming(item) {
  const timing = item && item.canonical && item.canonical.timing || {};
  const ppq = Math.max(1, Math.round(Number(timing.ppq) || DEFAULT_PPQ));
  const bars = Math.max(1, Math.round(Number(item && item.phraseBars) || Number(timing.bars) || 1));
  return { ppq, bars, barTicks: ppq * 4 };
}

function stableEvents(item) {
  const events = Array.isArray(item && item.canonical && item.canonical.events)
    ? item.canonical.events
    : [];
  return [...events].map((event, index) => ({ ...event, __index: index }))
    .sort((a, b) =>
      (Number(a.tick) || 0) - (Number(b.tick) || 0)
      || String(a.type || "").localeCompare(String(b.type || ""))
      || (Number(a.note) || -1) - (Number(b.note) || -1)
      || a.__index - b.__index
    );
}

function eventsForBar(events, barIndex, barTicks) {
  const start = barIndex * barTicks;
  const end = start + barTicks;
  return events.filter(event => {
    const tick = Number(event.tick) || 0;
    return tick >= start && tick < end;
  }).map(event => ({ ...event, relativeTick: (Number(event.tick) || 0) - start }));
}

function velocityMean(events) {
  if (!Array.isArray(events) || !events.length) return 0;
  const velocities = events
    .map(event => Number(event.velocity))
    .filter(Number.isFinite)
    .map(value => clamp01(value));
  return velocities.length ? mean(velocities) : 0.65;
}

function onsetGroups(events, type) {
  const byTick = new Map();
  for (const event of events) {
    if (String(event.type || "") !== type) continue;
    const tick = Math.round(Number(event.relativeTick) || 0);
    if (!byTick.has(tick)) byTick.set(tick, []);
    byTick.get(tick).push(event);
  }
  return [...byTick.entries()].sort((a, b) => a[0] - b[0]);
}

function roleCounts(events) {
  const counts = {
    kick: 0, snare: 0, clap: 0, hatClosed: 0, hatOpen: 0, perc: 0,
    otherDrums: 0, "808": 0, harmony: 0, lead: 0, total: events.length
  };
  for (const event of events) {
    const type = String(event.type || "");
    if (type === "kick") counts.kick += 1;
    else if (type === "snare") counts.snare += 1;
    else if (type === "clap") counts.clap += 1;
    else if (type === "hat_closed") counts.hatClosed += 1;
    else if (type === "hat_open") counts.hatOpen += 1;
    else if (type === "perc") counts.perc += 1;
    else if (DRUM_TYPES.has(type)) counts.otherDrums += 1;
    else if (type === "808") counts["808"] += 1;
    else if (type === "harmony") counts.harmony += 1;
    else if (type === "lead") counts.lead += 1;
  }
  return counts;
}

function activityDensity(events) {
  const counts = roleCounts(events);
  const harmonyOnsets = onsetGroups(events, "harmony").length;
  const score =
    counts.kick * 1.25 +
    counts.snare * 1.1 +
    counts.clap * 0.9 +
    (counts.hatClosed + counts.hatOpen) * 0.35 +
    counts.perc * 0.5 +
    counts.otherDrums * 0.45 +
    counts["808"] * 1.0 +
    harmonyOnsets * 0.8 +
    counts.lead * 1.0;
  return clamp01(1 - Math.exp(-score / 14));
}

function rhythmicSyncopation(events, ppq) {
  const rhythm = events.filter(event => DRUM_TYPES.has(String(event.type || "")));
  if (!rhythm.length) return 0;
  const eighth = ppq / 2;
  const tolerance = Math.max(12, ppq / 32);
  let offGrid = 0;
  for (const event of rhythm) {
    const tick = Number(event.relativeTick) || 0;
    const nearest = Math.round(tick / eighth) * eighth;
    if (Math.abs(tick - nearest) > tolerance) offGrid += 1;
  }
  return offGrid / rhythm.length;
}

function harmonyCoverage(events, barTicks) {
  const harmony = events.filter(event => String(event.type || "") === "harmony");
  if (!harmony.length) return 0;
  let duration = 0;
  for (const event of harmony) {
    const start = Math.max(0, Number(event.relativeTick) || 0);
    const rawDuration = Math.max(1, Number(event.durationTicks) || 1);
    duration += Math.max(0, Math.min(barTicks - start, rawDuration));
  }
  // Three sustained chord voices covering a full bar ~= 1.0.
  return clamp01(duration / (barTicks * 3));
}

function scalePitchClasses(rootPitchClass, mode) {
  const root = ((Math.round(Number(rootPitchClass) || 0) % 12) + 12) % 12;
  const intervals = String(mode || "").toLowerCase().includes("minor")
    ? [0, 2, 3, 5, 7, 8, 10]
    : [0, 2, 4, 5, 7, 9, 11];
  return new Set(intervals.map(interval => (root + interval) % 12));
}

function harmonicTension(events, tonality, ppq) {
  const pitched = events.filter(event =>
    PITCHED_TYPES.has(String(event.type || "")) && Number.isFinite(Number(event.note))
  );
  const syncopation = rhythmicSyncopation(events, ppq);
  if (!pitched.length) return clamp01(syncopation * 0.35);

  const scale = scalePitchClasses(
    tonality && tonality.rootPitchClass,
    tonality && tonality.mode
  );
  const outside = pitched.filter(event => !scale.has(((Math.round(Number(event.note)) % 12) + 12) % 12)).length / pitched.length;

  const byTick = new Map();
  for (const event of pitched) {
    const tick = Math.round(Number(event.relativeTick) || 0);
    if (!byTick.has(tick)) byTick.set(tick, []);
    byTick.get(tick).push(Math.round(Number(event.note)));
  }

  let intervalPairs = 0;
  let dissonant = 0;
  for (const notes of byTick.values()) {
    const unique = [...new Set(notes)].sort((a, b) => a - b);
    for (let a = 0; a < unique.length; a += 1) {
      for (let b = a + 1; b < unique.length; b += 1) {
        intervalPairs += 1;
        const ic = Math.abs(unique[b] - unique[a]) % 12;
        if ([1, 2, 6, 10, 11].includes(ic)) dissonant += ic === 1 || ic === 11 ? 1.0 : 0.65;
      }
    }
  }
  const dissonance = intervalPairs ? clamp01(dissonant / intervalPairs) : 0;
  const notes = pitched.map(event => Math.round(Number(event.note)));
  const range = notes.length ? Math.max(...notes) - Math.min(...notes) : 0;
  const rangeScore = clamp01(range / 36);

  return clamp01(outside * 0.5 + dissonance * 0.28 + syncopation * 0.12 + rangeScore * 0.10);
}

function hatRolls(events, ppq) {
  const hats = events
    .filter(event => HAT_TYPES.has(String(event.type || "")))
    .map(event => Math.round(Number(event.relativeTick) || 0))
    .sort((a, b) => a - b);

  const maxGap = Math.max(1, Math.round(ppq / 8)); // 1/32 note at 960 PPQ.
  const runs = [];
  let current = [];
  for (const tick of hats) {
    if (!current.length || tick - current[current.length - 1] <= maxGap) {
      current.push(tick);
    } else {
      if (current.length >= 3) runs.push(current);
      current = [tick];
    }
  }
  if (current.length >= 3) runs.push(current);

  return {
    count: runs.length,
    maxNotes: runs.length ? Math.max(...runs.map(run => run.length)) : 0,
    runs: runs.map(run => ({
      startTick: run[0],
      endTick: run[run.length - 1],
      notes: run.length
    }))
  };
}

function bass808Contour(events) {
  const bass = events
    .filter(event => String(event.type || "") === "808" && Number.isFinite(Number(event.note)))
    .sort((a, b) => (Number(a.relativeTick) || 0) - (Number(b.relativeTick) || 0));

  if (!bass.length) {
    return {
      present: false,
      count: 0,
      startNote: null,
      endNote: null,
      meanNote: null,
      minNote: null,
      maxNote: null,
      rangeSemitones: 0,
      direction: 0,
      meanMotionSemitones: 0,
      glideCount: 0
    };
  }

  const notes = bass.map(event => Math.round(Number(event.note)));
  const motions = [];
  for (let i = 1; i < notes.length; i += 1) motions.push(Math.abs(notes[i] - notes[i - 1]));

  return {
    present: true,
    count: bass.length,
    startNote: notes[0],
    endNote: notes[notes.length - 1],
    meanNote: round(mean(notes), 3),
    minNote: Math.min(...notes),
    maxNote: Math.max(...notes),
    rangeSemitones: Math.max(...notes) - Math.min(...notes),
    direction: round(Math.max(-1, Math.min(1, (notes[notes.length - 1] - notes[0]) / 12))),
    meanMotionSemitones: round(mean(motions), 3),
    glideCount: bass.filter(event => Number.isFinite(Number(event.glideTo))).length
  };
}

function kick808Relation(events, ppq) {
  const kicks = events
    .filter(event => String(event.type || "") === "kick")
    .map(event => Math.round(Number(event.relativeTick) || 0))
    .sort((a, b) => a - b);
  const bass = events
    .filter(event => String(event.type || "") === "808")
    .map(event => Math.round(Number(event.relativeTick) || 0))
    .sort((a, b) => a - b);

  if (!kicks.length || !bass.length) {
    return {
      available: false,
      kickCount: kicks.length,
      bassCount: bass.length,
      exactCoincidenceRatio: 0,
      proximityRatio: 0,
      meanSignedLagTicks: null,
      relationStrength: 0
    };
  }

  const proximityWindow = Math.max(1, Math.round(ppq / 8));
  const exactWindow = Math.max(1, Math.round(ppq / 32));
  let exact = 0;
  let prox = 0;
  const lags = [];

  for (const kick of kicks) {
    let nearest = null;
    for (const tick of bass) {
      const diff = tick - kick;
      if (nearest == null || Math.abs(diff) < Math.abs(nearest)) nearest = diff;
    }
    if (nearest == null) continue;
    if (Math.abs(nearest) <= proximityWindow) {
      prox += 1;
      lags.push(nearest);
    }
    if (Math.abs(nearest) <= exactWindow) exact += 1;
  }

  const exactRatio = exact / kicks.length;
  const proximityRatio = prox / kicks.length;
  return {
    available: true,
    kickCount: kicks.length,
    bassCount: bass.length,
    exactCoincidenceRatio: round(exactRatio),
    proximityRatio: round(proximityRatio),
    meanSignedLagTicks: lags.length ? round(mean(lags), 3) : null,
    relationStrength: round(clamp01(proximityRatio * 0.7 + exactRatio * 0.3))
  };
}

function harmonicPlan(events) {
  const groups = onsetGroups(events, "harmony");
  const chords = [];
  let previousKey = null;

  for (const [tick, chordEvents] of groups) {
    const notes = chordEvents
      .map(event => Number(event.note))
      .filter(Number.isFinite)
      .map(Math.round)
      .sort((a, b) => a - b);
    if (!notes.length) continue;

    const pitchClasses = [...new Set(notes.map(note => ((note % 12) + 12) % 12))].sort((a, b) => a - b);
    const key = pitchClasses.join(",");
    if (key === previousKey) continue;
    previousKey = key;

    chords.push({
      tick,
      pitchClasses,
      estimatedRootPitchClass: ((notes[0] % 12) + 12) % 12,
      noteCount: notes.length
    });
  }

  return {
    present: chords.length > 0,
    chordOnsets: chords.length,
    changeCount: Math.max(0, chords.length - 1),
    chords
  };
}

function motifTokens(events, ppq) {
  const timingQuantum = Math.max(1, Math.round(ppq / 8));
  const durationQuantum = Math.max(1, Math.round(ppq / 8));
  const pitched = events.filter(event =>
    PITCHED_TYPES.has(String(event.type || "")) && Number.isFinite(Number(event.note))
  );
  const anchor = pitched.length ? Math.round(Number(pitched[0].note)) : null;

  const tokens = [];
  const harmonyTicks = new Set();

  for (const event of events) {
    const type = String(event.type || "unknown");
    const tick = quantize(event.relativeTick, timingQuantum);

    if (type === "harmony") {
      if (harmonyTicks.has(tick)) continue;
      harmonyTicks.add(tick);
    }

    const token = { type, tick };
    if (PITCHED_TYPES.has(type) && Number.isFinite(Number(event.note)) && anchor != null) {
      token.pitch = Math.round(Number(event.note)) - anchor;
    }
    if (Number.isFinite(Number(event.durationTicks)) && PITCHED_TYPES.has(type)) {
      token.duration = Math.max(durationQuantum, quantize(event.durationTicks, durationQuantum));
    }
    tokens.push(token);
  }

  tokens.sort((a, b) =>
    a.tick - b.tick
    || a.type.localeCompare(b.type)
    || (a.pitch ?? -999) - (b.pitch ?? -999)
    || (a.duration ?? 0) - (b.duration ?? 0)
  );
  return tokens;
}

function setJaccard(a, b) {
  const setA = a instanceof Set ? a : new Set(a || []);
  const setB = b instanceof Set ? b : new Set(b || []);
  if (!setA.size && !setB.size) return 1;
  let intersection = 0;
  for (const value of setA) if (setB.has(value)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

function motifDescriptor(events, ppq) {
  const tokens = motifTokens(events, ppq);
  const exact = sha256(JSON.stringify(tokens));
  const sketch = new Set(tokens.map(token => `${token.type}@${token.tick}`));
  return { exact, sketch, tokens };
}

function assignMotifs(barDescriptors) {
  const families = [];
  const bars = [];

  for (let index = 0; index < barDescriptors.length; index += 1) {
    const descriptor = barDescriptors[index];
    let best = null;

    for (const family of families) {
      const representative = barDescriptors[family.representativeBar];
      if (descriptor.motif.exact === representative.motif.exact) {
        best = { family, similarity: 1, relation: "exact-return" };
        break;
      }
      const similarity = setJaccard(descriptor.motif.sketch, representative.motif.sketch);
      if (similarity >= 0.72 && (!best || similarity > best.similarity)) {
        best = { family, similarity, relation: "variation" };
      }
    }

    if (!best) {
      const family = { id: `M${families.length + 1}`, representativeBar: index, bars: [index] };
      families.push(family);
      bars.push({ familyId: family.id, relation: "new", similarity: 1 });
    } else {
      best.family.bars.push(index);
      bars.push({
        familyId: best.family.id,
        relation: best.relation,
        similarity: round(best.similarity)
      });
    }
  }

  return {
    bars,
    families: families.map(family => ({
      id: family.id,
      representativeBar: family.representativeBar,
      bars: family.bars
    }))
  };
}

function rolePresenceVector(counts) {
  return {
    drums: counts.kick + counts.snare + counts.clap + counts.hatClosed + counts.hatOpen + counts.perc + counts.otherDrums > 0,
    "808": counts["808"] > 0,
    harmony: counts.harmony > 0,
    lead: counts.lead > 0
  };
}

function barVectorDistance(a, b) {
  const numeric = [
    Math.abs(a.density - b.density),
    Math.abs(a.energy - b.energy),
    Math.abs(a.vocalSpace - b.vocalSpace),
    Math.abs(a.tension - b.tension)
  ];
  const roleKeys = ["drums", "808", "harmony", "lead"];
  const roleChange = roleKeys.filter(role => Boolean(a.roles[role]) !== Boolean(b.roles[role])).length / roleKeys.length;
  return clamp01(mean(numeric) * 0.72 + roleChange * 0.28);
}

function boundaryFillScore(events, barTicks) {
  const lastQuarterStart = barTicks * 0.75;
  const all = events.length;
  if (!all) return 0;
  const tail = events.filter(event => Number(event.relativeTick) >= lastQuarterStart).length;
  return clamp01((tail / all) * 2);
}

function annotateBar(events, barIndex, timing, tonality) {
  const counts = roleCounts(events);
  const density = activityDensity(events);
  const drums = events.filter(event => DRUM_TYPES.has(String(event.type || "")));
  const drumVelocity = velocityMean(drums);
  const kickSnareClap = counts.kick + counts.snare + counts.clap;
  const hats = counts.hatClosed + counts.hatOpen;
  const bassPresence = clamp01(counts["808"] / 5);
  const hatActivity = clamp01(hats / 16);

  const energy = clamp01(
    density * 0.5 +
    drumVelocity * 0.18 +
    clamp01(kickSnareClap / 8) * 0.17 +
    bassPresence * 0.10 +
    hatActivity * 0.05
  );

  const hCoverage = harmonyCoverage(events, timing.barTicks);
  const harmonyOnsets = onsetGroups(events, "harmony").length;
  const obstruction = clamp01(
    clamp01(counts.lead / 10) * 0.44 +
    hCoverage * 0.26 +
    clamp01(harmonyOnsets / 8) * 0.14 +
    clamp01(kickSnareClap / 12) * 0.08 +
    bassPresence * 0.05 +
    hatActivity * 0.03
  );
  const vocalSpace = clamp01(1 - obstruction);
  const tension = harmonicTension(events, tonality, timing.ppq);

  const rolls = hatRolls(events, timing.ppq);
  const bass808 = bass808Contour(events);
  const kick808 = kick808Relation(events, timing.ppq);
  const harmony = harmonicPlan(events);
  const motif = motifDescriptor(events, timing.ppq);

  return {
    index: barIndex,
    counts,
    roles: rolePresenceVector(counts),
    density: round(density),
    energy: round(energy),
    vocalSpace: round(vocalSpace),
    tension: round(tension),
    rhythmicSyncopation: round(rhythmicSyncopation(events, timing.ppq)),
    harmonyCoverage: round(hCoverage),
    hats: {
      count: hats,
      closed: counts.hatClosed,
      open: counts.hatOpen,
      density: round(clamp01(hats / 16)),
      rollCount: rolls.count,
      maxRollNotes: rolls.maxNotes,
      rolls: rolls.runs
    },
    bass808,
    kick808,
    harmony,
    motif,
    tailActivity: round(boundaryFillScore(events, timing.barTicks))
  };
}

function annotationConfidence(item, bars) {
  const source = sourceCollection(item);
  const pitchedBars = bars.filter(bar => bar.roles["808"] || bar.roles.harmony || bar.roles.lead).length;
  const drumBars = bars.filter(bar => bar.roles.drums).length;
  const totalBars = Math.max(1, bars.length);

  return {
    structural: 1,
    density: 0.9,
    energy: round(0.72 + 0.18 * (drumBars / totalBars)),
    vocalSpace: round(0.62 + 0.18 * (pitchedBars / totalBars)),
    tension: round(0.50 + 0.28 * (pitchedBars / totalBars)),
    motif: round(0.68 + 0.16 * Math.min(1, bars.length / 8)),
    sourceClassNote: source
  };
}

function annotatePhrase(item) {
  if (!item || item.schema !== "fame-neural-phrase-item-v1") {
    throw new Error(`Phrase schema non valido: ${String(item && item.schema)}`);
  }
  if (!item.phraseId) throw new Error("phraseId mancante");
  if (!item.canonical || item.canonical.schema !== "fame-neural-sequence-v1") {
    throw new Error(`canonical sequence non valida per ${item.phraseId}`);
  }

  const timing = getTiming(item);
  const events = stableEvents(item);
  const tonality = item.canonical.tonality || {};
  const bars = [];

  for (let index = 0; index < timing.bars; index += 1) {
    bars.push(annotateBar(eventsForBar(events, index, timing.barTicks), index, timing, tonality));
  }

  const motifs = assignMotifs(bars);

  for (let index = 0; index < bars.length; index += 1) {
    const previous = index > 0 ? bars[index - 1] : null;
    const next = index + 1 < bars.length ? bars[index + 1] : null;
    const transitionFromPrevious = previous ? barVectorDistance(previous, bars[index]) : 0;
    const transitionToNext = next
      ? clamp01(barVectorDistance(bars[index], next) * 0.82 + bars[index].tailActivity * 0.18)
      : clamp01(bars[index].tailActivity * 0.55 + (1 - bars[index].density) * 0.15);

    const boundaryBefore = index === 0 ? 1 : transitionFromPrevious;
    const boundaryAfter = index === bars.length - 1 ? 1 : transitionToNext;

    bars[index].motif = {
      familyId: motifs.bars[index].familyId,
      relation: motifs.bars[index].relation,
      similarity: motifs.bars[index].similarity,
      fingerprint: bars[index].motif.exact
    };
    bars[index].phraseBoundary = {
      before: round(boundaryBefore),
      after: round(boundaryAfter),
      strongBefore: boundaryBefore >= 0.6,
      strongAfter: boundaryAfter >= 0.6
    };
    bars[index].transitionStrength = {
      fromPrevious: round(transitionFromPrevious),
      toNext: round(transitionToNext)
    };
    delete bars[index].tailActivity;
  }

  const energy = bars.map(bar => bar.energy);
  const density = bars.map(bar => bar.density);
  const tension = bars.map(bar => bar.tension);
  const vocalSpace = bars.map(bar => bar.vocalSpace);
  const transitions = bars.slice(0, -1).map(bar => bar.transitionStrength.toNext);
  const kick808Relations = bars.filter(bar => bar.kick808.available).map(bar => bar.kick808.relationStrength);

  return {
    schema: ANNOTATION_SCHEMA,
    version: ANNOTATION_VERSION,
    phraseId: item.phraseId,
    sourceDatasetItemId: item.sourceDatasetItemId || null,
    sourceCollection: sourceCollection(item),
    phraseBars: timing.bars,
    method: {
      id: "fame-neural-auto-annotator-v1",
      deterministic: true,
      supervision: "heuristic-unsupervised-estimate",
      warning: "Le annotazioni automatiche sono stime e non verita musicali."
    },
    confidence: annotationConfidence(item, bars),
    global: {
      energy: round(mean(energy)),
      energyRange: round(Math.max(...energy) - Math.min(...energy)),
      density: round(mean(density)),
      densityRange: round(Math.max(...density) - Math.min(...density)),
      tension: round(mean(tension)),
      tensionRange: round(Math.max(...tension) - Math.min(...tension)),
      vocalSpace: round(mean(vocalSpace)),
      vocalSpaceRange: round(Math.max(...vocalSpace) - Math.min(...vocalSpace)),
      transitionStrength: round(transitions.length ? mean(transitions) : 0),
      maxTransitionStrength: round(transitions.length ? Math.max(...transitions) : 0),
      kick808RelationStrength: round(kick808Relations.length ? mean(kick808Relations) : 0)
    },
    motifs: {
      familyCount: motifs.families.length,
      returnCount: motifs.bars.filter(item => item.relation === "exact-return").length,
      variationCount: motifs.bars.filter(item => item.relation === "variation").length,
      families: motifs.families
    },
    bars: bars.map(bar => ({
      index: bar.index,
      density: bar.density,
      energy: bar.energy,
      vocalSpace: bar.vocalSpace,
      tension: bar.tension,
      rhythmicSyncopation: bar.rhythmicSyncopation,
      harmonyCoverage: bar.harmonyCoverage,
      roles: bar.roles,
      counts: bar.counts,
      phraseBoundary: bar.phraseBoundary,
      transitionStrength: bar.transitionStrength,
      motif: bar.motif,
      harmony: bar.harmony,
      bass808: bar.bass808,
      kick808: bar.kick808,
      hats: bar.hats
    }))
  };
}

function validate01(value, label, issues) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) issues.push(`${label} fuori [0,1]: ${String(value)}`);
}

function validateAnnotation(annotation) {
  const issues = [];
  if (!annotation || annotation.schema !== ANNOTATION_SCHEMA) issues.push("schema annotation non valido");
  if (!annotation || !annotation.phraseId) issues.push("phraseId mancante");
  if (!Array.isArray(annotation && annotation.bars) || !annotation.bars.length) issues.push("bars annotation mancanti");

  if (annotation && annotation.global) {
    for (const key of [
      "energy", "energyRange", "density", "densityRange", "tension", "tensionRange",
      "vocalSpace", "vocalSpaceRange", "transitionStrength", "maxTransitionStrength",
      "kick808RelationStrength"
    ]) validate01(annotation.global[key], `global.${key}`, issues);
  }

  for (const bar of annotation && annotation.bars || []) {
    for (const key of ["density", "energy", "vocalSpace", "tension", "rhythmicSyncopation", "harmonyCoverage"]) {
      validate01(bar[key], `bar${bar.index}.${key}`, issues);
    }
    validate01(bar.phraseBoundary && bar.phraseBoundary.before, `bar${bar.index}.boundary.before`, issues);
    validate01(bar.phraseBoundary && bar.phraseBoundary.after, `bar${bar.index}.boundary.after`, issues);
    validate01(bar.transitionStrength && bar.transitionStrength.fromPrevious, `bar${bar.index}.transition.fromPrevious`, issues);
    validate01(bar.transitionStrength && bar.transitionStrength.toNext, `bar${bar.index}.transition.toNext`, issues);
    validate01(bar.kick808 && bar.kick808.relationStrength, `bar${bar.index}.kick808.relationStrength`, issues);
    validate01(bar.hats && bar.hats.density, `bar${bar.index}.hats.density`, issues);
  }

  return { ok: issues.length === 0, issues };
}

function annotationSummary(annotations) {
  const list = Array.isArray(annotations) ? annotations : [];
  const globals = key => list.map(item => Number(item.global && item.global[key])).filter(Number.isFinite);
  const sourceCounts = {};
  const byBars = {};
  let motifReturns = 0;
  let motifVariations = 0;
  let with808 = 0;
  let withKick808Relation = 0;

  for (const item of list) {
    sourceCounts[item.sourceCollection] = (sourceCounts[item.sourceCollection] || 0) + 1;
    byBars[item.phraseBars] = (byBars[item.phraseBars] || 0) + 1;
    motifReturns += Number(item.motifs && item.motifs.returnCount || 0);
    motifVariations += Number(item.motifs && item.motifs.variationCount || 0);
    if ((item.bars || []).some(bar => bar.roles && bar.roles["808"])) with808 += 1;
    if ((item.bars || []).some(bar => bar.kick808 && bar.kick808.available)) withKick808Relation += 1;
  }

  const metrics = {};
  for (const key of ["energy", "density", "tension", "vocalSpace", "transitionStrength", "kick808RelationStrength"]) {
    const values = globals(key);
    metrics[key] = {
      mean: round(mean(values)),
      stddev: round(stddev(values)),
      min: values.length ? round(Math.min(...values)) : 0,
      max: values.length ? round(Math.max(...values)) : 0
    };
  }

  return {
    schema: "fame-neural-musical-annotation-summary-v1",
    version: 1,
    totals: {
      annotations: list.length,
      with808,
      withKick808Relation,
      motifReturns,
      motifVariations
    },
    sourceCollections: Object.fromEntries(Object.entries(sourceCounts).sort()),
    phraseBars: Object.fromEntries(Object.entries(byBars).sort((a, b) => Number(a[0]) - Number(b[0]))),
    metrics
  };
}

module.exports = {
  ANNOTATION_SCHEMA,
  ANNOTATION_VERSION,
  DRUM_TYPES,
  PITCHED_TYPES,
  clamp01,
  mean,
  stddev,
  quantize,
  sha256,
  sourceCollection,
  getTiming,
  stableEvents,
  eventsForBar,
  roleCounts,
  activityDensity,
  rhythmicSyncopation,
  harmonyCoverage,
  harmonicTension,
  hatRolls,
  bass808Contour,
  kick808Relation,
  harmonicPlan,
  motifTokens,
  setJaccard,
  motifDescriptor,
  assignMotifs,
  barVectorDistance,
  annotateBar,
  annotatePhrase,
  validateAnnotation,
  annotationSummary
};
