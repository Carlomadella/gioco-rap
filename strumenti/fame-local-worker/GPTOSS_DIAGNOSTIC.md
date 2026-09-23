# Diagnostica GPT-OSS: livello low, budget 4096 — v1

Nuovo esperimento successivo al confronto congelato, senza modifica retroattiva dei FAIL Qwen/GPT-OSS. Il precedente run GPT-OSS `20260923T073208792637Z` ha terminato con length, 4096 token generati e nessun content finale (evidenza trascritta dall'operatore).

## Ipotesi e unica variazione

Chiedere esplicitamente `think: "low"` potrebbe lasciare spazio al JSON finale nel budget esistente. Non e una garanzia e non equivale a disattivare il ragionamento. Non conosciamo il livello effettivo del vecchio run: think era omesso, quindi dipendeva dal modello/server.

Restano invariati: documento, catalogo, procedure, rubric, formato, contesto 16384, num_predict 4096, temperatura 0, seed 42, trasporto e timeout 120 s. Una sola chiamata, nessun retry, nuova scrivania. Il digest del modello deve coincidere con quello registrato nel vecchio run. La maggiore o minore velocita non viene interpretata senza distinguere caricamento e inferenza.

Fonte ufficiale verificata il 23/09/2026: https://docs.ollama.com/capabilities/thinking . Il parametro think accetta livelli denominati; api/show puo esporre thinking.values e default. Si salvano i metadati reali. Se low e esplicitamente non supportato, il programma si ferma prima della generazione. Se i metadati mancano, low viene richiesto secondo documentazione e il report dichiara che l'effettiva applicazione non e verificata indipendentemente. Nessun presupposto che la versione locale esponga tutti i campi delle docs correnti.

## Esecuzione

Dalla worktree corretta sul branch feature/fame-neural-roadmap, un comando alla volta:

```powershell
git pull --ff-only origin feature/fame-neural-roadmap
python strumenti/fame-local-worker/qa_gptoss_diagnostic.py init --root "$HOME\FAME_GPTOSS_DIAG_001"
python strumenti/fame-local-worker/qa_gptoss_diagnostic.py run --root "$HOME\FAME_GPTOSS_DIAG_001"
```

Non cancellare o riutilizzare le scrivanie TRANSFER. Modello fisso gpt-oss:20b gia installato. Nessun nuovo download necessario se il digest coincide.

Il percorso report.json viene stampato. Nella stessa cartella si conservano request.json (esatta richiesta inviata), response.json (incluso thinking se restituito), preflight.json, frozen-case-config.json, validation.json e answer.json solo se validato. Leggere con Get-Content -Raw -Encoding UTF8.

## Interpretazione predefinita

- VALIDATED_FOR_REVIEW: prima risposta finale completa e semanticamente accettata dalla rubric immutata; resta necessaria revisione umana. Mostra che questa configurazione funziona sul caso gia noto, non generalizzazione o apprendimento.
- SEMANTIC_FAIL: JSON finale prodotto, ma incompleto/errato secondo i criteri. Il collo di bottiglia dell'output e superato, quello della qualita no.
- OUTPUT_TRUNCATED: il limite e ancora raggiunto. Non misura correttezza semantica. Prima di proporre un budget maggiore, guardare risposta, token e contesto residuo; con circa 10k token di input, aumentare output a 8192 nel contesto 16384 non e una scelta automaticamente valida. Un eventuale aumento richiedera un altro profilo dichiarato con verifica del contesto. Nessuna escalation automatica.
- INVALID_RESPONSE: nessuna risposta finale completa/valida, distinto dall'errore semantico.
- ERROR: digest diverso, metadati incompatibili, timeout, input modificato o altro errore operativo; conservare log e non classificarlo come incapacita del modello.

Non trattare il thinking come risposta finale. Non cambiare la rubric o inventare findings mancanti. Non eseguire training, audio o coordinamento multiagente.

## Verifica e limiti

39 test automatici passati nel container (6 nuovi), usando client simulati: richiesta esatta/low/budget, troncamento, errore semantico, digest diverso, low non supportato, alterazione degli input e conservazione del primo run. Nessuna chiamata Ollama reale eseguita dall'assistente durante la preparazione. La prova hardware va eseguita dal PC dell'operatore.
