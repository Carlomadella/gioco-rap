"use strict";

const assert = require("node:assert/strict");
const {
  reviewPhrases
} = require("./dataset/phrase-review");
const {
  resolvePhraseReview
} = require("./dataset/phrase-corpus");

console.log("FASE 3 / PHRASE REVIEW");

function entry(id, collection) {
  return {
    fileName: `${id}.phrase-item.json`,
    filePath: `${id}.phrase-item.json`,
    item: {
      phraseId: id,
      provenance: { sourceId: `${collection}:${id}` }
    }
  };
}

const entries = [
  entry("free-high-repeat", "free-midi-chords"),
  entry("fuzzy-a", "fame-original-seed-v1"),
  entry("fuzzy-b", "fame-original-seed-v1"),
  entry("bad-range", "fame-original-seed-v1"),
  entry("clean", "fame-original-seed-v1")
];

const audit = {
  schema: "fame-neural-phrase-corpus-audit-v1",
  internalQuality: {
    reviewFindings: [
      {
        itemId: "free-high-repeat",
        codes: ["HIGH_BAR_REPETITION"],
        issues: ["ripetizione barre elevata: 100.0%"]
      },
      {
        itemId: "bad-range",
        codes: ["EXTREME_PITCH_RANGE"],
        issues: ["range pitched ampio: 72 semitoni"]
      }
    ]
  },
  duplicates: {
    fuzzyNearDuplicates: {
      reviewPairs: [
        { itemA: "fuzzy-a", itemB: "fuzzy-b", score: 0.82 }
      ]
    }
  }
};

const reviewed = reviewPhrases(entries, audit);
assert.equal(reviewed.report.totals.discovered, 5);
assert.equal(reviewed.report.totals.reviewItems, 4);
assert.equal(reviewed.report.totals.rejectedTotal, 2);
assert.equal(reviewed.report.totals.acceptedTotal, 3);
assert.equal(reviewed.report.totals.reviewedAcceptDecisions, 1);
assert.ok(reviewed.report.rejectedItems.some(x => x.phraseId === "bad-range"));
assert.ok(
  reviewed.report.rejectedItems.some(x => x.phraseId === "fuzzy-a") ||
  reviewed.report.rejectedItems.some(x => x.phraseId === "fuzzy-b")
);
console.log("QUALITY + FUZZY CURATION: OK");

const resolution = resolvePhraseReview(
  new Set(["free-high-repeat"]),
  new Set(["free-high-repeat", "clean"]),
  reviewed.report.decisions
);
assert.equal(resolution.complete, true);
assert.equal(resolution.unresolved.length, 0);
assert.equal(resolution.rejectedInCorpus.length, 0);
console.log("EXPLICIT REVIEW DECISION: OK");

const unresolved = resolvePhraseReview(
  new Set(["free-high-repeat"]),
  new Set(["free-high-repeat"]),
  {}
);
assert.equal(unresolved.complete, false);
assert.equal(unresolved.unresolved.length, 1);
console.log("UNREVIEWED ITEM STILL BLOCKS: OK");

console.log("PHRASE REVIEW SMOKE TEST: OK");
