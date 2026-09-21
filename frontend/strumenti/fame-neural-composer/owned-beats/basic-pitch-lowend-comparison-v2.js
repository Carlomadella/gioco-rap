"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");
const media=require("./audio-to-midi-human-review.js");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"basic-pitch-lowend-comparison-v2.json");
const QA_FILE=path.join(HERE,"basic-pitch-development-qa.py");

const REVIEW_ID="basic-pitch-lowend-blind-comparison-v1-002";
const PRIOR_REVIEW_ID="basic-pitch-lowend-blind-comparison-v1-001";
const BASELINE_RUN_ID="audio-to-midi-development-baseline-v1-001";
const BASIC_PITCH_RUN_ID="basic-pitch-development-inference-v1-003";
const SOURCE_SEP_RUN_ID="source-separation-development-inference-v1-001";
const PRIOR_AUDIO_TO_MIDI_REVIEW_ID="audio-to-midi-human-review-v1-001";

const PACKAGE_SCHEMA="fame-owned-beats-basic-pitch-lowend-comparison-package-v2";
const SUBMISSION_SCHEMA="fame-owned-beats-basic-pitch-lowend-comparison-submission-v2";
const REPORT_SCHEMA="fame-owned-beats-basic-pitch-lowend-comparison-report-v2";
const BLIND_KEY_SCHEMA="fame-owned-beats-basic-pitch-lowend-comparison-blind-key-v2";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function stableJson(v){return JSON.stringify(v,null,2)+"\n"}
function sha256File(file){return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}
function median(values){const s=values.slice().sort((a,b)=>a-b),m=s.length/2;return s.length%2?s[Math.floor(m)]:(s[m-1]+s[m])/2}
function safeId(v,label){if(typeof v!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{2,99}$/.test(v))throw new Error(label+" invalid");return v}
function reviewRoot(workspace,reviewId=REVIEW_ID){return path.join(workspace,"reviews","basic-pitch-lowend-comparison",safeId(reviewId,"review-id"))}
function baselineRoot(workspace){return path.join(workspace,"runs","audio-to-midi-development-baseline",BASELINE_RUN_ID)}
function basicPitchRoot(workspace){return path.join(workspace,"runs","basic-pitch-development-inference",BASIC_PITCH_RUN_ID)}
function sourceSepRoot(workspace){return path.join(workspace,"runs","source-separation-development-inference",SOURCE_SEP_RUN_ID)}

function protocol(){
 const p=readJson(PROTOCOL_FILE);
 if(
   p.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-v2"||
   p.version!==2||
   p.status!=="FROZEN_BEFORE_FIRST_SUPERSEDING_LOW_END_COMPARISON_LISTENING"||
   p.reviewId!==REVIEW_ID||
   p.split!=="development"||
   p.expectedFamilies!==8||
   p.baseline?.armId!=="librosa-pyin-lowend-v1"||
   p.baseline?.runId!==BASELINE_RUN_ID||
   p.candidate?.armId!=="basic-pitch-0.4.0-lowend-v1"||
   p.candidate?.runId!==BASIC_PITCH_RUN_ID||
   p.blindness?.balancedAB!==true||
   p.blindness?.armIdentityExposedDuringReview!==false||
   p.renderer?.sameNeutralOscillatorForBothArms!==true||
   p.renderer?.basicPitchPitchBendUnitsPerSemitone!==3||
   p.renderer?.outputDurationSource!=="reference-bass-stem"||
   p.renderer?.outputDurationMustMatchReference!==true||
   p.renderer?.silenceAfterLastDetectedEventPreserved!==true||
   p.qualification?.medianUsefulnessAtLeast!==2||
   p.qualification?.familiesAtOrAbove2AtLeast!==6||
   p.safety?.finalHoldoutAllowed!==false||
   p.safety?.batch131Allowed!==false||
   p.safety?.trainingAuthorized!==false||
   p.safety?.taskDataReadyMayBeDeclared!==false
 ) throw new Error("Frozen Basic Pitch low-end comparison protocol invalid");
 return p;
}

function runTechnicalQa(workspace){
 const python=path.join(workspace,"venv-basic-pitch","Scripts","python.exe");
 if(!fs.existsSync(python))throw new Error("Basic Pitch venv Python missing: "+python);
 const proc=spawnSync(python,[QA_FILE,"technical",workspace],{encoding:"utf8",windowsHide:true,maxBuffer:16*1024*1024});
 if(proc.status!==0)throw new Error("Basic Pitch technical QA failed: "+String(proc.stderr||proc.stdout||"").trim());
 const qa=JSON.parse(String(proc.stdout).trim());
 if(
   qa.mode!=="BASIC_PITCH_DEVELOPMENT_TECHNICAL_QA_PASS"||
   qa.technicalGate!=="ALL_8_FAMILIES_PASS"||
   qa.recordsVerified!==8||
   qa.midiFilesVerified!==8||
   qa.basicPitchInferenceExecutedByThisCommand!==false||
   qa.finalHoldoutAccessedByThisCommand!==false||
   qa.batch131AccessedByThisCommand!==false||
   qa.trainingAuthorized!==false
 ) throw new Error("Basic Pitch technical QA output is not eligible for Human Review");
 return qa;
}

function validatePriorHumanReview(workspace,p){
 const file=path.join(workspace,"reviews","audio-to-midi-development",PRIOR_AUDIO_TO_MIDI_REVIEW_ID,"report.json");
 if(!fs.existsSync(file))throw new Error("Prior Audio→MIDI Human Review report missing");
 const report=readJson(file);
 if(
   report.schema!=="fame-owned-beats-audio-to-midi-human-review-report-v1"||
   report.reviewId!==PRIOR_AUDIO_TO_MIDI_REVIEW_ID||
   report.records!==8||
   report.submissionDigestSha256!==p.baseline.priorHumanReviewSubmissionDigestSha256||
   report.gate?.technical!=="ALL_8_FAMILIES_PASS"||
   report.gate?.drums?.selectedArm!=="drums-bass-kick-fusion-v1"||
   report.gate?.drums?.pass!==true||
   report.gate?.lowEnd?.armId!=="librosa-pyin-lowend-v1"||
   report.gate?.lowEnd?.pass!==true||
   report.gate?.pass!==true||
   report.safety?.finalHoldoutAccessed!==false||
   report.safety?.batch131Accessed!==false||
   report.safety?.trainingAuthorized!==false
 ) throw new Error("Prior Audio→MIDI Human Review prerequisite mismatch");
 return report;
}

function basicPitchSummary(workspace){
 const file=path.join(basicPitchRoot(workspace),"inference-summary.json");
 if(!fs.existsSync(file))throw new Error("Basic Pitch v1-003 summary missing");
 const summary=readJson(file);
 if(
   summary.schema!=="fame-owned-beats-basic-pitch-development-inference-summary-v3"||
   summary.version!==3||
   summary.status!=="INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"||
   summary.runId!==BASIC_PITCH_RUN_ID||
   summary.records!==8||
   !Array.isArray(summary.results)||summary.results.length!==8
 ) throw new Error("Basic Pitch v1-003 summary invalid for comparison");
 return{file,summary};
}

function balancedBlindMap(ids){
 const ranked=ids.map(id=>({id,hash:crypto.createHash("sha256").update(REVIEW_ID+"|"+id).digest("hex")})).sort((a,b)=>a.hash.localeCompare(b.hash));
 const baselineAsA=new Set(ranked.slice(0,Math.floor(ids.length/2)).map(x=>x.id));
 const out={};
 for(const id of ids){
   out[id]=baselineAsA.has(id)
     ?{A:"librosa-pyin-lowend-v1",B:"basic-pitch-0.4.0-lowend-v1"}
     :{A:"basic-pitch-0.4.0-lowend-v1",B:"librosa-pyin-lowend-v1"};
 }
 return out;
}

function sourceStemPath(workspace,rid){
 const receipt=readJson(path.join(sourceSepRoot(workspace),"execution-receipt.json"));
 const source=receipt.sources.find(x=>x.sourceRecordId===rid);
 if(!source)throw new Error("Unknown Source Separation record: "+rid);
 const file=path.join(sourceSepRoot(workspace),source.outputRelativePath,"bass.wav");
 if(!fs.existsSync(file))throw new Error("Bass reference stem missing: "+rid);
 return file;
}

function wavDurationSeconds(file){
 const fd=fs.openSync(file,"r");
 try{
   const stat=fs.fstatSync(fd);
   const riff=Buffer.alloc(12);
   if(fs.readSync(fd,riff,0,12,0)!==12||riff.toString("ascii",0,4)!=="RIFF"||riff.toString("ascii",8,12)!=="WAVE")throw new Error("Unsupported WAV reference: "+file);
   let offset=12,byteRate=null,dataBytes=null;
   while(offset+8<=stat.size){
     const header=Buffer.alloc(8);
     if(fs.readSync(fd,header,0,8,offset)!==8)break;
     const id=header.toString("ascii",0,4),size=header.readUInt32LE(4),payload=offset+8;
     if(id==="fmt "){
       if(size<16)throw new Error("Invalid WAV fmt chunk: "+file);
       const fmt=Buffer.alloc(16);if(fs.readSync(fd,fmt,0,16,payload)!==16)throw new Error("Truncated WAV fmt chunk: "+file);
       byteRate=fmt.readUInt32LE(8);
     }else if(id==="data"){
       dataBytes=size;
     }
     if(byteRate&&dataBytes!==null)break;
     offset=payload+size+(size%2);
   }
   if(!byteRate||dataBytes===null)throw new Error("WAV duration metadata missing: "+file);
   const seconds=dataBytes/byteRate;
   if(!Number.isFinite(seconds)||seconds<=0)throw new Error("Invalid WAV duration: "+file);
   return seconds;
 }finally{fs.closeSync(fd)}
}

function markPriorComparisonSuperseded(workspace){
 const root=reviewRoot(workspace,PRIOR_REVIEW_ID);
 if(!fs.existsSync(root))throw new Error("Prior low-end comparison package missing: "+root);

 const packageFile=path.join(root,"review-package.json");
 const blindKeyFile=path.join(root,"blind-key.json");
 const submissionFile=path.join(root,"submission.json");
 const reportFile=path.join(root,"report.json");
 if(!fs.existsSync(packageFile)||!fs.existsSync(blindKeyFile))throw new Error("Prior low-end comparison core artifacts missing");

 const pkg=readJson(packageFile),key=readJson(blindKeyFile);
 if(
   pkg.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-package-v1"||
   pkg.version!==1||
   pkg.reviewId!==PRIOR_REVIEW_ID||
   key.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-blind-key-v1"||
   key.version!==1||
   key.reviewId!==PRIOR_REVIEW_ID
 ) throw new Error("Prior low-end comparison core artifacts are not the frozen v1 review");

 const submissionExists=fs.existsSync(submissionFile);
 const reportExists=fs.existsSync(reportFile);
 let submission=null,report=null;
 if(submissionExists){
   submission=readJson(submissionFile);
   if(
     submission.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-submission-v1"||
     submission.version!==1||
     submission.reviewId!==PRIOR_REVIEW_ID
   ) throw new Error("Prior low-end comparison submission is invalid");
 }
 if(reportExists){
   report=readJson(reportFile);
   if(
     report.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-report-v1"||
     report.version!==1||
     report.reviewId!==PRIOR_REVIEW_ID||
     report.packageDigestSha256!==sha256File(packageFile)||
     !submissionExists||
     report.submissionDigestSha256!==sha256File(submissionFile)
   ) throw new Error("Prior low-end comparison report is invalid");
 }

 const marker=path.join(root,"superseded-invalid-review.json");
 const payload={
   schema:"fame-owned-beats-basic-pitch-lowend-comparison-superseded-invalid-v1",
   version:1,
   reviewId:PRIOR_REVIEW_ID,
   status:"SUPERSEDED_INVALID_RENDER_DURATION",
   recordedAt:new Date().toISOString(),
   defectCode:"CANDIDATE_RENDER_DURATION_TRUNCATED_TO_LAST_DETECTED_EVENT",
   observedIssue:"Candidate duration was derived from the last detected event instead of the reference bass stem duration.",
   priorState:reportExists?"FINALIZED":submissionExists?"SUBMISSION_ONLY":"UNFINALIZED",
   preservedArtifacts:{
     reviewPackageSha256:sha256File(packageFile),
     blindKeySha256:sha256File(blindKeyFile),
     submissionSha256:submissionExists?sha256File(submissionFile):null,
     reportSha256:reportExists?sha256File(reportFile):null
   },
   gateFromInvalidReviewIgnored:true,
   scoresCopiedToSupersedingReview:false,
   supersededByReviewId:REVIEW_ID
 };
 if(fs.existsSync(marker)){
   const existing=readJson(marker);
   if(
     existing.schema!==payload.schema||
     existing.reviewId!==PRIOR_REVIEW_ID||
     existing.supersededByReviewId!==REVIEW_ID||
     existing.defectCode!==payload.defectCode||
     existing.preservedArtifacts?.reviewPackageSha256!==payload.preservedArtifacts.reviewPackageSha256||
     existing.preservedArtifacts?.submissionSha256!==payload.preservedArtifacts.submissionSha256||
     existing.preservedArtifacts?.reportSha256!==payload.preservedArtifacts.reportSha256
   ) throw new Error("Prior invalid-review marker incompatible with preserved artifacts");
   return{file:marker,payload:existing};
 }
 fs.writeFileSync(marker,stableJson(payload),{flag:"wx"});
 return{file:marker,payload};
}
function pyinResult(workspace,rid){return readJson(path.join(baselineRoot(workspace),rid,"result.json"))}
function bpResult(workspace,rid){return readJson(path.join(basicPitchRoot(workspace),"outputs",rid,"result.json"))}

function wavHeader(dataBytes,sampleRate=22050){const b=Buffer.alloc(44);b.write("RIFF",0,"ascii");b.writeUInt32LE(36+dataBytes,4);b.write("WAVE",8,"ascii");b.write("fmt ",12,"ascii");b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write("data",36,"ascii");b.writeUInt32LE(dataBytes,40);return b}
function toWav(samples,sr=22050){let peak=0;for(const v of samples)peak=Math.max(peak,Math.abs(v));const scale=peak>0.98?0.98/peak:1,pcm=Buffer.alloc(samples.length*2);for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]*scale));pcm.writeInt16LE(Math.round(x*32767),i*2)}return Buffer.concat([wavHeader(pcm.length,sr),pcm])}
function midiHz(note){return 440*Math.pow(2,(note-69)/12)}

function addNeutralNote(samples,sr,startSeconds,endSeconds,frequencyAt,p){
 const start=Math.max(0,Math.floor(startSeconds*sr)),stop=Math.min(samples.length,Math.ceil(endSeconds*sr));
 let phase=0;
 for(let i=start;i<stop;i++){
   const t=i/sr,attack=Math.max(1e-6,p.renderer.attackSeconds),release=Math.max(1e-6,p.renderer.releaseSeconds);
   const env=Math.max(0,Math.min(1,(t-startSeconds)/attack,(endSeconds-t)/release));
   const f=frequencyAt(t);
   if(!Number.isFinite(f)||f<=0)continue;
   phase+=2*Math.PI*f/sr;
   samples[i]+=env*(p.renderer.fundamentalGain*Math.sin(phase)+p.renderer.secondHarmonicGain*Math.sin(2*phase));
 }
}

function renderPyin(result,p,durationSeconds,sr=p.renderer.sampleRate){
 const low=result.lowEndPyin;
 if(!low||!Array.isArray(low.notes)||!Array.isArray(low.pitchContour))throw new Error("pYIN result invalid");
 if(!Number.isFinite(durationSeconds)||durationSeconds<=0)throw new Error("Invalid reference duration for pYIN render");
 const samples=new Float32Array(Math.ceil(durationSeconds*sr));
 const contour=low.pitchContour;
 for(const note of low.notes){
   const points=contour.filter(x=>x.timeSeconds>=note.startSeconds&&x.timeSeconds<=note.endSeconds);
   let cursor=0;
   const freqAt=t=>{
     if(!points.length)return midiHz(note.midiNote);
     while(cursor+1<points.length&&points[cursor+1].timeSeconds<t)cursor++;
     if(cursor+1>=points.length)return points[cursor].frequencyHz;
     const a=points[cursor],b=points[cursor+1],gap=b.timeSeconds-a.timeSeconds;
     if(gap<=0)return a.frequencyHz;
     const u=Math.max(0,Math.min(1,(t-a.timeSeconds)/gap));
     return a.frequencyHz+(b.frequencyHz-a.frequencyHz)*u;
   };
   addNeutralNote(samples,sr,note.startSeconds,note.endSeconds,freqAt,p);
 }
 return toWav(samples,sr);
}

function renderBasicPitch(result,p,durationSeconds,sr=p.renderer.sampleRate){
 const events=result.noteEvents;
 if(!Array.isArray(events))throw new Error("Basic Pitch note events invalid");
 if(!Number.isFinite(durationSeconds)||durationSeconds<=0)throw new Error("Invalid reference duration for Basic Pitch render");
 const samples=new Float32Array(Math.ceil(durationSeconds*sr));
 for(const note of events){
   const bends=Array.isArray(note.pitchBends)?note.pitchBends:null;
   const freqAt=t=>{
     let bend=0;
     if(bends&&bends.length){
       if(bends.length===1)bend=bends[0];
       else{
         const u=Math.max(0,Math.min(1,(t-note.startSeconds)/(note.endSeconds-note.startSeconds)));
         const pos=u*(bends.length-1),i=Math.floor(pos),j=Math.min(bends.length-1,i+1),mix=pos-i;
         bend=bends[i]+(bends[j]-bends[i])*mix;
       }
     }
     return midiHz(note.midiNote+bend/p.renderer.basicPitchPitchBendUnitsPerSemitone);
   };
   addNeutralNote(samples,sr,note.startSeconds,note.endSeconds,freqAt,p);
 }
 return toWav(samples,sr);
}

function computeArmStats(values,q){
 const scores=values.map(x=>x.score),med=median(scores),atLeast=scores.filter(x=>x>=2).length;
 return{medianUsefulness:med,familiesAtOrAbove2:atLeast,totalUsefulness:scores.reduce((a,b)=>a+b,0),pass:med>=q.medianUsefulnessAtLeast&&atLeast>=q.familiesAtOrAbove2AtLeast};
}
function chooseLowEnd(stats){
 const eligible=Object.entries(stats).filter(([,v])=>v.pass);
 if(!eligible.length)return null;
 eligible.sort((a,b)=>{
   if(b[1].medianUsefulness!==a[1].medianUsefulness)return b[1].medianUsefulness-a[1].medianUsefulness;
   if(b[1].familiesAtOrAbove2!==a[1].familiesAtOrAbove2)return b[1].familiesAtOrAbove2-a[1].familiesAtOrAbove2;
   if(b[1].totalUsefulness!==a[1].totalUsefulness)return b[1].totalUsefulness-a[1].totalUsefulness;
   if(a[0]==="librosa-pyin-lowend-v1")return-1;
   if(b[0]==="librosa-pyin-lowend-v1")return 1;
   return a[0].localeCompare(b[0]);
 });
 return eligible[0][0];
}

function validateSubmission(doc,pkg){
 if(doc?.schema!==SUBMISSION_SCHEMA||doc.version!==2||doc.reviewId!==pkg.reviewId||doc.packageDigestSha256!==pkg.packageDigestSha256||!Array.isArray(doc.families)||doc.families.length!==8)throw new Error("Invalid low-end comparison submission envelope");
 const ids=new Set(pkg.families.map(x=>x.sourceRecordId)),seen=new Set();
 for(const item of doc.families){
   if(!ids.has(item.sourceRecordId)||seen.has(item.sourceRecordId))throw new Error("Invalid/duplicate family");
   seen.add(item.sourceRecordId);
   for(const label of["A","B"]){
     const score=item.candidates?.[label]?.score;
     if(!Number.isInteger(score)||score<0||score>3)throw new Error("Invalid candidate score");
   }
   if(item.reviewerAttested!==true)throw new Error("Reviewer attestation missing");
 }
 return doc;
}

function finalizeSubmission(doc,pkg,key,p){
 validateSubmission(doc,pkg);
 const byArm={"librosa-pyin-lowend-v1":[],"basic-pitch-0.4.0-lowend-v1":[]},families=[];
 for(const item of doc.families){
   const mapping=key.mapping[item.sourceRecordId],out={sourceRecordId:item.sourceRecordId,candidates:{},reviewerAttested:true};
   for(const label of["A","B"]){
     const armId=mapping[label],answer=item.candidates[label];
     byArm[armId].push({sourceRecordId:item.sourceRecordId,score:answer.score,note:answer.note||""});
     out.candidates[label]={armId,score:answer.score,note:answer.note||""};
   }
   families.push(out);
 }
 const stats={
   "librosa-pyin-lowend-v1":computeArmStats(byArm["librosa-pyin-lowend-v1"],p.qualification),
   "basic-pitch-0.4.0-lowend-v1":computeArmStats(byArm["basic-pitch-0.4.0-lowend-v1"],p.qualification)
 };
 const selected=chooseLowEnd(stats);
 const outcome=selected==="basic-pitch-0.4.0-lowend-v1"?"PROMOTE_BASIC_PITCH_LOW_END":selected==="librosa-pyin-lowend-v1"?"KEEP_PYIN_LOW_END":"KEEP_LOW_END_UNPROMOTED_AND_REVIEW_METHOD";
 return{families,gate:{technical:"ALL_8_FAMILIES_PASS",lowEndComparison:{arms:stats,selectedArm:selected,pass:selected!==null},pass:selected!==null,outcome}};
}

function html(){return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FAME Low-End Blind Comparison</title><style>
body{margin:0;background:#0b0e12;color:#edf2f7;font-family:system-ui,Segoe UI,Arial,sans-serif}main{max-width:980px;margin:auto;padding:24px}.panel{background:#141a22;border:1px solid #2d3744;border-radius:14px;padding:18px;margin:14px 0}.muted{color:#9aa8b6}audio{width:100%;margin:6px 0 14px}.score{display:flex;gap:8px;flex-wrap:wrap}.score button,button{background:#202936;border:1px solid #46566a;color:white;padding:9px 14px;border-radius:8px;cursor:pointer}.score button.sel{background:white;color:#111;font-weight:800}textarea{width:100%;min-height:58px;background:#0e1319;color:white;border:1px solid #354252;border-radius:8px;padding:8px;box-sizing:border-box}.row{display:flex;justify-content:space-between;gap:12px;align-items:center}.progress{height:7px;background:#202733;border-radius:8px}.bar{height:100%;background:#eef2f5;width:0;border-radius:8px}.hidden{display:none}ul{line-height:1.6}</style></head><body><main>
<h1>FAME — Blind Low-End Comparison</h1><p class="muted">Confronta A e B contro lo stesso bass stem. L'identità dei due metodi resta nascosta fino alla consegna.</p><div class="progress"><div id="bar" class="bar"></div></div><div id="app"></div><div id="done" class="panel hidden"><h2>Review completa</h2><button id="submit">Salva e calcola gate</button><pre id="result"></pre></div>
<script>
let PKG,idx=0,answers={};const app=document.getElementById("app");
function state(id){return answers[id]||(answers[id]={candidates:{A:{score:null,note:""},B:{score:null,note:""}},reviewerAttested:false})}
function buttons(label,value){return [0,1,2,3].map(n=>'<button data-label="'+label+'" data-score="'+n+'" class="'+(value===n?'sel':'')+'">'+n+'</button>').join('')}
function persist(){if(idx>=PKG.families.length)return;const s=state(PKG.families[idx].sourceRecordId);s.candidates.A.note=document.getElementById('noteA').value;s.candidates.B.note=document.getElementById('noteB').value;s.reviewerAttested=document.getElementById('attest').checked}
function render(){if(idx>=PKG.families.length){app.innerHTML='';document.getElementById('done').classList.remove('hidden');document.getElementById('bar').style.width='100%';return}
 const f=PKG.families[idx],s=state(f.sourceRecordId),criteria=PKG.criteria.map(x=>'<li>'+x+'</li>').join('');
 document.getElementById('bar').style.width=((idx/PKG.families.length)*100)+'%';
 app.innerHTML='<div class="panel"><div class="row"><h2>'+f.sourceRecordId+'</h2><span>'+(idx+1)+' / '+PKG.families.length+'</span></div>'+
 '<h3>Reference — bass stem</h3><audio controls preload="metadata" src="/media/'+encodeURIComponent(f.sourceRecordId)+'/bass"></audio>'+
 '<p class="muted">Valuta entrambi con gli stessi criteri:</p><ul>'+criteria+'</ul>'+
 '<h3>Candidate A</h3><audio controls preload="metadata" src="/render/'+encodeURIComponent(f.sourceRecordId)+'/A"></audio><div class="score">'+buttons('A',s.candidates.A.score)+'</div><textarea id="noteA" placeholder="Nota opzionale">'+s.candidates.A.note+'</textarea>'+
 '<h3>Candidate B</h3><audio controls preload="metadata" src="/render/'+encodeURIComponent(f.sourceRecordId)+'/B"></audio><div class="score">'+buttons('B',s.candidates.B.score)+'</div><textarea id="noteB" placeholder="Nota opzionale">'+s.candidates.B.note+'</textarea>'+
 '<label><input id="attest" type="checkbox" '+(s.reviewerAttested?'checked':'')+'> Ho ascoltato reference, A e B per questa family.</label>'+
 '<div class="row" style="margin-top:16px"><button id="prev" '+(idx===0?'disabled':'')+'>Indietro</button><button id="next">Avanti</button></div></div>';
 app.querySelectorAll('[data-label]').forEach(b=>b.onclick=()=>{persist();const x=state(f.sourceRecordId);x.candidates[b.dataset.label].score=Number(b.dataset.score);render()});
 document.getElementById('prev').onclick=()=>{persist();idx--;render()};
 document.getElementById('next').onclick=()=>{persist();const x=state(f.sourceRecordId);if(x.candidates.A.score===null||x.candidates.B.score===null||!x.reviewerAttested){alert('Assegna entrambi i punteggi e conferma l ascolto.');return}idx++;render()};
}
fetch('/package').then(r=>r.json()).then(x=>{PKG=x;render()});
document.getElementById('submit').onclick=async()=>{const families=PKG.families.map(f=>({sourceRecordId:f.sourceRecordId,...state(f.sourceRecordId)}));const body={schema:'fame-owned-beats-basic-pitch-lowend-comparison-submission-v2',version:2,reviewId:PKG.reviewId,packageDigestSha256:PKG.packageDigestSha256,families};const r=await fetch('/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const t=await r.text();document.getElementById('result').textContent=t;if(!r.ok)alert(t)};
</script></main></body></html>`}

function openBrowser(url){
 try{
   if(process.platform==="win32"){const p=spawn("cmd",["/c","start","",url],{detached:true,stdio:"ignore",windowsHide:true});p.unref()}
   else if(process.platform==="darwin"){const p=spawn("open",[url],{detached:true,stdio:"ignore"});p.unref()}
   else{const p=spawn("xdg-open",[url],{detached:true,stdio:"ignore"});p.unref()}
 }catch(_){}
}

function prepare(workspaceRoot,reviewId=REVIEW_ID){
 reviewId=safeId(reviewId,"review-id");if(reviewId!==REVIEW_ID)throw new Error("Only frozen low-end comparison reviewId is allowed");
 const workspace=path.resolve(workspaceRoot),p=protocol(),qa=runTechnicalQa(workspace),prior=validatePriorHumanReview(workspace,p),bp=basicPitchSummary(workspace);
 const superseded=markPriorComparisonSuperseded(workspace);
 const ids=bp.summary.results.map(x=>x.sourceRecordId);
 if(ids.length!==8||new Set(ids).size!==8)throw new Error("Unexpected Basic Pitch comparison cohort");
 const root=reviewRoot(workspace,reviewId);
 if(fs.existsSync(root))throw new Error("Append-only low-end comparison already exists: "+root);
 const blind=balancedBlindMap(ids);
 const pkg={
   schema:PACKAGE_SCHEMA,version:2,status:"PREPARED_AWAITING_BLIND_LOW_END_REVIEW",reviewId,
   preparedAt:new Date().toISOString(),split:"development",records:8,
   protocolDigestSha256:sha256File(PROTOCOL_FILE),
   basicPitchSummarySha256:sha256File(bp.file),
   basicPitchTechnicalGate:qa.technicalGate,
   priorAudioToMidiHumanReviewSubmissionDigestSha256:prior.submissionDigestSha256,
   supersededInvalidReview:{
     reviewId:PRIOR_REVIEW_ID,
     markerSha256:sha256File(superseded.file),
     priorState:superseded.payload.priorState,
     gateIgnored:true,
     scoresCopied:false
   },
   criteria:p.criteria,scale:p.scale,renderer:p.renderer,
   families:ids.map(sourceRecordId=>{const referenceFile=sourceStemPath(workspace,sourceRecordId);return{sourceRecordId,candidates:["A","B"],referenceStem:"bass",referenceDurationSeconds:wavDurationSeconds(referenceFile)}}),
   safety:p.safety
 };
 fs.mkdirSync(path.dirname(root),{recursive:true});fs.mkdirSync(root,{recursive:false});
 try{
   fs.writeFileSync(path.join(root,"review-package.json"),stableJson(pkg),{flag:"wx"});
   fs.writeFileSync(path.join(root,"blind-key.json"),stableJson({schema:BLIND_KEY_SCHEMA,version:2,reviewId,mapping:blind}),{flag:"wx"});
 }catch(error){fs.rmSync(root,{recursive:true,force:true});throw error}
 return{mode:"BASIC_PITCH_LOW_END_BLIND_COMPARISON_V2_PREPARED",reviewId,supersedesReviewId:PRIOR_REVIEW_ID,priorReviewState:superseded.payload.priorState,priorInvalidGateIgnored:true,priorScoresCopied:false,records:8,technicalGate:"ALL_8_FAMILIES_PASS",armIdentityExposedToReviewer:false,finalHoldoutAccessedByThisCommand:false,batch131AccessedByThisCommand:false,trainingAuthorized:false,nextAction:"SERVE_AND_COMPLETE_BLIND_LOW_END_COMPARISON_V2"};
}

function serve(workspaceRoot,reviewId=REVIEW_ID,port=0){
 const workspace=path.resolve(workspaceRoot),p=protocol();runTechnicalQa(workspace);
 const root=reviewRoot(workspace,reviewId),packageFile=path.join(root,"review-package.json"),keyFile=path.join(root,"blind-key.json");
 if(!fs.existsSync(packageFile)||!fs.existsSync(keyFile))throw new Error("Low-end comparison package missing; run prepare first");
 const pkg=readJson(packageFile),key=readJson(keyFile),publicPkg={...pkg,packageDigestSha256:sha256File(packageFile)};
 const submissionFile=path.join(root,"submission.json"),reportFile=path.join(root,"report.json");
 if(fs.existsSync(submissionFile)||fs.existsSync(reportFile))throw new Error("Low-end comparison already finalized");
 const cache=new Map();

 const server=http.createServer((req,res)=>{try{
   const url=new URL(req.url,"http://127.0.0.1");
   if(req.method==="GET"&&url.pathname==="/"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});return res.end(html())}
   if(req.method==="GET"&&url.pathname==="/package"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});return res.end(stableJson(publicPkg))}
   const parts=url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
   if((req.method==="GET"||req.method==="HEAD")&&parts[0]==="media"&&parts.length===3&&parts[2]==="bass")return media.sendAudioFile(req,res,sourceStemPath(workspace,parts[1]));
   if((req.method==="GET"||req.method==="HEAD")&&parts[0]==="render"&&parts.length===3){
     const rid=parts[1],label=parts[2],armId=key.mapping[rid]?.[label];
     if(!armId)throw new Error("Blind mapping missing");
     const family=pkg.families.find(x=>x.sourceRecordId===rid);
     if(!family)throw new Error("Comparison family missing");
     const actualReferenceDuration=wavDurationSeconds(sourceStemPath(workspace,rid));
     if(Math.abs(actualReferenceDuration-family.referenceDurationSeconds)>p.renderer.durationToleranceSeconds)throw new Error("Reference duration changed after package freeze: "+rid);
     const cacheKey=rid+"|"+label;let wav=cache.get(cacheKey);
     if(!wav){wav=armId==="librosa-pyin-lowend-v1"?renderPyin(pyinResult(workspace,rid),p,family.referenceDurationSeconds):renderBasicPitch(bpResult(workspace,rid),p,family.referenceDurationSeconds);cache.set(cacheKey,wav)}
     return media.sendAudioBuffer(req,res,wav);
   }
   if(req.method==="POST"&&url.pathname==="/submit"){
     let body="";req.setEncoding("utf8");req.on("data",chunk=>{body+=chunk;if(body.length>1024*1024)req.destroy()});
     return req.on("end",()=>{try{
       const doc=validateSubmission(JSON.parse(body),publicPkg),finalized=finalizeSubmission(doc,publicPkg,key,p);
       const submission={...doc,unblinded:finalized.families,gate:finalized.gate};
       fs.writeFileSync(submissionFile,stableJson(submission),{flag:"wx"});
       const selected=finalized.gate.lowEndComparison.selectedArm;
       const nextAction=selected?"INTEGRATE_SELECTED_LOW_END_WITH_DRUMS_KICK_FUSION_AND_KEEP_FINAL_HOLDOUT_CLOSED":"KEEP_LOW_END_UNPROMOTED_AND_REVIEW_METHOD";
       const report={schema:REPORT_SCHEMA,version:2,reviewId,completedAt:new Date().toISOString(),packageDigestSha256:publicPkg.packageDigestSha256,submissionDigestSha256:sha256File(submissionFile),records:8,gate:finalized.gate,context:{selectedDrumsArm:"drums-bass-kick-fusion-v1",baselineArm:"librosa-pyin-lowend-v1",candidateArm:"basic-pitch-0.4.0-lowend-v1"},safety:{finalHoldoutAccessed:false,batch131Accessed:false,trainingAuthorized:false,taskDataReadyMayBeDeclared:false},nextAction};
       fs.writeFileSync(reportFile,stableJson(report),{flag:"wx"});
       res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(stableJson(report));setTimeout(()=>server.close(),750);
     }catch(error){res.writeHead(400,{"Content-Type":"text/plain"});res.end(error.message)}})
   }
   res.writeHead(404);res.end("Not found");
 }catch(error){res.writeHead(500,{"Content-Type":"text/plain"});res.end(error.message)}});

 server.on("error",error=>{process.stderr.write("LOW-END COMPARISON SERVER FAILED: "+(error.code||"ERROR")+": "+error.message+"\n");process.exitCode=1});
 server.on("listening",()=>{const address=server.address(),boundPort=address&&typeof address==="object"?address.port:Number(port),url="http://127.0.0.1:"+boundPort+"/";process.stdout.write(stableJson({mode:"BASIC_PITCH_LOW_END_BLIND_COMPARISON_SERVER_READY",reviewId,url,records:8,armIdentityExposedToReviewer:false,finalHoldoutAccessedByThisCommand:false,trainingAuthorized:false}));openBrowser(url)});
 server.listen(Number(port),"127.0.0.1");
}

function report(workspaceRoot,reviewId=REVIEW_ID){const file=path.join(reviewRoot(path.resolve(workspaceRoot),reviewId),"report.json");if(!fs.existsSync(file))throw new Error("Low-end comparison report missing");return readJson(file)}
function main(args=process.argv.slice(2)){const[command,workspace,reviewId,port]=args;if(!command||!workspace)throw new Error("Usage: node basic-pitch-lowend-comparison.js <prepare|serve|report> <workspace> [review-id] [port]");if(command==="prepare")process.stdout.write(stableJson(prepare(workspace,reviewId||REVIEW_ID)));else if(command==="serve")serve(workspace,reviewId||REVIEW_ID,port===undefined?0:Number(port));else if(command==="report")process.stdout.write(stableJson(report(workspace,reviewId||REVIEW_ID)));else throw new Error("Unknown command")}
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={prepare,median,computeArmStats,chooseLowEnd,validateSubmission,finalizeSubmission,renderPyin,renderBasicPitch,wavDurationSeconds,markPriorComparisonSuperseded};
