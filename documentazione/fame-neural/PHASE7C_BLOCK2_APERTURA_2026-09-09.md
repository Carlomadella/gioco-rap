# FAME Neural — Fase 7C — Blocco 2 — Apertura: metadata GMD + prima espansione

Data: 9 settembre 2026
Base repository verificata: `8038e10cb984014fbebb585a22ecd12cc05f05e0`
Stato iniziale: 7C Block1 chiuso; `DRUM DATA READY V2` aperto; training serio chiuso.

## Domanda del blocco

Possiamo passare dal campione GMD da 6 file usato come representation gate a un campione reale più ampio, preservando in forma strutturata i metadata ufficiali necessari alle fasi successive senza alterare la Drum View V2 già verificata?

Metadata target:

- `style` raw + primary/secondary;
- `bpm`;
- `beat_type`;
- `time_signature`;
- `split` della fonte;
- identità performance/drummer/session.

## Stato verificato prima dell'implementazione

Il bootstrap storico `midi/bootstrap-gmd-phase2.ps1` legge già `info.csv` e usa `style`, `beat_type`, `time_signature` e `split` durante selezione/provenance, ma i campi musicali non arrivano come struttura machine-readable nella Drum View V2.

Il Block1 lascia intenzionalmente:

```json
{
  "style": null,
  "beatType": null,
  "sourceSplit": null,
  "metadataStatus": "not-enriched"
}
```

Il campione reale Block1 è di 6 MIDI hiphop/beat/4-4 ed è sufficiente come representation gate, non come prova di scala o training readiness.

## Evidenza esterna

La documentazione ufficiale del Groove MIDI Dataset dichiara per `info.csv` i campi:

- `drummer`;
- `session`;
- `id`;
- `style` nel formato `<primary>/<secondary>`;
- `bpm`;
- `beat_type` = `beat | fill`;
- `time_signature`;
- `midi_filename`;
- `duration`;
- `split` = `train | validation | test`.

La stessa fonte dichiara 1.150 MIDI e split predefiniti. La documentazione TensorFlow Datasets riporta 897 train, 124 validation e 129 test per `groove/full-midionly`.

Riferimenti:

- https://magenta.tensorflow.org/datasets/groove
- https://github.com/tensorflow/datasets/blob/master/docs/catalog/groove.md

## Assunzioni e loro stato

### VERIFICATO

- i metadata target sono label ufficiali GMD, non inferenze FAME;
- `style` contiene primary/secondary;
- `split` è uno split definito dalla fonte;
- il bootstrap corrente possiede già `info.csv` nel workspace reale;
- la Drum View V2 ha già placeholder espliciti per style/beat/split.

### SUPPORTATO MA NON DIMOSTRATO

- un campione da 24 file è sufficiente per verificare che la pipeline non dipenda accidentalmente dai soli 6 file storici;
- il selector hiphop/beat/4-4 storico è adeguato per isolare questo test tecnico prima della vera espansione general-GMD 7D.

### APERTO

- quantità GMD necessaria al pretraining generale;
- policy finale di sampling per stile/drummer/session;
- split leakage-safe FAME definitivo;
- uso di `beat_type` come evidence per core/fill task-specifico;
- generalizzazione a style diversi da hiphop;
- qualità musicale/domain Trap.

### DA NON ASSUMERE

- `hiphop` GMD non significa `Trap`;
- `sourceSplit` GMD non è automaticamente lo split finale FAME;
- `beat_type=beat/fill` non viene automaticamente trasformato in `semantics.core/fill` della Drum View;
- più file non significa `DRUM DATA READY V2`.

## Strategia scelta

Non modificare il Block1 e non riscrivere il bootstrap storico.

Pipeline Block2:

```text
bootstrap GMD storico (>6 file)
        ↓
dataset-item V1 invariato
        ↓
join deterministico sourceId ↔ info.csv.id
        ↓
sourceMetadata GMD strutturato
        ↓
Drum View V2 Block1 invariata
        ↓
enrichment metadata in export Block2
        ↓
report coverage + distribuzioni
```

Motivo: conserva il gate storico riproducibile e rende il nuovo comportamento additivo/reversibile.

## Alternativa scartata per questo blocco

Modificare direttamente `dataset-item.js`, `provenance.js`, il bootstrap Phase2 e `drum-view-v2.js`.

Non è necessario per dimostrare il contratto metadata e aumenterebbe la superficie di regressione proprio sui componenti appena verificati. Un'integrazione più profonda può essere valutata dopo il real-data gate del Block2 se porta un vantaggio concreto.

## Gate Block2 fissato prima dei risultati reali

Il blocco può essere chiuso nel proprio scope tecnico solo se:

1. smoke test metadata passa;
2. campione reale `SourceCount > 6` (default candidato: 24) viene importato;
3. 100% degli item GMD importati trova la propria riga `info.csv`;
4. 100% delle Drum View esportate ha `metadataStatus=source-enriched`;
5. style/beat type/source split/bpm/time signature restano coerenti con `info.csv`;
6. source-hit accounting resta lossless;
7. nessun metadata viene promosso implicitamente a Trap label, split finale FAME o core/fill semantics;
8. il report reale registra distribuzioni style/beat/split e failure eventuali.

Questo gate NON chiude 7D, NON dichiara `DRUM DATA READY V2` e NON apre training serio.
