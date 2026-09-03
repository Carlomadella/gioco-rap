"use strict";

/*
 * ANNI DI FAME — LUCE MAPPA CITTÀ
 *
 * Il clock resta uno solo: GAME_TIME.
 * Questo modulo traduce semplicemente i minuti di gioco nelle opacità
 * dei tre render già presenti nell'hub.
 *
 * Curva:
 *   08:00–17:15  giorno pieno
 *   17:15–19:30  giorno -> tramonto
 *   19:30–22:00  tramonto -> notte
 *   22:00–04:00  notte piena
 *
 * Durante Attendi, tempo-controlli.js avanza a step di 15 minuti e ogni
 * step emette game-time:advanced: il crossfade segue quindi lo slider
 * senza creare un secondo timer o modificare il gameplay.
 */
(function(){
  if(typeof GAME_TIME === "undefined") return;

  const DAY_END_FULL = 17 * 60 + 15; // 17:15
  const SUNSET_FULL  = 19 * 60 + 30; // 19:30
  const NIGHT_FULL   = 22 * 60;      // 22:00

  let lastMinute = null;

  function clamp01(v){ return Math.max(0, Math.min(1, Number(v) || 0)); }
  function smooth(t){
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }

  function weights(minute){
    const m = Number(minute);

    if(!Number.isFinite(m) || m <= DAY_END_FULL){
      return {day:1, sunset:0, night:0, phase:"day"};
    }

    if(m < SUNSET_FULL){
      const t = smooth((m - DAY_END_FULL) / (SUNSET_FULL - DAY_END_FULL));
      return {day:1, sunset:t, night:0, phase:"sunset"};
    }

    if(m < NIGHT_FULL){
      const t = smooth((m - SUNSET_FULL) / (NIGHT_FULL - SUNSET_FULL));
      return {day:1, sunset:1, night:t, phase:t < .55 ? "sunset" : "night"};
    }

    return {day:1, sunset:1, night:1, phase:"night"};
  }

  function elements(){
    const foto = document.getElementById("hb-foto");
    if(!foto) return null;

    const day = foto.querySelector(".pmap-day");
    const sunset = foto.querySelector(".pmap-sunset");
    const night = foto.querySelector(".pmap-night");
    if(!day || !sunset || !night) return null;

    return {foto, day, sunset, night};
  }

  function transitionMs(detail){
    if(detail && Number.isFinite(Number(detail.visualStepMs))){
      /* Attendi: il nuovo step arriva ogni 350 ms.
         La transizione dura poco più dello step: i cambi si fondono tra loro. */
      return Math.max(380, Math.min(650, Math.round(Number(detail.visualStepMs) * 1.25)));
    }
    /* Azioni/spostamenti possono saltare anche ore: il cambio resta morbido
       ma non rallenta il gameplay. */
    return 1050;
  }

  function apply(minute, opts){
    const els = elements();
    if(!els) return false;

    const m = Number.isFinite(Number(minute)) ? Number(minute) : GAME_TIME.now();
    const w = weights(m);
    const instant = !!(opts && opts.instant);
    const ms = instant ? 0 : transitionMs(opts && opts.detail);

    els.foto.style.setProperty("--map-light-ms", ms + "ms");
    if(instant) els.foto.classList.add("map-light-instant");

    /* Le immagini sono opache e sovrapposte:
       giorno resta la base;
       il tramonto entra sopra il giorno;
       la notte entra sopra il tramonto.
       In questo modo non compare mai un buco nero nel mezzo del crossfade. */
    els.day.style.opacity = "1";
    els.sunset.style.opacity = w.sunset.toFixed(4);
    els.night.style.opacity = w.night.toFixed(4);

    /* Già utile in futuro per highlight/effetti che devono essere più
       discreti di giorno e più visibili di notte. */
    els.foto.dataset.phase = w.phase;
    els.foto.dataset.mapMinute = String(Math.round(m));

    lastMinute = m;

    if(instant){
      requestAnimationFrame(() => {
        els.foto.classList.remove("map-light-instant");
        els.foto.style.setProperty("--map-light-ms", "900ms");
      });
    }
    return true;
  }

  function sync(detail, instant){
    let m = null;
    if(detail && Number.isFinite(Number(detail.to))) m = Number(detail.to);
    else if(detail && Number.isFinite(Number(detail.time))) m = Number(detail.time);
    else m = GAME_TIME.now();

    return apply(m, {detail:detail || null, instant:!!instant});
  }

  window.addEventListener("game-time:advanced", ev => sync(ev.detail, false));
  window.addEventListener("game-time:day-start", ev => sync(ev.detail, false));

  /* Emesso dal controller globale dopo Attendi / salti calendario.
     È anche una rete di sicurezza se una UI futura aggiorna il clock senza
     lasciare l'hub visibile durante tutti gli step intermedi. */
  window.addEventListener("adf-time-controls:changed", ev => sync(ev.detail, false));

  /* Se la schermata hub viene ridisegnata o riaperta, riallinea la luce
     al valore corrente senza mantenere uno stato parallelo. */
  window.addEventListener("game-location:changed", () => sync(null, false));
  document.addEventListener("visibilitychange", () => {
    if(!document.hidden) sync(null, true);
  });

  window.ADF_MAP_LIGHT = Object.freeze({
    sync: () => sync(null, false),
    apply: minute => apply(minute, {instant:false}),
    weights,
    phase: minute => weights(minute == null ? GAME_TIME.now() : minute).phase,
    current: () => ({
      minute:lastMinute == null ? GAME_TIME.now() : lastMinute,
      weights:weights(lastMinute == null ? GAME_TIME.now() : lastMinute)
    })
  });

  /* Primo frame: niente flash giorno se una partita viene caricata di notte. */
  sync(null, true);
})();