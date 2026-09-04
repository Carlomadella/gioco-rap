# La mappa e le tre città

Dove si gioca: la plancia, la mappa della provincia, e il mondo che si allarga
fino a Milano e a Los Angeles.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 6 · La mappa definitiva

6. Implementa la mappa con il "file mappa definitiva", elabora la mappa ESATTAMENTE COME NELLE FOTO
   CHE TROVI NELL'ALBUM MEDIA DELLA CARTELLA GIOCO RAP.

   **FATTO (02/09/2026)** — la mappa definitiva
   (`frontend/concept/mappa_definitiva.png`, 1536×1024) è il concept intero della
   plancia: fascia in alto, profilo, player musicale e slider dell'ora ci sono già, veri, in
   `hub.js`/`hub.css`/`telefono.js` — solo la città con i suoi cartelli mancava. Ritagliata la sola
   fascia della città (0,340 → 1536,940, sotto testata e profilo, sopra player e slider — nessun
   cartello tagliato) e salvata al posto della vecchia foto, stesso file: `mappa_citta.jpg`.

   Ricalcolate le percentuali di tutte le nove zone di prima su questa foto (`HUB_LUOGHI`, `hub.js`) —
   gli id non sono cambiati, li usano anche `orari.js`, `eventi-tempo.js`, `trasferte.js` e
   `spostamenti.js` (che aveva anche le sue misure della mappa, 830×677, aggiornate a 1536×600).
   «Concerti & live» adesso si chiama «Live Club» in `hb-pins`, come dice il cartello nella foto —
   stesso posto, stesso id `concerti`.

   Tre cartelli nuovi, che nella foto vecchia non c'erano:
   - **Beat Maker** — lo stesso posto de «La Sala» (non c'è ancora un listino beat separato, punto 46):
     due edifici disegnati, un solo `vai()`.
   - **Centro per l'impiego** — apre *tutti* i lavori di `JOBS` (`actions.js`), non solo Pizzeria e
     Fabbrica: chi non ha i requisiti (es. Buttafuori, Fonico junior) lo vede scritto, non può prenderlo
     lo stesso. Orario d'ufficio, 09:00–18:00 (`orari.js`).
   - **Campetto** — nella foto c'è, nel gioco no: dice «sta arrivando» (`hubPresto`), non finge un
     minigioco che non esiste.

   «Periferia», «Centro» e «Industriale» restano scritte nella foto ma non sono cartelli cliccabili:
   sono etichette di zona, come le schede in alto nel concept — non un luogo con una sua scena.

   Verificato: le dodici zone disegnate sopra alla foto, a video, combaciano coi cartelli (script di
   controllo, non il browser — l'estensione Chrome non era collegata in questa sessione). Da controllare
   ancora a mano: un giro vero in Chrome, click per click.

   **«La foto è riadattata malissimo» (03/09/2026) — trovata la causa, non era il ritaglio.**
   Confrontato pixel per pixel il ritaglio (0,340 → 1536,940) di `mappa_definitiva.png` con
   `mappa_citta.jpg` sul disco: identici, il ritaglio del 02/09 è corretto. Ma quel commit ha
   **sovrascritto lo stesso nome di file** (`mappa_citta.jpg`, 186 KB → 320 KB) con dentro una foto
   completamente diversa — la vecchia versione aveva le card scritte SOPRA agli edifici, coprendoli
   («CLUB & DISCOTECHE», «SPONSOR & BRAND», «BUSINESS», la mappa piccola di prima del punto 6). A
   differenza di ogni CSS e JS del gioco, che in `index.html` hanno tutti un `?v=` per rompere la
   cache, l'immagine dentro a `hub.css` non ce l'aveva: chi l'aveva già vista prima del 02/09 — nel
   browser o nella webview di Electron/Capacitor, che tengono le immagini in cache più a lungo di una
   pagina — continuava a vedersi la foto vecchia anche a file già cambiato sul disco. Confermato anche
   un secondo posto dove capitava: `frontend/dist/` (la cartella del build, non versionata) aveva
   ancora la foto di prima del 01/09, sotto il vecchio percorso `media/photo/schermate di gioco/` —
   un `npm run build` rifatto adesso la sostituisce da solo, perché il build ricopia tutta `media/`
   da zero.
   **Fatto:** aggiunto `?v=2` alle due `url(...)` di `mappa_citta.jpg` in `hub.css` (sfondo sfocato e
   foto nitida) e alzato `hub.css?v=12` a `?v=13` in `index.html`, così anche il foglio di stile che
   punta alla foto si ri-scarica. La prossima volta che si sovrascrive un'immagine con lo stesso nome,
   va alzato quel numero — altrimenti chi l'ha già vista resta con la versione vecchia in cache.
   Verificato in Chrome headless (dev server locale, profilo pulito): la mappa in gioco combacia
   esattamente col ritaglio fatto a mano da `mappa_definitiva.png`, sia a 1600×1000 che a 2560×1080.

---

## 26 · La carriera cresce con la mappa: Provincia → Milano → Los Angeles

26. **Concept: la carriera cresce con la mappa — Provincia → Milano → Los Angeles.**
    Da qui in avanti l'hub del gioco è una mappa che si allarga insieme al rapper: non sblocchi funzioni
    sparse, sblocchi un mondo più grande. La mappa non è una decorazione, è la schermata da cui si gioca.

    **Fase 1 — la provincia.** La città di partenza la scrive il giocatore («Da dove comincia la tua storia?»:
    Rovereto, Vicenza, Bari, Catania…), così ogni partita parte da un posto suo. Qui il rapper non è nessuno:
    pochi soldi, poca fama, pochissimi contatti, pochi posti sulla mappa. Può cercare beat, scrivere,
    registrare, mixare, pubblicare, costruirsi un pubblico e fare piccole attività criminali.

    **Fase 2 — Milano.** Si sblocca con più parametri insieme, non grindandone uno solo: livello ≥ 10,
    fama ≥ 50, hype ≥ 40. Qui il gioco si apre: live, club, piazze, concerti più grandi, manager, sponsor,
    business, shop più cari, studi migliori e criminalità di livello superiore.

    **Fase 3 — Los Angeles.** Ci arrivi solo da GOAT: livello ≥ 30, fama ≥ 90, hype ≥ 85, reputazione ≥ 80.
    Hollywood, casinò (dove i soldi si possono anche perdere in una serata), auto e gioielli, shop esclusivi,
    studi top, eventi internazionali, artisti internazionali, business enormi, criminalità ad altissimo rischio.

    **Gli studi non sono una skin.** Ogni studio ha una qualità che entra nel calcolo del pezzo: provinciale
    ~40/100, milanese ~75/100, leggendario ~95/100.

    **Niente studio personale.** Il rapper non ha uno studio suo: deve andare negli studi degli altri e
    conoscere le persone. Il loop è cerco → mi muovo → conosco → creo rapporti → ottengo occasioni → miglioro.
    Un producer ti presenta un artista, l'artista un fonico, il fonico un altro studio.

    **La rete di contatti è una risorsa vera.** Ogni contatto ha un tipo (producer, rapper, fonico, manager,
    organizzatore eventi, proprietario di club, imprenditore, brand, contatti criminali) e un grado:
    conoscenza → contatto → amico → collaboratore → fidato → partner. Non tutti sono raggiungibili: un
    producer sconosciuto lo incontri andando in studio, uno famoso può chiedere 70 di fama, 50 di hype e
    3 contatti in comune. Farmare contatti è gameplay, non un menù.

    **Sezioni della mappa, sbloccate per fase:** studio, casa/vita quotidiana, social, criminalità (provincia);
    più club, live, manager, business, shop, eventi (Milano); più casinò, Hollywood, luxury, eventi
    internazionali (Los Angeles).

    Riferimento grafico: la mappa generata va usata come **Main Hub / World Map**, non come logo — il logo
    vero, semplice e riconoscibile, viene dopo.

    **FATTO in parte (31/08/2026)** — la schermata della città di partenza, uguale alla foto
    `frontend/concept/schermata_di_gioco_città_iniziale.png`.
    - Si entra da lì: «Inizia la carriera» apre la mappa, non più le card. Dalla mappa si va nella
      partita e dalla partita si torna indietro con il tasto viola «Mappa».
    - Testata: marchio, nome, livello con la stella, fase in viola, e le quattro cose che hai —
      energia, cassa, hype, chi ti segue. Sono i numeri veri della partita, non un mockup.
    - La mappa è la foto stessa, non un disegno che le somiglia: `media/photo/mappa_provincia.jpg`
      è il concept ritagliato sotto la testata e sopra le linguette. Spilli e targhette stanno
      dentro all'immagine; sopra ci sono solo sei rettangoli invisibili, le zone da toccare, messe
      in percentuale così restano incollate ai cartelli a qualunque grandezza di schermo.
      Anche la miniatura delle notizie è ritagliata dal concept.
    - Quattro luoghi aperti (studio, beat maker, vita quotidiana, attività criminali) e due chiusi
      (club, concerti) che dicono «sblocca a Milano» e, se li tocchi, cosa serve: livello 10, fama 50,
      hype 40. Studio, beat maker e vita quotidiana aprono la partita sulla sezione giusta;
      la criminalità dice che sta arrivando (è il punto 21).
    - In basso le cinque linguette (mappa, contatti, inventario, obiettivi, statistiche), l'obiettivo
      di adesso con la barra, le notizie del paese che cambiano con le settimane e il telefono con la
      chat: il pallino rosso è la roba non letta del diario.
      File nuovi: `js/game/hub.js`, `css/hub.css`, `media/photo/mappa_provincia.jpg`,
      `media/photo/notizia_folla.jpg`. Il build dell'artifact adesso si porta dentro anche le
      immagini dei CSS, come data URI.
      Restano da fare: i contatti veri, la criminalità, e le altre due città.

Carlomadella/gioco-rap

leggiti il repo
Sì. Ho aperto il repository e ne ho letto la struttura e il README. Repository GitHub — gioco-rap
È “Anni di Fame”, un gioco di carriera rap fatto interamente in HTML/CSS/JavaScript vanilla, senza dipendenze né build system. Il repo contiene 17 commit ed è organizzato principalmente in css/, js/, media/photo/, index.html e alcuni .md.

La parte interessante è che ho già individuato l'architettura:

Creator → creazione dell'artista, aspetto, generi, vestiti, tratti, ritratto SVG.
Game → carriera, statistiche, azioni settimanali, contratti, rivali, eventi, classifiche.
Writer → sistema di scrittura con rime/metrica/punteggio.
Piazza → freestyle.
Sim → simulazione della settimana: stream, spese, classifica ecc.
Lifestyle → costi e livelli di vita.
Covers → copertine generate da seed + copertina caricabile dall'utente.
Stato persistito tramite localStorage.
Creator e partita comunicano attraverso variabili globali come ARTIST, ARTIST_PORTRAIT, ARTIST_BODY, GAME, ecc.
Quindi sì, possiamo lavorarci direttamente a livello di codice, non solo ragionare superficialmente sul progetto.
Se vuoi, nel prossimo messaggio posso anche entrare nei singoli file JS/CSS e ricostruirti esattamente come funziona il gioco, compresi sistemi, formule, eventi e punti in cui conviene intervenire.

message.txt
Documento
Ho ricevuto il file: contiene il riepilogo della direzione che avete definito per Gioco Rap, inclusa la progressione Provincia → Milano → Los Angeles e soprattutto il sistema basato sui contatti da farmare invece dello studio personale.
Dimmi cosa vuoi fare adesso con il repo: posso partire da questa nuova impostazione e progettare come modificarne concretamente codice, struttura e gameplay.
Sì, questa è chiaramente la direzione visiva che state dando a Gioco Rap: una mappa/hub della carriera, con le varie attività distribuite nella città e sbloccabili progressivamente.
E soprattutto si sposa bene con quello che avete definito nel file: il giocatore parte dalla provincia, poi arriva a Milano e infine a Los Angeles, con nuove opportunità e contatti man mano che cresce.

La cosa che cambierei rispetto a questa immagine è non trattarla come una schermata statica: nel gioco vero e proprio la userei come riferimento per costruire una mappa interattiva, dove ogni zona/edificio è un punto cliccabile e alcune attività sono inizialmente bloccate.

In particolare, visto che avete deciso che non esiste lo studio personale, toglierei quella concezione e farei diventare lo Studio un luogo esterno in cui andare per incontrare producer, fonici e altri artisti e costruire il network. Questo è coerente con il sistema di contatti che avete definito.

Se vuoi, posso prendere questa immagine come concept art e passare direttamente a progettare la vera schermata HUB del repo, mantenendo questo stile ma trasformandola in una UI giocabile.

Modifica

Modifica

Comunque una cosa che mi è venuta in mente è che quella potrebbe essere la parte centrale. a sinistra mettiamo il profilo del giocatore e a destra magari mettiamo altre cose cliccabili, capito? Cioè dividerei in tre parti comunque la schermata, la schermata, non solo tutta mappa.BE
Sì, molto meglio così. La mappa non dovrebbe essere la schermata: dovrebbe essere il cuore centrale della schermata.
Io la imposterei proprio come una dashboard a 3 colonne, mantenendo la mappa come elemento dominante:

┌─────────────────────────────────────────────────────────────────────┐
│ HEADER / STATO │
├───────────────────┬───────────────────────────────┬─────────────────┤
│ │ │ │
│ 👤 PROFILO │ 🗺️ MAPPA │ 📱 HUB │
│ │ │ │
│ Nome artista │ CITTÀ DI PROVINCIA │ 📬 Messaggi │
│ Foto │ │ 🤝 Contatti │
│ Livello │ ● Studio │ 🎯 Obiettivi │
│ Fama │ ● Vita quotidiana │ 📰 Notizie │
│ Hype │ ● Beat Maker │ 🎒 Inventario │
│ Soldi │ ● Criminalità │ 📊 Statistiche│
│ │ │ 🏆 Classifiche│
│ 🎤 Skill │ │ ⚙️ Impostazioni│
│ ✍️ Scrittura │ │ │
│ 🎚️ Produzione │ │ │
│ ⭐ Reputazione │ │ │
│ │ │ │
├───────────────────┴───────────────────────────────┴─────────────────┤
│ ATTIVITÀ / EVENTI / NOTIFICHE │
└─────────────────────────────────────────────────────────────────────┘
👤 A SINISTRA: IL RAPPER
Questa deve essere una specie di carta d'identità del personaggio.
In alto:

YOUNG LEGEND
LV. 4 — ASPIRANTE

poi:

foto/avatar
💰 denaro
❤️ energia
⭐ fama
🔥 hype
🤝 network/rete
☠️ reputazione criminale
E sotto le skill:
🎤 Rap
✍️ Scrittura
🎹 Produzione
🎚️ Mixing
🎭 Carisma
🤝 Networking
Questa colonna deve permettere al giocatore di capire chi è il suo rapper in mezzo secondo.
🗺️ CENTRO: LA CITTÀ
Qui metterei molto più grande la mappa dell'immagine che abbiamo fatto.
E soprattutto cambia in base alla città.

Provincia
Pochissimi punti:
🟣 Studio

Registra, conosci producer e crea contatti.
🟢 Beat Maker
Produci beat.
🔵 Vita quotidiana
Casa, allenamento, relazioni ecc.
🔴 Attività criminali
Piccoli colpi, piccoli guadagni, piccoli rischi.
Tutto il resto potrebbe essere visivamente presente ma bloccato.
Tipo:

🔒 Club
Richiede Milano

🔒 Concerti
Richiede 25 Fama

Questo è importante perché il giocatore vede il mondo che lo aspetta.

📱 DESTRA: IL "TELEFONO" DEL RAPPER
Questa secondo me è la parte che può diventare veramente bella.
Non la farei semplicemente una colonna di pulsanti.

La farei sembrare il telefono / centro di controllo del personaggio.

🤝 CONTATTI
7 contatti
2 nuovi messaggi
Entri e vedi:
Producer — Marco
Conoscenza

Rapper — Killa
Contatto

Fonico — Andre
Amico

ecc.

Ed è qui che entra il sistema che abbiamo definito: devi farmare la rete sociale per poter accedere alle opportunità migliori.

🎯 OBIETTIVI
OBIETTIVO SETTIMANALE

□ Scrivi 2 pezzi
□ Conosci un nuovo producer
□ Pubblica un singolo

RICOMPENSA
+150 €
+5 Hype
📰 NOTIZIE
Una specie di feed del mondo:
🔥 Nuovo freestyle contest in città
🎤 Il rapper X ha appena pubblicato il nuovo album
🚨 Controlli della polizia nella zona industriale
Questo fa sembrare che la città viva anche quando non stai facendo qualcosa.
E IN BASSO...
Metterei una barra molto importante:
EVENTI / ATTIVITÀ DISPONIBILI
Per esempio:
┌──────────────────────────────────────────────────────────────┐
│ 🔥 STASERA │
│ │
│ Freestyle al Bar Centrale 21:00 +5 Hype │
│ Producer session 22:30 Nuovo contatto │
│ Piccolo party 00:00 ? │
└──────────────────────────────────────────────────────────────┘
Così quando il giocatore apre il gioco non vede solamente una mappa, ma vede immediatamente:
Chi sono → dove sono → cosa posso fare → cosa sta succedendo → cosa devo raggiungere.
E soprattutto questa struttura funziona per tutte e 3 le città
La cosa bella è che l'interfaccia rimane identica.
Cambia il mondo centrale.

🏘️ PROVINCIA
Pochissime attività.
Profilo → Mappa piccola → Telefono

🏙️ MILANO
La mappa esplode.
Studio, club, concerti, manager, business, sponsor, shop, criminalità ecc.

🌴 LOS ANGELES
La stessa struttura, ma ormai il rapper è GOAT:
Studio top tier, label, eventi VIP, casino, luxury shop, business internazionali, sponsor globali, criminalità ad altissimo rischio.

Quindi il giocatore non deve imparare una nuova UI ogni volta che cambia città. Impara una volta il sistema e poi vede il proprio mondo espandersi.

E questa, secondo me, è una direzione molto più da vero gioco gestionale/RPG rispetto alla semplice mappa fullscreen.
sviluppalo

---

## Niente «si sblocca a Milano» scritto in faccia

Non mi piace il fatto che nelle città venga scritto 'Si sblocca a Milano'. Lasciamo che sia tutto in progressione a sorpressa per i nostri player.
**FATTO (31/08/2026)** — tolto da tutte e due le parti: dalla foto della mappa (i cartelli chiusi
adesso hanno solo il lucchetto e il nome) e dai testi. Chi tocca un posto chiuso legge una frase che
non svela niente: «Da fuori si sente la cassa. Stasera non è cosa: quella porta si apre da sé, quando
sarà il momento.»

---

## 45 · Le card sulla mappa, di lato invece che sopra agli edifici

45. Sposterei le card dalla mappa iniziale, non SOPRA gli edifici ma leggermente rimpicciolata e a lato, cosìche si vedan bene gli edifici, quando andremo a milano e los angeles poi la mappa dev'essere incredibile come ti abbiamo mandato già nei repo.

   **BLOCCATO (01/09/2026) — serve un asset nuovo, non è una riga di codice.**
   Le card («STUDIO», «BEAT MAKER», i cartelli chiusi coi lucchetti…) non sono
   elementi HTML disegnati sopra la foto: sono **dentro al pixel** di
   `frontend/media/photo/mappa_citta.jpg`, disegnate dov'è finito bene per chi
   ha fatto l'immagine, non da un layout che posso spostare. Non ho un
   generatore di immagini in questa sessione, quindi non posso ritagliarle e
   spostarle io. Le zone da toccare (`HUB_LUOGHI` in `hub.js`, sei rettangoli
   invisibili in percentuale) restano incollate a dove sono le card **nella
   foto attuale** — se cambia la foto, cambiano anche quei numeri, è lavoro
   di un quarto d'ora una volta che la foto nuova c'è.
   Prompt pronto per chi genera l'immagine (ChatGPT o altro):
   ```
   Rifai il concept art della mappa della città di provincia per il gioco
   "Anni di Fame" (stessa inquadratura dall'alto, stessa notte, stesse vie e
   stessi edifici della versione attuale). Le card con nome e descrizione dei
   luoghi (Studio, Beat Maker, Vita quotidiana, Attività criminali, e i
   cartelli chiusi con il lucchetto) non devono più stare sopra gli edifici,
   coprendoli: spostale leggermente più piccole, a lato di ogni edificio, in
   uno spazio libero della strada o del marciapiede vicino, lasciando
   l'edificio stesso ben visibile e riconoscibile. Il pin colorato resta
   sopra all'edificio, la card sta accanto. Stesso stile grafico, stessi
   colori, stesso formato orizzontale.
   ```
   Per Milano e Los Angeles vale la stessa regola fin da subito: quando si
   generano quelle mappe, le card vanno chieste già a lato, non sopra.

---

## 48 · Meno cartelli chiusi sulla mappa, più roba che si apre

48. Cambierei le troppe SEZIONI BLOCCATE NELLA MAPPA PRINCIPALE, piuttosto rimpiazzandole con alcune già sbloccate come SHOP oppure togliendole proprio, non han senso che le sezioni sian lì solo per leggerci 'sbloccabile a milano' stiamo solo spoilerando la progressione del gioco per limitarne in realtò.

   **FATTO in parte (01/09/2026)** — due dei cinque cartelli chiusi in
   provincia (`HUB_LUOGHI` in `frontend/js/game/hub.js`) portavano già a
   qualcosa che *esiste*, solo senza un posto sulla mappa: **Shop** apre
   adesso il catalogo → Attrezzatura (la vetrina diceva già da sola
   «l'attrezzatura sta nel catalogo» — l'ho preso in parola), **Concerti &
   Live** fa partire l'open mic (l'azione «Serata open mic» c'era già in
   `ACTIONS`, non aveva un cartello). Se non hai ancora un pezzo pubblicato
   te lo dice («Serve 1 pezzo fuori»), non fa finta di niente.
   Provato in Chrome: entrambi funzionano, il secondo mostra il messaggio
   giusto quando non sei pronto.
   **In parte** perché **Club & discoteche, Sponsor & brand, Business**
   restano chiusi — non hanno un sistema vero dietro nemmeno oggi, sono
   roba di Milano, e sbloccarli vorrebbe dire inventare un meccanismo che
   il punto non chiedeva. Restano anche **spente sopra il pixel**: i
   lucchetti sono dentro alla foto (punto 45), non un elemento che si
   toglie da CSS — la vetrina "SHOP" e il cartello "CONCERTI & LIVE" nella
   foto mostrano ancora il lucchetto anche se sotto funzionano davvero:
   si sistema quando la mappa nuova (punto 45) sostituisce quella attuale.
   `npm run prova` (12/12) pulito.

---

---

## La plancia riempie lo schermo, come nella foto

**FATTO (01/09/2026).** La schermata di gioco era disegnata alla misura del
concept — 1536×1024 — e poi **rimpicciolita tutta insieme** per starci dentro.
Su un monitor largo (1912×872, quello di Carletto) restavano due bande nere da
300 px per parte: il gioco non riempiva lo schermo.

Adesso la plancia è una **griglia**, non un rettangolo scalato:
- la fascia in alto e la riga del suggerimento prendono tutta la larghezza;
- le colonne di lato tengono la loro misura e **la città si prende quello che
  avanza**;
- il profilo e le linguette sono una colonna sua, la città e gli eventi
  un'altra: hanno ingombri diversi, come nel concept (a sinistra il profilo è
  alto e le linguette stanno in fondo, al centro la mappa è alta e sotto ci
  sono gli eventi);
- **la foto della mappa tiene le sue proporzioni** (830×677) e cresce quanto
  può: è quello che fa restare le zone da toccare esattamente sopra ai
  cartelli disegnati dentro. Verificato: le nove zone sono agli stessi
  percentuali di prima e il clic su «Studio» apre lo studio.
- il riquadro della mappa non si vede più: quello che si vede è la foto, con
  la sua ombra. Sugli schermi molto larghi, dove la foto non può riempire
  tutta la colonna senza deformarsi, intorno resta il fondo scuro invece di
  una cornice vuota.
- se lo schermo è basso il profilo **si scorre** invece di tagliarsi: meglio
  una barretta che un livello che sparisce. Sotto i 1180 px di larghezza il
  telefono si toglie e restano profilo e città.

**Quello che non ho toccato**, e che nella foto è diverso: il telefono a destra.
Nel concept è una lista (messaggi, otto riquadri, notizie); nel gioco è un
iPhone vero, ed è di oggi (punto 42). Rifarlo com'era nella foto vorrebbe dire
buttare quel lavoro: se lo volete uguale alla foto ditelo e si fa.

**Bug trovato e sistemato (01/09/2026)** — sotto i 1180px di larghezza il
telefono non si nascondeva davvero: `telefono.css` dichiara `.ptel{display:flex}`
senza media query e viene caricato *dopo* `hub.css`, quindi a parità di
specificità vinceva sempre lui, non la regola `@media(max-width:1180px)`.
La città restava a **larghezza zero** (le nove zone da toccare collassavano a
12×2 px, tutte impilate nello stesso punto) mentre il telefono restava a
schermo intero. Corretto alzando la specificità del selettore che nasconde il
telefono (`body.in-hub .ptel`, css/hub.css) invece di contare sull'ordine dei
file. Non è mai arrivato in produzione a schermi larghi: ci si inciampa solo
sotto i 1180px di larghezza reale della finestra.

---

## 59 · Due lavori veri al posto di due cartelli chiusi

59. Al posto dei posti ancora lockati nella città di provincia mettiamo piuttosto che 2 sono posti di
    lavoro; uno potrebbe essere la pizzeria dove vai a fare il lavapiatti e l'altro potrebbe essere la
    fabbrica dove vai a fare i turni da operaio. Uno lavoro part time (pizzeria), l'altro full time (fabbrica).

    **FATTO (01/09/2026)** — `Club & discoteche` e `Sponsor & brand` (`HUB_LUOGHI` in
    `frontend/js/game/hub.js`) erano due dei cartelli chiusi senza niente dietro (punto 48). Sono
    diventati due lavori veri, cliccabili sulla mappa:
    - **Pizzeria** → `Lavapiatti` (job già esistente in `JOBS`, `actions.js`): 100 €, 18 energia a turno.
    - **Fabbrica** → `Operaio`, nuovo in `JOBS`: 220 €, 40 energia a turno — full time, si sente di più.

    Toccando la card si apre una scheda (`schedaLavoro()`, nuova in `hub.js`) col nome del lavoro, la
    paga e il costo in energia; «Fatti assumere e lavora» chiama `assumitiCome()`, che assegna `G.job` e
    fa subito il primo turno. **Un lavoro alla volta**, come è sempre stato `G.job`: se sei già assunto
    altrove, il gioco lo dice («Lavori già come lavapiatti. Un posto alla volta — lascialo o aspetta di
    essere licenziato.») e non ti fa doppiare.
    Provato in Chrome, click veri sulla mappa: assunzione, turno, paga ed energia scalate, e il blocco
    da già-occupato-altrove, tutti verificati.
    **Resta il limite del punto 45**: le targhette dentro alla foto (`mappa_citta.jpg`) dicono ancora
    «Club & discoteche» e «Sponsor & brand» — cambiano solo quando arriva la mappa nuova.

---

## 60 · «Vita quotidiana» diventa «Casa»

60. La card vita quotidiana chiamala «Casa».

    **FATTO (01/09/2026)** — rinominata in `HUB_LUOGHI` (`hub.js`); il sottomenu resta «Stacca la
    spina» e «Guarda cosa ti costa vivere» (la palestra è uscita da qui, vedi punto 61). Stesso limite
    del punto 45: nella foto il cartello dice ancora «Vita quotidiana».

---

## 61 · La palestra diventa un posto suo

61. La palestra mettila in una card lockata che, come ti ho detto, non ha senso che si vedano se non
    sono interagibili — piuttosto rimpiazziamole.

    **FATTO (01/09/2026)** — la palestra era una delle due opzioni dentro al sottomenu di «Vita
    quotidiana»; adesso è una card sua, al posto del cartello chiuso «Business» (che non aveva niente
    dietro, punto 48). Il click chiama direttamente `hubAzione("palestra")`, la stessa azione di sempre
    (`ACTIONS`): 12 energia, 12 €, +benessere. Stesso limite del punto 45 sulla targhetta nella foto
    («Business» invece di «Palestra»).

    **«Implementa come la palestra dinamicizzi il gameplay» (03/09/2026)** — non era un pulsante,
    era *il* pulsante: un numero casuale uguale ogni volta, senza motivo per tornarci due volte
    invece di una. Adesso:
    - **Si sceglie, come a Casa.** Il cartello apre una scelta (`showEvent`, `hub.js`) invece di
      lanciare l'azione da solo: **Pesi** (16 energia, 18 €, benessere e presenza su, per chi si
      prepara a salire su un palco) o **Cardio leggero** (9 energia, gratis, lucidità e benessere
      su, per chi è senza soldi o senza tempo ma vuole tenere il filo). Due `ACTIONS` nuove in
      `actions.js` — `palestra_pesi` e `palestra_cardio` — al posto della vecchia `palestra` sola.
    - **La costanza conta, non il colpo isolato.** `G.palestra` (`{streak, ultimo, sessioni}`,
      `actions.js`) ricorda da quanti giorni di fila ci vai: ogni giorno consecutivo alza il
      guadagno di presenza del 5%, fino al +50% al decimo giorno di fila. Il conto è "vivo" —
      `palestraStreakOra()` capisce da solo se la serie si è già rotta (più di un giorno saltato)
      anche prima che tu ci torni, non aspetta la sessione successiva per accorgersene.
    - **Strafare non paga.** Tornarci due volte lo stesso giorno (`adfOggi("palestra")`, lo stesso
      contatore giornaliero di "stacca la spina") non raddoppia niente: la seconda seduta toglie
      benessere invece di darne — «Il corpo non recupera due volte lo stesso giorno» — invece di
      essere solo un guadagno più basso, così spammare il pulsante ha un costo vero, non un
      rendimento decrescente che uno character-il-giusto ignora.
    - **Si vede.** La scheda «Disciplina» del profilo (`vistaDisciplina()`) mostra la serie attuale
      — «3 giorni di fila», o «Persa: da riprendere» se hai saltato — con un'icona nuova
      (`manubrio`, `HIC`). Prima questo stato non esisteva da nessuna parte fuori dal log.
      A 3 e 7 giorni di fila (e ogni settimana intera dopo) un accenno di testo lo nota anche
      l'esito della sessione, non solo lo stat.
    Tutti gli altri punti che tenevano viva la vecchia `"palestra"` come id di azione sono stati
    aggiornati per le due nuove — orari d'apertura (`orari.js`), durata (`tempo.js`: pesi 75 min,
    cardio 45), suono (`fx.js`), scena a pagina piena e colore del toast (`ui.js`), disegno
    (`scene-art.js`, stesso SVG per entrambe: è la stessa palestra). Il luogo sulla mappa resta
    uno solo, `"palestra"` — cambiano solo le mosse dietro al cartello.
    Verificato in Chrome headless: prima sessione (streak 1, presenza +0,6), sessione il giorno
    dopo (streak 2, +10%), due sessioni lo stesso giorno (seconda: benessere −5, niente presenza),
    salto di più giorni poi ripresa (streak torna a 1, "Persa: da riprendere" nel frattempo).
    `npm run prova` (28/28) pulito.

---

## 62 · La mappa allargata, senza bande nere

62. La mappa dopo le modifiche di Carletto che ha allargato a tutta la pagina il gioco sembra piccola e
    ai lati ha delle side bar nere, togliamole allargando la mappa MA OVVIAMENTE NON PERDENDO DI QUALITÀ
    E FACENDO UN LAVORO AD ARTE. Non voglio spazi neri, voglio che sian fatti bene.

    **FATTO (01/09/2026)** — le bande nere non sono un bug, sono la conseguenza onesta di un fatto
    fisico: la foto (`mappa_citta.jpg`) è 830×677, la colonna centrale della plancia no, e su schermi
    larghi la differenza si vedeva come vuoto piatto. Le uniche vere alternative erano ritagliare la
    foto (si perdono i cartelli ai bordi) o deformarla (si perde qualità) — la richiesta escludeva
    entrambe. La terza via, quella "fatta ad arte": lo sfondo dietro alla mappa (`.pmappa` in
    `css/hub.css`) adesso è la stessa foto, sfocata e scurita, ingrandita a coprire tutta la colonna —
    la stessa tecnica delle copertine sfocate di Spotify o dei bordi ambientali di una TV. La mappa
    nitida sopra resta esattamente alla sua misura di sempre: le nove zone da toccare (`HUB_LUOGHI`)
    non si sono spostate di un decimale, verificato confrontando i loro `--x/--y/--w/--h` prima e dopo.
    **Non potendo aprire una finestra larga quanto un monitor vero in questa sessione** (l'ambiente di
    prova resta a 1014px anche forzando la finestra), il taglio esatto delle bande sui monitor
    ultra-larghi (1920, 2560px, quelli con cui Carletto ha già provato la sua responsività) andrebbe
    riguardato a occhio da chi ha un monitor vero — ma il meccanismo è verificato: niente più nero
    piatto, e zero rischio sui punti cliccabili.

---

## Via il Campetto dalla mappa

Rimuovere il campetto dalla mappa. Non lo vogliamo un posto giocabile nè tantomeno segnato con
una card.

**FATTO (03/09/2026).** Due parti, non una:
- **Il gioco:** tolta la voce `campetto` da `HUB_LUOGHI` (`hub.js`) — niente più zona da toccare,
  niente più `hubPresto("Campetto", …)`. Verificato in Chrome: `elementFromPoint` su dove stava il
  cartello adesso restituisce il contenitore della mappa, non un `.pspot`; l'elenco dei luoghi
  cliccabili non ha più `campetto` in mezzo.
- **La foto:** qui il punto 45 aveva già spiegato perché di solito non si tocca — le card sono
  dentro al pixel di `mappa_citta.jpg`, non un livello HTML separabile. Stavolta però il compito
  era il contrario, togliere una card senza rimetterne un'altra al suo posto: un lavoro di
  *inpainting* (ricostruire lo sfondo dov'era la card), non di ridisegno. Con `simple-lama-inpainting`
  (rete neurale, gira in CPU, ~6 secondi per l'immagine intera) è stato tolto il cartello «Campetto» —
  la maschera copriva solo il rettangolo della targhetta (234,197)-(335,244) su 1536×600, il resto
  del file è **bit a bit identico a prima** (`ImageChops.difference` conferma il diff-bbox coincidente
  con la maschera). Il campetto stesso — l'erba, la rete, i pali — resta lì com'era, non era nella
  maschera: è rimasta un'ambientazione come «Periferia» o «Centro», non un luogo. Ri-salvata con le
  stesse tabelle di quantizzazione e lo stesso subsampling del jpg originale, per non perdere qualità
  nel resto della foto (323 KB contro i 320 KB di prima).
  **Lezione del punto 6 applicata subito:** stesso nome di file, contenuto diverso — alzato
  `?v=2`→`?v=3` sulle due `url(mappa_citta.jpg)` di `hub.css` e `hub.css?v=13`→`?v=14` in
  `index.html`, altrimenti chi l'aveva già vista restava con la vecchia card in cache.
  **Trovato mentre ci lavoravo, sistemato anche quello:** il build normale (`npm run build`,
  `strumenti/build.js`, funzione `immagini()`) buttava via il `?v=` delle immagini quando riscriveva
  i percorsi per `dist/` — la cache-busting del punto 6 non sarebbe mai arrivata a chi gioca dalla
  versione Electron/Capacitor. Corretto: la query string adesso passa anche lì.
  Se in futuro serve rifare la mappa da capo per un altro motivo (punto 45), il campetto va tolto
  anche dal nuovo prompt di generazione — qui non serviva perché il resto della foto non cambiava.


---

## I bordi delle aree cliccabili sulla mappa

_(chiesto a voce: «i border delle aree cliccabili sono da migliorare»)_

**FATTO (03/09/2026)** — `css/hub.css`.

Le zone da toccare sulla mappa avevano **un solo stato disegnato: `:hover`**. Sul telefono
l'hover non esiste, quindi la mappa non diceva in nessun modo dove si poteva toccare — si
andava a tentoni sperando di prendere il cartello giusto. E quando il bordo compariva era
un rettangolo di colore tutto intorno all'edificio: sopra a una foto si appiccica come un
adesivo, e dove sotto c'è un'insegna accesa non si legge più.

Adesso sono i **quattro angoli**, come un mirino: dicono «qui si tocca» senza chiudere in
una scatola il palazzo che c'è sotto, e hanno un'ombra loro perché si leggano sia sul nero
della strada che sul neon della Sala. La luce che si accende non è un velo piatto ma sale
dalla base dell'edificio, perché in prospettiva un rettangolo pieno si vede che è un
rettangolo. Il giro guidato pulsa, e con `prefers-reduced-motion` sta fermo.

**Corretto dopo averlo visto su uno schermo vero (03/09/2026).** Il primo tentativo teneva
gli angoli accesi sempre, per il telefono, e con bracci lunghi in percentuale della zona.
Sbagliato due volte: dodici zone per quattro angoli fanno quarantotto trattini, e a
percentuale il braccio diventava mezzo lato — i quattro angoli si chiudevano in una
scatola e arrivavano a toccarsi da una zona all'altra. Sopra alla foto usciva un reticolo
da wireframe incollato sulla città. Adesso:

- i bracci sono **corti e a misura fissa** (`min(13px, 30%)`): un angolo marca uno spigolo,
  non disegna il lato; il `min()` serve alle zone piccole, dove 13px sarebbero già tutto il
  lato e si tornerebbe alla scatola dall'altra parte;
- si guarda **chi sta guardando**: dove c'è un mouse la mappa resta pulita e l'angolo
  compare al passaggio; dove il mouse non c'è (`@media (hover: none)`, cioè il telefono)
  restano accesi, discreti, perché lì l'alternativa non è una mappa pulita — è andare a
  tentoni.

Provato in Chrome a 1600×1000: a riposo l'opacità degli angoli è 0 e la città si vede per
quello che è; passando sopra allo Studio compaiono i quattro angoli viola, corti, attaccati
all'edificio.

Le due frecce che scorrono il giro guidato erano due rettangoli invisibili in mezzo alla
strada, e siccome lì sotto nella foto non c'è disegnato niente, sul telefono non esistevano
proprio: nessuno poteva sapere che erano lì. Adesso hanno il loro segno, sempre.

---

## 7 · Via la vecchia schermata di gioco, le info sulla mappa

7. rimuovi la pagina che trovi in foto su media al nome "bozza_schermata_di_gioco" e
   trasferisci tutte le info sulla mappa, puoi anche cambiarla e aggiungere punti basta che
   togli le barre nere affianco alla mappa tra le 2 sidebar

   **FATTO (03/09/2026)** — era rimasto a metà, e nessuno se n'era accorto perché la parte
   che si vedeva di più (le bande nere) era stata chiusa col punto 62.

   La pagina c'era ancora: `#s-game`, con la sua testata — ritratto, nome, livello, barra
   XP, i tre numeri (cassa, chi ti segue, hype) e «Dettagli» con benessere, lucidità, pezzi
   fuori e lavoro. Era un **secondo menù di gioco**, e diceva le stesse cose che la plancia
   della mappa dice già: la fascia in alto ha soldi, hype, fama, energia e benessere; la
   colonna di sinistra ha ritratto, nome, livello, XP, lucidità, lifestyle, sospetto e le
   skill; il lavoro sta sotto «Disciplina». Due posti per lo stesso numero sono un posto di
   troppo, e il secondo è quello che prima o poi non si aggiorna.

   Prima di toglierla si è confrontato riga per riga cosa c'era di qua e cosa di là: di
   suo mancavano solo **pezzi fuori** e **il contratto**, ed è quello che è stato
   trasferito, nel profilo della plancia accanto a «Stile musicale» e «Fan base»
   (`vistaProfilo`, `js/game/hub.js`). Poi la testata è diventata una riga sola: chi sei, a
   che giorno sei, l'audio. `#gtop` e `.tline` tengono il nome che avevano perché ci si
   agganciano il menu di sistema (`js/menu-sistema.js`) e l'orologio
   (`js/game/tempo-controlli.js`), che è il tipo di legame che non si vede finché non si
   rompe. L'app «Statistiche» del telefono apriva quel pannello: adesso apre la Disciplina
   sulla plancia, dove i numeri stanno davvero.

   **Quello che non si toglie**: `#s-game` resta come contenitore delle linguette —
   Catalogo, Discografia, Classifica, Contratti, Lifestyle, Traguardi e le mosse della
   settimana. Quelle non sono «info da trasferire», sono il gioco.

   **Trovato mentre ci si lavorava:** `ui.js` finiva con `$("g-tomenu").onclick`, e
   `#g-tomenu` non esiste più nel markup da quando la via di ritorno è diventata la mappa.
   Era l'ultima riga del file, quindi non portava giù nient'altro, ma tirava un TypeError
   rosso in console a ogni avvio. Tolta.

   **Un difetto arrivato dal punto 11:** «Beat Maker» adesso apre lo Studio, che è sempre
   aperto (punto 10), ma in `orari.js` il cartello puntava ancora agli orari della Sala —
   la porta si apriva e l'orario diceva «chiuso, apre alle 13». E le card delle mosse
   legate allo studio dicevano «fino **undefined**», perché il posto senza orario non ha
   un'ora di chiusura da scrivere e prima quel caso non esisteva. Sistemati tutti e due.

   Provato in Chrome, partita vera: la schermata di gioco ha una riga sola al posto della
   testata, il profilo della mappa dice «Pezzi fuori» e «Contratto», lo Studio e il Beat
   Maker risultano aperti alle 08:00, e le card dicono «sempre aperto».
