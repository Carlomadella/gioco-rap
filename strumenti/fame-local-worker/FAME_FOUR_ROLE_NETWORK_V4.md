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


## Esito primo fresh pilot reale

Root locale: `FAME_FOUR_ROLE_NETWORK_V4_20260930_165854`.

Case: `runtime-contract-result-network-v4`.

Esito:
- Extractor `ACCEPTED`;
- Anti-Bias `ACCEPTED`;
- Verifier `ACCEPTED`;
- Integrator `ACCEPTED`;
- `ANSWER_NO`;
- 4 model calls;
- zero errori host.

Il Verifier V4 ha prodotto:
- `supportedClaims`: C1, C2, C3, C4;
- `unsupportedClaims`: vuoto;
- `claimsNeedingRework`: vuoto.

Review umana: PASS. C1–C4 sono sostenuti; U01/U02/U03 coprono la required evidence. C4/U04 è contesto opzionale corretto ma non necessario.

Il case è consumato e non va riutilizzato come nuovo first attempt.

Report: [FAME_FOUR_ROLE_NETWORK_V4_FIRST_PILOT_RESULT_2026-09-30.md](FAME_FOUR_ROLE_NETWORK_V4_FIRST_PILOT_RESULT_2026-09-30.md).

## Probe semantico dei tre bucket

Il primo pilot reale ha esercitato soltanto `supportedClaims`. Per testare direttamente la correzione del failure storico è stato congelato un probe separato:

`verifier-v4-branch-probe-v1`.

Fonte:
`DIRECT_QA_TSUMUGI_CONTROLLED_RESULT_2026-09-23.md`.

Una sola chiamata al Verifier V4 riceve quattro claim host-frozen:
- C1: supportato;
- C2: non supportato;
- C3: formulazione troppo forte, deve andare in `claimsNeedingRework`;
- C4: supportato.

Expected host-only:
- `supportedClaims=[C1,C4]`;
- `unsupportedClaims=[C2]`;
- `claimsNeedingRework=[C3]`;
- `answerOptionId=ANSWER_MIXED`.

Il probe non esegue Extractor, Anti-Bias o Integrator e non ritenta casi consumati. Serve esclusivamente a verificare semanticamente la partizione strutturale V4.

Verifica automatica pre-run complessiva: 80 test Direct-QA + 91 test FAME, tutti OK.
