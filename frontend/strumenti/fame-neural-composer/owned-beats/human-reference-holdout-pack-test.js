"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const tool = require("./human-reference-holdout-pack.js");

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function run() {
  const here = __dirname;
  const referenceFile = path.join(here, "audio-analysis-holdout-cohort-r1-v2.json");
  const protocolFile = path.join(here, "audio-analysis-v2-protocol.json");
  const configFile = path.join(here, "audio-analysis-v2-config-001.json");

  const referenceRaw = fs.readFileSync(referenceFile, "utf8");
  const protocolRaw = fs.readFileSync(protocolFile, "utf8");
  const reference = JSON.parse(referenceRaw);
  const protocol = JSON.parse(protocolRaw);
  const config = JSON.parse(fs.readFileSync(configFile, "utf8"));

  tool.validateProtocol(protocol);
  tool.validateReference(reference, protocol);
  assert.strictEqual(tool.cohortDigest(reference.records), reference.cohortDigestSha256);

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "fame-holdout-hr-test-"));
  try {
    fs.mkdirSync(path.join(workspace, "manifest"), { recursive: true });
    fs.mkdirSync(path.join(workspace, "runs", "evaluation-holdout-usage"), { recursive: true });
    fs.mkdirSync(path.join(workspace, "sources"), { recursive: true });

    const records = reference.records.map(item => {
      const localPath = `sources/${item.sourceRecordId}.wav`;
      fs.writeFileSync(path.join(workspace, localPath), Buffer.alloc(0));
      return {
        ...item,
        localPath,
        presentInScan: true,
        split: reference.plannedSplit
      };
    });

    fs.writeFileSync(
      path.join(workspace, "manifest", "owned-beats-manifest.json"),
      JSON.stringify({
        schema: "fame-owned-beats-workspace-v1",
        version: 1,
        sourceCollectionId: "fame-owned-beats-v1",
        records
      }, null, 2) + "\n"
    );

    const identities = tool.sortedIdentities(reference.records);
    const reservation = {
      status: "RESERVED_BEFORE_AUDIO_ACCESS",
      cohortId: reference.cohortId,
      cohortDigestSha256: reference.cohortDigestSha256,
      cohortReferenceDigestSha256: sha256Text(referenceRaw),
      records: identities,
      families: identities.map(x => x.compositionFamilyId).sort(),
      sourceRecordIds: identities.map(x => x.sourceRecordId).sort(),
      sourceAssetIds: identities.map(x => x.sourceAssetId).sort(),
      sha256s: identities.map(x => x.sha256).sort(),
      freezeDigestSha256: "a".repeat(64),
      candidateId: config.candidateId,
      configHash: config.configHash,
      protocolDigestSha256: sha256Text(protocolRaw),
      reservedAt: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(workspace, "runs", "evaluation-holdout-usage", "synthetic.json"),
      JSON.stringify(reservation, null, 2) + "\n"
    );

    const ctx = tool.currentContext(workspace);
    const result = tool.preflightResult(ctx);
    assert.strictEqual(result.mode, "BLIND_HOLDOUT_HUMAN_REFERENCE_PREFLIGHT_PASS");
    assert.strictEqual(result.holdoutFamilies, 10);
    assert.strictEqual(result.audioAccessPerformedByThisCommand, false);

    const ids = records.map(r => tool.blindId(ctx.reservation.digest, r));
    assert.strictEqual(new Set(ids).size, 10);
    assert.ok(ids.every(id => /^HR-[0-9A-F]{10}$/.test(id)));

    const sample = {
      reviewId: tool.DEFAULT_REVIEW_ID,
      families: [{
        ...records[0],
        sourceSha256: records[0].sha256,
        blindId: ids[0]
      }]
    };
    const html = tool.renderBlindHtml(sample, protocol);
    assert.ok(html.includes("Human Reference holdout cieca"));
    assert.ok(html.includes("HOLDOUT · HUMAN REFERENCE"));
    assert.ok(!html.includes("Solo development. Nessun output V1/V2 mostrato."));

    const bad = { ...reservation, sourceRecordIds: reservation.sourceRecordIds.slice(1) };
    fs.unlinkSync(path.join(workspace, "runs", "evaluation-holdout-usage", "synthetic.json"));
    fs.writeFileSync(
      path.join(workspace, "runs", "evaluation-holdout-usage", "synthetic.json"),
      JSON.stringify(bad, null, 2) + "\n"
    );
    assert.throws(() => tool.currentContext(workspace), /sourceRecordIds differs/);

    console.log("human-reference-holdout-pack-test: OK");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

run();
