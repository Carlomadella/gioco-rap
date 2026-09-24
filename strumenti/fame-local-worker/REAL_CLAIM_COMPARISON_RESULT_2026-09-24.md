# Real Claim Comparison 001 — risultato reale

Data: 2026-09-24.

Run operator-reported:

```text
$HOME\FAME_REAL_CLAIM_COMPARISON_001
```

## Esito

```text
status = COMPLETE_FOR_REVIEW
calls = 11
baselineAccepted = 6/6
stagedAccepted = 3/6
baselineAllPass = true
stagedAllPass = false
comparison = STAGED_WORSE
sameSemantics = true
sameRubric = true
executionAuthorized = false
independentEvaluation = false
humanReviewRequired = true
```

Tempi modello:

```text
baselineModelSeconds = 10.281
stagedModelSeconds = 37.437
```

## Baseline

La baseline ternaria batch ha accettato tutte le sei claim:

```text
R01 PASS
R02 PASS
R03 PASS
R04 PASS
R05 PASS
R06 PASS
```

Verdetti:

- R01 SUPPORTED / U12;
- R02 SUPPORTED / U22;
- R03 CONTRADICTED / U23;
- R04 CONTRADICTED / U29;
- R05 UNKNOWN / [];
- R06 UNKNOWN / [].

## Staged selector + judge

Tre claim accettate:

```text
R02 PASS
R03 PASS
R06 PASS
```

Tre failure:

### R01

```text
stagedError = Incomplete response
```

Il failure avviene prima della materializzazione di `suggestedEvidenceIds`,
quindi la pipeline si e interrotta nella chiamata selector e il judge non e
stato eseguito.

### R04

```text
stagedError = Incomplete response
```

Anche qui il failure avviene prima di `suggestedEvidenceIds`: selector
incompleto, judge non eseguito.

### R05

Target:

```text
UNKNOWN
```

Risposta staged:

```text
CONTRADICTED
evidenceIds = [U12]
```

U12 parla del timeout operativo di cinque minuti in caso di tool-layer failure,
ma non stabilisce che il comando `grade` debba o non debba terminare entro
sessanta secondi. Quindi la claim resta UNKNOWN e la risposta staged e un errore
semantico/inferenziale.

## Interpretazione

Il confronto e simmetrico per semantica ternaria, rubrica host, scoring e fonte
completa.

Su questo documento reale:

```text
batch direct worker = 6/6
selector + judge    = 3/6
```

La decomposizione staged aumenta inoltre il tempo modello e introduce due punti
di failure operativi aggiuntivi.

Classificazione:

```text
STAGED_WORSE
```

La linea selector+judge non va scalata come percorso primario.

Il benchmark non e independent evaluation e non autorizza training, audio,
produzione o autonomia operativa.
