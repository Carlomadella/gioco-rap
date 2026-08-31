# Il database della classifica

Tre cose, in quest'ordine:

- **`schema.md`** — il disegno completo: tabelle, colonne, tipi, vincoli, relazioni,
  indici, le query che contano, come si cancella un account. **Non sta in git** (come
  `backend.md`): è il documento su cui si lavora, va letto da lì.
- **`archivio.js`** — lo strato dati: l'unico file di tutto il server che tocca il disco.
- **`dati/`** — l'archivio vero. **Non sta in git**: sono dati, non codice.

Questo file racconta com'è messo **adesso** e perché, e cosa succede quando usciamo sugli
store.

## Adesso: un file JSON

`dati/classifica.json`. Una tabella sola di qualche centinaio di righe (140 bot più i
giocatori), letta tutta in memoria all'avvio, riscritta al massimo una volta ogni due
secondi. L'unica query che facciamo è «ordina tutto per stream», che è la definizione di
classifica: nessun indice servirebbe a niente a questa scala, e ordinare mille righe costa
microsecondi.

Va benissimo per **sviluppare e per provare**. Non è dove finiremo.

### Cos'è un archivio

```jsonc
{
  "versione": 1,
  "settimana": 12,                 // la settimana della classifica, non quella della partita
  "creato": 1788208000000,
  "aggiornato": 1788294748494,
  "prossimoGiro": 1788381148494,   // quando scatta la settimana prossima
  "artisti": { "<id>": { …una scheda… } },
  "notizie": [ { "t": 1788294748494, "s": 12, "testo": "Falco è uscito con «Numeri»." } ]
}
```

`artisti` è un oggetto e non una lista apposta: si arriva a una scheda per `id` senza
scorrere niente, ed è l'unica cosa che si fa spesso oltre all'ordinamento.

### Una scheda

| campo | tipo | chi ce l'ha | cosa vuol dire |
| --- | --- | --- | --- |
| `id` | 12 caratteri esadecimali | tutti | l'identità pubblica. **Uguale per bot e giocatori**: non si deve capire chi è cosa |
| `bot` | booleano | tutti | `true` se lo fa la macchina. **Non esce mai da nessuna rotta** |
| `nome` | testo, max 22 | tutti | il nome d'arte, unico in tutta la classifica (senza guardare maiuscole) |
| `citta` | testo | tutti | da dove viene |
| `genere` | testo | tutti | trap, drill, hip hop, r&b, boom bap, urban pop |
| `storia` | testo | tutti | una riga sola, quella che si legge nella scheda |
| `stream` | intero | tutti | **la colonna su cui si ordina la classifica** |
| `streamPrec` | intero | tutti | gli stream all'ultimo giro |
| `pos` | intero | tutti | la posizione di adesso, riscritta a ogni riordino |
| `posPrec` | intero | tutti | la posizione all'ultimo giro: `posPrec - pos` sono le frecce ▲▼ |
| `uscite` | intero | tutti | quanti pezzi ha fuori |
| `deal` | booleano | tutti | se è sotto contratto |
| `seed` | intero | tutti | da qui esce la copertina disegnata dal gioco |
| `ultima` | testo | tutti | il titolo dell'ultima uscita |
| `creato` | timestamp | tutti | quando è entrato in classifica (rompe anche i pareggi di stream) |
| `mom`, `hot` | numeri | solo bot | quanto sta correndo adesso e per quante settimane resta caldo |
| `fan`, `livello`, `fase` | interi | solo giocatori | quello che manda la partita insieme al punteggio |
| `chiave` | hash SHA-256 (64 caratteri) | solo giocatori | **la chiave in chiaro non è mai qui dentro** |
| `ultimo` | timestamp | solo giocatori | l'ultimo punteggio mandato. `0` = mai (è il primo invio, ha la mano larga) |

### Le regole che devono restare vere

1. `bot` e `chiave` **non escono mai** da una rotta. La prima è una regola di gioco, la
   seconda è una regola di sicurezza. Chi tocca `riga()` in `server.js` si ricordi di
   tutte e due.
2. Gli `id` sono **casuali e uguali per tutti**: niente prefissi tipo `bot-`, o si capisce
   subito chi è la macchina.
3. `pos` è sempre coerente con l'ordine per `stream`: si ricalcola dopo ogni punteggio e
   dopo ogni giro (`posizioni()`).
4. `posPrec` si tocca **solo** al giro di settimana. È la fotografia del «prima»: se la
   aggiorni fuori dal giro, le frecce ▲▼ si azzerano e nessuno capisce più chi sta salendo.
5. Il nome è unico, senza guardare maiuscole e minuscole.

## Come si scrive su disco

**Non si scrive mai sopra al file buono.** Si scrive un `.tmp` e lo si rinomina: la
rinomina è atomica, quindi se il server muore a metà scrittura sul disco resta l'ultima
versione intera. Mai un file mezzo scritto.

Le scritture sono **rimandate di due secondi** e accorpate: mille punteggi in un minuto non
fanno mille scritture. Fanno eccezione l'iscrizione, il giro di settimana e lo spegnimento
(`SIGINT`/`SIGTERM`), che salvano subito.

Se il file non si riesce a leggere — non c'è, è troncato, ha una `versione` che non
conosciamo — il server **riparte da un archivio nuovo** e lo dice nel log. Meglio una
classifica vuota che un server che non parte: il posto dove i dati non si perdono è il
backup, non la speranza.

## Copie di sicurezza

```bash
cp dati/classifica.json copie/classifica-$(date +%F).json
```

Online: una copia ogni notte, tenute trenta, su un disco diverso da quello del server. Per
rimettere a posto: si ferma il server, si copia indietro il file, si riavvia.

**Cosa si perde se sparisce tutto, oggi**: le carriere no, quelle stanno nel `localStorage`
di chi gioca. Si perde la classifica. **Quando usciremo sugli store questo non varrà più**:
i salvataggi staranno anche in cloud, e perdere il database vorrà dire perdere le carriere
della gente. È il motivo principale per cui il file JSON deve finire prima di quel giorno.

## Dove andiamo: un database vero, prima di uscire

Il gioco esce su **Steam e sugli store del telefono**. Non è un dettaglio commerciale, è la
cosa che cambia i requisiti del database, per tre motivi:

1. **Servono gli account.** Su uno store la gente reinstalla, cambia telefono, gioca sul
   PC e sul cellulare. L'identità non può essere una chiave nel `localStorage` del browser:
   servono Steam, Sign in with Apple, Google Play Games, e una tabella `account` sotto.
2. **Servono i salvataggi in cloud.** Steam Cloud si aspetta qualcosa da sincronizzare, e
   un giocatore che perde una carriera da quaranta ore lascia una recensione che resta lì
   per sempre.
3. **Servono cancellazione e privacy.** Apple e Google **pretendono** che dentro al gioco
   si possa cancellare il proprio account. Con un file JSON e un `DELETE` a cascata si
   sfonda lo storico di tutti gli altri: va disegnato prima, non dopo.

Più due che arrivano subito dopo: i **traguardi** (Steam, Game Center, Play Games) vogliono
una tabella loro, e lo **storico settimana per settimana** serve sia per i grafici della
carriera sia per accorgersi di chi bara.

**Il piano è questo:**

| quando | dove stanno i dati |
| --- | --- |
| adesso, mentre si sviluppa | file JSON (questo) |
| appena si mette in piedi l'account | **SQLite** (`node:sqlite`: dentro Node, niente da installare) |
| dal primo giorno di store | **PostgreSQL**, con copie automatiche e ripristino provato |

Lo schema completo — tabelle, colonne, relazioni, indici, query e cancellazione account —
sta in **`schema.md`**, con il DDL già scritto per Postgres e le cinque differenze per
SQLite. Il travaso dal JSON è uno script di mezz'ora, e la strada l'abbiamo già lasciata
aperta: `archivio.js` è l'unico file che tocca il disco, gli si tiene la stessa faccia
(`carica`, `salva`, `ordinati`, `posizioni`, `giroSettimana`, `assicuraSettimana`) e il
resto del server non si accorge di niente.

Le migrazioni, da lì in avanti: file SQL numerati in `migrazioni/`, una tabella
`migrazione (nome, applicata_il)`, applicate in ordine all'avvio. Niente ORM.

## Le cartelle

```
database/
  README.md      questo file
  schema.md      il disegno completo del database (fuori da git)
  archivio.js    lo strato dati: l'unico che tocca il disco
  dati/          l'archivio vero (fuori da git: sono dati, non codice)
  migrazioni/    i file SQL numerati, quando ci sarà il database vero
```
