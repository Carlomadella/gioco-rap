# FAME Neural — FASE 6 / Baseline semplice

Data avvio: 8 settembre 2026

Stato: IN CORSO — BLOCCO 1 RETRIEVAL BASELINE MISURATO

## Baseline V1

ID: `fame-retrieval-baseline-v1`

Rappresentazione: `fame-compound-v1`

Tipo: deterministic nearest-template retrieval.

Parametri appresi: **0**.

## Protocollo

- stesso split FASE 5 per composition family: **401 train / 58 validation / 43 test**;
- retrieval esclusivamente dal train set;
- composition family del target esclusa;
- ranking deterministico sui conditioning high-level;
- preferenza per stesso numero di barre, mode e lineage;
- adattamento BPM e tonalità;
- trasposizione di note, glide 808 e accordi;
- validazione finale con adapter FAME Compound reale;
- audit musicale sul risultato.

## Risultati reali

- output validi: **43/43**;
- composition-family leakage: **0**;
- exact-phrase leakage: **0**;
- retrieval distance mean: **0.033077**;
- retrieval distance P95: **0.061538**;
- plan MAE mean: **0.031008**;
- plan MAE P95: **0.047619**;
- mode exact rate: **1.000000**;
- lineage exact rate: **1.000000**;
- template unici: **39/43**;
- massimo riuso di un template: **2**;
- audit warning: **18** distribuiti su **5** sample;
- generation manifest SHA-256: `a4f375a7ef5c80ae484c923e40043b6fcb8382beabeba533fa01833d3d8d2a59`.

## Audit dei warning

I 18 warning appartengono tutti alla categoria `DENSITY_VS_VOCAL_SPACE`.

Non sono errori grammaticali o strutturali. Segnalano barre con vocal space dichiarato alto ma almeno 10 eventi foreground.

La baseline V1 non applica un post-processing per correggerli: il limite resta intenzionalmente visibile nel benchmark.

## Interpretazione

La baseline retrieval è forte sulla validità perché recupera materiale musicale reale dal train set e lo adatta.

Il suo limite fondamentale è che non compone davvero materiale nuovo. Inoltre la vicinanza dei conditioning non garantisce automaticamente coerenza perfetta tra densità effettiva e spazio vocale.

Questi limiti diventano parte del benchmark che il Neural dovrà battere.

## Prossimo passo

FASE 6 / Blocco 2: aggiungere una baseline generativa semplice constrained, capace di produrre materiale nuovo senza rete neurale, così da non confrontare il futuro Neural soltanto contro una baseline retrieval.
