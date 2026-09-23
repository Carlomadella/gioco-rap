# Cline GPT-OSS — diagnostico compatto Tsumugi contract audit

Il precedente run `FAME_CLINE_GPTOSS_TSUMUGI_CONTRACT_001` e consumato: Cline ha richiesto un comando terminale vietato, l'operatore lo ha rifiutato e la sessione e poi terminata con una tool-call malformata prima di creare `audit.json`.

Questa prova **non e una nuova independent evaluation**. Ripete gli stessi quattro check e la stessa rubrica esclusivamente per isolare il packaging/tool layer.

## Differenza unica intenzionale

I quattro snapshot sorgente sono concatenati integralmente, con marker di inizio/fine file, in un solo:

`source-audit.md`

Non esiste una cartella `source/` nella desk. Il contenuto dei quattro snapshot deriva dagli stessi file congelati del run precedente.

## Esecuzione

Dalla cartella `strumenti/fame-local-worker`:

```powershell
python -m unittest test_cline_gptoss_tsumugi_contract_compact_diagnostic -q
python cline_gptoss_tsumugi_contract_compact_diagnostic.py init --root "$HOME\FAME_CLINE_GPTOSS_TSUMUGI_CONTRACT_COMPACT_001"
```

Aprire solo la desk stampata in una nuova finestra VS Code. Nuova conversazione Cline, stessa configurazione se ancora invariata.

Prompt unico:

```text
Esegui il compito in TASK.md usando i file della scrivania. Salva il risultato richiesto in audit.json.
```

Auto-approve solo Read. Non autorizzare terminale, browser, rete o MCP. La scrittura di `audit.json` puo essere approvata manualmente. Nessun Retry o suggerimento correttivo.

Compilare `operator/session.json` con quanto realmente osservato e lanciare il grader una sola volta:

```powershell
python cline_gptoss_tsumugi_contract_compact_diagnostic.py grade --root "$HOME\FAME_CLINE_GPTOSS_TSUMUGI_CONTRACT_COMPACT_001"
```

Un eventuale successo indica soltanto che il packaging compatto ha permesso di completare lo stesso audit che nel formato multi-file si era interrotto. Non va sommato come nuovo caso indipendente.
