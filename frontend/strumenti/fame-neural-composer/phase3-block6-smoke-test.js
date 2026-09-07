"use strict";

const assert = require("node:assert/strict");
const { buildInventory } = require("./dataset/corpus-inventory");
const { evaluateDataReady } = require("./dataset/data-ready-gate");

function phrase(index, collection, family, roles, licenseId = "FAME-ORIGINAL-TEST", cleared = true) {
  const events = [];
  let tick = 0;
  for (const role of roles) {
    if (role === "drums") {
      events.push({ type: "kick", tick });
      events.push({ type: "snare", tick: tick + 960 });
    } else if (role === "808") {
      events.push({ type: "808", tick, note: 36, durationTicks: 480 });
    } else if (role === "harmony") {
      events.push({ type: "harmony", tick, note: 60, durationTicks: 960 });
    } else if (role === "lead") {
      events.push({ type: "lead", tick, note: 72, durationTicks: 240 });
    }
    tick += 120;
  }

  return {
    fileName: `phrase-${index}.phrase-item.json`,
    item: {
      schema: "fame-neural-phrase-item-v1",
      version: 1,
      phraseId: `phrase-${index}`,
      sourceDatasetItemId: `source-${index}`,
      phraseBars: 4,
      provenance: {
        sourceId: `${collection}:${index}`,
        creator: "fixture",
        licenseId,
        compositionFamily: family,
        commercialTrainingAllowed: cleared,
        commercialOutputAllowed: true
      },
      rights: {
        commercialTrainingAllowed: cleared,
        commercialOutputAllowed: true
      },
      canonical: {
        schema: "fame-neural-sequence-v1",
        timing: { ppq: 960, bpm: 140, bars: 4 },
        events
      }
    }
  };
}

function cleanAudit() {
  return {
    schema: "fame-neural-phrase-corpus-audit-v1",
    block5Ready: true,
    corpusClean: true,
    reviewComplete: true,
    targetReached: true,
    sourceLeakage: [],
    splitManifest: { leakageSafe: true }
  };
}

const smallPolicy = {
  targetMinPhrases: 6,
  minCompositionFamilies: 4,
  minSourceCollections: 2,
  maxSourceCollectionShare: 0.7,
  minRoleCoverage: { drums: 3, "808": 2, harmony: 2, lead: 2, pitchedAny: 3 }
};

console.log("FASE 3 / BLOCCO 6");

const balancedEntries = [
  phrase(1, "fame-original", "fam-a", ["drums", "808", "lead"]),
  phrase(2, "fame-original", "fam-b", ["drums", "harmony"]),
  phrase(3, "gmd-v1", "fam-c", ["drums"]),
  phrase(4, "gmd-v1", "fam-d", ["drums"]),
  phrase(5, "public-domain", "fam-e", ["harmony", "lead"]),
  phrase(6, "public-domain", "fam-f", ["808", "lead"])
];
const balancedInventory = buildInventory(balancedEntries);
const balancedGate = evaluateDataReady(cleanAudit(), balancedInventory, smallPolicy);
assert.equal(balancedGate.ready, true);
console.log("BALANCED MIX READY: OK");

const drumsOnly = Array.from({ length: 6 }, (_, index) =>
  phrase(index + 20, "gmd-v1", `gmd-family-${index}`, ["drums"], "CC-BY-4.0")
);
const drumsInventory = buildInventory(drumsOnly);
const drumsGate = evaluateDataReady(cleanAudit(), drumsInventory, smallPolicy);
assert.equal(drumsGate.ready, false);
assert.ok(drumsGate.blockers.some(x => x.includes("coverage 808")));
assert.ok(drumsGate.blockers.some(x => x.includes("source collection")));
console.log("GMD-ONLY CANNOT CLOSE GATE 1: OK");

const rightsEntries = [...balancedEntries];
rightsEntries[0] = phrase(100, "fame-original", "fam-z", ["drums", "808", "lead"], "UNCLEAR", false);
const rightsGate = evaluateDataReady(cleanAudit(), buildInventory(rightsEntries), smallPolicy);
assert.equal(rightsGate.ready, false);
assert.ok(rightsGate.blockers.some(x => x.includes("commercial-training-cleared")));
console.log("RIGHTS BLOCK: OK");

const leakageAudit = cleanAudit();
leakageAudit.splitManifest = { leakageSafe: false };
const leakageGate = evaluateDataReady(leakageAudit, balancedInventory, smallPolicy);
assert.equal(leakageGate.ready, false);
assert.ok(leakageGate.blockers.some(x => x.includes("leakage")));
console.log("LEAKAGE BLOCK: OK");

console.log("FASE 3 BLOCCO 6 SMOKE TEST: OK");
