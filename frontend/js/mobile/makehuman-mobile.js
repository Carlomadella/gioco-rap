/* MakeHuman sul telefono — adattatore isolato dal percorso desktop.
   Il bridge RPG e il creator restano quelli approvati. Solo su un dispositivo
   touch stretto, prima che il creator apra il suo editor locale, cambiamo la
   sorgente del solo iframe MakeHuman con il relay mobile.

   Desktop: questo file termina senza toccare ADF_RPG_V24.
*/
"use strict";

(function(){
  const MOBILE_QUERY="(max-width: 1180px) and (pointer: coarse)";
  const MOBILE_MAKEHUMAN_SRC="../makehuman-mobile-v1/index.html?v=1";

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

  function applicaSorgenteMobile(frame){
    try{
      const doc=frame && frame.contentDocument;
      const editor=doc && doc.getElementById("localEditorFrame");
      if(!editor) return false;

      editor.dataset.makehumanSrc=MOBILE_MAKEHUMAN_SRC;
      editor.dataset.makehumanMobile="1";
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

      /* gioco-ingresso controlla il creator ogni 50 ms. Noi partiamo prima di
         quel controllo e cerchiamo l'iframe locale ogni 10 ms, così la sorgente
         mobile viene fissata prima che l'avvio rapido possa aprire MakeHuman. */
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

  window.ADF_MAKEHUMAN_MOBILE={
    attivo:true,
    source:MOBILE_MAKEHUMAN_SRC
  };
})();
