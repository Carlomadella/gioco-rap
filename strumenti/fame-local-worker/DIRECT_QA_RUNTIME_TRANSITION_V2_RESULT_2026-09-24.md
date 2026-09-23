# Direct QA — Local Worker runtime transition v2 — first real run

Data: 2026-09-24.

Run operator-reported: `FAME_DIRECT_QA_NETWORK_V2_001 / local-worker-runtime-transition-v2 / attempt-1`.

## Esito

Il primo run reale del worker Direct QA v2 ha restituito:

- `status=VALIDATED_FOR_REVIEW`;
- `modelCalls=1`;
- `firstAttemptPass=true`;
- `acceptedAfterRepair=false`;
- `executionAuthorized=false`;
- nessuna seconda chiamata di repair.

La root locale e consumata e non deve essere rilanciata.

## Validazione host

La validazione riportata dall'operatore e:

- `accepted=true`;
- `errors=[]`;
- 5/5 conclusioni corrette;
- coverage `SUFFICIENT` per tutti i check positivi;
- nessun `precisionWarning`;
- nessun `unreviewedEvidenceId`;
- i due check negativi risultano corretti con coverage `NOT_REQUIRED`.

Dettaglio:

1. `CLINE_FAILURE_CLASSES` — corretta, coverage sufficiente con U02 + U03.
2. `DIRECT_RUNTIME_CONTRACT` — corretta, coverage sufficiente con U05.
3. `DIRECT_ISOLATION_RESULT` — corretta, coverage sufficiente con U08.
4. `CLINE_EXCLUSIVE_CAUSE` — correttamente non supportata.
5. `AUTONOMOUS_PRODUCTION_AUTHORIZED` — correttamente non supportata.

## Revisione umana

La review incollata dall'operatore e coerente con il package congelato
`local-worker-runtime-transition-v2`.

In particolare:

- distingue correttamente tool-layer failure e failure semantico nel percorso Cline;
- mantiene il contratto del runtime diretto come host-controlled e senza tool;
- riporta il PASS operator-reported del precedente isolamento diretto senza promuoverlo a prova causale esclusiva;
- non interpreta il checkpoint come autorizzazione a operare autonomamente in produzione.

Non emergono discrepanze tra review, validation e report.

## Metriche riportate

Dal report locale:

- `total_duration=20951396700`;
- `load_duration=11305544100`;
- `prompt_eval_count=1398`;
- `eval_count=1429`;
- `done_reason=stop`;
- `elapsedSeconds=20.983999999938533`.

Queste metriche descrivono il run locale riportato dall'operatore; la repository non contiene i byte completi della root locale e non certifica indipendentemente la sessione Ollama.

## Interpretazione

Questo checkpoint dimostra che il worker v2 puo completare un nuovo task documentale al primo tentativo mantenendo separati:

`attempt-1 -> validazione host -> review umana`

senza usare il repair.

Non dimostra affidabilita generale della rete, non dimostra causalita esclusiva di Cline e non autorizza produzione autonoma. Il valore del repair v2 resta ancora da osservare su un nuovo task che fallisca realmente il primo tentativo senza essere costruito apposta per fallire.

## Passo successivo

Non riusare `local-worker-runtime-transition-v2`.

Il prossimo checkpoint deve usare un nuovo task/documento, congelato prima dell'inferenza, mantenendo:

- first-attempt separato;
- massimo una correzione generica se necessaria;
- review umana;
- nessun riuso dei task consumati;
- nessun passaggio al filone audio/MIDI.
