# Rete di agenti locali — stato operativo

Aggiornamento: 30 settembre 2026. Stato della rete verificato fino al commit `4c60c18425fc56a40b476ddfffded55ecb968141`; Direct QA CI PASS (55 test).

## Obiettivo e perimetro

Costruire worker stretti coordinati da codice deterministico, con GPT-OSS 20B via Ollama locale. Runtime diretto; Cline escluso dal percorso operativo corrente. Scrivanie, memoria, contratti, validazione e coordinamento appartengono a questo filone.

I documenti FAME Neural sono input di QA. Leggere un prossimo passo nel documento non autorizza il worker o l'assistente a eseguirlo. In particolare P5/P6 sono fasi Audio→MIDI, non fasi della rete.

## Risultati registrati

| Incarico | Risultato v1 | Limite |
| --- | --- | --- |
| PF-NMF, root 001 | VALIDATED_FOR_REVIEW, una chiamata | Risultato operator-reported; non prova affidabilità generale |
| subset+BIC, root 002 | REJECTED, 5/5 conclusioni corrette e coverage sufficiente | Heading U13 citato e non ammesso: difetto di packaging |
| Tsumugi controlled, root 003 | REJECTED, 4/5 conclusioni corrette | Una conclusione errata e una copertura insufficiente |
| Tsumugi score diagnostic, v2 real run | VALIDATED_FOR_REVIEW, first-attempt PASS, 1 chiamata | Singolo task documentale; non prova affidabilità generale |

Vedi i tre DIRECT_QA_*_RESULT_2026-09-23.md. I casi sono consumati; non ripeterli per ottenere un nuovo primo tentativo.

## Confine confermato dall'operatore

Checkpoint pertinente alla rete: `cdea2227a4a71906c48b97d888e707a787cecc3e` (validator-guided direct QA recovery). Il commit successivo `061f87cb76c6432e7eb2cd80b91dfb6f74e22172` passa al runner Tsumugi Audio→MIDI ed è fuori dal mandato della rete. Questa separazione conserva lo storico senza usare le successive decisioni musicali come avanzamento degli agenti.

## Implementazione disponibile

- v1: direct_qa_worker.py e direct_qa_queue.py, mantenuti per le prove storiche.
- v2: direct_qa_worker_v2.py e direct_qa_queue_v2.py, introdotti nel commit cdea2227.
- v2 permette al massimo una correzione con categorie generiche del validatore, conservando il primo tentativo.
- Un PASS dopo correzione va distinto da un PASS iniziale.
- Il primo run reale v2 è registrato il 30 settembre 2026 su `tsumugi-score-diagnostic-review-v1`: `VALIDATED_FOR_REVIEW` al primo tentativo, una chiamata, nessun repair. È una prova singola, non validazione generale.
- La rubrica specifica è preparata dall'operatore/host: il sistema non è ancora un validatore semantico universale o una rete autonoma di sviluppo.

## Hardening v2 verificato — 30 settembre 2026

Commit `c3a1e2465f08dd6e20c8d576ca3de66269f16b51`:
- `direct_qa_worker_v2.py` rifiuta in init i tre task già consumati: `pfnmf-review-v1`, `subset-bic-review-v1`, `tsumugi-controlled-review-v1`;
- worker e queue v2 non hanno più un task consumato come default: `--task` / `--tasks` sono espliciti;
- la queue pre-valida tutti i task prima di creare la root, evitando root parziali se compare un task consumato;
- il guard authoring non è più un loop vuoto: controlla i package non grandfathered presenti;
- è congelato il nuovo task `tsumugi-score-diagnostic-review-v1`, costruito sul report già persistito al commit `022ef352e00cfa0aca7a3dae9a9478c8c3c49626`. È solo QA documentale e non apre audio/P6/training.

Commit CI `23171593992036224d9e02dad351011db302b5ab`:
- workflow dedicato `Verifica FAME local worker`;
- Python 3.10;
- comando `python -m unittest discover -s . -p "test_direct_qa_*.py" -q`;
- run GitHub Actions `36676247028`: `success`.

Il primo run reale v2 con Ollama è stato eseguito nella root `FAME_DIRECT_QA_NETWORK_V2_20260930_081223`: first-attempt PASS, una chiamata, nessun repair. Risultato dettagliato in [DIRECT_QA_TSUMUGI_SCORE_DIAGNOSTIC_V2_RESULT_2026-09-30.md](DIRECT_QA_TSUMUGI_SCORE_DIAGNOSTIC_V2_RESULT_2026-09-30.md).

Durante il run è emerso un bug CLI: `--task` / `--tasks` erano obbligatori anche per `run/status`. Il codice corrente li richiede solo per `init`; `run/status` leggono il task dalla root congelata.

## Prossimo passo della rete

1. Trattare `tsumugi-score-diagnostic-review-v1` come consumato: non rieseguirlo in una nuova root per ottenere un altro first attempt.
2. Il secondo task `tsumugi-v1-architecture-failure-review-v1` è congelato sul controlled score-diagnostic failure del 23 settembre, con source snapshot completo e rubrica fissata prima del run.
3. Il secondo run reale è consumato: `REJECTED` dopo 2 chiamate, ma con 5/5 conclusioni corrette in entrambi i tentativi; il reject è stato classificato come falso negativo di rubrica perché `U04` da sola copriva già l'intera affermazione.
4. Valutare il costo umano di review prima di ampliare ruoli. Non avviare elaborazioni musicali per procurarsi altri task.

La separazione documentale non esegue questi passi e non certifica nuovi test o inferenze.

## Confini operativi

Per un incarico sulla rete si modificano strumenti/fame-local-worker e la sua documentazione. La consultazione read-only di report musicali già registrati è ammessa; cambiare runner audio, selezionare beat, prenotare split o far ascoltare nuovi MIDI richiede un incarico Audio→MIDI esplicito.

Le fonti congelate dei task restano immutate. Non usare il CURRENT_STATE generale come coda automatica di comandi. Nessun risultato del worker autorizza esecuzione musicale, training, batch131 o produzione.

Guida tecnica e storico dei comandi: [DIRECT_QA_WORKER.md](DIRECT_QA_WORKER.md). I comandi delle root 001–003 sono storici, non istruzioni da rilanciare.


## Verifica post-run

Il commit `04a4e9bddd5ce41f686faf0521aedd5a451febe7` registra il primo run reale v2 e corregge la CLI `run/status`. GitHub Actions `Verifica FAME local worker`, run `36677541885`, ha completato con `success`: 47 test, `OK`.


## Secondo task v2 congelato

`tsumugi-v1-architecture-failure-review-v1` usa esclusivamente il report storico `OWNED_BEATS_AUDIO_TO_MIDI_P5_TSUMUGI_SCORE_DIAGNOSTIC_CONTROLLED_FAIL_2026-09-23.md` al commit `46ad39eca673e1d97376c776344d64b294b346b7`. Verifica failure prima del publish, confine architetturale V1/V2, significato di `selected_pair_count`, presupposto diagnostico non verificato, replacement scope e controllo negativo sulle autorizzazioni musicali. Il task precedente `tsumugi-score-diagnostic-review-v1` è ora bloccato in `CONSUMED_TASKS` e non può essere inizializzato di nuovo dalla v2.


## Verifica secondo task v2

Commit `c803e05380d56f3c06a7253a4ca66c4c25bcebbc`: secondo task congelato, primo task v2 aggiunto ai consumati, test v2 riallineati sul nuovo task. GitHub Actions `Verifica FAME local worker`, run `36677890055`: `success`, 51 test, `OK`.


## Esito secondo run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_082657`. Il task `tsumugi-v1-architecture-failure-review-v1` ha chiuso `REJECTED` dopo attempt-1 + repair. Entrambi i tentativi avevano 5/5 conclusioni corrette; l'unico errore era `UNVERIFIED_ARCH_ASSUMPTION:INSUFFICIENT_EVIDENCE`. Il modello ha scelto `U04` in entrambi i tentativi; verifica manuale della fonte e del package mostra che `U04` contiene già tutta la proposizione richiesta. Classificazione: false negative di packaging/rubric, non errore semantico del worker. Nessun rerun.

Il task è aggiunto ai `CONSUMED_TASKS`. Le regressioni v2 usano ora una fixture test-only separata, così i task reali possono restare immutabili e consumati.


## Terzo task v2 congelato

È preparato `p2-measurement-export-review-v1` sul report P2 measurement/export audit al commit `1c71cefc2756a83002963ddf5f0bd25835755c96`. Il task verifica scope del cohort consumato, equivalenza JSON↔MIDI, comportamento temporale del renderer v1, limiti causali del PASS P2 e controllo negativo su training/batch131/task-data readiness. Ogni check positivo usa una sola unità semanticamente autosufficiente per evitare il false negative di coverage emerso nel secondo run.


## Verifica terzo task v2

Commit `4c60c18425fc56a40b476ddfffded55ecb968141`: terzo task `p2-measurement-export-review-v1` congelato con regola di evidenza minima sufficiente. GitHub Actions `Verifica FAME local worker`, run `36679412661`: `success`, 55 test, `OK`.


## Esito terzo run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_084912`. Il task `p2-measurement-export-review-v1` ha chiuso `VALIDATED_FOR_REVIEW` al primo tentativo con una sola chiamata. Tutti i 5 check sono corretti, con coverage sufficiente sui quattro positivi, zero precision warning e zero evidenze non revisionate. `elapsedSeconds` circa 16.422 s; 1832 prompt token valutati e 1173 output token valutati.

Il task è ora consumato e aggiunto ai `CONSUMED_TASKS`. Risultato dettagliato in [DIRECT_QA_P2_MEASUREMENT_EXPORT_V2_RESULT_2026-09-30.md](DIRECT_QA_P2_MEASUREMENT_EXPORT_V2_RESULT_2026-09-30.md).


## Quarto task v2 congelato

È preparato `coordinator-architecture-review-v1` sul documento `strumenti/fame-local-worker/COORDINATOR.md` al commit `b16ef607905d26bf12c9ac8fa2a3b0c481bb4574`. È il primo task v2 non basato su un report Audio→MIDI: verifica scopo del coordinatore, isolamento delle scrivanie, distinzione fra modello e host, limiti inferenziali del nuovo protocollo, semantica degli stati globali e controllo negativo sulle autorizzazioni operative. La fonte completa è congelata e i check positivi usano unità semanticamente autosufficienti.


## Verifica quarto task v2

Commit `f932bfb2e6357eff93a5e816fb8dc7abfd4e0b0e`: `coordinator-architecture-review-v1` congelato sul documento della rete `COORDINATOR.md`, con titolo unito alla prima unità semantica per evitare heading-only evidence. GitHub Actions `Verifica FAME local worker`, run `36680868865`: `success`, 58 test, `OK`.


## Esito quarto run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_085819`. `coordinator-architecture-review-v1` ha chiuso formalmente `REJECTED` dopo due chiamate. Attempt-1 ha saturato il precedente budget `num_predict=2048` con `done_reason=length`; attempt-2 ha prodotto 5/5 conclusioni corrette e coverage sufficiente, ma è stato respinto per l'evidence extra U06 su `COORDINATOR_SCOPE`. U06 era pertinente ai limiti operativi: classificazione precision false negative del validator. Il task è consumato e non viene ritentato.

Hardening commit `ee64500421a93a80c10d50d0d737eb63a0daef51`: `num_predict=4096`, task consumato bloccato, salvage deterministico del surplus evidence quando required coverage e conclusione sono già corrette. GitHub Actions `Verifica FAME local worker`, run `36682450395`: 59 test, OK.

Risultato: [DIRECT_QA_COORDINATOR_ARCHITECTURE_V2_RESULT_2026-09-30.md](DIRECT_QA_COORDINATOR_ARCHITECTURE_V2_RESULT_2026-09-30.md).

## Quinto task v2 congelato

È preparato `rubric-audit-semantics-review-v1` su `RUBRIC_AUDIT.md` al commit `5530c2649ddda83a07511f8e0549d4ccf45723fe`. Il task verifica distinzione tra SEMANTIC_FAIL e incapacità del modello, evidenza contestuale vs diretta, preservazione dello storico nel sidecar, disciplina del prossimo protocollo e controllo negativo sulla promozione retroattiva.


## Esito quinto run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_092045`. `rubric-audit-semantics-review-v1` ha chiuso `VALIDATED_FOR_REVIEW` al primo tentativo con una sola chiamata. Tutti i 5 check sono corretti; i quattro positivi hanno coverage sufficiente; zero errori, zero precision warning, zero evidence ID non revisionati. Il salvage host-side non è stato necessario.

Metriche: `elapsedSeconds` circa 17.703 s, `prompt_eval_count=2824`, `eval_count=1275`, `done_reason=stop`. Il task è consumato e bloccato da nuove inizializzazioni.

Risultato: [DIRECT_QA_RUBRIC_AUDIT_SEMANTICS_V2_RESULT_2026-09-30.md](DIRECT_QA_RUBRIC_AUDIT_SEMANTICS_V2_RESULT_2026-09-30.md).

## Sesto task v2 congelato

È preparato `package-authoring-rules-review-v1` su `DIRECT_QA_PACKAGE_AUTHORING.md` al commit `4c60c18425fc56a40b476ddfffded55ecb968141`. Verifica unità semantiche, frozen-run rule, checklist pre-run, minimal sufficient evidence e controllo negativo sul retuning/rerun di task consumati.


## Verifica sesto task v2

Checkpoint `775bdb3fcd0edb012a3626e87e1be3ac15467a8e`: `package-authoring-rules-review-v1` congelato prima di qualsiasi chiamata reale. GitHub Actions `Verifica FAME local worker`, run `36683638626`: `success`, 65 test, `OK`.


## Esito sesto run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_092711`. `package-authoring-rules-review-v1` ha chiuso `VALIDATED_FOR_REVIEW` al primo tentativo con una sola chiamata. Tutti i 5 check sono corretti; i quattro positivi hanno coverage sufficiente; zero errori, zero precision warning, zero evidence ID non revisionati. Il salvage host-side non è stato necessario.

Metriche: `elapsedSeconds` circa 11.218 s, `prompt_eval_count=1205`, `eval_count=668`, `done_reason=stop`. Il task è consumato e bloccato da nuove inizializzazioni.

Risultato: [DIRECT_QA_PACKAGE_AUTHORING_RULES_V2_RESULT_2026-09-30.md](DIRECT_QA_PACKAGE_AUTHORING_RULES_V2_RESULT_2026-09-30.md).

## Settimo task v2 congelato

È preparato `recovery-protocol-review-v1` su `RECOVERY.md` al commit `5530c2649ddda83a07511f8e0549d4ccf45723fe`. Verifica preservazione del first pass, recovery bounded in due sottoincarichi, assenza di retry automatico, semantica degli stati recovery e controllo negativo su generalizzazione/training. La rubrica usa U04 come evidenza minima sufficiente per l'invarianza del first pass; U01/U02 sono solo benign context.


## Verifica settimo task v2

Checkpoint `cfb5ca113f551698e922e2709395a58a8ad3e74b`: `recovery-protocol-review-v1` congelato prima di qualsiasi chiamata reale. GitHub Actions `Verifica FAME local worker`, run `36684201024`: `success`, 69 test, `OK`.


## Esito settimo run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_093655`. `recovery-protocol-review-v1` ha chiuso `VALIDATED_FOR_REVIEW` al primo tentativo con una sola chiamata. Tutti i 5 check hanno conclusione corretta e coverage sufficiente sui positivi.

Il run ha richiesto il salvage host-side su due finding già sufficientemente coperte:
- `RECOVERY_BOUNDED_TWO_SUBTASKS`: rimosso U03;
- `NO_AUTOMATIC_RETRY_OR_RECREATION`: rimosso U02.

`RECOVERY_PRESERVES_FIRST_PASS` mantiene precision warning per U01 e U02, entrambi benign context dichiarati. Nessun evidence ID non revisionato. Quindi il PASS è semanticamente valido ma con selezione evidence meno precisa dei run quinto e sesto.

Metriche: `elapsedSeconds=18.875`, `prompt_eval_count=2203`, `eval_count=1715`, `done_reason=stop`. Il task è consumato e bloccato da nuove inizializzazioni.

Risultato: [DIRECT_QA_RECOVERY_PROTOCOL_V2_RESULT_2026-09-30.md](DIRECT_QA_RECOVERY_PROTOCOL_V2_RESULT_2026-09-30.md).

## Ottavo task v2 congelato

È preparato `gptoss-diagnostic-semantics-review-v1` su `GPTOSS_DIAGNOSTIC.md` al commit `6da4fd1666ea4d82a331e597b3004068d08a567f`. Verifica unica variazione think=low, distinzione OUTPUT_TRUNCATED vs SEMANTIC_FAIL, significato di ERROR operativo e controllo negativo che il troncamento provi un errore semantico.


## Verifica ottavo task v2

Checkpoint `2f593f180470ba5191140873f045c3023f4f8b03`: `gptoss-diagnostic-semantics-review-v1` congelato prima di qualsiasi chiamata reale. GitHub Actions `Verifica FAME local worker`, run `36685205613`: `success`, 72 test, `OK`.


## Esito ottavo run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_103151`. `gptoss-diagnostic-semantics-review-v1` ha chiuso `VALIDATED_FOR_REVIEW` al primo tentativo con una sola chiamata. Tutti i 5 check hanno conclusione corretta e coverage sufficiente sui positivi.

Il salvage host-side è intervenuto una sola volta:
- `OUTPUT_TRUNCATED_NOT_SEMANTIC`: rimosso U01.

Nessun precision warning residuo e nessun evidence ID non revisionato. Il PASS è semanticamente valido e quasi raw-clean.

Metriche: `elapsedSeconds` circa 16.843 s, `prompt_eval_count=1703`, `eval_count=1179`, `done_reason=stop`. Il task è consumato e bloccato da nuove inizializzazioni.

Risultato: [DIRECT_QA_GPTOSS_DIAGNOSTIC_SEMANTICS_V2_RESULT_2026-09-30.md](DIRECT_QA_GPTOSS_DIAGNOSTIC_SEMANTICS_V2_RESULT_2026-09-30.md).

## Nono task v2 congelato

È preparato `qa-transfer-protocol-review-v1` su `QA_TRANSFER.md` al commit `5f29502092c9b641117e595a70a4489e651e66be`. Verifica che il secondo caso non sia cieco rispetto ai preparatori, che PASS transfer sia più stretto di `VALIDATED_FOR_REVIEW`, che il salvage non corregga errori semantici o coverage mancante, che il costo umano non venga assunto e che un difetto della rubrica non promuova retroattivamente la prova.


## Verifica nono task v2

Checkpoint `5b7d7eaad0338ee1905c51cb9d593539fc1c2f94`: `qa-transfer-protocol-review-v1` congelato prima di qualsiasi chiamata reale. GitHub Actions `Verifica FAME local worker`, run `36690720093`: `success`, 75 test, `OK`.


## Esito nono run reale v2

Root locale `FAME_DIRECT_QA_NETWORK_V2_20260930_103658`. `qa-transfer-protocol-review-v1` ha chiuso `VALIDATED_FOR_REVIEW` al primo tentativo con una sola chiamata. Tutti i 5 check hanno conclusione corretta; i quattro positivi hanno coverage sufficiente; zero errori, zero precision warning, zero evidence ID non revisionati.

Non sono presenti `droppedEvidence` né `hostSalvageApplied`: è un first-attempt raw-clean PASS.

Metriche: `elapsedSeconds` circa 19.297 s, `prompt_eval_count=2006`, `eval_count=1252`, `done_reason=stop`. Il task è consumato e bloccato da nuove inizializzazioni.

Risultato: [DIRECT_QA_TRANSFER_PROTOCOL_V2_RESULT_2026-09-30.md](DIRECT_QA_TRANSFER_PROTOCOL_V2_RESULT_2026-09-30.md).

## Aggregazione run v2

Aggiunto `direct_qa_v2_aggregate.py`: legge root storiche v2 e verifica le receipt degli artefatti senza rieseguire vecchi run con il codice attuale. Distingue first-pass raw-clean, first-pass con salvage, accepted-after-repair, reject/error, troncamenti, warning, evidence scartata, chiamate e tempi. Non converte classificazioni storiche manuali in PASS e non dichiara tempo umano non misurato.


## Verifica aggregatore v2

Checkpoint `a3ef4ac1151cdf1cfc00b1866042ef33b36b3a31`: aggregatore storico e relativi test integrati. GitHub Actions `Verifica FAME local worker`, run `36691459244`: `success`, 79 test, `OK`.


## Correzione input aggregatore v2

Il primo tentativo operativo dell'aggregatore ha evidenziato un mismatch d'interfaccia: il comando documentato passava root di queue `FAME_DIRECT_QA_NETWORK_V2_*`, mentre il codice cercava `desk.json` direttamente nella root. Corretto `direct_qa_v2_aggregate.py` per accettare sia root di queue sia singole desk root, espandendo deterministicamente `queue.json -> desks/<task>`. Aggiunto test dedicato.


## Aggregate Direct QA v2 — 9 task

L'aggregate reale dei primi nove task è registrato in [DIRECT_QA_V2_AGGREGATE_RESULT_2026-09-30.md](DIRECT_QA_V2_AGGREGATE_RESULT_2026-09-30.md).

Risultato: 9 task, 7 accettati, 5 first-pass raw-clean, 2 first-pass con salvage, 2 rejected, 0 error finali, 0 incorrect conclusions nello stato finale, 11 chiamate totali. Il tempo umano non è stato misurato.

Questo chiude la fase in cui aggiungere altri task Direct-QA equivalenti era il prossimo passo predefinito.

## FAME Four-Role Network V1

Implementata la prima rete coordinata a quattro ruoli:

`EXTRACTOR -> ANTI-BIAS -> VERIFIER -> INTEGRATOR`

Il ruolo Anti-Bias deriva in modo minimale e read-only dal progetto `scientific-method-ai`; quel repository non è stato modificato. Dettagli e controlli importati in [FAME_ANTI_BIAS.md](FAME_ANTI_BIAS.md).

Runner: `fame_four_role_network_v1.py`.

Il runner congela case/codice, usa quattro chiamate isolate, zero retry, receipt per ruolo e replay deterministico di request/validazione. Un issue Anti-Bias `BLOCKING` confermato o non risolto blocca l'integrazione. Rubric e expected verdict restano host-only.

Primo pilot congelato: `source-registry-readiness-network-v1`, su `SOURCE_REGISTRY.md` al commit sorgente `8ab0ef8c828cd4da8dff2c0212c53b01f4c9dd9b`.

Domanda: una fonte `green` è automaticamente pronta per training simbolico commerciale o servono ancora condizioni?

Nessuna inferenza reale della rete a quattro ruoli è stata ancora eseguita.


## Primo pilot reale Four-Role Network V1

Root locale: `FAME_FOUR_ROLE_NETWORK_V1_20260930_114109`.

Esito:
- Extractor `ACCEPTED`;
- Anti-Bias `REJECTED`;
- Verifier non eseguito;
- Integrator non eseguito.

Errore formale Anti-Bias: `ANTI_BIAS_REWORK_WITHOUT_BLOCKING_ISSUE`.

Il challenger ha inoltre sovra-segnalato problemi già coperti dai claim e ha trattato il semplice riuso della stessa unità come double counting. Il validator fail-closed ha fermato correttamente il run.

Il risultato resta FAIL storico e non viene promosso retroattivamente. Report: [FAME_FOUR_ROLE_NETWORK_V1_SOURCE_REGISTRY_RESULT_2026-09-30.md](FAME_FOUR_ROLE_NETWORK_V1_SOURCE_REGISTRY_RESULT_2026-09-30.md).

## Four-Role Network V2

Preparata `fame_four_role_network_v2.py` come nuovo protocollo:
- Extractor senza verdetto;
- Anti-Bias calibrato per non inventare issue;
- primo verdetto al Verifier;
- verdict ammessi definiti dal case;
- rubric/expected verdict host-only;
- stesso flusso fail-closed e quattro chiamate massime senza retry.

Secondo pilot congelato: `agent-network-readiness-network-v2`, su un documento diverso dal pilot V1.

Dettagli: [FAME_FOUR_ROLE_NETWORK_V2.md](FAME_FOUR_ROLE_NETWORK_V2.md).

Verifica automatica dopo V2: GitHub Actions `Verifica FAME local worker` PASS con 80 test Direct-QA + 25 test FAME network/Anti-Bias.


## Primo pilot reale Four-Role Network V2

Root locale `FAME_FOUR_ROLE_NETWORK_V2_20260930_120959`.

Esito: Extractor `ACCEPTED`, Anti-Bias `ACCEPTED`, Verifier `ERROR` HTTP 400 prima della risposta, Integrator non eseguito. Chiamate semantiche completate: 2.

L'Anti-Bias calibrato ha prodotto `issues=[]` e `ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE`, senza ripetere i falsi positivi della V1.

Causa del 400: lo schema Verifier generava `issueId.enum=[]` quando non esistevano issue Anti-Bias. Corretto il builder: `antiBiasResolution` viene omesso interamente quando non ci sono issue.

Aggiunto `fame_four_role_network_v2_recovery.py`: recovery bounded che riusa gli output ACCEPTED di Extractor + Anti-Bias dal run storico e consente al massimo due nuove chiamate, Verifier + Integrator. Non rilancia i primi due ruoli.

Report: [FAME_FOUR_ROLE_NETWORK_V2_FIRST_PILOT_RESULT_2026-09-30.md](FAME_FOUR_ROLE_NETWORK_V2_FIRST_PILOT_RESULT_2026-09-30.md).


## Recovery V2 — failure semantico del Verifier

Root locale `FAME_FOUR_ROLE_NETWORK_V2_RECOVERY_20260930_121630`.

Il recovery ha riusato Extractor + Anti-Bias accettati e ha eseguito solo il Verifier. Esito `REJECTED` con `VERIFIER_NONSUPPORTED_WITH_EVIDENCE`; Integrator non eseguito.

Il Verifier ha mantenuto evidence ID e motivazioni che dichiaravano i claim supportati, ma ha scelto `UNSUPPORTED` per tutti i claim e `ESTABLISHED` come verdict complessivo. Classificato come failure semantico/contrattuale V2, non trasporto.

Report: [FAME_FOUR_ROLE_NETWORK_V2_RECOVERY_RESULT_2026-09-30.md](FAME_FOUR_ROLE_NETWORK_V2_RECOVERY_RESULT_2026-09-30.md).

## Four-Role Network V3

Preparato nuovo protocollo V3:
- status claim non ambigui: `EVIDENCE_SUPPORTS_CLAIM`, `EVIDENCE_DOES_NOT_SUPPORT_CLAIM`, `CLAIM_NEEDS_REWORK`;
- answer options con ID + significato testuale;
- expected answer host-only;
- Extractor non vede le answer options;
- Verifier/Integrator vedono tutte le opzioni ma non quella attesa;
- Integrator deve concordare con il Verifier;
- evidence gate ristretto alla prova minima necessaria; U05 è contesto opzionale.

Aggiunto `fame_four_role_network_v3_continuation.py`: verifica la catena V2 originale + recovery V2 semantico fallito e riusa solo Extractor + Anti-Bias, con massimo due nuove chiamate V3.

Verifica automatica: GitHub Actions PASS con 80 test Direct-QA + 43 test FAME network/Anti-Bias/recovery/continuation.

Dettagli: [FAME_FOUR_ROLE_NETWORK_V3.md](FAME_FOUR_ROLE_NETWORK_V3.md).


## V3 continuation — esito riuscito

Root locale `FAME_FOUR_ROLE_NETWORK_V3_20260930_123819`.

Esito `PROPOSED_FOR_HUMAN_REVIEW` con riuso intenzionale di Extractor + Anti-Bias V2 e due nuove chiamate V3:
- Verifier `ACCEPTED`, `ANSWER_NO`, tre claim su tre `EVIDENCE_SUPPORTS_CLAIM`;
- Integrator `ACCEPTED`, `ANSWER_NO`, usa solo claim verificati;
- zero errori host.

Il risultato dimostra che il contratto V3 ha corretto il failure delle label/verdict V2 su questa continuazione. Non è ancora un fresh run V3 a quattro ruoli.

Report: [FAME_FOUR_ROLE_NETWORK_V3_CONTINUATION_RESULT_2026-09-30.md](FAME_FOUR_ROLE_NETWORK_V3_CONTINUATION_RESULT_2026-09-30.md).

Il case `agent-network-readiness-network-v3` è ora consumato per nuovi init V3.

## Primo fresh run V3 preparato

Congelato `model-comparison-generalization-network-v3` su `FAME_LOCAL_AGENT_MODEL_COMPARISON_HANDOFF_2026-09-23.md` al commit sorgente `826d121a6e752202c9cfa40289ae4ce359735986`.

Domanda: il confronto congelato dimostra che Qwen3-Coder 30B è in generale un modello migliore di GPT-OSS 20B per la rete FAME Neural?

Il case distingue:
- Qwen REJECTED con output strutturato parziale 6/10;
- GPT-OSS REJECTED per esaurimento output senza risposta strutturata;
- risultato meno debole di Qwen sul protocollo specifico;
- divieto esplicito di generalizzare quel risultato a un giudizio generale sui modelli.

Questo sarà il primo run V3 completo da zero con quattro chiamate fresh: Extractor, Anti-Bias, Verifier, Integrator.

Verifica automatica: 80 test Direct-QA + 43 test FAME, tutti OK.


## Primo fresh run completo Four-Role Network V3

Root locale `FAME_FOUR_ROLE_NETWORK_V3_FRESH_20260930_124414`.

Esito host `PROPOSED_FOR_HUMAN_REVIEW` con quattro chiamate fresh nello stesso protocollo:
- Extractor `ACCEPTED`;
- Anti-Bias `ACCEPTED`;
- Verifier `ACCEPTED`;
- Integrator `ACCEPTED`;
- zero errori host.

Il Verifier e l'Integrator hanno scelto `ANSWER_NO`: il confronto congelato mostra Qwen meno debole su quello specifico protocollo, ma non dimostra superiorità generale su GPT-OSS.

L'Anti-Bias ha prodotto un issue `NONBLOCKING` sulle assunzioni di piena comparabilità e sulla sufficienza della metrica; il Verifier lo ha mantenuto `UNRESOLVED` e l'Integrator lo ha riportato come limitazione. Il flusso ha quindi preservato una incertezza reale senza bloccare una conclusione più stretta supportata dalla fonte.

Revisione umana: PASS con nota di precisione su C2. La frase "higher success rate in generating structured output" è più forte del necessario dato un solo run per modello; formulazione preferibile: "in questo confronto Qwen ha prodotto output strutturato, GPT-OSS no". La nota non cambia il verdetto finale.

Il case `model-comparison-generalization-network-v3` è consumato e non può essere inizializzato di nuovo come first attempt.

Report: [FAME_FOUR_ROLE_NETWORK_V3_FRESH_RESULT_2026-09-30.md](FAME_FOUR_ROLE_NETWORK_V3_FRESH_RESULT_2026-09-30.md).

Questo è il primo PASS completo V3 a quattro ruoli fresh. Non dimostra ancora affidabilità generale della rete, vantaggio rispetto a una baseline single-agent o riduzione del costo umano di review.


## Confronto controllato single-agent vs Four-Role V3

Preparato `fame_single_vs_four_v1.py` con baseline `fame_single_agent_baseline_v1.py`.

Case congelato: `single-vs-four-coordinator-causality-v1`, su `COORDINATOR.md` al commit sorgente `b16ef607905d26bf12c9ac8fa2a3b0c481bb4574`.

Entrambi i bracci ricevono la stessa domanda, stesse unità, stesso modello/digest e stesse opzioni di generazione. La baseline usa una chiamata; la rete V3 quattro. L'expected answer resta host-only in entrambi.

`comparison.json` confronta correttezza, required evidence coverage, evidence selezionata, limitazioni, issue Anti-Bias, chiamate, token e tempi con load separato. Nessun winner automatico. Metriche di review umana restano null finché non misurate.

Verifica automatica prima del run reale: 80 test Direct-QA + 49 test FAME, tutti OK.

Dettagli: [FAME_SINGLE_VS_FOUR_V1.md](FAME_SINGLE_VS_FOUR_V1.md).


## Primo confronto reale single-agent vs Four-Role V3

Root locale `FAME_SINGLE_VS_FOUR_V1_20260930_132135`.

Entrambi i bracci hanno chiuso `PROPOSED_FOR_HUMAN_REVIEW` con `ANSWER_NO`, required evidence coverage completa e le stesse evidenze essenziali U02 + U03.

Revisione umana: pareggio qualitativo sul caso. La rete non ha corretto un errore, recuperato evidenza mancante o aggiunto un limite materiale perso dalla baseline.

Costo osservato:
- single agent: 1 call, prompt 847, eval 1596, model time excluding load circa 11.008 s;
- four-role: 4 call, prompt 4989, eval 3749, model time excluding load circa 26.895 s.

Classificazione: **pareggio qualitativo con overhead netto della rete**. Nessuna conclusione generale sull'architettura da un singolo caso.

Il case `single-vs-four-coordinator-causality-v1` è consumato nella rete V3.

Report: [FAME_SINGLE_VS_FOUR_V1_RESULT_2026-09-30.md](FAME_SINGLE_VS_FOUR_V1_RESULT_2026-09-30.md).

## Secondo confronto single-agent vs Four-Role preparato

Nuovo case congelato: `single-vs-four-rubric-audit-generalization-v2` su `RUBRIC_AUDIT.md` al commit `5530c2649ddda83a07511f8e0549d4ccf45723fe`.

Domanda: se il recovery viene rivalutato 2/2, è lecito promuovere la rete originale a 14/14 al primo tentativo e generalizzare il supporto contestuale come equivalente alla prova diretta?

Il secondo confronto usa `fame_single_vs_four_v2.py` e inverte l'ordine dei bracci: prima Four-Role Network, poi single-agent.

Verifica automatica pre-run: 80 test Direct-QA + 54 test FAME, tutti OK.

Dettagli: [FAME_SINGLE_VS_FOUR_V2.md](FAME_SINGLE_VS_FOUR_V2.md).


## Secondo confronto reale single-agent vs Four-Role V3

Root locale `FAME_SINGLE_VS_FOUR_V2_20260930_133018`.

Entrambi i bracci hanno chiuso `PROPOSED_FOR_HUMAN_REVIEW` con `ANSWER_NO` e required evidence coverage completa.

Revisione umana:
- entrambe le risposte semanticamente corrette;
- single-agent: 2 claim, evidence U01 + U03;
- four-role: 6 claim, evidence U01–U05, incluse U04/U05 optional context;
- nessun errore o omissione materiale della baseline corretto dalla rete.

Classificazione: **secondo pareggio qualitativo; baseline più parsimoniosa e rete con overhead netto**.

Costo relativo osservato della rete sul caso:
- circa 6.12x prompt token;
- circa 6.94x output token;
- circa 6.96x model time excluding load;
- circa 8.59x elapsed cumulativo.

Il case `single-vs-four-rubric-audit-generalization-v2` è consumato.

Report: [FAME_SINGLE_VS_FOUR_V2_RESULT_2026-09-30.md](FAME_SINGLE_VS_FOUR_V2_RESULT_2026-09-30.md).

## Batteria precongelata single-agent vs Four-Role

Per evitare selezione sequenziale dei casi dopo due risultati già osservati, preparata una batteria di quattro casi nuovi congelati insieme prima di qualsiasi inferenza:

- `battery-qa-transfer-v1`: single first;
- `battery-recovery-v1`: network first;
- `battery-gptoss-diagnostic-v1`: single first;
- `battery-anti-bias-v1`: network first.

Ordine bilanciato 2/2. Massimo 20 chiamate totali.

Runner: `fame_single_vs_four_battery_v1.py`.

Output globale: `battery-result.json`.

L'aggregatore riporta answer correctness, required coverage, calls, token, model time excluding load e issue Anti-Bias, senza assegnare un winner automatico. Review umana su overclaim/parsimony/correction burden resta separata.

Verifica automatica pre-run: 80 test Direct-QA + 60 test FAME, tutti OK.

Dettagli: [FAME_SINGLE_VS_FOUR_BATTERY_V1.md](FAME_SINGLE_VS_FOUR_BATTERY_V1.md).


## Batteria single-agent vs Four-Role — esito reale

Batteria V1 completata su quattro casi pre-registrati con ordine dei bracci bilanciato 2/2.

Automatic summary:
- entrambi corretti: 3/4;
- solo single-agent corretto: 0/4;
- solo network corretto: 1/4;
- required coverage completa: single-agent 3/4, network 4/4;
- accepted: single-agent 3/4, network 4/4;
- model calls: single-agent 4, network 16.

Primi tre casi: entrambi i bracci corretti. Nessun vantaggio semantico osservabile della rete.

Quarto caso `battery-anti-bias-v1`:
- Four-Role Network `ACCEPTED`, `ANSWER_NO`, U01+U02, coverage completa;
- single-agent `NEEDS_REVIEW`, output nullo, una response salvata, elapsed circa 26.422 s;
- il summary aggregato non conserva il motivo del failure e riporta metriche response a zero.

Non classificare ancora questo come vittoria semantica della rete. Il pattern indica un failure post-response da distinguere fra troncamento, final content vuoto, JSON invalido o altro errore.

Aggiunto diagnostico read-only `fame_battery_attempt_diagnostic.py`: verifica receipt e legge `result.json` + `response.json` senza chiamare Ollama e senza modificare il run storico.

Tutti i 4 case della batteria sono ora consumati e bloccati per nuovi init sia nella rete V3 sia nella baseline.

Verifica automatica dopo hardening diagnostico: 80 test Direct-QA + 65 test FAME, tutti OK.

Report: [FAME_SINGLE_VS_FOUR_BATTERY_V1_RESULT_2026-09-30.md](FAME_SINGLE_VS_FOUR_BATTERY_V1_RESULT_2026-09-30.md).


## Battery V1 — diagnosi finale del quarto caso

Il diagnostico read-only sul single-agent di `battery-anti-bias-v1` ha classificato il failure come `OUTPUT_TRUNCATED`:
- `resultStatus=ERROR`;
- `ValueError: Risposta incompleta`;
- `done_reason=length`;
- `eval_count=4096`;
- content presente ma JSON non parseabile;
- nessuna nuova chiamata modello e nessuna modifica allo storico.

Quindi il 4/4 network vs 3/4 single della Battery V1 non è una vittoria semantica dimostrata della rete. È un vantaggio operativo osservato sotto limite per-call 4096: nei primi tre casi entrambi i bracci sono corretti; nel quarto la rete completa e il single-agent esaurisce il budget.

Confondente: single-agent aveva massimo 1×4096 token; la rete massimo 4×4096 token distribuiti. Il budget totale non era equivalente.

Report Battery V1 aggiornato con questa classificazione.

## Matched-total-generation-budget V1 pronto

Preparata baseline `fame_single_agent_baseline_v2.py`:
- num_predict=16384;
- num_ctx=32768, temperature=0, seed=42 invariati;
- diagnostica response/metrics preservata anche su errore post-response;
- nessun retry.

Preparata `fame_single_vs_four_matched_budget_v1.py` con quattro casi nuovi congelati insieme:
- `matched-package-authoring-v1`;
- `matched-qa-review-v1`;
- `matched-cline-real-qa-v1`;
- `matched-coordinator-reject-v1`.

Budget massimo totale per caso:
- single-agent: 1×16384 = 16384;
- Four-Role Network V3: 4×4096 = 16384.

Ordine dei bracci bilanciato 2/2. Un output truncation con response salvata è contato come outcome e non ferma l'altro braccio; failure senza response ferma la batteria.

Le unità dei package sono legate letteralmente agli snapshot congelati; nessuna inferenza reale è stata eseguita durante l'authoring.

Verifica automatica pre-run: 80 test Direct-QA + 75 test FAME, tutti OK.

Dettagli: [FAME_SINGLE_VS_FOUR_MATCHED_BUDGET_V1.md](FAME_SINGLE_VS_FOUR_MATCHED_BUDGET_V1.md).
