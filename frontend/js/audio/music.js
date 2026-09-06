/* ADF_MENU_MUSIC_V1
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
  const KEY = "adf-menu-music-handoff-v1";
  const TRACK = {
    id: "dream-catcher",
    src: window.__ADF_MENU_MUSIC_SRC__ || "media/audio/music/dream-catcher.mp3",
    loopStart: .15,
    /* il file dura ~377.21 s; gli ultimi ~4.06 s sono silenziosi */
    loopEnd: 372.95
  };
  let stream = null, wanted = false, pending = false, restored = false, timer = 0;

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
    stream = ADF_AUDIO.createStream({src:sourceUrl(), channel:"music", preload:"auto"});
    stream.setLocalGain(1, 0);
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
    let t = Number(s.t) || TRACK.loopStart;
    if(s.playing && Number.isFinite(+s.stamp)) t += Math.max(0, (Date.now() - +s.stamp) / 1000);
    make().seek(wrap(t));
  }
  function attemptPlay(){
    if(!wanted) return Promise.resolve(false);
    const m = make();
    ADF_AUDIO.unlock();
    let p;
    try{ p = m.play(); }catch(e){ pending = true; return Promise.resolve(false); }
    if(p && typeof p.then === "function"){
      return p.then(() => { pending = false; saveState(); return true; })
        .catch(() => { pending = true; return false; });
    }
    pending = false; saveState(); return Promise.resolve(true);
  }
  function ensureMenu(){
    wanted = true;
    ADF_AUDIO.setMode("pregame");
    restore(); make();
    if(!timer) timer = setInterval(() => {
      if(pending && navigator.userActivation && navigator.userActivation.isActive) attemptPlay();
      if(stream && wanted){
        if(stream.currentTime >= TRACK.loopEnd) stream.seek(TRACK.loopStart);
        saveState();
      }
    }, 500);
    return attemptPlay();
  }
  function stopForGameplay(seconds){
    wanted = false; pending = false; clearState();
    if(!stream) return;
    const d = Math.max(0, Number(seconds) || 0);
    stream.setLocalGain(0, d);
    setTimeout(() => {
      if(!stream || wanted) return;
      stream.pause();
      stream.seek(TRACK.loopStart);
      stream.setLocalGain(1, 0);
    }, d * 1000 + 40);
  }
  function resumeHandoff(){
    const s = loadState();
    if(!s || s.id !== TRACK.id || !s.playing) return false;
    wanted = true; restore(); make(); attemptPlay(); return true;
  }
  function onGesture(){ if(wanted || pending) attemptPlay(); else if(!isGamePage()) ensureMenu(); }
  function isGamePage(){ return !!document.getElementById("s-hub") || /(?:^|\/)gioco\.html$/i.test(location.pathname); }

  ADF_AUDIO.music = {ensureMenu, stopForGameplay, resumeHandoff, saveState,
    get playing(){ return !!stream && !stream.paused; }, get track(){ return TRACK.id; }};

  window.addEventListener("pagehide", saveState);
  document.addEventListener("pointerdown", onGesture, {capture:true});
  document.addEventListener("keydown", onGesture, {capture:true});

  /* Se arriviamo da un'altra pagina mentre la canzone era già partita,
     proviamo subito. Se l'autoplay del browser lo vieta, il primo gesto reale
     della nuova pagina completa il resume. */
  resumeHandoff();
})();
