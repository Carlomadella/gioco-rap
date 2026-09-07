# FAME MASTER SPEC

Versione memoria: 1.0
Stato progetto di riferimento: V0.8 Rhythm & Arrangement Pass

---

# 1. IDENTITÀ DEL PROGETTO

FAME AI è il motore generativo musicale proprietario di Anni di Fame.

Obiettivo:
generare beat completi e credibili anche per giocatori che non sanno nulla di produzione musicale.

UX di default:

GENERE
MOOD
ENERGIA
PROMPT
[ GENERA BEAT ]

Il giocatore NON deve programmare manualmente pattern, note, accordi o automazioni.

---

# 2. PRINCIPI NON NEGOZIABILI

## 2.1 FAME è generativo, non un sequencer manuale
L'utente esprime intenzione.
FAME prende le decisioni musicali.

## 2.2 Genre grammar before randomness
Prima esiste una grammatica musicale valida.
La casualità sceglie soltanto fra opzioni compatibili.

## 2.3 Random but repeatable
Le scelte casuali importanti sono seedate.
Una buona idea resta stabile per frase/sezione.

## 2.4 Musical time before audio time
Gli eventi vivono su una timeline musicale.
Il rendering audio è l'ultimo passaggio.

## 2.5 Harmony before melody
La melodia conosce tonalità, accordo attivo e ruolo armonico.

## 2.6 Sound is animated
Un suono non è un preset immobile.
Pitch, filter, envelope, saturation, modulation e FX possono evolvere.

## 2.7 FX are part of composition
Delay, reverb, filter sweep, ducking e altri FX possono essere legati a sezione, frase o evento.

## 2.8 Negative space matters
Aggiungere più note non equivale a più energia.
FAME deve saper togliere elementi.

## 2.9 Stems first, master last
Kick, snare/clap, hats/percs, bass/808, harmony, lead, textures ed FX restano separati fino al mix.

## 2.10 No toy renderer
Lead e strumenti costruiti con oscillatori primitivi / rendering povero non sono accettabili come qualità finale.

---

# 3. ARCHITETTURA CONCETTUALE

INTENT ENGINE
↓
GENRE IDENTITY / GRAMMAR
↓
TIMING ENGINE
↓
RHYTHM ENGINE
↓
HARMONY ENGINE
↓
MOTIF / MELODY ENGINE
↓
PERFORMANCE ENGINE
↓
SOUND DNA / SOUND ENGINE
↓
FX ENGINE
↓
ARRANGEMENT ENGINE
↓
MIX ENGINE
↓
BEAT

---

# 4. TIMING

PPQ interno: 960

Divisioni:
- 1/4 = 960 tick
- 1/8 = 480 tick
- 1/16 = 240 tick
- 1/32 = 120 tick
- 1/8 triplet = 320 tick
- 1/16 triplet = 160 tick

Regole:
- niente accumulo di secondi floating-point;
- ogni evento usa coordinate musicali assolute;
- NOTE ON e NOTE OFF vanno quantizzati;
- transient alignment e plugin latency sono problemi separati dalla grid;
- humanize e swing sono OFF finché il pocket straight non è approvato.

---

# 5. DEFINIZIONE DI "QUANTIZZATO"

FAME distingue:

1. GRID POSITION
   Dove l'evento dovrebbe iniziare.

2. AUDIBLE TRANSIENT
   Dove il transiente reale del sample/synth viene percepito.

3. PROCESSING LATENCY
   Quanto synth/FX/plugin ritardano il segnale.

4. MUSICAL POCKET
   Se il pattern è musicalmente coerente col genere.

Un audit numerico può provare 1–3.
L'orecchio del tester decide 4.

---

# 6. GENRE IDENTITY

Ogni genere deve avere:

- CORE ANCHORS
  Tratti fortemente identitari.

- STRONG CLICHÉS
  Tratti frequenti ma non obbligatori.

- STYLE CLICHÉS
  Colori di epoca / sottogenere.

- VARIATION SPACE
  Tutto ciò che può cambiare senza perdere identità.

- FORBIDDEN AUTOMATISMS
  Cose che, se rese fisse, fanno sembrare tutti i beat uguali.

Per ogni regola usare:
- REQUIRED
- HIGH
- MEDIUM
- LOW
- RARE
- FORBIDDEN

L'obiettivo è identità fortissima senza standardizzazione.

---

# 7. HARMONY / COMPOSER

Pipeline:

KEY
↓
SCALE
↓
CHORD PROGRESSION
↓
VOICING / INVERSIONS
↓
VOICE LEADING
↓
BASS RELATION
↓
MOTIF A
↓
A'
↓
HOOK B
↓
B'
↓
TURNAROUND / RESPONSE

Regole:
- niente random notes dalla scala;
- strong beats preferiscono chord tones;
- passing/approach/tension tones sono intenzionali;
- motif identity deve sopravvivere alle variazioni;
- voice leading è fondamentale.

---

# 8. RHYTHM

Regole generali:
- BPM != density;
- la densità deve essere una variabile separata;
- kick e 808 non devono essere meccanicamente uno-a-uno;
- pattern pool e grammatica > pattern unico;
- delete before add;
- fill e ornamentazioni sono locali e funzionali;
- pattern tecnicamente in grid ma musicalmente sbagliati sono da rifiutare.

---

# 9. SOUND ENGINE

Un sound deve essere descritto con metadata e Sound DNA.

Esempi di dimensioni:
- brightness
- hardness
- width
- space
- distortion
- movement
- attack
- decay
- texture

Famiglie iniziali:
- dark pluck
- bell
- mallet
- analog lead
- digital lead
- pad
- keys
- guitar
- brass
- texture
- choir
- noise FX

I WAV/preset sono ingredienti, non idee musicali finite.

---

# 10. FX ENGINE

FX fondamentali:
- tempo-sync delay
- reverb send
- chorus / width
- saturation / distortion
- filter automation
- ducking / sidechain
- transition FX
- delay throw
- reverb flood

Regola:
gli FX ritmici usano divisioni musicali, non millisecondi arbitrari.

Riverbero/delay principali preferibilmente in send parallelo, così il dry transient resta sulla griglia.

---

# 11. ARRANGEMENT

La differenza fra sezioni NON deve essere soltanto "più note".

Possibili leve:
- layer on/off
- density
- register
- width
- filter
- FX sends
- bass presence
- silence/dropout
- motif variant
- crash / riser / downlifter
- delay throw
- reverb tail

Layer removal:
per togliere un layer si smette di generare nuovi eventi.
Release, delay e reverb devono poter decadere naturalmente.

---

# 12. CLEAN-ROOM / LICENSING

- Studiare tecniche è permesso.
- Reimplementare idee in codice proprietario è la strategia.
- Non copiare codice senza licenza compatibile.
- Non presumere che un repository pubblico sia liberamente incorporabile.
- Strudel / codice AGPL non va incorporato nel core closed-source senza valutazione legale specifica.
