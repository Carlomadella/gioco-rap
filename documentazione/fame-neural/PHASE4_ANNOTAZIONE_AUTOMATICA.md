# FAME Neural — FASE 4 / Annotazione musicale automatica

Data avvio: 8 settembre 2026
Stato: COMPLETATA — ANNOTATORE V1 CONGELATO DOPO REVIEW UMANA

## Obiettivo

Arricchire le phrase del corpus FAME Neural con descrittori musicali deterministici e machine-readable prima di scegliere la rappresentazione neurale.

Le annotazioni non sostituiscono gli eventi canonici e non modificano i file `fame-neural-phrase-item-v1`: vengono prodotte come sidecar separati con schema `fame-neural-musical-annotation-v1`.

## Blocco 1 — annotatore deterministico

Implementato in:

- `frontend/strumenti/fame-neural-composer/annotation/annotator.js`;
- `frontend/strumenti/fame-neural-composer/annotation/annotate-corpus.js`;
- `frontend/strumenti/fame-neural-composer/phase4-annotation-smoke-test.js`.

Il primo annotatore produce, a livello globale e/o per barra:

- `energy`;
- `density`;
- `vocalSpace`;
- `tension`;
- phrase boundaries;
- transition strength;
- motif families;
- motif return / variation;
- harmonic plan;
- 808 contour;
- kick↔808 relation;
- hat density / rolls;
- rhythmic syncopation;
- harmony coverage.

## Regola semantica

Questi valori sono **stime euristiche automatiche**, non verità musicali e non label umane.

Ogni annotazione dichiara:

- `method.id = fame-neural-auto-annotator-v1`;
- `method.deterministic = true`;
- `method.supervision = heuristic-unsupervised-estimate`;
- confidence esplicita per le famiglie principali di feature.

Le future fasi di training non devono interpretare automaticamente un valore euristico come ground truth.

## Scelte tecniche principali

- nessuna dipendenza esterna;
- calcolo PPQ-aware e compatibile con phrase da 4/8/16 barre;
- ordine eventi stabile prima dell'analisi;
- output deterministico;
- validazione di schema e range normalizzati `[0,1]`;
- motif fingerprint quantizzato e pitch-relative per separare ritorno esatto e variazione;
- root armonica marcata esplicitamente come **stimata**, non come analisi armonica definitiva;
- relazione kick↔808 misurata con coincidenza, prossimità temporale e lag;
- roll hi-hat rilevati come sequenze ravvicinate, senza imporre regole legacy al Neural.

## Verifica sul corpus reale Gate 1

Corpus usato: il corpus finale FASE 3 già verificato, 504 phrase.

Run completa:

- phrase scoperte: **504**;
- annotazioni prodotte: **504**;
- fallite: **0**;
- phrase con 808: **101**;
- phrase con relazione kick↔808 disponibile: **75**;
- motif return rilevati: **168**;
- motif variation rilevate: **591**.

Distribuzione globale iniziale:

| Feature | Mean | Stddev | Min | Max |
| --- | ---: | ---: | ---: | ---: |
| energy | 0.324830 | 0.256960 | 0.027385 | 0.833033 |
| density | 0.431571 | 0.232172 | 0.054770 | 0.879791 |
| tension | 0.194488 | 0.130108 | 0.000000 | 0.537440 |
| vocalSpace | 0.744437 | 0.124227 | 0.479479 | 0.970000 |
| transitionStrength | 0.118064 | 0.041490 | 0.003881 | 0.301479 |
| kick808RelationStrength | 0.062642 | 0.179821 | 0.000000 | 1.000000 |

### Sanity check per sorgente

Media delle feature principali sul corpus reale:

| Source collection | Phrase | Energy | Density | Tension | Vocal space |
| --- | ---: | ---: | ---: | ---: | ---: |
| fame-original-seed-v1 | 48 | 0.7205 | 0.7580 | 0.3253 | 0.5203 |
| free-midi-chords | 2 | 0.0540 | 0.1080 | 0.3274 | 0.7172 |
| gmd-v1.0.0 | 57 | 0.6085 | 0.6520 | 0.2327 | 0.9255 |
| hiphopdrummer | 49 | 0.7109 | 0.7581 | 0.1971 | 0.8287 |
| pdmx-v2025 | 218 | 0.1886 | 0.3202 | 0.1021 | 0.7208 |
| waivops-nrg-cp | 130 | 0.1415 | 0.2830 | 0.2814 | 0.7561 |

Questi valori non sono ancora un benchmark di qualità musicale: servono come prima verifica che l'annotatore produca distribuzioni non collassate e distingua materiale con profili strutturali diversi.

## Determinismo verificato

Due annotazioni complete indipendenti delle stesse 504 phrase hanno prodotto lo stesso manifest SHA-256:

`bb540e5103c6f0b79c688af59ec74b47c83282592cdc45a0e0c461a4e025aa89`

Nota: questo manifest è relativo alla procedura di verifica locale del Blocco 1 e serve come evidenza di determinismo dell'output, non come identificatore permanente del dataset.

## Limiti intenzionali del Blocco 1

- energy/tension/vocalSpace sono proxy simbolici, non misure percettive;
- il piano armonico non sostituisce un chord recognizer completo;
- motif similarity usa una metrica semplice e interpretabile;
- transition strength confronta barre adiacenti e non conosce ancora sezioni di forma lunga;
- l'affidabilità musicale non è ancora validata su campioni umani stratificati.

## Blocco 2A — QA automatico stratificato COMPLETATO

Implementato in:

- `frontend/strumenti/fame-neural-composer/annotation/qa.js`;
- `frontend/strumenti/fame-neural-composer/phase4-qa-smoke-test.js`;
- `frontend/strumenti/fame-neural-composer/run-phase4-qa-v1.js`.

Verifica sul corpus reale Gate 1:

- annotazioni QA: **504**;
- sorgenti: **6**;
- violazioni invarianti: **0**;
- campione stratificato per revisione: **52**;
- decisione automatica: **HUMAN_REVIEW_REQUIRED**.

Il QA controlla coerenza tra metriche globali e barre, boundary, transizioni, motif family, kick↔808, duplicati, distribuzioni/quantili per sorgente e casi estremi. Produce inoltre un campione deterministico per la revisione musicale.

## Blocco 2B — review umana COMPLETATA

La review V2 ha ridotto il campione ai casi informativi e ha corretto due bias del QA, senza modificare l'annotatore musicale:

- `kick808RelationStrength` entra in statistiche ed estremi solo quando la relazione kick↔808 è realmente disponibile;
- alta density + alto vocalSpace non viene più trattato come contraddizione automatica: una batteria densa può lasciare molto spazio alla voce.

Feedback umano congelato con review manifest:

`339b42b15b89f1b8301a007ba35c15e2bff00e3c487069b7ba431355469c4154`

Esito 22/22 phrase:

- **19**: etichette completamente coerenti;
- **2**: phrase musicalmente poco utili/incoerenti, escluse tramite overlay non distruttivo;
- **1**: `tension` percepita troppo alta su un caso `free-midi-chords`;
- errori metrici ripetuti: **0**;
- agreement sulle 20 phrase musicalmente usabili: **95%**;
- note tecniche di playback/distorsione: **2**, entrambe su phrase con etichette giudicate coerenti e quindi separate dalla calibrazione dell'annotatore.

Le due esclusioni umane sono registrate in `frontend/strumenti/fame-neural-composer/dataset/phase4-human-review-exclusions.json`. Il corpus sorgente resta da 504 phrase; applicando l'overlay alla preparazione del training restano **502 candidate**, ancora sopra il target minimo sperimentale di 500.

### Decisione di calibrazione

**Nessuna calibrazione globale.** Un singolo errore di tension su 20 phrase usabili non giustifica cambiare pesi o soglie per tutto il corpus. Il caso resta evidenza di un limite noto della tension euristica su materiale armonico molto scarno.

L'annotatore `fame-neural-auto-annotator-v1` viene quindi **congelato per la FASE 5**. Le label restano feature euristiche con confidence, non ground truth.

FASE 4: **COMPLETATA**.
