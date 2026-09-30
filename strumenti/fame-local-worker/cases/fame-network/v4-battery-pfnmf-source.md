# Direct QA — PF-NMF review v1 — first real run

Data: 2026-09-23.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_001 / pfnmf-review-v1 / attempt-1`.

## Esito

Il primo run reale del worker QA diretto riutilizzabile ha restituito:

- `status=VALIDATED_FOR_REVIEW`;
- `modelCalls=1`;
- `executionAuthorized=false`;
- nessun retry;
- review umana prodotta.

Il risultato e operator-reported: il repository non contiene i byte della root locale del run e non certifica autonomamente la sessione Ollama.

## Controllo della review

La review incollata dall'operatore e coerente con il pacchetto congelato `pfnmf-review-v1`:

1. `GATE_AND_CAUSE` — supportata con U02 + U03: PF-NMF non supera il gate; il loop converge e il pattern residuo e cross-activation tra template.
2. `D06_ERRORS` — supportata con U03: D06 riporta 10 falsi positivi, 9 snare + 1 kick.
3. `BIC_SCOPE` — supportata con U06: sette sottoinsiemi non vuoti, NNLS, detector temporale congelato.
4. `TRAINING_OPEN` — non supportata: U06 dice esplicitamente di non aprire training.

La ripetizione di U03 in due finding e intenzionale: la stessa unita semantica contiene sia il pattern generale di cross-activation sia il dettaglio D06.

## Interpretazione

Questo checkpoint valida il percorso operativo del worker generico su un primo task reale documentale:

`pacchetto congelato -> Ollama diretto -> JSON Schema -> validatore host -> review umana`.

Non e una nuova evaluation audio, non autorizza training/batch131/produzione e non dimostra affidabilita generale del modello. Il prossimo task deve essere diverso e utile; non va ripetuto `pfnmf-review-v1` in una nuova root per ottenere un altro first attempt.
