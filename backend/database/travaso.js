/* Il travaso: dal vecchio archivio JSON al database.

     node database/travaso.js [file.json] [file.db]
     npm run travaso

   Di suo prende `dati/classifica.json` e riempie `dati/classifica.db`. Si può
   dare due volte senza fare danni: se il database ha già dentro degli artisti,
   si ferma e lo dice.

   **Nessuno perde l'artista.** Per ogni giocatore vero del vecchio archivio si
   apre un account da ospite e gli si attacca l'artista, tenendo la chiave che
   ha già nel browser: il client vecchio continua a funzionare com'è, e quando
   vorrà potrà scambiarla con una sessione vera (`POST /api/sessione`, tipo
   `legacy`). */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { apri: apriDb } = require("./db.js");

const DA = process.argv[2] || path.join(__dirname, "dati", "classifica.json");
const A_FILE = process.argv[3] || path.join(__dirname, "dati", "classifica.db");
const ora = Date.now();
const uuid = () => crypto.randomUUID();

if(!fs.existsSync(DA)){
  console.log("Non c'è niente da travasare: " + DA + " non esiste.");
  console.log("Va bene così — il server si crea il database da solo alla prima accensione.");
  process.exit(0);
}

const vecchio = JSON.parse(fs.readFileSync(DA, "utf8"));
const artisti = Object.values(vecchio.artisti || {});
if(!artisti.length){ console.log("Il vecchio archivio è vuoto: non c'è niente da portare."); process.exit(0); }

async function travasa(){
  const A = await apriDb({ file: A_FILE });
  if(await A.uno("SELECT id FROM artista LIMIT 1")){
    console.log("Il database ha già degli artisti dentro: non ci travaso sopra.");
    console.log("Se vuoi rifarlo da zero, sposta " + A_FILE + " e ridai il comando.");
    process.exit(1);
  }

  const conto = { bot: 0, giocatori: 0, account: 0, notizie: 0, posizioni: 0 };

  await A.insieme(async () => {
    /* la stagione e le settimane fino a quella in corso */
    if(!await A.uno("SELECT id FROM stagione LIMIT 1"))
      await A.fai("INSERT INTO stagione (nome, inizio, stato) VALUES ('Prima stagione', ?, 'corrente')", vecchio.creato || ora);
    const stagione = (await A.uno("SELECT id FROM stagione ORDER BY id DESC LIMIT 1")).id;
    const fino = Math.max(1, Number(vecchio.settimana) || 1);
    for(let n = 1; n <= fino; n++){
      await A.fai("INSERT INTO settimana (numero, stagione_id, iniziata, chiusa) VALUES (?,?,?,?) " +
            "ON CONFLICT (numero) DO NOTHING",
        n, stagione, vecchio.creato || ora, n < fino ? (vecchio.aggiornato || ora) : null);
    }
    await A.fai("INSERT INTO stato (chiave, valore) VALUES ('prossimo_giro', ?) " +
          "ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore",
      String(vecchio.prossimoGiro || (ora + 24 * 3600e3)));

    /* gli artisti: stesso ordine di prima, id nuovo (uuid), niente perso */
    const nuovoId = new Map();
    for(const v of artisti){
      const id = uuid();
      nuovoId.set(v.id, id);
      await A.fai(`INSERT INTO artista (id, account_id, bot, nome, citta, genere, storia, seed, stream,
               fan, livello, fase, uscite, deal, ultima_titolo, ultima_seed, chiave_hash, creato, punteggio)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        id, null, v.bot ? 1 : 0, v.nome, v.citta, v.genere, v.storia || "", v.seed || 0,
        Math.max(0, Math.round(v.stream || 0)), Math.max(0, Math.round(v.fan || 0)),
        v.livello || 1, v.fase || 0, v.uscite || 0, v.deal ? 1 : 0,
        v.ultima || null, v.seed || 0, v.bot ? null : (v.chiave || null),
        v.creato || ora, v.ultimo || null);

      if(v.bot){
        await A.fai("INSERT INTO bot_stato (artista_id, slancio, caldo, carattere) VALUES (?,?,?, 'normale')",
          id, v.mom || 0, v.hot || 0);
        conto.bot++;
      } else {
        /* un account da ospite per ognuno, con l'artista attaccato */
        const acc = uuid();
        await A.fai("INSERT INTO account (id, lingua, creato, visto) VALUES (?, 'it', ?, ?)",
          acc, v.creato || ora, v.ultimo || ora);
        await A.fai("INSERT INTO identita (id, account_id, tipo, id_esterno, creato) VALUES (?,?,'ospite',?,?)",
          uuid(), acc, uuid(), v.creato || ora);
        await A.fai("UPDATE artista SET account_id = ? WHERE id = ?", acc, id);
        conto.giocatori++; conto.account++;
      }

      /* il «prima» diventa la fotografia dell'ultima settimana chiusa: senza
         questa riga le frecce ripartirebbero tutte da zero */
      if(v.posPrec && fino > 1){
        await A.fai("INSERT INTO classifica_posizione (settimana, artista_id, pos, stream, delta) VALUES (?,?,?,?,NULL) " +
              "ON CONFLICT (settimana, artista_id) DO NOTHING",
          fino - 1, id, v.posPrec, Math.round(v.streamPrec || v.stream || 0));
        conto.posizioni++;
      }
    }

    for(const n of (vecchio.notizie || []).slice().reverse()){
      const s = Math.min(fino, Math.max(1, Number(n.s) || fino));
      await A.fai("INSERT INTO notizia (settimana, tipo, testo, creato) VALUES (?,?,?,?)",
        s, /è uscito/.test(n.testo) ? "uscita" : /firmato/.test(n.testo) ? "firma"
          : /sparito/.test(n.testo) ? "sparizione" : "ingresso", n.testo, n.t || ora);
      conto.notizie++;
    }
  });

  console.log("Travasato da " + DA);
  console.log("  artisti:    " + (conto.bot + conto.giocatori) + " (" + conto.bot + " bot, " +
    conto.giocatori + " giocatori veri)");
  console.log("  account:    " + conto.account + " da ospite, con la chiave di prima che funziona ancora");
  console.log("  posizioni:  " + conto.posizioni + " fotografie della settimana scorsa");
  console.log("  notizie:    " + conto.notizie);
  console.log("\nIl vecchio " + path.basename(DA) + " non l'ho toccato: tienilo da parte finché non sei sicuro.");
  await A.chiudi();
}

travasa().catch(e => {
  console.error(e && e.stack || e);
  process.exit(1);
});
