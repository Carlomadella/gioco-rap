# Worker QA diretto e coda riutilizzabile

## Decisione e primo incarico

Implementazione del percorso deciso in `e86b7b1`: GPT-OSS 20B locale via agent.py, senza Cline, strumenti del modello o dispatch di comandi. Il programma prepara i dati e salva gli artefatti. Il modello valuta soltanto le affermazioni.

Primo pacchetto: `pfnmf-review-v1`, audit documentale del checkpoint storico PF-NMF NDR-097. Fonte congelata al commit e86b7b162e87ade32a367506cee3cdf9c3fda7a8; snapshot completo incluso in cases/direct-qa. Le sette unità conservano testo, paragrafi e liste completi; il runner verifica che ricompongano la fonte integrale. Le quattro affermazioni riguardano esito/causa, errori D06, ambito BIC e presunta apertura training.

Questo report non compare nei probe registrati esaminati. Non è possibile certificare precedenti esposizioni del modello o assenza di contaminazione; dichiarare quelle note. È una proposta di QA di un report storico, non esecuzione delle sue decisioni e non nuova valutazione audio indipendente.

## Comandi operativi PowerShell

Dalla worktree aggiornata del branch feature/fame-neural-roadmap:

```powershell
git pull --ff-only
```

Preparare una coda dedicata, senza inferenza:

```powershell
python strumenti/fame-local-worker/direct_qa_queue.py init --root "$HOME\FAME_DIRECT_QA_NETWORK_001" --tasks pfnmf-review-v1
```

Con Ollama avviato, eseguire:

```powershell
python strumenti/fame-local-worker/direct_qa_queue.py run --root "$HOME\FAME_DIRECT_QA_NETWORK_001"
```

Una sola chiamata iniziale per scrivania; attualmente la coda contiene un solo incarico. Non eseguire lo stesso pacchetto anche in una seconda root per ottenere un nuovo primo tentativo. Non aprire queste cartelle in Cline.

Rilettura senza chiamate al modello:

```powershell
python strumenti/fame-local-worker/direct_qa_queue.py status --root "$HOME\FAME_DIRECT_QA_NETWORK_001"
```

Dettaglio del primo incarico:

```powershell
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_DIRECT_QA_NETWORK_001\desks\pfnmf-review-v1\attempt-1\report.json"
```

I file comprendono preflight, request, response, candidate, validation, report e ricevuta hash. Se accettato vengono prodotti answer.json e review.md con le evidenze testuali per la revisione umana. Per errori di trasporto o preflight alcuni artefatti possono mancare: report.json ne registra la causa. La rubrica host-only non viene inviata al modello.

## Contratto operativo

- Modello gpt-oss:20b, digest `17052f91a42e97930aa6e28a6c6c06a983e6a58dbb00434885a0cf5313e376f7` verificato prima della chiamata.
- Parametri come il diagnostico diretto: num_ctx=32768, num_predict=2048, temperature=0, seed=42. Nessun override think: resta il default server, non dichiarato low. Preflight e richiesta conservati.
- JSON Schema nel payload; il validator host verifica anche ordine, tipi, ID e copertura. Conformità JSON da sola non dimostra correttezza semantica.
- Una sola attempt-1. Anche errore e interruzione restano registrati e non sono rieseguiti. Il rilancio della coda visita solo scrivanie mai tentate; si ferma al primo ERROR operativo per evitare time-out ripetuti. Lock impediscono esecuzioni concorrenti; rimuoverli dopo crash solo dopo arresto confermato.
- Fonte, pacchetto, codice worker/trasporto e snapshot congelati. Modifiche durante il run impediscono accettazione. Status verifica hash degli artefatti e riproduce la validazione. Hash locali non sono firme indipendenti.
- Il client usa loopback e blocca redirect/proxy; non certifica isolamento di rete dell'intero server Ollama.
- `VALIDATED_FOR_REVIEW`: conclusioni e prove conformi ai criteri del pacchetto, con revisione umana ancora richiesta. `REJECTED`: output invalido/conclusione errata/prove insufficienti o non ancora revisionate. `ERROR`: problema operativo/integrità. `INTERRUPTED`: tentativo privo di ricevuta, non ripetibile automaticamente.
- Citazioni di contesto già verificate innocue generano precisionWarnings. Le altre aggiunte sono unreviewedEvidenceIds e richiedono revisione; non vengono chiamate automaticamente false.
- Nessun output autorizza training, batch131, produzione, modifica sorgenti o altre azioni. La coda coordina QA indipendenti, non pianifica cambi al progetto.

## Aggiungere scrivanie senza riscrivere il runner

Il protocollo comune sta in direct_qa_worker.py; la coda deterministica in direct_qa_queue.py. Un nuovo incarico è un JSON in cases/direct-qa con taskId, commit/path/hash della fonte, snapshot completo in repo, scope, unità testuali, checks e rubriche. Il registro è limitato a task ID locali: nessun caricamento di plugin, percorso o codice scelto dal modello.

Prima dell'inferenza: revisionare la fonte, creare unità complete, definire verità attese, gruppi alternativi sufficienti e contesto benigno. Aggiungere test negativi e positivi specifici. Non usare il runner generico come validatore universale: ogni pacchetto richiede una rubrica giustificata.

La coda può contenere fino a 20 task distinti, eseguiti sequenzialmente sulla GPU. Non creare 20 copie dello stesso report per presentarle come prove indipendenti. Il vecchio qa_coordinator.py resta congelato con i suoi risultati; questo coordinatore riutilizza lo stesso principio di scrivanie e controlli, con un formato pacchetto generalizzato.

## Validazione e passaggio successivo

18 test con client simulato passati: copertura/conclusioni, warning innocui, ID invalidi, assenza di oracle/tool nel prompt, digest errato, trasporto/troncamento, integrità prima/durante/dopo, ricevute, lock e mancata riesecuzione di tentativi completati/interrotti. Nessuna inferenza reale eseguita qui.

```powershell
python -m unittest discover -s strumenti/fame-local-worker -p "test_direct_qa_*.py" -q
```

Registrare il primo run reale e ispezionare review.md. Misurare anche il tempo umano: elapsedSeconds del runner non dimostra risparmio netto. Solo dopo questo checkpoint aggiungere un secondo incarico utile e indipendente. Non riaprire Cline né ripetere casi consumati per ottenere PASS. Se cambia la rubrica dopo osservazione, la rivalutazione va riportata separatamente.

## Primo run reale registrato

`FAME_DIRECT_QA_NETWORK_001 / pfnmf-review-v1 / attempt-1` ha restituito `VALIDATED_FOR_REVIEW` con una sola chiamata al modello e `executionAuthorized=false`. La review umana e risultata coerente con la rubrica congelata. Il task e consumato e non va ripetuto in una seconda root.

Risultato: [DIRECT_QA_PFNMF_RESULT_2026-09-23.md](DIRECT_QA_PFNMF_RESULT_2026-09-23.md).

## Secondo incarico congelato — subset+BIC

Dopo il primo run reale PF-NMF, e stato aggiunto `subset-bic-review-v1` sul checkpoint storico NDR-098. E un task diverso: verifica il fallimento del gate subset+BIC, il pattern D06, la decisione di fermare il loop euristico/template, i vincoli del passaggio a Tsumugi e due controlli negativi su training e MT3.

La fonte e congelata al commit `1283c9678ece6b64ea6b030b75236bed24cddad6` e ricomposta integralmente da 15 unita semantiche. Il task non viene accodato alla root gia consumata `FAME_DIRECT_QA_NETWORK_001`.

Prima del run reale:

```powershell
git pull --ff-only
python -m unittest discover -s strumenti/fame-local-worker -p "test_direct_qa_*.py" -q
python strumenti/fame-local-worker/direct_qa_queue.py init --root "$HOME\FAME_DIRECT_QA_NETWORK_002" --tasks subset-bic-review-v1
```

Poi una sola esecuzione:

```powershell
python strumenti/fame-local-worker/direct_qa_queue.py run --root "$HOME\FAME_DIRECT_QA_NETWORK_002"
```

Se il run termina `VALIDATED_FOR_REVIEW`, leggere `desks/subset-bic-review-v1/attempt-1/review.md`. Nessun retry dello stesso task in una root differente.

## Esito secondo incarico — reject di precisione del packaging

`subset-bic-review-v1` e stato consumato con `REJECTED`, una sola chiamata. Le 5/5 conclusioni erano corrette e tutte le finding positive avevano coverage sufficiente. L'unico errore era `TSUMUGI_PREFLIGHT_SCOPE:UNREVIEWED_EVIDENCE` per `U13`, un heading Markdown privo di contenuto autonomo.

Il risultato non viene ricalcolato ne ritentato. Il difetto e stato classificato come authoring/packaging: i task futuri devono unire heading strutturali e blocco successivo nella stessa unita semantica. Vedi [DIRECT_QA_PACKAGE_AUTHORING.md](DIRECT_QA_PACKAGE_AUTHORING.md) e [DIRECT_QA_SUBSET_BIC_RESULT_2026-09-23.md](DIRECT_QA_SUBSET_BIC_RESULT_2026-09-23.md).

## Terzo incarico congelato — Tsumugi controlled

Preparato `tsumugi-controlled-review-v1` sul checkpoint NDR-099 con la regola di authoring corretta: nessun heading strutturale e una evidence unit autonoma. Le nove unita ricompongono integralmente la fonte e mantengono insieme heading + contenuto correlato.

Il task verifica cinque punti: gate FAIL senza generalizzare l'incapacita del modello, limite dell'ipotesi timbrica/OOD, limite inferenziale del top-k sulla pair confidence, scope della diagnostica sintetica successiva e controllo negativo sull'apertura real-easy/P6.

Run dedicato:

```powershell
git pull --ff-only
python -m unittest discover -s . -p "test_direct_qa_*.py" -q
python direct_qa_queue.py init --root "$HOME\FAME_DIRECT_QA_NETWORK_003" --tasks tsumugi-controlled-review-v1
python direct_qa_queue.py run --root "$HOME\FAME_DIRECT_QA_NETWORK_003"
```

Una sola inferenza. Non riusare le root 001/002 e non ritentare questo task in una root differente.
