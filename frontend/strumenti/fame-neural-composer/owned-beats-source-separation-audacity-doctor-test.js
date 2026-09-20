"use strict";

const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");

if (process.platform !== "win32") {
  console.log("owned-beats-source-separation-audacity-doctor-test: SKIP (Windows-only adapter)");
  process.exit(0);
}

function sha(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "fame-audacity-doctor-"));
try {
  fs.mkdirSync(path.join(root, "modules"), { recursive: true });
  fs.mkdirSync(path.join(root, "openvino-models"), { recursive: true });

  fs.writeFileSync(path.join(root, "audacity.exe"), Buffer.from("fake-audacity"));
  fs.writeFileSync(path.join(root, "modules", "mod-openvino.dll"), Buffer.from("fake-openvino"));
  fs.writeFileSync(path.join(root, "modules", "mod-script-pipe.dll"), Buffer.from("fake-pipe"));

  const bin = Buffer.from("fixture-bin");
  const xml = Buffer.from("fixture-xml");
  fs.writeFileSync(path.join(root, "openvino-models", "htdemucs_v4.bin"), bin);
  fs.writeFileSync(path.join(root, "openvino-models", "htdemucs_v4.xml"), xml);

  const script = path.join(__dirname, "owned-beats", "source-separation-audacity-openvino-doctor.ps1");
  const common = [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script,
    "-AudacityPath", root,
    "-ExpectedModelBinSha256", sha(bin),
    "-ExpectedModelXmlSha256", sha(xml)
  ];

  const ok = cp.spawnSync("pwsh", common, { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr || ok.stdout);
  const doc = JSON.parse(ok.stdout);
  assert.equal(doc.mode, "SOURCE_SEPARATION_AUDACITY_OPENVINO_DOCTOR");
  assert.equal(doc.pass, true);
  assert.equal(doc.audacityFound, true);
  assert.equal(doc.openVinoModule.found, true);
  assert.equal(doc.frozenModel.exactFrozenArtifact, true);
  assert.equal(doc.scripting.moduleFound, true);
  assert.equal(doc.sourceSeparationExecutedByThisCommand, false);
  assert.equal(doc.audioOpenedByThisCommand, false);
  assert.equal(doc.configurationModifiedByThisCommand, false);

  fs.writeFileSync(path.join(root, "openvino-models", "htdemucs_v4.xml"), Buffer.from("tampered"));
  const bad = cp.spawnSync("pwsh", common, { encoding: "utf8" });
  assert.equal(bad.status, 3, bad.stderr || bad.stdout);
  const badDoc = JSON.parse(bad.stdout);
  assert.equal(badDoc.pass, false);
  assert.equal(badDoc.frozenModel.exactFrozenArtifact, false);
  assert.equal(badDoc.nextAction, "RESTORE_FROZEN_HTDEMUCS_OPENVINO_MODEL");

  console.log("owned-beats-source-separation-audacity-doctor-test: PASS");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
