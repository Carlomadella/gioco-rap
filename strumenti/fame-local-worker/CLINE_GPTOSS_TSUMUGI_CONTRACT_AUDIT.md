# Cline GPT-OSS — Tsumugi runtime contract audit

Questa prova abbandona il quiz sui report e assegna un piccolo audit reale su codice/configurazione gia presenti nel progetto.

La desk contiene snapshot congelati dal commit `1e555d6c52b16f3b14ccdaf75574edb196a6c900`:

- diagnostic protocol Tsumugi score diagnostic;
- controlled protocol Tsumugi;
- runner Python dello score diagnostic;
- static test esistente.

Obiettivo: stabilire se quattro vincoli del diagnostic protocol sono **realmente legati al runtime** oppure soltanto presenti/configurati senza un cross-check che blocchi divergenze.

Il grader host-side congela prima del run le quattro risposte attese. Non chiede citazioni: qui misuriamo lettura del codice e contract reasoning, non retrieval di evidence ID.

## Esecuzione

Dalla cartella `strumenti/fame-local-worker`:

```powershell
python -m unittest test_cline_gptoss_tsumugi_contract_audit -q
python cline_gptoss_tsumugi_contract_audit.py init --root "$HOME\FAME_CLINE_GPTOSS_TSUMUGI_CONTRACT_001"
```

Aprire solo la desk stampata, nuova conversazione Cline, stessa configurazione se ancora invariata. Auto-approve solo letture; approvare manualmente la scrittura di `audit.json`.

Prompt unico:

```text
Esegui il compito in TASK.md usando i file della scrivania. Salva il risultato richiesto in audit.json.
```

Nessun Retry o suggerimento correttivo. Non eseguire i file.

Compilare poi `operator/session.json` con i valori realmente osservati e lanciare una sola volta:

```powershell
python cline_gptoss_tsumugi_contract_audit.py grade --root "$HOME\FAME_CLINE_GPTOSS_TSUMUGI_CONTRACT_001"
```

## Perche e utile

Se il modello identifica correttamente un binding presente e tre binding mancanti, il risultato puo alimentare direttamente un hardening del runner prima del prossimo score diagnostic. Il probe non modifica il runner e non autorizza l'esecuzione del diagnostic, training o batch131.
