# FAME Neural â€” FASE 2 real-data gate (GMD)

Data chiusura: 8 settembre 2026
Stato: SUPERATO / FASE 2 COMPLETATA

## Scopo

Verificare la pipeline MIDI e provenance di FAME Neural su dati reali, non soltanto su fixture sintetiche.

La sorgente scelta per il gate Ã¨ il **Groove MIDI Dataset (GMD) v1.0.0**, pubblicato da Google LLC con licenza **CC BY 4.0**.

- Pagina sorgente: `https://magenta.tensorflow.org/datasets/groove`
- Archivio usato: `groove-v1.0.0-midionly.zip`
- SHA-256 ufficiale verificato localmente: `651cbc524ffb891be1a3e46d89dc82a1cecb09a57c748c7b45b844c4841dcc1e`

## Backend Windows definitivo

Il bootstrap usa `tar.exe`, incluso normalmente in Windows 10/11, per leggere lo ZIP ed estrarre selettivamente `info.csv` e i soli MIDI scelti.

Questa scelta evita l'estrazione completa e non dipende da `Expand-Archive` / `System.IO.Compression`, che con questo archivio hanno mostrato incompatibilitÃ  su Windows durante il gate reale.

Il file operativo Ã¨:

`frontend/strumenti/fame-neural-composer/midi/bootstrap-gmd-phase2.ps1`

## Selezione del campione

Il gate seleziona per default 6 esempi reali che rispettano:

- `style = hiphop` oppure sottostile `hiphop/*`;
- `time_signature = 4-4`;
- `beat_type = beat`;
- MIDI presente nell'archivio;
- almeno 2 `compositionFamily` differenti.

Per ogni MIDI viene creato un sidecar di provenance con sorgente, licenza, creator, composition family, rights evidence e permessi commerciali compatibili con CC BY 4.0.

## CompatibilitÃ  drum mapping emersa dal dato reale

Il mapping GMD ha richiesto di riconoscere anche:

- MIDI pitch `22` â†’ `hat_closed`;
- MIDI pitch `26` â†’ `hat_open`.

La correzione Ã¨ mantenuta nel classifier canonico, evitando che questi eventi finiscano genericamente in `perc`.

## Risultato verificato

Esecuzione reale del gate:

```text
Dataset item: 6
Validi FASE 2: 6
Composition family: 6
Sequence canoniche: 6
Duplicati SHA esatti: 0
FASE 2 DATA GATE: READY

FASE 2 REAL DATA GATE: READY
MIDI reali: 6
Validi: 6
Composition family: 6
Sequence canoniche: 6
```

Il report viene prodotto nel workspace temporaneo, per default:

`%TEMP%\fame-neural-gmd-phase2\phase2-real-gate-report.json`

L'attribution record viene prodotto nello stesso workspace come `ATTRIBUTION_GMD.txt`.

Questi output di test non fanno parte della repository e non devono essere committati.

## Cosa dimostra

La FASE 2 Ã¨ chiusa perchÃ© la pipeline ha dimostrato su MIDI reali di poter:

- leggere il MIDI;
- normalizzarlo nel formato canonico FAME Neural;
- classificare il contenuto necessario;
- associare provenance e rights evidence;
- produrre dataset item validi;
- bloccare il corpus quando i requisiti di gate non sono rispettati;
- produrre un corpus reale `READY`.

## Cosa NON dimostra ancora

Questo risultato **non chiude ancora il GATE 1 â€” DATA READY globale** della roadmap.

La FASE 3 deve ancora costruire e verificare Dataset Auditor, dedup musicale / near-duplicate, family split e leakage train/validation/test sul corpus iniziale.

Prossimo stato operativo: **FASE 3 â€” Dataset Auditor e corpus iniziale | IN CORSO**.
