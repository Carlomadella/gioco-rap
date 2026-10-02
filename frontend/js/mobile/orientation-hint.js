"use strict";

/* Suggerimento orientamento solo mobile.
   Non blocca il gioco e non forza la rotazione: informa soltanto l'utente
   quando il telefono è in verticale. Desktop: uscita immediata. */
(function(){
  const MOBILE_QUERY="(max-width: 1180px) and (pointer: coarse)";
  const PORTRAIT_QUERY="(orientation: portrait)";
  const ID="adf-mobile-orientation-hint";
  const STYLE_ID="adf-mobile-orientation-hint-style";

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

  function preparaStile(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${ID}{
        position:fixed;
        left:50%;
        bottom:calc(14px + env(safe-area-inset-bottom, 0px));
        transform:translateX(-50%);
        z-index:2147483000;
        box-sizing:border-box;
        width:max-content;
        max-width:calc(100vw - 28px);
        padding:10px 14px;
        border:1px solid rgba(245,243,239,.16);
        border-radius:14px;
        background:rgba(11,11,13,.92);
        color:#F5F3EF;
        box-shadow:0 8px 28px rgba(0,0,0,.32);
        font:700 13px/1.3 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;
        text-align:center;
        pointer-events:none;
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
      }
      #${ID}[hidden]{display:none!important}
      #${ID} .adf-orient-icon{
        display:inline-block;
        margin-right:7px;
        color:#FF5A36;
        font-size:16px;
        vertical-align:-1px;
      }
    `;
    document.head.appendChild(style);
  }

  function preparaAvviso(){
    let avviso=document.getElementById(ID);
    if(avviso) return avviso;

    preparaStile();
    avviso=document.createElement("div");
    avviso.id=ID;
    avviso.setAttribute("role","status");
    avviso.setAttribute("aria-live","polite");
    avviso.innerHTML='<span class="adf-orient-icon" aria-hidden="true">↻</span>Per un\'esperienza migliore, ruota il telefono in orizzontale.';
    document.body.appendChild(avviso);
    return avviso;
  }

  function eVerticale(){
    try{
      if(window.matchMedia) return window.matchMedia(PORTRAIT_QUERY).matches;
    }catch(e){}
    return window.innerHeight > window.innerWidth;
  }

  function sincronizza(){
    const avviso=preparaAvviso();
    avviso.hidden=!eVerticale();
  }

  function avvia(){
    sincronizza();
    window.addEventListener("resize",sincronizza,{passive:true});
    window.addEventListener("orientationchange",sincronizza,{passive:true});

    try{
      const mq=window.matchMedia(PORTRAIT_QUERY);
      if(mq.addEventListener) mq.addEventListener("change",sincronizza);
      else if(mq.addListener) mq.addListener(sincronizza);
    }catch(e){}
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",avvia,{once:true});
  }else{
    avvia();
  }

  window.ADF_MOBILE_ORIENTATION_HINT={
    attivo:true,
    sincronizza
  };
})();
