# Integrazione audit Neural — 13 settembre 2026

Base: `9e80a53e6be482f5bce279c4affe5ecb4c433817`, branch `feature/fame-neural-roadmap`.
Questa è manutenzione correttiva; non aggiunge fasi alla roadmap e non chiude il percorso holdout finale.

## Stato delle correzioni

| Riscontro | Integrazione | Stato |
|---|---|---|
| CI candidate freeze | Fixture con identità complete, cohort e digest; vecchia chiamata verificata come rifiutata | Test locale passa, CI remota da eseguire dopo push |
| Drum View | Controllo del metro sulla finestra, tick espliciti validati, `startBar` ambiguo respinto | Regressione dedicata passa |
| trainingReady | L'export non dichiara readiness del training; report esplicita il gate separato | Smoke passa |
| Microtraining storico | Codec fit sul solo train, validazione degli altri split prima dell'allocazione del modello; OOV causa errore esplicito | 4 test senza ML passano; benchmark non rieseguito |
| R1 storico legacy | Registrazioni prive di tuple complete o vuote bloccano sia preflight sia reservation | Regressione passa; nessuna migrazione automatica |
| UI cieca | Test unitario del renderer eseguito, aggiunta alla CI e percorso browser holdout con export JSON e persistenza | Unit passa; browser da verificare in CI |
| Analyzer legacy | Modalità evaluation-holdout respinta esplicitamente: non rappresenta config-001 | Nessun accesso al vero holdout |
| Documentazione | Audit conservato con la sua base; questo checkpoint prevale sulle istruzioni precedenti | Integrata |

## R1 corrente

La strategia corrente usa il nuovo cohort sostitutivo `audio-analysis-holdout-r1-v2`, split `evaluation-holdout-r1-v2`, riferimento `audio-analysis-holdout-cohort-r1-v2.json`.
Il vecchio cohort `evaluation-holdout` resta `PROVENANCE_INSUFFICIENT_DO_NOT_USE_AS_FINAL_HOLDOUT`.
Le nuove reservation verificano tuple complete e digest. Non cambiare il riferimento congelato per adattarlo al manifest.

Un registro legacy insufficiente deve essere riconciliato con evidenze delle identità e degli utilizzi. Non cancellare o inventare registrazioni per superare il blocco. In assenza delle evidenze, il blocco resta.
Il repository dichiara che il nuovo cohort è stato selezionato senza osservazione; questo aggiornamento non certifica indipendentemente lo storico reale del corpus.

## Attività ancora aperte

- R6: orchestrazione finale della reference umana, V1, config-001, scoring e paired comparison sotto la stessa reservation. Il comparator development non deve essere usato come valutazione holdout.
- Reference umana reale e verifica operativa del nuovo cohort: non eseguite qui.
- Gate aggregato per training: non implementato da `readinessForTask`; `trainingReady: false` impedisce la precedente promozione implicita.
- Nuovi risultati del benchmark microtraining: da produrre soltanto con il protocollo corretto; risultati precedenti non ricalcolati.

Nessuna conversione audio→MIDI, source separation, espansione batch o training è avviata da questa patch.

## Verifiche

50 suite locali passano. Un ulteriore test GMD reale non è eseguibile qui perché richiede `pwsh`.
Passano candidate freeze (2 test), holdout (14), codec train-only (4), regressione Drum View, smoke readiness e test del nuovo pack.
Il test del renderer verifica anche gli attributi HTML generati e le etichette cieche.
La nuova variante browser verifica navigazione, invalidazione review, timer, export JSON e persistenza; esecuzione locale non completata perché il download Chromium è andato in timeout. Non dichiarata verde.
La stack audio completa e FFmpeg del workspace operativo non sono stati rieseguiti. La CI dopo push resta il controllo necessario sugli step precedentemente saltati.

Audit di origine: [rapporto 13 settembre](AUDIT_TECNICO_FAME_NEURAL_2026-09-13.md).
