"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const { parseSmf } = require("./smf-parser");
const { normalizeParsedMidi } = require("./normalize-midi");
const { validateProvenance } = require("./provenance");
const { buildTempoSegments, requiresTempoSegmentation } = require("./tempo-segments");
const { buildSourceFidelity } = require("./source-fidelity");

const DATASET_SCHEMA = "fame-neural-dataset-item-v1";
const TEMPO_MAP_STRATEGIES = new Set(["block", "segment"]);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function summarizeTracks(parsed) {
  return parsed.tracks.map(track => ({
    index: track.index,
    name: track.name || "",
    instrumentName: track.instrumentName || "",
    noteCount: track.notes.length,
    pitchBendCount: track.pitchBends.length,
    channels: [...new Set(track.notes.map(n => n.channel))].sort((a, b) => a - b)
  }));
}

function normalizeWithTempoStrategy(parsed, options = {}) {
  const strategy = options.tempoMapStrategy || "block";
  if (!TEMPO_MAP_STRATEGIES.has(strategy)) {
    return {
      ok: false,
      errors: [{ code: "TEMPO_MAP_STRATEGY_INVALID", message: `tempoMapStrategy non valida: ${String(strategy)}` }],
      warnings: [],
      analysis: { tempoSegmentation: { strategy, applied: false, segmentCount: 0 } },
      canonical: null,
      canonicalSegments: []
    };
  }

  const needsSegmentation = requiresTempoSegmentation(parsed);
  if (strategy !== "segment" || !needsSegmentation) {
    const normalized = normalizeParsedMidi(parsed, options);
    return {
      ok: normalized.ok,
      errors: normalized.errors,
      warnings: normalized.warnings,
      analysis: {
        ...normalized.analysis,
        tempoSegmentation: {
          strategy,
          applied: false,
          sourceTempoEventCount: parsed.tempos.length,
          segmentCount: 1
        }
      },
      canonical: normalized.sequence,
      canonicalSegments: []
    };
  }

  const plan = buildTempoSegments(parsed);
  const results = plan.map(segment => ({
    segment,
    normalized: normalizeParsedMidi(segment.parsed, {
      ...options,
      tempoMapStrategy: "block",
      seed: `${options.seed || "midi-import"}:tempo-segment-${segment.index}`
    })
  }));

  const errors = [];
  const warnings = [];
  const canonicalSegments = [];

  for (const { segment, normalized } of results) {
    normalized.errors.forEach(error => errors.push({ ...error, segmentIndex: segment.index }));
    normalized.warnings.forEach(warning => warnings.push({ ...warning, segmentIndex: segment.index }));
    canonicalSegments.push({
      segmentIndex: segment.index,
      sourceStartTick: segment.sourceStartTick,
      sourceEndTick: segment.sourceEndTick,
      sourceDurationTicks: segment.sourceDurationTicks,
      bpm: segment.bpm,
      implicitTempoFallback: segment.implicitTempoFallback,
      canonical: normalized.sequence,
      analysis: normalized.analysis
    });
  }

  return {
    ok: errors.length === 0 && canonicalSegments.length > 0,
    errors,
    warnings,
    analysis: {
      tempoSegmentation: {
        strategy: "segment",
        applied: true,
        sourceTempoEventCount: parsed.tempos.length,
        segmentCount: canonicalSegments.length,
        segments: canonicalSegments.map(segment => ({
          segmentIndex: segment.segmentIndex,
          sourceStartTick: segment.sourceStartTick,
          sourceEndTick: segment.sourceEndTick,
          bpm: segment.bpm,
          canonicalBars: segment.canonical.timing.bars,
          harmonyEventCount: segment.analysis.harmonyNotes.eventCount
        }))
      }
    },
    canonical: canonicalSegments.length === 1 ? canonicalSegments[0].canonical : null,
    canonicalSegments
  };
}

function buildDatasetItem(input) {
  const buffer = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer);
  const provenance = validateProvenance(input.provenance);
  const parsed = parseSmf(buffer);
  const normalized = normalizeWithTempoStrategy(parsed, input.options || {});
  const technicalReady = normalized.ok;
  const commercialTrainingReady = technicalReady && provenance.commerciallyCleared;
  const sourceHash = sha256(buffer);
  const itemId = `${provenance.record.sourceId || "unknown"}:${sourceHash.slice(0, 16)}`;
  const sourceFidelity = buildSourceFidelity(parsed, itemId);

  return {
    schema: DATASET_SCHEMA,
    version: 1,
    itemId,
    source: {
      fileName: input.fileName ? path.basename(input.fileName) : "input.mid",
      sha256: sourceHash,
      midi: {
        format: parsed.format,
        sourcePpq: parsed.ppq,
        trackCount: parsed.trackCount,
        tempoEventCount: parsed.tempos.length,
        tracks: summarizeTracks(parsed)
      }
    },
    sourceFidelity,
    provenance: provenance.record,
    rights: {
      status: provenance.rightsStatus,
      validationErrors: provenance.errors,
      commercialTrainingAllowed: provenance.record.commercialTrainingAllowed,
      commercialOutputAllowed: provenance.record.commercialOutputAllowed
    },
    import: {
      status: technicalReady ? "ok" : "blocked",
      errors: normalized.errors,
      warnings: normalized.warnings,
      analysis: normalized.analysis
    },
    eligibility: {
      technical: technicalReady,
      commercialTraining: commercialTrainingReady,
      reason: !technicalReady
        ? "midi-import-blocked"
        : (!provenance.valid ? "invalid-provenance" : (commercialTrainingReady ? "cleared" : "rights-not-cleared"))
    },
    canonical: normalized.canonical,
    canonicalSegments: normalized.canonicalSegments.map(segment => ({
      ...segment,
      segmentId: `${itemId}:tempo-${segment.segmentIndex}`
    }))
  };
}

module.exports = {
  DATASET_SCHEMA,
  TEMPO_MAP_STRATEGIES,
  sha256,
  normalizeWithTempoStrategy,
  buildDatasetItem
};
