"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { buildPlan, materialize } = require("./dataset/select-pdmx");
const { buildResolution } = require("./dataset/review-pdmx");

console.log("FASE 3 / PDMX EXPANSION");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-pdmx-smoke-"));
try {
  const subsets = path.join(tmp, "subset_paths");
  const extracted = path.join(tmp, "extracted");
  const output = path.join(tmp, "output");
  fs.mkdirSync(subsets, { recursive: true });
  fs.mkdirSync(path.join(extracted, "mid", "a"), { recursive: true });

  const keys = ["a/one", "a/two", "a/three", "a/four"];
  const lines = keys.map(key => `./data/${key}.json`).join("\n") + "\n";
  for (const name of ["no_license_conflict.txt", "deduplicated.txt", "all_valid.txt"]) {
    fs.writeFileSync(path.join(subsets, name), lines, "utf8");
  }

  const listing = path.join(tmp, "listing.txt");
  fs.writeFileSync(listing, keys.map(key => `mid/${key}.mid`).join("\n") + "\n", "utf8");
  for (const key of keys) {
    const target = path.join(extracted, "mid", `${key}.mid`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from([0x4d, 0x54, 0x68, 0x64]));
  }

  const cfg = {
    recordId: 15571083,
    recordUrl: "https://zenodo.org/records/15571083",
    repositoryUrl: "https://github.com/pnlong/PDMX",
    requiredSubsets: ["no_license_conflict.txt", "deduplicated.txt", "all_valid.txt"],
    defaultSelectionCount: 3,
    licenseId: "PDMX-PUBLIC-DOMAIN-NO-LICENSE-CONFLICT",
    rightsEvidence: ["https://zenodo.org/records/15571083"]
  };

  const plan = buildPlan(subsets, listing, cfg, 3);
  assert.equal(plan.totals.eligibleIntersection, 4);
  assert.equal(plan.totals.selected, 3);
  const report = materialize(plan, extracted, output, cfg);
  assert.equal(report.totals.selected, 3);
  assert.equal(fs.readdirSync(output).filter(x => x.endsWith(".mid")).length, 3);
  assert.equal(fs.readdirSync(output).filter(x => x.endsWith(".provenance.json")).length, 3);
  console.log("SAFE SUBSET INTERSECTION + MATERIALIZE: OK");

  const dispositions = plan.selected.map((item, index) => ({
    itemId: `item-${index}`,
    provenance: { sourceId: item.sourceId }
  }));
  const curation = { dispositions };
  const queue = {
    items: [
      {
        itemId: "item-0",
        relationalSignals: [],
        reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP", detail: "rhythm-x" }]
      },
      {
        itemId: "item-1",
        relationalSignals: [],
        reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP", detail: "rhythm-x" }]
      },
      {
        itemId: "item-2",
        relationalSignals: [],
        reviewSignals: [{ code: "QUALITY_REVIEW", detail: "range pitched ampio: 72 semitoni" }]
      }
    ]
  };
  const resolved = buildResolution(curation, queue);
  const actions = Object.fromEntries(resolved.decisionsFile.decisions.map(x => [x.itemId, x.action]));
  assert.equal(["item-0", "item-1"].filter(id => actions[id] === "accept").length, 1);
  assert.equal(actions["item-2"], "reject");
  console.log("SOURCE REVIEW DEDUP + QUALITY REJECT: OK");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("PDMX EXPANSION SMOKE TEST: OK");
