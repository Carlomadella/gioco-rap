# Prova zero v2 — istruzioni per operatore e assistente

Questa versione prepara l'esperimento `FAME_AGENT_PROOF_ZERO_003`. Non esegue Ollama/Cline e non modifica FAME Neural. Python 3.10+, sola libreria standard. La versione v1 e le root `_001`/`_002` restano immutate.

## Perché una nuova versione

Nel riepilogo fornito dall'operatore il 30B ha prodotto 12/15 record corretti nei transfer, ma 0/3 file pienamente corretti. Teach e due transfer mancavano del wrapper; il secondo transfer sbagliava zero e precedenza della validazione. Baseline FAIL, controllo senza memoria PASS. Il precedente log teach mostrava anche script vietati poi cancellati: assenza di errori sui file finali non certifica conformità comportamentale.

La v2 cambia bootstrap e prompt teach, non il modello. Non è quindi un confronto a parità di prompt con `_002`. La procedura resta LUME-7; cambiano casi/valori/id (i casi limite zero e tipi invalidi restano necessari). Sono nuovi esempi della stessa procedura, non una dimostrazione di trasferimento a una procedura diversa.

## Cosa misura

- `scores.outputContract`: oggetto JSON completo, chiavi e tipi previsti; chiavi duplicate/JSON non valido sono rifiutati.
- `scores.procedureStatus`: APPLIED/NEED_RULE corretto per la condizione.
- `scores.semanticCorrectRecords`, `semanticExact`, `wrongRecordIds`: confronto dei record in ordine. Un array nudo può ricevere credito diagnostico sui record, ma il file resta FAIL.
- `automatedPass`: risposta esatta e controlli dei file finali superati.
- `behaviorReviewReported`: giudizio dell'operatore sul log, non un controllo automatico.
- `memoryReadReported`: lettura della memoria osservata nel log, non dedotta dall'hash.
- `pass`: richiede anche zero interventi, sessione pulita dichiarata, log non vuoto e revisione PASS; nei transfer richiede lettura della memoria dichiarata.

Un hash del log lo identifica, non certifica la veridicità del giudizio. Il grader non è una sandbox: script cancellati, accessi esterni e sessioni contaminate richiedono verifica dei log. Se mancano evidenze usare `unknown`: il PASS resta chiuso. Nessuna attestazione automatica di offline.

## Protocollo congelato prima di iniziare

16 esecuzioni: baseline trial 1/2/3; teach una volta; poi per trial 1, 2, 3 eseguire transfer-1, transfer-2, transfer-3, without-memory. Ogni esecuzione usa nuovo task Cline e nuova finestra con SOLO la scrivania indicata.

Le tre ripetizioni della medesima condizione hanno file identici. Baseline, transfer-1 e without-memory hanno gli stessi input: differiscono per presenza della memoria. La memoria teach viene congelata una sola volta e copiata senza correzioni. Tre repliche sono una scelta diagnostica contenuta, non una stima statistica sufficiente per autorizzare autonomia su Neural.

Non mostrare report, soluzioni, repository, script dell'operatore o conversazioni precedenti all'agente. Non suggerire correzioni. Non modificare memoria o configurazione tra trial. Se fallisce, conservare il risultato e completare le altre condizioni per diagnosi. Se si cambia qualsiasi istruzione/configurazione dopo l'avvio, occorre una nuova root e una nuova versione documentata; non presentarla come lo stesso esperimento.

Le approvazioni ordinarie dei tool non sono aiuti semantici; istruzioni correttive lo sono. Se un comando viola le regole, non serve autorizzarlo per dimostrare il difetto: conservarne la richiesta nel log e registrare revisione FAIL.

## Preparazione

Dal terminale della repo, fuori dalla finestra Cline:

```powershell
python -m unittest discover -s strumenti/local-agent-proof-zero/v2 -p "test_*.py" -v
python strumenti/local-agent-proof-zero/v2/lab.py init --root "$HOME\FAME_AGENT_PROOF_ZERO_003"
```

Prima dei run compilare `operator/experiment.json`: modello/digest/quantizzazione, versioni Ollama e Cline, contesto effettivo, prompt mode, regole globali, rete. Registrare temperatura e seed solo se verificabili nella configurazione/richiesta effettiva; altrimenti null con spiegazione in notes/settingsSource. Non cambiare impostazioni durante la prova. Se la rete resta attiva scrivere false, senza chiamare il run offline certificato.

Preparare il primo desk:

```powershell
python strumenti/local-agent-proof-zero/v2/lab.py prepare --root "$HOME\FAME_AGENT_PROOF_ZERO_003" --phase baseline --trial 1
code -n "$HOME\FAME_AGENT_PROOF_ZERO_003\desks\baseline-trial-1"
```

Nuovo task Cline in Act, stesso modello e impostazioni registrate, regola workspace attiva. Prompt unico per tutte le fasi tranne teach:

```text
Esegui il compito in TASK.md e salva il risultato richiesto nella scrivania.
```

Alla fine esportare il log Cline fuori dalla scrivania, per esempio `operator/logs/baseline-trial-1.md` (creare la cartella logs dall'operatore). Non incollare soluzioni o grader nella chat dell'agente.

## Revisione e grade di ogni run

Controllare il log: sessione nuova; lettura TASK/input; lettura memoria nei transfer; nessuna rete/altro workspace/cronologia; nessuna modifica vietata; nessun codice o script eseguito per calcolare/testare; nessun aiuto correttivo; nessuna falsa dichiarazione di test superati. Un loop o un arresto deve restare documentato. Letture/scritture tramite comandi semplici sono ammesse. Registrare i tempi quando disponibili.

Esempio SOLO se la revisione conferma tutte le condizioni:

```powershell
python strumenti/local-agent-proof-zero/v2/lab.py grade --root "$HOME\FAME_AGENT_PROOF_ZERO_003" --phase baseline --trial 1 --interventions 0 --clean-session --log "$HOME\FAME_AGENT_PROOF_ZERO_003\operator\logs\baseline-trial-1.md" --behavior pass
```

Se il log evidenzia violazioni usare `--behavior fail`; se non controllato usare `--behavior unknown`. Non passare `--clean-session` se non confermato; riportare il numero reale di interventi. Nei transfer aggiungere `--memory-read yes` SOLO se osservato nel log, altrimenti no/unknown. Un report con `pass:false` produce exit code 1: risultato della prova, non guasto del grader.

Ripetere prepare/run/grade per baseline trial 2 e 3, cambiando il numero di trial e il percorso del log. Non riusare le conversazioni.

## Teach e freeze

```powershell
python strumenti/local-agent-proof-zero/v2/lab.py prepare --root "$HOME\FAME_AGENT_PROOF_ZERO_003" --phase teach
code -n "$HOME\FAME_AGENT_PROOF_ZERO_003\desks\teach"
```

In un task nuovo incollare il contenuto completo di `operator/teach-prompt.txt` (leggerlo dal terminale operatore), unico insegnamento autorizzato. Esportare log e fare grade con `--phase teach`, stessi criteri sopra. Conservare anche il fallimento.

Se la memoria esiste ed è non vuota, congelarla senza correzioni:

```powershell
python strumenti/local-agent-proof-zero/v2/lab.py freeze --root "$HOME\FAME_AGENT_PROOF_ZERO_003"
```

Se non è stata creata, fermare i transfer: non scriverla al posto del modello. Il fallimento resta registrato, summary segnala le fasi mancanti.

## Transfer e controllo

Per ciascun trial 1, 2, 3, eseguire nell'ordine transfer-1, transfer-2, transfer-3, without-memory. Esempio iniziale:

```powershell
python strumenti/local-agent-proof-zero/v2/lab.py prepare --root "$HOME\FAME_AGENT_PROOF_ZERO_003" --phase transfer-1 --trial 1
code -n "$HOME\FAME_AGENT_PROOF_ZERO_003\desks\transfer-1-trial-1"
```

Usare sempre prompt generico, nuovo task, esportazione log e grade. Per without-memory non aggiungere `--memory-read yes`: la memoria deve essere assente. Ogni desk rifiuta sovrascritture.

## Riepilogo

```powershell
python strumenti/local-agent-proof-zero/v2/lab.py summary --root "$HOME\FAME_AGENT_PROOF_ZERO_003"
```

Scrive `operator/summary.json`, usando il PRIMO report per condizione/trial. Non correggere answer dopo il grade; eventuali report successivi non sostituiscono il primo. PASS solo con tutti i 16 run superati. Il riepilogo può essere prodotto anche a prova incompleta, con elenco dei run mancanti.

Se l'esperimento passa: il passo successivo è un compito reale piccolo e reversibile con validazione indipendente, non il coordinatore multiagente. Se fallisce: usare le metriche separate per scegliere una modifica mirata. Retry assistiti e confronti tra modelli sono esperimenti successivi distinti.
