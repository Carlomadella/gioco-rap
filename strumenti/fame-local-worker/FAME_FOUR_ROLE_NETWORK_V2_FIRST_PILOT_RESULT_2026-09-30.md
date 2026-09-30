# FAME Four-Role Network V2 — primo pilot reale

Data: 30 settembre 2026  
Root locale: `FAME_FOUR_ROLE_NETWORK_V2_20260930_120959`  
Case: `agent-network-readiness-network-v2`

## Esito formale

`NEEDS_REVIEW` per errore infrastrutturale al Verifier.

- Extractor: `ACCEPTED`;
- Anti-Bias: `ACCEPTED`;
- Verifier: `ERROR` con `HTTP Error 400: Bad Request`;
- Integrator: non eseguito;
- chiamate semantiche completate: 2.

Il risultato resta storico e non viene promosso retroattivamente.

## Extractor

Ha prodotto tre claim coerenti col recap congelato:
- 3/3 PASS first-attempt nel task demo;
- il recap non dimostra che Qwen sia il modello migliore;
- il recap non dimostra affidabilità generale.

Il nuovo protocollo non ha chiesto un verdetto all'Extractor.

## Anti-Bias

Il challenger calibrato ha chiuso:
`ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE`.

Tutti e sei i controlli sono stati valutati senza issue inventati. In particolare il riuso di U04 fra claim distinti è stato riconosciuto come non equivalente a double counting.

Questo conferma sul pilot reale che la correzione di calibrazione successiva alla V1 ha rimosso il failure mode osservato nel Source Registry pilot.

## Verifier — causa dell'HTTP 400

Il challenge conteneva `issues: []`.

Il builder V2 generava comunque `antiBiasResolution` con lunghezza zero e, dentro lo schema dell'item, `issueId.enum=[]`.

Questa forma contiene un enum vuoto ed è stata rifiutata da Ollama prima di una risposta del modello. Il conteggio di due chiamate semantiche completate è coerente con un failure di schema/trasporto al terzo ruolo.

## Fix

Il Verifier schema ora:
- omette completamente `antiBiasResolution` quando non esistono issue Anti-Bias;
- lo richiede soltanto quando esistono issue reali;
- evita quindi qualsiasi `enum: []`.

Aggiunta regressione esplicita che verifica l'assenza di enum vuoti.

## Recovery

Aggiunto `fame_four_role_network_v2_recovery.py`.

Il recovery:
- accetta soltanto il pilot V2 atteso;
- verifica receipt degli artefatti originali;
- richiede Extractor e Anti-Bias `ACCEPTED`;
- richiede che il Verifier storico sia un `HTTP 400` senza `response.json`;
- verifica che il vecchio request contenga esattamente il pattern `enum: []`;
- copia gli output validi in una nuova root;
- esegue al massimo due nuove chiamate: Verifier e Integrator;
- non rilancia Extractor o Anti-Bias;
- mantiene revisione umana obbligatoria e tutte le autorizzazioni chiuse.

## Verifica automatica

GitHub Actions `Verifica FAME local worker`: 80 test Direct-QA + 30 test FAME network/Anti-Bias/recovery, tutti OK.
