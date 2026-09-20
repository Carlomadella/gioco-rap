# Owned Beats — Audio Analysis R6 — final holdout one-shot

Data: 2026-09-20  
Stato: **R6 CHIUSO / V2_PROMOTE / HOLDOUT CONSUMATO**

## Scopo

Chiudere il percorso R6 rimasto aperto dopo l'audit del 13 settembre: Human Reference holdout cieca finalizzata, scoring V1 e `audio-analysis-v2-config-001` sulla stessa reservation, confronto paired finale e decisione secondo il protocollo congelato.

Questo checkpoint registra gli output prodotti nel workspace esterno `D:\\FAME_NEURAL`. I report restano fuori da Git; qui vengono conservati identità, digest ed esito.

## Binding finale

- branch/tooling all'esecuzione: `feature/fame-neural-roadmap`;
- commit: `e6637b8360dcf3e28dfac712693d9a17e96a95a8`;
- candidate: `audio-analysis-v2-config-001`;
- config hash: `04e00482802c46dda876733b7210992cab9eadbafa33153266a483b4a90b81b3`;
- candidate freeze SHA256: `5ab2e4d996123f6a22a15a8b3fa1f6eafb0f0097b3f0c074aefe59c6928b50a3`;
- protocol digest: `a85cb06f34108fe60f9d0bc40db754a429403500d32bfc48a06a76c7965bb254`;
- split: `evaluation-holdout-r1-v2`;
- cohort: `audio-analysis-holdout-r1-v2`;
- cohort digest: `887ac3aee76ac65b710381bc428bd8bb7cd5708e94a4dbd9449dbea9386866e6`;
- cohort reference digest: `d7d54284f204831e8e78e7004abe3f62218aab2224b007980bca6f38c64d06a4`;
- reservation digest: `b3b3af11aaefb894353a3a80b27b077488d7430a52371bafd91f1a8316fc1ac5`;
- Human Reference reviewId: `audio-analysis-v2-holdout-r1-v2-reference-001`;
- Human Reference submission digest: `83a28e300daa8b64653354db46afabbcb4737c300e02636bf9b8bcde9c4efe90`;
- final run: `r6-final-holdout-001`;
- family: `10/10`.

## Human Reference holdout

Il finalizer ufficiale ha chiuso la reference con:

- `reviewCompleteFamilies: 10/10`;
- `beatMetricUsableFamilies: 10/10`;
- `finalizationReady: true`.

Snapshot:

`D:\\FAME_NEURAL\\references\\audio-analysis-v2\\evaluation-holdout-r1-v2\\audio-analysis-v2-holdout-r1-v2-reference-001.json`

La reference è stata raccolta in modalità cieca rispetto agli output V1/V2 e finalizzata prima dello scoring.

## Preflight finale

Il preflight R6 ha verificato:

- candidate freeze e development gate;
- protocol/config/reference congelati;
- stessa reservation R1 v2;
- snapshot/index Human Reference finalizzati;
- identità complete delle 10 family;
- assenza di scoring finale precedente;
- `maxFinalEvaluationRuns: 1`;
- `scoringStartedByThisCommand: false`;
- `candidateOutputsExposedByThisCommand: false`;
- `comparatorStartedByThisCommand: false`.

Su Windows il freeze storico del dependency lock corrisponde alla rappresentazione `CRLF`; il controllo portabile ha accettato soltanto la differenza di line ending dello stesso testo lock, mantenendo verifica delle versioni installate e degli altri binding.

## Esito finale

Run:

`D:\\FAME_NEURAL\\runs\\audio-analysis-final-holdout-r1-v2\\r6-final-holdout-001`

Paired median deltas V2 − V1:

- Beat F1 @70 ms: **`0.0`**;
- Section F1 @0,5 s: **`+0.545805`**.

Technical integrity:

- `pass: true`;
- beat tracker outputs exactly invariant: `true`;
- same family set: `true`;
- same Human Reference: `true`;
- same reservation: `true`.

Decisione protocollo:

- metric gate: **`V2_WINS`**;
- protocol outcome: **`V2_PROMOTE`**;
- motivo: tutti i target restano non-inferiori e almeno uno supera la soglia di miglioramento materiale;
- retuning sullo stesso holdout: **`false`**.

## Artefatti finali

- `v1-report.json` SHA256: `7b15a668a602c4357fa3416068b5c809259f282f6c09cdf75a3d9558edc1a264`;
- `v2-report.json` SHA256: `423d00e0048535080b8aa85b7ff8993576b03a32d2b5ff63df8dab70a2afe965`;
- `comparison-report.json` SHA256: `c38046919388b839dce070f6a9503efad6c6fc43045bd6196305ea0056c12d7d`;
- `run-manifest.json` SHA256: `b108ff2ba8c00591c36fe2dfbd017e95a29bdeb88f27058003fb060ae8afc652`;
- completion receipt SHA256: `268b8736fe8ff3546f67cfdf9d2c553512197c0dfc883411f1670b1e091002d5`.

## Decisione operativa

`audio-analysis-v2-config-001` è promossa come Audio Analysis V2 per il downstream del pilot.

Il cohort `evaluation-holdout-r1-v2` è ora **osservato e consumato**. Non può essere usato per retuning, scelta di `config-002` o altre decisioni di sviluppo. Qualunque nuovo tuning Audio Analysis richiede un nuovo untouched holdout.

La promozione riguarda **Audio Analysis**, non certifica Source Separation, Audio→MIDI, dataset task-ready, training readiness o qualità musicale del composer completo.

## Prossimo passo

Riprendere la sequenza Owned Beats già prevista:

**Source Separation pilot → Audio→MIDI drums/low-end → QA pilot**.

Training serio resta chiuso.
