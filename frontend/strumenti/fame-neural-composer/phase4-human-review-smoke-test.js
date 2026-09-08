"use strict";

const assert = require("node:assert/strict");
const { analyzeFeedback, validateFeedback, noteFlags } = require("./annotation/human-review");

const feedback = {
  schema: "fame-neural-human-review-feedback-v1",
  version: 1,
  reviewManifest: "abc123",
  generatedAt: "2026-09-08T15:00:00.000Z",
  completed: 5,
  total: 5,
  items: [
    { phraseId: "p1", sourceCollection: "a", labels: ["ok"], note: "" },
    { phraseId: "p2", sourceCollection: "a", labels: ["tension-high"], note: "tensione sovrastimata" },
    { phraseId: "p3", sourceCollection: "b", labels: ["source-bad"], note: "Lead fuori tonalita rispetto alla bassline" },
    { phraseId: "p4", sourceCollection: "b", labels: ["ok"], note: "clipping sui piattini hi-hat" },
    { phraseId: "p5", sourceCollection: "c", labels: ["ok"], note: "" }
  ]
};

assert.deepEqual(validateFeedback(feedback), []);
const { analysis, exclusions } = analyzeFeedback(feedback);
assert.equal(analysis.totals.reviewed, 5);
assert.equal(analysis.totals.coherent, 3);
assert.equal(analysis.totals.qualityExclusions, 1);
assert.equal(analysis.totals.metricIssueItems, 1);
assert.equal(analysis.totals.playbackNotes, 1);
assert.equal(analysis.totals.usableAfterQualityExclusions, 4);
assert.equal(analysis.rates.usableLabelAgreementPercent, 75);
assert.equal(analysis.repeatedMetricIssues.length, 0);
assert.equal(exclusions.exclusions.length, 1);
assert.equal(exclusions.exclusions[0].phraseId, "p3");
assert.ok(noteFlags("clipping sui piattini hi-hat").includes("playback-distortion"));
assert.ok(noteFlags("clipping sui piattini hi-hat").includes("cymbal-hat-playback"));

const repeated = JSON.parse(JSON.stringify(feedback));
repeated.items[4].labels = ["tension-high"];
const repeatedAnalysis = analyzeFeedback(repeated).analysis;
assert.deepEqual(repeatedAnalysis.repeatedMetricIssues, [{ label: "tension-high", count: 2 }]);

const broken = JSON.parse(JSON.stringify(feedback));
broken.completed = 4;
assert.ok(validateFeedback(broken).some(error => error.includes("completed")));

console.log("FASE 4 / BLOCCO 2B / HUMAN REVIEW");
console.log("VALIDAZIONE FEEDBACK: OK");
console.log("CLASSIFICAZIONE ESITI: OK");
console.log("EXCLUSION OVERLAY: OK");
console.log("TECHNICAL NOTE FLAGS: OK");
console.log("SYSTEMATIC METRIC GUARD: OK");
console.log("PHASE4 HUMAN REVIEW SMOKE TEST: OK");
