# Owned Beats — Audio→MIDI P2 measurement/export audit — PASS

Data: 22 settembre 2026  
Decisione: NDR-094  
Branch: `feature/fame-neural-roadmap`

## Obiettivo

Chiudere P2 del piano NDR-093 verificando separatamente:

1. durata e comportamento del renderer di audition;
2. corrispondenza JSON → MIDI;
3. assenza di regressioni o modifiche agli artefatti/voti storici.

Il cohort usato è quello **già consumato** dell'independent evaluation `audio-to-midi-independent-evaluation-v1-001`. È stato usato soltanto come failure/regression evidence, non per tuning o nuova qualification.

## Implementazione verificata

Nuovi artefatti versionati:

- `audio-to-midi-p2-protocol-v1.json`;
- `audio-to-midi-human-review-v2.js`;
- `audio-to-midi-p2-audit.js`;
- `owned-beats-audio-to-midi-p2-test.js`;
- `run-audio-to-midi-p2-audit.ps1`.

Il renderer storico v1 resta immutato.

Il renderer v2 usa una durata esplicita derivata da:

`samplesPerChannel / sampleRate`

dei reference stem già registrati nei `result.json`. Gli eventi oltre la reference sono errori espliciti; i casi senza eventi producono silenzio a durata piena.

## Risultato P2 reale

Output locale:

- mode: `FAME_NEURAL_P2_DIAGNOSTIC_AUDIT_PASS`;
- records: **12**;
- JSON↔MIDI equivalence: **12/12**;
- overflow families: **0**;
- source audio opened: **false**;
- source separation executed: **false**;
- transcription executed: **false**;
- retuning performed: **false**;
- historical artifacts modified: **false**;
- historical votes modified: **false**;
- training authorized: **false**;
- batch131 authorized: **false**;
- task-data ready: **false**.

La verifica JSON↔MIDI comprende note, canali, velocity, onset, offset, PPQ/tempo e assenza di pitch bend inattesi. Per i drums l'offset MIDI è una durata tecnica deterministica, non una durata musicale inferita dal JSON.

## Durata renderer storico v1

Convenzione dei numeri sotto:

`reference duration - renderer v1 duration`

Quindi:

- valore positivo = il v1 terminava prima della reference;
- valore negativo = il v1 era leggermente più lungo della reference.

Range osservati sulle 12 family:

| Candidate | min | max |
| --- | ---: | ---: |
| drums render | -0.153832 s | +9.344331 s |
| bass-note render | -0.043152 s | +9.280862 s |
| bass-contour render | +0.018458 s | +9.342472 s |

Il caso più evidente nel riepilogo è `FAME000092`, con differenza di circa **+9.34 s drums**, **+9.28 s bass** e **+9.34 s contour**.

Questo dimostra che il renderer v1 era **event-duration-dependent** e non reference-duration-dependent. Non era però sempre più corto: piccoli valori negativi compaiono quando il padding tecnico del v1 superava leggermente la durata reference.

## Interpretazione

### Verificato

- P2 measurement/export gate: **PASS**.
- JSON e MIDI della independent evaluation sono equivalenti secondo il contratto P2 su tutte le 12 family.
- Nessun overflow rispetto alla reference è stato rilevato.
- Il renderer v1 poteva differire dalla durata reference di diversi secondi; il v2 elimina questa dipendenza dall'ultimo evento per i confronti futuri.

### Non dimostrato

- Non è misurato quanto la differenza di durata del renderer v1 abbia influenzato i voti Human QA storici.
- I voti e l'outcome `KEEP_BATCH_CLOSED_REVIEW_FAILURES` non vengono reinterpretati o riscritti.
- P2 non dimostra che i failure drums siano causati dal renderer; al contrario, elimina export JSON→MIDI come spiegazione generale dei failure e rende i prossimi test più controllati.

## Gate e prossimo passo

P1: **PASS**.  
P2: **PASS**.  
P3: **ATTIVO**.

Il prossimo blocco è il controllo easy Audio→MIDI con:

- fixture controllate;
- baseline congelata;
- renderer v2;
- beat reali semplici ammessi e congelati prima del primo run;
- tracing mix/stem → onset/F0 intermedi → classification/fusion/segmentation → JSON → MIDI → render.

Training, batch131 e task-data readiness restano chiusi.

