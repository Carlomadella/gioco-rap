# FAME Neural — audit tecnico integrato 12/09/2026

Data: 12 settembre 2026  
Base repository verificata: `feature/fame-neural-roadmap` @ `00c459e3c87291850ac534cba8c231026a6ee07b`  
Tipo intervento: **documentazione/stato operativo soltanto**  
Codice modificato: **NO**  
Holdout osservato: **NO**  
Reservation holdout creata: **NO**  
Training autorizzato/avviato: **NO**

## Scopo

Questo checkpoint integra nel progetto i nuovi riscontri dell'audit tecnico approfondito del 12/09/2026 senza riscrivere o rimuovere il lavoro precedente.

I risultati development di Audio Analysis restano quelli già documentati: `audio-analysis-v2-config-001` è `V2_WINS` sul development, il candidate freeze resta valido e il vero holdout non è stato osservato.

L'audit introduce però un nuovo blocco prioritario **prima** della valutazione holdout finale.

## Riscontri integrati

### R1 — ALTA / BLOCCANTE PRIMA DELL'HOLDOUT

Il gate attuale seleziona le 10 family `evaluation-holdout` dal manifest corrente e controlla conteggio, unicità per family e overlap storico delle `compositionFamilyId`.

Non esiste però ancora nel gate un'identità indipendente e immutabile del cohort holdout originale congelato pre-tuning.

In particolare, lo stato corrente non lega il gate a una tuple-set congelata del tipo:

`compositionFamilyId / sourceRecordId / sourceAssetId / sha256`

e la reservation registra soltanto le family ID.

Conseguenze da prevenire:

- sostituzione accidentale di una delle 10 family nel manifest corrente;
- alias/ridenominazione di family che aggiri il registro degli utilizzi;
- riuso dello stesso asset sotto identità family differente;
- duplicazione dello stesso SHA tra development e holdout con ID diversi.

**Vincolo operativo nuovo:** non creare la reservation reale e non aprire alcun audio holdout finché l'identità originale pre-tuning non è stata recuperata/provata e collegata al gate tramite digest/snapshot metadata-only.

### R2 — MEDIA / DRUM VIEW

`dataset/drum-view-v2.js::resolveWindow()` calcola inizialmente il metro chiamando `stableMeterForWindow(sourceFidelity, 0, Number.MAX_SAFE_INTEGER)`.

Questo rende di fatto necessario un metro stabile sull'intera sorgente prima ancora di validare la sola finestra richiesta.

Effetto: una finestra interamente 4/4 può essere rifiutata se esiste un cambio di metro successivo alla fine della finestra.

**Azione:** correggere la risoluzione del metro per la finestra richiesta e aggiungere regressioni per cambi prima, dentro e dopo la window. La modifica va fatta prima di espandere Drum View a sorgenti con metri variabili.

### R3 — MEDIA / SEMANTICA TRAINING READY

`dataset/task-admissibility.js::readinessForTask()` considera `taskReady = allowed > 0` e, per i task di training, propaga direttamente quel valore in `trainingReady`.

Quindi `trainingReady` oggi significa soltanto che esiste almeno un elemento ammesso, non che il dataset sia pronto al training.

Non verifica, tra le altre cose:

- split;
- volume;
- diversità;
- leakage;
- gate musicale aggregato;
- sufficienza del corpus.

**Azione:** separare chiaramente disponibilità di elementi esportabili da readiness del dataset. Nessuna apertura del training deriva da questo fix.

### R4 — DEBITO STORICO / MICROTRAIN PHASE 5

`phase5/microtrain.py::train_one()` costruisce `TokenCodec` / `CompoundCodec` da `records["all"]`, mentre i batch di ottimizzazione usano `records["train"]`.

Questo significa che validation/test possono influenzare vocabolario/cardinalità del preprocessing, pur non essendo prova di training sui loro target.

**Azione:** prima di riusare quel microbenchmark per nuove conclusioni, usare vocabolario fisso oppure fit solo su train con gestione esplicita degli elementi non osservati. I risultati storici restano preservati e non vanno reinterpretati retroattivamente.

### R5 — MEDIA OPERATIVA / DOCUMENTAZIONE STORICA

`CURRENT_STATE.md` contiene ancora, nelle sezioni storiche più in basso, un “Prossimo intervento ufficiale” che descrive la baseline V1 come ancora da congelare/eseguire prima del tuning V2.

Questa istruzione è ormai superata dallo stato corrente del 12/09/2026.

**Regola da questo checkpoint:** le sezioni storiche restano nel documento per continuità, ma l'addendum operativo più recente e i checkpoint del 12/09 prevalgono come istruzione corrente.

Non vengono cancellati o riscritti i blocchi storici in questo intervento.

### R6 — GAP IMPLEMENTATIVO / PERCORSO HOLDOUT FINALE

Il gate introdotto con `audio-analysis-holdout-gate.py` copre preflight metadata-only e reservation, ma non costituisce ancora l'intera valutazione finale.

Il percorso completo deve ancora collegare in modo coerente:

- identità del cohort holdout congelato;
- unica reservation one-shot;
- Human Reference holdout cieca;
- scoring V1;
- scoring `audio-analysis-v2-config-001`;
- paired comparison finale;
- decisione secondo il protocollo già congelato.

Il vecchio percorso holdout non deve essere riutilizzato se non applica esattamente il candidate config-001 congelato.

## Stato che NON cambia

Questo audit non annulla né riapre quanto già chiuso:

- `audio-analysis-v2-config-001`: **V2_WINS sul development**;
- correction-cost review development: **completata**;
- candidate freeze: **verificato**;
- candidate/config/protocol: **immutati**;
- config-002: **non aperta**;
- holdout reale: **non osservato**;
- training serio: **chiuso**;
- `DRUM DATA READY V2`: **non superato**;
- Source Separation: **da fare**;
- Audio→MIDI: **da fare**;
- 7D: **ancora aperta**.

## Ordine operativo aggiornato

1. Recuperare e provare l'identità originale delle 10 family holdout pre-tuning.
2. Hardening R1: snapshot/digest delle tuple di identità, controllo asset duplicate cross-split e reservation asset-aware.
3. Completare l'intero percorso holdout config-001 con fixture sintetiche, senza consumare il set reale.
4. Solo dopo: singola reservation reale + Human Reference cieca + scoring V1/config-001 + confronto finale.
5. Correggere R2 e R3 prima che quei sistemi vengano usati per espansione/readiness.
6. Proseguire 7D e audit diversità del pilot separatamente dall'holdout.
7. Affrontare R4 prima di riusare il microbenchmark storico per nuove decisioni.

## Nota CI e perimetro

L'audit del 12/09 riporta CI Neural verde sul commit auditato e una failure della CI generale del gioco su due controlli esterni allo scope Neural.

Questo checkpoint non attribuisce tali failure a FAME Neural e non modifica sistemi fuori perimetro.

## Prossimo intervento

**R1 — recupero/validazione dell'identità originale del cohort holdout e hardening metadata-only del gate.**

Fino alla chiusura di R1:

- niente reservation reale;
- niente apertura/decodifica/ascolto del vero holdout;
- niente Human Reference holdout reale;
- niente scoring finale.
