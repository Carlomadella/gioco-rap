"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PPQ = 480;
const BARS = 8;
const TICKS_PER_BAR = PPQ * 4;
const COLLECTION_ID = "fame-original-seed-v1";

const ROOTS = [36, 38, 39, 41, 43, 44, 46, 48, 50, 51, 53, 55];
const BPMS = [122, 126, 130, 134, 138, 142, 146, 150, 154, 158, 162, 166];

const PROGRESSIONS = [
  [0, 5, 3, 6, 0, 5, 6, 3],
  [0, 3, 6, 5, 0, 6, 3, 5],
  [0, 6, 5, 3, 0, 5, 3, 6],
  [0, 2, 5, 0, 6, 5, 3, 0],
  [0, 5, 6, 3, 5, 3, 0, 6],
  [0, 3, 5, 6, 3, 0, 5, 6]
];

const KICK_PATTERNS = [
  [0, 6, 11],
  [0, 5, 10, 14],
  [0, 3, 7, 12],
  [0, 6, 9, 15],
  [0, 4, 11, 13],
  [0, 2, 8, 12, 15],
  [0, 7, 10],
  [0, 5, 9, 13]
];

const BASS_PATTERNS = [
  [0, 6, 11],
  [0, 5, 10, 14],
  [0, 7, 12],
  [0, 4, 9, 15],
  [0, 8, 13],
  [0, 3, 10, 14]
];

const LEAD_PATTERNS = [
  [1, 4, 7, 11, 14],
  [0, 3, 6, 10, 13],
  [2, 5, 9, 12, 15],
  [0, 4, 8, 11],
  [1, 6, 9, 13],
  [3, 7, 10, 14]
];

const NAT_MINOR = [0, 2, 3, 5, 7, 8, 10];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function vlq(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return Buffer.from(bytes);
}

function u16(value) {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(value);
  return b;
}

function u32(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value);
  return b;
}

function chunk(type, payload) {
  return Buffer.concat([Buffer.from(type, "ascii"), u32(payload.length), payload]);
}

function metaTrackName(name) {
  const data = Buffer.from(name, "utf8");
  return Buffer.concat([Buffer.from([0xff, 0x03]), vlq(data.length), data]);
}

function addEvent(events, tick, order, bytes) {
  events.push({ tick: Math.max(0, Math.round(tick)), order, bytes: Buffer.from(bytes) });
}

function addNote(events, channel, note, start, duration, velocity = 96) {
  const n = clamp(Math.round(note), 0, 127);
  const v = clamp(Math.round(velocity), 1, 127);
  addEvent(events, start, 20, [0x90 | channel, n, v]);
  addEvent(events, start + Math.max(1, Math.round(duration)), 10, [0x80 | channel, n, 0]);
}

function encodeTrack(name, events, program = null, channel = 0) {
  const all = [];
  addEvent(all, 0, 0, metaTrackName(name));
  if (program != null) addEvent(all, 0, 1, [0xc0 | channel, clamp(program, 0, 127)]);
  all.push(...events);
  all.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const parts = [];
  let lastTick = 0;
  for (const event of all) {
    parts.push(vlq(event.tick - lastTick));
    parts.push(event.bytes);
    lastTick = event.tick;
  }
  parts.push(vlq(0));
  parts.push(Buffer.from([0xff, 0x2f, 0x00]));
  return chunk("MTrk", Buffer.concat(parts));
}

function tempoTrack(bpm) {
  const micros = Math.round(60000000 / bpm);
  const tempo = Buffer.from([
    0xff, 0x51, 0x03,
    (micros >> 16) & 0xff,
    (micros >> 8) & 0xff,
    micros & 0xff
  ]);
  const timeSig = Buffer.from([0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08]);
  const parts = [
    vlq(0), metaTrackName("FAME Original Seed Conductor"),
    vlq(0), tempo,
    vlq(0), timeSig,
    vlq(BARS * TICKS_PER_BAR), Buffer.from([0xff, 0x2f, 0x00])
  ];
  return chunk("MTrk", Buffer.concat(parts));
}

function minorDegree(root, degree, octave = 0) {
  const scaleIndex = ((degree % 7) + 7) % 7;
  const octaveOffset = Math.floor(degree / 7) * 12;
  return root + NAT_MINOR[scaleIndex] + octaveOffset + octave * 12;
}

function chordIntervals(degree, variant) {
  const majorDegrees = new Set([2, 5, 6]);
  const major = majorDegrees.has(((degree % 7) + 7) % 7);
  if (variant % 5 === 1) return [0, 5, 7];
  if (variant % 5 === 2) return [0, 2, 7];
  if (variant % 5 === 3) return major ? [0, 4, 7, 11] : [0, 3, 7, 10];
  return major ? [0, 4, 7] : [0, 3, 7];
}

function rotate(values, amount) {
  const n = values.length;
  const k = ((amount % n) + n) % n;
  return values.slice(k).concat(values.slice(0, k));
}

function buildComposition(index) {
  const rand = mulberry32(0xF4AE0000 + index * 7919);
  const root = ROOTS[index % ROOTS.length];
  const bpm = BPMS[(index * 5 + Math.floor(index / 4)) % BPMS.length];
  const progression = rotate(PROGRESSIONS[index % PROGRESSIONS.length], index % 5);
  const drumEvents = [];
  const bassEvents = [];
  const harmonyEvents = [];
  const leadEvents = [];

  for (let bar = 0; bar < BARS; bar += 1) {
    const barStart = bar * TICKS_PER_BAR;
    const degree = progression[bar];
    const chordRoot = minorDegree(root + 12, degree);
    const bassRoot = clamp(minorDegree(root, degree), 24, 52);

    const kickPattern = rotate(KICK_PATTERNS[(index + bar * 3) % KICK_PATTERNS.length], bar % 2);
    const kickSteps = [...new Set(kickPattern.map(step => (step + (index + bar) % 3) % 16))].sort((a, b) => a - b);
    for (const step of kickSteps) {
      addNote(drumEvents, 9, 36, barStart + step * (PPQ / 4), PPQ / 8, 104 + Math.floor(rand() * 20));
    }

    addNote(drumEvents, 9, (bar + index) % 3 === 0 ? 39 : 38, barStart + 8 * (PPQ / 4), PPQ / 8, 104 + Math.floor(rand() * 16));
    if ((bar + index) % 4 === 3) {
      addNote(drumEvents, 9, 38, barStart + 14 * (PPQ / 4), PPQ / 8, 52 + Math.floor(rand() * 18));
    }

    const hatDivision = [2, 1, 2, 1, 1, 2][(index + bar) % 6];
    const hatStepTicks = (PPQ / 4) * hatDivision;
    const hatCount = Math.floor(TICKS_PER_BAR / hatStepTicks);
    for (let h = 0; h < hatCount; h += 1) {
      if (((h + index + bar) % 11) === 7) continue;
      const swing = ((index + bar) % 4 === 1 && h % 2) ? PPQ / 16 : 0;
      addNote(drumEvents, 9, 42, barStart + h * hatStepTicks + swing, PPQ / 16, 55 + ((h * 11 + index * 7 + bar * 5) % 42));
    }
    if ((bar + index) % 2 === 1) {
      addNote(drumEvents, 9, 46, barStart + ((5 + index + bar) % 16) * (PPQ / 4), PPQ / 8, 70 + Math.floor(rand() * 20));
    }
    if ((bar + index) % 3 === 2) {
      const rollBase = barStart + (12 + (index % 2)) * (PPQ / 4);
      for (let r = 0; r < 6; r += 1) {
        addNote(drumEvents, 9, 42, rollBase + r * (PPQ / 12), PPQ / 24, 58 + r * 6);
      }
    }

    const bassPattern = BASS_PATTERNS[(index * 2 + bar) % BASS_PATTERNS.length];
    const bassShift = (index + bar) % 4;
    const bassSteps = [...new Set(bassPattern.map(step => (step + bassShift) % 16))].sort((a, b) => a - b);
    for (let b = 0; b < bassSteps.length; b += 1) {
      const step = bassSteps[b];
      const nextStep = b + 1 < bassSteps.length ? bassSteps[b + 1] : 16;
      const degreeShift = (b + bar + index) % 5 === 4 ? 4 : ((b + index) % 7 === 3 ? 6 : 0);
      const note = clamp(minorDegree(bassRoot, degreeShift), 24, 55);
      const duration = Math.max(PPQ / 2, (nextStep - step) * (PPQ / 4) - PPQ / 8);
      addNote(bassEvents, 1, note, barStart + step * (PPQ / 4), duration, 78 + Math.floor(rand() * 30));
    }

    const intervals = chordIntervals(degree, index + bar);
    const harmonicOffset = ((bar + index) % 4 === 0) ? 0 : ((bar + index) % 4 === 1 ? PPQ / 4 : 0);
    const chordDuration = ((bar + index) % 3 === 0) ? PPQ * 3 / 2 : PPQ * 2;
    intervals.forEach((interval, noteIndex) => {
      addNote(
        harmonyEvents,
        2,
        clamp(chordRoot + interval + (noteIndex === 0 && (bar + index) % 5 === 0 ? 12 : 0), 48, 88),
        barStart + harmonicOffset,
        chordDuration,
        58 + noteIndex * 7 + Math.floor(rand() * 10)
      );
    });
    if ((bar + index) % 3 === 1) {
      const secondRoot = minorDegree(root + 12, progression[(bar + 1) % BARS]);
      chordIntervals(progression[(bar + 1) % BARS], index + bar + 2).slice(0, 3).forEach((interval, noteIndex) => {
        addNote(harmonyEvents, 2, clamp(secondRoot + interval, 48, 88), barStart + PPQ * 2 + PPQ / 2, PPQ + PPQ / 2, 52 + noteIndex * 8);
      });
    }

    const leadPattern = LEAD_PATTERNS[(index + bar * 2) % LEAD_PATTERNS.length];
    const leadShift = (index * 3 + bar) % 5;
    for (let m = 0; m < leadPattern.length; m += 1) {
      if ((m + bar + index) % 7 === 5) continue;
      const step = (leadPattern[m] + leadShift) % 16;
      const scaleDegree = (m * 2 + bar + index) % 7;
      const octave = ((m + bar + index) % 5 === 0) ? 2 : 1;
      const note = clamp(minorDegree(root + 12, scaleDegree, octave), 60, 96);
      const durationChoices = [PPQ / 4, PPQ / 2, PPQ * 3 / 4];
      const duration = durationChoices[(m + index + bar) % durationChoices.length];
      addNote(leadEvents, 3, note, barStart + step * (PPQ / 4), duration, 60 + Math.floor(rand() * 34));
    }

    if ((bar + index) % 4 === 2) {
      const arpStart = barStart + PPQ * 3;
      for (let a = 0; a < 3; a += 1) {
        const note = clamp(chordRoot + intervals[a % intervals.length] + 12, 60, 96);
        addNote(leadEvents, 3, note, arpStart + a * (PPQ / 6), PPQ / 5, 62 + a * 8);
      }
    }
  }

  const header = chunk("MThd", Buffer.concat([u16(1), u16(5), u16(PPQ)]));
  const midi = Buffer.concat([
    header,
    tempoTrack(bpm),
    encodeTrack("Drums Trap", drumEvents, null, 9),
    encodeTrack("808 Bass", bassEvents, 38, 1),
    encodeTrack("Harmony Piano", harmonyEvents, 4, 2),
    encodeTrack("Lead Melody", leadEvents, 81, 3)
  ]);

  const id = String(index + 1).padStart(3, "0");
  const sourceId = `${COLLECTION_ID}:sketch-${id}`;
  const family = `${COLLECTION_ID}:family-${id}`;
  const provenance = {
    sourceId,
    originType: "original",
    creator: "FAME Neural Original Seed Composer",
    licenseId: "FAME-ORIGINAL-SEED-V1",
    compositionFamily: family,
    sourceUri: null,
    rightsEvidence: [
      "Composizione MIDI generata ex novo dal generatore FAME Neural Original Seed V1.",
      "Nessun MIDI, loop, sample o contenuto musicale di terzi viene letto o copiato dal generatore.",
      "Destinazione dichiarata: dataset interno FAME Neural con training e output commerciali consentiti."
    ],
    commercialTrainingAllowed: true,
    commercialOutputAllowed: true,
    notes: `Seed originale deterministico ${id}; BPM ${bpm}; root MIDI ${root}. Materiale bootstrap: non deve da solo chiudere GATE 1 o dominare il corpus finale.`
  };

  return {
    index,
    id,
    sourceId,
    family,
    bpm,
    root,
    midi,
    provenance,
    summary: {
      drumNotes: drumEvents.length / 2,
      bassNotes: bassEvents.length / 2,
      harmonyNotes: harmonyEvents.length / 2,
      leadNotes: leadEvents.length / 2
    }
  };
}

function generatePack(outputDir, count = 24) {
  const target = path.resolve(outputDir);
  fs.mkdirSync(target, { recursive: true });

  for (const file of fs.readdirSync(target)) {
    if (/\.(mid|midi|provenance\.json|seed-catalog\.json)$/i.test(file)) {
      fs.unlinkSync(path.join(target, file));
    }
  }

  const catalog = {
    schema: "fame-neural-original-seed-catalog-v1",
    version: 1,
    collectionId: COLLECTION_ID,
    generated: []
  };

  for (let index = 0; index < count; index += 1) {
    const composition = buildComposition(index);
    const stem = `fame-seed-${composition.id}`;
    const midiPath = path.join(target, `${stem}.mid`);
    const provenancePath = path.join(target, `${stem}.provenance.json`);
    fs.writeFileSync(midiPath, composition.midi);
    fs.writeFileSync(provenancePath, `${JSON.stringify(composition.provenance, null, 2)}\n`, "utf8");
    catalog.generated.push({
      id: composition.id,
      sourceId: composition.sourceId,
      compositionFamily: composition.family,
      bpm: composition.bpm,
      root: composition.root,
      midi: path.basename(midiPath),
      provenance: path.basename(provenancePath),
      summary: composition.summary
    });
  }

  fs.writeFileSync(path.join(target, "seed-catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
}

function main(argv = process.argv.slice(2)) {
  const [outputDir, countText] = argv;
  if (!outputDir) {
    console.error("Uso: node generate-fame-original-seed.js <output-dir> [count]");
    process.exitCode = 64;
    return;
  }
  const count = countText == null ? 24 : Number(countText);
  if (!Number.isInteger(count) || count < 1 || count > 128) {
    console.error("count deve essere un intero tra 1 e 128");
    process.exitCode = 64;
    return;
  }

  try {
    const catalog = generatePack(outputDir, count);
    console.log(`FAME ORIGINAL SEED: ${catalog.generated.length} composizioni create`);
    console.log(`Collection: ${catalog.collectionId}`);
    console.log(`Output: ${path.resolve(outputDir)}`);
    console.log("Nota: bootstrap originale; non sufficiente da solo per chiudere GATE 1.");
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  PPQ,
  BARS,
  TICKS_PER_BAR,
  COLLECTION_ID,
  vlq,
  buildComposition,
  generatePack,
  main
};
