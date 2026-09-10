# Owned Beats — Human Reference Block D

Data: 2026-09-10

Stato: **APERTO — tooling di raccolta implementato; reference reali non ancora raccolte**

## Obiettivo

Preparare una raccolta umana ripetibile e verificabile per le 8 `compositionFamilyId` dello split `development`, rispettando il protocollo congelato in `owned-beats/audio-analysis-v2-protocol.json`.

Questo blocco non modifica Audio Analysis V1 o V2, non avvia tuning, non apre Source Separation, non converte Audio→MIDI e non autorizza training.

## Vincoli

- selezione esclusiva del cohort `owned-beats-pilot-v1` nello split `development`;
- 8 composition family attese e una sorgente attiva per family nel pilot corrente;
- `evaluation-holdout` fail-closed: se un record non-development entra nel cohort, il tool si arresta;
- nessun output candidato V1/V2 viene mostrato all'annotatore;
- SHA256 della sorgente ricontrollato prima di preparazione, check e finalizzazione;
- durata usata per le finestre ottenuta dal decode FFmpeg mono a 22050 Hz, coerente con il riferimento temporale del percorso Audio Analysis;
- finestre beat derivate esclusivamente dal protocollo: `EARLY`, `MIDDLE`, `LATE`, 3 × 12 s quando la durata lo consente; fallback full-track per tracce corte;
- sezioni annotate sulla traccia completa, con sole boundary interne;
- meter limitato ai valori congelati dal protocollo;
- snapshot finali append-only per `reviewId`, senza sovrascrivere una finalizzazione differente.

## Tool

`frontend/strumenti/fame-neural-composer/owned-beats/human-reference-pack.js`

Comandi:

```text
node human-reference-pack.js prepare <workspace-folder> <review-id>
node human-reference-pack.js check <workspace-folder> <submission.json>
node human-reference-pack.js finalize <workspace-folder> <submission.json>
```

### prepare

Crea sotto il workspace:

```text
runs/human-reference-v1/<review-id>/
  index.html
  submission-template.json
  PACK_INFO.txt
  clips/<sourceRecordId>/{early,middle,late}.wav
  waveforms/<sourceRecordId>/{early,middle,late}.svg
```

L'HTML è locale e senza dipendenze esterne. Permette di:

- ascoltare traccia completa e finestre;
- registrare manualmente i beat sul tempo corrente dell'audio come scorciatoia di tap;
- piazzare i marker direttamente sulla waveform e rifinirli con nudge da ±1 ms / ±10 ms;
- ricavare il BPM dai marker umani come semplice supporto, senza leggere candidati automatici;
- indicare il metric level umano;
- inserire boundary di sezione sulla full track;
- registrare il verdetto meter;
- misurare il tempo di review;
- esportare il JSON della submission.

### check

Rivalida la submission contro protocollo, manifest corrente, SHA sorgente e durate decoded. Il controllo segnala separatamente:

- family con review completa;
- family con beat reference utilizzabile metricamente;
- `finalizationReady`.

### finalize

È consentito solo quando tutte le 8 family hanno review completa e beat reference metricamente utilizzabile. Scrive uno snapshot versionato in:

```text
references/audio-analysis-v2/development/<review-id>.json
references/audio-analysis-v2/development/index.json
```

La finalizzazione non modifica il manifest Owned Beats e non promuove nessun asset o task.

## Stato del gate

Dopo questa implementazione il tooling è pronto, ma il gate umano resta **APERTO** finché non viene eseguita e finalizzata una review reale delle 8 family development.

Solo dopo quella raccolta si potrà costruire il confronto V1/V2 sul development. Il holdout resta chiuso fino a un eventuale `V2_WINS` e al freeze del candidato previsto dal protocollo.
