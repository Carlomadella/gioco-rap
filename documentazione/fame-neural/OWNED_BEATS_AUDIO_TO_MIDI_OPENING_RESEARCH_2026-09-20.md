# Owned Beats — Audio→MIDI drums/low-end — ricerca di apertura — 20/09/2026

## Stato di partenza verificato

Il blocco Source Separation development è chiuso con outcome:

`OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT`

Evidenza congelata:

- Source Separation inference: 8/8 family development;
- technical QA: 8/8 family, 32/32 stem;
- Human Review: drums median 2.5, 8/8 >=2; bass median 2.5, 7/8 >=2;
- tonal/other non promosso;
- final holdout, batch 131 e training restano esclusi.

Failure mode da portare nel nuovo blocco:

- in `FAME000023`, `FAME000046` e `FAME000058` il kick è stato percepito assente dal drums e presente nel bass;
- il prossimo trascrittore kick non può assumere che tutta l'evidenza utile viva nello stem drums.

## Domanda del blocco

Possiamo ricavare dai soli stem development congelati una rappresentazione simbolica sufficientemente utile per:

1. eventi drum almeno `kick / snare / hi-hat`, con timing e velocity;
2. eventi low-end con onset, pitch, durata e informazione sufficiente a non perdere completamente glide/contour;
3. successiva proiezione nella Drum View / nelle viste task-specifiche senza dichiarare ground truth ciò che è soltanto trascrizione stimata?

## Vincoli

- nessun accesso al final holdout;
- nessuna espansione alle 131 sorgenti;
- nessun training;
- nessun modello/checkpoint con diritto commerciale non verificato;
- environment separato per dipendenze incompatibili;
- criteri e arm del pilot congelati prima del primo output;
- input autonomo: non usare la Human Reference come dato di trascrizione.

## Ricerca strumenti — drums

### Baseline FAME: onset multibanda su stem separati

Scelta come **baseline primaria autorizzata**.

Motivi:

- usa `librosa==1.0.0`, già presente e congelata nel venv Audio Analysis;
- niente checkpoint neurale esterno;
- licenza librosa ISC;
- può confrontare direttamente due ipotesi richieste dai nostri failure mode:
  - `DRUMS_ONLY`: kick/snare/hat dal solo stem drums;
  - `DRUMS_BASS_KICK_FUSION`: snare/hat dal drums, kick con evidenza aggiuntiva dal bass;
- produce una baseline trasparente e falsificabile prima di introdurre modelli più pesanti.

Limite: classificazione coarse e basata su onset/spettro; non va scambiata per una soluzione neurale finale.

### ADTOF

Repository osservata: `MZehren/ADTOF`, commit `b3968fb332f69b65ee07c089fc62f436503755db`.

Punto forte: sistema dedicato Automatic Drum Transcription con modelli già addestrati.

Blocco: il repository dichiara CC BY-NC-SA 4.0. Per un gioco commerciale non viene autorizzato come dipendenza del pilot prodotto senza un permesso separato.

**Stato: ESCLUSO DAL PERCORSO COMMERCIALE CORRENTE.**

### madmom / modelli collegati

Il codice madmom è BSD, ma i model/data files sono CC BY-NC-SA 4.0.

**Stato: MODELLI PRETRAINED NON AUTORIZZATI PER IL PERCORSO COMMERCIALE.**

### Omnizart drum

Repository osservata: `Music-and-Culture-Technology-Lab/omnizart`, commit `bcd8cb44d4da66ce87df10b6abee5c35a8cc2886`.

Il codice è MIT e il tool espone drum transcription, ma il README richiede checkpoint scaricati separatamente. Al 20/09/2026 è presente una issue aperta sulla licenza/provenienza del checkpoint drum; il README segnala inoltre bug noti nel training drum from-scratch.

**Stato: BLOCCATO FINCHÉ LA LICENZA DEL CHECKPOINT NON È ESPLICITA.**

### MT3

Repository osservata: `magenta/mt3`, commit `6bc4cfc749b7c746bcf2f72e4063158db83cc51c`.

Il codice è Apache-2.0 e MT3 è un trascrittore multitraccia, ma al 20/09/2026 esiste una issue aperta che chiede esplicitamente chiarimento sulla licenza commerciale del checkpoint esterno `gs://mt3/checkpoints/mt3/`.

**Stato: BLOCCATO FINCHÉ I PESI NON HANNO LICENZA COMMERCIALE VERIFICATA.**

### Magenta Onsets & Frames drums

Il repository Magenta storico è archiviato/inattivo e indirizza al lavoro MT3 corrente. Rimane utile come riferimento tecnico, non come nuova dipendenza primaria.

**Stato: RIFERIMENTO, NON CANDIDATA PRIMARIA.**

## Ricerca strumenti — low-end

### librosa pYIN

Scelta come **baseline primaria autorizzata**.

Motivi:

- `librosa.pyin` stima F0 + voiced flag + voiced probability;
- pYIN è adatto a sorgenti con una fondamentale monofonica chiara;
- lo stem `bass` separato è precisamente il contesto in cui questa ipotesi è sensata;
- nessun modello esterno;
- licenza ISC;
- environment già congelato: Python 3.14 + `librosa==1.0.0`.

Limite: note segmentation e glide devono essere costruiti sopra il contour; distorsione e kick leakage possono produrre errori.

### Spotify Basic Pitch

Repository osservata: `spotify/basic-pitch`, commit `fa5997af0a8210982619003269994a1be25eddf3`; package corrente osservato `0.4.0`.

Punti forti:

- audio→MIDI note-level;
- supporto multipitch e pitch bends;
- documentazione ufficiale: funziona meglio su un solo strumento alla volta;
- il nostro stem bass separato è quindi un input coerente;
- licenza repository Apache-2.0 e saved models inclusi nel package/repository.

Vincolo ambiente:

- il package dichiara supporto Python 3.8–3.11;
- il nostro venv Audio Analysis è Python 3.14;
- non va installato dentro il venv esistente.

**Stato: CANDIDATA UFFICIALE LOW-END, MA ESECUZIONE BLOCCATA FINCHÉ NON ESISTE UN VENV DEDICATO CON LOCK E HASH DEL MODELLO.**

### TorchCrepe

Repository osservata: `maxrmorrison/torchcrepe`, commit `19e2ec3d494c0797a5ff2a11408ec5838fba6681`.

Punti forti:

- pitch tracker continuo;
- licenza MIT;
- utile per glide/contour e come diagnostica alternativa a pYIN.

Limite: non produce da solo note MIDI complete; richiede segmentation/post-processing.

**Stato: BACKUP/DIAGNOSTICA, non primo arm del pilot.**

## Scelta per il pilot

### Drums

Eseguire due arm FAME sulla stessa coppia di stem:

1. `drums-only-spectral-onset-v1`
2. `drums-bass-kick-fusion-v1`

Entrambi condividono snare/hat dal drums. Differiscono solo per la sorgente del kick.

Questo isola esattamente il failure mode osservato durante la Human Review.

### Low-end

Primo arm:

1. `librosa-pyin-lowend-v1`

Secondo arm congelato ma non ancora eseguibile:

2. `basic-pitch-0.4.0-lowend-v1`

Prima di eseguire Basic Pitch servono environment receipt, exact lock e hash del modello.

## Output del baseline

Per ogni family development:

- JSON append-only con eventi e diagnostica;
- MIDI drums-only;
- MIDI drums+bass kick fusion;
- MIDI bass pYIN;
- contour F0 low-end conservato nel JSON;
- BPM usato per la timeline MIDI preso dall'output **stimato** della `audio-analysis-v2-config-001` promossa, non dalla Human Reference.

## Human QA congelata prima dell'output

Scala 0–3:

- 0 = inutilizzabile;
- 1 = debole / correzione sostanziale;
- 2 = utilizzabile nel pilot con correzione moderata;
- 3 = forte / direttamente utile.

Drums:

- kick retention e falsi kick;
- snare/hat retention e confusione classe;
- timing;
- downstream Drum View usefulness.

Low-end:

- onset;
- pitch / octave correctness percepita;
- durata/release;
- glide/contour preservation;
- downstream MIDI usefulness.

Gate minimo per un arm selezionato:

- mediana usefulness >= 2;
- almeno 6/8 family >= 2;
- technical QA 8/8.

Il gate apre soltanto la fase successiva di QA/integrazione; **non dichiara TASK DATA READY e non autorizza training**.

## Prossimo passo

1. congelare `audio-to-midi-development-protocol-v1.json`;
2. implementare baseline FAME drums + pYIN;
3. test sintetici/CI;
4. preflight locale no-transcription;
5. solo dopo il PASS del preflight, prima esecuzione sui 8 development.
