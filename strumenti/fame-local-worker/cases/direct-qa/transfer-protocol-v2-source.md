# Seconda prova QA locale — protocollo congelato v1

## Scopo e stato

Verificare il worker su un secondo documento reale, senza ritoccare il motore v6 in base alla risposta di Qwen. Nessuna esecuzione Ollama effettuata durante la preparazione; esito reale ancora NON MISURATO.

Il caso e il report storico di independent evaluation Audio→MIDI, copiato integralmente dal commit `7d90ac20b45136104717f155d1e26d4f40a818eb`. Fonte, hash e criteri sono in `cases/independent-evaluation-rubric.json`. Il report registra esiti storici: questa prova non riesegue audio, non verifica i file D:\FAME_NEURAL e non modifica lo stato attuale della roadmap.

Il precedente caso Tsumugi resta invariato. Il risultato v6 comunicato dall'operatore: run `20260923T065440213888Z`, prima risposta validata, 21,688 secondi, 7 categorie, 8 evidenze scartate. Questo riepilogo deriva dall'output incollato in chat, non da un audit dei file originali sul PC.

## Cosa rimane congelato

- `qa_worker.py` v6 e `agent.py`: nessuna modifica; hash canonici controllati dal nuovo adattatore.
- Procedura, schema, trasporto locale, parametri (16384 context, 4096 output, temperatura 0, seed 42), filtraggio e materializzazione del motore.
- Nuovi solo documento, catalogo, rubric e policy specifici del secondo caso.
- Una chiamata al modello, senza retry; una esecuzione per scrivania.
- Il modello riceve documento, catalogo e policy, mai la rubric con le risposte/citazioni attese. Non ha tool o accesso autonomo alla repo.

Non e un test cieco rispetto ai preparatori: abbiamo letto il documento e scritto la rubric. E un nuovo caso per questo esperimento del worker; non possiamo certificare che il modello non abbia mai visto il testo in altre circostanze. Non misura apprendimento dei pesi o autonomia generale.

## Criteri registrati prima del run

Dieci categorie obbligatorie: separazione PASS tecnico/qualita, FAIL drums, PASS low-end, cohort consumato, autorizzazioni chiuse, causa onset incerta, limite single-label con eccezione fusion, beneficio fusion non isolato, cause low-end incerte, limiti renderer.

Le alternative di evidenza sono esplicite nella rubric. Citazioni superflue vengono scartate e registrate secondo la v6 solo se quelle rimanenti bastano. Affermazioni errate, parti mancanti, ID inventati o duplicati non vengono corrette per far passare la risposta.

Esito primario: `transfer-evaluation.json` deve essere PASS, con prima risposta completa e `candidateErrors=[]`. Il solo `VALIDATED_FOR_REVIEW` non basta: il motore puo assemblare finding valide anche da un candidato contenente errori. La metrica della nuova prova lo distingue senza modificare v6.

La revisione umana deve ancora confermare citazioni, significato e utilita. Registrare separatamente tempo di revisione e tempo di una revisione manuale comparabile; il software lascia questi valori null e non dichiara un risparmio non misurato.

## Esecuzione PowerShell

Dalla radice della worktree sul branch feature/fame-neural-roadmap:

```powershell
git pull --ff-only origin feature/fame-neural-roadmap
python strumenti/fame-local-worker/qa_transfer.py init --root "$HOME\FAME_QA_TRANSFER_001"
python strumenti/fame-local-worker/qa_transfer.py run --root "$HOME\FAME_QA_TRANSFER_001" --model "qwen3-coder:30b"
```

Se il pull o init fallisce, fermarsi e leggere l'errore; non cambiare branch e non cancellare scrivanie esistenti. Il secondo comando crea la scrivania, il terzo esegue la prova. Nessuna installazione aggiuntiva oltre all'ambiente gia usato.

Il comando stampa il percorso di `transfer-evaluation.json`. Conservare tutta la cartella run: richiesta e risposta grezza, validazione, configurazione congelata, preflight con digest modello, report, answer/review se disponibili. Per leggere JSON con PowerShell usare `Get-Content -Raw -Encoding UTF8`.

## Decisione dopo il risultato

- PASS e revisione umana soddisfacente: conservare il risultato e valutare un piccolo incarico utile con costo umano misurato. Non certifica ancora una rete multiagente.
- FAIL semantico: conservare il fallimento; confrontare eventualmente un altro modello su identico caso/configurazione e nuova scrivania, senza ritoccare criteri.
- Errore infrastrutturale: registrarlo separatamente dal ragionamento; una ripetizione correttiva resta distinta dalla prima prova.
- Eventuale difetto reale della rubric: registrarlo e invalidare la prova, non trasformarla retroattivamente in PASS.

Non aprire batch 131, training, P6, nuovi audio o coordinatore multiagente in conseguenza di questo test.

## Verifica del codice

`python -m unittest discover -s strumenti/fame-local-worker -p "test_*.py"`

Preparazione: 33 test stdlib superati nel container, con risposte Ollama simulate. Non costituiscono un PASS del modello. Quattro nuovi test coprono esito completo, nessuna rubric nella richiesta, isolamento dalla v6, blocco della ripetizione, errori semantici/citazioni incomplete, scarto tracciato e input alterato.

