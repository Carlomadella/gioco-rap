"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

console.log("FASE 3 / DATA READY CLOSER V1 FIX");

const datasetDir = path.join(__dirname, "dataset");
const pdmxRunner = fs.readFileSync(path.join(datasetDir, "run-corpus-expansion-v3-pdmx.ps1"), "utf8");
const closer = fs.readFileSync(path.join(datasetDir, "run-data-ready-closer-v1.ps1"), "utf8");

assert.match(pdmxRunner, /\[int\]\$SeedCount = 24/);
assert.match(pdmxRunner, /-SeedCount \$SeedCount/);

assert.match(closer, /\[int\]\$SeedCount = 120/);
assert.match(closer, /\$roleDeficit\s*=/);
assert.match(closer, /\$roleDeficit -ge 93/);
assert.doesNotMatch(closer, /\$drums -lt 114/);
assert.doesNotMatch(closer, /\$eight08 -lt 61/);
assert.doesNotMatch(closer, /\$lead -lt 48/);
assert.doesNotMatch(closer, /\$pitched -lt 134/);
assert.match(closer, /\$harmony -lt 75/);
assert.match(closer, /source collection dominante/);

console.log("SEED SCALING PARAMETER: OK");
console.log("AGGREGATE ROLE DEFICIT GUARD: OK");
console.log("BRITTLE PER-ROLE GUARDS REMOVED: OK");
console.log("ALREADY-PASSED GATES PRESERVED: OK");
console.log("DATA READY CLOSER FIX SMOKE TEST: OK");
