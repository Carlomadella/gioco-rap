# Owned Beats — Audio Analysis — Freeze correction-cost review config-001

Data: 11 settembre 2026

## Scopo

`audio-analysis-v2-config-001` ha già superato il gate metrico development ma, secondo il protocollo frozen, non può diventare `V2_WINS` finché non viene completato il required human correction-cost review.

Questo checkpoint congela **prima di osservare i tempi di review**:

- metodo;
- formula;
- soglia;
- blinding;
- ordine/assegnazione procedurale;
- tool di review;
- finalizer;
- integrazione della decisione development.

Nessun risultato del correction-cost review è stato osservato al momento di questo freeze.

## Input congelati

- candidate: `audio-analysis-v2-config-001`
- configuration index: `1/8`
- baseline run: `v1-baseline-development-002`
- baseline report SHA256: `4bebe4af0ed4bd8b0d1796432c54099c1705a3494d258c2eb10bc85033e2b714`
- candidate run: `v2-config-001-development-001`
- candidate report SHA256: `3047e7e15cd0efff7a4c7840b25b7c8a7e78e9fa583800861ae3f806eb2324e8`
- paired comparison run: `v2-config-001-vs-v1-baseline002-001`
- paired comparison report SHA256: `8459bd85d01d47b34152ba63c862734dfb4a272ac3728506aea78892e179f398`
- Human Reference: `audio-analysis-v2-dev-reference-precision-v3`
- reference digest SHA256: `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`
- protocol digest SHA256: `a85cb06f34108fe60f9d0bc40db754a429403500d32bfc48a06a76c7965bb254`
- baseline source Git blob: `fcabcf8b069fe2a65edc6ce171d86226e1bcaecb`
- candidate source Git blob: `2940f7ef71b5b165903e3371c1b7d14e116538bf`
- candidate config hash: `04e00482802c46dda876733b7210992cab9eadbafa33153266a483b4a90b81b3`
- holdout: non osservato

## Perché il review è sections-only

`config-001` mantiene beat tracker, BPM e meter del V1 esattamente invariati.

Il costo differenziale introdotto da questa candidata può quindi derivare soltanto dal lavoro necessario a correggere le **section boundary**. Ripetere beat/BPM/meter due volte introdurrebbe tempo uguale e rumore non attribuibile alla candidata.

## Disegno del review

Sono previste tutte le **8 family development**, non soltanto le 6 minime.

Ogni family viene ascoltata due volte:

- una volta partendo dalle boundary V1;
- una volta partendo dalle boundary config-001.

L'identità dei due arm viene nascosta al reviewer.

La Human Reference congelata non viene mostrata durante la correzione.

Per ridurre l'effetto ordine/apprendimento:

- ordine delle 8 family randomizzato al momento della preparazione del package;
- ordine dei due arm controbilanciato;
- esattamente 4 family partono da V1;
- esattamente 4 family partono da config-001;
- la chiave V1/V2 viene salvata fuori dalla web root servita al reviewer.

L'assegnazione viene materializzata e digestata **prima** della review.

## Azioni consentite

Per ciascun passaggio il reviewer può:

- spostare boundary;
- aggiungere boundary;
- eliminare boundary;
- ascoltare liberamente la traccia;
- usare waveform e timestamp.

Il passaggio viene chiuso soltanto quando il reviewer attesta che le boundary finali rappresentano il proprio giudizio musicale.

## Timer

Ogni passaggio richiede uno START esplicito.

Il tempo attivo comprende:

- ascolto;
- ispezione;
- editing;
- verifica finale.

Non comprende:

- tempo prima di START;
- pausa manuale;
- tempo con documento/tab in background.

Il tool salva automaticamente lo stato locale durante la review.

## Metrica frozen

Metrica primaria:

`HUMAN_REVIEW_SECONDS_PER_AUDIO_MINUTE`

Per ogni arm:

`activeReviewSeconds / (decodedDurationSeconds / 60)`

Per ogni family comparabile:

`relativeIncrease = (candidateSecondsPerAudioMinute / baselineSecondsPerAudioMinute) - 1`

Se il costo baseline è `0`, il pair non viene forzato con epsilon: è marcato non comparabile.

Aggregazione:

`MEDIAN` delle family comparabili.

Minimo protocollo:

`6` family comparabili.

Veto:

se la mediana dell'aumento relativo **supera** `+25%`, la vittoria automatica V2 viene bloccata.

Esattamente `+25%` non supera la soglia e quindi non attiva il veto.

## QA delle correzioni

Dopo la review, il finalizer confronta le boundary corrette con la Human Reference frozen:

- F1 boundary @0,5 s;
- F1 boundary @3 s;
- errori/omissioni;
- operazioni add/delete/move.

Questi dati sono diagnostici e non vengono mostrati durante il review.

## Decisione development

Il finalizer applica:

- se metric gate non è `V2_WINS_METRICALLY`: resta la decisione metrica già valida;
- se ci sono meno di 6 family comparabili: `INCONCLUSIVE`;
- se correction-cost median relative increase > `+25%`: `INCONCLUSIVE`;
- altrimenti: `V2_WINS`.

L'holdout può essere aperto soltanto dopo:

1. `V2_WINS` development;
2. candidate freeze;
3. verifica delle identità/digest richieste dal protocollo.

## Tool introdotti

- `audio-analysis-correction-cost-review-method-v1.json`
- `audio-analysis-correction-cost-review.py`
- `audio-analysis-correction-cost-review-test.py`

Il tool supporta:

- `prepare`
- `serve`
- `status`
- `finalize`

Gli audio, la chiave cieca privata, submission e report rimangono nel workspace `D:\FAME_NEURAL`, fuori da Git.

## Stato dopo questo checkpoint

- config-001: congelata;
- configuration budget: `1/8`;
- metric gate: `V2_WINS_METRICALLY`;
- correction-cost methodology: congelata;
- correction-cost results: non ancora osservati;
- official decision: `INCONCLUSIVE_REVIEW_PENDING`;
- config-002: chiusa;
- holdout: chiuso / non osservato;
- prossimo passo: preparare il package cieco e completare 8/8 family.
