# I concept

Le immagini di riferimento: quelle che dicono *come deve sembrare*, non quelle
che il gioco carica davvero.

Stavano dentro a `media/photo/`, ed era il posto sbagliato: `strumenti/build.js`
copia `media/` intera dentro al pacchetto per gli store, quindi ogni concept
finiva addosso a chi installa il gioco senza che nessuna riga di codice lo
chiedesse mai. Qui fuori non ci finiscono più — il build non guarda in questa
cartella.

Regola: se un file di questa cartella serve al gioco, non va richiamato da qui.
Va spostato in `media/`, e allora smette di essere un concept.
