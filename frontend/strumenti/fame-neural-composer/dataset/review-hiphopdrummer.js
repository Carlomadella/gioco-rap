"use strict";

const fs = require("node:fs");

const DECISIONS_SCHEMA = "fame-neural-curation-decisions-v1";
const REPORT_SCHEMA = "fame-neural-hiphopdrummer-review-resolution-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sourceIdOf(disposition) {
  return String(disposition && disposition.provenance && disposition.provenance.sourceId || "");
}

function stableUnique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function parseFuzzyPeer(signal) {
  if (!signal || signal.code !== "FUZZY_REVIEW_PAIR") return null;
  return String(signal.detail || "").split(";")[0].trim() || null;
}

function isExpectedQualitySignal(signal) {
  if (!signal || signal.code !== "QUALITY_REVIEW") return false;
  return String(signal.detail || "").trim().toLowerCase().startsWith("ripetizione barre elevata:");
}

function ensureGraphNode(graph, id) {
  if (!graph.has(id)) graph.set(id, new Set());
  return graph.get(id);
}

function addEdge(graph, a, b) {
  if (!a || !b || a === b) return;
  ensureGraphNode(graph, a).add(b);
  ensureGraphNode(graph, b).add(a);
}

function addClique(graph, ids) {
  const unique = stableUnique(ids);
  for (let a = 0; a < unique.length; a += 1) {
    for (let b = a + 1; b < unique.length; b += 1) addEdge(graph, unique[a], unique[b]);
  }
}

function buildSignals(reviewQueue, dispositions) {
  const graph = new Map();
  const invalid = new Map();
  const rhythmGroups = new Map();
  const validIds = new Set(
    [...dispositions.entries()]
      .filter(([, d]) => sourceIdOf(d).startsWith("hiphopdrummer:"))
      .map(([id]) => id)
  );

  for (const item of reviewQueue.items || []) {
    const id = item && item.itemId;
    if (!id) continue;
    ensureGraphNode(graph, id);

    if (!validIds.has(id)) {
      invalid.set(id, `sourceId inatteso: ${sourceIdOf(dispositions.get(id)) || "missing"}`);
      continue;
    }

    for (const relation of item.relationalSignals || []) {
      const code = String(relation && relation.code || "");
      const peers = Array.isArray(relation && relation.peers) ? relation.peers : [];
      if (["SOURCE_SHA_DUPLICATE", "EXACT_MUSIC_DUPLICATE", "TRANSPOSITION_EQUIVALENT", "FUZZY_BLOCKING_PAIR"].includes(code)) {
        for (const peer of peers) if (validIds.has(peer)) addEdge(graph, id, peer);
      } else {
        invalid.set(id, `relational signal non gestito: ${code || "unknown"}`);
      }
    }

    for (const signal of item.reviewSignals || []) {
      const code = String(signal && signal.code || "");

      if (code === "RHYTHM_REVIEW_GROUP") {
        const key = String(signal.detail || "").trim();
        if (!key) {
          invalid.set(id, "RHYTHM_REVIEW_GROUP senza fingerprint");
          continue;
        }
        if (!rhythmGroups.has(key)) rhythmGroups.set(key, []);
        rhythmGroups.get(key).push(id);
        continue;
      }

      if (code === "FUZZY_REVIEW_PAIR") {
        const peer = parseFuzzyPeer(signal);
        if (!peer) invalid.set(id, "FUZZY_REVIEW_PAIR senza peer");
        else if (validIds.has(peer)) addEdge(graph, id, peer);
        continue;
      }

      if (isExpectedQualitySignal(signal)) continue;
      invalid.set(id, `${code || "UNKNOWN"}:${String(signal && signal.detail || "")}`);
    }
  }

  // Unlike NRG-CP, HHD is a finite rule-generator with curated pattern libraries.
  // Same-rhythm groups are therefore treated conservatively as duplicate candidates.
  for (const ids of rhythmGroups.values()) addClique(graph, ids);

  return { graph, invalid, validIds, rhythmGroups };
}

function chooseKeepers(ids, graph, forcedReject) {
  const keep = new Set();
  const reject = new Set(forcedReject);
  const ordered = [...new Set(ids)].sort((a, b) => {
    const da = (graph.get(a) || new Set()).size;
    const db = (graph.get(b) || new Set()).size;
    return da - db || a.localeCompare(b);
  });

  for (const id of ordered) {
    if (reject.has(id)) continue;
    const peers = graph.get(id) || new Set();
    if ([...peers].some(peer => keep.has(peer))) reject.add(id);
    else keep.add(id);
  }
  return { keep, reject };
}

function buildResolution(curationReport, reviewQueue) {
  const dispositions = new Map(
    (curationReport.dispositions || [])
      .filter(item => item && item.itemId)
      .map(item => [item.itemId, item])
  );
  const queueItems = (reviewQueue.items || []).filter(item => item && item.itemId);
  const { graph, invalid, rhythmGroups } = buildSignals(reviewQueue, dispositions);
  const { keep, reject } = chooseKeepers(
    queueItems.map(item => item.itemId),
    new Map(graph),
    new Set(invalid.keys())
  );

  const decisions = [];

  for (const id of [...reject].sort()) {
    decisions.push({
      itemId: id,
      action: "reject",
      reason: invalid.has(id)
        ? `HipHopDrummer review: reject per segnale non auto-approvabile (${invalid.get(id)}).`
        : "HipHopDrummer review: reject deterministico per conflitto rhythm/fuzzy/exact/transposition."
    });
  }

  for (const id of [...keep].sort()) {
    decisions.push({
      itemId: id,
      action: "accept",
      reason: (graph.get(id) || new Set()).size > 0
        ? "HipHopDrummer review: keeper deterministico; peer conflittuali rifiutati."
        : "HipHopDrummer review: solo alta ripetizione di barra attesa; nessun blocker relazionale."
    });
  }

  decisions.sort((a, b) => a.itemId.localeCompare(b.itemId));

  return {
    decisionsFile: {
      schema: DECISIONS_SCHEMA,
      version: 1,
      reviewer: "FAME Neural policy/hiphopdrummer-v1",
      decisions
    },
    report: {
      schema: REPORT_SCHEMA,
      version: 1,
      source: "Hip Hop Drummer pinned generator",
      policy: {
        rhythmReviewGroup: "deduplicate; keep deterministic representative",
        fuzzyReviewPair: "deduplicate via deterministic conflict graph",
        exactTranspositionBlockingRelation: "deduplicate via deterministic conflict graph",
        highBarRepetition: "accept if otherwise clean",
        unknownQualityOrReview: "reject"
      },
      totals: {
        queueItems: queueItems.length,
        acceptedKeepers: decisions.filter(x => x.action === "accept").length,
        rejected: decisions.filter(x => x.action === "reject").length,
        unknownSignalRejects: invalid.size,
        rhythmGroups: rhythmGroups.size
      }
    }
  };
}

function main(argv = process.argv.slice(2)) {
  const [curationReportPath, reviewQueuePath, decisionsPath, reportPath] = argv;
  if (!curationReportPath || !reviewQueuePath || !decisionsPath) {
    console.error("Uso: node review-hiphopdrummer.js <curation.json> <review-queue.json> <decisions.json> [report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const result = buildResolution(readJson(curationReportPath), readJson(reviewQueuePath));
    fs.writeFileSync(decisionsPath, `${JSON.stringify(result.decisionsFile, null, 2)}\n`, "utf8");
    if (reportPath) fs.writeFileSync(reportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");
    console.log(`HHD review queue: ${result.report.totals.queueItems}`);
    console.log(`HHD keepers: ${result.report.totals.acceptedKeepers}`);
    console.log(`HHD rejected: ${result.report.totals.rejected}`);
    console.log(`HHD rhythm groups: ${result.report.totals.rhythmGroups}`);

    if (result.report.totals.queueItems > 0 && result.report.totals.acceptedKeepers < 1) {
      console.error("La review HHD non ha prodotto alcun keeper.");
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  DECISIONS_SCHEMA,
  REPORT_SCHEMA,
  parseFuzzyPeer,
  isExpectedQualitySignal,
  addEdge,
  addClique,
  buildSignals,
  chooseKeepers,
  buildResolution,
  main
};
