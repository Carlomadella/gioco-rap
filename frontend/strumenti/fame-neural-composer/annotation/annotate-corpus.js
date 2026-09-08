"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  annotatePhrase,
  validateAnnotation,
  annotationSummary
} = require("./annotator");

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stableOutputName(phraseId) {
  return `${crypto.createHash("sha256").update(String(phraseId)).digest("hex").slice(0, 20)}.annotation.json`;
}

function annotateCorpus(inputDir, outputDir) {
  if (!fs.existsSync(inputDir)) throw new Error(`Phrase corpus non trovato: ${inputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  for (const name of fs.readdirSync(outputDir)) {
    if (/\.annotation\.json$/i.test(name)) fs.unlinkSync(path.join(outputDir, name));
  }

  const files = fs.readdirSync(inputDir).filter(isPhraseFile).sort((a, b) => a.localeCompare(b));
  const annotations = [];
  const failures = [];

  for (const fileName of files) {
    try {
      const item = readJson(path.join(inputDir, fileName));
      const annotation = annotatePhrase(item);
      const validation = validateAnnotation(annotation);
      if (!validation.ok) throw new Error(validation.issues.join("; "));
      const outputName = stableOutputName(annotation.phraseId);
      fs.writeFileSync(path.join(outputDir, outputName), `${JSON.stringify(annotation, null, 2)}\n`, "utf8");
      annotations.push(annotation);
    } catch (error) {
      failures.push({
        fileName,
        error: `${error.name || "Error"}: ${error.message}`
      });
    }
  }

  const summary = annotationSummary(annotations);
  summary.totals.discovered = files.length;
  summary.totals.failed = failures.length;
  summary.failures = failures;

  return { annotations, summary };
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, outputDir, summaryPath] = argv;
  if (!inputDir || !outputDir || !summaryPath) {
    console.error("Uso: node annotate-corpus.js <phrase-items-dir> <annotation-output-dir> <summary.json>");
    process.exitCode = 64;
    return;
  }

  try {
    const result = annotateCorpus(inputDir, outputDir);
    fs.writeFileSync(summaryPath, `${JSON.stringify(result.summary, null, 2)}\n`, "utf8");

    console.log(`Phrase scoperte: ${result.summary.totals.discovered}`);
    console.log(`Annotazioni prodotte: ${result.summary.totals.annotations}`);
    console.log(`Fallite: ${result.summary.totals.failed}`);
    console.log(`Con 808: ${result.summary.totals.with808}`);
    console.log(`Con relazione kick/808: ${result.summary.totals.withKick808Relation}`);
    console.log(`Motif return/variation: ${result.summary.totals.motifReturns}/${result.summary.totals.motifVariations}`);
    console.log(`Energy mean/stddev: ${result.summary.metrics.energy.mean}/${result.summary.metrics.energy.stddev}`);
    console.log(`Density mean/stddev: ${result.summary.metrics.density.mean}/${result.summary.metrics.density.stddev}`);
    console.log(`VocalSpace mean/stddev: ${result.summary.metrics.vocalSpace.mean}/${result.summary.metrics.vocalSpace.stddev}`);
    console.log(`Summary: ${summaryPath}`);

    if (result.summary.totals.failed > 0) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  isPhraseFile,
  stableOutputName,
  annotateCorpus,
  main
};
