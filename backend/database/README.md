# Il database della classifica

Oggi il database è **un file JSON**: `dati/classifica.json`. Tutto qui dentro spiega cosa
c'è scritto, come ci finisce, come si salva la pelle se si rompe, e — la parte che conta —
**quando smettere di usarlo e passare a un database vero**.

Lo strato dati è tutto in `archivio.js`. Nessun'altra parte del server tocca il file: il
giorno che si cambia motore si riscrive quello e basta.

## Perché un file JSON e non SQLite o Postgres

Non è una scorciatoia, è la misura giusta per adesso:

- i dati sono **una tabella sola** di qualche centinaio di righe (140 bot più i giocatori);
- si legge **tutta insieme a ogni ordinamento** — una classifica è per definizione un
  `ORDER BY` su tutto: nessun indice servirebbe a niente a questa scala;
- sta in memoria in **meno di un megabyte**, e ordinare mille righe costa microsecondi;
- zero dipendenze, zero installazione: chiunque scarichi il repo lo fa partire.

Un database vero serve quando ne serve almeno una di queste: **scritture in parallelo da
più processi**, **query che non siano "ordina tutto"**, o **dati che non stanno in RAM**.
Le soglie precise stanno più in basso.

## Cos'è un archivio

```jsonc
{
  "versione": 1,              // se cambia il formato, questo sale e il vecchio si scarta
  "settimana": 12,            // la settimana della classifica, non quella della partita
  "creato": 1788208000000,    // quando è nato l'archivio
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
5. Il nome è unico. Chi controlla lo fa senza guardare maiuscole e minuscole.

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

Un archivio è un file solo, quindi la copia è un `cp`:

```bash
cp dati/classifica.json copie/classifica-$(date +%F).json
```

Online: una copia ogni notte, tenute trenta, in una cartella che non sta sullo stesso
disco del server. Per rimettere a posto: si ferma il server, si copia indietro il file, si
riavvia. Non serve altro.

**Cosa si perde se sparisce tutto**: le carriere dei giocatori no, quelle stanno nel
`localStorage` di chi gioca. Si perde la classifica — posizioni, storia dei giri, i bot con
i loro nomi. I giocatori rientrano da soli al primo punteggio, ma tornano indietro: per
questo la copia va fatta davvero.

## Quando passare a un database vero

Non «quando saremo grandi»: quando succede una di queste cose.

| segnale | soglia | dove si va |
| --- | --- | --- |
| l'archivio non sta comodo in memoria | oltre **50.000** artisti (~30 MB) | SQLite |
| serve più di un processo che scrive | il secondo server acceso | SQLite (WAL) o Postgres |
| servono query che non siano «ordina tutto» | classifiche per città, per genere, per stagione | SQLite |
| serve lo storico, non solo il «prima» | grafico dell'andamento, premi di fine stagione | SQLite/Postgres, tabella a parte |
| più macchine, non più processi | due server dietro a un bilanciatore | Postgres |

**Il passo giusto è SQLite** (`node:sqlite`, dentro Node, senza installare niente), non
Postgres: tiene decine di migliaia di righe e le query che ci servono senza aggiungere un
servizio da mandare avanti. A Postgres si va solo quando i server diventano più di uno.

Il giorno che si fa, si riscrive `archivio.js` tenendo la stessa faccia — `carica`, `salva`,
`ordinati`, `posizioni`, `giroSettimana`, `assicuraSettimana` — e il resto del server non
se ne accorge. Le tabelle sarebbero più o meno queste:

```sql
CREATE TABLE artisti (
  id           TEXT PRIMARY KEY,
  bot          INTEGER NOT NULL DEFAULT 0,
  nome         TEXT    NOT NULL,
  citta        TEXT    NOT NULL,
  genere       TEXT    NOT NULL,
  storia       TEXT    NOT NULL DEFAULT '',
  stream       INTEGER NOT NULL DEFAULT 0,
  stream_prec  INTEGER NOT NULL DEFAULT 0,
  pos          INTEGER NOT NULL DEFAULT 0,
  pos_prec     INTEGER NOT NULL DEFAULT 0,
  uscite       INTEGER NOT NULL DEFAULT 0,
  deal         INTEGER NOT NULL DEFAULT 0,
  seed         INTEGER NOT NULL DEFAULT 0,
  ultima       TEXT,
  fan          INTEGER NOT NULL DEFAULT 0,
  livello      INTEGER NOT NULL DEFAULT 1,
  fase         INTEGER NOT NULL DEFAULT 0,
  mom          REAL    NOT NULL DEFAULT 0,
  hot          INTEGER NOT NULL DEFAULT 0,
  chiave       TEXT,                          -- solo hash, mai la chiave in chiaro
  creato       INTEGER NOT NULL,
  ultimo       INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX artisti_nome ON artisti (lower(nome));
CREATE INDEX artisti_stream ON artisti (stream DESC);

CREATE TABLE notizie (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  t        INTEGER NOT NULL,
  settimana INTEGER NOT NULL,
  testo    TEXT    NOT NULL
);

CREATE TABLE stato (             -- una riga sola: settimana, prossimo giro, versione
  chiave TEXT PRIMARY KEY,
  valore TEXT NOT NULL
);
```

E la migrazione è uno script di venti righe che legge il JSON e fa gli `INSERT`: il
formato di adesso ha già dentro tutto quello che serve.

## Le cartelle

```
database/
  README.md      questo file
  archivio.js    lo strato dati: l'unico che tocca il disco
  dati/          l'archivio vero (non sta in git: sono dati, non codice)
```
