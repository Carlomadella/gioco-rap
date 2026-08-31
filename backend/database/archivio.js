/* Lo strato dati: l'unico file del server che sa che sotto c'è un database.

   Prima era un file JSON tenuto in memoria; adesso è SQLite. Il server non se
   n'è accorto: le funzioni si chiamano come prima e fanno le stesse cose, più
   quelle che gli account e i salvataggi si sono portati dietro. Il giorno che
   sotto ci sarà PostgreSQL, si riscrive questo file e basta — è il motivo per
   cui esiste.

   Le regole che valgono in tutto il file e che non si toccano:
   - `bot` e le chiavi **non escono mai** da qui verso una risposta: passa tutto
     da `riga()`, che le lascia dentro;
   - gli id sono uuid casuali per tutti, bot compresi;
   - `classifica_posizione` si scrive **solo** nel giro di settimana: è la
     fotografia del «prima», ed è da lì che escono le frecce. */
"use strict";

const crypto = require("crypto");
const { apri: apriDb, attrezzi } = require("./db.js");
const { nuovoBot, popolazione, settimanaBot, ricambio } = require("../bot.js");

let A = null;                                   // gli attrezzi del database
let CFG = { quantiBot: 140, settimanaMs: 24 * 3600e3 };

const ora = () => Date.now();
const uuid = () => crypto.randomUUID();
const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");

/* i segreti (password, chiavi di dispositivo) si salvano con scrypt e un sale
   loro: due account con la stessa password hanno hash diversi */
function impasta(segreto){
  const sale = crypto.randomBytes(16).toString("hex");
  return "scrypt$" + sale + "$" + crypto.scryptSync(String(segreto), sale, 32).toString("hex");
}
function combacia(segreto, impastato){
  if(!impastato) return false;
  const [tipo, sale, atteso] = String(impastato).split("$");
  if(tipo !== "scrypt" || !sale || !atteso) return false;
  const mio = crypto.scryptSync(String(segreto), sale, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(mio, "hex"), Buffer.from(atteso, "hex"));
}

/* ==================== APERTURA ==================== */
function apri(cfg){
  CFG = Object.assign(CFG, cfg || {});
  A = attrezzi(apriDb(CFG.file));
  primaVolta();
  return A;
}
function chiudi(){ if(A){ A.chiudi(); A = null; } }

const leggiStato = (chiave, dif) => {
  const r = A.uno("SELECT valore FROM stato WHERE chiave = ?", chiave);
  return r ? r.valore : dif;
};
const scriviStato = (chiave, valore) =>
  A.fai("INSERT INTO stato (chiave, valore) VALUES (?, ?) " +
        "ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore", chiave, String(valore));

/* La prima accensione: una stagione, una settimana, e la gente che fa numero. */
function primaVolta(){
  if(!A.uno("SELECT id FROM stagione LIMIT 1")){
    A.fai("INSERT INTO stagione (nome, inizio, stato) VALUES (?, ?, 'corrente')", "Prima stagione", ora());
  }
  if(!A.uno("SELECT numero FROM settimana LIMIT 1")){
    const s = A.uno("SELECT id FROM stagione WHERE stato = 'corrente' ORDER BY id DESC LIMIT 1");
    A.fai("INSERT INTO settimana (numero, stagione_id, iniziata) VALUES (1, ?, ?)", s.id, ora());
    scriviStato("prossimo_giro", ora() + CFG.settimanaMs);
  }
  const quanti = A.uno("SELECT count(*) n FROM artista WHERE bot = 1 AND ritirato IS NULL").n;
  if(quanti === 0 && CFG.quantiBot > 0){
    const usati = new Set(A.tutti("SELECT nome FROM artista").map(r => r.nome.toLowerCase()));
    A.insieme(() => { for(const b of popolazione(CFG.quantiBot, usati)) inserisciBot(b); });
    console.log("[db] messi in pista " + CFG.quantiBot + " artisti");
  }
  seminaTraguardi();
}

/* Il catalogo dei traguardi: quelli che poi vanno spinti su Steam e sugli
   store del telefono. I codici sono definitivi — cambiarli vuol dire togliere
   un traguardo a chi ce l'ha già. */
const TRAGUARDI = [
  ["primo_pezzo", "Il primo pezzo", "Hai pubblicato la tua prima canzone."],
  ["primi_mille", "Mille ascolti", "Mille stream in una settimana."],
  ["in_classifica", "Dentro la classifica", "Sei entrato in classifica."],
  ["top_100", "Top 100", "Sei arrivato nei primi cento."],
  ["top_10", "Top 10", "Sei arrivato nei primi dieci."],
  ["primo_posto", "Primo", "Sei arrivato primo in classifica."],
  ["disco_oro", "Disco d'oro", "Un pezzo ha passato i 50.000 ascolti."],
  ["disco_platino", "Disco di platino", "Un pezzo ha passato i 500.000 ascolti."],
  ["primo_contratto", "La firma", "Hai firmato il primo contratto."],
  ["dieci_amici", "La rete", "Dieci contatti dal grado di amico in su."],
  ["un_anno", "Un anno di gavetta", "Hai passato 52 settimane di carriera."],
  ["milano", "Milano", "Sei arrivato a Milano."],
  ["los_angeles", "Los Angeles", "Sei arrivato a Los Angeles."]
];
function seminaTraguardi(){
  const q = A.db.prepare("INSERT OR IGNORE INTO traguardo (codice, nome, descrizione, codice_steam) VALUES (?,?,?,?)");
  for(const [codice, nome, desc] of TRAGUARDI) q.run(codice, nome, desc, codice.toUpperCase());
}

/* ==================== GLI ARTISTI ==================== */
function inserisciBot(b){
  A.fai(`INSERT INTO artista (id, account_id, bot, nome, citta, genere, storia, seed, stream,
           uscite, deal, ultima_titolo, ultima_seed, creato)
         VALUES (?, NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    b.id, b.nome, b.citta, b.genere, b.storia, b.seed, Math.round(b.stream),
    b.uscite, b.deal ? 1 : 0, b.ultima, b.seed, b.creato || ora());
  A.fai("INSERT INTO bot_stato (artista_id, slancio, caldo, carattere) VALUES (?, ?, ?, ?)",
    b.id, b.slancio || 0, b.caldo || 0, b.carattere || "normale");
}

const CAMPI_PUBBLICI = `a.id, a.nome, a.citta, a.genere, a.storia, a.stream, a.uscite, a.deal,
  a.ultima_titolo, a.ultima_seed, a.seed, a.livello, a.fase`;

/* La riga che il mondo può vedere. Qui dentro non passano né `bot` né le
   chiavi né l'account: la prima è una regola di gioco, le altre di sicurezza. */
function riga(r, ioId){
  return {
    id: r.id, pos: r.pos, nome: r.nome, citta: r.citta, genere: r.genere,
    stream: r.stream, delta: (r.pos_prec == null || r.pos == null) ? null : r.pos_prec - r.pos,
    uscite: r.uscite, deal: !!r.deal, ultima: r.ultima_titolo || null,
    seed: r.ultima_seed || r.seed || 0, storia: r.storia || "",
    livello: r.livello || 1, io: ioId ? r.id === ioId : false
  };
}

const ultimaChiusa = () => {
  const r = A.uno("SELECT max(settimana) s FROM classifica_posizione");
  return r && r.s != null ? r.s : -1;
};
const GRADUATORIA = `WITH grad AS (
  SELECT id, row_number() OVER (ORDER BY stream DESC, creato) AS pos
  FROM artista WHERE ritirato IS NULL )`;

function classifica(da, quanti, ioId){
  const prec = ultimaChiusa();
  const righe = A.tutti(GRADUATORIA + `
    SELECT ${CAMPI_PUBBLICI}, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE g.pos BETWEEN ? AND ? ORDER BY g.pos`, prec, da, da + quanti - 1);
  return {
    settimana: settimanaCorrente(), totale: quantiArtisti(),
    prossimoGiro: Number(leggiStato("prossimo_giro", 0)),
    righe: righe.map(r => riga(r, ioId)),
    io: ioId ? schedaConPosizione(ioId, ioId) : null
  };
}

function schedaConPosizione(id, ioId){
  const prec = ultimaChiusa();
  const r = A.uno(GRADUATORIA + `
    SELECT ${CAMPI_PUBBLICI}, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE a.id = ?`, prec, id);
  return r ? riga(r, ioId) : null;
}

function intorno(id, raggio){
  const prec = ultimaChiusa();
  const righe = A.tutti(GRADUATORIA + `
    SELECT ${CAMPI_PUBBLICI}, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE g.pos BETWEEN (SELECT pos FROM grad WHERE id = ?) - ?
                    AND (SELECT pos FROM grad WHERE id = ?) + ?
    ORDER BY g.pos`, prec, id, raggio, id, raggio);
  return {
    settimana: settimanaCorrente(), totale: quantiArtisti(),
    righe: righe.map(r => riga(r, id)), io: schedaConPosizione(id, id)
  };
}

const artistaGrezzo = id => A.uno("SELECT * FROM artista WHERE id = ?", id);
const nomeLibero = (nome, tranne) => !A.uno(
  "SELECT id FROM artista WHERE lower(nome) = lower(?) AND ritirato IS NULL AND id <> ?", nome, tranne || "");
const quantiArtisti = () => A.uno("SELECT count(*) n FROM artista WHERE ritirato IS NULL").n;
const artistiDi = accountId => A.tutti(
  "SELECT id FROM artista WHERE account_id = ? AND ritirato IS NULL", accountId)
  .map(r => schedaConPosizione(r.id, r.id));

function iscriviArtista(d){
  const id = uuid();
  A.fai(`INSERT INTO artista (id, account_id, bot, nome, citta, genere, storia, seed,
           chiave_hash, creato) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    id, d.accountId || null, d.nome, d.citta, d.genere, d.storia || "", d.seed || 0,
    d.chiaveHash || null, ora());
  return schedaConPosizione(id, id);
}

function aggiornaArtista(id, campi){
  const a = artistaGrezzo(id);
  if(!a) return null;
  A.fai("UPDATE artista SET nome = ?, citta = ?, genere = ? WHERE id = ?",
    campi.nome || a.nome, campi.citta || a.citta, campi.genere || a.genere, id);
  return schedaConPosizione(id, id);
}

/* Il punteggio della settimana. Il tetto contro l'imbroglio sta qui e non nel
   server, perché è una regola sui dati: da un invio all'altro gli stream
   possono al massimo quintuplicare. Il primo invio ha la mano larga, per chi
   arriva con una carriera già avviata. */
function segnaPunteggio(id, d, ipHash){
  const a = artistaGrezzo(id);
  if(!a) return null;
  const tetto = a.punteggio ? Math.max(2500, Math.round(a.stream * 5)) : 250000;
  const chiesto = Math.max(0, Math.min(5e7, Math.round(Number(d.stream) || 0)));
  const limato = chiesto > tetto;
  const stream = limato ? tetto : chiesto;
  const set = A.insieme(() => {
    A.fai(`UPDATE artista SET stream = ?, fan = ?, livello = ?, fase = ?, uscite = ?, deal = ?,
             ultima_titolo = coalesce(?, ultima_titolo), ultima_seed = coalesce(?, ultima_seed),
             punteggio = ? WHERE id = ?`,
      stream, d.fan != null ? d.fan : a.fan, d.livello || a.livello, d.fase != null ? d.fase : a.fase,
      d.uscite != null ? d.uscite : a.uscite, d.deal == null ? a.deal : (d.deal ? 1 : 0),
      d.ultima || null, d.seed || null, ora(), id);
    const s = settimanaCorrente();
    A.fai(`INSERT INTO punteggio_settimana (artista_id, settimana, stream, fan, livello, fase,
             uscite, deal, limato, origine, ip_hash, inviato)
           VALUES (?,?,?,?,?,?,?,?,?, 'client', ?, ?)
           ON CONFLICT(artista_id, settimana) DO UPDATE SET
             stream = excluded.stream, fan = excluded.fan, livello = excluded.livello,
             fase = excluded.fase, uscite = excluded.uscite, deal = excluded.deal,
             limato = excluded.limato, inviato = excluded.inviato`,
      id, s, stream, d.fan || 0, d.livello || 1, d.fase || 0, d.uscite || 0,
      d.deal ? 1 : 0, limato ? 1 : 0, ipHash || null, ora());
    if(limato) segnaSospetto(id, "salto", { chiesto, tetto });
    return s;
  });
  const mia = schedaConPosizione(id, id);
  return { ok: true, pos: mia.pos, delta: mia.delta, totale: quantiArtisti(),
    settimana: set, limato };
}

const segnaSospetto = (id, tipo, dettaglio) =>
  A.fai("INSERT INTO sospetto (artista_id, tipo, dettaglio, creato) VALUES (?,?,?,?)",
    id, tipo, JSON.stringify(dettaglio || {}), ora());

/* ==================== IL TEMPO ==================== */
const settimanaCorrente = () =>
  A.uno("SELECT max(numero) n FROM settimana").n || 1;

function stato(){
  return {
    settimana: settimanaCorrente(),
    artisti: quantiArtisti(),
    giocatori: A.uno("SELECT count(*) n FROM artista WHERE bot = 0 AND ritirato IS NULL").n,
    account: A.uno("SELECT count(*) n FROM account WHERE cancellato IS NULL").n,
    carriere: A.uno("SELECT count(*) n FROM carriera").n,
    prossimoGiro: Number(leggiStato("prossimo_giro", 0)),
    stagione: A.uno("SELECT id, nome FROM stagione WHERE stato = 'corrente' ORDER BY id DESC LIMIT 1")
  };
}

/* Il giro di settimana. Nell'ordine:
   1. si fotografa la classifica di adesso — è il «prima» delle frecce ▲▼;
   2. si chiude la settimana e se ne apre una nuova;
   3. i bot vivono la loro settimana;
   4. chi non manda un punteggio da un pezzo scende;
   5. chi è sceso troppo smette, e spunta gente nuova. */
function giroSettimana(){
  return A.insieme(() => {
    const chiusa = settimanaCorrente();
    const prec = ultimaChiusa();

    A.fai(GRADUATORIA + `
      INSERT INTO classifica_posizione (settimana, artista_id, pos, stream, delta)
      SELECT ?, a.id, g.pos, a.stream, p.pos - g.pos
      FROM grad g JOIN artista a ON a.id = g.id
      LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
      WHERE true
      ON CONFLICT(settimana, artista_id) DO UPDATE SET
        pos = excluded.pos, stream = excluded.stream, delta = excluded.delta`, chiusa, prec);

    A.fai("UPDATE settimana SET chiusa = ?, artisti = ?, giocatori = ? WHERE numero = ?",
      ora(), quantiArtisti(),
      A.uno("SELECT count(*) n FROM artista WHERE bot = 0 AND ritirato IS NULL").n, chiusa);
    const stagione = A.uno("SELECT id FROM stagione WHERE stato = 'corrente' ORDER BY id DESC LIMIT 1");
    A.fai("INSERT INTO settimana (numero, stagione_id, iniziata) VALUES (?, ?, ?)",
      chiusa + 1, stagione.id, ora());
    const nuova = chiusa + 1;

    /* i bot */
    const bot = A.tutti(`SELECT a.id, a.nome, a.citta, a.stream, a.uscite, a.deal, a.seed,
        a.ultima_titolo AS ultima, b.slancio, b.caldo, b.carattere
      FROM artista a JOIN bot_stato b ON b.artista_id = a.id WHERE a.ritirato IS NULL`);
    const notizie = [];
    settimanaBot(bot, notizie);
    for(const b of bot){
      A.fai("UPDATE artista SET stream = ?, uscite = ?, deal = ?, ultima_titolo = ?, ultima_seed = ?, seed = ? WHERE id = ?",
        Math.round(b.stream), b.uscite, b.deal ? 1 : 0, b.ultima, b.seed, b.seed, b.id);
      A.fai("UPDATE bot_stato SET slancio = ?, caldo = ? WHERE artista_id = ?", b.slancio, b.caldo, b.id);
    }

    /* chi non si fa vivo scende: la classifica non è un museo */
    const fermoDa = ora() - CFG.settimanaMs * 1.5;
    A.fai(`UPDATE artista SET stream = CAST(stream * 0.92 AS INTEGER)
           WHERE bot = 0 AND ritirato IS NULL AND coalesce(punteggio, creato) < ?`, fermoDa);

    /* ricambio: chi non ce la fa smette, e spunta qualcuno dal niente */
    const usati = new Set(A.tutti("SELECT nome FROM artista WHERE ritirato IS NULL").map(r => r.nome.toLowerCase()));
    const vivi = A.tutti("SELECT a.id, a.nome, a.stream FROM artista a JOIN bot_stato b ON b.artista_id = a.id WHERE a.ritirato IS NULL");
    const dopo = vivi.slice();
    ricambio(dopo, CFG.quantiBot, usati, notizie);
    for(const b of vivi) if(dopo.indexOf(b) < 0){
      A.fai("UPDATE artista SET ritirato = ? WHERE id = ?", ora(), b.id);
    }
    for(const b of dopo) if(vivi.indexOf(b) < 0) inserisciBot(b);

    for(const n of notizie){
      A.fai("INSERT INTO notizia (settimana, tipo, testo, creato) VALUES (?, ?, ?, ?)",
        nuova, tipoNotizia(n), n, ora());
    }
    A.fai("DELETE FROM notizia WHERE id NOT IN (SELECT id FROM notizia ORDER BY id DESC LIMIT 400)");

    scriviStato("prossimo_giro", ora() + CFG.settimanaMs);
    return notizie.length;
  });
}
const tipoNotizia = t => /è uscito/.test(t) ? "uscita" : /firmato/.test(t) ? "firma"
  : /sparito/.test(t) ? "sparizione" : /smesso/.test(t) ? "ritiro" : "ingresso";

function assicuraSettimana(){
  let giri = 0;
  while(ora() >= Number(leggiStato("prossimo_giro", 0)) && giri < 12){ giroSettimana(); giri++; }
  if(giri >= 12) scriviStato("prossimo_giro", ora() + CFG.settimanaMs);
  return giri;
}

const notizie = quante => A.tutti(
  "SELECT settimana, tipo, testo, creato FROM notizia ORDER BY id DESC LIMIT ?", quante)
  .map(n => ({ t: n.creato, s: n.settimana, tipo: n.tipo, testo: n.testo }));

/* ==================== GLI ACCOUNT ==================== */
function creaAccount(d){
  const id = uuid();
  A.insieme(() => {
    A.fai("INSERT INTO account (id, email, lingua, creato, visto) VALUES (?, ?, ?, ?, ?)",
      id, d.email || null, d.lingua || "it", ora(), ora());
    A.fai("INSERT INTO identita (id, account_id, tipo, id_esterno, segreto_hash, creato, usato) VALUES (?,?,?,?,?,?,?)",
      uuid(), id, d.tipo, d.idEsterno, d.segreto ? impasta(d.segreto) : null, ora(), ora());
  });
  return account(id);
}
const account = id => A.uno(
  "SELECT id, email, stato, lingua, creato, visto FROM account WHERE id = ? AND cancellato IS NULL", id);

function collegaIdentita(accountId, d){
  A.fai("INSERT INTO identita (id, account_id, tipo, id_esterno, segreto_hash, creato) VALUES (?,?,?,?,?,?)",
    uuid(), accountId, d.tipo, d.idEsterno, d.segreto ? impasta(d.segreto) : null, ora());
}

/* L'ingresso: torna l'account se il segreto combacia. Per Steam, Apple e
   Google il segreto non c'è — al posto suo c'è un biglietto firmato da loro,
   che va verificato prima di arrivare qui (vedi `verificaBiglietto` nel
   server: per adesso è una porta chiusa, non una porta finta). */
function entra(tipo, idEsterno, segreto){
  const i = A.uno("SELECT * FROM identita WHERE tipo = ? AND id_esterno = ?", tipo, idEsterno);
  if(!i) return null;
  if(i.segreto_hash && !combacia(segreto, i.segreto_hash)) return null;
  const acc = account(i.account_id);
  if(!acc) return null;
  A.fai("UPDATE identita SET usato = ? WHERE id = ?", ora(), i.id);
  return acc;
}

/* Una sessione = un dispositivo. Il gettone si vede una volta sola, qui dentro
   ne resta l'hash: chi si prende il database non si prende le sessioni. */
function apriSessione(accountId, d){
  const token = crypto.randomBytes(32).toString("hex");
  A.fai(`INSERT INTO dispositivo (id, account_id, piattaforma, nome, token_hash, versione_gioco, creato, visto)
         VALUES (?,?,?,?,?,?,?,?)`,
    uuid(), accountId, (d && d.piattaforma) || "web", (d && d.nome) || null,
    sha(token), (d && d.versione) || null, ora(), ora());
  A.fai("UPDATE account SET visto = ? WHERE id = ?", ora(), accountId);
  return token;
}
function sessione(token){
  if(!token) return null;
  const d = A.uno("SELECT * FROM dispositivo WHERE token_hash = ? AND revocato IS NULL", sha(token));
  if(!d) return null;
  const acc = account(d.account_id);
  if(!acc || acc.stato !== "attivo") return null;
  A.fai("UPDATE dispositivo SET visto = ? WHERE id = ?", ora(), d.id);
  return { account: acc, dispositivo: { id: d.id, piattaforma: d.piattaforma, nome: d.nome } };
}
const chiudiSessione = token =>
  A.fai("UPDATE dispositivo SET revocato = ? WHERE token_hash = ?", ora(), sha(token));

/* La cancellazione dell'account: Apple e Google la pretendono dentro al gioco.
   Non è un DELETE a cascata — quello sfonderebbe lo storico della classifica di
   tutti gli altri. L'artista resta in graduatoria senza nome e senza padrone,
   tutto quello che è personale sparisce. */
function cancellaAccount(accountId){
  return A.insieme(() => {
    const artisti = A.tutti("SELECT id FROM artista WHERE account_id = ?", accountId);
    for(const a of artisti){
      A.fai(`UPDATE artista SET nome = ?, citta = '—', storia = '', account_id = NULL,
               chiave_hash = NULL, ritirato = ? WHERE id = ?`,
        "Artista ritirato " + a.id.slice(0, 4), ora(), a.id);
      A.fai("UPDATE punteggio_settimana SET ip_hash = NULL WHERE artista_id = ?", a.id);
    }
    A.fai("DELETE FROM carriera WHERE account_id = ?", accountId);
    A.fai("DELETE FROM identita WHERE account_id = ?", accountId);
    A.fai("DELETE FROM dispositivo WHERE account_id = ?", accountId);
    A.fai(`UPDATE account SET email = NULL, email_confermata = 0, stato = 'cancellato',
             cancellato = ? WHERE id = ?`, ora(), accountId);
    return { artisti: artisti.length };
  });
}

/* ==================== I SALVATAGGI IN CLOUD ==================== */
const TETTO_CARRIERA = 2 * 1024 * 1024;

/* In conflitto vince chi è più avanti nel gioco: due dispositivi che salvano la
   stessa carriera non si fondono mai in automatico — si perde roba e il
   giocatore non capisce perché. Chi resta indietro se lo sente dire. */
function salvaCarriera(accountId, slot, d){
  const testo = JSON.stringify(d.stato || {});
  if(Buffer.byteLength(testo) > TETTO_CARRIERA) return { errore: "carriera-troppo-grande" };
  const settimana = Math.max(1, Math.round(Number(d.settimana) || 1));
  const anno = Math.max(1, Math.round(Number(d.anno) || 1));
  const vecchia = A.uno("SELECT * FROM carriera WHERE account_id = ? AND slot = ?", accountId, slot);

  if(vecchia && !d.forza){
    const avanti = (vecchia.anno_gioco * 52 + vecchia.settimana_gioco) > (anno * 52 + settimana);
    if(avanti) return { conflitto: true, salvata: descriviCarriera(vecchia) };
  }
  A.fai(`INSERT INTO carriera (id, account_id, artista_id, slot, stato, versione_gioco,
           settimana_gioco, anno_gioco, byte, creato, aggiornato)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(account_id, slot) DO UPDATE SET
           artista_id = excluded.artista_id, stato = excluded.stato,
           versione_gioco = excluded.versione_gioco, settimana_gioco = excluded.settimana_gioco,
           anno_gioco = excluded.anno_gioco, byte = excluded.byte, aggiornato = excluded.aggiornato`,
    vecchia ? vecchia.id : uuid(), accountId, d.artistaId || null, slot, testo,
    d.versioneGioco || "", settimana, anno, Buffer.byteLength(testo), ora(), ora());
  return { salvata: descriviCarriera(A.uno("SELECT * FROM carriera WHERE account_id = ? AND slot = ?", accountId, slot)) };
}
const descriviCarriera = c => c ? {
  slot: c.slot, artistaId: c.artista_id, settimana: c.settimana_gioco, anno: c.anno_gioco,
  versioneGioco: c.versione_gioco, byte: c.byte, aggiornato: c.aggiornato
} : null;

function carriera(accountId, slot){
  const c = A.uno("SELECT * FROM carriera WHERE account_id = ? AND slot = ?", accountId, slot);
  if(!c) return null;
  return Object.assign(descriviCarriera(c), { stato: JSON.parse(c.stato) });
}
const carriere = accountId => A.tutti(
  "SELECT * FROM carriera WHERE account_id = ? ORDER BY slot", accountId).map(descriviCarriera);

/* ==================== I TRAGUARDI ==================== */
const catalogo = () => A.tutti("SELECT codice, nome, descrizione, nascosto FROM traguardo ORDER BY rowid");
function daiTraguardo(artistaId, codice){
  if(!A.uno("SELECT codice FROM traguardo WHERE codice = ?", codice)) return null;
  const gia = A.uno("SELECT codice FROM artista_traguardo WHERE artista_id = ? AND codice = ?", artistaId, codice);
  if(gia) return { gia: true };
  A.insieme(() => {
    A.fai("INSERT INTO artista_traguardo (artista_id, codice, settimana, ottenuto) VALUES (?,?,?,?)",
      artistaId, codice, settimanaCorrente(), ora());
    const a = artistaGrezzo(artistaId);
    const t = A.uno("SELECT nome FROM traguardo WHERE codice = ?", codice);
    if(a && !a.bot){
      A.fai("INSERT INTO notizia (settimana, artista_id, tipo, testo, creato) VALUES (?,?,?,?,?)",
        settimanaCorrente(), artistaId, "traguardo", a.nome + ": " + t.nome + ".", ora());
    }
  });
  return { nuovo: true, codice };
}
const traguardiDi = artistaId => A.tutti(
  `SELECT t.codice, t.nome, t.descrizione, at.ottenuto, at.spinto
   FROM artista_traguardo at JOIN traguardo t ON t.codice = at.codice
   WHERE at.artista_id = ? ORDER BY at.ottenuto`, artistaId);
const daSpingere = () => A.tutti(
  `SELECT at.artista_id, at.codice, t.codice_steam, t.codice_ios, t.codice_android, at.ottenuto
   FROM artista_traguardo at JOIN traguardo t ON t.codice = at.codice
   WHERE at.spinto IS NULL ORDER BY at.ottenuto LIMIT 200`);
const segnaSpinto = (artistaId, codice) =>
  A.fai("UPDATE artista_traguardo SET spinto = ? WHERE artista_id = ? AND codice = ?", ora(), artistaId, codice);

module.exports = {
  apri, chiudi, stato, leggiStato, scriviStato,
  classifica, intorno, schedaConPosizione, artistaGrezzo, nomeLibero, artistiDi,
  iscriviArtista, aggiornaArtista, segnaPunteggio, segnaSospetto,
  giroSettimana, assicuraSettimana, settimanaCorrente, notizie,
  creaAccount, account, collegaIdentita, entra, apriSessione, sessione, chiudiSessione,
  cancellaAccount, impasta, combacia, sha,
  salvaCarriera, carriera, carriere,
  catalogo, daiTraguardo, traguardiDi, daSpingere, segnaSpinto
};
