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

Prima verifica operatore:

```text
Ran 12 tests in 0.727s
OK
```

Dopo aggiunta del primo nuovo package v2 e dei relativi test:

```text
Ran 17 tests
OK
```

Quindi worker v2, queue v2, regressione sull'aggregazione terminale e package
`local-worker-runtime-transition-v2` risultano PASS sul PC locale prima della
prima inizializzazione reale della rete v2.

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

## Prima root reale v2

Root operatore:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_001
```

Task:

```text
local-worker-runtime-transition-v2
```

Status verificato dopo `init`:

```text
desk status = NOT_RUN
modelCalls = 0
queue status = PENDING
executionAuthorized = false
```

## Esito prima inferenza reale v2

Status operator-reported dopo il run e rilettura con `status`:

```text
taskId = local-worker-runtime-transition-v2
status = VALIDATED_FOR_REVIEW
modelCalls = 1
firstAttemptPass = true
acceptedAfterRepair = false
queue status = VALIDATED_FOR_REVIEW
executionAuthorized = false
```

Interpretazione verificabile dal protocollo v2:

- il task ha superato il validatore al primo tentativo;
- non e stata usata la seconda chiamata di repair;
- la root e consumata e non deve essere rilanciata;
- `VALIDATED_FOR_REVIEW` richiede ancora revisione umana;
- nessuna azione operativa e stata autorizzata.

## Revisione umana V2_001 chiusa

La review, la validation e il report incollati dall'operatore sono coerenti tra
loro e con il package congelato.

Esito umano:

```text
5/5 conclusioni corrette
3/3 check positivi con coverage SUFFICIENT
0 precisionWarnings
0 unreviewedEvidenceIds
2/2 check negativi correttamente non supportati
modelCalls = 1
acceptedAfterRepair = false
```

Risultato storico aggiunto:

```text
strumenti/fame-local-worker/DIRECT_QA_RUNTIME_TRANSITION_V2_RESULT_2026-09-24.md
a84b7a5e332dc7b7b869e4fe1c26beff728d6816
```

La root `FAME_DIRECT_QA_NETWORK_V2_001` e definitivamente consumata.

## Checkpoint multi-desk v2 preparato

Per passare dal singolo worker a una prova reale della queue con piu scrivanie,
sono stati congelati due task nuovi e indipendenti sul sistema FAME Local Worker
stesso.

Task 1:

```text
coordinator-architecture-v2
source: strumenti/fame-local-worker/COORDINATOR.md
```

Verifica confini della rete, natura logica/sequenziale delle scrivanie,
assenza di PASS per maggioranza, gate globale e controlli negativi contro
parallelizzazione fittizia/autonomia di modifica.

Task 2:

```text
package-authoring-v2
source: strumenti/fame-local-worker/DIRECT_QA_PACKAGE_AUTHORING.md
```

Verifica semantic-unit rule, frozen-run rule, freeze pre-call, regola evidence
per check negativi e requisiti dei test package-specific.

File/commit preparati:

```text
ed1e27fa6468fdb0debe81ef8e79541b39293808
test(fame-local-worker): freeze coordinator architecture source

acde01596eedc53da68cde1b966be2cba07ee242
test(fame-local-worker): freeze package authoring source

53ae1e5131d2f965ea1717df073658ddd0bee66e
feat(fame-local-worker): add coordinator architecture v2 task

102ea3d3c8993a9c03e3272994f9e4920b652699
feat(fame-local-worker): add package authoring v2 task

65188065d464371269ee62d33a03e81a12418bf0
test(fame-local-worker): validate two-desk v2 checkpoint
```

Il nuovo test verifica anche che una queue con entrambi i task si inizializzi
come due desk `NOT_RUN`, zero model calls e stato globale `PENDING`.

## Verifica locale checkpoint multi-desk

Esecuzione operatore:

```text
Ran 25 tests in 0.968s
OK
```

Quindi la suite v2 completa, inclusi i test dei due nuovi package e della queue
multi-desk, risulta PASS sul PC locale.

## Root multi-desk v2 inizializzata

Root:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_002
```

Desk:

```text
coordinator-architecture-v2
package-authoring-v2
```

Status verificato dopo `init`:

```text
coordinator-architecture-v2 = NOT_RUN, modelCalls=0
package-authoring-v2      = NOT_RUN, modelCalls=0
queue status              = PENDING
executionAuthorized       = false
```

L'inizializzazione non ha effettuato chiamate al modello.

## Esito prima queue multi-desk reale v2

Root:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_002
```

Esito operator-reported:

```text
coordinator-architecture-v2
  status = REJECTED
  modelCalls = 2
  firstAttemptPass = false
  acceptedAfterRepair = false

package-authoring-v2
  status = VALIDATED_FOR_REVIEW
  modelCalls = 1
  firstAttemptPass = true
  acceptedAfterRepair = false

queue status = NEEDS_REVIEW
executionAuthorized = false
```

La prima desk ha usato entrambe le chiamate consentite dal protocollo v2 ed e
rimasta REJECTED. La seconda desk e passata al primo tentativo.

Questo e il primo run reale che esercita il repair v2. Il risultato del
coordinatore non deve essere ritentato o corretto retroattivamente cambiando
rubric/package. Prima di qualsiasi decisione architetturale vanno ispezionati
gli artefatti di attempt-1 e attempt-2 per distinguere:

- conclusione errata;
- coverage insufficiente;
- evidence superflua/non revisionata;
- errore di contratto/risposta;
- eventuale variazione prodotta dal feedback generico.

## Prossimo intervento

Leggere, senza nuove chiamate al modello, gli artefatti della desk fallita:

```powershell
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\coordinator-architecture-v2\attempt-1\candidate.json"
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\coordinator-architecture-v2\attempt-1\validation.json"
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\coordinator-architecture-v2\attempt-2\candidate.json"
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\coordinator-architecture-v2\attempt-2\repair-feedback.json"
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\coordinator-architecture-v2\attempt-2\validation.json"
```

Per chiudere anche la desk passata:

```powershell
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\package-authoring-v2\attempt-1\review.md"
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_V2_002\desks\package-authoring-v2\attempt-1\validation.json"
```

Non rilanciare `run` sulla root `FAME_DIRECT_QA_NETWORK_V2_002`.

## Vincolo di continuita

Se una futura sessione deve riprendere questa rete, leggere prima questo file e
il commit/branch indicati sopra. In caso di conflitto con descrizioni di altri
filoni, questa branch e la fonte di verita per il lavoro FAME Local Worker v2.
