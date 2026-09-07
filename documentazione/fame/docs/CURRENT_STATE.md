# FAME CURRENT STATE

Riferimento: V0.8 Rhythm & Arrangement Pass

---

# APPROVATO / DA NON REGREDIRE

## Sound Engine — direzione approvata
Dalla V0.6 il salto qualitativo è stato enorme.
Feedback utente:
- i suoni iniziano a sembrare "veri";
- sensazione quasi da DAW;
- il vecchio carattere MIDI è stato fortemente ridotto.

NON tornare a:
- lead additive toy;
- rendering Python primitivo;
- pochi sample pitch-shiftati come strumento completo.

## Timing architecture — approvata come fondamento
- 960 PPQ;
- absolute tick scheduling;
- humanize OFF;
- swing OFF;
- separazione grid / transient / latency / pocket.

## Trap hats V0.8 — forte miglioramento
Feedback utente:
- "già molto molto meglio".

La grammatica attuale:
- skeleton closed-hat principalmente 1/8;
- buchi e accenti;
- roll locali;
- open hat raro;
- closed/open choke;
- crash come punctuation strutturale;
- bus hats più basso.

## FX / production — direzione corretta
- reverb;
- tempo-sync delay;
- chorus;
- saturation/distortion;
- filter automation;
- riser/downlifter;
- sidechain/ducking;
- tails naturali.

---

# DA MIGLIORARE

## Arrangement
L'utente percepisce ancora:
- struttura da producer neofita;
- posizionamento delle note da rivedere;
- entrata/uscita degli elementi da rendere più musicale.

## Melody / motif
Serve studiare:
- fraseggio dei producer forti;
- placement delle note;
- pause;
- call/response;
- registro;
- relazione con gli accordi.

## Genre research
Va fatta una ricerca sistematica per ogni genere sui tratti distintivi, senza creare ricette fisse.

## Sound library
La V0.8 usa ancora una libreria piccola.
Sample reali cablati nel launcher V0.8:
1. kick
2. snare
3. clap
4. closed hi-hat
5. open hi-hat
6. rimshot
7. crash/cymbal

In più esistono sorgenti sintetiche interne:
- 808/sub synth
- chord saw layer
- chord FM layer
- chord air layer
- lead FM
- lead pluck
- noise riser
- noise downlifter

La libreria deve essere ampliata e classificata con metadata.

---

# PROSSIMI PUNTI CONCORDATI

1. Formalizzare Genre Identity Profile per ogni genere.
2. Trap:
   - approfondire pattern standard / cliche hats;
   - pitch/pitch automation sugli hats;
   - triplet rolls;
   - open/closed/crash roles;
   - bells/mallets/plucks;
   - ruolo 808 variabile per sottostile;
   - negative space.
3. Ampliare Sound Library.
4. Mantenere Sound Engine V0.6+ come fondamento.
5. Continuare a migliorare arrangement e phrase placement.


---

# ROADMAP LOCK — 2026-09-07

FASE 0 — MEMORIA E SICUREZZA: COMPLETATA.

La Bibbia ufficiale è presente su `main` in `documentazione/fame/`.
Commit iniziale della Bibbia: `923915b`.

Priorità unica corrente:

FASE 1 — TRAP PRODUCTION GRAMMAR V1.

Focus corrente:
1. struttura / frasi;
2. kick + snare/clap pocket;
3. hi-hat grammar;
4. 808 language;
5. harmony;
6. melody / motif;
7. transitions;
8. sound choices;
9. mix tendencies.

Non aprire la FASE 2 prima di aver completato la FASE 1,
salvo piccoli test necessari alla fase.