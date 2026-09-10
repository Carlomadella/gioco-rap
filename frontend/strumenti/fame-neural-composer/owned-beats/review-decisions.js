"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validate } = require("./bootstrap");

const REVIEW_SCHEMA = "fame-owned-beats-review-v1";
const ROLES = ["drums", "lowend", "tonal", "full"];
const SETTABLE = new Set(["compositionFamilyId", "familyStatus", "nativeExports", "metadataStatus"]);

function atomic(file, content) {
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, content, { flag: "wx" });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function csv(m) {
  const columns = [
    "sourceRecordId", "sourceAssetId", "compositionFamilyId", "familyStatus", "sha256",
    "localPath", "sourcePaths", "presentInScan", "nativeExports", "metadataStatus",
    "taskAdmissibility", "pilotCohorts", "drums", "lowend", "tonal", "full"
  ];
  const quote = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [columns, ...m.records.map(r => [
    r.sourceRecordId, r.sourceAssetId, r.compositionFamilyId, r.familyStatus, r.sha256,
    r.localPath, r.sourcePaths.join(" | "), r.presentInScan, r.nativeExports, r.metadataStatus,
    r.taskAdmissibility, (r.pilotCohorts || []).join(" | "), ...ROLES.map(k => r.roles[k].review)
  ])].map(row => row.map(quote).join(",")).join("\r\n") + "\r\n";
}

function parseDecisions(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const doc = JSON.parse(raw);
  if (
    doc.schema !== REVIEW_SCHEMA ||
    doc.version !== 1 ||
    typeof doc.reviewId !== "string" ||
    !doc.reviewId.trim() ||
    !Array.isArray(doc.decisions) ||
    !doc.decisions.length
  ) {
    throw new Error("Unsupported or invalid review decision schema");
  }
  return doc;
}

function digest(doc) {
  return crypto.createHash("sha256").update(JSON.stringify(doc)).digest("hex");
}

function targetRecords(m, decision) {
  const hasScope = decision.scope !== undefined;
  const hasIds = decision.sourceRecordIds !== undefined;
  if (hasScope === hasIds) {
    throw new Error("Each decision must use exactly one of scope or sourceRecordIds");
  }

  if (hasScope) {
    if (decision.scope !== "all-active") {
      throw new Error(`Unsupported review scope: ${decision.scope}`);
    }
    return m.records.filter(r => r.presentInScan !== false);
  }

  if (
    !Array.isArray(decision.sourceRecordIds) ||
    !decision.sourceRecordIds.length ||
    new Set(decision.sourceRecordIds).size !== decision.sourceRecordIds.length
  ) {
    throw new Error("sourceRecordIds must be a non-empty unique array");
  }

  const byId = new Map(m.records.map(r => [r.sourceRecordId, r]));
  return decision.sourceRecordIds.map(id => {
    if (!byId.has(id)) throw new Error(`Unknown sourceRecordId: ${id}`);
    return byId.get(id);
  });
}

function validateSet(set) {
  if (set === undefined) return;
  if (!set || typeof set !== "object" || Array.isArray(set)) {
    throw new Error("set must be an object");
  }
  for (const [key, value] of Object.entries(set)) {
    if (!SETTABLE.has(key)) {
      throw new Error(`Field cannot be changed by review tool: ${key}`);
    }
    if (key === "compositionFamilyId") {
      if (value !== null && (typeof value !== "string" || !value.trim())) {
        throw new Error("compositionFamilyId must be null or a non-empty string");
      }
    } else if (typeof value !== "string" || !value.trim()) {
      throw new Error(`${key} must be a non-empty string`);
    }
  }
}

function validatePilot(pilot) {
  if (pilot === undefined) return;
  if (
    !pilot ||
    typeof pilot !== "object" ||
    Array.isArray(pilot) ||
    typeof pilot.cohortId !== "string" ||
    !pilot.cohortId.trim() ||
    typeof pilot.selected !== "boolean"
  ) {
    throw new Error("pilot must contain cohortId and boolean selected");
  }
}

function applyDecision(r, decision, reviewId) {
  validateSet(decision.set);
  validatePilot(decision.pilot);

  if (
    decision.note !== undefined &&
    (typeof decision.note !== "string" || !decision.note.trim())
  ) {
    throw new Error("note must be a non-empty string");
  }

  let changed = false;

  for (const [key, value] of Object.entries(decision.set || {})) {
    if (r[key] !== value) {
      r[key] = value;
      changed = true;
    }
  }

  if (decision.pilot) {
    r.pilotCohorts ||= [];
    const has = r.pilotCohorts.includes(decision.pilot.cohortId);

    if (decision.pilot.selected && !has) {
      r.pilotCohorts.push(decision.pilot.cohortId);
      r.pilotCohorts.sort();
      changed = true;
    }

    if (!decision.pilot.selected && has) {
      r.pilotCohorts = r.pilotCohorts.filter(x => x !== decision.pilot.cohortId);
      changed = true;
    }
  }

  if (decision.note) {
    r.notes ||= [];
    const exists = r.notes.some(
      n =>
        n &&
        typeof n === "object" &&
        n.kind === "HUMAN_REVIEW" &&
        n.reviewId === reviewId &&
        n.text === decision.note
    );

    if (!exists) {
      r.notes.push({
        kind: "HUMAN_REVIEW",
        reviewId,
        text: decision.note
      });
      changed = true;
    }
  }

  return changed;
}

function review(workspaceRoot, decisionsFile, apply = false) {
  const workspace = path.resolve(workspaceRoot);
  const manifestPath = path.join(
    workspace,
    "manifest",
    "owned-beats-manifest.json"
  );

  if (!fs.existsSync(manifestPath)) {
    throw new Error("Owned-beats manifest not found");
  }

  const original = validate(
    JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  );
  const doc = parseDecisions(path.resolve(decisionsFile));
  const docDigest = digest(doc);

  const prior = (original.reviewLog || []).find(
    x => x.reviewId === doc.reviewId
  );

  if (prior) {
    if (prior.decisionDigest !== docDigest) {
      throw new Error(
        `reviewId already exists with different content: ${doc.reviewId}`
      );
    }

    return {
      mode: apply ? "APPLIED" : "PREVIEW",
      reviewId: doc.reviewId,
      alreadyApplied: true,
      targetedRecords: 0,
      changedRecords: 0,
      manifest: manifestPath
    };
  }

  const m = JSON.parse(JSON.stringify(original));
  const changedIds = new Set();
  const targetedIds = new Set();

  for (const decision of doc.decisions) {
    const targets = targetRecords(m, decision);

    for (const r of targets) {
      targetedIds.add(r.sourceRecordId);
      if (applyDecision(r, decision, doc.reviewId)) {
        changedIds.add(r.sourceRecordId);
      }
    }
  }

  validate(m);

  const result = {
    mode: apply ? "APPLIED" : "PREVIEW",
    reviewId: doc.reviewId,
    alreadyApplied: false,
    targetedRecords: targetedIds.size,
    changedRecords: changedIds.size,
    changedIds: [...changedIds].sort(),
    manifest: manifestPath
  };

  if (!apply) return result;

  const lock = path.join(workspace, "bootstrap.lock");
  let lockFd;

  try {
    lockFd = fs.openSync(lock, "wx");
    fs.writeFileSync(
      lockFd,
      JSON.stringify({
        pid: process.pid,
        startedAt: new Date().toISOString(),
        operation: "review-decisions"
      })
    );

    m.reviewLog ||= [];
    m.reviewLog.push({
      reviewId: doc.reviewId,
      decisionDigest: docDigest,
      appliedAt: new Date().toISOString(),
      sourceFile: path.basename(decisionsFile)
    });

    atomic(manifestPath, JSON.stringify(m, null, 2) + "\n");
    atomic(
      path.join(workspace, "manifest", "owned-beats-manifest.csv"),
      csv(m)
    );

    return result;
  } finally {
    if (lockFd !== undefined) {
      fs.closeSync(lockFd);
      fs.unlinkSync(lock);
    }
  }
}

function main(args = process.argv.slice(2)) {
  if (
    args.length < 2 ||
    args.length > 3 ||
    (args[2] && args[2] !== "--apply")
  ) {
    throw new Error(
      "Usage: node review-decisions.js <workspace-folder> <decisions.json> [--apply]; default PREVIEW"
    );
  }

  console.log(
    JSON.stringify(
      review(args[0], args[1], args[2] === "--apply"),
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}

module.exports = {
  review,
  parseDecisions,
  csv
};
