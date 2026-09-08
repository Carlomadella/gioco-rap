# FAME Neural — FASE 5 / Benchmark rappresentazioni neurali

Data avvio: 8 settembre 2026
Stato: IN CORSO — BLOCCO 1 BASELINE FLAT MISURATA

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

## Prossimo Blocco 2

Implementare REMI+, Compound Word e FAME Compound custom come adapter dello stesso contratto e misurare sullo stesso set da 502 candidate le metriche simboliche già definite.

Solo dopo la parità del benchmark simbolico si apre il micro-training comparabile sulla GPU locale per memoria, velocità e validità generativa.

Nessun vincitore è ancora scelto.
