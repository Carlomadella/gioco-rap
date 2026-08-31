/* La copia di sicurezza del database.

     npm run copia                    → dati/copie/classifica-2026-09-01.db
     node database/copia.js <db> <dove>

   Si può dare **a server acceso**: `VACUUM INTO` fa una copia coerente da sé,
   senza fermare niente e senza portarsi dietro il file `-wal`. Copiare il
   database a mano mentre il server scrive, invece, è il modo migliore per
   ritrovarsi una copia rotta il giorno che serve.

   Da mettere in un lavoro notturno appena il server sta su una macchina vera:
   con dentro gli account e i salvataggi della gente, questa è la cosa più
   importante di tutto il backend. E il ripristino va **provato**, non solo
   fatto: una copia che nessuno ha mai rimesso a posto non è una copia. */
"use strict";

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DA = process.argv[2] || path.join(__dirname, "dati", "classifica.db");
const oggi = new Date().toISOString().slice(0, 10);
const DOVE = process.argv[3] || path.join(__dirname, "dati", "copie", "classifica-" + oggi + ".db");
const QUANTE = Math.max(1, Number(process.env.ADF_COPIE || 30));

if(!fs.existsSync(DA)){
  console.error("non c'è niente da copiare: " + DA);
  process.exit(1);
}

fs.mkdirSync(path.dirname(DOVE), { recursive: true });
fs.rmSync(DOVE, { force: true });

const db = new DatabaseSync(DA, { readOnly: true });
db.exec("VACUUM INTO '" + DOVE.replace(/'/g, "''") + "'");
db.close();

/* due conti veloci sulla copia appena fatta: se non si apre o è vuota, meglio
   saperlo adesso che fra sei mesi */
const copia = new DatabaseSync(DOVE, { readOnly: true });
const artisti = copia.prepare("SELECT count(*) n FROM artista").get().n;
const account = copia.prepare("SELECT count(*) n FROM account").get().n;
const carriere = copia.prepare("SELECT count(*) n FROM carriera").get().n;
copia.close();

console.log("copiato " + DA);
console.log("     in " + DOVE + " (" + (fs.statSync(DOVE).size / 1024).toFixed(0) + " KB)");
console.log("  dentro: " + artisti + " artisti, " + account + " account, " + carriere + " carriere");

/* si tengono le ultime ADF_COPIE (di suo trenta) */
const cartella = path.dirname(DOVE);
const vecchie = fs.readdirSync(cartella)
  .filter(f => f.startsWith("classifica-") && f.endsWith(".db")).sort().reverse();
for(const f of vecchie.slice(QUANTE)){
  fs.rmSync(path.join(cartella, f), { force: true });
  console.log("  buttata la copia vecchia " + f);
}
