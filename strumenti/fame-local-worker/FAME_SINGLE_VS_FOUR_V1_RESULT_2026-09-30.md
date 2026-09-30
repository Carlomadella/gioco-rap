# FAME Single Agent vs Four-Role Network V1 — real result

Data: 30 settembre 2026.
Root locale: `FAME_SINGLE_VS_FOUR_V1_20260930_132135`.
Case: `single-vs-four-coordinator-causality-v1`.

## Esito

Entrambi i bracci hanno chiuso `PROPOSED_FOR_HUMAN_REVIEW` e hanno scelto correttamente `ANSWER_NO`.

### Single agent
- 1 model call;
- required evidence coverage completa;
- evidence selezionata: U02, U03;
- 2 claim;
- 1 limitation;
- elapsed: circa 21.235 s;
- prompt_eval_count: 847;
- eval_count: 1596;
- total_duration: 21.207 s;
- load_duration: 10.199 s;
- model duration excluding load: circa 11.008 s.

### Four-role network V3
- 4 model calls;
- required evidence coverage completa;
- evidence selezionata: U02, U03;
- 2 claim estratti;
- 2 limitations finali;
- Anti-Bias issues: 0;
- elapsed cumulativo: circa 70.203 s;
- prompt_eval_count cumulativo: 4989;
- eval_count cumulativo: 3749;
- total_duration cumulativo: 70.156 s;
- load_duration cumulativo: 43.261 s;
- model duration excluding load: circa 26.895 s.

## Revisione umana

Entrambe le risposte sono corrette e adeguatamente supportate.

La rete non mostra un vantaggio qualitativo osservabile su questo caso: stessa answer option, stessa required evidence coverage e stesse due evidence unit essenziali della baseline.

La rete aggiunge una formulazione finale con due limitazioni separate invece di una, ma non emerge una correzione, un controesempio o un rischio che la baseline abbia mancato.

Classificazione del caso: **pareggio qualitativo con overhead netto della rete**.

Non viene assegnato un vincitore generale e non si inferisce superiorità dell'architettura single-agent da un singolo caso.

## Costo osservato

Rispetto alla baseline, su questo caso la rete usa:
- 4x le chiamate;
- circa 5.89x i prompt token valutati;
- circa 2.35x gli output token valutati;
- circa 2.44x il model time escluso load;
- circa 3.31x l'elapsed cumulativo.

Il confronto raw dei tempi è confondibile dallo stato di caricamento del modello; il rapporto sul model time escluso load resta comunque sfavorevole alla rete in questo caso.

## Prossimo controllo

Il caso successivo deve essere nuovo e congelato prima delle risposte. Per ridurre l'effetto dell'ordine/warm state, il secondo confronto eseguirà prima la rete e poi la baseline.

Servono più casi prima di qualsiasi conclusione generale sul valore dell'architettura.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
