# FAME Neural Composer — PoC0

Data: 2026-09-07
Status: BASELINE STORICA DEL LINGUAGGIO SIMBOLICO

## Scopo originario

Dimostrare che una composizione Trap multitraccia da 8 barre può essere rappresentata in modo simbolico e testabile prima di introdurre training ML.

Le fixture sono sintetiche e NON costituiscono un corpus musicale reale.

## Evoluzione dopo FASE 1

Il PoC iniziale è stato consolidato in Symbolic Language V1 con:

- encode/decode;
- token/id round-trip;
- tonality separata da harmony;
- chord progression segmentata;
- glide 808 formalizzato;
- eventi simultanei canonici;
- grammatica token constrained;
- supporto duration triplet;
- test di boundary e cross-bar duration.

## Cosa resta fuori

- dataset reale;
- importer MIDI reale;
- dedup;
- annotatori musicali;
- tokenizer benchmark;
- modello neurale.
