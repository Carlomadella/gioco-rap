"use strict";

const mappingRegistry = require("./drum-mapping-profiles.v1.json");
const {
  SOURCE_FIDELITY_SCHEMA,
  validateSourceFidelity
} = require("../midi/source-fidelity");

const DRUM_VIEW_SCHEMA = "fame-neural-drum-view-v2";
const DRUM_VIEW_VERSION = 2;
const DEFAULT_MAPPING_PROFILE = "gm-raw-v1";
const DEFAULT_GRID_DIVISION_PER_QUARTER = 4;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function finiteNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMappingProfile(profileId) {
  const profile = mappingRegistry.profiles && mappingRegistry.profiles[profileId];
  if (!profile) throw new Error(`Drum mapping profile sconosciuto: ${profileId}`);
  return {
    id: profileId,
    ...deepClone(profile)
  };
}

function mapMidiNote(profile, midiNote) {
  const key = String(midiNote);
  const mapped = profile.notes && profile.notes[key];
  if (mapped) {
    return {
      laneId: mapped,
      mappedVoice: mapped,
      mappingStatus: "mapped"
    };
  }
  if (profile.unmappedPolicy === "raw-note-lane") {
    return {
      laneId: `gm_${String(midiNote).padStart(3, "0")}`,
      mappedVoice: null,
      mappingStatus: "raw-fallback"
    };
  }
  throw new Error(`MIDI note ${midiNote} non mappata dal profilo ${profile.id}`);
}

function sortedTempoEvents(sourceFidelity) {
  const events = Array.isArray(sourceFidelity.tempoEvents)
    ? sourceFidelity.tempoEvents.map(deepClone)
    : [];
  events.sort((a, b) => a.tick - b.tick || (a.trackIndex || 0) - (b.trackIndex || 0));
  if (!events.length || events[0].tick > 0) {
    events.unshift({
      tick: 0,
      bpm: 120,
      usPerQuarter: 500000,
      trackIndex: -1,
      implicitFallback: true
    });
  }
  return events;
}

function effectiveBpmAt(tempoEvents, sourceTick) {
  let bpm = 120;
  for (const event of tempoEvents) {
    if (event.tick > sourceTick) break;
    const candidate = finiteNumber(event.bpm, null);
    if (candidate && candidate > 0) bpm = candidate;
  }
  return bpm;
}

function stableMeterForWindow(sourceFidelity, startTick, endTick) {
  const events = Array.isArray(sourceFidelity.timeSignatures)
    ? sourceFidelity.timeSignatures.map(deepClone)
    : [];
  events.sort((a, b) => a.tick - b.tick || (a.trackIndex || 0) - (b.trackIndex || 0));

  let active = { tick: 0, numerator: 4, denominator: 4, implicitFallback: true };
  for (const event of events) {
    if (event.tick > startTick) break;
    active = event;
  }

  const changesInside = events.filter(event => event.tick > startTick && event.tick < endTick);
  if (changesInside.length) {
    throw new Error(
      `Drum View V2 Block1 richiede metro stabile nella window; trovati ${changesInside.length} cambi interni.`
    );
  }

  const numerator = Math.max(1, Math.round(finiteNumber(active.numerator, 4)));
  const denominator = Math.max(1, Math.round(finiteNumber(active.denominator, 4)));
  return {
    numerator,
    denominator,
    source: active.implicitFallback ? "implicit-4/4-fallback" : "source-time-signature"
  };
}

function ticksPerBar(sourcePpq, meter) {
  return sourcePpq * 4 * meter.numerator / meter.denominator;
}

function resolveWindow(sourceFidelity, options = {}) {
  const sourcePpq = sourceFidelity.sourcePpq;
  const provisionalMeter = stableMeterForWindow(sourceFidelity, 0, Number.MAX_SAFE_INTEGER);
  const barTicks = ticksPerBar(sourcePpq, provisionalMeter);

  const startBar = Number.isInteger(options.startBar) && options.startBar >= 0
    ? options.startBar
    : 0;
  const bars = Number.isInteger(options.bars) && options.bars > 0
    ? options.bars
    : 2;

  const sourceStartTick = Number.isFinite(Number(options.sourceStartTick))
    ? Math.max(0, Math.round(Number(options.sourceStartTick)))
    : Math.round(startBar * barTicks);

  const sourceEndTick = Number.isFinite(Number(options.sourceEndTick))
    ? Math.max(sourceStartTick + 1, Math.round(Number(options.sourceEndTick)))
    : Math.round(sourceStartTick + bars * barTicks);

  const meter = stableMeterForWindow(sourceFidelity, sourceStartTick, sourceEndTick);
  const stableBarTicks = ticksPerBar(sourcePpq, meter);

  return {
    sourceStartTick,
    sourceEndTick,
    requestedBars: bars,
    meter,
    ticksPerBar: stableBarTicks
  };
}

function gridSpec(sourceFidelity, window, options = {}) {
  const divisionPerQuarter = Number.isInteger(options.gridDivisionPerQuarter)
    && options.gridDivisionPerQuarter > 0
    ? options.gridDivisionPerQuarter
    : DEFAULT_GRID_DIVISION_PER_QUARTER;

  const stepTicks = sourceFidelity.sourcePpq / divisionPerQuarter;
  if (!Number.isFinite(stepTicks) || stepTicks <= 0) {
    throw new Error("stepTicks non valido.");
  }

  const durationTicks = window.sourceEndTick - window.sourceStartTick;
  const nominalStepCount = Math.max(1, Math.round(durationTicks / stepTicks));
  const stepsPerBar = sourceFidelity.sourcePpq
    * 4
    * window.meter.numerator
    / window.meter.denominator
    / stepTicks;

  return {
    divisionPerQuarter,
    label: divisionPerQuarter === 4 ? "sixteenth" : `1/${divisionPerQuarter * 4}`,
    stepTicks,
    nominalStepCount,
    stepsPerBar
  };
}

function timingProjection(event, sourceFidelity, window, grid, tempoEvents) {
  const relativeTick = event.startTick - window.sourceStartTick;
  const rawNearestStepIndex = Math.round(relativeTick / grid.stepTicks);
  const stepIndex = clamp(rawNearestStepIndex, 0, grid.nominalStepCount - 1);
  const gridTickRelative = stepIndex * grid.stepTicks;
  const gridTickAbsolute = window.sourceStartTick + gridTickRelative;
  const offsetTicks = event.startTick - gridTickAbsolute;
  const bpm = effectiveBpmAt(tempoEvents, event.startTick);
  const offsetQuarterNotes = offsetTicks / sourceFidelity.sourcePpq;
  const offsetMs = offsetQuarterNotes * (60000 / bpm);

  return {
    rawNearestStepIndex,
    stepIndex,
    gridTickAbsolute,
    offsetTicks,
    offsetStepFraction: offsetTicks / grid.stepTicks,
    offsetQuarterNotes,
    offsetMs,
    clippedToWindowBoundary: rawNearestStepIndex !== stepIndex
  };
}

function unknownSemantics() {
  return {
    core: { status: "unknown", evidenceRefs: [] },
    fill: { status: "unknown", evidenceRefs: [] },
    variation: { status: "unknown", evidenceRefs: [] },
    loopability: { status: "unknown", evidenceRefs: [] },
    boundaryQuality: { status: "unknown", evidenceRefs: [] }
  };
}

function buildDrumViewV2(datasetItem, options = {}) {
  if (!datasetItem || datasetItem.schema !== "fame-neural-dataset-item-v1") {
    throw new Error("Drum View V2 richiede fame-neural-dataset-item-v1.");
  }
  if (!datasetItem.sourceFidelity || datasetItem.sourceFidelity.schema !== SOURCE_FIDELITY_SCHEMA) {
    throw new Error("Dataset item senza sourceFidelity V1.");
  }

  const fidelityValidation = validateSourceFidelity(datasetItem.sourceFidelity, datasetItem.itemId);
  if (!fidelityValidation.ok) {
    throw new Error(`sourceFidelity non valida: ${fidelityValidation.errors.join("; ")}`);
  }

  const sourceFidelity = datasetItem.sourceFidelity;
  const mappingProfile = getMappingProfile(options.mappingProfileId || DEFAULT_MAPPING_PROFILE);
  const window = resolveWindow(sourceFidelity, options);
  const grid = gridSpec(sourceFidelity, window, options);
  const tempoEvents = sortedTempoEvents(sourceFidelity);

  const sourceHits = sourceFidelity.drumEvents.filter(event =>
    event.startTick >= window.sourceStartTick
    && event.startTick < window.sourceEndTick
  );

  const hits = sourceHits.map(event => {
    const mapped = mapMidiNote(mappingProfile, event.midiNote);
    const projection = timingProjection(event, sourceFidelity, window, grid, tempoEvents);
    return {
      sourceEventId: event.sourceEventId,
      trackIndex: event.trackIndex,
      channel: event.channel,
      midiNote: event.midiNote,
      rawLaneId: `gm_${String(event.midiNote).padStart(3, "0")}`,
      laneId: mapped.laneId,
      mappedVoice: mapped.mappedVoice,
      mappingStatus: mapped.mappingStatus,
      sourceStartTick: event.startTick,
      sourceDurationTicks: event.durationTicks,
      velocity: event.velocity,
      velocity01: event.velocity / 127,
      velocityOff: event.velocityOff,
      stepIndex: projection.stepIndex,
      rawNearestStepIndex: projection.rawNearestStepIndex,
      offsetTicks: projection.offsetTicks,
      offsetStepFraction: projection.offsetStepFraction,
      offsetQuarterNotes: projection.offsetQuarterNotes,
      offsetMs: projection.offsetMs,
      clippedToWindowBoundary: projection.clippedToWindowBoundary
    };
  });

  hits.sort((a, b) =>
    a.stepIndex - b.stepIndex
    || a.sourceStartTick - b.sourceStartTick
    || a.laneId.localeCompare(b.laneId)
    || a.midiNote - b.midiNote
    || a.sourceEventId.localeCompare(b.sourceEventId)
  );

  const framesByStep = new Map();
  for (const hit of hits) {
    if (!framesByStep.has(hit.stepIndex)) {
      framesByStep.set(hit.stepIndex, {
        stepIndex: hit.stepIndex,
        barIndex: Math.floor(hit.stepIndex / grid.stepsPerBar),
        stepInBar: hit.stepIndex % grid.stepsPerBar,
        sourceGridTick: Math.round(window.sourceStartTick + hit.stepIndex * grid.stepTicks),
        hits: [],
        lanes: {}
      });
    }
    const frame = framesByStep.get(hit.stepIndex);
    frame.hits.push(hit.sourceEventId);
    if (!frame.lanes[hit.laneId]) frame.lanes[hit.laneId] = [];
    frame.lanes[hit.laneId].push(hit.sourceEventId);
  }

  const frames = [...framesByStep.values()].sort((a, b) => a.stepIndex - b.stepIndex);
  const laneIds = [...new Set(hits.map(hit => hit.laneId))].sort();
  const rawMidiNotes = [...new Set(hits.map(hit => hit.midiNote))].sort((a, b) => a - b);
  const fallbackHits = hits.filter(hit => hit.mappingStatus === "raw-fallback");
  const clippedHits = hits.filter(hit => hit.clippedToWindowBoundary);

  return {
    schema: DRUM_VIEW_SCHEMA,
    version: DRUM_VIEW_VERSION,
    viewId: `${datasetItem.itemId}:drum-view-v2:${window.sourceStartTick}-${window.sourceEndTick}:${mappingProfile.id}`,
    sourceDatasetItemId: datasetItem.itemId,
    source: {
      sourceId: datasetItem.provenance && datasetItem.provenance.sourceId || null,
      compositionFamily: datasetItem.provenance && datasetItem.provenance.compositionFamily || datasetItem.itemId,
      sha256: datasetItem.source && datasetItem.source.sha256 || null
    },
    mapping: {
      registrySchema: mappingRegistry.schema,
      registryVersion: mappingRegistry.version,
      profileId: mappingProfile.id,
      profileVersion: mappingProfile.version,
      scope: mappingProfile.scope,
      unmappedPolicy: mappingProfile.unmappedPolicy
    },
    timing: {
      sourcePpq: sourceFidelity.sourcePpq,
      sourceStartTick: window.sourceStartTick,
      sourceEndTick: window.sourceEndTick,
      meter: window.meter,
      grid: {
        divisionPerQuarter: grid.divisionPerQuarter,
        label: grid.label,
        stepTicks: grid.stepTicks,
        nominalStepCount: grid.nominalStepCount,
        stepsPerBar: grid.stepsPerBar
      },
      tempoEvents: tempoEvents
        .filter(event => event.tick <= window.sourceEndTick)
        .map(deepClone)
    },
    semantics: unknownSemantics(),
    metadata: {
      style: null,
      beatType: null,
      sourceSplit: null,
      metadataStatus: "not-enriched"
    },
    stats: {
      sourceHitCount: sourceHits.length,
      hitCount: hits.length,
      frameCount: frames.length,
      laneCount: laneIds.length,
      rawMidiNoteCount: rawMidiNotes.length,
      rawFallbackHitCount: fallbackHits.length,
      boundaryClippedProjectionCount: clippedHits.length,
      multiHitLaneFrameCount: frames.reduce((total, frame) =>
        total + Object.values(frame.lanes).filter(ids => ids.length > 1).length, 0)
    },
    laneIds,
    rawMidiNotes,
    frames,
    hits
  };
}

function validateDrumViewV2(view) {
  const errors = [];
  if (!view || view.schema !== DRUM_VIEW_SCHEMA) errors.push("schema Drum View V2 non valido");
  if (!view || view.version !== DRUM_VIEW_VERSION) errors.push("version Drum View V2 non valida");
  if (!view || !view.sourceDatasetItemId) errors.push("sourceDatasetItemId mancante");
  if (!view || !view.mapping || !view.mapping.profileId) errors.push("mapping profile mancante");
  if (!view || !view.timing || !(view.timing.sourcePpq > 0)) errors.push("sourcePpq non valido");
  if (!view || !view.timing || !view.timing.grid || !(view.timing.grid.stepTicks > 0)) errors.push("grid non valida");

  const hits = Array.isArray(view && view.hits) ? view.hits : [];
  const sourceIds = new Set();
  for (const [index, hit] of hits.entries()) {
    if (!hit || typeof hit.sourceEventId !== "string" || !hit.sourceEventId) {
      errors.push(`hits[${index}] sourceEventId mancante`);
    } else if (sourceIds.has(hit.sourceEventId)) {
      errors.push(`hits[${index}] sourceEventId duplicato`);
    } else {
      sourceIds.add(hit.sourceEventId);
    }
    if (!Number.isInteger(hit && hit.midiNote)) errors.push(`hits[${index}] midiNote non valido`);
    if (!Number.isInteger(hit && hit.velocity)) errors.push(`hits[${index}] velocity non valida`);
    if (!Number.isInteger(hit && hit.stepIndex)) errors.push(`hits[${index}] stepIndex non valido`);
    if (typeof (hit && hit.offsetStepFraction) !== "number") errors.push(`hits[${index}] offset mancante`);
    if (!hit || typeof hit.laneId !== "string" || !hit.laneId) errors.push(`hits[${index}] laneId mancante`);
  }

  const frameRefs = [];
  for (const [index, frame] of (Array.isArray(view && view.frames) ? view.frames : []).entries()) {
    if (!Number.isInteger(frame && frame.stepIndex)) errors.push(`frames[${index}] stepIndex non valido`);
    for (const id of frame.hits || []) frameRefs.push(id);
    for (const ids of Object.values(frame.lanes || {})) {
      if (!Array.isArray(ids)) errors.push(`frames[${index}] lane refs non array`);
    }
  }

  const sortedHitIds = [...sourceIds].sort();
  const sortedFrameRefs = [...frameRefs].sort();
  if (JSON.stringify(sortedHitIds) !== JSON.stringify(sortedFrameRefs)) {
    errors.push("frame linkage non copre esattamente gli hit");
  }

  if (view && view.stats && view.stats.hitCount !== hits.length) {
    errors.push("stats.hitCount non coerente");
  }

  for (const key of ["core", "fill", "variation", "loopability", "boundaryQuality"]) {
    if (!view || !view.semantics || !view.semantics[key] || view.semantics[key].status !== "unknown") {
      errors.push(`semantics.${key} deve restare unknown nel Block1`);
    }
  }

  return { ok: errors.length === 0, errors };
}

module.exports = {
  DRUM_VIEW_SCHEMA,
  DRUM_VIEW_VERSION,
  DEFAULT_MAPPING_PROFILE,
  DEFAULT_GRID_DIVISION_PER_QUARTER,
  getMappingProfile,
  mapMidiNote,
  effectiveBpmAt,
  stableMeterForWindow,
  resolveWindow,
  gridSpec,
  buildDrumViewV2,
  validateDrumViewV2
};
