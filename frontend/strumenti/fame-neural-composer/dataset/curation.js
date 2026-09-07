"use strict";

const fs = require("node:fs");
const path = require("node:path");

const CURATION_SCHEMA = "fame-neural-curation-report-v1";
const MANIFEST_SCHEMA = "fame-neural-curated-corpus-manifest-v1";
const REVIEW_QUEUE_SCHEMA = "fame-neural-curation-review-queue-v1";
const DECISIONS_SCHEMA = "fame-neural-curation-decisions-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeCurationOptions(input = {}) {
  return {
    minAcceptedForTrainingSubset: Number.isInteger(input.minAcceptedForTrainingSubset) && input.minAcceptedForTrainingSubset > 0
      ? input.minAcceptedForTrainingSubset : 3,
    targetMinPhrases: Number.isInteger(input.targetMinPhrases) && input.targetMinPhrases > 0
      ? input.targetMinPhrases : 500
  };
}

function normalizeDecisions(input = {}) {
  const errors = [];
  const reviewer = typeof input.reviewer === "string" ? input.reviewer.trim() : "";
  const records = Array.isArray(input.decisions) ? input.decisions : [];
  const byItemId = new Map();

  if (input.schema && input.schema !== DECISIONS_SCHEMA) {
    errors.push(`schema decisioni non valido: ${String(input.schema)}`);
  }

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index] || {};
    const itemId = typeof record.itemId === "string" ? record.itemId.trim() : "";
    const action = typeof record.action === "string" ? record.action.trim().toLowerCase() : "";
    const reason = typeof record.reason === "string" ? record.reason.trim() : "";

    if (!itemId) {
      errors.push(`decisione ${index}: itemId mancante`);
      continue;
    }
    if (!["accept", "reject", "hold"].includes(action)) {
      errors.push(`decisione ${itemId}: action non valida (${String(record.action)})`);
      continue;
    }
    if (byItemId.has(itemId)) {
      errors.push(`decisione duplicata per itemId ${itemId}`);
      continue;
    }
    byItemId.set(itemId, { itemId, action, reason });
  }

  return { reviewer, byItemId, errors };
}

function signalMap(validItemIds) {
  return new Map(validItemIds.map(itemId => [itemId, {
    absolute: [],
    relational: [],
    review: []
  }]));
}

function addUnique(target, value, keyFn = JSON.stringify) {
  const key = keyFn(value);
  if (!target.some(existing => keyFn(existing) === key)) target.push(value);
}

function addAbsolute(signals, itemId, code, detail = null) {
  if (!signals.has(itemId)) return;
  addUnique(signals.get(itemId).absolute, { code, detail }, value => `${value.code}:${String(value.detail || "")}`);
}

function addReview(signals, itemId, code, detail = null) {
  if (!signals.has(itemId)) return;
  addUnique(signals.get(itemId).review, { code, detail }, value => `${value.code}:${String(value.detail || "")}`);
}

function addRelation(signals, code, relationId, itemIds) {
  const uniqueIds = [...new Set(itemIds.filter(Boolean))].sort();
  if (uniqueIds.length < 2) return;
  for (const itemId of uniqueIds) {
    if (!signals.has(itemId)) continue;
    const peers = uniqueIds.filter(id => id !== itemId);
    addUnique(
      signals.get(itemId).relational,
      { code, relationId, peers },
      value => `${value.code}:${value.relationId}:${value.peers.join("|")}`
    );
  }
}

function collectAuditSignals(audit) {
  const validIds = (audit.items || []).map(item => item.itemId).filter(Boolean);
  const signals = signalMap(validIds);
  const globalBlockers = [];

  for (const group of audit.duplicates && audit.duplicates.itemIds || []) {
    for (const itemId of group.itemIds || []) addAbsolute(signals, itemId, "DUPLICATE_ITEM_ID", group.fingerprint || group.value || null);
  }

  const relationSources = [
    ["SOURCE_SHA_DUPLICATE", audit.duplicates && audit.duplicates.sourceSha256 || []],
    ["EXACT_MUSIC_DUPLICATE", audit.duplicates && audit.duplicates.exactMusic || []],
    ["TRANSPOSITION_EQUIVALENT", audit.duplicates && audit.duplicates.transpositionEquivalent || []]
  ];
  for (const [code, groups] of relationSources) {
    groups.forEach((group, index) => addRelation(
      signals,
      code,
      `${code}:${group.fingerprint || index}`,
      group.itemIds || []
    ));
  }

  const fuzzy = audit.duplicates && audit.duplicates.fuzzyNearDuplicates || {};
  for (const pair of fuzzy.blockingPairs || []) {
    addRelation(
      signals,
      "FUZZY_BLOCKING_PAIR",
      `FUZZY:${[pair.itemA, pair.itemB].sort().join("|")}`,
      [pair.itemA, pair.itemB]
    );
  }
  for (const pair of fuzzy.reviewPairs || []) {
    const detail = `score=${Number(pair.score || 0).toFixed(6)}`;
    addReview(signals, pair.itemA, "FUZZY_REVIEW_PAIR", `${pair.itemB};${detail}`);
    addReview(signals, pair.itemB, "FUZZY_REVIEW_PAIR", `${pair.itemA};${detail}`);
  }
  if (fuzzy.complete === false) globalBlockers.push("similarity report incompleto");

  for (const group of audit.duplicates && audit.duplicates.rhythmReviewCandidates || []) {
    for (const itemId of group.itemIds || []) addReview(signals, itemId, "RHYTHM_REVIEW_GROUP", group.fingerprint || null);
  }

  for (const finding of audit.internalQuality && audit.internalQuality.blockingFindings || []) {
    addAbsolute(signals, finding.itemId, finding.code || "INTERNAL_QUALITY_BLOCK", finding.fileName || null);
  }

  for (const flag of audit.qualityFlags || []) {
    for (const issue of flag.issues || []) addReview(signals, flag.itemId, "QUALITY_REVIEW", issue);
  }

  if (audit.splitManifest && audit.splitManifest.leakageSafe === false) {
    globalBlockers.push("split audit non leakage-safe");
  }

  return { signals, globalBlockers };
}

function provenanceSnapshot(entry) {
  const item = entry.item || {};
  const provenance = item.provenance || {};
  return {
    sourceId: provenance.sourceId || null,
    creator: provenance.creator || null,
    licenseId: provenance.licenseId || null,
    compositionFamily: provenance.compositionFamily || null,
    sourceUri: provenance.sourceUri || null,
    commercialTrainingAllowed: provenance.commercialTrainingAllowed === true,
    commercialOutputAllowed: provenance.commercialOutputAllowed === true,
    sourceSha256: item.source && item.source.sha256 || null
  };
}

function validateManualAccept(decision, reviewer, hasSignals, errors) {
  if (!decision || decision.action !== "accept" || !hasSignals) return;
  if (!reviewer) errors.push(`accept manuale ${decision.itemId}: reviewer obbligatorio`);
  if (!decision.reason) errors.push(`accept manuale ${decision.itemId}: reason obbligatoria`);
}

function buildCurationFromAudit(entries, audit, decisionsInput = {}, optionsInput = {}) {
  const cfg = normalizeCurationOptions(optionsInput);
  const decisions = normalizeDecisions(decisionsInput);
  const decisionErrors = [...decisions.errors];
  const validById = new Map();
  const entryById = new Map();

  for (const auditItem of audit.items || []) {
    if (auditItem && auditItem.itemId) validById.set(auditItem.itemId, auditItem);
  }
  for (const entry of entries) {
    const itemId = entry && entry.item && entry.item.itemId;
    if (itemId) entryById.set(itemId, entry);
  }

  for (const itemId of decisions.byItemId.keys()) {
    if (!validById.has(itemId)) decisionErrors.push(`decisione per itemId sconosciuto/non valido: ${itemId}`);
  }

  const { signals, globalBlockers } = collectAuditSignals(audit);
  const dispositions = [];

  for (const [itemId, auditItem] of validById.entries()) {
    const sig = signals.get(itemId) || { absolute: [], relational: [], review: [] };
    const decision = decisions.byItemId.get(itemId) || null;
    const hasSignals = sig.absolute.length > 0 || sig.relational.length > 0 || sig.review.length > 0;
    validateManualAccept(decision, decisions.reviewer, hasSignals, decisionErrors);

    let status;
    let reason;

    if (sig.absolute.length > 0) {
      if (decision && decision.action === "reject") {
        status = "rejected";
        reason = decision.reason || "blocco assoluto rifiutato manualmente";
      } else {
        status = "blocked";
        reason = sig.absolute.map(x => x.code).join(",");
        if (decision && decision.action === "accept") {
          decisionErrors.push(`item ${itemId}: impossibile accettare un blocco assoluto (${reason})`);
        }
      }
    } else if (sig.relational.length > 0) {
      if (decision && decision.action === "reject") {
        status = "rejected";
        reason = decision.reason || "relazione duplicata rifiutata";
      } else if (decision && decision.action === "accept") {
        const unresolvedPeers = new Set();
        for (const relation of sig.relational) {
          for (const peer of relation.peers) {
            const peerDecision = decisions.byItemId.get(peer);
            if (!(peerDecision && peerDecision.action === "reject")) unresolvedPeers.add(peer);
          }
        }
        if (unresolvedPeers.size === 0 && decisions.reviewer && decision.reason) {
          status = "accepted";
          reason = decision.reason;
        } else {
          status = "hold";
          reason = `relazione non risolta con: ${[...unresolvedPeers].sort().join(",")}`;
          decisionErrors.push(`item ${itemId}: accept relazionale richiede reject esplicito di tutti i peer`);
        }
      } else {
        status = "hold";
        reason = sig.relational.map(x => x.code).join(",");
      }
    } else if (sig.review.length > 0) {
      if (decision && decision.action === "accept" && decisions.reviewer && decision.reason) {
        status = "accepted";
        reason = decision.reason;
      } else if (decision && decision.action === "reject") {
        status = "rejected";
        reason = decision.reason || "review rifiutata";
      } else {
        status = "hold";
        reason = decision && decision.reason ? decision.reason : sig.review.map(x => x.code).join(",");
      }
    } else {
      if (decision && decision.action === "reject") {
        status = "rejected";
        reason = decision.reason || "rifiuto manuale";
      } else if (decision && decision.action === "hold") {
        status = "hold";
        reason = decision.reason || "hold manuale";
      } else {
        status = "accepted";
        reason = decision && decision.reason ? decision.reason : "clean-auto-accept";
      }
    }

    dispositions.push({
      itemId,
      fileName: auditItem.fileName,
      status,
      reason,
      automaticSignals: sig,
      manualDecision: decision,
      provenance: provenanceSnapshot(entryById.get(itemId) || {})
    });
  }

  for (const invalid of audit.invalidItems || []) {
    dispositions.push({
      itemId: invalid.itemId || null,
      fileName: invalid.fileName,
      status: "blocked",
      reason: "invalid-dataset-item",
      automaticSignals: { absolute: [{ code: "INVALID_DATASET_ITEM", detail: (invalid.issues || []).join("; ") }], relational: [], review: [] },
      manualDecision: null,
      provenance: {}
    });
  }

  dispositions.sort((a, b) => String(a.itemId || a.fileName).localeCompare(String(b.itemId || b.fileName)));

  const counts = { accepted: 0, rejected: 0, hold: 0, blocked: 0 };
  for (const item of dispositions) counts[item.status] = (counts[item.status] || 0) + 1;

  const acceptedIds = new Set(dispositions.filter(item => item.status === "accepted").map(item => item.itemId));
  const reviewQueueItems = dispositions
    .filter(item => item.status === "hold")
    .map(item => ({
      itemId: item.itemId,
      fileName: item.fileName,
      reason: item.reason,
      relationalSignals: item.automaticSignals.relational,
      reviewSignals: item.automaticSignals.review
    }));

  const manifestItems = dispositions
    .filter(item => item.status === "accepted")
    .map(item => ({
      itemId: item.itemId,
      fileName: item.fileName,
      provenance: item.provenance,
      split: null
    }));

  const completeCoverage = dispositions.length === entries.length;
  const block4Ready = completeCoverage && globalBlockers.length === 0 && decisionErrors.length === 0;
  const curationComplete = counts.hold === 0 && counts.blocked === 0;

  return {
    schema: CURATION_SCHEMA,
    version: 1,
    block: "phase3-block4",
    block4Ready,
    curationComplete,
    options: cfg,
    reviewer: decisions.reviewer || null,
    totals: {
      discovered: entries.length,
      accepted: counts.accepted,
      rejected: counts.rejected,
      hold: counts.hold,
      blocked: counts.blocked,
      reviewQueue: reviewQueueItems.length
    },
    globalBlockers,
    decisionErrors,
    dispositions,
    reviewQueue: {
      schema: REVIEW_QUEUE_SCHEMA,
      version: 1,
      totals: { items: reviewQueueItems.length },
      items: reviewQueueItems
    },
    manifest: {
      schema: MANIFEST_SCHEMA,
      version: 1,
      targetMinPhrases: cfg.targetMinPhrases,
      targetReached: manifestItems.length >= cfg.targetMinPhrases,
      items: manifestItems
    },
    acceptedIds: [...acceptedIds].sort()
  };
}

function curateEntries(entries, decisionsInput = {}, optionsInput = {}, auditOptions = {}) {
  const { auditItems } = require("./auditor");
  const initialAudit = auditItems(entries, auditOptions);
  const curation = buildCurationFromAudit(entries, initialAudit, decisionsInput, optionsInput);

  const acceptedSet = new Set(curation.acceptedIds);
  const acceptedEntries = entries.filter(entry => acceptedSet.has(entry.item && entry.item.itemId));
  const acceptedAudit = auditItems(acceptedEntries, auditOptions);
  const splitById = new Map((acceptedAudit.splitManifest && acceptedAudit.splitManifest.items || []).map(item => [item.itemId, item.split]));

  for (const item of curation.manifest.items) item.split = splitById.get(item.itemId) || null;

  const minAccepted = curation.options.minAcceptedForTrainingSubset;
  const trainingSubsetReady =
    acceptedEntries.length >= minAccepted &&
    acceptedAudit.block3Ready === true &&
    acceptedAudit.splitManifest &&
    acceptedAudit.splitManifest.leakageSafe === true;

  const gate1Candidate =
    curation.block4Ready &&
    curation.curationComplete &&
    trainingSubsetReady &&
    curation.manifest.targetReached;

  return {
    ...curation,
    trainingSubsetReady,
    gate1Candidate,
    acceptedAudit: {
      block1Ready: acceptedAudit.block1Ready,
      block2Ready: acceptedAudit.block2Ready,
      block3Ready: acceptedAudit.block3Ready,
      blockingIssues: acceptedAudit.blockingIssues,
      totals: acceptedAudit.totals,
      splitManifest: acceptedAudit.splitManifest
    }
  };
}

function readDatasetEntries(inputDir) {
  const { isDatasetItemFile } = require("../midi/corpus-gate");
  const files = fs.readdirSync(inputDir).filter(isDatasetItemFile).sort((a, b) => a.localeCompare(b));
  return files.map(fileName => ({
    fileName,
    item: readJson(path.join(inputDir, fileName))
  }));
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, reportPath, manifestPath, reviewQueuePath, decisionsPath, curationOptionsPath, auditOptionsPath] = argv;
  if (!inputDir || !reportPath || !manifestPath || !reviewQueuePath) {
    console.error("Uso: node curation.js <dataset-items-dir> <curation-report.json> <corpus-manifest.json> <review-queue.json> [decisions.json] [curation-options.json] [auditor-options.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const entries = readDatasetEntries(inputDir);
    const decisions = decisionsPath ? readJson(decisionsPath) : {};
    const curationOptions = curationOptionsPath ? readJson(curationOptionsPath) : {};
    const auditOptions = auditOptionsPath ? readJson(auditOptionsPath) : {};
    const report = curateEntries(entries, decisions, curationOptions, auditOptions);

    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(manifestPath, `${JSON.stringify(report.manifest, null, 2)}\n`, "utf8");
    fs.writeFileSync(reviewQueuePath, `${JSON.stringify(report.reviewQueue, null, 2)}\n`, "utf8");

    console.log(`Dataset item: ${report.totals.discovered}`);
    console.log(`Accepted: ${report.totals.accepted}`);
    console.log(`Rejected: ${report.totals.rejected}`);
    console.log(`Hold: ${report.totals.hold}`);
    console.log(`Blocked: ${report.totals.blocked}`);
    console.log(`Review queue: ${report.totals.reviewQueue}`);
    console.log(`Training subset clean: ${report.trainingSubsetReady ? "SI" : "NO"}`);
    console.log(`Target corpus: ${report.manifest.items.length}/${report.manifest.targetMinPhrases}`);
    console.log(`FASE 3 BLOCCO 4: ${report.block4Ready ? "READY" : "REVIEW/BLOCKED"}`);
    console.log(`GATE 1 candidate: ${report.gate1Candidate ? "SI" : "NO"}`);
    console.log(`Report: ${reportPath}`);
    console.log(`Manifest: ${manifestPath}`);
    console.log(`Review queue: ${reviewQueuePath}`);

    if (!report.block4Ready) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  CURATION_SCHEMA,
  MANIFEST_SCHEMA,
  REVIEW_QUEUE_SCHEMA,
  DECISIONS_SCHEMA,
  normalizeCurationOptions,
  normalizeDecisions,
  collectAuditSignals,
  buildCurationFromAudit,
  curateEntries,
  readDatasetEntries,
  main
};
