# Cline + GPT-OSS 20B — risultati dei probe locali — 23 settembre 2026

## Provenienza

Questo documento consolida gli output e gli screenshot forniti dall'operatore durante le prove locali Windows. La repository contiene preparatori, correttori e rubriche; l'assistente non ha accesso indipendente al disco locale, ai log completi di Cline o al traffico di rete. Le attestazioni di sessione restano quindi dichiarazioni operatore, separate dalla correttezza degli artefatti.

Runtime dichiarato per tutte le sessioni completate:

- Cline `4.1.20`;
- Ollama `0.34.2`;
- modello `gpt-oss:20b`;
- digest modello `17052f91a42e97930aa6e28a6c6c06a983e6a58dbb00434885a0cf5313e376f7`;
- provider Ollama su `http://localhost:11434`;
- context UI osservato: `32768`;
- Web Search disattivato;
- nessun retry/correzione manuale nei run misurati;
- `Use Compact Prompt` non individuato nella UI esaminata; `Auto Compact` è un'impostazione distinta.

## 1. Probe filesystem sintetico

Root operatore: `FAME_CLINE_GPTOSS_001`.

Preparatore/correttore: `cline_gptoss_probe.py`.

Esito riportato dal grader:

- schema: `fame-cline-gptoss-filesystem-probe-v1`;
- stato: `PASS_OPERATOR_ATTESTED`;
- `artifactCorrect=true`;
- `integrityErrors=[]`;
- `answerErrors=[]`;
- 4/4 risultati esatti;
- `interventions=0`;
- `sessionIndependentlyVerified=false`;
- `modelCallsByThisScript=0`;
- training non autorizzato;
- network production readiness falsa.

Il modello ha letto i sette file previsti della scrivania e ha creato `answer.json`. Questo prova, entro i limiti dell'attestazione operatore, che la combinazione Cline + GPT-OSS locale può completare un task file-based ristretto con lettura e scrittura.

## 2. Probe QA reale — independent evaluation

Root operatore: `FAME_CLINE_GPTOSS_REAL_QA_001`.

Preparatore/correttore: `cline_gptoss_real_qa_probe.py`.

Casi congelati:

1. `DRUMS_FAIL`;
2. `LOWEND_CAUSES_UNPROVEN`;
3. `BATCH_AUTHORIZED`;
4. `RENDERER_LIMITS`.

Esito:

- stato complessivo: `FAIL`;
- integrità: PASS, `integrityErrors=[]`;
- conclusioni: **4/4 corrette**;
- copertura evidenze: **3/4 corretta**;
- unico errore: `RECORD_1_INSUFFICIENT_EVIDENCE`;
- nessuna citazione superflua nelle tre finding accettate.

Dettaglio:

- `DRUMS_FAIL`: `SUPPORTED_DIRECT`, E171;
- `LOWEND_CAUSES_UNPROVEN`: conclusione corretta ma `INSUFFICIENT_EVIDENCE`, solo E164;
- `BATCH_AUTHORIZED`: `CORRECT_UNSUPPORTED`;
- `RENDERER_LIMITS`: `SUPPORTED_DIRECT`, E160 + E164.

E164 è la riga fisica 250 del report e riguarda limiti renderer/frame/MIDI: non copre entrambe le cause low-end. L'audit congelato richiede prova diretta E145 + E155 oppure il bundle contestuale E145 + E152 + E153 + E154. Il caso non viene ritentato dopo aver visto questa soluzione.

## 3. Probe Tsumugi con report + evidence.json separati

Root operatore: `FAME_CLINE_GPTOSS_TSUMUGI_QA_001`.

Preparatore/correttore: `cline_gptoss_tsumugi_qa_probe.py`.

Casi:

- `MISSING_EVENTS`;
- `TIMBRE_HYPOTHESIS`;
- `ONSET_TOLERANCE_CAUSE`;
- `PAIR_CONFIDENCE_UNKNOWN`.

Il primo run non ha prodotto `answer.json`. Cline ha letto i file iniziali e si è fermato durante una lettura parziale di `evidence.json` con errore mostrato in UI:

- `error parsing tool call`;
- payload visibile con `start_line: 50`, `end_line: 200`;
- `unexpected end of JSON input`.

Il grader ha quindi prodotto:

- stato: `FAIL`;
- `artifactCorrect=false`;
- `integrityErrors=[]`;
- errore risposta: `answer.json` assente;
- nessun risultato semantico valutabile.

Non è stato premuto Retry. Questo run va conservato come failure di tool-call prima della risposta, non come errore QA del modello.

## 4. Diagnostico Tsumugi compatto

Root operatore: `FAME_CLINE_GPTOSS_TSUMUGI_COMPACT_001`.

Preparatore/correttore: `cline_gptoss_tsumugi_compact_probe.py`.

Il diagnostico ripete lo stesso caso Tsumugi esclusivamente per isolare il failure precedente. La differenza è strutturale: un solo `report-numbered.md` con evidence ID incorporati, senza `evidence.json` separato.

Cline ha completato il task e creato `answer.json`. Esito del grader:

- stato complessivo: `FAIL`;
- integrità: PASS;
- conclusioni: **4/4 corrette**;
- 3/4 finding con selezione evidenze pienamente precisa;
- unico errore: `RECORD_1_SURPLUS_EVIDENCE`.

Dettaglio:

- `MISSING_EVENTS`: `SUPPORTED_DIRECT`, E031 + E034 + E035;
- `TIMBRE_HYPOTHESIS`: conclusione corretta e coperta, ma E042 è superflua; E045 è sufficiente;
- `ONSET_TOLERANCE_CAUSE`: `CORRECT_UNSUPPORTED`;
- `PAIR_CONFIDENCE_UNKNOWN`: `SUPPORTED_DIRECT`, E060.

Il PASS del tool layer nel formato compatto non trasforma questo repeat in una nuova independent evaluation. Serve soltanto a isolare l'effetto del packaging dei file.


## 5. Probe QA P2 — nuovo report pre-numerato

Root operatore: `FAME_CLINE_GPTOSS_P2_001`.

Preparatore/correttore: `cline_gptoss_p2_probe.py`.

Source congelata:

- commit: `5fc9330ef003be43cfbb2af8a63c13e7814ea870`;
- path: `documentazione/fame-neural/OWNED_BEATS_AUDIO_TO_MIDI_P2_MEASUREMENT_PASS_2026-09-22.md`;
- case SHA256: `566912bff9c497361f00ccb7f8a513461b4543bbd854ae9988ba508c8c7b49e9`.

Il tool flow ha completato la lettura della desk e la scrittura di `answer.json` senza Retry o suggerimenti correttivi riportati.

Esito del grader:

- stato: `FAIL`;
- integrità: PASS, `integrityErrors=[]`;
- conclusioni: **4/4 corrette**;
- coverage sufficiente: **3/4**;
- unico errore bloccante: `RECORD_1_INSUFFICIENT_EVIDENCE`;
- nessuna citazione non revisionata.

Dettaglio:

- `EXPORT_EQUIVALENT`: conclusione corretta, coverage `SUFFICIENT`, E026 + E027;
- `REFERENCE_DURATION`: conclusione corretta, coverage `INSUFFICIENT`, E020 + E021;
- `HISTORICAL_EFFECT_UNKNOWN`: conclusione corretta, coverage `SUFFICIENT`, E059 + E060; E032 + E033 sono warning di precisione benigni già congelati;
- `TRAINING_AUTHORIZED`: correttamente `false`, coverage `NOT_REQUIRED`.

Per `REFERENCE_DURATION` la rubrica congelata richiede tre gruppi distinti: E019, E020 ed E021. Il modello ha citato E020 + E021 ma ha omesso E019, che introduce esplicitamente che il renderer v2 usa una durata esplicita derivata dalla reference. Non si modifica la rubrica e non si ritenta il caso dopo aver visto il risultato.

Nota metodologica successiva: E019/E020/E021 derivano in realta dalla stessa frase/paragrafo del source report. Il FAIL resta corretto **rispetto alla rubrica congelata**, ma non viene interpretato come prova che il modello non abbia compreso il renderer. Ha anche misurato la capacita di ricomporre una frase frammentata dalla numerazione line-based. Il probe successivo passa quindi a unita semantiche complete senza rivalutare retroattivamente P2.

Questo è il primo nuovo report P2 registrato con il formato singolo pre-numerato. Il tool layer ha completato il task; il limite osservato resta la copertura precisa di affermazioni composte.

## Evidenza cumulativa e interpretazione

Sui tre probe QA che hanno prodotto una risposta completa, GPT-OSS + Cline ha ottenuto **12/12 conclusioni corrette** sui casi selezionati. Gli errori osservati restano concentrati nella selezione/copertura delle prove:

- due finding con evidenza insufficiente per una conclusione composta (independent-evaluation e P2);
- una finding con una citazione pertinente ma superflua nel diagnostico Tsumugi.

Non è ancora dimostrata una precisione affidabile delle citazioni su casi nuovi. Il risultato non autorizza tuning della rubrica sui casi consumati.

Sul tool layer:

- il filesystem probe semplice è completato;
- il Tsumugi multi-file ha avuto una tool-call JSON malformata;
- lo stesso Tsumugi impacchettato in un singolo report numerato è completato.

Una singola coppia failure/success non dimostra causalità definitiva, ma giustifica come default sperimentale successivo il formato **report unico pre-numerato**, perché riduce tool-call e superficie di errore senza cambiare la semantica del grader.

## Decisione operativa congelata

Per il prossimo checkpoint:

1. non ritentare i casi già consumati per trasformare FAIL in PASS;
2. usare un **nuovo caso QA congelato prima della sessione del modello**;
3. usare come default una sola desk con report pre-numerato;
4. mantenere grader/rubrica fuori dalla desk;
5. misurare separatamente:
   - correttezza della conclusione;
   - copertura delle evidenze;
   - precisione delle citazioni;
   - failure del tool layer;
6. conservare esito first-pass e nessun retry manuale;
7. solo dopo nuovi casi valutare il confronto strutturale **desk multi-caso vs 14 desk specializzate**.

Nessuno di questi probe autorizza training, batch131, produzione o uso del network come agente autonomo.

## File e commit rilevanti

- `CLINE_GPTOSS_PROBE.md` / `cline_gptoss_probe.py`;
- `cline_gptoss_real_qa_probe.py`;
- `cline_gptoss_tsumugi_qa_probe.py`;
- `cline_gptoss_tsumugi_compact_probe.py`;
- `RUBRIC_AUDIT.md`;
- commit preparazione filesystem probe: `826d121`;
- commit QA reale ristretto: `3a6dc3e`;
- commit Tsumugi probe: `13adac3` + test `bd7e35c`;
- commit diagnostico compatto: `76f813a` + test `cb03629`;
- fix test evidence ID: `5cb8cd4`.

I file sotto `observations/` registrano i risultati riportati dall'operatore in forma strutturata.
