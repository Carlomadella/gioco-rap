"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const owned = path.join(root, "owned-beats");
const source = fs.readFileSync(path.join(owned, "source-separation-human-review.js"), "utf8");
const mod = require(path.join(owned, "source-separation-human-review.js"));

assert.equal(mod.median([0, 0, 2, 2, 2, 2, 2, 2]), 2);
assert.equal(mod.median([1, 2, 3]), 2);

const pkg = {
  reviewId: "source-separation-human-review-v1-test",
  packageDigestSha256: "digest",
  families: Array.from({ length: 8 }, (_, i) => ({ sourceRecordId: `FAME_TEST_${i + 1}` })),
  pilotGate: {
    technical: "ALL_8_FAMILIES_PASS",
    drums: {
      medianDownstreamUsefulnessAtLeast: 2,
      familiesAtOrAbove2AtLeast: 6
    },
    bass: {
      medianDownstreamUsefulnessAtLeast: 2,
      familiesAtOrAbove2AtLeast: 6
    },
    outcomeIfPass: "OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT",
    outcomeIfFail: "KEEP_AUDIO_TO_MIDI_CLOSED_AND_REVIEW_SEPARATOR"
  }
};

function submission(drumsScores, bassScores) {
  return {
    schema: "fame-owned-beats-source-separation-human-review-submission-v1",
    version: 1,
    reviewId: pkg.reviewId,
    packageDigestSha256: pkg.packageDigestSha256,
    submittedAt: "2026-09-20T00:00:00.000Z",
    families: pkg.families.map((f, i) => ({
      sourceRecordId: f.sourceRecordId,
      drums: { downstreamUsefulness: drumsScores[i], note: "" },
      bass: { downstreamUsefulness: bassScores[i], note: "" },
      reviewerAttested: true
    }))
  };
}

const pass = mod.computeGate(
  submission([0, 0, 2, 2, 2, 2, 2, 2], [1, 1, 2, 2, 2, 2, 3, 3]),
  pkg
);
assert.equal(pass.technical, "ALL_8_FAMILIES_PASS");
assert.equal(pass.drums.medianDownstreamUsefulness, 2);
assert.equal(pass.drums.familiesAtOrAbove2, 6);
assert.equal(pass.drums.pass, true);
assert.equal(pass.bass.pass, true);
assert.equal(pass.pass, true);
assert.equal(pass.outcome, "OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT");

const fail = mod.computeGate(
  submission([0, 0, 0, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2, 2, 2]),
  pkg
);
assert.equal(fail.drums.familiesAtOrAbove2, 5);
assert.equal(fail.drums.pass, false);
assert.equal(fail.pass, false);
assert.equal(fail.outcome, "KEEP_AUDIO_TO_MIDI_CLOSED_AND_REVIEW_SEPARATOR");

const invalid = submission([2,2,2,2,2,2,2,2], [2,2,2,2,2,2,2,2]);
invalid.families[0].reviewerAttested = false;
assert.throws(() => mod.validateSubmission(invalid, pkg), /Reviewer attestation missing/);

assert(source.includes('metricsExposedToReviewer: false'));
assert(!source.includes('stemSumResidualRmsRatio'));
assert(source.includes('source-separation-pilot-review-v1.json'));
assert(source.includes('medianDownstreamUsefulnessAtLeast'));
assert(source.includes('familiesAtOrAbove2AtLeast'));
assert(source.includes('finalHoldoutAllowed: false'));
assert(source.includes('batch131Allowed: false'));
assert(source.includes('trainingAuthorized: false'));
assert(source.includes('audio controls'));
assert(source.includes('Downstream onset/MIDI usefulness'));
assert(source.includes('Downstream pitch/MIDI usefulness'));

console.log("owned-beats-source-separation-human-review-test: PASS");
