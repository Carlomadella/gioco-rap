"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { importMidiFile } = require("../midi/import-midi");
const { classifyImportedItem } = require("./filter-pdmx-compatible");

const REPORT_SCHEMA = "fame-neural-pdmx-incremental-compatibility-v1";

function phraseFiles(dir) {
  return fs.readdirSync(dir)
    .filter(name => /\.phrase-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function baselineSourceIds(reviewedDir) {
  const ids = new Set();
  for (const name of phraseFiles(reviewedDir)) {
    const item = JSON.parse(fs.readFileSync(path.join(reviewedDir, name), "utf8"));
    const sourceId = String(item && item.provenance && item.provenance.sourceId || "");
    if (sourceId) ids.add(sourceId);
  }
  return ids;
}

function findSidecar(midiPath) {
  const ext = path.extname(midiPath);
  const stem = midiPath.slice(0, -ext.length);
  return [`${stem}.provenance.json`, `${midiPath}.provenance.json`]
    .find(file => fs.existsSync(file)) || null;
}

function copyPair(midiPath, sidecarPath, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(midiPath, path.join(outputDir, path.basename(midiPath)));
  fs.copyFileSync(sidecarPath, path.join(outputDir, path.basename(sidecarPath)));
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function filterIncremental(inputDir, baselineReviewedDir, outputDir, targetCount = 160, minPitchedEvents = 4) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (/\.(mid|midi|provenance\.json)$/i.test(name)) fs.unlinkSync(path.join(outputDir, name));
  }

  const baselineIds = baselineSourceIds(baselineReviewedDir);
  const files = fs.readdirSync(inputDir)
    .filter(name => /\.(mid|midi)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    targetCount,
    minPitchedEvents,
    totals: {
      discovered: files.length,
      baselineSourceIds: baselineIds.size,
      baselineExcluded: 0,
      importedChecked: 0,
      compatibleNew: 0,
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
    if (report.totals.selected >= targetCount) break;

    const midiPath = path.join(inputDir, file);
    const sidecar = findSidecar(midiPath);
    if (!sidecar) {
      report.totals.failed += 1;
      report.items.push({ file, status: "failed", reason: "missing-provenance" });
      continue;
    }

    try {
      const provenance = JSON.parse(fs.readFileSync(sidecar, "utf8"));
      const sourceId = String(provenance.sourceId || "");
      if (!sourceId.startsWith("pdmx-v2025:")) {
        report.totals.failed += 1;
        report.items.push({ file, status: "failed", reason: `unexpected-source:${sourceId}` });
        continue;
      }

      if (baselineIds.has(sourceId)) {
        report.totals.baselineExcluded += 1;
        report.items.push({ file, sourceId, status: "excluded-baseline" });
        continue;
      }

      report.totals.importedChecked += 1;
      const imported = importMidiFile(midiPath, provenance, {});
      const verdict = classifyImportedItem(imported, minPitchedEvents);

      for (const code of verdict.errors || []) increment(report.technicalErrorCodes, code);
      for (const code of verdict.warnings || []) increment(report.warningCodes, code);

      if (!verdict.compatible) {
        if (verdict.reason === "technical-blocked") report.totals.technicalBlocked += 1;
        else if (verdict.reason === "rights-blocked") report.totals.rightsBlocked += 1;
        else if (String(verdict.reason).startsWith("insufficient-pitched:")) report.totals.insufficientPitched += 1;

        report.items.push({
          file, sourceId, status: "rejected", reason: verdict.reason,
          roles: verdict.roles, errors: verdict.errors
        });
        continue;
      }

      report.totals.compatibleNew += 1;
      copyPair(midiPath, sidecar, outputDir);
      report.totals.selected += 1;
      report.items.push({
        file, sourceId, status: "selected", reason: verdict.reason, roles: verdict.roles
      });
    } catch (error) {
      report.totals.failed += 1;
      report.items.push({
        file, status: "failed", reason: `${error.name || "Error"}: ${error.message}`
      });
    }
  }

  return report;
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, baselineReviewedDir, outputDir, reportPath, targetRaw, minRaw] = argv;
  if (!inputDir || !baselineReviewedDir || !outputDir || !reportPath) {
    console.error("Uso: node filter-pdmx-incremental-compatible.js <candidate-dir> <baseline-reviewed> <output-dir> <report.json> [target=160] [minPitched=4]");
    process.exitCode = 64;
    return;
  }

  try {
    const report = filterIncremental(
      inputDir,
      baselineReviewedDir,
      outputDir,
      Math.max(1, Number(targetRaw) || 160),
      Math.max(1, Number(minRaw) || 4)
    );
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(`PDMX candidate discovered: ${report.totals.discovered}`);
    console.log(`Baseline source IDs: ${report.totals.baselineSourceIds}`);
    console.log(`PDMX gia' nel baseline esclusi: ${report.totals.baselineExcluded}`);
    console.log(`PDMX nuovi compatibili selezionati: ${report.totals.selected}/${report.targetCount}`);
    console.log(`Technical blocked: ${report.totals.technicalBlocked}`);
    console.log(`Insufficient pitched: ${report.totals.insufficientPitched}`);
    console.log(`Failed: ${report.totals.failed}`);
    console.log(`Report: ${reportPath}`);

    if (report.totals.selected < report.targetCount) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  phraseFiles,
  baselineSourceIds,
  findSidecar,
  filterIncremental,
  main
};
