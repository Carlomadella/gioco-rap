# FAME Neural — controllo approfondito del 13 settembre 2026

## Esito

**La protezione del nuovo holdout è migliorata, ma il branch non supera la CI Neural e non è ancora pronto per la valutazione finale completa o per il training di prodotto.** È confermato un errore d'integrazione dei test; restano tre difetti già identificati. La nuova reference cieca aggiunge una fase concreta al percorso holdout, ma non completa l'esecuzione e il confronto finale V1/V2.

Repository: `Carlomadella/gioco-rap`, branch `feature/fame-neural-roadmap`. Commit verificato: [`9e80a53e6be482f5bce279c4affe5ecb4c433817`](https://github.com/Carlomadella/gioco-rap/commit/9e80a53e6be482f5bce279c4affe5ecb4c433817), «fix(neural): rende robusta UI cieca holdout R1».

Confronto con l'audit precedente sul commit `00c459e`: 8 file modificati, concentrati su R1, reference cieca e documentazione. I riscontri sono riferiti al remoto verificato, non alla patch preparata localmente in precedenza.

## Riscontri prioritari

### 1. Alta — CI Neural bloccata da una chiamata obsoleta nel test

`frontend/strumenti/fame-neural-composer/owned-beats-candidate-freeze-test.py`, riga 69, invoca ancora `reserve_holdout(root, verified, records)`. La nuova funzione in `owned-beats/candidate_freeze.py`, riga 221, richiede anche il riferimento congelato e i digest di configurazione, protocollo e riferimento.

Errore riprodotto localmente e identico nel log GitHub:

```text
RuntimeError: R1 hardened reservation requires frozen cohort reference
Ran 2 tests
FAILED (errors=1)
```

La [CI Neural del commit](https://github.com/Carlomadella/gioco-rap/actions/runs/34699261499) fallisce nel [job audio-analysis](https://github.com/Carlomadella/gioco-rap/actions/runs/34699261499/job/103568004239), step «Candidate freeze integrity». Sono saltati gli step successivi, compreso il test holdout, l'installazione della stack audio e le regressioni audio. I job Neural Linux, Windows e browser development sono verdi.

**Correzione:** aggiornare fixture e chiamata al contratto R1, mantenendo un test negativo che respinga l'API legacy. Non indebolire la funzione per far passare il vecchio test. Rieseguire poi il job audio completo: gli step saltati non sono verificati da questa run.

### 2. Media — Drum View rifiuta finestre metricamente stabili

`dataset/drum-view-v2.js`, `resolveWindow()`, riga 117, chiama `stableMeterForWindow(sourceFidelity, 0, Number.MAX_SAFE_INTEGER)` prima di risolvere la finestra richiesta.

Riproduzione: PPQ 960, metro 4/4 da tick 0, cambio a 3/4 al tick 10000, finestra esplicita `[0,7680)`. Il controllo locale della finestra restituisce correttamente 4/4; `resolveWindow()` la respinge per il cambio esterno. Il file è invariato rispetto all'audit precedente.

**Correzione:** ricavare il metro attivo all'inizio e verificare i cambi soltanto nell'intervallo selezionato. Per `startBar`, definire e testare il conteggio delle battute attraverso i cambi di metro.

### 3. Media — `trainingReady` esprime una condizione insufficiente

`dataset/task-admissibility.js`, `readinessForTask()`, righe 318–322: basta `allowed > 0`. Riprodotto:

```js
readinessForTask({trainingTask:true}, {allowed:1})
// {taskReady:true, trainingReady:true}
```

Non vengono controllati split, quantità, diversità o altri requisiti del dataset. Il risultato arriva anche al report di esportazione. Questo non dimostra l'avvio automatico di un training: rende però ambigua una dichiarazione usata dagli operatori.

**Correzione:** separare l'esportabilità dei record dalla readiness del training, valutata da un gate dedicato; in assenza di quella valutazione non dichiarare `true`.

### 4. Media, benchmark storico — codec derivati da tutti gli split

`phase5/microtrain.py`, `train_one()`, dalla riga 421: `TokenCodec` e `CompoundCodec` vengono costruiti da `records["all"]`; il batcher usa invece `records["train"]`.

È esposizione del preprocessing ai dati validation/test, non prova di ottimizzazione sui loro target. Il codice è invariato e il debito è riconosciuto anche dalla documentazione.

**Correzione:** vocabolario specificato indipendentemente dai dati oppure fit sul train con gestione esplicita degli elementi sconosciuti. Non usare il vecchio benchmark per nuove conclusioni prima di correggere e rieseguire il protocollo.

### 5. Media, condizionale — i registri holdout legacy non provano l'assenza di riuso degli asset

`owned-beats/audio-analysis-holdout-gate.py`, `prior_identity_sets()` dalla riga 402, e l'omonima funzione in `candidate_freeze.py` accettano registrazioni contenenti soltanto `families`. Gli insiemi di record, asset e SHA mancanti diventano vuoti.

Riproduzione sintetica: un registro legacy con etichette family differenti non impedisce né il controllo di uso precedente né la nuova reservation completa. Il registro non contiene l'informazione necessaria per escludere che gli asset siano gli stessi.

**Limite del riscontro:** non è stato dimostrato alcun riuso reale del nuovo cohort. Le reservation nuove, complete, proteggono anche da rinomine delle family. La lacuna riguarda la migrazione da uno storico incompleto.

**Correzione:** bloccare gli storici insufficienti o richiedere una riconciliazione verificabile con le identità complete. Conservare l'evidenza della migrazione.

### 6. Media — copertura CI della nuova interfaccia incompleta

`owned-beats/human-reference-holdout-pack-test.js` passa localmente, ma non è richiamato dal workflow Neural. Il job browser verde esegue `owned-beats-human-reference-browser-test.js`, relativo al development.

Il nuovo test controlla metadati, preflight sintetico, blind ID, stringhe HTML e una reservation incoerente. Non esercita in browser navigazione, ascolto, compilazione, export e finalizzazione del pack holdout.

Controllo aggiuntivo eseguito: lo script HTML generato è sintatticamente valido; `renderList()` genera correttamente gli attributi dei pulsanti. Non è emerso un difetto di escaping. Questa verifica non sostituisce un test d'interazione.

**Correzione:** includere il test nuovo nella CI e aggiungere un percorso browser sintetico per il pack holdout, senza usare il corpus reale.

## Cosa è stato corretto rispetto a R1 precedente

Il riferimento `audio-analysis-holdout-cohort-r1-v2.json` introduce un **nuovo cohort sostitutivo**, non il recupero delle identità storiche originali. Contiene dieci tuple complete `compositionFamilyId / sourceRecordId / sourceAssetId / sha256` e il digest:

```text
887ac3aee76ac65b710381bc428bd8bb7cd5708e94a4dbd9449dbea9386866e6
```

Il gate confronta esattamente le identità con il riferimento e controlla duplicazioni di record/asset/SHA nel manifest. Le nuove reservation legano cohort, freeze, configurazione e protocollo. Il vecchio holdout è marcato come insufficiente per provenienza e non utilizzabile come holdout finale. Le 13 regressioni del gate passano localmente.

Il JSON dichiara una selezione da 113 family eleggibili, senza audio o metriche derivate. **La condizione “mai osservato” non è stata certificata indipendentemente:** mancano qui il manifest operativo completo e lo storico reale di processamento/QA/accessi. I digest nel repository identificano gli artefatti dichiarati, ma da soli non provano la loro storia operativa.

## Percorso finale e documentazione

`human-reference-holdout-pack.js` aggiunge preflight, ricevuta prima della lettura audio, preparazione cieca, check e finalizzazione della reference. Questo chiude una parte del precedente R6.

Resta da collegare la valutazione finale V1/config-001 e il confronto sotto la stessa reservation. Il comparator presente, `audio-analysis-v2-compare.py`, mantiene run ID development, output `split: development` e vincoli `holdoutObserved: false`: non è un orchestratore finale holdout.

L'addendum prevalente di `CURRENT_STATE.md` dice ancora che manca il collegamento alle identità e richiede di recuperare il cohort originale. Non descrive la strategia sostitutiva R1 v2 né la nuova reference cieca. Serve un checkpoint corrente che distingua vecchio holdout escluso, nuovo cohort, reservation, osservazione, reference e scoring. Conservare l'audit precedente come storico con la sua base esplicita.

## Verifiche e limiti

| Controllo locale aggiornato | Esito |
|---|---|
| Candidate freeze | Fallisce: 1 errore su 2 test |
| Gate holdout R1 | 13 test superati |
| Nuovo pack holdout | Superato |
| Pack development | Superato |
| Smoke Phase 7C blocchi 1 e 2, Phase 7A blocco 3 | Tutti superati |
| Riproduzioni Drum View e readiness | Difetti confermati |
| Registro legacy sintetico | Lacuna informativa confermata |
| Sintassi dell'intero modulo | 141 JavaScript e 22 Python senza errori |
| Stato Git finale | Pulito, sul commit verificato |

Questa verifica aggiorna l'audit precedente con lettura delle modifiche, controlli mirati dei percorsi critici e test locali. Non è una revisione riga per riga di tutta la repository. Non sono stati rieseguiti training, metriche musicali, stack audio completa o il workflow generale del gioco. Anche la [CI gioco sul commit](https://github.com/Carlomadella/gioco-rap/actions/runs/34699261599) risulta fallita; la sua causa non è attribuita a Neural in questo rapporto.

Nessun audio reale letto e nessuna reservation del vero holdout creata. Nessuna modifica o push al repository durante questo aggiornamento dell'audit. La patch locale precedente è basata su `00c459e` e adotta un'altra soluzione R1: va riconciliata con il nuovo remoto prima di un eventuale utilizzo.

**Ordine operativo:** riparare la CI; completare la copertura del nuovo pack e la gestione dello storico; allineare il checkpoint R1; chiudere il percorso di scoring finale; correggere Drum View, readiness e preprocessing prima delle rispettive attività di espansione e training.
