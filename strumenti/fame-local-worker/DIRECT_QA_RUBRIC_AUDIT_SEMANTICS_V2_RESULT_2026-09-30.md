# Direct QA v2 — rubric audit semantics — risultato reale

Data: 30 settembre 2026  
Task: `rubric-audit-semantics-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_092045`

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

Tutti i cinque check sono corretti:

1. `SEMANTIC_FAIL_LABEL_LIMIT` — conclusione corretta, coverage sufficiente;
2. `CONTEXTUAL_VS_DIRECT_EVIDENCE` — conclusione corretta, coverage sufficiente;
3. `SIDECAR_PRESERVES_HISTORY` — conclusione corretta, coverage sufficiente;
4. `NEXT_PROTOCOL_DISCIPLINE` — conclusione corretta, coverage sufficiente;
5. `AUDIT_PROMOTES_NETWORK_OR_INDEPENDENT_EVAL` — conclusione corretta; coverage non richiesta perché controllo negativo.

Nessun errore, nessun precision warning, nessun evidence ID non revisionato. Il salvage host-side non è stato necessario: il candidato era già pulito.

## Metriche

- `elapsedSeconds`: 17.70299999997951;
- Ollama `total_duration`: 17.6901249 s;
- Ollama `load_duration`: 8.8087411 s;
- `prompt_eval_count`: 2824;
- `eval_count`: 1275;
- `done_reason`: `stop`.

## Interpretazione

Questo è un first-attempt PASS reale su un task più epistemico dei precedenti: il modello ha distinto correttamente etichetta del validator, forza della prova, rivalutazione sidecar e stato storico congelato.

Il risultato non costituisce independent evaluation e non certifica affidabilità generale o production readiness della rete.

Il task è consumato e non va rilanciato come nuovo first attempt.
