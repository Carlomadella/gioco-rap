# FAME Neural — FASE 6 / Baseline semplice

Data: 8 settembre 2026

Stato: COMPLETATA — RETRIEVAL + CONSTRAINED BASELINE CONGELATE

## Baseline 1 — Retrieval V1

ID: `fame-retrieval-baseline-v1`

- rappresentazione `fame-compound-v1`;
- parametri appresi: 0;
- split 401 / 58 / 43;
- retrieval solo dal train;
- composition-family leakage: 0;
- valid generation: 43/43;
- plan MAE mean / P95: 0.031008 / 0.047619;
- template unici: 39/43;
- max reuse: 2;
- 18 warning `DENSITY_VS_VOCAL_SPACE` su 5 sample.

La retrieval baseline è forte sulla coerenza perché recupera materiale reale, ma non compone una nuova performance.

## Baseline 2 — Constrained generative V1

ID: `fame-constrained-recombination-v1`

- rappresentazione `fame-compound-v1`;
- parametri appresi: 0;
- stesso split 401 / 58 / 43;
- donor solo dal train;
- donor leakage: 0;
- valid generation: 43/43;
- plan MAE mean / P95: 0 / 0;
- exact train phrase matches: 0;
- exact train bar matches: 0/172;
- unique generations: 43/43;
- donor groups usati: 225;
- donor groups medi per generazione: 45.9302;
- audit warning: 21 su 10 sample;
- `DENSITY_VS_VOCAL_SPACE`: 14;
- `ABRUPT_808_GRAMMAR_SHIFT`: 7;
- manifest: `a8ae2c2a24e5bb72e881dc9373e560f4bcd8771455b500894d1ac2db5b195550`.

Il plan MAE zero è per costruzione: il piano high-level della phrase viene fornito come conditioning.

Questa baseline misura quindi il Performer dato un piano, non la qualità di un Planner end-to-end.

Gli exact-match pari a zero indicano soltanto assenza di copie esatte secondo la firma usata; non dimostrano assenza generale di similarità o memorization.

Le due baseline restano volutamente semplici e i limiti musicali osservati non vengono corretti aggiungendo ulteriori regole procedurali.

## Stato

**FASE 6 COMPLETATA.**

Indicazione storica V1: **FASE 7 — Neural Planner V0** — SUPERATA dalla Roadmap V2 del 9 settembre 2026.

Prossimo intervento corrente: **FASE 7 — Task Data Reset + Drum Dataset V2**. Il Planner resta rinviato. Per ordine operativo e problemi aperti leggere `ROADMAP_FAME_NEURAL.md` e `CURRENT_STATE.md`.

Le baseline e i risultati sopra sono conservati come storico. Il fallimento musicale di Constrained V1/Coupled V2 riguarda le implementazioni e i test documentati; non dimostra l'impossibilità generale della generazione condizionale per parti. Vedi [audit V2](AUDIT_ROADMAP_V2_2026-09-09.md) e NDR-031.
