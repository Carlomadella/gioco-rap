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

2. Rendi accessibile lo shop già dalla città iniziale, con limitazioni sui prodotti in vendita

3. i rapporti con i beatmaker non vanno mai in negativo, puoi offenderli quanto vuoi e il rapporto resta uguale

4. Ci sono i prezzi dei beat spropositati. Non ha senso che alcuni beat costino 700 euro al livello quattro. Facciamo prezzi realistici : da 100 a 250 euro beat da beatmaker emergenti , da 300 euro a 1000 per beatmaker affermati e da 1000 a 2000 per beatmaker famosissimi

5. Il giocatore parte con tutti i parametri a 1

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

7. Verissima la cosa dell'hype, fattore che dev'essere davvero primario nel gioco e i player dovran costantemente provare a inseguire ma con tanta fatica, Partiamo proprio dallo sviluppo dell'hype :

L'hype è in scala internazionale, vuol dire che se sei al livello 100 è impossibile che tu sia ancora nel paesino di provincia.
Probabilmente all'inizio l'unico modo per fare hype è andare al pub e pubblicare sui social pubblicità per la tua musica (DA SVILUPPARE QUESTO) , ma più di tanto HYPE all'inizio non si può fare, quindi è impossibile che al primo anno rimanendo nella prima città tu diventi 100 di hype

Tutt'altro se non sei goat manco puoi averli 100 di hype

L'hype vero si inizierà a fare quando i tuoi numeri social andranno forte e nelle classifiche il tuo nome inizierà a farsi valere sempre di più, quando farai feat con nomi più grandi dei tuoi e i pezzi andranno bene, quando prendiamo una macchina importante e molto costosa e la flexiamo sui social

Insomma, come le cose che vanno davvero in hype IRL, non se fai un feat con pinko pallino a caso che nessuno conosce

**FATTO (06/09/2026)** — l'hype adesso ha un **tetto che dipende dalla fase della
carriera** (`PHASES[fase].hcap` in `phases.js`, letto da `hypeCap()`): 20 da
Sconosciuto, 42 da esordiente, 55, 65, 80, 92, e solo da GOAT il tetto è 100. Non
conta _come_ l'hype sale — farmando o con un colpo di fortuna — il tetto tiene
comunque, perché è applicato ovunque l'hype cresce (oltre 30 punti diversi nel
codice, da `promo` alla Strada). I tetti restano sempre sopra alle soglie
`G.hype >= 40/60/55` già richieste dalle prove di passaggio della carriera stessa
(`phases.js`, `TRIALS`), quindi nessuna prova diventa impossibile da superare.
Sulla fatica vera: la promo sui social aveva già un freno sui follower, ma
**l'hype che dà continuava a salire ogni giorno senza limite** — adesso ha anche
lui un tetto settimanale (22 punti, `actions.js`), verificato con 7 giorni di
promo di fila. Sul lato "quando conta davvero": scalare in classifica adesso dà un
bonus d'hype vero e proporzionato al salto (`sim.js`, vicino a `G.best.chart`), e
un feat capitato per caso (`events.js`) non vale più sempre uguale: **la maggior
parte delle volte è un nome piccolo** (hype modesto), **una volta ogni tanto è uno
grosso davvero**, e lì l'hype si muove sul serio — non lo sai finché non firmi,
come chiesto. Il "feat con nomi più grandi" esiste già anche come relazione vera
con un beatmaker della Sala (`posto.js`, tipo `feat`, scala già con `p.fama`): non
toccato, andava già bene. Restano fuori da questo giro — **da sviluppare a
parte**, come segnalato nel punto stesso — il pub e la pubblicità come primo modo
di fare hype a inizio carriera, che oggi non esistono ancora come luogo/azione.
`npm run prova` (70/70) più una verifica dedicata fuori dal browser sui tetti per
fase e sul tetto settimanale della promo.

8.  Le card sulla mappa come studio, fabbrica, pizzeria, la sala ecc hanno una card cliccabile troppo grande, LE VOGLIO TUTTE COME STUDIO. Inoltre noto che l'ultima cosa dove entri resta una sorte di pallino gialla come se t'indicasse l'ulitma cosa schiacciata. Non la voglio.

9.  Ci sono dei tastini sul in centro sotto della mappa che fan muovere la mappa. Levali. La mappa non voglio si veda muoveree. dev'essere ferma

10. Lo shop dev'essere un vero e proprio shop, come gli shop di fortnite o nba2k.. LEVA STI CAZZO DI INTERFACCIA MENU! RENDILO UNO SHOP DA VIDEOGIOCO NEL 2026

11. Avaturn voglio lo rendiamo UN 50/50 , Cioè chi non vuole andare a farsi tutta la trafila per fare avaturn (anche se ovviamente dobbiamo fare di tutto per consigliarli a farlo) può benissimamente creare il suo avatar in game. FAI COESISTERE LE COSE.

12. Studio, casa e attività criminiali sulla mappa sono TROPPO VICINE LE CARD tra di loro. Anche se gli edifici sono abbastanza vicini falle in un modo MOOOOLTO più clean. Così sono troppo ammassate.

13. Ti ricordo che i pulsanti sopra la mappa sono ANCORA TROPPO GRANDI rispetto ai quadratini stessi. Rivedilo.

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

CARLO:

/_ GIORNALIERE _/

1. creare canzoni con l'ia, guarda cartella musica nei segnalibri, task giornaliera quindi da non smistare

/_ DA FARE _/

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

2. implementare il telefono nuovo, si vede nei media la foto

   **FATTO (06/09/2026)** — per esteso al punto 10 delle FATTE qui sotto e in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#68--il-telefono-nuovo-quello-della-foto).

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
   *soltanto* l'energia (`soloSenzaEnergia`) la mossa resta cliccabile — spenta a
   vedersi, con la classe `.spenta` che copia l'aspetto di `:disabled` — e risponde.
   Se manca l'energia *e anche altro*, resta disabilitata: un avviso che parla di
   energia mentre il vero problema è che sei in carcere farebbe più danni che altro.

   Provato in Chrome su tutti e quattro i punti d'ingresso: l'avviso esce col fulmine e
   **l'energia non viene toccata**. Controllati anche i casi che non devono cambiare —
   con l'energia piena ma senza beat «Registra» resta disabilitata e muta, senza energia
   *e* senza beat pure, e con l'energia che basta la mossa parte come sempre (energia
   scalata, scena aperta). `npm run prova` 70/70, audit 260/260, `verifica:build` 33/33.

4. implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo
   Nel dettaglio: il primo video parte quando il player clicca sul luogo chiamato "studio", il
   secondo quando clicca su "sala", il terzo quando decide di tornare a "casa", il quarto su
   "stacca la spina", il quinto su "registra un pezzo".

5. quando skippi tante ore ci mette troppo a simulare

6. togli il parametro «lucidità» e tutto ciò che ne consegue

7. aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

8.

/_ DA DISCUTERE _/

2. DA DISCUTERE Dopo aver completato milano ed essere diventato goat ed essere andato a los angeles il player può decidere se trasferirsi in un'altra città italiana o per forza a Los Angeles? Per forza a los angeles, però può decidere di tornare nelle città prima

3. DA DISCUTERE Non è più: "Faccio un pezzo → +10 fama", ma diventa:

TRACK (sezione studio)
│
├── Beat
├── Producer
├── Studio
├── Mix
├── Testo
├── Cover (influenza meno, ma ha 3 opzioni: caricamento file da telefono/computer, assets preimpostati e personalizzazione stile emblema black ops 2)
├── Featuring (può esserci come no, nelle canzoni, nel caso abbiamoo un feat nemlle canzoni, non è obbligatorio che il feat venga alla sessione, ovviamente se svolge la sessione con noi molto probabilmente i pezzo avrà più qualità)
├── Marketing (dimmi te come lo svilupperesti, dammi una terza opzione, le prime due sono: in discografia sul telefono tramite app, in studio in una sezione dedicata)
└── Timing (app discografia)

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
   non esisteva, e una terza trovata scrivendo il README, ancora aperta
   (`strada-crimine` non è l'id di niente: sta in
   [`documentazione/problemi-riscontrati.md`](../documentazione/problemi-riscontrati.md)).
   Un registro unico costa un paio di giorni, non cambia niente di quello che si
   vede e dimezza il costo di ogni pagina fatta da lì in poi.

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

1. gli eventi in basso sono cliccabili, e puoi segnarli nell'agenda, quando scatta l'ora o poco prima, arriva una notifica

   **FATTO (06/09/2026)** — ogni card degli eventi ha adesso un quadratino in alto a destra:
   toccalo e l'evento finisce in agenda. **Un quarto d'ora prima dell'ora arriva la
   notifica** — un toast a schermo e una riga nel centro notifiche del telefono, quello che
   c'era già. Se nel frattempo il tempo è saltato oltre (una mossa lunga, un +1 ora) la
   notifica arriva lo stesso e cambia parole: «è cominciata» invece di «fra poco». Il motore
   è `frontend/js/game/agenda.js` e ascolta l'orologio del gioco (`game-time:advanced`), non
   un timer suo: se il tempo non si muove, non succede niente. Per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).

1. possono verificarsi eventi settimanali, da segnare in agenda anche quelli e la matina del giorno stesso arriva la notifica

   **FATTO (06/09/2026)** — al posto del riquadro «Più avanti…», che prometteva senza dire
   cosa, adesso c'è **«Questa settimana»** con due eventi veri: giorno, ora e a cosa
   portano. Sono sei in tutto e ne escono due per settimana, sempre le stesse due per quella
   settimana lì (il seme è il numero della settimana, non il caso: la plancia si ridisegna
   in continuazione e col caso cambierebbero sotto gli occhi). Si segnano come gli altri, e
   **la mattina del giorno stesso arriva la notifica**. Stessa cosa per esteso in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md#8-e-9--lagenda-gli-appuntamenti-e-le-notifiche).

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

1. ALE 6 — le azioni ripetibili facevano farmare senza gameplay: la battle di freestyle
   doveva diventare un evento esclusivo, e gli eventi non dovevano valere tutti uguale.

   **FATTO (06/09/2026)** — la battle vera in piazza è **una volta a settimana, e solo fra
   le 21:00 e le 00:30**, con un contatore settimanale suo (`adfSettimana` /
   `adfSegnaSettimana`). «Serata open mic» la seconda volta nello stesso giorno rende la
   metà. E i sei eventi settimanali dell'agenda hanno un **peso d'importanza** che scala
   davvero la ricompensa quando li giochi nel loro giorno: freestyle, open mic, promo,
   palestra, sessione alla Sala, colpo della Strada. Commit `a4073c3`.

1. ALE 7 — l'hype: dev'essere il fattore primario, in scala internazionale, e impossibile
   da avere alto restando nel paesino di provincia al primo anno.

   **FATTO (06/09/2026)** — l'hype ha un **tetto legato alla fase della carriera** (da 20 a
   100), applicato ovunque cresca, senza toccare le soglie delle prove di passaggio. La
   promo ha anche un tetto settimanale sull'hype — i follower continuano a crescere lo
   stesso, che è la cosa realistica. Scalare in classifica dà un bonus d'hype vero, e un
   feat scala per la grandezza (rara) del collaboratore invece di valere sempre uguale:
   con pinko pallino non si va in hype. Commit `a4073c3`.

1. gli eventi segnati in agenda devono bloccare lo skip

   **FATTO (06/09/2026)** — un appuntamento segnato ferma il salto del tempo: se prima
   dell'ora a cui sei diretto c'è qualcosa in agenda, il tempo si ferma lì e te lo dice,
   invece di scavalcarlo. Commit `efa2033`.

1. una pagina per ogni azione, con interfaccia e bottoni cliccabili a schermo — ha senso?
   Un README che analizzi e progetti tutto, coi pro e i contro.

   **FATTO (06/09/2026)** — l'analisi e il progetto di ogni schermata, pro e contro
   compresi, stanno in `frontend/pagine/README.md`. Commit `180960c` e `4925a82`.

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
