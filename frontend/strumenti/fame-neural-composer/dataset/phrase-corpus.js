"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { itemFingerprint, eventSummary } = require("./fingerprint");
const { normalizeSimilarityOptions, buildSimilarityReport, pairKey } = require("./similarity");
const { normalizeInternalQualityOptions, auditInternalQuality } = require("./internal-quality");
const { buildSplitManifest } = require("./auditor");
const { PHRASE_SCHEMA } = require("./phrase-builder");

const PHRASE_CORPUS_SCHEMA = "fame-neural-phrase-corpus-audit-v1";
const PHRASE_REVIEW_DECISIONS_SCHEMA = "fame-neural-phrase-review-decisions-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function normalizeOptions(input = {}) {
  return {
    targetMinPhrases: Number.isInteger(input.targetMinPhrases) && input.targetMinPhrases > 0
      ? input.targetMinPhrases : 500,
    similarity: normalizeSimilarityOptions(input.similarity),
    quality: normalizeInternalQualityOptions(input.quality)
  };
}

function validatePhraseItem(item, fileName) {
  const issues = [];
  if (!item || typeof item !== "object") issues.push("phrase item non oggetto");
  if (item && item.schema !== PHRASE_SCHEMA) issues.push(`schema non valido: ${String(item && item.schema)}`);
  if (!item || !item.phraseId) issues.push("phraseId mancante");
  if (!item || !item.sourceDatasetItemId) issues.push("sourceDatasetItemId mancante");
  if (!item || !item.provenance || !item.provenance.compositionFamily) issues.push("compositionFamily mancante");
  if (!item || !item.canonical || item.canonical.schema !== "fame-neural-sequence-v1") issues.push("canonical sequence mancante/non valida");
  if (!item || ![4, 8, 16].includes(Number(item.phraseBars))) issues.push(`phraseBars non supportato: ${String(item && item.phraseBars)}`);
  if (!(item && item.provenance && item.provenance.commercialTrainingAllowed === true)) issues.push("provenance commercialTrainingAllowed != true");
  if (!(item && item.rights && item.rights.commercialTrainingAllowed === true)) issues.push("rights commercialTrainingAllowed != true");
  return {
    ok: issues.length === 0,
    fileName,
    phraseId: item && item.phraseId || null,
    sourceDatasetItemId: item && item.sourceDatasetItemId || null,
    compositionFamily: item && item.provenance && item.provenance.compositionFamily || null,
    issues
  };
}

function groupBy(items, keyName) {
  const groups = new Map();
  for (const item of items) {
    const key = item[keyName];
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([fingerprint, members]) => ({
      fingerprint,
      count: members.length,
      itemIds: members.map(item => item.itemId).sort(),
      fileNames: members.map(item => item.fileName).sort(),
      compositionFamilies: [...new Set(members.map(item => item.compositionFamily))].sort()
    }));
}

function sourceLeakageFor(items, splitManifest) {
  const splitById = new Map((splitManifest.items || []).map(item => [item.itemId, item.split]));
  const bySource = new Map();
  for (const item of items) {
    if (!bySource.has(item.sourceDatasetItemId)) bySource.set(item.sourceDatasetItemId, new Set());
    bySource.get(item.sourceDatasetItemId).add(splitById.get(item.itemId));
  }
  return [...bySource.entries()]
    .filter(([, splits]) => splits.size > 1)
    .map(([sourceDatasetItemId, splits]) => ({ sourceDatasetItemId, splits: [...splits].sort() }));
}

function normalizeReviewDecisions(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const errors = [];
  const warnings = [];
  const reviewer = typeof source.reviewer === "string" ? source.reviewer.trim() : "";
  const records = Array.isArray(source.decisions) ? source.decisions : [];
  const byPhraseId = new Map();

  if (source.schema && source.schema !== PHRASE_REVIEW_DECISIONS_SCHEMA) {
    errors.push(`schema review decisions non valido: ${String(source.schema)}`);
  }

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index] || {};
    const phraseId = typeof record.phraseId === "string" ? record.phraseId.trim() : "";
    const action = typeof record.action === "string" ? record.action.trim().toLowerCase() : "";
    const reason = typeof record.reason === "string" ? record.reason.trim() : "";

    if (!phraseId) {
      errors.push(`review decision ${index}: phraseId mancante`);
      continue;
    }
    if (!["accept", "reject"].includes(action)) {
      errors.push(`review decision ${phraseId}: action non valida`);
      continue;
    }
    if (byPhraseId.has(phraseId)) {
      errors.push(`review decision duplicata: ${phraseId}`);
      continue;
    }
    byPhraseId.set(phraseId, { phraseId, action, reason });
  }

  return { reviewer, byPhraseId, errors, warnings };
}

function resolvePhraseReview(reviewItems, validItemIds, decisionsInput = {}) {
  const decisions = normalizeReviewDecisions(decisionsInput);
  const valid = validItemIds instanceof Set ? validItemIds : new Set(validItemIds || []);
  const review = reviewItems instanceof Set ? reviewItems : new Set(reviewItems || []);
  const errors = [...decisions.errors];
  const warnings = [...decisions.warnings];
  const accepted = [];
  const unresolved = [];
  const rejectedInCorpus = [];

  for (const phraseId of decisions.byPhraseId.keys()) {
    if (!valid.has(phraseId)) warnings.push(`review decision inutilizzata/non presente nel corpus: ${phraseId}`);
  }

  for (const phraseId of [...review].sort()) {
    const decision = decisions.byPhraseId.get(phraseId);
    if (!decision) {
      unresolved.push(phraseId);
      continue;
    }
    if (decision.action === "reject") {
      rejectedInCorpus.push(phraseId);
      continue;
    }
    if (!decisions.reviewer) {
      errors.push(`accept review ${phraseId}: reviewer obbligatorio`);
      continue;
    }
    if (!decision.reason) {
      errors.push(`accept review ${phraseId}: reason obbligatoria`);
      continue;
    }
    accepted.push(phraseId);
  }

  return {
    schema: PHRASE_REVIEW_DECISIONS_SCHEMA,
    reviewer: decisions.reviewer || null,
    complete: unresolved.length === 0 && rejectedInCorpus.length === 0 && errors.length === 0,
    totals: {
      reviewItems: review.size,
      accepted: accepted.length,
      unresolved: unresolved.length,
      rejectedInCorpus: rejectedInCorpus.length
    },
    accepted,
    unresolved,
    rejectedInCorpus,
    errors,
    warnings
  };
}

function auditPhraseEntries(entries, options = {}, reviewDecisionsInput = {}) {
  const cfg = normalizeOptions(options);
  const invalidItems = [];
  const items = [];
  const similarityEntries = [];
  const qualityEntries = [];

  for (const entry of entries) {
    const validation = validatePhraseItem(entry.item, entry.fileName);
    if (!validation.ok) {
      invalidItems.push(validation);
      continue;
    }
    const summary = eventSummary(entry.item);
    const item = {
      itemId: validation.phraseId,
      fileName: entry.fileName,
      sourceDatasetItemId: validation.sourceDatasetItemId,
      compositionFamily: validation.compositionFamily,
      phraseBars: Number(entry.item.phraseBars),
      summary,
      exactMusicFingerprint: itemFingerprint(entry.item, "exact"),
      transpositionFingerprint: itemFingerprint(entry.item, "transposition"),
      rhythmFingerprint: itemFingerprint(entry.item, "rhythm")
    };
    items.push(item);
    similarityEntries.push({
      itemId: item.itemId,
      fileName: item.fileName,
      compositionFamily: item.compositionFamily,
      item: entry.item
    });
    qualityEntries.push({ itemId: item.itemId, fileName: item.fileName, item: entry.item });
  }

  const duplicatePhraseIds = groupBy(items, "itemId");
  const exactGroups = groupBy(items, "exactMusicFingerprint");
  const exactSets = new Set(exactGroups.map(group => group.itemIds.join("|")));
  const transpositionGroups = groupBy(items.filter(item => item.transpositionFingerprint), "transpositionFingerprint")
    .filter(group => !exactSets.has(group.itemIds.join("|")));

  const knownPairs = new Set();
  for (const group of [...exactGroups, ...transpositionGroups]) {
    for (let a = 0; a < group.itemIds.length; a += 1) {
      for (let b = a + 1; b < group.itemIds.length; b += 1) knownPairs.add(pairKey(group.itemIds[a], group.itemIds[b]));
    }
  }

  const similarity = buildSimilarityReport(similarityEntries, cfg.similarity, knownPairs);
  const fuzzyBlockingGroups = similarity.blockingPairs.map(pair => ({
    fingerprint: `fuzzy:${pairKey(pair.itemA, pair.itemB)}`,
    count: 2,
    itemIds: [pair.itemA, pair.itemB].sort(),
    fileNames: [pair.fileA, pair.fileB].sort(),
    compositionFamilies: [...new Set([pair.familyA, pair.familyB].filter(Boolean))].sort()
  }));

  const splitManifest = buildSplitManifest(items, exactGroups, transpositionGroups, undefined, fuzzyBlockingGroups);
  const sourceLeakage = sourceLeakageFor(items, splitManifest);
  const internalQuality = auditInternalQuality(qualityEntries, cfg.quality);

  const blockers = [];
  if (invalidItems.length) blockers.push(`${invalidItems.length} phrase item non validi`);
  if (duplicatePhraseIds.length) blockers.push(`${duplicatePhraseIds.length} gruppi phraseId duplicati`);
  if (!similarity.complete) blockers.push("similarity report incompleto");
  if (!splitManifest.leakageSafe) blockers.push("split manifest non leakage-safe");
  if (sourceLeakage.length) blockers.push(`${sourceLeakage.length} sourceDatasetItem attraversano piu split`);

  const corpusIssues = [];
  if (exactGroups.length) corpusIssues.push(`${exactGroups.length} gruppi phrase musicalmente identiche`);
  if (transpositionGroups.length) corpusIssues.push(`${transpositionGroups.length} gruppi equivalenti per trasposizione`);
  if (similarity.blockingPairs.length) corpusIssues.push(`${similarity.blockingPairs.length} coppie fuzzy bloccanti`);
  if (internalQuality.blockingFindings.length) corpusIssues.push(`${internalQuality.blockingFindings.length} phrase con duplicate-layer interno`);

  const reviewItems = new Set(internalQuality.reviewFindings.map(item => item.itemId));
  for (const pair of similarity.reviewPairs) {
    reviewItems.add(pair.itemA);
    reviewItems.add(pair.itemB);
  }

  const validItemIds = new Set(items.map(item => item.itemId));
  const reviewResolution = resolvePhraseReview(reviewItems, validItemIds, reviewDecisionsInput);
  const block5Ready = blockers.length === 0 && reviewResolution.errors.length === 0;
  const corpusClean = corpusIssues.length === 0;
  const targetReached = items.length >= cfg.targetMinPhrases;
  const reviewComplete = reviewResolution.complete;
  const gate1Candidate = block5Ready && corpusClean && targetReached && reviewComplete;

  return {
    schema: PHRASE_CORPUS_SCHEMA,
    version: 1,
    block: "phase3-block5",
    block5Ready,
    corpusClean,
    reviewComplete,
    reviewResolution,
    targetReached,
    gate1Candidate,
    options: cfg,
    totals: {
      discovered: entries.length,
      valid: items.length,
      invalid: invalidItems.length,
      phrases4: items.filter(item => item.phraseBars === 4).length,
      phrases8: items.filter(item => item.phraseBars === 8).length,
      phrases16: items.filter(item => item.phraseBars === 16).length,
      exactDuplicateGroups: exactGroups.length,
      transpositionGroups: transpositionGroups.length,
      fuzzyReviewPairs: similarity.reviewPairs.length,
      fuzzyBlockingPairs: similarity.blockingPairs.length,
      internalQualityBlocking: internalQuality.blockingFindings.length,
      reviewItems: reviewItems.size,
      splitComponents: splitManifest.totals.components
    },
    blockers,
    corpusIssues,
    invalidItems,
    duplicates: {
      phraseIds: duplicatePhraseIds,
      exactMusic: exactGroups,
      transpositionEquivalent: transpositionGroups,
      fuzzyNearDuplicates: similarity
    },
    internalQuality,
    sourceLeakage,
    splitManifest,
    items
  };
}

function readPhraseEntries(inputDir) {
  const files = fs.readdirSync(inputDir).filter(isPhraseFile).sort((a, b) => a.localeCompare(b));
  return files.map(fileName => ({ fileName, item: readJson(path.join(inputDir, fileName)) }));
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, reportPath, splitPath, optionsPath, reviewDecisionsPath] = argv;
  if (!inputDir || !reportPath || !splitPath) {
    console.error("Uso: node phrase-corpus.js <phrase-items-dir> <audit-report.json> <split-manifest.json> [options.json] [review-decisions.json]");
    process.exitCode = 64;
    return;
  }
  try {
    const entries = readPhraseEntries(inputDir);
    const options = optionsPath ? readJson(optionsPath) : {};
    const reviewDecisions = reviewDecisionsPath ? readJson(reviewDecisionsPath) : {};
    const report = auditPhraseEntries(entries, options, reviewDecisions);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(splitPath, `${JSON.stringify(report.splitManifest, null, 2)}\n`, "utf8");

    console.log(`Phrase: ${report.totals.valid}/${report.totals.discovered}`);
    console.log(`4/8/16 barre: ${report.totals.phrases4}/${report.totals.phrases8}/${report.totals.phrases16}`);
    console.log(`Exact duplicate groups: ${report.totals.exactDuplicateGroups}`);
    console.log(`Transposition groups: ${report.totals.transpositionGroups}`);
    console.log(`Fuzzy review/bloccanti: ${report.totals.fuzzyReviewPairs}/${report.totals.fuzzyBlockingPairs}`);
    console.log(`Quality blocking: ${report.totals.internalQualityBlocking}`);
    console.log(`Source leakage: ${report.sourceLeakage.length}`);
    console.log(`BLOCCO 5 TOOLING: ${report.block5Ready ? "READY" : "BLOCKED"}`);
    console.log(`CORPUS CLEAN: ${report.corpusClean ? "SI" : "NO"}`);
    console.log(`TARGET ${report.options.targetMinPhrases}: ${report.targetReached ? "RAGGIUNTO" : "NON RAGGIUNTO"}`);
    console.log(`GATE 1 candidate: ${report.gate1Candidate ? "SI" : "NO"}`);
    console.log(`Report: ${reportPath}`);
    console.log(`Split: ${splitPath}`);

    if (!report.block5Ready) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  PHRASE_CORPUS_SCHEMA,
  PHRASE_REVIEW_DECISIONS_SCHEMA,
  normalizeOptions,
  normalizeReviewDecisions,
  resolvePhraseReview,
  validatePhraseItem,
  auditPhraseEntries,
  readPhraseEntries,
  main
};
