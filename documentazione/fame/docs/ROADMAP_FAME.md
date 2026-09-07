# FAME ROADMAP

Versione roadmap: 1.0
Data: 2026-09-07

Obiettivo: evitare di sviluppare troppi sottosistemi contemporaneamente.
Si procede per fasi, congelando ciò che viene approvato prima di aprire la fase successiva.

---

# FASE 0 — MEMORIA E SICUREZZA
STATUS: IN CORSO

Obiettivo:
rendere la Bibbia FAME la fonte ufficiale del progetto.

Deliverable:
- `documentazione/fame/` nella repo;
- manifest SHA-256;
- bootstrap per AI/dev;
- changelog;
- decision log;
- rejected approaches;
- regression tests;
- roadmap ufficiale.

Definition of Done:
- la cartella è nella repo;
- commit dedicato;
- integrità verificata;
- nessuna modifica al codice gioco nello stesso commit.

NON si sviluppa altro finché questa fase non è chiusa.

---

# FASE 1 — TRAP PRODUCTION GRAMMAR V1
STATUS: NEXT

Obiettivo:
definire bene COME viene costruito un beat Trap competente prima di aggiungere molti altri generi.

Ordine:
1. struttura / frasi;
2. kick + snare/clap pocket;
3. hi-hat grammar;
4. 808 language;
5. harmony;
6. melody / motif;
7. transitions;
8. sound choices;
9. mix tendencies.

Da studiare e formalizzare:
- strutture usate da producer forti;
- 4/8/16-bar phrasing;
- hook/verse contrast;
- subtraction;
- hat skeleton + holes;
- local rolls;
- triplet rolls;
- pitch automation hats;
- open-hat pickups;
- crash punctuation;
- 808 presence variabile;
- glide quando musicalmente utile;
- bells/plucks/mallets/piano come colori;
- negative space.

Deliverable:
- `TRAP_PRODUCTION_PLAYBOOK.md`;
- `trap.json` aggiornato;
- pattern/variation pools;
- test A/B udibili.

Definition of Done:
un beat generato deve essere riconoscibile come Trap senza affidarsi a un singolo cliché.

---

# FASE 2 — SOUND LIBRARY V1
STATUS: DOPO TRAP GRAMMAR

Obiettivo:
ampliare la tavolozza sonora senza mascherare problemi compositivi con più sample.

Prima milestone:
- più kick;
- più snare/clap;
- più closed/open hat;
- più perc;
- più crash/FX;
- più 808.

Poi:
- bells;
- mallets;
- plucks;
- keys/piano;
- pads;
- leads;
- textures.

Ogni suono deve avere metadata:
- family;
- character;
- genre compatibility;
- brightness;
- hardness;
- decay;
- root note se tonale;
- transient offset;
- license/source.

Definition of Done:
FAME può scegliere una famiglia sonora coerente col beat senza pescare WAV casualmente.

---

# FASE 3 — TRAP GENERATOR V1
STATUS: DOPO SOUND LIBRARY V1

Obiettivo:
unire grammatica + composer + sound selection in un generatore Trap vero.

Input minimo:
- mood;
- energy;
- prompt;
- BPM auto/manuale opzionale.

Output:
- beat completo;
- seed;
- stems;
- arrangement;
- composition plan.

Test:
- più seed;
- evitare beat-clone;
- preservare identità Trap;
- nessuna regressione del sound engine V0.6+.

Definition of Done:
più generazioni consecutive devono sembrare appartenere allo stesso genere ma non allo stesso template.

---

# FASE 4 — GENRE IDENTITY FRAMEWORK
STATUS: DOPO TRAP GENERATOR V1

Obiettivo:
generalizzare ciò che ha funzionato sulla Trap.

Per ogni genere:
- Rhythm DNA;
- Bass DNA;
- Harmony DNA;
- Melody DNA;
- Sound DNA;
- Arrangement DNA;
- Mix DNA;
- Core Anchors;
- Strong Cliches;
- Style Cliches;
- Variation Space;
- Forbidden Automatisms.

Ordine iniziale proposto:
1. UK Drill;
2. Boom bap;
3. West Coast / G-funk;
4. Rage;
5. Melodic Trap;
6. Plugg / PluggnB;
7. Jersey;
8. Detroit.

Regola:
NON aprire tutti i generi contemporaneamente.

---

# FASE 5 — INTENT ENGINE / ONE-CLICK GENERATION
STATUS: FUTURE

Obiettivo:
tradurre richieste semplici del giocatore in decisioni musicali.

Esempio:
"freddo e cattivo, per freestyle"
↓
mood / energy / space / aggression / sound DNA
↓
genre grammar
↓
beat.

La modalità one-click resta il default.
I controlli avanzati sono opzionali.

---

# FASE 6 — STUDIO / PARTIAL REGENERATION
STATUS: FUTURE

Obiettivo:
permettere di rigenerare soltanto:
- drums;
- 808;
- harmony;
- melody;
- sound selection;
- section;
- FX.

Senza perdere seed e identità del resto del beat.

---

# FASE 7 — INTEGRAZIONE IN ANNI DI FAME
STATUS: FUTURE

Solo quando il generatore standalone è sufficientemente stabile.

Obiettivi:
- integrazione con studio in-game;
- salvataggio progetto;
- export/stems;
- gameplay/progression;
- performance e caching;
- licensing audit finale.

---

# REGOLE DI AVANZAMENTO

1. Una fase aperta alla volta, salvo micro-fix.
2. Un sottosistema approvato viene congelato.
3. Niente ampliamento libreria per nascondere problemi di composizione.
4. Niente nuovo genere prima che il benchmark corrente sia credibile.
5. Ogni fase chiusa aggiorna:
   - CURRENT_STATE;
   - DECISIONS;
   - specs;
   - tests;
   - CHANGELOG;
   - questa ROADMAP.
