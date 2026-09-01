-- 003 · Le classifiche che non sono «tutti insieme».
--
-- «Sono 428° in Italia» dice poco a chi comincia. «Sono 3° a Rovereto» dice
-- tutto: la stessa classifica, guardata da vicino.

CREATE INDEX artista_citta  ON artista (citta, stream DESC) WHERE ritirato IS NULL;
CREATE INDEX artista_genere ON artista (genere, stream DESC) WHERE ritirato IS NULL;

-- L'albo d'oro: chi ha chiuso una stagione in cima.
CREATE TABLE albo (
  stagione_id INTEGER NOT NULL REFERENCES stagione(id) ON DELETE CASCADE,
  pos         INTEGER NOT NULL CHECK (pos > 0),
  artista_id  TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  nome        TEXT    NOT NULL,          -- com'era chiamato allora
  citta       TEXT    NOT NULL,
  genere      TEXT    NOT NULL,
  stream      BIGINT  NOT NULL,
  chiusa      BIGINT  NOT NULL,
  PRIMARY KEY (stagione_id, pos)
);
CREATE INDEX albo_artista ON albo (artista_id);
