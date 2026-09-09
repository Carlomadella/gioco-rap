"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const { importMidiDirectory } = require("./midi/batch-import-midi");
const { validateDrumViewV2 } = require("./dataset/drum-view-v2");

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

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const sampleInput = ensureGmdSample(repoRoot);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-neural-phase7c-block1-export-"));
  const itemDir = path.join(tmp, "items");
  const viewDir = path.join(tmp, "views");
  const reportPath = path.join(tmp, "export-report.json");
  const optionsPath = path.join(tmp, "options.json");

  try {
    const batch = importMidiDirectory(sampleInput, itemDir);
    assert.ok(batch.totals.discovered >= 3);
    assert.equal(batch.totals.imported, batch.totals.discovered);
    assert.equal(batch.totals.failed, 0);

    fs.writeFileSync(optionsPath, `${JSON.stringify({
      mappingProfileId: "gmd-9-v1",
      bars: 2,
      gridDivisionPerQuarter: 4
    }, null, 2)}\n`, "utf8");

    const exporter = path.join(__dirname, "export-drum-view-v2.js");
    const r = cp.spawnSync(process.execPath, [
      exporter,
      itemDir,
      viewDir,
      reportPath,
      optionsPath
    ], { cwd: repoRoot, encoding: "utf8", windowsHide: true });

    process.stdout.write(r.stdout || "");
    process.stderr.write(r.stderr || "");
    if (r.error) throw r.error;
    assert.equal(r.status, 0, `Exporter exit ${r.status}`);

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const viewFiles = fs.readdirSync(viewDir)
      .filter(name => /\.drum-view-v2\.json$/i.test(name))
      .sort((a, b) => a.localeCompare(b));

    assert.equal(report.totals.discovered, batch.totals.imported);
    assert.equal(report.totals.exported, batch.totals.imported);
    assert.equal(report.totals.failed, 0);
    assert.equal(report.totals.skippedNoSourceFidelity, 0);
    assert.equal(report.losslessSourceHitAccounting, true);
    assert.equal(report.totals.sourceHits, report.totals.viewHits);
    assert.equal(report.totals.rawFallbackHits, 0);
    assert.ok(report.totals.multiHitLaneFrames > 0);
    assert.equal(viewFiles.length, batch.totals.imported);

    for (const fileName of viewFiles) {
      const view = JSON.parse(fs.readFileSync(path.join(viewDir, fileName), "utf8"));
      const validation = validateDrumViewV2(view);
      assert.equal(validation.ok, true, `${fileName}: ${validation.errors.join("; ")}`);
      assert.equal(view.mapping.profileId, "gmd-9-v1");
      assert.equal(view.semantics.fill.status, "unknown");
      assert.equal(view.semantics.loopability.status, "unknown");
      assert.equal(view.metadata.metadataStatus, "not-enriched");
    }

    console.log("FASE 7C / BLOCCO 1 / EXPORT E2E");
    console.log(`Dataset item: ${batch.totals.imported}`);
    console.log(`File Drum View V2: ${viewFiles.length}`);
    console.log(`Source hits nelle window 2-bar: ${report.totals.sourceHits}`);
    console.log(`View hits nelle window 2-bar: ${report.totals.viewHits}`);
    console.log(`Raw fallback hits: ${report.totals.rawFallbackHits}`);
    console.log(`Multi-hit lane/frame preservati: ${report.totals.multiHitLaneFrames}`);
    console.log("Exporter CLI + report + file validation: OK");
    console.log("FASE 7C BLOCCO 1 EXPORT E2E TEST: OK");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (require.main === module) main();

module.exports = { main };
