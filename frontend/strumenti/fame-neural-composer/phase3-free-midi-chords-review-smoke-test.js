"use strict";

const assert = require("node:assert/strict");
const { buildResolution } = require("./dataset/review-free-midi-chords");

console.log("FASE 3 / FREE-MIDI-CHORDS REVIEW RESOLUTION V2");

function curation(ids) {
  return {
    dispositions: ids.map(id => ({
      itemId: id,
      provenance: { sourceId: `free-midi-chords:vTEST:${id}` }
    }))
  };
}

{
  const ids = ["a", "b"];
  const queue = {
    items: [
      {
        itemId: "a",
        relationalSignals: [],
        reviewSignals: [
          { code: "RHYTHM_REVIEW_GROUP", detail: "rhythm:x" },
          { code: "QUALITY_REVIEW", detail: "ripetizione barre elevata: 100.0%" }
        ]
      },
      {
        itemId: "b",
        relationalSignals: [],
        reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP", detail: "rhythm:y" }]
      }
    ]
  };
  const r = buildResolution(curation(ids), queue);
  assert.equal(r.report.totals.acceptedKeepers, 2);
  assert.equal(r.report.totals.rejectedConflictsOrUnknown, 0);
  console.log("EXPECTED STRUCTURAL SIGNALS: KEEP: OK");
}

{
  const ids = ["a", "b", "c"];
  const queue = {
    items: [
      {
        itemId: "a",
        relationalSignals: [],
        reviewSignals: [{ code: "FUZZY_REVIEW_PAIR", detail: "b;score=0.810000" }]
      },
      {
        itemId: "b",
        relationalSignals: [],
        reviewSignals: [
          { code: "FUZZY_REVIEW_PAIR", detail: "a;score=0.810000" },
          { code: "FUZZY_REVIEW_PAIR", detail: "c;score=0.830000" }
        ]
      },
      {
        itemId: "c",
        relationalSignals: [],
        reviewSignals: [{ code: "FUZZY_REVIEW_PAIR", detail: "b;score=0.830000" }]
      }
    ]
  };
  const r = buildResolution(curation(ids), queue);
  const actions = Object.fromEntries(r.decisionsFile.decisions.map(x => [x.itemId, x.action]));
  assert.equal(actions.b, "reject");
  assert.equal(actions.a, "accept");
  assert.equal(actions.c, "accept");
  console.log("FUZZY REVIEW GRAPH: DEDUP KEEPERS: OK");
}

{
  const ids = ["a", "b"];
  const queue = {
    items: [
      {
        itemId: "a",
        relationalSignals: [{ code: "TRANSPOSITION_EQUIVALENT", peers: ["b"] }],
        reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP" }]
      },
      {
        itemId: "b",
        relationalSignals: [{ code: "TRANSPOSITION_EQUIVALENT", peers: ["a"] }],
        reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP" }]
      }
    ]
  };
  const r = buildResolution(curation(ids), queue);
  const actions = r.decisionsFile.decisions.map(x => x.action).sort();
  assert.deepEqual(actions, ["accept", "reject"]);
  console.log("RELATIONAL DUPLICATE: ONE KEEPER ONLY: OK");
}

{
  const ids = ["a", "b"];
  const queue = {
    items: [
      {
        itemId: "a",
        relationalSignals: [],
        reviewSignals: [{ code: "QUALITY_REVIEW", detail: "range pitched ampio: 72 semitoni" }]
      },
      {
        itemId: "b",
        relationalSignals: [],
        reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP" }]
      }
    ]
  };
  const r = buildResolution(curation(ids), queue);
  const actions = Object.fromEntries(r.decisionsFile.decisions.map(x => [x.itemId, x.action]));
  assert.equal(actions.a, "reject");
  assert.equal(actions.b, "accept");
  console.log("UNKNOWN QUALITY: REJECT, NON BYPASS: OK");
}

console.log("FREE-MIDI-CHORDS REVIEW RESOLUTION V2 SMOKE TEST: OK");
