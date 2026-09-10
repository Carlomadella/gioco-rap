#!/usr/bin/env node
/**
 * Il giro di controllo di fine task. Gira dopo ogni `git commit` (hook
 * PostToolUse) e non fa il controllo lui: sveglia i due agenti che lo fanno,
 * `segnala-problemi` e `backend-allineato`.
 *
 *   node scripts/dopo-la-task.js          → dice cosa direbbe, senza segnare niente
 *   node scripts/dopo-la-task.js --hook   → muto se non c'e' niente da dire; altrimenti
 *                                           stampa il JSON che sveglia gli agenti
 *
 * Parla una volta sola per commit: il commit gia' annunciato sta nel file di
 * stato, cosi' due comandi di fila non fanno il doppio giro. Non tocca il
 * codice e non lancia niente da solo.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RADICE = path.resolve(__dirname, "..");
const STATO = path.join(RADICE, ".claude", "stato-agenti.json");
const soloHook = process.argv.includes("--hook");

const git = (...args) => {
  try { return execFileSync("git", args, { cwd: RADICE, encoding: "utf8" }).trim(); }
  catch { return ""; }
};

const leggiStato = () => { try { return JSON.parse(fs.readFileSync(STATO, "utf8")); } catch { return {}; } };
const scriviStato = s => {
  fs.mkdirSync(path.dirname(STATO), { recursive: true });
  fs.writeFileSync(STATO, JSON.stringify(s, null, 2) + "\n");
};

const zitto = () => process.exit(0);

// 1. Il comando che ha appena girato: solo i commit veri ci interessano.
//    (`git commit` e basta; non `git log`, non `git commit --dry-run`.)
function comandoDaStdin() {
  let grezzo = "";
  try { grezzo = fs.readFileSync(0, "utf8"); } catch { return ""; }
  try {
    const dati = JSON.parse(grezzo);
    return (dati.tool_input && dati.tool_input.command) || "";
  } catch { return ""; }
}

if (soloHook) {
  const comando = comandoDaStdin();
  if (!/\bgit\s+commit\b/.test(comando) || /--dry-run/.test(comando)) zitto();
}

// 2. Il commit dev'essere davvero entrato, e non dev'essere gia' stato annunciato.
const stato = leggiStato();
const fine = stato.dopoLaTask || {};
const testa = git("rev-parse", "HEAD");
if (!testa) zitto();
if (soloHook && fine.ultimoCommit === testa) zitto();

// 3. Cos'ha toccato: serve agli agenti per sapere dove guardare.
const toccati = git("show", "--name-only", "--format=", testa).split("\n").filter(Boolean);
const soloRegistro = toccati.length > 0 && toccati.every(f => f.startsWith("registro-modifiche/"));
if (soloHook && soloRegistro) zitto();   // il registro lo scrive il bot: non e' una task

const backend = toccati.filter(f => f.startsWith("backend/"));
const titolo = git("log", "-1", "--format=%s", testa);

const avviso =
  "Task committata (" + testa.slice(0, 7) + " — " + titolo + "), " + toccati.length +
  (toccati.length === 1 ? " file toccato" : " file toccati") +
  (backend.length ? ", di cui " + backend.length + " nel backend" : "") + ".\n" +
  "Prima di pushare fai il giro di fine task, come dice `documentazione/come-si-lavora.md`:\n" +
  "1. l'agente `segnala-problemi` (`.claude/agents/segnala-problemi.md`) — cerca cosa si e' rotto e lo scrive in `documentazione/problemi-riscontrati.md`;\n" +
  "2. l'agente `backend-allineato` (`.claude/agents/backend-allineato.md`)" +
  (backend.length ? " — questa task ha toccato il backend, quindi serve." :
                    " — qui il backend non e' stato toccato: se il giro precedente era pulito puoi dirlo in una riga e saltarlo.") + "\n" +
  "Lanciali insieme, non uno alla volta. Quello che trovano si sistema adesso, non dopo il push. " +
  "Se l'utente ha detto di lasciar perdere, lascia perdere e non tornarci sopra.";

if (soloHook) {
  scriviStato({ ...stato, dopoLaTask: { ultimoCommit: testa, quando: new Date().toISOString() } });
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: avviso },
    suppressOutput: true
  }));
  process.exit(0);
}

console.log(avviso);
