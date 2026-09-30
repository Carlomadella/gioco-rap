# Coordinatore locale e scrivanie QA — v1

## Obiettivo operativo

Primo flusso coordinato della rete FAME Neural: GPT-OSS locale esegue un incarico per chiamata, il coordinatore Python assegna i compiti, conserva gli artefatti, applica la rubric e raccoglie gli esiti. E un prototipo operativo di rete specializzata per QA documentale, non ancora una rete generalista autorizzata a modificare FAME Neural.

Le scrivanie sono ruoli logici, non copie del modello caricate in parallelo. In questa versione ci sono 14 scrivanie: una per ciascuna delle 14 categorie del catalogo. Dieci sono sostenute dal report; quattro devono essere respinte. Non comunichiamo al modello questa ripartizione ne le soluzioni della rubric.

L'obiettivo futuro di circa venti ruoli resta compatibile con la struttura; non creiamo sei ruoli fittizi per raggiungere il numero. Nuove aree richiederanno incarichi, permessi, input e controlli propri.

## Organizzazione

- `network.json`: configurazione congelata, ordine della coda, modello/digest, limite zero retry.
- `report.md`: documento condiviso, completo e congelato.
- `desks/<categoria>/TASK.json`: una sola affermazione da verificare.
- `desks/<categoria>/memory/procedure.md`: istruzioni persistenti della scrivania, predisposte dal sistema; non memoria appresa dal modello.
- `desks/<categoria>/attempt-1/`: richiesta, risposta grezza, risultato e ricevuta con hash.
- `sessions/`: piano della sessione e preflight, con rubric solo lato host.
- `summaries/<timestamp>/summary.json`: aggregazione riproducibile e problemi per scrivania.
- `answer.json` e `review.md` nell'ultima summary soltanto se tutte le decisioni sono accettate.

Ogni chiamata vede il report completo e la propria affermazione; non riceve cronologie, risposte degli altri agenti, codice del validatore o autorizzazioni operative. Non legge autonomamente file e non ha tool. L'esecuzione e in sequenza sul medesimo modello, senza Cline.

Il coordinatore e deterministico: non interpreta il report, non inventa conclusioni mancanti e non concede un PASS per maggioranza. Applica coda e controlli e segnala i problemi all'operatore. In questo primo protocollo non riassegna automaticamente i fallimenti: il risultato resta leggibile e il numero di chiamate resta limitato.

## Parametri e nuovo protocollo

- `gpt-oss:20b`, stesso digest registrato nella diagnostica precedente.
- `think=low`, contesto 16384, generazione massima 4096 token per chiamata, temperatura 0, seed 42.
- 14 chiamate al massimo su una scrivania di rete; preflight HTTP aggiuntivo a ogni ripresa.
- Stesso report, catalogo e rubric semantica dei test precedenti.
- Nuovo contratto di risposta: `{"supported":true oppure false,"evidenceIds":[...]}`.
- Nuovo prompt focalizzato su una categoria, con istruzioni esplicite sulla copertura delle prove.

Questa e una nuova architettura/procedura; non una replica identica del confronto precedente. Cambiano granularita, prompt e contratto. Un miglioramento sosterrebbe l'utilita della divisione del lavoro, ma non dimostrerebbe che il solo sovraccarico fosse la causa. Il caso e gia osservato; un risultato positivo dovra poi essere verificato su nuovi documenti.

La richiesta di ragionamento low viene registrata. Se api/show la esclude esplicitamente il programma si ferma; se mancano metadati non certifica l'effettiva applicazione del livello.

## Uso PowerShell

Dalla worktree sul branch feature/fame-neural-roadmap, un comando alla volta:

```powershell
git pull --ff-only origin feature/fame-neural-roadmap
python strumenti/fame-local-worker/qa_coordinator.py init --root "$HOME\FAME_AGENT_NETWORK_001"
python strumenti/fame-local-worker/qa_coordinator.py run --root "$HOME\FAME_AGENT_NETWORK_001"
```

Il comando run esegue la coda e stampa progressi dopo ogni agente. L'operatore non deve copiare quattordici risposte manualmente. Nessun nuovo download: riusa GPT-OSS gia installato. Il tempo totale va misurato; non promettiamo una durata sulla base del singolo vecchio run.

Per suddividere volontariamente l'esecuzione si puo aggiungere `--max-tasks 3`: il limite riguarda soltanto questa sessione. Rilanciare run riprende ESCLUSIVAMENTE le scrivanie PENDING. Non ripete successi, fallimenti o tentativi interrotti. Il codice di uscita e 1 anche per IN_PROGRESS; questo indica rete non ancora tutta validata, non la perdita degli esiti precedenti.

Per leggere lo stato senza chiamare Ollama:

```powershell
python strumenti/fame-local-worker/qa_coordinator.py status --root "$HOME\FAME_AGENT_NETWORK_001"
```

Non cancellare le scrivanie precedenti. Se init trova una cartella esistente si ferma. Un lock impedisce due coordinatori contemporanei; dopo un arresto forzato del processo rimuoverlo solo quando e certo che non esista un coordinatore attivo. Un tentativo interrotto resta registrato e richiede revisione, non viene mascherato con un retry.

## Controlli e decisione

- Supported true: stessi controlli sulle citazioni della rubric congelata, inclusa la rimozione tracciata di contesto superfluo solo quando le prove restanti bastano.
- Supported false: evidenze vuote obbligatorie; una categoria realmente sostenuta e marcata MISSED_SUPPORTED_CLAIM.
- Una categoria falsa accettata dal modello e un errore, anche se le altre dieci sono corrette.
- VALIDATED_FOR_REVIEW richiede 14/14 decisioni corrette e 10 finding supportate. Il semplice 10/10 delle conclusioni non basta se passa anche una falsa.
- NEEDS_REVIEW: coda completata ma almeno una scrivania fallita/interrotta. Nessun answer globale approvato.
- IN_PROGRESS: restano incarichi PENDING. Un errore di trasporto arresta la sessione per evitare una serie di timeout; le successive scrivanie restano disponibili per la ripresa.

Conservare i conteggi di false affermazioni accettate, affermazioni vere perse, citazioni insufficienti, evidenze scartate, token e tempi. Il summary contiene risultati e metriche per agente. Il tempo umano non viene inventato; risparmio non ancora dimostrato. Per il confronto conta il costo dell'intera rete, non solo quello di una chiamata.

Il modello non ha accesso shell/file/rete arbitrario; il client contatta solo Ollama loopback. Questo non certifica che il server Ollama o l'intero PC siano isolati dalla rete. Hash e lock proteggono da alterazioni accidentali/concorrenza, non costituiscono una sandbox contro un processo locale ostile.

## Stato e verifica

Preparato il 23/09/2026. Undici nuovi test automatici passati nel container con modello simulato: 14 richieste isolate, assenza di rubric nelle richieste, aggregazione, ripresa senza ripetizioni, rifiuto categorie false, omissioni, troncamento, input/risposta modificati, lock, interruzione e timeout. Nessuna prova reale della rete eseguita dall'assistente.

```powershell
python -m unittest discover -s strumenti/fame-local-worker -p "test_qa_coordinator.py"
```

I FAIL storici restano validi. Il coordinatore non modifica algoritmi FAME Neural e non apre training, audio, batch 131 o P6. Dopo un eventuale esito positivo: revisione umana, un nuovo caso con criteri fissati prima della prova, poi estensione mirata delle scrivanie verso incarichi realmente utili.

## Passaggio di consegne a GPT-6

Leggi questo documento sul branch feature/fame-neural-roadmap. La rete pilota e gia implementata: guida Mycol nei comandi init/run/status un passo alla volta. Non riscrivere il sistema, non ripetere i vecchi test e non cambiare rubric/prompt dopo aver visto le risposte. Esamina summary e singole risposte problematiche prima di proporre altri esperimenti.
