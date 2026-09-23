# FAME Neural — Recap rete agenti locali

## Checkpoint prioritario: audit rubriche, senza nuove inferenze

Recovery reale riportato: 1/2, rete ancora 13/14 secondo il protocollo congelato. Completato audit delle 14 rubriche; il supporto contestuale E152+E153+E154 viene distinto dalla prova diretta E155. Leggere [RUBRIC_AUDIT.md](../../strumenti/fame-local-worker/RUBRIC_AUDIT.md) ed eseguire `qa_rubric_audit.py` sugli artefatti esistenti. Nessun retry Ollama; esiti storici immutati. Il sidecar distingue conclusione, copertura e citazioni superflue. 26 test con client simulati passati. Questo checkpoint prevale sulle istruzioni operative storiche sotto.


## Checkpoint attuale: recovery del risultato 13/14

La rete 001 ha riportato 13/14 decisioni accettate (9/10 finding e 4/4 controlli negativi). Il solo LOWEND_CAUSES_UNPROVEN ha evidenze incomplete. Procedere con [RECOVERY.md](../../strumenti/fame-local-worker/RECOVERY.md) e `qa_recovery.py`: due sottoincarichi, massimo due nuove chiamate, risultato originale conservato. Non ripetere il confronto monolitico né ricreare la rete 001. Questo aggiornamento prevale sulle istruzioni operative storiche riportate sotto. Recovery reale ancora da eseguire; 19 test del codice passati con client simulato.


Data: 23/09/2026

## Obiettivo

Costruire una rete di agenti locali affidabile per FAME Neural, evitando che il corretto funzionamento dipenda dalla perfezione del singolo modello.

## Repository / branch

Repository: `Carlomadella/gioco-rap`

Branch di lavoro: `feature/fame-neural-roadmap`

Commit rilevante del Direct Worker:

- `4fc650ea549dc28a5eb56b0e3690e171ba5f5dca`
- `feat(local-worker): add direct Ollama desk worker with bounded retries and semantic validation`

Parent:

- `1fbc4c01df9d2bda69a10887b49687f8963f555f`
- fix UTF-8 del laboratorio proof-zero v2 su Windows.

## Esperimento Cline / proof-zero v2

Root locale usata:

`C:\Users\mycol\FAME_AGENT_PROOF_ZERO_003`

Modello:

`qwen3-coder:30b`

Configurazione registrata:

- Ollama `0.34.2`
- Cline `4.1.19`
- context `32768`
- Compact Prompt enabled
- quantizzazione Q4_K_M
- modello/digest congelati nell'esperimento

### Baseline

Tre trial eseguiti, tutti FAIL.

1. Baseline trial 1
   - inventa una procedura LUME-7 non fornita;
   - crea illegalmente `memory/procedure.md`;
   - produce output semanticamente scorretto.

2. Baseline trial 2
   - riconosce che manca la procedura;
   - invece di restituire `NEED_RULE`, chiede informazioni all'operatore;
   - nessun `answer.json`;
   - registrato 1 intervento umano.

3. Baseline trial 3
   - ammette che LUME-7 non è disponibile;
   - produce comunque `procedure_status: APPLIED`;
   - output scorretto.

Risultato baseline: **0/3 PASS**.

### Teach

Il prompt teach conteneva integralmente LUME-7.

Cline:

- legge correttamente TASK e input;
- ricostruisce correttamente tutte le regole;
- calcola correttamente il caso teach:
  - `LEARN-843`
  - `route=RHO`
  - `ticket=RHO:843:12`
- invece di salvare memoria e risposta, apre `ask_question` per chiedere conferma all'operatore.

Il task è stato interrotto senza rispondere.

Grade teach:

- `pass: false`
- `correct: false`
- `ANSWER_UNREADABLE`
- `MEMORY_MISSING_OR_EMPTY`

Quindi:

- nessun `answer.json`;
- nessun `memory/procedure.md`;
- nessuna memoria da congelare;
- transfer non eseguibili senza contaminare il protocollo.

### Summary proof-zero v2

- requiredRuns: 16
- recordedRuns: 4
- baseline: 3 FAIL
- teach: 1 FAIL
- transfer e without-memory non eseguiti
- risultato complessivo: FAIL

## Diagnosi

Il fallimento non dimostra che Qwen3-Coder 30B sia incapace di ragionare.

Nel teach il modello aveva compreso e applicato correttamente LUME-7 mentalmente, ma il runtime Cline gli ha permesso/comandato comportamenti incompatibili con il protocollo, tra cui la richiesta di chiarimenti.

Il problema principale individuato è quindi:

**controllo operativo / instruction-following dentro Cline, non necessariamente il modello.**

## Architettura già presente in repository

La repository contiene:

`strumenti/fame-local-worker/`

File principali:

- `README.md`
- `agent.py`
- `test_agent.py`

Nome del sistema:

**FAME Direct Worker v1 — Ollama senza Cline**

### Caratteristiche

- Python 3.10+, sola libreria standard.
- Chiamata diretta a Ollama `/api/chat`.
- Connessione del client solo a `127.0.0.1:11434`.
- JSON Schema passato tramite `format`.
- Nessun tool eseguibile esposto al modello.
- Nessuna shell, browser o filesystem direttamente disponibile al modello.
- Lettura file e SHA256 eseguiti dall'host.
- Validazione indipendente del contenuto.
- Massimo 1–3 tentativi, default 2.
- Primo tentativo e retry conservati separatamente.
- Risultato scritto solo dopo validazione.
- Lock per impedire due worker simultanei sulla stessa scrivania.
- Se manca la memoria, è l'HOST a restituire `NEED_RULE` senza chiamare Ollama.
- La memoria non viene scritta o modificata dal modello.
- Tool call inattese vengono respinte.
- Modelli cloud/remote vengono respinti.
- Nessun fallback nascosto tra modelli.

Il README specifica inoltre che `qwen3-coder:30b` è un esempio installato, non un vincitore predeterminato.

## Test automatici del Direct Worker

Comando eseguito:

`python strumenti/fame-local-worker/test_agent.py -v`

Risultato:

- 13 test totali
- 12 PASS
- 1 SKIP: symlink non disponibile su Windows
- 0 FAIL

Lo skip riguarda soltanto il test symlink e non la logica Ollama/worker.

## Prima prova reale con Ollama

Root:

`C:\Users\mycol\FAME_DIRECT_WORKER_001`

Modello:

`qwen3-coder:30b`

Comando:

`python strumenti/fame-local-worker/agent.py run --root "$HOME\FAME_DIRECT_WORKER_001" --model "qwen3-coder:30b"`

### Run 1

Report:

`runs\20260922T222053697978Z\report.json`

Esito:

- `status: ACCEPTED`
- `firstAttemptPass: true`
- `acceptedAfterRetry: false`
- `modelCalls: 1`
- `networkScope: loopback client; Ollama server network isolation not certified`

### Run 2

Report:

`runs\20260922T222209347405Z\report.json`

Esito:

- `status: ACCEPTED`
- `firstAttemptPass: true`

### Run 3

Report:

`runs\20260922T222235281635Z\report.json`

Esito:

- `status: ACCEPTED`
- `firstAttemptPass: true`

## Risultato attuale

**Qwen3-Coder 30B + Ollama diretto + FAME Direct Worker = 3/3 PASS al primo tentativo.**

Nessun retry necessario nei tre run reali.

Questo è il primo segnale concreto che il problema osservato nel proof-zero non era necessariamente Qwen 30B in sé, ma in larga parte il modo in cui veniva orchestrato tramite Cline.

## Decisione operativa corrente

Non conviene continuare a investire sul vecchio laboratorio Cline come runtime principale.

La direzione corrente è usare e far evolvere il `FAME Direct Worker`.

Non serve cambiare modello immediatamente: Qwen3-Coder 30B ha appena ottenuto 3/3 PASS reali nel runtime controllato.

Il confronto con Devstral, GPT-OSS o altri modelli resta possibile, ma non è necessario prima di verificare che il worker aggiunga valore su un compito FAME Neural reale.

## Prossimo passo

Il README del worker indica come step successivo:

1. smettere di ripetere il task demo `MANIFEST-AUDIT-1`;
2. scegliere un compito FAME Neural reale ma ristretto;
3. definire prima:
   - dati ammessi;
   - output;
   - validatore indipendente;
   - condizioni di PASS/FAIL;
4. implementarlo mantenendo la stessa architettura controllata;
5. solo dopo una verifica utile introdurre:
   - coda sequenziale;
   - più scrivanie/worker;
   - memoria condivisa versionata;
   - strumenti più potenti;
   - eventuale coordinatore multiagente.

## QA worker su report FAME Neural reale

Dopo i 3/3 PASS del task demo, il Direct Worker è stato portato su un primo task reale e ristretto:

`strumenti/fame-local-worker/qa_worker.py`

Caso congelato:

`strumenti/fame-local-worker/cases/tsumugi-controlled-report.md`

Fonte originale:

`documentazione/fame-neural/OWNED_BEATS_AUDIO_TO_MIDI_P5_TSUMUGI_CONTROLLED_FAIL_2026-09-22.md`

Obiettivo del task:

- leggere un report reale già congelato;
- riconoscere finding supportate dal testo;
- collegarle a evidenze verificabili;
- non aprire audio o dataset;
- non eseguire inference, training o modifiche soglie;
- non autorizzare beat reali/P6;
- lasciare l'esecuzione successiva fuori dal modello.

Il QA worker resta quindi un task read-only di interpretazione/triage, non un esecutore della pipeline Audio→MIDI.

## Evoluzione QA worker v1 → v6

### v1 — righe + quote esatte

Prima versione reale del QA worker.

Il modello doveva:

- selezionare categorie;
- copiare quote esatte;
- citare numeri di riga;
- scegliere il nextCheck.

Primo run reale Qwen: **REJECTED**.

Problemi principali:

- quote quasi corrette ma non identiche;
- numeri di riga errati;
- ordine finding;
- evidenze aggiuntive considerate irrilevanti;
- nextCheck talvolta semanticamente plausibile ma diverso dalla rubrica.

Conclusione: troppo lavoro deterministico lasciato al modello.

### v2 — quote e ordine spostati sull'host

Commit rilevante:

`a87e2e2b0d2d5ac67aa865a2f31a222fbd506e68`

Modifiche:

- il modello restituisce solo numeri di riga;
- l'host lega le quote esatte;
- l'ordine viene normalizzato dall'host;
- eliminati i fallimenti puramente meccanici su quote e ordine.

Run reale: **REJECTED**, ma quote/order failures spariscono.

### v3 — evidenceId stabili

Commit:

`93d32ce6428e5abfb6438167b2eee4a40dbf47ac`

Modifiche:

- ogni riga non vuota riceve un `evidenceId` stabile;
- il modello non deve più ricopiare numeri di riga;
- lo schema Ollama ammette solo ID realmente esistenti;
- l'host riconverte gli ID in riga fisica + quote esatta;
- rubrica ampliata per accettare alcune evidenze alternative semanticamente valide.

Test locali eseguiti: **12/12 PASS**.

Run reale v3: **REJECTED**.

Miglioramento osservato:

- tentativo 1: 9 errori;
- tentativo 2: 4 errori;
- un terzo tentativo non ha ulteriormente migliorato i 4 errori residui.

Gli errori residui erano:

- `GATE_FAIL_INSUFFICIENT_EVIDENCE`
- `SNARE_HAT_CONFUSION_NEXT_CHECK`
- `PAIR_CONFIDENCE_UNKNOWN_INSUFFICIENT_EVIDENCE`
- `ZERO_INTERVALS_INSUFFICIENT_EVIDENCE`

### v4 — separazione evidenza finding / nextCheck

Commit:

`91db0c8184a2f6a0524e8931af14d8a0f8a39742`

Problema identificato:

il validatore richiedeva talvolta evidenza della finding **e** una riga che giustificasse il nextCheck, mescolando prova dell'osservazione e scelta dell'azione successiva.

Correzione:

- l'evidenza deve sostenere la finding;
- il nextCheck resta validato separatamente;
- retry feedback più specifico.

Test locali: **13/13 PASS**.

Run reale v4: **REJECTED**.

Nel tentativo 2 Qwen:

- riconosce correttamente gran parte delle finding;
- usa evidenze corrette per quasi tutte;
- sceglie `INSPECT_DECODER_OUTPUTS` per `SNARE_HAT_CONFUSION`;
- perde completamente `TIMBRE_HYPOTHESIS`;
- mantiene `ZERO_INTERVALS` con la riga corretta sugli zero intervalli.

Questo ha mostrato due problemi architetturali residui:

1. il modello non dovrebbe possedere una decisione operativa che l'host può applicare deterministicamente;
2. un retry non dovrebbe poter perdere una finding già validata in un tentativo precedente.

### v5 — nextCheck host-owned + retry cumulativo

Commit di implementazione/test/documentazione finale v5:

`f25e69f956eb3ee7b8ab3dccc8d896475690d62f`

Modifiche:

- `nextCheck` rimosso dall'output del modello;
- l'host applica il nextCheck consentito dalla rubrica solo dopo validazione semantica;
- i retry diventano cumulativi;
- una finding già validata viene conservata;
- l'output finale può essere assemblato da finding validate in tentativi diversi;
- aggiunto `assembledAcrossAttempts`;
- `ZERO_INTERVALS` ristretto al fatto effettivo: il decoder Semi-CRF produce zero intervalli finali.

Test locali eseguiti: **14/14 PASS**.

Run reale v5:

`C:\Users\mycol\FAME_QA_REVIEW_005\runs\20260922T234029342755Z\report.json`

Esito: **REJECTED**.

Tentativo 2:

- `cachedCodes`:
  - `SNARE_HAT_CONFUSION`
  - `TIMBRE_HYPOTHESIS`
  - `D08_OUTSIDE_GATE`
  - `ZERO_INTERVALS`
- `assembledErrors`: solo `INCOMPLETE_FINDINGS`

Quindi il meccanismo cumulativo funziona: le finding valide sopravvivono ai retry.

Le tre finding ancora non accettate erano:

- `GATE_FAIL`
- `MISSING_EVENTS`
- `PAIR_CONFIDENCE_UNKNOWN`

In tutti e tre i casi Qwen aveva già incluso evidenza sufficiente, ma aggiungeva anche un ID extra:

- GATE_FAIL: `E027` = titolo `## Risultati controllati`;
- MISSING_EVENTS: `E036` = D08, fuori dal gruppo D03/D06/D07;
- PAIR_CONFIDENCE_UNKNOWN: `E061` = frase introduttiva “La conclusione verificata viene quindi ristretta a:”.

Il validatore v5 invalidava l'intera finding per la presenza di un solo elemento extra, pur avendo già copertura sufficiente.

### v6 — salvage di evidenza sufficiente

Commit corrente remoto:

`7e125be05667af9fdb5745774c5f09d88e8b1ea5`

Implementazione principale:

`bdcff3f2dbaddd42ef7f91742db0757713170e58`

Test di regressione aggiunti:

`1788cf8ec5be36787efe0e2d3398d9cf79fa284c`

Comportamento v6:

- se la finding ha già evidenza sufficiente, gli `evidenceId` extra vengono scartati deterministicamente dall'host;
- se manca evidenza necessaria, resta `INSUFFICIENT_EVIDENCE`;
- gli ID rimossi sono tracciati in `droppedEvidence`;
- l'output finale materializza solo evidenze ammesse;
- aggiunto un test che riproduce il pattern reale osservato nel retry v5.

Verifica completata dopo la pausa:

- test automatici v6: **16/16 PASS**;
- run reale v6 con `qwen3-coder:30b`: **VALIDATED_FOR_REVIEW al primo tentativo**;
- `errors: []`;
- `candidateErrors: []`;
- `assembledErrors: []`;
- tutte e sette le categorie in `cachedCodes`;
- evidenceId superflui registrati in `droppedEvidence` e rimossi dall'output finale.

Questo chiude con PASS il primo task QA reale end-to-end del Direct Worker.

## Cosa abbiamo imparato

Il lavoro ha separato progressivamente le responsabilità:

### Modello

Responsabile di:

- riconoscimento semantico delle finding;
- scelta delle evidenze pertinenti fra quelle fornite;
- distinzione tra osservazione e ipotesi.

### Host

Responsabile di:

- accesso ai file;
- integrity/checksum;
- schema JSON;
- mapping evidenceId → riga/quote;
- ordine canonico;
- policy del nextCheck;
- lock e retry;
- conservazione delle finding già validate;
- rimozione deterministica di contesto superfluo quando la finding è già sufficientemente provata;
- audit completo degli input/output.

Questo è il pattern che sta emergendo come più solido: **il modello fa il lavoro semantico, l'host fa tutto ciò che può essere deterministico e verificabile.**

## Valutazione corrente di Qwen3-Coder 30B

Fatti verificati:

- task demo Direct Worker: **3/3 PASS first-attempt**;
- QA reale: non ancora PASS end-to-end fino alla v5;
- i retry reali mostrano però che Qwen identifica gran parte delle finding e delle evidenze corrette;
- una parte rilevante dei FAIL osservati è stata causata da contratti/validatori troppo meccanici o da responsabilità che non era utile lasciare al modello.

Non è ancora dimostrato che Qwen3-Coder 30B sia il modello migliore per la rete.

Non è nemmeno dimostrato che vada sostituito adesso.

Prima di confrontare altri modelli conviene chiudere una versione del worker il cui contratto sia equo e stabile, poi fare un confronto controllato sullo stesso task.

## Stato sintetico al 23/09/2026

- Cline proof-zero v2: **FAIL**
- Direct Worker base automatic tests: **PASS**
- Direct Worker base + Qwen reale: **3/3 PASS first-attempt**
- QA worker v1–v5 real run: **REJECTED**
- QA worker v5 automatic tests: **14/14 PASS**
- Retry cumulativo v5: **funzionante**
- QA worker v6 automatic tests: **16/16 PASS**
- QA worker v6 real run Qwen: **VALIDATED_FOR_REVIEW al primo tentativo**
- Modello corrente: `qwen3-coder:30b`
- Runtime corrente: FAME Direct Worker diretto su Ollama
- Cline: non usato nel runtime corrente
- Audio→MIDI: non eseguito o modificato da questo lavoro

## Punto esatto da cui riprendere

Branch:

`feature/fame-neural-roadmap`

Head al momento della pausa prima di questo aggiornamento recap:

`7e125be05667af9fdb5745774c5f09d88e8b1ea5`

Verifica v6 completata localmente:

- suite QA: **16/16 PASS**, 0 FAIL;
- desk: `C:\Users\mycol\FAME_QA_REVIEW_006`;
- run: `runs\20260923T065440213888Z\report.json`;
- stato: **VALIDATED_FOR_REVIEW**;
- `firstAttemptPass: true`;
- una sola chiamata a Qwen, nessun retry.

Il primo tentativo ha prodotto tutte e sette le finding attese. L'host ha inoltre registrato e rimosso evidenceId superflui tramite `droppedEvidence`, senza perdere le evidenze sufficienti. `candidateErrors` e `assembledErrors` sono entrambi vuoti.

L'output finale contiene le sette finding validate con nextCheck host-owned:

- GATE_FAIL;
- SNARE_HAT_CONFUSION;
- MISSING_EVENTS;
- D08_OUTSIDE_GATE;
- TIMBRE_HYPOTHESIS;
- PAIR_CONFIDENCE_UNKNOWN;
- ZERO_INTERVALS.

Le stringhe mojibake osservate con PowerShell (`â€“`, `Ã¨`, ecc.) sono una resa del terminale: lo snapshot UTF-8 nella repository contiene correttamente i caratteri originali.

## Prossimo passo consigliato

Non continuare a ottimizzare questo stesso caso Tsumugi: il rischio ora è overfitting del worker alla rubrica conosciuta.

Il prossimo esperimento utile è un **secondo task reale, differente e congelato**, con nuova rubrica preparata prima del run. Solo dopo questo secondo caso conviene decidere se:

1. considerare stabile il pattern Direct Worker + validatore;
2. confrontare Qwen con Devstral/GPT-OSS sullo stesso protocollo;
3. iniziare la vera orchestrazione multi-agent (coda, più desk, memoria condivisa versionata, coordinatore).

