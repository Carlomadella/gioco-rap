# Direct QA — Tsumugi controlled review v1 — first real run

Data: 2026-09-23.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_003 / tsumugi-controlled-review-v1 / attempt-1`.

## Esito

Il task ha restituito `REJECTED` con una sola chiamata al modello.

Validazione host:

- `GATE_WITH_PARTIAL_CAPABILITY`: conclusione corretta, coverage sufficiente;
- `TIMBRE_HYPOTHESIS_LIMIT`: conclusione corretta, coverage sufficiente;
- `TOPK_PAIR_CONFIDENCE_LIMIT`: conclusione corretta, coverage insufficiente;
- `SYNTHETIC_DIAGNOSTIC_SCOPE`: conclusione errata;
- `REAL_EASY_ALREADY_OPEN`: conclusione corretta, nessuna evidence richiesta.

Totale: 4/5 conclusioni corrette. A differenza del reject subset+BIC, qui esiste almeno un errore semantico reale, oltre a una omissione di copertura evidence.

Il risultato resta consumato e non viene ritentato con il worker v1.

## Conseguenza architetturale

Il worker one-shot v1 resta utile come misura del primo tentativo, ma non e sufficiente come percorso operativo se ogni singola omissione blocca l'intero incarico.

E stato quindi introdotto un worker v2 separato che:

1. conserva integralmente attempt-1;
2. se il validatore rifiuta per contenuto/coverage, effettua al massimo una seconda chiamata nello stesso run;
3. invia soltanto categorie generiche di errore, senza check ID, rubriche, target o risposta attesa;
4. distingue `VALIDATED_FOR_REVIEW` al primo colpo da `VALIDATED_FOR_REVIEW_AFTER_REPAIR`;
5. non ritenta errori di preflight/trasporto e non rende rieseguibile una desk consumata.

La seconda chiamata e recovery operativo, non una nuova independent evaluation.
