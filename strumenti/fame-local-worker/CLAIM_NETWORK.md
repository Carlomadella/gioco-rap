# Confronto rete di worker per singola affermazione

Programma: claim_network.py. Solo rete locale, nessun accesso Audio→MIDI.

## Un comando

Da PowerShell, nella cartella strumenti/fame-local-worker del branch recovery/fame-local-worker-v2-cdea2227 aggiornato:

```powershell
python claim_network.py --root "$HOME\FAME_CLAIM_NETWORK_001"
```

Ollama deve essere già avviato con gpt-oss:20b e il digest congelato nel programma. Python 3.10+, nessuna nuova dipendenza. Il programma non scarica modelli.

La root deve essere nuova. Nessun retry o sovrascrittura; se un errore interrompe il run si leggono gli artefatti salvati prima di decidere come procedere.

## Cosa fa

Sei claim sintetiche su tre documenti nuovi, due SUPPORTED, due CONTRADICTED, due UNKNOWN. Sono development fixture dichiarate e leggibili, non test ciechi o prova di generalizzazione. Non riutilizza il booleano U08 già consumato.

1. Baseline: una chiamata con tutti i casi, risposta boolean + evidenceIds come nei worker precedenti.
2. Per ogni claim, un selector propone ID pertinenti senza produrre verdetto.
3. Un judge separato valuta una sola claim con tre stati e citazioni anche per le contraddizioni. Riceve il documento completo oltre agli ID suggeriti: la selezione non può nascondere una controprova.
4. Host confronta con target predefiniti senza inviarli ai worker. Conserva i risultati singoli e produce report aggregato.

Massimo 13 chiamate sequenziali, nessun tool del modello. Entrambi i ruoli usano lo stesso modello: non sono revisori statisticamente indipendenti. Timeout/preflight interrompono; risposte invalide di una desk vengono registrate e le altre desk proseguono.

La baseline è un confronto con la forma precedente del compito, non una riesecuzione byte-identica della v3. Il confronto cambia insieme granularità, due stadi e formato ternario: non isola causalmente quale componente produca un eventuale vantaggio. UNKNOWN e CONTRADICTED confluiscono in false nella baseline; il judge è valutato anche sulla distinzione più stretta.

## Risultati

report.json contiene baselineAccepted, stagedAccepted, stagedAllPass e comparison. COMPLETE_FOR_REVIEW significa esecuzione completata, non correttezza. Solo stagedAllPass=true significa sei casi corretti con evidenza sufficiente su questa suite. Exit 0 solo in quel caso; exit 1 per errori o casi falliti.

Le citazioni in results sono materializzate dall'host dalle unità originali. Ogni chiamata conserva request.json, response.json e timing.json. receipt.json conserva hash locali, non firme indipendenti. Il preflight verifica digest e loopback; non certifica l'isolamento di rete del server intero.

```powershell
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_CLAIM_NETWORK_001\report.json"
```

Nessun esito abilita training, modifiche al progetto, elaborazione audio o produzione. Se la scomposizione non migliora o sbaglia ancora condizioni elementari, non scalare il numero di desk: usare gli errori registrati per decidere sul modello/compito. Se riesce, servono task documentali rappresentativi nuovi e misura del tempo umano prima di dichiarare utile la rete.

## Verifica eseguita qui

9 test con client simulato: ciclo completo, target non inviati, giudice con contesto completo, errori semantici, evidenze obbligatorie anche per contraddizioni, ID invalidi, digest, timeout senza retry e divieto di sovrascrittura. Nessuna chiamata reale Ollama effettuata qui.

```powershell
python -m unittest test_claim_network -q
```

Le v1–v3 e le loro rubriche rimangono immutate. Il falso rifiuto U07 del caso storico non viene convertito in PASS: questa prova usa nuove rubriche e non contiene quel caso.
