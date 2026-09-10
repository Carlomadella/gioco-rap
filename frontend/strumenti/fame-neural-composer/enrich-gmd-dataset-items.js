"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  buildGmdMetadataIndex,
  enrichDatasetItemWithGmdMetadata,
  addMetadataToDistribution,
  emptyDistribution
} = require("./dataset/gmd-metadata");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function enrichDirectory(inputDir, infoCsvPath, outputDir) {
  const csvText = fs.readFileSync(infoCsvPath, "utf8");
  const metadataIndex = buildGmdMetadataIndex(csvText);
  if (metadataIndex.errors.length) {
    throw new Error(`info.csv GMD contiene ${metadataIndex.errors.length} record metadata non validi.`);
  }

  const files = fs.readdirSync(inputDir)
    .filter(name => /\.dataset-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  require("./dataset/fresh-output-directory").prepareFreshOutput(inputDir, outputDir);
  const report = {
    schema: "fame-neural-gmd-metadata-enrichment-report-v1",
    version: 1,
    metadataRows: metadataIndex.rows,
    totals: {
      discovered: files.length,
      gmdItems: 0,
      enriched: 0,
      nonGmdSkipped: 0,
      missingMetadata: 0,
      failed: 0
    },
    distribution: emptyDistribution(),
    items: []
  };

  for (const fileName of files) {
    try {
      const item = readJson(path.join(inputDir, fileName));
      const result = enrichDatasetItemWithGmdMetadata(item, metadataIndex.index);
      if (result.status === "non-gmd") {
        report.totals.nonGmdSkipped += 1;
        report.items.push({ fileName, status: result.status });
        continue;
      }

      report.totals.gmdItems += 1;
      if (result.status === "missing-metadata") {
        report.totals.missingMetadata += 1;
        report.items.push({ fileName, status: result.status, recordId: result.recordId });
        continue;
      }

      const outPath = path.join(outputDir, fileName);
      fs.writeFileSync(outPath, `${JSON.stringify(result.item, null, 2)}\n`, "utf8");
      report.totals.enriched += 1;
      addMetadataToDistribution(report.distribution, result.item.sourceMetadata);
      report.items.push({
        fileName,
        status: "enriched",
        recordId: result.recordId,
        style: result.item.sourceMetadata.style.raw,
        beatType: result.item.sourceMetadata.beatType,
        sourceSplit: result.item.sourceMetadata.sourceSplit
      });
    } catch (error) {
      report.totals.failed += 1;
      report.items.push({ fileName, status: "failed", reason: error.message });
    }
  }

  report.complete = report.totals.gmdItems > 0
    && report.totals.enriched === report.totals.gmdItems
    && report.totals.missingMetadata === 0
    && report.totals.failed === 0;
  return report;
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, infoCsvPath, outputDir, reportPath] = argv;
  if (!inputDir || !infoCsvPath || !outputDir || !reportPath) {
    console.error("Uso: node enrich-gmd-dataset-items.js <dataset-items-dir> <info.csv> <output-dir> <report.json>");
    process.exitCode = 64;
    return;
  }

  try {
    const report = enrichDirectory(
      path.resolve(inputDir),
      path.resolve(infoCsvPath),
      path.resolve(outputDir)
    );
    fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Dataset item scoperti: ${report.totals.discovered}`);
    console.log(`GMD item: ${report.totals.gmdItems}`);
    console.log(`Metadata enriched: ${report.totals.enriched}`);
    console.log(`Metadata mancanti: ${report.totals.missingMetadata}`);
    console.log(`Split sorgente: ${JSON.stringify(report.distribution.sourceSplit)}`);
    console.log(`Style primary: ${JSON.stringify(report.distribution.stylePrimary)}`);
    console.log(`Report: ${path.resolve(reportPath)}`);
    if (!report.complete) process.exitCode = 1;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  enrichDirectory,
  main
};
