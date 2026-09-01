-- 004 · Rendere veloce la classifica.
--
-- «Chi è in classifica» conteneva un `NOT EXISTS` sulle sanzioni: una
-- condizione che non si legge da un indice, quindi si rileggeva tutta la
-- tabella ogni volta. La cura è farla diventare **una colonna**.
--
-- Unica differenza dalla gemella SQLite: «adesso, in millisecondi» lì si
-- scrive `strftime('%s','now') * 1000`, qui così.

ALTER TABLE artista ADD COLUMN fuori INTEGER NOT NULL DEFAULT 0;

UPDATE artista SET fuori = 1 WHERE account_id IN (
  SELECT account_id FROM sanzione
  WHERE tipo IN ('fuori_classifica','sospensione')
    AND (a IS NULL OR a > (EXTRACT(EPOCH FROM now())::bigint * 1000))
);

DROP INDEX IF EXISTS artista_classifica;
CREATE INDEX artista_classifica ON artista (stream DESC, creato)
  WHERE ritirato IS NULL AND fuori = 0;
