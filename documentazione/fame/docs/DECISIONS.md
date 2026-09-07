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
