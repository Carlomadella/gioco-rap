/* Il database: quale motore, e le migrazioni.

   Sotto ci possono stare due cose, e il resto del server non sa quale:

   - **SQLite** (`sqlite.js`), di suo: un file, niente da installare, niente da
     mandare avanti. È quello che gira in casa e su un server solo.
   - **PostgreSQL** (`postgres.js`), se c'è `ADF_PG`: il gradino per quando i
     server diventano più di uno, perché un file non lo si condivide fra due
     macchine.

         ADF_PG=postgresql://utente:password@127.0.0.1:5432/anni_di_fame npm start

   Le due facce sono identiche — `uno`, `tutti`, `fai`, `insieme` — e sono
   **asincrone tutte e due**. Su SQLite non servirebbe; è il prezzo, piccolo,
   perché `archivio.js` sia uno solo invece che due.

   Le migrazioni sono file `.sql` numerati, si applicano in ordine di nome, una
   volta sola, ognuna dentro a una transazione; il conto lo tiene la tabella
   `migrazione`. Ogni motore ha la sua cartella (`migrazioni/` per SQLite,
   `migrazioni-pg/` per PostgreSQL) perché il DDL non è lo stesso: chiavi che si
   contano da sole, tipi, e le funzioni negli indici si scrivono diverso. Il
   **numero e il nome** dei file però combaciano, così è sempre chiaro se i due
   schemi sono allineati — e `prova.js` lo controlla. */
"use strict";

const fs = require("fs");
const path = require("path");

/* Torna il motore aperto, senza migrazioni: le mette `apri()`. */
function scegliMotore(cfg){
  const url = (cfg && cfg.pg) || process.env.ADF_PG || "";
  if(url){
    const { motorePostgres } = require("./postgres.js");
    return { motore: motorePostgres(url), migrazioni: path.join(__dirname, "migrazioni-pg") };
  }
  const { motoreSqlite } = require("./sqlite.js");
  return { motore: motoreSqlite(cfg && cfg.file), migrazioni: path.join(__dirname, "migrazioni") };
}

async function migra(M, cartella){
  await M.esegui(`CREATE TABLE IF NOT EXISTS migrazione (
    nome TEXT PRIMARY KEY, applicata BIGINT NOT NULL )`);
  const fatte = new Set((await M.tutti("SELECT nome FROM migrazione")).map(r => r.nome));
  const file = fs.existsSync(cartella)
    ? fs.readdirSync(cartella).filter(f => f.endsWith(".sql")).sort() : [];
  for(const f of file){
    if(fatte.has(f)) continue;
    const sql = fs.readFileSync(path.join(cartella, f), "utf8");
    try{
      await M.insieme(async () => {
        await M.esegui(sql);
        await M.fai("INSERT INTO migrazione (nome, applicata) VALUES (?, ?)", f, Date.now());
      });
      console.log("[db] migrazione " + f);
    }catch(e){
      throw new Error("la migrazione " + f + " non è passata: " + e.message);
    }
  }
}

async function apri(cfg){
  const { motore, migrazioni } = scegliMotore(cfg);
  await migra(motore, migrazioni);
  return motore;
}

module.exports = { apri, scegliMotore };
