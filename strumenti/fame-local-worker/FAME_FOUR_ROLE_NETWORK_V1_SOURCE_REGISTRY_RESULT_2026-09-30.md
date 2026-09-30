# FAME Four-Role Network V1 — Source Registry pilot result

Data: 30 settembre 2026  
Root locale: `FAME_FOUR_ROLE_NETWORK_V1_20260930_114109`  
Case: `source-registry-readiness-network-v1`

## Esito formale

La rete si è fermata dopo il secondo ruolo.

- Extractor: `ACCEPTED`;
- Anti-Bias: `REJECTED`;
- Verifier: non eseguito;
- Integrator: non eseguito.

Il risultato V1 resta FAIL storico. Non viene promosso retroattivamente.

## Extractor

L'Extractor ha prodotto tre claim con evidenze valide:
- `green` richiede adapter/filter e provenance prima del training commerciale;
- lo stato `green` richiede verifica/evidenze/diritti commerciali;
- `green` non garantisce automaticamente `pipeline.currentSymbolic=true`.

Ha però emesso anche `provisionalVerdict=INSUFFICIENT`. Questa decisione anticipata non era necessaria al ruolo di estrazione ed è stata rimossa dal protocollo V2 per ridurre anchoring downstream.

## Anti-Bias

Il modello ha prodotto quattro issue, tutte `NONBLOCKING`, ma ha dichiarato:
`ANTI_BIAS_REWORK_REQUIRED`.

Il validator host ha quindi respinto correttamente la risposta con:
`ANTI_BIAS_REWORK_WITHOUT_BLOCKING_ISSUE`.

Sono inoltre emersi falsi positivi semantici:

1. selezione evidenze: contestata una limitazione su adapter/provenance che C1 dichiarava già;
2. double counting: il semplice riuso di U02 in due claim distinti è stato trattato come doppio conteggio, pur senza aggregazione di evidenze come corroborazioni indipendenti;
3. hidden assumption: è stata attribuita ai claim l'assunzione che adapter/provenance siano sempre disponibili dopo green, cosa che i claim non affermavano;
4. failure limit: sono state riproposte come omissioni condizioni già contenute nei claim.

## Causa

Failure di calibrazione del primo protocollo Anti-Bias FAME, con over-detection semantica del challenger. Il validator fail-closed ha impedito che il problema proseguisse verso Verifier e Integrator.

Non è un failure del Source Registry e non è una prova di incapacità generale del modello.

## Correzione successiva

La V1 non viene rilanciata.

La V2:
- rimuove il verdetto dall'Extractor;
- chiarisce che un controllo applicabile può produrre zero issue;
- vieta di trattare il riuso di una stessa unità come double counting automatico;
- vieta di trattare condizioni già esplicite nel claim come hidden assumptions/failure limits;
- rende coerente la semantica `overall` con la severità delle issue;
- sposta il primo verdetto al Verifier;
- rende i verdict specifici del case, non hardcoded nel runner.

La revisione umana resta richiesta. Nessuna autorizzazione a training, esecuzione o production readiness.
