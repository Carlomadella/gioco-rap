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

## Confine del punto 1

**Definito in questo punto:** i sette macro-gruppi, la separazione Persona/Stato/Relazione, la fonte comune dell'identità, le responsabilità dei dati e i vincoli di compatibilità col sistema corrente.

**Non implementato in questo punto:** nuovi campi runtime, migrazione dei salvataggi, nuovo generatore, selettore centrale, cataloghi, mobilità, scoperta, rete ampliata o gruppi emergenti. Questi restano nei punti successivi della sequenza approvata.

Il punto 1 è quindi chiuso come definizione architetturale, senza dichiarare funzionalità runtime non ancora presenti.
