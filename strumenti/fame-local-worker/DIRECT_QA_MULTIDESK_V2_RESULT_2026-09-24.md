# Direct QA — multi-desk v2 checkpoint — first real queue

Data: 2026-09-24.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_V2_002`.

## Esito queue

Due desk nuove, eseguite in sequenza:

1. `coordinator-architecture-v2`
   - `status=REJECTED`;
   - `modelCalls=2`;
   - `firstAttemptPass=false`;
   - `acceptedAfterRepair=false`.

2. `package-authoring-v2`
   - `status=VALIDATED_FOR_REVIEW`;
   - `modelCalls=1`;
   - `firstAttemptPass=true`;
   - `acceptedAfterRepair=false`.

Queue:

- `status=NEEDS_REVIEW`;
- `executionAuthorized=false`.

La root e consumata e non va rilanciata.

## Coordinator — attempt 1

Il modello ha prodotto 5/5 conclusioni corrette e coverage sufficiente per tutti
i check positivi.

Gli unici errori host sono stati:

- `NO_MAJORITY_OR_AUTO_REASSIGN:UNREVIEWED_EVIDENCE` per U01;
- `GLOBAL_VALIDATION_GATE:UNREVIEWED_EVIDENCE` per U01.

Quindi attempt-1 non contiene un errore semantico o di coverage. Il reject e
interamente dovuto a precisione/evidence policy.

## Coordinator — repair

Feedback inviato:

```text
SOME_EVIDENCE_NOT_NEEDED_OR_UNREVIEWED
oracleTargetsSent=false
checkIdsSentInFeedback=false
```

Il secondo tentativo ha:

- mantenuto 5/5 conclusioni corrette;
- mantenuto coverage sufficiente;
- rimosso U01 da `NO_MAJORITY_OR_AUTO_REASSIGN`;
- mantenuto U01 come evidence aggiuntiva per `GLOBAL_VALIDATION_GATE`.

Errore residuo:

```text
GLOBAL_VALIDATION_GATE:UNREVIEWED_EVIDENCE
```

Il repair e quindi **parzialmente efficace**: riduce gli errori di precisione da
2 a 1 senza ricevere check ID, target o expected evidence.

## Classificazione del reject coordinator

Il risultato storico resta `REJECTED` perche package e rubrica erano congelati
prima del run.

La classificazione tecnica e:

```text
PRECISION_REJECT_WITH_PARTIAL_REPAIR
semantic conclusions: 5/5 correct
positive coverage: all sufficient
attempt-1 unreviewed evidence errors: 2
attempt-2 unreviewed evidence errors: 1
```

U01 contiene contesto realmente pertinente all'architettura generale e al
numero di scrivanie, ma non era dichiarata `benignContext` per i due check che
l'hanno ricevuta. Non si modifica retroattivamente il task consumato per
trasformare il reject in PASS.

## Package authoring desk

La review umana di `package-authoring-v2` e coerente con la validazione host:

- 5/5 conclusioni corrette;
- tutti i check positivi con coverage `SUFFICIENT`;
- nessuna evidence non revisionata;
- un solo `precisionWarning`: U03 su `SEMANTIC_UNIT_RULE`;
- U03 era gia dichiarata benign context, quindi il warning non blocca il PASS.

Questo confronto mostra la differenza operativa tra evidence contestuale
**pre-dichiarata benign** e evidence contestuale non classificata.

## Conseguenza per i task futuri

Non allargare automaticamente il validatore e non rendere ogni evidence extra
accettabile.

Durante l'authoring pre-run, per ogni check positivo occorre distinguere:

1. evidence richiesta per coprire la finding;
2. evidence contestuale ragionevolmente citabile ma non necessaria
   (`benignContext`);
3. evidence realmente estranea, che deve continuare a produrre
   `UNREVIEWED_EVIDENCE`.

La classificazione deve essere congelata prima della prima chiamata del nuovo
task. Questa regola si applica solo a nuovi task ID; non modifica gli esiti
consumati.

## Interpretazione

La queue multi-desk ha funzionato come progettato:

- ha eseguito entrambe le desk in sequenza;
- il reject semantico/citazionale della prima desk non ha impedito l'esecuzione
  della seconda;
- la seconda desk ha mantenuto il proprio first-pass indipendente;
- l'aggregazione finale `NEEDS_REVIEW` riflette correttamente una desk rejected
  e una validated;
- il repair generico ha mostrato un miglioramento misurabile ma non sufficiente.

Questo checkpoint non dimostra affidabilita generale della rete e non autorizza
autonomia operativa.
