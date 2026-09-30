# Direct QA v2 — P2 measurement/export audit — risultato reale

Data: 30 settembre 2026  
Task: `p2-measurement-export-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_084912`

## Esito

- status: `VALIDATED_FOR_REVIEW`;
- firstAttemptPass: `true`;
- acceptedAfterRepair: `false`;
- modelCalls: 1;
- attempt-2: non eseguito;
- executionAuthorized: `false`;
- trainingAuthorized: `false`;
- networkProductionReady: `false`;
- independentEvaluation: `false`.

## Validazione

Tutti i cinque check sono stati accettati:

1. `CONSUMED_COHORT_SCOPE` — conclusione corretta, coverage sufficiente;
2. `P2_JSON_MIDI_AUDIT` — conclusione corretta, coverage sufficiente;
3. `V1_RENDERER_DURATION_BEHAVIOR` — conclusione corretta, coverage sufficiente;
4. `P2_CAUSAL_LIMITS` — conclusione corretta, coverage sufficiente;
5. `P2_AUTHORIZES_TRAINING_OR_BATCH131` — conclusione corretta; coverage non richiesta perché controllo negativo.

Nessun `precisionWarning` e nessun `unreviewedEvidenceId`.

La review usa esattamente le unità minime previste:
- U01 per lo scope del cohort consumato;
- U03 per il risultato tecnico P2;
- U04 per il comportamento temporale del renderer v1;
- U05 per i limiti causali;
- nessuna evidenza per il controllo negativo finale.

Questo è coerente con la regola di authoring introdotta dopo il false negative del secondo run.

## Metriche

- `elapsedSeconds`: 16.42199999978766;
- Ollama `total_duration`: 16.4031867 s;
- Ollama `load_duration`: 8.5568581 s;
- `prompt_eval_count`: 1832;
- `eval_count`: 1173;
- `done_reason`: `stop`.

Le durate Ollama sono conversioni dai nanosecondi registrati nel report locale.

## Interpretazione

Questo è il secondo first-attempt PASS reale della v2 su tre task reali v2 eseguiti. Il terzo task era deliberatamente diverso dai due Tsumugi e richiedeva di distinguere risultati tecnici da inferenze causali non dimostrate.

Il risultato non certifica affidabilità generale della rete e non autorizza nuove attività Audio→MIDI, training, batch131 o produzione.

Il task è consumato e non deve essere rilanciato in una nuova root come nuovo first attempt.
