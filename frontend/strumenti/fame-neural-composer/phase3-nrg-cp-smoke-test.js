"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const registryTool = require("./dataset/source-registry");
const downloader = require("./dataset/download-green-sources");
const { provisionalProvenance, classifyImportedItem } = require("./dataset/select-nrg-cp");
const { buildResolution } = require("./dataset/review-nrg-cp");
const { computeMaxSourcePhrases, selectSlice } = require("./dataset/select-nrg-phrase-slice");
const { isSafeHighRepetition } = require("./dataset/phrase-review");
const nrgRunner = require("./dataset/run-nrg-cp-expansion-v2");

console.log("FASE 3 / NRG-CP V2 PREFLIGHT");

const registryPath = path.join(__dirname, "dataset", "source-registry.json");
const adapterPath = path.join(__dirname, "dataset", "nrg-cp-source.json");
const { registry } = registryTool.loadRegistry(registryPath);
const adapter = JSON.parse(fs.readFileSync(adapterPath, "utf8"));
const resolved = registryTool.resolveAdapterConfig(registry, adapter);

assert.equal(resolved.registryId, "waivops-nrg-cp");
assert.equal(resolved.licenseId, "CC-BY-4.0");
assert.equal(resolved.md5, "7443fe30674ef149aa4c23580044f597");
assert.equal(resolved.maxPhraseShare, 0.62);
assert.equal(resolved.downloadMirrors.length, 2);
nrgRunner.validateResolvedConfig(resolved);

const prov = provisionalProvenance(resolved, "x.mid", 1);
assert.equal(prov.creator, resolved.creator);
assert.equal(prov.licenseId, "CC-BY-4.0");
assert.equal(prov.sourceUri, resolved.downloadUrl);
console.log("RESOLVED CONFIG -> SELECTOR CONTRACT: OK");

assert.equal(downloader.assetUrls(
  registry.sources.find(x => x.id === "waivops-nrg-cp").download.assets[0]
).length, 3);
assert.equal(downloader.isRetryableStatus(504), true);
assert.equal(downloader.isRetryableStatus(429), true);
assert.equal(downloader.isRetryableStatus(404), false);

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-nrg-download-test-"));
  try {
    const payload = Buffer.from("fame-neural-mirror-ok");
    const hash = crypto.createHash("md5").update(payload).digest("hex");
    const target = path.join(tmp, "asset.bin");
    const asset = {
      id: "test",
      url: "https://primary.invalid/file",
      mirrors: ["https://mirror.invalid/file"],
      hash: { algorithm: "md5", value: hash }
    };

    const calls = [];
    const fakeFetch = async url => {
      calls.push(url);
      if (url.includes("primary")) return new Response("gateway", { status: 504 });
      return new Response(payload, { status: 200 });
    };

    const result = await downloader.downloadVerifiedAsset(asset, target, {
      rounds: 1,
      timeoutMs: 5000,
      fetchImpl: fakeFetch,
      sleepImpl: async () => {}
    });

    assert.equal(result.status, "downloaded-valid");
    assert.equal(result.usedUrl, asset.mirrors[0]);
    assert.deepEqual(calls, [asset.url, asset.mirrors[0]]);
    assert.equal(await downloader.verifyAsset(target, asset), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log("504 -> MIRROR -> HASH VALID: OK");

  const runnerText = fs.readFileSync(path.join(__dirname, "dataset", "run-nrg-cp-expansion-v2.js"), "utf8");
  assert.ok(runnerText.indexOf("[2/10] PREFLIGHT download robusto") < runnerText.indexOf("[5/10] Baseline PDMX"));
  assert.match(runnerText, /resolvedConfigPath,\s*selectionReport/);
  assert.doesNotMatch(runnerText, /p\.selector[\s\S]{0,200}p\.nrgAdapter[\s\S]{0,200}selectionReport/);
  console.log("DOWNLOAD/SELECTOR BEFORE BASELINE + RESOLVED CONFIG WIRING: OK");

  function imported(events, technical = true, commercial = true) {
    return {
      eligibility: { technical, commercialTraining: commercial },
      import: { errors: [], warnings: [] },
      canonical: {
        schema: "fame-neural-sequence-v1",
        timing: { ppq: 960, bpm: 120, bars: 8 },
        events
      },
      canonicalSegments: []
    };
  }

  const harmony = Array.from({ length: 12 }, (_, i) => ({
    type: "harmony", tick: i * 480, durationTicks: 480, note: 60 + (i % 4)
  }));
  assert.equal(classifyImportedItem(imported(harmony), 8).accepted, true);

  const curation = {
    dispositions: [
      { itemId: "a", provenance: { sourceId: "waivops-nrg-cp:v1:a" } },
      { itemId: "b", provenance: { sourceId: "waivops-nrg-cp:v1:b" } }
    ]
  };
  const queue = {
    items: [
      { itemId: "a", relationalSignals: [], reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP", detail: "same" }] },
      { itemId: "b", relationalSignals: [], reviewSignals: [{ code: "RHYTHM_REVIEW_GROUP", detail: "same" }] }
    ]
  };
  const resolution = buildResolution(curation, queue);
  assert.equal(resolution.report.totals.acceptedKeepers, 2);

  const safe = { item: { provenance: { sourceId: "waivops-nrg-cp:v1:test" } } };
  assert.equal(isSafeHighRepetition(safe, { codes: ["HIGH_BAR_REPETITION"] }), true);

  assert.equal(computeMaxSourcePhrases(192, 0.62), 313);
  console.log("CURATION + HIGH REPETITION + 62% CAP: OK");

  const baselineTmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-nrg-baseline-"));
  try {
    const reviewed = path.join(baselineTmp, "global-reviewed-phrase-items");
    fs.mkdirSync(reviewed);
    for (let i = 0; i < 192; i += 1) {
      fs.writeFileSync(path.join(reviewed, `${i}.phrase-item.json`), "{}");
    }
    fs.writeFileSync(path.join(baselineTmp, "global-inventory.json"), JSON.stringify({
      totals: { phrases: 192, compositionFamilies: 54, sourceCollections: 4 },
      roleCoverage: { drums: 114, "808": 61, harmony: 134, lead: 48, pitchedAny: 134 }
    }));
    fs.writeFileSync(path.join(baselineTmp, "global-audit.json"), JSON.stringify({
      block5Ready: true, corpusClean: true, reviewComplete: true
    }));
    fs.writeFileSync(path.join(baselineTmp, "global-gate1-report.json"), "{}");

    assert.equal(nrgRunner.validateBaselineCache(baselineTmp).valid, true);

    const changed = JSON.parse(fs.readFileSync(path.join(baselineTmp, "global-inventory.json"), "utf8"));
    changed.totals.phrases = 193;
    fs.writeFileSync(path.join(baselineTmp, "global-inventory.json"), JSON.stringify(changed));
    assert.equal(nrgRunner.validateBaselineCache(baselineTmp).valid, false);
  } finally {
    fs.rmSync(baselineTmp, { recursive: true, force: true });
  }
  console.log("BASELINE CACHE EXACTNESS: OK");

  console.log("NRG-CP V2 PREFLIGHT SMOKE TEST: OK");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
