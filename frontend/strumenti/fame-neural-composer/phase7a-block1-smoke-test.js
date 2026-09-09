"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const policy = require("./dataset/content-capabilities-policy.v1.json");
const {
  SCHEMA,
  CAPABILITY_KEYS,
  USAGE_KEYS,
  QUALITY_KEYS,
  buildContentCapabilities,
  normalizeContentCapabilities,
  validateUsagePolicyRegistry
} = require("./dataset/content-capabilities");

function phrase(sourceId, events, options = {}) {
  const value = {
    phraseId: options.phraseId || `${sourceId || "unknown"}:fixture`,
    sourceDatasetItemId: options.sourceDatasetItemId || `${sourceId || "unknown"}:item`,
    provenance: sourceId ? { sourceId } : {},
    canonical: options.withCanonical === false
      ? null
      : { schema: "fame-neural-sequence-v1", events: events || [] }
  };
  return value;
}

function assertAllUnknown(map, keys) {
  for (const key of keys) {
    assert.equal(map[key].state, "unknown", `${key} deve restare unknown`);
    assert.deepEqual(map[key].evidenceRefs, []);
  }
}

const policyValidation = validateUsagePolicyRegistry(policy);
assert.equal(policyValidation.ok, true, policyValidation.errors.join("; "));

// 1) Seed originale: policy documentata applicata, ma nessuna capability musicale viene inventata.
const seed = buildContentCapabilities(
  phrase("fame-original-seed-v1", [
    { type: "kick", tick: 0 },
    { type: "harmony", tick: 0 }
  ]),
  { policyRegistry: policy }
);
assert.equal(seed.schema, SCHEMA);
assert.equal(seed.observedContent.drums.state, "present");
assert.equal(seed.observedContent.harmony.state, "present");
assert.equal(seed.observedContent.lowEnd.state, "not_observed");
assert.equal(seed.usage.debug.state, "allowed");
assert.equal(seed.usage.musicalTarget.state, "blocked");
assertAllUnknown(seed.capabilities, CAPABILITY_KEYS);
assertAllUnknown(seed.quality, QUALITY_KEYS);
assert.ok(seed.evidence.some(item => item.kind === "source_policy"));

// 2) GMD: drums presenti e pretraining candidate; DRUM_GROOVE NON promosso automaticamente.
const gmd = buildContentCapabilities(
  phrase("gmd-v1.0.0", [
    { type: "kick", tick: 0 },
    { type: "snare", tick: 960 },
    { type: "hat_closed", tick: 480 }
  ]),
  { policyRegistry: policy }
);
assert.equal(gmd.observedContent.drums.state, "present");
assert.equal(gmd.observedContent.lowEnd.state, "not_observed");
assert.equal(gmd.usage.pretraining.state, "candidate");
assert.equal(gmd.capabilities.DRUM_GROOVE.state, "unknown");
assert.equal(gmd.capabilities.DRUM_FILL.state, "unknown");

// 3) PDMX: co-presenza di ruoli non diventa FULL_ARRANGEMENT.
const pdmx = buildContentCapabilities(
  phrase("pdmx-v2025", [
    { type: "kick", tick: 0 },
    { type: "808", tick: 0 },
    { type: "harmony", tick: 0 },
    { type: "lead", tick: 480 }
  ]),
  { policyRegistry: policy }
);
assert.equal(pdmx.observedContent.drums.state, "present");
assert.equal(pdmx.observedContent.lowEnd.state, "present");
assert.equal(pdmx.observedContent.harmony.state, "present");
assert.equal(pdmx.observedContent.lead.state, "present");
assert.equal(pdmx.capabilities.FULL_ARRANGEMENT.state, "unknown");
assertAllUnknown(pdmx.usage, USAGE_KEYS);

// 4) Dato senza canonico: assenza di dato != false.
const missing = buildContentCapabilities(
  phrase(null, [], { withCanonical: false, phraseId: "fixture:no-canonical" }),
  { policyRegistry: policy }
);
assert.equal(missing.subject.sourceId, null);
assert.equal(missing.observedContent.drums.state, "unknown");
assert.equal(missing.observedContent.lowEnd.state, "unknown");
assert.equal(missing.observedContent.harmony.state, "unknown");
assert.equal(missing.observedContent.lead.state, "unknown");

// 5) Assertion non-unknown senza evidenza: rifiutata.
const invalidNoEvidence = JSON.parse(JSON.stringify(gmd));
invalidNoEvidence.capabilities.DRUM_GROOVE = { state: "verified", evidenceRefs: [] };
const invalidNoEvidenceResult = normalizeContentCapabilities(invalidNoEvidence);
assert.equal(invalidNoEvidenceResult.ok, false);
assert.ok(invalidNoEvidenceResult.errors.some(error => error.includes("DRUM_GROOVE")));

// 6) EvidenceRef inesistente: rifiutata.
const invalidDangling = JSON.parse(JSON.stringify(gmd));
invalidDangling.capabilities.DRUM_GROOVE = { state: "candidate", evidenceRefs: ["missing-evidence"] };
const invalidDanglingResult = normalizeContentCapabilities(invalidDangling);
assert.equal(invalidDanglingResult.ok, false);
assert.ok(invalidDanglingResult.errors.some(error => error.includes("evidenceRef non risolta")));

// 7) Source metadata può sostenere una capability candidate solo se l'evidenza resta esplicita.
const explicitCandidate = JSON.parse(JSON.stringify(gmd));
explicitCandidate.evidence.push({
  id: "source:gmd:beat-type",
  kind: "source_metadata",
  scope: "source_performance",
  method: "gmd-metadata-field",
  source: "GMD metadata / beat_type",
  value: "beat",
  confidence: null,
  notes: "Metadata della performance sorgente; non certifica automaticamente la funzione di ogni finestra."
});
explicitCandidate.capabilities.DRUM_GROOVE = {
  state: "candidate",
  evidenceRefs: ["source:gmd:beat-type"]
};
const explicitCandidateResult = normalizeContentCapabilities(explicitCandidate);
assert.equal(explicitCandidateResult.ok, true, explicitCandidateResult.errors.join("; "));
assert.equal(explicitCandidateResult.value.capabilities.DRUM_GROOVE.state, "candidate");
assert.equal(
  explicitCandidateResult.value.evidence.find(item => item.id === "source:gmd:beat-type").kind,
  "source_metadata"
);

// 8) Determinismo.
const gmdAgain = buildContentCapabilities(
  phrase("gmd-v1.0.0", [
    { type: "kick", tick: 0 },
    { type: "snare", tick: 960 },
    { type: "hat_closed", tick: 480 }
  ]),
  { policyRegistry: policy }
);
assert.deepEqual(gmdAgain, gmd);

// 9) "not_observed" è assenza di osservazione nel canonico, non prova di assenza nella sorgente.
for (const payload of [seed, gmd, pdmx, missing]) {
  for (const record of Object.values(payload.observedContent)) {
    assert.notEqual(record.state, "absent");
  }
}

console.log("FASE 7A / BLOCCO 1");
console.log("Schema:", SCHEMA);
console.log("Policy registry: OK");
console.log("Seed DEBUG_SYNTHETIC_ONLY policy: OK");
console.log("GMD presence != DRUM_GROOVE: OK");
console.log("PDMX role presence != FULL_ARRANGEMENT: OK");
console.log("Missing canonical -> UNKNOWN: OK");
console.log("Evidence required + dangling refs blocked: OK");
console.log("Explicit source_metadata candidate: OK");
console.log("Determinism: OK");
console.log("FASE 7A BLOCCO 1 SMOKE TEST: OK");
