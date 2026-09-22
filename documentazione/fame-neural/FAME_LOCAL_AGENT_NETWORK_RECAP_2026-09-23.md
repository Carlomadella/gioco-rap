# FAME Neural — Recap rete agenti locali

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

## Stato sintetico

- Cline proof-zero v2: **FAIL**
- Direct Worker test automatici: **PASS**
- Direct Worker Qwen 30B real run: **3/3 PASS first-attempt**
- Modello da mantenere per ora: **qwen3-coder:30b**
- Runtime da sviluppare: **FAME Direct Worker**
- Prossimo obiettivo: **primo task reale ristretto di FAME Neural**
