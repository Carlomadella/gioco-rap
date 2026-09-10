"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");

const MANIFEST_SCHEMA = "fame-owned-beats-workspace-v1";
const PROTOCOL_SCHEMA = "fame-owned-beats-audio-analysis-v2-evaluation-protocol";
const SUBMISSION_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-v1";
const SNAPSHOT_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-snapshot-v1";
const INDEX_SCHEMA = "fame-owned-beats-audio-analysis-human-reference-index-v1";
const VERSION = 1;
const DEVELOPMENT_SPLIT = "development";
const HOLDOUT_SPLIT = "evaluation-holdout";
const DEFAULT_COHORT = "owned-beats-pilot-v1";
const METRIC_LEVELS = ["PRIMARY_MUSICAL_BEAT", "AMBIGUOUS", "UNKNOWN"];
const EPSILON = 1e-4;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);
    stream.on("data", chunk => h.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(h.digest("hex")));
  });
}

function atomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, content, { flag: "wx" });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function assertSafeReviewId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/.test(value)) {
    throw new Error("review-id must match [A-Za-z0-9][A-Za-z0-9._-]{2,63}");
  }
  return value;
}

function protocolPath() {
  return path.join(__dirname, "audio-analysis-v2-protocol.json");
}

function loadProtocol() {
  const file = protocolPath();
  const raw = fs.readFileSync(file, "utf8");
  const protocol = JSON.parse(raw);
  validateProtocol(protocol);
  return { protocol, raw, digest: sha256Text(raw), file };
}

function validateProtocol(p) {
  if (
    !p || p.schema !== PROTOCOL_SCHEMA || p.version !== 1 ||
    p.status !== "FROZEN_PRE_TUNING" ||
    p.scope?.stage !== "AUDIO_ANALYSIS_ONLY" ||
    p.scope?.trainingAuthorized !== false ||
    p.scope?.sourceSeparationAuthorized !== false ||
    p.scope?.audioToMidiAuthorized !== false ||
    p.splits?.development?.name !== DEVELOPMENT_SPLIT ||
    p.splits?.evaluationHoldout?.name !== HOLDOUT_SPLIT ||
    p.splits?.evaluationHoldout?.allowedDuringTuning !== false ||
    p.tuning?.holdoutObservationForbidden !== true
  ) {
    throw new Error("Human reference tool requires frozen pre-tuning protocol with holdout locked");
  }
  return p;
}

function validateManifest(m) {
  if (!m || m.schema !== MANIFEST_SCHEMA || m.version !== 1 || !Array.isArray(m.records)) {
    throw new Error("Unsupported owned-beats manifest");
  }
  const familySplits = new Map();
  for (const r of m.records) {
    if (!r.sourceRecordId || !r.localPath || !r.sha256) throw new Error("Invalid manifest record");
    if (r.compositionFamilyId && r.split) {
      const old = familySplits.get(r.compositionFamilyId);
      if (old && old !== r.split) {
        throw new Error(`Composition family crosses splits: ${r.compositionFamilyId}`);
      }
      familySplits.set(r.compositionFamilyId, r.split);
    }
  }
  return m;
}

function selectDevelopmentRecords(manifest, protocol, cohortId = DEFAULT_COHORT) {
  validateManifest(manifest);
  validateProtocol(protocol);
  const activeCohort = manifest.records.filter(r =>
    r.presentInScan !== false && (r.pilotCohorts || []).includes(cohortId)
  );
  if (!activeCohort.length) throw new Error(`No active records in cohort: ${cohortId}`);

  const offenders = activeCohort.filter(r => r.split !== DEVELOPMENT_SPLIT);
  if (offenders.length) {
    throw new Error(
      "Holdout/non-development record exposed by human-reference cohort: " +
      offenders.map(r => `${r.sourceRecordId}:${r.split || "NO_SPLIT"}`).sort().join(", ")
    );
  }

  const selected = activeCohort.slice().sort((a, b) =>
    String(a.compositionFamilyId).localeCompare(String(b.compositionFamilyId)) ||
    a.sourceRecordId.localeCompare(b.sourceRecordId)
  );

  const families = new Map();
  for (const r of selected) {
    if (!r.compositionFamilyId) throw new Error(`Missing compositionFamilyId: ${r.sourceRecordId}`);
    const list = families.get(r.compositionFamilyId) || [];
    list.push(r);
    families.set(r.compositionFamilyId, list);
  }

  const expected = protocol.splits.development.expectedFamilies;
  if (families.size !== expected) {
    throw new Error(`Development family count mismatch: ${families.size}, expected ${expected}`);
  }
  for (const [familyId, records] of families) {
    if (records.length !== 1) {
      throw new Error(`Human-reference pilot requires exactly one source record per family: ${familyId}`);
    }
  }
  return selected;
}

function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

function computeReferenceWindows(decodedDurationSeconds, protocol) {
  const cfg = validateProtocol(protocol).references.beatGrid;
  const duration = Number(decodedDurationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid decoded duration");

  if (duration < cfg.minimumDurationForThreeNonOverlappingWindowsSeconds) {
    return [{
      position: "FULL_TRACK",
      startSeconds: 0,
      durationSeconds: round6(duration),
      coverageMode: cfg.shortTrackFallback
    }];
  }

  const w = cfg.windowSeconds;
  const edge = cfg.edgeMarginSeconds;
  const starts = [
    edge,
    (duration - w) / 2,
    duration - edge - w
  ];
  return cfg.positions.map((position, index) => ({
    position,
    startSeconds: round6(starts[index]),
    durationSeconds: round6(w),
    coverageMode: cfg.coverage
  }));
}

function ffmpegExecutable() {
  const candidate = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const probe = spawnSync(candidate, ["-version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) throw new Error("ffmpeg not found in PATH");
  return candidate;
}

function decodedDurationSeconds(file, sampleRate = 22050) {
  const ffmpeg = ffmpegExecutable();
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, [
      "-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(sampleRate),
      "-f", "f32le", "pipe:1"
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let bytes = 0;
    let stderr = "";
    child.stdout.on("data", chunk => { bytes += chunk.length; });
    child.stderr.on("data", chunk => { stderr += chunk.toString("utf8"); });
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0) return reject(new Error(stderr.trim() || "ffmpeg decode failed"));
      if (!bytes || bytes % 4 !== 0) return reject(new Error("Invalid decoded PCM length"));
      resolve(round6((bytes / 4) / sampleRate));
    });
  });
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

function waveformSvgFromPcm(pcm, width = 1200, height = 120) {
  if (!Buffer.isBuffer(pcm) || pcm.length < 2 || pcm.length % 2 !== 0) {
    throw new Error("Invalid s16le PCM for waveform");
  }
  const sampleCount = pcm.length / 2;
  const columns = Math.max(1, Math.min(Math.floor(width), sampleCount));
  const h = Math.max(24, Math.floor(height));
  const mid = h / 2;
  const usable = Math.max(1, mid - 3);
  const lines = [];
  for (let x = 0; x < columns; x++) {
    const start = Math.floor((x * sampleCount) / columns);
    const end = Math.max(start + 1, Math.floor(((x + 1) * sampleCount) / columns));
    let peak = 0;
    for (let i = start; i < end; i++) {
      const value = Math.abs(pcm.readInt16LE(i * 2));
      if (value > peak) peak = value;
    }
    const amp = Math.max(1, (peak / 32768) * usable);
    const px = ((x + 0.5) * width) / columns;
    lines.push('<line x1="' + px.toFixed(3) + '" y1="' + (mid - amp).toFixed(3) +
      '" x2="' + px.toFixed(3) + '" y2="' + (mid + amp).toFixed(3) + '"/>');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + h +
    '" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#111115"/>' +
    '<line x1="0" y1="' + mid + '" x2="' + width + '" y2="' + mid +
    '" stroke="#3a3a43" stroke-width="1"/><g stroke="#a9a9b4" stroke-width="1">' +
    lines.join("") + '</g></svg>';
}

function extractWaveformSvg(source, output, sampleRate = 22050) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const ffmpeg = ffmpegExecutable();
  const result = spawnSync(ffmpeg, [
    "-v", "error", "-i", source, "-vn", "-ac", "1", "-ar", String(sampleRate),
    "-f", "s16le", "pipe:1"
  ], { encoding: null, maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString("utf8").trim() : "";
    throw new Error(stderr || ("Waveform decode failed: " + source));
  }
  atomic(output, waveformSvgFromPcm(result.stdout));
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function makeFamilyTemplate(record, decodedDuration, windows, packDir) {
  const source = path.resolve(packDir, "../../../", record.localPath);
  const fullTrackPath = slash(path.relative(packDir, source));
  const beatWindows = windows.map(window => {
    const isFull = window.position === "FULL_TRACK";
    const audioPath = isFull
      ? fullTrackPath
      : `clips/${record.sourceRecordId}/${window.position.toLowerCase()}.wav`;
    return {
      position: window.position,
      startSeconds: window.startSeconds,
      durationSeconds: window.durationSeconds,
      audioPath,
      beatTimesSeconds: [],
      reviewed: false
    };
  });

  return {
    sourceRecordId: record.sourceRecordId,
    sourceAssetId: record.sourceAssetId || `sha256:${record.sha256}`,
    compositionFamilyId: record.compositionFamilyId,
    sourceSha256: record.sha256,
    decodedDurationSeconds: decodedDuration,
    fullTrackPath,
    beatReference: {
      metricLevel: "UNKNOWN",
      referenceBpm: null,
      reviewed: false,
      windows: beatWindows
    },
    meter: { value: "UNKNOWN", reviewed: false },
    sections: { boundariesSeconds: [], reviewed: false },
    reviewCostSeconds: null,
    notes: ""
  };
}

function makeSubmission(reviewId, protocolInfo, manifest, familyTemplates, cohortId) {
  return {
    schema: SUBMISSION_SCHEMA,
    version: VERSION,
    reviewId,
    protocolDigestSha256: protocolInfo.digest,
    protocolFrozenOn: protocolInfo.protocol.frozenOn,
    sourceCollectionId: manifest.sourceCollectionId || protocolInfo.protocol.scope.sourceCollection,
    split: DEVELOPMENT_SPLIT,
    cohortId,
    generatedAt: new Date().toISOString(),
    candidateOutputsExposed: false,
    families: familyTemplates
  };
}

function numberArray(values, label) {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
  const out = values.map(Number);
  if (out.some(v => !Number.isFinite(v))) throw new Error(`${label} contains non-numeric values`);
  for (let i = 1; i < out.length; i++) {
    if (out[i] <= out[i - 1]) throw new Error(`${label} must be strictly increasing`);
  }
  return out;
}

function nearly(a, b, epsilon = EPSILON) {
  return Math.abs(Number(a) - Number(b)) <= epsilon;
}

function validateSubmissionCore(submission, manifest, protocolInfo, expectedRecords, durationsById) {
  if (!submission || submission.schema !== SUBMISSION_SCHEMA || submission.version !== VERSION) {
    throw new Error("Unsupported human-reference submission schema");
  }
  assertSafeReviewId(submission.reviewId);
  if (submission.protocolDigestSha256 !== protocolInfo.digest) throw new Error("Protocol digest mismatch");
  if (submission.split !== DEVELOPMENT_SPLIT) throw new Error("Human reference submission must be development-only");
  if (submission.candidateOutputsExposed !== false) throw new Error("Candidate outputs must remain hidden from human reference collection");
  if (!Array.isArray(submission.families)) throw new Error("families must be an array");

  const expectedById = new Map(expectedRecords.map(r => [r.sourceRecordId, r]));
  const actualIds = submission.families.map(f => f.sourceRecordId);
  if (new Set(actualIds).size !== actualIds.length) throw new Error("Duplicate sourceRecordId in submission");
  if (actualIds.length !== expectedById.size || actualIds.some(id => !expectedById.has(id))) {
    throw new Error("Submission family set differs from frozen development cohort");
  }

  const allowedMeter = new Set(protocolInfo.protocol.references.meter.allowedValues);
  const familyResults = [];

  for (const family of submission.families) {
    const record = expectedById.get(family.sourceRecordId);
    if (record.split === HOLDOUT_SPLIT) throw new Error("Holdout record present in human reference submission");
    if (family.compositionFamilyId !== record.compositionFamilyId) throw new Error(`Family identity mismatch: ${record.sourceRecordId}`);
    if (family.sourceSha256 !== record.sha256) throw new Error(`Source SHA mismatch in submission: ${record.sourceRecordId}`);

    const duration = Number(durationsById.get(record.sourceRecordId));
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Missing decoded duration: ${record.sourceRecordId}`);
    if (!nearly(family.decodedDurationSeconds, duration, 0.001)) throw new Error(`Decoded duration mismatch: ${record.sourceRecordId}`);

    const expectedWindows = computeReferenceWindows(duration, protocolInfo.protocol);
    const windows = family.beatReference?.windows;
    if (!Array.isArray(windows) || windows.length !== expectedWindows.length) {
      throw new Error(`Beat window count mismatch: ${record.sourceRecordId}`);
    }
    let windowsReviewed = true;
    let windowsUsable = true;
    windows.forEach((window, index) => {
      const expected = expectedWindows[index];
      if (
        window.position !== expected.position ||
        !nearly(window.startSeconds, expected.startSeconds) ||
        !nearly(window.durationSeconds, expected.durationSeconds)
      ) throw new Error(`Beat window definition changed: ${record.sourceRecordId}:${expected.position}`);
      const beats = numberArray(window.beatTimesSeconds, `beatTimesSeconds ${record.sourceRecordId}:${expected.position}`);
      if (beats.some(v => v < 0 || v > expected.durationSeconds + EPSILON)) {
        throw new Error(`Beat time outside review window: ${record.sourceRecordId}:${expected.position}`);
      }
      if (window.reviewed !== true) windowsReviewed = false;
      if (beats.length < 2) windowsUsable = false;
    });

    const metricLevel = family.beatReference?.metricLevel;
    if (!METRIC_LEVELS.includes(metricLevel)) throw new Error(`Invalid metricLevel: ${record.sourceRecordId}`);
    const bpm = family.beatReference?.referenceBpm;
    const bpmUsable = Number.isFinite(Number(bpm)) && Number(bpm) > 20 && Number(bpm) < 400;
    const beatReviewed = family.beatReference?.reviewed === true && windowsReviewed;
    const beatMetricUsable = beatReviewed && windowsUsable && bpmUsable && metricLevel === "PRIMARY_MUSICAL_BEAT";

    if (!family.meter || !allowedMeter.has(family.meter.value) || typeof family.meter.reviewed !== "boolean") {
      throw new Error(`Invalid meter verdict: ${record.sourceRecordId}`);
    }

    const boundaries = numberArray(family.sections?.boundariesSeconds, `section boundaries ${record.sourceRecordId}`);
    if (boundaries.some(v => v <= 0 || v >= duration)) throw new Error(`Section boundary must be internal: ${record.sourceRecordId}`);
    if (typeof family.sections?.reviewed !== "boolean") throw new Error(`Invalid section review flag: ${record.sourceRecordId}`);

    const cost = family.reviewCostSeconds;
    const costValid = Number.isFinite(Number(cost)) && Number(cost) > 0;
    const reviewComplete = beatReviewed && family.meter.reviewed === true && family.sections.reviewed === true && costValid;
    familyResults.push({
      sourceRecordId: record.sourceRecordId,
      compositionFamilyId: record.compositionFamilyId,
      reviewComplete,
      beatMetricUsable,
      meterValue: family.meter.value,
      sectionBoundaryCount: boundaries.length,
      reviewCostSeconds: costValid ? Number(cost) : null
    });
  }

  return {
    reviewId: submission.reviewId,
    expectedFamilies: expectedById.size,
    reviewCompleteFamilies: familyResults.filter(x => x.reviewComplete).length,
    beatMetricUsableFamilies: familyResults.filter(x => x.beatMetricUsable).length,
    finalizationReady: familyResults.every(x => x.reviewComplete && x.beatMetricUsable),
    families: familyResults
  };
}

function renderHtml(submission, protocol) {
  const data = JSON.stringify(submission).replace(/</g, "\\u003c");
  const meterOptions = JSON.stringify(protocol.references.meter.allowedValues);
  const levels = JSON.stringify(METRIC_LEVELS);
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FAME Neural — Human Reference</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color-scheme:dark;background:#0d0d0f;color:#eee}*{box-sizing:border-box}body{margin:0;background:#0d0d0f;min-height:100vh}.wrap{max-width:1180px;margin:auto;padding:24px}.top,.row{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.badge{font:700 12px ui-monospace,monospace;border:1px solid #555;padding:7px 10px;border-radius:999px}.grid{display:grid;grid-template-columns:250px 1fr;gap:18px;margin-top:18px}.panel,.card{background:#151519;border:1px solid #2d2d34;border-radius:14px;padding:16px}.card{margin:12px 0;background:#111115}.families button{width:100%;text-align:left;margin:5px 0;padding:10px;border-radius:9px;border:1px solid #333;background:#1d1d22;color:#eee;cursor:pointer}.families button.active{outline:2px solid #aaa}label{display:block;font-size:12px;color:#aaa;margin:8px 0 4px}input,select,textarea,button{font:inherit}input,select,textarea{background:#0d0d10;color:#eee;border:1px solid #3a3a43;border-radius:8px;padding:9px}button.action{border:1px solid #555;background:#25252b;color:#fff;border-radius:9px;padding:9px 12px;cursor:pointer}.muted{color:#999;font-size:13px}audio{width:100%;margin:8px 0}.beats{font:12px ui-monospace,monospace;color:#bdbdc8;word-break:break-word}.wave-editor{position:relative;height:132px;margin:10px 0;border:1px solid #3a3a43;border-radius:9px;overflow:hidden;background:#111115 center/100% 100% no-repeat;cursor:crosshair}.beat-marker{position:absolute;top:0;bottom:0;width:7px;transform:translateX(-50%);border:0;border-left:2px solid #f0f0f0;background:transparent;padding:0;cursor:pointer}.beat-marker.selected{border-left-width:4px}.precision{justify-content:flex-start}.precision .action{padding:6px 9px}.selected-time{min-width:145px;font:12px ui-monospace,monospace;color:#ddd}.wave-help{font-size:12px;color:#9b9ba6;margin-top:4px}.footer{position:sticky;bottom:8px;margin-top:16px;display:flex;justify-content:flex-end}@media(max-width:800px){.grid{grid-template-columns:1fr}.families{display:flex;overflow:auto}.families button{min-width:170px}}
</style></head><body><div class="wrap">
<div class="top"><div><h1>FAME Neural — Human Reference</h1><div class="muted">Solo development. Nessun output V1/V2 mostrato.</div></div><span class="badge">HOLDOUT BLOCCATO</span></div>
<div class="grid"><aside class="panel families" id="familyList"></aside><main class="panel" id="editor"></main></div>
<div class="footer"><button class="action" id="exportBtn">Esporta JSON</button></div></div>
<script>
const STORAGE_KEY="fame-human-reference:${submission.reviewId}";
const initial=${data};
const meters=${meterOptions};
const levels=${levels};
let state=(function(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||initial}catch(e){return initial}})();
let current=0,timerStarted=null,selectedBeat=null;
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderList()}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":"&quot;"})}
function done(f){return f.beatReference.reviewed&&f.beatReference.windows.every(function(w){return w.reviewed})&&f.meter.reviewed&&f.sections.reviewed&&Number(f.reviewCostSeconds)>0}
function opts(values,value){return values.map(function(v){return '<option'+(v===value?' selected':'')+'>'+esc(v)+'</option>'}).join('')}
function waveformPath(f,w){return 'waveforms/'+f.sourceRecordId+'/'+String(w.position).toLowerCase()+'.svg'}
function selectedFor(wi){return selectedBeat&&selectedBeat.family===current&&selectedBeat.window===wi?selectedBeat:null}
function markerHtml(w,wi){var s=selectedFor(wi);return w.beatTimesSeconds.map(function(t,bi){var left=Math.max(0,Math.min(100,(Number(t)/Number(w.durationSeconds))*100));return '<button type="button" class="beat-marker'+(s&&s.index===bi?' selected':'')+'" data-w="'+wi+'" data-b="'+bi+'" style="left:'+left.toFixed(5)+'%" title="'+Number(t).toFixed(6)+' s"></button>'}).join('')}
function selectedText(wi){var s=selectedFor(wi),w=state.families[current].beatReference.windows[wi];return s&&w.beatTimesSeconds[s.index]!=null?'marker '+Number(w.beatTimesSeconds[s.index]).toFixed(6)+' s':'marker —'}

function renderList(){var root=document.getElementById('familyList');root.innerHTML=state.families.map(function(f,i){return '<button data-i="'+i+'" class="'+(i===current?'active':'')+'">'+(done(f)?'✓ ':'')+esc(f.sourceRecordId)+'<br><span class="muted">'+esc(f.compositionFamilyId)+'</span></button>'}).join('');root.querySelectorAll('button').forEach(function(b){b.onclick=function(){current=Number(b.dataset.i);render()}})}
function render(){renderList();var f=state.families[current],e=document.getElementById('editor');
var h='<h2>'+esc(f.sourceRecordId)+' — '+esc(f.compositionFamilyId)+'</h2><div class="muted">durata decoded '+f.decodedDurationSeconds+'s · SHA '+f.sourceSha256.slice(0,12)+'…</div>';
h+='<div class="card"><h3>Traccia completa / sezioni</h3><audio id="fullAudio" controls src="'+esc(f.fullTrackPath)+'"></audio><div class="row"><button class="action" id="addBoundary">Aggiungi boundary al tempo corrente</button><button class="action" id="clearBoundaries">Azzera boundary</button><label><input type="checkbox" id="sectionsReviewed" '+(f.sections.reviewed?'checked':'')+'> sezioni revisionate</label></div><div class="beats">Boundary: '+(f.sections.boundariesSeconds.join(', ')||'—')+'</div></div>';
h+='<div class="card"><h3>Beat reference</h3><div class="row"><div><label>BPM reference</label><input id="bpm" type="number" min="20" max="400" step="0.001" value="'+(f.beatReference.referenceBpm==null?'':f.beatReference.referenceBpm)+'"></div><div><label>Metric level</label><select id="metricLevel">'+opts(levels,f.beatReference.metricLevel)+'</select></div><button class="action" id="calcBpm">Calcola BPM dai marker</button><label><input type="checkbox" id="beatReviewed" '+(f.beatReference.reviewed?'checked':'')+'> beat reference revisionata</label></div><div id="windows"></div></div>';
h+='<div class="card"><h3>Meter</h3><div class="row"><select id="meter">'+opts(meters,f.meter.value)+'</select><label><input type="checkbox" id="meterReviewed" '+(f.meter.reviewed?'checked':'')+'> meter revisionato</label></div></div>';
h+='<div class="card"><h3>Costo review</h3><div class="row"><button class="action" id="timerStart">Avvia timer</button><button class="action" id="timerStop">Ferma timer</button><span>'+Number(f.reviewCostSeconds||0).toFixed(1)+' s</span></div><label>Note</label><textarea id="notes" rows="3" style="width:100%">'+esc(f.notes||'')+'</textarea></div>';e.innerHTML=h;
var wr=document.getElementById('windows');wr.innerHTML=f.beatReference.windows.map(function(w,i){return '<div class="card"><b>'+esc(w.position)+'</b> · assoluto '+w.startSeconds+'s → '+(w.startSeconds+w.durationSeconds).toFixed(3)+'s<audio controls id="wa'+i+'" src="'+esc(w.audioPath)+'"></audio><div class="wave-help">Clicca sulla waveform per aggiungere un marker. Clicca un marker per selezionarlo e correggerlo.</div><div class="wave-editor" id="wave'+i+'" data-w="'+i+'" style="background-image:url(&quot;'+esc(waveformPath(f,w))+'&quot;)">'+markerHtml(w,i)+'</div><div class="row"><button class="action tap" data-w="'+i+'">Registra beat (tap)</button><button class="action clear" data-w="'+i+'">Azzera beat</button><label><input class="wreview" data-w="'+i+'" type="checkbox" '+(w.reviewed?'checked':'')+'> finestra revisionata</label></div><div class="row precision"><span class="selected-time" id="selected'+i+'">'+selectedText(i)+'</span><button class="action nudge" data-w="'+i+'" data-step="-0.01">-10 ms</button><button class="action nudge" data-w="'+i+'" data-step="-0.001">-1 ms</button><button class="action nudge" data-w="'+i+'" data-step="0.001">+1 ms</button><button class="action nudge" data-w="'+i+'" data-step="0.01">+10 ms</button><button class="action delete-marker" data-w="'+i+'">Elimina marker</button></div><div class="beats" id="beats'+i+'">'+(w.beatTimesSeconds.join(', ')||'—')+'</div></div>'}).join('');
function bindMarkerEvents(wi){var wave=document.getElementById('wave'+wi);if(!wave)return;wave.querySelectorAll('.beat-marker').forEach(function(m){m.onclick=function(ev){ev.stopPropagation();selectedBeat={family:current,window:wi,index:Number(m.dataset.b)};refreshBeatUi(wi)}})}
function refreshBeatUi(wi){var w=f.beatReference.windows[wi],wave=document.getElementById('wave'+wi);if(wave){wave.innerHTML=markerHtml(w,wi);bindMarkerEvents(wi)}var beats=document.getElementById('beats'+wi);if(beats)beats.textContent=w.beatTimesSeconds.join(', ')||'—';var selected=document.getElementById('selected'+wi);if(selected)selected.textContent=selectedText(wi)}
function addBeatAt(wi,time){var w=f.beatReference.windows[wi],t=Number(Math.max(0,Math.min(w.durationSeconds,Number(time))).toFixed(6));if(w.beatTimesSeconds.some(function(v){return Math.abs(Number(v)-t)<0.0005}))return;w.beatTimesSeconds.push(t);w.beatTimesSeconds.sort(function(a,b){return a-b});selectedBeat={family:current,window:wi,index:w.beatTimesSeconds.indexOf(t)};save();refreshBeatUi(wi)}
function nudgeSelected(wi,delta){var s=selectedFor(wi),w=f.beatReference.windows[wi];if(!s||w.beatTimesSeconds[s.index]==null)return;var next=Number((Number(w.beatTimesSeconds[s.index])+Number(delta)).toFixed(6));if(next<0||next>w.durationSeconds)return;if(s.index>0&&next<=Number(w.beatTimesSeconds[s.index-1]))return;if(s.index<w.beatTimesSeconds.length-1&&next>=Number(w.beatTimesSeconds[s.index+1]))return;w.beatTimesSeconds[s.index]=next;save();refreshBeatUi(wi)}
function bind(id,fn){document.getElementById(id).onchange=fn}
bind('bpm',function(x){f.beatReference.referenceBpm=x.target.value===''?null:Number(x.target.value);save()});bind('metricLevel',function(x){f.beatReference.metricLevel=x.target.value;save()});bind('sectionsReviewed',function(x){f.sections.reviewed=x.target.checked;save()});bind('beatReviewed',function(x){f.beatReference.reviewed=x.target.checked;save()});bind('meter',function(x){f.meter.value=x.target.value;save()});bind('meterReviewed',function(x){f.meter.reviewed=x.target.checked;save()});bind('notes',function(x){f.notes=x.target.value;save()});
document.getElementById('addBoundary').onclick=function(){var a=document.getElementById('fullAudio'),t=Number(a.currentTime.toFixed(6));if(t>0&&t<f.decodedDurationSeconds&&!f.sections.boundariesSeconds.includes(t)){f.sections.boundariesSeconds.push(t);f.sections.boundariesSeconds.sort(function(a,b){return a-b});save();render()}};document.getElementById('clearBoundaries').onclick=function(){f.sections.boundariesSeconds=[];save();render()};
wr.querySelectorAll('.wave-editor').forEach(function(wave){wave.onclick=function(ev){if(ev.target.classList.contains('beat-marker'))return;var i=Number(wave.dataset.w),w=f.beatReference.windows[i],rect=wave.getBoundingClientRect();if(!rect.width)return;var x=Math.max(0,Math.min(rect.width,ev.clientX-rect.left));addBeatAt(i,(x/rect.width)*w.durationSeconds)}});wr.querySelectorAll('.tap').forEach(function(b){b.onclick=function(){var i=Number(b.dataset.w),a=document.getElementById('wa'+i);addBeatAt(i,a.currentTime)}});wr.querySelectorAll('.clear').forEach(function(b){b.onclick=function(){var i=Number(b.dataset.w),w=f.beatReference.windows[i];w.beatTimesSeconds=[];if(selectedFor(i))selectedBeat=null;save();refreshBeatUi(i)}});wr.querySelectorAll('.nudge').forEach(function(b){b.onclick=function(){nudgeSelected(Number(b.dataset.w),Number(b.dataset.step))}});wr.querySelectorAll('.delete-marker').forEach(function(b){b.onclick=function(){var i=Number(b.dataset.w),s=selectedFor(i),w=f.beatReference.windows[i];if(!s||w.beatTimesSeconds[s.index]==null)return;w.beatTimesSeconds.splice(s.index,1);selectedBeat=null;save();refreshBeatUi(i)}});wr.querySelectorAll('.wreview').forEach(function(x){x.onchange=function(){f.beatReference.windows[Number(x.dataset.w)].reviewed=x.checked;save()}});f.beatReference.windows.forEach(function(_,i){bindMarkerEvents(i)});
document.getElementById('calcBpm').onclick=function(){var d=[];f.beatReference.windows.forEach(function(w){for(var i=1;i<w.beatTimesSeconds.length;i++)d.push(w.beatTimesSeconds[i]-w.beatTimesSeconds[i-1])});d=d.filter(function(x){return x>0.1&&x<3}).sort(function(a,b){return a-b});if(!d.length)return;var med=d[Math.floor(d.length/2)];f.beatReference.referenceBpm=Number((60/med).toFixed(6));save();render()};
document.getElementById('timerStart').onclick=function(){if(timerStarted===null)timerStarted=performance.now()};document.getElementById('timerStop').onclick=function(){if(timerStarted!==null){f.reviewCostSeconds=Number((Number(f.reviewCostSeconds||0)+(performance.now()-timerStarted)/1000).toFixed(3));timerStarted=null;save();render()}};
}
document.getElementById('exportBtn').onclick=function(){save();var blob=new Blob([JSON.stringify(state,null,2)+'\\n'],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='human-reference-'+state.reviewId+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500)};
render();
</script></body></html>`;
}

async function withWorkspaceLock(workspace, operation, fn) {
  const lock = path.join(workspace, "bootstrap.lock");
  let fd;
  try {
    fd = fs.openSync(lock, "wx");
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), operation }));
    return await fn();
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
      fs.unlinkSync(lock);
    }
  }
}

async function currentContext(workspace) {
  const protocolInfo = loadProtocol();
  const manifestPath = path.join(workspace, "manifest", "owned-beats-manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error("Owned-beats manifest not found");
  const manifest = validateManifest(readJson(manifestPath));
  const records = selectDevelopmentRecords(manifest, protocolInfo.protocol, DEFAULT_COHORT);
  return { protocolInfo, manifest, records, manifestPath };
}

async function measureAndVerify(workspace, records) {
  const durations = new Map();
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const source = path.join(workspace, record.localPath);
    if (!fs.existsSync(source)) throw new Error(`Missing source copy: ${record.sourceRecordId}`);
    process.stderr.write(`[${i + 1}/${records.length}] verify/decode ${record.sourceRecordId}\n`);
    const actual = await sha256File(source);
    if (actual !== record.sha256) throw new Error(`Source SHA256 mismatch: ${record.sourceRecordId}`);
    durations.set(record.sourceRecordId, await decodedDurationSeconds(source));
  }
  return durations;
}

async function prepare(workspaceRoot, reviewId) {
  const workspace = path.resolve(workspaceRoot);
  assertSafeReviewId(reviewId);
  return withWorkspaceLock(workspace, "human-reference-prepare", async () => {
    const { protocolInfo, manifest, records } = await currentContext(workspace);
    const parent = path.join(workspace, "runs", "human-reference-v1");
    const packDir = path.join(parent, reviewId);
    if (fs.existsSync(packDir)) throw new Error(`Review pack already exists: ${packDir}`);
    fs.mkdirSync(parent, { recursive: true });
    const temp = path.join(parent, `.${reviewId}.${crypto.randomUUID()}.preparing`);
    fs.mkdirSync(temp, { recursive: true });
    try {
      const durations = await measureAndVerify(workspace, records);
      const templates = [];
      for (const record of records) {
        const duration = durations.get(record.sourceRecordId);
        const windows = computeReferenceWindows(duration, protocolInfo.protocol);
        const family = makeFamilyTemplate(record, duration, windows, temp);
        templates.push(family);
        const source = path.join(workspace, record.localPath);
        for (const window of windows) {
          const waveformOutput = path.join(
            temp, "waveforms", record.sourceRecordId, `${window.position.toLowerCase()}.svg`
          );
          if (window.position === "FULL_TRACK") {
            extractWaveformSvg(source, waveformOutput);
            continue;
          }
          const output = path.join(temp, "clips", record.sourceRecordId, `${window.position.toLowerCase()}.wav`);
          extractClip(source, output, window.startSeconds, window.durationSeconds);
          extractWaveformSvg(output, waveformOutput);
        }
      }
      const submission = makeSubmission(reviewId, protocolInfo, manifest, templates, DEFAULT_COHORT);
      atomic(path.join(temp, "submission-template.json"), stableJson(submission));
      atomic(path.join(temp, "index.html"), renderHtml(submission, protocolInfo.protocol));
      atomic(path.join(temp, "PACK_INFO.txt"), [
        "FAME Neural — Owned Beats Human Reference", "",
        `reviewId: ${reviewId}`, `split: ${DEVELOPMENT_SPLIT}`,
        `families: ${records.length}`, `protocolDigestSha256: ${protocolInfo.digest}`,
        "candidateOutputsExposed: false", "holdoutExposed: false", "",
        "Apri index.html, completa la review ed esporta il JSON.",
        "Poi usa: node human-reference-pack.js check <workspace> <submission.json>",
        "e infine: node human-reference-pack.js finalize <workspace> <submission.json>", ""
      ].join("\n"));
      fs.renameSync(temp, packDir);
      return { mode: "PREPARED", reviewId, packDir, families: records.length, holdoutExposed: false, candidateOutputsExposed: false };
    } catch (error) {
      fs.rmSync(temp, { recursive: true, force: true });
      throw error;
    }
  });
}

async function check(workspaceRoot, submissionFile) {
  const workspace = path.resolve(workspaceRoot);
  return withWorkspaceLock(workspace, "human-reference-check", async () => {
    const { protocolInfo, manifest, records } = await currentContext(workspace);
    const submission = readJson(path.resolve(submissionFile));
    const durations = await measureAndVerify(workspace, records);
    return validateSubmissionCore(submission, manifest, protocolInfo, records, durations);
  });
}

async function finalize(workspaceRoot, submissionFile) {
  const workspace = path.resolve(workspaceRoot);
  return withWorkspaceLock(workspace, "human-reference-finalize", async () => {
    const { protocolInfo, manifest, records } = await currentContext(workspace);
    const submission = readJson(path.resolve(submissionFile));
    const durations = await measureAndVerify(workspace, records);
    const validation = validateSubmissionCore(submission, manifest, protocolInfo, records, durations);
    if (!validation.finalizationReady) {
      throw new Error(`Human reference is not finalization-ready: ${validation.reviewCompleteFamilies}/${validation.expectedFamilies} reviewed, ${validation.beatMetricUsableFamilies}/${validation.expectedFamilies} beat-metric usable`);
    }

    const canonicalSubmission = stableJson(submission);
    const submissionDigest = sha256Text(canonicalSubmission);
    const root = path.join(workspace, "references", "audio-analysis-v2", DEVELOPMENT_SPLIT);
    const snapshotPath = path.join(root, `${submission.reviewId}.json`);
    const indexPath = path.join(root, "index.json");

    if (fs.existsSync(snapshotPath)) {
      const prior = readJson(snapshotPath);
      if (prior.submissionDigestSha256 !== submissionDigest) {
        throw new Error(`reviewId already finalized with different content: ${submission.reviewId}`);
      }
      return { mode: "ALREADY_FINALIZED", reviewId: submission.reviewId, snapshotPath, submissionDigestSha256: submissionDigest, validation };
    }

    const snapshot = {
      schema: SNAPSHOT_SCHEMA,
      version: VERSION,
      reviewId: submission.reviewId,
      finalizedAt: new Date().toISOString(),
      protocolDigestSha256: protocolInfo.digest,
      submissionDigestSha256: submissionDigest,
      split: DEVELOPMENT_SPLIT,
      submission
    };
    let index = fs.existsSync(indexPath) ? readJson(indexPath) : { schema: INDEX_SCHEMA, version: VERSION, split: DEVELOPMENT_SPLIT, entries: [] };
    if (index.schema !== INDEX_SCHEMA || index.version !== VERSION || index.split !== DEVELOPMENT_SPLIT || !Array.isArray(index.entries)) {
      throw new Error("Unsupported human-reference index schema");
    }
    if (index.entries.some(e => e.reviewId === submission.reviewId)) throw new Error(`Index already contains reviewId: ${submission.reviewId}`);

    atomic(snapshotPath, stableJson(snapshot));
    index.entries.push({
      reviewId: submission.reviewId,
      finalizedAt: snapshot.finalizedAt,
      protocolDigestSha256: protocolInfo.digest,
      submissionDigestSha256: submissionDigest,
      file: path.basename(snapshotPath)
    });
    atomic(indexPath, stableJson(index));
    return { mode: "FINALIZED", reviewId: submission.reviewId, snapshotPath, submissionDigestSha256: submissionDigest, validation };
  });
}

function usage() {
  return [
    "Usage:",
    "  node human-reference-pack.js prepare <workspace-folder> <review-id>",
    "  node human-reference-pack.js check <workspace-folder> <submission.json>",
    "  node human-reference-pack.js finalize <workspace-folder> <submission.json>",
    "",
    "prepare genera solo il pack development; evaluation-holdout resta fail-closed."
  ].join("\n");
}

async function main(args = process.argv.slice(2)) {
  if (args.length !== 3 || !["prepare", "check", "finalize"].includes(args[0])) throw new Error(usage());
  const [command, workspace, value] = args;
  const result = command === "prepare" ? await prepare(workspace, value)
    : command === "check" ? await check(workspace, value)
    : await finalize(workspace, value);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  validateProtocol,
  validateManifest,
  selectDevelopmentRecords,
  computeReferenceWindows,
  makeFamilyTemplate,
  makeSubmission,
  validateSubmissionCore,
  renderHtml,
  waveformSvgFromPcm,
  assertSafeReviewId,
  sha256Text,
  METRIC_LEVELS,
  SUBMISSION_SCHEMA
};
