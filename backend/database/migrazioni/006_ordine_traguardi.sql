-- 006 · Un ordine dichiarato per i traguardi.
--
-- `catalogo()` leggeva `ORDER BY rowid`: l'ordine in cui sono stati inseriti.
-- Funziona, ma `rowid` è una cosa di SQLite e basta — su PostgreSQL non esiste,
-- e un ordine che dipende da come il database tiene le righe non è un ordine,
-- è una coincidenza che finora ha retto.
--
-- Adesso l'ordine è una colonna, la riempie `seminaTraguardi()` con la
-- posizione nell'elenco scritto in `archivio.js`, ed è la stessa su tutti e due
-- i database.

ALTER TABLE traguardo ADD COLUMN ordine INTEGER NOT NULL DEFAULT 0;
UPDATE traguardo SET ordine = rowid WHERE ordine = 0;
