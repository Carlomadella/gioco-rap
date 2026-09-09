"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  CAPABILITY_KEYS,
  OBSERVED_CONTENT_KEYS,
  QUALITY_KEYS,
  USAGE_KEYS,
  buildContentCapabilities,
  resolveSourceCollectionId
} = require("./content-capabilities");

const OVERLAY_SCHEMA = "fame-neural-content-capabilities-overlay-v1";
const AUDIT_SCHEMA = "fame-neural-content-capabilities-audit-v1";
const OVERLAY_VERSION = 1;
const AUDIT_VERSION = 1;

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readPhraseEntries(inputDir) {
  const names = fs.readdirSync(inputDir)
    .filter(name => /\.phrase-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  return names.map(fileName => {
    const filePath = path.join(inputDir, fileName);
    const raw = fs.readFileSync(filePath);
    return {
      fileName,
      filePath,
      sha256: sha256(raw),
      item: JSON.parse(raw.toString("utf8"))
    };
  });
}

function stableEntryKey(entry) {
  const phraseId = entry && entry.item && entry.item.phraseId;
  return `${String(phraseId || "")}\u0000${String(entry && entry.fileName || "")}`;
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) throw new Error("entries deve essere un array");
  return [...entries].sort((a, b) => stableEntryKey(a).localeCompare(stableEntryKey(b)));
}

function sourceCorpusDigest(entries) {
  const parts = normalizeEntries(entries).map(entry => {
    const fileName = String(entry.fileName || "");
    const digest = nonEmpty(entry.sha256)
      ? entry.sha256
      : sha256(Buffer.from(JSON.stringify(entry.item || null), "utf8"));
    return `${fileName}\t${digest}`;
  });
  return sha256(Buffer.from(parts.join("\n"), "utf8"));
}

function linkageSnapshot(entry) {
  const item = entry.item || {};
  const provenance = item.provenance || {};
  return {
    phraseId: item.phraseId || null,
    sourceDatasetItemId: item.sourceDatasetItemId || null,
    sourceId: provenance.sourceId || null,
    compositionFamily: provenance.compositionFamily || null,
    phraseBars: Number.isFinite(Number(item.phraseBars)) ? Number(item.phraseBars) : null,
    sourceSha256: item.source && item.source.sha256 || null,
    fileName: entry.fileName || null,
    fileSha256: entry.sha256 || null
  };
}

function validateLinkage(entry, seenPhraseIds, errors, warnings) {
  const link = linkageSnapshot(entry);
  if (!nonEmpty(link.phraseId)) {
    errors.push(`${entry.fileName || "<unknown>"}: phraseId mancante`);
  } else if (seenPhraseIds.has(link.phraseId)) {
    errors.push(`${entry.fileName || "<unknown>"}: phraseId duplicato (${link.phraseId})`);
  } else {
    seenPhraseIds.add(link.phraseId);
  }

  if (!nonEmpty(link.sourceDatasetItemId)) {
    errors.push(`${link.phraseId || entry.fileName}: sourceDatasetItemId mancante`);
  }
  if (!nonEmpty(link.sourceId)) {
    warnings.push(`${link.phraseId || entry.fileName}: provenance.sourceId mancante`);
  }
  if (!nonEmpty(link.compositionFamily)) {
    warnings.push(`${link.phraseId || entry.fileName}: provenance.compositionFamily mancante`);
  }
  return link;
}

function buildCorpusCapabilityOverlay(entries, options = {}) {
  const normalized = normalizeEntries(entries);
  const errors = [];
  const warnings = [];
  const seenPhraseIds = new Set();
  const items = [];

  for (const entry of normalized) {
    const link = validateLinkage(entry, seenPhraseIds, errors, warnings);
    if (!nonEmpty(link.phraseId) || !nonEmpty(link.sourceDatasetItemId)) continue;

    let contentCapabilities;
    try {
      contentCapabilities = buildContentCapabilities(entry.item, {
        policyRegistry: options.policyRegistry || null
      });
    } catch (error) {
      errors.push(`${link.phraseId}: ${error.message}`);
      continue;
    }

    items.push({
      phraseId: link.phraseId,
      linkage: link,
      contentCapabilities
    });
  }

  return {
    schema: OVERLAY_SCHEMA,
    version: OVERLAY_VERSION,
    sourceCorpusDigest: sourceCorpusDigest(normalized),
    totals: {
      inputEntries: normalized.length,
      overlayItems: items.length,
      errors: errors.length,
      warnings: warnings.length
    },
    errors,
    warnings,
    items
  };
}

function emptyStateCounter(states) {
  return Object.fromEntries(states.map(state => [state, 0]));
}

function countAssertionMap(items, selector, keys, states) {
  const out = {};
  for (const key of keys) out[key] = emptyStateCounter(states);

  for (const item of items) {
    const map = selector(item) || {};
    for (const key of keys) {
      const state = map[key] && map[key].state || "unknown";
      if (!(state in out[key])) out[key][state] = 0;
      out[key][state] += 1;
    }
  }
  return out;
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function registrySourceIds(registry) {
  return (
    registry && Array.isArray(registry.sources)
      ? registry.sources.map(source => source && source.id).filter(nonEmpty)
      : []
  );
}

function auditCapabilityOverlay(overlay, options = {}) {
  if (!overlay || overlay.schema !== OVERLAY_SCHEMA) {
    throw new Error(`overlay schema atteso ${OVERLAY_SCHEMA}`);
  }

  const items = Array.isArray(overlay.items) ? overlay.items : [];
  const evidenceKinds = {};
  const sourceCollectionCounts = {};
  const provenanceSourcesByCollection = new Map();
  const familyByCollection = new Map();
  const provenanceSourceIds = new Set();
  const registryIds = registrySourceIds(options.sourceRegistry);
  const checkRegistry = registryIds.length > 0;
  const unresolvedSourceIds = new Set();
  const missingSourceIds = [];
  const missingCompositionFamilies = [];
  const missingCanonical = [];
  const musicalCapabilityPromotions = [];
  const observedAbsentViolations = [];
  const seedPolicyViolations = [];
  let sourcePolicyEvidenceItems = 0;

  for (const item of items) {
    const link = item.linkage || {};
    const cc = item.contentCapabilities || {};
    const sourceId = link.sourceId || cc.subject && cc.subject.sourceId || null;
    const sourceCollectionId = sourceId && checkRegistry
      ? resolveSourceCollectionId(sourceId, registryIds)
      : null;

    if (!sourceId) {
      missingSourceIds.push(item.phraseId);
    } else {
      provenanceSourceIds.add(sourceId);
      if (checkRegistry && !sourceCollectionId) unresolvedSourceIds.add(sourceId);
    }

    if (sourceCollectionId) {
      increment(sourceCollectionCounts, sourceCollectionId);
      if (!provenanceSourcesByCollection.has(sourceCollectionId)) {
        provenanceSourcesByCollection.set(sourceCollectionId, new Set());
      }
      provenanceSourcesByCollection.get(sourceCollectionId).add(sourceId);

      if (!familyByCollection.has(sourceCollectionId)) {
        familyByCollection.set(sourceCollectionId, new Set());
      }
      if (link.compositionFamily) familyByCollection.get(sourceCollectionId).add(link.compositionFamily);
    }

    if (!link.compositionFamily) missingCompositionFamilies.push(item.phraseId);

    const directEvidence = Array.isArray(cc.evidence) ? cc.evidence : [];
    if (!directEvidence.some(ev => ev.kind === "direct_observation")) {
      missingCanonical.push(item.phraseId);
    }
    if (directEvidence.some(ev => ev.kind === "source_policy")) sourcePolicyEvidenceItems += 1;
    for (const evidence of directEvidence) increment(evidenceKinds, evidence.kind || "unknown");

    for (const key of CAPABILITY_KEYS) {
      const state = cc.capabilities && cc.capabilities[key] && cc.capabilities[key].state || "unknown";
      if (state !== "unknown") {
        musicalCapabilityPromotions.push({ phraseId: item.phraseId, capability: key, state });
      }
    }

    for (const key of OBSERVED_CONTENT_KEYS) {
      const state = cc.observedContent && cc.observedContent[key] && cc.observedContent[key].state || "unknown";
      if (state === "absent") {
        observedAbsentViolations.push({ phraseId: item.phraseId, observedContent: key });
      }
    }

    if (sourceCollectionId === "fame-original-seed-v1") {
      const debugState = cc.usage && cc.usage.debug && cc.usage.debug.state;
      const targetState = cc.usage && cc.usage.musicalTarget && cc.usage.musicalTarget.state;
      if (debugState !== "allowed" || targetState !== "blocked") {
        seedPolicyViolations.push({
          phraseId: item.phraseId,
          sourceId,
          debug: debugState || "unknown",
          musicalTarget: targetState || "unknown"
        });
      }
    }
  }

  const blockers = [];
  if ((overlay.errors || []).length) blockers.push(`${overlay.errors.length} errori overlay`);
  if (missingSourceIds.length) blockers.push(`${missingSourceIds.length} phrase senza sourceId`);
  if (unresolvedSourceIds.size) blockers.push(`${unresolvedSourceIds.size} sourceId granulari non risolti a una source collection del Registry`);
  if (missingCompositionFamilies.length) blockers.push(`${missingCompositionFamilies.length} phrase senza compositionFamily`);
  if (missingCanonical.length) blockers.push(`${missingCanonical.length} phrase senza osservazione canonica`);
  if (observedAbsentViolations.length) blockers.push(`${observedAbsentViolations.length} observedContent con stato absent`);
  if (seedPolicyViolations.length) blockers.push(`${seedPolicyViolations.length} violazioni DEBUG_SYNTHETIC_ONLY`);
  if (musicalCapabilityPromotions.length) {
    blockers.push(`${musicalCapabilityPromotions.length} capability musicali promosse nel pass automatico`);
  }

  const bySourceCollection = Object.keys(sourceCollectionCounts).sort().map(sourceCollectionId => ({
    sourceCollectionId,
    phrases: sourceCollectionCounts[sourceCollectionId],
    provenanceSourceIds: provenanceSourcesByCollection.get(sourceCollectionId)
      ? provenanceSourcesByCollection.get(sourceCollectionId).size
      : 0,
    compositionFamilies: familyByCollection.get(sourceCollectionId)
      ? familyByCollection.get(sourceCollectionId).size
      : 0
  }));

  return {
    schema: AUDIT_SCHEMA,
    version: AUDIT_VERSION,
    sourceCorpusDigest: overlay.sourceCorpusDigest,
    readyForEvidenceEnrichment: blockers.length === 0,
    totals: {
      phrases: items.length,
      provenanceSourceIds: provenanceSourceIds.size,
      sourceCollections: Object.keys(sourceCollectionCounts).length,
      compositionFamilies: new Set(items.map(item => item.linkage && item.linkage.compositionFamily).filter(Boolean)).size,
      sourcePolicyEvidenceItems,
      overlayErrors: (overlay.errors || []).length,
      overlayWarnings: (overlay.warnings || []).length
    },
    observedContent: countAssertionMap(
      items,
      item => item.contentCapabilities.observedContent,
      OBSERVED_CONTENT_KEYS,
      ["present", "not_observed", "unknown"]
    ),
    capabilities: countAssertionMap(
      items,
      item => item.contentCapabilities.capabilities,
      CAPABILITY_KEYS,
      ["verified", "candidate", "absent", "unknown"]
    ),
    usage: countAssertionMap(
      items,
      item => item.contentCapabilities.usage,
      USAGE_KEYS,
      ["allowed", "blocked", "candidate", "unknown"]
    ),
    quality: countAssertionMap(
      items,
      item => item.contentCapabilities.quality,
      QUALITY_KEYS,
      ["pass", "fail", "candidate", "unknown"]
    ),
    evidenceKinds: Object.fromEntries(Object.entries(evidenceKinds).sort(([a], [b]) => a.localeCompare(b))),
    bySourceCollection,
    issues: {
      missingSourceIds: missingSourceIds.sort(),
      unresolvedSourceIds: [...unresolvedSourceIds].sort(),
      missingCompositionFamilies: missingCompositionFamilies.sort(),
      missingCanonical: missingCanonical.sort(),
      observedAbsentViolations,
      seedPolicyViolations,
      automaticMusicalCapabilityPromotions: musicalCapabilityPromotions
    },
    blockers
  };
}

function usageDecision(item, usageKey) {
  if (!USAGE_KEYS.includes(usageKey)) throw new Error(`usage non riconosciuto: ${usageKey}`);
  const cc = item && item.contentCapabilities ? item.contentCapabilities : item;
  return cc && cc.usage && cc.usage[usageKey] && cc.usage[usageKey].state || "unknown";
}

function selectUsageEligible(overlay, usageKey, options = {}) {
  const includeCandidate = options.includeCandidate === true;
  const items = overlay && Array.isArray(overlay.items) ? overlay.items : [];
  return items.filter(item => {
    const state = usageDecision(item, usageKey);
    if (state === "allowed") return true;
    if (state === "candidate") return includeCandidate;
    return false;
  });
}

module.exports = {
  OVERLAY_SCHEMA,
  AUDIT_SCHEMA,
  OVERLAY_VERSION,
  AUDIT_VERSION,
  readPhraseEntries,
  sourceCorpusDigest,
  buildCorpusCapabilityOverlay,
  auditCapabilityOverlay,
  usageDecision,
  selectUsageEligible
};
