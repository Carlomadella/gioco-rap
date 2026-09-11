#!/usr/bin/env python3
'''FAME Neural — Audio Analysis V2 correction-cost review.'''
import argparse
import hashlib
import http.server
import json
import math
import os
import random
import shutil
import socketserver
import statistics
import subprocess
import sys
import time
import uuid
import webbrowser
from pathlib import Path

HERE = Path(__file__).resolve().parent
METHOD_FILE = HERE / "audio-analysis-correction-cost-review-method-v1.json"
CONFIG_FILE = HERE / "audio-analysis-v2-config-001.json"
PROTOCOL_FILE = HERE / "audio-analysis-v2-protocol.json"
CANDIDATE_FILE = HERE / "audio-analysis-v2-config-001.py"
BASELINE_FILE = HERE / "audio-analysis.py"
LOCK_FILE = HERE / "requirements-audio-analysis-lock.txt"

DEFAULT_RUN_ID = "v2-config-001-correction-cost-review-001"

SCHEMA_PUBLIC = "fame-owned-beats-audio-analysis-correction-cost-review-package-public-v1"
SCHEMA_PRIVATE = "fame-owned-beats-audio-analysis-correction-cost-review-package-private-v1"
SCHEMA_SUBMISSION = "fame-owned-beats-audio-analysis-correction-cost-review-submission-v1"
SCHEMA_REPORT = "fame-owned-beats-audio-analysis-correction-cost-review-report-v1"
SCHEMA_SUMMARY = "fame-owned-beats-audio-analysis-v2-development-summary-v1"

EXPECTED_BASELINE_REPORT = "runs/audio-analysis-evaluation-v1/v1-baseline-development-002/report.json"
EXPECTED_CANDIDATE_REPORT = "runs/audio-analysis-evaluation-v2/v2-config-001-development-001/report.json"
EXPECTED_COMPARISON_REPORT = "runs/audio-analysis-v2-comparisons/v2-config-001-vs-v1-baseline002-001/report.json"
EXPECTED_REFERENCE = "references/audio-analysis-v2/development/audio-analysis-v2-dev-reference-precision-v3.json"
MANIFEST_REL = "manifest/owned-beats-manifest.json"

REVIEW_HTML = '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>FAME — Correction Cost Review</title>\n<style>\n:root{--bg:#090c10;--panel:#121820;--line:#2c3743;--text:#eef3f7;--muted:#9aa8b5;--ok:#8be19a;--warn:#ffd27a;--bad:#ff8e8e}\n*{box-sizing:border-box} body{margin:0;background:linear-gradient(180deg,#080a0d,#10151b);color:var(--text);font-family:Inter,system-ui,Segoe UI,Arial,sans-serif}\n.wrap{max-width:1180px;margin:auto;padding:24px 16px 60px} h1{margin:0 0 6px;font-size:28px}.muted{color:var(--muted)}\n.box{background:rgba(18,24,32,.97);border:1px solid var(--line);border-radius:15px;padding:15px;margin:14px 0}\n.notice{background:#17130b;border-color:#4b3a18;color:#f2dda9;line-height:1.5}\n.row{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.space{justify-content:space-between}\nbutton,input{font:inherit} button{background:#1c2530;border:1px solid #3b4855;color:white;border-radius:9px;padding:9px 12px;cursor:pointer}\nbutton:hover{background:#26313c} button.primary{background:#f2f4f6;color:#0c1014;border-color:white;font-weight:800}\nbutton.ok{border-color:#3f7448;color:#b7f3bf} button.danger{border-color:#6c3535;color:#ffb1b1} button:disabled{opacity:.4;cursor:not-allowed}\naudio{width:100%;margin:10px 0}.timer{font:800 24px ui-monospace,Consolas,monospace}.badge{border:1px solid #40505e;border-radius:999px;padding:5px 9px;font-size:12px}\ncanvas{display:block;width:100%;height:220px;background:#070a0d;border:1px solid #34414d;border-radius:12px;cursor:crosshair}\n.markers{margin-top:12px;display:grid;gap:7px}.marker{display:grid;grid-template-columns:55px 120px 1fr auto auto;gap:8px;align-items:center}\n.marker input{background:#0d1217;color:#fff;border:1px solid #36434f;border-radius:8px;padding:8px;width:120px}\n.marker.sel{outline:1px solid #fff;border-radius:9px;padding:5px}.help{font-size:13px;color:var(--muted);line-height:1.5}\n.progress{height:8px;background:#0a0e12;border-radius:999px;overflow:hidden;border:1px solid #2a3540}.progress>div{height:100%;background:#dce3e8}\n.hidden{display:none!important}\n@media(max-width:760px){.marker{grid-template-columns:45px 100px 1fr}.marker button{padding:7px}}\n</style>\n</head>\n<body>\n<div class="wrap">\n<h1>FAME — Correction Cost Review</h1>\n<div class="muted">Review cieca V1 vs config-001 · sections only · development 8/8</div>\n\n<div class="box notice">\n<strong>Regola:</strong> correggi i marker finché rappresentano le vere boundary musicali secondo il tuo giudizio.\nNon cercare di capire quale algoritmo stai correggendo. La reference congelata non è mostrata.\nIl timer misura ascolto + ispezione + modifica + verifica; va in pausa se la pagina passa in background.\n</div>\n\n<div class="box">\n<div class="row space">\n  <div>\n    <div id="familyLabel" style="font-size:19px;font-weight:800">Caricamento…</div>\n    <div id="sessionLabel" class="muted"></div>\n  </div>\n  <div class="badge" id="globalCount"></div>\n</div>\n<div class="progress" style="margin-top:12px"><div id="progressBar"></div></div>\n</div>\n\n<div class="box">\n<div class="row space">\n  <div>\n    <div class="muted">Tempo attivo review</div>\n    <div class="timer" id="timer">00:00.0</div>\n  </div>\n  <div class="row">\n    <button id="startBtn" class="primary">START SESSIONE</button>\n    <button id="pauseBtn" disabled>PAUSA</button>\n    <button id="resumeBtn" disabled>RIPRENDI</button>\n  </div>\n</div>\n</div>\n\n<div class="box">\n<audio id="audio" controls preload="auto"></audio>\n<div class="row space" style="margin:2px 0 10px">\n  <div class="muted">Posizione audio sulla waveform</div>\n  <div class="timer" id="audioPos" style="font-size:16px">00:00.000</div>\n</div>\n<canvas id="wave" width="1100" height="220"></canvas>\n<div class="row" style="margin-top:10px">\n  <button id="addBtn" disabled>+ Boundary al cursore</button>\n  <button id="moveBtn" disabled>Sposta selezionata al cursore</button>\n  <button id="deleteBtn" class="danger" disabled>Elimina selezionata</button>\n  <button id="deselectBtn" disabled>Deseleziona</button>\n</div>\n<div class="help" style="margin-top:8px">\nClic sulla waveform: se un marker è selezionato lo sposta; altrimenti aggiunge una boundary.\nPuoi anche modificare il timestamp numerico. Usa l\'audio liberamente.\n</div>\n<div class="markers" id="markers"></div>\n</div>\n\n<div class="box">\n<label><input id="attest" type="checkbox" disabled> Ho finito: queste boundary rappresentano il mio giudizio musicale.</label>\n<div class="row" style="margin-top:12px">\n<button id="finishBtn" class="ok" disabled>✓ CHIUDI QUESTO PASSAGGIO</button>\n</div>\n</div>\n\n<div class="box hidden" id="doneBox">\n<strong>Review 16/16 completata.</strong>\n<div class="muted" style="margin:8px 0">Invia il risultato al server locale. L\'identità V1/V2 resterà nascosta fino al finalizer.</div>\n<button id="submitBtn" class="primary">INVIA REVIEW COMPLETA</button>\n<pre id="submitStatus" class="help"></pre>\n</div>\n</div>\n\n<script>\nlet PACK=null, sessions=[], idx=0, selectedMarker=null, buffer=null, ctx=null;\nlet running=false, manuallyPaused=false, started=false, activeMs=0, segmentStart=0;\nlet current=null, markers=[], ops={add:0,delete:0,move:0};\nconst STORE_KEY="fame-correction-cost-review-v1";\nconst UI_REVISION="playhead-v2";\nconst audio=document.getElementById("audio");\nconst canvas=document.getElementById("wave");\nconst c2=canvas.getContext("2d");\n\nfunction fmtSec(t){let m=Math.floor(t/60),s=t-m*60;return `${String(m).padStart(2,"0")}:${s.toFixed(3).padStart(6,"0")}`}\nfunction fmtTimer(ms){let s=ms/1000,m=Math.floor(s/60);s-=m*60;return `${String(m).padStart(2,"0")}:${s.toFixed(1).padStart(4,"0")}`}\nfunction now(){return performance.now()}\nfunction accrue(){if(running){activeMs+=now()-segmentStart;segmentStart=now()}}\nfunction setRunning(v){if(v&&!running){segmentStart=now();running=true}else if(!v&&running){accrue();running=false}}\nfunction saveDraft(){\n  accrue();\n  const data={runId:PACK.runId,uiRevision:UI_REVISION,idx,completed:sessions.filter(s=>s.result).map(s=>({sessionId:s.sessionId,result:s.result})),\n    draft: current?{sessionId:current.sessionId,markers,activeMs,started,manuallyPaused,ops}:null};\n  localStorage.setItem(STORE_KEY,JSON.stringify(data));\n}\nfunction loadSaved(){\n  try{\n    const d=JSON.parse(localStorage.getItem(STORE_KEY)||"null");\n    if(!d||d.runId!==PACK.runId)return;\n    for(const item of d.completed||[]){const s=sessions.find(x=>x.sessionId===item.sessionId);if(s)s.result=item.result}\n    idx=Math.min(Number(d.idx)||0,sessions.length);\n    if(d.uiRevision===UI_REVISION&&d.draft&&idx<sessions.length&&sessions[idx].sessionId===d.draft.sessionId){\n      sessions[idx]._draft=d.draft;\n    }\n  }catch(e){}\n}\nfunction buildSessions(){\n  sessions=[];\n  for(const fam of PACK.families){\n    for(const p of fam.passes){\n      sessions.push({...p,familyIndex:fam.familyIndex,sourceRecordId:fam.sourceRecordId,duration:fam.decodedDurationSeconds,mediaPath:fam.mediaPath});\n    }\n  }\n}\nfunction currentFamily(){return PACK.families.find(f=>f.familyIndex===current.familyIndex)}\nasync function loadSession(){\n  if(idx>=sessions.length){showDone();return}\n  current=sessions[idx]; selectedMarker=null;\n  const draft=current._draft;\n  markers=(draft?draft.markers:current.initialBoundariesSeconds).map(Number).sort((a,b)=>a-b);\n  activeMs=draft?Number(draft.activeMs)||0:0; started=!!(draft&&draft.started);\n  manuallyPaused=!!(draft&&draft.manuallyPaused); ops=draft?draft.ops||{add:0,delete:0,move:0}:{add:0,delete:0,move:0};\n  running=false;\n  const fam=currentFamily();\n  document.getElementById("familyLabel").textContent=`Famiglia ${fam.familyIndex}/8`;\n  document.getElementById("sessionLabel").textContent=`Passaggio ${current.passIndex}/2`;\n  document.getElementById("globalCount").textContent=`${idx+1}/16`;\n  document.getElementById("progressBar").style.width=`${(idx/16)*100}%`;\n  audio.src=current.mediaPath;\n  audio.currentTime=0;\n  const pos=document.getElementById("audioPos");if(pos)pos.textContent="00:00.000";\n  document.getElementById("attest").checked=false;\n  refreshControls(); renderMarkers();\n  try{\n    const r=await fetch(current.mediaPath); const arr=await r.arrayBuffer();\n    ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();\n    buffer=await ctx.decodeAudioData(arr.slice(0)); drawWave();\n  }catch(e){buffer=null;drawWave()}\n  if(started&&!manuallyPaused)setRunning(true);\n}\nfunction refreshControls(){\n  document.getElementById("timer").textContent=fmtTimer(activeMs+(running?(now()-segmentStart):0));\n  document.getElementById("startBtn").disabled=started;\n  document.getElementById("pauseBtn").disabled=!started||!running;\n  document.getElementById("resumeBtn").disabled=!started||running;\n  for(const id of ["addBtn","moveBtn","deleteBtn","deselectBtn"])document.getElementById(id).disabled=!started;\n  document.getElementById("attest").disabled=!started;\n  document.getElementById("finishBtn").disabled=!started||!document.getElementById("attest").checked;\n}\nsetInterval(refreshControls,100);\ndocument.getElementById("startBtn").onclick=()=>{started=true;manuallyPaused=false;setRunning(true);refreshControls();renderMarkers();drawWave();saveDraft()};\ndocument.getElementById("pauseBtn").onclick=()=>{manuallyPaused=true;setRunning(false);refreshControls();saveDraft()};\ndocument.getElementById("resumeBtn").onclick=()=>{manuallyPaused=false;setRunning(true);refreshControls();saveDraft()};\ndocument.addEventListener("visibilitychange",()=>{if(document.hidden){if(running){setRunning(false);saveDraft()}}else if(started&&!manuallyPaused){setRunning(true)}});\ndocument.getElementById("attest").onchange=refreshControls;\n\n\nfunction drawPlayhead(){\n  if(!started||!current||!Number.isFinite(current.duration)||current.duration<=0)return;\n  const t=Math.max(0,Math.min(current.duration,Number(audio.currentTime)||0));\n  const x=t/current.duration*canvas.width;\n  c2.save();\n  c2.strokeStyle="#ff4d6d";\n  c2.lineWidth=2;\n  c2.beginPath();\n  c2.moveTo(x,0);\n  c2.lineTo(x,canvas.height);\n  c2.stroke();\n  c2.fillStyle="#ff4d6d";\n  c2.beginPath();\n  c2.moveTo(Math.max(0,x-6),0);\n  c2.lineTo(Math.min(canvas.width,x+6),0);\n  c2.lineTo(x,9);\n  c2.closePath();\n  c2.fill();\n  c2.restore();\n}\nfunction updatePlayhead(){\n  const el=document.getElementById("audioPos");\n  if(el)el.textContent=fmtSec(Number(audio.currentTime)||0);\n  drawWave();\n  if(!audio.paused&&!audio.ended)requestAnimationFrame(updatePlayhead);\n}\n\nfunction drawWave(){\n  c2.clearRect(0,0,canvas.width,canvas.height);c2.fillStyle="#070a0d";c2.fillRect(0,0,canvas.width,canvas.height);\n  if(!buffer){c2.fillStyle="#8f9ba6";c2.font="15px system-ui";c2.fillText("Waveform non disponibile; audio comunque utilizzabile.",20,35);return}\n  const data=buffer.getChannelData(0), step=Math.max(1,Math.floor(data.length/canvas.width));\n  c2.strokeStyle="#74818c";c2.lineWidth=1;c2.beginPath();\n  for(let x=0;x<canvas.width;x++){let a=x*step,b=Math.min(data.length,a+step),mn=1,mx=-1;for(let i=a;i<b;i++){let v=data[i];if(v<mn)mn=v;if(v>mx)mx=v}\n    c2.moveTo(x,(1-mx)*canvas.height/2);c2.lineTo(x,(1-mn)*canvas.height/2)}\n  c2.stroke();\n  for(let i=0;i<markers.length;i++){let x=markers[i]/current.duration*canvas.width;c2.strokeStyle=i===selectedMarker?"#ffffff":"#ffd27a";c2.lineWidth=i===selectedMarker?3:1.5;c2.beginPath();c2.moveTo(x,0);c2.lineTo(x,canvas.height);c2.stroke()}\n  drawPlayhead();\n}\naudio.addEventListener("play",()=>{updatePlayhead()});\naudio.addEventListener("pause",()=>{updatePlayhead()});\naudio.addEventListener("timeupdate",()=>{if(audio.paused)updatePlayhead()});\naudio.addEventListener("seeked",()=>{updatePlayhead()});\n\ncanvas.onclick=e=>{\n  if(!started)return;\n  const r=canvas.getBoundingClientRect(),frac=(e.clientX-r.left)/r.width,t=Math.max(0,Math.min(current.duration,frac*current.duration));\n  if(selectedMarker!==null){markers[selectedMarker]=t;markers.sort((a,b)=>a-b);selectedMarker=null;ops.move++}\n  else{markers.push(t);markers.sort((a,b)=>a-b);ops.add++}\n  renderMarkers();drawWave();saveDraft();\n};\nfunction renderMarkers(){\n  const root=document.getElementById("markers");root.innerHTML="";\n  if(!markers.length){root.innerHTML=\'<div class="muted">Nessuna boundary.</div>\';return}\n  markers.forEach((t,i)=>{\n    const row=document.createElement("div");row.className="marker "+(i===selectedMarker?"sel":"");\n    row.innerHTML=`<div>#${i+1}</div><button data-j="${i}">${fmtSec(t)}</button><input data-e="${i}" type="number" step="0.01" value="${t.toFixed(3)}"><button data-s="${i}">Seleziona</button><button class="danger" data-d="${i}">Elimina</button>`;\n    root.appendChild(row);\n  });\n  root.querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>{audio.currentTime=markers[Number(b.dataset.j)]});\n  root.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{selectedMarker=Number(b.dataset.s);renderMarkers();drawWave()});\n  root.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{if(!started)return;markers.splice(Number(b.dataset.d),1);selectedMarker=null;ops.delete++;renderMarkers();drawWave();saveDraft()});\n  root.querySelectorAll("[data-e]").forEach(inp=>inp.onchange=()=>{if(!started)return;let i=Number(inp.dataset.e),v=Number(inp.value);if(Number.isFinite(v)){markers[i]=Math.max(0,Math.min(current.duration,v));markers.sort((a,b)=>a-b);selectedMarker=null;ops.move++;renderMarkers();drawWave();saveDraft()}});\n}\ndocument.getElementById("addBtn").onclick=()=>{if(started){markers.push(audio.currentTime);markers.sort((a,b)=>a-b);ops.add++;renderMarkers();drawWave();saveDraft()}};\ndocument.getElementById("moveBtn").onclick=()=>{if(started&&selectedMarker!==null){markers[selectedMarker]=audio.currentTime;markers.sort((a,b)=>a-b);selectedMarker=null;ops.move++;renderMarkers();drawWave();saveDraft()}};\ndocument.getElementById("deleteBtn").onclick=()=>{if(started&&selectedMarker!==null){markers.splice(selectedMarker,1);selectedMarker=null;ops.delete++;renderMarkers();drawWave();saveDraft()}};\ndocument.getElementById("deselectBtn").onclick=()=>{selectedMarker=null;renderMarkers();drawWave()};\n\ndocument.getElementById("finishBtn").onclick=()=>{\n  if(!started||!document.getElementById("attest").checked)return;\n  setRunning(false);\n  current.result={completed:true,reviewerAttestedCorrect:true,activeReviewSeconds:Math.round(activeMs)/1000,\n    initialBoundariesSeconds:current.initialBoundariesSeconds,finalBoundariesSeconds:markers.map(x=>Math.round(x*1000)/1000),\n    operationCounts:{add:ops.add||0,delete:ops.delete||0,move:ops.move||0}};\n  idx++; current=null; saveDraft(); loadSession();\n};\nfunction showDone(){\n  setRunning(false);document.getElementById("doneBox").classList.remove("hidden");\n  document.getElementById("familyLabel").textContent="Review completata";\n  document.getElementById("sessionLabel").textContent="16/16 passaggi";\n  document.getElementById("globalCount").textContent="16/16";\n  document.getElementById("progressBar").style.width="100%";\n}\ndocument.getElementById("submitBtn").onclick=async()=>{\n  const completed=sessions.filter(s=>s.result);\n  if(completed.length!==16){alert("Review non completa");return}\n  const payload={schema:"fame-owned-beats-audio-analysis-correction-cost-review-submission-v1",version:1,runId:PACK.runId,\n    publicPackageDigestSha256:PACK.packageIdentityDigestSha256,armIdentityExposedToReviewer:false,humanReferenceExposedToReviewer:false,\n    submittedAt:new Date().toISOString(),sessions:completed.map(s=>({sessionId:s.sessionId,...s.result}))};\n  const r=await fetch("/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n  const txt=await r.text();document.getElementById("submitStatus").textContent=txt;\n  if(r.ok){localStorage.removeItem(STORE_KEY);document.getElementById("submitBtn").disabled=true}\n};\n\n(async function(){\n  PACK=await (await fetch("review-package.json")).json();\n  buildSessions();loadSaved();loadSession();\n})();\n</script>\n</body>\n</html>\n'


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_json(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    ).hexdigest()


def run_text(args, cwd=None):
    cp = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if cp.returncode:
        raise RuntimeError((cp.stderr or cp.stdout or "").strip() or f"Command failed: {args[0]}")
    return cp.stdout.strip()


def repo_root():
    return HERE.parents[3]


def git_commit():
    return run_text(["git", "rev-parse", "HEAD"], cwd=repo_root())


def git_blob(path):
    return run_text(["git", "hash-object", str(path)], cwd=repo_root())


def config_hash(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    ).hexdigest()


def require_method():
    method = read_json(METHOD_FILE)
    if (
        method.get("schema") != "fame-owned-beats-audio-analysis-correction-cost-review-method"
        or method.get("version") != 1
        or method.get("status") != "FROZEN_BEFORE_REVIEW_OBSERVATION"
        or method.get("scope", {}).get("candidateId") != "audio-analysis-v2-config-001"
        or method.get("scope", {}).get("configurationIndex") != 1
        or method.get("holdoutObserved") is not False
    ):
        raise RuntimeError("Invalid/unfrozen correction-cost review method")
    return method


def require_repo_identity(method):
    cfg = read_json(CONFIG_FILE)
    if cfg.get("candidateId") != method["scope"]["candidateId"]:
        raise RuntimeError("Candidate config identity mismatch")
    if cfg.get("configurationIndex") != method["scope"]["configurationIndex"]:
        raise RuntimeError("Candidate configurationIndex mismatch")
    if cfg.get("configHash") != method["inputs"]["configHash"]:
        raise RuntimeError("Frozen configHash mismatch")
    if config_hash(cfg.get("algorithmConfig")) != cfg.get("configHash"):
        raise RuntimeError("Candidate algorithmConfig hash mismatch")
    if git_blob(BASELINE_FILE) != method["inputs"]["baselineSourceGitBlobSha1"]:
        raise RuntimeError("Baseline source blob mismatch")
    if git_blob(CANDIDATE_FILE) != method["inputs"]["candidateSourceGitBlobSha1"]:
        raise RuntimeError("Candidate source blob mismatch")
    if sha256_file(PROTOCOL_FILE) != method["inputs"]["protocolDigestSha256"]:
        raise RuntimeError("Protocol digest mismatch")
    return cfg


def require_external_inputs(workspace, method):
    paths = {
        "baseline": workspace / EXPECTED_BASELINE_REPORT,
        "candidate": workspace / EXPECTED_CANDIDATE_REPORT,
        "comparison": workspace / EXPECTED_COMPARISON_REPORT,
        "reference": workspace / EXPECTED_REFERENCE,
        "manifest": workspace / MANIFEST_REL,
    }
    for key, path in paths.items():
        if not path.is_file():
            raise RuntimeError(f"Required {key} file missing: {path}")

    if sha256_file(paths["baseline"]) != method["inputs"]["baselineReportSha256"]:
        raise RuntimeError("Baseline report digest mismatch")
    if sha256_file(paths["candidate"]) != method["inputs"]["candidateReportSha256"]:
        raise RuntimeError("Candidate report digest mismatch")
    if sha256_file(paths["comparison"]) != method["inputs"]["pairedComparisonReportSha256"]:
        raise RuntimeError("Paired comparison report digest mismatch")

    baseline = read_json(paths["baseline"])
    candidate = read_json(paths["candidate"])
    comparison = read_json(paths["comparison"])
    reference = read_json(paths["reference"])
    manifest = read_json(paths["manifest"])

    for report in (baseline, candidate):
        if report.get("split") != "development" or report.get("holdoutObserved") is not False:
            raise RuntimeError("Development report/holdout identity mismatch")
        prov = report.get("provenance", {})
        if (
            prov.get("humanReferenceReviewId") != method["inputs"]["referenceReviewId"]
            or prov.get("humanReferenceSubmissionDigestSha256") != method["inputs"]["referenceDigestSha256"]
        ):
            raise RuntimeError("Report Human Reference identity mismatch")

    if candidate.get("candidateId") != method["scope"]["candidateId"]:
        raise RuntimeError("Unexpected candidate report identity")
    if (
        comparison.get("decision", {}).get("metricGate") != "V2_WINS_METRICALLY"
        or comparison.get("decision", {}).get("officialDevelopmentDecision") != "INCONCLUSIVE_REVIEW_PENDING"
        or comparison.get("decision", {}).get("holdoutMayOpen") is not False
    ):
        raise RuntimeError("Paired comparison is not awaiting the required review")
    if comparison.get("holdoutObserved") is not False:
        raise RuntimeError("Holdout was observed")

    if (
        reference.get("reviewId") != method["inputs"]["referenceReviewId"]
        or reference.get("submissionDigestSha256") != method["inputs"]["referenceDigestSha256"]
    ):
        raise RuntimeError("Frozen reference identity mismatch")

    base_by = {f["sourceRecordId"]: f for f in baseline.get("families", [])}
    cand_by = {f["sourceRecordId"]: f for f in candidate.get("families", [])}
    if set(base_by) != set(cand_by):
        raise RuntimeError("Baseline/candidate family set mismatch")
    if len(base_by) != int(method["scope"]["expectedDevelopmentFamilies"]):
        raise RuntimeError("Unexpected development family count")

    records = {r.get("sourceRecordId"): r for r in manifest.get("records", [])}
    ref_families = reference.get("submission", {}).get("families", [])
    ref_by = {f.get("sourceRecordId"): f for f in ref_families}
    if set(base_by) != set(ref_by):
        raise RuntimeError("Evaluation/reference family set mismatch")

    return paths, baseline, candidate, comparison, reference, records, base_by, cand_by, ref_by


def safe_run_id(value):
    if not value or len(value) > 90:
        raise RuntimeError("Invalid run-id")
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
    if value[0] not in allowed or any(ch not in allowed for ch in value):
        raise RuntimeError("Invalid run-id")
    return value


def review_root(workspace, run_id):
    return workspace / "reviews" / "audio-analysis-v2" / "correction-cost" / safe_run_id(run_id)


def result_root(workspace, run_id):
    return workspace / "runs" / "audio-analysis-correction-cost-review" / safe_run_id(run_id)


def link_or_copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.link(src, dst)
        return "HARDLINK"
    except Exception:
        shutil.copy2(src, dst)
        return "COPY"


def prepare(workspace, run_id):
    workspace = Path(workspace).resolve()
    method = require_method()
    require_repo_identity(method)
    (
        paths, baseline, candidate, comparison, reference, records, base_by, cand_by, ref_by
    ) = require_external_inputs(workspace, method)

    root = review_root(workspace, run_id)
    if root.exists():
        raise RuntimeError(f"Append-only review package already exists: {root}")

    tmp = root.parent / f".{root.name}.tmp-{uuid.uuid4().hex}"
    web = tmp / "web"
    private = tmp / "private"
    media = web / "media"
    media.mkdir(parents=True)
    private.mkdir(parents=True)

    try:
        family_ids = list(base_by.keys())
        rng = random.SystemRandom()
        rng.shuffle(family_ids)
        first_arms = ["BASELINE"] * 4 + ["CANDIDATE"] * 4
        rng.shuffle(first_arms)

        public_families = []
        private_sessions = {}
        source_copy_modes = {}

        for family_index, (rid, first_arm) in enumerate(zip(family_ids, first_arms), 1):
            b = base_by[rid]
            c = cand_by[rid]
            record = records.get(rid)
            ref = ref_by[rid]
            if not record or record.get("split") != "development":
                raise RuntimeError(f"Missing/non-development manifest record: {rid}")

            source = workspace / Path(record.get("localPath", ""))
            if not source.is_file():
                raise RuntimeError(f"Source audio missing: {source}")
            if sha256_file(source) != record.get("sha256"):
                raise RuntimeError(f"Source SHA256 mismatch: {rid}")

            ext = source.suffix.lower() or ".audio"
            media_name = f"{uuid.uuid4().hex}{ext}"
            source_copy_modes[rid] = link_or_copy(source, media / media_name)

            duration_b = float(b["technical"]["durationSeconds"])
            duration_c = float(c["technical"]["durationSeconds"])
            duration_ref = float(ref["decodedDurationSeconds"])
            if max(abs(duration_b - duration_c), abs(duration_b - duration_ref)) > 0.02:
                raise RuntimeError(f"Audio duration mismatch for paired family: {rid}")

            arm_order = [first_arm, "CANDIDATE" if first_arm == "BASELINE" else "BASELINE"]
            passes = []
            for pass_index, arm in enumerate(arm_order, 1):
                report_family = b if arm == "BASELINE" else c
                initial = [round(float(x), 6) for x in report_family["sections"]["estimatedBoundariesSeconds"]]
                session_id = uuid.uuid4().hex
                passes.append({
                    "sessionId": session_id,
                    "label": f"Famiglia {family_index}/8 · passaggio {pass_index}/2",
                    "passIndex": pass_index,
                    "initialBoundariesSeconds": initial,
                })
                private_sessions[session_id] = {
                    "sourceRecordId": rid,
                    "compositionFamilyId": b["compositionFamilyId"],
                    "arm": arm,
                    "familyIndex": family_index,
                    "passIndex": pass_index,
                    "initialBoundariesSeconds": initial,
                }

            public_families.append({
                "familyIndex": family_index,
                "decodedDurationSeconds": round(duration_b, 6),
                "mediaPath": f"media/{media_name}",
                "passes": passes,
            })

        public_package = {
            "schema": SCHEMA_PUBLIC,
            "version": 1,
            "runId": run_id,
            "candidateId": method["scope"]["candidateId"],
            "configurationIndex": method["scope"]["configurationIndex"],
            "split": "development",
            "reviewTarget": "SECTIONS_ONLY",
            "armIdentityHidden": True,
            "humanReferenceHidden": True,
            "holdoutObserved": False,
            "methodDigestSha256": sha256_file(METHOD_FILE),
            "families": public_families,
            "reviewInstructions": {
                "instruction": method["reviewProcedure"]["reviewerInstruction"],
                "allowedCorrections": method["reviewProcedure"]["allowedCorrections"],
                "timer": method["reviewProcedure"]["timerIncludes"],
                "completionRequiresReviewerAttestation": True,
            },
        }
        package_identity_digest = sha256_json(public_package)
        public_package["packageIdentityDigestSha256"] = package_identity_digest

        private_key = {
            "schema": SCHEMA_PRIVATE,
            "version": 1,
            "runId": run_id,
            "packageIdentityDigestSha256": package_identity_digest,
            "methodDigestSha256": sha256_file(METHOD_FILE),
            "baselineReportSha256": method["inputs"]["baselineReportSha256"],
            "candidateReportSha256": method["inputs"]["candidateReportSha256"],
            "pairedComparisonReportSha256": method["inputs"]["pairedComparisonReportSha256"],
            "referenceDigestSha256": method["inputs"]["referenceDigestSha256"],
            "preparedAtUnixSeconds": time.time(),
            "preparedAtCodeCommit": git_commit(),
            "sessions": private_sessions,
            "sourceMaterialization": source_copy_modes,
        }

        (web / "review-package.json").write_text(stable_json(public_package), encoding="utf-8")
        (private / "review-key.json").write_text(stable_json(private_key), encoding="utf-8")
        (web / "index.html").write_text(REVIEW_HTML, encoding="utf-8")
        (tmp / "README.txt").write_text(
            "FAME correction-cost review package.\n"
            "Use: python audio-analysis-correction-cost-review.py serve <workspace>\n"
            "The private V1/V2 arm key is outside the served web root.\n",
            encoding="utf-8",
        )

        if root.exists():
            raise RuntimeError(f"Review package appeared concurrently: {root}")
        tmp.rename(root)
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        raise

    return {
        "mode": "CORRECTION_COST_REVIEW_PACKAGE_PREPARED",
        "runId": run_id,
        "reviewRoot": str(root),
        "packageIdentityDigestSha256": package_identity_digest,
        "methodDigestSha256": sha256_file(METHOD_FILE),
        "families": 8,
        "sessions": 16,
        "baselineFirstFamilies": 4,
        "candidateFirstFamilies": 4,
        "armIdentityHidden": True,
        "referenceHidden": True,
        "holdoutObserved": False,
    }


class ReviewHandler(http.server.SimpleHTTPRequestHandler):
    server_version = "FAMEReview/1.0"

    def log_message(self, format, *args):
        print("[review-server] " + (format % args), file=sys.stderr)

    def do_POST(self):
        if self.path != "/submit":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > 5_000_000:
            self.send_error(400, "Invalid submission size")
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self.send_error(400, "Invalid JSON")
            return
        if (
            payload.get("schema") != SCHEMA_SUBMISSION
            or payload.get("version") != 1
            or payload.get("runId") != self.server.review_run_id
        ):
            self.send_error(400, "Submission identity mismatch")
            return
        dest = self.server.submission_path
        if dest.exists():
            self.send_error(409, "Submission already finalized")
            return
        tmp = dest.with_suffix(".tmp")
        tmp.write_text(stable_json(payload), encoding="utf-8")
        tmp.replace(dest)
        response = stable_json({
            "ok": True,
            "saved": str(dest),
            "submissionSha256": sha256_file(dest),
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


def serve(workspace, run_id, port):
    root = review_root(Path(workspace).resolve(), run_id)
    web = root / "web"
    if not (web / "index.html").is_file() or not (web / "review-package.json").is_file():
        raise RuntimeError("Prepared review package missing; run prepare first")
    handler = lambda *args, **kwargs: ReviewHandler(*args, directory=str(web), **kwargs)
    with socketserver.ThreadingTCPServer(("127.0.0.1", int(port)), handler) as httpd:
        httpd.allow_reuse_address = True
        httpd.review_run_id = run_id
        httpd.submission_path = root / "submission.json"
        url = f"http://127.0.0.1:{port}/"
        print(stable_json({
            "mode": "CORRECTION_COST_REVIEW_SERVER",
            "url": url,
            "runId": run_id,
            "submissionPath": str(httpd.submission_path),
            "armKeyServed": False,
            "holdoutObserved": False,
        }), end="", flush=True)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


def event_match(refs, preds, tolerance):
    refs = sorted(float(x) for x in refs)
    preds = sorted(float(x) for x in preds)
    i = j = matches = 0
    while i < len(refs) and j < len(preds):
        d = preds[j] - refs[i]
        if abs(d) <= tolerance:
            matches += 1
            i += 1
            j += 1
        elif preds[j] < refs[i] - tolerance:
            j += 1
        else:
            i += 1
    precision = matches / len(preds) if preds else (1.0 if not refs else 0.0)
    recall = matches / len(refs) if refs else (1.0 if not preds else 0.0)
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "matches": matches,
        "falsePositives": len(preds) - matches,
        "omissions": len(refs) - matches,
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "fMeasure": round(f1, 6),
    }


def comparable_relative(candidate_cost, baseline_cost):
    baseline_cost = float(baseline_cost)
    candidate_cost = float(candidate_cost)
    if not math.isfinite(baseline_cost) or baseline_cost <= 0:
        return None
    if not math.isfinite(candidate_cost) or candidate_cost < 0:
        return None
    return (candidate_cost / baseline_cost) - 1.0


def review_gate(relative_values, minimum=6, threshold=0.25):
    values = [float(v) for v in relative_values if v is not None and math.isfinite(float(v))]
    if len(values) < int(minimum):
        return {
            "status": "MISSING_REQUIRED_REVIEW",
            "comparableFamilies": len(values),
            "medianRelativeIncrease": None,
            "automaticWinBlocked": None,
        }
    med = float(statistics.median(values))
    return {
        "status": "REVIEW_COMPLETE",
        "comparableFamilies": len(values),
        "medianRelativeIncrease": round(med, 6),
        "automaticWinBlocked": med > float(threshold),
    }


def finalize(workspace, run_id):
    workspace = Path(workspace).resolve()
    method = require_method()
    require_repo_identity(method)
    (
        paths, baseline, candidate, comparison, reference, records, base_by, cand_by, ref_by
    ) = require_external_inputs(workspace, method)

    root = review_root(workspace, run_id)
    public_path = root / "web" / "review-package.json"
    key_path = root / "private" / "review-key.json"
    submission_path = root / "submission.json"
    for path in (public_path, key_path, submission_path):
        if not path.is_file():
            raise RuntimeError(f"Required review artifact missing: {path}")

    public = read_json(public_path)
    key = read_json(key_path)
    submission = read_json(submission_path)

    public_for_digest = dict(public)
    public_for_digest.pop("packageIdentityDigestSha256", None)
    if sha256_json(public_for_digest) != key.get("packageIdentityDigestSha256"):
        raise RuntimeError("Public package digest mismatch")
    if key.get("methodDigestSha256") != sha256_file(METHOD_FILE):
        raise RuntimeError("Review method changed after package preparation")
    if (
        submission.get("schema") != SCHEMA_SUBMISSION
        or submission.get("version") != 1
        or submission.get("runId") != run_id
        or submission.get("publicPackageDigestSha256") != key.get("packageIdentityDigestSha256")
    ):
        raise RuntimeError("Review submission identity mismatch")
    if submission.get("armIdentityExposedToReviewer") is not False:
        raise RuntimeError("Reviewer arm identity exposure invalidates blinding")
    if submission.get("humanReferenceExposedToReviewer") is not False:
        raise RuntimeError("Human Reference exposure invalidates review")

    submitted_sessions = submission.get("sessions")
    if not isinstance(submitted_sessions, list) or len(submitted_sessions) != 16:
        raise RuntimeError("Expected exactly 16 completed review sessions")
    by_session = {s.get("sessionId"): s for s in submitted_sessions}
    if len(by_session) != 16 or set(by_session) != set(key["sessions"]):
        raise RuntimeError("Review session set mismatch")

    family_rows = {}
    for session_id, private_info in key["sessions"].items():
        s = by_session[session_id]
        if s.get("completed") is not True or s.get("reviewerAttestedCorrect") is not True:
            raise RuntimeError(f"Incomplete review session: {session_id}")
        active = float(s.get("activeReviewSeconds"))
        if not math.isfinite(active) or active <= 0:
            raise RuntimeError(f"Invalid activeReviewSeconds: {session_id}")
        final_markers = s.get("finalBoundariesSeconds")
        if (
            not isinstance(final_markers, list)
            or any(not isinstance(v, (int, float)) or not math.isfinite(float(v)) for v in final_markers)
        ):
            raise RuntimeError(f"Invalid final boundaries: {session_id}")

        rid = private_info["sourceRecordId"]
        arm = private_info["arm"]
        fam = family_rows.setdefault(rid, {
            "sourceRecordId": rid,
            "compositionFamilyId": private_info["compositionFamilyId"],
            "durationSeconds": float(base_by[rid]["technical"]["durationSeconds"]),
            "arms": {},
        })
        if arm in fam["arms"]:
            raise RuntimeError(f"Duplicate arm for family: {rid}:{arm}")

        duration_minutes = fam["durationSeconds"] / 60.0
        seconds_per_audio_minute = active / duration_minutes
        ref_boundaries = ref_by[rid]["sections"]["boundariesSeconds"]
        initial = private_info["initialBoundariesSeconds"]

        fam["arms"][arm] = {
            "sessionId": session_id,
            "activeReviewSeconds": round(active, 6),
            "secondsPerAudioMinute": round(seconds_per_audio_minute, 6),
            "initialBoundaryCount": len(initial),
            "finalBoundaryCount": len(final_markers),
            "operationCounts": s.get("operationCounts", {}),
            "qa500ms": event_match(ref_boundaries, final_markers, 0.5),
            "qa3s": event_match(ref_boundaries, final_markers, 3.0),
            "finalBoundariesSeconds": [round(float(v), 6) for v in sorted(final_markers)],
        }

    if len(family_rows) != 8:
        raise RuntimeError("Expected 8 paired families")

    family_reports = []
    relative_values = []
    for rid in sorted(family_rows):
        fam = family_rows[rid]
        if set(fam["arms"]) != {"BASELINE", "CANDIDATE"}:
            raise RuntimeError(f"Missing paired arm: {rid}")
        b = fam["arms"]["BASELINE"]
        c = fam["arms"]["CANDIDATE"]
        relative = comparable_relative(c["secondsPerAudioMinute"], b["secondsPerAudioMinute"])
        if relative is not None:
            relative_values.append(relative)
        family_reports.append({
            "sourceRecordId": rid,
            "compositionFamilyId": fam["compositionFamilyId"],
            "durationSeconds": round(fam["durationSeconds"], 6),
            "baseline": b,
            "candidate": c,
            "relativeCandidateCostIncrease": None if relative is None else round(relative, 6),
            "comparable": relative is not None,
        })

    gate = review_gate(
        relative_values,
        minimum=method["metric"]["minimumComparableFamilies"],
        threshold=method["metric"]["automaticWinBlockedIfMedianRelativeIncreaseStrictlyExceeds"],
    )

    metric_gate = comparison["decision"]["metricGate"]
    if metric_gate != "V2_WINS_METRICALLY":
        official = "V1_WINS" if metric_gate == "V1_WINS" else "INCONCLUSIVE"
        holdout_may_open = False
        reason = "paired metric gate no longer reports V2_WINS_METRICALLY"
    elif gate["status"] != "REVIEW_COMPLETE":
        official = "INCONCLUSIVE"
        holdout_may_open = False
        reason = "required review does not have at least 6 comparable families"
    elif gate["automaticWinBlocked"]:
        official = "INCONCLUSIVE"
        holdout_may_open = False
        reason = "median relative correction-cost increase exceeds +25% veto threshold"
    else:
        official = "V2_WINS"
        holdout_may_open = True
        reason = "metric gate passes and required correction-cost review does not veto"

    report = {
        "schema": SCHEMA_REPORT,
        "version": 1,
        "runId": run_id,
        "split": "development",
        "candidateId": method["scope"]["candidateId"],
        "configurationIndex": method["scope"]["configurationIndex"],
        "holdoutObserved": False,
        "methodDigestSha256": sha256_file(METHOD_FILE),
        "packageIdentityDigestSha256": key["packageIdentityDigestSha256"],
        "submissionDigestSha256": sha256_file(submission_path),
        "baselineReportSha256": method["inputs"]["baselineReportSha256"],
        "candidateReportSha256": method["inputs"]["candidateReportSha256"],
        "pairedComparisonReportSha256": method["inputs"]["pairedComparisonReportSha256"],
        "humanReferenceReviewId": method["inputs"]["referenceReviewId"],
        "humanReferenceSubmissionDigestSha256": method["inputs"]["referenceDigestSha256"],
        "reviewMetric": {
            "name": method["metric"]["name"],
            "minimumComparableFamilies": method["metric"]["minimumComparableFamilies"],
            "vetoThresholdStrictlyExceeds": method["metric"]["automaticWinBlockedIfMedianRelativeIncreaseStrictlyExceeds"],
            **gate,
        },
        "families": family_reports,
        "decision": {
            "metricGate": metric_gate,
            "reviewGateStatus": gate["status"],
            "officialDevelopmentDecision": official,
            "holdoutMayOpen": holdout_may_open,
            "reason": reason,
        },
    }

    final_root = result_root(workspace, run_id)
    if final_root.exists():
        raise RuntimeError(f"Append-only final review result already exists: {final_root}")
    tmp = final_root.parent / f".{final_root.name}.tmp-{uuid.uuid4().hex}"
    tmp.mkdir(parents=True, exist_ok=False)
    try:
        report_path = tmp / "report.json"
        report_path.write_text(stable_json(report), encoding="utf-8")
        report_digest = sha256_file(report_path)

        summary = {
            "schema": SCHEMA_SUMMARY,
            "version": 1,
            "split": "development",
            "candidateId": method["scope"]["candidateId"],
            "configurationIndex": method["scope"]["configurationIndex"],
            "decision": official,
            "holdoutMayOpen": holdout_may_open,
            "holdoutObserved": False,
            "codeCommit": git_commit(),
            "evaluatedCandidateSourceGitBlobSha1": method["inputs"]["candidateSourceGitBlobSha1"],
            "configHash": method["inputs"]["configHash"],
            "dependencyLockHash": sha256_file(LOCK_FILE),
            "protocolDigestSha256": method["inputs"]["protocolDigestSha256"],
            "developmentMetricsComparisonDigest": method["inputs"]["pairedComparisonReportSha256"],
            "correctionCostReviewDigest": report_digest,
            "humanReferenceSubmissionDigestSha256": method["inputs"]["referenceDigestSha256"],
        }
        summary_path = tmp / "development-summary.json"
        summary_path.write_text(stable_json(summary), encoding="utf-8")
        tmp.rename(final_root)
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        raise

    return {
        "mode": "CORRECTION_COST_REVIEW_FINALIZED",
        "runId": run_id,
        "reportPath": str(final_root / "report.json"),
        "reportSha256": sha256_file(final_root / "report.json"),
        "developmentSummaryPath": str(final_root / "development-summary.json"),
        "developmentSummarySha256": sha256_file(final_root / "development-summary.json"),
        "reviewMetric": gate,
        "decision": report["decision"],
        "holdoutObserved": False,
    }


def status(workspace, run_id):
    root = review_root(Path(workspace).resolve(), run_id)
    final = result_root(Path(workspace).resolve(), run_id)
    return {
        "runId": run_id,
        "packagePrepared": (root / "web" / "review-package.json").is_file(),
        "submissionSaved": (root / "submission.json").is_file(),
        "finalized": (final / "report.json").is_file(),
        "reviewRoot": str(root),
        "resultRoot": str(final),
    }


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("prepare")
    p.add_argument("workspace")
    p.add_argument("--run-id", default=DEFAULT_RUN_ID)

    s = sub.add_parser("serve")
    s.add_argument("workspace")
    s.add_argument("--run-id", default=DEFAULT_RUN_ID)
    s.add_argument("--port", type=int, default=8765)

    f = sub.add_parser("finalize")
    f.add_argument("workspace")
    f.add_argument("--run-id", default=DEFAULT_RUN_ID)

    st = sub.add_parser("status")
    st.add_argument("workspace")
    st.add_argument("--run-id", default=DEFAULT_RUN_ID)

    args = parser.parse_args()
    if args.cmd == "prepare":
        result = prepare(Path(args.workspace), args.run_id)
    elif args.cmd == "serve":
        return serve(Path(args.workspace), args.run_id, args.port)
    elif args.cmd == "finalize":
        result = finalize(Path(args.workspace), args.run_id)
    else:
        result = status(Path(args.workspace), args.run_id)
    print(stable_json(result), end="")


if __name__ == "__main__":
    main()
