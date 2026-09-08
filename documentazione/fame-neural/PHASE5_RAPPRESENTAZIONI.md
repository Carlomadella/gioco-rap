# FAME Neural — FASE 5 / Benchmark rappresentazioni neurali

Data avvio: 8 settembre 2026
Stato: COMPLETATA — FAME COMPOUND V1 SELEZIONATA

## Obiettivo

Scegliere la rappresentazione neurale di FAME Neural con misure comparabili sullo stesso corpus e sullo stesso contratto di input, non per preferenza architetturale.

Rappresentazioni previste dalla roadmap:

1. Flat token PoC;
2. REMI+;
3. Compound Word;
4. FAME Compound custom.

## Contratto benchmark comune V1

Il Blocco 1 introduce `fame-neural-representation-input-v1`: ogni adapter riceve insieme la sequence canonica `fame-neural-sequence-v1` e il sidecar FASE 4 `fame-neural-musical-annotation-v1`.

Il corpus sorgente resta quello Gate 1 da **504 phrase**. L'overlay umano FASE 4 esclude **2 phrase** senza cancellarle, quindi il benchmark usa **502 candidate**.

Regola importante: una rappresentazione può usare una feature FASE 4 solo se la codifica esplicitamente. Il benchmark non inventa equivalenze tra feature diverse.

## Blocco 1 — harness comune + Flat PoC V1

Implementato in:

- `frontend/strumenti/fame-neural-composer/representation/input.js`;
- `frontend/strumenti/fame-neural-composer/representation/benchmark.js`;
- `frontend/strumenti/fame-neural-composer/representation/flat-v1.js`;
- `frontend/strumenti/fame-neural-composer/phase5-block1-smoke-test.js`;
- `frontend/strumenti/fame-neural-composer/run-phase5-block1.js`.

### Risultato reale Flat

- input: **502**;
- phrase benchmarkate: **502**;
- failure adapter: **0**;
- vocabolario: **1019 token**;
- token/bar media: **116.125996**;
- token/bar P50: **112.75**;
- token/bar P95: **187.75**;
- token/phrase P95: **751**;
- max token/phrase: **1265**;
- grammar failures: **0**;
- vocabulary failures: **0**;
- canonical round-trip failures: **110**;
- structure exact rate: **1**;
- event type accuracy: **0.950895**;
- pitch accuracy: **0.995139**;
- timing MAE: **4.954279 tick**;
- duration MAE: **9.838563 tick**;
- velocity MAE [0,1]: **0.041204**;
- conditioning barra MAE [0,1]: **0.042016**.

Le eventuali incompatibilità Flat sono un risultato del benchmark e non vengono nascoste.

### Copertura delle annotazioni FASE 4 nel Flat corrente

Il Flat PoC può rappresentare direttamente:

- energy per barra: **10-bin-per-bar**;
- vocal space per barra: **10-bin-per-bar**;
- tension per barra: **10-bin-per-bar**.

Non rappresenta ancora come feature FASE 4 esplicite:

- density: **false**;
- motif families: **false**;
- kick↔808 relation: **false**;
- hat rolls: **false**;
- transition strength: **false**.

Questo gap entra nel confronto: non viene corretto aggiungendo token al Flat prima di aver misurato le alternative.

## Metriche non ancora misurate

VRAM peak durante training, throughput di training, validation loss comparabile e invalid generation rate richiedono lo stesso micro-modello e lo stesso protocollo di training per tutte le rappresentazioni. Il Blocco 1 le marca esplicitamente come **deferred** invece di stimarle.

## Blocco 2 — confronto simbolico completato

Tutte e quattro le rappresentazioni sono state misurate sullo stesso corpus effettivo da **502 candidate** e sullo stesso harness. Nessun adapter ha prodotto failure, grammar failure o vocabulary failure.

| Rappresentazione | unit/bar mean | P95 | round-trip fail | event type | pitch | timing MAE | FASE4 coverage | FASE4 numeric MAE |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| flat-poc-v1 | 116.125996 | 187.75 | 110 | 0.950895 | 0.995139 | 4.954279 | 3/8 | 0.021358 |
| remi-plus-v1 | 101.281375 | 164.975 | 0 | 0.950895 | 0.995139 | 4.954279 | 0/8 | 0 |
| compound-word-v1 | 20.191235 | 35.975 | 0 | 0.950895 | 0.995139 | 4.954279 | 4/8 | 0.022622 |
| fame-compound-v1 | 20.229084 | 35.975 | 0 | 0.950895 | 0.995139 | 4.954279 | 8/8 | 0.046852 |

Nota: `round-trip fail` misura l'idempotenza seriale `encode -> decode -> encode`; non equivale automaticamente a phrase strutturalmente perse. La structure exact rate e le metriche di reconstruction restano separate.

Il confronto resta **senza vincitore**: memoria GPU, throughput training, validation loss e invalid generation rate richiedono lo stesso micro-modello e lo stesso protocollo di training.

## Blocco 3 — micro-training comparabile completato

Protocollo reale: stesso split per composition family, stesso Transformer backbone, stesso seed, stesso batch in phrase e stesso budget di **120 step** per rappresentazione. Split: **401 train / 58 validation / 43 test phrase**. GPU: **NVIDIA GeForce RTX 5070 Ti**, PyTorch **2.12.0+cu130**, CUDA runtime **13.0**, AMP **bfloat16**.

| Rappresentazione | parametri | peak VRAM MiB | bars/s | val bits/bar | invalid gen |
|---|---:|---:|---:|---:|---:|
| flat-poc-v1 | 2192947 | 691.518 | 1063.191 | 267.438852 | 6/12 (0.5) |
| remi-plus-v1 | 2179087 | 707.267 | 1438.365 | 241.336572 | 11/12 (0.916667) |
| compound-word-v1 | 2197952 | 137.539 | 557.856 | 191.268692 | 12/12 (1) |
| fame-compound-v1 | 2249927 | 144.136 | 359.363 | 205.256405 | 12/12 (1) |

La validation loss viene riportata anche come **bits/bar**, perché le rappresentazioni compound predicono più campi per singolo timestep e la sola loss per token/field non è direttamente confrontabile con Flat/REMI. L'invalid generation rate usa lo stesso task: completamento dell'ultima barra partendo da un prefisso canonico valido.

Il Blocco 3 non sceglie automaticamente il vincitore: i numeri GPU/generativi devono essere letti insieme a compressione simbolica, reconstruction e copertura FASE 4 del Blocco 2.

## Blocco 4 — decisione finale

**Winner: `fame-compound-v1`.**

L'audit successivo al micro-training ha mostrato che tutti i 41 output classificati invalidi nel Blocco 3 fallivano per stato/grammatica del sampling unconstrained. La metrica invalid-generation del Blocco 3 viene quindi mantenuta come diagnostica del decoder, non come misura comparativa della qualità delle rappresentazioni.

La scelta FAME Compound è sostenuta da:
- **20.229084 unit/bar**;
- P95 **35.975**;
- **0 round-trip failure**;
- **8/8** feature FASE 4;
- **144.136 MiB** peak GPU;
- validation NLL/target **1.137909**;
- validation **205.256405 bits/bar**, interpretata considerando il maggior numero di campi informativi predetti.

Compound Word resta la baseline compound generica di controllo. Flat e REMI+ restano benchmark storici.

Il generatore neurale successivo deve usare decoding grammar/state constrained, in coerenza con NDR-010.

**FASE 5 CHIUSA.**
