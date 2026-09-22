# Prova zero — memoria esterna di un agente locale

Stato: **laboratorio predisposto; Qwen/Cline NON ancora valutati**.
Questo laboratorio è separato dalla pipeline FAME Neural e non cambia roadmap, gate, dati o algoritmi. Un solo agente alla volta. Nessuna dipendenza Python esterna, API cloud, installazione o download da parte degli script.

## La domanda misurata

Un agente può ricevere una procedura nuova, scriverne una memoria utile e applicarla su casi diversi in task nuovi, senza rispiegazioni? Qui "apprendere" significa usare memoria esterna; i pesi di Qwen non cambiano. Una riuscita dimostra questa capacità nel compito controllato, non la capacità generale di sviluppare Neural né un miglioramento garantito nel tempo.

Si parte da qwen2.5-coder:14b già installato dall'utente. Non si modifica il modello o il contesto di nascosto. Registrare versione Cline/Ollama, modello e digest, quantizzazione, contesto effettivo, temperatura/seed se disponibili e istruzioni globali. Il contesto 4096 osservato in precedenza non è prova della configurazione attuale. Errori di chiamata strumenti, caricamento regole o overflow contesto vanno distinti dagli errori sulla procedura.

## Due spazi distinti

Il codice di questo laboratorio resta nella repo, a disposizione dell'operatore. `lab.py` crea una directory nuova esterna alla repo:

- `operator/`: procedura originale, prompt, metadati, ricevute e copia congelata della memoria;
- `desks/<fase>/`: scrivania minima dell'agente, con compito, input, regola di avvio e, quando prevista, memoria;
- `reports/`: risultati del correttore, inclusi atteso e ottenuto.

**Aprire in VS Code solo la singola scrivania**, senza workspace multipli e senza la repo, il correttore o il materiale dell'operatore come contesto. Ogni fase usa un nuovo task Cline: non riprendere, riassumere o trasferire la chat precedente. Non allegare report o risposte di altre fasi. Le regole globali non devono contenere LUME-7 o risposte precedenti.

Questa separazione riduce le contaminazioni ma NON è una sandbox del sistema operativo. Controllare il log degli strumenti per accessi fuori dalla scrivania. Non concedere accessi esterni durante la prova. Cline può gestire propri checkpoint Git: il correttore ignora `.git`, non altri file aggiunti. Non attivare regole del laboratorio globalmente o nella radice di Neural.

La regola `.clinerules/00-desk.md` indirizza l'agente a `memory/procedure.md` se esiste. Quindi misuriamo il recupero tramite un indice esplicito, non la scoperta spontanea di una memoria nascosta. Cline documenta le regole persistenti di workspace; verificarne l'attivazione nell'installazione locale prima di iniziare:
https://github.com/cline/cline/blob/main/docs/customization/cline-rules.mdx
https://cline.bot/blog/clinerules-version-controlled-shareable-and-ai-editable-instructions

## Procedura per l'operatore — PowerShell

Dalla radice della copia locale aggiornata del branch `feature/fame-neural-roadmap`, eseguire prima i test del correttore:

```powershell
python -m unittest discover -s strumenti/local-agent-proof-zero -p "test_*.py" -v
```

Impostare i percorsi. Il percorso scelto per l'esperimento deve essere nuovo; il tool rifiuta sovrascritture. Non usare la directory dei dati Neural.

```powershell
$labScript = (Resolve-Path "strumenti/local-agent-proof-zero/lab.py").Path
$labRoot = Join-Path $env:USERPROFILE "FAME_AGENT_PROOF_ZERO_001"
python $labScript init --root $labRoot
```

Compilare `operator/experiment.json` con i dati effettivi (null se non disponibili, con spiegazione nelle note). Una volta installati i componenti, il laboratorio non richiede Internet: usare Ollama locale per Plan e Act, nessun MCP remoto o browser. Per dichiarare un'esecuzione offline, disconnettere la rete esterna durante la prova mantenendo il servizio locale raggiungibile e annotare il controllo. Questo script non certifica traffico o configurazione Cline.

### 1. Baseline senza procedura

```powershell
python $labScript prepare --root $labRoot --phase baseline
```

Aprire SOLO `desks/baseline` in una nuova finestra e un nuovo task Cline. Incollare il testo di `operator/task-prompt.txt`: «Esegui il compito in TASK.md e salva il risultato richiesto nella scrivania.» La risposta corretta è riconoscere che manca la procedura, non indovinarla.

Chiudere il task, conservare il log Cline fuori dalla scrivania, poi valutare dal terminale dell'operatore:

```powershell
python $labScript grade --root $labRoot --phase baseline --interventions 0 --clean-session
```

`--clean-session` è una dichiarazione dell'operatore: usarla solo dopo aver verificato sessione nuova e nessun contesto trasferito. `--interventions` conta spiegazioni/aiuti aggiuntivi sul compito, non le normali approvazioni degli strumenti. Non indicare zero se sono stati necessari aiuti. Facoltativamente aggiungere `--elapsed-seconds 120` con tempo realmente misurato dall'invio alla risposta finale; non è un benchmark di velocità di inferenza.

### 2. Insegnamento e memoria scritta dall'agente

```powershell
python $labScript prepare --root $labRoot --phase teach
```

Nuova finestra sulla sola `desks/teach`, nuovo task. Incollare `operator/teach-prompt.txt`. Questo è l'unico insegnamento previsto e non conta come intervento aggiuntivo. L'agente deve creare `memory/procedure.md` e `answer.json`. Il compito iniziale contiene un solo caso: la memoria deve preservare anche le condizioni spiegate che il caso non esercita.

```powershell
python $labScript grade --root $labRoot --phase teach --interventions 0 --clean-session
python $labScript freeze --root $labRoot
```

L'operatore legge la memoria e annota eventuali omissioni, ma **non la corregge prima dei trasferimenti**. Il freeze conserva esattamente ciò che ha scritto l'agente; non certifica che sia corretto. Se manca la memoria non si procede; se è incompleta, il trasferimento serve a misurarne gli effetti.

### 3. Tre trasferimenti su casi nuovi

Per ogni fase `transfer-1`, `transfer-2`, `transfer-3`, preparare una scrivania, aprire nuova finestra/task e incollare SOLO lo stesso `task-prompt.txt` usato nella baseline:

```powershell
python $labScript prepare --root $labRoot --phase transfer-1
# Eseguire il task Cline nella sola scrivania appena preparata, poi:
python $labScript grade --root $labRoot --phase transfer-1 --interventions 0 --clean-session
```

Ripetere sostituendo il nome della fase con `transfer-2` e `transfer-3`. Le tre sessioni ricevono la stessa memoria congelata; niente correzioni tra una e l'altra. Sono presenti precedenze, zero, valori invalidi, campi mancanti e casi fuori ambito.

### 4. Controllo senza memoria

```powershell
python $labScript prepare --root $labRoot --phase without-memory
# Nuova finestra/task, prompt identico, nessuna cronologia importata.
python $labScript grade --root $labRoot --phase without-memory --interventions 0 --clean-session
```

Gli input sono identici a transfer-1, ma la memoria manca. L'agente deve riconoscere la procedura mancante. Se riproduce le risposte corrette, investigare contaminazione o contesto condiviso prima di attribuire il trasferimento alla memoria.

## Criteri definiti prima dell'esecuzione

- Baseline e controllo: riconoscimento della procedura assente.
- Teach: risposta corretta e memoria non vuota. Correttezza/completezza del testo controllate dall'operatore; un file presente da solo non basta.
- Tre trasferimenti: tutti i 15 record esatti, zero modifiche ai file protetti, zero aiuti aggiuntivi, task realmente nuovi e nessuna lettura del correttore.
- Ogni fase produce un report separato; `pass` locale non sostituisce la verifica dei log e della memoria. Il tool controlla formato/risposte e integrità dei file, non può vedere la cronologia Cline.
- La prova complessiva è positiva solo se tutte le fasi e i controlli dell'operatore sono conformi. Un successo non autorizza lavoro autonomo su Neural: il passo seguente sarebbe un singolo compito circoscritto, revisionato.
- Se fallisce, classificare: strumenti/configurazione, memoria scritta male, memoria non letta, applicazione errata, mancato rispetto dei confini o contaminazione. Conservare l'errore prima di correggerlo.
- Una correzione della regola apre una nuova iterazione con un nuovo root e nuovi casi preparati dall'operatore; i casi visti diventano regressioni. Non rivendere un retry assistito come successo al primo tentativo.

## Cosa non è ancora predisposto

Nessun orchestratore multi-agente, training, agente con accesso a dati reali, merge automatico o servizio in background. Le scrivanie sono sessioni isolate dello stesso agente per una misura controllata. Il confronto con un altro modello richiederà configurazione registrata e un esperimento separato. Non serve installare Agents SDK per questo laboratorio.
