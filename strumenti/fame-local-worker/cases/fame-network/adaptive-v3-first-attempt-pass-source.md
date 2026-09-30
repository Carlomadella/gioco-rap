# Direct QA v2 — Tsumugi score diagnostic — primo run reale

Data: 30 settembre 2026  
Branch: `feature/fame-neural-roadmap`  
Task: `tsumugi-score-diagnostic-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_081223`

## Esito

Il primo run reale del worker v2 ha restituito:

- status: `VALIDATED_FOR_REVIEW`;
- `firstAttemptPass: true`;
- `acceptedAfterRepair: false`;
- model calls: 1;
- attempt-2: non eseguito;
- `executionAuthorized: false`;
- `trainingAuthorized: false`;
- `networkProductionReady: false`;
- `independentEvaluation: false`.

Il package congelato ha SHA256 `2812d1438e2470ae0d9d8c59308a5e016172616a99a8b6d25b73fc91a82d92a4` e punta alla fonte commit `022ef352e00cfa0aca7a3dae9a9478c8c3c49626`.

## Validazione

Il validator host ha accettato tutti i cinque check senza errori:

1. `RAW_PITCH_RECONSTRUCTION` — conclusione corretta, coverage sufficiente;
2. `SCORE_HEAD_FAILURE_LOCALIZED` — conclusione corretta, coverage sufficiente;
3. `NO_SYNTHETIC_DECODER_TUNING` — conclusione corretta, coverage sufficiente;
4. `REAL_EASY_COHORT_SCOPE` — conclusione corretta, coverage sufficiente;
5. `FRESH_EVALUATION_OR_PROMOTION_AUTHORIZED` — conclusione corretta; coverage non richiesta perché controllo negativo.

Nessun `precisionWarning` e nessun `unreviewedEvidenceId` sono stati registrati. La `review.md` mostrata nella sessione usa U02+U03, U04+U06, U07 e U08 per i quattro check positivi e restituisce `False` sul controllo negativo finale, coerentemente con la rubrica congelata.

`humanReviewRequired` resta `true`: la review è stata ispezionata nella sessione, ma non è stato misurato separatamente un tempo di revisione umana e questo report non lo inventa.

## Metriche registrate

- `elapsedSeconds`: 16.95299999997951;
- Ollama `total_duration`: 16.9199165 s;
- Ollama `load_duration`: 9.8611942 s;
- `prompt_eval_count`: 1319;
- `eval_count`: 1050;
- `done_reason`: `stop`.

Le durate Ollama sopra sono conversioni dei nanosecondi registrati nel report locale. Non sono una misura completa del costo umano del workflow.

## Interpretazione

Questo è un PASS reale al primo tentativo della v2 e dimostra che, su questo nuovo task documentale congelato, il worker può produrre una risposta conforme senza repair. Non dimostra affidabilità generale, non valida una rete autonoma multi-agent e non autorizza attività Audio→MIDI, training, P6 o produzione.

Durante l'esecuzione è emerso un difetto CLI: `--task` / `--tasks` erano stati resi globalmente obbligatori, quindi anche `run` e `status` li richiedevano pur ricavando il task dalla root congelata. Il fix successivo rende questi argomenti necessari solo per `init` e aggiunge test di regressione.
