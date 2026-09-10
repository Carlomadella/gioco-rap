-- 008 · Il diario di bordo, accanto all'artista.
--
-- La gemella di `migrazioni/008_diario.sql`: stesse due colonne, stesso valore
-- di suo, stesso vincolo. Il perché sta scritto per esteso lì.
--
-- In breve: il telefono del gioco tiene il conto delle serate live e dei feat
-- (`G.diario`), il server non li aveva, e sono la differenza fra due carriere
-- con gli stessi ascolti. `colpi` resta fuori apposta. Non entrano
-- nell'ordinamento della classifica.
--
-- Qui le due `ALTER TABLE` stanno in una riga sola: PostgreSQL le sa fare
-- insieme, e una transazione sola è una cosa in meno che può restare a metà.

ALTER TABLE artista
  ADD COLUMN live INTEGER NOT NULL DEFAULT 0 CHECK (live >= 0),
  ADD COLUMN feat INTEGER NOT NULL DEFAULT 0 CHECK (feat >= 0);
