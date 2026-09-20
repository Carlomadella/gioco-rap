"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const script = fs.readFileSync(
  path.join(__dirname, "owned-beats", "source-separation-audacity-pipe-discover.py"),
  "utf8"
);

assert(script.includes('GetInfo: Type=Commands'));
assert(script.includes('GetInfo: Type=Menus'));
assert(script.includes('Help: Command="GetInfo"'));
assert(script.includes('"audioOpenedByThisCommand": False'));
assert(script.includes('"sourceSeparationExecutedByThisCommand": False'));
assert(script.includes('"preferencesModifiedByThisCommand": False'));
assert(!script.includes("Import2:"));
assert(!script.includes("OpenVINO Music Separation:"));

console.log("owned-beats-source-separation-audacity-pipe-discover-test: PASS");
