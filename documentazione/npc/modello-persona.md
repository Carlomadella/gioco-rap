# NPC — modello PERSONA

**Stato:** punto 1 definito e verificato sulla repository corrente.  
**Base tecnica:** `main` / `feature/npc-population-v1` al commit `b4967c8d7fbb58ab305fc2f3d272fb013e56b691` prima di questa modifica.  
**Perimetro:** definizione architetturale; nessuna modifica al gameplay o ai salvataggi in questo punto.

Questo documento è la specifica incrementale del lavoro NPC approvato in 20 punti. Ogni punto successivo aggiungerà qui soltanto decisioni verificate e, quando esistono, riferimenti al codice realmente presente sul branch.

## Punto 1 — modello PERSONA

### Fonte unica dell'identità persistente

La repository corrente inizializza `G.gente` dentro lo stato di partita e i sottosistemi già inseriscono o recuperano persone da quell'anagrafe. `nuovaPersona(ruolo)` crea l'identità base; lavoro, Circolo, Trasferte e Strada aggiungono poi dati contestuali sulla stessa persona.

La direzione del nuovo sistema è quindi:

- `G.gente` resta l'anagrafe comune delle persone persistenti;
- l'ID identifica la persona; il nome non è una chiave d'identità;
- cambiare ambiente, città, lavoro o funzione non crea automaticamente un nuovo NPC;
- i sottosistemi conservano i propri dati specialistici, ma fanno riferimento alla stessa persona;
- nessuna migrazione retroattiva inventa dati mancanti solo per completare il nuovo schema.

Questa scelta preserva il codice esistente e permette di evolvere gradualmente verso una gestione centrale della popolazione senza sostituire in blocco Circolo, lavoro, Strada, carcere o Trasferte.

## I sette macro-gruppi

| Gruppo | Responsabilità | Minimo richiesto | Opzionale | Derivato / regola |
| --- | --- | --- | --- | --- |
| **Identità** | Chi è la persona indipendentemente dal contesto | ID persistente e identità visualizzabile già disponibile | nome/cognome strutturati, alias, genere della persona, provenienza, ulteriori dati d'identità | nome mostrato nel contesto; mai una nuova identità per un alias |
| **Personalità** | Disposizioni relativamente stabili | per i nuovi NPC, struttura definita nei punti 3–4 | tratti, interessi e altri dati soltanto se usati dal gameplay | reazioni ottenute combinando persona, situazione e relazione |
| **Vita** | Professione, competenze e contesto di vita relativamente stabile | nessuna professione obbligatoria per tutti | professione, competenze e informazioni biografiche pertinenti | collega/cliente/socio sono funzioni contestuali, non professioni |
| **Stato attuale** | Condizioni che possono cambiare nel tempo | dati sufficienti a valutare il contesto quando esplicitamente noti | impiego attuale, città attuale, detenzione e impedimenti temporanei | disponibilità in un ambiente; assenza di dato non significa automaticamente stato libero/disponibile |
| **Appartenenze** | Ambienti e porte plausibili di ricomparsa | per i nuovi persistenti, almeno un contesto di continuità quando viene definito dal generatore/storia | ulteriori ambienti motivati | appartenenza rende plausibile la selezione ma non garantisce presenza |
| **Rapporto col giocatore** | Storia relazionale tra protagonista e persona | riferimento alla stessa identità | valori e stati già prodotti dai sistemi sociali/criminali/carcerari | etichette e opportunità derivate dai dati reali; nessuna copia della fiducia |
| **Rapporti con altri NPC** | Legami effettivi tra persone | nessun arco obbligatorio per ogni coppia | soli legami realmente creati da eventi o regole | contatti comuni, cluster e viste derivate dalla rete |

I macro-gruppi sono responsabilità concettuali. Non impongono sette oggetti JSON, nuove tabelle o una riscrittura immediata della struttura salvata.

## Persona, stato e relazione

Tre concetti non devono essere confusi:

- **Persona:** identità, disposizioni, interessi e professione di base quando nota. Cambia solo per eventi che riguardano davvero quella persona.
- **Stato:** impiego, posizione, detenzione e condizioni temporanee. Può cambiare senza rigenerare identità, personalità o rapporti.
- **Relazione:** informazione tra due soggetti. Fiducia, amicizia, tensione, debiti, rivalità o storia comune non sono tratti personali.

La disponibilità fisica nel mondo è inoltre distinta dalla disponibilità verso il protagonista: essere nella stessa città non implica voler collaborare.

## Compatibilità verificata con il codice corrente

I dati esistenti hanno significati che vanno preservati durante la transizione:

| Dato corrente | Significato da preservare |
| --- | --- |
| `id`, `n`, `eta`, `skin`, `hair`, `col` | identità/aspetto già assegnati; niente rigenerazione automatica |
| `gen` | genere musicale; non genere della persona |
| `car`, `scoperto` | carattere legacy e sua scoperta |
| `ruolo` | contratto ancora usato da dialoghi, selettori e azioni |
| `origine`, `origineLuogo`, metadati del lavoro | contesto e storia dell'incontro; non descrivono da soli professione o tutte le appartenenze |
| `citta`, `fuori` delle Trasferte | dati geografici legacy da riusare, non da duplicare |
| `rel`, `pt`, `numero`, `numDa` | rapporto sociale e contatto col protagonista |
| `p.strada` | stato/storia della relazione criminale, inclusa fiducia personale |
| `p.carcere` | storia carceraria e continuità del rapporto; non prova automaticamente lo stato fisico corrente |
| `reteLegami` | rete sociale persistente esistente da evolvere, non da sostituire senza migrazione |
| `circoloSbloccato`, `via` | filtri legacy di accesso/presenza; non vanno reinterpretati automaticamente come appartenenza, morte o trasferimento |

La Strada possiede già un bridge `ADF_CRIME_NPC` con fallback legacy su `G.gente` / `nuovaPersona()`; il nuovo sistema dovrà integrarsi con quel contratto invece di creare una seconda anagrafe.

## Cosa si salva e cosa si deriva

Principio del modello:

- si salvano scelte generative e cambiamenti effettivi che non possono essere ricostruiti;
- si preservano ID, nomi già conosciuti, rapporti e riferimenti esistenti;
- non si inventano cognomi, provenienze, professioni, città o relazioni per i vecchi NPC;
- non si rigenerano personalità o identità al caricamento;
- disponibilità, etichette, contatti comuni e altre viste si calcolano dai dati autorevoli quando possibile.

L'evoluzione dell'età richiede una regola esplicita del calendario: il solo campo `eta` non autorizza a inventare date di nascita o incrementi al caricamento.


## Vincolo di scala acquisito dalla simulazione

Il riferimento quantitativo è `documentazione/npc/dimensionamento-npc.md`. Il recap
riporta, senza rieseguire il simulatore, 104,4 persone distinte in media nello
scenario equilibrato a un anno, 305,3 nello scenario equilibrato a tre anni e
538,2 nello scenario esplorativo a tre anni, con massimo osservato 620.

Per l'architettura del modello PERSONA questo non significa precaricare centinaia
di NPC né fissare un tetto rigido. Significa però progettare da subito per una
**capacità nell'ordine di centinaia di identità persistenti**, con riferimento
prudenziale alla fascia 300–800 indicata dalla simulazione per i punti 17–18.

Conseguenze architetturali del punto 1:

- i dati obbligatori per persona devono restare pochi e motivati dal gameplay;
- i dati opzionali devono poter restare assenti senza rompere selettori o UI;
- le relazioni NPC↔NPC devono essere una rete sparsa, non una matrice completa
  persona × persona;
- non è accettabile un aggiornamento giornaliero globale di tutti gli NPC solo
  per mantenere lo stato "vivo": gli stati evolvono per eventi e letture
  pertinenti;
- appartenenze, disponibilità e presenza devono essere selezionate per contesto,
  non materializzate per ogni persona × ambiente;
- la capacità 300–800 riguarda la generazione e la persistenza possibili, non
  il numero di NPC creati all'avvio né una soglia oltre cui cancellare persone;
- crescita del salvataggio, costo dei selettori, varietà dei cataloghi e tasso
  di riuso vanno misurati esplicitamente nei punti 17–18 e nel reaudit finale.

La simulazione non dimostra che tratti, interessi o dialoghi siano sufficienti
e non misura hub futuri completi o carriere oltre tre anni. I suoi numeri sono
quindi un vincolo di scala da rispettare, non una certificazione del modello.


## Confine del punto 1

**Definito in questo punto:** i sette macro-gruppi, la separazione Persona/Stato/Relazione, la fonte comune dell'identità, le responsabilità dei dati e i vincoli di compatibilità col sistema corrente.

**Non implementato in questo punto:** nuovi campi runtime, migrazione dei salvataggi, nuovo generatore, selettore centrale, cataloghi, mobilità, scoperta, rete ampliata o gruppi emergenti. Questi restano nei punti successivi della sequenza approvata.

Il punto 1 è quindi chiuso come definizione architetturale, senza dichiarare funzionalità runtime non ancora presenti.

## Punto 2 — identità della persona

**Stato:** definizione riesaminata sulla repository reale e sul riferimento di
dimensionamento. Nessun generatore viene ancora convertito in questo punto.

### Invariante principale: una persona, un ID

L'identità canonica è l'ID persistente. Nome, soprannome, professione, città,
ruolo o luogo del primo incontro non possono essere usati come chiave primaria
della persona.

La repository corrente non applica ancora la stessa garanzia in tutti i punti
di creazione:

- `nuovaPersona()` usa `"p" + Math.floor(Math.random() * 1e9)` senza verificare
  collisioni già presenti in `G.gente`;
- `nuovoContatto()` delle Trasferte usa analogamente un ID casuale con prefisso
  `f`, senza controllo di collisione;
- `studioRivaleInGente()` invece ripete l'estrazione finché l'ID non è unico.

Il nuovo sistema deve quindi imporre una sola regola comune: **ogni creazione di
PERSONA verifica l'unicità dell'ID contro l'anagrafe canonica prima di
persistirla**. Il formato concreto dell'ID verrà centralizzato al punto 16;
gli ID storici restano validi e non vengono rinumerati.

Con alcune centinaia di persone il rischio statistico di collisione dello spazio
casuale attuale resta basso, ma non è una garanzia accettabile per riferimenti
persistenti usati da chat, rete sociale, carcere, Strada, Studio e Trasferte.
La correttezza non deve dipendere dalla fortuna del generatore casuale.

### Schema dell'identità

I nuovi dati strutturati vivono concettualmente in `identita`, senza duplicare
campi legacy che devono restare disponibili durante la migrazione.

| Campo | Regola per nuovi NPC | Compatibilità con NPC esistenti |
| --- | --- | --- |
| `id` | obbligatorio, persistente e univoco | conservare esattamente l'ID esistente |
| `identita.nome` | nome personale quando il generatore crea una persona anagrafica | può restare sconosciuto se `n` non permette di ricavarlo con certezza |
| `identita.cognome` | previsto dal generatore componibile; può essere omesso per identità che narrativamente usano solo un nome/alias | non spezzare automaticamente `n` né inventare cognomi |
| `identita.alias` | mappa opzionale di contesto → alias realmente assegnato | nessun alias dedotto da un nome corto storico |
| `n` | nome di presentazione compatibile con i consumatori attuali | resta stabile finché la migrazione dei consumer non è completata |
| `eta` | età assegnata una volta e persistita | conservare il valore noto; nessuna data di nascita inventata |
| `identita.genere` | valore esplicito solo quando il generatore/contenuto lo definisce | sconosciuto se non attestato; mai dedotto da nome, aspetto o ruolo |
| `skin`, `hair`, `col` | contratto visivo corrente da preservare | non rigenerare l'aspetto al caricamento |
| `identita.provenienza` | riferimento geografico opzionale, distinto dalla città attuale | non copiarlo da `origineLuogo` o da `citta` senza una regola verificata |

Il campo assente significa **sconosciuto**, non un valore implicito. Non
persistiamo stringhe come "sconosciuto" soltanto per riempire il record.

### Nome visualizzato e alias

La stessa persona può avere più modi di essere chiamata senza diventare più
persone. Gli alias sono quindi proprietà della stessa identità e possono essere
contestuali, per esempio musicale o Strada.

Regole:

- l'alias non cambia `id`;
- conoscere un alias non significa conoscere automaticamente nome completo,
  cognome o provenienza;
- due persone possono avere lo stesso nome: l'omonimia non autorizza mai a
  fonderle;
- durante la transizione `n` rimane il nome di presentazione stabile usato dal
  codice legacy;
- quando i consumer saranno convertiti, il nome visualizzato sarà una vista
  derivata dall'identità e dalle informazioni realmente conosciute dal
  giocatore, senza riscrivere `n` a ogni contesto;
- i nuovi generatori non devono usare suffissi numerici come strategia ordinaria
  per simulare nuove identità.

### Verifica di scala sui nomi

I pool correnti di `POSTO_NOMI` contengono in genere soltanto 4–8 voci per
ruolo. Quando un pool è esaurito, `nuovaPersona()` e il generatore delle
Trasferte aggiungono un numero a un nome già usato.

Questo è incompatibile qualitativamente con il riferimento di
`dimensionamento-npc.md`: nello scenario equilibrato annuale la fonte riporta
oltre cento persone distinte in media e nello scenario esplorativo triennale
oltre cinquecento, con massimo osservato 620.

Il punto 2 non amplia ancora i cataloghi — è compito del punto 17 — ma rende
vincolante che l'identità generativa sia **componibile**:

- nomi;
- cognomi;
- alias/soprannomi solo quando pertinenti;
- età;
- dati visivi già supportati;
- provenienza quando definita;
- altri elementi futuri soltanto se hanno un uso concreto.

La capacità non deve dipendere da 800 nomi scritti a mano. Deve derivare da
combinazioni controllate abbastanza ampie da ridurre collisioni percettive.
Il punto 17 dovrà misurare la capacità reale dei cataloghi contro gli scenari
300–800, non limitarsi a contare le singole liste.

### Età nelle carriere lunghe

La simulazione copre anche carriere di tre anni, quindi un'età totalmente
statica può diventare visibile. Tuttavia la repository non possiede ancora una
regola approvata di compleanno/anno anagrafico per gli NPC.

Per questo il punto 2 conserva `eta` come valore persistente e **non inventa
ora una data di nascita o un secondo contatore dell'età**. Prima di far
invecchiare gli NPC serve una regola temporale unica, idempotente e compatibile
con il calendario del gioco. Questo requisito resta da chiudere insieme agli
stati/tempo e alla migrazione, senza bloccare l'identità attuale.

### Aspetto e riconoscibilità

`skin`, `hair` e `col` restano il contratto visivo corrente. Sono parte
della riconoscibilità, ma non bastano da soli a rendere distinguibili centinaia
di persone. Il sistema non deve quindi trattare una diversa combinazione visiva
come prova di identità diversa, né una combinazione uguale come prova di
identità comune.

L'eventuale ampliamento dei cataloghi visivi deve seguire i renderer esistenti
e viene valutato solo se necessario alla varietà percepita; non aggiungiamo qui
parametri estetici che il gioco non usa.

### Provenienza non è posizione

`identita.provenienza` descrive l'origine geografica della persona.
È distinta da:

- `origine` / `origineLuogo`: dove o come l'abbiamo incontrata;
- `citta` / futura città attuale: dove si trova o vive nel periodo corrente;
- `fuori`: filtro legacy delle Trasferte.

Il raccordo concreto con il catalogo città e la mobilità è il punto 9. Questa
separazione evita che un incontro a Milano trasformi automaticamente Milano
nella provenienza dell'NPC.

### Persone e contatti non-persona

Alcuni dati legacy delle Trasferte possono rappresentare brand o agenzie.
L'identità PERSONA non deve costringere un'organizzazione a diventare una
persona inventata. Finché non esiste un modello esplicito per le organizzazioni,
quei contatti restano compatibili nel loro formato storico oppure ricevono un
rappresentante umano solo quando il contenuto lo definisce davvero.

### Criteri di accettazione del punto 2

La definizione è sufficiente se i punti successivi possono implementare questi
casi senza cambiare il significato dell'identità:

1. la stessa persona passa da lavoro a Sala o Strada mantenendo lo stesso ID;
2. un alias diverso non crea un secondo contatto, chat o rapporto;
3. due omonimi restano persone diverse;
4. un vecchio `n` non viene spezzato automaticamente in nome/cognome;
5. un rivale promosso a contatto conserva il riferimento `rivaleId` senza
   essere deduplicato per nome;
6. nessun nuovo generatore persiste un ID già usato;
7. il catalogo futuro può produrre centinaia di identità senza ricorrere a
   suffissi numerici come meccanismo ordinario;
8. provenienza, città attuale e luogo del primo incontro restano distinti;
9. caricamento e cambio contesto non rigenerano età o aspetto;
10. un contatto organizzativo legacy non viene trasformato automaticamente in
    una biografia umana.

### Confine del punto 2

**Definito:** identità canonica, campi e assenze ammesse, alias, omonimia,
invariante di unicità dell'ID, compatibilità di `n`, età conservativa,
aspetto, provenienza e vincoli di scala per la generazione futura.

**Non implementato qui:** nuovo generatore, controllo centralizzato degli ID,
cataloghi ampliati, UI della scoperta, invecchiamento, migrazione dei
salvataggi o geografia dinamica. Questi appartengono rispettivamente ai punti
16–19, 12 e 9.

Il punto 2 è quindi chiuso come **definizione architetturale verificata**, con
due requisiti aggiunti rispetto alla prima versione: unicità garantita degli ID
e capacità nominale/visuale coerente con la scala 300–800.

## Punto 3 — personalità combinatoria

**Stato:** catalogo riesaminato sulla repository corrente e sul dimensionamento.
Il punto chiude la struttura della personalità e il catalogo operativo di base;
non introduce ancora effetti runtime.

### Valutazione del catalogo

I dodici tratti iniziali del checkpoint non coprivano abbastanza bene alcune
situazioni già presenti nel gioco: critica e provocazione, memoria del torto e
riparazione, revisione di un piano e continuità degli impegni. Il lavoro Work
aveva quindi ampliato il catalogo a venti candidati.

Il reaudit sulla repository corrente conferma quasi interamente quella scelta,
ma distingue **catalogo operativo** e **candidati sospesi** invece di trattare
tutti e venti come ugualmente pronti.

### Catalogo operativo di base — 18 tratti

| ID | Disposizione | Confine necessario |
| --- | --- | --- |
| `prudente` | valuta rischi e conseguenze prima di esporsi | non equivale a diffidenza verso le persone |
| `diffidente` | cerca riscontri prima di affidarsi a qualcuno | non assegna fiducia bassa o ostilità |
| `ambizioso` | cerca crescita, risultati e avanzamento | non implica competizione o tradimento |
| `impulsivo` | tende a decidere/agire prima di valutare tutto | non implica aggressività o criminalità |
| `leale` | dà peso ai legami e agli impegni verso persone reali | richiede un legame esistente; non crea amicizia |
| `socievole` | sostiene lo scambio e cerca interazione | non implica confidenza o fiducia immediata |
| `opportunista` | valuta il vantaggio personale di una situazione | non implica tradimento sistematico |
| `generoso` | considera di condividere tempo, risorse o aiuto | non crea risorse né disponibilità |
| `competitivo` | dà peso al confronto con gli altri | non crea una rivalità specifica |
| `riservato` | limita l'accesso alla propria vita personale | non equivale a isolamento o diffidenza |
| `pratico` | preferisce soluzioni concrete e attuabili | non descrive professione o assenza di ideali |
| `idealista` | dà peso a principi e modo in cui si raggiunge un risultato | non implica ingenuità |
| `permaloso` | tende a vivere critiche come svalutazione personale | non implica aggressività o memoria eterna del torto |
| `irascibile` | reagisce con irritazione sotto provocazione/pressione | non implica violenza né impulsività generale |
| `rancoroso` | mantiene peso persistente a un torto realmente avvenuto | non inventa torti o ostilità |
| `conciliante` | cerca di ricomporre conflitti | non cancella conseguenze, debiti o tensione |
| `flessibile` | considera una revisione del piano quando cambiano le condizioni | non equivale a opportunismo |
| `ostinato` | tende a mantenere posizione o piano | non equivale ad ambizione o incapacità |

### Candidati sospesi — 2 tratti

- `disciplinato`: continuità, organizzazione e mantenimento degli impegni;
- `incostante`: difficoltà nel mantenere continuità e impegni nel tempo.

La repository corrente contiene dialoghi su promesse, puntualità e persone che
mantengono la parola, ma questo è ancora **contenuto conversazionale**. Non
esiste un contratto generale NPC che registri un impegno personale, ne attenda
la scadenza e valuti in seguito se quella stessa persona lo ha mantenuto.

Per questo i due tratti restano nel catalogo progettuale, ma **non entrano nella
generazione generica finché esiste soltanto il dialogo iniziale**. Quando un
sistema di impegni persistenti o un evento equivalente offrirà un trigger
verificabile, potranno essere promossi nel catalogo operativo senza cambiare la
struttura PERSONA.

Questa scelta evita di aumentare artificialmente il catalogo con tratti che il
giocatore non potrebbe distinguere durante la partita.

### Perché non aggiungere un equivalente diretto di `gasato`

Il carattere legacy `gasato` è oggi associato a risposte molto eterogenee:
vantarsi, cercare confronto, reagire male a una critica, improvvisare, sostenere
che il proprio lavoro sia migliore, negare un problema o spingere verso una
scelta appariscente.

Non è quindi una singola disposizione sufficientemente precisa da trasferire
come nuovo tratto. I suoi casi utili sono meglio coperti da combinazioni di
`competitivo`, `ambizioso`, `impulsivo`, `permaloso`, `irascibile` e,
quando il vantaggio personale è il punto, `opportunista`.

Non introduciamo ora `vanitoso`, `estroverso`, `aggressivo`,
`affidabile`, `altruista`, `testardo` o `vendicativo`: non è stato
identificato nel gameplay corrente un contratto distinto sufficiente rispetto
ai tratti già presenti. Un nuovo tratto richiede prima un comportamento
osservabile diverso, non soltanto un sinonimo o un aggettivo plausibile.

### Struttura per persona

Per i **nuovi NPC generici**:

- due tratti principali distinti;
- fonte autorevole futura: `personalita.tratti`, array di ID;
- nessuna gerarchia implicita fra primo e secondo elemento;
- nessun punteggio continuo, percentuale o intensità per ogni tratto;
- terzo tratto soltanto per personaggi/eventi narrativamente definiti o per una
  regola futura che ne motivi la necessità; niente probabilità casuale di
  riceverne tre;
- i tratti sono persistenti e non vengono ripescati cambiando luogo, città,
  lavoro, appartenenza o relazione;
- umore, heat, detenzione, fiducia e disponibilità non modificano il catalogo
  personale: sono stato o relazione.

I vecchi NPC possono continuare a esistere con il solo `car` legacy finché la
migrazione non dispone di informazioni sufficienti. L'assenza dei nuovi tratti
è un dato incompleto valido, non un motivo per inventarli al caricamento.

### Combinazioni e conflitti

La varietà non dipende dal rendere ogni NPC una combinazione unica. Anche con
centinaia di persone è normale che più NPC condividano la stessa coppia di
tratti: devono distinguersi attraverso identità, interessi, professione,
storia, rete, appartenenze e stato.

Perciò il riferimento 300–800 del dimensionamento **non richiede 300–800 profili
di personalità unici**. Richiede invece che le coppie producano differenze
percepibili e che gli altri assi del modello impediscano la sensazione di clone.

Regole:

- nessun mestiere o ambiente forza un tratto: rapper ≠ competitivo, Strada ≠
  opportunista, collega ≠ pratico;
- un contesto può pesare una distribuzione soltanto quando esiste una ragione
  di gameplay documentata;
- la coppia va interpretata insieme; non si sommano automaticamente due bonus;
- l'ordine dell'array non modifica il risultato;
- tensioni come `socievole + riservato`, `leale + opportunista` o
  `rancoroso + conciliante` possono descrivere persone coerenti;
- `flessibile + ostinato` non entra nella generazione generica finché il
  modello non distingue domini nei quali le due disposizioni possono valere
  separatamente;
- `disciplinato + incostante` resta fuori finché entrambi sono sospesi;
- altre esclusioni si aggiungono solo quando un contratto comportamentale
  dimostra un conflitto reale, non per gusto tassonomico.

### Copertura di gameplay verificata

Il codice corrente offre già situazioni che giustificano gli assi principali:

- rischio, urgenza e opportunità → prudente / impulsivo / ambizioso /
  opportunista;
- affidamento, confidenza e apertura → diffidente / socievole / riservato;
- aiuto e legame reale → generoso / leale;
- confronto e riconoscimento → competitivo, senza conservare `gasato` come
  contenitore generico;
- critica e provocazione → permaloso / irascibile;
- torti persistenti, debiti, tensioni e reincontri → rancoroso / conciliante;
- proposte di cambiare metodo o scelta → flessibile / ostinato;
- concretezza contro principio → pratico / idealista.

La copertura è sufficiente come **catalogo di base**. Non è una certificazione
che tutti i diciotto tratti siano già giocabili: il punto 4 deve ancora dare a
ciascuno un trigger semantico e una conseguenza osservabile.

### Rapporto con fiducia e scoperta

Fiducia, amicizia, tensione, rivalità, debiti e favori restano relazioni o
storia. Un tratto può modificare una reazione a un fatto reale, ma non crea il
fatto.

Analogamente:

- possedere un tratto ≠ averlo scoperto;
- `scoperto` continua a significare scoperta del carattere legacy;
- i nuovi tratti non diventano automaticamente visibili;
- il punto 12 definirà quali informazioni il giocatore conosce.

### Transizione dai quattro caratteri legacy

| Legacy | Preservare | Non dedurre automaticamente |
| --- | --- | --- |
| `aperto` | dialoghi, bonus e scoperta correnti | `socievole`, `generoso`, `leale` o qualunque coppia |
| `diffidente` | comportamento storico già salvato | nuovo `diffidente` + secondo tratto o fiducia numerica |
| `gasato` | dialoghi e comportamento storico | un singolo equivalente nuovo; il vecchio tag copre più disposizioni |
| `pratico` | comportamento storico già salvato | nuovo `pratico` + secondo tratto, professione o assenza di ideali |

Non esiste una conversione automatica `car → personalita.tratti`. Durante la
futura integrazione i consumer useranno i nuovi tratti quando presenti e il
percorso legacy altrimenti. I nuovi NPC non devono ricevere contemporaneamente
una coppia nuova e un `car` casuale indipendente che possa contraddirla.

### Criteri di sufficienza da portare al punto 4 e al reaudit

Il catalogo resta valido soltanto se:

1. ogni tratto operativo ha almeno un trigger pertinente e una differenza
   osservabile;
2. due tratti vicini possono essere distinti nello stesso tipo di situazione;
3. la coppia non produce bonus doppi o dipendenza dall'ordine;
4. i prerequisiti di memoria/relazione impediscono a `leale`,
   `rancoroso` e simili di inventare una storia;
5. un tratto privo di percorso concreto viene sospeso invece di restare come
   decorazione;
6. nella verifica finale, NPC con coppie ripetute risultano comunque
   distinguibili grazie agli altri assi della PERSONA;
7. il playtest controlla ripetitività percepita su carriere lunghe: la
   simulazione di dimensionamento misura quante persone possono essere
   incontrate, non certifica la varietà dei comportamenti.

### Confine del punto 3

**Definito e chiuso:** modello a due tratti, terzo solo motivato, catalogo
operativo di 18 disposizioni, due candidati sospesi, regole di composizione,
compatibilità con `car` e criteri per eventuali aggiunte future.

**Non implementato qui:** `personalita.tratti` nel runtime, assegnazione,
effetti, dialoghi combinatori, scoperta e migrazione. Il punto 4 deve dimostrare
che i tratti operativi producano differenze concrete prima che la generazione
li utilizzi.

