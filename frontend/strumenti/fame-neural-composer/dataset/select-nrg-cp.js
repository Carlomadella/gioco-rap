"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { importMidiFile } = require("../midi/import-midi");
const { itemFingerprint, eventSummary } = require("./fingerprint");

const REPORT_SCHEMA = "fame-neural-nrg-cp-selection-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

function isMidi(file) {
  return /\.(mid|midi)$/i.test(file);
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function safeStem(value) {
  return String(value || "nrg")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "nrg";
}

function provisionalProvenance(cfg, rel, index) {
  const key = sha256Text(rel);
  return {
    sourceId: `waivops-nrg-cp:probe:${key.slice(0, 20)}`,
    originType: "licensed_dataset",
    creator: cfg.creator,
    licenseId: cfg.licenseId,
    compositionFamily: `waivops-nrg-cp:probe:${key.slice(0, 24)}`,
    sourceUri: cfg.downloadUrl,
    rightsEvidence: [
      `WaivOps NRG-CP Zenodo record ${cfg.zenodoRecord}, DOI ${cfg.doi}.`,
      `NRG-CP license: ${cfg.licenseId}.`,
      `Archive ${cfg.assetName}, MD5 ${cfg.md5}.`
    ],
    commercialTrainingAllowed: true,
    commercialOutputAllowed: true,
    notes: `Compatibility probe ${index}: ${rel}`
  };
}

function classifyImportedItem(item, minPitchedEvents) {
  const summary = eventSummary(item);
  const technical = !!(item && item.eligibility && item.eligibility.technical === true);
  const commercial = !!(item && item.eligibility && item.eligibility.commercialTraining === true);
  const harmony = Number(summary.byType && summary.byType.harmony || 0);
  const lead = Number(summary.byType && summary.byType.lead || 0);
  const pitched = Number(summary.pitchedEvents || 0);

  if (!technical) return { accepted: false, reason: "technical-blocked", summary };
  if (!commercial) return { accepted: false, reason: "rights-blocked", summary };
  if (pitched < minPitchedEvents) {
    return { accepted: false, reason: `insufficient-pitched:${pitched}<${minPitchedEvents}`, summary };
  }
  if (harmony < 1 && lead < 1) {
    return { accepted: false, reason: "no-harmony-or-lead", summary };
  }

  const familyFingerprint = itemFingerprint(item, "transposition", { minPitchedEvents });
  if (!familyFingerprint) return { accepted: false, reason: "no-transposition-fingerprint", summary };

  return {
    accepted: true,
    reason: "compatible-pitched",
    summary,
    familyFingerprint
  };
}

function deterministicCandidates(rootDir) {
  return walk(rootDir)
    .filter(isMidi)
    .map(filePath => {
      const rel = path.relative(rootDir, filePath).replace(/\\/g, "/");
      return {
        filePath,
        rel,
        rank: sha256Text(`fame-neural-nrg-cp-v1:${rel}`)
      };
    })
    .sort((a, b) => a.rank.localeCompare(b.rank) || a.rel.localeCompare(b.rel));
}

function selectSources(rootDir, outputDir, cfg, targetSources = cfg.targetSources || 256) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (/\.(mid|midi|provenance\.json|json|txt)$/i.test(name)) {
      fs.unlinkSync(path.join(outputDir, name));
    }
  }

  const candidates = deterministicCandidates(rootDir);
  const familySeen = new Set();
  const written = [];
  const rejectReasons = {};
  const technicalErrorCodes = {};

  for (let i = 0; i < candidates.length && written.length < targetSources; i += 1) {
    const candidate = candidates[i];
    try {
      const probe = importMidiFile(
        candidate.filePath,
        provisionalProvenance(cfg, candidate.rel, i),
        {}
      );
      const verdict = classifyImportedItem(probe, Number(cfg.minPitchedEvents) || 8);

      for (const error of probe && probe.import && probe.import.errors || []) {
        const code = String(error && error.code || "UNKNOWN");
        technicalErrorCodes[code] = (technicalErrorCodes[code] || 0) + 1;
      }

      if (!verdict.accepted) {
        rejectReasons[verdict.reason] = (rejectReasons[verdict.reason] || 0) + 1;
        continue;
      }

      if (familySeen.has(verdict.familyFingerprint)) {
        rejectReasons["transposition-family-duplicate"] =
          (rejectReasons["transposition-family-duplicate"] || 0) + 1;
        continue;
      }
      familySeen.add(verdict.familyFingerprint);

      const fileHash = sha256File(candidate.filePath);
      const sourceKey = sha256Text(candidate.rel).slice(0, 18);
      const familyId = `waivops-nrg-cp:${verdict.familyFingerprint.slice(0, 24)}`;
      const stem = `${String(written.length + 1).padStart(4, "0")}-${verdict.familyFingerprint.slice(0, 16)}-${safeStem(path.basename(candidate.rel, path.extname(candidate.rel)))}`;
      const midiName = `${stem}.mid`;
      const provenanceName = `${stem}.provenance.json`;

      const provenance = {
        sourceId: `waivops-nrg-cp:v1:${sourceKey}`,
        originType: "licensed_dataset",
        creator: cfg.creator,
        licenseId: cfg.licenseId,
        compositionFamily: familyId,
        sourceUri: cfg.downloadUrl,
        rightsEvidence: [
          `WaivOps NRG-CP Zenodo record ${cfg.zenodoRecord}, DOI ${cfg.doi}; licensed ${cfg.licenseId}.`,
          `Official archive ${cfg.assetName}; verified MD5 ${cfg.md5}.`,
          `Repository ${cfg.repository}: NRG-CP contains 8-bar rhythmic chord progression MIDI generated from a progression database and custom rhythm code.`,
          `FAME selection: one representative per full-sequence transposition fingerprint ${verdict.familyFingerprint}.`
        ],
        commercialTrainingAllowed: true,
        commercialOutputAllowed: true,
        notes: `Selected from ${candidate.rel}. Source MIDI SHA-256 ${fileHash}. Summary ${JSON.stringify(verdict.summary)}.`
      };

      fs.copyFileSync(candidate.filePath, path.join(outputDir, midiName));
      fs.writeFileSync(
        path.join(outputDir, provenanceName),
        `${JSON.stringify(provenance, null, 2)}\n`,
        "utf8"
      );

      written.push({
        midi: midiName,
        provenance: provenanceName,
        originalRelativePath: candidate.rel,
        sourceSha256: fileHash,
        compositionFamily: familyId,
        transpositionFingerprint: verdict.familyFingerprint,
        summary: verdict.summary
      });
    } catch (error) {
      const reason = `import-failed:${error.name || "Error"}`;
      rejectReasons[reason] = (rejectReasons[reason] || 0) + 1;
    }
  }

  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    source: {
      repository: cfg.repository,
      zenodoRecord: cfg.zenodoRecord,
      doi: cfg.doi,
      assetName: cfg.assetName,
      md5: cfg.md5,
      licenseId: cfg.licenseId
    },
    policy: {
      targetSources,
      minPitchedEvents: Number(cfg.minPitchedEvents) || 8,
      deterministicOrdering: "sha256(relative-path)",
      familyPolicy: "one-source-per-full-sequence-transposition-fingerprint",
      compatibilityPolicy: "real-fame-importer + commercial-training + pitched/harmony"
    },
    totals: {
      midiDiscovered: candidates.length,
      examined: Object.values(rejectReasons).reduce((a, b) => a + b, 0) + written.length,
      selected: written.length
    },
    rejectReasons,
    technicalErrorCodes,
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
  const [rootDir, outputDir, configPath, reportPath, targetRaw] = argv;
  if (!rootDir || !outputDir || !configPath) {
    console.error("Uso: node select-nrg-cp.js <extracted-root> <selected-dir> <source-config.json> [report.json] [targetSources]");
    process.exitCode = 64;
    return;
  }

  try {
    const cfg = readJson(configPath);
    const target = Math.max(8, Number(targetRaw) || Number(cfg.targetSources) || 256);
    const report = selectSources(rootDir, outputDir, cfg, target);
    const targetReport = reportPath || path.join(outputDir, "selection-report.json");
    if (path.resolve(targetReport) !== path.resolve(path.join(outputDir, "selection-report.json"))) {
      fs.writeFileSync(targetReport, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    }

    console.log(`NRG-CP MIDI discovered: ${report.totals.midiDiscovered}`);
    console.log(`NRG-CP examined: ${report.totals.examined}`);
    console.log(`NRG-CP selected: ${report.totals.selected}`);
    console.log(`Reject reasons: ${JSON.stringify(report.rejectReasons)}`);
    console.log(`Technical error codes: ${JSON.stringify(report.technicalErrorCodes)}`);
    console.log(`Report: ${targetReport}`);

    if (report.totals.selected < target) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  walk,
  isMidi,
  sha256Text,
  provisionalProvenance,
  classifyImportedItem,
  deterministicCandidates,
  selectSources,
  main
};
