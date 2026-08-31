/* L'archivio: un file JSON, scritto in modo che non si rompa a metà.

   Per una classifica va benissimo: si legge tutto in memoria all'avvio, si
   riscrive su disco al massimo una volta ogni due secondi, e il salvataggio
   passa da un file temporaneo rinominato — se il server muore mentre scrive,
   il file buono resta quello di prima. Il giorno che i giocatori diventano
   tanti si cambia questo file e basta: il resto del server non lo sa. */
"use strict";

const fs = require("fs");
const path = require("path");
const { popolazione, settimanaBot, ricambio } = require("../bot.js");

const VERSIONE = 1;

function vuoto(quantiBot, settimanaMs){
  const usati = new Set();
  const dati = {
    versione: VERSIONE,
    settimana: 1,
    creato: Date.now(),
    prossimoGiro: Date.now() + settimanaMs,
    artisti: {},
    notizie: []
  };
  for(const b of popolazione(quantiBot, usati)) dati.artisti[b.id] = b;
  posizioni(dati, true);
  return dati;
}

function carica(percorso, quantiBot, settimanaMs){
  try{
    const dati = JSON.parse(fs.readFileSync(percorso, "utf8"));
    if(dati && dati.versione === VERSIONE && dati.artisti) return dati;
    console.log("[archivio] versione non riconosciuta, riparto da zero");
  }catch(e){
    if(e.code !== "ENOENT") console.log("[archivio] file illeggibile (" + e.message + "), riparto da zero");
  }
  return vuoto(quantiBot, settimanaMs);
}

/* Scrittura rimandata: mille punteggi in un minuto non fanno mille scritture. */
let attesa = null, ultimoErrore = 0;
function salva(dati, percorso, subito){
  dati.aggiornato = Date.now();
  const scrivi = () => {
    attesa = null;
    try{
      fs.mkdirSync(path.dirname(percorso), { recursive: true });
      const tmp = percorso + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(dati));
      fs.renameSync(tmp, percorso);
    }catch(e){
      if(Date.now() - ultimoErrore > 60000){ ultimoErrore = Date.now(); console.error("[archivio] non salvo: " + e.message); }
    }
  };
  if(subito){ if(attesa){ clearTimeout(attesa); attesa = null; } return scrivi(); }
  if(!attesa) attesa = setTimeout(scrivi, 2000);
}

/* La graduatoria: tutti insieme, bot e giocatori, ordinati per stream.
   `azzeraPrec` serve solo alla creazione, quando un «prima» non c'è. */
function ordinati(dati){
  return Object.values(dati.artisti).sort((a, b) =>
    b.stream - a.stream || a.creato - b.creato);
}
function posizioni(dati, azzeraPrec){
  const lista = ordinati(dati);
  lista.forEach((a, i) => {
    a.pos = i + 1;
    if(azzeraPrec) a.posPrec = i + 1;
  });
  return lista;
}

/* Il giro di settimana: è qui che la classifica si muove da sola.
   1) si fotografa la posizione di adesso, che diventa il «prima»
   2) i bot vivono la loro settimana
   3) chi non gioca da un pezzo scende: la classifica non è un museo
   4) si riordina tutto e si riparte */
function giroSettimana(dati, cfg){
  const notizie = [];
  const tutti = Object.values(dati.artisti);
  for(const a of tutti){ a.posPrec = a.pos; a.streamPrec = a.stream; }

  settimanaBot(tutti.filter(a => a.bot), notizie);

  const fermoDa = cfg.settimanaMs * 1.5;
  for(const a of tutti){
    if(a.bot) continue;
    if(Date.now() - (a.ultimo || a.creato) > fermoDa) a.stream = Math.round(a.stream * 0.92);
  }

  const bot = tutti.filter(a => a.bot);
  const prima = bot.length;
  ricambio(bot, cfg.quantiBot, new Set(tutti.map(a => a.nome.toLowerCase())), notizie);
  for(const b of bot.slice(prima)) dati.artisti[b.id] = b;
  for(const a of tutti) if(a.bot && bot.indexOf(a) < 0) delete dati.artisti[a.id];

  posizioni(dati, false);
  dati.settimana++;
  dati.prossimoGiro = Date.now() + cfg.settimanaMs;
  const ts = Date.now();
  dati.notizie = notizie.map(t => ({ t: ts, s: dati.settimana, testo: t }))
    .concat(dati.notizie || []).slice(0, 60);
  return notizie.length;
}

/* Chiamata a ogni richiesta: se è passata una settimana (o tre, se il server
   era spento) recupera i giri arretrati, senza mai andare in loop. */
function assicuraSettimana(dati, cfg){
  let giri = 0;
  while(Date.now() >= dati.prossimoGiro && giri < 12){ giroSettimana(dati, cfg); giri++; }
  if(giri >= 12){ dati.prossimoGiro = Date.now() + cfg.settimanaMs; }
  return giri;
}

module.exports = { VERSIONE, carica, salva, ordinati, posizioni, giroSettimana, assicuraSettimana };
