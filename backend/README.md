# Anni di Fame — il server (backend)

Tiene tre cose:

- **la classifica**, una sola per tutti, con dentro i giocatori veri e i bot mescolati e
  **indistinguibili** — il server non dice mai chi è un bot: è una regola di gioco, non un
  dettaglio tecnico (punto 30);
- **gli account**, perché su Steam e sugli store del telefono la gente reinstalla, cambia
  telefono e pretende — giustamente — di ritrovare la propria roba (punto 35);
- **i salvataggi in cloud**, che è quello che porta una carriera dal PC al telefono
  (punto 34, la metà che sta qui).

Sotto ci possono stare **due database**, e il server non sa quale:

- **SQLite dentro a Node** (`node:sqlite`), di suo: niente da installare, niente da mandare
  avanti, un file solo sul disco. È quello che gira in casa e su un server solo.
- **PostgreSQL**, se c'è `ADF_PG`. Serve quando i server diventano più di uno, perché un
  file non lo si condivide fra due macchine.

Si cambia con una riga e non si tocca nient'altro:

```bash
ADF_PG=postgresql://utente:password@127.0.0.1:5432/anni_di_fame npm start
```

Le stesse prove girano sotto tutti e due (`npm run prova` e `npm run prova-pg`). Il
disegno del database sta in [`database/README.md`](database/README.md).

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
si spegne. **133 controlli**, e fra questi la verifica di un biglietto Apple vero: la prova
si fa una coppia di chiavi sua, si mette in piedi un finto «appleid.apple.com» e prova che
un biglietto buono entra e uno firmato da un altro, scaduto, senza scadenza o fatto per un
altro gioco no. **Dalli dopo ogni modifica.**

Le stesse prove girano anche sotto PostgreSQL:

```bash
npm run prova-pg          # vuole ADF_PG (in .env.local va benissimo)
```

Non tocca le tabelle vere: si fa uno **schema usa e getta** per il giro (`prova_<a caso>`),
ci lavora dentro e alla fine lo butta.

## Le rotte, provate da fuori (Postman)

```bash
npm run postman           # 91 richieste, 498 controlli, ~9 secondi
```

Tutte e **34 le rotte** in una collezione Postman, che gira contro un server usa e getta
tirato su per l'occasione. Dove `npm run prova` guarda il server da dentro — apre il
database, controlla che le chiavi ci stiano solo come hash — questa lo guarda **da fuori**,
come lo vede il gioco: metodo, stato HTTP, forma della risposta, e quale errore risponde,
non solo quale numero.

La collezione si importa anche dentro a Postman, col bottone Run. Tutto il resto —
com'è organizzata, cosa controlla, come si cambia — sta in
[`postman/README.md`](postman/README.md).

## Quanto regge (misurato, non detto)

```bash
npm run carico            # 20.000 artisti
node carico.js 100000     # centomila
```

Fa un database usa e getta, ci mette dentro N artisti (140 bot, il resto giocatori, come
nel mondo vero) e cronometra le cose che il server fa davvero. Questi sono i numeri sul
portatile su cui è stato scritto:

| | 20.000 artisti | 100.000 artisti |
| --- | --- | --- |
| la top 10 | **0,5 ms** | 7 ms |
| la top 100 | 1,5 ms | 9 ms |
| la classifica di una città | 0,5 ms | 1 ms |
| un punteggio (traguardi compresi) | 3 ms | 18 ms |
| il feed del telefono | 8 ms | 56 ms |
| chi ho davanti e dietro | 12 ms | 64 ms |
| un giro di settimana | 3 s | 10 s |
| il file sul disco | 9 MB | 34 MB |

**Come si leggono.** Fino a qualche decina di migliaia di giocatori non c'è niente da
discutere: tutto sotto i dieci millisecondi. A centomila comincia a sentirsi «dove sono in
classifica», perché per saperlo bisogna contare quanti stanno davanti — e quello è un conto
che cresce con la gente. Il giro di settimana a dieci secondi non è un problema di per sé
(succede una volta al giorno), ma **blocca il processo mentre lo fa**: da lì in poi va
spostato fuori dalla richiesta.

È la soglia scritta in `database/README.md`, adesso con dei numeri sotto invece di
un'opinione. E questa prova va rifatta quando si tocca una query: se un numero triplica,
l'ha rotto l'ultima modifica.

**Due cose che ha già trovato:** la classifica riordinava tutta la tabella a ogni richiesta
(50 ms invece di 0,5), perché «chi è in classifica» conteneva una sottoquery sulle sanzioni
che impediva di usare l'indice; e il ricambio dei bot confrontava due liste con `indexOf`
dentro a un ciclo — quattrocento milioni di confronti a ogni giro di settimana.

## Le manopole

| manopola | cosa fa | di suo |
| --- | --- | --- |
| `ADF_PORTA` | porta di ascolto | `8787` |
| `ADF_DATI` | file del database, quando sotto c'è SQLite | `database/dati/classifica.db` |
| `ADF_PG` | se c'è, sotto va **PostgreSQL** invece di SQLite | vuota |
| `ADF_PG_CONNESSIONI` | quante connessioni tiene aperte verso PostgreSQL | `10` |
| `ADF_BOT` | quanti bot tenere in pista | `140` |
| `ADF_SETTIMANA_H` | ore vere di una settimana di classifica | `24` |
| `ADF_ORIGINI` | CORS: `*` oppure origini separate da virgola | `*` |
| `ADF_ADMIN` | chiave per le rotte di servizio | vuota (sono chiuse) |
| `ADF_SALE` | sale per gli hash degli indirizzi IP | `anni-di-fame` |
| `ADF_INVIO_MS` | quanto passa fra due punteggi dello stesso artista | `10000` |
| `ADF_PROXY` | `1` se davanti c'è un reverse proxy **nostro** (legge `x-forwarded-for`) | spento |
| `ADF_COPIE` | quante copie di sicurezza tenere | `30` |
| `ADF_STEAM_CHIAVE`, `ADF_STEAM_APPID` | per entrare con Steam | vuote |
| `ADF_APPLE_AUD` | il bundle id dell'app, per Sign in with Apple | vuota |
| `ADF_GOOGLE_CLIENT` | il client id, per Google | vuota |

In casa vanno bene così. Online si cambiano `ADF_ORIGINI` (solo il dominio del gioco),
`ADF_ADMIN` e `ADF_SALE` (chiavi lunghe, mai dentro al codice).

**Dove si scrivono.** Tutte si possono mettere in un file `.env.local` qui accanto, una
riga per manopola — ed è il posto giusto per quelle che sono password (`ADF_PG`,
`ADF_STEAM_CHIAVE`): la riga di comando finisce nella cronologia della shell. Il file
**non sta in git**. Chi è già nell'ambiente vero vince sul file, così in produzione
comanda chi avvia il servizio (`ambiente.js`).

## I file

| file | cosa c'è dentro |
| --- | --- |
| `server.js` | HTTP, CORS, le rotte, chi sei, i freni contro l'imbroglio |
| `bot.js` | i bot: come nascono, come crescono, il carattere, chi smette e chi spunta |
| `nomi.js` | il vocabolario dei nomi d'arte, delle città, delle storie, dei titoli |
| `moderazione.js` + `parole.js` | il filtro dei nomi: normalizza, becca le scritture furbe, protegge le parole innocenti |
| `accessi.js` | entrare con Steam, Apple e Google: verifica dei biglietti firmati |
| `database/copia.js` | la copia di sicurezza, anche a server acceso |
| `ambiente.js` | legge `.env.local`: le manopole che non stanno nel codice |
| `database/db.js` | sceglie il motore e applica le migrazioni |
| `database/sqlite.js` | il motore SQLite |
| `database/postgres.js` | il motore PostgreSQL: segnaposto e transazioni sul pool |
| `database/migrazioni/*.sql` | lo schema per SQLite, in file numerati |
| `database/migrazioni-pg/*.sql` | lo stesso schema per PostgreSQL, stessi nomi di file |
| `database/archivio.js` | **l'unico file che parla col database**: classifica, account, carriere, traguardi |
| `database/travaso.js` | porta il vecchio archivio JSON dentro al database |
| `database/README.md` | com'è messo il database e dove va |
| `database/schema.md` | lo schema completo, commentato (fuori da git) |
| `plausibilita.js` | quanto è credibile un punteggio: il modello che decide fin dove poteva arrivare |
| `prova.js` | i 133 controlli sull'API, sotto l'uno o l'altro motore |
| `carico.js` | la prova di carico: quanto regge, con i numeri |

Il server non sa che database ci sia sotto: parla solo con `database/archivio.js`, e
`archivio.js` parla solo con il motore che `db.js` gli ha messo in mano. È il motivo per
cui passare a PostgreSQL non ha toccato una riga di `server.js`.

## Le rotte

**Il mondo**

| rotta | cosa fa |
| --- | --- |
| `GET /api/stato` | settimana, artisti, giocatori veri, account, salvataggi, prossimo giro |
| `GET /api/classifica?da=1&quanti=100` | una fetta qualsiasi: top 10, top 100, top 1000 |
| `GET /api/classifica?citta=Rovereto` · `?genere=trap` | la stessa classifica guardata da vicino: la posizione si conta **dentro** al filtro |
| `GET /api/classifica/intorno/:id?raggio=4` | chi hai davanti e chi hai dietro — «sei 428°» |
| `GET /api/classifiche` | le città e i generi che hanno davvero gente dentro |
| `GET /api/stagioni` | la stagione in corso e quelle chiuse |
| `GET /api/albo?stagione=1` | l'albo d'oro: chi ha chiuso in cima |
| `GET /api/notizie?quante=10` | chi è uscito, chi ha firmato, chi è sparito |
| `GET /api/feed?quanti=20` | i post per LaFamegram: il mondo, più quello che riguarda te |
| `GET /api/opps?quanti=3` | chi ti sta appena sopra, e i rivali che ti sei preso |
| `POST /api/relazione` | prenderti uno come rivale (o fare pace) |

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
| `POST /api/traguardo` | assegna un traguardo **di quelli che sa solo il gioco** (gli altri li dà il server) |
| `POST /api/segnalazione` | segnala il nome o la storia di un artista |

**Servizio** (serve `x-admin`)

| rotta | cosa fa |
| --- | --- |
| `POST /api/giro` | fa passare una settimana a mano, per provare |
| `POST /api/stagione/chiudi` | chiude la stagione: scrive l'albo d'oro e ne apre una nuova |
| `GET /api/da-guardare` | la coda della moderazione: i più segnalati |
| `POST /api/moderazione` | `rinomina` (nome d'ufficio) oppure `respingi` |
| `GET /api/sospetti` | chi ha fatto alzare un sopracciglio, dal più recente |
| `POST /api/sanzione` | avviso, fuori classifica o sospensione |
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

## Steam, Apple e Google

**La verifica c'è** (`accessi.js`): Apple e Google mandano un token firmato (JWT RS256) e
lo controlliamo contro le loro chiavi pubbliche — firma, emittente, destinatario, scadenza;
Steam manda un biglietto e lo facciamo verificare a Steamworks. Tutto con Node e basta,
nessuna dipendenza.

Quello che manca sono **le chiavi**, che si prendono quando c'è l'app registrata sugli
store. Perciò:

- se la chiave non c'è, quel canale risponde **501** e dice quale manca — non entra nessuno;
- se il biglietto è sbagliato, scaduto, firmato da un altro o fatto per un altro gioco,
  risponde **403**.

Non esiste un caso in cui si entra senza verifica: `GET /api/stato` dice quali canali sono
davvero collegati. Nel frattempo l'account esiste lo stesso — **ospite** (aperto da solo,
senza chiedere niente) ed **email + password**, che è quello che fa sopravvivere una
carriera a un telefono nuovo.

## I nomi: filtro e segnalazioni

Un nome d'arte è **scritto da chi gioca e letto da tutti gli altri**: sta in classifica,
nelle notizie, nelle schede. Apple e Google, giustamente, non pubblicano un gioco che
mostra a un ragazzino quello che un altro ha inventato apposta per offenderlo.

Il filtro (`moderazione.js`) normalizza il nome prima di guardarlo — via accenti, via le
scritture furbe (`c4zz0` → `cazzo`), via le lettere ripetute — e blocca due cose: le parole
offensive e chi prova a **spacciarsi per noi** (`admin`, `staff`, `La Fame Studio`). Le
parole per bene che contengono dentro una vietata sono protette: «Scazzo» e «Cazzuola»
passano, ed è giusto così.

Nessun filtro prende tutto, e ogni filtro prende qualche innocente. Per questo dietro c'è
la coda: `POST /api/segnalazione` (una a testa per artista e motivo, se no bastano cinque
amici per far togliere il nome a chi non ha fatto niente), `GET /api/da-guardare` per chi
modera, e `POST /api/moderazione` per togliere il nome d'ufficio — che non è una punizione
scritta in faccia a tutti, è un nome neutro, e quello di prima resta salvato per poter
rispondere a «perché mi avete cambiato il nome».

## I traguardi li dà il server

Quelli che si possono controllare qui **non li chiede il client**: `in_classifica`,
`top_100`, `top_10`, `primo_posto`, `primo_pezzo`, `primi_mille`, `disco_oro`,
`disco_platino`, `primo_contratto` arrivano da soli quando i numeri ci sono, e tornano
dentro alla risposta del punteggio. Chiederli risponde `409`.

Al gioco restano solo quelli che il server non può sapere — essere arrivato a Milano, dieci
amici alla Sala. È la differenza fra un traguardo che vale e uno che si prende aprendo la
console del browser: con Steam attaccato dietro, quella differenza è tutto.

## Il feed e gli opps

`GET /api/feed` torna dei **post**, non righe di database: nome, settimana, testo e cuori —
la stessa forma che LaFamegram usa già nel gioco (`telPost()` in `js/game/telefono.js`),
così i post del mondo e quelli della tua carriera si mescolano senza che si veda la
giuntura. I cuori non sono a caso: vengono dagli stream di chi ha postato, con una
variazione presa dal suo seme, quindi lo stesso post ne ha sempre gli stessi.

Con una sessione il feed diventa **tuo**: in cima ci finisce chi ti ha passato e chi hai
passato tu dall'ultima fotografia della classifica. È quello che fa la differenza fra un
feed e una bacheca uguale per tutti.

`GET /api/opps` sono i rivali veri: **chi ti sta appena sopra**, con quanti stream ti
mancano per prenderlo. Più quelli che ti sei preso a mano con `POST /api/relazione`, che
restano anche se in classifica si spostano. Con se stessi non si litiga, e nessuno può
dichiarare rivalità per conto di un altro.

## Le stagioni

Una stagione che non finisce mai è una classifica in cui chi è arrivato prima resta davanti
per sempre. `POST /api/stagione/chiudi` fa tre cose:

1. scrive **l'albo d'oro** (chi ha chiuso in cima resta scritto per sempre, col nome che
   aveva allora);
2. **ammorbidisce** i numeri di tutti invece di azzerarli — ×0,25: l'ordine resta, le
   distanze si accorciano, e chi arriva adesso ha una rincorsa possibile. Chi ha lavorato
   un anno non riparte da zero come chi ha installato ieri;
3. apre la stagione dopo. Le settimane continuano a contare: il tempo non si azzera.

## Chi bara: sospetti e sanzioni

Ogni punteggio limato lascia un **sospetto** con dentro cosa aveva chiesto e cosa gli
abbiamo dato. Da lì si guarda a mano (`GET /api/sospetti`) e si decide.

Le sanzioni sono tre, e la regola è **fuori dalla classifica prima della sospensione**:

| tipo | cosa succede |
| --- | --- |
| `avviso` | resta scritto, non cambia niente |
| `fuori_classifica` | sparisce dalla graduatoria pubblica, **ma continua a giocare la sua partita** |
| `sospensione` | non manda più punteggi |

Nel dubbio si dà la seconda: se ci siamo sbagliati non abbiamo tolto il gioco a un cliente
che l'ha pagato. Con `giorni: 0` la sanzione non scade.

## La copia di sicurezza

```bash
npm run copia          # → database/dati/copie/classifica-2026-09-01.db
```

Si dà **a server acceso**: `VACUUM INTO` fa una copia coerente da sé, senza fermare niente
e senza portarsi dietro il `-wal`. Copiare il file a mano mentre il server scrive è il modo
migliore per ritrovarsi una copia rotta il giorno che serve. Tiene le ultime 30
(`ADF_COPIE`) e controlla che la copia si apra e abbia dentro qualcosa.

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

- gli stream che si possono dichiarare non sono più «al massimo il quintuplo»: c'è un
  **modello** (`plausibilita.js`) che guarda da dove vengono — i fan che ti ascoltano, il
  pezzo appena uscito, quello che già andava — e dice fin dove poteva arrivare. È tarato
  **largo** di proposito: fermare per sbaglio uno che gioca davvero è molto peggio che
  lasciar passare uno che bara piano;
- chi bara piano lo prendiamo dall'altra parte: ogni taglio lascia un **sospetto pesato**
  (chi sfora di poco pesa 1, chi moltiplica per venti pesa 5) e a **12 punti in due mesi**
  scatta da sola la sanzione più mite — fuori dalla classifica, non sospeso;
- il **primo invio** ha la mano larga sugli stream ma non sui fan (sono loro a comandare il
  tetto delle settimane dopo) e **non segna nessun sospetto**: chi porta dentro una carriera
  che non abbiamo mai visto non è un imbroglione;
- **un invio ogni dieci secondi** per artista, **120 richieste al minuto** per indirizzo
  (dietro a un reverse proxy nostro si accende `ADF_PROXY=1`, se no si conterebbero tutte
  le richieste come se venissero dal proxy);
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
