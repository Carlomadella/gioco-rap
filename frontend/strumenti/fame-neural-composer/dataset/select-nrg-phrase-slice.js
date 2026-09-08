"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const REPORT_SCHEMA = "fame-neural-nrg-cp-phrase-slice-v1";

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function familyOf(item) {
  return String(item && item.provenance && item.provenance.compositionFamily || "unknown");
}

function rankOf(item) {
  const key = `${familyOf(item)}|${String(item && item.phraseId || "")}`;
  return crypto.createHash("sha256").update(`nrg-slice-v1:${key}`).digest("hex");
}

function readEntries(dir) {
  return fs.readdirSync(dir)
    .filter(isPhraseFile)
    .sort()
    .map(fileName => {
      const filePath = path.join(dir, fileName);
      const item = readJson(filePath);
      return { fileName, filePath, item, family: familyOf(item), rank: rankOf(item) };
    });
}

function roundRobinFamilies(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.family)) groups.set(entry.family, []);
    groups.get(entry.family).push(entry);
  }
  for (const list of groups.values()) list.sort((a, b) => a.rank.localeCompare(b.rank));

  const families = [...groups.keys()].sort((a, b) => {
    const ar = groups.get(a)[0].rank;
    const br = groups.get(b)[0].rank;
    return ar.localeCompare(br) || a.localeCompare(b);
  });

  const out = [];
  let depth = 0;
  while (true) {
    let added = 0;
    for (const family of families) {
      const entry = groups.get(family)[depth];
      if (!entry) continue;
      out.push(entry);
      added += 1;
    }
    if (!added) break;
    depth += 1;
  }
  return out;
}

function computeMaxSourcePhrases(baseCount, maxShare) {
  if (!(baseCount > 0)) throw new Error("baseCount deve essere > 0");
  if (!(maxShare > 0 && maxShare < 1)) throw new Error("maxShare deve essere tra 0 e 1");
  return Math.floor((maxShare * baseCount) / (1 - maxShare));
}

function selectSlice(baseDir, nrgDir, outputDir, maxShare = 0.64, targetMinPhrases = 500) {
  const baseEntries = readEntries(baseDir);
  const nrgEntries = readEntries(nrgDir);
  const maxNrg = computeMaxSourcePhrases(baseEntries.length, maxShare);
  const minNeeded = Math.max(0, targetMinPhrases - baseEntries.length);
  const desired = Math.min(maxNrg, nrgEntries.length);
  const ordered = roundRobinFamilies(nrgEntries);
  const selected = ordered.slice(0, desired);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (isPhraseFile(name)) fs.unlinkSync(path.join(outputDir, name));
  }
  for (const entry of selected) {
    fs.copyFileSync(entry.filePath, path.join(outputDir, entry.fileName));
  }

  const projectedTotal = baseEntries.length + selected.length;
  const projectedShare = projectedTotal ? selected.length / projectedTotal : 0;

  return {
    schema: REPORT_SCHEMA,
    version: 1,
    policy: {
      maxShare,
      targetMinPhrases,
      ordering: "round-robin-composition-family + deterministic sha256 rank"
    },
    totals: {
      basePhrases: baseEntries.length,
      nrgAvailable: nrgEntries.length,
      nrgMaxByShare: maxNrg,
      nrgMinNeededForTarget: minNeeded,
      nrgSelected: selected.length,
      projectedGlobalPhrases: projectedTotal,
      projectedNrgShare: projectedShare,
      compositionFamiliesSelected: new Set(selected.map(x => x.family)).size
    },
    targetReachableBeforeGlobalReview: projectedTotal >= targetMinPhrases
  };
}

function main(argv = process.argv.slice(2)) {
  const [baseDir, nrgDir, outputDir, reportPath, maxShareRaw, targetRaw] = argv;
  if (!baseDir || !nrgDir || !outputDir || !reportPath) {
    console.error("Uso: node select-nrg-phrase-slice.js <base-phrase-dir> <nrg-phrase-dir> <output-dir> <report.json> [maxShare=0.64] [target=500]");
    process.exitCode = 64;
    return;
  }

  try {
    const maxShare = Number(maxShareRaw) || 0.64;
    const target = Number(targetRaw) || 500;
    const report = selectSlice(baseDir, nrgDir, outputDir, maxShare, target);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(`Base phrase: ${report.totals.basePhrases}`);
    console.log(`NRG phrase disponibili: ${report.totals.nrgAvailable}`);
    console.log(`NRG max per share ${(report.policy.maxShare * 100).toFixed(1)}%: ${report.totals.nrgMaxByShare}`);
    console.log(`NRG selezionate: ${report.totals.nrgSelected}`);
    console.log(`Projected global phrase: ${report.totals.projectedGlobalPhrases}`);
    console.log(`Projected NRG share: ${(report.totals.projectedNrgShare * 100).toFixed(2)}%`);
    console.log(`Target 500 pre-review: ${report.targetReachableBeforeGlobalReview ? "YES" : "NO"}`);
    console.log(`Report: ${reportPath}`);

    if (!report.totals.nrgSelected) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  isPhraseFile,
  familyOf,
  rankOf,
  readEntries,
  roundRobinFamilies,
  computeMaxSourcePhrases,
  selectSlice,
  main
};
