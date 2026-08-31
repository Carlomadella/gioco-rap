-- 001 · Lo schema di partenza.
--
-- È lo schema disegnato in `schema.md`, scritto per SQLite. Le differenze dal
-- DDL di Postgres sono quelle elencate là: gli id sono testo (li fa Node con
-- crypto.randomUUID), i tempi sono interi in millisecondi, il json è testo.
--
-- Le migrazioni si applicano in ordine di nome e una volta sola: chi le applica
-- è `db.js`, che tiene il conto nella tabella `migrazione`.

-- ==================== CHI SEI ====================

CREATE TABLE account (
  id               TEXT    PRIMARY KEY,
  email            TEXT,
  email_confermata INTEGER NOT NULL DEFAULT 0,
  stato            TEXT    NOT NULL DEFAULT 'attivo'
                           CHECK (stato IN ('attivo','sospeso','cancellato')),
  lingua           TEXT    NOT NULL DEFAULT 'it',
  paese            TEXT,
  creato           INTEGER NOT NULL,
  visto            INTEGER NOT NULL,
  cancellato       INTEGER
);
CREATE UNIQUE INDEX account_email ON account (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX account_visto ON account (visto DESC) WHERE cancellato IS NULL;

-- con che cosa entri: Steam, Apple, Google, la mail, o il dispositivo e basta
CREATE TABLE identita (
  id           TEXT    PRIMARY KEY,
  account_id   TEXT    NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  tipo         TEXT    NOT NULL CHECK (tipo IN ('steam','apple','google','email','ospite')),
  id_esterno   TEXT    NOT NULL,
  segreto_hash TEXT,
  creato       INTEGER NOT NULL,
  usato        INTEGER,
  UNIQUE (tipo, id_esterno)
);
CREATE INDEX identita_account ON identita (account_id);

-- da dove giochi: una riga per sessione aperta, il gettone sta solo come hash
CREATE TABLE dispositivo (
  id             TEXT    PRIMARY KEY,
  account_id     TEXT    NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  piattaforma    TEXT    NOT NULL DEFAULT 'web'
                         CHECK (piattaforma IN ('windows','mac','linux','ios','android','web')),
  nome           TEXT,
  token_hash     TEXT    NOT NULL,
  versione_gioco TEXT,
  creato         INTEGER NOT NULL,
  visto          INTEGER NOT NULL,
  revocato       INTEGER
);
CREATE UNIQUE INDEX dispositivo_token ON dispositivo (token_hash);
CREATE INDEX dispositivo_account ON dispositivo (account_id) WHERE revocato IS NULL;

-- ==================== CHI C'È IN CLASSIFICA ====================

CREATE TABLE artista (
  id            TEXT    PRIMARY KEY,
  account_id    TEXT    REFERENCES account(id) ON DELETE SET NULL,   -- NULL = è un bot
  bot           INTEGER NOT NULL DEFAULT 0,
  nome          TEXT    NOT NULL CHECK (length(nome) BETWEEN 2 AND 22),
  citta         TEXT    NOT NULL,
  genere        TEXT    NOT NULL,
  storia        TEXT    NOT NULL DEFAULT '',
  seed          INTEGER NOT NULL DEFAULT 0,
  stream        INTEGER NOT NULL DEFAULT 0 CHECK (stream >= 0),
  fan           INTEGER NOT NULL DEFAULT 0 CHECK (fan >= 0),
  livello       INTEGER NOT NULL DEFAULT 1,
  fase          INTEGER NOT NULL DEFAULT 0,
  uscite        INTEGER NOT NULL DEFAULT 0,
  deal          INTEGER NOT NULL DEFAULT 0,
  ultima_titolo TEXT,
  ultima_seed   INTEGER NOT NULL DEFAULT 0,
  chiave_hash   TEXT,                       -- solo per i client vecchi, prima degli account
  creato        INTEGER NOT NULL,
  punteggio     INTEGER,                    -- quando ha mandato l'ultimo punteggio. NULL = mai
  ritirato      INTEGER,
  CHECK ( (bot = 1 AND account_id IS NULL) OR (bot = 0) )
);
CREATE UNIQUE INDEX artista_nome ON artista (lower(nome)) WHERE ritirato IS NULL;
CREATE INDEX artista_classifica ON artista (stream DESC, creato) WHERE ritirato IS NULL;
CREATE INDEX artista_account ON artista (account_id);

-- le rotelle dei soli bot, fuori da artista perché un giocatore non le ha
CREATE TABLE bot_stato (
  artista_id TEXT    PRIMARY KEY REFERENCES artista(id) ON DELETE CASCADE,
  slancio    REAL    NOT NULL DEFAULT 0,
  caldo      INTEGER NOT NULL DEFAULT 0,
  carattere  TEXT    NOT NULL DEFAULT 'normale'
                     CHECK (carattere IN ('normale','costante','esplosivo','meteora'))
);

-- ==================== IL SALVATAGGIO IN CLOUD ====================

CREATE TABLE carriera (
  id              TEXT    PRIMARY KEY,
  account_id      TEXT    NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  artista_id      TEXT    REFERENCES artista(id) ON DELETE SET NULL,
  slot            INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  stato           TEXT    NOT NULL,
  versione_stato  INTEGER NOT NULL DEFAULT 2,
  versione_gioco  TEXT    NOT NULL DEFAULT '',
  settimana_gioco INTEGER NOT NULL DEFAULT 1,
  anno_gioco      INTEGER NOT NULL DEFAULT 1,
  byte            INTEGER NOT NULL DEFAULT 0,
  creato          INTEGER NOT NULL,
  aggiornato      INTEGER NOT NULL,
  UNIQUE (account_id, slot)
);
CREATE INDEX carriera_artista ON carriera (artista_id);

-- ==================== IL TEMPO DEL MONDO ====================

CREATE TABLE stagione (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nome   TEXT    NOT NULL,
  inizio INTEGER NOT NULL,
  fine   INTEGER,
  stato  TEXT    NOT NULL DEFAULT 'corrente' CHECK (stato IN ('corrente','chiusa'))
);

CREATE TABLE settimana (
  numero      INTEGER PRIMARY KEY,
  stagione_id INTEGER NOT NULL REFERENCES stagione(id),
  iniziata    INTEGER NOT NULL,
  chiusa      INTEGER,
  artisti     INTEGER NOT NULL DEFAULT 0,
  giocatori   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX settimana_stagione ON settimana (stagione_id, numero DESC);

-- ==================== LO STORICO ====================

CREATE TABLE punteggio_settimana (
  artista_id TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  settimana  INTEGER NOT NULL REFERENCES settimana(numero) ON DELETE CASCADE,
  stream     INTEGER NOT NULL CHECK (stream >= 0),
  fan        INTEGER NOT NULL DEFAULT 0,
  livello    INTEGER NOT NULL DEFAULT 1,
  fase       INTEGER NOT NULL DEFAULT 0,
  uscite     INTEGER NOT NULL DEFAULT 0,
  deal       INTEGER NOT NULL DEFAULT 0,
  limato     INTEGER NOT NULL DEFAULT 0,
  origine    TEXT    NOT NULL DEFAULT 'client' CHECK (origine IN ('client','server','rettifica')),
  ip_hash    TEXT,
  inviato    INTEGER NOT NULL,
  PRIMARY KEY (artista_id, settimana)
);
CREATE INDEX punteggio_settimana_idx ON punteggio_settimana (settimana);

CREATE TABLE classifica_posizione (
  settimana  INTEGER NOT NULL REFERENCES settimana(numero) ON DELETE CASCADE,
  artista_id TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  pos        INTEGER NOT NULL CHECK (pos > 0),
  stream     INTEGER NOT NULL,
  delta      INTEGER,
  PRIMARY KEY (settimana, artista_id)
);
CREATE INDEX classifica_pos ON classifica_posizione (settimana, pos);
CREATE INDEX classifica_artista ON classifica_posizione (artista_id, settimana DESC);

-- ==================== QUELLO CHE GIRA ====================

CREATE TABLE notizia (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  settimana  INTEGER NOT NULL REFERENCES settimana(numero) ON DELETE CASCADE,
  artista_id TEXT    REFERENCES artista(id) ON DELETE CASCADE,
  tipo       TEXT    NOT NULL CHECK (tipo IN ('uscita','firma','sparizione','ingresso','ritiro','rivalita','traguardo')),
  testo      TEXT    NOT NULL,
  creato     INTEGER NOT NULL
);
CREATE INDEX notizia_settimana ON notizia (settimana DESC, id DESC);

CREATE TABLE relazione (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  artista_id   TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  altro_id     TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  tipo         TEXT    NOT NULL CHECK (tipo IN ('rivale','feat','amico','crew')),
  grado        INTEGER NOT NULL DEFAULT 1 CHECK (grado BETWEEN 1 AND 6),
  da_settimana INTEGER NOT NULL REFERENCES settimana(numero),
  nota         TEXT,
  creato       INTEGER NOT NULL,
  CHECK (artista_id <> altro_id),
  UNIQUE (artista_id, altro_id, tipo)
);
CREATE INDEX relazione_altro ON relazione (altro_id);

-- ==================== I TRAGUARDI ====================

CREATE TABLE traguardo (
  codice         TEXT PRIMARY KEY,
  nome           TEXT NOT NULL,
  descrizione    TEXT NOT NULL,
  nascosto       INTEGER NOT NULL DEFAULT 0,
  codice_steam   TEXT,
  codice_ios     TEXT,
  codice_android TEXT
);

CREATE TABLE artista_traguardo (
  artista_id TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  codice     TEXT    NOT NULL REFERENCES traguardo(codice) ON DELETE CASCADE,
  settimana  INTEGER REFERENCES settimana(numero),
  ottenuto   INTEGER NOT NULL,
  spinto     INTEGER,
  PRIMARY KEY (artista_id, codice)
);
CREATE INDEX traguardo_da_spingere ON artista_traguardo (spinto) WHERE spinto IS NULL;

-- ==================== L'ANTI-IMBROGLIO ====================

CREATE TABLE sospetto (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artista_id TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  tipo       TEXT    NOT NULL CHECK (tipo IN ('salto','frequenza','impossibile','doppione')),
  dettaglio  TEXT    NOT NULL DEFAULT '{}',
  peso       INTEGER NOT NULL DEFAULT 1,
  creato     INTEGER NOT NULL
);
CREATE INDEX sospetto_artista ON sospetto (artista_id, creato DESC);

CREATE TABLE sanzione (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT    NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  tipo       TEXT    NOT NULL CHECK (tipo IN ('avviso','fuori_classifica','sospensione')),
  motivo     TEXT    NOT NULL,
  da         INTEGER NOT NULL,
  a          INTEGER,
  deciso_da  TEXT    NOT NULL DEFAULT 'automatico'
);
CREATE INDEX sanzione_account ON sanzione (account_id, a);

-- ==================== SE E QUANDO CI SARANNO ACQUISTI ====================

CREATE TABLE acquisto (
  id         TEXT    PRIMARY KEY,
  account_id TEXT    NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  negozio    TEXT    NOT NULL CHECK (negozio IN ('steam','apple','google')),
  id_esterno TEXT    NOT NULL,
  prodotto   TEXT    NOT NULL,
  centesimi  INTEGER NOT NULL,
  valuta     TEXT    NOT NULL DEFAULT 'EUR',
  stato      TEXT    NOT NULL DEFAULT 'pagato' CHECK (stato IN ('pagato','rimborsato','contestato')),
  ricevuta   TEXT,
  creato     INTEGER NOT NULL,
  UNIQUE (negozio, id_esterno)
);

-- ==================== LO STATO DEL MONDO ====================
-- una riga per cosa: settimana corrente, quando scatta il prossimo giro, ecc.

CREATE TABLE stato (
  chiave TEXT PRIMARY KEY,
  valore TEXT NOT NULL
);
