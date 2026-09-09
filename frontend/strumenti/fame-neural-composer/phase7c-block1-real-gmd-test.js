"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const { importMidiDirectory } = require("./midi/batch-import-midi");
const {
  buildDrumViewV2,
  validateDrumViewV2
} = require("./dataset/drum-view-v2");

function countMidi(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(name => /\.(mid|midi)$/i.test(name)).length;
}

function ensureGmdSample(repoRoot) {
  const sampleInput = path.join(os.tmpdir(), "fame-neural-gmd-phase2", "sample-input");
  if (countMidi(sampleInput) >= 3) return sampleInput;

  const bootstrap = path.join(
    repoRoot,
    "frontend",
    "strumenti",
    "fame-neural-composer",
    "midi",
    "bootstrap-gmd-phase2.ps1"
  );
  const psExe = process.platform === "win32" ? "powershell.exe" : "pwsh";
  const r = cp.spawnSync(psExe, [
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", bootstrap,
    "-SampleCount", "6"
  ], { cwd: repoRoot, encoding: "utf8", windowsHide: true });

  process.stdout.write(r.stdout || "");
  process.stderr.write(r.stderr || "");
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`Bootstrap GMD fallito (exit ${r.status})`);
  if (countMidi(sampleInput) < 3) throw new Error("Bootstrap GMD completato ma campione insufficiente.");
  return sampleInput;
}

function readItems(dir) {
  return fs.readdirSync(dir)
    .filter(name => /\.dataset-item\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const sampleInput = ensureGmdSample(repoRoot);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-neural-phase7c-block1-"));
  const itemDir = path.join(tmp, "items");

  try {
    const batch = importMidiDirectory(sampleInput, itemDir);
    assert.ok(batch.totals.discovered >= 3);
    assert.equal(batch.totals.imported, batch.totals.discovered);
    assert.equal(batch.totals.failed, 0);

    const items = readItems(itemDir);
    let sourceHits = 0;
    let viewHits = 0;
    let fallbackHits = 0;
    let multiHitLaneFrames = 0;
    let boundaryClipped = 0;
    let views = 0;
    const rawNotes = new Set();

    for (const item of items) {
      const fidelity = item.sourceFidelity;
      assert.ok(fidelity);
      const sourceEnd = Math.max(
        fidelity.sourcePpq * 8,
        ...fidelity.drumEvents.map(event => event.startTick + 1)
      );

      const view = buildDrumViewV2(item, {
        mappingProfileId: "gmd-9-v1",
        sourceStartTick: 0,
        sourceEndTick: sourceEnd,
        gridDivisionPerQuarter: 4
      });
      const validation = validateDrumViewV2(view);
      assert.equal(validation.ok, true, validation.errors.join("; "));

      sourceHits += fidelity.drumEvents.length;
      viewHits += view.hits.length;
      fallbackHits += view.stats.rawFallbackHitCount;
      multiHitLaneFrames += view.stats.multiHitLaneFrameCount;
      boundaryClipped += view.stats.boundaryClippedProjectionCount;
      view.hits.forEach(hit => rawNotes.add(hit.midiNote));
      views += 1;

      assert.equal(view.stats.sourceHitCount, fidelity.drumEvents.length);
      assert.equal(view.stats.hitCount, fidelity.drumEvents.length);
      assert.equal(new Set(view.hits.map(hit => hit.sourceEventId)).size, fidelity.drumEvents.length);
      assert.ok(view.hits.every(hit => Number.isFinite(hit.offsetStepFraction)));
      assert.ok(view.hits.every(hit => Number.isFinite(hit.offsetMs)));
      assert.ok(view.hits.every(hit => Number.isInteger(hit.velocity)));
      assert.equal(view.semantics.fill.status, "unknown");
      assert.equal(view.semantics.loopability.status, "unknown");
    }

    assert.equal(viewHits, sourceHits);
    assert.equal(fallbackHits, 0);
    assert.equal(sourceHits, 2382);
    assert.equal(rawNotes.size, 15);
    assert.ok(multiHitLaneFrames > 0);

    console.log("FASE 7C / BLOCCO 1 / REAL GMD DRUM VIEW V2");
    console.log(`MIDI reali: ${items.length}`);
    console.log(`Drum View prodotte: ${views}`);
    console.log(`Source hits: ${sourceHits}`);
    console.log(`View hits: ${viewHits}`);
    console.log(`MIDI note uniche: ${rawNotes.size}`);
    console.log(`GMD-9 raw fallback hits: ${fallbackHits}`);
    console.log(`Multi-hit lane/frame preservati: ${multiHitLaneFrames}`);
    console.log(`Boundary-clipped projections: ${boundaryClipped}`);
    console.log("Lossless source-hit accounting: OK");
    console.log("FASE 7C BLOCCO 1 REAL GMD TEST: OK");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (require.main === module) main();

module.exports = { main };
