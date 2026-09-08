"use strict";

const assert = require("node:assert/strict");
const {
  blockingGraph,
  mergeGraphs,
  reviewPhrases
} = require("./dataset/phrase-review");

console.log("FASE 3 / GLOBAL PHRASE CLEANUP");

function entry(id, source = "gmd-v1.0.0") {
  return {
    fileName: `${id}.phrase-item.json`,
    filePath: `${id}.phrase-item.json`,
    item: {
      phraseId: id,
      provenance: { sourceId: `${source}:${id}` }
    }
  };
}

const audit = {
  schema: "fame-neural-phrase-corpus-audit-v1",
  internalQuality: {
    blockingFindings: [
      { itemId: "dup-layer", code: "DUPLICATE_LAYER_SUSPECT" }
    ],
    reviewFindings: [
      { itemId: "gmd-repeat", codes: ["HIGH_BAR_REPETITION"], issues: ["ripetizione barre elevata: 100.0%"] }
    ]
  },
  duplicates: {
    exactMusic: [
      { itemIds: ["exact-a", "exact-b"] }
    ],
    transpositionEquivalent: [
      { itemIds: ["trans-a", "trans-b", "trans-c"] }
    ],
    fuzzyNearDuplicates: {
      reviewPairs: [
        { itemA: "review-a", itemB: "review-b", score: 0.82 }
      ],
      blockingPairs: [
        { itemA: "block-a", itemB: "block-b", score: 0.96 }
      ]
    }
  }
};

const entries = [
  "dup-layer",
  "gmd-repeat",
  "exact-a",
  "exact-b",
  "trans-a",
  "trans-b",
  "trans-c",
  "review-a",
  "review-b",
  "block-a",
  "block-b",
  "clean"
].map(id => entry(id));

const reviewed = reviewPhrases(entries, audit);
const keptIds = new Set(reviewed.keptEntries.map(x => x.item.phraseId));

assert.equal(keptIds.has("dup-layer"), false);
assert.equal(keptIds.has("gmd-repeat"), true);

assert.equal(
  ["exact-a", "exact-b"].filter(id => keptIds.has(id)).length,
  1
);
assert.equal(
  ["trans-a", "trans-b", "trans-c"].filter(id => keptIds.has(id)).length,
  1
);
assert.equal(
  ["review-a", "review-b"].filter(id => keptIds.has(id)).length,
  1
);
assert.equal(
  ["block-a", "block-b"].filter(id => keptIds.has(id)).length,
  1
);

assert.ok(
  reviewed.report.decisions.decisions.some(
    x => x.phraseId === "gmd-repeat" && x.action === "accept"
  )
);

console.log("DUPLICATE LAYER REJECT: OK");
console.log("EXACT GROUP DEDUP: OK");
console.log("TRANSPOSITION GROUP DEDUP: OK");
console.log("FUZZY REVIEW DEDUP: OK");
console.log("FUZZY BLOCKING DEDUP: OK");
console.log("GMD HIGH REPETITION REVIEW: OK");
console.log("GLOBAL PHRASE CLEANUP SMOKE TEST: OK");
