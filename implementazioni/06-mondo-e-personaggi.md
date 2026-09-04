# Il mondo e la gente

La Sala, i contatti, i produttori, gli opps, la strada. Quello che rende il
mondo abitato invece che un menù.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 7 · Gli opps, i rapper rivali

7. Implementa nel gioco il fatto che ci possano essere gli opps, rapper rivali

---

## 20 · I produttori hanno abilità, fama e carattere

20. i produttori hanno delle abilità, e una fama a sè stante in costante crescita e sviluppo, la conversazione è influenzata da diversi valori: il rapporto che hai con loro, la fama tua e loro e dal tipo di genere che produce e dalla personalità

---

## 21 · La professione del criminale

21. implementa un nuovo modo di fare soldi, poi nel caso anche la fama, ovvero la professione del criminale

**57 · «Non è più giocabile, che è successo?» — controllato, non era una regressione.**
Cercato in tutta la cronologia (`git log --all --grep`, tutti i branch) qualcosa che avesse mai reso
«Attività criminali» o «Colpo rapido» giocabili: **non c'era mai stato un commit che l'avesse
costruito.** Sia la card sulla mappa (`HUB_LUOGHI`, id `crimin`) sia la voce degli eventi del giorno
(`HUB_EVENTI`, id `colpo`) chiamavano `hubPresto(...)` — il placeholder «sta arrivando» — fin dal
punto 26. Il punto 21 non era mai stato chiuso: quello che si ricordava «giocabile nel pomeriggio»
era probabilmente proprio questo popup di attesa, non un minigioco vero.

**FATTO (01/09/2026) — La Strada, `frontend/js/game/strada-crimine.js` + `css/strada-crimine.css`.**
Il codice non era mai arrivato su GitHub — solo il documento di design (le regole già scritte qui
sotto: reputazione, cassa sporca, rischio finanza). Recuperato da `strada-punto-21-files.zip`,
una consegna fatta al di fuori del repo in un'altra sessione, e adattato ai file di adesso (il punto
59 aveva nel frattempo aggiunto Fabbrica, il punto 54 aveva già preso il nome `strada.js` per gli
incontri per strada — da cui il nome nuovo, per non perdere né l'uno né l'altro pezzo).
- **Quattro colpi di provincia** (Consegne, Roba che scotta, La cassa del bar, La macchina giusta),
  ognuno con tre approcci — da solo pulito, con uno dei tuoi, col ferro — che cambiano guadagno,
  rumore e riuscita. Milano e Los Angeles restano in vista con scritto dove si aprono, non ci sono
  ancora quelle mappe.
- **Due casse, non una**: il colpo riuscito paga il 40% pulito subito, il 60% resta sporco finché non
  lo ripulisci (con una soglia oltre cui rende meno).
- **Reputazione di strada e attenzione**, non un numero solo: l'attenzione sale coi colpi rumorosi e
  con la vetrina (spendere più di quanto dichiari fa insospettire), scende da sola nel tempo — più in
  fretta con un avvocato — e oltre 50 rischia un controllo a sorpresa.
- **Chi ti copre**: uomini (costano all'assunzione e ogni settimana, uno può starci sotto al posto
  tuo), tre gradi di protezione, il ferro (più riuscita e guadagno, pena doppia se ti perquisiscono),
  l'avvocato (dimezza le pene, l'attenzione scende più in fretta).
  Tre attività da rilevare (lavanderia, autolavaggio, minimarket) che rendono ogni settimana, 45%
  pulito e 55% sporco.
- **Si può finire dentro**: la pena macina fan, hype e spese finché non esci, con un evento all'uscita
  (raccontarla o tornare dove avevi lasciato). Si può anche **mollare il giro** (costa il 30% dei
  soldi sporchi, minimo 1.500 €, abbassa la reputazione, alza la lucidità).
  Provato in Chrome: colpo riuscito, colpo fallito con arresto, undici settimane di pena fino
  all'uscita, ripulisci, assumere un uomo/protezione/ferro/avvocato, mollare il giro, ed entrambe le
  porte d'ingresso (la card sulla mappa e «Colpo rapido» negli eventi del giorno).
  **Non copre ancora**, di proposito: i colpi di Milano e Los Angeles, il casinò, il blocco delle
  altre azioni del gioco mentre sei dentro, i contatti criminali nella rubrica (che non esiste).

**FATTO (01/09/2026) — la schermata è quella del prototipo `attivita-criminali-crime-v8.html`.**
Il foglio scuro con le sezioni una sotto l'altra è diventato una scena: fascia in alto con la città,
la settimana e l'ora; tre pannelli — a sinistra i tuoi numeri (soldi sporchi e «ripulisci»,
reputazione, attenzione, energia, contanti, precedenti, occhi addosso), al centro i quattro colpi a
griglia sopra al titolo, a destra le due linguette «Chi ti copre» e «Attività»; in basso le tre città
e il tasto per tornare alla mappa. Dietro, trenta immagini che si danno il cambio ogni quindici
secondi, con la stessa lavorazione della landing.
- **Le regole di gioco non sono cambiate**: numeri, probabilità, pene, settimana, tutto quello che
  c'era resta identico. È cambiato solo come si vede e come si tocca.
- Le scelte del colpo e gli esiti stanno in una **scheda dentro alla schermata** (non `showEvent`,
  che finirebbe sotto), con i tre approcci a carte e le percentuali vere sotto a ognuno.
- Le cose piccole (ripulire, prendere un uomo, il ferro, rilevare un'attività) rispondono con **una
  riga in basso** che dice com'è andata o perché no, invece di non dire niente.
- Città chiusa: i suoi colpi si vedono spenti col cartello di dove si apre. Dentro: al posto della
  griglia, le settimane che restano.
- **Da fare prima degli store**: le trenta immagini del fondale arrivano ancora da un CDN, vanno
  scaricate in `media/photo/` (punto 33), se no a gioco installato non si vedono.

---

## Il beat maker diventa un posto: La Sala

quando clicco su beat maker mi rimanda alla scermata della scena del personaggio che incontra il beatmaker.
**FATTO (31/08/2026)** — sulla mappa «Beat maker» adesso apre **La Sala**: la scena della sala prove,
col tuo personaggio dentro e la gente che c'è stasera. Non è più una lista di beat.

Nella vita quotidiana si aggiunge la palestra
**FATTO (31/08/2026)** — «Vita quotidiana» sulla mappa apre tre scelte: palestra, staccare la spina,
guardare le spese. La palestra è una mossa vera della settimana: 1 energia e 12 €, alza benessere e
presenza, e ogni tanto in sala pesi c'è gente del giro (+rete).

Trasforma la sezione beat maker in un posto fisico dove dentro si conoscono ARTISTI, BEATMAKER, FONICI, GIORNALISTI E TUTTI QUEI PERSONAGGI CHE RENDONO LA CARRIERA INTERATTIVA. Soprattutto troveremo beatmaker emergenti con cui creeremo relazioni e in base alle relazioni che costruiamo con questi poi avremo anche delle sessioni in studio. Ti ricordo che le sessioni in studio avremo SCENE DI GIOCO VERE E PROPRIE che ancora dobbiamo sviluppare. Ti chiedo infine se secondo te nel posto fisico che vogliamo creare abbiamo messo TROPPA ROBAA. l'idea era che nella città di provincia ci sia un posto dove magari puoi sviluppare meglio la tua rete di contatti e questo influenza anche la vita del gioco come ad esempio da lì si creano post sul lafamegram e contatti, rivalità cose.

**FATTO in parte (31/08/2026) — «La Sala»** (`js/game/posto.js`, `css/posto.css`).
La sala prove dietro al bar centrale: una scena col tuo personaggio dentro, e stasera tre facce.

- Ogni persona ha un **ruolo**, un **genere**, una **fama** sua e un **carattere** (aperto, diffidente,
  gasato, pratico) che non vedi finché non ci parli: si scopre indovinando la risposta giusta.
- «Fatti due parole» costa **1 energia** e apre una chiacchierata a tre risposte. Le risposte danno
  punti, i punti fanno salire il gradino: conoscenza → contatto → amico → collaboratore → fidato →
  partner. Più sali, più punti servono per il gradino dopo: la rete non si farma in una sera.
- Quello che puoi chiedere dipende dal gradino: al **beatmaker** un beat da sentire (contatto) e la
  **sessione in studio** (amico: 2 energie e 60 €, esce un beat vostro, gratis e migliore); al
  **fonico** il mix di un tuo pezzo (amico); al **rapper** un pezzo insieme (collaboratore: hype e
  fan veri, con un'attesa fra un feat e l'altro); al **giornalista** un pezzo scritto su di te.
- **Le rivalità nascono qui**: se con un rapper dici le cose sbagliate quello se ne va, e te lo
  ritrovi in classifica come rivale, con la storia «Vi siete conosciuti alla Sala. È finita male.»
- Le sessioni in studio per adesso sono una scena corta: le **scene di gioco vere** restano da fare,
  come i post su LaFamegram, che ancora non esiste.

**RISPOSTA alla domanda «troppa roba?» — sì, per la provincia.** In un paese conosci tre persone, non
sei ruoli. Quindi qui dentro ci sono solo **beatmaker, rapper e fonico**; il **giornalista** si
affaccia da solo quando passi i 2.000 fan; manager, promoter, uffici stampa e A&R non ci sono
proprio, e vanno tenuti per Milano — servono a far sentire che Milano è un altro mondo. Se mettiamo
tutto subito, il posto diventa un menù e nessuno di quei personaggi resta in mente.

---

## La criminalità è troppo facile, e i soldi sporchi

Stiamo giocando e abbiamo notato ce è troppo facile fare la carriera da criminale, siamo arrivati in pochissimo tempo a reputazione strda 99, noi vogliamo creare un gioco per diventare rapper e non criminali

**RISPOSTA — regole da tenere quando la criminalità entra nel repo** (qui dentro ancora non c'è: sulla
mappa il posto esiste e dice che sta arrivando).

- La reputazione di strada sale **al massimo di 2 per colpo** e **cala di 1 a settimana** se stai
  fermo: 99 non lo raggiungi in un mese, e per restarci devi continuare a rischiare.
- Un colpo costa **quanto una sessione in studio** e occupa la sera: ogni colpo è un pezzo che non hai
  registrato. È lì che si sente che il gioco è sui rapper.
- La strada **non dà fama da rapper**: dà soldi e hype di strada. La fama vera esce solo dai pezzi.
- I **soldi sporchi** stanno in una cassa separata (vedi il punto dopo).

i soldi sporchi possono essere usati per comprare le cose che oggettivamente nel mondo reale puoi comprare comunque ccol denaro ossia : Un beatmaker lo puoi pagare tutto contanti, nessuno sa di questa cosa, i soldi sporchi sono più per il futuro e per quando avrai più soldi ; Magari la finanza ti controlla e arriva ad incastrarti. Però questo se ovviamente fai acquisti spropositati coi soldi in nero ; Tipo auto ecc e cose di lusso nello shop CHE ANCORA DOBBIAM PENSARE.

**RISPOSTA — due casse, non una.** In cima si vedono i soldi puliti; i contanti stanno sotto, in una
riga a parte. Cosa pagano i contanti: beatmaker, fonici, favori, roba di strada, l'affitto della sala.
Cosa **non** pagano: promozione, contratti, tutto quello che lascia una carta. Ogni volta che spendi
sporco in cose che si vedono (auto, gioielli, shop di lusso) sale il **rischio finanza**: una barra
nascosta che, sopra soglia, fa partire un controllo — sequestro dei contanti, settimane perse, e la
notizia che gira. Il conto onesto è questo: i contanti sono comodi adesso e pericolosi dopo, ed è
proprio il motivo per cui uno smette.

---

## Opp e giornalisti per strada

Da smistare, punto 5: "Oltre a fan cortesi e scortesi, potremmo incontrare anche opps (rivali) e
giornalisti che potrebbero fermarci a fare domande che poi faran notizia se son critiche. Ovviamente
i giornalisti si vedranno solo una volta famosi."

**FATTO (01/09/2026)** — `frontend/js/game/strada.js`, stesso elenco `INCONTRI` del punto 54.
L'opp c'era già (la circostanza 4 del punto 54, sotto): incrocia un rivale vero da `G.rivals`,
sbloccato da 300 fan. Mancava il **giornalista**, aggiunto qui: un cronista di «La Voce del Giro» —
la stessa testata che già firma i pezzi negativi degli altri incontri — ti ferma con una domanda
pescata fra sei, e hai due modi di rispondere.
- **Con cautela**: nessun rischio, nessun titolo, un pelo di benessere perso per la noia
  dell'intervista.
- **Senza filtri**: una frase a effetto — se `flow + presenza ≥ 24` (la stessa soglia già usata per
  l'hater) la becchi bene e diventa un pezzo che ti fa notizia buona (hype su, postato con
  `postaEvento`); altrimenti esce comunque un pezzo, ma contro di te (hype giù, benessere giù).
  «Faran notizia se son critiche» è proprio questo: rispondere di petto è quello che genera
  l'articolo, in un senso o nell'altro — con la cautela non esce nessun pezzo.
- **Si vede solo da famosi**: `req: () => G.fans >= 2000`, la stessa soglia con cui il giornalista
  compare già come ruolo alla Sala (`posto.js`, punto 43/54) — prima di allora nessun giornalista ti
  ferma per strada.

`liv:"medio"`, come l'hater: durante un salto di tempo (punto 4, sopra) si risolve da solo scegliendo
la risposta prudente, non ferma niente. `npm run prova` (28/28) e `npm run build` puliti; non l'ho
riprovato in Chrome in questa sessione (estensione non connessa) — la logica ricalca esattamente
quella già in produzione dell'hater e dell'opp, stessi helper (`pick`, `rnd`, `clamp`,
`postaEvento`), nessuna novità di sistema.

---

## 43 · I dialoghi devono essere tanti e diversi

43. I dialoghi di gioco devono essere molti e molto diversi tra loro, cosicche sembri ancora più realistico. 

   **FATTO in parte (01/09/2026)** — le chiacchierate della Sala
   (`DIALOGHI` in `frontend/js/game/posto.js`), che erano ferme a tre a
   testa (due per il giornalista) fin dal giorno in cui esiste la Sala:
   ognuno dei quattro ruoli **si ritrovava le stesse tre battute in loop**
   dopo la prima settimana, ed è esattamente il contrario di «sembra
   reale». Portati a **12 per beatmaker, rapper e fonico, 9 per il
   giornalista** — quaranta situazioni nuove in tutto, stesso formato di
   prima (una scena, tre risposte, i punti e il carattere che si scopre
   rispondendo giusto), niente logica toccata.
   **In parte** perché «molti e diversi» non ha un traguardo: la Sala oggi
   ha quattro volte le battute di prima, ma i dialoghi veri e propri delle
   **scene** (foglio, piazza, la sessione in studio con un beatmaker) non
   li ho toccati — sono un lavoro a parte, per quando quelle scene si
   riscrivono per davvero (punto 8, 14, e le «scene di gioco vere» che la
   Sala aspetta ancora). `npm run prova` (12/12) e `npm run build` puliti.

---

## 54 · Scenari veri, uguali nella forma e diversi nelle circostanze

54. Aggiungerei degli scenari veri e propri ; gli scenari vorrei fossero tutti uguali ma le circostanze TOTALMENTE DIVERSE, OVVERO ; 1) scenario trovi un fan carino che ti chiede la foto e poi posta pure su lafamegram 2) Trovi un fan maleducato che si pone in modi sbagliatissimi e magari interagendo e vedendo che non corregge i suoi comportamenti noi rifiutiamo la foto e qualcuno nelle vicinanze potrebbe notare questa cosa e i giornalisti poi farla uscire per parlare male di noi 3) in strada becchi un haters 4) in strada becchi un hopps 5) in strada becchi l'ex manager 6) in strada becchi ex amici 7) in strada becchi qualcuno con cui hai brutti rapporti nel gioco 8)

   **FATTO in parte (01/09/2026)** — `frontend/js/game/strada.js`, nuovo.
   Sette circostanze (1-7 della lista; l'8 non l'hai scritta, il testo si
   interrompe lì — niente da fare finché non arriva), **stessa forma per
   tutte**: ti fermano per strada, scegli come rispondere, l'esito è
   scritto (`showEvent`, lo stesso modale di sempre). Capita vivendo la
   giornata (`avanzaGiorno()`, sim.js — un giorno su tre circa), mai
   durante un salto di tempo, mai lo stesso giorno in cui chiude la
   settimana sopra al rapporto.
   - **Fan gentile**: la foto genera davvero un post su LaFamegram, dal
     fan, non da te — cuori legati all'hype del momento.
   - **Fan maleducato**: rifiutare la foto ha **una possibilità su tre**
     di finire come un pezzo negativo scritto da «La Voce del Giro» — la
     cosa che chiedevi, non un'accusa a caso ogni volta.
   - **Hater**: rispondere a tono rende bene se `flow + presenza ≥ 24`
     (e finisce su LaFamegram), altrimenti ti va male — un rischio vero,
     non un tiro di dado piatto.
   - **Opp**: pesca un rivale vero da `G.rivals`, disponibile solo con
     fama vera (300 fan); provocarlo conta i tuoi numeri contro i suoi.
   - **Vecchi amici**: solo dopo 8 settimane di carriera — prima non
     esisti abbastanza perché qualcuno si ricordi di te.
   - **Manager**: solo se `G.manager` è acceso.
   - **Brutti rapporti**: pesca chi hai perso alla Sala per davvero
     (`diventaOpp()`, punto 26) — non un rivale a caso, proprio quello con
     cui è finita male lì.
   Provato in Chrome: forzato l'incontro del fan gentile, hype e fan sono
   saliti, e il post «Ho appena incontrato Nuovo Artista per strada, che
   gasato 🔥» è apparso davvero su LaFamegram (in coda ai tuoi, davanti al
   resto — `G.lafamegramEventi`, nuovo campo).
   **In parte** per due motivi, entrambi scritti nel codice: **l'ex
   manager** non esiste come stato — il gioco non ha un modo di *lasciare*
   un manager, solo di averne uno o no, quindi qui è «il manager», non
   «l'ex»; **i vecchi amici** non hanno un elenco vero (non c'è una lista
   di amicizie precedenti alla fama) — è una faccia generica, gated solo
   sul tempo passato. Sistemare entrambi per bene vuol dire prima costruire
   quello stato altrove (licenziare un manager, tenere un elenco di
   amicizie), non è lavoro di questo file. `npm run prova` (12/12) e
   `npm run build` puliti.

---

## La vita simulata

Voglio che il gioco abbia vita simulata molto sviluppata. Non banalità, dobbiamo lanciare un gioco cche vogliamo sia molto valido.

---

## 65 · Un'età per i personaggi

65. Implementiamo anche le età nei personaggi di gioco, in tutti.

    **FATTO (01/09/2026)** — un'età vera per chi ha un'identità che torna: i tre/quattro volti alla
    Sala (`nuovaPersona()`, `posto.js`) e i rivali in classifica (`nuovoRivale()`, `rivals.js`). I
    beatmaker e i rapper partono dalla stessa fascia del giocatore (18-32); fonici e giornalisti, il
    cui mestiere presuppone anni di gavetta, da una fascia più alta (26-58). Si vede accanto al nome:
    nella scheda alla Sala, nella riga di classifica (schermata e telefono), e il giocatore stesso
    ora mostra la sua in classifica. **Non tocca gli incontri per strada** (punto 54: fan, hater,
    opp...): sono passanti generati al volo per un solo evento, non personaggi che restano — dargli
    un'età vera vorrebbe dire prima dargli un'identità vera, che il punto non chiedeva. I salvataggi
    vecchi restano senza età sui personaggi già creati (il gioco lo gestisce, non scrive «undefined»);
    quelli nuovi, da qui in avanti, ce l'hanno tutti.

---

---

## Le trasferte fuori città

_(«Da smistare» punto 9 di [`implementazioni.md`](implementazioni.md).)_

> aggiungi al sistema di gioco eventi che possono accadere durante la giornata, e se
> esistono già aggiungi la possibilità di venir chiamato in altre città d'Italia per un
> concerto o una pubblicità o altro, che creano di conseguenza altri eventi come ad
> esempio conoscere altre persone tipo producer, fonici o videomaker

**FATTO (02/09/2026)** — `frontend/js/game/trasferte.js`, `frontend/css/trasferte.css`.
Gli eventi dentro alla giornata c'erano già (`eventi-tempo.js` a minuti, `eventi-v2.js`
col catalogo da mille): il pezzo che mancava era **essere chiamati da fuori**. Adesso
c'è, e non come un bottone che regala fan: come una piccola spedizione narrativa.

    invito → viaggio → evento principale → incontri → conseguenze → nuove occasioni

### L'invito è una scelta, non un premio

Ogni giorno il gioco guarda se il giro fuori casa si sta accorgendo di te — fan, hype,
rete, livello, e la **reputazione** (`G.trasferte.rep`, 0–100, parte da 50: non è la fama,
è quanto sei uno su cui contare). Quando scatta, arriva una notifica sul telefono e una
finestra con tre risposte:

- **accetti** — paghi viaggio (26–150 € a seconda di quanto è lontana e di quante notti),
  energia e uno o due giorni di calendario;
- **ci pensi** — l'invito resta in agenda fino alla scadenza, che è vera: passata quella
  chiamano un altro e la reputazione scende;
- **rifiuti** — chi ti aveva chiamato si raffredda per davvero (il rapporto scende di un
  punto) e i rifiuti di fila dimezzano la probabilità delle chiamate successive.

**Non serve avere la città sbloccata.** Ci vai, lavori, torni: la trasferta sposta te, non
l'hub. Le tre città della carriera (punto 26) restano quelle.

### Dodici motivi per salire su un treno, diciotto città

I tipi: data live, apertura di un nome grosso, festival (due giorni), showcase, comparsata
in serata, sessione in studio, collaborazione, shooting, pubblicità, evento brand,
intervista, passaggio in radio. Ognuno ha le sue soglie (fan, hype, reputazione), il suo
costo, la sua resa e **la sua gente**: a uno shooting non conosci un promoter, conosci chi
tiene la luce.

Le città (Milano, Roma, Bologna, Torino, Napoli, Firenze, Verona, Padova, Brescia, Genova,
Rimini, Perugia, Pescara, Bari, Palermo, Catania, Cagliari, Trieste) hanno una distanza,
un peso di scena e un'**affinità di mestieri**: a Rimini escono DJ e proprietari di club, a
Milano A&R e manager. La città che il giocatore ha scritto nel creator è esclusa: lì ci
abita.

Ogni evento principale apre **tre modi di giocarlo**, e uno dei tre è sempre un rischio con
un tiro vero dietro (presenza, flow, scrittura, rete, hype). Chi resta fino a che chiudono
conosce più gente e dorme meno; chi fa il minimo torna a casa intero e invisibile.

### La rete si costruisce lavorando

Chi incontri entra in `G.gente` come tutti gli altri contatti — **stesso array, stesso
grado** (conoscenza → contatto → amico → collaboratore → fidato → partner) — con in più
`fuori:true`, la `citta` e un **requisito** per andare oltre (`reqKey`): un A&R conosciuto a
un festival te lo ricordi, ma finché non hai cinquemila persone che ti seguono resta un
numero in rubrica. I mestieri sono dodici: producer, rapper, fonico, videomaker, fotografo,
stylist, promoter, manager, DJ, proprietario di club, brand/agenzia, A&R — i nove nuovi si
registrano dentro a `POSTO_RUOLI` e `TEL_RUOLI` all'avvio, così La Sala e il telefono non si
trovano fra le mani un ruolo che non sanno disegnare.

**La Sala resta La Sala.** `sistemaGente()` e `presentiOggi()` (`posto.js`) girano su
`G.gente` senza quelli di fuori e se la ritrovano intera subito dopo: chi lavora a Napoli
non passa il martedì pomeriggio nella sala prove dietro al bar, e non ruba gli slot alla
provincia. Chi ti dà il numero e fa un mestiere che scrive in chat (producer, fonico) si
presenta da solo nei messaggi, come quelli di casa.

### Le catene

Una conoscenza che non torna mai è una riga in rubrica. Ogni persona che ti ha preso in
simpatia ha una probabilità di rifarsi viva **dopo settimane, non domani**, con una delle
tre cose che sa fare:

- **un invito** — ti chiama per un lavoro nella sua città (e lo vedi: «Ti hanno chiamato da
  Bologna. Selva: una sessione in studio»);
- **una presentazione** — ti passa a qualcun altro, che entra nella rete e che a sua volta
  potrà richiamarti: è qui che la catena riparte;
- **un'occasione** — una cosa piccola e concreta subito: una base nel catalogo, un mix, un
  video, uno scatto, un posto in scaletta, un consiglio che vale reputazione.

Il tipo dipende dal mestiere, il quando è casuale, il se dipende da quanto ci hai parlato.
Non c'è uno script: ci sono persone con una probabilità, ed è per questo che due partite
non raccontano la stessa storia.

### Le città si ricordano di te

`G.trasferte.citta[id]` tiene visite, fan locali e reputazione locale di ogni città
toccata. I fan di una serata restano per il 70% **lì**, la reputazione locale sale, e da
quel momento **da quella città ti richiamano più spesso**. Quando arriverà la mappa
d'Italia / il tour (punto 26) troverà i dati già pronti: è già la mappa, solo senza il
disegno sopra.

### Dove si vede

- **App «Trasferte» sul telefono** (icona valigia, badge sugli inviti aperti): gli inviti
  con il tasto per rispondere, le città con fan e reputazione, la rete divisa per città con
  il requisito di ognuno, e lo storico di quello che hai fatto.
- **App «Contatti»**: chi hai conosciuto fuori mostra la sua città accanto al ruolo e apre
  l'agenda invece di mandarti alla Sala a cercarlo, che lì non lo trovi.
- **Centro notifiche** di Eventi V2: inviti, scadenze e riepiloghi passano da lì, senza
  aprire un secondo centro notifiche.

### Note tecniche

- Si aggancia a `avanzaGiorno()` (`sim.js`), che è il motore unico del giorno: vale sia per
  «Fine giornata» sia per i salti.
- I giorni della trasferta si consumano **alla fine**, al ritorno, e durante quei giorni non
  nasce niente altro: se no torni da Bologna e trovi tre finestre impilate sopra al rapporto
  di fine settimana.
- Un refresh in mezzo a una trasferta la riprende dal punto giusto, e un invito ancora da
  rispondere torna a galla appena lo schermo è libero.
- Console: `TRASFERTE.debug()` per vedere probabilità, inviti, catene e rete;
  `TRASFERTE.forzaInvito("milano", "festival")` per provare senza aspettare.

---

---

## 10 · Il videomaker entra a La Sala

10. se vogliamo tenere la hub che in questo momento è chiamata sala, dove incontri le altre persone,
    sono da aggiungere i videomaker, Secondo me è meglio farla come mappa di gta con tutte le cose divise

    **FATTO (02/09/2026)** — branch `task/10-videomaker-nella-sala`.

    Il videomaker c'era già, ma solo **fuori**: nelle trasferte (`js/game/trasferte.js`, punto 9) lo
    incontri a uno shooting o a una pubblicità in un'altra città. In città non esisteva, e in città è
    quello che decide come ti si vede prima ancora di come suoni. Adesso è a La Sala insieme agli
    altri, con lo stesso trattamento: un mestiere vero, non una voce in più in un elenco.

    - **Si affaccia quando serve.** Come il giornalista arriva a 2000 fan, il videomaker arriva
      quando hai almeno un pezzo fuori: prima non avrebbe niente da girare.
    - **Dodici situazioni sue** (`DIALOGHI.videomaker`), come per beatmaker, rapper e fonico. Parla
      di immagini, di posti, di luce e di come vuoi essere visto — non di mix e non di beat, se no
      sarebbe un fonico con un altro nome. Il carattere si scopre parlando, come con tutti.
    - **Il numero si scambia anche con lui**, perché è uno che lavora sui tuoi pezzi: da lì in poi
      ti scrive in chat, con sei spunti scritti apposta (`chatSpuntiVideomaker`) e due aperture tue.
    - **«Fategli un video»** (da amici in su): costa energia e soldi — più caro se è uno che conta,
      meno caro se siete in confidenza — e sceglie il pezzo uscito da meno tempo che non ha ancora
      un video. Un pezzo, un video: non è una leva da tirare due volte sullo stesso.

    **Cosa fa un video, davvero.** Non è un colpo secco di hype che passa in una settimana. Resta
    attaccato alla canzone (`s.video`) e `songWeekly()` in `js/game/sim.js` lo legge **ogni
    settimana**: il pezzo continua a girare più a lungo invece di spegnersi con la curva. Sul
    momento arrivano anche un po' di hype e di fan, ma la roba vera è la coda. Nel catalogo, sotto
    al titolo, si legge «video di <nome>».

    **La seconda metà del punto** — «meglio farla come mappa di GTA con tutte le cose divise» — è
    esattamente quello che è successo con il punto 7 (`01-mappa-e-citta.md`): i luoghi sono
    diventati punti separati sulla mappa, ognuno con il suo cartello e la sua porta, e La Sala è uno
    di quelli. Qui non c'era altro da fare.

    File toccati: `js/game/posto.js`, `js/game/chat.js`, `js/game/sim.js`, `js/game/ui.js`,
    `index.html`.

---

## 14 · I dialoghi devono tornare fra di loro

14. Ci sono da correggere molte meccaniche di gioco; ad esempio in una conversazione in
    studio noto che con uno alla domanda «Mi presti il microfono» anche se gli dico di no
    l'amicizia con questo aumenta. Verifica che siano tutti coerenti tra di loro i dialoghi
    svolgendo simulazioni di gioco effettive.

    **FATTO (03/09/2026)** — `js/game/posto.js`, `strumenti/prova.js`.

    Era vero, e non era quella battuta: **era la regola.** Il bonus «hai capito che tipo è»
    — +1 quando la risposta è quella giusta per il carattere di chi hai davanti — si sommava
    a **tutte** le risposte, comprese quelle che valgono zero o meno. Così «gli dici che te
    lo tieni per te» (zero punti, etichettata «diffidente») davanti a uno diffidente
    diventava +1, e l'amicizia saliva **dicendo di no**.

    Adesso il bonus vale solo dove c'è già un passo verso di lui. Aver capito che tipo è
    resta vero comunque — `scoperto` si segna lo stesso: è la conoscenza, ed è giusta; è il
    *rapporto* che non deve crescere quando ti sei tirato indietro.

    La seconda metà della richiesta — «verifica che siano tutti coerenti svolgendo
    simulazioni di gioco effettive» — è diventata una prova che **gioca davvero**, invece di
    leggere il codice: ogni situazione, per ogni risposta, contro ognuno dei quattro
    caratteri, chiamando la `poRispondi()` vera. Sono 57 situazioni × 171 risposte × 4
    caratteri = **684 conversazioni giocate a ogni `npm run prova`**, e la domanda che fa è
    sempre quella: c'è un rifiuto che fa amicizia? Al primo giro ne ha trovati quindici,
    sparsi su tutti e quattro i ruoli. Adesso zero, e se qualcuno ne riscrive uno male lo
    dice subito.

    Nello stesso giro anche i controlli scemi che non c'erano: ogni situazione con almeno
    due risposte e nessuna ripetuta, ogni risposta con un testo, punti nella scala giusta e
    un carattere che esiste davvero.

---

## 6 · Al massimo una conversazione lunga al giorno

6. Con le persone non ci si può sentire sempre! Limitiamo il tutto a MASSIMO una
   conversazione lunga al giorno.

> **Fatto (05/09/2026).** Era vero solo a metà: `chatGiorno()` (i giorni normali della
> settimana) già sceglieva un solo contatto a caso su cui tirare il dado. Il buco stava in
> `chatSettimana()`, che gira una volta sola ma al cambio settimana — lì ogni contatto
> attivo tirava il **suo** dado per conto proprio (`c.spesso`, tipico 0,3–0,4): con quattro
> o cinque persone sbloccate (mamma, il tuo produttore, un beatmaker preso a La Sala, un
> giornalista...) potevano scriverti tutte lo stesso giorno, un coro invece che una persona
> alla volta.
>
> `js/game/chat.js`: `chatSettimana()` continua a far tirare il dado a ognuno (`c.spesso`
> resta "quanto spesso" di ognuno, non è stato toccato), ma adesso **sceglie una sola
> persona fra chi lo passa**, con lo stesso `pick()` che usa già `chatGiorno()` — non tutti
> quelli che passano il dado scrivono, solo uno. Dato che `avanzaGiorno()` (`js/game/sim.js`)
> chiama `chatSettimana()` o `chatGiorno()` per un dato giorno ma mai tutti e due insieme (il
> giorno del cambio settimana esce prima di arrivare a `chatGiorno()`), il risultato è che in
> nessun giorno del calendario può scriverti più di una persona.
>
> Non tocca `chatIniziaTu()` (quando scrivi tu per primo) né quante risposte puoi dare dentro
> a una conversazione già aperta: il limite riguarda solo chi **prende l'iniziativa**, non
> quanto puoi rispondere una volta che qualcuno ti ha scritto.
>
> Un controllo nuovo in `strumenti/prova.js`: forza il dado di ognuno a passare sempre
> (`Math.random` a 0, dentro alla sandbox del test) su tre contatti attivi insieme e chiama
> `chatSettimana()` venti volte, verificando che non scriva mai più di una persona per
> chiamata. `npm run prova` pulito sulla parte chat; le due prove che risultano rotte
> (`js/creator3d/*`) sono lavoro di un altro, non toccato da qui.
