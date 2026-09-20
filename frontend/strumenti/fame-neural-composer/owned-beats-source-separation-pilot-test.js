"use strict";

const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const pilot = require("./owned-beats/source-separation-pilot");

function sha(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function makeWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fame-source-separation-"));
  fs.mkdirSync(path.join(root, "manifest"), { recursive: true });
  const records = [];
  for (let i = 1; i <= 8; i++) {
    const payload = Buffer.from(`source-${i}`);
    const hash = sha(payload);
    const localPath = `sources/${hash}/source.wav`;
    const source = path.join(root, localPath);
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, payload);
    records.push({
      sourceRecordId: `FAME${String(i).padStart(6, "0")}`,
      sourceAssetId: `sha256:${hash}`,
      compositionFamilyId: `FAM-TEST-${i}`,
      familyStatus: "CONFIRMED_DISTINCT_COMPOSITION",
      sha256: hash,
      bytes: payload.length,
      format: "wav",
      sourcePaths: [`source-${i}.wav`],
      localPath,
      rightsStatus: "OWNER_DECLARED",
      metadataStatus: "ANALYZED",
      nativeExports: "NONE_AVAILABLE",
      taskAdmissibility: "candidate",
      presentInScan: true,
      split: "development",
      roles: {
        drums: { processing: "PENDING", review: "NOT_PROCESSED", artifactId: null },
        lowend: { processing: "PENDING", review: "NOT_PROCESSED", artifactId: null },
        tonal: { processing: "PENDING", review: "NOT_PROCESSED", artifactId: null },
        full: { processing: "PENDING", review: "NOT_PROCESSED", artifactId: null }
      },
      qa: {}, notes: [], relatedPriorAssets: []
    });
  }
  fs.writeFileSync(
    path.join(root, "manifest", "owned-beats-manifest.json"),
    JSON.stringify({
      schema: "fame-owned-beats-workspace-v1",
      version: 1,
      sourceCollectionId: "fame-owned-beats-v1",
      records
    }, null, 2) + "\n"
  );
  return root;
}

(async () => {
  const root = makeWorkspace();
  try {
    const preflight = pilot.preflight(root);
    assert.equal(preflight.mode, "SOURCE_SEPARATION_PILOT_PREFLIGHT_PASS");
    assert.equal(preflight.records, 8);
    assert.equal(preflight.compositionFamilies, 8);
    assert.equal(preflight.holdoutAccessAllowed, false);
    assert.equal(preflight.sourceAudioAccessPerformedByThisCommand, false);
    assert.equal(preflight.trainingAuthorized, false);

    const prepared = await pilot.prepare(root, "source-sep-test-001");
    assert.equal(prepared.mode, "SOURCE_SEPARATION_PILOT_PREPARED");
    assert.equal(prepared.records, 8);
    assert.equal(prepared.sourceBytesVerified, true);
    assert.equal(prepared.separationExecutedByThisCommand, false);

    const check = pilot.check(root, "source-sep-test-001");
    assert.equal(check.status, "PREPARED_NO_INFERENCE");
    assert.equal(check.records, 8);
    assert.equal(check.separationExecuted, false);
    assert.equal(check.holdoutExcluded, true);
    assert.equal(check.taskDataReady, false);

    const manifestFile = path.join(root, "manifest", "owned-beats-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    manifest.records[0].split = "evaluation-holdout-r1-v2";
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
    assert.throws(() => pilot.preflight(root), /Expected 8 development records/);

    console.log("owned-beats-source-separation-pilot-test: PASS");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
