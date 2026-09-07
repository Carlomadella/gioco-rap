-- 008 · Il diario di bordo, accanto all'artista.
--
-- Il gioco ha imparato a contare cose che prima non contava nessuno (punto 14
-- di ALE, «Statistiche» del telefono): `G.diario` tiene **le serate live** e
-- **i feat** fatti in carriera, e sono numeri che crescono e non scendono mai.
-- Il server non ne sapeva niente, quindi la classifica non poteva dire nulla
-- di quello che uno ha fatto fuori dalla sala — e non era una mancanza da
-- poco: fra due artisti con gli stessi ascolti, quello che ha fatto trenta
-- serate ha una carriera diversa.
--
-- **Il terzo contatore del diario, `colpi`, resta fuori apposta.** È il conto
-- dei colpi messi a segno: dentro alla partita è roba tua, in una classifica
-- pubblica sarebbe una denuncia firmata. Se un giorno servirà, si aggiunge
-- allora e si decide chi lo può vedere.
--
-- **La graduatoria non si tocca**: queste due colonne si leggono e si mostrano,
-- non entrano nell'ordinamento — come `difficolta` della 007.
--
-- I bot non hanno queste colonne scritte, e non è una dimenticanza: i loro
-- numeri si calcolano al momento della lettura (`bot.js`, `ritratto()`) da
-- quello che già si sa di loro. Meglio un numero derivato ogni volta che un
-- numero finto scritto nel database e da tenere aggiornato a mano.

ALTER TABLE artista ADD COLUMN live INTEGER NOT NULL DEFAULT 0 CHECK (live >= 0);
ALTER TABLE artista ADD COLUMN feat INTEGER NOT NULL DEFAULT 0 CHECK (feat >= 0);
