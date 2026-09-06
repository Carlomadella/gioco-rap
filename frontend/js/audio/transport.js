/* ADF_AUDIO_TRANSPORT_V1
   Clock musicale indipendente dal backend: BPM, battute e posizione.
   Sarà condiviso da player, studio e futuro beat editor. */
"use strict";
(() => {
  let bpm = 120, running = false, startedAt = 0, offsetBeats = 0;
  const perfNow = () => performance.now() / 1000;
  function secondsPerBeat(v){ return 60 / Math.max(1, Number(v == null ? bpm : v) || 120); }
  function secondsPerStep(div, v){ return secondsPerBeat(v) * 4 / Math.max(1, Number(div) || 16); }
  function setBpm(v){ bpm = Math.max(20, Math.min(400, Number(v) || 120)); return bpm; }
  function start(opts){
    opts = opts || {};
    if(opts.bpm != null) setBpm(opts.bpm);
    offsetBeats = Number(opts.beat) || 0;
    startedAt = Number.isFinite(+opts.at) ? +opts.at : perfNow();
    running = true;
    return startedAt;
  }
  function stop(){
    if(running) offsetBeats = position();
    running = false;
    return offsetBeats;
  }
  function seek(beat){ offsetBeats = Math.max(0, Number(beat) || 0); if(running) startedAt = perfNow(); }
  function position(now){
    if(!running) return offsetBeats;
    const t = Number.isFinite(+now) ? +now : perfNow();
    return offsetBeats + Math.max(0, t - startedAt) / secondsPerBeat();
  }
  function timeOfBeat(beat){ return startedAt + (Number(beat) - offsetBeats) * secondsPerBeat(); }
  const api = {setBpm, start, stop, seek, position, timeOfBeat, secondsPerBeat, secondsPerStep,
    get bpm(){ return bpm; }, get running(){ return running; }};
  if(window.ADF_AUDIO) ADF_AUDIO.transport = api;
  window.ADF_AUDIO_TRANSPORT = api;
})();
