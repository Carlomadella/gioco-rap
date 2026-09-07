# Le task fatte

I punti chiusi che stavano in [`implementazioni.md`](implementazioni.md), tolti da lì il
07/09/2026 perché quel foglio deve restare corto: è il posto dove si butta l'idea appena
viene, non l'archivio.

**Il racconto lungo di quasi tutte sta nel file del loro argomento** — è la regola scritta
in [`come-si-lavora.md`](../documentazione/come-si-lavora.md), e l'indice di tutti i punti
col loro stato è [`README.md`](README.md). Qui c'è quello che era rimasto indietro nel foglio dei
punti nuovi: la richiesta com'era scritta e la nota di cosa è stato fatto, verbatim, senza
riscriverle.

Qualche punto era stato segnato due volte — una volta nella lista dove era nato e una
nelle FATTE. Dove è successo trovi tutte e due le note, una sotto l'altra: nessuna delle
due si butta, perché dicono cose diverse (una i dettagli, l'altra il commit).

**I numeri delle liste in `implementazioni.md` non sono stati rifatti.** Le liste hanno
dei buchi dove stavano questi punti, ed è voluto: `frontend/js/game/studio.js` e
[`../documentazione/pagine-azioni/README.md`](../documentazione/pagine-azioni/README.md)
citano «il punto 4 di CARLO» e «il punto 4 di ALE», e rinumerare li farebbe puntare a
un'altra cosa.

| quando | quante |
| --- | --- |
| 07/09/2026 | 5 |
| 06/09/2026 | 10 |

---

## 07/09/2026

### Via il principio zero-dipendenze, al suo posto una regola

_Da `implementazioni.md`, CARLO · DA FARE 10._

10. togli il principio zero-dipendenze, migliora il progetto in base a questo cambiamento, riporta le idee in questo file (implementazioni.md), elenca anche tutte le dipendenze che si potrebbero installare e la descrizione di ognuna

    **FATTO (07/09/2026)** — branch `task/via-lo-zero-dipendenze`. Il principio è tolto: al
    suo posto c'è una **regola**, che è una cosa diversa. «Zero dipendenze» era uno slogan, e
    come tutti gli slogan rispondeva prima di sentire la domanda; la regola nuova la domanda
    la fa, e qualche volta risponde ancora di no.

    > Le dipendenze si possono usare. Ognuna si sceglie, si motiva in una riga e si può
    > togliere. Non è «meno pacchetti possibile»: è «nessun pacchetto per caso».

    **Tutto sta in [`documentazione/dipendenze.md`](../documentazione/dipendenze.md)** — le
    cinque domande, il prezzo, il registro di quello che è installato (esbuild e pg, con
    dietro a quale file nostro stanno), il ragionamento coi pro e i contro, e l'elenco
    commentato di tutto quello che si potrebbe installare. Le tre da fare per prime, decise e
    non ancora installate: `jose`, `eslint`, `vitest` + `jsdom`.

    Fatto anche il prezzo che la regola si impone: `npm audit` è entrato in `npm run verifica`
    (`verifica:dipendenze`), e i rimandi in giro per il repo non citano più il numero di
    questo punto ma il registro, che non si rinumera.

### L'avviso quando manca l'energia, su tutte le mosse

_Da `implementazioni.md`, CARLO · DA FARE 3._

3. mi piace il pop-up che esce quando non hai energia e clicchi sull'azione Freestyle in piazza, applica il pop-up ad ogni azione se manca energia, aggiungici anche un'icona del fulmine, la stessa della navbar

   **FATTO (07/09/2026)** — branch `task/popup-energia`. L'avviso c'era già, ma usciva
   da un posto solo: i cartelli della mappa. Le mosse però si lanciano da **quattro**
   posti — i cartelli, le card di «Eventi e attività di oggi», le tile della Settimana e
   l'agenda del telefono — e negli altri tre il bottone si spegneva e basta: ci clicchi
   sopra e non succede niente, senza che nessuno ti dica perché.

   Adesso l'avviso è uno solo (`avvisoSenzaEnergia` in `actions.js`) e risponde da tutti
   e quattro, col **fulmine della barra in alto**: non ricopiato, preso da `HIC.energia`,
   così se un giorno cambia il fulmine cambia anche qui. Dice pure i numeri — quanta
   energia chiede la mossa, quanta ne hai — e come si rimedia, cioè dormendo.

   **La regola: solo l'energia si comporta così.** Gli altri «no» (sei in carcere, serve
   un beat, servono i soldi, è l'ora sbagliata) sono cose che ti devi andare a prendere,
   e il motivo è già scritto sul bottone: quelli restano spenti come prima. L'energia no,
   torna da sola: è l'unico «no» che vale la pena spiegare. Quindi **solo** quando manca
   _soltanto_ l'energia (`soloSenzaEnergia`) la mossa resta cliccabile — spenta a
   vedersi, con la classe `.spenta` che copia l'aspetto di `:disabled` — e risponde.
   Se manca l'energia _e anche altro_, resta disabilitata: un avviso che parla di
   energia mentre il vero problema è che sei in carcere farebbe più danni che altro.

   Provato in Chrome su tutti e quattro i punti d'ingresso: l'avviso esce col fulmine e
   **l'energia non viene toccata**. Controllati anche i casi che non devono cambiare —
   con l'energia piena ma senza beat «Registra» resta disabilitata e muta, senza energia
   _e_ senza beat pure, e con l'energia che basta la mossa parte come sempre (energia
   scalata, scena aperta). `npm run prova` 70/70, audit 260/260, `verifica:build` 33/33.

### L'archivio delle statistiche nel telefono

_Da `implementazioni.md`, ALE 14._

14. L'app statistiche nel cellulare ora riporta statistiche che già trovi in game; Vorrei altre statistiche: Statistiche in studio con Brani pubblicati, contatti fatti, videoclip registrati, impression totali, insomma un vero e proprio archivio di tutte le statistiche più importanti che poi i nostri player si vanno a leggere.

    **FATTO (07/09/2026)** — primo giro: aggiunto un «Archivio» sotto ai numeri
    di sempre. Sbagliato: quei numeri (energia, benessere, hype, fan, soldi...)
    sono esattamente quello di cui l'utente si lamentava, e lasciarli lì sopra
    voleva dire non aver cambiato niente di quello che dava fastidio. Tolti del
    tutto. Poi arricchito ancora, come richiesto: adesso `schermataStatistiche()`
    (`frontend/js/game/telefono.js`) è **solo** un diario di bordo — tre gruppi,
    quindici righe, tutte cose che non stavano scritte da nessuna parte tutte
    insieme e che non scendono mai.
    **Carriera**: settimane di carriera, età, fase raggiunta, traguardi
    raggiunti su quanti ce ne sono, record di fan, record in classifica.
    **Musica**: brani pubblicati, dischi certificati, videoclip registrati,
    impression totali (somma degli stream di tutti i pezzi), punti abilità
    totali (le quattro skill sommate).
    **Palco e giro**: contatti fatti, e tre contatori del tutto nuovi che prima
    non esistevano proprio — nessuna azione teneva il conto di quante volte
    l'avevi fatta: **serate live fatte** (`actions.js`, azione «Serata open
    mic»), **feat realizzati** (sia quello con un beatmaker della Sala,
    `posto.js`, sia quello casuale, `events.js`) e **colpi messi a segno**
    (`strada-crimine.js`, solo i colpi riusciti). Il contenitore è
    `G.diario` — nuovo in `state.js` (`diarioBordo()`, con lo stesso schema
    difensivo di `chatTraccia()`/`ag()`: un salvataggio vecchio senza il campo
    se lo ricostruisce da solo). `npm run prova` (70/70) più due verifiche
    dedicate fuori dal browser: le formule del diario, e i tre contatori nuovi
    provati sul codice vero (azione live, feat alla Sala, colpo della Strada).

### Un file coi comandi del terminale

_Da `implementazioni/00-come-si-lavora.md`, punto 49 — stavano in coda alle regole di
lavoro, che sono regole e non un archivio._

49. Creami il file comandidelterminale.md in cui scrivi tutti i comandi da lanciare nel terminale per essere sempre aggiornati a vicenda con carletto e per fare partire il frontend e backend

    **FATTO (01/09/2026).** `documentazione/comandidelterminale.md` (stava in radice fino al
    punto sui file .md in cartelle con nomi coerenti): git (status/pull/push e cosa fare se
    il push viene rifiutato), i quattro comandi del frontend (dev/build/demo/prova), i
    cinque del backend (start/prova/postman/copia/travaso), come farli girare insieme in due
    terminali, e i problemi comuni (porta occupata, Node troppo vecchio).

### Restare sempre aggiornati col repo

_Da `implementazioni/00-come-si-lavora.md`, punto 56._

56. Assicurati sempre di essere aggiornato col mio github e quello di carletto.

    **FATTO (01/09/2026)** — è già la regola fissa di ogni sessione: `git fetch` e verifica
    prima di lavorare, e prima di ogni push. In quella sessione è arrivato un push di
    Carletto proprio a metà lavoro (il ridisegno della plancia); niente da fare oltre a
    continuare a farlo a ogni giro, cosa già in corso. La regola sta in
    [`../documentazione/come-si-lavora.md`](../documentazione/come-si-lavora.md).

---

## 06/09/2026

### Le chat del telefono non vanno più in loop

_Da `implementazioni.md`, ALE 1._

1. Le chat nel cellulare allo stato attuale sono infinite e sempre ripetitive. Volendo noi potremmo looppare all'infinito di parlare con nostra madre e farmare il (+benessere) con la solita conversazione. Non va bene, noi vogliamo che sia tutto più realistico possibile. dobbiamo far avere conversazioni uniche ogni volta e soprattutto non possiamo sentire più di una volta al giorno la stessa persona, tutt'anzi le persone ci scriveranno sporadicamente Nel cellulare volendo

   **FATTO (06/09/2026)** — il loop era proprio quello descritto: `chatIniziaTu`
   (il "scrivi tu" del telefono) non aveva nessun freno, quindi si poteva aprire
   «Ciao ma', tutto bene?», rispondere «Mangio, tranquilla» (+4 benessere,
   `chBene`), e ripetere all'infinito nello stesso istante. Adesso `chat.js`
   tiene un identificatore di giorno per contatto (`chatGiornoChiave`,
   anno:settimana:giorno, lo stesso schema di `actions.js` ma tenuto in proprio
   perché il file deve reggere anche da solo — i test in `prova.js` lo caricano
   fuori dal browser): la prima volta che **scrivi tu o ti scrive lui/lei**
   quel giorno lì (`chatSegnaSentitoOggi`, chiamata sia da `chatIniziaTu` che
   da `chatScrive`) resta segnato, e un secondo «scrivi tu» con la stessa
   persona lo stesso giorno non parte — un toast lo dice («L'hai già sentito
   oggi»), niente ricompensa doppia. Il giorno dopo torna disponibile. Non ho
   toccato il lato «le persone scrivono sporadicamente»: `chatSettimana`/
   `chatGiorno` (dado a testa, una persona sola al giorno) e la non-ripetizione
   degli spunti (`chatSpunto`, mai lo stesso di fila, 6 settimane prima di
   ripescarli) c'erano già e reggevano bene ai test — il buco era solo nel ramo
   comandato dal giocatore. `npm run prova` (70/70) più una verifica dedicata
   fuori dal browser sul nuovo limite (stesso giorno bloccato, giorno dopo
   sbloccato, segnato anche quando scrivono loro, sopravvive al salvataggio).

_Lo stesso punto era segnato una seconda volta, nelle FATTE, con questa nota:_

1. ALE 1 — le chat nel cellulare erano infinite e sempre uguali: si poteva sentire la
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

### Le azioni ripetibili, e la battle di freestyle come evento

_Da `implementazioni.md`, ALE 6._

6. Le azioni ripetibili che facevano farmare facilmente senza avere un gameplay dinamico troviamo un modo per limitarle realisticamente nella possibilità di eseguirla ; Ad esempio la battle di freestyle potremmo metterlo come 'Evento esclusivo' Una sola volta alla settimana e in un orario specifico.
   Inoltre, per aumentare la dinamicità, potremmo fare che NON tutti gli eventi danno gli stessi hype, soldi, fan.. dipende dall'importanza dell'evento stesso della settimana.

   **FATTO (06/09/2026)** — la battle vera di «Freestyle in piazza» (il minigioco
   della piazza, quello che vale ×1,5) è diventata l'evento esclusivo chiesto: **una
   volta a settimana**, e solo la sera fra le **21:00 e le 00:30** (lo stesso orario
   che l'hub usa già, `orari.js`). Il conto lo tiene `freestyleBattagliaOk()` in
   `actions.js`, con un contatore settimanale nuovo (`adfSettimana`/`adfSegnaSettimana`,
   lo stesso schema del contatore giornaliero che c'era già). Fuori da lì resta
   sempre disponibile il giro veloce, più modesto — non si perde energia a vuoto se
   provi a giocarla comunque, semplicemente non scatta il jackpot. Stessa cosa per
   «Serata open mic»: la seconda volta nello stesso giorno rende la metà, sul
   modello già collaudato dalla doppia sessione in palestra.
   Per la seconda parte — **non tutti gli eventi valgono uguale** — i sei eventi
   della settimana in agenda (`agenda.js`, `SETTIMANALI`) hanno adesso un `peso`
   (da 1,1 per «Porte aperte in palestra» a 1,6 per «Il giro grosso»): se segni
   l'evento in agenda e lo giochi proprio nel suo giorno, l'azione vera dietro
   (`free`/`live`/`promo`/`palestra_pesi` in `actions.js`, la sessione della Sala in
   `posto.js`, il colpo della Strada in `strada-crimine.js`) rende di più — una
   volta sola a settimana, poi il bonus è consumato (`AGENDA.consumaPeso`). Se non
   la segni o non è il giorno giusto, gioca come prima. `npm run prova` (70/70) più
   una verifica dedicata fuori dal browser (esclusività settimanale, orario,
   contatore che si azzera con la settimana nuova).

_Lo stesso punto era segnato una seconda volta, nelle FATTE, con questa nota:_

1. ALE 6 — le azioni ripetibili facevano farmare senza gameplay: la battle di freestyle
   doveva diventare un evento esclusivo, e gli eventi non dovevano valere tutti uguale.

   **FATTO (06/09/2026)** — la battle vera in piazza è **una volta a settimana, e solo fra
   le 21:00 e le 00:30**, con un contatore settimanale suo (`adfSettimana` /
   `adfSegnaSettimana`). «Serata open mic» la seconda volta nello stesso giorno rende la
   metà. E i sei eventi settimanali dell'agenda hanno un **peso d'importanza** che scala
   davvero la ricompensa quando li giochi nel loro giorno: freestyle, open mic, promo,
   palestra, sessione alla Sala, colpo della Strada. Commit `a4073c3`.

### L'hype come fattore primario, col tetto legato alla fase

_Da `implementazioni.md`, ALE 7._

**Il punto 7 di ALE è rimasto in [`implementazioni.md`](implementazioni.md), apposta.** È
chiuso, e lì sotto ha la sua nota lunga coi file toccati — ma ha una coda che non è ancora
stata fatta: **il pub e la pubblicità sui social come primo modo di fare hype a inizio
carriera**, che oggi non esistono né come luogo né come azione. Finché quella coda è lì, il
punto resta nella lista. Qui sotto c'è la nota breve che stava nelle FATTE.

1. ALE 7 — l'hype: dev'essere il fattore primario, in scala internazionale, e impossibile
   da avere alto restando nel paesino di provincia al primo anno.

   **FATTO (06/09/2026)** — l'hype ha un **tetto legato alla fase della carriera** (da 20 a
   100), applicato ovunque cresca, senza toccare le soglie delle prove di passaggio. La
   promo ha anche un tetto settimanale sull'hype — i follower continuano a crescere lo
   stesso, che è la cosa realistica. Scalare in classifica dà un bonus d'hype vero, e un
   feat scala per la grandezza (rara) del collaboratore invece di valere sempre uguale:
   con pinko pallino non si va in hype. Commit `a4073c3`.

### Gli eventi segnati in agenda bloccano lo skip

_Da `implementazioni.md`, CARLO · DA FARE 1._

1. gli eventi segnati in agenda bloccano lo skip

   **FATTO (06/09/2026)** — branch `task/agenda-blocca-skip`. Un appuntamento segnato
   ferma il salto del tempo: se è oggi il salto non parte, se è più avanti il salto
   arriva alla sua mattina e lì si pianta, qualunque taglia avessi scelto.
   - il taglio sta in `frontend/js/game/agenda.js`, che incarta `saltaGiorni()` una volta
     sola: vale per il menu «Salta avanti», per i tasti +1/+7 del widget e per la
     ripresa dopo un evento alto
   - un'ora già passata non blocca niente, se no un appuntamento mancato alle 21:00
     terrebbe fermo il tempo fino a mezzanotte
   - lo dicono anche le scritte: il menu «Salta avanti» avvisa prima di scegliere, il
     widget del tempo scrive chi ha fermato il calendario, e all'arrivo parte la
     notifica «Oggi: …» invece di quella del mattino
   - «Fine giornata» resta libero apposta: è una mossa sola e deliberata, e bloccarla
     rischierebbe di incastrare la partita
   - dettagli in
     [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).

_Lo stesso punto era segnato una seconda volta, nelle FATTE, con questa nota:_

1. gli eventi segnati in agenda devono bloccare lo skip

   **FATTO (06/09/2026)** — un appuntamento segnato ferma il salto del tempo: se prima
   dell'ora a cui sei diretto c'è qualcosa in agenda, il tempo si ferma lì e te lo dice,
   invece di scavalcarlo. Commit `efa2033`.

### Il telefono nuovo, quello della foto

_Da `implementazioni.md`, CARLO · DA FARE 2._

2. implementare il telefono nuovo, si vede nei media la foto

   **FATTO (06/09/2026)** — per esteso al punto 10 delle FATTE qui sotto e in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#68--il-telefono-nuovo-quello-della-foto).

_Lo stesso punto era segnato una seconda volta, nelle FATTE, con questa nota:_

1. implementare il telefono nuovo, si vede nei media la foto

   **FATTO (06/09/2026)** — la home del telefono nella plancia è adesso quella della foto
   `frontend/media/photo/pagina di gioco/schermata_telefono.png`: **sfondo** (il rapper di
   spalle davanti alla città di notte, che riempie tutto lo schermo da un bordo all'altro),
   **otto icone su quattro colonne**, **dock** in fondo con Chat, Contatti, LaFamegram,
   Inventario — le quattro che si aprono di più — e la barra di stato con l'isola
   dentro allo schermo invece che in una fascia sopra al vetro. Le icone non sono
   ridisegnate: sono **ritagliate dalla foto** e stanno in `frontend/media/photo/telefono/`.
   Le palline rosse della foto sono state cancellate una per una, perché quei numeri li deve
   dire la partita — e infatti li dice. **Tutte e quattordici le app aprono**, comprese le due
   che si registrano a partita avviata (Notifiche, Trasferte): quelle non hanno una foto e
   tengono il loro disegno, dentro a una piastrella copiata dalle altre. I widget che
   stavano sopra la griglia non ci sono più: nella foto la home è solo icone e sfondo. E
   l'app **Messaggi** è sparita: elencava le stesse conversazioni di Chat con meno roba
   dentro, due icone per la stessa cosa.
   Per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#68--il-telefono-nuovo-quello-della-foto).

### Una pagina per ogni azione: il README che la progetta

_Da `implementazioni.md`, FATTE._

2. voglio creare una pagina per praticamente ogni azione, con interfaccia e bottoni cliccabili a schermo (anche trasparenti ma non per forza), secondo te ha senso questa cosa? crea un README che analizzi e progetti tutto ciò, segna anche i pro e i contro e come vorresti sviluppare ogni pagina.

   **FATTO (06/09/2026)** — il README è
   [`documentazione/pagine-azioni/README.md`](../documentazione/pagine-azioni/README.md).
   Tre parti: **l'analisi** (cosa c'è già, i pro, i contro coi numeri veri, il criterio),
   **il telaio** (quello che serve prima e che tutte le pagine si dividono) e **il
   progetto di ogni pagina** — tutte e tredici le mosse e tutti i posti, uno per uno, col
   disegno della schermata, cosa si decide dentro, cosa serve, quanto costa e cosa ne
   penso. Anche quelle che io lascerei leggere: il disegno c'è lo stesso, così la scelta
   resta tua. In fondo la tabella di tutto e l'ordine in cui le farei.

   **La risposta breve è sì all'idea, no al «per ogni
   azione»:** una pagina non si dà a un'azione, si dà a un posto, e dentro al posto
   si gioca una decisione. Le mosse che una decisione non ce l'hanno — il turno, la
   palestra, staccare la spina — con una pagina diventano più lente, non più belle,
   e se tutto pesa uguale il concerto smette di sembrare un evento.

   Contate le mosse: sono **tredici**, e le uniche due che hanno già una pagina —
   il foglio e la piazza — sono le uniche due che hanno una scelta dentro. Non è un
   caso. Applicando lo stesso metro alle altre vengono fuori **cinque pagine, non
   tredici**, e tre delle cinque sono **stanze dello Studio che esistono già e sono
   mezze vuote**: al banco e in «Fuori» il pezzo lo sceglie il codice
   (`sort()[0]`), non tu. Le due davvero nuove sono la scena del produttore (i beat
   si ascoltano già, `beatplay.js`) e il Live Club. La promo non merita una pagina:
   merita un'app del telefono.

   **Ma prima va fatta una cosa che non si vede.** Oggi una schermata nuova va
   iscritta a mano in **sette elenchi in sette file** (uscita, orologio, eventi,
   trasferte, menu di sistema): chi ne dimentica uno rompe qualcosa in silenzio, ed
   **è già successo tre volte** — la ✕ dello Studio (punto 15), `renderNegozio` che
   non esisteva, e una terza trovata scrivendo il README (`strada-crimine` non era
   l'id di niente), sistemata il 07/09/2026 e raccontata in
   [`documentazione/problemi-riscontrati.md`](../documentazione/problemi-riscontrati.md).
   Tutte e tre chiuse cambiando una riga; nessuna delle tre ha tolto il motivo.
   Un registro unico costa un paio di giorni, non cambia niente di quello che si
   vede e dimezza il costo di ogni pagina fatta da lì in poi.

_Lo stesso punto era segnato una seconda volta, nelle FATTE, con questa nota:_

1. una pagina per ogni azione, con interfaccia e bottoni cliccabili a schermo — ha senso?
   Un README che analizzi e progetti tutto, coi pro e i contro.

   **FATTO (06/09/2026)** — l'analisi e il progetto di ogni schermata, pro e contro
   compresi, stanno in `frontend/pagine/README.md`. Commit `180960c` e `4925a82`.

### La pagina delle attività criminali tagliava i pezzi

_Da `implementazioni.md`, FATTE._

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

### I file .md in cartelle con nomi coerenti

_Da `implementazioni.md`, FATTE._

1. dividi tutti i file .md sparsi in cartelle con nomi coerenti, inoltre smista le task fatte da implementazioni.md

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

### Gli eventi in basso si segnano in agenda, e arriva la notifica

_Da `implementazioni.md`, FATTE._

1. gli eventi in basso sono cliccabili, e puoi segnarli nell'agenda, quando scatta l'ora o poco prima, arriva una notifica

   **FATTO (06/09/2026)** — ogni card degli eventi ha adesso un quadratino in alto a destra:
   toccalo e l'evento finisce in agenda. **Un quarto d'ora prima dell'ora arriva la
   notifica** — un toast a schermo e una riga nel centro notifiche del telefono, quello che
   c'era già. Se nel frattempo il tempo è saltato oltre (una mossa lunga, un +1 ora) la
   notifica arriva lo stesso e cambia parole: «è cominciata» invece di «fra poco». Il motore
   è `frontend/js/game/agenda.js` e ascolta l'orologio del gioco (`game-time:advanced`), non
   un timer suo: se il tempo non si muove, non succede niente. Per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).

### Gli eventi settimanali, da segnare anche quelli

_Da `implementazioni.md`, FATTE._

1. possono verificarsi eventi settimanali, da segnare in agenda anche quelli e la matina del giorno stesso arriva la notifica

   **FATTO (06/09/2026)** — al posto del riquadro «Più avanti…», che prometteva senza dire
   cosa, adesso c'è **«Questa settimana»** con due eventi veri: giorno, ora e a cosa
   portano. Sono sei in tutto e ne escono due per settimana, sempre le stesse due per quella
   settimana lì (il seme è il numero della settimana, non il caso: la plancia si ridisegna
   in continuazione e col caso cambierebbero sotto gli occhi). Si segnano come gli altri, e
   **la mattina del giorno stesso arriva la notifica**. Stessa cosa per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).
