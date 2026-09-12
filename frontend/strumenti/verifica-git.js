"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
let failures = 0;

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"]
  }).trim();
}

function test(name, condition, detail = "") {
  if (condition) {
    console.log(`  ok   ${name}`);
    return;
  }
  failures++;
  console.log(`  NO   ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("\nGit gate — continuita' branch e hook");

let hooksPath = "";
try { hooksPath = git(["config", "--get", "core.hooksPath"]); } catch (_) {}
test("hook repository attivi", hooksPath === ".githooks", `core.hooksPath=${hooksPath || "<vuoto>"}`);

for (const hook of ["pre-commit", "pre-push", "post-merge"]) {
  test(`hook ${hook} presente`, fs.existsSync(path.join(ROOT, ".githooks", hook)));
}

// GitHub Actions fa checkout in detached HEAD. La freschezza del branch locale
// ha senso solo nella working copy di sviluppo.
if (!process.env.GITHUB_ACTIONS) {
  let branch = "";
  try { branch = git(["branch", "--show-current"]); } catch (_) {}

  if (branch && branch !== "main") {
    let remote = "origin";
    try {
      remote = git(["config", `branch.${branch}.remote`]) || "origin";
      if (remote === ".") remote = "origin";
    } catch (_) {}

    const mainRef = `refs/remotes/${remote}/main`;
    let mainExists = false;
    try {
      git(["show-ref", "--verify", mainRef]);
      mainExists = true;
    } catch (_) {}

    if (mainExists) {
      let fresh = false;
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", `${remote}/main`, "HEAD"], {
          cwd: ROOT,
          stdio: "ignore"
        });
        fresh = true;
      } catch (_) {}
      test("branch contiene il main remoto conosciuto", fresh, `${branch} vs ${remote}/main`);
    }
  }
}

if (failures) {
  console.error(`\nGit gate FALLITO: ${failures} controllo/i non superato/i.`);
  process.exit(1);
}

console.log("\nGit gate OK.");
