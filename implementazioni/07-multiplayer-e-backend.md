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
