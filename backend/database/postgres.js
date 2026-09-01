/* Il motore PostgreSQL.

   È il gradino per il giorno che i server diventano più di uno: SQLite è un
   file, e un file non lo si condivide fra due macchine. Da qui in poi il
   database sta per conto suo e i server ci parlano.

   Si accende da solo se c'è `ADF_PG`:

     ADF_PG=postgresql://utente:password@127.0.0.1:5432/anni_di_fame

   Senza quella variabile questo file non viene nemmeno caricato, e il server
   resta su SQLite come sempre.

   **Perché una dipendenza, in un progetto che non ne ha.** Il protocollo di
   PostgreSQL si potrebbe scrivere a mano — è quello che abbiamo fatto per il
   server di sviluppo e per il build. Ma questo è il file che tiene le carriere
   della gente, e l'autenticazione SCRAM-SHA-256, il TLS, la decodifica dei
   tipi e le riconnessioni sono quattro posti dove un errore sottile non si
   vede subito e si paga sui dati veri. `pg` è la libreria più collaudata di
   Node: qui «zero dipendenze» è una regola che conviene cedere, e questo è
   l'unico posto dove la cediamo.

   ---

   Due cose che questa cornice deve fare sul serio, e che non sono ovvie:

   1. **I segnaposto.** Il resto del server scrive `?` come SQLite; PostgreSQL
      vuole `$1, $2`. Si traducono qui, saltando quello che sta dentro alle
      stringhe — se no un punto interrogativo dentro a un testo diventerebbe un
      parametro.

   2. **Le transazioni su un pool.** `archivio.js` dentro a `insieme()` chiama
      `A.fai(...)` come sempre, senza passarsi dietro nessuna maniglia. Su un
      pool ogni chiamata potrebbe pescare una connessione diversa, e allora la
      transazione non coprirebbe niente. `AsyncLocalStorage` tiene la
      connessione presa dalla transazione e la fa ritrovare a chi sta dentro,
      senza cambiare una riga di `archivio.js`. */
"use strict";

const { AsyncLocalStorage } = require("node:async_hooks");
const { Pool } = require("pg");

/* ---- da `?` a `$1` ----
   Si cammina sul testo e si salta quello che sta fra apici: in SQL un apice
   dentro a una stringa si raddoppia (`'l''artista'`), e quel caso qui torna da
   sé, perché appena si chiude la stringa la successiva riapre. */
function traduci(sql){
  let fuori = "", n = 0, i = 0;
  while(i < sql.length){
    const c = sql[i];
    if(c === "'" || c === '"'){
      const fine = sql.indexOf(c, i + 1);
      const j = fine < 0 ? sql.length : fine + 1;
      fuori += sql.slice(i, j); i = j; continue;
    }
    if(c === "?"){ fuori += "$" + (++n); i++; continue; }
    fuori += c; i++;
  }
  return fuori;
}

/* le query tradotte si tengono da parte: la traduzione è la stessa ogni volta */
const tradotte = new Map();
const perPg = sql => {
  let t = tradotte.get(sql);
  if(t === undefined){ t = traduci(sql); tradotte.set(sql, t); }
  return t;
};

function motorePostgres(url){
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.ADF_PG_CONNESSIONI || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000
  });
  /* un errore su una connessione ferma non deve buttare giù il processo */
  pool.on("error", e => console.error("[db] connessione persa: " + e.message));

  const dentroTransazione = new AsyncLocalStorage();
  /* chi parla: la connessione della transazione se ci siamo dentro, se no il pool */
  const chi = () => dentroTransazione.getStore() || pool;

  async function query(sql, v){
    return chi().query(perPg(sql), v);
  }

  return {
    nome: "postgres",
    async esegui(sql){ await chi().query(sql); },
    async uno(sql, ...v){ const r = await query(sql, v); return r.rows[0] === undefined ? null : r.rows[0]; },
    async tutti(sql, ...v){ return (await query(sql, v)).rows; },
    async fai(sql, ...v){ const r = await query(sql, v); return { righe: r.rowCount || 0 }; },
    async insieme(f){
      /* già dentro a una transazione: non se ne apre una seconda, si va avanti
         con quella. È l'equivalente onesto di quello che faceva SQLite. */
      if(dentroTransazione.getStore()) return f();
      const cliente = await pool.connect();
      try{
        await cliente.query("BEGIN");
        const r = await dentroTransazione.run(cliente, () => f());
        await cliente.query("COMMIT");
        return r;
      }catch(e){
        try{ await cliente.query("ROLLBACK"); }catch(e2){}
        throw e;
      }finally{
        cliente.release();
      }
    },
    async chiudi(){ tradotte.clear(); await pool.end(); }
  };
}

module.exports = { motorePostgres, traduci };
