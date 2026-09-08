"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const fame = require("../representation/fame-compound-v1");
const { audit } = require("../audit-musicale");
const baseline = require("./retrieval-baseline");
const {
  splitName, headerOf, barsOf, retrieveTemplate, adaptTemplate, planMae, percentile
} = baseline;

function desktopDir() {
  const desktop = path.join(os.homedir(), "Desktop");
  try { if (fs.statSync(desktop).isDirectory()) return desktop; } catch {}
  return os.homedir();
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function sha256File(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function hashJson(value) { return crypto.createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex"); }
function mean(values) { return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0; }

function toRecord(item) {
  const units = item && item.representations && item.representations["fame-compound-v1"];
  if (!Array.isArray(units) || units.length < 2) throw new Error(`FAME Compound mancante: ${item && item.phraseId}`);
  return {
    phraseId: String(item.phraseId),
    groupId: String(item.groupId),
    sourceCollection: String(item.sourceCollection || "unknown"),
    bars: Number(item.bars || barsOf(units).length || 1),
    units
  };
}

function generateOne(target, train) {
  const retrieved = retrieveTemplate(target, train);
  const adapted = adaptTemplate(target, retrieved.template);
  fame.validateVocabulary(adapted.units);
  const grammar = fame.validateEncoded(adapted.units);
  if (!(grammar && grammar.ok)) throw new Error(grammar && grammar.error || "FAME Compound non valido");
  const decoded = fame.decode(adapted.units);
  const th = headerOf(target);
  const gh = headerOf(adapted.units);
  return {
    phraseId: target.phraseId,
    targetGroupId: target.groupId,
    templatePhraseId: retrieved.template.phraseId,
    templateGroupId: retrieved.template.groupId,
    templateSourceCollection: retrieved.template.sourceCollection,
    retrievalTier: retrieved.tier,
    retrievalScore: retrieved.score,
    pitchDelta: adapted.pitchDelta,
    planMae: planMae(target, adapted.units),
    headerMatch: { bpm: th.bpm === gh.bpm, key: th.key === gh.key, mode: th.mode === gh.mode, lineage: th.lineage === gh.lineage },
    barsMatch: barsOf(target).length === barsOf(adapted.units).length,
    grammarOk: true,
    audit: audit(decoded),
    encoded: adapted.units
  };
}
function generateAll(test, train) { return test.map(target => generateOne(target, train)); }

function buildReport(datasetPath, payload, records, generations) {
  const split = { train: [], val: [], test: [] };
  for (const record of records) split[splitName(record.groupId)].push(record);
  const scores = generations.map(item => item.retrievalScore);
  const maes = generations.map(item => item.planMae);
  const templateCounts = new Map();
  const tierCounts = {};
  let warnings = 0, infos = 0, warningSamples = 0;
  for (const item of generations) {
    templateCounts.set(item.templatePhraseId, (templateCounts.get(item.templatePhraseId) || 0) + 1);
    tierCounts[item.retrievalTier] = (tierCounts[item.retrievalTier] || 0) + 1;
    const counts = item.audit && item.audit.counts || {};
    warnings += Number(counts.warning || 0);
    infos += Number(counts.info || 0);
    if (Number(counts.warning || 0) > 0) warningSamples += 1;
  }
  const exact = key => generations.filter(item => item.headerMatch[key]).length / Math.max(1, generations.length);
  const sameGroupLeakage = generations.filter(item => item.targetGroupId === item.templateGroupId).length;
  const samePhraseLeakage = generations.filter(item => item.phraseId === item.templatePhraseId).length;
  const maxTemplateReuse = templateCounts.size ? Math.max(...templateCounts.values()) : 0;
  const manifest = generations.map(item => ({
    phraseId: item.phraseId, templatePhraseId: item.templatePhraseId, templateGroupId: item.templateGroupId,
    retrievalTier: item.retrievalTier, retrievalScore: item.retrievalScore, pitchDelta: item.pitchDelta, encoded: item.encoded
  }));
  return {
    schema: "fame-neural-phase6-block1-retrieval-baseline-report-v1",
    version: 1,
    baseline: {
      id: "fame-retrieval-baseline-v1", representation: "fame-compound-v1",
      type: "deterministic-nearest-template-retrieval", learnedParameters: 0,
      constraints: ["train-only template pool","composition-family leakage exclusion","same bar count required","same mode/lineage preferred","target BPM and key adaptation","pitch/chord transposition","full FAME Compound validation"]
    },
    dataset: {
      source: path.resolve(datasetPath), sha256: sha256File(datasetPath), phrases: records.length,
      groups: new Set(records.map(r => r.groupId)).size,
      split: {
        train: { phrases: split.train.length, groups: new Set(split.train.map(r => r.groupId)).size },
        val: { phrases: split.val.length, groups: new Set(split.val.map(r => r.groupId)).size },
        test: { phrases: split.test.length, groups: new Set(split.test.map(r => r.groupId)).size }
      },
      phase5Schema: payload.schema
    },
    evaluation: {
      testPhrases: generations.length, validGenerations: generations.length, invalidGenerations: 0,
      sameGroupLeakage, samePhraseLeakage,
      retrieval: { meanDistance: mean(scores), p50Distance: percentile(scores, 50), p95Distance: percentile(scores, 95), tierCounts },
      conditioning: {
        meanPlanMae01: mean(maes), p95PlanMae01: percentile(maes, 95),
        bpmExactRate: exact("bpm"), keyExactRate: exact("key"), modeExactRate: exact("mode"), lineageExactRate: exact("lineage"),
        barsExactRate: generations.filter(item => item.barsMatch).length / Math.max(1, generations.length)
      },
      diversity: {
        uniqueTemplates: templateCounts.size, uniqueTemplateRate: templateCounts.size / Math.max(1, generations.length), maxTemplateReuse
      },
      audit: {
        warningFindings: warnings, infoFindings: infos, samplesWithWarnings: warningSamples,
        samplesWithWarningsRate: warningSamples / Math.max(1, generations.length)
      },
      generationManifestSha256: hashJson(manifest)
    }
  };
}

function selfTest() {
  function bar(index, energy = 5) {
    return { kind:"BAR", bar:index, energy, vocalSpace:5, tension:5, density:5, transitionFrom:5, transitionTo:5,
      motifFamily:0, motifRelation:"none", motifSimilarity:5, kick808Available:false, kickCount:0, bassCount:0,
      kickExact:0, kickProximity:0, kickLag:null, kickStrength:0, hatRollCount:0, hatMaxRollNotes:0 };
  }
  function rec(id, groupId, key, bpm, note, energy) {
    return {
      phraseId:id, groupId, sourceCollection:"selftest", bars:1,
      units:[
        {kind:"HEADER",bpm,key,mode:"minor",lineage:"trap"}, bar(0,energy),
        {kind:"EVENT",bar:0,position:0,type:"808",velocityBin:7,note,duration:240,role:"root"}, {kind:"EOS"}
      ]
    };
  }
  const target = rec("target","GT",2,142,40,8);
  const same = rec("same","GT",2,142,40,8);
  const good = rec("good","GG",9,140,47,7);
  const worse = rec("worse","GW",9,100,47,1);
  const picked = retrieveTemplate(target,[same,worse,good]);
  assert.equal(picked.template.phraseId,"good");
  const adapted = adaptTemplate(target,picked.template);
  assert.equal(adapted.units[0].bpm,142);
  assert.equal(adapted.units[0].key,2);
  assert.equal(adapted.units[2].note,52);
  assert.ok(planMae(target,adapted.units) < 0.2);
  console.log("PHASE6 BLOCK1 RETRIEVAL SMOKE: OK");
}

function main(argv = process.argv.slice(2)) {
  try {
    if (argv.includes("--self-test")) return selfTest();
    const datasetPath = path.resolve(argv[0] || path.join(desktopDir(),"FAME_NEURAL_PHASE5_BLOCK3","phase5-microtrain-dataset.json"));
    const outputDir = path.resolve(argv[1] || path.join(desktopDir(),"FAME_NEURAL_PHASE6_BLOCK1"));
    fs.mkdirSync(outputDir,{recursive:true});
    console.log("=== FAME NEURAL / FASE 6 / BLOCCO 1 / RETRIEVAL BASELINE ===");
    if (!fs.existsSync(datasetPath)) throw new Error(`Dataset FASE 5 non trovato: ${datasetPath}`);
    const payload = readJson(datasetPath);
    if (payload.schema !== "fame-neural-phase5-microtrain-dataset-v1") throw new Error(`Schema dataset inatteso: ${payload.schema}`);
    const records = (payload.records || []).map(toRecord);
    if (records.length !== 502) throw new Error(`Attese 502 candidate, trovate ${records.length}`);
    const train = records.filter(r => splitName(r.groupId) === "train");
    const val = records.filter(r => splitName(r.groupId) === "val");
    const test = records.filter(r => splitName(r.groupId) === "test");
    if (train.length !== 401 || val.length !== 58 || test.length !== 43) throw new Error(`Split inatteso: ${train.length}/${val.length}/${test.length}`);
    console.log(`Split: ${train.length}/${val.length}/${test.length}`);
    const generations = generateAll(test,train);
    const secondPass = generateAll(test,train);
    if (hashJson(generations.map(x => x.encoded)) !== hashJson(secondPass.map(x => x.encoded))) throw new Error("Baseline non deterministica");
    const report = buildReport(datasetPath,payload,records,generations);
    if (report.evaluation.sameGroupLeakage || report.evaluation.samePhraseLeakage) throw new Error("Leakage rilevato");
    if (report.evaluation.validGenerations !== 43 || report.evaluation.invalidGenerations !== 0) throw new Error("Gate validità non superato");
    if (report.evaluation.conditioning.barsExactRate !== 1) throw new Error(`Bars exact rate ${report.evaluation.conditioning.barsExactRate}`);
    fs.writeFileSync(path.join(outputDir,"phase6-block1-report.json"),`${JSON.stringify(report,null,2)}\n`,"utf8");
    fs.writeFileSync(path.join(outputDir,"phase6-block1-generations.json"),`${JSON.stringify({
      schema:"fame-neural-phase6-block1-retrieval-generations-v1",version:1,baseline:report.baseline.id,items:generations
    },null,2)}\n`,"utf8");
    console.log(`Valid: ${report.evaluation.validGenerations}/${report.evaluation.testPhrases}`);
    console.log(`Leakage group/phrase: ${report.evaluation.sameGroupLeakage}/${report.evaluation.samePhraseLeakage}`);
    console.log(`Retrieval distance mean/P95: ${report.evaluation.retrieval.meanDistance.toFixed(6)} / ${report.evaluation.retrieval.p95Distance.toFixed(6)}`);
    console.log(`Plan MAE mean/P95: ${report.evaluation.conditioning.meanPlanMae01.toFixed(6)} / ${report.evaluation.conditioning.p95PlanMae01.toFixed(6)}`);
    console.log(`Mode/lineage exact: ${report.evaluation.conditioning.modeExactRate.toFixed(6)} / ${report.evaluation.conditioning.lineageExactRate.toFixed(6)}`);
    console.log(`Unique templates: ${report.evaluation.diversity.uniqueTemplates}/${report.evaluation.testPhrases} | max reuse ${report.evaluation.diversity.maxTemplateReuse}`);
    console.log(`Audit warnings: ${report.evaluation.audit.warningFindings} su ${report.evaluation.audit.samplesWithWarnings} sample`);
    console.log(`Manifest: ${report.evaluation.generationManifestSha256}`);
    console.log(`Output: ${outputDir}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}
if (require.main === module) main();
module.exports = { toRecord, generateOne, generateAll, buildReport, selfTest, main };
