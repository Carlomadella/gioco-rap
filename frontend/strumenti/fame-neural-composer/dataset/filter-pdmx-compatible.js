"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { importMidiFile } = require("../midi/import-midi");

const REPORT_SCHEMA = "fame-neural-pdmx-compatibility-report-v1";

function isMidiFile(name) {
  return /\.(mid|midi)$/i.test(name);
}

function findSidecar(midiPath) {
  const ext = path.extname(midiPath);
  const stem = midiPath.slice(0, -ext.length);
  const candidates = [`${stem}.provenance.json`, `${midiPath}.provenance.json`];
  return candidates.find(file => fs.existsSync(file)) || null;
}

function canonicalSequences(item) {
  const out = [];
  if (item && item.canonical) out.push(item.canonical);
  for (const segment of item && item.canonicalSegments || []) {
    if (segment && segment.canonical) out.push(segment.canonical);
  }
  return out;
}

function roleCounts(item) {
  const counts = { drums: 0, "808": 0, harmony: 0, lead: 0, pitchedAny: 0, total: 0 };
  for (const sequence of canonicalSequences(item)) {
    for (const event of sequence && sequence.events || []) {
      const type = String(event && event.type || "");
      counts.total += 1;
      if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type] += 1;
      if (["808", "harmony", "lead"].includes(type)) counts.pitchedAny += 1;
    }
  }
  return counts;
}

function classifyImportedItem(item, minPitchedEvents = 4) {
  const roles = roleCounts(item);
  const errors = (item && item.import && item.import.errors || []).map(error => String(error && error.code || "UNKNOWN"));
  const warnings = (item && item.import && item.import.warnings || []).map(warning => String(warning && warning.code || "UNKNOWN"));

  if (!(item && item.eligibility && item.eligibility.technical === true)) {
    return { compatible: false, reason: "technical-blocked", roles, errors, warnings };
  }
  if (!(item && item.eligibility && item.eligibility.commercialTraining === true)) {
    return { compatible: false, reason: "rights-blocked", roles, errors, warnings };
  }
  if (roles.pitchedAny < minPitchedEvents) {
    return { compatible: false, reason: `insufficient-pitched:${roles.pitchedAny}<${minPitchedEvents}`, roles, errors, warnings };
  }
  return { compatible: true, reason: "compatible-pitched", roles, errors, warnings };
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function copyPair(midiPath, sidecarPath, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(midiPath, path.join(outputDir, path.basename(midiPath)));
  fs.copyFileSync(sidecarPath, path.join(outputDir, path.basename(sidecarPath)));
}

function filterCompatible(inputDir, outputDir, targetCount = 48, minPitchedEvents = 4) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (/\.(mid|midi|provenance\.json)$/i.test(name)) fs.unlinkSync(path.join(outputDir, name));
  }

  const files = fs.readdirSync(inputDir).filter(isMidiFile).sort((a, b) => a.localeCompare(b));
  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    targetCount,
    minPitchedEvents,
    totals: {
      discovered: files.length,
      compatible: 0,
      selected: 0,
      technicalBlocked: 0,
      rightsBlocked: 0,
      insufficientPitched: 0,
      failed: 0
    },
    technicalErrorCodes: {},
    warningCodes: {},
    items: []
  };

  for (const file of files) {
    const midiPath = path.join(inputDir, file);
    const sidecar = findSidecar(midiPath);
    if (!sidecar) {
      report.totals.failed += 1;
      report.items.push({ file, status: "failed", reason: "missing-provenance" });
      continue;
    }

    try {
      const provenance = JSON.parse(fs.readFileSync(sidecar, "utf8"));
      const item = importMidiFile(midiPath, provenance, {});
      const verdict = classifyImportedItem(item, minPitchedEvents);

      for (const code of verdict.errors) increment(report.technicalErrorCodes, code);
      for (const code of verdict.warnings) increment(report.warningCodes, code);

      if (!verdict.compatible) {
        if (verdict.reason === "technical-blocked") report.totals.technicalBlocked += 1;
        else if (verdict.reason === "rights-blocked") report.totals.rightsBlocked += 1;
        else if (verdict.reason.startsWith("insufficient-pitched:")) report.totals.insufficientPitched += 1;

        report.items.push({
          file,
          status: "rejected",
          reason: verdict.reason,
          roles: verdict.roles,
          errors: verdict.errors
        });
        continue;
      }

      report.totals.compatible += 1;
      let status = "compatible-not-selected";
      if (report.totals.selected < targetCount) {
        copyPair(midiPath, sidecar, outputDir);
        report.totals.selected += 1;
        status = "selected";
      }

      report.items.push({
        file,
        status,
        reason: verdict.reason,
        roles: verdict.roles
      });
    } catch (error) {
      report.totals.failed += 1;
      report.items.push({
        file,
        status: "failed",
        reason: `${error.name || "Error"}: ${error.message}`
      });
    }
  }

  return report;
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, outputDir, reportPath, targetRaw, minPitchedRaw] = argv;
  if (!inputDir || !outputDir || !reportPath) {
    console.error("Uso: node filter-pdmx-compatible.js <candidate-source-dir> <compatible-source-dir> <report.json> [target=48] [minPitchedEvents=4]");
    process.exitCode = 64;
    return;
  }

  try {
    const target = Math.max(1, Number(targetRaw) || 48);
    const minPitched = Math.max(1, Number(minPitchedRaw) || 4);
    const report = filterCompatible(inputDir, outputDir, target, minPitched);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(`PDMX candidate tecniche: ${report.totals.discovered}`);
    console.log(`Compatibili pitched: ${report.totals.compatible}`);
    console.log(`Selezionate: ${report.totals.selected}`);
    console.log(`Technical blocked: ${report.totals.technicalBlocked}`);
    console.log(`Insufficient pitched: ${report.totals.insufficientPitched}`);
    console.log(`Failed: ${report.totals.failed}`);
    console.log(`Technical error codes: ${JSON.stringify(report.technicalErrorCodes)}`);
    console.log(`Report: ${reportPath}`);

    if (report.totals.selected < target) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  isMidiFile,
  findSidecar,
  canonicalSequences,
  roleCounts,
  classifyImportedItem,
  filterCompatible,
  main
};
