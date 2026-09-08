"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const {
  loadRegistry,
  validateRegistry,
  findSource,
  commercialGreenSources,
  defaultCacheRoot
} = require("./dataset/source-registry");
const { selectSources } = require("./dataset/download-green-sources");

console.log("FASE 3 / SOURCE REGISTRY");

const registryPath = path.join(__dirname, "dataset", "source-registry.json");
const { registry, validation } = loadRegistry(registryPath);

assert.equal(validation.valid, true);
assert.ok(validation.totals.green >= 6);
assert.ok(validation.totals.yellow >= 5);
assert.ok(validation.totals.red >= 2);

for (const source of commercialGreenSources(registry)) {
  assert.equal(source.verification.level, "verified");
  assert.equal(source.rights.commercialTrainingAllowed, true);
  assert.equal(source.rights.commercialOutputAllowed, true);
}
console.log("GREEN RIGHTS INVARIANTS: OK");

const yellow = findSource(registry, "harmony-whiz");
assert.equal(yellow.status, "yellow");
assert.equal(yellow.download.autoDownload, false);
assert.equal(yellow.rights.commercialTrainingAllowed, false);

const red = findSource(registry, "maestro");
assert.equal(red.status, "red");
assert.equal(red.rights.commercialTrainingAllowed, false);
console.log("YELLOW/RED QUARANTINE: OK");

const invalid = JSON.parse(JSON.stringify(registry));
invalid.sources.find(x => x.id === "harmony-whiz").download.autoDownload = true;
assert.equal(validateRegistry(invalid).valid, false);
console.log("DOWNLOADER SAFETY VALIDATION: OK");

const selected = selectSources(registry, {
  sourceIds: [],
  allGreen: true
});
assert.ok(selected.some(x => x.id === "gmd-v1.0.0"));
assert.ok(selected.some(x => x.id === "free-midi-chords"));
assert.ok(selected.some(x => x.id === "waivops-nrg-cp"));
assert.ok(!selected.some(x => x.status !== "green"));
assert.ok(!selected.some(x => x.id === "pdmx-v2025")); // explicit/manual due size/filter
console.log("GREEN AUTO-DOWNLOAD SELECTION: OK");

const nrg = findSource(registry, "waivops-nrg-cp");
assert.equal(nrg.status, "green");
assert.equal(nrg.download.assets[0].hash.value, "7443fe30674ef149aa4c23580044f597");
assert.equal(nrg.license.dataset, "CC-BY-4.0");
console.log("NRG REGISTRY METADATA: OK");

const customCache = defaultCacheRoot(
  { FAME_NEURAL_SOURCE_CACHE: path.join(os.tmpdir(), "fame-registry-cache-test") },
  process.platform,
  os.homedir()
);
assert.ok(customCache.includes("fame-registry-cache-test"));
console.log("EXTERNAL CACHE ROOT: OK");

const syntheticPolicy = registry.policy.synthetic;
assert.equal(syntheticPolicy.isGate1Blocker, false);
assert.equal(syntheticPolicy.advisoryMaxTrainingShare, 0.4);
console.log("SYNTHETIC SHARE ADVISORY: OK");

console.log(`SOURCE REGISTRY SMOKE TEST: OK (${validation.totals.sources} sources)`);
