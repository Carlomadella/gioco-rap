"use strict";

const fs = require("node:fs");

const DECISIONS_SCHEMA = "fame-neural-curation-decisions-v1";
const REPORT_SCHEMA = "fame-neural-pdmx-review-resolution-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sourceIdOf(disposition) {
  return String(disposition && disposition.provenance && disposition.provenance.sourceId || "");
}

function addEdge(graph, a, b) {
  if (!a || !b || a === b) return;
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a).add(b);
  graph.get(b).add(a);
}

function addClique(graph, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))].sort();
  for (let a = 0; a < unique.length; a += 1) {
    for (let b = a + 1; b < unique.length; b += 1) addEdge(graph, unique[a], unique[b]);
  }
}

function parseFuzzyPeer(signal) {
  if (!signal || signal.code !== "FUZZY_REVIEW_PAIR") return null;
  return String(signal.detail || "").split(";")[0].trim() || null;
}

function isHighRepetitionOnly(signal) {
  if (!signal || signal.code !== "QUALITY_REVIEW") return false;
  return String(signal.detail || "").trim().toLowerCase().startsWith("ripetizione barre elevata:");
}

function buildResolution(curationReport, reviewQueue) {
  const dispositions = new Map(
    (curationReport.dispositions || [])
      .filter(item => item && item.itemId)
      .map(item => [item.itemId, item])
  );
  const queue = (reviewQueue.items || []).filter(item => item && item.itemId);
  const graph = new Map();
  const forcedReject = new Map();
  const rhythmGroups = new Map();

  const validIds = new Set(
    [...dispositions.entries()]
      .filter(([, item]) => sourceIdOf(item).startsWith("pdmx-v2025:"))
      .map(([id]) => id)
  );

  for (const item of queue) {
    const id = item.itemId;
    if (!validIds.has(id)) {
      forcedReject.set(id, `sourceId inatteso: ${sourceIdOf(dispositions.get(id)) || "missing"}`);
      continue;
    }

    for (const relation of item.relationalSignals || []) {
      const code = String(relation && relation.code || "");
      if (!["SOURCE_SHA_DUPLICATE", "EXACT_MUSIC_DUPLICATE", "TRANSPOSITION_EQUIVALENT", "FUZZY_BLOCKING_PAIR"].includes(code)) {
        forcedReject.set(id, `relational signal non gestito: ${code || "unknown"}`);
        continue;
      }
      for (const peer of relation.peers || []) {
        if (validIds.has(peer)) addEdge(graph, id, peer);
      }
    }

    for (const signal of item.reviewSignals || []) {
      const code = String(signal && signal.code || "");

      if (code === "RHYTHM_REVIEW_GROUP") {
        const key = String(signal.detail || "").trim();
        if (!key) {
          forcedReject.set(id, "RHYTHM_REVIEW_GROUP senza fingerprint");
          continue;
        }
        if (!rhythmGroups.has(key)) rhythmGroups.set(key, []);
        rhythmGroups.get(key).push(id);
        continue;
      }

      if (code === "FUZZY_REVIEW_PAIR") {
        const peer = parseFuzzyPeer(signal);
        if (!peer) forcedReject.set(id, "FUZZY_REVIEW_PAIR senza peer");
        else if (validIds.has(peer)) addEdge(graph, id, peer);
        continue;
      }

      if (isHighRepetitionOnly(signal)) continue;

      forcedReject.set(id, `${code || "UNKNOWN"}:${String(signal && signal.detail || "")}`);
    }
  }

  for (const ids of rhythmGroups.values()) addClique(graph, ids);

  const keep = new Set();
  const reject = new Set(forcedReject.keys());
  const ordered = queue.map(x => x.itemId).sort((a, b) => {
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

  const decisions = [];
  for (const id of [...reject].sort()) {
    decisions.push({
      itemId: id,
      action: "reject",
      reason: forcedReject.has(id)
        ? `PDMX source review: reject per quality/review signal non auto-approvabile (${forcedReject.get(id)}).`
        : "PDMX source review: reject deterministico per conflitto duplicate/rhythm/fuzzy con un keeper."
    });
  }
  for (const id of [...keep].sort()) {
    decisions.push({
      itemId: id,
      action: "accept",
      reason: (graph.get(id) || new Set()).size
        ? "PDMX source review: keeper deterministico, peer conflittuali rifiutati."
        : "PDMX source review: solo alta ripetizione di barra; nessun blocker relazionale o quality aggiuntivo."
    });
  }

  decisions.sort((a, b) => a.itemId.localeCompare(b.itemId));

  return {
    decisionsFile: {
      schema: DECISIONS_SCHEMA,
      version: 1,
      reviewer: "FAME Neural policy/pdmx-v1",
      decisions
    },
    report: {
      schema: REPORT_SCHEMA,
      version: 1,
      source: "PDMX no_license_conflict + deduplicated + all_valid",
      policy: {
        duplicateRhythmFuzzy: "deterministic keep/reject",
        highBarRepetitionOnly: "accept",
        otherQualityReview: "reject"
      },
      totals: {
        queueItems: queue.length,
        acceptedKeepers: decisions.filter(x => x.action === "accept").length,
        rejected: decisions.filter(x => x.action === "reject").length,
        forcedQualityRejects: forcedReject.size
      },
      forcedRejects: [...forcedReject.entries()].map(([itemId, reason]) => ({ itemId, reason }))
    }
  };
}

function main(argv = process.argv.slice(2)) {
  const [curationPath, queuePath, decisionsPath, reportPath] = argv;
  if (!curationPath || !queuePath || !decisionsPath) {
    console.error("Uso: node review-pdmx.js <curation.json> <review-queue.json> <decisions.json> [report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const result = buildResolution(readJson(curationPath), readJson(queuePath));
    fs.writeFileSync(decisionsPath, `${JSON.stringify(result.decisionsFile, null, 2)}\n`, "utf8");
    if (reportPath) fs.writeFileSync(reportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");
    console.log(`PDMX review queue: ${result.report.totals.queueItems}`);
    console.log(`PDMX keepers: ${result.report.totals.acceptedKeepers}`);
    console.log(`PDMX rejected: ${result.report.totals.rejected}`);
    if (result.report.totals.queueItems > 0 && result.report.totals.acceptedKeepers < 1) {
      console.error("Nessun keeper PDMX prodotto dalla review.");
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
  addEdge,
  addClique,
  parseFuzzyPeer,
  isHighRepetitionOnly,
  buildResolution,
  main
};
