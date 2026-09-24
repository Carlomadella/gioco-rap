# Claim Network 001 — risultato reale

Data: 2026-09-24.

Run operator-reported:

```text
$HOME\FAME_CLAIM_NETWORK_001
```

Programma:

```text
claim_network.py
```

## Esito

```text
status = COMPLETE_FOR_REVIEW
calls = 13
baselineAccepted = 6
stagedAccepted = 6
total = 6
stagedAllPass = true
comparison = NO_GAIN
executionAuthorized = false
independentEvaluation = false
humanReviewRequired = true
```

Tutti i sei casi sintetici sono stati accettati sia dalla baseline batch sia
dalla pipeline selector + judge.

Distribuzione attesa dei casi:

- 2 SUPPORTED;
- 2 CONTRADICTED;
- 2 UNKNOWN.

Il run reale conferma che, su queste fixture development, GPT-OSS 20B gestisce
correttamente condizioni, negazioni, contraddizioni e assenza di informazione.

## Interpretazione

Il risultato non supporta l'ipotesi di una incapacita generale del modello su
negazioni o condizioni elementari.

La decomposizione staged non ha pero migliorato il risultato:

```text
batch:  6/6 con 1 chiamata
staged: 6/6 con 12 chiamate
comparison = NO_GAIN
```

Il confronto non isola causalmente la decomposizione, perche la baseline usa
semantica booleana mentre il judge staged usa semantica ternaria e richiede
citazioni anche per CONTRADICTED. Il programma stesso registra questo limite.

Quindi il checkpoint successivo deve usare:

- un documento reale della repository;
- claim congelate prima del run;
- stessa semantica ternaria nelle due modalita;
- stessa rubrica e stesso scoring;
- una modalita batch;
- una modalita selector + judge;
- documento completo visibile al judge, cosi il selector non puo nascondere una
  controprova.

Nessun esito autorizza training, audio, produzione o autonomia operativa.
