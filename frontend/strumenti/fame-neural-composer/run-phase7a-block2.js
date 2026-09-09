"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { findPhraseCorpus, exclusionSet } = require("./run-phase5-block1");
const { loadRegistry } = require("./dataset/source-registry");
const {
  readPhraseEntries,
  buildCorpusCapabilityOverlay,
  auditCapabilityOverlay,
  selectUsageEligible
} = require("./dataset/content-capabilities-corpus");

function desktopDir() {
  const candidate = path.join(os.homedir(), "Desktop");
  try { if (fs.statSync(candidate).isDirectory()) return candidate; } catch {}
  return os.homedir();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main(argv = process.argv.slice(2)) {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const explicitCorpus = argv[0] || null;
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(), "FAME_NEURAL_PHASE7A_BLOCK2"));
    const corpus = findPhraseCorpus(explicitCorpus);
    const allEntries = readPhraseEntries(corpus.path);

    const exclusions = exclusionSet(repoRoot);
    const candidateEntries = allEntries.filter(entry => !exclusions.ids.has(entry.item && entry.item.phraseId));

    const policyPath = path.join(__dirname, "dataset", "content-capabilities-policy.v1.json");
    const registryPath = path.join(__dirname, "dataset", "source-registry.json");
    const policyRegistry = readJson(policyPath);
    const { registry: sourceRegistry } = loadRegistry(registryPath);

    console.log("=== FAME NEURAL / FASE 7A / BLOCCO 2 / CORPUS CAPABILITY AUDIT ===");
    console.log(`Corpus: ${corpus.path}`);
    console.log(`Phrase scoperte: ${allEntries.length}`);
    console.log(`Esclusioni review umana applicate: ${allEntries.length - candidateEntries.length}`);
    console.log(`Phrase candidate: ${candidateEntries.length}`);

    const overlay = buildCorpusCapabilityOverlay(candidateEntries, { policyRegistry });
    const audit = auditCapabilityOverlay(overlay, { sourceRegistry });

    const debugAllowed = selectUsageEligible(overlay, "debug");
    const pretrainingAllowed = selectUsageEligible(overlay, "pretraining");
    const pretrainingCandidates = selectUsageEligible(overlay, "pretraining", { includeCandidate: true });
    const augmentationAllowed = selectUsageEligible(overlay, "augmentation");
    const augmentationCandidates = selectUsageEligible(overlay, "augmentation", { includeCandidate: true });
    const musicalTargets = selectUsageEligible(overlay, "musicalTarget");

    audit.usageSelectionDiagnostics = {
      debugAllowed: debugAllowed.length,
      pretrainingAllowed: pretrainingAllowed.length,
      pretrainingAllowedOrCandidate: pretrainingCandidates.length,
      augmentationAllowed: augmentationAllowed.length,
      augmentationAllowedOrCandidate: augmentationCandidates.length,
      musicalTargetAllowed: musicalTargets.length,
      note: "La selezione strict include solo state=allowed. candidate richiede opt-in esplicito; unknown e blocked non sono selezionati."
    };

    fs.mkdirSync(outputDir, { recursive: true });
    const overlayPath = path.join(outputDir, "phase7a-content-capabilities-overlay.v1.json");
    const auditPath = path.join(outputDir, "phase7a-content-capabilities-audit.v1.json");

    fs.writeFileSync(overlayPath, `${JSON.stringify(overlay, null, 2)}\n`, "utf8");
    fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

    console.log(`Provenance source IDs: ${audit.totals.provenanceSourceIds}`);
    console.log(`Source collections: ${audit.totals.sourceCollections}`);
    console.log(`Composition families: ${audit.totals.compositionFamilies}`);
    console.log(`Overlay errors/warnings: ${audit.totals.overlayErrors}/${audit.totals.overlayWarnings}`);
    console.log(`Unresolved source IDs: ${audit.issues.unresolvedSourceIds.length}`);
    console.log(`Missing source IDs: ${audit.issues.missingSourceIds.length}`);
    console.log(`Missing compositionFamily: ${audit.issues.missingCompositionFamilies.length}`);
    console.log(`Missing canonical observation: ${audit.issues.missingCanonical.length}`);
    console.log(`Automatic musical capability promotions: ${audit.issues.automaticMusicalCapabilityPromotions.length}`);
    console.log(`Seed policy violations: ${audit.issues.seedPolicyViolations.length}`);
    console.log(`Strict musicalTarget allowed: ${musicalTargets.length}`);
    console.log(`Pretraining allowed/candidate: ${pretrainingAllowed.length}/${pretrainingCandidates.length}`);
    console.log(`Augmentation allowed/candidate: ${augmentationAllowed.length}/${augmentationCandidates.length}`);
    console.log(`READY FOR EVIDENCE ENRICHMENT: ${audit.readyForEvidenceEnrichment ? "SI" : "NO"}`);
    console.log(`Overlay: ${overlayPath}`);
    console.log(`Audit: ${auditPath}`);

    if (!audit.readyForEvidenceEnrichment) {
      for (const blocker of audit.blockers) console.log(`BLOCKER: ${blocker}`);
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main };
