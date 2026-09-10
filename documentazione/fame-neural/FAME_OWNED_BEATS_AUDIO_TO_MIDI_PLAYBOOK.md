# FAME Neural — Owned Beats Audio→MIDI Playbook

**Stato:** documento operativo vivo  
**Data iniziale:** 10 settembre 2026  
**Progetto:** FAME Neural Composer / Anni di Fame  
**Scopo:** fonte unica per la conversione dei beat audio proprietari in materiale simbolico utilizzabile da FAME Neural.  
**Collocazione:** documento tecnico standalone in `documentazione/fame-neural/`; non modifica, estende o vincola la roadmap ufficiale finché una decisione non viene esplicitamente recepita altrove.  

> Questo documento va aggiornato ogni volta che una nuova conversione produce una regola, un failure mode, una correzione o una decisione utile. Le conclusioni superate non vanno cancellate: vanno marcate come falsificate/sostituite, con la nuova regola accanto.

---

## 1. Perché esiste questo documento

Durante il primo esperimento serio di conversione audio→MIDI abbiamo verificato che una parte importante delle informazioni musicali di un beat prodotto può essere recuperata con una fedeltà utile a FAME, soprattutto per batteria e low-end.

Il problema è che il processo ha richiesto più iterazioni e ha fatto emergere diverse regole che sarebbe facile perdere tra una chat e l'altra: allineamento kick↔808, ritardo del pitch tracker, falsi crash dovuti agli open hat, distinzione tra errore simbolico ed errore di rendering, colpi low-end mancanti rilevati all'ascolto, sincronizzazione snare↔808 e altre correzioni.

Da ora in avanti questo file è il **punto di partenza obbligatorio** per ogni nuova conversione dei beat proprietari. Prima di modificare la pipeline bisogna controllare qui cosa è già stato scoperto.

---

## 2. Corpus proprietario disponibile

### 2.1 Sorgente

Cartella Dropbox:

`/STUFF BY @inarteless`

Inventario verificato il 10 settembre 2026:

- **131 beat audio**;
- formati presenti: principalmente `.mp3` e `.wav`;
- dimensione complessiva della cartella: circa **1,47 GB**;
- naming prevalente: `(BEAT) <titolo> @inarteless`;
- alcuni file riportano anche collaboratori/co-producer nel nome.

### 2.2 Provenienza dichiarata

Il proprietario del progetto conferma che i beat della cartella sono **autoprodotti** e costituiscono quindi una sorgente proprietaria centrale per FAME Neural.

Per i file che riportano collaboratori/co-producer, il loro nome va mantenuto nei metadata di provenance. Non bisogna cancellare o normalizzare via questa informazione.

### 2.3 Ruolo strategico

Questo corpus non va trattato come una semplice sorgente di drum loop.

Ogni beat contiene potenzialmente:

- batteria completa;
- kick;
- 808 / bass;
- hi-hat chiusi e aperti;
- snare / clap / rim / percussioni;
- armonia;
- melodie;
- lead;
- arpeggi e counter-melody;
- texture/FX musicali;
- cambi di densità;
- transizioni;
- relazioni reali tra le parti;
- struttura e arrangiamento complessivo.

La proprietà più importante è proprio la **correlazione interna tra i ruoli musicali**: drums, 808, armonia e melodia sono parti dello stesso arrangiamento umano, non elementi indipendenti assemblati artificialmente.

Per questo `fame-owned-beats-v1` deve essere considerato un candidato a **corpus proprietario centrale di specializzazione Trap/Rap/Urban**, con uso progressivo nelle fasi Drum, 808, Tonal e Full Arrangement.

---

## 3. Relazione con la roadmap FAME Neural

La roadmap V2 ha già falsificato l'idea che il vecchio corpus misto da 502 phrase fosse automaticamente un corpus musicale pronto per il Neural.

La Fase 7 è un **TASK DATA RESET**: ogni sorgente viene usata per ciò che sa realmente insegnare.

Ruoli attuali/proposti:

- **GMD** → `GENERAL_HUMAN_GROOVE_PRETRAIN`;
- **fame-owned-beats-v1** → `PRIMARY_TRAP_RAP_OWNED_SPECIALIZATION`;
- **HH-TRP** → sorgente Trap drum complementare/candidate secondaria, non più unica candidata primaria;
- **PDMX** → general symbolic / harmony / arrangement con selezione quality-aware;
- **NRG-CP** → materiale tonale/armonico generale;
- **fame-original-seed-v1** → debug/grammar, non target musicale.

### 3.1 Regola importante

I 131 beat devono entrare **adesso nell'architettura dati**, ma non devono essere dichiarati `TASK DATA READY` solo perché esistono.

Stato iniziale corretto:

`RAW_AUDIO`

Poi, progressivamente:

`RAW_AUDIO → STEMMED → TRANSCRIBED → VALIDATED → TASK_DATA_READY`

È accettabile che il corpus cresca a blocchi, ad esempio:

`131 RAW → 5/10 VALIDATED → 30 → 60 → 131`

La conversione completa dei beat può procedere progressivamente. Questo playbook non modifica autonomamente la roadmap né lo stato delle sue fasi.

---

## 4. Obiettivo della pipeline

Trasformare ciascun beat proprietario in una serie di rappresentazioni simboliche tracciabili, senza perdere il legame con l'audio originale.

Pipeline concettuale:

```text
DROPBOX RAW AUDIO
        ↓
SOURCE MANIFEST / HASH / PROVENANCE
        ↓
AUDIO ANALYSIS
(BPM, durata, meter, sezioni candidate)
        ↓
SOURCE SEPARATION
        ↓
┌──────────────┬──────────────┬──────────────┐
│              │              │              │
DRUMS          BASS           OTHER/TONAL    VOCALS*
│              │              │
↓              ↓              ↓
DRUM VIEW      KICK + 808     HARMONY / MELODY
│              │              │
└──────────────┴───────┬──────┘
                       ↓
             CROSS-TRACK ALIGNMENT
                       ↓
              SYMBOLIC BEAT VIEW
                       ↓
               SEGMENT / TASK VIEWS
                       ↓
                HUMAN + AUTO QA
                       ↓
                  FAME CORPUS
```

`*` Per i beat strumentali lo stem vocals può essere vuoto o contenere falsi positivi; non va assunto come informazione utile.

---

## 5. Primo esperimento tecnico: cosa è stato verificato

### 5.1 Nota sulla sorgente del test

Il primo esperimento dettagliato è stato eseguito su un beat di test esterno denominato:

`Luh-Tyler-Blue-Bill-Bandit-Instrumental-Prod.-By-614ASE-Yakree.mp3`

Questo file ha avuto **solo funzione tecnica di prototipo** e non va confuso con il corpus proprietario `fame-owned-beats-v1`.

Le regole tecniche emerse dal test sono invece riutilizzabili e costituiscono il punto di partenza per i 131 beat proprietari.

### 5.2 Separazione stems verificata

Configurazione usata con successo:

- Audacity 3.7.1 64-bit;
- OpenVINO AI Plugins v3.7.1-R4.2;
- Music Separation 4-stem.

Stems ottenuti:

- `Drums`;
- `Bass`;
- `Vocals`;
- `Other`.

Osservazione importante:

- lo stem **Bass** ha contenuto sia componente armonica dell'808 sia attacchi/percussività del kick;
- lo stem **Drums** ha contenuto bene snare, hats e percussion;
- questa separazione è risultata sufficientemente pulita per costruire un prototipo di trascrizione simbolica credibile.

La tecnologia di separazione non è congelata per sempre: potrà essere sostituita se una soluzione futura fornisce stems più puliti. Le regole musicali emerse restano comunque valide fino a nuova evidenza.

---

## 6. Regole confermate — Low-end / Kick / 808

### 6.1 Il pitch tracker non determina da solo l'onset dell'808

**Problema osservato:** il pitch tracker armonico rilevava correttamente il pitch dell'808 ma entrava in ritardo rispetto all'attacco musicale reale.

Nel prototipo il ritardo osservato era spesso nell'ordine di circa 74–180 ms, con media intorno a 130 ms.

**Conclusione:** usare direttamente il primo frame del pitch tracker come onset dell'808 produce una linea bass corretta come altezza ma musicalmente fuori fase.

### 6.2 Regola kick↔808

Quando l'audio indica che kick e 808 appartengono allo stesso attacco musicale:

**l'onset simbolico dell'808 deve essere ancorato all'onset del kick.**

Nel prototipo:

- prima della correzione: zero attacchi kick/808 perfettamente coincidenti;
- dopo la correzione: 66 kick + 66 808 con start match esatto;
- l'ascolto risultante è stato giudicato quasi sovrapponibile all'originale anche a livello di pitch.

### 6.3 Il pitch resta derivato dalla componente armonica

L'ancoraggio temporale al kick **non significa copiare il pitch dal kick**.

Separare i due problemi:

- **timing/onset** → attacco percussivo / kick;
- **pitch** → componente armonica / bass stem.

### 6.4 Non assumere che ogni kick abbia sempre un 808

La regola di sync si applica quando l'evidenza audio indica che i due eventi coincidono musicalmente.

La pipeline futura deve poter rappresentare anche:

- kick senza 808;
- 808 senza kick;
- 808 legata attraverso più kick;
- retrigger;
- slide/glide;
- note low-end consecutive con pitch diverso.

### 6.5 Colpi low-end mancanti

Nel prototipo un vero evento intorno a `78.985 s` era stato omesso dalla prima trascrizione automatica.

L'ascolto umano ha individuato il buco; l'analisi locale ha poi confermato il movimento di pitch:

`26 → 31 → 26`

Regola:

**la pipeline deve avere un controllo specifico per sospetti “buchi” low-end**, soprattutto in aree dove l'energia dello stem suggerisce un attacco ma nessun evento MIDI è stato generato.

---

## 7. Regole confermate — Snare e relazioni con il low-end

### 7.1 Gli snare musicalmente coincidenti vanno sincronizzati

Nel prototipo sono stati trovati **11 snare** entro 17,5 ms da un attacco 808. Il successivo evento più vicino era già oltre ~150 ms, quindi il cluster era chiaramente distinto.

Per quegli eventi è stato corretto lo start simbolico a coincidenza esatta con l'808, preservando la velocity dello snare.

Regola:

**quando snare/clap e low-end appartengono chiaramente allo stesso evento metrico, la rappresentazione simbolica deve preservarne la simultaneità esatta o il micro-offset reale, non introdurre jitter derivato dal detector.**

### 7.2 Non quantizzare ciecamente tutto

La coincidenza va verificata musicalmente. Non bisogna trasformare ogni evento vicino in un evento perfettamente allineato se il microtiming originale è intenzionale.

---

## 8. Regole confermate — Hi-hat, crash e articolazioni

### 8.1 Failure mode: open hat scambiati per crash

Nel prototipo una famiglia di **59 eventi** era stata classificata come crash a causa del decay lungo e della brillantezza del rendering.

L'ascolto dell'originale ha chiarito che:

- i crash reali erano **0**;
- quegli eventi erano **open hi-hat**;
- gli open hat accompagnavano i closed hat a volume simile;
- il loro carattere era più scuro/filtrato rispetto a un classico GM Open Hi-Hat.

### 8.2 Nuova regola

**Decay lungo ≠ crash.**

La classificazione deve considerare almeno:

- ruolo ritmico;
- posizione metrica;
- pattern circostante;
- relazione con closed hats;
- banda spettrale;
- decay;
- presenza/assenza di comportamento tipico da crash.

### 8.3 Conservare articolazione separata dal semplice MIDI note number

Per FAME è utile poter mantenere metadata come:

```text
role = OPEN_HAT
articulation = long_decay
brightness = low / filtered_dark
```

La resa timbrica verrà poi gestita dal renderer.

### 8.4 Non correggere un errore di timbro corrompendo il simbolico

Nel rendering General MIDI, un open HH corretto può suonare troppo brillante e “crash-like”.

Questo **non significa** che la nota simbolica debba essere riclassificata come closed hat o abbassata artificialmente di velocity.

Regola fondamentale:

**se il ruolo simbolico è corretto ma il sample/renderer suona male, correggere il renderer — non falsificare il dato musicale.**

---

## 9. Regole confermate — Velocity e dinamica

### 9.1 Normalizzazione per famiglia

La velocity non deve essere stimata con una normalizzazione globale del beat.

Per esempio, gli hi-hat vanno valutati rispetto alla distribuzione energetica degli altri hi-hat, non rispetto a kick e 808.

Regola:

**velocity estimation role-specific / family-specific.**

### 9.2 Non appiattire dinamiche reali

Nel test, due snare vicini mostravano una differenza dinamica evidente anche nell'audio originale. La seconda velocity più alta era quindi corretta.

Regola:

**prima di “uniformare” due hit perché sembrano strani nel MIDI, verificare se la differenza è realmente presente nell'audio.**

---

## 10. Regole confermate — Timing, microtiming e simultaneità

La trascrizione deve conservare:

- onset reale;
- posizione metrica;
- offset rispetto alla griglia;
- simultaneità tra voci;
- microtiming intenzionale;
- hit multipli nella stessa lane/frame;
- fill e variation senza comprimerli in un pattern medio.

La griglia può essere utile come riferimento, ma **non deve diventare una quantizzazione distruttiva**.

Per le Task View future va mantenuto il collegamento tra:

`source audio → detected event → corrected event → symbolic event → task segment`

---

## 11. Distinguere sempre trascrizione e rendering

Una delle lezioni più importanti del prototipo è che due errori diversi possono sembrare uguali all'ascolto.

### Errore di trascrizione

Esempi:

- colpo mancante;
- ruolo sbagliato;
- pitch 808 sbagliato;
- onset sbagliato;
- simultaneità persa;
- crash inventato.

### Errore di rendering

Esempi:

- open hat GM troppo brillante;
- sample di snare diverso dall'originale;
- 808 sintetizzata con envelope diverso;
- timbro kick non equivalente.

**Regola:** prima di modificare il MIDI chiedersi sempre se il problema è nel dato simbolico o nel suono usato per ascoltarlo.

---

## 12. Parte tonale/melodica — non ancora validata, ma prioritaria

Finora il prototipo ha validato soprattutto:

- drums;
- kick;
- 808/low-end;
- percussion/hats.

I 131 beat proprietari contengono però anche il materiale tonale necessario a FAME.

Target futuri:

- `TONAL_HARMONY`;
- `TONAL_MELODY`;
- `LEAD`;
- `COUNTER_MELODY`;
- `ARP`;
- `PAD/TEXTURE` quando musicalmente utile;
- harmonic rhythm;
- motif recurrence;
- relazioni melody↔harmony↔808;
- transizioni e cambi di sezione.

### 12.1 Failure mode atteso

Lo stem `Other` può contenere più strumenti sovrapposti. La trascrizione polifonica potrebbe quindi essere meno affidabile di quella drums/808.

Possibili strategie da confrontare, non ancora congelate:

- separazione ulteriore dello stem `Other`;
- multi-instrument source separation;
- trascrizione polifonica;
- melody extraction + chord inference separati;
- segmentazione per sezioni meno dense;
- ensemble di detector;
- review umana mirata ai casi a bassa confidence.

**Nessuna di queste è ancora una regola verificata.**

---

## 13. Full arrangement e struttura

Il valore dei beat proprietari non è limitato alle singole note.

Da ogni beat si devono tentare di estrarre anche:

- intro;
- verse;
- hook/drop;
- bridge/break;
- outro;
- cambi di strumenti attivi;
- repeat/variation;
- fill;
- transition;
- motif return;
- variazioni di densità;
- harmonic rhythm;
- pattern family;
- cambi di energia osservabili.

Questo materiale potrà diventare particolarmente utile per le future fasi Planner / Structural Plan / Full Arrangement, perché deriva da **forme realmente composte**, non da euristiche assemblate artificialmente.

---

## 14. Manifest minimo per `fame-owned-beats-v1`

Ogni beat deve avere almeno un record equivalente a:

```json
{
  "sourceBeatId": "owned-beat-0001",
  "sourceCollection": "fame-owned-beats-v1",
  "originalFileName": "(BEAT) Example @inarteless.wav",
  "sourceLocation": "dropbox:/STUFF BY @inarteless",
  "format": "wav",
  "audioSha256": "...",
  "durationSec": null,
  "bpm": null,
  "timeSignature": null,
  "producer": "@inarteless",
  "collaborators": [],
  "rightsStatus": "OWNER_DECLARED",
  "processingStatus": "RAW_AUDIO",
  "stems": {},
  "derivedViews": {},
  "qa": {},
  "notes": []
}
```

### 14.1 ID stabile

`sourceBeatId` non deve dipendere dal nome visualizzato del file: se il file viene rinominato, l'identità del beat deve restare la stessa.

### 14.2 Hash

L'hash dell'audio originale serve per:

- dedup;
- provenance;
- rilevare modifiche/sostituzioni;
- garantire che una trascrizione sia collegata alla versione corretta del file.

---

## 15. Stati di processing proposti

```text
RAW_AUDIO
ANALYZED
STEMMED
DRUM_TRANSCRIBED
LOWEND_TRANSCRIBED
TONAL_TRANSCRIBED
FULL_SYMBOLIC_DRAFT
NEEDS_REVIEW
VALIDATED
TASK_DATA_READY
EXCLUDED
```

Gli stati possono essere combinati tramite campi separati se un singolo enum si dimostra troppo rigido.

Esempio: un beat può essere `DRUM=VALIDATED` ma `TONAL=NEEDS_REVIEW`.

---

## 16. Workflow operativo per ogni nuovo beat

### Step 0 — Intake

Registrare:

- source ID;
- nome file;
- hash;
- formato;
- producer/collaboratori;
- provenienza;
- rights status;
- data/versione del file.

### Step 1 — Analisi audio

Estrarre/stimare:

- durata;
- BPM;
- time signature se possibile;
- loudness/energia utile al detector;
- sezioni candidate;
- eventuali cambi di tempo.

### Step 2 — Source separation

Generare almeno:

- drums;
- bass;
- other/tonal;
- vocals opzionale.

Conservare sempre gli stems generati o almeno hash/versione/parametri sufficienti a riprodurli.

### Step 3 — Drum transcription

Estrarre:

- kick;
- snare/clap/rim;
- closed hats;
- open hats;
- tom/percs;
- ride/crash solo quando realmente supportati;
- velocity;
- onset;
- duration/articulation quando utile;
- microtiming.

### Step 4 — Low-end transcription

Estrarre:

- onset;
- pitch;
- note duration;
- retrigger;
- glide/slide quando rilevabile;
- relazione kick↔808.

Applicare la regola di anchoring kick↔808 solo quando supportata dall'audio.

### Step 5 — Tonal transcription

Estrarre progressivamente:

- chord/harmony;
- melody;
- lead;
- counter-melody;
- altri ruoli tonalmente utili.

Mantenere confidence e non trasformare inferenze dubbie in ground truth.

### Step 6 — Cross-track alignment

Controllare almeno:

- kick↔808;
- snare↔low-end quando musicalmente coincidenti;
- 808↔harmony;
- melody↔harmony;
- simultaneità e relazioni di sezione.

### Step 7 — Automatic QA

Segnalare:

- buchi di energia senza eventi;
- eventi senza sufficiente supporto audio;
- pitch jumps sospetti;
- crash/open-hat ambiguity;
- timing outlier;
- eccessiva quantizzazione;
- collisioni impossibili;
- drop improvvisi di confidence;
- sezioni con transcription density anomala.

### Step 8 — Human QA

L'umano non deve necessariamente correggere ogni singola nota di 131 beat.

Strategia target:

- ascolto dei casi flagged;
- campionamento casuale anche tra i casi non flagged;
- confronto audio originale vs MIDI renderizzato;
- classificazione dell'errore: transcription vs renderer;
- eventuale correzione;
- registrazione della nuova regola in questo documento se generalizzabile.

### Step 9 — Segmentazione task-specifica

Solo dopo una trascrizione sufficientemente affidabile:

- 4-bar / 8-bar windows;
- drum-only task;
- drums→808 conditioning;
- tonal context;
- full/joint arrangement;
- structural targets.

Gli split devono restare **source-family safe**: segmenti e augmentations dello stesso beat non vanno distribuiti tra train/validation/test.

---

## 17. Batch strategy

Non convertire 131 beat manualmente uno per uno con la stessa procedura esplorativa del prototipo.

Strategia:

1. scegliere **5–10 beat diversi** per stress-test;
2. automatizzare il più possibile la pipeline;
3. correggere i failure mode comuni;
4. congelare una prima versione del converter;
5. lanciare il batch sugli altri beat;
6. produrre confidence/report automatici;
7. concentrare la review umana sui casi dubbi;
8. rivalutare periodicamente un campione dei casi classificati come “facili”.

Il lavoro principale deve diventare **migliorare il convertitore**, non ripetere 131 volte la stessa correzione manuale.

---

## 18. Segmentazione e scala: come interpretare i numeri

131 beat non equivalgono a 131 soli esempi di training.

Un singolo beat può generare:

- più ruoli;
- più sezioni;
- più finestre;
- più task view.

Con beat di alcuni minuti, il corpus può produrre migliaia di finestre da 8 barre e molte migliaia di esempi task-specifici.

Tuttavia va sempre registrato il numero reale di **source families**.

Regola:

**100.000 training examples derivati da 131 beat restano 131 famiglie sorgente, non 100.000 composizioni indipendenti.**

L'augmentation non deve falsificare la diversità reale del corpus.

---

## 19. Augmentation: permessa ma source-aware

Possibili trasformazioni future:

### Tonale

- transposition;
- octave shift controllato;
- velocity variation;
- microtiming controllato;
- crop/offset;
- segmentation con overlap.

### Drums

Non trasporre il pitch come se fosse materiale melodico.

Usare eventualmente:

- velocity variation;
- microtiming variation;
- hat density variation;
- fill variation;
- ghost notes;
- role-preserving substitutions.

Ogni augmentation deve mantenere:

`parentSourceBeatId`

ed entrare nello **stesso split del beat originale**.

---

## 20. Metriche minime da registrare per conversione

Per ogni beat/ruolo, quando tecnicamente possibile:

- numero eventi;
- onset confidence;
- pitch confidence;
- velocity confidence;
- timing residual rispetto a detector/audio;
- percentuale eventi corretti automaticamente;
- eventi aggiunti/rimossi manualmente;
- eventi riallineati;
- ruolo ambiguo;
- sezioni flagged;
- human verdict;
- renderer usato per il controllo;
- versione converter.

Per il low-end aggiungere:

- kick count;
- 808 count;
- kick↔808 exact/coincident rate;
- orphan kick;
- orphan 808;
- pitch discontinuity warnings;
- suspected missing attacks.

Per drums aggiungere:

- snare count;
- closed/open hat count;
- crash count;
- multi-hit count;
- suspicious long-tail events;
- snare↔low-end coincidence.

---

## 21. Cosa NON fare

1. Non usare il primo frame del pitch tracker come onset 808 senza verifica.
2. Non forzare ogni kick ad avere un 808.
3. Non classificare decay lungo = crash.
4. Non correggere un timbro GM brutto modificando dati simbolici corretti.
5. Non normalizzare tutte le velocity contro un'unica scala globale.
6. Non quantizzare via il microtiming per comodità.
7. Non perdere il collegamento sourceBeat→stem→evento→segmento.
8. Non distribuire segmenti dello stesso beat tra train/val/test.
9. Non chiamare `TASK_DATA_READY` una trascrizione solo perché il MIDI è tecnicamente valido.
10. Non cancellare failure e vecchie assunzioni dal documento: conservarle come storico.
11. Non considerare l'augmentation come nuova diversità sorgente.
12. Non separare i ruoli fino a perdere le loro relazioni musicali.

---

## 22. Decisioni correnti

### D-001 — Corpus proprietario centrale

**DECISIONE:** i 131 beat della cartella `STUFF BY @inarteless` vengono trattati come nuova sorgente proprietaria centrale candidata per la specializzazione FAME Trap/Rap.

### D-002 — Audio originale fuori dal repository Git

**DECISIONE:** gli audio originali non devono essere copiati in massa nel repository Git. Nel progetto entrano manifest, metadata, pipeline, report e artefatti simbolici appropriati. L'audio può restare su storage dedicato/Dropbox con provenance tracciata.

### D-003 — GMD non viene buttato

**DECISIONE:** GMD continua ad avere senso come corpus di groove umano generale. Non viene però scambiato per corpus Trap completo.

### D-004 — HH-TRP come confronto/complemento nel playbook

**IPOTESI OPERATIVA DEL PLAYBOOK:** con l'esistenza di `fame-owned-beats-v1`, HH-TRP può essere trattato qui come sorgente complementare per scala e diversità drum-specifica. Questo documento, da solo, non modifica la priorità ufficiale definita dalla roadmap.

### D-005 — Stessa sorgente, più task

**DECISIONE:** lo stesso beat può alimentare Drum, 808, Tonal, Joint/Full Arrangement e Structural task, ma solo tramite viste/versioni separate e tracciabili.

---

## 23. Regole congelate dal primo prototipo

Queste regole restano operative fino a quando un nuovo test non le falsifica:

- onset 808 può richiedere anchoring al kick;
- pitch 808 e timing 808 vanno stimati da evidenze diverse;
- kick↔808 coincidenti devono preservare l'attacco comune;
- snare↔low-end chiaramente coincidenti devono preservare la simultaneità;
- open HH long-tail non vanno promossi automaticamente a crash;
- velocity va stimata per famiglia/ruolo;
- microtiming reale va conservato;
- gli errori di renderer non vanno “corretti” falsificando il MIDI;
- human listening resta necessario per il gate musicale;
- buchi low-end reali possono sfuggire ai detector e devono essere cercati con QA dedicato;
- provenance e source identity devono sopravvivere a ogni derivazione.

---

## 24. Questioni ancora aperte

- Qual è il miglior separatore per processare in batch i 131 beat?
- Quanto bene possiamo separare melody/harmony/lead dallo stem `Other`?
- Quale trascrittore polifonico è più affidabile sul nostro dominio?
- Come rilevare automaticamente 808 slide/glide?
- Come distinguere clap/snare/rim in mix difficili?
- Come stimare section boundaries con sufficiente affidabilità?
- Quale confidence threshold minimizza la review manuale senza perdere errori importanti?
- Quanto generalizzano le regole del primo prototipo sui beat proprietari?
- Quanto materiale realmente utile otteniamo per ciascun task dopo il QA?
- Quale percentuale dei 131 beat può arrivare a `TASK_DATA_READY` senza editing manuale pesante?

---

## 25. Registro scoperte conversioni

Ogni nuova scoperta va aggiunta qui usando questo formato.

```text
ID: C-XXX
Data:
SourceBeatId:
Converter version:

ASSUNZIONE / PROBLEMA
...

EVIDENZA
...

TEST / CORREZIONE
...

RISULTATO
...

CLASSIFICAZIONE
VERIFICATO | SUPPORTATO | IPOTESI | FALSIFICATO | APERTO

NUOVA REGOLA
...

IMPATTO SULLA PIPELINE
...
```

### C-001 — Pitch tracker 808 ritardato

**Classificazione:** VERIFICATO nel primo prototipo.  
**Nuova regola:** onset e pitch dell'808 non vengono stimati dallo stesso segnale/feature per forza; quando il kick coincide, l'onset può essere ancorato all'attacco percussivo.

### C-002 — Kick↔808 sync

**Classificazione:** VERIFICATO nel primo prototipo.  
**Risultato:** 66/66 coppie nel caso test portate a start match esatto con forte miglioramento percettivo.

### C-003 — Long-tail hats falsamente classificati crash

**Classificazione:** VERIFICATO nel primo prototipo.  
**Risultato:** 59 eventi riclassificati; crash reali nel riferimento = 0.

### C-004 — Timbro GM ≠ errore simbolico

**Classificazione:** VERIFICATO.  
**Nuova regola:** separare sempre role correctness da renderer/sample correctness.

### C-005 — Evento low-end mancante

**Classificazione:** VERIFICATO nel primo prototipo.  
**Evidenza:** evento reale ~78.985 s inizialmente omesso e recuperato dopo ascolto/analisi locale.  
**Nuova regola:** introdurre missing-event QA sul low-end.

### C-006 — Snare↔808 coincidence

**Classificazione:** VERIFICATO nel primo prototipo.  
**Evidenza:** 11 snare entro 17,5 ms dagli attacchi 808; sincronizzati senza alterare la velocity.  
**Nuova regola:** preservare simultaneità cross-role quando l'evidenza musicale è chiara.

---

## 26. Versioni/artefatti del primo prototipo

Storico utile per non perdere la sequenza degli esperimenti:

- `FAME_Blue_Bill_Bandit_lowend_v1.mid`
- `FAME_Blue_Bill_Bandit_drums_v1.mid`
- `FAME_Blue_Bill_Bandit_combined_v1.mid`
- `FAME_Blue_Bill_Bandit_drums_v3_timing_velocity.mid`
- `FAME_Blue_Bill_Bandit_combined_v3.mid`
- `FAME_Blue_Bill_Bandit_lowend_v2_kick_808_synced.mid`
- `FAME_Blue_Bill_Bandit_combined_v5_kick_808_synced.mid`
- `FAME_Blue_Bill_Bandit_drums_v6_snare_hat_fix.mid`
- `FAME_Blue_Bill_Bandit_combined_v6.mid`
- `FAME_Blue_Bill_Bandit_snare_audit.mid`
- `FAME_Blue_Bill_Bandit_combined_v7_snare_808_sync.mid`
- `FAME_Blue_Bill_Bandit_drums_v7_snare_808_sync.mid`
- `FAME_Blue_Bill_Bandit_lowend_v3_missing_808_fixed.mid`
- `FAME_Blue_Bill_Bandit_combined_v8_missing_808_fixed.mid`
- `FAME_Blue_Bill_Bandit_drums_v9_open_hats_no_crash.mid`
- `FAME_Blue_Bill_Bandit_combined_v9_open_hats_no_crash.mid`

**Baseline percettiva corrente del prototipo:** V9 percussion + low-end V3 / combined V9.

Questi file sono storico di sviluppo, non training corpus proprietario.

---

## 27. Criterio di successo della pipeline

La pipeline non è “finita” quando produce un `.mid` valido.

Deve arrivare al punto in cui:

1. il batch processa beat diversi senza interventi manuali specifici per ciascun file;
2. la maggioranza degli errori seri viene intercettata dal QA automatico;
3. la review umana si concentra su eccezioni, non su ogni nota;
4. groove e timing restano credibili;
5. 808 e drums mantengono la relazione musicale originale;
6. le viste tonali conservano abbastanza informazione da essere utili ai Performer;
7. le relazioni cross-track non vengono distrutte dalla separazione in task;
8. gli output possono essere segmentati senza leakage tra source families;
9. ogni evento/segmento mantiene provenance riproducibile;
10. il materiale supera un gate umano di musicalità e rappabilità coerente con il task.

---

## 28. Prossimo passo operativo consigliato

Prima di convertire l'intera cartella:

1. registrare formalmente `fame-owned-beats-v1` nel progetto;
2. creare manifest dei 131 audio con ID stabile, hash e metadata minimi;
3. selezionare 5–10 beat volutamente diversi tra loro;
4. applicare la pipeline usando le regole congelate sopra;
5. misurare quanti interventi manuali restano necessari;
6. aggiornare questo playbook con ogni failure mode nuovo;
7. solo dopo lanciare la conversione in batch del corpus completo.

---

# Changelog del documento

## 2026-09-10 — v0.1

Creato il playbook iniziale. Integrati:

- inventario dei 131 beat proprietari;
- ruolo strategico del corpus;
- relazione con Fase 7 / GMD / HH-TRP;
- pipeline audio→MIDI;
- tutte le principali scoperte del primo prototipo low-end/drums;
- regole kick↔808;
- regole snare↔808;
- open-hat vs crash;
- velocity e microtiming;
- distinzione transcription/renderer;
- piano per tonal/full arrangement;
- manifest e processing states;
- batch strategy;
- protocollo di aggiornamento continuo.

