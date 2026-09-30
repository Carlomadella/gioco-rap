# FAME Single Agent vs Four-Role Network — Matched-Budget V1 real result

Data: 30 settembre 2026.

## Protocollo

Quattro casi pre-registrati, ordine dei bracci bilanciato 2/2.

Budget massimo totale di generazione per caso:
- single-agent: 1 × 16384 token;
- Four-Role Network V3: 4 × 4096 token;
- totale massimo: 16384 in entrambi i bracci.

Stesso modello/digest, num_ctx, temperature, seed, domanda, evidenze e host rubric per ciascun caso.

## Automatic summary

- entrambi con answer attesa: 2/4;
- solo single-agent con answer attesa: 1/4;
- solo network con answer attesa: 1/4;
- nessuno: 0/4;
- single accepted: 3/4;
- network accepted: 3/4;
- required coverage completa: 3/4 in entrambi;
- single truncated cases: 1;
- network truncated cases: 0;
- model calls: single 4, network 15.

Nessun winner automatico.

## Caso 1 — matched-package-authoring-v1

Entrambi i bracci:
- ACCEPTED;
- ANSWER_NO;
- required coverage completa;
- evidence U02 + U04.

Single-agent: 1 call, 694 eval token.
Network: 4 call, 2922 eval token.

Classificazione provvisoria: pareggio qualitativo, rete più costosa.

## Caso 2 — matched-qa-review-v1

Network:
- ACCEPTED;
- ANSWER_NO;
- U02 + U03;
- required coverage completa;
- nessun troncamento.

Single-agent:
- ERROR / NEEDS_REVIEW;
- ValueError: Risposta incompleta;
- done_reason=length;
- eval_count=16384;
- content presente, 48707 caratteri;
- nessuna answer materializzata.

Questo è un vantaggio operativo osservato della decomposizione anche con budget massimo totale pareggiato: quattro episodi di decoding da 4096 completano il task mentre una singola generazione lunga da 16384 raggiunge il proprio limite.

Non dimostra che il reasoning single-agent sarebbe semanticamente errato: non è arrivato un JSON finale completo.

## Caso 3 — matched-cline-real-qa-v1

Entrambi:
- ACCEPTED;
- ANSWER_NO;
- required coverage completa;
- evidence U01 + U02 + U03.

Single-agent: 1 call, 743 eval token.
Network: 4 call, 3428 eval token.

Classificazione provvisoria: pareggio qualitativo, rete più costosa.

## Caso 4 — matched-coordinator-reject-v1

Single-agent:
- ACCEPTED;
- ANSWER_NO;
- U01 + U03;
- required coverage completa;
- nessun troncamento.

Network:
- NEEDS_REVIEW;
- Verifier REJECTED;
- errore host: VERIFIER_NONSUPPORTED_WITH_EVIDENCE;
- done_reason verifier=stop;
- nessun ruolo troncato;
- Integrator non eseguito.

Questo failure NON è classificato come troncamento o trasporto. Il Verifier ha prodotto una response completa e parseabile, respinta dal contratto host.

Il summary aggregato non conserva l'output completo del Verifier. Aggiunto `fame_network_attempt_diagnostic.py`, read-only, per distinguere:
- vera decisione semantica unsupported;
- contraddizione status/evidence/reason del Verifier;
- altro host validation reject.

Nessuna nuova chiamata modello è necessaria.

## Costi aggregati automatici

Single-agent:
- prompt_eval_count: 3293;
- eval_count: 18890;
- model duration excluding load: 124.302 s.

Network:
- prompt_eval_count: 18361;
- eval_count: 14824;
- model duration excluding load: 97.274 s;
- Anti-Bias issue count: 3.

La rete usa molti più prompt token e più chiamate, ma meno eval token e meno model time nel totale osservato perché una singola baseline ha consumato l'intero budget da 16384 token.

## Interpretazione provvisoria

Il matched-budget elimina il confondente del massimo totale di generazione, ma non produce un vincitore generale:
- 2 pareggi;
- 1 caso di robustezza operativa network su troncamento single-agent;
- 1 caso di failure network con single-agent corretto.

Prima di concludere sul quarto caso serve classificare l'output storico del Verifier.

Tutti i quattro case sono consumati e bloccati per nuovi init in entrambi i bracci.

## Sicurezza

Restano:
- humanReviewRequired=true;
- executionAuthorized=false;
- trainingAuthorized=false;
- networkProductionReady=false;
- independentEvaluation=false.
