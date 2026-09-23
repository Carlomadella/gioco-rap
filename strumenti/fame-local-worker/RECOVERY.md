# Recupero controllato della rete 001

## Checkpoint prioritario: audit rubriche, senza nuove inferenze

Recovery reale riportato: 1/2, rete ancora 13/14 secondo il protocollo congelato. Completato audit delle 14 rubriche; il supporto contestuale E152+E153+E154 viene distinto dalla prova diretta E155. Leggere [RUBRIC_AUDIT.md](RUBRIC_AUDIT.md) ed eseguire `qa_rubric_audit.py` sugli artefatti esistenti. Nessun retry Ollama; esiti storici immutati. Il sidecar distingue conclusione, copertura e citazioni superflue. 26 test con client simulati passati. Questo checkpoint prevale sulle istruzioni operative storiche sotto.


## Stato e obiettivo

L'output fornito dall'operatore registra 13/14 decisioni accettate: 9/10 affermazioni supportate e quattro affermazioni non supportate correttamente respinte. Il solo fallimento è LOWEND_CAUSES_UNPROVEN. Le evidenze selezionate coprono i silenzi sulle note alte ma non l'incertezza sulla release corta. Il fallimento originale resta registrato; non si allenta il criterio.

`qa_recovery.py` prepara due incarichi separati sullo stesso report completo:

- RELEASE_CAUSE_UNPROVEN: verificare l'incertezza sulla causa della release corta.
- HIGH_NOTE_CAUSE_UNPROVEN: verificare l'incertezza sulla causa dei silenzi sulle note alte.

Stesso GPT-OSS 20B e digest, think=low, contesto 16384, budget 4096. Nessuna risposta attesa, ID corretto o rubrica viene passato al modello. La rubrica è lato operatore. I due risultati sono ricombinati e rivalidati contro il criterio originale completo. Il riuso del coordinatore avviene in un modulo isolato: i file del protocollo precedente non vengono modificati.

## Esecuzione PowerShell

Dalla worktree `C:\Users\mycol\gioco-rap-fame-neural`, sul branch `feature/fame-neural-roadmap`, aggiornare senza forzare:

```powershell
git pull --ff-only
```

Se Git segnala conflitti o modifiche incompatibili, fermarsi senza reset/stash automatici. Non ricreare o cancellare `FAME_AGENT_NETWORK_001`.

Preparare il recovery (nessuna chiamata al modello):

```powershell
python strumenti/fame-local-worker/qa_recovery.py init --source "$HOME\FAME_AGENT_NETWORK_001" --root "$HOME\FAME_AGENT_RECOVERY_001"
```

Eseguire al massimo due chiamate, una per incarico:

```powershell
python strumenti/fame-local-worker/qa_recovery.py run --root "$HOME\FAME_AGENT_RECOVERY_001"
```

Il runner accetta solo una rete originale completa 13/14, con il solo LOWEND_CAUSES_UNPROVEN in SEMANTIC_FAIL. Controlla richieste, risposte e ricevute originali e congela gli hash degli artefatti. Fonte e recovery devono essere cartelle separate. Gli hash rilevano cambiamenti rispetto allo snapshot locale: non costituiscono una firma indipendente dell'operatore.

Un secondo `run` visita soltanto incarichi mai tentati: nessun retry automatico di errori, fallimenti o tentativi interrotti. Non cancellare una cartella per ottenere un nuovo primo tentativo. Dopo un crash, rimuovere un eventuale lock soltanto dopo aver confermato che il processo è terminato.

Per rileggere e rivalidare senza chiamare Ollama:

```powershell
python strumenti/fame-local-worker/qa_recovery.py status --root "$HOME\FAME_AGENT_RECOVERY_001"
```

## Interpretazione

Il risultato finale è in `recovery-results/<timestamp>/evaluation.json`. Le cartelle `summaries` descrivono solo i due sottoincarichi, non l'esito della rete completa.

- `VALIDATED_AFTER_RECOVERY`: entrambe le verifiche accettate, evidenze unite sufficienti per la rubrica originale e tutti i dieci finding validi. Vengono scritti anche answer.json e review.md.
- `NEEDS_REVIEW`: recupero non completo; nessun report finale promosso. Conservare raw response, result ed evaluation per diagnosi.
- `firstPassAccepted=13`, `firstPassTotal=14`, `firstPassPassed=false` restano invariati anche se dopo il recupero si arriva a 14/14.

I tempi del primo passaggio e del recupero restano distinti e viene riportato il totale. Nessun training, batch audio, modifica algoritmo o task-data readiness viene autorizzato. Il livello low è richiesto, non certificato tramite una misura indipendente.

## Checkpoint successivo per GPT-5.6 / GPT-6

1. Registrare l'esito reale del recovery, inclusi eventuali fallimenti, con modello, digest, richieste, risposte, tempi e interventi umani. I test simulati del codice non sono risultati del modello.
2. Se fallisce, ispezionare le risposte delle sole due scrivanie; non aumentare retry o indebolire rubriche per ottenere un PASS.
3. Se passa, congelare il protocollo prima di scegliere un nuovo report non usato per svilupparlo. Definire prima della chiamata affermazioni vere, false e composte e rubrica indipendente lato operatore. Non inserire nel prompt ID attesi o risposte.
4. Misurare separatamente primo passaggio, recuperi, falsi positivi, evidenze mancanti, chiamate, tempo modello e revisione umana. Un nuovo report potrà valutare trasferimento; questo recovery sul caso noto no.
5. Solo dopo quel controllo assegnare un primo lavoro QA reale ristretto. La generalizzazione della scomposizione è ancora da progettare: questa versione implementa esplicitamente il caso low-end, non un pianificatore autonomo universale.

## Verifica del codice

Dalla cartella strumenti/fame-local-worker:

```powershell
python -m unittest test_qa_coordinator test_qa_recovery -q
```

19 test con client simulato: isolamento incarichi, copertura semantica, merge sotto rubrica originale, conservazione byte per byte della fonte, assenza di riesecuzione, interruzioni, errori di trasporto, modifiche alla fonte prima/durante il run e manomissione della risposta. Nessuna chiamata reale a Ollama eseguita per questi test.
