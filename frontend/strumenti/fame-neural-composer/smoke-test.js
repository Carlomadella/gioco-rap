"use strict";

const assert = require("node:assert/strict");
const { validateSequence, PPQ, BAR_TICKS } = require("./core");
const { TOKENS, TOKEN_TO_ID } = require("./vocabulary");
const { encode, toIds } = require("./tokenizer");
const { audit } = require("./audit-musicale");
const { fixtures } = require("./fixtures");

assert.equal(PPQ, 960);
assert.equal(BAR_TICKS, 3840);
assert.equal(TOKENS.length, TOKEN_TO_ID.size, "vocabolario con token duplicati");
assert.ok(TOKENS.length < 2000, `vocabolario PoC troppo grande: ${TOKENS.length}`);

for (const fixture of fixtures) {
  const validation = validateSequence(fixture);
  assert.equal(validation.ok, true, `${fixture.meta.seed}: ${validation.errors.join("; ")}`);
  const tokens = encode(fixture);
  const ids = toIds(tokens);
  assert.equal(tokens.length, ids.length);
  assert.equal(tokens[0], "<BOS>");
  assert.equal(tokens.at(-1), "<EOS>");
  assert.ok(tokens.includes("GENRE=trap"));
  assert.ok(tokens.some(t => t.startsWith("KICK_ROLE=")), `${fixture.meta.seed}: kick role assente`);
  assert.ok(tokens.some(t => t.startsWith("BASS_ROLE=")), `${fixture.meta.seed}: bass role assente`);
  const report = audit(fixture);
  assert.equal(report.ok, true);
}

// Regression PoC: una copia letterale del motivo deve essere segnalata.
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

console.log(`FAME Neural Composer PoC: ${fixtures.length} fixture valide`);
console.log(`Vocabolario: ${TOKENS.length} token`);
for (const fixture of fixtures) {
  const tokens = encode(fixture);
  const report = audit(fixture);
  console.log(`- ${fixture.meta.seed}: ${fixture.timing.bars} barre, ${fixture.events.length} eventi, ${tokens.length} token, audit ${report.findings.length} finding`);
}
console.log("SMOKE TEST: OK");
