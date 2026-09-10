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
  const timing = view.timing;
  const conflicts = [];
  if (timing) {
    const tempos = timing.tempoEvents || [];
    let active = null;
    for (const event of tempos) if (event.tick <= timing.sourceStartTick) active = event;
    // 0.01 BPM is only a numerical comparison tolerance, not a musical QA gate.
    if (active && Math.abs(active.bpm - metadata.bpm) > 0.01) {
      conflicts.push({ field: "bpm", csv: metadata.bpm, midi: active.bpm, implicitFallback: !!active.implicitFallback });
    }
    if (timing.meter && (timing.meter.numerator !== metadata.timeSignature.numerator
      || timing.meter.denominator !== metadata.timeSignature.denominator)) {
      conflicts.push({ field: "meter", csv: deepClone(metadata.timeSignature), midi: deepClone(timing.meter) });
    }
  }
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
    sourceSplitRole: "source-reference-only",
    timingAuthority: "source-midi",
    timingConsistency: { status: !timing ? "not-evaluated" : conflicts.length ? "conflict" : "consistent", conflicts }

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
  const enriched = enrichDrumViewWithGmdMetadata(view, datasetItem);
  if (enriched.metadata?.timingConsistency?.status === "conflict") {
    throw new Error("CSV/MIDI timing conflict; preserve source and resolve before export: "
      + JSON.stringify(enriched.metadata.timingConsistency.conflicts));
  }
  return enriched;
}

module.exports = {
  enrichDrumViewWithGmdMetadata,
  buildEnrichedDrumViewV2
};
