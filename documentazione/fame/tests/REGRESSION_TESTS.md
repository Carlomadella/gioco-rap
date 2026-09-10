# FAME REGRESSION TESTS

## TIMING

### T-001
Nessun evento fuori dalle divisioni musicali dichiarate.

### T-002
Niente accumulo floating-point di durata/tempo.

### T-003
NOTE ON e NOTE OFF derivano da tick assoluti.

### T-004
Humanize OFF nei benchmark straight.

### T-005
Un audit con 0 grid violations NON chiude automaticamente un problema di pocket.

### T-006
Automation audio di gain/filter/pitch non deve introdurre discontinuità udibili non intenzionali.

---

## TRAP HATS

### TH-001
Nessun pattern 1/16 costante per un'intera sezione salvo scelta esplicita di sottostile.

### TH-002
I roll sono locali e hanno una funzione di frase.

### TH-003
Open hat può essere choked dal closed hat.

### TH-004
Crash non viene choked dal closed hat.

### TH-005
Hat bus non deve dominare kick/snare/melody nel mix.

### TH-006
Pitch automation sugli hats non deve diventare continua/random.
Preferenza: roll, pickup, accent.

### TH-007
Rim/click è OFF di default e non deve essere aggiunto solo per riempire spazio vuoto.

### TH-008
Triplet/roll devono rispettare ornament budget e phrase role.

---

## TRAP KICK / 808

### K8-001
Il pattern kick finale deve conoscere la frase 808.

### K8-002
Ogni kick deve essere classificabile come REINFORCE, ANTICIPATE o RESPONSE.

### K8-003
Kick e 808 NON devono essere forzati 1:1.

### K8-004
Una breathe/subtract bar può avere zero kick.

### K8-005
Quando kick e 808 collidono sullo stesso attack deve esistere una collision policy.

### K8-006
SEPARATE non deve attivare ducking low-end obbligatorio.

### K8-007
Il collision manager non deve spostare gli eventi fuori griglia.

### K8-008
Il ducking non deve produrre click digitali o salti istantanei di gain.

### K8-009
Se la kick viene accorciata per lasciare sustain all'808, la coda deve avere fade-out.

---

## VIRTUAL RAP CADENCE / SPACE

### VC-001
La cadence mask non genera voce: genera solo finestre ritmiche di riferimento.

### VC-002
Gli ornament devono preferire gap / phrase boundaries rispetto a posizioni casuali.

### VC-003
Un beat non deve massimizzare note-per-second a scapito dello spazio vocale.

---

## ARRANGEMENT

### A-001
Togliere un layer non deve tagliare brutalmente release/reverb/delay.

### A-002
Un cambio sezione non deve essere ottenuto soltanto aumentando il numero di note.

### A-003
Pre-hook / transition può usare subtraction prima dell'addizione.

### A-004
La frase primaria Trap benchmark è 4-bar con memoria A/A', non nuova idea ogni barra.

---

## HARMONY / MELODY

### H-001
Le note forti devono essere coerenti con l'accordo attivo salvo tensione intenzionale.

### H-002
Il motif deve avere memoria fra A/A'/B/B'.

### H-003
Niente rigenerazione casuale completa della melodia a ogni barra.

### H-004
Dark minor NON è requisito universale della Trap.

---

## SOUND

### S-001
No ritorno a toy sine leads come qualità finale.

### S-002
Delay ritmici devono essere tempo-sync.

### S-003
Reverb/delay principali non devono spostare il dry transient.

### S-004
Rawness intenzionale non deve essere confusa con artefatti digitali o timing rotto.

---

## GENRE IDENTITY

### G-001
Ogni genere deve avere almeno 2–4 core anchors attivi.

### G-002
Non tutti gli strong/style cliches devono essere attivi nello stesso beat.

### G-003
Se due beat dello stesso genere condividono identica struttura + pattern + sound family, la variation space è insufficiente.

### G-004
Due Trap lineage diverse devono poter cambiare harmony/sound/brightness/aggression mantenendo gli anchor principali.

### G-005
Producer identity deve emergere da decision profile, non dall'uso obbligatorio dello stesso preset.
