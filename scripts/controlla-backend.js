#!/usr/bin/env node
/**
 * Controllo secco dell'allineamento del backend. Gira a ogni messaggio (hook
 * UserPromptSubmit), quindi deve costare niente: legge quattro file e confronta.
 *
 *   node scripts/controlla-backend.js          → rapporto leggibile, esce 1 se c'e' scarto
 *   node scripts/controlla-backend.js --hook   → muto se e' tutto a posto; altrimenti
 *                                                stampa il JSON che sveglia l'agente
 *
 * Non sistema niente e non tocca nessun file: guarda e riferisce.
 */

const fs = require("fs");
const path = require("path");

const RADICE = path.resolve(__dirname, "..");
const BE = path.join(RADICE, "backend");
const soloHook = process.argv.includes("--hook");

const leggi = f => { try { return fs.readFileSync(f, "utf8"); } catch { return null; } };
const elenca = d => { try { return fs.readdirSync(d).filter(f => f.endsWith(".sql")).sort(); } catch { return null; } };

// I nomi dei parametri non contano: /api/artista/:id e /api/artista/<uuid> sono la stessa rotta.
const normalizza = p => p
  .replace(/\[0-9a-f\]\{8\}-[^"]*\{12\}/g, ":x")   // la costante UUID srotolata
  .replace(/\[123\]/g, ":x")                        // /api/carriera/[123]
  .replace(/:[A-Za-z]+/g, ":x")
  .replace(/<[^>]+>/g, ":x")
  .replace(/\/+$/, "");

function rotteDelServer(src) {
  // if(M("GET", "/api/stato")) — e la forma con la costante: "/api/artista/" + UUID
  const UUID = (src.match(/const UUID = "([^"]+)"/) || [])[1] || "";
  const trovate = new Set();
  const re = /M\(\s*"(GET|POST|PUT|DELETE|PATCH)"\s*,\s*"([^"]*)"\s*(\+\s*UUID)?\s*\)/g;
  let m;
  while ((m = re.exec(src))) trovate.add(m[1] + " " + normalizza(m[2] + (m[3] ? UUID : "")));
  return trovate;
}

function rotteDelDocumento(src) {
  const trovate = new Set();
  const re = /`(GET|POST|PUT|DELETE|PATCH)\s+(\/api\/[^`?\s]*)/g;
  let m;
  while ((m = re.exec(src))) trovate.add(m[1] + " " + normalizza(m[2]));
  return trovate;
}

const tabelle = src => new Set(
  [...src.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?([a-z_]+)/gi)].map(m => m[1].toLowerCase())
);

const menoDi = (a, b) => [...a].filter(v => !b.has(v)).sort();

const problemi = [];
const segnala = (titolo, righe) => problemi.push({ titolo, righe });

// 1. Le rotte che il server ha davvero, contro quelle che il documento promette.
const server = leggi(path.join(BE, "server.js"));
const apiDoc = leggi(path.join(BE, "README-API.md"));
if (server && apiDoc) {
  const vere = rotteDelServer(server);
  const scritte = rotteDelDocumento(apiDoc);
  const nonScritte = menoDi(vere, scritte);
  const inventate = menoDi(scritte, vere);
  if (nonScritte.length)
    segnala("rotte che il server ha ma README-API.md non racconta", nonScritte);
  if (inventate.length)
    segnala("rotte scritte in README-API.md che il server non ha (piu')", inventate);
}

// 2. Le due serie di migrazioni devono raccontare lo stesso schema.
const sq = elenca(path.join(BE, "database", "migrazioni"));
const pg = elenca(path.join(BE, "database", "migrazioni-pg"));
if (sq && pg) {
  const soloSq = sq.filter(f => !pg.includes(f));
  const soloPg = pg.filter(f => !sq.includes(f));
  if (soloSq.length) segnala("migrazioni SQLite senza la gemella PostgreSQL", soloSq);
  if (soloPg.length) segnala("migrazioni PostgreSQL senza la gemella SQLite", soloPg);

  const tabSq = tabelle(sq.map(f => leggi(path.join(BE, "database", "migrazioni", f))).join("\n"));
  const tabPg = tabelle(pg.map(f => leggi(path.join(BE, "database", "migrazioni-pg", f))).join("\n"));
  const mancaPg = menoDi(tabSq, tabPg);
  const mancaSq = menoDi(tabPg, tabSq);
  if (mancaPg.length) segnala("tabelle che esistono solo in SQLite", mancaPg);
  if (mancaSq.length) segnala("tabelle che esistono solo in PostgreSQL", mancaSq);

  // 3. schema.md e' il disegno: se non conosce una tabella vera, e' rimasto indietro.
  //    Dal 13/09/2026 sta in git, quindi c'e' su tutte le macchine e questo controllo
  //    guarda davvero qualcosa dappertutto. La lettura difensiva resta per le copie
  //    vecchie, dove il file non c'era.
  const schema = leggi(path.join(BE, "database", "schema.md"));
  if (schema) {
    const ignote = menoDi(tabSq, tabelle(schema));
    if (ignote.length) segnala("tabelle vere che schema.md non conosce", ignote);
  }
}

// 4. Le manopole che il codice legge davvero, contro quelle che il README elenca.
//    Il 13/09/2026 ne mancavano sei su ventiquattro: tre indirizzi che si cambiano
//    per provare senza uscire in rete, le due della manutenzione e quella della
//    prova. Chi mette su il server le cerca li' e non le trova.
const fontiEnv = ["server.js", "accessi.js", "prova.js", "risposte.js", "ambiente.js", "carico.js"]
  .map(n => leggi(path.join(BE, n)))
  .filter(Boolean)
  .join(" ");
const readmeBe = leggi(path.join(BE, "README.md"));
if (fontiEnv && readmeBe) {
  const usate = new Set(fontiEnv.match(/ADF_[A-Z_]+/g) || []);
  const scritte = new Set(readmeBe.match(/ADF_[A-Z_]+/g) || []);
  const senzaRiga = menoDi(usate, scritte);
  if (senzaRiga.length)
    segnala("manopole che il codice legge ma backend/README.md non elenca", senzaRiga);
}

if (!problemi.length) {
  if (!soloHook) console.log("Backend allineato: rotte, migrazioni e schema si raccontano la stessa storia.");
  process.exit(0);
}

const corpo = problemi.map(p => "- " + p.titolo + ": " + p.righe.join(", ")).join("\n");

if (soloHook) {
  const avviso =
    "Il controllo automatico del backend ha trovato uno scarto fra codice e documenti:\n" + corpo +
    "\n\nSe l'utente sta lavorando al backend, dillo in una riga e proponi l'agente `backend-allineato`" +
    " (`.claude/agents/backend-allineato.md`) per il giro completo. Se sta facendo altro, non interromperlo:" +
    " non e' una cosa che blocca la partita.";
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: avviso },
    suppressOutput: true
  }));
  process.exit(0);
}

console.log("Backend disallineato:\n" + corpo);
process.exit(1);
