"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PHRASE_REVIEW_SCHEMA = "fame-neural-phrase-review-report-v1";
const PHRASE_REVIEW_DECISIONS_SCHEMA = "fame-neural-phrase-review-decisions-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function sourceCollection(item) {
  const sourceId = String(item && item.provenance && item.provenance.sourceId || "");
  return sourceId.split(":")[0] || "unknown";
}

function readPhraseEntries(inputDir) {
  return fs.readdirSync(inputDir)
    .filter(isPhraseFile)
    .sort((a, b) => a.localeCompare(b))
    .map(fileName => ({
      fileName,
      filePath: path.join(inputDir, fileName),
      item: readJson(path.join(inputDir, fileName))
    }));
}

function qualityByPhrase(audit) {
  const map = new Map();
  for (const finding of audit && audit.internalQuality && audit.internalQuality.reviewFindings || []) {
    if (!finding || !finding.itemId) continue;
    map.set(finding.itemId, {
      codes: Array.isArray(finding.codes) ? [...new Set(finding.codes.map(String))].sort() : [],
      issues: Array.isArray(finding.issues) ? finding.issues.map(String) : []
    });
  }
  return map;
}

function fuzzyGraph(audit) {
  const graph = new Map();
  const pairs = audit && audit.duplicates && audit.duplicates.fuzzyNearDuplicates &&
    audit.duplicates.fuzzyNearDuplicates.reviewPairs || [];

  function ensure(id) {
    if (!graph.has(id)) graph.set(id, new Set());
    return graph.get(id);
  }

  for (const pair of pairs) {
    if (!pair || !pair.itemA || !pair.itemB) continue;
    ensure(pair.itemA).add(pair.itemB);
    ensure(pair.itemB).add(pair.itemA);
  }
  return graph;
}

function addGraphEdge(graph, a, b) {
  if (!a || !b || a === b) return;
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a).add(b);
  graph.get(b).add(a);
}

function addGraphClique(graph, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))].sort();
  for (let a = 0; a < unique.length; a += 1) {
    for (let b = a + 1; b < unique.length; b += 1) {
      addGraphEdge(graph, unique[a], unique[b]);
    }
  }
}

function blockingGraph(audit) {
  const graph = new Map();

  for (const group of audit && audit.duplicates && audit.duplicates.exactMusic || []) {
    addGraphClique(graph, group.itemIds || []);
  }
  for (const group of audit && audit.duplicates && audit.duplicates.transpositionEquivalent || []) {
    addGraphClique(graph, group.itemIds || []);
  }

  const blockingPairs = audit && audit.duplicates && audit.duplicates.fuzzyNearDuplicates &&
    audit.duplicates.fuzzyNearDuplicates.blockingPairs || [];
  for (const pair of blockingPairs) {
    if (!pair || !pair.itemA || !pair.itemB) continue;
    addGraphEdge(graph, pair.itemA, pair.itemB);
  }

  return graph;
}

function mergeGraphs(...graphs) {
  const merged = new Map();
  for (const graph of graphs) {
    for (const [id, peers] of graph.entries()) {
      if (!merged.has(id)) merged.set(id, new Set());
      for (const peer of peers) addGraphEdge(merged, id, peer);
    }
  }
  return merged;
}

function isSafeHighRepetition(entry, quality) {
  if (!quality || !quality.codes.length) return false;
  const collection = sourceCollection(entry.item);
  if (!["free-midi-chords", "gmd-v1.0.0", "waivops-nrg-cp"].includes(collection)) return false;
  return quality.codes.every(code => code === "HIGH_BAR_REPETITION");
}

function chooseFuzzyKeepers(ids, graph, forcedReject) {
  const keep = new Set();
  const reject = new Set(forcedReject);
  const ordered = [...ids].sort((a, b) => {
    const degreeA = (graph.get(a) || new Set()).size;
    const degreeB = (graph.get(b) || new Set()).size;
    return degreeA - degreeB || a.localeCompare(b);
  });

  for (const id of ordered) {
    if (reject.has(id)) continue;
    const peers = graph.get(id) || new Set();
    if ([...peers].some(peer => keep.has(peer))) {
      reject.add(id);
      continue;
    }
    keep.add(id);
  }
  return { keep, reject };
}

function reviewPhrases(entries, audit) {
  if (!audit || audit.schema !== "fame-neural-phrase-corpus-audit-v1") {
    throw new Error("Audit phrase mancante o schema non valido.");
  }

  const byId = new Map(entries
    .filter(entry => entry.item && entry.item.phraseId)
    .map(entry => [entry.item.phraseId, entry]));

  const quality = qualityByPhrase(audit);
  const graph = mergeGraphs(fuzzyGraph(audit), blockingGraph(audit));
  const blockingQualityIds = new Set(
    (audit && audit.internalQuality && audit.internalQuality.blockingFindings || [])
      .map(item => item && item.itemId)
      .filter(Boolean)
  );
  const reviewIds = new Set([
    ...quality.keys(),
    ...graph.keys(),
    ...blockingQualityIds
  ]);

  const forcedReject = new Set(blockingQualityIds);
  const rejectionReasons = new Map(
    [...blockingQualityIds].map(id => [id, "internal quality blocking: duplicate-layer suspect"])
  );
  const safeQualityAccept = new Set();

  for (const id of reviewIds) {
    const entry = byId.get(id);
    if (!entry) {
      forcedReject.add(id);
      rejectionReasons.set(id, "review item non trovato nel phrase directory");
      continue;
    }

    const q = quality.get(id);
    if (q) {
      if (isSafeHighRepetition(entry, q)) {
        safeQualityAccept.add(id);
      } else {
        forcedReject.add(id);
        rejectionReasons.set(
          id,
          `quality review non auto-approvabile: ${(q.codes || []).join(",") || "unknown"}`
        );
      }
    }
  }

  const { keep: fuzzyKeep, reject: fuzzyReject } = chooseFuzzyKeepers(
    [...reviewIds],
    graph,
    forcedReject
  );

  for (const id of fuzzyReject) {
    if (!rejectionReasons.has(id)) {
      rejectionReasons.set(id, "fuzzy review pair: peer keeper deterministico mantenuto");
    }
  }

  const rejected = new Set([...forcedReject, ...fuzzyReject]);
  const keptEntries = entries.filter(entry => !rejected.has(entry.item && entry.item.phraseId));
  const decisions = [];

  for (const id of safeQualityAccept) {
    if (rejected.has(id)) continue;
    const q = quality.get(id);
    decisions.push({
      phraseId: id,
      action: "accept",
      reason: `phrase review ${sourceCollection(byId.get(id).item)}: alta ripetizione di barra coerente con la source policy (${(q.codes || []).join(",")}).`
    });
  }

  decisions.sort((a, b) => a.phraseId.localeCompare(b.phraseId));

  const rejectedItems = [...rejected].sort().map(id => {
    const entry = byId.get(id);
    return {
      phraseId: id,
      fileName: entry && entry.fileName || null,
      sourceCollection: entry ? sourceCollection(entry.item) : null,
      reason: rejectionReasons.get(id) || "review reject"
    };
  });

  const keptReviewIds = [...reviewIds].filter(id => !rejected.has(id));
  const report = {
    schema: PHRASE_REVIEW_SCHEMA,
    version: 1,
    policy: {
      highBarRepetition: "accept-with-explicit-review for free-midi-chords, gmd-v1.0.0 and waivops-nrg-cp",
      exactDuplicates: "deterministic-independent-set; reject conflicting peers",
      transpositionDuplicates: "deterministic-independent-set; reject conflicting peers",
      fuzzyBlockingPairs: "deterministic-independent-set; reject conflicting peers",
      fuzzyReviewPairs: "deterministic-independent-set; reject conflicting peers",
      duplicateLayerSuspect: "reject",
      otherQualityReview: "reject"
    },
    totals: {
      discovered: entries.length,
      reviewItems: reviewIds.size,
      acceptedTotal: keptEntries.length,
      rejectedTotal: rejectedItems.length,
      reviewedAcceptDecisions: decisions.length,
      keptReviewItems: keptReviewIds.length
    },
    rejectedItems,
    keptReviewItems: keptReviewIds.sort(),
    decisions: {
      schema: PHRASE_REVIEW_DECISIONS_SCHEMA,
      version: 1,
      reviewer: "FAME Neural phrase policy/v1",
      decisions
    }
  };

  return { keptEntries, report };
}

function writeReviewedDirectory(outputDir, keptEntries) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (isPhraseFile(name)) fs.unlinkSync(path.join(outputDir, name));
  }
  for (const entry of keptEntries) {
    fs.copyFileSync(entry.filePath, path.join(outputDir, entry.fileName));
  }
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, auditPath, outputDir, decisionsPath, reportPath] = argv;
  if (!inputDir || !auditPath || !outputDir || !decisionsPath || !reportPath) {
    console.error("Uso: node phrase-review.js <phrase-dir> <audit.json> <reviewed-dir> <decisions.json> <review-report.json>");
    process.exitCode = 64;
    return;
  }

  try {
    const entries = readPhraseEntries(inputDir);
    const audit = readJson(auditPath);
    const result = reviewPhrases(entries, audit);

    if (!result.keptEntries.length) {
      throw new Error("La review eliminerebbe tutte le phrase: stop.");
    }

    writeReviewedDirectory(outputDir, result.keptEntries);
    fs.writeFileSync(decisionsPath, `${JSON.stringify(result.report.decisions, null, 2)}\n`, "utf8");
    fs.writeFileSync(reportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");

    console.log(`Phrase input: ${result.report.totals.discovered}`);
    console.log(`Review item: ${result.report.totals.reviewItems}`);
    console.log(`Phrase kept: ${result.report.totals.acceptedTotal}`);
    console.log(`Phrase rejected: ${result.report.totals.rejectedTotal}`);
    console.log(`Review accept espliciti: ${result.report.totals.reviewedAcceptDecisions}`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  PHRASE_REVIEW_SCHEMA,
  PHRASE_REVIEW_DECISIONS_SCHEMA,
  sourceCollection,
  qualityByPhrase,
  fuzzyGraph,
  addGraphEdge,
  addGraphClique,
  blockingGraph,
  mergeGraphs,
  isSafeHighRepetition,
  chooseFuzzyKeepers,
  reviewPhrases,
  writeReviewedDirectory,
  main
};
