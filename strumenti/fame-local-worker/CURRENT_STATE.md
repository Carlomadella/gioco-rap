# FAME Local Worker — CURRENT STATE

Data di ripartenza: 2026-09-23.

## Fonte di verita di questa linea

Questa linea riparte da:

```text
cdea2227a4a71906c48b97d888e707a787cecc3e
feat(fame-local-worker): add validator-guided direct QA recovery
```

Branch di recovery:

```text
recovery/fame-local-worker-v2-cdea2227
```

Questa linea riguarda esclusivamente la rete locale di agenti / Direct QA in
`strumenti/fame-local-worker`.

Non usare questo stato per proseguire automaticamente sviluppo audio-to-MIDI,
P6, training, batch 131 o altri filoni FAME Neural. Quei filoni possono esistere
in parallelo ma non sono il lavoro corrente di questa branch.

## Stato architetturale verificato

### Coordinatore storico v1

`qa_coordinator.py` implementa il primo prototipo coordinato con scrivanie
logiche specializzate. Resta storico: non e il runner da estendere per il nuovo
percorso Direct QA v2.

### Direct QA worker v1

`direct_qa_worker.py` e `direct_qa_queue.py` sono congelati per preservare i
risultati storici e la riproducibilita delle root gia consumate.

Task v1 presenti nel catalogo:

- `pfnmf-review-v1`
- `subset-bic-review-v1`
- `tsumugi-controlled-review-v1`

Esiti documentati nella repository al commit di ripartenza:

1. `FAME_DIRECT_QA_NETWORK_001 / pfnmf-review-v1`: `VALIDATED_FOR_REVIEW`,
   una chiamata; task consumato.
2. `FAME_DIRECT_QA_NETWORK_002 / subset-bic-review-v1`: `REJECTED` per
   precision false negative di packaging/evidence unit; task consumato.
3. `FAME_DIRECT_QA_NETWORK_003 / tsumugi-controlled-review-v1`: `REJECTED`,
   con errore semantico reale e coverage evidence insufficiente; task consumato.

Queste tre root non devono essere rieseguite o ricreate per ottenere un esito
diverso.

### Direct QA worker v2 — percorso corrente

Il commit `cdea2227` introduce:

- `direct_qa_worker_v2.py`
- `direct_qa_queue_v2.py`
- `test_direct_qa_worker_v2.py`
- `test_direct_qa_queue_v2.py`

Contratto v2:

- attempt-1 resta la misura autonoma del primo tentativo;
- se il validatore rifiuta per contenuto/coverage, e ammessa al massimo una
  seconda chiamata nello stesso run;
- il feedback di repair contiene solo categorie generiche;
- nessun check ID, target booleano, rubrica o expected evidence viene inviato
  come feedback-oracle;
- errori di preflight o trasporto non attivano repair semantico;
- una desk consumata non torna rieseguibile.

Stati principali:

- `VALIDATED_FOR_REVIEW`
- `VALIDATED_FOR_REVIEW_AFTER_REPAIR`
- `REJECTED`
- `ERROR`
- `ERROR_AFTER_REPAIR`

La v2 non va usata per riprocessare i tre task v1 consumati.

## Hardening della queue v2

Durante la rilettura della v2 e stato trovato un difetto nell'aggregazione della
coda: con una desk in `ERROR` e task successivi ancora `NOT_RUN`,
`direct_qa_queue_v2.state()` classificava l'intera coda come `PENDING`.

Correzione:

```text
a1c44f26e450dd1e7eb5f0a4344ca112faac2690
fix(fame-local-worker): preserve terminal queue failures
```

Regressione:

```text
82f4a3357b7d53d8a86c2c24416548746f43b7a9
test(fame-local-worker): cover terminal error aggregation
```

Comportamento verificato dal test:

```text
results = [ERROR, NOT_RUN]
queue status = NEEDS_REVIEW
model calls = 1
```

## Verifica locale v2

Esecuzione operatore del 23/09/2026, dalla directory
`strumenti/fame-local-worker`:

```text
Ran 12 tests in 0.727s
OK
```

Quindi worker v2 + queue v2 + regressione sull'aggregazione terminale risultano
PASS sul PC locale prima della preparazione del primo nuovo task v2.

## Primo nuovo task v2 congelato

Task:

```text
local-worker-runtime-transition-v2
```

Fonte:

```text
strumenti/fame-local-worker/FAME_LOCAL_WORKER_CLINE_EXIT_2026-09-23.md
source commit: cdea2227a4a71906c48b97d888e707a787cecc3e
```

File aggiunti:

- `cases/direct-qa/local-worker-runtime-transition-source.md`
- `cases/direct-qa/local-worker-runtime-transition-v2.json`
- `test_direct_qa_runtime_transition_v2.py`

Commit di preparazione:

```text
d09cd137aecffba92b4d2a5ab0fff921023d5f60
test(fame-local-worker): freeze runtime transition source

8659056a06731a9edc1e725203954198107a7878
feat(fame-local-worker): add first v2 runtime transition task

680b3c631efcd87954ae47976c3dfd963745f435
test(fame-local-worker): validate runtime transition v2 package
```

Il task misura cinque affermazioni:

1. due failure classi distinte osservate nel percorso Cline e limite del
   packaging a file unico;
2. contratto del runtime diretto senza tool, con snapshot host-side, schema JSON
   e validatore host;
3. esito operator-reported del run diretto
   `FAME_DIRECT_TSUMUGI_CONTRACT_001`;
4. controllo negativo: il PASS diretto non dimostra causalita esclusiva di
   Cline;
5. controllo negativo: la decisione non autorizza autonomia di produzione senza
   validazione host.

La fonte e nuova rispetto ai tre task Direct QA consumati. Non viene
riprocessato PF-NMF, subset+BIC o Tsumugi controlled.

## Regole di authoring gia acquisite

Le evidence unit devono essere blocchi semanticamente completi. Un heading
Markdown che serve solo a introdurre il blocco successivo deve essere unito a
quel contenuto.

Prima di congelare un nuovo pacchetto:

1. lo snapshot deve corrispondere esattamente alla fonte scelta;
2. le unit devono ricostruire integralmente la fonte;
3. heading non autonomi devono essere uniti al blocco seguente;
4. i check positivi devono avere coverage group espliciti;
5. eventuale benign context deve essere dichiarato prima del run;
6. check negativi senza evidence ID;
7. test positivi e negativi specifici del pacchetto;
8. package e rubric congelati prima della prima chiamata reale.

## Prossimo intervento

Prima inferenza reale v2 solo dopo PASS locale del nuovo test package-specific.

Dalla directory `strumenti/fame-local-worker`:

```powershell
git pull --ff-only origin recovery/fame-local-worker-v2-cdea2227
python -m unittest discover -s . -p "test_direct_qa_*v2.py" -q
```

Se la suite passa, inizializzare una root nuova:

```powershell
python direct_qa_queue_v2.py init --root "$HOME\FAME_DIRECT_QA_NETWORK_V2_001" --tasks local-worker-runtime-transition-v2
```

L'init non chiama il modello. Il run reale viene eseguito solo dopo aver
verificato che init/status siano corretti.

## Vincolo di continuita

Se una futura sessione deve riprendere questa rete, leggere prima questo file e
il commit/branch indicati sopra. In caso di conflitto con descrizioni di altri
filoni, questa branch e la fonte di verita per il lavoro FAME Local Worker v2.
