"use strict";

const fs = require("node:fs");

const DECISIONS_SCHEMA = "fame-neural-curation-decisions-v1";
const REPORT_SCHEMA = "fame-neural-gmd-review-resolution-v1";

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
  const detail = String(signal.detail || "");
  const peer = detail.split(";")[0].trim();
  return peer || null;
}

function isExpectedQualitySignal(signal) {
  if (!signal || signal.code !== "QUALITY_REVIEW") return false;
  const detail = String(signal.detail || "").trim().toLowerCase();
  return detail.startsWith("ripetizione barre elevata:");
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
    for (let b = a + 1; b < unique.length; b += 1) {
      addEdge(graph, unique[a], unique[b]);
    }
  }
}

function buildSignals(reviewQueue, dispositions) {
  const graph = new Map();
  const invalid = new Map();
  const rhythmGroups = new Map();
  const validGmdIds = new Set(
    [...dispositions.entries()]
      .filter(([, d]) => sourceIdOf(d).startsWith("gmd-v1.0.0:"))
      .map(([id]) => id)
  );

  for (const item of reviewQueue.items || []) {
    const id = item && item.itemId;
    if (!id) continue;
    ensureGraphNode(graph, id);

    if (!validGmdIds.has(id)) {
      invalid.set(id, `sourceId inatteso: ${sourceIdOf(dispositions.get(id)) || "missing"}`);
      continue;
    }

    for (const relation of item.relationalSignals || []) {
      const code = String(relation && relation.code || "");
      const peers = Array.isArray(relation && relation.peers) ? relation.peers : [];
      if (["SOURCE_SHA_DUPLICATE", "EXACT_MUSIC_DUPLICATE", "TRANSPOSITION_EQUIVALENT", "FUZZY_BLOCKING_PAIR"].includes(code)) {
        for (const peer of peers) if (validGmdIds.has(peer)) addEdge(graph, id, peer);
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
        else if (validGmdIds.has(peer)) addEdge(graph, id, peer);
        continue;
      }

      if (isExpectedQualitySignal(signal)) {
        continue;
      }

      invalid.set(id, `${code || "UNKNOWN"}:${String(signal && signal.detail || "")}`);
    }
  }

  for (const ids of rhythmGroups.values()) addClique(graph, ids);

  return { graph, invalid, validGmdIds, rhythmGroups };
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
    if ([...peers].some(peer => keep.has(peer))) {
      reject.add(id);
      continue;
    }
    keep.add(id);
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
  const forcedReject = new Set(invalid.keys());

  const { keep, reject } = chooseKeepers(
    queueItems.map(item => item.itemId),
    graph,
    forcedReject
  );

  const decisions = [];

  for (const id of [...reject].sort()) {
    decisions.push({
      itemId: id,
      action: "reject",
      reason: invalid.has(id)
        ? `GMD source review: reject per segnale non auto-approvabile (${invalid.get(id)}).`
        : "GMD source review: reject deterministico per conflitto rhythm/fuzzy/exact/transposition con un keeper."
    });
  }

  for (const id of [...keep].sort()) {
    const degree = (graph.get(id) || new Set()).size;
    decisions.push({
      itemId: id,
      action: "accept",
      reason: degree > 0
        ? "GMD source review: keeper deterministico; tutti i peer conflittuali sono rifiutati."
        : "GMD source review: solo alta ripetizione di barra attesa in un groove umano 4/4; nessun blocker relazionale."
    });
  }

  decisions.sort((a, b) => a.itemId.localeCompare(b.itemId));

  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    source: "Groove MIDI Dataset v1.0.0",
    policy: {
      rhythmReviewGroup: "deduplicate; keep one deterministic representative",
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
    },
    unknownSignals: [...invalid.entries()].map(([itemId, reason]) => ({ itemId, reason })),
    decisions
  };

  return {
    decisionsFile: {
      schema: DECISIONS_SCHEMA,
      version: 1,
      reviewer: "FAME Neural policy/gmd-v1",
      decisions
    },
    report
  };
}

function main(argv = process.argv.slice(2)) {
  const [curationReportPath, reviewQueuePath, decisionsPath, policyReportPath] = argv;
  if (!curationReportPath || !reviewQueuePath || !decisionsPath) {
    console.error("Uso: node review-gmd.js <curation-report.json> <review-queue.json> <decisions.json> [policy-report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const result = buildResolution(readJson(curationReportPath), readJson(reviewQueuePath));
    fs.writeFileSync(decisionsPath, `${JSON.stringify(result.decisionsFile, null, 2)}\n`, "utf8");
    if (policyReportPath) {
      fs.writeFileSync(policyReportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");
    }

    console.log(`GMD review queue: ${result.report.totals.queueItems}`);
    console.log(`GMD keepers: ${result.report.totals.acceptedKeepers}`);
    console.log(`GMD rejected: ${result.report.totals.rejected}`);
    console.log(`GMD rhythm groups: ${result.report.totals.rhythmGroups}`);

    if (result.report.totals.queueItems > 0 && result.report.totals.acceptedKeepers < 1) {
      console.error("La review GMD non ha prodotto alcun keeper.");
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
