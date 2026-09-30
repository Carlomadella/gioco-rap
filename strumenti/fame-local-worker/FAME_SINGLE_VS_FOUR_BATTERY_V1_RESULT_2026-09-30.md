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

Il diagnostico read-only successivo ha classificato il tentativo in modo definitivo come `OUTPUT_TRUNCATED`:
- `resultStatus=ERROR`;
- errore `ValueError: Risposta incompleta`;
- `done_reason=length`;
- `eval_count=4096`;
- content presente: 17015 caratteri;
- thinking presente: 3110 caratteri;
- content finale non parseabile come JSON;
- nessuna chiamata modello eseguita dal diagnostico.

Quindi il single-agent non è stato dimostrato semanticamente errato: ha esaurito il budget massimo di generazione della singola chiamata.

## Costi aggregati automatici

Network:
- prompt_eval_count: 19539;
- eval_count: 15838;
- model duration excluding load: 103.669 s.

Single-agent:
- prompt_eval_count: 2290;
- eval_count: 2964;
- model duration excluding load: 19.606 s.

Il diagnostico storico recupera per il quarto single-agent:
- total_duration: 26.418 s;
- load_duration: 0.004 s;
- prompt_eval_count: 640;
- eval_count: 4096.

Correggendo il totale single-agent con queste metriche storiche:
- prompt_eval_count totale: 2930;
- eval_count totale: 7060;
- model duration excluding load: circa 46.020 s.

La rete resta più costosa:
- circa 6.67x prompt token;
- circa 2.24x eval token;
- circa 2.25x model time excluding load;
- 16 call contro 4.

## Interpretazione finale della Battery V1

La batteria non sostiene una vittoria semantica generale della rete.

Fatti osservati:
- nei primi tre casi entrambi i bracci arrivano alla risposta attesa;
- nel quarto caso la rete completa il task mentre il single-agent viene troncato al limite di 4096 token;
- non è osservato un quarto caso in cui il single-agent fornisca una conclusione semantica errata corretta dalla rete;
- la rete richiede 4x le chiamate per caso e più costo complessivo;
- la selezione dell'evidenza non è uniformemente più parsimoniosa in uno dei due bracci.

### Confondente di budget

I due bracci usano le stesse opzioni **per chiamata**, ma non lo stesso budget totale di generazione:
- single-agent: massimo 1 × 4096 token;
- Four-Role Network: massimo 4 × 4096 token distribuiti fra quattro chiamate.

Il quarto caso dimostra quindi un vantaggio di robustezza operativa della decomposizione **sotto un limite per-call di 4096 token**, ma non permette di attribuire il vantaggio alla decomposizione indipendentemente dal maggiore budget totale disponibile alla rete.

Servono due estimand distinti nei test successivi:
1. **fixed per-call budget**: misura la robustezza del sistema reale con il limite corrente;
2. **matched total generation budget**: misura se la decomposizione aggiunge valore a parità di budget complessivo.

## Consumo

Tutti i quattro case della batteria sono consumati e bloccati per nuovi init sia nel Four-Role runner sia nella baseline.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
