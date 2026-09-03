/*
 * ANNI DI FAME — CLOCK DI GIOCO
 * Drop-in locale — v5.
 *
 * - giornata 08:00 -> 04:00;
 * - tempo indipendente dall'energia;
 * - una ACTION consuma tempo solo quando viene confermata con azioneFatta();
 * - annullare una ACTION non consuma minuti;
 * - viaggio/attesa avanzano subito e vengono salvati;
 * - gli eventi ALTI possono creare un checkpoint interno alla ACTION;
 * - un checkpoint sospeso sopravvive al refresh in G.timeRuntime.suspendedAction.
 *
 * Caricare dopo telefono.js/hub.js/uscita.js e prima di orari.js.
 */
"use strict";

(function(){
  const DAY_START = 8 * 60;       // 08:00
  const DAY_END   = 28 * 60;      // 04:00 del giorno successivo
  const SLOT      = 15;

  const DURATE = Object.freeze({
    scrivi:120,
    beat:120,
    registra:180,
    mixa:120,
    pubblica:15,
    promo:45,
    free:120,
    live:180,
    cercalavoro:90,
    stacca:180,
    palestra_pesi:75,
    palestra_cardio:45,
    ricicla:45
  });

  const DURATE_LAVORO = Object.freeze({
    volantini:240,
    lavapiatti:300,
    fattorino:300,
    barista:300,
    magazzino:360,
    buttafuori:360,
    fonico:360,
    operaio:480
  });

  let AZIONE_ID_CATTURATA = null;
  let TEMPO_AZIONE = null;

  function runtime(){
    if(!G.timeRuntime || typeof G.timeRuntime !== "object") G.timeRuntime = {};
    return G.timeRuntime;
  }

  function roundSlot(v){ return Math.round(v / SLOT) * SLOT; }

  function assicuraTempo(){
    if(Number.isFinite(G.timeMinutes)){
      G.timeMinutes = Math.max(DAY_START, Math.min(DAY_END, G.timeMinutes));
      return G.timeMinutes;
    }

    /* Importante: 0 energia e' un valore valido, non un falsy da sostituire. */
    const maxRaw = Number(G.maxEnergy);
    const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 100;
    const enRaw = Number(G.energy);
    const en = Number.isFinite(enRaw) ? Math.max(0, Math.min(max, enRaw)) : max;
    const usata = 1 - en / max;
    G.timeMinutes = Math.max(DAY_START, Math.min(DAY_END, roundSlot(DAY_START + usata * 12 * 60)));
    return G.timeMinutes;
  }

  function normalizzaOrologio(m){
    return ((Math.round(m) % 1440) + 1440) % 1440;
  }

  function formatta(m){
    const n = normalizzaOrologio(m == null ? assicuraTempo() : m);
    return String(Math.floor(n/60)).padStart(2,"0") + ":" + String(n%60).padStart(2,"0");
  }

  function formattaDurata(minuti){
    const m = Math.max(0, Math.round(Number(minuti)||0));
    const h = Math.floor(m/60), mm = m%60;
    if(!h) return mm + " min";
    if(!mm) return h + "h";
    return h + "h " + mm + "m";
  }

  function fasciaPer(m){
    const n = normalizzaOrologio(m);
    if(n >= 5*60 && n < 12*60) return "mattina";
    if(n >= 12*60 && n < 18*60) return "pomeriggio";
    if(n >= 18*60 && n < 23*60) return "sera";
    return "notte";
  }

  function fascia(){ return fasciaPer(assicuraTempo()); }

  function durataAzione(id){
    if(id === "turno"){
      const jid = G.job && G.job.id;
      return DURATE_LAVORO[jid] || 300;
    }
    return DURATE[id] == null ? 60 : DURATE[id];
  }

  function minutiRimasti(){ return Math.max(0, DAY_END - assicuraTempo()); }
  function puoIniziare(id){ return durataAzione(id) <= minutiRimasti(); }

  function azionePendente(){
    return !!((TEMPO_AZIONE && TEMPO_AZIONE.viva) || runtime().suspendedAction);
  }

  function snapshotAzione(id,before,durata){
    let scene="citta", city="";
    try{
      const art = window.ARTIST || (typeof A !== "undefined" ? A : null) || {};
      scene = art.scene === "metropoli" || art.scene === "provincia" ? art.scene : "citta";
      city = String(art.city||"").trim();
    }catch(e){}
    return {
      id:id||"azione", before, durata,
      place:G.currentPlace || "vita",
      scene, city,
      phase:Number(G.phase)||0,
      fans:Number(G.fans)||0,
      hype:Number(G.hype)||0,
      money:Number(G.money)||0,
      wellbeing:Number(G.wellbeing)||0,
      lucidita:Number(G.lucidita)||0,
      day:Number(G.day)||1,
      week:Number(G.week)||1,
      year:Number(G.year)||1
    };
  }

  function emettiAvanzamento(from,to,source,extra){
    const detail = Object.assign({
      from,to,
      fromText:formatta(from),
      toText:formatta(to),
      minutes:Math.max(0,to-from),
      source:source||"system",
      day:Number(G.day)||1,
      week:Number(G.week)||1,
      year:Number(G.year)||1,
      band:fasciaPer(to),
      remaining:Math.max(0,DAY_END-to)
    }, extra||{});
    try{ window.dispatchEvent(new CustomEvent("game-time:advanced",{detail})); }catch(e){}
    return detail;
  }

  function bloccoTempoEsterno(){
    if(azionePendente()) return "action-pending";
    try{
      if(typeof GAME_EVENTS !== "undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked()) return "event-pending";
    }catch(e){}
    return null;
  }

  function avanza(minuti,source,opts){
    assicuraTempo();
    const reason = !(opts&&opts.ignoreBlock) ? bloccoTempoEsterno() : null;
    if(reason) return {blocked:true,reason,from:G.timeMinutes,to:G.timeMinutes,reachedEnd:G.timeMinutes>=DAY_END};
    const from=G.timeMinutes;
    const to=Math.min(DAY_END,from+Math.max(0,Math.round(Number(minuti)||0)));
    G.timeMinutes=to;
    emettiAvanzamento(from,to,source,opts&&opts.detail);
    if(typeof save === "function") save();
    return {blocked:false,from,to,reachedEnd:to>=DAY_END};
  }

  function spostamento(minuti){ return avanza(minuti==null?30:minuti,"travel"); }

  function pianoAlto(tx,targetTo){
    try{
      if(typeof GAME_EVENTS === "undefined" || typeof GAME_EVENTS.planHigh !== "function") return null;
      return GAME_EVENTS.planHigh({
        source:tx.id,
        from:tx.before,
        to:targetTo,
        minutes:Math.max(0,targetTo-tx.before),
        snapshot:tx.snapshot
      });
    }catch(e){ return null; }
  }

  function interrompiAzione(tx,targetTo,plan){
    const at=Math.max(tx.before,Math.min(targetTo,Number(plan.at)));
    if(!(at>tx.before && at<targetTo)) return false;

    G.timeMinutes=at;
    const suspended={
      id:tx.id,
      before:tx.before,
      interruptedAt:at,
      targetTo,
      duration:targetTo-tx.before,
      remaining:targetTo-at,
      snapshot:tx.snapshot,
      eventId:plan.id,
      feedback:null
    };
    runtime().suspendedAction=suspended;

    /* Questo segmento esiste solo per collocare l'alto: non deve estrarre
       anche un basso/medio nello stesso pezzo di ACTION. */
    emettiAvanzamento(tx.before,at,tx.id,{suppressRandomEvents:true,actionInterrupted:true});
    if(typeof save === "function") save();

    try{
      if(typeof GAME_EVENTS !== "undefined" && typeof GAME_EVENTS.force === "function"){
        GAME_EVENTS.force(plan.id,Object.assign({},plan.context||{}, {
          source:tx.id, from:tx.before, to:at, time:at, minutes:at-tx.before
        }));
      }
    }catch(e){}

    try{ window.dispatchEvent(new CustomEvent("game-time:action-interrupted",{detail:Object.assign({},suspended)})); }catch(e){}
    return true;
  }

  function commitAzione(tx){
    const targetTo=Math.min(DAY_END,tx.before+tx.durata);
    const plan=pianoAlto(tx,targetTo);
    if(plan && interrompiAzione(tx,targetTo,plan)) return;

    G.timeMinutes=targetTo;
    /* Gli alti sono gia' stati campionati dal planner; il motore eventi puo'
       ancora valutare medio/basso sull'intervallo completo. */
    emettiAvanzamento(tx.before,targetTo,tx.id,{skipHigh:!!(typeof GAME_EVENTS!=="undefined" && GAME_EVENTS.planHigh)});
  }

  function resumeAction(){
    const r=runtime();
    const s=r.suspendedAction;
    if(!s || typeof s!=="object") return {ok:false,reason:"no-suspended-action"};

    const from=assicuraTempo();
    const target=Math.max(from,Math.min(DAY_END,Number(s.targetTo)||from));
    const feedback=s.feedback || null;
    G.timeMinutes=target;

    /* Dopo un alto non aggiungiamo altri casuali nella stessa ACTION. */
    if(target>from) emettiAvanzamento(from,target,s.id,{suppressRandomEvents:true,actionResumed:true});
    delete r.suspendedAction;
    if(typeof save === "function") save();

    const detail={
      id:s.id,
      from,to:target,
      minutes:Math.max(0,target-from),
      feedback,
      interruptedAt:s.interruptedAt,
      targetTo:s.targetTo,
      eventId:s.eventId||null
    };
    try{ window.dispatchEvent(new CustomEvent("game-time:action-resumed",{detail})); }catch(e){}
    return {ok:true,detail};
  }

  /* ui.js crea le tile dinamicamente: catturiamo l'id prima del suo onclick. */
  document.addEventListener("click",ev=>{
    const tile=ev.target&&ev.target.closest?ev.target.closest(".tile[data-id]"):null;
    if(tile) AZIONE_ID_CATTURATA=tile.dataset.id;
  },true);

  if(typeof iniziaAzione === "function"){
    const originaleInizia=iniziaAzione;
    window.iniziaAzione=function(energia){
      const out=originaleInizia.apply(this,arguments);
      assicuraTempo();
      const id=AZIONE_ID_CATTURATA || "azione";
      AZIONE_ID_CATTURATA=null;
      const durata=durataAzione(id);
      const before=G.timeMinutes;
      TEMPO_AZIONE={id,durata,before,viva:true,snapshot:snapshotAzione(id,before,durata)};
      return out;
    };
  }

  if(typeof azioneFatta === "function"){
    const originaleFatta=azioneFatta;
    window.azioneFatta=function(){
      const out=originaleFatta.apply(this,arguments);
      if(TEMPO_AZIONE && TEMPO_AZIONE.viva){
        const tx=TEMPO_AZIONE;
        tx.viva=false;
        commitAzione(tx);
      }
      return out;
    };
  }

  if(typeof annullaAzione === "function"){
    const originaleAnnulla=annullaAzione;
    window.annullaAzione=function(){
      const out=originaleAnnulla.apply(this,arguments);
      if(out && TEMPO_AZIONE && TEMPO_AZIONE.viva){
        TEMPO_AZIONE.viva=false;
        /* Il tempo non era mai stato anticipato: niente rollback da salvare. */
      }
      return out;
    };
  }

  /* Cerca lavoro apre una scelta ma il codice legacy non chiude la transazione. */
  document.addEventListener("click",ev=>{
    const opt=ev.target&&ev.target.closest?ev.target.closest("#m-opts .opt2"):null;
    if(!opt || !TEMPO_AZIONE || !TEMPO_AZIONE.viva || TEMPO_AZIONE.id!=="cercalavoro") return;
    window.azioneFatta();
    if(typeof save === "function") save();
    if(typeof renderGioco === "function") renderGioco();
  },false);

  if(typeof avanzaGiorno === "function"){
    const originaleGiorno=avanzaGiorno;
    window.avanzaGiorno=function(){
      G.timeMinutes=DAY_START;
      TEMPO_AZIONE=null;
      AZIONE_ID_CATTURATA=null;
      delete runtime().suspendedAction;
      const out=originaleGiorno.apply(this,arguments);
      G.timeMinutes=DAY_START;
      try{ window.dispatchEvent(new CustomEvent("game-time:day-start",{detail:{
        day:Number(G.day)||1,week:Number(G.week)||1,year:Number(G.year)||1,
        time:DAY_START,text:formatta(DAY_START)
      }})); }catch(e){}
      return out;
    };
  }

  if(typeof hubOra === "function") window.hubOra=function(){ return formatta(); };

  function css(){
    if(document.getElementById("game-time-css")) return;
    const s=document.createElement("style");
    s.id="game-time-css";
    s.textContent=`
      .tile .timecost{position:absolute;left:9px;bottom:8px;z-index:4;display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;background:rgba(5,7,11,.78);border:1px solid rgba(255,255,255,.16);color:#F1F3F8;font:700 10px/1 Figtree,system-ui,sans-serif;letter-spacing:.03em;backdrop-filter:blur(8px)}
      .tile .timecost::before{content:"◷";color:#F4D28E;font-size:11px}
      .tile.time-over .timecost{color:#F59E9E;border-color:rgba(239,68,68,.45)}
      .tile.time-over .timecost::before{color:#EF4444}
      #game-clock-main{display:inline-flex;align-items:center;gap:5px;margin-left:5px;color:#F4D28E;font-weight:800}
      #game-clock-main::before{content:"◷";font-size:.9em}`;
    document.head.appendChild(s);
  }

  function decoraAzioni(){
    css();
    document.querySelectorAll(".tile[data-id]").forEach(tile=>{
      const id=tile.dataset.id,durata=durataAzione(id);
      let badge=tile.querySelector&&tile.querySelector(".timecost");
      if(!badge){
        badge=document.createElement("span"); badge.className="timecost";
        const scene=tile.querySelector&&tile.querySelector(".scene");
        (scene||tile).appendChild(badge);
      }
      badge.textContent=formattaDurata(durata);
      const fuori=!puoIniziare(id);
      tile.classList.toggle("time-over",fuori);
      if(fuori){ tile.disabled=true; tile.title="Troppo tardi: servono "+formattaDurata(durata)+", restano "+formattaDurata(minutiRimasti())+" prima delle 04:00."; }
    });
  }

  function decoraMeta(){
    const meta=document.getElementById("g-meta"); if(!meta) return;
    let clock=document.getElementById("game-clock-main");
    if(!clock){ clock=document.createElement("span"); clock.id="game-clock-main"; if(meta.insertAdjacentElement) meta.insertAdjacentElement("afterend",clock); }
    clock.textContent=formatta();
  }

  if(typeof renderGioco === "function"){
    const originaleRenderGioco=renderGioco;
    window.renderGioco=function(){ assicuraTempo(); const out=originaleRenderGioco.apply(this,arguments); decoraAzioni(); decoraMeta(); return out; };
  }

  if(typeof renderHub === "function"){
    const originaleRenderHub=renderHub;
    window.renderHub=function(){
      assicuraTempo(); const out=originaleRenderHub.apply(this,arguments);
      const h=document.getElementById("hb-ora"); if(h) h.textContent=formatta();
      const th=document.getElementById("hb-telora"); if(th) th.textContent=formatta();
      return out;
    };
  }

  window.GAME_TIME=Object.freeze({
    ensure:assicuraTempo,
    now:()=>assicuraTempo(),
    text:()=>formatta(),
    format:formatta,
    formatDuration:formattaDurata,
    advance:avanza,
    travel:spostamento,
    durationFor:durataAzione,
    canStart:puoIniziare,
    pending:azionePendente,
    remaining:minutiRimasti,
    band:fascia,
    bandAt:fasciaPer,
    suspended:()=>runtime().suspendedAction ? Object.assign({},runtime().suspendedAction) : null,
    resumeAction,
    DAY_START,DAY_END,SLOT
  });

  assicuraTempo();
})();
