"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { buildRegistryCollections, scanCorpus } = require("./select-pdmx-volume-slice");

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env,
    timeout: Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : undefined,
    killSignal: "SIGTERM"
  });
  if (result.error) {
    const error = new Error(`${cmd} ${args.join(" ")} errore: ${result.error.message}`);
    error.result = result;
    throw error;
  }
  if (!(options.allowedCodes || [0]).includes(result.status)) {
    const error = new Error(`${cmd} ${args.join(" ")} fallito (exit ${result.status})${result.stderr ? `\n${result.stderr}` : ""}`);
    error.result = result;
    throw error;
  }
  return result;
}

function runToFile(cmd, args, outputFile, options = {}) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const fd = fs.openSync(outputFile, "w");
  try {
    const result = spawnSync(cmd, args, {
      cwd: options.cwd || process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", fd, "pipe"],
      env: process.env,
      timeout: Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : undefined,
      killSignal: "SIGTERM"
    });
    if (result.error) {
      const error = new Error(`${cmd} ${args.join(" ")} errore: ${result.error.message}`);
      error.result = result;
      throw error;
    }
    if (!(options.allowedCodes || [0]).includes(result.status)) {
      const error = new Error(`${cmd} ${args.join(" ")} fallito (exit ${result.status})${result.stderr ? `\n${result.stderr}` : ""}`);
      error.result = result;
      throw error;
    }
    return result;
  } finally {
    fs.closeSync(fd);
  }
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

function phraseFileCount(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(name => /\.phrase-item\.json$/i.test(name)).length;
}

function phraseManifestSha256(dir) {
  const ids = fs.readdirSync(dir)
    .filter(name => /\.phrase-item\.json$/i.test(name))
    .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")))
    .map(item => String(item && item.phraseId || ""))
    .filter(Boolean)
    .sort();
  return crypto.createHash("sha256").update(`${ids.join("\n")}\n`).digest("hex");
}

function assertReplayAttempt(attemptIndex, config, sliceDir, reviewedDir, inventory, pdmxCount, syntheticCount) {
  const replay = config.replayVerification || {};
  const expectedAttempt = Array.isArray(replay.attempts) ? replay.attempts[attemptIndex] : null;
  if (!expectedAttempt) throw new Error(`Replay verification attempt mancante: ${attemptIndex}`);

  const actualSliceHash = phraseManifestSha256(sliceDir);
  if (actualSliceHash !== expectedAttempt.sliceManifestSha256) {
    throw new Error(`Replay slice manifest mismatch attempt ${attemptIndex + 1}: ${actualSliceHash}`);
  }

  const actualFinalHash = phraseManifestSha256(reviewedDir);
  if (actualFinalHash !== expectedAttempt.finalReviewedManifestSha256) {
    throw new Error(`Replay final manifest mismatch attempt ${attemptIndex + 1}: ${actualFinalHash}`);
  }

  const expected = expectedAttempt.expected || {};
  const role = inventory.roleCoverage || {};
  const checks = [
    ["phrases", inventory.totals && inventory.totals.phrases, expected.phrases],
    ["compositionFamilies", inventory.totals && inventory.totals.compositionFamilies, expected.compositionFamilies],
    ["sourceCollections", inventory.totals && inventory.totals.sourceCollections, expected.sourceCollections],
    ["drums", role.drums, expected.drums],
    ["808", role["808"], expected["808"]],
    ["harmony", role.harmony, expected.harmony],
    ["lead", role.lead, expected.lead],
    ["pitchedAny", role.pitchedAny, expected.pitchedAny],
    ["pdmxCount", pdmxCount, expected.pdmxCount],
    ["syntheticCount", syntheticCount, expected.syntheticCount]
  ];
  for (const [name, actual, wanted] of checks) {
    if (Number(actual) !== Number(wanted)) {
      throw new Error(`Replay metric mismatch ${name}: ${actual} != ${wanted}`);
    }
  }
  return { sliceManifestSha256: actualSliceHash, finalReviewedManifestSha256: actualFinalHash };
}

function validateBaseline(workspace, expected) {
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
    const role = inventory.roleCoverage || {};
    const exact =
      phraseFileCount(reviewed) === Number(expected.phrases) &&
      Number(inventory.totals.phrases) === Number(expected.phrases) &&
      Number(inventory.totals.compositionFamilies) === Number(expected.compositionFamilies) &&
      Number(inventory.totals.sourceCollections) === Number(expected.sourceCollections) &&
      Number(role.drums) === Number(expected.roleCoverage.drums) &&
      Number(role["808"]) === Number(expected.roleCoverage["808"]) &&
      Number(role.harmony) === Number(expected.roleCoverage.harmony) &&
      Number(role.lead) === Number(expected.roleCoverage.lead) &&
      Number(role.pitchedAny) === Number(expected.roleCoverage.pitchedAny) &&
      audit.block5Ready === true &&
      audit.corpusClean === true &&
      audit.reviewComplete === true;

    if (!exact) return { valid: false, reason: "metrics-not-exact-451bdb7-baseline" };
    return { valid: true, reviewed, inventoryPath, auditPath, gatePath, inventory };
  } catch (error) {
    return { valid: false, reason: `${error.name}:${error.message}` };
  }
}

function cacheAssetIfValid(source, target, expectedMd5) {
  if (!source || !fs.existsSync(source)) return false;
  if (md5(source).toLowerCase() !== String(expectedMd5).toLowerCase()) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function sourceShareBlocker(gate) {
  return (gate.blockers || []).find(value => /^source collection dominante/.test(String(value))) || null;
}

function roleGatesRemainClosed(inventory, config) {
  const role = inventory.roleCoverage || {};
  return Number(role.drums) >= 150
    && Number(role["808"]) >= 75
    && Number(role.harmony) >= 75
    && Number(role.lead) >= 75
    && Number(role.pitchedAny) >= 150;
}

function main() {
  const repo = text("git", ["rev-parse", "--show-toplevel"], process.cwd());
  const fameRoot = path.join(repo, "frontend", "strumenti", "fame-neural-composer");
  const dataset = path.join(fameRoot, "dataset");
  const configPath = path.join(dataset, "pdmx-volume-closer.json");
  const config = readJson(configPath);

  const workspace = path.join(process.env.TEMP || process.env.TMP, "fame-neural-pdmx-volume-closer-v1");
  const baselineWorkspace = path.join(process.env.TEMP || process.env.TMP, "fame-neural-hiphopdrummer-v1");
  const oldPdmxWorkspace = path.join(process.env.TEMP || process.env.TMP, "fame-neural-corpus-expansion-v3-pdmx");
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || process.cwd(), "AppData", "Local");
  const sourceCache = path.join(localAppData, "FAME-Neural", "source-cache");

  const p = {
    hhdRunner: path.join(dataset, "run-hiphopdrummer-expansion-v1.js"),
    registry: path.join(dataset, "source-registry.json"),
    registryTool: path.join(dataset, "source-registry.js"),
    downloader: path.join(dataset, "download-green-sources.js"),
    pdmxConfig: path.join(dataset, "pdmx-source.json"),
    selector: path.join(dataset, "select-pdmx.js"),
    incrementalFilter: path.join(dataset, "filter-pdmx-incremental-compatible.js"),
    reviewer: path.join(dataset, "review-pdmx.js"),
    sourceExpansion: path.join(dataset, "run-source-expansion.ps1"),
    slicer: path.join(dataset, "select-pdmx-volume-slice.js"),
    merger: path.join(dataset, "merge-phrase-corpora.js"),
    phraseCorpus: path.join(dataset, "phrase-corpus.js"),
    phraseReview: path.join(dataset, "phrase-review.js"),
    gate: path.join(dataset, "data-ready-gate.js"),
    gatePolicy: path.join(dataset, "data-ready-policy.example.json"),
    auditorOptions: path.join(dataset, "auditor-options.example.json")
  };

  for (const file of Object.values(p)) {
    if (!fs.existsSync(file)) throw new Error(`File richiesto mancante: ${file}`);
  }

  fs.mkdirSync(workspace, { recursive: true });

  console.log("=== FAME NEURAL / PDMX VOLUME CLOSER V1 / CHECKED ===");
  console.log(`Workspace: ${workspace}`);

  console.log("\n[1/11] Registry + PDMX rights/asset preflight...");
  run("node", [p.registryTool, "validate", p.registry], { cwd: repo });
  const registryJson = readJson(p.registry);
  const pdmxRegistry = (registryJson.sources || []).find(source => source.id === "pdmx-v2025");
  if (!pdmxRegistry || pdmxRegistry.status !== "green") throw new Error("PDMX non GREEN nel Source Registry.");
  if (pdmxRegistry.rights.commercialTrainingAllowed !== true || pdmxRegistry.rights.commercialOutputAllowed !== true) {
    throw new Error("PDMX rights non commercial-cleared.");
  }
  const midiAsset = pdmxRegistry.download.assets.find(x => x.id === "midi");
  const subsetAsset = pdmxRegistry.download.assets.find(x => x.id === "subset-paths");
  if (!midiAsset || !subsetAsset) throw new Error("PDMX asset mancanti dal Source Registry.");
  if (!Array.isArray(midiAsset.mirrors) || midiAsset.mirrors.length < 2) throw new Error("PDMX MIDI mirror non configurati.");
  if (!Array.isArray(subsetAsset.mirrors) || subsetAsset.mirrors.length < 2) throw new Error("PDMX subset mirror non configurati.");

  console.log("\n[2/11] Seed cache PDMX vecchia se valida + downloader robusto...");
  const pdmxCache = path.join(sourceCache, "pdmx-v2025");
  const cachedMidi = path.join(pdmxCache, midiAsset.name);
  const cachedSubset = path.join(pdmxCache, subsetAsset.name);
  const oldDownload = path.join(oldPdmxWorkspace, "download");

  if (!fs.existsSync(cachedMidi)) {
    if (cacheAssetIfValid(path.join(oldDownload, midiAsset.name), cachedMidi, midiAsset.hash.value)) {
      console.log("Seed cache: riuso mid.tar.gz verificato dal precedente PDMX workspace.");
    }
  }
  if (!fs.existsSync(cachedSubset)) {
    if (cacheAssetIfValid(path.join(oldDownload, subsetAsset.name), cachedSubset, subsetAsset.hash.value)) {
      console.log("Seed cache: riuso subset_paths.tar.gz verificato dal precedente PDMX workspace.");
    }
  }

  run("node", [
    p.downloader,
    "--registry", p.registry,
    "--cache", sourceCache,
    "--source", "pdmx-v2025",
    "--rounds", "4",
    "--timeout-ms", "240000"
  ], { cwd: repo });

  if (md5(cachedMidi).toLowerCase() !== String(midiAsset.hash.value).toLowerCase()) throw new Error("PDMX MIDI MD5 non valido.");
  if (md5(cachedSubset).toLowerCase() !== String(subsetAsset.hash.value).toLowerCase()) throw new Error("PDMX subset MD5 non valido.");

  console.log("\n[3/11] Subset extract + MIDI archive listing...");
  const subsetExtract = path.join(workspace, "subset-extracted");
  const listing = path.join(workspace, "mid-archive-list.txt");
  fs.rmSync(subsetExtract, { recursive: true, force: true });
  fs.mkdirSync(subsetExtract, { recursive: true });
  run("tar.exe", ["-xf", cachedSubset, "-C", subsetExtract], { cwd: repo, timeoutMs: 120000 });
  runToFile("tar.exe", ["-tf", cachedMidi], listing, { cwd: repo, timeoutMs: 120000 });
  const listText = fs.readFileSync(listing, "utf8");
  const midiEntries = listText.split(/\r?\n/).filter(value => /\.mid$/i.test(value)).length;
  if (midiEntries < 100000) throw new Error(`PDMX MIDI archive listing sospetta: ${midiEntries} MIDI`);
  console.log(`PDMX MIDI archive entries: ${midiEntries}`);

  console.log("\n[4/11] Baseline HHD exact cache; rebuild solo se necessario...");
  let baseline = validateBaseline(baselineWorkspace, config.baseline);
  if (!baseline.valid) {
    console.log(`Baseline HHD cache non valida (${baseline.reason}); ricostruisco con runner committato.`);
    run("node", [p.hhdRunner], { cwd: repo, timeoutMs: 900000 });
    baseline = validateBaseline(baselineWorkspace, config.baseline);
    if (!baseline.valid) throw new Error(`Baseline HHD ricostruita ma non esatta: ${baseline.reason}`);
  } else {
    console.log("Baseline HHD exact cache: OK, nessun rebuild.");
  }

  console.log("\n[5/11] Deterministic PDMX candidate pool + incremental real-import...");
  let incremental = null;
  let chosenPool = null;
  let selectionPlan = null;
  let incrementalReportPath = null;

  for (const pool of config.candidatePools) {
    console.log(`PDMX candidate pool attempt: ${pool}`);
    const poolRoot = path.join(workspace, `pool-${pool}`);
    const planPath = path.join(poolRoot, "selection-plan.json");
    const tarListPath = path.join(poolRoot, "tar-list.txt");
    const extractRoot = path.join(poolRoot, "mid-extracted");
    const candidateDir = path.join(poolRoot, "candidate-source");
    const incrementalDir = path.join(poolRoot, "incremental-compatible");
    const selectionReport = path.join(poolRoot, "selection-report.json");
    const incrementalReport = path.join(poolRoot, "incremental-report.json");

    fs.rmSync(poolRoot, { recursive: true, force: true });
    fs.mkdirSync(poolRoot, { recursive: true });

    run("node", [
      p.selector, "plan",
      subsetExtract, listing, p.pdmxConfig, planPath, tarListPath, String(pool)
    ], { cwd: repo });

    fs.mkdirSync(extractRoot, { recursive: true });
    run("tar.exe", ["-xf", cachedMidi, "-C", extractRoot, "-T", tarListPath], {
      cwd: repo, timeoutMs: 300000
    });

    fs.mkdirSync(candidateDir, { recursive: true });
    run("node", [
      p.selector, "materialize",
      planPath, extractRoot, candidateDir, p.pdmxConfig, selectionReport
    ], { cwd: repo });

    fs.mkdirSync(incrementalDir, { recursive: true });
    const filterRun = run("node", [
      p.incrementalFilter,
      candidateDir,
      baseline.reviewed,
      incrementalDir,
      incrementalReport,
      String(config.incrementalSourceTarget),
      String(config.minPitchedEvents)
    ], { cwd: repo, allowedCodes: [0, 2], timeoutMs: 600000 });

    const report = readJson(incrementalReport);
    if (Number(report.totals.selected) >= Number(config.incrementalSourceTarget)) {
      incremental = { dir: incrementalDir, report };
      chosenPool = pool;
      selectionPlan = readJson(planPath);
      incrementalReportPath = incrementalReport;
      break;
    }

    console.log(`Pool ${pool} insufficiente: ${report.totals.selected}/${config.incrementalSourceTarget}.`);
  }

  if (!incremental) {
    throw new Error(`PDMX incremental compatibility non raggiunge ${config.incrementalSourceTarget} nuove source neppure col pool massimo.`);
  }
  console.log(`PDMX candidate pool scelto: ${chosenPool}`);
  console.log(`PDMX nuove source compatibili: ${incremental.report.totals.selected}`);

  console.log("\n[6/11] Source expansion PDMX incrementale...");
  const pdmxPipeline = path.join(workspace, "pdmx-incremental-pipeline");
  fs.rmSync(pdmxPipeline, { recursive: true, force: true });
  run("powershell", [
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", p.sourceExpansion,
    "-SourceDir", incremental.dir,
    "-Workspace", pdmxPipeline,
    "-AutoReviewScript", p.reviewer
  ], { cwd: repo, timeoutMs: 900000 });

  const pdmxPhraseDir = path.join(pdmxPipeline, "phrase-items");
  const pdmxBuildPath = path.join(pdmxPipeline, "phrase-build-report.json");
  const pdmxCurationPath = path.join(pdmxPipeline, "source-curation-report.json");
  for (const file of [pdmxPhraseDir, pdmxBuildPath, pdmxCurationPath]) {
    if (!fs.existsSync(file)) throw new Error(`PDMX incremental output mancante: ${file}`);
  }
  const pdmxBuild = readJson(pdmxBuildPath);
  const pdmxCuration = readJson(pdmxCurationPath);
  if (Number(pdmxBuild.totals.phrasesProduced) < 1) throw new Error("PDMX incrementale non ha prodotto phrase.");

  const replayCfg = config.replayVerification || {};
  const baselineManifest = phraseManifestSha256(baseline.reviewed);
  const pdmxManifest = phraseManifestSha256(pdmxPhraseDir);
  if (baselineManifest !== replayCfg.baselinePhraseManifestSha256) {
    throw new Error(`Baseline replay manifest mismatch: ${baselineManifest}`);
  }
  if (pdmxManifest !== replayCfg.pdmxCandidatePhraseManifestSha256) {
    throw new Error(`PDMX candidate replay manifest mismatch: ${pdmxManifest}`);
  }
  console.log(`Replay input manifests: OK (${phraseFileCount(baseline.reviewed)} baseline + ${phraseFileCount(pdmxPhraseDir)} PDMX phrase)`);

  console.log("\n[7/11] Audit options globali...");
  const auditorCfg = readJson(p.auditorOptions);
  const auditOptionsPath = path.join(workspace, "global-audit-options.json");
  fs.writeFileSync(auditOptionsPath, `${JSON.stringify({
    targetMinPhrases: Number(config.targetMinPhrases),
    similarity: auditorCfg.similarity,
    quality: auditorCfg.quality
  }, null, 2)}\n`, "utf8");

  let winner = null;

  for (let attempt = 0; attempt < config.sliceTargets.length; attempt += 1) {
    console.log(`\n[8/11] PDMX volume slice attempt ${attempt + 1}/${config.sliceTargets.length}...`);
    const sliceDir = path.join(workspace, `pdmx-slice-${attempt + 1}`);
    const sliceReportPath = path.join(workspace, `pdmx-slice-${attempt + 1}.json`);
    run("node", [
      p.slicer,
      baseline.reviewed,
      pdmxPhraseDir,
      p.registry,
      configPath,
      sliceDir,
      sliceReportPath,
      String(attempt)
    ], { cwd: repo });

    const slice = readJson(sliceReportPath);
    console.log(`[9/11] Global merge/review attempt ${attempt + 1}...`);

    const attemptRoot = path.join(workspace, `global-attempt-${attempt + 1}`);
    const raw = path.join(attemptRoot, "raw");
    const reviewed = path.join(attemptRoot, "reviewed");
    fs.rmSync(attemptRoot, { recursive: true, force: true });
    fs.mkdirSync(raw, { recursive: true });
    fs.mkdirSync(reviewed, { recursive: true });

    const mergeReport = path.join(attemptRoot, "merge.json");
    const initialAudit = path.join(attemptRoot, "audit-initial.json");
    const initialSplit = path.join(attemptRoot, "split-initial.json");
    const decisions = path.join(attemptRoot, "review-decisions.json");
    const reviewReport = path.join(attemptRoot, "review-report.json");
    const finalAudit = path.join(attemptRoot, "audit-final.json");
    const finalSplit = path.join(attemptRoot, "split-final.json");
    const gateReport = path.join(attemptRoot, "gate1.json");
    const inventoryReport = path.join(attemptRoot, "inventory.json");

    run("node", [p.merger, raw, mergeReport, baseline.reviewed, sliceDir], { cwd: repo });
    run("node", [p.phraseCorpus, raw, initialAudit, initialSplit, auditOptionsPath], { cwd: repo });
    run("node", [p.phraseReview, raw, initialAudit, reviewed, decisions, reviewReport], { cwd: repo });
    run("node", [p.phraseCorpus, reviewed, finalAudit, finalSplit, auditOptionsPath, decisions], { cwd: repo });
    run("node", [p.gate, reviewed, finalAudit, gateReport, p.gatePolicy, inventoryReport], { cwd: repo });

    const audit = readJson(finalAudit);
    const gate = readJson(gateReport);
    const inventory = readJson(inventoryReport);
    const registryMap = buildRegistryCollections(readJson(p.registry));
    const corpusStats = scanCorpus(reviewed, registryMap);
    const pdmxCount = corpusStats.collections.get("pdmx-v2025") || 0;
    const pdmxShare = corpusStats.total ? pdmxCount / corpusStats.total : 0;
    const syntheticShare = corpusStats.total ? corpusStats.synthetic / corpusStats.total : 0;

    if (audit.block5Ready !== true || audit.corpusClean !== true || audit.reviewComplete !== true) {
      throw new Error(`Global PDMX attempt ${attempt + 1} non clean/reviewed.`);
    }
    if (sourceShareBlocker(gate)) throw new Error(`Source dominance Gate: ${sourceShareBlocker(gate)}`);
    if (!roleGatesRemainClosed(inventory, config)) throw new Error("PDMX volume expansion ha riaperto una role coverage Gate.");

    console.log(`Post-review total/PDMX/synthetic: ${corpusStats.total}/${pdmxCount}/${corpusStats.synthetic}`);
    console.log(`Post-review shares PDMX/synthetic: ${(pdmxShare * 100).toFixed(2)}%/${(syntheticShare * 100).toFixed(2)}%`);
    console.log(`Gate ready: ${gate.ready ? "SI" : "NO"}`);

    const replayProof = assertReplayAttempt(
      attempt,
      config,
      sliceDir,
      reviewed,
      inventory,
      pdmxCount,
      corpusStats.synthetic
    );
    console.log(`Replay attempt ${attempt + 1}: EXACT MATCH`);

    if (gate.ready === true) {
      winner = {
        attempt: attempt + 1,
        attemptRoot,
        reviewed,
        audit,
        gate,
        inventory,
        gateReport,
        inventoryReport,
        slice,
        corpusStats,
        pdmxCount,
        pdmxShare,
        syntheticShare,
        replayProof,
        reviewReport: readJson(reviewReport)
      };
      break;
    }

    console.log("Attempt non chiude Gate 1; provo il prossimo slice target gia' verificato sul replay reale.");
  }

  if (!winner) {
    throw new Error("PDMX volume closer non chiude Gate 1 con i slice target replay-verificati: stop senza commit.");
  }

  console.log("\n[10/11] Final invariants + persist final workspace...");
  if (Number(winner.inventory.totals.phrases) < Number(config.targetMinPhrases)) throw new Error("Target 500 non chiuso.");
  if (winner.gate.ready !== true) throw new Error("Gate 1 non READY.");
  const syntheticAdvisoryMet = winner.syntheticShare <= Number(config.syntheticAdvisoryMaxShare) + 1e-12;
  if (!syntheticAdvisoryMet) {
    console.log(`ADVISORY: synthetic share ${(winner.syntheticShare * 100).toFixed(2)}% > ${(Number(config.syntheticAdvisoryMaxShare) * 100).toFixed(2)}%; non e' un Gate 1 blocker.`);
  }

  const finalReviewed = path.join(workspace, "global-reviewed-phrase-items");
  fs.rmSync(finalReviewed, { recursive: true, force: true });
  fs.cpSync(winner.reviewed, finalReviewed, { recursive: true });
  fs.copyFileSync(winner.gateReport, path.join(workspace, "global-gate1-report.json"));
  fs.copyFileSync(winner.inventoryReport, path.join(workspace, "global-inventory.json"));
  fs.copyFileSync(path.join(winner.attemptRoot, "audit-final.json"), path.join(workspace, "global-audit.json"));

  const summary = {
    schema: "fame-neural-pdmx-volume-closer-final-v1",
    version: 1,
    chosenCandidatePool: chosenPool,
    safePlan: selectionPlan && selectionPlan.totals || null,
    incrementalCompatibility: incremental.report.totals,
    incrementalCuration: pdmxCuration.totals,
    incrementalPhraseBuild: pdmxBuild.totals,
    winningAttempt: winner.attempt,
    slice: winner.slice,
    inventory: winner.inventory,
    gate: winner.gate,
    replayVerification: {
      inputBaselineManifestSha256: baselineManifest,
      inputPdmxManifestSha256: pdmxManifest,
      ...winner.replayProof
    },
    governance: {
      syntheticCount: winner.corpusStats.synthetic,
      syntheticShare: winner.syntheticShare,
      pdmxCount: winner.pdmxCount,
      pdmxShare: winner.pdmxShare,
      syntheticAdvisoryMaxShare: Number(config.syntheticAdvisoryMaxShare),
      syntheticAdvisoryMet,
      maxPdmxPreReviewShare: Number(config.maxPdmxPreReviewShare)
    }
  };

  const summaryPath = path.join(workspace, "pdmx-volume-closer-final-report.json");
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log("\n[11/11] RISULTATO");
  console.log("PDMX VOLUME CLOSER: GATE 1 DATA READY SUPERATO");
  console.log(`Candidate pool: ${chosenPool}`);
  console.log(`Nuove source PDMX compatibili: ${incremental.report.totals.selected}`);
  console.log(`PDMX phrase incrementali prodotte: ${pdmxBuild.totals.phrasesProduced}`);
  console.log(`Winning slice attempt: ${winner.attempt}`);
  console.log(`Phrase globali: ${winner.inventory.totals.phrases}`);
  console.log(`Composition family: ${winner.inventory.totals.compositionFamilies}`);
  console.log(`Source collections: ${winner.inventory.totals.sourceCollections}`);
  console.log(`Coverage drums/808/harmony/lead: ${winner.inventory.roleCoverage.drums}/${winner.inventory.roleCoverage["808"]}/${winner.inventory.roleCoverage.harmony}/${winner.inventory.roleCoverage.lead}`);
  console.log(`Coverage pitchedAny: ${winner.inventory.roleCoverage.pitchedAny}`);
  console.log(`Synthetic share: ${(winner.syntheticShare * 100).toFixed(2)}%`);
  console.log(`PDMX share: ${(winner.pdmxShare * 100).toFixed(2)}%`);
  console.log("GATE 1 DATA READY: READY");
  console.log(`Final report: ${summaryPath}`);

  return summary;
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
  run,
  text,
  readJson,
  md5,
  phraseFileCount,
  phraseManifestSha256,
  assertReplayAttempt,
  validateBaseline,
  cacheAssetIfValid,
  sourceShareBlocker,
  roleGatesRemainClosed,
  runToFile,
  main
};
