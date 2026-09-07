# FAME Neural — Current State

Data: 2026-09-07

## Stato roadmap

- FASE 0 — Fondazione e separazione: **COMPLETATA**.
- FASE 1 — Linguaggio dei dati: **COMPLETATA**.
- FASE 2 — Pipeline MIDI e provenienza: **IN CORSO**.
- Training reale: **NON INIZIATO**.
- Corpus reale: **NON ANCORA COSTRUITO**.

## Linguaggio simbolico corrente

Directory:

`frontend/strumenti/fame-neural-composer/`

Baseline:

- schema `fame-neural-sequence-v1`;
- 960 PPQ nel formato simbolico canonico;
- `tonality` separata dalla progressione armonica;
- harmony segmentata con root, quality e bass/inversione;
- event stream multitraccia;
- evento 808 con glide target + glide duration;
- ordine canonico degli eventi simultanei;
- encoder + decoder;
- token ↔ id lossless;
- grammatica del token stream;
- `allowedNextTokens()` per constrained generation futura;
- duration straight/triplet;
- pitch MIDI 0..127;
- tre fixture sintetiche da 8 barre;
- audit simbolici iniziali.

Vocabolario V1 corrente: **1019 token**.

## Quantizzazioni ammesse

La rappresentazione neurale V1 è intenzionalmente discreta:

- onset: nearest tra 1/32 straight, 1/16 triplet, 1/8 triplet;
- duration: stesse famiglie fino a 2 barre;
- velocity: 10 bin;
- energy/vocalSpace/tension/density: 10 bin.

La stabilità richiesta è canonica, non byte-identical rispetto all'input grezzo:

`encode(decode(encode(sequence))) === encode(sequence)`.

## Verifica corrente

```powershell
cd frontend
node .\strumenti\fame-neural-composer\smoke-test.js
```

Esito baseline:

```text
FAME Neural Composer: 3 fixture base valide
Vocabolario: 1019 token
TOKEN GRAMMAR + CONSTRAINED PREFIX: OK
HARMONY/CHORD ROUND-TRIP: OK
808 GLIDE ROUND-TRIP: OK
SIMULTANEOUS EVENT ORDER: OK
BOUNDARY + CROSS-BAR DURATION: OK
ROUND-TRIP TOKEN/ID/SEQUENCE: OK
TRIPLET DURATIONS 160/320: OK
FASE 1 SMOKE TEST: OK
```

## FASE 2 — stato implementazione

Completato finora:

1. Dataset Schema V1;
2. parser SMF format 0/1;
3. normalizzazione PPQ → 960;
4. classificazione iniziale drums / 808 / harmony / lead / unknown;
5. provenance/rights record obbligatorio;
6. SHA-256 sorgente e eligibility tecnica/commerciale separate;
7. track override espliciti per casi ambigui;
8. pitch bend semplice 808 → glide canonico;
9. batch importer con sidecar provenance e report;
10. fixture SMF reali generate dai test e casi di blocco verificati.

Restano aperti prima di chiudere la FASE 2:

- tempo map variabile;
- estrazione armonica/chord preservation verificata;
- manifest di corpus riproducibile;
- prova su piccolo set di MIDI originali/licenziati reali;
- hardening sui casi trovati nei dati veri.
