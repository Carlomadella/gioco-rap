"use strict";

const assert = require("node:assert");
const cp = require("node:child_process");
const path = require("node:path");

const script = path.join(
  __dirname,
  "owned-beats",
  "source-separation-standalone-doctor.py"
);
const py = process.platform === "win32" ? "python" : "python3";
const result = cp.spawnSync(py, [script, "--self-test"], { encoding: "utf8" });

assert.equal(result.status, 0, result.stderr || result.stdout);
assert.match(result.stdout, /self-test: PASS/);

console.log("owned-beats-source-separation-standalone-doctor-test: PASS");
