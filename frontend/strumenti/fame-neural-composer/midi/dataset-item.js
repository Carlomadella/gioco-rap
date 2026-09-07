"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const { parseSmf } = require("./smf-parser");
const { normalizeParsedMidi } = require("./normalize-midi");
const { validateProvenance } = require("./provenance");

const DATASET_SCHEMA = "fame-neural-dataset-item-v1";

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

function buildDatasetItem(input) {
  const buffer = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer);
  const provenance = validateProvenance(input.provenance);
  const parsed = parseSmf(buffer);
  const normalized = normalizeParsedMidi(parsed, input.options || {});
  const technicalReady = normalized.ok;
  const commercialTrainingReady = technicalReady && provenance.commerciallyCleared;

  return {
    schema: DATASET_SCHEMA,
    version: 1,
    itemId: `${provenance.record.sourceId || "unknown"}:${sha256(buffer).slice(0, 16)}`,
    source: {
      fileName: input.fileName ? path.basename(input.fileName) : "input.mid",
      sha256: sha256(buffer),
      midi: {
        format: parsed.format,
        sourcePpq: parsed.ppq,
        trackCount: parsed.trackCount,
        tracks: summarizeTracks(parsed)
      }
    },
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
    canonical: normalized.sequence
  };
}

module.exports = {
  DATASET_SCHEMA,
  sha256,
  buildDatasetItem
};
