"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { annotateCorpus } = require("../annotation/annotate-corpus");
const { buildRepresentationInput } = require("../representation/input");
const flat = require("../representation/flat-v1");
const remi = require("../representation/remi-plus-v1");
const compound = require("../representation/compound-word-v1");
const fame = require("../representation/fame-compound-v1");
const {
  findPhraseCorpus,
  readPhrases,
  exclusionSet,
  hardwareSnapshot
} = require("../run-phase5-block1");

const ADAPTERS = [flat, remi, compound, fame];

function desktopDir() {
  const desktop = path.join(os.homedir(), "Desktop");
  try { if (fs.statSync(desktop).isDirectory()) return desktop; } catch {}
  return os.homedir();
}

function stableGroupId(phrase) {
  const provenance = phrase && phrase.provenance || {};
  return String(
    provenance.compositionFamily
    || phrase.sourceDatasetItemId
    || phrase.source && phrase.source.sha256
    || phrase.phraseId
  );
}

function adapterInfo(adapter) {
  return {
    id: adapter.id,
    family: adapter.family,
    version: adapter.version,
    unitName: adapter.unitName,
    vocabSize: adapter.vocabSize,
    metadata: adapter.metadata || null,
    phase4Features: Array.isArray(adapter.phase4Features) ? [...adapter.phase4Features] : []
  };
}

function buildRecord(phrase, annotation, input) {
  const representations = {};
  for (const adapter of ADAPTERS) {
    const prepared = adapter.prepare(input);
    const encoded = adapter.encode(prepared);
    const grammar = adapter.validateEncoded(encoded);
    if (!(grammar && grammar.ok)) throw new Error(`${adapter.id}: encoded non valido per ${phrase.phraseId}: ${grammar && grammar.error}`);
    adapter.validateVocabulary(encoded);
    representations[adapter.id] = encoded;
  }
  return {
    phraseId: phrase.phraseId,
    groupId: stableGroupId(phrase),
    sourceCollection: input.sourceCollection,
    bars: input.phraseBars,
    representations
  };
}

function main(argv = process.argv.slice(2)) {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
    const explicitCorpus = argv[0] || null;
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(), "FAME_NEURAL_PHASE5_BLOCK3"));
    fs.mkdirSync(outputDir, { recursive: true });

    console.log("=== FAME NEURAL / FASE 5 / BLOCCO 3 / DATASET EXPORT ===");
    const corpus = findPhraseCorpus(explicitCorpus);
    if (corpus.count !== 504) throw new Error(`Baseline Gate 1 attesa 504 phrase, trovate ${corpus.count}`);
    const phrases = readPhrases(corpus.path);
    const exclusions = exclusionSet(repoRoot);
    if (exclusions.ids.size !== 2) throw new Error(`Overlay atteso 2 esclusioni, trovate ${exclusions.ids.size}`);
    const foundExclusions = phrases.filter(phrase => exclusions.ids.has(phrase.phraseId)).length;
    if (foundExclusions !== 2) throw new Error(`Overlay: attese 2 phrase presenti nel corpus, trovate ${foundExclusions}`);
    const candidates = phrases.filter(phrase => !exclusions.ids.has(phrase.phraseId));
    if (candidates.length !== 502) throw new Error(`Candidate attese 502, trovate ${candidates.length}`);

    const annotationDir = path.join(outputDir, "annotations");
    const annotated = annotateCorpus(corpus.path, annotationDir);
    if (annotated.summary.totals.annotations !== 504 || annotated.summary.totals.failed !== 0) {
      throw new Error(`Annotazioni FASE 4 non valide: ${annotated.summary.totals.annotations}/504, fallite ${annotated.summary.totals.failed}`);
    }
    const annotations = new Map(annotated.annotations.map(item => [item.phraseId, item]));

    const records = [];
    for (const phrase of candidates) {
      const annotation = annotations.get(phrase.phraseId);
      if (!annotation) throw new Error(`Annotazione mancante: ${phrase.phraseId}`);
      const input = buildRepresentationInput(phrase, annotation);
      records.push(buildRecord(phrase, annotation, input));
    }

    const groupCount = new Set(records.map(record => record.groupId)).size;
    const payload = {
      schema: "fame-neural-phase5-microtrain-dataset-v1",
      version: 1,
      corpus: {
        sourcePhrases: phrases.length,
        exclusionsApplied: foundExclusions,
        trainingPhrases: records.length,
        groups: groupCount
      },
      hardware: hardwareSnapshot(),
      adapters: Object.fromEntries(ADAPTERS.map(adapter => [adapter.id, adapterInfo(adapter)])),
      records
    };

    const out = path.join(outputDir, "phase5-microtrain-dataset.json");
    fs.writeFileSync(out, `${JSON.stringify(payload)}\n`, "utf8");
    console.log(`Phrase: ${records.length}`);
    console.log(`Gruppi split: ${groupCount}`);
    for (const adapter of ADAPTERS) {
      const units = records.reduce((sum, record) => sum + record.representations[adapter.id].length, 0);
      console.log(`${adapter.id}: ${units} unit totali`);
    }
    console.log(`Dataset: ${out}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { ADAPTERS, stableGroupId, adapterInfo, buildRecord, main };
