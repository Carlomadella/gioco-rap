# L'interfaccia e il telefono

Come si vede e come si tocca: schermate, navigazione, il telefono nella plancia,
il negozio, le impostazioni.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 4 · La pagina di landing

4. Nella pagina di landing manca l'atavar del profilo nel cerchio in alto a destra, in alto a sinistra deve esserci il logo con scritto "Anni di fame", inoltre migliora di molto la landing page

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `d40b20c` del 30/08/2026 — «feat: landing page rifatta, marchio e avatar nella barra (punto 4)».

   **RIFATTA DA CAPO (01/09/2026)** — sul concept `anni-di-fame-menu-2026`, con
   **lo stesso metodo della mappa della città: la foto è lo sfondo**, e sopra ci
   stanno solo testo e comandi (`frontend/css/landing.css`).
   - **Sei scene** che si danno il cambio da sole ogni otto secondi: provincia,
     garage, specchio, info point, negozio di dischi, cabina telefonica. Passando
     sopra a una voce del menu si richiama la sua scena, e le frecce ← → le
     scorrono a mano. Le foto stavano dentro al concept come base64 da 2 MB
     l'una: quattro erano già nel repo, le altre due sono uscite da lì e
     salvate in JPEG (200 KB invece di 2 MB).
   - **Quello che si legge viene dalla partita vera**, non dal concept: in alto
     a destra a che punto sei («Nessuna carriera iniziata» / «Artista pronto» /
     «Carriera in corso · anno 1, settimana 12»), il bottone grosso che diventa
     «Riprendi la carriera» con settimana e fan, e in basso a sinistra il tuo
     ritratto col nome, la città, il genere e il vestito.
   - **Il menu in basso porta a cose che esistono**: Inizia la carriera, Il tuo
     artista, Come si gioca, Classifiche (entra in partita sulla classifica —
     se non c'è una carriera lo dice invece di aprire una schermata finta),
     Impostazioni, La Fame Studio. Al posto di «Contatti» del concept, che da
     noi non esiste ancora.
   - La barra in alto sulla landing diventa trasparente e si mette in fila col
     concept; dentro al gioco resta com'era.
   - Provato in Chrome accanto al concept: stessa aria, stessi ingombri, e le
     scene che cambiano davvero. `npm run prova` (12/12) e `npm run build` puliti.

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

   **«Se clicchi Vestiti ti escono anche vestiti acquistabile. NO!» (03/09/2026)
   — separato guardaroba e negozio, che era il bug: erano la stessa schermata.**
   La linguetta «Vestiti» apriva `#negozio` con dentro sia i capi già tuoi
   (Indossa) sia quelli da comprare (Compra) — un armadio travestito da
   negozio. Adesso:
   - la linguetta «Vestiti» apre il **guardaroba** (`apriArmadio()`, stesso
     overlay `#negozio`): solo equip, solo quello che hai già. Un capo non
     posseduto non compare proprio — niente più «Compra» lì dentro.
   - i capi si comprano solo al **Catalogo → Abbigliamento** (`#g-fit`, nuova
     sotto-linguetta accanto ad «Attrezzatura», dentro alla schermata di
     gioco): undici capi di `FITS`, stesso prezzo di sempre, «Compra» o
     «Indossa». Ci si arriva dal cartello Shop sulla mappa, come per
     l'attrezzatura — o da un evento in game, in futuro.
   `frontend/js/game/negozio.js` riscritto: `renderArmadio()` (solo
   posseduti) e `renderAbbigliamento()` (tutti, popolata da `renderGioco()`
   in `ui.js`) condividono la stessa `ngCard()`, invece di una funzione sola
   che mischiava i due casi.
   **Bug trovato mentre verificavo il cambio, non introdotto da lui:** il
   capo di partenza non veniva mai scritto in `G.vestiti` — «posseduto» era
   solo «è quello che indosso adesso». Bastava indossarne un altro e quello
   iniziale spariva dal guardaroba (nel vecchio negozio-unico tornava
   comprabile a pagamento, il che tradiva la scritta «resta sempre tuo
   gratis»; nel guardaroba nuovo, senza «Compra», sarebbe sparito e basta).
   Corretto in `ngEquipaggia()`: il capo che stai lasciando entra in
   `G.vestiti` prima di indossarne un altro, così resta tuo per sempre come
   promesso.
   Verificato in Chrome headless (dev server locale): comprato un capo dal
   Catalogo, il guardaroba lo mostra; cambiato capo, quello di partenza
   resta nel guardaroba invece di sparire. Versioni di cache alzate per
   tutti i file toccati (`negozio.js`, `hub.js`, `ui.js`, `orari.js` +1) —
   punto 6 insegna a non lasciarle indietro.

---

## 50 · Via i popup dalle card: scene vere

50. Leviamo tutti questi popup dalle card. Quando clicchiamo su una card deve aprirse una vera e propria pagina. COSì INIZIERà A SEMBRARE UN GIOCO.

   **FATTO in parte (01/09/2026)** — sette mosse che finivano dritte in un
   toast (**mixa, pubblica, promo, live, turno, stacca la spina,
   palestra**) adesso aprono una pagina vera a schermo intero: la scenetta
   che la card aveva già in miniatura (`frontend/js/game/scene-art.js`,
   `SC`), grande, con sopra il nome, la descrizione e l'esito scritto —
   non due righe che volano via in due secondi. Chiudi con «Continua»,
   con ✕, o con Esc, come tutte le altre finestre del gioco (punto 5).
   Markup e stile nuovi (`#scena` in `index.html`, `.scena`/`.scwrap` in
   `effects.css`), la logica in `ui.js` (`SCENA_PIENA`, `mostraScena()`).
   Aggiunta anche l'illustrazione della palestra, che non l'aveva.
   Provato in Chrome: «Palestra» apre la pagina vera, mostra benessere e
   presenza guadagnati, chiude e torna al gioco con i numeri giusti.
   **In parte** perché **scrivi, freestyle in piazza e cerca un beat**
   restano com'erano — i primi due hanno già una scena vera loro (il
   foglio, la piazza), il terzo aspetta ancora la sua (punto 8, ci sta
   lavorando un'altra persona in parallelo, non l'ho toccato); **registra**
   e **cerca lavoro** tengono la loro finestra di scelta (il titolo del
   pezzo, i due colloqui) invece della scena, perché lì il popup *è* la
   decisione, non un risultato da leggere. `npm run prova` (12/12) pulito.

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

---

## Responsività di tutto il gioco — **cominciata, da finire domani**

**FATTO in parte (01/09/2026).** Il gioco adesso regge dal telefono al monitor
grande. Provato dentro a un riquadro della misura voluta (così le regole
rispondono davvero) a **360, 390, 430, 768, 1024, 1280, 1366, 1440, 1536, 1920
e 2560 px** di larghezza.

Cosa è stato sistemato:
- **La plancia si impila sotto i 900 px**: fascia in alto con i numeri su due
  colonne, poi la città a tutta larghezza, poi il profilo, poi le linguette e
  il suggerimento. La pagina scorre come una pagina normale.
- **La fascia in alto si stringe per gradi** invece di rompersi: prima i
  respiri e le barrette, poi sparisce l'ora, poi il benessere (che sta anche
  nel profilo).
- **Sotto i 1180 px il telefono si toglie** e restano profilo e città.
- **Il menu della landing** non è più un nastro da trascinare largo 1120 px:
  diventa una griglia a tre colonne sotto i 900, a due sotto i 560. Tutte e
  sei le voci sempre visibili.
- **Le linguette della partita** (Settimana, Catalogo, Classifica…) si
  stringono e ci stanno tutte a 390 px, invece di uscire dallo schermo.
- **Il telefono non allarga più la sua colonna**: la riga con «Classifica» e
  «Messaggi» aveva un testo che non va a capo e si portava fuori tutta la
  colonna a 1366 e 1440 px.

**FINITA (01/09/2026, secondo giro).** I quattro punti che erano rimasti
aperti, uno per uno.

1. **Il creatore a 768 px: non c'era niente da aggiustare.** Il `<rect> che
   sembrava uscire di venti pixel era un falso allarme del mio metodo di
   misura: contavo come «fuori» ogni elemento che sborda dal documento, anche
   quando un antenato con `overflow:hidden` lo taglia già — e gli sfondi SVG
   dentro alle otto card e dentro al palco dell'anteprima sono fatti apposta
   così. Corretto il metro (adesso salta chi è già tagliato e chi sta fuori
   di proposito, come il diario chiuso), la schermata risulta pulita a 360,
   390, 430, 768, 1024 e 1280.

2. **Le altre schermate, provate una per una** a 360, 390, 430 e 768: foglio
   di scrittura, La Sala, il negozio dei vestiti, il diario, la modale degli
   eventi, le Impostazioni (tutte e sei le linguette) e la piazza. Zero
   sbordature in orizzontale, zero contenuto tagliato senza modo di
   raggiungerlo. Da 360 a 2560 px la pagina non scorre mai di lato.

3. **La barra del browser sul telefono.** Sotto i 900 px il palco non è più
   inchiodato allo schermo (`position:fixed`): torna a essere un pezzo di
   pagina, con `min-height:100svh`. Serve a due cose che si vedono solo su un
   telefono vero — scorrendo *la pagina* il browser si tira su la sua barra e
   ti restituisce 60-90 px di altezza (dentro a un riquadro che scorre per
   conto suo non lo fa mai), e lo scorrimento è quello di sistema, con la sua
   inerzia. `100svh` e non `100vh` perché è la misura *piccola*, quella con le
   barre visibili: la plancia entra dal primo momento.

4. **Le aree da toccare a 44 punti (punto 36): fatte**, in un foglio nuovo,
   `css/tocco.css`, caricato per ultimo. Vale dove si tocca davvero
   (`pointer:coarse`) e sotto i 900 px; col mouse non cambia niente. Chi può
   crescere cresce (`min-height`), chi sta incollato a un disegno — i cartelli
   sulla mappa, le due frecce del giro guidato, gli interruttori, la crocetta
   che toglie una barra — tiene la sua misura e si prende un `::after`
   invisibile largo 44 che raccoglie il tocco al posto suo. Prima erano
   piccoli: le otto croci per chiudere (34-38), il cerchio dell'avatar (36),
   le frecce della mappa (18×13), i bottoni del negozio (32), le manopole
   delle Impostazioni (16 di altezza), le righe del foglio (37) e, appena
   arrivata da Carletto, tutta la Strada (`.stx` 34, `.stbtn` e `.stmini` 27-32,
   `.stmolla` 39). Adesso a 360, 390, 430 e 768 px **non resta un solo
   bersaglio sotto i 44**, la Strada e la Chat comprese.
   Attenzione a una trappola in cui sono cascato e che è meglio non ripetere:
   `min-width` su un elemento dentro a un `flex` **abbassa** il suo minimo
   automatico (che di suo è la misura del contenuto) e il testo si taglia — le
   linguette delle Impostazioni sono diventate «Audi». Dove serve larghezza si
   allarga l'imbottitura, non il minimo.

**E una cosa che non era in lista: la mappa non si leggeva sul telefono.**
I cartelli — Studio, Beat Maker, Attività criminali — sono disegnati *dentro*
alla foto, quindi rimpicciolivano con lei: a 375 px erano quattro pixel di
testo. Adesso sotto i 900 la foto tiene almeno 620 px (`width:max(100%,620px)`)
e la città si sposta col dito, come una cartina vera; sopra i 620 non cambia
niente. Le frecce «scorri per esplorare» adesso portano in mezzo il luogo che
illuminano (`scrollIntoView`), se no indicavano un cartello fuori dalla
finestra. Nota per chi ci torna: `behavior:"smooth"` su quel contenitore **non
scorre affatto**, provato; senza, va sempre, e il verso lo decide comunque il
CSS.
Sotto i 900 lo sfondo sfocato del punto 62 si spegne: la foto è più larga del
riquadro e lo copre tutto, quindi non si vedrebbe comunque — e con `inset:-40px`
dentro a un riquadro che scorre si portava dietro quaranta pixel di vuoto da
scorrere. È anche una sfocatura da 46 px in meno da disegnare sul telefono.


## 55 · Via la conferma «sei sicuro» per l'energia

55. Non chiedere le conferme per l'energia ogni volta che si vuole cliccare sulla card. Toglierlo a tutte.

    **FATTO (01/09/2026)** — la conferma (`ui.js`) usciva quando la mossa costava soldi *o* almeno 2
    energie: `SET.gioco.conferme && (c > 0 || en2 >= 2)`. Era una soglia pensata per quando l'energia
    andava da 1 a 3 a mossa (prima dei punti 39-41); dopo il riscalo a 10-50, `en2 >= 2` era vera per
    quasi ogni azione — la conferma usciva sempre, esattamente il problema segnalato. Tolta la metà
    sull'energia: resta solo `SET.gioco.conferme && c > 0`, quindi la conferma si vede ancora — giustamente
    — dove si spendono soldi veri (es. Palestra, 12 €), non per il solo consumo di energia. Aggiornata
    anche la descrizione della voce nelle Impostazioni (`impostazioni-ui.js`).
    Provato in Chrome: Palestra (costa soldi) chiede ancora conferma, le mosse solo-energia no.

---

## 58 · Transizioni diverse per ogni scena

58. Sarebbe bello avere una transizione quando clicchiamo il pulsante ed entriamo nelle scene delle
    varie card. Non tutte uguali.

    **FATTO (01/09/2026)** — le sette scene a pagina piena del punto 50 (`SCENA_PIENA` in `ui.js`:
    mixa, pubblica, promo, live, turno, stacca, palestra) usavano tutte la stessa keyframe generica
    (`rIn`, uno scale+translateY). Ognuna adesso ha un'entrata sua, scelta in base a cosa rappresenta
    (`css/effects.css`, selettore `.scwrap[data-anim="..."]`):
    - **mixa** — scivola da destra con un piccolo skew (il pan della consolle)
    - **pubblica** — esplode dal centro con un lampo di luce (il momento del rilascio)
    - **promo** — un flip 3D leggero (la clip che si affaccia)
    - **live** — sale da sotto come si alza il sipario
    - **turno** — scatto secco da sinistra, meccanico (il cartellino che timbra)
    - **stacca** — dissolvenza lenta con un filo di blur (si stacca la spina, con calma)
    - **palestra** — rimbalza dentro con un piccolo overshoot (energia, non fatica)
    `mostraScena()` sceglie l'animazione da `a.id` e forza il riavvio della keyframe (serve a farla
    ripartire anche riaprendo di fila la stessa scena, altrimenti il browser la considera già finita).
    Provato in Chrome: `stacca` poi `palestra` poi `turno` in sequenza, ognuna con l'animazione giusta
    (`getComputedStyle(...).animationName`), e il bottone «Continua» funziona ancora dopo ogni scena.

---

## 63 · Via i doppioni dalla sidebar del profilo

63. I parametri di Soldi, benessere, Fama, Hype, Network e benessere si trovano sia sulla barra in
    alto sia sulla side bar del profilo. Togliamoli per ora dalla side bar del profilo e piuttosto
    nella side ci aggiungiamo cose come Lifestyle, e magari qualche altro parametro, tipo banalmente
    Livello sospetto per quanto riguarda se fai la carriera criminale.

    **FATTO (01/09/2026)** — la sidebar (`vistaProfilo()`, `hub.js`) ripeteva sei righe già scritte
    nella fascia in alto (soldi, energia, fama, hype, network, benessere): tolte tutte tranne
    Lucidità, che lì non c'è. Al loro posto due righe nuove: **Lifestyle** (`lifestyleRiepilogo()`,
    nuova in `lifestyle.js` — quante delle cinque categorie hai alzato dal livello base, e di quanto
    in media) e **Livello sospetto**, che è `G.strada.heat` del punto 21 — prima di quel punto la
    riga sarebbe stata vuota, adesso ha un senso vero.
    Provato in Chrome: con `G.life.auto` a un livello sopra zero e `G.strada.heat` a 42, la sidebar
    mostra esattamente «Lucidità», «Lifestyle: 1 su 5 curati» e «Livello sospetto: 42» — niente più
    doppioni con la fascia in alto, verificata invariata (energia, soldi, hype, fama, network,
    benessere restano lì).

---

## 64 · Il profilo cliccabile dal menù, in stile character creator

64. Dalla schermata del menù iniziale 02. Il profilo vorrei che fosse cliccabile e che il menù per
    modificare il tuo profilo fosse in stile NBA 2K27 per quanto riguarda la personalizzazione del
    proprio personaggio.

    **Risulta già fatto**, prima di questa sessione: l'avatar in alto a destra nella barra del menù
    (`#nav-avatar`, punto 4) chiama già `goto("profile")`, che apre `#s-profile` — una galleria di
    otto avatar di partenza più un vero e proprio banco di personalizzazione: anteprima grande col
    personaggio (volto o figura intera), altezza/peso/corporatura/vestito a lato, e una barra di
    categorie (capelli, cappelli, occhi, accessori, vestiti, tatuaggi) con un pannello per ognuna —
    lo schema di un character creator vero, non una scheda di testo.
    Provato in Chrome: click su `#nav-avatar` dal menù, si apre la galleria con l'anteprima e i
    pannelli, esattamente come chiesto. Non c'è altro da costruire per questo punto.

---

## 66 · «Chat»: prima solo mamma e il migliore amico, poi il resto arriva con la fama

66. Nelle app potremmo implementare anche Whatsapp, ovviamente non possiamo dargli lo stesso nome ma
    sarebbe bello che all'inizio ti contatta solamente tua madre e il tuo migliore amico, poi più hai
    fama più gente cerca di interagire in bene o a volte anche in male con te.

    **FATTO (01/09/2026)** — nuova app del telefono, «Chat» (`frontend/js/game/chat.js`): non è il
    diario degli eventi (quello resta «Messaggi»), sono conversazioni vere con soglie di sblocco.
    - **Mamma** e **Dario** (il migliore amico) scrivono da subito, con frasi pescate a caso ogni
      settimana e due risposte ciascuno che danno un piccolo effetto (mamma: +benessere; Dario:
      +rete se lo inviti in studio).
    - **Un fan** si sblocca a 80 fan, **un hater** a 250: rispondere al fan costa niente e dà +hype,
      rispondere all'hater è un tiro di dado (a volte +hype, a volte -benessere) — oppure lo **blocchi**
      e non scrive più per sei settimane, oppure lo ignori.
    - Ogni contatto ha il suo badge di non letti sull'icona dell'app e sulla singola conversazione;
      aprire una chat la segna letta.
    `chatSettimana()` (chiamata da `advanceWeek()`, `sim.js`) decide ogni settimana chi scrive.
    Provato in Chrome: con pochi fan scrivono solo mamma e Dario; a 300 fan si sblocca anche l'hater,
    rispondere con «Blocca» ferma davvero i suoi messaggi per le settimane dichiarate (verificato
    facendo girare `chatSettimana()` per tutta la durata del blocco: zero messaggi nuovi).

---

---

## Controllo di tutto il codice — due nomi di classe che si pestavano i piedi

**FATTO (01/09/2026).** Passata di controllo su CSS e JS, cercando in
particolare le classi con lo stesso nome dichiarate in due fogli diversi: il
foglio caricato dopo vince, e il pezzo dell'altro si rompe **in silenzio**.
Ne sono uscite due, tutte e due vere.

1. **La folla del freestyle non si vedeva più.** `.scena` era due cose: il
   riquadro disegnato dentro alla piazza (`overlays.css`, `#p-scena`) e la
   scena a pagina piena del punto 50 (`effects.css`, `#scena`). `effects.css`
   si carica dopo, e il suo `display:none` (giusto: quella scena si apre
   quando serve) spegneva anche il riquadro della piazza. Risultato: si
   apriva il freestyle e la città di notte, il rapper sotto il lampione, la
   gente che si ferma — **non c'era**. Il gioco funzionava lo stesso, ed è
   proprio per questo che non se n'era accorto nessuno. La scena a pagina
   piena adesso si chiama `.scenapiena`, come la `SCENA_PIENA` di `ui.js`.

2. **Le targhette del catalogo uscivano verdi e maiuscole.** `.tag` era del
   gioco (`game.css`: 11 px, e accesa gialla) e del telefono
   (`telefono.css`: 9,5 px maiuscole, e accesa verde). Vinceva il telefono,
   che si carica dopo: «grezzo», «pronto», «fuori», «tuo» prendevano il
   vestito sbagliato. Quella del telefono adesso è `.ttag`, con la t davanti
   come tutto il resto di quel foglio (`tbtn`, `tnote`, `tsub`…) — era già la
   convenzione, era solo saltata una volta.

**Codice tolto perché non faceva più niente:**
- `hubScala()` in `js/game/hub.js`: una funzione vuota, rimasta da quando la
  plancia si rimpiccioliva a mano. Il commento diceva «la chiamano in tre
  punti»; i punti erano due, ed erano lei e la sua riga di export.
- Il blocco `.mhero` e `.mlist` in `css/shell.css` (più le due righe compatte
  in `impostazioni.css` e `.land-chip .mport` in `landing.css`): erano il
  menu di prima. Adesso `mhero` è un **id** sulla landing, non una classe,
  quindi quelle regole non si applicavano più a niente.
- `grid-column:1/-1` su `.mrow.big`: era la posizione dentro alla griglia
  `.mlist`, che non c'è più.

Il resto è pulito: nessuna funzione dichiarata e mai chiamata, nessun `id`
ripetuto in `index.html`, nessun `console.log` o `TODO` rimasto, e `npm run
prova` a 12 su 12.

---

## Transizioni quando una card apre una pagina

Da smistare, punto 1 (01/09/2026): "Prepareremo delle transiton per quando vai a cliccare sulle
card per entrare nelle varie pagine. Non mi piace che clicchi e hai la pagina così di botto."

**FATTO.** Sei pannelli aprivano di scatto, senza nessun passaggio: la modale (`#modal .sheet2`),
il negozio (`.ngwrap`), La Sala (`.powrap`), la piazza (`.pwrap`), il foglio (`.wwrap`), la Strada
(`.stwrap`). Gli ho dato la stessa entrata `rIn` già usata dal rapporto di settimana e dalle scene
a pagina piena (punto 50/58) — la stessa famiglia visiva, non un'animazione nuova di zecca. Anche
il passaggio fra le schermate intere (menù, mappa, gioco, profilo — `goto()` in `js/creator/nav.js`)
adesso ha una dissolvenza (`screenIn`, `css/shell.css`): **solo opacità, mai un transform**, perché
la mappa (`.palco`) usa `position:fixed` al suo interno, e un transform sull'antenato gli avrebbe
cambiato il punto di riferimento a metà animazione, con un salto visibile per una frazione di
secondo. Aggiunto anche un piccolo trucco di reflow (`goto()`, `mostraScena()` già lo faceva) per
essere sicuri che l'animazione riparta ogni volta, non solo la prima.
Provato in Chrome: aperti La Sala, il negozio e un incontro per strada, tutti con l'entrata giusta
e senza artefatti nella mappa; passato da mappa a profilo e ritorno, nessun salto di layout.

---

## Le scene dei fan, tante e difficili da ripescare

Da smistare, punto 2 (01/09/2026): "La scena dei fan mi sembra che ne hai fatte si e no 3 diverse.
Ne voglio almeno 150 differenti e con una rarità molto alta di ritrovare nel breve periodo una
stessa scena."

**FATTO** (`js/game/strada.js`). Vero: «fan gentile» e «fan maleducato» erano una frase fissa a
testa, con solo il nome a cambiare. Adesso un luogo (12: il bar sotto casa, la fila alla posta, la
metro, il mercato del sabato...) e un comportamento (13 per il fan gentile, 13 per il maleducato)
si combinano — **156 combinazioni per tipo**, oltre le 150 chieste — e una piccola cronologia
(`G.strFanHist`, salvata nella partita) tiene le ultime 30 combinazioni viste per tipo: finché non
ne sono passate altre 29, la stessa non ripesca. Non sono 156 scene scritte a mano: sono 12×13
pezzi che si scambiano di posto, ma il risultato è che nessuno vede la stessa identica frase due
volte a distanza ravvicinata.
Provato in Chrome: 30 incontri "fan gentile" di fila, 30 combinazioni tutte diverse; stessa cosa
per il "fan maleducato". La scelta pesata e le condizioni di sblocco (`INCONTRI`, `provaIncontro()`)
non sono cambiate — solo il contenuto di ogni singolo incontro.

---

## La chat del telefono non va piu' in loop

Da smistare, punto 3 (01/09/2026): "Nell'app chat sul telefono le conversazioni sono davvero
monotone e soprattutto vanno subito in loop. Crea una cosa MOOOOOOOLTO interattiva."

**FATTO.** La chat è rifatta da capo (`frontend/js/game/chat.js`). Prima, tutto sommato,
non era una chat: era una casella che si riempiva.

**Perché andava in loop, in concreto.** Ogni contatto aveva tre o quattro frasi fisse,
pescate a caso **senza nessuna memoria**: dopo due settimane le avevi viste tutte, e spesso
due volte di fila. E le risposte erano attaccate al *contatto*, non al messaggio — mamma
poteva chiederti qualunque cosa, tu potevi solo dire «tranquilla, tutto ok» oppure «sto
correndo, ti chiamo dopo». Per sempre. Poi finiva lì: una battuta, una risposta, una
controrisposta, chiuso.

**Le quattro cose che ho cambiato**, in ordine di quanto si sentono giocando:

1. **Parlano di quello che è successo davvero.** Uno spunto non è una frase, è una frase
   *con la sua condizione*: mamma tira fuori i soldi solo se sei a secco, il pezzo solo se
   ne è uscito uno — e lo chiama per nome — e «sono venuti dei signori a chiedere di te»
   solo se hai preso calore sulla Strada. Con cento euro in tasca e con diecimila non ti
   scrive la stessa cosa.
2. **Le risposte stanno dentro al messaggio.** Ogni spunto si porta le sue, e cambiano con
   lui.
3. **Si va avanti a botta e risposta**: una risposta può aprirne altre, quindi una
   conversazione è di due o tre giri invece che di uno.
4. **Puoi scrivere tu per primo.** È la cosa che più di tutte la fa sembrare una chat e non
   una casella della posta: quando non c'è niente in sospeso, in fondo compare «scrivi tu»,
   e le aperture cambiano con quello che sta succedendo.

**Più gente, e sbloccata da quello che fai** e non solo dai fan: erano quattro (mamma, il
migliore amico, un fan, un hater), adesso sono otto — c'è **Kiro** che fa i beat (arriva
appena cominci a comprarne), **Vale** che organizza serate (quando sai stare su un palco),
la **redazione** di una rivista (quando sei qualcuno), e **tuo cugino**, che si fa vivo
esattamente quando hai due soldi. In tutto: **38 spunti, 133 risposte scrivibili, fino a
tre giri di conversazione**, e ognuno degli otto ha almeno quattro cose diverse da dire.
Scrivono anche **in mezzo alla settimana** e non solo al cambio, se no si sente che è finta.

**Come ho tolto il loop davvero.** Non basta pescare a caso meglio: ognuno si ricorda cosa
ha già detto, e quando ha finito le cose sensate da dire **sta zitto** per qualche
settimana invece di ricominciare il giro. Il silenzio è più credibile della ripetizione,
ed è la differenza fra una persona e un distributore di frasi.

**Provato facendo giocare il codice**, perché un difetto così non lo prende un controllo
di sintassi: ho fatto vivere la chat per **160 settimane** di carriera, rispondendo a caso
come farebbe uno che gioca senza pensarci troppo. Prima: fino a **otto volte di fila** lo
stesso messaggio dallo stesso contatto. Adesso: **zero ripetizioni di fila** su 303
messaggi, otto contatti che si fanno vivi, e fra i 23 e i 61 testi diversi a testa. Il
tutto è dentro a `npm run prova` del frontend, quindi non può tornare in loop di nascosto.

**Una trappola in cui sono cascato scrivendola**, scritta anche in cima al file perché non
succeda di nuovo: `G` finisce in `localStorage` come JSON, quindi **nello stato non ci
possono stare funzioni**. Alla prima stesura il ramo della conversazione lo restituiva
`run()`; funzionava benissimo finché non ricaricavi la pagina, e a quel punto chi aveva una
conversazione a metà si ritrovava dei bottoni che non facevano niente. Adesso nello stato
c'è solo *la strada* (`{sp, via:[indici]}`) e l'albero si ripercorre da lì. C'è una prova
apposta che apre tutte e ventisei le conversazioni a più giri, le fa passare per un giro di
JSON e controlla che le opzioni si ritrovino.

**Non provata a vista in Chrome**: il browser era chiuso. Tutto quello che c'è scritto qui
sopra è misurato facendo girare il codice, non guardandolo.

---

## Scambiarsi il numero con fonici e beatmaker

Da smistare, punto 4 (01/09/2026): "Metti l'opzione di potersi scambiare i numeri di telefono
con i fonici e i beatmaker, una volta scambiati appare il contatto tra le chat"

**FATTO.** A La Sala, sulla scheda di un beatmaker o di un fonico, c'è un bottone nuovo —
**«Scambiatevi il numero»** — e da quel momento quella persona sta nelle tue chat, sul
telefono, insieme a mamma e a Dario.

**Serve almeno un contatto** (`rel >= 1`) e costa 4 di energia. Il numero a uno appena visto
non si dà, e chiederlo è un gesto piccolo ma è un gesto: quattro punti sono il prezzo di
essersi fermati a parlare due minuti in più.

**Solo chi lavora sui pezzi.** Beatmaker e fonici, come chiedeva il punto — e c'è un motivo
che regge anche a raccontarlo: sono quelli che poi ti scrivono **per lavoro**. A un rapper
un feat lo proponi guardandolo in faccia, a un giornalista un'intervista la rilasci: non è
la stessa cosa. Il mestiere si controlla in due posti, sul bottone e su chi entra in
rubrica (`CHAT_MESTIERI` in `chat.js`), perché sono due decisioni diverse e la seconda deve
reggere da sola.

**Non sono contatti finti.** Sono le persone di `G.gente` — quelle che hai incontrato, con
il loro nome, il loro mestiere, la loro faccia e il rapporto che ci hai costruito. Nella
rubrica compaiono come **«Bit · Beatmaker»**, **«Sara · Fonico»**, e se uno lascia il giro
(`p.via`) sparisce anche dalle chat.

**Si presentano da soli** appena avete il numero, se no apri una chat vuota — che è peggio
che non averla, e non ti dice nemmeno che ha funzionato.

**E servono a qualcosa.** Non sono decorazione:
- il **beatmaker** ti manda beat veri, che finiscono **davvero nel catalogo** col suo nome
  sopra e già scontati secondo quanto vi conoscete (`chatMandaBeat`), e ti propone sessioni
  in sala; se sei a corto di soldi te ne offre uno da pagare quando esce;
- il **fonico** ti dice la verità sull'ultimo pezzo uscito («la voce sta troppo dentro, si
  perde una parola su tre nel ritornello»), ti dà lucidità, ti consiglia gli attrezzi
  quando cominci ad avere due soldi;
- **parlare in chat avvicina**, con gli stessi punti e la stessa soglia di quando vi parlate
  di persona (`chatAvvicina` rifà il conto di `poRispondi`). Quindi le due cose si tengono:
  al telefono cresci di rapporto, e il rapporto ti sblocca le azioni in sala.

**Il beatmaker finto non c'è più.** Nel giro precedente avevo inventato un «Kiro (beat)»
sempre in rubrica: le battute erano buone, ma la sua presenza non se l'era guadagnata
nessuno — avevi in tasca il numero di uno che non avevi mai incontrato. Quelle battute
adesso le dicono le persone vere, e la rubrica te la fai tu. È il punto della cosa.

**Provato in Chrome** (01/09/2026), col gioco vero: preso il numero a Bit (beatmaker) e a
Sara (fonico), tutti e due compaiono in chat col mestiere accanto al nome e col pallino dei
non letti; aperta la chat di Bit, scritto io per primo («Hai qualcosa di nuovo?»), risposto
«Mandamela» — ed è arrivato **«Sigaretta di sempre», qualità 69, 483 €, nel catalogo, a
nome Bit**. In Sala il bottone diventa «Avete il numero» e resta spento. Nessun errore in
console.

Più otto controlli in `npm run prova`: che compaiano e spariscano quando devono, che un
rapper col numero **non** finisca in chat (questo l'ha trovato la prova, non io: il filtro
guardava solo `numero` e non il mestiere), che si presentino da soli, che il beat finisca
davvero nel catalogo, che parlare avvicini, e che anche loro reggano le 160 settimane senza
ripetersi come tutti gli altri.

Un dettaglio che sembra una sciocchezza e non lo è: la presentazione del fonico diceva
«Sono Sara, **quello** del mixer». I nomi de La Sala sono un misto (Sara, Gigi, Andre,
Nico, Fede, Pippo) e quell'aggettivo dà un genere a chi parla — nel **primo** messaggio che
leggi di quella persona. Riscritta senza.

