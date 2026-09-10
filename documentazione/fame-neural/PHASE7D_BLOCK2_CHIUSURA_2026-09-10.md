# FAME Neural - Fase 7D - Blocco 2 - Chiusura: grouping + candidate manifest

Data: 10 settembre 2026

## Esito

**COMPLETATO NEL PROPRIO SCOPE TECNICO.**

Il run reale sul `info.csv` ufficiale GMD ha prodotto un candidate manifest completo e due proposte di `taskSplit` separate dal `sourceSplit` originale.

Nessuno split viene promosso automaticamente a split FAME definitivo da questo blocco.

## Corpus osservato

- record manifest: **1.150**;
- pool `general-beat-4/4` non-eval: **451**;
- pool `fill-4/4` non-eval: **647**;
- record non-4/4 non-eval: **12**;
- `eval_session` preservata come holdout candidato: **40**;
- record 4/4 non-eval eleggibili al confronto: **1.098**.

Il `sourceSplit` GMD resta `source-reference-only`.

`beat_type=beat` e `beat_type=fill` restano label della sorgente e non vengono reinterpretati automaticamente come `semantics.core` / `semantics.fill`.

## Proposta session-grouped

Distribuzione reale:

- train: **878**;
- validation: **111**;
- test: **109**;
- session group: **20**;
- session group cross-task-split: **0**.

Sul solo bilanciamento numerico rispetto al target descrittivo 80/10/10 questa proposta e' quasi perfetta:

- target train: 878,4;
- target validation: 109,8;
- target test: 109,8.

Limite: il grouping per sessione non garantisce separazione dei drummer tra train/validation/test.

## Proposta drummer-held-out

Distribuzione reale:

- train: **930**;
- validation: **98**;
- test: **70**;
- drummer group: **10**;
- drummer cross-task-split: **0**;
- validation holdout candidato: **drummer3**;
- test holdout candidato: **drummer8**.

Questa proposta e' piu' sbilanciata sul numero di record, ma realizza un test piu' severo di generalizzazione a performer non presenti nel train.

## Confronto

Il Block2 dimostra due proprieta' diverse:

- `session-grouped`: migliore aderenza alla distribuzione target e maggiore equilibrio di numerosita';
- `drummer-held-out`: isolamento completo dell'identita' performer, al costo di maggiore sbilanciamento.

Questi risultati non sono equivalenti e non giustificano una scelta automatica basata su un solo indicatore.

La scelta dello split operativo deve quindi essere una decisione esplicita del percorso 7D, motivata dal task di `GENERAL_HUMAN_GROOVE_PRETRAIN` e verificata prima della materializzazione del corpus.

## Gate

PASS:

- manifest completo;
- pool accounting coerente;
- `eval_session` preservata;
- source/task split separati;
- zero session cross-task-split nel candidato session-grouped;
- zero drummer cross-task-split nel candidato drummer-held-out;
- train/validation/test non vuoti;
- output deterministico;
- smoke test PASS.

Digest manifest reale:

`8bf3e1e107c3d634ff2637d15950f617b3d8541420ced02fb692c0b80d4c78a2`

## Stato dopo il Block2

- Fase 7D: **ANCORA APERTA**;
- `DRUM DATA READY V2`: **APERTO**;
- training serio: **CHIUSO**;
- MIDI reali completi: **NON richiesti dal Block2**;
- prossimo lavoro 7D possibile senza MIDI: decisione/lock della policy di split e preparazione della materializzazione, senza eseguire ancora l'import massivo.
