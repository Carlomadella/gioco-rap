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

## Cos'è arrivato qui e perché (05/09/2026)

Quattro immagini che stavano in `media/` senza che nessuna riga di codice le
chiedesse mai: finivano nel pacchetto per gli store, 9,6 MB addosso a chi
installa il gioco per niente.

- `skill_tree_a_colonne.png` e `skill_tree_ramificato.png` — le due strade
  scartate per l'albero delle abilità. Quella scelta è diventata
  `media/photo/pagina_skill_tree/albero-abilita.png`, che il gioco carica
  davvero (punto 13).
- `booth_registrazione_notturno.png` e `control_room_notturna.png` — due
  fondali per le scene del personaggio, mai collegati a niente.
