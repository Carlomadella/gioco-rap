"use strict";

const {
  GMD_METADATA_SCHEMA,
  gmdRecordIdFromDatasetItem,
  validateGmdMetadata
} = require("./gmd-metadata");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function enrichDrumViewWithGmdMetadata(view, datasetItem) {
  const recordId = gmdRecordIdFromDatasetItem(datasetItem);
  if (!recordId) return deepClone(view);

  const metadata = datasetItem && datasetItem.sourceMetadata;
  const validation = validateGmdMetadata(metadata);
  if (!validation.ok) {
    throw new Error(`GMD metadata non valida per ${recordId}: ${validation.errors.join("; ")}`);
  }
  if (metadata.recordId !== recordId) {
    throw new Error(`GMD metadata recordId mismatch: source=${recordId}, metadata=${metadata.recordId}`);
  }

  const enriched = deepClone(view);
  enriched.metadata = {
    ...(enriched.metadata || {}),
    style: deepClone(metadata.style),
    beatType: metadata.beatType,
    sourceSplit: metadata.sourceSplit,
    bpm: metadata.bpm,
    timeSignature: deepClone(metadata.timeSignature),
    sourceRecordId: metadata.recordId,
    sourceMetadataSchema: GMD_METADATA_SCHEMA,
    metadataStatus: "source-enriched",
    sourceSplitRole: "source-reference-only"
  };
  return enriched;
}

function buildEnrichedDrumViewV2(datasetItem, options = {}) {
  const { buildDrumViewV2, validateDrumViewV2 } = require("./drum-view-v2");
  const view = buildDrumViewV2(datasetItem, options);
  const baseValidation = validateDrumViewV2(view);
  if (!baseValidation.ok) {
    throw new Error(`Drum View V2 base non valida: ${baseValidation.errors.join("; ")}`);
  }
  return enrichDrumViewWithGmdMetadata(view, datasetItem);
}

module.exports = {
  enrichDrumViewWithGmdMetadata,
  buildEnrichedDrumViewV2
};
