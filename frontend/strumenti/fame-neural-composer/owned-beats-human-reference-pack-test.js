"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  selectDevelopmentRecords,
  computeReferenceWindows,
  makeFamilyTemplate,
  makeSubmission,
  validateSubmissionCore,
  renderHtml,
  quantizeTapTimes,
  waveformSvgFromPcm,
  sha256Text
} = require("./owned-beats/human-reference-pack");

const protocolRaw = fs.readFileSync(path.join(__dirname, "owned-beats", "audio-analysis-v2-protocol.json"), "utf8");
const protocol = JSON.parse(protocolRaw);
const protocolInfo = { protocol, raw: protocolRaw, digest: sha256Text(protocolRaw) };

function record(i, split, cohort = false) {
  const n = String(i).padStart(6, "0");
  const sha = String(i % 10).repeat(64);
  return {
    sourceRecordId: `FAME${n}`,
    sourceAssetId: `sha256:${sha}`,
    compositionFamilyId: `family-${n}`,
    sha256: sha,
    localPath: `sources/${sha}/source.wav`,
    presentInScan: true,
    split,
    pilotCohorts: cohort ? ["owned-beats-pilot-v1"] : []
  };
}

const dev = Array.from({ length: 8 }, (_, i) => record(i + 1, "development", true));
const holdout = Array.from({ length: 10 }, (_, i) => record(i + 101, "evaluation-holdout", false));
const manifest = {
  schema: "fame-owned-beats-workspace-v1",
  version: 1,
  sourceCollectionId: "fame-owned-beats-v1",
  records: [...dev, ...holdout]
};

const selected = selectDevelopmentRecords(manifest, protocol);
assert.equal(selected.length, 8);
assert.ok(selected.every(r => r.split === "development"));
assert.ok(selected.every(r => !holdout.includes(r)));

const windows60 = computeReferenceWindows(60, protocol);
assert.deepEqual(windows60.map(w => w.position), ["EARLY", "MIDDLE", "LATE"]);
assert.deepEqual(windows60.map(w => w.startSeconds), [5, 24, 43]);
assert.ok(windows60.every(w => w.durationSeconds === 12));

const windows45 = computeReferenceWindows(45, protocol);
assert.equal(windows45.length, 1);
assert.equal(windows45[0].position, "FULL_TRACK");
assert.equal(windows45[0].durationSeconds, 45);

const pcmFixture = Buffer.alloc(400);
for (let i = 0; i < pcmFixture.length / 2; i++) {
  pcmFixture.writeInt16LE(i % 2 === 0 ? 12000 : -12000, i * 2);
}
const waveformSvg = waveformSvgFromPcm(pcmFixture, 100, 40);
assert.match(waveformSvg, /^<svg /);
assert.match(waveformSvg, /viewBox="0 0 100 40"/);
assert.match(waveformSvg, /<line /);

const quantized = quantizeTapTimes([0.12, 0.63, 1.12, 2.13, 2.62], 3);
assert.equal(quantized.ok, true);
assert.ok(Math.abs(quantized.bpm - 120) < 2);
assert.ok(quantized.outputBeatCount > quantized.inputTapCount);
for (let i = 2; i < quantized.times.length; i++) {
  const a = quantized.times[i - 1] - quantized.times[i - 2];
  const b = quantized.times[i] - quantized.times[i - 1];
  assert.ok(Math.abs(a - b) < 0.002);
}
assert.equal(quantizeTapTimes([0.1, 0.6, 1.1], 3).ok, false);

const tailGuard = quantizeTapTimes([0.15, 0.65, 1.15, 1.65], 3);
assert.equal(tailGuard.ok, true);
assert.equal(tailGuard.inputTapCount, 4);
assert.equal(tailGuard.outputBeatCount, 4);
assert.ok(
  Math.max(...tailGuard.times) < 2,
  "quantizer must not extrapolate a beat grid into an untapped/silent tail"
);

const internalGap = quantizeTapTimes([0.15, 0.65, 1.65, 2.15], 3);
assert.equal(internalGap.ok, true);
assert.equal(internalGap.inputTapCount, 4);
assert.equal(internalGap.outputBeatCount, 5);
assert.ok(
  internalGap.times.some((t, i, a) => i > 0 && i < a.length - 1),
  "quantizer must still fill missing beats inside human-supported range"
);


const badManifest = JSON.parse(JSON.stringify(manifest));
badManifest.records[8].pilotCohorts = ["owned-beats-pilot-v1"];
assert.throws(
  () => selectDevelopmentRecords(badManifest, protocol),
  /Holdout\/non-development record exposed/
);

const fakePack = path.join("C:", "workspace", "runs", "human-reference-v1", "ref-test");
const familyTemplates = selected.map(r =>
  makeFamilyTemplate(r, 60, computeReferenceWindows(60, protocol), fakePack)
);
const submission = makeSubmission(
  "ref-test-001",
  protocolInfo,
  manifest,
  familyTemplates,
  "owned-beats-pilot-v1"
);

for (const family of submission.families) {
  family.beatReference.metricLevel = "PRIMARY_MUSICAL_BEAT";
  family.beatReference.referenceBpm = 120;
  family.beatReference.reviewed = true;
  for (const window of family.beatReference.windows) {
    window.beatTimesSeconds = [0.25, 0.75, 1.25, 1.75];
    window.reviewed = true;
  }
  family.meter = { value: "4/4", reviewed: true };
  family.sections = { boundariesSeconds: [16, 32, 48], reviewed: true };
  family.reviewCostSeconds = 75;
}

const durations = new Map(selected.map(r => [r.sourceRecordId, 60]));
const summary = validateSubmissionCore(submission, manifest, protocolInfo, selected, durations);
assert.equal(summary.expectedFamilies, 8);
assert.equal(summary.reviewCompleteFamilies, 8);
assert.equal(summary.beatMetricUsableFamilies, 8);
assert.equal(summary.finalizationReady, true);

const tamperedWindow = JSON.parse(JSON.stringify(submission));
tamperedWindow.families[0].beatReference.windows[0].startSeconds = 6;
assert.throws(
  () => validateSubmissionCore(tamperedWindow, manifest, protocolInfo, selected, durations),
  /Beat window definition changed/
);

const injectedHoldout = JSON.parse(JSON.stringify(submission));
injectedHoldout.families[0].sourceRecordId = holdout[0].sourceRecordId;
assert.throws(
  () => validateSubmissionCore(injectedHoldout, manifest, protocolInfo, selected, durations),
  /frozen development cohort/
);

const unknownBeat = JSON.parse(JSON.stringify(submission));
unknownBeat.families[0].beatReference.metricLevel = "UNKNOWN";
const incomplete = validateSubmissionCore(unknownBeat, manifest, protocolInfo, selected, durations);
assert.equal(incomplete.reviewCompleteFamilies, 8);
assert.equal(incomplete.beatMetricUsableFamilies, 7);
assert.equal(incomplete.finalizationReady, false);

const html = renderHtml(submission, protocol);
assert.match(html, /HOLDOUT BLOCCATO/);
assert.match(html, /Nessun output V1\/V2 mostrato/);
assert.doesNotMatch(html, /bpmCandidate|alternativeBpms|meterCandidate|sectionCandidates/);
assert.match(html, /Esporta JSON/);
assert.match(html, /wave-editor/);
assert.match(html, /waveforms\//);
assert.match(html, /Registra beat \(tap\)/);
assert.match(html, /-10 ms/);
assert.match(html, /\+1 ms/);
assert.match(html, /Elimina marker/);
assert.match(html, /Calcola BPM dai marker/);
assert.match(html, /Quantizza finestra/);
assert.match(html, /T = tap da tastiera/);
assert.match(html, /wave-playhead/);
assert.match(html, /Griglia -10 ms/);
assert.match(html, /quantizeTapTimes/);
assert.match(html, /marker -1 ms/);
assert.match(html, /marker \+1 ms/);
assert.match(html, /__fameTapCaptureBound/);
assert.match(html, /addEventListener\('keydown'/);
assert.match(html, /Quantizzazione in corso/);
assert.match(html, /TAP /);
assert.match(html, /function refreshBeatUiGlobal/);
assert.match(html, /function addBeatAtGlobal/);
assert.match(html, /refreshBeatUiGlobal\(wi\)/);
assert.match(html, /addBeatAtGlobal\(i,a\.currentTime\)/);
assert.match(html, /T rilevata · premi Play sulla finestra/);
assert.match(html, /tabindex="-1"/);
assert.match(html, /T ARMATA · premi T a ritmo/);
assert.match(html, /wave\.focus/);
assert.doesNotMatch(html, /save\(\);refreshBeatUi\(wi\);setQuantizeStatus/);
assert.match(html, /function quantizeWindow\(wi\)\{var f=state\.families\[current\]/);
assert.match(html, /function shiftWholeGrid\(wi,delta\)\{var f=state\.families\[current\]/);
assert.doesNotMatch(html, /function quantizeWindow\(wi\)\{var w=f\.beatReference/);
const inlineScriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScriptMatch, "generated HTML must contain inline script");
assert.doesNotThrow(
  () => new Function(inlineScriptMatch[1]),
  "generated Human Reference inline script must compile"
);

console.log("OWNED BEATS HUMAN REFERENCE PACK: PASS");
console.log("Development families: 8");
console.log("Beat windows: deterministic 3 x 12s / short-track full fallback");
console.log("Holdout exposure: FORBIDDEN");
console.log("Candidate outputs exposed to annotator: NO");
