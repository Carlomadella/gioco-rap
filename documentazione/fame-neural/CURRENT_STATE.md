# FAME Neural — Current State

Data: 2026-09-22

## Checkpoint corrente — Audio→MIDI independent evaluation: drums FAIL / low-end PASS — 22/09/2026

Checkpoint completo: [Owned Beats — Audio→MIDI independent evaluation — gate failure e failure analysis](OWNED_BEATS_AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_FAILURE_2026-09-22.md).

La pipeline congelata `intel-openvino-htdemucs-v4-97fc578 → drums-bass-kick-fusion-v1 + librosa-pyin-lowend-v1` è stata eseguita sul cohort fresco `audio-to-midi-independent-evaluation-v1` da 12 family. Il technical QA read-only ha passato `ALL_12_FAMILIES_PASS`, verificando 12 result, 48 stem e 24 MIDI.

La blind Human QA è stata finalizzata su 12/12 family:

- drums: mediana **2**, **8/12** family >=2, totale **18** → **FAIL** contro requisito 9/12;
- low-end: mediana **3**, **10/12** family >=2, totale **28** → **PASS**;
- outcome complessivo: `KEEP_BATCH_CLOSED_REVIEW_FAILURES`.

I failure drums non vengono interpretati come semplice miss di una sola family rispetto alla soglia: le note mostrano pattern ricorrenti di **eventi mancanti** e **confusione dei ruoli**, inclusi snare/clap sostituiti da hat, kick↔snare, rim/kick e triplet hat non rilevate. Il codice congelato conferma un limite strutturale rilevante: classificazione single-label con sole tre classi `kick/snare/hihat`; clap e rim non sono classi esplicite. La bass-kick fusion resta supportata come idea perché recupera kick utili in più family, ma mostra anche falsi/mancati kick e il suo decision layer va rivalutato.

Il low-end resta promosso **nel solo perimetro di questo gate**. I due casi sotto soglia richiedono diagnostica mirata su release/segmentazione (`FAME000001`) e range/confidence sulle note alte (`FAME000071`), senza trasformare ipotesi in root cause non verificate.

Le 12 family evaluation sono ora **consumate**: possono essere failure/regression evidence, ma non una nuova independent evaluation dopo tuning. Batch 131, training e task-data readiness restano chiusi.

### Precisazione dell'audit — 22/09/2026

Voti e outcome restano quelli registrati sopra. Eventi mancanti percepiti non provano da soli failure dell'onset detector; il beneficio netto della kick fusion richiede un confronto controllato. Il PASS low-end è relativo agli stem reference, non una verifica completa della separazione rispetto al mix originale.

Il renderer della review indipendente sintetizza dai JSON, non dai MIDI riletti, e deriva la durata dall'ultimo evento anziché dalla reference. Attacco/release sintetici possono influenzare l'ascolto: l'effetto sui voti non è stato misurato. Prima di nuove prove occorre verificare/versionare il renderer e separare detection, classificazione, segmentazione e difetti upstream. L'audit non ha aperto audio locali, modificato algoritmi o rivalutato i punteggi.

Il contour pYIN salvato omette i frame scartati; aumentare `maximumGapFrames` non allunga automaticamente le code e `fmax=300` riguarda la fondamentale, non le armoniche. NMF con template e attivazioni per strumento è una proposta da confrontare su development, non una soluzione adottata. Dettagli e fonti nel checkpoint; nessuna nuova autorizzazione a training/batch131.

## Prossimi passi attivi — NDR-093

Seguire il [piano operativo Audio→MIDI P1–P6](ROADMAP_FAME_NEURAL.md#piano-operativo-attivo--audiomidi-dopo-ndr-092), che prevale sui “prossimi passi” dei checkpoint storici sotto.

**Stato:** **P1 PASS, P2 PASS, P3 CONTROLLED COMPLETE, P4 PASS, P5 ATTIVO**. P3 controlled ha localizzato il failure drums nel layer di attribuzione ruoli/rappresentazione simultanea: snare isolato rilevato temporalmente ma classificato hihat; kick+snare e kick+hat simultanei hanno unique-transient recall 1.0 ma la pipeline single-label non può emettere entrambi i ruoli. Il low-end controllato resta stabile e congelato. NDR-095 congela il confronto P5; la prima variante è `drums-independent-multilabel-spectral-v1`. P6 su cohort fresco resta obbligatorio prima di qualsiasi promozione.

La prova easy storica è conservata nel [checkpoint dell'11 settembre](OWNED_BEATS_AUDIO_ANALYSIS_EASY_SANITY_CHECKPOINT_2026-09-11.md) e in NDR-050: riguardava Audio Analysis/sezioni, non Audio→MIDI. Il nuovo passaggio easy serve a isolare i difetti e non sostituisce i test rappresentativi. Disponibilità locale e diritti dei file devono essere verificati.

**Precisazione NDR-093 — curriculum easy→hard:** P4/P5 organizzano lo sviluppo dai colpi isolati ai beat completi rappresentativi, con criteri di avanzamento prestabiliti e regressioni sui livelli precedenti. L'eventuale curriculum di training è un'ipotesi da confrontare con gli stessi dati a complessità mescolata, a condizioni comparabili, soltanto dopo l'apertura del relativo gate. Training resta chiuso. Il confronto fusion ON/OFF deve misurare per evento kick recuperati, falsi positivi introdotti e kick mancanti, distinguendoli dal miglioramento storico di usefulness.

**Esito P1/P2 — NDR-094:** P1 è PASS. L'audit metadata-only ha verificato 131 record/131 family e 91 family fresche non assegnate secondo i criteri congelati. P2 è PASS: `FAME_NEURAL_P2_DIAGNOSTIC_AUDIT_PASS`, 12/12 family JSON↔MIDI equivalenti, zero overflow e nessuna modifica a voti/artefatti storici. Il renderer v1 storico era event-duration-dependent: il differenziale `reference - v1` osservato varia da -0.153832 s a +9.344331 s per drums, da -0.043152 s a +9.280862 s per bass notes e da +0.018458 s a +9.342472 s per contour. L'effetto sui voti storici non è misurato e non viene reinterpretato. Per i confronti futuri il sistema di misura usa il renderer v2 a durata reference. Checkpoint: [P2 measurement/export audit — PASS](OWNED_BEATS_AUDIO_TO_MIDI_P2_MEASUREMENT_PASS_2026-09-22.md).

**Esito P3/P4 — NDR-095:** controlled fixtures completate senza consumare family fresche. D01/D03/D06/D07 PASS; D02 classifica 4/4 snare come hihat pur con transient recall 1.0; D04/D05 mostrano il limite multi-role della classificazione single-label con unique-transient recall 1.0. Low-end: L01/L02/L04 F1 1.0 e L03 glide median absolute pitch error 2.879475 cent. Non si ritoccano low-end o onset timing e non si ricavano nuove soglie dal solo sintetico. Protocollo P5 congelato in `audio-to-midi-p5-drums-comparison-v1.json`. Checkpoint: [P3 controlled diagnostic / P4 decision](OWNED_BEATS_AUDIO_TO_MIDI_P3_P4_DECISION_2026-09-22.md).

**Esito P5 candidata 1 — NDR-096:** `drums-independent-multilabel-spectral-v1` è un negative result controllato. Recupera le simultaneità ma genera co-attivazioni broadband: D05 F1 0.8 con 4 FP, D06 F1 0.5 con 18 FP, D07 F1 0.5 con 10 FP. Non vengono ritoccate soglie sul sintetico. La seconda candidata P5 `drums-pfnmf-template-activation-v1` è ora implementata per un controlled mechanics test con template fissi D01/D02/D03, KL-NMF, `rH=0`, nessun template adaptation e threshold adattivo precongelato. Anche un eventuale PASS resta meccanico e non autorizza real-easy senza nuova strategia template/provenance.

**Esito P5 candidata 2 — NDR-097:** `drums-pfnmf-template-activation-v1` è un negative/partial result controllato. Il factorization converge ma restano cross-activation spurie: D05 F1 0.8 con 4 FP, D06 F1 0.642857 con 10 FP, D07 F1 0.5 con 10 FP; D04 recupera kick+snare ma aggiunge hihat falsi. Non vengono ritoccate soglie post-hoc. La terza candidata `drums-transient-subset-bic-v1` è congelata prima del primo risultato: onset detector baseline invariato, tutti i 7 sottoinsiemi kick/snare/hihat, ampiezze NNLS e scelta del sottoinsieme via BIC senza soglie di classe.

**Esito P5 candidata 3 — NDR-098:** `drums-transient-subset-bic-v1` migliora nettamente le co-attivazioni ma non supera il gate controllato. D05 F1 0.888889 con 2 FP snare; D06 F1 0.666667 con 9 FP snare; D07 resta F1 1.0. Il run ordina `STOP_CONTROLLED_NONLEARNED_VARIANT_LOOP_AND_REASSESS_REAL_TEMPLATE_OR_LEARNED_MULTI_LABEL_PATH`. Il loop euristico/template sul sintetico è quindi chiuso senza threshold tuning post-hoc. La prima candidata pretrained per il nuovo ramo è `Tsumugi drums_v1_5`, solo inference: source MIT commit `f7411471...`, checkpoint model repo MIT revision `89aefa28...`, SHA256 `65138ad1...9319`. Prima di qualsiasi audio access è obbligatorio il preflight environment/checkpoint no-audio.

Il prossimo passo attivo è preparare e verificare l'ambiente Tsumugi congelato senza aprire audio. Batch131, training e task-data readiness restano chiusi.

## Checkpoint precedente — R6 Audio Analysis finale chiuso / V2_PROMOTE — 20/09/2026

Checkpoint completo: [Owned Beats — Audio Analysis R6 final holdout](OWNED_BEATS_AUDIO_ANALYSIS_R6_FINAL_HOLDOUT_2026-09-20.md).

La singola evaluation finale one-shot sul cohort sostitutivo `evaluation-holdout-r1-v2` è stata completata su 10/10 family con la Human Reference cieca finalizzata e la stessa reservation congelata.

- candidate: `audio-analysis-v2-config-001`;
- run: `r6-final-holdout-001`;
- technical integrity: **PASS**;
- beat tracker outputs exactly invariant: **true**;
- paired median delta Beat F1 @70 ms: `0.0`;
- paired median delta Section F1 @0,5 s: `+0.545805`;
- metric gate: **`V2_WINS`**;
- protocol outcome: **`V2_PROMOTE`**;
- retuning sullo stesso holdout: **vietato**.

Il nuovo holdout R1 v2 è quindi **osservato, consumato e chiuso per tuning**. Non può essere riutilizzato per scegliere o modificare una configurazione successiva. `config-001` è la versione Audio Analysis promossa per il downstream del pilot.

Source Separation pilot **preparato e pre-inference validato**: preflight reale passato su 8/8 family development e run append-only `source-separation-pilot-v1-001` creato con SHA delle sorgenti verificati; inferenza non ancora avviata. Baseline primaria: `intel-openvino-htdemucs-v4-97fc578`. Doctor reale PASS: Audacity 3.7.1, `mod-openvino.dll`, `mod-script-pipe.dll` e i due hash HTDemucs congelati sono presenti. La pipe reale funziona, ma `GetInfo` non espone `OpenVINO Music Separation` come comando automatizzabile; l'adapter batch via Audacity resta quindi chiuso come strada non idonea. Il backend standalone dedicato usa Python 3.10.11, `torch 2.4.1+cpu`, `openvino 2024.6.0` e FFmpeg 9.0.1, con lock transitivo esatto da 16 package (source receipt SHA256 `e7fd1df0076b79101923900aa280b3c53a46c5b0a166bad75cbf972b7794411a`). Il gate no-audio reale ha passato: environment lock, prepared-run check 8/8 development, adapter self-test e compilazione/signature del modello OpenVINO congelato su CPU; input `[1,4,2048,336]` + `[1,2,343980]`, output `[1,16,2048,336]` + `[1,8,343980]`, tutti float32. Il comando non ha aperto audio, non ha eseguito separazione, non ha installato package e non ha acceduto al final holdout. Adapter, execution contract, rubric QA e batch runner append-only sono ora implementati; il contract congela anche 44.1 kHz stereo float32, WAV PCM-f32le, cache OpenVINO e identità Git del runner. Il protocollo opening del run preparato è rimasto byte-identico. Il receipt append-only `source-separation-development-inference-v1-001` è stato ora creato con stato `AUTHORIZED_NO_INFERENCE`, 8/8 record e `sourceFamiliesLocked=true`; il comando di preparazione ha rieseguito integralmente il pre-inference gate e ha dichiarato `sourceAudioOpenedByThisCommand=false`, `sourceSeparationExecutedByThisCommand=false` e `finalHoldoutAccessedByThisCommand=false`. Il check read-only del receipt congelato è ora passato sul workspace reale: `SOURCE_SEPARATION_DEVELOPMENT_INFERENCE_RECEIPT_CHECK`, stato `AUTHORIZED_NO_INFERENCE`, 8 record, `sourceFamiliesLocked=true`, `finalHoldoutExcluded=true`, `batch131Authorized=false`, `trainingAuthorized=false`. Il batch append-only è stato ora eseguito sulle sole 8 family development congelate (`FAME000011`, `FAME000012`, `FAME000023`, `FAME000040`, `FAME000046`, `FAME000058`, `FAME000080`, `FAME000126`) e ha completato 8/8 record con stato `INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA` e `technicalValidationPassed=true`. Il comando ha dichiarato `finalHoldoutAccessedByThisCommand=false`, `batch131ExecutedByThisCommand=false` e `trainingAuthorized=false`. Il technical QA read-only è ora passato: `SOURCE_SEPARATION_TECHNICAL_QA_PASS`, gate `ALL_8_FAMILIES_PASS`, 8/8 record e 32/32 stem verificati. Le metriche `peakAbs`, `rms` e `stemSumResidualRmsRatio` sono state registrate senza soglia post-hoc come previsto dalla rubric; `FAME000126` mostra il residual ratio più alto (`0.101165...`) ma non esiste una soglia congelata che lo trasformi automaticamente in failure. La review umana congelata è ora completata con PASS: drums median 2.5 e 8/8 family >=2; bass median 2.5 e 7/8 family >=2. Outcome ufficiale: `OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT`. Le osservazioni qualitative sullo stem `other` mostrano invece instabilità lungo l'arrangiamento in più family, quindi il ramo tonal Audio→MIDI resta chiuso. Checkpoint: [Source Separation development PASS — 20/09/2026](OWNED_BEATS_SOURCE_SEPARATION_DEVELOPMENT_PASS_2026-09-20.md). Ricerca di apertura Audio→MIDI completata e documentata: [Owned Beats — Audio→MIDI drums/low-end — ricerca di apertura — 20/09/2026](OWNED_BEATS_AUDIO_TO_MIDI_OPENING_RESEARCH_2026-09-20.md). Il protocollo `audio-to-midi-development-protocol-v1.json` è congelato prima del primo output e lega l'esecuzione al baseline Git blob `0e48d49e6c7784b9e26628dcf52becd3d5456b9c`. Il baseline append-only confronta `drums-only-spectral-onset-v1` con `drums-bass-kick-fusion-v1` e usa `librosa-pyin-lowend-v1` per il low-end. Il BPM MIDI deriva esclusivamente dall'output stimato della `audio-analysis-v2-config-001` development, non dalla Human Reference. Basic Pitch 0.4.0 resta candidata low-end ma è bloccata fino a environment/model freeze dedicato. Preflight locale completato con `AUDIO_TO_MIDI_DEVELOPMENT_BASELINE_PREFLIGHT_PASS`: 8/8 family development, autonomous BPM coverage 8/8, Python `3.14.3`, `librosa 1.0.0`, FFmpeg `9.0.1`; `sourceAudioOpenedByThisCommand=false`, `transcriptionExecutedByThisCommand=false`, final holdout/batch131/training tutti esclusi. **Prossimo passo autorizzato: esecuzione append-only della baseline Audio→MIDI sulle sole 8 family development.** La prima esecuzione reale Audio→MIDI è ora completata con `AUDIO_TO_MIDI_DEVELOPMENT_BASELINE_COMPLETE`, 8/8 record e stato `BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA`; il comando ha dichiarato final holdout non acceduto, batch 131 non acceduto e training non autorizzato. Questo certifica il completamento dell'esecuzione, non ancora la qualità tecnica/musicale degli output. Training serio resta chiuso.

## Checkpoint precedente — integrazione audit 13/09/2026

**Checkpoint storico precedente:** [Integrazione audit 13 settembre](INTEGRAZIONE_AUDIT_2026-09-13.md).
Le sezioni sottostanti restano storico della progressione e non autorizzano l'accesso al vecchio holdout.
R1 usa il nuovo cohort sostitutivo `evaluation-holdout-r1-v2` con identità complete e digest; il vecchio holdout è escluso per provenienza insufficiente.
Integrate le correzioni CI, Drum View, readiness, codec train-only, storico reservation e copertura UI cieca. Test locali e limiti nel checkpoint; CI remota da verificare dopo push.
R6 finale resta aperto: reference cieca disponibile, scoring V1/config-001 e paired comparison finale ancora da collegare alla reservation. Training serio chiuso.

## Owned Beats — storico dello stato operativo

> Checkpoint corrente Audio Analysis: [R6 final holdout — V2_PROMOTE — 20/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_R6_FINAL_HOLDOUT_2026-09-20.md).
> Checkpoint development precedente: [V2 config-001 — development V2_WINS + candidate freeze — 12/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_V2_DEVELOPMENT_WIN_CANDIDATE_FREEZE_2026-09-12.md).
> Checkpoint precedente Block E: [V2 config-001 — metric gate — 11/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_V2_CONFIG001_METRIC_GATE_2026-09-11.md).
> Diagnostica complementare: [Easy sanity set e localization audit — 11/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_EASY_SANITY_CHECKPOINT_2026-09-11.md).
> Metodo review congelato: [Freeze correction-cost review config-001 — 11/09/2026](OWNED_BEATS_AUDIO_ANALYSIS_CORRECTION_COST_REVIEW_FREEZE_2026-09-11.md).

**Fotografia storica del 20/09/2026, superata dai checkpoint successivi. Per lo stato corrente fa fede il checkpoint del 22/09/2026 in apertura; questa sezione non definisce il prossimo passo.**

| Attività | Stato | Evidenza / prossimo vincolo |
|---|---|---|
| Bootstrap / inventory corpus proprietario | **COMPLETATO** | 133 file sorgente → 131 asset unici; manifest e copie verificate |
| Verifica export nativi | **COMPLETATO** | 131/131 `NONE_AVAILABLE`; si procede dall'audio |
| Selezione cohort pilot | **COMPLETATO** | 8 beat registrati in `owned-beats-pilot-v1` |
| Composition family corpus proprietario | **COMPLETATO** | 131/131 record confermati umanamente come composizioni distinte; 131 `compositionFamilyId` unici, 0 record senza family |
| Diversità musicale pilot | **DA COMPLETARE** | audit formale del pilot ancora da fare; sanity set separato di 3 boom bap volutamente semplici supporta l'ipotesi che il development congelato sia comparativamente più difficile, ma non sostituisce una verifica sistematica di difficoltà/diversità |
| Evaluation holdout R1 v2 | **CONSUMATO / CHIUSO ONE-SHOT** | 10/10 family valutate una sola volta in `evaluation-holdout-r1-v2`; cohort digest `887ac3aee76ac65b710381bc428bd8bb7cd5708e94a4dbd9449dbea9386866e6`; reservation digest `b3b3af11aaefb894353a3a80b27b077488d7430a52371bafd91f1a8316fc1ac5`; vietato retuning sullo stesso holdout |
| Human Reference development | **COMPLETATA / VERSIONATA** | `precision-v3` finalizzata: 8/8 family, 24/24 finestre `COMPLETE` + reviewed, digest `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`; `precision-v2`/`precision-v1` preservate come storico |
| Human Reference holdout R1 v2 | **COMPLETATA / FINALIZZATA** | 10/10 family complete e beat-metric usable; reviewId `audio-analysis-v2-holdout-r1-v2-reference-001`; submission digest `83a28e300daa8b64653354db46afabbcb4737c300e02636bf9b8bcde9c4efe90` |
| Ambiente tecnico Audio Analysis | **COMPLETATO** | FFmpeg/ffprobe 9.0.1 + Python 3.14 + stack audio verificata |
| Audio Analysis pilot | **R6 CHIUSO — V2_PROMOTE** | `audio-analysis-v2-config-001` confermata sul final holdout one-shot: beat paired median delta `0.0`, section F1 @0,5 s paired median delta `+0.545805`, technical integrity PASS; comparison SHA256 `c38046919388b839dce070f6a9503efad6c6fc43045bd6196305ea0056c12d7d`; nessun retuning consentito sullo stesso holdout |
| Source Separation pilot | **PASS — AUDIO→MIDI DRUMS/LOW-END APERTO** | technical QA 8/8 + 32/32 stem PASS; human gate: drums median 2.5, 8/8 >=2; bass median 2.5, 7/8 >=2; outcome `OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT`; `other` mostra degrado temporale qualitativo in più family, quindi tonal resta chiuso |
| Trascrizione Audio→MIDI | **INDEPENDENT EVALUATION: DRUMS FAIL / LOW-END PASS** | Technical QA 12/12, 48/48 stem e 24/24 MIDI PASS. Blind Human QA: `drums-bass-kick-fusion-v1` median 2, 8/12 >=2, total 18 → FAIL; `librosa-pyin-lowend-v1` median 3, 10/12 >=2, total 28 → PASS. Outcome `KEEP_BATCH_CLOSED_REVIEW_FAILURES`; cohort 12 consumato, nessun retuning consentito. |
| QA Audio→MIDI | **COMPLETATO — GATE COMPLESSIVO FAIL** | Technical QA PASS; blind Human QA completata. Failure analysis formalizzata nel checkpoint 22/09/2026: drums detection/recall + role classification + kick-fusion decision da separare nel prossimo development; low-end passa il gate. |
| Espansione batch corpus | **BLOCCATA** | Independent evaluation complessiva FAIL sul ramo drums; nessun batch 131 finché una nuova variante non supera un nuovo gate indipendente su cohort fresco. |
| Training serio | **CHIUSO** | nessun training autorizzato da questo avanzamento |

Le 131 composition family del corpus proprietario sono state confermate umanamente e registrate. Il cohort di sviluppo contiene 8 family e l'evaluation holdout 10 family distinte, senza overlap. I 113 record rimanenti non hanno ancora uno split assegnato. `familyStatus`, QA e task admissibility restano separati e non vengono auto-promossi.

## Addendum operativo — audit tecnico 12/09/2026

> Documento corrente: [Audit tecnico integrato 12/09/2026](AUDIT_TECNICO_FAME_NEURAL_2026-09-12.md).
>
> Questo addendum **non riscrive lo storico** del file. Per le prossime azioni prevale sulle sezioni operative più vecchie presenti sotto.

Nuovi riscontri integrati:

- **R1 — BLOCCANTE holdout:** il gate corrente non lega ancora le 10 family a uno snapshot/digest indipendente del cohort originale pre-tuning. Prima della reservation reale va recuperata/provata l'identità `compositionFamilyId / sourceRecordId / sourceAssetId / sha256`, aggiungendo anche controllo asset cross-split e reservation asset-aware.
- **R2 — Drum View:** `resolveWindow()` richiede oggi, indirettamente, metro stabile sull'intera sorgente; va corretto prima dell'espansione a sorgenti con cambi di metro.
- **R3 — `trainingReady`:** oggi equivale sostanzialmente ad “almeno un record allowed”; non deve essere interpretato come dataset pronto al training.
- **R4 — microtrain storico:** i codec sono costruiti da `records["all"]`; il debito va chiuso prima di riusare quel benchmark per nuove conclusioni.
- **R5 — documentazione:** alcune istruzioni storiche più sotto sono superate; restano archiviate ma non costituiscono la prossima azione corrente.
- **R6 — percorso holdout:** preflight/reservation non equivalgono ancora alla evaluation completa; servono reference cieca, V1, config-001 e paired comparison sotto un'unica reservation one-shot.

**Priorità corrente:** chiudere R1 senza osservare il vero holdout. Development `V2_WINS`, candidate freeze, config e protocollo restano invariati.

---

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


Technical QA Audio→MIDI completato sul run `audio-to-midi-development-baseline-v1-001`: `AUDIO_TO_MIDI_DEVELOPMENT_TECHNICAL_QA_PASS`, 8/8 family, 24/24 MIDI verificati, PPQ 480, conteggi note/eventi coerenti con i result JSON, final holdout/batch131/training tutti esclusi. Le diagnostiche non sono interpretate come qualità musicale e non selezionano automaticamente l'arm.


Human QA Audio→MIDI congelata prima dell'ascolto con reviewId `audio-to-midi-human-review-v1-001`. I due arm drums vengono presentati come A/B ciechi con assegnazione bilanciata e stesso renderer neutro; la selezione usa nell'ordine mediana usefulness, numero di family >=2, somma voti e solo in parità completa preferisce il baseline drums-only più semplice. Il low-end pYIN viene valutato contro lo stem bass originale con render MIDI note-level e render diagnostico del pitch contour. Le diagnostiche tecniche (conteggi eventi, kick candidate, note count) non sono mostrate al reviewer.


Human QA Audio→MIDI completata con submission digest `52e7803b56fee6a6a7dea7546b7a6c6c38fdb86b01b6861f07a5a96882518f0d` e outcome `OPEN_AUDIO_TO_MIDI_QA_INTEGRATION`. Il ramo drums selezionato è `drums-bass-kick-fusion-v1`; `drums-only-spectral-onset-v1` resta baseline negativa utile. `librosa-pyin-lowend-v1` supera il proprio gate ma resta baseline qualificata, non vincitore finale, perché il protocollo richiede ancora il confronto Basic Pitch.

Preparazione Basic Pitch aperta in ambiente separato `venv-basic-pitch`, Python 3.10, package `basic-pitch==0.4.0`, backend atteso ONNX su Windows. Prima inferenza vietata finché non vengono congelati exact transitive lock e SHA256 del modello ONNX incluso nel pacchetto.


Bootstrap ambiente Basic Pitch completato con `BASIC_PITCH_ENVIRONMENT_BOOTSTRAP_PASS`: Python `3.10.11`, `basic-pitch==0.4.0`, backend `ONNX`, `onnxruntime==1.23.2`, modello packaged `nmp.onnx` da 230444 byte con SHA256 `2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec`. Il `pip freeze --all` locale ha SHA256 `9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f`. Setup senza accesso audio/inferenza/holdout/batch131/training. Il modello è ora congelato in repo; manca solo il commit del lock transitivo esatto prima di qualsiasi inferenza Basic Pitch.


Exact transitive lock Basic Pitch committato in `requirements-basic-pitch-lock.txt`: 44 package, package set derivato dal `pip freeze --all` locale con source SHA256 `9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f`, SHA256 canonico repository `3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad`. `.gitattributes` forza LF sul lock digest-sensitive. Stato candidato: environment+model frozen, **verifica locale finale pre-inference pendente**. Nessuna inferenza Basic Pitch autorizzata prima di `BASIC_PITCH_ENVIRONMENT_LOCK_VERIFY_PASS`.


Pre-inference gate Basic Pitch completato con `BASIC_PITCH_PREINFERENCE_GATE_PASS`: exact environment/model lock verificato, 8/8 family development verificate, byte degli 8 `bass.wav` letti solo per controllo SHA, nessun decode audio, nessuna inferenza Basic Pitch, nessun MIDI scritto, nessun accesso a source audio originale/final holdout/batch131 e training ancora non autorizzato. Prossimo passo: creare il receipt append-only `basic-pitch-development-inference-v1-001` in stato `AUTHORIZED_NO_INFERENCE`.

Execution contract Basic Pitch congelato prima del primo output: API `basic_pitch.inference.predict`, default v0.4.0 onset `0.5`, frame `0.3`, minimum note length `127.70 ms`, banda low-end `25–300 Hz`, `multiplePitchBends=true`, `melodiaTrick=true`, BPM autonomo per family dalla Audio Analysis V2. Il receipt runner è congelato al Git blob `0feffda5174f5a4a3a29a986c437384cc8cbc5f7`.


Receipt Basic Pitch development creato con `BASIC_PITCH_DEVELOPMENT_INFERENCE_RECEIPT_PREPARED`: run `basic-pitch-development-inference-v1-001`, 8/8 family, stato `AUTHORIZED_NO_INFERENCE`, source families locked, byte dei bass stem letti solo per integrity SHA, nessun decode audio, nessuna inferenza Basic Pitch e nessun MIDI scritto; final holdout/batch131/training restano esclusi.

L'esecuzione reale è implementata in un runner separato e congelato prima del primo output. Executor Git blob `0027011aa74a001c52918e885864c8bf82891260`, model load una sola volta per processo, output per-family atomico e resume ammesso solo dopo validazione di `result.json`+MIDI. Il runner verifica inoltre che l'oggetto `receipt.inference` sia identico all'execution contract congelato prima di utilizzare le soglie.


Il primo tentativo di inferenza Basic Pitch sul run `basic-pitch-development-inference-v1-001` è fallito. Diagnostica read-only successiva: model load ONNX PASS, zero family output complete, nessun summary e nessuna temp directory residua. Nel codice v1 è stato individuato un difetto certo: l'executor eseguiva il rename atomico verso `root/outputs/<sourceRecordId>` senza creare prima `root/outputs` (`OUTPUT_PARENT_NOT_CREATED_BEFORE_ATOMIC_RENAME`). Il wrapper originale non ha conservato il testo dell'eccezione Python, quindi non si dichiara che questo fosse necessariamente l'unico failure point precedente al rename.

Per preservare l'evidenza consumata, v1-001 non viene modificato né riutilizzato. È stato preparato il superseding run `basic-pitch-development-inference-v1-002` con algoritmo e parametri identici al v1; cambia solo l'implementazione di persistenza: creazione/validazione dell'output root prima dell'inferenza, output atomici invariati e failure report append-only con stage/source/error/traceback.


Superseding receipt Basic Pitch creato con `BASIC_PITCH_SUPERSEDING_INFERENCE_RECEIPT_PREPARED`: run `basic-pitch-development-inference-v1-002`, supersedes `v1-001`, 8/8 record, stato `AUTHORIZED_NO_INFERENCE`, `algorithmChanged=false`, zero inferenza/MIDI/holdout/batch131/training durante la preparazione. Il prossimo passo autorizzato è l'esecuzione append-only del v1-002 con executor congelato e failure report persistente in caso di nuovo errore.


Il run superseding `basic-pitch-development-inference-v1-002` è fallito **prima del model load e prima di qualsiasi inferenza** durante `validate_receipt()`. Causa radice verificata nel codice: il producer v2 non emetteva `preInferenceGatePassedImmediatelyBeforeReceipt`, mentre l'executor v2 lo richiedeva ancora come residuo della validazione v1 (`RECEIPT_EVIDENCE_PRODUCER_CONSUMER_MISMATCH`). Nessun output family è stato prodotto dal v1-002.

È stato preparato il nuovo superseding `basic-pitch-development-inference-v1-003`, ancora `algorithmChanged=false`. Il contract v3 congela l'intero oggetto `receiptEvidence`; il producer usa direttamente tale oggetto e l'executor confronta l'intero oggetto, eliminando la duplicazione di schema. La preparazione v1-003 riesegue inoltre un fresh pre-inference gate prima di creare il receipt. Il failure report v3 copre anche `PRE_EXECUTION_VALIDATION`.


Il receipt append-only del run `basic-pitch-development-inference-v1-003` è stato creato con `BASIC_PITCH_V1_003_INFERENCE_RECEIPT_PREPARED`: supersedes `v1-002`, 8/8 record, `status=AUTHORIZED_NO_INFERENCE`, fresh pre-inference gate PASS, `algorithmChanged=false`, nessuna inferenza/MIDI/holdout/batch131/training durante la preparazione. Contract v3, receipt runner v3 ed executor v3 restano congelati e non vengono più modificati prima del primo output.


Basic Pitch development inference v1-003 completata con `BASIC_PITCH_V1_003_DEVELOPMENT_INFERENCE_COMPLETE`: 8/8 record, stato `INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA`, modello caricato una volta per processo, raw model output non persistito, nessun accesso final holdout/batch131 e training/task-data readiness ancora chiusi.

È stato implementato il technical QA read-only del v1-003 e congelato il protocollo di blind comparison low-end `basic-pitch-lowend-blind-comparison-v1-001`. Il confronto rivaluta alla cieca `librosa-pyin-lowend-v1` vs `basic-pitch-0.4.0-lowend-v1` sugli stessi 8 bass stem, con qualification gate mediana >=2 e almeno 6/8 family >=2. Parità completa -> pYIN per minore complessità. La review non è ancora stata eseguita.


La prima blind low-end review `basic-pitch-lowend-blind-comparison-v1-001` è stata interrotta prima della submission finale dopo aver osservato un candidate render di ~1 s. Causa verificata nel renderer: la durata del WAV sintetico era derivata dall'ultimo evento rilevato dal candidate, non dalla durata del `bass.wav` di riferimento (`CANDIDATE_RENDER_DURATION_TRUNCATED_TO_LAST_DETECTED_EVENT`). Questo rendeva impossibile valutare correttamente coverage e silenzi mancanti.

È stato congelato il superseding protocol `basic-pitch-lowend-comparison-v2.json` con review ID `basic-pitch-lowend-blind-comparison-v1-002`. Reference, Candidate A e Candidate B devono ora condividere la durata del bass stem di riferimento; se un metodo non rileva eventi per parte del brano, il renderer conserva silenzio fino alla fine. Il vecchio pacchetto viene marcato append-only come abortito solo se non esistono submission/report finali.


La review blind low-end v1 può risultare già finalizzata localmente. Poiché il renderer v1 è stato verificato come metodologicamente invalido per durata candidate troncata, una finalizzazione v1 non viene più trattata come blocker. Il superseding v2 preserva package/blind key/submission/report, ne verifica schema e digest, scrive `superseded-invalid-review.json` con stato `SUPERSEDED_INVALID_RENDER_DURATION`, forza `gateFromInvalidReviewIgnored=true` e `scoresCopiedToSupersedingReview=false`, quindi prepara una review v2 nuova da zero.


La blind low-end comparison v2 è chiusa con `KEEP_PYIN_LOW_END`: `librosa-pyin-lowend-v1` ha mediana 2, 7/8 family >=2 e score totale 17; `basic-pitch-0.4.0-lowend-v1` ha mediana 0, 0/8 family >=2 e score totale 0. Il singolo caso pYIN con score 1 è stato chiarito durante la review come **failure upstream di source separation**, non come root cause di trascrizione: nello stem `bass` sono già presenti residui del lead che occupano la stessa regione spettrale dell'808, e pYIN li trascrive coerentemente nel MIDI. La classificazione adottata è `UPSTREAM_SOURCE_SEPARATION_CONTAMINATION`; la family specifica viene ricavata automaticamente dal `submission.json` v2 e mantenuta come regression case development.

È stato congelato il run append-only `audio-to-midi-selected-integration-v1-001` per integrare `drums-bass-kick-fusion-v1` + `librosa-pyin-lowend-v1`. L'integrazione non ritrascrive e non ricodifica MIDI: copia byte-identici i due output selezionati, registra SHA/provenance/punteggi e known issue per family. Final holdout, batch131, training e task-data readiness restano chiusi. **Run locale non ancora eseguito.**


Il run locale `audio-to-midi-selected-integration-v1-001` ha completato 8/8 family con `AUDIO_TO_MIDI_SELECTED_INTEGRATION_COMPLETE` e stato `SELECTED_DEVELOPMENT_INTEGRATION_COMPLETE`. Selezioni: `drums-bass-kick-fusion-v1` + `librosa-pyin-lowend-v1`. Il known issue è stato risolto automaticamente dal submission v2 come `FAME000040`, classificazione `UPSTREAM_SOURCE_SEPARATION_CONTAMINATION`. Il comando non ha eseguito ritrascrizione né ricodifica MIDI e non ha acceduto final holdout/batch131 né autorizzato training/task-data readiness. È ora disponibile il verifier read-only post-output; la chiusura formale del blocco resta subordinata al suo PASS sul workspace locale e alla ricerca di chiusura prevista da NDR-026.

## Chiusura Audio→MIDI drums/low-end development — 21 settembre 2026

Il verifier post-output del run `audio-to-midi-selected-integration-v1-001` è passato sul workspace reale con:

- `AUDIO_TO_MIDI_SELECTED_INTEGRATION_VERIFY_PASS`;
- stato `SELECTED_DEVELOPMENT_INTEGRATION_VERIFIED`;
- 8/8 family verificate;
- 16/16 MIDI finali byte-identici ai corrispondenti MIDI selezionati della baseline;
- drums selezionato: `drums-bass-kick-fusion-v1`;
- low-end selezionato: `librosa-pyin-lowend-v1`;
- `FAME000040` unico known issue low-end;
- classificazione `UPSTREAM_SOURCE_SEPARATION_CONTAMINATION`;
- root-cause layer `source-separation`;
- `transcriptionRootCause=false`;
- nessuna ritrascrizione;
- nessuna ricodifica MIDI;
- final holdout/batch131 non acceduti;
- training non autorizzato;
- task-data readiness falsa.

La ricerca di chiusura obbligatoria NDR-026 è completata in [OWNED_BEATS_AUDIO_TO_MIDI_CLOSING_RESEARCH_2026-09-21.md](OWNED_BEATS_AUDIO_TO_MIDI_CLOSING_RESEARCH_2026-09-21.md).

Stato del blocco:

`AUDIO_TO_MIDI_DRUMS_LOW_END_DEVELOPMENT_CLOSED`

Il PASS resta development-only. Drums mantiene due family sotto soglia (`FAME000023=0`, `FAME000080=1`); low-end mantiene `FAME000040=1`, attribuito a contaminazione upstream dello stem e non a root cause pYIN. Basic Pitch resta negative result storico con 0/8 family >=2 nel confronto congelato.

Le 10 family già usate nel final holdout Audio Analysis non vengono riutilizzate automaticamente come nuovo final test indipendente Audio→MIDI. Il prossimo step è preparare un cohort evaluation fresco da family ancora non assegnate, con protocollo e numerosità congelati prima di qualsiasi nuovo ascolto/output. Training e batch131 restano chiusi.

## Preparazione evaluation Audio→MIDI indipendente — 21 settembre 2026

Dopo la chiusura del blocco development è stato congelato il protocollo `audio-to-midi-independent-evaluation-v1.json` prima della selezione del nuovo cohort.

Regole congelate:

- corpus atteso: 131 record / 131 composition family;
- cohort fresco: 12 family;
- selezione metadata-only con `opaque-identity-sha256-rank-v1`;
- nessun audio aperto, hashato o analizzato durante la selezione;
- esclusione di qualunque record già splittato, usato in pilot, QA o processing;
- esclusione esplicita degli 8 development e del final holdout Audio Analysis già consumato;
- pipeline da valutare immutabile: HTDemucs selezionato → `drums-bass-kick-fusion-v1` + `librosa-pyin-lowend-v1`;
- Basic Pitch non rientra nell'evaluation;
- gate umano predefinito: mediana >=2 e almeno 9/12 family >=2 sia drums sia low-end;
- batch131, training e task-data readiness ancora non autorizzati.

Il selector `prepare-audio-to-midi-independent-evaluation.js` è congelato al Git blob `305fe132ba54d4b777d8d2a76e66262fd39ea554`. Il prossimo comando locale deve soltanto selezionare e materializzare la reference metadata-only dei 12 record; prima di qualunque accesso audio la reference risultante verrà congelata in repository.

## Evaluation Audio→MIDI indipendente: cohort fresco congelato — 21 settembre 2026

La selezione metadata-only del nuovo cohort indipendente è completata e congelata in `audio-to-midi-independent-evaluation-cohort-v1.json`.

Evidenza del manifest reale:

- 131 record / 131 composition family;
- universo fresco eleggibile al momento della selezione: **103 family**;
- eligible-universe digest: `60c77d0fb6f12fc3e9df4f66a329ccb1b7bef60954264e70924851dddf98904f`;
- source-manifest identity digest: `a459b2df4c9e3a0fe0b268e58833e15c9b45097231b115a1d85311e993557f38`;
- cohort selezionato: 12 family;
- cohort digest: `287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788`;
- audio aperto/hashato/decodificato durante la selezione: no;
- metriche audio usate per selezionare: no;
- manifest modificato dalla selezione: no;
- split modificati dalla selezione: no.

Il precedente valore **113 unassigned** era una fotografia precedente alla selezione/assegnazione delle 10 nuove family del cohort `evaluation-holdout-r1-v2`. Quel cohort R1 v2 era stato scelto da un universo di 113 e, una volta assegnato al proprio split, ha lasciato **103 family ancora intatte**. Non risultano asset persi o rimossi.

I 12 record congelati sono:

`FAME000001, FAME000102, FAME000006, FAME000129, FAME000020, FAME000073, FAME000092, FAME000121, FAME000010, FAME000071, FAME000116, FAME000101`.

La reference è legata al selector Git blob `305fe132ba54d4b777d8d2a76e66262fd39ea554`, al protocollo e alla decisione di split. Il prossimo passo è metadata-only: preflight + reservation delle 12 family nello split `audio-to-midi-evaluation-v1`, ancora senza Source Separation o Audio→MIDI.

## Evaluation Audio→MIDI: reservation completata ed execution congelata — 21 settembre 2026

La reservation del cohort `audio-to-midi-independent-evaluation-v1` è completata e verificata con `AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_RESERVATION_CHECK_PASS`.

Stato verificato:

- 12/12 family usano lo split `audio-to-midi-evaluation-v1`;
- 0 record estranei usano quello split;
- cohort digest `287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788`;
- audio non aperto/decodificato dalla reservation;
- Source Separation non eseguita;
- trascrizione non eseguita;
- batch131/training/task-data readiness ancora chiusi.

Dopo la reservation, il corpus proprietario ha **91 family ancora non assegnate** (103 fresche prima della reservation meno le 12 ora riservate).

È stato inoltre congelato, prima del primo audio access evaluation, `audio-to-midi-independent-evaluation-execution-v1.json`. La pipeline resta immutata rispetto alla selezione development: BPM autonomo `audio-analysis-v2-config-001` con beat/BPM V1 invariati → HTDemucs OpenVINO congelato → `drums-bass-kick-fusion-v1` + `librosa-pyin-lowend-v1`. Basic Pitch resta escluso. Il nuovo executor ha self-test CI PASS nell'ambiente Audio Analysis.

Prossimo passaggio: creare e verificare il receipt append-only di esecuzione senza aprire audio. Solo dopo quel receipt è consentita la singola esecuzione sui 12 record.
