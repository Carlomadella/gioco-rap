"use strict";

const fs = require("node:fs");
const path = require("node:path");

const QA_SCHEMA = "fame-neural-annotation-qa-v1";
const METRICS = ["energy", "density", "tension", "vocalSpace", "transitionStrength", "maxTransitionStrength", "kick808RelationStrength"];
const CORE_BAR_METRICS = ["energy", "density", "tension", "vocalSpace"];
const EPSILON = 1e-6;

function round(value, digits = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function mean(values) {
  const nums = (values || []).map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function stddev(values) {
  const nums = (values || []).map(Number).filter(Number.isFinite);
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(nums.reduce((sum, value) => sum + (value - m) ** 2, 0) / nums.length);
}

function quantile(values, q) {
  const nums = (values || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const clamped = Math.max(0, Math.min(1, Number(q) || 0));
  const position = (nums.length - 1) * clamped;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return nums[low];
  const weight = position - low;
  return nums[low] * (1 - weight) + nums[high] * weight;
}

function finite01(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

function almostEqual(a, b, epsilon = EPSILON) {
  return Math.abs(Number(a) - Number(b)) <= epsilon;
}

function annotationFiles(dir) {
  if (!fs.existsSync(dir)) throw new Error(`Directory annotazioni non trovata: ${dir}`);
  return fs.readdirSync(dir)
    .filter(name => /\.annotation\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function readAnnotations(dir) {
  const annotations = [];
  const loadErrors = [];
  for (const fileName of annotationFiles(dir)) {
    try {
      const value = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8"));
      annotations.push({ fileName, annotation: value });
    } catch (error) {
      loadErrors.push({ fileName, error: `${error.name || "Error"}: ${error.message}` });
    }
  }
  return { annotations, loadErrors };
}

function invariantIssues(annotation) {
  const issues = [];
  const phraseId = String(annotation && annotation.phraseId || "<missing>");
  if (!annotation || annotation.schema !== "fame-neural-musical-annotation-v1") issues.push("schema non valido");
  if (!annotation || !annotation.phraseId) issues.push("phraseId mancante");
  const bars = Array.isArray(annotation && annotation.bars) ? annotation.bars : [];
  if (!bars.length) issues.push("bars mancanti");
  if (Number(annotation && annotation.phraseBars) !== bars.length) issues.push(`phraseBars != bars.length (${annotation && annotation.phraseBars}/${bars.length})`);

  for (const metric of METRICS) {
    if (!finite01(annotation && annotation.global && annotation.global[metric])) issues.push(`global.${metric} fuori [0,1]`);
  }

  bars.forEach((bar, index) => {
    if (Number(bar.index) !== index) issues.push(`bar index non contiguo: atteso ${index}, trovato ${bar.index}`);
    for (const metric of ["energy", "density", "tension", "vocalSpace", "rhythmicSyncopation", "harmonyCoverage"]) {
      if (!finite01(bar[metric])) issues.push(`bar${index}.${metric} fuori [0,1]`);
    }
    if (!finite01(bar.phraseBoundary && bar.phraseBoundary.before)) issues.push(`bar${index}.boundary.before fuori [0,1]`);
    if (!finite01(bar.phraseBoundary && bar.phraseBoundary.after)) issues.push(`bar${index}.boundary.after fuori [0,1]`);
    if (!finite01(bar.transitionStrength && bar.transitionStrength.fromPrevious)) issues.push(`bar${index}.transition.fromPrevious fuori [0,1]`);
    if (!finite01(bar.transitionStrength && bar.transitionStrength.toNext)) issues.push(`bar${index}.transition.toNext fuori [0,1]`);
  });

  if (bars.length) {
    if (!almostEqual(bars[0].phraseBoundary && bars[0].phraseBoundary.before, 1)) issues.push("prima boundary.before != 1");
    if (!almostEqual(bars[bars.length - 1].phraseBoundary && bars[bars.length - 1].phraseBoundary.after, 1)) issues.push("ultima boundary.after != 1");

    for (const metric of CORE_BAR_METRICS) {
      const values = bars.map(bar => Number(bar[metric])).filter(Number.isFinite);
      if (values.length === bars.length) {
        const avg = round(mean(values));
        const range = round(Math.max(...values) - Math.min(...values));
        if (!almostEqual(annotation.global && annotation.global[metric], avg)) issues.push(`global.${metric} != media barre`);
        if (!almostEqual(annotation.global && annotation.global[`${metric}Range`], range)) issues.push(`global.${metric}Range != range barre`);
      }
    }

    const transitions = bars.slice(0, -1).map(bar => Number(bar.transitionStrength && bar.transitionStrength.toNext)).filter(Number.isFinite);
    const transitionMean = round(transitions.length ? mean(transitions) : 0);
    const transitionMax = round(transitions.length ? Math.max(...transitions) : 0);
    if (!almostEqual(annotation.global && annotation.global.transitionStrength, transitionMean)) issues.push("global.transitionStrength != media transizioni");
    if (!almostEqual(annotation.global && annotation.global.maxTransitionStrength, transitionMax)) issues.push("global.maxTransitionStrength != max transizioni");

    const kickRelations = bars.filter(bar => bar.kick808 && bar.kick808.available).map(bar => Number(bar.kick808.relationStrength)).filter(Number.isFinite);
    const kickMean = round(kickRelations.length ? mean(kickRelations) : 0);
    if (!almostEqual(annotation.global && annotation.global.kick808RelationStrength, kickMean)) issues.push("global.kick808RelationStrength != media barre disponibili");
  }

  const motifs = annotation && annotation.motifs || {};
  const families = Array.isArray(motifs.families) ? motifs.families : [];
  const familyIds = new Set(families.map(family => family.id));
  if (Number(motifs.familyCount) !== families.length) issues.push("motifs.familyCount != families.length");
  if (families.length > bars.length) issues.push("piu famiglie motif che barre");
  if ((Number(motifs.returnCount) || 0) + (Number(motifs.variationCount) || 0) > Math.max(0, bars.length - 1)) issues.push("conteggio motif return/variation impossibile");
  for (const bar of bars) {
    const familyId = bar.motif && bar.motif.familyId;
    if (familyId && !familyIds.has(familyId)) issues.push(`bar${bar.index}.motif.familyId sconosciuto: ${familyId}`);
  }

  return issues.map(message => ({ phraseId, message }));
}

function rolePresence(annotation, role) {
  return (annotation.bars || []).some(bar => bar.roles && Boolean(bar.roles[role]));
}

function reviewFlags(annotation, sourceStats) {
  const flags = [];
  const g = annotation.global || {};
  const source = annotation.sourceCollection || "unknown";
  const sourceMetric = sourceStats && sourceStats[source] || {};

  for (const metric of ["energy", "density", "tension", "vocalSpace", "maxTransitionStrength"]) {
    const stats = sourceMetric[metric];
    const value = Number(g[metric]);
    if (!stats || !Number.isFinite(value) || stats.count < 4) continue;
    if (value <= stats.q05) flags.push(`source-low:${metric}`);
    if (value >= stats.q95) flags.push(`source-high:${metric}`);
  }

  if (Number(g.energy) >= 0.72 && Number(g.density) <= 0.20) flags.push("cross-check:high-energy-low-density");
  if (Number(g.density) >= 0.78 && Number(g.vocalSpace) >= 0.88) flags.push("cross-check:dense-but-high-vocal-space");
  if (Number(g.maxTransitionStrength) >= 0.65) flags.push("cross-check:very-strong-transition");
  if (rolePresence(annotation, "808") && Number(g.kick808RelationStrength) === 0 && (annotation.bars || []).some(bar => bar.roles && bar.roles.drums)) {
    flags.push("cross-check:808-drums-zero-relation");
  }
  if ((annotation.bars || []).some(bar => bar.hats && bar.hats.rollCount > 0)) flags.push("musical-review:hat-roll");
  if ((annotation.motifs && annotation.motifs.variationCount || 0) > Math.max(2, Math.floor((annotation.phraseBars || 1) / 2))) flags.push("musical-review:motif-variation-heavy");

  return [...new Set(flags)].sort();
}

function metricStats(annotations) {
  const bySource = {};
  const global = {};
  for (const metric of METRICS) global[metric] = [];

  for (const annotation of annotations) {
    const source = annotation.sourceCollection || "unknown";
    if (!bySource[source]) bySource[source] = {};
    for (const metric of METRICS) {
      const value = Number(annotation.global && annotation.global[metric]);
      if (!Number.isFinite(value)) continue;
      global[metric].push(value);
      if (!bySource[source][metric]) bySource[source][metric] = [];
      bySource[source][metric].push(value);
    }
  }

  function summarizeMap(map) {
    const result = {};
    for (const [metric, values] of Object.entries(map)) {
      result[metric] = {
        count: values.length,
        mean: round(mean(values)),
        stddev: round(stddev(values)),
        min: values.length ? round(Math.min(...values)) : 0,
        q05: round(quantile(values, 0.05)),
        q25: round(quantile(values, 0.25)),
        median: round(quantile(values, 0.5)),
        q75: round(quantile(values, 0.75)),
        q95: round(quantile(values, 0.95)),
        max: values.length ? round(Math.max(...values)) : 0
      };
    }
    return result;
  }

  const sources = {};
  for (const [source, map] of Object.entries(bySource).sort(([a], [b]) => a.localeCompare(b))) sources[source] = summarizeMap(map);
  return { global: summarizeMap(global), sources };
}

function stableMetricDistance(annotation, sourceStats) {
  let sum = 0;
  let count = 0;
  for (const metric of ["energy", "density", "tension", "vocalSpace"]) {
    const stats = sourceStats[metric];
    const value = Number(annotation.global && annotation.global[metric]);
    if (!stats || !Number.isFinite(value)) continue;
    const scale = Math.max(0.05, stats.q95 - stats.q05);
    sum += Math.abs(value - stats.median) / scale;
    count += 1;
  }
  return count ? sum / count : 0;
}

function addCandidate(map, annotation, reason, priority) {
  const phraseId = annotation.phraseId;
  if (!phraseId) return;
  const current = map.get(phraseId) || {
    phraseId,
    sourceCollection: annotation.sourceCollection || "unknown",
    sourceDatasetItemId: annotation.sourceDatasetItemId || null,
    phraseBars: annotation.phraseBars,
    global: annotation.global,
    reasons: [],
    priority: 0
  };
  if (!current.reasons.includes(reason)) current.reasons.push(reason);
  current.priority = Math.max(current.priority, priority);
  map.set(phraseId, current);
}

function buildReviewSample(annotations, stats, options = {}) {
  const perSource = Math.max(4, Math.round(Number(options.perSource) || 10));
  const sample = [];
  const groups = new Map();
  for (const annotation of annotations) {
    const source = annotation.sourceCollection || "unknown";
    if (!groups.has(source)) groups.set(source, []);
    groups.get(source).push(annotation);
  }

  for (const [source, list] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const candidates = new Map();
    const sourceStats = stats.sources[source] || {};
    const sorted = [...list].sort((a, b) => String(a.phraseId).localeCompare(String(b.phraseId)));

    const medoid = [...sorted].sort((a, b) =>
      stableMetricDistance(a, sourceStats) - stableMetricDistance(b, sourceStats)
      || String(a.phraseId).localeCompare(String(b.phraseId))
    )[0];
    if (medoid) addCandidate(candidates, medoid, "representative:source-medoid", 3);

    for (const metric of ["energy", "density", "tension", "vocalSpace", "maxTransitionStrength", "kick808RelationStrength"]) {
      const eligible = sorted.filter(item => Number.isFinite(Number(item.global && item.global[metric])));
      if (!eligible.length) continue;
      const asc = [...eligible].sort((a, b) => Number(a.global[metric]) - Number(b.global[metric]) || String(a.phraseId).localeCompare(String(b.phraseId)));
      addCandidate(candidates, asc[0], `extreme:min:${metric}`, 2);
      addCandidate(candidates, asc[asc.length - 1], `extreme:max:${metric}`, 2);
    }

    for (const annotation of sorted) {
      for (const flag of reviewFlags(annotation, stats.sources)) addCandidate(candidates, annotation, flag, flag.startsWith("cross-check:") ? 4 : 1);
    }

    const selected = [...candidates.values()].sort((a, b) =>
      b.priority - a.priority
      || b.reasons.length - a.reasons.length
      || String(a.phraseId).localeCompare(String(b.phraseId))
    ).slice(0, Math.min(perSource, candidates.size));

    sample.push(...selected);
  }

  return sample.sort((a, b) =>
    a.sourceCollection.localeCompare(b.sourceCollection)
    || b.priority - a.priority
    || a.phraseId.localeCompare(b.phraseId)
  );
}

function calibrationSignals(annotations, stats, issueCount, sample) {
  const signals = [];
  for (const metric of ["energy", "density", "tension", "vocalSpace", "transitionStrength"]) {
    const metricStats = stats.global[metric];
    if (metricStats && metricStats.count >= 20 && metricStats.stddev < 0.025) {
      signals.push({ severity: "warning", code: `collapsed:${metric}`, detail: `stddev globale ${metricStats.stddev} < 0.025` });
    }
  }

  const sourceCount = Object.keys(stats.sources).length;
  const crossChecks = annotations.filter(annotation => reviewFlags(annotation, stats.sources).some(reason => reason.startsWith("cross-check:"))).length;
  if (issueCount > 0) signals.push({ severity: "blocker", code: "invariants-failed", detail: `${issueCount} violazioni invarianti` });
  if (sourceCount < 2) signals.push({ severity: "warning", code: "source-diversity-low", detail: `${sourceCount} sola/e sorgente/i nel QA` });
  if (crossChecks > Math.max(12, Math.round(annotations.length * 0.12))) {
    signals.push({ severity: "warning", code: "cross-check-rate-high", detail: `${crossChecks} elementi campione con contraddizioni euristiche` });
  }

  return {
    signals,
    decision: signals.some(item => item.severity === "blocker")
      ? "BLOCKED"
      : "HUMAN_REVIEW_REQUIRED",
    rule: "Nessuna modifica ai pesi/soglie viene applicata automaticamente: la calibrazione richiede evidenza sistematica dal QA e revisione musicale."
  };
}

function runQa(annotations, options = {}) {
  const list = Array.isArray(annotations) ? annotations : [];
  const duplicateIds = [];
  const seen = new Set();
  for (const annotation of list) {
    if (!annotation || !annotation.phraseId) continue;
    if (seen.has(annotation.phraseId)) duplicateIds.push(annotation.phraseId);
    seen.add(annotation.phraseId);
  }

  const invariantFailures = [];
  for (const annotation of list) invariantFailures.push(...invariantIssues(annotation));
  for (const phraseId of duplicateIds) invariantFailures.push({ phraseId, message: "phraseId duplicato" });

  const stats = metricStats(list);
  const sample = buildReviewSample(list, stats, options);
  const calibration = calibrationSignals(list, stats, invariantFailures.length, sample);
  const sourceCounts = {};
  for (const annotation of list) {
    const source = annotation.sourceCollection || "unknown";
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }

  return {
    schema: QA_SCHEMA,
    version: 1,
    generatedFrom: "fame-neural-musical-annotation-v1",
    totals: {
      annotations: list.length,
      sources: Object.keys(sourceCounts).length,
      invariantFailures: invariantFailures.length,
      duplicatePhraseIds: duplicateIds.length,
      reviewSample: sample.length
    },
    sourceCounts: Object.fromEntries(Object.entries(sourceCounts).sort(([a], [b]) => a.localeCompare(b))),
    stats,
    invariantFailures,
    reviewSample: sample,
    calibration
  };
}

function markdownReport(report) {
  const lines = [];
  lines.push("# FAME Neural — FASE 4 / Blocco 2A QA report", "");
  lines.push(`Annotazioni: **${report.totals.annotations}**`);
  lines.push(`Sorgenti: **${report.totals.sources}**`);
  lines.push(`Violazioni invarianti: **${report.totals.invariantFailures}**`);
  lines.push(`Campione revisione: **${report.totals.reviewSample}**`, "");
  lines.push(`Decisione automatica: **${report.calibration.decision}**`, "");
  lines.push("## Distribuzioni globali", "");
  lines.push("| Feature | Mean | Stddev | P05 | Median | P95 |", "| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const metric of METRICS) {
    const s = report.stats.global[metric];
    lines.push(`| ${metric} | ${s.mean} | ${s.stddev} | ${s.q05} | ${s.median} | ${s.q95} |`);
  }
  lines.push("", "## Sorgenti", "");
  for (const [source, count] of Object.entries(report.sourceCounts)) lines.push(`- ${source}: ${count}`);

  lines.push("", "## Invarianti", "");
  if (!report.invariantFailures.length) lines.push("- OK: nessuna violazione rilevata.");
  else for (const issue of report.invariantFailures.slice(0, 100)) lines.push(`- ${issue.phraseId}: ${issue.message}`);

  lines.push("", "## Campione stratificato per revisione musicale", "");
  lines.push("| Source | Phrase | E | D | T | V | Priority | Reasons |", "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const item of report.reviewSample) {
    const g = item.global || {};
    lines.push(`| ${item.sourceCollection} | ${item.phraseId} | ${g.energy} | ${g.density} | ${g.tension} | ${g.vocalSpace} | ${item.priority} | ${item.reasons.join(", ")} |`);
  }

  lines.push("", "## Segnali di calibrazione", "");
  if (!report.calibration.signals.length) lines.push("- Nessun segnale automatico sufficiente a giustificare una modifica dei pesi.");
  else for (const signal of report.calibration.signals) lines.push(`- ${signal.severity.toUpperCase()} — ${signal.code}: ${signal.detail}`);
  lines.push("", `> ${report.calibration.rule}`, "");
  return `${lines.join("\n")}\n`;
}

function main(argv = process.argv.slice(2)) {
  const [annotationDir, reportJson, reportMarkdown, perSourceArg] = argv;
  if (!annotationDir || !reportJson || !reportMarkdown) {
    console.error("Uso: node qa.js <annotation-dir> <qa-report.json> <qa-report.md> [sample-per-source]");
    process.exitCode = 64;
    return;
  }

  try {
    const loaded = readAnnotations(annotationDir);
    if (loaded.loadErrors.length) throw new Error(`Annotazioni non leggibili: ${loaded.loadErrors.length}`);
    const report = runQa(loaded.annotations.map(item => item.annotation), { perSource: perSourceArg });
    fs.mkdirSync(path.dirname(path.resolve(reportJson)), { recursive: true });
    fs.mkdirSync(path.dirname(path.resolve(reportMarkdown)), { recursive: true });
    fs.writeFileSync(reportJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(reportMarkdown, markdownReport(report), "utf8");

    console.log(`Annotazioni QA: ${report.totals.annotations}`);
    console.log(`Sorgenti: ${report.totals.sources}`);
    console.log(`Violazioni invarianti: ${report.totals.invariantFailures}`);
    console.log(`Campione revisione: ${report.totals.reviewSample}`);
    console.log(`Decisione: ${report.calibration.decision}`);
    console.log(`Report JSON: ${reportJson}`);
    console.log(`Report MD: ${reportMarkdown}`);
    if (report.totals.invariantFailures > 0) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  QA_SCHEMA,
  METRICS,
  mean,
  stddev,
  quantile,
  invariantIssues,
  metricStats,
  reviewFlags,
  buildReviewSample,
  calibrationSignals,
  runQa,
  markdownReport,
  readAnnotations,
  main
};
