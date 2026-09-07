"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DATASET_SCHEMA = "fame-neural-dataset-item-v1";
const GATE_SCHEMA = "fame-neural-phase2-corpus-gate-v1";

function isDatasetItemFile(name) {
  return /\.dataset-item\.json$/i.test(name);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function canonicalSequenceCount(item) {
  let count = 0;
  if (item && item.canonical && item.canonical.schema === "fame-neural-sequence-v1") count += 1;
  if (Array.isArray(item && item.canonicalSegments)) {
    count += item.canonicalSegments.filter(segment =>
      segment && segment.canonical && segment.canonical.schema === "fame-neural-sequence-v1"
    ).length;
  }
  return count;
}

function validateItem(item, fileName) {
  const issues = [];
  if (!item || typeof item !== "object") {
    return { ok: false, fileName, itemId: null, sourceSha256: null, compositionFamily: null, canonicalSequenceCount: 0, issues: ["dataset item non e' un oggetto"] };
  }

  if (item.schema !== DATASET_SCHEMA) issues.push(`schema non valido: ${String(item.schema)}`);
  if (!item.itemId || typeof item.itemId !== "string") issues.push("itemId mancante");

  const sourceSha256 = item.source && typeof item.source.sha256 === "string" ? item.source.sha256 : null;
  if (!sourceSha256 || !/^[a-f0-9]{64}$/i.test(sourceSha256)) issues.push("source.sha256 mancante/non valido");

  const provenance = item.provenance || {};
  const compositionFamily = typeof provenance.compositionFamily === "string" && provenance.compositionFamily.trim()
    ? provenance.compositionFamily.trim()
    : null;
  if (!compositionFamily) issues.push("provenance.compositionFamily mancante");
  if (!provenance.sourceId || typeof provenance.sourceId !== "string") issues.push("provenance.sourceId mancante");
  if (!provenance.creator || typeof provenance.creator !== "string") issues.push("provenance.creator mancante");
  if (!provenance.licenseId || typeof provenance.licenseId !== "string") issues.push("provenance.licenseId mancante");
  if (!Array.isArray(provenance.rightsEvidence) || provenance.rightsEvidence.length === 0) issues.push("provenance.rightsEvidence vuoto");

  if (!(item.import && item.import.status === "ok")) issues.push(`import non tecnico-OK: ${item.import && item.import.status}`);
  if (!(item.eligibility && item.eligibility.technical === true)) issues.push("eligibility.technical != true");
  if (!(item.eligibility && item.eligibility.commercialTraining === true)) issues.push("eligibility.commercialTraining != true");
  if (!(item.rights && item.rights.status === "commercial-cleared")) issues.push(`rights.status non cleared: ${item.rights && item.rights.status}`);
  if (!(item.rights && item.rights.commercialTrainingAllowed === true)) issues.push("rights.commercialTrainingAllowed != true");
  if (!(item.rights && item.rights.commercialOutputAllowed === true)) issues.push("rights.commercialOutputAllowed != true");

  const sequenceCount = canonicalSequenceCount(item);
  if (sequenceCount < 1) issues.push("nessuna sequence canonica disponibile");

  return {
    ok: issues.length === 0,
    fileName,
    itemId: typeof item.itemId === "string" ? item.itemId : null,
    sourceSha256,
    compositionFamily,
    canonicalSequenceCount: sequenceCount,
    issues
  };
}

function normalizeOptions(input = {}) {
  const minItems = Number.isInteger(input.minItems) && input.minItems > 0 ? input.minItems : 3;
  const minCompositionFamilies = Number.isInteger(input.minCompositionFamilies) && input.minCompositionFamilies > 0
    ? input.minCompositionFamilies
    : 1;
  return { minItems, minCompositionFamilies };
}

function evaluateCorpusItems(items, options = {}) {
  const cfg = normalizeOptions(options);
  const validations = items.map(({ item, fileName }) => validateItem(item, fileName));
  const blockingIssues = [];

  const validItems = validations.filter(v => v.ok);
  if (items.length < cfg.minItems) blockingIssues.push(`servono almeno ${cfg.minItems} dataset item; trovati ${items.length}`);
  if (validItems.length !== items.length) blockingIssues.push(`${items.length - validItems.length} dataset item non superano i requisiti FASE 2`);

  const itemIdCounts = new Map();
  const shaCounts = new Map();
  for (const result of validations) {
    if (result.itemId) itemIdCounts.set(result.itemId, (itemIdCounts.get(result.itemId) || 0) + 1);
    if (result.sourceSha256) shaCounts.set(result.sourceSha256, (shaCounts.get(result.sourceSha256) || 0) + 1);
  }

  const duplicateItemIds = [...itemIdCounts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
  const duplicateSourceSha256 = [...shaCounts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
  if (duplicateItemIds.length) blockingIssues.push(`${duplicateItemIds.length} itemId duplicati esatti`);
  if (duplicateSourceSha256.length) blockingIssues.push(`${duplicateSourceSha256.length} SHA-256 sorgente duplicati esatti`);

  const families = [...new Set(validItems.map(v => v.compositionFamily).filter(Boolean))].sort();
  if (families.length < cfg.minCompositionFamilies) {
    blockingIssues.push(`servono almeno ${cfg.minCompositionFamilies} compositionFamily; trovate ${families.length}`);
  }

  const totalCanonicalSequences = validItems.reduce((sum, item) => sum + item.canonicalSequenceCount, 0);
  const ready = blockingIssues.length === 0;

  return {
    schema: GATE_SCHEMA,
    version: 1,
    ready,
    options: cfg,
    totals: {
      discovered: items.length,
      valid: validItems.length,
      invalid: items.length - validItems.length,
      compositionFamilies: families.length,
      canonicalSequences: totalCanonicalSequences,
      duplicateItemIds: duplicateItemIds.length,
      duplicateSourceSha256: duplicateSourceSha256.length
    },
    blockingIssues,
    duplicates: { itemIds: duplicateItemIds, sourceSha256: duplicateSourceSha256 },
    compositionFamilies: families,
    items: validations,
    manifest: ready ? validItems.map(v => ({
      fileName: v.fileName,
      itemId: v.itemId,
      sourceSha256: v.sourceSha256,
      compositionFamily: v.compositionFamily,
      canonicalSequenceCount: v.canonicalSequenceCount
    })) : []
  };
}

function evaluateCorpusDirectory(inputDir, options = {}) {
  const files = fs.readdirSync(inputDir).filter(isDatasetItemFile).sort((a, b) => a.localeCompare(b));
  const items = files.map(fileName => ({ fileName, item: readJson(path.join(inputDir, fileName)) }));
  return evaluateCorpusItems(items, options);
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, reportPath, optionsPath] = argv;
  if (!inputDir || !reportPath) {
    console.error("Uso: node corpus-gate.js <dataset-items-dir> <report.json> [gate-options.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const options = optionsPath ? readJson(optionsPath) : {};
    const report = evaluateCorpusDirectory(inputDir, options);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Dataset item: ${report.totals.discovered}`);
    console.log(`Validi FASE 2: ${report.totals.valid}`);
    console.log(`Composition family: ${report.totals.compositionFamilies}`);
    console.log(`Sequence canoniche: ${report.totals.canonicalSequences}`);
    console.log(`Duplicati SHA esatti: ${report.totals.duplicateSourceSha256}`);
    console.log(`FASE 2 DATA GATE: ${report.ready ? "READY" : "BLOCKED"}`);
    if (report.blockingIssues.length) report.blockingIssues.forEach(issue => console.error(`[BLOCK] ${issue}`));
    console.log(`Report: ${reportPath}`);
    if (!report.ready) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  DATASET_SCHEMA,
  GATE_SCHEMA,
  isDatasetItemFile,
  canonicalSequenceCount,
  validateItem,
  normalizeOptions,
  evaluateCorpusItems,
  evaluateCorpusDirectory,
  main
};
