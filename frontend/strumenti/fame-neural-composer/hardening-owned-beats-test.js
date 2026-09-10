"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),vm=require("node:vm"),cp=require("node:child_process");
const {exportEnrichedDrumViews}=require("./export-drum-view-v2-enriched");
const {enrichDirectory}=require("./enrich-gmd-dataset-items");
const {normalizeGmdRow}=require("./dataset/gmd-metadata");
const {buildEnrichedDrumViewV2,enrichDrumViewWithGmdMetadata}=require("./dataset/drum-view-v2-metadata");
const {buildDrumViewV2}=require("./dataset/drum-view-v2");
const {bootstrap}=require("./owned-beats/bootstrap");
const fixtureCode=fs.readFileSync(path.join(__dirname,"phase7c-block1-smoke-test.js"),"utf8");
const fixture=vm.runInNewContext("("+fixtureCode.slice(fixtureCode.indexOf("function fixtureItem()"),fixtureCode.indexOf("\nconst profile ="))+")")();
fixture.provenance.sourceId="gmd-v1.0.0:drummer1/session1/1";
fixture.sourceMetadata=normalizeGmdRow({id:"drummer1/session1/1",drummer:"drummer1",session:"drummer1/session1",style:"hiphop",bpm:"120",beat_type:"beat",time_signature:"4-4",midi_filename:"one.mid",duration:"4",split:"train"});
const root=fs.mkdtempSync(path.join(os.tmpdir(),"fame-hardening-"));
function folder(name){const p=path.join(root,name);fs.mkdirSync(p,{recursive:true});return p;}
function write(file,value){fs.writeFileSync(file,JSON.stringify(value));}
async function test(){
 const input=folder("input");write(path.join(input,"a.dataset-item.json"),fixture);
 const out=path.join(root,"views");const r=exportEnrichedDrumViews(input,out);
 assert.equal(r.completeInputCoverage,true);const view=JSON.parse(fs.readFileSync(path.join(out,r.items[0].outputFileName)));
 assert.equal(view.mapping.profileId,r.options.mappingProfileId);assert.equal(view.mapping.profileId,"gmd-9-v1");
 const raw=exportEnrichedDrumViews(input,path.join(root,"raw"),{mappingProfileId:"gm-raw-v1"});
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,"raw",raw.items[0].outputFileName))).mapping.profileId,"gm-raw-v1");
 const bad=JSON.parse(JSON.stringify(fixture));delete bad.sourceFidelity;write(path.join(input,"b.dataset-item.json"),bad);
 const report=path.join(root,"partial.json");const child=cp.spawnSync(process.execPath,[path.join(__dirname,"export-drum-view-v2-enriched.js"),input,path.join(root,"partial"),report]);
 assert.equal(child.status,1);const partial=JSON.parse(fs.readFileSync(report));assert.equal(partial.exportedMetadataCoverage,true);assert.equal(partial.completeMetadataCoverage,false);
 assert.throws(()=>exportEnrichedDrumViews(input,out),/not empty/);
 const csv=path.join(root,"info.csv");fs.writeFileSync(csv,"drummer,session,id,style,bpm,beat_type,time_signature,midi_filename,duration,split\ndrummer1,drummer1/session1,drummer1/session1/1,hiphop,120,beat,4-4,one.mid,4,train\n");
 const enriched=path.join(root,"enriched");enrichDirectory(input,csv,enriched);fs.unlinkSync(path.join(input,"b.dataset-item.json"));
 assert.throws(()=>enrichDirectory(input,csv,enriched),/not empty/);assert.ok(fs.existsSync(path.join(enriched,"b.dataset-item.json")));
 const mismatch=JSON.parse(JSON.stringify(fixture));mismatch.sourceMetadata.bpm=92;mismatch.sourceMetadata.timeSignature={raw:"3-4",numerator:3,denominator:4};
 const marked=enrichDrumViewWithGmdMetadata(buildDrumViewV2(mismatch),mismatch);
 assert.equal(marked.metadata.timingConsistency.conflicts.length,2);assert.equal(marked.timing.tempoEvents[0].bpm,120);
 assert.throws(()=>buildEnrichedDrumViewV2(mismatch),/timing conflict/);
 const source=folder("audio"),work=path.join(root,"work");fs.writeFileSync(path.join(source,"a.wav"),"fixture bytes, not decoded audio");fs.writeFileSync(path.join(source,"copy.wav"),"fixture bytes, not decoded audio");
 let b=await bootstrap(source,work);assert.equal(b.mode,"PREVIEW");assert.equal(fs.existsSync(work),false);
 b=await bootstrap(source,work,true);assert.equal(b.files,2);assert.equal(b.uniqueAssets,1);assert.equal(b.converted,0);
 const manifest=path.join(work,"manifest","owned-beats-manifest.json");let m=JSON.parse(fs.readFileSync(manifest));
 const id=m.records[0].sourceRecordId;m.records[0].qa={humanNote:"keep this"};m.records[0].compositionFamilyId="family-one";write(manifest,m);
 await bootstrap(source,work,true);m=JSON.parse(fs.readFileSync(manifest));assert.equal(m.records[0].qa.humanNote,"keep this");
 fs.renameSync(path.join(source,"a.wav"),path.join(source,"renamed.wav"));await bootstrap(source,work,true);m=JSON.parse(fs.readFileSync(manifest));assert.equal(m.records[0].sourceRecordId,id);
 fs.writeFileSync(path.join(source,"aaa.mp3"),"another encoding");await bootstrap(source,work,true);m=JSON.parse(fs.readFileSync(manifest));assert.equal(m.records[0].sourceRecordId,id);assert.equal(m.records[1].compositionFamilyId,null);
 fs.writeFileSync(path.join(source,"renamed.wav"),"changed bytes");await bootstrap(source,work,true);m=JSON.parse(fs.readFileSync(manifest));assert.equal(m.records.length,3);assert.ok(m.records[2].relatedPriorAssets.length);assert.equal(m.records[2].roles.drums.review,"NOT_PROCESSED");
 fs.writeFileSync(path.join(work,"bootstrap.lock"),"other process");await assert.rejects(()=>bootstrap(source,work,true),/EEXIST/);fs.unlinkSync(path.join(work,"bootstrap.lock"));
 // Simulate crash after copies but before manifest replacement: rerun adopts copies by hash.
 fs.unlinkSync(manifest);await bootstrap(source,work,true);assert.ok(fs.existsSync(manifest));
 m=JSON.parse(fs.readFileSync(manifest));fs.writeFileSync(path.join(work,m.records[0].localPath),"corrupted");await assert.rejects(()=>bootstrap(source,work,true),/copy mismatch/);
 await assert.rejects(()=>bootstrap(source,path.join(source,"nested"),true),/disjoint/);
 const fakeRepo=folder("fake-repo");fs.mkdirSync(path.join(fakeRepo,".git"));await assert.rejects(()=>bootstrap(source,path.join(fakeRepo,"work"),true),/outside a Git/);
 console.log("HARDENING OWNED BEATS: PASS (export, mapping, stale outputs, timing conflict, bootstrap identity/resume/QA preservation)");
}
test().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>fs.rmSync(root,{recursive:true,force:true}));
