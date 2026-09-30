# FAME Verifier V4 branch probe v1 — result

Data: 30 settembre 2026.

## Esito

`NEEDS_REVIEW`.

Una sola chiamata al Verifier V4.

Output:
- `supportedClaims`: C1, C4;
- `unsupportedClaims`: C2, C3;
- `claimsNeedingRework`: vuoto;
- `answerOptionId=ANSWER_INSUFFICIENT`;
- response completa, `done_reason=stop`.

Errori host:
- `PROBE_ANSWER_OPTION_MISMATCH`;
- `PROBE_REWORK_PARTITION_MISMATCH`;
- `PROBE_UNSUPPORTED_PARTITION_MISMATCH`.

## Revisione umana

Il reject NON indica un failure del contratto V4.

C1 è correttamente supportato da U01.

C2 è correttamente unsupported: U02 afferma esplicitamente che esiste almeno un errore semantico reale, quindi contraddice il claim secondo cui il reject sarebbe soltanto packaging.

C4 è correttamente supportato da U05.

C3 era stato pre-registrato erroneamente come `claimsNeedingRework`:

> Il worker one-shot v1 è inutile per qualsiasi uso QA.

U04 afferma invece esplicitamente che il worker one-shot v1 **resta utile come misura del primo tentativo**. Il claim è quindi direttamente contraddetto nel suo nucleo assoluto e `unsupportedClaims` è più appropriato di `claimsNeedingRework`.

Di conseguenza anche `ANSWER_MIXED`, definita dal probe come presenza obbligatoria di almeno un rework, era una target rubric non giustificata dalle unità congelate.

Classificazione: **probe authoring/rubric defect; V4 structural contract behaved correctly**.

## Cosa è stato verificato

Il bug V3 `status + evidenceIds` non ricompare:
- i claim supportati hanno evidenceIds;
- i claim negativi non hanno evidenceIds;
- la partizione è completa e non duplicata.

Il ramo `claimsNeedingRework` resta ancora da verificare semanticamente su un nuovo probe correttamente costruito.

Il case è consumato e non viene corretto/rilanciato.
