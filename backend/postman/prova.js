/* Fa girare la collezione Postman contro un server usa e getta.

     npm run postman

   Si tira su un server suo, su una porta sua, con un database suo; gli fa
   passare addosso tutte e 91 le richieste della collezione; e alla fine
   spegne tutto e butta il database. Esce con 0 se filano tutti i controlli.

   Il motore è **newman**, che è il Postman da riga di comando: stessa
   collezione, stessi script, stessi risultati del bottone Run. Non sta fra le
   dipendenze — lo tira giù `npx` la prima volta e poi se lo tiene: il server
   non deve portarsi dietro un albero di pacchetti per una cosa che si lancia
   a mano ogni tanto.

   Perché un server suo e non quello di casa: la collezione fa girare la
   settimana e chiude la stagione (cartella 10). Sono cose che si vedono da
   fuori, e su un database vero non si fanno per prova. */
"use strict";

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

require("../ambiente.js").carica();

const PORTA = 8796;
const BASE = "http://127.0.0.1:" + PORTA;
const ADMIN = "postman-" + crypto.randomBytes(8).toString("hex");
const FILE = path.join(os.tmpdir(), "adf-postman-" + Date.now() + ".db");
const COLLEZIONE = path.join(__dirname, "anni-di-fame.postman_collection.json");

async function aspettaCheRisponda(figlio){
  for(let i = 0; i < 60; i++){
    if(figlio.exitCode != null) throw new Error("il server è morto prima di rispondere");
    try{ await fetch(BASE + "/api/stato"); return; }catch(e){}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("il server non risponde dopo 15 secondi");
}

/* Il file del database se ne va, e con lui i tre file che SQLite si porta
   dietro (`-wal` e `-shm`): se restano lì, la prova dopo ne trova i pezzi. */
function butta(){
  for(const coda of ["", "-wal", "-shm"]){
    try{ fs.unlinkSync(FILE + coda); }catch(e){}
  }
}

(async () => {
  if(!fs.existsSync(COLLEZIONE)){
    console.error("la collezione non c'è: " + COLLEZIONE);
    console.error("si rifà con:  node postman/genera.js");
    process.exit(1);
  }

  const figlio = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: Object.assign({}, process.env, {
      ADF_PORTA: String(PORTA),
      ADF_BOT: "140",
      ADF_ADMIN: ADMIN,
      ADF_DATI: FILE,
      /* Il freno fra due punteggi resta acceso: c'è una prova che lo controlla
         («Punteggio · subito un altro» si aspetta un 429). Con ADF_INVIO_MS a
         zero quella prova fallirebbe, ed è l'unica che guarda il freno. */
      ADF_PG: ""
    }),
    stdio: ["ignore", "ignore", "inherit"]
  });

  let uscita = 1;
  try{
    await aspettaCheRisponda(figlio);
    console.log("server di prova su " + BASE + ", database usa e getta\n");

    uscita = await new Promise(fatto => {
      const newman = spawn("npx", [
        "--yes", "newman", "run", COLLEZIONE,
        "--env-var", "base=" + BASE,
        "--env-var", "admin=" + ADMIN,
        "--reporters", "cli",
        "--reporter-cli-no-banner"
      ], { stdio: "inherit", shell: true });
      newman.on("close", codice => fatto(codice == null ? 1 : codice));
      newman.on("error", e => { console.error("newman non è partito: " + e.message); fatto(1); });
    });
  }catch(e){
    console.error(e.message);
  }finally{
    figlio.kill();
    await new Promise(r => setTimeout(r, 500));
    butta();
  }
  process.exit(uscita);
})();
