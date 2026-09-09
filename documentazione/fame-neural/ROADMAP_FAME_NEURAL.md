# FAME Neural — Roadmap ufficiale V2

Data: 9 settembre 2026<br>
Stato: ROADMAP OPERATIVA V2 — PRECISATA DOPO AUDIT HANDOFF E SONIC PI<br>
Progetto: FAME Neural Composer

> Questa V2 sostituisce la sequenza operativa della V1 dalla FASE 7 in avanti.
> Le FASI 0–6 restano storico tecnico valido, ma alcune conclusioni vengono ristrette o reinterpretate alla luce degli audit musicali e della ricerca del 9 settembre 2026.
> Gli errori e le ipotesi falsificate NON vengono cancellati: sono parte della documentazione ufficiale per evitare regressioni concettuali.

---

# 0. Come si legge questa roadmap

Revisione documentale successiva al commit `02bc708`: [confronto handoff e roadmap](REVISIONE_HANDOFF_SONIC_PI_2026-09-09.md). Le conseguenze sono adottate in NDR-035…040. Il rapporto conserva evidenze e proposte al commit analizzato; questa roadmap e CURRENT_STATE indicano decisioni e stato correnti. La revisione non modifica il codice né chiude i gate musicali.

## Precisazioni vincolanti dall'audit del 9 settembre 2026

[Audit completo](AUDIT_ROADMAP_V2_2026-09-09.md). L'audit non sostituisce questa roadmap: le sue conseguenze operative sono registrate in NDR-028…034 e nello stato corrente.

- Una decisione accettata per procedere non equivale a efficacia sperimentale dimostrata. Architettura e soglie restano ipotesi finché il relativo confronto non le sostiene.
- La Fase 5 conserva i risultati storici, ma seleziona FAME Compound come formato comune: non dimostra una vittoria neurale generale. Vocabolario/schemi del micro-training derivati anche da validation/test e sampling unconstrained sono limiti aperti del vecchio protocollo.
- “Zero round-trip failure” significa idempotenza seriale; “8/8 feature” significa copertura del contratto; “zero group leakage” non certifica assenza di ogni forma di esposizione del test.
- Le formulazioni “FALSIFICATO” nelle lezioni storiche vanno lette nel perimetro dei test descritti. Non dichiarano impossibilità universali o proprietà di esempi non ascoltati.
- Coerenza cross-track è un obiettivo; la topologia disegnata, incluso un Refiner separato, è un'ipotesi da confrontare con alternative joint/condizionali più semplici prima di congelarne i componenti.
- Nessun gate task-specifico si chiude senza criteri e campionamento definiti prima dei risultati. I casi già usati per decidere sono sviluppo/regressione, non un nuovo test finale indipendente.

L'integrazione è documentale: lo stato delle correzioni nel codice resta esplicito in `CURRENT_STATE.md`. I benchmark storici non vengono riscritti per farli apparire conformi al nuovo protocollo.

Ogni affermazione importante deve essere classificabile come una delle seguenti:

- **VERIFICATO** — supportato da codice, dati, benchmark o ascolto documentato;
- **DECISIONE** — scelta architetturale accettata e registrata in `DECISIONS.md`;
- **IPOTESI** — plausibile ma non ancora dimostrata;
- **FALSIFICATO** — ipotesi o interpretazione contraddetta dai test;
- **APERTO** — problema noto non ancora risolto.

Una fase storicamente `COMPLETATA` significa che il suo obiettivo tecnico originale è stato chiuso.<br>
NON significa automaticamente che il suo output sia sufficiente per tutti i modelli o le fasi successive.

Regola nuova e vincolante:

**DATA READY, REPRESENTATION READY, TRAINING READY e MUSICALITY READY sono gate diversi.**

---

# 1. Regola di base

FAME Neural è un progetto separato dal vecchio FAME procedurale.

Il vecchio progetto resta congelato come:

- archivio storico;
- benchmark di confronto;
- possibile fallback;
- sorgente di idee da rivalutare quando servono.

Le sue vecchie regressioni, decisioni e vincoli NON sono automaticamente requisiti del nuovo progetto.

Nel Neural una regola diventa vincolante solo quando viene verificata nel nuovo sistema e registrata nella sua documentazione.

---

# 2. Obiettivo finale

Costruire un compositore musicale neurale capace di generare beat Trap credibili, vari, strutturati e utilizzabili per rap/freestyle, imparando dai dati invece di dipendere da una lunga catena di regole manuali.

Il diagramma seguente conserva la topologia di riferimento V2 come **ipotesi di implementazione**. I ruoli musicali non impongono altrettante reti separate: Core/Arranger, Tonal Context/Performer e Refiner devono essere confrontati con accorpamenti o alternative joint/condizionali. La coerenza si verifica già quando si introduce la seconda parte, non soltanto alla Fase 14. Il contratto dei controlli disponibili viene definito prima dei Performer, anche con un piano minimo fornito, mentre il training del Planner può restare successivo.

```text
USER INTENT
        ↓
PLANNER / STRUCTURAL PLAN
        ↓
┌───────────────────┬───────────────────┐
│                   │                   │
DRUM CORE       TONAL CONTEXT      GLOBAL CONTROL
│                   │                   │
DRUM ARRANGER       │                   │
│                   │                   │
└──────────────┬────┴──────────────┬────┘
               ↓                   ↓
        808 / LOW-END         TONAL PERFORMER
        CONDITIONED
               └──────────┬────────┘
                          ↓
                    JOINT REFINER
                 / CROSS-TRACK MODEL
                          ↓
                  CANDIDATES / SELECTOR
                          ↓
                  SYMBOLIC SEQUENCE
                          ↓
                       RENDERER
                          ↓
                     STEMS / WAV
```

Principio fondamentale:

**l'ordine di runtime non impone l'ordine di training.**

Il Planner può essere eseguito per primo nel prodotto finale ma addestrato dopo i Performer, usando strutture e target estratti da musica reale.

Il progetto deve prima dimostrare di saper produrre 8 barre musicalmente credibili e rappabili. Solo dopo scala a forma lunga, altri generi e integrazione nel gioco.

---

# 3. PROTOCOLLO OBBLIGATORIO DI RICERCA — INIZIO E FINE DI OGNI BLOCCO

Questa procedura è parte della roadmap e non è opzionale.

## 3.1 Ricerca di apertura — prima di implementare un nuovo blocco

Prima di codice, training, dataset expansion o decisioni architetturali significative:

1. verificare la repository e lo stato reale del blocco precedente;
2. elencare la domanda tecnica/musicale precisa del blocco;
3. elencare le assunzioni che stiamo per fare;
4. fare una ricerca approfondita e aggiornata sull'argomento;
5. consultare, quando pertinenti:
   - paper e atti scientifici;
   - documentazione ufficiale di dataset e modelli;
   - implementazioni open source verificabili;
   - benchmark e ablation;
   - failure report / limitations;
   - licenze e condizioni d'uso dei dati;
   - lavori più recenti e lavori fondativi ancora rilevanti;
6. confrontare almeno un approccio alternativo a quello che stiamo considerando;
7. verificare scala dei dataset e dei modelli usati nei lavori comparabili;
8. verificare se la nostra rappresentazione conserva davvero le informazioni necessarie al task;
9. classificare ogni assunzione come:
   - verificata;
   - supportata ma non dimostrata;
   - aperta;
   - in conflitto con evidenze;
10. solo dopo definire implementazione, benchmark e gate del blocco.

Output minimo della ricerca di apertura:

- cosa sappiamo;
- cosa non sappiamo;
- cosa sta facendo lo stato dell'arte;
- quali failure mode sono già note;
- quali nostre assunzioni rischiano di essere sbagliate;
- cosa misurerà il blocco per distinguere le alternative.

## 3.2 Ricerca di chiusura — prima di dichiarare chiuso un blocco

Dopo i test e PRIMA di chiudere il blocco:

1. confrontare i risultati reali con l'ipotesi iniziale;
2. cercare nuovamente letteratura, implementazioni e failure mode usando ciò che abbiamo appena osservato;
3. verificare se durante il blocco sono emersi concetti che nella ricerca iniziale non avevamo considerato;
4. confrontare i nostri numeri con scale e risultati di lavori comparabili;
5. controllare se una metrica che sembrava positiva misura davvero la proprietà che ci interessa;
6. distinguere:
   - successo tecnico;
   - successo statistico;
   - successo musicale;
   - successo di dominio Trap/Rap;
7. registrare esplicitamente risultati negativi e ipotesi falsificate;
8. aggiornare `ROADMAP_FAME_NEURAL.md`, `CURRENT_STATE.md` e, quando cambia una regola, `DECISIONS.md`;
9. non chiudere il gate musicale senza ascolto umano quando la proprietà target è musicale;
10. non trasformare un risultato locale in regola generale senza evidenza sufficiente.

## 3.3 Regola anti-oblio

Una conclusione sbagliata non viene rimossa come se non fosse mai esistita.

Si registra:

```text
ASSUNZIONE INIZIALE
→ TEST
→ RISULTATO
→ PERCHÉ ERA INSUFFICIENTE/ERRATA
→ NUOVA REGOLA
```

Lo storico degli errori è parte del sistema di qualità del progetto.

---

# 4. REVISIONE CRITICA DEL PRIMO CICLO — COSA ABBIAMO IMPARATO

Questa sezione è vincolante per i blocchi futuri.

## 4.1 “Gate 1 DATA READY = corpus pronto ad addestrare un composer”

**FALSIFICATO come interpretazione generale.**

Il Gate 1 ha correttamente verificato:

- importer;
- provenance;
- diritti;
- dedup;
- composition family;
- split/leakage;
- integrità tecnica.

Ma è stato interpretato troppo largamente come “corpus musicalmente pronto”.

Audit successivo delle 502 phrase effettive:

- `TONAL_ONLY`: 307;
- `DRUMS_ONLY`: 57;
- `FULL_LAYERED`: 53;
- `DRUMS_TONAL`: 38;
- `LOWEND_TONAL`: 22;
- `DRUMS_LOWEND`: 21;
- `LOWEND_ONLY`: 4.

Solo 53/502 erano diagnosticate come `FULL_LAYERED`.

Di quelle 53:

- 47 provenivano da `fame-original-seed-v1`;
- 6 da PDMX.

Nuova regola:

**Gate 1 viene rinominato concettualmente “PIPELINE / DATA ENGINEERING READY”.<br>
Ogni modello ha poi un proprio TASK DATA READY gate.**

---

## 4.2 “Coverage drums/808/harmony/lead significa che il corpus contiene beat completi”

**FALSIFICATO.**

Le coverage aggregate dicono che i ruoli esistono da qualche parte nel corpus, non che coesistano nello stesso esempio né che gli esempi siano musicalmente completi.

Esempio verificato:

- GMD: 57/57 phrase `DRUMS_ONLY`;
- WaivOps NRG-CP: 129/129 `TONAL_ONLY`;
- `free-midi-chords`: 2/2 `TONAL_ONLY`;
- PDMX: prevalentemente materiale tonal/general symbolic;
- Hip Hop Drummer: materiale role-specific/misto, non full beat;
- `fame-original-seed-v1`: 47 `FULL_LAYERED`, ma qualità musicale fallita al gate umano.

Nuova regola:

**Ogni record deve avere `contentCapabilities` / ruolo d'uso esplicito.<br>
Un corpus multi-source non viene trattato come insieme omogeneo di “beat”.**

---

## 4.3 “fame-original-seed-v1 può rappresentare il full-arrangement corpus”

**FALSIFICATO dal gate umano.**

Blind review full-layer:

- 10 esempi deterministici `fame-original-seed-v1`: giudicati come materiale messo a caso;
- tutti i 6 PDMX `FULL_LAYERED`: riconosciuti come musica coerente;
- 2/6 PDMX anche giudicati rappabili;
- 4/6 PDMX musicalmente coerenti ma non rappabili.

Nuova regola:

`fame-original-seed-v1` resta utile per:

- debug;
- grammatica;
- determinismo;
- encode/decode;
- smoke test.

NON viene usato come insegnante di qualità musicale o full arrangement salvo futura rivalidazione umana esplicita.

**Sintetico tecnicamente valido ≠ esempio musicale valido.**

---

## 4.4 “Una review umana positiva dell'annotatore dimostra che il corpus è musicalmente buono”

**FALSIFICATO come interpretazione.**

La review FASE 4 ha verificato soprattutto coerenza delle annotazioni e usabilità locale delle phrase.

Non era un blind listening gate sistematico su:

- rappabilità;
- groove;
- qualità compositiva;
- dominio Trap;
- completezza del beat.

Nuova regola:

**annotation QA e musical corpus QA sono due gate separati.**

---

## 4.5 “FAME Compound / quantizzazione è probabilmente la causa del caos”

**FALSIFICATO come causa principale.**

A/B Canonical → FAME Compound su casi problematici:

- le versioni sono state percepite come fondamentalmente uguali;
- eventuali differenze timbrico/pitch percepite non spiegano il caos compositivo.

Il codice continua a quantizzare onset/duration e velocity, quindi la representation può essere migliorata per task specifici, ma non è supportato attribuirle il fallimento musicale principale osservato.

Nuova regola:

**non riprogettare FAME Compound per correggere un problema che esiste già nel materiale sorgente.**

---

## 4.6 “Eliminare `perc` sistemerà gran parte del groove”

**FALSIFICATO dal blind A/B.**

Test `FULL` vs `NO_PERC` sui casi selezionati:

- 4 giudizi `UGUALI`;
- 4 `NESSUNO`;
- 1 preferenza chiara `NO_PERC`;
- 1 preferenza chiara `FULL`;
- casi restanti misti/qualitativi.

Quindi `perc` non è la causa generale.

Resta però un problema di rappresentazione reale:

più classi GM — tom, crash, ride e altre percussion — possono collassare in `perc`, perdendo identità strumentale.

Nuova regola:

**non cancellare `perc`; preservare meglio le classi di batteria nel Drum View V2.**

---

## 4.7 “4 barre sono una phrase universale”

**NON DIMOSTRATO; decisione sospesa.**

Il phrase builder V1 crea finestre fisse 4/8/16 e nel corpus corrente le 502 phrase effettive sono tutte native 4-bar.

Questo può produrre:

- boundary non musicali;
- riattacchi artificiali;
- loop che non erano loop;
- separazione tra core e fill;
- perdita della continuità di performance.

Il test 4-bar loop vs 8-bar contiguous è diagnostico ma NON decide da solo la rappresentazione futura.

La ricerca indica che per i drum è spesso più utile distinguere:

- unità loopabile/core;
- variazione;
- fill;
- struttura multi-bar;

piuttosto che imporre una sola lunghezza universale.

Nuova regola:

**lunghezza finestra e boundary sono proprietà del task, non una costante globale.**

---

## 4.8 “Passare semplicemente da 4 a 8 barre risolve la frase musicale”

**NON DIMOSTRATO.**

8 barre sono il nostro primo scope compositivo globale, non necessariamente l'unità ideale per ogni sottotask.

Architettura prevista:

- Drum Core: finestra breve e realmente loopabile, da determinare con dati;
- Drum Arranger: 8 barre con variazioni/fill;
- Planner: 8 barre di struttura;
- altri Performer: finestra coerente con il proprio compito.

La durata esatta di Drum Core resta un parametro da benchmarkare; 2 barre sono una forte baseline di ricerca, non un dogma.

---

## 4.9 “GMD è materiale Trap”

**FALSIFICATO come interpretazione di dominio.**

GMD è una sorgente di performance di batteristi umani multi-stile.

Il nostro filtro hip-hop produce ottimo materiale di groove umano, ma l'ascolto ha evidenziato anche:

- feeling live;
- boom bap;
- pattern non specificamente Trap moderna.

Nuovo ruolo:

**GMD = pretraining / apprendimento del groove e della performance umana.<br>
NON = ground truth stilistico Trap sufficiente.**

La specializzazione Trap richiede corpus Trap/Drill specifico e relativo human gate.

---

## 4.10 “Se il retrieval ha distanza bassa e same-lineage alto, il groove è musicalmente corretto”

**FALSIFICATO come interpretazione delle metriche.**

Drum Retrieval Control V1:

- 116 groove eleggibili;
- 60 gruppi;
- sorgenti: GMD 57, Hip Hop Drummer 49, PDMX 10;
- split 99/6/11;
- leakage 0;
- valid 11/11;
- distance mean/P95 `0.031031 / 0.049612`;
- same-lineage 1.0;
- 10 template unici su 11.

Blind listening:

- retrieval preferito: 4;
- originale preferito: 3;
- entrambi: 2;
- nessuno: 2.

Conclusione:

le metriche dimostrano correttezza tecnica e compatibilità del retrieval, non qualità musicale.

Inoltre lineage generico/default non può essere interpretato come prova di vera vicinanza stilistica.

Nuova regola:

**metriche automatiche devono dichiarare esattamente quale proprietà misurano e quale NON misurano.**

---

## 4.11 “Constrained recombination / donor switching aumenta la generatività senza perdere musica”

**FALSIFICATO dal gate umano per l'uso come strada principale.**

Il constrained V1 era tecnicamente molto pulito:

- valid 43/43;
- leakage 0;
- exact train phrase 0;
- exact train bar 0/172;
- unique 43/43;
- Plan MAE 0 per costruzione.

Ma l'ascolto mostrava materiale assemblato e casuale.

Esperimento Coupled Block V2:

- preservava blocchi coerenti da 2 barre;
- migliorava varie metriche automatiche;
- non ha superato il retrieval al blind gate.

Blind A/B/C su 5 casi:

- Retrieval preferito: 3;
- Coupled: 1;
- Constrained: 0;
- nessuno: 1.

Nuova regola:

**interdipendenze musicali non vanno ricostruite combinando indipendentemente parti statisticamente compatibili.**

---

## 4.12 “Separare Drum / 808 / Tonal significa generarli indipendentemente”

**FALSIFICATO come architettura finale.**

La separazione dei domini di competenza è utile.

L'indipendenza musicale no.

Nuova architettura:

- Drum Performer può essere specializzato;
- 808 Performer deve vedere drums e contesto armonico;
- Tonal Performer deve vedere harmony/motif e struttura;
- serve un livello cross-track/joint per mantenere coerenza.

Regola:

**specializzazione sì; isolamento no.**

---

## 4.13 “Il Planner deve essere addestrato per primo perché nel runtime viene prima”

**FALSIFICATO come necessità.**

Profiler Planner sul corpus corrente:

- 502 phrase native da 4 barre;
- 124 coppie adiacenti 4+4 candidate;
- 92 coppie 8-bar non-overlap;
- split 71/13/8;
- 68 gruppi;
- leakage 0;
- 736/736 barre con i campi diretti misurati.

Il contratto è tecnicamente costruibile, ma **71 esempi train sono insufficienti per un serio Neural Planner da zero**.

Inoltre molti target high-level sono euristici, non ground truth.

Nuova regola:

**Planner runtime-first, training-later.**

Possiamo prima addestrare Performer su condizioni estratte da musica reale, poi addestrare il Planner a produrre strutture realmente osservate e validate.

---

## 4.14 “energy/tension/vocalSpace euristici sono target musicali sufficienti per il Planner”

**NON ACCETTATO.**

NDR-011 li definisce già feature euristiche ausiliarie con confidence.

Una rete addestrata a riprodurli può imparare la nostra euristica anziché un concetto musicale reale.

Planner V0 dovrà privilegiare target osservabili e verificabili:

- section/function;
- strumenti/ruoli attivi;
- pattern family;
- repeat/variation;
- fill;
- density;
- harmonic rhythm;
- motif return;
- transition;
- relazioni temporali.

Energy, tension, mood e vocal space possono restare conditioning/feature ausiliarie finché non esiste ground truth migliore.

---

## 4.15 “PDMX rights-safe + dedup + valid + selezione deterministica = buon corpus musicale”

**FALSIFICATO come sufficienza.**

Il selector PDMX corrente garantisce:

- `no_license_conflict`;
- `deduplicated`;
- `all_valid`;
- selezione deterministica.

Non usa come gate musicale:

- rating;
- numero di rating;
- genre/tag;
- instrumentation relevance;
- qualità percepita;
- rappabilità.

Il blind full-layer test ha mostrato che i 6 casi full-layer PDMX erano musicalmente coerenti, ma solo 2 erano chiaramente rappabili.

Nuova regola:

**PDMX va selezionato in modo quality-aware e role-aware, non soltanto rights-safe.**

---

## 4.16 “Una quota sintetica globale è una garanzia sufficiente”

**FALSIFICATO come criterio di qualità.**

Il vecchio advisory 40% resta utile come guardia di governance, ma non dice se il sintetico è musicalmente valido nel task specifico.

Nuova regola:

per ogni task si misura separatamente:

- quota sintetica;
- diversità reale;
- origine dei pattern;
- qualità umana;
- indipendenza tra famiglie;
- utilità per quel ruolo.

Il sintetico può essere:

- debug;
- augmentation;
- pretraining;
- training target;

solo dopo classificazione esplicita.

---

# 5. PRINCIPI DATASET V2

Il corpus non è più trattato come un unico sacco di phrase.

Ogni record deve esporre capacità e provenienza d'uso.

## 5.1 Content roles minimi

- `DRUM_GROOVE`
- `DRUM_FILL`
- `LOW_END`
- `TONAL_HARMONY`
- `TONAL_MELODY`
- `FULL_ARRANGEMENT`
- combinazioni esplicite quando realmente presenti

Le role label diagnostiche derivate da conteggi NON sono ground truth di qualità; servono a impedire misuse.

## 5.2 Assi di qualità separati

Per ogni sorgente/task:

1. legal/provenance ready;
2. technically valid;
3. leakage/dedup safe;
4. role-correct;
5. style/domain-correct;
6. musically coherent;
7. target-useful/rappable;
8. sufficient scale/diversity.

Un record può passare 1–4 e fallire 5–8.

## 5.3 Regola source-aware

Esempi:

- GMD → human groove / performance;
- Hip Hop Drummer → synthetic/rule-generated role augmentation;
- WaivOps NRG-CP → tonal material;
- PDMX → general symbolic / arrangement / harmony, con quality-aware selection;
- `fame-original-seed-v1` → debug/grammar, non musical target;
- HH-TRP → candidate Trap drum source da auditare prima dell'intake.

Non si interpreta più l'assenza di 808/harmony in GMD come corruzione: è coerente con il ruolo della sorgente.

---

# 6. PRINCIPI DI RAPPRESENTAZIONE V2

## 6.1 FAME Compound resta la lingua comune

`fame-compound-v1` NON viene revocata.

Resta:

- formato comune neurale;
- formato di interoperabilità;
- baseline comparabile;
- rappresentazione compatta di sequenze multi-ruolo.

Ma non è obbligatorio che sia la vista ottimale per ogni singolo Performer.

## 6.2 Task-specific views

Sono ammesse e, quando giustificate, richieste viste specializzate derivate dal canonico.

Primo caso:

### Drum View V2

Deve valutare la conservazione di:

- instrument class;
- hit/no-hit;
- velocity;
- posizione metrica stabile;
- microtiming/offset rispetto alla griglia;
- simultaneità tra voci;
- fill/core distinction;
- loopability/boundary;
- provenance e group identity.

Da non ripetere:

- generare kick/snare/hats da pool indipendenti;
- perdere tom/ride/crash dentro un unico `perc` se il dato sorgente li distingue;
- eliminare il microtiming utile solo per adattarsi a una tokenizzazione generica.

## 6.3 Common format ≠ model view

La conversione deve essere tracciabile:

La sorgente preservata, con provenance e payload di fedeltà quando necessario, alimenta due derivazioni tracciabili:

- rappresentazione comune per interoperabilità e benchmark;
- Task View con l'informazione richiesta dal modello.

Il passaggio attraverso una versione già quantizzata o impoverita NON è obbligatorio per costruire la Task View. Un'estensione versionata del canonico e un sidecar sono alternative da verificare con prove di collegamento e compatibilità. Conservare gli originali non implica introdurre subito tutti i loro campi nel modello.

Nessuna Task View può inventare ground truth non presente.

---

# 7. PRINCIPI DI APPRENDIMENTO

## 7.1 Scala prima della fiducia

Dataset da decine/centinaia di esempi possono servire per:

- smoke test;
- overfit test;
- pipeline validation;
- ablation;
- prototipi.

Non vengono considerati automaticamente sufficienti per un modello generativo generalizzabile addestrato da zero.

Prima di un training serio si confronta la nostra scala con lavori comparabili nella ricerca di apertura.

## 7.2 Pretraining e specialization

Quando il task lo consente:

```text
ampio corpus generale / umano
→ apprendimento della competenza di base
→ corpus specifico Trap
→ specialization / fine-tuning
→ human gate
```

Esempio previsto drums:

```text
GMD / groove umano ampio
→ Drum Core general groove
→ Trap/Drill-specific corpus
→ specialization
```

## 7.3 Synthetic data

Synthetic data NON viene usato per far sembrare grande un corpus piccolo.

Può essere usato solo con ruolo dichiarato:

- test/debug;
- augmentation;
- negative/control;
- training, se supera gate musicale e di diversità.

## 7.4 Capacità del modello

Il primo modello di ogni nuovo task deve essere piccolo, interpretabile e sufficiente a falsificare l'ipotesi.

Niente modello enorme finché dati, task view e baseline non mostrano learning signal credibile.

## 7.5 Human judgment

NDR-006 viene rafforzata:

loss, perplexity, MAE, valid rate, exact-match, warning count, diversity e retrieval distance sono diagnostiche.

Non sostituiscono:

- groove;
- rappabilità;
- intenzionalità;
- continuità;
- identità Trap;
- percezione di “composto” vs “assemblato”.

---

# 8. FASI 0–6 — STORICO TECNICO E INTERPRETAZIONE CORRETTA

# FASE 0 — Fondazione e separazione

Stato: **COMPLETATA**

Resta valida integralmente:

- progetto autonomo;
- PoC0 congelato;
- roadmap/decision/test separati;
- legacy non vincolante.

---

# FASE 1 — Linguaggio dei dati

Stato: **COMPLETATA PER IL CONTRATTO V1 — HARDENING TASK-SPECIFIC APERTO**

Risultati validi:

- schema FAME Neural;
- 960 PPQ;
- tonality separata da harmony;
- event stream;
- 808 glide;
- deterministic simultaneous event ordering;
- encode/decode;
- grammar;
- triplet/duration;
- conditioning discretizzato.

Correzione V2:

la frase storica “senza perdere informazione musicale importante” NON viene interpretata come dimostrata per ogni task.

Il Drum View V2 deve verificare specificamente:

- microtiming;
- classi drum;
- boundary/loopability.

---

# FASE 2 — Pipeline MIDI e provenienza

Stato: **COMPLETATA**

Restano validi:

RAW MIDI<br>
→ PARSER<br>
→ NORMALIZER<br>
→ TRACK CLASSIFIER<br>
→ ANALYZER<br>
→ RIGHTS/PROVENANCE<br>
→ DATASET ITEM

Gate reale GMD dell'8 settembre 2026:

- 6/6 item validi;
- 6 composition family;
- 6 canonical sequence;
- 0 duplicate SHA esatte.

Correzione V2:

import correctness non equivale a domain correctness.

---

# FASE 3 — Dataset Auditor e corpus iniziale

Stato storico: **COMPLETATA — GATE 1 SUPERATO**

Nuova interpretazione ufficiale:

**GATE 1 = PIPELINE / DATA ENGINEERING READY.**

Dati storici:

- 504 phrase;
- 285 composition family;
- 6 source collection;
- coverage drums/808/harmony/lead `170/101/394/76`;
- pitchedAny 447;
- synthetic share 45.04%;
- PDMX share 43.25%;
- 2 exclusion overlay umane;
- 502 candidate effettive successive.

Source Registry resta valido:

- GREEN/YELLOW/RED;
- license code/dataset/output separate;
- rights e commercial training/output;
- hash/cache;
- provenance;
- adapter;
- dedup;
- per-file evidence.

Storico source expansion da preservare:

- WaivOps NRG-CP: integrato come sorgente pitched/tonal;
- Hip Hop Drummer: integrato come role closer sintetico controllato;
- commit HHD pin: `4cbf33aef786338b5a991e716fb82879fe47a6c7`;
- HHD generato con seed deterministici, real-import preflight, dedup conservativo e cap 20%;
- corpus intermedio dopo NRG-CP + HHD: 370 phrase, 233 composition family, 6 source collection;
- coverage intermedia drums/808/harmony/lead: `161/82/264/76`;
- pitchedAny intermedio: 313;
- il sintetico non doveva essere usato per gonfiare artificialmente il target 500: principio ancora valido, ma oggi sappiamo che anche una quota formalmente limitata può essere musicalmente dannosa se domina un ruolo specifico.

Correzione V2:

Gate 1 NON certifica più:

- Trap readiness;
- full-arrangement readiness;
- Planner readiness;
- Performer readiness;
- musicality.

Questi diventano gate task-specifici.

---

# FASE 4 — Annotazione musicale automatica

Stato: **COMPLETATA — ANNOTATORE V1 CONGELATO COME AUXILIARY FEATURE SYSTEM**

Risultati storici:

- 504/504 annotate;
- 0 failure;
- QA invarianti 0 violazioni;
- 75 phrase con kick↔808 disponibile;
- annotazioni deterministiche;
- review umana 22/22;
- 19 coerenti;
- 2 exclusion;
- 1 sovrastima tension;
- 95% agreement sulle phrase usabili.

Resta valida NDR-011:

**le label sono euristiche con confidence, non ground truth.**

Correzione V2:

non possono diventare automaticamente target supervisionati del Planner.

---

# FASE 5 — Scelta della rappresentazione neurale

Stato: **COMPLETATA — FAME COMPOUND V1 SELEZIONATA COME COMMON REPRESENTATION**

Benchmark storico:

| Representation | unit/bar mean | P95 | RT fail | FASE4 coverage |
|---|---:|---:|---:|---:|
| flat-poc-v1 | 116.125996 | 187.75 | 110 | 3/8 |
| remi-plus-v1 | 101.281375 | 164.975 | 0 | 0/8 |
| compound-word-v1 | 20.191235 | 35.975 | 0 | 4/8 |
| fame-compound-v1 | 20.229084 | 35.975 | 0 | 8/8 |

Micro-training storico:

- flat: 691.518 MiB / 1063.191 bars/s / 267.438852 bits-bar / invalid 6/12;
- REMI+: 707.267 MiB / 1438.365 bars/s / 241.336572 bits-bar / invalid 11/12;
- Compound Word: 137.539 MiB / 557.856 bars/s / 191.268692 bits-bar / invalid 12/12;
- FAME Compound: 144.136 MiB / 359.363 bars/s / 205.256405 bits-bar / invalid 12/12.

41/41 invalid sample auditati erano grammar/state failure da sampling unconstrained.

Correzione V2:

FAME Compound è **common representation**, non obbligo per tutte le Task View.

---

# FASE 6 — Baseline semplice

Stato: **COMPLETATA — BASELINE TECNICHE CONGELATE, INTERPRETAZIONE MUSICALE CORRETTA**

Retrieval V1:

- split 401/58/43;
- valid 43/43;
- leakage 0;
- plan MAE `0.031008 / 0.047619`;
- 39 template unici / 43;
- max reuse 2;
- 18 warning `DENSITY_VS_VOCAL_SPACE` su 5 sample.

Constrained V1:

- valid 43/43;
- donor leakage 0;
- plan MAE 0 per costruzione;
- exact phrase 0;
- exact bar 0/172;
- unique 43/43;
- 225 donor groups;
- donor groups medi 45.9302 per generazione;
- 21 warning su 10 sample: 14 `DENSITY_VS_VOCAL_SPACE`, 7 `ABRUPT_808_GRAMMAR_SHIFT`.

Post-hoc musical gate:

- Constrained non promosso musicalmente;
- Coupled Block V2 sperimentale non promosso;
- Retrieval resta il controllo musicale più forte tra questi tre.

Nuova interpretazione:

**FASE 6 dimostra che la pipeline di benchmark funziona; non dimostra che il corpus sia pronto per il Neural.**

---

# 9. FASE 7 — TASK DATA RESET + DRUM DATASET V2

Stato: **CORRENTE**

Questa fase sostituisce il vecchio “Neural Planner V0” come prossimo intervento.

Il Planner non viene cancellato: viene rinviato finché esistono dati strutturali sufficienti.

## Obiettivo

Costruire il primo corpus realmente task-specifico e musicalmente difendibile.

## 7A — Content capabilities ufficiali

**Stato: COMPLETATA NEL SUO SCOPE dopo il Blocco 4.**

La 7A dispone ora del percorso completo necessario prima della costruzione del Drum Dataset V2:

- content capabilities/evidence separate da schema e rights;
- distinzione source record / source collection con risoluzione deterministica;
- Task Admissibility Gate fail-closed con `allowed | blocked | unknown`;
- enforcement sul nuovo export Phase 7: soltanto `allowed` entra nel manifest;
- source fidelity drum preservata prima della normalizzazione lossy;
- linkage deterministico dataset item → source event → phrase slice;
- `fame-neural-sequence-v1` resta common representation compatibile e non viene gonfiato con payload raw.

Verifica reale source fidelity su GMD:

- 6/6 MIDI reali importati;
- 2382 raw drum events preservati;
- 2382 canonical drum events corrispondenti;
- 35/35 phrase con source fidelity;
- canonical V1 non contiene la MIDI note drum originale e non viene usato per ricostruirla.

La 7A chiude quindi il **contratto e la pipeline di controllo**, non il gate `DRUM DATA READY V2`. Le 502 phrase storiche restano storiche e non vengono reinterpretate come se avessero source fidelity. La Fase 7 continua con 7C–7G: Drum View V2, scala/diversità, GMD expansion, Trap specialization, quality/domain evidence, boundary/loopability e human gate.

## 7B — `fame-original-seed-v1`

Policy:

`DEBUG_SYNTHETIC_ONLY` salvo nuova review esplicita.

La verifica reale del Blocco 3 conferma che le 47 phrase seed risultano `debug=allowed` e possono entrare nel task `debug-smoke-v1`; non sono un training task e `trainingReady` è quindi N/A. Nessuna phrase seed viene promossa a pretraining o musical target.

Il nuovo selettore richiede permesso positivo per il proprio uso: assenza di policy, `candidate` o `unknown` non diventano autorizzazione implicita. Il seed continua a non contribuire ai gate musicali full-arrangement.
## 7C — Drum Dataset V2

Costruire una vista drum dedicata con:

- voci drum separate;
- simultaneous joint frame;
- velocity;
- griglia metrica + microtiming offset quando disponibile;
- fill flag;
- loop/core candidate;
- source/style metadata;
- group leakage-safe;
- boundary metadata.

## 7D — Espansione GMD

Usare una porzione molto più ampia del dataset disponibile per apprendere groove umano.

Ruolo:

`GENERAL_HUMAN_GROOVE_PRETRAIN`.

L'hip-hop subset può essere specialization intermedia, ma non viene etichettato automaticamente Trap.

## 7E — Trap-specific drum source

Candidate primaria da auditare:

**WaivOps HH-TRP**

Da verificare con procedura completa:

- licenza/dataset rights;
- natura sintetica/algoritmica;
- diversità reale;
- qualità blind di almeno un campione significativo;
- possibilità di ottenere pattern simbolici originali;
- in alternativa fattibilità audio→drum transcription;
- rischio di replicare l'errore “pochi pattern + molta combinazione”.

Nessun intake prima del gate.

## 7F — PDMX quality-aware

Revisione selector:

- mantenere rights-safe;
- dedup;
- all-valid;
- aggiungere quality/relevance quando disponibili:
  - rating;
  - number of ratings;
  - genre/tags;
  - instrumentation;
  - role relevance;
  - human audit.

La selezione hash resta utile per determinismo, non per qualità.

## 7G — Boundary / loopability

Chiudere il test in corso 4-bar loop vs 8-bar contiguous come diagnostica.

Poi implementare un criterio di boundary/loopability task-specifico invece di scegliere una durata solo per convenzione.

## Fattibilità delle fasi successive e piste candidate

Prima di impegnare il progetto nell'intera catena di modelli, verificare la disponibilità di sequenze continue e di parti drums/808/armonia realmente abbinate per le Fasi 9–12. Dataset separati per ruolo non costituiscono da soli supervisione delle loro interazioni. Registrare pool, diritti, famiglie indipendenti e qualità; se insufficienti, dichiarare il collo di bottiglia e valutare acquisizione mirata o trasferimento compatibile.

Sonic Pi resta una **sorgente programmatica candidata di ricerca**, non una nuova fase né un prerequisito generale. Un pilot isolato richiede scope, budget, fixture ammissibili, stato iniziale, versione runtime e gate di fedeltà dichiarati. Eventi e controllo restano separati; niente nuove capability o modifica obbligatoria del canonico prima della prova. Il confronto musicale più naturale è nella Fase 9 e segue NDR-038/039. Dettagli e limiti: [rapporto di revisione](REVISIONE_HANDOFF_SONIC_PI_2026-09-09.md).

## Gate FASE 7 — DRUM DATA READY V2

Prima dell'esecuzione del gate fissare pool ammissibile, unità indipendente/famiglia, split, regole di campionamento, numerosità, criteri di qualità e trattamento degli incerti. “Abbastanza grande” e “quota sufficiente” sotto sono obiettivi da rendere operativi, non soglie già definite. Label diretti, label di fonte, inferenze e review devono essere distinguibili (NDR-032…034).

Non si passa a training serio finché:

- corpus drum è abbastanza grande rispetto ai benchmark comparabili;
- source roles sono corretti e il percorso reale di selezione/export applica gli usi consentiti;
- leakage 0;
- instrument identity/microtiming policy è definita;
- loop/core/fill policy è definita;
- Trap specialization source ha superato human audit;
- blind sample audit mostra una quota musicalmente utile sufficiente;
- la ricerca di chiusura non evidenzia un buco architetturale grave.

---

Le attività della Fase 7 sono valutate per il task che supportano. Una prova tecnica circoscritta può usare un pool già ammissibile, con scope esplicito; non equivale all'apertura del training serio né alla promozione Trap. PDMX tonale e Sonic Pi non sono automaticamente prerequisiti di ogni prova drum. Il gate completo sopra resta necessario per la promozione prevista: nessuna separazione informale permette di saltarlo.

# 10. FASE 8 — DRUM CORE V0

Stato: **DA FARE**

## Obiettivo

Imparare un groove drum coerente, loopabile e con relazioni simultanee tra voci.

## Principi

- niente sampling indipendente di kick/snare/hat;
- modello joint sulle voci;
- preservare velocity;
- preservare timing feel;
- pretraining generale + specialization Trap quando utile;
- masked/bidirectional da confrontare con autoregressive, non assunto a priori.

## Scope

Finestra corta task-specifica.

Baseline forte da testare: 2 barre, ma la ricerca di apertura deve riconfermarla.

Prima del confronto fissare input disponibili all'inferenza, vista, baseline, split, budget e criteri di stop. Primo confronto limitato, per esempio autoregressivo vs masked con informazione equivalente; diffusion è un'alternativa quando risponde a una domanda concreta. Confrontare pretraining generale con baseline pertinente e misurare separatamente qualità generale e dominio Trap. Nessuna superiorità è presunta.

## Human gate

Valutare:

- groove;
- loopability;
- pocket;
- trap identity;
- eccesso di live feel;
- fill accidentali;
- rappabilità indiretta.

---

# 11. FASE 9 — DRUM ARRANGER 8 BAR

Stato: **DA FARE**

## Obiettivo

Trasformare Drum Core in 8 barre intenzionali.

Deve imparare:

- repetition;
- variation;
- fill;
- break;
- build;
- turnaround;
- ritorno del core;
- continuità tra boundary.

Il modello non deve cambiare donor ogni 2 barre solo per aumentare diversità.

Prima di congelare un Arranger separato, confrontare Core+Arranger con un modello condizionato unico sulle otto barre. Servono sequenze continue con evidenza delle variazioni e dei confini. Il pilot Sonic Pi, se giustificato, confronta eventi/controlli comuni, descrittori semplici e program trace sugli stessi esempi e sulle stesse famiglie. Il trace del bersaglio completo non può essere presentato come input autonomamente disponibile alla generazione.

Gate:

8 barre drum devono sembrare una performance/produzione intenzionale, non segmenti incollati.

---

# 12. FASE 10 — TONAL CONTEXT V0

Stato: **DA FARE**

## Obiettivo

Costruire contesto armonico/motivico affidabile da corpus role-correct.

PDMX e altre fonti general symbolic possono servire qui dopo quality-aware selection.

Separare:

- tonality;
- harmonic progression;
- harmonic rhythm;
- motif;
- melody intent.

Non chiamare “Trap” materiale generale solo perché tecnicamente compatibile.

---

# 13. FASE 11 — 808 / LOW-END PERFORMER V0

Stato: **DA FARE**

## Obiettivo

Generare low-end condizionato sulle parti che gli danno significato.

Input minimo:

- drums;
- kick positions/roles;
- harmony/tonality;
- structural section;
- style/BPM.

Da apprendere:

- onset relation con kick;
- anticipi/ritardi;
- pause;
- note;
- glide;
- contour;
- register.

Regola:

**808 Performer non è indipendente dal drum groove.**

Il primo benchmark richiede parti abbinate: confrontare con contesto drums/armonia fissato e poi con contesto generato. Misurare già qui l'interazione; la Fase 14 non è una promessa di riparazione successiva. Il ruolo `lowEnd` nel canonico non certifica da solo articolazione, glide o identità di una vera parte 808.

---

# 14. FASE 12 — TONAL PERFORMER V0

Stato: **DA FARE**

## Obiettivo

Produrre harmony/melody/lead coerenti con:

- tonal context;
- drums;
- low-end;
- structure;
- vocal space.

Il modello può essere specializzato ma deve ricevere contesto cross-track. Valutare accorpamenti con Tonal Context o generazione joint quando i dati lo consentono. Il gate comprende l'effetto sul beat completo e lo spazio per la voce; la qualità della traccia isolata non è sufficiente.

---

# 15. FASE 13 — NEURAL PLANNER V0

Stato: **RINVIATA FINO AI GATE PRECEDENTI**

Il training del Planner torna qui; il contratto dei controlli viene definito prima dei Performer. Per ciascun controllo dichiarare se è fornito, estratto da una sorgente disponibile o generato. Valutare separatamente contesti reali e generati. Un piano minimo manuale/predefinito è una baseline di controllo, non ground truth musicale inventata. La necessità di una rete Planner separata resta da confrontare con alternative più semplici.

## Obiettivo

Generare la struttura 8-bar che nel runtime precederà i Performer.

## Target preferiti

Prima target osservabili:

- section/function;
- active roles;
- repeat/variation;
- pattern family;
- fill;
- density;
- harmonic rhythm;
- motif return;
- transitions.

Feature euristiche:

- energy;
- tension;
- vocalSpace;
- mood;

restano ausiliarie finché non hanno ground truth adeguata.

## Tre test musicali minimi da preservare dal piano V1

- hook-first aggressivo;
- verse-first rappabile;
- melodic Trap.

Questi test restano validi come scenari, ma non bastano da soli a certificare il Planner.

## Regola

Il Planner deve essere valutato anche downstream:

un piano “corretto” numericamente ma che produce musica peggiore non è promosso.

---

# 16. FASE 14 — JOINT REFINER / CROSS-TRACK COHERENCE

Stato: **COERENZA DA VERIFICARE PROGRESSIVAMENTE; REFINER SEPARATO OPZIONALE**

## Obiettivo

Rafforzare relazioni tra Performer specializzati.

Controllare e/o correggere:

- kick↔808;
- harmony↔bass;
- motif↔melody;
- drum density↔vocal space;
- transition alignment;
- arrangement coherence.

Non deve diventare un altro procedural rule engine.

La tecnologia viene scelta con ricerca + benchmark. Un modulo separato si implementa solo se porta un miglioramento aggiuntivo rispetto al conditioning o al modello joint, includendo il costo. Il gate di coerenza rimane obbligatorio anche se il Refiner viene accorpato o non adottato.

---

# 17. FASE 15 — SELECTOR, AUDITOR E GATE “NEURAL MUST WIN”

Stato: **DA FARE**

Pipeline da valutare: controlli disponibili → generatore scelto (joint o componenti condizionati, con eventuale Refiner) → candidati → Selector/Auditor → risultato scelto.

La vecchia previsione di 3–4 candidati è una configurazione da benchmarkare, non un vantaggio gratuito. Dichiarare lo stesso budget di generazione/selezione per i concorrenti, oppure misurare esplicitamente il compromesso costo/qualità. Riportare sia il candidato singolo sia il risultato con selector. I confronti intermedi iniziano già nei singoli componenti.

Auditor:

- literal repetition;
- structural inconsistency;
- density;
- low-end;
- tonality/register;
- transitions;
- train similarity;
- memorization;
- role misuse.

Benchmark:

stesso renderer e sound palette.

A/B cieco con baseline utili.

Gate:

**il Neural non diventa composer ufficiale perché passa test tecnici.<br>
Deve essere preferito musicalmente.**

---

# 18. FASE 16 — SCALA, FORMA LUNGA E PRODUZIONE

Stato: **DA FARE**

Si apre solo dopo il Gate Neural Must Win.

## 16A — Scale dataset/model

Aumentare corpus e capacità solo se i risultati lo giustificano.

Non fissare ora 5k/10k come numero magico: la scala viene definita task per task tramite ricerca e learning curve.

## 16B — Long context

8<br>
→ 16<br>
→ 32<br>
→ full song

## 16C — Partial regeneration

- drums;
- 808;
- harmony;
- melody;
- transition;
- section.

Il budget di hardware, memoria, durata di training e latenza d'inferenza deve essere definito già all'apertura del primo modello. Questa fase completa l'hardening; non rimanda tutte le misure di costo alla fine.

## 16D — Hardening

- deterministic seed;
- checkpoint versioning;
- performance;
- caching;
- fallback;
- recovery;
- CPU/GPU strategy.

## 16E — Licensing/originality

- source audit;
- nearest-neighbour;
- memorization;
- reject/regenerate;
- provenance of model version.

## 16F — Game integration

Solo quando standalone è stabile.

---

# 19. GATE UFFICIALI V2

## GATE 1 — PIPELINE / DATA ENGINEERING READY

Verifica:

- importer;
- provenance;
- rights;
- dedup;
- split;
- leakage;
- integrity.

**SUPERATO storicamente.**

NON certifica musicalità o suitability per un task.

## GATE 2 — COMMON REPRESENTATION READY

Common representation scelta e benchmarkata.

**SUPERATO con FAME Compound V1.**

Non vieta Task View specializzate.

## GATE 3 — TASK DATA READY

Nuovo gate.

Ogni modello deve dimostrare:

- role correctness;
- domain correctness;
- quality;
- scale;
- diversity;
- leakage safety;
- representation suitability.

Prima di ogni gate musicale definire numerosità motivata per famiglie, campionamento, soglia o miglioramento minimo utile, trattamento di pareggi/incerti, renderer e palette, numero di candidati e regola di arresto. La conferma finale usa famiglie non impiegate per scegliere ipotesi/configurazioni. Gli esiti comprendono anche **INCONCLUDENTE**: nessuna evidenza di beneficio non dimostra automaticamente impossibilità. Ricerca di chiusura obbligatoria sul blocco effettivamente svolto.

## GATE 4 — COMPONENT MUSICALITY

Ogni Performer deve superare un blind human gate sul proprio task.

## GATE 5 — 8 BAR MUSICALITY

L'intero sistema deve produrre 8 barre credibili e rappabili.

## GATE 6 — NEURAL MUST WIN

A/B reale contro baseline/retrieval/legacy dove utile.

## GATE 7 — COMMERCIAL SAFETY

Licensing, provenance, memorization e originality audit.

---

# 20. RUOLI

## Responsabilità tecnica — Lead Architect / ChatGPT

- verificare repo prima di lavorare;
- mantenere roadmap/current state/decision log coerenti;
- eseguire ricerca di apertura e chiusura di ogni blocco;
- non assumere che una fase “completata” renda automaticamente pronto il downstream;
- progettare dataset task-specifici;
- separare metriche tecniche da musicali;
- costruire codice, test, benchmark e audit;
- controllare provenance/licensing;
- registrare negative result e falsificazioni;
- non correggere una metrica per farla sembrare musicale;
- non gonfiare dati con sintetico;
- non scegliere tecnologia per moda;
- non saltare gate;
- tradurre il giudizio musicale dell'utente in interventi tecnici.

## Responsabilità musicale — Utente

Il compito principale resta ascoltare.

Valutazioni richieste quando pertinenti:

- funziona?
- è Trap?
- è rappabile?
- groove?
- pocket?
- 808?
- hats?
- harmony/melody?
- variazione?
- transizione?
- sembra composto o assemblato?
- quale versione preferisci in blind A/B?

Non è responsabilità dell'utente diagnosticare il codice o il modello.

---

# 21. REGOLE DI LAVORO DA ORA IN POI

1. Questa V2 è la roadmap ufficiale FAME Neural.
2. Le FASI 0–6 restano storico; la sequenza operativa da FASE 7 in avanti è sostituita dalla V2.
3. Prima di ogni blocco è obbligatoria la **Ricerca di apertura**.
4. Prima di chiudere ogni blocco è obbligatoria la **Ricerca di chiusura**.
5. Ogni ricerca deve confrontare le nostre assunzioni con fonti esterne e repo reale.
6. Ogni blocco dichiara esplicitamente cosa misura e cosa NON misura.
7. Nessun “READY” generico viene usato per inferire readiness di un task diverso.
8. Le source vengono usate solo per ruoli compatibili con il loro contenuto.
9. Il sintetico è classificato per uso; non viene contato come qualità per volume.
10. Le annotazioni euristiche non diventano ground truth per inerzia.
11. Common representation e task representation sono concetti distinti.
12. Specializzazione dei Performer non significa indipendenza cross-track.
13. Runtime order e training order sono concetti distinti.
14. Fixed window e musical phrase sono concetti distinti.
15. Metriche automatiche non sovrascrivono l'ascolto.
16. Un human gate non viene sostituito da warning count, MAE, NLL o valid rate.
17. Un risultato negativo viene conservato nella documentazione.
18. Una decisione falsificata viene marcata/superseded, non cancellata.
19. Se una nuova evidenza contraddice la roadmap, si aggiorna la roadmap prima di continuare.
20. Nessun aumento di modello nasconde un problema di dati.
21. Nessun aumento di dataset nasconde un problema di rappresentazione.
22. Nessun refactoring distruttivo viene fatto senza motivo concreto.
23. Il renderer resta separato dalla qualità compositiva nei benchmark.
24. Prima di un training serio si verifica se la scala del dataset è plausibile rispetto a lavori comparabili.
25. Ogni gate musicale usa sample ciechi quando possibile.

---

# 22. STATO REALE AL 9 SETTEMBRE 2026

## Completato

- FASE 0–6 tecniche;
- importer/provenance/dedup/split;
- FAME Compound V1;
- annotatore V1;
- retrieval baseline;
- constrained baseline;
- human gate iniziale;
- role audit del corpus;
- full-layer blind audit;
- canonical vs FAME A/B;
- `perc` ablation A/B;
- Drum Groove Contract/Control V1.

## Verificato ma NON promosso a prodotto

- constrained recombination;
- coupled-block experiment;
- corpus full-layer corrente;
- Planner dataset corrente;
- drum corpus corrente per training serio.

## Numeri Drum Groove V1

- 116 groove eleggibili;
- 60 unique groups;
- GMD 57;
- Hip Hop Drummer 49;
- PDMX 10;
- train/val/test 99/6/11;
- leakage 0;
- 447/464 barre con kick;
- 452/464 con backbeat;
- 2921/6545 joint simultaneous frames;
- retrieval valid 11/11.

Questi numeri certificano il contratto tecnico, non il training readiness.

## Problemi aperti

- scala dati insufficiente per modelli seri da zero;
- Trap-specificity insufficiente nel drum corpus;
- full-arrangement corpus insufficiente;
- synthetic bootstrap musicalmente fallito;
- PDMX selection non ancora quality-aware;
- drum microtiming/instrument identity da preservare meglio;
- boundary/loopability da definire;
- Planner labels/scale insufficienti;
- cross-track learning ancora da costruire.

## Fase corrente

**FASE 7 — TASK DATA RESET + DRUM DATASET V2**

## Prossimi interventi ufficiali

1. consolidare lo stato del contratto 7A/blocco 1 già implementato e aprire il completamento della selezione/export con ricerca e gate propri;
2. completare ammissibilità per task e fedeltà della Drum View, con conservazione sorgente e verifica del percorso effettivo;
3. verificare fonti Trap e fattibilità delle parti allineate per le fasi successive; espandere GMD nel ruolo generale dichiarato e auditare HH-TRP prima dell'intake;
4. recuperare o rieseguire con nuova identità il diagnostico boundary prima di congelare la policy; rendere PDMX quality-aware per i task pertinenti;
5. congelare benchmark, input disponibili e criteri del gate dati/musicale; soltanto dopo aprire il modello minimo previsto;
6. confrontare presto il risultato su otto barre e nel contesto delle altre parti. Sonic Pi resta un pilot facoltativo legato a una domanda specifica, non un blocco obbligatorio aggiunto alla sequenza.

Il **Neural Planner V0 resta sospeso** finché i nuovi task gate non sono superati.

---

# 23. DOPO LA TRAP

Gli altri generi restano chiusi finché la Trap non funziona davvero.

Ordine storico da rivalutare quando il relativo gate verrà aperto:

- UK Drill;
- Boom bap;
- West Coast / G-funk;
- Rage;
- Melodic Trap;
- Plugg / PluggnB;
- Jersey;
- Detroit.

Non si decide ora se useranno:

- un solo modello;
- Performer condivisi;
- adapter;
- fine-tuning separati;
- modelli separati.

La decisione verrà presa con dati e ricerca del blocco futuro.

---

# 24. STATO STORICO DI PARTENZA — 7 SETTEMBRE 2026

Questa fotografia resta nel documento per non riscrivere il passato.

Al momento della V1:

- ricerca architetturale: completata per il primo ciclo;
- ricerca dataset/licenze: completata per il primo ciclo;
- PoC simbolico: esistente;
- training model: non iniziato;
- corpus reale Neural: non ancora costruito;
- modello production: non esistente;
- fase dichiarata corrente: FASE 2 — Pipeline MIDI e provenienza.

La V2 non cancella questa sequenza: documenta come le conclusioni sono cambiate dopo che il sistema ha iniziato a essere ascoltato e auditato musicalmente.

---

# 25. RIFERIMENTI DI RICERCA DA RIVALIDARE A OGNI BLOCCO

Questi riferimenti non sono dogmi e devono essere ricontrollati nella ricerca di apertura/chiusura:

- Groove MIDI Dataset / GrooVAE — human groove, velocity, microtiming;
- MusicBERT — large-scale symbolic pretraining;
- FIGARO — structure/descriptors + learned representation;
- MIDI-GPT — multi-track symbolic generation/conditioning;
- MuPT — large symbolic pretraining e multi-track;
- MaskBeat — loopability e joint drum modeling;
- PDMX — large public-domain symbolic corpus e quality filtering;
- WaivOps HH-TRP — Trap/Drill drum data candidate, da auditare per synthetic diversity;
- TrapGenerator — negative lesson su pochi pattern reali + augmentation combinatoria;
- modelli cross-track recenti — riferimento per coerenza tra parti.

Regola:

**se la ricerca futura contraddice una di queste interpretazioni, prevale l'evidenza aggiornata e la roadmap viene modificata.**

---

# 26. PRINCIPIO FINALE

Il primo ciclo ha dimostrato che una pipeline può essere:

- valida;
- deterministica;
- leakage-safe;
- grammaticalmente corretta;
- metricamente buona;

e produrre comunque musica mediocre.

Da ora il progetto distingue sempre:

```text
CORRETTO TECNICAMENTE
≠
IMPARABILE
≠
MUSICALE
≠
TRAP
≠
RAPPABILE
≠
PRONTO PER IL PRODOTTO
```

FAME Neural avanza solo quando sappiamo quale di queste proprietà abbiamo realmente dimostrato.
