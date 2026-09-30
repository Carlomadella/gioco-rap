# Rete di agenti locali — stato operativo

Aggiornamento: 30 settembre 2026. Stato della rete verificato fino al commit `23171593992036224d9e02dad351011db302b5ab`; Direct QA CI PASS.

## Obiettivo e perimetro

Costruire worker stretti coordinati da codice deterministico, con GPT-OSS 20B via Ollama locale. Runtime diretto; Cline escluso dal percorso operativo corrente. Scrivanie, memoria, contratti, validazione e coordinamento appartengono a questo filone.

I documenti FAME Neural sono input di QA. Leggere un prossimo passo nel documento non autorizza il worker o l'assistente a eseguirlo. In particolare P5/P6 sono fasi Audio→MIDI, non fasi della rete.

## Risultati registrati

| Incarico | Risultato v1 | Limite |
| --- | --- | --- |
| PF-NMF, root 001 | VALIDATED_FOR_REVIEW, una chiamata | Risultato operator-reported; non prova affidabilità generale |
| subset+BIC, root 002 | REJECTED, 5/5 conclusioni corrette e coverage sufficiente | Heading U13 citato e non ammesso: difetto di packaging |
| Tsumugi controlled, root 003 | REJECTED, 4/5 conclusioni corrette | Una conclusione errata e una copertura insufficiente |

Vedi i tre DIRECT_QA_*_RESULT_2026-09-23.md. I casi sono consumati; non ripeterli per ottenere un nuovo primo tentativo.

## Confine confermato dall'operatore

Checkpoint pertinente alla rete: `cdea2227a4a71906c48b97d888e707a787cecc3e` (validator-guided direct QA recovery). Il commit successivo `061f87cb76c6432e7eb2cd80b91dfb6f74e22172` passa al runner Tsumugi Audio→MIDI ed è fuori dal mandato della rete. Questa separazione conserva lo storico senza usare le successive decisioni musicali come avanzamento degli agenti.

## Implementazione disponibile

- v1: direct_qa_worker.py e direct_qa_queue.py, mantenuti per le prove storiche.
- v2: direct_qa_worker_v2.py e direct_qa_queue_v2.py, introdotti nel commit cdea2227.
- v2 permette al massimo una correzione con categorie generiche del validatore, conservando il primo tentativo.
- Un PASS dopo correzione va distinto da un PASS iniziale.
- Nei documenti esaminati non è registrato un run reale v2 riuscito. Non dichiararlo già validato.
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

Non è ancora stato eseguito alcun run reale v2 con Ollama.

## Prossimo passo della rete

1. Aggiornare la worktree locale del branch `feature/fame-neural-roadmap`.
2. Inizializzare una root nuova con `tsumugi-score-diagnostic-review-v1`.
3. Eseguire localmente una sola desk v2 con Ollama e conservare attempt-1; l'eventuale attempt-2 resta una sola correzione validator-guided.
4. Registrare esito, evidenze e tempo umano; valutare l'utilità prima di ampliare ruoli. Non avviare elaborazioni musicali per procurarsi altri task.

La separazione documentale non esegue questi passi e non certifica nuovi test o inferenze.

## Confini operativi

Per un incarico sulla rete si modificano strumenti/fame-local-worker e la sua documentazione. La consultazione read-only di report musicali già registrati è ammessa; cambiare runner audio, selezionare beat, prenotare split o far ascoltare nuovi MIDI richiede un incarico Audio→MIDI esplicito.

Le fonti congelate dei task restano immutate. Non usare il CURRENT_STATE generale come coda automatica di comandi. Nessun risultato del worker autorizza esecuzione musicale, training, batch131 o produzione.

Guida tecnica e storico dei comandi: [DIRECT_QA_WORKER.md](DIRECT_QA_WORKER.md). I comandi delle root 001–003 sono storici, non istruzioni da rilanciare.
