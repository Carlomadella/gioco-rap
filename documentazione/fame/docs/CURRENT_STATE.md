# FAME CURRENT STATE

Riferimento: FAME V0.15.1 Low-End Click Fix

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
- separazione grid / transient / latency / pocket;
- 0 grid violations NON prova automaticamente un buon pocket.

## Trap structure / phrasing — baseline approvata
V0.9 ha consolidato:
- 4-bar phrase come cella primaria;
- ESTABLISH -> ANSWER -> BREATHE -> TURNAROUND;
- ripetizione A/A' invece di nuova idea ogni barra;
- subtraction prima dell'addizione;
- pre-hook dedicato;
- silence prima del ritorno dell'hook;
- Hook B riconoscibile ma non clone dell'Hook A.

Macro-form benchmark:
- Intro 4;
- Hook A 8;
- Verse 16;
- Pre-hook 4;
- Hook B 8;
- Outro 4.

La forma NON è una ricetta universale: è una baseline di test.

## Trap hats — forte miglioramento
V0.11 ha consolidato:
- skeleton + gap + ornament;
- skeleton principalmente 1/8 / broken 1/8;
- roll locali;
- triplet rari e phrase-aware;
- pitch automation locale soprattutto su roll/pickup;
- velocity / decay / pan controllati;
- pausa -> roll come gesto efficace;
- open hat raro;
- closed/open choke;
- crash come punctuation;
- rim/click OFF di default.

Feedback utente:
- "adesso gli hats hanno decisamente più senso".

## Virtual Rap Cadence Mask — direzione approvata
Il beat viene composto come se esistesse già un rapper.

La mask:
- NON genera voce;
- riserva finestre vocal-busy / breath / punchline gap / turnaround;
- guida ornament e spazi;
- protegge negative space.

Concetti associati:
- RAP SPACE SCORE;
- ornament budget per frase;
- vocal-gap-aware decisions.

## Trap lineage / variation — approvata come modello
V0.12 ha dimostrato che due beat possono essere:
- molto diversi;
- entrambi riconoscibili come Trap;
- costruiti sugli stessi core anchors.

Lineage testati:
- NOIR STREET: cinematic/street;
- NEON SPACE: bright/spacey.

Regola:
Trap identity ≠ un singolo preset dark.

Producer Decision DNA candidato:
- space;
- drum aggression;
- harmonic complexity;
- ornament rate;
- low-end presence;
- brightness;
- rawness;
- transition weight.

## Kick ↔ 808 relationship — MANDATORY
Feedback V0.13/V0.14:
Neon Space è diventata nettamente più credibile quando la kick ha iniziato a dialogare con l'808.
Lo stesso difetto è stato riconosciuto successivamente anche in Noir Street.

Ogni kick Trap finale deve avere un ruolo rispetto alla frase 808:
- REINFORCE;
- ANTICIPATE;
- RESPONSE.

NON significa:
- kick e 808 sempre 1:1;
- kick su ogni nota 808;
- kick obbligatoria in ogni barra.

VIETATO:
- pattern kick finale indipendente dalla frase 808.

## Low-End Collision Management — baseline approvata
Quando kick e 808 condividono lo stesso attack:
- default benchmark: KICK = transient owner;
- 808 = sustain/body owner;
- collision policy obbligatoria;
- nessun evento viene spostato fuori griglia.

V0.15 ha introdotto un bug:
- salto istantaneo del gain durante il ducking;
- click digitale percepito su molti attack.

V0.15.1 ha corretto il problema:
- ducking con envelope continuo;
- nessun duck se gli eventi sono SEPARATE;
- duck EXACT meno estremo;
- fade-out sulla kick accorciata;
- niente salti istantanei di gain.

Feedback utente:
- "il problema è sparito del tutto".

Questa implementazione è baseline e NON va regressa.

## FX / production — direzione corretta
Disponibili e validi come fondamento:
- reverb;
- tempo-sync delay;
- chorus;
- saturation/distortion;
- filter automation;
- riser/downlifter;
- ducking;
- compressor leggero sul master;
- limiter;
- tails naturali.

Il Mixing Engine completo NON è ancora aperto:
EQ/compression/dynamic-EQ avanzati vanno usati ora solo se necessari a diagnosticare/correggere problemi evidenti.

---

# RICERCA TRAP — CONSOLIDATA COME BASE

Sono stati prodotti:
- `research/FAME_TRAP_DEEP_RESEARCH_V1.md`;
- `research/FAME_TRAP_RESEARCH_MATRIX_V2.md`.

Conclusioni robuste:
- Trap è una famiglia di lineage, non una ricetta unica;
- half-time backbone + fast detail;
- 808 language centrale ma presence variabile;
- hat language fortemente identitario;
- negative space fondamentale;
- beat deve lasciare spazio al rapper;
- harmony complexity è lineage-dependent;
- dark NON è mandatory;
- bells/plucks/mallets sono strong family, marimba non è core;
- sound selection pesa quanto pattern;
- producer identity = decision style, non preset fisso;
- rawness intenzionale ≠ errore tecnico.

---

# DA MIGLIORARE

## 808 language — PROSSIMO FOCUS
Da formalizzare:
- note duration;
- rests;
- root / fifth / octave;
- passing notes;
- glide profiles;
- register fitness;
- attack character;
- harmonic color;
- relazione con kick ormai mandatory;
- scelta fra soft / medium / heavy / extreme;
- evitare troncature sgradevoli.

## Harmony
Da sviluppare dopo 808 language:
- lineage-dependent complexity;
- static pedal vs multi-chord progression;
- inversions;
- voice leading;
- gospel/jazz colors dove coerenti.

## Melody / motif
Serve ancora:
- phrase placement;
- motif memory;
- rests;
- call/response;
- vocal-space awareness;
- register;
- lineage-based palette.

## Sound choices / library
La V0.12 ha dimostrato che cambiare kit e palette cambia realmente l'identità percepita.
La Sound Library completa resta FASE 2: non aprirla ancora per mascherare problemi musicali.

## Mix tendencies
Da affrontare alla fine della FASE 1:
- source EQ;
- bus EQ;
- drum bus compression;
- dynamic EQ kick/808;
- bus glue;
- master chain.

---

# ROADMAP LOCK — 2026-09-07

FASE 0 — MEMORIA E SICUREZZA: COMPLETATA.

FASE 1 — TRAP PRODUCTION GRAMMAR V1: IN CORSO.

Sottosistemi attualmente consolidati:
1. struttura / frasi — BASELINE APPROVATA;
2. kick + snare/clap pocket — DIREZIONE APPROVATA;
3. hi-hat grammar — BASELINE APPROVATA;
4. kick ↔ 808 relationship — MANDATORY;
5. low-end collision arbitration — BASELINE APPROVATA.

Focus immediato:
**808 LANGUAGE**.

Non aprire la FASE 2 prima di aver completato la FASE 1,
salvo piccoli test strettamente necessari alla fase.
