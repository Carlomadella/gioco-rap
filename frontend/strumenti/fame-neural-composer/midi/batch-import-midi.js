"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { importMidiFile } = require("./import-midi");

function isMidiFile(name) {
  return /\.(mid|midi)$/i.test(name);
}

function sidecarCandidates(midiPath) {
  const ext = path.extname(midiPath);
  const stem = midiPath.slice(0, -ext.length);
  return [
    `${stem}.provenance.json`,
    `${midiPath}.provenance.json`
  ];
}

function findSidecar(midiPath) {
  return sidecarCandidates(midiPath).find(candidate => fs.existsSync(candidate)) || null;
}

function importMidiDirectory(inputDir, outputDir, options = {}) {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs.readdirSync(inputDir)
    .filter(isMidiFile)
    .sort((a, b) => a.localeCompare(b));

  const report = {
    schema: "fame-neural-batch-import-report-v1",
    inputDir: path.resolve(inputDir),
    outputDir: path.resolve(outputDir),
    totals: { discovered: files.length, imported: 0, technicalBlocked: 0, rightsBlocked: 0, missingProvenance: 0, failed: 0 },
    items: []
  };

  for (const file of files) {
    const midiPath = path.join(inputDir, file);
    const sidecar = findSidecar(midiPath);
    if (!sidecar) {
      report.totals.missingProvenance += 1;
      report.items.push({ file, status: "missing-provenance", sidecar: null });
      continue;
    }

    try {
      const provenance = JSON.parse(fs.readFileSync(sidecar, "utf8"));
      const item = importMidiFile(midiPath, provenance, options);
      const outName = `${path.basename(file, path.extname(file))}.dataset-item.json`;
      const outPath = path.join(outputDir, outName);
      fs.writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`, "utf8");

      let status = "imported";
      if (!item.eligibility.technical) {
        status = "technical-blocked";
        report.totals.technicalBlocked += 1;
      } else if (!item.eligibility.commercialTraining) {
        status = "rights-blocked";
        report.totals.rightsBlocked += 1;
      } else {
        report.totals.imported += 1;
      }
      report.items.push({ file, status, sidecar: path.basename(sidecar), output: outName, itemId: item.itemId });
    } catch (error) {
      report.totals.failed += 1;
      report.items.push({ file, status: "failed", error: `${error.name || "Error"}: ${error.message}` });
    }
  }

  return report;
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, outputDir, reportPath, optionsPath] = argv;
  if (!inputDir || !outputDir || !reportPath) {
    console.error("Uso: node batch-import-midi.js <input-dir> <output-dir> <report.json> [import-options.json]");
    process.exitCode = 64;
    return;
  }
  try {
    const options = optionsPath ? JSON.parse(fs.readFileSync(optionsPath, "utf8")) : {};
    const report = importMidiDirectory(inputDir, outputDir, options);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`MIDI trovati: ${report.totals.discovered}`);
    console.log(`Cleared: ${report.totals.imported}`);
    console.log(`Technical blocked: ${report.totals.technicalBlocked}`);
    console.log(`Rights blocked: ${report.totals.rightsBlocked}`);
    console.log(`Missing provenance: ${report.totals.missingProvenance}`);
    console.log(`Failed: ${report.totals.failed}`);
    console.log(`Report: ${reportPath}`);
    if (report.totals.failed || report.totals.technicalBlocked) process.exitCode = 2;
    else if (report.totals.rightsBlocked || report.totals.missingProvenance) process.exitCode = 3;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  isMidiFile,
  sidecarCandidates,
  findSidecar,
  importMidiDirectory,
  main
};
