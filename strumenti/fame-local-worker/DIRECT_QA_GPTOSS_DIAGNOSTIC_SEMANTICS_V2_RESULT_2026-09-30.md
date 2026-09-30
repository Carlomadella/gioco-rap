# Direct QA v2 — GPT-OSS diagnostic semantics — risultato reale

Data: 30 settembre 2026  
Task: `gptoss-diagnostic-semantics-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_103151`

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

Il salvage host-side è intervenuto una sola volta:
- `OUTPUT_TRUNCATED_NOT_SEMANTIC`: rimosso U01.

Non ci sono precision warning residui né evidence ID non revisionati. Quindi il PASS è semanticamente valido e quasi raw-clean: una sola citazione superflua è stata eliminata dopo verifica di coverage già sufficiente.

## Metriche

- `elapsedSeconds`: 16.843000000109896;
- Ollama `total_duration`: 16.8176985 s;
- Ollama `load_duration`: 8.8960558 s;
- `prompt_eval_count`: 1703;
- `eval_count`: 1179;
- `done_reason`: `stop`.

## Interpretazione

Il worker distingue correttamente:
- variazione sperimentale think=low;
- troncamento di output;
- errore semantico con JSON finale presente;
- risposta invalida;
- errore operativo.

In particolare, il controllo negativo conferma che un run terminato per length senza content finale non viene classificato come prova di fallimento semantico del modello.

Il task è consumato e non va rilanciato come nuovo first attempt.
