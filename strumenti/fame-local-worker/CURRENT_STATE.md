# Checkpoint corrente — confronto reale simmetrico batch vs staged

24 settembre 2026.

## Risultato Claim Network 001

Run reale operator-reported:

```text
$HOME\FAME_CLAIM_NETWORK_001
status = COMPLETE_FOR_REVIEW
calls = 13
baselineAccepted = 6/6
stagedAccepted = 6/6
stagedAllPass = true
comparison = NO_GAIN
executionAuthorized = false
independentEvaluation = false
```

La suite sintetica conferma che GPT-OSS 20B gestisce correttamente, su questi
sei casi development, SUPPORTED/CONTRADICTED/UNKNOWN, condizioni e negazioni.

La scomposizione selector + judge non migliora il risultato: 6/6 in entrambe le
modalita con molte piu chiamate staged.

Risultato salvato:

```text
strumenti/fame-local-worker/CLAIM_NETWORK_RESULT_2026-09-24.md
b2961f81ef376008823d5163d865293e1abc8388
```

Il confronto sintetico precedente non era semanticamente simmetrico: baseline
booleana, judge ternario. Non usarlo per attribuire causalmente `NO_GAIN` alla
sola decomposizione.

## Nuovo confronto reale simmetrico preparato

Fonte reale della repository:

```text
strumenti/fame-local-worker/CLINE_GPTOSS_P2_PROBE.md
source commit = cdea2227a4a71906c48b97d888e707a787cecc3e
source SHA256 = 258cc46e482b65c3e7fececaa1d050d1d502b853ac051ed4e5920913417c287e
```

La fonte e stata verificata byte-identica fra il commit di recovery e il branch
corrente prima del freeze.

Snapshot:

```text
strumenti/fame-local-worker/real-claim-comparison-source.md
b39b90296d97e12ac471903664bb9d119a3b6080
```

Suite:

```text
strumenti/fame-local-worker/real_claim_comparison_cases.json
6024c09a2e15cfd19d768c9088c7d9ba17dff197
```

La fonte viene ricostruita integralmente da 29 unita. Sei claim congelate:

```text
2 SUPPORTED
2 CONTRADICTED
2 UNKNOWN
```

Runner:

```text
strumenti/fame-local-worker/real_claim_comparison.py
b6e0120e97038e6556c346e2bd7449fe42078ce1
```

Baseline e staged condividono realmente:

- stessa semantica ternaria;
- stesso system prompt di giudizio;
- stessa rubrica host;
- stesso scoring;
- stessa fonte completa;
- stessa evidence policy.

Differenza intenzionale:

```text
baseline = 1 chiamata batch per 6 claim
staged   = 6 selector + 6 judge
```

Il judge staged riceve sempre tutte le 29 unita del documento; il suggerimento
del selector e esplicitamente non autoritativo.

Test:

```text
strumenti/fame-local-worker/test_real_claim_comparison.py
a12b795585543a931729d6000c9662e5515eff3a
```

Documentazione:

```text
strumenti/fame-local-worker/REAL_CLAIM_COMPARISON.md
59eec21f5eb6d0ff5dbaea00aabbd06821af041c
```

## Prossimo intervento

Prima del run reale:

```powershell
git pull --ff-only origin recovery/fame-local-worker-v2-cdea2227
python -m unittest test_real_claim_comparison -q
```

Sono attesi **12 test**.

Solo dopo PASS:

```powershell
python real_claim_comparison.py --root "$HOME\FAME_REAL_CLAIM_COMPARISON_001"
```

Il run usa al massimo 13 chiamate, nessun retry. La root deve essere nuova e non
va rilanciata.

Il risultato serve a confrontare batch vs decomposizione sullo stesso compito
reale con semantica/rubrica simmetriche. Non e una independent evaluation e non
autorizza training, audio, produzione o autonomia operativa.

---

## Storico precedente conservato

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

## Diagnosi V2_002 completata

`coordinator-architecture-v2` resta storicamente `REJECTED`, ma il failure non
e semantico.

Attempt-1:

```text
5/5 conclusioni corrette
coverage positiva = tutta SUFFICIENT
errori = 2 x UNREVIEWED_EVIDENCE su U01
```

Attempt-2 dopo feedback generico:

```text
5/5 conclusioni corrette
coverage positiva = tutta SUFFICIENT
errori = 1 x UNREVIEWED_EVIDENCE su U01
```

Il repair ha quindi corretto uno dei due errori di precisione senza ricevere
check ID, target o expected evidence.

Classificazione:

```text
PRECISION_REJECT_WITH_PARTIAL_REPAIR
```

Non si modifica retroattivamente il package consumato.

`package-authoring-v2` e invece confermato dalla review umana come
`VALIDATED_FOR_REVIEW` al primo tentativo:

```text
5/5 conclusioni corrette
coverage positiva = tutta SUFFICIENT
unreviewedEvidenceIds = []
precisionWarnings = [U03] solo su SEMANTIC_UNIT_RULE
```

U03 era gia dichiarata `benignContext`, quindi il warning non blocca il PASS.

Risultato storico aggiunto:

```text
strumenti/fame-local-worker/DIRECT_QA_MULTIDESK_V2_RESULT_2026-09-24.md
d96cb7134ac47e644f810712dd7bbbcc089302f6
```

## Hardening authoring per task futuri

Aggiornato `DIRECT_QA_PACKAGE_AUTHORING.md` con una regola esplicita:

- required evidence = copertura minima necessaria;
- benign context = evidence pertinente ma non necessaria;
- evidence estranea = resta bloccante come `UNREVIEWED_EVIDENCE`.

La classificazione va congelata prima della prima model call del nuovo task e
non puo essere usata per convertire retroattivamente un reject storico in PASS.

Commit:

```text
cf271ec65cf9c3b695cd66e8bd128635c9f71948
docs(fame-local-worker): harden benign-context authoring
```

Aggiunte anche regressioni che fissano il confine tra:

- benign context dichiarato -> `precisionWarning`, non reject;
- extra evidence non dichiarata -> `UNREVIEWED_EVIDENCE`, reject.

Commit:

```text
b6cc5929c36e395187ed06ffacc96260af47f0c6
test(fame-local-worker): cover benign versus unreviewed evidence
```

## Verifica locale dopo hardening precisione

Esecuzione operatore:

```text
Ran 27 tests
OK
```

Quindi le regressioni introdotte dopo `FAME_DIRECT_QA_NETWORK_V2_002` risultano
PASS sul PC locale:

- benign context dichiarato -> warning non bloccante;
- extra evidence non dichiarata -> `UNREVIEWED_EVIDENCE` bloccante.

## Checkpoint V2_003 preparato

Sono stati scelti due nuovi task ID su documenti della rete gia presenti e
byte-identici al commit di ripartenza `cdea2227`.

Task 1:

```text
recovery-protocol-v2
source: strumenti/fame-local-worker/RECOVERY.md
source commit: cdea2227a4a71906c48b97d888e707a787cecc3e
```

Verifica:

- immutabilita del first pass dopo recovery;
- assenza di oracle e retry automatici;
- separazione tra recovery sul caso noto e prova di transfer/generalizzazione;
- controlli negativi su training e significato degli hash locali.

Task 2:

```text
rubric-audit-protocol-v2
source: strumenti/fame-local-worker/RUBRIC_AUDIT.md
source commit: cdea2227a4a71906c48b97d888e707a787cecc3e
```

Verifica:

- `SEMANTIC_FAIL` non equivale automaticamente a mancata comprensione;
- distinzione DIRECT / CONTEXTUAL;
- sidecar separato che preserva esiti e validator storici;
- controlli negativi contro universalizzazione del supporto contestuale e
  promozione operativa della rete.

Le fonti sono state verificate identiche tra branch di recovery e `cdea2227`
prima del freeze.

Commit preparati:

```text
d9bac2935279f7a1ebbd3196d6966832974dd518
test(fame-local-worker): freeze recovery protocol source

00ebe3583578ff03eb54e9f7666e9de6c37107c0
test(fame-local-worker): freeze rubric audit source

b796874f019a22b78e45c5ff08065f2e0ec99643
feat(fame-local-worker): add recovery protocol v2 task

d9cd87fc48a3bd276bc832ce86e5fead5b90747c
feat(fame-local-worker): add rubric audit protocol v2 task

5c217d7109543308f380c358fa35d2fe7120ee94
test(fame-local-worker): validate recovery audit v2 checkpoint
```

I package usano sei blocchi semantici completi ciascuno. I test specifici
coprono:

- ricostruzione integrale fonte;
- expected answer;
- coverage composto incompleto;
- falsi positivi di autorizzazione/generalizzazione;
- benign context;
- unreviewed evidence;
- assenza della rubrica nel payload;
- init queue a due desk senza model call.

## Root V2_003 inizializzata

Root operatore:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_003
```

Desk:

```text
recovery-protocol-v2
rubric-audit-protocol-v2
```

Status verificato dopo `init`:

```text
recovery-protocol-v2     = NOT_RUN, modelCalls=0
rubric-audit-protocol-v2 = NOT_RUN, modelCalls=0
queue status             = PENDING
executionAuthorized      = false
```

L'inizializzazione non ha effettuato chiamate al modello.

Verifica locale operatore prima dell'init/run:

```text
Ran 38 tests
OK
```

Quindi l'intera suite v2, inclusi i package e test del checkpoint V2_003, risulta
PASS sul PC locale.

## Esito V2_003

Root:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_003
```

Esito operator-reported:

```text
recovery-protocol-v2
  status = VALIDATED_FOR_REVIEW
  modelCalls = 1
  firstAttemptPass = true
  acceptedAfterRepair = false

rubric-audit-protocol-v2
  status = REJECTED
  modelCalls = 2
  firstAttemptPass = false
  acceptedAfterRepair = false

queue status = NEEDS_REVIEW
executionAuthorized = false
```

La desk recovery e passata al primo tentativo. La desk rubric-audit ha usato la
seconda chiamata controllata ed e rimasta rejected.

La root e consumata e non va rilanciata.

## Diagnosi V2_003 completata

### recovery-protocol-v2

Review umana confermata:

```text
5/5 conclusioni corrette
coverage positiva = tutta SUFFICIENT
unreviewedEvidenceIds = []
precisionWarnings = [U01] solo su FIRST_PASS_IMMUTABLE
modelCalls = 1
firstAttemptPass = true
```

La desk resta quindi un first-pass reale valido.

### rubric-audit-protocol-v2

Attempt-1:

```text
4/5 conclusioni corrette
DIRECT_CONTEXTUAL_STRENGTH = conclusione corretta, coverage rifiutata
AUDIT_PROMOTES_OPERATIONAL_NETWORK = conclusione errata
```

Feedback repair:

```text
SOME_CONCLUSION_INCORRECT
SOME_EVIDENCE_COVERAGE_INSUFFICIENT
oracleTargetsSent = false
checkIdsSentInFeedback = false
```

Attempt-2:

```text
5/5 conclusioni corrette
unico errore host = DIRECT_CONTEXTUAL_STRENGTH:INSUFFICIENT_EVIDENCE
```

Il repair ha quindi corretto il vero errore semantico.

### Difetto della rubrica congelata

La finding `DIRECT_CONTEXTUAL_STRENGTH` richiedeva:

```text
U01 + U03
```

ma U01 contiene gia integralmente:

- E152 + E153 + E154 come supporto contestuale;
- E155 come prova diretta;
- la distinzione esplicita della forza della prova.

U03 ripete la distinzione nel sidecar ma non copre una clausola necessaria che
manca da U01.

Quindi il requisito U03 era ridondante e ha prodotto un false reject di
coverage.

Lo stato storico resta `REJECTED`: il package consumato non viene modificato o
rilanciato.

Classificazione diagnostica:

```text
ATTEMPT_1:
  genuine semantic error + package coverage false negative

ATTEMPT_2:
  semantic recovery successful
  5/5 conclusions correct
  final reject caused only by rubric authoring defect
```

Risultato storico aggiunto:

```text
strumenti/fame-local-worker/DIRECT_QA_RECOVERY_AUDIT_V2_RESULT_2026-09-24.md
b648e0e78e8914c22a8584f88be82d5c33f5c76d
```

Regola di authoring aggiunta:

```text
a19dc2bacec9e9ac8db253d5eb343b56a563f114
docs(fame-local-worker): forbid redundant required coverage groups
```

Ogni required group futuro deve coprire una clausola semanticamente necessaria e
distinta della finding. Restatement o rinforzi ridondanti non devono diventare
gruppi obbligatori separati.

Regressione aggiunta:

```text
a6b176f42d7c42754085a7e7332a47d4c6dc7675
test(fame-local-worker): preserve v2 003 rubric defect regression
```

Il test conserva entrambe le proprieta:

- il package storico congelato continua a rifiutare U01-only;
- U01 viene verificata esplicitamente come blocco che contiene gia tutti gli
  elementi DIRECT/CONTEXTUAL della finding.

## Verifica locale dopo V2_003

Esecuzione operatore:

```text
Ran 39 tests
OK
```

Quindi le regressioni introdotte dopo la diagnosi V2_003 risultano PASS sul PC
locale.

## Checkpoint V2_004 preparato

Sono stati scelti due nuovi task ID su documenti byte-identici al commit
`cdea2227`.

Task 1:

```text
transfer-protocol-v2
source: strumenti/fame-local-worker/QA_TRANSFER.md
```

Verifica:

- componenti congelate vs componenti nuove del transfer;
- metrica primaria piu stretta del solo VALIDATED_FOR_REVIEW;
- revisione umana ancora necessaria;
- controlli negativi contro blind-test non certificato, retro-PASS dopo difetto
  rubric e certificazione prematura di rete multiagente.

Task 2:

```text
review-boundary-v2
source: strumenti/fame-local-worker/QA_REVIEW.md
```

Verifica:

- policy operativa host-owned;
- VALIDATED_FOR_REVIEW distinto da autorizzazione all'esecuzione;
- retry assistito distinto da successo spontaneo;
- regola v6 di salvage solo con coverage gia completa;
- controlli negativi contro shell/repo access autonomo, salvage con coverage
  mancante e dichiarazione di network readiness da un singolo report.

Le rubriche V2_004 applicano gia la regola anti-duplicazione dei required group:
ogni finding positiva ha una sola unit necessaria quando quella unit copre
integralmente l'asserzione; i rinforzi ragionevoli sono solo benign context.

Commit preparati:

```text
2f1c92e7fc103dbb18b7a9ffd4ca933385e43f33
test(fame-local-worker): freeze transfer protocol source

7ebdc023e068455a7cc29eb75c707b55449aea52
test(fame-local-worker): freeze review boundary source

09fb7a3a369001f03af6fb9baa49464ead27e91b
feat(fame-local-worker): add transfer protocol v2 task

3a226fc2ab38e4d9c96056734693df66c724fa20
feat(fame-local-worker): add review boundary v2 task

69e870ec49b4a66f94be57f11b67b3cf851be0f5
test(fame-local-worker): validate transfer review v2 checkpoint
```

I nuovi test specifici sono 13 e coprono:

- ricostruzione package/fonti;
- expected answers;
- coverage necessaria;
- falsi positivi di blind test/autorizzazione/generalizzazione;
- confine salvage v6;
- benign context;
- unreviewed evidence;
- payload senza rubrica;
- init queue a due desk senza model call.

## Verifica locale e init V2_004

Esecuzione operatore:

```text
Ran 52 tests in 0.927s
OK
```

Quindi l'intera suite v2, inclusi i package e i test del checkpoint V2_004,
risulta PASS sul PC locale.

Root:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_004
```

Desk:

```text
transfer-protocol-v2
review-boundary-v2
```

Status verificato dopo `init`:

```text
transfer-protocol-v2 = NOT_RUN, modelCalls=0
review-boundary-v2   = NOT_RUN, modelCalls=0
queue status         = PENDING
executionAuthorized  = false
```

L'inizializzazione non ha effettuato chiamate al modello.

## Esito V2_004

Root:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V2_004
```

Esito operator-reported:

```text
transfer-protocol-v2
  status = VALIDATED_FOR_REVIEW
  modelCalls = 1
  firstAttemptPass = true
  acceptedAfterRepair = false

review-boundary-v2
  status = REJECTED
  modelCalls = 2
  firstAttemptPass = false
  acceptedAfterRepair = false

queue status = NEEDS_REVIEW
executionAuthorized = false
```

La desk transfer e passata al primo tentativo. La desk review-boundary ha usato
la seconda chiamata controllata ed e rimasta rejected.

La root e consumata e non va rilanciata.

## Diagnosi V2_004 completata

`transfer-protocol-v2` resta `VALIDATED_FOR_REVIEW` al primo tentativo.

`review-boundary-v2` resta storicamente `REJECTED` dopo due chiamate.

Attempt-1 e attempt-2 hanno mantenuto lo stesso unico errore semantico:

```text
V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING = true
```

La fonte congelata dice invece che il salvage v6 dell'evidence extra avviene
solo quando la coverage richiesta e gia completa. Se manca coverage, l'evidence
irrilevante resta un errore insieme a `INSUFFICIENT_EVIDENCE`.

Gli altri sei check erano corretti; le finding positive avevano coverage
sufficiente; non risultano unreviewed evidence. U07 su
`HOST_OWNS_ACTION_POLICY` e un benign precision warning.

Feedback attempt-2:

```text
SOME_CONCLUSION_INCORRECT
oracleTargetsSent = false
checkIdsSentInFeedback = false
```

Il repair v2 non ha modificato il booleano errato.

Classificazione:

```text
GENUINE_SEMANTIC_REJECT_REPAIR_UNCHANGED
```

Non e un difetto di package/rubrica e V2_004 non va rilanciata.

Risultato storico:

```text
strumenti/fame-local-worker/DIRECT_QA_TRANSFER_REVIEW_V2_RESULT_2026-09-24.md
adefde7e6863e443c033482eeea4af0ac09b8447
```

## Worker v3 preparato

V2 resta congelato. E stato creato un nuovo protocollo v3 che modifica solo il
repair semantico:

```text
fae52ac9647a201264755cd9ebccb773f35b94de
feat(fame-local-worker): add fresh reconstruction QA worker v3

6d4375e6292853760f73fbf19b0e3932b35b3560
feat(fame-local-worker): add direct QA queue v3
```

Differenza centrale:

- attempt-1 resta la misura autonoma;
- massimo due model call;
- nessun tool/rubrica/check ID/target/expected evidence;
- attempt-2 riceve snapshot originale + sole classi generiche del validator;
- il candidate precedente **non viene replayato**;
- il modello deve ricostruire da zero tutte le conclusioni e ricontrollare
  negazioni, condizioni, quantificatori e inferenze.

Artefatto `repair-feedback.json` registra:

```text
previousCandidateReplayed = false
freshReconstruction = true
```

## Diagnostica v3 preparata

Nuovo task ID:

```text
review-boundary-repair-v3
```

Usa lo stesso documento noto e la stessa semantica/rubrica del caso V2_004 con
un nuovo task ID, esclusivamente per osservare il nuovo repair. Non e una nuova
evaluation indipendente e non prova generalizzazione.

Commit:

```text
f6cb45db6300b02e2e325248440e5c2fdd332a90
test(fame-local-worker): freeze v3 repair diagnostic source

b66e99b81615c11427a14191927d3985aea778b4
feat(fame-local-worker): add v3 repair diagnostic task
```

Test v3 aggiunti:

```text
34c4326e0ecacd4872d448e6928d277226eee54b
test(fame-local-worker): cover fresh reconstruction worker v3

6abad093687e787e26b48aeeec28f233fb1caa34
test(fame-local-worker): cover direct QA queue v3

7c0184f5b4990c68aa38cf027bbcfca0ee26eb0d
test(fame-local-worker): validate v3 repair diagnostic package
```

Coprono:

- first-pass immutato;
- repair accepted/rejected;
- nessun replay del candidate precedente;
- assenza di messaggi assistant in attempt-2;
- feedback generico senza oracle/check ID/rubrica;
- fresh reasoning su negazioni/condizioni/quantificatori;
- preflight/transport senza repair;
- non-rerunnability;
- status riproducibile;
- queue error precedence;
- package diagnostico e known semantic error.

Documentazione v3:

```text
3c7f7fb75386cbd899c8adcec607a4151a48a505
docs(fame-local-worker): document fresh reconstruction worker v3
```

## Verifica locale e init V3_001

Esecuzione operatore:

```text
Ran 70 tests in 1.821s
OK
```

Quindi suite v2 + v3 interamente PASS sul PC locale.

Root diagnostica:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V3_001
```

Desk:

```text
review-boundary-repair-v3
```

Status verificato dopo `init`:

```text
review-boundary-repair-v3 = NOT_RUN
modelCalls                = 0
firstAttemptPass          = null
acceptedAfterRepair       = false
queue status              = PENDING
executionAuthorized       = false
```

L'inizializzazione non ha effettuato chiamate al modello.

Questa root e una diagnostica controllata sul caso noto V2_004. Non e una nuova
evaluation indipendente e non misura generalizzazione.

## Esito e diagnosi V3_001

Root:

```text
$HOME\FAME_DIRECT_QA_NETWORK_V3_001
```

Esito operator-reported:

```text
review-boundary-repair-v3
status = REJECTED
modelCalls = 2
firstAttemptPass = false
acceptedAfterRepair = false
queue status = NEEDS_REVIEW
executionAuthorized = false
```

### Attempt 1

Unico errore:

```text
V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING:INCORRECT_CONCLUSION
```

Gli altri sei check erano corretti.

Attempt-1 riproduce quindi esattamente il genuine semantic error osservato in
V2_004.

### Attempt 2 fresh reconstruction

Il candidate mantiene:

```text
V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING = true
```

e modifica `HOST_OWNS_ACTION_POLICY` usando solo U07.

Validation:

```text
HOST_OWNS_ACTION_POLICY:INSUFFICIENT_EVIDENCE
V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING:INCORRECT_CONCLUSION
```

Quindi il repair v3:

- non corregge il genuine semantic error;
- introduce inoltre una regressione di coverage.

U03 era required evidence per `HOST_OWNS_ACTION_POLICY`; U07 era solo benign
context, quindi U07 da sola non e sufficiente.

Classificazione:

```text
FRESH_RECONSTRUCTION_REPAIR_FAILED_AND_REGRESSED
```

Confronto sullo stesso caso noto:

```text
V2_004 attempt-2:
  1 semantic error
  other positive coverage sufficient

V3_001 attempt-2:
  same semantic error
  + 1 new coverage error
```

Conclusione limitata al caso testato: eliminare il replay del candidate
precedente non migliora il repair e produce un risultato peggiore. Questo non
prova una causa generale del comportamento del modello.

Risultato storico:

```text
strumenti/fame-local-worker/DIRECT_QA_V3_001_RESULT_2026-09-24.md
09181128fa40c7ff737443df4d909f57524e3ad9
```

## Prossimo intervento

Non aprire automaticamente v4 con un altro prompt di repair.

Isolare invece il failure del singolo worker su un task diagnostico minimo che
separi quattro passaggi:

1. comprensione letterale della regola sorgente;
2. gestione della condizione/negazione;
3. mapping della finding a `supported=true/false`;
4. selezione dell'evidence.

Il prossimo test deve dirci **quale trasformazione fallisce**, non semplicemente
se un altro retry riesce a ottenere PASS.

## Vincolo di continuita

Se una futura sessione deve riprendere questa rete, leggere prima questo file e
il commit/branch indicati sopra. In caso di conflitto con descrizioni di altri
filoni, questa branch e la fonte di verita per il lavoro FAME Local Worker.
