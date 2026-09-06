quando finisci una task committa e pusha e nel committ fai riferimento al punto del file completato. Se vedi che viene modificato il file non preoccuparti, sono io, tu continua con quello che stai facendo, ogni volta che finisci un task segnalo come completato

# Punti nuovi

**Scrivi qui.** Questo è il foglio dove si butta l'idea appena viene, senza pensare a dove
va: un punto, una riga, anche di corsa. Poi si sposta nel file dell'argomento giusto, con
sotto scritto cosa è stato fatto.

I punti di prima — tutti e sessantasette — stanno nella cartella
**[`implementazioni/`](README.md)**, divisi per argomento:

|                                                                | argomento                                       |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [`00-come-si-lavora.md`](00-come-si-lavora.md)                 | le regole di lavoro                             |
| [`01-mappa-e-citta.md`](01-mappa-e-citta.md)                   | la plancia, la mappa, le tre città              |
| [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md) | schermate, navigazione, il telefono, il negozio |
| [`03-artista-e-avatar.md`](03-artista-e-avatar.md)             | la faccia, i vestiti, chi sei                   |
| [`04-musica-e-suoni.md`](04-musica-e-suoni.md)                 | barre, beat, freestyle, come suona              |
| [`05-carriera-e-tempo.md`](05-carriera-e-tempo.md)             | energia, giornate, livelli, salvataggi          |
| [`06-mondo-e-personaggi.md`](06-mondo-e-personaggi.md)         | La Sala, i contatti, gli opps, la strada        |
| [`07-multiplayer-e-backend.md`](07-multiplayer-e-backend.md)   | la classifica vera, gli account, il cloud       |
| [`08-uscita-sugli-store.md`](08-uscita-sugli-store.md)         | Steam, App Store, Play Store                    |
| [`09-grafica-e-asset.md`](09-grafica-e-asset.md)               | ambientazioni, foto, branding                   |

L'indice con **tutti i punti e il loro stato** sta in
[`implementazioni/README.md`](README.md).

---

## Da smistare

_(qui sotto finiscono i punti nuovi, appena scritti)_

ALE:

1. Rendi accessibile lo shop già dalla città iniziale, con limitazioni sui prodotti in vendita

2. i rapporti con i beatmaker non vanno mai in negativo, puoi offenderli quanto vuoi e il rapporto resta uguale

3. Ci sono i prezzi dei beat spropositati. Non ha senso che alcuni beat costino 700 euro al livello quattro. Facciamo prezzi realistici : da 100 a 250 euro beat da beatmaker emergenti , da 300 euro a 1000 per beatmaker affermati e da 1000 a 2000 per beatmaker famosissimi

4. Il giocatore parte con tutti i parametri a 1

5.

CARLO:

/_ GIORNALIERE _/

1. creare canzoni con l'ia, guarda cartella musica nei segnalibri, task giornaliera quindi da non smistare

/_ DA FARE _/

1. mi piace il po-up che esce quando non hai energia e clicchi sull'azione Freestyle in piazza, applica lo stesso pop-up ad ogni azione se manca energia, aggiungici anche un'icona dele fulmine, la stessa della navbar

2. implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo
   Nel dettaglio: il primo video parte quando il player clicca sul luogo chiamato "studio", il
   secondo quando clicca su "sala", il terzo quando decide di tornare a "casa", il quarto su
   "stacca la spina", il quinto su "registra un pezzo".

3. quando skippi tante ore ci mette troppo a simulare

4. nei pulsanti dei luoghi della mappa tieni solo il riquadro con nome e sfondo nero e togli il bordo neon presente dietro (il quadrato con i lati tagliati e i bordi molto smussati)

/_ DA DISCUTERE _/

1. DA DISCUTERE aggiungere la reputazione cioè quanto sei affidabile, il massimo è real/real oppure OG, e il minimo tipo figlio di troia quando ti comporti da figlio di troia (detto meglio) O TENERE SOLO LA FAMa

2. DA DISCUTERE togli il parametro «lucidità» e tutto ciò che ne consegue

3. DA DISCUTERE aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

4. DA DISCUTERE Dopo aver completato milano ed essere diventato goat ed essere andato a los angeles il player può decidere se trasferirsi in un'altra città italiana o per forza a Los Angeles?

5. DA DISCUTERE Non è più: "Faccio un pezzo → +10 fama", ma diventa:

TRACK
│
├── Beat
├── Producer
├── Studio
├── Mix
├── Testo
├── Cover (influenza meno, ma ha 3 opzioni: caricamento file da telefono/computer, assets preimpostati e personalizzazione stile emblema black ops 2)
├── Featuring
├── Marketing
└── Timing

E ogni elemento influenza il risultato.

Esempio:

"TUTTO O NIENTE"

Beat 82
Testo 76
Performance 91
Studio 74
Mix 68
Feature 85
Marketing 53
────────────────────
QUALITÀ 78

Poi:

QUALITÀ 78
HYPE 82
FAMA 31
NETWORK 64

→ 43.000 streams.

è possibile controllare come stanno andando le canzoni nel tempo da un'app del telefono per sapere se stanno invecchiando bene o male e magari farci delle remastered o parti 2 di una canzone o di un album

/_ PAGINA DI LANDING: _/

1. migliorare graficamente la schermata opzioni

2. creare una schermata per le classifiche che si apre anche dall'app del telefono

3. DA DISCUTERE collegare la pagina di mycol togliere la sezione il tuo artista dalla pagina di landing o , oltre che da nuova partita. e collegarla allo shop, se shoppi qualcosa ti va nell'inventario

/_ NUOVE MODALITA' _/

Nelle cose da mettere dopo aver masterizzato il gioco, creiamo delle nuove modalità giocabili/DLC:

ESEMPI NUOVE MODALITA' DI GIOCO:

1. MODALITA' CARRIERA STUDIO:

- Il personaggio creato dall'utente è un rapper di uno studio e devi portare lo studio al top (es. La fame studio) e avere lo studio migliore contro altri studi gestiti da altri player attivi

2. MODALITA' A SCELTA DI CITTA' DI PARTENZA E LIBERA: puoi decidere in che città nascere e in base a quello hai pro o contro. Il player sceglie tra un numero di città predefinito e poi si può spostare in tutto il mondo (forse meno)

3. MODALITA' CON PIU' CITTA' FINALI: dopo esserti stabilizzato a Los Angeles e, dopo aver creato contatti con personaggi di altre città o che lavoro in altre città o inviti per telefono che ti ha fatto ricevere il manager sblocchi la possibilità di andare o trasferirti in altre città come:

- Chicago i crimini sono più facili ma c'è più criminalità/concorrenza ed è più difficile affermarsi
- Las vegas: per avere i casinò migliori e i locali top per massimizzare il lifestyle così puoi averlo al massimo e sbloccare un'altra cosa es. un titolo da esporre nella descrizione del profilo tipo: JOHN GOTTI
- Atlanta/New York: più focalizzata sul conoscere artisti famosi come 21 Savage, Future, Young Thug

/_ FATTE _/

1. PRIMA DI TUTTO, risolvere problema con pagina di attività criminali.

   **FATTO (06/09/2026)** — la pagina **tagliava i pezzi**, e a qualsiasi misura: a
   1366 × 768 «Molla il giro» non c'era proprio e il TRAPHONE era segato a metà, a
   1440 × 900 «Molla il giro» era tagliato, perfino a 1920 × 1080 la frase in fondo alla
   colonna destra finiva a metà parola. E i due titoloni — «Qui niente è pulito.» e il «Sei
   dentro.» del carcere — si scrivevano addosso da soli, con l'accento di «È» dentro la riga
   di sopra. Motivo: la schermata è alta quanto la finestra e ogni pannello ha
   `overflow:hidden`, così quello che non ci sta non si vede **e non si raggiunge**; l'ultimo
   ritocco ai caratteri aveva alzato tutti i corpi e il conto non tornava più. Adesso le due
   colonne scorrono (la rete di sicurezza), sotto i 900 e sotto i 760 di altezza la colonna
   di sinistra si stringe quel tanto che basta perché «Molla il giro» si veda senza scorrere,
   sotto gli 800 il titolone restituisce ai quattro colpi lo spazio delle targhette, e la
   riga delle città prende l'altezza che le serve. **Le regole di gioco non sono state
   toccate.** Provata tutta la partita nella pagina, e il carcere, a quattro misure. Per
   esteso in
   [`06-mondo-e-personaggi.md`](06-mondo-e-personaggi.md#21--la-professione-del-criminale).

2. dividi tutti i file .md sparsi in cartelle con nomi coerenti, inoltre smista le task fatte da implementazioni.md

   **FATTO (06/09/2026)** — in radice restano solo `README.md` e `ROADMAP.md`, che sono le
   due porte d'ingresso. Gli altri sono andati in due cartelle nuove, ognuna col suo README:
   **`documentazione/`** (i comandi del terminale, i riferimenti visivi, i problemi trovati)
   e **`prompt/`** (i prompt per farsi fare le immagini: ambientazioni, app del telefono,
   foto da creare). `stili interfaccia schermata di gioco.md` ha perso gli spazi nel nome ed
   è `documentazione/stili-interfaccia.md`: con gli spazi ogni collegamento diventava
   `stili%20interfaccia%20...`. Aggiornati tutti i rimandi — README, ROADMAP, frontend, i
   file di implementazioni — e la mappa dei documenti in cima al README di radice. Restano
   dove sono `PROVARE.md` e `backend.md`: sono appunti locali fuori da git apposta, e
   spostarli vorrebbe dire rompere le righe che li tengono fuori. Lo smistamento delle task
   fatte è la seconda metà del punto, ed era già stato fatto: i punti chiusi stanno nel file
   del loro argomento e l'indice è [`README.md`](README.md).

3. gli eventi in basso sono cliccabili, e puoi segnarli nell'agenda, quando scatta l'ora o poco prima, arriva una notifica

   **FATTO (06/09/2026)** — ogni card degli eventi ha adesso un quadratino in alto a destra:
   toccalo e l'evento finisce in agenda. **Un quarto d'ora prima dell'ora arriva la
   notifica** — un toast a schermo e una riga nel centro notifiche del telefono, quello che
   c'era già. Se nel frattempo il tempo è saltato oltre (una mossa lunga, un +1 ora) la
   notifica arriva lo stesso e cambia parole: «è cominciata» invece di «fra poco». Il motore
   è `frontend/js/game/agenda.js` e ascolta l'orologio del gioco (`game-time:advanced`), non
   un timer suo: se il tempo non si muove, non succede niente. Per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).

4. possono verificarsi eventi settimanali, da segnare in agenda anche quelli e la matina del giorno stesso arriva la notifica

   **FATTO (06/09/2026)** — al posto del riquadro «Più avanti…», che prometteva senza dire
   cosa, adesso c'è **«Questa settimana»** con due eventi veri: giorno, ora e a cosa
   portano. Sono sei in tutto e ne escono due per settimana, sempre le stesse due per quella
   settimana lì (il seme è il numero della settimana, non il caso: la plancia si ridisegna
   in continuazione e col caso cambierebbero sotto gli occhi). Si segnano come gli altri, e
   **la mattina del giorno stesso arriva la notifica**. Stessa cosa per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).

5. ALE 1 — le chat nel cellulare erano infinite e sempre uguali: si poteva sentire la
   stessa persona all'infinito e farmare il benessere con la solita conversazione.

   **FATTO (06/09/2026)** — `chatIniziaTu` non aveva nessun limite: si apriva «Ciao ma',
   tutto bene?», si rispondeva «Mangio, tranquilla» (+4 benessere) e si ricominciava, nello
   stesso istante. Adesso **ogni contatto si sente una volta al giorno**: la prima volta che
   scrivi tu o che ti scrivono resta segnata (`chatGiornoChiave` / `chatGiaSentitoOggi` /
   `chatSegnaSentitoOggi` in `frontend/js/game/chat.js`), un secondo «scrivi tu» con la
   stessa persona lo stesso giorno viene rifiutato con un avviso, e torna disponibile il
   giorno dopo. Il limite sopravvive al salvataggio. La parte «ti scrivono loro
   sporadicamente» — il dado giornaliero e settimanale, gli spunti che non si ripetono —
   c'era già e non è stata toccata. Commit `f72dd92`.

6. ALE 6 — le azioni ripetibili facevano farmare senza gameplay: la battle di freestyle
   doveva diventare un evento esclusivo, e gli eventi non dovevano valere tutti uguale.

   **FATTO (06/09/2026)** — la battle vera in piazza è **una volta a settimana, e solo fra
   le 21:00 e le 00:30**, con un contatore settimanale suo (`adfSettimana` /
   `adfSegnaSettimana`). «Serata open mic» la seconda volta nello stesso giorno rende la
   metà. E i sei eventi settimanali dell'agenda hanno un **peso d'importanza** che scala
   davvero la ricompensa quando li giochi nel loro giorno: freestyle, open mic, promo,
   palestra, sessione alla Sala, colpo della Strada. Commit `a4073c3`.

7. ALE 7 — l'hype: dev'essere il fattore primario, in scala internazionale, e impossibile
   da avere alto restando nel paesino di provincia al primo anno.

   **FATTO (06/09/2026)** — l'hype ha un **tetto legato alla fase della carriera** (da 20 a
   100), applicato ovunque cresca, senza toccare le soglie delle prove di passaggio. La
   promo ha anche un tetto settimanale sull'hype — i follower continuano a crescere lo
   stesso, che è la cosa realistica. Scalare in classifica dà un bonus d'hype vero, e un
   feat scala per la grandezza (rara) del collaboratore invece di valere sempre uguale:
   con pinko pallino non si va in hype. Commit `a4073c3`.

8. gli eventi segnati in agenda devono bloccare lo skip

   **FATTO (06/09/2026)** — un appuntamento segnato ferma il salto del tempo: se prima
   dell'ora a cui sei diretto c'è qualcosa in agenda, il tempo si ferma lì e te lo dice,
   invece di scavalcarlo. Commit `efa2033`.

9. una pagina per ogni azione, con interfaccia e bottoni cliccabili a schermo — ha senso?
   Un README che analizzi e progetti tutto, coi pro e i contro.

   **FATTO (06/09/2026)** — l'analisi e il progetto di ogni schermata, pro e contro
   compresi, stanno in `frontend/pagine/README.md`. Commit `180960c` e `4925a82`.

10. implementare il telefono nuovo, si vede nei media la foto

    **FATTO (06/09/2026)** — la home del telefono nella plancia è adesso quella della foto
    `frontend/media/photo/pagina di gioco/schermata_telefono.png`: **sfondo** (il rapper di
    spalle davanti alla città di notte), **nove icone su quattro colonne**, **dock** in
    fondo con Messaggi, Contatti, Notizie, Classifiche, e la barra di stato con l'isola
    dentro allo schermo invece che in una fascia sopra al vetro. Le icone non sono
    ridisegnate: sono **ritagliate dalla foto** e stanno in `frontend/media/telefono/`. Le
    palline rosse della foto sono state cancellate una per una, perché quei numeri li deve
    dire la partita — e infatti li dice. **Tutte e quindici le app aprono**, comprese le due
    che si registrano a partita avviata (Notifiche, Trasferte): quelle non hanno una foto e
    tengono il loro disegno, dentro a una piastrella copiata dalle altre. I widget che
    stavano sopra la griglia non ci sono più: nella foto la home è solo icone e sfondo.
    Per esteso in
    [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#68--il-telefono-nuovo-quello-della-foto).
