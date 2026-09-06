/* ADF_AUDIO_ARCH_V1
   Motore audio centrale di Anni di Fame.

   Contratto importante: il gioco usa ADF_AUDIO; Web Audio è soltanto il backend
   attuale. Un futuro wrapper desktop può installare un backend nativo senza
   cambiare il formato dei beat né la logica delle schermate. */
"use strict";
(() => {
  const CANALI = ["music", "sfx", "ui", "beat", "ambient", "cinematic"];
  const MODI = new Set(["pregame", "cinematic", "gameplay"]); /* ADF_AUDIO_MODES_V1_1 */
  let modo = "pregame";
  let backend = null;

  const pct = v => Math.max(0, Math.min(1, (Number(v) || 0) / 100));
  function livelli(){
    const a = (typeof SET !== "undefined" && SET.audio) ? SET.audio : {};
    const on = a.on !== false;
    const master = on ? pct(a.master == null ? 80 : a.master) : 0;
    const sfx = pct(a.sfx == null ? 80 : a.sfx);
    return {
      master,
      music: pct(a.music == null ? 70 : a.music),
      sfx,
      ui: pct(a.ui == null ? (a.sfx == null ? 80 : a.sfx) : a.ui),
      beat: pct(a.beat == null ? 85 : a.beat),
      ambient: pct(a.ambient == null ? 70 : a.ambient),
      /* Per ora CINEMATIC segue il volume SFX. */
      cinematic: pct(a.cinematic == null ? (a.sfx == null ? 80 : a.sfx) : a.cinematic)
    };
  }
  function soppresso(canale){
    /* Pregame: soltanto Dream Catcher.
       Cinematic: musica in uscita + effetti delle scene.
       Gameplay: tutti i bus disponibili. */
    if(modo === "pregame") return canale !== "music";
    if(modo === "cinematic") return canale !== "music" && canale !== "cinematic";
    return false;
  }

  function webAudioBackend(){
    let ctx = null, graph = null;
    const streams = new Set();

    function context(){
      if(!ctx){
        const C = window.AudioContext || window.webkitAudioContext;
        if(!C) return null;
        try{ ctx = new C(); }catch(e){ return null; }
      }
      return ctx;
    }
    function resume(){
      const c = context();
      if(c && c.state === "suspended"){
        try{ return c.resume(); }catch(e){}
      }
      return Promise.resolve();
    }
    function ensureGraph(){
      const c = context(); if(!c) return null;
      if(graph && graph.context === c) return graph;

      const master = c.createGain();
      let end = master;
      try{
        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 3.4;
        comp.attack.value = .004; comp.release.value = .2;
        master.connect(comp); comp.connect(c.destination); end = comp;
      }catch(e){ master.connect(c.destination); }

      const channels = {};
      CANALI.forEach(k => {
        const g = c.createGain();
        g.connect(master);
        channels[k] = g;
      });
      graph = {context:c, master, end, channels};
      refresh();
      return graph;
    }
    function directVolume(stream){
      const l = livelli();
      const ch = soppresso(stream.channel) ? 0 : (l[stream.channel] == null ? 1 : l[stream.channel]);
      try{ stream.el.volume = Math.max(0, Math.min(1, l.master * ch * stream.local)); }catch(e){}
    }
    function refresh(){
      if(graph){
        const c = graph.context, l = livelli(), t = c.currentTime;
        try{ graph.master.gain.setTargetAtTime(l.master, t, .015); }catch(e){ graph.master.gain.value = l.master; }
        CANALI.forEach(k => {
          const v = soppresso(k) ? 0 : (l[k] == null ? 1 : l[k]);
          try{ graph.channels[k].gain.setTargetAtTime(v, t, .015); }catch(e){ graph.channels[k].gain.value = v; }
        });
      }
      streams.forEach(s => { if(s.direct) directVolume(s); });
    }
    function bus(name){
      const g = ensureGraph();
      return g ? (g.channels[name] || g.master) : null;
    }
    function createStream(opts){
      opts = opts || {};
      const el = new Audio();
      el.preload = opts.preload || "auto";
      el.src = opts.src || "";
      const state = {el, channel:opts.channel || "music", local:1, direct:false, source:null, gain:null, pendingSeek:null};
      streams.add(state);

      function attach(){
        if(state.source || state.direct) return;
        const c = context(), g = ensureGraph();
        if(!c || !g){ state.direct = true; directVolume(state); return; }
        try{
          state.source = c.createMediaElementSource(el);
          state.gain = c.createGain();
          state.gain.gain.value = state.local;
          state.source.connect(state.gain);
          state.gain.connect(g.channels[state.channel] || g.master);
        }catch(e){
          state.direct = true;
          directVolume(state);
        }
      }
      function seek(v){
        const n = Math.max(0, Number(v) || 0);
        try{
          if(Number.isFinite(el.duration) && el.duration > 0) el.currentTime = Math.min(n, Math.max(0, el.duration - .03));
          else { state.pendingSeek = n; el.currentTime = n; }
        }catch(e){ state.pendingSeek = n; }
      }
      el.addEventListener("loadedmetadata", () => {
        if(state.pendingSeek != null){ const v = state.pendingSeek; state.pendingSeek = null; seek(v); }
      });

      return {
        play(){ attach(); resume(); refresh(); try{ return el.play(); }catch(e){ return Promise.reject(e); } },
        pause(){ try{ el.pause(); }catch(e){} },
        stop(){ try{ el.pause(); }catch(e){} seek(0); },
        seek,
        setLocalGain(v, sec){
          state.local = Math.max(0, Math.min(1, Number(v) || 0));
          if(state.gain && graph){
            const p = state.gain.gain, t = graph.context.currentTime, d = Math.max(0, Number(sec) || 0);
            try{
              p.cancelScheduledValues(t);
              p.setValueAtTime(p.value, t);
              if(d) p.linearRampToValueAtTime(state.local, t + d); else p.setValueAtTime(state.local, t);
            }catch(e){ p.value = state.local; }
          }else if(state.direct) directVolume(state);
        },
        on(type, fn, opts2){ el.addEventListener(type, fn, opts2); return () => el.removeEventListener(type, fn, opts2); },
        get currentTime(){ return Number(el.currentTime) || 0; },
        get duration(){ return Number(el.duration) || 0; },
        get paused(){ return !!el.paused; },
        get ended(){ return !!el.ended; },
        destroy(){ try{ el.pause(); }catch(e){} try{ if(state.source) state.source.disconnect(); }catch(e){} try{ if(state.gain) state.gain.disconnect(); }catch(e){} streams.delete(state); }
      };
    }
    function dispose(){
      streams.forEach(s => { try{ s.el.pause(); }catch(e){} });
      streams.clear();
      try{ if(ctx) ctx.close(); }catch(e){}
      ctx = null; graph = null;
    }
    return {name:"web-audio", context, resume, refresh, bus, createStream, dispose};
  }

  function installBackend(next){
    if(!next || typeof next.createStream !== "function") throw new Error("ADF_AUDIO: backend non valido");
    try{ if(backend && backend.dispose) backend.dispose(); }catch(e){}
    backend = next;
    refresh();
  }
  function refresh(){ try{ if(backend && backend.refresh) backend.refresh(); }catch(e){} }
  function unlock(){
    try{ return backend && backend.resume ? backend.resume() : Promise.resolve(); }
    catch(e){ return Promise.resolve(); }
  }
  function canPlay(channel){
    const l = livelli();
    if(soppresso(channel)) return false;
    return l.master > 0 && (l[channel] == null || l[channel] > 0);
  }
  function setMode(next){
    modo = MODI.has(next) ? next : "pregame";
    refresh();
    try{ window.dispatchEvent(new CustomEvent("adf:audio-mode", {detail:{mode:modo}})); }catch(e){}
  }

  backend = webAudioBackend();

  const API = {
    version: 1,
    get mode(){ return modo; },
    get backendName(){ return backend && backend.name || "unknown"; },
    installBackend,
    unlock,
    refresh,
    canPlay,
    setMode,
    createStream(opts){ return backend.createStream(opts); },
    /* Ponte temporaneo per il vecchio fx.js e beatplay.js. Il nuovo codice di
       gameplay non deve dipendere da AudioContext: usa le API di alto livello. */
    legacy: {
      context(){ return backend && backend.context ? backend.context() : null; },
      bus(name){ return backend && backend.bus ? backend.bus(name) : null; }
    }
  };
  window.ADF_AUDIO = API;

  const gesto = () => { unlock(); };
  document.addEventListener("pointerdown", gesto, {capture:true});
  document.addEventListener("keydown", gesto, {capture:true});
})();
