#!/usr/bin/env node
/**
 * Salva i punti nuovi scritti nei fogli di implementazioni/ — da main, senza
 * aprire un branch per una riga.
 *
 *   node scripts/salva-punti.js                 → committa e pusha i fogli cambiati
 *   node scripts/salva-punti.js "due punti ALE" → idem, con quella frase nel commit
 *   node scripts/salva-punti.js --prova         → dice cosa farebbe e si ferma
 *
 * Cosa fa, in ordine:
 *   1. guarda cosa e' cambiato: prende SOLO i .md dentro a implementazioni/;
 *      il resto (codice, .gitignore, foto) non lo tocca e lo dice;
 *   2. li committa con «docs(implementazioni): ...»;
 *   3. se altri file sono modificati li mette da parte (git stash) il tempo
 *      del push, perche' il pre-push vuole la cartella pulita, e poi li rimette;
 *   4. pusha. Il pre-push, per un commit di soli fogli, fa girare l'audit e
 *      non la verifica intera.
 *
 * Su un branch di task funziona uguale (committa e pusha li'). Il pre-commit
 * e il pre-push lasciano passare su main solo i .md di implementazioni/ e il
 * registro: e' la regola in CLAUDE.md, «Mai lavorare su main», con la sua
 * unica eccezione.
 */

const { execFileSync, spawnSync } = require("child_process");
const path = require("path");

const RADICE = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const prova = args.includes("--prova");
const frase = args.filter(a => !a.startsWith("--")).join(" ").trim();

const git = (...a) => execFileSync("git", a, { cwd: RADICE, encoding: "utf8" }).trim();
const gitVivo = (...a) => spawnSync("git", a, { cwd: RADICE, stdio: "inherit" }).status === 0;
const FOGLIO = /^implementazioni\/.*\.md$/;

/* niente trim() qui: la prima riga comincia con uno spazio che conta (« M file») */
const stato = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: RADICE, encoding: "utf8" })
  .split(/\r?\n/).filter(Boolean)
  .map(r => ({ segno: r.slice(0, 2), file: r.slice(3).replace(/^"|"$/g, "").replace(/\\/g, "/") }));

const fogli = stato.filter(r => FOGLIO.test(r.file)).map(r => r.file);
const altri = stato.filter(r => !FOGLIO.test(r.file)).map(r => r.file);

if (!fogli.length) {
  console.log("Nessun foglio cambiato in implementazioni/: niente da salvare.");
  if (altri.length) console.log("(Modificati ma non miei: " + altri.join(", ") + " — quelli passano da un branch di task.)");
  process.exit(0);
}

const branch = git("branch", "--show-current");
const oggi = new Date();
const data = [oggi.getDate(), oggi.getMonth() + 1].map(n => String(n).padStart(2, "0")).join("/") + "/" + oggi.getFullYear();
const messaggio = "docs(implementazioni): " + (frase || "punti nuovi del " + data);

console.log("Fogli da salvare (" + branch + "):\n  " + fogli.join("\n  "));
if (altri.length) console.log("Restano fuori, messi da parte solo per il push:\n  " + altri.join("\n  "));
console.log("Commit: " + messaggio);
if (prova) { console.log("\n(--prova: mi fermo qui)"); process.exit(0); }

if (!gitVivo("add", "--", ...fogli)) process.exit(1);
if (!gitVivo("commit", "-m", messaggio)) process.exit(1);

let messiDaParte = false;
if (altri.length) {
  /* il pre-push vuole la cartella pulita: i file che non sono fogli vanno
     da parte il tempo del push, e tornano subito dopo — anche se il push fallisce */
  messiDaParte = gitVivo("stash", "push", "--include-untracked", "-m", "salva-punti: da parte per il push", "--", ...altri);
  if (!messiDaParte) { console.error("Non riesco a mettere da parte gli altri file: il commit c'e', il push lo fai a mano."); process.exit(1); }
}

let spinto = false;
try {
  spinto = gitVivo("push", "-u", "origin", branch);
} finally {
  if (messiDaParte) {
    if (!gitVivo("stash", "pop")) console.error("\nAttenzione: i file messi da parte non sono tornati da soli — `git stash pop` a mano.");
  }
}

if (!spinto) {
  console.error("\nIl commit c'e' (" + git("rev-parse", "--short", "HEAD") + ") ma il push no: leggi sopra cosa dice il gate, poi `git push`.");
  process.exit(1);
}
console.log("\nSalvato e pushato: " + git("rev-parse", "--short", "HEAD") + " su " + branch + ".");
