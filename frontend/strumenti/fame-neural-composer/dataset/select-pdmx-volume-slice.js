"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const REPORT_SCHEMA = "fame-neural-pdmx-volume-slice-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listPhraseFiles(dir) {
  return fs.readdirSync(dir)
    .filter(name => /\.phrase-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function sourceCollection(item) {
  return String(item && item.provenance && item.provenance.sourceId || "").split(":")[0] || "unknown";
}

function buildRegistryCollections(registry) {
  const map = new Map();
  for (const source of registry && registry.sources || []) {
    map.set(source.id, source);
  }
  return map;
}

function isSyntheticSource(source) {
  if (!source) return false;
  const origin = String(source.originClass || "");
  return source.stratum === "adf_synthetic"
    || origin === "external_synthetic"
    || origin === "external_rule_generator"
    || origin === "adf_synthetic";
}

function scanCorpus(dir, registry) {
  const collections = new Map();
  const families = new Map();
  let total = 0;
  let synthetic = 0;

  for (const name of listPhraseFiles(dir)) {
    const item = readJson(path.join(dir, name));
    const collection = sourceCollection(item);
    const family = String(item && item.provenance && item.provenance.compositionFamily || item.phraseId || name);
    total += 1;
    collections.set(collection, (collections.get(collection) || 0) + 1);
    families.set(family, (families.get(family) || 0) + 1);

    const source = registry.get(collection);
    if (isSyntheticSource(source)) synthetic += 1;
  }

  return { total, synthetic, collections, families };
}

function maxAdditionalForSourceShare(baseTotal, baseSourceCount, maxShare) {
  const s = Number(maxShare);
  if (!(s > 0 && s < 1)) throw new Error(`maxShare non valido: ${maxShare}`);
  const numerator = s * Number(baseTotal) - Number(baseSourceCount);
  if (numerator <= 0) return 0;
  return Math.max(0, Math.floor(numerator / (1 - s)));
}

function requiredTotalForSyntheticShare(syntheticCount, advisoryMaxShare) {
  const share = Number(advisoryMaxShare);
  if (!(share > 0 && share < 1)) throw new Error(`synthetic advisory non valido: ${advisoryMaxShare}`);
  return Math.ceil(Number(syntheticCount) / share);
}

function deterministicRank(item) {
  const family = String(item && item.provenance && item.provenance.compositionFamily || "");
  const id = String(item && item.phraseId || "");
  return crypto.createHash("sha256").update(`pdmx-volume-v1:${family}:${id}`).digest("hex");
}

function roundRobinByFamily(entries, limit) {
  const byFamily = new Map();
  for (const entry of entries) {
    const family = String(entry.item && entry.item.provenance && entry.item.provenance.compositionFamily || entry.item.phraseId);
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(entry);
  }

  for (const rows of byFamily.values()) {
    rows.sort((a, b) => deterministicRank(a.item).localeCompare(deterministicRank(b.item)));
  }

  const familyKeys = [...byFamily.keys()].sort((a, b) =>
    crypto.createHash("sha256").update(`family:${a}`).digest("hex")
      .localeCompare(crypto.createHash("sha256").update(`family:${b}`).digest("hex"))
  );

  const selected = [];
  let round = 0;
  while (selected.length < limit) {
    let added = false;
    for (const family of familyKeys) {
      const rows = byFamily.get(family);
      if (round < rows.length) {
        selected.push(rows[round]);
        added = true;
        if (selected.length >= limit) break;
      }
    }
    if (!added) break;
    round += 1;
  }
  return selected;
}

function selectSlice(baselineDir, candidateDir, registryPath, configPath, outputDir, reportPath, attemptIndex = 0) {
  const registryJson = readJson(registryPath);
  const registry = buildRegistryCollections(registryJson);
  const config = readJson(configPath);

  const baseline = scanCorpus(baselineDir, registry);
  const basePdmx = baseline.collections.get("pdmx-v2025") || 0;
  const gateTarget = Number(config.targetMinPhrases);
  const syntheticAdvisoryTarget = requiredTotalForSyntheticShare(
    baseline.synthetic,
    config.syntheticAdvisoryMaxShare
  );
  const neededForGate = Math.max(0, gateTarget - baseline.total);
  const maxPdmxAdd = maxAdditionalForSourceShare(
    baseline.total,
    basePdmx,
    config.maxPdmxPreReviewShare
  );
  const sliceTargets = Array.isArray(config.sliceTargets)
    ? config.sliceTargets.map(Number).filter(value => Number.isInteger(value) && value > 0)
    : [];
  if (!sliceTargets.length) throw new Error("sliceTargets mancante/vuoto.");

  const candidates = listPhraseFiles(candidateDir).map(name => {
    const item = readJson(path.join(candidateDir, name));
    if (sourceCollection(item) !== "pdmx-v2025") {
      throw new Error(`Candidate phrase non PDMX: ${name}`);
    }
    return { name, item };
  });

  const index = Math.max(0, Math.min(sliceTargets.length - 1, Number(attemptIndex) || 0));
  const configuredTarget = sliceTargets[index];
  const target = Math.min(candidates.length, maxPdmxAdd, configuredTarget);

  if (target < neededForGate) {
    throw new Error(`Slice PDMX insufficiente gia' pre-review: target=${target}, neededForGate=${neededForGate}`);
  }
  if (target < 1) {
    throw new Error(`Slice PDMX vuota: maxAdd=${maxPdmxAdd}, candidates=${candidates.length}`);
  }

  const selected = roundRobinByFamily(candidates, target);

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  for (const entry of selected) {
    fs.copyFileSync(path.join(candidateDir, entry.name), path.join(outputDir, entry.name));
  }

  const projectedTotal = baseline.total + selected.length;
  const projectedPdmx = basePdmx + selected.length;
  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    attemptIndex: Number(attemptIndex),
    baseline: {
      total: baseline.total,
      synthetic: baseline.synthetic,
      syntheticShare: baseline.total ? baseline.synthetic / baseline.total : 0,
      pdmx: basePdmx,
      pdmxShare: baseline.total ? basePdmx / baseline.total : 0,
      collections: Object.fromEntries([...baseline.collections.entries()].sort())
    },
    policy: {
      targetMinPhrases: Number(config.targetMinPhrases),
      syntheticAdvisoryMaxShare: Number(config.syntheticAdvisoryMaxShare),
      maxPdmxPreReviewShare: Number(config.maxPdmxPreReviewShare),
      sliceTargets
    },
    targets: {
      gateTarget,
      syntheticAdvisoryTarget,
      neededForGate,
      maxPdmxAdd,
      configuredTarget,
      requestedThisAttempt: target
    },
    totals: {
      candidatePhrases: candidates.length,
      selected: selected.length,
      projectedTotal,
      projectedPdmx,
      projectedPdmxShare: projectedPdmx / projectedTotal,
      projectedSyntheticShare: baseline.synthetic / projectedTotal
    },
    selected: selected.map(entry => ({
      file: entry.name,
      phraseId: entry.item.phraseId,
      compositionFamily: entry.item.provenance && entry.item.provenance.compositionFamily || null
    }))
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

function main(argv = process.argv.slice(2)) {
  const [baselineDir, candidateDir, registryPath, configPath, outputDir, reportPath, attemptRaw] = argv;
  if (!baselineDir || !candidateDir || !registryPath || !configPath || !outputDir || !reportPath) {
    console.error("Uso: node select-pdmx-volume-slice.js <baseline-reviewed> <candidate-phrases> <registry.json> <config.json> <output-dir> <report.json> [attempt=0]");
    process.exitCode = 64;
    return;
  }

  try {
    const report = selectSlice(
      baselineDir, candidateDir, registryPath, configPath, outputDir, reportPath,
      Math.max(0, Number(attemptRaw) || 0)
    );
    console.log(`Baseline phrase/synthetic/PDMX: ${report.baseline.total}/${report.baseline.synthetic}/${report.baseline.pdmx}`);
    console.log(`Gate target: ${report.targets.gateTarget}`);
    console.log(`Synthetic advisory target (informativo, non Gate blocker): ${report.targets.syntheticAdvisoryTarget}`);
    console.log(`PDMX max aggiungibili pre-review @${(report.policy.maxPdmxPreReviewShare * 100).toFixed(1)}%: ${report.targets.maxPdmxAdd}`);
    console.log(`PDMX phrase selezionate: ${report.totals.selected}`);
    console.log(`Projected total: ${report.totals.projectedTotal}`);
    console.log(`Projected synthetic share: ${(report.totals.projectedSyntheticShare * 100).toFixed(2)}%`);
    console.log(`Projected PDMX share: ${(report.totals.projectedPdmxShare * 100).toFixed(2)}%`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  sourceCollection,
  buildRegistryCollections,
  isSyntheticSource,
  scanCorpus,
  maxAdditionalForSourceShare,
  requiredTotalForSyntheticShare,
  deterministicRank,
  roundRobinByFamily,
  selectSlice,
  main
};
