# Direct QA v2 — QA transfer protocol — risultato reale

Data: 30 settembre 2026  
Task: `qa-transfer-protocol-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_103658`

## Esito

- status: `VALIDATED_FOR_REVIEW`;
- firstAttemptPass: `true`;
- acceptedAfterRepair: `false`;
- modelCalls: 1;
- humanReviewRequired: `true`;
- executionAuthorized: `false`;
- trainingAuthorized: `false`;
- networkProductionReady: `false`;
- independentEvaluation: `false`.

## Validazione

Tutti i cinque check hanno conclusione corretta. I quattro positivi hanno coverage sufficiente; il controllo negativo ha coverage non richiesta.

Nessun errore, nessun precision warning, nessun evidence ID non revisionato. Non sono presenti `droppedEvidence` né `hostSalvageApplied`: il run è un first-attempt raw-clean PASS.

## Metriche

- `elapsedSeconds`: 19.29700000002049;
- Ollama `total_duration`: 19.2556034 s;
- Ollama `load_duration`: 10.5492523 s;
- `prompt_eval_count`: 2006;
- `eval_count`: 1252;
- `done_reason`: `stop`.

## Interpretazione

Il worker ha distinto correttamente:
- nuovo caso sperimentale da test cieco/general learning test;
- metrica transfer da semplice `VALIDATED_FOR_REVIEW`;
- salvage di surplus evidence da correzione di errori semantici o coverage mancante;
- costo della revisione umana misurato da risparmio umano presunto;
- difetto reale della rubrica da promozione retroattiva.

Il task è consumato e non va rilanciato come nuovo first attempt.
