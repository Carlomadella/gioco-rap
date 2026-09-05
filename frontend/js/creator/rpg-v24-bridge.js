/* Creator RPG V24 — ponte isolato fra il creator approvato e la partita vera. */
"use strict";
(function(){
  const SRC_NORMALE = "media/creator-rpg-v24/creator.html";
  let overlay=null, frame=null;

  function ensure(){
    if(overlay) return;
    overlay=document.createElement("div");
    overlay.id="adf-rpg-v24-host";
    overlay.setAttribute("aria-hidden","true");
    overlay.style.cssText="position:fixed;inset:0;z-index:999999;background:#050609;display:none";
    frame=document.createElement("iframe");
    frame.id="adf-rpg-v24-frame";
    frame.title="Creazione artista — Anni di Fame";
    frame.allow="camera; microphone; clipboard-read; clipboard-write";
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050609";
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
  }

  function payloadIniziale(){
    return {
      name:A?.name||"", city:A?.city||"", genre:A?.genre||null,
      avatarSource:A?.avatarSource||null,
      avatarData:A?.avatarData||null,
      profile:A?.artistProfile||null,
      answers:A?.rpgAnswers||[]
    };
  }

  function open(){
    ensure();
    overlay.style.display="block";
    overlay.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
    const src=window.__ADF_RPG_V24_SRC__ || SRC_NORMALE;
    if(!frame.getAttribute("src") || frame.getAttribute("src")!==src) frame.setAttribute("src",src);
    else try{ frame.contentWindow.postMessage({type:"adf-rpg-v24-init",artist:payloadIniziale()},"*"); }catch(e){}
  }

  function close(){
    if(!overlay) return;
    overlay.style.display="none";
    overlay.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }

  function salvaRisultato(d){
    if(!d || !d.name || !d.city || !d.genre) return false;
    A.name=d.name;
    A.city=d.city;
    A.genre=d.genre;
    A.avatarSource=d.avatarSource||null;
    A.avatarData=d.avatarData||null;
    A.artistProfile=d.profile||null;
    A.rpgAnswers=Array.isArray(d.answers)?d.answers:[];
    A.rpgCreatorVersion=d.creatorVersion||"rpg-v24";

    const av=d.avatarData||{};
    if(d.avatarSource==="avaturn"){
      A.avatarUrl=av.avatarUrl||av.modelUrl||av.url||"";
      A.avatarUrlType=av.avatarUrlType||av.urlType||"";
      A.avatarId=av.avatarId||av.id||"";
      A.avatarSessionId=av.avatarSessionId||av.sessionId||"";
      A.avatarBodyId=av.avatarBodyId||av.bodyId||"";
      A.avatarGender=av.avatarGender||av.gender||"";
      A.avatarFaceAnimations=!!(av.avatarFaceAnimations||av.faceAnimations);
      delete A.localAvatar;
      delete A.avatarPreviewImage;
    }else if(d.avatarSource==="local"){
      A.localAvatar=av.localAvatar||null;
      A.avatarPreviewImage=av.avatarPreviewImage||av.previewImage||"";
      A.avatarUrl="";
      A.avatarUrlType="";
    }

    try{ localStorage.setItem(CHIAVE_ARTISTA(),JSON.stringify(A)); }catch(e){}
    window.ARTIST=A;
    if(typeof renderArtista==="function") renderArtista();
    if(typeof renderMenu==="function") renderMenu();
    return true;
  }

  window.addEventListener("message",e=>{
    if(!frame || e.source!==frame.contentWindow) return;
    const m=e.data||{};
    if(m.type==="adf-rpg-v24-ready"){
      try{ frame.contentWindow.postMessage({type:"adf-rpg-v24-init",artist:payloadIniziale()},"*"); }catch(err){}
      return;
    }
    if(m.type==="adf-rpg-v24-cancel"){ close(); return; }
    if(m.type==="adf-rpg-v24-complete"){
      if(!salvaRisultato(m.detail||{})) return;
      close();
      goto("hub");
      if(window.GAME) window.GAME.enter();
    }
  });

  /* La landing è gestita interamente da avvio.js.
     Questo bridge espone soltanto l'API del creator e non intercetta
     CONTINUA / INIZIA / data-go="gioca". */
  function install(){}

  window.ADF_RPG_V24={open,close};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install);
  else install();
})();
