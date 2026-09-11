# FAME Neural — Decision Log

Questo file contiene soltanto decisioni del progetto FAME Neural.
Le decisioni del FAME legacy non vengono ereditate automaticamente.

## NDR-001 — Separazione dal legacy
**Status:** ACCEPTED

FAME Neural è un progetto autonomo. Il legacy resta storico, benchmark e possibile fallback. Una regola legacy entra nel Neural solo dopo rivalutazione esplicita.

## NDR-002 — Primo dominio: Trap, 8 barre
**Status:** ACCEPTED

Il primo problema musicale da risolvere è generare bene 8 barre di Trap. Forma lunga e altri generi restano chiusi finché il relativo gate non viene superato.

## NDR-003 — Rappresentazione simbolica prima del training
**Status:** ACCEPTED

Il training serio non viene aperto finché il formato simbolico non dispone di encode/decode, grammatica e test di round-trip.

## NDR-004 — PoC isolato dal renderer
**Status:** ACCEPTED

Il Neural lavora inizialmente sul dominio simbolico. Il renderer non viene modificato durante la fondazione e il linguaggio dati.

## NDR-005 — Nessuna tecnologia scelta per moda
**Status:** ACCEPTED

Flat, REMI+, Compound Word e formati FAME custom verranno confrontati con benchmark prima di congelare la rappresentazione di training definitiva.

## NDR-006 — Il giudizio musicale resta un gate
**Status:** ACCEPTED

Loss, perplexity o audit automatici non bastano per promuovere un composer.

## NDR-007 — Tonalità e accordi sono concetti separati
**Status:** ACCEPTED

`tonality` descrive root/mode globali. `harmony` descrive segmenti di accordo nel tempo con root, quality e bass/inversione. Il primo accordo non viene più usato come sostituto implicito della tonalità.

## NDR-008 — Event stream canonico e deterministic ordering
**Status:** ACCEPTED

Eventi allo stesso tick vengono ordinati con una precedenza canonica stabile. Il formato non deve dipendere dall'ordine accidentale con cui una sorgente MIDI fornisce le note.

## NDR-009 — Quantizzazione neurale esplicita
**Status:** ACCEPTED

Il formato runtime può restare più preciso del token stream. Le perdite ammesse dal Neural V1 sono esplicite e testate: onset/duration sulle griglie supportate e conditioning/velocity in 10 bin. Non sono ammesse perdite silenziose non documentate.

## NDR-010 — Constrained token grammar
**Status:** ACCEPTED

Il token stream ha una grammatica verificabile e può esporre i token ammessi come prossimo passo. Il futuro generatore non dovrà imparare inutilmente sintassi musicalmente impossibili solo dai dati.

## NDR-011 — Annotazioni V1 congelate dopo review umana
**Status:** ACCEPTED

Le annotazioni FASE 4 sono feature euristiche ausiliarie con confidence, non ground truth. La review umana 22/22 ha trovato 19 phrase pienamente coerenti, 2 phrase da escludere per qualita' musicale e un solo errore metrico isolato sulla tension; non emerge un pattern sufficiente a giustificare una calibrazione globale. Le phrase scartate vengono gestite con un exclusion overlay reversibile senza cancellare il corpus sorgente.

## NDR-012 — FAME Compound V1 è la rappresentazione neurale selezionata
**Status:** ACCEPTED

La FASE 5 seleziona `fame-compound-v1` come contratto di rappresentazione per il Neural successivo.

La scelta deriva dal confronto simbolico e dal micro-training: compattezza circa 20.23 unit/bar, 0 round-trip failure, copertura 8/8 delle feature FASE 4 e costo GPU contenuto.

L'invalid-generation rate del Blocco 3 non viene usato per il ranking finale: l'audit dei 41 sample invalidi ha mostrato esclusivamente violazioni di grammatica/stato prodotte dal sampling unconstrained. Questo comportamento viola il principio già accettato in NDR-010, secondo cui il generatore deve applicare una grammatica constrained.

Compound Word resta baseline tecnica di controllo. Flat e REMI+ restano disponibili per benchmark e regressioni; non vengono eliminati.

## NDR-013 — Due baseline complementari per il benchmark Neural
**Status:** ACCEPTED

La FASE 6 congela due controlli non neurali sullo stesso split leakage-safe e sulla rappresentazione `fame-compound-v1`:

- `fame-retrieval-baseline-v1`, forte sulla coerenza di materiale reale;
- `fame-constrained-recombination-v1`, generativa e senza copie esatte di phrase/bar del train nel test misurato.

Il plan MAE zero della constrained baseline deriva dal conditioning diretto sul piano high-level e non misura il Planner end-to-end.

Le metriche exact-match non vengono interpretate come prova generale di assenza di memorization.

I limiti musicali osservati restano nel benchmark invece di essere corretti con nuove regole procedurali.

---

# Revisioni V2 — 9 settembre 2026

Le decisioni seguenti NON cancellano NDR-001…013. Ne restringono l'interpretazione dove i gate musicali e la ricerca successiva hanno mostrato che una conclusione precedente era troppo generale.

## NDR-014 — Readiness a livelli e gate task-specifici
**Status:** ACCEPTED

Il vecchio `GATE 1 — DATA READY` viene interpretato ufficialmente come:

`PIPELINE / DATA ENGINEERING READY`.

Certifica importer, provenance, rights, dedup, split, leakage e integrità.

NON certifica automaticamente:

- musicalità;
- dominio Trap;
- completezza full-arrangement;
- readiness del Planner;
- readiness di un Performer.

Ogni modello deve superare un proprio `TASK DATA READY` con role correctness, domain correctness, qualità, scala, diversità e suitability della rappresentazione.

Motivo della revisione:

il role audit delle 502 candidate ha mostrato un corpus fortemente eterogeneo: 307 `TONAL_ONLY`, 57 `DRUMS_ONLY`, 53 `FULL_LAYERED`, 38 `DRUMS_TONAL`, 22 `LOWEND_TONAL`, 21 `DRUMS_LOWEND`, 4 `LOWEND_ONLY`.

## NDR-015 — Il corpus è role-aware, non un insieme omogeneo di beat
**Status:** ACCEPTED

Ogni sorgente/record viene usato solo per capacità realmente presenti.

Ruoli minimi previsti:

- `DRUM_GROOVE`;
- `DRUM_FILL`;
- `LOW_END`;
- `TONAL_HARMONY`;
- `TONAL_MELODY`;
- `FULL_ARRANGEMENT`.

Le label diagnostiche basate sui conteggi servono a evitare misuse ma NON costituiscono ground truth di qualità musicale.

GMD viene trattato come `human groove/performance`, non come full beat e non come ground truth Trap sufficiente.

WaivOps NRG-CP viene trattato come materiale tonal/pitched.

PDMX viene trattato come general symbolic/arrangement/harmony e deve passare selezione quality-aware quando usato musicalmente.

## NDR-016 — `fame-original-seed-v1` non è training target musicale
**Status:** ACCEPTED

Il blind full-layer gate ha mostrato:

- 10/10 esempi testati `fame-original-seed-v1` giudicati come materiale messo a caso;
- 6/6 PDMX full-layer riconosciuti come musica coerente;
- 2/6 PDMX giudicati anche rappabili.

`fame-original-seed-v1` viene quindi classificato `DEBUG_SYNTHETIC_ONLY` salvo futura rivalidazione umana esplicita.

Resta utilizzabile per:

- debug;
- grammar;
- determinismo;
- encode/decode;
- smoke test.

Non contribuisce ai gate musicali full-arrangement.

## NDR-017 — FAME Compound è common representation, non task view universale
**Status:** ACCEPTED

NDR-012 NON viene revocata.

`fame-compound-v1` resta la lingua comune e la baseline neurale multi-ruolo.

Tuttavia un task specializzato può usare una vista derivata più appropriata se:

- la conversione è tracciabile;
- non inventa ground truth;
- conserva meglio le informazioni utili al task;
- viene benchmarkata.

Primo caso: `Drum View V2`, che deve valutare instrument identity, simultaneous joint frames, velocity, metrical position, microtiming/offset, fill/core e boundary/loopability.

## NDR-018 — La perdita `perc` non è la causa principale, ma le classi drum vanno preservate meglio
**Status:** ACCEPTED

L'ablation blind `FULL` vs `NO_PERC` non ha mostrato un miglioramento sistematico rimuovendo `perc`.

Quindi non si elimina `perc` come fix generale.

Resta però indesiderato perdere tom, crash, ride e altre classi disponibili nella sorgente dentro un'unica categoria generica.

La Drum View V2 deve preservare più informazione strumentale quando il dato sorgente la contiene.

## NDR-019 — Fixed window non equivale a musical phrase
**Status:** ACCEPTED

4 barre non vengono più considerate un'unità semantica universale.

8 barre restano il primo scope globale di composizione, ma non devono essere imposte a ogni sottotask.

Per i drum devono essere distinte almeno:

- core/loop;
- variation;
- fill;
- arrangement multi-bar.

Il test 4-bar loop vs 8-bar contiguous è diagnostico; non può trasformare da solo 8 barre in un nuovo dogma.

## NDR-020 — Runtime order e training order sono distinti
**Status:** ACCEPTED

Il Planner resta il primo componente concettuale del runtime finale.

Non è però obbligatorio addestrarlo per primo.

Il profiler corrente ha prodotto 92 sample 8-bar da 4+4, con split 71/13/8 e 68 gruppi: sufficiente per smoke/contract test, non per un serio Planner generalizzabile da zero.

Il Planner viene quindi rinviato finché i Performer e i dataset task-specifici non producono strutture osservabili e sufficientemente numerose.

## NDR-021 — Specializzazione dei Performer sì, indipendenza cross-track no
**Status:** ACCEPTED

Drum, low-end e tonal possono avere modelli o viste specializzate.

Non possono essere trattati come parti musicalmente indipendenti nel sistema finale.

In particolare:

- 808 Performer deve vedere almeno drums/kick e harmony/tonality;
- Tonal Performer deve vedere struttura e contesto cross-track;
- il sistema deve avere un meccanismo joint/cross-track per la coerenza complessiva.

Il constrained recombination e il donor switching restano negative lesson: compatibilità statistica locale non ricostruisce automaticamente una relazione musicale.

## NDR-022 — Le annotazioni euristiche non diventano ground truth del Planner
**Status:** ACCEPTED

`energy`, `tension`, `vocalSpace` e altre feature FASE 4 restano auxiliary features con confidence.

Il Planner V0 deve privilegiare target osservabili/derivabili in modo più diretto:

- section/function;
- active roles;
- repeat/variation;
- pattern family;
- fill;
- density;
- harmonic rhythm;
- motif return;
- transition.

Le feature euristiche possono restare conditioning o target secondari solo dopo nuova validazione.

## NDR-023 — Scala dati e strategia di apprendimento sono parte del gate
**Status:** ACCEPTED

Dataset da poche decine/centinaia di esempi possono validare:

- pipeline;
- overfit;
- representation;
- smoke test;
- ablation.

Non vengono considerati automaticamente sufficienti per addestrare da zero modelli generativi generalizzabili.

Prima di training serio è obbligatorio confrontare scala, learning setup e failure mode con lavori comparabili.

Quando utile si preferisce:

`broad pretraining → domain specialization → human gate`.

GMD è candidato per pretraining di groove umano; il dominio Trap richiede dati specifici separati.

## NDR-024 — Synthetic data ha un ruolo esplicito, non un valore per volume
**Status:** ACCEPTED

La quota sintetica globale resta una metrica di governance, non una garanzia di qualità.

Ogni source sintetica deve dichiarare uso:

- debug;
- augmentation;
- negative/control;
- pretraining;
- training target.

Non si usa synthetic data per far sembrare grande un corpus piccolo.

Un corpus sintetico entra come target musicale solo se supera gate di qualità, diversità, indipendenza e domain fit.

## NDR-025 — Metriche automatiche e qualità musicale sono contratti diversi
**Status:** ACCEPTED

Ogni report deve specificare cosa la metrica misura e cosa NON misura.

Esempi consolidati:

- Plan MAE 0 del constrained deriva dal conditioning diretto;
- retrieval distance bassa non certifica groove;
- same-lineage rate non certifica style match se il lineage è generico/default;
- valid generation non certifica composizione;
- exact-match non certifica generalizzazione;
- warning count non certifica musicalità.

Il blind human gate rimane obbligatorio sui componenti musicali.

## NDR-026 — Ricerca approfondita obbligatoria all'apertura e alla chiusura di ogni blocco
**Status:** ACCEPTED

Prima di ogni nuovo blocco significativo è obbligatoria una ricerca di apertura che confronti:

- repository corrente;
- assunzioni;
- stato dell'arte;
- dataset/modelli comparabili;
- scale;
- failure mode;
- alternative;
- licensing quando pertinente.

Prima di dichiarare chiuso il blocco è obbligatoria una ricerca di chiusura che:

- confronti risultati e ipotesi;
- cerchi failure mode emerse durante il lavoro;
- verifichi se qualcosa è sfuggito;
- confronti i nostri numeri con lavori comparabili;
- aggiorni roadmap/current state/decision log.

Non si considera completo un blocco solo perché il codice o il benchmark gira.

## NDR-027 — Negative result e assunzioni falsificate sono first-class project knowledge
**Status:** ACCEPTED

Quando una strada fallisce non viene cancellata o riscritta come se non fosse mai stata scelta.

Si conserva almeno:

- assunzione iniziale;
- test;
- risultato;
- motivo dell'insufficienza;
- nuova regola.

Negative lesson ufficiali del primo ciclo includono:

- constrained recombination musicalmente debole;
- Coupled Block V2 non superiore al retrieval;
- FAME Compound non causa principale del caos osservato;
- `perc` non causa generale;
- `fame-original-seed-v1` non valido come full-arrangement training target;
- Planner-first non necessario;
- 4-bar fixed slicing non equivalente a phrase musicale.

## Integrazione dell'audit V2 — 9 settembre 2026

Le decisioni seguenti recepiscono l'[audit del commit 1372467](AUDIT_ROADMAP_V2_2026-09-09.md). **ACCEPTED significa regola adottata, non efficacia dimostrata né correzione già implementata.** Lo stato delle azioni è in CURRENT_STATE.md. NDR-001…027 restano storia del progetto; le precisazioni seguenti prevalgono sulle interpretazioni incompatibili.

## NDR-028 — Preprocessing indipendente dal validation/test
**Status:** ACCEPTED

Vocabolari e schemi di valutazione devono essere fissati da una specifica indipendente dai dati oppure costruiti esclusivamente sul train. Vanno dichiarati e verificati il comportamento sugli elementi sconosciuti e la separazione per famiglie/sorgenti. La separazione dei batch di training non basta a garantire la separazione del preprocessing.

Nel micro-training Fase 5 i codec ricevono `records["all"]`: il riscontro riguarda l'esposizione del preprocessing ai dati di validation/test, non dimostra che quei record siano stati usati come target nei batch di training. L'entità dell'effetto sui risultati non è misurata. La correzione del codice rimane aperta e precede nuovi confronti neurali.

## NDR-029 — Confronti equivalenti e interpretazione limitata delle metriche
**Status:** ACCEPTED

Un confronto tra rappresentazioni deve dichiarare task, sorgenti, informazione conservata, budget, split, decoder e unità delle metriche. Perdite su campi diversi non costituiscono da sole una classifica. Un micro-training di 120 step non dimostra convergenza o superiorità generale; costi e velocità restano misure della configurazione osservata.

`encode → decode → encode` verifica idempotenza della serializzazione: non prova la conservazione di tutta l'informazione MIDI. La copertura delle famiglie misura trasportabilità, non qualità musicale. FAME Compound resta la scelta pragmatica per il formato comune; la migliore rappresentazione per un task neurale resta da verificare. Non è richiesto rifare ogni esperimento storico: un nuovo confronto serve quando la decisione futura ne dipende.

## NDR-030 — Valutare il decoder effettivamente previsto
**Status:** ACCEPTED

Quando il contratto richiede vincoli grammaticali, il benchmark deve verificare il decoder con quei vincoli e documentarne l'applicazione. Escludere dalla selezione una metrica prodotta da un sampler inadeguato non equivale a validare il sampler corretto. I risultati unconstrained storici restano registrati.

Validità strutturale e qualità musicale sono gate distinti. Le dipendenze tra campi di una parola compound dipendono anche dal modello e dal decoder, non soltanto dal formato. Eventuali modifiche vanno confrontate sullo stesso task; la verifica del decoder previsto rimane aperta.

## NDR-031 — Limiti delle falsificazioni e delle decisioni architetturali
**Status:** ACCEPTED

Un risultato negativo falsifica l'ipotesi operativa nelle condizioni provate; non dimostra l'impossibilità universale di una famiglia di metodi. Le conclusioni storiche su recombination, seed, conditioning e Planner vanno lette con questo limite. Conditioning estratto da una sorgente può servire un benchmark condizionato, ma non dimostra generazione autonoma.

La coerenza tra tracce è un requisito musicale. Un Joint Refiner separato è una possibile soluzione, non una necessità provata. Prima di congelarne l'implementazione si confrontano alternative più semplici, incluse generazione congiunta o condizionata, con dati e criteri comparabili. La sequenza della V2 resta una strategia di lavoro: non certifica l'efficacia anticipata di tutti i componenti.

## NDR-032 — Gate definiti prima dei risultati e valutazione indipendente
**Status:** ACCEPTED

Prima del test si registrano pool candidato, unità di campionamento, numerosità e sua motivazione, criteri di inclusione, soglie di accettazione, gestione dei casi dubbi e protocollo d'ascolto. Nessun numero universale di esempi viene assunto sufficiente senza relazione al task.

I casi già ascoltati e usati per prendere decisioni sono esempi di sviluppo/regressione; non costituiscono da soli un nuovo test finale indipendente. Si riserva un insieme finale separato per famiglie/sorgenti, controllando duplicati e derivazioni. Il giudizio del responsabile musicale resta valido per il prodotto; numero e profilo degli ascoltatori delimitano le conclusioni, senza trasformarle in consenso universale.

## NDR-033 — Preservare le sorgenti e non inventare capacità musicali
**Status:** ACCEPTED

Le capacità ammesse di un contenuto devono distinguere proprietà osservate, inferenze e giudizi d'ascolto, con evidenza, ambito e incertezza. Licenza utilizzabile, rating o etichetta di genere non certificano groove, arrangiamento o rappabilità. Un valore assente non equivale a una valutazione negativa; un fallback non diventa un'etichetta fattuale.

Prima di normalizzazioni distruttive si preservano identità della nota drum originale, timing e PPQ sorgente, provenienza e versione del mapping. Sidecar o estensione versionata sono scelte implementative da verificare. Non si ricostruisce arbitrariamente una nota originale dal ruolo aggregato `perc`. La DrumView va valutata sul suo task; la rappresentazione comune non garantisce da sola la fedeltà necessaria. I synthetic sono ammessi per ruoli espliciti e gate specifici, senza assumere che più file equivalgano a più famiglie musicali indipendenti.

## NDR-034 — Tracciabilità, memoria e chiusura verificabile
**Status:** ACCEPTED

Ogni esperimento decisionale deve associare commit del codice, configurazione, identità/hash degli input, split, seed, renderer, risultati e artefatti necessari alla riproduzione. Per gli ascolti si conservano manifest, chiave delle etichette blind e feedback. Un artefatto mancante resta dichiarato mancante: non si ricostruisce la cronologia per supposizione. Se il vecchio boundary test non è recuperabile, il nuovo test riceve identità propria.

Si privilegiano strumenti versionati e punti di ingresso stabili; gli errori operativi documentati non giustificano una proliferazione di launcher temporanei. Una correzione è chiusa solo dopo modifica e verifica pertinente: aggiornare un documento non corregge un bug.

L'audit conserva la fotografia e le fonti; DECISIONS conserva le regole; CURRENT_STATE conserva lo stato corrente; ROADMAP conserva ordine e gate. La ricerca di apertura e chiusura richiesta da NDR-026 collega evidenze, alternative e risultati, senza creare un secondo registro di avanzamento. Le fonti sostengono il proprio contesto sperimentale: non validano automaticamente FAME.

## Revisione handoff e Sonic Pi — 9 settembre 2026

Base verificata: `02bc708`. Evidenze e limiti: [rapporto di confronto](REVISIONE_HANDOFF_SONIC_PI_2026-09-09.md). Le decisioni seguenti sono adottate come protocollo; non dichiarano implementati i controlli ancora aperti in CURRENT_STATE. Integrano NDR-001…034 senza cancellarne lo storico.

## NDR-035 — Schema, evidenza e ammissibilità per task sono controlli distinti
**Status:** ACCEPTED

Un payload con schema valido ed evidenceRef risolte non certifica la sufficienza dell'evidenza musicale. Il builder iniziale evita promozioni automatiche, ma il normalizzatore non è il gate di ammissibilità.

Il percorso effettivo di selezione/export deve verificare uso consentito, restrizioni sorgente, diritti, capability e qualità pertinenti al task. `unknown` e `candidate` non equivalgono a permesso; una policy opzionale omessa non deve autorizzare implicitamente un training. Verificare esempi consentiti, bloccati e sconosciuti sul percorso reale, con motivazioni tracciabili. I criteri di qualità per debug, pretraining generale e target musicale di prodotto sono diversi.

Il contratto 7A/blocco 1 esiste in `02bc708`; enforcement e ammissibilità restano da completare. Il risultato dello smoke test non chiude l'intera fase.

## NDR-036 — La Task View deriva dall'informazione preservata necessaria
**Status:** ACCEPTED

FAME Compound rimane formato comune. Una Task View non deve obbligatoriamente attraversare una versione già quantizzata o impoverita prima di accedere alla fedeltà richiesta. Conservare sorgente e provenance e verificare derivazioni, collegamenti stabili e perdite esplicite.

Sidecar ed estensione versionata del canonico restano alternative implementative. Conservare un campo sorgente non obbliga a usarlo nel modello; eliminarlo dal modello non autorizza a dichiararlo conservato dal suo round-trip.

## NDR-037 — Contratti di controllo e coerenza precedono il congelamento dei moduli
**Status:** ACCEPTED

Prima dei Performer definire origine e disponibilità dei controlli: forniti, estratti da una sorgente disponibile oppure generati. Il Planner può restare il primo ruolo concettuale del runtime senza imporre subito una rete separata. Un piano minimo esplicito è una baseline, non un teacher musicale inventato.

Verificare presto la disponibilità di sequenze continue e parti drums/808/armonia abbinate. Pool separati per ruolo non creano automaticamente supervisione delle interazioni. Misurare il comportamento con contesto reale e generato già introducendo la seconda parte.

Confrontare Core+Arranger con un modello condizionato unico a otto barre; valutare accorpamenti tonali quando pertinenti. Il Refiner separato è opzionale e richiede beneficio aggiuntivo rispetto a joint/conditioning, costo incluso. Il gate di coerenza rimane obbligatorio anche quando il modulo non viene adottato.

## NDR-038 — Sonic Pi è una sorgente candidata, non un prerequisito della roadmap
**Status:** ACCEPTED

La pista programmatica resta ricerca facoltativa, preferibilmente su variation/arrangement di otto barre. Non introduce automaticamente una fase, una capability ufficiale o un modello di code generation. Non blocca la Drum Dataset V2 quando non è necessaria al suo task.

Prima del pilot definire domanda, budget, fixture ammissibili, versione runtime, stato iniziale e copertura. Separare eventi realizzati, fatti statici e osservazioni di controllo; non dedurre funzione musicale o causalità dalla sola sintassi. Definire tempo globale/locale, metro, seed policy uniforme, identità eventi/istanze, `synth`/`control`, silenzi, layer, sample loop ed effetti secondo lo scope. Ampiezza sorgente non equivale automaticamente a velocity MIDI. Una sostituzione audio non è equivalente senza verifica delle dipendenze.

Codice headless disponibile non significa esecuzione FAME già verificata. Il seed non garantisce da solo riproducibilità. Licenza codice, esempi e asset si valutano separatamente; un chiarimento richiesto non è un permesso ricevuto. Programmi, varianti, fork e seed condividono gruppi coerenti prima degli split. Il numero di take non misura le famiglie indipendenti.

## NDR-039 — Il confronto dei controlli dichiara l'informazione disponibile
**Status:** ACCEPTED

Il benchmark programmatico distingue eventi/controlli comuni, descrittori semplici e struttura programmatica, con sorgenti, famiglie, esempi e budget comparabili. Per ogni campo dichiarare disponibilità prima della generazione e dipendenza dal bersaglio.

Se il trace è un ausilio disponibile solo in training, il test finale non riceve il trace del target. Se è conditioning all'uso, dichiarare chi lo fornisce. Programma completo, note future o scelte random della take bersaglio non diventano input di generazione autonoma senza esplicita ridefinizione del task. L'esecuzione diretta di un programma disponibile è un controllo pertinente quando misura lo stesso problema.

Prima di adottare un grafo complesso verificare il beneficio rispetto a descrittori più semplici. Un eventuale successo promuove soltanto task e condizioni testati; il trasferimento ad altre modalità richiede una verifica propria. Sono possibili esiti favorevoli, sfavorevoli e inconcludenti.

## NDR-040 — Gate, budget e stato devono seguire il percorso realmente verificato
**Status:** ACCEPTED

Prima dei risultati definire unità indipendente, pool, campionamento, numerosità motivata, miglioramento minimo utile o soglia, pareggi/incerti, renderer, palette e regola di arresto. Distinguere qualità generale, qualità Trap e utilità del beat completo. I vecchi esempi decisionali restano regressioni; il test finale usa famiglie non impiegate nella selezione delle ipotesi.

Misurare candidato singolo e sistema con selector. Dichiarare budget equivalente di candidati/selezione oppure il compromesso costo/qualità. Fissare hardware, memoria, durata di training e latenza prima del modello, senza rimandare questi vincoli alla produzione.

Le attività dati sono prerequisiti del task che supportano: PDMX tonale o Sonic Pi non bloccano automaticamente ogni prova drum. Le prove tecniche circoscritte non aprono implicitamente training serio o promozione Trap e non aggirano i gate della V2.

CURRENT_STATE deve registrare il blocco effettivamente implementato, prove, limiti e azioni aperte. I dossier precedenti restano fotografie al commit dichiarato. Ricerca di apertura e chiusura si applicano al blocco concreto: uno smoke test o una revisione documentale non chiudono un gate musicale.

## NDR-041 — Source record e source collection sono identità distinte
**Status:** ACCEPTED

`provenance.sourceId` identifica il record/composizione concreta e resta granulare. Source Registry e usage policy possono invece identificare una collection più ampia.

L'audit reale del Blocco 2 sulle 502 candidate ha trovato **301 provenance source ID** appartenenti a **6 source collection**. Il confronto diretto fra i due livelli produceva 301 falsi unresolved; dopo la correzione il risultato è **0 unresolved**.

Regola:

- preservare il `sourceId` granulare originale;
- non duplicare il Source Registry per ogni record;
- risolvere la collection soltanto con exact match o prefisso delimitato da `:`;
- non usare fuzzy matching;
- mantenere tracciabili `subjectSourceId` e `policySourceId`;
- non confondere source record, source collection e composition family nei futuri split/gate.

Digest corpus verificato: `fec26d6184548454b94abd452032b29dab8417e47d0058595646282aee7e7f79`.

Questa decisione riguarda identità e tracciabilità. Non promuove capability, qualità o usi musicali e non sostituisce l'ammissibilità task-specifica di NDR-035.

## NDR-042 — Task Admissibility separata dal corpus generico e fail-closed sugli export Phase 7
**Status:** ACCEPTED

Il phrase corpus comune, il phrase builder e i gate storici restano riusabili e non incorporano automaticamente le policy di ogni task. L'autorizzazione a usare una phrase in un nuovo export/training Phase 7 viene decisa da un gate task-specifico separato.

La decisione V1 è:

- `allowed`: tutti i requisiti necessari del task risultano soddisfatti;
- `blocked`: esiste un divieto o un requisito esplicitamente fallito;
- `unknown`: manca evidenza necessaria oppure lo stato è soltanto `candidate`.

Solo `allowed` entra nel manifest task-specifico. `candidate`, `unknown`, policy assente o capability/qualità non dimostrate non equivalgono a permesso.

Il gate combina almeno usage policy, diritti richiesti dal task, contenuto osservato, capability, qualità pertinente, restrizioni source e provenance/linkage. Le motivazioni sono machine-readable e mantengono evidenceRef.

Readiness del task e readiness del training sono concetti distinti: un task tecnico/debug può essere `taskReady=true` senza essere un training task; in quel caso `trainingReady=N/A`.

Verifica reale sulle 502 candidate:

- debug: 47 allowed / 0 blocked / 455 unknown;
- drum groove pretraining: 0 allowed / 333 blocked / 169 unknown;
- drum musical target: 0 allowed / 380 blocked / 122 unknown.

I due zeri musicali non vengono aggirati: indicano che l'evidenza corrente non basta ancora ad autorizzare quei training.

## NDR-043 — Source fidelity versionata fuori dal canonico V1; Task View derivata senza ricostruzione
**Status:** ACCEPTED

La fedeltà MIDI necessaria a una Task View viene preservata **prima** della normalizzazione lossy e mantenuta come payload `sourceFidelity` versionato nel dataset item. `fame-neural-sequence-v1` resta la common representation e non viene modificato per trasportare automaticamente tutti i dettagli raw.

Per gli eventi drum la source fidelity V1 conserva almeno:

- `sourceEventId` deterministico;
- track/channel;
- MIDI note originale;
- source `startTick` e `durationTicks`;
- velocity/velocityOff;
- source PPQ;
- mapping id/version;
- proiezione canonica tracciabile.

La phrase derivata conserva una slice della source fidelity riferita alla propria finestra e mantiene gli ID degli eventi sorgente. Una Task View può quindi usare l'informazione raw necessaria senza passare attraverso `perc` già aggregato e senza inventare la nota originale.

Verifica reale su GMD: 6/6 MIDI importati, 2382 raw drum events preservati e 35/35 phrase con linkage source fidelity.

Regole:

- il canonico V1 resta intenzionalmente più compatto e può essere lossy per classi drum/timing sorgente;
- una perdita del modello non equivale a perdita della sorgente se il sidecar resta disponibile e tracciabile;
- gli artefatti storici già materializzati senza source fidelity non vengono retroattivamente “riparati” per inferenza;
- una Task View che richiede informazione non presente deve reimportare la sorgente o dichiarare il dato non disponibile;
- uguaglianza dei conteggi raw/canonical è un'invariante tecnica utile, non una prova di qualità musicale.

La decisione implementa NDR-033 e NDR-036 senza revocare NDR-017/FAME Compound come common representation.

## NDR-044 — Drum View V2 preserva gli hit prima di comprimere il modello
**Status:** ACCEPTED

La Drum View V2 usa una griglia metrica come **riferimento**, non come autorizzazione a distruggere eventi sorgente.

Regole:

- ogni hit mantiene raw MIDI note, velocity, source timing e `sourceEventId`;
- il microtiming viene derivato da source tick/PPQ e mantenuto come offset continuo;
- più hit che ricadono sulla stessa lane e sullo stesso frame restano eventi distinti nel dataset task view;
- eventuali encoding di modello più compatti possono essere confrontati dopo, ma la loro perdita non viene incorporata silenziosamente nel dataset;
- mapping strumentali sono versionati e source-aware;
- `gmd-9-v1` è un adapter di comparabilità per GMD, non una tassonomia universale Trap;
- note non coperte da un adapter devono mantenere una raw-note lane o produrre un errore esplicito secondo la policy del mapping;
- `fill/core/variation/loopability/boundary` non vengono inferiti dalla sola finestra fissa;
- la gestione della proiezione a ridosso del bordo resta una policy separata da chiudere in 7G.

Sul campione GMD reale il Block1 conserva 2382/2382 hit, 15 note MIDI uniche e 65 lane/frame con multi-hit. Le 8 proiezioni marcate al bordo conservano raw timing e nearest-step originale e vengono trattate come evidenza che la boundary policy non è ancora congelata.

Questa decisione restringe la rappresentazione del **dataset/task view**, non anticipa il formato interno del futuro modello.

## NDR-045 — Owned-beats: automazione, fedeltà e promozione per task

Data: 10 settembre 2026. Stato: adottata come contratto operativo; conversione/pilot non ancora eseguiti.

Si recepisce il protocollo W1–W10 del playbook: operazioni ripetitive automatizzate; originali intatti; identità asset/record/famiglia/run/artefatto distinte; manifest canonico; stati tecnici, QA per ruolo e ammissibilità separati. NDR-041/042/043/044 restano in vigore. Famiglie ignote, mapping ambiguo o eventi non dimostrati non sono promossi automaticamente. La coincidenza kick–808 dopo anchoring non prova fedeltà; il pilot misura omissioni, falsi positivi, timing, pitch e costo di correzione.

Le lezioni del prototipo diventano candidate con evidenze, poi regole adottate dopo verifica; la rigenerazione conserva versioni e revisioni. FULL deriva da eventi identificati e non somma viste sovrapposte. I derivati condividono lo split della famiglia; augmentation coerente col task.

Owned-beats è candidata operativa per parti abbinate, non corpus già ammesso. GMD generale e HH-TRP candidata restano nel percorso ufficiale. Bootstrap disponibile per inventario/copia soltanto; training chiuso; Block2 7D da iniziare.


### Precisazione operativa NDR-045 — integrità delle reference (10 settembre 2026)

Il riferimento storico «Block2 7D da iniziare» sopra descrive lo stato all'adozione: Block2 è ora completato nel proprio scope tecnico, come registrato in CURRENT_STATE. I candidati di split non sono uno split finale autorizzato.

Si recepisce la sezione «Hardening reference umane» del playbook: riascolto non mutante, quantizzazione esplicita con storico, copertura dichiarata, invalidazione delle revisioni dopo le modifiche e tempo di annotazione distinto dal costo di correzione V1/V2. Il runner holdout verifica il freeze e riserva le famiglie prima dell'audio. Queste sono correzioni del contratto operativo esistente, non nuove fasi né prova di qualità delle reference. Il gate umano resta aperto.

### Precisazione successiva NDR-045 — Human Reference development finalizzata (11 settembre 2026)

Lo stato operativo successivo supera il solo riferimento temporale «gate umano aperto» della precisazione del 10 settembre. La prima snapshot `audio-analysis-v2-dev-reference-precision-v1` resta preservata come storico, ma l'hardening del commit `4bed0ffacc82402bbf1737b308d14cc87c950431` ha reso obbligatoria la dichiarazione di copertura delle finestre. Le stesse 8 composition family sono state quindi riconfermate senza ricostruire artificialmente raw tap o quantization history.

La reference development definitiva per il confronto è `audio-analysis-v2-dev-reference-precision-v2`, 8/8 family e 24/24 finestre `COMPLETE`, submission digest `f63c37bf557a82e32c5a1c58b381501e043ff6e08832b7a3434742521521fa18`. La regola resta invariata: il tempo registrato durante la raccolta misura la creazione/verifica della reference e **non** il costo di correzione di V1/V2. Il costo di correzione delle candidate viene raccolto separatamente quando il confronto lo rende possibile. Nessun holdout è stato osservato e la finalizzazione della reference non autorizza tuning, Source Separation, Audio→MIDI o training.
## NDR-046 — Audio Analysis: confronto paired sulla stessa reference versionata

Data: 11 settembre 2026. Stato: adottata.

La baseline `v1-baseline-development-001` e il relativo contratto restano immutabili contro `audio-analysis-v2-dev-reference-precision-v2`. La successiva revisione musicale della Human Reference non riscrive quello storico.

Se `audio-analysis-v2-dev-reference-precision-v3` viene finalizzata e diventa la reference di scoring per una candidata V2, V1 deve essere rieseguito append-only contro la **stessa** snapshot v3 (`v1-baseline-development-002` o run successiva esplicitamente versionata). È vietato interpretare come confronto paired `V1-v2` contro `V2-v3`.

La correzione della reference precede il tuning ed è ammessa soltanto per motivazione musicale/di integrità, mai per inseguire il punteggio del baseline/candidato. Holdout e output candidato restano separati dalla costruzione della reference.

## NDR-047 — Human Reference beat: `beatTimesSeconds` è l'unica timeline autorevole

Data: 11 settembre 2026. Stato: adottata.

Nell'editor Human Reference i marker reali (`beatTimesSeconds`) costituiscono l'unica fonte di verità temporale. Metronomo/bip, nudge, shift globale, quantizzazione e ogni futura trasformazione di periodo devono leggere e modificare direttamente lo stesso array.

Sono escluse ghost grid, shadow grid o seconde timeline persistenti che possano divergere dai marker reali. Un eventuale futuro stretch deve trasformare direttamente i marker autorevoli. Stato browser/localStorage non viene azzerato o ripristinato sopra il lavoro corrente senza scelta esplicita dell'utente.

`Calcola BPM dai marker` resta una derivazione dal set di marker corrente (mediana degli intervalli validi sulle tre finestre), non un'analisi dell'audio e non una trasformazione della griglia. Differenze diagnostiche fra finestre non vengono normalizzate a forza quando il riascolto con bip conferma coerenza musicale.
## NDR-048 — precision-v3 e baseline002 sono il riferimento paired corrente di Audio Analysis

Data: 11 settembre 2026. Stato: adottata.

`audio-analysis-v2-dev-reference-precision-v3` è finalizzata con submission digest `6e80e998cf2e5725f346989f707cb59a0b44f218d8909012171d0b9ebbec91af`. La baseline V1 coerente con questa reference è `v1-baseline-development-002`, report SHA256 `4bebe4af0ed4bd8b0d1796432c54099c1705a3494d258c2eb10bc85033e2b714`, congelata sul commit `4cd217a2baa50565b16997ab8cbee8308fc93222`.

Per ogni futura decisione V2 sul development, il confronto paired valido è `V1-v3` contro `V2-v3`. `baseline001 / precision-v2` resta storico e non viene usata come control arm contro una candidata valutata sulla v3.

Il calo osservato fra baseline001 e baseline002 non è una regressione di V1: il sorgente baseline è rimasto congelato. È l'effetto della revisione della reference. La diagnostica delle sezioni può rieseguire le feature V1 ed esporre curve/picchi/scarti, ma non modifica soglie e non conta come configurazione V2. La prima configurazione V2 viene numerata soltanto quando cambia il comportamento candidato.

Holdout, Source Separation, Audio→MIDI e training serio restano chiusi.

## NDR-049 — config-001 supera il gate metrico ma resta congelata in attesa del review umano

Data: 11 settembre 2026. Stato: adottata.

La prima configurazione V2, `audio-analysis-v2-config-001`, è stata congelata prima dell'osservazione dei risultati al commit `43530f44c5e753a1ab024a5be235dc2363c2f7ba` e conta come configurazione **1/8** del budget frozen.

Sul development `precision-v3`, contro `v1-baseline-development-002`, il confronto paired produce:

- Beat F1: delta mediano `0.0`;
- Section F1 @0,5 s: `0 → 0.171429`;
- Section F1 paired median delta: `+0.071429`;
- beat/BPM/meter invarianti;
- metric gate: `V2_WINS_METRICALLY`;
- decisione development: `INCONCLUSIVE_REVIEW_PENDING`;
- holdout osservato: no.

Candidate report SHA256: `3047e7e15cd0efff7a4c7840b25b7c8a7e78e9fa583800861ae3f806eb2324e8`.

Paired comparison report SHA256: `8459bd85d01d47b34152ba63c862734dfb4a272ac3728506aea78892e179f398`.

Questo risultato dimostra un miglioramento materiale delle sections secondo la soglia frozen `+0.05`, senza regressione del target beat. Non dimostra ancora una vittoria finale della V2 né che il detector sections sia soddisfacente in assoluto.

Prima di qualsiasi `config-002` o apertura holdout viene completato il required human correction-cost review della config-001 su almeno 6 development family comparabili. Se l'aumento relativo mediano del costo candidato supera `+25%`, la vittoria automatica è bloccata. Fino a quel review, config-001 resta immutata e l'holdout resta chiuso.

L'eventuale `V2_WINS` finale viene dichiarato soltanto dopo il completamento del review richiesto e la verifica con le regole frozen. Source Separation, Audio→MIDI e training serio restano chiusi.
