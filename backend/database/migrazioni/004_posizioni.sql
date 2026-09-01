-- 004 · Rendere veloce la classifica.
--
-- La prova di carico (`npm run carico`) ha detto la verità: a ventimila
-- artisti ogni classifica costava fra i 50 e i 110 millisecondi. Troppo, per
-- una cosa che si chiede a ogni apertura del telefono.
--
-- Il motivo era che «chi è in classifica» conteneva un `NOT EXISTS` sulle
-- sanzioni: una condizione che il database non può leggere da un indice, e
-- quindi si rileggeva tutta la tabella e la si riordinava ogni volta.
--
-- La cura è banale una volta capita: la sanzione diventa **una colonna**, che
-- si aggiorna quando la sanzione si mette o scade, e l'indice torna a servire.

ALTER TABLE artista ADD COLUMN fuori INTEGER NOT NULL DEFAULT 0;

-- si riempie con quello che c'è adesso
UPDATE artista SET fuori = 1 WHERE account_id IN (
  SELECT account_id FROM sanzione
  WHERE tipo IN ('fuori_classifica','sospensione')
    AND (a IS NULL OR a > CAST(strftime('%s','now') AS INTEGER) * 1000)
);

-- l'indice che regge la graduatoria: solo chi è dentro, già in ordine
DROP INDEX IF EXISTS artista_classifica;
CREATE INDEX artista_classifica ON artista (stream DESC, creato)
  WHERE ritirato IS NULL AND fuori = 0;
