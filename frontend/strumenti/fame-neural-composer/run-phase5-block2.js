"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { annotateCorpus } = require("./annotation/annotate-corpus");
const { buildRepresentationInput } = require("./representation/input");
const { benchmarkRepresentation } = require("./representation/benchmark");
const flat = require("./representation/flat-v1");
const remi = require("./representation/remi-plus-v1");
const compound = require("./representation/compound-word-v1");
const fame = require("./representation/fame-compound-v1");
const {
  findPhraseCorpus,
  readPhrases,
  exclusionSet,
  hardwareSnapshot
} = require("./run-phase5-block1");

const ADAPTERS = [flat, remi, compound, fame];

function desktopDir() {
  const desktop = path.join(os.homedir(), "Desktop");
  try { if (fs.statSync(desktop).isDirectory()) return desktop; } catch {}
  return os.homedir();
}

function runSmoke(repoRoot) {
  const file = path.join(repoRoot, "frontend", "strumenti", "fame-neural-composer", "phase5-block2-smoke-test.js");
  const result = spawnSync(process.execPath, [file], { cwd: repoRoot, encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) throw new Error(`Smoke FASE 5 Blocco 2 fallito (exit ${result.status})`);
}

function compactRow(report) {
  return {
    id: report.representation.id,
    family: report.representation.family,
    unit: report.representation.unitName,
    vocabSize: report.representation.vocabSize,
    meanUnitsPerBar: report.context.meanUnitsPerBar,
    p95UnitsPerBar: report.context.p95UnitsPerBar,
    maxUnitsPerPhrase: report.context.maxUnitsPerPhrase,
    grammarFailures: report.totals.grammarFailures,
    vocabularyFailures: report.totals.vocabularyFailures,
    roundTripFailures: report.totals.canonicalRoundTripFailures,
    structureExactRate: report.reconstruction.structureExactRate,
    eventTypeAccuracy: report.reconstruction.eventType.accuracy,
    pitchAccuracy: report.reconstruction.pitch.accuracy,
    timingMaeTicks: report.reconstruction.timingMaeTicks,
    durationMaeTicks: report.reconstruction.durationMaeTicks,
    velocityMae01: report.reconstruction.velocityMae01,
    phase4FeatureCoverage: report.phase4.supportedFeatureCount,
    phase4FeatureCoverageRate: report.phase4.featureCoverageRate,
    phase4NumericMae: report.phase4.numericMae,
    phase4LeafAccuracy: report.phase4.leafAccuracy,
    cpuPhrasesPerSecond: report.cpu.phrasesPerSecond
  };
}

function markdown(report) {
  const rows = report.summary;
  const lines = [
    "# FAME Neural — FASE 5 / Blocco 2 — confronto simbolico",
    "",
    `Corpus sorgente: **${report.corpus.sourcePhrases} phrase**`,
    `Esclusioni review umana: **${report.corpus.exclusionsApplied}**`,
    `Candidate benchmark: **${report.corpus.benchmarkPhrases}**`,
    "",
    "| Rappresentazione | unit/bar mean | P95 | max unit/phrase | round-trip fail | event type | pitch | timing MAE | F4 coverage | F4 numeric MAE |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows.map(row => `| ${row.id} | ${row.meanUnitsPerBar} | ${row.p95UnitsPerBar} | ${row.maxUnitsPerPhrase} | ${row.roundTripFailures} | ${row.eventTypeAccuracy} | ${row.pitchAccuracy} | ${row.timingMaeTicks} | ${row.phase4FeatureCoverage}/8 | ${row.phase4NumericMae} |`),
    "",
    "## Lettura corretta del round-trip",
    "",
    "`roundTripFailures` misura l'idempotenza seriale `encode -> decode -> encode`. Non equivale automaticamente a phrase strutturalmente perse: la reconstruction e la structure exact rate vanno lette separatamente.",
    "",
    "## Stato decisione",
    "",
    "Nessun vincitore viene scelto nel Blocco 2. Il confronto simbolico serve a portare tutte le alternative sullo stesso harness; VRAM, throughput, validation loss e invalid generation rate richiedono il micro-training comparabile del Blocco 3.",
    "",
    "## Hardware snapshot",
    "",
    `- CPU: ${report.hardware.cpu};`,
    `- RAM: ${report.hardware.ramGb} GB;`,
    `- GPU: ${report.hardware.gpu ? `${report.hardware.gpu.name} / ${report.hardware.gpu.memoryMiB} MiB` : "non rilevata"}.`,
    ""
  ];
  return lines.join("\n");
}

function main(argv = process.argv.slice(2)) {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const explicitCorpus = argv[0] || null;
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(), "FAME_NEURAL_PHASE5_BLOCK2"));
    fs.mkdirSync(outputDir, { recursive: true });

    console.log("=== FAME NEURAL / FASE 5 / BLOCCO 2 / SYMBOLIC REPRESENTATION SHOOTOUT ===");
    console.log("[1/7] Smoke adapter + harness...");
    runSmoke(repoRoot);

    console.log("[2/7] Corpus Gate 1 + exclusion overlay...");
    const corpus = findPhraseCorpus(explicitCorpus);
    if (corpus.count !== 504) throw new Error(`Baseline Gate 1 attesa 504 phrase, trovate ${corpus.count}`);
    const phrases = readPhrases(corpus.path);
    const exclusions = exclusionSet(repoRoot);
    if (exclusions.ids.size !== 2) throw new Error(`Overlay atteso 2 esclusioni, trovate ${exclusions.ids.size}`);
    const foundExclusions = phrases.filter(phrase => exclusions.ids.has(phrase.phraseId)).length;
    if (foundExclusions !== 2) throw new Error(`Overlay: attese 2 phrase presenti nel corpus, trovate ${foundExclusions}`);
    const candidates = phrases.filter(phrase => !exclusions.ids.has(phrase.phraseId));
    if (candidates.length !== 502) throw new Error(`Candidate attese 502, trovate ${candidates.length}`);
    console.log(`Corpus: ${phrases.length} / esclusioni: ${foundExclusions} / candidate: ${candidates.length}`);

    console.log("[3/7] Rigenero annotazioni FASE 4 congelate...");
    const annotationDir = path.join(outputDir, "annotations");
    const annotated = annotateCorpus(corpus.path, annotationDir);
    if (annotated.summary.totals.annotations !== 504 || annotated.summary.totals.failed !== 0) {
      throw new Error(`Annotazioni FASE 4 non valide: ${annotated.summary.totals.annotations}/504, fallite ${annotated.summary.totals.failed}`);
    }
    const annotations = new Map(annotated.annotations.map(item => [item.phraseId, item]));

    console.log("[4/7] Costruisco representation input comune...");
    const inputs = candidates.map(phrase => {
      const annotation = annotations.get(phrase.phraseId);
      if (!annotation) throw new Error(`Annotazione mancante: ${phrase.phraseId}`);
      return buildRepresentationInput(phrase, annotation);
    });

    console.log("[5/7] Benchmark 4 rappresentazioni...");
    const benchmarks = {};
    for (const adapter of ADAPTERS) {
      process.stdout.write(`  - ${adapter.id}... `);
      const result = benchmarkRepresentation(inputs, adapter);
      benchmarks[adapter.id] = result;
      console.log(`${result.totals.benchmarked}/${result.totals.inputs}, fail ${result.totals.failures}, unit/bar ${result.context.meanUnitsPerBar}`);
      if (result.totals.benchmarked !== 502) throw new Error(`${adapter.id}: benchmarkate ${result.totals.benchmarked}/502`);
      if (result.totals.failures !== 0) throw new Error(`${adapter.id}: ${result.totals.failures} failure adapter`);
      if (result.totals.grammarFailures !== 0) throw new Error(`${adapter.id}: ${result.totals.grammarFailures} grammar failures`);
      if (result.totals.vocabularyFailures !== 0) throw new Error(`${adapter.id}: ${result.totals.vocabularyFailures} vocabulary failures`);
    }

    console.log("[6/7] Report comparativo...");
    const summary = ADAPTERS.map(adapter => compactRow(benchmarks[adapter.id]));
    const report = {
      schema: "fame-neural-phase5-block2-report-v1",
      version: 1,
      decision: "NO_WINNER_SYMBOLIC_ONLY",
      corpus: {
        path: corpus.path,
        sourcePhrases: phrases.length,
        exclusionsApplied: foundExclusions,
        benchmarkPhrases: candidates.length
      },
      hardware: hardwareSnapshot(),
      summary,
      benchmarks
    };
    fs.writeFileSync(path.join(outputDir, "phase5-block2-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(outputDir, "phase5-block2-report.md"), `${markdown(report)}\n`, "utf8");

    console.log("[7/7] Esito...");
    for (const row of summary) {
      console.log(`${row.id}: unit/bar ${row.meanUnitsPerBar} | P95 ${row.p95UnitsPerBar} | RT ${row.roundTripFailures} | F4 ${row.phase4FeatureCoverage}/8 | timing ${row.timingMaeTicks}`);
    }
    console.log("Decisione: NO_WINNER_SYMBOLIC_ONLY");
    console.log(`Output: ${outputDir}`);
    console.log("Prossimo: FASE 5 / BLOCCO 3 — micro-training comparabile su stessa GPU/modello/split.");
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  ADAPTERS,
  compactRow,
  markdown,
  main
};
