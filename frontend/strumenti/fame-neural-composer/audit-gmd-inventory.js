"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildGmdInventory } = require("./dataset/gmd-inventory");

function usage() {
  console.error("Uso: node audit-gmd-inventory.js <info.csv> <report.json>");
}

function main() {
  const infoCsvPath = process.argv[2];
  const reportPath = process.argv[3];
  if (!infoCsvPath || !reportPath) {
    usage();
    process.exitCode = 2;
    return;
  }

  const csvText = fs.readFileSync(infoCsvPath, "utf8");
  const report = buildGmdInventory(csvText);
  fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log("FASE 7D / BLOCCO 1 / GMD FULL INVENTORY");
  console.log(`Record CSV/validi: ${report.totals.csvRows}/${report.totals.validRecords}`);
  console.log(`Invalidi/duplicati: ${report.totals.invalidRecords}/${report.totals.duplicateRecordIds}`);
  console.log(`Drummer: ${Object.keys(report.distribution.drummer).length}`);
  console.log(`Primary style: ${Object.keys(report.distribution.stylePrimary).length}`);
  console.log(`Beat type: ${JSON.stringify(report.distribution.beatType)}`);
  console.log(`Source split: ${JSON.stringify(report.distribution.sourceSplit)}`);
  console.log(`Time signature: ${JSON.stringify(report.distribution.timeSignature)}`);
  console.log(`Candidate views: ${JSON.stringify(report.candidateViews)}`);
  console.log(
    "Cross-split groups (diagnostico): " +
    `drummer=${report.sourceSplitCrossGroupAudit.drummer.crossSplitGroupCount}, ` +
    `session=${report.sourceSplitCrossGroupAudit.session.crossSplitGroupCount}, ` +
    `evalTemplate=${report.sourceSplitCrossGroupAudit.evalTemplate.crossSplitGroupCount}`
  );
  console.log(
    `Eval session: templates=${report.evalSession.templateCount}, rows=${report.evalSession.totalRows}, ` +
    `allSourceTest=${report.evalSession.allSourceTest ? "SI" : "NO"}`
  );
  console.log(`Reference checks: ${report.referenceChecks.ok ? "PASS" : "FAIL"}`);
  console.log(`Ready for sampling design: ${report.readyForSamplingDesign ? "SI" : "NO"}`);
  console.log(`Report: ${path.resolve(reportPath)}`);

  if (!report.readyForSamplingDesign) process.exitCode = 1;
}

main();
