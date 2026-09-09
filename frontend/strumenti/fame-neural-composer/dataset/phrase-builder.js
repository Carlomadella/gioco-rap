"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { buildPhraseSourceFidelity } = require("../midi/source-fidelity");

const PHRASE_SCHEMA = "fame-neural-phrase-item-v1";
const BUILD_REPORT_SCHEMA = "fame-neural-phrase-build-report-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isDatasetItemFile(name) {
  return /\.dataset-item\.json$/i.test(name);
}

function normalizeBuilderOptions(input = {}) {
  const rawBars = Array.isArray(input.phraseBars) ? input.phraseBars : [4];
  const phraseBars = [...new Set(rawBars
    .map(Number)
    .filter(value => Number.isInteger(value) && [4, 8, 16].includes(value)))]
    .sort((a, b) => b - a);

  return {
    phraseBars: phraseBars.length ? phraseBars : [4],
    strategy: input.strategy === "longest-first-exclusive" ? "longest-first-exclusive" : "fixed-shortest",
    minEvents: Number.isInteger(input.minEvents) && input.minEvents >= 0 ? input.minEvents : 4
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonicalSequencesFromSource(item) {
  const sequences = [];
  if (item && item.canonical && item.canonical.schema === "fame-neural-sequence-v1") {
    sequences.push({
      sourceSegmentId: "canonical",
      sourceSegmentStartTick: 0,
      sourceSegmentEndTick: null,
      sequence: item.canonical
    });
  }
  if (Array.isArray(item && item.canonicalSegments)) {
    item.canonicalSegments.forEach((segment, index) => {
      if (segment && segment.canonical && segment.canonical.schema === "fame-neural-sequence-v1") {
        sequences.push({
          sourceSegmentId: segment.segmentId || `tempo-${index}`,
          sourceSegmentStartTick: Math.max(0, Math.round(Number(segment.sourceStartTick) || 0)),
          sourceSegmentEndTick: Number.isFinite(Number(segment.sourceEndTick))
            ? Math.max(0, Math.round(Number(segment.sourceEndTick)))
            : null,
          sequence: segment.canonical
        });
      }
    });
  }
  return sequences;
}

function plannedWindows(totalBars, options = {}) {
  const cfg = normalizeBuilderOptions(options);
  const windows = [];

  if (cfg.strategy === "longest-first-exclusive") {
    let startBar = 0;
    let remaining = totalBars;
    while (remaining >= Math.min(...cfg.phraseBars)) {
      const length = cfg.phraseBars.find(value => value <= remaining);
      if (!length) break;
      windows.push({ startBar, bars: length });
      startBar += length;
      remaining -= length;
    }
    return windows;
  }

  const length = Math.min(...cfg.phraseBars);
  for (let startBar = 0; startBar + length <= totalBars; startBar += length) {
    windows.push({ startBar, bars: length });
  }
  return windows;
}

function clipTimedObject(value, startTick, endTick) {
  const start = Number(value && value.startTick);
  const duration = Number(value && value.durationTicks);
  if (!Number.isFinite(start) || !Number.isFinite(duration)) return null;
  const stop = start + Math.max(0, duration);
  const clippedStart = Math.max(start, startTick);
  const clippedStop = Math.min(stop, endTick);
  if (clippedStop <= clippedStart) return null;
  return {
    ...deepClone(value),
    startTick: clippedStart - startTick,
    durationTicks: clippedStop - clippedStart
  };
}

function sliceSequence(sequence, startBar, phraseBars) {
  const timing = sequence && sequence.timing || {};
  const ppq = Math.max(1, Math.round(Number(timing.ppq) || 960));
  const barTicks = ppq * 4;
  const startTick = startBar * barTicks;
  const endTick = (startBar + phraseBars) * barTicks;

  const events = [];
  for (const sourceEvent of Array.isArray(sequence && sequence.events) ? sequence.events : []) {
    const eventTick = Number(sourceEvent && sourceEvent.tick);
    if (!Number.isFinite(eventTick) || eventTick < startTick || eventTick >= endTick) continue;

    const event = deepClone(sourceEvent);
    event.tick = Math.round(eventTick - startTick);

    if (Number.isFinite(Number(event.durationTicks))) {
      const sourceDuration = Math.max(1, Math.round(Number(event.durationTicks)));
      const available = Math.max(1, Math.round(endTick - eventTick));
      event.durationTicks = Math.min(sourceDuration, available);
    }
    if (Number.isFinite(Number(event.glideTicks)) && Number.isFinite(Number(event.durationTicks))) {
      event.glideTicks = Math.min(Math.max(1, Math.round(Number(event.glideTicks))), event.durationTicks);
    }
    events.push(event);
  }

  const harmony = [];
  for (const sourceHarmony of Array.isArray(sequence && sequence.harmony) ? sequence.harmony : []) {
    const clipped = clipTimedObject(sourceHarmony, startTick, endTick);
    if (clipped) harmony.push(clipped);
  }

  const sourceBars = Array.isArray(sequence && sequence.bars) ? sequence.bars : [];
  const bars = Array.from({ length: phraseBars }, (_, index) => {
    const source = sourceBars[startBar + index];
    const cloned = source ? deepClone(source) : {};
    cloned.index = index;
    return cloned;
  });

  return {
    ...deepClone(sequence),
    meta: {
      ...(sequence && sequence.meta ? deepClone(sequence.meta) : {}),
      derivedPhrase: true,
      sourceStartBar: startBar,
      sourceEndBarExclusive: startBar + phraseBars
    },
    timing: {
      ...deepClone(timing),
      ppq,
      bars: phraseBars
    },
    harmony,
    bars,
    events
  };
}

function phraseEventCount(sequence) {
  return Array.isArray(sequence && sequence.events) ? sequence.events.length : 0;
}

function phraseIdFor(itemId, segmentId, startBar, bars) {
  return `${itemId}:phrase:${segmentId}:${startBar}+${bars}`;
}

function outputFileName(phraseId, index) {
  const hash = crypto.createHash("sha256").update(phraseId).digest("hex").slice(0, 16);
  return `${String(index + 1).padStart(5, "0")}-${hash}.phrase-item.json`;
}

function buildPhraseItem(sourceItem, sourceFileName, segmentId, sequence, startBar, bars, sourceSegmentStartTick = 0) {
  const phraseId = phraseIdFor(sourceItem.itemId, segmentId, startBar, bars);
  const canonical = sliceSequence(sequence, startBar, bars);
  const provenance = sourceItem.provenance || {};
  const sourceFidelity = sourceItem.sourceFidelity
    ? buildPhraseSourceFidelity(sourceItem.sourceFidelity, {
      sourceDatasetItemId: sourceItem.itemId,
      sourceSegmentId: segmentId,
      sourceSegmentStartTick,
      startBar,
      phraseBars: bars
    })
    : null;

  const phrase = {
    schema: PHRASE_SCHEMA,
    version: 1,
    phraseId,
    sourceDatasetItemId: sourceItem.itemId,
    sourceFileName,
    sourceSegmentId: segmentId,
    sourceBarStart: startBar,
    sourceBarEndExclusive: startBar + bars,
    phraseBars: bars,
    source: {
      sha256: sourceItem.source && sourceItem.source.sha256 || null
    },
    provenance: {
      sourceId: provenance.sourceId || null,
      creator: provenance.creator || null,
      licenseId: provenance.licenseId || null,
      compositionFamily: provenance.compositionFamily || sourceItem.itemId,
      sourceUri: provenance.sourceUri || null,
      rightsEvidence: Array.isArray(provenance.rightsEvidence) ? deepClone(provenance.rightsEvidence) : [],
      commercialTrainingAllowed: provenance.commercialTrainingAllowed === true,
      commercialOutputAllowed: provenance.commercialOutputAllowed === true
    },
    rights: {
      status: sourceItem.rights && sourceItem.rights.status || null,
      commercialTrainingAllowed: sourceItem.rights && sourceItem.rights.commercialTrainingAllowed === true,
      commercialOutputAllowed: sourceItem.rights && sourceItem.rights.commercialOutputAllowed === true
    },
    canonical
  };

  if (sourceFidelity) phrase.sourceFidelity = sourceFidelity;
  return phrase;
}

function acceptedSourceIds(manifest) {
  if (!manifest || !Array.isArray(manifest.items)) return null;
  return new Set(manifest.items.map(item => item && item.itemId).filter(Boolean));
}

function buildPhrases(entries, sourceManifest = null, options = {}) {
  const cfg = normalizeBuilderOptions(options);
  const accepted = acceptedSourceIds(sourceManifest);
  const phrases = [];
  const skipped = [];
  const byLength = {};

  for (const entry of entries) {
    const item = entry.item;
    if (!item || item.schema !== "fame-neural-dataset-item-v1" || !item.itemId) {
      skipped.push({ fileName: entry.fileName, reason: "invalid-source-dataset-item" });
      continue;
    }
    if (accepted && !accepted.has(item.itemId)) {
      skipped.push({ fileName: entry.fileName, itemId: item.itemId, reason: "not-accepted-by-source-curation" });
      continue;
    }
    if (!(item.rights && item.rights.commercialTrainingAllowed === true) ||
        !(item.eligibility && item.eligibility.commercialTraining === true)) {
      skipped.push({ fileName: entry.fileName, itemId: item.itemId, reason: "source-not-commercial-training-cleared" });
      continue;
    }

    const sequences = canonicalSequencesFromSource(item);
    if (!sequences.length) {
      skipped.push({ fileName: entry.fileName, itemId: item.itemId, reason: "no-canonical-sequence" });
      continue;
    }

    let producedFromSource = 0;
    for (const { sourceSegmentId, sourceSegmentStartTick, sequence } of sequences) {
      const totalBars = Math.max(1, Math.round(Number(sequence && sequence.timing && sequence.timing.bars) || 1));
      const windows = plannedWindows(totalBars, cfg);
      if (!windows.length) {
        skipped.push({
          fileName: entry.fileName,
          itemId: item.itemId,
          sourceSegmentId,
          reason: `segment-too-short:${totalBars}`
        });
        continue;
      }

      for (const window of windows) {
        const phrase = buildPhraseItem(
          item,
          entry.fileName,
          sourceSegmentId,
          sequence,
          window.startBar,
          window.bars,
          sourceSegmentStartTick
        );
        const events = phraseEventCount(phrase.canonical);
        if (events < cfg.minEvents) {
          skipped.push({
            fileName: entry.fileName,
            itemId: item.itemId,
            sourceSegmentId,
            startBar: window.startBar,
            bars: window.bars,
            reason: `phrase-too-sparse:${events}<${cfg.minEvents}`
          });
          continue;
        }
        phrases.push(phrase);
        byLength[String(window.bars)] = (byLength[String(window.bars)] || 0) + 1;
        producedFromSource += 1;
      }
    }

    if (!producedFromSource) {
      skipped.push({ fileName: entry.fileName, itemId: item.itemId, reason: "no-usable-phrase-produced" });
    }
  }

  return {
    schema: BUILD_REPORT_SCHEMA,
    version: 1,
    options: cfg,
    totals: {
      sourcesDiscovered: entries.length,
      sourcesAcceptedByManifest: accepted ? accepted.size : entries.length,
      phrasesProduced: phrases.length,
      skippedRecords: skipped.length
    },
    phrasesByBars: byLength,
    skipped,
    phrases
  };
}

function readSourceEntries(inputDir) {
  const files = fs.readdirSync(inputDir).filter(isDatasetItemFile).sort((a, b) => a.localeCompare(b));
  return files.map(fileName => ({ fileName, item: readJson(path.join(inputDir, fileName)) }));
}

function writePhraseDirectory(outputDir, report) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const file of fs.readdirSync(outputDir)) {
    if (/\.phrase-item\.json$/i.test(file)) fs.unlinkSync(path.join(outputDir, file));
  }
  report.phrases.forEach((phrase, index) => {
    const fileName = outputFileName(phrase.phraseId, index);
    fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(phrase, null, 2)}\n`, "utf8");
  });
}

function main(argv = process.argv.slice(2)) {
  const [inputDir, outputDir, reportPath, sourceManifestPath, optionsPath] = argv;
  if (!inputDir || !outputDir || !reportPath) {
    console.error("Uso: node phrase-builder.js <dataset-items-dir> <phrase-items-dir> <report.json> [accepted-source-manifest.json] [options.json]");
    process.exitCode = 64;
    return;
  }
  try {
    const entries = readSourceEntries(inputDir);
    const manifest = sourceManifestPath ? readJson(sourceManifestPath) : null;
    const options = optionsPath ? readJson(optionsPath) : {};
    const report = buildPhrases(entries, manifest, options);
    writePhraseDirectory(outputDir, report);
    const publicReport = { ...report };
    delete publicReport.phrases;
    fs.writeFileSync(reportPath, `${JSON.stringify(publicReport, null, 2)}\n`, "utf8");

    console.log(`Source dataset item: ${report.totals.sourcesDiscovered}`);
    console.log(`Phrase prodotte: ${report.totals.phrasesProduced}`);
    console.log(`4 barre: ${report.phrasesByBars["4"] || 0}`);
    console.log(`8 barre: ${report.phrasesByBars["8"] || 0}`);
    console.log(`16 barre: ${report.phrasesByBars["16"] || 0}`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  PHRASE_SCHEMA,
  BUILD_REPORT_SCHEMA,
  normalizeBuilderOptions,
  canonicalSequencesFromSource,
  plannedWindows,
  sliceSequence,
  phraseIdFor,
  buildPhraseItem,
  buildPhrases,
  readSourceEntries,
  writePhraseDirectory,
  main
};
