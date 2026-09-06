/* ADF_AUDIO_ENTRY_SPLIT_V1
   L'ingresso del gameplay non appartiene al motore SFX. Questo file conserva
   window.GAME.enter separato da fx.js, senza cambiare il comportamento. */
"use strict";
window.GAME = {
  enter(){
    const art = window.ARTIST || {};
    syncEnergy();
    openWeek();
    if(!G.log.length) pushLog("<b>Si comincia.</b> Zero fan, zero contatti, una settimana davanti.", "big");
    renderGioco();
    /* la mappa è la prima cosa che si vede: va riempita anche lei */
    if(typeof renderHub === "function") renderHub();
  }
};
