"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validateProvenance } = require("../midi/provenance");

const INTAKE_SCHEMA = "fame-neural-source-intake-report-v1";

function isMidiFile(name) {
  return /\.(mid|midi)$/i.test(name);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(rootDir) {
  const out = [];
  const stack = [path.resolve(rootDir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) out.push(fullPath);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function sidecarCandidates(midiPath) {
  const ext = path.extname(midiPath);
  const stem = midiPath.slice(0, -ext.length);
  return [
    `${stem}.provenance.json`,
    `${midiPath}.provenance.json`
  ];
}

function findSidecar(midiPath) {
  return sidecarCandidates(midiPath).find(candidate => fs.existsSync(candidate)) || null;
}

function safeStem(value) {
  return String(value || "source")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "source";
}

function fileSha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function outputNames(midiPath, provenance) {
  const hash = fileSha256(midiPath);
  const sourceId = safeStem(provenance.sourceId);
  const family = safeStem(provenance.compositionFamily);
  const stem = `${sourceId}__${family}__${hash.slice(0, 12)}`;
  return {
    midi: `${stem}.mid`,
    sidecar: `${stem}.provenance.json`,
    sha256: hash
  };
}

function analyzeSource(midiPath, rootDir) {
  const relativePath = path.relative(rootDir, midiPath).replace(/\\/g, "/");
  const sidecarPath = findSidecar(midiPath);
  if (!sidecarPath) {
    return {
      relativePath,
      sourcePath: midiPath,
      status: "missing-provenance",
      sidecarPath: null,
      provenance: null,
      errors: ["provenance sidecar mancante"]
    };
  }

  try {
    const raw = readJson(sidecarPath);
    const validation = validateProvenance(raw);
    let status = "invalid-provenance";
    if (validation.valid && validation.commerciallyCleared) status = "commercial-cleared";
    else if (validation.valid) status = "analysis-only";

    return {
      relativePath,
      sourcePath: midiPath,
      status,
      sidecarPath,
      provenance: validation.record,
      errors: validation.errors
    };
  } catch (error) {
    return {
      relativePath,
      sourcePath: midiPath,
      status: "invalid-provenance",
      sidecarPath,
      provenance: null,
      errors: [`${error.name || "Error"}: ${error.message}`]
    };
  }
}

function buildIntakePlan(rootDir) {
  const absoluteRoot = path.resolve(rootDir);
  const midiFiles = walkFiles(absoluteRoot).filter(isMidiFile);
  const items = midiFiles.map(filePath => analyzeSource(filePath, absoluteRoot));

  const totals = {
    discovered: items.length,
    commercialCleared: items.filter(item => item.status === "commercial-cleared").length,
    analysisOnly: items.filter(item => item.status === "analysis-only").length,
    missingProvenance: items.filter(item => item.status === "missing-provenance").length,
    invalidProvenance: items.filter(item => item.status === "invalid-provenance").length
  };

  return {
    schema: INTAKE_SCHEMA,
    version: 1,
    sourceRoot: absoluteRoot,
    totals,
    items
  };
}

function stageCommercialSources(plan, stagingDir) {
  fs.mkdirSync(stagingDir, { recursive: true });

  for (const name of fs.readdirSync(stagingDir)) {
    if (/\.(mid|midi|provenance\.json)$/i.test(name)) {
      fs.unlinkSync(path.join(stagingDir, name));
    }
  }

  const staged = [];
  const collisions = new Map();

  for (const item of plan.items) {
    if (item.status !== "commercial-cleared" || !item.provenance) continue;

    const names = outputNames(item.sourcePath, item.provenance);
    if (collisions.has(names.midi)) {
      throw new Error(`collisione intake: ${names.midi} tra ${collisions.get(names.midi)} e ${item.relativePath}`);
    }
    collisions.set(names.midi, item.relativePath);

    const midiOut = path.join(stagingDir, names.midi);
    const sidecarOut = path.join(stagingDir, names.sidecar);

    fs.copyFileSync(item.sourcePath, midiOut);
    fs.writeFileSync(sidecarOut, `${JSON.stringify(item.provenance, null, 2)}\n`, "utf8");

    staged.push({
      relativePath: item.relativePath,
      sourceId: item.provenance.sourceId,
      compositionFamily: item.provenance.compositionFamily,
      licenseId: item.provenance.licenseId,
      sha256: names.sha256,
      stagedMidi: names.midi,
      stagedSidecar: names.sidecar
    });
  }

  return staged;
}

function main(argv = process.argv.slice(2)) {
  const [sourceDir, stagingDir, reportPath] = argv;
  if (!sourceDir || !stagingDir || !reportPath) {
    console.error("Uso: node source-intake.js <source-dir> <commercial-staging-dir> <report.json>");
    process.exitCode = 64;
    return;
  }

  try {
    const plan = buildIntakePlan(sourceDir);
    const staged = stageCommercialSources(plan, stagingDir);
    const report = { ...plan, stagedCommercialSources: staged };

    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(`MIDI trovati: ${report.totals.discovered}`);
    console.log(`Commercial cleared: ${report.totals.commercialCleared}`);
    console.log(`Analysis-only: ${report.totals.analysisOnly}`);
    console.log(`Missing provenance: ${report.totals.missingProvenance}`);
    console.log(`Invalid provenance: ${report.totals.invalidProvenance}`);
    console.log(`Staged per training: ${staged.length}`);
    console.log(`Report: ${reportPath}`);

    if (!report.totals.discovered) process.exitCode = 4;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  INTAKE_SCHEMA,
  isMidiFile,
  walkFiles,
  sidecarCandidates,
  findSidecar,
  safeStem,
  fileSha256,
  outputNames,
  analyzeSource,
  buildIntakePlan,
  stageCommercialSources,
  main
};
