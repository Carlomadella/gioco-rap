"use strict";

const assert = require("node:assert");
const review = require("./audio-to-midi-independent-evaluation-human-review.js");

const ids = Array.from({ length: 12 }, (_, i) => "FAME" + String(i + 1).padStart(6, "0"));
const orderA = review.opaqueOrder(ids);
const orderB = review.opaqueOrder(ids);
assert.deepStrictEqual(orderA, orderB);
assert.strictEqual(orderA.length, 12);
assert.strictEqual(new Set(orderA.map(x => x.reviewLabel)).size, 12);
assert.strictEqual(new Set(orderA.map(x => x.sourceRecordId)).size, 12);
assert.ok(orderA.every((x, i) => x.reviewLabel === "S" + String(i + 1).padStart(2, "0")));

const passStats = review.computeStats(
  Array.from({ length: 12 }, (_, i) => ({ score: i < 9 ? 2 : 1 })),
  { medianUsefulnessAtLeast: 2, familiesAtOrAbove2AtLeast: 9 }
);
assert.strictEqual(passStats.medianUsefulness, 2);
assert.strictEqual(passStats.familiesAtOrAbove2, 9);
assert.strictEqual(passStats.pass, true);

const failStats = review.computeStats(
  Array.from({ length: 12 }, (_, i) => ({ score: i < 8 ? 2 : 1 })),
  { medianUsefulnessAtLeast: 2, familiesAtOrAbove2AtLeast: 9 }
);
assert.strictEqual(failStats.pass, false);

const pkg = {
  reviewId: "audio-to-midi-independent-evaluation-human-review-v1-001",
  packageDigestSha256: "abc",
  families: orderA.map(x => ({ reviewLabel: x.reviewLabel }))
};
const doc = {
  schema: "fame-owned-beats-audio-to-midi-independent-evaluation-human-review-submission-v1",
  version: 1,
  reviewId: pkg.reviewId,
  packageDigestSha256: pkg.packageDigestSha256,
  families: orderA.map(x => ({
    reviewLabel: x.reviewLabel,
    drums: { score: 2, note: "" },
    lowEnd: { score: 2, note: "" },
    reviewerAttested: true
  }))
};
assert.strictEqual(review.validateSubmission(doc, pkg), doc);

const key = {
  mapping: Object.fromEntries(orderA.map(x => [x.reviewLabel, x.sourceRecordId])),
  selectedArms: { drums: "drums-bass-kick-fusion-v1", lowEnd: "librosa-pyin-lowend-v1" }
};
const protocol = {
  gate: {
    drums: { medianUsefulnessAtLeast: 2, familiesAtOrAbove2AtLeast: 9 },
    lowEnd: { medianUsefulnessAtLeast: 2, familiesAtOrAbove2AtLeast: 9 },
    outcomeIfPass: "OPEN_OWNED_BEATS_AUDIO_TO_MIDI_BATCH_PREPARATION",
    outcomeIfFail: "KEEP_BATCH_CLOSED_REVIEW_FAILURES"
  }
};
const finalized = review.finalizeSubmission(doc, pkg, key, protocol);
assert.strictEqual(finalized.gate.pass, true);
assert.strictEqual(finalized.gate.drums.familiesAtOrAbove2, 12);
assert.strictEqual(finalized.gate.lowEnd.familiesAtOrAbove2, 12);
assert.strictEqual(finalized.families.length, 12);
assert.ok(finalized.families.every(x => x.sourceRecordId && x.reviewLabel));

const bad = JSON.parse(JSON.stringify(doc));
bad.families[0].reviewerAttested = false;
assert.throws(() => review.validateSubmission(bad, pkg), /attestation/);

process.stdout.write("AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_HUMAN_REVIEW_TEST_PASS\n");
