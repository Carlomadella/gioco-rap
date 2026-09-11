/* Creator RPG V24 — ponte isolato fra il creator approvato e la partita vera. */
"use strict";
(function(){
  const SRC_NORMALE = "media/creator-rpg-v24/creator.html?v=25";
  let overlay=null, frame=null;
  let modalita="normal";

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

    frame.addEventListener("load", () => {
      try{
        const doc = frame.contentDocument;
        if(!doc || doc.__adfAudioGestureBridge) return;
        doc.__adfAudioGestureBridge = true;
        const wake = () => {
          try{
            if(!window.ADF_AUDIO) return;
            if(ADF_AUDIO.mode === "cinematic"){ ADF_AUDIO.unlock(); return; }
            if(ADF_AUDIO.music) ADF_AUDIO.music.ensureMenu();
          }catch(e){}
        };
        doc.addEventListener("pointerdown", wake, {capture:true});
        doc.addEventListener("keydown", wake, {capture:true});
      }catch(e){}
    });
  }

  function payloadIniziale(){
    const avatarSource=A?.avatarSource||null;
    let avatarData=A?.avatarData||null;

    /* ADF_CREATOR_SESSION_STABILITY_V1
       I salvataggi precedenti possono avere ancora i dati avatar sui campi
       storici dell'artista. Li ricostruiamo qui senza modificare il save. */
    if(!avatarData && avatarSource==="local" && A?.localAvatar){
      avatarData={
        provider:A.localAvatar.provider||"makehuman",
        localAvatar:A.localAvatar,
        makehumanState:
          A.localAvatar.makehumanState||
          A.localAvatar.state||
          null,
        avatarPreviewImage:A.avatarPreviewImage||"",
        previewImage:A.avatarPreviewImage||""
      };
    }

    if(!avatarData && avatarSource==="avaturn" && (A?.avatarUrl || A?.avatarPreviewImage)){
      avatarData={
        provider:"avaturn",
        avatarUrl:A.avatarUrl||"",
        avatarUrlType:A.avatarUrlType||"",
        avatarId:A.avatarId||"",
        avatarSessionId:A.avatarSessionId||"",
        avatarBodyId:A.avatarBodyId||"",
        avatarGender:A.avatarGender||"",
        avatarFaceAnimations:!!A.avatarFaceAnimations,
        avatarPreviewImage:A.avatarPreviewImage||"",
        previewImage:A.avatarPreviewImage||""
      };
    }

    return {
      name:A?.name||"", city:A?.city||"", genre:A?.genre||null,
      avatarSource,
      avatarData,
      profile:A?.artistProfile||null,
      answers:A?.rpgAnswers||[]
    };
  }

  function artistaEsistente(){
    const artist=payloadIniziale();
    return !!(
      artist.name &&
      artist.name.trim() &&
      artist.avatarSource &&
      artist.avatarData
    );
  }

  function creatorAperto(){
    return !!(overlay && overlay.style.display==="block");
  }

  function mostra(){
    ensure();
    overlay.style.display="block";
    overlay.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";

    const src=window.__ADF_RPG_V24_SRC__ || SRC_NORMALE;
    if(!frame.getAttribute("src") || frame.getAttribute("src")!==src){
      frame.setAttribute("src",src);
    }else{
      inviaStato();
    }
  }

  function inviaStato(){
    if(!frame?.contentWindow) return;
    const artist=payloadIniziale();
    const type=modalita==="appearance"
      ? "adf-rpg-v24-edit-appearance"
      : "adf-rpg-v24-init";

    /* Una sessione riceve un solo comando iniziale. In modalità appearance
       non mandiamo prima anche init: era una doppia inizializzazione dello
       stesso creator e poteva riportarlo al primo step. */
    try{
      frame.contentWindow.postMessage({type,artist},"*");
    }catch(e){}
  }

  function open(){
    /* gioco-ingresso.js oggi chiama open anche dopo goto("profile"), che
       apre già il creator. La seconda apertura deve essere idempotente. */
    if(creatorAperto()) return;

    modalita=artistaEsistente() ? "appearance" : "normal";
    mostra();
  }

  function openAppearance(){
    if(creatorAperto()) return;
    modalita="appearance";
    mostra();
  }

  function close(){
    if(!overlay) return;

    document.body.style.overflow="";

    /* Non teniamo in vita un creator nascosto fra due aperture: Avaturn,
       MakeHuman, iframe annidati e listener ripartono da uno stato pulito. */
    try{ if(frame) frame.src="about:blank"; }catch(e){}
    try{ overlay.remove(); }catch(e){}

    frame=null;
    overlay=null;
    modalita="normal";
  }

  function applicaAvatar(source,av){
    A.avatarSource=source||null;
    A.avatarData=av||null;

    if(source==="avaturn"){
      A.avatarUrl=av.avatarUrl||av.modelUrl||av.url||"";
      A.avatarUrlType=av.avatarUrlType||av.urlType||"";
      A.avatarId=av.avatarId||av.id||"";
      A.avatarSessionId=av.avatarSessionId||av.sessionId||"";
      A.avatarBodyId=av.avatarBodyId||av.bodyId||"";
      A.avatarGender=av.avatarGender||av.gender||"";
      A.avatarFaceAnimations=!!(av.avatarFaceAnimations||av.faceAnimations);
      A.avatarPreviewImage=av.avatarPreviewImage||av.previewImage||"";
      delete A.localAvatar;
    }else if(source==="local"){
      A.localAvatar=av.localAvatar||null;
      A.avatarPreviewImage=av.avatarPreviewImage||av.previewImage||"";
      A.avatarUrl="";
      A.avatarUrlType="";
    }
  }

  function persistiArtista(){
    try{ localStorage.setItem(CHIAVE_ARTISTA(),JSON.stringify(A)); }catch(e){}
    window.ARTIST=A;
    if(typeof window.ADF_REFRESH_ARTIST_CHROME==="function") window.ADF_REFRESH_ARTIST_CHROME();
    if(typeof renderMenu==="function") renderMenu();
  }

  function salvaRisultato(d){
    if(!d || !d.name || !d.city || !d.genre) return false;
    A.name=d.name;
    A.city=d.city;
    A.genre=d.genre;
    A.artistProfile=d.profile||null;
    A.rpgAnswers=Array.isArray(d.answers)?d.answers:[];
    A.rpgCreatorVersion=d.creatorVersion||"rpg-v24";
    applicaAvatar(d.avatarSource,d.avatarData||{});
    persistiArtista();
    return true;
  }

  function salvaAspetto(d){
    if(!d || !d.avatarSource || !d.avatarData) return false;
    applicaAvatar(d.avatarSource,d.avatarData);
    persistiArtista();
    return true;
  }

  window.addEventListener("message",e=>{
    if(!frame || e.source!==frame.contentWindow) return;
    const m=e.data||{};

    if(m.type==="adf-rpg-v24-ready"){
      inviaStato();
      return;
    }

    if(m.type==="adf-rpg-v24-cancel"){
      const nuovaAnnullata =
        typeof window.ADF_ANNULLA_NUOVO_SLOT === "function" &&
        window.ADF_ANNULLA_NUOVO_SLOT();

      close();
      modalita="normal";

      if(nuovaAnnullata) vaiA("landing");
      return;
    }

    if(m.type==="adf-rpg-v24-appearance-cancel"){
      close();
      modalita="normal";
      return;
    }

    if(m.type==="adf-rpg-v24-appearance-updated"){
      if(modalita!=="appearance") return;
      if(!salvaAspetto(m.detail||{})) return;
      close();
      modalita="normal";
      return;
    }

    if(m.type==="adf-rpg-v24-career-intro-start"){
      try{
        if(window.ADF_AUDIO){
          if(ADF_AUDIO.music && typeof ADF_AUDIO.music.startCinematic === "function"){
            ADF_AUDIO.music.startCinematic(2.5);
          }else{
            ADF_AUDIO.setMode("cinematic");
            if(ADF_AUDIO.music) ADF_AUDIO.music.stopForGameplay(2.5);
          }
        }
      }catch(err){}
      return;
    }

    if(m.type==="adf-rpg-v24-complete"){
      if(!salvaRisultato(m.detail||{})) return;
      close();
      modalita="normal";

      if(typeof window.__ADF_DOPO_CREAZIONE === "function"){
        const dopo = window.__ADF_DOPO_CREAZIONE;
        window.__ADF_DOPO_CREAZIONE = null;
        dopo();
        return;
      }

      if(typeof goto==="function") goto("hub");
      if(window.GAME) window.GAME.enter();
    }
  });

  function install(){}

  window.ADF_RPG_V24={open,openAppearance,close};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install);
  else install();
})();
