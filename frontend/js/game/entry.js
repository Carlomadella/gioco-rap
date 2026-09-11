/* ADF_AUDIO_ENTRY_SPLIT_V1
   L'ingresso del gameplay non appartiene al motore SFX. Questo file mantiene
   window.GAME.enter separato da fx.js e ne fa il confine unico della citta'. */
"use strict";

/* GAME.enter e' il confine unico fra menu/creator e partita: ogni strada che
   mostra davvero la citta' passa da qui, compreso il ritorno dal profilo.
   Tenere qui il cambio di modalita' evita che un nuovo percorso apra Hub o
   Studio lasciando i canali gameplay soppressi. */
function entraAudioGameplay(){
  if(!window.ADF_AUDIO) return;
  ADF_AUDIO.setMode("gameplay");
  if(ADF_AUDIO.music && typeof ADF_AUDIO.music.stopForGameplay === "function")
    ADF_AUDIO.music.stopForGameplay(1.4);
}

window.GAME = {
  enter(){
    entraAudioGameplay();
    if(typeof goto === "function") goto("hub");
    const art = window.ARTIST || {};
    syncEnergy();
    openWeek();
    if(!G.log.length) pushLog("<b>Si comincia.</b> Zero fan, zero contatti, una settimana davanti.", "big");
    renderGioco();
    /* la mappa è la prima cosa che si vede: va riempita anche lei */
    if(typeof renderHub === "function") renderHub();
  }
};
