-- 006 · Un ordine dichiarato per i traguardi.
--
-- `catalogo()` leggeva `ORDER BY rowid`: l'ordine in cui sono stati inseriti.
-- Ma `rowid` è una cosa di SQLite e basta — qui non esiste proprio, ed è il
-- motivo per cui l'ordine è diventato una colonna. La riempie
-- `seminaTraguardi()` con la posizione nell'elenco scritto in `archivio.js`.
--
-- Qui non c'è nessun `UPDATE` di recupero come nella gemella SQLite: un
-- database PostgreSQL nasce adesso, e a questo punto `traguardo` è ancora vuota.

ALTER TABLE traguardo ADD COLUMN ordine INTEGER NOT NULL DEFAULT 0;
