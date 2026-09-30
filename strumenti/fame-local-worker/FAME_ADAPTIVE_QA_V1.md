# FAME Neural — Adaptive QA V1

## Motivazione

Le batterie single-agent vs Four-Role Network mostrano due fatti insieme:

1. la decomposizione può essere utile nei casi difficili, per esempio quando una singola generazione tronca;
2. la rete always-on costa molto di più e, sui task documentali osservati, non migliora sistematicamente acceptance o evidence coverage.

La batteria V4 più recente ha prodotto:
- answer option corretta: 4/4 in entrambi i bracci;
- accepted: single-agent 3/4, network 2/4;
- required coverage completa: single-agent 3/4, network 2/4;
- network: 16 chiamate contro 4.

Quindi V1 adaptive non sostituisce V4: la usa come fallback.

## Flusso

`fame_adaptive_qa_v1.py`

Stage 1:
- esegue sempre `fame_single_agent_baseline_v2.py`;
- massimo 1 chiamata;
- `num_predict=16384`.

Se la baseline è `ACCEPTED`:
- nessuna escalation;
- path selezionato: `single-agent`;
- risultato: `BASELINE_ACCEPTED`.

Se la baseline produce una response ma non viene accettata:
- escalation a Four-Role Network V4;
- massimo 4 chiamate aggiuntive;
- trigger distinti per troncamento, insufficient final evidence, host reject o post-response error.

Se la baseline fallisce senza response:
- stop;
- nessuna escalation;
- lo stesso backend non viene usato come retry mascherato.

## Trigger congelati

- `BASELINE_ACCEPTED` -> NO_ESCALATION
- `OUTPUT_TRUNCATED` -> ESCALATE
- `INSUFFICIENT_FINAL_EVIDENCE` -> ESCALATE
- `HOST_REJECTED_BASELINE` -> ESCALATE
- `POST_RESPONSE_BASELINE_ERROR` -> ESCALATE
- `NO_RESPONSE_OPERATIONAL_FAILURE` -> STOP_NO_ESCALATION

Nessun retry automatico.

## Esiti

- `selectedPath=single-agent`: baseline sufficiente, 1 call;
- `selectedPath=four-role-network`: baseline fallita ma V4 recupera, fino a 5 call totali;
- `selectedPath=null`: failure non recuperato o operativo.

`recoveredByEscalation=true` solo se baseline non accettata e V4 chiude `PROPOSED_FOR_HUMAN_REVIEW`.

## Compatibilità

Baseline V2 e Network V4 non vengono modificate.
Le loro root restano separate sotto la root adaptive.
I case consumati restano bloccati dai runner figli.

## Sicurezza

Sempre:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.

## Verifica automatica

- 80 test Direct-QA: OK;
- 109 test FAME: OK.


## Fresh pilot adaptive

Case:
`adaptive-p2-measurement-pilot-v1`.

Fonte congelata:
`DIRECT_QA_P2_MEASUREMENT_EXPORT_V2_RESULT_2026-09-30.md`,
commit sorgente `1b8365225370603abc8e5b70efe0caaf770f804f`.

Domanda:
il first-attempt PASS P2 va interpretato come successo tecnico limitato, mantenendo separati risultati tecnici e inferenze causali non dimostrate, senza trasformarlo in affidabilità generale e senza rilanciare il task consumato.

Expected answer host-only:
`ANSWER_LIMITED_PASS`.

Required evidence:
- U01: first-attempt PASS + distinzione tecnico/causale;
- U02: nessuna affidabilità generale;
- U03: task consumato da non rilanciare.

U04 è optional context.

Questo pilot non è scelto per forzare escalation. Se il single-agent chiude clean, il comportamento atteso dell'architettura adaptive è fermarsi dopo una sola chiamata.

Verifica automatica pre-run:
- 80 Direct-QA: OK;
- 110 FAME: OK.
