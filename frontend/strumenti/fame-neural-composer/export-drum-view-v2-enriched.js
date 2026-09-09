"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validateDrumViewV2 } = require("./dataset/drum-view-v2");
const { buildEnrichedDrumViewV2 } = require("./dataset/drum-view-v2-metadata");
const { addMetadataToDistribution, emptyDistribution } = require("./dataset/gmd-metadata");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safeName(id) {
  const hash = crypto.createHash("sha256").update(id).digest("hex").slice(0, 16);
  return `${hash}.drum-view-v2.json`;
}

function exportEnrichedDrumViews(inputDir, outputDir, options = {}) {
  const files = fs.readdirSync(inputDir)
    .filter(name => /\.dataset-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  fs.mkdirSync(outputDir, { recursive: true });
  const report = {
    schema: "fame-neural-drum-view-v2-enriched-export-report-v1",
    version: 1,
    options: {
      mappingProfileId: options.mappingProfileId || "gmd-9-v1",
      bars: options.bars || 2,
      gridDivisionPerQuarter: options.gridDivisionPerQuarter || 4
    },
    totals: {
      discovered: files.length,
      exported: 0,
      metadataEnriched: 0,
      skippedNoSourceFidelity: 0,
      failed: 0,
      sourceHits: 0,
      viewHits: 0,
      rawFallbackHits: 0,
      multiHitLaneFrames: 0
    },
    distribution: emptyDistribution(),
    items: []
  };

  for (const fileName of files) {
    const item = readJson(path.join(inputDir, fileName));
    if (!item.sourceFidelity) {
      report.totals.skippedNoSourceFidelity += 1;
      report.items.push({ fileName, status: "skipped", reason: "source-fidelity-missing" });
      continue;
    }

    try {
      const view = buildEnrichedDrumViewV2(item, options);
      const validation = validateDrumViewV2(view);
      if (!validation.ok) throw new Error(validation.errors.join("; "));
      if (!view.metadata || view.metadata.metadataStatus !== "source-enriched") {
        throw new Error("Drum View GMD esportata senza metadata source-enriched.");
      }

      const outName = safeName(view.viewId);
      fs.writeFileSync(path.join(outputDir, outName), `${JSON.stringify(view, null, 2)}\n`, "utf8");
      report.totals.exported += 1;
      report.totals.metadataEnriched += 1;
      report.totals.sourceHits += view.stats.sourceHitCount;
      report.totals.viewHits += view.stats.hitCount;
      report.totals.rawFallbackHits += view.stats.rawFallbackHitCount;
      report.totals.multiHitLaneFrames += view.stats.multiHitLaneFrameCount;
      addMetadataToDistribution(report.distribution, item.sourceMetadata);
      report.items.push({
        fileName,
        outputFileName: outName,
        status: "exported",
        viewId: view.viewId,
        sourceHitCount: view.stats.sourceHitCount,
        hitCount: view.stats.hitCount,
        style: view.metadata.style.raw,
        beatType: view.metadata.beatType,
        sourceSplit: view.metadata.sourceSplit
      });
    } catch (error) {
      report.totals.failed += 1;
      report.items.push({ fileName, status: "failed", reason: error.message });
    }
  }

  report.losslessSourceHitAccounting = report.totals.sourceHits === report.totals.viewHits;
  report.completeMetadataCoverage = report.totals.exported > 0
    && report.totals.metadataEnriched === report.totals.exported;
  return report;
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, outputDir, reportPath, optionsPath] = argv;
  if (!inputDir || !outputDir || !reportPath) {
    console.error("Uso: node export-drum-view-v2-enriched.js <dataset-items-dir> <output-dir> <report.json> [options.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const options = optionsPath ? readJson(optionsPath) : {};
    const report = exportEnrichedDrumViews(path.resolve(inputDir), path.resolve(outputDir), options);
    fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Drum View esportate: ${report.totals.exported}`);
    console.log(`Metadata enriched: ${report.totals.metadataEnriched}`);
    console.log(`Source/View hits: ${report.totals.sourceHits}/${report.totals.viewHits}`);
    console.log(`Raw fallback hits: ${report.totals.rawFallbackHits}`);
    console.log(`Split sorgente: ${JSON.stringify(report.distribution.sourceSplit)}`);
    console.log(`Lossless source-hit accounting: ${report.losslessSourceHitAccounting ? "SI" : "NO"}`);
    console.log(`Report: ${path.resolve(reportPath)}`);
    if (report.totals.failed > 0 || !report.losslessSourceHitAccounting || !report.completeMetadataCoverage) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  exportEnrichedDrumViews,
  main
};
