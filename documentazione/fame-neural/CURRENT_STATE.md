# FAME Neural — Current State

Data: 2026-09-11

## Owned Beats — stato operativo

> Checkpoint corrente Block E: [V2 config-001 — metric gate — 11/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_V2_CONFIG001_METRIC_GATE_2026-09-11.md).
> Diagnostica complementare: [Easy sanity set e localization audit — 11/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_EASY_SANITY_CHECKPOINT_2026-09-11.md).

**Stato aggiornato: 11/09/2026. Conversione audio→MIDI non ancora avviata (`converted: 0`).**

| Attività | Stato | Evidenza / prossimo vincolo |
|---|---|---|
| Bootstrap / inventory corpus proprietario | **COMPLETATO** | 133 file sorgente → 131 asset unici; manifest e copie verificate |
| Verifica export nativi | **COMPLETATO** | 131/131 `NONE_AVAILABLE`; si procede dall'audio |
| Selezione cohort pilot | **COMPLETATO** | 8 beat registrati in `owned-beats-pilot-v1` |
| Composition family corpus proprietario | **COMPLETATO** | 131/131 record confermati umanamente come composizioni distinte; 131 `compositionFamilyId` unici, 0 record senza family |
| Diversità musicale pilot | **DA COMPLETARE** | audit formale del pilot ancora da fare; sanity set separato di 3 boom bap volutamente semplici supporta l'ipotesi che il development congelato sia comparativamente più difficile, ma non sostituisce una verifica sistematica di difficoltà/diversità |
| Evaluation holdout | **COMPLETATO** | 10 composition family congelate in `evaluation-holdout` prima del tuning V2; 8 development, overlap 0, 113 record ancora senza split |
| Human Reference development | **COMPLETATA / VERSIONATA** | `precision-v3` finalizzata: 8/8 family, 24/24 finestre `COMPLETE` + reviewed, digest `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`; `precision-v2`/`precision-v1` preservate come storico; holdout non osservato |
| Ambiente tecnico Audio Analysis | **COMPLETATO** | FFmpeg/ffprobe 9.0.1 + Python 3.14 + stack audio verificata |
| Audio Analysis pilot | **IN CORSO — CONFIG-001 SUPERA IL GATE METRICO** | `audio-analysis-v2-config-001` (1/8) congelata al commit `43530f44`; Beat F1 paired delta `0.0`, Section F1 `0 → 0.171429`, paired median delta `+0.071429`; sanity set separato: V1 resta a median Section F1 @0,5 `0`, config-001 `0.222222` dopo refinement waveform e `0.777778` @3 s, con failure reale di localizzazione circa 1–2 beat in `Street Candy`; decisione ufficiale invariata `INCONCLUSIVE_REVIEW_PENDING`; prossimo step: human correction-cost review su almeno 6 family comparabili; `config-002` e holdout chiusi |
| Source Separation pilot | **DA FARE** | successiva all'Audio Analysis |
| Trascrizione Audio→MIDI pilot | **DA FARE** | drums/low-end prima; tonal successivamente |
| QA pilot | **DA FARE** | metriche automatiche e giudizio umano separati |
| Espansione batch corpus | **BLOCCATA** | subordinata ai risultati/gate del pilot |
| Training serio | **CHIUSO** | nessun training autorizzato da questo avanzamento |

Le 131 composition family del corpus proprietario sono state confermate umanamente e registrate. Il cohort di sviluppo contiene 8 family e l'evaluation holdout 10 family distinte, senza overlap. I 113 record rimanenti non hanno ancora uno split assegnato. `familyStatus`, QA e task admissibility restano separati e non vengono auto-promossi.

## Audit V2 integrato — stato delle correzioni

[Rapporto completo](AUDIT_ROADMAP_V2_2026-09-09.md), codice verificato al commit `1372467`. Sono integrate le precisazioni documentali e le regole NDR-028…034; **nessuna correzione di codice, nuovo intake o nuovo training è implicata da questo aggiornamento**.

| Riscontro | Stato corrente | Condizione per considerarlo risolto |
|---|---|---|
| Codec micro-training derivati da `records["all"]` | APERTO NEL CODICE; esposizione di validation/test nel preprocessing, non training dimostrato sui loro target | Specifica fissa oppure fit sul solo train e verifica del protocollo |
| “Vincitore neurale” della Fase 5 | INTERPRETAZIONE CORRETTA | FAME Compound resta formato comune; confronto generativo equo ancora da eseguire quando necessario |
| Generazione senza grammatica/stato vincolati nel micro-benchmark | APERTO; fallimento storico conservato | Decoder previsto verificato; validità e musicalità misurate separatamente |
| Identità delle note drum persa nel canonico | RISOLTA NEL NUOVO PERCORSO SOURCE FIDELITY; il canonico V1 resta lossy per design | `sourceFidelity` versionato + re-import sorgente per Task View che richiedono nota/timing originali |
| Richiesta di finestre 2-bar sostituita con 4-bar dal builder V1 | LIMITE DEL CONTRATTO V1 | Supporto task-specifico verificato prima di dichiarare disponibile 2-bar |
| Soglie e campionamento dei nuovi gate musicali | DA SPECIFICARE PER BLOCCO | Criteri definiti prima dei risultati e test finale separato dallo sviluppo |
| Topologia dei Performer/Refiner | IPOTESI DI IMPLEMENTAZIONE | Confronto con alternativa joint/condizionale più semplice prima di congelare i moduli |
| Indicazione Planner obsoleta nel documento Fase 6 | CORRETTA DOCUMENTALMENTE | Sequenza V1 marcata come superata |
| Boundary 4-bar loop vs 8-bar contiguous | APERTO; chiusura non recuperata | Manifest e feedback recuperati, oppure nuovo diagnostico con propria identità |

I numeri delle Fasi 0–6 sotto restano **storico documentato**, non risultati rieseguiti durante l'audit. I casi già usati per prendere decisioni rimangono utili per sviluppo/regressioni; non vengono presentati come test finale nuovamente indipendente.

## Aggiornamento dopo il confronto handoff / Sonic Pi

Base implementativa verificata: `02bc708e1f1f8797b9cb5aef8dc24fd45a92393e`. [Rapporto di revisione](REVISIONE_HANDOFF_SONIC_PI_2026-09-09.md). NDR-035…040 adottano le correzioni di protocollo; questa integrazione è documentale.

- **7A / blocco 1 IMPLEMENTATO:** modulo `content-capabilities`, policy iniziale e smoke test; test originale rieseguito con esito positivo nell'audit.
- **Ammissibilità semantica APERTA:** il normalizzatore controlla schema/riferimenti, non adeguatezza delle prove musicali. La prova mirata dell'audit accetta una promozione FULL_ARRANGEMENT sostenuta soltanto dalla presenza di un kick; il builder normale non la produce automaticamente.
- **Applicazione nella pipeline APERTA:** i percorsi controllati di phrase building, gate dati ed export microtrain non applicano ancora il contratto. La policy è opzionale nel builder; `unknown` non autorizza il training. Nessuna esclusione globale già implementata viene dedotta dalla sola policy.
- **Chiusura di 7A non dichiarata:** manca una chiusura operativa completa con selezione/export verificati. Il test del contratto non chiude la fase dati.
- **Fedeltà Drum View APERTA:** sorgente preservata, conversioni e collegamenti da verificare; nessuna derivazione obbligatoria attraverso informazione già persa.
- **Corpus allineato 8-bar APERTO:** verificare parti drums/808/armonia abbinate prima di impegnare l'intera catena dei modelli.
- **Input di controllo DA SPECIFICARE:** distinguere forniti, estratti e generati; Planner neurale rinviato, contratto dei controlli anticipato.
- **Sonic Pi RESEARCH CANDIDATE:** nessun intake, tracer FAME, nuovo modello o gate musicale chiuso. L'audit verifica codice ufficiale e fonti; non esegue Sonic Pi né certifica i diritti di ogni asset. La richiesta a Sam Aaron è riportata dall'handoff, non prova di permesso ricevuto.
- **Architettura IPOTESI:** confronto Core+Arranger vs modello unico; Refiner separato opzionale, coerenza richiesta già nelle interazioni iniziali.

I rapporti di ricerca restano fotografie al commit dichiarato. Questa sezione è lo stato corrente; non riscrive i vecchi risultati e non attribuisce alla documentazione correzioni di codice ancora aperte.

## Aggiornamento operativo — FASE 7A/7B Blocco 2

**Stato del Blocco 2: COMPLETATO NEL SUO SCOPE. FASE 7A: ANCORA APERTA.**

Verifica reale sul corpus dopo le 2 esclusioni umane:

- 502 phrase candidate;
- 301 provenance source ID granulari;
- 6 source collection;
- 284 composition family;
- 0 errori / 0 warning overlay;
- 0 unresolved source ID;
- 0 source ID mancanti;
- 0 composition family mancanti;
- 0 canonical observation mancanti;
- 0 capability musicali auto-promosse;
- 0 violazioni `DEBUG_SYNTHETIC_ONLY`;
- 47 seed `debug=allowed`;
- 57 GMD `pretraining=candidate`;
- 49 Hip Hop Drummer `augmentation=candidate`;
- 0 `musicalTarget=allowed`;
- `READY FOR EVIDENCE ENRICHMENT = SI`.

Il Blocco 2 chiude il collegamento **contratto → corpus reale → overlay/consumer → audit**.

Fotografia storica, superata dalla chiusura 7A riportata sotto: erano aperti, coerentemente con NDR-035:

1. ammissibilità task-specifica;
2. enforcement nel percorso reale selezione/export;
3. test end-to-end consentito/bloccato/unknown;
4. fedeltà sorgente per Drum View secondo NDR-036.

Correzione emersa dal test reale: `provenance.sourceId` è identità granulare del record/composizione, mentre Source Registry e policy possono operare a livello collection. Dopo la correzione: **301 source ID → 6 collection → 0 unresolved**.

Digest corpus: `fec26d6184548454b94abd452032b29dab8417e47d0058595646282aee7e7f79`.

Dettaglio: [PHASE7A_BLOCK2_CHIUSURA_2026-09-09.md](PHASE7A_BLOCK2_CHIUSURA_2026-09-09.md).

## Aggiornamento operativo — FASE 7A Blocco 3

**Stato del Blocco 3: COMPLETATO NEL SUO SCOPE. FASE 7A: ANCORA APERTA.**

Il nuovo percorso Phase 7 introduce un gate di ammissibilità task-specifico separato dal phrase builder generico e dai gate storici. La decisione per phrase è `allowed | blocked | unknown`, con reason code ed evidenceRef tracciabili.

Verifica end-to-end sulle 502 candidate reali:

- `debug-smoke-v1`: 47 allowed / 0 blocked / 455 unknown; `taskReady=true`; `trainingReady=N/A`;
- `drum-groove-pretraining-v1`: 0 allowed / 333 blocked / 169 unknown; `taskReady=false`; `trainingReady=false`;
- `drum-musical-target-v1`: 0 allowed / 380 blocked / 122 unknown; `taskReady=false`; `trainingReady=false`.

Lo smoke verifica anche che `candidate` e capability/qualità mancanti restino fail-closed e che soltanto decisioni `allowed` entrino nel manifest task-specifico. La regressione del Blocco 2 resta verde.

Questo aggiornamento **supera lo stato precedente che indicava ammissibilità ed enforcement selezione/export come aperti**: tali punti sono chiusi nel nuovo percorso Phase 7. I vecchi exporter Fase 5 e il Gate storico restano storici/generalisti e non diventano implicitamente percorsi autorizzati per nuovi training.

Resta aperto per completare 7A il punto di fedeltà sorgente/derivazione della Drum View secondo NDR-036: preservazione dell'identità drum, timing/PPQ e collegamento tracciabile tra sorgente e Task View.

Dettaglio e ricerca di chiusura: [PHASE7A_BLOCK3_CHIUSURA_2026-09-09.md](PHASE7A_BLOCK3_CHIUSURA_2026-09-09.md).

## Aggiornamento operativo — FASE 7A Blocco 4

**Stato del Blocco 4: COMPLETATO NEL SUO SCOPE. FASE 7A: COMPLETATA NEL SUO SCOPE.**

Il percorso MIDI Phase 7 preserva ora la fedeltà sorgente drum **prima** della normalizzazione lossy, senza modificare `fame-neural-sequence-v1`. Il dataset item espone un `sourceFidelity` versionato con identità evento stabile, MIDI note originale, source tick/duration, velocity, source PPQ, mapping/versione e proiezione canonica. Il phrase builder propaga una slice tracciabile della stessa informazione nella phrase derivata.

Verifica reale su Groove MIDI Dataset:

- 6/6 MIDI reali hiphop/4-4 importati;
- 2382 raw drum events preservati;
- 2382 canonical drum events prodotti senza introdurre raw note nel canonico V1;
- 35/35 phrase derivate con source fidelity completa;
- regressione Fase 2 Blocco 2: OK;
- regressione Blocco 3: OK;
- smoke source fidelity: OK;
- test reale GMD: OK.

La Fase 7A è quindi chiusa nel suo perimetro: capability/evidence, risoluzione source collection, task admissibility/enforcement e source fidelity/derivazione Drum View dispongono ora di contratti e test verificati.

Questo **non** rende il dataset drum Training Ready e non apre training serio. Restano nelle attività 7C–7G: costruzione Drum View V2, espansione GMD, sorgente Trap-specifica, qualità/domain evidence, boundary/loopability e gate umano.

Limite conservato: le 502 phrase storiche già materializzate restano artefatti storici privi della nuova source fidelity; non vengono “riparate” ricostruendo note da `perc`. I nuovi dataset/task view che richiedono questa informazione devono derivare da sorgenti reimportabili o da payload che la preservano esplicitamente.

Dettaglio e ricerca di chiusura: [PHASE7A_BLOCK4_CHIUSURA_2026-09-09.md](PHASE7A_BLOCK4_CHIUSURA_2026-09-09.md).

## Aggiornamento operativo — FASE 7C Blocco 1

**Stato del Blocco 1: COMPLETATO NEL SUO SCOPE TECNICO. FASE 7C: ANCORA APERTA.**

È disponibile il primo contratto `fame-neural-drum-view-v2`, derivato direttamente da `sourceFidelity` senza passare dalla perdita strumentale/timing del canonico V1.

Proprietà verificate:

- joint frame su griglia 16th come baseline di rappresentazione;
- raw MIDI note e `sourceEventId` preservati per ogni hit;
- velocity preservata;
- microtiming derivato dal source tick/PPQ e conservato come offset continuo;
- mapping versionato e source-aware;
- `gmd-9-v1` usato soltanto come adapter GMD;
- fallback raw-note lane disponibile per note non mappate;
- multi-hit nella stessa lane/frame preservati come eventi distinti;
- `fill/core/variation/loopability/boundary` restano `unknown` senza evidenza;
- metadata style/beat/split restano non arricchiti.

Verifica reale GMD:

- 6 MIDI reali;
- 2382 source hits e 2382 view hits;
- 15 MIDI note uniche;
- 0 fallback hit sul profilo GMD-9;
- 65 lane/frame con multi-hit preservato;
- 8 proiezioni verso il bordo della window marcate come clipped, senza perdita del raw timing;
- accounting source-hit lossless: OK.

È stato verificato anche il percorso di export reale: 6 dataset item → 6 file Drum View V2, report valido, source/view hit accounting coerente e 0 raw fallback hit sul campione GMD.

Le 8 proiezioni boundary-clipped **non chiudono la policy di boundary**: il raw timing e il nearest-step pre-clamp restano disponibili, ma clamp/wrap/boundary-frame sono ancora materia della 7G. Il Blocco 1 non trasforma questa scelta provvisoria in ground truth.

Questo successo tecnico non dichiara `DRUM DATA READY V2` e non apre training serio.

Dettaglio e ricerca di chiusura: [PHASE7C_BLOCK1_CHIUSURA_2026-09-09.md](PHASE7C_BLOCK1_CHIUSURA_2026-09-09.md).

## Aggiornamento operativo — FASE 7C Blocco 2

**Stato del Blocco 2: COMPLETATO NEL SUO SCOPE TECNICO. FASE 7C: ANCORA APERTA.**

Il percorso Block2 preserva ora in forma strutturata i metadata ufficiali GMD (`style`, BPM, `beat_type`, time signature, split, drummer/session/id) e li propaga additivamente nella Drum View V2 senza modificare il contratto Block1.

Verifica reale su campione espanso:

- 24 MIDI reali importati;
- 24/24 dataset item enriched;
- 24/24 Drum View enriched;
- 896/896 source/view hits;
- 0 raw fallback hit sul profilo `gmd-9-v1`;
- metadata coverage completa;
- style primary: `hiphop=24`;
- beat type: `beat=24`;
- source split osservato: `train=18`, `validation=1`, `test=5`;
- source-hit accounting lossless.

`sourceSplit` resta esplicitamente `source-reference-only`: non viene promosso a split FAME definitivo. Analogamente `beat_type` è preservato come label di fonte e non diventa automaticamente ground truth `core/fill`.

Il campione resta intenzionalmente confinato al selector storico `hiphop/beat/4-4`; quindi questo risultato verifica enrichment e robustezza oltre i 6 file, **non** scala/diversità general-GMD e non chiude 7D.

Dettaglio e ricerca di chiusura: [PHASE7C_BLOCK2_CHIUSURA_2026-09-10.md](PHASE7C_BLOCK2_CHIUSURA_2026-09-10.md).

## Aggiornamento operativo — FASE 7D Blocco 1

**Stato del Blocco 1: COMPLETATO NEL SUO SCOPE DI INVENTORY. FASE 7D: ANCORA APERTA.**

Inventory reale completo di `info.csv` GMD v1.0.0:

- 1.150/1.150 record validi;
- 0 invalidi / 0 duplicati;
- 10 drummer;
- 18 primary style;
- 503 beat / 647 fill;
- source split: 897 train / 124 validation / 129 test;
- meter: 1.138 record 4/4 e 12 non-4/4;
- hiphop: 95 record, di cui 34 `beat/4-4`;
- cross-split: 9 drummer e 17 session;
- `eval_session`: 10 template / 40 record, tutti nel source test;
- reference checks ufficiali: PASS;
- `readyForSamplingDesign=true`.

Il risultato conferma che lo split GMD resta `source-reference-only`: è preservato per comparabilità, ma non viene promosso automaticamente a split FAME. Il Block2 confronterà grouping per session e drummer e terrà separati i pool source-labeled beat/fill senza trasformarli automaticamente in semantica `core/fill`.

Dettaglio: [PHASE7D_BLOCK1_CHIUSURA_2026-09-10.md](PHASE7D_BLOCK1_CHIUSURA_2026-09-10.md).

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

**7D Block2 completato nel proprio scope tecnico; Fase 7D ancora aperta. Owned Beats: Human Reference development finalizzata 8/8; baseline V1 reference-scored da congelare/eseguire prima del tuning V2.**

1. Human Reference development completata e finalizzata sulle 8 family; congelare ora evaluator/contratto della baseline V1 prima di osservare i punteggi. Nessun tuning o conversione è stato aperto dalla raccolta.
2. Confrontare V1/V2 secondo `owned-beats/audio-analysis-v2-protocol.json`, conservando anche esiti negativi e reference incerte.
3. Holdout accessibile solo dopo `V2_WINS` documentato e verifica del freeze di codice/configurazione/ambiente; nessuna apertura effettuata da questa patch.
4. Per GMD, confrontare copertura e distribuzione separatamente per beat/fill prima di scegliere lo split finale; i manifest Block2 restano candidati.
5. HH-TRP resta candidata secondo roadmap; bootstrap Owned Beats disponibile. Nessuna promozione automatica a dataset pronto.

Training serio chiuso; DRUM DATA READY V2 non superato; Planner rinviato. Non servono nuove fasi per questi fix.

## Aggiornamento operativo - FASE 7D Blocco 2

**Stato del Blocco 2: COMPLETATO NEL PROPRIO SCOPE TECNICO. FASE 7D: ANCORA APERTA.**

Run reale GMD:

- 1.150 record nel candidate manifest;
- 451 `general-beat-4/4` non-eval;
- 647 `fill-4/4` non-eval;
- 12 non-4/4 non-eval;
- 40 `eval_session` preservati come holdout candidato;
- 1.098 record 4/4 non-eval eleggibili.

Confronto candidate task split:

- session-grouped: `878 / 111 / 109`, 20 session group, 0 cross-task-split;
- drummer-held-out: `930 / 98 / 70`, 10 drummer group, 0 cross-task-split;
- representative drummer holdout: validation `drummer3`, test `drummer8`.

Il `sourceSplit` ufficiale GMD resta separato e `source-reference-only`.

Il Block2 non seleziona automaticamente lo split FAME finale: session-grouped e' molto piu' bilanciato numericamente; drummer-held-out offre invece separazione completa dell'identita' performer. La decisione operativa resta da fissare prima della materializzazione del corpus.

Digest candidate manifest reale: `8bf3e1e107c3d634ff2637d15950f617b3d8541420ced02fb692c0b80d4c78a2`.

`DRUM DATA READY V2` resta aperto e il training serio resta chiuso.
