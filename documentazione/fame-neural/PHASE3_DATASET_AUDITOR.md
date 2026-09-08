# FAME Neural — FASE 3 Dataset Auditor

Stato: IN CORSO
Blocco corrente: COMMERCIAL MIX V1 — FAME Original + free-midi-chords MIT

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

## BLOCCO 6 — scale run + corpus mix policy + GATE 1

Il BLOCCO 6 rende esplicito un punto importante: 500 phrase non bastano se sono 500 esempi dello stesso tipo.

GMD e' molto utile per il groove/drumming, ma un corpus GMD-only non puo' chiudere DATA READY per un composer che deve imparare anche 808, harmony e lead.

### Corpus inventory

Nuovo schema:

`fame-neural-corpus-inventory-v1`

L'inventory misura:

- numero di phrase;
- composition family;
- dataset item sorgente;
- source collection;
- licenze;
- distribuzione 4/8/16 barre;
- copertura drums / 808 / harmony / lead;
- phrase pitched;
- rights commercial-training.

### Mix policy

La policy iniziale e' configurabile e non pretende di essere una legge musicale universale.

Default operativo per il primo corpus:

- almeno 500 phrase;
- almeno 50 composition family;
- almeno 2 source collection;
- nessuna source collection oltre il 65%;
- almeno 150 phrase drums;
- almeno 75 phrase 808;
- almeno 75 phrase harmony;
- almeno 75 phrase lead;
- almeno 150 phrase con contenuto pitched.

Queste soglie servono a impedire che il gate venga superato gonfiando un solo dataset o una sola famiglia di eventi.

Verranno rivalutate quando avremo il primo benchmark del modello.

### GATE 1 finalizer

Nuovo schema:

`fame-neural-data-ready-gate-v1`

Il gate richiede insieme:

- BLOCCO 5 tooling READY;
- corpus phrase clean;
- review completata;
- split leakage-safe;
- nessun source leakage;
- rights commercial-training puliti;
- target phrase;
- diversita' minima di composition family;
- mix di source collection;
- copertura minima dei ruoli musicali.

Il gate produce sempre un elenco esplicito di blocker.

### GMD scale runner

`run-gmd-gate1.ps1` permette di aumentare `SourceCount` e misurare il contributo reale di GMD.

Un risultato GMD-only `NOT READY` non e' un fallimento del tooling: e' il comportamento corretto se mancano 808/harmony/lead o diversita' di sorgente.

### Stato dopo BLOCCO 6

La parte tecnica necessaria per dichiarare DATA READY e' ora definita e automatizzabile.

GATE 1 resta aperto finche' il corpus reale non soddisfa la policy.

Il prossimo lavoro non e' aggiungere altri controlli artificiali: e' alimentare il corpus con materiale Trap/Rap originale o con training commerciale esplicitamente autorizzato, poi eseguire il gate sul mix reale.

Prossimo lavoro previsto: SOURCE EXPANSION — materiale Trap originale/cleared + scale run finale.

## SOURCE EXPANSION — intake Trap/Rap originale o cleared

Dopo BLOCCO 6 il collo di bottiglia e' il contenuto, non altri gate.

Il nuovo source intake accetta directory locali ricorsive e separa automaticamente:

- `commercial-cleared`;
- `analysis-only`;
- `missing-provenance`;
- `invalid-provenance`.

Solo `commercial-cleared` viene copiato nello staging di training.

### Regola rights

Un MIDI non diventa utilizzabile per training soltanto perche' e' stato acquistato o scaricato legalmente.

Per passare lo staging servono i campi di provenance gia' definiti dalla FASE 2 e:

- `commercialTrainingAllowed = true`;
- `commercialOutputAllowed = true`;
- origin type non `third_party_unknown`;
- rights evidence esplicita.

Quindi pack commerciali con licenza ML non esplicita restano analysis/reference-only finche' non otteniamo un'autorizzazione chiara.

### Materiale originale / commissionato

Il template:

`source-intake-template.provenance.json`

puo' essere duplicato accanto ai MIDI originali o commissionati.

La `compositionFamily` deve restare uguale tra versioni/arrangiamenti dello stesso brano.

### Runner end-to-end

`run-source-expansion.ps1` esegue:

source folder
-> recursive rights intake
-> commercial staging
-> batch MIDI import
-> source curation
-> phrase builder
-> phrase audit
-> DATA READY gate

I file analysis-only o senza provenance non vengono cancellati: restano semplicemente fuori dallo staging di training.

### Stato operativo

La pipeline FASE 3 e' ora pronta a ricevere materiale Trap/Rap originale o con permesso ML commerciale esplicito.

GATE 1 resta aperto fino a quando il mix reale non raggiunge quantita', diversita', coverage e leakage requirements del BLOCCO 6.

## COMMERCIAL MIX V1 — FAME Original + free-midi-chords MIT

La prima espansione pitched commercialmente pulita usa due source collection complementari.

### FAME Original Seed V1

`generate-fame-original-seed.js` crea sketch originali multitraccia con drums, 808, harmony e lead.

Il seed e' deterministico, non legge MIDI/loop/sample di terzi e viene marcato come materiale originale FAME.

Serve come bootstrap tecnico e pitched, non come sostituto del corpus reale.

### free-midi-chords

Fonte:

`ldrolez/free-midi-chords`

Release fissata:

`v0.20260314`

Asset:

`free-midi-chords-20260314.zip`

SHA-256 fissato:

`d50d4cb3eb0f1bc6304c4bb0b3d8cacc1bfd7f670fe499f0e74facb30246d93f`

Licenza:

`MIT`

Il runner verifica sempre l'hash prima di usare l'archivio.

### Policy di selezione

Non importiamo tutte le migliaia di trasposizioni.

`select-free-midi-chords.js` usa soltanto:

- Progression / Minor;
- Progression / Modal;
- hiphop2 style;
- soul style;
- pop2 style.

Le versioni della stessa progressione in tonalita' differenti vengono raggruppate nella stessa `compositionFamily`.

Per ogni progression family viene selezionata una sola trasposizione rappresentativa, scelta deterministicamente.

Default:

`maxFamilies = 96`

Questo evita di gonfiare il dataset con copie trasposte dello stesso pattern.

### Attribution

Ogni MIDI selezionato riceve provenance commerciale con:

- repository;
- release;
- SHA-256 asset;
- MIT license;
- composition family;
- SHA del MIDI selezionato.

Nel workspace viene inoltre conservato `LICENSE.free-midi-chords.txt`.

### Pipeline combinata

`run-commercial-mix-v1.ps1` esegue:

free-midi-chords official release
-> SHA-256 verify
-> extract
-> family dedup / style selection
-> provenance
-> source expansion

FAME Original Seed
-> source expansion

poi:

accepted phrases
-> combined phrase corpus
-> dedup/fuzzy/quality audit
-> leakage-safe split
-> Gate 1 inventory
-> blocker residui

Il mix NON forza DATA READY.

Il Gate 1 resta l'unica autorita' per quantita', source diversity, role coverage, rights e leakage.

### Fonti escluse dal training

Restano reference-only finche' i diritti non cambiano:

- Cymatics con permesso ML non esplicito;
- The Magic of MIDI;
- josephding23/Free-Midi-Library.

Non vengono usate per gonfiare il corpus commerciale.

### Nota Windows recovery

Estrazione Windows: `tar.exe` invece di `Expand-Archive`, per evitare i problemi gia' incontrati con ZIP MIDI e path profondi.


## FREE-MIDI-CHORDS SOURCE-SPECIFIC REVIEW

Il primo run reale ha mostrato un caso previsto ma non ancora codificato: 96/96 item free-midi-chords sono entrati in HOLD durante la curation.

La causa non e' un rights block e non e' un errore di import:

- 96/96 commercial-cleared;
- 96/96 technical-ready;
- 0 blocked;
- review queue 96.

free-midi-chords e' un dataset di progressioni armoniche generate con un piccolo insieme di pattern ritmici dichiarati. Quindi collisioni rhythm-only e alta ripetizione di barra possono essere caratteristiche strutturali attese della fonte, non prova sufficiente di duplicazione musicale.

La policy generale di curation NON viene allentata.

`review-free-midi-chords.js` puo' auto-accettare soltanto HOLD della source `free-midi-chords` quando:

- non esiste alcun relational blocker;
- tutti i segnali sono `RHYTHM_REVIEW_GROUP`;
- oppure `QUALITY_REVIEW` esclusivamente per `ripetizione barre elevata`.

Qualsiasi fuzzy blocker, exact/transposition relation, pitch-range estremo, melodic note skipped o altro segnale non previsto resta in review e blocca l'auto-policy.

`run-source-expansion.ps1` accetta ora opzionalmente `-AutoReviewScript`. Senza parametro il comportamento precedente resta invariato.

Il COMMERCIAL MIX usa questa policy solo per free-midi-chords; FAME Original e le altre fonti continuano con la curation standard.


## FREE-MIDI-CHORDS REVIEW RESOLUTION V2

Il run reale del COMMERCIAL MIX ha mostrato 96/96 free-midi-chords in HOLD, con rights/import corretti.

La review source-specifica V2 non bypassa piu' i segnali sconosciuti.

Policy:

- `RHYTHM_REVIEW_GROUP`: segnale strutturale atteso, puo' essere accettato;
- `QUALITY_REVIEW` per sola alta ripetizione barre: atteso, puo' essere accettato;
- `FUZZY_REVIEW_PAIR`: costruisce un grafo di conflitto e mantiene un sottoinsieme deterministico di keeper, rifiutando i peer conflittuali;
- exact/transposition/fuzzy blocking relation: un solo keeper per gruppo, peer rifiutati;
- quality/review signal non previsto: item rifiutato, mai auto-accettato.

Quindi la curation generale resta severa e la source policy risolve automaticamente soltanto cio' che e' spiegabile dalla struttura nota di free-midi-chords.


## PHRASE REVIEW — chiusura review esplicita

Il COMMERCIAL MIX ha raggiunto un corpus clean e leakage-safe, ma il Gate 1 restava bloccato da `review phrase non completata`.

La causa era architetturale: `phrase-corpus.js` rilevava quality/fuzzy review ma non disponeva di un canale per registrare una decisione esplicita.

La pipeline ora separa:

1. audit iniziale;
2. phrase review;
3. corpus reviewed;
4. re-audit con decisioni;
5. Gate 1.

### Policy

`phrase-review.js` e' conservativo:

- `HIGH_BAR_REPETITION` su `free-midi-chords`: puo' essere accettato con decisione esplicita e reason, perche' la fonte e' un corpus strutturato di progressioni armoniche;
- fuzzy review pair: non viene ignorato; viene mantenuto un sottoinsieme deterministico senza coppie conflittuali;
- altri quality review, inclusi pitch range estremo, note melodiche saltate, densita' estrema o molte barre vuote: reject.

Le phrase rifiutate vengono escluse dal corpus reviewed.

`phrase-corpus.js` supporta ora un quinto argomento opzionale `review-decisions.json`. Un item in review e' considerato risolto solo con reviewer e reason espliciti. Un reject ancora presente nel corpus continua a impedire `reviewComplete`.

Il Gate 1 continua quindi a usare `reviewComplete` come blocker reale; non viene forzato a true.
