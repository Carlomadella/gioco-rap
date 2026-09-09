# FAME Neural — Fase 7C — Blocco 2 — Chiusura: metadata GMD + prima espansione controllata

Data: 10 settembre 2026
Base repository del blocco: `8038e10cb984014fbebb585a22ecd12cc05f05e0`
Stato finale: Block2 completato nel proprio scope tecnico; Fase 7C e `DRUM DATA READY V2` restano aperti.

> Questa chiusura riguarda esclusivamente il contratto di metadata enrichment GMD e la verifica che la pipeline funzioni oltre i 6 file del representation gate storico. Non chiude la 7D general-GMD, non certifica dominio Trap e non apre training serio.

## Domanda del blocco

Possiamo passare dal campione GMD da 6 file a un campione reale più ampio preservando in forma strutturata i metadata ufficiali necessari alle fasi successive, senza alterare il contratto Drum View V2 già verificato?

## Esito

**SUCCESSO TECNICO DEL BLOCCO 2: VERIFICATO SU DATI REALI.**

Verifica reale eseguita con `SourceCount=24`:

- MIDI reali importati: **24**;
- dataset item enriched: **24/24**;
- Drum View V2 enriched: **24/24**;
- source hits nella window 2-bar: **896**;
- view hits: **896**;
- source-hit accounting: **lossless**;
- raw fallback hit con `gmd-9-v1`: **0**;
- metadata coverage Drum View: **completa**;
- style primary: `hiphop=24`;
- beat type: `beat=24`;
- source split osservato: `train=18`, `validation=1`, `test=5`;
- gate operativo: `BLOCK2 CANDIDATE READY`.

Lo smoke test verifica inoltre in modo esplicito:

- `style` raw + primary/secondary;
- BPM;
- `beat_type`;
- time signature;
- source split;
- propagazione nella Drum View;
- `sourceSplitRole=source-reference-only`;
- nessuna promozione automatica di `beat_type` a semantica task-specifica `core/fill`.

## Confronto con le assunzioni di apertura

### Confermato

1. Il join deterministico `provenance.sourceId ↔ info.csv.id` funziona sul campione reale espanso.
2. I metadata ufficiali GMD possono essere preservati senza modificare il contratto Block1.
3. La pipeline non dipende accidentalmente dai soli 6 file usati nel representation gate.
4. Il metadata enrichment non rompe il source-hit accounting.
5. `sourceSplit` può essere conservato come informazione della fonte senza promuoverlo a split FAME definitivo.
6. `beat_type` può essere conservato come label di fonte senza inventare automaticamente ground truth `core/fill`.

### Non dimostrato e ancora aperto

- generalizzazione a stili GMD diversi da hip-hop;
- presenza/uso corretto dei `fill` nella Task View;
- quantità necessaria per pretraining generale;
- sampling per stile, drummer, session e beat/fill;
- split FAME leakage-safe definitivo;
- boundary/loopability;
- qualità musicale e utilità per il dominio Rap/Trap;
- sorgente Trap-specifica;
- `DRUM DATA READY V2`.

## Ricerca di chiusura

La documentazione ufficiale GMD riporta:

- **1.150 MIDI**;
- **22.214 misure**;
- **445.494 hit**;
- **503 beat**;
- **647 fill**;
- train/validation/test ufficiali;
- 10 drummer complessivi;
- metadata per genre/style, tempo, drummer, beat/fill e time signature.

Riferimento ufficiale:
https://magenta.tensorflow.org/datasets/groove

Paper:
Jon Gillick, Adam Roberts, Jesse Engel, Douglas Eck, David Bamman,
“Learning to Groove with Inverse Sequence Transformations”, ICML 2019.
https://proceedings.mlr.press/v97/gillick19a.html

Il campione Block2 da 24 file rappresenta circa il **2,1%** dei 1.150 MIDI GMD e, per design del selector storico riusato nel blocco, contiene soltanto `hiphop/beat/4-4`.

Conseguenza:

**24 file sono sufficienti a falsificare una dipendenza tecnica dal campione da 6 e a verificare l'enrichment, ma non costituiscono un test di scala/diversità GMD.**

La vera 7D deve quindi cambiare domanda: non “funziona con più di 6 file?”, ma “quale porzione e quale sampling del GMD sono appropriati per apprendere groove umano generale senza leakage e senza confondere le label di fonte con il dominio Trap?”.

## Gate Block2 fissato prima dei risultati

| Criterio | Risultato |
|---|---|
| smoke test metadata | PASS |
| `SourceCount > 6` | PASS — 24 |
| 100% item GMD con riga `info.csv` | PASS — 24/24 |
| 100% Drum View `source-enriched` | PASS — 24/24 |
| metadata strutturati validi | PASS |
| source-hit accounting lossless | PASS — 896/896 |
| nessuna promozione implicita Trap/split/core-fill | PASS |
| report distribuzioni reali | PASS |

**Gate Block2: PASS.**

## Cosa chiude

Il Blocco 2 chiude nel proprio scope:

- parser/normalizzazione metadata `info.csv`;
- metadata GMD strutturati e validati;
- join deterministico con dataset item;
- propagazione additiva nella Drum View V2;
- source split conservato come riferimento della fonte;
- prova reale oltre il campione da 6;
- report di coverage/distribuzione;
- regressione source-hit accounting sul campione espanso.

## Cosa NON chiude

Restano aperti:

- 7D general-GMD expansion;
- sampling/diversità su stili, drummer, session, beat/fill;
- split FAME leakage-safe definitivo;
- policy `core/fill` task-specifica;
- Trap taxonomy/specialization;
- HH-TRP symbolic availability/transcription;
- boundary/loopability 7G;
- human gate;
- `DRUM DATA READY V2`;
- training serio.

## Prossimo blocco

**7D — General GMD Expansion / inventory + sampling design.**

Prima di importare “tutto” alla cieca, il prossimo blocco deve:

1. inventariare l'intero `info.csv`;
2. misurare distribuzioni per style primary/secondary, beat/fill, drummer, session, BPM, time signature e source split;
3. definire l'unità di indipendenza/leakage prima dello split FAME;
4. confrontare almeno:
   - full admissible GMD;
   - sampling bilanciato/stratificato;
5. separare general human groove pretraining da hip-hop specialization;
6. fissare i criteri del gate prima di produrre il nuovo corpus.

Quindi: **7C Block2 chiuso nel suo scope tecnico; 7C, 7D e Fase 7 restano correnti.**
