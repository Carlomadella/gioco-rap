-- 007 · La difficoltà della carriera, accanto all'artista.
--
-- La gemella di `migrazioni/007_difficolta.sql`: stessa colonna, stesso valore
-- di suo, stesso indice parziale. Il perché sta scritto per esteso lì.
--
-- In breve: il gioco ha tre difficoltà, la classifica resta una sola, e questa
-- colonna serve a sapere **con quali regole** è stato fatto un punteggio il
-- giorno che i tre livelli peseranno davvero. Non entra nell'ordinamento.

ALTER TABLE artista ADD COLUMN difficolta TEXT NOT NULL DEFAULT 'anni-di-fame';

CREATE INDEX artista_difficolta ON artista (difficolta) WHERE ritirato IS NULL;
