# Owned Beats — Audio Analysis V2 config-001 — Esito metric gate

Data: 11 settembre 2026

## Stato congelato prima del risultato

Candidate:

`audio-analysis-v2-config-001`

Configurazione:

`1/8`

Freeze commit:

`43530f44c5e753a1ab024a5be235dc2363c2f7ba`

Human Reference development:

- reviewId: `audio-analysis-v2-dev-reference-precision-v3`
- submission digest SHA256: `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`

Control arm:

- run: `v1-baseline-development-002`
- report SHA256: `4bebe4af0ed4bd8b0d1796432c54099c1705a3494d258c2eb10bc85033e2b714`

L'holdout non è stato osservato.

## Artefatti del run

Candidate run:

`v2-config-001-development-001`

Candidate report SHA256:

`3047e7e15cd0efff7a4c7840b25b7c8a7e78e9fa583800861ae3f806eb2324e8`

Paired comparison run:

`v2-config-001-vs-v1-baseline002-001`

Paired comparison report SHA256:

`8459bd85d01d47b34152ba63c862734dfb4a272ac3728506aea78892e179f398`

## Risultato aggregato

| Metrica | V1 baseline002 | V2 config-001 | Delta paired mediano |
|---|---:|---:|---:|
| Beat F1 @70 ms | 0.724060 | 0.724060 | 0.000000 |
| Section F1 @0,5 s | 0.000000 | 0.171429 | +0.071429 |

Il beat tracker, BPM e meter sono rimasti invariati. Il confronto paired certifica:

- `beatTrackerOutputsExactlyInvariant = true`;
- paired median delta Beat F1 = `0.0`;
- paired median delta Section F1 = `+0.071429`;
- soglia frozen di material improvement sections = `+0.05`;
- soglia frozen di non-inferiority sections = `-0.03`;
- soglia frozen di non-inferiority beat = `-0.02`.

Esito metrico:

`V2_WINS_METRICALLY`

Decisione development corrente:

`INCONCLUSIVE_REVIEW_PENDING`

L'holdout **non può essere aperto** in questo stato.

## Risultato per family — sections

| Family | F1 V1 | F1 V2 | Delta | Boundary V1→V2 | FP V1→V2 | Omissioni V1→V2 |
|---|---:|---:|---:|---:|---:|---:|
| FAME000011 | 0.000000 | 0.000000 | 0.000000 | 0→7 | 0→7 | 7→7 |
| FAME000012 | 0.000000 | 0.583333 | +0.583333 | 0→15 | 0→8 | 9→2 |
| FAME000023 | 0.000000 | 0.000000 | 0.000000 | 0→4 | 0→4 | 2→2 |
| FAME000040 | 0.000000 | 0.142857 | +0.142857 | 0→6 | 0→5 | 8→7 |
| FAME000046 | 0.000000 | 0.857143 | +0.857143 | 1→3 | 1→0 | 4→1 |
| FAME000058 | 0.363636 | 0.200000 | -0.163636 | 3→12 | 1→10 | 6→6 |
| FAME000080 | 0.000000 | 0.222222 | +0.222222 | 0→11 | 0→9 | 7→5 |
| FAME000126 | 0.000000 | 0.000000 | 0.000000 | 4→0 | 4→0 | 7→7 |

## Interpretazione congelata

La prima configurazione V2 dimostra che il contrasto contestuale beat-synchronous è una direzione utile: supera il gate metrico delle sections senza modificare il beat tracker.

Il risultato non equivale però a promozione finale della V2. Restano failure mode importanti:

- `FAME000012` e `FAME000046` migliorano molto;
- `FAME000040` e `FAME000080` recuperano boundary ma con falsi positivi;
- `FAME000058` regredisce nel Section F1 e aumenta fortemente i falsi positivi;
- `FAME000011` e `FAME000023` producono boundary senza match @0,5 s;
- `FAME000126` elimina quattro false boundary V1 ma non recupera le sette reference boundary.

Quindi il risultato è un successo **del gate metrico**, non una dichiarazione che il detector sections sia già soddisfacente in assoluto.

## Prossimo vincolo

Prima di aprire una `config-002` o l'holdout va completato il required human correction-cost review della config-001.

Il protocollo frozen richiede:

- almeno 6 development family comparabili;
- metrica: human review seconds per audio minute;
- se l'aumento relativo mediano del costo candidato supera `+25%`, la vittoria automatica viene bloccata;
- l'early-stop è il primo `V2_WINS` con required review completo.

Fino a quel review:

- candidate config-001 resta congelata;
- nessun tuning successivo viene applicato;
- `config-002` non viene aperta;
- holdout resta chiuso;
- Source Separation, Audio→MIDI e training serio restano fuori scope.