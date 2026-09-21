# Owned Beats — Audio→MIDI drums/low-end — ricerca di chiusura — 21/09/2026

## Esito del blocco

Il blocco **Audio→MIDI drums/low-end development-only** è chiudibile nel proprio scope.

Pipeline selezionata:

- drums: `drums-bass-kick-fusion-v1`;
- low-end: `librosa-pyin-lowend-v1`.

Run integrato:

- `audio-to-midi-selected-integration-v1-001`;
- 8/8 family;
- 16/16 MIDI verificati byte-identici ai corrispondenti output selezionati della baseline;
- nessuna ritrascrizione;
- nessuna ricodifica MIDI;
- final holdout non acceduto;
- batch 131 non acceduto;
- training non autorizzato;
- task-data readiness non dichiarabile.

Verifier finale:

`AUDIO_TO_MIDI_SELECTED_INTEGRATION_VERIFY_PASS`

con stato:

`SELECTED_DEVELOPMENT_INTEGRATION_VERIFIED`.

Questa chiusura vale **soltanto per il blocco development**. Non equivale a generalizzazione, task-data readiness, readiness di training o qualità production.

---

## Risultati umani consolidati

### Drums

Arm selezionato:

`drums-bass-kick-fusion-v1`

Punteggi finali sulle 8 family:

| Source record | Score |
|---|---:|
| FAME000011 | 2 |
| FAME000012 | 2 |
| FAME000023 | 0 |
| FAME000040 | 2 |
| FAME000046 | 2 |
| FAME000058 | 2 |
| FAME000080 | 1 |
| FAME000126 | 2 |

Aggregato:

- mediana: **2**;
- family >= 2: **6/8**;
- totale: **13**;
- gate congelato: **PASS**.

Il PASS è reale secondo il protocollo predefinito, ma non va reinterpretato come robustezza 8/8. `FAME000023` e `FAME000080` restano failure/weakness development. La causa specifica di questi due punteggi non viene inventata in assenza di una nota causale congelata nella review finale.

### Low-end

Arm selezionato:

`librosa-pyin-lowend-v1`

Punteggi finali sulle 8 family:

| Source record | Score |
|---|---:|
| FAME000011 | 2 |
| FAME000012 | 2 |
| FAME000023 | 3 |
| FAME000040 | 1 |
| FAME000046 | 2 |
| FAME000058 | 3 |
| FAME000080 | 2 |
| FAME000126 | 2 |

Aggregato:

- mediana: **2**;
- family >= 2: **7/8**;
- totale: **17**;
- gate congelato: **PASS**.

Il singolo caso sotto soglia è:

`FAME000040`

Classificazione verificata durante la review:

`UPSTREAM_SOURCE_SEPARATION_CONTAMINATION`

Root-cause layer:

`source-separation`

`transcriptionRootCause=false`

Il reviewer ha chiarito che nello stem bass sono già presenti residui tonali del lead che occupano la stessa regione dell'808; tali componenti vengono quindi riportati nel MIDI dal trascrittore. Il caso resta un development regression case per la separazione.

### Basic Pitch

`basic-pitch-0.4.0-lowend-v1`:

- mediana: **0**;
- family >= 2: **0/8**;
- totale: **0**;
- gate: **FAIL**.

Per questo blocco e questa configurazione Basic Pitch non viene promosso. Il risultato è limitato al cohort, ai parametri e al renderer congelati; non costituisce una conclusione generale sulla qualità di Basic Pitch.

---

## Confronto con la ricerca esterna

### pYIN: l'assunzione monofonica è coerente con il nostro uso e spiega il limite di FAME000040

Mauch e Dixon descrivono pYIN come estensione probabilistica di YIN per la stima della fondamentale F0, con candidati probabilistici e tracking HMM/Viterbi. L'uso tipico è il tracking di una fondamentale monofonica. La documentazione librosa espone infatti `pyin` come stimatore F0 con voiced flag e voiced probability.

Fonti:

- Mauch, M.; Dixon, S. — *pYIN: A Fundamental Frequency Estimator Using Probabilistic Threshold Distributions*, ICASSP 2014: https://webspace.eecs.qmul.ac.uk/s.e.dixon/pub/2014/MauchDixon-PYIN-ICASSP2014.pdf
- librosa — `librosa.pyin`: https://librosa.org/doc/0.11.0/generated/librosa.pyin.html

Conclusione per FAME: pYIN resta una scelta coerente quando il bass stem è prevalentemente monofonico. `FAME000040` non dimostra che pYIN abbia inventato pitch assenti dall'input: lo stem viola l'assunzione operativa perché contiene materiale tonale estraneo all'808.

### Basic Pitch: il negative result FAME non contraddice le capacità dichiarate del modello

Basic Pitch è progettato come trascrittore polyphonic/instrument-agnostic, produce note MIDI e pitch bend e la documentazione ufficiale specifica che funziona meglio su un solo strumento alla volta.

Fonte ufficiale:

- Spotify — Basic Pitch repository: https://github.com/spotify/basic-pitch

La nostra prova ha comunque prodotto 0/8 family sopra soglia. Quindi Basic Pitch viene escluso **dal percorso low-end corrente di FAME**, senza generalizzare il risultato ad altri strumenti, dataset o configurazioni.

Non viene aperto un nuovo tuning Basic Pitch sugli stessi 8 development dopo aver osservato il risultato: farlo trasformerebbe ulteriormente il cohort in materiale di tuning e indebolirebbe il valore di una futura valutazione indipendente.

### Source separation: contamination/bleeding è un failure mode noto

La letteratura Demucs mostra che anche sistemi source-separation forti possono mantenere bleeding/contamination. Hybrid Demucs e HT Demucs migliorano le metriche e la qualità soggettiva, ma la separazione non va trattata come ground truth perfetta.

Fonti:

- Défossez et al. — *Music Source Separation in the Waveform Domain*: https://arxiv.org/abs/1911.13254
- Défossez — *Hybrid Spectrogram and Waveform Source Separation*: https://arxiv.org/abs/2111.03600
- Rouard, Massa, Défossez — *Hybrid Transformers for Music Source Separation*: https://arxiv.org/abs/2211.08553

Conclusione per FAME: `FAME000040` viene mantenuta come regressione del front-end source-separation. Non si applica una correzione pitch post-hoc nel trascrittore per nascondere contaminazione upstream.

### Drums: separazione e detection restano una strategia tecnicamente plausibile

La letteratura ADT tratta detection e classificazione drum come problema MIR difficile; il survey 2018 documenta approcci diversi e failure mode ancora aperti. Lavori più recenti continuano a esplorare source separation come front-end o ausilio alla drum transcription, quindi la nostra scelta di usare informazione sia dallo stem drums sia dal bass per il kick è coerente con una direzione di ricerca plausibile.

Fonti:

- Wu et al. — *A Review of Automatic Drum Transcription*, IEEE/ACM TASLP 2018: https://doi.org/10.1109/TASLP.2018.2830113
- Hsu et al. — *Separate-and-Detect: Unified Drum Transcription and Stem Generation via Latent Diffusion*, 2026: https://arxiv.org/abs/2608.01093

Questo non promuove la nostra euristica a stato dell'arte. Il risultato FAME resta quello misurato: PASS minimo 6/8, con due family sotto soglia.

---

## Assunzioni di apertura: cosa è stato confermato o falsificato

### Confermato

1. **Drums-only non era sufficiente come ipotesi unica.**
   La Human QA ha selezionato la fusion drums+bass.

2. **Il kick può migrare nel bass stem e l'evidenza cross-stem è utile.**
   Il failure mode osservato in Source Separation ha motivato correttamente il secondo arm.

3. **pYIN era una baseline low-end sensata per stem bass prevalentemente monofonici.**
   Ha superato il gate finale e battuto Basic Pitch sul cohort.

4. **Technical validity e musical usefulness dovevano restare gate separati.**
   Tutti gli artefatti possono essere tecnicamente validi pur ricevendo score umani bassi.

5. **Il contour low-end andava preservato.**
   È rimasto disponibile come diagnostica e non è stato schiacciato nel solo note MIDI.

### Falsificato o non supportato

1. **Basic Pitch non ha portato un miglioramento sul cohort FAME corrente.**
   0/8 family >=2.

2. **Il PASS development non significa robustezza.**
   Drums ha due family sotto soglia; low-end una.

3. **Uno stem separato non può essere trattato come ground truth perfetto.**
   `FAME000040` mostra contaminazione tonale upstream.

4. **Il ramo tonal non può essere aperto per analogia.**
   Le osservazioni precedenti sullo stem `other` restano insufficienti per promuovere tonal Audio→MIDI.

---

## Limiti della prova

Il blocco development usa:

- 8 composition family;
- un reviewer principale;
- materiale già usato per selezionare e confrontare ipotesi;
- soglie congelate che permettono PASS con 6/8 family >=2.

Quindi il risultato dimostra:

- fattibilità tecnica;
- utilità development sufficiente secondo il gate;
- scelta relativa fra gli arm provati.

Non dimostra:

- generalizzazione alle 131 sorgenti;
- performance production;
- readiness di training;
- assenza di failure mode su nuovi beat;
- superiorità universale di pYIN o della kick fusion.

---

## Decisione di chiusura

Stato del blocco:

`AUDIO_TO_MIDI_DRUMS_LOW_END_DEVELOPMENT_CLOSED`

Artefatto selezionato:

`audio-to-midi-selected-integration-v1-001`

Selezioni congelate per la prossima valutazione:

- drums: `drums-bass-kick-fusion-v1`;
- low-end: `librosa-pyin-lowend-v1`.

Basic Pitch viene mantenuto come negative result storico e non come arm attivo.

`FAME000040` resta regression case Source Separation.

`FAME000023` e `FAME000080` restano weak/failure cases drums development senza attribuzione causale ulteriore non verificata.

---

## Conseguenza per il prossimo gate

Le 10 family `evaluation-holdout` congelate l'11 settembre sono già state utilizzate nel percorso finale di **Audio Analysis**. In base a NDR-032, esempi già ascoltati/usati per decisioni non costituiscono da soli un nuovo final test indipendente per un diverso blocco.

Per Audio→MIDI il prossimo passo corretto è quindi:

`PREPARE_FRESH_AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_PROTOCOL_NO_AUDIO_ACCESS`

su composition family ancora non assegnate, prima di osservare nuovi output.

Vincoli del prossimo protocollo:

- cohort distinto dagli 8 development;
- cohort distinto dalle 10 family già consumate nel final holdout Audio Analysis;
- selezione/freeze prima di audio/output review;
- pipeline completamente congelata: Source Separation + drums fusion + pYIN;
- nessun retuning sugli esempi evaluation;
- criteri, numerosità e regola di decisione congelati prima dell'esecuzione;
- training e batch131 ancora chiusi fino al nuovo gate.

La numerosità del nuovo evaluation cohort non viene scelta post-hoc in questo documento: va motivata e congelata nel protocollo successivo.

---

## Stato finale della chiusura

- development Audio→MIDI drums/low-end: **CLOSED**;
- selected integration: **VERIFIED**;
- Basic Pitch: **NOT SELECTED**;
- tonal Audio→MIDI: **CLOSED / NOT OPENED**;
- final independent Audio→MIDI evaluation: **NOT YET PREPARED**;
- batch 131: **NOT AUTHORIZED**;
- training: **NOT AUTHORIZED**;
- task-data readiness: **FALSE**.
