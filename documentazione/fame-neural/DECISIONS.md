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

## NDR-050 — Easy sanity set separato: difficoltà del pilot plausibile, V1 debole anche sul semplice, localization V2 da distinguere dalla detection

Data: 11 settembre 2026. Stato: adottata.

Dopo il freeze e il metric gate positivo di `audio-analysis-v2-config-001`, tre beat boom bap intenzionalmente semplici e ripetitivi sono stati usati come sanity set **separato**. Non appartengono al development ufficiale, non appartengono all'holdout, non autorizzano training e non modificano il budget V2.

La prima Human Reference ha annotato 27 boundary interne, 9 per traccia, con `candidateOutputsExposed=false`. V1 propone soltanto 3 boundary totali e ottiene Section F1 @0,5 s pari a `0` su tutte e tre le tracce. Quindi la debolezza V1 sulle sections non è spiegabile soltanto dalla difficoltà delle 8 family development.

`config-001` propone 25 boundary totali contro le 27 umane. Prima del raffinamento waveform ottiene median family Section F1 `0.333333` @0,5 s e `0.777778` @3 s. Il conteggio vicino alla reference e il forte risultato permissivo supportano una sensibilità strutturale reale, non una semplice oversegmentation casuale.

Un secondo passaggio cieco con waveform ha preservato identità e numero delle stesse 27 boundary, senza permettere add/delete e senza mostrare output V1/config-001. Dopo questo raffinamento:

- V1 median Section F1 @0,5 s: `0.000000`;
- config-001 median Section F1 @0,5 s: `0.222222`;
- config-001 median Section F1 @3 s: `0.777778`.

`Street Candy` è il failure mode più chiaro: la correzione umana con waveform sposta le boundary di soli `0.067 s` mediani (`0.107 s` massimo), ma config-001 resta `0` @0,5 s e `0.875` @3 s. I sette match @3 s sono spostati prevalentemente di circa `0.61–0.70 s`, con un caso `1.328 s`, coerenti con circa uno o due beat a ~92 BPM.

La conclusione adottata è:

1. il development ufficiale può essere comparativamente più difficile del sanity set semplice; questa è evidenza di supporto, non una misura formale completa della difficoltà del pilot;
2. V1 resta insufficiente sulle sections anche su materiale semplice;
3. `config-001` migliora la detection della zona strutturale;
4. la localizzazione sul beat esatto è un failure mode separato e reale;
5. un eventuale futuro intervento potrà valutare un boundary-refinement/localization stage senza assumere che il detector contestuale debba essere sostituito.

Questo sanity set non cambia la decisione protocollo: `V2_WINS_METRICALLY / INCONCLUSIVE_REVIEW_PENDING`. `config-001` resta congelata, `config-002` non viene aperta prima del required human correction-cost review e l'holdout resta chiuso.

I file audio e gli artefatti diagnostici restano esterni a Git; la repository conserva soltanto il checkpoint, gli SHA256 delle sorgenti/artefatti e le conclusioni verificabili.

## NDR-051 — Correction-cost review config-001 congelato prima dell'osservazione

Data: 11 settembre 2026. Stato: adottata.

`audio-analysis-v2-config-001` ha superato il gate metrico development ma resta `INCONCLUSIVE_REVIEW_PENDING` finché non viene completato il required human correction-cost review previsto dal protocollo frozen.

Prima di osservare qualsiasi tempo di review vengono congelati metodo e tool:

- tutte le 8 family development vengono pianificate; il minimo protocollo resta 6 comparabili;
- review limitata alle section boundary perché beat/BPM/meter sono esattamente invarianti fra V1 e config-001;
- due passaggi per family, uno V1 e uno config-001, con identità arm nascosta;
- Human Reference frozen non mostrata al reviewer;
- ordine family randomizzato alla preparazione del package;
- ordine arm controbilanciato 4 family V1-first / 4 family V2-first;
- chiave V1/V2 privata fuori dalla web root;
- azioni consentite: move/add/delete boundary;
- timer attivo da START esplicito a chiusura passaggio, includendo ascolto/ispezione/editing/verifica ed escludendo pausa e tab in background.

La metrica è `HUMAN_REVIEW_SECONDS_PER_AUDIO_MINUTE`.

Per ogni family comparabile:

`relativeIncrease = (candidateSecondsPerAudioMinute / baselineSecondsPerAudioMinute) - 1`.

Se il costo baseline è zero il pair non viene forzato con epsilon e viene marcato non comparabile.

L'aggregazione è la mediana delle family comparabili. Il veto scatta solo se la mediana **supera** `+25%`; esattamente `+25%` non supera la soglia.

Il finalizer confronta inoltre le boundary corrette con la Human Reference frozen a `0,5 s` e `3 s` come QA diagnostico, senza mostrare la reference durante il review.

Se il metric gate resta `V2_WINS_METRICALLY`, almeno 6 family sono comparabili e il veto costo non scatta, la decisione development diventa `V2_WINS`. In caso di review mancante o veto costo, la decisione resta `INCONCLUSIVE`; non viene forzato `V1_WINS`.

Fino al completamento di questo review:

- config-001 resta immutata;
- config-002 non viene aperta;
- holdout resta chiuso e non osservato;
- nessun Source Separation, Audio→MIDI o training serio viene autorizzato da questo avanzamento.

## NDR-052 — Correction-cost reviewer: playhead waveform obbligatorio, nessun cambio al protocollo

Data: 11 settembre 2026. Stato: adottata.

Al primo utilizzo operativo del correction-cost reviewer è emerso un difetto UI: la waveform mostrava i marker di section ma non la posizione corrente della riproduzione. Questo rendeva inutilmente difficile localizzare temporalmente una boundary durante l'ascolto.

La correzione è esclusivamente di interfaccia:

- aggiunge un playhead verticale sincronizzato con `audio.currentTime`;
- aggiunge il timestamp corrente sopra la waveform;
- aggiorna il playhead durante play, pause, seek e scrub;
- al cambio sessione la posizione audio torna a zero;
- un eventuale draft **non completato** creato con la UI precedente non viene ripreso: il passaggio corrente riparte da tempo zero e dai marker iniziali; i passaggi già completati, se presenti, restano preservati.

Non cambiano:

- candidate V1/config-001;
- marker iniziali;
- assegnazione cieca e ordine 4/4 già materializzati;
- `packageIdentityDigestSha256` `690d1661d45f43e6a517b476ba43dfa16f5f4b6d46eddc7f4a83bf44dbacc8ed`;
- Human Reference;
- metrica `HUMAN_REVIEW_SECONDS_PER_AUDIO_MINUTE`;
- soglia `> +25%`;
- regole del timer;
- protocollo;
- config budget;
- holdout, che resta non osservato.

La patch viene applicata sia al tool versionato sia al `web/index.html` del package cieco già preparato. `review-package.json` e la chiave privata non vengono rigenerati.



## NDR-053 — Correction-cost reviewer: selezione marker resa esplicita e controlli Move/Delete corretti

Data: 12 settembre 2026. Stato: adottata.

Nel primo utilizzo del reviewer con playhead funzionante è emerso un secondo difetto UX/logico: `Sposta selezionata` ed `Elimina selezionata` venivano abilitati appena iniziava la sessione, ma i relativi handler operavano soltanto quando `selectedMarker != null`. Senza una selezione esplicita i pulsanti risultavano quindi cliccabili ma non producevano alcun effetto.

La correzione:

- abilita Move/Delete/Deseleziona soltanto quando esiste davvero una boundary selezionata;
- mostra sempre lo stato della selezione e il timestamp della boundary attiva;
- permette di selezionare una boundary cliccando direttamente la sua linea sulla waveform;
- centralizza move/delete in funzioni condivise usate sia dai pulsanti globali sia dalla lista marker;
- rinomina `Sposta selezionata al cursore` in `Sposta selezionata al playhead`, eliminando l'ambiguità fra mouse e posizione audio;
- mantiene il click su waveform: con marker selezionato sposta, senza marker selezionato aggiunge una boundary;
- cambia la revisione UI a `controls-v3`, per cui un draft incompleto della UI precedente non viene riutilizzato; le sessioni già chiuse restano preservate.

Non cambiano candidate, marker iniziali, assegnazione cieca, ordine 4/4, Human Reference, protocollo, metrica, soglia, config budget o holdout.

`review-package.json` e la chiave privata non vengono rigenerati; `packageIdentityDigestSha256` resta `690d1661d45f43e6a517b476ba43dfa16f5f4b6d46eddc7f4a83bf44dbacc8ed`.



## NDR-054 — Candidate freeze: configHash allineato all'identità algoritmica e commit tooling discendenti ammessi

Data: 12 settembre 2026. Stato: adottata prima di qualunque accesso holdout.

Durante la verifica del `candidate-freeze.json` di `audio-analysis-v2-config-001` è emersa un'incoerenza nel validatore `candidate_freeze.py`.

La configurazione V2 congelata e l'evaluator definiscono `configHash` come SHA-256 canonico di `algorithmConfig`. Per config-001 il valore ufficiale è:

`04e00482802c46dda876733b7210992cab9eadbafa33153266a483b4a90b81b3`.

Il validatore del freeze, invece, stava calcolando il digest dell'intero envelope JSON della config, includendo metadati e lo stesso campo `configHash`. Questo rendeva impossibile validare correttamente un freeze coerente con lo sviluppo già concluso.

La correzione:

- `config_digest()` usa `algorithmConfig` quando presente, mantenendo compatibilità con le fixture generiche;
- il `configHash` dichiarato nella config deve coincidere con freeze e development summary;
- il `candidateId` della config deve coincidere con il freeze;
- il commit development congelato può essere un antenato dell'HEAD corrente, così commit successivi esclusivamente di tooling/validazione non invalidano retroattivamente il candidato;
- l'integrità del candidato viene comunque chiusa verificando il Git blob della sorgente corrente contro `evaluatedCandidateSourceGitBlobSha1` della development summary e `candidateSourceGitBlobSha1` della config;
- dependency lock, protocol digest, ambiente Python, FFmpeg, development summary digest e checkout pulito restano obbligatori.

Questa modifica non cambia `audio-analysis-v2-config-001.py`, `algorithmConfig`, risultati development, correction-cost review, candidate identity o holdout policy. Il candidate freeze già scritto non viene rigenerato: viene verificato con il validatore corretto.

L'holdout resta non osservato fino al completamento con esito positivo della verifica del freeze.

## NDR-055 — Audio Analysis V2 config-001 chiude development con V2_WINS e apre solo il gate holdout one-shot

Data: 12 settembre 2026. Stato: adottata.

La correction-cost review cieca di `audio-analysis-v2-config-001` e stata finalizzata su 8/8 family comparabili. La mediana dell'incremento relativo del costo di correzione e `-0.010704` (~-1,07%), quindi non scatta il veto congelato `> +25%`.

Con il metric gate gia `V2_WINS_METRICALLY`, la decisione development ufficiale diventa **`V2_WINS`**.

Artefatti congelati:

- correction-cost report SHA256 `51a9a08a33d5ee0e7464f38170aef9b54637bdb5fd8c7576836acf916baa4464`;
- development summary SHA256 `cd4abdfbea40619249559469ec73dcdd730824db349ecb7a8fd7b8a731a3fb5a`;
- candidate freeze SHA256 `5ab2e4d996123f6a22a15a8b3fa1f6eafb0f0097b3f0c074aefe59c6928b50a3`;
- configHash `04e00482802c46dda876733b7210992cab9eadbafa33153266a483b4a90b81b3`;
- development commit `8702e8e72969b8f3decc3636b3aeff310fcbef9d`.

Il candidate freeze e stato verificato dopo la correzione semantica del validator documentata in NDR-054. Candidate source, config e protocollo restano invariati.

Da questo punto config-001 non viene piu modificata, config-002 non viene aperta per migliorare il risultato corrente, l'holdout resta non osservato fino alla singola evaluation finale e dopo l'osservazione non e consentito tuning sullo stesso set. L'audit di diversita/difficolta del pilot resta separato e non deve usare l'holdout come set di sviluppo.

## NDR-056 — Holdout Audio Analysis: preflight metadata-only e reservation one-shot separata dall'accesso audio

Data: 12 settembre 2026. Stato: adottata prima di qualunque accesso holdout.

Dopo la chiusura development di `audio-analysis-v2-config-001` con `V2_WINS` e candidate freeze verificato, viene introdotto un boundary gate dedicato alla futura evaluation holdout.

Il gate separa due operazioni:

- `preflight`: verifica protocollo, candidate freeze, config congelata, integrità degli split nel manifest, presenza di esattamente 10 composition family holdout e assenza di utilizzi/reservation precedenti;
- `reserve`: crea la reservation one-shot mediante `candidate_freeze.reserve_holdout()` prima di qualunque accesso futuro agli audio holdout.

Il `preflight` è esplicitamente metadata-only: non apre, non hash-a, non prova e non decodifica `localPath` degli asset holdout. La reservation è un comando separato, esplicito e irreversibile; non viene eseguita durante sviluppo, test o preflight.

Il test di regressione usa path audio volutamente inesistenti e verifica che selezione e reservation metadata funzionino senza accesso audio. Verifica inoltre:

- 10 family holdout esatte;
- nessun overlap di `compositionFamilyId` tra development e holdout;
- esattamente un source record per family holdout;
- blocco su reservation/uso precedente anche con candidateId differente;
- semantica one-shot della reservation.

Questa modifica non osserva l'holdout, non genera Human Reference holdout, non esegue V1/V2 sulle 10 tracce e non cambia candidate, config, protocollo o freeze.

Il prossimo passaggio consentito, solo dopo `HOLDOUT_PREFLIGHT_PASS`, è preparare il percorso di Human Reference holdout cieca e poi eseguire una singola evaluation finale secondo il protocollo congelato.

## NDR-057 — Audio Analysis R6: config-001 promossa sul final holdout one-shot

Data: 20 settembre 2026. Stato: adottata.

Il percorso R6 è stato completato sul nuovo cohort sostitutivo `evaluation-holdout-r1-v2`, legato alla reservation `b3b3af11aaefb894353a3a80b27b077488d7430a52371bafd91f1a8316fc1ac5` e alla Human Reference finalizzata `audio-analysis-v2-holdout-r1-v2-reference-001` con submission digest `83a28e300daa8b64653354db46afabbcb4737c300e02636bf9b8bcde9c4efe90`.

La singola evaluation finale `r6-final-holdout-001` su 10/10 family produce:

- paired median delta Beat F1 @70 ms: `0.0`;
- paired median delta Section F1 @0,5 s: `+0.545805`;
- technical integrity: PASS;
- beat tracker outputs exactly invariant: `true`;
- same family set / Human Reference / reservation: `true`;
- metric gate: `V2_WINS`;
- protocol outcome: **`V2_PROMOTE`**.

Artefatti finali:

- V1 report SHA256 `7b15a668a602c4357fa3416068b5c809259f282f6c09cdf75a3d9558edc1a264`;
- V2 report SHA256 `423d00e0048535080b8aa85b7ff8993576b03a32d2b5ff63df8dab70a2afe965`;
- comparison report SHA256 `c38046919388b839dce070f6a9503efad6c6fc43045bd6196305ea0056c12d7d`;
- run manifest SHA256 `b108ff2ba8c00591c36fe2dfbd017e95a29bdeb88f27058003fb060ae8afc652`;
- completion receipt SHA256 `268b8736fe8ff3546f67cfdf9d2c553512197c0dfc883411f1670b1e091002d5`.

Decisione: `audio-analysis-v2-config-001` è promossa come versione Audio Analysis per il downstream del pilot. Il holdout R1 v2 è da questo momento osservato e consumato; non viene riutilizzato per tuning o scelta di nuove configurazioni. Qualunque tuning successivo richiede un nuovo untouched holdout.

Questa decisione chiude R6 ma non promuove automaticamente Source Separation, Audio→MIDI, dataset, training o composer completo. Il prossimo blocco resta Source Separation pilot, seguito da Audio→MIDI drums/low-end e QA.

## NDR-058 — Source Separation pilot: baseline HTDemucs OpenVINO riproducibile, holdout escluso

Data: 20 settembre 2026. Stato: adottata per il pilot.

Dopo la chiusura Audio Analysis R6 con `V2_PROMOTE`, Source Separation viene aperta sul solo split `development` di 8 composition family. Il final holdout `evaluation-holdout-r1-v2` è escluso dal pilot e non viene riutilizzato per tuning.

Il baseline primario del pilot è `intel-openvino-htdemucs-v4-97fc578`, 4-stem `drums/bass/other/vocals`, legato alla revision Intel `97fc578fb57650045d40b00bc84c7d156be77547` e agli SHA256 dei due file OpenVINO registrati nel protocollo. La repository modello Intel dichiara licenza MIT.

Questa decisione fissa un baseline riproducibile, non dichiara HTDemucs separatore definitivo. Un secondo modello può entrare nel confronto solo con checkpoint esatto, provenance/licenza verificabili e regola di confronto congelata prima dell'ascolto comparativo.

Il primo blocco implementa preflight metadata-only e prepare append-only con verifica SHA delle sorgenti development. Non esegue inferenza, non autorizza batch sui 131 asset, non promuove `TASK_DATA_READY` e non apre training. Prima di ascoltare gli output del pilot vanno congelati adapter batch, receipt di esecuzione e rubric/criteri QA per stem e utilità downstream.

## NDR-059 — Source Separation: escluso batch via Audacity, backend standalone sul modello congelato

Data: 20 settembre 2026. Stato: adottata.

Il test reale di `mod-script-pipe` su Audacity 3.7.1 ha confermato che la pipe Windows funziona, ma `GetInfo` non espone `OpenVINO Music Separation` come comando utilizzabile dal batch adapter.

La verifica della sorgente Intel dell'effetto mostra inoltre che:

- `m_separationModeSelectionChoice` parte da `0`, cioè modalità 2-stem;
- `m_deviceSelectionChoice` e `mNumberOfShifts` sono stato dell'interfaccia;
- l'effetto non implementa un `VisitSettings` che renda questi controlli parametri di scripting;
- la modalità richiesta dal pilot è invece 4-stem `Drums/Bass/Other/Vocals`.

Non viene quindi introdotta automazione GUI né un comando Audacity fragile. Il batch via Audacity è chiuso come strada non idonea.

Resta congelato lo stesso artefatto modello `intel-openvino-htdemucs-v4-97fc578` già verificato per SHA256. Il prossimo adapter sarà standalone e riproducibile, con ambiente Python separato dal venv Audio Analysis congelato. Prima di installare dipendenze o eseguire inferenza viene usato un doctor read-only per verificare Torch/OpenVINO/FFmpeg e leggere la signature del modello.

Non viene copiato nel repository il wrapper C++ GPL del plugin Intel. L'implementazione standalone deve usare componenti con licenza compatibile e mantenere separata la provenance del modello dalla provenance del codice adapter.

## NDR-060 — Source Separation: ambiente standalone separato e bootstrap coerente con Intel

Data: 20 settembre 2026. Stato: adottata per il bootstrap.

Il doctor reale sul PC ha rilevato Python 3.10.11 e FFmpeg 9.0.1, ma nessuna installazione globale di Torch/OpenVINO. Non viene riutilizzato né modificato il venv congelato di Audio Analysis.

Per ridurre lo scarto rispetto alla toolchain con cui Intel costruisce il plugin HTDemucs/OpenVINO, il bootstrap Source Separation usa:

- Python 3.10.x;
- PyTorch CPU `2.4.1+cpu`;
- OpenVINO `2024.6.0`;
- gli stessi `htdemucs_v4.xml/bin` già congelati per SHA256.

Le versioni Torch/OpenVINO derivano dalla documentazione/build prerequisites Intel del plugin compatibile con Audacity 3.7.1. Il bootstrap è separato in `D:\FAME_NEURAL\venv-source-separation`.

Il file `source-separation-environment-v1.json` contiene i pin di bootstrap, ma **non è ancora il lock transitive definitivo**. Lo script `prepare-source-separation-environment.ps1` crea il venv, verifica il modello e il runtime, quindi cattura `pip freeze --all` e un receipt append-only. Solo dopo la revisione di quel freeze verrà committato il lock esatto e potrà iniziare l'implementazione/esecuzione dell'adapter.

Il setup non apre audio, non esegue Source Separation e non accede al final holdout.

## NDR-061 — Source Separation: freeze transitivo revisionato e lock esatto versionato

**Stato: ACCEPTED — 20 settembre 2026.**

Il bootstrap dedicato `D:\FAME_NEURAL\venv-source-separation` è stato completato con Python 3.10.11, Torch `2.4.1+cpu`, OpenVINO `2024.6.0`, modello HTDemucs congelato leggibile su device CPU e FFmpeg disponibile. Il comando di bootstrap non ha aperto audio, non ha eseguito inferenza e non ha acceduto al final holdout.

Il `pip freeze --all` reale contiene 16 package ed è registrato dal receipt `source-separation-env-v1-001` con SHA256 `e7fd1df0076b79101923900aa280b3c53a46c5b0a166bad75cbf972b7794411a`. Lo snapshot package è congelato in `requirements-source-separation-lock.txt`; il lock repository usa LF canonico ed è verificato separatamente dal digest del file catturato su Windows, così la normalizzazione EOL non viene confusa con una differenza di dipendenze.

Da questo checkpoint è autorizzata **l'implementazione e la verifica tecnica** del clean standalone HTDemucs/OpenVINO adapter sul solo split `development`. Non sono ancora autorizzati accesso al final holdout, batch sulle 131 sorgenti, training o dichiarazioni di task/data readiness. L'esecuzione di Source Separation resta un gate successivo e deve rispettare il protocollo pilot già congelato.

## NDR-062 — Source Separation: opening protocol immutabile, execution contract separato

**Stato: ACCEPTED — 20 settembre 2026.**

Il run append-only `source-separation-pilot-v1-001` è stato preparato contro il digest di `source-separation-pilot-protocol-v1.json`. Quel protocollo di apertura non viene quindi esteso o riscritto dopo la preparazione: modificarne i byte invaliderebbe il controllo di identità già implementato in `source-separation-pilot.js`.

I dettagli che appartengono al blocco successivo — adapter standalone, device, seed degli shift, overlap, signature tensoriale e rubric QA congelata prima dell'ascolto — vivono nel separato `source-separation-execution-contract-v1.json` e in `source-separation-pilot-review-v1.json`. Il protocollo opening resta lo stesso artefatto storico; il contratto execution lo referenzia senza sostituirlo.

L'adapter `source-separation-standalone-adapter.py` è implementato ma, a questo checkpoint, nessuna Source Separation è stata eseguita. Prima della prima inferenza sul solo development devono passare quattro controlli no-audio: verifica del lock ambiente, check del run preparato, self-test dell'adapter e verifica della signature del modello OpenVINO. Final holdout, batch 131, training e dichiarazioni di task/data readiness restano esclusi.

## NDR-063 — Source Separation: pre-inference PASS e receipt append-only obbligatorio

**Stato: ACCEPTED — 20 settembre 2026.**

Il gate no-audio reale del backend standalone Source Separation è passato integralmente prima della prima inferenza: lock ambiente esatto e package set verificati, run `source-separation-pilot-v1-001` ancora `PREPARED_NO_INFERENCE` su 8/8 family development, self-test dell'adapter PASS e modello HTDemucs/OpenVINO congelato compilato su CPU con SHA XML/BIN attesi e signature tensoriale esatta float32. Il gate non ha aperto audio, non ha eseguito separazione, non ha installato package e non ha acceduto al final holdout.

Il pass del gate **non autorizza un batch non tracciato**. Prima della prima inferenza deve esistere un receipt append-only `source-separation-development-inference-v1-001` che congela: manifest pilot e sue 8 identità sorgente, execution contract, review rubric, environment spec/lock/receipt, adapter, batch runner, modello XML/BIN, FFmpeg osservato e parametri di esecuzione. Il batch può leggere soltanto le sorgenti elencate nel receipt e scrive un result receipt append-only per ogni source record.

La configurazione congelata per questo pilot è 4-stem `drums/bass/other/vocals`, 44.1 kHz stereo float32, WAV PCM-f32le, CPU, 1 shift con seed 0, overlap 0.25 e segment length 343980. Le metriche tecniche `peakAbs`, `rms` e `stemSumResidualRmsRatio` vengono registrate senza soglia post-hoc; la promozione resta subordinata alla rubric QA già congelata.

Final holdout, batch sulle 131 sorgenti, training e dichiarazioni di task/data readiness restano esclusi. Un run parziale senza result receipt è fail-closed: non viene sovrascritto né reinterpretato come completato.

## NDR-064 — Source Separation: receipt development congelato prima dell'inferenza

**Stato: ACCEPTED — 20 settembre 2026.**

Il receipt append-only `source-separation-development-inference-v1-001` è stato creato sul workspace reale dopo una nuova esecuzione completa del gate pre-inference. Il receipt contiene 8 record, stato `AUTHORIZED_NO_INFERENCE` e `sourceFamiliesLocked=true`.

La preparazione del receipt non ha aperto audio, non ha eseguito Source Separation e non ha acceduto al final holdout. Di conseguenza il primo output del separatore non esiste ancora e la rubric QA rimane realmente congelata prima dell'osservazione dei risultati.

Prima dell'esecuzione deve passare il check read-only del receipt contro gli artefatti correnti congelati e contro le identità/sha delle 8 sorgenti development. Solo dopo quel check è autorizzato il batch append-only sulle 8 family. Final holdout, batch 131, training e task/data readiness restano esclusi.

## NDR-065 — Source Separation: receipt check PASS, batch development autorizzato

**Stato: ACCEPTED — 20 settembre 2026.**

Il check read-only del receipt `source-separation-development-inference-v1-001` è passato sul workspace reale con stato `AUTHORIZED_NO_INFERENCE`, 8 record, `sourceFamiliesLocked=true`, `finalHoldoutExcluded=true`, `batch131Authorized=false` e `trainingAuthorized=false`.

Il check ha quindi confermato che il receipt continua a corrispondere agli artefatti congelati di repository, al pilot manifest e alle identità/SHA delle 8 sorgenti development. Nessun output stem è ancora stato prodotto.

Da questo checkpoint è autorizzata l'esecuzione append-only del batch HTDemucs **esclusivamente sulle 8 family development già congelate nel receipt**. Restano vietati accesso al final holdout, espansione alle 131 sorgenti, training e dichiarazioni di task/data readiness. Il risultato del batch dovrà essere sottoposto alla rubric QA congelata prima di qualsiasi promozione downstream.

## NDR-066 — Source Separation: prima inferenza development completata 8/8

**Stato: ACCEPTED — 20 settembre 2026.**

La prima inferenza reale HTDemucs/OpenVINO del pilot Source Separation è stata completata in modalità append-only sulle 8 family development congelate: `FAME000011`, `FAME000012`, `FAME000023`, `FAME000040`, `FAME000046`, `FAME000058`, `FAME000080`, `FAME000126`.

Il run `source-separation-development-inference-v1-001` ha terminato con stato `INFERENCE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA`, 8/8 record e `technicalValidationPassed=true`. Il comando ha dichiarato final holdout non acceduto, batch 131 non eseguito e training non autorizzato.

Questo risultato certifica che il percorso reale source audio → HTDemucs/OpenVINO → quattro stem → result receipt append-only funziona tecnicamente sul cohort development. **Non certifica ancora qualità musicale o utilità Audio→MIDI**: la promozione resta subordinata alla rubric `source-separation-pilot-review-v1.json`, congelata prima del primo output.

## NDR-067 — Source Separation: technical QA 8/8 PASS, qualità musicale ancora aperta

**Stato: ACCEPTED — 20 settembre 2026.**

Il technical QA read-only del run `source-separation-development-inference-v1-001` è passato con gate `ALL_8_FAMILIES_PASS`: 8/8 result receipt e 32/32 stem sono stati verificati contro SHA, sample rate 44.1 kHz, stereo, lunghezza della sorgente decodificata e finitezza dei sample.

Le metriche `peakAbs`, `rms` e `stemSumResidualRmsRatio` sono state misurate come diagnostica senza hard threshold, coerentemente con la rubric congelata prima del primo output. In particolare `FAME000126` ha il residual ratio osservato più alto (circa 0.1012), ma non viene introdotta retroattivamente una soglia automatica.

Il PASS tecnico non certifica utilità musicale. Il gate Source Separation resta aperto fino alla review umana congelata di drums e bass: mediana del downstream-usefulness almeno 2 e almeno 6/8 family con voto almeno 2 per ciascuno dei due stem. Solo un eventuale PASS di entrambi apre il pilot Audio→MIDI drums/low-end.

## NDR-068 — Source Separation development PASS: Audio→MIDI drums/low-end aperto

**Stato: ACCEPTED — 20 settembre 2026.**

La Human Review congelata del run `source-separation-development-inference-v1-001` è completata con reviewId `source-separation-human-review-v1-001`, package digest `e860ecd2ae8ccc8ebdafa6069097e03f9443fef15fd1b3f62ed6b620bb35d276` e submission digest `ae63ed188816efb9d272a43549338c3441627505eaaa9e0f78b0b548544343cf`.

Risultato rispetto alle soglie fissate prima dell'ascolto:

- drums: mediana downstream usefulness 2.5; 8/8 family >=2; PASS;
- bass: mediana downstream usefulness 2.5; 7/8 family >=2; PASS;
- technical: `ALL_8_FAMILIES_PASS`;
- outcome: `OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT`.

È quindi autorizzato il prossimo blocco Audio→MIDI **sulle sole 8 family development e limitatamente a drums + low-end**. Final holdout, batch 131, training e task/data readiness restano esclusi.

Le osservazioni qualitative post-review sullo stem `other` mostrano in più family un pattern di buona separazione iniziale seguito da degrado, perdita o riapparizione in sezioni successive. Queste osservazioni non modificano il gate drums/bass, ma impediscono di estendere implicitamente il PASS al ramo tonale. Il tonal Audio→MIDI resta chiuso fino a un gate dedicato.

## NDR-069 — Audio→MIDI development: baseline permissiva, kick fusion e low-end a due stadi

**Stato: ACCEPTED — 20 settembre 2026.**

Dopo il PASS Source Separation, il primo blocco Audio→MIDI resta limitato alle 8 family `development`, senza final holdout, batch 131 o training.

La ricerca di apertura ha escluso dal primo percorso commerciale i pretrained drum model con restrizioni NonCommercial o licenza dei checkpoint non chiarita. Il baseline iniziale usa quindi soltanto il venv Audio Analysis già congelato (`Python 3.14`, `librosa==1.0.0`, FFmpeg) e non introduce checkpoint esterni.

Per i drums vengono confrontati due arm:

- `drums-only-spectral-onset-v1`;
- `drums-bass-kick-fusion-v1`.

La seconda variante esiste per testare direttamente il failure mode osservato nella Human Review Source Separation, dove in più family il kick è risultato assente dal drums ma presente nel bass. Snare/hat restano derivati dal drums; soltanto il kick usa evidenza addizionale low-end.

Per il low-end:

- baseline eseguibile: `librosa-pyin-lowend-v1`;
- candidata ufficiale successiva: `basic-pitch-0.4.0-lowend-v1`, bloccata finché non viene creato un environment separato con lock esatto e freeze del modello;
- TorchCrepe resta backup diagnostico, non autorizzato nella prima esecuzione.

Il protocollo `audio-to-midi-development-protocol-v1.json` è congelato prima del primo output e lega il baseline al Git blob `0e48d49e6c7784b9e26628dcf52becd3d5456b9c`. Il BPM usato per renderizzare il MIDI deve provenire dall'output stimato della Audio Analysis V2 promossa; la Human Reference non può essere usata come input di trascrizione.

Il prossimo passo è un **preflight locale no-transcription**. Solo dopo PASS può essere eseguito il run append-only sulle 8 family development.

## NDR-070 — Audio→MIDI development: preflight locale PASS

**Stato: ACCEPTED — 20 settembre 2026.**

Il preflight locale della baseline Audio→MIDI development è passato con mode `AUDIO_TO_MIDI_DEVELOPMENT_BASELINE_PREFLIGHT_PASS`.

Evidenza osservata:

- 8/8 sourceRecordId development riconosciuti;
- autonomous BPM coverage 8/8 dal report `audio-analysis-v2-config-001`;
- Python `3.14.3`;
- `librosa 1.0.0`;
- FFmpeg `9.0.1`;
- `sourceAudioOpenedByThisCommand=false`;
- `transcriptionExecutedByThisCommand=false`;
- final holdout non acceduto;
- batch 131 non acceduto;
- training non autorizzato.

Il preflight non ha prodotto output Audio→MIDI. È quindi autorizzata la prima esecuzione append-only del baseline congelato sulle sole 8 family development.

## NDR-071 — Audio→MIDI development: prima baseline reale completata 8/8

**Stato: ACCEPTED — 20 settembre 2026.**

Il run append-only `audio-to-midi-development-baseline-v1-001` è stato eseguito sulle sole 8 family development congelate e ha completato 8/8 record con stato `BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA`.

Per ciascuna family sono stati prodotti tre output MIDI:

- `drums-only.mid`;
- `drums-bass-kick-fusion.mid`;
- `bass-pyin.mid`;

oltre al `result.json` con eventi drums, low-end notes e pitch contour.

Il comando ha dichiarato `finalHoldoutAccessedByThisCommand=false`, `batch131AccessedByThisCommand=false` e `trainingAuthorized=false`.

Il completamento del run non promuove ancora alcun arm: prima servono technical QA read-only e Human QA congelata. Basic Pitch resta candidato low-end successivo, non ancora eseguito.

## NDR-072 — Audio→MIDI development: technical QA 8/8 PASS

**Stato: ACCEPTED — 20 settembre 2026.**

Il technical QA read-only del run `audio-to-midi-development-baseline-v1-001` è passato con `ALL_8_FAMILIES_PASS`: 8/8 result receipt e 24/24 file MIDI sono stati verificati per struttura MIDI, PPQ 480, tempo, bilanciamento note-on/note-off, coerenza tra MIDI e result JSON, eventi drums e note/contour pYIN.

Diagnostica osservata, non usata come quality score:

- kick `drums-only`: 102 eventi complessivi;
- kick `drums+bass kick-fusion`: 696 eventi complessivi;
- `FAME000012`, `FAME000023`, `FAME000046`, `FAME000126`: zero kick nel drums-only;
- `FAME000058`: un solo kick nel drums-only;
- low-end pYIN: 1162 note complessive.

Questi conteggi corroborano il failure mode già osservato nella Source Separation, ma non promuovono automaticamente la fusion: la scelta drums deve essere fatta mediante Human QA blind con stesso renderer. Il low-end pYIN richiede confronto umano con lo stem bass originale e diagnostica del contour. Final holdout, batch 131, training e task-data readiness restano chiusi.

## NDR-073 — Audio→MIDI development: kick-fusion selezionato, pYIN qualificato

**Stato: ACCEPTED — 20 settembre 2026.**

La Human QA blind `audio-to-midi-human-review-v1-001` è completata con submission digest `52e7803b56fee6a6a7dea7546b7a6c6c38fdb86b01b6861f07a5a96882518f0d`.

Risultato drums:

- `drums-only-spectral-onset-v1`: mediana 0.5, 3/8 family >=2, totale 10, FAIL;
- `drums-bass-kick-fusion-v1`: mediana 2, 6/8 family >=2, totale 13, PASS;
- arm selezionato: `drums-bass-kick-fusion-v1`.

Risultato low-end:

- `librosa-pyin-lowend-v1`: mediana 2, 6/8 family >=2, totale 13, PASS.

Il PASS pYIN non costituisce ancora promozione definitiva del low-end: il protocollo congelato richiede il confronto con Basic Pitch prima della selezione finale. Outcome della review: `OPEN_AUDIO_TO_MIDI_QA_INTEGRATION`. Final holdout, batch 131, training e task-data readiness restano chiusi.

## NDR-074 — Basic Pitch 0.4.0: provenance corretta e freeze ambiente prima dell'inferenza

**Stato: ACCEPTED — 20 settembre 2026.**

Durante la preparazione del candidato Basic Pitch è stata verificata la provenance del package `basic-pitch==0.4.0`.

Il vecchio protocollo baseline riportava il commit `fa5997af0a8210982619003269994a1be25eddf3` accanto alla versione 0.4.0. Quel commit appartiene a uno stato successivo del repository e non è il commit del tag `v0.4.0`. Il tag ufficiale `v0.4.0` punta a `9991303bba609a3b93089d13ec80d1d495083596`.

Il protocollo baseline già consumato non viene modificato, perché cambiarne l'hash post-run invaliderebbe la tracciabilità storica. La provenance corretta viene invece congelata nel nuovo `basic-pitch-lowend-candidate-protocol-v1.json` e nella spec environment dedicata.

Basic Pitch viene preparato in `venv-basic-pitch` separato, Python 3.10. Prima della prima inferenza sugli stem bass sono obbligatori:

- `pip freeze --all` completo e revisionato;
- lock transitivo esatto commesso in repo;
- backend ONNX verificato;
- SHA256 del modello `icassp_2022/nmp.onnx` incluso nel package congelato e commesso;
- nessun accesso al final holdout, batch 131 o training.

## NDR-075 — Basic Pitch: bootstrap environment PASS, modello ONNX congelato

**Stato: ACCEPTED — 21 settembre 2026.**

Il bootstrap locale `basic-pitch-env-v1-001` è completato senza aprire audio e senza eseguire trascrizioni.

Ambiente osservato:

- Python `3.10.11`;
- `basic-pitch==0.4.0`;
- backend selezionato `ONNX`;
- `onnxruntime==1.23.2`;
- modello packaged `nmp.onnx`;
- dimensione modello 230444 byte;
- SHA256 modello `2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec`;
- SHA256 del `pip freeze --all` locale `9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f`.

Il modello è congelato in spec/protocollo candidato. Il lock transitivo non viene ricostruito dal log di installazione: deve derivare esattamente dal `pip-freeze-all.txt` catturato dal receipt. Fino al commit e alla verifica del lock, l'inferenza Basic Pitch sugli 8 bass stem resta vietata.

## NDR-076 — Basic Pitch: exact transitive lock committato

**Stato: ACCEPTED — 21 settembre 2026.**

Il `pip freeze --all` catturato dal bootstrap locale Basic Pitch è stato committato come `requirements-basic-pitch-lock.txt` senza ricostruire il package set dal log di installazione.

Freeze:

- package count: 44;
- source freeze SHA256: `9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f`;
- repository canonical SHA256: `3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad`;
- `basic-pitch==0.4.0`;
- `onnxruntime==1.23.2`;
- packaged model `nmp.onnx` SHA256 `2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec`.

Il lock è marcato reviewed/committed e il file è forzato LF via `.gitattributes`. Questo non autorizza ancora l'inferenza: prima serve il verifier locale finale che confronta lock repository, freeze locale, receipt, venv corrente e modello corrente.

## NDR-077 — Basic Pitch: exact lock locale verificato, pre-inference gate aperto

**Stato: ACCEPTED — 21 settembre 2026.**

Il verifier locale dell'ambiente Basic Pitch ha restituito `BASIC_PITCH_ENVIRONMENT_LOCK_VERIFY_PASS`.

Sono stati verificati insieme:

- source `pip freeze --all` SHA256 `9374ac7a60f9ba6cc97ae14f9b8627c527bb3ef70833d27e95340d45ff69aa7f`;
- repository lock SHA256 `3613fc36f85e54629e14e98cd05648eb2b3d1ddd2b2f3ee87360299f464a60ad`;
- package set 44/44 identico;
- Python `3.10.11`;
- `basic-pitch==0.4.0`;
- backend `ONNX`;
- `onnxruntime==1.23.2`;
- modello `nmp.onnx`, 230444 byte, SHA256 `2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec`.

Il verifier non ha aperto audio e non ha eseguito trascrizioni. È quindi aperto il gate pre-inference development-only. Tale gate può leggere i byte degli 8 `bass.wav` esclusivamente per verificarne gli SHA contro i receipt Source Separation; non può decodificare audio, chiamare Basic Pitch o scrivere MIDI.

## NDR-078 — Basic Pitch: pre-inference gate 8/8 PASS e execution contract congelato

**Stato: ACCEPTED — 21 settembre 2026.**

Il gate development-only ha restituito `BASIC_PITCH_PREINFERENCE_GATE_PASS`.

Sono state verificate 8/8 family e l'integrità degli 8 `bass.wav` tramite SHA contro i receipt Source Separation. Il comando ha letto i byte degli stem esclusivamente per hashing; non ha decodificato audio, non ha invocato Basic Pitch e non ha prodotto MIDI. Source audio originale, final holdout, batch 131 e training restano esclusi.

Prima della prima inferenza viene congelato `basic-pitch-execution-contract-v1.json` con:

- `basic-pitch==0.4.0`, tag `v0.4.0`, commit `9991303bba609a3b93089d13ec80d1d495083596`;
- backend ONNX e modello `nmp.onnx` già congelato;
- API `basic_pitch.inference.predict`;
- onset threshold 0.5;
- frame threshold 0.3;
- minimum note length 127.70 ms;
- frequency range 25–300 Hz;
- pitch bends abilitati;
- melodia trick abilitato;
- BPM per family derivato dall'output autonomo `audio-analysis-v2-config-001`;
- output append-only.

Il runner che prepara/verifica il receipt è congelato al Git blob `0feffda5174f5a4a3a29a986c437384cc8cbc5f7` (commit `1870274e43f3934e42eb5779ef6b69b5d4473dc7`). Il prossimo passo è creare il receipt append-only `AUTHORIZED_NO_INFERENCE`; l'inferenza resta separata.

## NDR-079 — Basic Pitch: receipt 8/8 AUTHORIZED_NO_INFERENCE e executor congelato

**Stato: ACCEPTED — 21 settembre 2026.**

Il run `basic-pitch-development-inference-v1-001` dispone ora del receipt append-only in stato `AUTHORIZED_NO_INFERENCE`, creato dopo il PASS del pre-inference gate.

Il receipt blocca 8/8 family development, gli SHA degli input `bass.wav`, il modello ONNX, l'exact environment lock, la Human QA precedente e i BPM autonomi della Audio Analysis V2. La sua creazione non ha decodificato audio, eseguito Basic Pitch o scritto MIDI.

Per non modificare un artefatto già consumato, l'esecuzione viene affidata a `basic-pitch-development-execute.py`, separato dal receipt runner. Prima del primo output è stato congelato l'executor al Git blob `0027011aa74a001c52918e885864c8bf82891260`.

L'executor:

- carica il modello ONNX una sola volta per l'intero run;
- usa soltanto gli 8 `bass.wav` del receipt;
- verifica che i parametri `receipt.inference` coincidano esattamente con l'execution contract;
- produce per family `basic-pitch.mid` + `result.json` in directory temporanea, poi rename atomico;
- non persiste i raw model tensor;
- può riprendere un run solo se output esistenti e SHA sono già validi;
- lascia final holdout, batch 131, training e task-data readiness chiusi.

Il prossimo passo è la prima inferenza reale Basic Pitch sugli 8 bass stem development.

## NDR-080 — Basic Pitch: v1-001 abortito, superseding v1-002 implementation-only

**Stato: ACCEPTED — 21 settembre 2026.**

Il primo tentativo reale sul run `basic-pitch-development-inference-v1-001` non ha prodotto family output persistenti.

La diagnostica successiva ha verificato:

- exact environment/model lock ancora valido;
- receipt v1-001 ancora valido;
- executor self-test PASS;
- caricamento reale `Model(nmp.onnx)` PASS con backend ONNX;
- 0 family directory complete;
- nessun `inference-summary.json`;
- nessuna temp directory residua.

Nel codice v1 è stato individuato un difetto di implementazione certo: il rename atomico puntava a `root/outputs/<sourceRecordId>` senza creare prima `root/outputs`. Il wrapper v1 non ha conservato l'eccezione Python originale, quindi questo difetto viene registrato come causa certa che rendeva il run non completabile, non come prova che fosse l'unico eventuale failure point precedente.

Per non riscrivere un'implementazione già consumata:

- `v1-001` viene marcato append-only come aborted implementation attempt solo se il workspace conferma ancora zero output/zero summary/zero temp;
- il nuovo run è `basic-pitch-development-inference-v1-002`;
- algoritmo, modello, 8 input stem, BPM e parametri `predict()` restano identici;
- `algorithmChanged=false`;
- il fix è implementation-only: creare/validare `outputs/` prima del model load/inference;
- il nuovo executor scrive `failure-report.json` append-only con stage, family, tipo, messaggio e traceback se dovesse fallire di nuovo.

Questo superseding non autorizza final holdout, batch 131, training o task-data readiness.
