# FAME Neural — Fase 7C — Blocco 1 — Chiusura operativa e ricerca di chiusura

Data: 9 settembre 2026
Base repository: `cbb482785137754b2116274ba28b9af14ca42e08`

> Questa chiusura riguarda il primo contratto tecnico della Drum View V2. Non chiude l'intera 7C, non dichiara `DRUM DATA READY V2`, non promuove GMD a ground truth Trap e non apre training serio.

## Esito

**SUCCESSO TECNICO DEL BLOCCO 1: VERIFICATO.**

Il Block1 introduce:

- `dataset/drum-mapping-profiles.v1.json`;
- `dataset/drum-view-v2.js`;
- `export-drum-view-v2.js`;
- smoke test;
- real GMD test;
- export E2E test.

La Task View deriva direttamente dalla source fidelity introdotta nel Blocco 4.

## Risultati reali

Campione deterministico GMD hiphop/beat/4-4:

- MIDI reali: **6**;
- Drum View prodotte: **6**;
- source hits: **2382**;
- view hits: **2382**;
- MIDI note uniche: **15**;
- GMD-9 fallback hit: **0**;
- lane/frame con multi-hit preservato: **65**;
- boundary-clipped projections: **8**;
- source-hit accounting: **lossless**.

Export E2E su window 2-bar:

- dataset item: **6**;
- file Drum View V2: **6**;
- source/view hits nella window: **221/221**;
- raw fallback hit: **0**;
- multi-hit lane/frame preservati: **5**.

## Confronto con l'opening audit

L'opening audit aveva misurato:

- 2382 drum hit;
- 15 MIDI note uniche;
- 0 hit GMD fuori dal mapping 9-voci candidato;
- 71 extra hit in collisione same-voice sulla 16th;
- 20 sulla 32nd;
- 645 frame 16th multi-voice;
- P95 microtiming assoluto = 0.458333 step 16th / 51.7856625 ms;
- 0 metadata strutturati style/beat/split/bpm/time-signature nel provenance;
- boundary/loopability e fill/core non disponibili come ground truth.

Il Block1 risponde direttamente al failure mode più importante: **non elimina le collisioni**. La vista usa array di `sourceEventId` per lane/frame e mantiene ogni hit separato.

## Ricerca di chiusura

### GrooVAE / ICML 2019

Gillick et al. descrivono ogni hit MIDI con instrument, time e velocity e definiscono microtiming + velocity come caratteristiche della performance. Per gli esperimenti mappano il kit a 9 categorie, usano pattern da 2 barre e una griglia 16th.

Riferimento:
https://proceedings.mlr.press/v97/gillick19a.html

La scelta importante per FAME è il limite dichiarato nello stesso paper: quando più hit della stessa categoria cadono sullo stesso timestep 16th, GrooVAE conserva il più forte e riconosce che questo elimina dettagli dei roll rapidi.

Il nostro campione mostra concretamente che questo failure mode non è teorico: esistono collisioni reali. Per questo FAME conserva gli eventi distinti nel dataset e rinvia eventuale compressione al benchmark del modello.

### Scala GMD

La pagina ufficiale GMD riporta 1.150 MIDI, oltre 22.000 misure e 445.494 hit complessivi, con split train/validation/test e label beat/fill.

Riferimento:
https://magenta.tensorflow.org/datasets/groove

Conseguenza: i 6 file usati qui sono adeguati come **real-data representation gate**, non come prova di scala, diversità o training readiness. Questo rafforza la necessità della 7D GMD expansion.

### Groove come timing + dynamics

La documentazione GrooVAE visualizza e ricostruisce groove come combinazione di pattern, velocity e microtiming rispetto alla griglia 16th.

Riferimento:
https://magenta.tensorflow.org/groovae

Questo sostiene la nostra scelta di non usare il canonical rounded tick come unica fonte del timing nella Drum View.

## Boundary: risultato positivo ma problema ancora aperto

Il test reale registra **8** proiezioni in cui il nearest 16th cade oltre il range nominale della window e il frame operativo viene clippato al bordo.

Non è perdita della sorgente:

- `sourceStartTick` resta;
- `rawNearestStepIndex` resta;
- `offsetTicks`, `offsetStepFraction` e `offsetMs` restano;
- `clippedToWindowBoundary` è esplicito.

Ma non viene dichiarato che il clamp sia musicalmente corretto. La 7G deve confrontare almeno policy di clamp, boundary frame/wrap quando pertinente e comportamento sui loop reali.

## Cosa chiude

Il Blocco 1 chiude nel proprio scope:

- schema/prototipo Drum View V2;
- joint-frame representation;
- raw source linkage;
- velocity;
- microtiming;
- mapping registry versionato;
- adapter GMD-9;
- preservazione multi-hit;
- export CLI/report;
- regressione source fidelity;
- test sintetici e real GMD.

## Cosa NON chiude

Restano aperti:

- metadata enrichment GMD;
- dataset expansion 7D;
- Trap taxonomy/specialization 7E;
- HH-TRP symbolic availability o transcription;
- fill/core evidence;
- boundary/loopability 7G;
- split definitivo leakage-safe del Drum Dataset V2;
- task-admissible musical corpus;
- human gate;
- training readiness.

Quindi: **7C Blocco 1 chiuso; 7C e Fase 7 restano correnti.**
