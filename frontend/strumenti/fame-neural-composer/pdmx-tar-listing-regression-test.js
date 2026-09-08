"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { runToFile } = require("./dataset/run-pdmx-volume-closer-v1");

console.log("PDMX TAR LISTING / ENOBUFS REGRESSION");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fame-pdmx-enobufs-"));
try {
  const output = path.join(tmp, "huge-listing.txt");
  const bytes = 8 * 1024 * 1024;
  runToFile(process.execPath, ["-e", `process.stdout.write("x".repeat(${bytes}))`], output, { timeoutMs: 30000 });
  const stat = fs.statSync(output);
  assert.equal(stat.size, bytes);
  console.log(`STREAMED STDOUT: ${stat.size} bytes OK`);
  console.log("ENOBUFS REGRESSION TEST: OK");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
