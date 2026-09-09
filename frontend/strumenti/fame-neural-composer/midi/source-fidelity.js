"use strict";

const { drumEventType } = require("./track-classifier");

const SOURCE_FIDELITY_SCHEMA = "fame-neural-source-fidelity-v1";
const PHRASE_SOURCE_FIDELITY_SCHEMA = "fame-neural-phrase-source-fidelity-v1";
const DRUM_MAPPING_ID = "fame-neural-drum-map-v1";
const DRUM_MAPPING_VERSION = 1;
const CANONICAL_PPQ = 960;

function clampMidiVelocity(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(127, n));
}

function sourceTickToCanonicalTick(sourceTick, sourcePpq) {
  const ppq = Number(sourcePpq);
  if (!Number.isFinite(ppq) || ppq <= 0) {
    throw new Error(`sourcePpq non valido: ${sourcePpq}`);
  }
  return Math.round(Number(sourceTick) * CANONICAL_PPQ / ppq);
}

function projectionForDrumNote(note, sourcePpq) {
  const velocity = clampMidiVelocity(note.velocity);
  return {
    type: drumEventType(note.note),
    tick: sourceTickToCanonicalTick(note.startTick, sourcePpq),
    velocity: velocity / 127
  };
}

function normalizeTempoEvents(parsed) {
  return (parsed.tempos || []).map(item => ({
    tick: Math.max(0, Math.round(Number(item.tick) || 0)),
    bpm: Number(item.bpm) || (60000000 / Number(item.usPerQuarter)),
    usPerQuarter: Math.max(1, Math.round(Number(item.usPerQuarter) || (60000000 / Number(item.bpm)))),
    trackIndex: Number.isInteger(item.trackIndex) ? item.trackIndex : 0
  }));
}

function normalizeTimeSignatures(parsed) {
  return (parsed.timeSignatures || []).map(item => ({
    tick: Math.max(0, Math.round(Number(item.tick) || 0)),
    numerator: Math.max(1, Math.round(Number(item.numerator) || 4)),
    denominator: Math.max(1, Math.round(Number(item.denominator) || 4)),
    trackIndex: Number.isInteger(item.trackIndex) ? item.trackIndex : 0
  }));
}

function buildSourceFidelity(parsed, itemId) {
  if (!parsed || !Number.isFinite(Number(parsed.ppq)) || Number(parsed.ppq) <= 0) {
    throw new Error("Parsed MIDI senza PPQ valido.");
  }
  if (!itemId) throw new Error("itemId richiesto per source fidelity.");

  const sourcePpq = Math.round(Number(parsed.ppq));
  const raw = [];

  for (const track of parsed.tracks || []) {
    for (const note of track.notes || []) {
      if (note.channel !== 9) continue;
      raw.push({
        trackIndex: Number.isInteger(track.index) ? track.index : 0,
        channel: note.channel,
        midiNote: Math.max(0, Math.min(127, Math.round(Number(note.note) || 0))),
        startTick: Math.max(0, Math.round(Number(note.startTick) || 0)),
        durationTicks: Math.max(1, Math.round(Number(note.durationTicks) || 1)),
        velocity: clampMidiVelocity(note.velocity),
        velocityOff: clampMidiVelocity(note.velocityOff),
        program: Math.max(0, Math.min(127, Math.round(Number(note.program) || 0)))
      });
    }
  }

  raw.sort((a, b) =>
    a.startTick - b.startTick
    || a.trackIndex - b.trackIndex
    || a.channel - b.channel
    || a.midiNote - b.midiNote
    || a.durationTicks - b.durationTicks
    || a.velocity - b.velocity
    || a.velocityOff - b.velocityOff
    || a.program - b.program
  );

  const drumEvents = raw.map((event, index) => ({
    sourceEventId: `${itemId}:drum:${String(index).padStart(6, "0")}`,
    ...event,
    canonicalProjection: projectionForDrumNote({
      note: event.midiNote,
      startTick: event.startTick,
      velocity: event.velocity
    }, sourcePpq)
  }));

  return {
    schema: SOURCE_FIDELITY_SCHEMA,
    version: 1,
    sourceDatasetItemId: itemId,
    sourcePpq,
    canonicalPpq: CANONICAL_PPQ,
    mapping: {
      id: DRUM_MAPPING_ID,
      version: DRUM_MAPPING_VERSION,
      projection: "track-classifier.drumEventType",
      tickScaling: "round(sourceTick * canonicalPpq / sourcePpq)"
    },
    tempoEvents: normalizeTempoEvents(parsed),
    timeSignatures: normalizeTimeSignatures(parsed),
    drumEvents
  };
}

function validateSourceFidelity(value, expectedItemId = null) {
  const errors = [];
  if (!value || value.schema !== SOURCE_FIDELITY_SCHEMA) errors.push("schema source fidelity non valido");
  if (!value || value.version !== 1) errors.push("version source fidelity non valida");
  if (!Number.isInteger(value && value.sourcePpq) || value.sourcePpq <= 0) errors.push("sourcePpq non valido");
  if (value && value.canonicalPpq !== CANONICAL_PPQ) errors.push(`canonicalPpq deve essere ${CANONICAL_PPQ}`);
  if (expectedItemId && value && value.sourceDatasetItemId !== expectedItemId) errors.push("sourceDatasetItemId non coerente");
  if (!value || !value.mapping || value.mapping.id !== DRUM_MAPPING_ID || value.mapping.version !== DRUM_MAPPING_VERSION) {
    errors.push("mapping drum non valido");
  }

  const ids = new Set();
  for (const [index, event] of (value && Array.isArray(value.drumEvents) ? value.drumEvents : []).entries()) {
    if (!event || typeof event.sourceEventId !== "string" || !event.sourceEventId) errors.push(`drumEvents[${index}] sourceEventId mancante`);
    else if (ids.has(event.sourceEventId)) errors.push(`drumEvents[${index}] sourceEventId duplicato`);
    else ids.add(event.sourceEventId);
    if (!Number.isInteger(event && event.midiNote) || event.midiNote < 0 || event.midiNote > 127) errors.push(`drumEvents[${index}] midiNote non valido`);
    if (!Number.isInteger(event && event.startTick) || event.startTick < 0) errors.push(`drumEvents[${index}] startTick non valido`);
    if (!Number.isInteger(event && event.durationTicks) || event.durationTicks <= 0) errors.push(`drumEvents[${index}] durationTicks non valido`);
    if (!event || !event.canonicalProjection || typeof event.canonicalProjection.type !== "string") errors.push(`drumEvents[${index}] canonicalProjection non valida`);
  }

  return { ok: errors.length === 0, errors };
}

function buildPhraseSourceFidelity(sourceFidelity, options = {}) {
  if (!sourceFidelity) return null;
  const validation = validateSourceFidelity(sourceFidelity, options.sourceDatasetItemId || null);
  if (!validation.ok) {
    throw new Error(`Source fidelity non valida: ${validation.errors.join("; ")}`);
  }

  const sourcePpq = sourceFidelity.sourcePpq;
  const sourceSegmentStartTick = Math.max(0, Math.round(Number(options.sourceSegmentStartTick) || 0));
  const startBar = Math.max(0, Math.round(Number(options.startBar) || 0));
  const phraseBars = Math.max(1, Math.round(Number(options.phraseBars) || 1));
  const sourceTicksPerBar = sourcePpq * 4;
  const sourceTickStart = sourceSegmentStartTick + startBar * sourceTicksPerBar;
  const sourceTickEndExclusive = sourceTickStart + phraseBars * sourceTicksPerBar;

  const drumEvents = sourceFidelity.drumEvents
    .filter(event => event.startTick >= sourceTickStart && event.startTick < sourceTickEndExclusive)
    .map(event => {
      const phraseSourceTick = event.startTick - sourceTickStart;
      return {
        ...JSON.parse(JSON.stringify(event)),
        phraseSourceTick,
        phraseCanonicalTick: sourceTickToCanonicalTick(phraseSourceTick, sourcePpq)
      };
    });

  return {
    schema: PHRASE_SOURCE_FIDELITY_SCHEMA,
    version: 1,
    sourceDatasetItemId: sourceFidelity.sourceDatasetItemId,
    sourceSegmentId: options.sourceSegmentId || "canonical",
    sourcePpq,
    canonicalPpq: sourceFidelity.canonicalPpq,
    sourceTickStart,
    sourceTickEndExclusive,
    mapping: JSON.parse(JSON.stringify(sourceFidelity.mapping)),
    drumEvents
  };
}

module.exports = {
  SOURCE_FIDELITY_SCHEMA,
  PHRASE_SOURCE_FIDELITY_SCHEMA,
  DRUM_MAPPING_ID,
  DRUM_MAPPING_VERSION,
  CANONICAL_PPQ,
  sourceTickToCanonicalTick,
  projectionForDrumNote,
  buildSourceFidelity,
  validateSourceFidelity,
  buildPhraseSourceFidelity
};
