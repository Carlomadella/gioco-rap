# Direct QA — V2_003 recovery + rubric audit result

Data: 2026-09-24.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_V2_003`.

## Esito queue

1. `recovery-protocol-v2`
   - `status=VALIDATED_FOR_REVIEW`;
   - `modelCalls=1`;
   - `firstAttemptPass=true`;
   - `acceptedAfterRepair=false`.

2. `rubric-audit-protocol-v2`
   - `status=REJECTED`;
   - `modelCalls=2`;
   - `firstAttemptPass=false`;
   - `acceptedAfterRepair=false`.

Queue:

- `status=NEEDS_REVIEW`;
- `executionAuthorized=false`.

La root e consumata e non deve essere rilanciata.

## Recovery protocol — review umana

La review incollata dall'operatore conferma:

- 5/5 conclusioni corrette;
- tutti i check positivi con coverage `SUFFICIENT`;
- nessuna evidence non revisionata;
- un solo `precisionWarning` benigno: U01 su `FIRST_PASS_IMMUTABLE`;
- entrambi i check negativi correttamente non supportati.

La desk resta quindi un first-pass reale valido.

## Rubric audit — attempt 1

Attempt-1 ha prodotto:

- 4/5 conclusioni corrette;
- un vero errore semantico:
  `AUDIT_PROMOTES_OPERATIONAL_NETWORK` marcato erroneamente `supported=true`;
- `DIRECT_CONTEXTUAL_STRENGTH` conclusione corretta ma rifiutata per
  `INSUFFICIENT_EVIDENCE`.

Feedback del repair:

```text
SOME_CONCLUSION_INCORRECT
SOME_EVIDENCE_COVERAGE_INSUFFICIENT
oracleTargetsSent=false
checkIdsSentInFeedback=false
```

## Rubric audit — attempt 2

Attempt-2 ha corretto il vero errore semantico:

- 5/5 conclusioni corrette;
- `AUDIT_PROMOTES_OPERATIONAL_NETWORK=false`;
- nessuna evidence non revisionata;
- unico errore residuo:
  `DIRECT_CONTEXTUAL_STRENGTH:INSUFFICIENT_EVIDENCE`.

Il modello ha citato U01.

## Audit della rubrica congelata

La finding era:

```text
Nel caso auditato E155 e prova diretta mentre E152+E153+E154 costituiscono
supporto contestuale; l'audit mantiene distinta la forza della prova.
```

U01 contiene gia integralmente:

- E152, E153, E154 come supporto contestuale;
- E155 come prova diretta;
- la frase che il supporto contestuale viene accettato mantenendo distinta la
  forza della prova.

La rubrica congelata richiedeva invece due gruppi separati:

```text
[U01]
[U03]
```

U03 ripete la distinzione DIRECT/CONTEXTUAL nel sidecar, ma non aggiunge una
componente semantica necessaria all'asserzione che non sia gia coperta da U01.

Quindi il requisito U03 era ridondante rispetto alla finding.

## Classificazione

Lo stato storico del run resta:

```text
REJECTED
```

perche il package era congelato e non viene modificato retroattivamente.

La classificazione diagnostica e:

```text
ATTEMPT_1:
  genuine semantic error + package coverage false negative

ATTEMPT_2:
  5/5 semantic conclusions correct
  package coverage false negative only

REPAIR:
  semantic recovery successful
  final host acceptance blocked by rubric authoring defect
```

Questo significa che V2_003 fornisce la prima evidenza reale in cui il repair
generico corregge un errore semantico vero, ma il successo non puo essere
registrato come `VALIDATED_FOR_REVIEW_AFTER_REPAIR` a causa della rubrica
congelata troppo restrittiva.

## Regola per task futuri

Ogni `requiredGroup` deve corrispondere a una componente semantica realmente
necessaria e distinta della finding.

Se una singola unit completa gia tutte le componenti della finding, una seconda
unit che ripete o rafforza gli stessi fatti non deve diventare un gruppo
obbligatorio separato. Puo essere:

- alternativa sufficiente;
- benign context;
- oppure non necessaria.

Non correggere il task consumato `rubric-audit-protocol-v2` e non rilanciarlo.
