# FAME Verifier V4 branch probe v2 — result

Data: 30 settembre 2026.  
Root locale: `FAME_VERIFIER_V4_BRANCH_PROBE_V2_20260930_181355`.  
Case: `verifier-v4-branch-probe-v2`.

## Esito

`PROPOSED_FOR_HUMAN_REVIEW`.

Una sola chiamata al Verifier V4:
- result status: `ACCEPTED`;
- errors: nessuno;
- answer: `ANSWER_MIXED`;
- done_reason: `stop`.

## Partizione prodotta

`supportedClaims`:
- C1 con U01;
- C4 con U03.

`unsupportedClaims`:
- C2.

`claimsNeedingRework`:
- C3.

Questa partizione coincide esattamente con la target host-only congelata prima della chiamata.

## Revisione umana

PASS.

- C1 è direttamente sostenuto da U01.
- C4 è direttamente sostenuto da U03.
- C2 è correttamente non supportato: U02 afferma che esiste almeno un errore semantico reale, quindi contraddice il claim secondo cui non ce ne sarebbe alcuno.
- C3 è correttamente da riscrivere: U04 sostiene il nucleo secondo cui il worker one-shot resta utile come misura del primo tentativo, ma nega la conclusione più forte secondo cui sarebbe sufficiente come percorso operativo generale.

Il Verifier ha quindi distinto correttamente:
1. claim supportato;
2. claim contraddetto;
3. claim con nucleo valido ma overclaim da restringere.

## Significato architetturale

Il contratto V4 è ora verificato in reale su tutti e tre i bucket:
- `supportedClaims`;
- `unsupportedClaims`;
- `claimsNeedingRework`.

Il failure V3 `status + evidenceIds` non è riproducibile nella forma V4: i bucket negativi non ammettono evidenceIds nel loro schema.

Insieme al fresh full-network V4 4/4, questo probe chiude l'hardening specifico del Verifier V4.

Non dimostra affidabilità generale della rete su domini/task arbitrari; dimostra che il nuovo contratto del Verifier funziona sui casi reali/probe congelati eseguiti.

Il case è consumato e non va ritentato come nuovo first attempt.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
