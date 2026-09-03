/* Anni di Fame — il server (punti 30, 35, 37 di implementazioni.md).

   Tiene tre cose:
   - **la classifica**, una sola per tutti, con dentro i giocatori veri e i bot
     mescolati e indistinguibili;
   - **gli account**, perché su Steam e sugli store del telefono la gente
     reinstalla, cambia telefono e pretende — giustamente — di ritrovare la
     propria roba;
   - **i salvataggi in cloud**, che è quello che porta una carriera dal PC al
     telefono.

   Sotto c'è SQLite (`database/`), senza niente da installare. Il server non sa
   che database sia: parla solo con `database/archivio.js`.

     npm start

   Manopole (tutte con un valore sensato di suo):
     ADF_PORTA        porta di ascolto              (8787)
     ADF_DATI         file del database             (backend/database/dati/classifica.db)
     ADF_BOT          quanti bot tenere in pista    (140)
     ADF_SETTIMANA_H  ore vere di una settimana     (24)
     ADF_ORIGINI      CORS: * oppure lista di origini separate da virgola
     ADF_ADMIN        chiave per le rotte di servizio (se vuota, sono chiuse)
     ADF_SALE         sale per gli hash degli indirizzi IP
     ADF_INVIO_MS     quanto passa fra due punteggi dello stesso artista (10000)
     ADF_PROXY        1 se davanti c'e' un reverse proxy nostro (legge x-forwarded-for)
     ADF_BUSSATE      richieste al minuto da uno stesso indirizzo (120)
     ADF_PG           se c'e', sotto va PostgreSQL invece di SQLite:
                      postgresql://utente:password@host:5432/anni_di_fame
   Le manopole si possono anche mettere in `.env.local` (vedi ambiente.js).
   Per entrare con Steam, Apple e Google servono le loro chiavi: vedi accessi.js.
*/
"use strict";

/* prima di tutto: le manopole che stanno in `.env.local` (fuori da git).
   Chi le ha gia' nell'ambiente vero vince — vedi ambiente.js. */
require("./ambiente.js").carica();

const http = require("http");
const path = require("path");
const crypto = require("crypto");
const archivio = require("./database/archivio.js");
const { GENERI, CITTA, STORIE, scegli } = require("./nomi.js");
const accessi = require("./accessi.js");
const moderazione = require("./moderazione.js");

const CFG = {
  porta: Number(process.env.ADF_PORTA || 8787),
  file: process.env.ADF_DATI || path.join(__dirname, "database", "dati", "classifica.db"),
  quantiBot: Math.max(0, Number(process.env.ADF_BOT || 140)),
  settimanaMs: Math.max(1, Number(process.env.ADF_SETTIMANA_H || 24)) * 3600e3,
  origini: process.env.ADF_ORIGINI || "*",
  admin: process.env.ADF_ADMIN || "",
  sale: process.env.ADF_SALE || "anni-di-fame",
  /* quanto deve passare fra due punteggi dello stesso artista: in prova si
     mette a zero, in casa e online resta com'è */
  invioMs: Math.max(0, Number(process.env.ADF_INVIO_MS != null ? process.env.ADF_INVIO_MS : 10000)),
  /* dietro a un reverse proxy l'indirizzo di chi chiama e' quello del proxy:
     x-forwarded-for si legge SOLO se siamo noi ad averlo messo davanti, se no
     chiunque puo' scriverci dentro quello che vuole e saltare i freni */
  dietroProxy: process.env.ADF_PROXY === "1",
  /* quante richieste al minuto da uno stesso indirizzo. Era murato a 120, e
     `prova.js` — che fa tutto il giro da una macchina sola — ci arrivava a un
     paio di richieste di distanza: la prova successiva che qualcuno aggiungeva
     faceva cadere prove che non c'entravano niente, con un 429 al posto della
     risposta. Adesso e' una manopola come le altre, e la prova se la alza. */
  bussateAlMinuto: Math.max(1, Number(process.env.ADF_BUSSATE || 120))
};


/* ==================== ATTREZZI ==================== */
/* Un parametro che non c'è **non è zero**: è assente, e vale il valore di suo.
   `Number(null)` fa 0 e 0 è un numero buono, quindi senza questo controllo
   `?quanti` non passato diventava 1 invece di 10 — un bug che si vedeva solo
   nelle rotte chiamate senza parametri. L'ha trovato la prova. */
const nInt = (v, min, max, dif) => {
  if(v == null || v === "") return dif;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dif;
};
const INVISIBILI = /[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\ufeff]/g;
function nomePulito(v, quanto){
  const s = String(v == null ? "" : v).replace(INVISIBILI, "").replace(/\s+/g, " ").trim()
    .slice(0, quanto || 22);
  return s.length >= 2 ? s : "";
}
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
function indirizzo(req){
  if(CFG.dietroProxy){
    const avanti = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if(avanti) return avanti;
  }
  return req.socket.remoteAddress || "?";
}
const ipHash = req => archivio.sha(CFG.sale + "|" + indirizzo(req)).slice(0, 32);

/* ==================== FRENI ==================== */
const bussate = new Map();
function troppe(ip){
  const ora = Date.now(), b = bussate.get(ip);
  if(!b || ora - b.t > 60e3){ bussate.set(ip, { t: ora, n: 1 }); return false; }
  b.n++;
  return b.n > CFG.bussateAlMinuto;
}
setInterval(() => {
  const ora = Date.now();
  for(const [ip, b] of bussate) if(ora - b.t > 120e3) bussate.delete(ip);
}, 120e3).unref();

/* ==================== RISPOSTE ==================== */
function invia(res, codice, corpoRisposta){
  const testo = JSON.stringify(corpoRisposta);
  res.writeHead(codice, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(testo),
    "cache-control": "no-store"
  });
  res.end(testo);
}
const male = (res, codice, errore, extra) => invia(res, codice, Object.assign({ errore }, extra || {}));

function corpo(req){
  return new Promise((ok, no) => {
    let dato = "", troppo = false;
    req.on("data", c => {
      dato += c;
      /* i salvataggi in cloud sono più grossi di una richiesta normale: il
         tetto vero (2 MB) lo mette l'archivio, qui si tiene largo ma finito */
      if(dato.length > 3e6 && !troppo){ troppo = true; no(new Error("corpo troppo grande")); req.destroy(); }
    });
    req.on("end", () => { if(troppo) return; try{ ok(dato ? JSON.parse(dato) : {}); }catch(e){ no(new Error("json non valido")); } });
    req.on("error", no);
  });
}

/* ==================== CHI SEI ==================== */
const chi = async req => archivio.sessione(req.headers["x-sessione"] || "");

/* Steam, Apple e Google mandano un biglietto firmato da loro: la verifica sta
   in `accessi.js`. Qui si traduce la risposta in un errore HTTP che dice la
   verità — `501` se siamo noi a non avere le chiavi, `403` se il biglietto è
   sbagliato. Non c'è nessun caso in cui si entra senza verifica. */
async function conBiglietto(res, tipo, biglietto){
  const r = await accessi.verifica(tipo, biglietto);
  if(r.id) return r.id;
  if(r.chiuso){ male(res, 501, "accesso-non-ancora-collegato", { nota: r.chiuso }); return null; }
  male(res, 403, r.no || "biglietto-rifiutato");
  return null;
}

/* Il vecchio modo di farsi riconoscere: id dell'artista + chiave, come prima
   degli account. Resta acceso perché i client già in giro continuino a
   funzionare — e perché da lì ci si può prendere una sessione vera. */
async function artistaMio(req, id){
  const s = await chi(req);
  const a = await archivio.artistaGrezzo(id);
  if(!a || a.bot || a.ritirato) return null;
  if(s && a.account_id && a.account_id === s.account.id) return a;
  const chiave = req.headers["x-chiave"] || "";
  if(chiave && a.chiave_hash && a.chiave_hash === archivio.sha(chiave)) return a;
  return null;
}

/* ==================== LE ROTTE ==================== */
async function rotta(req, res, url){
  const p = url.pathname.replace(/\/+$/, "") || "/";
  const q = url.searchParams;
  const M = (metodo, schema) => req.method === metodo && new RegExp("^" + schema + "$").test(p);
  const pezzo = i => p.split("/")[i];

  /* ---------- il mondo ---------- */
  if(M("GET", "/api/stato")){
    const s = await archivio.stato();
    return invia(res, 200, Object.assign({ ok: true, settimanaOre: CFG.settimanaMs / 3600e3,
      accessi: accessi.collegati() }, s));
  }

  /* il feed di LaFamegram: i post del mondo, più quelli che riguardano te */
  if(M("GET", "/api/feed")){
    const s = await chi(req);
    const ioId = s ? ((await archivio.artistiDi(s.account.id))[0] || {}).id : String(q.get("io") || "");
    return invia(res, 200, {
      settimana: await archivio.settimanaCorrente(),
      post: await archivio.feed(ioId || null, nInt(q.get("quanti"), 1, 60, 20))
    });
  }

  /* gli opps: chi ti sta appena sopra, e chi ti sei preso come rivale */
  if(M("GET", "/api/opps")){
    const s = await chi(req);
    const ioId = s ? ((await archivio.artistiDi(s.account.id))[0] || {}).id : String(q.get("io") || "");
    if(!ioId || !await archivio.artistaGrezzo(ioId)) return male(res, 404, "artista-sconosciuto");
    return invia(res, 200, await archivio.opps(ioId, nInt(q.get("quanti"), 1, 10, 3)));
  }

  if(M("POST", "/api/relazione")){
    const b = await corpo(req);
    const mio = String(b.artistaId || "");
    if(!await artistaMio(req, mio)) return male(res, 403, "non-e-tuo");
    if(b.tipo === "rimuovi"){
      await archivio.scancella(mio, String(b.altroId || ""), String(b.era || "rivale"));
      return invia(res, 200, { ok: true });
    }
    const r = await archivio.dichiara(mio, String(b.altroId || ""), String(b.tipo || "rivale"),
      nomePulito(b.nota, 140));
    return r ? invia(res, 200, r) : male(res, 400, "relazione-non-valida");
  }

  if(M("GET", "/api/notizie")){
    return invia(res, 200, { settimana: await archivio.settimanaCorrente(),
      notizie: await archivio.notizie(nInt(q.get("quante"), 1, 60, 10)) });
  }

  /* ---------- account e sessioni ---------- */
  if(M("POST", "/api/account")){
    const b = await corpo(req);
    const tipo = ["ospite", "email", "steam", "apple", "google"].indexOf(b.tipo) >= 0 ? b.tipo : "ospite";
    let idEsterno = null;

    if(tipo === "email"){
      const email = String(b.email || "").trim().toLowerCase();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return male(res, 400, "email-non-valida");
      if(String(b.segreto || "").length < 8) return male(res, 400, "segreto-troppo-corto");
      /* «esiste già?» e «la password è giusta?» sono due domande diverse.
         Prima si chiedeva la seconda: chi riprovava con la stessa mail e una
         password sbagliata passava il controllo, arrivava all'INSERT e si
         prendeva un 500 con lo stack nei log, invece del 409 che gli spiegava
         cos'era successo. L'unico che conta qui è se la mail è già presa. */
      if(await archivio.identitaEsiste("email", email)) return male(res, 409, "email-gia-usata");
      idEsterno = email;
    } else if(tipo === "ospite"){
      idEsterno = crypto.randomUUID();
    } else {
      idEsterno = await conBiglietto(res, tipo, b.biglietto);
      if(!idEsterno) return;                        // la risposta l'ha già mandata conBiglietto
      const gia = await archivio.entra(tipo, idEsterno, null);
      if(gia) return invia(res, 200, { account: gia, token: await archivio.apriSessione(gia.id, b.dispositivo) });
    }

    const acc = await archivio.creaAccount({ tipo, idEsterno, segreto: b.segreto, email: tipo === "email" ? idEsterno : null });
    const token = await archivio.apriSessione(acc.id, b.dispositivo);
    return invia(res, 201, { account: acc, identita: { tipo, idEsterno: tipo === "ospite" ? idEsterno : undefined }, token });
  }

  if(M("POST", "/api/sessione")){
    const b = await corpo(req);
    /* dal vecchio mondo: chi ha ancora solo id artista + chiave si prende una
       sessione vera senza perdere niente */
    if(b.tipo === "legacy"){
      const a = await archivio.artistaGrezzo(String(b.artistaId || ""));
      if(!a || !a.chiave_hash || a.chiave_hash !== archivio.sha(b.chiave || ""))
        return male(res, 403, "chiave-sbagliata");
      if(!a.account_id) return male(res, 409, "artista-senza-account");
      return invia(res, 200, { account: await archivio.account(a.account_id),
        token: await archivio.apriSessione(a.account_id, b.dispositivo) });
    }
    if(["steam", "apple", "google"].indexOf(b.tipo) >= 0){
      const idEsterno = await conBiglietto(res, b.tipo, b.biglietto);
      if(!idEsterno) return;
      const acc = await archivio.entra(b.tipo, idEsterno, null);
      if(!acc) return male(res, 404, "account-sconosciuto");
      return invia(res, 200, { account: acc, token: await archivio.apriSessione(acc.id, b.dispositivo) });
    }
    const idEsterno = b.tipo === "email" ? String(b.email || "").trim().toLowerCase() : String(b.idEsterno || "");
    const acc = await archivio.entra(b.tipo === "email" ? "email" : "ospite", idEsterno, b.segreto);
    if(!acc) return male(res, 403, "non-torna");
    return invia(res, 200, { account: acc, token: await archivio.apriSessione(acc.id, b.dispositivo) });
  }

  if(M("DELETE", "/api/sessione")){
    const t = req.headers["x-sessione"] || "";
    if(!await archivio.sessione(t)) return male(res, 403, "sessione-scaduta");
    await archivio.chiudiSessione(t);
    return invia(res, 200, { ok: true });
  }

  /* tutto quello che sei: account, artisti, salvataggi, traguardi */
  if(M("GET", "/api/io")){
    const s = await chi(req);
    if(!s) return male(res, 403, "sessione-scaduta");
    const artisti = await archivio.artistiDi(s.account.id);
    return invia(res, 200, {
      account: s.account, dispositivo: s.dispositivo, artisti,
      carriere: await archivio.carriere(s.account.id),
      traguardi: artisti.length ? await archivio.traguardiDi(artisti[0].id) : []
    });
  }

  /* La cancellazione dell'account, quella che Apple e Google pretendono dentro
     al gioco. Non cancella la storia della classifica: toglie il nome e tutto
     quello che è personale. */
  if(M("DELETE", "/api/account")){
    const s = await chi(req);
    if(!s) return male(res, 403, "sessione-scaduta");
    const b = await corpo(req).catch(() => ({}));
    if(b.conferma !== "cancella") return male(res, 400, "serve-la-conferma",
      { nota: 'manda {"conferma":"cancella"}' });
    const r = await archivio.cancellaAccount(s.account.id);
    return invia(res, 200, { ok: true, artistiRitirati: r.artisti });
  }

  /* ---------- gli artisti ---------- */
  if(M("POST", "/api/artista")){
    const b = await corpo(req);
    const nome = nomePulito(b.nome);
    if(!nome) return male(res, 400, "nome-non-valido");
    const brutto = moderazione.controllaNome(nome);
    if(brutto) return male(res, 400, brutto.no);
    if(!await archivio.nomeLibero(nome)) return male(res, 409, "nome-occupato");

    let s = await chi(req), token = null;
    if(!s){
      /* nessuna sessione: si apre un account da ospite al volo, così chi gioca
         non deve compilare niente per entrare in classifica */
      const acc = await archivio.creaAccount({ tipo: "ospite", idEsterno: crypto.randomUUID() });
      token = await archivio.apriSessione(acc.id, b.dispositivo);
      s = { account: acc };
    }
    if((await archivio.artistiDi(s.account.id)).length >= 3) return male(res, 409, "troppi-artisti");

    /* la chiave vecchio stile: torna una volta sola e fa funzionare i client
       che ancora non sanno cosa sia una sessione */
    const chiave = crypto.randomBytes(24).toString("hex");
    const a = await archivio.iscriviArtista({
      accountId: s.account.id, nome,
      citta: nomePulito(b.citta) || scegli(CITTA),
      genere: GENERI.indexOf(b.genere) >= 0 ? b.genere : scegli(GENERI),
      storia: nomePulito(b.storia, 120) || scegli(STORIE),
      seed: nInt(b.seed, 0, 2e9, Math.floor(Math.random() * 1e9)),
      difficolta: b.difficolta,
      chiaveHash: archivio.sha(chiave)
    });
    return invia(res, 201, Object.assign({}, a, { chiave, token: token || undefined }));
  }

  if(M("GET", "/api/artista/" + UUID)){
    const a = await archivio.schedaConPosizione(pezzo(3), null);
    return a ? invia(res, 200, a) : male(res, 404, "artista-sconosciuto");
  }

  if(M("PUT", "/api/artista/" + UUID)){
    const id = pezzo(3);
    if(!await artistaMio(req, id)) return male(res, 403, "non-e-tuo");
    const b = await corpo(req);
    if(b.nome != null){
      const nome = nomePulito(b.nome);
      if(!nome) return male(res, 400, "nome-non-valido");
      const brutto = moderazione.controllaNome(nome);
      if(brutto) return male(res, 400, brutto.no);
      if(!await archivio.nomeLibero(nome, id)) return male(res, 409, "nome-occupato");
      b.nome = nome;
    }
    if(b.citta != null) b.citta = nomePulito(b.citta);
    if(b.genere != null && GENERI.indexOf(b.genere) < 0) delete b.genere;
    return invia(res, 200, await archivio.aggiornaArtista(id, b));
  }

  if(M("POST", "/api/punteggio")){
    const b = await corpo(req);
    const id = String(b.id || "");
    const a = await artistaMio(req, id);
    if(!a) return male(res, 403, "non-e-tuo");
    if(Date.now() - (a.punteggio || 0) < CFG.invioMs) return male(res, 429, "troppo-in-fretta");
    const sanzione = await archivio.sanzioneAttiva(a.account_id);
    if(sanzione && sanzione.tipo === "sospensione")
      return male(res, 403, "account-sospeso", { motivo: sanzione.motivo });
    const r = await archivio.segnaPunteggio(id, {
      stream: b.stream, fan: nInt(b.fan, 0, 5e7, null), livello: nInt(b.livello, 1, 60, null),
      fase: nInt(b.fase, 0, 8, null), uscite: nInt(b.uscite, 0, 5000, null), deal: b.deal,
      ultima: b.ultima != null ? nomePulito(b.ultima, 60) : null, seed: nInt(b.seed, 0, 2e9, null),
      difficolta: b.difficolta
    }, ipHash(req));
    return r ? invia(res, 200, r) : male(res, 404, "artista-sconosciuto");
  }

  /* ---------- la classifica ---------- */
  if(M("GET", "/api/classifica")){
    /* i filtri: «?citta=Rovereto» o «?genere=trap». La posizione si conta
       dentro al filtro — sei 3° a Rovereto, non 428° con un'etichetta sopra */
    const filtro = {
      citta: nomePulito(q.get("citta"), 40) || null,
      genere: GENERI.indexOf(q.get("genere")) >= 0 ? q.get("genere") : null,
      /* «?difficolta=niente-sconti»: guardare la classifica di chi corre con le
         stesse regole tue. La graduatoria di suo resta **una sola per tutti** —
         qui si filtra una vista, non si spacca il gioco in tre. */
      difficolta: archivio.DIFFICOLTA.indexOf(q.get("difficolta")) >= 0 ? q.get("difficolta") : null
    };
    return invia(res, 200, await archivio.classifica(
      nInt(q.get("da"), 1, 100000, 1), nInt(q.get("quanti"), 1, 200, 10),
      String(q.get("io") || ""), filtro));
  }

  /* le città e i generi che hanno davvero gente dentro */
  if(M("GET", "/api/classifiche")){
    return invia(res, 200, { citta: await archivio.cittaInGioco(), generi: await archivio.generiInGioco() });
  }

  /* ---------- le stagioni ---------- */
  if(M("GET", "/api/stagioni")){
    return invia(res, 200, { corrente: await archivio.stagioneCorrente(), tutte: await archivio.stagioni() });
  }

  if(M("GET", "/api/albo")){
    const s = q.get("stagione");
    return invia(res, 200, { albo: await archivio.albo(s ? nInt(s, 1, 9999, null) : null) });
  }

  if(M("GET", "/api/classifica/intorno/" + UUID)){
    const id = pezzo(4);
    if(!await archivio.artistaGrezzo(id)) return male(res, 404, "artista-sconosciuto");
    return invia(res, 200, await archivio.intorno(id, nInt(q.get("raggio"), 1, 25, 4)));
  }

  /* ---------- i salvataggi in cloud ---------- */
  if(M("GET", "/api/carriere")){
    const s = await chi(req);
    if(!s) return male(res, 403, "sessione-scaduta");
    return invia(res, 200, { carriere: await archivio.carriere(s.account.id) });
  }

  if(M("GET", "/api/carriera/[123]")){
    const s = await chi(req);
    if(!s) return male(res, 403, "sessione-scaduta");
    const c = await archivio.carriera(s.account.id, Number(pezzo(3)));
    return c ? invia(res, 200, c) : male(res, 404, "slot-vuoto");
  }

  if(M("PUT", "/api/carriera/[123]")){
    const s = await chi(req);
    if(!s) return male(res, 403, "sessione-scaduta");
    const b = await corpo(req);
    if(!b.stato || typeof b.stato !== "object") return male(res, 400, "stato-mancante");
    /* L'artista attaccato allo slot deve essere tuo. Prima ci si fidava del
       corpo della richiesta: un id inventato arrivava fino alla chiave esterna
       e tornava un 500, e l'id di un altro giocatore veniva accettato — la sua
       carriera in cloud restava legata a un artista che non era suo, e il
       giorno che quello cancellava l'account si portava via anche il legame. */
    if(b.artistaId != null && b.artistaId !== ""){
      const suo = await archivio.artistaGrezzo(String(b.artistaId));
      if(!suo || suo.account_id !== s.account.id) return male(res, 403, "non-e-tuo");
    }
    const r = await archivio.salvaCarriera(s.account.id, Number(pezzo(3)), b);
    if(r.errore) return male(res, 413, r.errore);
    if(r.conflitto) return invia(res, 409, { errore: "carriera-piu-avanti", salvata: r.salvata,
      nota: "in cloud c'è una partita più avanti: manda forza=true per sovrascriverla" });
    return invia(res, 200, r);
  }

  /* ---------- i traguardi ---------- */
  if(M("GET", "/api/traguardi")) return invia(res, 200, { traguardi: await archivio.catalogo() });

  if(M("GET", "/api/traguardi/" + UUID))
    return invia(res, 200, { traguardi: await archivio.traguardiDi(pezzo(3)) });

  if(M("POST", "/api/traguardo")){
    const b = await corpo(req);
    if(!await artistaMio(req, String(b.artistaId || ""))) return male(res, 403, "non-e-tuo");
    const codice = String(b.codice || "");
    /* i traguardi che il server sa controllare da sé non si chiedono: se li dà
       lui, quando i numeri ci sono. Se no basterebbe la console del browser */
    if(archivio.CODICI_DAL_SERVER.indexOf(codice) >= 0)
      return male(res, 409, "questo-lo-da-il-server",
        { nota: "arriva da solo quando i numeri ci sono" });
    const r = await archivio.daiTraguardo(String(b.artistaId), codice);
    return r ? invia(res, 200, r) : male(res, 404, "traguardo-sconosciuto");
  }

  /* ---------- segnalare un nome ---------- */
  if(M("POST", "/api/segnalazione")){
    const s = await chi(req);
    if(!s) return male(res, 403, "sessione-scaduta");
    const b = await corpo(req);
    const r = await archivio.segnala(String(b.artistaId || ""), s.account.id,
      String(b.motivo || "nome"), nomePulito(b.nota, 300));
    if(!r) return male(res, 404, "artista-sconosciuto");
    return invia(res, 200, r.gia ? { gia: true } : { ok: true });
  }

  /* ---------- servizio (serve ADF_ADMIN) ---------- */
  const admin = () => CFG.admin && (req.headers["x-admin"] || "") === CFG.admin;

  if(M("POST", "/api/giro")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    const quante = await archivio.giroSettimana();
    return invia(res, 200, { ok: true, settimana: await archivio.settimanaCorrente(), notizie: quante });
  }

  if(M("POST", "/api/stagione/chiudi")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    const b = await corpo(req).catch(() => ({}));
    const r = await archivio.chiudiStagione(nInt(b.quanti, 1, 1000, 100));
    return r ? invia(res, 200, r) : male(res, 409, "nessuna-stagione-aperta");
  }

  if(M("GET", "/api/sospetti")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    return invia(res, 200, { sospetti: await archivio.sospetti(nInt(q.get("quanti"), 1, 200, 50)) });
  }

  if(M("POST", "/api/sanzione")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    const b = await corpo(req);
    const r = await archivio.sanziona(String(b.accountId || ""), String(b.tipo || ""),
      nomePulito(b.motivo, 200) || "nessun motivo scritto", nInt(b.giorni, 0, 3650, 0));
    return r ? invia(res, 200, r) : male(res, 400, "sanzione-non-valida");
  }

  if(M("GET", "/api/da-guardare")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    return invia(res, 200, { artisti: await archivio.daGuardare(nInt(q.get("quanti"), 1, 100, 30)) });
  }

  if(M("POST", "/api/moderazione")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    const b = await corpo(req);
    const id = String(b.artistaId || "");
    if(b.azione === "rinomina"){
      const r = await archivio.rinominaDufficio(id);
      return r ? invia(res, 200, r) : male(res, 404, "artista-sconosciuto");
    }
    if(b.azione === "respingi"){
      await archivio.chiudiSegnalazioni(id, "respinta");
      return invia(res, 200, { ok: true });
    }
    return male(res, 400, "azione-sconosciuta", { nota: "rinomina oppure respingi" });
  }

  if(M("GET", "/api/da-spingere")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    return invia(res, 200, { traguardi: await archivio.daSpingere() });
  }

  if(M("POST", "/api/spinto")){
    if(!admin()) return male(res, 403, "non-sei-tu");
    const b = await corpo(req);
    await archivio.segnaSpinto(String(b.artistaId || ""), String(b.codice || ""));
    return invia(res, 200, { ok: true });
  }

  return male(res, 404, "rotta-sconosciuta");
}

/* ==================== IL SERVER ==================== */
const server = http.createServer(async (req, res) => {
  const origine = req.headers.origin || "";
  const permessa = CFG.origini === "*" ? "*"
    : (CFG.origini.split(",").map(s => s.trim()).indexOf(origine) >= 0 ? origine : "");
  if(permessa) res.setHeader("access-control-allow-origin", permessa);
  res.setHeader("vary", "origin");

  if(req.method === "OPTIONS"){
    res.writeHead(204, {
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
      "access-control-allow-headers": "content-type, x-chiave, x-sessione, x-admin",
      "access-control-max-age": "86400"
    });
    return res.end();
  }

  if(troppe(indirizzo(req))) return male(res, 429, "troppe-richieste");

  let url;
  try{ url = new URL(req.url, "http://" + (req.headers.host || "localhost")); }
  catch(e){ return male(res, 400, "url-non-valido"); }

  try{ await archivio.assicuraSettimana(); }
  catch(e){ console.error("[settimana] " + e.message); }

  rotta(req, res, url).catch(e => {
    if(res.headersSent) return;
    const suo = e && /json|corpo/.test(e.message);
    if(!suo) console.error("[errore] " + (e && e.stack || e));
    male(res, suo ? 400 : 500, suo ? e.message : "errore-del-server");
  });
});

/* Prima il database, poi la porta: se il database non si apre non si deve
   nemmeno cominciare ad ascoltare, o le prime richieste prendono un errore
   invece di una risposta. */
async function avvia(){
  const M = await archivio.apri(CFG);
  const s = await archivio.stato();
  await new Promise(fatto => server.listen(CFG.porta, fatto));
  console.log("Anni di Fame — il server su http://localhost:" + CFG.porta);
  console.log("  database:   " + (M.nome === "postgres" ? "PostgreSQL" : CFG.file));
  console.log("  in pista:   " + s.artisti + " artisti (" + s.giocatori + " giocatori veri)");
  console.log("  account:    " + s.account + ", salvataggi in cloud: " + s.carriere);
  console.log("  settimana:  " + s.settimana + ", la prossima fra " +
    Math.max(0, Math.round((s.prossimoGiro - Date.now()) / 60000)) + " minuti");
}

avvia().catch(e => {
  console.error("il server non è partito: " + (e && e.message || e));
  process.exit(1);
});

for(const segnale of ["SIGINT", "SIGTERM"]){
  process.on(segnale, () => {
    /* si chiude il database prima di uscire, ma non si aspetta all'infinito:
       se non si chiude in due secondi si esce lo stesso */
    const fine = () => { console.log("\nchiuso. alla prossima."); process.exit(0); };
    setTimeout(fine, 2000).unref();
    archivio.chiudi().then(fine, fine);
  });
}
