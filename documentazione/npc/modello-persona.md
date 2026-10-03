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

## Punto 4 — interessi e comportamento

**Stato:** definizione riesaminata e prototipo verificabile ricostruito. Il
prototipo non è caricato dal gioco e non modifica salvataggi, premi o NPC
esistenti.

File introdotti:

- `frontend/strumenti/npc/contratti-comportamento.cjs`;
- `frontend/test/unit/npc-contratti-comportamento.test.js`.

### Principio: interessi e tratti hanno responsabilità diverse

- **Interessi:** orientano quali temi/contenuti sono pertinenti a una persona.
- **Tratti:** orientano come quella persona reagisce a una situazione
  semanticamente pertinente.
- **Competenze:** restano separate; interessarsi a musica, audio o cucina non
  dimostra saper rappare, mixare o cucinare professionalmente.
- **Disponibilità e gate:** vengono prima delle preferenze. Un tratto non rende
  possibile un'azione vietata dallo stato, dalla relazione o dal sottosistema.

Nessuno dei due sistemi assegna automaticamente relazione, fiducia, denaro,
rete, favori, servizi o ricompense.

### Interessi attivi verificati

Il codice corrente permette di collegare senza inventare contenuti tre interessi:

| Interesse | Contenuti presenti | Valutazione |
| --- | --- | --- |
| `musica` | brani, generi, live, artisti, feat e ascolto in Sala/chat | attivo |
| `audio` | microfoni, mix, registrazione, mixer, cavi e problemi tecnici | attivo |
| `quartiere` | zona, luoghi, persone incontrate e vita locale in chat/lavoro | attivo |

Per i nuovi NPC generici l'obiettivo resta **uno o due interessi attivi**.
Gli NPC legacy possono averne zero finché non esiste informazione sufficiente.

### Interessi candidati ma sospesi

| Interesse | Perché non è ancora attivo |
| --- | --- |
| `cucina` | la Pizzeria ha oggi molto gameplay di cucina, ma descrive mansioni e situazioni lavorative; non dimostra un interesse personale trasferibile a qualunque NPC |
| `sport` | non esiste un percorso conversazionale/sociale NPC abbastanza sviluppato |
| `cinema` | video e videomaker esistono, ma non costituiscono ancora un percorso generale sull'interesse per il cinema |

Non deduciamo quindi `cucina` dal lavoro in Pizzeria, `sport` dalla palestra o
`cinema` dal mestiere di videomaker.

Con tre interessi attivi esistono soltanto **6 insiemi non vuoti distinti** se
assegniamo uno o due interessi (3 singoli + 3 coppie). Questo è sufficiente per
verificare il contratto tecnico, **non per considerare finita la varietà degli
interessi** in una popolazione di centinaia di persone.

L'espansione deve essere guidata dai contenuti: un interesse nuovo entra nel
pool generativo soltanto quando possiede almeno un percorso di dialogo, attività
o scelta riconoscibile fuori da una sola professione.

### Contratti comportamentali dei 18 tratti operativi

Il prototipo associa ogni tratto operativo del punto 3 a un **trigger semantico**
e a un segnale di reazione. I trigger non sono parole cercate nei testi: sono
categorie che i contenuti dovranno dichiarare durante l'integrazione.

| Tratto | Trigger | Segnale richiesto |
| --- | --- | --- |
| `prudente` | proposta rischiosa | chiede garanzie |
| `diffidente` | affidamento a una persona | chiede riscontri |
| `ambizioso` | opportunità di crescita | valuta prospettive |
| `impulsivo` | decisione urgente | preferisce decidere subito |
| `leale` | richiesta di aiuto | privilegia un legame già accertato |
| `socievole` | conversazione aperta | allarga lo scambio |
| `opportunista` | scambio vantaggioso | negozia il vantaggio personale |
| `generoso` | richiesta di aiuto | considera aiuto senza contropartita |
| `competitivo` | confronto con un pari | cerca il confronto |
| `riservato` | domanda personale | limita la confidenza |
| `pratico` | problema concreto | propone una soluzione attuabile |
| `idealista` | compromesso con i valori | difende il principio |
| `permaloso` | critica personale | percepisce svalutazione |
| `irascibile` | provocazione | reagisce con irritazione |
| `rancoroso` | tentativo di riparazione | richiede riparazione di un torto reale |
| `conciliante` | tentativo di riparazione | cerca ricomposizione di un conflitto reale |
| `flessibile` | revisione del piano | considera l'alternativa |
| `ostinato` | revisione del piano | difende il piano attuale |

`disciplinato` e `incostante` non hanno contratto operativo finché manca un
vero ciclo persistente degli impegni, coerentemente col punto 3.

### Prerequisiti: la personalità non inventa la storia

Il prototipo rende espliciti i prerequisiti:

- `leale` reagisce come tale a una richiesta di aiuto solo se esiste un
  `legameAccertato`;
- `rancoroso` richiede un `tortoAccertato`;
- `conciliante` su una riparazione richiede un `conflittoAccertato`.

Questi flag sono **input del contratto**, non nuovi campi da salvare con questi
nomi. Nell'integrazione dovranno essere derivati dalle fonti autorevoli
(relazioni, Strada, carcere, eventi o rete) invece di duplicarne lo stato.

La combinazione `rancoroso + conciliante` produce nel prototipo una risposta
composta: ricomposizione possibile a condizione di riparare il torto. I due
tratti non si annullano né sommano bonus numerici.

### Composizione delle coppie

Con 18 tratti esistono 153 coppie teoriche. Il prototipo ne accetta 152 nella
generazione generica e blocca soltanto `flessibile + ostinato`, perché senza
domini distinti la coppia produrrebbe due segnali opposti allo stesso trigger.

Regole verificate dal contratto:

- ordine dei tratti non significativo;
- duplicati e codici sconosciuti rifiutati;
- tratti sospesi rifiutati dal pool operativo;
- terzo tratto rifiutato di default e ammesso soltanto tramite richiesta
  esplicita del chiamante narrativo;
- nessun effetto numerico viene cumulato dal prototipo;
- nessuna scrittura in `G`, `p.strada`, `p.carcere`, relazione o salvataggio.

Altre coppie vengono escluse solo quando un comportamento concreto dimostra un
conflitto reale. Non costruiamo una tassonomia di incompatibilità arbitraria.

### Contratto degli interessi

`prioritizeTopics(interessi, topics)` conserva gli oggetti contenuto e cambia
soltanto la priorità, portando avanti i temi pertinenti agli interessi attivi.
Non aggiunge campi di ricompensa, non modifica l'input e non rende selezionabile
un contenuto che il contesto non aveva già fornito.

Il prototipo quindi non decide **se** un'azione è consentita; ordina contenuti
già candidati dal sottosistema competente.

### Verifiche ricostruite

Il test Vitest copre:

- 18 tratti operativi e 2 sospesi;
- distinzione prudente/diffidente;
- prerequisito reale di `leale`;
- prerequisiti di `rancoroso` e `conciliante`;
- composizione della riparazione;
- indipendenza dall'ordine dei tratti;
- tutte le 153 coppie operative teoriche: 152 ammesse e 1 bloccata;
- duplicati, codici sconosciuti, sospesi e terzo tratto;
- tre interessi attivi e tre sospesi;
- zero interessi ammesso per legacy ma non per nuovi NPC generici;
- priorità dei temi senza mutazioni o ricompense.

Nell'ambiente di ricostruzione è stato eseguito uno smoke test Node sulla logica
del modulo e il controllo sintattico di modulo e test. La suite Vitest completa
del repository non viene dichiarata eseguita da questo connettore: va verificata
dal runtime del progetto/CI.

### Sufficienza rispetto al dimensionamento

Il riferimento 300–800 non richiede che ogni NPC abbia una coppia di tratti o
interessi unica. Richiede che la combinazione complessiva PERSONA produca
varietà e che il costo della valutazione resti locale al personaggio/evento.

Il prototipo soddisfa il vincolo di costo: valuta soltanto i tratti della persona
coinvolta e i temi candidati per quell'interazione; non scansiona né aggiorna
l'intera popolazione.

La **personalità** ha ora un contratto sufficientemente distinto per procedere
all'integrazione successiva. Gli **interessi**, invece, hanno un contratto
corretto ma un catalogo ancora troppo piccolo per essere considerato finale:
la varietà dovrà crescere insieme ai contenuti, e sarà controllata nel reaudit.

### Confine del punto 4

**Chiuso in questo punto:** responsabilità di tratti/interessi, catalogo
interessi attivo/sospeso, contratti semantici dei 18 tratti, prerequisiti,
composizione, prototipo e test mirati.

**Non ancora gameplay attivo:** tag semantici sui contenuti reali,
`personalita.tratti` / `personalita.interessi` nei generatori, risposte
combinate, scoperta, effetti sulle relazioni e ampliamento degli interessi.
L'integrazione deve avvenire senza sommare il vecchio bonus `car` a nuovi
bonus e senza scrivere direttamente nei sottosistemi proprietari.

## Punto 5 — professione e funzione contestuale

**Stato:** definizione riesaminata sulla repository corrente. Nessun campo
runtime viene convertito in questo punto: il codice legacy usa ancora `ruolo`
come contratto operativo misto e va migrato soltanto quando generatori,
selettori e azioni avranno fonti più precise.

### Cinque domande diverse

Per evitare che un solo campo descriva cose incompatibili, il nuovo modello
distingue:

1. **Professione di base:** che mestiere fa la persona, quando è noto.
2. **Impiego attuale:** dove e con quale mansione lavora adesso, quando è noto.
3. **Funzione contestuale:** perché è rilevante in questo incontro o ambiente.
4. **Competenza:** che cosa sa effettivamente fare.
5. **Servizio disponibile:** che cosa può fare adesso per il protagonista,
   tenendo conto di competenza, stato, relazione e gate dell'azione.

Esempio coerente: la stessa persona può essere **magazziniere** come
professione/impiego, **collega** durante il turno, **rapper** come competenza o
attività musicale e **contatto della Strada** in un altro contesto. Nessuna di
queste informazioni richiede una seconda PERSONA.

### Dati previsti

| Informazione | Collocazione | Regola |
| --- | --- | --- |
| Professione | `vita.professione` | opzionale; assente = sconosciuta |
| Competenze | `vita.competenze` | codici espliciti soltanto quando il contenuto prova la capacità |
| Impiego attuale | `stato.impiego` | punto 6; può cambiare senza cambiare identità |
| Funzione nell'ambiente | derivata dai fatti del contesto | collega, cliente, socio, compagno di detenzione, contatto Strada ecc. |
| Origine dell'incontro | storia/metadata esistenti | descrive dove/come ci si è conosciuti |
| Servizio utilizzabile | vista derivata | competenza + stato + relazione + requisiti dell'azione |
| Organizzazione collegata | riferimento separato quando necessario | una persona non diventa automaticamente il brand/club/agenzia che rappresenta |

Non salviamo un generico array di “ruoli” per duplicare tutti questi fatti.
La funzione contestuale deve essere ricavabile dal sottosistema che la possiede
quando possibile.

### `ruolo` legacy non è una professione canonica

Il campo `p.ruolo` viene oggi usato per semantiche diverse:

- **profili professionali/musicali:** `beatmaker`, `rapper`, `fonico`,
  `videomaker`, `fotografo`, `stylist`, `promoter`, `manager`, `dj`,
  `ar`, `avvocato`;
- **funzioni contestuali:** `collega`, `cliente`, `fornitore`, `rider`,
  `strada`;
- **figura legata a un'attività:** `club` rappresenta nel testo un
  proprietario di club;
- **entità non necessariamente PERSONA:** `brand` contiene oggi nomi come
  “Colle Studio”, “Nord Adv”, “Sedici Agency”, “Vetro Lab”, “Casa Rossa” e
  “Piano B”.

Quindi non è valida una migrazione generale `ruolo → vita.professione`.
`ruolo` resta compatibile finché ogni consumer non viene convertito; i nuovi
campi vengono valorizzati solo da una fonte semantica certa.

### Ambiguità verificata 1 — lavoro del protagonista ≠ lavoro dell'NPC

In `actions.js`, quando nasce un incontro lavorativo:

- `workRoleId` riceve `corrente.id`;
- `workRoleName` riceve `corrente.n`.

`corrente` è il lavoro del **protagonista**. `postoNuovoContattoLavoro()`
salva questi valori in `origineRuoloLavoro` e `origineRuoloNome` sulla
persona incontrata.

Questi campi sono quindi **metadati storici dell'incontro**, non prova della
professione o mansione dell'NPC. Copiarli in `stato.impiego` trasformerebbe,
per esempio, un cliente incontrato mentre il protagonista lavora in Pizzeria
nello stesso mestiere del protagonista.

Anche `origineLuogo`, `p.collega` o il fatto di essere incontrato al lavoro
non bastano da soli a definire un mestiere preciso.

### Ambiguità verificata 2 — socio/dipendente della Strada

Le attività della Strada creano persone tramite un `roleHint` tecnico e poi
salvano il fatto preciso in:

`p.attivita = { id, ruolo }`

dove `ruolo` è `socio` oppure `dipendente`.

La funzione autorevole nell'attività è quindi `p.attivita.ruolo`, non il
`p.ruolo` usato come fallback dal generatore. La futura normalizzazione deve
leggere il fatto specifico senza trasformare “socio” in una professione
universale o “fornitore” nel mestiere permanente della persona.

### Ambiguità verificata 3 — Trasferte e organizzazioni

`trasferte.js` contiene profili umani e non umani nello stesso catalogo.
Il caso più netto è `brand`, che viene presentato come “Brand / agenzia” e
usa nomi di organizzazioni.

Il nuovo modello PERSONA **non deve inventare una biografia umana** per questi
record storici. Le opzioni compatibili sono:

- mantenere il contatto legacy nel suo formato finché esiste il relativo
  consumer;
- quando il contenuto richiede davvero una persona, creare un rappresentante
  umano distinto e collegarlo all'organizzazione;
- introdurre in futuro un modello ORGANIZZAZIONE separato se il gameplay lo
  richiederà.

Il punto 5 non introduce ora quel modello perché sarebbe fuori perimetro.

### Ambiguità verificata 4 — profilo operativo ≠ servizio automatico

Le Trasferte associano `reqKey` a un contatto: avere il numero di un A&R,
manager, fotografo o altro profilo non significa poter usare subito il suo
servizio. Allo stesso modo, Sala e Studio hanno già soglie, costi, cooldown e
requisiti propri.

Il nuovo modello deve quindi evitare flag persistenti tipo
`puoFareFeat=true` o `puoMixare=true` derivati soltanto dal mestiere.

Un servizio è disponibile se:

1. la competenza pertinente è realmente definita;
2. la persona è disponibile nel contesto/canale;
3. il rapporto soddisfa i requisiti;
4. i gate specifici dell'azione sono soddisfatti.

Un interesse musicale non prova competenza. Una competenza musicale non prova
che sia la professione principale. Una professione non garantisce disponibilità.

### Professioni multiple e attività secondarie

Non imponiamo una sola etichetta biografica quando la storia prova davvero più
attività, ma **non generiamo due o tre professioni per ogni NPC per aumentare la
varietà**.

Regola:

- `vita.professione` descrive il mestiere principale/base quando definito;
- ulteriori capacità stanno in `vita.competenze`;
- una seconda professione viene registrata solo se una storyline o un evento
  ne ha bisogno come dato reale;
- hobby/interesse non diventano professioni;
- cambiare impiego non cancella competenze e rapporti già costruiti.

Questa scelta è importante anche rispetto al dimensionamento 300–800: la
varietà deve nascere dalla combinazione dell'intera PERSONA, non gonfiando ogni
record con biografie artificialmente complesse.

### Compatibilità per famiglie di `ruolo`

| Legacy | Lettura compatibile | Non dedurre |
| --- | --- | --- |
| `beatmaker`, `rapper`, `fonico`, `videomaker`, `fotografo`, `stylist`, `promoter`, `manager`, `dj`, `ar` | profilo professionale/artistico plausibile e contratto operativo esistente | impiego esclusivo, reddito, disponibilità permanente |
| `avvocato` | professione esplicitamente descritta | essere già assunto dal protagonista |
| `collega` | funzione lavorativa rispetto al protagonista | mestiere preciso o stessa mansione |
| `cliente` | funzione nell'ambiente commerciale | professione |
| `fornitore` | funzione nella fornitura o fallback tecnico | mestiere specifico senza altro dato |
| `rider` | attività descritta dal contenuto | datore, contratto o impiego attuale per i save legacy |
| `strada` | funzione/provenienza dal giro | professione “criminale”, attività attuale o condanna |
| `club` | persona descritta come proprietario/gestore | che il locale e la persona siano la stessa entità dati |
| `brand` | contatto organizzativo legacy | PERSONA con professione inventata |

### Casi d'accettazione per l'integrazione

Il modello è sufficiente soltanto se i punti successivi possono gestire senza
duplicazioni questi casi:

1. magazziniere che rappa e diventa collaboratore musicale;
2. collega che cambia lavoro ma mantiene chat e rapporto;
3. cliente con professione sconosciuta;
4. socio/dipendente letto da `p.attivita`, senza reinterpretare il fallback;
5. persona conosciuta in carcere senza professione criminale forzata;
6. avvocato conosciuto ma non ancora incaricato;
7. rapper/beatmaker/fonico con requisiti di servizio ancora applicati;
8. A&R o manager con numero ma `reqKey` non ancora soddisfatto;
9. brand/agenzia legacy mantenuta senza inventare una PERSONA;
10. stessa persona presente in Sala, lavoro e Strada con un unico ID.

### Sufficienza rispetto alla simulazione

La simulazione di dimensionamento misura persone distinte, non professioni
distinte. Non c'è quindi alcun requisito di avere centinaia di mestieri.

Per sostenere una popolazione nell'ordine 300–800 è invece importante che:

- professione e competenze siano opzionali e leggere;
- le funzioni contestuali non vengano duplicate in ogni PERSONA se possono
  essere derivate dai sottosistemi;
- cambiare contesto non crei nuove copie dello stesso individuo;
- i generatori non assegnino professioni artificiali solo per “riempire” il
  profilo;
- le distribuzioni future siano valutate sui generatori reali, non sulle
  etichette legacy.

Il punto 5 non richiede quindi nuove strutture pesanti o simulazione economica
degli NPC.

### Confine del punto 5

**Chiuso come definizione:** separazione fra professione, impiego, funzione,
competenza, servizio e organizzazione; interpretazione conservativa di
`ruolo`; quattro ambiguità concrete documentate; criteri d'accettazione.

**Non implementato qui:** `vita.professione`, `vita.competenze`,
`stato.impiego`, conversione dei consumer di `ruolo`, modello
ORGANIZZAZIONE, migrazione legacy o selettori basati sui nuovi dati.

Queste parti devono essere integrate nei punti successivi senza perdere i gate
esistenti di Sala, Studio, Trasferte, lavoro, Strada e sistema legale.

## Punto 6 — stati dinamici e disponibilità

**Stato:** definizione riesaminata sulla repository corrente; ricostruita anche
la correzione concreta del rientro post-carcere e i relativi test. Il modello
generale degli stati non viene ancora materializzato nei salvataggi.

### Principio: stato dinamico ≠ identità

Una persona mantiene ID, identità, personalità, competenze e rapporti quando
cambia lavoro, città, disponibilità o condizione temporanea. Gli stati cambiano
solo attraverso fatti/eventi riferiti a quella persona: non vengono ripescati
casualmente aprendo una schermata o caricando il salvataggio.

Il modello futuro deve coprire soltanto stati che il gameplay usa davvero:

| Dimensione | Contratto futuro | Assenza |
| --- | --- | --- |
| Impiego attuale | `stato.impiego`: condizione, mansione/luogo quando attestati | sconosciuto, non “disoccupato” |
| Detenzione fisica | `stato.detenzione`: libero/detenuto e istituto quando attestati | sconosciuto, non “libero” |
| Città attuale | fonte geografica autorevole compatibile con Trasferte | definita al punto 9 |
| Attività per ambiente | appartenenze + eventuali limitazioni contestuali | non esiste un generico “attivo ovunque” |
| Impedimenti temporanei | contesto/canale/azione interessati, motivo e termine/evento di chiusura | nessun blocco globale inventato |
| Condizione economica | solo quando un evento la usa davvero | niente portafoglio/salario simulato per tutti |

Non aggiungiamo ora salute, morte, fame, umore o calendario giornaliero NPC
solo per rendere il modello più “realistico”: con centinaia di persone
diventerebbero costo e complessità senza gameplay corrispondente.

### Disponibilità è una domanda contestuale

Non esiste un singolo `disponibile=true/false` valido per tutta la persona.
La domanda corretta specifica almeno:

- persona;
- luogo/ambiente;
- azione;
- canale (fisico, chat, telefono, ecc.);
- momento del calendario.

Esempio: un contatto può essere indisponibile nella Strada ma ancora
raggiungibile in chat; può essere fuori città e quindi non comparire fisicamente
al Circolo ma mantenere una relazione; può aver chiuso un impiego senza perdere
competenze o numero.

Ordine minimo dei controlli:

1. identità canonica e filtri legacy ancora autorevoli;
2. geografia/ambiente per gli incontri fisici;
3. detenzione fisica quando esplicitamente nota;
4. impedimenti pertinenti e loro scadenza;
5. accesso, relazione, competenza e gate specifico dell'azione.

La fine di un impedimento **rimuove soltanto l'impedimento**: non regala
presenza, fiducia, numero, servizio o collaborazione.

### Lettura conservativa dei dati legacy verificati

| Dato corrente | Prova | Non prova |
| --- | --- | --- |
| `p.via` | esclusione dai selettori legacy; usato anche quando una persona passa ad altro sistema | morte, trasferimento o cancellazione dell'identità |
| `origineLuogo` e metadati lavoro | storia del contesto d'incontro | impiego attuale o presenza oggi |
| `p.citta`, `p.fuori` | profilo geografico usato dalle Trasferte | viaggio in corso o posizione precisa |
| `circoloSbloccato` | accesso legacy alla selezione del Circolo | residenza, presenza certa o volontà di collaborare |
| `p.strada.streetStatus` | disponibilità **nella relazione criminale** | stato globale della persona |
| `p.strada.returnAfterAbsoluteDay` | scadenza della riemersione nella Strada | scarcerazione fisica o accesso ad altri ambienti |
| `p.carcere.currentJailId` | collegamento all'episodio carcerario gestito | pena completa autonoma dell'NPC |
| `releasedAbsoluteDay` / `returnAfterAbsoluteDay` del carcere | continuità del rapporto fuori | prova che tutti siano stati scarcerati insieme al protagonista |

Quindi i dati carcerari esistenti restano autorevoli per la **storia della
relazione**. Una vera detenzione individuale futura richiede un fatto specifico
dell'NPC e non viene ricostruita retroattivamente.

### Transizioni e calendario

Assunzione, perdita dell'impiego, spostamento, arresto, scarcerazione o altro
impedimento cambiano stato solo se un evento li stabilisce per la persona.

Ogni transizione futura deve:

- conservare l'ID;
- avere fonte/motivo;
- usare il calendario interno;
- essere idempotente al caricamento;
- non essere riapplicata perché una schermata viene riaperta.

Le scadenze usano giorni assoluti positivi del gioco. Una scadenza al giorno N
matura con `oggi >= N`. Non usiamo date reali, timeout browser o aggiornamenti
giornalieri globali dell'intera anagrafe.

### Fix concreto ricostruito — null non è giorno zero

La funzione `postoRientroCarcereDisponibile()` conteneva ancora:

`Number(m.returnAfterAbsoluteDay)`

e quindi `Number(null) === 0`. Una scadenza assente poteva essere letta come
già maturata e impedire la corretta ricostruzione del ritardo dei salvataggi
legacy.

È stato introdotto `postoGiornoAssolutoValido(v)`, che accetta soltanto:

- interi positivi;
- stringhe contenenti un intero positivo, per compatibilità coi save.

Rifiuta `null`, `undefined`, stringa vuota/spazi, booleani, zero, negativi,
decimali e testo non numerico.

La ricostruzione legacy usa la data di uscita solo se anch'essa valida e
conserva i ritardi esistenti:

- rapporto >= 2 → 42 giorni;
- rapporto = 1 → 56 giorni;
- rapporto = 0 → 84 giorni;
- rapporto < 0 → 63 giorni.

Una scadenza esplicita valida prevale sulla ricostruzione. Il rientro al giorno
esatto della scadenza è ammesso. `currentJailId`, `via`,
`linkedStreet` e `outsideFollowupDone` continuano a impedire riattivazioni
inappropriate.

Il rientro non cambia `rel`, `pt`, `numero`, fiducia o favori:
`circoloSbloccato` abilita soltanto la possibilità di ricomparire nel percorso
legacy già esistente.

### Test ricostruiti

`frontend/test/unit/npc-stati-rientro.test.js` copre:

- `null` e altri valori non validi;
- numeri e stringhe numeriche valide;
- ricostruzione dei quattro ritardi 42/56/84/63;
- compatibilità di `releasedAbsoluteDay` salvata come stringa;
- precedenza della scadenza esplicita;
- confine `oggi === scadenza`;
- blocco durante `currentJailId`;
- esclusione `via` e origine non carceraria;
- nessuna ricostruzione dopo collegamento Strada o follow-up completato;
- rapporto/punti/numero invariati;
- idempotenza: il secondo controllo non salva o sblocca di nuovo.

La pagina di gioco è stata aggiornata da `posto.js?v=25` a
`posto.js?v=26` per evitare cache stale nel browser.

### Sufficienza rispetto alla simulazione

Il modello è coerente con il riferimento 300–800 perché **non simula
continuamente ogni persona**. Stati e impedimenti sono persistiti solo quando
servono; scadenze e viste possono essere valutate alla prima lettura pertinente.

Questa scelta evita una scansione/aggiornamento giornaliero di centinaia di NPC
e lascia al punto 18 la misurazione reale di crescita del save e costo dei
selettori.

### Confine del punto 6

**Chiuso:** modello concettuale degli stati, disponibilità contestuale,
interpretazione dei dati legacy, regole temporali, fix concreto del rientro
post-carcere e test mirati.

**Non ancora implementato:** oggetto generale `stato`, transizioni comuni per
impiego/detenzione/città/impedimenti e manager centrale. Queste parti devono
essere introdotte insieme alle appartenenze, geografia, selettori e
centralizzazione senza creare una seconda fonte di verità concorrente.

## Punto 7 — appartenenze agli ambienti

**Stato:** modello riesaminato e modulo runtime ricostruito. Il modulo è caricato
prima di `posto.js`, ma resta passivo finché un evento non registra o chiude
esplicitamente un'appartenenza.

File introdotti:

- `frontend/js/game/npc-appartenenze.js`;
- `frontend/test/unit/npc-appartenenze.test.js`.

### Ambiente, appartenenza, gruppo e presenza

I quattro concetti restano distinti:

- **ambiente:** luogo/contesto concreto e identificabile;
- **appartenenza:** legame persistente e motivato fra PERSONA e ambiente;
- **gruppo:** cerchia sociale concreta, definita più avanti ai punti 13–14;
- **presenza:** fatto dell'incontro odierno, deciso dal selettore del punto 8.

Frequentare una Sala non significa far parte di una crew. Essere appartenente
a un ambiente non significa essere presente oggi. Essere presente non implica
che il protagonista conosca nome, telefono, tratti o altre informazioni.

### Schema implementato

Ogni episodio in `p.appartenenze` contiene:

| Campo | Regola |
| --- | --- |
| `ambienteId` | ID opaco e stabile dell'ambiente concreto |
| `tipo` | una delle famiglie `musica`, `lavoro`, `strada`, `carcere`, `quartiere`, `attivita`, `evento` |
| `fonte` | evento/fatto che giustifica l'ingresso; obbligatorio |
| `dalGiorno` | giorno assoluto positivo, incluso |
| `alGiorno` | giorno finale escluso; `null` se non è prevista una fine |
| `fonteFine` | evento che ha chiuso esplicitamente l'episodio |

Gli intervalli sono quindi `[dalGiorno, alGiorno)`.

L'`ambienteId` non viene interpretato dal modulo: `sala:provincia` e
`sala:milano` sono riferimenti distinti, ma il significato geografico viene
risolto dal futuro registro ambienti/geografia. Questo evita che il modulo
inventi città o alias.

### API implementata

`window.ADF_NPC_APPARTENENZE` espone:

- `perPersona(p)`: restituisce copie degli episodi persistiti;
- `attive(p, giorno)`: restituisce gli episodi validi in quella data;
- `registra(p, episodio)`: registra un fatto esplicito;
- `chiudi(p, ambienteId, giorno, fonteFine)`: chiude l'episodio attivo
  pertinente senza cancellarne la storia.

Le letture non scrivono nel salvataggio e non deducono niente da `ruolo`,
`origineLuogo`, `circoloSbloccato`, `p.citta`, `p.fuori`,
`p.strada` o altri campi legacy.

Il modulo non accede a `G`, non chiama `save()`, non genera log, ricompense
o NPC e non tocca fiducia/relazioni.

### Idempotenza e storia

Ripetere la stessa registrazione con stesso ambiente, tipo, fonte e
`dalGiorno` restituisce l'episodio già esistente senza duplicarlo, anche dopo
una chiusura.

Un rientro successivo nello stesso ambiente crea invece un nuovo episodio se:

- inizia dopo la fine del precedente;
- mantiene un `tipo` coerente con quell'ambiente;
- usa una nuova fonte/data motivata.

Gli episodi sovrapposti vengono rifiutati. Anche un cambio di `tipo` sullo
stesso `ambienteId` viene rifiutato perché indicherebbe un registro ambienti
incoerente.

Una chiusura esplicita può anticipare una scadenza già prevista, ma non può
chiudere un episodio prima/durante il suo ingresso.

### Dati legacy: nessuna migrazione inventata

Gli NPC storici possono non avere `p.appartenenze`. Questo è valido.

In particolare:

- `origineLuogo` resta storia dell'incontro;
- `circoloSbloccato` resta filtro legacy e non crea appartenenza Sala;
- `p.citta` / `p.fuori` non creano automaticamente ambienti;
- `p.strada.known` non equivale a frequentazione di un ambiente Strada;
- `p.carcere` non implica un'appartenenza carceraria perpetua;
- `p.attivita` può fornire in futuro una fonte concreta per registrare
  l'ambiente dell'attività, ma non viene migrato automaticamente qui.

La migrazione conservativa è il punto 19.

### Sufficienza rispetto ai sistemi esistenti

Il modello è sufficiente per rappresentare senza duplicare PERSONA questi casi:

1. collega che frequenta anche la Sala;
2. musicista che compare in Sale di città diverse;
3. socio/dipendente legato a una specifica attività;
4. episodio in carcere con inizio/fine;
5. frequentazione di un quartiere o contesto Strada senza trasformarlo in gruppo;
6. rientro nello stesso ambiente dopo un'assenza reale.

Non è ancora sufficiente da solo a decidere **chi compare oggi**: servono stato,
geografia, vincoli e pesi del punto 8.

### Sufficienza rispetto alla simulazione

Il riferimento 300–800 rende corretta una struttura **sparsa per persona** e non
una matrice PERSONA × ambiente.

Un NPC salva soltanto gli episodi che sono realmente avvenuti. Nessun ambiente
viene preassegnato per riempire il profilo e nessuna storia viene cancellata
solo per rispettare un tetto artificiale.

Il rischio residuo è la crescita di episodi in carriere molto lunghe o con
ambienti ripetuti: va misurata al punto 18 sui save reali. Il punto 7 non
introduce pruning perché cancellare storia può rompere ricorrenze e migrazioni.

### Test ricostruiti

La suite mirata copre:

- nessuna deduzione dai campi legacy;
- più ambienti sulla stessa PERSONA;
- idempotenza;
- idempotenza dopo chiusura;
- chiusura selettiva;
- intervalli temporali e rientro;
- chiusura anticipata di una scadenza prevista;
- Sale/città distinte;
- copie in lettura;
- roundtrip JSON;
- tipo incoerente;
- episodi sovrapposti e date non valide;
- dati persistiti incoerenti rifiutati invece di “aggiustati”.

### Confine del punto 7

**Chiuso:** modello, schema, API, modulo caricato e test dedicati.

**Non ancora integrato:** generatori di lavoro/Sala/Strada/carcere/Trasferte,
registro centrale ambienti, geografia, scoperta UI, crime groups e migrazione.
Questi collegamenti vanno effettuati nei punti successivi senza reinterpretare
automaticamente i dati legacy.

## Punto 8 — ricomparsa e selezione

**Stato:** selettore generale ricostruito e collegato al Circolo; gli altri
sistemi restano volutamente da integrare nel manager comune del punto 16.

File introdotti:

- `frontend/js/game/npc-selezione.js`;
- `frontend/test/unit/npc-selezione.test.js`.

### Ordine delle decisioni

La ricomparsa segue questo ordine:

1. risolvere PERSONA canoniche già esistenti;
2. applicare vincoli fisici/contestuali;
3. verificare l'appartenenza esplicita, quando presente;
4. usare il percorso legacy soltanto per NPC senza lista esplicita;
5. ordinare i soli candidati ammessi;
6. usare legami reali come suggerimento secondario, mai come bypass;
7. applicare il budget dell'incontro.

Punteggio, relazione e legami non possono rendere eleggibile una persona che
fallisce un vincolo.

### Contratto del selettore

`window.ADF_NPC_SELEZIONE.seleziona(persone, richiesta)` non accede a `G`,
non genera NPC, non salva e non assegna ricompense.

La richiesta contiene:

| Campo | Regola |
| --- | --- |
| `ambienteId` | ambiente concreto, obbligatorio |
| `giorno` | giorno assoluto positivo |
| `periodo` | chiave stabile della rotazione |
| `quanti` | budget intero non negativo |
| `verifica` | callback obbligatoria dei vincoli hard |
| `legacy` | callback usata solo se `p.appartenenze` è assente |
| `punteggio` | peso finito dei soli candidati ammessi |
| `legami` | persone/ID realmente collegati, ricontrollati nel pool ammesso |
| `memoria` | snapshot opzionale `{ambienteId, periodo, ids}` |

Il risultato contiene:

- `persone`: riferimenti canonici agli oggetti PERSONA;
- `memoria`: ordine completo del pool ammesso per quell'ambiente/periodo.

### Appartenenze esplicite e fallback legacy

Se `p.appartenenze` esiste, anche come array vuoto, il selettore richiede una
appartenenza attiva per l'`ambienteId` esatto. Un episodio scaduto o riferito a
`sala:milano` non viene ammesso in `sala:provincia`.

Solo quando la lista non esiste viene chiamato `legacy(p)`.

Questo è importante per la migrazione graduale: i nuovi fatti espliciti non
vengono contraddetti da flag storici, mentre i vecchi save continuano a
funzionare finché non vengono convertiti.

### Stabilità e memoria

Il selettore usa un tie-break deterministico basato su:

- ID completo della PERSONA;
- `ambienteId`;
- `periodo`.

Non dipende dall'ordine di `G.gente`.

Quando riceve una memoria valida dello stesso ambiente/periodo:

- conserva l'ordine delle persone ancora ammesse;
- rimuove chi non supera più i vincoli;
- aggiunge nuovi candidati in coda;
- non permette a un cambiamento di punteggio causato dal render di rimescolare
  la lista già scelta.

Aumentare `quanti` conserva quindi il prefisso della lista corta.

### Legami

`legami(p)` può suggerire una seconda PERSONA accanto alla prima. Il
suggerimento viene accettato soltanto se quella persona:

- è già fra i candidati forniti;
- supera gli stessi vincoli hard;
- supera appartenenza/fallback;
- non è già stata inserita.

Un contatto comune non crea una PERSONA, una presenza, un gruppo o
un'appartenenza.

ID duplicati nei candidati vengono rifiutati invece di fondere automaticamente
persone che il chiamante dovrebbe già aver normalizzato.

### Integrazione Circolo

`presentiOggi()` usa il nuovo selettore quando disponibile e conserva il
vecchio algoritmo come fallback per test/runtime parziali.

Ambiente corrente:

`sala:provincia`

Periodo:

rotazione settimanale.

Snapshot persistito nello stato:

`G.npcPresenzeSala`

Il ramo nuovo conserva il punteggio storico del Circolo:

- relazione;
- relazione Strada nota;
- precedenti presenze;
- conseguenze recenti;
- contatti comuni;
- componente deterministica settimanale.

Ma il punteggio viene applicato **dopo** i vincoli.

### Vincoli fisici attuali del Circolo

Prima del punteggio vengono esclusi:

- `p.via`;
- `p.carcere.currentJailId` esplicito;
- contatti delle Trasferte con `p.fuori === true`;
- città corrente esplicitamente diversa da `provincia`, leggendo in ordine
  `p.mondo.cittaAttuale`, `p.cittaAttuale`, `p.citta`.

Non viene usato `ST_CITTA`: appartiene al pannello crime e non certifica la
posizione fisica del protagonista.

Per NPC senza appartenenze esplicite, `postoSoloLavoro(p)` resta il filtro
legacy. Un NPC con una vera appartenenza `sala:provincia`, invece, non viene
respinto soltanto perché conserva una vecchia origine lavorativa.

La geografia definitiva resta il punto 9.

### Bug di stabilità corretto

Il vecchio punteggio includeva `circoloPresenze`, ma `presentiOggi()`
incrementava lo stesso contatore dopo la scelta.

Senza memoria:

1. primo render sceglie una lista;
2. il render modifica `circoloPresenze`;
3. secondo render ricalcola i punteggi;
4. la lista può cambiare pur essendo lo stesso periodo.

Con `G.npcPresenzeSala` l'ordine settimanale viene fissato prima
dell'incremento. Lo stesso giorno ogni persona incrementa
`circoloPresenze` al massimo una volta tramite `circoloUltimoVistoKey`.
Il campo `visto` non viene modificato: vedere una faccia non equivale a
conoscerla.

### Test ricostruiti

La suite del selettore copre:

- vincoli prima di punteggio/legami;
- fallback legacy soltanto senza appartenenze esplicite;
- appartenenze scadute e array vuoti;
- distinzione fra Sale di città diverse;
- ordine indipendente dall'anagrafe;
- budget zero;
- memoria stabile dopo cambi di punteggio;
- rimozione dalla memoria di persone divenute incompatibili;
- nuovi candidati aggiunti in coda;
- prefisso stabile aumentando il budget;
- legami ammessi solo se entrambi eleggibili;
- memoria di periodo/ambiente diverso ignorata;
- ID duplicati rifiutati;
- punteggi non finiti rifiutati.

Un test aggiuntivo esegue il ramo reale di `presentiOggi()` con entrambi i
moduli e verifica insieme:

- Milano esclusa;
- detenzione esclusa;
- `fuori` escluso;
- appartenenza esplicita Sala capace di superare il solo filtro legacy lavoro;
- ricomparsa con contatto comune;
- snapshot settimanale;
- prefisso pomeriggio → sera;
- contatore presenza una sola volta al giorno;
- nessuna modifica di `visto`.

### Sufficienza rispetto alla simulazione

Il selettore è adatto a una popolazione nell'ordine 300–800 perché valuta il
pool del contesto e salva soltanto un array di ID come memoria, non copie degli
NPC.

Resta però una verifica quantitativa da fare al punto 18:

- dimensione degli snapshot quando il pool ammesso cresce;
- costo dei sort con centinaia di candidati;
- frequenza di riuso delle stesse persone;
- capacità di far emergere nuove conoscenze senza cancellare la continuità.

La simulazione misura il numero di persone incontrate, non dimostra che i pesi
del Circolo producano una varietà piacevole. Questo richiede playtest.

### Confine del punto 8

**Chiuso:** motore generale di selezione, memoria stabile, legami controllati,
vincoli prima dei pesi, integrazione concreta del Circolo e test.

**Non integrato qui:** lavoro, Strada, carcere, attività e Trasferte. Devono
adottare lo stesso contratto nel punto 16 con i rispettivi gate, senza
sostituire i loro sistemi specifici.

