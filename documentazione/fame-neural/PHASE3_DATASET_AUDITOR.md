# FAME Neural — FASE 3 Dataset Auditor

Stato: IN CORSO
Blocco corrente: BLOCCO 1 — fingerprint deterministici + split leakage-safe

## Obiettivo del blocco 1

Costruire il primo strato del Dataset Auditor senza introdurre ML o dipendenze esterne.

Il blocco 1 lavora sui `fame-neural-dataset-item-v1` già prodotti e validati dalla pipeline della FASE 2.

## Controlli implementati

### 1. Duplicati tecnici

- `itemId` duplicato;
- SHA-256 della sorgente duplicato.

Questi casi sono bloccanti.

### 2. Duplicati musicali esatti nel canonico

Ogni item riceve un fingerprint del contenuto musicale canonico basato su:

- tipo evento;
- tick;
- pitch quando presente;
- durata;
- glide 808;
- PPQ;
- BPM;
- numero di barre.

La velocity viene volutamente esclusa da questo fingerprint: due file che differiscono solo per dinamica non devono essere trattati come composizioni indipendenti.

Questi gruppi sono bloccanti finché non vengono deduplicati o revisionati.

### 3. Equivalenza per trasposizione

Per gli item con almeno 3 eventi pitched (`808`, `harmony`, `lead`) viene creato anche un fingerprint transposition-invariant.

Il fingerprint mantiene:

- ritmo;
- tipo degli eventi;
- intervalli;
- durate;
- glide;
- struttura delle sequence/segmenti;

ma normalizza tutte le note rispetto allo stesso pitch anchor dell'item.

Questo rileva copie che differiscono soltanto per trasposizione globale. I gruppi sono bloccanti finché non vengono revisionati/deduplicati.

### 4. Rhythm-review candidates

Viene prodotto un fingerprint che ignora il pitch e mantiene la struttura ritmica.

Le collisioni di questo fingerprint NON sono bloccanti nel blocco 1: servono come candidati da analizzare nel blocco fuzzy/near-duplicate successivo.

Questo evita di considerare automaticamente duplicati due pattern che condividono solo lo scheletro ritmico.

### 5. Quality flag iniziali

Il blocco segnala, senza bloccare automaticamente:

- item con troppo pochi eventi;
- item con durata inferiore alla soglia minima.

Sono flag di curation, non giudizi musicali definitivi.

## Split leakage-safe

Lo split non viene fatto item per item in modo indipendente.

Prima vengono creati componenti indivisibili unendo item collegati da:

- stessa `compositionFamily`;
- fingerprint musicale esatto;
- fingerprint equivalente per trasposizione.

Ogni componente viene poi assegnato interamente a uno solo tra:

- train;
- validation;
- test.

Il manifest verifica esplicitamente che nessuna composition family o duplicate-group conosciuta attraversi più split.

Ratio di default:

- train 80%;
- validation 10%;
- test 10%.

Su corpus piccoli la distribuzione può discostarsi dai ratio per preservare l'integrità dei componenti. La sicurezza anti-leakage ha priorità sulla percentuale esatta.

## CLI

```powershell
node .\frontend\strumenti\fame-neural-composer\dataset\auditor.js `
  <dataset-items-dir> `
  <audit-report.json> `
  <split-manifest.json> `
  [options.json]
```

Schema report:

`fame-neural-dataset-audit-v1`

Schema split:

`fame-neural-family-safe-split-v1`

## Test

```powershell
node .\frontend\strumenti\fame-neural-composer\phase3-block1-smoke-test.js
```

Il test copre:

- corpus pulito;
- duplicate canonicali esatti;
- copie trasposte;
- stessa composition family nello stesso split;
- quality flag.

## Cosa NON chiude ancora

Il BLOCCO 1 non chiude la FASE 3 e non chiude il GATE 1 — DATA READY.

Restano da costruire/verificare almeno:

- fuzzy near-duplicate con similarità graduata;
- versioni/arrangiamenti parzialmente modificati;
- duplicati di tracce/pattern interni;
- quality audit musicale più ricco;
- curation del primo corpus da circa 500–1.000 phrase;
- verifica finale train/validation/test sul corpus reale completo.

Prossimo lavoro previsto: BLOCCO 2 — near-duplicate fuzzy e similarity report.
