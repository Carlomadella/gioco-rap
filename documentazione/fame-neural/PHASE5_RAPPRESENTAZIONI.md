# FAME Neural — FASE 5 / Benchmark rappresentazioni neurali

Data avvio: 8 settembre 2026
Stato: IN CORSO — BLOCCO 2 CONFRONTO SIMBOLICO COMPLETATO

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

## Prossimo Blocco 3

Eseguire micro-training comparabile per Flat, REMI+, Compound Word e FAME Compound custom usando stesso split, stesso micro-modello per quanto compatibile, stesso budget di step e stessa GPU locale. Misurare VRAM peak, throughput, validation loss e invalid generation rate prima della scelta finale della rappresentazione.

Nessun vincitore è ancora scelto.
