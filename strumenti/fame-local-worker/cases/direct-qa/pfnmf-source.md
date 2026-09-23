# Owned Beats — P5 PF-NMF controlled result — negative/partial

Data: 22 settembre 2026  
Decisione: NDR-097  
Branch: `feature/fame-neural-roadmap`

## Esito

La candidata `drums-pfnmf-template-activation-v1` non supera il gate controllato.

Il factorization loop converge sui casi riportati, quindi il failure non è un problema di mancata convergenza numerica. Il pattern residuo è invece **cross-activation tra template**:

- D04 kick+snare: kick e snare vengono recuperati ma compaiono 4 hihat falsi;
- D05 kick+hi-hat: 8 TP / 4 FP / 0 FN, F1 0.8; i 4 FP sono snare;
- D06 hi-hat triplets: 9 TP / 10 FP / 0 FN, F1 0.642857; 9 snare falsi + 1 kick falso;
- D07 kick sincopato: 5 TP / 10 FP / 0 FN, F1 0.5; 5 snare falsi + 5 hihat falsi;
- D08 clap/rim diagnostico: 9 eventi candidati per 4 riferimenti fuori tassonomia.

Il run termina con `KEEP_PFNMF_AS_CONTROLLED_NEGATIVE_OR_PARTIAL_RESULT_AND_REASSESS_REPRESENTATION_BEFORE_REAL_EASY`.

## Interpretazione

PF-NMF migliora la capacità di rappresentare ruoli simultanei rispetto alla baseline single-label, ma thresholdare separatamente le attivazioni dei template produce ancora troppe classi spurie. Aumentare soglie sui fixture controllati sarebbe tuning post-hoc e non viene fatto.

## Decisione

1. Conservare PF-NMF come negative/partial evidence.
2. Non modificare low-end, onset detector, renderer o cohort consumati.
3. Non aprire training.
4. Prima del real-easy provare una terza candidata non-learned focalizzata sulla **selezione del sottoinsieme di classi per transient**.
5. La candidata `drums-transient-subset-bic-v1` riusa il detector temporale congelato; per ogni transient valuta tutti i 7 sottoinsiemi non vuoti di kick/snare/hihat, stima ampiezze non-negative con NNLS e sceglie il modello con BIC minimo.
6. Nessuna soglia di classe viene ricavata dai fixture.
7. Anche un eventuale PASS resta mechanics-only finché template/provenance e real-easy non sono congelati.

## Ricerca comparativa

La letteratura recente continua a indicare le sovrapposizioni e il contenuto spettrale condiviso come limiti centrali dell'ADT; i sistemi più forti tendono verso classificazione multi-label appresa o separate-and-detect per classe. Questo supporta l'uso della candidata BIC come ultimo controllo deterministico di rappresentazione, non come presunta soluzione stato-dell'arte.

