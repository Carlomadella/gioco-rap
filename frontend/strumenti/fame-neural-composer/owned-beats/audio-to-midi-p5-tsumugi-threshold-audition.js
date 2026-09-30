"use strict";

const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const cp=require("node:child_process");
const {spawn}=require("node:child_process");
const pitchRenderer=require("./audio-to-midi-drum-pitch-renderer");

const DEFAULT_WORKSPACE="D:\\FAME_NEURAL";
const DEFAULT_FAMILY="FAME000126";
const RUN_ID="audio-to-midi-p5-tsumugi-threshold-sweep-v1-001";
const SS_RUN_ID="source-separation-development-inference-v1-001";
const THRESHOLDS=[
  {value:-3,slug:"neg3p0"},
  {value:-2,slug:"neg2p0"},
  {value:-1,slug:"neg1p0"},
  {value:0,slug:"pos0p0"}
];
const FAMILIES=["FAME000040","FAME000080","FAME000126"];

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}

function runRoot(workspace){
  return path.join(workspace,"runs","audio-to-midi-p5-tsumugi-threshold-sweep",RUN_ID);
}
function ssRoot(workspace){
  return path.join(workspace,"runs","source-separation-development-inference",SS_RUN_ID);
}
function sourceStemPath(workspace,rid){
  const receipt=readJson(path.join(ssRoot(workspace),"execution-receipt.json"));
  const source=(receipt.sources||[]).find(x=>x.sourceRecordId===rid);
  if(!source)throw new Error("Unknown development sourceRecordId: "+rid);
  const file=path.join(ssRoot(workspace),source.outputRelativePath,"drums.wav");
  if(!fs.existsSync(file))throw new Error("Development drums stem missing: "+rid);
  return file;
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

function load(workspace,rid){
  if(!FAMILIES.includes(rid))throw new Error("Unsupported family for frozen sweep: "+rid);
  const root=runRoot(workspace);
  const summaryFile=path.join(root,"summary.json");
  if(!fs.existsSync(summaryFile))throw new Error("Threshold sweep summary missing; run the sweep first");
  const summary=readJson(summaryFile);
  if(summary.status!=="DEVELOPMENT_THRESHOLD_SWEEP_COMPLETE_AWAITING_HUMAN_REVIEW"||
     summary.runId!==RUN_ID||summary.records!==12){
    throw new Error("Threshold sweep summary mismatch");
  }

  const reference=sourceStemPath(workspace,rid);
  const duration=wavDurationSeconds(reference);
  const variants=THRESHOLDS.map(t=>{
    const resultFile=path.join(root,t.slug,rid,"result.json");
    if(!fs.existsSync(resultFile))throw new Error("Threshold result missing: "+resultFile);
    const result=readJson(resultFile);
    if(result.sourceRecordId!==rid||Number(result.instrumentPairGateThreshold)!==t.value){
      throw new Error("Threshold result identity mismatch: "+rid+" / "+t.value);
    }
    const events=result.events||[];
    const pitchSummary=pitchRenderer.summarize(events);
    return {
      ...t,
      eventCount:result.rawPredictedNoteCount,
      distinctPitchCount:result.distinctCanonicalPitchCount,
      unsupportedOutputPitchCount:result.unsupportedOutputPitchCount,
      supportedRoleCounts:result.supportedRoleCounts||{},
      pitchSummary,
      wav:pitchRenderer.render(events,duration)
    };
  });
  return {rid,reference,duration,variants};
}

function sendFile(req,res,file){
  const stat=fs.statSync(file);
  res.writeHead(200,{
    "Content-Type":"audio/wav","Content-Length":String(stat.size),
    "Cache-Control":"no-store","Accept-Ranges":"none"
  });
  if(req.method==="HEAD")return res.end();
  fs.createReadStream(file).pipe(res);
}
function sendBuffer(req,res,buffer){
  res.writeHead(200,{
    "Content-Type":"audio/wav","Content-Length":String(buffer.length),
    "Cache-Control":"no-store","Accept-Ranges":"none"
  });
  if(req.method==="HEAD")return res.end();
  res.end(buffer);
}
function esc(value){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function table(rows){
  if(!rows.length)return '<p class="muted">Nessun pitch emesso.</p>';
  return '<table><thead><tr><th>Pitch</th><th>GM</th><th>Famiglia</th><th>Eventi</th></tr></thead><tbody>'+
    rows.map(x=>'<tr><td>'+x.pitch+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.family)+'</td><td>'+x.count+'</td></tr>').join("")+
    '</tbody></table>';
}
function variantCard(v){
  const roles=v.supportedRoleCounts||{};
  return '<section class="panel">'+
    '<h2>Gate '+v.value.toFixed(1)+'</h2>'+
    '<p>Eventi: <b>'+v.eventCount+'</b> · pitch distinti: <b>'+v.distinctPitchCount+'</b> · legacy-unsupported: <b>'+v.unsupportedOutputPitchCount+'</b></p>'+
    '<p class="muted">Core legacy: kick '+(roles.kick||0)+' · snare '+(roles.snare||0)+' · hihat '+(roles.hihat||0)+'</p>'+
    '<audio controls preload="none" src="/audio/'+v.slug+'"></audio>'+
    table(v.pitchSummary)+
  '</section>';
}
function html(data){
  const nav=FAMILIES.map(id=>'<a class="'+(id===data.rid?'active':'')+'" href="/?family='+id+'">'+id+'</a>').join("");
  return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>FAME Tsumugi threshold audition</title><style>'+
  'body{margin:0;background:#0c0f14;color:#eef2f7;font-family:system-ui,Segoe UI,Arial,sans-serif}main{max-width:1180px;margin:auto;padding:24px}'+
  '.panel{background:#151b23;border:1px solid #2c3744;border-radius:14px;padding:18px;margin:14px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}'+
  '.muted{color:#9eacba}.nav{display:flex;gap:8px;flex-wrap:wrap}.nav a{color:#dbe7f3;text-decoration:none;border:1px solid #3a4655;border-radius:8px;padding:7px 11px}.nav a.active{background:#edf2f7;color:#111;font-weight:800}'+
  'audio{width:100%;margin:7px 0 10px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:5px 7px;border-bottom:1px solid #2c3744}th{color:#9eacba}'+
  '.warn{color:#ffd27a}@media(max-width:820px){.grid{grid-template-columns:1fr}}</style></head><body><main>'+
  '<h1>Tsumugi threshold audition — '+esc(data.rid)+'</h1>'+
  '<div class="nav">'+nav+'</div>'+
  '<section class="panel"><h2>Reference drums stem</h2><audio controls preload="none" src="/audio/reference"></audio>'+
  '<p class="muted">Ascolta prima questo, poi i quattro candidati. Il renderer usa i pitch GM realmente emessi da Tsumugi.</p></section>'+
  '<div class="grid">'+data.variants.map(variantCard).join("")+'</div>'+
  '<section class="panel"><h2>Decisione</h2><p class="warn">Non scegliere la soglia con meno note in assoluto: serve quella che elimina classi/colpi falsi senza perdere i colpi realmente presenti nel reference.</p>'+
  '<p>Nessuna nuova inferenza viene eseguita da questa pagina; legge soltanto lo sweep già completato.</p></section>'+
  '</main></body></html>';
}

function openBrowser(url){
  try{
    let child;
    if(process.platform==="win32")child=spawn("cmd.exe",["/c","start","",url],{detached:true,stdio:"ignore"});
    else if(process.platform==="darwin")child=spawn("open",[url],{detached:true,stdio:"ignore"});
    else child=spawn("xdg-open",[url],{detached:true,stdio:"ignore"});
    child.unref();
  }catch{}
}

function serve(workspaceRoot=DEFAULT_WORKSPACE,defaultFamily=DEFAULT_FAMILY,port=0){
  const workspace=path.resolve(workspaceRoot);
  // Validate the default family immediately so launcher fails early.
  load(workspace,defaultFamily);
  const cache=new Map();
  function familyData(rid){
    if(!cache.has(rid))cache.set(rid,load(workspace,rid));
    return cache.get(rid);
  }
  const server=http.createServer((req,res)=>{
    try{
      const url=new URL(req.url,"http://127.0.0.1");
      const rid=url.searchParams.get("family")||defaultFamily;
      const data=familyData(rid);
      if(req.method==="GET"&&url.pathname==="/"){
        res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});
        return res.end(html(data));
      }
      if((req.method==="GET"||req.method==="HEAD")&&url.pathname==="/audio/reference"){
        return sendFile(req,res,data.reference);
      }
      const parts=url.pathname.split("/").filter(Boolean);
      if((req.method==="GET"||req.method==="HEAD")&&parts.length===2&&parts[0]==="audio"){
        const variant=data.variants.find(x=>x.slug===parts[1]);
        if(variant)return sendBuffer(req,res,variant.wav);
      }
      res.writeHead(404);res.end("Not found");
    }catch(error){res.writeHead(500,{"Content-Type":"text/plain"});res.end(error.message)}
  });
  server.listen(port,"127.0.0.1",()=>{
    const addr=server.address(),actual=addr&&typeof addr==="object"?addr.port:port;
    const url="http://127.0.0.1:"+actual+"/?family="+encodeURIComponent(defaultFamily);
    console.log(JSON.stringify({
      mode:"FAME_TSUMUGI_THRESHOLD_AUDITION_READY",
      sourceRecordId:defaultFamily,
      thresholds:THRESHOLDS.map(x=>x.value),
      url,
      readOnly:true,
      transcriptionExecuted:false,
      independentEvaluationAccessed:false,
      finalHoldoutAccessed:false
    },null,2));
    openBrowser(url);
  });
  return server;
}

function selfTest(){
  const rows=pitchRenderer.summarize([
    {timeSeconds:0.1,canonicalPitch:36},
    {timeSeconds:0.2,canonicalPitch:39},
    {timeSeconds:0.3,canonicalPitch:42}
  ]);
  if(rows.length!==3||THRESHOLDS.length!==4||FAMILIES.length!==3)throw new Error("Threshold audition self-test failed");
  return {mode:"FAME_TSUMUGI_THRESHOLD_AUDITION_SELF_TEST_PASS",thresholds:THRESHOLDS.map(x=>x.value),families:FAMILIES};
}

function main(){
  const [cmd="serve",workspace=DEFAULT_WORKSPACE,family=DEFAULT_FAMILY,portRaw="0"]=process.argv.slice(2);
  if(cmd==="self-test")return console.log(JSON.stringify(selfTest(),null,2));
  if(cmd!=="serve")throw new Error("Usage: node audio-to-midi-p5-tsumugi-threshold-audition.js serve [workspace] [family] [port]");
  const port=Number(portRaw);
  if(!Number.isInteger(port)||port<0||port>65535)throw new Error("Invalid port");
  serve(workspace,family,port);
}

if(require.main===module){
  try{main()}catch(error){console.error("FAME TSUMUGI THRESHOLD AUDITION FAILED: "+error.message);process.exit(1)}
}

module.exports={THRESHOLDS,FAMILIES,selfTest,load};
