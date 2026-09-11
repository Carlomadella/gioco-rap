/* ADF_MENU_MUSIC_V1_1
   Musica pre-game: Dream Catcher dalla prima interazione fino all'ingresso
   effettivo nel gameplay. Gli SFX restano esistenti ma ADF_AUDIO li sopprime
   in modalità pregame.

   Fra pagine HTML diverse il browser distrugge il player: salviamo posizione e
   timestamp in sessionStorage e riprendiamo dallo stesso punto logico. Nel
   futuro desktop un backend persistente potrà rendere il passaggio realmente
   continuo senza cambiare questa API. */
"use strict";
(() => {
  if(!window.ADF_AUDIO) return;

  /* ADF_AUDIO_PARENT_MUSIC_V1
     Quando gioco/accesso vivono dentro l'app shell, Dream Catcher
     appartiene alla landing top-level e NON viene ricreata.

     Risultato:
       landing -> gioco -> creator -> città
     usano sempre lo stesso identico player. */
  const parentMusic = (() => {
    try{
      if(window.parent === window)
        return null;

      const p = window.parent;

      if(!p.ADF_APP_SHELL ||
         !p.ADF_AUDIO ||
         !p.ADF_AUDIO.music)
        return null;

      return p.ADF_AUDIO.music;

    }catch(e){
      return null;
    }
  })();

  if(parentMusic){

    function targetIngressoDiretto(e){
      const t = e && e.target;

      if(!t ||
         typeof t.closest !== "function")
        return false;

      return !!t.closest(
        '[data-avvio="continua"],' +
        '[data-avvio="slot"],' +
        '[data-audio-direct-gameplay="1"]'
      );
    }

    function proxyStartCinematic(seconds){
      try{
        ADF_AUDIO.setMode("cinematic");
      }catch(e){}

      return parentMusic.startCinematic(
        seconds == null ? 2.5 : seconds
      );
    }

    function proxyStopGameplay(seconds){
      try{
        ADF_AUDIO.setMode("gameplay");
      }catch(e){}

      return parentMusic.stopForGameplay(seconds);
    }

    function proxyEnsureMenu(){
      /* Il player del parent non deve trasformare una richiesta accidentale
         in una transizione di fase del documento figlio. */
      if(ADF_AUDIO.mode !== "pregame"){
        try{ ADF_AUDIO.unlock(); }catch(e){}
        return Promise.resolve(false);
      }

      try{
        window.parent.ADF_AUDIO.setMode("pregame");
      }catch(e){}

      return parentMusic.ensureMenu();
    }

    ADF_AUDIO.music = {
      ensureMenu:proxyEnsureMenu,

      preparePageHandoff(){
        /* Il player è nel parent: nessun handoff necessario. */
        return 0;
      },

      startCinematic:proxyStartCinematic,
      stopForGameplay:proxyStopGameplay,

      resumeHandoff(){
        return !!parentMusic.playing;
      },

      saveState(){
        if(typeof parentMusic.saveState === "function")
          return parentMusic.saveState();
      },

      get playing(){
        return !!parentMusic.playing;
      },

      get track(){
        return parentMusic.track;
      }
    };

    function proxyGesture(e){

      /* CONTINUA da fermo non deve avviare Dream Catcher. */
      if(targetIngressoDiretto(e)){
        try{ ADF_AUDIO.unlock(); }catch(err){}
        return;
      }

      if(ADF_AUDIO.mode === "cinematic"){
        try{ ADF_AUDIO.unlock(); }catch(err){}
        return;
      }

      /* Normalmente a questo punto Dream Catcher sta già andando
         dalla landing. Se non sta andando, il creator può comunque
         risvegliarla con una gesture reale. */
      if(parentMusic.playing){
        try{ ADF_AUDIO.unlock(); }catch(err){}
        return;
      }

      try{ ADF_AUDIO.unlock(); }catch(err){}
    }

    document.addEventListener(
      "pointerdown",
      proxyGesture,
      {capture:true}
    );

    document.addEventListener(
      "keydown",
      proxyGesture,
      {capture:true}
    );

    return;
  }

  const KEY = "adf-menu-music-handoff-v1";
  const FIRST_FADE = 1.5;
  /* Nessun ritardo artificiale prima del cambio documento. */
  const HANDOFF_IN = .04; /* ADF_AUDIO_HANDOFF_V1_2 */
  const TRACK = {
    id: "dream-catcher",
    src: window.__ADF_MENU_MUSIC_SRC__ || "media/audio/music/dream-catcher.mp3",
    loopStart: .15,
    /* il file dura ~377.21 s; gli ultimi ~4.06 s sono silenziosi */
    loopEnd: 372.95
  };
  let stream = null, wanted = false, pending = false, restored = false, timer = 0;
  let revealDone = false, entryFade = FIRST_FADE;
  let stopTimer = 0, handoffRestoreTimer = 0;

  const sourceUrl = () => /^data:/i.test(TRACK.src) ? TRACK.src : new URL(TRACK.src, document.baseURI).href;
  function loadState(){ try{ return JSON.parse(sessionStorage.getItem(KEY) || "null"); }catch(e){ return null; } }
  function clearState(){ try{ sessionStorage.removeItem(KEY); }catch(e){} }
  function wrap(t){
    const len = TRACK.loopEnd - TRACK.loopStart;
    if(!(len > 0)) return Math.max(0, t);
    while(t >= TRACK.loopEnd) t = TRACK.loopStart + (t - TRACK.loopEnd);
    while(t < TRACK.loopStart) t += len;
    return t;
  }
  function saveState(){
    if(!stream || !wanted) return;
    try{
      sessionStorage.setItem(KEY, JSON.stringify({
        id:TRACK.id, t:stream.currentTime, stamp:Date.now(), playing:!stream.paused
      }));
    }catch(e){}
  }
  function make(){
    if(stream) return stream;
    stream = ADF_AUDIO.createStream({
      src:sourceUrl(),
      channel:"music",
      preload:"auto"
    });

    /* Primo avvio reale: fade-in approvato. */
    stream.setLocalGain(0, 0);
    stream.on("timeupdate", () => {
      if(stream && stream.currentTime >= TRACK.loopEnd) stream.seek(TRACK.loopStart);
    });
    stream.on("ended", () => { if(wanted){ stream.seek(TRACK.loopStart); attemptPlay(); } });
    return stream;
  }
  function restore(){
    if(restored) return;
    restored = true;
    const s = loadState();
    if(!s || s.id !== TRACK.id) return;
    entryFade = HANDOFF_IN;
    let t = Number(s.t) || TRACK.loopStart;
    if(s.playing && Number.isFinite(+s.stamp)) t += Math.max(0, (Date.now() - +s.stamp) / 1000);
    make().seek(wrap(t));
  }
  function revealAfterPlay(){
    if(!stream || revealDone) return;
    revealDone = true;
    stream.setLocalGain(1, entryFade);
  }

  function attemptPlay(){
    if(!wanted) return Promise.resolve(false);
    const m = make();
    ADF_AUDIO.unlock();
    let p;
    try{ p = m.play(); }catch(e){ pending = true; return Promise.resolve(false); }
    if(p && typeof p.then === "function"){
      return p.then(() => { pending = false; revealAfterPlay(); saveState(); return true; })
        .catch(() => { pending = true; return false; });
    }
    pending = false; revealAfterPlay(); saveState(); return Promise.resolve(true);
  }
  function ensureMenu(){
    /* Avviare la musica e cambiare fase sono responsabilita' diverse: solo
       chi ha gia' dichiarato il pregame puo' chiedere Dream Catcher. */
    if(ADF_AUDIO.mode !== "pregame") return Promise.resolve(false);

    /* Se torniamo al menu durante il fade, il timer non deve lasciare lo
       stream vivo ma definitivamente a gain zero. Il prossimo play completa
       un nuovo reveal a partire dal livello raggiunto. */
    const stopInCorso = !!stopTimer;
    clearTimeout(stopTimer);
    clearTimeout(handoffRestoreTimer);
    stopTimer = 0;
    handoffRestoreTimer = 0;
    wanted = true;
    restore(); make();
    if(stopInCorso) revealDone = false;
    if(!timer) timer = setInterval(() => {
      if(pending && navigator.userActivation && navigator.userActivation.isActive) attemptPlay();
      if(stream && wanted){
        if(stream.currentTime >= TRACK.loopEnd) stream.seek(TRACK.loopStart);
        saveState();
      }
    }, 500);
    return attemptPlay();
  }
  /* Il browser cambierà davvero documento. Salviamo soltanto il punto:
     nessun fade-out e nessuna attesa introdotta dal router. */
  function preparePageHandoff(){
    saveState();
    return 0;
  }

  function fadeOutAndStop(seconds){
    wanted = false;
    pending = false;
    clearState();
    clearTimeout(stopTimer);
    clearTimeout(handoffRestoreTimer);
    stopTimer = 0;
    handoffRestoreTimer = 0;

    if(!stream) return;

    if(stream.paused){
      stream.seek(TRACK.loopStart);
      stream.setLocalGain(1, 0);
      revealDone = false;
      return;
    }

    const d = Math.max(0, Number(seconds) || 0);
    stream.setLocalGain(0, d);

    stopTimer = setTimeout(() => {
      stopTimer = 0;
      if(!stream || wanted) return;
      stream.pause();
      stream.seek(TRACK.loopStart);
      stream.setLocalGain(1, 0);
      revealDone = false;
    }, d * 1000 + 40);
  }

  function startCinematic(seconds){
    ADF_AUDIO.setMode("cinematic");
    fadeOutAndStop(seconds == null ? 2.5 : seconds);
  }

  function stopForGameplay(seconds){
    ADF_AUDIO.setMode("gameplay");
    fadeOutAndStop(seconds);
  }
  function resumeHandoff(){
    const s = loadState();
    if(!s || s.id !== TRACK.id || !s.playing) return false;
    wanted = true; restore(); make(); attemptPlay(); return true;
  }
  function ingressoDiretto(e){
    const t = e && e.target;
    if(!t || typeof t.closest !== "function") return false;

    /* Carriere già esistenti: niente musica menu neppure per un frame. */
    return !!t.closest(
      '[data-avvio="continua"],' +
      '[data-avvio="slot"],' +
      '[data-audio-direct-gameplay="1"]'
    );
  }

  function onGesture(e){
    if(ingressoDiretto(e)){
      ADF_AUDIO.unlock();
      return;
    }

    if(ADF_AUDIO.mode === "cinematic"){
      ADF_AUDIO.unlock();
      return;
    }

    if(wanted || pending) attemptPlay();
    else if(!isGamePage()) ensureMenu();
  }
  function isGamePage(){ return !!document.getElementById("s-hub") || /(?:^|\/)gioco\.html$/i.test(location.pathname); }

  ADF_AUDIO.music = {ensureMenu, preparePageHandoff, startCinematic, stopForGameplay, resumeHandoff, saveState,
    get playing(){ return !!stream && !stream.paused; }, get track(){ return TRACK.id; }};

  window.addEventListener("pagehide", saveState);
  document.addEventListener("pointerdown", onGesture, {capture:true});
  document.addEventListener("keydown", onGesture, {capture:true});

  /* Se arriviamo da un'altra pagina mentre la canzone era già partita,
     proviamo subito. Se l'autoplay del browser lo vieta, il primo gesto reale
     della nuova pagina completa il resume. */
  resumeHandoff();
})();
