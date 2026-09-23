# Owned Beats — Audio→MIDI independent evaluation — gate failure e failure analysis — 22/09/2026

## Stato del blocco

La prima evaluation indipendente della pipeline Audio→MIDI congelata è completata sul cohort fresco da 12 composition family.

Pipeline valutata, senza retuning:

- Source Separation: `intel-openvino-htdemucs-v4-97fc578`;
- drums: `drums-bass-kick-fusion-v1`;
- low-end: `librosa-pyin-lowend-v1`;
- Basic Pitch: escluso dalla evaluation;
- Human Reference: non usata come input di trascrizione.

Run:

- `audio-to-midi-independent-evaluation-v1-001`;
- cohort: `audio-to-midi-independent-evaluation-v1`;
- split: `audio-to-midi-evaluation-v1`;
- 12/12 family completate;
- cohort digest: `287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788`.

Il cohort è ora **osservato e consumato**. Può essere usato per failure analysis e regression evidence, ma non può essere riutilizzato come nuova evaluation indipendente dopo modifiche alla pipeline.

---

## Technical QA

Il technical QA read-only è passato prima della Human QA:

- gate: `ALL_12_FAMILIES_PASS`;
- 12/12 result verificati;
- 48/48 stem verificati;
- 24/24 MIDI verificati;
- identità e SHA coerenti con cohort/receipt congelati;
- PPQ, canali MIDI, conteggi eventi/note e integrità degli artefatti verificati;
- evaluation source audio non aperto dal comando QA;
- nessun retuning;
- Basic Pitch non eseguito;
- batch 131 non acceduto;
- training non autorizzato.

Il PASS tecnico certifica integrità e coerenza degli output, **non qualità musicale**.

---

## Blind Human QA

Review:

- `audio-to-midi-independent-evaluation-human-review-v1-001`;
- 12/12 campioni;
- family identity nascosta durante la review;
- selected-arm identity nascosta durante la review;
- package digest SHA256: `89068a44edb87ddf772c2f9dc0a513ded8c414afd4ea1d52147199c9daf0dec3`;
- submission digest SHA256: `aa21f8d777b1f37aed72d236853af317a2c13a59e4bfcf70922f4ba6132765c8`.

Gate congelato prima dell'ascolto:

- drums: mediana usefulness >= 2 e almeno 9/12 family >= 2;
- low-end: mediana usefulness >= 2 e almeno 9/12 family >= 2;
- gate complessivo: entrambi i rami devono passare.

### Esito drums

`drums-bass-kick-fusion-v1`:

- mediana: **2**;
- family >= 2: **8/12**;
- totale: **18**;
- gate: **FAIL**.

Family sotto soglia:

- `FAME000001`: 1;
- `FAME000101`: 1;
- `FAME000073`: 0;
- `FAME000102`: 0.

### Esito low-end

`librosa-pyin-lowend-v1`:

- mediana: **3**;
- family >= 2: **10/12**;
- totale: **28**;
- gate: **PASS**.

Family sotto soglia:

- `FAME000001`: 1;
- `FAME000071`: 0.

### Outcome complessivo

`KEEP_BATCH_CLOSED_REVIEW_FAILURES`

Quindi:

- batch 131: **NON AUTORIZZATO**;
- training: **NON AUTORIZZATO**;
- task-data readiness: **FALSE**;
- retuning sul cohort evaluation: **VIETATO**.

---

## Note complete del reviewer

Le note sotto sono normalizzate solo nell'ortografia per leggibilità; il significato non viene reinterpretato.

| Blind | Source record | Drums | Nota drums | Low-end | Nota low-end |
|---|---|---:|---|---:|---|
| S01 | `FAME000020` | 2 | Pro: inserisce kick anche quando nello stem non è chiaro; per la maggior parte del pezzo è quasi sovrapponibile. Contro: qualche kick è inventato, qualche hat si perde, sporadica confusione clap/hat/kick. | 3 | Buono; un po' debole, probabilmente per il renderer MIDI. |
| S02 | `FAME000001` | 1 | Tiene un buon ritmo in alcuni tratti; tra circa 0:30–0:50 perde totalmente il ritmo e mancano diversi kick. | 1 | Release molto ridotto rispetto all'originale; note molto più corte. |
| S03 | `FAME000010` | 2 | Recupera il kick anche se non presente nello stem e il ritmo è buono per gran parte della traccia; verso 0:32–0:33 inserisce eventi non coerenti. | 3 | Ottimo; nessun difetto riscontrato. |
| S04 | `FAME000121` | 2 | Tempo, snare e hat abbastanza coerenti ma da correggere; kick non coerente: circa 0:35 il kick nello stem parte in 4/4 mentre nel MIDI segue praticamente il rim. | 2 | Coerente; forse da rivedere qualche glide. |
| S05 | `FAME000101` | 1 | Ritmo coerente e kick buono; usa però quasi solo hat e non mette snare/clap. | 2 | Da rivedere glide e pitch. |
| S06 | `FAME000092` | 2 | Hat quasi perfetti e MIDI ritmicamente molto coerente, soprattutto da 1:10 alla fine; snare/clap spesso sostituiti con hat e diversi kick 4/4 non riconosciuti. | 3 | Buono; nulla da segnalare. |
| S07 | `FAME000129` | 2 | Hat buoni, qualche snare riconosciuto e ritmo ok; mancano moltissimi kick, snare imprecisi sostituiti da hat o non rilevati. | 3 | Coerente, ma low-end praticamente non presente nello stem. |
| S08 | `FAME000073` | 0 | Stem difficile; MIDI complessivamente errato. | 3 | Buono; nulla di particolare da segnalare. |
| S09 | `FAME000102` | 0 | Incoerente con lo stem; mancano diversi snare, kick, hat e clap; triplet degli hat non rilevata. | 2 | Pitch da rivedere. |
| S10 | `FAME000006` | 2 | Timing e ritmo buoni, hat ok; kick e snare confusi lungo la traccia, soprattutto quando coincidono. | 3 | Coerente. |
| S11 | `FAME000071` | 2 | Hat ok e buon ritmo quasi ovunque; confonde kick con snare e a volte il kick manca. | 0 | Diversi silenzi di lunga durata sulle note alte dello stem. |
| S12 | `FAME000116` | 2 | Riconosce e usa correttamente il kick anche quando nello stem è poco udibile; non riconosce gli hat presenti nello stem e gli hat MIDI corrispondono agli snare dello stem. | 3 | Ottimo. |

---

## Failure analysis drums

### 1. Osservazione Human QA: eventi mancanti; origine da localizzare

Più note riportano eventi mancanti:

- kick mancanti in `FAME000001`, `FAME000092`, `FAME000129`, `FAME000102`, `FAME000071`;
- snare/hat/clap mancanti in `FAME000101`, `FAME000102`;
- triplet degli hat non rilevata in `FAME000102`;
- perdita complessiva del ritmo in una sezione di `FAME000001`;
- output complessivamente errato sullo stem difficile `FAME000073`.

Nel codice congelato gli onset vengono rilevati prima della classificazione tramite un unico detector generico `librosa.onset.onset_detect` con:

- sample rate 22050;
- hop length 256;
- `delta=0.15`;
- `waitFrames=1`.

**Interpretazione tecnica:** se un onset manca davvero dall'uscita del detector, il classificatore non può recuperarlo. Le note d'ascolto, però, non dimostrano da sole che il detector lo abbia perso: un colpo apparentemente assente può essere presente all'istante corretto con una classe errata, oppure essere degradato già nello stem. Occorre confrontare riferimento annotato, onset prima della classificazione ed eventi finali. Un hop vale circa 11,6 ms; questo valore e `waitFrames=1` non provano la causa delle terzine perse. Precision/recall per evento e per classe non sono state misurate in questo audit.

### 2. Pattern verificato dalla Human QA: confusione dei ruoli

Le note riportano ripetutamente:

- clap → hat/kick;
- snare/clap → hat;
- kick ↔ snare;
- rim associato al comportamento del kick;
- hat MIDI corrispondenti a snare dello stem;
- errori più evidenti quando kick e snare coincidono.

Nel codice congelato la tassonomia drums contiene soltanto:

- `kick`;
- `snare`;
- `hihat`.

Per ogni onset del drums stem `classify_drum_ratios()` restituisce **una sola classe**. `clap` e `rim` non esistono come classi esplicite; eventi simultanei non sono rappresentati come classificazione multi-label nello stesso onset.

La bass-kick fusion può aggiungere un kick separato a un evento del drums stem: il limite single-label riguarda il classificatore del singolo onset, non un divieto assoluto di simultaneità nell'output finale. Aggiungere nomi di classi non basta: occorrono rilevatori appropriati e un mapping esplicito di clap/rim, eventualmente raggruppati per un obiettivo dichiarato.

**Diagnosi:** la tassonomia a tre classi e la decisione single-label sono un limite strutturale verificato del baseline corrente. La corrispondenza con le confusioni udite è forte, ma non viene registrata come unica causa provata di ogni errore.

### 3. Kick fusion: ipotesi utile ma decisione ancora troppo grezza

La review riporta un beneficio percepito compatibile con l'evidenza cross-stem:

- `FAME000020`, `FAME000010`, `FAME000116`: il reviewer apprezza kick recuperati anche quando nello stem drums sono poco chiari o assenti.

Questo sostiene l'ipotesi originale che parte dell'informazione kick migri nel bass stem.

Sono però presenti anche:

- kick inventati;
- kick mancanti;
- kick non coerenti col pattern percepito.

Nel codice congelato il candidato kick dal bass usa una soglia spettrale locale:

- `bassLowRatioAtLeast = 0.45`;
- `bassNonLowRatioAtLeast = 0.15`;
- deduplica rispetto ai kick drums entro 0.05 s.

Non esiste in questo arm una conferma ritmica o multi-evidenza più ricca prima di promuovere il candidato a kick.

**Decisione:** conservare la fusion come ipotesi supportata. Il suo beneficio netto richiede un confronto controllato fusion attiva/disattiva su development, misurando kick recuperati e falsi positivi. Eventuali indizi ritmici non devono imporre pattern regolari o generare colpi senza evidenza audio: sincopi e variazioni possono essere corrette. Nessuna modifica della fusion congelata è introdotta qui.

---

## Failure analysis low-end

Il low-end ha superato l'evaluation indipendente e non viene riaperto come failure globale.

### `FAME000001` — release/note troppo corte

Osservazione reviewer:

- release ridotto;
- note molto più corte rispetto allo stem.

Il pYIN congelato usa:

- `voicedProbabilityAtLeast = 0.6`;
- `maximumGapFrames = 2`;
- hop 256 a 22050 Hz.

Due hop corrispondono a circa **23,2 ms**. Il codice chiude il segmento quando il numero di frame consecutivi non validi supera `maximumGapFrames`; il note-off è collocato al frame successivo all'ultimo frame valido. Aumentare la tolleranza può ricongiungere brevi interruzioni quando torna un pitch compatibile, ma **non prolunga automaticamente una coda senza nuovi frame validi**. Anche il cambio della nota quantizzata e il filtro di durata minima (60 ms) possono influire sui segmenti.

**Diagnosi:** il meccanismo di segmentazione/confidence è un candidato concreto da investigare. Non viene dichiarato root cause definitivo senza una misura dedicata sul contour.

### `FAME000071` — silenzi sulle note alte

Osservazione reviewer:

- lunghi silenzi sulle note alte dello stem.

Il pYIN congelato usa:

- `fmaxHz = 300`;
- `voicedProbabilityAtLeast = 0.6`.

Due ipotesi tecniche sono quindi compatibili con il failure:

1. la **fondamentale** utile supera il limite superiore di 300 Hz: la sola presenza di armoniche sopra 300 Hz non basta a dimostrarlo;
2. la voiced probability scende sotto 0.6 in quelle regioni.

**Stato:** causa non ancora verificata; le due ipotesi non sono esaustive. La voiced probability misura la presenza di una componente intonata, non certifica la correttezza del pitch o la sua appartenenza al basso. Il `pitchContour` persistito contiene soltanto i frame accettati (`voiced_flag`, F0 finita e probabilità >=0,6): dai punti mancanti non si ricostruiscono le stime/probabilità scartate. Per distinguere le cause serve diagnostica separata, con F0, flag e probabilità di tutti i frame e confronto con lo stem; eventuali nuove esecuzioni sui casi consumati sono solo analisi, senza tuning o nuova qualifica indipendente. Nessun aumento automatico di `fmax` o abbassamento indiscriminato della soglia è autorizzato.

---

## Limiti verificati della misura e del renderer — revisione 22/09/2026

Audit del codice al commit `99df90e55b744d1378de6c6e0a532f7cfe4056d2`. Questo controllo documentale non ha aperto gli audio né ricalcolato i digest degli artefatti sul workspace locale; voti, digest ed esiti sopra sono evidenze registrate, preservate senza modifiche.

`audio-to-midi-independent-evaluation-human-review.js` richiama `audio-to-midi-human-review.js`:

- `renderDrums(result.drums.events)`, `renderBassNotes(result.lowEnd.notes)` e `renderContour(result.lowEnd.pitchContour)` sintetizzano dai JSON; non rileggono i MIDI esportati;
- la durata deriva dall'ultimo evento/punto (+0,35 s drums, +0,1 s note basso, +0,05 s contour; minimo 1 s), non dalla durata dello stem reference;
- il basso usa attacco 10 ms e sfumatura finale 40 ms entro i confini della nota; il renderer contour non interpola gap superiori a 50 ms;
- la correzione full-duration di `basic-pitch-lowend-comparison-v2.js` non è automaticamente applicata a questa review indipendente.

Sono limiti implementativi accertati, **non una misura del loro effetto sui singoli voti**. Prima di attribuire release corta o assenze al trascrittore occorre separare confini delle note, frame scartati, renderer e MIDI esportato. Verificare il rendering con fixture note, garantire reference/candidato di uguale durata e controllare la corrispondenza eventi–MIDI; ogni correzione futura deve usare una nuova versione senza alterare gli artefatti congelati.

La reference d'ascolto è lo stem separato: il PASS low-end documenta l'esito di quel confronto, non dimostra il recupero completo del basso presente nel mix originale. Le carenze upstream richiedono una verifica distinta. Il gate storico e i punteggi restano invariati; nessuna promozione aggiuntiva è derivata da questo audit.

---

## Conclusioni del blocco

### Verificato

1. L'evaluation tecnica della pipeline congelata passa 12/12.
2. La Human QA indipendente fallisce il gate complessivo esclusivamente per il ramo drums.
3. Drums passa 8/12 contro requisito 9/12.
4. Low-end passa 10/12 con mediana 3.
5. Nei drums ricorrono sia eventi mancanti sia confusioni di ruolo.
6. Il classificatore corrente è single-label e supporta solo kick/snare/hihat.
7. Il reviewer segnala recuperi utili e falsi/mancati kick; il contributo causale e il beneficio netto della fusion non sono stati isolati con un confronto controllato.
8. I 12 record evaluation sono consumati e non possono essere riutilizzati come nuova prova indipendente dopo tuning.

### Supportato ma non ancora dimostrato come root cause completa

1. Separare il problema drums in:
   - onset detection/recall;
   - role classification;
   - kick-fusion decision.
2. Estendere o rivedere la rappresentazione delle classi per clap/rim e simultaneità.
3. Rivedere la segmentazione pYIN per release/gap sul caso `FAME000001`.
4. Verificare range/confidence pYIN sul caso `FAME000071`.

### Interpretazione non giustificata dai dati

L'interpretazione:

> “il drums arm è praticamente pronto perché manca un solo campione al gate”

non è supportata dalle note della review.

Il valore 8/12 è vicino alla soglia numerica, ma diversi casi con score 2 riportano ancora gli stessi failure mode di classificazione/recall. Il problema va quindi trattato come **sistematico da sviluppare**, non come semplice aggiustamento post-hoc della soglia.

---

## Decisione operativa

Stato:

`AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_FAILED_DRUMS_LOWEND_PASSED`

La pipeline corrente non viene promossa al batch 131.

Per il prossimo ciclo:

1. preservare `drums-bass-kick-fusion-v1` come baseline/regression reference;
2. sviluppare una nuova variante drums **fuori dal cohort evaluation**;
3. distinguere esplicitamente detection/recall, role classification e kick-fusion decision;
4. mantenere `librosa-pyin-lowend-v1` come arm low-end che ha superato questo gate, limitando gli interventi a hardening motivato e verificabile;
5. usare i 12 casi consumati come failure/regression evidence, mai come nuova independent evaluation;
6. prima della prossima evaluation congelare una nuova pipeline e selezionare un nuovo cohort fresco;
7. batch 131, training e task-data readiness restano chiusi fino a un nuovo gate indipendente.

## Proposta per il prossimo development — da valutare, non implementata

1. Verificare e versionare il renderer prima di nuovi confronti. Preservare integralmente la review consumata; un riascolto correttivo degli stessi casi non costituisce nuova evaluation indipendente.
2. Su development separato, annotare brevi passaggi con colpi simultanei, terzine, falsi kick e cambi timbrici. Misurare separatamente onset mancanti, errori di classe e contributo della separazione.
3. Confrontare la baseline con una candidata che ammetta attivazioni indipendenti/simultanee per strumento. Una possibilità documentata è NMF con template di colpi isolati e rilevamento degli attacchi per componente; template, mapping e parametri devono essere congelati prima del confronto. La robustezza su rap/trap/drill e timbri nuovi resta da dimostrare.
4. Valutare la fusion attiva/disattiva sugli stessi development, senza imporre regolarità ritmica come prova dell'esistenza di un kick.
5. Mantenere pYIN v1 come riferimento congelato. Studiare eventuali varianti di segmentazione/range solo dopo aver distinto renderer, F0, voicing e contaminazione dello stem; ogni variante deve essere rivalutata.
6. Congelare metodo, criteri e nuova pipeline prima di selezionare/usare un nuovo cohort indipendente. Le proposte non aprono training, batch 131 o task-data readiness.

La NMF è una candidata metodologica, non una soluzione già validata sul corpus. I modelli neurali dedicati sono un'altra famiglia da valutare. Il repository ADTOF consultato dichiara CC BY-NC-SA 4.0: non viene proposto come dipendenza già approvata per il prodotto; codice, pesi e dati richiedono verifica dei termini applicabili.

## Fonti della revisione

- Codice del progetto, commit [99df90e](https://github.com/Carlomadella/gioco-rap/tree/99df90e55b744d1378de6c6e0a532f7cfe4056d2/frontend/strumenti/fame-neural-composer/owned-beats): baseline, protocollo, executor e renderer della review.
- [librosa pYIN: F0, fmax, voiced flag e voiced probability](https://librosa.org/doc/0.10.2/generated/librosa.pyin.html). Riferimento semantico dell'API; la versione congelata del progetto è 1.0.0 e il comportamento qui descritto del wrapper è stato verificato nel codice del progetto.
- [Weyers et al., ISMIR 2025: Understanding Performance Limitations in Automatic Drum Transcription](https://ismir2025program.ismir.net/poster_130.html): sovrapposizione dei colpi e interferenze; non prova causale sui nostri record.
- [Wu et al., A Review of Automatic Drum Transcription, 2018 — materiali degli autori](https://www.audiolabs-erlangen.de/resources/MIR/2017-DrumTranscription-Survey): metodi NMF e reti ricorrenti.
- [ADTOF — repository degli autori](https://github.com/MZehren/ADTOF): modelli e dichiarazione di licenza, consultati il 22/09/2026.

