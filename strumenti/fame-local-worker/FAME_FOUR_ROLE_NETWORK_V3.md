# FAME Neural — Four-Role Network V3

## Motivo

V3 nasce dopo due failure preservati della V2:
1. HTTP 400 al Verifier causato da `enum: []` quando Anti-Bias non trovava issue;
2. recovery V2 con Verifier semanticamente incoerente: motivazioni che dichiaravano i claim supportati ma label `UNSUPPORTED`, più verdict complessivo ambiguo.

Nessuno dei due risultati viene promosso retroattivamente.

## Flusso

`EXTRACTOR -> ANTI-BIAS -> VERIFIER -> INTEGRATOR`

Extractor e Anti-Bias restano separati. Il primo verdetto complessivo resta responsabilità del Verifier.

## Contratto claim del Verifier

Le vecchie label `SUPPORTED/UNSUPPORTED/NEEDS_REWORK` sono sostituite da:
- `EVIDENCE_SUPPORTS_CLAIM`;
- `EVIDENCE_DOES_NOT_SUPPORT_CLAIM`;
- `CLAIM_NEEDS_REWORK`.

La semantica è scritta direttamente nel system prompt.

## Contratto risposta complessiva

Il case definisce `answerOptions`, ognuna con:
- `optionId`;
- `meaning` testuale.

Per il pilot V3:
- `ANSWER_YES`: il recap stabilisce entrambe le conclusioni;
- `ANSWER_NO`: il recap non stabilisce entrambe e mantiene limiti/verifiche;
- `ANSWER_INSUFFICIENT`: le evidenze non bastano a decidere.

Il modello vede tutte le opzioni con il loro significato ma non vede `expectedAnswerOptionId`, che resta host-only.

L'Extractor non vede le opzioni di risposta per evitare anchoring.

## Evidence gate

La coverage finale minima usa solo evidenza necessaria alla domanda:
- una unità fra U02/U04 per i risultati osservati;
- U03 per il limite esplicito sulla superiorità del modello.

U01 e U05 sono contesto opzionale. U05 descrive il prossimo esperimento e non è necessario per stabilire la risposta alla domanda.

## Continuazione bounded

`fame_four_role_network_v3_continuation.py` può partire solo se verifica la catena storica:
- root V2 originale con Extractor e Anti-Bias accettati;
- recovery V2 derivato dalla stessa root;
- Verifier recovery `REJECTED` con `VERIFIER_NONSUPPORTED_WITH_EVIDENCE`.

Riusa soltanto Extractor + Anti-Bias e consente massimo due nuove chiamate V3: Verifier e Integrator.

È un nuovo protocollo diagnostico, non una correzione retroattiva del run V2.

## Sicurezza

Restano invariati:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
