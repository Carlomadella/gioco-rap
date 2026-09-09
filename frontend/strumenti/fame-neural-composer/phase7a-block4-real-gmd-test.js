"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { importMidiDirectory } = require("./midi/batch-import-midi");
const { buildPhrases, readSourceEntries } = require("./dataset/phrase-builder");
const { SOURCE_FIDELITY_SCHEMA, PHRASE_SOURCE_FIDELITY_SCHEMA } = require("./midi/source-fidelity");

function existsDir(value) {
  try {
    return fs.statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function defaultInput() {
  return path.join(os.tmpdir(), "fame-neural-gmd-phase2", "sample-input");
}

function main(argv = process.argv.slice(2)) {
  const inputDir = path.resolve(argv[0] || defaultInput());
  if (!existsDir(inputDir)) {
    console.log("FASE 7A BLOCCO 4 REAL GMD TEST: SKIP");
    console.log(`Raw GMD sample-input non trovato: ${inputDir}`);
    console.log("Rieseguire midi/bootstrap-gmd-phase2.ps1 per ricreare il campione reale.");
    return;
  }

  const midiFiles = fs.readdirSync(inputDir)
    .filter(name => /\.(mid|midi)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  if (midiFiles.length < 3) {
    console.log("FASE 7A BLOCCO 4 REAL GMD TEST: SKIP");
    console.log(`Cache GMD presente ma senza campione sufficiente: ${midiFiles.length} MIDI in ${inputDir}`);
    console.log("Rieseguire midi/bootstrap-gmd-phase2.ps1 per ricreare il campione reale.");
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-neural-block4-gmd-"));
  const outputDir = path.join(tmp, "dataset-items");
  try {
    const report = importMidiDirectory(inputDir, outputDir);
    assert.ok(report.totals.discovered >= 3, `GMD reali insufficienti: ${report.totals.discovered}`);
    assert.equal(report.totals.failed, 0);
    assert.equal(report.totals.technicalBlocked, 0);
    assert.equal(report.totals.rightsBlocked, 0);
    assert.equal(report.totals.missingProvenance, 0);
    assert.equal(report.totals.imported, report.totals.discovered);

    const entries = readSourceEntries(outputDir);
    let totalRawDrumEvents = 0;
    let totalCanonicalDrumEvents = 0;
    const sourceEventIds = new Set();
    const drumTypes = new Set(["kick", "snare", "clap", "hat_closed", "hat_open", "perc"]);

    for (const entry of entries) {
      const item = entry.item;
      assert.match(item.provenance.sourceId, /^gmd-v1\.0\.0:/);
      assert.equal(item.sourceFidelity.schema, SOURCE_FIDELITY_SCHEMA);
      assert.ok(item.sourceFidelity.sourcePpq > 0);
      assert.ok(item.sourceFidelity.drumEvents.length > 0);

      for (const event of item.sourceFidelity.drumEvents) {
        assert.ok(Number.isInteger(event.midiNote));
        assert.ok(Number.isInteger(event.startTick));
        assert.ok(event.sourceEventId);
        assert.equal(sourceEventIds.has(event.sourceEventId), false);
        sourceEventIds.add(event.sourceEventId);
        totalRawDrumEvents += 1;
      }

      for (const event of item.canonical.events || []) {
        if (!drumTypes.has(event.type)) continue;
        totalCanonicalDrumEvents += 1;
        assert.equal(event.note, undefined);
        assert.equal(event.sourceEventId, undefined);
      }
    }

    const phraseReport = buildPhrases(entries, null, {
      phraseBars: [4],
      strategy: "fixed-shortest",
      minEvents: 1
    });
    assert.ok(phraseReport.phrases.length > 0);
    const drumPhrases = phraseReport.phrases.filter(phrase =>
      phrase.sourceFidelity
      && phrase.sourceFidelity.schema === PHRASE_SOURCE_FIDELITY_SCHEMA
      && phrase.sourceFidelity.drumEvents.length > 0
    );
    assert.ok(drumPhrases.length > 0);
    assert.ok(drumPhrases.every(phrase =>
      phrase.sourceFidelity.drumEvents.every(event =>
        event.startTick >= phrase.sourceFidelity.sourceTickStart
        && event.startTick < phrase.sourceFidelity.sourceTickEndExclusive
      )
    ));

    console.log("FASE 7A / BLOCCO 4 / REAL GMD RE-IMPORT");
    console.log(`MIDI reali: ${report.totals.discovered}`);
    console.log(`Importati: ${report.totals.imported}`);
    console.log(`Raw drum events preservati: ${totalRawDrumEvents}`);
    console.log(`Canonical drum events invariati: ${totalCanonicalDrumEvents}`);
    console.log(`Phrase con source fidelity: ${drumPhrases.length}/${phraseReport.phrases.length}`);
    console.log("FASE 7A BLOCCO 4 REAL GMD TEST: OK");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (require.main === module) main();

module.exports = { defaultInput, main };
