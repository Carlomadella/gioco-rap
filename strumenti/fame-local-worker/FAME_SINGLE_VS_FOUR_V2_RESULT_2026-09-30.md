# FAME Single Agent vs Four-Role Network V2 — real result

Data: 30 settembre 2026.
Root locale: `FAME_SINGLE_VS_FOUR_V2_20260930_133018`.
Case: `single-vs-four-rubric-audit-generalization-v2`.

## Esito

Entrambi i bracci hanno chiuso `PROPOSED_FOR_HUMAN_REVIEW` con `ANSWER_NO` e required evidence coverage completa.

### Four-Role Network V3
- 4 model calls;
- evidence selezionata: U01, U02, U03, U04, U05;
- 6 claim estratti;
- 1 limitation finale;
- Anti-Bias issues: 0;
- elapsed cumulativo: circa 53.531 s;
- prompt_eval_count cumulativo: 6293;
- eval_count cumulativo: 6473;
- model duration excluding load: circa 43.283 s.

### Single agent
- 1 model call;
- evidence selezionata: U01, U03;
- 2 claim;
- 1 limitation;
- elapsed: circa 6.234 s;
- prompt_eval_count: 1028;
- eval_count: 933;
- model duration excluding load: circa 6.222 s.

## Revisione umana

Entrambe le risposte sono semanticamente corrette e mantengono le due distinzioni essenziali:
1. il sidecar non promuove la rete originale da 13/14 a 14/14 al primo tentativo;
2. il supporto contestuale resta distinto dalla prova diretta e non è una regola universale.

La rete non recupera alcun errore o omissione materiale della baseline.

La baseline è più parsimoniosa:
- 2 claim contro 6;
- usa soltanto U01 e U03;
- la rete aggiunge U04 e U05, dichiarate optional context, e usa tutti e sei i claim nell'Integrator.

Le informazioni aggiuntive della rete sono corrette ma non necessarie alla risposta. Classificazione: **secondo pareggio qualitativo; baseline più parsimoniosa e rete con overhead netto**.

## Costo relativo osservato

Sul caso V2, rispetto al single agent, la rete usa circa:
- 6.12x prompt token valutati;
- 6.94x output token valutati;
- 6.96x model time escluso load;
- 8.59x elapsed cumulativo.

L'ordine dei bracci era invertito rispetto al confronto V1, quindi il pattern di overhead non dipende soltanto dal fatto che la baseline fosse eseguita per prima.

## Stato dopo due confronti

Due casi reali consecutivi:
- entrambi: answer corretta nei due bracci;
- entrambi: required evidence coverage completa;
- nessun caso in cui la rete corregga un errore materiale della baseline;
- rete sistematicamente più costosa;
- nel secondo caso rete meno parsimoniosa nella selezione dell'evidenza.

Questo non dimostra ancora superiorità generale del single-agent: il campione è due casi e i task sono documentali relativamente circoscritti.

## Prossimo protocollo

Non scegliere un terzo caso dopo aver visto questi due risultati.

Preparare invece una batteria di più casi nuovi, congelati insieme prima di qualsiasi nuova inferenza, con ordine dei bracci alternato e aggregazione predefinita.

## Sicurezza

Restano:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
