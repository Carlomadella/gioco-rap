# Direct QA v2 — V1 architecture failure review — risultato reale

Data: 30 settembre 2026  
Task: `tsumugi-v1-architecture-failure-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_082657`

## Esito formale

- queue status: `NEEDS_REVIEW`;
- task status: `REJECTED`;
- model calls: 2;
- firstAttemptPass: false;
- acceptedAfterRepair: false;
- executionAuthorized: false.

## Esito semantico verificato

Entrambi i tentativi hanno prodotto **5/5 conclusioni corrette**. L'unico errore del validator in attempt-1 e attempt-2 è:

`UNVERIFIED_ARCH_ASSUMPTION:INSUFFICIENT_EVIDENCE`

In entrambi i tentativi il modello ha citato soltanto `U04` per quel check.

La rubrica congelata richiedeva invece `U03` + `U04`. Questa richiesta era sovravincolata: `U04` contiene già l'intera proposizione verificata — presupposto architetturale non verificato, tentativo di leggere un output V2, KeyError coerente con checkpoint V1 e necessità di verificare `semi_crf_version` via doctor read-only.

Classificazione: **false negative di packaging/rubric**, non errore semantico del modello.

Il task resta consumato e non viene ricalcolato o ritentato con una rubrica modificata.

## Attempt 1

- status: `REJECTED_REPAIR_PENDING`;
- elapsedSeconds: 18.218999999808148;
- prompt_eval_count: 1360;
- eval_count: 1393;
- total_duration: 18.1965363 s;
- load_duration: 8.9954043 s;
- 5/5 conclusioni corrette;
- un solo errore: coverage insufficiente sul check sopra.

## Attempt 2

Feedback inviato: solo categoria generica `SOME_EVIDENCE_COVERAGE_INSUFFICIENT`.

- status: `REJECTED`;
- elapsedSeconds: 6.375;
- prompt_eval_count: 1639;
- eval_count: 1007;
- total_duration: 6.3407666 s;
- load_duration: 0.0058004 s;
- 5/5 conclusioni corrette;
- stesso identico evidence choice: `U04`;
- stesso unico errore di coverage.

## Conseguenza per la rete

Il run mostra due cose separate:

1. il worker ha mantenuto corrette tutte le conclusioni anche su un task più difficile;
2. il repair generico non può correggere un errore quando il validator stesso impone una copertura non necessaria.

Per i task futuri la rubrica non deve obbligare una seconda unità di background quando una singola unità contiene già tutte le componenti dell'affermazione. I task reali consumati restano immutabili; la correzione vale per l'authoring futuro.
