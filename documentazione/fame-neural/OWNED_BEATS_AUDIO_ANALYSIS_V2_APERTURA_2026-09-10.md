# Owned Beats — Audio Analysis V2 — Apertura

Data: 10 settembre 2026
Stato: APERTO — protocollo di confronto congelato (`FROZEN_PRE_TUNING`); tuning V2 non ancora avviato

## Scopo

Migliorare la baseline owned-beats-audio-analysis-v1 usando esclusivamente le 8 composition family development.
I 10 record evaluation-holdout restano esclusi da tuning, scelta parametri e confronto tra varianti.

La V2 riguarda ancora AUDIO ANALYSIS. Non esegue Source Separation, Audio→MIDI, validazione task-ready o training.

## Problemi osservati nella V1

- decoding, hash, durata e pipeline tecnica funzionano;
- BPM e beat grid sono promettenti ma non ancora validati contro riferimento umano;
- stabilityScore non è discriminante: vale 1.0 su tutti gli 8 development;
- meter è solo una candidatura e richiede verifica;
- section detection appare troppo conservativa: diversi beat lunghi hanno prodotto zero boundaries;
- nessun risultato V1 viene trattato come ground truth.

## Domanda della V2

Possiamo ottenere una descrizione temporale del beat abbastanza affidabile da diventare input stabile per la successiva Source Separation e trascrizione, senza adattare il sistema agli evaluation-holdout?

## Alternative da confrontare

Per beat/tempo la V1 resta baseline. La V2 deve confrontare almeno una variante alternativa, ad esempio tempo locale/dinamico o PLP, invece di modificare la baseline senza confronto.

Per section boundaries deve essere confrontato almeno un metodo alternativo alla semplice beat-feature-change-v1.

## Criteri di valutazione congelati

### 1. Integrità tecnica

- identità/hash sorgente corretti;
- decode completo senza errori;
- durata coerente con il file tecnico;
- nessun risultato promosso se il processing tecnico fallisce.

### 2. Tempo / BPM

- confronto con riferimento umano quando disponibile;
- registrazione esplicita delle ambiguità half-time / double-time;
- separare correttezza del BPM principale dalla presenza della risposta corretta tra i candidati alternativi.

### 3. Beat grid

- confronto degli onset dei beat con riferimento controllato;
- precision, recall e F1 o metriche beat equivalenti standard;
- errore temporale dei beat;
- controllo di drift e perdite locali, non solo media globale.

### 4. Meter

- confronto del candidato 3/4, 4/4, 6/8 con giudizio/riferimento umano;
- confidence o score non viene interpretato automaticamente come probabilità di correttezza;
- casi ambigui restano CANDIDATE_ONLY.

### 5. Section boundaries

- annotare e valutare cambi strutturali osservabili senza obbligo iniziale di etichette verse/hook;
- precision, recall e F1 delle boundaries;
- deviazione temporale dalla boundary di riferimento;
- distinguere under-segmentation e over-segmentation.

### 6. Errori e incertezza

- registrare falsi positivi e omissioni;
- controllare anche porzioni non segnalate dal sistema;
- nessun flag di confidence viene assunto come prova di correttezza.

### 7. Costo di correzione

- quando la review lo consente, registrare quanto intervento umano serve per rendere utilizzabile il risultato;
- una soluzione leggermente migliore nelle metriche ma molto più costosa da correggere non viene automaticamente preferita.

## Regole del confronto

- tuning solo sugli 8 development;
- evaluation-holdout intatto fino al congelamento della pipeline candidata;
- stessa sorgente e stesso protocollo per confrontare V1 e V2;
- risultati negativi e failure mode vengono conservati;
- nessuna soglia universale inventata in anticipo;
- la pipeline candidata viene congelata prima della prima valutazione sugli holdout.

## Ordine operativo

V1 baseline
→ implementazione V2 sui development
→ confronto e review
→ congelamento configurazione candidata
→ singola valutazione separata sui 10 evaluation-holdout
→ decisione
→ Source Separation
---

## Protocollo freeze operativo — Blocco C

**Stato protocollo:** `FROZEN_PRE_TUNING`
**Fonte machine-readable:** `frontend/strumenti/fame-neural-composer/owned-beats/audio-analysis-v2-protocol.json`

Questo blocco completa i criteri già fissati sopra senza modificare V1 o introdurre tuning. Le soglie sotto sono soglie operative del pilot FAME, salvo i valori esplicitamente ricavati dalle metriche `mir_eval`; non diventano soglie universali di qualità musicale.

### Reference umane e campionamento

Per ogni composition family valutata, V1 e V2 usano **la stessa identica reference**.

Per beat grid:

- campionamento `3 x 12 s` per family: tre finestre da 12 secondi (`EARLY`, `MIDDLE`, `LATE`);
- margine di 5 secondi da inizio/fine;
- selezione deterministica dalla durata decodificata: inizio a 5 s, finestra centrale centrata sul brano, ultima finestra a `durata - 5 s - 12 s`;
- le tre finestre sono non sovrapposte quando la durata è almeno 46 s;
- sotto 46 s si usa l'intera traccia come reference beat, marcando il fallback;
- la reference registra il livello metrico percepito, così half-time e double-time non vengono assorbiti silenziosamente nel punteggio.

Per section boundaries:

- reference sull'intera traccia;
- nella V2 iniziale si annotano le boundary interne, senza obbligo di etichette `verse/hook/...`;
- start e fine brano non contano come boundary strutturali interne;
- stessa annotazione per V1 e V2.

Il development usa le 8 composition family già congelate. Le 10 `evaluation-holdout` non vengono aperte, annotate per il tuning, analizzate o usate per scegliere varianti fino al freeze della candidata V2.

### Metriche congelate

Beat grid:

- metrica primaria: F-measure con finestra di matching 70 ms;
- secondarie: Cemgil con sigma 40 ms, CMLc/CMLt/AMLc/AMLt e errore temporale assoluto mediano/p95;
- il punteggio al livello metrico corretto resta distinto dalle metriche che tollerano livelli metrici alternativi.

BPM:

- si registra l'errore relativo e si classifica l'output come `EXACT_METRIC_LEVEL`, `HALF_TIME`, `DOUBLE_TIME`, `OTHER` o `UNKNOWN`;
- tolleranza di classificazione FAME: 3%;
- half-time/double-time può essere informazione utile ma **non vale come BPM esatto**.

Section boundaries:

- metrica primaria: precision/recall/F1 con finestra 0,5 s;
- confronto a 3 s solo come diagnostico permissivo;
- registrare anche deviazione, falsi positivi e omissioni.

I 70 ms del beat F-measure, i 40 ms di Cemgil e la finestra primaria di 0,5 s per le boundary corrispondono ai default/documentazione di `mir_eval`. Il confronto a 3 s è mantenuto solo come seconda lettura permissiva. Campionamento, tolleranza BPM e regole di decisione restano scelte operative FAME congelate per questo pilot.

### Budget di tuning

Sono consentite al massimo **8 configurazioni candidate V2** sui soli development. V1 non conta nel budget.

Ogni candidata deve avere identità riproducibile almeno tramite:

- `candidateId`;
- commit del codice;
- hash configurazione;
- hash del dependency lock.

I risultati sono append-only: una candidata negativa non viene cancellata o riscritta.

Early stop: il tuning può chiudersi prima di 8 candidate quando una configurazione produce un `V2_WINS` completo, con reference/review richieste disponibili. Raggiunte 8 candidate senza `V2_WINS`, il blocco termina senza aprire gli holdout.

### Regola V1 / V2 sul development

Il confronto è paired per `compositionFamilyId` e usa la mediana dei delta `V2 - V1`.

Soglie operative del pilot:

- beat F1 @70 ms: miglioramento materiale `>= +0,03`; non-inferiority `>= -0,02`;
- section F1 @0,5 s: miglioramento materiale `>= +0,05`; non-inferiority `>= -0,03`.

Esiti:

- `V2_WINS`: integrità tecnica PASS, tutte le metriche target disponibili non inferiori, almeno una materialmente migliore, reference richieste complete e nessun veto del costo di review;
- `V1_WINS`: failure di integrità tecnica oppure almeno una metrica target rompe la non-inferiority;
- `INCONCLUSIVE`: ogni altro caso. Un risultato misto o incompleto **non forza un vincitore**.

Se il costo umano è misurabile su almeno 6/8 family development, un aumento mediano superiore al 25% dei secondi di review per minuto audio impedisce la vittoria automatica V2 e porta il caso a `INCONCLUSIVE`. Se il costo non è disponibile, viene marcato mancante e non viene inventato come tie-break.

Solo `V2_WINS` autorizza il freeze della candidata e l'apertura del confronto finale sugli holdout.

### Freeze e holdout

Prima di osservare gli holdout viene creato un freeze immutabile contenente almeno:

- `candidateId`;
- commit;
- hash configurazione;
- hash dependency lock;
- digest del riepilogo development;
- timestamp di freeze.

Sugli holdout si eseguono **una sola volta** V1 baseline e la candidata V2 congelata con lo stesso protocollo. La regola di confronto resta la stessa:

- `V2_WINS` → `V2_PROMOTE`;
- `V1_WINS` → `KEEP_V1`;
- `INCONCLUSIVE` → `INCONCLUSIVE_GENERALIZATION`.

Dopo aver visto i risultati holdout è vietato ritoccare la V2 e rieseguire lo stesso test come se fosse ancora indipendente. Qualsiasi retuning trasforma quelle family in evidenza già osservata: per una nuova dichiarazione finale serve un **nuovo holdout di composition family mai usate**.

### Vincoli invariati

- V1 resta baseline intatta.
- Nessun risultato V1/V2 diventa ground truth per il solo fatto di essere prodotto dallo strumento.
- Meter resta `CANDIDATE_ONLY/UNKNOWN` finché non viene validato da reference umana.
- Questo freeze non autorizza Source Separation, Audio→MIDI, `TASK_DATA_READY` o training.
- Il prossimo strumento può raccogliere le reference umane, ma deve leggere questo JSON invece di duplicarne i parametri.
