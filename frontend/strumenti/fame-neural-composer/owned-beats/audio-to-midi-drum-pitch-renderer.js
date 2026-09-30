"use strict";

const SAMPLE_RATE=22050;

const GM_DRUM_NAMES={
  35:"Acoustic Bass Drum",36:"Bass Drum 1",37:"Side Stick / Rim",38:"Acoustic Snare",39:"Hand Clap",
  40:"Electric Snare",41:"Low Floor Tom",42:"Closed Hi-Hat",43:"High Floor Tom",44:"Pedal Hi-Hat",
  45:"Low Tom",46:"Open Hi-Hat",47:"Low-Mid Tom",48:"Hi-Mid Tom",49:"Crash Cymbal 1",
  50:"High Tom",51:"Ride Cymbal 1",52:"Chinese Cymbal",53:"Ride Bell",54:"Tambourine",
  55:"Splash Cymbal",56:"Cowbell",57:"Crash Cymbal 2",58:"Vibraslap",59:"Ride Cymbal 2",
  60:"Hi Bongo",61:"Low Bongo",62:"Mute Hi Conga",63:"Open Hi Conga",64:"Low Conga",
  65:"High Timbale",66:"Low Timbale",67:"High Agogo",68:"Low Agogo",69:"Cabasa",
  70:"Maracas",71:"Short Whistle",72:"Long Whistle",73:"Short Guiro",74:"Long Guiro",
  75:"Claves",76:"Hi Wood Block",77:"Low Wood Block",78:"Mute Cuica",79:"Open Cuica",
  80:"Mute Triangle",81:"Open Triangle"
};

function nameForPitch(pitch){return GM_DRUM_NAMES[pitch]||("GM Drum "+pitch)}

function familyForPitch(pitch){
  if(pitch===35||pitch===36)return "kick";
  if(pitch===37)return "rim";
  if(pitch===38||pitch===40)return "snare";
  if(pitch===39)return "clap";
  if([41,43,45,47,48,50].includes(pitch))return "tom";
  if([42,44,46].includes(pitch))return "hihat";
  if([49,51,52,53,55,57,59].includes(pitch))return "cymbal";
  if(pitch===54)return "tambourine";
  if(pitch===56)return "cowbell";
  return "percussion";
}

function seededNoise(seed){
  let state=(seed>>>0)||1;
  return ()=>{
    state=(1664525*state+1013904223)>>>0;
    return (state/4294967296)*2-1;
  };
}

function wavHeader(dataBytes,sampleRate=SAMPLE_RATE){
  const b=Buffer.alloc(44);
  b.write("RIFF",0,"ascii"); b.writeUInt32LE(36+dataBytes,4); b.write("WAVE",8,"ascii");
  b.write("fmt ",12,"ascii"); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22);
  b.writeUInt32LE(sampleRate,24); b.writeUInt32LE(sampleRate*2,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34);
  b.write("data",36,"ascii"); b.writeUInt32LE(dataBytes,40);
  return b;
}

function toWav(samples,sampleRate=SAMPLE_RATE){
  let peak=0;
  for(const value of samples)peak=Math.max(peak,Math.abs(value));
  const scale=peak>0.98?0.98/peak:1;
  const pcm=Buffer.alloc(samples.length*2);
  for(let i=0;i<samples.length;i++){
    const x=Math.max(-1,Math.min(1,samples[i]*scale));
    pcm.writeInt16LE(Math.round(x*32767),i*2);
  }
  return Buffer.concat([wavHeader(pcm.length,sampleRate),pcm]);
}

function addTone(samples,start,sampleRate,duration,freq,amp,decay,harmonic=0){
  let phase=0;
  const n=Math.floor(duration*sampleRate);
  for(let i=0;i<n&&start+i<samples.length;i++){
    const t=i/sampleRate,env=Math.exp(-t*decay);
    phase+=2*Math.PI*freq/sampleRate;
    samples[start+i]+=amp*env*(Math.sin(phase)+harmonic*Math.sin(2*phase));
  }
}

function addNoise(samples,start,sampleRate,duration,amp,decay,seed,highpass=0.94){
  const rnd=seededNoise(seed);
  let prev=0,xPrev=0;
  const n=Math.floor(duration*sampleRate);
  for(let i=0;i<n&&start+i<samples.length;i++){
    const t=i/sampleRate,env=Math.exp(-t*decay),x=rnd();
    const hp=highpass*(prev+x-xPrev);
    prev=hp;xPrev=x;
    samples[start+i]+=amp*env*hp;
  }
}

function addEvent(samples,event,index,sampleRate){
  const pitch=Number(event.canonicalPitch ?? event.rawPitch ?? event.midiNote);
  if(!Number.isInteger(pitch))throw new Error("Drum event missing MIDI pitch");
  const family=familyForPitch(pitch);
  const start=Math.max(0,Math.floor(Number(event.timeSeconds)*sampleRate));
  const seed=(index+1)*104729+pitch*7919;

  if(family==="kick"){
    addTone(samples,start,sampleRate,0.24,pitch===35?48:55,0.8,18,0.18);
  }else if(family==="snare"){
    addNoise(samples,start,sampleRate,0.16,0.38,24,seed,0.93);
    addTone(samples,start,sampleRate,0.12,pitch===40?210:175,0.18,22,0);
  }else if(family==="rim"){
    addTone(samples,start,sampleRate,0.055,1150,0.42,48,0.25);
  }else if(family==="clap"){
    addNoise(samples,start,sampleRate,0.12,0.42,30,seed,0.90);
    addNoise(samples,start+Math.floor(0.018*sampleRate),sampleRate,0.08,0.28,34,seed+1,0.91);
  }else if(family==="tom"){
    const freq={41:82,43:98,45:117,47:147,48:175,50:220}[pitch]||130;
    addTone(samples,start,sampleRate,0.26,freq,0.55,13,0.22);
  }else if(family==="hihat"){
    const duration=pitch===46?0.34:(pitch===44?0.08:0.06);
    addNoise(samples,start,sampleRate,duration,0.24,pitch===46?10:45,seed,0.975);
  }else if(family==="cymbal"){
    addNoise(samples,start,sampleRate,pitch===53?0.28:0.55,0.24,pitch===53?9:5,seed,0.985);
    if(pitch===53)addTone(samples,start,sampleRate,0.24,920,0.14,9,0.2);
  }else if(family==="cowbell"){
    addTone(samples,start,sampleRate,0.20,560,0.30,10,0.55);
  }else if(family==="tambourine"){
    addNoise(samples,start,sampleRate,0.16,0.28,18,seed,0.98);
  }else{
    const freq=300+(pitch%12)*55;
    addTone(samples,start,sampleRate,0.12,freq,0.22,18,0.28);
    addNoise(samples,start,sampleRate,0.07,0.10,30,seed,0.96);
  }
}

function render(events,referenceDurationSeconds,sampleRate=SAMPLE_RATE){
  if(!Array.isArray(events))throw new Error("events must be an array");
  const duration=Number(referenceDurationSeconds);
  if(!Number.isFinite(duration)||duration<=0)throw new Error("Invalid reference duration");
  const samples=new Float32Array(Math.max(1,Math.round(duration*sampleRate)));
  events.forEach((event,index)=>{
    const t=Number(event.timeSeconds);
    if(!Number.isFinite(t)||t<0||t>duration)throw new Error("Invalid drum event time");
    addEvent(samples,event,index,sampleRate);
  });
  return toWav(samples,sampleRate);
}

function summarize(events){
  const counts=new Map();
  for(const event of events||[]){
    const pitch=Number(event.canonicalPitch ?? event.rawPitch ?? event.midiNote);
    if(!Number.isInteger(pitch))continue;
    counts.set(pitch,(counts.get(pitch)||0)+1);
  }
  return [...counts.entries()]
    .sort((a,b)=>a[0]-b[0])
    .map(([pitch,count])=>({pitch,count,name:nameForPitch(pitch),family:familyForPitch(pitch)}));
}

function selfTest(){
  const events=[
    {timeSeconds:0.05,canonicalPitch:36},
    {timeSeconds:0.10,canonicalPitch:37},
    {timeSeconds:0.15,canonicalPitch:39},
    {timeSeconds:0.20,canonicalPitch:45},
    {timeSeconds:0.25,canonicalPitch:49}
  ];
  const wav=render(events,0.5);
  const summary=summarize(events);
  if(wav.toString("ascii",0,4)!=="RIFF")throw new Error("Pitch renderer WAV invalid");
  if(summary.length!==5||summary[1].family!=="rim"||summary[2].family!=="clap")throw new Error("Pitch renderer mapping invalid");
  return {mode:"FAME_DRUM_PITCH_RENDERER_SELF_TEST_PASS",classes:summary.map(x=>x.family)};
}

module.exports={GM_DRUM_NAMES,nameForPitch,familyForPitch,render,summarize,selfTest};
