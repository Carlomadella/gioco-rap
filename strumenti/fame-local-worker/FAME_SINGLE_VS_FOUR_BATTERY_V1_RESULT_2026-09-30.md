# FAME Single Agent vs Four-Role Network — Battery V1 real result

Data: 30 settembre 2026.

## Stato globale

`COMPLETE_FOR_HUMAN_REVIEW`.

Quattro casi pre-registrati e completati, con ordine dei bracci bilanciato 2/2.

Automatic summary:
- entrambi corretti rispetto alla host rubric: 3/4;
- solo single-agent corretto: 0/4;
- solo Four-Role Network corretto: 1/4;
- nessuno corretto: 0/4;
- required evidence coverage completa: single-agent 3/4, network 4/4;
- accepted: single-agent 3/4, network 4/4;
- model calls: single-agent 4, network 16.

Il quarto caso NON viene ancora classificato come vantaggio semantico della rete: il single-agent ha `NEEDS_REVIEW`, output nullo e una response salvata, ma il summary originale non conserva il motivo del failure.

## Caso 1 — QA transfer

Entrambi `ANSWER_NO` e coverage completa.

Single-agent:
- U01, U02, U04;
- 2 claim;
- 1 limitation;
- 1 call.

Network:
- U01–U04;
- 5 claim estratti;
- 1 limitation;
- 1 issue Anti-Bias non bloccante, risolto;
- 4 call.

Nessun vantaggio automatico assegnato.

## Caso 2 — Recovery

Entrambi `ANSWER_NO` e coverage completa.

Single-agent:
- U01, U02, U04;
- 2 claim.

Network:
- U01, U02;
- 3 claim;
- nessun issue Anti-Bias.

Su questo caso la rete è più parsimoniosa negli evidence ID, ma non cambia la risposta.

## Caso 3 — GPT-OSS diagnostic

Entrambi `ANSWER_NO` e coverage completa.

Single-agent:
- U02, U03, U04;
- 2 claim.

Network:
- U01–U04;
- 4 claim;
- nessun issue Anti-Bias.

Nessuna correzione automatica osservata rispetto alla baseline.

## Caso 4 — Anti-Bias protocol

Network:
- `ACCEPTED`;
- `ANSWER_NO`;
- U01 + U02;
- coverage completa;
- 2 claim;
- 2 limitations;
- 4 call.

Single-agent:
- `NEEDS_REVIEW`;
- `accepted=false`;
- output nullo;
- coverage non materializzata;
- 1 model call registrata;
- elapsed circa 26.422 s;
- metriche response assenti nell'aggregato.

Il pattern indica che la chiamata ha prodotto `response.json` ma il tentativo è fallito dopo la chiamata. Il summary non permette di distinguere OUTPUT_TRUNCATED, final content vuoto, JSON invalido o altro errore post-response.

Aggiunto `fame_battery_attempt_diagnostic.py`, read-only e senza chiamate modello, per classificare il tentativo storico.

## Costi aggregati automatici

Network:
- prompt_eval_count: 19539;
- eval_count: 15838;
- model duration excluding load: 103.669 s.

Single-agent:
- prompt_eval_count: 2290;
- eval_count: 2964;
- model duration excluding load: 19.606 s.

I totali single-agent NON sono direttamente confrontabili con quelli network perché nel quarto caso il summary del tentativo fallito espone metriche a zero. Il diagnostico storico deve recuperare il `done_reason` e le metriche della response prima di calcolare un rapporto finale.

## Interpretazione provvisoria

La batteria non sostiene ancora una vittoria semantica generale della rete.

Fatti osservati:
- nei primi tre casi entrambi i bracci arrivano alla risposta attesa;
- nel quarto caso la rete completa il task e il single-agent no;
- il quarto failure deve essere classificato prima di attribuirne la causa;
- la rete richiede 4x le chiamate per caso;
- la selezione dell'evidenza non è uniformemente più parsimoniosa in uno dei due bracci.

## Consumo

Tutti i quattro case della batteria sono consumati e bloccati per nuovi init sia nel Four-Role runner sia nella baseline.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
