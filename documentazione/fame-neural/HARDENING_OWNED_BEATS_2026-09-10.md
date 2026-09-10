# Hardening strumenti e workflow owned-beats — 10 settembre 2026

Base: `4c4c8b7349d185f3e34a7a9f4de3f8e36b310e0c`. 7D Block1 chiuso; Block2 da iniziare. Questo intervento corregge difetti e recepisce un protocollo nelle fasi esistenti: non apre training o una nuova fase.

## Ricerca di apertura

Problemi osservati e riprodotti: metadata coverage calcolata soltanto sugli esportati; mapping dichiarato diverso dal default effettivo; residui di output su riuso cartella; incoerenze tempo/metrica CSV–MIDI non segnalate. Il launcher storico 7C Block2 mitigava i primi tre casi, quindi il batch storico non viene invalidato per deduzione.

Il protocollo owned-beats deve distinguere qualità della trascrizione, ascolto, validazione per ruolo e ammissibilità task. Fonti confrontate:

- [mir_eval](https://mir-eval.readthedocs.io/latest/api/transcription.html): matching uno-a-uno e metriche onset/pitch/offset. Il riferimento standard non diventa soglia universale di microtiming FAME.
- [scikit-learn](https://scikit-learn.org/stable/modules/cross_validation.html): separazione tuning/test e valutazione per gruppi. Sessione e performer definiscono generalizzazioni diverse.
- [RO-Crate workflows](https://www.researchobject.org/ro-crate/specification/1.2/workflows.html): relazione esplicita tra attività, input e output. Si recepiscono i concetti senza imporre l’intero standard al bootstrap.
- [GMD](https://magenta.tensorflow.org/datasets/groove): dataset e metadata di fonte; numerosità record non equivale a durata/finestre o specializzazione Trap.
- [Audacity OpenVINO](https://github.com/intel/openvino-plugins-ai-audacity): separazione basata su Demucs; cambiare frontend a parità di modello non è confronto tra algoritmi indipendenti.
- [Basic Pitch](https://github.com/spotify/basic-pitch): candidato per confronto tonale, non converter FAME già convalidato. Verificare prima export nativi dei beat proprietari.

Alternative considerate: cancellare automaticamente output preesistenti oppure rifiutarne il riuso; scelto rifiuto conservativo con nuova cartella per run. Per identità, indice ricreato dal nome oppure registro persistito; scelto registro persistito e dedup SHA256 per byte, famiglia musicale separata. Per CSV, doppia fonte modificabile oppure proiezione da JSON; scelta proiezione. Per tempo, sovrascrivere dati MIDI dal CSV oppure preservare e segnalare; scelta preservazione, con blocco export in caso di conflitto.

## Cosa cambia

- Exporter: opzioni normalizzate una volta, completeInputCoverage distinta da exportedMetadataCoverage, completeMetadataCoverage richiede tutti gli input; JSON malformato riportato come failure.
- Enricher/exporter: output separato dall’input e vuoto, senza cancellazioni automatiche. Un run fallito richiede directory nuova.
- Metadata: confronto BPM iniziale della window e metro con la view; timing MIDI conservato. Il limite 0.01 BPM è tolleranza numerica di confronto, non gate musicale. Conflitti espliciti nei metadata e rifiuto nel builder/exporter.
- Bootstrap: preview predefinita, inventario WAV/MP3, hash, ID persistenti, copie verificate, dedup esatto, JSON/CSV, lock e conservazione QA. Non converte, non analizza contenuto audio, non attribuisce famiglie.
- Documenti: protocollo W1–W10, NDR-045, fonte owned-beats candidata, blocco esplicito nelle policy training, stato corrente corretto.

## Uso bootstrap (dal repository)

Richiede Node 20 o successivo. Percorsi di esempio da sostituire con cartelle reali, disgiunte e fuori da Git:

```powershell
node .\frontend\strumenti\fame-neural-composer\owned-beats\bootstrap.js 'C:\Percorso\BeatOriginali' 'D:\FAME_NEURAL'
node .\frontend\strumenti\fame-neural-composer\owned-beats\bootstrap.js 'C:\Percorso\BeatOriginali' 'D:\FAME_NEURAL' --apply
```

La prima chiamata è preview senza scritture. La seconda inventaria e copia; gli originali non vengono rinominati o modificati. Fonte e destinazione devono essere disgiunte. I nomi derivati usano hash/ID, quindi non dipendono da titoli problematici su Windows. File non WAV/MP3 ignorati. Nessuna soglia hardcoded di 131 input.

Non modificare a mano il CSV. Non trattare i manifest bootstrap come dataset autorizzati. Interfaccia per importare decisioni familiari e QA, analisi metadata audio e conversione devono essere implementate prima del pilot. Le eventuali annotazioni già nel manifest sono preservate dal bootstrap. In caso di lock residuo, verificare prima che non sia attivo un altro processo; non forzare un secondo avvio.

## Verifiche eseguite

Comandi dalla root:

```text
node frontend/strumenti/fame-neural-composer/hardening-owned-beats-test.js
node frontend/strumenti/fame-neural-composer/phase7c-block1-smoke-test.js
node frontend/strumenti/fame-neural-composer/phase7c-block2-smoke-test.js
node frontend/strumenti/fame-neural-composer/phase7d-block1-smoke-test.js
node frontend/strumenti/fame-neural-composer/phase3-source-registry-smoke-test.js
node frontend/strumenti/fame-neural-composer/phase7a-block3-smoke-test.js
git diff --check
```

PASS in ambiente Linux/Node. Regressioni mirate: export parziale via CLI exit 1; mapping default/esplicito; riuso output rifiutato senza cancellazioni; conflitto BPM/metro; preview senza creazione workspace; duplicati byte-identici; rinomina; nuovi input e input cambiati; conservazione QA; lock; ripresa da copie già esistenti; copia corrotta rifiutata; workspace dentro fonte/Git rifiutato. Le fixture del bootstrap sono byte di test, non prove di decodifica o fedeltà audio.

La CI dedicata esegue questi test su Linux e Windows dopo il push. La verifica locale non equivale a esecuzione PowerShell nativa. La CI generale sul vecchio head aveva due failure del gioco; non si dichiarano risolte da questa patch. Il merge con main richiederà verifiche sull’albero integrato.

## Ricerca di chiusura e limiti

Le prove rispondono ai failure tecnici osservati; non producono evidenza di qualità delle trascrizioni. Le fonti di apertura sostengono tracciabilità e separazione dei gate, non convalidano le soglie musicali da definire nel pilot. L’anchoring kick–808 e i risultati V1–V9 restano circoscritti al prototipo; preservare una classe unknown se il transiente non identifica un kick distinto.

Prossimo intervento ufficiale: ricerca di apertura 7D Block2, grouping e candidate manifest; owned-beats prosegue con inventario, famiglia/export nativi e progettazione QA. Nessuna conversione di Brazy o degli altri beat eseguita da questa patch.
