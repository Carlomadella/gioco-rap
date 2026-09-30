# FAME Neural — Single Agent vs Four-Role Network V4 Battery V1

## Obiettivo

Valutare la Four-Role Network V4 come architettura completa contro la baseline single-agent, dopo la chiusura dell'hardening del Verifier V4.

La batteria usa casi nuovi rispetto a:
- single-vs-four V1/V2;
- Battery V1;
- matched-budget V1;
- fresh pilot V4;
- branch probe V4.

Nessun caso della nuova batteria è stato inferito prima del freeze.

## Budget

Budget massimo totale di generazione pareggiato per caso:
- single-agent V2: 1 × 16384 token;
- Four-Role Network V4: 4 × 4096 token;
- totale massimo: 16384 token per braccio.

Restano uguali:
- modello e digest;
- num_ctx=32768;
- temperature=0;
- seed=42;
- domanda/evidenze/answer options;
- expected answer host-only.

## Quattro casi pre-registrati

1. `v4-battery-pfnmf-limited-validation-v1`
   - source: `DIRECT_QA_PFNMF_RESULT_2026-09-23.md`;
   - target: distinguere validazione operativa limitata da affidabilità generale;
   - ordine: single-agent -> network.

2. `v4-battery-subset-packaging-v1`
   - source: `DIRECT_QA_SUBSET_BIC_RESULT_2026-09-23.md`;
   - target: distinguere reject storico da errore semantico e da conversione retroattiva in PASS;
   - ordine: network -> single-agent.

3. `v4-battery-recovery-salvage-v1`
   - source: `DIRECT_QA_RECOVERY_PROTOCOL_V2_RESULT_2026-09-30.md`;
   - target: distinguere PASS valido con salvage da raw-clean e da correzione semantica host-side;
   - ordine: single-agent -> network.

4. `v4-battery-aggregate-nine-run-v1`
   - source: `DIRECT_QA_V2_AGGREGATE_RESULT_2026-09-30.md`;
   - target: mantenere 7/9 accettati, due reject storici e tempo umano non misurato;
   - ordine: network -> single-agent.

Ordine bilanciato 2/2.

## Runner

`fame_single_vs_four_v4_battery_v1.py`.

Massimo 20 chiamate:
- 4 single-agent;
- 16 network.

Un troncamento con response salvata resta un outcome sperimentale e non impedisce l'altro braccio.
Un failure operativo senza response ferma la batteria.

## Metriche

Per entrambi:
- answer option;
- host expected match;
- required evidence coverage;
- evidence selezionate;
- model calls;
- prompt/eval token;
- elapsed e model duration excluding load;
- troncamenti.

Per V4:
- Anti-Bias issues;
- supported/unsupported/rework count del Verifier;
- diagnostica per ruolo.

Nessun winner automatico.

## Limiti

La batteria misura quattro casi documentali del progetto. Non dimostra affidabilità generale, production readiness o superiorità universale dell'architettura.

La review umana resta necessaria per overclaim, precisione, parsimonia e utilità reale dell'Anti-Bias.

## Verifica pre-run

- 80 test Direct-QA: OK;
- 103 test FAME: OK.
