# Prova GPT-OSS 20B + Cline — QA reale ristretto

## Scopo

Secondo checkpoint dopo il probe sintetico `fame-cline-gptoss-filesystem-probe-v1`.
Questa prova riusa **il report reale già congelato** dell'independent evaluation FAME Neural e quattro affermazioni del catalogo QA. Non apre audio, non crea un nuovo cohort e non modifica risultati storici.

Le quattro affermazioni sono fissate prima della sessione Cline:

- `DRUMS_FAIL` — positiva, con numeri/soglia;
- `LOWEND_CAUSES_UNPROVEN` — positiva e composta, incluso il caso che aveva richiesto audit della copertura contestuale;
- `BATCH_AUTHORIZED` — negativa;
- `RENDERER_LIMITS` — positiva e composta.

Il correttore distingue **conclusione**, **copertura delle evidenze** e **citazioni fuori rubrica**. Accetta per il caso low-end sia la prova diretta sia il bundle contestuale già documentato da `RUBRIC_AUDIT.md`; non espone al modello la soluzione attesa.

## 1. Preparare una nuova scrivania

Dalla worktree `feature/fame-neural-roadmap`, dopo `git pull --ff-only`:

```powershell
python strumenti/fame-local-worker/cline_gptoss_real_qa_probe.py init --root "$HOME\FAME_CLINE_GPTOSS_REAL_QA_001"
```

Crea:

- `desk/`: `TASK.md`, `TASK.json`, `report.md`, `evidence.json`, `memory/procedure.md`, `.clinerules/01-scope.md`;
- `operator/`: protocollo e scheda sessione.

`report.md` è il caso reale congelato già presente nella repo; `evidence.json` assegna gli stessi evidence ID usati dal sistema QA. Il correttore e i criteri restano fuori dalla scrivania.

## 2. Aprire solo `desk`

```powershell
code -n "$HOME\FAME_CLINE_GPTOSS_REAL_QA_001\desk"
```

Usare una nuova sessione Cline. Configurazione uguale al probe riuscito:

- provider `Ollama`;
- modello `gpt-oss:20b` locale;
- Act;
- Web Search disattivato;
- auto-approve solo lettura file;
- scrittura di `answer.json` approvata manualmente;
- niente terminale, browser, MCP o altre cartelle.

Se `Use Compact Prompt` non è presente, registrare `null`; `Auto Compact` non è la stessa impostazione.

## 3. Unico messaggio

```text
Esegui il compito in TASK.md usando i file della scrivania. Salva il risultato richiesto in answer.json.
```

Non aggiungere correzioni o suggerimenti. Le normali approvazioni dei tool non contano come interventi. Se il modello si blocca, chiede chiarimenti, usa strumenti vietati o produce un risultato errato, conservare la prima sessione senza trasformarla in un retry-until-pass.

## 4. Attestazione operatore

Dopo la sessione compilare `operator/session.json` con i dati osservabili, come nel probe precedente: versioni Cline/Ollama, digest modello, contesto visibile, sessione nuova, tool osservati, uso del solo modello locale, rispetto del perimetro, interventi e durata se misurata.

Non inventare valori mancanti. `sessionIndependentlyVerified` resterà `false`: il correttore non certifica autonomamente tutti i log o l'isolamento di rete dell'estensione.

## 5. Controllo esterno — una sola volta

Dalla repo, fuori da Cline:

```powershell
python strumenti/fame-local-worker/cline_gptoss_real_qa_probe.py grade --root "$HOME\FAME_CLINE_GPTOSS_REAL_QA_001"
```

Il grader non chiama Ollama. Verifica:

- integrità byte-per-byte della scrivania iniziale;
- assenza di file extra oltre `answer.json`;
- contratto e ordine dei quattro risultati;
- correttezza della conclusione;
- copertura diretta o contestuale prevista dalla rubrica auditata;
- assenza di evidence ID fuori dalla rubrica ammessa;
- attestazione operatore, separata dalla correttezza dell'artefatto.

Esiti:

- `FAIL` — artefatto errato/incompleto, citazioni fuori rubrica o integrità violata;
- `ARTIFACT_PASS_SESSION_UNVERIFIED` — QA corretto ma sessione non attestata completamente;
- `PASS_OPERATOR_ATTESTED` — QA corretto e condizioni operative dichiarate verificate dall'operatore.

`operator/evaluation.json` viene creato una sola volta: non rilanciare `grade` sulla stessa root.

## Limiti e decisione successiva

Questo è un **riuso ristretto di un caso reale già noto al progetto**, non una nuova independent evaluation e non misura generalizzazione su un report inedito. Un PASS dimostra che la combinazione GPT-OSS + Cline riesce a svolgere questo compito reale di lettura/citazione con gli strumenti, senza autorizzare batch, training o produzione.

Se passa al primo tentativo, il checkpoint successivo deve usare un **nuovo caso QA congelato prima dell'esecuzione del modello** o un report development non già usato per tarare le rubriche, mantenendo separati risultato tecnico e review umana.
