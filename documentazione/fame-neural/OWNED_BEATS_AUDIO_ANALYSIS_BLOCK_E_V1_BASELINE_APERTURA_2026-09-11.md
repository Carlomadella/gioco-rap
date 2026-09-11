# Owned Beats — Audio Analysis — Block E — Apertura baseline V1 reference-scored

Data: 11 settembre 2026

Stato: **APERTO — evaluator e contratto da congelare prima di osservare i risultati V1.**

## Domanda

Quanto è buona la baseline congelata `owned-beats-audio-analysis-v1` rispetto alla Human Reference development definitiva post-hardening, usando i criteri di `audio-analysis-v2-protocol.json`?

Questo blocco produce il punto zero quantitativo per il successivo confronto paired V2−V1. Non esegue tuning V2 e non apre l'evaluation holdout.

## Stato repository verificato prima dell'implementazione

Branch:

`feature/fame-neural-roadmap`

Head di partenza:

`4bed0ffacc82402bbf1737b308d14cc87c950431`

Baseline V1:

- tool version: `owned-beats-audio-analysis-v1`;
- Git blob: `fcabcf8b069fe2a65edc6ce171d86226e1bcaecb`;
- deve restare immutata.

Protocollo:

- stato `FROZEN_PRE_TUNING`;
- Git blob: `aebd54b0da41d6726d209e5fc22b5f59b2df0847`;
- SHA256 raw: `a85cb06f34108fe60f9d0bc40db754a429403500d32bfc48a06a76c7965bb254`.

Human Reference definitiva:

- reviewId `audio-analysis-v2-dev-reference-precision-v2`;
- 8/8 development;
- 24/24 finestre `COMPLETE`;
- submission digest `f63c37bf557a82e32c5a1c58b381501e043ff6e08832b7a3434742521521fa18`;
- precision-v1 preservata come storico;
- output candidati non esposti durante la raccolta;
- holdout non osservato.

## Vincoli

- solo split `development`;
- holdout fail-closed e non letto;
- V1 non modificata per facilitare la valutazione;
- stessi source SHA e stessa reference definitiva per V1 e V2;
- evaluator esterno alla baseline;
- risultati append-only nel workspace;
- nessun risultato automatico diventa ground truth;
- nessuna decisione V1/V2 viene presa dalla baseline da sola;
- costo di creazione reference distinto dal costo di correzione V1/V2;
- training, Source Separation e Audio→MIDI restano chiusi.

## Contratto post-hardening della reference

Il preflight rifiuta una reference che non rispetta il contratto corrente. In particolare verifica review, campi `rawTapTimesSeconds` e `quantizationHistory`, e copertura finale `COMPLETE`/`NO_BEAT`; `PENDING` e `AMBIGUOUS` sono fail-closed. Per `COMPLETE` sparso resta obbligatoria la nota prevista dal tooling.

Questo controllo non ricostruisce lo storico dei tap: verifica soltanto che la snapshot definitiva abbia la forma congelata prima dei punteggi.

## Ricerca di apertura

La versione congelata per il confronto è `mir_eval 0.8.2`. Il contratto usa:

- `mir_eval.beat.f_measure(..., f_measure_threshold=0.07)`;
- `mir_eval.beat.cemgil(..., cemgil_sigma=0.04)`;
- `mir_eval.beat.continuity()` per CMLc/CMLt/AMLc/AMLt;
- `mir_eval.segment.detection(..., window=0.5, trim=True)` per la metrica section primaria;
- `mir_eval.segment.deviation(..., trim=True)` per le deviazioni boundary.

Riferimenti:

- https://mir-eval.readthedocs.io/latest/api/beat.html
- https://mir-eval.readthedocs.io/latest/api/segment.html
- https://github.com/mir-evaluation/mir_eval/releases

Failure mode fissati prima dei risultati:

- BPM half/double time separato dall'exact metric level;
- beat mancanti o extra nelle finestre;
- V1 con zero section boundaries;
- start/end esclusi dalle boundary strutturali interne;
- digest JS del finalizer verificato senza drift della serializzazione Python;
- aggregazione delle tre finestre fissata prima dei punteggi;
- costo reference non usato come surrogato del correction cost candidato.

## Alternative e scelta

Modificare V1 per esportare nuovi campi è scartato: indebolirebbe la baseline congelata. L'evaluator esterno importa le stesse funzioni V1, esegue V1 sull'intera traccia e usa i beat interni solo per scoring.

Dove disponibile si usa `mir_eval 0.8.2`; conteggi match/FP/omissioni restano esposti come controllo trasparente.

Aggregazione beat primaria per family:

`MICRO_MATCH_COUNTS_ACROSS_3_WINDOWS`

La media aritmetica dei tre F1 window-level resta diagnostica. Il confronto V2−V1 successivo resta paired per `compositionFamilyId` e aggrega i delta family-level con la mediana secondo il protocollo.

## Metriche

Beat: F1 @70 ms, precision/recall, TP/FP/omissioni, Cemgil @40 ms, CMLc/CMLt/AMLc/AMLt, errore assoluto mediano/P95, per-window e family aggregate.

BPM: `EXACT_METRIC_LEVEL`, `HALF_TIME`, `DOUBLE_TIME`, `OTHER`, `UNKNOWN`, tolleranza FAME 3%.

Sections: precision/recall/F1 @0,5 s primaria, F1 @3 s diagnostica, deviazione, FP e omissioni.

Meter: confronto esatto diagnostico.

## Regola di arresto

In questa preparazione viene eseguito solo il **preflight**, non la baseline. Evaluator, contratto, dependency lock e documentazione devono essere committati/pushati e verificati sul branch remoto **prima** della prima run reale `v1-baseline-development-001`.

Solo dopo il freeze repository:

1. eseguire la baseline development append-only;
2. conservare risultati e failure mode;
3. fissare quei valori come V1;
4. aprire la prima candidata V2 entro il budget di configurazioni del protocollo.

Evaluation holdout resta chiuso fino a `V2_WINS` documentato e freeze immutabile della candidata.
