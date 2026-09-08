# FAME Neural — Current State

Data: 2026-09-08

## Stato roadmap

- FASE 0 — Fondazione e separazione: **COMPLETATA**.
- FASE 1 — Linguaggio dei dati: **COMPLETATA**.
- FASE 2 — Pipeline MIDI e provenienza: **COMPLETATA**.
- FASE 3 — Dataset Auditor e corpus iniziale: **COMPLETATA — GATE 1 DATA READY SUPERATO**.
- FASE 4 — Annotazione musicale automatica: **COMPLETATA**.
- FASE 5 — Scelta della rappresentazione neurale: **COMPLETATA — FAME COMPOUND V1 SELEZIONATA**.
- FASE 6 — Baseline semplice: **COMPLETATA — RETRIEVAL + CONSTRAINED BASELINE CONGELATE**.
- Training neurale reale: **MICRO-TRAINING BENCHMARK FASE 5 COMPLETATO; TRAINING MODELLO PRODOTTO NON INIZIATO**.

## Corpus Gate 1

- corpus verificato: **504 phrase**;
- composition family: **285**;
- source collection: **6**;
- coverage drums / 808 / harmony / lead: **170 / 101 / 394 / 76**;
- synthetic share: **45.04%** (advisory 40%, non blocker Gate 1);
- human-review exclusion overlay: **2 phrase**;
- candidati effettivi alla preparazione FASE 5 quando l'overlay viene applicato: **502 phrase**.

Il corpus sorgente da 504 phrase resta immutato: le due esclusioni umane sono un overlay reversibile e machine-readable, non cancellazioni distruttive.

## Annotazioni FASE 4

Annotatore congelato per il passaggio alla FASE 5:

- schema `fame-neural-musical-annotation-v1`;
- metodo `fame-neural-auto-annotator-v1`;
- 504/504 annotazioni prodotte, 0 fallite;
- 0 violazioni invarianti nel QA finale;
- 75 phrase con relazione kick↔808 realmente disponibile;
- output deterministico; manifest annotazioni `c3917d3c628e1cf7fc178d3161a2dcbd7348b5d35e4aa08c2ad3a229a1890692`.

Review umana Blocco 2B:

- 22/22 phrase valutate;
- 19 completamente coerenti;
- 2 escluse per qualità musicale della phrase;
- 1 singola sovrastima di `tension` su `free-midi-chords`;
- nessun errore metrico ripetuto;
- agreement sulle 20 phrase musicalmente usabili: **95%**;
- nessuna calibrazione globale applicata.

Le annotazioni restano feature euristiche con confidence, non ground truth musicale.

## Linguaggio simbolico corrente

Directory:

`frontend/strumenti/fame-neural-composer/`

Baseline rilevante:

- schema `fame-neural-sequence-v1`;
- 960 PPQ canonici;
- `tonality` separata dalla progressione armonica;
- event stream multitraccia;
- 808 glide;
- ordine canonico eventi simultanei;
- encoder/decoder + token ↔ id lossless;
- grammatica constrained;
- duration straight/triplet;
- conditioning discretizzato.

## FASE 5 — Blocco 1

Harness comune e baseline Flat misurati sul corpus effettivo da **502 candidate**: **502 benchmarkate**, **0 failure**, media **116.125996 token/bar**, P95 **187.75**, max **1265 token/phrase**. Grammar/vocabulary/canonical-round-trip failures: **0/0/110**.

Le metriche GPU/training non sono stimate dal benchmark simbolico e restano deferred fino al confronto con micro-modello identico.

## FASE 5 — Blocco 2

Confronto simbolico completato sulle **502 candidate**:

- flat-poc-v1: **116.125996 unit/bar**, P95 **187.75**, RT **110**, FASE4 **3/8**;
- remi-plus-v1: **101.281375 unit/bar**, P95 **164.975**, RT **0**, FASE4 **0/8**;
- compound-word-v1: **20.191235 unit/bar**, P95 **35.975**, RT **0**, FASE4 **4/8**;
- fame-compound-v1: **20.229084 unit/bar**, P95 **35.975**, RT **0**, FASE4 **8/8**;

Tutti e quattro gli adapter: **502/502 benchmarkate**, **0 failure**, **0 grammar failure**, **0 vocabulary failure**. Il round-trip e' idempotenza seriale, non un conteggio di phrase strutturalmente perse. Nessun vincitore e' ancora scelto.

## FASE 5 — Blocco 3

Micro-training GPU comparabile completato con **120 step per rappresentazione** sullo stesso split per composition family e sullo stesso backbone:

- flat-poc-v1: **691.518 MiB peak**, **1063.191 bars/s**, **267.438852 bits/bar val**, invalid **6/12**;
- remi-plus-v1: **707.267 MiB peak**, **1438.365 bars/s**, **241.336572 bits/bar val**, invalid **11/12**;
- compound-word-v1: **137.539 MiB peak**, **557.856 bars/s**, **191.268692 bits/bar val**, invalid **12/12**;
- fame-compound-v1: **144.136 MiB peak**, **359.363 bars/s**, **205.256405 bits/bar val**, invalid **12/12**;

I risultati completi machine-readable sono in `documentazione/fame-neural/PHASE5_BLOCK3_RESULTS.json`.

## FASE 5 — Blocco 4

Decisione finale completata: **`fame-compound-v1`** è la rappresentazione neurale scelta.

L'audit degli errori generativi del Blocco 3 ha verificato che i **41/41 sample invalidi** fallivano per errori di grammatica/stato del decoder unconstrained, non per token o valori fuori vocabolario. Questa metrica non viene quindi usata per classificare le rappresentazioni.

Il contratto futuro resta quello già definito da NDR-010: generazione con grammar/state constraints.

FAME Compound viene preferita perché mantiene la compattezza delle compound word, ha 0 round-trip failure e rappresenta **8/8** feature FASE 4. Compound Word rimane baseline tecnica secondaria.

## FASE 6 — Blocco 1

Retrieval baseline V1 misurata sul test set leakage-safe da **43 phrase**.

- valid: **43/43**;
- composition-family / phrase leakage: **0 / 0**;
- plan MAE mean / P95: **0.031008 / 0.047619**;
- template unici: **39/43**, max reuse **2**;
- 18 warning `DENSITY_VS_VOCAL_SPACE` su 5 sample.

Risultati: `documentazione/fame-neural/PHASE6_BLOCK1_RESULTS.json`.

Protocollo: `documentazione/fame-neural/PHASE6_BASELINE.md`.

## FASE 6 — Blocco 2

Constrained generative baseline V1 misurata sul test set leakage-safe.

- valid: **43/43**;
- donor leakage: **0**;
- plan MAE: **0 / 0** per costruzione;
- exact train phrase: **0**;
- exact train bar: **0/172**;
- unique generation: **43/43**;
- donor groups: **225**, media **45.9302** per generazione;
- warning: **21** su 10 sample (`DENSITY_VS_VOCAL_SPACE` 14, `ABRUPT_808_GRAMMAR_SHIFT` 7).

FASE 6 congelata con due baseline complementari.

Risultati: `documentazione/fame-neural/PHASE6_BLOCK2_RESULTS.json`.

## Prossimo intervento ufficiale

FASE 7 — Neural Planner V0: costruire il primo modello che genera un piano strutturale di 8 barre prima della performance musicale.

L'espansione non sintetica del corpus può continuare in parallelo, ma non riapre il Gate 1 già superato.
