/* La prova del server: si avvia da solo su una porta sua, con un database usa
   e getta, si fa tutto il giro e si spegne.

     npm run prova

   Copre quello che si può rompere davvero: la classifica e i bot che non si
   devono riconoscere, gli account, le sessioni, i salvataggi in cloud e i loro
   conflitti, i traguardi, la cancellazione dell'account, i freni
   contro l'imbroglio, il giro di settimana e le frecce.

   Esce con 0 se fila tutto liscio, con 1 al primo controllo che non torna. */
"use strict";

const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");
const crypto = require("crypto");

const PORTA = 8799;
const PORTA_CHIAVI = 8798;                       // il finto Apple che pubblica le sue chiavi
const AUD = "it.lafame.annidifame";
const BASE = "http://127.0.0.1:" + PORTA;
const ADMIN = "prova-" + Math.random().toString(16).slice(2);
const FILE = path.join(os.tmpdir(), "adf-prova-" + Date.now() + ".db");

let passati = 0, falliti = 0;
function controlla(cosa, condizione, dettaglio){
  if(condizione){ passati++; console.log("  ok   " + cosa); }
  else { falliti++; console.log("  NO   " + cosa + (dettaglio ? "  → " + JSON.stringify(dettaglio) : "")); }
}
const chiama = async (rotta, o = {}) => {
  const res = await fetch(BASE + rotta, {
    method: o.metodo || "GET",
    headers: Object.assign(o.corpo ? { "content-type": "application/json" } : {}, o.testate || {}),
    body: o.corpo ? JSON.stringify(o.corpo) : undefined
  });
  return { stato: res.status, dati: await res.json().catch(() => null) };
};
const conSessione = t => ({ "x-sessione": t });

/* Un finto «Apple»: una coppia di chiavi, un banchetto che pubblica quella
   pubblica, e la possibilità di firmare biglietti. Serve a provare sul serio
   la verifica della firma — che è l'unica cosa che sta fra noi e chiunque
   dica di essere chiunque. */
function fintoApple(){
  const coppia = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const altra = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const kid = "prova-1";
  const jwk = Object.assign(coppia.publicKey.export({ format: "jwk" }),
    { kid, alg: "RS256", use: "sig" });

  const banchetto = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ keys: [jwk] }));
  }).listen(PORTA_CHIAVI);

  const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
  function firma(corpo, chiave, testa){
    const t = b64(Object.assign({ alg: "RS256", kid }, testa || {}));
    const c = b64(corpo);
    const f = crypto.sign("RSA-SHA256", Buffer.from(t + "." + c), chiave || coppia.privateKey);
    return t + "." + c + "." + f.toString("base64url");
  }
  const adesso = () => Math.floor(Date.now() / 1000);
  return {
    banchetto, altra,
    buono: sub => firma({ iss: "https://appleid.apple.com", aud: AUD, sub,
      iat: adesso(), exp: adesso() + 600 }),
    scaduto: sub => firma({ iss: "https://appleid.apple.com", aud: AUD, sub,
      iat: adesso() - 7200, exp: adesso() - 3600 }),
    altrui: sub => firma({ iss: "https://appleid.apple.com", aud: AUD, sub,
      iat: adesso(), exp: adesso() + 600 }, altra.privateKey),
    perAltri: sub => firma({ iss: "https://appleid.apple.com", aud: "un.altro.gioco", sub,
      iat: adesso(), exp: adesso() + 600 })
  };
}

async function aspettaCheRisponda(figlio){
  for(let i = 0; i < 60; i++){
    if(figlio.exitCode != null) throw new Error("il server è morto prima di rispondere");
    try{ await fetch(BASE + "/api/stato"); return; }catch(e){}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("il server non risponde dopo 15 secondi");
}

(async () => {
  let apple = null;
  apple = fintoApple();
  const figlio = spawn(process.execPath, [path.join(__dirname, "server.js")], {
    env: Object.assign({}, process.env, {
      ADF_PORTA: String(PORTA), ADF_BOT: "40", ADF_ADMIN: ADMIN, ADF_DATI: FILE,
      ADF_INVIO_MS: "0",
      ADF_APPLE_AUD: AUD, ADF_APPLE_JWKS: "http://127.0.0.1:" + PORTA_CHIAVI + "/chiavi"
    }),
    stdio: ["ignore", "pipe", "inherit"]
  });

  try{
    await aspettaCheRisponda(figlio);

    console.log("\nla classifica");
    const stato = await chiama("/api/stato");
    controlla("il server risponde e ha i bot in pista", stato.dati && stato.dati.artisti === 40, stato.dati);
    controlla("all'inizio non c'è nessun giocatore vero", stato.dati && stato.dati.giocatori === 0);

    const top = await chiama("/api/classifica?quanti=10");
    controlla("la top 10 torna dieci righe", top.dati && top.dati.righe.length === 10);
    controlla("le righe sono ordinate per stream",
      top.dati.righe.every((r, i, a) => i === 0 || a[i-1].stream >= r.stream));
    controlla("nessuna riga dice che è un bot", JSON.stringify(top.dati).indexOf('"bot"') < 0);
    controlla("nessuna riga porta fuori un account", JSON.stringify(top.dati).indexOf("account") < 0);
    controlla("i nomi sembrano nomi di gente",
      top.dati.righe.every(r => r.nome.length >= 2 && !/^bot|^player|_\d+$/i.test(r.nome)),
      top.dati.righe.map(r => r.nome));
    controlla("ogni riga ha città, genere e una storia",
      top.dati.righe.every(r => r.citta && r.genere && r.storia));

    console.log("\nl'iscrizione, senza compilare niente");
    const reg = await chiama("/api/artista", { metodo: "POST",
      corpo: { nome: "Young Legend", citta: "Rovereto", genere: "trap" } });
    controlla("un artista nuovo si iscrive", reg.stato === 201 && reg.dati.id, reg.dati);
    controlla("e senza chiedere niente si ritrova un account e una sessione",
      !!(reg.dati.token && reg.dati.chiave), Object.keys(reg.dati || {}));
    const io1 = reg.dati.id, chiave1 = reg.dati.chiave, sess1 = reg.dati.token;

    const doppio = await chiama("/api/artista", { metodo: "POST", corpo: { nome: "young legend" } });
    controlla("lo stesso nome non si prende due volte", doppio.stato === 409, doppio.dati);
    const vuoto = await chiama("/api/artista", { metodo: "POST", corpo: { nome: " " } });
    controlla("un nome vuoto viene rifiutato", vuoto.stato === 400);

    const mio = await chiama("/api/io", { testate: conSessione(sess1) });
    controlla("con la sessione mi ritrovo il mio artista",
      mio.dati && mio.dati.artisti.length === 1 && mio.dati.artisti[0].id === io1, mio.dati);

    console.log("\nil punteggio");
    const primo = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sess1),
      corpo: { id: io1, stream: 9000, fan: 1200, livello: 7, uscite: 3, ultima: "Fine mese", seed: 12345 } });
    controlla("il primo punteggio entra intero", primo.dati && primo.dati.ok && !primo.dati.limato, primo.dati);
    controlla("e mi dà la mia posizione", primo.dati.pos > 0);

    const conChiave = await chiama("/api/punteggio", { metodo: "POST", testate: { "x-chiave": chiave1 },
      corpo: { id: io1, stream: 12000 } });
    controlla("funziona anche col vecchio modo (id + chiave)", conChiave.stato === 200, conChiave.dati);

    const ladro = await chiama("/api/punteggio", { metodo: "POST", testate: { "x-chiave": "sbagliata" },
      corpo: { id: io1, stream: 9e6 } });
    controlla("con la chiave sbagliata non si manda niente", ladro.stato === 403);

    const gonfiato = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sess1),
      corpo: { id: io1, stream: 40000000 } });
    controlla("quaranta milioni di stream vengono limati", gonfiato.dati && gonfiato.dati.limato === true, gonfiato.dati);
    const dopo = await chiama("/api/artista/" + io1);
    controlla("e restano al massimo il quintuplo (60.000)", dopo.dati.stream === 60000, dopo.dati);

    console.log("\ngli account");
    const conMail = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "email", email: "Prova@Esempio.it", segreto: "unasegretalunga" } });
    controlla("ci si iscrive con una mail", conMail.stato === 201 && conMail.dati.token, conMail.dati);
    const stessaMail = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "email", email: "prova@esempio.it", segreto: "unasegretalunga" } });
    controlla("la stessa mail non si usa due volte", stessaMail.stato === 409);
    const cortina = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "email", email: "altro@esempio.it", segreto: "corta" } });
    controlla("una password corta viene rifiutata", cortina.stato === 400);

    const sbagliata = await chiama("/api/sessione", { metodo: "POST",
      corpo: { tipo: "email", email: "prova@esempio.it", segreto: "nonquesta" } });
    controlla("con la password sbagliata non si entra", sbagliata.stato === 403);
    const giusta = await chiama("/api/sessione", { metodo: "POST",
      corpo: { tipo: "email", email: "prova@esempio.it", segreto: "unasegretalunga" } });
    controlla("con quella giusta si entra", giusta.stato === 200 && giusta.dati.token, giusta.dati);
    const sess2 = giusta.dati.token;

    const steam = await chiama("/api/account", { metodo: "POST", corpo: { tipo: "steam", biglietto: "finto" } });
    controlla("Steam è una porta chiusa, non una porta finta", steam.stato === 501, steam.dati);

    const daVecchio = await chiama("/api/sessione", { metodo: "POST",
      corpo: { tipo: "legacy", artistaId: io1, chiave: chiave1 } });
    controlla("dalla vecchia chiave si ottiene una sessione vera",
      daVecchio.stato === 200 && daVecchio.dati.token, daVecchio.dati);

    console.log("\ni salvataggi in cloud");
    const salva = await chiama("/api/carriera/1", { metodo: "PUT", testate: conSessione(sess2),
      corpo: { stato: { week: 12, fans: 3400, songs: [] }, settimana: 12, anno: 1, versioneGioco: "0.1.0" } });
    controlla("una carriera si salva", salva.stato === 200 && salva.dati.salvata.settimana === 12, salva.dati);
    const rileggi = await chiama("/api/carriera/1", { testate: conSessione(sess2) });
    controlla("e si rilegge uguale", rileggi.dati && rileggi.dati.stato.fans === 3400, rileggi.dati);
    const indietro = await chiama("/api/carriera/1", { metodo: "PUT", testate: conSessione(sess2),
      corpo: { stato: { week: 3 }, settimana: 3, anno: 1 } });
    controlla("una partita più indietro non sovrascrive quella più avanti", indietro.stato === 409, indietro.dati);
    const forzata = await chiama("/api/carriera/1", { metodo: "PUT", testate: conSessione(sess2),
      corpo: { stato: { week: 3 }, settimana: 3, anno: 1, forza: true } });
    controlla("ma con forza=true sì, se il giocatore lo decide", forzata.stato === 200);
    const senzaSessione = await chiama("/api/carriera/1", { metodo: "PUT", corpo: { stato: {} } });
    controlla("senza sessione non si salva niente", senzaSessione.stato === 403);
    const slotVuoto = await chiama("/api/carriera/3", { testate: conSessione(sess2) });
    controlla("uno slot vuoto lo dice", slotVuoto.stato === 404);

    console.log("\ni traguardi");
    const catalogo = await chiama("/api/traguardi");
    controlla("il catalogo dei traguardi c'è", catalogo.dati.traguardi.length > 5);
    controlla("ogni traguardo ha un codice per Steam",
      catalogo.dati.traguardi.every(t => t.codice && t.nome && t.descrizione));
    const dato = await chiama("/api/traguardo", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, codice: "primo_pezzo" } });
    controlla("un traguardo si assegna", dato.dati && dato.dati.nuovo === true, dato.dati);
    const ancora = await chiama("/api/traguardo", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, codice: "primo_pezzo" } });
    controlla("due volte no", ancora.dati && ancora.dati.gia === true);
    const daSpingere = await chiama("/api/da-spingere", { testate: { "x-admin": ADMIN } });
    controlla("resta in coda da mandare allo store", daSpingere.dati.traguardi.length === 1, daSpingere.dati);

    console.log("\nla settimana");
    const senzaChiave = await chiama("/api/giro", { metodo: "POST" });
    controlla("il giro non lo fa chi passa di lì", senzaChiave.stato === 403);
    const prima = await chiama("/api/classifica?quanti=40");
    const giro = await chiama("/api/giro", { metodo: "POST", testate: { "x-admin": ADMIN } });
    controlla("il giro di settimana parte", giro.dati && giro.dati.settimana === 2, giro.dati);
    const poi = await chiama("/api/classifica?quanti=40");
    controlla("gli stream dei bot si sono mossi",
      JSON.stringify(prima.dati.righe.map(r => r.stream)) !== JSON.stringify(poi.dati.righe.map(r => r.stream)));
    for(let i = 0; i < 3; i++) await chiama("/api/giro", { metodo: "POST", testate: { "x-admin": ADMIN } });
    const conFrecce = await chiama("/api/classifica?quanti=40");
    controlla("qualcuno sale e qualcuno scende (le frecce ▲▼)",
      conFrecce.dati.righe.some(r => r.delta !== 0 && r.delta !== null));
    const notizie = await chiama("/api/notizie?quante=5");
    controlla("il giro ha lasciato delle notizie", notizie.dati.notizie.length > 0);
    controlla("ogni notizia ha un tipo", notizie.dati.notizie.every(n => n.tipo && n.testo));

    console.log("\nintorno a me");
    const intorno = await chiama("/api/classifica/intorno/" + io1 + "?raggio=3");
    controlla("mi vedo in mezzo a chi mi sta davanti e dietro",
      intorno.dati && intorno.dati.io.id === io1 && intorno.dati.righe.some(r => r.io), intorno.dati && intorno.dati.io);
    const inventato = await chiama("/api/classifica/intorno/00000000-0000-4000-8000-000000000000");
    controlla("un id inventato non trova niente", inventato.stato === 404);

    console.log("\nla cancellazione dell'account (quella che Apple e Google pretendono)");
    const senzaConferma = await chiama("/api/account", { metodo: "DELETE", testate: conSessione(sess2), corpo: {} });
    controlla("non si cancella per sbaglio", senzaConferma.stato === 400);
    const cancella = await chiama("/api/account", { metodo: "DELETE", testate: conSessione(sess2),
      corpo: { conferma: "cancella" } });
    controlla("con la conferma si cancella", cancella.stato === 200, cancella.dati);
    const dopoCancella = await chiama("/api/io", { testate: conSessione(sess2) });
    controlla("la sessione non vale più", dopoCancella.stato === 403);
    const rientro = await chiama("/api/sessione", { metodo: "POST",
      corpo: { tipo: "email", email: "prova@esempio.it", segreto: "unasegretalunga" } });
    controlla("e non si rientra con la vecchia mail", rientro.stato === 403);

    console.log("\nentrare con Apple (biglietto firmato)");
    const conApple = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "apple", biglietto: apple.buono("000123.abcdef") } });
    controlla("con un biglietto firmato bene si entra", conApple.stato === 201 && conApple.dati.token, conApple.dati);
    const dinuovo = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "apple", biglietto: apple.buono("000123.abcdef") } });
    controlla("la seconda volta ritrova l'account di prima, non ne fa un altro",
      dinuovo.stato === 200 && dinuovo.dati.account.id === conApple.dati.account.id, dinuovo.dati);
    const firmaAltrui = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "apple", biglietto: apple.altrui("000999.xxx") } });
    controlla("un biglietto firmato con un'altra chiave viene buttato", firmaAltrui.stato === 403, firmaAltrui.dati);
    const scaduto = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "apple", biglietto: apple.scaduto("000123.abcdef") } });
    controlla("un biglietto scaduto viene buttato", scaduto.stato === 403);
    const altrove = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "apple", biglietto: apple.perAltri("000123.abcdef") } });
    controlla("un biglietto fatto per un altro gioco viene buttato", altrove.stato === 403);
    const senzaChiavi = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "google", biglietto: "qualsiasi" } });
    controlla("Google, che non abbiamo collegato, dice 501 e non 403", senzaChiavi.stato === 501, senzaChiavi.dati);
    const quali = await chiama("/api/stato");
    controlla("lo stato dice quali accessi sono collegati",
      quali.dati.accessi && quali.dati.accessi.apple === true && quali.dati.accessi.steam === false, quali.dati.accessi);

    console.log("\ni sospetti e le sanzioni");
    const visti = await chiama("/api/sospetti", { testate: { "x-admin": ADMIN } });
    controlla("il salto da quaranta milioni ha lasciato un sospetto",
      visti.dati.sospetti.length >= 1 && visti.dati.sospetti[0].tipo === "salto", visti.dati.sospetti[0]);
    const nascosti = await chiama("/api/sospetti");
    controlla("i sospetti non li vede chi passa di lì", nascosti.stato === 403);

    const iomio = await chiama("/api/io", { testate: conSessione(sess1) });
    const contoMio = iomio.dati.account.id;
    const primaDiSanzione = await chiama("/api/classifica?quanti=60");
    const c1 = primaDiSanzione.dati.righe.filter(r => r.id === io1).length;
    const sanzione = await chiama("/api/sanzione", { metodo: "POST", testate: { "x-admin": ADMIN },
      corpo: { accountId: contoMio, tipo: "fuori_classifica", motivo: "numeri impossibili", giorni: 7 } });
    controlla("una sanzione si mette", sanzione.stato === 200, sanzione.dati);
    const dopoSanzione = await chiama("/api/classifica?quanti=60");
    controlla("chi è fuori classifica sparisce dalla graduatoria",
      c1 === 1 && dopoSanzione.dati.righe.filter(r => r.id === io1).length === 0);
    controlla("e il totale cala di uno", dopoSanzione.dati.totale === primaDiSanzione.dati.totale - 1,
      { prima: primaDiSanzione.dati.totale, dopo: dopoSanzione.dati.totale });
    const puoAncora = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sess1),
      corpo: { id: io1, stream: 60001 } });
    controlla("ma continua a giocare la sua partita (fuori classifica non è un ban)",
      puoAncora.stato === 200, puoAncora.dati);
    const sospeso = await chiama("/api/sanzione", { metodo: "POST", testate: { "x-admin": ADMIN },
      corpo: { accountId: contoMio, tipo: "sospensione", motivo: "recidivo", giorni: 1 } });
    controlla("una sospensione si mette", sospeso.stato === 200);
    const bloccato = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sess1),
      corpo: { id: io1, stream: 60002 } });
    controlla("da sospeso non si manda più niente", bloccato.stato === 403, bloccato.dati);

    console.log("\nla copia di sicurezza");
    const dove = FILE.replace(/\.db$/, "-copia.db");
    const copia = spawnSync(process.execPath, [path.join(__dirname, "database", "copia.js"), FILE, dove],
      { encoding: "utf8" });
    controlla("la copia si fa a server acceso", copia.status === 0, (copia.stderr || "").slice(0, 200));
    controlla("e il file c'è", fs.existsSync(dove));
    if(fs.existsSync(dove)){
      const { DatabaseSync } = require("node:sqlite");
      const c = new DatabaseSync(dove, { readOnly: true });
      const dentro = c.prepare("SELECT count(*) n FROM artista").get().n;
      c.close();
      controlla("con dentro gli artisti", dentro > 40, dentro);
      fs.unlinkSync(dove);
    }

    console.log("\nil database");
    controlla("il file del database esiste", fs.existsSync(FILE));
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(FILE, { readOnly: true });
    const chiavi = db.prepare("SELECT chiave_hash FROM artista WHERE chiave_hash IS NOT NULL").all();
    controlla("le chiavi stanno solo come hash",
      chiavi.every(r => r.chiave_hash.length === 64 && r.chiave_hash !== chiave1), chiavi.length);
    const segreti = db.prepare("SELECT segreto_hash FROM identita WHERE segreto_hash IS NOT NULL").all();
    controlla("le password stanno solo come scrypt",
      segreti.every(r => r.segreto_hash.startsWith("scrypt$")));
    const storia = db.prepare("SELECT count(*) n FROM punteggio_settimana").get();
    controlla("lo storico dei punteggi si riempie", storia.n > 0, storia);
    const foto = db.prepare("SELECT count(*) n FROM classifica_posizione").get();
    controlla("e le fotografie della classifica anche", foto.n > 0, foto);
    const ritirato = db.prepare("SELECT nome, account_id, ritirato FROM artista WHERE nome LIKE 'Artista ritirato%'").all();
    controlla("l'artista di chi ha cancellato resta senza nome e senza padrone",
      ritirato.length === 0 || ritirato.every(r => r.account_id === null && r.ritirato), ritirato);
    db.close();

  }catch(e){
    falliti++;
    console.log("\n  esploso: " + (e && e.stack || e));
  }finally{
    figlio.kill();
    try{ apple.banchetto.close(); }catch(e){}
    for(const f of [FILE, FILE + "-wal", FILE + "-shm"]) try{ fs.unlinkSync(f); }catch(e){}
  }

  console.log("\n" + passati + " a posto, " + falliti + " no.\n");
  process.exit(falliti ? 1 : 0);
})();
