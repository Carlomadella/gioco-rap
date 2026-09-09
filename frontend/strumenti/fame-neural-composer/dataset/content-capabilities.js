"use strict";

const SCHEMA = "fame-neural-content-capabilities-v1";
const VERSION = 1;
const POLICY_SCHEMA = "fame-neural-content-usage-policy-v1";

const OBSERVED_CONTENT_KEYS = Object.freeze(["drums", "lowEnd", "harmony", "lead"]);
const CAPABILITY_KEYS = Object.freeze([
  "DRUM_GROOVE",
  "DRUM_FILL",
  "LOW_END",
  "TONAL_HARMONY",
  "TONAL_MELODY",
  "FULL_ARRANGEMENT"
]);
const USAGE_KEYS = Object.freeze(["debug", "pretraining", "augmentation", "musicalTarget"]);
const QUALITY_KEYS = Object.freeze([
  "technical",
  "roleFit",
  "domainTrap",
  "musicalCoherence",
  "rappability"
]);

const OBSERVED_STATES = new Set(["present", "not_observed", "unknown"]);
const CAPABILITY_STATES = new Set(["verified", "candidate", "absent", "unknown"]);
const USAGE_STATES = new Set(["allowed", "blocked", "candidate", "unknown"]);
const QUALITY_STATES = new Set(["pass", "fail", "candidate", "unknown"]);

const EVIDENCE_KINDS = new Set([
  "direct_observation",
  "source_metadata",
  "source_policy",
  "heuristic",
  "human_review"
]);

const EVIDENCE_SCOPES = new Set([
  "source",
  "source_performance",
  "dataset_item",
  "phrase",
  "bar"
]);

// Vocabolario osservativo V1. Non implica che un hit drum costituisca un groove.
const OBSERVED_DRUM_TYPES = new Set([
  "kick",
  "snare",
  "clap",
  "hat_closed",
  "hat_open",
  "perc",
  "cymbal",
  "tom"
]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveSourceCollectionId(sourceId, sourceKeys) {
  if (!nonEmptyString(sourceId)) return null;
  const value = sourceId.trim();
  const keys = Array.isArray(sourceKeys)
    ? sourceKeys
    : Object.keys(sourceKeys && typeof sourceKeys === "object" ? sourceKeys : {});

  if (keys.includes(value)) return value;

  const matches = keys
    .filter(nonEmptyString)
    .filter(key => value.startsWith(`${key}:`))
    .sort((a, b) => b.length - a.length || a.localeCompare(b));

  return matches[0] || null;
}

function emptyAssertionMap(keys) {
  return Object.fromEntries(keys.map(key => [key, { state: "unknown", evidenceRefs: [] }]));
}

function normalizeRefs(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(nonEmptyString).map(item => item.trim()))];
}

function normalizeAssertionMap(raw, keys, allowedStates, errors, label) {
  const source = raw && typeof raw === "object" ? raw : {};
  const result = {};

  for (const key of keys) {
    const record = source[key] && typeof source[key] === "object" ? source[key] : {};
    const state = allowedStates.has(record.state) ? record.state : "unknown";
    const evidenceRefs = normalizeRefs(record.evidenceRefs);

    if (record.state != null && !allowedStates.has(record.state)) {
      errors.push(`${label}.${key}: state non valido (${String(record.state)})`);
    }
    if (state !== "unknown" && evidenceRefs.length === 0) {
      errors.push(`${label}.${key}: state=${state} richiede almeno una evidenceRef`);
    }

    result[key] = { state, evidenceRefs };
  }

  return result;
}

function normalizeEvidence(raw, errors) {
  const records = Array.isArray(raw) ? raw : [];
  const ids = new Set();
  const out = [];

  for (let index = 0; index < records.length; index += 1) {
    const item = records[index] && typeof records[index] === "object" ? records[index] : {};
    const id = nonEmptyString(item.id) ? item.id.trim() : "";
    const kind = EVIDENCE_KINDS.has(item.kind) ? item.kind : null;
    const scope = EVIDENCE_SCOPES.has(item.scope) ? item.scope : null;
    const method = nonEmptyString(item.method) ? item.method.trim() : "";
    const source = nonEmptyString(item.source) ? item.source.trim() : "";

    if (!id) errors.push(`evidence[${index}]: id obbligatorio`);
    else if (ids.has(id)) errors.push(`evidence[${index}]: id duplicato (${id})`);
    else ids.add(id);

    if (!kind) errors.push(`evidence[${index}]: kind non valido (${String(item.kind)})`);
    if (!scope) errors.push(`evidence[${index}]: scope non valido (${String(item.scope)})`);
    if (!method) errors.push(`evidence[${index}]: method obbligatorio`);
    if (!source) errors.push(`evidence[${index}]: source obbligatorio`);

    let confidence = null;
    if (item.confidence != null) {
      const numeric = Number(item.confidence);
      if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) {
        errors.push(`evidence[${index}]: confidence deve essere tra 0 e 1`);
      } else {
        confidence = numeric;
      }
    }

    out.push({
      id,
      kind: kind || "heuristic",
      scope: scope || "phrase",
      method,
      source,
      value: item.value == null ? null : clone(item.value),
      confidence,
      notes: nonEmptyString(item.notes) ? item.notes.trim() : ""
    });
  }

  return out;
}

function validateEvidenceRefs(maps, evidence, errors) {
  const ids = new Set(evidence.map(item => item.id).filter(Boolean));

  for (const [label, map] of Object.entries(maps)) {
    for (const [key, record] of Object.entries(map)) {
      for (const ref of record.evidenceRefs) {
        if (!ids.has(ref)) errors.push(`${label}.${key}: evidenceRef non risolta (${ref})`);
      }
    }
  }
}

function normalizeSubject(raw, errors) {
  const subject = raw && typeof raw === "object" ? raw : {};
  const level = subject.level === "phrase" ? "phrase" : null;
  const id = nonEmptyString(subject.id) ? subject.id.trim() : "";

  if (!level) errors.push(`subject.level non valido: ${String(subject.level)}`);
  if (!id) errors.push("subject.id obbligatorio");

  return {
    level: level || "phrase",
    id,
    sourceDatasetItemId: nonEmptyString(subject.sourceDatasetItemId) ? subject.sourceDatasetItemId.trim() : null,
    sourceId: nonEmptyString(subject.sourceId) ? subject.sourceId.trim() : null
  };
}

function normalizeContentCapabilities(input = {}) {
  const errors = [];

  if (input.schema !== SCHEMA) errors.push(`schema non valido: ${String(input.schema)}`);
  if (input.version !== VERSION) errors.push(`version non valida: ${String(input.version)}`);

  const subject = normalizeSubject(input.subject, errors);
  const evidence = normalizeEvidence(input.evidence, errors);

  const observedContent = normalizeAssertionMap(
    input.observedContent,
    OBSERVED_CONTENT_KEYS,
    OBSERVED_STATES,
    errors,
    "observedContent"
  );
  const capabilities = normalizeAssertionMap(
    input.capabilities,
    CAPABILITY_KEYS,
    CAPABILITY_STATES,
    errors,
    "capabilities"
  );
  const usage = normalizeAssertionMap(
    input.usage,
    USAGE_KEYS,
    USAGE_STATES,
    errors,
    "usage"
  );
  const quality = normalizeAssertionMap(
    input.quality,
    QUALITY_KEYS,
    QUALITY_STATES,
    errors,
    "quality"
  );

  validateEvidenceRefs({ observedContent, capabilities, usage, quality }, evidence, errors);

  return {
    ok: errors.length === 0,
    errors,
    value: {
      schema: SCHEMA,
      version: VERSION,
      subject,
      observedContent,
      capabilities,
      usage,
      quality,
      evidence
    }
  };
}

function directObservationEvidence(id, key, state) {
  return {
    id,
    kind: "direct_observation",
    scope: "phrase",
    method: "canonical-event-type-presence-v1",
    source: "phrase.canonical.events",
    value: { content: key, state, representation: "fame-neural-sequence-v1" },
    confidence: 1,
    notes: "Osservazione limitata al canonico della phrase; non certifica qualità o funzione musicale."
  };
}

function observeCanonicalContent(phrase) {
  const canonical = phrase && phrase.canonical;
  const events = canonical && Array.isArray(canonical.events) ? canonical.events : null;

  if (!events) {
    return {
      observedContent: emptyAssertionMap(OBSERVED_CONTENT_KEYS),
      evidence: []
    };
  }

  const types = new Set(events.map(event => String(event && event.type || "")));
  const values = {
    drums: [...types].some(type => OBSERVED_DRUM_TYPES.has(type)),
    lowEnd: types.has("808"),
    harmony: types.has("harmony"),
    lead: types.has("lead")
  };

  const observedContent = {};
  const evidence = [];

  for (const key of OBSERVED_CONTENT_KEYS) {
    const state = values[key] ? "present" : "not_observed";
    const id = `obs:${key}`;
    observedContent[key] = { state, evidenceRefs: [id] };
    evidence.push(directObservationEvidence(id, key, state));
  }

  return { observedContent, evidence };
}

function validateUsagePolicyRegistry(input = {}) {
  const errors = [];
  if (input.schema !== POLICY_SCHEMA) errors.push(`policy schema non valido: ${String(input.schema)}`);
  if (input.version !== 1) errors.push(`policy version non valida: ${String(input.version)}`);

  const sources = input.sources && typeof input.sources === "object" ? input.sources : {};
  for (const [sourceId, sourcePolicy] of Object.entries(sources)) {
    if (!nonEmptyString(sourceId)) errors.push("policy sourceId vuoto");
    const usage = sourcePolicy && sourcePolicy.usage && typeof sourcePolicy.usage === "object"
      ? sourcePolicy.usage
      : {};

    for (const [usageKey, record] of Object.entries(usage)) {
      if (!USAGE_KEYS.includes(usageKey)) {
        errors.push(`policy ${sourceId}: usage non riconosciuto (${usageKey})`);
        continue;
      }
      if (!(record && USAGE_STATES.has(record.state)) || record.state === "unknown") {
        errors.push(`policy ${sourceId}.${usageKey}: state deve essere allowed/blocked/candidate`);
      }
      if (!nonEmptyString(record.source)) errors.push(`policy ${sourceId}.${usageKey}: source obbligatorio`);
      if (!nonEmptyString(record.method)) errors.push(`policy ${sourceId}.${usageKey}: method obbligatorio`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function applySourceUsagePolicy(payload, registry) {
  if (!registry) return payload;

  const policyValidation = validateUsagePolicyRegistry(registry);
  if (!policyValidation.ok) {
    throw new Error(`Usage policy non valida: ${policyValidation.errors.join("; ")}`);
  }

  const sourceId = payload.subject.sourceId;
  const policySourceId = sourceId && registry.sources
    ? resolveSourceCollectionId(sourceId, registry.sources)
    : null;
  const sourcePolicy = policySourceId && registry.sources[policySourceId];
  if (!sourcePolicy || !sourcePolicy.usage) return payload;

  const out = clone(payload);

  for (const [usageKey, record] of Object.entries(sourcePolicy.usage)) {
    if (!USAGE_KEYS.includes(usageKey)) continue;
    const evidenceId = `policy:${policySourceId}:${usageKey}`;
    out.evidence.push({
      id: evidenceId,
      kind: "source_policy",
      scope: "source",
      method: record.method.trim(),
      source: record.source.trim(),
      value: record.value == null
        ? {
            usage: usageKey,
            state: record.state,
            policySourceId,
            subjectSourceId: sourceId
          }
        : clone(record.value),
      confidence: null,
      notes: nonEmptyString(record.notes) ? record.notes.trim() : ""
    });
    out.usage[usageKey] = { state: record.state, evidenceRefs: [evidenceId] };
  }

  return out;
}

function buildContentCapabilities(phrase, options = {}) {
  const subject = {
    level: "phrase",
    id: nonEmptyString(phrase && phrase.phraseId) ? phrase.phraseId.trim() : "",
    sourceDatasetItemId: nonEmptyString(phrase && phrase.sourceDatasetItemId)
      ? phrase.sourceDatasetItemId.trim()
      : null,
    sourceId: nonEmptyString(phrase && phrase.provenance && phrase.provenance.sourceId)
      ? phrase.provenance.sourceId.trim()
      : null
  };

  const observed = observeCanonicalContent(phrase);
  let payload = {
    schema: SCHEMA,
    version: VERSION,
    subject,
    observedContent: observed.observedContent,
    capabilities: emptyAssertionMap(CAPABILITY_KEYS),
    usage: emptyAssertionMap(USAGE_KEYS),
    quality: emptyAssertionMap(QUALITY_KEYS),
    evidence: observed.evidence
  };

  payload = applySourceUsagePolicy(payload, options.policyRegistry || null);

  const validation = normalizeContentCapabilities(payload);
  if (!validation.ok) {
    throw new Error(`Content capabilities non valide: ${validation.errors.join("; ")}`);
  }
  return validation.value;
}

module.exports = {
  SCHEMA,
  VERSION,
  POLICY_SCHEMA,
  OBSERVED_CONTENT_KEYS,
  CAPABILITY_KEYS,
  USAGE_KEYS,
  QUALITY_KEYS,
  OBSERVED_STATES,
  CAPABILITY_STATES,
  USAGE_STATES,
  QUALITY_STATES,
  EVIDENCE_KINDS,
  EVIDENCE_SCOPES,
  OBSERVED_DRUM_TYPES,
  resolveSourceCollectionId,
  normalizeContentCapabilities,
  validateUsagePolicyRegistry,
  observeCanonicalContent,
  applySourceUsagePolicy,
  buildContentCapabilities
};
