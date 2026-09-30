# FAME Single Agent vs Four-Role Network V4 — Battery V1 real result

Data: 30 settembre 2026.

## Protocollo

Quattro casi nuovi pre-registrati, ordine dei bracci bilanciato 2/2.

Budget massimo totale di generazione per caso:
- single-agent V2: 1 × 16384 token;
- Four-Role Network V4: 4 × 4096 token;
- totale massimo: 16384 in entrambi i bracci.

## Risultato automatico

- casi completati: 4/4;
- answer option corretta: 4/4 single-agent e 4/4 network;
- accepted: single-agent 3/4, network 2/4;
- required evidence coverage completa: single-agent 3/4, network 2/4;
- troncamenti: 0 per entrambi;
- model calls: single-agent 4, network 16;
- Anti-Bias issues network: 5;
- verifier rework network: 2.

Costi aggregati:
- prompt eval: single 2846, network 20218 (~7.10x);
- eval/output: single 3283, network 18109 (~5.52x);
- model duration excluding load: single ~22.19 s, network ~119.92 s (~5.40x);
- chiamate: 4x.

## Caso 1 — PF-NMF limited validation

Entrambi:
- answer corretta;
- ACCEPTED;
- required coverage completa U01/U02/U03.

Network:
- 1 issue Anti-Bias non bloccante;
- nessuna correzione materiale rispetto alla baseline;
- 4 chiamate contro 1.

Classificazione human review: **pareggio qualitativo; overhead network**.

## Caso 2 — subset+BIC packaging reject

Entrambi scelgono correttamente `ANSWER_PACKAGING_REJECT`, ma entrambi falliscono la required coverage.

Single-agent:
- seleziona U04/U05;
- manca U02 e U03;
- quindi non documenta integralmente 5/5 conclusioni corrette + preservation dello storico REJECTED secondo la rubric congelata.

Network:
- seleziona U01/U02/U03/U05;
- manca U04;
- U04 è l'unità che stabilisce esplicitamente che la causa del reject è un difetto di authoring/packaging e non un errore semantico;
- Verifier: 4 supported + 1 rework;
- Anti-Bias: 3 issue, 1 blocking;
- Integrator correttamente respinto per blocking issue non rigettata e insufficient final evidence.

Classificazione human review: **entrambi incompleti; nessun vantaggio architetturale**. Il fail-closed network evita di promuovere una risposta con la core causal evidence U04 non finalizzata, ma non recupera il task.

## Caso 3 — recovery salvage

Entrambi:
- `ANSWER_VALID_WITH_SALVAGE`;
- ACCEPTED;
- required coverage completa;
- U01–U05 selezionate.

Network:
- zero Anti-Bias issue;
- nessuna correzione materiale;
- 4 chiamate contro 1.

Classificazione human review: **pareggio qualitativo; overhead network**.

## Caso 4 — aggregate 9 run

Single-agent:
- ACCEPTED;
- `ANSWER_SEVEN_ACCEPTED`;
- U01/U02/U03;
- required coverage completa.

Network:
- stessa answer option corretta;
- seleziona in finale soltanto U03;
- manca U01: non supporta i conteggi 7/9 e i dettagli aggregati;
- manca U02: non supporta l'affermazione che il tempo umano non è stato misurato;
- Verifier: 1 supported + 1 rework;
- 1 Anti-Bias issue blocking;
- Integrator correttamente respinto per blocking issue non rigettata e insufficient final evidence.

Classificazione human review: **vantaggio single-agent sul caso**. Il network pipeline perde evidenza materiale durante Extractor/Verifier e non riesce a integrare una risposta che il single-agent completa correttamente.

## Interpretazione della batteria

La V4 ha corretto il precedente bug strutturale del Verifier: nessun failure `status + evidenceIds` ricompare.

Tuttavia, come architettura always-on, la rete non mostra un vantaggio sui quattro task documentali:
- 2 pareggi qualitativi;
- 1 caso in cui entrambi sono incompleti;
- 1 caso vinto dal single-agent;
- 0 casi vinti dalla rete;
- costi molto superiori per la rete.

Tutte le answer option sono corrette in entrambi i bracci, quindi la differenza non è una generale incapacità semantica della rete. Il limite osservato è soprattutto **evidence retention / fail-closed overconstraint lungo la pipeline**: il multi-ruolo può perdere o mettere in rework evidenza che il single-agent mantiene in una risposta completa.

Questi quattro casi non dimostrano superiorità generale del single-agent su ogni task. Insieme ai test precedenti, però, non giustificano la Four-Role Network come percorso obbligatorio per ogni QA documentale.

## Decisione architetturale successiva

Non introdurre V5 come nuova rete always-on.

Prossimo candidato: **adaptive escalation**:
1. single-agent V2 come percorso primario;
2. Four-Role Network V4 soltanto su trigger predefiniti;
3. trigger candidati: output truncation, host reject/coverage incompleta, answer insufficiente/incerta, o richiesta esplicita di review adversarial;
4. nessuna escalation se il single-agent chiude clean con coverage completa e senza trigger;
5. misurare quante chiamate/review vengono risparmiate e se il fallback recupera failure reali.

Questo preserva la robustezza osservata della decomposizione sui casi difficili senza pagarne il costo su ogni task.

## Consumo

Tutti i quattro case della batteria sono consumati in entrambi i bracci e non vanno rilanciati come nuovi first attempt.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
