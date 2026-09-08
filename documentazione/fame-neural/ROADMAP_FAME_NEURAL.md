# FAME Neural — Roadmap ufficiale V1

Data: 7 settembre 2026  
Stato: ROADMAP OPERATIVA  
Progetto: FAME Neural Composer  

## 1. Regola di base

FAME Neural è un progetto separato dal vecchio FAME procedurale.

Il vecchio progetto resta congelato come:
- archivio storico;
- benchmark di confronto;
- possibile fallback;
- sorgente di idee da rivalutare quando servono.

Le sue vecchie regressioni, decisioni e vincoli NON sono automaticamente requisiti del nuovo progetto.

Nel Neural una regola diventa vincolante solo quando viene verificata nel nuovo sistema e registrata nella sua documentazione.

## 2. Obiettivo finale

Costruire un compositore musicale neurale capace di generare beat Trap credibili, vari, strutturati e utilizzabili per rap/freestyle, imparando dai dati invece di dipendere da una lunga catena di regole manuali.

Architettura target:

USER INTENT
→ PLANNER
→ STRUCTURAL PLAN
→ NEURAL PERFORMER
→ CANDIDATES
→ SELECTOR / AUDITOR
→ SYMBOLIC SEQUENCE
→ RENDERER
→ STEMS / WAV

Il progetto deve prima dimostrare di saper comporre 8 barre bene. Solo dopo si scala a forme lunghe, altri generi e integrazione nel gioco.

---

# FASE 0 — Fondazione e separazione del progetto

Stato: COMPLETATA

### Cosa facciamo
- creare una cartella/documentazione esclusiva per FAME Neural;
- congelare il PoC0 come baseline tecnica;
- tenere legacy e neural separati;
- definire una sola roadmap ufficiale Neural;
- definire un registro delle decisioni Neural;
- definire test propri del Neural.

### Responsabilità mia
- verificare sempre la repo prima di modifiche significative;
- non importare automaticamente vecchi vincoli;
- aggiornare questa roadmap quando una fase cambia stato;
- distinguere chiaramente fatti, ipotesi ed esperimenti.

### Cosa devi valutare tu
Solo che l'obiettivo musicale rimanga quello giusto.

### Si passa oltre quando
Il progetto Neural ha una struttura propria e il PoC0 è riproducibile e testabile.

---

# FASE 1 — Linguaggio dei dati

Stato: COMPLETATA

### Perché serve
Prima di insegnare musica a una rete dobbiamo decidere esattamente come rappresentiamo una composizione.

### Cosa costruiamo
Un formato canonico FAME Neural per rappresentare:
- tempo e BPM;
- barre e posizione musicale;
- kick;
- snare/clap;
- hi-hat e percussion;
- 808/bass;
- harmony;
- melody/lead;
- durata;
- velocity;
- glide;
- pause;
- relazioni tra eventi;
- energia;
- tensione;
- spazio vocale;
- motif e variazioni.

### Lavori tecnici
- chiudere encoder/decoder del PoC;
- round-trip sequence → token → sequence;
- supportare correttamente triplet e duration;
- formalizzare harmony e 808 glide;
- stabilire un ordine canonico degli eventi simultanei;
- definire una grammatica che impedisca sequenze sintatticamente assurde.

### Cosa devi valutare tu
Quasi nulla: questa fase deve essere musicalmente neutra.

### Si passa oltre quando
Una composizione può essere convertita avanti e indietro senza perdere informazione musicale importante.

---

# FASE 2 — Pipeline MIDI e provenienza

Stato: COMPLETATA

### Perché serve
Il modello sarà buono quanto i dati che gli diamo.

### Cosa costruiamo
Una pipeline che prende MIDI grezzi e produce elementi normalizzati del dataset FAME Neural.

RAW MIDI
→ PARSER
→ NORMALIZER
→ TRACK CLASSIFIER
→ ANALYZER
→ RIGHTS/PROVENANCE CHECK
→ DATASET ITEM

### Ogni elemento deve sapere
- da dove arriva;
- chi lo ha creato;
- con quale licenza/permesso lo usiamo;
- se il training commerciale è consentito;
- se l'output commerciale è consentito;
- a quale famiglia/composizione appartiene.

### Lavori tecnici
- importer MIDI;
- normalizzazione temporale;
- classificazione tracce;
- metadata;
- provenance;
- rights evidence;
- controllo errori/corruzioni.

### Cosa devi valutare tu
Niente ML. Se serve, mi aiuti solo a riconoscere musicalmente tracce o esempi ambigui.

### Si passa oltre quando
Possiamo importare un MIDI e sapere sia cosa contiene sia perché abbiamo diritto a usarlo.

### Verifica di chiusura FASE 2
8 settembre 2026 — gate reale GMD superato: 6/6 dataset item validi, 6 composition family, 6 sequence canoniche, 0 duplicati SHA esatti, stato READY. Il GATE 1 — DATA READY globale resta aperto fino alla verifica di dedup/split/leakage della FASE 3.

---

# FASE 3 — Dataset Auditor e corpus iniziale

Stato: COMPLETATA — GATE 1 DATA READY SUPERATO

### Perché serve
Non vogliamo addestrare il modello su duplicati, MIDI scadenti, materiale rubato o esempi musicalmente inutili.

### Cosa costruiamo
Un Dataset Auditor che rileva:
- duplicati identici;
- versioni quasi identiche;
- trasposizioni;
- arrangiamenti della stessa composizione;
- MIDI vuoti o corrotti;
- tracce duplicate;
- pattern palesemente inutili;
- leakage tra train/validation/test.

### Primo corpus
Usiamo solo fonti con provenienza chiara e materiale originale/licenziato.

Il corpus può combinare:
- materiale FAME originale;
- dataset permissivi verificati;
- public domain verificato per armonia/struttura;
- Trap/Rap originale o commissionata per il cuore stilistico.


### Source Registry e governance delle sorgenti

Stato: OPERATIVO IN FASE 3

Per evitare che ogni nuova fonte introduca regole, downloader e interpretazioni legali isolate, FAME Neural usa un Source Registry machine-readable centrale.

Il registry registra per ogni sorgente:
- stato GREEN / YELLOW / RED;
- licenza del codice, dei dati e degli output come campi separati;
- permesso ML esplicito quando disponibile;
- training commerciale e output commerciale;
- base della decisione sui diritti;
- evidenze e data di verifica;
- formato, ruoli e strato del corpus;
- asset scaricabili con hash;
- compatibilita' con la pipeline simbolica corrente;
- adapter e filtri richiesti.

Regole operative:
- solo GREEN puo' entrare nel training commerciale;
- YELLOW resta quarantena/reference;
- RED e' escluso;
- i dataset sono scaricati in cache esterna alla repository;
- il downloader automatico accetta solo GREEN con asset pin-hashati;
- provenance per-file e Dataset Auditor restano obbligatori anche per le GREEN;
- una licenza della repository NON viene estesa automaticamente ai dati musicali;
- il sintetico e' tracciato separatamente da human-performed e symbolic esterno.

Quota sintetica:
- advisory iniziale: massimo 40% del training corpus;
- NON e' un blocker Gate 1 finche' non viene validata da benchmark;
- non si modifica il Gate per gonfiare artificialmente i conteggi.

Strategia di migrazione:
- le nuove source usano il registry da subito;
- GMD, free-midi-chords e PDMX legacy restano funzionanti;
- gli adapter esistenti vengono migrati quando vengono toccati per modifiche reali, senza refactoring distruttivi.

Stato corpus dopo NRG-CP + Hip Hop Drummer:
- WaivOps NRG-CP: INTEGRATO;
- Hip Hop Drummer: INTEGRATO come role closer sintetico controllato, commit 4cbf33aef786338b5a991e716fb82879fe47a6c7;
- corpus: 370 phrase, 233 composition family, 6 source collections;
- coverage drums/808/harmony/lead: 161/82/264/76;
- pitchedAny: 313;
- HHD usato con seed deterministici, real-import preflight, dedup conservativo e cap 20%;
- il sintetico NON viene usato per gonfiare artificialmente il target 500.

Chiusura FASE 3 / Gate 1 Data Ready:
- corpus finale: 504 phrase;
- composition family: 285;
- source collections: 6;
- coverage drums/808/harmony/lead: 170/101/394/76;
- pitchedAny: 447;
- synthetic share: 45.04% (advisory 40% non ancora raggiunto; NON Gate 1 blocker);
- PDMX share: 43.25%;
- PDMX incremental volume closer: public-domain rights-safe + incremental source exclusion + real-import preflight;
- GATE 1 DATA READY: READY.

Priorita' successiva:
1. FASE 5: avviare il benchmark delle rappresentazioni neurali sul corpus Gate 1 + overlay di esclusione umano;
2. continuare in parallelo l'espansione non sintetica per ridurre la synthetic share verso l'advisory 40%;
3. mantenere NeuralAcid/OpenScore/Harmony Whiz come espansioni future, non come prerequisito Gate 1.

### Primo target
Circa 500–1.000 phrase curate da 4/8/16 barre.

È un target di esperimento, non un numero magico.

### Cosa devi valutare tu
Questa è una fase in cui il tuo giudizio conta molto:
- questa phrase sembra Trap?
- è credibile?
- è rappabile?
- è banale?
- è fatta male?
- vale la pena insegnarla al modello?

### Si passa oltre quando
Abbiamo un primo corpus piccolo ma pulito e abbastanza vario da fare un test serio.

---

# FASE 4 — Annotazione musicale automatica

Stato: COMPLETATA — ANNOTATORE V1 CONGELATO

### Perché serve
Il modello non deve vedere solo note: vogliamo che possa capire strutture e relazioni.

### Annotazioni iniziali
- energy;
- tension;
- vocal space;
- density;
- phrase boundaries;
- motif families;
- motif return/variation;
- harmonic plan;
- 808 contour;
- kick↔808 relations;
- hat density/rolls;
- transition strength.

### Blocco 1 — annotatore deterministico COMPLETATO
Verifica sul corpus reale Gate 1 da 504 phrase:
- 504/504 annotazioni prodotte, 0 fallite;
- schema sidecar `fame-neural-musical-annotation-v1`;
- energy, density, tension, vocalSpace, phrase boundaries e transition strength;
- motif family/return/variation, harmonic plan, 808 contour, kick↔808 e hat rolls;
- due run complete indipendenti hanno prodotto lo stesso manifest SHA-256 `bb540e5103c6f0b79c688af59ec74b47c83282592cdc45a0e0c461a4e025aa89`;
- le label restano stime euristiche con confidence esplicita, non ground truth musicale.

Blocco 2A QA automatico COMPLETATO sul corpus reale: 504 annotazioni, 6 sorgenti, 0 violazioni invarianti. La policy QA e' stata poi corretta per contare kick↔808 solo quando disponibile e per non trattare density alta + vocalSpace alto come contraddizione automatica.

Blocco 2B review umana COMPLETATO: 22/22 phrase, 19 pienamente coerenti, 2 escluse per qualita' musicale, 1 singola sovrastima tension, 0 pattern metrici ripetuti, 95% agreement sulle phrase usabili. Nessuna calibrazione globale; annotatore V1 congelato per FASE 5.

### Regola
Le annotazioni automatiche sono stime, non verità musicali.

### Cosa devi valutare tu
Su campioni selezionati controlleremo se le etichette automatiche hanno senso musicalmente.

### Si passa oltre quando
Gli annotatori sono abbastanza affidabili da arricchire il dataset senza introdurre più rumore che informazione.

---

# FASE 5 — Scelta della rappresentazione neurale

Stato: COMPLETATA — FAME COMPOUND V1 SELEZIONATA

### Perché serve
Non vogliamo scegliere tokenizer e architettura perché sono di moda.

### Confrontiamo almeno
1. Flat token PoC;
2. REMI+;
3. Compound Word;
4. FAME Compound custom.

### Misuriamo
- token per barra;
- lunghezza contesto;
- memoria GPU;
- velocità training;
- reconstruction accuracy;
- invalid generation rate;
- capacità di rappresentare Trap correttamente.

### Blocco 1 — baseline Flat PoC MISURATA

Sul corpus Gate 1 con overlay umano: **502 input**, **502 benchmarkati**, **0 failure**, media **116.125996 token/bar**, P95 **187.75**, grammar/vocab/round-trip failures **0/0/110**.

Il Flat riusa direttamente energy/vocalSpace/tension per barra ma non codifica come feature FASE 4 esplicite density, motif families, kick↔808 relation, hat rolls e transition strength. VRAM, throughput training, invalid generation rate e validation loss restano rinviati al micro-training comparabile comune.

### Blocco 2 — confronto simbolico COMPLETATO

Sul corpus effettivo da **502 candidate** tutte e quattro le rappresentazioni sono state portate sullo stesso harness.

| Rappresentazione | unit/bar mean | P95 | RT fail | FASE4 coverage |
|---|---:|---:|---:|---:|
| flat-poc-v1 | 116.125996 | 187.75 | 110 | 3/8 |
| remi-plus-v1 | 101.281375 | 164.975 | 0 | 0/8 |
| compound-word-v1 | 20.191235 | 35.975 | 0 | 4/8 |
| fame-compound-v1 | 20.229084 | 35.975 | 0 | 8/8 |

Tutti gli adapter hanno chiuso il benchmark con **0 failure / 0 grammar failure / 0 vocabulary failure**. Nessun vincitore viene scelto dal solo benchmark simbolico.

### Blocco 3 — micro-training GPU COMPLETATO

Stesso split per composition family, stesso backbone e **120 step** per rappresentazione. Risultati: flat-poc-v1 691.518 MiB / 1063.191 bars/s / 267.438852 bits-bar / invalid 6/12; remi-plus-v1 707.267 MiB / 1438.365 bars/s / 241.336572 bits-bar / invalid 11/12; compound-word-v1 137.539 MiB / 557.856 bars/s / 191.268692 bits-bar / invalid 12/12; fame-compound-v1 144.136 MiB / 359.363 bars/s / 205.256405 bits-bar / invalid 12/12.

### Blocco 4 — decisione finale COMPLETATA

**Rappresentazione scelta: `fame-compound-v1`.**

La decisione usa insieme Blocco 2, Blocco 3 e audit degli errori generativi.

Motivi principali:
- circa **20.229084 unit/bar**, sostanzialmente pari a Compound Word;
- **0 round-trip failure**;
- copertura **8/8** delle feature FASE 4;
- peak GPU micro-training **144.136 MiB**;
- validation NLL/target **1.137909**;
- supporto esplicito per motif family, kick↔808, hat roll e transition strength.

Il valore **205.256405 bits/bar** viene letto tenendo conto che FAME Compound predice più campi informativi per barra rispetto a Compound Word; non rappresenta quindi la stessa quantità di informazione target.

L'invalid-generation rate unconstrained del Blocco 3 NON viene usato per il ranking finale. L'audit dei 41 sample invalidi ha mostrato esclusivamente errori di grammatica/stato (boundary, barra errata, ordine token/evento), coerenti con un decoder che campionava senza applicare il contratto constrained già stabilito da NDR-010.

Il decoding neurale futuro deve quindi applicare grammar/state masking. Compound Word resta disponibile come baseline di controllo; gli altri adapter benchmark non vengono rimossi.

### Cosa devi valutare tu
Non scegli il tokenizer. Ti farò ascoltare solo eventuali differenze musicali rilevanti.

### Si passa oltre quando
Abbiamo una rappresentazione scelta con dati concreti, non per intuizione.

---

# FASE 6 — Baseline semplice

Stato: IN CORSO — BLOCCO 1 RETRIEVAL BASELINE MISURATO

### Perché serve
Prima della rete serve qualcosa da battere.

### Costruiamo
Un generatore semplice e controllabile usando lo stesso dataset:
- probabilistico;
- retrieval/pattern;
- constrained procedural.

Non deve essere il prodotto finale.

### Blocco 1 — retrieval baseline V1 MISURATO

- `fame-retrieval-baseline-v1`;
- 0 parametri appresi;
- rappresentazione `fame-compound-v1`;
- split 401/58/43 identico alla FASE 5;
- retrieval solo dal train set;
- composition-family leakage 0;
- valid generation 43/43;
- plan MAE medio 0.031008;
- 39 template unici su 43, massimo riuso 2;
- 18 warning `DENSITY_VS_VOCAL_SPACE` su 5 sample.

### Blocco 2 — prossimo

Costruire una seconda baseline semplice ma generativa/constrained, capace di creare materiale nuovo senza rete neurale.

### Serve a rispondere
Il Neural sta davvero imparando oppure stiamo complicando un problema che un sistema molto più semplice risolve allo stesso livello?

### Cosa devi valutare tu
Ascolto A/B.

### Si passa oltre quando
Abbiamo un benchmark ripetibile.

---

# FASE 7 — Neural Planner V0

Stato: DA FARE

### Obiettivo
Insegnare al sistema a pensare prima la struttura, non ancora ogni singolo hi-hat.

### Input
- Trap;
- lineage/style;
- mood;
- energia;
- spazio vocale;
- BPM;
- tonalità opzionale.

### Output per barra
- energy;
- tension;
- vocalSpace;
- density;
- harmonic intent;
- motif intent;
- bass intent;
- transition intent;
- relazione con le barre precedenti.

### Primo scope
8 barre.

### Tre test musicali obbligatori
- hook-first aggressivo;
- verse-first rappabile;
- melodic Trap.

### Cosa devi valutare tu
Qui torni ad avere un ruolo centrale:
- la struttura ha senso?
- cresce o resta piatta?
- respira?
- la ripetizione sembra intenzionale?
- il ritorno ha senso?

### Si passa oltre quando
Il Planner produce strutture diverse ma coerenti e controllabili.

---

# FASE 8 — Neural Performer V0

Stato: DA FARE

### Obiettivo
Trasformare il piano in musica vera.

### Il Performer decide
- kick;
- 808;
- snare/clap;
- hats;
- harmony;
- melody;
- note;
- duration;
- velocity;
- pause;
- glide;
- ornamentazioni.

### Regola importante
Le relazioni musicali devono poter essere apprese insieme.

Non imponiamo automaticamente le vecchie regole FAME legacy.

Se una relazione come kick↔808 risulta utile, la verifichiamo sul nuovo sistema e la adottiamo perché funziona, non perché era scritta nel progetto precedente.

### Primo modello
Piccolo e interpretabile.

Niente modello enorme finché non abbiamo dimostrato che dati e rappresentazione funzionano.

### Cosa devi valutare tu
Ascolto puro:
- è Trap?
- ci rapperesti sopra?
- il groove funziona?
- 808 e kick hanno senso?
- hats sono musicali?
- harmony/melody aiutano o disturbano?
- sembra composto o assemblato?

### Si passa oltre quando
Il sistema genera 8 barre musicalmente sensate con una frequenza sufficiente da giustificare il progetto.

---

# FASE 9 — Selector, Auditor e primo benchmark ascoltabile

Stato: DA FARE

### Perché serve
Non obblighiamo il modello a trovare sempre la soluzione migliore al primo tentativo.

### Pipeline
Planner
→ Performer
→ 3–4 candidati
→ Selector/Auditor
→ migliore candidato

### L'Auditor controlla
- ripetizioni letterali;
- struttura incoerente;
- motif che spariscono senza motivo;
- densità eccessiva;
- spazio vocale;
- low-end incoerente;
- tonalità/registro;
- transizioni;
- somiglianza eccessiva col training set.

### Benchmark principale
Stesso renderer e sound palette.

A = baseline semplice / legacy quando utile
B = Neural

Il confronto deve misurare la composizione, non chi ha i sample migliori.

### Cosa devi valutare tu
Questa è la decisione musicale più importante del primo ciclo.

### Gate fondamentale
Il Neural NON diventa il nuovo composer solo perché funziona tecnicamente.

Deve produrre musica che preferiamo davvero.

---

# FASE 10 — Scala, forma lunga e produzione

Stato: DA FARE

Questa fase si apre solo se il Gate della fase 9 viene superato.

### 10A — Corpus più grande
Da ~1.000 phrase verso 5.000–10.000+ phrase curate.

### 10B — Modello V1
Aumentare capacità solo se i benchmark lo giustificano.

### 10C — Contesto lungo
Progressione:
8 barre
→ 16
→ 32
→ struttura completa.

### 10D — Partial regeneration
Rigenerare solo:
- drums;
- 808;
- harmony;
- melody;
- transition;
- singola sezione.

### 10E — Hardening
- seed deterministico;
- checkpoint versioning;
- performance;
- caching;
- fallback;
- recovery da errori;
- CPU/GPU strategy.

### 10F — Licensing/originality gate
- audit completo delle sorgenti;
- nearest-neighbour check;
- controllo memorization;
- reject/regenerate su output troppo simili.

### 10G — Integrazione nel gioco
Solo quando il generatore standalone è stabile.

### Cosa devi valutare tu
Qualità musicale, varietà, identità e utilità reale nel gioco.

---

# DOPO LA TRAP

Gli altri generi restano chiusi finché la Trap non funziona davvero.

Ordine da rivalutare al momento opportuno:
- UK Drill;
- Boom bap;
- West Coast / G-funk;
- Rage;
- Melodic Trap;
- Plugg / PluggnB;
- Jersey;
- Detroit.

Non decidiamo ora se useranno un unico modello o modelli separati.
Lo decideremo con dati reali.

---

# GATE UFFICIALI

## GATE 1 — DATA READY
Non facciamo training serio finché importer, provenance, dedup e split non sono affidabili.

## GATE 2 — REPRESENTATION READY
Non scaliamo il modello finché non abbiamo scelto la rappresentazione con benchmark reali.

## GATE 3 — 8 BAR MUSICALITY
Non passiamo a canzoni complete finché 8 barre non funzionano bene.

## GATE 4 — NEURAL MUST WIN
Non sostituiamo nulla finché il Neural non supera i benchmark in ascolto reale.

## GATE 5 — COMMERCIAL SAFETY
Non integriamo il modello commerciale finché corpus e output non superano provenance/licensing/originality audit.

---

# RUOLI

## Responsabilità tecnica — Lead Architect / ChatGPT
- tenere aggiornata la roadmap;
- verificare la repo prima di lavorare;
- decidere e spiegare le scelte ML/architetturali;
- costruire codice, test e benchmark;
- controllare dataset e provenance;
- non introdurre complessità inutile;
- segnalare quando una strada non sta funzionando;
- non trasformare esperimenti in regole definitive senza evidenza;
- non saltare fasi perché una tecnologia sembra promettente.

## Responsabilità musicale — Utente
Non devi diventare un ML engineer.

Ti chiederò soprattutto di giudicare:
- se un beat funziona;
- se è credibile;
- se è rappabile;
- se una ripetizione è buona o noiosa;
- se il groove ha senso;
- se un 808 è musicale;
- se una transizione funziona;
- quale versione preferisci in un A/B.

La traduzione delle tue valutazioni musicali in dataset, metriche, architettura o codice è responsabilità tecnica mia.

---

# REGOLE DI LAVORO DA ORA IN POI

1. Questa roadmap è la sequenza di lavoro ufficiale di FAME Neural.
2. Prima di ogni nuovo intervento si identifica la fase corrente.
3. Non si apre la fase successiva senza aver superato il gate della fase corrente, salvo micro-lavori preparatori che non creano dipendenze.
4. Ogni modifica significativa aggiorna lo stato della roadmap.
5. Le vecchie decisioni FAME legacy sono consultabili ma non vincolanti.
6. Le decisioni Neural diventano vincolanti solo dopo verifica nel nuovo progetto.
7. Se una decisione Neural diventa obsoleta, viene modificata esplicitamente nella roadmap/decision log: non la trasciniamo per inerzia.
8. Nessun aumento di modello o dataset serve a nascondere un errore di rappresentazione o di qualità dei dati.
9. Nessun benchmark numerico sovrascrive automaticamente un giudizio musicale evidente.
10. Il renderer e gli altri componenti legacy vengono riutilizzati solo dove ci conviene; non sono dogmi architetturali.

---

# STATO INIZIALE AL 7 SETTEMBRE 2026

Ricerca architetturale: COMPLETATA PER IL PRIMO CICLO  
Ricerca dataset/licenze: COMPLETATA PER IL PRIMO CICLO, DA AGGIORNARE QUANDO SI ACQUISISCONO DATI  
PoC simbolico iniziale: ESISTENTE COME ARTEFATTO DI LAVORO, DA INTEGRARE/CONSOLIDARE  
Training model: NON INIZIATO  
Corpus reale FAME Neural: NON ANCORA COSTRUITO  
Modello production: NON ESISTE  

FASE CORRENTE: FASE 2 — Pipeline MIDI e provenienza.

PROSSIMO OBIETTIVO: costruire Dataset Schema V1 + importer MIDI + provenance record, senza aprire ancora il training.
