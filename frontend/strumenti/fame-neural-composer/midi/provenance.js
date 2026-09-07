"use strict";

const ORIGIN_TYPES = new Set([
  "original",
  "commissioned",
  "licensed_dataset",
  "public_domain",
  "third_party_unknown"
]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEvidence(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(nonEmptyString).map(v => v.trim());
}

function validateProvenance(input) {
  const p = input || {};
  const errors = [];

  if (!nonEmptyString(p.sourceId)) errors.push("sourceId obbligatorio");
  if (!ORIGIN_TYPES.has(p.originType)) errors.push(`originType non valido: ${String(p.originType)}`);
  if (!nonEmptyString(p.creator)) errors.push("creator obbligatorio");
  if (!nonEmptyString(p.licenseId)) errors.push("licenseId obbligatorio (usa un identificatore esplicito, anche per materiale originale)");
  if (!nonEmptyString(p.compositionFamily)) errors.push("compositionFamily obbligatorio");
  if (typeof p.commercialTrainingAllowed !== "boolean") errors.push("commercialTrainingAllowed deve essere boolean esplicito");
  if (typeof p.commercialOutputAllowed !== "boolean") errors.push("commercialOutputAllowed deve essere boolean esplicito");

  const rightsEvidence = normalizeEvidence(p.rightsEvidence);
  if (rightsEvidence.length === 0) errors.push("rightsEvidence richiede almeno una evidenza/nota verificabile");

  const record = {
    sourceId: nonEmptyString(p.sourceId) ? p.sourceId.trim() : "",
    originType: ORIGIN_TYPES.has(p.originType) ? p.originType : "third_party_unknown",
    creator: nonEmptyString(p.creator) ? p.creator.trim() : "",
    licenseId: nonEmptyString(p.licenseId) ? p.licenseId.trim() : "",
    compositionFamily: nonEmptyString(p.compositionFamily) ? p.compositionFamily.trim() : "",
    sourceUri: nonEmptyString(p.sourceUri) ? p.sourceUri.trim() : null,
    rightsEvidence,
    commercialTrainingAllowed: p.commercialTrainingAllowed === true,
    commercialOutputAllowed: p.commercialOutputAllowed === true,
    notes: nonEmptyString(p.notes) ? p.notes.trim() : ""
  };

  const valid = errors.length === 0;
  const commerciallyCleared = valid
    && record.originType !== "third_party_unknown"
    && record.commercialTrainingAllowed
    && record.commercialOutputAllowed
    && record.rightsEvidence.length > 0;

  return {
    valid,
    errors,
    record,
    rightsStatus: !valid ? "invalid" : (commerciallyCleared ? "commercial-cleared" : "analysis-only"),
    commerciallyCleared
  };
}

module.exports = {
  ORIGIN_TYPES,
  validateProvenance
};
