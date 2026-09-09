"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { findPhraseCorpus, exclusionSet } = require("./run-phase5-block1");
const {
  readPhraseEntries,
  buildCorpusCapabilityOverlay,
  auditCapabilityOverlay
} = require("./dataset/content-capabilities-corpus");
const { resolveSourceCollectionId } = require("./dataset/content-capabilities");
const {
  getTaskPolicy,
  evaluateTaskAdmissibility,
  summarizeDecisions,
  selectAllowedDecisions,
  readinessForTask
} = require("./dataset/task-admissibility");

const usagePolicy = require("./dataset/content-capabilities-policy.v1.json");
const taskPolicyRegistry = require("./dataset/task-admissibility-policy.v1.json");
const sourceRegistry = require("./dataset/source-registry.json");

function parseArgs(argv) {
  const out = {
    taskId: "drum-groove-pretraining-v1",
    corpus: null,
    output: null
  };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) out.taskId = args.shift();

  while (args.length) {
    const flag = args.shift();
    if (flag === "--corpus") out.corpus = args.shift() || null;
    else if (flag === "--output") out.output = args.shift() || null;
    else throw new Error(`Argomento non riconosciuto: ${flag}`);
  }
  return out;
}

function desktopDir() {
  const value = path.join(os.homedir(), "Desktop");
  try {
    if (fs.statSync(value).isDirectory()) return value;
  } catch {}
  return os.homedir();
}

function sha256Json(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sourceCollectionIds() {
  return Array.isArray(sourceRegistry.sources)
    ? sourceRegistry.sources.map(item => item && item.id).filter(Boolean)
    : [];
}

function buildTaskExport(taskId, explicitCorpus = null) {
  const taskPolicy = getTaskPolicy(taskPolicyRegistry, taskId);
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const corpus = findPhraseCorpus(explicitCorpus);
  if (corpus.count !== 504) {
    throw new Error(`Corpus Gate 1 atteso 504 phrase, trovate ${corpus.count}`);
  }

  const entries = readPhraseEntries(corpus.path);
  const exclusions = exclusionSet(repoRoot);
  if (exclusions.ids.size !== 2) {
    throw new Error(`Overlay atteso 2 esclusioni, trovate ${exclusions.ids.size}`);
  }

  const foundExclusions = entries.filter(entry => exclusions.ids.has(entry.item && entry.item.phraseId)).length;
  if (foundExclusions !== 2) {
    throw new Error(`Overlay: attese 2 phrase presenti nel corpus, trovate ${foundExclusions}`);
  }

  const candidates = entries.filter(entry => !exclusions.ids.has(entry.item && entry.item.phraseId));
  if (candidates.length !== 502) {
    throw new Error(`Candidate attese 502, trovate ${candidates.length}`);
  }

  const overlay = buildCorpusCapabilityOverlay(candidates, { policyRegistry: usagePolicy });
  const capabilityAudit = auditCapabilityOverlay(overlay, { sourceRegistry });
  if (!capabilityAudit.readyForEvidenceEnrichment) {
    throw new Error(`Content capability overlay non valido: ${capabilityAudit.blockers.join("; ")}`);
  }

  const phrases = new Map(candidates.map(entry => [entry.item.phraseId, entry.item]));
  const files = new Map(candidates.map(entry => [entry.item.phraseId, entry]));
  const registryIds = sourceCollectionIds();

  const decisions = overlay.items.map(item => {
    const sourceCollectionId = resolveSourceCollectionId(item.linkage && item.linkage.sourceId, registryIds);
    return evaluateTaskAdmissibility(item, taskPolicy, {
      phrase: phrases.get(item.phraseId) || null,
      sourceCollectionId
    });
  });

  const summary = summarizeDecisions(decisions);
  const readiness = readinessForTask(taskPolicy, summary.counts);
  const allowed = selectAllowedDecisions(decisions);
  const decisionByPhrase = new Map(decisions.map(item => [item.subjectPhraseId, item]));

  const selected = allowed.map(decision => {
    const entry = files.get(decision.subjectPhraseId);
    const phrase = entry.item;
    return {
      phraseId: phrase.phraseId,
      sourceDatasetItemId: phrase.sourceDatasetItemId,
      sourceId: phrase.provenance && phrase.provenance.sourceId || null,
      sourceCollectionId: decision.sourceCollectionId,
      compositionFamily: phrase.provenance && phrase.provenance.compositionFamily || null,
      phraseBars: phrase.phraseBars,
      sourceFileName: entry.fileName,
      sourceFileSha256: entry.sha256,
      decision: decision.decision,
      evidenceRefs: decision.evidenceRefs
    };
  });

  if (selected.some(item => item.decision !== "allowed")) {
    throw new Error("Invariant violata: manifest contiene record non allowed");
  }

  return {
    report: {
      schema: "fame-neural-task-admissibility-report-v1",
      version: 1,
      taskId,
      taskPolicyDigest: sha256Json(taskPolicy),
      corpus: {
        sourcePhrases: entries.length,
        exclusionsApplied: foundExclusions,
        candidates: candidates.length,
        sourceCorpusDigest: overlay.sourceCorpusDigest
      },
      capabilityOverlayReadyForEvidenceEnrichment: capabilityAudit.readyForEvidenceEnrichment,
      decisions: summary.counts,
      reasonCodes: summary.reasonCodes,
      taskReady: readiness.taskReady,
      trainingReady: readiness.trainingReady,
      decisionRecords: decisions
    },
    manifest: {
      schema: "fame-neural-task-admissible-manifest-v1",
      version: 1,
      taskId,
      taskPolicyDigest: sha256Json(taskPolicy),
      sourceCorpusDigest: overlay.sourceCorpusDigest,
      selectionInvariant: "ONLY_TASK_ADMISSIBILITY_DECISION_ALLOWED",
      selectedCount: selected.length,
      selected
    }
  };
}

function writeTaskExport(result, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const safeTaskId = result.report.taskId.replace(/[^a-z0-9._-]+/gi, "-");
  const reportPath = path.join(outputDir, `task-admissibility-report.${safeTaskId}.json`);
  const manifestPath = path.join(outputDir, `task-admissible-manifest.${safeTaskId}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(result.report, null, 2)}\n`, "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify(result.manifest, null, 2)}\n`, "utf8");
  return { reportPath, manifestPath };
}

function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const outputDir = path.resolve(
      args.output || path.join(desktopDir(), "FAME_NEURAL_PHASE7A_BLOCK3", args.taskId)
    );
    const result = buildTaskExport(args.taskId, args.corpus);
    const paths = writeTaskExport(result, outputDir);

    console.log("=== FAME NEURAL / FASE 7A / BLOCCO 3 / TASK EXPORT ===");
    console.log(`Task: ${result.report.taskId}`);
    console.log(`Candidate: ${result.report.corpus.candidates}`);
    console.log(`Allowed: ${result.report.decisions.allowed}`);
    console.log(`Blocked: ${result.report.decisions.blocked}`);
    console.log(`Unknown: ${result.report.decisions.unknown}`);
    console.log(`Task ready: ${result.report.taskReady ? "SI" : "NO"}`);
    console.log(`Training ready: ${result.report.trainingReady == null ? "N/A" : result.report.trainingReady ? "SI" : "NO"}`);
    console.log(`Report: ${paths.reportPath}`);
    console.log(`Manifest: ${paths.manifestPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  parseArgs,
  buildTaskExport,
  writeTaskExport,
  main
};
