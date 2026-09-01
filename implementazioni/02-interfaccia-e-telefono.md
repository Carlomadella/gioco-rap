# L'interfaccia e il telefono

Come si vede e come si tocca: schermate, navigazione, il telefono nella plancia,
il negozio, le impostazioni.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 4 · La pagina di landing

4. Nella pagina di landing manca l'atavar del profilo nel cerchio in alto a destra, in alto a sinistra deve esserci il logo con scritto "Anni di fame", inoltre migliora di molto la landing page

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `d40b20c` del 30/08/2026 — «feat: landing page rifatta, marchio e avatar nella barra (punto 4)».

---


## 5 · Uscire da un'azione senza doverla finire

5. Quando apro un'azione che sia scrivi barre, cerca un beat o qualunque altra card, fai in modo che io possa tornare indietro senza dover per forza cliccare su una delle opzioni che escono (non solo ma anche con ESC).

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `d630481` del 30/08/2026 — «feat: si esce da ogni azione con ✕, ESC o un clic fuori (punto 5)».

---


## 9 · La schermata di gioco era troppo affollata

9. ~~Interfaccia della schermata di gioco: troppe card, troppe informazioni ammassate~~ **FATTO (31/08/2026)**
   - Una testata sola al posto di tre schede impilate: ritratto, nome, anno/settimana/fase, livello e barra
     dell'esperienza sulla stessa riga; sotto, i tre numeri su cui decidi davvero (cassa, chi ti segue, hype).
   - Il contorno — benessere, lucidità, pezzi fuori, lavoro — sta dietro il bottone «Dettagli», chiuso finché
     non lo apri. Se benessere o lucidità scendono sotto 30 il bottone si accende in rosso: nascondere un
     numero non deve nascondere un guaio.
   - La fase della scalata è diventata una fascia bassa: dove sei a sinistra, i gradini a destra, e sotto la
     sola riga che conta, cosa fare adesso. Il racconto della fase è nel titolo al passaggio del mouse.
   - Il catalogo era quattro liste una sotto l'altra: adesso linguette, una lista alla volta, con la pallina
     rossa sulla linguetta quando c'è roba nuova.
   - Lifestyle: le cinque categorie sono chiuse, mostrano dove stai e quanto paghi, e si aprono su richiesta
     invece di venticinque righe tutte insieme.
   - L'energia sta solo nella barra in basso, sempre a schermo, e non fa più doppione con la testata; dalla
     barra sono sparite anno, settimana e fase, già scritte nella testata.

---

## 10 · Dal profilo si torna al gioco, non solo al menù

10. Dalla sezione profilo fai in modo che io possa tornare alla schermata di gioco e non solo al menù principale.

---

## 11 · Via il bottone del menù dalle CTA in basso

11. nelle CTA in basso dello schermo, nella schermata di gioco togli il bottone per tornare al menù, c'è già in alto a sinistra

---

## 16 · La navbar

<!-- 16. la navbar è troppo grande, manca ancora l'avatar nella schermata di menù principale. se clicco su inizia carriera il bottone per tornare al menù non deve stare nella navbar -->

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `ea9ce3c` del 30/08/2026 — «fix: la navbar scende a 37px (punto 16)».

---


## 17 · Il bottone per il menù principale

17. manca il bottone che porta dalla schermata di gioco al menù principale, crealo

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `35d5b5d` del 30/08/2026 — «feat: bottone «Menu principale» nella schermata di gioco (punto 17)».

---


## 18 · L'energia rimasta si deve vedere

18. fai in modo che si possa vedere l'energia rimanente della settimana

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `c7be192` del 30/08/2026 — «fix: css e js con versione nell'url + bottone menu piu' grande + energia in chiaro (punto 18)».

---


## 23 · Il menù delle impostazioni

23. ~~Menù delle impostazioni, aperto dal menu principale~~ **FATTO (30/08/2026)**
    - Audio: interruttore, volume generale, effetti, beat, prova del suono. Il tasto ♪ in partita è lo stesso interruttore.
    - Aspetto: tema (notte / nero assoluto / contrasto alto), colore dell'interfaccia (quello dell'artista o fisso), grana, alone, animazioni, dimensione dell'interfaccia (90-125%), modalità compatta.
    - Gioco: preset di difficoltà (facile / normale / duro / su misura), energie a settimana (−1…+2), spese fisse, crescita dei fan, aggressività dei rivali, conferma prima delle mosse che costano soldi o due energie.
    - Partite: i 3 slot del punto 15, ognuno col suo artista e la sua carriera (lo slot 1 tiene le chiavi storiche); esporta/importa la carriera come codice, cancella singolo slot, cancella tutto.
    - Lingua: italiano / inglese. L'interfaccia passa in inglese (menu, pannelli, azioni, cruscotto, lifestyle); le scene scritte restano in italiano.
    - Diritti: sezione dedicata, riga nel menu e meta nell'head — Anni di Fame è di La Fame Studio, tutti i diritti riservati.
      File nuovi: `js/impostazioni.js`, `js/lingua.js`, `js/impostazioni-ui.js`, `css/impostazioni.css`, `strumenti/build-artifact.py`.

---

## 42 · Il telefono è un iPhone vero, con LaFamegram

42. CONTESTO — leggi tutto, non serve che esplori.

Progetto: "Anni di Fame", simulatore di carriera rap nel browser, di La Fame Studio.
Team: io (Alessio, decido e testo), tu (Claude, costruisci), Carletto (committa sul repo).
Repo: github.com/Carlomadella/gioco-rap — branch di lavoro `beat-generi-e-salto-tempo`
(main è vecchio, ignoralo). Sono collaboratore del repo.

REGOLA FISSA: a ogni messaggio, PRIMA di rispondere, aggiornati dal repo su quel
branch. Carletto committa in continuazione e il lavoro va sempre rifatto sull'ultimo
stato. Clona in shallow (--depth 5), non scaricare la storia intera.

Struttura (dal commit af4d02c): il progetto è diviso in `frontend/` (index.html,
css/, js/, media/, strumenti/, dist/) e `backend/` (server.js, bot.js, database/).
Tecnologia: HTML + CSS + JS vanilla, un file per argomento, niente framework —
scelta voluta: il gioco deve poter diventare un file HTML solo tramite lo script
build in strumenti/. Non proporre React/Vue.
I punti di lavoro numerati stanno in `implementazioni.md` in radice: leggi solo la
coda del file, non tutto.

OBIETTIVO DI OGGI: l'interfaccia principale (la "plancia" da PC). Sta venendo bene
ma non abbastanza. Useremo tutta la sessione su questo e sullo sviluppo del gioco.

PRIMO LAVORO — IL TELEFONO NELLA SIDEBAR DI DESTRA (solo versione PC).

Com'è adesso: `<aside class="ptel">` in frontend/index.html (riga ~187) è una
cornice finta con dentro una colonna che scorre: messaggi del diario, poi una
griglia di app che NON aprono niente dentro al telefono (rimandano alle schede del
gioco), poi le notizie. Il contenuto lo scrive la funzione di render in
frontend/js/game/hub.js (array HUB_APP riga ~109, riempimento di #hb-tel riga ~402).
Stile in frontend/css/hub.css (classi .ptel* da riga 164).

Come lo voglio: un iPhone vero.
1. Schermata home: solo sfondo + griglia di icone app + dock in basso. Niente
   contenuto sciolto, niente liste appese sotto.
2. Barra di stato in alto realistica: ora del gioco, segnale, batteria, notch.
3. Ogni app si apre DENTRO al telefono, a schermo pieno nella cornice, con la sua
   interfaccia e il modo di tornare alla home (barra gesture in basso).
4. Animazione di apertura e chiusura: l'app si ingrandisce dall'icona.
5. Badge con il numero di novità sulle icone (messaggi non letti, obiettivi aperti…).
6. App da avere: Messaggi (il diario), Contatti, Notizie, Obiettivi, Inventario,
   Statistiche, Classifiche, Agenda, Impostazioni — più LAFAMEGRAM, il finto
   Instagram del gioco, che nel repo ancora NON c'è: oggi mettila come app con la
   sua schermata base, il resto lo sviluppiamo dopo.
7. Solo da PC (sopra 1180px). Sotto quella soglia la schermata resta identica a
   com'è: da telefono mi va già bene così.

Tecnica: crea file nuovi js/game/telefono.js e css/telefono.css invece di gonfiare
hub.js, e lascia in hub.js solo la chiamata. Regola generale del progetto: ogni cosa
dev'essere interattiva, e le schermate devono sembrare un videogioco vero
(riferimenti di qualità: Fortnite, Brawl Stars, Score Hero), non un pannello web.

COME LAVORIAMO — importante:
- Token: usali in modo indispensabile e valorizzali al massimo. Niente screenshot
  nei test, niente file riletti per intero se basta un pezzo, modifiche mirate e non
  riscritture, riassunti corti. Avvisami quando i token stanno per finire.
- Prima di costruire, fammi 2-3 domande corte solo se servono davvero. Non
  spiegazioni lunghe: è il mio primo gioco, spiegami le scelte in modo semplice.
- Consegna: file HTML giocabile che apro e provo, più lo zip dei file cambiati per
  Carletto. Poi lo commentiamo e correggiamo.

NON TOCCARE: la scena beatmaker («cerca un beat»), che sta facendo un'altra persona
in parallelo.

   **FATTO in parte (01/09/2026)** — il telefono, solo da PC (`window.innerWidth
   >= 1180`; sotto resta la vecchia colonna, invariata byte per byte).
   File nuovi: `frontend/js/game/telefono.js`, `frontend/css/telefono.css`.
   hub.js adesso chiama solo `renderTelefono()`; HUB_APP e la vecchia griglia
   (`HUB_APP_VECCHIO`) si sono spostati lì. `.ptel*` si è spostato da hub.css a
   telefono.css per intero.
   - **Home**: barra di stato con ora, segnale, notch e **batteria nuova**
     (mancava); tre **widget veri** (non finti) — LaFamegram con il post più
     hype, Classifica con posizione e freccia ▲▼, Messaggi con l'ultimo
     diario; griglia di 6 icone; **dock** con Messaggi, Contatti, LaFamegram,
     Classifiche (scelta mia, sugli ultimi due: Classifiche invece di Agenda
     perché lì c'è appena finito il multiplayer vero, punti 30/35/37).
   - **10 app**, tutte a schermo intero dentro alla cornice, con dati veri
     (non anteprime): Messaggi (diario intero), Contatti (la rete di
     `G.gente`, grado e ruolo, tap va alla Sala), Notizie, Obiettivi (con
     ricompensa o «fatto»), Inventario (bars/beat/pezzi/attrezzatura a
     linguette), Statistiche (gli stessi numeri della testata e dei
     dettagli), Classifiche (la stessa top 10 della scheda, con «sei Nº» e
     la freccia), Agenda (gli eventi di stasera + le mosse disponibili),
     Impostazioni (audio/difficoltà/lingua rapidi + bottone al pannello
     vero), **LaFamegram** (non esisteva: oggi è un feed con post veri,
     presi dal diario e dalle notizie, non finti a caso).
   - **Apertura/chiusura**: l'app si apre ingrandendosi dal punto esatto
     dell'icona toccata (calcolato al click, non un centro fisso), si chiude
     con la barra in basso, con Esc, o cambiando finestra sotto i 1180px.
   - **Cosa NON ho rifatto in miniatura**: le azioni pesanti (firmare un
     contratto, un colpo, una sessione in studio) restano nella scheda vera
     del gioco — dentro al telefono le vedi e le apri, ma la scena/il calcolo
     stanno dove sono sempre stati. Rifarle da zero dentro ai 326px del
     telefono è un lavoro a sé, che vale la pena solo dopo aver visto se
     questa prima versione regge.
   - **Verificato**: `npm run prova` (12/12) e `npm run build` puliti dopo il
     cambio; non ho potuto aprirlo in un browser vero in questa sessione
     (l'estensione Chrome non era connessa) — prima di darlo per buono va
     provato a mano.
   - **`prompt-app-telefono.md`** (root, come richiesto): 10 prompt per
     ChatGPT, uno per ogni app del telefono, per farsi disegnare il
     concept UI di ciascuna schermata — stessa logica di
     `prompt-ambientazioni.md` ma per interfacce, non ambientazioni.

---

## Il telefono come telefono (la richiesta di partenza)

il telefono deve sembrare un vero e proprio telefono : Quindi come un iphone esattamente nel menù principale con solo le app cliccabili : Aggiungi inoltre LAFAMEGRAM, app dove si svilupperà molto la 'vita del gioco'.

---

## 47 · Il negozio dei vestiti

47. Quando clicco su vestiti nella sidebar di sinistra, mi deve aprire una schermata di un negozio inoltre il negozio deve essere sbloccato già dalla città iniziale con limiti

   **FATTO (01/09/2026).** File nuovi: `frontend/js/game/negozio.js`,
   `frontend/css/negozio.css`. La linguetta «Vestiti» della plancia adesso apre
   il guardaroba invece del creatore: griglia degli undici capi di `FITS`
   (`js/creator/data.js`), ognuno con la sua anteprima vera (lo stesso
   ritratto ritagliato sul busto che usa il creatore), un prezzo da 60 a
   560 €, e un bottone «Compra» o «Indossa». Il capo con cui hai creato il
   personaggio resta sempre tuo gratis. Sbloccato da subito, nessuna fase:
   è un negozio a parte da quello (chiuso) della mappa, che resta per
   l'attrezzatura da studio. `npm run prova` (12/12) e `npm run build`
   puliti; non provato in un browser vero in questa sessione.

---

## 50 · Via i popup dalle card: scene vere

50. Leviamo tutti questi popup dalle card. Quando clicchiamo su una card deve aprirse una vera e propria pagina. COSì INIZIERà A SEMBRARE UN GIOCO.

---

## 52 · LaFamegram con post veri, caricati dai giocatori

52. la fameGram deve avere veri e propri post generati e caricati dagli utenti, deve essere un motore vivo e costantemente in movimento perchè molto del gameplay passa lì. 

   **FATTO in parte (01/09/2026)** — due cose diverse, tenute insieme.
   **Generati da soli**: `frontend/js/game/telefono.js` adesso chiama
   davvero `GET /api/feed` (Carletto l'aveva già scritto lato server,
   proprio nella forma che uso io — «si incastra col telefono che ha
   appena fatto Alessio», dice il suo commit): sorpassi veri in classifica,
   non frasi a caso. Se il server non risponde, o risponde vuoto (un
   server appena nato, senza rivalità dichiarate, non ha ancora niente da
   raccontare — l'ho provato in locale ed è proprio così), si torna al
   diario, stessa forma, senza cuciture viste. Un giro ogni due minuti da
   solo, più uno ogni volta che riapri l'app: **vivo** vuol dire questo.
   **Caricati dagli utenti**: adesso c'è davvero una casella «a cosa stai
   pensando» in cima al feed — scrivi, premi Pubblica, il post tuo esce
   subito in testa, con un cuore che tiene conto dell'hype. Provato in
   Chrome: scritto, pubblicato, apparso all'istante.
   **In parte** perché il post che scrivi oggi resta **sul tuo
   dispositivo**: non c'è ancora un `POST /api/post` che lo mandi al
   server, quindi non lo vede nessun altro giocatore — è un lavoro da
   backend che non ho, ce l'ho scritto qui apposta perché Carletto lo
   veda. Non sparisce mai dal tuo feed, però, qualunque cosa risponda il
   server.

---

## 53 · Il feed di LaFamegram si scorre come quello vero

53. Su lafamegram puoi vedere il feed proprio come instagram nella vita reale, scorrendo

   **FATTO (01/09/2026)** — lo era già di fatto (`.tscreenbody` scorre da
   solo), l'ho solo reso vero anche nell'ordine: prima il feed teneva i
   post ordinati per «più cuori», adesso è cronologico come un feed vero
   — tu in cima, poi il resto nell'ordine in cui è arrivato. Il post «più
   hype» per il widget della home si cerca a parte (`telPostTop()`), non
   è più per forza il primo che scorri.

---
