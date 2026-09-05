/* Menu di avvio sulla landing — Anni di Fame.
   V2: tre slot espliciti, avvio rapido sul primo slot libero, gestione elimina,
   e pulsante principale dinamico INIZIA / CONTINUA sull'ultima carriera usata.
   La difficoltà resta nominale: tutti i livelli usano il bilanciamento base. */
"use strict";

(() => {
  const DIFFICOLTA = {
    "strada-aperta": {
      nome: "Strada aperta",
      tag: "Più permissiva",
      desc: "Più spazio per sperimentare e costruire la carriera con calma."
    },
    "anni-di-fame": {
      nome: "Anni di Fame",
      tag: "Esperienza standard",
      desc: "Il riferimento del gioco: la difficoltà su cui viene pensata la carriera."
    },
    "niente-sconti": {
      nome: "Niente sconti",
      tag: "Poco margine",
      desc: "Pensata per far pesare di più errori, soldi e occasioni quando il bilanciamento verrà collegato."
    }
  };

  const LAST_SLOT_KEY = "adf-ultimo-slot-v1";
  let passo = "menu";
  let modalita = "";
  let difficoltaScelta = "anni-di-fame";
  let targetSlot = 0;
  let avvioDopoCreator = false;
  let ritornoElimina = "carica";

  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const nSlot = () => (typeof N_SLOT === "number" ? N_SLOT : 3);
  const suffisso = n => n > 1 ? "-s" + n : "";
  const chiavi = n => ({ artista: ART_KEY + suffisso(n), partita: SAVE_KEY + suffisso(n) });

  function leggiJSON(k){
    try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; }
  }

  /* Uno slot è davvero occupato solo quando esiste un artista salvato.
     Un oggetto partita di default, da solo, non deve bloccare uno slot libero. */
  function infoSlot(n){
    const k = chiavi(n), a = leggiJSON(k.artista), g = leggiJSON(k.partita);
    const nome = a && typeof a.name === "string" ? a.name.trim() : "";
    const artista = !!nome;
    return {n, k, a, g: artista ? g : null, nome, artista, partita:artista && !!g, vuoto:!artista};
  }
  const slotAttivo = () => infoSlot((SET && SET.slot) || 1);
  const slots = () => Array.from({length:nSlot()}, (_,i) => infoSlot(i + 1));
  const primoLibero = () => { const s = slots().find(x => x.vuoto); return s ? s.n : 0; };
  const artistaCreato = () => slotAttivo().artista;
  const diffNome = id => (DIFFICOLTA[id] || DIFFICOLTA["anni-di-fame"]).nome;
  const diffCorrente = s => (s && s.g && DIFFICOLTA[s.g.difficolta])
    ? s.g.difficolta
    : (SET && SET.gioco && DIFFICOLTA[SET.gioco.difficolta]) ? SET.gioco.difficolta : "anni-di-fame";

  function ultimoSlot(){
    const validi = slots().filter(s => s.artista);
    if(!validi.length) return null;

    /* Da questa versione ogni ingresso scrive ultimoAccesso. Se c'è, è la
       fonte più precisa per capire quale carriera è stata usata per ultima. */
    const conTempo = validi.filter(s => s.g && Number.isFinite(+s.g.ultimoAccesso));
    if(conTempo.length){
      conTempo.sort((a,b) => (+b.g.ultimoAccesso || 0) - (+a.g.ultimoAccesso || 0));
      return conTempo[0];
    }

    let mem = 0;
    try{ mem = +(localStorage.getItem(LAST_SLOT_KEY) || 0); }catch(e){}
    const ricordato = validi.find(s => s.n === mem);
    if(ricordato) return ricordato;

    const attivo = validi.find(s => s.n === +(SET.slot || 1));
    return attivo || validi[0];
  }

  function metaSlot(s, conDiff){
    if(!s || !s.artista) return "Slot libero";
    let t = s.g ? "Anno " + (s.g.year || 1) + " · settimana " + (s.g.week || 1) : "Artista pronto";
    if(conDiff) t += " · " + diffNome(diffCorrente(s));
    return t;
  }
  function dettaglioSlot(s, conDiff){
    if(!s || !s.artista) return "Slot libero";
    return esc(s.nome) + " · " + metaSlot(s, conDiff);
  }

  function icona(nome){
    const map = {continua:"▶", nuova:"＋", rapido:"↗", carica:"▤", importa:"↓"};
    return map[nome] || "→";
  }

  function riga(azione, titolo, desc, opts){
    const o = opts || {};
    return '<button class="avv-riga' + (o.prima ? ' prima' : '') + (o.pericolo ? ' pericolo' : '') +
      '" data-avvio="' + azione + '"' + (o.arg != null ? ' data-arg="' + o.arg + '"' : '') +
      (o.disabled ? ' disabled aria-disabled="true"' : '') + '>' +
      '<span class="avv-ic">' + (o.ic || icona(azione)) + '</span>' +
      '<span class="avv-tx"><b>' + titolo + '</b><small>' + desc + '</small></span>' +
      '<span class="avv-freccia">' + (o.disabled ? '—' : '→') + '</span></button>';
  }

  function testa(kicker, titolo, sub, indietro){
    return '<div class="avv-testa">' +
      (indietro ? '<button class="avv-back" data-avvio="indietro">← indietro</button>' : '<span class="avv-kicker">' + kicker + '</span>') +
      '<h2>' + titolo + '</h2><p>' + sub + '</p></div>';
  }

  function htmlMenu(){
    const u = ultimoSlot();
    return testa("Partita", "Da dove vuoi partire?", "Scegli il modo in cui entrare nella tua storia.", false) +
      '<div class="avv-lista">' +
      riga("continua", "Continua", u ? dettaglioSlot(u) : "Nessuna partita da riprendere", {prima:!!u, disabled:!u}) +
      riga("nuova", "Nuova partita", "Crea il tuo artista e scegli in quale dei 3 slot salvarlo") +
      riga("rapido", "Avvio rapido", "Usa automaticamente il primo slot libero e vai subito in città") +
      riga("carica", "Carica partita", "Apri o elimina una delle carriere salvate") +
      '</div>' +
      '<button class="avv-importa" data-avvio="importa"><span>↓</span><b>Importa partita</b><small>Ripristina un salvataggio esportato</small></button>';
  }

  function htmlDifficolta(){
    const modalitaNome = modalita === "rapido" ? "Avvio rapido" : "Nuova partita";
    return testa(modalitaNome, "Scegli la difficoltà", "La scelta viene salvata con la carriera. Per ora il bilanciamento resta quello base.", true) +
      '<div class="avv-diff">' + Object.keys(DIFFICOLTA).map(id => {
        const d = DIFFICOLTA[id];
        return '<button class="avv-diff-card' + (id === "anni-di-fame" ? ' consigliata' : '') + '" data-avvio="difficolta" data-arg="' + id + '">' +
          '<span class="avv-diff-tag">' + d.tag + '</span><b>' + d.nome + '</b><p>' + d.desc + '</p>' +
          (id === "anni-di-fame" ? '<em>Consigliata</em>' : '') + '<span class="avv-diff-go">→</span></button>';
      }).join("") + '</div>';
  }

  function htmlScegliSlot(){
    let rows = "";
    for(const s of slots()){
      const libero = s.vuoto;
      rows += '<button class="avv-slot avv-slot-scelta' + (libero ? ' libero' : ' occupato') + '" data-avvio="slot-nuova" data-arg="' + s.n + '">' +
        '<span class="avv-slot-num">0' + s.n + '</span>' +
        '<span class="avv-slot-tx"><b>' + (libero ? 'Slot libero' : esc(s.nome)) + '</b><small>' +
        (libero ? '+ Nuova carriera' : metaSlot(s, true)) + '</small></span>' +
        '<span class="avv-slot-stato">' + (libero ? 'LIBERO' : 'OCCUPATO') + '</span><span class="avv-freccia">→</span></button>';
    }
    return testa("Nuova partita", "Scegli lo slot", "Hai tre carriere indipendenti. Uno slot occupato può essere sostituito solo dopo conferma.", true) +
      '<div class="avv-slots">' + rows + '</div>';
  }

  function htmlNessunSlot(){
    let rows = "";
    for(const s of slots()){
      rows += '<button class="avv-slot avv-slot-scelta occupato" data-avvio="rapido-sostituisci" data-arg="' + s.n + '">' +
        '<span class="avv-slot-num">0' + s.n + '</span><span class="avv-slot-tx"><b>' + esc(s.nome) + '</b>' +
        '<small>' + metaSlot(s, true) + '</small></span><span class="avv-slot-stato">LIBERA E USA</span><span class="avv-freccia">→</span></button>';
    }
    return testa("Avvio rapido", "Nessuno slot libero", "Tutte e tre le carriere sono occupate. Scegli quale liberare: prima di cancellarla ti chiederemo conferma.", true) +
      '<div class="avv-slots">' + rows + '</div>';
  }

  function htmlConferma(){
    const s = infoSlot(targetSlot || SET.slot || 1);
    const rapido = modalita === "rapido";
    return testa("Slot " + s.n, "Qui c'è già una partita", '"' + esc(s.nome || "Questo slot") +
      '" verrà eliminata e sostituita. Gli altri slot non verranno toccati.', true) +
      '<div class="avv-conferma"><span class="avv-alert">!</span><div><b>' + (rapido ? 'Liberare e usare' : 'Sostituire') + ' lo slot ' + s.n + '?</b>' +
      '<p>' + dettaglioSlot(s, true) + '</p><p>Nuova difficoltà: <strong>' + diffNome(difficoltaScelta) + '</strong></p></div></div>' +
      '<div class="avv-conferma-azioni"><button data-avvio="indietro">Annulla</button>' +
      '<button class="danger" data-avvio="sostituisci">' + (rapido ? 'Libera e avvia' : 'Sostituisci e continua') + '</button></div>';
  }

  function htmlCarica(){
    let rows = "";
    for(const s of slots()){
      if(!s.artista){
        rows += '<div class="avv-slot-row"><button class="avv-slot libero" disabled aria-disabled="true">' +
          '<span class="avv-slot-num">0' + s.n + '</span><span class="avv-slot-tx"><b>Slot libero</b><small>Nessuna carriera salvata</small></span>' +
          '<span class="avv-freccia">—</span></button></div>';
        continue;
      }
      rows += '<div class="avv-slot-row"><button class="avv-slot" data-avvio="slot" data-arg="' + s.n + '">' +
        '<span class="avv-slot-num">0' + s.n + '</span><span class="avv-slot-tx"><b>' + esc(s.nome) + '</b><small>' + metaSlot(s, true) + '</small></span>' +
        '<span class="avv-freccia">→</span></button>' +
        '<button class="avv-elimina" data-avvio="elimina" data-arg="' + s.n + '" aria-label="Elimina ' + esc(s.nome) + '">Elimina</button></div>';
    }
    return testa("Salvataggi", "Carica partita", "Apri una carriera oppure elimina uno slot che non ti serve più.", true) +
      '<div class="avv-slots">' + rows + '</div>';
  }

  function htmlElimina(){
    const s = infoSlot(targetSlot);
    return testa("Slot " + s.n, "Eliminare questa partita?", "Questa operazione cancella artista e carriera dallo slot. Gli altri salvataggi restano intatti.", true) +
      '<div class="avv-conferma"><span class="avv-alert">!</span><div><b>' + esc(s.nome || "Slot " + s.n) + '</b><p>' + dettaglioSlot(s, true) + '</p></div></div>' +
      '<div class="avv-conferma-azioni"><button data-avvio="indietro">Annulla</button>' +
      '<button class="danger" data-avvio="elimina-conferma">Elimina definitivamente</button></div>';
  }

  function pannello(){
    let p = $("land-avvio");
    if(p) return p;
    p = document.createElement("div");
    p.id = "land-avvio";
    p.className = "land-avvio";
    p.setAttribute("aria-hidden", "true");
    p.setAttribute("aria-label", "Menu di avvio partita");
    const hero = document.querySelector(".land-hero");
    if(hero) hero.appendChild(p);
    p.addEventListener("click", clickPannello);
    return p;
  }

  function disegna(){
    const p = pannello();
    if(!p) return;
    p.innerHTML = passo === "difficolta" ? htmlDifficolta()
      : passo === "slot-nuova" ? htmlScegliSlot()
      : passo === "nessun-slot" ? htmlNessunSlot()
      : passo === "conferma" ? htmlConferma()
      : passo === "carica" ? htmlCarica()
      : passo === "elimina" ? htmlElimina()
      : htmlMenu();
    p.classList.remove("step-in");
    void p.offsetWidth;
    p.classList.add("step-in");
  }

  function apri(){
    passo = "menu"; modalita = ""; targetSlot = 0; disegna();
    const p = pannello(), h = $("mhero");
    if(h) h.classList.add("avvio-aperto");
    if(p) p.setAttribute("aria-hidden", "false");
    try{ clearTimeout(landGiro); }catch(e){}
    setTimeout(() => {
      const f = p && p.querySelector("button:not([disabled])");
      if(f) f.focus({preventScroll:true});
    }, 280);
  }

  function chiudi(){
    const p = pannello(), h = $("mhero");
    if(h) h.classList.remove("avvio-aperto");
    if(p) p.setAttribute("aria-hidden", "true");
    passo = "menu"; modalita = ""; targetSlot = 0;
    try{ if(typeof landRiprendi === "function") landRiprendi(); }catch(e){}
  }
  const aperto = () => !!($("mhero") && $("mhero").classList.contains("avvio-aperto"));

  function salvaDifficolta(id){
    const scelto = DIFFICOLTA[id] ? id : "anni-di-fame";
    if(SET && SET.gioco){
      SET.gioco.difficolta = scelto;
      /* La difficoltà resta nominale fino al futuro lavoro di bilanciamento. */
      SET.gioco.preset = "normale";
      SET.gioco.energia = 0;
      SET.gioco.spese = 1;
      SET.gioco.fan = 1;
      SET.gioco.rivali = 1;
      if(typeof setSalva === "function") setSalva();
    }
    difficoltaScelta = scelto;
    return scelto;
  }

  function selezionaSlot(n){
    SET.slot = n;
    if(typeof setSalva === "function") setSalva();
  }

  function resetMemoriaEditor(){
    A = DEF();
    G = START();
    window.ARTIST = A;
    try{
      $("name").value = A.name; $("city").value = A.city;
      $("h").value = A.h; $("w").value = A.w;
      $("hv").textContent = A.h + " cm"; $("wv").textContent = A.w + " kg";
      firstRun = true; applyMode(); renderArtista(); renderOpzioni(); renderFondali();
    }catch(e){}
  }

  function eliminaSlot(n){
    const k = chiavi(n);
    try{
      localStorage.removeItem(k.artista);
      localStorage.removeItem(k.partita);
      if(+(localStorage.getItem(LAST_SLOT_KEY) || 0) === n) localStorage.removeItem(LAST_SLOT_KEY);
    }catch(e){}
    if(n === +(SET.slot || 1)) resetMemoriaEditor();
  }

  function preparaNuovoSlot(n, id){
    selezionaSlot(n);
    eliminaSlot(n);
    /* eliminaSlot resetta l'editor solo se lo slot era quello attivo; se si
       sta passando da un altro slot, va comunque ripulita la memoria. */
    resetMemoriaEditor();
    G.difficolta = id;
    try{ localStorage.setItem(chiavi(n).partita, JSON.stringify(G)); }catch(e){}
  }

  function segnaUltimo(n){
    try{
      G.ultimoAccesso = Date.now();
      localStorage.setItem(chiavi(n).partita, JSON.stringify(G));
      localStorage.setItem(LAST_SLOT_KEY, String(n));
    }catch(e){}
  }

  function entraSlot(s){
    if(!s || !s.artista){ landDillo("Nessuna partita da caricare"); return; }
    selezionaSlot(s.n);
    A = Object.assign(DEF(), s.a || {});
    G = Object.assign(START(), s.g || {});
    if(!G.difficolta || !DIFFICOLTA[G.difficolta]) G.difficolta = diffCorrente(s);
    if(SET && SET.gioco) SET.gioco.difficolta = G.difficolta;
    if(typeof setSalva === "function") setSalva();
    window.ARTIST = A;
    segnaUltimo(s.n);
    const jailed=!!(G.strada&&G.strada.arresto);
    chiudi();
    goto("hub");
    if(window.GAME) window.GAME.enter();
    if(jailed&&typeof window.apriCarcere==="function"){
      setTimeout(()=>window.apriCarcere({direct:true,reason:"resume"}),0);
    }
  }

  function continuaUltima(){
    const u = ultimoSlot();
    if(!u){ apri(); return; }
    entraSlot(u);
  }

  function entraPartita(){
    const s = slotAttivo();
    if(!s.artista){ landDillo("Prima crea il tuo artista"); return; }
    entraSlot(s);
  }

  function avviaNuova(n){
    const modo = modalita;
    const id = salvaDifficolta(difficoltaScelta);
    preparaNuovoSlot(n, id);
    chiudi();

    if(modo === "rapido"){
      try{ $("rand").click(); }catch(e){}
      try{ localStorage.setItem(chiavi(n).artista, JSON.stringify(A)); }catch(e){}
      firstRun = false;
      try{ applyMode(); }catch(e){}
      window.ARTIST = A;
      renderMenu();
      entraSlot(infoSlot(n));
      return;
    }

    if(window.ADF_RPG_V24 && typeof window.ADF_RPG_V24.open === "function"){
      avvioDopoCreator = false;
      window.ADF_RPG_V24.open();
      return;
    }

    avvioDopoCreator = true;
    goto("profile");
    setTimeout(() => { try{ $("name").focus(); }catch(e){} }, 80);
  }

  function scegliDifficolta(id){
    difficoltaScelta = DIFFICOLTA[id] ? id : "anni-di-fame";
    if(modalita === "rapido"){
      const libero = primoLibero();
      if(libero){ avviaNuova(libero); return; }
      passo = "nessun-slot"; disegna(); return;
    }
    passo = "slot-nuova"; disegna();
  }

  function importa(){
    chiudi();
    try{ SEZ = "dati"; apriImpostazioni(); }
    catch(e){ if(typeof IMPOSTAZIONI === "function") IMPOSTAZIONI(); }
  }

  function clickPannello(e){
    const b = e.target.closest("[data-avvio]");
    if(!b || b.disabled) return;
    const az = b.dataset.avvio, arg = b.dataset.arg;

    if(az === "continua"){ continuaUltima(); return; }
    if(az === "nuova" || az === "rapido"){
      modalita = az;
      const u = ultimoSlot();
      difficoltaScelta = diffCorrente(u || slotAttivo());
      passo = "difficolta"; disegna(); return;
    }
    if(az === "carica"){ passo = "carica"; disegna(); return; }
    if(az === "importa"){ importa(); return; }
    if(az === "difficolta"){ scegliDifficolta(arg); return; }
    if(az === "slot-nuova"){
      targetSlot = +arg;
      if(infoSlot(targetSlot).artista){ passo = "conferma"; disegna(); }
      else avviaNuova(targetSlot);
      return;
    }
    if(az === "rapido-sostituisci"){
      targetSlot = +arg; passo = "conferma"; disegna(); return;
    }
    if(az === "sostituisci"){ avviaNuova(targetSlot); return; }
    if(az === "slot"){ entraSlot(infoSlot(+arg)); return; }
    if(az === "elimina"){
      targetSlot = +arg; ritornoElimina = "carica"; passo = "elimina"; disegna(); return;
    }
    if(az === "elimina-conferma"){
      eliminaSlot(targetSlot);
      targetSlot = 0;
      renderMenu();
      passo = ritornoElimina;
      disegna();
      return;
    }
    if(az === "indietro"){
      if(passo === "conferma") passo = modalita === "rapido" ? "nessun-slot" : "slot-nuova";
      else if(passo === "elimina") passo = ritornoElimina;
      else if(passo === "slot-nuova" || passo === "nessun-slot") passo = "difficolta";
      else if(passo === "difficolta" || passo === "carica") passo = "menu";
      else{ chiudi(); return; }
      disegna();
    }
  }

  function preparaProfiloSeServe(){
    let s = slotAttivo();
    if(!s.artista) s = ultimoSlot();
    if(!s || !s.artista) return false;
    if(s.n !== +(SET.slot || 1)) selezionaSlot(s.n);
    A = Object.assign(DEF(), s.a || {});
    G = Object.assign(START(), s.g || {});
    window.ARTIST = A;
    try{
      $("name").value = A.name; $("city").value = A.city;
      $("h").value = A.h; $("w").value = A.w;
      $("hv").textContent = A.h + " cm"; $("wv").textContent = A.w + " kg";
      firstRun = false; applyMode(); renderArtista(); renderOpzioni(); renderFondali();
    }catch(e){}
    return true;
  }

  function aggiornaLanding(){
    const u = ultimoSlot();
    const s = slotAttivo().artista ? slotAttivo() : u;

    /* Il grosso pulsante è la scorciatoia intelligente: CONTINUA se esiste
       almeno un salvataggio, INIZIA quando il gioco è ancora vuoto. */
    if($("m-play-a")) $("m-play-a").textContent = u ? "Continua" : "Inizia";
    if($("m-play-b")) $("m-play-b").textContent = u
      ? dettaglioSlot(u)
      : "Scegli come cominciare la tua storia";

    /* La voce 01 resta sempre INIZIA: è l'accesso al menu completo anche se
       il pulsante grande è diventato CONTINUA. */
    if($("m-voce-a")) $("m-voce-a").textContent = "Inizia";
    if($("m-voce-b")) $("m-voce-b").textContent = u
      ? "Continua, carica o crea un'altra partita"
      : "Nuova partita o avvio rapido";

    const prof = document.querySelector('.land-voce[data-go="profile"]');
    if(prof){
      prof.classList.toggle("bloccata", !s);
      prof.setAttribute("aria-disabled", s ? "false" : "true");
      const f = prof.querySelector(".frec"), d = prof.querySelector(".des");
      if(f) f.textContent = s ? "↗" : "🔒";
      if(d) d.textContent = s ? "Aspetto, città, genere" : "Crea prima il tuo artista";
    }

    if($("m-tag")){
      if(u && u.g && carrieraIniziata(u.g)) $("m-tag").textContent = "Carriera in corso · " + u.nome + " · anno " + (u.g.year || 1) + ", settimana " + (u.g.week || 1);
      else if(u) $("m-tag").textContent = "Carriera pronta · " + u.nome;
      else $("m-tag").textContent = "Nessuna carriera iniziata";
    }
  }

  /* renderMenu continua a riempire le statistiche; poi applichiamo il nuovo
     significato dei comandi della landing. */
  try{
    const renderMenuBase = renderMenu;
    renderMenu = function(){ renderMenuBase(); aggiornaLanding(); };
  }catch(e){}

  const play = $("m-play");
  if(play) play.onclick = () => ultimoSlot() ? continuaUltima() : apri();

  /* La voce 01 deve sempre aprire il menu completo, anche quando il pulsante
     grande è diventato CONTINUA. Intercettiamo il vecchio data-go="gioca"
     prima del listener storico di nav.js. */
  document.addEventListener("click", e => {
    const b = e.target.closest('[data-go="gioca"]');
    if(!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    apri();
  }, true);

  /* Il profilo è accessibile solo se esiste almeno un artista salvato. Se lo
     slot attivo è vuoto ma esistono altre carriere, si apre l'ultima usata. */
  document.addEventListener("click", e => {
    const b = e.target.closest('[data-go="profile"]');
    if(!b) return;
    if(!preparaProfiloSeServe()){
      e.preventDefault(); e.stopImmediatePropagation();
      landDillo("Crea prima il tuo artista");
    }
  }, true);

  /* Se Nuova partita arriva al creator, il salvataggio dell'artista chiude il
     percorso e porta direttamente alla città. */
  const salvaArtista = $("save");
  if(salvaArtista && typeof salvaArtista.onclick === "function"){
    const salvaBase = salvaArtista.onclick;
    salvaArtista.onclick = function(e){
      const deveAvviare = avvioDopoCreator;
      salvaBase.call(this, e);
      if(deveAvviare && artistaCreato()){
        avvioDopoCreator = false;
        try{
          G.difficolta = difficoltaScelta;
          localStorage.setItem(chiavi(SET.slot).partita, JSON.stringify(G));
        }catch(err){}
        setTimeout(entraPartita, 0);
      }
    };
  }

  const tornaMenu = $("to-menu");
  if(tornaMenu) tornaMenu.addEventListener("click", () => {
    if(!avvioDopoCreator) return;
    avvioDopoCreator = false;
    if(!artistaCreato()){
      try{ localStorage.removeItem(chiavi(SET.slot).partita); }catch(e){}
      G = START();
    }
  }, true);

  document.addEventListener("keydown", e => {
    if(e.key !== "Escape" || !aperto()) return;
    if(passo !== "menu"){ passo = "menu"; disegna(); }
    else chiudi();
  });

  pannello();
  aggiornaLanding();
  document.addEventListener("DOMContentLoaded", aggiornaLanding);
})();
