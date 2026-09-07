# FAME Neural â€” Roadmap ufficiale V1

Data: 7 settembre 2026  
Stato: ROADMAP OPERATIVA  
Progetto: FAME Neural Composer  

## 1. Regola di base

FAME Neural Ã¨ un progetto separato dal vecchio FAME procedurale.

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
â†’ PLANNER
â†’ STRUCTURAL PLAN
â†’ NEURAL PERFORMER
â†’ CANDIDATES
â†’ SELECTOR / AUDITOR
â†’ SYMBOLIC SEQUENCE
â†’ RENDERER
â†’ STEMS / WAV

Il progetto deve prima dimostrare di saper comporre 8 barre bene. Solo dopo si scala a forme lunghe, altri generi e integrazione nel gioco.

---

# FASE 0 â€” Fondazione e separazione del progetto

Stato: COMPLETATA

### Cosa facciamo
- creare una cartella/documentazione esclusiva per FAME Neural;
- congelare il PoC0 come baseline tecnica;
- tenere legacy e neural separati;
- definire una sola roadmap ufficiale Neural;
- definire un registro delle decisioni Neural;
- definire test propri del Neural.

### ResponsabilitÃ  mia
- verificare sempre la repo prima di modifiche significative;
- non importare automaticamente vecchi vincoli;
- aggiornare questa roadmap quando una fase cambia stato;
- distinguere chiaramente fatti, ipotesi ed esperimenti.

### Cosa devi valutare tu
Solo che l'obiettivo musicale rimanga quello giusto.

### Si passa oltre quando
Il progetto Neural ha una struttura propria e il PoC0 Ã¨ riproducibile e testabile.

---

# FASE 1 â€” Linguaggio dei dati

Stato: COMPLETATA

### PerchÃ© serve
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
- round-trip sequence â†’ token â†’ sequence;
- supportare correttamente triplet e duration;
- formalizzare harmony e 808 glide;
- stabilire un ordine canonico degli eventi simultanei;
- definire una grammatica che impedisca sequenze sintatticamente assurde.

### Cosa devi valutare tu
Quasi nulla: questa fase deve essere musicalmente neutra.

### Si passa oltre quando
Una composizione puÃ² essere convertita avanti e indietro senza perdere informazione musicale importante.

---

# FASE 2 â€” Pipeline MIDI e provenienza

Stato: COMPLETATA

### PerchÃ© serve
Il modello sarÃ  buono quanto i dati che gli diamo.

### Cosa costruiamo
Una pipeline che prende MIDI grezzi e produce elementi normalizzati del dataset FAME Neural.

RAW MIDI
â†’ PARSER
â†’ NORMALIZER
â†’ TRACK CLASSIFIER
â†’ ANALYZER
â†’ RIGHTS/PROVENANCE CHECK
â†’ DATASET ITEM

### Ogni elemento deve sapere
- da dove arriva;
- chi lo ha creato;
- con quale licenza/permesso lo usiamo;
- se il training commerciale Ã¨ consentito;
- se l'output commerciale Ã¨ consentito;
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
Possiamo importare un MIDI e sapere sia cosa contiene sia perchÃ© abbiamo diritto a usarlo.

### Verifica di chiusura FASE 2
8 settembre 2026 â€” gate reale GMD superato: 6/6 dataset item validi, 6 composition family, 6 sequence canoniche, 0 duplicati SHA esatti, stato READY. Il GATE 1 â€” DATA READY globale resta aperto fino alla verifica di dedup/split/leakage della FASE 3.

---
# FASE 3 â€” Dataset Auditor e corpus iniziale

Stato: IN CORSO

### PerchÃ© serve
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

Il corpus puÃ² combinare:
- materiale FAME originale;
- dataset permissivi verificati;
- public domain verificato per armonia/struttura;
- Trap/Rap originale o commissionata per il cuore stilistico.

### Primo target
Circa 500â€“1.000 phrase curate da 4/8/16 barre.

Ãˆ un target di esperimento, non un numero magico.

### Cosa devi valutare tu
Questa Ã¨ una fase in cui il tuo giudizio conta molto:
- questa phrase sembra Trap?
- Ã¨ credibile?
- Ã¨ rappabile?
- Ã¨ banale?
- Ã¨ fatta male?
- vale la pena insegnarla al modello?

### Si passa oltre quando
Abbiamo un primo corpus piccolo ma pulito e abbastanza vario da fare un test serio.

---

# FASE 4 â€” Annotazione musicale automatica

Stato: DA FARE

### PerchÃ© serve
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
- kickâ†”808 relations;
- hat density/rolls;
- transition strength.

### Regola
Le annotazioni automatiche sono stime, non veritÃ  musicali.

### Cosa devi valutare tu
Su campioni selezionati controlleremo se le etichette automatiche hanno senso musicalmente.

### Si passa oltre quando
Gli annotatori sono abbastanza affidabili da arricchire il dataset senza introdurre piÃ¹ rumore che informazione.

---

# FASE 5 â€” Scelta della rappresentazione neurale

Stato: DA FARE

### PerchÃ© serve
Non vogliamo scegliere tokenizer e architettura perchÃ© sono di moda.

### Confrontiamo almeno
1. Flat token PoC;
2. REMI+;
3. Compound Word;
4. FAME Compound custom.

### Misuriamo
- token per barra;
- lunghezza contesto;
- memoria GPU;
- velocitÃ  training;
- reconstruction accuracy;
- invalid generation rate;
- capacitÃ  di rappresentare Trap correttamente.

### Cosa devi valutare tu
Non scegli il tokenizer. Ti farÃ² ascoltare solo eventuali differenze musicali rilevanti.

### Si passa oltre quando
Abbiamo una rappresentazione scelta con dati concreti, non per intuizione.

---

# FASE 6 â€” Baseline semplice

Stato: DA FARE

### PerchÃ© serve
Prima della rete serve qualcosa da battere.

### Costruiamo
Un generatore semplice e controllabile usando lo stesso dataset:
- probabilistico;
- retrieval/pattern;
- constrained procedural.

Non deve essere il prodotto finale.

### Serve a rispondere
Il Neural sta davvero imparando oppure stiamo complicando un problema che un sistema molto piÃ¹ semplice risolve allo stesso livello?

### Cosa devi valutare tu
Ascolto A/B.

### Si passa oltre quando
Abbiamo un benchmark ripetibile.

---

# FASE 7 â€” Neural Planner V0

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
- tonalitÃ  opzionale.

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

# FASE 8 â€” Neural Performer V0

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

Se una relazione come kickâ†”808 risulta utile, la verifichiamo sul nuovo sistema e la adottiamo perchÃ© funziona, non perchÃ© era scritta nel progetto precedente.

### Primo modello
Piccolo e interpretabile.

Niente modello enorme finchÃ© non abbiamo dimostrato che dati e rappresentazione funzionano.

### Cosa devi valutare tu
Ascolto puro:
- Ã¨ Trap?
- ci rapperesti sopra?
- il groove funziona?
- 808 e kick hanno senso?
- hats sono musicali?
- harmony/melody aiutano o disturbano?
- sembra composto o assemblato?

### Si passa oltre quando
Il sistema genera 8 barre musicalmente sensate con una frequenza sufficiente da giustificare il progetto.

---

# FASE 9 â€” Selector, Auditor e primo benchmark ascoltabile

Stato: DA FARE

### PerchÃ© serve
Non obblighiamo il modello a trovare sempre la soluzione migliore al primo tentativo.

### Pipeline
Planner
â†’ Performer
â†’ 3â€“4 candidati
â†’ Selector/Auditor
â†’ migliore candidato

### L'Auditor controlla
- ripetizioni letterali;
- struttura incoerente;
- motif che spariscono senza motivo;
- densitÃ  eccessiva;
- spazio vocale;
- low-end incoerente;
- tonalitÃ /registro;
- transizioni;
- somiglianza eccessiva col training set.

### Benchmark principale
Stesso renderer e sound palette.

A = baseline semplice / legacy quando utile
B = Neural

Il confronto deve misurare la composizione, non chi ha i sample migliori.

### Cosa devi valutare tu
Questa Ã¨ la decisione musicale piÃ¹ importante del primo ciclo.

### Gate fondamentale
Il Neural NON diventa il nuovo composer solo perchÃ© funziona tecnicamente.

Deve produrre musica che preferiamo davvero.

---

# FASE 10 â€” Scala, forma lunga e produzione

Stato: DA FARE

Questa fase si apre solo se il Gate della fase 9 viene superato.

### 10A â€” Corpus piÃ¹ grande
Da ~1.000 phrase verso 5.000â€“10.000+ phrase curate.

### 10B â€” Modello V1
Aumentare capacitÃ  solo se i benchmark lo giustificano.

### 10C â€” Contesto lungo
Progressione:
8 barre
â†’ 16
â†’ 32
â†’ struttura completa.

### 10D â€” Partial regeneration
Rigenerare solo:
- drums;
- 808;
- harmony;
- melody;
- transition;
- singola sezione.

### 10E â€” Hardening
- seed deterministico;
- checkpoint versioning;
- performance;
- caching;
- fallback;
- recovery da errori;
- CPU/GPU strategy.

### 10F â€” Licensing/originality gate
- audit completo delle sorgenti;
- nearest-neighbour check;
- controllo memorization;
- reject/regenerate su output troppo simili.

### 10G â€” Integrazione nel gioco
Solo quando il generatore standalone Ã¨ stabile.

### Cosa devi valutare tu
QualitÃ  musicale, varietÃ , identitÃ  e utilitÃ  reale nel gioco.

---

# DOPO LA TRAP

Gli altri generi restano chiusi finchÃ© la Trap non funziona davvero.

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

## GATE 1 â€” DATA READY
Non facciamo training serio finchÃ© importer, provenance, dedup e split non sono affidabili.

## GATE 2 â€” REPRESENTATION READY
Non scaliamo il modello finchÃ© non abbiamo scelto la rappresentazione con benchmark reali.

## GATE 3 â€” 8 BAR MUSICALITY
Non passiamo a canzoni complete finchÃ© 8 barre non funzionano bene.

## GATE 4 â€” NEURAL MUST WIN
Non sostituiamo nulla finchÃ© il Neural non supera i benchmark in ascolto reale.

## GATE 5 â€” COMMERCIAL SAFETY
Non integriamo il modello commerciale finchÃ© corpus e output non superano provenance/licensing/originality audit.

---

# RUOLI

## ResponsabilitÃ  tecnica â€” Lead Architect / ChatGPT
- tenere aggiornata la roadmap;
- verificare la repo prima di lavorare;
- decidere e spiegare le scelte ML/architetturali;
- costruire codice, test e benchmark;
- controllare dataset e provenance;
- non introdurre complessitÃ  inutile;
- segnalare quando una strada non sta funzionando;
- non trasformare esperimenti in regole definitive senza evidenza;
- non saltare fasi perchÃ© una tecnologia sembra promettente.

## ResponsabilitÃ  musicale â€” Utente
Non devi diventare un ML engineer.

Ti chiederÃ² soprattutto di giudicare:
- se un beat funziona;
- se Ã¨ credibile;
- se Ã¨ rappabile;
- se una ripetizione Ã¨ buona o noiosa;
- se il groove ha senso;
- se un 808 Ã¨ musicale;
- se una transizione funziona;
- quale versione preferisci in un A/B.

La traduzione delle tue valutazioni musicali in dataset, metriche, architettura o codice Ã¨ responsabilitÃ  tecnica mia.

---

# REGOLE DI LAVORO DA ORA IN POI

1. Questa roadmap Ã¨ la sequenza di lavoro ufficiale di FAME Neural.
2. Prima di ogni nuovo intervento si identifica la fase corrente.
3. Non si apre la fase successiva senza aver superato il gate della fase corrente, salvo micro-lavori preparatori che non creano dipendenze.
4. Ogni modifica significativa aggiorna lo stato della roadmap.
5. Le vecchie decisioni FAME legacy sono consultabili ma non vincolanti.
6. Le decisioni Neural diventano vincolanti solo dopo verifica nel nuovo progetto.
7. Se una decisione Neural diventa obsoleta, viene modificata esplicitamente nella roadmap/decision log: non la trasciniamo per inerzia.
8. Nessun aumento di modello o dataset serve a nascondere un errore di rappresentazione o di qualitÃ  dei dati.
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

FASE CORRENTE: FASE 2 â€” Pipeline MIDI e provenienza.

PROSSIMO OBIETTIVO: costruire Dataset Schema V1 + importer MIDI + provenance record, senza aprire ancora il training.
