# Anni di Fame — il server (backend)

Tiene tre cose:

- **la classifica**, una sola per tutti, con dentro i giocatori veri e i bot mescolati e
  **indistinguibili** — il server non dice mai chi è un bot: è una regola di gioco, non un
  dettaglio tecnico (punto 30);
- **gli account**, perché su Steam e sugli store del telefono la gente reinstalla, cambia
  telefono e pretende — giustamente — di ritrovare la propria roba (punto 35);
- **i salvataggi in cloud**, che è quello che porta una carriera dal PC al telefono
  (punto 34, la metà che sta qui).

Sotto c'è **SQLite dentro a Node** (`node:sqlite`): nessuna dipendenza da installare,
nessun servizio da mandare avanti, un file solo sul disco. Il gradino dopo è PostgreSQL, e
il piano sta in [`database/README.md`](database/README.md).

## Come si avvia

```bash
cd backend
npm start            # oppure: node server.js
```

```
Anni di Fame — il server su http://localhost:8787
  database:   .../backend/database/dati/classifica.db
  in pista:   140 artisti (0 giocatori veri)
  account:    0, salvataggi in cloud: 0
  settimana:  1, la prossima fra 1440 minuti
```

La prima volta il database non c'è: se lo crea, applica le migrazioni e mette in pista 140
bot in scala logaritmica, dal ragazzino con 300 ascolti a quello con due milioni.
Serve **Node 22.5 o più nuovo** (è quando è arrivato `node:sqlite`).

## La prova

```bash
npm run prova
```

Si avvia un server suo, su una porta sua, con un database usa e getta; fa tutto il giro —
classifica, iscrizione, punteggi, freni, account con la mail, sessioni, salvataggi in cloud
e i loro conflitti, traguardi, giro di settimana, frecce ▲▼, cancellazione dell'account, e
un'occhiata dentro al database per controllare che le chiavi ci stiano solo come hash — e
si spegne. **55 controlli. Dalli dopo ogni modifica.**

## Le manopole

| manopola | cosa fa | di suo |
| --- | --- | --- |
| `ADF_PORTA` | porta di ascolto | `8787` |
| `ADF_DATI` | file del database | `database/dati/classifica.db` |
| `ADF_BOT` | quanti bot tenere in pista | `140` |
| `ADF_SETTIMANA_H` | ore vere di una settimana di classifica | `24` |
| `ADF_ORIGINI` | CORS: `*` oppure origini separate da virgola | `*` |
| `ADF_ADMIN` | chiave per le rotte di servizio | vuota (sono chiuse) |
| `ADF_SALE` | sale per gli hash degli indirizzi IP | `anni-di-fame` |
| `ADF_INVIO_MS` | quanto passa fra due punteggi dello stesso artista | `10000` |

In casa vanno bene così. Online si cambiano `ADF_ORIGINI` (solo il dominio del gioco),
`ADF_ADMIN` e `ADF_SALE` (chiavi lunghe, mai dentro al codice).

## I file

| file | cosa c'è dentro |
| --- | --- |
| `server.js` | HTTP, CORS, le rotte, chi sei, i freni contro l'imbroglio |
| `bot.js` | i bot: come nascono, come crescono, il carattere, chi smette e chi spunta |
| `nomi.js` | il vocabolario dei nomi d'arte, delle città, delle storie, dei titoli |
| `database/db.js` | apre SQLite e applica le migrazioni |
| `database/migrazioni/*.sql` | lo schema, in file numerati che si applicano in ordine |
| `database/archivio.js` | **l'unico file che parla col database**: classifica, account, carriere, traguardi |
| `database/travaso.js` | porta il vecchio archivio JSON dentro al database |
| `database/README.md` | com'è messo il database e dove va |
| `database/schema.md` | lo schema completo, commentato (fuori da git) |
| `prova.js` | i 55 controlli sull'API |

Il server non sa che database ci sia sotto: parla solo con `database/archivio.js`. È lì che
si va il giorno che si passa a PostgreSQL.

## Le rotte

**Il mondo**

| rotta | cosa fa |
| --- | --- |
| `GET /api/stato` | settimana, artisti, giocatori veri, account, salvataggi, prossimo giro |
| `GET /api/classifica?da=1&quanti=100` | una fetta qualsiasi: top 10, top 100, top 1000 |
| `GET /api/classifica/intorno/:id?raggio=4` | chi hai davanti e chi hai dietro — «sei 428°» |
| `GET /api/notizie?quante=10` | chi è uscito, chi ha firmato, chi è sparito |

**Chi sei**

| rotta | cosa fa |
| --- | --- |
| `POST /api/account` | apre un account: `ospite` (niente da compilare) o `email` + password |
| `POST /api/sessione` | entra: `email`, oppure `legacy` (id artista + vecchia chiave) |
| `DELETE /api/sessione` | esce da questo dispositivo |
| `GET /api/io` | account, artisti, salvataggi, traguardi |
| `DELETE /api/account` | **cancella l'account** (serve `{"conferma":"cancella"}`) |

**Il tuo artista**

| rotta | cosa fa |
| --- | --- |
| `POST /api/artista` | iscrive un artista. Senza sessione apre anche un account da ospite |
| `GET /api/artista/:id` | la scheda pubblica di uno |
| `PUT /api/artista/:id` | cambia nome, città, genere |
| `POST /api/punteggio` | manda gli stream della settimana chiusa |

**La carriera in cloud**

| rotta | cosa fa |
| --- | --- |
| `GET /api/carriere` | i tre slot con le loro date |
| `GET /api/carriera/:slot` | riprende una carriera |
| `PUT /api/carriera/:slot` | la salva (in conflitto vince quella più avanti) |

**I traguardi**

| rotta | cosa fa |
| --- | --- |
| `GET /api/traguardi` | il catalogo |
| `GET /api/traguardi/:artistaId` | quelli che uno ha preso |
| `POST /api/traguardo` | assegna un traguardo |

**Servizio** (serve `x-admin`)

| rotta | cosa fa |
| --- | --- |
| `POST /api/giro` | fa passare una settimana a mano, per provare |
| `GET /api/da-spingere` | i traguardi ancora da mandare a Steam e agli store |
| `POST /api/spinto` | segna che uno è arrivato |

Tutto JSON. Chi sei si dice con `x-sessione: <token>` (o, per i client vecchi, con
`x-chiave` più l'id dell'artista). Gli errori tornano `{"errore":"nome-occupato"}` con lo
stato giusto: `400` non valido, `403` non è tuo o la chiave è sbagliata, `404` non esiste,
`409` conflitto (nome preso, carriera più avanti), `429` troppo in fretta,
`501` accesso non ancora collegato.

### Un giro completo

```bash
# ci si iscrive: non c'è niente da compilare, l'account da ospite lo apre il server
curl -X POST localhost:8787/api/artista -H 'content-type: application/json' \
  -d '{"nome":"Young Legend","citta":"Rovereto","genere":"trap"}'
# → {"id":"…","chiave":"…","token":"…","pos":141}

# a settimana chiusa si manda il punteggio
curl -X POST localhost:8787/api/punteggio -H 'content-type: application/json' \
  -H 'x-sessione: …' -d '{"id":"…","stream":9000,"fan":1200,"livello":7}'

# la carriera si salva in cloud e si riprende da un altro dispositivo
curl -X PUT localhost:8787/api/carriera/1 -H 'content-type: application/json' \
  -H 'x-sessione: …' -d '{"stato":{},"settimana":12,"anno":1}'
```

## Steam, Apple e Google: porta chiusa, non porta finta

`POST /api/account` e `POST /api/sessione` accettano già `steam`, `apple` e `google`, ma
rispondono **501** finché non c'è il pezzo che verifica il biglietto firmato con le loro
API (`verificaBiglietto` in `server.js`). È voluto: accettare un id di Steam senza
verificarlo vorrebbe dire lasciar entrare chiunque come chiunque. Si collega quando c'è il
guscio nativo, cioè insieme a Electron e Capacitor.

Nel frattempo l'account esiste lo stesso: **ospite** (aperto da solo, senza chiedere
niente) ed **email + password**, che è quello che fa sopravvivere una carriera a un
telefono nuovo.

## La settimana passa anche se non giochi

Ogni `ADF_SETTIMANA_H` ore (di suo 24) il server fa un giro:

1. **si fotografa la classifica** in `classifica_posizione` — è il «prima» da cui escono le
   frecce ▲▼ (punto 12);
2. si chiude la settimana e se ne apre una nuova;
3. i bot vivono: crescono secondo il loro **carattere** (costante, esplosivo, meteora),
   qualcuno esce con un pezzo, qualcuno firma, qualcuno sparisce dai radar;
4. chi non manda un punteggio da più di una settimana e mezza perde l'8%;
5. chi è sceso troppo in basso smette, e spunta qualcuno di nuovo dal niente.

Non serve un cron: parte da sé alla prima richiesta utile dopo la scadenza, e se il server
è stato spento tre giorni recupera i giri arretrati (fino a dodici, poi riparte da adesso).

## Sull'imbroglio, onestamente

Il gioco gira sul dispositivo di chi gioca: chi vuole barare bara, e nessun server lo può
impedire. Quello che c'è tiene fuori i numeri assurdi, non blinda:

- da un invio all'altro gli stream possono al massimo **quintuplicare** (il primo invio ha
  la mano larga, per chi arriva con una carriera già avviata); ogni taglio finisce in
  `sospetto`, che è la traccia da cui si guarda chi esagera di mestiere;
- **un invio ogni dieci secondi** per artista, **120 richieste al minuto** per indirizzo;
- le password stanno come **scrypt**, i gettoni di sessione e le vecchie chiavi solo come
  **hash**, gli indirizzi IP solo come hash con sale;
- i nomi si puliscono dai caratteri invisibili e due artisti non si chiamano uguale.

Con un gioco a pagamento e i traguardi di Steam attaccati alla classifica questo non
basterà: la strada è **simulare la settimana qui** e lasciare al gioco solo le mosse. Vuol
dire portare di qua `sim.js`, ed è il lavoro grosso che viene dopo. Il ragionamento per
esteso sta in `../backend.md`.

## Il travaso dal vecchio archivio

Chi ha ancora il `classifica.json` di prima:

```bash
npm run travaso        # database/dati/classifica.json → database/dati/classifica.db
```

**Nessuno perde l'artista.** Per ogni giocatore vero si apre un account da ospite con
l'artista attaccato, tenendo la chiave che ha già nel browser: il client vecchio continua a
funzionare com'è, e quando vuole la scambia con una sessione vera
(`POST /api/sessione`, tipo `legacy`). Anche il «prima» delle frecce viene portato dentro,
così la classifica non riparte tutta da zero. Il file JSON non viene toccato.

## Come si mette online

Un processo Node dietro a un reverse proxy che fa HTTPS:

```bash
ADF_PORTA=8787 \
ADF_ORIGINI=https://ilgioco.esempio.it \
ADF_ADMIN=<chiave lunga a caso> \
ADF_SALE=<un'altra chiave lunga> \
ADF_DATI=/var/lib/anni-di-fame/classifica.db \
node server.js
```

Il processo lo tiene `systemd` (o `pm2`). Da qui in poi, con dentro account e salvataggi,
**il backup è la cosa più importante del server**: il database è un file (più il `-wal`),
si copia a server acceso con `sqlite3 file ".backup copia.db"`, una volta a notte, su un
disco diverso — e il ripristino va **provato**, non solo fatto. Una copia che nessuno ha
mai rimesso a posto non è una copia.

Il gioco resta un pacchetto che gira sul dispositivo: si scarica dallo store e non ha
bisogno di noi per partire. Solo la classifica e il cloud passano di qui.
