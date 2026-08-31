/* La prova del server: si avvia da solo su una porta sua, con un archivio
   usa e getta, si fa tutto il giro e si spegne.

     node prova.js          (oppure: npm run prova)

   Esce con 0 se fila tutto liscio, con 1 al primo controllo che non torna.
   Nessuna dipendenza: solo Node. */
"use strict";

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const PORTA = 8799;
const BASE = "http://127.0.0.1:" + PORTA;
const ADMIN = "prova-" + Math.random().toString(16).slice(2);
const FILE = path.join(os.tmpdir(), "adf-prova-" + Date.now() + ".json");

let passati = 0, falliti = 0;
function controlla(cosa, condizione, dettaglio){
  if(condizione){ passati++; console.log("  ok   " + cosa); }
  else { falliti++; console.log("  NO   " + cosa + (dettaglio ? "  → " + JSON.stringify(dettaglio) : "")); }
}

const chiama = async (rotta, opzioni) => {
  const o = opzioni || {};
  const res = await fetch(BASE + rotta, {
    method: o.metodo || "GET",
    headers: Object.assign(o.corpo ? { "content-type": "application/json" } : {}, o.testate || {}),
    body: o.corpo ? JSON.stringify(o.corpo) : undefined
  });
  return { stato: res.status, dati: await res.json().catch(() => null) };
};

async function aspettaCheRisponda(figlio){
  for(let i = 0; i < 60; i++){
    if(figlio.exitCode != null) throw new Error("il server è morto prima di rispondere");
    try{ await fetch(BASE + "/api/stato"); return; }catch(e){}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("il server non risponde dopo 15 secondi");
}

(async () => {
  const figlio = spawn(process.execPath, [path.join(__dirname, "server.js")], {
    env: Object.assign({}, process.env, {
      ADF_PORTA: String(PORTA), ADF_BOT: "40", ADF_ADMIN: ADMIN, ADF_DATI: FILE
    }),
    stdio: ["ignore", "pipe", "inherit"]
  });

  try{
    await aspettaCheRisponda(figlio);
    console.log("\nla classifica");

    const stato = await chiama("/api/stato");
    controlla("il server risponde e ha i bot in pista", stato.dati && stato.dati.artisti === 40, stato.dati);
    controlla("all'inizio i giocatori veri sono zero", stato.dati && stato.dati.giocatori === 0);

    const top = await chiama("/api/classifica?quanti=10");
    controlla("la top 10 torna dieci righe", top.dati && top.dati.righe.length === 10);
    controlla("le righe sono ordinate per stream",
      top.dati && top.dati.righe.every((r, i, a) => i === 0 || a[i-1].stream >= r.stream));
    controlla("nessuna riga dice che è un bot",
      JSON.stringify(top.dati).indexOf('"bot"') < 0);
    controlla("i nomi dei bot sembrano nomi di gente",
      top.dati && top.dati.righe.every(r => r.nome.length >= 2 && !/^bot|^player|_\d+$/i.test(r.nome)),
      top.dati && top.dati.righe.map(r => r.nome));
    controlla("ogni riga ha città, genere e una storia",
      top.dati && top.dati.righe.every(r => r.citta && r.genere && r.storia));

    console.log("\nl'iscrizione");
    const reg = await chiama("/api/artista", { metodo: "POST", corpo: { nome: "Young Legend", citta: "Rovereto", genere: "trap" } });
    controlla("un artista nuovo si iscrive", reg.stato === 201 && reg.dati.id && reg.dati.chiave, reg.dati);
    const { id, chiave } = reg.dati || {};

    const doppio = await chiama("/api/artista", { metodo: "POST", corpo: { nome: "young legend" } });
    controlla("lo stesso nome non si prende due volte", doppio.stato === 409, doppio.dati);

    const senzaNome = await chiama("/api/artista", { metodo: "POST", corpo: { nome: " " } });
    controlla("un nome vuoto viene rifiutato", senzaNome.stato === 400, senzaNome.dati);

    console.log("\nil punteggio");
    const primo = await chiama("/api/punteggio", {
      metodo: "POST", testate: { "x-chiave": chiave },
      corpo: { id, stream: 9000, fan: 1200, livello: 7, uscite: 3, ultima: "Fine mese", seed: 12345 }
    });
    controlla("il primo punteggio entra intero", primo.dati && primo.dati.ok && primo.dati.limato === false, primo.dati);
    controlla("e mi dà la mia posizione", primo.dati && primo.dati.pos > 0);

    const ladro = await chiama("/api/punteggio", { metodo: "POST", testate: { "x-chiave": "sbagliata" }, corpo: { id, stream: 9e6 } });
    controlla("con la chiave sbagliata non si manda niente", ladro.stato === 403, ladro.dati);

    const troppoPresto = await chiama("/api/punteggio", { metodo: "POST", testate: { "x-chiave": chiave }, corpo: { id, stream: 9100 } });
    controlla("due invii di fila sono troppi", troppoPresto.stato === 429, troppoPresto.dati);

    console.log("  ...aspetto i dieci secondi del freno");
    await new Promise(r => setTimeout(r, 10500));
    const gonfiato = await chiama("/api/punteggio", { metodo: "POST", testate: { "x-chiave": chiave }, corpo: { id, stream: 40000000 } });
    controlla("quaranta milioni di stream vengono limati",
      gonfiato.dati && gonfiato.dati.limato === true, gonfiato.dati);
    const dopo = await chiama("/api/artista/" + id);
    controlla("e restano al massimo il quintuplo (45.000)", dopo.dati && dopo.dati.stream === 45000, dopo.dati);

    console.log("\nla settimana");
    const senzaChiave = await chiama("/api/giro", { metodo: "POST" });
    controlla("il giro non lo fa chi passa di lì", senzaChiave.stato === 403);

    const primaDelGiro = await chiama("/api/classifica?quanti=40");
    const giro = await chiama("/api/giro", { metodo: "POST", testate: { "x-admin": ADMIN } });
    controlla("il giro di settimana parte", giro.dati && giro.dati.settimana === 2, giro.dati);
    const dopoIlGiro = await chiama("/api/classifica?quanti=40");
    controlla("gli stream dei bot si sono mossi",
      JSON.stringify(primaDelGiro.dati.righe.map(r => r.stream)) !==
      JSON.stringify(dopoIlGiro.dati.righe.map(r => r.stream)));

    for(let i = 0; i < 3; i++) await chiama("/api/giro", { metodo: "POST", testate: { "x-admin": ADMIN } });
    const conFrecce = await chiama("/api/classifica?quanti=40");
    controlla("qualcuno sale e qualcuno scende (le frecce ▲▼)",
      conFrecce.dati.righe.some(r => r.delta !== 0 && r.delta !== null));

    console.log("\nintorno a me");
    const intorno = await chiama("/api/classifica/intorno/" + id + "?raggio=3");
    controlla("mi vedo in mezzo a chi mi sta davanti e dietro",
      intorno.dati && intorno.dati.io.id === id && intorno.dati.righe.some(r => r.io));
    const sconosciuto = await chiama("/api/classifica/intorno/aaaaaaaaaaaa");
    controlla("un id inventato non trova niente", sconosciuto.stato === 404);

    console.log("\nle notizie");
    const notizie = await chiama("/api/notizie?quante=5");
    controlla("il giro ha lasciato delle notizie", notizie.dati && notizie.dati.notizie.length > 0);

    console.log("\nl'archivio");
    controlla("il file dell'archivio esiste su disco", fs.existsSync(FILE));
    const salvato = JSON.parse(fs.readFileSync(FILE, "utf8"));
    controlla("le chiavi sono salvate solo come hash",
      Object.values(salvato.artisti).every(a => a.bot || (a.chiave && a.chiave.length === 64 && a.chiave !== chiave)));

  }catch(e){
    falliti++;
    console.log("\n  esploso: " + e.message);
  }finally{
    figlio.kill();
    try{ fs.unlinkSync(FILE); }catch(e){}
  }

  console.log("\n" + passati + " a posto, " + falliti + " no.\n");
  process.exit(falliti ? 1 : 0);
})();
