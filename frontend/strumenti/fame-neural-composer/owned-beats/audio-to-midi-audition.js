"use strict";

const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const cp=require("node:child_process");
const {spawn}=require("node:child_process");
const renderer=require("./audio-to-midi-human-review-v2");

const DEFAULT_WORKSPACE="D:\\FAME_NEURAL";
const DEFAULT_FAMILY="FAME000126";
const BASELINE_RUN="audio-to-midi-development-baseline-v1-001";
const TSUMUGI_RUN="audio-to-midi-p5-tsumugi-real-easy-development-v1-001";
const SS_RUN="source-separation-development-inference-v1-001";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}

function baselineRoot(workspace){
  return path.join(workspace,"runs","audio-to-midi-development-baseline",BASELINE_RUN);
}
function tsumugiRoot(workspace){
  return path.join(workspace,"runs","audio-to-midi-p5-tsumugi-real-easy-development",TSUMUGI_RUN);
}
function ssRoot(workspace){
  return path.join(workspace,"runs","source-separation-development-inference",SS_RUN);
}

function sourceStemPath(workspace,rid,stem){
  const receiptFile=path.join(ssRoot(workspace),"execution-receipt.json");
  if(!fs.existsSync(receiptFile))throw new Error("Source Separation receipt missing: "+receiptFile);
  const receipt=readJson(receiptFile);
  const source=(receipt.sources||[]).find(x=>x.sourceRecordId===rid);
  if(!source)throw new Error("Unknown development sourceRecordId: "+rid);
  const file=path.join(ssRoot(workspace),source.outputRelativePath,stem+".wav");
  if(!fs.existsSync(file))throw new Error("Development "+stem+" stem missing: "+rid);
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
  const bfile=path.join(baselineRoot(workspace),rid,"result.json");
  if(!fs.existsSync(bfile))throw new Error("Baseline result missing: "+bfile);
  const baseline=readJson(bfile);
  if(baseline.sourceRecordId!==rid)throw new Error("Baseline family mismatch");

  const tfile=path.join(tsumugiRoot(workspace),rid,"result.json");
  const tsumugi=fs.existsSync(tfile)?readJson(tfile):null;
  if(tsumugi&&tsumugi.sourceRecordId!==rid)throw new Error("Tsumugi family mismatch");

  const drumsStem=sourceStemPath(workspace,rid,"drums");
  const bassStem=sourceStemPath(workspace,rid,"bass");
  const drumsDuration=wavDurationSeconds(drumsStem);
  const bassDuration=wavDurationSeconds(bassStem);

  const fusion=baseline.drumsBassKickFusion?.events;
  const low=baseline.lowEndPyin?.notes;
  if(!Array.isArray(fusion)||!Array.isArray(low))throw new Error("Baseline result missing fusion/low-end events");

  const tsumugiEvents=tsumugi?.events;
  if(tsumugi&&!Array.isArray(tsumugiEvents))throw new Error("Tsumugi result missing events");

  return {
    rid,baseline,tsumugi,drumsStem,bassStem,drumsDuration,bassDuration,
    fusionWav:renderer.renderDrums(fusion,drumsDuration),
    bassWav:renderer.renderBassNotes(low,bassDuration),
    tsumugiWav:tsumugi?renderer.renderDrums(tsumugiEvents,drumsDuration):null
  };
}

function sendBuffer(req,res,buffer){
  res.writeHead(200,{
    "Content-Type":"audio/wav",
    "Content-Length":String(buffer.length),
    "Cache-Control":"no-store",
    "Accept-Ranges":"none"
  });
  if(req.method==="HEAD")return res.end();
  res.end(buffer);
}

function sendFile(req,res,file){
  const stat=fs.statSync(file);
  res.writeHead(200,{
    "Content-Type":"audio/wav",
    "Content-Length":String(stat.size),
    "Cache-Control":"no-store",
    "Accept-Ranges":"none"
  });
  if(req.method==="HEAD")return res.end();
  fs.createReadStream(file).pipe(res);
}

function html(data){
  const t=data.tsumugi;
  const fusion=data.baseline.drumsBassKickFusion;
  const low=data.baseline.lowEndPyin;
  const tCount=t?.events?.length??0;
  const tRoles=t?.roleCounts||{};
  const fusionRoles=fusion.roleCounts||{};
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FAME Audio→MIDI audition — ${data.rid}</title>
<style>
body{margin:0;background:#0c0f14;color:#eef2f7;font-family:system-ui,Segoe UI,Arial,sans-serif}
main{max-width:980px;margin:auto;padding:24px}.panel{background:#151b23;border:1px solid #2c3744;border-radius:14px;padding:18px;margin:14px 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.muted{color:#9eacba}audio{width:100%}
code{background:#0b0e12;padding:2px 5px;border-radius:5px}.good{color:#9ee493}
@media(max-width:760px){.grid{grid-template-columns:1fr}}
</style></head><body><main>
<h1>FAME Audio→MIDI audition — ${data.rid}</h1>
<p class="muted">Ascolto read-only degli output già esistenti. Il suono Candidate è un renderer neutro: valuta timing, eventi e note, non il timbro.</p>

<div class="panel"><h2>Drums reference</h2><p class="muted">Stem separato già esistente</p><audio controls src="/audio/drums-reference"></audio></div>

<div class="grid">
<div class="panel"><h2>Tsumugi drums</h2>
<p>${t?"Eventi: <b>"+tCount+"</b> · kick "+(tRoles.kick||0)+" · snare "+(tRoles.snare||0)+" · hihat "+(tRoles.hihat||0):"Non disponibile per questa family"}</p>
${t?'<audio controls src="/audio/tsumugi"></audio>':'<p class="muted">Nessun output Tsumugi.</p>'}
</div>
<div class="panel"><h2>Baseline drums + bass kick fusion</h2>
<p>Eventi: <b>${fusion.eventCount}</b> · kick ${fusionRoles.kick||0} · snare ${fusionRoles.snare||0} · hihat ${fusionRoles.hihat||0}</p>
<audio controls src="/audio/fusion"></audio></div>
</div>

<div class="panel"><h2>Bass reference</h2><p class="muted">Stem bass separato già esistente</p><audio controls src="/audio/bass-reference"></audio></div>
<div class="panel"><h2>pYIN low-end MIDI</h2>
<p>Note MIDI: <b>${low.noteCount}</b> · voiced frames ${low.voicedFrameCount}/${low.frameCount}</p>
<audio controls src="/audio/bass-pyin"></audio></div>

<div class="panel"><h2>Cosa ascoltare</h2>
<p>Drums: kick/snare/hi-hat mancanti o inventati, timing e confusioni di ruolo. Bass: note sbagliate, salti di ottava, note estranee e durata delle note.</p>
<p class="good">Nessun file viene modificato e non viene eseguita alcuna nuova trascrizione.</p></div>
</main></body></html>`;
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

function serve(workspaceRoot=DEFAULT_WORKSPACE,rid=DEFAULT_FAMILY,port=0){
  const workspace=path.resolve(workspaceRoot);
  const data=load(workspace,rid);
  const server=http.createServer((req,res)=>{
    try{
      const url=new URL(req.url,"http://127.0.0.1");
      if(req.method==="GET"&&url.pathname==="/"){
        res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});
        return res.end(html(data));
      }
      if((req.method==="GET"||req.method==="HEAD")&&url.pathname==="/audio/drums-reference")return sendFile(req,res,data.drumsStem);
      if((req.method==="GET"||req.method==="HEAD")&&url.pathname==="/audio/bass-reference")return sendFile(req,res,data.bassStem);
      if((req.method==="GET"||req.method==="HEAD")&&url.pathname==="/audio/fusion")return sendBuffer(req,res,data.fusionWav);
      if((req.method==="GET"||req.method==="HEAD")&&url.pathname==="/audio/bass-pyin")return sendBuffer(req,res,data.bassWav);
      if((req.method==="GET"||req.method==="HEAD")&&url.pathname==="/audio/tsumugi"&&data.tsumugiWav)return sendBuffer(req,res,data.tsumugiWav);
      res.writeHead(404);res.end("Not found");
    }catch(error){res.writeHead(500,{"Content-Type":"text/plain"});res.end(error.message)}
  });
  server.listen(port,"127.0.0.1",()=>{
    const addr=server.address();
    const actual=addr&&typeof addr==="object"?addr.port:port;
    const url="http://127.0.0.1:"+actual+"/";
    console.log(JSON.stringify({
      mode:"FAME_AUDIO_TO_MIDI_AUDITION_READY",
      sourceRecordId:rid,
      url,
      readOnly:true,
      transcriptionExecuted:false,
      retuningPerformed:false,
      independentEvaluationAccessed:false,
      finalHoldoutAccessed:false
    },null,2));
    openBrowser(url);
  });
  return server;
}

function selfTest(){
  const d=renderer.renderDrums([{timeSeconds:0.1,role:"kick"}],0.5);
  const b=renderer.renderBassNotes([{startSeconds:0.1,endSeconds:0.3,midiNote:48}],0.5);
  if(d.toString("ascii",0,4)!=="RIFF"||b.toString("ascii",0,4)!=="RIFF")throw new Error("Renderer self-test failed");
  return {mode:"FAME_AUDIO_TO_MIDI_AUDITION_SELF_TEST_PASS",rendererId:renderer.RENDERER_ID};
}

function main(){
  const [cmd="serve",workspace=DEFAULT_WORKSPACE,rid=DEFAULT_FAMILY,portRaw="0"]=process.argv.slice(2);
  if(cmd==="self-test")return console.log(JSON.stringify(selfTest(),null,2));
  if(cmd!=="serve")throw new Error("Usage: node audio-to-midi-audition.js serve [workspace] [sourceRecordId] [port]");
  const port=Number(portRaw);
  if(!Number.isInteger(port)||port<0||port>65535)throw new Error("Invalid port");
  serve(workspace,rid,port);
}

if(require.main===module){
  try{main()}catch(error){console.error("FAME AUDIO TO MIDI AUDITION FAILED: "+error.message);process.exit(1)}
}

module.exports={load,serve,selfTest,DEFAULT_FAMILY};
