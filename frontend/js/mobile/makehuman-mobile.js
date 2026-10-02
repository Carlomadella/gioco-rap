/* MakeHuman sul telefono — adattatore isolato dal percorso desktop.
   Il bridge RPG e il creator restano quelli approvati. Solo su un dispositivo
   touch stretto, prima che il creator apra il suo editor locale, cambiamo la
   sorgente del solo iframe MakeHuman con il relay mobile.

   Il watchdog mobile vive QUI, nel documento principale visibile. Non usa
   timer dentro al creator/MakeHuman nascosti, che sui browser mobili possono
   essere rallentati o sospesi.

   Desktop: questo file termina senza toccare ADF_RPG_V24.
*/
"use strict";

(function(){
  const MOBILE_QUERY="(max-width: 1180px) and (pointer: coarse)";
  const MOBILE_MAKEHUMAN_SRC="../makehuman-mobile-v1/index.html?v=3";
  const QUICK=new URLSearchParams(window.location.search).get("nuova")==="rapido";
  const HEARTBEAT_MS=10000;
  const QUICK_MAX_MS=360000;

  function eMobile(){
    try{
      if(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches) return true;
    }catch(e){}

    return (
      window.innerWidth <= 1180 &&
      Number(window.navigator && navigator.maxTouchPoints || 0) > 0
    );
  }

  if(!eMobile()) return;

  const bridge=window.ADF_RPG_V24;
  if(!bridge || typeof bridge.open!=="function"){
    console.error("[ADF MOBILE] Ponte RPG non disponibile per MakeHuman mobile.");
    return;
  }

  let watchdogTimer=null;
  let watchdogStart=0;
  let watchdogFrame=null;
  let ultimaFase="Avvio MakeHuman sul telefono…";
  let heartbeatCount=0;
  let relayLoads=0;
  let lastPingAt=0;

  function fermaWatchdog(){
    if(watchdogTimer){
      clearInterval(watchdogTimer);
      watchdogTimer=null;
    }
    watchdogStart=0;
    watchdogFrame=null;
  }

  function pingRelayMobile(frame,kind,message){
    try{
      const doc=frame?.contentDocument;
      const editor=doc?.getElementById("localEditorFrame");
      if(!editor?.contentWindow) return false;

      /* Il timer resta nel documento principale visibile; il messaggio passa
         però dal relay mobile reale. Così creator.html riceve un vero evento
         con source === localEditorFrame.contentWindow e lo rilancia al gioco
         con source === frame.contentWindow, esattamente come MakeHuman. */
      editor.contentWindow.postMessage({
        type:"adf-mobile-watchdog-ping",
        kind,
        message
      },"*");
      heartbeatCount+=1;
      lastPingAt=Date.now();
      return true;
    }catch(e){
      return false;
    }
  }

  function avviaWatchdog(frame){
    if(!QUICK || watchdogTimer || !frame?.contentWindow) return;

    watchdogFrame=frame;
    watchdogStart=Date.now();

    watchdogTimer=setInterval(()=>{
      if(
        watchdogFrame!==document.getElementById("adf-rpg-v24-frame") ||
        !watchdogFrame?.contentWindow
      ){
        fermaWatchdog();
        return;
      }

      if(Date.now()-watchdogStart>=QUICK_MAX_MS){
        pingRelayMobile(
          watchdogFrame,
          "error",
          "MakeHuman sul telefono non ha completato l'avvio entro sei minuti."
        );
        fermaWatchdog();
        return;
      }

      pingRelayMobile(
        watchdogFrame,
        "progress",
        ultimaFase+" · caricamento ancora in corso"
      );
    },HEARTBEAT_MS);
  }

  window.addEventListener("message",e=>{
    if(!QUICK || !watchdogFrame?.contentWindow || e.source!==watchdogFrame.contentWindow) return;

    const msg=e.data||{};

    if(
      msg.type==="adf-rpg-v24-quick-makehuman-progress"
    ){
      const testo=String(msg.message||"").trim();
      if(testo && !testo.endsWith(" · caricamento ancora in corso")) ultimaFase=testo;
      return;
    }

    if(
      msg.type==="adf-rpg-v24-quick-makehuman-ready" ||
      msg.type==="adf-rpg-v24-quick-makehuman-error"
    ){
      fermaWatchdog();
    }
  });

  function applicaSorgenteMobile(frame){
    try{
      const doc=frame && frame.contentDocument;
      const editor=doc && doc.getElementById("localEditorFrame");
      if(!editor) return false;

      editor.dataset.makehumanSrc=MOBILE_MAKEHUMAN_SRC;
      editor.dataset.makehumanMobile="1";
      editor.dataset.makehumanMobileQuick=QUICK?"1":"0";

      /* Il primo intervallo puo' scattare mentre l'iframe sta ancora navigando
         da about:blank al relay. Appena il relay ha davvero finito il load gli
         mandiamo quindi un ping immediato; da li' prosegue il timer ogni 10 s. */
      if(editor.dataset.makehumanMobileWatchdogBound!=="1"){
        editor.dataset.makehumanMobileWatchdogBound="1";
        editor.addEventListener("load",()=>{
          relayLoads+=1;
          try{
            if(!String(editor.src||"").includes("/makehuman-mobile-v1/index.html")) return;
          }catch(e){ return; }

          pingRelayMobile(
            frame,
            "progress",
            ultimaFase+" · caricamento ancora in corso"
          );
        });
      }

      /* Il timer e' nel documento principale, quindi resta attivo anche se
         gioco-ingresso nasconde il creator con visibility:hidden. */
      avviaWatchdog(frame);
      return true;
    }catch(e){
      return false;
    }
  }

  function preparaCreatorMobile(){
    const frame=document.getElementById("adf-rpg-v24-frame");
    if(!frame) return;

    let concluso=false;
    let tentativi=0;

    const prova=()=>{
      if(concluso) return;
      if(frame!==document.getElementById("adf-rpg-v24-frame")){
        concluso=true;
        return;
      }

      if(applicaSorgenteMobile(frame)){
        concluso=true;
        return;
      }

      tentativi+=1;
      if(tentativi<1000) setTimeout(prova,10);
    };

    frame.addEventListener("load",prova,{once:true});
    prova();
  }

  function avvolgi(apri){
    return function(...args){
      const risultato=apri.apply(bridge,args);
      preparaCreatorMobile();
      return risultato;
    };
  }

  bridge.open=avvolgi(bridge.open);
  if(typeof bridge.openAppearance==="function"){
    bridge.openAppearance=avvolgi(bridge.openAppearance);
  }

  window.addEventListener("pagehide",fermaWatchdog,{once:true});

  window.ADF_MAKEHUMAN_MOBILE={
    attivo:true,
    quick:QUICK,
    source:MOBILE_MAKEHUMAN_SRC,
    watchdog:"top-level-v5-relay-ping",
    diagnostica(){
      return {
        heartbeatCount,
        relayLoads,
        lastPingAt,
        ultimaFase,
        watchdogAttivo:!!watchdogTimer
      };
    }
  };
})();
