# Owned Beats — P5 transient subset+BIC — controlled negative/partial result

Data: 22 settembre 2026  
Decisione: NDR-098  
Branch: `feature/fame-neural-roadmap`

## Esito

La candidata `drums-transient-subset-bic-v1` non supera il gate controllato. Il run termina con:

`STOP_CONTROLLED_NONLEARNED_VARIANT_LOOP_AND_REASSESS_REAL_TEMPLATE_OR_LEARNED_MULTI_LABEL_PATH`.

Evidenze verificate dall'output del run:

- D05 kick+hi-hat: 8 TP / 2 FP / 0 FN, precision 0.8, recall 1.0, F1 0.888889; due transient selezionano ancora `kick+snare+hihat` e introducono snare falsi;
- D06 hi-hat triplets: 9 TP / 9 FP / 0 FN, precision 0.5, recall 1.0, F1 0.666667; tutti i nove transient selezionano `snare+hihat`, quindi lo snare resta una falsa co-attivazione sistematica;
- D07 kick sincopato: 5 TP / 0 FP / 0 FN, precision/recall/F1 1.0; il candidato seleziona `kick` per tutti i cinque transient;
- D08 clap/rim diagnostico: 7 eventi candidati per riferimenti fuori tassonomia; i subset scelti includono combinazioni e snare singoli.

## Interpretazione

La selezione esplicita del subset migliora nettamente la precisione rispetto ai detector multi-label indipendenti e PF-NMF, e conserva perfettamente D07. Tuttavia non elimina la confusione snare/hi-hat: il template snare continua a spiegare parte dei transient hi-hat e alcune simultaneità kick+hi-hat.

Questo conferma che il collo di bottiglia non è più il timing del transient e non è risolvibile con un'altra soglia locale senza entrare in tuning post-hoc sui fixture sintetici. La rappresentazione template sintetica non generalizza abbastanza neppure nel controlled stage.

## Decisione

1. Fermare il loop di nuove varianti euristiche/template sullo stesso sintetico.
2. Conservare `drums-transient-subset-bic-v1` come negative/partial evidence, non promossa.
3. Non modificare low-end, onset detector, renderer o i 12 record independent evaluation consumati.
4. Non aprire training.
5. Il prossimo confronto deve cambiare fonte di informazione, non soltanto decision rule: candidato pretrained multi-label oppure template reali autorizzati e variati.
6. Prima di qualsiasi nuovo accesso audio reale, congelare codice, modello/checkpoint, licenza, ambiente e protocollo.
7. La prima candidata pretrained da preflight è `Tsumugi drums_v1_5`, senza training e senza Source Separation nel controlled fixture stage.

## Ricerca per il prossimo ramo

Tsumugi:
- source repo MIT;
- source commit congelato per il preflight: `f7411471a4de0ad3d430191de11b8623d67e5b38`;
- modello `drums_v1_5` introdotto il 1 settembre 2026;
- benchmark dichiarato dal progetto: exact F1 0.6890 su Drum Kit a 50 ms nel real-audio evaluation set;
- checkpoint: `best_model_drums_v1_5.pth`;
- Hugging Face model repo: `anime-song/instrument_agnostic_amt`, licenza MIT;
- checkpoint upload commit: `89aefa28abf0a54f859505f41f211d273662c7c7`;
- checkpoint bytes: `57150497`;
- checkpoint SHA256: `65138ad1dd919f33fb0ce56e54c0c23c87deaad6511132d69137cf4901ee9319`.

MT3 resta escluso come prima scelta di integrazione finché la licenza del checkpoint esterno non è chiarita in modo esplicito; il codice repo è Apache-2.0 ma una issue aperta ad agosto 2026 chiede conferma specifica sul grant dei pesi commerciali/redistribuzione.
