# Direct QA v2 — aggregate reale dei primi 9 task

Data: 30 settembre 2026.

Aggregazione prodotta da `direct_qa_v2_aggregate.py` sulle nove root storiche v2.

## Risultato

- task: 9;
- finali accettati: 7;
- first-pass raw-clean: 5;
- first-pass con salvage: 2;
- finali rejected: 2;
- accepted after repair: 0;
- error finali: 0;
- tentativi troncati per output: 1;
- task con salvage host-side: 2;
- evidence ID eliminati dal salvage: 3;
- incorrect conclusions nello stato finale: 0;
- insufficient coverage nello stato finale: 1;
- model calls totali: 11;
- elapsed dei tentativi: circa 170.67 secondi.

Il tempo di revisione umana non è stato misurato.

## Interpretazione

Questo aggregate è una misura degli artefatti storici, non una reinterpretazione retroattiva. I due task formalmente rejected restano rejected nell'aggregate. Le diagnosi manuali già documentate sui difetti di authoring/precisione restano documentazione separata e non vengono convertite in PASS dal tool.

La sequenza fornisce abbastanza evidenza operativa per smettere di aggiungere task documentali equivalenti e passare a una prima prova coordinata multi-ruolo, mantenendo revisione umana e autorizzazioni chiuse.
