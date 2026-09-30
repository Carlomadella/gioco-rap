# FAME Neural — Single Agent vs Four-Role Network V2

## Scopo

Secondo confronto controllato fra:
- Four-Role Network V3;
- baseline single-agent.

L'ordine dei bracci è invertito rispetto al confronto V1 per ridurre la confusione dovuta allo stato di caricamento del modello:

`four-role-network -> single-agent`.

Il modello, digest, opzioni di generazione, domanda, answer options ed evidenze sono identici fra i due bracci. L'expected answer resta host-only.

## Case congelato

`single-vs-four-rubric-audit-generalization-v2`.

Fonte:
`strumenti/fame-local-worker/RUBRIC_AUDIT.md`
al commit sorgente `5530c2649ddda83a07511f8e0549d4ccf45723fe`.

Domanda:

> La rivalutazione documentale 2/2 del recovery autorizza a considerare la rete originale 14/14 al primo tentativo e a trattare il supporto contestuale come equivalente generale a prova diretta?

La fonte distingue esplicitamente:
- recovery rivalutato 2/2 vs risultato congelato 1/2;
- rete originale ancora 13/14;
- divieto di chiamare il risultato 14/14 al primo tentativo;
- supporto contestuale post-hoc distinto dalla prova diretta;
- divieto di generalizzare automaticamente quella equivalenza.

## Perché è più discriminante del primo caso

Il primo confronto V1 era risolvibile con due limiti molto diretti e ha prodotto un pareggio qualitativo con overhead netto della rete.

Questo secondo caso richiede di mantenere separate tre dimensioni:
1. rivalutazione successiva;
2. stato storico del first attempt;
3. forza epistemica dell'evidenza contestuale.

Un errore può quindi assumere forme diverse:
- promozione retroattiva a 14/14;
- fusione tra recovery e rete originale;
- equivalenza indebita fra supporto contestuale e prova diretta;
- generalizzazione di una decisione specifica al report.

## Misure

Come V1:
- answer option;
- required evidence coverage;
- evidence ID selezionati;
- contesto opzionale;
- claim/limitations;
- issue Anti-Bias e risoluzione;
- model calls;
- prompt/eval token;
- total/load/model duration excluding load;
- metriche umane lasciate null finché non revisionate.

Nessun winner automatico.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
