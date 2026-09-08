"use strict";

const fs = require("node:fs");

const DECISIONS_SCHEMA = "fame-neural-curation-decisions-v1";
const REPORT_SCHEMA = "fame-neural-nrg-cp-review-resolution-v1";

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
  const rhythmReviewed = new Set();

  const validIds = new Set(
    [...dispositions.entries()]
      .filter(([, item]) => sourceIdOf(item).startsWith("waivops-nrg-cp:"))
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

      // NRG-CP is explicitly a rhythmic chord-progression dataset. Equal rhythm
      // across different harmonic/transposition families is expected and is not
      // by itself evidence that the music is duplicated.
      if (code === "RHYTHM_REVIEW_GROUP") {
        rhythmReviewed.add(id);
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
        ? `NRG-CP source review: reject per segnale non auto-approvabile (${forcedReject.get(id)}).`
        : "NRG-CP source review: reject deterministico per duplicate/transposition/fuzzy conflict."
    });
  }

  for (const id of [...keep].sort()) {
    const tags = [];
    if (rhythmReviewed.has(id)) tags.push("rhythm-group expected");
    if ((graph.get(id) || new Set()).size) tags.push("conflict keeper");
    if (!tags.length) tags.push("high-bar-repetition only");
    decisions.push({
      itemId: id,
      action: "accept",
      reason: `NRG-CP source review: ${tags.join(", ")}; harmonic/transposition family resta distinta.`
    });
  }

  decisions.sort((a, b) => a.itemId.localeCompare(b.itemId));

  return {
    decisionsFile: {
      schema: DECISIONS_SCHEMA,
      version: 1,
      reviewer: "FAME Neural policy/nrg-cp-v1",
      decisions
    },
    report: {
      schema: REPORT_SCHEMA,
      version: 1,
      source: "WaivOps NRG-CP / CC-BY-4.0",
      policy: {
        exactTranspositionFuzzy: "deterministic keep/reject",
        rhythmReviewGroup: "accept when harmonic/transposition family is distinct",
        highBarRepetitionOnly: "accept",
        otherQualityReview: "reject"
      },
      totals: {
        queueItems: queue.length,
        acceptedKeepers: decisions.filter(x => x.action === "accept").length,
        rejected: decisions.filter(x => x.action === "reject").length,
        rhythmReviewed: rhythmReviewed.size,
        forcedQualityRejects: forcedReject.size
      }
    }
  };
}

function main(argv = process.argv.slice(2)) {
  const [curationPath, queuePath, decisionsPath, reportPath] = argv;
  if (!curationPath || !queuePath || !decisionsPath) {
    console.error("Uso: node review-nrg-cp.js <curation.json> <review-queue.json> <decisions.json> [report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const result = buildResolution(readJson(curationPath), readJson(queuePath));
    fs.writeFileSync(decisionsPath, `${JSON.stringify(result.decisionsFile, null, 2)}\n`, "utf8");
    if (reportPath) fs.writeFileSync(reportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");
    console.log(`NRG-CP review queue: ${result.report.totals.queueItems}`);
    console.log(`NRG-CP keepers: ${result.report.totals.acceptedKeepers}`);
    console.log(`NRG-CP rejected: ${result.report.totals.rejected}`);
    console.log(`NRG-CP rhythm-reviewed accepted candidates: ${result.report.totals.rhythmReviewed}`);

    if (result.report.totals.queueItems > 0 && result.report.totals.acceptedKeepers < 1) {
      console.error("Nessun keeper NRG-CP prodotto dalla review.");
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
  parseFuzzyPeer,
  isHighRepetitionOnly,
  buildResolution,
  main
};
