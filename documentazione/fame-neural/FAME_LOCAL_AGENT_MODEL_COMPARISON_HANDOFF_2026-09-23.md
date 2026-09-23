# Handoff GPT-5.6 — confronto modello locale, 23 settembre 2026

## Obiettivo immediato

Guidare Mycol nel confronto di UN secondo modello locale Ollama sul caso QA transfer gia congelato. GPT-5.6 e l'assistente che accompagna l'operatore; non viene configurato come modello Ollama e non sostituisce il requisito locale/gratuito del worker.

Branch: `feature/fame-neural-roadmap`.
Commit di codice congelato: `5f29502092c9b641117e595a70a4489e651e66be`.
Worktree operatore: `C:\Users\mycol\gioco-rap-fame-neural`.
Hardware dichiarato: RTX 5070 Ti 16 GB, RAM 32 GB. Ambiente Python gia funzionante.

## Cosa e gia pronto

Leggere nell'ordine:
1. questo file;
2. `strumenti/fame-local-worker/QA_TRANSFER.md`;
3. `strumenti/fame-local-worker/observations/qwen-transfer-001.operator-observation.json`;
4. `qa_transfer.py` e `cases/independent-evaluation-rubric.json` nella stessa cartella.

Il runner funziona gia con `--model`: non serve scrivere un nuovo orchestratore o cambiare il codice per confrontare un modello.
Il motore v6 e il trasporto sono controllati tramite hash. Il nuovo caso conserva documento, prompt, rubric, schema, parametri e limite di UNA chiamata senza retry. I test di preparazione erano 33/33 con client simulati; non sono risultati di Qwen.

## Risultati osservati

- Primo caso Tsumugi v6: prima risposta validata; 7 categorie accettate, 8 evidenze aggiuntive scartate, circa 21,688 s. Risultato del sistema con aiuto del validatore, non risposta grezza perfetta.
- Secondo caso, report independent evaluation: Qwen3-Coder 30B, run `20260923T071733244082Z`, REJECTED / transfer FAIL, circa 24,313 s.
- Sei categorie accettate su dieci.
- DRUMS_FAIL e LOWEND_PASS corretti come direzione ma senza citazioni dei conteggi 8/12 e 10/12.
- ONSET_CAUSE_UNKNOWN e LOWEND_CAUSES_UNPROVEN completamente omesse.
- Nessuna categoria falsa emessa; formato JSON valido.
- Sette riferimenti superflui scartati nelle categorie gia valide.

Mappatura verificata nel report congelato:
E042 = riga 60, requisito drums almeno 9/12.
E049 = riga 70, totale voti drums 18.
E050 = riga 71, gate FAIL.
E058 = riga 84, mediana low-end 3.
E060 = riga 86, totale voti low-end 28.
E061 = riga 87, gate PASS.

Il rifiuto e giustificato per questa risposta. Non correggere la rubric per trasformarlo in PASS.
I dati registrati provengono dall'output incollato dall'utente, non da lettura remota del disco Windows. Il file observation lo dichiara. Il digest del modello manca: recuperarlo dal preflight originale, senza inventarlo.

## Passi operativi per GPT-5.6

Dare UN passaggio alla volta e attendere l'output. Non richiedere di rifare il test Qwen.

1. Dopo il normale aggiornamento della worktree, chiedere `ollama list`. Serve il nome esatto dei modelli gia installati. Non presumere disponibilita, tag, memoria o compatibilita.
2. Scegliere un solo secondo modello locale. Se ne serve uno nuovo, verificare documentazione ufficiale Ollama e del produttore: tag esatto, licenza, esecuzione locale senza costi API, JSON strutturato e memoria. I candidati menzionati in chat (Devstral, GPT-OSS, Qwen piu piccolo) NON sono una scelta gia approvata tecnicamente in questo documento. Non scaricare tutti i modelli. Nessuna API cloud o chiave a pagamento.
3. Riutilizzare il runner senza variazioni, in una nuova scrivania `FAME_QA_TRANSFER_002`. Non copiare memoria, risposte o log della prima scrivania nella richiesta del modello. La rubric resta lato host.
4. Eseguire una sola prova; conservare anche un eventuale FAIL. Non cambiare seed, contesto, prompt, schema, quantizzazione o rubric dopo aver visto il risultato per poi dichiarare lo stesso esperimento superato.
5. Acquisire transfer-evaluation.json, report.json, attempt-1-validation.json, attempt-1-response.json e preflight.json. Se PASS, controllare anche answer.json/review.md.
6. Confrontare categorie corrette, mancanti, non supportate, copertura delle evidenze, riferimenti scartati e costo della revisione umana. Riportare modello/tag/digest, contesto, token e tempi. I 24,3 s di Qwen includono circa 13,5 s di caricamento: non confrontare ingenuamente un run a freddo con uno a caldo. Non dichiarare risparmio di tempo umano non misurato.

## Comandi pronti

Da worktree corretta, senza checkout forzati, reset o cancellazioni:

```powershell
git pull --ff-only origin feature/fame-neural-roadmap
```

Poi, come primo passo di scelta:

```powershell
ollama list
```

Dopo aver identificato il nome esatto, GPT-5.6 deve sostituire il segnaposto prima di fornire il comando run all'utente:

```powershell
python strumenti/fame-local-worker/qa_transfer.py init --root "$HOME\FAME_QA_TRANSFER_002"
python strumenti/fame-local-worker/qa_transfer.py run --root "$HOME\FAME_QA_TRANSFER_002" --model "<TAG_LOCALE_VERIFICATO>"
```

Non lanciare il segnaposto. Se la scrivania esiste gia, non cancellarla: verificare cosa contiene e usare un nuovo numero per l'esperimento distinto.

Per leggere il risultato, sostituire RUN_ID con quello stampato dal comando:

```powershell
$p = "$HOME\FAME_QA_TRANSFER_002\runs\<RUN_ID>"
Get-Content -Raw -Encoding UTF8 "$p\transfer-evaluation.json"
Get-Content -Raw -Encoding UTF8 "$p\attempt-1-validation.json"
Get-Content -Raw -Encoding UTF8 "$p\attempt-1-response.json"
```

## Decisione predefinita

- Secondo modello PASS con revisione umana corretta: candidato preferibile su QUESTO caso. Prima di affidargli lavoro, verificare anche la regressione sul primo caso e misurare un piccolo incarico utile; non proclamare affidabilita generale.
- Secondo modello FAIL: confrontare tipo e gravita degli errori; fermare il giro di aggiustamenti sul caso. Valutare un compito piu stretto, eventualmente separando estrazione fatti e verifica, con un nuovo protocollo dichiarato.
- Errore di runtime/contesto: registrarlo come infrastrutturale, distinto dal FAIL semantico; preservare il primo run.
- Eventuale difetto dimostrato del valutatore: invalidare la prova con motivazione; mai promuoverla retroattivamente.

Nessun coordinatore multiagente ora. Nessun training, nuova inferenza audio, modifica degli algoritmi FAME Neural, apertura batch 131/P6 o dichiarazione task-data ready. Questo lavoro valuta il worker documentale.

## Prompt di ripresa per GPT-5.6

> Leggi documentazione/fame-neural/FAME_LOCAL_AGENT_MODEL_COMPARISON_HANDOFF_2026-09-23.md sul branch feature/fame-neural-roadmap e i file indicati. Il secondo test Qwen e gia FAIL documentato: non ripeterlo e non cambiare i criteri. Aiutami a confrontare un solo altro modello locale gratuito tramite il runner esistente, un comando alla volta. Parti da ollama list per scegliere un tag realmente disponibile. Conserva risultati e limiti senza dichiarare prove non eseguite.
