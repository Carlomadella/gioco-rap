# La mappa e le tre città

Dove si gioca: la plancia, la mappa della provincia, e il mondo che si allarga
fino a Milano e a Los Angeles.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

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
    `media/photo/schermata_di_gioco_città_iniziale.png`.
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

