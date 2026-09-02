/*
 * ANNI DI FAME — CONTROLLO TEMPO GLOBALE
 * Punto 1 hardening procedure 2026-09-02.
 *
 * Regola UI unica:
 * - il blocco tempo vive SEMPRE nella testata della finestra attiva, in alto a destra;
 * - stesso ordine e stessa grafica: GIORNO → ORA → controllo;
 * - il pannello si apre SEMPRE sotto quel blocco, allineato a destra;
 * - slider e tasti -15/+15 cambiano il target, non il clock direttamente;
 * - "Attendi" avanza davvero GAME_TIME a step di 15 minuti;
 * - un evento ALTO / una ACTION pendente interrompe l'attesa;
 * - "Giorno successivo" riusa il comando Fine giornata già esistente.
 *
 * Caricare dopo eventi-v2.js + eventi-tempo.js.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined") return;

  const ROOT_ID = "adf-time-controls";
  const STEP = Number(GAME_TIME.SLOT) || 15;
  const HOSTS = [
    {id:"jail",    root:"#adf-jail.on",      head:".adf-jail-top", right:58},
    {id:"strada", root:"#strada.on",         head:".topbar",       right:58},
    {id:"posto",  root:"#posto.on",          head:".pohead",       right:58},
    {id:"negozio",root:"#negozio.on",        head:".nghead",       right:58},
    {id:"game",   root:"#s-game.screen.on",  head:"#gtop .tline",  right:58},
    {id:"hub",    root:"#s-hub.screen.on",   head:".pbarra",       right:14}
  ];

  let root=null, host=null, panelOpen=false, waiting=false, targetTouched=false;
  let syncQueued=false;
  const hiddenLegacy=[];

  function clampN(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function nextSlot(v){ return Math.min(GAME_TIME.DAY_END, Math.ceil(v/STEP)*STEP); }

  function activeHost(){
    for(const spec of HOSTS){
      const scope=document.querySelector(spec.root);
      if(!scope) continue;
      const head=scope.querySelector(spec.head);
      if(head) return {spec,scope,head};
    }
    return null;
  }

  function restoreLegacy(){
    while(hiddenLegacy.length){
      const el=hiddenLegacy.pop();
      if(el&&el.classList) el.classList.remove("adf-tc-legacy-hidden");
    }
  }

  function hideLegacyFor(id){
    restoreLegacy();
    const add=el=>{ if(el&&el.classList){ el.classList.add("adf-tc-legacy-hidden"); hiddenLegacy.push(el); } };
    if(id==="hub") add(document.querySelector("#s-hub .pora"));
    if(id==="strada"){
      const c=document.getElementById("crimeClock") || document.getElementById("st-ora");
      add(c&&c.parentElement ? c.parentElement : c);
    }
  }

  function mount(){
    ensure();
    const found=activeHost();
    if(!found){
      restoreLegacy();
      host=null;
      root.hidden=true;
      return false;
    }
    if(!host || host.head!==found.head){
      if(host&&host.head&&host.head.classList) host.head.classList.remove("adf-time-host");
      host=found;
      host.head.classList.add("adf-time-host");
      host.head.style.setProperty("--adf-time-right",host.spec.right+"px");
      host.head.appendChild(root);
      hideLegacyFor(host.spec.id);
      panelOpen=false;
      root.classList.remove("adf-tc-open");
      const pill=root.querySelector(".adf-tc-pill");
      if(pill) pill.setAttribute("aria-expanded","false");
      targetTouched=false;
    }
    root.dataset.host=host.spec.id;
    root.hidden=false;
    return true;
  }

  function eventBlocked(){
    try{ return typeof GAME_EVENTS!=="undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked(); }
    catch(_){ return false; }
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

  function dayText(short){
    const d=Math.max(1,Number(G.day)||1), w=Math.max(1,Number(G.week)||1), y=Math.max(1,Number(G.year)||1);
    return short ? ("Giorno "+d+"/7") : ("Anno "+y+" · Settimana "+w+" · Giorno "+d+"/7");
  }

  function refreshOtherViews(){
    try{ if(typeof renderGioco==="function") renderGioco(); }catch(_){}
    try{ if(typeof renderHub==="function") renderHub(); }catch(_){}
    try{ if(typeof renderStrada==="function") renderStrada(); }catch(_){}
    try{ if(typeof renderPosto==="function") renderPosto(); }catch(_){}
    try{ if(typeof renderNegozio==="function") renderNegozio(); }catch(_){}
    try{ if(typeof renderTelefono==="function") renderTelefono(); }catch(_){}
    try{ window.dispatchEvent(new CustomEvent("adf-time-controls:changed",{detail:{
      time:GAME_TIME.now(),day:Number(G.day)||1,week:Number(G.week)||1,year:Number(G.year)||1
    }})); }catch(_){}
    queueSync(true);
  }

  function css(){
    if(document.getElementById("adf-time-controls-css")) return;
    const s=document.createElement("style");
    s.id="adf-time-controls-css";
    s.textContent=`
      .adf-time-host{position:relative!important;overflow:visible!important}
      .adf-tc-legacy-hidden{visibility:hidden!important;pointer-events:none!important}
      #${ROOT_ID}{position:absolute;right:var(--adf-time-right,14px);top:50%;transform:translateY(-50%);z-index:140;font-family:Figtree,Inter,system-ui,sans-serif;color:#f5f3ee}
      #${ROOT_ID}[hidden]{display:none!important}
      #${ROOT_ID} *{box-sizing:border-box}
      .adf-tc-pill,.adf-tc-panel{background:rgba(10,11,14,.92);border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 54px rgba(0,0,0,.42);backdrop-filter:blur(18px)}
      .adf-tc-pill{display:flex;align-items:center;gap:9px;height:40px;padding:0 11px;border-radius:12px;cursor:pointer;color:inherit;white-space:nowrap}
      .adf-tc-pill:hover{border-color:rgba(244,210,142,.56)}
      .adf-tc-day{font:900 9px/1 Figtree,system-ui,sans-serif;letter-spacing:.08em;color:#aeb3bd;text-transform:uppercase}
      .adf-tc-now{font:950 16px/1 Figtree,system-ui,sans-serif;color:#f4d28e;font-variant-numeric:tabular-nums}
      .adf-tc-arrow{opacity:.58;font-size:10px;transition:transform .16s ease}.adf-tc-open .adf-tc-arrow{transform:rotate(180deg)}
      .adf-tc-panel{position:absolute;right:0;top:calc(100% + 9px);width:min(368px,calc(100vw - 28px));padding:15px;border-radius:15px;display:none;text-align:left}
      .adf-tc-open .adf-tc-panel{display:block;animation:adfTcIn .15s ease-out}
      @keyframes adfTcIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
      .adf-tc-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.09)}
      .adf-tc-head small{display:block;color:#8f96a3;font:850 9px/1.2 Figtree,system-ui,sans-serif;letter-spacing:.11em;text-transform:uppercase}
      .adf-tc-head b{display:block;margin-top:5px;font-size:12px}.adf-tc-head strong{font-size:24px;color:#f4d28e;font-variant-numeric:tabular-nums}
      .adf-tc-select{padding:13px 0 11px}.adf-tc-target{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;margin-bottom:10px}
      .adf-tc-step{height:36px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.055);color:#f5f3ee;font:950 16px/1 Figtree,system-ui,sans-serif;cursor:pointer}
      .adf-tc-step:disabled{opacity:.3;cursor:not-allowed}
      .adf-tc-target-mid{text-align:center}.adf-tc-target-mid span{display:block;color:#8f96a3;font-size:10px}.adf-tc-target-mid b{display:block;margin-top:3px;font-size:19px;font-variant-numeric:tabular-nums}
      .adf-tc-range{width:100%;accent-color:#f4d28e;cursor:pointer}.adf-tc-scale{display:flex;justify-content:space-between;margin-top:5px;color:#747b87;font:750 9px/1 Figtree,system-ui,sans-serif}
      .adf-tc-actions{display:grid;grid-template-columns:1fr;gap:8px;margin-top:4px}.adf-tc-btn{min-height:42px;padding:9px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.055);color:#f5f3ee;text-align:left;cursor:pointer;font:900 12px/1.15 Figtree,system-ui,sans-serif}
      .adf-tc-btn span{display:block;margin-top:4px;color:#8f96a3;font:700 10px/1.25 Figtree,system-ui,sans-serif}.adf-tc-btn.primary{background:#f3eee4;color:#111;border-color:#f3eee4}.adf-tc-btn.primary span{color:#5e5b56}.adf-tc-btn:disabled{opacity:.38;cursor:not-allowed}
      .adf-tc-status{min-height:14px;margin-top:9px;color:#969da8;font:750 10px/1.35 Figtree,system-ui,sans-serif}.adf-tc-status.bad{color:#ff9b9b}.adf-tc-status.good{color:#bde9c8}
      @media(max-width:760px){#${ROOT_ID}{right:10px}.adf-tc-pill{height:36px;padding:0 9px}.adf-tc-day{display:none}.adf-tc-panel{width:min(340px,calc(100vw - 20px))}}
    `;
    document.head.appendChild(s);
  }

  function ensure(){
    if(root&&root.isConnected) return root;
    css();
    if(!root){
      root=document.createElement("div");
      root.id=ROOT_ID;
      root.hidden=true;
      root.innerHTML=`
        <button class="adf-tc-pill" type="button" aria-expanded="false" aria-controls="adf-tc-panel">
          <span class="adf-tc-day">Giorno 1/7</span><b class="adf-tc-now">08:00</b><span class="adf-tc-arrow">▼</span>
        </button>
        <section class="adf-tc-panel" id="adf-tc-panel" aria-label="Controllo del tempo">
          <div class="adf-tc-head"><div><small>Calendario</small><b class="adf-tc-full-day">Anno 1 · Settimana 1 · Giorno 1/7</b></div><div><small>Adesso</small><strong class="adf-tc-clock">08:00</strong></div></div>
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
            <button class="adf-tc-btn adf-tc-next-day" type="button">Giorno successivo<span>Chiude oggi e riparte domani alle 08:00</span></button>
          </div>
          <div class="adf-tc-status" aria-live="polite"></div>
        </section>`;
      document.body.appendChild(root);

      const pill=root.querySelector(".adf-tc-pill"), range=root.querySelector(".adf-tc-range");
      pill.onclick=()=>{
        if(root.hidden) return;
        panelOpen=!panelOpen;
        root.classList.toggle("adf-tc-open",panelOpen);
        pill.setAttribute("aria-expanded",panelOpen?"true":"false");
        if(panelOpen){ targetTouched=false; sync(true); }
      };
      range.addEventListener("input",()=>{ targetTouched=true; syncTarget(); });
      root.querySelector(".adf-tc-minus").onclick=()=>stepTarget(-STEP);
      root.querySelector(".adf-tc-plus").onclick=()=>stepTarget(STEP);
      root.querySelector(".adf-tc-wait").onclick=()=>waitTo(Number(range.value));
      root.querySelector(".adf-tc-next-day").onclick=()=>nextDay();
      root.addEventListener("click",ev=>ev.stopPropagation());
    }
    return root;
  }

  function status(text,kind){
    ensure();
    const el=root.querySelector(".adf-tc-status");
    el.textContent=text||"";
    el.className="adf-tc-status"+(kind?" "+kind:"");
  }

  function stepTarget(delta){
    if(!root) return;
    const range=root.querySelector(".adf-tc-range");
    const now=GAME_TIME.now();
    range.value=String(clampN((Number(range.value)||now)+delta,now,GAME_TIME.DAY_END));
    targetTouched=true;
    syncTarget();
  }

  function syncTarget(){
    if(!root) return;
    const range=root.querySelector(".adf-tc-range"), now=GAME_TIME.now();
    const target=clampN(Number(range.value)||now,now,GAME_TIME.DAY_END);
    range.value=String(target);
    root.querySelector(".adf-tc-target-label").textContent=GAME_TIME.format(target);
    const delta=Math.max(0,target-now), isBlocked=blocked();
    root.querySelector(".adf-tc-wait-sub").textContent=delta?"Passano "+GAME_TIME.formatDuration(delta):"Sei già a quest'ora";
    root.querySelector(".adf-tc-wait").disabled=isBlocked||delta<=0;
    root.querySelector(".adf-tc-minus").disabled=isBlocked||target<=now;
    root.querySelector(".adf-tc-plus").disabled=isBlocked||target>=GAME_TIME.DAY_END;
  }

  function sync(resetTarget){
    ensure();
    if(!mount()) return;
    if(blockingOverlay()){
      root.hidden=true;
      return;
    }
    root.hidden=false;

    const now=GAME_TIME.now();
    root.querySelector(".adf-tc-day").textContent=dayText(true);
    root.querySelector(".adf-tc-now").textContent=GAME_TIME.format(now);
    root.querySelector(".adf-tc-full-day").textContent=dayText(false);
    root.querySelector(".adf-tc-clock").textContent=GAME_TIME.format(now);

    const range=root.querySelector(".adf-tc-range"), min=nextSlot(now);
    range.min=String(now); range.max=String(GAME_TIME.DAY_END); range.step=String(STEP);
    root.querySelector(".adf-tc-min").textContent=GAME_TIME.format(now);
    if(resetTarget || !targetTouched || Number(range.value)<now){
      range.value=String(Math.min(GAME_TIME.DAY_END,Math.max(min,now+60)));
    }

    const isBlocked=blocked();
    root.querySelector(".adf-tc-next-day").disabled=isBlocked;
    if(isBlocked&&panelOpen&&(actionBlocked()||eventBlocked()||blockingOverlay())) status("Prima devi chiudere la decisione o l'azione in corso.","bad");
    else if(!waiting) status("");
    syncTarget();
  }

  function queueSync(resetTarget){
    if(syncQueued) return;
    syncQueued=true;
    requestAnimationFrame(()=>{ syncQueued=false; sync(!!resetTarget); });
  }

  function idle(){ return new Promise(resolve=>setTimeout(resolve,24)); }

  async function waitTo(target){
    if(waiting) return;
    if(blocked()){
      status("Prima devi chiudere la decisione o l'azione in corso.","bad");
      syncTarget();
      return;
    }
    const start=GAME_TIME.now();
    target=clampN(Math.round(Number(target)||start),start,GAME_TIME.DAY_END);
    if(target<=start) return;

    waiting=true;
    status("Il tempo sta passando…","");
    syncTarget();
    let stopped=false;
    try{
      while(GAME_TIME.now()<target){
        if(actionBlocked()||eventBlocked()){ stopped=true; break; }
        const now=GAME_TIME.now(), step=Math.min(STEP,target-now);
        const out=GAME_TIME.advance(step,"wait-global",{detail:{manualWait:true,target}});
        if(out&&out.blocked){ stopped=true; break; }
        await idle();
        if(eventBlocked()){ stopped=true; break; }
      }
    }finally{
      waiting=false;
      const advanced=Math.max(0,GAME_TIME.now()-start);
      refreshOtherViews();
      if(stopped){
        panelOpen=false;
        root.classList.remove("adf-tc-open");
        root.querySelector(".adf-tc-pill").setAttribute("aria-expanded","false");
        status("Attesa interrotta dopo "+GAME_TIME.formatDuration(advanced)+".","bad");
        try{ if(typeof toast==="function") toast("<b>Attesa interrotta.</b> C'è una decisione da prendere.","","⏸",["#7C3AED","#312E81"]); }catch(_){}
      }else status("Ora sono le "+GAME_TIME.text()+".","good");
      targetTouched=false;
      sync(true);
      try{ if(typeof save==="function") save(); }catch(_){}
    }
  }

  function nextDay(){
    if(blocked()){
      status("Prima devi chiudere la decisione o l'azione in corso.","bad");
      return;
    }
    panelOpen=false;
    root.classList.remove("adf-tc-open");
    root.querySelector(".adf-tc-pill").setAttribute("aria-expanded","false");
    status("");
    try{
      const official=document.getElementById("g-advance");
      if(official&&typeof official.click==="function") official.click();
      else if(typeof avanzaGiorno==="function"){
        avanzaGiorno();
        if(typeof save==="function") save();
      }
      setTimeout(refreshOtherViews,0);
    }catch(_){ status("Non sono riuscito a cambiare giorno.","bad"); return; }
    targetTouched=false;
    setTimeout(()=>sync(true),40);
  }

  window.ADF_TIME_CONTROLS=Object.freeze({
    open(){ panelOpen=true; ensure(); sync(true); root.classList.add("adf-tc-open"); root.querySelector(".adf-tc-pill").setAttribute("aria-expanded","true"); },
    close(){ panelOpen=false; if(root){ root.classList.remove("adf-tc-open"); root.querySelector(".adf-tc-pill").setAttribute("aria-expanded","false"); } },
    sync:()=>sync(false), waitTo, nextDay, blocked
  });

  for(const ev of ["game-time:advanced","game-time:day-start","game-event:pending","game-event:resolved","game-location:changed"]){
    window.addEventListener(ev,()=>queueSync(false));
  }
  document.addEventListener("click",()=>queueSync(false),true);
  window.addEventListener("resize",()=>queueSync(false));

  const observer=new MutationObserver(()=>queueSync(false));
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});

  ensure();
  sync(true);
})();
