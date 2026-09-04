/* Menu di sistema globale — Anni di Fame.
   Non "mette in pausa": il gioco avanza solo quando il giocatore agisce.
   ESC apre il menu quando non c'è una finestra/azione interna da chiudere.
   Il marchio LA FAME / Anni di Fame fa la stessa cosa durante il gameplay. */
"use strict";

(() => {
  const ROOT_ID = "adf-system-menu";
  const LAST_SLOT_KEY = "adf-ultimo-slot-v1";
  let aperto = false;
  let confermaSenzaSalvareFino = 0;
  let syncQueued = false;

  const $id = id => document.getElementById(id);

  function hostAttivo(){
    if(document.querySelector("#adf-jail.on")) return "jail";
    if(document.querySelector("#strada.on")) return "strada";
    if(document.querySelector("#posto.on")) return "posto";
    if(document.querySelector("#negozio.on")) return "negozio";
    if(document.querySelector("#studio.on")) return "studio";
    if(document.querySelector("#s-game.screen.on")) return "game";
    if(document.querySelector("#s-hub.screen.on")) return "hub";
    return "";
  }

  function giocoAttivo(){ return !!hostAttivo(); }

  /* ESC conserva la priorità delle finestre "dentro" una schermata:
     prima chiudi una scelta, il foglio, il diario, un'app del telefono, ecc.
     Solo quando sei davvero sulla schermata di gioco apre il menu di sistema. */
  function internoDaChiuderePrima(){
    const selectors = [
      "#setts.on",
      "#modal.on",
      "#writer.on",
      "#piazza.on",
      "#drawer.on",
      "#report.on",
      "#scena.on",
      "#crimeModal.on",
      "#adf-result-overlay.on",
      "#adf-social-overlay.on",
      "#adf-social-banner.show"
    ];
    if(selectors.some(sel => document.querySelector(sel))) return true;

    /* Il pannello dell'orologio usa già ESC per chiudersi. */
    if(document.querySelector("#adf-time-controls.adf-tc-open")) return true;

    /* Nell'iPhone ESC torna prima alla home del telefono. */
    try{ if(typeof TEL_APP !== "undefined" && TEL_APP) return true; }catch(_){}
    return false;
  }

  function crea(){
    let root = $id(ROOT_ID);
    if(root) return root;

    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "adf-system-menu";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="adf-system-scrim" data-system="riprendi"></div>
      <section class="adf-system-panel" role="dialog" aria-modal="true" aria-labelledby="adf-system-title">
        <header class="adf-system-head">
          <div>
            <span class="adf-system-kicker">LA FAME / SISTEMA</span>
            <h2 id="adf-system-title">Menu</h2>
          </div>
          <button class="adf-system-x" type="button" data-system="riprendi" aria-label="Riprendi">×</button>
        </header>

        <button class="adf-system-row adf-system-resume" type="button" data-system="riprendi">
          <span><b>Riprendi</b><small>Torna subito alla partita</small></span><i>→</i>
        </button>

        <div class="adf-system-audio">
          <div class="adf-system-audio-head">
            <span><b>Audio</b><small>Solo i controlli che servono al volo</small></span>
            <button class="adf-system-mute" type="button" data-system="audio-toggle" aria-pressed="true">ON</button>
          </div>
          <label class="adf-system-volume">
            <span>Volume generale <b id="adf-system-volume-value">80%</b></span>
            <input id="adf-system-volume" type="range" min="0" max="100" step="5" value="80">
          </label>
        </div>

        <button class="adf-system-row" type="button" data-system="impostazioni">
          <span><b>Impostazioni</b><small>Audio avanzato, aspetto, gioco e salvataggi</small></span><i>→</i>
        </button>

        <button class="adf-system-save" type="button" data-system="salva-esci">
          <span><b>Salva ed esci</b><small>Scrive un checkpoint esatto e torna al menu principale</small></span><i>↗</i>
        </button>

        <div class="adf-system-status" id="adf-system-status" aria-live="polite"></div>

        <button class="adf-system-nosave" type="button" data-system="esci-senza">
          Esci senza salvare
        </button>
      </section>`;
    document.body.appendChild(root);

    root.addEventListener("click", e => {
      const b = e.target.closest("[data-system]");
      if(!b) return;
      const az = b.dataset.system;
      if(az === "riprendi"){ chiudi(); return; }
      if(az === "audio-toggle"){ toggleAudio(); return; }
      if(az === "impostazioni"){ apriImpostazioniSistema(); return; }
      if(az === "salva-esci"){ salvaEdEsci(); return; }
      if(az === "esci-senza"){ esciSenzaSalvare(b); return; }
    });

    const volume = root.querySelector("#adf-system-volume");
    volume.addEventListener("input", () => {
      if(typeof SET === "undefined" || !SET.audio) return;
      SET.audio.master = Math.max(0, Math.min(100, Number(volume.value) || 0));
      salvaImpostazioniAudio(false);
      sincronizzaAudio();
    });
    volume.addEventListener("change", () => {
      salvaImpostazioniAudio(true);
      try{ if(typeof SFX !== "undefined" && SFX.tap) SFX.tap(); }catch(_){}
    });

    return root;
  }

  function stato(testo, tipo){
    const el = $id("adf-system-status");
    if(!el) return;
    el.textContent = testo || "";
    el.dataset.tipo = tipo || "";
  }

  function sincronizzaAudio(){
    const root = crea();
    const audio = (typeof SET !== "undefined" && SET.audio) ? SET.audio : {on:true, master:80};
    const on = audio.on !== false;
    const master = Math.max(0, Math.min(100, Number(audio.master) || 0));
    const mute = root.querySelector(".adf-system-mute");
    const range = root.querySelector("#adf-system-volume");
    const value = root.querySelector("#adf-system-volume-value");
    if(mute){
      mute.textContent = on ? "ON" : "OFF";
      mute.classList.toggle("off", !on);
      mute.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if(range) range.value = String(master);
    if(value) value.textContent = master + "%";
  }

  function salvaImpostazioniAudio(prova){
    try{ if(typeof setSalva === "function") setSalva(); }catch(_){}
    try{ if(typeof applicaImpostazioni === "function") applicaImpostazioni(); }catch(_){}
    if(prova){
      try{ if(typeof aggiornaTastoAudio === "function") aggiornaTastoAudio(); }catch(_){}
    }
  }

  function toggleAudio(){
    if(typeof SET === "undefined" || !SET.audio) return;
    SET.audio.on = !SET.audio.on;
    salvaImpostazioniAudio(true);
    sincronizzaAudio();
  }

  function apri(){
    if(!giocoAttivo()) return false;
    const root = crea();
    try{ if(window.ADF_TIME_CONTROLS && ADF_TIME_CONTROLS.close) ADF_TIME_CONTROLS.close(); }catch(_){}
    aperto = true;
    confermaSenzaSalvareFino = 0;
    root.classList.add("on");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("adf-system-open");
    sincronizzaAudio();
    stato("");
    setTimeout(() => {
      const b = root.querySelector(".adf-system-resume");
      if(b) b.focus({preventScroll:true});
    }, 40);
    return true;
  }

  function chiudi(){
    const root = $id(ROOT_ID);
    aperto = false;
    confermaSenzaSalvareFino = 0;
    if(root){
      root.classList.remove("on");
      root.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("adf-system-open");
    stato("");
  }

  function eventoPersistenteAperto(){
    try{
      if(window.ADF_JAIL && typeof ADF_JAIL.blocked === "function" && ADF_JAIL.blocked()) return true;
      if(typeof GAME_EVENTS !== "undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked()) return true;
      if(window.ADF_EVENTI && typeof ADF_EVENTI.globalHigh === "function" && ADF_EVENTI.globalHigh()) return true;
    }catch(_){}
    return false;
  }

  function checkpointNonSicuro(){
    try{
      if(window.GAME_TIME && typeof GAME_TIME.pending === "function" && GAME_TIME.pending())
        return "Prima completa o annulla l'azione in corso.";
    }catch(_){}

    /* blocked() vale anche per un HIGH persistente, che invece è sicuro da
       salvare. Se non c'è un evento persistente, il blocco indica tipicamente
       un avanzamento/attesa ancora in corso o una finestra transitoria. */
    try{
      if(window.ADF_TIME_CONTROLS && typeof ADF_TIME_CONTROLS.blocked === "function" &&
         ADF_TIME_CONTROLS.blocked() && !eventoPersistenteAperto())
        return "Aspetta che finisca l'avanzamento in corso, poi salva ed esci.";
    }catch(_){}
    return "";
  }

  function scriviCheckpoint(){
    try{ if(window.GAME_TIME && GAME_TIME.ensure) GAME_TIME.ensure(); }catch(_){}

    try{
      if(typeof G !== "undefined"){
        G.ultimoAccesso = Date.now();
      }
    }catch(_){}

    try{
      if(typeof A !== "undefined" && typeof CHIAVE_ARTISTA === "function")
        localStorage.setItem(CHIAVE_ARTISTA(), JSON.stringify(A));
    }catch(e){
      return {ok:false, msg:"Non sono riuscito a salvare l'artista."};
    }

    let partitaOk = true;
    try{
      if(typeof salvaConCopertine === "function") partitaOk = salvaConCopertine() !== false;
      else if(typeof G !== "undefined" && typeof CHIAVE_PARTITA === "function"){
        localStorage.setItem(CHIAVE_PARTITA(), JSON.stringify(G));
      }else if(typeof save === "function"){
        save();
      }
    }catch(e){ partitaOk = false; }

    if(!partitaOk) return {ok:false, msg:"Il salvataggio della partita non è riuscito."};

    try{
      if(typeof SET !== "undefined"){
        if(typeof setSalva === "function") setSalva();
        const n = Number(SET.slot) || 1;
        localStorage.setItem(LAST_SLOT_KEY, String(n));
      }
    }catch(e){
      return {ok:false, msg:"Partita salvata, ma non sono riuscito a salvare le impostazioni."};
    }

    return {ok:true};
  }

  function salvaEdEsci(){
    const blocco = checkpointNonSicuro();
    if(blocco){ stato(blocco, "bad"); return; }

    const esito = scriviCheckpoint();
    if(!esito.ok){ stato(esito.msg || "Salvataggio non riuscito.", "bad"); return; }

    stato("Checkpoint salvato. Torno al menu principale…", "good");
    /* Il reload è voluto: chiude qualunque overlay e ricarica esattamente il
       checkpoint appena scritto, senza lasciare in RAM una transazione vecchia. */
    setTimeout(() => location.reload(), 140);
  }

  function esciSenzaSalvare(b){
    const adesso = Date.now();
    if(adesso > confermaSenzaSalvareFino){
      confermaSenzaSalvareFino = adesso + 4200;
      b.textContent = "Conferma: esci senza salvare";
      b.classList.add("armato");
      stato("Le modifiche dopo l'ultimo salvataggio verranno perse.", "bad");
      setTimeout(() => {
        if(Date.now() <= confermaSenzaSalvareFino) return;
        confermaSenzaSalvareFino = 0;
        b.textContent = "Esci senza salvare";
        b.classList.remove("armato");
        stato("");
      }, 4300);
      return;
    }

    /* Nessuna chiamata a save(): il reload rimette in memoria l'ultimo
       checkpoint realmente presente in localStorage. */
    location.reload();
  }

  function apriImpostazioniSistema(){
    chiudi();
    try{
      if(typeof window.IMPOSTAZIONI === "function"){
        window.IMPOSTAZIONI();
        return;
      }
      if(typeof apriImpostazioni === "function") apriImpostazioni();
    }catch(_){}
  }

  function mappaBloccata(){
    if(internoDaChiuderePrima()) return true;
    try{ if(window.GAME_TIME && typeof GAME_TIME.pending === "function" && GAME_TIME.pending()) return true; }catch(_){}
    try{ if(typeof GAME_EVENTS !== "undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked()) return true; }catch(_){}
    try{ if(window.ADF_EVENTI && typeof ADF_EVENTI.globalHigh === "function" && ADF_EVENTI.globalHigh()) return true; }catch(_){}
    return false;
  }

  function tornaMappa(){
    if(hostAttivo() === "jail" || hostAttivo() === "hub" || mappaBloccata()) return;
    chiudi();

    /* Prima chiudiamo gli overlay di navigazione; poi rendiamo esplicita la
       destinazione hub, così il tasto significa sempre davvero "Mappa". */
    try{ if($id("posto") && $id("posto").classList.contains("on") && typeof chiudiPosto === "function") chiudiPosto(); }catch(_){}
    try{ if($id("negozio") && $id("negozio").classList.contains("on") && typeof chiudiNegozio === "function") chiudiNegozio(); }catch(_){}
    try{ if($id("studio") && $id("studio").classList.contains("on") && typeof chiudiStudio === "function") chiudiStudio(); }catch(_){}
    try{ if($id("strada") && $id("strada").classList.contains("on") && typeof chiudiStrada === "function") chiudiStrada(); }catch(_){}

    try{
      if(window.HUB && typeof HUB.apri === "function"){ HUB.apri(); return; }
      if(typeof GO === "function"){
        GO("hub");
        if(typeof renderHub === "function") renderHub();
        return;
      }
      if(typeof goto === "function"){
        goto("hub");
        if(typeof renderHub === "function") renderHub();
      }
    }catch(_){}
  }

  function creaBarraGlobale(){
    let bar = $id("adf-global-nav");
    if(bar) return bar;
    bar = document.createElement("nav");
    bar.id = "adf-global-nav";
    bar.className = "adf-global-nav";
    bar.setAttribute("aria-label", "Navigazione di gioco");
    bar.innerHTML = `
      <button class="adf-global-system" type="button" data-adf-global="sistema" aria-label="Apri menu di sistema" title="Menu di sistema · ESC">
        <svg class="adf-wordmark-crown" viewBox="0 0 24 14" aria-hidden="true"><path d="M2 13 .8 2.6l5.6 4.2L12 .8l5.6 6 5.6-4.2L22 13z"></path></svg>
        <span class="adf-wordmark-text"><b>Anni di</b><i>Fame</i></span>
      </button>
      <button class="adf-global-map" type="button" data-adf-global="mappa">
        <span aria-hidden="true">←</span><span>MAPPA</span>
      </button>`;
    document.body.appendChild(bar);
    return bar;
  }

  function sincronizzaBarraGlobale(){
    const bar = creaBarraGlobale();
    const h = hostAttivo();
    const viva = !!h;
    bar.hidden = !viva;
    document.body.classList.toggle("adf-gameplay-active", viva);
    if(!viva) return;

    const map = bar.querySelector('[data-adf-global="mappa"]');
    const senzaMappa = h === "hub" || h === "jail";
    map.hidden = senzaMappa;
    const bloccata = !senzaMappa && mappaBloccata();
    map.disabled = bloccata;
    map.title = bloccata ? "Prima chiudi la decisione o l'azione in corso" : "Torna alla mappa";
    map.setAttribute("aria-disabled", bloccata ? "true" : "false");
  }

  function preparaControlliContesto(){
    /* V2: LA FAME e MAPPA sono un unico componente globale, sempre nello
       stesso punto. Eliminiamo gli innesti della V1 per non avere doppioni. */
    document.querySelectorAll("[data-adf-context]").forEach(el => el.remove());

    const vecchioMenu = $id("g-tomenu");
    if(vecchioMenu) vecchioMenu.remove();

    /* I vecchi ritorni alla mappa restano supportati dal codice legacy ma non
       si mostrano: la destinazione globale è sempre nello stesso punto. */
    sincronizzaBarraGlobale();

    /* I marchi preesistenti non devono più saltare direttamente alla landing.
       Se vengono cliccati durante il gameplay, aprono lo stesso menu LA FAME. */
    const h = hostAttivo();
    const hb = $id("hb-logo");
    if(hb) hb.setAttribute("aria-label", h === "hub" ? "Apri menu di sistema" : "Anni di Fame");
    const brand = $id("brand");
    if(brand) brand.setAttribute("aria-label", h === "game" ? "Apri menu di sistema" : "Anni di Fame — vai al menu principale");
    const stradaLogo = document.querySelector("#strada.on .topbar .logo");
    if(stradaLogo){
      stradaLogo.classList.add("adf-system-logo");
      stradaLogo.setAttribute("role", "button");
      stradaLogo.setAttribute("tabindex", "0");
      stradaLogo.setAttribute("aria-label", "Apri menu di sistema");
      stradaLogo.setAttribute("title", "Menu di sistema");
    }
  }

  function queueSync(){
    if(syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      preparaControlliContesto();
    });
  }

  /* La barra globale è l'ancora dell'interfaccia. I vecchi marchi restano
     compatibili come scorciatoie, ma il tasto visibile ufficiale è sempre
     LA FAME nella stessa posizione. */
  document.addEventListener("click", e => {
    const global = e.target.closest("[data-adf-global]");
    if(global){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(global.dataset.adfGlobal === "mappa") tornaMappa();
      else apri();
      return;
    }

    const legacy = e.target.closest("#hb-logo, #brand, #strada.on .topbar .logo");
    if(legacy && giocoAttivo()){
      e.preventDefault();
      e.stopImmediatePropagation();
      apri();
    }
  }, true);

  document.addEventListener("keydown", e => {
    if((e.key === "Enter" || e.key === " ") && e.target && e.target.closest){
      const legacy = e.target.closest("#strada.on .topbar .logo.adf-system-logo");
      if(legacy){
        e.preventDefault();
        e.stopImmediatePropagation();
        apri();
        return;
      }
    }

    if(e.key !== "Escape") return;

    if(aperto){
      e.preventDefault();
      e.stopImmediatePropagation();
      chiudi();
      return;
    }

    if(!giocoAttivo() || internoDaChiuderePrima()) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    apri();
  }, true);

  const observer = new MutationObserver(queueSync);
  observer.observe(document.body, {
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:["class"]
  });

  crea();
  preparaControlliContesto();

  window.ADF_SYSTEM_MENU = Object.freeze({
    open:apri,
    close:chiudi,
    map:tornaMappa,
    saveAndExit:salvaEdEsci
  });
})();

/* === NAV HUD HOST V7 START === */
(function(){
  "use strict";

  const HOSTS=[
    {id:"jail",    root:"#adf-jail.on",     head:".adf-jail-top"},
    {id:"strada",  root:"#strada.on",       head:".topbar"},
    {id:"posto",   root:"#posto.on",         head:".pohead"},
    {id:"negozio", root:"#negozio.on",       head:".nghead"},
    {id:"piazza",  root:"#piazza.on",        head:".phead"},
    {id:"writer",  root:"#writer.on",        head:".whead"},
    /* nello Studio usiamo tutta la card testata, non la flex-line:
       così non spostiamo più avatar/nome come faceva la V6 */
    {id:"studio",  root:"#studio.on",        head:".sthead"},
    {id:"game",    root:"#s-game.screen.on", head:"#gtop"},
    {id:"hub",     root:"#s-hub.screen.on",  head:".pbarra"}
  ];

  let current=null;
  let queued=false;

  function active(){
    for(const h of HOSTS){
      const root=document.querySelector(h.root);
      if(!root) continue;
      const head=root.querySelector(h.head);
      if(head) return {spec:h,head};
    }
    return null;
  }

  function clear(){
    if(current && current.classList) current.classList.remove("adf-system-host-v7");
    current=null;
  }

  function mount(){
    queued=false;
    const nav=document.querySelector(".adf-global-nav");
    if(!nav) return;

    const f=active();
    if(!f){ clear(); return; }

    if(current!==f.head){
      clear();
      current=f.head;
      current.classList.add("adf-system-host-v7");
    }

    nav.dataset.host=f.spec.id;
    if(nav.parentElement!==f.head) f.head.appendChild(nav);
  }

  function queue(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(mount);
  }

  /* lo script è a fondo pagina: normalmente possiamo montare subito */
  mount();

  document.addEventListener("click",queue,true);
  window.addEventListener("resize",queue);

  const obs=new MutationObserver(queue);
  obs.observe(document.body,{
    subtree:true,
    attributes:true,
    attributeFilter:["class"]
  });
})();
/* === NAV HUD HOST V7 END === */
