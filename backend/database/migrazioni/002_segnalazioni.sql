-- 002 · Le segnalazioni.
--
-- Sugli store un nome d'arte è **contenuto scritto dagli utenti e mostrato ad
-- altri utenti**: Apple e Google chiedono che ci sia un modo per segnalarlo e
-- qualcuno che lo guardi. Questa è quella coda.
--
-- Il filtro automatico (`moderazione.js`) blocca il grosso al momento
-- dell'iscrizione; qui finisce quello che passa lo stesso e che qualcuno
-- trova offensivo.

CREATE TABLE segnalazione (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artista_id TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  account_id TEXT    REFERENCES account(id) ON DELETE SET NULL,  -- chi ha segnalato
  motivo     TEXT    NOT NULL CHECK (motivo IN ('nome','storia','imbroglio','altro')),
  nota       TEXT,
  stato      TEXT    NOT NULL DEFAULT 'aperta'
                     CHECK (stato IN ('aperta','accolta','respinta')),
  creato     INTEGER NOT NULL,
  chiusa     INTEGER,
  UNIQUE (artista_id, account_id, motivo)      -- una segnalazione a testa, non dieci
);
CREATE INDEX segnalazione_aperte ON segnalazione (creato DESC) WHERE stato = 'aperta';
CREATE INDEX segnalazione_artista ON segnalazione (artista_id);

-- Quando un nome viene cambiato d'ufficio si tiene traccia di com'era: serve a
-- rispondere a «perché mi avete cambiato il nome» senza andare a memoria.
ALTER TABLE artista ADD COLUMN nome_prima TEXT;
