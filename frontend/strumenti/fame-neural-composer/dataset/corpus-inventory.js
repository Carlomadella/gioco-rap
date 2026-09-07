"use strict";

const fs = require("node:fs");
const path = require("node:path");

const INVENTORY_SCHEMA = "fame-neural-corpus-inventory-v1";

const DRUM_TYPES = new Set([
  "kick", "snare", "clap", "hat_closed", "hat_open", "perc", "cymbal", "tom"
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function sourceCollection(sourceId) {
  const value = String(sourceId || "unknown").trim();
  if (!value) return "unknown";
  const colon = value.indexOf(":");
  return colon > 0 ? value.slice(0, colon) : value;
}

function rolePresence(item) {
  const events = item && item.canonical && Array.isArray(item.canonical.events)
    ? item.canonical.events
    : [];
  const types = new Set(events.map(event => String(event && event.type || "unknown")));
  const drums = [...types].some(type => DRUM_TYPES.has(type));
  const bass808 = types.has("808");
  const harmony = types.has("harmony");
  const lead = types.has("lead");
  return {
    drums,
    "808": bass808,
    harmony,
    lead,
    pitchedAny: bass808 || harmony || lead
  };
}

function buildInventory(entries) {
  const phraseIds = new Set();
  const families = new Set();
  const sourceDatasetItems = new Set();
  const sourceCollections = new Map();
  const licenses = new Map();
  const byBars = {};
  const roleCoverage = { drums: 0, "808": 0, harmony: 0, lead: 0, pitchedAny: 0 };
  const rightsBlocked = [];
  const invalid = [];

  for (const entry of entries) {
    const item = entry.item || {};
    if (!item.phraseId || !item.canonical || !item.provenance) {
      invalid.push({ fileName: entry.fileName, reason: "phrase minima non valida per inventory" });
      continue;
    }

    phraseIds.add(item.phraseId);
    if (item.provenance.compositionFamily) families.add(item.provenance.compositionFamily);
    if (item.sourceDatasetItemId) sourceDatasetItems.add(item.sourceDatasetItemId);

    const collection = sourceCollection(item.provenance.sourceId);
    sourceCollections.set(collection, (sourceCollections.get(collection) || 0) + 1);

    const license = String(item.provenance.licenseId || "unknown");
    licenses.set(license, (licenses.get(license) || 0) + 1);

    const bars = String(Number(item.phraseBars) || 0);
    byBars[bars] = (byBars[bars] || 0) + 1;

    const roles = rolePresence(item);
    for (const [role, present] of Object.entries(roles)) {
      if (present) roleCoverage[role] += 1;
    }

    const cleared =
      item.provenance.commercialTrainingAllowed === true &&
      item.rights &&
      item.rights.commercialTrainingAllowed === true;
    if (!cleared) {
      rightsBlocked.push({
        phraseId: item.phraseId,
        fileName: entry.fileName,
        sourceId: item.provenance.sourceId || null,
        licenseId: item.provenance.licenseId || null
      });
    }
  }

  const total = phraseIds.size;
  const sourceCollectionRows = [...sourceCollections.entries()]
    .map(([name, count]) => ({
      name,
      count,
      share: total ? count / total : 0
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const licenseRows = [...licenses.entries()]
    .map(([licenseId, count]) => ({ licenseId, count, share: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count || a.licenseId.localeCompare(b.licenseId));

  return {
    schema: INVENTORY_SCHEMA,
    version: 1,
    totals: {
      entries: entries.length,
      phrases: total,
      compositionFamilies: families.size,
      sourceDatasetItems: sourceDatasetItems.size,
      sourceCollections: sourceCollectionRows.length,
      licenses: licenseRows.length,
      rightsBlocked: rightsBlocked.length,
      invalid: invalid.length
    },
    phraseBars: byBars,
    roleCoverage,
    sourceCollections: sourceCollectionRows,
    licenses: licenseRows,
    rightsBlocked,
    invalid
  };
}

function readPhraseEntries(inputDir) {
  return fs.readdirSync(inputDir)
    .filter(isPhraseFile)
    .sort((a, b) => a.localeCompare(b))
    .map(fileName => ({ fileName, item: readJson(path.join(inputDir, fileName)) }));
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, reportPath] = argv;
  if (!inputDir || !reportPath) {
    console.error("Uso: node corpus-inventory.js <phrase-items-dir> <inventory-report.json>");
    process.exitCode = 64;
    return;
  }
  try {
    const report = buildInventory(readPhraseEntries(inputDir));
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Phrase: ${report.totals.phrases}`);
    console.log(`Composition family: ${report.totals.compositionFamilies}`);
    console.log(`Source collection: ${report.totals.sourceCollections}`);
    console.log(`Role drums/808/harmony/lead: ${report.roleCoverage.drums}/${report.roleCoverage["808"]}/${report.roleCoverage.harmony}/${report.roleCoverage.lead}`);
    console.log(`Rights blocked: ${report.totals.rightsBlocked}`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  INVENTORY_SCHEMA,
  DRUM_TYPES,
  sourceCollection,
  rolePresence,
  buildInventory,
  readPhraseEntries,
  main
};
