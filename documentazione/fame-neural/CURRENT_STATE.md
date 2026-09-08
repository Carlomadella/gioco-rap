# FAME Neural — Current State

Data: 2026-09-08

## Stato roadmap

- FASE 0 — Fondazione e separazione: **COMPLETATA**.
- FASE 1 — Linguaggio dei dati: **COMPLETATA**.
- FASE 2 — Pipeline MIDI e provenienza: **COMPLETATA**.
- FASE 3 — Dataset Auditor e corpus iniziale: **COMPLETATA — GATE 1 DATA READY SUPERATO**.
- FASE 4 — Annotazione musicale automatica: **COMPLETATA**.
- FASE 5 — Scelta della rappresentazione neurale: **IN CORSO — BLOCCO 2 CONFRONTO SIMBOLICO COMPLETATO**.
- Training neurale reale: **NON INIZIATO**.

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

## Prossimo intervento ufficiale

FASE 5 / Blocco 3: micro-training comparabile sulle quattro rappresentazioni con stesso split e budget per misurare VRAM peak, throughput, validation loss e invalid generation rate prima della decisione finale.

L'espansione non sintetica del corpus può continuare in parallelo, ma non riapre il Gate 1 già superato.
