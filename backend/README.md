# Anni di Fame — il server della classifica (backend)

Una classifica sola per tutti. Dentro ci stanno i giocatori veri e i bot, mescolati e
ordinati per stream — e **da fuori non si distinguono**: il server non dice mai chi è un
bot. Non è un dettaglio tecnico, è la regola che tiene in piedi la cosa (punto 30 di
`../implementazioni.md`).

Node e basta: **nessuna dipendenza**, nessun `npm install`, nessun build. Come il gioco.

## Come si avvia

```bash
cd backend
npm start            # oppure: node server.js
```

```
Anni di Fame — classifica su http://localhost:8787
  archivio:   .../backend/database/dati/classifica.json
  in pista:   140 artisti (0 giocatori veri)
  settimana:  1, la prossima fra 1440 minuti
```

La prima volta l'archivio non c'è e il server se lo crea: 140 bot distribuiti in scala
logaritmica, dal ragazzino con 300 ascolti a quello con due milioni. Da lì in poi vive.

## La prova

```bash
npm run prova        # oppure: node prova.js
```

Si avvia un server suo su una porta sua con un archivio usa e getta, fa tutto il giro —
iscrizione, punteggi, chiave sbagliata, freni, giri di settimana, frecce ▲▼, notizie,
archivio su disco — e si spegne. Esce con 0 se fila tutto liscio, con 1 al primo controllo
che non torna. **Dallo dopo ogni modifica al server.**

## Le manopole

Tutte variabili d'ambiente, tutte con un valore sensato di suo.

| manopola | cosa fa | di suo |
| --- | --- | --- |
| `ADF_PORTA` | porta di ascolto | `8787` |
| `ADF_DATI` | file dell'archivio | `database/dati/classifica.json` |
| `ADF_BOT` | quanti bot tenere in pista | `140` |
| `ADF_SETTIMANA_H` | ore vere di una settimana di classifica | `24` |
| `ADF_ORIGINI` | CORS: `*` oppure origini separate da virgola | `*` |
| `ADF_ADMIN` | chiave per forzare un giro di settimana | vuota (non si può) |

In casa vanno bene così come sono. Online si cambiano `ADF_ORIGINI` (solo il dominio del
gioco) e `ADF_ADMIN` (una chiave lunga, mai dentro al codice).

## I file

| file | cosa c'è dentro |
| --- | --- |
| `server.js` | HTTP, CORS, le rotte, i freni contro l'imbroglio |
| `bot.js` | i bot: come nascono, come crescono, chi smette e chi spunta |
| `nomi.js` | il vocabolario dei nomi d'arte, delle città, delle storie, dei titoli |
| `database/archivio.js` | lo strato dati: legge, salva, ordina, fa passare la settimana |
| `database/README.md` | **il modello dei dati**: cosa c'è dentro all'archivio e perché |
| `prova.js` | la prova completa dell'API, senza dipendenze |

Lo strato dati sta tutto dentro `database/`: il giorno che l'archivio JSON non basta più
si riscrive quel file e il resto del server non se ne accorge. Come e quando farlo sta
scritto in `database/README.md`.

## Le rotte

| rotta | cosa fa |
| --- | --- |
| `GET /api/stato` | settimana, quanti artisti, quanti giocatori veri, quando è il prossimo giro |
| `POST /api/artista` | iscrive un artista: torna `id` e `chiave` (la chiave si vede una volta sola) |
| `GET /api/artista/:id` | la scheda pubblica di uno |
| `PUT /api/artista/:id` | cambia nome, città, genere (serve `x-chiave`) |
| `POST /api/punteggio` | manda gli stream della settimana chiusa (serve `x-chiave`) |
| `GET /api/classifica?da=1&quanti=100` | una fetta qualsiasi: top 10, top 100, top 1000 |
| `GET /api/classifica/intorno/:id?raggio=4` | chi hai davanti e chi hai dietro — «sei 428°» |
| `GET /api/notizie?quante=10` | chi è uscito, chi ha firmato, chi è sparito nell'ultimo giro |
| `POST /api/giro` | fa passare una settimana a mano, per provare (serve `x-admin`) |

Tutto JSON, in entrata e in uscita. Gli errori tornano `{"errore":"nome-occupato"}` con lo
stato HTTP giusto: `400` non valido, `403` chiave sbagliata, `404` non esiste,
`409` nome già preso, `429` troppo in fretta.

### Un giro completo

```bash
# ci si iscrive: la chiave torna una volta sola, poi la tiene il client
curl -X POST localhost:8787/api/artista \
  -H 'content-type: application/json' \
  -d '{"nome":"Young Legend","citta":"Rovereto","genere":"trap"}'
# → {"id":"bb20f038015f","chiave":"1fed…","nome":"Young Legend","pos":141}

# a settimana chiusa si manda il punteggio
curl -X POST localhost:8787/api/punteggio \
  -H 'content-type: application/json' -H 'x-chiave: 1fed…' \
  -d '{"id":"bb20f038015f","stream":9000,"fan":1200,"livello":7,"uscite":3,"ultima":"Fine mese"}'
# → {"ok":true,"pos":25,"delta":null,"totale":141,"settimana":1,"limato":false}

# la top 10, con la mia riga a parte anche se sono fuori
curl "localhost:8787/api/classifica?quanti=10&io=bb20f038015f"
```

## La settimana passa anche se non giochi

Ogni `ADF_SETTIMANA_H` ore (di suo 24) il server fa un giro:

1. si fotografa la posizione di tutti — è il «prima» da cui escono le frecce ▲▼ (punto 12);
2. i bot vivono: crescono, uno esce con un pezzo, uno firma, uno sparisce dai radar;
3. chi non manda un punteggio da più di una settimana e mezza perde l'8%;
4. chi è sceso troppo in basso smette, e spunta qualcuno di nuovo dal niente;
5. si riordina tutto e si riparte.

Il giro non ha bisogno di un cron: parte da sé alla prima richiesta utile dopo la scadenza,
e se il server è stato spento per tre giorni recupera i giri arretrati (fino a dodici, poi
riparte da adesso — non ha senso simulare tre mesi di vuoto).

## Sull'imbroglio, onestamente

Il gioco gira nel browser di chi gioca: chi vuole barare bara, e nessun server lo può
impedire. Quello che c'è serve a tenere fuori i numeri assurdi, non a blindare:

- da un invio all'altro gli stream possono al massimo **quintuplicare** (il primo invio ha
  la mano larga, per chi arriva con una carriera già avviata);
- **un invio ogni dieci secondi** per artista, **120 richieste al minuto** per indirizzo;
- il corpo di una richiesta non può superare **16 KB**;
- la chiave viaggia dal client, ma sul server ne resta **solo l'hash SHA-256**;
- i nomi si puliscono da caratteri invisibili e si tagliano a 22 caratteri, e due artisti
  non possono chiamarsi uguale.

Il giorno che i numeri contano davvero (premi, stagioni), la strada è simulare la settimana
**qui** invece che accettarla dal client. Sta scritto in `../backend.md`.

## Come si mette online

Non serve niente di speciale: è un processo Node che ascolta su una porta.

```bash
ADF_PORTA=8787 \
ADF_ORIGINI=https://ilgioco.esempio.it \
ADF_ADMIN=una-chiave-lunga-a-caso \
ADF_DATI=/var/lib/anni-di-fame/classifica.json \
node server.js
```

Davanti ci va un reverse proxy (nginx, Caddy) che fa HTTPS e gira `/api/` qui dietro; il
processo lo tiene su `systemd` (o `pm2`). Due accortezze che valgono più di tutto il resto:
**l'archivio in una cartella che non si cancella** (non `/tmp`) e **una copia ogni notte**
— un `cp` del file basta, il formato è un JSON solo (vedi `database/README.md`).

Il gioco resta un sito statico: si può servire da qualsiasi parte, anche da un CDN. Solo
`/api/` deve arrivare qui.
