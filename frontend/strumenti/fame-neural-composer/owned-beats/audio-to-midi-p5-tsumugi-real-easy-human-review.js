"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const cp=require("node:child_process");
const {spawn}=require("node:child_process");
const renderer=require("./audio-to-midi-human-review-v2");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"audio-to-midi-p5-tsumugi-real-easy-human-review-v1.json");
const RUN_ID="audio-to-midi-p5-tsumugi-real-easy-development-v1-001";
const REVIEW_ID="audio-to-midi-p5-tsumugi-real-easy-human-review-v1-001";
const SS_RUN_ID="source-separation-development-inference-v1-001";
const RUN_DIR="audio-to-midi-p5-tsumugi-real-easy-development";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function stableJson(v){return JSON.stringify(v,null,2)+"\n"}
function sha256File(file){return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}
function median(values){const s=values.slice().sort((a,b)=>a-b),m=s.length/2;return s.length%2?s[Math.floor(m)]:(s[m-1]+s[m])/2}
function reviewRoot(workspace){return path.join(workspace,"reviews","audio-to-midi-p5-tsumugi-real-easy",REVIEW_ID)}
function runRoot(workspace){return path.join(workspace,"runs",RUN_DIR,RUN_ID)}
function ssRoot(workspace){return path.join(workspace,"runs","source-separation-development-inference",SS_RUN_ID)}

function protocol(){
  const p=readJson(PROTOCOL_FILE);
  if(p.schema!=="fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-v1"||
     p.version!==1||p.status!=="FROZEN_BEFORE_FIRST_REAL_EASY_HUMAN_LISTENING"||
     p.reviewId!==REVIEW_ID||p.runId!==RUN_ID||
     JSON.stringify(p.expectedRecords)!==JSON.stringify(["FAME000040","FAME000080","FAME000126"])||
     p.renderer?.id!==renderer.RENDERER_ID||p.renderer?.candidateIdentityExposedInUi!==false||
     p.interpretation?.automaticPromotion!==false||
     p.safety?.originalSourceAudioAllowed!==false||
     p.safety?.independentEvaluationAllowed!==false||
     p.safety?.finalHoldoutAllowed!==false||
     p.safety?.trainingAuthorized!==false){
    throw new Error("Frozen Tsumugi real-easy Human Review protocol invalid");
  }
  return p;
}

function validateRun(workspace){
  const p=protocol();
  const summaryFile=path.join(runRoot(workspace),"summary.json");
  if(!fs.existsSync(summaryFile))throw new Error("Tsumugi real-easy summary missing");
  const summary=readJson(summaryFile);
  if(summary.status!=="REAL_EASY_DEVELOPMENT_DIAGNOSTIC_COMPLETE_AWAITING_HUMAN_REVIEW"||
     summary.runId!==RUN_ID||summary.records!==3||summary.automaticPromotion!==false||
     summary.humanReviewRequired!==true||
     summary.safety?.freshIndependentEvaluationFamiliesConsumed!==0||
     summary.safety?.originalSourceAudioOpenedByThisCommand!==false||
     summary.safety?.independentEvaluationAccessedByThisCommand!==false||
     summary.safety?.finalHoldoutAccessedByThisCommand!==false||
     summary.safety?.retuningPerformedByThisCommand!==false){
    throw new Error("Tsumugi real-easy summary safety/identity mismatch");
  }
  const ids=summary.results.map(x=>x.sourceRecordId);
  if(JSON.stringify(ids)!==JSON.stringify(p.expectedRecords))throw new Error("Real-easy record order/identity mismatch");
  for(const id of ids){
    const resultFile=path.join(runRoot(workspace),id,"result.json");
    const midiFile=path.join(runRoot(workspace),id,"tsumugi-drums-v1_5.mid");
    if(!fs.existsSync(resultFile)||!fs.existsSync(midiFile))throw new Error("Real-easy artifact missing: "+id);
    const result=readJson(resultFile);
    if(result.sourceRecordId!==id||result.safety?.split!=="development"||
       result.safety?.originalSourceAudioOpened!==false||
       result.safety?.independentEvaluationAccessed!==false||
       result.safety?.retuningPerformed!==false){
      throw new Error("Real-easy result safety mismatch: "+id);
    }
  }
  return {p,summary,summaryFile};
}

function sourceStemPath(workspace,rid){
  const receiptFile=path.join(ssRoot(workspace),"execution-receipt.json");
  if(!fs.existsSync(receiptFile))throw new Error("Source Separation receipt missing");
  const receipt=readJson(receiptFile);
  const source=(receipt.sources||[]).find(x=>x.sourceRecordId===rid);
  if(!source)throw new Error("Unknown development sourceRecordId: "+rid);
  const stem=path.join(ssRoot(workspace),source.outputRelativePath,"drums.wav");
  if(!fs.existsSync(stem))throw new Error("Development drums stem missing: "+rid);
  return stem;
}

function wavDurationSeconds(file){
  const r=cp.spawnSync("ffprobe",[
    "-v","error","-show_entries","format=duration",
    "-of","default=noprint_wrappers=1:nokey=1",file
  ],{encoding:"utf8"});
  if(r.status!==0)throw new Error("ffprobe duration failed for "+file);
  const duration=Number(String(r.stdout||"").trim());
  if(!Number.isFinite(duration)||duration<=0)throw new Error("Invalid WAV duration for "+file);
  return duration;
}

function prepare(workspaceRoot){
  const workspace=path.resolve(workspaceRoot);
  const {p,summary,summaryFile}=validateRun(workspace);
  const root=reviewRoot(workspace);
  if(fs.existsSync(root))throw new Error("Append-only review already exists: "+root);
  const families=p.expectedRecords.map(id=>{
    const resultFile=path.join(runRoot(workspace),id,"result.json");
    return {
      sourceRecordId:id,
      reference:"development drums stem",
      candidateLabel:"Candidate",
      sourceResultSha256:sha256File(resultFile)
    };
  });
  const pkg={
    schema:"fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-package-v1",
    version:1,status:"PREPARED_AWAITING_HUMAN_REVIEW",
    reviewId:REVIEW_ID,runId:RUN_ID,preparedAt:new Date().toISOString(),
    protocolDigestSha256:sha256File(PROTOCOL_FILE),
    sourceSummarySha256:sha256File(summaryFile),
    renderer:p.renderer,scale:p.scale,criteria:p.criteria,families,safety:p.safety
  };
  fs.mkdirSync(path.dirname(root),{recursive:true});
  fs.mkdirSync(root,{recursive:false});
  try{fs.writeFileSync(path.join(root,"review-package.json"),stableJson(pkg),{flag:"wx"})}
  catch(error){fs.rmSync(root,{recursive:true,force:true});throw error}
  return {
    mode:"FAME_NEURAL_P5_TSUMUGI_REAL_EASY_HUMAN_REVIEW_PREPARED",
    reviewId:REVIEW_ID,records:summary.records,
    candidateIdentityExposedInUi:false,
    originalSourceAudioOpenedByThisCommand:false,
    developmentDrumsStemAudioOpenedByThisCommand:false,
    independentEvaluationAccessedByThisCommand:false,
    finalHoldoutAccessedByThisCommand:false,
    trainingAuthorized:false,
    nextAction:"SERVE_REAL_EASY_HUMAN_REVIEW"
  };
}

function parseByteRange(rangeHeader,size){
  if(!rangeHeader)return null;
  const m=/^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader).trim());
  if(!m)return{invalid:true};
  let start=m[1]===""?null:Number(m[1]),end=m[2]===""?null:Number(m[2]);
  if(start===null&&end===null)return{invalid:true};
  if(start===null){const suffix=end;if(!Number.isInteger(suffix)||suffix<=0)return{invalid:true};start=Math.max(0,size-suffix);end=size-1}
  else{if(!Number.isInteger(start)||start<0||start>=size)return{invalid:true};if(end===null)end=size-1;if(!Number.isInteger(end)||end<start)return{invalid:true};end=Math.min(end,size-1)}
  return{start,end};
}
function sendBuffer(req,res,buffer){
  const size=buffer.length,range=parseByteRange(req.headers.range,size);
  const base={"Content-Type":"audio/wav","Accept-Ranges":"bytes","Cache-Control":"no-store"};
  if(range?.invalid){res.writeHead(416,{...base,"Content-Range":"bytes */"+size});return res.end()}
  if(range){const len=range.end-range.start+1;res.writeHead(206,{...base,"Content-Range":"bytes "+range.start+"-"+range.end+"/"+size,"Content-Length":String(len)});if(req.method==="HEAD")return res.end();return res.end(buffer.subarray(range.start,range.end+1))}
  res.writeHead(200,{...base,"Content-Length":String(size)});if(req.method==="HEAD")return res.end();return res.end(buffer);
}
function sendFile(req,res,file){
  const stat=fs.statSync(file),size=stat.size,range=parseByteRange(req.headers.range,size);
  const base={"Content-Type":"audio/wav","Accept-Ranges":"bytes","Cache-Control":"no-store"};
  if(range?.invalid){res.writeHead(416,{...base,"Content-Range":"bytes */"+size});return res.end()}
  if(range){const len=range.end-range.start+1;res.writeHead(206,{...base,"Content-Range":"bytes "+range.start+"-"+range.end+"/"+size,"Content-Length":String(len)});if(req.method==="HEAD")return res.end();return fs.createReadStream(file,{start:range.start,end:range.end}).pipe(res)}
  res.writeHead(200,{...base,"Content-Length":String(size)});if(req.method==="HEAD")return res.end();return fs.createReadStream(file).pipe(res);
}

function html(){return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FAME Tsumugi real-easy review</title><style>
body{margin:0;background:#0b0e12;color:#edf2f7;font-family:system-ui,Segoe UI,Arial,sans-serif}main{max-width:900px;margin:auto;padding:24px}.panel{background:#141a22;border:1px solid #2d3744;border-radius:14px;padding:18px;margin:14px 0}.muted{color:#9aa8b6}.warn{color:#ffd27a}audio{width:100%;margin:6px 0 16px}.score{display:flex;gap:8px}.score button,button{background:#202936;border:1px solid #46566a;color:white;padding:9px 14px;border-radius:8px;cursor:pointer}.score button.sel{background:white;color:#111;font-weight:800}textarea{width:100%;min-height:70px;background:#0e1319;color:white;border:1px solid #354252;border-radius:8px;padding:8px}.row{display:flex;justify-content:space-between;gap:12px;align-items:center}.hidden{display:none}</style></head><body><main>
<h1>FAME — Tsumugi real-easy Human Review</h1><p class="muted">Confronta lo stem drums di riferimento con il render neutro del Candidate. Valuta timing, ruoli, coverage e utilità MIDI; non il timbro del renderer.</p><div id="app"></div><div id="done" class="panel hidden"><h2>Review completa</h2><button id="submit">Salva review</button><pre id="result"></pre></div>
<script>
let PKG,idx=0,answers={};const app=document.getElementById("app");
function state(id){return answers[id]||(answers[id]={score:null,note:"",reviewerAttested:false})}
function buttons(value){return [0,1,2,3].map(n=>'<button data-score="'+n+'" class="'+(value===n?'sel':'')+'">'+n+'</button>').join('')}
function persist(){if(idx>=PKG.families.length)return;const s=state(PKG.families[idx].sourceRecordId);s.note=document.getElementById("note").value;s.reviewerAttested=document.getElementById("attest").checked}
function render(){if(idx>=PKG.families.length){app.innerHTML="";document.getElementById("done").classList.remove("hidden");return}const f=PKG.families[idx],s=state(f.sourceRecordId);app.innerHTML='<div class="panel"><div class="row"><h2>'+f.sourceRecordId+'</h2><b>'+(idx+1)+'/3</b></div><h3>Reference — drums stem</h3><audio controls src="/reference/'+f.sourceRecordId+'"></audio><h3>Candidate</h3><audio controls src="/candidate/'+f.sourceRecordId+'"></audio><p class="muted">0 unusable · 1 weak · 2 usable con correzione moderata · 3 strong/directly useful</p><div class="score">'+buttons(s.score)+'</div><textarea id="note" placeholder="Nota: cosa manca, cosa è falso, timing, class confusion...">'+s.note+'</textarea><label><input id="attest" type="checkbox" '+(s.reviewerAttested?'checked':'')+'> Ho ascoltato reference e Candidate e confermo il punteggio.</label><div class="row"><button id="prev" '+(idx===0?'disabled':'')+'>Indietro</button><button id="next">Salva e avanti</button></div><p id="err" class="warn"></p></div>';app.querySelectorAll("[data-score]").forEach(b=>b.onclick=()=>{persist();s.score=Number(b.dataset.score);render()});document.getElementById("prev").onclick=()=>{persist();idx--;render()};document.getElementById("next").onclick=()=>{persist();if(s.score===null||!s.reviewerAttested){document.getElementById("err").textContent="Serve il punteggio e la conferma di ascolto.";return}idx++;render()}}
document.getElementById("submit").onclick=async()=>{const payload={schema:"fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-submission-v1",version:1,reviewId:PKG.reviewId,packageDigestSha256:PKG.packageDigestSha256,submittedAt:new Date().toISOString(),families:PKG.families.map(f=>({sourceRecordId:f.sourceRecordId,...answers[f.sourceRecordId]}))};const r=await fetch("/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});document.getElementById("result").textContent=await r.text();if(r.ok)document.getElementById("submit").disabled=true};
(async()=>{PKG=await(await fetch("/package")).json();render()})();
</script></main></body></html>`}

function validateSubmission(doc,pkg){
  if(doc?.schema!=="fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-submission-v1"||doc.version!==1||doc.reviewId!==REVIEW_ID||doc.packageDigestSha256!==pkg.packageDigestSha256||!Array.isArray(doc.families)||doc.families.length!==3)throw new Error("Invalid real-easy review submission");
  const expected=new Set(pkg.families.map(x=>x.sourceRecordId)),seen=new Set();
  for(const item of doc.families){
    if(!expected.has(item.sourceRecordId)||seen.has(item.sourceRecordId))throw new Error("Invalid/duplicate review family");
    seen.add(item.sourceRecordId);
    if(!Number.isInteger(item.score)||item.score<0||item.score>3)throw new Error("Invalid review score");
    if(item.reviewerAttested!==true)throw new Error("Reviewer attestation missing");
  }
  return doc;
}

function finalize(doc){
  const scores=doc.families.map(x=>x.score);
  return {
    medianUsefulness:median(scores),
    familiesAtOrAbove2:scores.filter(x=>x>=2).length,
    totalUsefulness:scores.reduce((a,b)=>a+b,0),
    automaticPromotion:false,
    interpretation:"DESCRIPTIVE_ONLY_REQUIRES_ENGINEERING_DECISION"
  };
}

function openBrowser(url){try{let child;if(process.platform==="win32")child=spawn("cmd.exe",["/c","start","",url],{detached:true,stdio:"ignore"});else if(process.platform==="darwin")child=spawn("open",[url],{detached:true,stdio:"ignore"});else child=spawn("xdg-open",[url],{detached:true,stdio:"ignore"});child.unref()}catch{}}

function serve(workspaceRoot,port=0){
  const workspace=path.resolve(workspaceRoot);
  validateRun(workspace);
  const root=reviewRoot(workspace),packageFile=path.join(root,"review-package.json");
  if(!fs.existsSync(packageFile))throw new Error("Human Review package missing; run prepare first");
  const pkg=readJson(packageFile),publicPkg={...pkg,packageDigestSha256:sha256File(packageFile)};
  const submissionFile=path.join(root,"submission.json"),reportFile=path.join(root,"report.json");
  if(fs.existsSync(submissionFile)||fs.existsSync(reportFile))throw new Error("Human Review already finalized");
  const cache=new Map();
  const server=http.createServer((req,res)=>{
    try{
      const url=new URL(req.url,"http://127.0.0.1");
      if(req.method==="GET"&&url.pathname==="/"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});return res.end(html())}
      if(req.method==="GET"&&url.pathname==="/package"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});return res.end(stableJson(publicPkg))}
      const parts=url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if((req.method==="GET"||req.method==="HEAD")&&parts.length===2&&parts[0]==="reference"){
        const file=sourceStemPath(workspace,parts[1]);return sendFile(req,res,file);
      }
      if((req.method==="GET"||req.method==="HEAD")&&parts.length===2&&parts[0]==="candidate"){
        const rid=parts[1];let wav=cache.get(rid);
        if(!wav){
          const result=readJson(path.join(runRoot(workspace),rid,"result.json"));
          const reference=sourceStemPath(workspace,rid);
          const duration=wavDurationSeconds(reference);
          wav=renderer.renderDrums(result.events||[],duration);
          cache.set(rid,wav);
        }
        return sendBuffer(req,res,wav);
      }
      if(req.method==="POST"&&url.pathname==="/submit"){
        let body="";req.setEncoding("utf8");
        req.on("data",chunk=>{body+=chunk;if(body.length>1024*1024)req.destroy()});
        return req.on("end",()=>{
          try{
            const doc=validateSubmission(JSON.parse(body),publicPkg),stats=finalize(doc);
            const submission={...doc,descriptiveStats:stats};
            fs.writeFileSync(submissionFile,stableJson(submission),{flag:"wx"});
            const report={
              schema:"fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-report-v1",
              version:1,reviewId:REVIEW_ID,runId:RUN_ID,completedAt:new Date().toISOString(),
              packageDigestSha256:publicPkg.packageDigestSha256,
              submissionDigestSha256:sha256File(submissionFile),records:3,
              descriptiveStats:stats,
              families:doc.families,
              safety:{
                split:"development",originalSourceAudioAccessed:false,
                independentEvaluationAccessed:false,finalHoldoutAccessed:false,
                retuningPerformed:false,trainingAuthorized:false,p6Authorized:false,
                batch131Authorized:false,taskDataReadyMayBeDeclared:false
              },
              nextAction:"ENGINEERING_DECISION_TSUMUGI_REAL_EASY_RESULT"
            };
            fs.writeFileSync(reportFile,stableJson(report),{flag:"wx"});
            res.writeHead(200,{"Content-Type":"application/json"});res.end(stableJson(report));
            setTimeout(()=>server.close(),750);
          }catch(error){res.writeHead(400,{"Content-Type":"text/plain"});res.end(error.message)}
        });
      }
      res.writeHead(404);res.end("Not found");
    }catch(error){res.writeHead(500,{"Content-Type":"text/plain"});res.end(error.message)}
  });
  server.on("listening",()=>{const address=server.address(),bound=address&&typeof address==="object"?address.port:Number(port),url="http://127.0.0.1:"+bound+"/";process.stdout.write(stableJson({mode:"FAME_NEURAL_P5_TSUMUGI_REAL_EASY_HUMAN_REVIEW_SERVER_READY",reviewId:REVIEW_ID,url,records:3,candidateIdentityExposedInUi:false,originalSourceAudioOpenedByThisCommand:false,independentEvaluationAccessedByThisCommand:false,finalHoldoutAccessedByThisCommand:false,trainingAuthorized:false}));openBrowser(url)});
  server.listen(Number(port),"127.0.0.1");
}

function report(workspaceRoot){
  const file=path.join(reviewRoot(path.resolve(workspaceRoot)),"report.json");
  if(!fs.existsSync(file))throw new Error("Tsumugi real-easy Human Review report missing");
  return readJson(file);
}

function main(args=process.argv.slice(2)){
  const[command,workspace,port]=args;
  if(!command||!workspace)throw new Error("Usage: node audio-to-midi-p5-tsumugi-real-easy-human-review.js <prepare|serve|report> <workspace> [port]");
  if(command==="prepare")process.stdout.write(stableJson(prepare(workspace)));
  else if(command==="serve")serve(workspace,port===undefined?0:Number(port));
  else if(command==="report")process.stdout.write(stableJson(report(workspace)));
  else throw new Error("Unknown command");
}
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={protocol,validateRun,prepare,median,validateSubmission,finalize,wavDurationSeconds};
