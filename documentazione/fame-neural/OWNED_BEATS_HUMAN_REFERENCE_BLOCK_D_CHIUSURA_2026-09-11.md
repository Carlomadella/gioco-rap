# Owned Beats — Human Reference Block D — Chiusura

Data: 11 settembre 2026

## Esito

**COMPLETATO NEL PROPRIO SCOPE.**

La Human Reference `development` per Audio Analysis è stata raccolta, corretta e infine riconfermata con il contratto di integrità introdotto dal commit `4bed0ffacc82402bbf1737b308d14cc87c950431`.

Reference definitiva per il confronto V1/V2:

`D:\FAME_NEURAL\references\audio-analysis-v2\development\audio-analysis-v2-dev-reference-precision-v2.json`

Submission digest SHA256:

`f63c37bf557a82e32c5a1c58b381501e043ff6e08832b7a3434742521521fa18`

Validazione ufficiale finale:

- 8/8 family attese;
- 8/8 review complete;
- 8/8 beat reference metricamente utilizzabili;
- 24/24 finestre con `coverage: COMPLETE`;
- `finalizationReady: true`;
- `candidateOutputsExposed: false`;
- split `development`;
- evaluation holdout non osservato.

## Continuità con precision-v1

La precedente snapshot `audio-analysis-v2-dev-reference-precision-v1.json` resta immutata come storico. Non viene cancellata né riscritta.

L'hardening successivo ha aggiunto campi operativi obbligatori (`coverage`, `rawTapTimesSeconds`, `quantizationHistory`) e invalidazione esplicita delle review quando cambiano marker o copertura. Per questo la precision-v1, pur contenendo il lavoro musicale già verificato, non risultava più finalization-ready sotto il contratto corrente.

È stato quindi creato un nuovo reviewId. Marker finali, BPM, livello metrico, meter e section boundaries già verificati sono stati trasferiti senza reinterpretazione. `rawTapTimesSeconds` e `quantizationHistory` non sono stati ricostruiti artificialmente: restano array vuoti dove lo storico non era disponibile. Tutte le 24 finestre sono state riascoltate e la loro copertura riconfermata.

## Cosa è stato annotato

Per ogni family:

- beat grid su `EARLY`, `MIDDLE`, `LATE`, 3 × 12 s secondo il protocollo congelato;
- livello metrico umano e BPM di riferimento;
- meter umano;
- section boundary interne sull'intera traccia;
- tempo di annotazione/reference creation;
- copertura esplicita dell'intera finestra beat.

La reference non usa output V1/V2 come ground truth.

## Failure mode e hardening emersi

Durante la raccolta/revisione sono stati corretti failure mode del tooling senza modificare il protocollo congelato:

- tap da tastiera reso armabile senza click preliminare;
- quantizzazione resa esplicita e facoltativa; il semplice riascolto non muta i marker;
- griglia human-tap stimata senza usare output V1/V2;
- preservati nudge e modifica manuale;
- impedita l'extrapolazione automatica nelle code silenziose;
- mantenuta la ricostruzione dei beat mancanti interni quando richiesta esplicitamente;
- copertura `PENDING | COMPLETE | NO_BEAT | AMBIGUOUS` resa esplicita e fail-closed;
- raw tap e storico quantizzazione conservati per i nuovi input, senza inventare lo storico pregresso;
- timer distinto dal costo di correzione V1/V2.

## Ricerca/verifica di chiusura

Il protocollo resta quello congelato prima del tuning. L'evaluator usa `mir_eval 0.8.2` per le metriche previste: Beat F-measure @70 ms, Cemgil sigma 40 ms, continuity CML/AML e section detection con boundary matching.

Riferimenti:

- https://mir-eval.readthedocs.io/latest/api/beat.html
- https://mir-eval.readthedocs.io/latest/api/segment.html
- https://github.com/mir-evaluation/mir_eval/releases

La finalizzazione della Human Reference certifica la disponibilità del riferimento umano per il development; non dimostra qualità generale dell'Audio Analysis e non autorizza l'holdout.

## Costi

`reviewCostSeconds` misura il costo storico di creazione/verifica della Human Reference. **Non** è il costo di correzione di V1 o V2. Il costo delle candidate viene misurato separatamente nel confronto paired e non viene ricostruito retroattivamente.

## Stato dopo Block D

- Human Reference development: **FINALIZZATA post-hardening**;
- precision-v1: **PRESERVATA COME STORICO**;
- Audio Analysis V1: sorgente congelata, da valutare contro precision-v2;
- Audio Analysis V2: tuning **NON avviato**;
- evaluation holdout: **CHIUSO**;
- Source Separation: **DA FARE dopo Audio Analysis**;
- Audio→MIDI: **NON avviato**;
- training serio: **CHIUSO**.

Prossimo blocco: congelare evaluator e contratto della baseline V1 nella repository prima di osservare i punteggi reali.
