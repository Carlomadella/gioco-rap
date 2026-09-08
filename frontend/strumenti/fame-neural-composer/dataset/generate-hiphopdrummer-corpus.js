"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const HHD_SOURCE_FILES = [
  "patterns.js", "ai.js", "writers.js", "groove.js", "bass.js", "ep.js",
  "pad.js", "lead.js", "organ.js", "horns.js", "vibes.js", "clav.js",
  "analysis.js", "daw-help.js", "midi-export.js", "beat-history.js"
];

const DRUM_TYPES = new Set(["kick", "snare", "clap", "hat_closed", "hat_open", "perc"]);
const REPORT_SCHEMA = "fame-neural-hiphopdrummer-generation-v1";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function seededRandom(seedText) {
  const digest = crypto.createHash("sha256").update(String(seedText)).digest();
  let a = digest.readUInt32LE(0);
  let b = digest.readUInt32LE(4);
  let c = digest.readUInt32LE(8);
  let d = digest.readUInt32LE(12);

  return function random() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = ((c << 21) | (c >>> 11));
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function createDomHarness() {
  let elements = {};
  const storage = {};

  function element(id) {
    if (!elements[id]) {
      const values = {
        bpm: "90",
        swing: "62",
        songKey: "Cm",
        songStyle: "Classic Boom Bap",
        swingDesc: "",
        arrTime: "3:00",
        loadMsg: "",
        app: ""
      };
      elements[id] = {
        textContent: values[id] || "",
        innerHTML: "",
        value: "",
        checked: false,
        style: { display: "" },
        scrollTop: 0,
        disabled: false,
        dataset: {},
        classList: {
          add() {},
          remove() {},
          contains() { return false; }
        },
        addEventListener() {},
        removeEventListener() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        setAttribute() {},
        getAttribute() { return null; },
        scrollIntoView() {},
        appendChild() {},
        remove() {}
      };
    }
    return elements[id];
  }

  return {
    reset() {
      elements = {};
      for (const key of Object.keys(storage)) delete storage[key];
    },
    document: {
      getElementById: element,
      createElement() { return { style: {}, innerHTML: "", appendChild() {}, remove() {} }; },
      addEventListener() {},
      removeEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return { forEach() {} }; },
      createTreeWalker() { return { nextNode() { return null; } }; }
    },
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
      setItem(key, value) { storage[key] = String(value); },
      removeItem(key) { delete storage[key]; },
      clear() { for (const key of Object.keys(storage)) delete storage[key]; }
    },
    getElement: element
  };
}

function buildContext(checkoutDir, seedText, quiet = true) {
  const dom = createDomHarness();
  const random = seededRandom(seedText);
  const math = Object.create(Math);
  Object.defineProperty(math, "random", { value: random, enumerable: true });

  const context = {
    console: quiet ? {
      log() {}, info() {}, warn() {}, error() {}
    } : console,
    Math: math,
    Uint8Array,
    ArrayBuffer,
    DataView,
    TextEncoder,
    TextDecoder,
    Buffer,
    JSON,
    Date,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Map,
    Set,
    RegExp,
    Promise,
    parseInt,
    parseFloat,
    isNaN,
    setTimeout,
    clearTimeout,
    document: dom.document,
    localStorage: dom.localStorage,
    navigator: { serviceWorker: null },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: function MutationObserver() {
      return { observe() {}, disconnect() {} };
    },
    URL: { createObjectURL() { return ""; }, revokeObjectURL() {} },
    Blob: function Blob() {},
    JSZip: function JSZip() {
      const folder = { file() {}, folder() { return folder; } };
      return folder;
    },
    renderGrid() {},
    renderArr() {},
    updateMidiPlayer() {},
    calcArrTime() { return "0:00"; },
    initPlaybackTracking() {},
    requestAnimationFrame(fn) { return setTimeout(fn, 0); },
    cancelAnimationFrame(id) { clearTimeout(id); },
    performance: { now: () => Date.now() }
  };
  context.window = { jspdf: null, IntersectionObserver: null };
  context.globalThis = context;

  vm.createContext(context);

  for (const file of HHD_SOURCE_FILES) {
    const full = path.join(checkoutDir, file);
    if (!fs.existsSync(full)) throw new Error(`Hip Hop Drummer file mancante: ${file}`);
    vm.runInContext(fs.readFileSync(full, "utf8"), context, { filename: file });
  }

  context._skipFullScore = true;
  context.localStorage.setItem("hhd_instr_mode", "strict");
  context.localStorage.setItem("hhd_lead_playback", "true");
  context.localStorage.setItem("hhd_ep_playback", "false");
  context.localStorage.setItem("hhd_pad_playback", "false");
  context.localStorage.setItem("hhd_organ_playback", "false");
  context.localStorage.setItem("hhd_horn_playback", "false");
  context.localStorage.setItem("hhd_vibes_playback", "false");
  context.localStorage.setItem("hhd_clav_playback", "false");

  return { context, dom };
}

function parseFormat0(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.length < 22 || buffer.toString("ascii", 0, 4) !== "MThd") {
    throw new Error("SMF: header MThd mancante");
  }
  const headerLen = buffer.readUInt32BE(4);
  if (headerLen !== 6) throw new Error(`SMF: header length inattesa ${headerLen}`);
  const format = buffer.readUInt16BE(8);
  const tracks = buffer.readUInt16BE(10);
  const division = buffer.readUInt16BE(12);
  if (format !== 0 || tracks !== 1) throw new Error(`SMF role stem deve essere format0/1 track, trovato format=${format} tracks=${tracks}`);
  const trackOffset = 14;
  if (buffer.toString("ascii", trackOffset, trackOffset + 4) !== "MTrk") throw new Error("SMF: chunk MTrk mancante");
  const trackLen = buffer.readUInt32BE(trackOffset + 4);
  const trackEnd = trackOffset + 8 + trackLen;
  if (trackEnd > buffer.length) throw new Error("SMF: track chunk tronco");
  return { division, trackChunk: buffer.subarray(trackOffset, trackEnd) };
}

function mergeFormat0Tracks(trackBytes) {
  if (!Array.isArray(trackBytes) || trackBytes.length < 2) {
    throw new Error("Servono almeno due stem MIDI per il merge format1");
  }
  const parsed = trackBytes.map(parseFormat0);
  const division = parsed[0].division;
  if (parsed.some(item => item.division !== division)) throw new Error("SMF: PPQ/division diversi tra stem");

  const header = Buffer.alloc(14);
  header.write("MThd", 0, "ascii");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(1, 8);
  header.writeUInt16BE(parsed.length, 10);
  header.writeUInt16BE(division, 12);

  return Buffer.concat([header, ...parsed.map(item => item.trackChunk)]);
}

function semanticStyleCheck(context, kind, style) {
  const paletteFound = Array.isArray(context.FEEL_PALETTES)
    && context.FEEL_PALETTES.some(palette => Array.isArray(palette) && palette[0] === style);
  if (!paletteFound) return { ok: false, reason: `style ${style} non e' primo elemento di alcuna FEEL_PALETTE` };

  if (kind === "808") {
    const bass = context.BASS_STYLES && context.BASS_STYLES[style];
    if (!bass || bass.instrument !== "808sub") {
      return { ok: false, reason: `style ${style} non e' semanticamente 808sub` };
    }
    return { ok: true };
  }

  if (kind === "lead") {
    if (!(context.LEAD_STYLES && context.LEAD_STYLES[style])) {
      return { ok: false, reason: `style ${style} non e' lead-capable` };
    }
    return { ok: true };
  }

  return { ok: false, reason: `kind sconosciuto ${kind}` };
}

function provenanceFor(kind, style, seedShort, commit) {
  const sourceId = `hiphopdrummer:${kind}:${style}:${seedShort}`;
  return {
    sourceId,
    originType: "licensed_dataset",
    creator: "Keith Adler / Hip Hop Drummer; deterministic generation by FAME Neural harness",
    licenseId: `HHD-GENERATED-OUTPUT-NO-RESTRICTIONS@${commit.slice(0, 12)}`,
    compositionFamily: sourceId,
    sourceUri: `https://github.com/keithadler/hiphopdrummer/tree/${commit}`,
    rightsEvidence: [
      `https://github.com/keithadler/hiphopdrummer/blob/${commit}/README.md — generated beats declared user-owned; commercial use, no attribution, no royalties, no restrictions`,
      `https://github.com/keithadler/hiphopdrummer/blob/${commit}/LICENSE — MIT repository license`,
      `generator commit pinned: ${commit}`,
      "package.json license metadata discrepancy (ISC) recorded separately; generated-output grant is the operative basis"
    ],
    commercialTrainingAllowed: true,
    commercialOutputAllowed: true,
    notes: `Synthetic external rule-generator output. kind=${kind}; style=${style}; deterministic seed=${seedShort}.`
  };
}

function countCanonicalRoles(item) {
  const events = item && item.canonical && Array.isArray(item.canonical.events) ? item.canonical.events : [];
  let drums = 0;
  let role808 = 0;
  let lead = 0;
  let harmony = 0;
  for (const event of events) {
    const type = String(event && event.type || "");
    if (DRUM_TYPES.has(type)) drums += 1;
    else if (type === "808") role808 += 1;
    else if (type === "lead") lead += 1;
    else if (type === "harmony") harmony += 1;
  }
  return { drums, "808": role808, lead, harmony, total: events.length };
}

function buildCandidate({ checkoutDir, fameRoot, config, kind, style, candidateIndex, attempt }) {
  const seedText = `fame-hhd-v1|${kind}|${style}|${candidateIndex}|${attempt}|${config.generator.commit}`;
  const seedShort = sha256(seedText).slice(0, 16);
  const { context, dom } = buildContext(checkoutDir, seedText);

  const semantic = semanticStyleCheck(context, kind, style);
  if (!semantic.ok) return { ok: false, reason: semantic.reason, seedText, seedShort };

  context.generateAll({ style });

  const verseSteps = Number(context.secSteps && context.secSteps.verse || 0);
  const actualStyle = String(context.secFeels && context.secFeels.verse || "");
  if (verseSteps !== 128) {
    return { ok: false, reason: `verse non 8-bar: ${verseSteps / 16} barre`, seedText, seedShort };
  }
  if (actualStyle !== style) {
    return { ok: false, reason: `verse style mismatch: richiesto ${style}, ottenuto ${actualStyle}`, seedText, seedShort };
  }

  const bpm = Number(dom.getElement("bpm").textContent) || 90;
  const drums = context.buildMidiBytes(["verse"], bpm, false, true);
  let role;
  if (kind === "808") role = context.buildBassMidiBytes(["verse"], bpm, false);
  else role = context.buildLeadMidiBytes(["verse"], bpm, false);

  if (!drums || Buffer.from(drums).length < 100) {
    return { ok: false, reason: "drum MIDI troppo piccolo/vuoto", seedText, seedShort };
  }
  if (!role || Buffer.from(role).length < 100) {
    return { ok: false, reason: `${kind} MIDI troppo piccolo/vuoto`, seedText, seedShort };
  }

  const merged = mergeFormat0Tracks([drums, role]);
  const provenance = provenanceFor(kind, style, seedShort, config.generator.commit);

  const tempDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "fame-hhd-candidate-"));
  const midiPath = path.join(tempDir, "candidate.mid");
  fs.writeFileSync(midiPath, merged);

  try {
    const { importMidiFile } = require(path.join(fameRoot, "midi", "import-midi"));
    const item = importMidiFile(midiPath, provenance, {});
    const roles = countCanonicalRoles(item);

    if (!(item && item.eligibility && item.eligibility.technical === true)) {
      return { ok: false, reason: `FAME technical blocked: ${(item.import && item.import.errors || []).map(x => x.code).join(",")}`, seedText, seedShort };
    }
    if (!(item && item.eligibility && item.eligibility.commercialTraining === true)) {
      return { ok: false, reason: "FAME commercialTraining != true", seedText, seedShort };
    }
    if (Number(item.canonical && item.canonical.timing && item.canonical.timing.bars) !== Number(config.semantic.requiredBars)) {
      return { ok: false, reason: `canonical bars != ${config.semantic.requiredBars}`, seedText, seedShort };
    }
    if (roles.drums < Number(config.semantic.minDrumEvents)) {
      return { ok: false, reason: `drums insufficienti ${roles.drums}`, seedText, seedShort };
    }
    if (kind === "808" && roles["808"] < Number(config.semantic.minRoleEvents)) {
      return { ok: false, reason: `808 insufficienti ${roles["808"]}`, seedText, seedShort };
    }
    if (kind === "lead" && roles.lead < Number(config.semantic.minRoleEvents)) {
      return { ok: false, reason: `lead insufficiente ${roles.lead}`, seedText, seedShort };
    }
    if (kind === "808" && roles.lead > 0) {
      return { ok: false, reason: "808 candidate contiene lead inatteso", seedText, seedShort };
    }
    if (kind === "lead" && roles["808"] > 0) {
      return { ok: false, reason: "lead candidate contiene 808 inatteso", seedText, seedShort };
    }

    return {
      ok: true,
      seedText,
      seedShort,
      bpm,
      merged,
      provenance,
      roles,
      canonicalBars: item.canonical.timing.bars,
      classifications: item.import && item.import.analysis && item.import.analysis.classifications || []
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeCandidate(outputDir, candidate, kind, style, candidateIndex, attempt, commit) {
  const prefix = `hhd-${kind}-${style}-${String(candidateIndex).padStart(3, "0")}-${candidate.seedShort}`;
  const midiName = `${prefix}.mid`;
  const midiPath = path.join(outputDir, midiName);
  const provenancePath = `${midiPath}.provenance.json`;

  fs.writeFileSync(midiPath, candidate.merged);
  fs.writeFileSync(provenancePath, `${JSON.stringify(candidate.provenance, null, 2)}\n`, "utf8");

  return {
    fileName: midiName,
    sourceId: candidate.provenance.sourceId,
    compositionFamily: candidate.provenance.compositionFamily,
    kind,
    style,
    candidateIndex,
    attempt,
    deterministicSeed: candidate.seedText,
    seedShort: candidate.seedShort,
    bpm: candidate.bpm,
    midiSha256: sha256(candidate.merged),
    midiBytes: candidate.merged.length,
    roles: candidate.roles,
    canonicalBars: candidate.canonicalBars,
    generatorCommit: commit
  };
}

function planCandidates(config) {
  const result = [];
  for (let i = 0; i < Number(config.pool.candidates808); i += 1) {
    const styles = config.pool.styles808;
    result.push({ kind: "808", style: styles[i % styles.length], candidateIndex: i + 1 });
  }
  for (let i = 0; i < Number(config.pool.candidatesLead); i += 1) {
    const styles = config.pool.stylesLead;
    result.push({ kind: "lead", style: styles[i % styles.length], candidateIndex: i + 1 });
  }
  return result;
}

function generateCorpus({ checkoutDir, fameRoot, config, outputDir, reportPath }) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const accepted = [];
  const rejectedAttempts = [];
  const plan = planCandidates(config);

  for (const request of plan) {
    let winner = null;
    for (let attempt = 1; attempt <= Number(config.pool.maxAttemptsPerCandidate); attempt += 1) {
      const candidate = buildCandidate({
        checkoutDir,
        fameRoot,
        config,
        kind: request.kind,
        style: request.style,
        candidateIndex: request.candidateIndex,
        attempt
      });
      if (candidate.ok) {
        winner = writeCandidate(
          outputDir,
          candidate,
          request.kind,
          request.style,
          request.candidateIndex,
          attempt,
          config.generator.commit
        );
        break;
      }
      rejectedAttempts.push({
        kind: request.kind,
        style: request.style,
        candidateIndex: request.candidateIndex,
        attempt,
        seedShort: candidate.seedShort,
        reason: candidate.reason
      });
    }

    if (!winner) {
      throw new Error(`Impossibile generare candidate valido: ${request.kind}/${request.style}/${request.candidateIndex}`);
    }
    accepted.push(winner);
    process.stdout.write(`HHD ${request.kind} ${request.style} ${request.candidateIndex}: OK\n`);
  }

  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    generator: {
      repository: config.generator.repository,
      commit: config.generator.commit,
      deterministic: true,
      sourceFiles: HHD_SOURCE_FILES
    },
    totals: {
      requested: plan.length,
      accepted: accepted.length,
      rejectedAttempts: rejectedAttempts.length,
      candidates808: accepted.filter(x => x.kind === "808").length,
      candidatesLead: accepted.filter(x => x.kind === "lead").length
    },
    semanticPolicy: {
      bassTo808: "only BASS_STYLES[style].instrument === 808sub",
      lead: "only LEAD_STYLES[style] === true",
      bars: config.semantic.requiredBars,
      importerPreflight: "technical + commercial + role event thresholds"
    },
    accepted,
    rejectedAttempts
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

function main(argv = process.argv.slice(2)) {
  const [checkoutDir, fameRoot, configPath, outputDir, reportPath] = argv;
  if (!checkoutDir || !fameRoot || !configPath || !outputDir || !reportPath) {
    console.error("Uso: node generate-hiphopdrummer-corpus.js <hhd-checkout> <fame-root> <config.json> <output-dir> <report.json>");
    process.exitCode = 64;
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const report = generateCorpus({ checkoutDir, fameRoot, config, outputDir, reportPath });
    console.log(`HHD candidate generati: ${report.totals.accepted}`);
    console.log(`HHD 808/lead: ${report.totals.candidates808}/${report.totals.candidatesLead}`);
    console.log(`Tentativi scartati: ${report.totals.rejectedAttempts}`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  HHD_SOURCE_FILES,
  DRUM_TYPES,
  REPORT_SCHEMA,
  sha256,
  seededRandom,
  createDomHarness,
  buildContext,
  parseFormat0,
  mergeFormat0Tracks,
  semanticStyleCheck,
  provenanceFor,
  countCanonicalRoles,
  buildCandidate,
  writeCandidate,
  planCandidates,
  generateCorpus,
  main
};
