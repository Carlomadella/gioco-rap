/* Le manopole che non stanno nel codice.

   Tutto quello che il server legge dall'ambiente (`ADF_*`) si può mettere in un
   file `.env.local` qui accanto, una riga per manopola:

     ADF_PG=postgresql://utente:password@127.0.0.1:5432/anni_di_fame
     ADF_STEAM_CHIAVE=...

   **Il file non sta in git** ed è il posto giusto per le password: la riga di
   comando finisce nella cronologia della shell, e una variabile scritta a mano
   sparisce appena chiudi il terminale.

   Chi è già nell'ambiente vero **vince**: in produzione le manopole le mette
   chi avvia il servizio, e un file dimenticato sul disco non deve poterle
   scavalcare.

   Niente dipendenze e nessuna magia: si leggono le righe, si salta quello che
   comincia per `#`, si taglia al primo `=`. Gli apici intorno al valore, se ci
   sono, si tolgono. */
"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, ".env.local");

function carica(file){
  const dove = file || FILE;
  let testo;
  try{ testo = fs.readFileSync(dove, "utf8"); }
  catch(e){ return { file: dove, lette: 0, c_e: false }; }

  let lette = 0;
  for(const riga of testo.split(/\r?\n/)){
    const r = riga.trim();
    if(!r || r.startsWith("#")) continue;
    const i = r.indexOf("=");
    if(i < 1) continue;
    const chiave = r.slice(0, i).trim();
    let valore = r.slice(i + 1).trim();
    if(/^".*"$/.test(valore) || /^'.*'$/.test(valore)) valore = valore.slice(1, -1);
    if(process.env[chiave] !== undefined) continue;      // l'ambiente vero comanda
    process.env[chiave] = valore;
    lette++;
  }
  return { file: dove, lette, c_e: true };
}

module.exports = { carica, FILE };
