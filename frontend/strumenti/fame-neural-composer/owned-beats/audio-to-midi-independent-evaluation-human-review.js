"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
function qaModule() { return require("./audio-to-midi-independent-evaluation-qa.js"); }
function rendererModule() { return require("./audio-to-midi-human-review.js"); }

const HERE = __dirname;
const REVIEW_PROTOCOL_FILE = path.join(HERE, "audio-to-midi-independent-evaluation-human-review-v1.json");
const EVALUATION_PROTOCOL_FILE = path.join(HERE, "audio-to-midi-independent-evaluation-v1.json");
const TECHNICAL_QA_FILE = path.join(HERE, "audio-to-midi-independent-evaluation-qa.js");
const RENDERER_MODULE_FILE = path.join(HERE, "audio-to-midi-human-review.js");
const DEFAULT_REVIEW_ID = "audio-to-midi-independent-evaluation-human-review-v1-001";
const RUN_ID = "audio-to-midi-independent-evaluation-v1-001";
const COHORT_ID = "audio-to-midi-independent-evaluation-v1";
const SPLIT = "audio-to-midi-evaluation-v1";
const EXPECTED_FAMILIES = 12;
const PUBLIC_PACKAGE_SCHEMA = "fame-owned-beats-audio-to-midi-independent-evaluation-human-review-package-v1";
const BLIND_KEY_SCHEMA = "fame-owned-beats-audio-to-midi-independent-evaluation-human-review-blind-key-v1";
const SUBMISSION_SCHEMA = "fame-owned-beats-audio-to-midi-independent-evaluation-human-review-submission-v1";
const REPORT_SCHEMA = "fame-owned-beats-audio-to-midi-independent-evaluation-human-review-report-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}
function stableJson(value) { return JSON.stringify(value, null, 2) + "\n"; }
function sha256File(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function gitBlobSha(file) {
  const bytes = Buffer.from(fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"), "utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob " + bytes.length + "\0", "utf8")).update(bytes).digest("hex");
}
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(middle)] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function safeId(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,99}$/.test(value)) {
    throw new Error(label + " invalid");
  }
  return value;
}
function reviewRoot(workspace, reviewId) {
  return path.join(workspace, "reviews", "audio-to-midi-independent-evaluation", safeId(reviewId, "review-id"));
}
function runRoot(workspace) {
  return path.join(workspace, "runs", "audio-to-midi-independent-evaluation-execution", RUN_ID);
}
function resultFor(workspace, sourceRecordId) {
  return readJson(path.join(runRoot(workspace), "results", sourceRecordId, "result.json"));
}
function stemPath(workspace, sourceRecordId, stem) {
  if (!["drums", "bass"].includes(stem)) throw new Error("Unsupported reference stem");
  return path.join(runRoot(workspace), "results", sourceRecordId, "stems", stem + ".wav");
}

function protocol() {
  const p = readJson(REVIEW_PROTOCOL_FILE);
  if (
    p.schema !== "fame-owned-beats-audio-to-midi-independent-evaluation-human-review-v1" ||
    p.version !== 1 ||
    p.status !== "FROZEN_BEFORE_FIRST_EVALUATION_LISTENING" ||
    p.reviewId !== DEFAULT_REVIEW_ID ||
    p.runId !== RUN_ID ||
    p.cohortId !== COHORT_ID ||
    p.split !== SPLIT ||
    p.expectedFamilies !== EXPECTED_FAMILIES ||
    p.bindings?.evaluationProtocolGitBlobSha !== gitBlobSha(EVALUATION_PROTOCOL_FILE) ||
    p.bindings?.technicalQaGitBlobSha !== gitBlobSha(TECHNICAL_QA_FILE) ||
    p.bindings?.rendererModuleGitBlobSha !== gitBlobSha(RENDERER_MODULE_FILE) ||
    p.bindings?.implementationGitBlobSha !== gitBlobSha(__filename) ||
    p.blindness?.familyIdentityExposedDuringReview !== false ||
    p.blindness?.selectedArmIdentityExposedDuringReview !== false ||
    p.blindness?.opaqueFamilyLabels !== true ||
    p.gate?.technical !== "ALL_12_FAMILIES_PASS" ||
    p.gate?.drums?.medianUsefulnessAtLeast !== 2 ||
    p.gate?.drums?.familiesAtOrAbove2AtLeast !== 9 ||
    p.gate?.lowEnd?.medianUsefulnessAtLeast !== 2 ||
    p.gate?.lowEnd?.familiesAtOrAbove2AtLeast !== 9 ||
    p.safety?.retuningAllowed !== false ||
    p.safety?.batch131Authorized !== false ||
    p.safety?.trainingAuthorized !== false ||
    p.safety?.taskDataReadyMayBeDeclared !== false
  ) {
    throw new Error("Frozen independent evaluation Human Review protocol invalid");
  }
  return p;
}

function opaqueOrder(ids, reviewId = DEFAULT_REVIEW_ID) {
  const ranked = ids.map(id => ({
    id,
    hash: crypto.createHash("sha256").update(reviewId + "|family|" + id).digest("hex")
  })).sort((a, b) => a.hash.localeCompare(b.hash));
  return ranked.map((item, index) => ({
    reviewLabel: "S" + String(index + 1).padStart(2, "0"),
    sourceRecordId: item.id
  }));
}

function prepare(workspaceRoot, reviewId = DEFAULT_REVIEW_ID) {
  reviewId = safeId(reviewId, "review-id");
  if (reviewId !== DEFAULT_REVIEW_ID) throw new Error("Only frozen reviewId is allowed");
  const workspace = path.resolve(workspaceRoot);
  const technical = qaModule().technical(workspace, RUN_ID);
  if (
    technical.mode !== "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_TECHNICAL_QA_PASS" ||
    technical.technicalGate !== "ALL_12_FAMILIES_PASS" ||
    technical.recordsVerified !== 12 ||
    technical.stemFilesVerified !== 48 ||
    technical.midiFilesVerified !== 24
  ) {
    throw new Error("Independent evaluation technical QA must pass before Human Review");
  }

  const p = protocol();
  const root = reviewRoot(workspace, reviewId);
  if (fs.existsSync(root)) throw new Error("Append-only review already exists: " + root);
  const summary = readJson(path.join(runRoot(workspace), "summary.json"));
  const ids = summary.results.map(x => x.sourceRecordId);
  if (ids.length !== EXPECTED_FAMILIES || new Set(ids).size !== EXPECTED_FAMILIES) {
    throw new Error("Unexpected evaluation family coverage");
  }

  const mapping = opaqueOrder(ids, reviewId);
  const families = mapping.map(item => ({ reviewLabel: item.reviewLabel }));
  const pkg = {
    schema: PUBLIC_PACKAGE_SCHEMA,
    version: 1,
    status: "PREPARED_AWAITING_BLIND_HUMAN_REVIEW",
    reviewId,
    runId: RUN_ID,
    cohortId: COHORT_ID,
    preparedAt: new Date().toISOString(),
    protocolDigestSha256: sha256File(REVIEW_PROTOCOL_FILE),
    technicalGate: "ALL_12_FAMILIES_PASS",
    renderer: p.renderer,
    scale: p.scale,
    drumsCriteria: p.drumsCriteria,
    lowEndCriteria: p.lowEndCriteria,
    families,
    blindness: {
      familyIdentityExposedDuringReview: false,
      selectedArmIdentityExposedDuringReview: false
    },
    safety: p.safety
  };
  const key = {
    schema: BLIND_KEY_SCHEMA,
    version: 1,
    reviewId,
    mapping: Object.fromEntries(mapping.map(item => [item.reviewLabel, item.sourceRecordId])),
    selectedArms: {
      drums: "drums-bass-kick-fusion-v1",
      lowEnd: "librosa-pyin-lowend-v1"
    }
  };

  fs.mkdirSync(path.dirname(root), { recursive: true });
  fs.mkdirSync(root, { recursive: false });
  try {
    fs.writeFileSync(path.join(root, "review-package.json"), stableJson(pkg), { flag: "wx" });
    fs.writeFileSync(path.join(root, "blind-key.json"), stableJson(key), { flag: "wx" });
  } catch (error) {
    fs.rmSync(root, { recursive: true, force: true });
    throw error;
  }

  return {
    mode: "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_HUMAN_REVIEW_PREPARED",
    reviewId,
    records: EXPECTED_FAMILIES,
    technicalGate: "ALL_12_FAMILIES_PASS",
    familyIdentityExposedToReviewer: false,
    selectedArmIdentityExposedToReviewer: false,
    evaluationSourceAudioOpenedByThisCommand: false,
    retuningPerformedByThisCommand: false,
    batch131Authorized: false,
    trainingAuthorized: false,
    taskDataReadyMayBeDeclared: false,
    nextAction: "SERVE_AND_COMPLETE_BLIND_HUMAN_REVIEW"
  };
}

function computeStats(values, gate) {
  const scores = values.map(item => item.score);
  const med = median(scores);
  const atLeast = scores.filter(score => score >= 2).length;
  return {
    medianUsefulness: med,
    familiesAtOrAbove2: atLeast,
    totalUsefulness: scores.reduce((a, b) => a + b, 0),
    pass: med >= gate.medianUsefulnessAtLeast && atLeast >= gate.familiesAtOrAbove2AtLeast
  };
}

function validateSubmission(doc, pkg) {
  if (
    doc?.schema !== SUBMISSION_SCHEMA ||
    doc.version !== 1 ||
    doc.reviewId !== pkg.reviewId ||
    doc.packageDigestSha256 !== pkg.packageDigestSha256 ||
    !Array.isArray(doc.families) ||
    doc.families.length !== EXPECTED_FAMILIES
  ) {
    throw new Error("Invalid independent evaluation Human Review submission envelope");
  }
  const labels = new Set(pkg.families.map(x => x.reviewLabel));
  const seen = new Set();
  for (const item of doc.families) {
    if (!labels.has(item.reviewLabel) || seen.has(item.reviewLabel)) throw new Error("Invalid/duplicate review label");
    seen.add(item.reviewLabel);
    for (const key of ["drums", "lowEnd"]) {
      const score = item[key]?.score;
      if (!Number.isInteger(score) || score < 0 || score > 3) throw new Error("Invalid " + key + " score");
      if (typeof item[key]?.note !== "string") throw new Error("Invalid " + key + " note");
    }
    if (item.reviewerAttested !== true) throw new Error("Reviewer attestation missing");
  }
  return doc;
}

function finalizeSubmission(doc, pkg, key, p) {
  validateSubmission(doc, pkg);
  const drums = [];
  const lowEnd = [];
  const families = [];
  for (const item of doc.families) {
    const sourceRecordId = key.mapping[item.reviewLabel];
    if (!sourceRecordId) throw new Error("Blind mapping missing");
    drums.push({ sourceRecordId, score: item.drums.score, note: item.drums.note || "" });
    lowEnd.push({ sourceRecordId, score: item.lowEnd.score, note: item.lowEnd.note || "" });
    families.push({
      reviewLabel: item.reviewLabel,
      sourceRecordId,
      drums: { armId: key.selectedArms.drums, ...item.drums },
      lowEnd: { armId: key.selectedArms.lowEnd, ...item.lowEnd },
      reviewerAttested: true
    });
  }
  const drumsStats = computeStats(drums, p.gate.drums);
  const lowEndStats = computeStats(lowEnd, p.gate.lowEnd);
  const pass = drumsStats.pass && lowEndStats.pass;
  return {
    families,
    gate: {
      technical: "ALL_12_FAMILIES_PASS",
      drums: { armId: key.selectedArms.drums, ...drumsStats },
      lowEnd: { armId: key.selectedArms.lowEnd, ...lowEndStats },
      pass,
      outcome: pass ? p.gate.outcomeIfPass : p.gate.outcomeIfFail
    }
  };
}

function html() {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FAME — Evaluation Blind Human QA</title><style>
body{margin:0;background:#0b0e12;color:#edf2f7;font-family:system-ui,Segoe UI,Arial,sans-serif}main{max-width:1000px;margin:auto;padding:24px}.panel{background:#141a22;border:1px solid #2d3744;border-radius:14px;padding:18px;margin:14px 0}.muted{color:#9aa8b6}.warn{color:#ffd27a}audio{width:100%;margin:5px 0 13px}.score{display:flex;gap:8px}.score button,button{background:#202936;border:1px solid #46566a;color:white;padding:9px 14px;border-radius:8px;cursor:pointer}.score button.sel{background:white;color:#111;font-weight:800}textarea{box-sizing:border-box;width:100%;min-height:55px;background:#0e1319;color:white;border:1px solid #354252;border-radius:8px;padding:8px}.row{display:flex;justify-content:space-between;gap:12px;align-items:center}.hidden{display:none}.progress{height:7px;background:#202733;border-radius:8px}.bar{height:100%;background:#eef2f5;width:0;border-radius:8px}hr{border:0;border-top:1px solid #2d3744;margin:20px 0}</style></head><body><main>
<h1>FAME — Evaluation Blind Human QA</h1><p class="muted">Le identità dei 12 beat e i nomi degli arm sono nascosti. Valuta la fedeltà e l'utilità del MIDI rispetto agli stem di riferimento; non valutare il timbro del renderer sintetico.</p><p class="muted">Scala: 0 inutilizzabile · 1 debole · 2 utilizzabile con correzioni moderate · 3 forte/direttamente utile.</p><div class="progress"><div id="bar" class="bar"></div></div><div id="app"></div><div id="done" class="panel hidden"><h2>Review completa</h2><button id="submit">Salva e calcola gate</button><pre id="result"></pre></div>
<script>
let PKG,idx=0,answers={};const app=document.getElementById('app');
function state(label){return answers[label]||(answers[label]={drums:{score:null,note:''},lowEnd:{score:null,note:''},reviewerAttested:false})}
function buttons(key,value){return [0,1,2,3].map(n=>'<button data-key="'+key+'" data-score="'+n+'" class="'+(value===n?'sel':'')+'">'+n+'</button>').join('')}
function persist(){if(idx>=PKG.families.length)return;const f=PKG.families[idx],s=state(f.reviewLabel);s.drums.note=document.getElementById('noteD').value;s.lowEnd.note=document.getElementById('noteL').value;s.reviewerAttested=document.getElementById('attest').checked}
function render(){if(idx>=PKG.families.length){app.innerHTML='';document.getElementById('done').classList.remove('hidden');document.getElementById('bar').style.width='100%';return}const f=PKG.families[idx],s=state(f.reviewLabel);document.getElementById('bar').style.width=(idx/PKG.families.length*100)+'%';app.innerHTML='<div class="panel"><div class="row"><h2>Campione '+f.reviewLabel.slice(1)+'</h2><b>'+(idx+1)+'/12</b></div><h3>Reference drums stem</h3><audio controls preload="metadata" src="/media/'+f.reviewLabel+'/drums"></audio><h3>Candidato drums MIDI</h3><audio controls preload="metadata" src="/render/'+f.reviewLabel+'/drums-midi"></audio><div class="score">'+buttons('D',s.drums.score)+'</div><textarea id="noteD" placeholder="Nota drums opzionale">'+s.drums.note+'</textarea><p class="muted">Drums: kick mancanti/falsi, snare/hat, timing, utilità downstream.</p><hr><h3>Reference bass stem</h3><audio controls preload="metadata" src="/media/'+f.reviewLabel+'/bass"></audio><h3>Candidato low-end MIDI</h3><audio controls preload="metadata" src="/render/'+f.reviewLabel+'/bass-midi"></audio><h3>Contour diagnostic</h3><audio controls preload="metadata" src="/render/'+f.reviewLabel+'/bass-contour"></audio><div class="score">'+buttons('L',s.lowEnd.score)+'</div><textarea id="noteL" placeholder="Nota low-end opzionale">'+s.lowEnd.note+'</textarea><p class="muted">Low-end: onset, pitch/ottava, durata/release, glide/contour, utilità MIDI.</p><label><input id="attest" type="checkbox" '+(s.reviewerAttested?'checked':'')+'> Ho ascoltato i riferimenti e i candidati di questo campione e confermo i punteggi.</label><div class="row"><button id="prev" '+(idx===0?'disabled':'')+'>Indietro</button><button id="next">Salva e avanti</button></div><p id="err" class="warn"></p></div>';app.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{persist();const n=Number(b.dataset.score);if(b.dataset.key==='D')s.drums.score=n;else s.lowEnd.score=n;render()});document.getElementById('prev').onclick=()=>{persist();idx--;render()};document.getElementById('next').onclick=()=>{persist();if(s.drums.score===null||s.lowEnd.score===null||!s.reviewerAttested){document.getElementById('err').textContent='Servono i due punteggi e la conferma di ascolto.';return}idx++;render()}}
document.getElementById('submit').onclick=async()=>{const payload={schema:'${SUBMISSION_SCHEMA}',version:1,reviewId:PKG.reviewId,packageDigestSha256:PKG.packageDigestSha256,submittedAt:new Date().toISOString(),families:PKG.families.map(f=>({reviewLabel:f.reviewLabel,...answers[f.reviewLabel]}))};const r=await fetch('/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});document.getElementById('result').textContent=await r.text();if(r.ok)document.getElementById('submit').disabled=true};(async()=>{PKG=await(await fetch('/package')).json();render()})();
</script></main></body></html>`;
}

function openBrowser(url) {
  try {
    let child;
    if (process.platform === "win32") child = spawn("cmd.exe", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
    else if (process.platform === "darwin") child = spawn("open", [url], { detached: true, stdio: "ignore" });
    else child = spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
    child.unref();
  } catch {}
}

function serve(workspaceRoot, reviewId = DEFAULT_REVIEW_ID, port = 0) {
  const workspace = path.resolve(workspaceRoot);
  const technical = qaModule().technical(workspace, RUN_ID);
  if (technical.mode !== "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_TECHNICAL_QA_PASS") {
    throw new Error("Technical QA must pass before serving Human Review");
  }
  const p = protocol();
  const renderer = rendererModule();
  const root = reviewRoot(workspace, reviewId);
  const packageFile = path.join(root, "review-package.json");
  const keyFile = path.join(root, "blind-key.json");
  if (!fs.existsSync(packageFile) || !fs.existsSync(keyFile)) throw new Error("Human Review package missing; run prepare first");
  const pkg = readJson(packageFile);
  const key = readJson(keyFile);
  if (key.schema !== BLIND_KEY_SCHEMA || key.reviewId !== reviewId) throw new Error("Blind key invalid");
  const publicPkg = { ...pkg, packageDigestSha256: sha256File(packageFile) };
  const submissionFile = path.join(root, "submission.json");
  const reportFile = path.join(root, "report.json");
  if (fs.existsSync(submissionFile) || fs.existsSync(reportFile)) throw new Error("Human Review already finalized");
  const cache = new Map();

  function ridForLabel(label) {
    const rid = key.mapping[label];
    if (!rid) throw new Error("Unknown blind review label");
    return rid;
  }

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        return res.end(html());
      }
      if (req.method === "GET" && url.pathname === "/package") {
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        return res.end(stableJson(publicPkg));
      }
      const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if ((req.method === "GET" || req.method === "HEAD") && parts[0] === "media" && parts.length === 3) {
        const rid = ridForLabel(parts[1]);
        const file = stemPath(workspace, rid, parts[2]);
        if (!fs.existsSync(file)) throw new Error("Reference stem missing");
        return renderer.sendAudioFile(req, res, file);
      }
      if ((req.method === "GET" || req.method === "HEAD") && parts[0] === "render" && parts.length === 3) {
        const rid = ridForLabel(parts[1]);
        const what = parts[2];
        const cacheKey = parts[1] + "|" + what;
        let wav = cache.get(cacheKey);
        if (!wav) {
          const result = resultFor(workspace, rid);
          if (what === "drums-midi") wav = renderer.renderDrums(result.drums.events);
          else if (what === "bass-midi") wav = renderer.renderBassNotes(result.lowEnd.notes);
          else if (what === "bass-contour") wav = renderer.renderContour(result.lowEnd.pitchContour);
          else throw new Error("Unknown render target");
          cache.set(cacheKey, wav);
        }
        return renderer.sendAudioBuffer(req, res, wav);
      }
      if (req.method === "POST" && url.pathname === "/submit") {
        let body = "";
        req.setEncoding("utf8");
        req.on("data", chunk => { body += chunk; if (body.length > 1024 * 1024) req.destroy(); });
        return req.on("end", () => {
          try {
            const doc = validateSubmission(JSON.parse(body), publicPkg);
            const finalized = finalizeSubmission(doc, publicPkg, key, p);
            const submission = { ...doc, unblinded: finalized.families, gate: finalized.gate };
            fs.writeFileSync(submissionFile, stableJson(submission), { flag: "wx" });
            const report = {
              schema: REPORT_SCHEMA,
              version: 1,
              reviewId,
              runId: RUN_ID,
              cohortId: COHORT_ID,
              completedAt: new Date().toISOString(),
              packageDigestSha256: publicPkg.packageDigestSha256,
              submissionDigestSha256: sha256File(submissionFile),
              records: EXPECTED_FAMILIES,
              gate: finalized.gate,
              blindness: {
                familyIdentityExposedDuringReview: false,
                selectedArmIdentityExposedDuringReview: false
              },
              safety: {
                retuningPerformed: false,
                batch131Authorized: false,
                trainingAuthorized: false,
                taskDataReadyMayBeDeclared: false
              },
              nextAction: finalized.gate.pass
                ? "PREPARE_OWNED_BEATS_AUDIO_TO_MIDI_BATCH_WITH_SEPARATE_AUTHORIZATION_GATE"
                : "KEEP_BATCH_CLOSED_AND_REVIEW_EVALUATION_FAILURES"
            };
            fs.writeFileSync(reportFile, stableJson(report), { flag: "wx" });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(stableJson(report));
            setTimeout(() => server.close(), 750);
          } catch (error) {
            res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(error.message);
          }
        });
      }
      res.writeHead(404);
      res.end("Not found");
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(error.message);
    }
  });

  server.on("error", error => {
    process.stderr.write("INDEPENDENT EVALUATION HUMAN REVIEW SERVER FAILED: " + (error.code || "ERROR") + ": " + error.message + "\n");
    process.exitCode = 1;
  });
  server.on("listening", () => {
    const address = server.address();
    const boundPort = address && typeof address === "object" ? address.port : Number(port);
    const url = "http://127.0.0.1:" + boundPort + "/";
    process.stdout.write(stableJson({
      mode: "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_HUMAN_REVIEW_SERVER_READY",
      reviewId,
      url,
      records: EXPECTED_FAMILIES,
      familyIdentityExposedToReviewer: false,
      selectedArmIdentityExposedToReviewer: false,
      retuningPerformedByThisCommand: false,
      batch131Authorized: false,
      trainingAuthorized: false
    }));
    openBrowser(url);
  });
  server.listen(Number(port), "127.0.0.1");
}

function report(workspaceRoot, reviewId = DEFAULT_REVIEW_ID) {
  const file = path.join(reviewRoot(path.resolve(workspaceRoot), reviewId), "report.json");
  if (!fs.existsSync(file)) throw new Error("Independent evaluation Human Review report missing");
  return readJson(file);
}

function main(args = process.argv.slice(2)) {
  const [command, workspace, reviewId, port] = args;
  if (!command || !workspace) {
    throw new Error("Usage: node audio-to-midi-independent-evaluation-human-review.js <prepare|serve|report> <workspace> [review-id] [port]");
  }
  if (command === "prepare") process.stdout.write(stableJson(prepare(workspace, reviewId || DEFAULT_REVIEW_ID)));
  else if (command === "serve") serve(workspace, reviewId || DEFAULT_REVIEW_ID, port === undefined ? 0 : Number(port));
  else if (command === "report") process.stdout.write(stableJson(report(workspace, reviewId || DEFAULT_REVIEW_ID)));
  else throw new Error("Unknown command");
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = {
  opaqueOrder,
  computeStats,
  validateSubmission,
  finalizeSubmission,
  prepare,
  report
};
