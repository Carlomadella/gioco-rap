"use strict";

const assert = require("node:assert");
const cp = require("node:child_process");
const path = require("node:path");

const script = path.join(
  __dirname,
  "owned-beats",
  "source-separation-audacity-pipe-discover.py"
);

const py = process.platform === "win32" ? "python" : "python3";
const result = cp.spawnSync(py, [script, "--self-test"], { encoding: "utf8" });

assert.equal(result.status, 0, result.stderr || result.stdout);
assert.match(result.stdout, /self-test: PASS/);

const source = require("node:fs").readFileSync(script, "utf8");
assert(source.includes('TARGET_TEXT = "openvino music separation"'));
assert(source.includes('"targetCommandUnique": len(commands) == 1'));
assert(source.includes('"targetHasAutomatableParams": has_params'));
assert(source.includes('"audioOpenedByThisCommand": False'));
assert(source.includes('"sourceSeparationExecutedByThisCommand": False'));
assert(!source.includes("Import2:"));
assert(!source.includes("OpenVINO Music Separation:"));

console.log("owned-beats-source-separation-audacity-pipe-discover-test: PASS");
