#!/usr/bin/env node
/**
 * Il promemoria del giro sul telefono. Gira all'apertura di una sessione
 * (hook SessionStart) ma parla di rado: solo se l'interfaccia e' cambiata
 * dall'ultimo giro, e comunque non piu' di una volta ogni GIORNI giorni.
 *
 *   node scripts/promemoria-telefono.js          → dice cosa farebbe, senza segnare niente
 *   node scripts/promemoria-telefono.js --hook   → muto quando non e' il momento; altrimenti
 *                                                  stampa il JSON e segna la data
 *   node scripts/promemoria-telefono.js --fatto  → segna adesso come "giro fatto"
 *
 * Per farlo parlare piu' o meno spesso si cambia GIORNI qui sotto.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const GIORNI = 1;                       // ogni quanto, al massimo, puo' farsi vivo
const GUARDA = ["frontend/css", "frontend/js", "frontend/index.html"];  // cos'e' "l'interfaccia"

const RADICE = path.resolve(__dirname, "..");
const STATO = path.join(RADICE, ".claude", "stato-agenti.json");
const modo = process.argv[2] || "";

const git = (...args) => {
  try { return execFileSync("git", args, { cwd: RADICE, encoding: "utf8" }).trim(); }
  catch { return ""; }
};

const leggiStato = () => { try { return JSON.parse(fs.readFileSync(STATO, "utf8")); } catch { return {}; } };
const scriviStato = s => {
  fs.mkdirSync(path.dirname(STATO), { recursive: true });
  fs.writeFileSync(STATO, JSON.stringify(s, null, 2) + "\n");
};

const stato = leggiStato();
const tel = stato.telefono || {};

// Com'e' messa l'interfaccia adesso: l'ultimo commit che l'ha toccata,
// piu' le modifiche non ancora committate.
const ultimoCommit = git("log", "-1", "--format=%H", "--", ...GUARDA);
const sporco = git("status", "--porcelain", "--", ...GUARDA);
const impronta = ultimoCommit + (sporco ? "+lavoro-in-corso" : "");

const cambiata = impronta !== tel.impronta;
const giorniPassati = tel.quando ? (Date.now() - Date.parse(tel.quando)) / 86400000 : Infinity;
const eOra = cambiata && giorniPassati >= GIORNI;

if (modo === "--fatto") {
  scriviStato({ ...stato, telefono: { impronta, quando: new Date().toISOString() } });
  console.log("Segnato: giro sul telefono fatto adesso.");
  process.exit(0);
}

if (!eOra) {
  if (modo !== "--hook") {
    console.log(
      "Niente promemoria: " +
      (!cambiata ? "l'interfaccia non e' cambiata dall'ultimo giro."
                 : `l'ultimo promemoria e' di ${giorniPassati.toFixed(1)} giorni fa (soglia: ${GIORNI}).`)
    );
  }
  process.exit(0);
}

const quante = git("diff", "--name-only", tel.impronta ? tel.impronta.replace("+lavoro-in-corso", "") : "HEAD~5",
                   "HEAD", "--", ...GUARDA).split("\n").filter(Boolean).length;

const avviso =
  "L'interfaccia del gioco e' cambiata dall'ultimo giro sul telefono" +
  (quante ? ` (${quante} file toccati)` : "") + ".\n" +
  "Se la sessione riguarda il frontend, proponi in una riga l'agente `prova-sul-telefono` " +
  "(`.claude/agents/prova-sul-telefono.md`): apre il gioco a misura di telefono e segna cosa si rompe. " +
  "Se l'utente sta facendo altro, lascia perdere e non tornarci sopra.";

if (modo === "--hook") {
  scriviStato({ ...stato, telefono: { impronta, quando: new Date().toISOString() } });
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: avviso },
    suppressOutput: true
  }));
  process.exit(0);
}

console.log(avviso);
