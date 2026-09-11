# Owned Beats — Audio Analysis V2 config-001 — Apertura

Data: 11 settembre 2026

## Stato prima della configurazione

Control arm development corrente:

- reference: `audio-analysis-v2-dev-reference-precision-v3`;
- reference digest: `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`;
- V1 run: `v1-baseline-development-002`;
- V1 report digest: `4bebe4af0ed4bd8b0d1796432c54099c1705a3494d258c2eb10bc85033e2b714`;
- holdout: non osservato.

Diagnostica sezioni usata prima del freeze:

- run: `sections-v1-baseline002-diagnostic-001`;
- report digest: `ce8b90f926e7c3379433c8c5ebd102b6c8f1065574014d676eec36c4f504f2a6`;
- 52 boundary reference;
- 8 boundary selezionate da V1;
- 2 match @0,5 s;
- 5 match @3 s;
- 5/8 family con zero boundary;
- 13 `LOCAL_PEAK_BELOW_HEIGHT`;
- 31 `LOCAL_PEAK_WITHIN_3S_NOT_SELECTED`;
- 3 `NO_LOCAL_PEAK_WITHIN_3S`.

Quindi 49/52 boundary hanno almeno un estremo locale entro 3 secondi, ma la policy V1 ne seleziona pochissime. Il problema è principalmente di selezione/rappresentazione della novelty, con una componente di localizzazione. Abbassare soltanto `height=2.5` non è sufficiente: alcune boundary molto vicine alla reference hanno novelty V1 debole o perfino negativa, mentre esistono picchi forti non corrispondenti a boundary umane.

## Configurazione congelata

Candidate: `audio-analysis-v2-config-001`

Questa configurazione conta come **1/8** nel budget V2.

Invarianti:

- beat tracker: V1 congelato, invariato;
- BPM: V1 congelato, invariato;
- meter: V1 congelato, invariato;
- Human Reference: precision-v3 invariata;
- nessun parametro per singola traccia;
- holdout chiuso.

Modifica sections:

- feature: stesse MFCC13 + chroma12 beat-synchronous del V1;
- invece della distanza fra beat adiacenti, contrasto fra media degli **8 beat precedenti** e media degli **8 beat successivi**;
- novelty = distanza euclidea fra i due contesti;
- normalizzazione robusta median/MAD;
- peak `height=1.5` robust-z;
- peak `prominence=1.0` robust-z;
- `distance=8` beat;
- edge margin 2 s;
- boundary localizzata sul beat che separa contesto sinistro e destro.

Config hash:

`04e00482802c46dda876733b7210992cab9eadbafa33153266a483b4a90b81b3`

Candidate source Git blob atteso:

`2940f7ef71b5b165903e3371c1b7d14e116538bf`

## Ipotesi

La V1 misura cambiamenti troppo locali e applica una soglia molto selettiva. Una section boundary musicale può essere evidente come differenza fra due passaggi anche senza un salto grande tra due beat consecutivi.

config-001 testa **una sola ipotesi di famiglia algoritmica**: contrasto contestuale beat-synchronous. Non modifica il beat tracker e non usa output/reference per scegliere parametri diversi per brano.

## Decisione dopo la run

Il confronto resta paired per `compositionFamilyId` sulla stessa precision-v3.

- beat F1 non-inferiority: `-0,02`;
- section F1 non-inferiority: `-0,03`;
- beat material improvement: `+0,03`;
- section material improvement: `+0,05`;
- review cost umano resta separato;
- anche in caso di gate metrico positivo, holdout resta chiuso finché il required review non è completo e non esiste un `V2_WINS` finale congelato.
