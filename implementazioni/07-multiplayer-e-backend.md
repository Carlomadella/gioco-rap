# Il multiplayer e il server

La classifica sola per tutti, gli account, i salvataggi in cloud: tutto quello
che vive fuori dal dispositivo di chi gioca.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 30 · La classifica con i giocatori veri, e i bot per fare numero

30. noi vogliamo che il gioco sia multiplayer, ad esempio le classifiche devono essere con i player reali e all'inizio bot per fare numero, i nomi dei bot devono essere reali comunque.
    Dimmi se esiste già o sennò crea un backend, poi aggiorna il readme e la roadmap di conseguenza

   **Un backend non c'era**: fino a qui il gioco era tutto nel browser, con i rivali generati
   sul computer di chi gioca (`js/game/rivals.js`) e i salvataggi nel localStorage. Nessuna
   chiamata di rete da nessuna parte.

   **FATTO (31/08/2026) — il server della classifica** (`server/`, ponte in `js/net/online.js`).
   Node e basta: nessuna dipendenza, nessun build, come il resto del progetto. Si avvia con
   `node server/server.js`, l'archivio è un file JSON scritto con temporaneo + rinomina.
   - **Una classifica sola per tutti**: dentro ci stanno i giocatori veri e i bot, mescolati e
     ordinati per stream. Da fuori **non si distinguono**: il server non dice mai chi è un bot,
     e non è un dettaglio tecnico — è la regola che tiene in piedi la cosa.
   - **I nomi dei bot sono nomi veri**: «Nino Vento», «Marco T.», «Young Ferro», «Selva 22».
     Quattro forme diverse, prese da un vocabolario di nomi d'arte italiani, tutti inventati —
     nessun rapper che esiste davvero, che sarebbe un problema e non una scorciatoia. Ognuno ha
     la sua città, il suo genere, la sua storia, le sue uscite e il suo contratto.
   - **La classifica si muove anche mentre nessuno gioca**: ogni 24 ore vere il server fa un
     giro di settimana — i bot crescono, uno esce con un pezzo, uno firma, uno sparisce dai
     radar — e chi non manda un punteggio da più di una settimana e mezza scende dell'8%.
     Prima di ogni giro si fotografa la posizione di tutti: da lì escono le frecce ▲▼ della
     settimana (punto 12).
   - **Si può chiedere qualsiasi fetta**: top 10, top 100, top 1000, e «chi ho davanti e chi ho
     dietro» per la riga «sei 428°». Anche le notizie del giro, per il telefono.
   - **Sull'imbroglio, onestamente**: il gioco gira nel browser, chi vuole barare bara. Il server
     tiene fuori l'assurdo — al massimo ×5 di stream fra un invio e l'altro, un invio ogni dieci
     secondi, 120 richieste al minuto per indirizzo, la chiave salvata solo come hash.
   - **Se il server non c'è, il gioco non se ne accorge**: `ONLINE` torna `null` e si continua
     sulla classifica locale. Il multiplayer è una cosa in più, non una da cui dipendere.

   **RESTA DA FARE — la schermata**: oggi `js/game/ui.js` disegna ancora i rivali locali. Il
   prossimo pezzo è agganciare la classifica vera alla schermata, con l'iscrizione automatica
   alla prima settimana chiusa, senza moduli da compilare. L'ordine sta in `ROADMAP.md`.
   README e ROADMAP aggiornati: rotte, manopole e cosa manca.

---

## 31 · Backend e frontend separati, e i README di ognuno

31. Crea il file backend.md da non pushare con tutte le info sulla parte di backend, inoltre suddividi tutti i file in backend e frontend, e all'interno crea un file readme solo per il backend e uno solo per il frontend e uno solo per il database.
    Se secondo te conviene farlo in una maniera diversa dal semplice HTML + CSS + JS vanilla cambia, il progetto deve essere il più professionale e ottimizzato possibile.

   **FATTO (31/08/2026) — il progetto è diviso in due metà.**
   - `frontend/` — il gioco: `index.html`, `css/`, `js/`, `media/`, `strumenti/`, `dist/`.
   - `backend/` — il server: `server.js`, `bot.js`, `nomi.js`, `prova.js`, `package.json`,
     e dentro `database/` lo strato dati (`archivio.js`) con l'archivio vero.
   - Quattro README, uno per cosa: `README.md` in radice è la mappa del progetto,
     `frontend/README.md` il gioco, `backend/README.md` il server,
     `backend/database/README.md` i dati (modello, scritture atomiche, copie di sicurezza,
     e le soglie precise per passare a SQLite quando servirà).
   - `backend.md` in radice: il dossier interno, **fuori da git** (sta in `.gitignore`).
     Decisioni e perché, i limiti veri dell'anti-imbroglio, cosa fare quando si rompe,
     come si va online, dove stanno le chiavi, quanto costa, i rischi da tenere d'occhio.
   - `backend/prova.js` (`npm run prova`): 25 controlli sull'API, senza dipendenze —
     iscrizione, punteggi, chiave sbagliata, freni, giri di settimana, frecce, archivio.
     Passano tutti e 25.

   **RISPOSTA alla domanda «conviene cambiare da HTML + CSS + JS vanilla?» — no, e non è
   pigrizia.** Il gioco deve poter essere **un file solo** che gira dentro a un artifact,
   senza rete e senza niente da installare: oggi ci arriviamo con uno script Python di 60
   righe. Con React o Vue servirebbe un bundler, un `node_modules`, un passaggio di build a
   ogni modifica, e soprattutto la riscrittura di tutto il gioco — settimane di lavoro e di
   regressioni per un giocatore che non vedrebbe niente di diverso. Le cose che un framework
   porta davvero (componenti, stato reattivo, routing) qui sono già risolte in piccolo:
   schermate che si accendono e si spengono, uno stato solo (`G`) nel localStorage, una
   funzione di disegno per schermata.
   **Professionale non vuol dire «con un framework»**: vuol dire cartelle chiare, un file
   per argomento, documentazione che dice la verità e una prova che gira da sola. Quello
   l'ho fatto. Il backend, che nasce adesso ed è l'unico posto dove la scelta era aperta,
   l'ho tenuto senza dipendenze per lo stesso motivo: l'unica cosa che fa è leggere e
   scrivere JSON su HTTP, ed Express aggiungerebbe sessanta pacchetti per risparmiare
   trenta righe di routing.

---

## Quello che al backend mancava per stare in piedi su uno store

--- BACKEND, LAVORI DI OGGI DOPO IL PUNTO 37 (01/09/2026) ---

Non sono punti chiesti da voi: sono le cose che al backend mancavano per stare
in piedi su uno store. Le segno qui per non lasciarle solo nei commit.

- **Accessi con Steam, Apple e Google** (`backend/accessi.js`): la verifica dei
  biglietti firmati c'è tutta — JWT RS256 controllato contro le loro chiavi
  pubbliche (firma, emittente, destinatario, scadenza), e per Steam la chiamata
  a Steamworks. Mancano solo **le loro chiavi**, che si prendono quando l'app è
  registrata: senza, il canale risponde `501` e dice quale manca.
- **Moderazione dei nomi** (`moderazione.js`, `parole.js`): il nome d'arte è
  roba scritta da un utente e mostrata agli altri, e gli store vogliono un
  filtro e una coda di segnalazioni. Il filtro normalizza («c4zz0» → «cazzo»),
  blocca chi finge di essere lo staff, e protegge le parole innocenti («Scazzo»
  passa). Dietro: `POST /api/segnalazione`, la coda `GET /api/da-guardare`, e
  il nome tolto d'ufficio con quello di prima salvato.
- **Traguardi dati dal server**: quelli che si possono controllare dai numeri
  non li chiede più il gioco (li darebbe chiunque dalla console): arrivano da
  soli col punteggio. Al gioco restano quelli che il server non può sapere.
- **Sospetti e sanzioni**: ogni punteggio limato lascia una traccia; le sanzioni
  sono tre, e la regola è **fuori dalla classifica prima della sospensione** —
  chi è fuori sparisce dalla graduatoria ma continua a giocare la sua partita.
- **Classifiche per città e per genere**: «sei 3° a Rovereto» invece di «sei
  428° in Italia». La posizione si conta dentro al filtro.
- **Stagioni e albo d'oro**: si chiude una stagione, chi ha vinto resta scritto,
  e i numeri di tutti si ammorbidiscono (×0,25) invece di azzerarsi.
- **Copia di sicurezza** a server acceso (`npm run copia`), che tiene le ultime
  trenta e ricontrolla quello che ha appena scritto.

La prova del server è a **101 controlli**, tutti verdi, e dentro c'è anche un
finto «appleid.apple.com» con chiavi vere per provare che un biglietto firmato
male non entra.

---

## Tutte le rotte provate su Postman

Da smistare (01/09/2026): "Testa tutte le API routes su postman"

**FATTO.** Tutte e **34 le rotte** di `server.js`, in una collezione Postman da **91
richieste** e **498 controlli**. Girano tutte verdi.

```bash
cd backend && npm run postman
```

Si tira su un server suo, su una porta sua, con un database usa e getta; gli fa passare
addosso tutta la collezione; e alla fine spegne e butta via. **91 richieste, 498 controlli,
0 falliti, 8,5 secondi.** Provata due volte anche contro un database appena nato, per
essere sicuri che non si appoggi a roba lasciata lì dal giro prima.

Il motore è **newman**, che è Postman da riga di comando: stessa collezione, stessi script,
stessi risultati del bottone Run. Non sta fra le dipendenze — se lo tira giù `npx` la prima
volta. Il server non deve portarsi dietro un albero di pacchetti per una cosa che si lancia
a mano ogni tanto.

**Le rotte coperte sono tutte e 34**, contate una per una sul `rotta()` di `server.js`: le
cinque del mondo, le cinque di account e sessioni, le quattro degli artisti, le due della
classifica, le tre delle stagioni, le tre dei salvataggi, le tre dei traguardi, la
segnalazione, e le otto di servizio. Più il preflight CORS e la rotta che non c'è, che non
sono rotte ma sono due modi di rispondere.

**Non sono 91 richieste indipendenti: sono un giro.** La cartella 4 apre l'account e la
sessione, la 12 la cancella; `token`, `artistaId` e `altroId` se li passano le richieste fra
loro. È una scelta: un account finto per ogni richiesta avrebbe reso ogni prova isolata, ma
non avrebbe mai provato la cosa che si rompe davvero — che le rotte **si tengano fra loro**.
Il rivale che ti prendi con `POST /api/relazione` deve ricomparire dentro a `GET /api/opps`,
e il punteggio che mandi deve far scattare i traguardi che poi ritrovi su
`GET /api/traguardi/{id}`. Quelle due cose lì un giro le vede, cento prove separate no.

Il file non si scrive a mano: lo fa `postman/genera.js`, dove le rotte stanno una sotto
l'altra e i controlli che si ripetono si scrivono una volta sola. Un JSON da tremila righe è
un posto dove una virgola fuori posto non si vede.

**Cosa controlla oltre allo stato HTTP.** Su tutte: che il server non si sia spaccato e che
risponda entro un secondo. Su ognuna: che la risposta sia JSON — una rotta che sbaglia
spesso torna una pagina di errore con dentro dell'HTML, e «status 200» da solo non se ne
accorgerebbe — e **quale** errore risponde, non solo il numero: `403` da solo non distingue
«sessione scaduta» da «non è tuo», e sono due bug diversi.

Poi le cose che sarebbe grave rompere senza accorgersene:

- nessuna riga della classifica dice **chi è un bot** — è una regola di gioco, e il modo in
  cui si rompe è che qualcuno aggiunge un campo comodo;
- il **segreto** non torna mai indietro, nemmeno dentro alla risposta che apre l'account, e
  la **chiave** dell'artista non si vede sulla sua scheda pubblica;
- i **traguardi che dà il server** arrivano da soli col punteggio, e chiederli dal client
  prende 409: è la riga fra un traguardo che vale e uno preso aprendo la console;
- il **conflitto dei salvataggi**: in cloud la settimana 40, il dispositivo alla 12 → 409 e
  dice cosa c'è già, invece di fondere le due partite di nascosto;
- la **roba degli altri** non si tocca: scheda, punteggio, relazioni e traguardi di un
  artista che non è tuo rispondono tutti 403;
- il **preflight CORS** dice `x-sessione`, `x-admin` e `x-chiave`. Se sbaglia quello, il
  gioco nel browser non parla più col server e in console si legge solo «CORS error».

**Un controllo l'ho dovuto correggere io, e la correzione è il punto.** Avevo messo, su
tutte le richieste, «niente errori del server: sotto il 500». Ha bocciato la prova di
Apple, che risponde **501** — e il 501 lì è la risposta *giusta*: «questo canale non è
ancora collegato», perché senza le chiavi di Apple il server dice «non posso» invece di
«va bene». Adesso il controllo elenca i codici che sono roba nostra (500, 502, 503, 504) e
lascia stare il 501. Su Apple, Google e Steam la prova accetta 501 **o** 403 secondo cosa
hai in `.env.local`; quello che non deve mai succedere è un **200**.

**Il server non ha sbagliato niente.** Nessun 500, nessun errore in console, tutte le
risposte sotto gli 80 ms. Non è una sorpresa — `npm run prova` copre già gran parte di
questa roba da dentro — ma è la prima volta che le rotte sono guardate **da fuori**, come le
vede chi chiama, e con l'elenco completo davanti invece che a campione.

Nel workspace Postman di Carletto ci sono anche l'ambiente **«Anni di Fame — in casa»** e
una collezione **«Anni di Fame — il server (indice)»**. L'indice è solo la mappa da
guardare: l'API di Postman butta via gli script di test delle richieste dentro alle
cartelle, quindi quella caricata di lì arriverebbe senza i suoi 498 controlli. Sta scritto
nella sua descrizione, perché è il tipo di cosa che se non la dici la scopre qualcuno
premendo Run e credendo di aver provato qualcosa.

File: `backend/postman/genera.js` (la sorgente), `anni-di-fame.postman_collection.json` (il
generato, committato così si importa senza far girare niente), `prova.js` (il giro completo),
`README.md`. Più `npm run postman` in `package.json`.

`npm run prova` resta a 133 controlli, verdi.

---

---

## 21 · Registrazione, entrata e uscita

21. fare pagina di registrazione/login/logout

    **FATTO (02/09/2026)** — branch `task/21-account-login-logout`.

    Il ponte con il server c'era già tutto (`js/net/online.js`:
    `registraConMail`, `entra`, `esci`, `io`, `cancellaAccount`) e le rotte del backend pure
    (`POST /api/account`, `POST /api/sessione`, `DELETE /api/sessione`, `GET /api/io`,
    `DELETE /api/account`). Mancava solo il posto da cui usarle: fino a ieri l'unico modo di
    registrarsi era aprire la console del browser.

    Adesso c'è la sezione **Account** nel pannello delle impostazioni, con la sua voce **07** nel
    menu principale che ci entra dritta. Quattro stati, e ognuno dice la verità:

    - **Il server non risponde** — non è un errore rosso, è un fatto. La regola del ponte non
      cambia: se il server non c'è il gioco non se ne accorge. La sezione lo dice, offre «Riprova»
      e «Cambia server», e tutto il resto continua a funzionare offline come sempre.
    - **Fuori** — due linguette, *Entra* e *Registrati*. Mail e password, e i controlli fatti
      prima di disturbare il server: password sotto gli otto caratteri, le due password che non
      coincidono, i campi vuoti.
    - **Dentro** — chi sei, con che mail, quanti artisti hai, quante carriere hai in cloud, e il
      tasto per **uscire**. Uscire chiude la sessione sul server e cancella il token da qui: la
      carriera su questo dispositivo non si muove, e lo dice.
    - **Cancella l'account** — quello che Apple e Google pretendono dentro al gioco. Si chiede due
      volte sul bottone stesso, come le altre cose che cancellano.

    Gli errori del server non arrivano in faccia come codici: `segreto-troppo-corto`,
    `email-gia-usata`, `non-torna`, `sessione-scaduta`, `troppe-richieste` sono tradotti in
    italiano e in inglese, come tutto il resto del pannello.

    **Una nota onesta è scritta nel pannello**, non nascosta qui: registrandosi con la mail si crea
    un account **nuovo e vuoto**. L'artista e le carriere già in cloud restano attaccati
    all'account ospite che il gioco si era preso da solo al primo giro (è il limite 3 del
    `README-API`). La carriera su questo dispositivo — quella che stai giocando — non si tocca.

    **Provato nel browser vero**, non a occhio, contro il server vivo: con il server su e nessuna
    sessione compare la vista d'ingresso; con credenziali sbagliate il server risponde davvero
    `non-torna` e a schermo si legge «Mail o password sbagliate»; con il server irraggiungibile la
    sezione passa allo stato staccato e non rompe niente. Registrazione e uscita **non** sono state
    provate fino in fondo di proposito: il server ha dentro dati veri, e non ci vado a scrivere
    account di prova.

    **Un bug preso per strada.** La voce nuova del menu non funzionava, e non per colpa sua:
    `js/creator/nav.js` chiamava `statoPartita()`, che non esiste — si chiama `partita()`. Era la
    prima riga del gestore dei `data-go`, quindi esplodeva subito e **nessuna** voce del menu con
    `data-go` faceva niente: «Il tuo artista», «Come si gioca», «Classifiche», «La Fame Studio».
    Funzionavano solo «Inizia la carriera» e «Impostazioni», che hanno un `onclick` loro.

    File toccati: `js/impostazioni-ui.js`, `js/creator/nav.js`, `css/impostazioni.css`,
    `index.html`.
