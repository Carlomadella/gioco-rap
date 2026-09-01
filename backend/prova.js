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

require("./ambiente.js").carica();

/* Le stesse prove girano sotto tutti e due i motori. Di suo SQLite, con un
   file usa e getta; con `ADF_PG` sotto va PostgreSQL:

     npm run prova            le prove su SQLite
     npm run prova-pg         le stesse prove su PostgreSQL

   Su PostgreSQL **non si tocca il database vero**: si crea uno schema
   apposta per il giro (`prova_<a caso>`), ci si lavora dentro, e alla fine si
   butta. Se qualcosa esplode a meta', lo schema resta li' col suo nome
   parlante e si vede subito che e' roba di una prova. */
const VUOLE_PG = process.argv.includes("--pg");
if(VUOLE_PG && !process.env.ADF_PG){
  console.error("`--pg` chiede PostgreSQL, ma ADF_PG non c'è.");
  console.error("Mettilo in backend/.env.local, una riga:");
  console.error("  ADF_PG=postgresql://utente:password@127.0.0.1:5432/anni_di_fame");
  process.exit(1);
}
/* La scelta è esplicita apposta: se bastasse ADF_PG nell'ambiente, `npm run
   prova` finirebbe su PostgreSQL senza che nessuno l'abbia chiesto — e le due
   prove servono proprio a essere due. */
const PG = VUOLE_PG ? process.env.ADF_PG : "";
const SCHEMA = "prova_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pgConSchema = url => url + (url.indexOf("?") >= 0 ? "&" : "?") +
  "options=" + encodeURIComponent("-c search_path=" + SCHEMA);

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

/* Guardare dentro al database e' l'ultimo blocco di prove: serve a controllare
   che le chiavi ci stiano solo come hash, che lo storico si riempia, che
   l'artista di chi ha cancellato resti senza padrone. Sotto ci puo' essere
   l'uno o l'altro motore, quindi la lettura passa di qui. */
let clientePg = null;
async function guarda(sql){
  if(!PG){
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(FILE, { readOnly: true });
    try{ return db.prepare(sql).all(); } finally{ db.close(); }
  }
  return (await clientePg.query(sql)).rows;
}
async function schemaVia(){
  if(!PG || !clientePg) return;
  try{ await clientePg.query('DROP SCHEMA IF EXISTS "' + SCHEMA + '" CASCADE'); }catch(e){}
  try{ await clientePg.end(); }catch(e){}
  clientePg = null;
}

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
      iat: adesso(), exp: adesso() + 600 }),
    /* firmato bene, per noi, ma senza scadenza: varrebbe per sempre */
    senzaScadenza: sub => firma({ iss: "https://appleid.apple.com", aud: AUD, sub,
      iat: adesso() })
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
      ADF_PG: PG ? pgConSchema(PG) : "",
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

    const senzaParametri = await chiama("/api/classifica");
    controlla("una rotta chiamata senza parametri usa i suoi valori di suo",
      senzaParametri.dati.righe.length === 10, senzaParametri.dati.righe.length);
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
    controlla("e il server dice fin dove poteva arrivare",
      gonfiato.dati.tetto > 10000 && gonfiato.dati.tetto < 200000 &&
      gonfiato.dati.fuori.indexOf("stream") >= 0, { tetto: gonfiato.dati.tetto, fuori: gonfiato.dati.fuori });
    const dopo = await chiama("/api/artista/" + io1);
    controlla("resta il tetto, non il numero inventato", dopo.dati.stream === gonfiato.dati.tetto, dopo.dati.stream);

    console.log("\nil modello: cosa sta in piedi e cosa no");
    const onesto = await chiama("/api/artista", { metodo: "POST",
      corpo: { nome: "Gente Onesta", citta: "Bari", genere: "drill" } });
    const onestoId = onesto.dati.id, sessOnesto = onesto.dati.token;
    const partenza = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sessOnesto),
      corpo: { id: onestoId, stream: 4000, fan: 500, livello: 3, uscite: 1 } });
    controlla("chi comincia piano passa liscio", partenza.dati.limato === false, partenza.dati);
    const cresce = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sessOnesto),
      corpo: { id: onestoId, stream: 12000, fan: 620, livello: 4, uscite: 2 } });
    controlla("una settimana buona con un pezzo nuovo passa lo stesso",
      cresce.dati.limato === false, { limato: cresce.dati.limato, tetto: cresce.dati.tetto });
    const fanFinti = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sessOnesto),
      corpo: { id: onestoId, stream: 13000, fan: 900000, livello: 4 } });
    controlla("i fan non si moltiplicano per mille in una settimana",
      fanFinti.dati.limato === true && fanFinti.dati.fuori.indexOf("fan") >= 0, fanFinti.dati);
    const suo = await chiama("/api/artista/" + onestoId);
    controlla("e restano quelli che poteva avere", suo.dati.stream > 0);

    console.log("\nchi insiste a barare");
    const furbo = await chiama("/api/artista", { metodo: "POST",
      corpo: { nome: "Tarocco", citta: "Latina", genere: "trap" } });
    const furboId = furbo.dati.id, sessFurbo = furbo.dati.token;
    let fuoriDopo = null;
    for(let i = 0; i < 4; i++){
      const r = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sessFurbo),
        corpo: { id: furboId, stream: 9000000 + i, fan: 4000000 } });
      if(r.dati && r.dati.fuoriClassifica) fuoriDopo = i + 1;
    }
    controlla("dopo qualche numero inventato finisce fuori classifica da solo",
      fuoriDopo !== null, { fuoriDopo });
    const cercalo = await chiama("/api/classifica?quanti=200");
    controlla("e sparisce davvero dalla graduatoria",
      cercalo.dati.righe.every(r => r.id !== furboId));
    const gioca = await chiama("/api/punteggio", { metodo: "POST", testate: conSessione(sessFurbo),
      corpo: { id: furboId, stream: 100 } });
    controlla("ma il gioco continua a funzionargli: non gli abbiamo tolto niente",
      gioca.stato === 200 && gioca.dati.ok, gioca.dati);
    const registro = await chiama("/api/sospetti", { testate: { "x-admin": ADMIN } });
    controlla("nel registro c'è tutto quello che ha provato",
      registro.dati.sospetti.filter(x => x.artista_id === furboId).length >= 3,
      registro.dati.sospetti.length);

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
    controlla("i traguardi li ha già dati il server, col punteggio",
      Array.isArray(primo.dati.traguardi) && primo.dati.traguardi.indexOf("in_classifica") >= 0,
      primo.dati.traguardi);
    const miei = await chiama("/api/traguardi/" + io1);
    controlla("e sono attaccati all'artista",
      miei.dati.traguardi.some(t => t.codice === "primo_pezzo") &&
      miei.dati.traguardi.some(t => t.codice === "primi_mille"), miei.dati.traguardi.map(t => t.codice));
    const chiesto = await chiama("/api/traguardo", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, codice: "top_10" } });
    controlla("un traguardo che sa controllare il server non si può chiedere",
      chiesto.stato === 409, chiesto.dati);
    const dato = await chiama("/api/traguardo", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, codice: "milano" } });
    controlla("quelli che sa solo il gioco sì", dato.dati && dato.dati.nuovo === true, dato.dati);
    const ancora = await chiama("/api/traguardo", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, codice: "milano" } });
    controlla("ma non due volte", ancora.dati && ancora.dati.gia === true);
    const daSpingere = await chiama("/api/da-spingere", { testate: { "x-admin": ADMIN } });
    controlla("restano in coda da mandare allo store", daSpingere.dati.traguardi.length >= 2,
      daSpingere.dati.traguardi.length);

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

    console.log("\nil feed del telefono e gli opps");
    const feed = await chiama("/api/feed?quanti=10");
    controlla("il feed torna dei post", feed.dati.post.length > 0, feed.dati.post.length);
    controlla("ogni post ha nome, testo, settimana e cuori",
      feed.dati.post.every(p => p.n && p.t && p.s >= 1 && typeof p.like === "number"),
      feed.dati.post[0]);
    controlla("i cuori seguono chi ha postato, non sono a caso",
      feed.dati.post.some(p => p.like > 20), feed.dati.post.map(p => p.like).slice(0, 5));
    controlla("i post dei bot dicono di chi sono (serve al feed personale)",
      feed.dati.post.filter(p => p.artistaId).length > 0);
    const feedMio = await chiama("/api/feed?quanti=10", { testate: conSessione(sess1) });
    controlla("col mio account il feed si apre lo stesso", feedMio.stato === 200 && feedMio.dati.post.length > 0);

    const opps = await chiama("/api/opps?quanti=3", { testate: conSessione(sess1) });
    controlla("gli opps sono chi mi sta appena sopra",
      opps.dati.sopra.length === 3 && opps.dati.sopra.every(o => o.pos < opps.dati.io.pos),
      opps.dati.sopra.map(o => o.pos + " " + o.nome));
    controlla("e mi dicono quanto mi manca",
      opps.dati.sopra.every(o => o.distanza > 0), opps.dati.sopra.map(o => o.distanza));
    const bersaglio = opps.dati.sopra[opps.dati.sopra.length - 1];
    const rivale = await chiama("/api/relazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, altroId: bersaglio.id, tipo: "rivale", nota: "me l'ha detta grossa" } });
    controlla("uno se lo può prendere come rivale", rivale.stato === 200 && rivale.dati.ok, rivale.dati);
    const dinuovoRivale = await chiama("/api/relazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, altroId: bersaglio.id, tipo: "rivale" } });
    controlla("ma una volta sola", dinuovoRivale.dati && dinuovoRivale.dati.gia === true);
    const conRivale = await chiama("/api/opps", { testate: conSessione(sess1) });
    controlla("la rivalità resta scritta anche se lui si sposta",
      conRivale.dati.dichiarati.length === 1 && conRivale.dati.dichiarati[0].id === bersaglio.id,
      conRivale.dati.dichiarati);
    const conMeStesso = await chiama("/api/relazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, altroId: io1, tipo: "rivale" } });
    controlla("con se stessi non si litiga", conMeStesso.stato === 400);
    const altrui = await chiama("/api/relazione", { metodo: "POST",
      corpo: { artistaId: io1, altroId: bersaglio.id, tipo: "rivale" } });
    controlla("e non si dichiarano rivalità per conto di altri", altrui.stato === 403);
    const via = await chiama("/api/relazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: io1, altroId: bersaglio.id, tipo: "rimuovi", era: "rivale" } });
    controlla("si può anche fare pace", via.stato === 200);

    console.log("\nle classifiche per città e per genere");
    const elenchi = await chiama("/api/classifiche");
    controlla("si sa quali città e quali generi hanno gente dentro",
      elenchi.dati.citta.length > 3 && elenchi.dati.generi.length >= 3,
      { citta: elenchi.dati.citta.length, generi: elenchi.dati.generi.length });
    const unaCitta = elenchi.dati.citta[0].citta;
    const perCitta = await chiama("/api/classifica?quanti=50&citta=" + encodeURIComponent(unaCitta));
    controlla("la classifica di una città torna solo quella città",
      perCitta.dati.righe.length > 0 && perCitta.dati.righe.every(r => r.citta.toLowerCase() === unaCitta.toLowerCase()),
      perCitta.dati.righe.map(r => r.citta));
    controlla("e la posizione riparte da 1 dentro alla città",
      perCitta.dati.righe[0].pos === 1 && perCitta.dati.totale === elenchi.dati.citta[0].quanti,
      { pos: perCitta.dati.righe[0].pos, totale: perCitta.dati.totale });
    controlla("il filtro torna indietro con la risposta",
      perCitta.dati.filtro && perCitta.dati.filtro.citta === unaCitta, perCitta.dati.filtro);
    const perGenere = await chiama("/api/classifica?quanti=20&genere=trap");
    controlla("la classifica di un genere torna solo quel genere",
      perGenere.dati.righe.every(r => r.genere === "trap"));
    const inventata = await chiama("/api/classifica?quanti=10&citta=Nonesiste");
    controlla("una città che non c'è torna una classifica vuota, non un errore",
      inventata.stato === 200 && inventata.dati.righe.length === 0 && inventata.dati.totale === 0);
    const generePinto = await chiama("/api/classifica?quanti=10&genere=jazzfusion");
    controlla("un genere inventato viene ignorato invece di rompere",
      generePinto.stato === 200 && generePinto.dati.righe.length === 10);

    console.log("\nle stagioni e l'albo d'oro");
    const primaDellaStagione = await chiama("/api/classifica?quanti=3");
    const chiusura = await chiama("/api/stagione/chiudi", { metodo: "POST",
      testate: { "x-admin": ADMIN }, corpo: { quanti: 20 } });
    controlla("una stagione si chiude", chiusura.stato === 200 && chiusura.dati.inAlbo === 20, chiusura.dati);
    controlla("e ne comincia una nuova", /Stagione 2/.test(chiusura.dati.nuova || ""), chiusura.dati);
    const albo = await chiama("/api/albo");
    controlla("chi ha vinto resta scritto nell'albo d'oro",
      albo.dati.albo.length === 20 && albo.dati.albo[0].pos === 1 &&
      albo.dati.albo[0].nome === primaDellaStagione.dati.righe[0].nome, albo.dati.albo[0]);
    const dopoStagione = await chiama("/api/classifica?quanti=3");
    controlla("i numeri si ammorbidiscono invece di azzerarsi",
      dopoStagione.dati.righe[0].stream < primaDellaStagione.dati.righe[0].stream &&
      dopoStagione.dati.righe[0].stream > 0,
      { prima: primaDellaStagione.dati.righe[0].stream, dopo: dopoStagione.dati.righe[0].stream });
    controlla("ma la classifica non si sfascia: chi era primo è ancora primo",
      dopoStagione.dati.righe[0].nome === primaDellaStagione.dati.righe[0].nome);
    const stagioni = await chiama("/api/stagioni");
    controlla("le stagioni si possono elencare, chiuse comprese",
      stagioni.dati.tutte.length === 2 && stagioni.dati.corrente.stato === "corrente", stagioni.dati.tutte);
    const nonTuo = await chiama("/api/stagione/chiudi", { metodo: "POST" });
    controlla("la stagione non la chiude chi passa di lì", nonTuo.stato === 403);

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

    console.log("\ni nomi che non vanno bene");
    const brutti = ["C4zz0 Mio", "ADMIN", "La Fame Studio", "n1gg4"];
    const respinti = [];
    for(const n of brutti){
      const r = await chiama("/api/artista", { metodo: "POST", corpo: { nome: n } });
      if(r.stato === 400) respinti.push(n);
    }
    controlla("i nomi offensivi e quelli che fingono di essere noi vengono respinti",
      respinti.length === brutti.length, { respinti, su: brutti.length });
    const buono = await chiama("/api/artista", { metodo: "POST",
      corpo: { nome: "Scazzo", citta: "Prato" } });
    controlla("ma «Scazzo» passa: non è un insulto ed è una parola vera",
      buono.stato === 201, buono.dati);
    const scazzo = buono.dati.id, sessScazzo = buono.dati.token;

    console.log("\nle segnalazioni");
    const senza = await chiama("/api/segnalazione", { metodo: "POST",
      corpo: { artistaId: scazzo, motivo: "nome" } });
    controlla("chi non è entrato non segnala niente", senza.stato === 403);
    const segn = await chiama("/api/segnalazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: scazzo, motivo: "nome", nota: "a me non piace" } });
    controlla("una segnalazione si manda", segn.stato === 200 && segn.dati.ok, segn.dati);
    const bis = await chiama("/api/segnalazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: scazzo, motivo: "nome" } });
    controlla("la stessa persona non segnala due volte lo stesso", bis.dati && bis.dati.gia === true, bis.dati);
    const coda = await chiama("/api/da-guardare", { testate: { "x-admin": ADMIN } });
    controlla("finisce nella coda di chi modera",
      coda.dati.artisti.length === 1 && coda.dati.artisti[0].da_quanti === 1, coda.dati.artisti);
    const codaChiusa = await chiama("/api/da-guardare");
    controlla("e la coda non la vede chi passa di lì", codaChiusa.stato === 403);

    const respinta = await chiama("/api/moderazione", { metodo: "POST", testate: { "x-admin": ADMIN },
      corpo: { artistaId: scazzo, azione: "respingi" } });
    controlla("una segnalazione senza motivo si respinge", respinta.stato === 200);
    const codaVuota = await chiama("/api/da-guardare", { testate: { "x-admin": ADMIN } });
    controlla("e la coda si svuota", codaVuota.dati.artisti.length === 0);

    await chiama("/api/segnalazione", { metodo: "POST", testate: conSessione(sess1),
      corpo: { artistaId: scazzo, motivo: "storia" } });
    const tolto = await chiama("/api/moderazione", { metodo: "POST", testate: { "x-admin": ADMIN },
      corpo: { artistaId: scazzo, azione: "rinomina" } });
    controlla("un nome si può togliere d'ufficio",
      tolto.stato === 200 && /^Artista /.test(tolto.dati.nome), tolto.dati);
    const dopoIlCambio = await chiama("/api/artista/" + scazzo);
    controlla("e in classifica si vede quello nuovo", /^Artista /.test(dopoIlCambio.dati.nome), dopoIlCambio.dati.nome);

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

    const eterno = await chiama("/api/account", { metodo: "POST",
      corpo: { tipo: "apple", biglietto: apple.senzaScadenza("000123.abcdef") } });
    controlla("un biglietto senza scadenza viene buttato", eterno.stato === 403, eterno.dati);
    const quali = await chiama("/api/stato");
    controlla("lo stato dice quali accessi sono collegati",
      quali.dati.accessi && quali.dati.accessi.apple === true && quali.dati.accessi.steam === false, quali.dati.accessi);

    console.log("\ni sospetti e le sanzioni");
    const visti = await chiama("/api/sospetti", { testate: { "x-admin": ADMIN } });
    const suoi = visti.dati.sospetti.filter(x => x.artista_id === io1);
    controlla("il salto da quaranta milioni ha lasciato un sospetto pesante",
      suoi.length >= 1 && suoi[0].tipo === "impossibile" && suoi[0].peso === 5, suoi[0]);
    controlla("e nel sospetto c'è scritto cosa aveva chiesto e cosa poteva",
      suoi[0].dettaglio.chiesto === 40000000 && suoi[0].dettaglio.tetto > 0, suoi[0].dettaglio);
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
    if(PG){
      /* `VACUUM INTO` e' di SQLite: con PostgreSQL sotto, `copia.js` deve
         dirlo e fermarsi, non fare finta di aver copiato qualcosa. */
      const copia = spawnSync(process.execPath, [path.join(__dirname, "database", "copia.js")],
        { encoding: "utf8", env: Object.assign({}, process.env, { ADF_PG: PG }) });
      controlla("con PostgreSQL la copia si tira indietro invece di mentire", copia.status === 1);
      controlla("e dice come si fa davvero (pg_dump)",
        /pg_dump/.test(copia.stderr || ""), (copia.stderr || "").slice(0, 160));
    } else {
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
    }

    console.log("\nil database");
    if(PG){
      const { Client } = require("pg");
      clientePg = new Client({ connectionString: pgConSchema(PG) });
      await clientePg.connect();
      const tab = await guarda("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = '" + SCHEMA + "'");
      controlla("le tabelle sono nate nello schema della prova", tab[0].n >= 20, tab[0]);
    } else {
      controlla("il file del database esiste", fs.existsSync(FILE));
    }
    const chiavi = await guarda("SELECT chiave_hash FROM artista WHERE chiave_hash IS NOT NULL");
    controlla("le chiavi stanno solo come hash",
      chiavi.every(r => r.chiave_hash.length === 64 && r.chiave_hash !== chiave1), chiavi.length);
    const segreti = await guarda("SELECT segreto_hash FROM identita WHERE segreto_hash IS NOT NULL");
    controlla("le password stanno solo come scrypt",
      segreti.every(r => r.segreto_hash.startsWith("scrypt$")));
    const storia = await guarda("SELECT count(*) n FROM punteggio_settimana");
    controlla("lo storico dei punteggi si riempie", Number(storia[0].n) > 0, storia[0]);
    const foto = await guarda("SELECT count(*) n FROM classifica_posizione");
    controlla("e le fotografie della classifica anche", Number(foto[0].n) > 0, foto[0]);
    const ritirato = await guarda("SELECT nome, account_id, ritirato FROM artista WHERE nome LIKE 'Artista ritirato%'");
    controlla("l'artista di chi ha cancellato resta senza nome e senza padrone",
      ritirato.length === 0 || ritirato.every(r => r.account_id === null && r.ritirato), ritirato);

    /* I due schemi devono restare allineati: se qualcuno aggiunge una
       migrazione a SQLite e si scorda PostgreSQL, se ne accorge qui e non fra
       sei mesi in produzione. */
    const soloSqlite = fs.readdirSync(path.join(__dirname, "database", "migrazioni")).filter(f => f.endsWith(".sql")).sort();
    const soloPg = fs.readdirSync(path.join(__dirname, "database", "migrazioni-pg")).filter(f => f.endsWith(".sql")).sort();
    controlla("i due schemi hanno le stesse migrazioni, con lo stesso nome",
      soloSqlite.join(",") === soloPg.join(","), { sqlite: soloSqlite, postgres: soloPg });

    /* La traduzione dei segnaposto e' il pezzo dell'adattatore PostgreSQL dove
       un errore non si vede: la query parte lo stesso e chiede la cosa
       sbagliata. E' pura, quindi si prova qui, con o senza PostgreSQL sotto. */
    console.log("\nda `?` a `$1` (l'adattatore PostgreSQL)");
    const { traduci } = require("./database/postgres.js");
    controlla("i segnaposto si numerano in ordine",
      traduci("SELECT * FROM t WHERE a = ? AND b = ?") === "SELECT * FROM t WHERE a = $1 AND b = $2",
      traduci("SELECT * FROM t WHERE a = ? AND b = ?"));
    controlla("tanti segnaposto di fila",
      traduci("INSERT INTO t VALUES (?,?,?,?)") === "INSERT INTO t VALUES ($1,$2,$3,$4)",
      traduci("INSERT INTO t VALUES (?,?,?,?)"));
    controlla("un punto interrogativo dentro a una stringa non e' un parametro",
      traduci("SELECT '?' FROM t WHERE a = ?") === "SELECT '?' FROM t WHERE a = $1",
      traduci("SELECT '?' FROM t WHERE a = ?"));
    controlla("l'apice raddoppiato dentro a una stringa non rompe il conto",
      traduci("SELECT 'l''artista?' FROM t WHERE a = ? AND b = ?")
        === "SELECT 'l''artista?' FROM t WHERE a = $1 AND b = $2",
      traduci("SELECT 'l''artista?' FROM t WHERE a = ? AND b = ?"));
    controlla("nemmeno dentro a un nome fra virgolette",
      traduci('SELECT "col?" FROM t WHERE a = ?') === 'SELECT "col?" FROM t WHERE a = $1',
      traduci('SELECT "col?" FROM t WHERE a = ?'));
    controlla("una query senza parametri resta identica",
      traduci("SELECT count(*) n FROM artista") === "SELECT count(*) n FROM artista");

  }catch(e){
    falliti++;
    console.log("\n  esploso: " + (e && e.stack || e));
  }finally{
    figlio.kill();
    try{ apple.banchetto.close(); }catch(e){}
    await schemaVia();
    if(!process.env.ADF_TIENI) for(const f of [FILE, FILE + "-wal", FILE + "-shm"]) try{ fs.unlinkSync(f); }catch(e){}
    else console.log("database tenuto: " + FILE);
  }

  console.log("\n" + passati + " a posto, " + falliti + " no.\n");
  process.exit(falliti ? 1 : 0);
})();
