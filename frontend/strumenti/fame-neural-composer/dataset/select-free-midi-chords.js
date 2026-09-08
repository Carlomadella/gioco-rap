"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const REPORT_SCHEMA = "fame-neural-free-midi-chords-selection-v1";

const MIT_LICENSE = `MIT License

Copyright (c) 2019 Ludovic Drolez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walk(rootDir) {
  const out = [];
  const stack = [path.resolve(rootDir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) out.push(full);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function isMidi(name) {
  return /\.(mid|midi)$/i.test(name);
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeSlash(value) {
  return String(value).replace(/\\/g, "/");
}

function parseCandidate(filePath, rootDir, cfg) {
  const rel = normalizeSlash(path.relative(rootDir, filePath));
  const parts = rel.split("/");
  const progressionIndex = parts.findIndex(part => /^4(?: Chord)? Progressions?$/i.test(part));
  if (progressionIndex < 0 || progressionIndex + 2 >= parts.length) return null;

  const category = parts[progressionIndex + 1];
  const style = parts[progressionIndex + 2];
  if (!cfg.categories.includes(category)) return null;
  if (!cfg.styles.includes(style)) return null;

  const base = path.basename(filePath, path.extname(filePath));
  const firstSep = base.indexOf(" - ");
  const progressionIdentity = (firstSep >= 0 ? base.slice(firstSep + 3) : base)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!progressionIdentity) return null;

  const keyDir = progressionIndex > 0 ? parts[progressionIndex - 1] : "unknown-key";
  const familyKey = `${category}|${style}|${progressionIdentity}`;
  const familyHash = sha256Text(familyKey).slice(0, 20);

  return {
    filePath,
    rel,
    category,
    style,
    keyDir,
    progressionIdentity,
    familyKey,
    familyHash
  };
}

function stylePriority(style) {
  const order = new Map([
    ["hiphop2 style", 0],
    ["soul style", 1],
    ["pop2 style", 2]
  ]);
  return order.has(style) ? order.get(style) : 99;
}

function categoryPriority(category) {
  return category === "Minor" ? 0 : (category === "Modal" ? 1 : 99);
}

function chooseRepresentative(group) {
  const variants = [...group].sort((a, b) => a.rel.localeCompare(b.rel));
  const index = parseInt(sha256Text(group[0].familyKey).slice(0, 8), 16) % variants.length;
  return variants[index];
}

function selectFamilies(rootDir, cfg) {
  const candidates = walk(rootDir).filter(isMidi)
    .map(filePath => parseCandidate(filePath, rootDir, cfg))
    .filter(Boolean);

  const byFamily = new Map();
  for (const item of candidates) {
    if (!byFamily.has(item.familyKey)) byFamily.set(item.familyKey, []);
    byFamily.get(item.familyKey).push(item);
  }

  const families = [...byFamily.values()].map(group => ({
    representative: chooseRepresentative(group),
    variants: group.length
  }));

  families.sort((a, b) => {
    const ap = stylePriority(a.representative.style);
    const bp = stylePriority(b.representative.style);
    if (ap !== bp) return ap - bp;
    const ac = categoryPriority(a.representative.category);
    const bc = categoryPriority(b.representative.category);
    if (ac !== bc) return ac - bc;
    return a.representative.familyKey.localeCompare(b.representative.familyKey);
  });

  return {
    candidates,
    families,
    selected: families.slice(0, cfg.maxFamilies)
  };
}

function safeName(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function writeSelection(rootDir, outputDir, cfg) {
  const selection = selectFamilies(rootDir, cfg);
  fs.mkdirSync(outputDir, { recursive: true });

  for (const name of fs.readdirSync(outputDir)) {
    if (/\.(mid|midi|provenance\.json|txt|json)$/i.test(name)) {
      fs.unlinkSync(path.join(outputDir, name));
    }
  }

  fs.writeFileSync(path.join(outputDir, "LICENSE.free-midi-chords.txt"), MIT_LICENSE, "utf8");

  const written = [];
  selection.selected.forEach((family, index) => {
    const item = family.representative;
    const sourceHash = sha256File(item.filePath);
    const sourceKey = sha256Text(item.rel).slice(0, 16);
    const familyId = `free-midi-chords:${item.familyHash}`;
    const stem = `${String(index + 1).padStart(4, "0")}-${safeName(item.style)}-${item.familyHash}`;

    const midiName = `${stem}.mid`;
    const provenanceName = `${stem}.provenance.json`;

    const provenance = {
      sourceId: `free-midi-chords:${cfg.releaseTag}:${sourceKey}`,
      originType: "licensed_dataset",
      creator: cfg.creator,
      licenseId: `${cfg.licenseId}-free-midi-chords`,
      compositionFamily: familyId,
      sourceUri: cfg.downloadUrl,
      rightsEvidence: [
        `Repository ${cfg.repository} LICENSE: MIT License, Copyright (c) 2019 Ludovic Drolez.`,
        `Official release ${cfg.releaseTag}, asset ${cfg.assetName}, SHA-256 ${cfg.sha256}.`,
        `Selection policy: ${item.category} / ${item.style}; one representative transposition per progression family.`
      ],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true,
      notes: `Selected from ${item.rel}. Family variants found across keys: ${family.variants}. Source MIDI SHA-256: ${sourceHash}.`
    };

    fs.copyFileSync(item.filePath, path.join(outputDir, midiName));
    fs.writeFileSync(
      path.join(outputDir, provenanceName),
      `${JSON.stringify(provenance, null, 2)}\n`,
      "utf8"
    );

    written.push({
      midi: midiName,
      provenance: provenanceName,
      originalRelativePath: item.rel,
      category: item.category,
      style: item.style,
      keyDir: item.keyDir,
      familyId,
      transpositionVariantsFound: family.variants,
      sourceSha256: sourceHash
    });
  });

  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    source: {
      repository: cfg.repository,
      releaseTag: cfg.releaseTag,
      assetName: cfg.assetName,
      assetSha256: cfg.sha256,
      licenseId: cfg.licenseId
    },
    policy: {
      categories: cfg.categories,
      styles: cfg.styles,
      maxFamilies: cfg.maxFamilies,
      transpositionPolicy: "one-representative-per-progression-family"
    },
    totals: {
      midiCandidates: selection.candidates.length,
      progressionFamilies: selection.families.length,
      selectedFamilies: written.length
    },
    selected: written
  };

  fs.writeFileSync(
    path.join(outputDir, "selection-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );

  return report;
}

function main(argv = process.argv.slice(2)) {
  const [rootDir, outputDir, configPath, reportPath] = argv;
  if (!rootDir || !outputDir || !configPath) {
    console.error("Uso: node select-free-midi-chords.js <extracted-root> <selected-dir> <source-config.json> [report.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const cfg = readJson(configPath);
    const report = writeSelection(rootDir, outputDir, cfg);
    const target = reportPath || path.join(outputDir, "selection-report.json");
    if (path.resolve(target) !== path.resolve(path.join(outputDir, "selection-report.json"))) {
      fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    }

    console.log(`MIDI candidati: ${report.totals.midiCandidates}`);
    console.log(`Progression family uniche: ${report.totals.progressionFamilies}`);
    console.log(`Family selezionate: ${report.totals.selectedFamilies}`);
    console.log(`Output: ${path.resolve(outputDir)}`);

    if (report.totals.selectedFamilies < 24) {
      console.error("Selezione troppo piccola: struttura release inattesa o filtro troppo stretto.");
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  MIT_LICENSE,
  walk,
  parseCandidate,
  selectFamilies,
  writeSelection,
  main
};
