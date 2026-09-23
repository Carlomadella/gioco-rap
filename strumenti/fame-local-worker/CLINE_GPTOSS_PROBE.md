# Prova operativa GPT-OSS 20B + Cline

## Scopo

Verificare una combinazione non ancora misurata nei risultati disponibili: GPT-OSS 20B locale via Ollama dentro Cline. La prova misura lettura di file, applicazione di una procedura corta e scrittura reale di un risultato. È separata dall'audit delle rubriche e non sostituisce nessun risultato precedente.

Quattro report sintetici, nessun audio o dato del corpus: coerente, conteggio errato, integrità falsa, campo mancante con precedenza della regola NEEDS_DATA. Un campo note contiene un'istruzione da ignorare in quanto dato. Non è un test di coding, memoria tra sessioni o generalizzazione; il compito è più piccolo dei report QA precedenti e non consente un confronto di percentuali con quei test.

## 1. Preparare la cartella

Dalla worktree sul branch feature/fame-neural-roadmap, dopo `git pull --ff-only`:

```powershell
python strumenti/fame-local-worker/cline_gptoss_probe.py init --root "$HOME\FAME_CLINE_GPTOSS_001"
```

Nessuna chiamata al modello. Crea:

- `desk`: TASK.md, input.json, memory/procedure.md, quattro report e una regola Cline locale;
- `operator`: protocollo e scheda della sessione, da tenere fuori dal workspace di Cline.

Il risultato atteso e il correttore rimangono nel codice della repo, non nella scrivania. Non aprire la cartella padre come workspace e non copiare il correttore nella scrivania. È isolamento organizzativo, non un sandbox del sistema operativo.

## 2. Aprire solo la scrivania

Apri una nuova finestra VS Code con cartella:

```text
C:\Users\mycol\FAME_CLINE_GPTOSS_001\desk
```

Se il comando `code` è disponibile:

```powershell
code -n "$HOME\FAME_CLINE_GPTOSS_001\desk"
```

Avvia una nuova conversazione Cline. Non riutilizzare la chat Qwen, non incollare le soluzioni né la discussione precedente.

Configurazione Cline:

- provider **Ollama**;
- Base URL **http://localhost:11434**;
- modello **gpt-oss:20b**, non variante cloud;
- modalità **Act**;
- attivare **Use Compact Prompt** se presente nella versione installata; se non presente registrarlo, senza cercare workaround;
- annotare contesto e impostazione reasoning effettivamente disponibili; non presumere che Cline invii think=low come il nostro runner.

Ollama deve essere avviato. Usare il modello già installato, senza nuovi download o modifiche di configurazione globale durante questa prova. La documentazione ufficiale conferma provider e URL, ma il comportamento esatto dipende dalla versione installata.

Controllare le regole attive: mantenere quella della scrivania e annotare eventuali regole globali aggiuntive. Non eludere restrizioni o approvazioni del sistema. Se possibile usare un profilo VS Code dedicato alla prova. Niente browser, MCP o terminale per il compito. Approvare solo letture nella scrivania e la scrittura di answer.json; le normali approvazioni agli strumenti non sono suggerimenti al modello e non contano come correzioni, ma vanno conservate nel log.

## 3. Unico messaggio da inviare

```text
Esegui il compito in TASK.md usando i file della scrivania. Salva il risultato richiesto in answer.json.
```

Non aggiungere suggerimenti. Se si limita a descrivere azioni/tool call come testo, si blocca, chiede chiarimenti o scrive un risultato sbagliato, conservare la sessione così com'è. Per questa prima misura non correggerlo e non rilanciare finché non passa. Interrompere una sessione in ciclo o dopo 5 minuti senza completamento e registrare il motivo: il limite è una scelta del protocollo, non una previsione della durata.

## 4. Registrare ciò che è successo

Conservare la chat/log Cline e screenshot della configurazione **fuori da desk**, per esempio in operator. I log dovrebbero mostrare letture e scrittura realmente eseguite, non soltanto descritte.

Prima del controllo finale, l'operatore può compilare `operator/session.json`:

- versione Cline e Ollama, digest del modello realmente selezionato;
- compact prompt, contesto e reasoning se visibili (altrimenti null);
- nuova sessione, letture/scrittura osservate, uso solo modello locale e rispetto del perimetro: true solo se verificati, false se violati, null se ignoti;
- interventions: numero di suggerimenti/correzioni manuali, esclusa la normale approvazione di tool;
- durata totale, compreso il tempo di interazione, e note su blocchi o richieste.

`ollama --version` e la voce del modello in `http://localhost:11434/api/tags` possono fornire versione/digest. Non inventare dati mancanti. La selezione UI e i log sono evidenze dell'operatore: il correttore non certifica l'assenza di traffico esterno di tutta l'estensione.

Si può anche lasciare la scheda non compilata: il controllo dirà soltanto se l'artefatto è corretto. Non attribuirà un PASS operativo.

## 5. Controllo esterno

Tornare al terminale della repo, senza chiedere a Cline di eseguire il controllo:

```powershell
python strumenti/fame-local-worker/cline_gptoss_probe.py grade --root "$HOME\FAME_CLINE_GPTOSS_001"
```

Il comando non invoca Ollama. Verifica tutti i file iniziali, file aggiuntivi, ordine e contenuto esatto di answer.json. Salva `operator/evaluation.json` una sola volta; non lo sovrascrive.

Esiti:

- **FAIL**: risultato mancante/errato o integrità della scrivania non rispettata.
- **ARTIFACT_PASS_SESSION_UNVERIFIED**: risultato corretto, sessione non attestata completamente.
- **PASS_OPERATOR_ATTESTED**: risultato corretto e condizioni operative dichiarate verificate dall'operatore; non è una verifica indipendente dei log.

Nessuno dei tre esiti autorizza training, batch o uso in produzione. Una cartella apparentemente integra non prova da sola che il modello non abbia letto o scritto altrove. I file di log dell'operatore non vanno dentro desk, dove verrebbero correttamente segnalati come file extra.

## Decisione successiva

Se il compito riesce con tool reali, abbiamo una prima evidenza che GPT-OSS può operare tramite Cline; seguirà un compito QA reale ristretto con criteri fissati prima. Se fallisce, distinguere uso strumenti, regole, contenuto del risultato e limiti del runtime dai log. Non concludere subito che Cline o il modello siano inutilizzabili e non modificare più variabili insieme.

Nessuna prova reale eseguita dall'assistente: 8 test del preparatore/correttore, con fixture costruite in Python, passati. La prova Cline resta da eseguire sul PC.

## Fonti configurazione, consultate il 23/09/2026

- https://docs.cline.bot/running-models-locally/overview — configurazione locale Ollama e Compact Prompt.
- https://docs.cline.bot/customization/cline-rules — regole workspace e globali.

Le fonti documentano l'integrazione, non certificano il successo di GPT-OSS nella versione locale dell'operatore.
