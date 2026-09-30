# FAME Neural — Four-Role Network V1

## Obiettivo

Prima rete FAME Neural che usa più ruoli semanticamente distinti sullo stesso problema, mantenendo host deterministico e modello locale senza tool.

Ordine:

`EXTRACTOR -> ANTI-BIAS -> VERIFIER -> INTEGRATOR`

Le quattro scrivanie sono quattro chiamate separate a `gpt-oss:20b`; non sono quattro modelli caricati in parallelo.

## Ruoli

### Extractor

Legge domanda + evidenze congelate e produce:
- verdict provvisorio;
- claim atomici;
- evidence ID minimi.

Non vede i controlli Anti-Bias.

### Anti-Bias

Riceve output congelato dell'Extractor e applica soltanto i sei controlli definiti in [FAME_ANTI_BIAS.md](FAME_ANTI_BIAS.md).

Non modifica i claim. Produce applicability, issue, severità e rework necessario.

### Verifier

Rilegge evidenze originali, claim e challenge. Decide indipendentemente:
- `SUPPORTED`;
- `UNSUPPORTED`;
- `NEEDS_REWORK`.

Adjudica anche ogni issue Anti-Bias come `UPHELD`, `REJECTED` o `UNRESOLVED`.

### Integrator

Può usare soltanto claim `SUPPORTED`. Un issue Anti-Bias bloccante può essere superato solo se il Verifier lo ha `REJECTED`; se è `UPHELD` o `UNRESOLVED`, il risultato finale non passa.

## Host

`fame_four_role_network_v1.py`:
- congela package e codice al momento di `init`;
- non espone rubric host-only ai ruoli;
- massimo quattro chiamate, zero retry;
- salva request, response, result e receipt per ogni ruolo;
- riproduce request e validazione in `status`;
- non ritenta ruoli falliti/interrotti;
- blocca uso di claim non supportati;
- controlla coverage finale minima;
- mantiene `humanReviewRequired=true`;
- mantiene execution/training/production/independent-evaluation non autorizzati.

## Primo pilot congelato

Case:
`source-registry-readiness-network-v1`

Fonte:
`documentazione/fame-neural/SOURCE_REGISTRY.md`
al commit sorgente `8ab0ef8c828cd4da8dff2c0212c53b01f4c9dd9b`.

Domanda:
> Una fonte `green` è automaticamente pronta per il training simbolico commerciale, oppure servono ancora condizioni?

È un caso nuovo rispetto ai nove run Direct-QA v2.

La rubric finale resta host-only. Il pilot verifica sia il verdetto sia che i claim finali coprano le sezioni necessarie su stato green, diritti e processo operativo.

## Limiti

Un eventuale PASS dimostra soltanto che questa architettura a quattro ruoli ha funzionato su questo caso congelato.

Non dimostra:
- affidabilità generale;
- indipendenza statistica fra ruoli, perché usano lo stesso modello;
- risparmio di tempo umano;
- network production readiness;
- autorizzazione a training o modifiche FAME Neural.

La revisione umana resta obbligatoria.
