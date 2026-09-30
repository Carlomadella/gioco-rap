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
