# FAME Neural — Confronto critico fra handoff e roadmap ufficiale

> **Audit storico integrato nella documentazione.** Le affermazioni sul branch e sull'assenza di modifiche si riferiscono al controllo di `02bc708`, prima di questa integrazione. NDR-035…040 adottano le conseguenze operative; roadmap e CURRENT_STATE conservano ordine e stato correnti. Le proposte qui non recepite restano ipotesi. Nessuna correzione di codice è implicita nell'adozione documentale.

## Giudizio

I due handoff sono sostanzialmente coerenti con la direzione della Roadmap V2. Conservano l'obiettivo musicale, le lezioni negative, la separazione dei gate e il principio di scegliere i modelli attraverso esperimenti. Il documento esteso su Sonic Pi propone una pista pertinente, ma non costituisce una specifica pronta per l'implementazione né una dimostrazione che questa pista migliori FAME.

La raccomandazione è mantenere la V2 come struttura di lavoro, correggere alcuni collegamenti e prerequisiti e rendere verificabili i gate. Non emerge una ragione per ripartire da zero. Emerge invece il rischio di costruire molti moduli e molta strumentazione prima di verificare disponibilità dei dati appropriati e utilità musicale del primo sistema completo.

L'analisi è riferita al branch `feature/fame-neural-roadmap`, HEAD verificato il 9 settembre 2026: `02bc708e1f1f8797b9cb5aef8dc24fd45a92393e`. Il commit introduce `content-capabilities` e il relativo smoke test. Sono stati confrontati i due allegati completi, gli otto documenti indicati negli handoff e il codice pertinente. Nessuna modifica alla roadmap o al codice di prodotto è stata applicata. Gli ascolti e il training delle fasi precedenti restano risultati storici documentati, non repliche eseguite per questo rapporto.[^1][^2][^3]

## Relazione fra i due allegati

`FAME_NEURAL_HANDOFF_REVISIONE_ROADMAP(2).md` contiene 637 righe. `FAME_NEURAL_HANDOFF_REVISIONE_ROADMAP_SONIC_PI_AUDIT(1).md` ne contiene 2.249. Le sezioni precedenti alla 12 sono identiche; le sezioni 13–16 differiscono soltanto per un separatore finale. La versione estesa sostituisce la sezione Sonic Pi e aggiunge un'appendice. Non sono due pareri indipendenti che si confermano: sono due versioni dello stesso handoff.

Per la continuità basta mantenere l'esteso come handoff aggiornato e l'altro come versione precedente. La repository conserva l'autorità sullo stato implementato; gli allegati conservano proposte e ricerche che non diventano decisioni accettate solo perché sono scritte in forma prescrittiva.

La corrispondenza delle fasi nella sezione 12.29 è corretta: 7 dati, 8 Drum Core, 9 Arranger, 13 Planner, 14 cross-track. I numeri di sezione della roadmap, per esempio “15. FASE 13”, non sono numeri di fase differenti.

## Confronto delle assunzioni principali

| Assunzione o proposta | Esito | Precisazione operativa |
|---|---|---|
| Primo obiettivo: otto barre Trap credibili e rappabili | Coerente | Deve restare la prova di prodotto; un buon solo di batteria non basta |
| Gate tecnici, dati, rappresentazione e musicalità distinti | Solido | Servono stati e criteri concreti per ciascun task |
| FAME Compound come formato comune | Coerente con NDR-017/029 | Non obbligare la Task View a passare attraverso una versione che ha già perso informazione |
| Dataset separati per capacità e uso | Solido | La presenza di metadati non implica che i selettori li facciano rispettare |
| GMD per groove umano, non prova di dominio Trap | Coerente con fonte ufficiale | Misurare se il pretraining aiuta o produce un feeling non desiderato |
| Seed originale limitato al debug | Coerente con NDR-016 | `unknown` non deve diventare permesso implicito nei consumatori futuri |
| Planner addestrato dopo i Performer | Strategia plausibile | Occorre comunque definire i controlli disponibili prima di allenare i Performer |
| Drum Core e Arranger separati | Ipotesi utile | Confrontare anche un modello condizionato unico su otto barre |
| Refiner separato | Non dimostrato necessario | La coerenza va verificata fin dal primo modello con due parti |
| Sonic Pi come sorgente complementare | Coerente | Non sostituisce la ricerca di esempi musicali adatti e indipendenti |
| Doppio trace di eventi e controllo | Plausibile | Specificare semantica, tempo, copertura e disponibilità dei controlli all'inferenza |
| Analisi statica più esecuzione | Approccio ragionevole | Non è provato che entrambi i canali servano a ogni sottotask |
| Molti seed della stessa sorgente | Correttamente non indipendenti | Raggruppare anche copie, fork e varianti dello stesso programma |
| Licenza del codice separata da quella degli asset | Corretto | Non equivale né a clearance universale né a divieto universale di training |
| Test EVENT contro EVENT+CONTROL | Buona domanda, protocollo incompleto | Aggiungere confronto con controlli semplici e impedire l'accesso al target nascosto |

## Riscontri prioritari nel progetto

### 1. Lo stato documentale non registra ancora chiaramente il blocco 7A

Il modulo, la policy e lo smoke test esistono al commit verificato. Il test originale è stato eseguito in una copia isolata e passa tutti i nove gruppi di controlli. Conferma che il builder non promuove automaticamente le capability musicali, distingue `unknown` da `not_observed` e controlla riferimenti mancanti.[^3]

`CURRENT_STATE.md` continua però a indicare “definire contentCapabilities” fra i prossimi interventi. Il dossier di apertura resta una fotografia del commit `1372467` e dice che il blocco non ha risultati. Questo non rende falso il dossier storico: manca il collegamento esplicito allo stato successivo. Nel materiale remoto esaminato non è individuato un rapporto di chiusura del blocco 7A che colleghi commit, test, limiti e prossimo passo.

**Correzione:** registrare “contratto 7A/blocco 1 implementato; applicazione alla pipeline e gate semantici aperti”. Non dichiarare completata l'intera Fase 7A o la Fase 7 sulla base dello smoke test. La ricerca di chiusura deve riferirsi al blocco effettivamente terminato.

### 2. Un riferimento all'evidenza non prova che la conclusione sia giustificata

`normalizeContentCapabilities` verifica vocabolari, presenza delle evidenceRef e risoluzione degli identificativi. Non verifica l'adeguatezza della prova rispetto alla singola affermazione. Una prova mirata ha costruito una phrase contenente soltanto un kick, poi ha assegnato `FULL_ARRANGEMENT=verified` usando `obs:drums` come evidenza: il normalizzatore restituisce `ok: true`. Accetta anche `musicalTarget=allowed` insieme a `musicalCoherence=fail` nel payload costruito appositamente.[^3]

Questo non significa che il builder promuova da solo quei dati: il builder lascia le capability sconosciute. Dimostra il limite del componente attuale: è un contratto strutturale, non un motore di ammissibilità musicale.

La policy è inoltre opzionale nel builder. Senza passarla, anche gli usi del seed originale rimangono `unknown`. Nella policy fornita sono espliciti debug consentito e musicalTarget bloccato; pretraining e augmentation restano sconosciuti. È compatibile con una gestione prudente soltanto se il consumatore esige un'autorizzazione positiva per il proprio task.

**Correzione:** aggiungere, nel punto di selezione/esportazione, una funzione separata che valuti task, diritto d'uso, capability richiesta, qualità pertinente e restrizioni della sorgente. Non imporre `rappability=pass` a una fixture di debug o a ogni esempio di pretraining generale. Applicare requisiti diversi a usi diversi, senza promozioni implicite.

### 3. La policy non è ancora una barriera verificata lungo tutta la pipeline

Nei file controllati `phrase-builder.js`, `data-ready-gate.js` ed `export-microtrain-dataset.js` non compare il nuovo contratto. Il commit 7A aggiunge tre file senza modificare questi consumatori. Non è quindi dimostrato che la pipeline precedente escluda automaticamente il seed da ogni futuro export musicale.[^3][^4]

**Correzione:** prima del prossimo export di training, verificare il percorso effettivo con un esempio consentito, uno bloccato e uno sconosciuto. Un documento di policy, un normalizzatore e un filtro operativo hanno responsabilità differenti. Questo è un completamento del lavoro dati, non un motivo per invalidare lo storico.

### 4. Il diagramma della rappresentazione può reintrodurre la perdita già scoperta

La sezione 6.3 mostra la catena canonico → FAME Common → Task View. Interpretata come passaggio obbligatorio attraverso il formato quantizzato, contraddice lo scopo di conservare microtiming e identità drum. Il principio “non inventare ground truth” e NDR-033 sono corretti, ma il diagramma resta ambiguo.[^1][^2]

**Correzione:** conservare sorgente e payload di fedeltà, con derivazioni tracciabili verso formato comune e vista del modello. Il sidecar è una soluzione possibile; un'estensione versionata è l'alternativa. La scelta dipende da compatibilità e collegamento stabile degli eventi, non dal desiderio di preservare una freccia nel diagramma.

### 5. Il primo problema di arrangiamento è anche un problema di dati allineati

Il corpus drum non basta a insegnare relazioni kick–808–armonia. Unire batterie da una fonte e bassi da un'altra non crea esempi di interazione autentica. Per le Fasi 9–12 servono sequenze con continuità e parti abbinate, oppure un task di conditioning chiaramente definito che usi esempi realmente compatibili.

**Correzione:** verificare presto la fattibilità del corpus allineato per otto barre, senza iniziare il training di tutti i moduli. Se questi dati mancano, dichiarare il collo di bottiglia; non attendere il completamento di molti Performer per scoprirlo. Sonic Pi può offrire esempi di coordinamento, ma poche sorgenti con molti seed non risolvono automaticamente la scala.

### 6. La coerenza non può essere rimandata interamente alla Fase 14

Il testo della V2 richiede già conditioning tra parti, ma la catena di moduli può suggerire che il Refiner sistemerà gli errori accumulati. La dipendenza deve essere testata quando si introduce la seconda parte. Per l'808, confrontare il risultato con drums e armonia fissati; per il Tonal Performer, verificare anche contesti generati dal sistema precedente.

FIGARO mostra un uso concreto di descrizioni estratte per la generazione condizionata. MMT è un riferimento per una soluzione multitraccia congiunta. Questi lavori sostengono alternative alla catena rigida, senza dimostrare quale vincerà in FAME.[^9][^10]

### 7. Il ruolo del Planner deve essere precisato

Dire che il Planner è necessario “come concetto” è compatibile con un piano strutturale fornito manualmente. Non prova la necessità di una rete separata. Prima dei Performer serve un contratto di controllo: origine di struttura, BPM, armonia, lunghezza e ruoli attivi. Un piano minimo manuale o predefinito può essere un controllo sperimentale; non deve diventare un insegnante musicale inventato.

La differenza fra contesto reale in training e contesto generato all'uso va misurata. Una componente che funziona solo con condizioni perfette non ha ancora superato la prova del sistema completo.

## Sonic Pi: verifica delle affermazioni e limiti tecnici

### Infrastruttura ufficiale

Nel branch ufficiale `dev`, fissato al commit `25baaed3c28003bf141f591081217136194b0d69`, esistono `headless-record.rb` e `headless_boot.rb`. Il recorder esegue codice, registra WAV in tempo reale e può anteporre `use_random_seed`. Il boot espone client e handler OSC. Queste affermazioni dell'handoff sono confermate dal codice.[^5]

Non è stata eseguita una sessione Sonic Pi in questo ambiente. Non sono quindi verificati avvio sul computer di destinazione, riproducibilità audio, throughput del tracing o compatibilità con una release installata. I file del branch `dev` non vanno considerati automaticamente presenti in qualsiasi versione distribuita.

Il seed non basta: vanno registrati reset interni, stato iniziale, input esterni, versione del runtime e dipendenze. Il codice ufficiale documenta che `get` può restituire `nil` quando manca uno stato e che `set` conserva valori fino alla chiusura di Sonic Pi. Una take eseguita in una sessione già utilizzata può quindi dipendere dalla sua storia.[^6]

### Un problema concreto nella fixture `trap-beat-4`

La descrizione dei pattern, BPM 74, density, seed e layer è coerente con lo script. Tuttavia il loop kick legge `get[:r]` e indicizza `k[r]`; il file non contiene un'inizializzazione esplicita di `r` prima di questo utilizzo. La scrittura avviene nel loop hat. Il funzionamento a sessione pulita va verificato: l'analisi statica individua una precondizione non dichiarata, non una riproduzione dell'errore in Sonic Pi.[^6][^7]

Lo script usa inoltre `synth` e `control` per una voce continua, due sample kick sovrapposti e un effetto echo sugli hat. La lista minima di musical calls nella sezione 12.16 omette `synth`. Un registratore limitato a `play` e `sample` perderebbe parte del contenuto rilevante. La fixture è interessante proprio perché espone questi casi; non è ancora una fixture di esecuzione già validata.

### Lo schema proposto è un buon abbozzo, non ancora un contratto sufficiente

| Aspetto | Rischio | Requisito del pilot |
|---|---|---|
| Tempo | `logicalBeat` non chiarisce la relazione fra thread con tempi/density diversi | Tempo logico globale, tempo locale, BPM effettivo e conversione documentata |
| Battute | `bar` implica metro e origine che lo script può non dichiarare | Time signature esplicita o assunzione registrata, mai implicita |
| Note continue | `control` può cambiare pitch senza creare una nuova nota | ID della voce/istanza controllata e traiettoria dei parametri |
| Ampiezza | `amp` non equivale automaticamente a velocity MIDI | Valore sorgente, unità e trasformazione versionata |
| Silenzi | Una chiamata con ampiezza zero può non produrre evento udibile | Distinguere chiamata, evento simbolico e contributo sonoro |
| Sample loop | Una chiamata sample può contenere molti colpi | Non chiamarla singolo HIT senza informazione adeguata |
| Layer | Due sample sullo stesso kick possono essere un solo gesto compositivo | Conservare layer e distinguere onset musicale da duplicazione timbrica |
| Effetti | Echo/reverb alterano l'audio senza corrispondenti chiamate di nota | Dichiarare quale fedeltà si valuta e quali effetti sono fuori scope |
| Grafo | `CONTROLS` può suggerire causalità non osservata | Separare dipendenza sintattica, lettura/scrittura osservata e relazione causale testata |
| Identità | Lo schema di esempio non ha un event ID generale | Identificativi stabili, copertura del collegamento e versione dello schema |

Le categorie del seed non sono uniformi: 12.16 usa `FIXED_SEED`, `DYNAMIC_SEED`, `UNCONTROLLED`; 12.19 usa `FIXED`, `DYNAMIC`, `UNKNOWN`. Prima del codice serve un unico enum. È una normale incompiutezza di specifica sperimentale, ma impedisce di trattare il JSON come contratto pronto.

La proposta statica+dinamica è appropriata per un corpus Ruby eterogeneo. Le frasi “STATIC ONLY = INSUFFICIENTE” e “DYNAMIC ONLY = INSUFFICIENTE” sono però troppo generali: una fixture limitata potrebbe richiedere soltanto uno dei due canali. Usare il minimo osservatore che risolve il task, ampliandolo quando un caso verificato lo richiede.

## Evidenza scientifica

### Decomposer

Il paper esiste e i numeri citati sono corretti: 688 programmi umani non banali nel crawl iniziale e 21.174 coppie sintetiche. Studia MIDI→Strudel con fine-tuning supervisionato e successiva ottimizzazione tramite esecuzione. Non studia il confronto FAME eventi contro trace Sonic Pi.[^11]

Il punto omesso più rilevante è che ricostruzione e leggibilità non sono qualità Trap. Gli autori segnalano limiti della reward di leggibilità e dello scope temporale. Un programma ricostruito è una spiegazione possibile del MIDI, non il recupero certo della storia compositiva originale. Il repository distribuisce codice di inferenza di un modello 8B e raccomanda almeno 24 GB di VRAM: non è un blueprint del primo piccolo Drum Core.[^11][^12]

Strudel-Synth è dichiarato sintetico e CC BY 4.0 nella dataset card. Va confrontato eventualmente come sorgente per decompilazione, non promosso come corpus di beat umani. Il numero di coppie non misura né famiglie FAME indipendenti né percentuale di musica rappabile.[^13]

### Alternative pertinenti alla V2

| Riferimento | Evidenza utile | Limite nel trasferimento a FAME |
|---|---|---|
| GrooVAE, ICML 2019 | Apprendere trasformazioni di timing e dinamica da performance | Umanizzazione non equivale a composizione Trap |
| MaskBeat, 2025 | Modellazione congiunta masked di loop drum | Griglia binaria e prior ritmici non preservano tutto il target FAME |
| Diffusione simbolica drum, 2024 | Generazione condizionata su 11.340 loop selezionati | Autoencoder e preprocessing sono ulteriori fonti di perdita |
| FIGARO | Condizionamento tramite descrizioni esperte e apprese | Descrizioni estratte dal target non equivalgono a input autonomi |
| MMT | Alternativa multitraccia congiunta | Non dimostra una vittoria sui dati o sul dominio FAME |
| Nested Music Transformer, revisione 2026 | Modellazione delle dipendenze fra sottotoken compound | Non impone né revoca FAME Compound come formato comune |

MaskBeat usa 32 step, nove voci binarie e un Transformer 8 layer/8 head/512, con 30.000 loop dichiarati. Alcuni suoi prior riflettono vincoli o convenzioni di batteria acustica. Non vanno trasferiti automaticamente a produzioni elettroniche con layering. La diffusione confrontata usa una vista di quattro barre e nove canali. Sono alternative da misurare, non soglie minime universali di dataset.[^14][^15][^16][^17]

La prima scelta raccomandata resta un confronto limitato fra due baseline di modello realmente comparabili, per esempio autoregressiva e masked, con informazione e budget dichiarati. Aggiungere diffusion solo quando risponde a una domanda specifica. Questo evita una competizione fra architetture che assorbe risorse prima di dimostrare il segnale nei dati.

## Licenze e ammissibilità delle sorgenti

La distinzione dell'handoff è corretta. La licenza ufficiale Sonic Pi dichiara MIT per il codice principale, CC0 per sample e wavetable inclusi, CC BY-SA 4.0 per documentazione ed esempi. Segnala anche componenti e synth con condizioni differenti. La classificazione non si riduce quindi a “tutto MIT”.[^18]

| Sorgente | Riscontro attuale | Uso prudente proposto |
|---|---|---|
| Rhythm-Cells | Licenza root CC0; celle, silenzi e trasformazioni presenti | Fixture tecnica da validare; qualità musicale da ascoltare |
| trap-beat-4 | Root CC0; script e WAV esterni/localizzati | Codice e controllo candidati; provenienza audio separata |
| Sonic-Pi-Beat-Vengence-Force | Root CC0; presente `BrianAuger-ThoughtsFromAfar.aiff` | Niente clearance audio dedotta dal repository |
| sonic-pi-drum-rnn-gui | MIT | Riferimento software, non corpus di teacher musicali |
| trapbeat-1, trapbeat-2, conditional-trap, sonic_pi_improv, sonic-pi-drum-grid, currdev_unit_plan-sonic-pi-gen-music | API GitHub non rileva licenza root | Nessuna promozione automatica a training; verifica di file/permessi |
| dariusf/sonicpi-workshop | Root CC0; README e lofi attribuiscono materiali esterni | Audit del singolo blocco/file |
| daysleeperx/Piccolo | MIT rilevata | Riferimento tooling, non prova di qualità del corpus |

Le licenze root sono state ricontrollate; i contenuti tecnici principali di Rhythm-Cells, trap-beat-4 e le attribuzioni del workshop sono stati letti. Non è stata verificata la catena dei diritti di ogni asset audio. Un nome di file riferito a un artista è motivo di approfondimento, non prova autonoma di violazione. L'assenza di una licenza rilevata non dimostra l'assenza di ogni eventuale permesso separato.[^7][^19][^20]

GitHub chiarisce che rendere pubblico un repository non concede automaticamente una licenza generale. Creative Commons distingue le proprie indicazioni conservative dalle conclusioni giuridiche dipendenti dal contesto. L'handoff fa bene a presentare l'attesa di chiarimenti sugli esempi come policy prudenziale, non come divieto universale del training CC BY-SA.[^21][^22]

L'invio della richiesta a Sam Aaron è riportato dall'allegato, ma non verificato qui tramite corrispondenza. Non equivale a permesso ricevuto; una futura risposta va conservata con ambito, autore e materiali coperti. Nessun messaggio è stato inviato durante questo audit.

## Esperimento Sonic Pi corretto

La domanda utile è se un'informazione di controllo utilizzabile migliori variazioni drum di otto barre su famiglie nuove. Il confronto proposto nell'handoff non specifica ancora se il controllo sarà disponibile prima della generazione, ricavato dal target completo o usato soltanto in training.

Questa distinzione è decisiva. Se B riceve il programma completo o le scelte random della take da predire, può ricevere una descrizione quasi completa della risposta. Un miglioramento dimostrerebbe ricostruzione condizionata da informazione privilegiata; non dimostrerebbe composizione autonoma. Se il programma è già eseguibile, la sua esecuzione diretta è inoltre un controllo naturale quando misura lo stesso task.

**Protocollo proposto:**

1. Fissare core iniziale, lunghezza, controlli ammessi e bersaglio. Dichiarare per ogni campo quando è disponibile.
2. A: eventi e controlli comuni. B: stessi dati più descrittori semplici di ripetizione/densità/variazione. C: stessi dati più struttura programmatica pertinente.
3. Se il trace è supervisione ausiliaria disponibile solo in training, anche C genera al test senza il trace del bersaglio. Se è conditioning disponibile all'uso, specificare chi lo fornisce e come.
4. Escludere da tutti gli input non consentiti note future, scelte random del target, identificatori che ne rivelano direttamente la realizzazione e metadati estratti dall'intero bersaglio senza dichiarazione.
5. Raggruppare prima di finestre e seed: script, derivazioni, fork e quasi-duplicati. Il solo hash del percorso o del repository non basta.
6. Confrontare lo stesso insieme musicale con budget, ricerca degli iperparametri, numero di candidati e politica del selector equivalenti.
7. Usare famiglie mai impiegate nelle decisioni per la conferma finale e, se si sostiene generalizzazione oltre Sonic Pi, un test in un'altra modalità/dominio pertinente.

La registrazione del grafo non deve diventare un prerequisito per provare se bastano descrittori più semplici. Distinguere esito favorevole, sfavorevole e inconcludente. Un pilot con poche famiglie può fermare un investimento operativo; non dimostra l'inutilità universale del controllo programmatico.

## Strategia dati e revisione fase per fase

| Fase | Raccomandazione | Prerequisito e gate utile |
|---|---|---|
| 0 | Mantenere | Perimetro Neural separato e storia conservata |
| 1 | Mantenere V1; completare fedeltà richiesta dal task | Confronto sorgente/vista, collisioni e perdite dichiarate |
| 2 | Mantenere importer; verificare mapping sorgente | Identità note, PPQ, controlli disponibili e provenance |
| 3 | Mantenere gate ingegneristico storico | Non riusarlo come certificazione di readiness musicale |
| 4 | Mantenere ausili euristici | Scope e natura dell'evidenza, niente etichette percettive inventate |
| 5 | Conservare benchmark e scelta comune | Codec train-only/fisso e decoder corretto prima del prossimo confronto |
| 6 | Conservare retrieval e risultati negativi | Baseline sullo stesso task e sugli stessi input disponibili |
| 7 | Priorità corrente | Enforcement d'uso, fedeltà, source-family, fonti Trap e ascolto |
| 8 | Aprire dopo il gate pertinente | Modello minimo vs baseline, generalità e Trap misurate separatamente |
| 9 | Separazione da dimostrare | Dati continui core/variazione; confronto con modello unico a otto barre |
| 10 | Mantenere funzione di contesto | Distinguere contesto estratto, imposto e generato; dati tonali pertinenti |
| 11 | Mantenere conditioning | Drums/808/armonia abbinati; onset, pause, registro e glide più ascolto |
| 12 | Valutare accorpamento con 10/11 | Contesto multitraccia, effetti sul beat completo e spazio vocale |
| 13 | Rinviare la rete Planner, non il contratto di controllo | Piani osservati e prova downstream contro piano minimo |
| 14 | Modulo opzionale; requisito anticipato | Miglioramento aggiuntivo rispetto a conditioning/joint, costo incluso |
| 15 | Conservare gate finale; anticipare confronti intermedi | Candidati e selezione equi, niente vittoria dovuta al solo cherry-picking |
| 16 | Rinviare forma lunga e integrazione | Stabilità delle otto barre; budget di esecuzione definito già prima |

La Fase 7 contiene attività che non sono necessariamente tutte prerequisiti di ogni esperimento drum. Il miglioramento PDMX per armonia non dovrebbe bloccare una prova di groove su un pool già ammissibile. La V2 attuale richiede però il proprio gate prima del training serio: eventuali separazioni fra prova tecnica, apprendimento generale e promozione Trap devono essere adottate esplicitamente, non usate per saltare le regole.

GMD offre 1.150 performance MIDI e 22.214 battute dichiarate, con mapping Roland e controlli del pedale hi-hat. È una sorgente di performance, non automaticamente di produzione Trap. Preservare il dato originale anche se la prima vista usa un sottoinsieme.[^23]

PDMX resta candidato tonale/strutturale: i rating sono un segnale incompleto e non una misura di rappabilità. HH-TRP resta una candidata audio algoritmica da auditare, senza equiparare il numero di WAV al numero di pattern indipendenti. La disponibilità degli eventi simbolici va risolta prima di scegliere un importer o un trascrittore.[^24][^25]

Per 808 e arrangiamento la tabella delle fonti deve avere una voce esplicita per esempi multitraccia allineati. Nessuno dei handoff dimostra che questa lacuna sia già colmata. Se il materiale utilizzabile resta scarso, valutare acquisizione mirata di esempi originali o autorizzati e trasferimento da modelli/dati compatibili, prima di investire in molti moduli da zero.

## Gate misurabili e regole di arresto

Il protocollo deve dichiarare il denominatore: famiglie ammissibili, performance, finestre e take sono quantità diverse. Le curve di apprendimento devono usare sottopool del train; il test finale non serve per scegliere ogni nuova configurazione.

Per la fedeltà del trace si fissano tolleranze di onset/velocity e copertura delle chiamate prima del confronto. Per ciò che si dichiara lossless, nessun evento rappresentabile perso o inventato. I casi non supportati vanno esplicitati, non silenziosamente eliminati dal conteggio.

Per l'ascolto si fissano durata, palette, modalità di loop, volume comparabile, ordine cieco e domande distinte. Nel task drum si misura groove e utilità come base; la rappabilità del beat completo richiede un gate successivo con le altre parti. Un controllo con voce/flow di prova può aiutare il requisito di prodotto senza diventare un nuovo corpus vocale di training.

Prima della conferma si definiscono miglioramento minimo utile, trattamento di pareggi/entrambi inaccettabili, incertezza e criteri di stop. La numerosità si giustifica in funzione della precisione desiderata e delle famiglie disponibili. Se la conclusione riguarda il pubblico, servono ascoltatori adeguati a quella popolazione; il giudizio del responsabile del prodotto resta sufficiente a rifiutare un prototipo per il proprio gioco.

Misurare sia il candidato singolo sia la pipeline con selector. Un sistema che sceglie il migliore di molte take non va confrontato con una baseline a cui è concessa una sola take senza dichiarare l'asimmetria.

La GPU storica indicata nel report Fase 5 è una RTX 5070 Ti. Il budget reale per nuovi training, la memoria effettivamente disponibile, la latenza richiesta e il luogo d'inferenza non sono definiti dal semplice nome della GPU. Vanno fissati prima di selezionare un modello; non occorre attendere la Fase 16 per misurare i costi.[^1]

## Errori storici da non ripetere

Questa tabella usa i risultati storici dei documenti ufficiali, senza presentarli come nuovi ascolti. Il corpus da 504 phrase è quello del gate iniziale; le 502 candidate successive escludono due phrase tramite overlay. I 116 groove del controllo drum costituiscono un ulteriore sottoinsieme, non una terza misura alternativa dello stesso totale.[^1]

| Assunzione | Test e risultato storico | Perché insufficiente | Regola corretta |
|---|---|---|---|
| Coverage aggregata significa beat completi | Role audit: 307 candidate TONAL_ONLY, 53 FULL_LAYERED su 502 | La co-presenza non è garantita dal totale per ruolo, né certifica la qualità | Selezionare per task, capacità ed evidenza |
| Seed tecnico valido significa teacher musicale | Dieci esempi seed ascoltati giudicati casuali | Grammatica e layer non dimostrano composizione | DEBUG_SYNTHETIC_ONLY fino a rivalidazione esplicita |
| Buone metriche della recombination significano buona musica | Blind su cinque casi: retrieval preferito tre volte, coupled una, nessuno una | Compatibilità e diversità tecnica non certificano interazione | Baseline musicali e gate umano, conclusione limitata al test |
| Zero round-trip fail significa nessuna perdita | Benchmark di serializzazione idempotente | Informazione già scartata può restare scartata a ogni ciclo | Misurare fedeltà rispetto alla sorgente |
| Passare a otto barre risolve il fraseggio | Boundary diagnostico senza chiusura recuperata | Durata della finestra e frase musicale sono proprietà diverse | Conservare intervalli e ascoltare i confini |
| Ogni output da un seed diverso è un esempio indipendente | Sorgenti generative producono molte realizzazioni | La variazione interna non crea una nuova origine compositiva | Split per famiglia, copie e derivazioni incluse |

## Decisioni consigliate e prossima sequenza

**Mantenere:** obiettivo otto barre Trap, fonte di verità nella repository, gate separati, NDR-028…034, formato comune, ruoli d'uso, ascolto umano e conservazione degli errori.

**Modificare:** stato 7A, distinzione validazione strutturale/ammissibilità, diagramma della fedeltà, contratto degli input disponibili, dati multitraccia allineati, criteri dei gate e benchmark con selector equo.

**Rinviare:** rete Planner, Refiner separato, forma lunga, nuove capability programmatiche e implementazione completa di un interprete/tracer Ruby.

**Scartare come metodo:** promozioni tramite semplici conteggi, source-family gonfiate con seed, trace del target usato senza dichiarazione, equivalenza amp/velocity non misurata, conversioni lossy chiamate fedeli e assenza di evidenza chiamata prova di impossibilità.

**Sperimentare prima di decidere:** modello unico contro Core+Arranger; autoregressivo contro masked; valore del pretraining generale; descrittori semplici contro program trace; conditioning sufficiente contro Refiner aggiuntivo.

La sequenza raccomandata è: allineare lo stato del blocco 7A; completare selezione d'uso e fedeltà; verificare la fattibilità delle sorgenti Trap e delle parti allineate; congelare il protocollo del primo gate drum; provare il modello minimo; portare presto la valutazione a otto barre nel contesto musicale previsto. Sonic Pi può procedere come pilot circoscritto quando risolve una domanda di questo percorso, senza diventare il suo nuovo prerequisito generale.

Il giudizio sui documenti è quindi favorevole con correzioni sostanziali di protocollo. Sono una buona base di continuità e ricerca; non sono ancora una certificazione dell'architettura finale o della readiness dei dati.

## Fonti

[^1]: Carlomadella/gioco-rap, [documentazione FAME Neural al commit 02bc708](https://github.com/Carlomadella/gioco-rap/tree/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/documentazione/fame-neural): ROADMAP, CURRENT_STATE, DECISIONS, AUDIT V2, ricerca apertura Fase 7, documenti Fasi 5–6 e README. Verifica 9 settembre 2026.
[^2]: Allegati forniti: `FAME_NEURAL_HANDOFF_REVISIONE_ROADMAP(2).md`, sezioni 1–16; `FAME_NEURAL_HANDOFF_REVISIONE_ROADMAP_SONIC_PI_AUDIT(1).md`, sezioni 1–16 e appendice A. Testi completi disponibili nella conversazione; nessun URL pubblico assunto.
[^3]: FAME, [content-capabilities.js](https://github.com/Carlomadella/gioco-rap/blob/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/frontend/strumenti/fame-neural-composer/dataset/content-capabilities.js), [policy](https://github.com/Carlomadella/gioco-rap/blob/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/frontend/strumenti/fame-neural-composer/dataset/content-capabilities-policy.v1.json), [smoke test](https://github.com/Carlomadella/gioco-rap/blob/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/frontend/strumenti/fame-neural-composer/phase7a-block1-smoke-test.js). Codice letto; smoke test e prova sul normalizzatore eseguiti localmente.
[^4]: FAME, [phrase-builder](https://github.com/Carlomadella/gioco-rap/blob/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/frontend/strumenti/fame-neural-composer/dataset/phrase-builder.js), [data-ready-gate](https://github.com/Carlomadella/gioco-rap/blob/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/frontend/strumenti/fame-neural-composer/dataset/data-ready-gate.js), [export microtrain](https://github.com/Carlomadella/gioco-rap/blob/02bc708e1f1f8797b9cb5aef8dc24fd45a92393e/frontend/strumenti/fame-neural-composer/phase5/export-microtrain-dataset.js).
[^5]: Sonic Pi, [headless-record.rb](https://github.com/sonic-pi-net/sonic-pi/blob/25baaed3c28003bf141f591081217136194b0d69/app/server/ruby/bin/headless-record.rb), [headless_boot.rb](https://github.com/sonic-pi-net/sonic-pi/blob/25baaed3c28003bf141f591081217136194b0d69/app/server/ruby/bin/headless_boot.rb), branch dev verificato il 9 settembre 2026.
[^6]: Sonic Pi, [lang/core.rb](https://github.com/sonic-pi-net/sonic-pi/blob/25baaed3c28003bf141f591081217136194b0d69/app/server/ruby/lib/sonicpi/lang/core.rb): `get`, `set`, `sync`, `density`, `use_bpm`.
[^7]: mrbombmusic, [trap_beat_4.rb](https://github.com/mrbombmusic/trap-beat-4/blob/main/trap_beat_4.rb), blob letto `4a7d865588cf24fea93f28ad31ed65a8659298f0`; [Rhythm-Cells](https://github.com/mrbombmusic/Rhythm-Cells), script con ties blob `3a62299ac928b850d001585ba4e7418ed8cbfd4e`. Verifica 9 settembre 2026, senza esecuzione Sonic Pi.
[^9]: von Rütte et al., [FIGARO](https://arxiv.org/html/2201.10936v4), revisione 22 febbraio 2024.
[^10]: Dong et al., [Multitrack Music Transformer](https://arxiv.org/abs/2207.06983), ICASSP 2023.
[^11]: Kim et al., [Decomposer: Learning to Decompile Symbolic Music to Programs](https://arxiv.org/html/2607.01849v1), preprint 2 luglio 2026, sezioni 1–3 e Limitations.
[^12]: Autori Decomposer, [repository ufficiale](https://github.com/elianakim/Decomposer), setup e inferenza, consultato 9 settembre 2026.
[^13]: Autori Decomposer, [Strudel-Synth dataset card](https://huggingface.co/datasets/haiyewon/Strudel-Synth), statistiche, provenienza sintetica e licenza, consultata 9 settembre 2026.
[^14]: Gillick et al., [Learning to Groove with Inverse Sequence Transformations](https://proceedings.mlr.press/v97/gillick19a.html), ICML 2019.
[^15]: Lanzendörfer et al., [MaskBeat](https://arxiv.org/html/2507.03395v1), luglio 2025, Methodology ed Experiments.
[^16]: Jajoria e McDermott, [Text Conditioned Symbolic Drumbeat Generation using Latent Diffusion Models](https://arxiv.org/html/2408.02711v1), agosto 2024, Dataset e Method.
[^17]: Yoo et al., [Nested Music Transformer](https://arxiv.org/html/2408.01180v2), revisione 16 marzo 2026.
[^18]: Sonic Pi, [LICENSE.md](https://github.com/sonic-pi-net/sonic-pi/blob/dev/LICENSE.md), lettura 9 settembre 2026.
[^19]: Repository di [mrbombmusic](https://github.com/mrbombmusic), verifiche API delle dodici sorgenti nominate nella tabella insieme a dariusf e Piccolo; [Vengence-Force](https://github.com/mrbombmusic/Sonic-Pi-Beat-Vengence-Force), inventario; [conditional-trap](https://github.com/mrbombmusic/conditional-trap), README e dipendenze audio.
[^20]: dariusf, [sonicpi-workshop/readme.org](https://github.com/dariusf/sonicpi-workshop/blob/master/readme.org) e [lofi/readme.md](https://github.com/dariusf/sonicpi-workshop/blob/master/lofi/readme.md), attribuzioni; [Piccolo](https://github.com/daysleeperx/Piccolo), licenza rilevata. Verifica 9 settembre 2026.
[^21]: GitHub Docs, [Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), consultato 9 settembre 2026.
[^22]: Creative Commons, [Using CC-Licensed Works for AI Training](https://creativecommons.org/using-cc-licensed-works-for-ai-training-2/) e [Guidance on Using CC Licenses in an AI Ecosystem](https://creativecommons.org/2026/09/03/guidance-on-using-cc-licenses-in-an-ai-ecosystem/), 3 settembre 2026.
[^23]: Google Magenta, [Groove MIDI Dataset](https://magenta.withgoogle.com/datasets/groove), documentazione ufficiale, 2019.
[^24]: Long et al., [PDMX](https://arxiv.org/html/2409.10831v2), revisione marzo 2025.
[^25]: WaivOps, [HH-TRP su Zenodo](https://zenodo.org/records/15734094), deposito giugno 2025.
