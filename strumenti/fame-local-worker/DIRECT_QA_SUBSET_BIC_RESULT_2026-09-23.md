# Direct QA — subset+BIC review v1 — first real run

Data: 2026-09-23.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_002 / subset-bic-review-v1 / attempt-1`.

## Esito

Il run ha restituito `REJECTED` con una sola chiamata al modello. Il secondo comando `run` non ha rieseguito il modello: la coda ha riletto la desk gia consumata.

Validazione:

- 5/5 conclusioni corrette;
- tutte le finding supportate hanno coverage `SUFFICIENT`;
- unico errore: `TSUMUGI_PREFLIGHT_SCOPE:UNREVIEWED_EVIDENCE`;
- evidence aggiuntiva: `U13`.

`U13` e soltanto il heading Markdown `## Ricerca per il prossimo ramo`. Non contiene una nuova affermazione fattuale e non contraddice la finding. La finding Tsumugi aveva gia coverage sufficiente tramite `U12`.

## Interpretazione

Il risultato storico resta `REJECTED`: il pacchetto e il validatore erano congelati prima del run e non vengono modificati retroattivamente.

La causa del reject e un difetto di authoring del pacchetto, non una conclusione semantica errata del modello: i heading Markdown erano stati separati in unita autonome. Per i task futuri, heading e blocco semantico immediatamente seguente devono essere mantenuti nella stessa unita quando il heading non porta contenuto autonomo.

Non eseguire retry di `subset-bic-review-v1` in una nuova root.
