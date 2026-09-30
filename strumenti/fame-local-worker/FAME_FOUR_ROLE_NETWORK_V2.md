# FAME Neural — Four-Role Network V2

## Perché V2

Il primo pilot V1 si è fermato al ruolo Anti-Bias. Il validator ha funzionato, ma il challenger ha sovra-segnalato problemi e il runner era ancora troppo legato al caso Source Registry.

La V2 è un nuovo protocollo; il pilot V1 resta storico e non viene ripetuto.

## Flusso

`EXTRACTOR -> ANTI-BIAS -> VERIFIER -> INTEGRATOR`

### Extractor

Produce soltanto claim atomici + evidence ID. Non emette più un verdetto.

### Anti-Bias

Usa il sottoinsieme operativo FAME definito in `FAME_ANTI_BIAS.md`.

Calibrazione aggiuntiva:
- un controllo `APPLICABLE` può produrre zero issue;
- prima di emettere un issue deve rileggere il claim esatto;
- riuso della stessa unità in claim diversi non equivale automaticamente a double counting;
- una condizione già dichiarata nel claim non è una hidden assumption né un failure limit omesso;
- zero issue => `ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE`;
- soli issue `NONBLOCKING` => `ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS`;
- `ANTI_BIAS_REWORK_REQUIRED` richiede almeno un issue `BLOCKING`.

### Verifier

È il primo ruolo che sceglie un verdetto. Verifica claim e challenge contro le evidenze originali.

### Integrator

Può usare soltanto claim `SUPPORTED`. La rubric host verifica verdict finale e coverage minima.

## Generalizzazione del runner

I verdict ammessi appartengono al package del singolo case. Non esistono più verdict Source-Registry-specifici hardcoded nel runner.

Rubric ed expected verdict restano host-only.

## Secondo pilot congelato

Case: `agent-network-readiness-network-v2`.

Fonte: `documentazione/fame-neural/FAME_LOCAL_AGENT_NETWORK_RECAP_2026-09-23.md` al commit sorgente `5530c2649ddda83a07511f8e0549d4ccf45723fe`.

Domanda: il recap dimostra che Qwen3-Coder 30B è il modello migliore per la rete e che il sistema è già affidabile in generale?

Verdict ammessi: `ESTABLISHED`, `NOT_ESTABLISHED`, `INSUFFICIENT_EVIDENCE`.

Il case usa un documento diverso dal pilot V1.

## Limiti

Un eventuale PASS V2 resta una singola prova della rete a quattro ruoli. Non dimostra affidabilità generale, indipendenza statistica fra ruoli o production readiness.
