# Owned Beats — Audio Analysis V2 — Apertura

Data: 10 settembre 2026
Stato: APERTO — criteri congelati prima del tuning V2

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
