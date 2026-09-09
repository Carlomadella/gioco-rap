"use strict";

const assert = require("node:assert/strict");
const policy = require("./dataset/content-capabilities-policy.v1.json");
const {
  resolveSourceCollectionId
} = require("./dataset/content-capabilities");
const {
  OVERLAY_SCHEMA,
  AUDIT_SCHEMA,
  buildCorpusCapabilityOverlay,
  auditCapabilityOverlay,
  selectUsageEligible,
  sourceCorpusDigest
} = require("./dataset/content-capabilities-corpus");

function entry(fileName, phraseId, sourceId, family, events, options = {}) {
  return {
    fileName,
    sha256: options.sha256 || `fixture-${phraseId}`,
    item: {
      schema: "fame-neural-phrase-item-v1",
      phraseId,
      sourceDatasetItemId: `${phraseId}:source-item`,
      phraseBars: 4,
      provenance: {
        sourceId,
        compositionFamily: family
      },
      canonical: options.noCanonical
        ? null
        : {
            schema: "fame-neural-sequence-v1",
            ppq: 960,
            bars: 4,
            events
          }
    }
  };
}

// I fixture usano sourceId granulari real-type, non gli id collection semplificati.
const fixtures = [
  entry(
    "seed.phrase-item.json",
    "seed:001",
    "fame-original-seed-v1:composition-001",
    "seed-family",
    [{ type: "kick", tick: 0 }, { type: "harmony", tick: 0 }]
  ),
  entry(
    "gmd.phrase-item.json",
    "gmd:001",
    "gmd-v1.0.0:4",
    "gmd-family",
    [{ type: "kick", tick: 0 }, { type: "snare", tick: 960 }, { type: "hat_closed", tick: 480 }]
  ),
  entry(
    "pdmx.phrase-item.json",
    "pdmx:001",
    "pdmx-v2025:0123456789abcdef0123",
    "pdmx-family",
    [{ type: "kick", tick: 0 }, { type: "808", tick: 0 }, { type: "harmony", tick: 0 }, { type: "lead", tick: 480 }]
  ),
  entry(
    "hhd.phrase-item.json",
    "hhd:001",
    "hiphopdrummer:808:Trap:abcdef0123456789",
    "hhd-family",
    [{ type: "kick", tick: 0 }, { type: "808", tick: 0 }]
  )
];

const sourceRegistry = {
  sources: [
    { id: "fame-original-seed-v1" },
    { id: "gmd-v1.0.0" },
    { id: "pdmx-v2025" },
    { id: "hiphopdrummer" }
  ]
};

assert.equal(
  resolveSourceCollectionId("gmd-v1.0.0:4", sourceRegistry.sources.map(item => item.id)),
  "gmd-v1.0.0"
);
assert.equal(
  resolveSourceCollectionId("pdmx-v2025:0123", sourceRegistry.sources.map(item => item.id)),
  "pdmx-v2025"
);
assert.equal(
  resolveSourceCollectionId("gmd-v1.0.0x:4", sourceRegistry.sources.map(item => item.id)),
  null
);

const overlay = buildCorpusCapabilityOverlay(fixtures, { policyRegistry: policy });
assert.equal(overlay.schema, OVERLAY_SCHEMA);
assert.equal(overlay.totals.inputEntries, 4);
assert.equal(overlay.totals.overlayItems, 4);
assert.equal(overlay.errors.length, 0);

const audit = auditCapabilityOverlay(overlay, { sourceRegistry });
assert.equal(audit.schema, AUDIT_SCHEMA);
assert.equal(audit.readyForEvidenceEnrichment, true);
assert.equal(audit.totals.phrases, 4);
assert.equal(audit.totals.provenanceSourceIds, 4);
assert.equal(audit.totals.sourceCollections, 4);
assert.equal(audit.totals.compositionFamilies, 4);
assert.equal(audit.issues.unresolvedSourceIds.length, 0);
assert.equal(audit.issues.automaticMusicalCapabilityPromotions.length, 0);
assert.equal(audit.issues.seedPolicyViolations.length, 0);
assert.equal(audit.observedContent.drums.present, 4);
assert.equal(audit.capabilities.DRUM_GROOVE.unknown, 4);
assert.equal(audit.capabilities.FULL_ARRANGEMENT.unknown, 4);

// DEBUG_SYNTHETIC_ONLY viene applicato anche a sourceId granulari.
assert.deepEqual(selectUsageEligible(overlay, "debug").map(item => item.phraseId), ["seed:001"]);
assert.deepEqual(selectUsageEligible(overlay, "musicalTarget").map(item => item.phraseId), []);

// GMD è candidate per pretraining: strict non lo seleziona; opt-in candidate sì.
assert.deepEqual(selectUsageEligible(overlay, "pretraining").map(item => item.phraseId), []);
assert.deepEqual(
  selectUsageEligible(overlay, "pretraining", { includeCandidate: true }).map(item => item.phraseId),
  ["gmd:001"]
);

// Hip Hop Drummer è candidate per augmentation, non auto-allowed.
assert.deepEqual(selectUsageEligible(overlay, "augmentation").map(item => item.phraseId), []);
assert.deepEqual(
  selectUsageEligible(overlay, "augmentation", { includeCandidate: true }).map(item => item.phraseId),
  ["hhd:001"]
);

// L'evidenza policy mantiene sia collection policy id sia sourceId granulare.
const seedOverlay = overlay.items.find(item => item.phraseId === "seed:001");
const seedPolicyEvidence = seedOverlay.contentCapabilities.evidence.find(item => item.id === "policy:fame-original-seed-v1:debug");
assert.equal(seedPolicyEvidence.value.policySourceId, "fame-original-seed-v1");
assert.equal(seedPolicyEvidence.value.subjectSourceId, "fame-original-seed-v1:composition-001");

// Determinismo: ordine input diverso, stesso digest/overlay.
const reverseOverlay = buildCorpusCapabilityOverlay([...fixtures].reverse(), { policyRegistry: policy });
assert.equal(reverseOverlay.sourceCorpusDigest, overlay.sourceCorpusDigest);
assert.deepEqual(reverseOverlay, overlay);
assert.equal(sourceCorpusDigest([...fixtures].reverse()), sourceCorpusDigest(fixtures));

// Prefix simile ma non delimitato da ":" NON viene interpretato come collection registrata.
const falsePrefixOverlay = buildCorpusCapabilityOverlay([
  entry("false-prefix.phrase-item.json", "false-prefix:001", "gmd-v1.0.0x:4", "false-prefix-family", [{ type: "kick", tick: 0 }])
], { policyRegistry: policy });
const falsePrefixAudit = auditCapabilityOverlay(falsePrefixOverlay, { sourceRegistry });
assert.equal(falsePrefixAudit.readyForEvidenceEnrichment, false);
assert.deepEqual(falsePrefixAudit.issues.unresolvedSourceIds, ["gmd-v1.0.0x:4"]);
assert.equal(selectUsageEligible(falsePrefixOverlay, "pretraining", { includeCandidate: true }).length, 0);

// Source ID non registrata emerge come blocker, non viene reinterpretata.
const unknownSourceOverlay = buildCorpusCapabilityOverlay([
  entry("unknown.phrase-item.json", "unknown:001", "not-in-registry:item", "unknown-family", [{ type: "kick", tick: 0 }])
], { policyRegistry: policy });
const unknownSourceAudit = auditCapabilityOverlay(unknownSourceOverlay, { sourceRegistry });
assert.equal(unknownSourceAudit.readyForEvidenceEnrichment, false);
assert.deepEqual(unknownSourceAudit.issues.unresolvedSourceIds, ["not-in-registry:item"]);

// Canonico mancante resta unknown e viene segnalato come blocker di questo audit.
const noCanonicalOverlay = buildCorpusCapabilityOverlay([
  entry("missing.phrase-item.json", "missing:001", "gmd-v1.0.0:missing", "missing-family", [], { noCanonical: true })
], { policyRegistry: policy });
const noCanonicalAudit = auditCapabilityOverlay(noCanonicalOverlay, { sourceRegistry });
assert.equal(noCanonicalAudit.readyForEvidenceEnrichment, false);
assert.deepEqual(noCanonicalAudit.issues.missingCanonical, ["missing:001"]);
assert.equal(noCanonicalOverlay.items[0].contentCapabilities.observedContent.drums.state, "unknown");

// PhraseId duplicata bloccata.
const duplicateOverlay = buildCorpusCapabilityOverlay([fixtures[0], { ...fixtures[0], fileName: "duplicate.phrase-item.json" }], {
  policyRegistry: policy
});
assert.equal(duplicateOverlay.errors.length, 1);
assert.ok(duplicateOverlay.errors[0].includes("phraseId duplicato"));

console.log("FASE 7A / BLOCCO 2 / SOURCE ID FIX");
console.log("Granular sourceId -> registry collection: OK");
console.log("Delimiter-safe source resolution: OK");
console.log("Corpus overlay schema: OK");
console.log("Real phrase linkage snapshot: OK");
console.log("Source Registry cross-check: OK");
console.log("No automatic musical capability promotion: OK");
console.log("DEBUG_SYNTHETIC_ONLY on granular IDs: OK");
console.log("GMD pretraining candidate on granular IDs: OK");
console.log("HHD augmentation candidate on granular IDs: OK");
console.log("Unknown source/canonical are blockers, not invented labels: OK");
console.log("Duplicate phraseId blocked: OK");
console.log("Deterministic corpus digest/overlay: OK");
console.log("FASE 7A BLOCCO 2 SOURCE ID FIX SMOKE TEST: OK");
