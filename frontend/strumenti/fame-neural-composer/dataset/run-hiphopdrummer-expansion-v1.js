"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const EXPECTED_BASELINE = Object.freeze({
  phrases: 322,
  compositionFamilies: 184,
  sourceCollections: 5,
  drums: 113,
  "808": 61,
  harmony: 264,
  lead: 48,
  pitchedAny: 264
});

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
    error.cause = result.error;
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

function text(cmd, args, cwd) {
  return String(run(cmd, args, { cwd, capture: true }).stdout).trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sleepSync(ms) {
  const cell = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(cell, 0, 0, ms);
}

function verifyCheckout(checkout, config) {
  if (!fs.existsSync(path.join(checkout, ".git"))) return { valid: false, reason: "no-git" };
  try {
    const head = text("git", ["rev-parse", "HEAD"], checkout);
    if (head !== config.generator.commit) return { valid: false, reason: `head:${head}` };

    for (const [file, expectedBlob] of Object.entries(config.generator.criticalBlobs || {})) {
      const actual = text("git", ["rev-parse", `HEAD:${file}`], checkout);
      if (actual !== expectedBlob) return { valid: false, reason: `blob:${file}:${actual}` };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: `${error.name}:${error.message}` };
  }
}

function checkoutPinnedSource(checkout, config) {
  const existing = verifyCheckout(checkout, config);
  if (existing.valid) {
    console.log(`HHD checkout cache: VALID (${config.generator.commit})`);
    return;
  }

  fs.rmSync(checkout, { recursive: true, force: true });
  fs.mkdirSync(checkout, { recursive: true });

  run("git", ["init", "-q"], { cwd: checkout });
  run("git", ["remote", "add", "origin", config.generator.repository], { cwd: checkout });

  let fetched = false;
  let lastError = null;
  for (let attempt = 1; attempt <= 4 && !fetched; attempt += 1) {
    console.log(`HHD git fetch attempt ${attempt}/4...`);
    try {
      run("git", [
        "-c", "http.lowSpeedLimit=1024",
        "-c", "http.lowSpeedTime=60",
        "fetch", "--depth", "1", "origin", config.generator.commit
      ], { cwd: checkout, timeoutMs: 120000 });
      run("git", ["checkout", "-q", "--detach", "FETCH_HEAD"], { cwd: checkout, timeoutMs: 30000 });
      fetched = true;
    } catch (error) {
      lastError = error;
      if (attempt < 4) sleepSync(attempt * 5000);
    }
  }
  if (!fetched) throw lastError || new Error("HHD git fetch fallito");

  const verified = verifyCheckout(checkout, config);
  if (!verified.valid) throw new Error(`HHD checkout verification fallita: ${verified.reason}`);
  console.log("HHD checkout pinned + critical blob verification: OK");
}

function runUpstreamTests(checkout) {
  let result;
  try {
    result = run("node", ["tests.js"], { cwd: checkout, capture: true, timeoutMs: 240000 });
  } catch (error) {
    const stdout = error && error.result && error.result.stdout || "";
    const stderr = error && error.result && error.result.stderr || "";
    if (stdout) console.error(String(stdout).trim().split(/\r?\n/).slice(-30).join("\n"));
    if (stderr) console.error(String(stderr).trim().split(/\r?\n/).slice(-30).join("\n"));
    throw error;
  }
  const lines = String(result.stdout || "").trim().split(/\r?\n/);
  const tail = lines.slice(-12).join("\n");
  if (tail) console.log(tail);
  console.log("HHD upstream tests.js: PASS");
}

function validateBaseline(workspace) {
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
      Number(inventory.totals && inventory.totals.phrases) === EXPECTED_BASELINE.phrases &&
      Number(inventory.totals && inventory.totals.compositionFamilies) === EXPECTED_BASELINE.compositionFamilies &&
      Number(inventory.totals && inventory.totals.sourceCollections) === EXPECTED_BASELINE.sourceCollections &&
      Number(role.drums) === EXPECTED_BASELINE.drums &&
      Number(role["808"]) === EXPECTED_BASELINE["808"] &&
      Number(role.harmony) === EXPECTED_BASELINE.harmony &&
      Number(role.lead) === EXPECTED_BASELINE.lead &&
      Number(role.pitchedAny) === EXPECTED_BASELINE.pitchedAny &&
      audit.block5Ready === true &&
      audit.corpusClean === true &&
      audit.reviewComplete === true;

    if (!exact) return { valid: false, reason: "metrics-not-exact-4ee0a2b-baseline" };
    return { valid: true, reviewed, inventoryPath, auditPath, gatePath, inventory };
  } catch (error) {
    return { valid: false, reason: `${error.name}:${error.message}` };
  }
}

function roleGatesClosed(inventory, config) {
  const role = inventory.roleCoverage || {};
  return Number(role.drums) >= Number(config.gateTargets.drums)
    && Number(role["808"]) >= Number(config.gateTargets["808"])
    && Number(role.lead) >= Number(config.gateTargets.lead);
}

function sourceShareBlocker(gate) {
  return (gate.blockers || []).find(value => /^source collection dominante/.test(String(value))) || null;
}

function main(argv = process.argv.slice(2)) {
  const repo = text("git", ["rev-parse", "--show-toplevel"], process.cwd());
  const fameRoot = path.join(repo, "frontend", "strumenti", "fame-neural-composer");
  const dataset = path.join(fameRoot, "dataset");
  const configPath = path.join(dataset, "hiphopdrummer-source.json");
  const config = readJson(configPath);

  const workspace = path.join(process.env.TEMP || process.env.TMP, "fame-neural-hiphopdrummer-v1");
  const baselineWorkspace = path.join(process.env.TEMP || process.env.TMP, "fame-neural-nrg-cp-v2");
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || process.cwd(), "AppData", "Local");
  const checkout = path.join(localAppData, "FAME-Neural", "source-cache", "hiphopdrummer", config.generator.commit);

  const p = {
    nrgRunner: path.join(dataset, "run-nrg-cp-expansion-v2.js"),
    generator: path.join(dataset, "generate-hiphopdrummer-corpus.js"),
    reviewer: path.join(dataset, "review-hiphopdrummer.js"),
    slicer: path.join(dataset, "select-hiphopdrummer-role-slice.js"),
    sourceExpansion: path.join(dataset, "run-source-expansion.ps1"),
    merger: path.join(dataset, "merge-phrase-corpora.js"),
    phraseCorpus: path.join(dataset, "phrase-corpus.js"),
    phraseReview: path.join(dataset, "phrase-review.js"),
    gate: path.join(dataset, "data-ready-gate.js"),
    gatePolicy: path.join(dataset, "data-ready-policy.example.json"),
    auditorOptions: path.join(dataset, "auditor-options.example.json")
  };
  for (const file of Object.values(p)) if (!fs.existsSync(file)) throw new Error(`File richiesto mancante: ${file}`);

  fs.mkdirSync(workspace, { recursive: true });

  console.log("=== FAME NEURAL / HIPHOPDRUMMER ROLE CLOSER V1 ===");
  console.log(`Generator commit: ${config.generator.commit}`);
  console.log(`Workspace: ${workspace}`);

  console.log("\n[1/9] PREFLIGHT checkout pinned + blob verification...");
  checkoutPinnedSource(checkout, config);

  console.log("\n[2/9] PREFLIGHT upstream full tests...");
  runUpstreamTests(checkout);

  console.log("\n[3/9] Generazione deterministica + FAME real-import preflight per item...");
  const generatedSource = path.join(workspace, "generated-source");
  const generationReport = path.join(workspace, "generation-report.json");
  run("node", [p.generator, checkout, fameRoot, configPath, generatedSource, generationReport], { cwd: repo });
  const generated = readJson(generationReport);
  if (Number(generated.totals.candidates808) !== Number(config.pool.candidates808)) {
    throw new Error(`Pool 808 incompleto ${generated.totals.candidates808}/${config.pool.candidates808}`);
  }
  if (Number(generated.totals.candidatesLead) !== Number(config.pool.candidatesLead)) {
    throw new Error(`Pool lead incompleto ${generated.totals.candidatesLead}/${config.pool.candidatesLead}`);
  }

  console.log("\n[4/9] Source expansion HHD + source-specific conservative review...");
  const hhdPipeline = path.join(workspace, "hhd-pipeline");
  fs.rmSync(hhdPipeline, { recursive: true, force: true });
  run("powershell", [
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", p.sourceExpansion,
    "-SourceDir", generatedSource,
    "-Workspace", hhdPipeline,
    "-AutoReviewScript", p.reviewer
  ], { cwd: repo });

  const hhdPhraseDir = path.join(hhdPipeline, "phrase-items");
  const hhdBuildPath = path.join(hhdPipeline, "phrase-build-report.json");
  const hhdCurationPath = path.join(hhdPipeline, "source-curation-report.json");
  for (const file of [hhdPhraseDir, hhdBuildPath, hhdCurationPath]) {
    if (!fs.existsSync(file)) throw new Error(`HHD pipeline output mancante: ${file}`);
  }
  const hhdBuild = readJson(hhdBuildPath);
  const hhdCuration = readJson(hhdCurationPath);
  if (Number(hhdBuild.totals && hhdBuild.totals.phrasesProduced) < 1) {
    throw new Error("HHD source expansion non ha prodotto phrase.");
  }
  // Non imponiamo un numero arbitrario al pool: la verifica corretta e'
  // role-specifica e avviene nello slicer, che deve coprire i deficit reali
  // drums/808/lead rispettando il cap del 20%.

  console.log("\n[5/9] Baseline NRG V2: exact cache verification...");
  let baseline = validateBaseline(baselineWorkspace);
  if (!baseline.valid) {
    console.log(`Baseline cache non valida (${baseline.reason}); ricostruisco con runner committato.`);
    run("node", [p.nrgRunner, "--nrg-source-count", "256"], { cwd: repo });
    baseline = validateBaseline(baselineWorkspace);
    if (!baseline.valid) throw new Error(`Baseline NRG V2 ricostruita ma non esatta: ${baseline.reason}`);
  } else {
    console.log("Baseline NRG V2 exact cache: OK, nessun rebuild.");
  }

  const auditorCfg = readJson(p.auditorOptions);
  const auditOptionsPath = path.join(workspace, "global-audit-options.json");
  fs.writeFileSync(auditOptionsPath, `${JSON.stringify({
    targetMinPhrases: 500,
    similarity: auditorCfg.similarity,
    quality: auditorCfg.quality
  }, null, 2)}\n`, "utf8");

  let winner = null;

  for (let attempt = 0; attempt < config.slice.attempts.length; attempt += 1) {
    console.log(`\n[6/9] Role-aware slice attempt ${attempt + 1}/${config.slice.attempts.length}...`);
    const sliceDir = path.join(workspace, `hhd-slice-${attempt + 1}`);
    const sliceReport = path.join(workspace, `hhd-slice-${attempt + 1}.json`);
    run("node", [
      p.slicer,
      baseline.reviewed,
      hhdPhraseDir,
      baseline.inventoryPath,
      configPath,
      sliceDir,
      sliceReport,
      String(attempt)
    ], { cwd: repo });

    console.log(`[7/9] Global merge/review attempt ${attempt + 1}...`);
    const attemptRoot = path.join(workspace, `global-attempt-${attempt + 1}`);
    const globalRaw = path.join(attemptRoot, "raw");
    const globalReviewed = path.join(attemptRoot, "reviewed");
    fs.rmSync(attemptRoot, { recursive: true, force: true });
    fs.mkdirSync(globalRaw, { recursive: true });
    fs.mkdirSync(globalReviewed, { recursive: true });

    const mergeReport = path.join(attemptRoot, "merge.json");
    const initialAudit = path.join(attemptRoot, "audit-initial.json");
    const initialSplit = path.join(attemptRoot, "split-initial.json");
    const decisions = path.join(attemptRoot, "review-decisions.json");
    const reviewReport = path.join(attemptRoot, "review-report.json");
    const finalAudit = path.join(attemptRoot, "audit-final.json");
    const finalSplit = path.join(attemptRoot, "split-final.json");
    const gateReport = path.join(attemptRoot, "gate1.json");
    const inventoryReport = path.join(attemptRoot, "inventory.json");

    run("node", [p.merger, globalRaw, mergeReport, baseline.reviewed, sliceDir], { cwd: repo });
    run("node", [p.phraseCorpus, globalRaw, initialAudit, initialSplit, auditOptionsPath], { cwd: repo });
    run("node", [p.phraseReview, globalRaw, initialAudit, globalReviewed, decisions, reviewReport], { cwd: repo });
    run("node", [p.phraseCorpus, globalReviewed, finalAudit, finalSplit, auditOptionsPath, decisions], { cwd: repo });
    run("node", [p.gate, globalReviewed, finalAudit, gateReport, p.gatePolicy, inventoryReport], { cwd: repo });

    const audit = readJson(finalAudit);
    const inventory = readJson(inventoryReport);
    const gate = readJson(gateReport);
    const slice = readJson(sliceReport);

    if (audit.block5Ready !== true || audit.corpusClean !== true || audit.reviewComplete !== true) {
      throw new Error(`Global attempt ${attempt + 1} non clean/reviewed.`);
    }
    if (Number(inventory.totals.sourceCollections) < 6) {
      throw new Error("HipHopDrummer non entra come sesta source collection.");
    }
    if (sourceShareBlocker(gate)) throw new Error(`Source dominance: ${sourceShareBlocker(gate)}`);

    const hhdShare = Number(slice.totals.selected) / (Number(baseline.inventory.totals.phrases) + Number(slice.totals.selected));
    if (hhdShare > Number(config.slice.maxPhraseShare) + 1e-12) throw new Error("HHD pre-review share cap violato.");

    console.log(`Post-review role drums/808/lead: ${inventory.roleCoverage.drums}/${inventory.roleCoverage["808"]}/${inventory.roleCoverage.lead}`);

    if (roleGatesClosed(inventory, config)) {
      winner = { attempt: attempt + 1, attemptRoot, globalReviewed, audit, inventory, gate, slice, gateReport, inventoryReport };
      break;
    }

    console.log("Role Gate non ancora chiusi; provo solo il buffer successivo dallo stesso pool.");
  }

  if (!winner) {
    throw new Error("HHD non chiude drums/808/lead entro il cap 20% dopo tutti gli attempt: stop senza commit.");
  }

  console.log("\n[8/9] Final invariants...");
  if (Number(winner.inventory.roleCoverage.drums) < Number(config.gateTargets.drums)) throw new Error("Drums Gate ancora aperto.");
  if (Number(winner.inventory.roleCoverage["808"]) < Number(config.gateTargets["808"])) throw new Error("808 Gate ancora aperto.");
  if (Number(winner.inventory.roleCoverage.lead) < Number(config.gateTargets.lead)) throw new Error("Lead Gate ancora aperto.");
  if (Number(winner.inventory.roleCoverage.harmony) < EXPECTED_BASELINE.harmony) throw new Error("Harmony regressione.");
  if (Number(winner.inventory.roleCoverage.pitchedAny) < EXPECTED_BASELINE.pitchedAny) throw new Error("PitchedAny regressione.");

  const finalReviewed = path.join(workspace, "global-reviewed-phrase-items");
  fs.rmSync(finalReviewed, { recursive: true, force: true });
  fs.cpSync(winner.globalReviewed, finalReviewed, { recursive: true });
  fs.copyFileSync(winner.gateReport, path.join(workspace, "global-gate1-report.json"));
  fs.copyFileSync(winner.inventoryReport, path.join(workspace, "global-inventory.json"));
  fs.copyFileSync(path.join(winner.attemptRoot, "audit-final.json"), path.join(workspace, "global-audit.json"));

  const summary = {
    schema: "fame-neural-hiphopdrummer-final-v1",
    version: 1,
    winningSliceAttempt: winner.attempt,
    generation: generated.totals,
    curation: hhdCuration.totals,
    phraseBuild: hhdBuild.totals,
    slice: winner.slice,
    inventory: winner.inventory,
    gate: winner.gate
  };
  const summaryPath = path.join(workspace, "hiphopdrummer-final-report.json");
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log("\n[9/9] RISULTATO");
  console.log("HIPHOPDRUMMER ROLE CLOSER: PIPELINE COMPLETATA");
  console.log(`Winning slice attempt: ${winner.attempt}`);
  console.log(`Phrase globali: ${winner.inventory.totals.phrases}`);
  console.log(`Composition family: ${winner.inventory.totals.compositionFamilies}`);
  console.log(`Source collections: ${winner.inventory.totals.sourceCollections}`);
  console.log(`Coverage drums/808/harmony/lead: ${winner.inventory.roleCoverage.drums}/${winner.inventory.roleCoverage["808"]}/${winner.inventory.roleCoverage.harmony}/${winner.inventory.roleCoverage.lead}`);
  console.log(`Coverage pitchedAny: ${winner.inventory.roleCoverage.pitchedAny}`);
  console.log(`GATE 1 DATA READY: ${winner.gate.ready ? "READY" : "ANCORA APERTO"}`);
  if (!winner.gate.ready) {
    console.log("Blocker residui:");
    for (const blocker of winner.gate.blockers || []) console.log(` - ${blocker}`);
  }
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
  EXPECTED_BASELINE,
  run,
  text,
  readJson,
  verifyCheckout,
  checkoutPinnedSource,
  runUpstreamTests,
  validateBaseline,
  roleGatesClosed,
  sourceShareBlocker,
  main
};
