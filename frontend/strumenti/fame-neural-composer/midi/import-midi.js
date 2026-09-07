"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildDatasetItem } = require("./dataset-item");

function importMidiFile(midiPath, provenance, options = {}) {
  const buffer = fs.readFileSync(midiPath);
  return buildDatasetItem({
    buffer,
    fileName: path.basename(midiPath),
    provenance,
    options
  });
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main(argv = process.argv.slice(2)) {
  const [midiPath, provenancePath, outputPath, optionsPath] = argv;
  if (!midiPath || !provenancePath || !outputPath) {
    console.error("Uso: node import-midi.js <input.mid> <provenance.json> <output.dataset-item.json> [import-options.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const provenance = loadJson(provenancePath);
    const options = optionsPath ? loadJson(optionsPath) : {};
    const item = importMidiFile(midiPath, provenance, options);
    fs.writeFileSync(outputPath, `${JSON.stringify(item, null, 2)}\n`, "utf8");
    console.log(`Dataset item: ${outputPath}`);
    console.log(`Import: ${item.import.status}`);
    console.log(`Rights: ${item.rights.status}`);
    console.log(`Commercial training: ${item.eligibility.commercialTraining ? "YES" : "NO"}`);
    if (item.import.errors.length) {
      item.import.errors.forEach(e => console.error(`[IMPORT BLOCK] ${e.code}: ${e.message}`));
    }
    if (item.rights.validationErrors.length) {
      item.rights.validationErrors.forEach(e => console.error(`[RIGHTS BLOCK] ${e}`));
    }
    if (!item.eligibility.technical) process.exitCode = 2;
    else if (!item.eligibility.commercialTraining) process.exitCode = 3;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  importMidiFile,
  main
};
