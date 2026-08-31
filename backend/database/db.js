/* Il database: apertura, migrazioni, e gli attrezzi per interrogarlo.

   SQLite dentro a Node (`node:sqlite`): nessuna dipendenza da installare,
   nessun servizio da mandare avanti, un file solo sul disco. È il gradino
   giusto adesso che ci sono gli account e i salvataggi; il gradino dopo è
   PostgreSQL, e le differenze sono cinque righe (`schema.md`).

   Le migrazioni sono file `.sql` numerati in `migrazioni/`: si applicano in
   ordine di nome, una volta sola, dentro a una transazione. Niente ORM, niente
   strumenti: file SQL e una tabella che tiene il conto. */
"use strict";

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const MIGRAZIONI = path.join(__dirname, "migrazioni");

function apri(percorso){
  fs.mkdirSync(path.dirname(percorso), { recursive: true });
  const db = new DatabaseSync(percorso);
  /* WAL: si legge mentre si scrive, e un'interruzione non lascia il file a metà.
     foreign_keys: se non lo accendi, SQLite si scorda le chiavi esterne. */
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA busy_timeout = 5000");
  migra(db);
  return db;
}

function migra(db){
  db.exec(`CREATE TABLE IF NOT EXISTS migrazione (
    nome TEXT PRIMARY KEY, applicata INTEGER NOT NULL )`);
  const fatte = new Set(db.prepare("SELECT nome FROM migrazione").all().map(r => r.nome));
  const file = fs.existsSync(MIGRAZIONI)
    ? fs.readdirSync(MIGRAZIONI).filter(f => f.endsWith(".sql")).sort() : [];
  for(const f of file){
    if(fatte.has(f)) continue;
    const sql = fs.readFileSync(path.join(MIGRAZIONI, f), "utf8");
    db.exec("BEGIN");
    try{
      db.exec(sql);
      db.prepare("INSERT INTO migrazione (nome, applicata) VALUES (?, ?)").run(f, Date.now());
      db.exec("COMMIT");
      console.log("[db] migrazione " + f);
    }catch(e){
      db.exec("ROLLBACK");
      throw new Error("la migrazione " + f + " non è passata: " + e.message);
    }
  }
}

/* Le query si preparano una volta sola e si riusano: è la differenza fra un
   database che regge diecimila richieste e uno che arranca. */
function attrezzi(db){
  const preparate = new Map();
  const q = sql => {
    let p = preparate.get(sql);
    if(!p){ p = db.prepare(sql); preparate.set(sql, p); }
    return p;
  };
  return {
    db,
    uno: (sql, ...v) => q(sql).get(...v),
    tutti: (sql, ...v) => q(sql).all(...v),
    fai: (sql, ...v) => q(sql).run(...v),
    /* una transazione: o tutto o niente. Le usiamo per il giro di settimana e
       per la cancellazione di un account, dove lasciare le cose a metà sarebbe
       peggio che non farle. */
    insieme(f){
      db.exec("BEGIN");
      try{ const r = f(); db.exec("COMMIT"); return r; }
      catch(e){ try{ db.exec("ROLLBACK"); }catch(e2){} throw e; }
    },
    chiudi(){ preparate.clear(); db.close(); }
  };
}

module.exports = { apri, attrezzi };
