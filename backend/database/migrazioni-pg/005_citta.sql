-- 005 · La classifica di una città.
--
-- Il confronto è `lower(citta) = lower(?)`, e su una colonna dentro a una
-- funzione l'indice normale non si può usare. PostgreSQL, come SQLite, sa
-- indicizzare l'espressione.

DROP INDEX IF EXISTS artista_citta;
CREATE INDEX artista_citta ON artista (lower(citta), stream DESC, creato)
  WHERE ritirato IS NULL AND fuori = 0;

DROP INDEX IF EXISTS artista_genere;
CREATE INDEX artista_genere ON artista (genere, stream DESC, creato)
  WHERE ritirato IS NULL AND fuori = 0;
