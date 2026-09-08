"use strict";

const fs = require("node:fs");
const path = require("node:path");
const flat = require("../representation/flat-v1");
const remi = require("../representation/remi-plus-v1");
const compound = require("../representation/compound-word-v1");
const fame = require("../representation/fame-compound-v1");

const ADAPTERS = new Map([flat, remi, compound, fame].map(adapter => [adapter.id, adapter]));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function validateFile(file, adapter) {
  const payload = readJson(file);
  const samples = Array.isArray(payload.samples) ? payload.samples : [];
  const details = [];
  let valid = 0;
  for (const sample of samples) {
    let result;
    try {
      adapter.validateVocabulary(sample.encoded);
      const grammar = adapter.validateEncoded(sample.encoded);
      if (!(grammar && grammar.ok)) throw new Error(grammar && grammar.error || "encoded non valido");
      adapter.decode(sample.encoded);
      result = { phraseId: sample.phraseId, ok: true, error: null, units: sample.encoded.length };
      valid += 1;
    } catch (error) {
      result = { phraseId: sample.phraseId, ok: false, error: `${error.name || "Error"}: ${error.message}`, units: Array.isArray(sample.encoded) ? sample.encoded.length : 0 };
    }
    details.push(result);
  }
  return {
    representation: adapter.id,
    samples: samples.length,
    valid,
    invalid: samples.length - valid,
    invalidGenerationRate: samples.length ? (samples.length - valid) / samples.length : 1,
    details
  };
}

function main(argv = process.argv.slice(2)) {
  try {
    const outputDir = path.resolve(argv[0] || ".");
    const rows = [];
    for (const [id, adapter] of ADAPTERS) {
      const file = path.join(outputDir, `generated-${id}.json`);
      if (!fs.existsSync(file)) throw new Error(`File generazioni mancante: ${file}`);
      const row = validateFile(file, adapter);
      rows.push(row);
      console.log(`${id}: valid ${row.valid}/${row.samples} | invalid rate ${row.invalidGenerationRate.toFixed(6)}`);
    }
    const report = {
      schema: "fame-neural-phase5-block3-generation-validation-v1",
      version: 1,
      task: "continue-final-bar-from-valid-prefix",
      results: rows
    };
    const out = path.join(outputDir, "phase5-block3-generation-validation.json");
    fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Generation validation: ${out}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { ADAPTERS, validateFile, main };
