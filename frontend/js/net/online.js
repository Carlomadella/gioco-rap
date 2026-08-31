/* Il ponte fra la partita e la classifica vera (punto 30).

   Regola numero uno: se il server non c'è, il gioco non se ne accorge. Ogni
   funzione qui dentro torna `null` invece di esplodere, e chi la chiama
   ricasca sulla classifica locale come ha sempre fatto. Il multiplayer è una
   cosa in più, non una cosa da cui dipendere.

   Da solo questo file non fa niente: nessuna chiamata parte se non la chiedi.
   Si aggancia alla schermata classifica quando quella parte sarà pronta. */
"use strict";

const ONLINE = (() => {
  const K_URL = "adf-online-url";
  const K_ID = "adf-online-id";
  const K_CHIAVE = "adf-online-chiave";

  /* l'identità sta nello slot: tre carriere, tre artisti in classifica */
  const chiave = k => (typeof slotKey === "function" ? slotKey(k) : k);
  const leggi = k => { try{ return localStorage.getItem(chiave(k)); }catch(e){ return null; } };
  const scrivi = (k, v) => { try{ localStorage.setItem(chiave(k), v); }catch(e){} };

  let staccato = false;          // l'ultimo tentativo è andato a vuoto
  let base = null;
  try{ base = localStorage.getItem(K_URL); }catch(e){}
  if(!base) base = "http://localhost:8787";

  async function chiama(rotta, opzioni){
    const o = opzioni || {};
    const ctrl = new AbortController();
    const scadenza = setTimeout(() => ctrl.abort(), o.attesa || 6000);
    try{
      const res = await fetch(base + rotta, {
        method: o.metodo || "GET",
        headers: Object.assign(o.corpo ? { "content-type": "application/json" } : {}, o.testate || {}),
        body: o.corpo ? JSON.stringify(o.corpo) : undefined,
        signal: ctrl.signal
      });
      const dati = await res.json().catch(() => null);
      staccato = false;
      if(!res.ok) return { errore: (dati && dati.errore) || ("http-" + res.status) };
      return dati;
    }catch(e){
      staccato = true;
      return null;
    }finally{ clearTimeout(scadenza); }
  }

  /* ==================== IDENTITÀ ==================== */
  function identita(){
    const id = leggi(K_ID), ch = leggi(K_CHIAVE);
    return id && ch ? { id, chiave: ch } : null;
  }

  /* Iscrive l'artista alla classifica. La chiave torna una volta sola: da lì
     in poi vive nel localStorage di chi gioca, come i salvataggi. */
  async function registra(nome, citta, genere){
    const r = await chiama("/api/artista", {
      metodo: "POST", corpo: { nome, citta, genere }
    });
    if(!r || r.errore) return r;
    scrivi(K_ID, r.id); scrivi(K_CHIAVE, r.chiave);
    return r;
  }

  /* Come registra, ma non ripete: se l'artista c'è già torna quello. */
  async function assicura(nome, citta, genere){
    const mia = identita();
    if(mia) return mia;
    const r = await registra(nome, citta, genere);
    return r && !r.errore ? { id: r.id, chiave: r.chiave, nome: r.nome, pos: r.pos } : r;
  }

  async function rinomina(nome, citta, genere){
    const mia = identita();
    if(!mia) return null;
    return chiama("/api/artista/" + mia.id, {
      metodo: "PUT", corpo: { nome, citta, genere }, testate: { "x-chiave": mia.chiave }
    });
  }

  /* ==================== PUNTEGGIO ==================== */
  /* Gli stream della settimana appena chiusa: gli stessi che la classifica
     locale usa già in `js/game/ui.js`. */
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
      seed: ultima ? (ultima.seed || 0) : 0
    };
  }

  /* Da chiamare a settimana chiusa. Senza argomenti si prende tutto da G. */
  async function invia(dati){
    const mia = identita();
    if(!mia) return null;
    const p = dati || punteggioDaPartita();
    if(!p) return null;
    return chiama("/api/punteggio", {
      metodo: "POST", corpo: Object.assign({ id: mia.id }, p), testate: { "x-chiave": mia.chiave }
    });
  }

  /* ==================== LETTURA ==================== */
  const stato = () => chiama("/api/stato", { attesa: 3000 });
  const notizie = quante => chiama("/api/notizie?quante=" + (quante || 10));

  /* La fetta che vuoi: `classifica(1, 10)` è la top 10, `classifica(1, 100)`
     la top 100. La riga tua torna sempre a parte, anche se sei fuori. */
  function classifica(da, quanti){
    const mia = identita();
    return chiama("/api/classifica?da=" + (da || 1) + "&quanti=" + (quanti || 10) +
      (mia ? "&io=" + mia.id : ""));
  }

  /* Chi hai davanti e chi hai dietro: serve per «sei 428°». */
  function intorno(raggio){
    const mia = identita();
    if(!mia) return Promise.resolve(null);
    return chiama("/api/classifica/intorno/" + mia.id + "?raggio=" + (raggio || 4));
  }

  /* ==================== IMPOSTAZIONI ==================== */
  function collega(url){
    base = String(url || "").replace(/\/+$/, "") || "http://localhost:8787";
    try{ localStorage.setItem(K_URL, base); }catch(e){}
    return base;
  }
  function scollega(){
    try{ localStorage.removeItem(chiave(K_ID)); localStorage.removeItem(chiave(K_CHIAVE)); }catch(e){}
  }

  return {
    get url(){ return base; },
    get staccato(){ return staccato; },
    collega, scollega, identita, registra, assicura, rinomina,
    punteggioDaPartita, invia, classifica, intorno, stato, notizie
  };
})();
window.ONLINE = ONLINE;
