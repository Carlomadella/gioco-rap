"use strict";

const fs = require("node:fs");
const { buildInventory, readPhraseEntries } = require("./corpus-inventory");

const GATE_SCHEMA = "fame-neural-data-ready-gate-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizePolicy(input = {}) {
  const roleInput = input.minRoleCoverage || {};
  return {
    targetMinPhrases: Number.isInteger(input.targetMinPhrases) && input.targetMinPhrases > 0
      ? input.targetMinPhrases : 500,
    minCompositionFamilies: Number.isInteger(input.minCompositionFamilies) && input.minCompositionFamilies > 0
      ? input.minCompositionFamilies : 50,
    minSourceCollections: Number.isInteger(input.minSourceCollections) && input.minSourceCollections > 0
      ? input.minSourceCollections : 2,
    maxSourceCollectionShare: Number.isFinite(Number(input.maxSourceCollectionShare))
      ? Math.max(0, Math.min(1, Number(input.maxSourceCollectionShare))) : 0.65,
    minRoleCoverage: {
      drums: Number.isInteger(roleInput.drums) && roleInput.drums >= 0 ? roleInput.drums : 150,
      "808": Number.isInteger(roleInput["808"]) && roleInput["808"] >= 0 ? roleInput["808"] : 75,
      harmony: Number.isInteger(roleInput.harmony) && roleInput.harmony >= 0 ? roleInput.harmony : 75,
      lead: Number.isInteger(roleInput.lead) && roleInput.lead >= 0 ? roleInput.lead : 75,
      pitchedAny: Number.isInteger(roleInput.pitchedAny) && roleInput.pitchedAny >= 0 ? roleInput.pitchedAny : 150
    }
  };
}

function evaluateDataReady(phraseAudit, inventory, policyInput = {}) {
  const policy = normalizePolicy(policyInput);
  const blockers = [];
  const warnings = [];

  if (!phraseAudit || phraseAudit.schema !== "fame-neural-phrase-corpus-audit-v1") {
    blockers.push("phrase audit mancante o schema non valido");
  } else {
    if (phraseAudit.block5Ready !== true) blockers.push("BLOCCO 5 tooling non READY");
    if (phraseAudit.corpusClean !== true) blockers.push("corpus phrase non clean");
    if (phraseAudit.reviewComplete !== true) blockers.push("review phrase non completata");
    if (!(phraseAudit.splitManifest && phraseAudit.splitManifest.leakageSafe === true)) {
      blockers.push("split phrase non leakage-safe");
    }
    if (Array.isArray(phraseAudit.sourceLeakage) && phraseAudit.sourceLeakage.length) {
      blockers.push(`${phraseAudit.sourceLeakage.length} sourceDatasetItem con leakage tra split`);
    }
  }

  if (!inventory || inventory.schema !== "fame-neural-corpus-inventory-v1") {
    blockers.push("inventory mancante o schema non valido");
  } else {
    if (inventory.totals.invalid > 0) blockers.push(`${inventory.totals.invalid} phrase non inventariabili`);
    if (inventory.totals.rightsBlocked > 0) blockers.push(`${inventory.totals.rightsBlocked} phrase non commercial-training-cleared`);
    if (inventory.totals.phrases < policy.targetMinPhrases) {
      blockers.push(`target phrase non raggiunto: ${inventory.totals.phrases}/${policy.targetMinPhrases}`);
    }
    if (inventory.totals.compositionFamilies < policy.minCompositionFamilies) {
      blockers.push(`composition family insufficienti: ${inventory.totals.compositionFamilies}/${policy.minCompositionFamilies}`);
    }
    if (inventory.totals.sourceCollections < policy.minSourceCollections) {
      blockers.push(`source collection insufficienti: ${inventory.totals.sourceCollections}/${policy.minSourceCollections}`);
    }

    for (const [role, minimum] of Object.entries(policy.minRoleCoverage)) {
      const actual = Number(inventory.roleCoverage && inventory.roleCoverage[role] || 0);
      if (actual < minimum) blockers.push(`coverage ${role} insufficiente: ${actual}/${minimum}`);
    }

    const dominant = inventory.sourceCollections && inventory.sourceCollections[0] || null;
    if (dominant && dominant.share > policy.maxSourceCollectionShare) {
      blockers.push(`source collection dominante oltre soglia: ${dominant.name} ${(dominant.share * 100).toFixed(1)}% > ${(policy.maxSourceCollectionShare * 100).toFixed(1)}%`);
    }
  }

  if (phraseAudit && phraseAudit.targetReached === false && inventory && inventory.totals.phrases >= policy.targetMinPhrases) {
    warnings.push("phraseAudit targetReached usa una policy diversa dal Gate 1; verificare configurazione");
  }

  return {
    schema: GATE_SCHEMA,
    version: 1,
    ready: blockers.length === 0,
    policy,
    blockers,
    warnings,
    evidence: {
      phraseAudit: phraseAudit ? {
        block5Ready: phraseAudit.block5Ready,
        corpusClean: phraseAudit.corpusClean,
        reviewComplete: phraseAudit.reviewComplete,
        targetReached: phraseAudit.targetReached,
        sourceLeakage: Array.isArray(phraseAudit.sourceLeakage) ? phraseAudit.sourceLeakage.length : null,
        leakageSafe: phraseAudit.splitManifest && phraseAudit.splitManifest.leakageSafe
      } : null,
      inventory: inventory ? {
        totals: inventory.totals,
        roleCoverage: inventory.roleCoverage,
        sourceCollections: inventory.sourceCollections,
        licenses: inventory.licenses
      } : null
    }
  };
}

function main(argv = process.argv.slice(2)) {
  const [phraseDir, phraseAuditPath, gateReportPath, policyPath, inventoryReportPath] = argv;
  if (!phraseDir || !phraseAuditPath || !gateReportPath) {
    console.error("Uso: node data-ready-gate.js <phrase-items-dir> <phrase-audit.json> <gate-report.json> [policy.json] [inventory-report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const phraseAudit = readJson(phraseAuditPath);
    const policy = policyPath ? readJson(policyPath) : {};
    const inventory = buildInventory(readPhraseEntries(phraseDir));
    const report = evaluateDataReady(phraseAudit, inventory, policy);

    fs.writeFileSync(gateReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    if (inventoryReportPath) {
      fs.writeFileSync(inventoryReportPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
    }

    console.log(`GATE 1 DATA READY: ${report.ready ? "READY" : "NOT READY"}`);
    console.log(`Phrase: ${inventory.totals.phrases}/${report.policy.targetMinPhrases}`);
    console.log(`Composition family: ${inventory.totals.compositionFamilies}/${report.policy.minCompositionFamilies}`);
    console.log(`Source collection: ${inventory.totals.sourceCollections}/${report.policy.minSourceCollections}`);
    console.log(`Coverage drums/808/harmony/lead: ${inventory.roleCoverage.drums}/${inventory.roleCoverage["808"]}/${inventory.roleCoverage.harmony}/${inventory.roleCoverage.lead}`);
    if (report.blockers.length) {
      console.log("Blocker:");
      report.blockers.forEach(blocker => console.log(` - ${blocker}`));
    }
    console.log(`Report: ${gateReportPath}`);
    if (inventoryReportPath) console.log(`Inventory: ${inventoryReportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  GATE_SCHEMA,
  normalizePolicy,
  evaluateDataReady,
  main
};
