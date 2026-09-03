/*
 * ANNI DI FAME — SPOSTAMENTI NELLA CITTÀ
 * Prototipo locale / drop-in module — v1.
 *
 * Dipende da tempo.js + orari.js e si carica DOPO entrambi.
 *
 * Regole:
 * - esplorare/cliccare la mappa non consuma tempo;
 * - prima di cambiare zona viene mostrata una conferma con durata e ora di arrivo;
 * - solo "Vai" committa il viaggio;
 * - la posizione reale è persistita in G.currentPlace;
 * - la nuova giornata riparte da casa (ID interno: vita);
 * - le azioni fisiche richiedono di essere davvero nel luogo corretto;
 * - gli spostamenti sono per ora atomici, ma espongono start/end per il futuro motore eventi.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined" || typeof GAME_HOURS === "undefined") return;

  const HOME = "vita";
  const JAIL = "crimin";

  function inJail(){
    return !!(G.strada && G.strada.arresto);
  }

  /* punto 6: dimensioni del ritaglio della mappa definitiva (hub.js,
     HUB_LUOGHI) — servono solo a dare proporzione alle distanze qui sotto. */
  const MAP_W = 1536;
  const MAP_H = 600;

  /* Geometria TRAVEL congelata sulla mappa 1536×600 in uso fino al punto 6.
     Le coordinate visuali di HUB_LUOGHI possono quindi essere riposizionate
     su una nuova grafica senza cambiare per sbaglio i 15/30/45/60 minuti
     dei tragitti già bilanciati.

     Sono i CENTRI percentuali degli hotspot originali, non nuove distanze. */
  const TRAVEL_POS = Object.freeze({
    studio:    {x:14.160, y:13.335},
    pizzeria:  {x:90.040, y:60.420},
    concerti:  {x:64.455, y:25.835},
    beat:      {x:49.640, y:19.505},
    beatmaker: {x:31.905, y:37.085},
    vita:      {x:17.745, y:59.330},
    crimin:    {x:15.460, y:84.585},
    fabbrica:  {x:88.410, y:29.580},
    palestra:  {x:75.520, y:85.415},
    shop:      {x:54.035, y:44.335},
    impiego:   {x:59.245, y:60.835}
  });

  /* Solo i lavori che hanno già un punto fisico esplicito sulla mappa. */
  const JOB_PLACE = Object.freeze({
    lavapiatti:"pizzeria",
    operaio:"fabbrica"
  });

  let TRANSIT = null;

  function elencoLuoghi(){
    try{ return typeof HUB_LUOGHI !== "undefined" && Array.isArray(HUB_LUOGHI) ? HUB_LUOGHI : []; }
    catch(e){ return []; }
  }

  function luogo(id){ return elencoLuoghi().find(x => x.id === id) || null; }

  function assicuraPosizione(){
    const all = elencoLuoghi();

    /* Un arresto è anche uno stato fisico: finché la pena è attiva il
       giocatore si trova al punto Carcere/Attività criminali, non a Casa. */
    if(inJail()){
      if(!all.length || all.some(x => x.id === JAIL)){
        G.currentPlace = JAIL;
        return G.currentPlace;
      }
    }

    if(!all.length) return G.currentPlace || HOME;
    if(all.some(x => x.id === G.currentPlace)) return G.currentPlace;
    G.currentPlace = all.some(x => x.id === HOME) ? HOME : all[0].id;
    return G.currentPlace;
  }

  function centro(l){
    const travel = l && TRAVEL_POS[l.id];
    const px = travel
      ? travel.x
      : (Number(l.x)||0) + (Number(l.w)||0)/2;
    const py = travel
      ? travel.y
      : (Number(l.y)||0) + (Number(l.h)||0)/2;
    return {
      x: px / 100 * MAP_W,
      y: py / 100 * MAP_H
    };
  }

  function distanza(fromId, toId){
    if(fromId === toId) return 0;
    const a = luogo(fromId), b = luogo(toId);
    if(!a || !b) return null;
    const ac = centro(a), bc = centro(b);
    return Math.hypot(ac.x-bc.x, ac.y-bc.y);
  }

  /* Una città di provincia: tragitti leggibili, non una simulazione GPS.
     La geometria della mappa decide la fascia, poi si arrotonda a blocchi di 15 minuti. */
  function durataTra(fromId, toId){
    if(fromId === toId) return 0;
    const d = distanza(fromId, toId);
    if(d == null) return 30;       // fallback sicuro per eventuali nuovi punti senza coordinate
    if(d <= 200) return 15;
    if(d <= 400) return 30;
    if(d <= 600) return 45;
    return 60;
  }

  function azioneDirettaDelLuogo(id){
    return typeof GAME_HOURS.directActionForPlace === "function"
      ? GAME_HOURS.directActionForPlace(id) : null;
  }

  function statoArrivo(id, arrival){
    let st = GAME_HOURS.placeStatus(id, arrival);
    if(!st.open) return st;
    const action = azioneDirettaDelLuogo(id);
    if(action){
      const ast = GAME_HOURS.actionStatus(action, arrival);
      if(!ast.open) return ast;
    }
    return st;
  }

  function piano(toId){
    const fromId = assicuraPosizione();
    const dest = luogo(toId);
    if(!dest) return {ok:false, reason:"unknown-place", fromId, toId};

    if(inJail() && toId !== JAIL)
      return {ok:false, reason:"jail", fromId, toId};

    if(typeof GAME_TIME.pending === "function" && GAME_TIME.pending())
      return {ok:false, reason:"action-pending", fromId, toId};

    const minutes = durataTra(fromId, toId);
    const now = GAME_TIME.now();
    const arrival = now + minutes;
    if(arrival > GAME_TIME.DAY_END){
      return {ok:false, reason:"day-end", fromId, toId, minutes, now, arrival};
    }

    const st = statoArrivo(toId, arrival);
    if(!st.open){
      return {ok:false, reason:"arrival-closed", fromId, toId, minutes, now, arrival, status:st};
    }

    return {ok:true, same:fromId === toId, fromId, toId, minutes, now, arrival, status:st};
  }

  function requiredPlaceForAction(id){
    if(id === "turno"){
      const jid = G.job && G.job.id;
      return jid ? (JOB_PLACE[jid] || null) : null;
    }
    return typeof GAME_HOURS.placeForAction === "function" ? GAME_HOURS.placeForAction(id) : null;
  }

  function logicalPlace(id){
    return typeof GAME_HOURS.normalizePlace === "function"
      ? GAME_HOURS.normalizePlace(id) : String(id||"");
  }
  function sameGameplayPlace(a,b){
    return logicalPlace(a) === logicalPlace(b);
  }

  /* Guardia RUNTIME, non decorazione UI.
     Una tile disabilitata è solo presentazione: la stessa regola deve essere
     vera anche se un click è programmatico, la UI è rimasta indietro di un
     render o un altro ingresso prova a lanciare la mossa.
     Qui convergono:
       - transazione/azione già pendente;
       - tempo residuo prima delle 04:00;
       - finestra oraria dell'azione/turno;
       - luogo fisico realmente raggiunto. */
  function actionAccess(id, at){
    const now = at == null ? GAME_TIME.now() : Number(at);
    const current = assicuraPosizione();
    const required = requiredPlaceForAction(id);
    const duration = GAME_TIME.durationFor(id);
    const remaining = typeof GAME_TIME.remaining === "function"
      ? GAME_TIME.remaining() : null;

    if(inJail()){
      return {ok:false, reason:"jail", id, now, duration, remaining,
        currentPlace:current, requiredPlace:required};
    }

    if(typeof GAME_TIME.pending === "function" && GAME_TIME.pending()){
      return {ok:false, reason:"action-pending", id, now, duration, remaining,
        currentPlace:current, requiredPlace:required};
    }

    if(typeof GAME_TIME.canStart === "function" && !GAME_TIME.canStart(id)){
      return {ok:false, reason:"day-end", id, now, duration, remaining,
        currentPlace:current, requiredPlace:required};
    }

    const status = GAME_HOURS.actionStatus(id, now);
    if(status && !status.open){
      return {ok:false, reason:"hours", id, now, duration, remaining,
        currentPlace:current, requiredPlace:required, status};
    }

    if(required && !sameGameplayPlace(required,current)){
      return {ok:false, reason:"wrong-place", id, now, duration, remaining,
        currentPlace:current, requiredPlace:required, status:status||null};
    }

    return {ok:true, id, now, duration, remaining,
      currentPlace:current, requiredPlace:required, status:status||null};
  }

  function actionBlockText(gate){
    if(gate.reason === "jail")
      return "Sei in <b>carcere</b>. Finché non sconti la pena non puoi iniziare mosse, lavorare o andare in giro: puoi solo far passare il tempo.";

    if(gate.reason === "action-pending")
      return "Prima devi chiudere o completare la mossa già in corso.";

    if(gate.reason === "day-end"){
      const need = GAME_TIME.formatDuration ? GAME_TIME.formatDuration(gate.duration) : (gate.duration+" min");
      const left = GAME_TIME.formatDuration && gate.remaining != null
        ? GAME_TIME.formatDuration(gate.remaining) : String(gate.remaining||0)+" min";
      return "Non c'è abbastanza giornata: questa mossa richiede <b>"+need+
        "</b>, ma restano <b>"+left+"</b> prima delle 04:00.";
    }

    if(gate.reason === "hours"){
      const st=gate.status||{};
      if(st.phase === "before")
        return "Questa attività non è ancora disponibile: apre alle <b>"+st.nextText+"</b>.";
      if(st.phase === "too-late")
        return "È troppo tardi per iniziarla: non finiresti prima della chiusura.";
      return st.label ? String(st.label) : "Questa attività per oggi è chiusa.";
    }

    if(gate.reason === "wrong-place"){
      const l=luogo(gate.requiredPlace);
      return "Per fare questa mossa devi prima raggiungere <b>"+
        (l ? l.n : gate.requiredPlace)+"</b> sulla mappa. Non hai speso energia né tempo.";
    }

    return "Questa mossa non può partire adesso.";
  }

  function showActionBlock(gate){
    if(typeof showEvent !== "function") return;
    showEvent({
      k:"Accesso all'attività",
      t:"Non puoi iniziare questa mossa",
      d:actionBlockText(gate),
      annulla(){},
      opts:[{n:"Va bene", d:"Non passa tempo e non spendi niente", run(){ return null; }}]
    });
  }

  function guardAction(id, opts){
    const gate=actionAccess(id);
    if(!gate.ok && !(opts&&opts.silent)) showActionBlock(gate);
    return gate;
  }

  function emit(type, detail){
    try{ window.dispatchEvent(new CustomEvent(type, {detail})); }catch(e){}
  }

  function esegui(toId){
    const p = piano(toId);
    if(!p.ok) return p;
    if(p.same) return Object.assign({}, p, {moved:false});

    TRANSIT = {fromId:p.fromId, toId:p.toId, minutes:p.minutes, startedAt:p.now, arrival:p.arrival};
    emit("game-travel:start", Object.assign({}, TRANSIT));

    const moved = GAME_TIME.travel(p.minutes);
    if(moved && moved.blocked){
      TRANSIT = null;
      return Object.assign({}, p, {ok:false, reason:moved.reason || "travel-blocked"});
    }

    const old = p.fromId;
    G.currentPlace = toId;
    if(typeof save === "function") save();

    const detail = {
      fromId:old, toId, minutes:p.minutes,
      departedAt:p.now, arrivedAt:GAME_TIME.now(),
      departedText:GAME_TIME.format(p.now), arrivedText:GAME_TIME.text()
    };
    emit("game-location:changed", detail);
    emit("game-travel:end", detail);
    TRANSIT = null;
    return Object.assign({}, p, {moved:true, arrivedAt:GAME_TIME.now()});
  }

  function blockText(p){
    if(p.reason === "jail") return "Sei in <b>carcere</b>: non puoi spostarti finché la pena non è finita. Il calendario continua a scorrere normalmente.";
    if(p.reason === "action-pending") return "Prima devi chiudere o completare quello che stai facendo.";
    if(p.reason === "day-end") return "Non c'è abbastanza giornata: il tragitto finirebbe oltre le <b>04:00</b>.";
    if(p.reason === "arrival-closed"){
      const st = p.status || {};
      const arr = GAME_TIME.format(p.arrival);
      if(st.phase === "before") return "Arriveresti alle <b>" + arr + "</b>, ma lì apre alle <b>" + st.nextText + "</b>.";
      if(st.phase === "too-late") return "Arriveresti alle <b>" + arr + "</b>, ma non resterebbe abbastanza tempo per completare l'attività prima della chiusura.";
      return "Arriveresti alle <b>" + arr + "</b>, ma per oggi non è più accessibile.";
    }
    return "Non puoi raggiungere questo punto adesso.";
  }

  function mostraBlocco(p){
    if(typeof showEvent !== "function") return;
    showEvent({
      k:"Spostamento",
      t:"Non conviene partire adesso",
      d:blockText(p),
      annulla(){},
      opts:[{n:"Resta qui", d:"Non passa tempo", run(){ return null; }}]
    });
  }

  function mostraConferma(p, onArrive){
    if(typeof showEvent !== "function") return;
    const dur = GAME_TIME.formatDuration ? GAME_TIME.formatDuration(p.minutes) : (p.minutes + " min");
    showEvent({
      k:"Spostamento",
      t:"Vai lì?",
      d:"Partenza <b>" + GAME_TIME.format(p.now) + "</b> · arrivo previsto <b>" +
        GAME_TIME.format(p.arrival) + "</b>.<br>Il tragitto richiede <b>" + dur + "</b>.",
      annulla(){},
      opts:[
        {n:"Vai · " + dur, d:"Il tempo passa solo dopo questa conferma", run(){
          const out = esegui(p.toId);
          if(out.ok && typeof onArrive === "function") onArrive();
          return null;
        }},
        {n:"Resta qui", d:"Continua a esplorare la mappa senza perdere tempo", run(){ return null; }}
      ]
    });
  }

  function css(){
    if(document.getElementById("city-travel-css")) return;
    const s = document.createElement("style");
    s.id = "city-travel-css";
    s.textContent = `
      .pspot.travel-current::before{content:"";position:absolute;left:50%;top:50%;width:12px;height:12px;
        transform:translate(-50%,-50%);border-radius:50%;background:#F4D28E;border:2px solid rgba(12,12,14,.92);
        box-shadow:0 0 0 4px rgba(244,210,142,.18),0 0 18px rgba(244,210,142,.52);z-index:11;pointer-events:none}
      .pspot.travel-current{filter:none!important}
      .tile.travel-away{opacity:.58;filter:saturate(.65)}
      .tile .travelneed{position:absolute;right:9px;top:8px;z-index:5;padding:4px 7px;border-radius:999px;
        background:rgba(18,10,7,.86);border:1px solid rgba(244,210,142,.34);color:#F4D28E;
        font:800 9px/1 Figtree,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;backdrop-filter:blur(8px)}
    `;
    document.head.appendChild(s);
  }

  function decorateMap(){
    css();
    const cur = assicuraPosizione();
    document.querySelectorAll(".pspot[data-l]").forEach(btn => {
      const here = btn.dataset.l === cur;
      btn.classList.toggle("travel-current", here);
      if(here) btn.setAttribute("aria-current", "location");
      else btn.removeAttribute("aria-current");
    });
  }

  function decorateActions(){
    css();
    const cur = assicuraPosizione();
    const jailed = inJail();
    document.querySelectorAll(".tile[data-id]").forEach(tile => {
      const req = requiredPlaceForAction(tile.dataset.id);
      const away = !!req && !sameGameplayPlace(req,cur);
      tile.classList.toggle("travel-away", away || jailed);
      let badge = tile.querySelector(".travelneed");

      if(jailed || away){
        if(!badge){
          badge = document.createElement("span");
          badge.className = "travelneed";
          const scene = tile.querySelector(".scene");
          (scene || tile).appendChild(badge);
        }
        badge.textContent = jailed ? "in carcere" : "serve spostarti";
        tile.disabled = true;
        tile.title = jailed
          ? "Sei in carcere: puoi solo far passare il tempo."
          : "Devi prima raggiungere il luogo sulla mappa.";
      }else if(badge){ badge.remove(); }
    });
  }

  /* Possediamo noi il click dei punti. Il listener di orari.js sa che, quando
     GAME_TRAVEL esiste, la validazione va fatta all'ORA DI ARRIVO e non prima. */
  const pins = document.getElementById("hb-pins");
  if(pins) pins.addEventListener("click", ev => {
    const btn = ev.target && ev.target.closest ? ev.target.closest(".pspot[data-l]") : null;
    if(!btn) return;
    const id = btn.dataset.l;
    const p = piano(id);

    if(!p.ok){
      ev.preventDefault(); ev.stopImmediatePropagation();
      if(typeof SFX === "object" && SFX.fail) SFX.fail();
      mostraBlocco(p);
      return;
    }

    /* Sei già lì: nessun costo, lascia lavorare il listener originale di hub.js. */
    if(p.same) return;

    ev.preventDefault(); ev.stopImmediatePropagation();
    const l = luogo(id);
    mostraConferma(p, () => {
      if(typeof renderHub === "function") renderHub();
      if(l && typeof l.vai === "function") l.vai();
    });
  }, true);

  if(typeof renderHub === "function"){
    const originalHub = renderHub;
    window.renderHub = function(){
      const out = originalHub.apply(this, arguments);
      decorateMap();
      return out;
    };
  }

  if(typeof renderGioco === "function"){
    const originalGame = renderGioco;
    window.renderGioco = function(){
      const out = originalGame.apply(this, arguments);
      decorateActions();
      return out;
    };
  }

  /* Dormire/fine giornata riporta a casa solo se sei libero. Se la condanna
     è ancora attiva, ogni nuovo giorno comincia fisicamente in carcere. */
  window.addEventListener("game-time:day-start", () => {
    const from = assicuraPosizione();
    G.currentPlace = inJail()
      ? (luogo(JAIL) ? JAIL : from)
      : (luogo(HOME) ? HOME : from);
    if(from !== G.currentPlace){
      emit("game-location:changed", {
        fromId:from, toId:G.currentPlace, minutes:0,
        departedAt:GAME_TIME.now(), arrivedAt:GAME_TIME.now(), reason:"day-start"
      });
    }
    const hubScreen = document.getElementById("s-hub");
    if(hubScreen && hubScreen.classList.contains("on") && typeof renderHub === "function") renderHub();
  });

  window.GAME_TRAVEL = Object.freeze({
    handlesMapClicks:true,
    HOME,
    JAIL,
    inJail,
    ensure:assicuraPosizione,
    current:() => assicuraPosizione(),
    distance:distanza,
    duration:durataTra,
    plan:piano,
    go:esegui,
    requiredPlaceForAction,
    logicalPlace,
    sameGameplayPlace,
    actionAccess,
    guardAction,
    inTransit:() => TRANSIT ? Object.assign({}, TRANSIT) : null
  });

  assicuraPosizione();
})();
