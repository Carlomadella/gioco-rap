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
const { nomeDufficio } = require("../moderazione.js");
const plausibilita = require("../plausibilita.js");

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
/* La graduatoria: una sola definizione per tutte le query, così «chi è in
   classifica» è scritto in un posto solo. Chi è fuori: i ritirati e chi ha
   una sanzione attiva — la sanzione non è una nota in un registro, è una cosa
   che si vede. */
const IN_CLASSIFICA = `a.ritirato IS NULL
  AND NOT EXISTS (SELECT 1 FROM sanzione s WHERE s.account_id = a.account_id
    AND s.tipo IN ('fuori_classifica','sospensione')
    AND (s.a IS NULL OR s.a > CAST(strftime('%s','now') AS INTEGER) * 1000))`;
const GRADUATORIA = `WITH grad AS (
  SELECT a.id, row_number() OVER (ORDER BY a.stream DESC, a.creato) AS pos
  FROM artista a WHERE ${IN_CLASSIFICA} )`;

/* La stessa graduatoria, ma dentro a un sottoinsieme: la città, il genere.
   La posizione si conta **dentro al filtro** — «sei 3° a Rovereto» — perché è
   l'unico modo in cui una classifica per città vuol dire qualcosa. Il filtro
   entra come parametro, mai incollato nella query. */
function graduatoriaFiltrata(filtro){
  const dove = [IN_CLASSIFICA];
  const v = [];
  if(filtro && filtro.citta){ dove.push("lower(a.citta) = lower(?)"); v.push(filtro.citta); }
  if(filtro && filtro.genere){ dove.push("a.genere = ?"); v.push(filtro.genere); }
  return {
    sql: `WITH grad AS (
      SELECT a.id, row_number() OVER (ORDER BY a.stream DESC, a.creato) AS pos
      FROM artista a WHERE ${dove.join(" AND ")} )`,
    v
  };
}

function classifica(da, quanti, ioId, filtro){
  const prec = ultimaChiusa();
  const g = graduatoriaFiltrata(filtro);
  const righe = A.tutti(g.sql + `
    SELECT ${CAMPI_PUBBLICI}, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE g.pos BETWEEN ? AND ? ORDER BY g.pos`, ...g.v, prec, da, da + quanti - 1);
  /* dentro a un filtro anche «io» cambia: la mia posizione a Rovereto non è
     la mia posizione in Italia */
  const mio = ioId ? A.uno(g.sql + `
    SELECT ${CAMPI_PUBBLICI}, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE a.id = ?`, ...g.v, prec, ioId) : null;
  return {
    settimana: settimanaCorrente(),
    totale: quantiInClassifica(filtro),
    filtro: (filtro && (filtro.citta || filtro.genere)) ? filtro : null,
    prossimoGiro: Number(leggiStato("prossimo_giro", 0)),
    righe: righe.map(r => riga(r, ioId)),
    io: mio ? riga(mio, ioId) : null
  };
}

/* Quanti sono in classifica, dentro al filtro. */
function quantiInClassifica(filtro){
  const dove = [IN_CLASSIFICA];
  const v = [];
  if(filtro && filtro.citta){ dove.push("lower(a.citta) = lower(?)"); v.push(filtro.citta); }
  if(filtro && filtro.genere){ dove.push("a.genere = ?"); v.push(filtro.genere); }
  return A.uno("SELECT count(*) n FROM artista a WHERE " + dove.join(" AND "), ...v).n;
}

/* Le città e i generi che hanno gente dentro: servono a chi disegna il
   selettore, per non mostrare venti città vuote. */
const cittaInGioco = () => A.tutti(
  "SELECT a.citta, count(*) quanti, max(a.stream) meglio FROM artista a WHERE " + IN_CLASSIFICA +
  " GROUP BY lower(a.citta) ORDER BY quanti DESC, a.citta");
const generiInGioco = () => A.tutti(
  "SELECT a.genere, count(*) quanti FROM artista a WHERE " + IN_CLASSIFICA +
  " GROUP BY a.genere ORDER BY quanti DESC");

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
const quantiArtisti = () => A.uno("SELECT count(*) n FROM artista a WHERE " + IN_CLASSIFICA).n;
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
/* Il punteggio della settimana. Il freno non è più «al massimo il quintuplo»:
   è un modello di quanto quel numero può stare in piedi, dati i fan, i pezzi
   fuori e quello che andava già (`../plausibilita.js`). Chi sfora viene limato
   e lascia un sospetto pesato: uno che sfora di poco pesa poco, e nessuno viene
   sanzionato per un sospetto solo. */
function segnaPunteggio(id, d, ipHash){
  const a = artistaGrezzo(id);
  if(!a) return null;
  const esame = plausibilita.esamina(a, {
    stream: Math.min(5e7, Number(d.stream) || 0),
    fan: d.fan != null ? d.fan : a.fan,
    livello: d.livello || a.livello,
    uscite: d.uscite != null ? d.uscite : a.uscite
  });
  const limato = esame.limato;
  const stream = esame.stream;
  const set = A.insieme(() => {
    A.fai(`UPDATE artista SET stream = ?, fan = ?, livello = ?, fase = ?, uscite = ?, deal = ?,
             ultima_titolo = coalesce(?, ultima_titolo), ultima_seed = coalesce(?, ultima_seed),
             punteggio = ? WHERE id = ?`,
      stream, esame.fan, esame.livello, d.fase != null ? d.fase : a.fase,
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
      id, s, stream, esame.fan, esame.livello, d.fase || 0, d.uscite || 0,
      d.deal ? 1 : 0, limato ? 1 : 0, ipHash || null, ora());
    if(limato && esame.peso > 0) segnaSospetto(id, esame.gravita > 20 ? "impossibile" : "salto",
      { chiesto: Math.round(Number(d.stream) || 0), tetto: esame.tetto,
        fuori: esame.fuori, gravita: esame.gravita }, esame.peso);
    return s;
  });
  /* Chi ha una sanzione «fuori classifica» continua a giocare e il punteggio
     si salva lo stesso: solo, in graduatoria non c'è. Quindi qui la scheda può
     non tornare, e non è un errore — è la sanzione che funziona. */
  if(limato && esame.peso > 0) valutaSospetti(a.account_id);
  const mia = schedaConPosizione(id, id);
  const traguardi = traguardiDovuti(id);
  return { ok: true, pos: mia ? mia.pos : null, delta: mia ? mia.delta : null,
    fuoriClassifica: !mia, totale: quantiArtisti(), settimana: set, limato,
    tetto: esame.tetto, fuori: esame.fuori, traguardi };
}

/* ==================== SANZIONI E SOSPETTI ====================
   Regola: **fuori dalla classifica prima della sospensione**. Chi bara sparisce
   dalla graduatoria pubblica ma continua a giocare la sua partita — nel dubbio
   è la punizione giusta: se ci siamo sbagliati non abbiamo tolto il gioco a un
   cliente che l'ha pagato. */
const TIPI_SANZIONE = ["avviso", "fuori_classifica", "sospensione"];
function sanziona(accountId, tipo, motivo, giorni){
  if(TIPI_SANZIONE.indexOf(tipo) < 0) return null;
  if(!accountId || !A.uno("SELECT id FROM account WHERE id = ?", accountId)) return null;
  const fino = giorni > 0 ? ora() + giorni * 86400e3 : null;
  A.fai("INSERT INTO sanzione (account_id, tipo, motivo, da, a, deciso_da) VALUES (?,?,?,?,?,?)",
    accountId, tipo, motivo, ora(), fino, "a mano");
  return { ok: true, tipo, motivo, fino };
}
const sanzioneAttiva = accountId => accountId ? A.uno(
  `SELECT tipo, motivo, a FROM sanzione WHERE account_id = ? AND tipo <> 'avviso'
     AND (a IS NULL OR a > ?)
   ORDER BY CASE tipo WHEN 'sospensione' THEN 0 ELSE 1 END, id DESC LIMIT 1`,
  accountId, ora()) : null;
const togliSanzioni = accountId =>
  A.fai("UPDATE sanzione SET a = ? WHERE account_id = ? AND (a IS NULL OR a > ?)", ora(), accountId, ora());

/* Chi ha fatto alzare un sopracciglio, dal più recente: è la lista da cui si
   guarda a mano prima di sanzionare qualcuno. */
const sospetti = quanti => A.tutti(
  `SELECT s.id, s.artista_id, a.nome, a.account_id, s.tipo, s.dettaglio, s.peso, s.creato
   FROM sospetto s JOIN artista a ON a.id = s.artista_id
   ORDER BY s.id DESC LIMIT ?`, quanti).map(r =>
     Object.assign(r, { dettaglio: (() => { try{ return JSON.parse(r.dettaglio); }catch(e){ return {}; } })() }));

const segnaSospetto = (id, tipo, dettaglio, peso) =>
  A.fai("INSERT INTO sospetto (artista_id, tipo, dettaglio, peso, creato) VALUES (?,?,?,?,?)",
    id, tipo, JSON.stringify(dettaglio || {}), Math.max(1, peso || 1), ora());

/* Nessuno viene sanzionato per un sospetto solo: uno può sforare perché il
   nostro modello è stretto, o perché ha fatto una settimana eccezionale. Ma
   dodici punti di sospetto in due mesi non sono più un caso — e allora scatta
   **fuori dalla classifica**, non la sospensione: continua a giocare la sua
   partita, e chi guarda la coda decide con calma. */
const SOGLIA_SOSPETTI = 12;
function valutaSospetti(accountId){
  if(!accountId) return null;
  if(sanzioneAttiva(accountId)) return null;
  const somma = A.uno(
    `SELECT coalesce(sum(s.peso), 0) peso FROM sospetto s
     JOIN artista a ON a.id = s.artista_id
     WHERE a.account_id = ? AND s.creato > ?`, accountId, ora() - 60 * 86400e3).peso;
  if(somma < SOGLIA_SOSPETTI) return null;
  A.fai("INSERT INTO sanzione (account_id, tipo, motivo, da, a, deciso_da) VALUES (?,?,?,?,?,?)",
    accountId, "fuori_classifica",
    "numeri che non stanno in piedi (" + somma + " punti di sospetto in due mesi)",
    ora(), ora() + 14 * 86400e3, "automatico");
  return { fuoriClassifica: true, peso: somma };
}

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
      A.fai("INSERT INTO notizia (settimana, artista_id, tipo, testo, creato) VALUES (?, ?, ?, ?, ?)",
        nuova, n.id || null, n.tipo || tipoNotizia(n.testo || n), n.testo || n, ora());
    }
    A.fai("DELETE FROM notizia WHERE id NOT IN (SELECT id FROM notizia ORDER BY id DESC LIMIT 400)");

    manutenzione();
    scriviStato("prossimo_giro", ora() + CFG.settimanaMs);
    return notizie.length;
  });
}
/* La pulizia settimanale: le sessioni che nessuno usa più si chiudono (un
   gettone che vive per sempre è un gettone che prima o poi finisce in mano a
   qualcun altro), e i sospetti vecchi si buttano — dopo sei mesi non dicono
   più niente su nessuno. */
function manutenzione(){
  const novanta = ora() - 90 * 86400e3;
  A.fai("UPDATE dispositivo SET revocato = ? WHERE revocato IS NULL AND visto < ?", ora(), novanta);
  A.fai("DELETE FROM sospetto WHERE creato < ?", ora() - 180 * 86400e3);
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
  "SELECT settimana, artista_id, tipo, testo, creato FROM notizia ORDER BY id DESC LIMIT ?", quante)
  .map(n => ({ t: n.creato, s: n.settimana, tipo: n.tipo, testo: n.testo, artistaId: n.artista_id }));

/* ==================== IL FEED DEL TELEFONO ====================
   LaFamegram vuole dei post, non delle righe di database. Un post ha un nome,
   una settimana, un testo e dei cuori — la stessa forma che usa già il gioco
   (`telPost()` in `frontend/js/game/telefono.js`), così i post del mondo vero e
   quelli della tua carriera si mescolano senza che si veda la giuntura.

   I cuori non sono a caso: vengono dagli stream di chi ha postato, con una
   variazione fissa presa dal suo seme. Uno con due milioni di ascolti non
   prende quattro cuori, e lo stesso post ne ha sempre gli stessi. */
function cuori(stream, seed){
  const base = Math.max(3, Math.round(Math.pow(Math.max(1, stream), 0.62) / 4));
  return base + (Number(seed || 0) % Math.max(2, Math.round(base * 0.35)));
}

function feed(ioId, quanti){
  const righe = A.tutti(
    `SELECT n.settimana, n.tipo, n.testo, n.creato, n.artista_id,
            a.nome, a.stream, a.seed, a.citta, a.genere
     FROM notizia n LEFT JOIN artista a ON a.id = n.artista_id
     ORDER BY n.id DESC LIMIT ?`, Math.max(1, quanti || 20));

  const post = righe.map(n => ({
    tipo: n.tipo, s: n.settimana, t: n.testo,
    n: n.nome || "La città", artistaId: n.artista_id,
    citta: n.citta || null, genere: n.genere || null,
    like: cuori(n.stream || 800, n.seed || 7), quando: n.creato
  }));

  /* la parte che riguarda te: chi ti ha superato e chi hai superato tu
     dall'ultima fotografia. È quello che rende un feed «tuo» invece che una
     bacheca uguale per tutti. */
  if(ioId) for(const p of vicini(ioId)) post.unshift(p);
  return post;
}

/* Chi si è mosso intorno a te fra l'ultima settimana chiusa e adesso. */
function vicini(ioId){
  const mia = schedaConPosizione(ioId, null);
  if(!mia) return [];
  const prec = ultimaChiusa();
  const fuori = [];
  const attorno = A.tutti(GRADUATORIA + `
    SELECT a.id, a.nome, a.stream, a.seed, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE g.pos BETWEEN ? AND ? AND a.id <> ?`, prec, Math.max(1, mia.pos - 3), mia.pos + 3, ioId);
  const mioPrec = A.uno(
    "SELECT pos FROM classifica_posizione WHERE artista_id = ? AND settimana = ?", ioId, prec);
  const primaEro = mioPrec ? mioPrec.pos : null;

  for(const a of attorno){
    if(primaEro == null || a.pos_prec == null) continue;
    if(a.pos < mia.pos && a.pos_prec > primaEro)
      fuori.push({ tipo: "sorpasso", s: settimanaCorrente(), n: a.nome, artistaId: a.id,
        t: a.nome + " ti ha passato: adesso è " + a.pos + "°, tu " + mia.pos + "°.",
        like: cuori(a.stream, a.seed), quando: ora() });
    else if(a.pos > mia.pos && a.pos_prec < primaEro)
      fuori.push({ tipo: "sorpasso", s: settimanaCorrente(), n: a.nome, artistaId: a.id,
        t: "Hai passato " + a.nome + ": adesso sei " + mia.pos + "°, lui " + a.pos + "°.",
        like: cuori(a.stream, a.seed), quando: ora() });
  }
  return fuori.slice(0, 4);
}

/* ==================== GLI OPPS ====================
   I rivali non sono più gente generata in casa: sono i giocatori (e i bot) che
   ti stanno appena sopra. Quelli sono gli opps — e quando li superi lo vedi,
   perché il posto era loro. */
function opps(ioId, quanti){
  const mia = schedaConPosizione(ioId, null);
  if(!mia) return { io: null, sopra: [], dichiarati: [] };
  const prec = ultimaChiusa();
  const n = Math.max(1, Math.min(10, quanti || 3));
  const sopra = A.tutti(GRADUATORIA + `
    SELECT ${CAMPI_PUBBLICI}, g.pos, p.pos AS pos_prec
    FROM grad g JOIN artista a ON a.id = g.id
    LEFT JOIN classifica_posizione p ON p.artista_id = a.id AND p.settimana = ?
    WHERE g.pos < ? ORDER BY g.pos DESC LIMIT ?`, prec, mia.pos, n);
  return {
    io: mia,
    sopra: sopra.map(r => Object.assign(riga(r, ioId),
      { distanza: r.stream - mia.stream })).reverse(),
    dichiarati: relazioni(ioId)
  };
}

/* Una rivalità dichiarata: resta anche se uno dei due si sposta in classifica. */
function dichiara(artistaId, altroId, tipo, nota){
  if(artistaId === altroId) return null;
  if(["rivale", "feat", "amico", "crew"].indexOf(tipo) < 0) return null;
  const a = artistaGrezzo(artistaId), b = artistaGrezzo(altroId);
  if(!a || !b || b.ritirato) return null;
  try{
    A.fai(`INSERT INTO relazione (artista_id, altro_id, tipo, da_settimana, nota, creato)
           VALUES (?,?,?,?,?,?)`, artistaId, altroId, tipo, settimanaCorrente(), nota || null, ora());
    if(tipo === "rivale"){
      A.fai("INSERT INTO notizia (settimana, artista_id, tipo, testo, creato) VALUES (?,?,?,?,?)",
        settimanaCorrente(), artistaId, "rivalita",
        a.nome + " se l'è presa con " + b.nome + ".", ora());
    }
  }catch(e){
    if(/UNIQUE/.test(e.message)) return { gia: true };
    throw e;
  }
  return { ok: true, tipo, con: b.nome };
}
const scancella = (artistaId, altroId, tipo) =>
  A.fai("DELETE FROM relazione WHERE artista_id = ? AND altro_id = ? AND tipo = ?",
    artistaId, altroId, tipo);
const relazioni = artistaId => A.tutti(
  `SELECT r.tipo, r.grado, r.da_settimana, r.nota, a.id, a.nome, a.citta, a.genere, a.stream
   FROM relazione r JOIN artista a ON a.id = r.altro_id
   WHERE r.artista_id = ? AND a.ritirato IS NULL ORDER BY r.id DESC LIMIT 50`, artistaId);

/* ==================== LE STAGIONI ====================
   Una stagione che non finisce mai è una classifica in cui chi è arrivato
   prima resta davanti per sempre, e chi arriva dopo non ha motivo di provarci.
   Chiudere una stagione fa tre cose: scrive l'albo d'oro (chi ha vinto resta
   scritto per sempre), **ammorbidisce** i numeri di tutti invece di azzerarli
   — chi ha lavorato un anno non riparte da zero come chi ha installato ieri —
   e apre la stagione dopo. */
const stagioneCorrente = () =>
  A.uno("SELECT * FROM stagione WHERE stato = 'corrente' ORDER BY id DESC LIMIT 1");

function chiudiStagione(quanti){
  return A.insieme(() => {
    const vecchia = stagioneCorrente();
    if(!vecchia) return null;
    const classifica = A.tutti(GRADUATORIA + `
      SELECT a.id, a.nome, a.citta, a.genere, a.stream, g.pos
      FROM grad g JOIN artista a ON a.id = g.id
      WHERE g.pos <= ? ORDER BY g.pos`, Math.max(1, quanti || 100));

    for(const r of classifica){
      A.fai(`INSERT INTO albo (stagione_id, pos, artista_id, nome, citta, genere, stream, chiusa)
             VALUES (?,?,?,?,?,?,?,?)`,
        vecchia.id, r.pos, r.id, r.nome, r.citta, r.genere, r.stream, ora());
    }
    A.fai("UPDATE stagione SET stato = 'chiusa', fine = ? WHERE id = ?", ora(), vecchia.id);

    /* il ripartire: tutti gli stream calano allo stesso modo, così l'ordine
       resta ma le distanze si accorciano e la rincorsa è possibile */
    A.fai("UPDATE artista SET stream = CAST(stream * 0.25 AS INTEGER) WHERE ritirato IS NULL");
    A.fai("UPDATE bot_stato SET slancio = 0, caldo = 0");

    const info = A.fai("INSERT INTO stagione (nome, inizio, stato) VALUES (?, ?, 'corrente')",
      "Stagione " + (vecchia.id + 1), ora());
    const nuova = A.uno("SELECT * FROM stagione ORDER BY id DESC LIMIT 1");
    /* la settimana va avanti a contare: il tempo non si azzera con la stagione */
    A.fai("UPDATE settimana SET stagione_id = ? WHERE numero = ?", nuova.id, settimanaCorrente());
    const primo = classifica[0];
    if(primo){
      A.fai("INSERT INTO notizia (settimana, artista_id, tipo, testo, creato) VALUES (?,?,?,?,?)",
        settimanaCorrente(), primo.id, "traguardo",
        "«" + vecchia.nome + "» si chiude: primo " + primo.nome + " con " + primo.stream + " stream.", ora());
    }
    return { chiusa: vecchia.nome, nuova: nuova.nome, inAlbo: classifica.length,
      primo: primo ? primo.nome : null };
  });
}

const albo = stagioneId => A.tutti(
  `SELECT a.pos, a.nome, a.citta, a.genere, a.stream, a.artista_id, s.nome AS stagione, a.chiusa
   FROM albo a JOIN stagione s ON s.id = a.stagione_id
   WHERE a.stagione_id = coalesce(?, a.stagione_id) ORDER BY a.stagione_id DESC, a.pos LIMIT 200`,
  stagioneId || null);
const stagioni = () => A.tutti("SELECT id, nome, inizio, fine, stato FROM stagione ORDER BY id DESC");

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

/* ==================== SEGNALAZIONI E MODERAZIONE ====================
   Il filtro automatico prende il grosso; questo è quello che gli scappa e che
   qualcuno trova offensivo. Una segnalazione a testa per artista e per motivo:
   se no bastano cinque amici per far togliere il nome a chi non ha fatto
   niente. Il conto delle segnalazioni non decide niente da solo — decide chi
   le guarda. */
function segnala(artistaId, accountId, motivo, nota){
  const a = artistaGrezzo(artistaId);
  if(!a || a.bot) return null;
  if(["nome", "storia", "imbroglio", "altro"].indexOf(motivo) < 0) return null;
  try{
    A.fai(`INSERT INTO segnalazione (artista_id, account_id, motivo, nota, creato)
           VALUES (?,?,?,?,?)`, artistaId, accountId || null, motivo, nota || null, ora());
  }catch(e){
    if(/UNIQUE/.test(e.message)) return { gia: true };
    throw e;
  }
  return { ok: true };
}

/* La coda da guardare: gli artisti più segnalati, con quante e da quanti. */
const daGuardare = quanti => A.tutti(
  `SELECT s.artista_id, a.nome, a.storia, count(*) quante,
          count(DISTINCT s.account_id) da_quanti, max(s.creato) ultima,
          group_concat(DISTINCT s.motivo) motivi
   FROM segnalazione s JOIN artista a ON a.id = s.artista_id
   WHERE s.stato = 'aperta' AND a.ritirato IS NULL
   GROUP BY s.artista_id ORDER BY da_quanti DESC, quante DESC LIMIT ?`, quanti);

/* Togliere un nome: non è una punizione da scrivere in faccia a tutti, è un
   nome neutro al posto suo. Quello di prima resta scritto nel database, per
   poter rispondere a «perché mi avete cambiato il nome». */
function rinominaDufficio(artistaId){
  const a = artistaGrezzo(artistaId);
  if(!a) return null;
  const nuovo = nomeDufficio(a.id);
  A.insieme(() => {
    A.fai("UPDATE artista SET nome_prima = coalesce(nome_prima, nome), nome = ? WHERE id = ?", nuovo, artistaId);
    A.fai("UPDATE segnalazione SET stato = 'accolta', chiusa = ? WHERE artista_id = ? AND stato = 'aperta'", ora(), artistaId);
  });
  return { nome: nuovo, prima: a.nome };
}
const chiudiSegnalazioni = (artistaId, stato) =>
  A.fai("UPDATE segnalazione SET stato = ?, chiusa = ? WHERE artista_id = ? AND stato = 'aperta'",
    stato === "accolta" ? "accolta" : "respinta", ora(), artistaId);

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
/* ==================== I TRAGUARDI CHE DÀ IL SERVER ====================
   Quelli che si possono controllare qui non li chiede il client: li guarda il
   server ai numeri che ha in mano. È la differenza fra un traguardo che vale e
   uno che si prende aprendo la console del browser — e con Steam attaccato
   dietro, quella differenza è tutto.

   Restano al gioco solo quelli che il server non può sapere (essere arrivato a
   Milano, dieci amici alla Sala): quelli passano da `POST /api/traguardo`. */
const DAL_SERVER = {
  primo_pezzo:     (a, pos) => a.uscite >= 1,
  primi_mille:     (a, pos) => a.stream >= 1000,
  in_classifica:   (a, pos) => pos != null,
  top_100:         (a, pos) => pos != null && pos <= 100,
  top_10:          (a, pos) => pos != null && pos <= 10,
  primo_posto:     (a, pos) => pos === 1,
  disco_oro:       (a, pos) => a.stream >= 50000,
  disco_platino:   (a, pos) => a.stream >= 500000,
  primo_contratto: (a, pos) => !!a.deal
};
const CODICI_DAL_SERVER = Object.keys(DAL_SERVER);

/* Da chiamare dopo ogni punteggio e a ogni giro di settimana: guarda i numeri
   e dà quello che c'è da dare. Torna solo i traguardi nuovi, così il gioco può
   dirlo a chi sta giocando. */
function traguardiDovuti(artistaId){
  const a = artistaGrezzo(artistaId);
  if(!a || a.bot) return [];
  const scheda = schedaConPosizione(artistaId, null);
  const pos = scheda ? scheda.pos : null;
  const nuovi = [];
  for(const codice of CODICI_DAL_SERVER){
    if(!DAL_SERVER[codice](a, pos)) continue;
    const r = daiTraguardo(artistaId, codice);
    if(r && r.nuovo) nuovi.push(codice);
  }
  return nuovi;
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
  sanziona, sanzioneAttiva, togliSanzioni, sospetti, manutenzione, valutaSospetti,
  giroSettimana, assicuraSettimana, settimanaCorrente, notizie,
  cittaInGioco, generiInGioco, quantiInClassifica, feed, opps, dichiara, scancella, relazioni,
  stagioneCorrente, chiudiStagione, albo, stagioni,
  creaAccount, account, collegaIdentita, entra, apriSessione, sessione, chiudiSessione,
  cancellaAccount, impasta, combacia, sha,
  salvaCarriera, carriera, carriere,
  catalogo, daiTraguardo, traguardiDi, daSpingere, segnaSpinto,
  traguardiDovuti, CODICI_DAL_SERVER,
  segnala, daGuardare, rinominaDufficio, chiudiSegnalazioni
};
