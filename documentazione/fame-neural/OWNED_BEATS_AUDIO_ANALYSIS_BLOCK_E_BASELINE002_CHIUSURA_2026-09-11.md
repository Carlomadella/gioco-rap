# Owned Beats — Audio Analysis Block E — Chiusura baseline002 su precision-v3

Data: 11 settembre 2026

## Stato congelato

La Human Reference development `audio-analysis-v2-dev-reference-precision-v3` è stata finalizzata dopo il riascolto completo delle 24 finestre con metronomo aderente ai marker reali.

- reviewId: `audio-analysis-v2-dev-reference-precision-v3`
- submission digest SHA256: `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`
- family: 8/8
- finestre: 24/24 `COMPLETE` + reviewed
- beat-metric usable: 8/8
- meter/sezioni/definizione finestre invariati rispetto alla precision-v2
- holdout: non osservato

La vecchia `precision-v2` e `v1-baseline-development-001` restano storico immutabile.

## Nuovo contratto paired

Commit di freeze:

`4cd217a2baa50565b16997ab8cbee8308fc93222`

Contratto:

`frontend/strumenti/fame-neural-composer/owned-beats/audio-analysis-evaluation-implementation-v2.json`

Digest contratto SHA256:

`1ce3cefa8d7460649559bae4f1fc385ee1b2bb379cdb41d9badb13d1b962a30c`

Il contratto mantiene invariati protocollo, sorgente V1 e metriche, ma pinna lo scoring sulla `precision-v3`. Il sorgente V1 resta il blob:

`fcabcf8b069fe2a65edc6ce171d86226e1bcaecb`

La baseline append-only coerente con la nuova reference è:

`v1-baseline-development-002`

Report:

`D:\FAME_NEURAL\runs\audio-analysis-evaluation-v1\v1-baseline-development-002\report.json`

Digest report SHA256:

`4bebe4af0ed4bd8b0d1796432c54099c1705a3494d258c2eb10bc85033e2b714`

## Risultati baseline002

| Metrica | baseline001 / precision-v2 | baseline002 / precision-v3 | Delta |
|---|---:|---:|---:|
| median Beat F1 @70 ms | 0.837662 | 0.724060 | -0.113602 |
| median Cemgil @40 ms | 0.599052 | 0.494389 | -0.104663 |
| median Section F1 @0,5 s | 0 | 0 | 0 |
| BPM EXACT | 5 | 5 | 0 |
| BPM DOUBLE | 1 | 1 | 0 |
| BPM OTHER | 2 | 2 | 0 |
| meter exact diagnostic | 7/8 | 7/8 | 0 |

La diminuzione relativa è circa **-13,56%** sul median Beat F1 e **-17,47%** sul median Cemgil.

Questa differenza **non è una regressione del codice V1**: V1 è rimasto congelato. Misura l'impatto della reference beat revisionata. Di conseguenza baseline002 è la baseline da usare per il futuro confronto paired `V1-v3` contro `V2-v3`.

## Dettaglio family baseline002

| Family | BPM ref v3 | BPM V1 | Categoria | Beat F1 | Cemgil | Section F1 @0,5 s |
|---|---:|---:|---|---:|---:|---:|
| FAME000011 | 121.703854 | 123.046875 | EXACT_METRIC_LEVEL | 0.848000 | 0.724709 | 0 |
| FAME000012 | 70.136638 | 135.999178 | OTHER | 0.517857 | 0.461227 | 0 |
| FAME000023 | 76.653610 | 151.999081 | DOUBLE_TIME | 0.471545 | 0.324464 | 0 |
| FAME000040 | 120.265305 | 117.453835 | EXACT_METRIC_LEVEL | 0.829268 | 0.755591 | 0 |
| FAME000046 | 138.444712 | 135.999178 | EXACT_METRIC_LEVEL | 0.747967 | 0.596367 | 0 |
| FAME000058 | 103.728163 | 103.359375 | EXACT_METRIC_LEVEL | 0.732673 | 0.527550 | 0.363636 |
| FAME000080 | 129.648157 | 129.199219 | EXACT_METRIC_LEVEL | 0.715447 | 0.311669 | 0 |
| FAME000126 | 150.244523 | 99.384014 | OTHER | 0.342342 | 0.237969 | 0 |

La `FAME000080` è il caso più evidente dell'effetto della correzione temporale: BPM V1 e reference restano molto vicini, ma Beat F1/Cemgil peggiorano nettamente contro la griglia umana revisionata. Questo separa chiaramente il concetto di BPM corretto dal corretto phase/allineamento dei beat.

`FAME000126` resta invece un failure mode metrico/tempo importante: la reference è ~150,24 BPM mentre V1 resta ~99,38 BPM.

## Sezioni: conclusione ancora invariata

La reference delle sezioni non è stata modificata nella precision-v3 e il detector V1 non è stato modificato; il median Section F1 resta quindi 0.

La diagnosi precedente rimane il punto di partenza:

- 52 boundary umane;
- 8 boundary V1;
- 2 match @0,5 s;
- 5 match @3 s;
- 5/8 family senza alcuna boundary proposta.

Il failure mode primario resta **undersegmentation/omissione**, con un problema secondario di localizzazione per alcuni dei pochi picchi esistenti.

## Prossimo passo autorizzato

Prima di cambiare soglie o implementare una candidata V2 viene aggiunta una diagnostica osservativa del detector V1 che espone, per ogni family:

- curva `robust_z` usata realmente dal V1;
- picchi selezionati con `height=2.5`, `distance=8 beat`, `prominence=0.5`;
- picchi locali scartati;
- nearest selected/local peak per ogni boundary umana;
- classificazione `MATCH_500MS`, `MATCH_3S_ONLY`, sotto soglia, sotto prominence, soppresso/filtrato o nessun picco vicino.

Questa diagnostica **non modifica V1, non conta come configurazione V2 e non apre l'holdout**. Serve a scegliere la prima modifica V2 con una causa osservabile invece di abbassare soglie alla cieca.