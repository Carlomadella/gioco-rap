"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { fixtures } = require("./fixtures");
const { encode, toIds } = require("./tokenizer");
const { audit } = require("./audit-musicale");

const output = process.argv[2] || path.join(process.cwd(), "fame-neural-poc.dataset.jsonl");
const rows = fixtures.map(seq => ({
  schema: "fame-neural-training-row-v1",
  id: seq.meta.seed,
  prompt: seq.meta.prompt,
  sequence: seq,
  tokens: encode(seq),
  tokenIds: toIds(encode(seq)),
  audit: audit(seq)
}));
fs.writeFileSync(output, rows.map(row => JSON.stringify(row)).join("\n") + "\n", "utf8");
console.log(`Dataset PoC scritto: ${output}`);
console.log(`Righe: ${rows.length}`);
