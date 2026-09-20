"use strict";

const assert=require("node:assert");
const http=require("node:http");
const path=require("node:path");

const mod=require(path.join(__dirname,"owned-beats","audio-to-midi-human-review.js"));

function request(port,method,headers={}){
  return new Promise((resolve,reject)=>{
    const req=http.request({host:"127.0.0.1",port,path:"/audio",method,headers},res=>{
      const chunks=[];
      res.on("data",chunk=>chunks.push(chunk));
      res.on("end",()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
    });
    req.on("error",reject);
    req.end();
  });
}

async function main(){
  assert.deepEqual(mod.parseByteRange("bytes=0-99",1000),{start:0,end:99});
  assert.deepEqual(mod.parseByteRange("bytes=900-",1000),{start:900,end:999});
  assert.deepEqual(mod.parseByteRange("bytes=-100",1000),{start:900,end:999});
  assert.equal(mod.parseByteRange("bytes=1000-",1000).invalid,true);

  const wav=mod.renderBassNotes([
    {startSeconds:0,endSeconds:0.5,midiNote:45},
    {startSeconds:0.75,endSeconds:1.25,midiNote:47}
  ]);
  assert(wav.length>100);

  const server=http.createServer((req,res)=>mod.sendAudioBuffer(req,res,wav));
  await new Promise((resolve,reject)=>{
    server.once("error",reject);
    server.listen(0,"127.0.0.1",resolve);
  });
  const port=server.address().port;

  try{
    const full=await request(port,"GET");
    assert.equal(full.status,200);
    assert.equal(full.headers["content-type"],"audio/wav");
    assert.equal(full.headers["accept-ranges"],"bytes");
    assert.equal(Number(full.headers["content-length"]),wav.length);
    assert.equal(full.body.length,wav.length);
    assert.equal(full.body.toString("ascii",0,4),"RIFF");

    const head=await request(port,"HEAD");
    assert.equal(head.status,200);
    assert.equal(Number(head.headers["content-length"]),wav.length);
    assert.equal(head.body.length,0);

    const range=await request(port,"GET",{"Range":"bytes=0-99"});
    assert.equal(range.status,206);
    assert.equal(range.headers["content-range"],"bytes 0-99/"+wav.length);
    assert.equal(Number(range.headers["content-length"]),100);
    assert.equal(range.headers["accept-ranges"],"bytes");
    assert.equal(range.body.length,100);
    assert.deepEqual(range.body,wav.subarray(0,100));

    const suffix=await request(port,"GET",{"Range":"bytes=-64"});
    assert.equal(suffix.status,206);
    assert.equal(Number(suffix.headers["content-length"]),64);
    assert.deepEqual(suffix.body,wav.subarray(wav.length-64));

    const invalid=await request(port,"GET",{"Range":"bytes="+wav.length+"-"});
    assert.equal(invalid.status,416);
    assert.equal(invalid.headers["content-range"],"bytes */"+wav.length);
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }

  console.log("owned-beats-audio-to-midi-human-review-range-test: PASS");
}

main().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
