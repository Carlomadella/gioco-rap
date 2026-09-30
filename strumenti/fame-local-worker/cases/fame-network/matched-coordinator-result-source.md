# Direct QA v2 — coordinator architecture — risultato reale

Data: 30 settembre 2026  
Task: `coordinator-architecture-review-v1`  
Root locale: `FAME_DIRECT_QA_NETWORK_V2_20260930_085819`

## Esito formale

- status: `REJECTED`;
- modelCalls: 2;
- firstAttemptPass: false;
- acceptedAfterRepair: false;
- queue status: `NEEDS_REVIEW`;
- executionAuthorized: false.

Il task è consumato e non viene ritentato.

## Attempt 1

Failure di output budget:

- `done_reason: length`;
- `eval_count: 2048`;
- `prompt_eval_count: 2693`;
- `total_duration: 23020301800 ns`;
- `load_duration: 9539042200 ns`;
- `elapsedSeconds: 23.031000000191852`;
- validation: `INVALID_RESPONSE:Risposta incompleta`.

Non esiste `candidate.json` per attempt-1.

## Attempt 2

Il repair ha ricevuto soltanto la classe generica `INVALID_RESPONSE`.

Tutte le cinque conclusioni sono corrette. Tutti i quattro check positivi hanno coverage sufficiente. Il controllo negativo è corretto.

L'unico errore formale è:

`COORDINATOR_SCOPE:UNREVIEWED_EVIDENCE`

Candidate:
- `COORDINATOR_SCOPE`: U01 + U06;
- `DESK_ISOLATION_AND_HOST_CONTROL`: U02;
- `DISTINCT_PROTOCOL_LIMIT`: U03;
- `GLOBAL_STATE_SEMANTICS`: U05;
- `COORDINATOR_AUTHORIZES_FAME_MODS_OR_TRAINING`: false, nessuna evidenza.

U06 è pertinente: ribadisce che il coordinatore non modifica algoritmi FAME Neural e non apre training, audio, batch131 o P6. Il reject è quindi classificato come precision false negative del validator, non errore semantico.

Metriche attempt-2:
- `prompt_eval_count: 2952`;
- `eval_count: 902`;
- `done_reason: stop`;
- `total_duration: 5725046600 ns`;
- `load_duration: 7281200 ns`;
- `elapsedSeconds: 5.733999999938533`.

## Hardening successivo

Commit `ee64500421a93a80c10d50d0d737eb63a0daef51`:
- `num_predict` v2 portato da 2048 a 4096;
- `coordinator-architecture-review-v1` aggiunto ai task consumati;
- evidence ID extra vengono rimossi deterministicamente dall'host solo se conclusione e required coverage sono già corrette;
- gli ID rimossi sono tracciati;
- missing evidence continua a fallire normalmente.

GitHub Actions `Verifica FAME local worker`, run `36682450395`: 59 test, OK.
