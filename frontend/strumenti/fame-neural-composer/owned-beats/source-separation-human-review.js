"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const qa = require("./source-separation-development-qa");

const HERE = __dirname;
const REVIEW_FILE = path.join(HERE, "source-separation-pilot-review-v1.json");
const INFERENCE_RUN_ID = "source-separation-development-inference-v1-001";
const DEFAULT_REVIEW_ID = "source-separation-human-review-v1-001";
const PACKAGE_SCHEMA = "fame-owned-beats-source-separation-human-review-package-v1";
const SUBMISSION_SCHEMA = "fame-owned-beats-source-separation-human-review-submission-v1";
const REPORT_SCHEMA = "fame-owned-beats-source-separation-human-review-report-v1";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function sha256Bytes(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function safeId(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(value)) {
    throw new Error(`${label} must match [A-Za-z0-9][A-Za-z0-9._-]{2,79}`);
  }
  return value;
}

function reviewRoot(workspace, reviewId) {
  return path.join(workspace, "reviews", "source-separation-development", safeId(reviewId, "review-id"));
}

function runRoot(workspace) {
  return path.join(workspace, "runs", "source-separation-development-inference", INFERENCE_RUN_ID);
}

function rubric() {
  const review = readJson(REVIEW_FILE);
  if (
    review.schema !== "fame-owned-beats-source-separation-pilot-review-v1" ||
    review.status !== "FROZEN_BEFORE_FIRST_PILOT_OUTPUT" ||
    review.scope?.split !== "development" ||
    review.scope?.expectedFamilies !== 8 ||
    review.scope?.holdoutAllowed !== false ||
    review.scope?.batch131Allowed !== false ||
    review.pilotGate?.technical !== "ALL_8_FAMILIES_PASS" ||
    review.pilotGate?.drums?.medianDownstreamUsefulnessAtLeast !== 2 ||
    review.pilotGate?.drums?.familiesAtOrAbove2AtLeast !== 6 ||
    review.pilotGate?.bass?.medianDownstreamUsefulnessAtLeast !== 2 ||
    review.pilotGate?.bass?.familiesAtOrAbove2AtLeast !== 6
  ) {
    throw new Error("Frozen Source Separation review rubric is invalid");
  }
  return review;
}

function identityKey(x) {
  return [x.compositionFamilyId, x.sourceRecordId, x.sourceAssetId, x.sha256].join("\u0000");
}

function prepare(workspaceRoot, reviewId = DEFAULT_REVIEW_ID) {
  reviewId = safeId(reviewId, "review-id");
  const workspace = path.resolve(workspaceRoot);
  const technical = qa.technical(workspace, INFERENCE_RUN_ID);
  if (
    technical.mode !== "SOURCE_SEPARATION_TECHNICAL_QA_PASS" ||
    technical.technicalGate !== "ALL_8_FAMILIES_PASS" ||
    technical.recordsVerified !== 8 ||
    technical.stemsVerified !== 32
  ) {
    throw new Error("Technical QA must pass before human review preparation");
  }

  const review = rubric();
  const root = reviewRoot(workspace, reviewId);
  if (fs.existsSync(root)) throw new Error(`Append-only human review already exists: ${root}`);

  const inferenceRoot = runRoot(workspace);
  const receiptFile = path.join(inferenceRoot, "execution-receipt.json");
  const summaryFile = path.join(inferenceRoot, "inference-summary.json");
  const receipt = readJson(receiptFile);
  const summary = readJson(summaryFile);

  if (
    receipt.status !== "AUTHORIZED_NO_INFERENCE" ||
    receipt.sources?.length !== 8 ||
    summary.status !== "INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA" ||
    summary.technicalValidationPassed !== true
  ) {
    throw new Error("Inference run is not eligible for frozen human review");
  }

  const families = receipt.sources
    .slice()
    .sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId))
    .map(source => {
      const resultFile = path.join(inferenceRoot, "results", `${source.sourceRecordId}.json`);
      const result = readJson(resultFile);
      if (identityKey(result.source) !== identityKey(source)) {
        throw new Error(`Result identity mismatch: ${source.sourceRecordId}`);
      }
      const stems = {};
      for (const name of ["drums", "bass", "other", "vocals"]) {
        stems[name] = { sha256: result.adapterResult.stems[name].sha256 };
      }
      return {
        sourceRecordId: source.sourceRecordId,
        compositionFamilyId: source.compositionFamilyId,
        sourceSha256: source.sha256,
        stems
      };
    });

  const payload = {
    schema: PACKAGE_SCHEMA,
    version: 1,
    status: "PREPARED_AWAITING_HUMAN_REVIEW",
    reviewId,
    preparedAt: new Date().toISOString(),
    inferenceRunId: INFERENCE_RUN_ID,
    inferenceReceiptSha256: sha256Bytes(receiptFile),
    inferenceSummarySha256: sha256Bytes(summaryFile),
    frozenRubricSha256: sha256Bytes(REVIEW_FILE),
    scope: {
      split: "development",
      expectedFamilies: 8,
      finalHoldoutAllowed: false,
      batch131Allowed: false,
      trainingAuthorized: false
    },
    scale: review.humanReview.scale,
    criteria: {
      drums: review.humanReview.drums,
      bass: review.humanReview.bass,
      auxiliary: review.humanReview.auxiliary
    },
    pilotGate: review.pilotGate,
    families
  };

  fs.mkdirSync(root, { recursive: false });
  try {
    fs.writeFileSync(path.join(root, "review-package.json"), stableJson(payload), { flag: "wx" });
  } catch (error) {
    fs.rmSync(root, { recursive: true, force: true });
    throw error;
  }

  return {
    mode: "SOURCE_SEPARATION_HUMAN_REVIEW_PREPARED",
    reviewId,
    records: families.length,
    technicalGate: technical.technicalGate,
    metricsExposedToReviewer: false,
    finalHoldoutAccessedByThisCommand: false,
    trainingAuthorized: false,
    nextAction: "SERVE_AND_COMPLETE_HUMAN_REVIEW"
  };
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function validateSubmission(doc, pkg) {
  if (
    doc?.schema !== SUBMISSION_SCHEMA ||
    doc.version !== 1 ||
    doc.reviewId !== pkg.reviewId ||
    doc.packageDigestSha256 !== pkg.packageDigestSha256 ||
    !Array.isArray(doc.families) ||
    doc.families.length !== 8
  ) {
    throw new Error("Invalid human review submission envelope");
  }

  const byId = new Map(pkg.families.map(f => [f.sourceRecordId, f]));
  const seen = new Set();
  for (const item of doc.families) {
    if (!byId.has(item.sourceRecordId) || seen.has(item.sourceRecordId)) {
      throw new Error(`Invalid/duplicate review family: ${item.sourceRecordId}`);
    }
    seen.add(item.sourceRecordId);
    for (const role of ["drums", "bass"]) {
      const score = item[role]?.downstreamUsefulness;
      if (!Number.isInteger(score) || score < 0 || score > 3) {
        throw new Error(`Invalid ${role} downstreamUsefulness: ${item.sourceRecordId}`);
      }
      if (item[role]?.note !== undefined && typeof item[role].note !== "string") {
        throw new Error(`Invalid ${role} note: ${item.sourceRecordId}`);
      }
    }
    if (item.reviewerAttested !== true) {
      throw new Error(`Reviewer attestation missing: ${item.sourceRecordId}`);
    }
  }
  return doc;
}

function computeGate(doc, pkg) {
  validateSubmission(doc, pkg);
  const drums = doc.families.map(x => x.drums.downstreamUsefulness);
  const bass = doc.families.map(x => x.bass.downstreamUsefulness);
  const drumsMedian = median(drums);
  const bassMedian = median(bass);
  const drumsAtLeast2 = drums.filter(x => x >= 2).length;
  const bassAtLeast2 = bass.filter(x => x >= 2).length;

  const drumsPass =
    drumsMedian >= pkg.pilotGate.drums.medianDownstreamUsefulnessAtLeast &&
    drumsAtLeast2 >= pkg.pilotGate.drums.familiesAtOrAbove2AtLeast;
  const bassPass =
    bassMedian >= pkg.pilotGate.bass.medianDownstreamUsefulnessAtLeast &&
    bassAtLeast2 >= pkg.pilotGate.bass.familiesAtOrAbove2AtLeast;
  const pass = drumsPass && bassPass;

  return {
    technical: "ALL_8_FAMILIES_PASS",
    drums: {
      medianDownstreamUsefulness: drumsMedian,
      familiesAtOrAbove2: drumsAtLeast2,
      pass: drumsPass
    },
    bass: {
      medianDownstreamUsefulness: bassMedian,
      familiesAtOrAbove2: bassAtLeast2,
      pass: bassPass
    },
    pass,
    outcome: pass ? pkg.pilotGate.outcomeIfPass : pkg.pilotGate.outcomeIfFail
  };
}

function mediaPath(workspace, pkg, sourceRecordId, role) {
  const family = pkg.families.find(x => x.sourceRecordId === sourceRecordId);
  if (!family) throw new Error("Unknown sourceRecordId");
  const receipt = readJson(path.join(runRoot(workspace), "execution-receipt.json"));
  const source = receipt.sources.find(x => x.sourceRecordId === sourceRecordId);
  if (!source) throw new Error("Receipt source missing");

  if (role === "source") return path.resolve(workspace, source.localPath);
  if (!["drums", "bass", "other", "vocals"].includes(role)) throw new Error("Unknown media role");
  return path.join(runRoot(workspace), source.outputRelativePath, `${role}.wav`);
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".wav") return "audio/wav";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a" || ext === ".mp4") return "audio/mp4";
  if (ext === ".ogg") return "audio/ogg";
  return "application/octet-stream";
}

function html() {
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FAME Source Separation Review</title>
<style>
body{margin:0;background:#0b0e12;color:#edf2f7;font-family:system-ui,Segoe UI,Arial,sans-serif}
main{max-width:980px;margin:auto;padding:24px}.panel{background:#141a22;border:1px solid #2c3642;border-radius:14px;padding:18px;margin:14px 0}
.muted{color:#9ca9b7}audio{width:100%;margin:6px 0 14px}.score{display:flex;gap:8px;flex-wrap:wrap}
button{background:#202936;border:1px solid #405064;color:white;border-radius:9px;padding:10px 15px;cursor:pointer}
button.sel{background:#f3f5f7;color:#0b0e12;font-weight:800}button:disabled{opacity:.45}
textarea{width:100%;min-height:70px;background:#0d1218;color:white;border:1px solid #344251;border-radius:8px;padding:9px}
.row{display:flex;gap:10px;justify-content:space-between;align-items:center}.hidden{display:none}.warn{color:#ffd27a}
label{display:block;margin:7px 0}.progress{height:7px;background:#202733;border-radius:8px;overflow:hidden}.bar{height:100%;background:#e8edf2;width:0}
</style></head><body><main>
<h1>FAME — Source Separation Human Review</h1>
<p class="muted">Valuta solo ciò che senti. Le metriche tecniche non sono mostrate.</p>
<div class="progress"><div id="bar" class="bar"></div></div>
<div id="app"></div>
<div id="done" class="panel hidden"><h2>Review completa</h2><button id="submit">Salva e calcola il gate</button><pre id="result"></pre></div>
<script>
let PKG,idx=0,answers={};
const app=document.getElementById("app");
function scoreButtons(role,value){return [0,1,2,3].map(n=>`<button data-role="${role}" data-score="${n}" class="${value===n?"sel":""}">${n}</button>`).join("")}
function current(){return PKG.families[idx]}
function state(id){return answers[id]||(answers[id]={drums:{downstreamUsefulness:null,note:""},bass:{downstreamUsefulness:null,note:""},reviewerAttested:false})}
function render(){
 if(idx>=PKG.families.length){app.innerHTML="";document.getElementById("done").classList.remove("hidden");document.getElementById("bar").style.width="100%";return}
 const f=current(),s=state(f.sourceRecordId);document.getElementById("bar").style.width=(idx/PKG.families.length*100)+"%";
 app.innerHTML=`<div class="panel"><div class="row"><h2>${f.sourceRecordId}</h2><b>${idx+1}/${PKG.families.length}</b></div>
 <h3>Originale</h3><audio controls src="/media/${encodeURIComponent(f.sourceRecordId)}/source"></audio>
 <h3>Drums</h3><audio controls src="/media/${encodeURIComponent(f.sourceRecordId)}/drums"></audio>
 <p><b>Downstream onset/MIDI usefulness</b> — 0 inutilizzabile, 1 debole, 2 utilizzabile, 3 forte.</p>
 <div class="score">${scoreButtons("drums",s.drums.downstreamUsefulness)}</div>
 <p class="muted">Controlla: ritenzione percussiva; chiarezza kick/snare/hat; leakage tonale/vocale.</p>
 <textarea id="drumsNote" placeholder="Nota drums opzionale">${s.drums.note}</textarea>
 <h3>Bass</h3><audio controls src="/media/${encodeURIComponent(f.sourceRecordId)}/bass"></audio>
 <p><b>Downstream pitch/MIDI usefulness</b> — 0 inutilizzabile, 1 debole, 2 utilizzabile, 3 forte.</p>
 <div class="score">${scoreButtons("bass",s.bass.downstreamUsefulness)}</div>
 <p class="muted">Controlla: ritenzione low-end; fondamentale/pitch tracciabile; leakage kick/drums.</p>
 <textarea id="bassNote" placeholder="Nota bass opzionale">${s.bass.note}</textarea>
 <details><summary>Ascolto ausiliario other/vocals</summary>
 <h4>Other</h4><audio controls src="/media/${encodeURIComponent(f.sourceRecordId)}/other"></audio>
 <h4>Vocals</h4><audio controls src="/media/${encodeURIComponent(f.sourceRecordId)}/vocals"></audio></details>
 <label><input id="attest" type="checkbox" ${s.reviewerAttested?"checked":""}> Ho ascoltato originale, drums e bass e confermo i punteggi.</label>
 <div class="row"><button id="prev" ${idx===0?"disabled":""}>Indietro</button><button id="next">Salva e avanti</button></div>
 <p id="err" class="warn"></p></div>`;
 app.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>{s[b.dataset.role].downstreamUsefulness=Number(b.dataset.score);render()});
 document.getElementById("next").onclick=()=>save(true);
 document.getElementById("prev").onclick=()=>{save(false);idx--;render()};
}
function save(advance){
 const f=current(),s=state(f.sourceRecordId);
 s.drums.note=document.getElementById("drumsNote").value;
 s.bass.note=document.getElementById("bassNote").value;
 s.reviewerAttested=document.getElementById("attest").checked;
 if(advance&&(s.drums.downstreamUsefulness===null||s.bass.downstreamUsefulness===null||!s.reviewerAttested)){
   document.getElementById("err").textContent="Servono entrambi i punteggi e la conferma di ascolto.";return false}
 if(advance)idx++;render();return true;
}
document.getElementById("submit").onclick=async()=>{
 const payload={schema:"fame-owned-beats-source-separation-human-review-submission-v1",version:1,reviewId:PKG.reviewId,packageDigestSha256:PKG.packageDigestSha256,
 submittedAt:new Date().toISOString(),families:PKG.families.map(f=>({sourceRecordId:f.sourceRecordId,...answers[f.sourceRecordId]}))};
 const r=await fetch("/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 document.getElementById("result").textContent=await r.text();if(r.ok)document.getElementById("submit").disabled=true;
};
(async()=>{PKG=await (await fetch("/package")).json();render()})();
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

function serve(workspaceRoot, reviewId = DEFAULT_REVIEW_ID, port = 8766) {
  reviewId = safeId(reviewId, "review-id");
  const workspace = path.resolve(workspaceRoot);
  qa.technical(workspace, INFERENCE_RUN_ID);
  const root = reviewRoot(workspace, reviewId);
  const packageFile = path.join(root, "review-package.json");
  if (!fs.existsSync(packageFile)) throw new Error("Human review package missing; run prepare first");
  const pkg = readJson(packageFile);
  const packageDigestSha256 = sha256Bytes(packageFile);
  const publicPkg = { ...pkg, packageDigestSha256 };
  const submissionFile = path.join(root, "submission.json");
  const reportFile = path.join(root, "report.json");
  if (fs.existsSync(submissionFile) || fs.existsSync(reportFile)) {
    throw new Error("Human review already submitted/finalized; append-only review cannot reopen");
  }

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, {"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});
        return res.end(html());
      }
      if (req.method === "GET" && url.pathname === "/package") {
        res.writeHead(200, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
        return res.end(stableJson(publicPkg));
      }
      if (req.method === "GET" && url.pathname.startsWith("/media/")) {
        const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
        if (parts.length !== 3) throw new Error("Invalid media route");
        const rid = parts[1], role = parts[2];
        const file = mediaPath(workspace, pkg, rid, role);
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error("Media file missing");
        res.writeHead(200, {"Content-Type":contentType(file),"Cache-Control":"no-store"});
        return fs.createReadStream(file).pipe(res);
      }
      if (req.method === "POST" && url.pathname === "/submit") {
        let body = "";
        req.setEncoding("utf8");
        req.on("data", chunk => {
          body += chunk;
          if (body.length > 1024 * 1024) req.destroy();
        });
        return req.on("end", () => {
          try {
            const doc = validateSubmission(JSON.parse(body), publicPkg);
            const gate = computeGate(doc, publicPkg);
            const submission = { ...doc, gate };
            fs.writeFileSync(submissionFile, stableJson(submission), { flag: "wx" });
            const reportDoc = {
              schema: REPORT_SCHEMA,
              version: 1,
              reviewId,
              inferenceRunId: INFERENCE_RUN_ID,
              completedAt: new Date().toISOString(),
              packageDigestSha256,
              submissionDigestSha256: sha256Bytes(submissionFile),
              records: doc.families.length,
              gate,
              safety: {
                finalHoldoutAccessed: false,
                batch131Accessed: false,
                trainingAuthorized: false,
                taskDataReadyMayBeDeclared: false
              },
              nextAction: gate.pass ? "OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT" : "KEEP_AUDIO_TO_MIDI_CLOSED_AND_REVIEW_SEPARATOR"
            };
            fs.writeFileSync(reportFile, stableJson(reportDoc), { flag: "wx" });
            res.writeHead(200, {"Content-Type":"application/json; charset=utf-8"});
            res.end(stableJson(reportDoc));
            setTimeout(() => server.close(), 750);
          } catch (error) {
            res.writeHead(400, {"Content-Type":"text/plain; charset=utf-8"});
            res.end(error.message);
          }
        });
      }
      res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"});
      res.end("Not found");
    } catch (error) {
      res.writeHead(500, {"Content-Type":"text/plain; charset=utf-8"});
      res.end(error.message);
    }
  });

  server.listen(Number(port), "127.0.0.1", () => {
    const url = `http://127.0.0.1:${Number(port)}/`;
    process.stdout.write(stableJson({
      mode: "SOURCE_SEPARATION_HUMAN_REVIEW_SERVER_READY",
      reviewId,
      url,
      records: pkg.families.length,
      metricsExposedToReviewer: false,
      finalHoldoutAccessedByThisCommand: false,
      trainingAuthorized: false
    }));
    openBrowser(url);
  });
}

function report(workspaceRoot, reviewId = DEFAULT_REVIEW_ID) {
  const workspace = path.resolve(workspaceRoot);
  const file = path.join(reviewRoot(workspace, reviewId), "report.json");
  if (!fs.existsSync(file)) throw new Error("Human review report not found");
  return readJson(file);
}

function main(args = process.argv.slice(2)) {
  const [command, workspace, reviewId, port] = args;
  if (!command || !workspace) {
    throw new Error("Usage: node source-separation-human-review.js <prepare|serve|report> <workspace> [review-id] [port]");
  }
  if (command === "prepare") process.stdout.write(stableJson(prepare(workspace, reviewId || DEFAULT_REVIEW_ID)));
  else if (command === "serve") serve(workspace, reviewId || DEFAULT_REVIEW_ID, port || 8766);
  else if (command === "report") process.stdout.write(stableJson(report(workspace, reviewId || DEFAULT_REVIEW_ID)));
  else throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { prepare, median, validateSubmission, computeGate };
