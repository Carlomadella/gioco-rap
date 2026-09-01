/* Il motore SQLite.

   SQLite dentro a Node (`node:sqlite`): nessuna dipendenza da installare,
   nessun servizio da mandare avanti, un file solo sul disco. È quello che gira
   in casa e su un server solo.

   **Qui sotto è tutto sincrono, sopra è asincrono.** Non è uno spreco: è la
   forma che serve perché `archivio.js` non debba sapere che database ha sotto.
   Le promesse si risolvono subito, quindi non si paga niente in velocità.

   L'unica cosa che questa cornice deve aggiungere davvero è **la fila davanti
   alle transazioni**, e il motivo sta scritto sopra a `insieme()`. */
"use strict";

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

function motoreSqlite(percorso){
  fs.mkdirSync(path.dirname(percorso), { recursive: true });
  const db = new DatabaseSync(percorso);
  /* WAL: si legge mentre si scrive, e un'interruzione non lascia il file a metà.
     foreign_keys: se non lo accendi, SQLite si scorda le chiavi esterne. */
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA busy_timeout = 5000");

  /* Le query si preparano una volta sola e si riusano: è la differenza fra un
     database che regge diecimila richieste e uno che arranca. */
  const preparate = new Map();
  const q = sql => {
    let p = preparate.get(sql);
    if(!p){ p = db.prepare(sql); preparate.set(sql, p); }
    return p;
  };

  /* La fila davanti alle transazioni.

     Prima che lo strato dati diventasse asincrono questa cosa non poteva
     succedere: una richiesta finiva prima che ne cominciasse un'altra. Adesso
     due richieste possono stare dentro a `insieme()` nello stesso momento, e
     SQLite ha **una sola** transazione per connessione: il BEGIN della seconda
     finirebbe dentro alla prima, e il primo COMMIT chiuderebbe tutto e due.
     Un giro di settimana e una cancellazione di account che si accavallano si
     scriverebbero a metà.

     Quindi si fa la fila. Costa niente — sotto è tutto sincrono e velocissimo —
     e toglie di mezzo una classe intera di guai. */
  let coda = Promise.resolve();

  const motore = {
    nome: "sqlite",
    db,
    async esegui(sql){ db.exec(sql); },
    async uno(sql, ...v){ const r = q(sql).get(...v); return r === undefined ? null : r; },
    async tutti(sql, ...v){ return q(sql).all(...v); },
    async fai(sql, ...v){ const r = q(sql).run(...v); return { righe: Number(r.changes || 0) }; },
    insieme(f){
      const mio = coda.then(async () => {
        db.exec("BEGIN");
        try{ const r = await f(); db.exec("COMMIT"); return r; }
        catch(e){ try{ db.exec("ROLLBACK"); }catch(e2){} throw e; }
      });
      /* la fila non si deve rompere se una transazione fallisce: chi viene dopo
         ha diritto al suo giro comunque */
      coda = mio.catch(() => {});
      return mio;
    },
    async chiudi(){ preparate.clear(); db.close(); }
  };
  return motore;
}

module.exports = { motoreSqlite };
