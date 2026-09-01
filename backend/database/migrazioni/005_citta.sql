-- 005 · La classifica di una città.
--
-- `npm run carico` diceva 64 ms per la classifica di una città, contro 1,5 ms
-- per quella generale: il confronto era `lower(citta) = lower(?)`, e su una
-- colonna dentro a una funzione l'indice normale non si può usare.
--
-- SQLite però sa indicizzare **l'espressione**. Con questo torna a leggere
-- l'indice invece di rileggersi la tabella.

DROP INDEX IF EXISTS artista_citta;
CREATE INDEX artista_citta ON artista (lower(citta), stream DESC, creato)
  WHERE ritirato IS NULL AND fuori = 0;

DROP INDEX IF EXISTS artista_genere;
CREATE INDEX artista_genere ON artista (genere, stream DESC, creato)
  WHERE ritirato IS NULL AND fuori = 0;
