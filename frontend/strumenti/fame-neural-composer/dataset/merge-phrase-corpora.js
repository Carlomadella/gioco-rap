"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function mergePhraseDirs(outputDir, inputDirs) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (isPhraseFile(name)) fs.unlinkSync(path.join(outputDir, name));
  }

  const seenIds = new Map();
  const rows = [];

  for (const inputDir of inputDirs) {
    if (!fs.existsSync(inputDir)) throw new Error(`Phrase dir non trovata: ${inputDir}`);
    const files = fs.readdirSync(inputDir).filter(isPhraseFile).sort((a, b) => a.localeCompare(b));

    for (const fileName of files) {
      const sourcePath = path.join(inputDir, fileName);
      const item = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
      if (!item.phraseId) throw new Error(`phraseId mancante: ${sourcePath}`);

      const existing = seenIds.get(item.phraseId);
      const serialized = JSON.stringify(item);
      if (existing) {
        if (existing.serialized !== serialized) {
          throw new Error(`phraseId collision con contenuto diverso: ${item.phraseId}`);
        }
        continue;
      }

      const outName = `${hashText(item.phraseId).slice(0, 20)}.phrase-item.json`;
      fs.copyFileSync(sourcePath, path.join(outputDir, outName));
      seenIds.set(item.phraseId, { serialized, outName });
      rows.push({
        phraseId: item.phraseId,
        sourceDatasetItemId: item.sourceDatasetItemId || null,
        sourceCollection: String(item.provenance && item.provenance.sourceId || "unknown").split(":")[0],
        output: outName
      });
    }
  }

  return {
    schema: "fame-neural-phrase-merge-report-v1",
    version: 1,
    totals: {
      inputDirs: inputDirs.length,
      phrases: rows.length
    },
    phrases: rows
  };
}

function main(argv = process.argv.slice(2)) {
  const [outputDir, reportPath, ...inputDirs] = argv;
  if (!outputDir || !reportPath || inputDirs.length < 2) {
    console.error("Uso: node merge-phrase-corpora.js <output-dir> <report.json> <phrase-dir-1> <phrase-dir-2> [...]");
    process.exitCode = 64;
    return;
  }
  try {
    const report = mergePhraseDirs(outputDir, inputDirs);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Phrase unite: ${report.totals.phrases}`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { mergePhraseDirs, main };
