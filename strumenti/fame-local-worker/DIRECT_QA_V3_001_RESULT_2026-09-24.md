# Direct QA — V3_001 fresh reconstruction diagnostic result

Data: 2026-09-24.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_V3_001`.

## Esito

Task:

```text
review-boundary-repair-v3
```

Queue:

```text
status = NEEDS_REVIEW
executionAuthorized = false
```

Desk:

```text
status = REJECTED
modelCalls = 2
firstAttemptPass = false
acceptedAfterRepair = false
```

La root e consumata e non deve essere rilanciata.

## Attempt 1

Validation operator-reported:

```text
accepted = false
errors = [
  V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING:INCORRECT_CONCLUSION
]
```

Gli altri sei check risultano corretti.

Quindi attempt-1 riproduce esattamente il genuine semantic error gia osservato
nel caso V2_004:

```text
V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING = true
```

mentre la fonte congelata richiede `false`.

## Attempt 2 — fresh reconstruction

Candidate operator-reported:

- `HOST_OWNS_ACTION_POLICY=true` con sola evidence `U07`;
- `V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING=true` con `U08`;
- gli altri cinque check corretti.

Validation:

```text
accepted = false
errors = [
  HOST_OWNS_ACTION_POLICY:INSUFFICIENT_EVIDENCE,
  V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING:INCORRECT_CONCLUSION
]
```

Quindi il fresh reconstruction:

1. **non corregge** il genuine semantic error gia presente in attempt-1;
2. introduce un nuovo errore di coverage su `HOST_OWNS_ACTION_POLICY`.

Per `HOST_OWNS_ACTION_POLICY`, la rubrica congelata richiede U03. U07 e
dichiarata benign context: e pertinente ma non sufficiente da sola.

## Classificazione

```text
ATTEMPT_1:
  6/7 conclusions correct
  1 genuine semantic error
  positive coverage otherwise sufficient

ATTEMPT_2:
  same genuine semantic error persists
  + 1 new coverage regression

REPAIR V3:
  no semantic recovery
  regression introduced
```

Classificazione sintetica:

```text
FRESH_RECONSTRUCTION_REPAIR_FAILED_AND_REGRESSED
```

## Confronto con V2_004

V2_004 attempt-2 aveva mantenuto:

- lo stesso unico genuine semantic error;
- coverage sufficiente sugli altri check.

V3_001 attempt-2 mantiene lo stesso errore semantico e perde inoltre coverage
su un check precedentemente corretto.

Quindi, su questo caso noto, eliminare il replay del candidate precedente non
migliora il repair e produce un risultato peggiore.

Questo singolo confronto non dimostra una causa generale del failure del
modello, ma falsifica l'ipotesi operativa che il replay del candidate precedente
fosse il principale ostacolo al recupero di questo caso.

## Decisione

Non aprire automaticamente una v4 modificando ancora il prompt di repair.

Prima del prossimo protocollo occorre isolare il failure del singolo worker con
un test piu piccolo sul significato della regola problematica, distinguendo:

- comprensione della frase sorgente;
- valutazione della negazione/condizione;
- mapping della finding a supported true/false;
- selezione evidence.

L'obiettivo successivo non e ottenere un PASS per retry, ma identificare quale
di questi quattro passaggi fallisce.
