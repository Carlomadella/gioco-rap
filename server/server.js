/* Anni di Fame — il server della classifica (punto 30 di implementazioni.md).

   Cosa fa: tiene una classifica sola per tutti. Dentro ci stanno i giocatori
   veri e i bot, mescolati, e da fuori non si distinguono — è il punto: la
   classifica dev'essere piena dal primo giorno, e nessuno deve accorgersi di
   quando i numeri li fa una macchina.

   Come il resto del progetto: nessuna dipendenza, nessun passaggio di build.
   Solo Node.

     node server/server.js

   Manopole (variabili d'ambiente, tutte con un valore sensato di suo):
     ADF_PORTA        porta di ascolto              (8787)
     ADF_DATI         file dell'archivio            (server/dati/classifica.json)
     ADF_BOT          quanti bot tenere in pista    (140)
     ADF_SETTIMANA_H  ore vere di una settimana     (24)
     ADF_ORIGINI      CORS: * oppure lista di origini separate da virgola
     ADF_ADMIN        chiave per forzare un giro di settimana (se vuota, non si può)
*/
"use strict";

const http = require("http");
const path = require("path");
const crypto = require("crypto");
const archivio = require("./archivio.js");
const { idNuovo } = require("./bot.js");
const { CITTA, GENERI, STORIE, scegli } = require("./nomi.js");

const CFG = {
  porta: Number(process.env.ADF_PORTA || 8787),
  file: process.env.ADF_DATI || path.join(__dirname, "dati", "classifica.json"),
  quantiBot: Math.max(0, Number(process.env.ADF_BOT || 140)),
  settimanaMs: Math.max(1, Number(process.env.ADF_SETTIMANA_H || 24)) * 3600e3,
  origini: process.env.ADF_ORIGINI || "*",
  admin: process.env.ADF_ADMIN || ""
};

const DATI = archivio.carica(CFG.file, CFG.quantiBot, CFG.settimanaMs);

/* ==================== ATTREZZI ==================== */
const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");
const nInt = (v, min, max, dif) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dif;
};
/* nome d'arte: niente righe intere, niente caratteri invisibili, niente vuoto */
const INVISIBILI = /[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\ufeff]/g;
function nomePulito(v){
  const s = String(v == null ? "" : v).replace(INVISIBILI, "")
    .replace(/\s+/g, " ").trim().slice(0, 22);
  return s.length >= 2 ? s : "";
}
const nomeLibero = (nome, tranne) => !Object.values(DATI.artisti)
  .some(a => a.id !== tranne && a.nome.toLowerCase() === nome.toLowerCase());

/* Quello che il mondo può vedere di un artista. Qui dentro non passano mai
   né la chiave né il fatto che sia un bot: la seconda cosa è una regola di
   gioco, non una svista. */
function riga(a, ioId){
  const d = (a.posPrec && a.pos) ? a.posPrec - a.pos : null;
  return {
    id: a.id, pos: a.pos, nome: a.nome, citta: a.citta, genere: a.genere,
    stream: a.stream, delta: d, uscite: a.uscite || 0, deal: !!a.deal,
    ultima: a.ultima || null, seed: a.seed || 0, storia: a.storia || "",
    io: ioId ? a.id === ioId : false
  };
}

/* ==================== FRENI ==================== */
const bussate = new Map();                                   // ip -> {t, n}
function troppe(ip){
  const ora = Date.now(), b = bussate.get(ip);
  if(!b || ora - b.t > 60e3){ bussate.set(ip, { t: ora, n: 1 }); return false; }
  b.n++;
  return b.n > 120;
}
setInterval(() => {
  const ora = Date.now();
  for(const [ip, b] of bussate) if(ora - b.t > 120e3) bussate.delete(ip);
}, 120e3).unref();

/* ==================== RISPOSTE ==================== */
function invia(res, codice, corpoRisposta){
  const testo = JSON.stringify(corpoRisposta);
  res.writeHead(codice, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(testo),
    "cache-control": "no-store"
  });
  res.end(testo);
}
const male = (res, codice, errore, extra) => invia(res, codice, Object.assign({ errore }, extra || {}));

function corpo(req){
  return new Promise((ok, no) => {
    let dato = "", troppo = false;
    req.on("data", c => {
      dato += c;
      if(dato.length > 16384 && !troppo){ troppo = true; no(new Error("corpo troppo grande")); req.destroy(); }
    });
    req.on("end", () => { if(troppo) return; try{ ok(dato ? JSON.parse(dato) : {}); }catch(e){ no(new Error("json non valido")); } });
    req.on("error", no);
  });
}

/* ==================== LE ROTTE ==================== */
async function rotta(req, res, url){
  const p = url.pathname.replace(/\/+$/, "") || "/";
  const q = url.searchParams;

  /* com'è messo il server e quanto manca al prossimo giro di settimana */
  if(req.method === "GET" && p === "/api/stato"){
    const tutti = Object.values(DATI.artisti);
    return invia(res, 200, {
      ok: true, versione: archivio.VERSIONE, settimana: DATI.settimana,
      artisti: tutti.length, giocatori: tutti.filter(a => !a.bot).length,
      settimanaOre: CFG.settimanaMs / 3600e3,
      prossimoGiro: DATI.prossimoGiro
    });
  }

  /* un artista nuovo: torna la chiave una volta sola, poi la tiene il client */
  if(req.method === "POST" && p === "/api/artista"){
    const b = await corpo(req);
    const nome = nomePulito(b.nome);
    if(!nome) return male(res, 400, "nome-non-valido");
    if(!nomeLibero(nome, null)) return male(res, 409, "nome-occupato");
    const chiave = crypto.randomBytes(24).toString("hex");
    const a = {
      id: idNuovo(), bot: false, nome,
      citta: nomePulito(b.citta) || scegli(CITTA),
      genere: GENERI.indexOf(b.genere) >= 0 ? b.genere : scegli(GENERI),
      storia: nomePulito(b.storia) || scegli(STORIE),
      stream: 0, streamPrec: 0, pos: 0, posPrec: 0,
      fan: 0, livello: 1, fase: 0, uscite: 0, deal: false,
      seed: nInt(b.seed, 0, 2e9, Math.floor(Math.random() * 1e9)), ultima: null,
      chiave: sha(chiave), creato: Date.now(), ultimo: 0
    };
    DATI.artisti[a.id] = a;
    archivio.posizioni(DATI, false);
    archivio.salva(DATI, CFG.file, true);
    return invia(res, 201, { id: a.id, chiave, nome: a.nome, pos: a.pos });
  }

  /* la carta d'identità: nome, città, genere si possono cambiare */
  const mod = p.match(/^\/api\/artista\/([a-f0-9]{12})$/);
  if(mod && (req.method === "PUT" || req.method === "GET")){
    const a = DATI.artisti[mod[1]];
    if(!a) return male(res, 404, "artista-sconosciuto");
    if(req.method === "GET") return invia(res, 200, riga(a, null));
    if(a.bot) return male(res, 404, "artista-sconosciuto");
    if(a.chiave !== sha(req.headers["x-chiave"] || "")) return male(res, 403, "chiave-sbagliata");
    const b = await corpo(req);
    if(b.nome != null){
      const nome = nomePulito(b.nome);
      if(!nome) return male(res, 400, "nome-non-valido");
      if(!nomeLibero(nome, a.id)) return male(res, 409, "nome-occupato");
      a.nome = nome;
    }
    if(b.citta != null) a.citta = nomePulito(b.citta) || a.citta;
    if(b.genere != null && GENERI.indexOf(b.genere) >= 0) a.genere = b.genere;
    archivio.salva(DATI, CFG.file);
    return invia(res, 200, riga(a, a.id));
  }

  /* il punteggio della settimana appena chiusa */
  if(req.method === "POST" && p === "/api/punteggio"){
    const b = await corpo(req);
    const a = DATI.artisti[String(b.id || "")];
    if(!a || a.bot) return male(res, 404, "artista-sconosciuto");
    if(a.chiave !== sha(req.headers["x-chiave"] || "")) return male(res, 403, "chiave-sbagliata");
    if(Date.now() - (a.ultimo || 0) < 10e3) return male(res, 429, "troppo-in-fretta");

    /* Il freno all'imbroglio: da un invio all'altro gli stream possono al
       massimo quintuplicare. Non è una blindatura — il gioco gira nel browser,
       chi vuole barare bara — ma tiene fuori i numeri assurdi e rende inutile
       il colpo singolo da dieci milioni. Il primo invio ha la mano larga: chi
       arriva con una carriera già avviata deve poter entrare al posto suo. */
    const chiesto = nInt(b.stream, 0, 5e7, 0);
    const tetto = a.ultimo ? Math.max(2500, Math.round(a.stream * 5)) : 250000;
    const limato = chiesto > tetto;
    a.stream = limato ? tetto : chiesto;
    a.fan = nInt(b.fan, 0, 5e7, a.fan);
    a.livello = nInt(b.livello, 1, 60, a.livello);
    a.fase = nInt(b.fase, 0, 8, a.fase);
    a.uscite = nInt(b.uscite, 0, 5000, a.uscite);
    a.deal = b.deal == null ? a.deal : !!b.deal;
    if(b.ultima != null) a.ultima = nomePulito(b.ultima) || a.ultima;
    if(b.seed != null) a.seed = nInt(b.seed, 0, 2e9, a.seed);
    a.ultimo = Date.now();

    archivio.posizioni(DATI, false);
    archivio.salva(DATI, CFG.file);
    return invia(res, 200, {
      ok: true, pos: a.pos, delta: a.posPrec ? a.posPrec - a.pos : null,
      totale: Object.keys(DATI.artisti).length, settimana: DATI.settimana, limato
    });
  }

  /* la classifica: una fetta qualsiasi, dalla top 10 alla top 1000 */
  if(req.method === "GET" && p === "/api/classifica"){
    const io = String(q.get("io") || "");
    const da = nInt(q.get("da"), 1, 100000, 1);
    const quanti = nInt(q.get("quanti"), 1, 200, 10);
    const lista = archivio.ordinati(DATI);
    const mio = io && DATI.artisti[io] ? riga(DATI.artisti[io], io) : null;
    return invia(res, 200, {
      settimana: DATI.settimana, totale: lista.length, prossimoGiro: DATI.prossimoGiro,
      righe: lista.slice(da - 1, da - 1 + quanti).map(a => riga(a, io)),
      io: mio
    });
  }

  /* la fetta intorno a te: quello che serve per «tu sei 428°, e sopra di te…» */
  const int = p.match(/^\/api\/classifica\/intorno\/([a-f0-9]{12})$/);
  if(req.method === "GET" && int){
    const a = DATI.artisti[int[1]];
    if(!a) return male(res, 404, "artista-sconosciuto");
    const raggio = nInt(q.get("raggio"), 1, 25, 4);
    const lista = archivio.ordinati(DATI);
    const i = lista.indexOf(a);
    const da = Math.max(0, i - raggio);
    return invia(res, 200, {
      settimana: DATI.settimana, totale: lista.length,
      righe: lista.slice(da, i + raggio + 1).map(x => riga(x, a.id)), io: riga(a, a.id)
    });
  }

  /* le notizie del giro: chi è uscito, chi ha firmato, chi è sparito */
  if(req.method === "GET" && p === "/api/notizie"){
    const quante = nInt(q.get("quante"), 1, 60, 10);
    return invia(res, 200, { settimana: DATI.settimana, notizie: (DATI.notizie || []).slice(0, quante) });
  }

  /* far passare una settimana a mano: serve solo per provare */
  if(req.method === "POST" && p === "/api/giro"){
    if(!CFG.admin || (req.headers["x-admin"] || "") !== CFG.admin) return male(res, 403, "non-sei-tu");
    const quante = archivio.giroSettimana(DATI, CFG);
    archivio.salva(DATI, CFG.file, true);
    return invia(res, 200, { ok: true, settimana: DATI.settimana, notizie: quante });
  }

  return male(res, 404, "rotta-sconosciuta");
}

/* ==================== IL SERVER ==================== */
const server = http.createServer((req, res) => {
  const origine = req.headers.origin || "";
  const permessa = CFG.origini === "*" ? "*"
    : (CFG.origini.split(",").map(s => s.trim()).indexOf(origine) >= 0 ? origine : "");
  if(permessa) res.setHeader("access-control-allow-origin", permessa);
  res.setHeader("vary", "origin");

  if(req.method === "OPTIONS"){
    res.writeHead(204, {
      "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
      "access-control-allow-headers": "content-type, x-chiave, x-admin",
      "access-control-max-age": "86400"
    });
    return res.end();
  }

  const ip = (req.socket.remoteAddress || "?");
  if(troppe(ip)) return male(res, 429, "troppe-richieste");

  let url;
  try{ url = new URL(req.url, "http://" + (req.headers.host || "localhost")); }
  catch(e){ return male(res, 400, "url-non-valido"); }

  archivio.assicuraSettimana(DATI, CFG);

  rotta(req, res, url).catch(e => {
    if(res.headersSent) return;
    male(res, e && /json|corpo/.test(e.message) ? 400 : 500, e ? e.message : "errore");
  });
});

server.listen(CFG.porta, () => {
  const tutti = Object.values(DATI.artisti);
  console.log("Anni di Fame — classifica su http://localhost:" + CFG.porta);
  console.log("  archivio:   " + CFG.file);
  console.log("  in pista:   " + tutti.length + " artisti (" + tutti.filter(a => !a.bot).length + " giocatori veri)");
  console.log("  settimana:  " + DATI.settimana + ", la prossima fra " +
    Math.max(0, Math.round((DATI.prossimoGiro - Date.now()) / 60000)) + " minuti");
});

for(const segnale of ["SIGINT", "SIGTERM"]){
  process.on(segnale, () => {
    archivio.salva(DATI, CFG.file, true);
    console.log("\nsalvato. alla prossima.");
    process.exit(0);
  });
}
