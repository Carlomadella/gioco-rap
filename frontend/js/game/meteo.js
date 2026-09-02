/*
 * ANNI DI FAME — SISTEMA METEO GLOBALE v2
 * 2026-09-02
 *
 * Scopo di questa versione:
 * - un'unica sorgente meteo per tutto il gioco;
 * - previsione giornaliera deterministica e persistente;
 * - cambi coerenti (niente random ad ogni render/ora);
 * - stati: sereno, nuvoloso, pioggia, temporale, nebbia;
 * - nessun effetto gameplay/storyline per ora;
 * - API/eventi pronti per mappa, storyline e ambiente in futuro.
 *
 * Dipendenze: G + GAME_TIME.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined" || typeof G === "undefined") return;

  const VERSION = 2;
  const STORE_KEY = "meteoV2";
  const TYPES = Object.freeze(["clear","cloudy","rain","storm","fog"]);
  const LABELS = Object.freeze({
    clear:"Sereno",
    cloudy:"Nuvoloso",
    rain:"Pioggia",
    storm:"Temporale",
    fog:"Nebbia"
  });

  /* Una giornata di GAME_TIME va dalle 08:00 alle 04:00 del giorno seguente. */
  const START = Number(GAME_TIME.DAY_START) || 480;
  const END = Number(GAME_TIME.DAY_END) || 1680;
  const SLOT = Number(GAME_TIME.SLOT) || 15;

  let lastSignature = "";
  let overrideType = null;

  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function snap(v){ return Math.round(v/SLOT)*SLOT; }
  function text(v){ try{return GAME_TIME.format(v);}catch(_){return String(v);} }

  function cityKey(){
    const candidates=[
      G.city, G.citta, G.città, G.currentCity, G.currentCityId, G.cityId,
      G.location, G.luogo, G.zona
    ];
    for(const v of candidates){
      if(typeof v === "string" && v.trim()) return v.trim();
      if(v && typeof v === "object"){
        const s=v.id||v.key||v.nome||v.name;
        if(typeof s === "string" && s.trim()) return s.trim();
      }
    }
    const dom=document.querySelector("#hb-citta,#hb-city,[data-current-city],.pbarra .pcitta,.pbarra .pcity");
    if(dom){
      const s=(dom.dataset&&dom.dataset.currentCity)||dom.textContent;
      if(s&&String(s).trim()) return String(s).trim();
    }
    return "Provincia";
  }

  function dayKey(){
    const y=Math.max(1,Number(G.year)||1);
    const w=Math.max(1,Number(G.week)||1);
    const d=Math.max(1,Number(G.day)||1);
    return [VERSION,cityKey(),y,w,d].join("|");
  }

  /* FNV-1a: lo stesso giorno/citta genera sempre la stessa previsione. */
  function hash32(str){
    let h=2166136261>>>0;
    for(let i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h=Math.imul(h,16777619)>>>0;
    }
    return h>>>0;
  }
  function rngFrom(seedText){
    let x=hash32(seedText)||0x6d2b79f5;
    return function(){
      x+=0x6D2B79F5;
      let t=x;
      t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function pickWeighted(rng, entries){
    let sum=0;
    for(const e of entries) sum+=Math.max(0,e[1]);
    if(sum<=0) return entries[0][0];
    let n=rng()*sum;
    for(const e of entries){ n-=Math.max(0,e[1]); if(n<=0) return e[0]; }
    return entries[entries.length-1][0];
  }

  function season(){
    /* Le settimane del gioco vengono trattate come anno climatico da 52 settimane.
       Serve solo a rendere il meteo credibile; nessun effetto gameplay. */
    const w=((Math.max(1,Number(G.week)||1)-1)%52)+1;
    if(w<=9 || w>=49) return "winter";
    if(w<=22) return "spring";
    if(w<=35) return "summer";
    return "autumn";
  }

  function baseWeights(seasonName, minute){
    const local=((minute%1440)+1440)%1440;
    const morning=local>=300&&local<600;
    const night=local>=1260||local<360;
    const table={
      winter:{clear:24,cloudy:38,rain:20,storm:5,fog:13},
      spring:{clear:37,cloudy:30,rain:18,storm:9,fog:6},
      summer:{clear:59,cloudy:23,rain:8,storm:8,fog:2},
      autumn:{clear:31,cloudy:35,rain:19,storm:7,fog:8}
    }[seasonName]||{clear:40,cloudy:31,rain:16,storm:7,fog:6};
    const out=Object.assign({},table);
    /* Fasce orarie: nebbia soprattutto alba/notte; temporali soprattutto pomeriggio/sera. */
    if(morning) out.fog*=2.1;
    else if(local>=660&&local<1080) out.fog*=0.10;
    else if(local>=1080&&local<1260) out.fog*=0.35;
    else if(night) out.fog*=1.25;

    if(local>=840&&local<1260) out.storm*= (seasonName==="summer"||seasonName==="spring") ? 1.9 : 1.35;
    else if(local>=660&&local<840) out.storm*=0.75;
    else if(local>=480&&local<660) out.storm=0;
    else if(night) out.storm*=0.45;
    return out;
  }

  function transitionWeights(previous, seasonName, minute){
    const b=baseWeights(seasonName,minute);
    /* Matrice Markov semplice: il meteo tende a continuare/evolvere, non a saltare. */
    const links={
      clear:  {clear:5.0,cloudy:2.4,rain:.12,storm:0,fog:.40},
      cloudy: {clear:1.8,cloudy:4.4,rain:1.7,storm:.58,fog:.60},
      rain:   {clear:.28,cloudy:2.5,rain:4.2,storm:1.15,fog:.28},
      storm:  {clear:.015,cloudy:2.8,rain:5.5,storm:.30,fog:0},
      fog:    {clear:2.1,cloudy:2.5,rain:.22,storm:0,fog:3.8}
    }[previous] || {clear:1,cloudy:1,rain:1,storm:1,fog:1};
    return TYPES.map(type=>{
      const link=Object.prototype.hasOwnProperty.call(links,type)?links[type]:1;
      const base=Object.prototype.hasOwnProperty.call(b,type)?b[type]:1;
      return [type,Math.max(0,base)*Math.max(0,link)];
    });
  }

  function intensityFor(rng,type){
    const ranges={
      clear:[.25,.75], cloudy:[.35,.85], rain:[.35,.90], storm:[.62,1], fog:[.30,.86]
    }[type]||[.3,.8];
    return +(ranges[0]+rng()*(ranges[1]-ranges[0])).toFixed(3);
  }

  function makeForecast(key){
    const rng=rngFrom("ADF-WEATHER|"+key);
    const s=season();
    const segments=[];
    let minute=START;
    const initialWeights=baseWeights(s,minute);
    let type=pickWeighted(rng,TYPES.map(t=>[t,initialWeights[t]]));

    while(minute<END){
      const local=((minute%1440)+1440)%1440;
      /* Durate diverse per fenomeno: un temporale non resta acceso mezza giornata. */
      const night=local>=1260||local<360;
      const ranges={
        clear:night?[150,390]:[150,360],
        cloudy:night?[150,360]:[120,330],
        rain:[90,270],
        storm:[45,165],
        fog:[60,210]
      }[type]||[90,240];
      let duration=ranges[0]+Math.floor(rng()*(ranges[1]-ranges[0]+1));
      duration=snap(duration);
      const end=Math.min(END,minute+Math.max(SLOT,duration));
      segments.push({
        start:minute,
        end,
        type,
        intensity:intensityFor(rng,type)
      });
      minute=end;
      if(minute>=END) break;
      let nextType=pickWeighted(rng,transitionWeights(type,s,minute));
      /* Vincoli duri sulle transizioni piu innaturali. La matrice le rende gia
         improbabili, questi guardrail impediscono che un refactor le reintroduca. */
      if(type==="storm") nextType=(nextType==="rain"||nextType==="cloudy")?nextType:(rng()<.72?"rain":"cloudy");
      if(type==="fog"&&nextType==="storm") nextType="cloudy";
      if(type==="clear"&&nextType==="storm") nextType="cloudy";
      type=nextType;
    }

    /* Evita micro-sequenze identiche: fondile in un solo blocco. */
    const merged=[];
    for(const seg of segments){
      const prev=merged[merged.length-1];
      if(prev&&prev.type===seg.type){
        const spanA=prev.end-prev.start, spanB=seg.end-seg.start;
        prev.intensity=+((prev.intensity*spanA+seg.intensity*spanB)/(spanA+spanB)).toFixed(3);
        prev.end=seg.end;
      }else merged.push(Object.assign({},seg));
    }

    return {version:VERSION,key,city:cityKey(),season:s,createdAt:Date.now(),segments:merged};
  }

  function store(){
    if(!G[STORE_KEY] || typeof G[STORE_KEY]!=="object") G[STORE_KEY]={version:VERSION};
    if(Number(G[STORE_KEY].version)!==VERSION) G[STORE_KEY]={version:VERSION};
    return G[STORE_KEY];
  }

  function ensureForecast(force){
    const st=store(), key=dayKey();
    if(force || !st.forecast || st.forecast.key!==key || !Array.isArray(st.forecast.segments)){
      st.forecast=makeForecast(key);
      st.last=null;
      try{ window.dispatchEvent(new CustomEvent("game-weather:forecast",{detail:{forecast:cloneForecast(st.forecast)}})); }catch(_){}
    }
    return st.forecast;
  }

  function cloneSegment(s){return {start:s.start,end:s.end,type:s.type,intensity:s.intensity};}
  function cloneForecast(f){
    return {version:f.version,key:f.key,city:f.city,season:f.season,segments:f.segments.map(cloneSegment)};
  }

  function segmentAt(minute,forecast){
    const f=forecast||ensureForecast(false);
    let n=Number(minute);
    if(!Number.isFinite(n)) n=GAME_TIME.now();
    n=clamp(n,START,END);
    return f.segments.find(s=>n>=s.start&&n<s.end) || f.segments[f.segments.length-1];
  }

  function current(){
    const forecast=ensureForecast(false), minute=GAME_TIME.now();
    const seg=segmentAt(minute,forecast);
    const index=Math.max(0,forecast.segments.indexOf(seg));
    const prev=forecast.segments[index-1]||null;
    const next=forecast.segments[index+1]||null;
    const type=overrideType||seg.type;
    return {
      type,
      label:LABELS[type]||type,
      intensity:overrideType?Math.max(.7,seg.intensity):seg.intensity,
      start:seg.start,
      end:seg.end,
      startText:text(seg.start),
      endText:text(seg.end),
      minute,
      city:forecast.city,
      season:forecast.season,
      previous:prev?prev.type:null,
      next:next?next.type:null,
      forecastKey:forecast.key,
      debugOverride:!!overrideType
    };
  }

  function signature(s){ return [s.forecastKey,s.type,s.start,s.end,overrideType||""].join("|"); }

  function sync(reason){
    const s=current(), sig=signature(s), st=store();
    const changed=sig!==lastSignature;
    const typeChanged=!st.last || st.last.type!==s.type || st.last.forecastKey!==s.forecastKey;
    lastSignature=sig;
    st.last={type:s.type,forecastKey:s.forecastKey,start:s.start,end:s.end,minute:s.minute};

    try{ window.dispatchEvent(new CustomEvent("game-weather:updated",{detail:Object.assign({reason:reason||"sync"},s)})); }catch(_){}
    if(changed&&typeChanged){
      try{ window.dispatchEvent(new CustomEvent("game-weather:changed",{detail:Object.assign({reason:reason||"sync"},s)})); }catch(_){}
    }
    return s;
  }

  function setOverride(type){
    overrideType=TYPES.includes(type)?type:null;
    return sync("debug-override");
  }

  window.GAME_WEATHER=Object.freeze({
    VERSION,
    TYPES,
    labels:LABELS,
    current,
    forecast:()=>cloneForecast(ensureForecast(false)),
    type:()=>current().type,
    label:()=>current().label,
    intensity:()=>current().intensity,
    season,
    city:cityKey,
    sync:()=>sync("manual"),
    regenerate:()=>{ ensureForecast(true); return sync("regenerate"); },
    /* Solo sviluppo/QA: null rimuove l'override. Nessun bottone viene mostrato nel gioco. */
    setDebugWeather:setOverride
  });

  for(const ev of ["game-time:advanced","game-time:day-start","game-location:changed"]){
    window.addEventListener(ev,()=>sync(ev));
  }

  ensureForecast(false);
  sync("init");
})();