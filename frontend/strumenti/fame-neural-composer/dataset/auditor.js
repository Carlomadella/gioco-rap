"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { isDatasetItemFile, validateItem } = require("../midi/corpus-gate");
const { itemFingerprint, eventSummary } = require("./fingerprint");
const { normalizeSimilarityOptions, buildSimilarityReport, pairKey } = require("./similarity");

const AUDIT_SCHEMA = "fame-neural-dataset-audit-v1";
const SPLIT_SCHEMA = "fame-neural-family-safe-split-v1";
const DEFAULT_SPLIT_RATIOS = { train: 0.8, validation: 0.1, test: 0.1 };

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hash01(value) {
  const digest = crypto.createHash("sha256").update(String(value)).digest();
  return digest.readUInt32BE(0) / 0x100000000;
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function duplicateGroups(items, keyName) {
  return [...groupBy(items, item => item[keyName]).entries()]
    .filter(([, members]) => members.length > 1)
    .map(([fingerprint, members]) => ({
      fingerprint,
      count: members.length,
      itemIds: members.map(member => member.itemId).sort(),
      fileNames: members.map(member => member.fileName).sort(),
      compositionFamilies: [...new Set(members.map(member => member.compositionFamily).filter(Boolean))].sort()
    }))
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
}

class UnionFind {
  constructor(values) {
    this.parent = new Map(values.map(value => [value, value]));
    this.rank = new Map(values.map(value => [value, 0]));
  }
  find(value) {
    const parent = this.parent.get(value);
    if (parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }
  union(a, b) {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) return;
    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;
    if (rankA < rankB) [rootA, rootB] = [rootB, rootA];
    this.parent.set(rootB, rootA);
    if (rankA === rankB) this.rank.set(rootA, rankA + 1);
  }
}

function unionMembers(uf, members) {
  if (members.length < 2) return;
  const first = members[0].itemId;
  for (let index = 1; index < members.length; index += 1) uf.union(first, members[index].itemId);
}

function normalizeSplitRatios(input = {}) {
  const raw = {
    train: Number(input.train ?? DEFAULT_SPLIT_RATIOS.train),
    validation: Number(input.validation ?? DEFAULT_SPLIT_RATIOS.validation),
    test: Number(input.test ?? DEFAULT_SPLIT_RATIOS.test)
  };
  const values = Object.values(raw);
  if (values.some(value => !Number.isFinite(value) || value < 0)) return { ...DEFAULT_SPLIT_RATIOS };
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { ...DEFAULT_SPLIT_RATIOS };
  return {
    train: raw.train / total,
    validation: raw.validation / total,
    test: raw.test / total
  };
}

function buildLeakageComponents(items, exactGroups, transpositionGroups, fuzzyGroups = []) {
  const ids = items.map(item => item.itemId);
  const uf = new UnionFind(ids);

  for (const members of groupBy(items, item => item.compositionFamily).values()) unionMembers(uf, members);
  for (const group of exactGroups) unionMembers(uf, group.itemIds.map(id => items.find(item => item.itemId === id)).filter(Boolean));
  for (const group of transpositionGroups) unionMembers(uf, group.itemIds.map(id => items.find(item => item.itemId === id)).filter(Boolean));
  for (const group of fuzzyGroups) unionMembers(uf, group.itemIds.map(id => items.find(item => item.itemId === id)).filter(Boolean));

  const components = new Map();
  for (const item of items) {
    const root = uf.find(item.itemId);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(item);
  }

  return [...components.values()].map(members => ({
    componentId: crypto.createHash("sha256").update(members.map(member => member.itemId).sort().join("|")).digest("hex").slice(0, 16),
    itemIds: members.map(member => member.itemId).sort(),
    fileNames: members.map(member => member.fileName).sort(),
    compositionFamilies: [...new Set(members.map(member => member.compositionFamily).filter(Boolean))].sort(),
    size: members.length,
    orderKey: hash01(members.map(member => member.itemId).sort().join("|"))
  })).sort((a, b) => a.orderKey - b.orderKey || a.componentId.localeCompare(b.componentId));
}

function assignComponentsToSplits(components, ratios) {
  const splitNames = ["train", "validation", "test"];
  const totalItems = components.reduce((sum, component) => sum + component.size, 0);
  const targets = Object.fromEntries(splitNames.map(name => [name, totalItems * ratios[name]]));
  const counts = { train: 0, validation: 0, test: 0 };
  const assignments = [];

  const ordered = [...components].sort((a, b) => b.size - a.size || a.orderKey - b.orderKey || a.componentId.localeCompare(b.componentId));
  for (const component of ordered) {
    const rankedSplits = splitNames.map(name => ({
      name,
      deficit: targets[name] - counts[name],
      normalizedFill: targets[name] > 0 ? counts[name] / targets[name] : Number.POSITIVE_INFINITY,
      tie: hash01(`${component.componentId}:${name}`)
    })).sort((a, b) => b.deficit - a.deficit || a.normalizedFill - b.normalizedFill || a.tie - b.tie);
    const split = rankedSplits[0].name;
    counts[split] += component.size;
    assignments.push({ ...component, split });
  }

  return { assignments, counts, targets };
}

function buildSplitManifest(items, exactGroups, transpositionGroups, ratios = DEFAULT_SPLIT_RATIOS, fuzzyGroups = []) {
  const normalizedRatios = normalizeSplitRatios(ratios);
  const components = buildLeakageComponents(items, exactGroups, transpositionGroups, fuzzyGroups);
  const assigned = assignComponentsToSplits(components, normalizedRatios);
  const splitByItemId = new Map();
  for (const component of assigned.assignments) {
    for (const itemId of component.itemIds) splitByItemId.set(itemId, component.split);
  }

  const manifestItems = items.map(item => ({
    itemId: item.itemId,
    fileName: item.fileName,
    compositionFamily: item.compositionFamily,
    split: splitByItemId.get(item.itemId)
  })).sort((a, b) => a.itemId.localeCompare(b.itemId));

  const familySplits = new Map();
  for (const item of manifestItems) {
    if (!item.compositionFamily) continue;
    if (!familySplits.has(item.compositionFamily)) familySplits.set(item.compositionFamily, new Set());
    familySplits.get(item.compositionFamily).add(item.split);
  }
  const familyLeakage = [...familySplits.entries()]
    .filter(([, splits]) => splits.size > 1)
    .map(([compositionFamily, splits]) => ({ compositionFamily, splits: [...splits].sort() }));

  const duplicateLeakage = [];
  for (const [kind, groups] of [["exact", exactGroups], ["transposition", transpositionGroups], ["fuzzy", fuzzyGroups]]) {
    for (const group of groups) {
      const splits = [...new Set(group.itemIds.map(itemId => splitByItemId.get(itemId)).filter(Boolean))].sort();
      if (splits.length > 1) duplicateLeakage.push({ kind, fingerprint: group.fingerprint, itemIds: group.itemIds, splits });
    }
  }

  return {
    schema: SPLIT_SCHEMA,
    version: 1,
    ratios: normalizedRatios,
    totals: { items: items.length, components: components.length, ...assigned.counts },
    targets: assigned.targets,
    components: assigned.assignments.map(component => ({
      componentId: component.componentId,
      split: component.split,
      size: component.size,
      itemIds: component.itemIds,
      compositionFamilies: component.compositionFamilies
    })),
    items: manifestItems,
    leakage: { compositionFamilies: familyLeakage, duplicateGroups: duplicateLeakage },
    leakageSafe: familyLeakage.length === 0 && duplicateLeakage.length === 0
  };
}

function normalizeOptions(input = {}) {
  const minEvents = Number.isInteger(input.minEvents) && input.minEvents >= 0 ? input.minEvents : 8;
  const minBars = Number.isInteger(input.minBars) && input.minBars > 0 ? input.minBars : 1;
  const timingQuantum = Number.isInteger(input.timingQuantum) && input.timingQuantum > 0 ? input.timingQuantum : 1;
  const durationQuantum = Number.isInteger(input.durationQuantum) && input.durationQuantum > 0 ? input.durationQuantum : timingQuantum;
  const similarity = normalizeSimilarityOptions(input.similarity);
  return {
    minEvents,
    minBars,
    timingQuantum,
    durationQuantum,
    similarity,
    splitRatios: normalizeSplitRatios(input.splitRatios)
  };
}

function auditItems(entries, options = {}) {
  const cfg = normalizeOptions(options);
  const invalidItems = [];
  const items = [];
  const similarityEntries = [];

  for (const entry of entries) {
    const validation = validateItem(entry.item, entry.fileName);
    if (!validation.ok) {
      invalidItems.push({ fileName: entry.fileName, itemId: validation.itemId, issues: validation.issues });
      continue;
    }
    const summary = eventSummary(entry.item);
    similarityEntries.push({
      itemId: validation.itemId,
      fileName: entry.fileName,
      compositionFamily: validation.compositionFamily,
      item: entry.item
    });
    items.push({
      fileName: entry.fileName,
      itemId: validation.itemId,
      sourceSha256: validation.sourceSha256,
      compositionFamily: validation.compositionFamily,
      summary,
      exactMusicFingerprint: itemFingerprint(entry.item, "exact", cfg),
      transpositionFingerprint: itemFingerprint(entry.item, "transposition", cfg),
      rhythmFingerprint: itemFingerprint(entry.item, "rhythm", cfg)
    });
  }

  const duplicateItemIdGroups = duplicateGroups(items, "itemId");
  const exactSourceGroups = duplicateGroups(items, "sourceSha256");
  const exactMusicGroups = duplicateGroups(items, "exactMusicFingerprint");
  const exactSets = new Set(exactMusicGroups.map(group => group.itemIds.join("|")));
  const transpositionGroups = duplicateGroups(items.filter(item => item.transpositionFingerprint), "transpositionFingerprint")
    .filter(group => !exactSets.has(group.itemIds.join("|")));
  const transpositionSets = new Set(transpositionGroups.map(group => group.itemIds.join("|")));
  const rhythmCandidateGroups = duplicateGroups(items, "rhythmFingerprint")
    .filter(group => !exactSets.has(group.itemIds.join("|")) && !transpositionSets.has(group.itemIds.join("|")));

  const knownPairKeys = new Set();
  for (const group of [...exactMusicGroups, ...transpositionGroups]) {
    for (let a = 0; a < group.itemIds.length; a += 1) {
      for (let b = a + 1; b < group.itemIds.length; b += 1) knownPairKeys.add(pairKey(group.itemIds[a], group.itemIds[b]));
    }
  }
  const similarityReport = buildSimilarityReport(similarityEntries, cfg.similarity, knownPairKeys);
  const fuzzyBlockingGroups = similarityReport.blockingPairs.map(pair => ({
    fingerprint: `fuzzy:${pairKey(pair.itemA, pair.itemB)}`,
    count: 2,
    itemIds: [pair.itemA, pair.itemB].sort(),
    fileNames: [pair.fileA, pair.fileB].sort(),
    compositionFamilies: [...new Set([pair.familyA, pair.familyB].filter(Boolean))].sort()
  }));

  const qualityFlags = [];
  for (const item of items) {
    const issues = [];
    if (item.summary.events < cfg.minEvents) issues.push(`pochi eventi: ${item.summary.events} < ${cfg.minEvents}`);
    if (item.summary.bars < cfg.minBars) issues.push(`durata corta: ${item.summary.bars} barre < ${cfg.minBars}`);
    if (issues.length) qualityFlags.push({ itemId: item.itemId, fileName: item.fileName, issues });
  }

  const block1SplitManifest = buildSplitManifest(items, exactMusicGroups, transpositionGroups, cfg.splitRatios);
  const splitManifest = buildSplitManifest(items, exactMusicGroups, transpositionGroups, cfg.splitRatios, fuzzyBlockingGroups);
  const block1BlockingIssues = [];
  if (invalidItems.length) block1BlockingIssues.push(`${invalidItems.length} dataset item non validi per la pipeline FASE 2`);
  if (duplicateItemIdGroups.length) block1BlockingIssues.push(`${duplicateItemIdGroups.length} gruppi con itemId duplicato`);
  if (exactSourceGroups.length) block1BlockingIssues.push(`${exactSourceGroups.length} gruppi con SHA sorgente duplicato`);
  if (exactMusicGroups.length) block1BlockingIssues.push(`${exactMusicGroups.length} gruppi musicalmente identici nel canonico`);
  if (transpositionGroups.length) block1BlockingIssues.push(`${transpositionGroups.length} gruppi equivalenti per trasposizione da revisionare/deduplicare`);
  if (!block1SplitManifest.leakageSafe) block1BlockingIssues.push("split non leakage-safe");

  const blockingIssues = [...block1BlockingIssues];
  if (!similarityReport.complete) blockingIssues.push("similarity report incompleto: aumentare maxPairComparisons o ridurre il corpus in blocchi candidati");
  if (similarityReport.blockingPairs.length) blockingIssues.push(`${similarityReport.blockingPairs.length} coppie fuzzy near-duplicate ad alta confidenza da revisionare/deduplicare`);
  if (!splitManifest.leakageSafe) blockingIssues.push("split non leakage-safe dopo i gruppi fuzzy");

  return {
    schema: AUDIT_SCHEMA,
    version: 1,
    block: "phase3-block2",
    block1Ready: block1BlockingIssues.length === 0,
    block2Ready: blockingIssues.length === 0,
    dataReady: false,
    options: cfg,
    totals: {
      discovered: entries.length,
      valid: items.length,
      invalid: invalidItems.length,
      duplicateItemIdGroups: duplicateItemIdGroups.length,
      exactSourceDuplicateGroups: exactSourceGroups.length,
      exactMusicDuplicateGroups: exactMusicGroups.length,
      transpositionDuplicateGroups: transpositionGroups.length,
      rhythmReviewGroups: rhythmCandidateGroups.length,
      fuzzyComparedPairs: similarityReport.totals.comparedPairs,
      fuzzyReviewPairs: similarityReport.totals.reviewPairs,
      fuzzyBlockingPairs: similarityReport.totals.blockingPairs,
      qualityFlaggedItems: qualityFlags.length,
      splitComponents: splitManifest.totals.components
    },
    blockingIssues,
    invalidItems,
    duplicates: {
      itemIds: duplicateItemIdGroups,
      sourceSha256: exactSourceGroups,
      exactMusic: exactMusicGroups,
      transpositionEquivalent: transpositionGroups,
      rhythmReviewCandidates: rhythmCandidateGroups,
      fuzzyNearDuplicates: similarityReport
    },
    qualityFlags,
    splitManifest,
    items
  };
}

function auditDirectory(inputDir, options = {}) {
  const files = fs.readdirSync(inputDir).filter(isDatasetItemFile).sort((a, b) => a.localeCompare(b));
  const entries = files.map(fileName => ({ fileName, item: readJson(path.join(inputDir, fileName)) }));
  return auditItems(entries, options);
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, reportPath, splitPath, optionsPath] = argv;
  if (!inputDir || !reportPath) {
    console.error("Uso: node auditor.js <dataset-items-dir> <audit-report.json> [split-manifest.json] [options.json]");
    process.exitCode = 64;
    return;
  }

  try {
    const options = optionsPath ? readJson(optionsPath) : {};
    const report = auditDirectory(inputDir, options);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    if (splitPath) fs.writeFileSync(splitPath, `${JSON.stringify(report.splitManifest, null, 2)}\n`, "utf8");

    console.log(`Dataset item: ${report.totals.discovered}`);
    console.log(`Validi: ${report.totals.valid}`);
    console.log(`Duplicati itemId: ${report.totals.duplicateItemIdGroups}`);
    console.log(`Duplicati sorgente: ${report.totals.exactSourceDuplicateGroups}`);
    console.log(`Duplicati musicali esatti: ${report.totals.exactMusicDuplicateGroups}`);
    console.log(`Equivalenti per trasposizione: ${report.totals.transpositionDuplicateGroups}`);
    console.log(`Candidati rhythm-review: ${report.totals.rhythmReviewGroups}`);
    console.log(`Fuzzy confronti completi: ${report.totals.fuzzyComparedPairs}`);
    console.log(`Fuzzy review: ${report.totals.fuzzyReviewPairs}`);
    console.log(`Fuzzy bloccanti: ${report.totals.fuzzyBlockingPairs}`);
    console.log(`Quality flag: ${report.totals.qualityFlaggedItems}`);
    console.log(`Split leakage-safe: ${report.splitManifest.leakageSafe ? "SI" : "NO"}`);
    console.log(`FASE 3 BLOCCO 1: ${report.block1Ready ? "READY" : "REVIEW/BLOCKED"}`);
    console.log(`FASE 3 BLOCCO 2: ${report.block2Ready ? "READY" : "REVIEW/BLOCKED"}`);
    console.log(`Report: ${reportPath}`);
    if (splitPath) console.log(`Split: ${splitPath}`);
    if (!report.block2Ready) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  AUDIT_SCHEMA,
  SPLIT_SCHEMA,
  DEFAULT_SPLIT_RATIOS,
  normalizeSplitRatios,
  buildLeakageComponents,
  buildSplitManifest,
  auditItems,
  auditDirectory,
  main
};
