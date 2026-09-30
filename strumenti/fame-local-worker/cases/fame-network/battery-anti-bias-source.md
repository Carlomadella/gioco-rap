# FAME Neural — Operational Anti-Bias subset

## Stato

Implementato come controllo della rete locale FAME Neural. Non modifica e non sostituisce il progetto `scientific-method-ai`.

Il porting è intenzionalmente minimo: riusa soltanto principi operativi utili a decisioni tecniche/documentali FAME, senza importare la cascade scientifica, i protocolli di literature search o la governance del progetto Scientific Method.

## Provenienza read-only

Repository sorgente letta: `mycolbraga/scientific-method-ai`, `main` osservato a `06a2cb8daa2654eee0ab6064e02e398d75e9ac8e`.

File consultati, senza scritture:
- `docs/parallel-research/OPERATIONAL_ANTI_BIAS_CHALLENGE.md` — blob `220b81def2b6907253d14e692250b0688de0501d`;
- `docs/BIAS_AND_SELECTION_RISK_REGISTER.md` — blob `cc76b1a617fdde140e13880c93d8980661932d34`;
- `docs/parallel-research/ANTI_BIAS_CHALLENGE_TEMPLATE.md` — blob `56b5f951ad3493585519b5363432c267a2bd1ac5`.

Il repository Scientific Method non è stato modificato da questo lavoro.

## Controlli portati in FAME

`fame_anti_bias.py` contiene sei controlli:

1. `FAME-AB-01 CONFIRMATION_CHALLENGE` — cercare evidenza/interpretazioni che restringano o smentiscano la tesi.
2. `FAME-AB-02 SELECTIVE_EVIDENCE` — cercare cherry-picking o limiti ignorati.
3. `FAME-AB-03 DEPENDENCY_DOUBLE_COUNTING` — evitare di contare come indipendenti evidenze con stessa origine.
4. `FAME-AB-04 HIDDEN_ASSUMPTIONS` — rendere esplicite assunzioni necessarie ma non dimostrate.
5. `FAME-AB-05 CLAIM_EVIDENCE_MATCH` — impedire claim più forti o più larghi delle prove.
6. `FAME-AB-06 ALTERNATIVE_FAILURE_LIMIT` — cercare alternative, casi contrari e failure limits.

Il challenger deve essere un contesto separato dal worker che ha prodotto i claim.

## Cosa NON è stato portato

Non sono stati importati:
- Domain Research Cascade R1/R2/R3/R4+;
- method-family map;
- search/source ledger scientifici;
- controlli language/region/indexing/database;
- taxonomy discovery;
- Anti-Bias R&D / Coverage track;
- Controller Assurance;
- governance/canonical publication;
- protocolli di ricerca scientifica non necessari alla rete FAME.

Questi restano responsabilità di `scientific-method-ai` e non vengono duplicati.

## Semantica fail-closed

Il challenger non può dichiarare `UNBIASED`, `BIAS_FREE` o `BIAS_ELIMINATED`.

Un issue `BLOCKING` deve produrre uno stato Anti-Bias bloccante. Nel flusso FAME finale:
- `REJECTED` dal verifier = il verifier dimostra che l'issue non regge;
- `UPHELD` = problema confermato, integrazione bloccata;
- `UNRESOLVED` = problema non risolto, integrazione bloccata.

`ANTI_BIAS_EVIDENCE_INSUFFICIENT` e `ANTI_BIAS_RESULTS_CONTRADICTORY` sono hard stop per l'integrazione.

Ogni risultato mantiene incertezza residua esplicita e richiede revisione umana.
