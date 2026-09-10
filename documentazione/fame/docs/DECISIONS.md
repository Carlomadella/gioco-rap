# FAME DECISIONS LOG

Formato:
ADR = Architecture / Design Record

---

## ADR-001 — ACE-Step escluso dal core
Status: ACCEPTED

Motivo:
I test hanno mostrato qualità musicale insufficiente, timing non affidabile e scarso controllo strutturale.

Conseguenza:
FAME usa un composer/pattern/sound engine proprietario.
ACE potrà eventualmente essere valutato solo per ambience/ear-candy, non come generatore core.

---

## ADR-002 — Rendering Python primitivo escluso dalla qualità finale
Status: ACCEPTED

Motivo:
I suoni risultavano troppo puri, MIDI-like e poveri.

Conseguenza:
Il renderer Python resta al massimo come strumento diagnostico.

---

## ADR-003 — Tone.js / browser audio graph adottato come benchmark funzionante
Status: ACCEPTED-DIRECTION

Motivo:
V0.6 ha prodotto un salto qualitativo enorme percepito dall'utente.

Conseguenza:
Il cuore temporale/audio della V0.6+ non va sostituito senza un confronto A/B convincente.

---

## ADR-004 — PPQ 960 + absolute scheduling
Status: ACCEPTED

Motivo:
Elimina drift cumulativo e rende il timing auditabile.

---

## ADR-005 — Humanize OFF finché il pocket straight non è approvato
Status: ACCEPTED

Motivo:
Non usare microtiming per mascherare pattern sbagliati.

---

## ADR-006 — Genre grammar before randomness
Status: ACCEPTED

Motivo:
Un genere deve essere riconoscibile prima di diventare variabile.

---

## ADR-007 — Harmony before melody
Status: ACCEPTED

Motivo:
Random notes inside scale producevano melodie corrette ma casuali / poco musicali.

---

## ADR-008 — Trap hats = skeleton + ornament
Status: ACCEPTED

Motivo:
La V0.7 cambiava densità per intere sezioni e produceva pattern piatti/meccanici.

Conseguenza:
Closed hat stabile; roll/pickup/pitch sono ornamentazioni locali.

---

## ADR-009 — Open hat e closed hat condividono choke logic
Status: ACCEPTED

Motivo:
Comportamento più vicino a uno hi-hat reale.

---

## ADR-010 — Crash = punctuation strutturale
Status: ACCEPTED

Motivo:
Il crash non deve diventare un pattern continuo.

---

## ADR-011 — Layer removal senza hard cut
Status: ACCEPTED

Motivo:
Mute e stop improvvisi troncherebbero release e FX tail.

Conseguenza:
Smettere di generare nuovi eventi e lasciare decadere il suono.

---

## ADR-012 — Cliche musicali come identità, non ricetta
Status: ACCEPTED

Motivo:
Tratti distintivi servono a rendere il genere riconoscibile, ma non devono standardizzare tutti i beat.

Conseguenza:
Separare Core Anchors / Strong Cliches / Style Cliches / Variation Space.

---

## ADR-013 — Pitch automation degli hat entra nella Trap grammar
Status: ACCEPTED

Motivo:
È un tratto caratteristico utile soprattutto su roll, pickup e accenti.

Conseguenza:
Mai applicarlo continuamente a tutto lo skeleton.

---

## ADR-014 — Kick e 808 devono essere generate come relazione nella Trap
Status: ACCEPTED / MANDATORY

Motivo:
V0.13 Neon Space è diventata nettamente più credibile quando la kick è stata derivata dalla frase 808.
Lo stesso difetto è stato riconosciuto anche in Noir Street.

Decisione:
Il Kick Engine NON può finalizzare un pattern Trap senza conoscere la frase 808.

Ruoli ammessi:
- REINFORCE;
- ANTICIPATE;
- RESPONSE.

Non significa:
- kick = 808 1:1;
- kick su ogni nota 808;
- kick obbligatoria in ogni barra.

Vietato:
pattern kick finale indipendente dalla frase 808.

---

## ADR-015 — Low-End Collision Arbitration
Status: ACCEPTED / MANDATORY

Problema:
Kick e 808 possono essere musicalmente correlate e comunque sovrapporsi energeticamente sullo stesso attack.

Decisione:
Ogni collisione low-end deve avere una policy.

Default benchmark:
- KICK = transient owner;
- 808 = sustain/body owner.

Classi:
- EXACT;
- NEAR_1_32;
- NEAR_1_16;
- SEPARATE.

Regole:
- niente spostamento temporale per mascherare il problema;
- SEPARATE = nessun duck obbligatorio;
- in futuro sono ammessi profili alternativi, inclusa kick omessa se l'808 ha già un transient sufficiente.

---

## ADR-016 — Nessuna discontinuità istantanea di gain nel ducking audio
Status: ACCEPTED / MANDATORY

Motivo:
V0.15 impostava il gain dell'808 direttamente al valore duckato nello stesso istante dell'attack.
Il risultato produceva click digitali percepiti come clipping.

Correzione V0.15.1:
- envelope continuo;
- cancel/hold prima della rampa;
- recovery smussato;
- kick tail con fade-out quando accorciata.

Conseguenza:
Automation di gain/filter/pitch destinata all'audio udibile deve evitare discontinuità non intenzionali.

---

## ADR-017 — Virtual Rap Cadence Mask
Status: ACCEPTED-DIRECTION

Motivo:
La ricerca producer-first converge sulla necessità di lasciare spazio alla cadence del rapper.
V0.11 ha migliorato il comportamento degli hats usando gap e phrase-aware ornaments.

Decisione:
FAME può generare una maschera ritmica virtuale della voce senza generare una voce reale.

Ruoli:
- VOCAL_BUSY;
- VOCAL_MEDIUM;
- BREATH;
- PUNCHLINE_GAP;
- TURNAROUND_GAP.

Uso:
ornament, melody e in futuro kick/808 possono rispettare le finestre vocali.

---

## ADR-018 — Trap lineage profiles invece di un solo centroide
Status: ACCEPTED-DIRECTION

Motivo:
V0.12 ha prodotto due beat molto diversi ma ancora riconoscibili come membri della stessa famiglia Trap.

Lineage testati:
- cinematic/street;
- bright/spacey.

Conseguenza:
Trap identity viene mantenuta tramite core anchors + Producer Decision DNA,
non obbligando sempre dark minor + bell + 808 identica.
