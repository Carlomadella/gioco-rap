# Rete di agenti locali — stato operativo

Aggiornamento: 23 settembre 2026. Fonti verificate sul commit d2ad12db10e4943b8a17bcb75b795095fd831bcf.

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

## Prossimo passo della rete

1. Verificare codice e test della v2, compresa la conservazione dei risultati e il limite di due chiamate.
2. Preparare un nuovo task QA documentale distinto dai tre consumati, con fonte completa, rubrica e criteri fissati prima della prova. Seguire DIRECT_QA_PACKAGE_AUTHORING.md.
3. Eseguire localmente una sola desk v2 e registrare primo tentativo, eventuale correzione, evidenze e tempo umano.
4. Valutare l'utilità prima di ampliare i ruoli. Non avviare elaborazioni musicali per procurarsi un altro task.

La separazione documentale non esegue questi passi e non certifica nuovi test o inferenze.

## Confini operativi

Per un incarico sulla rete si modificano strumenti/fame-local-worker e la sua documentazione. La consultazione read-only di report musicali già registrati è ammessa; cambiare runner audio, selezionare beat, prenotare split o far ascoltare nuovi MIDI richiede un incarico Audio→MIDI esplicito.

Le fonti congelate dei task restano immutate. Non usare il CURRENT_STATE generale come coda automatica di comandi. Nessun risultato del worker autorizza esecuzione musicale, training, batch131 o produzione.

Guida tecnica e storico dei comandi: [DIRECT_QA_WORKER.md](DIRECT_QA_WORKER.md). I comandi delle root 001–003 sono storici, non istruzioni da rilanciare.
