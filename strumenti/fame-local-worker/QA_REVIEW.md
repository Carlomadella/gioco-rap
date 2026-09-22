# QA-REVIEW — primo compito su un documento reale di FAME Neural

## Scopo e fonte

Leggere il report Tsumugi controlled FAIL, selezionare le anomalie sostenute dalle evidenze e proporre il controllo successivo appropriato. Il documento include una correzione finale che restringe le conclusioni sul pair gate: il worker deve tenerne conto.

Fonte originale: `documentazione/fame-neural/OWNED_BEATS_AUDIO_TO_MIDI_P5_TSUMUGI_CONTROLLED_FAIL_2026-09-22.md`, commit `0f9c04889b26f9992fc969ad6c3ff464dc652790`.

Una copia congelata e inclusa in `cases/tsumugi-controlled-report.md`. Il checksum e verificato su UTF-8 con newline LF e un solo newline finale per compatibilita Windows. `desk.json` conserva percorso originale, commit e checksum. Questa prova interpreta quello snapshot: non certifica lo stato corrente della roadmap e non sostituisce eventuali decisioni successive.

## Dati e confini

Il modello riceve il report come elenco di righe non vuote con `evidenceId` stabile, numero di riga fisico e testo, piu una procedura e due cataloghi: categorie e controlli possibili, inclusi distrattori non giustificati dal report. Deve selezionare le categorie supportate e gli `evidenceId` pertinenti. Non riceve la tabella delle risposte attese del validatore.

L'host fornisce memoria e documento; il modello non cerca nella repo, non legge D:\FAME_NEURAL, non apre audio, non dispone di shell e non esegue i controlli proposti. La memoria e fornita dall'operatore: non e una prova di apprendimento o di ricerca autonoma dei file.

## Output e validazione

Il modello non ricopia quote o numeri di riga: restituisce `evidenceIds`. Dopo la validazione, l'host materializza `answer.json` legando ogni ID alla riga fisica e alla quote esatta dello snapshot; `review.md` presenta le stesse informazioni in italiano leggibile. Gli `evidenceIds` devono sostenere la finding, non una riga separata che descrive il nextCheck: il controllo successivo e validato indipendentemente. Questo elimina errori meccanici e non confonde prova dell'osservazione con giustificazione dell'azione.

Il validatore usa una rubrica curata specifica per il documento congelato:

- categorie supportate, completezza e assenza di duplicati; l'ordine e normalizzato dall'host;
- `evidenceId` pertinenti e copertura delle evidenze necessarie; le quote esatte sono legate dall'host;
- distinzione tra ipotesi timbrica e causa dimostrata;
- correzione del significato dei pitch selezionati dal top-k;
- controllo successivo ammesso per ogni categoria;
- nessuna autorizzazione a training, beat reali/P6 o cambi soglie.

Un `evidenceId` valido da solo NON dimostra che una conclusione sia giusta: qui anche il legame categoria-evidenza e verificato da una rubrica preparata e testata dall'operatore. La rubrica non e un valutatore semantico universale. Per un altro report serve un nuovo caso e una revisione della rubrica; non basta cambiare report.md.

Esito positivo: `VALIDATED_FOR_REVIEW`, con `humanReviewRequired: true` e `executionAuthorized: false`. Non significa validazione delle cause scientifiche o autorizzazione a eseguire una nuova inference. Le proposte rimangono da confrontare con la roadmap corrente prima di qualsiasi attuazione.

## Avvio sul PC

Da PowerShell nella repo aggiornata, con Ollama avviato e il modello gia installato:

```powershell
python strumenti/fame-local-worker/test_qa_worker.py -v
python strumenti/fame-local-worker/qa_worker.py init --root "$HOME\FAME_QA_REVIEW_004"
python strumenti/fame-local-worker/qa_worker.py run --root "$HOME\FAME_QA_REVIEW_004" --model "qwen3-coder:30b"
```

Cline non viene usato. Il modello indicato e quello gia provato dall'operatore, non un vincitore di benchmark. E possibile specificare un altro modello locale installato usando una scrivania separata. Init rifiuta root esistenti.

Default: massimo 2 chiamate, contesto richiesto 16384, num_predict 4096, temperatura 0 e seed 42. Il contesto e piu ampio della demo manifest per includere report e citazioni. `--attempts 1` permette una prova senza correzione. Il timeout HTTP del trasporto condiviso e 120 secondi per richiesta; timeout/errore server produce ERROR, non un falso fallimento semantico.

Ogni run salva una directory nuova sotto runs/ con snapshot, preflight (versione/digest/template Ollama), richieste e risposte integrali, controlli, durata e report finale. Primo tentativo e retry sono distinti tramite firstAttemptPass e acceptedAfterRetry. Il retry comunica i codici degli errori del validatore: e un tentativo assistito, non va contato come successo spontaneo. Non modificare input durante la prova.

- `VALIDATED_FOR_REVIEW`: answer.json e review.md prodotti; exit 0.
- `REJECTED`: tentativi esauriti; nessuna risposta accettata; exit 1.
- `ERROR`: errore operativo o materiali modificati; exit 1.
- errore iniziale CLI/desk/lock: exit 2.

La memoria assente in questa scrivania e un errore di preparazione, non una prova NEED_RULE. Dopo arresto forzato conservare la directory incompleta e rimuovere worker.lock solo dopo aver confermato che il processo sia terminato.

## Cosa e stato verificato e cosa manca

Le suite automatiche del manifest worker e del QA worker sono separate. Su Windows vanno eseguite direttamente con `test_agent.py` e `test_qa_worker.py`; verificano anche omissioni, false cause, evidenze non pertinenti, proposte vietate, alterazioni della fonte, retry e lock. Non costituiscono un risultato reale di Qwen su questo compito. Windows puo saltare il test symlink se la creazione dei link non e disponibile.

Prossima verifica: eseguire un run reale e leggere insieme report.json, answer.json e review.md. Misurare correttezza al primo tentativo, eventuale correzione e utilita della bozza per l'operatore. Non aggiungere nuove ripetizioni senza una domanda concreta da risolvere. Non dichiarare la rete pronta o il modello migliore sulla base di questo solo report noto.

I tre successi della precedente demo manifest non isolano Cline come causa dei fallimenti LUME-7: compito, prompt, contesto e responsabilita erano diversi. Questo task continua lo sviluppo del runtime diretto, non costituisce un confronto controllato fra runtime.


## Nota v4 — separazione tra evidenza e azione

La v4 corregge due falsi negativi osservati nei run reali v3: GATE_FAIL non richiede anche la riga che ribadisce la chiusura di beat reali/P6, e PAIR_CONFIDENCE_UNKNOWN non richiede anche la riga che propone la nuova diagnostica. In entrambi i casi la finding era gia sostenuta; il nextCheck viene controllato separatamente.

Restano volutamente errori reali se il modello sceglie un nextCheck non coerente con la Decisione/Correzione corrente o se una categoria composta non ha evidenza per tutte le sue parti (esempio: ZERO_INTERVALS richiede sia zero intervalli sia lo stato del silence gate).
