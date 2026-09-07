"use strict";

const assert = require("node:assert/strict");
const {
  createSequence,
  validateSequence,
  compareEvents,
  EVENT_TYPE_ORDER,
  PPQ,
  BAR_TICKS
} = require("./core");
const { TOKENS, TOKEN_TO_ID, DURATION_TICKS, POSITION_TICKS } = require("./vocabulary");
const {
  encode,
  decode,
  toIds,
  fromIds,
  nearestDurationToken,
  nearestPositionToken
} = require("./tokenizer");
const { validateTokenGrammar, allowedNextTokens } = require("./grammar");
const { audit } = require("./audit-musicale");
const { fixtures } = require("./fixtures");

assert.equal(PPQ, 960);
assert.equal(BAR_TICKS, 3840);
assert.equal(TOKENS.length, TOKEN_TO_ID.size, "vocabolario con token duplicati");
assert.ok(TOKENS.length < 2000, `vocabolario PoC troppo grande: ${TOKENS.length}`);
assert.ok(DURATION_TICKS.includes(160), "durata 1/16 triplet non rappresentabile");
assert.ok(DURATION_TICKS.includes(320), "durata 1/8 triplet non rappresentabile");
assert.equal(nearestDurationToken(160), 160);
assert.equal(nearestDurationToken(320), 320);
assert.equal(nearestPositionToken(0), 0);
assert.equal(nearestPositionToken(BAR_TICKS - 1), POSITION_TICKS.at(-1));

for (const fixture of fixtures) {
  const validation = validateSequence(fixture);
  assert.equal(validation.ok, true, `${fixture.meta.seed}: ${validation.errors.join("; ")}`);

  const tokens = encode(fixture);
  const grammar = validateTokenGrammar(tokens);
  assert.equal(grammar.ok, true, `${fixture.meta.seed}: grammar: ${grammar.error}`);

  const ids = toIds(tokens);
  assert.equal(tokens.length, ids.length);
  assert.deepEqual(fromIds(ids), tokens, `${fixture.meta.seed}: id round-trip fallito`);
  assert.equal(tokens[0], "<BOS>");
  assert.equal(tokens.at(-1), "<EOS>");

  const decoded = decode(tokens);
  const decodedValidation = validateSequence(decoded);
  assert.equal(decodedValidation.ok, true, `${fixture.meta.seed}: decode non valido: ${decodedValidation.errors.join("; ")}`);
  assert.deepEqual(encode(decoded), tokens, `${fixture.meta.seed}: encode/decode non canonico`);

  const report = audit(fixture);
  assert.equal(report.ok, true);
}

// Grammar prefix: utile al futuro constrained decoding.
assert.deepEqual(allowedNextTokens([]), ["<BOS>"]);
assert.deepEqual(allowedNextTokens(["<BOS>"]), ["GENRE=trap"]);
assert.ok(allowedNextTokens(["<BOS>", "GENRE=trap"]).every(t => t.startsWith("LINEAGE=")));

// Grammar malformed: POS e VEL invertiti dentro un evento devono essere rifiutati.
const malformed = encode(fixtures[0]);
const firstEvent = malformed.findIndex(t => t.startsWith("EV="));
[malformed[firstEvent + 1], malformed[firstEvent + 2]] = [malformed[firstEvent + 2], malformed[firstEvent + 1]];
const malformedResult = validateTokenGrammar(malformed);
assert.equal(malformedResult.ok, false, "grammar accetta evento con attributi fuori ordine");
assert.throws(() => decode(malformed), /token grammar non valida|sequenza incompleta/);

// Harmony: progressione reale, inversione e accordo che attraversa una barra.
const harmonicFixture = createSequence({
  meta: { seed: "phase1-harmony", genre: "trap", lineage: "musical_church" },
  timing: { ppq: PPQ, bpm: 144, bars: 3 },
  tonality: { rootPitchClass: 1, mode: "minor" },
  harmony: [
    { startTick: 0, durationTicks: BAR_TICKS, rootPitchClass: 1, quality: "minor", bassPitchClass: 1 },
    { startTick: BAR_TICKS, durationTicks: BAR_TICKS / 2, rootPitchClass: 9, quality: "maj7", bassPitchClass: 1 },
    { startTick: BAR_TICKS + BAR_TICKS / 2, durationTicks: BAR_TICKS + BAR_TICKS / 2, rootPitchClass: 8, quality: "major", bassPitchClass: 8 }
  ],
  bars: Array.from({ length: 3 }, (_, index) => ({ index })),
  events: []
});
const harmonicValidation = validateSequence(harmonicFixture);
assert.equal(harmonicValidation.ok, true, harmonicValidation.errors.join("; "));
const harmonicTokens = encode(harmonicFixture);
assert.ok(harmonicTokens.includes("CH_QUALITY=maj7"));
assert.ok(harmonicTokens.includes("CH_BASS=1"));
const harmonicDecoded = decode(harmonicTokens);
assert.deepEqual(harmonicDecoded.tonality, harmonicFixture.tonality);
assert.deepEqual(harmonicDecoded.harmony, harmonicFixture.harmony, "harmony round-trip fallito");
assert.deepEqual(encode(harmonicDecoded), harmonicTokens);

// 808 glide: target e durata del glide sono parte della grammatica.
const glideFixture = createSequence({
  meta: { seed: "phase1-glide", genre: "trap", lineage: "dark_minimal" },
  timing: { ppq: PPQ, bpm: 140, bars: 1 },
  tonality: { rootPitchClass: 1, mode: "minor" },
  harmony: [{ startTick: 0, durationTicks: BAR_TICKS, rootPitchClass: 1, quality: "minor", bassPitchClass: 1 }],
  bars: [{ index: 0, motif: "A" }],
  events: [{
    type: "808", tick: 0, velocity: 0.91, note: 37, durationTicks: 960,
    role: "root", glideTo: 49, glideTicks: 320
  }]
});
const glideValidation = validateSequence(glideFixture);
assert.equal(glideValidation.ok, true, glideValidation.errors.join("; "));
const glideTokens = encode(glideFixture);
assert.ok(glideTokens.includes("GLIDE_TO=49"));
assert.ok(glideTokens.includes("GLIDE_DUR=320"));
const glideDecoded = decode(glideTokens);
const decoded808 = glideDecoded.events.find(e => e.type === "808");
assert.equal(decoded808.glideTo, 49);
assert.equal(decoded808.glideTicks, 320);
assert.deepEqual(encode(glideDecoded), glideTokens);

// Glide su strumenti non-808 è semanticamente invalido.
const invalidGlide = {
  ...glideFixture,
  events: [{ type: "lead", tick: 0, velocity: 0.8, note: 72, durationTicks: 480, glideTo: 74, glideTicks: 160 }]
};
assert.equal(validateSequence(invalidGlide).ok, false, "glide non-808 accettato");

// Eventi simultanei: ordine canonico indipendente dall'ordine di input.
const simultaneous = createSequence({
  meta: { seed: "phase1-simultaneous", genre: "trap", lineage: "dark_minimal" },
  timing: { ppq: PPQ, bpm: 140, bars: 1 },
  tonality: { rootPitchClass: 0, mode: "minor" },
  harmony: [],
  bars: [{ index: 0 }],
  events: [
    { type: "hat_closed", tick: 0, velocity: 0.7 },
    { type: "kick", tick: 0, velocity: 0.9, role: "REINFORCE" },
    { type: "808", tick: 0, velocity: 0.9, note: 36, durationTicks: 960, role: "root" },
    { type: "snare", tick: 0, velocity: 0.8 },
    { type: "lead", tick: 0, velocity: 0.5, note: 72, durationTicks: 480, motif: "A" }
  ]
});
assert.deepEqual(
  simultaneous.events.map(e => e.type),
  EVENT_TYPE_ORDER.filter(type => ["hat_closed", "kick", "808", "snare", "lead"].includes(type)),
  "ordine canonico eventi simultanei errato"
);
assert.equal([...simultaneous.events].sort(compareEvents).map(e => e.type).join(","), simultaneous.events.map(e => e.type).join(","));

// Boundary/quantizzazione: l'ultima posizione MIDI della barra viene proiettata sulla griglia neurale più vicina.
const boundaryFixture = createSequence({
  meta: { seed: "phase1-boundary", genre: "trap", lineage: "dark_minimal" },
  timing: { ppq: PPQ, bpm: 140, bars: 2 },
  tonality: { rootPitchClass: 0, mode: "minor" },
  harmony: [],
  bars: [{ index: 0 }, { index: 1 }],
  events: [
    { type: "kick", tick: BAR_TICKS - 1, velocity: 0.9, role: "RESPONSE" },
    { type: "lead", tick: BAR_TICKS - 240, velocity: 0.7, note: 127, durationTicks: 1320, motif: "A" },
    { type: "lead", tick: BAR_TICKS, velocity: 0.7, note: 0, durationTicks: 160, motif: "A" }
  ]
});
const boundaryTokens = encode(boundaryFixture);
assert.equal(validateTokenGrammar(boundaryTokens).ok, true);
const boundaryDecoded = decode(boundaryTokens);
assert.equal(boundaryDecoded.events.find(e => e.type === "kick").tick, nearestPositionToken(BAR_TICKS - 1));
assert.ok(boundaryDecoded.events.some(e => e.note === 127));
assert.ok(boundaryDecoded.events.some(e => e.note === 0));
assert.ok(boundaryDecoded.events.some(e => e.durationTicks === 1320), "durata cross-bar persa");
assert.ok(boundaryDecoded.events.some(e => e.durationTicks === 160), "durata triplet persa");
assert.deepEqual(encode(boundaryDecoded), boundaryTokens);

// Validazione armonica: qualità ignota e overlap non vengono silenziosamente normalizzati.
const invalidHarmony = {
  meta: { genre: "trap" },
  timing: { ppq: PPQ, bpm: 140, bars: 1 },
  bars: [{ index: 0 }],
  events: [],
  harmony: [
    { startTick: 0, durationTicks: 960, rootPitchClass: 0, quality: "mystery" },
    { startTick: 480, durationTicks: 960, rootPitchClass: 5, quality: "major" }
  ]
};
const invalidHarmonyValidation = validateSequence(invalidHarmony);
assert.equal(invalidHarmonyValidation.ok, false);
assert.ok(invalidHarmonyValidation.errors.some(e => e.includes("quality non supportata")));
assert.ok(invalidHarmonyValidation.errors.some(e => e.includes("sovrappongono")));

// Regression audit: una copia letterale del motivo deve essere segnalata.
const cloned = JSON.parse(JSON.stringify(fixtures[0]));
for (let bar = 1; bar <= 2; bar++) {
  cloned.bars[bar].motif = cloned.bars[0].motif;
  cloned.bars[bar].motifTreatment = "return";
  cloned.events = cloned.events.filter(e => !(e.type === "lead" && Math.floor(e.tick / BAR_TICKS) === bar));
  const baseLead = cloned.events.filter(e => e.type === "lead" && Math.floor(e.tick / BAR_TICKS) === 0);
  baseLead.forEach(e => cloned.events.push({ ...e, tick: e.tick + bar * BAR_TICKS }));
}
const clonedAudit = audit(cloned);
assert.ok(clonedAudit.findings.some(f => f.code === "MOTIF_LITERAL_REPEAT"), "audit non intercetta motif literal repeat");

console.log(`FAME Neural Composer: ${fixtures.length} fixture base valide`);
console.log(`Vocabolario: ${TOKENS.length} token`);
for (const fixture of fixtures) {
  const tokens = encode(fixture);
  const report = audit(fixture);
  console.log(`- ${fixture.meta.seed}: ${fixture.timing.bars} barre, ${fixture.events.length} eventi, ${tokens.length} token, audit ${report.findings.length} finding`);
}
console.log("TOKEN GRAMMAR + CONSTRAINED PREFIX: OK");
console.log("HARMONY/CHORD ROUND-TRIP: OK");
console.log("808 GLIDE ROUND-TRIP: OK");
console.log("SIMULTANEOUS EVENT ORDER: OK");
console.log("BOUNDARY + CROSS-BAR DURATION: OK");
console.log("ROUND-TRIP TOKEN/ID/SEQUENCE: OK");
console.log("TRIPLET DURATIONS 160/320: OK");
console.log("FASE 1 SMOKE TEST: OK");
