# FAME Neural — Ricerca di apertura della Fase 7

> **Fotografia storica di apertura al commit `1372467`.** Il contratto iniziale 7A è stato successivamente introdotto in `02bc708` e verificato nel [confronto handoff](REVISIONE_HANDOFF_SONIC_PI_2026-09-09.md). Le indicazioni sul prossimo intervento e sull'assenza di risultati sotto si riferiscono all'apertura. Stato corrente e ordine operativo sono in CURRENT_STATE e ROADMAP; questa nota non certifica la chiusura della Fase 7A o del gate dati.

## Esito operativo

La Fase 7 resta **Task Data Reset + Drum Dataset V2**. Il primo blocco implementativo deve rendere espliciti ruolo d’uso, qualità nota e fedeltà dei dati drum. Espandere il corpus prima di questa verifica rischia di moltiplicare esempi con informazione già perduta. Il Neural Planner e il training di prodotto restano rinviati.

Questo documento è un dossier di apertura e una proposta verificabile di blocco, non una nuova roadmap e non una dichiarazione di gate superato. Il test boundary 4-bar loop vs 8-bar contiguous resta aperto: non è disponibile un verdetto umano recuperabile. Non sono stati eseguiti nuovi training, nuovi intake o modifiche al branch.

## Base tecnica e continuità

Verifica del 9 settembre 2026 sul repository `Carlomadella/gioco-rap`, branch `feature/fame-neural-roadmap`, commit `1372467591e7bc99ef8ee92a3e68c86a6cc2977e`, messaggio `docs(neural): aggiorna roadmap v2 con lezioni e nuovi gate`. Sono stati letti integralmente ROADMAP_FAME_NEURAL.md, CURRENT_STATE.md e DECISIONS.md. [1–3]

Il confronto remoto con main restituisce branch divergenti: 35 commit avanti e 121 indietro al momento del controllo. È un dato di storia Git, non una diagnosi di conflitti né una ragione per integrare main durante questa ripresa. Le letture tecniche sono fissate al commit Neural richiesto.

I documenti registrano 502 candidate effettive, 116 groove eleggibili e 60 gruppi nel controllo drum, con split 99/6/11. Questi sono risultati storici documentati, non benchmark rieseguiti oggi. Le 504 phrase del Gate 1 originario certificano la pipeline; non certificano training readiness, identità Trap o musicalità. [1–3]

Restano vincolanti: seed originale per debug, annotazioni euristiche come ausilio, FAME Compound come formato comune, specializzazione senza indipendenza musicale, ascolto umano separato dalle metriche. Il materiale allegato conferma l’handoff V2 ma non contiene l’esito del test boundary. L’albero remoto completo non presenta file nominati come quel diagnostico; questo non prova che l’esperimento locale non esista.

## Domanda e assunzioni del blocco

**Domanda:** quali dati e quali informazioni devono essere disponibili per imparare un groove coerente, prima di scegliere un modello Drum Core?

| Assunzione | Stato | Conseguenza verificabile |
|---|---|---|
| Il canonico attuale basta a ricostruire ogni classe drum | In conflitto con il codice | Conservare/reimportare l’identità sorgente; nessuna ricostruzione inventata |
| 2 barre sono una buona baseline per il core | Supportata dalla letteratura, non dimostrata per FAME | Confronto con altre finestre sullo stesso materiale |
| Più GMD risolve il dominio Trap | Non dimostrata e contraria al ruolo accettato della fonte | Separare pretraining generale e specializzazione |
| 15.000 WAV equivalgono a 15.000 pattern diversi | Non dimostrata | Contare famiglie ritmiche e varianti timbriche separatamente |
| Un rating alto seleziona buoni groove Trap | Non dimostrata | Rating come segnale ausiliario, controllo del ruolo e ascolto |
| Un modello masked sarà superiore a uno autoregressivo | Aperta | Benchmark successivo a parità di dati e informazione |
| Un campione di 116 groove basta al training generalizzabile | Nessuna evidenza sufficiente | Learning curve e conteggi per famiglia, non soglia arbitraria |

## Riscontri nel codice corrente

### Identità strumentale

In `midi/normalize-midi.js`, `eventFromNote` trasforma una nota sul canale drum in `{type, tick, velocity}`: il numero di nota sorgente non viene trasferito. `midi/track-classifier.js` mappa molte note differenti a `perc`. Il problema precede la tokenizzazione FAME Compound. [4]

Il mapping riconosce già 22 e 26 come hi-hat chiuso/aperto: non sarebbe corretto sostenere che questi due casi Roland siano oggi ignorati. Rimane la perdita della distinzione fra tom, crash, ride e altre percussioni. La ricostruzione da un evento `perc` privo della nota originale è ambigua.

La conversione temporale usa arrotondamento alla risoluzione canonica: `Math.round(tick * 960 / sourcePpq)`. Non equivale alla quantizzazione alla sedicesima. La velocity viene convertita in `velocity / 127`. Occorre misurare separatamente perdita PPQ, perdita della griglia neurale e perdita delle classi; non attribuirle indistintamente al canonico. [4]

`core.js` normalizza campi espliciti: aggiungere arbitrariamente proprietà agli eventi senza verificare questa funzione può perderle al passaggio successivo. `midi/dataset-item.js` conserva hash e riepilogo delle tracce, ma quel riepilogo non è un archivio delle singole note originarie. [4]

### Finestre

`dataset/phrase-builder.js` accetta soltanto 4, 8 e 16 barre. L’opzione non supportata `[2]` viene filtrata e sostituita con `[4]`. Il comportamento è stato verificato eseguendo le funzioni del file letto dal commit, senza modificarle. [5]

```text
drumEventType(22) = hat_closed
drumEventType(26) = hat_open
drumEventType(48) = perc
drumEventType(49) = perc
drumEventType(51) = perc
drumEventType(58) = perc
normalizeBuilderOptions({phraseBars:[2]}).phraseBars = [4]
plannedWindows(8,{phraseBars:[2]}) = [{startBar:0,bars:4},{startBar:4,bars:4}]
```

Questo è un controllo di contratto, non un test musicale. Il builder attuale rimane utilizzabile per il suo contratto V1; non va presentato come supporto già esistente alle 2 barre.

### Selezione e policy

`dataset/select-pdmx.js` interseca `no_license_conflict`, `deduplicated`, `all_valid`, poi ordina con hash deterministico. Nella funzione di costruzione del piano non applica rating o rilevanza musicale. [6]

Nel registro GMD è già una fonte umana, ma i requisiti della pipeline riportano hiphop/beat/4-4. Espandere anche stili e fill richiede una configurazione esplicita. HH-TRP è già registrato come non simbolico e senza download automatico. Il seed originale ha diritti e ruoli disponibili: questi campi non devono diventare una promozione a target musicale. [7]

## Ricerca: fonti e alternative

### Groove MIDI Dataset e GrooVAE

GMD documenta 1.150 performance MIDI, 13,6 ore e 22.214 battute; include 503 beat e 647 fill. Sono quantità del dataset originale, non esempi indipendenti già ammessi da FAME. La release MIDI-only pesa circa 3,11 MB. La licenza pubblicata è CC BY 4.0. I metadata includono drummer, session, stile, beat/fill e split. La documentazione segnala differenze Roland/GM, per esempio la nota 58 identifica un tom Roland anziché il vibraslap GM. [8]

GrooVAE studia trasformazioni inverse per recuperare espressività, timing e dinamica. Offre un’alternativa utile al generatore da zero: imparare una competenza circoscritta su performance umane prima della composizione completa. Non dimostra la specializzazione Trap. [9]

**Proposta FAME:** registrare split originale e gruppo di origine prima delle finestre; mantenere distinte performance, famiglie, finestre e augmentation. Non assegnare split diversi a finestre sovrapposte. Un test per batterista può essere un controllo aggiuntivo, ma non è intercambiabile con il benchmark ufficiale.

### MaskBeat

Il paper del luglio 2025 descrive mascheramento bidirezionale su frame binari di nove strumenti, 32 step per due barre, Transformer con 8 layer, 8 head e dimensione 512. Riporta 30.000 loop provenienti da Groove Monkee e Lakh, oltre a loss che codificano prior ritmici. [10]

**Valutazione:** è un confronto utile per modellazione congiunta, non una soluzione da copiare integralmente. La codifica binaria descritta non conserva la velocity originale; i prior di kick/backbeat non dimostrano validità Trap. Le metriche riportate non equivalgono al gate di rappabilità. La pagina di progetto non è risultata accessibile durante questa verifica: riproducibilità del codice non confermata. Scala dichiarata e risultati restano attribuiti agli autori, non replicati.

### Diffusion simbolica condizionata dal testo

Jajoria e McDermott usano 11.340 campioni selezionati da 37.523 MIDI Groove Monkee. La vista è di 128 posizioni su quattro barre e nove voci; il modello usa un autoencoder con LSTM e diffusione in un latente di 128 dimensioni. Valutano anche qualità, aderenza al testo e novità con ascolto. Il lavoro dichiara impiego del dataset commerciale per ricerca e non distribuisce dataset o modello. [11]

**Valutazione:** alternativa concreta alla famiglia masked/autoregressiva, ma introduce un ulteriore collo di bottiglia da verificare nell’autoencoder. L’uso accademico di dati commerciali non autorizza il loro intake in FAME. Per il primo benchmark non serve aggiungere subito un encoder testuale: il task iniziale è groove controllabile, non comprensione di prompt liberi.

### HH-TRP

Il README presenta 15.000 loop audio generati algoritmicamente con pattern MIDI e sostituzione di sample; dichiara CC BY 4.0. La descrizione include Trap e sottostili, ma non quantifica il numero di pattern sorgente indipendenti. [12]

Il deposito Zenodo elenca WAV, un archivio JSON e una mappa di note. Non elenca un archivio MIDI. Non è stato ispezionato il contenuto binario dell’archivio JSON: non si conclude né che contenga eventi completi né che ne sia sicuramente privo. [13]

**Proposta:** prima inventario dei metadata e audit di un campione, poi decisione sulla via simbolica. Il gate richiede struttura degli eventi o trascrizione validata, famiglie ritmiche riconoscibili e giudizio umano; il solo numero di WAV non lo supera.

### Trascrizione audio come alternativa

Separate-and-Detect, preprint del 2 agosto 2026, separa cinque gruppi drum e ricava eventi tramite onset detection. Riporta valutazioni su MDB Drums ed ENST-Drums. È una pista aggiornata per l’alternativa audio→simbolico; qui è stata verificata la scheda/abstract, non replicato il sistema. [14]

**Valutazione:** una trascrizione di HH-TRP sarebbe un dato stimato. Senza gold set manuale non va chiamata ground truth. Prima dell’uso servono precision/recall per classe, errore di onset, gestione dei roll e controlli degli errori fra hi-hat e cymbal. Le cinque macroclassi, da sole, non dimostrano di conservare tutte le distinzioni volute nella Drum View.

### PDMX

La versione del paper del marzo 2025 registra 14.182 brani con rating; zero indica assenza di valutazioni. I rating risultano più informativi su caratteristiche armoniche che su ritmo. Il 67% dei brani manca di tag di genere. [15]

Il repository ufficiale documenta conflitti fra metadata di licenza per 31.221 brani e raccomanda `no_license_conflict`; `all_valid` riguarda la validità degli export. [16]

**Proposta:** preservare questi filtri e confrontare selezione hash con selezione per ruolo e qualità, sullo stesso pool ammissibile. Valori mancanti restano mancanti. Rating e numero di voti devono essere separati; se il secondo non è disponibile nella versione locale, non viene inventato. Nessun ordinamento per popolarità sostituisce la verifica di utilità nel task.

## Contratto proposto per il primo blocco

Il blocco iniziale può essere denominato **Fase 7 — capacità d’uso e fedeltà sorgente**. È una suddivisione del lavoro già previsto, non una nuova fase ufficiale.

| Gruppo | Informazioni proposte | Regola |
|---|---|---|
| Identità | record, source, hash, composition family, intervallo sorgente | Conservare i collegamenti anche dopo slicing |
| Capacità | ruoli osservati, capacità candidate, evidenza | Presenza di note non certifica groove o arrangiamento |
| Utilizzo | debug, pretraining, augmentation, musical target | Seed originale escluso come insegnante musicale |
| Qualità | technical, rights, role, domain, human review | Assi separati; stato unknown esplicito |
| Timing | source PPQ/tick, canonical tick, griglia, offset | Non rappresentare dato mancante come offset misurato zero |
| Strumento | nota sorgente, mapping/versione, classe, articolazione | Nessuna inversione arbitraria di `perc` |
| Struttura | lunghezza, posizione, core/fill candidate, boundary review | Label euristica distinta da annotazione verificata |

`DRUM_GROOVE` e `DRUM_FILL` non devono essere assegnati soltanto perché esistono note percussive. Un label di fonte può costituire evidenza, ma il suo ambito va conservato: un file etichettato beat può contenere un fill interno. `FULL_ARRANGEMENT` richiede una valutazione più forte della semplice co-presenza di tre famiglie strumentali.

### Due strategie di conservazione da confrontare

**A — estensione retrocompatibile del canonico.** Conservare i campi drum necessari nell’importer e verificarli attraverso normalizzazione, slicing ed export. Vantaggio: unica catena dati. Rischio: modifica del contratto condiviso e dei round-trip esistenti.

**B — payload di fedeltà sorgente collegato al canonico.** Un sidecar versionato conserva note, PPQ, timing e mapping con identità stabile. La Task View si costruisce dal record comune arricchito, mantenendo l’interoperabilità V1. Vantaggio: isola il nuovo bisogno drum. Rischio: collegamenti incoerenti, soprattutto con note simultanee, segmentazione e ordinamento.

La proposta iniziale è benchmarkare B come intervento circoscritto, senza congelarla ora come NDR. Gli ID non devono dipendere soltanto dall’indice dopo il sorting. Se manca il MIDI originale, la fedeltà non recuperabile resta unknown e l’esempio non passa il gate che la richiede.

## Benchmark e gate da fissare prima dell’esecuzione

### Fedeltà

Confrontare sorgente, canonico V1 e Drum View candidate. Misurare hit mancanti/aggiunti, mapping per classe, collisioni nella stessa cella, errore di onset e velocity, ricostruzione deterministica e copertura del collegamento sorgente. Per conversioni dichiarate lossless: zero hit persi o aggiunti e uguaglianza dei valori rappresentabili. Tolleranze di quantizzazione dichiarate e motivate prima del confronto.

Una griglia fissa deve essere confrontata con griglia più offset oppure vista a eventi. Roll ravvicinati e terzine sono casi obbligatori: uno slot binario per voce può fondere più colpi. Il microtiming non può essere eliminato per facilitare il modello e poi considerato già verificato.

### Split e scala

Zero contaminazione fra gruppi in train/validation/test. Le finestre e le varianti di una famiglia ereditano lo split; near-duplicate e versioni con sample differenti richiedono un controllo aggiuntivo oltre all’hash. Registrare performance uniche, famiglie, battute, finestre non sovrapposte, distribuzione dei ruoli, quota sintetica per task e copertura per fonte.

La letteratura offre ordini di grandezza, non un minimo trasferibile automaticamente. Il successivo training dovrà produrre curve su frazioni crescenti del train, con modello e test fissi. Un plateau non dimostra da solo sufficienza dei dati: può dipendere dal modello o dalla rappresentazione.

### Boundary

Per il confronto già aperto servono identificativi dei sample, ordine cieco, sorgente e intervalli, renderer/palette, modalità 4+4 ripetuto o 8 contiguo e verdetti. Se queste informazioni mancano, l’esito resta non ricostruibile; un nuovo test avrà una nuova identità.

Il confronto successivo 2/4/8 va fatto entro la stessa performance e distinguendo core da fill. Autocorrelazione e discontinuità sono diagnostiche, non prova di loopability. Riattacco, continuità e senso della variazione devono essere ascoltati. Ripetere una finestra non crea una seconda famiglia indipendente.

### Audit umano e selezione

Campione cieco stratificato per fonte, ruolo, stile, densità e core/fill candidate, selezionato con seed prima dell’ascolto. Identica palette per confronti simbolici; negli audit audio nativi il timbro è un possibile confondente e va dichiarato. Valutazioni separate di coerenza, loopability, dominio Trap e utilità per rap.

La quota minima accettabile non è già definita numericamente nella V2 e non viene inventata qui. Deve essere preregistrata, insieme a numerosità e regola per i casi incerti, prima del gate. Il report mostrerà numeratore/denominatore per strato; una media globale non deve nascondere il fallimento della specializzazione.

## Ricerca di chiusura prevista

La ricerca di chiusura non è ancora eseguibile: il blocco non ha risultati sperimentali. Dopo la misura dovrà verificare le failure mode effettivamente osservate, riesaminare collisioni, mapping, confondenti del timbro e indipendenza delle famiglie, quindi confrontare metriche e giudizi umani. Le conclusioni andranno nei tre documenti canonici; una regola nuova richiederà l’aggiornamento del decision log, preservando il risultato negativo precedente.

## Punto esatto di ripresa

È disponibile una base verificata per progettare il primo blocco dati. Non è disponibile la chiusura del precedente ascolto boundary. Il prossimo input necessario è il suo risultato o il pacchetto identificabile; non serve una nuova diagnosi tecnica da parte dell’ascoltatore. Nessuna promozione di Drum Data Ready o apertura del training è giustificata da questa sola ricerca.

## Fonti

Le fonti esterne sono state consultate il 9 settembre 2026. I risultati dei paper sono attribuiti agli autori; non sono repliche FAME.

1. [Roadmap FAME Neural V2, commit verificato](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/ROADMAP_FAME_NEURAL.md).
2. [CURRENT_STATE, stesso commit](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/CURRENT_STATE.md).
3. [DECISIONS, stesso commit](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/DECISIONS.md).
4. FAME Neural: [normalize-midi.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/midi/normalize-midi.js), [track-classifier.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/midi/track-classifier.js), [dataset-item.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/midi/dataset-item.js), [core.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/core.js).
5. [FAME Neural phrase-builder.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/dataset/phrase-builder.js).
6. [FAME Neural select-pdmx.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/dataset/select-pdmx.js).
7. [FAME Neural source-registry.json](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/dataset/source-registry.json).
8. Google Magenta, [Groove MIDI Dataset](https://magenta.withgoogle.com/datasets/groove), 2019, documentazione ufficiale.
9. Gillick et al., [Learning to Groove with Inverse Sequence Transformations](https://proceedings.mlr.press/v97/gillick19a.html), ICML/PMLR, 2019.
10. Lanzendörfer et al., [MaskBeat: Loopable Drum Beat Generation](https://arxiv.org/html/2507.03395v1), luglio 2025, sezioni 2–3.
11. Jajoria e McDermott, [Text Conditioned Symbolic Drumbeat Generation using Latent Diffusion Models](https://arxiv.org/html/2408.02711v1), agosto 2024, sezioni 3–5 e 8.
12. Patchbanks/WaivOps, [HH-TRP repository](https://github.com/patchbanks/WaivOps-HH-TRP), README e licenza dichiarata.
13. WaivOps, [HH-TRP deposito Zenodo](https://zenodo.org/records/15734094), giugno 2025, inventario file e metadata.
14. Hsu et al., [Separate-and-Detect](https://arxiv.org/abs/2608.01093), agosto 2026, scheda e abstract.
15. Long et al., [PDMX](https://arxiv.org/html/2409.10831v2), versione marzo 2025, sezioni Data Quality e Analysis.
16. Long et al., [PDMX repository](https://github.com/pnlong/PDMX), aggiornamenti su conflitti di licenza e validità degli export.

Materiale di continuità: `Pasted markdown(2).md`, allegato alla ripresa. Contiene lo storico del passaggio alla V2 e i precedenti risultati riportati; non contiene il verdetto boundary richiesto.
