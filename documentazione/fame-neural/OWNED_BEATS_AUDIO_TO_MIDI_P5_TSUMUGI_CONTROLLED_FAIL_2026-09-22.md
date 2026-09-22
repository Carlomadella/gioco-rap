# Owned Beats — P5 Tsumugi drums_v1_5 controlled result — gate FAIL, informative partial evidence

Data: 22 settembre 2026  
Decisione: NDR-099  
Branch: `feature/fame-neural-roadmap`

## Run

`audio-to-midi-p5-tsumugi-controlled-v1-001`

Candidate: `tsumugi-drums-v1_5`  
Checkpoint SHA256: `65138ad1dd919f33fb0ce56e54c0c23c87deaad6511132d69137cf4901ee9319`

Runtime risolto:

- sample rate: 22050 Hz;
- window: 8000 ms;
- stride: 4000 ms;
- track batch size: 352;
- window batch size: 1;
- device: CUDA;
- AMP: off;
- compile: off;
- instrument filter: drums.

Safety:

- source/owned beat audio aperto: no;
- fixture sintetiche aperte: sì;
- source separation: no;
- fresh owned-beat families consumate: 0;
- consumed independent-evaluation families usate: 0;
- training: chiuso;
- batch131: chiuso.

## Risultati controllati

Il gate D01–D07 non passa.

- **D01 kick isolato:** 4 TP / 0 FP / 0 FN — F1 1.0.
- **D02 snare isolato:** 4 TP / 4 FP / 0 FN — F1 0.666667. Gli snare veri sono tutti recuperati, ma compaiono 4 hi-hat falsi.
- **D03 hi-hat isolato:** 0 TP / 0 FP / 7 FN — F1 0.0. Nessun evento predetto.
- **D04 kick+snare simultanei:** 4 TP / 4 FP / 4 FN — F1 0.5. I quattro kick sono corretti; gli snare non vengono recuperati e compaiono quattro hi-hat falsi.
- **D05 kick+hi-hat simultanei:** 8 TP / 0 FP / 0 FN — F1 1.0. Entrambe le classi e tutte le simultaneità sono recuperate correttamente.
- **D06 hi-hat triplets:** 0 TP / 0 FP / 9 FN — F1 0.0. Nessun evento predetto.
- **D07 kick sincopato:** 0 TP / 0 FP / 5 FN — F1 0.0. Nessun evento predetto.
- **D08 clap/rim diagnostico:** 2 eventi predetti, entrambi mappati hi-hat; resta fuori dal gate supportato.

A 50 ms il pattern non cambia, quindi il failure non è spiegato da una tolleranza onset troppo stretta.

## Interpretazione verificata

Il risultato non supporta una conclusione generica del tipo “Tsumugi non riconosce kick/hi-hat”:

- D01 dimostra che il kick sintetico può essere riconosciuto perfettamente;
- D05 dimostra che kick+hi-hat simultanei possono essere riconosciuti perfettamente e che il modello ha capacità multi-hit reale;
- D03/D06 mostrano invece che altri hi-hat sintetici vengono ignorati completamente;
- D07 mostra che un altro fixture kick, con pattern e seed diversi, viene ignorato completamente;
- D02/D04 mostrano confusione snare→hi-hat dipendente dal contesto.

Il generatore P3 usa seed deterministici diversi per fixture/evento. Quindi D01 e D07 usano lo stesso algoritmo di sintesi kick ma non la stessa componente noise/transient; D03/D05/D06 analogamente non condividono identiche waveform hi-hat. Questo rende plausibile una sensibilità timbrica/contesto del pretrained rispetto ai transient sintetici, ma non prova da solo che il failure sia soltanto out-of-distribution.

## Decisione

1. Tsumugi non viene promosso al real-easy dal controlled gate: gate FAIL.
2. Non si ritoccano `note_bias`, gate logits, merge o altre soglie dopo aver visto i fixture.
3. Prima di decidere se fermare Tsumugi o autorizzare un piccolo real-easy diagnostic, si localizza il failure usando esclusivamente i result JSON già persistiti:
   - decoder window/skip stats;
   - selected instrument-pitch pairs;
   - decoded interval count;
   - boundary diagnostics;
   - pitch raw/canonici e ruoli emessi.
4. Nessuna nuova inference è necessaria per questa localizzazione.
5. Beat reali e P6 restano chiusi fino alla decisione successiva.

Next action: `RUN_TSUMUGI_CONTROLLED_FAILURE_REPORT_READ_ONLY`.
