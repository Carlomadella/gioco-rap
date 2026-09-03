# Le rotte del server, provate su Postman

Tutte e **34 le rotte** di `server.js`, in **91 richieste** e **498 controlli**.

```bash
cd backend
npm run postman
```

Si tira su un server suo su una porta sua, con un database usa e getta, gli fa passare
addosso tutta la collezione, e alla fine spegne e butta via. Non tocca niente di tuo.

```
server di prova su http://127.0.0.1:8796, database usa e getta

┌─────────────────────────┬──────────────────┬─────────────────┐
│                         │         executed │          failed │
│                requests │               91 │               0 │
│              assertions │              498 │               0 │
│ total run duration: 8.5s                                     │
│ average response time: 8ms [min: 2ms, max: 72ms]             │
└──────────────────────────────────────────────────────────────┘
```

Il motore è **newman**, che è Postman da riga di comando: stessa collezione, stessi
script, stessi risultati del bottone Run. Non sta fra le dipendenze — se lo tira giù
`npx` la prima volta (una trentina di secondi) e poi se lo tiene.

## Dentro a Postman, col bottone

1. **Import** → `anni-di-fame.postman_collection.json`
2. **Import** → l'ambiente, oppure fattelo a mano con due variabili: `base`
   (`http://127.0.0.1:8787`) e `admin` (la tua `ADF_ADMIN`).
3. `cd backend && npm start`, poi **Runner** → la collezione → **Run**.

Nel workspace c'è anche una collezione **«Anni di Fame — il server (indice)»**: è solo la
mappa delle rotte, da guardare. L'API di Postman butta via gli script di test delle
richieste dentro alle cartelle, quindi quella caricata di lì arriverebbe **senza i suoi
498 controlli**. Quella che prova qualcosa è il file qui accanto, importato.

## Com'è organizzata

Dodici cartelle, e **vanno in ordine**: non sono 91 richieste indipendenti, sono un giro.

| | cosa prova |
| --- | --- |
| **1 · Il mondo** | stato, notizie, feed: le rotte che rispondono a chiunque |
| **2 · La classifica** | la classifica e i filtri per città e genere |
| **3 · Le stagioni** | stagioni, albo d'oro, chi hai davanti e dietro |
| **4 · Account e sessioni** | **apre l'account e la sessione che usano tutte le altre** |
| **5 · Gli artisti** | iscrizione, scheda, punteggio, e i freni |
| **6 · Il mondo che ti riguarda** | le stesse rotte, ma sapendo chi sei; le relazioni |
| **7 · I salvataggi in cloud** | i tre slot, e il conflitto fra due dispositivi |
| **8 · I traguardi** | il catalogo, e la riga fra quelli del gioco e quelli del server |
| **9 · Segnalare un nome** | le segnalazioni di chi gioca |
| **10 · Le rotte di servizio** | le otto che vogliono `ADF_ADMIN` |
| **11 · I bordi** | il preflight CORS, una rotta che non c'è, un corpo scritto male |
| **12 · Chiudere** | esci, e cancella l'account |

La 4 apre l'account, la 12 lo cancella. Una richiesta presa da sola in mezzo funziona solo
se il giro è già passato di lì — `token`, `artistaId` e `altroId` se li passano le
richieste fra loro, scrivendoli nelle variabili della collezione.

## Cosa serve avere acceso

| manopola | senza di lei |
| --- | --- |
| `ADF_ADMIN` | la cartella 10 risponde 403 a tutto — ed è **giusto così**: senza quella manopola le rotte di servizio sono chiuse per tutti, e c'è una prova apposta che lo controlla |
| `ADF_APPLE_AUD`, `ADF_GOOGLE_CLIENT`, `ADF_STEAM_CHIAVE` | entrare con Apple, Google o Steam risponde **501** «canale non ancora collegato» |

`npm run postman` la `ADF_ADMIN` se la fa da sé, a caso, e la passa solo a quel server lì.

**Su Apple/Google/Steam la prova accetta due risposte**, 501 e 403, perché dipende da quali
chiavi hai in `.env.local`. Quello che non deve mai succedere è un **200**: un biglietto
non verificato che fa entrare qualcuno è il buco peggiore che ci sia in un gioco con Steam
attaccato dietro, e quello lo controlla in tutti e due i casi. La verifica vera della firma
di un biglietto Apple sta in `npm run prova`, che si fa una coppia di chiavi sua e mette in
piedi un finto `appleid.apple.com`.

## Due avvertenze

- **Non contro il server vero.** La cartella 10 fa girare la settimana e chiude la
  stagione: azzera lo slancio dei bot, scrive nell'albo, e si vede da fuori. Contro un
  database usa e getta (`npm run postman`), o contro quello di casa.
- **Il freno è 120 richieste al minuto per indirizzo.** Il giro ne fa 91, tutte dentro allo
  stesso minuto: un secondo giro lanciato subito dopo il primo prende 429. Aspetta un
  minuto, o usa `npm run postman`, che ogni volta riparte da un server nuovo.

## Come si cambia

Il JSON **non si scrive a mano**: è generato.

```bash
node postman/genera.js
```

`genera.js` è l'unico file da toccare. Le rotte ci stanno una sotto l'altra e si leggono, e
i controlli che si ripetono — lo stato giusto, la risposta che è JSON, la forma di un
errore — si scrivono una volta sola:

```js
req("Leggi uno slot vuoto", "GET", "/api/carriera/3", {
  sessione: true,
  prova: errore(404, "slot-vuoto")
})
```

Un JSON da tremila righe, invece, è un posto dove una virgola fuori posto non si vede e un
controllo copiato male passa inosservato. Il JSON generato è committato lì accanto perché
chi lo vuole importare in Postman non debba far girare niente.

## Cosa controlla, oltre allo stato HTTP

Due prove girano su **tutte** le richieste, senza doverle ripetere: che il server non si
sia spaccato (500, 502, 503, 504 — il 501 no, è la risposta voluta di «canale chiuso») e
che risponda entro un secondo.

Poi, per ognuna, che la risposta sia **JSON** — una rotta che sbaglia spesso torna una
pagina di errore con dentro dell'HTML, e «status 200» da solo non se ne accorgerebbe — e
che dica quello che deve dire. Gli errori hanno tutti la stessa forma (`{ errore: "..." }`)
e il controllo guarda **quale** errore è, non solo il numero: `403` da solo non distingue
«sessione scaduta» da «non è tuo», e sono due bug diversi.

Qualche controllo che vale la pena di sapere che c'è:

- **nessuna riga della classifica dice chi è un bot.** È una regola di gioco, non un
  dettaglio tecnico, e il modo in cui si rompe è che qualcuno aggiunge un campo comodo;
- **il segreto non torna mai indietro**, nemmeno dentro alla risposta che apre l'account;
- **la chiave dell'artista non si vede** sulla sua scheda pubblica;
- **i traguardi che dà il server** (`primo_pezzo`, `primi_mille`, …) arrivano da soli col
  punteggio, e chiederli dal client prende 409. È la riga che separa un traguardo che vale
  da uno preso aprendo la console del browser;
- **il conflitto dei salvataggi**: in cloud la settimana 40, il dispositivo alla 12 → 409 e
  dice cosa c'è già, invece di fondere le due partite di nascosto;
- **la roba degli altri non si tocca**: scheda, punteggio, relazioni e traguardi di un
  artista che non è tuo rispondono tutti 403;
- **il preflight CORS** dice `x-sessione`, `x-admin` e `x-chiave`. Se sbaglia quello, il
  gioco nel browser non parla più col server e in console si legge solo «CORS error».

## Le tre prove del server, e a cosa servono

| | cosa fa |
| --- | --- |
| `npm run prova` | 143 controlli sul comportamento, compresa la firma di un biglietto Apple vero. **Va data dopo ogni modifica.** |
| `npm run postman` | le rotte come le vede chi chiama: metodo, stato, forma della risposta |
| `npm run carico` | quanto regge, con 20.000 o 100.000 artisti |

Si sovrappongono in parte, e va bene: `prova.js` guarda il server da dentro (apre il
database e controlla che le chiavi ci stiano solo come hash), la collezione lo guarda da
fuori, come lo vedrebbe il gioco o chiunque altro.
