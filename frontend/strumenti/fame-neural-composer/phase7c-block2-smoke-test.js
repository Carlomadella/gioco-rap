"use strict";

const assert = require("node:assert/strict");
const {
  GMD_METADATA_SCHEMA,
  buildGmdMetadataIndex,
  enrichDatasetItemWithGmdMetadata,
  validateGmdMetadata
} = require("./dataset/gmd-metadata");
const { enrichDrumViewWithGmdMetadata } = require("./dataset/drum-view-v2-metadata");

const csv = [
  "drummer,session,id,style,bpm,beat_type,time_signature,midi_filename,audio_filename,duration,split",
  "drummer7,drummer7/session1,drummer7/session1/12,hiphop/groove8,92,beat,4-4,drummer7/session1/12.mid,,34.5,train",
  "drummer1,drummer1/eval_session,drummer1/eval_session/2,funk/groove2,105,fill,4-4,drummer1/eval_session/2.mid,,5.25,test"
].join("\n");

const parsed = buildGmdMetadataIndex(csv);
assert.equal(parsed.rows, 2);
assert.deepEqual(parsed.errors, []);
assert.equal(parsed.index.size, 2);

const sourceItem = {
  schema: "fame-neural-dataset-item-v1",
  version: 1,
  itemId: "gmd-fixture",
  provenance: {
    sourceId: "gmd-v1.0.0:drummer7/session1/12",
    compositionFamily: "gmd:drummer7:drummer7/session1"
  }
};

const enrichedItemResult = enrichDatasetItemWithGmdMetadata(sourceItem, parsed.index);
assert.equal(enrichedItemResult.status, "enriched");
const enrichedItem = enrichedItemResult.item;
assert.equal(enrichedItem.sourceMetadata.schema, GMD_METADATA_SCHEMA);
assert.equal(enrichedItem.sourceMetadata.style.raw, "hiphop/groove8");
assert.equal(enrichedItem.sourceMetadata.style.primary, "hiphop");
assert.equal(enrichedItem.sourceMetadata.style.secondary, "groove8");
assert.equal(enrichedItem.sourceMetadata.bpm, 92);
assert.equal(enrichedItem.sourceMetadata.beatType, "beat");
assert.equal(enrichedItem.sourceMetadata.timeSignature.raw, "4-4");
assert.equal(enrichedItem.sourceMetadata.timeSignature.numerator, 4);
assert.equal(enrichedItem.sourceMetadata.timeSignature.denominator, 4);
assert.equal(enrichedItem.sourceMetadata.sourceSplit, "train");
assert.equal(validateGmdMetadata(enrichedItem.sourceMetadata).ok, true);

const block1View = {
  schema: "fame-neural-drum-view-v2",
  version: 2,
  metadata: {
    style: null,
    beatType: null,
    sourceSplit: null,
    metadataStatus: "not-enriched"
  },
  semantics: {
    core: { status: "unknown", evidenceRefs: [] },
    fill: { status: "unknown", evidenceRefs: [] },
    variation: { status: "unknown", evidenceRefs: [] },
    loopability: { status: "unknown", evidenceRefs: [] },
    boundaryQuality: { status: "unknown", evidenceRefs: [] }
  }
};

const enrichedView = enrichDrumViewWithGmdMetadata(block1View, enrichedItem);
assert.equal(enrichedView.metadata.metadataStatus, "source-enriched");
assert.equal(enrichedView.metadata.style.primary, "hiphop");
assert.equal(enrichedView.metadata.beatType, "beat");
assert.equal(enrichedView.metadata.sourceSplit, "train");
assert.equal(enrichedView.metadata.bpm, 92);
assert.equal(enrichedView.metadata.timeSignature.raw, "4-4");
assert.equal(enrichedView.metadata.sourceSplitRole, "source-reference-only");

// Il metadata ufficiale non viene promosso automaticamente a semantica task-specifica.
assert.equal(enrichedView.semantics.fill.status, "unknown");
assert.equal(enrichedView.semantics.core.status, "unknown");
assert.equal(block1View.metadata.metadataStatus, "not-enriched");

const missing = enrichDatasetItemWithGmdMetadata({
  provenance: { sourceId: "gmd-v1.0.0:missing/id" }
}, parsed.index);
assert.equal(missing.status, "missing-metadata");

console.log("FASE 7C / BLOCCO 2 / GMD METADATA ENRICHMENT");
console.log("info.csv -> sourceMetadata strutturato: OK");
console.log("style primary/secondary + bpm + beatType + timeSignature + sourceSplit: OK");
console.log("Drum View V2 metadata propagation: OK");
console.log("source split trattato solo come riferimento di fonte: OK");
console.log("fill/core semantics non inventate: OK");
console.log("FASE 7C BLOCCO 2 METADATA SMOKE TEST: OK");
