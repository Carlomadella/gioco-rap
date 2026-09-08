"use strict";

const fs = require("node:fs");

const DECISIONS_SCHEMA = "fame-neural-curation-decisions-v1";
const REPORT_SCHEMA = "fame-neural-free-midi-chords-review-resolution-v2";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sourceIdOf(disposition) {
  return String(disposition && disposition.provenance && disposition.provenance.sourceId || "");
}

function isExpectedQualitySignal(signal) {
  if (!signal || signal.code !== "QUALITY_REVIEW") return false;
  const detail = String(signal.detail || "").trim().toLowerCase();
  return detail.startsWith("ripetizione barre elevata:");
}

function parseFuzzyPeer(signal) {
  if (!signal || signal.code !== "FUZZY_REVIEW_PAIR") return null;
  const detail = String(signal.detail || "");
  const peer = detail.split(";")[0].trim();
  return peer || null;
}

function stableUnique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function buildConflictGraph(reviewQueue, dispositions) {
  const graph = new Map();
  const ensure = id => {
    if (!graph.has(id)) graph.set(id, new Set());
    return graph.get(id);
  };

  for (const item of reviewQueue.items || []) {
    const id = item.itemId;
    if (!id) continue;
    ensure(id);

    for (const relation of item.relationalSignals || []) {
      for (const peer of relation.peers || []) {
        if (!peer) continue;
        ensure(id).add(peer);
        ensure(peer).add(id);
      }
    }

    for (const signal of item.reviewSignals || []) {
      const peer = parseFuzzyPeer(signal);
      if (peer) {
        ensure(id).add(peer);
        ensure(peer).add(id);
      }
    }
  }

  // Ignore conflict endpoints that do not belong to the current free-midi-chords source set.
  const valid = new Set(
    [...dispositions.entries()]
      .filter(([, d]) => sourceIdOf(d).startsWith("free-midi-chords:"))
      .map(([id]) => id)
  );

  for (const [id, peers] of [...graph.entries()]) {
    if (!valid.has(id)) {
      graph.delete(id);
      continue;
    }
    for (const peer of [...peers]) {
      if (!valid.has(peer)) peers.delete(peer);
    }
  }

  return graph;
}

function classifyItem(item, disposition) {
  if (!sourceIdOf(disposition).startsWith("free-midi-chords:")) {
    return {
      hardReject: false,
      unresolved: [`sourceId inatteso: ${sourceIdOf(disposition) || "missing"}`],
      expectedSignals: [],
      fuzzyPeers: [],
      relationalPeers: []
    };
  }

  const unresolved = [];
  const expectedSignals = [];
  const fuzzyPeers = [];
  const relationalPeers = [];

  for (const relation of item.relationalSignals || []) {
    const code = String(relation.code || "");
    const peers = Array.isArray(relation.peers) ? relation.peers : [];
    if (["SOURCE_SHA_DUPLICATE", "EXACT_MUSIC_DUPLICATE", "TRANSPOSITION_EQUIVALENT", "FUZZY_BLOCKING_PAIR"].includes(code)) {
      relationalPeers.push(...peers);
    } else {
      unresolved.push(`relational signal non gestito: ${code || "unknown"}`);
    }
  }

  for (const signal of item.reviewSignals || []) {
    if (!signal || typeof signal !== "object") {
      unresolved.push("review signal malformato");
      continue;
    }

    if (signal.code === "RHYTHM_REVIEW_GROUP") {
      expectedSignals.push(signal.code);
      continue;
    }

    if (isExpectedQualitySignal(signal)) {
      expectedSignals.push("QUALITY_REVIEW:HIGH_BAR_REPETITION");
      continue;
    }

    if (signal.code === "FUZZY_REVIEW_PAIR") {
      const peer = parseFuzzyPeer(signal);
      if (peer) fuzzyPeers.push(peer);
      else unresolved.push("FUZZY_REVIEW_PAIR senza peer");
      continue;
    }

    // Unknown quality/review signals are not auto-approved.
    unresolved.push(`${signal.code || "UNKNOWN"}:${String(signal.detail || "")}`);
  }

  return {
    hardReject: unresolved.length > 0,
    unresolved,
    expectedSignals,
    fuzzyPeers: stableUnique(fuzzyPeers),
    relationalPeers: stableUnique(relationalPeers)
  };
}

function chooseIndependentKeepers(ids, graph, forcedReject) {
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
    const conflictsKeeper = [...peers].some(peer => keep.has(peer));
    if (conflictsKeeper) {
      reject.add(id);
      continue;
    }
    keep.add(id);
  }

  // For every relational conflict, keeper can only survive if all its relational peers are rejected.
  // The generic curation code enforces this too; we make it explicit here.
  for (const id of [...keep]) {
    const peers = graph.get(id) || new Set();
    for (const peer of peers) {
      if (!keep.has(peer)) reject.add(peer);
    }
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
  const classification = new Map();
  const forcedReject = new Set();
  const policyUnresolved = [];

  for (const item of queueItems) {
    const info = classifyItem(item, dispositions.get(item.itemId));
    classification.set(item.itemId, info);

    if (info.hardReject) {
      forcedReject.add(item.itemId);
      policyUnresolved.push({
        itemId: item.itemId,
        signals: info.unresolved
      });
    }
  }

  const graph = buildConflictGraph(reviewQueue, dispositions);
  const candidateIds = queueItems
    .map(item => item.itemId)
    .filter(id => !forcedReject.has(id));

  const { keep, reject } = chooseIndependentKeepers(candidateIds, graph, forcedReject);

  const decisions = [];
  const reasons = new Map();

  for (const id of reject) {
    const info = classification.get(id);
    const reason = info && info.hardReject
      ? `free-midi-chords source policy: reject per segnale non auto-approvabile (${info.unresolved.join(" | ")})`
      : "free-midi-chords source policy: reject deterministico per conflitto fuzzy/exact/transposition con keeper della stessa source.";
    decisions.push({ itemId: id, action: "reject", reason });
    reasons.set(id, reason);
  }

  for (const id of keep) {
    const info = classification.get(id) || {};
    const reasonParts = [];
    if ((info.expectedSignals || []).length) {
      reasonParts.push(`segnali strutturali attesi: ${stableUnique(info.expectedSignals).join(",")}`);
    }
    const peers = stableUnique([...(info.fuzzyPeers || []), ...(info.relationalPeers || [])]);
    if (peers.length) {
      reasonParts.push("conflitti risolti mantenendo un solo keeper deterministico e rifiutando i peer");
    }
    if (!reasonParts.length) reasonParts.push("review source-specifica completata senza blocker");
    decisions.push({
      itemId: id,
      action: "accept",
      reason: `free-midi-chords source review v2: ${reasonParts.join("; ")}.`
    });
  }

  decisions.sort((a, b) => a.itemId.localeCompare(b.itemId));

  const report = {
    schema: REPORT_SCHEMA,
    version: 2,
    source: "free-midi-chords",
    policy: {
      expectedAutoAcceptSignals: [
        "RHYTHM_REVIEW_GROUP",
        "QUALITY_REVIEW: ripetizione barre elevata"
      ],
      conflictPolicy: "deterministic-independent-set; reject conflicting peers",
      unknownReviewPolicy: "reject"
    },
    totals: {
      queueItems: queueItems.length,
      acceptedKeepers: decisions.filter(x => x.action === "accept").length,
      rejectedConflictsOrUnknown: decisions.filter(x => x.action === "reject").length,
      policyUnresolved: policyUnresolved.length
    },
    policyUnresolved,
    decisions
  };

  return {
    decisionsFile: {
      schema: DECISIONS_SCHEMA,
      version: 1,
      reviewer: "FAME Neural policy/free-midi-chords-v2",
      decisions
    },
    report
  };
}

function main(argv = process.argv.slice(2)) {
  const [curationReportPath, reviewQueuePath, decisionsPath, policyReportPath] = argv;
  if (!curationReportPath || !reviewQueuePath || !decisionsPath) {
    console.error("Uso: node review-free-midi-chords.js <curation-report.json> <review-queue.json> <decisions.json> [policy-report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const result = buildResolution(readJson(curationReportPath), readJson(reviewQueuePath));
    fs.writeFileSync(decisionsPath, `${JSON.stringify(result.decisionsFile, null, 2)}\n`, "utf8");
    if (policyReportPath) fs.writeFileSync(policyReportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");

    console.log(`Review queue: ${result.report.totals.queueItems}`);
    console.log(`Accepted keepers: ${result.report.totals.acceptedKeepers}`);
    console.log(`Rejected conflict/unknown: ${result.report.totals.rejectedConflictsOrUnknown}`);
    console.log(`Policy-unresolved converted to reject: ${result.report.totals.policyUnresolved}`);

    if (result.report.totals.acceptedKeepers < 1) {
      console.error("Nessun keeper sicuro prodotto dalla source policy.");
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
  isExpectedQualitySignal,
  parseFuzzyPeer,
  buildConflictGraph,
  classifyItem,
  chooseIndependentKeepers,
  buildResolution,
  main
};
