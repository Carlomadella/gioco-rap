# FAME Neural — Fase 7D — Blocco 1 — Chiusura: inventory GMD + split/sampling audit

Data: 10 settembre 2026
Base repository del blocco: `7a49b31a32369caeb69bdf8a8f7c934d9c593bd1`
Stato finale: Block1 completato nel proprio scope; Fase 7D, `DRUM DATA READY V2` e training serio restano aperti.

## Domanda del blocco

Prima di espandere materialmente il corpus GMD, quali sono scala, diversità, distribuzioni e struttura reale dell'intero `info.csv`, e quali grouping devono essere considerati prima di definire lo split FAME?

## Esito

**BLOCK1 7D: PASS SU INVENTORY REALE COMPLETO.**

Report reale:

- 1.150/1.150 record validi;
- 0 record invalidi;
- 0 recordId duplicati;
- 10 drummer;
- 18 primary style;
- 503 beat;
- 647 fill;
- source split: 897 train / 124 validation / 129 test;
- time signature: 1.138 in 4/4, 5 in 3/4, 5 in 6/8, 1 in 5/4, 1 in 5/8;
- hiphop: 95 record;
- hiphop + beat + 4/4: 34 record;
- cross-split drummer groups: 9;
- cross-split session groups: 17;
- eval-session: 10 template condivisi, 40 record, tutti nel source test;
- reference checks ufficiali: PASS;
- `readyForSamplingDesign=true`.

Top primary style osservati:

- rock 341;
- funk 160;
- jazz 101;
- latin 97;
- hiphop 95.

## Verifica rispetto ai conteggi ufficiali

La matrice split × beat type coincide con i conteggi pubblicati dal GMD:

| Source split | Beat | Fill |
|---|---:|---:|
| train | 378 | 519 |
| validation | 48 | 76 |
| test | 77 | 52 |
| totale | 503 | 647 |

La documentazione ufficiale riporta inoltre 1.150 MIDI, 22.214 misure, 445.494 hit e 815 minuti complessivi. Quattro drummer hanno registrato lo stesso set di 10 groove nella `eval_session`; l'inventory reale conferma 10 template / 40 record, tutti nel test.

Riferimenti:

- https://magenta.tensorflow.org/datasets/groove
- https://www.tensorflow.org/datasets/catalog/groove
- Jon Gillick et al., “Learning to Groove with Inverse Sequence Transformations”, ICML 2019.

## Risultato architetturale

Il Block1 conferma che il `sourceSplit` GMD deve restare **source-reference-only** per FAME.

Questo non significa che lo split ufficiale sia errato: è il protocollo di riferimento del dataset ed è utile per comparabilità. Significa che, per il nostro task, non possiamo usarlo come unica prova di indipendenza perché:

- 9 drummer su 10 compaiono in più source split;
- 17 session compaiono in più source split;
- la stessa identità di performer può quindi attraversare train/validation/test;
- i 40 record `eval_session` hanno un ruolo benchmark specifico e non devono essere dispersi casualmente nel corpus FAME.

Una presenza cross-split viene registrata come **diagnostico**, non chiamata automaticamente leakage finché non viene fissata l'unità indipendente del task.

## Risultato sul sampling

L'inventory falsifica due scorciatoie:

1. **“Usiamo semplicemente tutto GMD come un unico pool.”**
   Non è appropriato: i fill sono 647, più dei 503 beat, e hanno ruolo/durata diversi.

2. **“Usiamo solo hip-hop perché FAME è rap/trap.”**
   Non è appropriato per il pretraining generale: GMD ha 18 primary style e il ruolo della 7D è `GENERAL_HUMAN_GROOVE_PRETRAIN`. Inoltre hiphop GMD non equivale a Trap.

Decisione per il prossimo blocco:

- preservare tutto il GMD come fonte disponibile;
- trattare `beat` e `fill` come pool di fonte distinti;
- non promuovere `beat_type` a ground truth `core/fill`;
- mantenere i 12 record non-4/4, ma non forzarli nella baseline 4/4 del primo Drum Core;
- preservare l'`eval_session` come benchmark holdout candidato;
- confrontare almeno due strategie di indipendenza:
  - session-grouped;
  - drummer-held-out;
- non sottocampionare per bilanciare gli style prima di misurare il costo in informazione; eventuale weighting/sampling va deciso dopo il confronto.

## Gate Block1

| Criterio | Esito |
|---|---|
| smoke inventory | PASS |
| parser GMD esistente riusato | PASS |
| 1.150 record validi/unici | PASS |
| beat/fill ufficiali | PASS — 503/647 |
| split ufficiali | PASS — 897/124/129 |
| 10 drummer | PASS |
| 18 primary style | PASS |
| distribuzioni/matrici prodotte | PASS |
| cross-split audit diagnostico | PASS |
| candidate view non promosse a training | PASS |
| report JSON riproducibile | PASS |

**Gate 7D Block1: PASS.**

## Cosa chiude

Il blocco chiude:

- inventory completo GMD v1.0.0;
- reference-check dei metadata;
- distribuzioni reali;
- misura della forte prevalenza dei fill a livello record;
- misura degli overlap cross-split per drummer/session;
- identificazione esplicita dell'`eval_session`;
- base quantitativa per progettare sampling e split FAME.

## Cosa NON chiude

Restano aperti:

- scelta dello split FAME;
- scelta definitiva dell'unità indipendente;
- materializzazione del corpus GMD esteso;
- selezione/weighting per style;
- task policy per beat/fill;
- boundary/loopability;
- specialization Trap;
- human gate;
- `DRUM DATA READY V2`;
- training serio.

## Prossimo blocco

**7D Block2 — Grouping + Candidate Manifest Design.**

Il Block2 deve produrre, senza training:

1. pool `general-beat-4/4` completo e tracciabile;
2. pool `fill-4/4` separato;
3. holdout esplicito `eval_session`;
4. proposta session-grouped con zero session cross-split;
5. proposta drummer-held-out con zero drummer cross-split;
6. metriche di distribuzione e perdita di coverage per entrambe;
7. decisione documentata su quale split usare per il primo corpus materializzato.

La scelta viene fatta sui numeri, non fissata a priori.
