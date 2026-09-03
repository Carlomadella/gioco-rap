/* Il ponte fra la partita e il server (punti 30, 34, 35).

   Regola numero uno, e non cambia: **se il server non c'è, il gioco non se ne
   accorge**. Ogni funzione qui dentro torna `null` invece di esplodere, e chi
   la chiama ricasca su quello che ha in locale. Vale ancora di più adesso che
   il gioco si installa: la gente gioca in aereo e in metropolitana.

   Da solo questo file non fa niente: nessuna chiamata parte se non la chiedi.

   Cosa sa fare:
   - iscriversi alla classifica (e prendersi un account senza far compilare
     niente a nessuno);
   - mandare il punteggio della settimana;
   - leggere la classifica, la fetta intorno a te, le notizie;
   - salvare e riprendere la carriera **in cloud**, che è quello che la porta
     dal PC al telefono;
   - dare i traguardi, quelli che poi finiscono su Steam;
   - cancellare l'account, che Apple e Google pretendono. */
"use strict";

/* La versione del gioco, quella che finisce accanto a ogni salvataggio in
   cloud e a ogni dispositivo. La colonna nel database c'e' da sempre e il
   ponte la leggeva gia' (`window.VERSIONE_GIOCO`) — solo che non l'ha mai
   scritta nessuno, e in cloud finiva la stringa vuota. Serve il giorno che un
   salvataggio vecchio va riletto da un gioco nuovo: senza, non si sa da che
   versione arriva. Sta qui e si alza a mano, come il numero in package.json. */
window.VERSIONE_GIOCO = window.VERSIONE_GIOCO || "0.1.0";

const ONLINE = (() => {
  const K_URL = "adf-online-url";
  const K_ID = "adf-online-id";           // l'artista
  const K_CHIAVE = "adf-online-chiave";   // il vecchio modo, ancora buono
  const K_SESSIONE = "adf-online-sessione";

  /* l'identità sta nello slot: tre carriere, tre artisti in classifica */
  const chiave = k => (typeof slotKey === "function" ? slotKey(k) : k);
  const leggi = k => { try{ return localStorage.getItem(chiave(k)); }catch(e){ return null; } };
  const scrivi = (k, v) => { try{ localStorage.setItem(chiave(k), v); }catch(e){} };
  const togli = k => { try{ localStorage.removeItem(chiave(k)); }catch(e){} };

  let staccato = false;
  let base = null;
  try{ base = localStorage.getItem(K_URL); }catch(e){}
  if(!base) base = "http://localhost:8787";

  async function chiama(rotta, opzioni){
    const o = opzioni || {};
    const ctrl = new AbortController();
    const scadenza = setTimeout(() => ctrl.abort(), o.attesa || 8000);
    try{
      const testate = Object.assign({}, o.testate || {});
      if(o.corpo) testate["content-type"] = "application/json";
      const s = leggi(K_SESSIONE);
      if(s && !o.senzaSessione) testate["x-sessione"] = s;
      const res = await fetch(base + rotta, {
        method: o.metodo || "GET",
        headers: testate,
        body: o.corpo ? JSON.stringify(o.corpo) : undefined,
        signal: ctrl.signal
      });
      const dati = await res.json().catch(() => null);
      staccato = false;
      if(!res.ok) return { errore: (dati && dati.errore) || ("http-" + res.status), stato: res.status, dati };
      return dati;
    }catch(e){
      staccato = true;
      return null;
    }finally{ clearTimeout(scadenza); }
  }

  /* ==================== CHI SEI ==================== */
  function identita(){
    const id = leggi(K_ID);
    return id ? { id, chiave: leggi(K_CHIAVE), sessione: leggi(K_SESSIONE) } : null;
  }

  /* Iscrive l'artista alla classifica. Il server apre anche un account da
     ospite: il giocatore non compila niente, e da lì in poi c'è una sessione
     vera con cui salvare in cloud. */
  /* I generi del creatore sono dodici (`js/creator/data.js`), quelli della
     classifica sei (`backend/nomi.js`): la graduatoria è pubblica, condivisa
     coi bot e con chi gioca da un'altra versione, e sei etichette larghe sono
     quelle che rendono `?genere=` una domanda con una risposta sensata.
     Qui c'è scritto in quale delle sei finisce ognuno dei dodici. Serve: senza,
     il server non riconosceva «boombap» o «rnb», ne pescava uno **a caso**, e
     in classifica ti ritrovavi accanto un genere che non avevi mai scelto. */
  const GENERE_SERVER = {
    trap: "trap", plugg: "trap", cloud: "trap",
    drill: "drill",
    rap: "hip hop", conscious: "hip hop",
    boombap: "boom bap",
    rnb: "r&b",
    garage: "urban pop", jersey: "urban pop", afro: "urban pop", pop: "urban pop"
  };

  async function registra(nome, citta, genere){
    const r = await chiama("/api/artista", {
      metodo: "POST", senzaSessione: true,
      corpo: { nome, citta, genere: GENERE_SERVER[genere] || genere,
        difficolta: (typeof G !== "undefined" && G && G.difficolta) || "anni-di-fame",
        dispositivo: { piattaforma: piattaforma(), nome: "questo dispositivo", versione: window.VERSIONE_GIOCO } }
    });
    if(!r || r.errore) return r;
    scrivi(K_ID, r.id);
    if(r.chiave) scrivi(K_CHIAVE, r.chiave);
    if(r.token) scrivi(K_SESSIONE, r.token);
    return r;
  }

  async function assicura(nome, citta, genere){
    const mia = identita();
    if(mia) return mia;
    const r = await registra(nome, citta, genere);
    return r && !r.errore ? identita() : r;
  }

  /* Chi ha ancora solo la vecchia chiave se la scambia con una sessione: serve
     a chi giocava prima che gli account esistessero. */
  async function scambiaVecchiaChiave(){
    const mia = identita();
    if(!mia || mia.sessione || !mia.chiave) return null;
    const r = await chiama("/api/sessione", { metodo: "POST", senzaSessione: true,
      corpo: { tipo: "legacy", artistaId: mia.id, chiave: mia.chiave,
        dispositivo: { piattaforma: piattaforma(), versione: window.VERSIONE_GIOCO } } });
    if(r && r.token){ scrivi(K_SESSIONE, r.token); return r; }
    return r;
  }

  /* Legare l'account a una mail: è quello che fa sopravvivere la carriera a un
     telefono nuovo, finché non ci sono Steam, Apple e Google. */
  const registraConMail = (email, segreto) => chiama("/api/account", {
    metodo: "POST", senzaSessione: true,
    corpo: { tipo: "email", email, segreto, dispositivo: { piattaforma: piattaforma(), versione: window.VERSIONE_GIOCO } }
  }).then(r => { if(r && r.token) scrivi(K_SESSIONE, r.token); return r; });

  const entra = (email, segreto) => chiama("/api/sessione", {
    metodo: "POST", senzaSessione: true,
    corpo: { tipo: "email", email, segreto, dispositivo: { piattaforma: piattaforma(), versione: window.VERSIONE_GIOCO } }
  }).then(r => { if(r && r.token) scrivi(K_SESSIONE, r.token); return r; });

  const esci = async () => {
    await chiama("/api/sessione", { metodo: "DELETE" });
    togli(K_SESSIONE);
  };

  const io = () => chiama("/api/io");

  /* La cancellazione dell'account. Va chiesta due volte al giocatore prima di
     arrivare qui: quello che sparisce non torna. */
  const cancellaAccount = () => chiama("/api/account", {
    metodo: "DELETE", corpo: { conferma: "cancella" }
  }).then(r => { if(r && r.ok){ togli(K_SESSIONE); togli(K_ID); togli(K_CHIAVE); } return r; });

  function piattaforma(){
    const s = (navigator.userAgent || "").toLowerCase();
    if(/android/.test(s)) return "android";
    if(/iphone|ipad|ipod/.test(s)) return "ios";
    if(/mac os/.test(s)) return "mac";
    if(/windows/.test(s)) return "windows";
    if(/linux/.test(s)) return "linux";
    return "web";
  }

  /* ==================== PUNTEGGIO ==================== */
  function punteggioDaPartita(){
    if(typeof G === "undefined" || !G) return null;
    const usciti = (G.songs || []).filter(s => s.released);
    const ultima = usciti.slice().sort((a, b) => (b.week || 0) - (a.week || 0))[0];
    return {
      stream: Math.round(usciti.reduce((n, s) => n + (s.last || 0), 0)),
      fan: Math.round(G.fans || 0),
      livello: (typeof livello === "function" ? livello().lvl : 1),
      fase: G.phase || 0,
      uscite: usciti.length,
      deal: !!G.contract,
      ultima: ultima ? ultima.t : null,
      seed: ultima ? (ultima.seed || 0) : 0,
      /* Con quali regole e' stata corsa questa settimana. Oggi le tre
         difficolta' pesano uguale, quindi non cambia niente in classifica: il
         server se la scrive e basta, per il giorno che peseranno. */
      difficolta: G.difficolta || "anni-di-fame"
    };
  }

  /* Da chiamare a settimana chiusa. Senza argomenti si prende tutto da G. */
  async function invia(dati){
    const mia = identita();
    if(!mia) return null;
    const p = dati || punteggioDaPartita();
    if(!p) return null;
    return chiama("/api/punteggio", {
      metodo: "POST", corpo: Object.assign({ id: mia.id }, p),
      testate: mia.chiave ? { "x-chiave": mia.chiave } : {}
    });
  }

  /* ==================== LA CARRIERA IN CLOUD ==================== */
  /* Lo stato del gioco è l'oggetto G: si manda com'è. Il server tiene tre slot
     come quelli in locale, e in conflitto vince la partita più avanti. */
  async function salvaCarriera(slot, forza){
    if(typeof G === "undefined" || !G) return null;
    const mia = identita();
    return chiama("/api/carriera/" + (slot || slotAttuale()), {
      metodo: "PUT",
      corpo: {
        stato: G, settimana: G.week || 1, anno: G.year || 1,
        artistaId: mia ? mia.id : null,
        versioneGioco: (window.VERSIONE_GIOCO || ""), forza: !!forza
      }
    });
  }
  const carriera = slot => chiama("/api/carriera/" + (slot || slotAttuale()));
  const carriere = () => chiama("/api/carriere");
  const slotAttuale = () => (typeof SET === "object" && SET && SET.slot) ? SET.slot : 1;

  /* ==================== TRAGUARDI ==================== */
  const traguardi = () => chiama("/api/traguardi");
  function daiTraguardo(codice){
    const mia = identita();
    if(!mia) return Promise.resolve(null);
    return chiama("/api/traguardo", { metodo: "POST",
      corpo: { artistaId: mia.id, codice },
      testate: mia.chiave ? { "x-chiave": mia.chiave } : {} });
  }

  /* ==================== LETTURA ==================== */
  const stato = () => chiama("/api/stato", { attesa: 3000 });
  const notizie = quante => chiama("/api/notizie?quante=" + (quante || 10));

  function classifica(da, quanti){
    const mia = identita();
    return chiama("/api/classifica?da=" + (da || 1) + "&quanti=" + (quanti || 10) +
      (mia ? "&io=" + mia.id : ""));
  }
  function intorno(raggio){
    const mia = identita();
    if(!mia) return Promise.resolve(null);
    return chiama("/api/classifica/intorno/" + mia.id + "?raggio=" + (raggio || 4));
  }

  /* ==================== LAFAMEGRAM (punti 52, 53) ====================
     Il feed vero: i post del mondo, più — se hai un artista — chi ti ha
     appena passato e chi hai passato tu. Stessa forma di telPost() in
     telefono.js, apposta: il telefono prova questo, e se non risponde
     resta sui post finti presi dal diario, senza che si veda la giuntura. */
  function feed(quanti){
    const mia = identita();
    return chiama("/api/feed?quanti=" + (quanti || 20) + (mia ? "&io=" + mia.id : ""));
  }
  function opps(quanti){
    const mia = identita();
    if(!mia) return Promise.resolve(null);
    return chiama("/api/opps?io=" + mia.id + "&quanti=" + (quanti || 3));
  }

  /* ==================== LA CLASSIFICA NELLA SCHERMATA (punti 12 e 30) ====
     Il server c'era da un pezzo, con dentro tutto — graduatoria, frecce,
     stagioni, sanzioni — e la schermata del gioco continuava a disegnare i
     rivali finti di casa: il multiplayer esisteva e non si vedeva. Qui c'è
     il giro che li mette in contatto, e sta in questo file perché è ancora
     traffico verso il server, non disegno.

     Due regole. La prima: **nessun modulo da compilare.** Alla prima
     settimana chiusa ci si iscrive da soli, col nome e la città che il
     giocatore ha già scritto nel creatore — se non ha un nome non si fa
     niente e si riprova la settimana dopo. La seconda, quella di sempre: se
     il server non c'è non se ne accorge nessuno. `CACHE` resta quella di
     prima (o `null`), e la schermata ricasca sui rivali locali. */
  let CACHE = null;
  let CACHE_QUANTI = 10;
  let inCorso = false, daRifare = false;

  /* Solo leggere: funziona anche per chi non si è mai iscritto — la
     classifica è pubblica, la si guarda anche stando fuori. */
  async function aggiornaClassifica(quanti){
    const q = quanti || CACHE_QUANTI;
    const c = await classifica(1, q);
    if(!c || c.errore) return null;
    CACHE = c; CACHE_QUANTI = q;
    return c;
  }

  /* Il giro intero di fine settimana: iscrizione se serve, punteggio, e la
     classifica aggiornata.

     Uno alla volta, ma senza perdere pezzi: con un salto lungo si chiudono
     venti settimane di fila in un attimo, e accavallare venti richieste non ha
     senso. Chi arriva mentre è in corso però non viene buttato via — lascia
     detto di rifare il giro appena finisce questo. Se lo si scartasse e basta,
     l'ultimo punteggio, quello vero, potrebbe non partire mai. */
  async function sincronizza(quanti){
    if(inCorso){ daRifare = true; return CACHE; }
    inCorso = true;
    try{
      let ultima = CACHE;
      do{
        daRifare = false;
        const art = window.ARTIST || {};
        const nome = String(art.name || "").trim();
        if(nome){
          const mia = await assicura(nome, String(art.city || "").trim(), art.genre);
          if(mia && mia.id) await invia();
        }
        ultima = await aggiornaClassifica(quanti);
      } while(daRifare);
      return ultima;
    }catch(e){
      return CACHE;
    }finally{ inCorso = false; daRifare = false; }
  }

  const classificaInCache = () => CACHE;

  /* ==================== IMPOSTAZIONI ==================== */
  function collega(url){
    base = String(url || "").replace(/\/+$/, "") || "http://localhost:8787";
    try{ localStorage.setItem(K_URL, base); }catch(e){}
    CACHE = null;   /* un altro server è un'altra classifica */
    return base;
  }
  function scollega(){ togli(K_ID); togli(K_CHIAVE); togli(K_SESSIONE); CACHE = null; }

  return {
    get url(){ return base; },
    get staccato(){ return staccato; },
    collega, scollega, identita, registra, assicura, scambiaVecchiaChiave,
    registraConMail, entra, esci, io, cancellaAccount, piattaforma,
    punteggioDaPartita, invia,
    salvaCarriera, carriera, carriere,
    traguardi, daiTraguardo,
    classifica, intorno, stato, notizie,
    sincronizza, aggiornaClassifica, classificaInCache,
    feed, opps
  };
})();
window.ONLINE = ONLINE;
