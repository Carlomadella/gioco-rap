"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PLAN_SCHEMA = "fame-neural-pdmx-selection-plan-v1";
const REPORT_SCHEMA = "fame-neural-pdmx-selection-report-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function walk(root) {
  const out = [];
  const stack = [path.resolve(root)];
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

function findByBasename(root, basename) {
  return walk(root).find(file => path.basename(file).toLowerCase() === basename.toLowerCase()) || null;
}

function normalizeSubsetLine(line) {
  let value = String(line || "").replace(/^\uFEFF/, "").trim().replace(/\\/g, "/");
  if (!value) return null;
  value = value.replace(/^\.\//, "");
  if (value.startsWith("data/")) value = value.slice("data/".length);
  value = value.replace(/\.json$/i, "");
  return value || null;
}

function readSubset(file) {
  return new Set(
    fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map(normalizeSubsetLine)
      .filter(Boolean)
  );
}

function normalizeArchiveEntry(line) {
  return String(line || "").replace(/^\uFEFF/, "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function archiveKey(entry) {
  const normalized = normalizeArchiveEntry(entry);
  const marker = "mid/";
  const index = normalized.toLowerCase().indexOf(marker);
  if (index < 0 || !/\.mid$/i.test(normalized)) return null;
  return normalized.slice(index + marker.length).replace(/\.mid$/i, "");
}

function loadArchiveIndex(listingFile) {
  const byKey = new Map();
  const lines = fs.readFileSync(listingFile, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const entry = normalizeArchiveEntry(raw);
    const key = archiveKey(entry);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, entry);
  }
  return byKey;
}

function intersection(...sets) {
  if (!sets.length) return [];
  return [...sets[0]].filter(value => sets.slice(1).every(set => set.has(value)));
}

function buildPlan(subsetRoot, archiveListing, config, requestedCount) {
  const required = config.requiredSubsets || [];
  const files = {};
  for (const name of required) {
    const found = findByBasename(subsetRoot, name);
    if (!found) throw new Error(`Subset PDMX mancante: ${name}`);
    files[name] = found;
  }

  const noConflict = readSubset(files["no_license_conflict.txt"]);
  const deduplicated = readSubset(files["deduplicated.txt"]);
  const allValid = readSubset(files["all_valid.txt"]);
  const archiveIndex = loadArchiveIndex(archiveListing);

  const eligible = intersection(noConflict, deduplicated, allValid);
  const available = eligible
    .filter(key => archiveIndex.has(key))
    .map(key => ({
      key,
      archiveEntry: archiveIndex.get(key),
      rank: sha256(`fame-neural-pdmx-v1:${key}`)
    }))
    .sort((a, b) => a.rank.localeCompare(b.rank) || a.key.localeCompare(b.key));

  const count = Math.max(1, Math.min(Number(requestedCount) || config.defaultSelectionCount || 48, available.length));
  const selected = available.slice(0, count).map((row, index) => {
    const idHash = sha256(row.key);
    return {
      index,
      key: row.key,
      archiveEntry: row.archiveEntry,
      sourceId: `pdmx-v2025:${idHash.slice(0, 20)}`,
      compositionFamily: `pdmx:${idHash.slice(0, 24)}`,
      originalDataPath: `./data/${row.key}.json`,
      rank: row.rank
    };
  });

  return {
    schema: PLAN_SCHEMA,
    version: 1,
    source: {
      recordId: config.recordId,
      recordUrl: config.recordUrl,
      repositoryUrl: config.repositoryUrl,
      licenseId: config.licenseId
    },
    totals: {
      noLicenseConflict: noConflict.size,
      deduplicated: deduplicated.size,
      allValid: allValid.size,
      eligibleIntersection: eligible.length,
      availableMidi: available.length,
      requested: Number(requestedCount) || config.defaultSelectionCount || 48,
      selected: selected.length
    },
    selected
  };
}

function safeStem(value) {
  return String(value || "pdmx")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pdmx";
}

function materialize(plan, extractedRoot, outputDir, config) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (/\.(mid|midi|provenance\.json)$/i.test(name)) fs.unlinkSync(path.join(outputDir, name));
  }

  const rows = [];
  for (const item of plan.selected || []) {
    const candidate = path.join(extractedRoot, ...normalizeArchiveEntry(item.archiveEntry).split("/"));
    if (!fs.existsSync(candidate)) {
      throw new Error(`MIDI PDMX estratto non trovato: ${candidate}`);
    }

    const hash = sha256(item.key);
    const stem = `${String(item.index + 1).padStart(4, "0")}-${hash.slice(0, 16)}-${safeStem(path.basename(item.key))}`;
    const midiName = `${stem}.mid`;
    const sidecarName = `${stem}.provenance.json`;

    fs.copyFileSync(candidate, path.join(outputDir, midiName));

    const provenance = {
      sourceId: item.sourceId,
      originType: "public_domain",
      creator: "Public-domain score contributor (via PDMX)",
      licenseId: config.licenseId,
      compositionFamily: item.compositionFamily,
      sourceUri: config.recordUrl,
      rightsEvidence: [
        ...(Array.isArray(config.rightsEvidence) ? config.rightsEvidence : []),
        `PDMX subset:no_license_conflict + subset:deduplicated + subset:all_valid; ${item.originalDataPath}`
      ],
      commercialTrainingAllowed: true,
      commercialOutputAllowed: true,
      notes: "Selected from PDMX only after intersection of no_license_conflict, deduplicated and all_valid subsets."
    };
    fs.writeFileSync(path.join(outputDir, sidecarName), `${JSON.stringify(provenance, null, 2)}\n`, "utf8");

    rows.push({
      key: item.key,
      archiveEntry: item.archiveEntry,
      midi: midiName,
      provenance: sidecarName,
      sourceId: item.sourceId,
      compositionFamily: item.compositionFamily
    });
  }

  return {
    schema: REPORT_SCHEMA,
    version: 1,
    totals: {
      selected: rows.length
    },
    items: rows
  };
}

function main(argv = process.argv.slice(2)) {
  const [mode, ...rest] = argv;

  try {
    if (mode === "plan") {
      const [subsetRoot, archiveListing, configPath, planPath, tarListPath, countRaw] = rest;
      if (!subsetRoot || !archiveListing || !configPath || !planPath || !tarListPath) {
        throw new Error("Uso plan: select-pdmx.js plan <subset-root> <mid-listing.txt> <config.json> <plan.json> <tar-list.txt> [count]");
      }
      const config = readJson(configPath);
      const plan = buildPlan(subsetRoot, archiveListing, config, Number(countRaw) || config.defaultSelectionCount || 48);
      if (plan.totals.selected < 1) throw new Error("Nessun MIDI PDMX selezionabile.");
      fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
      fs.writeFileSync(tarListPath, `${plan.selected.map(x => x.archiveEntry).join("\n")}\n`, "utf8");
      console.log(`PDMX no_license_conflict: ${plan.totals.noLicenseConflict}`);
      console.log(`PDMX deduplicated: ${plan.totals.deduplicated}`);
      console.log(`PDMX all_valid: ${plan.totals.allValid}`);
      console.log(`Intersezione sicura con MIDI: ${plan.totals.availableMidi}`);
      console.log(`Selezionati: ${plan.totals.selected}`);
      console.log(`Plan: ${planPath}`);
      return;
    }

    if (mode === "materialize") {
      const [planPath, extractedRoot, outputDir, configPath, reportPath] = rest;
      if (!planPath || !extractedRoot || !outputDir || !configPath || !reportPath) {
        throw new Error("Uso materialize: select-pdmx.js materialize <plan.json> <extract-root> <output-dir> <config.json> <report.json>");
      }
      const report = materialize(readJson(planPath), extractedRoot, outputDir, readJson(configPath));
      fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      console.log(`PDMX materializzati: ${report.totals.selected}`);
      console.log(`Report: ${reportPath}`);
      return;
    }

    throw new Error("Modo richiesto: plan | materialize");
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  PLAN_SCHEMA,
  REPORT_SCHEMA,
  normalizeSubsetLine,
  readSubset,
  normalizeArchiveEntry,
  archiveKey,
  loadArchiveIndex,
  intersection,
  buildPlan,
  materialize,
  main
};
