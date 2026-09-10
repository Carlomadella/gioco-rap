"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  buildGmdCandidateManifest,
  buildCandidateReport
} = require("./dataset/gmd-candidate-manifest");

function main(argv = process.argv.slice(2)) {
  const [infoCsvPath, manifestPath, reportPath] = argv;
  if (!infoCsvPath || !manifestPath || !reportPath) {
    console.error("Uso: node build-gmd-phase7d-block2-candidates.js <info.csv> <manifest.json> <report.json>");
    process.exitCode = 64;
    return;
  }

  try {
    const csvText = fs.readFileSync(path.resolve(infoCsvPath), "utf8");
    const manifest = buildGmdCandidateManifest(csvText);
    const report = buildCandidateReport(manifest);

    fs.mkdirSync(path.dirname(path.resolve(manifestPath)), { recursive: true });
    fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true });
    fs.writeFileSync(path.resolve(manifestPath), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log("FASE 7D / BLOCCO 2 / GROUPING + CANDIDATE MANIFEST");
    console.log(`Record manifest: ${manifest.totals.records}`);
    console.log(`Pool beat 4/4 non-eval: ${manifest.pools.generalBeat44}`);
    console.log(`Pool fill 4/4 non-eval: ${manifest.pools.fill44}`);
    console.log(`Non-4/4 non-eval: ${manifest.pools.non44}`);
    console.log(`Eval-session holdout: ${manifest.pools.evalSessionHoldout}`);
    console.log(`Session grouped: ${JSON.stringify(manifest.strategies.sessionGrouped.recordCounts)}`);
    console.log(
      `Drummer held-out: ${JSON.stringify(manifest.strategies.drummerHeldOut.recordCounts)} ` +
      `(val=${manifest.strategies.drummerHeldOut.representative.validationDrummer}, ` +
      `test=${manifest.strategies.drummerHeldOut.representative.testDrummer})`
    );
    console.log(`Session cross-task-split groups: ${manifest.strategies.sessionGrouped.isolation.crossTaskSplitGroupCount}`);
    console.log(`Drummer cross-task-split groups: ${manifest.strategies.drummerHeldOut.isolation.crossTaskSplitGroupCount}`);
    console.log(`Digest: ${manifest.digest.value}`);
    console.log(`Ready for policy comparison: ${manifest.readyForPolicyComparison ? "SI" : "NO"}`);
    console.log(`Manifest: ${path.resolve(manifestPath)}`);
    console.log(`Report: ${path.resolve(reportPath)}`);
    console.log("IMPORTANTE: nessuno split finale selezionato e nessun training aperto.");

    if (!manifest.readyForPolicyComparison) process.exitCode = 1;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { main };
