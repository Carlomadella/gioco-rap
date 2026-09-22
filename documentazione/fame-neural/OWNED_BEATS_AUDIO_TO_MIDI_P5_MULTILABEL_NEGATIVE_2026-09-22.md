# Owned Beats — P5 multilabel spectral candidate — controlled negative result

Data: 22 settembre 2026  
Decisione: NDR-096  
Branch: `feature/fame-neural-roadmap`

## Candidata

`drums-independent-multilabel-spectral-v1`

Scopo: permettere più ruoli sullo stesso transient usando tre detector indipendenti sulle bande spettrali già congelate, senza soglie nuove, training o retuning.

## Esito controllato

Il controlled comparison è **FAIL**.

Evidenza verificata:

- D04 kick+snare: la candidata recupera kick e snare simultanei, ma produce anche hihat falsi;
- D05 kick+hi-hat: 8 TP / 4 FP / 0 FN, precision 0.666667, recall 1.0, F1 0.8; gli FP sono snare;
- D06 hi-hat triplets: 9 TP / 18 FP / 0 FN, precision 0.333333, recall 1.0, F1 0.5; ogni hi-hat genera anche kick e snare falsi;
- D07 kick sincopato: 5 TP / 10 FP / 0 FN, precision 0.333333, recall 1.0, F1 0.5; ogni kick genera anche snare e hi-hat falsi;
- D08 clap/rim, diagnostico fuori tassonomia: 12 eventi candidati contro 4 eventi baseline, confermando sovra-attivazione indiscriminata.

Il nextAction del run è `LOCALIZE_CANDIDATE_FAILURE_WITHOUT_TUNING_ON_CONSUMED_EVALUATION`.

## Interpretazione

La candidata risolve la **capacità rappresentazionale** di emettere più classi sullo stesso transient, ma non l'**identità strumentale**. I transienti percussivi sono broadband: un peak-picker indipendente per banda vede attività contemporanea in low/mid/high e produce co-attivazioni spurie.

Il problema non viene corretto alzando soglie sui fixture. Sarebbe tuning sul sintetico e rischierebbe di eliminare veri transienti su timbri diversi.

## Decisione

1. `drums-independent-multilabel-spectral-v1` viene conservata come negative result e non prosegue al real-easy.
2. Baseline, low-end, onset detector storico e cohort consumati restano immutati.
3. Si apre la seconda candidata già pre-dichiarata: `drums-pfnmf-template-activation-v1`.
4. Nel controlled stage PF-NMF usa template fissi ricavati solo da D01/D02/D03 per dimostrare la meccanica di attivazioni indipendenti. Questo non costituisce training readiness né promozione su beat reali.
5. Prima di eventuale real-easy, template/provenance e strategia di generalizzazione devono essere ridefiniti su materiale autorizzato, senza usare le 12 evaluation consumate.

## Riferimento metodologico

Wu & Lerch (2015), Drum Transcription using Partially Fixed Non-Negative Matrix Factorization:
https://musicinformatics.gatech.edu/wp-content_nondefault/uploads/2015/09/Wu_Lerch_2015_Drum%20Transcription%20using%20Partially%20Fixed%20Non-Negative%20Matrix%20Factorization.pdf

Il metodo usa un dizionario di template percussivi, attivazioni NMF per classe e novelty ricavata dalla differenza delle attivazioni con threshold mediano adattivo.
