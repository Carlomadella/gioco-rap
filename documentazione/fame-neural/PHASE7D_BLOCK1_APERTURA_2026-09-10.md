# FAME Neural — Fase 7D — Blocco 1 — Apertura: inventory GMD + split/sampling audit

Data: 10 settembre 2026
Base repository verificata: `7a49b31a32369caeb69bdf8a8f7c934d9c593bd1`
Stato iniziale: 7C Block2 chiuso nel suo scope tecnico; 7D aperta; `DRUM DATA READY V2` aperto; training serio chiuso.

## Domanda del blocco

Prima di espandere materialmente il corpus GMD, quali sono la scala, la diversità e la struttura reale dell'intero `info.csv`, e quali grouping devono essere rispettati per evitare di trasformare lo split ufficiale GMD in uno split FAME non sufficientemente indipendente?

Il Blocco 1 della 7D è quindi **inventory e decision support**, non intake massivo.

## Stato verificato nella repository

Il percorso corrente dispone già di:

- `gmd-metadata.js`, che parse/normalizza/valida `info.csv`;
- metadata strutturati GMD nel Block2;
- Drum View V2 additiva e source-aware;
- un bootstrap Block2 deliberatamente limitato a `hiphop/beat/4-4`;
- `sourceSplitRole=source-reference-only`.

Il Block2 ha verificato 24 MIDI reali, ma non scala/diversità del GMD generale.

## Evidenza esterna di apertura

La documentazione ufficiale Groove MIDI Dataset v1.0.0 dichiara:

- 1.150 MIDI;
- 13,6 ore;
- oltre 22.000 misure;
- 445.494 drum hit;
- 10 drummer;
- 18 primary style;
- 503 `beat`;
- 647 `fill`;
- split record-level: 897 train, 124 validation, 129 test;
- metadata per drummer, session, id, style, BPM, beat type, time signature e split.

La documentazione specifica inoltre che quattro drummer hanno registrato lo stesso set di dieci groove nella `eval_session`, incluso nel test set.

Fonti:

- https://magenta.tensorflow.org/datasets/groove
- https://github.com/tensorflow/datasets/blob/master/docs/catalog/groove.md
- Jon Gillick et al., “Learning to Groove with Inverse Sequence Transformations”, ICML 2019.

## Conseguenza architetturale

Lo split GMD resta utile come riferimento della fonte e per confronti con benchmark GMD, ma **non viene promosso automaticamente a split FAME**.

Motivo: per FAME dobbiamo misurare esplicitamente se entità correlate — almeno drummer, session e pattern di valutazione condivisi — attraversano gli split. La presenza di una stessa entità in più split non viene chiamata automaticamente “leakage” prima di fissare l'unità indipendente del task; viene registrata come `cross-split group` e usata per progettare lo split FAME.

## Scope Block1

Implementare un audit riproducibile dell'intero `info.csv` che produca:

1. validità e unicità dei 1.150 record;
2. distribuzioni:
   - primary/secondary style;
   - beat/fill;
   - time signature;
   - source split;
   - drummer;
   - session;
3. BPM e durata:
   - min/max/mean/median;
   - P10/P25/P75/P90;
4. matrici:
   - split × beat type;
   - style × beat type;
   - style × split;
5. candidate view **descrittive**, non autorizzazioni:
   - all valid;
   - beat;
   - fill;
   - 4/4;
   - non-4/4;
   - hiphop;
   - hiphop + beat + 4/4;
6. cross-split audit per:
   - drummer;
   - session;
   - eval template condiviso;
7. confronto con i conteggi ufficiali di riferimento.

## Cosa NON fa

Il blocco non:

- importa tutti i MIDI;
- crea ancora uno split FAME;
- sceglie un numero finale di esempi;
- bilancia o sottocampiona il dataset;
- converte `beat_type` in `semantics.core/fill`;
- interpreta `hiphop` come Trap;
- chiude 7D;
- dichiara `DRUM DATA READY V2`;
- apre training.

## Gate fissato prima del risultato reale

Il Block1 può essere chiuso nel suo scope soltanto se:

1. smoke test inventory passa;
2. `info.csv` viene letto tramite il parser GMD già esistente;
3. 1.150 record risultano validi e unici;
4. conteggi ufficiali di riferimento coincidono:
   - beat 503;
   - fill 647;
   - train 897;
   - validation 124;
   - test 129;
   - 10 drummer;
   - 18 primary style;
5. il report contiene tutte le distribuzioni e matrici richieste;
6. il cross-split audit non viene confuso con una decisione già presa sul leakage;
7. nessun candidate view viene promosso automaticamente a corpus di training;
8. il report viene salvato come artefatto JSON riproducibile.

Se i conteggi ufficiali non coincidono, il blocco si ferma: prima si chiarisce versione/fonte/parse error.

## Decisione rinviata al Block2 7D

Solo dopo il report reale del Block1 verranno fissati:

- unità indipendente FAME;
- policy di group split;
- full pool vs sampling stratificato;
- rapporto beat/fill per ciascun task;
- trattamento 4/4 vs meter non standard;
- general groove pretraining vs eventuale hip-hop specialization;
- dimensione del primo corpus materializzato.

**Nessuna soglia di sampling viene inventata prima dell'inventory reale.**
