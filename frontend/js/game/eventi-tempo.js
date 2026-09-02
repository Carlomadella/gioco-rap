/*
 * ANNI DI FAME — EVENTI NEL TEMPO E NELLA CITTÀ
 * Prototipo locale / drop-in module — v3.
 *
 * Dipende da tempo.js + orari.js + spostamenti.js e si carica DOPO tutti e tre.
 *
 * Gerarchia:
 * - basso: frequente, effetto minimo, nessuna scelta e nessun blocco;
 * - medio: meno frequente, effetto percepibile ma contenuto, nessun blocco;
 * - alto: raro, conseguenza vera, apre una scelta obbligatoria e blocca nuove mosse.
 *
 * Il motore usa quattro pezzi di contesto reali:
 * - durata dell'intervallo appena vissuto (game-time:advanced);
 * - posizione / tragitto (G.currentPlace + GAME_TRAVEL.inTransit());
 * - fase, fan e stato della carriera;
 * - tipo di scena scelto nel creator: metropoli / città media / provincia.
 *
 * Le ACTION lunghe possono essere segmentate dal clock: planHigh() campiona gli ALTI
 * sui checkpoint interni da 15 minuti usando lo snapshot pre-ACTION. Se ne cade uno,
 * tempo.js ferma il clock al checkpoint e riprende solo dopo la scelta obbligatoria.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined") return;

  const LEVELS = Object.freeze({
    basso:{basePerHour:.18, maxChance:.46, globalCd:120, idCd:2*1440},
    medio:{basePerHour:.075, maxChance:.22, globalCd:360, idCd:4*1440},
    alto:{basePerHour:.022, maxChance:.07, globalCd:1200, idCd:8*1440}
  });

  const SCENE_MULT = Object.freeze({
    metropoli:{basso:1.22, medio:1.18, alto:1.10},
    citta:{basso:1.00, medio:1.00, alto:1.00},
    provincia:{basso:.82, medio:.80, alto:.76}
  });

  const PUBLIC_PLACES = new Set(["studio","pizzeria","concerti","beat","crimin","fabbrica","palestra","shop"]);
  const EVENT_ICON = {basso:"·", medio:"!", alto:"◆"};
  const EVENT_TINT = {basso:["#3B4756","#1E242D"], medio:["#8A6C35","#332919"], alto:["#8E2C2C","#351515"]};

  let MOSTRANDO_ALTO = false;
  let RESTORE_TIMER = null;
  let AUTO_GUARD = false;

  function artist(){
    try{
      if(window.ARTIST) return window.ARTIST;
      if(typeof A !== "undefined" && A) return A;
    }catch(e){}
    return {};
  }

  function sceneId(){
    const s = String(artist().scene || "citta");
    return (s === "metropoli" || s === "provincia") ? s : "citta";
  }

  function cityName(){
    const c = String(artist().city || "").trim();
    return c || "la tua città";
  }

  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  }

  function clampLocal(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function randInt(a,b){ return Math.round(a + Math.random() * (b-a)); }
  function addStat(k, n, a, b){
    if(typeof G[k] !== "number") G[k] = 0;
    G[k] = clampLocal(G[k] + n, a == null ? -Infinity : a, b == null ? Infinity : b);
  }
  function addSkill(k,n){
    if(!G.skills) G.skills = {};
    const cur = Number(G.skills[k]) || 0;
    G.skills[k] = clampLocal(cur + n, 0, 88);
  }

  function state(){
    if(!G.eventRuntime || typeof G.eventRuntime !== "object") G.eventRuntime = {};
    const s = G.eventRuntime;
    if(!s.lastLevel || typeof s.lastLevel !== "object") s.lastLevel = {};
    if(!s.lastId || typeof s.lastId !== "object") s.lastId = {};
    if(!s.count || typeof s.count !== "object") s.count = {basso:0,medio:0,alto:0};
    return s;
  }

  function absoluteMinute(time){
    const y = Math.max(1, Number(G.year)||1);
    const w = Math.max(1, Number(G.week)||1);
    const d = Math.max(1, Number(G.day)||1);
    const dayIndex = (((y-1)*52 + (w-1))*7 + (d-1));
    const intra = Math.max(0, (time == null ? GAME_TIME.now() : time) - GAME_TIME.DAY_START);
    return dayIndex * 1440 + intra;
  }

  function transitInfo(){
    try{
      return (typeof GAME_TRAVEL !== "undefined" && GAME_TRAVEL.inTransit) ? GAME_TRAVEL.inTransit() : null;
    }catch(e){ return null; }
  }

  function currentPlace(){
    try{
      if(typeof GAME_TRAVEL !== "undefined" && GAME_TRAVEL.current) return GAME_TRAVEL.current();
    }catch(e){}
    return G.currentPlace || "vita";
  }

  function context(detail){
    detail = detail || {};
    const tr = detail.source === "travel" ? transitInfo() : null;
    const now = Number.isFinite(detail.to) ? detail.to : GAME_TIME.now();
    return {
      source:detail.source || "system",
      minutes:Math.max(0, Number(detail.minutes)||0),
      from:Number.isFinite(detail.from) ? detail.from : now,
      to:now,
      time:Number.isFinite(detail.time) ? detail.time : now,
      band:detail.band || (GAME_TIME.bandAt ? GAME_TIME.bandAt(now) : (GAME_TIME.band ? GAME_TIME.band() : "")),
      place:detail.place || (tr ? "transit" : currentPlace()),
      transit:detail.transit != null ? !!detail.transit : !!tr,
      fromId:detail.fromId != null ? detail.fromId : (tr ? tr.fromId : null),
      toId:detail.toId != null ? detail.toId : (tr ? tr.toId : null),
      city:detail.city || cityName(),
      scene:detail.scene || sceneId(),
      phase:detail.phase != null ? Number(detail.phase)||0 : Number(G.phase)||0,
      fans:detail.fans != null ? Number(detail.fans)||0 : Number(G.fans)||0,
      hype:detail.hype != null ? Number(detail.hype)||0 : Number(G.hype)||0,
      money:detail.money != null ? Number(detail.money)||0 : Number(G.money)||0,
      wellbeing:detail.wellbeing != null ? Number(detail.wellbeing)||0 : Number(G.wellbeing)||0,
      lucidita:detail.lucidita != null ? Number(detail.lucidita)||0 : (typeof luc === "function" ? Number(luc())||0 : Number(G.lucidita)||0),
      day:Number(G.day)||1,
      week:Number(G.week)||1,
      year:Number(G.year)||1,
      abs:absoluteMinute(now)
    };
  }

  function routeTouches(ctx,id){ return !!ctx.transit && (ctx.fromId === id || ctx.toId === id); }
  function atOrArriving(ctx,id){ return ctx.place === id || routeTouches(ctx,id); }
  function publicContext(ctx){
    if(ctx.transit) return true;
    return PUBLIC_PLACES.has(ctx.place);
  }

  function baseEligible(e,ctx){
    if(e.scenes && e.scenes.indexOf(ctx.scene) < 0) return false;
    if(e.bands && e.bands.indexOf(ctx.band) < 0) return false;
    if(e.sources && e.sources.indexOf(ctx.source) < 0) return false;
    if(e.minPhase != null && ctx.phase < e.minPhase) return false;
    if(e.maxPhase != null && ctx.phase > e.maxPhase) return false;
    if(e.minFans != null && ctx.fans < e.minFans) return false;
    if(e.places && !e.places.some(id => atOrArriving(ctx,id))) return false;
    if(e.transitOnly && !ctx.transit) return false;
    if(e.publicOnly && !publicContext(ctx)) return false;
    if(e.when && !e.when(ctx)) return false;
    return true;
  }

  function cooldownOk(e,ctx){
    const s = state(), cfg = LEVELS[e.level];
    const lastL = Number(s.lastLevel[e.level]);
    if(Number.isFinite(lastL) && ctx.abs - lastL < cfg.globalCd) return false;
    const lastI = Number(s.lastId[e.id]);
    const idCd = e.cooldown == null ? cfg.idCd : e.cooldown;
    if(Number.isFinite(lastI) && ctx.abs - lastI < idCd) return false;
    return true;
  }

  function eventWeight(e,ctx){
    let w = Math.max(.05, Number(e.weight)||1);
    if(typeof e.weightWhen === "function") w *= Math.max(.05, Number(e.weightWhen(ctx))||1);
    return w;
  }

  function eligible(level,ctx,ignoreCooldown){
    return EVENTS_CLOCK.filter(e => e.level === level && baseEligible(e,ctx) && (ignoreCooldown || cooldownOk(e,ctx)));
  }

  function weightedPick(pool,ctx){
    if(!pool.length) return null;
    const weights = pool.map(e => eventWeight(e,ctx));
    let r = Math.random() * weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<pool.length;i++){
      if(r < weights[i]) return pool[i];
      r -= weights[i];
    }
    return pool[pool.length-1];
  }

  function progressMult(level,ctx){
    if(level === "basso") return ctx.phase <= 1 ? 1.08 : .94;
    if(level === "medio") return 1 + Math.min(.16, ctx.phase*.035);
    return ctx.phase === 0 ? .62 : 1 + Math.min(.28, ctx.phase*.055);
  }

  function chance(level,ctx){
    const cfg = LEVELS[level];
    const hours = Math.max(.05, ctx.minutes / 60);
    const scene = SCENE_MULT[ctx.scene] || SCENE_MULT.citta;
    let p = cfg.basePerHour * hours * scene[level] * progressMult(level,ctx);
    /* In viaggio succedono più micro-cose; gli eventi alti restano rari. */
    if(ctx.transit) p *= level === "alto" ? 1.05 : 1.18;
    return Math.min(cfg.maxChance, p);
  }

  function mark(e,ctx){
    const s = state();
    s.lastLevel[e.level] = ctx.abs;
    s.lastId[e.id] = ctx.abs;
    s.count[e.level] = (Number(s.count[e.level])||0) + 1;
  }

  function emit(type,detail){
    try{ window.dispatchEvent(new CustomEvent(type,{detail})); }catch(e){}
  }

  function notifyAuto(e,ctx,result){
    const text = result && result.t ? result.t : (e.text ? e.text(ctx) : e.title);
    if(text && typeof pushLog === "function") pushLog("<b>" + e.title + ".</b> " + text, (result&&result.c)||"");
    /* Un solo Centro Notifiche: se Eventi V2 è attivo, anche gli eventi
       a minuti confluiscono nel suo store invece di registrare una seconda app. */
    try{
      if(window.ADF_EVENTI && typeof window.ADF_EVENTI.addNotification === "function"){
        window.ADF_EVENTI.addNotification({
          eventId:e.id,tier:e.level,title:e.title,result:text,source:"game-time",read:false
        });
      }
    }catch(_){}
    setTimeout(() => {
      if(typeof toast !== "function") return;
      const tint = EVENT_TINT[e.level];
      toast("<b>" + e.title + "</b> · " + text, (result&&result.c)||"", EVENT_ICON[e.level], tint);
    }, 120);
    emit("game-event:resolved", {id:e.id, level:e.level, automatic:true, result:result||null, context:ctx});
  }

  function resolveAuto(e,ctx,alreadyMarked){
    if(!alreadyMarked) mark(e,ctx);
    let result = null;
    try{ result = e.apply ? e.apply(ctx) : {t:e.text ? e.text(ctx) : e.title, c:""}; }
    catch(err){ result = {t:"È successo qualcosa, ma il gioco non è riuscito ad applicarne l'effetto.", c:"bad"}; }
    if(typeof save === "function") save();
    notifyAuto(e,ctx,result);
    return result;
  }

  function pending(){ return state().pendingHigh || null; }

  function pendingContext(raw){
    const c = Object.assign({}, raw || {});
    if(!c.city) c.city = cityName();
    if(!c.scene) c.scene = sceneId();
    return c;
  }

  function clearPending(){
    const s = state();
    delete s.pendingHigh;
    MOSTRANDO_ALTO = false;
    if(typeof save === "function") save();
  }

  function screenGameplay(){
    const a = document.getElementById("s-hub"), b = document.getElementById("s-game");
    return !!((a && a.classList.contains("on")) || (b && b.classList.contains("on")));
  }

  function queuePending(){
    if(RESTORE_TIMER != null) return;
    RESTORE_TIMER = setTimeout(() => { RESTORE_TIMER = null; showPending(); }, 0);
  }

  function showPending(){
    const p = pending();
    if(!p || MOSTRANDO_ALTO || typeof showEvent !== "function" || !screenGameplay()) return;
    const modal = document.getElementById("modal");
    if(modal && modal.classList.contains("on")){
      setTimeout(queuePending, 180);
      return;
    }
    const e = EVENTS_BY_ID[p.id];
    if(!e || e.level !== "alto"){
      clearPending();
      return;
    }
    const ctx = pendingContext(p.context);
    const opts = typeof e.options === "function" ? e.options(ctx) : [];
    MOSTRANDO_ALTO = true;
    showEvent({
      k:"Evento · ALTO",
      t:e.title,
      d:typeof e.description === "function" ? e.description(ctx) : String(e.description || ""),
      /* nessun annulla: la decisione è obbligatoria */
      opts:opts.map((o,idx) => ({
        n:o.n, d:o.d,
        run(){
          let r = null;
          try{ r = o.run ? o.run(ctx) : {t:"Scelta fatta.",c:""}; }
          finally{
            clearPending();
            emit("game-event:resolved", {id:e.id, level:"alto", automatic:false, choice:idx, result:r||null, context:ctx});
            try{
              if(typeof GAME_TIME !== "undefined" && GAME_TIME.suspended && GAME_TIME.suspended() && GAME_TIME.resumeAction){
                GAME_TIME.resumeAction();
              }
            }catch(err){}
          }
          return r;
        }
      }))
    });
  }

  function triggerHigh(e,ctx){
    if(pending()) return {blocked:true, reason:"high-pending"};
    mark(e,ctx);
    state().pendingHigh = {id:e.id, at:ctx.abs, context:{
      source:ctx.source, minutes:ctx.minutes, from:ctx.from, to:ctx.to, time:ctx.time,
      band:ctx.band, place:ctx.place, transit:ctx.transit, fromId:ctx.fromId, toId:ctx.toId,
      city:ctx.city, scene:ctx.scene, phase:ctx.phase, fans:ctx.fans,
      hype:ctx.hype, money:ctx.money, wellbeing:ctx.wellbeing, lucidita:ctx.lucidita,
      day:ctx.day, week:ctx.week, year:ctx.year, abs:ctx.abs
    }};
    if(typeof save === "function") save();
    emit("game-event:pending", {id:e.id, level:"alto", context:ctx});
    /* Sempre differito: l'azione/viaggio atomico finisce di aggiornare UI e posizione,
       poi la scelta alta prende il controllo senza essere sovrascritta da un'altra scena. */
    queuePending();
    return {pending:true,id:e.id};
  }

  function trigger(e,ctx){
    if(!e) return null;
    if(e.level === "alto") return triggerHigh(e,ctx);
    /* Anche basso/medio sono differiti di un tick: azioneFatta() emette
       game-time:advanced prima che ui.js calcoli i delta dell'azione. Se
       applicassimo subito una spesa o dei fan, il risultato dell'evento
       verrebbe erroneamente attribuito alla mossa appena conclusa. */
    mark(e,ctx);
    if(typeof save === "function") save();
    setTimeout(() => resolveAuto(e,ctx,true), 0);
    return {scheduled:true,id:e.id,level:e.level};
  }

  function snapshotInto(ctx,snap){
    if(!snap || typeof snap !== "object") return ctx;
    for(const k of ["place","scene","city","phase","fans","hype","money","wellbeing","lucidita","day","week","year"]){
      if(snap[k] != null) ctx[k]=snap[k];
    }
    return ctx;
  }

  /* Pianifica SOLO gli ALTI all'interno di una ACTION lunga. Non modifica lo
     stato e non marca cooldown: tempo.js committa il piano solo se interrompe
     davvero la mossa. I checkpoint iniziale/finale non sono validi. */
  function planHigh(detail){
    detail=detail||{};
    if(pending()) return null;
    try{
      if(window.ADF_EVENTI && ADF_EVENTI.activeCatalog) return null;
    }catch(_){}
    const from=Number(detail.from), to=Number(detail.to);
    if(!Number.isFinite(from)||!Number.isFinite(to)||to-from<=15) return null;
    const step=(GAME_TIME && Number(GAME_TIME.SLOT))||15;
    let prev=from;
    for(let at=from+step; at<to; at+=step){
      const base=context({
        source:detail.source||"azione", minutes:at-prev, from:prev, to:at, time:at,
        band:GAME_TIME.bandAt ? GAME_TIME.bandAt(at) : undefined
      });
      const ctx=snapshotInto(base,detail.snapshot);
      ctx.from=prev; ctx.to=at; ctx.time=at; ctx.minutes=at-prev;
      ctx.band=GAME_TIME.bandAt ? GAME_TIME.bandAt(at) : ctx.band;
      ctx.abs=absoluteMinute(at);
      const pool=eligible("alto",ctx,false);
      if(pool.length && Math.random()<chance("alto",ctx)){
        const e=weightedPick(pool,ctx);
        if(e) return {id:e.id,at,context:ctx};
      }
      prev=at;
    }
    return null;
  }

  function evaluate(detail){
    detail=detail||{};
    if(AUTO_GUARD || pending() || detail.suppressRandomEvents) return null;
    try{
      if(window.ADF_EVENTI && ADF_EVENTI.activeCatalog) return null;
    }catch(_){}
    const ctx = context(detail);
    if(ctx.minutes <= 0) return null;
    /* alto → medio → basso, salvo quando l'alto e' gia' stato campionato
       dal planner intra-ACTION. */
    const levels=detail.skipHigh ? ["medio","basso"] : ["alto","medio","basso"];
    for(const level of levels){
      const pool = eligible(level,ctx,false);
      if(!pool.length) continue;
      if(Math.random() >= chance(level,ctx)) continue;
      const e = weightedPick(pool,ctx);
      if(!e) continue;
      return trigger(e,ctx);
    }
    return null;
  }

  function force(id,override){
    const e = EVENTS_BY_ID[id];
    if(!e) return {ok:false,reason:"unknown-event"};
    const ctx = Object.assign(context({source:"debug",minutes:60}), override||{});
    ctx.abs = absoluteMinute(ctx.time);
    if(!baseEligible(e,ctx)) return {ok:false,reason:"not-eligible",context:ctx};
    return {ok:true,result:trigger(e,ctx),context:ctx};
  }

  /* ======================= CATALOGO ======================= */
  const EVENTS_CLOCK = [
    /* ---------- BASSO: quasi rumore di fondo ---------- */
    {id:"fan_storia", title:"Una storia al volo", level:"basso", weight:3.2, minFans:40, publicOnly:true,
      when:ctx => ctx.place !== "crimin" || ctx.fans >= 150,
      apply(){
        const f = randInt(1,5); G.fans += f; addStat("hype",1,0,100);
        return {t:"Qualcuno ti riconosce al volo e mette una storia. +"+f+" follower.",c:"good"};
      }},
    {id:"caffe_al_volo", title:"Caffè al volo", level:"basso", weight:2.1, places:["studio","beat","pizzeria","concerti","fabbrica"],
      apply(){ G.money -= 4; addStat("wellbeing",1,0,100); return {t:"Quattro euro e cinque minuti di chiacchiere. Ti rimette un minimo in asse.",c:""}; }},
    {id:"cavo_rotto", title:"Cavo rotto", level:"basso", weight:1.6, places:["studio"],
      apply(){ G.money -= 9; return {t:"Un cavo decide di morire proprio oggi. −9 € e si riparte.",c:""}; }},
    {id:"metro_piena", title:"Metro piena", level:"basso", weight:2.2, scenes:["metropoli"], transitOnly:true,
      apply(){ addStat("wellbeing",-1,0,100); return {t:"Mezzo tragitto in piedi schiacciato contro la porta. Benessere −1.",c:""}; }},
    {id:"ultimo_bus", title:"Ultimo bus", level:"basso", weight:2.4, scenes:["provincia"], transitOnly:true, bands:["sera","notte"],
      apply(){ addStat("wellbeing",-1,0,100); return {t:"Coincidenza tirata e pensilina vuota. In provincia ogni spostamento pesa un po' di più.",c:""}; }},
    {id:"faccia_nota", title:"Una faccia nota", level:"basso", weight:1.8, scenes:["citta"], minFans:120, publicOnly:true,
      apply(){ addSkill("rete",.25); return {t:"Incroci una faccia che hai già visto due volte nel giro. Due parole, rete +0,25.",c:"good"}; }},

    /* ---------- MEDIO: si sente, ma non chiede di fermarsi ---------- */
    {id:"clip_storta", title:"Clip storta", level:"medio", weight:2.4, minFans:250, publicOnly:true,
      apply(){ addStat("hype",-3,0,100); addStat("wellbeing",-2,0,100);
        return {t:"Un video tagliato male gira più del contesto. Hype −3, benessere −2.",c:"bad"}; }},
    {id:"producer_buca", title:"Producer sparito", level:"medio", weight:2.0, places:["beat"], maxPhase:2,
      apply(){ addStat("wellbeing",-3,0,100); addSkill("rete",-.4);
        return {t:"Uno che doveva farti sentire roba non si presenta. Serata buttata: benessere −3, rete giù.",c:"bad"}; }},
    {id:"turno_storto", title:"Turno storto", level:"medio", weight:1.8, sources:["turno"], places:["pizzeria","fabbrica"],
      apply(){ addStat("wellbeing",-3,0,100); G.energy = Math.max(0,(Number(G.energy)||0)-4);
        return {t:"Turno peggiore del solito. Benessere −3, energia −4.",c:"bad"}; }},
    {id:"controllo_lampo", title:"Controllo lampo", level:"medio", weight:2.0, bands:["sera","notte"],
      when:ctx => atOrArriving(ctx,"crimin") || (ctx.transit && (ctx.fromId === "crimin" || ctx.toId === "crimin")),
      apply(){
        if(G.strada){ G.strada.heat = clampLocal((Number(G.strada.heat)||0)+2,0,100); }
        addStat("wellbeing",-2,0,100);
        return {t:"Una pattuglia ti tiene lì qualche minuto e prende nota delle facce. Heat +2, benessere −2.",c:"bad"};
      }},
    {id:"serata_fredda", title:"Serata fredda", level:"medio", weight:1.5, places:["concerti"], maxPhase:2,
      apply(){ addStat("hype",-2,0,100); addStat("wellbeing",-3,0,100);
        return {t:"La sala è più vuota del previsto e lo senti addosso. Hype −2, benessere −3.",c:"bad"}; }},
    {id:"spesa_imprevista", title:"Spesa imprevista", level:"medio", weight:1.15, minPhase:1, publicOnly:true,
      apply(){ const m=randInt(20,45); G.money -= m; return {t:"Una spesa che non avevi messo in conto. −"+m+" €.",c:"bad"}; }},
    {id:"giro_piccolo", title:"Il giro è piccolo", level:"medio", weight:1.7, scenes:["provincia"], minPhase:1, publicOnly:true,
      apply(){ addStat("hype",-2,0,100); return {t:"Qui le stesse facce hanno già visto tutto tre volte. Per smuovere il giro serve uscire dalla comfort zone. Hype −2.",c:""}; }},
    {id:"troppa_gente", title:"Troppa gente", level:"medio", weight:1.7, scenes:["metropoli"], minPhase:1, publicOnly:true,
      apply(){ addStat("wellbeing",-2,0,100); addSkill("rete",.35);
        return {t:"Tre contatti, quattro nomi e nessuno che aspetta. Rete +0,35, benessere −2.",c:""}; }},

    /* ---------- ALTO: raro, scelta obbligatoria ---------- */
    {id:"volante_notte", title:"Una volante rallenta", level:"alto", weight:2.2, places:["crimin"], bands:["notte"],
      when:ctx => !!G.strada,
      description:ctx => "Fuori dalla zona di <b>"+esc(ctx.city)+"</b> una volante rallenta, torna indietro e si ferma. Non è un controllo di routine: stanno guardando proprio te.",
      options:() => [
        {n:"Resti fermo e collabori", d:"Abbassi la tensione, ma qualcosa resta agli atti", run(){
          if(G.strada) G.strada.heat = clampLocal((Number(G.strada.heat)||0)-4,0,100);
          addStat("wellbeing",-4,0,100);
          return {t:"Ti lasciano andare. Heat −4, benessere −4. La serata però cambia faccia.",c:""};
        }},
        {n:"Provi a sparire prima che scendano", d:"Se va bene non succede niente; se va male la pressione sale", run(){
          const score=(G.skills&&Number(G.skills.presenza)||0)+(G.strada?Number(G.strada.rep)||0:0)*.08;
          if(score>=24 || Math.random()<.38){ addStat("hype",2,0,100); return {t:"Giri l'angolo al momento giusto. Nessuno ti segue.",c:"good"}; }
          if(G.strada) G.strada.heat=clampLocal((Number(G.strada.heat)||0)+9,0,100);
          addStat("wellbeing",-6,0,100);
          return {t:"Ti fermano cento metri dopo. Heat +9, benessere −6.",c:"bad"};
        }}
      ]},
    {id:"lite_dietro_palco", title:"Lite dietro il palco", level:"alto", weight:1.9, places:["concerti"], minFans:500,
      description:() => "Dietro il palco due persone del giro stanno per venire alle mani. Una delle due ti chiama per nome e ti tira in mezzo. Se fai finta di niente lo vedono tutti.",
      options:() => [
        {n:"Ti metti in mezzo", d:"Presenza e sangue freddo decidono come finisce", run(){
          const p=G.skills&&Number(G.skills.presenza)||0;
          if(p>=22){ addStat("hype",6,0,100); addSkill("rete",1); return {t:"Li separi senza fare il fenomeno. Hype +6, rete +1.",c:"good"}; }
          addStat("wellbeing",-7,0,100); addStat("hype",-3,0,100);
          return {t:"Ti sei infilato in una situazione più grossa di te. Benessere −7, hype −3.",c:"bad"};
        }},
        {n:"Te ne vai", d:"Nessun rischio fisico, ma qualcuno lo legge come paura", run(){
          addStat("hype",-4,0,100); return {t:"Hai girato i tacchi. Hype −4. Domani qualcuno avrà una versione sua.",c:""};
        }}
      ]},
    {id:"problema_studio", title:"Problema in studio", level:"alto", weight:1.55, places:["studio"], minPhase:1,
      description:() => "Il tecnico ti mostra il rack: un pezzo dell'attrezzatura è partito e senza quello la sessione di oggi viene una schifezza. Puoi sistemarla subito o accettare il danno.",
      options:() => [
        {n:"Metti i soldi e sistemalo", d:"−180 €, la sala resta affidabile", run(){
          if(G.money>=180){ G.money-=180; return {t:"Centottanta euro e il problema sparisce.",c:""}; }
          addStat("wellbeing",-4,0,100); return {t:"Non avevi 180 €. La sessione salta comunque: benessere −4.",c:"bad"};
        }},
        {n:"Vai avanti così", d:"Risparmi adesso, perdi qualità e testa", run(){
          addStat("wellbeing",-5,0,100); if(typeof addLuc==="function") addLuc(-4); else addStat("lucidita",-4,0,100);
          return {t:"Hai tirato avanti con quello che c'era. Benessere −5, lucidità −4.",c:"bad"};
        }}
      ]},
    {id:"famiglia_muro", title:"A casa ti fermano", level:"alto", weight:1.35, places:["vita"],
      when:ctx => ctx.wellbeing<=34,
      description:() => "A casa ti guardano e stavolta non è la solita frase sul «lavoro vero». Ti dicono che così non stai reggendo e che domani non puoi fare finta di niente.",
      options:() => [
        {n:"Ammetti che devi fermarti", d:"Recuperi la testa, perdi un po' di spinta", run(){
          addStat("wellbeing",15,0,100); addStat("hype",-3,0,100); return {t:"Per una volta non hai risposto. Benessere +15, hype −3.",c:""};
        }},
        {n:"Dici che reggi e continui", d:"La fame resta, il corpo paga", run(){
          addStat("wellbeing",-8,0,100); if(typeof addLuc==="function") addLuc(2); else addStat("lucidita",2,0,100);
          return {t:"Hai chiuso la porta e riaperto il quaderno. Benessere −8, lucidità +2.",c:"bad"};
        }}
      ]},
    {id:"promoter_metropoli", title:"Proposta del promoter", level:"alto", weight:1.25, scenes:["metropoli"], places:["concerti"], minPhase:2, minFans:5000,
      description:ctx => "Un promoter di <b>"+esc(ctx.city)+"</b> ti prende da parte. Ha una data grossa libera fra poco, ma vuole una risposta adesso: entri pagando una quota oppure lasci il posto a un altro.",
      options:() => [
        {n:"Comprati lo spazio", d:"−500 €, ma rete e hype salgono", run(){
          if(G.money<500) return {t:"Hai detto sì senza avere i soldi. Il posto è andato a un altro.",c:"bad"};
          G.money-=500; addStat("hype",8,0,100); addSkill("rete",1.2);
          return {t:"Posto preso. −500 €, hype +8, rete +1,2.",c:"good"};
        }},
        {n:"Non paghi per esserci", d:"Tieni i soldi e la posizione", run(){
          addSkill("rete",-.8); return {t:"Hai detto no. Il promoter se lo ricorderà: rete −0,8.",c:""};
        }}
      ]}
  ];

  const EVENTS_BY_ID = Object.freeze(EVENTS_CLOCK.reduce((a,e)=>{ a[e.id]=e; return a; },{}));

  /* =================== LEGACY: INCONTRI STRADA ===================
     La repo aveva già liv=basso/medio/alto, ma fuori da SALTO mostrava una scelta
     per tutti. La regola ora diventa uniforme: basso/medio si autorisolvono anche
     nel gioco normale; solo alto apre la scelta. */
  if(typeof window.ADF_EVENTI === "undefined" && typeof provaIncontro === "function" && typeof INCONTRI !== "undefined"){
    window.provaIncontro = function(){
      if(G.ended || Math.random() > .35) return;
      const eleggibili = INCONTRI.filter(i => i.req());
      if(!eleggibili.length) return;
      const tot = eleggibili.reduce((a,i)=>a+i.peso,0);
      let r=Math.random()*tot, scelto=eleggibili[0];
      for(const i of eleggibili){ if(r<i.peso){ scelto=i; break; } r-=i.peso; }
      const scena=scelto.crea(), liv=scelto.liv||"medio";
      if(typeof SALTO !== "undefined" && SALTO){
        if(liv!=="alto"){
          if(typeof risolviIncontroAuto==="function") risolviIncontroAuto(scena);
          return;
        }
        if(typeof SALTO_STOP !== "undefined") SALTO_STOP={k:"Per strada",t:scena.t,d:scena.d,annulla(){},opts:scena.opts};
        return;
      }
      if(liv==="alto"){
        if(typeof mostraIncontro==="function") mostraIncontro(scena);
        return;
      }
      /* basso e medio: prima opzione = prudente, come già stabilito dal file strada.js */
      if(typeof risolviIncontroAuto==="function") risolviIncontroAuto(scena);
      setTimeout(()=>{
        if(typeof toast==="function") toast("<b>"+scena.t+"</b> · si è risolta mentre andavi avanti.","",EVENT_ICON[liv],EVENT_TINT[liv]);
      },120);
      emit("game-event:resolved",{id:"strada:"+scelto.id,level:liv,automatic:true,legacy:true});
    };
  }

  /* Gli EVENTS settimanali esistenti sono già tutti bivi importanti: restano ALTI.
     Evitiamo soltanto di aprirne uno mentre è già pendente un alto del clock. */
  if(typeof maybeEvent === "function"){
    const originalMaybeEvent=maybeEvent;
    window.maybeEvent=function(){ if(pending()) return; return originalMaybeEvent.apply(this,arguments); };
  }

  /* Un alto pendente blocca nuove azioni/viaggi/fine giornata dalla UI. La modale
     non ha X, ma questo rende la regola vera anche prima che la modale differita appaia. */
  document.addEventListener("click",ev=>{
    if(!pending()) return;
    const inside=ev.target&&ev.target.closest ? ev.target.closest("#modal") : null;
    if(inside) return;
    const block=ev.target&&ev.target.closest ? ev.target.closest(".tile[data-id],.pspot[data-l],#g-advance,#g-skip") : null;
    if(!block) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    queuePending();
  },true);

  window.addEventListener("game-time:advanced",ev=>{
    if(AUTO_GUARD) return;
    AUTO_GUARD=true;
    try{ evaluate(ev.detail||{}); }
    finally{ AUTO_GUARD=false; }
  });

  /* Dopo un render possiamo essere rientrati in una partita salvata con un alto
     ancora da decidere. Non lo perdiamo con un refresh. */
  if(typeof renderGioco === "function"){
    const originalRenderGame=renderGioco;
    window.renderGioco=function(){ const out=originalRenderGame.apply(this,arguments); if(pending()) queuePending(); return out; };
  }
  if(typeof renderHub === "function"){
    const originalRenderHub=renderHub;
    window.renderHub=function(){ const out=originalRenderHub.apply(this,arguments); if(pending()) queuePending(); return out; };
  }

  window.GAME_EVENTS = Object.freeze({
    levels:LEVELS,
    catalog:EVENTS_CLOCK,
    context,
    eligible:(level,detail) => eligible(level,context(detail||{}),false).slice(),
    chance:(level,detail) => chance(level,context(detail||{})),
    planHigh,
    evaluate,
    force,
    pending:() => pending() ? Object.assign({},pending()) : null,
    blocked:() => !!pending(),
    showPending:queuePending,
    scene:sceneId
  });

  state();
  if(pending()) queuePending();
})();
