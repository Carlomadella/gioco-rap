# Direct QA v2 — recovery protocol — risultato reale

Data: 30 settembre 2026  
Task: `recovery-protocol-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_093655`

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

Tutti i cinque check hanno conclusione corretta. Tutti i quattro positivi hanno coverage sufficiente; il controllo negativo ha coverage non richiesta.

Il run non è però equivalente ai due PASS precedenti: il salvage host-side è intervenuto per rimuovere evidence ID superflui da due finding già correttamente coperte:

- `RECOVERY_BOUNDED_TWO_SUBTASKS`: rimosso U03;
- `NO_AUTOMATIC_RETRY_OR_RECREATION`: rimosso U02.

Per `RECOVERY_PRESERVES_FIRST_PASS` restano precision warning su U01 e U02, entrambi dichiarati benign context; non esistono evidence ID non revisionati.

Quindi il PASS è semanticamente valido, ma con selezione delle prove meno precisa rispetto ai run quinto e sesto.

## Metriche

- `elapsedSeconds`: 18.875;
- Ollama `total_duration`: 18.868279 s;
- Ollama `load_duration`: 7.5456699 s;
- `prompt_eval_count`: 2203;
- `eval_count`: 1715;
- `done_reason`: `stop`.

## Interpretazione

Il nuovo salvage v2 ha funzionato nel caso reale previsto: ha eliminato solo citazioni superflue dopo aver verificato conclusione corretta e required coverage già sufficiente. Non ha inventato coverage mancante e non ha corretto conclusioni errate.

Il risultato non costituisce independent evaluation e non certifica affidabilità generale o production readiness della rete.

Il task è consumato e non va rilanciato come nuovo first attempt.
