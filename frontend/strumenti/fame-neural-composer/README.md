# FAME Neural Composer — Symbolic Language V1

Modulo simbolico isolato del progetto FAME Neural.
Non modifica il renderer/audio engine e non contiene ancora un modello neurale addestrato.

## Stato

FASE 1 — Linguaggio dei dati: completata.

## Componenti

- `core.js` — schema `fame-neural-sequence-v1`, normalizzazione e validazione semantica.
- `vocabulary.js` — vocabolario discreto Neural V1.
- `grammar.js` — grammatica del token stream + token ammessi come prossimo passo.
- `tokenizer.js` — encode/decode e mapping token ↔ id.
- `fixtures.js` — tre fixture sintetiche da 8 barre.
- `audit-musicale.js` — audit simbolici iniziali.
- `smoke-test.js` — round-trip, harmony, glide, grammar e casi limite.
- `export-dataset.js` — export JSONL tecnico.

## Contratto musicale V1

La sequenza distingue:

- `tonality`: centro tonale e modo globali;
- `harmony`: segmenti di accordo con start, durata, root, quality e bass/inversione;
- `bars`: conditioning per barra;
- `events`: eventi musicali canonici.

Gli eventi simultanei hanno un ordine deterministico.
L'808 può rappresentare `glideTo` + `glideTicks`.

## Quantizzazione neurale ammessa

Il runtime canonico resta espresso in tick, ma la rappresentazione neurale V1 proietta:

- onset sulla griglia più vicina tra 1/32 straight, 1/16 triplet e 1/8 triplet;
- duration sulle stesse famiglie di griglia, fino a 2 barre;
- velocity e conditioning continui in 10 bin (0..9).

Pitch MIDI 0..127, identità degli accordi, motif discreti e ruoli definiti restano esatti nel token stream.

Il test di round-trip richiede stabilità canonica:

`encode(decode(encode(sequence))) === encode(sequence)`

## Test

Dalla cartella `frontend`:

```powershell
node .\strumenti\fame-neural-composer\smoke-test.js
```

Output finale atteso:

```text
TOKEN GRAMMAR + CONSTRAINED PREFIX: OK
HARMONY/CHORD ROUND-TRIP: OK
808 GLIDE ROUND-TRIP: OK
SIMULTANEOUS EVENT ORDER: OK
BOUNDARY + CROSS-BAR DURATION: OK
ROUND-TRIP TOKEN/ID/SEQUENCE: OK
TRIPLET DURATIONS 160/320: OK
FASE 1 SMOKE TEST: OK
```

## Cosa NON è deciso qui

Non è stato scelto il tokenizer/model format definitivo per il training.
Flat, REMI+, Compound e FAME Compound verranno confrontati nella fase prevista dalla roadmap.
