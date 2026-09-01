/* Quanto regge, con i numeri.

     npm run carico            → 20.000 artisti
     node carico.js 100000     → centomila

   Nei README c'è scritto che SQLite basta finché i server sono uno solo. È una
   frase che vale zero se nessuno l'ha misurata: questo la misura. Fa un
   database usa e getta, ci mette dentro N artisti, e cronometra le cose che il
   server fa davvero — la top 10, la top 100, la fetta intorno a te, un
   punteggio, un giro di settimana intero.

   Da rifare quando si cambia una query o si aggiunge un indice: se un numero
   qui triplica, l'ha rotto l'ultima modifica. */
"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const archivio = require("./database/archivio.js");
const { popolazione } = require("./bot.js");

const QUANTI = Math.max(100, Number(process.argv[2] || 20000));
const FILE = path.join(os.tmpdir(), "adf-carico-" + Date.now() + ".db");

const cronometra = (cosa, quante, f) => {
  const via = process.hrtime.bigint();
  let ultimo;
  for(let i = 0; i < quante; i++) ultimo = f(i);
  const ms = Number(process.hrtime.bigint() - via) / 1e6;
  const per = ms / quante;
  console.log("  " + cosa.padEnd(38) +
    per.toFixed(2).padStart(8) + " ms" +
    (quante > 1 ? "   (media su " + quante + ")" : "") +
    (per > 50 ? "   ← lento" : ""));
  return ultimo;
};

console.log("\nCarico: " + QUANTI.toLocaleString("it-IT") + " artisti\n");

const via = Date.now();
const A = archivio.apri({ file: FILE, quantiBot: 0, settimanaMs: 24 * 3600e3 });

/* Come è fatto il mondo davvero: i bot restano quelli di `ADF_BOT` (140), il
   resto sono **giocatori**. È una differenza che conta nel giro di settimana:
   i bot si aggiornano uno per uno perché ognuno ha la sua storia, i giocatori
   no — loro mandano il punteggio da soli.

   Si riempie a blocchi dentro a una transazione sola: inserire centomila righe
   una per una, ognuna con la sua transazione, è il modo per farci mettere
   dieci minuti invece di dieci secondi. */
const QUANTI_BOT = Math.min(QUANTI, Number(process.env.ADF_BOT || 140));
const usati = new Set();
let messi = 0, numero = 1;      // i nomi devono restare unici anche a centomila
while(messi < QUANTI){
  const blocco = Math.min(2000, QUANTI - messi);
  A.insieme(() => {
    for(const b of popolazione(blocco, usati)){
      const eBot = messi + (numero % blocco) < QUANTI_BOT;
      A.fai(`INSERT INTO artista (id, bot, nome, citta, genere, storia, seed, stream, uscite, deal,
               ultima_titolo, ultima_seed, creato, punteggio) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        /* il nome deve restare sotto i 22 caratteri come nel gioco vero, ma
           qui ne servono ventimila diversi: si tronca e si numera */
        b.id, eBot ? 1 : 0,
        (b.nome.slice(0, 10) + " " + (messi + numero++).toString(36)).slice(0, 22),
        b.citta, b.genere, b.storia,
        b.seed, Math.round(b.stream), b.uscite, b.deal ? 1 : 0, b.ultima, b.seed, b.creato,
        eBot ? null : Date.now());
      if(eBot) A.fai("INSERT INTO bot_stato (artista_id, slancio, caldo, carattere) VALUES (?,0,0,?)",
        b.id, b.carattere);
    }
  });
  messi += blocco;
  if(messi % 10000 === 0) console.log("  ...messi " + messi.toLocaleString("it-IT"));
}
console.log("  riempito in " + ((Date.now() - via) / 1000).toFixed(1) + " s" +
  "  (" + QUANTI_BOT + " bot, il resto giocatori)");
console.log("  il file pesa " + (fs.statSync(FILE).size / 1024 / 1024).toFixed(1) + " MB\n");

/* un giocatore vero in mezzo, per misurare le cose che riguardano lui */
const acc = archivio.creaAccount({ tipo: "ospite", idEsterno: "carico" });
const io = archivio.iscriviArtista({ accountId: acc.id, nome: "Quello Della Prova",
  citta: "Rovereto", genere: "trap", seed: 1 });
archivio.segnaPunteggio(io.id, { stream: 40000, fan: 2500, livello: 8, uscite: 4 });

console.log("le cose che il server fa a ogni richiesta:");
cronometra("la top 10", 20, () => archivio.classifica(1, 10, null));
cronometra("la top 100", 20, () => archivio.classifica(1, 100, null));
cronometra("la top 100 con la mia riga", 20, () => archivio.classifica(1, 100, io.id));
cronometra("la fetta 5000-5100", 20, () => archivio.classifica(5000, 100, null));
cronometra("chi ho davanti e dietro", 20, () => archivio.intorno(io.id, 4));
cronometra("la classifica della mia città", 20, () => archivio.classifica(1, 50, io.id, { citta: "Rovereto" }));
cronometra("un punteggio (con i traguardi)", 10, i =>
  archivio.segnaPunteggio(io.id, { stream: 40000 + i * 100, fan: 2500, livello: 8, uscite: 4 }));
cronometra("il feed del telefono", 10, () => archivio.feed(io.id, 20));
cronometra("gli opps", 10, () => archivio.opps(io.id, 3));

console.log("\nle cose che fa una volta ogni tanto:");
cronometra("un giro di settimana intero", 1, () => archivio.giroSettimana());
cronometra("un secondo giro", 1, () => archivio.giroSettimana());

const stato = archivio.stato();
console.log("\nin pista: " + stato.artisti.toLocaleString("it-IT") + " artisti, settimana " + stato.settimana);
console.log("il file adesso pesa " + (fs.statSync(FILE).size / 1024 / 1024).toFixed(1) + " MB");

archivio.chiudi();
for(const f of [FILE, FILE + "-wal", FILE + "-shm"]) try{ fs.unlinkSync(f); }catch(e){}
console.log("\n(database di prova buttato)\n");
