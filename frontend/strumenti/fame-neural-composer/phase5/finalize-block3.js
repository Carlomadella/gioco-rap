"use strict";

const fs = require("node:fs");
const path = require("node:path");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function round(value, digits = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function generationMap(report) {
  return new Map((report.results || []).map(item => [item.representation, item]));
}

function buildRows(training, generation) {
  const gen = generationMap(generation);
  return (training.results || []).map(item => {
    const g = gen.get(item.representation);
    if (!g) throw new Error(`Generation validation mancante: ${item.representation}`);
    return {
      representation: item.representation,
      parameters: item.model.parameters,
      amp: item.model.amp,
      peakAllocatedMiB: item.memory.peakAllocatedMiB,
      peakReservedMiB: item.memory.peakReservedMiB,
      barsPerSecond: item.training.barsPerSecond,
      unitsPerSecond: item.training.unitsPerSecond,
      validationNllPerTarget: item.validation.nllPerTarget,
      validationBitsPerBar: item.validation.bitsPerBar,
      generationSamples: g.samples,
      validGenerations: g.valid,
      invalidGenerations: g.invalid,
      invalidGenerationRate: round(g.invalidGenerationRate)
    };
  });
}

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Patch doc fallita (${label}): marker non trovato`);
  return text.replace(from, to);
}

function table(rows) {
  return [
    "| Rappresentazione | parametri | peak VRAM MiB | bars/s | val bits/bar | invalid gen |",
    "|---|---:|---:|---:|---:|---:|",
    ...rows.map(row => `| ${row.representation} | ${row.parameters} | ${row.peakAllocatedMiB} | ${row.barsPerSecond} | ${row.validationBitsPerBar} | ${row.invalidGenerations}/${row.generationSamples} (${row.invalidGenerationRate}) |`)
  ].join("\n");
}

function patchPhase5(file, rows, training) {
  let text = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
  text = replaceRequired(
    text,
    "Stato: IN CORSO — BLOCCO 2 CONFRONTO SIMBOLICO COMPLETATO",
    "Stato: IN CORSO — BLOCCO 3 MICRO-TRAINING COMPLETATO",
    "phase5 status"
  );
  const oldBlock = `## Prossimo Blocco 3\n\nEseguire micro-training comparabile per Flat, REMI+, Compound Word e FAME Compound custom usando stesso split, stesso micro-modello per quanto compatibile, stesso budget di step e stessa GPU locale. Misurare VRAM peak, throughput, validation loss e invalid generation rate prima della scelta finale della rappresentazione.\n\nNessun vincitore è ancora scelto.`;
  const split = training.dataset && training.dataset.split || {};
  const hw = training.hardware || {};
  const newBlock = `## Blocco 3 — micro-training comparabile completato\n\nProtocollo reale: stesso split per composition family, stesso Transformer backbone, stesso seed, stesso batch in phrase e stesso budget di **${training.protocol.steps} step** per rappresentazione. Split: **${split.train && split.train.phrases || 0} train / ${split.val && split.val.phrases || 0} validation / ${split.test && split.test.phrases || 0} test phrase**. GPU: **${hw.gpuName || "non rilevata"}**, PyTorch **${hw.torch || "?"}**, CUDA runtime **${hw.cudaRuntime || "?"}**, AMP **${rows[0] && rows[0].amp || "?"}**.\n\n${table(rows)}\n\nLa validation loss viene riportata anche come **bits/bar**, perché le rappresentazioni compound predicono più campi per singolo timestep e la sola loss per token/field non è direttamente confrontabile con Flat/REMI. L'invalid generation rate usa lo stesso task: completamento dell'ultima barra partendo da un prefisso canonico valido.\n\nIl Blocco 3 non sceglie automaticamente il vincitore: i numeri GPU/generativi devono essere letti insieme a compressione simbolica, reconstruction e copertura FASE 4 del Blocco 2.\n\n## Prossimo Blocco 4\n\nDecisione finale della rappresentazione FASE 5 usando insieme benchmark simbolico + micro-training GPU + validità generativa. Nessun retraining aggiuntivo è richiesto salvo regressioni emerse dai risultati.`;
  text = replaceRequired(text, oldBlock, newBlock, "phase5 block3");
  fs.writeFileSync(file, text, "utf8");
}

function patchCurrentState(file, rows, training) {
  let text = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
  text = replaceRequired(
    text,
    "- FASE 5 — Scelta della rappresentazione neurale: **IN CORSO — BLOCCO 2 CONFRONTO SIMBOLICO COMPLETATO**.",
    "- FASE 5 — Scelta della rappresentazione neurale: **IN CORSO — BLOCCO 3 MICRO-TRAINING COMPLETATO**.",
    "current phase5 status"
  );
  text = replaceRequired(
    text,
    "- Training neurale reale: **NON INIZIATO**.",
    "- Training neurale reale: **MICRO-TRAINING BENCHMARK FASE 5 COMPLETATO; TRAINING MODELLO PRODOTTO NON INIZIATO**.",
    "current neural training status"
  );
  const oldNext = `## Prossimo intervento ufficiale\n\nFASE 5 / Blocco 3: micro-training comparabile sulle quattro rappresentazioni con stesso split e budget per misurare VRAM peak, throughput, validation loss e invalid generation rate prima della decisione finale.`;
  const compact = rows.map(row => `- ${row.representation}: **${row.peakAllocatedMiB} MiB peak**, **${row.barsPerSecond} bars/s**, **${row.validationBitsPerBar} bits/bar val**, invalid **${row.invalidGenerations}/${row.generationSamples}**;`).join("\n");
  const newNext = `## FASE 5 — Blocco 3\n\nMicro-training GPU comparabile completato con **${training.protocol.steps} step per rappresentazione** sullo stesso split per composition family e sullo stesso backbone:\n\n${compact}\n\nI risultati completi machine-readable sono in \`documentazione/fame-neural/PHASE5_BLOCK3_RESULTS.json\`.\n\n## Prossimo intervento ufficiale\n\nFASE 5 / Blocco 4: scegliere la rappresentazione finale leggendo insieme benchmark simbolico, costi GPU, validation bits/bar, invalid generation rate e copertura FASE 4. Nessun vincitore e' stato forzato automaticamente.`;
  text = replaceRequired(text, oldNext, newNext, "current next");
  fs.writeFileSync(file, text, "utf8");
}

function patchRoadmap(file, rows, training) {
  let text = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
  text = replaceRequired(
    text,
    "Stato: IN CORSO — BLOCCO 2 CONFRONTO SIMBOLICO COMPLETATO",
    "Stato: IN CORSO — BLOCCO 3 MICRO-TRAINING COMPLETATO",
    "roadmap status"
  );
  const old = `**Prossimo Blocco 3:** micro-training comparabile su stessa GPU, split e budget per misurare VRAM, throughput, validation loss e invalid generation rate; solo dopo si sceglie la rappresentazione.`;
  const summary = rows.map(row => `${row.representation} ${row.peakAllocatedMiB} MiB / ${row.barsPerSecond} bars/s / ${row.validationBitsPerBar} bits-bar / invalid ${row.invalidGenerations}/${row.generationSamples}`).join("; ");
  const replacement = `### Blocco 3 — micro-training GPU COMPLETATO\n\nStesso split per composition family, stesso backbone e **${training.protocol.steps} step** per rappresentazione. Risultati: ${summary}.\n\n**Prossimo Blocco 4:** scelta finale della rappresentazione usando insieme Blocco 2 e Blocco 3; nessun vincitore viene deciso dalla sola loss o dalla sola compressione.`;
  text = replaceRequired(text, old, replacement, "roadmap block3");
  fs.writeFileSync(file, text, "utf8");
}

function main(argv = process.argv.slice(2)) {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
    const outputDir = path.resolve(argv[0] || ".");
    const training = readJson(path.join(outputDir, "phase5-block3-training.json"));
    const generation = readJson(path.join(outputDir, "phase5-block3-generation-validation.json"));
    if (training.schema !== "fame-neural-phase5-block3-training-v1") throw new Error("Training report schema non valido");
    if (generation.schema !== "fame-neural-phase5-block3-generation-validation-v1") throw new Error("Generation report schema non valido");
    const rows = buildRows(training, generation);
    if (rows.length !== 4) throw new Error(`Attese 4 rappresentazioni, trovate ${rows.length}`);

    const combined = {
      schema: "fame-neural-phase5-block3-results-v1",
      version: 1,
      decision: "ARCHITECT_REVIEW_REQUIRED",
      protocol: training.protocol,
      dataset: training.dataset,
      hardware: training.hardware,
      results: rows
    };
    fs.writeFileSync(path.join(outputDir, "phase5-block3-report.json"), `${JSON.stringify(combined, null, 2)}\n`, "utf8");

    const docsDir = path.join(repoRoot, "documentazione", "fame-neural");
    fs.writeFileSync(path.join(docsDir, "PHASE5_BLOCK3_RESULTS.json"), `${JSON.stringify(combined, null, 2)}\n`, "utf8");
    patchPhase5(path.join(docsDir, "PHASE5_RAPPRESENTAZIONI.md"), rows, training);
    patchCurrentState(path.join(docsDir, "CURRENT_STATE.md"), rows, training);
    patchRoadmap(path.join(docsDir, "ROADMAP_FAME_NEURAL.md"), rows, training);

    console.log("=== FAME NEURAL / FASE 5 / BLOCCO 3 / FINAL ===");
    for (const row of rows) {
      console.log(`${row.representation}: VRAM ${row.peakAllocatedMiB} MiB | ${row.barsPerSecond} bars/s | val ${row.validationBitsPerBar} bits/bar | invalid ${row.invalidGenerations}/${row.generationSamples}`);
    }
    console.log("Decisione: ARCHITECT_REVIEW_REQUIRED");
    console.log(`Report: ${path.join(outputDir, "phase5-block3-report.json")}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { buildRows, patchPhase5, patchCurrentState, patchRoadmap, main };
