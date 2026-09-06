/* L'ingresso in partita — Anni di Fame.

   Punto 27: la landing è una pagina a parte, e questa è la porta di quella del
   gioco. Prima non serviva a niente di tutto questo, perché «entrare» voleva
   dire togliere una classe a una `<section>` e tutto lo stato era già lì, in
   memoria, dall'altra schermata. Adesso fra le due c'è un caricamento vero: la
   landing scrive sul disco quello che ha deciso — quale slot, che difficoltà —
   e passa qui una parola sola nell'indirizzo per dire cosa voleva fare.

     (niente)             riprendi la carriera dello slot attivo → la città
     ?vai=profilo         apri il tuo artista, senza far partire la settimana
     ?vai=classifiche     entra e apri le classifiche sul telefono
     ?nuova=rapido        artista a caso e via in città
     ?nuova=creatore      apri il creatore; quando salvi, si entra

   La carriera non viaggia nell'indirizzo: è già su localStorage e i file del
   gioco (js/creator/state.js, js/game/state.js) l'hanno già letta quando questo
   file gira. Qui si decide solo cosa far vedere per primo. */
"use strict";

(() => {
  const q = new URLSearchParams(location.search);
  const vai = q.get("vai") || "";
  const nuova = q.get("nuova") || "";

  /* ADF_AUDIO_INGRESSO_V1: una sola fonte decide quando finisce il pre-game. */
  function audioPregame(){
    if(!window.ADF_AUDIO) return;
    ADF_AUDIO.setMode("pregame");
    if(ADF_AUDIO.music) ADF_AUDIO.music.ensureMenu();
  }
  function audioGameplay(){
    if(!window.ADF_AUDIO) return;
    ADF_AUDIO.setMode("gameplay");
    if(ADF_AUDIO.music) ADF_AUDIO.music.stopForGameplay(1.4);
  }

  /* Ricaricare la pagina non deve rifare «nuova partita» un'altra volta: dopo
     aver letto la richiesta, l'indirizzo torna pulito. */
  function pulisci(){
    try{ history.replaceState(null, "", location.pathname); }catch(e){}
  }

  function entraInCitta(){
    audioGameplay();
    goto("hub");
    if(window.GAME) window.GAME.enter();
    /* Chi era dentro quando ha chiuso, dentro si risveglia. */
    if(G.strada && G.strada.arresto && typeof window.apriCarcere === "function"){
      setTimeout(() => window.apriCarcere({direct:true, reason:"resume"}), 0);
    }
  }

  /* ---- artista a caso, per l'avvio rapido ----
     Lo slot l'ha già preparato la landing (svuotato e con la difficoltà
     dentro): qui manca solo la faccia. */
  function artistaACaso(){
    try{ $("rand").click(); }catch(e){}
    try{ localStorage.setItem(CHIAVE_ARTISTA(), JSON.stringify(A)); }catch(e){}
    try{ firstRun = false; applyMode(); }catch(e){}
    window.ARTIST = A;
  }

  /* ---- il creatore, quando la partita è nuova ----
     Salvato l'artista si entra in città senza passare dal menu; se invece si
     torna indietro senza averlo creato, lo slot preparato va liberato, se no
     resta occupato da una carriera che non esiste. */
  function creatorePoiCitta(){
    audioPregame();
    window.__ADF_DOPO_CREAZIONE = entraInCitta;
    const indietro = $("to-menu");
    if(indietro) indietro.addEventListener("click", () => {
      if(A.name.trim()) return;
      try{ localStorage.removeItem(CHIAVE_PARTITA()); }catch(e){}
    }, true);

    if(window.ADF_RPG_V24 && typeof window.ADF_RPG_V24.open === "function"){
      /* il creatore 3D si chiude da solo sulla città (js/creator/rpg-v24-bridge.js) */
      goto("profile");
      window.ADF_RPG_V24.open();
      return;
    }
    goto("profile");
    setTimeout(() => { try{ $("name").focus(); }catch(e){} }, 80);
  }

  pulisci();

  if(nuova === "rapido"){ artistaACaso(); entraInCitta(); return; }
  if(nuova === "creatore"){ creatorePoiCitta(); return; }
  if(vai === "profilo"){ audioPregame(); goto("profile"); return; }
  if(vai === "classifiche"){
    entraInCitta();
    if(typeof telVaiApp === "function") setTimeout(() => telVaiApp("classifiche"), 60);
    return;
  }
  entraInCitta();
})();
