# FAME Neural — Current State

Data: 2026-09-09

## Audit V2 integrato — stato delle correzioni

[Rapporto completo](AUDIT_ROADMAP_V2_2026-09-09.md), codice verificato al commit `1372467`. Sono integrate le precisazioni documentali e le regole NDR-028…034; **nessuna correzione di codice, nuovo intake o nuovo training è implicata da questo aggiornamento**.

| Riscontro | Stato corrente | Condizione per considerarlo risolto |
|---|---|---|
| Codec micro-training derivati da `records["all"]` | APERTO NEL CODICE; esposizione di validation/test nel preprocessing, non training dimostrato sui loro target | Specifica fissa oppure fit sul solo train e verifica del protocollo |
| “Vincitore neurale” della Fase 5 | INTERPRETAZIONE CORRETTA | FAME Compound resta formato comune; confronto generativo equo ancora da eseguire quando necessario |
| Generazione senza grammatica/stato vincolati nel micro-benchmark | APERTO; fallimento storico conservato | Decoder previsto verificato; validità e musicalità misurate separatamente |
| Identità delle note drum persa nel canonico | APERTO | Dati sorgente conservati e conversioni verificabili; nessuna ricostruzione arbitraria di `perc` |
| Richiesta di finestre 2-bar sostituita con 4-bar dal builder V1 | LIMITE DEL CONTRATTO V1 | Supporto task-specifico verificato prima di dichiarare disponibile 2-bar |
| Soglie e campionamento dei nuovi gate musicali | DA SPECIFICARE PER BLOCCO | Criteri definiti prima dei risultati e test finale separato dallo sviluppo |
| Topologia dei Performer/Refiner | IPOTESI DI IMPLEMENTAZIONE | Confronto con alternativa joint/condizionale più semplice prima di congelare i moduli |
| Indicazione Planner obsoleta nel documento Fase 6 | CORRETTA DOCUMENTALMENTE | Sequenza V1 marcata come superata |
| Boundary 4-bar loop vs 8-bar contiguous | APERTO; chiusura non recuperata | Manifest e feedback recuperati, oppure nuovo diagnostico con propria identità |

I numeri delle Fasi 0–6 sotto restano **storico documentato**, non risultati rieseguiti durante l'audit. I casi già usati per prendere decisioni rimangono utili per sviluppo/regressioni; non vengono presentati come test finale nuovamente indipendente.

## Stato roadmap

Roadmap ufficiale: **V2 — ricalibrata dopo i primi gate musicali**.

- FASE 0 — Fondazione e separazione: **COMPLETATA**.
- FASE 1 — Linguaggio dei dati: **COMPLETATA PER V1; HARDENING TASK-SPECIFIC APERTO**.
- FASE 2 — Pipeline MIDI e provenienza: **COMPLETATA**.
- FASE 3 — Dataset Auditor e corpus iniziale: **COMPLETATA STORICAMENTE; GATE 1 REINTERPRETATO COME PIPELINE / DATA ENGINEERING READY**.
- FASE 4 — Annotazione musicale automatica: **COMPLETATA; ANNOTATORE V1 = AUXILIARY FEATURES, NON GROUND TRUTH**.
- FASE 5 — Scelta della rappresentazione neurale: **COMPLETATA; FAME COMPOUND V1 = COMMON REPRESENTATION**.
- FASE 6 — Baseline semplice: **COMPLETATA; RETRIEVAL + CONSTRAINED BASELINE CONGELATE, CON POST-HOC MUSICAL INTERPRETATION**.
- FASE 7 — Task Data Reset + Drum Dataset V2: **CORRENTE**.
- Neural Planner V0: **RINVIATO; NON È PIÙ IL PROSSIMO TRAINING**.
- Training modello prodotto: **NON INIZIATO**.

## Regola metodologica nuova

Da questa revisione ogni blocco significativo richiede:

1. ricerca approfondita di apertura prima dell'implementazione;
2. ricerca approfondita di chiusura prima di dichiarare il blocco completo;
3. aggiornamento di roadmap/current state/decision log quando cambia una conclusione;
4. registrazione dei negative result e delle ipotesi falsificate.

Dettaglio operativo: `ROADMAP_FAME_NEURAL.md`, sezione Protocollo obbligatorio di ricerca.

---

## Gate storici — interpretazione corretta

### Gate 1

Storicamente superato sul corpus da 504 phrase.

Da V2 significa:

**PIPELINE / DATA ENGINEERING READY**

Certifica:

- importer;
- provenance;
- rights;
- dedup;
- split;
- leakage;
- technical integrity.

NON certifica:

- Trap readiness;
- full-arrangement readiness;
- Planner readiness;
- Performer readiness;
- musicality.

### Gate 2

FAME Compound V1 resta selezionata come common representation.

Non viene più interpretata come task representation universale.

---

## Corpus storico Gate 1

- corpus verificato: **504 phrase**;
- composition family: **285**;
- source collection: **6**;
- coverage drums / 808 / harmony / lead: **170 / 101 / 394 / 76**;
- pitchedAny: **447**;
- synthetic share: **45.04%**;
- PDMX share: **43.25%**;
- human-review exclusion overlay: **2 phrase**;
- candidate effettive successive: **502**.

Il corpus sorgente resta immutato. Le esclusioni umane restano overlay reversibili.

---

## Role audit post-hoc sulle 502 candidate

Distribuzione:

- `TONAL_ONLY`: **307**;
- `DRUMS_ONLY`: **57**;
- `FULL_LAYERED`: **53**;
- `DRUMS_TONAL`: **38**;
- `LOWEND_TONAL`: **22**;
- `DRUMS_LOWEND`: **21**;
- `LOWEND_ONLY`: **4**.

Per source:

### `fame-original-seed-v1`
- 47 phrase;
- 47/47 `FULL_LAYERED`.

### `free-midi-chords`
- 2 phrase;
- 2/2 `TONAL_ONLY`.

### `gmd-v1.0.0`
- 57 phrase;
- 57/57 `DRUMS_ONLY`;
- ruolo corrente: human groove / performance, non full beat.

### `hiphopdrummer`
- 49 phrase;
- 28 `DRUMS_TONAL`;
- 21 `DRUMS_LOWEND`;
- synthetic/rule-generated role material.

### `pdmx-v2025`
- 218 phrase;
- 176 `TONAL_ONLY`;
- 22 `LOWEND_TONAL`;
- 10 `DRUMS_TONAL`;
- 6 `FULL_LAYERED`;
- 4 `LOWEND_ONLY`.

### `waivops-nrg-cp`
- 129 phrase;
- 129/129 `TONAL_ONLY`.

Conclusione:

il corpus non è un insieme omogeneo di beat; da V2 ogni source/record deve essere usato per capacità compatibili.

---

## Full-layer blind quality gate

Review:

- 10 sample deterministici da 47 `fame-original-seed-v1` full-layer;
- tutti i 6 PDMX full-layer;
- sorgente nascosta durante l'ascolto.

Risultato umano:

### `fame-original-seed-v1`
- 10/10 giudicati come materiale messo a caso;
- non promosso come full-arrangement training target.

Policy corrente:

`DEBUG_SYNTHETIC_ONLY`

Uso consentito:

- debug;
- grammar;
- determinism;
- encode/decode;
- smoke.

### PDMX full-layer
- 6/6 riconosciuti come musica coerente;
- 2/6 giudicati rappabili;
- 4/6 coerenti ma non rappabili.

Conclusione:

PDMX ha segnale musicale utile, ma il pool corrente è troppo piccolo e non abbastanza target-specifico.

---

## Annotazioni FASE 4

Annotatore V1 storico:

- schema `fame-neural-musical-annotation-v1`;
- 504/504 annotazioni;
- 0 failure;
- 0 violation invariants;
- 75 phrase con kick↔808 disponibile;
- deterministico;
- human review 22/22;
- 19 completamente coerenti;
- 2 exclusion;
- 1 sovrastima tension;
- 95% agreement sulle 20 phrase usabili.

Interpretazione V2:

le annotazioni restano feature euristiche con confidence.

Non sono prova della qualità musicale del corpus e non diventano automaticamente target ground-truth del Planner.

---

## FAME Compound V1

Risultato FASE 5 resta valido:

- compact;
- 0 RT failure nel benchmark selezionato;
- 8/8 FASE4 feature coverage;
- common grammar/state contract;
- grammar masking resta richiesto in generazione.

Nuova interpretazione:

`fame-compound-v1` = common representation.

Sono ammesse Task View specializzate.

Primo target: `Drum View V2`.

---

## Canonical vs FAME listening diagnostic

A/B su casi problematici con stesso renderer:

- canonical source sequence;
- FAME Compound decoded sequence.

Verdetto umano:

le versioni sono state percepite come fondamentalmente uguali.

Conclusione:

la quantizzazione FAME Compound NON è supportata come causa principale del caos musicale osservato.

Resta possibile migliorare la representation per task specifici, soprattutto groove/microtiming, ma non si attribuisce a FAME Compound un problema già presente nel materiale sorgente.

---

## FASE 6 — Baseline tecniche

### Retrieval V1

- split **401/58/43**;
- valid **43/43**;
- leakage **0**;
- plan MAE mean/P95 **0.031008 / 0.047619**;
- template unici **39/43**;
- max reuse **2**;
- warning density/vocal-space: 18 su 5 sample.

### Constrained V1

- valid **43/43**;
- donor leakage **0**;
- plan MAE **0/0 per costruzione**;
- exact train phrase **0**;
- exact train bar **0/172**;
- unique **43/43**;
- donor groups **225**;
- mean donor groups/generation **45.9302**;
- warning **21** su 10 sample.

### Post-hoc human gate

Blind A/B/C su 5 casi:

- Retrieval preferito: **3**;
- Coupled Block V2: **1**;
- Constrained: **0**;
- nessuno: **1**.

Conclusione:

Retrieval resta controllo musicale più forte.

Constrained e Coupled non sono promossi come strada musicale principale.

---

## Planner profiler V0 — contratto valido, training non ready

Profilo costruito sulle 502 candidate:

- native phrase length: **502 × 4 bar**;
- adjacent 4+4 candidates: **124**;
- non-overlap selected: **92**;
- final 8-bar sample: **92**;
- split: **71 / 13 / 8**;
- unique groups: **68**;
- header mismatch: **0**;
- leakage: **0**;
- planner bars: **736**;
- direct measured field coverage: **736/736**.

Conclusione:

pipeline/contract tecnicamente validi.

**71 train sample non vengono considerati sufficienti per un serio Planner generalizzabile da zero.**

Planner training sospeso.

---

## Drum Groove Contract / Retrieval Control V1

Corpus:

- source records: **502**;
- eligible grooves: **116**;
- unique groups: **60**;
- GMD: **57**;
- Hip Hop Drummer: **49**;
- PDMX: **10**;
- split: **99 / 6 / 11**;
- group leakage: **0**;
- bars with kick: **447/464**;
- bars with backbeat: **452/464**;
- drum hits mean/P95: **91.328 / 141**;
- joint simultaneous frames: **2921/6545**.

Retrieval control:

- valid: **11/11**;
- donor leakage: **0**;
- distance mean/P95: **0.031031 / 0.049612**;
- same-lineage rate: **1.0**, non interpretabile come vera style match quando lineage è generico/default;
- unique templates: **10/11**;
- max reuse: **2**.

Blind listening target vs retrieval:

- retrieval preferito: **4**;
- original target preferito: **3**;
- entrambi: **2**;
- nessuno: **2**.

Conclusione:

il retrieval di groove intero preserva molto meglio la coerenza rispetto alla recombination indipendente.

Il corpus resta però musicalmente misto e non è ancora promosso a `DRUM DATA READY`.

---

## `perc` collapse ablation

Blind `FULL` vs stesso groove senza `perc`.

Verdetti:

- `UGUALI`: **4**;
- `NESSUNO`: **4**;
- preferenza chiara `NO_PERC`: **1**;
- preferenza chiara `FULL`: **1**;
- altri commenti qualitativi misti.

Conclusione:

rimuovere `perc` NON è un fix generale.

Problema residuo reale:

nel contratto corrente diverse classi GM possono collassare in `perc`, quindi la Drum View V2 deve preservare meglio instrument identity quando disponibile.

---

## Boundary / loopability diagnostic

Test 4-bar loop vs 8-bar contiguous: **IN CORSO / DIAGNOSTICO**.

Non è consentito concludere automaticamente:

- “4 barre sono sbagliate”;
- “8 barre sono sempre giuste”.

La V2 considera boundary e loopability proprietà task-specifiche.

---

## Source interpretation corrente

### GMD
Uso: **GENERAL HUMAN GROOVE / PERFORMANCE PRETRAINING**.

Non viene interpretato come ground truth Trap sufficiente.

### Hip Hop Drummer
Uso: **synthetic/rule-generated role augmentation**.

Pinned generator commit storico:

`4cbf33aef786338b5a991e716fb82879fe47a6c7`

Non viene usato per gonfiare training readiness.

### WaivOps NRG-CP
Uso: **tonal/pitched material**.

### PDMX
Uso: **general symbolic / harmony / arrangement candidate**.

Prossimo hardening:

quality-aware + role-aware selection.

### HH-TRP
Stato: **CANDIDATE DA AUDITARE**.

Motivo:

dataset Trap/Drill potenzialmente utile per drum specialization, ma di natura algorithmic/synthetic; intake vietato finché non supera rights/diversity/human quality gate.

---

## Problemi aperti prioritari

- scala insufficiente per training serio da zero sui task correnti;
- drum corpus non abbastanza Trap-specific;
- full-arrangement corpus troppo piccolo;
- `fame-original-seed-v1` non valido come musical target;
- PDMX non ancora quality-aware;
- drum class identity da preservare meglio;
- microtiming/offset da valutare nella Drum View V2;
- boundary/loopability da definire;
- fill/core distinction da introdurre;
- Planner targets troppo euristici e dataset troppo piccolo;
- cross-track conditioning non ancora implementato.

---

## Prossimo intervento ufficiale

**FASE 7 — TASK DATA RESET + DRUM DATASET V2**

Ordine:

1. usare l'audit integrato e completare la ricerca specifica del blocco prima del codice: assunzioni, alternative, benchmark e gate;
2. definire `contentCapabilities`, usi consentiti ed evidenza dei label (7A/7B);
3. definire la conservazione dei dati sorgente per Drum View / Drum Dataset V2, senza inventare informazione persa;
4. recuperare il boundary diagnostic aperto oppure eseguirne uno nuovo identificabile nell'ambito 7G, prima di congelare boundary/loopability;
5. espandere GMD per general human groove;
6. audit HH-TRP;
7. rendere PDMX quality-aware/role-aware;
8. blind quality gate;
9. ricerca di chiusura FASE 7;
10. solo dopo decidere se aprire Drum Core training.

Il **Neural Planner V0 resta rinviato**.

Nessun training serio viene aperto per compensare un problema di dati.
