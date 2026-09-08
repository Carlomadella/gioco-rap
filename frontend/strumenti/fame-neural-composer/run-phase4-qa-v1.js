"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { annotateCorpus } = require("./annotation/annotate-corpus");
const { runQa, markdownReport } = require("./annotation/qa");

function existsDir(value) {
  try { return fs.statSync(value).isDirectory(); } catch { return false; }
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

  const unique = [...new Set(candidates)];
  for (const candidate of unique) {
    if (!existsDir(candidate)) continue;
    const phraseCount = fs.readdirSync(candidate).filter(name => /\.phrase-item\.json$/i.test(name)).length;
    if (phraseCount >= 500) return { path: candidate, phraseCount };
  }
  throw new Error(`Corpus Gate 1 non trovato. Provati: ${unique.join(" | ")}`);
}

function desktopDir() {
  const desktop = path.join(os.homedir(), "Desktop");
  return existsDir(desktop) ? desktop : os.homedir();
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function annotationManifest(dir) {
  const files = fs.readdirSync(dir).filter(name => /\.annotation\.json$/i.test(name)).sort((a, b) => a.localeCompare(b));
  const hash = crypto.createHash("sha256");
  for (const name of files) hash.update(`${name}\0${sha256File(path.join(dir, name))}\n`);
  return { files: files.length, sha256: hash.digest("hex") };
}

function phraseIndex(inputDir) {
  const map = new Map();
  for (const name of fs.readdirSync(inputDir).filter(file => /\.phrase-item\.json$/i.test(file)).sort((a, b) => a.localeCompare(b))) {
    try {
      const item = JSON.parse(fs.readFileSync(path.join(inputDir, name), "utf8"));
      if (item && item.phraseId && !map.has(item.phraseId)) map.set(item.phraseId, name);
    } catch {}
  }
  return map;
}

function safeFilePart(value) {
  return String(value || "unknown").replace(/[^a-z0-9._-]+/gi, "_").slice(0, 80);
}

function copyReviewCases(inputDir, annotationDir, report, outputDir) {
  const target = path.join(outputDir, "review-sample");
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  const phrases = phraseIndex(inputDir);
  const annotationsById = new Map();
  for (const name of fs.readdirSync(annotationDir).filter(file => /\.annotation\.json$/i.test(file)).sort()) {
    try {
      const annotation = JSON.parse(fs.readFileSync(path.join(annotationDir, name), "utf8"));
      annotationsById.set(annotation.phraseId, name);
    } catch {}
  }

  let copied = 0;
  report.reviewSample.forEach((entry, index) => {
    const prefix = `${String(index + 1).padStart(3, "0")}_${safeFilePart(entry.sourceCollection)}_${safeFilePart(entry.phraseId)}`;
    const annotationName = annotationsById.get(entry.phraseId);
    const phraseName = phrases.get(entry.phraseId);
    if (annotationName) fs.copyFileSync(path.join(annotationDir, annotationName), path.join(target, `${prefix}.annotation.json`));
    if (phraseName) fs.copyFileSync(path.join(inputDir, phraseName), path.join(target, `${prefix}.phrase-item.json`));
    if (annotationName || phraseName) copied += 1;
  });
  return { dir: target, copied };
}

function runSmoke(repoRoot) {
  const smoke = path.join(repoRoot, "frontend", "strumenti", "fame-neural-composer", "phase4-qa-smoke-test.js");
  const result = spawnSync(process.execPath, [smoke], { cwd: repoRoot, encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) throw new Error(`Smoke Blocco 2A fallito (exit ${result.status})`);
}

function main(argv = process.argv.slice(2)) {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const explicitCorpus = argv[0] || null;
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(), "FAME_NEURAL_PHASE4_QA_V1"));
    const annotationsDir = path.join(outputDir, "annotations");
    fs.mkdirSync(outputDir, { recursive: true });

    console.log("=== FAME NEURAL / FASE 4 / BLOCCO 2A / QA STRATIFICATO ===");
    console.log(`[1/5] Smoke test QA...`);
    runSmoke(repoRoot);

    console.log(`[2/5] Ricerca corpus Gate 1...`);
    const corpus = findPhraseCorpus(explicitCorpus);
    console.log(`Corpus: ${corpus.path}`);
    console.log(`Phrase: ${corpus.phraseCount}`);
    if (corpus.phraseCount !== 504) throw new Error(`Baseline attesa 504 phrase, trovate ${corpus.phraseCount}`);

    console.log(`[3/5] Rigenero annotazioni dal corpus reale...`);
    const annotated = annotateCorpus(corpus.path, annotationsDir);
    if (annotated.summary.totals.annotations !== 504 || annotated.summary.totals.failed !== 0) {
      throw new Error(`Annotazione reale non valida: ${annotated.summary.totals.annotations}/504, fallite ${annotated.summary.totals.failed}`);
    }
    fs.writeFileSync(path.join(outputDir, "annotation-summary.json"), `${JSON.stringify(annotated.summary, null, 2)}\n`, "utf8");
    const manifest = annotationManifest(annotationsDir);

    console.log(`[4/5] QA invarianti + stratificazione + casi estremi...`);
    const report = runQa(annotated.annotations, { perSource: 10 });
    const jsonPath = path.join(outputDir, "qa-report.json");
    const mdPath = path.join(outputDir, "qa-report.md");
    fs.writeFileSync(jsonPath, `${JSON.stringify({ ...report, annotationManifest: manifest }, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, markdownReport(report), "utf8");
    const review = copyReviewCases(corpus.path, annotationsDir, report, outputDir);

    console.log(`[5/5] Esito...`);
    console.log(`Annotazioni: ${report.totals.annotations}`);
    console.log(`Sorgenti: ${report.totals.sources}`);
    console.log(`Violazioni invarianti: ${report.totals.invariantFailures}`);
    console.log(`Campione revisione: ${report.totals.reviewSample}`);
    console.log(`Casi copiati: ${review.copied}`);
    console.log(`Manifest QA: ${manifest.sha256}`);
    console.log(`Decisione automatica: ${report.calibration.decision}`);
    console.log(`Report: ${mdPath}`);
    console.log(`Output: ${outputDir}`);

    if (report.totals.invariantFailures > 0) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  findPhraseCorpus,
  annotationManifest,
  phraseIndex,
  copyReviewCases,
  main
};
