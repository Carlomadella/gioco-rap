"use strict";

const fs = require("node:fs");
const path = require("node:path");

const FEEDBACK_SCHEMA = "fame-neural-human-review-feedback-v1";
const ANALYSIS_SCHEMA = "fame-neural-human-review-analysis-v1";
const EXCLUSIONS_SCHEMA = "fame-neural-human-review-exclusions-v1";

const METRIC_LABELS = new Set([
  "energy-low", "energy-high",
  "density-low", "density-high",
  "tension-low", "tension-high",
  "vocal-space-low", "vocal-space-high",
  "transition-bad", "kick808-bad", "hat-roll-bad", "motif-bad"
]);
const QUALITY_LABELS = new Set(["source-bad"]);
const NEUTRAL_LABELS = new Set(["ok"]);

function round(value, digits = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function percentage(count, total) {
  return total > 0 ? round((count / total) * 100, 2) : 0;
}

function stableCounts(values) {
  const map = new Map();
  for (const value of values) map.set(value, (map.get(value) || 0) + 1);
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))));
}

function noteFlags(note) {
  const text = String(note || "").toLowerCase();
  const flags = [];
  if (/clipp|distors|saturaz/.test(text)) flags.push("playback-distortion");
  if (/piattin|cymbal|hi-hat|hat\b/.test(text)) flags.push("cymbal-hat-playback");
  if (/fuori tonalit|bassline|melodico-armonic|arpeggio|lead/.test(text)) flags.push("melodic-harmonic-quality");
  if (/struttura|note sembrano organizzate male|musicalmente poco/.test(text)) flags.push("phrase-structure-quality");
  return [...new Set(flags)].sort();
}

function validateFeedback(feedback) {
  const errors = [];
  if (!feedback || typeof feedback !== "object") return ["feedback non e' un oggetto"];
  if (feedback.schema !== FEEDBACK_SCHEMA) errors.push(`schema non valido: ${String(feedback.schema)}`);
  if (Number(feedback.version) !== 1) errors.push(`versione non valida: ${String(feedback.version)}`);
  if (!feedback.reviewManifest || typeof feedback.reviewManifest !== "string") errors.push("reviewManifest mancante");
  const items = Array.isArray(feedback.items) ? feedback.items : [];
  if (!items.length) errors.push("items vuoto");
  if (Number(feedback.total) !== items.length) errors.push(`total != items.length (${feedback.total}/${items.length})`);
  if (Number(feedback.completed) !== items.length) errors.push(`completed != items.length (${feedback.completed}/${items.length})`);

  const seen = new Set();
  items.forEach((item, index) => {
    const phraseId = typeof item && item && typeof item.phraseId === "string" ? item.phraseId.trim() : "";
    if (!phraseId) errors.push(`item ${index}: phraseId mancante`);
    else if (seen.has(phraseId)) errors.push(`phraseId duplicato: ${phraseId}`);
    else seen.add(phraseId);
    if (!item || typeof item.sourceCollection !== "string" || !item.sourceCollection.trim()) errors.push(`item ${index}: sourceCollection mancante`);
    const labels = Array.isArray(item && item.labels) ? item.labels : [];
    if (!labels.length) errors.push(`item ${index}: labels vuoto`);
    const normalized = labels.map(label => String(label));
    if (normalized.includes("ok") && normalized.length > 1) errors.push(`item ${phraseId || index}: ok non puo' convivere con altri label`);
  });
  return errors;
}

function analyzeFeedback(feedback) {
  const errors = validateFeedback(feedback);
  if (errors.length) {
    const error = new Error(`Feedback review non valido (${errors.length}): ${errors.join(" | ")}`);
    error.validationErrors = errors;
    throw error;
  }

  const items = feedback.items;
  const labelsFlat = [];
  const sourceCounts = {};
  const sourceOutcomes = {};
  const metricIssueItems = [];
  const qualityExclusions = [];
  const technicalNotes = [];
  let coherent = 0;

  for (const item of items) {
    const labels = item.labels.map(label => String(label));
    labelsFlat.push(...labels);
    sourceCounts[item.sourceCollection] = (sourceCounts[item.sourceCollection] || 0) + 1;
    if (!sourceOutcomes[item.sourceCollection]) sourceOutcomes[item.sourceCollection] = { ok: 0, metricIssue: 0, qualityExclusion: 0 };

    if (labels.length === 1 && labels[0] === "ok") {
      coherent += 1;
      sourceOutcomes[item.sourceCollection].ok += 1;
    }

    const metricLabels = labels.filter(label => METRIC_LABELS.has(label));
    if (metricLabels.length) {
      sourceOutcomes[item.sourceCollection].metricIssue += 1;
      metricIssueItems.push({
        phraseId: item.phraseId,
        sourceCollection: item.sourceCollection,
        labels: metricLabels,
        note: String(item.note || "")
      });
    }

    if (labels.some(label => QUALITY_LABELS.has(label))) {
      sourceOutcomes[item.sourceCollection].qualityExclusion += 1;
      qualityExclusions.push({
        phraseId: item.phraseId,
        sourceCollection: item.sourceCollection,
        reason: String(item.note || "phrase esclusa dalla review umana").trim()
      });
    }

    const flags = noteFlags(item.note);
    if (flags.length) technicalNotes.push({
      phraseId: item.phraseId,
      sourceCollection: item.sourceCollection,
      flags,
      note: String(item.note || "").trim()
    });
  }

  const playbackNotes = technicalNotes.filter(item =>
    item.flags.includes("playback-distortion") || item.flags.includes("cymbal-hat-playback")
  );

  const usable = items.length - qualityExclusions.length;
  const metricIssueLabels = metricIssueItems.flatMap(item => item.labels);
  const metricLabelCounts = stableCounts(metricIssueLabels);
  const repeatedMetricIssues = Object.entries(metricLabelCounts)
    .filter(([, count]) => count >= 2)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const analysis = {
    schema: ANALYSIS_SCHEMA,
    version: 1,
    reviewManifest: feedback.reviewManifest,
    generatedAt: feedback.generatedAt || null,
    totals: {
      reviewed: items.length,
      coherent,
      qualityExclusions: qualityExclusions.length,
      metricIssueItems: metricIssueItems.length,
      usableAfterQualityExclusions: usable,
      technicalNotes: technicalNotes.length,
      playbackNotes: playbackNotes.length
    },
    rates: {
      fullCoherencePercent: percentage(coherent, items.length),
      usableLabelAgreementPercent: percentage(coherent, usable),
      qualityExclusionPercent: percentage(qualityExclusions.length, items.length),
      metricIssuePercent: percentage(metricIssueItems.length, items.length)
    },
    labels: stableCounts(labelsFlat),
    sourceCounts: Object.fromEntries(Object.entries(sourceCounts).sort(([a], [b]) => a.localeCompare(b))),
    sourceOutcomes: Object.fromEntries(Object.entries(sourceOutcomes).sort(([a], [b]) => a.localeCompare(b))),
    metricIssues: metricIssueItems,
    repeatedMetricIssues,
    qualityExclusions,
    technicalNotes,
    playbackNotes,
    calibrationEvidence: {
      systematicMetricPatternDetected: repeatedMetricIssues.length > 0,
      rule: "La review produce evidenza; non modifica automaticamente pesi o soglie. Una calibrazione globale richiede errori metrici ripetuti e musicalmente coerenti."
    }
  };

  const exclusions = {
    schema: EXCLUSIONS_SCHEMA,
    version: 1,
    reviewManifest: feedback.reviewManifest,
    policy: "exclude-from-neural-training-candidates-without-deleting-source",
    exclusions: qualityExclusions.map(item => ({
      phraseId: item.phraseId,
      sourceCollection: item.sourceCollection,
      reason: item.reason
    }))
  };

  return { analysis, exclusions };
}

function main(argv = process.argv.slice(2)) {
  const [feedbackPath, analysisPath, exclusionsPath] = argv;
  if (!feedbackPath || !analysisPath || !exclusionsPath) {
    console.error("Uso: node human-review.js <FAME_FEEDBACK.json> <analysis.json> <exclusions.json>");
    process.exitCode = 64;
    return;
  }
  try {
    const feedback = JSON.parse(fs.readFileSync(feedbackPath, "utf8"));
    const { analysis, exclusions } = analyzeFeedback(feedback);
    fs.mkdirSync(path.dirname(path.resolve(analysisPath)), { recursive: true });
    fs.mkdirSync(path.dirname(path.resolve(exclusionsPath)), { recursive: true });
    fs.writeFileSync(analysisPath, `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
    fs.writeFileSync(exclusionsPath, `${JSON.stringify(exclusions, null, 2)}\n`, "utf8");
    console.log(`Review: ${analysis.totals.reviewed}`);
    console.log(`Tutto coerente: ${analysis.totals.coherent}`);
    console.log(`Esclusioni qualita': ${analysis.totals.qualityExclusions}`);
    console.log(`Errori metrici: ${analysis.totals.metricIssueItems}`);
    console.log(`Pattern metrici ripetuti: ${analysis.repeatedMetricIssues.length}`);
    console.log(`Agreement su phrase usabili: ${analysis.rates.usableLabelAgreementPercent}%`);
    console.log(`Analysis: ${analysisPath}`);
    console.log(`Exclusions: ${exclusionsPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  FEEDBACK_SCHEMA,
  ANALYSIS_SCHEMA,
  EXCLUSIONS_SCHEMA,
  validateFeedback,
  analyzeFeedback,
  noteFlags,
  main
};
