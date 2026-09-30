# FAME Neural — Four-Role Network V4

## Motivo

V4 nasce da un failure contrattuale osservato nel matched-budget V1.

Nel case `matched-coordinator-reject-v1` il Verifier V3 ha prodotto una response completa e parseabile, ma l'host l'ha respinta con `VERIFIER_NONSUPPORTED_WITH_EVIDENCE`.

Il diagnostico read-only ha classificato il tentativo come:

`VERIFIER_STATUS_EVIDENCE_CONTRACT_CONTRADICTION`.

Il problema non era troncamento o trasporto. Il contratto V3 permetteva al modello di scegliere uno status negativo e contemporaneamente allegare evidenza/motivazione incompatibili con quello status.

I case storici restano consumati e non vengono rilanciati.

## Cambiamento strutturale

Il Verifier V4 non usa più:

`decisions[{ claimId, status, evidenceIds, reason }]`.

Usa tre contenitori separati:

- `supportedClaims`;
- `unsupportedClaims`;
- `claimsNeedingRework`.

Solo `supportedClaims` può contenere `evidenceIds`.

Gli altri due contenitori accettano soltanto:
- `claimId`;
- `reason`.

L'host verifica che ogni claim dell'Extractor compaia esattamente una volta nell'unione dei tre contenitori.

Il vecchio shape V3 viene respinto da V4.

## Integrator

L'Integrator può usare esclusivamente claim presenti in `supportedClaims`.

Claim presenti in `unsupportedClaims` o `claimsNeedingRework` non possono contribuire alla coverage finale.

Le regole Anti-Bias restano invariate.

## Parti non modificate

Restano invariati:
- Extractor;
- Anti-Bias challenger;
- answer options e expected answer host-only;
- modello/digest;
- num_ctx=32768;
- num_predict=4096 per ruolo;
- temperature=0;
- seed=42;
- no retry automatico;
- receipt e replay deterministico;
- flag di sicurezza.

## Fresh pilot V4

Case:

`runtime-contract-result-network-v4`.

Fonte congelata:
`CLINE_GPTOSS_TSUMUGI_CONTRACT_RESULT.md`,
commit sorgente `718a4a09d3f206f8f1d927b38d2dca81e5333c5c`.

Domanda:

> Il FAIL del primo runtime contract audit dimostra un errore semantico nell'audit Tsumugi e giustifica ritentare la stessa sessione fino a ottenere PASS?

La fonte distingue esplicitamente:
- assenza di un artefatto semantico da valutare;
- failure del tool layer prima della consegna;
- caso consumato da non ritentare per trasformarlo in PASS.

Expected answer host-only: `ANSWER_NO`.

## Verifica automatica pre-run

- 80 test Direct-QA: OK;
- 85 test FAME: OK.

Il fresh pilot non è ancora stato eseguito.
