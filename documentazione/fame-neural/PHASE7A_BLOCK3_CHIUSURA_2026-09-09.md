# FAME Neural — Fase 7A — Blocco 3 — Chiusura operativa e ricerca di chiusura

Data: 9 settembre 2026
Base repository: `84cbb9e5108d61b658262364876c897a9005656b`

> Questa chiusura riguarda il Blocco 3. Non chiude l'intera Fase 7A, non dichiara DRUM DATA READY V2 e non apre training serio.

## Esito

**SUCCESSO TECNICO DEL BLOCCO 3: VERIFICATO.**

Il problema aperto dopo il Blocco 2 era duplice:

1. esisteva un selector strict-by-default, ma non un contratto completo di ammissibilità task-specifica;
2. i percorsi storici potevano processare le 502 candidate senza una decisione Phase 7 esplicita.

La soluzione implementata mantiene separato il corpus generico e introduce:

- `task-admissibility.js`;
- `task-admissibility-policy.v1.json`;
- `export-task-admissible-corpus.js`;
- `phase7a-block3-smoke-test.js`.

Il nuovo export Phase 7 è fail-closed: soltanto decisioni `allowed` entrano nel manifest.

## Verifica reale

| Task | allowed | blocked | unknown | taskReady | trainingReady |
|---|---:|---:|---:|---|---|
| `debug-smoke-v1` | 47 | 0 | 455 | true | N/A |
| `drum-groove-pretraining-v1` | 0 | 333 | 169 | false | false |
| `drum-musical-target-v1` | 0 | 380 | 122 | false | false |

Sono state rieseguite anche:

- regressione Blocco 2: OK;
- policy registry validation: OK;
- allowed path: OK;
- candidate → unknown / fail-closed: OK;
- unknown capability → unknown / fail-closed: OK;
- observed content blocker: OK;
- quality blocker: OK;
- rights blocker: OK;
- usage blocker: OK;
- source restriction blocker/unknown: OK;
- only allowed enters selector: OK;
- task readiness vs training readiness: OK;
- deterministic decision: OK.

## Negative result conservato

```text
ASSUNZIONE INIZIALE
un booleano trainingReady può rappresentare anche un task debug

→ TEST
export reale debug-smoke-v1

→ RISULTATO
47 record allowed producevano trainingReady=true

→ PERCHÉ ERA ERRATA
debug-smoke-v1 non è un training task;
"esistono record ammissibili" e "dataset pronto al training" sono concetti diversi

→ NUOVA REGOLA
separare taskReady da trainingReady;
per task non-training, trainingReady = N/A
```

## Ricerca di chiusura

### Separazione decisione/enforcement

Il modello Phase 7 è coerente con una separazione classica tra decisione di policy ed enforcement: la specifica OASIS XACML distingue decisioni `Permit`, `Deny`, `Indeterminate` e prevede algoritmi deny-unless-permit per casi in cui soltanto un permesso esplicito deve aprire il percorso.

Riferimento:
https://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-cos01-en.html

FAME non implementa XACML: il parallelismo serve soltanto a verificare che separare "decisione" e "punto che applica la decisione" sia un pattern maturo e che lo stato indeterminato non debba essere interpretato come permesso.

### Provenance come parte della decisione

W3C PROV descrive provenance come informazione su entità, attività e agenti utile a valutare qualità, affidabilità e trust. Questo è coerente con il mantenimento di source record, source collection, composition family e evidenceRefs distinti nel gate.

Riferimento:
https://www.w3.org/TR/prov-overview/

### Evidenza euristica non è ground truth

Snorkel tratta funzioni euristiche come fonti con accuratezza/correlazioni non note, non come verità automaticamente certa. Questo sostiene la scelta FAME di non trasformare `candidate` o evidenza incompleta in `allowed`.

Riferimento:
https://arxiv.org/abs/1711.10160

## Cosa chiude

Il Blocco 3 chiude nel nuovo percorso Phase 7:

- ammissibilità task-specifica;
- enforcement selezione/export;
- comportamento allowed/blocked/unknown;
- fail-closed di candidate/unknown;
- reason code/evidence refs;
- distinzione taskReady/trainingReady.

## Cosa NON chiude

Resta aperto:

- fedeltà sorgente e derivazione Drum View secondo NDR-036;
- preservazione identità drum/timing/PPQ necessaria alla Task View;
- Drum Dataset V2;
- GMD expansion;
- Trap-specific source;
- boundary/loopability;
- quality-aware selection;
- human musical gate;
- training readiness.

Quindi: **Blocco 3 chiuso; Fase 7A ancora aperta per la fedeltà sorgente/Drum View.**
