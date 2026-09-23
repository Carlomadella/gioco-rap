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

A questo checkpoint non e documentato alcun nuovo run reale v2. La v2 non va
usata per riprocessare i tre task v1 consumati.

## Hardening eseguito sulla branch di recovery

Durante la rilettura della v2 e stato trovato un difetto nell'aggregazione della
coda: con una desk in `ERROR` e task successivi ancora `NOT_RUN`,
`direct_qa_queue_v2.state()` classificava l'intera coda come `PENDING`.
Questo poteva mascherare un errore operativo gia avvenuto.

Correzione applicata:

```text
a1c44f26e450dd1e7eb5f0a4344ca112faac2690
fix(fame-local-worker): preserve terminal queue failures
```

La precedenza ora e:

1. tutte first-pass accettate -> `VALIDATED_FOR_REVIEW`;
2. tutte accettate, con almeno un repair -> `VALIDATED_FOR_REVIEW_AFTER_REPAIR`;
3. qualsiasi stato terminale/non accettato gia presente -> `NEEDS_REVIEW`;
4. solo accepted + `NOT_RUN` -> `PENDING`.

Regressione aggiunta:

```text
82f4a3357b7d53d8a86c2c24416548746f43b7a9
test(fame-local-worker): cover terminal error aggregation
```

Il test costruisce una coda con due task, forza un timeout sulla prima desk e
verifica:

```text
results = [ERROR, NOT_RUN]
queue status = NEEDS_REVIEW
model calls = 1
```

La branch remota contiene la patch e il test. La suite non e stata rieseguita in
questo ambiente perche il container non riesce a risolvere `github.com`; la
verifica locale resta obbligatoria prima del nuovo run reale v2.

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

## Verifica locale prevista

Dalla root della repository:

```powershell
git fetch origin
git switch recovery/fame-local-worker-v2-cdea2227
git pull --ff-only origin recovery/fame-local-worker-v2-cdea2227
python -m unittest discover -s strumenti/fame-local-worker -p "test_direct_qa_*v2.py" -q
```

I documenti presenti a `cdea2227` riportano i test v2 originali come passati
con client simulato; il nuovo test di regressione deve ancora essere eseguito
sul PC locale dopo il pull della branch di recovery.

## Prossimo intervento

Dopo il PASS locale della suite v2, il passo successivo corretto e preparare un
NUOVO task Direct QA specifico per la v2, con fonte e rubrica congelate prima
dell'inferenza, e aggiungere i test del pacchetto.

Non scegliere o rieseguire automaticamente PF-NMF, subset+BIC o Tsumugi
controlled. Non aprire un filone audio/MIDI come sostituto del nuovo task.

Prima del primo run reale v2 devono essere disponibili:

- nuovo `taskId`;
- snapshot della fonte;
- evidence unit complete;
- check/rubric host-only;
- test package-specific;
- root nuova e non riutilizzata.

## Vincolo di continuita

Se una futura sessione deve riprendere questa rete, leggere prima questo file e
il commit/branch indicati sopra. In caso di conflitto con descrizioni di altri
filoni, questa branch e la fonte di verita per il lavoro FAME Local Worker v2.
