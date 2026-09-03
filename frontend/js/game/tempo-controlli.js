/*
 * ANNI DI FAME — CONTROLLO TEMPO GLOBALE + WEATHER WIDGET
 * UI sistema v11 — 2026-09-02.
 *
 * Regole:
 * - un unico widget tempo/meteo, identico in ogni schermata;
 * - il widget viene spostato nella testata della finestra attiva;
 * - mostra sempre ANNO/SETTIMANA, GIORNO e ORA;
 * - il cielo segue continuamente l'ora di gioco;
 * - il meteo arriva da GAME_WEATHER (sereno/nuvole/pioggia/temporale/nebbia);
 * - il temporale include flash e fulmini visibili;
 * - il pannello vive nel body con position:fixed e non viene tagliato dagli header;
 * - Attendi avanza GAME_TIME a step visibili di 15 minuti;
 * - +1 giorno e +7 giorni vivono solo nel pannello aperto;
 * - un evento ALTO / una ACTION pendente interrompe attese e salti multipli.
 *
 * Caricare dopo GAME_TIME, GAME_WEATHER, eventi-v2.js ed eventi-tempo.js.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined") return;

  const ROOT_ID = "adf-time-controls";
  const WIDGET_ID = "adf-time-widget";
  const STEP = Number(GAME_TIME.SLOT) || 15;
  const WAIT_STEP_MS = 350;

  const HOSTS = [
    {id:"jail",    root:"#adf-jail.on",      head:".adf-jail-top", mount:".adf-jail-meta", accent:"#ff315b", panel:"linear-gradient(180deg,rgba(25,8,14,.985),rgba(8,8,11,.985))", border:"rgba(255,49,91,.38)"},
    {id:"strada", root:"#strada.on",         head:".topbar",       mount:".session", before:".exit", accent:"#c52e5f", panel:"linear-gradient(180deg,rgba(27,7,20,.985),rgba(8,5,9,.985))", border:"rgba(197,46,95,.42)"},
    {id:"posto",  root:"#posto.on",          head:".pohead",       mount:".pohead", before:".pox", accentVar:"--acid", accent:"#a3e635", panel:"linear-gradient(180deg,rgba(25,20,34,.985),rgba(12,10,17,.985))", border:"rgba(255,255,255,.14)"},
    {id:"negozio",root:"#negozio.on",        head:".nghead",       mount:".nghead", before:".ngx", accentVar:"--acid", accent:"#a3e635", panel:"linear-gradient(180deg,rgba(25,20,34,.985),rgba(12,10,17,.985))", border:"rgba(255,255,255,.14)"},
    {id:"game",   root:"#s-game.screen.on",  head:"#gtop .tline",  mount:"#gtop .tline", accentVar:"--c1", accent:"#7c3aed", panel:"linear-gradient(180deg,rgba(20,18,25,.985),rgba(10,10,14,.985))", border:"rgba(255,255,255,.14)"},
    {id:"hub",    root:"#s-hub.screen.on",   head:".pbarra",       mount:".pbarra", accent:"#c084fc", panel:"linear-gradient(180deg,rgba(16,18,27,.985),rgba(7,9,14,.985))", border:"rgba(192,132,252,.28)"}
  ];

  let panelRoot=null, panel=null, widget=null, dock=null, host=null;
  let panelOpen=false, waiting=false, targetTouched=false, syncQueued=false;
  const hiddenLegacy=[];

  function clampN(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function nextSlot(v){ return Math.min(GAME_TIME.DAY_END,Math.ceil(v/STEP)*STEP); }
  function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

  function activeHost(){
    for(const spec of HOSTS){
      const scope=document.querySelector(spec.root);
      if(!scope) continue;
      const head=scope.querySelector(spec.head);
      if(!head) continue;
      const mount=scope.querySelector(spec.mount||spec.head)||head;
      const before=spec.before ? (mount.querySelector(spec.before)||scope.querySelector(spec.before)) : null;
      return {spec,scope,head,mount,before};
    }
    return null;
  }

  function readAccent(found){
    const spec=found.spec;
    if(spec.accentVar){
      for(const el of [found.head,found.scope,document.documentElement]){
        if(!el) continue;
        try{
          const v=getComputedStyle(el).getPropertyValue(spec.accentVar).trim();
          if(v) return v;
        }catch(_){}
      }
    }
    return spec.accent||"#7c3aed";
  }

  function restoreLegacy(){
    while(hiddenLegacy.length){
      const el=hiddenLegacy.pop();
      if(el&&el.classList) el.classList.remove("adf-tc-legacy-hidden");
    }
  }

  function hideOne(el){
    if(!el||!el.classList) return;
    el.classList.add("adf-tc-legacy-hidden");
    hiddenLegacy.push(el);
  }

  function hideLegacyFor(id,scope){
    restoreLegacy();
    if(id==="hub"){
      hideOne(scope.querySelector(".psett"));
      hideOne(scope.querySelector(".pora"));
    }
    if(id==="strada"){
      for(const sel of ["#crimeWeek","#crimeClock","#st-sett","#st-ora"]){
        const el=scope.querySelector(sel);
        hideOne(el&&el.parentElement ? el.parentElement : el);
      }
    }
    if(id==="jail") hideOne(scope.querySelector("#adf-jail-time"));
    if(id==="game") hideOne(scope.querySelector("#game-clock-main"));

    /* I vecchi shortcut calendario non devono restare dietro al widget.
       Cerchiamo solo nella testata attiva: non tocchiamo le CTA del gameplay. */
    const head=scope.querySelector((HOSTS.find(x=>x.id===id)||{}).head||"");
    if(head){
      for(const b of head.querySelectorAll("button")){
        if(b===widget || (dock&&dock.contains(b))) continue;
        const txt=(b.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
        if(txt.includes("+1 giorno")||txt.includes("+7 giorni")) hideOne(b);
      }
    }
    /* Sala e negozio non hanno un clock legacy: il widget e' l'unica UI tempo. */
  }

  function applyTheme(found){
    ensure();
    const accent=readAccent(found);
    widget.style.setProperty("--tc-accent",accent);
    panelRoot.style.setProperty("--tc-accent",accent);
    panelRoot.style.setProperty("--tc-panel",found.spec.panel||"rgba(10,11,14,.985)");
    panelRoot.style.setProperty("--tc-border",found.spec.border||"rgba(255,255,255,.16)");
  }

  function mount(){
    ensure();
    const found=activeHost();
    if(!found){
      closePanel();
      restoreLegacy();
      if(host&&host.head) host.head.classList.remove("adf-time-host");
      if(host&&host.mount) host.mount.classList.remove("adf-time-dock-host");
      host=null;
      if(dock) dock.hidden=true;
      widget.hidden=true;
      panelRoot.hidden=true;
      return false;
    }

    const changed=!host || host.spec.id!==found.spec.id || host.head!==found.head || host.mount!==found.mount;
    if(changed){
      closePanel();
      restoreLegacy();
      if(host&&host.head) host.head.classList.remove("adf-time-host");
      if(host&&host.mount) host.mount.classList.remove("adf-time-dock-host");
      host=found;
      host.head.classList.add("adf-time-host");
      host.mount.classList.add("adf-time-dock-host");
      if(host.before&&host.before.parentElement===host.mount) host.mount.insertBefore(dock,host.before);
      else host.mount.appendChild(dock);
      hideLegacyFor(host.spec.id,host.scope);
      targetTouched=false;
    }else host=found;

    dock.dataset.host=host.spec.id;
    dock.hidden=false;
    widget.dataset.host=host.spec.id;
    widget.hidden=false;
    panelRoot.hidden=false;
    applyTheme(host);
    return true;
  }

  function eventBlocked(){
    try{
      if(typeof GAME_EVENTS!=="undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked()) return true;
      if(window.ADF_EVENTI && typeof ADF_EVENTI.globalHigh==="function" && ADF_EVENTI.globalHigh()) return true;
      return false;
    }catch(_){ return false; }
  }
  function actionBlocked(){
    try{ return !!(GAME_TIME.pending && GAME_TIME.pending()); }
    catch(_){ return false; }
  }
  function blockingOverlay(){
    for(const sel of ["#modal.on","#report.on","#crimeModal.on","#adf-result-overlay.on","#adf-social-overlay.on","#adf-social-banner.show"]){
      if(document.querySelector(sel)) return true;
    }
    return false;
  }
  function blocked(){ return waiting || actionBlocked() || eventBlocked() || blockingOverlay(); }

  function dayParts(){
    return {
      d:Math.max(1,Number(G.day)||1),
      w:Math.max(1,Number(G.week)||1),
      y:Math.max(1,Number(G.year)||1)
    };
  }
  function calendarSerial(){
    const x=dayParts();
    return ((x.y-1)*52+(x.w-1))*7+(x.d-1);
  }
  function dayText(){
    const x=dayParts();
    return "Anno "+x.y+" · Settimana "+x.w+" · Giorno "+x.d+"/7";
  }

  /* ----- cielo continuo ----- */
  const SKY_KEYS=[
    {m:300, top:[25,35,57],  mid:[48,53,75],  low:[111,83,98],  hor:[199,123,104],haze:[244,171,133],sun:0,  sy:88,stars:.45,moon:.50,my:18},
    {m:390, top:[63,74,104], mid:[112,92,115],low:[193,121,112],hor:[237,171,132],haze:[255,202,157],sun:.55,sy:72,stars:.14,moon:.10,my:10},
    {m:480, top:[89,132,174],mid:[121,166,202],low:[164,198,221],hor:[202,220,232],haze:[236,242,244],sun:.90,sy:24,stars:0,moon:0,my:5},
    {m:780, top:[65,124,181],mid:[95,159,207],low:[142,190,220],hor:[191,218,232],haze:[245,247,242],sun:1,sy:13,stars:0,moon:0,my:0},
    {m:1050,top:[74,91,130],mid:[135,95,117],low:[206,118,91],hor:[241,170,113],haze:[255,190,127],sun:.88,sy:54,stars:.04,moon:.04,my:8},
    {m:1170,top:[58,67,98], mid:[119,76,100],low:[196,104,82],hor:[235,149,97],haze:[255,174,112],sun:.80,sy:80,stars:.11,moon:.14,my:15},
    {m:1260,top:[29,41,67], mid:[35,51,82], low:[45,56,84],hor:[58,63,84],haze:[109,119,145],sun:.08,sy:98,stars:.48,moon:.82,my:17},
    {m:1410,top:[18,29,50], mid:[24,39,65], low:[31,45,72],hor:[42,52,73],haze:[67,77,99],sun:0,sy:100,stars:.68,moon:1,my:12},
    {m:1740,top:[25,35,57], mid:[48,53,75],  low:[111,83,98],hor:[199,123,104],haze:[244,171,133],sun:0,sy:88,stars:.45,moon:.50,my:18}
  ];
  function normSkyMin(mins){
    let n=((Math.round(mins)%1440)+1440)%1440;
    if(n<300) n+=1440;
    return n;
  }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpRgb(a,b,t){ return a.map((v,i)=>Math.round(lerp(v,b[i],t))); }
  function rgb(v){ return "rgb("+v[0]+","+v[1]+","+v[2]+")"; }
  function skyState(mins){
    const n=normSkyMin(mins);
    let a=SKY_KEYS[0],b=SKY_KEYS[SKY_KEYS.length-1];
    for(let i=0;i<SKY_KEYS.length-1;i++){
      if(n>=SKY_KEYS[i].m&&n<=SKY_KEYS[i+1].m){ a=SKY_KEYS[i]; b=SKY_KEYS[i+1]; break; }
    }
    const t=(n-a.m)/Math.max(1,b.m-a.m);
    return {
      top:lerpRgb(a.top,b.top,t),mid:lerpRgb(a.mid,b.mid,t),low:lerpRgb(a.low,b.low,t),hor:lerpRgb(a.hor,b.hor,t),haze:lerpRgb(a.haze,b.haze,t),
      sun:lerp(a.sun,b.sun,t),sy:lerp(a.sy,b.sy,t),stars:lerp(a.stars,b.stars,t),moon:lerp(a.moon,b.moon,t),my:lerp(a.my,b.my,t)
    };
  }
  function applySky(mins){
    if(!widget) return;
    const s=skyState(mins), n=normSkyMin(mins);
    widget.style.setProperty("--sky-top",rgb(s.top));
    widget.style.setProperty("--sky-mid",rgb(s.mid));
    widget.style.setProperty("--sky-low",rgb(s.low));
    widget.style.setProperty("--sky-horizon",rgb(s.hor));
    widget.style.setProperty("--haze",rgb(s.haze));
    widget.style.setProperty("--sun-opacity",s.sun.toFixed(3));
    widget.style.setProperty("--sun-y",s.sy.toFixed(1)+"%");
    widget.style.setProperty("--sun-x",(82-Math.cos(n/180)*6).toFixed(1)+"%");
    widget.style.setProperty("--moon-opacity",s.moon.toFixed(3));
    widget.style.setProperty("--moon-y",s.my.toFixed(1)+"%");
    widget.style.setProperty("--moon-x",(84+Math.sin(n/210)*5).toFixed(1)+"%");
    widget.style.setProperty("--stars-opacity",s.stars.toFixed(3));
    widget.style.setProperty("--haze-opacity",(0.54+s.sun*.28).toFixed(3));
  }

  function currentWeather(){
    try{
      if(typeof GAME_WEATHER!=="undefined" && GAME_WEATHER.current) return GAME_WEATHER.current();
    }catch(_){}
    return {type:"clear",label:"Sereno",intensity:.5};
  }
  function applyWeather(){
    if(!widget) return;
    const w=currentWeather();
    for(const type of ["clear","cloudy","rain","storm","fog"]) widget.classList.remove("weather-"+type);
    const type=["clear","cloudy","rain","storm","fog"].includes(w.type)?w.type:"clear";
    widget.classList.add("weather-"+type);
    widget.dataset.weather=type;
    widget.setAttribute("aria-label","Tempo di gioco. "+(w.label||type)+". Apri controllo del tempo");
    widget.style.setProperty("--weather-intensity",String(clampN(Number(w.intensity)||.5,0,1)));
  }

  function css(){
    if(document.getElementById("adf-time-controls-css")) return;
    const s=document.createElement("style");
    s.id="adf-time-controls-css";
    s.textContent=`
      .adf-time-host{position:relative!important;overflow:visible!important}
      .adf-tc-legacy-hidden{display:none!important}
      #adf-time-dock{position:relative;z-index:142;flex:0 0 224px;align-self:stretch;display:flex;align-items:center;justify-content:center;min-width:0;padding:4px 7px;border-left:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,.006))}
      #adf-time-dock[hidden]{display:none!important}
      #adf-time-dock[data-host="game"]{margin-left:auto;align-self:center;height:66px;flex-basis:222px;padding:0 6px;border-left:1px solid rgba(255,255,255,.07);background:transparent}
      #adf-time-dock[data-host="posto"],#adf-time-dock[data-host="negozio"]{margin-left:auto;align-self:center;height:64px;flex-basis:218px;padding:0 5px;border-left:0;background:transparent}
      #adf-time-dock[data-host="strada"]{height:100%;flex-basis:222px;padding:3px 6px}
      #adf-time-dock[data-host="jail"]{height:100%;flex-basis:220px;padding:3px 6px}
      #adf-time-dock[data-host="hub"]{flex-basis:224px;padding:4px 7px}
      #adf-time-dock + .exit,#adf-time-dock + .pox,#adf-time-dock + .ngx{margin-left:6px}
      #${WIDGET_ID}[hidden],#${ROOT_ID}[hidden]{display:none!important}
      #${WIDGET_ID},#${ROOT_ID},#${WIDGET_ID} *,#${ROOT_ID} *{box-sizing:border-box}

      #${WIDGET_ID}{
        position:relative;z-index:1;width:210px;height:62px;padding:8px 11px 8px 76px;border:1px solid rgba(255,255,255,.16);border-radius:16px;
        appearance:none;background:#173149;color:#fff;overflow:hidden;cursor:pointer;text-align:left;font-family:Figtree,Inter,system-ui,sans-serif;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.15),inset 0 -1px 0 rgba(0,0,0,.18);
        backdrop-filter:blur(16px) saturate(1.14);isolation:isolate;transition:border-color .18s ease,box-shadow .2s ease,transform .16s ease
      }
      #${WIDGET_ID}:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.26);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -1px 0 rgba(0,0,0,.18),0 4px 12px rgba(0,0,0,.14)}
      #${WIDGET_ID}:focus-visible{outline:1px solid rgba(255,255,255,.68);outline-offset:2px}
      #${WIDGET_ID}.adf-tw-open{border-color:color-mix(in srgb,var(--tc-accent,#fff) 44%,rgba(255,255,255,.22))}
      .adf-tw-meta,.adf-tw-day,.adf-tw-time{position:relative;z-index:30;display:block;text-shadow:0 1px 8px rgba(0,0,0,.50),0 0 1px rgba(0,0,0,.7);white-space:nowrap}
      .adf-tw-meta{color:rgba(255,255,255,.88);font:800 8.2px/1 Figtree,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      .adf-tw-time{margin-top:2px;color:#fff;font:500 25px/.95 Figtree,system-ui,sans-serif;letter-spacing:-.045em;font-variant-numeric:tabular-nums}
      .adf-tw-day{margin-top:4px;color:rgba(255,255,255,.76);font:750 8.5px/1 Figtree,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase}
      .adf-tw-glass{position:absolute;inset:0;z-index:25;border-radius:inherit;background:linear-gradient(145deg,rgba(255,255,255,.09),transparent 34%,transparent 72%,rgba(255,255,255,.025));pointer-events:none}

      .adf-tw-sky{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none;background:linear-gradient(180deg,var(--sky-top,#5f8fbe) 0%,var(--sky-mid,#79a9ce) 45%,var(--sky-low,#a7c8de) 77%,var(--sky-horizon,#c7dce8) 100%);transition:background 1.05s linear,filter .7s ease}
      .adf-tw-sky:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 120% 50% at 50% 112%,color-mix(in srgb,var(--haze,#fff) 54%,transparent) 0%,color-mix(in srgb,var(--haze,#fff) 18%,transparent) 44%,transparent 72%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,0) 40%,rgba(0,0,0,.10) 100%);opacity:var(--haze-opacity,.7)}
      .adf-tw-sky:after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 85% 130% at 50% 38%,transparent 36%,rgba(0,0,0,.11) 100%),linear-gradient(110deg,rgba(255,255,255,.07),transparent 35%,transparent 72%,rgba(255,255,255,.035));mix-blend-mode:soft-light}
      .adf-tw-stars{position:absolute;inset:0;opacity:var(--stars-opacity,0);transition:opacity 1.05s linear;background-image:radial-gradient(circle at 56% 18%,rgba(255,255,255,.82) 0 .65px,transparent 1px),radial-gradient(circle at 72% 29%,rgba(255,255,255,.66) 0 .55px,transparent .9px),radial-gradient(circle at 91% 20%,rgba(255,255,255,.72) 0 .6px,transparent 1px),radial-gradient(circle at 84% 70%,rgba(255,255,255,.56) 0 .5px,transparent .9px),radial-gradient(circle at 62% 76%,rgba(255,255,255,.48) 0 .48px,transparent .85px)}
      .adf-tw-sun{position:absolute;z-index:5;width:46px;height:46px;border-radius:50%;left:15px;top:8px;opacity:var(--sun-opacity,1);background:radial-gradient(circle at 36% 34%,#fffdf0 0 13%,#fff4bd 22%,#ffe27e 50%,#f9b93d 73%,#e69318 100%);box-shadow:inset -6px -7px 12px rgba(201,117,10,.22),inset 5px 4px 10px rgba(255,255,255,.18),0 0 12px 4px rgba(255,229,132,.40),0 0 30px 10px rgba(255,190,61,.22),0 0 50px 18px rgba(255,163,37,.10);transition:opacity 1.05s linear,filter .7s ease}
      .adf-tw-sun:after{content:"";position:absolute;inset:-13px;border-radius:50%;background:radial-gradient(circle,rgba(255,226,128,.20),rgba(255,192,65,.08) 45%,transparent 72%);filter:blur(3px)}
      .adf-tw-moon{position:absolute;z-index:5;width:40px;height:40px;border-radius:50%;left:18px;top:11px;opacity:var(--moon-opacity,0);background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.96) 0 11%,transparent 12%),radial-gradient(circle at 66% 62%,rgba(157,174,204,.30) 0 8%,transparent 9%),radial-gradient(circle at 42% 70%,rgba(137,153,183,.22) 0 7%,transparent 8%),radial-gradient(circle at 40% 38%,#fff 0%,#eef4ff 48%,#d8e3f4 74%,#c5d2e8 100%);box-shadow:inset -5px -4px 10px rgba(122,142,176,.18),0 0 14px rgba(211,226,255,.28),0 0 34px rgba(169,194,241,.13);transition:opacity 1.05s linear,filter .7s ease}
      .adf-tw-moon:after{content:"";position:absolute;width:12px;height:12px;border-radius:50%;left:8px;top:10px;background:rgba(134,151,181,.16);box-shadow:16px 8px 0 -2px rgba(134,151,181,.14),8px 22px 0 -3px rgba(134,151,181,.13)}
      .adf-tw-cloud,.adf-tw-weather-cloud{position:absolute;z-index:8;border-radius:50%;pointer-events:none;mix-blend-mode:screen;transition:opacity .7s ease,transform .7s ease}
      .adf-tw-cloud.c1{width:92px;height:26px;left:96px;top:12px;opacity:.18;background:radial-gradient(ellipse at 36% 60%,rgba(255,255,255,.17) 0 21%,transparent 56%),radial-gradient(ellipse at 61% 58%,rgba(255,255,255,.14) 0 23%,transparent 58%),radial-gradient(ellipse at 82% 61%,rgba(255,255,255,.10) 0 18%,transparent 54%);filter:blur(5px)}
      .adf-tw-cloud.c2{width:76px;height:20px;left:122px;top:42px;opacity:.09;background:radial-gradient(ellipse,rgba(255,255,255,.12),rgba(255,255,255,.025) 48%,transparent 72%);filter:blur(5.5px)}
      .adf-tw-weather-cloud{opacity:0;filter:blur(5px)}
      .adf-tw-weather-cloud.w1{width:112px;height:34px;left:-6px;top:4px;background:radial-gradient(ellipse at 28% 60%,rgba(236,242,249,.48) 0 22%,transparent 54%),radial-gradient(ellipse at 53% 53%,rgba(223,232,242,.42) 0 26%,transparent 58%),radial-gradient(ellipse at 79% 64%,rgba(210,222,235,.32) 0 22%,transparent 55%)}
      .adf-tw-weather-cloud.w2{width:102px;height:30px;right:-12px;top:27px;background:radial-gradient(ellipse at 25% 54%,rgba(223,231,241,.34) 0 24%,transparent 56%),radial-gradient(ellipse at 53% 58%,rgba(207,219,233,.30) 0 26%,transparent 58%),radial-gradient(ellipse at 78% 62%,rgba(194,208,224,.23) 0 21%,transparent 54%)}
      .adf-tw-rain{position:absolute;z-index:12;inset:0;opacity:0;pointer-events:none;background-image:linear-gradient(116deg,transparent 0 46%,rgba(222,238,255,.72) 47% 49%,transparent 50% 100%),linear-gradient(116deg,transparent 0 46%,rgba(222,238,255,.48) 47% 49%,transparent 50% 100%);background-size:18px 22px,25px 29px;background-position:0 0,9px 5px;animation:adfRainFall .48s linear infinite;transition:opacity .45s ease}
      @keyframes adfRainFall{from{background-position:0 -22px,9px -29px}to{background-position:-8px 22px,2px 29px}}
      .adf-tw-fog{position:absolute;z-index:13;inset:-8px;opacity:0;pointer-events:none;background:linear-gradient(180deg,transparent 5%,rgba(232,239,243,.13) 30%,rgba(231,238,242,.42) 58%,rgba(236,242,245,.24) 82%,transparent 100%),radial-gradient(ellipse 85% 36% at 32% 54%,rgba(245,248,250,.30),transparent 72%),radial-gradient(ellipse 90% 30% at 75% 68%,rgba(241,245,248,.22),transparent 74%);filter:blur(5px);animation:adfFog 7s ease-in-out infinite alternate;transition:opacity .7s ease}
      @keyframes adfFog{from{transform:translateX(-3px)}to{transform:translateX(5px)}}
      .adf-tw-lightning{position:absolute;z-index:18;inset:0;opacity:0;pointer-events:none;background:radial-gradient(circle at 76% 18%,rgba(255,255,255,.92),rgba(202,222,255,.30) 17%,transparent 38%),linear-gradient(180deg,rgba(225,236,255,.20),transparent 48%)}
      .adf-tw-bolt{position:absolute;display:block;width:2px;height:31px;opacity:0;background:linear-gradient(180deg,#fff 0%,#dbe8ff 56%,rgba(184,209,255,.25) 100%);box-shadow:0 0 4px rgba(255,255,255,.95),0 0 10px rgba(180,210,255,.75);transform-origin:top center;clip-path:polygon(42% 0,100% 0,66% 34%,100% 34%,44% 100%,56% 53%,0 53%)}
      .adf-tw-bolt.a{right:35px;top:6px;transform:rotate(7deg)}.adf-tw-bolt.b{right:62px;top:19px;height:22px;transform:rotate(-11deg) scale(.8)}
      @keyframes adfStormFlash{0%,72%,75%,84%,87%,100%{opacity:0}73%{opacity:.90}73.45%{opacity:.18}74%{opacity:.62}85%{opacity:.72}85.35%{opacity:.10}86%{opacity:.44}}
      @keyframes adfBoltA{0%,72.7%,74.4%,100%{opacity:0}72.9%{opacity:1}73.15%{opacity:.12}73.55%{opacity:.96}74%{opacity:0}}
      @keyframes adfBoltB{0%,63.7%,65.1%,100%{opacity:0}63.9%{opacity:.90}64.2%{opacity:.15}64.55%{opacity:.82}64.9%{opacity:0}}
      @keyframes adfStormGlow{0%,72%,75%,84%,87%,100%{filter:none}73%{filter:brightness(1.34) saturate(.82)}74%{filter:brightness(1.08)}85%{filter:brightness(1.22) saturate(.88)}86%{filter:brightness(1.04)}}

      #${WIDGET_ID}.weather-cloudy .adf-tw-weather-cloud{opacity:.72}#${WIDGET_ID}.weather-cloudy .adf-tw-sun{filter:saturate(.78) brightness(.92)}#${WIDGET_ID}.weather-cloudy .adf-tw-moon{filter:brightness(.86)}
      #${WIDGET_ID}.weather-rain .adf-tw-weather-cloud{opacity:.94}#${WIDGET_ID}.weather-rain .adf-tw-rain{opacity:calc(.36 + var(--weather-intensity,.5) * .34)}#${WIDGET_ID}.weather-rain .adf-tw-sun{opacity:.08!important;filter:saturate(.5) brightness(.7)}#${WIDGET_ID}.weather-rain .adf-tw-moon{opacity:.16!important;filter:brightness(.72)}#${WIDGET_ID}.weather-rain .adf-tw-sky{filter:saturate(.64) brightness(.78) contrast(1.03)}#${WIDGET_ID}.weather-rain .adf-tw-stars{opacity:0!important}
      #${WIDGET_ID}.weather-storm{animation:adfStormGlow 6.8s infinite}#${WIDGET_ID}.weather-storm .adf-tw-weather-cloud{opacity:1}#${WIDGET_ID}.weather-storm .adf-tw-rain{opacity:calc(.58 + var(--weather-intensity,.7) * .28)}#${WIDGET_ID}.weather-storm .adf-tw-sun{opacity:0!important}#${WIDGET_ID}.weather-storm .adf-tw-moon{opacity:.05!important}#${WIDGET_ID}.weather-storm .adf-tw-stars{opacity:0!important}#${WIDGET_ID}.weather-storm .adf-tw-sky{filter:saturate(.46) brightness(.60) contrast(1.12)}#${WIDGET_ID}.weather-storm .adf-tw-lightning{animation:adfStormFlash 6.8s infinite}#${WIDGET_ID}.weather-storm .adf-tw-bolt.a{animation:adfBoltA 6.8s infinite}#${WIDGET_ID}.weather-storm .adf-tw-bolt.b{animation:adfBoltB 9.4s infinite}
      #${WIDGET_ID}.weather-fog .adf-tw-weather-cloud{opacity:.32}#${WIDGET_ID}.weather-fog .adf-tw-fog{opacity:calc(.55 + var(--weather-intensity,.5) * .28)}#${WIDGET_ID}.weather-fog .adf-tw-sun{opacity:.20!important;filter:saturate(.55) blur(.4px)}#${WIDGET_ID}.weather-fog .adf-tw-moon{opacity:.22!important;filter:blur(.3px)}#${WIDGET_ID}.weather-fog .adf-tw-stars{opacity:.03!important}#${WIDGET_ID}.weather-fog .adf-tw-sky{filter:saturate(.52) brightness(.92)}

      #${ROOT_ID}{position:fixed;inset:0;z-index:260;pointer-events:none;font-family:Figtree,Inter,system-ui,sans-serif;color:#f5f3ee}
      .adf-tc-panel{position:fixed;left:12px;top:12px;width:min(368px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:15px;border-radius:16px;display:none;pointer-events:auto;background:var(--tc-panel,rgba(10,11,14,.985));border:1px solid var(--tc-border,rgba(255,255,255,.16));box-shadow:0 24px 80px rgba(0,0,0,.58);backdrop-filter:blur(18px);text-align:left}
      #${ROOT_ID}.adf-tc-open .adf-tc-panel{display:block;animation:adfTcIn .14s ease-out}@keyframes adfTcIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
      .adf-tc-head{display:flex;justify-content:space-between;gap:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.09)}.adf-tc-head small{display:block;color:#8d95a2;font:900 9px/1.2 Figtree,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}.adf-tc-head b{display:block;margin-top:5px;font-size:12px}.adf-tc-head strong{font-size:24px;color:var(--tc-accent,#8b5cf6);font-variant-numeric:tabular-nums}.adf-tc-weather{margin-top:5px;color:#9ca4b1;font-size:10px;font-weight:750}
      .adf-tc-select{padding:13px 0 11px}.adf-tc-target{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;margin-bottom:10px}.adf-tc-step{height:36px;border-radius:9px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.05);color:#fff;font:950 18px/1 Figtree,system-ui,sans-serif;cursor:pointer}.adf-tc-step:hover:not(:disabled){border-color:var(--tc-accent)}.adf-tc-step:disabled{opacity:.3;cursor:not-allowed}.adf-tc-target-mid{text-align:center}.adf-tc-target-mid span{display:block;color:#8f96a3;font-size:10px}.adf-tc-target-mid b{display:block;margin-top:3px;font-size:20px;font-variant-numeric:tabular-nums}.adf-tc-range{width:100%;accent-color:var(--tc-accent);cursor:pointer}.adf-tc-scale{display:flex;justify-content:space-between;margin-top:5px;color:#747b87;font:750 9px/1 Figtree,system-ui,sans-serif}
      .adf-tc-actions{display:grid;gap:8px;margin-top:4px}.adf-tc-btn{min-height:44px;padding:9px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.05);color:#fff;text-align:left;cursor:pointer;font:900 12px/1.15 Figtree,system-ui,sans-serif;transition:filter .14s ease,border-color .14s ease}.adf-tc-btn:hover:not(:disabled){border-color:color-mix(in srgb,var(--tc-accent) 55%,rgba(255,255,255,.18));filter:brightness(1.08)}.adf-tc-btn span{display:block;margin-top:4px;color:#aab0bc;font:700 10px/1.25 Figtree,system-ui,sans-serif}.adf-tc-btn.primary{background:color-mix(in srgb,var(--tc-accent) 74%,#111 26%);color:#fff;border-color:color-mix(in srgb,var(--tc-accent) 78%,#111 22%)}.adf-tc-btn.primary span{color:rgba(255,255,255,.82)}.adf-tc-btn:disabled{opacity:.38;cursor:not-allowed}.adf-tc-day-label{margin:3px 0 -2px;color:#8d95a2;font:900 9px/1 Figtree,system-ui,sans-serif;letter-spacing:.11em;text-transform:uppercase}.adf-tc-day-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.adf-tc-day-actions .adf-tc-btn{text-align:center;min-height:40px}.adf-tc-status{min-height:14px;margin-top:9px;color:#969da8;font:750 10px/1.35 Figtree,system-ui,sans-serif}.adf-tc-status.bad{color:#ff9b9b}.adf-tc-status.good{color:#bde9c8}

      @media(max-width:900px){#adf-time-dock{flex-basis:202px;padding-inline:5px}#${WIDGET_ID}{width:192px;height:58px;padding:7px 9px 7px 70px;border-radius:15px}.adf-tw-sun{width:43px;height:43px;left:14px;top:7px}.adf-tw-moon{width:37px;height:37px;left:17px;top:10px}.adf-tw-time{font-size:23px}.adf-tw-meta{font-size:7.5px}.adf-tw-day{font-size:7.8px}}
      @media(max-width:620px){#adf-time-dock{flex-basis:176px;padding-inline:4px}#${WIDGET_ID}{width:168px;height:54px;padding:6px 8px 6px 61px;border-radius:14px}.adf-tw-sun{width:38px;height:38px;left:12px;top:8px}.adf-tw-moon{width:33px;height:33px;left:14px;top:10px}.adf-tw-time{font-size:21px}.adf-tw-meta{font-size:6.7px}.adf-tw-day{font-size:7px;margin-top:3px}.adf-tc-panel{width:min(340px,calc(100vw - 16px));max-height:calc(100vh - 16px)}}
      @media(prefers-reduced-motion:reduce){#${WIDGET_ID},#${WIDGET_ID} *,#${ROOT_ID} *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
    `;
    document.head.appendChild(s);
  }

  function ensure(){
    css();
    if(!widget){
      widget=document.createElement("button");
      widget.id=WIDGET_ID;
      widget.type="button";
      widget.hidden=true;
      widget.setAttribute("aria-expanded","false");
      widget.setAttribute("aria-controls","adf-tc-panel");
      widget.innerHTML=`
        <span class="adf-tw-sky" aria-hidden="true">
          <i class="adf-tw-stars"></i><i class="adf-tw-cloud c1"></i><i class="adf-tw-cloud c2"></i>
          <i class="adf-tw-weather-cloud w1"></i><i class="adf-tw-weather-cloud w2"></i>
          <i class="adf-tw-sun"></i><i class="adf-tw-moon"></i><i class="adf-tw-rain"></i>
          <i class="adf-tw-lightning"><b class="adf-tw-bolt a"></b><b class="adf-tw-bolt b"></b></i><i class="adf-tw-fog"></i>
        </span>
        <span class="adf-tw-glass" aria-hidden="true"></span>
        <span class="adf-tw-meta">ANNO 1 · SETT. 01</span>
        <strong class="adf-tw-time">08:00</strong>
        <span class="adf-tw-day">GIORNO 1/7</span>`;
      widget.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();togglePanel();});
    }
    if(!dock){
      dock=document.createElement("div");
      dock.id="adf-time-dock";
      dock.hidden=true;
      dock.appendChild(widget);
    }else if(widget.parentElement!==dock) dock.appendChild(widget);

    if(!panelRoot){
      panelRoot=document.createElement("div");
      panelRoot.id=ROOT_ID;
      panelRoot.hidden=true;
      panelRoot.innerHTML=`
        <section class="adf-tc-panel" id="adf-tc-panel" aria-label="Controllo del tempo">
          <div class="adf-tc-head">
            <div><small>Calendario</small><b class="adf-tc-full-day">Anno 1 · Settimana 1 · Giorno 1/7</b><div class="adf-tc-weather">Sereno</div></div>
            <div><small>Adesso</small><strong class="adf-tc-clock">08:00</strong></div>
          </div>
          <div class="adf-tc-select">
            <div class="adf-tc-target">
              <button class="adf-tc-step adf-tc-minus" type="button" aria-label="Riduci di 15 minuti">−</button>
              <div class="adf-tc-target-mid"><span>Attendi fino alle</span><b class="adf-tc-target-label">09:00</b></div>
              <button class="adf-tc-step adf-tc-plus" type="button" aria-label="Aumenta di 15 minuti">+</button>
            </div>
            <input class="adf-tc-range" type="range" min="480" max="1680" step="15" value="540" aria-label="Seleziona l'orario fino a cui attendere">
            <div class="adf-tc-scale"><span class="adf-tc-min">08:00</span><span>04:00</span></div>
          </div>
          <div class="adf-tc-actions">
            <button class="adf-tc-btn primary adf-tc-wait" type="button">Attendi<span class="adf-tc-wait-sub">Passa 1h</span></button>
            <div class="adf-tc-day-label">Avanza calendario</div>
            <div class="adf-tc-day-actions">
              <button class="adf-tc-btn adf-tc-day1" type="button">+1 giorno</button>
              <button class="adf-tc-btn adf-tc-day7" type="button">+7 giorni</button>
            </div>
          </div>
          <div class="adf-tc-status" aria-live="polite"></div>
        </section>`;
      document.body.appendChild(panelRoot);
      panel=panelRoot.querySelector(".adf-tc-panel");
      const range=panelRoot.querySelector(".adf-tc-range");
      range.addEventListener("input",()=>{targetTouched=true;syncTarget();});
      panelRoot.querySelector(".adf-tc-minus").onclick=()=>stepTarget(-STEP);
      panelRoot.querySelector(".adf-tc-plus").onclick=()=>stepTarget(STEP);
      panelRoot.querySelector(".adf-tc-wait").onclick=()=>waitTo(Number(range.value));
      panelRoot.querySelector(".adf-tc-day1").onclick=()=>jumpDays(1);
      panelRoot.querySelector(".adf-tc-day7").onclick=()=>jumpDays(7);
      panel.addEventListener("click",ev=>ev.stopPropagation());
    }
    return panelRoot;
  }

  function closePanel(){
    panelOpen=false;
    if(panelRoot) panelRoot.classList.remove("adf-tc-open");
    if(widget){widget.classList.remove("adf-tw-open");widget.setAttribute("aria-expanded","false");}
  }
  function openPanel(){
    if(!mount()||blockingOverlay()) return;
    panelOpen=true;targetTouched=false;
    panelRoot.classList.add("adf-tc-open");
    widget.classList.add("adf-tw-open");
    widget.setAttribute("aria-expanded","true");
    sync(true);positionPanel();
  }
  function togglePanel(){ panelOpen?closePanel():openPanel(); }

  function positionPanel(){
    if(!panelOpen||!panel||!widget||!widget.isConnected) return;
    const r=widget.getBoundingClientRect(),gap=10,pad=12;
    const width=Math.min(368,Math.max(260,window.innerWidth-pad*2));
    panel.style.width=width+"px";
    const ph=Math.min(panel.scrollHeight,Math.max(120,window.innerHeight-pad*2));
    let left=clampN(r.right-width,pad,Math.max(pad,window.innerWidth-width-pad));
    let top=r.bottom+gap;
    if(top+ph>window.innerHeight-pad && r.top-gap-ph>=pad) top=r.top-gap-ph;
    top=clampN(top,pad,Math.max(pad,window.innerHeight-ph-pad));
    panel.style.left=Math.round(left)+"px";panel.style.top=Math.round(top)+"px";
  }

  function status(text,kind){
    ensure();
    const el=panelRoot.querySelector(".adf-tc-status");
    el.textContent=text||"";el.className="adf-tc-status"+(kind?" "+kind:"");
  }

  function stepTarget(delta){
    const range=panelRoot.querySelector(".adf-tc-range"),now=GAME_TIME.now();
    range.value=String(clampN((Number(range.value)||now)+delta,now,GAME_TIME.DAY_END));
    targetTouched=true;syncTarget();
  }

  function syncTarget(){
    if(!panelRoot) return;
    const range=panelRoot.querySelector(".adf-tc-range"),now=GAME_TIME.now();
    const target=clampN(Number(range.value)||now,now,GAME_TIME.DAY_END);
    range.value=String(target);
    panelRoot.querySelector(".adf-tc-target-label").textContent=GAME_TIME.format(target);
    const delta=Math.max(0,target-now),isBlocked=blocked();
    panelRoot.querySelector(".adf-tc-wait-sub").textContent=delta?"Passano "+GAME_TIME.formatDuration(delta):"Sei già a quest'ora";
    panelRoot.querySelector(".adf-tc-wait").disabled=isBlocked||delta<=0;
    panelRoot.querySelector(".adf-tc-minus").disabled=isBlocked||target<=now;
    panelRoot.querySelector(".adf-tc-plus").disabled=isBlocked||target>=GAME_TIME.DAY_END;
    panelRoot.querySelector(".adf-tc-day1").disabled=isBlocked;
    panelRoot.querySelector(".adf-tc-day7").disabled=isBlocked;
  }

  function sync(resetTarget){
    ensure();
    if(!mount()) return;
    const now=GAME_TIME.now(),x=dayParts(),nowText=GAME_TIME.format(now),w=currentWeather();
    widget.querySelector(".adf-tw-meta").textContent="ANNO "+x.y+" · SETT. "+String(x.w).padStart(2,"0");
    widget.querySelector(".adf-tw-time").textContent=nowText;
    widget.querySelector(".adf-tw-day").textContent="GIORNO "+x.d+"/7";
    applySky(now);applyWeather();

    panelRoot.querySelector(".adf-tc-full-day").textContent=dayText();
    panelRoot.querySelector(".adf-tc-clock").textContent=nowText;
    panelRoot.querySelector(".adf-tc-weather").textContent=(w.label||"Sereno")+(w.city?" · "+w.city:"");
    const range=panelRoot.querySelector(".adf-tc-range"),min=nextSlot(now);
    range.min=String(now);range.max=String(GAME_TIME.DAY_END);range.step=String(STEP);
    panelRoot.querySelector(".adf-tc-min").textContent=nowText;
    if(resetTarget||!targetTouched||Number(range.value)<now){range.value=String(Math.min(GAME_TIME.DAY_END,Math.max(min,now+60)));}

    if(blockingOverlay()&&panelOpen) closePanel();
    if(blocked()&&panelOpen&&(actionBlocked()||eventBlocked()||blockingOverlay())) status("Prima devi chiudere la decisione o l'azione in corso.","bad");
    else if(!waiting) status("");
    syncTarget();
    if(panelOpen) positionPanel();
  }

  function queueSync(resetTarget){
    if(syncQueued) return;
    syncQueued=true;
    requestAnimationFrame(()=>{syncQueued=false;sync(!!resetTarget);});
  }

  function refreshOtherViews(){
    try{if(typeof renderGioco==="function")renderGioco();}catch(_){}
    try{if(typeof renderHub==="function")renderHub();}catch(_){}
    try{if(typeof renderStrada==="function")renderStrada();}catch(_){}
    try{if(typeof renderPosto==="function")renderPosto();}catch(_){}
    try{if(typeof renderNegozio==="function")renderNegozio();}catch(_){}
    try{if(typeof renderTelefono==="function")renderTelefono();}catch(_){}
    try{window.dispatchEvent(new CustomEvent("adf-time-controls:changed",{detail:{time:GAME_TIME.now(),day:Number(G.day)||1,week:Number(G.week)||1,year:Number(G.year)||1}}));}catch(_){}
    queueSync(true);
  }

  async function waitTo(target){
    if(waiting) return;
    if(blocked()){
      status("Prima devi chiudere la decisione o l'azione in corso.","bad");syncTarget();return;
    }
    const start=GAME_TIME.now();
    target=clampN(Math.round(Number(target)||start),start,GAME_TIME.DAY_END);
    if(target<=start) return;

    waiting=true;status("Il tempo sta passando…","");syncTarget();
    let stopped=false;
    try{
      while(GAME_TIME.now()<target){
        if(actionBlocked()||eventBlocked()){stopped=true;break;}
        const now=GAME_TIME.now(),step=Math.min(STEP,target-now);
        const out=GAME_TIME.advance(step,"wait-global",{detail:{manualWait:true,target,visualStepMs:WAIT_STEP_MS}});
        if(out&&out.blocked){stopped=true;break;}
        try{if(typeof GAME_WEATHER!=="undefined"&&GAME_WEATHER.sync)GAME_WEATHER.sync();}catch(_){}
        queueSync(false);
        await sleep(WAIT_STEP_MS);
        if(eventBlocked()){stopped=true;break;}
      }
    }finally{
      waiting=false;
      const advanced=Math.max(0,GAME_TIME.now()-start);
      refreshOtherViews();
      if(stopped){
        closePanel();status("Attesa interrotta dopo "+GAME_TIME.formatDuration(advanced)+".","bad");
        try{if(typeof toast==="function")toast("<b>Attesa interrotta.</b> C'è una decisione da prendere.","","⏸",[host?readAccent(host):"#7c3aed","#121016"]);}catch(_){}
      }else status("Ora sono le "+GAME_TIME.text()+".","good");
      targetTouched=false;sync(true);try{if(typeof save==="function")save();}catch(_){}
    }
  }

  async function jumpDays(count){
    count=Math.max(1,Math.floor(Number(count)||1));
    if(waiting) return;
    if(actionBlocked()||eventBlocked()||blockingOverlay()){
      status("Prima devi chiudere la decisione o l'azione in corso.","bad");return;
    }

    /* Via principale: Eventi V2 possiede il salto +1/+7 e quindi gestisce
       SALTO, LOW/MEDIUM automatici, HIGH che interrompono e Notifiche. */
    if(typeof window.ADF_TIME_SKIP==="function"){
      const before=calendarSerial();
      waiting=true;status("Avanzo il calendario…","");syncTarget();
      let ok=false;
      try{
        ok=!!window.ADF_TIME_SKIP(count);
        try{if(typeof GAME_WEATHER!=="undefined"&&GAME_WEATHER.sync)GAME_WEATHER.sync();}catch(_){}
      }finally{
        waiting=false;refreshOtherViews();targetTouched=false;sync(true);
      }
      if(!ok){
        status("Il calendario è bloccato da una decisione o da un'azione in corso.","bad");
        return;
      }
      const done=Math.max(0,calendarSerial()-before);
      const stopped=done<count;
      if(stopped){
        closePanel();
        status("Calendario fermato dopo "+done+" giorno"+(done===1?"":"i")+": c'è una decisione da prendere.","bad");
      }else{
        status("Avanzato di "+done+" giorno"+(done===1?"":"i")+" · "+GAME_TIME.text()+".","good");
      }
      /* Alcuni HIGH vengono materializzati nel tick successivo allo skip. */
      setTimeout(()=>queueSync(true),180);
      return;
    }

    /* Fallback legacy: resta disponibile solo se Eventi V2 non è caricato. */
    if(typeof avanzaGiorno!=="function"){
      status("Il cambio giorno non è disponibile in questa schermata.","bad");return;
    }

    waiting=true;status("Avanzo il calendario…","");syncTarget();
    let done=0,stopped=false;
    try{
      for(let i=0;i<count;i++){
        avanzaGiorno();done++;
        try{if(typeof GAME_WEATHER!=="undefined"&&GAME_WEATHER.sync)GAME_WEATHER.sync();}catch(_){}
        queueSync(true);
        await sleep(70);
        if(actionBlocked()||eventBlocked()){stopped=true;break;}
      }
      try{if(typeof save==="function")save();}catch(_){}
    }finally{
      waiting=false;refreshOtherViews();targetTouched=false;sync(true);
      if(stopped){
        closePanel();status("Calendario fermato dopo "+done+" giorno"+(done===1?"":"i")+": c'è una decisione da prendere.","bad");
      }else status("Avanzato di "+done+" giorno"+(done===1?"":"i")+" · "+GAME_TIME.text()+".","good");
    }
  }

  window.ADF_TIME_CONTROLS=Object.freeze({
    open:openPanel,close:closePanel,sync:()=>sync(false),waitTo,
    nextDay:()=>jumpDays(1),jumpDays,blocked,waitStepMs:WAIT_STEP_MS
  });

  for(const ev of ["game-time:advanced","game-time:day-start","game-event:pending","game-event:resolved","game-location:changed","game-weather:updated","game-weather:changed","jail-ui:opened","jail-ui:closed","crime-ui:closed"]){
    window.addEventListener(ev,()=>queueSync(false));
  }
  document.addEventListener("click",ev=>{
    if(panelOpen&&panel&&!panel.contains(ev.target)&&widget&&!widget.contains(ev.target)) closePanel();
    queueSync(false);
  },false);
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&panelOpen)closePanel();});
  window.addEventListener("resize",()=>{queueSync(false);positionPanel();});
  window.addEventListener("scroll",()=>{if(panelOpen)positionPanel();},true);

  const observer=new MutationObserver(()=>queueSync(false));
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});

  ensure();sync(true);
})();
