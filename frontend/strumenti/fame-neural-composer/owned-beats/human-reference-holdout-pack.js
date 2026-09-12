"use strict";

/*
 * FAME Neural — blind Human Reference pack for the remediated R1 v2 holdout.
 *
 * This tool is intentionally separate from human-reference-pack.js, which is the
 * development-only Human Reference collector. It binds the human review to:
 *   - the immutable R1 v2 cohort reference;
 *   - the exact one-shot reservation already created before audio access;
 *   - candidate/config/protocol digests frozen by that reservation.
 *
 * `preflight` is metadata-only and never opens/hash/probes/decodes source audio.
 * `prepare` is the FIRST intentional holdout audio access and records that boundary
 * before hashing/decoding any source. It never runs V1/V2 scoring or the comparator.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const base = require("./human-reference-pack.js");

const MANIFEST_SCHEMA = "fame-owned-beats-workspace-v1";
const PROTOCOL_SCHEMA = "fame-owned-beats-audio-analysis-v2-evaluation-protocol";
const SUBMISSION_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-v1";
const SNAPSHOT_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-snapshot-v1";
const INDEX_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-index-v1";
const ACCESS_SCHEMA = "fame-owned-beats-audio-analysis-holdout-access-v1";

const REFERENCE_SCHEMA = "fame-owned-beats-holdout-cohort-reference-v2";
const REFERENCE_VERSION = 2;
const REFERENCE_COHORT_ID = "audio-analysis-holdout-r1-v2";
const REFERENCE_STATUS = "FROZEN_NEW_UNTOUCHED_HOLDOUT_BEFORE_OBSERVATION";

const RESERVATION_STATUS = "RESERVED_BEFORE_AUDIO_ACCESS";
const DEVELOPMENT_SPLIT = "development";
const LEGACY_HOLDOUT_SPLIT = "evaluation-holdout";
const DEFAULT_REVIEW_ID = "audio-analysis-v2-holdout-r1-v2-reference-001";

const HERE = __dirname;
const REFERENCE_FILE = path.join(HERE, "audio-analysis-holdout-cohort-r1-v2.json");
const PROTOCOL_FILE = path.join(HERE, "audio-analysis-v2-protocol.json");
const CONFIG_FILE = path.join(HERE, "audio-analysis-v2-config-001.json");

const IDENTITY_FIELDS = [
  "compositionFamilyId",
  "sourceRecordId",
  "sourceAssetId",
  "sha256"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function stablePretty(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256FileSync(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    while (true) {
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!bytes) break;
      h.update(buffer.subarray(0, bytes));
    }
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex");
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalValue(value[key]);
    return out;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

function atomicNew(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, content, { flag: "wx" });
    if (fs.existsSync(file)) throw new Error(`Refusing to overwrite immutable artifact: ${file}`);
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function atomicReplace(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, content, { flag: "wx" });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function assertReviewId(value) {
  return base.assertSafeReviewId(value);
}

function assertHex64(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256`);
  }
  return value;
}

function identity(record) {
  if (!record || typeof record !== "object") throw new Error("Invalid identity record");
  const out = {};
  for (const field of IDENTITY_FIELDS) {
    const value = record[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Missing holdout identity field: ${field}`);
    }
    out[field] = value;
  }
  assertHex64(out.sha256, "sha256");
  if (out.sourceAssetId !== `sha256:${out.sha256}`) {
    throw new Error(`sourceAssetId/SHA mismatch: ${out.sourceRecordId}`);
  }
  return out;
}

function sortedIdentities(records) {
  const out = records.map(identity);
  out.sort((a, b) =>
    a.compositionFamilyId.localeCompare(b.compositionFamilyId) ||
    a.sourceRecordId.localeCompare(b.sourceRecordId) ||
    a.sourceAssetId.localeCompare(b.sourceAssetId) ||
    a.sha256.localeCompare(b.sha256)
  );
  for (const field of IDENTITY_FIELDS) {
    const values = out.map(item => item[field]);
    if (new Set(values).size !== values.length) {
      throw new Error(`Duplicate holdout identity: ${field}`);
    }
  }
  return out;
}

function cohortDigest(records) {
  return sha256Text(canonicalJson(sortedIdentities(records)));
}

function sameIdentities(a, b) {
  return canonicalJson(sortedIdentities(a)) === canonicalJson(sortedIdentities(b));
}

function validateProtocol(protocol) {
  const holdout = protocol?.splits?.evaluationHoldout || {};
  if (
    protocol?.schema !== PROTOCOL_SCHEMA ||
    protocol?.version !== 1 ||
    protocol?.status !== "FROZEN_PRE_TUNING" ||
    protocol?.splits?.development?.name !== DEVELOPMENT_SPLIT ||
    holdout.name !== LEGACY_HOLDOUT_SPLIT ||
    Number(holdout.expectedFamilies) !== 10 ||
    holdout.allowedDuringTuning !== false ||
    holdout.requiresFrozenCandidate !== true ||
    Number(holdout.maxFinalEvaluationRuns) !== 1 ||
    protocol?.decision?.developmentRule?.holdoutMayOpenOnlyFor !== "V2_WINS" ||
    protocol?.decision?.holdoutRule?.retuneAfterViewingHoldoutAllowed !== false
  ) {
    throw new Error("Frozen protocol does not authorize the required one-shot holdout boundary");
  }
  return protocol;
}

function validateReference(reference, protocol) {
  const records = reference?.records;
  if (
    reference?.schema !== REFERENCE_SCHEMA ||
    reference?.version !== REFERENCE_VERSION ||
    reference?.cohortId !== REFERENCE_COHORT_ID ||
    reference?.status !== REFERENCE_STATUS ||
    Number(reference?.expectedFamilies) !== 10 ||
    typeof reference?.plannedSplit !== "string" ||
    !reference.plannedSplit ||
    reference.plannedSplit === LEGACY_HOLDOUT_SPLIT ||
    !Array.isArray(records) ||
    records.length !== 10 ||
    reference?.legacyOriginalHoldout?.auditVerdict !== "PARTIAL" ||
    reference?.legacyOriginalHoldout?.policy !== "PROVENANCE_INSUFFICIENT_DO_NOT_USE_AS_FINAL_HOLDOUT" ||
    reference?.legacyOriginalHoldout?.reusedInNewCohort !== false ||
    reference?.selection?.usesAudioContentOrDerivedMetrics !== false ||
    reference?.safety?.holdoutAudioAccessPerformed !== false ||
    reference?.safety?.holdoutObserved !== false ||
    reference?.safety?.reservationCreated !== false
  ) {
    throw new Error("Invalid or unsafe remediated holdout reference");
  }
  if (Number(protocol.splits.evaluationHoldout.expectedFamilies) !== records.length) {
    throw new Error("Reference/protocol holdout family count mismatch");
  }
  const actual = cohortDigest(records);
  if (actual !== reference.cohortDigestSha256) {
    throw new Error("Holdout cohort digest mismatch");
  }
  return reference;
}

function validateConfig(config, protocolDigest) {
  if (
    config?.schema !== "fame-owned-beats-audio-analysis-v2-development-config" ||
    config?.version !== 1 ||
    config?.candidateId !== "audio-analysis-v2-config-001" ||
    config?.configurationIndex !== 1 ||
    config?.status !== "FROZEN_BEFORE_DEVELOPMENT_OBSERVATION" ||
    config?.split !== DEVELOPMENT_SPLIT ||
    config?.holdoutAccessAllowed !== false
  ) {
    throw new Error("Unexpected/unfrozen V2 candidate config");
  }
  assertHex64(config.configHash, "configHash");
  if (config.protocolDigestSha256 !== protocolDigest) {
    throw new Error("Candidate config protocol digest mismatch");
  }
  return config;
}

function validateManifest(manifest, reference) {
  if (
    manifest?.schema !== MANIFEST_SCHEMA ||
    manifest?.version !== 1 ||
    !Array.isArray(manifest?.records)
  ) {
    throw new Error("Unsupported owned-beats manifest");
  }

  const byRecord = new Map();
  const unique = {
    sourceRecordId: new Set(),
    sourceAssetId: new Set(),
    sha256: new Set()
  };
  const familySplits = new Map();

  for (const record of manifest.records) {
    const id = identity(record);
    for (const field of Object.keys(unique)) {
      if (unique[field].has(id[field])) throw new Error(`Duplicate manifest ${field}: ${id[field]}`);
      unique[field].add(id[field]);
    }
    byRecord.set(id.sourceRecordId, record);

    const split = record.split;
    if (split) {
      const prior = familySplits.get(id.compositionFamilyId);
      if (prior && prior !== split) {
        throw new Error(`Composition family crosses splits: ${id.compositionFamilyId}`);
      }
      familySplits.set(id.compositionFamilyId, split);
    }
  }

  const selected = [];
  for (const frozen of reference.records) {
    const record = byRecord.get(frozen.sourceRecordId);
    if (!record) throw new Error(`Frozen holdout record missing from manifest: ${frozen.sourceRecordId}`);
    if (record.presentInScan === false) throw new Error(`Frozen holdout record is not active: ${frozen.sourceRecordId}`);
    if (record.split !== reference.plannedSplit) {
      throw new Error(`Frozen holdout record has wrong split: ${frozen.sourceRecordId}:${record.split || "NO_SPLIT"}`);
    }
    if (!sameIdentities([record], [frozen])) {
      throw new Error(`Manifest/reference identity mismatch: ${frozen.sourceRecordId}`);
    }
    if (typeof record.localPath !== "string" || !record.localPath.trim()) {
      throw new Error(`Missing localPath: ${frozen.sourceRecordId}`);
    }
    selected.push(record);
  }

  if (selected.length !== 10 || !sameIdentities(selected, reference.records)) {
    throw new Error("Manifest selection differs from frozen R1 v2 cohort");
  }
  return selected;
}

function reservationRoot(workspace) {
  return path.join(workspace, "runs", "evaluation-holdout-usage");
}

function findReservation(workspace, reference, config, protocolDigest, referenceDigest) {
  const root = reservationRoot(workspace);
  if (!fs.existsSync(root)) throw new Error(`Holdout reservation directory missing: ${root}`);
  if (fs.existsSync(path.join(root, "reservation.lock"))) {
    throw new Error("reservation.lock exists; manual inspection required");
  }

  const matches = [];
  for (const name of fs.readdirSync(root).filter(x => x.endsWith(".json")).sort()) {
    const file = path.join(root, name);
    const payload = readJson(file);
    if (
      payload.cohortId === reference.cohortId &&
      payload.cohortDigestSha256 === reference.cohortDigestSha256
    ) {
      matches.push({ file, payload });
    }
  }
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one R1 v2 reservation, found ${matches.length}`);
  }

  const { file, payload } = matches[0];
  if (
    payload.status !== RESERVATION_STATUS ||
    payload.candidateId !== config.candidateId ||
    payload.configHash !== config.configHash ||
    payload.protocolDigestSha256 !== protocolDigest ||
    payload.cohortReferenceDigestSha256 !== referenceDigest ||
    !Array.isArray(payload.records) ||
    !sameIdentities(payload.records, reference.records)
  ) {
    throw new Error("Reservation does not exactly bind cohort/candidate/config/protocol/reference");
  }
  assertHex64(payload.freezeDigestSha256, "freezeDigestSha256");

  for (const [field, listField] of [
    ["compositionFamilyId", "families"],
    ["sourceRecordId", "sourceRecordIds"],
    ["sourceAssetId", "sourceAssetIds"],
    ["sha256", "sha256s"]
  ]) {
    const expected = sortedIdentities(reference.records).map(x => x[field]).sort();
    const actual = Array.isArray(payload[listField]) ? payload[listField].slice().sort() : null;
    if (!actual || JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Reservation ${listField} differs from frozen cohort`);
    }
  }

  return {
    file,
    payload,
    digest: sha256FileSync(file)
  };
}

function assertSourcePathsExist(workspace, records) {
  for (const record of records) {
    const source = path.resolve(workspace, record.localPath);
    const root = path.resolve(workspace) + path.sep;
    if (!(source + path.sep).startsWith(root) && source !== path.resolve(workspace)) {
      throw new Error(`localPath escapes workspace: ${record.sourceRecordId}`);
    }
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      throw new Error(`Missing source copy: ${record.sourceRecordId}`);
    }
  }
}

function currentContext(workspaceRoot) {
  const workspace = path.resolve(workspaceRoot);
  if (!fs.existsSync(workspace) || !fs.statSync(workspace).isDirectory()) {
    throw new Error(`Workspace not found: ${workspace}`);
  }
  for (const file of [REFERENCE_FILE, PROTOCOL_FILE, CONFIG_FILE]) {
    if (!fs.existsSync(file)) throw new Error(`Required repository file missing: ${file}`);
  }

  const protocolRaw = fs.readFileSync(PROTOCOL_FILE, "utf8");
  const protocolDigest = sha256Text(protocolRaw);
  const protocol = validateProtocol(JSON.parse(protocolRaw.replace(/^\\uFEFF/, "")));

  const referenceRaw = fs.readFileSync(REFERENCE_FILE, "utf8");
  const referenceDigest = sha256Text(referenceRaw);
  const reference = validateReference(JSON.parse(referenceRaw.replace(/^\\uFEFF/, "")), protocol);

  const config = validateConfig(readJson(CONFIG_FILE), protocolDigest);

  const manifestPath = path.join(workspace, "manifest", "owned-beats-manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`Owned-beats manifest missing: ${manifestPath}`);
  const manifest = readJson(manifestPath);
  const records = validateManifest(manifest, reference);
  assertSourcePathsExist(workspace, records);

  const reservation = findReservation(
    workspace,
    reference,
    config,
    protocolDigest,
    referenceDigest
  );

  return {
    workspace,
    protocol,
    protocolDigest,
    reference,
    referenceDigest,
    config,
    manifest,
    manifestPath,
    records,
    reservation
  };
}

function blindId(reservationDigest, record) {
  const id = identity(record);
  return "HR-" + sha256Text(
    `${reservationDigest}|${id.sourceAssetId}|blind-id-v1`
  ).slice(0, 10).toUpperCase();
}

function orderedRecords(context) {
  return context.records
    .map(record => ({
      record,
      order: sha256Text(
        `${context.reservation.digest}|${record.sourceAssetId}|blind-order-v1`
      )
    }))
    .sort((a, b) => a.order.localeCompare(b.order))
    .map(x => x.record);
}

function ffmpegExecutable() {
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const probe = spawnSync(exe, ["-version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) throw new Error("ffmpeg not found in PATH");
  return exe;
}

function gitText(args) {
  const result = spawnSync("git", args, { cwd: HERE, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(
      (result.stderr || result.stdout || "").trim() ||
      `Git command failed: git ${args.join(" ")}`
    );
  }
  return (result.stdout || "").trim();
}

function assertReviewToolCommittedClean() {
  const protectedFiles = [
    path.basename(__filename),
    "human-reference-pack.js",
    path.basename(REFERENCE_FILE),
    path.basename(PROTOCOL_FILE),
    path.basename(CONFIG_FILE)
  ];

  for (const file of protectedFiles) {
    gitText(["ls-files", "--error-unmatch", "--", file]);
  }
  const status = gitText(["status", "--porcelain", "--", ...protectedFiles]);
  if (status) {
    throw new Error(
      "Human Reference/reference/protocol/config tooling must be committed and clean before holdout audio access"
    );
  }
}

function decodedDurationSeconds(file, sampleRate = 22050) {
  const ffmpeg = ffmpegExecutable();
  const result = spawnSync(ffmpeg, [
    "-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(sampleRate),
    "-f", "f32le", "pipe:1"
  ], { encoding: null, maxBuffer: 1024 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString("utf8").trim() : "";
    throw new Error(stderr || `ffmpeg decode failed: ${file}`);
  }
  if (!result.stdout.length || result.stdout.length % 4 !== 0) {
    throw new Error(`Invalid decoded PCM length: ${file}`);
  }
  return Math.round(((result.stdout.length / 4) / sampleRate) * 1e6) / 1e6;
}

function extractClip(source, output, startSeconds, durationSeconds, sampleRate = 22050) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const ffmpeg = ffmpegExecutable();
  const result = spawnSync(ffmpeg, [
    "-v", "error", "-y", "-i", source,
    "-ss", String(startSeconds), "-t", String(durationSeconds),
    "-vn", "-ac", "1", "-ar", String(sampleRate), "-c:a", "pcm_s16le", output
  ], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error((result.stderr || "").trim() || `Clip extraction failed: ${output}`);
  }
}

function extractWaveformSvg(source, output, sampleRate = 22050) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const ffmpeg = ffmpegExecutable();
  const result = spawnSync(ffmpeg, [
    "-v", "error", "-i", source, "-vn", "-ac", "1", "-ar", String(sampleRate),
    "-f", "s16le", "pipe:1"
  ], { encoding: null, maxBuffer: 256 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString("utf8").trim() : "";
    throw new Error(stderr || `Waveform decode failed: ${source}`);
  }
  atomicNew(output, base.waveformSvgFromPcm(result.stdout));
}

function accessReceiptPath(context) {
  const stem = path.basename(context.reservation.file, ".json");
  return path.join(
    context.workspace,
    "runs",
    "evaluation-holdout-observation",
    `${stem}.human-reference.json`
  );
}

function ensureAccessReceipt(context, reviewId) {
  const file = accessReceiptPath(context);
  if (fs.existsSync(file)) {
    const prior = readJson(file);
    if (
      prior.schema !== ACCESS_SCHEMA ||
      prior.version !== 1 ||
      prior.reviewId !== reviewId ||
      prior.reservationDigestSha256 !== context.reservation.digest ||
      prior.cohortDigestSha256 !== context.reference.cohortDigestSha256
    ) {
      throw new Error(`Existing holdout observation receipt is incompatible: ${file}`);
    }
    return { file, payload: prior, alreadyExists: true };
  }

  const payload = {
    schema: ACCESS_SCHEMA,
    version: 1,
    status: "OPENED_FOR_BLIND_HUMAN_REFERENCE",
    purpose: "BLIND_HUMAN_REFERENCE_BEFORE_V1_V2_SCORING",
    reviewId,
    openedAt: new Date().toISOString(),
    reservationFile: path.relative(context.workspace, context.reservation.file).split(path.sep).join("/"),
    reservationDigestSha256: context.reservation.digest,
    cohortId: context.reference.cohortId,
    cohortDigestSha256: context.reference.cohortDigestSha256,
    cohortReferenceDigestSha256: context.referenceDigest,
    candidateId: context.config.candidateId,
    configHash: context.config.configHash,
    protocolDigestSha256: context.protocolDigest,
    freezeDigestSha256: context.reservation.payload.freezeDigestSha256,
    candidateOutputsExposed: false,
    scoringStarted: false,
    comparatorStarted: false
  };
  atomicNew(file, stablePretty(payload));
  return { file, payload, alreadyExists: false };
}

function makeSubmission(context, reviewId, families) {
  return {
    schema: SUBMISSION_SCHEMA,
    version: 1,
    reviewId,
    protocolDigestSha256: context.protocolDigest,
    protocolFrozenOn: context.protocol.frozenOn,
    sourceCollectionId: context.manifest.sourceCollectionId || context.protocol.scope.sourceCollection,
    split: context.reference.plannedSplit,
    cohortId: context.reference.cohortId,
    cohortDigestSha256: context.reference.cohortDigestSha256,
    cohortReferenceDigestSha256: context.referenceDigest,
    reservationDigestSha256: context.reservation.digest,
    candidateId: context.config.candidateId,
    configHash: context.config.configHash,
    freezeDigestSha256: context.reservation.payload.freezeDigestSha256,
    generatedAt: new Date().toISOString(),
    blindCollection: true,
    candidateOutputsExposed: false,
    scoringOutputsExposed: false,
    families
  };
}

function renderBlindHtml(submission, protocol) {
  let html = base.renderHtml(submission, protocol);

  if (!html.includes("Solo development. Nessun output V1/V2 mostrato.")) {
    throw new Error("Blind UI source marker missing: development subtitle");
  }
  if (!html.includes("HOLDOUT BLOCCATO")) {
    throw new Error("Blind UI source marker missing: holdout badge");
  }
  html = html.replace(
    "Solo development. Nessun output V1/V2 mostrato.",
    "Human Reference holdout cieca. Nessun output V1/V2 o comparator mostrato."
  );
  html = html.replace("HOLDOUT BLOCCATO", "HOLDOUT · HUMAN REFERENCE");

  // Replace the whole list-rendering function instead of depending on the exact
  // quote escaping emitted by the development HTML template. The previous
  // implementation matched a fragile substring and failed across equivalent
  // escaped/unescaped HTML source representations.
  const listPattern = /function renderList\(\)\{[\s\S]*?\}\s*function render\(\)\{/;
  const listMatches = html.match(new RegExp(listPattern.source, "g")) || [];
  if (listMatches.length !== 1) {
    throw new Error(`Blind UI renderList marker count mismatch: ${listMatches.length}`);
  }
  html = html.replace(
    listPattern,
    "function renderList(){var root=document.getElementById('familyList');root.innerHTML=state.families.map(function(f,i){return '<button data-i=\\\"'+i+'\\\" class=\\\"'+(i===current?'active':'')+'\\\">'+(done(f)?'✓ ':'')+esc(f.blindId)+'</button>'}).join('');root.querySelectorAll('button').forEach(function(b){b.onclick=function(){stopReviewTimer();current=Number(b.dataset.i);render()}})}\nfunction render(){"
  );

  // Replace only the editor heading assignment. All paths and internal source ids
  // remain untouched so audio/waveform loading keeps the existing implementation.
  const headingPattern = /var h='<h2>'[^\n;]*;/;
  const headingMatches = html.match(new RegExp(headingPattern.source, "g")) || [];
  if (headingMatches.length !== 1) {
    throw new Error(`Blind UI heading marker count mismatch: ${headingMatches.length}`);
  }
  html = html.replace(
    headingPattern,
    "var h='<h2>'+esc(f.blindId)+'</h2><div class=\\\"muted\\\">durata decoded '+f.decodedDurationSeconds+'s · identità sorgente nascosta durante la review</div>';"
  );

  if (!html.includes("esc(f.blindId)")) {
    throw new Error("Blind UI did not bind visible family labels to blindId");
  }
  return html;
}

function strictIncreasingNumbers(values, label) {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
  const out = values.map(Number);
  if (out.some(v => !Number.isFinite(v))) throw new Error(`${label} contains non-numeric values`);
  for (let i = 1; i < out.length; i++) {
    if (out[i] <= out[i - 1]) throw new Error(`${label} must be strictly increasing`);
  }
  return out;
}

function nearly(a, b, epsilon = 1e-4) {
  return Math.abs(Number(a) - Number(b)) <= epsilon;
}

function validateSubmission(context, submission, durationsById) {
  if (
    !submission ||
    submission.schema !== SUBMISSION_SCHEMA ||
    submission.version !== 1 ||
    submission.reviewId !== assertReviewId(submission.reviewId) ||
    submission.protocolDigestSha256 !== context.protocolDigest ||
    submission.split !== context.reference.plannedSplit ||
    submission.cohortId !== context.reference.cohortId ||
    submission.cohortDigestSha256 !== context.reference.cohortDigestSha256 ||
    submission.cohortReferenceDigestSha256 !== context.referenceDigest ||
    submission.reservationDigestSha256 !== context.reservation.digest ||
    submission.candidateId !== context.config.candidateId ||
    submission.configHash !== context.config.configHash ||
    submission.freezeDigestSha256 !== context.reservation.payload.freezeDigestSha256 ||
    submission.blindCollection !== true ||
    submission.candidateOutputsExposed !== false ||
    submission.scoringOutputsExposed !== false ||
    !Array.isArray(submission.families)
  ) {
    throw new Error("Human Reference submission is not bound to the exact blind R1 v2 reservation");
  }

  const expectedByRecord = new Map(context.records.map(r => [r.sourceRecordId, r]));
  const actualIds = submission.families.map(f => f.sourceRecordId);
  if (
    actualIds.length !== 10 ||
    new Set(actualIds).size !== 10 ||
    actualIds.some(id => !expectedByRecord.has(id))
  ) {
    throw new Error("Submission family set differs from the frozen 10-family holdout");
  }

  const blindIds = submission.families.map(f => f.blindId);
  if (
    new Set(blindIds).size !== blindIds.length ||
    submission.families.some(f => f.blindId !== blindId(context.reservation.digest, expectedByRecord.get(f.sourceRecordId)))
  ) {
    throw new Error("Blind ids differ from deterministic reservation-bound ids");
  }

  const allowedMeter = new Set(context.protocol.references.meter.allowedValues);
  const familyResults = [];

  for (const family of submission.families) {
    const record = expectedByRecord.get(family.sourceRecordId);
    const expectedIdentity = identity(record);
    const actualIdentity = {
      compositionFamilyId: family.compositionFamilyId,
      sourceRecordId: family.sourceRecordId,
      sourceAssetId: family.sourceAssetId,
      sha256: family.sourceSha256
    };
    if (!sameIdentities([expectedIdentity], [actualIdentity])) {
      throw new Error(`Family identity mismatch: ${family.blindId}`);
    }

    const duration = Number(durationsById.get(record.sourceRecordId));
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(`Missing decoded duration: ${family.blindId}`);
    }
    if (!nearly(family.decodedDurationSeconds, duration, 0.001)) {
      throw new Error(`Decoded duration mismatch: ${family.blindId}`);
    }

    const expectedWindows = base.computeReferenceWindows(duration, context.protocol);
    const windows = family.beatReference?.windows;
    if (!Array.isArray(windows) || windows.length !== expectedWindows.length) {
      throw new Error(`Beat window count mismatch: ${family.blindId}`);
    }

    let windowsReady = true;
    windows.forEach((window, index) => {
      const expected = expectedWindows[index];
      if (
        window.position !== expected.position ||
        !nearly(window.startSeconds, expected.startSeconds) ||
        !nearly(window.durationSeconds, expected.durationSeconds)
      ) {
        throw new Error(`Beat window definition changed: ${family.blindId}:${expected.position}`);
      }
      const beats = strictIncreasingNumbers(
        window.beatTimesSeconds,
        `beatTimesSeconds ${family.blindId}:${expected.position}`
      );
      if (beats.some(v => v < 0 || v > expected.durationSeconds + 1e-4)) {
        throw new Error(`Beat time outside review window: ${family.blindId}:${expected.position}`);
      }
      if (!Array.isArray(window.rawTapTimesSeconds) || !Array.isArray(window.quantizationHistory)) {
        throw new Error(`Missing tap/quantization provenance: ${family.blindId}:${expected.position}`);
      }

      const coverage = window.coverage;
      const notes = typeof window.coverageNotes === "string" ? window.coverageNotes.trim() : "";
      const bpm = Number(family.beatReference?.referenceBpm);
      const sparse = Number.isFinite(bpm) && bpm > 0
        ? beats.length < expected.durationSeconds * bpm / 60 * 0.5
        : true;
      const complete = coverage === "COMPLETE" && beats.length >= 2 && (!sparse || notes.length >= 10);
      const noBeat = coverage === "NO_BEAT" && beats.length === 0 && notes.length >= 10;
      if (window.reviewed !== true || (!complete && !noBeat)) windowsReady = false;
    });

    const bpm = Number(family.beatReference?.referenceBpm);
    const beatReady =
      family.beatReference?.reviewed === true &&
      family.beatReference?.metricLevel === "PRIMARY_MUSICAL_BEAT" &&
      Number.isFinite(bpm) &&
      bpm > 20 &&
      bpm < 400 &&
      windowsReady;

    if (
      !family.meter ||
      !allowedMeter.has(family.meter.value) ||
      family.meter.reviewed !== true
    ) {
      throw new Error(`Incomplete meter verdict: ${family.blindId}`);
    }

    const boundaries = strictIncreasingNumbers(
      family.sections?.boundariesSeconds,
      `section boundaries ${family.blindId}`
    );
    if (boundaries.some(v => v <= 0 || v >= duration)) {
      throw new Error(`Section boundary must be internal: ${family.blindId}`);
    }

    const cost = Number(family.reviewCostSeconds);
    const complete =
      beatReady &&
      family.sections?.reviewed === true &&
      Number.isFinite(cost) &&
      cost > 0;

    familyResults.push({
      blindId: family.blindId,
      reviewComplete: complete,
      beatMetricUsable: beatReady,
      sectionBoundaryCount: boundaries.length,
      reviewCostSeconds: Number.isFinite(cost) && cost > 0 ? cost : null
    });
  }

  return {
    reviewId: submission.reviewId,
    expectedFamilies: 10,
    reviewCompleteFamilies: familyResults.filter(x => x.reviewComplete).length,
    beatMetricUsableFamilies: familyResults.filter(x => x.beatMetricUsable).length,
    finalizationReady: familyResults.every(x => x.reviewComplete && x.beatMetricUsable),
    families: familyResults
  };
}

function measureAndVerify(context) {
  const durations = new Map();
  const ordered = orderedRecords(context);
  ordered.forEach((record, index) => {
    const source = path.resolve(context.workspace, record.localPath);
    process.stderr.write(
      `[${index + 1}/${ordered.length}] holdout Human Reference verify/decode ${blindId(context.reservation.digest, record)}\n`
    );
    const actual = sha256FileSync(source);
    if (actual !== record.sha256) {
      throw new Error(`Source SHA256 mismatch: ${blindId(context.reservation.digest, record)}`);
    }
    durations.set(record.sourceRecordId, decodedDurationSeconds(source));
  });
  return durations;
}

function preflightResult(context) {
  return {
    mode: "BLIND_HOLDOUT_HUMAN_REFERENCE_PREFLIGHT_PASS",
    reviewIdDefault: DEFAULT_REVIEW_ID,
    cohortId: context.reference.cohortId,
    cohortDigestSha256: context.reference.cohortDigestSha256,
    cohortReferenceDigestSha256: context.referenceDigest,
    reservationPath: context.reservation.file,
    reservationDigestSha256: context.reservation.digest,
    candidateId: context.config.candidateId,
    configHash: context.config.configHash,
    protocolDigestSha256: context.protocolDigest,
    holdoutFamilies: context.records.length,
    audioAccessPerformedByThisCommand: false,
    holdoutObservedByThisCommand: false,
    scoringStarted: false,
    comparatorStarted: false,
    nextAction: "PREPARE_BLIND_HUMAN_REFERENCE"
  };
}

function packRoot(context) {
  return path.join(context.workspace, "runs", "human-reference-holdout-r1-v2");
}

function prepare(workspaceRoot, reviewId) {
  assertReviewId(reviewId);
  const context = currentContext(workspaceRoot);
  const root = packRoot(context);
  const packDir = path.join(root, reviewId);
  if (fs.existsSync(packDir)) {
    return {
      mode: "ALREADY_PREPARED",
      reviewId,
      packDir,
      indexHtml: path.join(packDir, "index.html"),
      holdoutObserved: true
    };
  }

  // Check versioned tooling before crossing the audio-observation boundary.
  assertReviewToolCommittedClean();
  ffmpegExecutable();
  fs.mkdirSync(root, { recursive: true });

  // This immutable receipt is written immediately before the first source byte is read.
  const access = ensureAccessReceipt(context, reviewId);

  const temp = path.join(root, `.${reviewId}.${crypto.randomUUID()}.preparing`);
  fs.mkdirSync(temp, { recursive: false });
  try {
    const durations = measureAndVerify(context);
    const families = [];

    for (const record of orderedRecords(context)) {
      const duration = durations.get(record.sourceRecordId);
      const windows = base.computeReferenceWindows(duration, context.protocol);
      const family = base.makeFamilyTemplate(record, duration, windows, temp);
      family.blindId = blindId(context.reservation.digest, record);
      families.push(family);

      const source = path.resolve(context.workspace, record.localPath);
      for (const window of windows) {
        const waveformOutput = path.join(
          temp,
          "waveforms",
          record.sourceRecordId,
          `${window.position.toLowerCase()}.svg`
        );
        if (window.position === "FULL_TRACK") {
          extractWaveformSvg(source, waveformOutput);
        } else {
          const clip = path.join(
            temp,
            "clips",
            record.sourceRecordId,
            `${window.position.toLowerCase()}.wav`
          );
          extractClip(source, clip, window.startSeconds, window.durationSeconds);
          extractWaveformSvg(clip, waveformOutput);
        }
      }
    }

    const submission = makeSubmission(context, reviewId, families);
    atomicNew(path.join(temp, "submission-template.json"), stablePretty(submission));
    atomicNew(path.join(temp, "index.html"), renderBlindHtml(submission, context.protocol));
    atomicNew(path.join(temp, "PACK_INFO.txt"), [
      "FAME Neural — Blind Holdout Human Reference R1 v2",
      "",
      `reviewId: ${reviewId}`,
      `cohortId: ${context.reference.cohortId}`,
      `cohortDigestSha256: ${context.reference.cohortDigestSha256}`,
      `reservationDigestSha256: ${context.reservation.digest}`,
      `families: ${families.length}`,
      `candidateId: ${context.config.candidateId}`,
      "candidateOutputsExposed: false",
      "scoringOutputsExposed: false",
      "holdoutObserved: true",
      "",
      "Apri index.html e completa la Human Reference senza eseguire V1/V2.",
      "Esporta il JSON dalla UI.",
      `Poi: node human-reference-holdout-pack.js check "${context.workspace}" <submission.json>`,
      `Infine: node human-reference-holdout-pack.js finalize "${context.workspace}" <submission.json>`,
      ""
    ].join("\n"));

    fs.renameSync(temp, packDir);
    return {
      mode: "BLIND_HOLDOUT_HUMAN_REFERENCE_PREPARED",
      reviewId,
      packDir,
      indexHtml: path.join(packDir, "index.html"),
      accessReceipt: access.file,
      reservationDigestSha256: context.reservation.digest,
      cohortDigestSha256: context.reference.cohortDigestSha256,
      families: families.length,
      candidateOutputsExposed: false,
      scoringStarted: false,
      comparatorStarted: false,
      holdoutObserved: true
    };
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }
}

function durationsForSubmission(context, submission) {
  // After the immutable access receipt exists, re-verification is permitted for the
  // same review and same reservation. No scoring is performed here.
  const receipt = accessReceiptPath(context);
  if (!fs.existsSync(receipt)) {
    throw new Error("Holdout access receipt missing; prepare must run before check/finalize");
  }
  const access = readJson(receipt);
  if (
    access.reviewId !== submission.reviewId ||
    access.reservationDigestSha256 !== context.reservation.digest
  ) {
    throw new Error("Holdout access receipt does not match this submission");
  }
  return measureAndVerify(context);
}

function check(workspaceRoot, submissionFile) {
  const context = currentContext(workspaceRoot);
  const submission = readJson(path.resolve(submissionFile));
  const durations = durationsForSubmission(context, submission);
  return validateSubmission(context, submission, durations);
}

function finalize(workspaceRoot, submissionFile) {
  const context = currentContext(workspaceRoot);
  const submission = readJson(path.resolve(submissionFile));
  const durations = durationsForSubmission(context, submission);
  const validation = validateSubmission(context, submission, durations);
  if (!validation.finalizationReady) {
    throw new Error(
      `Human Reference is not finalization-ready: ` +
      `${validation.reviewCompleteFamilies}/${validation.expectedFamilies} reviewed, ` +
      `${validation.beatMetricUsableFamilies}/${validation.expectedFamilies} beat-metric usable`
    );
  }

  const canonicalSubmission = stablePretty(submission);
  const submissionDigest = sha256Text(canonicalSubmission);
  const root = path.join(
    context.workspace,
    "references",
    "audio-analysis-v2",
    context.reference.plannedSplit
  );
  const snapshotPath = path.join(root, `${submission.reviewId}.json`);
  const indexPath = path.join(root, "index.json");

  if (fs.existsSync(snapshotPath)) {
    const prior = readJson(snapshotPath);
    if (
      prior.submissionDigestSha256 !== submissionDigest ||
      prior.reservationDigestSha256 !== context.reservation.digest
    ) {
      throw new Error(`reviewId already finalized with different content: ${submission.reviewId}`);
    }
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Finalized snapshot exists but index is missing: ${indexPath}`);
    }
    const existingIndex = readJson(indexPath);
    const matchingEntries = Array.isArray(existingIndex.entries)
      ? existingIndex.entries.filter(entry => entry.reviewId === submission.reviewId)
      : [];
    if (
      existingIndex.schema !== INDEX_SCHEMA ||
      existingIndex.version !== 1 ||
      existingIndex.split !== context.reference.plannedSplit ||
      existingIndex.cohortId !== context.reference.cohortId ||
      matchingEntries.length !== 1 ||
      matchingEntries[0].submissionDigestSha256 !== submissionDigest ||
      matchingEntries[0].reservationDigestSha256 !== context.reservation.digest ||
      matchingEntries[0].file !== path.basename(snapshotPath)
    ) {
      throw new Error("Finalized snapshot/index integrity mismatch");
    }
    return {
      mode: "ALREADY_FINALIZED",
      reviewId: submission.reviewId,
      snapshotPath,
      submissionDigestSha256: submissionDigest,
      reservationDigestSha256: context.reservation.digest,
      validation
    };
  }

  const snapshot = {
    schema: SNAPSHOT_SCHEMA,
    version: 1,
    reviewId: submission.reviewId,
    finalizedAt: new Date().toISOString(),
    protocolDigestSha256: context.protocolDigest,
    submissionDigestSha256: submissionDigest,
    split: context.reference.plannedSplit,
    cohortId: context.reference.cohortId,
    cohortDigestSha256: context.reference.cohortDigestSha256,
    cohortReferenceDigestSha256: context.referenceDigest,
    reservationDigestSha256: context.reservation.digest,
    candidateId: context.config.candidateId,
    configHash: context.config.configHash,
    freezeDigestSha256: context.reservation.payload.freezeDigestSha256,
    blindCollection: true,
    candidateOutputsExposed: false,
    scoringOutputsExposed: false,
    submission
  };

  let index = fs.existsSync(indexPath)
    ? readJson(indexPath)
    : {
        schema: INDEX_SCHEMA,
        version: 1,
        split: context.reference.plannedSplit,
        cohortId: context.reference.cohortId,
        entries: []
      };

  if (
    index.schema !== INDEX_SCHEMA ||
    index.version !== 1 ||
    index.split !== context.reference.plannedSplit ||
    index.cohortId !== context.reference.cohortId ||
    !Array.isArray(index.entries)
  ) {
    throw new Error("Unsupported holdout Human Reference index schema");
  }
  if (index.entries.some(entry => entry.reviewId === submission.reviewId)) {
    throw new Error(`Index already contains reviewId: ${submission.reviewId}`);
  }

  atomicNew(snapshotPath, stablePretty(snapshot));
  index.entries.push({
    reviewId: submission.reviewId,
    finalizedAt: snapshot.finalizedAt,
    protocolDigestSha256: context.protocolDigest,
    submissionDigestSha256: submissionDigest,
    reservationDigestSha256: context.reservation.digest,
    cohortDigestSha256: context.reference.cohortDigestSha256,
    file: path.basename(snapshotPath)
  });
  atomicReplace(indexPath, stablePretty(index));

  return {
    mode: "BLIND_HOLDOUT_HUMAN_REFERENCE_FINALIZED",
    reviewId: submission.reviewId,
    snapshotPath,
    submissionDigestSha256: submissionDigest,
    reservationDigestSha256: context.reservation.digest,
    cohortDigestSha256: context.reference.cohortDigestSha256,
    validation,
    nextAction: "ONLY_NOW_RUN_V1_AND_FROZEN_V2_ON_THE_SAME_RESERVED_COHORT"
  };
}

function usage() {
  return [
    "Usage:",
    "  node human-reference-holdout-pack.js preflight <workspace-folder>",
    "  node human-reference-holdout-pack.js prepare <workspace-folder> [review-id]",
    "  node human-reference-holdout-pack.js check <workspace-folder> <submission.json>",
    "  node human-reference-holdout-pack.js finalize <workspace-folder> <submission.json>",
    "",
    "preflight: metadata-only, no audio access.",
    "prepare: first intentional holdout access; creates only the blind Human Reference pack.",
    "No command in this tool runs V1, V2, scoring or comparator."
  ].join("\n");
}

async function main(args = process.argv.slice(2)) {
  const command = args[0];
  if (!["preflight", "prepare", "check", "finalize"].includes(command)) {
    throw new Error(usage());
  }

  let result;
  if (command === "preflight") {
    if (args.length !== 2) throw new Error(usage());
    result = preflightResult(currentContext(args[1]));
  } else if (command === "prepare") {
    if (args.length < 2 || args.length > 3) throw new Error(usage());
    result = prepare(args[1], args[2] || DEFAULT_REVIEW_ID);
  } else {
    if (args.length !== 3) throw new Error(usage());
    result = command === "check"
      ? check(args[1], args[2])
      : finalize(args[1], args[2]);
  }
  process.stdout.write(stablePretty(result));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  canonicalJson,
  cohortDigest,
  sortedIdentities,
  blindId,
  validateProtocol,
  validateReference,
  validateManifest,
  findReservation,
  renderBlindHtml,
  validateSubmission,
  preflightResult,
  currentContext,
  DEFAULT_REVIEW_ID
};
