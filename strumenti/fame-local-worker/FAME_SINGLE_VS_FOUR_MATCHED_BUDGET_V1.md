# FAME Neural — Single Agent vs Four-Role Network Matched-Budget V1

## Perché esiste

La Battery V1 a budget per-call fisso ha prodotto:
- 3 casi con answer corretta in entrambi i bracci;
- 1 caso in cui la Four-Role Network ha completato il task e il single-agent è terminato con `OUTPUT_TRUNCATED` a `eval_count=4096`.

Quel risultato mostra robustezza operativa della decomposizione sotto un limite di 4096 token per chiamata, ma non isola la decomposizione dal maggiore budget totale disponibile alla rete.

## Estimand

Confrontare i due bracci a **massimo budget totale di generazione uguale**:

- single-agent: 1 chiamata × 16384 token massimi;
- Four-Role Network V3: 4 chiamate × 4096 token massimi;
- massimo totale per caso: 16384 token in entrambi i bracci.

Restano uguali:
- modello e digest;
- num_ctx=32768;
- temperature=0;
- seed=42;
- domanda, unità, answer options e host rubric.

Non sono uguali:
- numero di chiamate;
- struttura dei prompt;
- numero di episodi di decoding;
- num_predict per singola chiamata.

Quindi il test isola meglio il confondente di budget totale, ma non riduce la decomposizione a un'unica variabile perfettamente randomizzata.

## Baseline V2

`fame_single_agent_baseline_v2.py`

Deriva dalla baseline V1, ma:
- `num_predict=16384`;
- conserva metriche anche quando una response è stata ricevuta ma parsing/completezza falliscono;
- un `done_reason=length` resta un outcome osservabile con response e metriche, non viene perso nell'aggregato;
- nessun retry.

## Batteria

`fame_single_vs_four_matched_budget_v1.py`

Quattro casi nuovi congelati insieme prima di qualsiasi inferenza reale:

1. `matched-package-authoring-v1`
   - source: `DIRECT_QA_PACKAGE_AUTHORING.md`;
   - tema: task consumati e minimal sufficient evidence;
   - ordine: single-agent -> network.

2. `matched-qa-review-v1`
   - source: `QA_REVIEW.md`;
   - tema: significato di VALIDATED_FOR_REVIEW e limiti del salvage;
   - ordine: network -> single-agent.

3. `matched-cline-real-qa-v1`
   - source: `CLINE_GPTOSS_REAL_QA_PROBE.md`;
   - tema: generalizzazione e indipendenza della sessione;
   - ordine: single-agent -> network.

4. `matched-coordinator-reject-v1`
   - source: `DIRECT_QA_COORDINATOR_ARCHITECTURE_V2_RESULT_2026-09-30.md`;
   - tema: REJECTED formale vs errore semantico e consumo del task;
   - ordine: network -> single-agent.

Ordine bilanciato 2/2.

## Failure handling

Un errore con response salvata, incluso `done_reason=length`, è un risultato del braccio e non impedisce l'esecuzione dell'altro braccio.

La batteria si ferma invece su failure realmente operativo senza response, oppure attempt interrotto.

## Output

`matched-budget-result.json` conserva per ogni braccio:
- result status ed errori;
- answer option e host match;
- required evidence coverage;
- evidence ID selezionati;
- claim/limitations;
- Anti-Bias issues;
- chiamate;
- prompt/eval token;
- total/load/model duration excluding load;
- done_reason;
- content/thinking chars;
- troncamenti per caso/ruolo.

Nessun winner automatico.

## Limiti

Anche con budget totale pareggiato, quattro chiamate separate possono essere più robuste di una chiamata lunga per ragioni di segmentazione del contesto/decoding. Questo è parte dell'architettura osservata, ma non permette di attribuire causalità a un singolo meccanismo interno.

Servono più casi e review umana prima di generalizzare.

## Sicurezza

Sempre:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
