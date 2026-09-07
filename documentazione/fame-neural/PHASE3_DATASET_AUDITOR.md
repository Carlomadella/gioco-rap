# FAME Neural — FASE 3 Dataset Auditor

Stato: IN CORSO
Blocco corrente: BLOCCO 5 — corpus builder verso 500–1.000 phrase

## BLOCCO 1 — fingerprint deterministici + split leakage-safe

Il blocco 1 resta la base deterministica dell'auditor e continua a controllare:

- `itemId` e SHA-256 sorgente duplicati;
- duplicati musicali esatti nel canonico;
- equivalenza per trasposizione globale;
- collisioni rhythm-only come candidati di review;
- quality flag minimi;
- split train / validation / test per componenti indivisibili.

I componenti dello split uniscono almeno la stessa `compositionFamily`, i duplicati esatti e le equivalenze per trasposizione.

## BLOCCO 2 — similarità fuzzy

Il BLOCCO 2 aggiunge un confronto graduato tra item che non sono già stati classificati come duplicati esatti o semplici trasposizioni.

### Obiettivo

Trovare versioni che derivano probabilmente dalla stessa idea musicale anche quando presentano piccole modifiche, per esempio:

- note aggiunte o rimosse;
- timing spostato leggermente;
- pitch modificati di pochi semitoni;
- intro/outro o layer aggiuntivi;
- arrangiamenti parzialmente estesi;
- varianti che mantengono gran parte dello stesso scheletro musicale.

### Similarity score

Il confronto usa segnali separati e spiegabili:

- match degli eventi per tipo e timing con tolleranza;
- F1 ritmico;
- containment ritmico, utile per versioni estese/ridotte;
- confronto pitched transposition-invariant su `808`, `harmony` e `lead`;
- distribuzione dei tipi evento;
- vicinanza temporale/durata;
- bilanciamento della quantità di eventi e della lunghezza.

Il report non usa un embedding neurale: in questa fase vogliamo un criterio deterministico, riproducibile e ispezionabile.

### Due soglie

Default:

- `reviewThreshold = 0.78`: coppia sospetta da revisionare, NON bloccante;
- `blockingThreshold = 0.94`: near-duplicate ad alta confidenza, bloccante.

Una coppia `blocking` deve inoltre avere copertura ritmica elevata e abbastanza eventi confrontabili. Questo riduce i falsi positivi dovuti a pattern molto corti.

### Prefiltro per scala

Non vengono confrontate in dettaglio tutte le coppie in modo cieco.

Prima del matching completo vengono usati:

- similarità della distribuzione dei tipi;
- Jaccard di uno sketch ritmico quantizzato;
- rapporto minimo tra le quantità di eventi.

Il limite `maxPairComparisons` rende esplicito quando un audit non è stato esaustivo. Un similarity report troncato NON può dare `BLOCCO 2 READY`.

## Split leakage-safe aggiornato

I near-duplicate fuzzy ad alta confidenza vengono aggiunti ai componenti indivisibili dello split.

Quindi due item marcati `blocking` dal BLOCCO 2 devono restare nello stesso split, anche se:

- hanno SHA differenti;
- appartengono a `compositionFamily` differenti;
- non sono copie esatte;
- non sono semplici trasposizioni.

Le coppie `review` vengono invece riportate senza unirle automaticamente: richiedono curation prima di diventare una regola bloccante.

## Output

Il report principale resta:

`fame-neural-dataset-audit-v1`

Il BLOCCO 2 aggiunge:

- `block2Ready`;
- `fuzzyComparedPairs`;
- `fuzzyReviewPairs`;
- `fuzzyBlockingPairs`;
- `duplicates.fuzzyNearDuplicates` con schema `fame-neural-fuzzy-similarity-v1`.

## CLI

```powershell
node .\frontend\strumenti\fame-neural-composer\dataset\auditor.js `
  <dataset-items-dir> `
  <audit-report.json> `
  <split-manifest.json> `
  [options.json]
```

## Test

BLOCCO 1:

```powershell
node .\frontend\strumenti\fame-neural-composer\phase3-block1-smoke-test.js
```

BLOCCO 2:

```powershell
node .\frontend\strumenti\fame-neural-composer\phase3-block2-smoke-test.js
```

Il test BLOCCO 2 verifica:

- corpus realmente diverso non segnalato;
- tier `review` per variante fuzzy;
- variante/arrangiamento parziale ad alta confidenza bloccato;
- near-duplicate bloccante tenuto nello stesso split;
- guardia contro il falso positivo "stesso ritmo ma melodia diversa".

## Cosa NON chiude ancora

Il BLOCCO 2 non chiude la FASE 3 e non chiude il GATE 1 — DATA READY.

Restano almeno:

- duplicati di tracce/pattern interni allo stesso item;
- quality audit musicale più ricco;
- strategia di curation/review dei candidati fuzzy;
- costruzione del primo corpus da circa 500–1.000 phrase;
- verifica finale di dedup e leakage sul corpus reale completo.

Prossimo lavoro previsto: BLOCCO 3 — duplicati interni + quality audit musicale.

## BLOCCO 3 — duplicati interni + quality audit musicale

Il BLOCCO 3 aggiunge un controllo interno a ogni dataset item.

### Duplicate-layer ad alta confidenza

L'auditor cerca eventi canonici perfettamente sovrapposti e valuta il sospetto di una traccia/layer duplicato usando insieme:

- numero di eventi duplicati in eccesso;
- numero di chiavi evento duplicate distinte;
- presenza del problema su almeno due tipi evento;
- rapporto tra duplicati e numero totale di eventi.

Il caso diventa bloccante solo oltre soglie conservative. Questo evita di classificare automaticamente come errore una singola collisione di articolazioni drum o un flam.

### Ripetizione interna delle barre

Ogni barra riceve una firma relativa alla propria posizione.

Se la stessa barra copre una quota molto alta dell'item, viene emesso un flag di review musicale. Non e' bloccante: nella Trap la ripetizione intenzionale e' normale e va giudicata nel contesto.

### Quality review aggiuntiva

Il report segnala inoltre:

- densita' estrema di eventi in una singola barra;
- range pitched eccezionalmente ampio;
- note melodiche saltate dal track classifier;
- molte barre completamente vuote.

Questi segnali sono di curation, non verdetti musicali.

### Output

Il report principale aggiunge:

- `block3Ready`;
- `internalQuality` con schema `fame-neural-internal-quality-v1`;
- `internalDuplicateBlockingItems`;
- `repeatedBarReviewItems`;
- `internalQualityReviewItems`.

Il BLOCCO 3 resta compatibile con i controlli e gli split leakage-safe dei blocchi precedenti.

### Test

```powershell
node .\frontend\strumenti\fame-neural-composer\phase3-block3-smoke-test.js
```

Il test verifica:

- item interno pulito;
- duplicate-layer sintetico bloccante;
- ripetizione di barra segnalata ma non bloccante;
- note melodiche saltate segnalate come review;
- separazione corretta tra `block2Ready` e `block3Ready`.

## Cosa NON chiude ancora

Il BLOCCO 3 non chiude la FASE 3 e non chiude il GATE 1 — DATA READY.

Restano soprattutto:

- policy di curation/review dei candidati fuzzy e quality flag;
- costruzione del primo corpus reale da circa 500–1.000 phrase;
- audit finale del corpus;
- split train/validation/test definitivo e leakage check finale.

Prossimo lavoro previsto: BLOCCO 4 — curation policy + corpus manifest.

## BLOCCO 4 — curation policy + corpus manifest

Il BLOCCO 4 trasforma i risultati tecnici dell'auditor in una politica di curation riproducibile.

### Disposition automatiche

Ogni dataset item riceve uno stato esplicito:

- `accepted`: item pulito e automaticamente ammissibile;
- `hold`: richiede review o risoluzione di una relazione con altri item;
- `rejected`: escluso con decisione esplicita;
- `blocked`: difetto assoluto che non puo' essere accettato con una semplice review.

I quality flag e i fuzzy-review non vengono auto-accettati: entrano nella review queue.

### Duplicati relazionali

Duplicati di sorgente, contenuto musicale, trasposizioni e fuzzy near-duplicate ad alta confidenza vengono trattati come relazioni.

La policy permette di scegliere un keeper solo se tutti i peer collegati vengono esplicitamente `reject`.

Questo evita sia di buttare via automaticamente entrambe le versioni sia di far entrare due copie nello stesso corpus.

### Blocchi assoluti

Un item con errore strutturale/invalidita' o duplicate-layer interno ad alta confidenza non puo' essere forzato in `accepted`.

Va corretto a monte oppure escluso.

### Decisioni manuali

Formato:

`fame-neural-curation-decisions-v1`

Per accettare un item che aveva segnali di review servono:

- reviewer;
- reason;
- decisione esplicita.

### Corpus manifest

Il BLOCCO 4 produce:

`fame-neural-curated-corpus-manifest-v1`

Il manifest contiene solo item `accepted`, con snapshot di provenance e split leakage-safe ricalcolato sul sottoinsieme realmente accettato.

Produce anche:

`fame-neural-curation-review-queue-v1`

per gli item ancora in `hold`.

### Gate

`block4Ready` significa che la policy e il manifest sono stati costruiti senza errori di decisione o audit globale incompleto.

NON equivale a GATE 1 DATA READY.

Il report separa:

- `curationComplete`;
- `trainingSubsetReady`;
- `manifest.targetReached`;
- `gate1Candidate`.

Con il target attuale, `gate1Candidate` richiede anche almeno 500 phrase curate e nessun hold/block residuo.

### Test

```powershell
node .\frontend\strumenti\fame-neural-composer\phase3-block4-smoke-test.js
```

Il test copre:

- auto-accept di corpus pulito;
- review -> hold;
- accept manuale con reviewer/reason;
- impossibilita' di accettare un blocco assoluto;
- scelta di un keeper in un gruppo duplicato relazionale;
- ri-audit del sottoinsieme accepted e split leakage-safe.

## Cosa NON chiude ancora

Il BLOCCO 4 non chiude la FASE 3 e non chiude GATE 1 — DATA READY.

La parte infrastrutturale di dedup, quality audit, split e curation e' ora predisposta. Resta soprattutto da costruire il primo corpus reale in scala e portarlo al target operativo della roadmap.

Prossimo lavoro previsto: BLOCCO 5 — corpus builder e bootstrap verso 500–1.000 phrase.

## BLOCCO 5 — corpus builder verso 500–1.000 phrase

Il BLOCCO 5 introduce il primo builder dedicato alle phrase di training.

### Perche' un nuovo livello

Un dataset item rappresenta una sorgente MIDI importata e conserva provenance/rights.

Una phrase e' invece un esempio derivato da 4, 8 o 16 barre. Non viene finta come nuova sorgente: mantiene sempre il riferimento al dataset item originale e al suo SHA.

Schema:

`fame-neural-phrase-item-v1`

### Estrazione

Il builder:

- usa solo sorgenti commercial-training-cleared;
- puo' essere filtrato dal manifest di curation BLOCCO 4;
- supporta phrase da 4/8/16 barre;
- evita phrase parziali;
- taglia correttamente eventi che attraversano il confine della phrase;
- non concatena clip indipendenti per gonfiare artificialmente il corpus;
- preserva composition family, licenza, creator e source SHA.

Il bootstrap GMD usa inizialmente phrase da 4 barre non sovrapposte per massimizzare il numero di esempi senza creare finestre quasi identiche.

### Phrase-level audit

Le phrase vengono ri-auditate separatamente dalle sorgenti.

Il report:

`fame-neural-phrase-corpus-audit-v1`

controlla:

- phraseId duplicati;
- duplicati musicali esatti;
- equivalenza per trasposizione;
- fuzzy near-duplicate;
- duplicate-layer interni;
- quality review;
- source leakage;
- composition-family leakage;
- split train/validation/test.

Le phrase derivate dalla stessa composition family restano nello stesso split.

### Target e gate

Il report distingue:

- `block5Ready`: tooling phrase-level completo e leakage-safe;
- `corpusClean`: nessun duplicato bloccante rilevato;
- `reviewComplete`: nessun item ancora da revisionare;
- `targetReached`: almeno 500 phrase valide;
- `gate1Candidate`: tutte le condizioni sopra soddisfatte.

`gate1Candidate` e' una candidatura tecnica, non chiude automaticamente GATE 1.

### Bootstrap GMD reale

`bootstrap-gmd-phase3.ps1` riusa la pipeline GMD della FASE 2 invece di duplicare downloader/importer/provenance.

Pipeline:

GMD real MIDI
-> FASE 2 importer/provenance
-> source curation BLOCCO 4
-> accepted sources only
-> 4-bar phrase builder
-> phrase-level audit
-> leakage-safe split
-> inventory verso target 500

Il default del test di integrazione usa 12 sorgenti reali per restare veloce. Lo stesso comando puo' essere scalato aumentando `SourceCount`.

### Test

```powershell
node .\frontend\strumenti\fame-neural-composer\phase3-block5-smoke-test.js
```

Copre:

- clipping corretto ai confini;
- filtro tramite curation manifest;
- generazione phrase 4-bar;
- split senza source leakage;
- rilevamento duplicati phrase;
- separazione tra tooling READY e corpus/target non ancora pronti.

## Cosa NON chiude ancora

BLOCCO 5 non dichiara artificialmente DATA READY.

Il prossimo passo e' usare il builder in scala, leggere il vero rendimento GMD e integrare altre fonti commercialmente compatibili/originali fino a ottenere 500–1.000 phrase curate, non semplicemente 500 finestre generate.

Prossimo lavoro previsto: BLOCCO 6 — scale run + corpus mix policy + GATE 1 finale.
