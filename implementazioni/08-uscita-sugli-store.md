# L'uscita su Steam e sugli store

Il vincolo che decide le scelte tecniche, e i cinque lavori che servono per
vendere il gioco davvero.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 32 · Il gioco esce su Steam e sugli store, non dentro a un artifact

32. ma no è sbagliato quel vincolo, noi il gioco lo vogliamo mettere su steam e sui vari store del telefono quindi non deve girare dentro ad un artifact, in
    base a questo cambia tutti i readme e creami un file, nella cartella database (la cartella entra nel readme e non va pushata) con uno schema del database
    con tutte le colonne, le relazioni ecc.

---

## 32 · (riscritto) e lo schema del database

32. Quel vincolo è sbagliato: il gioco lo vogliamo mettere su Steam e sui vari store del telefono, quindi non deve girare dentro a un artifact. In base a questo cambia tutti i readme, e crea nella cartella database un file con lo schema del database — tutte le colonne, le relazioni ecc. — che non va pushato.

   **FATTO (31/08/2026).**
   - **`backend/database/schema.md`** (fuori da git, come `backend.md`): lo schema completo
     per il gioco che esce sugli store. Quattordici tabelle — `account`, `identita`,
     `dispositivo`, `artista`, `bot_stato`, `carriera`, `stagione`, `settimana`,
     `punteggio_settimana`, `classifica_posizione`, `notizia`, `relazione`, `traguardo` +
     `artista_traguardo`, `sospetto` + `sanzione`, `acquisto` — con tipi, vincoli `CHECK`,
     chiavi esterne, indici, il disegno delle relazioni, le tre query che contano
     (top N, «sei 428°», le frecce ▲▼), la procedura di cancellazione dell'account che
     Apple e Google pretendono, le differenze su SQLite e lo script di travaso dal JSON.
   - **README rifatti** con il vincolo giusto: radice, `frontend/`, `backend/`,
     `backend/database/`, più il dossier `backend.md`.

   **La cosa che cambia davvero, ed è più grossa di un file di schema.** Il vincolo del
   file unico non c'è più, ma al suo posto ne arrivano cinque, e sono tutti obbligatori:
   1. **un build vero** (Vite + moduli ES): trenta `<script>` in ordine fisso e il `?v=`
      alzato a mano sono accettabili per un sito nostro, non per un prodotto in vendita;
   2. **i salvataggi non possono più stare nel `localStorage`**: file vero sul dispositivo,
      Steam Cloud, e il salvataggio in cloud nostro che porta la carriera dal PC al telefono;
   3. **account veri** (Steam, Sign in with Apple, Google Play Games) al posto della chiave
      nel browser — e la **cancellazione dell'account dentro al gioco**, che Apple e Google
      pretendono;
   4. **l'interfaccia per il telefono**: la plancia è disegnata a 1536×1024 e scalata, in
      verticale non ci sta. È il lavoro più lungo di tutta la lista;
   5. **un database vero**: SQLite appena c'è l'account, PostgreSQL dal primo giorno di
      vendita. Con account e salvataggi in cloud, perdere il database vuol dire perdere le
      carriere della gente.

   **Il linguaggio invece non lo cambio, e stavolta il motivo è un altro.** Non è più «il
   file unico»: è che Anni di Fame è un gestionale fatto di schermate, liste, carte e testo
   — niente fisica, niente 3D, niente sessanta fotogrammi al secondo — e per quello HTML e
   CSS sono lo strumento giusto, non un ripiego. Con Godot o Unity toccherebbe rifare a
   mano bottoni, liste che scorrono, campi di testo e tipografia, cioè le uniche cose che
   qui contano. Su Steam mezzo genere gestionale è fatto così, dentro a un guscio: Electron
   per il desktop, Capacitor per iOS e Android. E il gioco esiste già: riscriverlo altrove
   sono mesi di regressioni per un giocatore che non vedrebbe niente di diverso.
   L'ordine con cui farei i cinque lavori sta in `frontend/README.md`.

---

## I cinque lavori per uscire

--- I CINQUE LAVORI PER USCIRE SU STEAM E SUGLI STORE (dal punto 32) ---

33. Il build vero: il gioco va impacchettato, non servito come trenta script in fila.

   **FATTO (31/08/2026)** — `frontend/strumenti/build.js`, `dev.js`, `prova.js`,
   `package.json`. Unica dipendenza: esbuild, e solo per il build — nel gioco non entra.
   - `npm run build` → `dist/`: 13 fogli di stile e 36 file di codice diventano **due file
     soli**, minificati (**291 KB** di codice, **77 KB** di stile), col nome che porta
     dentro l'impronta del contenuto (`gioco-20eefd0e.js`). La cache si sistema da sé e il
     **`?v=` a mano sparisce dal prodotto**. Tutti i percorsi sono relativi: è così che la
     cartella viene aperta da Electron e da Capacitor.
   - `npm run dev` → il gioco dai sorgenti con la **ricarica automatica**: salvi un file e
     la pagina si rifà da sola. Zero dipendenze, 90 righe.
   - `npm run demo` → `dist/anni-di-fame.html`, il gioco in un file solo (631 KB, immagini
     comprese) da mandare a qualcuno per un playtest. Sostituisce `build-artifact.py`, che
     ho tolto.
   - `npm run prova` → 12 controlli senza browser: un file aggiunto e mai messo in
     `index.html`, un tag che punta a un file che non c'è più, un'immagine sparita da sotto
     a un CSS, un file che non compila, il build senza impronta. Passano tutti.
   - **Provato davvero**: il build minificato aperto nel browser apre il menu e la plancia
     intera — mappa, profilo, telefono, eventi della giornata — senza un errore in console.

   **Perché non Vite e perché niente moduli ES.** Vite serve a chi ha già i moduli; noi no,
   e convertirli tutti in una notte era una macchina da regressioni. Questi 36 file
   condividono lo stesso scope (`G`, `PHASES`, `pick`, `$`) e alcuni fanno cose al momento
   del caricamento, in un ordine che conta: coi moduli l'ordine lo deciderebbe il grafo
   degli import e il gioco si romperebbe **in silenzio**, magari in una schermata su venti.
   Con la concatenazione l'ordine resta identico a quello che gira adesso — il build non
   può cambiare il comportamento, può solo impacchettare. I moduli si faranno una cartella
   alla volta, col gioco giocabile a ogni passo, e non servono per uscire.

34. I salvataggi non possono più stare nel localStorage: file vero sul dispositivo, Steam Cloud, e il cloud nostro legato all'account, così la carriera passa dal PC al telefono.

   **META' FATTA (01/09/2026) — il lato server c'è.** `PUT/GET /api/carriera/:slot` e
   `GET /api/carriere`: tre slot come quelli in locale, lo stato del gioco (l'oggetto `G`)
   salvato per intero, tetto di 2 MB. **In conflitto vince la partita più avanti** e
   all'altro dispositivo si dice cos'è successo: due salvataggi non si fondono mai da soli,
   si perde roba e il giocatore non capisce perché. Nel ponte del gioco ci sono già
   `ONLINE.salvaCarriera()`, `ONLINE.carriera()` e `ONLINE.carriere()`.
   **Resta da fare**: agganciare `save()` del gioco (adesso scrive solo nel `localStorage`),
   il file vero nella cartella dell'app — che arriva col guscio Electron/Capacitor — e
   Steam Cloud.

35. Gli account veri (Steam, Sign in with Apple, Google Play Games, mail) al posto della chiave nel browser — e la cancellazione dell'account dentro al gioco, che Apple e Google pretendono.

   **FATTO (01/09/2026), tranne i tre negozi.**
   - **Account e sessioni**: `POST /api/account` (da ospite o con mail e password),
     `POST /api/sessione`, `DELETE /api/sessione`, `GET /api/io`. Le password stanno come
     **scrypt** con sale, i gettoni di sessione solo come **hash**: chi si prende il
     database non si prende né le une né gli altri.
   - **Non si compila niente per giocare**: chi si iscrive alla classifica riceve un account
     da ospite aperto dal server, senza mail, senza password, senza schermate.
   - **Nessuno perde quello che aveva**: la vecchia chiave (`x-chiave`) funziona ancora, e
     si scambia con una sessione vera (`POST /api/sessione`, tipo `legacy`).
   - **La cancellazione dell'account c'è** e fa la cosa giusta: l'artista resta in
     classifica senza nome e senza padrone (la storia degli altri non si sfonda), spariscono
     salvataggi, identità, dispositivi e la mail. Serve `{"conferma":"cancella"}`.
   - **Steam, Apple e Google: la verifica c'è** (`backend/accessi.js`, fatta il 01/09/2026
     poco dopo). Apple e Google mandano un token firmato RS256 e lo controlliamo contro le
     loro chiavi pubbliche — firma, emittente, destinatario, scadenza; Steam manda un
     biglietto e lo fa verificare a Steamworks. Tutto con Node e basta.
     **Mancano solo le chiavi**, che si prendono quando l'app è registrata sugli store: se
     una chiave non c'è quel canale risponde `501` e dice quale manca, se il biglietto è
     sbagliato risponde `403`. Non c'è nessun caso in cui si entra senza verifica.
     Provato davvero: la prova si fa una coppia di chiavi sua, mette in piedi un finto
     «appleid.apple.com» e controlla che un biglietto buono entri e uno firmato da un altro,
     scaduto o fatto per un altro gioco no.
   - **Chi bara: sospetti e sanzioni.** Ogni punteggio limato lascia un sospetto; da
     `GET /api/sospetti` si guarda a mano e si decide. Tre sanzioni, e la regola è
     **fuori dalla classifica prima della sospensione**: chi è fuori classifica sparisce
     dalla graduatoria ma **continua a giocare la sua partita** — nel dubbio è la punizione
     giusta, se ci siamo sbagliati non abbiamo tolto il gioco a un cliente che l'ha pagato.
   - **La copia di sicurezza**: `npm run copia`, anche a server acceso (`VACUUM INTO`), che
     tiene le ultime trenta e controlla che la copia si apra. Con dentro account e
     salvataggi, questa è la cosa più importante di tutto il backend.
   - **Provato in Chrome** (01/09/2026), col gioco vero e il server acceso: iscrizione,
     punteggio, «sei 88° su 141» con i bot sopra e sotto, salvataggio in cloud e riletto,
     conflitto rifiutato, traguardo, e la storia che conta — account legato a una mail,
     browser svuotato come se fosse un telefono nuovo, rientro con la mail e **carriera
     ritrovata**. Poi la cancellazione dell'account, e col server spento il gioco che tira
     dritto senza un errore in console.

36. L'interfaccia sul telefono: la plancia e' disegnata a 1536x1024 e scalata, in verticale non ci sta. Disposizione sua, aree da toccare da 44 punti, niente hover, testi leggibili senza zoom. E' il lavoro piu' lungo dei cinque.

37. Il database vero: SQLite appena c'e' l'account, PostgreSQL dal primo giorno di vendita. Lo schema completo e' gia' scritto in backend/database/schema.md, il travaso dal JSON e' uno script di mezz'ora — e va fatto adesso che siamo a 140 bot e tre giocatori, non di corsa con diecimila account dentro.

   **FATTO (01/09/2026) — il file JSON non c'è più, sotto c'è SQLite.**
   `node:sqlite`, dentro Node: nessuna dipendenza da installare, nessun servizio da mandare
   avanti, un file solo — e transazioni, WAL, chiavi esterne vere.
   - **18 tabelle** come da schema: account, identita, dispositivo, artista, bot_stato,
     carriera, stagione, settimana, punteggio_settimana, classifica_posizione, notizia,
     relazione, traguardo, artista_traguardo, sospetto, sanzione, acquisto, stato.
   - **Migrazioni**: file `.sql` numerati in `database/migrazioni/`, applicati in ordine e
     una volta sola, ognuno in una transazione. Niente ORM.
   - **Lo storico c'è**: una riga di `punteggio_settimana` per artista per settimana, e una
     fotografia della classifica a ogni giro — da lì escono le frecce ▲▼, che adesso sono
     un dato salvato e non un numero tenuto a mente.
   - **Il travaso è scritto e provato** (`npm run travaso`): l'ho fatto girare su un
     archivio finto e il vecchio giocatore si è ritrovato l'artista, la posizione, la
     freccia e la chiave che funzionava ancora.
   - **La prova del server è passata da 25 a 55 controlli**, e comprende un'occhiata dentro
     al database: le chiavi solo come hash, le password solo come scrypt, lo storico che si
     riempie, l'artista di chi ha cancellato l'account senza nome e senza padrone.

   **Resta PostgreSQL**, ma non adesso: serve quando i server diventano più di uno, non
   quando le righe diventano tante. Lo schema è già scritto per tutti e due e il cambio
   tocca un file solo (`database/archivio.js`), che è il motivo per cui esiste.

---
