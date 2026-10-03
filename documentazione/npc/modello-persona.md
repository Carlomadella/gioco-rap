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

