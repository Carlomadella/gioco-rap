"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const BASELINE = Object.freeze({
  phrases: 192,
  compositionFamilies: 54,
  sourceCollections: 4,
  drums: 114,
  "808": 61,
  harmony: 134,
  lead: 48,
  pitchedAny: 134
});

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env
  });
  if (result.error) throw result.error;
  const allowed = options.allowedCodes || [0];
  if (!allowed.includes(result.status)) {
    throw new Error(`${cmd} ${args.join(" ")} fallito (exit ${result.status})${result.stderr ? `\n${result.stderr}` : ""}`);
  }
  return result;
}

function text(cmd, args, cwd) {
  return String(run(cmd, args, { cwd, capture: true }).stdout).trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function md5(file) {
  return crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
}

function phraseFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(name => /\.phrase-item\.json$/i.test(name)).length;
}

function parseArgs(argv) {
  const out = { nrgSourceCount: 256, workspace: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--nrg-source-count") out.nrgSourceCount = Math.max(32, Number(argv[++i]) || 256);
    else if (arg === "--workspace") out.workspace = argv[++i];
    else throw new Error(`Argomento sconosciuto: ${arg}`);
  }
  return out;
}

function validateResolvedConfig(config) {
  const errors = [];
  if (!config || config.registryId !== "waivops-nrg-cp") errors.push("registryId");
  if (!config || !config.creator) errors.push("creator");
  if (!config || !config.licenseId) errors.push("licenseId");
  if (!config || !config.downloadUrl) errors.push("downloadUrl");
  if (!config || !config.assetName) errors.push("assetName");
  if (!config || !config.md5) errors.push("md5");
  if (!config || config.commercialTrainingAllowed !== true) errors.push("commercialTrainingAllowed");
  if (!config || config.commercialOutputAllowed !== true) errors.push("commercialOutputAllowed");
  if (!config || Number(config.minPitchedEvents) < 1) errors.push("minPitchedEvents");
  if (!config || !(Number(config.maxPhraseShare) > 0 && Number(config.maxPhraseShare) < 0.65)) errors.push("maxPhraseShare");
  if (errors.length) throw new Error(`Resolved NRG config incompleta: ${errors.join(", ")}`);
  return true;
}

function validateBaselineCache(workspace) {
  const reviewed = path.join(workspace, "global-reviewed-phrase-items");
  const inventoryPath = path.join(workspace, "global-inventory.json");
  const auditPath = path.join(workspace, "global-audit.json");
  const gatePath = path.join(workspace, "global-gate1-report.json");

  for (const file of [reviewed, inventoryPath, auditPath, gatePath]) {
    if (!fs.existsSync(file)) return { valid: false, reason: `missing:${file}` };
  }

  try {
    const inventory = readJson(inventoryPath);
    const audit = readJson(auditPath);
    if (audit.block5Ready !== true || audit.corpusClean !== true || audit.reviewComplete !== true) {
      return { valid: false, reason: "audit-not-clean" };
    }

    const role = inventory.roleCoverage || {};
    const exact =
      Number(inventory.totals && inventory.totals.phrases) === BASELINE.phrases &&
      Number(inventory.totals && inventory.totals.compositionFamilies) === BASELINE.compositionFamilies &&
      Number(inventory.totals && inventory.totals.sourceCollections) === BASELINE.sourceCollections &&
      Number(role.drums) === BASELINE.drums &&
      Number(role["808"]) === BASELINE["808"] &&
      Number(role.harmony) === BASELINE.harmony &&
      Number(role.lead) === BASELINE.lead &&
      Number(role.pitchedAny) === BASELINE.pitchedAny &&
      phraseFiles(reviewed) === BASELINE.phrases;

    if (!exact) return { valid: false, reason: "metrics-not-exact-baseline" };
    return { valid: true, reviewed, inventoryPath, auditPath, gatePath, inventory };
  } catch (error) {
    return { valid: false, reason: `${error.name}:${error.message}` };
  }
}

function requireFiles(files) {
  for (const file of files) if (!fs.existsSync(file)) throw new Error(`File richiesto non trovato: ${file}`);
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const repo = text("git", ["rev-parse", "--show-toplevel"], process.cwd());
  const dataset = path.join(repo, "frontend", "strumenti", "fame-neural-composer", "dataset");
  const workspace = path.resolve(options.workspace || path.join(process.env.TEMP || process.env.TMP, "fame-neural-nrg-cp-v2"));
  const baseWorkspace = path.join(process.env.TEMP || process.env.TMP, "fame-neural-corpus-expansion-v3-pdmx");

  const p = {
    pdmxRunner: path.join(dataset, "run-corpus-expansion-v3-pdmx.ps1"),
    sourceExpansion: path.join(dataset, "run-source-expansion.ps1"),
    registry: path.join(dataset, "source-registry.json"),
    registryTool: path.join(dataset, "source-registry.js"),
    downloader: path.join(dataset, "download-green-sources.js"),
    nrgAdapter: path.join(dataset, "nrg-cp-source.json"),
    selector: path.join(dataset, "select-nrg-cp.js"),
    reviewer: path.join(dataset, "review-nrg-cp.js"),
    slicer: path.join(dataset, "select-nrg-phrase-slice.js"),
    merger: path.join(dataset, "merge-phrase-corpora.js"),
    phraseCorpus: path.join(dataset, "phrase-corpus.js"),
    phraseReview: path.join(dataset, "phrase-review.js"),
    gate: path.join(dataset, "data-ready-gate.js"),
    gatePolicy: path.join(dataset, "data-ready-policy.example.json"),
    auditorOptions: path.join(dataset, "auditor-options.example.json")
  };
  requireFiles(Object.values(p));

  fs.mkdirSync(workspace, { recursive: true });

  const resolvedConfigPath = path.join(workspace, "nrg-resolved-source-config.json");
  const sourceCache = path.join(workspace, "source-cache");
  const extractDir = path.join(workspace, "nrg-extracted");
  const nrgSource = path.join(workspace, "nrg-selected-source");
  const nrgPipeline = path.join(workspace, "nrg-pipeline");
  const nrgSliceDir = path.join(workspace, "nrg-phrase-slice");
  const globalRaw = path.join(workspace, "global-raw-phrase-items");
  const globalReviewed = path.join(workspace, "global-reviewed-phrase-items");

  const selectionReport = path.join(workspace, "nrg-selection-report.json");
  const sliceReport = path.join(workspace, "nrg-phrase-slice-report.json");
  const mergeReport = path.join(workspace, "global-merge-report.json");
  const auditOptionsPath = path.join(workspace, "global-audit-options.json");
  const initialAudit = path.join(workspace, "global-audit-initial.json");
  const initialSplit = path.join(workspace, "global-split-initial.json");
  const reviewDecisions = path.join(workspace, "global-review-decisions.json");
  const reviewReport = path.join(workspace, "global-review-report.json");
  const finalAudit = path.join(workspace, "global-audit.json");
  const finalSplit = path.join(workspace, "global-split.json");
  const gateReport = path.join(workspace, "global-gate1-report.json");
  const inventoryReport = path.join(workspace, "global-inventory.json");

  console.log("=== FAME NEURAL / NRG-CP V2 / PREFLIGHT FIRST ===");
  console.log(`Repo: ${repo}`);
  console.log(`Workspace: ${workspace}`);
  console.log(`NRG source target: ${options.nrgSourceCount}`);

  console.log("\n[1/10] PREFLIGHT registry + resolved adapter...");
  run("node", [p.registryTool, "validate", p.registry], { cwd: repo });
  run("node", [p.registryTool, "resolve-adapter", p.registry, p.nrgAdapter, resolvedConfigPath], { cwd: repo });
  const config = readJson(resolvedConfigPath);
  validateResolvedConfig(config);
  console.log(`Resolved config: OK (${config.licenseId}, share cap ${config.maxPhraseShare})`);

  console.log("\n[2/10] PREFLIGHT download robusto + MD5 + tar listing...");
  run("node", [
    p.downloader,
    "--registry", p.registry,
    "--cache", sourceCache,
    "--source", "waivops-nrg-cp",
    "--rounds", "4",
    "--timeout-ms", "180000"
  ], { cwd: repo });

  const archive = path.join(sourceCache, "waivops-nrg-cp", config.assetName);
  if (!fs.existsSync(archive)) throw new Error(`Archive NRG mancante dopo downloader: ${archive}`);
  if (md5(archive).toLowerCase() !== String(config.md5).toLowerCase()) throw new Error("MD5 NRG-CP non valido.");

  const tarList = String(run("tar.exe", ["-tf", archive], { cwd: repo, capture: true }).stdout)
    .split(/\r?\n/).filter(Boolean);
  const midiInArchive = tarList.filter(name => /\.(mid|midi)$/i.test(name)).length;
  if (midiInArchive < 30000) throw new Error(`Archive NRG sospetto: solo ${midiInArchive} MIDI.`);
  console.log(`Archive NRG: MD5 OK, MIDI ${midiInArchive}`);

  console.log("\n[3/10] PREFLIGHT estrazione + selector reale FAME...");
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  run("tar.exe", ["-xf", archive, "-C", extractDir], { cwd: repo });

  fs.rmSync(nrgSource, { recursive: true, force: true });
  fs.mkdirSync(nrgSource, { recursive: true });

  // IMPORTANT: selector receives the RESOLVED config, not the adapter-only JSON.
  run("node", [
    p.selector,
    extractDir,
    nrgSource,
    resolvedConfigPath,
    selectionReport,
    String(options.nrgSourceCount)
  ], { cwd: repo });

  const selection = readJson(selectionReport);
  if (Number(selection.totals && selection.totals.selected) < options.nrgSourceCount) {
    throw new Error(`NRG selezione insufficiente: ${selection.totals.selected}/${options.nrgSourceCount}`);
  }

  console.log("\n[4/10] PREFLIGHT source expansion NRG prima della baseline...");
  fs.rmSync(nrgPipeline, { recursive: true, force: true });
  run("powershell", [
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", p.sourceExpansion,
    "-SourceDir", nrgSource,
    "-Workspace", nrgPipeline,
    "-AutoReviewScript", p.reviewer
  ], { cwd: repo });

  const nrgPhraseDir = path.join(nrgPipeline, "phrase-items");
  const nrgBuildPath = path.join(nrgPipeline, "phrase-build-report.json");
  const nrgCurationPath = path.join(nrgPipeline, "source-curation-report.json");
  requireFiles([nrgPhraseDir, nrgBuildPath, nrgCurationPath]);
  const nrgBuild = readJson(nrgBuildPath);
  const nrgCuration = readJson(nrgCurationPath);
  if (Number(nrgBuild.totals && nrgBuild.totals.phrasesProduced) < 1) throw new Error("NRG non ha prodotto phrase.");

  console.log("\n[5/10] Baseline PDMX: riuso SOLO se cache == baseline verificata...");
  let baseline = validateBaselineCache(baseWorkspace);
  if (!baseline.valid) {
    console.log(`Baseline cache non riusabile: ${baseline.reason}. Ricostruisco.`);
    run("powershell", [
      "-NoProfile", "-ExecutionPolicy", "Bypass",
      "-File", p.pdmxRunner,
      "-PdmxCount", "48",
      "-CandidatePool", "512",
      "-SeedCount", "24",
      "-Workspace", baseWorkspace
    ], { cwd: repo });
    baseline = validateBaselineCache(baseWorkspace);
    if (!baseline.valid) throw new Error(`Baseline ricostruita ma non coincide con baseline verificata: ${baseline.reason}`);
  } else {
    console.log("BASELINE CACHE: VALID, riuso senza ricostruire.");
  }

  const baseReviewed = baseline.reviewed;
  const baseInventory = baseline.inventory;

  console.log("\n[6/10] Slice NRG anti-dominance...");
  fs.rmSync(nrgSliceDir, { recursive: true, force: true });
  fs.mkdirSync(nrgSliceDir, { recursive: true });
  run("node", [
    p.slicer,
    baseReviewed,
    nrgPhraseDir,
    nrgSliceDir,
    sliceReport,
    String(config.maxPhraseShare),
    String(config.targetMinPhrases)
  ], { cwd: repo });
  const slice = readJson(sliceReport);
  if (Number(slice.totals && slice.totals.nrgSelected) < 1) throw new Error("Slice NRG vuota.");

  console.log("\n[7/10] Merge baseline + NRG...");
  fs.rmSync(globalRaw, { recursive: true, force: true });
  fs.mkdirSync(globalRaw, { recursive: true });
  run("node", [p.merger, globalRaw, mergeReport, baseReviewed, nrgSliceDir], { cwd: repo });

  const auditorCfg = readJson(p.auditorOptions);
  fs.writeFileSync(auditOptionsPath, `${JSON.stringify({
    targetMinPhrases: 500,
    similarity: auditorCfg.similarity,
    quality: auditorCfg.quality
  }, null, 2)}\n`, "utf8");

  console.log("\n[8/10] Audit + review globale...");
  run("node", [p.phraseCorpus, globalRaw, initialAudit, initialSplit, auditOptionsPath], { cwd: repo });
  fs.rmSync(globalReviewed, { recursive: true, force: true });
  fs.mkdirSync(globalReviewed, { recursive: true });
  run("node", [p.phraseReview, globalRaw, initialAudit, globalReviewed, reviewDecisions, reviewReport], { cwd: repo });

  console.log("\n[9/10] Re-audit reviewed...");
  run("node", [p.phraseCorpus, globalReviewed, finalAudit, finalSplit, auditOptionsPath, reviewDecisions], { cwd: repo });
  const finalAuditData = readJson(finalAudit);
  if (finalAuditData.block5Ready !== true) throw new Error("BLOCCO 5 non READY dopo NRG.");
  if (finalAuditData.corpusClean !== true) throw new Error(`Corpus NRG non clean: ${(finalAuditData.corpusIssues || []).join(" | ")}`);
  if (finalAuditData.reviewComplete !== true) throw new Error("Review NRG non completa.");

  console.log("\n[10/10] Gate 1 globale...");
  run("node", [p.gate, globalReviewed, finalAudit, gateReport, p.gatePolicy, inventoryReport], { cwd: repo });
  const inventory = readJson(inventoryReport);
  const gate = readJson(gateReport);
  const review = readJson(reviewReport);

  if (Number(inventory.totals.sourceCollections) < 5) throw new Error("NRG non entra come quinta source collection.");
  if (Number(inventory.totals.phrases) <= Number(baseInventory.totals.phrases)) throw new Error("NRG non aumenta il corpus.");
  if (Number(inventory.roleCoverage.harmony) < Number(baseInventory.roleCoverage.harmony)) throw new Error("NRG regressione harmony.");
  if (Number(inventory.roleCoverage.pitchedAny) < Number(baseInventory.roleCoverage.pitchedAny)) throw new Error("NRG regressione pitchedAny.");

  for (const blocker of gate.blockers || []) {
    if (/^source collection dominante/.test(String(blocker))) throw new Error(`NRG source dominance: ${blocker}`);
    if (/^review phrase non completata/.test(String(blocker))) throw new Error(`NRG review riaperta: ${blocker}`);
  }

  console.log("\nNRG-CP V2: PIPELINE COMPLETATA");
  console.log(`NRG MIDI archive: ${midiInArchive}`);
  console.log(`NRG source selected: ${selection.totals.selected}`);
  console.log(`NRG source accepted: ${nrgCuration.totals.accepted}`);
  console.log(`NRG phrase produced: ${nrgBuild.totals.phrasesProduced}`);
  console.log(`NRG phrase slice: ${slice.totals.nrgSelected}`);
  console.log(`Global phrase rejected: ${review.totals.rejectedTotal}`);
  console.log(`Phrase globali: ${inventory.totals.phrases}`);
  console.log(`Composition family: ${inventory.totals.compositionFamilies}`);
  console.log(`Source collections: ${inventory.totals.sourceCollections}`);
  console.log(`Coverage drums/808/harmony/lead: ${inventory.roleCoverage.drums}/${inventory.roleCoverage["808"]}/${inventory.roleCoverage.harmony}/${inventory.roleCoverage.lead}`);
  console.log(`Coverage pitchedAny: ${inventory.roleCoverage.pitchedAny}`);
  console.log(`GATE 1 DATA READY: ${gate.ready ? "READY" : "ANCORA APERTO"}`);
  if (!gate.ready) {
    console.log("Blocker residui:");
    for (const blocker of gate.blockers || []) console.log(` - ${blocker}`);
  }
  console.log(`Gate report: ${gateReport}`);
  console.log(`Inventory: ${inventoryReport}`);

  return { inventory, gate, selection, slice };
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  BASELINE,
  run,
  text,
  readJson,
  md5,
  phraseFiles,
  parseArgs,
  validateResolvedConfig,
  validateBaselineCache,
  requireFiles,
  main
};
