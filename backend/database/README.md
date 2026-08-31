# Il database della classifica

Dove guardare, in quest'ordine:

- **`schema.md`** — il disegno completo: tabelle, colonne, tipi, vincoli, relazioni,
  indici, le query che contano, come si cancella un account. **Non sta in git** (come
  `backend.md`): è il documento su cui si lavora.
- **`migrazioni/*.sql`** — lo schema come gira davvero.
- **`archivio.js`** — lo strato dati: l'unico file di tutto il server che parla col database.
- **`dati/`** — il database vero. **Non sta in git**: sono dati, non codice.

Questo file racconta com'è messo **adesso** e cosa manca per il giorno dell'uscita.

## Adesso: SQLite

**Il database c'è** (punto 37, fatto il 01/09/2026): `dati/classifica.db`, SQLite dentro a
Node (`node:sqlite`) — nessuna dipendenza da installare, nessun servizio da mandare avanti,
un file solo sul disco. Lo schema è quello disegnato in `schema.md`, scritto in
`migrazioni/001_iniziale.sql`.

Perché adesso e non prima: con gli account, i salvataggi in cloud e lo storico settimana
per settimana, un file JSON riscritto per intero a ogni cambiamento non regge — e
soprattutto non regge la domanda «da dove riparto se si rompe qualcosa». Con SQLite le
scritture sono transazioni, il WAL tiene il file integro anche se il server muore a metà, e
le query che ci servono (ordina tutto, prendi la fetta, calcola le frecce) sono quelle per
cui un database è fatto.

### Le tabelle che ci sono

`account` · `identita` · `dispositivo` · `artista` · `bot_stato` · `carriera` · `stagione`
· `settimana` · `punteggio_settimana` · `classifica_posizione` · `notizia` · `relazione` ·
`traguardo` · `artista_traguardo` · `sospetto` · `sanzione` · `acquisto` · `stato`

Il dettaglio di ogni colonna, con i tipi, i vincoli e le tre query che contano, sta in
**`schema.md`** (fuori da git). Qui basta sapere il perno del disegno:

> **`artista.account_id` può essere NULL, e quelli sono i bot.** Tutto il resto pende
> dall'artista, non dall'account, così un bot ha esattamente la forma di un giocatore vero
> e nessuna query deve trattarli in modo diverso. È la regola del punto 30 scritta in SQL.

### Le migrazioni

File `.sql` numerati in `migrazioni/`, applicati in ordine e una volta sola, ognuno dentro
a una transazione; il conto lo tiene la tabella `migrazione`. Niente ORM, niente strumenti
da installare: si aggiunge `002_qualcosa.sql` e riparte il server.

### Come si guarda dentro

```bash
sqlite3 dati/classifica.db "SELECT nome, stream, bot FROM artista ORDER BY stream DESC LIMIT 10;"
sqlite3 dati/classifica.db ".backup copia.db"     # la copia si fa anche a server acceso
```

## Il travaso dal vecchio archivio JSON

```bash
npm run travaso
```

Legge `dati/classifica.json` (l'archivio di prima) e riempie il database: artisti, bot con
il loro slancio, notizie, e la fotografia della classifica della settimana scorsa — così le
frecce non ripartono da zero. Per ogni giocatore vero apre **un account da ospite** con
l'artista attaccato e gli tiene la chiave che ha già nel browser: nessuno perde niente, il
client vecchio continua a funzionare, e quando vuole la scambia con una sessione vera.
Il file JSON non viene toccato: tienilo da parte finché non sei sicuro.

## Le regole che devono restare vere

1. `artista.bot` e `artista.account_id` **non escono mai** da una rotta, e le chiavi
   nemmeno. Il primo fa cadere l'illusione, gli altri sono dati personali. Passa tutto da
   `riga()` in `archivio.js`: ogni campo nuovo si aggiunge lì, di proposito.
2. Gli `id` sono **casuali e uguali per tutti**: niente prefissi tipo `bot-`, o si capisce
   subito chi è la macchina.
3. La posizione non si tiene in una colonna: si calcola con `row_number()` sull'ordine per
   `stream`, così non può mentire.
4. `classifica_posizione` si scrive **solo** nel giro di settimana. È la fotografia del
   «prima»: se la tocchi fuori dal giro, le frecce ▲▼ si azzerano e nessuno capisce più chi
   sta salendo.
5. Il nome è unico fra chi non è ritirato, senza guardare maiuscole e minuscole.
6. Un punteggio per artista per settimana: è la chiave primaria di `punteggio_settimana`.
   Il secondo invio della stessa settimana aggiorna, non aggiunge.

## Come si scrive su disco

Ci pensa SQLite, e meglio di come ci pensavamo noi: **WAL** (si legge mentre si scrive, e
un'interruzione non lascia il file a metà), **foreign_keys accese** (le chiavi esterne
valgono davvero), transazioni per le cose che devono essere tutto-o-niente — il giro di
settimana e la cancellazione di un account.

Se il file non c'è, il server se lo crea e applica le migrazioni. Se c'è ma è di una
versione più vecchia, le migrazioni mancanti si applicano da sole all'avvio.

## Copie di sicurezza

```bash
sqlite3 dati/classifica.db ".backup copie/classifica-$(date +%F).db"
```

Si può dare a server acceso: SQLite fa una copia coerente da sé. Copiare il file a mano
mentre il server scrive **non** è sicuro (c'è anche il `-wal` da portarsi dietro).

Online: una copia ogni notte, tenute trenta, su un disco diverso da quello del server. Per
rimettere a posto: si ferma il server, si copia indietro il file, si riavvia.

**Cosa si perde se sparisce tutto**: adesso che i salvataggi stanno anche in cloud, si
perdono le carriere della gente. Non è più «si perde la classifica»: è il danno vero. Da
qui in poi il backup è la cosa più importante di tutto il server, e il ripristino va
provato, non solo fatto.

## Cosa manca ancora

Gli account, i salvataggi in cloud, lo storico e la cancellazione ci sono. Restano due
cose, e nessuna delle due è codice da scrivere adesso:

1. **PostgreSQL**, il giorno dell'uscita vera. SQLite regge benissimo un server solo e
   decine di migliaia di righe; il passo a Postgres serve quando i server diventano più di
   uno, non prima. Lo schema è già scritto per tutti e due (`schema.md`), e il cambio è
   riscrivere `archivio.js` tenendogli la stessa faccia — il resto del server non se ne
   accorge, che è esattamente il motivo per cui esiste quel file.
2. **Steam, Apple e Google** dentro a `identita`: le colonne ci sono già (`tipo`,
   `id_esterno`), manca il pezzo che verifica il biglietto firmato da loro. Finché non c'è,
   il server risponde `501` invece di fidarsi — porta chiusa, non porta finta.

**Il piano, e dove siamo:**

| quando | dove stanno i dati | stato |
| --- | --- | --- |
| all'inizio | file JSON | superato |
| da quando ci sono gli account | **SQLite** (`node:sqlite`) | **è qui che siamo** |
| dal primo giorno di store | **PostgreSQL**, con copie automatiche e ripristino provato | da fare |

## Le cartelle

```
database/
  README.md          questo file
  schema.md          il disegno completo, commentato (fuori da git)
  db.js              apre SQLite e applica le migrazioni
  migrazioni/*.sql   lo schema, in file numerati
  archivio.js        lo strato dati: l'unico che parla col database
  travaso.js         dal vecchio JSON al database
  dati/              il database vero (fuori da git: sono dati, non codice)
```
