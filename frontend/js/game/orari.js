/*
 * ANNI DI FAME — ORARI DELLA CITTÀ
 * Prototipo locale / drop-in module — v1.
 *
 * Dipende da GAME_TIME (tempo.js) e si carica DOPO hub.js/telefono.js/tempo.js.
 * Non rinomina nessun punto della mappa: lavora solo sugli ID interni.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined") return;

  const PLACE_HOURS = Object.freeze({
    studio:    {open:"09:00", close:"02:00"},
    pizzeria:  {open:"16:00", close:"02:00"},
    concerti:  {open:"20:00", close:"03:00"},
    beat:      {open:"13:00", close:"02:00"},
    vita:      {allDay:true},
    crimin:    {open:"18:00", close:"04:00"},
    fabbrica:  {open:"08:00", close:"19:00"},
    palestra:  {open:"08:00", close:"23:00"},
    shop:      {open:"10:00", close:"22:00"},
    /* punto 6: un ufficio pubblico, orario d'ufficio — il campetto invece
       resta senza voce qui, e statusWindow lo tratta come sempre aperto. */
    impiego:   {open:"09:00", close:"18:00"}
  });

  /* Finestre delle azioni realmente legate a un luogo. Le altre restano libere:
     per esempio scrivere barre o fare promo non richiede che un locale sia aperto. */
  const ACTION_PLACE = Object.freeze({
    beat:"beat",
    registra:"studio",
    mixa:"studio",
    live:"concerti",
    palestra:"palestra"
  });

  /* I lavori non usano tutti un punto della mappa, ma hanno comunque un turno
     credibile: durata e finestra insieme determinano l'ultimo orario utile di inizio. */
  const JOB_HOURS = Object.freeze({
    volantini:  {open:"09:00", close:"19:00"},
    lavapiatti: {open:"17:00", close:"02:00"},
    fattorino:  {open:"11:00", close:"02:00"},
    barista:    {open:"08:00", close:"19:00"},
    magazzino:  {open:"08:00", close:"21:00"},
    buttafuori: {open:"20:00", close:"04:00"},
    fonico:     {open:"12:00", close:"02:00"},
    operaio:    {open:"08:00", close:"19:00"}
  });

  /* Gli eventi nell'hub avevano già un'ora stampata ma erano cliccabili sempre.
     Ora quell'ora è vera. */
  const EVENT_HOURS = Object.freeze({
    free:   {open:"21:00", close:"00:30", action:"free"},
    sala:   {open:"22:30", close:"01:30"},
    stacca: {open:"00:00", close:"04:00", action:"stacca"},
    colpo:  {open:"01:30", close:"04:00"}
  });

  const DIRECT_PLACE_ACTION = Object.freeze({concerti:"live", palestra:"palestra"});

  function parseClock(text){
    const m = String(text || "").match(/^(\d{1,2}):(\d{2})$/);
    if(!m) return null;
    const h = +m[1], mm = +m[2];
    if(h < 0 || h > 23 || mm < 0 || mm > 59) return null;
    let out = h * 60 + mm;
    /* La giornata di gioco comincia alle 08:00: 00:00–04:00 appartengono
       alla coda della stessa giornata, quindi diventano 24:00–28:00. */
    if(out < GAME_TIME.DAY_START) out += 1440;
    return out;
  }

  function fmt(min){ return GAME_TIME.format(min); }

  function statusWindow(def, at){
    const now = at == null ? GAME_TIME.now() : at;
    if(!def) return {open:true, now, allDay:true, label:"Sempre disponibile"};
    if(def.allDay) return {open:true, now, allDay:true, label:"Sempre aperto"};
    const open = parseClock(def.open), close = parseClock(def.close);
    if(open == null || close == null) return {open:true, now, invalid:true};
    if(now < open){
      return {open:false, now, openAt:open, closeAt:close, phase:"before",
        nextText:fmt(open), label:"Apre alle " + fmt(open)};
    }
    if(now >= close){
      return {open:false, now, openAt:open, closeAt:close, phase:"after",
        nextText:fmt(open), label:"Riapre domani alle " + fmt(open)};
    }
    return {open:true, now, openAt:open, closeAt:close, phase:"open",
      closeText:fmt(close), label:"Aperto fino alle " + fmt(close)};
  }

  function placeStatus(id, at){ return statusWindow(PLACE_HOURS[id], at); }

  function scheduleForAction(id){
    if(id === "turno"){
      const jid = G.job && G.job.id;
      return jid ? JOB_HOURS[jid] : null;
    }
    const place = ACTION_PLACE[id];
    return place ? PLACE_HOURS[place] : null;
  }

  function actionStatus(id, at){
    const def = scheduleForAction(id);
    if(!def) return {open:true, unrestricted:true, now:at == null ? GAME_TIME.now() : at};
    const st = statusWindow(def, at);
    if(!st.open) return st;
    const duration = GAME_TIME.durationFor(id);
    const finish = st.now + duration;
    if(st.closeAt != null && finish > st.closeAt){
      return Object.assign({}, st, {
        open:false,
        phase:"too-late",
        duration,
        finish,
        label:"Troppo tardi: chiude alle " + fmt(st.closeAt)
      });
    }
    st.duration = duration;
    st.finish = finish;
    return st;
  }

  function eventStatus(id, at){
    const def = EVENT_HOURS[id];
    const st = statusWindow(def, at);
    if(!def || !st.open || !def.action) return st;
    const duration = GAME_TIME.durationFor(def.action);
    const finish = st.now + duration;
    if(st.closeAt != null && finish > st.closeAt){
      return Object.assign({}, st, {open:false, phase:"too-late", duration, finish,
        label:"Troppo tardi per finirlo oggi"});
    }
    return Object.assign(st, {duration, finish});
  }

  function waitText(st){
    if(!st || st.open) return "";
    if(st.phase === "before") return "Alle " + st.nextText;
    if(st.phase === "too-late") return "Troppo tardi";
    return "Finito per oggi";
  }

  function injectCss(){
    if(document.getElementById("city-hours-css")) return;
    const s = document.createElement("style");
    s.id = "city-hours-css";
    s.textContent = `
      .pspot[data-hours-label]::after{content:attr(data-hours-label);position:absolute;left:50%;bottom:-3px;
        transform:translate(-50%,100%);white-space:nowrap;pointer-events:none;opacity:0;
        padding:4px 7px;border-radius:999px;background:rgba(7,8,10,.90);border:1px solid rgba(255,255,255,.18);
        color:#f4ead5;font:800 9px/1 Figtree,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;
        transition:opacity .16s ease,transform .16s ease;z-index:12}
      .pspot:hover::after,.pspot:focus-visible::after,.pspot.orario-chiuso::after{opacity:1;transform:translate(-50%,calc(100% + 3px))}
      .pspot.orario-chiuso{filter:saturate(.45) brightness(.72)}
      .pspot.orario-chiuso::after{color:#ffb2a8;border-color:rgba(239,68,68,.42);background:rgba(24,8,8,.92)}
      .tile .hourscost{position:absolute;right:9px;bottom:8px;z-index:4;padding:4px 7px;border-radius:999px;
        background:rgba(5,7,11,.78);border:1px solid rgba(255,255,255,.14);color:#cfd4de;
        font:700 10px/1 Figtree,system-ui,sans-serif;letter-spacing:.02em;backdrop-filter:blur(8px)}
      .tile.hours-over .hourscost{color:#ffb2a8;border-color:rgba(239,68,68,.42)}
      .pev.event-waiting,.pev.event-ended{opacity:.58;filter:saturate(.62)}
      .pev.event-live{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--k) 55%,transparent)}
      .pev.event-live .pevora::before{content:"● ";font-size:.75em;animation:hoursPulse 1.35s ease-in-out infinite}
      @keyframes hoursPulse{50%{opacity:.3}}
    `;
    document.head.appendChild(s);
  }

  function decoratePlaces(){
    injectCss();
    document.querySelectorAll(".pspot[data-l]").forEach(btn => {
      const id = btn.dataset.l;
      const st = placeStatus(id);
      btn.classList.toggle("orario-chiuso", !st.open);
      btn.dataset.hoursLabel = st.open ? (st.allDay ? "Sempre aperto" : "Aperto · fino " + st.closeText)
        : (st.phase === "before" ? "Chiuso · apre " + st.nextText : "Chiuso");
    });
  }

  function decorateActions(){
    injectCss();
    document.querySelectorAll(".tile[data-id]").forEach(tile => {
      const id = tile.dataset.id;
      const def = scheduleForAction(id);
      if(!def) return;
      const st = actionStatus(id);
      let badge = tile.querySelector(".hourscost");
      if(!badge){
        badge = document.createElement("span");
        badge.className = "hourscost";
        const scene = tile.querySelector(".scene");
        (scene || tile).appendChild(badge);
      }
      badge.textContent = st.open ? "fino " + st.closeText
        : st.phase === "before" ? "apre " + st.nextText
        : st.phase === "too-late" ? "chiude " + fmt(st.closeAt)
        : "chiuso";
      tile.classList.toggle("hours-over", !st.open);
      if(!st.open){
        tile.disabled = true;
        tile.title = st.label;
      }
    });
  }

  function decorateEvents(){
    injectCss();
    document.querySelectorAll(".pev[data-e]").forEach(btn => {
      const id = btn.dataset.e;
      const st = eventStatus(id);
      const originalDisabled = btn.disabled;
      btn.classList.toggle("event-live", !!st.open);
      btn.classList.toggle("event-waiting", !st.open && st.phase === "before");
      btn.classList.toggle("event-ended", !st.open && st.phase !== "before");
      if(!st.open) btn.disabled = true;
      else btn.disabled = originalDisabled;
      const ora = btn.querySelector(".pevora");
      const go = btn.querySelector(".pevgo");
      if(ora && st.open) ora.textContent = "ORA";
      if(go && !st.open) go.textContent = waitText(st);
      else if(go && st.open) go.textContent = id === "colpo" ? "Accetta ora" : "Partecipa ora";
    });
  }

  function closedMessage(st){
    if(st.phase === "before") return "È ancora presto. Questo punto della città apre alle <b>" + st.nextText + "</b>.";
    if(st.phase === "too-late") return "Per oggi è troppo tardi: non c'è abbastanza tempo per finire prima della chiusura.";
    return "Per oggi ha chiuso. Torna domani dopo le <b>" + st.nextText + "</b>.";
  }

  function showClosed(st){
    if(typeof showEvent !== "function") return;
    showEvent({
      k:"Orari della città",
      t:st.phase === "too-late" ? "Non fai più in tempo" : "Al momento è chiuso",
      d:closedMessage(st),
      annulla(){},
      opts:[{n:"Va bene", d:"Torni alla mappa", run(){ return null; }}]
    });
  }

  /* Blocca il click PRIMA del listener originale di hub.js. Non usa l.n e non
     modifica le scritte fotografiche della mappa. */
  const pins = document.getElementById("hb-pins");
  if(pins) pins.addEventListener("click", ev => {
    const btn = ev.target && ev.target.closest ? ev.target.closest(".pspot[data-l]") : null;
    if(!btn) return;
    const id = btn.dataset.l;
    let st = placeStatus(id);
    if(st.open && DIRECT_PLACE_ACTION[id]) st = actionStatus(DIRECT_PLACE_ACTION[id]);
    if(st.open) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if(typeof SFX === "object" && SFX.fail) SFX.fail();
    showClosed(st);
  }, true);

  if(typeof renderHub === "function"){
    const originalHub = renderHub;
    window.renderHub = function(){
      const out = originalHub.apply(this, arguments);
      decoratePlaces();
      decorateEvents();
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

  /* Se in futuro travel()/attese avanzano il clock mentre l'hub è visibile,
     gli stati aperto/chiuso si aggiornano senza bisogno di cambiare schermata. */
  window.addEventListener("game-time:advanced", () => {
    const hubScreen = document.getElementById("s-hub");
    if(hubScreen && hubScreen.classList.contains("on") && typeof renderHub === "function") renderHub();
  });
  window.addEventListener("game-time:day-start", () => {
    const hubScreen = document.getElementById("s-hub");
    if(hubScreen && hubScreen.classList.contains("on") && typeof renderHub === "function") renderHub();
  });

  window.GAME_HOURS = Object.freeze({
    places:PLACE_HOURS,
    jobs:JOB_HOURS,
    events:EVENT_HOURS,
    parse:parseClock,
    placeStatus,
    actionStatus,
    eventStatus,
    placeForAction:(id) => ACTION_PLACE[id] || null,
    directActionForPlace:(id) => DIRECT_PLACE_ACTION[id] || null
  });
})();
