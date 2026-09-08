"use strict";

const assert = require("node:assert/strict");
const { classifyImportedItem } = require("./dataset/filter-pdmx-compatible");

console.log("FASE 3 / PDMX COMPATIBILITY FILTER");

function item({ technical = true, commercial = true, events = [], errors = [] } = {}) {
  return {
    eligibility: {
      technical,
      commercialTraining: commercial
    },
    import: {
      errors: errors.map(code => ({ code })),
      warnings: []
    },
    canonical: {
      events
    },
    canonicalSegments: []
  };
}

assert.equal(
  classifyImportedItem(item({
    technical: false,
    events: [{ type: "harmony" }, { type: "harmony" }, { type: "harmony" }, { type: "harmony" }],
    errors: ["METER_MAP_UNSUPPORTED"]
  }), 4).reason,
  "technical-blocked"
);

assert.equal(
  classifyImportedItem(item({
    events: [{ type: "drums" }, { type: "drums" }, { type: "lead" }]
  }), 4).reason,
  "insufficient-pitched:1<4"
);

assert.equal(
  classifyImportedItem(item({
    events: [
      { type: "harmony" },
      { type: "harmony" },
      { type: "lead" },
      { type: "lead" }
    ]
  }), 4).compatible,
  true
);

console.log("TECHNICAL BLOCK REJECT: OK");
console.log("NON-PITCHED REJECT: OK");
console.log("PITCHED COMPATIBLE ACCEPT: OK");
console.log("PDMX COMPATIBILITY FILTER SMOKE TEST: OK");
