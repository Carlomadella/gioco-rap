-- 003 · Le classifiche che non sono «tutti insieme».
--
-- «Sono 428° in Italia» dice poco a chi comincia. «Sono 3° a Rovereto» dice
-- tutto: è la stessa classifica, guardata da vicino. Per farlo servono due
-- indici, perché la graduatoria per città e per genere è un ORDER BY dentro a
-- un sottoinsieme, non su tutto.

CREATE INDEX artista_citta  ON artista (citta, stream DESC) WHERE ritirato IS NULL;
CREATE INDEX artista_genere ON artista (genere, stream DESC) WHERE ritirato IS NULL;

-- L'albo d'oro: chi ha chiuso una stagione in cima. Si potrebbe ricavare
-- ogni volta dalle fotografie settimanali, ma quello è un conto che si fa una
-- volta sola — quando la stagione si chiude — e poi si legge per sempre.
CREATE TABLE albo (
  stagione_id INTEGER NOT NULL REFERENCES stagione(id) ON DELETE CASCADE,
  pos         INTEGER NOT NULL CHECK (pos > 0),
  artista_id  TEXT    NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
  nome        TEXT    NOT NULL,          -- com'era chiamato allora
  citta       TEXT    NOT NULL,
  genere      TEXT    NOT NULL,
  stream      INTEGER NOT NULL,
  chiusa      INTEGER NOT NULL,
  PRIMARY KEY (stagione_id, pos)
);
CREATE INDEX albo_artista ON albo (artista_id);
