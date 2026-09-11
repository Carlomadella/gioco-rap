/* L'ingresso in partita — Anni di Fame.

   Punto 27: la landing è una pagina a parte, e questa è la porta di quella del
   gioco. Prima non serviva a niente di tutto questo, perché «entrare» voleva
   dire togliere una classe a una <section> e tutto lo stato era già lì, in
   memoria, dall'altra schermata. Adesso fra le due c'è un caricamento vero.

     (niente)             riprendi la carriera dello slot attivo → la città
     ?vai=profilo         apri il tuo artista
     ?vai=classifiche     entra e apri le classifiche
     ?nuova=rapido        preset temporaneo + RPG automatico + cinematic
     ?nuova=creatore      apri il creator normale

   Il creator approvato resta proprietario di RPG, profilo e cinematic.
*/
"use strict";

(() => {
  const q = new URLSearchParams(location.search);
  const vai = q.get("vai") || "";
  const nuova = q.get("nuova") || "";

  /* ADF_SLOT_NO_OVERWRITE_V1 */
  function annullaNuovoSlot(){
    if(!nuova || (A && A.name && A.name.trim())) return false;
    try{
      localStorage.removeItem(CHIAVE_ARTISTA());
      localStorage.removeItem(CHIAVE_PARTITA());
      return true;
    }catch(e){
      console.error("[ADF] Pulizia slot provvisorio fallita",e);
      return false;
    }
  }

  window.ADF_ANNULLA_NUOVO_SLOT = annullaNuovoSlot;

  function audioPregame(){
    if(!window.ADF_AUDIO) return;
    ADF_AUDIO.setMode("pregame");
    if(ADF_AUDIO.music) ADF_AUDIO.music.ensureMenu();
  }

  function pulisci(){
    try{
      history.replaceState(null, "", location.pathname);
    }catch(e){}
  }

  function entraInCitta(){
    if(window.GAME) window.GAME.enter();

    if(
      G.strada &&
      G.strada.arresto &&
      typeof window.apriCarcere === "function"
    ){
      setTimeout(
        () => window.apriCarcere({
          direct:true,
          reason:"resume"
        }),
        0
      );
    }
  }

  /* -------------------------------------------------------
     Accesso sicuro al creator iframe.
     Non modifichiamo bridge o creator.html.
     ------------------------------------------------------- */

  function frameCreator(){
    return document.getElementById("adf-rpg-v24-frame");
  }

  function eseguiNelCreator(frame, codice){
    const doc = frame && frame.contentDocument;
    if(!doc) return false;

    const script = doc.createElement("script");
    script.textContent = codice;

    (doc.body || doc.documentElement).appendChild(script);
    script.remove();

    return true;
  }

  function quandoCreatorPronto(frameAtteso, callback, tentativo){
    tentativo = tentativo || 0;

    /* Il bridge distrugge l'iframe a ogni chiusura. Un retry nato per una
       sessione non deve mai agganciarsi al frame creato da quella seguente. */
    if(!frameAtteso || frameCreator() !== frameAtteso) return;

    try{
      if(
        frameAtteso.contentDocument &&
        frameAtteso.contentWindow &&
        typeof frameAtteso.contentWindow.playCareerIntro === "function"
      ){
        callback(frameAtteso);
        return;
      }
    }catch(e){}

    if(tentativo >= 120){
      console.error("[ADF] Creator RPG: caricamento non completato.");
      return;
    }

    setTimeout(
      () => quandoCreatorPronto(frameAtteso, callback, tentativo + 1),
      50
    );
  }

  /* -------------------------------------------------------
     Provider temporaneo SOLO per Avvio rapido.

     La nuova partita normale usa il provider reale scelto
     nel creator (Avaturn oppure MakeHuman). Il preset base
     resta qui soltanto per saltare la creazione nell'avvio
     rapido.
     ------------------------------------------------------- */

  function installaPresetTemporaneo(frame){
    const codice = `
      (() => {
        if(window.__ADF_TEMP_PRESET_INSTALLED__) return;
        window.__ADF_TEMP_PRESET_INSTALLED__ = true;

        const localButton =
          document.querySelector('[data-avatar-source="local"]');

        if(localButton){
          const id = localButton.querySelector('.id');
          const nome = localButton.querySelector('.n');
          const desc = localButton.querySelector('.d');
          const mini = localButton.querySelector('.mini');
          const features =
            localButton.querySelector('.avatar-features');

          if(id) id.textContent = '02 · temporaneo';
          if(nome) nome.textContent = 'Personaggio preimpostato';

          if(desc){
            desc.textContent =
              'Usa temporaneamente il personaggio base e continua con identità, storia e profilo.';
          }

          if(mini){
            mini.textContent = 'Usa personaggio base';
          }

          if(features){
            features.innerHTML =
              '<span>Nessun editor</span>' +
              '<span>Preset base</span>' +
              '<span>MakeHuman in arrivo</span>';
          }
        }

        /* Questa funzione esiste già nel creator.
           La sostituiamo soltanto runtime. */
        openLocalEditor = function(){
          state.avatarSource = 'local';
          state.avatarPendingSource = null;

          state.avatarData = {
            provider:'temporary-placeholder',
            localAvatar:{
              preset:'base',
              version:1
            }
          };

          renderAvatarSource();

          /* Nessun vecchio editor, nessun camerino.
             Il personaggio è già deciso. */
          setProgress(1);
          validateIdentity();
        };
      })();
    `;

    return eseguiNelCreator(frame, codice);
  }

  /* -------------------------------------------------------
     Creator normale
     ------------------------------------------------------- */

  function creatorePoiCitta(){
    audioPregame();

    window.__ADF_DOPO_CREAZIONE = entraInCitta;

    const indietro = $("to-menu");

    if(indietro){
      indietro.addEventListener(
        "click",
        () => {
          if(A.name.trim()) return;
          annullaNuovoSlot();
        },
        true
      );
    }

    if(
      window.ADF_RPG_V24 &&
      typeof window.ADF_RPG_V24.open === "function"
    ){
      goto("profile");

      window.ADF_RPG_V24.open();

      const frame = frameCreator();

      /* Evita di mostrare per un istante la scritta
         "Editor locale" prima della sostituzione. */
      if(frame) frame.style.visibility = "hidden";

      quandoCreatorPronto(frame, f => {
        /* Nel flusso normale non installiamo più il placeholder:
           il creator apre davvero Avaturn oppure MakeHuman. */
        f.style.visibility = "";
      });

      return;
    }

    goto("profile");

    setTimeout(
      () => {
        try{
          $("name").focus();
        }catch(e){}
      },
      80
    );
  }

  /* -------------------------------------------------------
     AVVIO RAPIDO
     ------------------------------------------------------- */

  function scegli(lista){
    return lista[
      Math.floor(Math.random() * lista.length)
    ];
  }

  function datiRapidi(){
    const nomi = [
      "Ali","Zero","Kobra","Nino","Sette","Lupo",
      "Ghiaccio","Trenta","Vetro","Fame","Neve","Ferro"
    ];

    const suffissi = [
      "Fame","Zero","93","Uno","Nero",
      "Sette","OG","Vento","Boy"
    ];

    const citta = [
      "Milano","Roma","Napoli","Torino","Bologna",
      "Palermo","Bari","Brescia","Sesto San Giovanni"
    ];

    return {
      name: scegli(nomi) + " " + scegli(suffissi),
      city: scegli(citta)
    };
  }

  function avvioRapido(){
    audioPregame();

    window.__ADF_DOPO_CREAZIONE = entraInCitta;

    if(
      !window.ADF_RPG_V24 ||
      typeof window.ADF_RPG_V24.open !== "function"
    ){
      console.error(
        "[ADF] Avvio rapido: creator RPG non disponibile."
      );
      return;
    }

    const rapido = datiRapidi();

    goto("profile");

    window.ADF_RPG_V24.open();

    const frame = frameCreator();

    /* Nessun flash di avatar / identità / RPG. */
    if(frame) frame.style.visibility = "hidden";

    quandoCreatorPronto(frame, f => {
      installaPresetTemporaneo(f);

      const payload = JSON.stringify(rapido);

      const codice = `
        (() => {
          const rapido = ${payload};

          state.avatarSource = 'local';
          state.avatarPendingSource = null;

          state.avatarData = {
            provider:'temporary-placeholder',
            localAvatar:{
              preset:'base',
              version:1
            }
          };

          state.name = rapido.name;
          state.city = rapido.city;

          /* STESSI generi del creator normale. */
          state.genre =
            GENRES[
              Math.floor(Math.random() * GENRES.length)
            ].id;

          /* STESSE 3 domande e risposte canoniche. */
          state.answers =
            STORY.map(scene =>
              scene.choices[
                Math.floor(
                  Math.random() * scene.choices.length
                )
              ]
            );

          $('name').value = state.name;
          $('city').value = state.city;

          renderAvatarSource();
          renderGenres();
          validateIdentity();

          /* Stesso trigger audio della nuova partita normale. */
          try{
            if(window.parent !== window){
              window.parent.postMessage({
                type:'adf-rpg-v24-career-intro-start'
              }, '*');
            }
          }catch(e){}

          /* STESSA cinematic già approvata. */
          window.playCareerIntro();
        })();
      `;

      eseguiNelCreator(f, codice);

      /* playCareerIntro è già partita prima che il frame
         torni visibile. */
      f.style.visibility = "";
    });
  }

  /* ------------------------------------------------------- */

  pulisci();

  if(nuova === "rapido"){
    avvioRapido();
    return;
  }

  if(nuova === "creatore"){
    creatorePoiCitta();
    return;
  }

  if(vai === "profilo"){
    audioPregame();
    goto("profile");
    return;
  }

  if(vai === "classifiche"){
    entraInCitta();

    if(typeof telVaiApp === "function"){
      setTimeout(
        () => telVaiApp("classifiche"),
        60
      );
    }

    return;
  }

  entraInCitta();
})();
