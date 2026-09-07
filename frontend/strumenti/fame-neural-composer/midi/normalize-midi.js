"use strict";

const { PPQ, BAR_TICKS, createSequence, validateSequence } = require("../core");
const { classifyTrack, drumEventType } = require("./track-classifier");
const { normalizeTrackOverrides, resolveTrackOverride } = require("./track-overrides");
const { inferSimple808Glide } = require("./pitch-bend");

const MAJOR_KEY_PC_BY_SHARPS_FLATS = new Map([
  [-7, 11], [-6, 6], [-5, 1], [-4, 8], [-3, 3], [-2, 10], [-1, 5],
  [0, 0], [1, 7], [2, 2], [3, 9], [4, 4], [5, 11], [6, 6], [7, 1]
]);
const MINOR_KEY_PC_BY_SHARPS_FLATS = new Map([
  [-7, 8], [-6, 3], [-5, 10], [-4, 5], [-3, 0], [-2, 7], [-1, 2],
  [0, 9], [1, 4], [2, 11], [3, 6], [4, 1], [5, 8], [6, 3], [7, 10]
]);

function scaleTick(tick, sourcePpq) {
  return Math.round(Number(tick) * PPQ / sourcePpq);
}

function uniqueTimelineEvents(events, signature) {
  const seen = new Set();
  const out = [];
  for (const event of events) {
    const key = signature(event);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }
  return out;
}

function resolveTempo(parsed, warnings, errors) {
  if (parsed.tempos.length === 0) {
    warnings.push({ code: "TEMPO_MISSING", message: "Tempo MIDI assente: uso 120 BPM come fallback tecnico." });
    return 120;
  }
  const tempos = uniqueTimelineEvents(parsed.tempos, t => `${t.tick}:${Math.round(t.usPerQuarter)}`);
  const distinct = [...new Set(tempos.map(t => Math.round(t.usPerQuarter)))];
  if (distinct.length > 1 || tempos.some(t => t.tick !== 0)) {
    errors.push({ code: "TEMPO_MAP_UNSUPPORTED", message: "Il formato canonico V1 supporta un solo tempo costante; MIDI con tempo map bloccato." });
  }
  return Math.round(tempos[0].bpm);
}

function resolveMeter(parsed, warnings, errors) {
  if (parsed.timeSignatures.length === 0) {
    warnings.push({ code: "TIME_SIGNATURE_MISSING", message: "Time signature assente: uso 4/4 come fallback tecnico." });
    return { numerator: 4, denominator: 4 };
  }
  const signatures = uniqueTimelineEvents(parsed.timeSignatures, s => `${s.tick}:${s.numerator}/${s.denominator}`);
  const unsupported = signatures.some(s => s.numerator !== 4 || s.denominator !== 4 || s.tick !== 0);
  if (unsupported || signatures.length > 1) {
    errors.push({ code: "METER_MAP_UNSUPPORTED", message: "Il formato canonico V1 assume barre 4/4 costanti; MIDI con meter diverso/variabile bloccato." });
  }
  return { numerator: signatures[0].numerator, denominator: signatures[0].denominator };
}

function resolveTonality(parsed, warnings) {
  const first = parsed.keySignatures[0];
  if (!first) {
    warnings.push({ code: "KEY_SIGNATURE_MISSING", message: "Key signature assente: tonality marcata come fallback C minor a confidenza nulla." });
    return { rootPitchClass: 0, mode: "minor", confidence: 0, source: "fallback" };
  }
  const map = first.minor ? MINOR_KEY_PC_BY_SHARPS_FLATS : MAJOR_KEY_PC_BY_SHARPS_FLATS;
  const pc = map.get(first.sharpsFlats);
  if (pc == null) {
    warnings.push({ code: "KEY_SIGNATURE_INVALID", message: `Key signature sf=${first.sharpsFlats} non interpretabile; fallback C minor.` });
    return { rootPitchClass: 0, mode: "minor", confidence: 0, source: "fallback" };
  }
  return { rootPitchClass: pc, mode: first.minor ? "minor" : "major", confidence: 1, source: "midi-key-signature" };
}

function eventFromNote(note, trackRole, sourcePpq) {
  const tick = scaleTick(note.startTick, sourcePpq);
  const durationTicks = Math.max(1, scaleTick(note.durationTicks, sourcePpq));
  const velocity = Math.max(0, Math.min(1, note.velocity / 127));

  if (note.channel === 9) {
    return { type: drumEventType(note.note), tick, velocity };
  }
  if (trackRole === "808") return { type: "808", tick, velocity, note: note.note, durationTicks, role: "other" };
  if (trackRole === "harmony") return { type: "harmony", tick, velocity, note: note.note, durationTicks };
  if (trackRole === "lead") return { type: "lead", tick, velocity, note: note.note, durationTicks };
  return null;
}

function normalizeParsedMidi(parsed, options = {}) {
  const warnings = [...parsed.warnings];
  const errors = [];
  const bpm = resolveTempo(parsed, warnings, errors);
  const meter = resolveMeter(parsed, warnings, errors);
  const tonality = resolveTonality(parsed, warnings);
  const overrideState = normalizeTrackOverrides(options.trackOverrides);
  if (!overrideState.valid) {
    overrideState.errors.forEach(message => errors.push({ code: "TRACK_OVERRIDE_INVALID", message }));
  }
  const classifications = parsed.tracks.map(track => {
    const automatic = classifyTrack(track);
    const override = resolveTrackOverride(track, overrideState);
    if (!override) return { ...automatic, override: false, pitchBendRangeSemitones: null };
    return {
      ...automatic,
      melodicRole: override.melodicRole,
      confidence: 1,
      reasons: [`override esplicito: ${override.reason}`],
      override: true,
      automaticRole: automatic.melodicRole,
      automaticConfidence: automatic.confidence,
      pitchBendRangeSemitones: override.pitchBendRangeSemitones
    };
  });
  const events = [];
  const skippedTracks = [];
  let maxTick = 0;
  let mappedGlides = 0;

  for (const track of parsed.tracks) {
    const classification = classifications.find(c => c.trackIndex === track.index);
    if (classification.mixedChannels) {
      warnings.push({ code: "MIXED_DRUM_MELODIC_TRACK", trackIndex: track.index, message: "Track contiene channel 10 e note melodiche: importo entrambe ma segnalo la struttura mista." });
    }
    let importedMelodic = 0;
    let trackMappedGlides = 0;
    for (const note of track.notes) {
      const event = eventFromNote(note, classification.melodicRole, parsed.ppq);
      if (event && event.type === "808") {
        const glideResult = inferSimple808Glide(track, note, parsed.ppq, scaleTick, {
          pitchBendRangeSemitones: classification.pitchBendRangeSemitones
            ?? options.pitchBendRangeSemitones
            ?? 2
        });
        if (glideResult.glide) {
          event.glideTo = glideResult.glide.glideTo;
          event.glideTicks = Math.min(event.durationTicks, glideResult.glide.glideTicks);
          trackMappedGlides += 1;
          mappedGlides += 1;
        }
        if (glideResult.warning) {
          warnings.push({ code: "PITCH_BEND_GLIDE_QUANTIZED", trackIndex: track.index, note: note.note, message: glideResult.warning });
        }
      }
      if (event) {
        events.push(event);
        if (note.channel !== 9) importedMelodic += 1;
        maxTick = Math.max(maxTick, event.tick + (event.durationTicks || 1));
      }
    }

    if (track.pitchBends.length && classification.melodicRole !== "808") {
      warnings.push({ code: "PITCH_BEND_NOT_MAPPED", trackIndex: track.index, count: track.pitchBends.length, message: "Pitch bend letto ma non convertito: la track non e' classificata 808." });
    } else if (track.pitchBends.length && classification.melodicRole === "808" && trackMappedGlides === 0) {
      warnings.push({ code: "PITCH_BEND_NO_SIMPLE_GLIDE", trackIndex: track.index, count: track.pitchBends.length, message: "Pitch bend 808 presente ma nessuna nota e' riducibile in modo affidabile a un singolo glide V1." });
    }

    if (classification.melodicRole === "unknown" && classification.melodicNoteCount > 0) {
      skippedTracks.push({
        trackIndex: track.index,
        name: track.name || "",
        noteCount: classification.melodicNoteCount,
        confidence: classification.confidence,
        reasons: classification.reasons
      });
      warnings.push({ code: "UNCLASSIFIED_MELODIC_TRACK", trackIndex: track.index, message: "Note melodiche non importate nel canonico: classificazione ambigua." });
    } else if (classification.melodicNoteCount > 0 && importedMelodic === 0) {
      warnings.push({ code: "MELODIC_TRACK_EMPTY_AFTER_IMPORT", trackIndex: track.index, message: "Track melodica classificata ma senza eventi importati." });
    }
  }

  const bars = Math.max(1, Math.ceil(maxTick / BAR_TICKS));
  if (bars > 128) errors.push({ code: "TOO_MANY_BARS", message: `Timeline ${bars} barre supera il limite canonico V1 di 128.` });

  const sequence = createSequence({
    meta: {
      seed: options.seed || "midi-import",
      source: "midi",
      genre: options.genre || "trap",
      lineage: options.lineage || "dark_minimal",
      prompt: options.prompt || ""
    },
    timing: { ppq: PPQ, bpm, bars: Math.min(128, bars) },
    tonality: { rootPitchClass: tonality.rootPitchClass, mode: tonality.mode },
    harmony: [],
    bars: Array.from({ length: Math.min(128, bars) }, () => ({})),
    events
  });

  const validation = validateSequence(sequence);
  if (!validation.ok) {
    for (const error of validation.errors) errors.push({ code: "CANONICAL_VALIDATION", message: error });
  }
  for (const warning of validation.warnings) warnings.push({ code: "CANONICAL_WARNING", message: warning });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    sequence: validation.sequence,
    analysis: {
      sourcePpq: parsed.ppq,
      canonicalPpq: PPQ,
      meter,
      tonality,
      classifications,
      skippedTracks,
      pitchBendCount: parsed.tracks.reduce((sum, t) => sum + t.pitchBends.length, 0),
      mappedGlides,
      trackOverrideCount: classifications.filter(c => c.override).length
    }
  };
}

module.exports = {
  scaleTick,
  normalizeParsedMidi,
  resolveTempo,
  resolveMeter,
  resolveTonality
};
