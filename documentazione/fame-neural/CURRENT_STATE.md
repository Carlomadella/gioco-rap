# FAME Neural — Current State

Data: 2026-09-08

## Stato roadmap

- FASE 0 — Fondazione e separazione: **COMPLETATA**.
- FASE 1 — Linguaggio dei dati: **COMPLETATA**.
- FASE 2 — Pipeline MIDI e provenienza: **COMPLETATA**.
- FASE 3 — Dataset Auditor e corpus iniziale: **COMPLETATA — GATE 1 DATA READY SUPERATO**.
- FASE 4 — Annotazione musicale automatica: **COMPLETATA**.
- FASE 5 — Scelta della rappresentazione neurale: **DA FARE**.
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

## Prossimo intervento ufficiale

FASE 5: confrontare Flat token PoC, REMI+, Compound Word e FAME Compound custom con benchmark di token/barra, contesto, memoria, velocità, reconstruction accuracy, invalid generation rate e capacità di rappresentare correttamente il dominio Trap.

L'espansione non sintetica del corpus può continuare in parallelo, ma non riapre il Gate 1 già superato.
