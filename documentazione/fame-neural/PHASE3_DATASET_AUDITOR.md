# FAME Neural — FASE 3 Dataset Auditor

Stato: IN CORSO
Blocco corrente: BLOCCO 2 — near-duplicate fuzzy + similarity report

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
