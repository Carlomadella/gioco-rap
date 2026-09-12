/* Creator RPG V24 — ponte isolato fra il creator approvato e la partita vera. */
"use strict";
(function(){
  const SRC_NORMALE = "media/creator-rpg-v24/creator.html?v=25";
  let overlay=null, frame=null;
  let modalita="normal";
  let aperta=false, overflowPrima="", faseAudioPrima=null;

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
            /* Il creator puo' aprirsi sia prima della carriera sia sopra una
               partita gia' attiva. Solo il pregame possiede la musica menu:
               durante gameplay/cinematic il gesto deve sbloccare il contesto
               senza cambiare modalita' e sopprimere beat o SFX. */
            if(ADF_AUDIO.mode === "pregame" && ADF_AUDIO.music &&
               typeof ADF_AUDIO.music.ensureMenu === "function"){
              ADF_AUDIO.music.ensureMenu();
            }else{
              ADF_AUDIO.unlock();
            }
          }catch(e){}
        };
        doc.addEventListener("pointerdown", wake, {capture:true});
        doc.addEventListener("keydown", wake, {capture:true});
      }catch(e){}
    });
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

  function mostra(){
    ensure();
    overflowPrima=document.body?.style?.overflow||"";
    faseAudioPrima=window.ADF_AUDIO?.mode||null;
    aperta=true;
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

    /* Una sessione riceve UN SOLO comando iniziale.
       In appearance non parte prima il creator normale: quel doppio init
       era capace di riportare il flusso allo step iniziale mentre MakeHuman
       stava già lavorando. */
    try{
      frame.contentWindow.postMessage({type,artist},"*");
    }catch(e){}
  }

  function avvia(tipo){
    if(aperta){
      if(modalita===tipo) return;
      terminaSessione(true);
    }
    modalita=tipo;
    mostra();
  }

  function open(){ avvia("normal"); }

  function openAppearance(){ avvia("appearance"); }

  function ripristinaAudio(fase){
    try{
      const audio=window.ADF_AUDIO;
      if(!audio || !fase) return;

      if(fase==="pregame"){
        audio.setMode("pregame");
        if(audio.music && typeof audio.music.ensureMenu==="function")
          audio.music.ensureMenu();
        return;
      }

      if(fase==="gameplay"){
        audio.setMode("gameplay");
        if(audio.music && typeof audio.music.stopForGameplay==="function")
          audio.music.stopForGameplay(0);
        return;
      }

      if(fase==="cinematic" && audio.music &&
         typeof audio.music.startCinematic==="function"){
        audio.music.startCinematic(0);
      }else{
        audio.setMode(fase);
      }
    }catch(e){}
  }

  /* Ogni apertura e' una sessione isolata. Rimuovere l'iframe distrugge il
     suo browsing context, quindi timer e postMessage tardivi non possono
     contaminare la sessione successiva. */
  function terminaSessione(deveRipristinareAudio){
    if(!aperta && !overlay) return;
    const faseDaRipristinare=faseAudioPrima;
    aperta=false;

    if(overlay){
      overlay.style.display="none";
      overlay.setAttribute("aria-hidden","true");
      try{ overlay.remove(); }
      catch(e){
        try{ overlay.parentNode?.removeChild(overlay); }catch(err){}
      }
    }

    document.body.style.overflow=overflowPrima;
    overlay=null;
    frame=null;
    modalita="normal";
    faseAudioPrima=null;

    if(deveRipristinareAudio) ripristinaAudio(faseDaRipristinare);
  }

  function close(){
    if(aperta && modalita==="normal") window.__ADF_DOPO_CREAZIONE=null;
    terminaSessione(true);
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
    if(!aperta || !frame || e.source!==frame.contentWindow) return;
    const m=e.data||{};

    if(m.type==="adf-rpg-v24-ready"){
      inviaStato();
      return;
    }

    if(m.type==="adf-rpg-v24-cancel"){
      const eraCreazione=modalita==="normal";
      const nuovaAnnullata =
        eraCreazione &&
        typeof window.ADF_ANNULLA_NUOVO_SLOT === "function" &&
        window.ADF_ANNULLA_NUOVO_SLOT();

      if(eraCreazione) window.__ADF_DOPO_CREAZIONE=null;
      terminaSessione(true);

      if(nuovaAnnullata) vaiA("landing");
      return;
    }

    if(m.type==="adf-rpg-v24-appearance-cancel"){
      if(modalita!=="appearance") return;
      terminaSessione(true);
      return;
    }

    if(m.type==="adf-rpg-v24-appearance-updated"){
      if(modalita!=="appearance") return;
      if(!salvaAspetto(m.detail||{})) return;
      terminaSessione(true);
      return;
    }

    if(m.type==="adf-rpg-v24-career-intro-start"){
      if(modalita!=="normal") return;
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
      if(modalita!=="normal") return;
      if(!salvaRisultato(m.detail||{})) return;
      terminaSessione(false);

      if(typeof window.__ADF_DOPO_CREAZIONE === "function"){
        const dopo = window.__ADF_DOPO_CREAZIONE;
        window.__ADF_DOPO_CREAZIONE = null;
        dopo();
        return;
      }

      if(window.GAME) window.GAME.enter();
    }
  });

  function install(){}

  window.ADF_RPG_V24={open,openAppearance,close};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install);
  else install();
})();
