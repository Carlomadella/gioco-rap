"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const increment = require("./dataset/filter-pdmx-incremental-compatible");
const slicer = require("./dataset/select-pdmx-volume-slice");
const runner = require("./dataset/run-pdmx-volume-closer-v1");

console.log("FASE 3 / PDMX VOLUME CLOSER V1");

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "dataset", "pdmx-volume-closer.json"), "utf8"));
assert.equal(config.baseline.phrases, 370);
assert.equal(config.baseline.roleCoverage.drums, 161);
assert.equal(config.baseline.roleCoverage["808"], 82);
assert.equal(config.baseline.roleCoverage.lead, 76);
assert.equal(config.targetMinPhrases, 500);
assert.equal(config.syntheticAdvisoryMaxShare, 0.40);
assert.equal(config.maxPdmxPreReviewShare, 0.60);
assert.deepEqual(config.sliceTargets, [300, 320]);
console.log("BASELINE + POLICY CONTRACT: OK");

const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "dataset", "source-registry.json"), "utf8"));
const pdmx = registry.sources.find(x => x.id === "pdmx-v2025");
assert.equal(pdmx.status, "green");
assert.equal(pdmx.rights.commercialTrainingAllowed, true);
assert.equal(pdmx.rights.commercialOutputAllowed, true);
assert.equal(pdmx.download.assets.find(x => x.id === "midi").mirrors.length, 2);
assert.equal(pdmx.download.assets.find(x => x.id === "subset-paths").mirrors.length, 2);
console.log("PDMX GREEN RIGHTS + MIRRORS: OK");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-pdmx-volume-smoke-"));
try {
  const baseline = path.join(tmp, "baseline");
  const candidates = path.join(tmp, "candidate-phrases");
  fs.mkdirSync(baseline);
  fs.mkdirSync(candidates);

  const counts = [
    ["fame-original-seed-v1", 48],
    ["gmd-v1.0.0", 58],
    ["pdmx-v2025", 84],
    ["free-midi-chords", 2],
    ["waivops-nrg-cp", 130],
    ["hiphopdrummer", 48]
  ];

  let index = 0;
  for (const [collection, count] of counts) {
    for (let i = 0; i < count; i += 1) {
      const item = {
        phraseId: `${collection}:${i}`,
        provenance: {
          sourceId: `${collection}:source-${Math.floor(i / 2)}`,
          compositionFamily: `${collection}:family-${Math.floor(i / 2)}`
        }
      };
      fs.writeFileSync(
        path.join(baseline, `${String(index++).padStart(4, "0")}.phrase-item.json`),
        JSON.stringify(item)
      );
    }
  }
  assert.equal(index, 370);

  for (let i = 0; i < 400; i += 1) {
    const item = {
      phraseId: `new-pdmx:${i}`,
      provenance: {
        sourceId: `pdmx-v2025:new-${Math.floor(i / 2)}`,
        compositionFamily: `pdmx:new-family-${Math.floor(i / 2)}`
      }
    };
    fs.writeFileSync(
      path.join(candidates, `${String(i).padStart(4, "0")}.phrase-item.json`),
      JSON.stringify(item)
    );
  }

  const registryMap = slicer.buildRegistryCollections(registry);
  const baseStats = slicer.scanCorpus(baseline, registryMap);
  assert.equal(baseStats.total, 370);
  assert.equal(baseStats.synthetic, 226);
  assert.equal(baseStats.collections.get("pdmx-v2025"), 84);
  assert.equal(slicer.requiredTotalForSyntheticShare(226, 0.40), 565);
  assert.equal(slicer.maxAdditionalForSourceShare(370, 84, 0.60), 345);

  const sliceOut = path.join(tmp, "slice");
  const sliceReport = path.join(tmp, "slice.json");
  const report = slicer.selectSlice(
    baseline,
    candidates,
    path.join(__dirname, "dataset", "source-registry.json"),
    path.join(__dirname, "dataset", "pdmx-volume-closer.json"),
    sliceOut,
    sliceReport,
    0
  );
  assert.equal(report.targets.gateTarget, 500);
  assert.equal(report.targets.syntheticAdvisoryTarget, 565);
  assert.equal(report.targets.neededForGate, 130);
  assert.equal(report.totals.selected, 300);
  assert.ok(report.totals.projectedPdmxShare < 0.60);

  const report2 = slicer.selectSlice(
    baseline,
    candidates,
    path.join(__dirname, "dataset", "source-registry.json"),
    path.join(__dirname, "dataset", "pdmx-volume-closer.json"),
    path.join(tmp, "slice2"),
    path.join(tmp, "slice2.json"),
    1
  );
  assert.equal(report2.totals.selected, 320);
  console.log("370 BASELINE -> GATE 500 + ADVISORY 565; REPLAY-VERIFIED 300/320 SLICE: OK");

  const baselineWorkspace = path.join(tmp, "baseline-workspace");
  const reviewed = path.join(baselineWorkspace, "global-reviewed-phrase-items");
  fs.mkdirSync(baselineWorkspace);
  fs.cpSync(baseline, reviewed, { recursive: true });
  fs.writeFileSync(path.join(baselineWorkspace, "global-inventory.json"), JSON.stringify({
    totals: { phrases: 370, compositionFamilies: 233, sourceCollections: 6 },
    roleCoverage: { drums: 161, "808": 82, harmony: 264, lead: 76, pitchedAny: 313 }
  }));
  fs.writeFileSync(path.join(baselineWorkspace, "global-audit.json"), JSON.stringify({
    block5Ready: true, corpusClean: true, reviewComplete: true
  }));
  fs.writeFileSync(path.join(baselineWorkspace, "global-gate1-report.json"), "{}");

  assert.equal(runner.validateBaseline(baselineWorkspace, config.baseline).valid, true);
  const broken = JSON.parse(fs.readFileSync(path.join(baselineWorkspace, "global-inventory.json"), "utf8"));
  broken.totals.phrases = 371;
  fs.writeFileSync(path.join(baselineWorkspace, "global-inventory.json"), JSON.stringify(broken));
  assert.equal(runner.validateBaseline(baselineWorkspace, config.baseline).valid, false);
  console.log("EXACT HHD BASELINE CACHE CONTRACT: OK");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("PDMX VOLUME CLOSER SMOKE TEST: OK");
