# FAME Direct Worker v1 — Ollama senza Cline

## Checkpoint prioritario: audit rubriche, senza nuove inferenze

Recovery reale riportato: 1/2, rete ancora 13/14 secondo il protocollo congelato. Completato audit delle 14 rubriche; il supporto contestuale E152+E153+E154 viene distinto dalla prova diretta E155. Leggere [RUBRIC_AUDIT.md](RUBRIC_AUDIT.md) ed eseguire `qa_rubric_audit.py` sugli artefatti esistenti. Nessun retry Ollama; esiti storici immutati. Il sidecar distingue conclusione, copertura e citazioni superflue. 26 test con client simulati passati. Questo checkpoint prevale sulle istruzioni operative storiche sotto.


## Checkpoint attuale: recovery del risultato 13/14

La rete 001 ha riportato 13/14 decisioni accettate (9/10 finding e 4/4 controlli negativi). Il solo LOWEND_CAUSES_UNPROVEN ha evidenze incomplete. Procedere con [RECOVERY.md](RECOVERY.md) e `qa_recovery.py`: due sottoincarichi, massimo due nuove chiamate, risultato originale conservato. Non ripetere il confronto monolitico né ricreare la rete 001. Questo aggiornamento prevale sulle istruzioni operative storiche riportate sotto. Recovery reale ancora da eseguire; 19 test del codice passati con client simulato.


## Flusso coordinato attuale

Il primo coordinatore con scrivanie specializzate e pronto: leggere [COORDINATOR.md](COORDINATOR.md). Una categoria per agente, 14 incarichi in sequenza sullo stesso GPT-OSS, stato persistente e controlli congelati. Si usa `qa_coordinator.py` in una nuova rete `FAME_AGENT_NETWORK_001`; i test e i risultati precedenti restano separati. Nessun risultato reale della rete ancora disponibile.


Primo worker locale con scrivania dedicata. Python 3.10+ e sola libreria standard, nessun pacchetto pip, SDK a pagamento o Cline richiesto. Il modello deve essere gia installato in Ollama; questo programma non scarica modelli e non seleziona servizi cloud.

## Cosa e pronto

- Una scrivania con TASK.md, input.json, memory/procedure.md e assets/.
- Lettura deterministica dei file consentiti e calcolo SHA256 eseguiti dal programma.
- Chiamata diretta a `/api/chat`, JSON Schema nel parametro `format` e nessun tool eseguibile esposto al modello.
- Validazione indipendente del contenuto, non soltanto del formato.
- Massimo 2 tentativi per default, configurabile 1..3; ogni tentativo conservato.
- Risultato scritto solo dopo validazione e ricontrollo degli input.
- Un report per run, con primo tentativo distinto dalla correzione assistita.
- Lock per impedire due worker contemporanei nella stessa scrivania.

Non e ancora un coordinatore multiagente, un coding agent generico o una prova di apprendimento. E la base eseguibile su cui verificare il runtime prima di concedere strumenti piu ampi.

## Primo compito: MANIFEST-AUDIT-1

I record indicano id, percorso relativo sotto assets/ e SHA256 atteso. Il worker propone READY, MISSING, INVALID o HASH_MISMATCH. L'host verifica il risultato tramite regole indipendenti; la priorita e percorso/hash valido, esistenza, confronto hash.

La demo usa un file di testo e quattro record: presente, mancante, hash errato e percorso non consentito. Non legge D:\FAME_NEURAL e non tocca training, holdout, audio o codice del gioco. READY certifica solo esistenza e hash rispetto all'atteso, non licenza, qualita o ammissibilita del dataset.

Questo compito puo gia essere risolto interamente dal programma. E intenzionale: consente di verificare il ciclo modello -> controllo -> correzione con un risultato certo. In produzione gli hash resteranno un'operazione deterministica, non un lavoro da delegare al modello. Per compiti piu complessi servira un altro validatore: questo non certifica modifiche a codice o algoritmi Audio->MIDI.

La memoria iniziale e una procedura scritta dall'operatore e fornita dal runtime. Il modello non la scrive e non la modifica. Cambiarne il significato senza aggiornare il validatore provoca ERROR. Il caso memoria assente restituisce NEED_RULE dall'HOST, senza chiamare Ollama; non va contato come successo del modello.

## Avvio Windows / PowerShell

Dal terminale nella repo aggiornata:

```powershell
python -m unittest discover -s strumenti/fame-local-worker -p "test_*.py" -v
python strumenti/fame-local-worker/agent.py init --root "$HOME\FAME_DIRECT_WORKER_001"
python strumenti/fame-local-worker/agent.py run --root "$HOME\FAME_DIRECT_WORKER_001" --model "qwen3-coder:30b"
```

Ollama deve essere in esecuzione sul suo indirizzo locale standard. Qwen e solo un esempio gia installato, non il vincitore di un confronto. Usare il nome ESATTO restituito da `ollama list`, incluso tag. Per GPT-OSS/Devstral/altri modelli usare una nuova root con stesso contenuto iniziale e cambiare --model dopo averli installati separatamente. Non viene effettuato alcun fallback nascosto.

Non aprire Cline e non incollare istruzioni manualmente nel modello. Il programma fornisce tutto il contesto. Una volta avviato, stampa il tentativo in corso e infine il percorso del report. Non eseguire contemporaneamente altre modifiche nella scrivania.

Parametri facoltativi:

```powershell
python strumenti/fame-local-worker/agent.py run --root "$HOME\FAME_DIRECT_WORKER_001" --model "qwen3-coder:30b" --attempts 1 --num-ctx 8192 --seed 42 --temperature 0
```

Default: due tentativi, contesto richiesto 8192, massimo 2048 token generati, seed 42, temperatura 0. La dimensione del contesto e ridotta per questo piccolo compito; il confronto con Cline a 32768 non isola il solo effetto del runtime. Questi sono parametri richiesti all'API, non una promessa di determinismo identico su hardware/runtime differenti. Il template e i parametri del modello Ollama sono registrati in preflight.json; assenza di Cline non significa assenza del template del modello.

Timeout HTTP 120 secondi per richiesta. ERROR non viene ritentato automaticamente come se fosse un errore di ragionamento. Se l'avvio del modello eccede il timeout, conservare quel run e verificare Ollama; non modificarne retroattivamente l'esito.

## Come leggere i risultati

Ogni esecuzione crea `runs/<timestamp>/`:

- request-config.json: modello e opzioni richieste.
- preflight.json: versione Ollama, digest e metadati/template del modello.
- snapshot.json: task, procedura, input e osservazioni esattamente usati.
- attempt-N-request.json / response.json: richieste e risposte integrali, incluse eventuali metriche/thinking restituiti da Ollama.
- attempt-N-validation.json: errori e durata del tentativo.
- answer.json: presente solo per risultato accettato o NEED_RULE deciso dall'host.
- report.json: esito finale e conteggio chiamate al modello.

Esiti:

| Stato | Significato |
|---|---|
| ACCEPTED + firstAttemptPass=true | Risposta corretta alla prima chiamata |
| ACCEPTED + acceptedAfterRetry=true | Risposta corretta dopo feedback del validatore |
| REJECTED | Tentativi esauriti; nessun answer accettato |
| NEED_RULE | Host rileva memoria assente; zero chiamate modello |
| ERROR | Errore operativo/configurazione/input; non e successo del modello |

Exit code 0 per ACCEPTED o NEED_RULE (stato gestito); 1 per REJECTED/ERROR; 2 per errore iniziale CLI. Non interpretare il solo exit code 0 come PASS del modello: leggere lo stato. I run sono immutabili dal worker e non si sovrascrivono. Un arresto forzato puo lasciare una directory incompleta e worker.lock: conservarla; rimuovere solo il lock dopo aver verificato che il processo non sia piu attivo.

## Confini e limiti verificabili

Il client contatta solo http://127.0.0.1:11434, disabilita proxy e redirect, non accetta URL dal modello e rifiuta tag cloud/metadati remote_host/remote_model. Non puo certificare che il processo Ollama stesso non effettui accessi di rete. Per una prova offline, dopo download e avvio disconnettere la rete e verificare il funzionamento; oppure configurare Ollama in local-only secondo la documentazione ufficiale.

Il modello non dispone di shell, browser, filesystem o native tool dispatcher. Legge un pacchetto preparato dall'host e restituisce dati: eventuali tool_calls vengono respinte. Percorsi assoluti, traversal e link sono rifiutati; hash calcolati solo sotto assets/. Questo non e una sandbox OS contro altri processi locali ostili o corse sul filesystem. Non eseguire codice generato con questo worker.

Il controllo semantico usa uno snapshot, poi ricontrolla i file prima dell'accettazione. Non autentica gli hash attesi forniti dall'operatore. La cartella e i file di controllo devono essere gestiti dall'operatore. I log restano locali e contengono gli input: condividerli solo se si desidera condividerne il contenuto.

## Prossimi passi per chi riprende il lavoro

1. Eseguire questa demo con il modello locale scelto; raccogliere report e risposte reali. I test automatici usano risposte simulate e NON dimostrano qualita del modello.
2. Ripetere in run nuovi senza correggere manualmente output o prompt. Confrontare primo tentativo, successo dopo retry, durata ed errori.
3. Scegliere un compito Neural ristretto dove il modello aggiunga valore; definire dati ammessi e validatore prima di aggiungere strumenti.
4. Solo dopo una verifica utile aggiungere coda sequenziale e piu scrivanie. Memoria condivisa e modifiche al codice richiedono versionamento/revisione. Nessuna autorizzazione automatica a training o holdout deriva da questa demo.

Documentazione API consultata:
- https://docs.ollama.com/api/chat (schema JSON, opzioni, risposta)
- https://docs.ollama.com/faq (contesto, GPU, configurazione locale)


## Compito QA su un report reale

Disponibile [QA-REVIEW-1](QA_REVIEW.md): lettura del report Tsumugi congelato, citazioni verificate e controlli successivi proposti. Avvio con `qa_worker.py`; la demo manifest e `agent.py` restano invariati. Esito positivo limitato a `VALIDATED_FOR_REVIEW`, senza esecuzioni autorizzate.
