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
 *   1. guarda cosa e' cambiato: prende SOLO i .md di primo livello dentro a
 *      implementazioni/ (non implementazioni/auto/, che e' del bot); il resto
 *      (codice, .gitignore, foto) non lo tocca e lo dice;
 *   2. li committa con «docs(implementazioni): ...» — e SOLO loro: quello che
 *      era gia' in coda (`git add` di prima) resta in coda, non finisce dentro;
 *   3. se altri file sono modificati li mette da parte (git stash) il tempo
 *      del push, perche' il pre-push vuole la cartella pulita, e poi li rimette
 *      com'erano, anche in coda;
 *   4. pusha sul remoto del branch. Il pre-push, per un commit di soli fogli,
 *      fa girare l'audit e non la verifica intera.
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
/* la stessa eccezione dei due hook: i fogli di primo livello, non la cartella del bot */
const FOGLIO = /^implementazioni\/[^/]+\.md$/;

/* `-z`: un NUL fra una voce e l'altra e niente virgolette né escape ottali
   sui nomi con accenti o spazi (con `--porcelain` normale «città.md» usciva
   come "citt\303\240.md"). Per un rename (R/C) la voce e' seguita dal nome
   VECCHIO, che qui non serve e si salta. */
const grezzo = execFileSync("git", ["status", "--porcelain", "-z", "--untracked-files=all"], { cwd: RADICE, encoding: "utf8" });
const voci = grezzo.split("\0").filter(Boolean);
const stato = [];
for(let i = 0; i < voci.length; i++){
  const segno = voci[i].slice(0, 2), file = voci[i].slice(3);
  stato.push({ segno, file });
  if(/[RC]/.test(segno)) i++;                                  // il nome vecchio del rename
}

const fogli = stato.filter(r => FOGLIO.test(r.file)).map(r => r.file);
const altri = stato.filter(r => !FOGLIO.test(r.file)).map(r => r.file);

if (!fogli.length) {
  console.log("Nessun foglio cambiato in implementazioni/: niente da salvare.");
  if (altri.length) console.log("(Modificati ma non miei: " + altri.join(", ") + " — quelli passano da un branch di task.)");
  process.exit(0);
}

const branch = git("branch", "--show-current");
if (!branch) { console.error("Non sei su un branch (HEAD staccata): mettiti su main o su un task/… e riprova."); process.exit(1); }
let remoto = "";
try { remoto = git("config", "--get", "branch." + branch + ".remote"); } catch (_) {}
if (!remoto || remoto === ".") remoto = "origin";
let remotoEsiste = true;
try { git("remote", "get-url", remoto); } catch (_) { remotoEsiste = false; }

const oggi = new Date();
const data = [oggi.getDate(), oggi.getMonth() + 1].map(n => String(n).padStart(2, "0")).join("/") + "/" + oggi.getFullYear();
const messaggio = "docs(implementazioni): " + (frase || "punti nuovi del " + data);

console.log("Fogli da salvare (" + branch + " → " + remoto + "):\n  " + fogli.join("\n  "));
if (altri.length) console.log("Restano fuori, messi da parte solo per il push:\n  " + altri.join("\n  "));
console.log("Commit: " + messaggio);
if (!remotoEsiste) console.log("Attenzione: il remoto «" + remoto + "» non c'e': committo e basta, il push lo fai tu quando c'e'.");
if (prova) { console.log("\n(--prova: mi fermo qui)"); process.exit(0); }

/* `git add` dei fogli e poi `git commit -- <fogli>`: con i percorsi, il commit
   prende solo quelli e lascia in coda tutto il resto (`--only` e' il default) */
if (!gitVivo("add", "--", ...fogli)) process.exit(1);
if (!gitVivo("commit", "--only", "-m", messaggio, "--", ...fogli)) process.exit(1);
if (!remotoEsiste) process.exit(0);

let messiDaParte = false;
if (altri.length) {
  /* il pre-push vuole la cartella pulita: i file che non sono fogli vanno
     da parte il tempo del push, e tornano subito dopo — anche se il push fallisce */
  messiDaParte = gitVivo("stash", "push", "--include-untracked", "-m", "salva-punti: da parte per il push", "--", ...altri);
  if (!messiDaParte) { console.error("Non riesco a mettere da parte gli altri file: il commit c'e', il push lo fai a mano."); process.exit(1); }
}

let spinto = false;
try {
  spinto = gitVivo("push", "-u", remoto, branch);
} finally {
  if (messiDaParte) {
    /* `--index`: quello che era in coda torna in coda, non solo nella cartella */
    if (!gitVivo("stash", "pop", "--index")) console.error("\nAttenzione: i file messi da parte non sono tornati da soli — `git stash pop` a mano.");
  }
}

if (!spinto) {
  console.error("\nIl commit c'e' (" + git("rev-parse", "--short", "HEAD") + ") ma il push no: qui sopra c'e' scritto perche' — " +
    "il gate, oppure Git stesso (remoto avanti: `git pull --rebase " + remoto + " " + branch + "` e poi `git push`).");
  process.exit(1);
}
console.log("\nSalvato e pushato: " + git("rev-parse", "--short", "HEAD") + " su " + branch + ".");
