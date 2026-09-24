# Direct QA — V2_004 transfer + review-boundary result

Data: 2026-09-24.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_V2_004`.

## Esito queue

1. `transfer-protocol-v2`
   - `status=VALIDATED_FOR_REVIEW`;
   - `modelCalls=1`;
   - `firstAttemptPass=true`;
   - `acceptedAfterRepair=false`.

2. `review-boundary-v2`
   - `status=REJECTED`;
   - `modelCalls=2`;
   - `firstAttemptPass=false`;
   - `acceptedAfterRepair=false`.

Queue:

- `status=NEEDS_REVIEW`;
- `executionAuthorized=false`.

La root e consumata e non deve essere rilanciata.

## review-boundary — attempt 1

Il candidato ha prodotto 6/7 conclusioni corrette.

Unico errore semantico:

```text
V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING = true
```

La fonte congelata dice invece che in v6 il salvage dell'evidence extra avviene
solo quando la coverage richiesta e gia completa. Se la coverage manca,
l'evidence irrilevante resta un errore insieme a `INSUFFICIENT_EVIDENCE`.

Gli altri check risultano corretti. In particolare:

- policy operativa host-owned: corretta;
- VALIDATED_FOR_REVIEW distinto da autorizzazione: corretto;
- retry assistito distinto da successo spontaneo: corretto;
- salvage v6 con coverage completa: corretto;
- modello senza repo/shell autonomi: corretto;
- singolo report non prova network readiness: corretto.

## Repair v2

Feedback inviato:

```text
SOME_CONCLUSION_INCORRECT
oracleTargetsSent=false
checkIdsSentInFeedback=false
```

Attempt-2 ha restituito lo stesso valore errato per
`V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING`.

Risultato:

```text
6/7 conclusions correct
same genuine semantic error after repair
coverage of positive findings = sufficient
no unreviewed evidence
one benign precision warning: U07 on HOST_OWNS_ACTION_POLICY
```

## Classificazione

Questa volta il reject non deriva da packaging, required-group ridondanti o
precisione.

Classificazione:

```text
GENUINE_SEMANTIC_REJECT_REPAIR_UNCHANGED
```

Il repair v2 non ha modificato il check semanticamente errato nonostante la
classe generica `SOME_CONCLUSION_INCORRECT`.

## Implicazione architetturale

Il payload v2 del repair reinserisce la risposta precedente come messaggio
assistant e poi chiede una ricostruzione completa. Nel caso V2_004 il secondo
candidato e rimasto ancorato allo stesso booleano errato.

Questo singolo caso non dimostra causalmente che il replay della risposta sia la
causa del mancato repair. Tuttavia giustifica un nuovo protocollo sperimentale,
separato da v2, che mantenga:

- stesso snapshot;
- stesse classi generiche del validator;
- nessun check ID;
- nessun target booleano;
- nessuna rubrica host;
- massimo due chiamate;

ma non ripresenti il candidato precedente nel secondo prompt e chieda una
ricostruzione indipendente da zero.

V2 resta congelato per preservare la verificabilita delle root storiche.
