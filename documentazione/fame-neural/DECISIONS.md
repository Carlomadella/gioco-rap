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
