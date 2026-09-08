"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { annotateCorpus } = require("./annotation/annotate-corpus");
const { buildRepresentationInput } = require("./representation/input");
const { benchmarkRepresentation } = require("./representation/benchmark");
const flat = require("./representation/flat-v1");

function existsDir(value) {
  try { return fs.statSync(value).isDirectory(); } catch { return false; }
}

function desktopDir() {
  const desktop = path.join(os.homedir(), "Desktop");
  return existsDir(desktop) ? desktop : os.homedir();
}

function findPhraseCorpus(explicitPath) {
  const candidates = [];
  if (explicitPath) candidates.push(path.resolve(explicitPath));
  const temp = os.tmpdir();
  candidates.push(path.join(temp, "fame-neural-pdmx-volume-closer-v1", "global-reviewed-phrase-items"));
  try {
    for (const entry of fs.readdirSync(temp, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^fame-neural-/i.test(entry.name)) continue;
      candidates.push(path.join(temp, entry.name, "global-reviewed-phrase-items"));
    }
  } catch {}
  for (const candidate of [...new Set(candidates)]) {
    if (!existsDir(candidate)) continue;
    const count = fs.readdirSync(candidate).filter(name => /\.phrase-item\.json$/i.test(name)).length;
    if (count >= 500) return { path: candidate, count };
  }
  throw new Error(`Corpus Gate 1 non trovato. Provati: ${[...new Set(candidates)].join(" | ")}`);
}

function readPhrases(dir) {
  return fs.readdirSync(dir)
    .filter(name => /\.phrase-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
}

function exclusionSet(repoRoot) {
  const file = path.join(repoRoot, "frontend", "strumenti", "fame-neural-composer", "dataset", "phase4-human-review-exclusions.json");
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  if (value.schema !== "fame-neural-human-review-exclusions-v1") throw new Error("Overlay esclusioni FASE 4 non valido");
  return { file, ids: new Set((value.exclusions || []).map(item => item.phraseId)) };
}

function hardwareSnapshot() {
  const cpu = os.cpus()[0] && os.cpus()[0].model || "unknown";
  const snapshot = {
    platform: process.platform,
    node: process.version,
    cpu,
    logicalCpu: os.cpus().length,
    ramGb: Math.round((os.totalmem() / (1024 ** 3)) * 10) / 10,
    gpu: null
  };
  const query = spawnSync("nvidia-smi", ["--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"], { encoding: "utf8" });
  if (query.status === 0 && String(query.stdout || "").trim()) {
    const [name, memoryMiB, driver] = String(query.stdout).trim().split(",").map(value => value.trim());
    snapshot.gpu = { name, memoryMiB: Number(memoryMiB), driver };
  }
  return snapshot;
}

function runSmoke(repoRoot) {
  const file = path.join(repoRoot, "frontend", "strumenti", "fame-neural-composer", "phase5-block1-smoke-test.js");
  const result = spawnSync(process.execPath, [file], { cwd: repoRoot, encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) throw new Error(`Smoke FASE 5 Blocco 1 fallito (exit ${result.status})`);
}

function markdown(report) {
  const b = report.benchmark;
  const lines = [
    "# FAME Neural — FASE 5 / Blocco 1 — Flat baseline",
    "",
    `Corpus sorgente: **${report.corpus.sourcePhrases} phrase**`,
    `Esclusioni review umana: **${report.corpus.exclusionsApplied}**`,
    `Candidate benchmark: **${report.corpus.benchmarkPhrases}**`,
    "",
    "## Flat PoC V1",
    "",
    `- benchmarked: **${b.totals.benchmarked}/${b.totals.inputs}**;`,
    `- failures: **${b.totals.failures}**;`,
    `- vocab size: **${b.representation.vocabSize}**;`,
    `- mean token/bar: **${b.context.meanUnitsPerBar}**;`,
    `- P95 token/bar: **${b.context.p95UnitsPerBar}**;`,
    `- max token/phrase: **${b.context.maxUnitsPerPhrase}**;`,
    `- grammar failures: **${b.totals.grammarFailures}**;`,
    `- vocabulary failures: **${b.totals.vocabularyFailures}**;`,
    `- canonical round-trip failures: **${b.totals.canonicalRoundTripFailures}**;`,
    `- event type accuracy: **${b.reconstruction.eventType.accuracy}**;`,
    `- pitch accuracy: **${b.reconstruction.pitch.accuracy}**;`,
    `- timing MAE: **${b.reconstruction.timingMaeTicks} ticks**;`,
    `- duration MAE: **${b.reconstruction.durationMaeTicks} ticks**;`,
    `- velocity MAE: **${b.reconstruction.velocityMae01}**.`,
    "",
    "## Metriche volutamente rinviate",
    "",
    "VRAM peak, training throughput, invalid generation rate e validation loss richiedono un micro-training comparabile e non vengono inventate dal benchmark simbolico.",
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
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(), "FAME_NEURAL_PHASE5_BLOCK1"));
    fs.mkdirSync(outputDir, { recursive: true });

    console.log("=== FAME NEURAL / FASE 5 / BLOCCO 1 / FLAT BASELINE ===");
    console.log("[1/6] Smoke benchmark...");
    runSmoke(repoRoot);

    console.log("[2/6] Corpus Gate 1 + exclusion overlay...");
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

    console.log("[3/6] Rigenero annotazioni V1 congelate...");
    const annotationDir = path.join(outputDir, "annotations");
    const annotated = annotateCorpus(corpus.path, annotationDir);
    if (annotated.summary.totals.annotations !== 504 || annotated.summary.totals.failed !== 0) {
      throw new Error(`Annotazioni FASE 4 non valide: ${annotated.summary.totals.annotations}/504, fallite ${annotated.summary.totals.failed}`);
    }
    const annotations = new Map(annotated.annotations.map(item => [item.phraseId, item]));

    console.log("[4/6] Costruisco representation input comune...");
    const inputs = candidates.map(phrase => {
      const annotation = annotations.get(phrase.phraseId);
      if (!annotation) throw new Error(`Annotazione mancante: ${phrase.phraseId}`);
      return buildRepresentationInput(phrase, annotation);
    });

    console.log("[5/6] Benchmark Flat PoC V1...");
    const benchmark = benchmarkRepresentation(inputs, flat);
    const report = {
      schema: "fame-neural-phase5-block1-report-v1",
      version: 1,
      corpus: {
        path: corpus.path,
        sourcePhrases: phrases.length,
        exclusionsApplied: foundExclusions,
        benchmarkPhrases: candidates.length
      },
      hardware: hardwareSnapshot(),
      benchmark
    };
    fs.writeFileSync(path.join(outputDir, "phase5-block1-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(outputDir, "phase5-block1-report.md"), `${markdown(report)}\n`, "utf8");

    console.log("[6/6] Esito...");
    console.log(`Benchmark: ${benchmark.totals.benchmarked}/${benchmark.totals.inputs}`);
    console.log(`Failure: ${benchmark.totals.failures}`);
    console.log(`Token/bar mean: ${benchmark.context.meanUnitsPerBar}`);
    console.log(`Token/bar P95: ${benchmark.context.p95UnitsPerBar}`);
    console.log(`Max token/phrase: ${benchmark.context.maxUnitsPerPhrase}`);
    console.log(`Grammar failures: ${benchmark.totals.grammarFailures}`);
    console.log(`Vocab failures: ${benchmark.totals.vocabularyFailures}`);
    console.log(`Round-trip failures: ${benchmark.totals.canonicalRoundTripFailures}`);
    console.log(`Event type accuracy: ${benchmark.reconstruction.eventType.accuracy}`);
    console.log(`Pitch accuracy: ${benchmark.reconstruction.pitch.accuracy}`);
    console.log(`Timing MAE: ${benchmark.reconstruction.timingMaeTicks} ticks`);
    console.log(`Output: ${outputDir}`);

    // Il Blocco 1 misura la baseline, quindi incompatibilita' Flat sono un risultato e non vengono nascoste.
    if (benchmark.totals.benchmarked === 0) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  findPhraseCorpus,
  readPhrases,
  exclusionSet,
  hardwareSnapshot,
  markdown,
  main
};
