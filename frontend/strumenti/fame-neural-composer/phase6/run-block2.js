"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const fame = require("../representation/fame-compound-v1");
const { audit } = require("../audit-musicale");
const {
  splitName,
  barsOf,
  planMae,
  percentile
} = require("./retrieval-baseline");
const constrained = require("./constrained-baseline");
const {
  buildModel,
  generate,
  normalizedBarSignature,
  phraseSignature,
  trainingNoveltyIndex
} = constrained;

function desktopDir() {
  const desktop = path.join(os.homedir(), "Desktop");
  try { if (fs.statSync(desktop).isDirectory()) return desktop; } catch {}
  return os.homedir();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function hashJson(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function toRecord(item) {
  const units = item && item.representations && item.representations["fame-compound-v1"];
  if (!Array.isArray(units) || units.length < 2) {
    throw new Error(`FAME Compound mancante: ${item && item.phraseId}`);
  }
  return {
    phraseId: String(item.phraseId),
    groupId: String(item.groupId),
    sourceCollection: String(item.sourceCollection || "unknown"),
    bars: Number(item.bars || barsOf(units).length || 1),
    units
  };
}

function generateOne(target, model, novelty) {
  const result = generate(target, model, { seed: 6201, topK: 16 });
  fame.validateVocabulary(result.units);
  const grammar = fame.validateEncoded(result.units);
  if (!(grammar && grammar.ok)) {
    throw new Error(`${target.phraseId}: ${grammar && grammar.error || "FAME Compound non valido"}`);
  }
  const decoded = fame.decode(result.units);
  const targetBars = barsOf(target).length;
  const exactTrainingBars = [];
  for (let bar = 0; bar < targetBars; bar += 1) {
    if (novelty.bars.has(normalizedBarSignature(result.units, bar))) exactTrainingBars.push(bar);
  }
  return {
    phraseId: target.phraseId,
    targetGroupId: target.groupId,
    donorGroups: result.donorGroups,
    profileDonorGroups: result.profileDonorGroups,
    donorGroupCount: result.donorGroups.length,
    planMae: planMae(target, result.units),
    grammarOk: true,
    exactTrainingPhraseMatch: novelty.phrases.has(phraseSignature(result.units)),
    exactTrainingBars,
    exactTrainingBarCount: exactTrainingBars.length,
    audit: audit(decoded),
    encoded: result.units
  };
}

function generateAll(test, model, novelty) {
  return test.map(target => generateOne(target, model, novelty));
}

function buildReport(datasetPath, payload, records, generations) {
  const split = { train: [], val: [], test: [] };
  for (const record of records) split[splitName(record.groupId)].push(record);

  const planMaes = generations.map(item => item.planMae);
  const donorCounts = generations.map(item => item.donorGroupCount);
  const auditCounts = { warningFindings: 0, infoFindings: 0, samplesWithWarnings: 0 };
  const warningCodes = {};

  let exactTrainingPhraseMatches = 0;
  let exactTrainingBarMatches = 0;
  let totalGeneratedBars = 0;
  let donorLeakage = 0;

  const uniqueGenerationSignatures = new Set();
  const uniqueDonorGroups = new Set();

  for (const item of generations) {
    if (item.exactTrainingPhraseMatch) exactTrainingPhraseMatches += 1;
    exactTrainingBarMatches += item.exactTrainingBarCount;
    totalGeneratedBars += barsOf(item.encoded).length;
    uniqueGenerationSignatures.add(phraseSignature(item.encoded));
    for (const groupId of item.donorGroups) {
      uniqueDonorGroups.add(groupId);
      if (groupId === item.targetGroupId) donorLeakage += 1;
    }

    const counts = item.audit && item.audit.counts || {};
    auditCounts.warningFindings += Number(counts.warning || 0);
    auditCounts.infoFindings += Number(counts.info || 0);
    if (Number(counts.warning || 0) > 0) auditCounts.samplesWithWarnings += 1;
    for (const finding of item.audit && item.audit.findings || []) {
      if (finding.severity !== "warning") continue;
      warningCodes[finding.code] = (warningCodes[finding.code] || 0) + 1;
    }
  }

  const manifest = generations.map(item => ({
    phraseId: item.phraseId,
    donorGroups: item.donorGroups,
    profileDonorGroups: item.profileDonorGroups,
    exactTrainingBars: item.exactTrainingBars,
    encoded: item.encoded
  }));

  return {
    schema: "fame-neural-phase6-block2-constrained-baseline-report-v1",
    version: 1,
    baseline: {
      id: "fame-constrained-recombination-v1",
      representation: "fame-compound-v1",
      type: "seeded-constrained-empirical-recombination",
      neuralParameters: 0,
      learnedModelParameters: 0,
      empiricalTrainingTables: true,
      seed: 6201,
      constraints: [
        "train-only empirical pools",
        "composition-family split inherited from Phase 5",
        "target header and high-level bar plan only",
        "bar count profile from nearest train plan profiles",
        "event/chord/hat words sampled independently from train pools",
        "pitch/chord transposition to target key",
        "derived kick-808 summary fields",
        "FAME Compound grammar validation"
      ]
    },
    dataset: {
      source: path.resolve(datasetPath),
      sha256: sha256File(datasetPath),
      phrases: records.length,
      groups: new Set(records.map(record => record.groupId)).size,
      split: {
        train: { phrases: split.train.length, groups: new Set(split.train.map(r => r.groupId)).size },
        val: { phrases: split.val.length, groups: new Set(split.val.map(r => r.groupId)).size },
        test: { phrases: split.test.length, groups: new Set(split.test.map(r => r.groupId)).size }
      },
      phase5Schema: payload.schema
    },
    evaluation: {
      testPhrases: generations.length,
      validGenerations: generations.length,
      invalidGenerations: 0,
      donorLeakage,
      conditioning: {
        meanPlanMae01: mean(planMaes),
        p95PlanMae01: percentile(planMaes, 95),
        barsExactRate: generations.filter(item => barsOf(item.encoded).length === barsOf(records.find(r => r.phraseId === item.phraseId)).length).length / Math.max(1, generations.length)
      },
      novelty: {
        exactTrainingPhraseMatches,
        exactTrainingBarMatches,
        totalGeneratedBars,
        exactTrainingBarRate: exactTrainingBarMatches / Math.max(1, totalGeneratedBars),
        uniqueGenerations: uniqueGenerationSignatures.size,
        uniqueGenerationRate: uniqueGenerationSignatures.size / Math.max(1, generations.length)
      },
      donors: {
        uniqueDonorGroups: uniqueDonorGroups.size,
        meanDonorGroupsPerGeneration: mean(donorCounts),
        p50DonorGroupsPerGeneration: percentile(donorCounts, 50),
        p95DonorGroupsPerGeneration: percentile(donorCounts, 95)
      },
      audit: {
        ...auditCounts,
        samplesWithWarningsRate: auditCounts.samplesWithWarnings / Math.max(1, generations.length),
        warningCodes
      },
      generationManifestSha256: hashJson(manifest)
    }
  };
}

function bar(index, values = {}) {
  return {
    kind: "BAR",
    bar: index,
    energy: values.energy ?? 5,
    vocalSpace: values.vocalSpace ?? 5,
    tension: values.tension ?? 5,
    density: values.density ?? 5,
    transitionFrom: values.transitionFrom ?? 5,
    transitionTo: values.transitionTo ?? 5,
    motifFamily: values.motifFamily ?? 0,
    motifRelation: values.motifRelation ?? "none",
    motifSimilarity: values.motifSimilarity ?? 5,
    kick808Available: false,
    kickCount: 0,
    bassCount: 0,
    kickExact: 0,
    kickProximity: 0,
    kickLag: null,
    kickStrength: 0,
    hatRollCount: 0,
    hatMaxRollNotes: 0
  };
}

function selfTest() {
  function rec(id, groupId, key, note, offset = 0) {
    return {
      phraseId: id,
      groupId,
      sourceCollection: "selftest",
      bars: 2,
      units: [
        { kind: "HEADER", bpm: 140, key, mode: "minor", lineage: "dark_minimal" },
        bar(0, { energy: 6, density: 6 }),
        { kind: "EVENT", bar: 0, position: 0 + offset, type: "kick", velocityBin: 8, role: "REINFORCE" },
        { kind: "EVENT", bar: 0, position: 0 + offset, type: "808", velocityBin: 7, note, duration: 240, role: "root" },
        { kind: "EVENT", bar: 0, position: 960 + offset, type: "snare", velocityBin: 7 },
        bar(1, { energy: 5, density: 5 }),
        { kind: "EVENT", bar: 1, position: 0 + offset, type: "kick", velocityBin: 7, role: "REINFORCE" },
        { kind: "EVENT", bar: 1, position: 480 + offset, type: "hat_closed", velocityBin: 6 },
        { kind: "EOS" }
      ]
    };
  }

  const train = [
    rec("a", "ga", 0, 36, 0),
    rec("b", "gb", 5, 41, 120),
    rec("c", "gc", 7, 43, 240)
  ];
  const target = rec("target", "gt", 2, 38, 0);
  const model = buildModel(train);
  const novelty = trainingNoveltyIndex(train);
  const first = generateOne(target, model, novelty);
  const second = generateOne(target, model, novelty);
  assert.deepEqual(first.encoded, second.encoded);
  assert.equal(first.grammarOk, true);
  assert.equal(first.exactTrainingPhraseMatch, false);
  assert.equal(barsOf(first.encoded).length, 2);
  assert.equal(first.encoded[0].key, 2);
  assert.equal(first.encoded.at(-1).kind, "EOS");
  console.log("PHASE6 BLOCK2 CONSTRAINED SMOKE: OK");
}

function main(argv = process.argv.slice(2)) {
  try {
    if (argv.includes("--self-test")) return selfTest();

    const datasetPath = path.resolve(argv[0] || path.join(desktopDir(), "FAME_NEURAL_PHASE5_BLOCK3", "phase5-microtrain-dataset.json"));
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(), "FAME_NEURAL_PHASE6_BLOCK2"));
    fs.mkdirSync(outputDir, { recursive: true });

    console.log("=== FAME NEURAL / FASE 6 / BLOCCO 2 / CONSTRAINED BASELINE ===");
    if (!fs.existsSync(datasetPath)) throw new Error(`Dataset FASE 5 non trovato: ${datasetPath}`);

    const payload = readJson(datasetPath);
    if (payload.schema !== "fame-neural-phase5-microtrain-dataset-v1") throw new Error(`Schema dataset inatteso: ${payload.schema}`);
    const records = (payload.records || []).map(toRecord);
    if (records.length !== 502) throw new Error(`Attese 502 candidate, trovate ${records.length}`);

    const train = records.filter(record => splitName(record.groupId) === "train");
    const val = records.filter(record => splitName(record.groupId) === "val");
    const test = records.filter(record => splitName(record.groupId) === "test");
    if (train.length !== 401 || val.length !== 58 || test.length !== 43) {
      throw new Error(`Split inatteso: ${train.length}/${val.length}/${test.length}`);
    }
    console.log(`Split: ${train.length}/${val.length}/${test.length}`);

    const model = buildModel(train);
    const novelty = trainingNoveltyIndex(train);
    const generations = generateAll(test, model, novelty);
    const secondPass = generateAll(test, model, novelty);

    if (hashJson(generations.map(item => item.encoded)) !== hashJson(secondPass.map(item => item.encoded))) {
      throw new Error("Baseline constrained non deterministica");
    }

    const report = buildReport(datasetPath, payload, records, generations);
    if (report.evaluation.validGenerations !== 43 || report.evaluation.invalidGenerations !== 0) {
      throw new Error("Gate validità 43/43 non superato");
    }
    if (report.evaluation.donorLeakage !== 0) throw new Error(`Donor leakage rilevato: ${report.evaluation.donorLeakage}`);
    if (report.evaluation.conditioning.barsExactRate !== 1) throw new Error(`Bars exact rate ${report.evaluation.conditioning.barsExactRate}`);
    if (report.evaluation.novelty.exactTrainingPhraseMatches !== 0) {
      throw new Error(`Generazioni identiche a phrase train: ${report.evaluation.novelty.exactTrainingPhraseMatches}`);
    }

    fs.writeFileSync(path.join(outputDir, "phase6-block2-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(outputDir, "phase6-block2-generations.json"), `${JSON.stringify({
      schema: "fame-neural-phase6-block2-constrained-generations-v1",
      version: 1,
      baseline: report.baseline.id,
      items: generations
    }, null, 2)}\n`, "utf8");

    console.log(`Valid: ${report.evaluation.validGenerations}/${report.evaluation.testPhrases}`);
    console.log(`Donor leakage: ${report.evaluation.donorLeakage}`);
    console.log(`Plan MAE mean/P95: ${report.evaluation.conditioning.meanPlanMae01.toFixed(6)} / ${report.evaluation.conditioning.p95PlanMae01.toFixed(6)}`);
    console.log(`Exact train phrase matches: ${report.evaluation.novelty.exactTrainingPhraseMatches}`);
    console.log(`Exact train bar matches: ${report.evaluation.novelty.exactTrainingBarMatches}/${report.evaluation.novelty.totalGeneratedBars} (${report.evaluation.novelty.exactTrainingBarRate.toFixed(6)})`);
    console.log(`Unique generations: ${report.evaluation.novelty.uniqueGenerations}/${report.evaluation.testPhrases}`);
    console.log(`Donor groups unique: ${report.evaluation.donors.uniqueDonorGroups} | mean/gen ${report.evaluation.donors.meanDonorGroupsPerGeneration.toFixed(3)}`);
    console.log(`Audit warnings: ${report.evaluation.audit.warningFindings} su ${report.evaluation.audit.samplesWithWarnings} sample`);
    console.log(`Warning codes: ${JSON.stringify(report.evaluation.audit.warningCodes)}`);
    console.log(`Manifest: ${report.evaluation.generationManifestSha256}`);
    console.log(`Output: ${outputDir}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { toRecord, generateOne, generateAll, buildReport, selfTest, main };
