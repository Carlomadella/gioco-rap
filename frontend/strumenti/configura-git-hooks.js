"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..", "..");
const gitEntry = path.join(root, ".git");

if (!fs.existsSync(gitEntry)) {
  console.log("[githooks] Repository Git non rilevata: configurazione saltata.");
  process.exit(0);
}

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
    cwd: root,
    stdio: "ignore"
  });
  console.log("[githooks] core.hooksPath = .githooks");
} catch (err) {
  console.error("[githooks] Impossibile configurare gli hook Git.");
  process.exit(1);
}
