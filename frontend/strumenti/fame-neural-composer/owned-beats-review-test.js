"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { bootstrap } = require("./owned-beats/bootstrap");
const { review } = require("./owned-beats/review-decisions");

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fame-review-"));

  try {
    const source = path.join(root, "source");
    const work = path.join(root, "work");
    fs.mkdirSync(source);

    fs.writeFileSync(path.join(source, "a.wav"), "a");
    fs.writeFileSync(path.join(source, "b.wav"), "b");
    fs.writeFileSync(path.join(source, "c.wav"), "c");

    await bootstrap(source, work, true);

    const manifest = path.join(
      work,
      "manifest",
      "owned-beats-manifest.json"
    );

    let m = JSON.parse(fs.readFileSync(manifest));
    m.records[0].qa = { humanNote: "preserve" };
    fs.writeFileSync(manifest, JSON.stringify(m, null, 2) + "\n");

    const ids = m.records.map(r => r.sourceRecordId);
    const decision = path.join(root, "review.json");

    fs.writeFileSync(
      decision,
      "\uFEFF" + JSON.stringify(
        {
          schema: "fame-owned-beats-review-v1",
          version: 1,
          reviewId: "pilot-v1-selection",
          decisions: [
            {
              scope: "all-active",
              set: { nativeExports: "NONE_AVAILABLE" },
              note: "No native exports"
            },
            {
              sourceRecordIds: ids.slice(0, 2),
              pilot: {
                cohortId: "owned-beats-pilot-v1",
                selected: true
              },
              note: "Human-selected pilot"
            }
          ]
        },
        null,
        2
      )
    );

    let r = review(work, decision, false);
    assert.equal(r.mode, "PREVIEW");
    assert.equal(r.targetedRecords, 3);

    m = JSON.parse(fs.readFileSync(manifest));
    assert.equal(m.records[0].nativeExports, "UNKNOWN");

    r = review(work, decision, true);
    assert.equal(r.changedRecords, 3);

    m = JSON.parse(fs.readFileSync(manifest));
    assert.equal(m.records[0].qa.humanNote, "preserve");
    assert.ok(
      m.records
        .slice(0, 2)
        .every(x => x.pilotCohorts.includes("owned-beats-pilot-v1"))
    );
    assert.ok(
      m.records.every(x => x.nativeExports === "NONE_AVAILABLE")
    );
    assert.equal(m.reviewLog.length, 1);

    const csv = fs.readFileSync(
      path.join(work, "manifest", "owned-beats-manifest.csv"),
      "utf8"
    );
    assert.match(csv, /pilotCohorts/);
    assert.match(csv, /NONE_AVAILABLE/);

    r = review(work, decision, true);
    assert.equal(r.alreadyApplied, true);

    m = JSON.parse(fs.readFileSync(manifest));
    assert.equal(m.reviewLog.length, 1);

    const bad = path.join(root, "bad.json");
    fs.writeFileSync(
      bad,
      JSON.stringify({
        schema: "fame-owned-beats-review-v1",
        version: 1,
        reviewId: "bad",
        decisions: [
          {
            sourceRecordIds: ["FAME999999"],
            note: "x"
          }
        ]
      })
    );

    assert.throws(
      () => review(work, bad, false),
      /Unknown sourceRecordId/
    );

    fs.writeFileSync(path.join(work, "bootstrap.lock"), "busy");

    const second = path.join(root, "second.json");
    fs.writeFileSync(
      second,
      JSON.stringify({
        schema: "fame-owned-beats-review-v1",
        version: 1,
        reviewId: "second",
        decisions: [
          {
            sourceRecordIds: [ids[0]],
            note: "x"
          }
        ]
      })
    );

    assert.throws(
      () => review(work, second, true),
      /EEXIST/
    );

    fs.unlinkSync(path.join(work, "bootstrap.lock"));

    console.log("OWNED BEATS REVIEW: PASS");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
