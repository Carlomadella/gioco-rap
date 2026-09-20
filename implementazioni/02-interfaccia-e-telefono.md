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
   - **`prompt/prompt-app-telefono.md`** (era in radice, come richiesto; spostato
     col punto 7): 10 prompt per
     ChatGPT, uno per ogni app del telefono, per farsi disegnare il
     concept UI di ciascuna schermata — stessa logica di
     `prompt/prompt-ambientazioni.md` ma per interfacce, non ambientazioni.

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

---

## 15 · La X dello Studio non tornava indietro

15. Nel pop up dello studio la x per tornare indietro non è funzionale, non torna al menù
    principale, è un pulsante vuoto. Verifica non ci siano pulsanti vuoti.

> **Fatto (04/09/2026).** Non era un pulsante vuoto: era un **`id` duplicato**. Sia il
> popup dello Studio sia la schermata «Attività criminali» (la Strada) usano il prefisso
> `st-` per i loro elementi, e per due nomi — `st-x` (la X di chiusura) e `st-dove` (la
> riga «dove sei») — finivano identici in entrambi. `$("st-x")` è `document.getElementById`
> (`js/core.js`), che prende sempre il **primo** elemento col quel `id` nel documento: nella
> pagina lo Studio viene prima della Strada, quindi la X che *si vede* nel popup dello
> Studio è lo stesso nodo su cui la Strada attacca il suo handler. `js/game/strada-crimine.js`
> si carica **dopo** `js/game/studio.js`, quindi il suo `$("st-x").onclick = chiudiStrada`
> sovrascriveva quello dello Studio — cliccare la X chiamava `chiudiStrada()`, che non fa
> niente se la Strada non è aperta: il pulsante sembrava morto.
>
> Rinominati i due id della Strada in `str-x` e `str-dove` (`frontend/index.html`,
> `frontend/js/game/strada-crimine.js`), lasciando `st-x`/`st-dove` solo allo Studio.
> Controllati tutti gli altri `id` di `index.html`: nessun altro doppione, e gli altri
> pulsanti di chiusura (`po-x` sulla Sala, `ng-x` sul guardaroba, `st-mappa` e
> `st-chiudi-scheda` sulla Strada) hanno tutti il loro handler, nessuno vuoto.
>
> Aggiunti due controlli in `strumenti/audit-regressioni.js` — uno che verifica che la X
> della Strada non usi più `st-x`, uno generico che scansiona `index.html` e fallisce se
> compare un `id` doppio, così la classe di bug (non solo questo caso) non torna indietro
> senza che la prova se ne accorga. `npm run verifica` pulito: prova 67/67, audit 170/170,
> build 15/15.

---

## 1 · Dallo Studio si esce solo con «Torna alla mappa»

1. Quando apri lo studio e vai nell'interfaccia di questo se clicchi sul vuoto ti torna
   indietro, l'unico modo per tornare alla mappa da quel punto voglio che sia proprio con
   il pulsante che abbiamo fatto torna alla mappa, quindi togli anche la x in alto a destra.

> **Fatto (04/09/2026).** Tolte le due scorciatoie: cliccare sul fondo dello Studio non lo
> chiude più (`e.target.id === "studio"` tolto da `js/game/studio.js`), e la X in testata
> (`id="st-x"` in `frontend/index.html`) non c'è più — con lei anche il suo handler e
> l'Escape diretto, che ora ricade sul menu di sistema globale come già fa La Sala.
>
> Il motivo per cui prima **non c'era neanche un bottone «Torna alla mappa» visibile** nello
> Studio: `js/menu-sistema.js` non lo trattava come una sua "stanza". `hostAttivo()` non
> controllava `#studio.on`, quindi con lo Studio aperto il menu pensava di essere ancora
> sulla Hub (che resta "on" sotto al popup) — e la barra globale nasconde MAPPA proprio
> quando sei già sulla hub. La lista `HOSTS` del secondo blocco (quello che monta la barra
> nella testata giusta) aveva perfino un commento che *parlava* dello Studio senza avere la
> sua riga: mancava proprio l'aggancio.
>
> Aggiunti entrambi: `hostAttivo()` ora riconosce `#studio.on` (prima della Hub, come La
> Sala e il Negozio), `tornaMappa()` chiude lo Studio prima di andare alla Hub, e
> `HOSTS` monta la barra dentro `.sthead` invece che sotto, in `.pbarra`. `chiudiStudio()`
> resta esposta: la chiama solo quel bottone.
>
> Sei controlli nuovi in `strumenti/audit-regressioni.js` (niente X, niente chiusura sul
> click di fondo, niente Escape diretto, `hostAttivo`/`tornaMappa`/`HOSTS` che riconoscono
> lo Studio). `npm run verifica` pulito: prova 67/67, audit 178/178, build 15/15.
>
> Non provato dal vivo in Chrome in questa sessione — l'estensione non era connessa.
> Da controllare a mano: aprire lo Studio, cliccare sul fondo (non deve chiudersi),
> premere «Torna alla mappa» (deve chiudere lo Studio e portare alla mappa).

---

## 14 · Le azioni in Studio non ti buttano più fuori

14. Quando vado in studio e faccio un'azione poi ogni volta mi fa uscire e tornare nel menù.

Non voglio questo, dallo studio si esce solo col pulsantino torna alla mappa che già abbiamo nell'interfaccia, non voglio che ogni volta mi fai riuscire dopo che svolgo qualcosa

> **Fatto (08/09/2026).** `studioAzione()` (`frontend/js/game/studio.js`) chiudeva lo Studio
> (`chiudiStudio()`) **prima** di far partire la mossa vera (`hubAzione()`): ogni «Scrivi
> barre», «Cerca un beat», «Registra», «Mixa» o «Promo sui social» ti riportava alla mappa, e
> per la mossa successiva dovevi rientrare da capo. Tolta quella riga: lo Studio resta
> aperto, la mossa parte sopra di lui, e la sua testata (energia, soldi) si aggiorna sul
> posto (`renderStudio()`, chiamata dopo ogni esito).
>
> Il motivo per cui prima si chiudeva: lo Studio aveva lo z-index più alto fra tutti i
> pannelli a schermo intero (`css/studio.css`), più alto perfino del foglio per scrivere le
> barre, del titolo che chiede il nome del pezzo e della scena a pagina piena del mix/della
> promo — le tre cose che un'azione in Studio può aprire sopra di sé. Restando aperto, quelle
> finestre ci sarebbero finite *dietro*, invisibili. Abbassato lo z-index dello Studio
> (94 → 55, sotto a modal/report-scena/foglio, ma sempre sopra alla plancia di base): nessun
> altro pannello apre lo Studio al suo interno, quindi non tocca nessun altro flusso.
> `frontend/js/game/ui.js`, `writer.js`, `modal.js` e `actions.js` chiamano ora
> `renderStudio()` (si aggiorna da sola solo se lo Studio è ancora aperto) in ogni punto dove
> prima aggiornavano solo la plancia, così lo stato resta fresco anche a finestra chiusa
> sopra di lui.
> Si esce ancora solo con «Torna alla mappa» (punto sopra): non toccato.
> `npm run verifica`: prova 77/79 (gli stessi 2 «no» di makehuman, presenti anche su `main`
> pulito, non miei), audit-regressioni 294/294, build 33/33, dipendenze 0 vulnerabilità.
> Non provato dal vivo in Chrome in questa sessione — l'estensione non era connessa.

---

## 1 · «Torna alla mappa» non funzionava in alcune interfacce

1. In alcune interfacce il pulsante in alto a sx 'torna alla mappa' che abbiamo fatto non
   funziona. Quando c'è verifica che funzioni tutto.

> **Fatto (04/09/2026), provato dal vivo in Chrome.** Tre falle diverse, tutte nello stesso
> punto: `js/menu-sistema.js` deve sapere di OGNI stanza per farci funzionare davvero il
> bottone — non basta che ci si veda.
>
> **Piazza e Writer: il bug vero.** Il bottone *si vedeva* — la lista `HOSTS` (quella che
> monta la barra nella testata giusta) li aveva già — ma restava **disabilitato per
> sempre**. `mappaBloccata()` (decide se disabilitare MAPPA) riusava di peso
> `internoDaChiuderePrima()`, la lista pensata per una cosa diversa: dire all'ESC «qui c'è
> una finestra interna, chiudi quella prima di aprire il menu». `#piazza.on` e `#writer.on`
> erano lì per una buona ragione — hanno un'azione che può restare a metà (freestyle
> interrotto, strofa non chiusa) — ma quella ragione vale per l'ESC, non per il bottone: il
> bottone lo sa già chiudere in sicurezza (vedi sotto). Risultato prima del fix: entravi in
> Piazza o nel Foglio e MAPPA restava grigio finché non uscivi con la X, esattamente il
> pulsante «che non funziona» descritto nel punto.
>
> Separata la lista in due: `dialogoFlottante()` (i veri dialoghi flottanti — impostazioni,
> il foglio dei risultati, il diario, il report settimanale, la scena, gli overlay social,
> l'orologio aperto, il telefono aperto — quelli senza un modo proprio di annullare quello
> che stai facendo, che per questo devono bloccare anche MAPPA) e
> `internoDaChiuderePrima()` (quella più `dialogoFlottante()` più Piazza/Writer, che resta
> per l'ESC). `mappaBloccata()` ora chiama solo `dialogoFlottante()`.
>
> **Piazza e Writer non chiudevano nemmeno pulito.** `hostAttivo()` non li riconosceva
> affatto come stanze (stesso bug del punto precedente sullo Studio): con uno dei due
> aperto pensava di essere sulla Hub sottostante. Aggiunti. E chiuderli col semplice tolto
> l'"on" avrebbe lasciato un'azione a metà pendente (un freestyle interrotto, una strofa non
> salvata) — la X di ognuno già lo sa fare bene (`uscitaPiazza()`, e l'accoppiata
> `annullaAzione()+chiudiFoglio()+renderGioco()` del Foglio): aggiunta `uscitaFoglio()` in
> `writer.js` con la stessa sequenza, e richiamate entrambe da `tornaMappa()`.
>
> **Il Quaderno (la schermata di gioco nuova, ex punto 1 del bis precedente):** riconosciuto
> come host, monta la barra — ma nessuno chiamava `chiudiQuaderno()` da MAPPA: il bottone
> restava senza effetto premuto da lì. Aggiunta la chiamata.
>
> **Provato dal vivo in Chrome** (partita reale, non simulata): aperti uno per uno Studio,
> Piazza, il Foglio, il Quaderno e La Sala — in ognuno il bottone «Torna alla mappa» era
> visibile, acceso (non più grigio in Piazza/Writer) e il click ha davvero chiuso la stanza
> e riportato alla mappa, senza errori in console.
>
> **Nel mezzo, un collega ha tolto il Quaderno** («via il quaderno»: ogni scheda torna nel
> posto della mappa che già esisteva — Shop, Spese fisse, eccetera — riusando lo stesso
> contenuto da un magazzino nascosto invece di riscriverlo). L'id e la funzione sono
> diventati `#pannello`/`chiudiPannello()`. Il merge non poteva saperlo: la mia riga in
> `tornaMappa()` è rimasta com'era, puntando a un nome che non esisteva più — stesso bug,
> tornato sotto un altro nome. Aggiornata al rename, riverificato dal vivo che il Pannello
> (aperto con `apriPannello(...)`) si chiuda correttamente da MAPPA.
>
> Sette controlli nuovi in `strumenti/audit-regressioni.js`, incluso uno strutturale che
> confronta l'insieme delle stanze di `hostAttivo()` con quello di `HOSTS` (devono coincidere
> sempre) e uno che verifica che ogni stanza riconosciuta abbia davvero un modo di chiudersi
> in `tornaMappa()` — così questa classe di bug (bottone che si vede o è visibile ma non fa
> niente) non torna indietro zitta. `npm run verifica` pulito: prova 67/67, audit 188/188,
> build 15/15.

---

## 4 · Lo Shop diventa uno shop, non un menù

4. Lo shop dev'essere un vero e proprio shop, come gli shop di fortnite o nba2k..
   LEVA STI CAZZO DI INTERFACCIA MENU! RENDILO UNO SHOP DA VIDEOGIOCO NEL 2026

> **Fatto (04/09/2026), provato dal vivo in Chrome.** Aveva ragione: Attrezzatura e
> Beat in vendita erano righe — titolo, sottotitolo, un bottone a destra — la stessa
> identica scatola grigia delle Offerte sul tavolo o del Contratto in corso. Un
> negozio disegnato come un pannello impostazioni.
>
> **Tre reparti dietro tre linguette**, non tre liste una sopra l'altra: Attrezzatura,
> Beat, Vestiti (`.shtabs`/`.shsec`, cambia solo quale si vede — nessuna sezione è
> stata smontata). **La cassa sempre in vista** (`.shcash`, in alto a destra accanto
> alle linguette): prima per sapere quanto avevi in tasca dovevi uscire dallo Shop e
> controllare il pallino in cima alla mappa.
>
> **Attrezzatura**: da riga a card (`.shcard`) — fondale colorato (lo stesso
> `TINTA_STUDIO` viola delle azioni di scrittura/registrazione/mix, perché è la
> stessa famiglia di roba), un'icona propria per pezzo (cuffie, microfono, manopole
> per la scheda audio, un diffusore per il monitor, le barre per il trattamento
> acustico — le prime due icone create apposta, `hub.js`, non c'erano), prezzo in
> alto, "Tuo" quando l'hai già comprato.
>
> **Beat in vendita**: da riga a card (`.shbeat`) con la cover del beat come
> fondale, il tasto ascolta al centro (lo stesso `beatSuona()` di sempre, non
> riscritto) e la X per rifiutare in un angolo — il genere resta il divisorio sopra
> ai gruppi, come prima.
>
> **Vestiti**: non toccato. Il Catalogo → Abbigliamento (`ngcard`) aveva già una
> vera griglia con l'anteprima del capo — gli ho solo dato lo stesso sollevamento al
> passaggio del mouse delle nuove card, per farlo sembrare la stessa famiglia.
>
> **Cosa non è cambiato**: l'economia. `GEAR`, `G.market`, i prezzi, `G.gear`,
> `G.beats`, il salvataggio — tutto identico. Le card chiamano le stesse funzioni di
> comprare/ascoltare/rifiutare di prima, cambia solo cosa disegnano.
>
> **Provato dal vivo in Chrome**: le tre linguette, la cassa che scende dopo un
> acquisto vero (10.000 € → 9.780 € comprando le Cuffie da studio, la card diventa
> "Tuo"), l'ascolto di un beat che accende il tasto play, i bottoni disabilitati e
> spenti quando i soldi non bastano.
>
> Sette controlli nuovi in `strumenti/audit-regressioni.js`. `npm run verifica`
> pulito: prova 67/67, audit 199/199, build 15/15.


---

## 27 · La landing è una pagina sua, staccata dall'accesso e dal gioco

> **FATTO (06/09/2026)** — branch `task/26-landing-login-gioco-pagine-separate`.
> Il punto era il 26 quando l'ho preso in mano; nel frattempo il foglio si è
> rinumerato ed è diventato il 27. È lo stesso: «la pagina di landing dev'essere
> staccata dalla pagina di login e da quella di gioco».
>
> **Com'era.** Un documento solo. `frontend/index.html` teneva dentro tutto —
> la landing (`#s-menu`), la mappa (`#s-hub`), il creatore (`#s-profile`), lo
> Studio, la Strada, il negozio, il telefono — e «entrare in partita» voleva
> dire togliere una classe a una `<section>`. Comodo da scrivere, ma vuol dire
> che chi apriva la copertina si scaricava e faceva girare **tutto il gioco**,
> sessanta file di codice, per guardare una foto e leggere a che settimana era
> arrivato. E la pagina di accesso non esisteva proprio: l'account stava dentro
> a una scheda delle impostazioni.
>
> **Com'è adesso.** Tre file in `frontend/pagine/`, e passare dall'uno all'altro
> è un caricamento vero:
>
> | pagina | cosa c'è | fogli di stile | file di codice | codice impacchettato |
> | --- | --- | --- | --- | --- |
> | `landing.html` | copertina, sei scene, menu di avvio | 9 | 15 | 132 KB |
> | `accesso.html` | entra, apri un account, esci | 4 | 7 | 29 KB |
> | `gioco.html` | la partita intera | 23 | 61 | 895 KB |
>
> Della partita, la landing carica **due file soli**: `js/game/state.js` e
> `js/game/phases.js`, che servono a leggere il salvataggio e a scrivere «anno
> 1, settimana 2». Non fa girare niente del gioco, e `npm run prova` fallisce se
> un domani ci rientra qualcos'altro.
>
> `frontend/index.html` resta dov'è ma diventa **una porta**: rimanda a
> `pagine/landing.html` e basta. Serve perché è l'indirizzo che conoscono tutti
> — la cartella aperta col doppio clic, `npm run dev`, Electron, Capacitor — e
> il rimando è scritto due volte, `meta refresh` e `location.replace`, così
> funziona anche col JavaScript spento e non lascia traccia nella cronologia
> (il tasto «indietro» non ti ributta dentro in un giro infinito).
>
> **Come si passa da una all'altra.** I nomi dei tre file stanno in
> `js/pagine.js` e in nessun altro posto: `vaiA("gioco")`, `vaiA("landing")`,
> `vaiA("accesso")`. Serve perché la demo monofile li rinomina, e un controllo
> in `audit-regressioni.js` verifica che nessun altro file se li costruisca da
> sé. Quello che la landing vuole dire alla partita sta nell'indirizzo, e a
> leggerlo c'è `js/gioco-ingresso.js`:
>
> | indirizzo | cosa fa |
> | --- | --- |
> | `gioco.html` | riprende la carriera dello slot attivo ed entra in città |
> | `gioco.html?vai=profilo` | apre il tuo artista, senza far partire la settimana |
> | `gioco.html?vai=classifiche` | entra e apre le classifiche sul telefono |
> | `gioco.html?nuova=rapido` | artista a caso e via in città |
> | `gioco.html?nuova=creatore` | apre il creatore; quando salvi, si entra |
>
> **La carriera non viaggia nell'indirizzo.** Sta su `localStorage` come sempre,
> e la pagina del gioco la rilegge da sé: la landing decide solo *quale* slot è
> quello attivo, e scrive quello. È il motivo per cui il travaso è stato corto —
> `js/creator/state.js` e `js/game/state.js` leggevano già dal disco allo
> slot giusto, non c'era niente da passarsi.
>
> **Il `<base href="../">`.** Le pagine stanno in `pagine/`, i file del gioco
> no. Senza quella riga in testa, ogni `media/photo/...` che il codice si
> costruisce a runtime — e ce ne sono trentasette — cercherebbe dentro a
> `pagine/`. Con quella, tutti i percorsi restano identici a prima e non c'è
> stato niente da riscrivere, né nei CSS né nel codice.
>
> **Cosa si è spostato, file per file.**
> - `js/creator/nav.js` teneva sia la navigazione del gioco sia la landing.
>   Adesso tiene solo la prima (più `ARTIST_BODY`, che disegna la figura intera
>   e serve alle scene); `goto("menu")` non toglie più una classe, cambia pagina.
> - La landing — le sei scene, la carriera in corso, il menu — è andata in
>   `js/landing.js`, nuovo.
> - `js/avvio.js` (continua / nuova / slot) resta sulla landing, ma non fa più
>   entrare nessuno: prepara lo slot e cambia pagina. Il pezzo «salvato
>   l'artista si entra in città» è andato in `js/gioco-ingresso.js`, dove
>   quel bottone esiste davvero.
> - Il cerchio con la tua faccia nella barra lo riempiva `renderMenu()`: nella
>   pagina del gioco quella funzione non c'è più, e adesso lo riempie
>   `renderArtista()` (`js/creator/render.js`), che gira ogni volta che
>   l'artista cambia faccia.
>
> **Due cose che si sarebbero rotte in silenzio, e sono state sistemate.**
> «Salva ed esci» del menu di sistema faceva `location.reload()`: bastava,
> finché ricaricare voleva dire riaprire il menu. Adesso ricaricare vuol dire
> **rientrare in partita**, quindi va alla landing. Stessa cosa per cambiare
> slot, importare un salvataggio e cancellare dalle impostazioni: dopo, la
> partita in memoria non vale più niente, e si torna al menu invece di ricadere
> dentro a una carriera che non c'è più.
>
> **La pagina di accesso** (`pagine/accesso.html`, `js/accesso.js`,
> `css/accesso.css`) è nuova: mail e password, entra o apri un account, e
> quando sei dentro dice chi sei e quante carriere hai in cloud. Parla con le
> rotte che c'erano già e non erano collegate a niente — `POST /api/account`,
> `POST /api/sessione`, `GET /api/io`, `DELETE /api/sessione` — e traduce in
> italiano gli errori del server (`non-torna`, `email-gia-usata`,
> `segreto-troppo-corto`). Se il server non risponde non è colpa di chi scrive:
> lo dice e basta, e la carriera resta dov'è. Ci si arriva dal tasto **Account**
> nella barra della landing e dal piede del menu. Quello che resta è il vestito:
> la richiesta diceva anche «fatta molto meglio, senza il server a vista», e
> questa è la pagina, non il suo restyle. Nell'elenco quel punto adesso non c'è
> più — se lo si rivuole, va riscritto.
>
> **Il build.** `strumenti/build.js` impacchettava una pagina sola; adesso ne fa
> tre, ognuna coi suoi due file e la sua impronta (`gioco-c44c53ea.js`,
> `landing-f76fcffe.js`…), e copia `index.html` com'è. `npm run demo` non fa più
> un file solo ma tre, che stanno in piedi da soli e si chiamano fra loro
> (`anni-di-fame.html` è la landing, da lì si entra): i collegamenti li riscrive
> il build, che è il motivo per cui i nomi stanno tutti in `js/pagine.js`.
>
> **Provato in Chrome, sul gioco vero.** Dai sorgenti (`npm run dev`): la porta
> che rimanda alla landing, la carriera in corso letta bene, CONTINUA che entra
> in città con mappa/profilo/telefono, «‹ Menu» e «Salva ed esci» che tornano
> alla landing, «Il tuo artista» che apre il creatore, avvio rapido che crea
> l'artista e parte da Milano settimana 1, nuova partita che apre il creatore
> sullo slot scelto e — se esci senza creare — libera lo slot che aveva
> preparato. La pagina di accesso con il server acceso: sessione riconosciuta,
> uscita, e un tentativo sbagliato che risponde «Mail o password non tornano».
> Poi il pacchetto (`npm run build`, servito da `dist/`): la landing e la
> partita si aprono dai bundle, il catalogo dei mille eventi si carica da
> `assets/`. Zero errori in console da tutte le parti.
>
> `npm run verifica` pulito: prova **70/70** (con tre controlli nuovi: la porta
> resta una porta, la landing non si porta dietro il gioco, ogni pagina cita i
> suoi file), audit **234/234** (otto controlli nuovi sul punto), build
> **31/31** — il verificatore del build adesso guarda pagina per pagina.

---

## 24 · Un tasto per uscire al menu, scritto a lettere

> **FATTO (06/09/2026)** — branch `task/24-25-28-menu-disciplina-beat`.
>
> **Il problema.** Dalla partita si usciva solo dal marchio in alto a sinistra:
> ci clicchi sopra e si apre il menu di sistema, dove c'è «Salva ed esci». È una
> cosa che o te la dice qualcuno o non la scopri — un logo non sembra un
> bottone, sembra un logo. Dal punto 27 la landing è per giunta una pagina a
> parte, quindi «tornare al menu» è un'uscita vera e merita una porta visibile.
>
> **Cosa c'è adesso.** Nella fascia in alto della plancia, subito accanto al
> marchio, un tasto con la casetta e la parola **MENU**. Un clic solo: salva la
> partita e va alla landing. Sotto c'è lo stesso codice di «Salva ed esci»
> (`uscitaRapida()` in `js/menu-sistema.js`), quindi il salvataggio è lo stesso
> checkpoint di sempre, non una scorciatoia che scrive a metà.
>
> **Quando non si può salvare** — un'azione a metà, un avanzamento in corso —
> il tasto non ti butta fuori e non resta muto: apre il menu di sistema con
> scritto il motivo, che è l'unico posto dove quel messaggio si può leggere.
>
> **Come è fatto**: il bottone porta `data-adf-global="menu"`, cioè passa dallo
> stesso instradamento dei comandi globali che c'era già per «← MAPPA» e per il
> marchio. Non c'è un secondo giro di logica: un attributo, e il menu di sistema
> sa cosa fare. Il vestito è `.pmenu` in `css/hub.css`; sullo schermo stretto
> resta la casetta e la parola sparisce, come fa il resto della fascia.
>
> **Dalle altre schermate** (Studio, Strada, Sala…) la via resta quella di
> prima, ed è a due passi: «← MAPPA» e poi MENU.

---

## 25 · «Disciplina» diventa «Condizione»

> **FATTO (06/09/2026)** — stesso branch.
>
> La quarta linguetta della colonna di sinistra si chiamava **Disciplina** e
> l'icona era uno scudo. Prometteva una cosa che lì dentro non c'è: non si
> comanda niente e non c'è niente da rispettare. Quello che c'è è **come stai**
> — benessere, lucidità, energia, la striscia di giorni di palestra — **cosa ti
> tocca ogni settimana** — il lavoro, le spese fisse — e **a che punto sei**
> della scalata, con la prova che ti aspetta.
>
> Adesso si chiama **Condizione**, il titolo dentro è «La tua condizione» e
> l'icona è il cuore. È cambiato anche il nome nel codice — `vistaCondizione()`,
> `HUB_VISTA === "condizione"` — perché lasciare il nome vecchio di sotto vuol
> dire che fra un mese uno legge «disciplina» e cerca una cosa che non esiste.
> L'app **Statistiche** del telefono, che apre questa scheda, ci arriva come
> prima.


---

## 8 e 9 · L'agenda: gli appuntamenti e le notifiche

> **FATTO (06/09/2026)** — branch `task/7-8-9-md-agenda-eventi`. File nuovo:
> `frontend/js/game/agenda.js`.
>
> **Il problema.** In fondo alla plancia ci sono gli eventi della giornata —
> freestyle alle 21:00, la Sala alle 22:30, il colpo all'01:30 — e si potevano
> solo fare **adesso**: ci clicchi sopra e parti. Ma un evento alle 21:00 quando
> sono le 15:00 non è una mossa: è un appuntamento. E un appuntamento o te lo
> segni o te lo dimentichi, che è precisamente quello che succedeva.
>
> **Il quadratino (punto 8).** Ogni card ne ha uno in alto a destra. Toccalo e
> l'evento è in agenda; toccalo di nuovo e lo togli. Sta **accanto** alla card e
> non dentro, perché la card è un `<button>` e un bottone dentro a un bottone
> non è HTML valido — il browser fa quello che gli pare. Per questo la card sta
> in una scatola (`.pevbox`), con il quadratino appoggiato sopra.
>
> **Quando arriva la notifica.**
> - **Eventi di oggi**: un quarto d'ora prima (`PREAVVISO = 15`). Se il tempo è
>   saltato oltre — una mossa lunga, un +1 ora dai controlli — la notifica arriva
>   comunque e cambia parole: «è cominciata: …, erano le 21:00».
> - **Eventi della settimana**: sono in un altro giorno, e avvisare quindici
>   minuti prima non servirebbe a niente. Arriva **la mattina del giorno
>   stesso**, al primo avanzamento di tempo del giorno nuovo.
>
> **Dove arriva.** Un toast a schermo sul momento, e in ogni caso una riga nel
> **centro notifiche del telefono** — quello di Eventi V2, l'unico che c'è: non
> se ne apre un secondo. Così se stavi guardando altro la trovi lì, col pallino
> rosso sull'icona.
>
> **Cosa non fa, e perché.** Non ti porta all'evento e non lo fa partire da solo.
> Il tempo di questo gioco lo muove il giocatore: un'agenda che ti teletrasporta
> alle 21:00 sarebbe il gioco che gioca al posto tuo. Ti avvisa, poi decidi tu.
>
> **«Questa settimana» (punto 9).** Al posto del riquadro «Più avanti…» — che
> diceva che sarebbe arrivato qualcosa senza mai dire cosa — ci sono due eventi
> veri, con giorno e ora: la battle di quartiere il venerdì, l'open mic il
> sabato, la sessione lunga alla Sala, la giornata di lanci, il giro grosso, le
> porte aperte in palestra. Sei in tutto, due per settimana.
>
> Sono **sempre quelle due** per quella settimana lì: il seme è il numero della
> settimana, non `Math.random()`. Serve perché la plancia si ridisegna venti
> volte al minuto, e col caso gli eventi cambierebbero sotto gli occhi mentre li
> leggi. Fra i sei si preferiscono quelli che devono ancora arrivare — due
> eventi già passati sono una riga di storia, e la storia non serve: serve
> sapere cosa c'è da qui a domenica.
>
> **L'app Agenda del telefono** apre adesso con **«Segnati»**: gli appuntamenti
> presi, in ordine, con quando arriva l'avviso e un «togli» per disdire. Sotto
> resta quello che c'era — stasera e le tue mosse.
>
> **Nel salvataggio** c'è `G.agenda`, e le voci vecchie si buttano da sole: un
> appuntamento di due settimane fa non è storia, è sporcizia.
>
> **Provato in Chrome, sul gioco vero.** Segnato il freestyle delle 21:00 con
> l'orologio alle 18:00, avanzato il tempo fino alle 20:50: toast a schermo, il
> pallino delle Notifiche da 1 a 2, e dentro «Fra poco: Freestyle al bar
> centrale — Alle 21:00, segnato in agenda». Poi un evento della settimana
> segnato di lunedì per il martedì: al cambio di giorno è arrivata «Oggi:
> Giornata di lanci — Alle 18:00, te l'eri segnato». L'app Agenda mostra il
> segnato in cima, la plancia lo dice «SEGNATO» in arancione, e il «togli»
> funziona da tutte e due le parti.
>
> Nove controlli nuovi in `strumenti/audit-regressioni.js`.

> **AGGIUNTO (06/09/2026)** — branch `task/agenda-blocca-skip`: **l'agenda ferma il
> salto del tempo.**
>
> **Il problema.** Segnarsi un appuntamento e poi cancellarlo con un «+7 giorni» era
> il caso peggiore di tutti: te l'eri segnato apposta, e il gioco te lo portava via
> senza dire niente. La notifica arrivava pure — dentro a un salto che l'aveva già
> superata.
>
> **Cosa succede adesso.** Un salto di *n* giorni si lascia dietro i giorni da oggi a
> oggi+*n*−1: sull'ultimo ci atterri, ed è mattina, quindi all'appuntamento ci arrivi
> ancora in tempo. Quindi:
> - **appuntamento oggi**: il salto non parte. Un toast lo dice, e dice anche come si
>   fa a sbloccarlo — il quadratino sulla card lo toglie dall'agenda;
> - **appuntamento più avanti**: il salto si ferma la sua mattina, qualunque taglia
>   avessi scelto. All'arrivo parte l'avviso «Oggi: …», che è la stessa notifica del
>   mattino (segnata `avvisato`, così non arriva doppia);
> - **ora già passata**: non blocca. Un appuntamento delle 21:00 mancato terrebbe
>   fermo il tempo fino a mezzanotte, che è una punizione e non una comodità.
>
> **Dove sta.** In `agenda.js`, non nel salto: `bloccoSalto(n)` dice qual è il primo
> appuntamento di mezzo e quanti giorni restano saltabili, e un incarto attorno a
> `saltaGiorni()` taglia la taglia scelta. `saltaGiorni` è dichiarata in `skip.js` e
> riscritta da Eventi V2, e `agenda.js` si carica dopo tutti e due: incartandola lì si
> copre in un colpo il menu «Salta avanti», i tasti +1/+7 del widget del tempo e la
> ripresa dopo un evento alto, che rientra dalla stessa porta e quindi ricontrolla
> l'agenda.
>
> Il conto dei giorni è quello assoluto (anno × 52 settimane × 7), lo stesso di
> `absDay()` in Eventi V2: mercoledì prossimo, visto di sabato, ha un numero di giorno
> più basso di oggi.
>
> **Le scritte.** Il menu «Salta avanti» avvisa **prima** che uno scelga, se no scegli
> «Un mese» e ti ritrovi avanzato di due giorni senza capire perché. Il widget del
> tempo, che finora diceva sempre «c'è una decisione da prendere», adesso dice quando
> a fermarlo è stato un appuntamento.
>
> **Cosa resta libero apposta**: «Fine giornata». È una mossa sola e deliberata, non
> un salto, e bloccarla rischierebbe di incastrare la partita.
>
> Tre controlli nuovi in `strumenti/audit-regressioni.js`, e sette prove di logica su
> `bloccoSalto` (nessun impegno, impegno oggi, ora già passata, taglio di 7 a 3,
> atterraggio esatto, due impegni, impegno fuori portata).

---


## 68 · Il telefono nuovo, quello della foto

68. implementare il telefono nuovo, si vede nei media la foto

   **FATTO (06/09/2026)** — la foto è
   `frontend/media/photo/pagina di gioco/schermata_telefono.png`, e la home del telefono
   nella plancia adesso è quella: **sfondo** col rapper di spalle davanti alla città di
   notte, **otto icone su quattro colonne**, **dock** in fondo con Chat, Contatti,
   LaFamegram e Inventario, barra di stato e isola **dentro** allo schermo invece che in una
   fascia grigia sopra al vetro.

   **Le icone sono la foto, non un disegno che le somiglia.** Ritagliate dal PNG una per una
   e salvate in `frontend/media/photo/telefono/app-*.png` (118 px quelle della griglia, 110
   quelle del dock, misurate sui bordi veri delle piastrelle). Anche lo sfondo esce da lì:
   `sfondo.png` è il pezzo di foto pulito, sotto all'etichetta «IMPOSTAZIONI» e sopra ai
   pallini delle pagine.

   **Lo sfondo riempie tutto lo schermo**, da un bordo all'altro. Prima si fermava a metà e
   sopra restava una fascia nera — che è quello che fa la foto di partenza, ma su un telefono
   in mano non si vede mai. `cover` la ingrandisce finché copre e taglia ai lati, che è
   esattamente quello che fa un telefono con uno sfondo più largo del display: il rapper e i
   grattacieli restano al centro, si perdono le palme di bordo. Sopra ci va un velo scuro che
   sfuma verso il basso, per tenere leggibili le icone e le loro scritte dove la città è
   illuminata.

   **Le palline rosse invece no.** Nella foto sono cotte dentro all'immagine (5 su CHAT, 2
   su LAFAMEGRAM, 4 su AGENDA, 3 su MESSAGGI, 1 su NOTIZIE) e sono state **cancellate**, coprendo
   il cerchio col riflesso della stessa piastrella, e per il giornale con lo sfondo preso da
   una piastrella pulita del dock. I numeri li ridisegna la partita: le chat non lette, gli
   obiettivi cambiati da quando li hai guardati, le notizie della settimana se non le hai
   ancora aperte. Un telefono con un numero finto stampato sopra non è un telefono.

   **Tutte e quattordici le app aprono** — otto nella griglia, quattro nel dock, più le due che
   si registrano a partita avviata: Notifiche (`eventi-v2.js`) e Trasferte (`trasferte.js`).
   Quelle due nella foto non ci sono, quindi non hanno un ritaglio: tengono il loro disegno
   vettoriale, ma dentro a una piastrella copiata dalle altre — nera, appena schiarita in
   alto a sinistra, col filo di luce sul bordo e il glifo dorato — così non stonano in mezzo
   alle altre. L'ordine della griglia è quello della foto (`TEL_GRIGLIA` in
   `telefono.js`); chi si registra dopo va in coda, nel primo posto libero.

   **Cosa è sparito**: i tre widget che stavano sopra la griglia (il post più in vista, la
   posizione in classifica, l'ultimo messaggio). Nella foto la home è solo icone e sfondo, e
   quelle tre cose le dicono le app che aprono — LaFamegram, Classifiche, Chat — dove
   sono per esteso invece che in un rettangolo da tre righe. Con loro se ne sono andate
   `telClassifica()` e `telPostTop()`, che non le usava più nessuno.

   **E poi è sparita anche l'app Messaggi.** Elencava le stesse conversazioni di Chat con
   meno roba dentro: nessun ruolo accanto al nome, nessun modo di scrivere per primo. Due
   icone per la stessa cosa. Via l'app, via `schermataMessaggi()`, via il ritaglio
   `app-messaggi.png`; nel telefono stretto (sotto i 1180px) il pulsante «Vedi tutti i
   messaggi» è diventato «Vedi tutte le chat» e apre Chat. `telMessaggiDiretti()` resta,
   perché la lista corta in cima al telefono stretto la usa ancora.

   **Il dock ha cambiato inquilini.** Nella foto erano Messaggi, Contatti, Notizie e
   Classifiche; adesso sono **Chat, Contatti, LaFamegram e Inventario**, cioè le quattro che
   si aprono di più — Messaggi non c'è più, e Notizie e Classifiche si guardano una volta a
   settimana, non ogni volta che prendi in mano il telefono. Notizie e Classifiche sono
   passate in griglia, in testa.

   **Anche il guscio è quello della foto, non una scatola arrotondata.** Prima la cornice
   era un rettangolo con un degradé grigio scuro e l'angolo da 38 px: leggeva come una
   scatola col vetro dentro. Nella foto invece il profilo del telefono sta fra x=207 e
   x=883 e lo schermo fra 237 e 856 — **trenta pixel di scocca per parte**, e quei trenta
   non sono grigi: sono **tre pixel di filo metallico lucidissimo** (#EFF2F7 sui fianchi,
   bianco pieno sotto perché la luce rimbalza da lì, appena più spento in alto) e poi
   **ventisette di nero pieno**, che è la cornice del vetro. Rifatto così: il filo è un
   `border` in degradé e il nero è il fondo, ritagliati uno sul bordo e uno dentro
   (`padding-box` / `border-box`), perché una `box-shadow` un anello in degradé non lo sa
   fare.

   **L'angolo l'ho misurato, non scelto.** Seguendo il bordo della foto riga per riga viene
   un cerchio di **raggio 110 px**, verificato in quattro punti (y=42, 54, 84 e 96: tutti
   entro un pixel e mezzo). Sono il 16,2% della larghezza del guscio; lo schermo dentro
   segue lo stesso centro, quindi 110 − 30 = 80 px di raggio suo. Tutto in `cqw` sulla
   colonna vera (il contenitore è `.ptel`, non `.ptelframe`: le unità di un elemento si
   leggono sempre sul contenitore che ha *sopra*), quindi le proporzioni restano identiche
   da 200 a 420 px di colonna — provato a sette misure.

   **E ci sono i tasti.** Tre sul fianco sinistro (azione corto in alto, volume su, volume
   giù) e l'accensione a destra, più in basso e più lungo di tutti: posizioni e altezze
   prese dalla foto e rimesse in percentuale dell'altezza del guscio. Sporgono dal profilo,
   come quelli veri.

   Una cosa che la foto non poteva dirmi: il filo vero sarebbe 1,3 px alla misura che il
   telefono ha davvero nella plancia, cioè **sotto al pixel dello schermo**, e alla prima
   prova spariva a destra e in alto — restava acceso solo dove il bordo cadeva per caso su
   un pixel intero. Un filo che c'è su due lati e non sugli altri è peggio di un filo un po'
   più spesso, quindi il minimo è 1,6 px: alla peggio si arrotonda a due pixel veri e si
   vede tutto intorno, che guardando la foto è quello che conta.

   **Le misure non sono a occhio.** Sono quelle della foto (schermo 620 × 1333: piastrella
   112, passo fra le colonne 147, griglia che comincia 114 sotto al bordo, dock largo 572 a
   32 dal fondo) rimesse in percentuale della larghezza dello schermo, così restano quelle a
   qualunque misura prenda la colonna del telefono. Per il corpo del testo le percentuali non
   valgono — una percentuale di `font-size` è del carattere del padre, non della larghezza —
   e lì servono i **container query** (`container-type: inline-size` sulla cornice e sullo
   schermo, misure in `cqw`). Le etichette usano un carattere condensato, come nella foto:
   con uno normale «IMPOSTAZIONI» e «LAFAMEGRAM» non ci stavano sotto alla loro icona e
   finivano tagliate coi puntini.

   Provato in Chrome: le quattordici app aprono e tornano alla home (le dodici della foto
   dentro allo schermo, Notifiche e Trasferte nella loro finestra sopra al gioco), tutti e
   tredici i ritagli si caricano — nessuna immagine rotta — e la casella del telefono tirata a
   292 × 470, 297 × 556, 360 × 660 e 430 × 900 non fa mai sovrapporre la griglia al dock né
   uscire il dock dallo schermo. Sotto i 1180px, dove il telefono è ancora quello vecchio,
   «Vedi tutte le chat» apre Chat e la freccia riporta indietro. Nessun errore in console.
   `npm run prova` 70/70, `npm run build` pulito.

## La responsività: lo Studio, la Strada e l'hover al tocco

Tre punti nati da un giro di screenshot sul telefono, più il giro largo che ne è
seguito. **FATTO (08/09/2026)** — commit `43623ca`, `ee4951c`, `df41c78`.

1. ~~«L'orologio galleggiante copre lo Studio, e ruba il tocco»~~ **FATTO (08/09/2026)** —
   la tabella `HOSTS` di `frontend/js/game/tempo-controlli.js` non aveva lo Studio, e
   siccome lo Studio è un foglio sopra all'hub — che resta acceso sotto — la pastiglia si
   agganciava all'hub e si prendeva lo `z-index:142` contro il 94 dello Studio: finiva
   sopra alla riga «Il quartiere», al tasto d'oro «POSTA» e alla stima degli stream.
   Adesso lo Studio ha una riga sua nella tabella, **muta** e messa **prima dell'hub**:
   dove c'è un posto muto `activeHost()` torna `null` e il widget non si monta da nessuna
   parte. L'ora nello Studio resta quella della fascia in alto (`studioRisorse()`), come
   nelle foto di riferimento. Il costo della scelta, deciso insieme: dentro allo Studio
   non ci sono più «Attendi», «+1 giorno» e «+7 giorni» — per aspettare si torna alla
   mappa.

2. ~~«La take migliore ha la barra più corta»~~ **FATTO (08/09/2026)** — sotto i 620px
   `css/studio-elementi.css` lasciava collassare a zero la casella del «← buona»
   (`.sttakeb{min-width:0}`), così la riga senza targhetta regalava una sessantina di
   punti di larghezza alla sua barra e le due piste non erano più larghe uguali: q85
   sembrava meno di q71, proprio la cosa per cui la barra esiste. La casella adesso si
   stringe con lo schermo (56px sotto i 620, 50px sotto i 520) ma **non arriva mai a
   zero**, e la larghezza riservata resta sempre più larga del testo che ci va dentro.

3. ~~«La fascia in alto si taglia a 360px»~~ **FATTO (08/09/2026)** — la nav globale di
   `js/menu-sistema.js` si prende 210 punti fissi e i tre numeri (energia, soldi, ora) ne
   vogliono quasi 190: su una riga sola l'ora finiva fuori e si leggeva «09:». Sotto i
   480px la fascia va su **due righe** — sopra la nav con la sezione di fianco, sotto i
   numeri allineati a destra — e `--stAlta` cresce con lei, se no le colonne partono
   sotto alla fascia e ci finiscono dentro.

4. ~~«L'hover che resta acceso al tocco sul telefono. Va fatto in un giro solo su tutti i
   CSS»~~ **FATTO (08/09/2026)** — tutte le regole `:hover` dei 24 fogli che ne avevano
   stanno dentro a `@media (hover:hover)`. Dove un selettore ne teneva insieme due — per
   esempio `.land-voce:hover,.land-voce.on` o
   `.skill-hotspot:hover,.skill-hotspot:focus-visible` — la regola è stata divisa: nella
   gabbia ci va solo la parte con `:hover`, il resto sta fuori e continua a valere anche
   col dito. Conteggio per file prima e dopo: stesso numero di regole in ognuno. La
   convenzione è scritta in cima a `css/tocco.css`.

5. **La Strada si impila** **FATTO (08/09/2026)** — non era nell'elenco, l'ha trovata il
   giro largo, ed era la falla più grossa: la Strada esisteva **solo larga**. Le tre
   colonne sono `260px minmax(520px,1fr) 300px` e l'unico scalino di larghezza era a
   1100px, che le stringe a 955 punti prima di distacchi e imbottitura. Sotto ai 980 la
   pagina sbordava di lato, il colpo da scegliere finiva mezzo fuori dallo schermo e la
   barra delle città non si raggiungeva: sul telefono la Strada non si giocava. Adesso
   sotto i 980 si impila con l'ordine dello Studio (prima i colpi, poi «Adesso», poi il
   contorno, in fondo le città), sotto i 620 la fascia va su due righe come nello Studio,
   e sotto i 520 i quattro colpi vanno uno per riga.

6. **Il rapporto di settimana a 360** **FATTO (08/09/2026)** — trenta punti d'imbottitura
   più venti di cornice lasciano 260 punti veri: le tre caselle diventavano da 78, con
   dentro un numero da 27px che a «12.4K» era già fuori. Sotto i 400 vanno a due per
   riga, e la dispari si prende la riga intera.

---

## 15 · Muta/smuta la musica dal menu principale

15. Dal menù principale mettiamo un pulsantino in parte a sx che permette di mutare la musica di sottofondo, o smutarla.

   **FATTO (10/09/2026)** — un bottone tondo (36px, stesso stile di `.avatarbtn`) accanto
   al marchio, in `pagine/landing.html`. Riusa l'interruttore che già esisteva
   (`SET.audio.on`, `js/impostazioni.js`): lo stesso «Audio ON/OFF» del menu di sistema in
   game, non un secondo stato per conto suo — mutare da qui vale anche dentro alla
   partita, e viceversa. Il click chiama `setSalva()` e `applicaImpostazioni()`, che già
   spegne `ADF_AUDIO` (`js/audio/engine.js`) insieme a tutto il resto.

   **Due intoppi trovati provando davvero nel browser, non solo leggendo il codice:**
   - `css/landing.css` mette `pointer-events:none` su tutta `.topnav` mentre si è sul
     menu («sul menu non c'è niente sopra» — il marchio stesso è `display:none` lì): il
     bottone si vedeva ma il click non arrivava mai. Serviva un `pointer-events:auto`
     dedicato, in `css/shell.css`.
   - Le due icone (nota / nota barrata) si scambiavano con l'attributo `hidden` sull'
     `<svg>`, ma in Chrome **`.hidden` non riflette l'attributo sugli elementi SVG** — si
     legge `el.hidden === true` e intanto l'attributo non c'è, quindi il CSS `[hidden]`
     non scatta mai. Le icone adesso si scambiano da CSS puro, in base a
     `aria-pressed` sul bottone, senza toccare `hidden`.

   Verificato in Chrome, avanti e indietro: si vede, si clicca, cambia icona, resta muto
   dopo un refresh (persiste su `localStorage`), e funziona identico su una finestra a
   misura di telefono (390×844). `npm run prova` 94/94.

   **Due problemi trovati dal giro di controllo finale, sistemati nello stesso task**
   (`documentazione/problemi-riscontrati.md`, giro del 10/09/2026): l'icona non si
   aggiornava se l'audio si spegneva dal secondo interruttore, quello delle Impostazioni
   (`dopoModifica()` in `js/impostazioni-ui.js` non richiamava `aggiornaMuteLanding()`);
   e il bottone restava a 36×36 sul telefono invece dei 44 richiesti da `css/tocco.css`.
   `npm run verifica` torna verde dopo entrambe le correzioni.

Guardate e già a posto, senza toccarle: la plancia si impila da sola sotto i 900 (e sotto
i 1180 nasconde il telefono, per scelta già scritta lì), il negozio e i moduli usano
griglie `auto-fill` che scendono a una colonna da sole, `.grid` di `base.css` collassa a
820, e il telefono di `telefono.css` è disegnato in `cqw` dentro al suo contenitore.

**Conferma dal giro di screenshot:** le schede dei beat vanno a capo una per riga a 390px,
come erano state disegnate.

I tre punti dello Studio e la regola dell'hover hanno il loro controllo in
`frontend/strumenti/audit-regressioni.js` (da 290 a 294 prove). **Quello che manca:** il
telefono vero. Qui l'estensione Chrome non era collegata, quindi queste sono misure lette
nel CSS e nel codice, non schermate rifatte — il giro con `prova-sul-telefono` resta da
fare.

## Il tasto d'oro in cabina

~~«Nella foto `registrazione_pezzo` l'oro ce l'ha "UN'ALTRA TAKE", e la foto era la
richiesta. Ma la regola dice che l'oro va alla mossa che fa succedere la cosa — ed è per
quella regola che nella sezione Beat "Compralo" è d'oro e "Fattelo fare" no. Ha vinto la
foto, e il risultato è che chi va di fretta preme l'oro e spende 12 di energia senza
volerlo. Dimmi e la giro.»~~
**FATTO (13/09/2026)** — girata.

In cabina l'oro ce l'ha adesso **«Tieni questa e chiudi»**, e «Un'altra take · 12 energia»
è passata al tasto secondario. La regola vince sulla foto, e il perché è che la regola non
è un gusto: sta scritta sopra a `stPrimo()` in `frontend/js/game/studio.js` — *«uno solo
per schermata è d'oro, ed è quello che fa succedere la cosa»* — ed è la stessa che fa
d'oro «Compralo» e non «Fattelo fare» due sezioni più in là. Tenere la foto qui voleva
dire avere due sezioni dello Studio che usano l'oro per dire due cose diverse, e il danno
non era estetico: il tasto grosso era quello che ti toglieva dodici di energia.

Il controllo sta in `audit-regressioni.js` («in cabina l'oro ce l'ha «Tieni questa e
chiudi», non «Un'altra take»») e guarda tutte e due le cose: che l'oro sia sul tasto
giusto **e** che «Un'altra take» sia rimasta secondaria, se no basta rigirarla per metà.
Provato anche in partita: il tasto `stprimo` è «Tieni questa e chiudi».

## Il marchio non copre più HYPE sul telefono

**FATTO (13/09/2026)** — sotto i 900 punti la plancia si impila e `.pbarra` smette di
essere una riga: diventa alta 307 punti, perché le sei statistiche vanno su tre righe. Il
`top:0;bottom:0` della nav la stirava per tutta quell'altezza e il marchio, che dentro ci
sta in mezzo, finiva **sopra alla casella HYPE** — che infatti non si leggeva. Adesso una
media query rimette la nav alta quanto il suo contenuto e la appoggia in alto, dove
`#hb-logo` (invisibile ma che conserva il posto) la aspetta. Misurato a 360 punti: nav
alta 30 punti dentro una barra di 307, e nessuna sovrapposizione con HYPE.

## Timing prima di Marketing, nello Studio

> Superato il 15/09/2026: il Marketing non è più una linguetta dello Studio, sta sul
> telefono (vedi «Lo Studio a cinque linguette», in fondo). Quello che segue è com'era.

~~«marketing deve essere dopo timing»~~ **FATTO (13/09/2026)**

Le linguette dello Studio adesso fanno Beat · Testo · Cabina · Mix · Cover · Feat ·
**Timing** · **Marketing**. Non e' un gusto: la spinta si decide **dopo** aver deciso quando
esce il pezzo, perche' «stanotte» e «venerdi' fra quattro giorni» non si spingono allo
stesso modo. Prima si sceglieva come spingerlo senza sapere quando sarebbe uscito.

L'ordine lo tiene `STUDIO_SEZIONI` in `frontend/js/game/studio.js`, e il controllo che lo
difende sta in `strumenti/prova.js` («le sezioni sono le sette del punto 4, piu' la
cabina»), che confronta l'elenco intero: se qualcuno le rimescola, lo dice.

## Al banco del Mix si sceglie, non si guarda soltanto

~~«nella sezione mix non si può cliccare su "da solo"»~~ **FATTO (13/09/2026)**

Nel Mix **nessuna** delle due caselle era cliccabile, non solo «da solo»: `stScelta()` fa
un `<button>` soltanto se gli si passa un attributo, se no tira fuori un
`<div class="stscelta muta">`. Al banco non gliene passava nessuno, quindi la colonna di
sinistra era una didascalia: per togliersi il fonico o rimetterlo bisognava tornare in
Cabina, e il messaggio sotto lo diceva pure («un fonico si chiama dalla Cabina»).

Adesso sono le stesse caselle della Cabina, con lo stesso attributo e lo stesso gestore: i
fonici che conosci si scelgono da qui, e «da solo» toglie chi c'è.

Sistemato anche in Cabina, perché era lo stesso difetto: lì «da solo» era muta e per
restare senza fonico bisognava indovinare che si ri-cliccava quello già scelto. Il
`data-fonico` vuoto vuol dire «nessuno dietro al vetro», e `studioScegliFonico(null)`
toglie invece di fare il giro del toggle — che su `null` lo avrebbe rimesso.

Provato in partita: le due caselle escono come `BUTTON`, il clic sul fonico lo sceglie
(`G.studio.fonico` valorizzato) e il clic su «da solo» lo toglie (torna `null`), con la
spunta che si sposta.

## Al Marketing si sceglie quale pezzo spingere

~~«Come nell'interfaccia dei beatmaker, nella sezione dove si posta il pezzo per hype' non fa cliccare su nessun pezzo se non su quello già selezionato.»~~ **FATTO (14/09/2026)**

Stesso difetto del banco del Mix: le righe di «Cosa spingi» erano `stScelta()` senza
attributo, quindi `<div>` muti, e quella accesa era sempre la prima — l'ultimo uscito —
qualunque cosa si toccasse. Ma renderle cliccabili e basta sarebbe stata una finta, perché
la promo di `actions.js` non guardava nessun pezzo: dava hype e follower «a tutto quello
che hai fuori», e scegliere non avrebbe cambiato un numero.

Adesso le righe portano `data-spingi="<seed>"` e passano da `studioSegna("spingi", …)`, lo
stesso meccanismo di Mix e Timing; `studioDaSpingere()` legge la scelta e, se non c'è o il
pezzo è sparito, torna all'ultimo uscito come ha sempre fatto. La promo lascia sul pezzo
scelto una **spinta** (`s.spinta`, +0,10 a post, non oltre 1,5), che `songWeekly()` in
`sim.js` moltiplica sugli stream della settimana e che scende di settimana in settimana
come la viralità — un post fa girare il pezzo, non lo rifa uscire. Nel riquadro il pezzo
spinto porta «in spinta», e l'esito dice quale hai spinto. Hype e follower della promo non
sono cambiati di un punto.

La prova sta in `strumenti/prova.js` (tre controlli sotto «al Marketing i pezzi fuori si
possono cliccare»): il collegamento, la scelta che vince sull'ultimo uscito, e la spinta
che finisce sul pezzo scelto e non sugli altri.

Provato in partita: con due pezzi fuori è acceso l'ultimo, il clic sull'altro sposta la
spunta e il titolo di «SPINGI», e «Posta» scrive «Spingi «Sottopasso»» con `spinta = 1.1`
solo su quello.

## Quando tieni la take si chiede solo il nome; la copertina si conferma nella Cover

~~«Quando scegli la take esce un container che ti deve chiedere solo il nome del pezzo e non la copertina, quella viene dopo nella sezione cover»~~ **FATTO (14/09/2026)**

~~«non c'è un tasto di conferma della copertina»~~ **FATTO (14/09/2026)**

Sono lo stesso flusso, e si sono fatti insieme. `chiediTitolo()` in
`frontend/js/game/copertine.js` chiede il titolo e basta: via la copertina, i tre tasti
sotto e la nota sul ritaglio, e il testo dice dove si va per la copertina. Il pezzo nasce
come prima con la copertina generata dal suo seed; chi passa un pezzo (la rinomina dalla
plancia, `ui.js`) si riprende seed e foto intatti, quindi la firma non è cambiata. Le
classi `.copbox/.cop/.copaz/.copbtn/.copnota` di `overlays.css` non le usava più nessuno e
sono andate via nello stesso commit.

Nella Cover dello Studio «Generane un'altra», la foto caricata e «Togli la foto» non
toccano più il pezzo nell'istante in cui li premi: diventano una **proposta**
(`G.studio.coverProva`, legata al pezzo dal suo seed) che si vede grande al centro, con
quella di adesso piccola accanto e la scritta «adesso». Va sul pezzo solo con **«Conferma
la copertina»**; «Lascia com'era» la butta. Nell'elenco a sinistra il pezzo con una
proposta in piedi porta «proposta» (era «da confermare»: a 360 punti si tagliava).

Una cosa che la conferma sistema e prima era rotta: il seed è anche l'identità del pezzo
per le scelte dello Studio (Mix, Timing, Cover, Marketing). Rigenerare la copertina lo
cambiava, e il pezzo scelto in Timing «spariva» — si tornava al migliore senza dirlo. Ora
`studioCoverConferma()` sposta le scelte sul seed nuovo.

Le prove stanno in `strumenti/prova.js` (quattro controlli sotto «senza proposta la Cover
offre foto e rigenera»). Provato in partita: il container della take chiede solo il nome;
nella Cover «Generane un'altra» apre la proposta con i due tasti, «Conferma» cambia il seed
e `G.studio.esce` lo segue (Timing continua a dire «Sottopasso»), «Lascia com'era» rimette
tutto com'era.

Sistemate insieme le quattro cose che `segnala-problemi` aveva trovato sul Marketing (giro
del 14/09 in `documentazione/problemi-riscontrati.md`): «in spinta» e ogni pezzo colorato
dentro alla riga piccola restano in riga (`.stchi span span{display:inline}` — andava a
capo anche «−8 se esce così» in Timing); un pezzo scelto più vecchio dei sei mostrati resta
nell'elenco; la descrizione della promo dice che spinge il pezzo scelto; una riga senza seed
esce muta (`stSeme()`) invece che come bottone che non fa niente.

## Un pezzo non uscito non si spinge: se ne fa uscire un'anteprima

~~«non posso spingere una canzone che non è ancora uscita, al massimo faccio uscire una preview»~~ **FATTO (14/09/2026)**

La prima metà era già vera — al Marketing la promo vede solo i pezzi usciti — ma la
seconda no: di un pezzo chiuso in cartella non si poteva fare niente finché non usciva.
Adesso «Cosa spingi» ha sotto un secondo elenco, **«Non ancora fuori»**, con i pezzi
registrati e non usciti (quelli in cassaforte no). Se ne tocchi uno il pannello centrale
diventa **ANTEPRIMA** e il tasto d'oro è «Fai uscire una preview»; la promo non c'è, perché
quella è per i pezzi fuori e basta. Se ritocchi un pezzo uscito si torna alla promo.

L'anteprima è una mossa vera di `actions.js` (`anteprima`: 8 energia, 30 minuti in
`tempo.js`, la stessa scena della promo): dà un po' di hype — pieno la prima volta, la
metà la seconda, un terzo la terza, e alla terza si ferma: «l'hanno già sentito». Ogni
anteprima resta scritta sul pezzo (`s.anteprime`) e **quando esce** — dall'azione
`pubblica` o da `studioUscitePronte()` il venerdì — diventa la spinta della prima
settimana: `s.spinta = 1 + 0,12 × anteprime`, la stessa spinta della promo, che poi
scende da sola. Il riquadro lo dice prima («anteprime fatte: 1/3 · all'uscita parte al
124%»). Le costanti stanno in cima ad `actions.js` (`ADF_ANTEPRIME_MAX`,
`ADF_ANTEPRIMA_SPINTA`).

La casella è la stessa `spingi` del punto sul Marketing: `studioDaSpingere()` la legge fra
gli usciti (e ripiega sull'ultimo), `studioDaAnticipare()` fra i non usciti (e senza
scelta è `null`: l'anteprima non parte da sola).

Sei prove in `strumenti/prova.js` (sotto «al Marketing il pezzo non uscito sta sotto
«Non ancora fuori»»). Provato in partita: scelto «Sangue» (non uscito) il centro passa
all'anteprima, la mossa costa 8 energia e 30 minuti, apre la scena con «Anteprima di
«Sangue»: hype +3. Quando esce parte al 112%», e la riga dice «1 anteprima».

## Prima Beat, Testo e Cabina; il resto si apre col primo pezzo

«l'utente deve poter fare solo le sezioni Beat, Testo, e Cabina, poi il resto» **FATTO (15/09/2026)** — anche nella lettura **«ad ogni pezzo»** che Carletto intendeva: lo Studio lavora un pezzo alla volta, quello **sul banco**, e Mix e Uscita si aprono su di lui e si richiudono quando esce (vedi «Lo Studio a cinque linguette», in fondo a questo file). Sotto resta com'era fatta la lettura «prima volta» del 14/09.

Le cinque linguette dopo la Cabina — Mix, Cover, Feat, Timing, Marketing — restano
**chiuse finché non hai registrato il primo pezzo**: spente, col lucchetto, al loro posto
(`.sttab.chiusa`). Toccarle dice «Prima il pezzo: Beat, Testo, Cabina. Poi il resto» e non
cambia sezione; arrivarci da fuori (un cartello della mappa, un salvataggio) riporta al
Beat. Appena c'è un pezzo (`G.songs.length > 0`) si apre tutto, e resta aperto: è il
percorso guidato della prima volta, non un vincolo per sempre. Le sezioni portano
`dopo:true` in `STUDIO_SEZIONI`, e `studioSezAperta()` decide.

**La scelta che ho preso, e che puoi ribaltare**: il punto si può leggere in due modi.
*Prima volta* — le tre sezioni sono l'inizio, poi lo Studio è tutto tuo (quello che c'è
adesso). *Ogni pezzo* — per ogni canzone si passa da Beat → Testo → Cabina e solo dopo si
mixa, si veste, si fa uscire: ma le sezioni dopo la Cabina già oggi lavorano solo su un
pezzo registrato (senza pezzi dicono «Si comincia dalla Cabina»), quindi il vincolo per
pezzo c'è già nei fatti, e chiuderle di nuovo a ogni pezzo avrebbe tolto la possibilità
di mixare il pezzo di ieri mentre scrivi quello di oggi. Se volevi la seconda, si cambia
`studioSbloccato()` e basta.

Tre prove in `strumenti/prova.js` (sotto «senza pezzi Mix, Cover, Feat, Timing e
Marketing sono chiuse»). Provato in partita: con la cartella vuota le cinque linguette
hanno il lucchetto, il tocco su Marketing lascia il Beat e mostra l'avviso; col primo pezzo
si aprono.

## Le misure di un anno, dopo i sette ritocchi allo Studio

Fatte il 14/09/2026 nel gioco vero, su una copia dello stato (fan 300, hype 15, un pezzo
q70, fase Sconosciuto), rimettendo poi il salvataggio com'era.

- **La spinta della promo** (punto «al Marketing si sceglie quale pezzo spingere»): 52
  settimane con tre post a settimana sul pezzo. Con la spinta 2.211 stream, senza 1.900:
  **+16 %**. La spinta si assesta a 1,2 (sale di 0,10 a post ma la resa del giorno la
  frena e ogni settimana ne resta il 55 %), hype e follower identici nei due casi: la promo
  dà quello che dava, in più il pezzo scelto gira un po' di più. Un anno di `advanceWeek()`
  ci mette 1,4–2 secondi.
- **Le anteprime** (punto «al massimo faccio uscire una preview»): media di 30 corse. Tre
  anteprime prima dell'uscita (24 energia, 90 minuti) contro nessuna: prima settimana 285
  stream contro 175 (**+63 %**), sei settimane 1.094 contro 872 (**+25 %**). Il +36 % è la
  spinta all'uscita (1,36); il resto è l'hype che le anteprime stesse hanno dato (15 → 20,
  che entra nella «scoperta» di `songWeekly()`). È un vantaggio vero per chi prepara
  l'uscita, non un secondo motore.
## Lo Studio a cinque linguette: B + D3 + F2 + E

«Sto pensando di voler togliere le sezioni cover, feat, marketing» + il punto 10 letto «ad
ogni pezzo» **FATTO (15/09/2026)** — scelta **B + D3 + F2 + E** del
[brainstorming](../documentazione/brainstorming-studio-cover-feat-marketing.md), fatta nei
quattro passi scritti lì, un commit per passo. Alla fine: **Beat · Testo · Cabina · Mix ·
Uscita**, cinque linguette, nessuna vuota, e a 390px ci stanno in riga senza scorrere.

1. **Marketing sul telefono.** La linguetta non c'è più. In LaFamegram, in cima al feed,
   c'è «**Che post fai?**» (`telPromo()` in `telefono.js`): la lista dei pezzi usciti da
   spingere (con la riga scelta accesa), sotto «Non ancora fuori» per l'anteprima, il
   riquadro giallo della saturazione, il tasto d'oro **Posta** — o «Fai uscire una
   preview» se il pezzo scelto non è fuori. La scelta resta in `G.studio.spingi`, letta da
   `studioDaSpingere()`/`studioDaAnticipare()`, che è dove `actions.js` la cerca: le mosse
   `promo` e `anteprima` non sono cambiate di un numero. Lo Studio, dopo l'uscita, dice
   «fallo sapere» con un tasto che chiude lo Studio e apre il telefono su LaFamegram
   (`studioFalloSapere()`). Attenzione a una cosa: **eventi-v2.js sostituisce
   `schermataLafamegram`** — la promo sta in cima anche lì, se no si vedeva solo nella
   versione base. La foto `studio_promo.png` torna fra le «in attesa» dell'audit.
2. **Feat in Cabina, con le due porte (D3).** Sotto «Dietro al vetro» c'è «**Con chi**»: «da
   solo», i rapper che conosci dalla Sala (accettano sempre, non costano niente: il
   rapporto è già il prezzo pagato) e «**Dalla classifica**», i sei rivali più grossi non
   ancora fra i contatti. Un rivale ha una fama ricavata dai suoi ascolti in scala di log
   (`studioFamaRivale`), un prezzo a decine (`studioFeatPrezzo`, 30 + fama × 5) e una
   probabilità di sì (`studioFeatProbabilita`: la tua misura — ascolti della settimana,
   hype × 10, fan × 0,2 — contro i suoi ascolti; da 8% a 97%). Si paga solo se dice sì; il no
   costa 5 di energia e un'ora. Chi accetta **entra in `G.gente`** come rapper a «contatto»,
   con la sua faccia, e da lì in poi viene gratis. Con le conferme accese la chiamata chiede
   prima. Chiude la domanda «da chi si sceglie il feat» del punto 6.
   **E il feat conta sul pezzo**: alla registrazione restano `s.feat` (nome) e `s.featFama`;
   `songWeekly()` ci aggiunge la sua gente che ascolta (`featAscolti`, fama × 4 × (0,5 +
   q/170), stessa curva del resto) e all'uscita — stanotte o venerdì — l'hype prende
   `featHypeUscita` (fama × 0,08: fama 50 → +4). La stima degli stream di Fuori lo tiene in
   conto. Era il «feat con nomi più grandi» del foglio dell'hype, che finora non muoveva
   niente.
3. **Cover dentro all'Uscita, e qualità/ascolti divisi (E).** La linguetta Timing si
   chiama **Uscita** («com'è vestito, e quando esce»): la copertina grande, sotto al titolo
   «carica una foto» e «generane un'altra» (o «togli la foto»), e la proposta con conferma
   com'era — finché la proposta è in piedi il tasto «Mandalo fuori» sparisce, prima si
   decide la faccia. **La copertina adesso pesa**: non sulla qualità (una cover non fa un
   pezzo migliore) ma sugli **ascolti della prima settimana** — `coverResa()` in
   `covers.js`, da ×0,92 a ×1,12 dal seed (quindi «generane un'altra» è una scelta vera, e
   la resa si legge accanto), ×1,08 la foto tua; la legge `songWeekly()` con `age === 0`.
   E il **riquadro dei numeri** del foglio, che alla roadmap mancava: due righe, *QUALITÀ =
   Beat · Testo · Fonico · con X · Mix → q* e *ASCOLTI = Copertina · Venerdì · Anteprime ·
   la gente del feat · Hype · Fan*. Le parti le scrive `registra` sul pezzo (`s.parti`) e
   il mix le completa; un pezzo di un salvataggio vecchio mostra solo la q.
4. **Il pezzo sul banco (F2).** `G.studio.banco` è il seed del pezzo in lavorazione. Appena
   inciso è lui sul banco; Mix e Uscita si aprono su di lui (`studioSbloccato()` guarda il
   banco, non «esiste un pezzo») e si richiudono quando esce o va in cassaforte — si torna
   in Cabina, con la riga «fallo sapere». Le tre liste «I tuoi pezzi» di Mix, Cover e
   Timing sono una sola, «**Sul banco**», uguale in Cabina, Mix e Uscita, con la cassaforte
   sotto («ritira» rimette sul banco). Rimesso sul banco un pezzo già mixato, il Mix lo
   dice e manda all'Uscita. Le due caselle vecchie `mixa`/`esce` migrano al primo
   `studioDati()`: la prima che punta ancora a un pezzo diventa il banco, se no l'ultimo
   pezzo inciso e non uscito — chi riapre la partita trova Mix e Uscita come le aveva.
   Fuori dallo Studio (l'Agenda del telefono) `actions.js` ripiega sul migliore come
   sempre.

**Una cosa da sapere, ~~non risolta qui~~ risolta il 15/09/2026**: sotto i 1180px il
telefono della plancia non c'era, quindi «Che post fai?» non si raggiungeva e «fallo
sapere» lanciava la promo alla cieca sull'ultimo uscito. Adesso il telefono si alza a
schermo pieno anche da stretto e il tasto va lì: vedi «Il telefono quando lo schermo è un
telefono», più sotto.

Prove: 180 in `strumenti/prova.js` (i blocchi dello Studio e della classifica, riscritti
sulle cinque linguette: la promo sul telefono, le due porte del feat con il dado fermo,
la copertina in Uscita e la sua resa, il banco che si riempie, si svuota e migra) e un
blocco nuovo dell'audit, «Lo Studio a cinque linguette (14/09/2026)», sette controlli che
tengono ferma la riorganizzazione. Provato nel gioco vero con Playwright a 1440 e a 390px:
anteprima dal telefono, feat dalla classifica che dice sì, uscita → Cabina → «fallo sapere»
→ LaFamegram; niente errori in console, niente che sborda in larghezza.


---

## Sputa: la seconda app del telefono per postare

~~«crea un'altra app del telefono per postare»~~ **FATTO (15/09/2026)**

Accanto a LaFamegram — il finto Instagram, con foto, promo dei pezzi e storie — adesso c'è
**Sputa**, il finto X: solo testo, **140 caratteri**, niente foto, e si chiama come si
chiama la cosa che ci fai — sputare barre. Sta nella griglia del telefono dopo le otto app
della foto, con la piastrella nera e il glifo dorato come Notifiche (la foto non la
prevedeva), e si apre come le altre.

Cosa c'è dentro:

- **il foglio in cima**, col contatore dei caratteri e il tasto «Sputa». La barra esce
  subito in testa al feed, con il suo fuoco (cresce con hype e fan). Le tue restano sul
  dispositivo (`G.sputaMiei`, le ultime quaranta), come i post di LaFamegram scritti a
  mano: un `POST` sul server non c'è ancora, ed è lo stesso buco del punto *«LaFamegram con
  post veri, caricati dai giocatori»*;
- **le barre dei rivali** (`G.rivals`): ognuno ne sputa una o due a settimana, tirate a
  sorte ma **col dado fermo** — il seme è il rivale più la settimana — così riaprendo l'app
  trovi le stesse, e quelle di un giorno che deve ancora venire non ci sono ancora. Parlano
  del pezzo appena uscito se ce l'hanno (`hot`), dell'etichetta se l'hanno firmata
  (`deal`), della loro città, e **di te** quando il tuo nome gira abbastanza (hype 40+,
  top 20, o cinquemila fan): quelle hanno un filo arancione a sinistra. Si vedono questa
  settimana e la scorsa, in ordine di tempo, con «oggi», «ieri», «3 giorni fa»;
- **il fuoco** sotto alle barre degli altri è un tuo gesto e resta segnato
  (`G.sputaFuoco`), ma non muove numeri; **Rispondi** ti mette «@Nome» nel foglio e la
  risposta è una barra tua come le altre.

Cosa dà: **la prima barra del giorno fa girare il nome, +1 hype** (fino al tetto della
fase, e mai sotto a dove stavi). Le altre del giorno non danno niente — «la gente scorre
oltre», lo dice il riquadro — quindi non c'è un giro da sfruttare: è la stessa idea della
promo di LaFamegram, tenuta più semplice. Non costa energia: è il telefono, non lo studio.

Sta tutta in un file suo, `frontend/js/game/sputa.js` (caricato dopo `telefono.js`, si
registra da sola in `HUB_APP`), con lo stile in coda a `css/telefono.css` — come chiede il
punto sui file già presenti. `telefono.js` ha solo la riga che la apre in `schermataApp`.
Provato nel gioco vero con Playwright a 1440: feed con diciannove barre, risposta a un
rivale, prima barra +1 hype e la seconda no, fuoco che si accende e resta, stesse barre
riaprendo l'app, LaFamegram che funziona come prima, niente errori in console.

## Il telefono quando lo schermo è un telefono

> «Sul telefono la promo non si sceglie e l'anteprima non si raggiunge più» e «Sputa sul
> telefono vero non c'è» (problemi-riscontrati, 15/09/2026): stesso buco, il telefono della
> plancia sotto i 1180 px è nascosto. Una task sola.

**FATTO (15/09/2026)** — branch `task/telefono-sul-telefono`. Sotto i 1180 punti la
colonna del telefono non c'è — `hub.css` la toglie, la città vuole tutta la larghezza — e
con lei erano sparite tre cose del gioco: LaFamegram con «Che post fai?», l'anteprima del
pezzo e Sputa. Proprio sugli schermi degli store del telefono. Il paradosso era che sotto
i 1180 il codice disegnava ancora una «colonna compatta» (`renderTelefonoVecchio`,
`HUB_APP_VECCHIO`, una griglia sua con undici app) dentro a un contenitore che il CSS
teneva a `display:none`: lavoro fatto per nessuno, e le app nate dopo — LaFamegram, Sputa,
Notifiche, Trasferte — ci si dovevano iscrivere una seconda volta, ognuna a modo suo.

**La scelta: un telefono solo, che si alza.** Non una terza disposizione, non una pagina
nuova: lo stesso iPhone della foto, lo stesso `#hb-tel`, la stessa home e le stesse app.
Sotto i 1180 nella barra in alto, accanto al Menu, c'è un tasto col telefono e la pallina
rossa (la somma delle palline delle app: chat, notizie, obiettivi, notifiche, trasferte).
Lo tocchi e il telefono sale a schermo pieno sopra alla plancia, col guscio della foto
proporzionato allo schermo — su un telefono da 390 viene 366 × 741, cioè **il telefono è
il telefono**; su un portatile da 1000 è un iPhone in mezzo allo schermo. Si mette giù in
tre modi: il tasto «Metti giù» sotto al guscio, un tocco fuori, ESC (che prima chiude
l'app aperta e torna alla home, e solo dopo mette giù — e viene consumato, se no
`menu-sistema.js` apriva il menu di sistema sopra). Aprire un'app da fuori — «fallo
sapere» dallo Studio, una notifica — alza il telefono da solo: `telVaiApp` chiama
`telStrettoApri` se c'è.

**Dove sta.** Due file nuovi, come chiedono i punti «crea un file nuovo collegato ai già
presenti» e «tieni tutto ciò che riguarda la parte smartphone separata dal resto del
progetto»: `frontend/js/game/telefono-stretto.js` (il tasto, l'alzare e il mettere giù, la
pallina, ESC) e `frontend/css/telefono-stretto.css` (la sovrapposizione, il guscio a
misura, il tasto). Togliendo i due file si torna alla plancia di prima. `telefono.js` sa
solo due cose: che aprire un'app può voler dire prima alzare il telefono, e che dopo ogni
ridisegno c'è una pallina da aggiornare. La colonna compatta è **tolta** — da
`telefono.js`, dal CSS, e dalle iscrizioni in `sputa.js`, `eventi-v2.js` e
`trasferte.js` — e con lei i controlli dell'audit che la descrivevano, sostituiti da
quattro sulla regola nuova. `studioFalloSapere` non ha più il ramo cieco: passa sempre dal
telefono.

**Tre cose trovate strada facendo.** Le misure del guscio sono in `cqw` del contenitore
`.ptel`, che alzato è tutto lo schermo: il telefono veniva una pastiglia con gli angoli da
124 punti — il rimedio è il margine interno laterale di `.ptel`, che riporta la sua
larghezza di contenuto a quella del guscio. La pastiglia del tempo sta nella barra a
z-index 142, sopra a tutto, modale compresa: col telefono alzato galleggiava sullo schermo,
e siccome il telefono non deve salire sopra alla modale (un evento che esce mentre posti si
deve vedere) è la pastiglia che si nasconde. E il secondo ESC apriva il menu di sistema:
`dialogoFlottante()` in `menu-sistema.js` adesso conosce anche il telefono alzato.

Provato nel gioco vero con Playwright a 390 × 844, 1000 × 700 e 1400 × 900: tasto nella
barra solo sotto i 1180, apertura, Sputa dalla griglia, ESC in due tempi senza menu di
sistema, «fallo sapere» dallo Studio che alza il telefono su LaFamegram con «Che post fai?»,
tocco fuori che mette giù; nessuno scorrimento orizzontale, nessun errore in console. A
1400 niente è cambiato.

**Il giro di chiusura** (`segnala-problemi` e `prova-sul-telefono`, dieci voci, nove sistemate
prima del push): dentro al telefono alzato i bersagli salgono ai 44 di tocco e i caratteri a
12-15 (solo da alzato: la colonna dai 1180 in su non cambia); di traverso (844 × 390) il guscio
lascia le proporzioni dell'iPhone e si allarga fino a 560, la home scorre; ESC non mette giù il
telefono se sopra c'è un'altra finestra (modale, Trasferte, orologio…) e due ESC di fila lo
mettono giù davvero; «APRI» sulla fascia di LaFamegram alza il telefono; la pallina del tasto si
accorge di una notifica appena arrivata; il fuoco da tastiera entra nel telefono e torna al
tasto; il Menu accanto al tasto è alto 44; le scene delle azioni scorrono quando sono più alte
dello schermo (`effects.css`). **Fra i 981 e i 1180** — tablet di traverso — la barra in alto
trabocca già di suo (1100 punti in 1000) e il tasto in coda finiva fuori: lì il tasto
**galleggia** in basso a destra, finché quella barra non avrà un disegno suo. Resta da decidere
se il gioco sugli store gira anche in orizzontale.

## Le transizioni video: il primo, lo Studio

> «Implementa le transizioni dentro al progetto, che partano cliccando sulla scheda
> collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo» (CARLO, nel
> foglio dei punti nuovi). Cinque video su dodici; qui il primo.

**FATTO in parte (16/09/2026)** — branch `task/prima-transizione-video`. Toccando «Studio»
sulla mappa — dopo il «Vai · 30 min» dello spostamento, o subito se sei già lì — partono i
5,6 secondi di `01_studio_definitivo.mp4` (il ragazzo dietro al vetro, il banco, le luci
calde) e alla fine sotto c'è la Cabina, che ha la stessa luce: il filmato sfuma e la stanza
resta. I video stavano in `frontend/media/video/Transizioni di scena/` dal 05/09 e
**nessuna riga di codice li caricava**: 28 MB che viaggiavano nel pacchetto per gli store
da peso morto.

**Com'è fatto.** Un file nuovo, `js/game/transizioni-video.js` (la regola: quando non è
un fix si crea un file collegato, non si gonfiano quelli che ci sono), con dentro una
tabella `TRANSIZIONI_VIDEO` — per ora una riga, `studio` — e una funzione sola,
`transizioneVideo(id, poi)`: il filmato copre lo schermo, quando finisce chiama `poi()`
(che apre la pagina) e poi sfuma sopra di lei. In `hub.js` il cartello dello Studio fa
`transizioneVideo("studio", () => apriStudio(...))` invece di `apriStudio(...)` diretto:
gli altri quattro si aggiungono con una riga nella tabella e la stessa chiamata al posto
giusto. Il CSS è `css/transizioni-video.css`: `.tvid` a z-index 150, sopra allo Studio
(55) e al foglio (90) che si aprono *sotto* al video prima della dissolvenza, sopra al toast
(130) e alla pastiglia dell'orologio (142), sotto alla Strada e al menu di sistema;
`object-fit:cover`, come le foto dello Studio. Il server di sviluppo adesso serve
`.mp4` e `.webm` col tipo giusto (`strumenti/dev.js`): senza, Chrome lo indovina e
Safari no.

**Le tre regole, tutte per non far aspettare chi gioca.**

1. **La mappa resta finché il video non va davvero.** La copertura nera compare all'evento
   `playing`, non al clic: se dopo un secondo e mezzo il video non è partito — rete lenta,
   file mancante, formato che il browser non legge, data saver che ignora il `preload` —
   si apre la pagina e basta. Mai uno schermo nero davanti a un tasto appena premuto. Ma
   nell'attesa la mappa **non risponde**: una copertura trasparente (`.tvid.attesa`) prende
   i tocchi — il primo giro di controllo aveva visto che due tocchi svelti aprivano due
   posti uno sopra l'altro — e il secondo tocco salta l'attesa e apre la pagina subito. La
   stessa rete di sicurezza si arma una volta sola anche dopo la partenza (durata + 0,8 s),
   per gli stream troncati o un telefono che non ce la fa: `playing` torna a ogni ripresa
   dopo un buffering, e se il timer ripartisse ogni volta un video che inciampa non finirebbe
   mai.
2. **Con le animazioni spente non parte.** `SET.look.anim` è la stessa manopola di
   `html.ridotto`: chi l'ha spenta non vuole cinque secondi di filmato. Vale anche per
   «riduci movimento» del sistema (`prefers-reduced-motion`), che il resto del gioco già
   rispettava. L'audio segue `SET.audio.on` e il volume degli effetti.
3. **Si salta**: un tocco, un clic o Esc chiudono il video e aprono subito la pagina. Per
   l'Esc la copertura sta nella lista delle finestre che il menu di sistema rispetta
   (`dialogoFlottante` in `js/menu-sistema.js`, che ascolta il tasto in cattura e se no
   lo ferma e apre il menu di pausa sopra al video — era così al primo giro).

**Il download.** Caricare i dodici video all'avvio sarebbero 28 MB per chi magari in un posto
non ci va mai. Il filmato di un posto si prepara (`preload`) quando il puntatore passa sul
suo cartello o al `touchstart`; quello dello Studio, il posto dove si va di più, si prepara
comunque quattro secondi dopo l'avvio a pagina ferma (`TRANSIZIONI_PRECARICA`), perché col
dito non c'è nessun «passarci sopra» e un secondo e mezzo non basta a un download freddo — da
Chrome vero, sulla rete locale, il primo `canplay` arrivava a 3 secondi.

**Provato** con Playwright sul Chrome installato (non su quello di Playwright, che decodifica
l'H.264 a software e balbetta): a caldo il video parte in 10 ms e finisce a 5,6 s, poi lo
Studio; a freddo senza precarica salta e apre lo Studio a 1,5 s; il clic a metà lo salta, e
l'Esc pure, senza menu di pausa; nell'attesa (rete lenta, video non precaricato) sotto al dito
sul cartello della Pizzeria c'è la copertura, e il tocco apre lo Studio e non la Pizzeria; a
390 × 844 sopra all'orologio c'è il video; con le animazioni spente o «riduci movimento» lo
Studio si apre diretto. L'audit controlla che il file esista, che la pagina lo carichi prima
di `hub.js`, che il cartello dello Studio passi di lì, che la copertura stia sopra
all'orologio e sotto alla Strada, che il menu di sistema la riconosca e che la copertura
d'attesa ci sia. I quattro problemi del giro di fine task del 16/09 (problemi-riscontrati)
sono chiusi qui dentro, prima del commit.

**Cosa mancava:** gli altri quattro video del punto, agganciati il 20/09 — la sezione qui
sotto — e una decisione sui sette che nessun punto chiede, che resta fra le decisioni di
`implementazioni.md`.

## Le transizioni video: gli altri quattro — la Sala, Casa, stacca la spina, registra

> Lo stesso punto di CARLO: «il secondo quando clicca su "sala", il terzo quando decide di
> tornare a "casa", il quarto su "stacca la spina", il quinto su "registra un pezzo"».

**FATTO (20/09/2026)** — branch `task/transizioni-video-le-altre`. Il punto è chiuso: i
cinque video che chiede sono tutti collegati. File: `js/game/transizioni-video.js` (la
tabella, con quattro righe in più e due tabelle piccole), `js/game/hub.js` (i due cartelli),
`js/game/luoghi-foto.js` (la mossa), `js/game/studio-elementi.js` (la take),
`strumenti/audit-regressioni.js` (sei controlli in più nel blocco delle transizioni).

**Dove partono.** Guardati fotogramma per fotogramma prima di agganciarli, perché il nome
del file non basta a dire cosa c'è dentro:

- **La Sala** (`02_ingresso_sala`: la strada, il portone, la stanza coi computer) sul
  cartello «La Sala», prima di `apriPosto()` — come lo Studio.
- **Casa** (`03_ritorno_casa`: la via di notte, le scale, il salotto) sul cartello «Casa»,
  prima di `apriLuogo("casa")`.
- **Stacca la spina** (`04_stacca_la_spina`: entra in salotto, si siede, la tele) non su un
  cartello ma **sulla mossa**, da dovunque parta — la porta di Casa, l'agenda del telefono,
  la card «Piccolo party» della sera. Il posto giusto era già lì: l'incarto di `mostraScena`
  in `luoghi-foto.js`, che dal 19/09 manda l'esito di quella mossa sulla foto del divano. La
  mossa è già fatta quando il filmato parte (i numeri sono cambiati, il salvataggio pure): il
  video sta fra il tasto e l'esito, e a filmato finito la pagina si apre con «Ti sei
  fermato. Benessere +13…». Sotto i 1180, dall'agenda, il telefono resta alzato sotto alla
  copertura trasparente dell'attesa e si mette giù quando la pagina si apre.
- **Registra** (`05_registra_pezzo`: il microfono, il foglio sul leggio, il banco) **sulla
  prima take del pezzo** in Cabina, non su «Tieni questa e chiudi» e non su ogni take: la
  prima è quella in cui si entra in cabina, le altre cinque ripetono, e sei filmati per un
  pezzo non li vuole nessuno. L'energia è già scalata quando parte; il tiro di dado della
  take arriva a filmato finito (o al tocco che lo salta).

**Il download, con cinque video.** Il puntatore sul cartello prepara il filmato di quel
posto, ma i cartelli hanno un id loro (`beat` per la Sala, `vita` per Casa): la tabella
`TRANSIZIONI_CARTELLI` traduce. E le due mosse non hanno un cartello su cui passare: quando
un filmato finisce si prepara quello che può venire subito dopo nella pagina appena aperta
(`TRANSIZIONI_DOPO`: dopo lo Studio si prepara «registra», dopo Casa «stacca la spina»), a
dissolvenza finita — cambiare `src` mentre il filmato sfuma lo farebbe sparire di colpo.
Chi arriva allo «stacca la spina» dall'agenda senza passare da Casa ha la regola di sempre:
un secondo e mezzo, poi la pagina e basta.

**Una cosa trovata agganciando la Sala.** L'elemento video è uno solo, e la precarica dello
Studio quattro secondi dopo l'avvio gli cambiava `src` anche se in quei quattro secondi
avevi toccato la Sala: il filmato della Sala si tagliava lì, e lo schermo restava nero fino
alla rete di sicurezza. Era così anche prima (con lo Studio solo, il caso era «tocchi lo
Studio prima dei quattro secondi» e la precarica trovava lo stesso file: non si vedeva).
Adesso `transizioneVideoPrepara` non tocca niente mentre un filmato va (`TVID_CORRENTE`).

**Provato** con Playwright sul Chrome installato, a 1440 × 900 e a 390 × 844: la Sala e
Casa partono al cartello e a 5,6 s si apre la pagina sotto; dopo Casa il video pronto è
`04_stacca`, dopo lo Studio è `05_registra`; lo «stacca la spina» dalla porta di Casa e
dall'agenda del telefono passa dal filmato e finisce sull'esito (benessere 80 → 93); la
prima take in Cabina passa dal filmato, la seconda no (take 1 → 2 senza copertura); con le
animazioni spente la Sala si apre diretta; l'Esc a metà del filmato della Sala apre la Sala
senza menu di pausa. 409 controlli dell'audit, tutti verdi.

**Da decidere** (in `implementazioni.md`, fra le decisioni): i sette video che nessun punto
chiede — palestra, Milano, club, shop, trasferta, live, più
`video_transizione_entrata_in_studio` che è un doppione dello studio — 22 MB che nel
pacchetto per gli store viaggiano ancora per niente. O si collegano (la palestra, il club e
lo shop hanno un cartello; il live è una mossa; Milano e la trasferta sono i viaggi) o
escono da `media/`.

**Il giro di fine task** (problemi-riscontrati, voci 47–51, tutte chiuse nel branch) ha
trovato quattro cose nel gioco e una nel foglio. La copertura del filmato prendeva i tocchi
ma **non il fuoco**: un Invio subito dopo il clic premeva di nuovo il tasto sotto (una
seconda take pagata come seconda sessione, la mossa fatta due volte) — adesso la copertura
prende il fuoco, Invio e spazio saltano il filmato come un tocco, Tab non gira per la pagina
sotto. Il tasto **«Anni di Fame»** apriva il menu di sistema sopra al filmato (dallo Studio
del 16/09): i tre tasti della barra sono inerti col filmato in corso, come «MAPPA» già era.
Nell'**attesa** che il filmato dello «stacca la spina» partisse, la pagina sotto si
ridisegnava già fatta («la seconda volta oggi recupera meno», il tasto d'oro ancora lì): fra
il tasto e il filmato la pagina resta com'era (`LUOGO.attesa`). E arrivando allo «stacca la
spina» **dall'agenda o da una card** i due numeri grandi erano «—» — non del branch, dal
19/09: la fotografia dei numeri la faceva solo il tasto sulla pagina; adesso
`luoghi-foto.js` incarta anche `avviaAzioneDiretta` e la fa da ogni strada. Quattro
controlli in più nell'audit, 413 verdi.

## Le pagine dei posti sulla loro foto: Casa, Palestra, Live Club, stacca la spina

> «Aggiungi le foto di background dei posti senza HTML, poi ricrea la schermata identica
> alle foto con elementi HTML» (CARLO, nel foglio dei punti nuovi). Lo Studio l'08/09; qui
> gli altri.

**FATTO (19/09/2026)** — branch `task/pagine-luoghi-foto`. Le sei foto di riferimento che
restavano (`media/photo/schermate_luoghi/`) erano di posti che non avevano una pagina che
le caricasse: Casa, Palestra e Live Club erano una finestra con due risposte, lo «stacca la
spina» e la palestra finivano nella scenetta disegnata di `scene-art.js`, la Piazza aveva
un cielo disegnato. Adesso ognuno è una pagina come lo Studio: la foto riempie lo schermo,
la fascia in alto dice dove sei e cosa hai, e sopra alla foto ci sta quello che nel
riferimento ci sta davvero.

**Com'è fatto.** Un elemento solo in `gioco.html` (`#luogo`), riusato da quattro pagine;
un file nuovo, `js/game/luoghi-foto.js` (la regola dei punti che non sono fix), con la
tabella `LUOGHI_FOTO` — foto, ritaglio, le tre voci della fascia — e una funzione per
pagina che restituisce le tre colonne (o le porte, per la Casa); `css/luoghi-foto.css` per
il guscio e per quello che lo Studio non ha, i blocchi per il telefono in `stretto.css`. Il
telaio è quello di `studio.css`: gli stessi pannelli (`stPan`), le stesse righe di scelta
(`stScelta`), lo stesso tasto d'oro, perché le foto sono fatte dalla stessa mano. `hub.js`
cambia solo i tre `vai` dei cartelli (`apriLuogo("casa" | "palestra" | "live")`);
`menu-sistema.js` e `tempo-controlli.js` imparano che la pagina esiste (dove sei, «Torna
alla mappa», l'orologio muto come nello Studio).

- **Casa** (`casa_di provincia_definitiva`): la cucina, con quattro porte sopra alla foto
  messe dove sta la cosa nella stanza — il tavolo, la camera, il divano — in percentuale
  dello schermo: bottoni che si vedono, col bordo d'oro, non zone trasparenti. «Vai in
  camera» è la notte di `saltaGiorni(1)` con la stessa conferma di «Salta avanti»; «i
  conti di casa» era la seconda risposta della vecchia finestra e non si butta. Sul
  telefono le porte vanno in colonna in fondo, dove sta il pollice: a 390 punti la stanza è
  ritagliata a metà e quattro targhette sparse coprirebbero tutto.
- **Stacca la spina** (`stacca_la_spina`): una scena senza scelte, come la voleva il
  README delle pagine-azioni — il titolone, «Dormi, mangi, vedi gente normale», i due numeri
  (prima quelli che la mossa promette, dopo quelli veri, letti dalla differenza), un tasto.
  Continua riporta in cucina. La foto è il divano di giorno o di sera secondo
  `GAME_TIME.band()`: è l'unica ragione per cui esistono tutte e due.
- **Palestra** (`palestra`): la foto di riferimento è pulita, quindi in mezzo ci sta la
  scelta Pesi/Cardio che stava nel cartello, a sinistra la serie — `palestraMoltiplicatore()`
  esisteva e non si vedeva da nessuna parte — e a destra la giornata («ci sei già stato
  oggi»).
- **Live Club** (`concerto_live`): la scaletta dei pezzi fuori a sinistra, «stasera» a
  destra — chi c'è, cioè la gente della Sala che conosci, tre a serata col criterio di
  `presentiOggi()`, e l'incasso stimato con la stessa formula di `live` — in mezzo palco o
  piazza, con il perché se non si può.
- **La Piazza** (`freestyle_in_piazza`): la pagina c'era già (`piazza.js`) e resta com'è;
  sotto ha la foto del sottopasso, e i pannelli diventano vetro scuro come quelli dello
  Studio. La foto va scritta nello stile dell'elemento, non in una variabile CSS: un
  `url()` dentro a una variabile Chrome lo risolve rispetto al foglio (`css/media/…`), e
  la prima prova l'ha caricata da lì, 404.

**Le mosse non cambiano.** Sono quelle di `actions.js`, partono da `avviaAzioneDiretta()`
come dai cartelli, e passano dalle stesse guardie (posto, orario, energia). Quando una di
quelle quattro (`stacca`, `palestra_pesi`, `palestra_cardio`, `live`) finiva nella scena a
pagina piena (`mostraScena`, ui.js) adesso finisce sulla sua foto — anche se parte da una
card di «Eventi e attività di oggi» o dall'agenda: la pagina si apre da sola e «Continua»
la richiude. `mostraScena` e `renderGioco` sono incartate una volta sola in
`luoghi-foto.js`, come fa già `interruzioni.js`: lo Studio ottiene lo stesso con un
`renderStudio()` scritto a mano dopo ogni `renderGioco()`, otto posti in cinque file, e il
README delle pagine-azioni spiega perché non si rifà. Il tasto d'oro legge anche l'orario
del posto (`GAME_HOURS.actionStatus`): «Apre alle 20:00» sotto al tasto spento, invece
della finestra dopo averlo premuto.

**Provato** con Playwright a 1440 × 900 e 390 × 844: le quattro pagine aperte dai cartelli;
i pesi fatti dalla pagina, l'esito sulla foto («Serie pesante: benessere +14, presenza
+0,6»), Continua che resta in palestra; il club chiuso alle 08:00 col tasto spento e
«Apre alle 20:00», aperto alle 22:15, la serata fatta e l'esito; il freestyle veloce che
aggiorna la fascia (l'ora, l'energia) senza ridisegnare a mano; la Piazza giocata con la
foto sotto; lo stacca la spina dalla cucina, l'esito coi numeri veri e Continua che torna
in cucina; la stessa mossa da una card che apre la pagina e la richiude; «Torna alla
mappa» dalla fascia; «Vai in camera» che chiede conferma e passa alla mattina dopo; sul
telefono nessuna pagina trabocca in orizzontale. L'audit («Le pagine dei posti sulla loro
foto») controlla l'ordine dei file, che ogni foto della tabella esista, i tre cartelli, le
quattro mosse in `SCENA_PIENA`, i due elenchi scritti a mano, il piano (55), la foto della
piazza nello stile, l'orario sul tasto, il ridisegno in un posto solo e i blocchi stretti.
Le quattro foto senza interfaccia sono uscite dalla lista delle «in attesa» dell'audit con
un nome vero (`casa_divano_giorno`, `casa_divano_sera`, `live_club`, `piazza_freestyle`).

**Cosa manca:** la serata del club giocata a momenti, come nel riferimento («al terzo pezzo
uno in fondo comincia a parlare sopra», tre risposte, la gente che sale o scende, «cambia
ordine» nella scaletta): è il minigioco della Piazza rifatto per il palco, e ha la sua voce
nel foglio dei punti nuovi.

## L'avvio rapido: la schermata «Preparo il tuo artista»

> «L'avvio rapido ci mette quasi due minuti, e nessuno lo dice al giocatore»
> (problemi-riscontrati, 13/09/2026): «o si mostra che sta caricando, o l'avvio rapido
> torna a non aspettare MakeHuman».

**FATTO (19/09/2026)** — branch `task/avvio-rapido`. Dal 12/09 (`fb2b8d8`) l'avvio rapido
non mette più un avatar finto: apre il creator nascosto, il creator apre il camerino
MakeHuman, il camerino scarica il modello del corpo (`targets.bin`, 145 MB), lo
costruisce, applica un preset maschile, veste il personaggio e scatta la foto; solo allora
partono nome, città, storia e la cinematic. In tutto quel tempo, dalla scomparsa del
caricamento della pagina alla cinematic, si vedeva un rettangolo nero: il creator era
nascosto apposta (`visibility:hidden`, niente flash dell'avatar vuoto) e nessuno aveva
messo qualcosa al suo posto.

**Quanto ci mette davvero.** Prima di scegliere fra le due strade l'ho misurato, con i
tempi di ogni fase (uno script Playwright che ascolta i messaggi della catena):

- su **Chrome vero, con la scheda video**: il camerino parla a 0,8 s, `targets.bin` è
  dentro a 1,9 s (dal server locale), il personaggio vestito e fotografato a **8,6 s**;
  poi 17 s di cinematic (è la sua durata, `playCareerIntro`) e la città a 26 s;
- nel **Chromium senza GPU delle prove automatiche**, che disegna il 3D a software: la
  stessa catena arriva alla foto in 38–73 s (un blocco solo del thread, da 45 s: la
  ricostruzione della scena con i vestiti e la foto, `WebGLRenderer.render` e
  `makePreviewImage` nel profilo), poi la cinematic in ritardo e 7 s per buttare via
  l'iframe del camerino: 100–150 s dal clic alla città.

I «quasi due minuti» del 13/09 erano stati misurati con quel browser: **il giocatore, su
un computer normale, aspetta nove secondi**. Non nove secondi di nero, però: la seconda
strada («torna a non aspettare MakeHuman») avrebbe rimesso l'avatar finto per un'attesa
che sulla macchina di un giocatore è corta, e si è presa la prima.

**Com'è fatta.** `#preparo` in `gioco.html`, `js/preparo.js` e `css/preparo.css` (file
nuovi, la regola dei punti che non sono fix): sta sopra al creator (1 000 000 contro
999 999) e ha la stessa faccia di `#avvio` — il marchio, «Preparo il tuo artista», una
riga con la fase, una barra e il tempo che passa. **Le fasi sono quelle vere**, non
inventate: il motore dei modifier (`modifier-engine.html`, `log`) e il camerino
(`runtime.js`, `setStatus`, più tre righe nuove dentro ad `adfMhApplyPreset` — vesto,
modello, ricostruisco — e «Scatto la foto») le mandano al creator con
`adf-makehuman-progress`; il creator, solo durante l'avvio rapido, le rilancia al gioco
come `adf-rpg-v24-quick-makehuman-progress`; `gioco-ingresso.js` le passa a
`ADF_PREPARO.fase()`, che le mette in fila su sei tacche (apro il camerino · lo carico ·
scarico il modello del corpo · costruisco il personaggio · scelgo il look e scatto la
foto · si entra) e non torna mai indietro. La barra è a tacche e non a percentuale per
la stessa ragione scritta sopra a `#avvio`: la percentuale del download il motore non la
sa. Dopo 25 secondi esce da sola, in CSS, la nota «la prima volta ci mette un po'» (il
modello del corpo si scarica una volta). Quando arriva `quick-makehuman-ready` la
schermata sfuma e sotto c'è già la cinematic.

**Se si rompe, non resta il nero.** Tutte le uscite di errore della catena
(`fallisci`, il creator che non risponde all'appello, il profilo che non si completa)
passano da `preparoFallito()`: la schermata dice cos'è successo, da quanto, e dà tre
tasti — **Riprova** (la stessa pagina da capo), **Fallo a mano** (il creator normale, che
sotto c'è già), **Torna al menu** (con lo slot provvisorio ripulito). In più una rete di
sicurezza nuova: il camerino parla entro un secondo, quindi **se in venti secondi non ha
detto niente** (runtime.js che non arriva, un errore prima della prima riga) si dichiara
subito, invece di aspettare i due minuti del limite di sempre — che resta, perché sulle
macchine senza GPU la ricostruzione è un blocco muto da un minuto.

**Provato** su Chrome vero (headed) e sul Chromium delle prove: le fasi in fila, la
schermata via alla cinematic, la città dopo; con `runtime.js` bloccato la schermata
d'errore a 20 s con i tre tasti, e «Fallo a mano» che scopre il creator. L'audit
(«L'avvio rapido — la schermata «Preparo il tuo artista»») tiene insieme i quattro
anelli della catena, l'ordine dei file, il piano sopra al creator, le tre strade e il
limite dei venti secondi.

**Il giro di fine task (19/09)** ha trovato sette cose, chiuse nello stesso branch: la
sesta tacca che non si accendeva («PRONTO:» prendeva anche «pronto per entrare»); «Fallo a
mano» che lasciava il camerino rotto sopra al creator e l'avvio rapido acceso (adesso il
gioco manda `quick-makehuman-cancel` e il creator lo spegne); il lettore di schermo che
leggeva il contatore ogni secondo (parla solo la fase); i tre tasti senza fuoco («Riprova»
lo prende); l'errore senza creator che contava dal 1970; il limite dei due minuti, che
adesso è «senza notizie» e riparte a ogni fase; e la prova `@lento`, che ora vuole la
schermata accesa con una fase e nascosta alla fine. Le quattro righe del preset (vesto,
modello, ricostruisco, scatto la foto) si leggono sotto alla quinta tacca.

**Cosa resta, e non è di questo punto:** sulle macchine senza GPU la ricostruzione con i
vestiti è un blocco unico del thread da 45–70 s (il profilo lo mette tutto in
`WebGLRenderer.render` e nel `readPixels` della foto); lì il contatore della schermata si
ferma con lui. È il camerino, non l'avvio rapido, e conta solo dove il 3D va a software.

---

## L'evento fatto esce dall'agenda

> **FATTO (20/09/2026)** — branch `task/piccole-agenda-beat-parametri-licenziarsi`, una
> delle quattro piccole chiuse insieme. File: `frontend/js/game/agenda.js`
> (`onora`, `consumaPeso`) e `frontend/js/game/actions.js` (il «Piccolo party»).

Il punto di CARLO: *«se partecipo ad un evento segnato, dopo che ho partecipato l'evento si
toglie automaticamente dall'agenda e non deve essere più segnato»*.

**Com'era.** Quando giocavi un evento segnato, `consumaPeso()` in `agenda.js` segnava solo
`bonusUsato` sulla voce della settimana, per non dare due volte il bonus. La voce restava
lì: la sera la trovavi ancora segnata sulla card come se dovessi ancora andarci, l'app
Agenda del telefono la elencava, e — la cosa peggiore — **il salto del tempo si fermava**
per un appuntamento che avevi già onorato, perché `bloccoSalto()` guarda le voci e non sa
niente di `bonusUsato`.

**Com'è.** `consumaPeso(id)` adesso legge il peso e poi chiama `onora(id)`, che toglie
dall'agenda **tutte le voci di oggi con quel nome**, di oggi o della settimana. Quelle di un
altro giorno non si toccano: non le hai ancora onorate. Il peso si legge *prima* di togliere
la voce, perché è lei a dire che oggi l'evento vale di più. `bonusUsato` non si scrive più
(la voce non c'è più), ma il filtro che lo legge resta per i salvataggi vecchi.

I sei eventi che passano di lì sono gli stessi di prima — `promo`, `live`,
`palestra_pesi` in `actions.js`, `free` in `piazza.js`, `sala` in `posto.js`, `colpo` in
`strada-crimine.js` — più uno nuovo: il **«Piccolo party»** della plancia è la mossa
`stacca`, e non passava dall'agenda perché non ha un peso settimanale. Adesso la chiama
anche lui, e la voce se ne va.

`onora` sta anche in `window.AGENDA`, per chi dovesse chiudere un appuntamento senza
passare dal peso. L'audit («Le quattro piccole del 20/09») controlla che `consumaPeso`
passi da `onora`, che `bonusUsato` non si scriva più e che tutte e sette le mosse
chiamino l'agenda.

**Il giro di fine task (20/09)** ha trovato tre cose, chiuse nello stesso branch:

- **il bonus si riprendeva nello stesso giorno** — tolta la voce, la card tornava su
  «segna», la risegnavi e il peso tornava intero. Adesso `G.agenda.onorati` tiene le
  chiavi `anno:settimana:giorno:tipo:id` di quello che hai onorato oggi (`onora` le
  scrive, `pulisci` butta quelle di ieri): `vociDaConsumare` torna vuoto se la settimana è
  già onorata, quindi il peso è 1, e `passata()` dice «passato», quindi la card non si
  riaccende. I salvataggi di prima non hanno `onorati` e partono da vuoto;
- **la voce restava se l'evento non passava dal codice del peso** — il colpo si onorava
  solo se riusciva (adesso il peso si legge prima del dado: ci sei andato anche se va
  male), e alla Sala solo con la sessione a pagamento (adesso farsi sentire un beat chiama
  `onora("sala", "oggi")`: chiude il «Producer session» di stasera ma non la «Sessione
  lunga» della settimana, che vuole la sessione vera). Il «Piccolo party» di mattina non
  era un problema: `orari.js` apre «Stacca la spina» solo dalle 00:00 alle 04:00;
- **`npm run prova` era rosso** — il test «parte da zero» chiedeva le skill a 0. E la
  verifica che avevo dato per verde era `npm run verifica | tail`: l'exit code letto era
  quello di `tail`. Rifatta senza il tubo, tutta verde.

Provato fuori dal browser (`vm`): segna → gioca → 1,3 e la voce via → risegna → 1; il
beat alla Sala chiude l'evento di oggi e lascia quello della settimana col suo 1,2; il
giorno dopo gli onorati spariscono; l'open mic giocato di lunedì non tocca quello
segnato per sabato.

## La fascia della plancia fra 980 e 1240, e la plancia a 1280 × 800

> **FATTO (20/09/2026)** — branch `task/barra-plancia-980-1180`. File: `frontend/css/hub.css`
> (i blocchi dei 1240, 1120, 1520 e il blocco degli schermi bassi), `frontend/css/stretto.css`
> (i blocchi dei 980, 620 e 400, le testate dei posti) e `frontend/js/game/tempo-controlli.js`
> (la piazza e il foglio fra i contesti muti).

La voce di problemi-riscontrati del 15/09: *«Fra i 980 e i 1180 punti la barra della plancia
trabocca»* — 1237 punti di contenuto (logo 132, città 190, sei risorse 584, la pastiglia del
tempo 224, Menu 107) in una fascia che sotto i 1240 non ce li ha, e nessuno se ne occupava
fino ai 900 di `stretto.css`; e sotto i 980 la fascia alta 307 su 844, un terzo dello
schermo. Chiudendola è venuto fuori che **la plancia non era a posto neanche sul computer**
alle misure più comuni, e si è chiuso anche quello.

**La fascia in alto, per gradi.** Sopra i 980 si stringe senza andare a capo: sotto i 1240 il
Menu è la sola casetta (la parola la dice il `title`), logo e città perdono un po' di fianco;
sotto i 1120 le risorse restano icona e numero, l'energia tiene la sua barretta perché è
quella che si guarda, il benessere si legge nel profilo. Fra 901 e 980 va a capo: prima riga
logo, città, pastiglia, telefono e Menu, seconda riga le sei risorse in fila — e la riga
della griglia cresce con lei, se no la seconda riga finiva sopra alla città. Sotto i 620 tre
righe in tutto, un quinto dello schermo e non un terzo: logo, pastiglia rimpicciolita ai
nove decimi con `transform` (è un bottone disegnato con misure fisse dentro a uno stile suo,
che sotto i 620 la fa già 168 × 54 — ai sette decimi del primo giro era 105 × 38 con le
scritte da 4,7 punti, illeggibile), telefono e Menu; poi la città con la fase; poi le sei
risorse su tre colonne. A 390 × 844 la fascia è alta 159, era 307. Fra 981 e 1180 il tasto
del telefono, che galleggiava in un tondo in basso a destra perché la fascia traboccava,
torna nella barra: la fascia ci sta, e il tondo copriva la settimana.

**Le testate dei posti** (la Sala, lo Shop, la Piazza e il foglio della strofa) sotto i 620:
la pastiglia ai nove decimi come nella plancia, MAPPA se ne va (in quelle fasce c'è già la X,
che fa la stessa cosa), il marchio a 96 e sotto i 400 la sola corona da 44. La Sala scorreva
di lato di cento punti a 390, lo Shop di centoquattordici, il foglio di sessanta con la X
fuori dallo schermo. Il Negozio non c'è: `#negozio` non sta in `gioco.html` e `negozio.js` è
dormiente — quando tornerà avrà la sua riga. E la piazza e il foglio sono muti in
`tempo-controlli.js`: non montano la pastiglia da nessuna parte, e sotto i 900 — dove il
palco smette di essere un contesto suo — quella dell'hub, con il suo z-index 142,
galleggiava sopra al titolo del freestyle.

**La plancia sul computer, a 1280 × 800, 1366 × 768, 1440 × 900.** Due cose che a 1920 × 1080
non si vedono e a queste misure sì:

- **le quattro card degli eventi erano larghe 91 punti** a 1280 (466 a 1366, 500 a 1440
  divisi in quattro): la colonna centrale, tolte le due ai lati (320 + 310 di minimo) e la
  colonna della settimana (184), non aveva i 200 punti a card per cui erano disegnate —
  titoli su tre righe tagliate, «ALLE 21:00» a metà. Sotto i 1520, dove scendono sotto i
  150, stanno **su due righe e due colonne** (`display:grid` sulla riga, la settimana a
  destra alta due righe), e ogni card tiene il titolo su una riga con i puntini e il piede
  con l'ora e il tasto, che sono le due cose per cui esiste; descrizione ed elenco, che qui
  erano già tagliati, se ne vanno. L'altezza della fascia non cambia. A 1280 le card sono
  202 × 56, a 1366 245 × 56, a 1440 263 × 66;
- **stile, fan base, pezzi fuori e contratto sparivano** sotto gli 820 di altezza: `.psx` è
  una colonna flex che scorre (ha la sua barra sottile), e a cedere erano le due scatole
  `.pdue`, le sole con `overflow:hidden`, schiacciate a due punti d'altezza — nel profilo
  restavano due righe vuote. `flex:none`, e la colonna scorre come era pensata; il blocco
  degli schermi bassi, che era «sotto i 760», è «sotto gli 820» e stringe anche il
  ritratto (126 × 150 → 104 × 124) e l'aria fra i blocchi: a 800 ci sta tutto senza
  scorrere, a 768 scorre di 27, a 720 di 68.

E con la colonna a 280 (sotto i 1180) «0 su 5 curati» andava a capo: la barretta cede, il
valore no. Sul telefono, sotto i 620, la riga piccola sotto al nome di una scelta dello
Studio (e della Sala, della Casa, della Palestra, che usano le stesse righe) va a capo su
due righe invece dei puntini — a 360 nella Palestra faceva «16 ene…» — e il valore a destra
(«+lucidità · +benessere») può andare a capo invece di comprimere il nome a «Cardio legge…».

**Come è stato provato.** Un banco Playwright nello scratchpad (non nel repo) che apre le
venti schermate del gioco — plancia, telefono alzato, agenda, le cinque dello Studio, Sala,
Shop, piazza, foglio, Strada, Casa, Live Club, Palestra, le due schede, le impostazioni, le
trasferte — a sedici misure (360, 390, 430, 620, 768, 900, 940, 980, 1024, 1100, 1180, 1240,
1280, 1366 × 768, 1440 × 900, 1920 × 1080, più 1280 × 720 e 844 × 390) e per ognuna misura il
documento e la schermata accesa (`scrollWidth > clientWidth`) e chi esce dai bordi senza un
antenato che lo tagli. Dopo il giro: **nessuna schermata scorre di lato a nessuna misura**.
La landing e l'accesso sono stati provati a parte, a sei misure: puliti. Le pagine più
lunghe scorrono in verticale, che è quello che devono fare.

**Resta quello che restava:** la prova su un telefono vero, e di traverso (844 × 390) il
gioco si usa ma va deciso se sugli store gira anche in orizzontale.

---

## Le tre del Marketing: chiuse dal 14/09, e la riga delle mosse a capo

> **FATTO (14/09/2026, riconosciuto il 20/09)** — branch `task/le-tre-del-marketing`. File:
> `frontend/css/telefono.css` (la riga piccola delle mosse nell'Agenda) e
> `frontend/strumenti/audit-regressioni.js` (cinque controlli, «Le tre del Marketing»).

La voce di problemi-riscontrati del 14/09, terza nell'ordine di «Da fare adesso»: *«In
spinta» esce come una seconda riga bianca*, *una riga di pezzo senza seed è un bottone che
non fa niente*, *il pezzo scelto può sparire dall'elenco ma resta quello che si spinge*, più
*sul telefono il motivo per cui l'anteprima è spenta viene tagliato*.

**Erano già chiuse.** Tutte e quattro il 14/09 stesso, nel branch
`task/studio-marketing-scegli-il-pezzo` (commit `98cc918`, `28c6561`, `e288634`), e questo
foglio lo diceva da allora sotto «Quando tieni la take si chiede solo il nome». Il giorno
dopo il Marketing è uscito dallo Studio ed è diventato «Che post fai?» su LaFamegram
(`telPromo()` in `telefono.js`), e le tre regole ci sono passate pari pari: «in spinta» è
testo nella riga piccola (`" · in spinta"`), la riga senza seed esce senza `data-spingi`
(`Number.isFinite(s.seed)`), il pezzo scelto più vecchio dei sei viene aggiunto all'elenco
(`elenco.push(ultimo)`); il motivo dell'anteprima spenta è «un pezzo scelto su LaFamegram»
(`actions.js`). Il riordino del 15/09 non l'aveva riconosciuto — come per l'hover — e la
voce è rimasta in cima all'ordine per sei giorni. Riprovato in partita con Playwright, a
1440 e a 390, con otto pezzi fuori e il più vecchio scelto: le righe di «Che post fai?» sono
alte uguali (56), «Pezzo 1» sta in elenco con «scelto», «Serve un pezzo scelto su
LaFamegram» sta in una riga (255 punti in 255).

**La cosa nuova, trovata guardando.** Nell'Agenda del telefono, «Le tue mosse», la riga
piccola sotto al nome è una riga sola coi puntini (`.tlitx i`), e tiene circa 46 caratteri:
il motivo della mossa spenta è corto dal 14/09, ma la **descrizione** della mossa accesa,
che compare al suo posto, per quattro mosse no — promo (62 caratteri), anteprima (74), pesi
(70), cardio (66). «Clip e provocazioni. Spinge il pezzo che scegl…»: e la parte che se ne
andava era «su LaFamegram». Non si accorciano i testi, che sono gli stessi della scena a
schermo pieno dopo la mossa: nell'Agenda la riga piccola delle mosse e degli eventi
(`.tli[data-azione]`, `.tli[data-evento]`) va a capo fino a tre righe, poi i puntini. Le
altre liste del telefono con la stessa riga non cambiano. Misurato su tutte e tredici le
mosse a 1440, 390 e 360 (promo e anteprima accese; pesi e cardio mostravano il motivo corto,
i loro caratteri sono contati sul testo): nessuna tagliata; le due righe alzano la card da 51
a 64 (1440), da 53 a 68 (390). Il giro di fine task ha trovato che a **360 × 640** — il
telefono basso, che si disegna più stretto per stare nell'altezza — la riga è 170 punti e
due righe non bastavano ancora: «su LaFamegram» se ne andava lo stesso. Da lì il limite è
tre righe, che a 360 × 640 servono a promo e anteprima (47 punti), a 375 × 667 alla sola
anteprima, e dai 390 in su non cambiano niente.

**Prove.** Cinque controlli nuovi in `audit-regressioni.js` («Le tre del Marketing
(20/09/2026)»): le quattro cose del 14/09 e la riga a capo fino a tre righe; il controllo
sulla riga senza seed guarda anche la guardia di `telSpingi` in `telefono.js`, non solo
quella dello Studio. 403 controlli, tutti verdi. Il giro di fine task ha trovato tre cose
(voci 44–46 di problemi-riscontrati), chiuse nel branch: le tre righe, quel controllo, e la
prima tabella del README che contava 34 voci per questo foglio quando erano 43.

**Da imparare**: prima di prendere una voce dell'ordine si cerca la sua RISOLTO sotto ai giri
di problemi-riscontrati — due volte (l'hover, il Marketing) la voce era chiusa e l'indice no.
