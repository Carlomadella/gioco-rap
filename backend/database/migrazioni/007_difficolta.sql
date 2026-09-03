-- 007 · La difficoltà della carriera, accanto all'artista.
--
-- Il gioco è arrivato a tre difficoltà («strada aperta», «anni di fame»,
-- «niente sconti»): si scelgono all'avvio e restano scritte nella carriera.
-- Il server non ne sapeva niente, e la classifica è **una sola per tutti** —
-- quindi finché il bilanciamento è identico non cambia una virgola, ma il
-- giorno che i tre livelli pesano davvero, senza questa colonna non si potrà
-- più sapere a posteriori chi ha corso con quali regole. Una riga di storia
-- che non si recupera dopo, quindi si comincia a scriverla adesso.
--
-- Di suo `anni-di-fame`: è il riferimento del gioco, ed è quello che avevano
-- di fatto tutte le carriere fino a qui. I bot restano lì sopra anche loro —
-- corrono sul bilanciamento base, che è esattamente quello.
--
-- **La graduatoria non si tocca**: questa colonna si legge e si filtra, non
-- entra nell'ordinamento. Dividere la classifica è una scelta di gioco, non
-- una conseguenza tecnica di una migrazione.

ALTER TABLE artista ADD COLUMN difficolta TEXT NOT NULL DEFAULT 'anni-di-fame';

CREATE INDEX artista_difficolta ON artista (difficolta) WHERE ritirato IS NULL;
