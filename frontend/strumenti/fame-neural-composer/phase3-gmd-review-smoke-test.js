"use strict";

const assert = require("node:assert/strict");
const { buildResolution } = require("./dataset/review-gmd");

console.log("FASE 3 / GMD SOURCE REVIEW");

function disposition(id) {
  return {
    itemId: id,
    provenance: { sourceId: `gmd-v1.0.0:${id}` }
  };
}

const curation = {
  dispositions: ["a", "b", "c", "d", "e"].map(disposition)
};

const queue = {
  items: [
    {
      itemId: "a",
      relationalSignals: [],
      reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP", detail: "rhythm-1" }]
    },
    {
      itemId: "b",
      relationalSignals: [],
      reviewSignals: [
        { code: "RHYTHM_REVIEW_GROUP", detail: "rhythm-1" },
        { code: "FUZZY_REVIEW_PAIR", detail: "c;score=0.820000" }
      ]
    },
    {
      itemId: "c",
      relationalSignals: [],
      reviewSignals: [{ code: "FUZZY_REVIEW_PAIR", detail: "b;score=0.820000" }]
    },
    {
      itemId: "d",
      relationalSignals: [],
      reviewSignals: [{ code: "QUALITY_REVIEW", detail: "ripetizione barre elevata: 100.0%" }]
    },
    {
      itemId: "e",
      relationalSignals: [],
      reviewSignals: [{ code: "QUALITY_REVIEW", detail: "densita' estrema: 120 eventi in una barra" }]
    }
  ]
};

const result = buildResolution(curation, queue);
const actions = Object.fromEntries(result.decisionsFile.decisions.map(x => [x.itemId, x.action]));

assert.equal(actions.e, "reject");
assert.equal(actions.d, "accept");
assert.ok(["accept", "reject"].includes(actions.a));
assert.ok(["accept", "reject"].includes(actions.b));
assert.ok(["accept", "reject"].includes(actions.c));
assert.ok(!(actions.a === "accept" && actions.b === "accept"));
assert.ok(!(actions.b === "accept" && actions.c === "accept"));

console.log("RHYTHM DEDUP: OK");
console.log("FUZZY DEDUP: OK");
console.log("HIGH REPETITION: OK");
console.log("UNKNOWN QUALITY REJECT: OK");
console.log("GMD SOURCE REVIEW SMOKE TEST: OK");
