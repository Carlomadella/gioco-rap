# FAME Neural — Fase 7D — Blocco 2 — Apertura: grouping + candidate manifest

Data: 10 settembre 2026
Base tecnica verificata: `f7335b8`.

## Obiettivo

Eseguire il Blocco 2 già previsto dalla roadmap senza modificarne scope o requisiti:

- costruire il candidate pool GMD generale `beat/4-4`;
- mantenere `fill/4-4` come pool separato;
- preservare `eval_session` come holdout candidato;
- confrontare una proposta `session-grouped` e una `drummer-held-out`;
- misurare copertura e distribuzioni;
- mantenere `sourceSplit` separato dal nuovo `taskSplit` candidato.

Il blocco è **design e manifest**, non training.

## Regole

1. `sourceSplit` GMD è preservato integralmente come `source-reference-only`.
2. `taskSplit` è una proposta FAME separata e non sovrascrive mai `sourceSplit`.
3. `beat_type=beat` e `beat_type=fill` restano label di fonte: non vengono promosse automaticamente a `semantics.core/fill`.
4. `hiphop` resta uno style GMD; non equivale a Trap.
5. Tutti i record GMD restano tracciati nel manifest, inclusi non-4/4 ed `eval_session`.
6. I record `eval_session` non entrano nelle proposte train/validation/test del Block2; sono marcati `benchmark-holdout-candidate`.
7. La baseline di confronto usa i record 4/4 non-eval. I record non-4/4 restano osservati e tracciati, non cancellati.
8. Nessuna strategia viene promossa automaticamente a split finale FAME solo perché produce zero overlap del proprio group key.

## Candidate split

### Session-grouped

Tutti i record eleggibili della stessa `session` ricevono lo stesso `taskSplit`.

Target descrittivo: 80/10/10 per record. L'assegnazione è deterministica e greedy sulla numerosità dei gruppi; il risultato viene poi auditato, non assunto come ottimale musicalmente.

### Drummer-held-out

Un drummer intero viene proposto per validation e un drummer intero per test; gli altri drummer vanno in train.

Vengono enumerati tutti gli abbinamenti ordinati validation/test possibili e viene scelto come **representative candidate**, non decisione finale, quello con il miglior bilanciamento lessicografico su:

1. massimo scostamento assoluto dal target record 80/10/10;
2. scostamento assoluto totale;
3. massimo scostamento della quota beat;
4. numero di primary style mancanti complessivi;
5. tie-break deterministico.

Il report conserva la classifica dei candidate holdout affinché la decisione non sia nascosta.

## Output

Il builder produce:

- `gmd-phase7d-block2-candidate-manifest.json`;
- `gmd-phase7d-block2-report.json`.

Il manifest ha stato esplicito `candidate-only-no-training-authority`.

## Gate del blocco

Prima di poter chiudere il Block2 nel proprio scope:

1. record GMD validi e unici;
2. nessun record perso dal manifest;
3. `general-beat-4/4 + fill-4/4 = tutti i record 4/4 non-eval`;
4. `eval_session` interamente preservata come holdout candidato;
5. `sourceSplit` presente per ogni record e mai sostituito da `taskSplit`;
6. zero session cross-split nella proposta session-grouped;
7. zero drummer cross-split nella proposta drummer-held-out;
8. train/validation/test non vuoti per entrambe le strategie;
9. distribuzioni per style, beat/fill e sourceSplit prodotte per ogni task split;
10. output deterministico a parità di `info.csv`;
11. smoke test PASS;
12. nessun training e nessuna promozione `DRUM DATA READY V2`.

La scelta tra le due strategie avviene **dopo** il report reale, non prima.
