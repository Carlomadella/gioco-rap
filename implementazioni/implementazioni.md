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
   _soltanto_ l'energia (`soloSenzaEnergia`) la mossa resta cliccabile — spenta a
   vedersi, con la classe `.spenta` che copia l'aspetto di `:disabled` — e risponde.
   Se manca l'energia _e anche altro_, resta disabilitata: un avviso che parla di
   energia mentre il vero problema è che sei in carcere farebbe più danni che altro.

   Provato in Chrome su tutti e quattro i punti d'ingresso: l'avviso esce col fulmine e
   **l'energia non viene toccata**. Controllati anche i casi che non devono cambiare —
   con l'energia piena ma senza beat «Registra» resta disabilitata e muta, senza energia
   _e_ senza beat pure, e con l'energia che basta la mossa parte come sempre (energia
   scalata, scena aperta). `npm run prova` 70/70, audit 260/260, `verifica:build` 33/33.

4. togli il principio zero-dipendenze, migliora il progetto in base a questo cambiamento, riporta le idee in questo file (implementazioni.md), elenca anche tutte le dipendenze che si potrebbero installare e la descrizione di ognuna

   **FATTO (07/09/2026)** — branch `task/via-lo-zero-dipendenze`. Il principio è tolto:
   al suo posto c'è una **regola**, che è una cosa diversa. «Zero dipendenze» era uno
   slogan, e come tutti gli slogan rispondeva prima di sentire la domanda; la regola nuova
   la domanda la fa, e qualche volta risponde ancora di no.

   ### Prima cosa: il principio era già caduto da solo

   Non lo sto abbattendo io. Guarda cosa c'è installato oggi:

   - `frontend/package.json` → **esbuild**, e senza quello non esiste `npm run build`,
     cioè non esiste il prodotto che si mette su Steam;
   - `backend/package.json` → **pg**, e il perché è già scritto per esteso in
     `backend/database/README.md` («qui zero dipendenze conviene cederla»).

   Quindi la frase vera non era «zero dipendenze»: era «zero dipendenze tranne le due che
   ci servono davvero, e non abbiamo mai scritto il criterio per la terza». Il criterio è
   quello che manca, ed è quello che questo punto scrive.

   ### I pro — cosa si guadagna a togliere il principio

   1. **Si sblocca l'uscita sugli store, che è il punto 32.** Electron, Capacitor e le API
      di Steamworks non si riscrivono a mano: sono il guscio nativo, la firma dei
      pacchetti, gli aggiornamenti, i traguardi, Steam Cloud. Con «zero dipendenze» il
      gioco resta un `index.html` per sempre. Questa da sola vale il cambio di regola.
   2. **La sicurezza smette di essere roba nostra.** `backend/accessi.js` verifica a mano
      i JWT di Apple e Google: base64url, firma RS256, JWKS, rotazione delle chiavi,
      `iss`/`aud`/`exp`. È scritto bene, ma è **il posto peggiore del progetto dove
      risparmiare**: un errore lì non lo prende nessun test e si scopre quando qualcuno
      entra nell'account di un altro. `jose` fa esattamente quello, lo fa da anni e lo
      leggono in tanti.
   3. **Prove vere al posto dei grep.** `strumenti/audit-regressioni.js` sono 260
      controlli che leggono i file come testo e ci cercano dentro delle stringhe.
      Funziona finché nessuno rinomina niente: il giorno che togli o sposti una cosa
      l'audit si spegne o urla a vuoto, e ci è già successo. Con `vitest` + `jsdom` si
      prova **il comportamento** (l'energia scende, il giorno dopo la chat si riapre, il
      salvataggio regge il giro), non la presenza di una parola in un file.
   4. **Un linter su 27.000 righe che condividono lo stesso scope.** 72 file senza moduli,
      tutti che si passano `G`, `PHASES`, `pick`, `$`. Un nome scritto storto oggi non lo
      prende nessuno finché non ci passa sopra un giocatore. ESLint lo prende in due
      secondi.
   5. **Il tempo torna sul gioco.** Ogni ora spesa a riscrivere un dev server, un watcher,
      un runner di prove o un ridimensionatore di immagini è un'ora non spesa su beat,
      eventi e bilanciamento — che è l'unica cosa che il giocatore vede.
   6. **Cose che oggi non facciamo proprio.** Comprimere e convertire le immagini
      (`sharp`), un service worker fatto come si deve (`workbox`), lo sblocco dell'audio
      su iOS, i grafici dell'app «come vanno le canzoni», gli errori dal campo dopo
      l'uscita.
   7. **Chi arriva dopo trova strumenti che conosce.** Se un domani qui ci lavora
      qualcun altro, `vitest` e `eslint` li sa già; `strumenti/prova.js` glielo devi
      spiegare.

   ### I contro — e non sono piccoli

   1. **La catena di fornitura.** Il gioco si firma col nostro nome e si vende. Un
      pacchetto compromesso non è un fastidio: è codice nostro che ruba roba a chi ci ha
      pagato. E il rischio vero non è il pacchetto che scegli, sono i **quaranta che si
      tira dietro** e gli script `postinstall` che girano sulla tua macchina.
   2. **Il peso, ma solo dentro al gioco.** Ogni KB che entra in `gioco-*.js` è avvio più
      lento su un telefono scarso — che è mezzo pubblico degli store. Le dipendenze che
      restano negli strumenti non pesano niente; quelle che entrano nel prodotto si
      misurano col build, una per una.
   3. **La manutenzione non finisce mai.** Un pacchetto è per sempre: versioni maggiori,
      cose deprecate, la libreria abbandonata dopo due anni. Oggi il progetto questo
      lavoro non ce l'ha; da domani sì, e va messo in conto.
   4. **Si perde leggibilità.** Adesso ogni riga che gira è nostra, in italiano, con un
      README che dice perché. Una dipendenza è codice che nessuno leggerà mai: quando si
      rompe non si aggiusta, si aspetta.
   5. **Le licenze diventano un problema vero.** In un gioco *venduto* una GPL/AGPL non ci
      può stare, e certe cose «gratis» sono gratis finché non incassi. Si guarda prima,
      non dopo.
   6. **Node ha già dentro mezzo elenco.** `node:sqlite`, `node:test`, `fetch`, `crypto`,
      `zlib`, `AsyncLocalStorage`: se la cosa c'è già, installarla è solo un pacchetto in
      più da aggiornare.
   7. **Il rischio più concreto: la porta aperta.** Tolto il principio, la tentazione è
      installare per abitudine e ritrovarsi con 400 pacchetti in tre mesi senza che
      nessuno abbia deciso niente. È esattamente per questo che al posto del principio ci
      va una regola, e non il vuoto.

   ### La regola nuova, che va al posto del principio

   > **Le dipendenze si possono usare. Ognuna si sceglie, si motiva in una riga e si può
   > togliere.** Non è «meno pacchetti possibile»: è «nessun pacchetto per caso».

   Prima di installare, cinque domande. Se una risposta è storta, non si installa.

   1. **Entra nel gioco o resta fuori?** Se resta negli strumenti (build, prove, immagini,
      CI) la soglia è bassa: sbagli, la togli, il giocatore non se n'è accorto. Se entra
      in `gioco-*.js` la soglia è alta: si misura il peso col build prima e dopo, e il
      numero si scrive.
   2. **La cosa che fa è difficile, e la difficoltà è di qualcun altro?** Crittografia,
      protocolli, formati di immagine, audio sui browser veri: sì. Cinque funzioni di
      comodo e un router: no, quelli li scriviamo meglio noi e in italiano.
   3. **Quanti pacchetti si porta dietro?** Si guarda l'albero, non la scheda:
      `npm ls --all` dopo l'installazione. Uno che ne tira quaranta è quaranta, non uno.
   4. **Si può togliere in un giorno?** Ogni dipendenza sta **dietro a un file nostro**
      (`js/audio/engine.js`, `database/archivio.js`, come già facciamo). Se domani muore,
      si cambia un file solo.
   5. **È viva, e la licenza va bene per un gioco venduto?** Ultimo rilascio, quanti la
      mantengono, MIT/Apache/BSD sì, GPL/AGPL no, «gratis finché non guadagni» no.

   E cinque cose che diventano obbligatorie il giorno stesso, perché sono il prezzo:

   - il **lockfile si committa sempre**, e in CI si usa `npm ci`, mai `npm install`;
   - **una dipendenza per commit**, con scritto nel messaggio perché;
   - `npm audit` dentro `npm run verifica`, e **Dependabot o Renovate** acceso sul repo;
   - dove si può, si installa con `--ignore-scripts`;
   - un **registro delle dipendenze** (`documentazione/dipendenze.md`): pacchetto, a cosa
     serve, chi l'ha voluta, come si toglie. Se quella riga non si riesce a scrivere,
     quella dipendenza non doveva entrare.

   ### Cosa cambia nel progetto, in ordine di quanto conta

   1. **Il guscio nativo** (Electron + electron-builder, Capacitor, steamworks.js).
      È il punto 32, e senza dipendenze non parte proprio.
   2. **`accessi.js` passa a `jose`**, e la validazione dei corpi delle rotte passa a
      `zod` (oggi è a mano, rotta per rotta). Meno codice nostro nel punto più delicato.
   3. **Le prove diventano prove**: `vitest` + `jsdom` per la logica, `playwright` per il
      giro sul telefono (che oggi è a mano, e in `documentazione/problemi-riscontrati.md`
      si vede quanto è lungo). `audit-regressioni.js` non si butta: si converte un blocco
      alla volta, e finché non è convertito resta dov'è.
   4. **ESLint più `// @ts-check` con TypeScript usato solo come controllore** — niente
      riscrittura, niente file `.ts`: i tipi si scrivono nei commenti dove servono. Sui 72
      file a scope condiviso è la rete che oggi manca del tutto.
   5. **Le immagini**: `sharp` e `svgo` dentro al build, WebP/AVIF e le icone degli store
      generate invece che fatte a mano. Il `demo` in un file solo pesa 631 KB, quasi tutti
      di immagini.
   6. **I salvataggi** (punto 34): `idb-keyval` per uscire dal `localStorage` e `fflate`
      per comprimere prima di mandarli al server, dove il tetto è 2 MB.
   7. **Dopo l'uscita**: Sentry per gli errori veri dei giocatori veri, e `pino` sul
      server per avere log che si possono leggere.
   8. **Solo se serve davvero**: audio (`howler`/`tone`), transizioni (`motion`), grafici
      (`uplot`) — tutte legate a punti che stanno ancora in questo file, non prima.

   ### L'elenco: tutto quello che si potrebbe installare, e cos'è

   Le taglie sono indicative, quelle vere si misurano col build. **[dentro]** vuol dire
   che finisce nel gioco e pesa; **[fuori]** che resta negli strumenti e non pesa niente.

   #### Strumenti del gioco — build e qualità *(fuori)*

   - **esbuild** — *già installata.* Mette insieme e minifica i 13 CSS e i 72 JS in due
     file soli. È il motore di `npm run build`.
   - **vitest** — il runner di prove: guarda i file e rilancia da solo, dice cosa non è
     coperto, e sa far finta di essere un browser. È il pezzo che manca per provare la
     logica del gioco senza aprire Chrome. *(Alternativa senza installare niente:
     `node:test`, che Node ha già dentro — meno comodo, zero pacchetti.)*
   - **jsdom** / **happy-dom** — un DOM finto dentro Node: `document`, `localStorage`,
     eventi. Serve a `vitest` per provare le schermate. `happy-dom` è più veloce e meno
     completo.
   - **@playwright/test** — Chrome, Firefox e Safari veri, senza finestra: apre il gioco,
     ci clicca, fa gli screenshot, fa finta di essere un iPhone 13. È il giro dell'agente
     `prova-sul-telefono`, ma automatico e dentro alla CI. *Costo: si scarica qualche
     centinaio di MB di browser.*
   - **eslint** (+ **globals**) — legge il codice e trova gli errori scemi: variabili mai
     dichiarate, roba assegnata e mai usata, `==` dove ci voleva `===`. Con 72 file che
     condividono lo scope è quella che rende di più.
   - **prettier** — riformatta da solo, così le virgole non diventano un argomento.
   - **typescript** — non per riscrivere in `.ts`: solo `// @ts-check` più i tipi nei
     commenti JSDoc. Ti dice che `G.energa` non esiste **mentre stai scrivendo**.
   - **knip** / **depcheck** — trovano i file che non chiama più nessuno e i pacchetti
     installati e mai usati.
   - **sharp** — il coltellino delle immagini: ridimensiona, converte in WebP/AVIF,
     comprime, genera icone e screenshot per gli store. Da sola taglia il peso del
     pacchetto più di qualunque altra cosa. *Costo: è codice nativo (libvips), si scarica
     un binario all'installazione.*
   - **svgo** — ripulisce gli SVG dai metadati di Illustrator e dai decimali inutili.
   - **postcss** + **autoprefixer** + **cssnano** — i prefissi che servono al WebView di
     Android e al Safari di iOS, più la minificazione del CSS.
   - **lightningcss** — le stesse tre cose in un pacchetto solo, e molto più veloce.
   - **chokidar** — guarda i file e avvisa quando cambiano, meglio di `fs.watch`, che su
     Windows e su macOS si comporta in modo diverso. Sta sotto a `npm run dev`.
   - **ws** — WebSocket per la ricarica automatica del dev server (oggi fatta a mano).
   - **workbox-build** — genera il service worker: cosa si tiene in cache, cosa si
     aggiorna, come si esce dalla cache vecchia. Oggi `js/servizio.js` è a mano, ed è
     il tipo di file dove l'errore si vede solo dopo un aggiornamento.
   - **pa11y** / **@axe-core/cli** — passano il gioco al setaccio dell'accessibilità:
     contrasti, bottoni senza nome, cose che da tastiera non si raggiungono.
   - **lighthouse** — misura avvio e prestazioni, con un numero che si può confrontare fra
     due build.
   - **husky** + **lint-staged** — fanno girare linter e prove **prima** del commit, e
     solo sui file toccati. *(In `.githooks/` c'è già qualcosa: forse basta quello.)*
   - **npm-run-all** / **concurrently** — far partire più script insieme (server +
     watcher) con un comando solo.

   #### Dentro al gioco — queste pesano *(dentro)*

   - **howler** — l'audio come si deve: sprite di suoni, volumi, dissolvenze, e
     soprattutto **lo sblocco dell'audio su iOS**, che è la cosa che fa impazzire tutti.
     ~10 KB compressa.
   - **tone** — un piano sopra: sequencer, tempo, sintesi, effetti. Ha senso solo se il
     beat si costruisce davvero dentro al gioco (`js/audio/beat-project.js` va in quella
     direzione). Grossa, oltre i 150 KB: da valutare col build in mano.
   - **idb-keyval** — `localStorage` ma su IndexedDB: asincrono, senza il tetto dei 5 MB,
     e non sparisce quando il sistema fa pulizia. È il punto 34. ~1 KB.
   - **fflate** — zip e gzip in JavaScript, veloce e piccola (~8 KB): comprime il
     salvataggio prima di mandarlo al server, dove il tetto è 2 MB.
   - **lz-string** — più semplice e più piccola di `fflate` (~3 KB), fatta apposta per
     comprimere stringhe da mettere nel `localStorage`.
   - **dompurify** — ripulisce l'HTML da quello che può far danni. Serve nel momento in
     cui il nome dell'artista, un testo scritto dal giocatore o un nome che arriva dal
     server finiscono dentro a un `innerHTML`. ~20 KB.
   - **seedrandom** — numeri a caso ma **ripetibili**: dallo stesso seme esce sempre la
     stessa partita. Vuol dire poter riprodurre un bug di bilanciamento, e poter far
     girare mille partite finte per vedere se i numeri tengono. ~2 KB, e per un gestionale
     è la più sottovalutata dell'elenco.
   - **motion** (Motion One) — animazioni e transizioni appoggiate a quelle del browser,
     ~5 KB. È l'aggancio naturale del punto 5 qui sopra, le transizioni fra studio, sala e
     casa.
   - **gsap** — la stessa cosa ma di lusso: timeline complicate, sequenze, controllo su
     tutto. Più grossa, e la licenza va ricontrollata prima di metterla in un gioco
     venduto.
   - **uplot** — grafici piccoli e velocissimi (~45 KB): è l'app «come stanno andando le
     canzoni nel tempo» del punto DA DISCUTERE qui sotto.
   - **chart.js** — grafici più belli e più facili, ma ~200 KB: per due grafici non vale.
   - **sortablejs** — trascinare per riordinare: la scaletta di un album, l'inventario, le
     priorità della settimana. ~10 KB.
   - **swiper** — caroselli che scorrono col dito come su un telefono vero (le copertine,
     il negozio). Grossina, ~40 KB.
   - **fuse.js** — ricerca che perdona i refusi: contatti del telefono, beat, negozio.
     ~12 KB.
   - **canvas-confetti** — i coriandoli. Sembra una scemenza: è il disco d'oro, il primo
     posto in classifica, il contratto firmato. ~3 KB.
   - **mitt** / **nanoevents** — un bus di eventi in meno di un KB, per smettere di
     chiamarsi a mano fra un file e l'altro.
   - **nanostores** — stato reattivo minimo (~1 KB): quando `G` cambia, la schermata si
     rifà da sola. Da guardare solo se un giorno si passa ai moduli ES.
   - **i18next** — traduzioni per davvero: plurali, formati, lingua di riserva. Serve il
     giorno che il gioco esce in inglese; oggi `js/lingua.js` fa il suo.
   - **zod** — descrive la forma di un dato e la controlla. Dentro al gioco serve a una
     cosa sola ma importante: **aprire un salvataggio vecchio o rotto senza esplodere**,
     dicendo esattamente cosa non torna. ~14 KB.
   - **ajv** — la stessa idea con JSON Schema: buona per validare
     `eventi-master-1000-v1.2.13.json`, che è grosso e scritto a mano. Può girare anche
     solo negli strumenti, e allora non pesa niente.

   #### Il guscio per gli store *(punto 32)*

   - **electron** — mette il gioco dentro a un'applicazione desktop vera per Windows,
     macOS e Linux. È il modo in cui si va su Steam.
   - **electron-builder** — dall'applicazione al pacchetto: `.exe`, `.dmg`, `.AppImage`,
     firma del codice, notarizzazione Apple, aggiornamenti automatici.
   - **electron-store** — le impostazioni salvate su un file vero invece che nel browser.
   - **steamworks.js** — le API di Steam da Node: traguardi, statistiche, **Steam Cloud**,
     l'overlay, «ci sto giocando ora». Senza questa, su Steam sei un `.exe` e basta.
   - **@capacitor/core**, **@capacitor/cli**, **@capacitor/ios**, **@capacitor/android** —
     lo stesso guscio per iPhone e Android: il gioco gira dentro a un'app vera, con la sua
     icona e la sua pagina sullo store.
   - **@capacitor/preferences** — le impostazioni tenute dal sistema e non dal browser (il
     `localStorage` di un WebView si perde).
   - **@capacitor/filesystem** — i file veri sul telefono: i salvataggi del punto 34.
   - **@capacitor/haptics** — la vibrazione: il telefono che trema quando dentro al gioco
     arriva un messaggio.
   - **@capacitor/splash-screen**, **@capacitor/status-bar**, **@capacitor/app** — la
     schermata d'avvio, la barra in alto, e sapere quando il giocatore esce e torna, che è
     il momento in cui si salva.
   - **@capacitor/share** — il tasto «condividi»: la classifica, la copertina, il traguardo.

   #### Il server

   - **pg** — *già installata.* Il client PostgreSQL: SCRAM-SHA-256, TLS, tipi,
     riconnessioni. Il perché sta in `backend/database/README.md`.
   - **jose** — JWT e JWE fatti bene: verifica la firma, scarica e tiene da conto le
     chiavi pubbliche (JWKS), controlla emittente, destinatario e scadenza. **Sostituisce
     la parte più delicata di `accessi.js`.** È la prima che installerei.
   - **zod** — controlla il corpo di ogni richiesta prima che tocchi il database, e
     risponde dicendo quale campo è sbagliato. Oggi è a mano, rotta per rotta, e le rotte
     crescono.
   - **pino** — log strutturati in JSON, velocissimi: si filtrano, si contano, si mandano
     da qualche parte. Con **pino-pretty** restano leggibili mentre sviluppi.
   - **rate-limiter-flexible** — limiti di richieste che funzionano anche con più processi
     (memoria condivisa o Redis). Oggi `ADF_BUSSATE` conta in RAM: con due server non
     conta più niente.
   - **ioredis** — Redis, cioè memoria condivisa fra processi: sessioni, limiti, cache.
     Serve solo dal giorno in cui i server sono più di uno.
   - **hono** / **fastify** — router HTTP piccoli e moderni. Adesso non servono: il
     routing a mano regge. Da riguardare se arrivano upload, sessioni o WebSocket, che è
     esattamente il caso che `backend.md` si era già lasciato aperto.
   - **helmet** — le intestazioni di sicurezza standard. Ha senso solo con Express dietro.
   - **nodemailer** — mandare mail: conferma dell'iscrizione, recupero della password. Il
     giorno che gli account con la mail diventano una cosa seria, serve.
   - **argon2** / **bcrypt** — hash delle password. Lo `scrypt` di Node fa già il suo
     lavoro: si cambia solo per avere lo standard più recente.
   - **@sentry/node** e **@sentry/browser** — raccolgono gli errori dei giocatori veri, con
     lo stack e cosa stavano facendo. Dopo l'uscita è la differenza fra sapere che una cosa
     si rompe e leggerlo in una recensione a una stella.
   - **undici** — client HTTP veloce. *Non serve:* Node 22 ha già `fetch` dentro.
   - **better-sqlite3** — *non serve:* `node:sqlite` fa già quello che ci occorre.
   - **dotenv** — *non serve:* `backend/ambiente.js` legge già `.env.local`.
   - **node-cron** — *non serve:* il giro di settimana parte da sé alla prima richiesta
     utile, ed è meglio così.
   - **supertest** — *non serve:* `backend/prova.js` parla HTTP vero, che è più onesto.

   #### Intorno al repo

   - **Renovate** o **Dependabot** — aprono loro le richieste di aggiornamento, una per
     pacchetto, con le note di versione allegate. Senza uno dei due, avere dipendenze
     diventa debito.
   - **lockfile-lint** — controlla che nel lockfile non si siano infilati indirizzi strani
     al posto del registro ufficiale.
   - **`npm audit`** dentro `npm run verifica` — è già dentro npm, basta chiamarlo.
   - **license-checker** — elenca le licenze di tutto l'albero: in un gioco venduto si
     guardano **prima**.

   ### Le tre da fare per prime

   `jose` (sicurezza), `eslint` (una rete su 27.000 righe che oggi non ne hanno nessuna),
   `vitest` + `jsdom` (prove vere al posto dei grep). Nessuna delle tre entra nel gioco:
   al giocatore costano zero KB.

   ### Dove ho tolto la frase

   `README.md`, `ROADMAP.md`, `frontend/README.md`, `backend/README.md`,
   `backend/database/README.md`, `backend.md` e
   `implementazioni/00-come-si-lavora.md`: dove «zero dipendenze» era una *regola* adesso
   c'è la regola nuova; dove era la *descrizione di com'è fatto oggi* è rimasta, corretta
   (il backend una dipendenza ce l'ha, `pg`, e il gioco ha esbuild).

5. implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo
   Nel dettaglio: il primo video parte quando il player clicca sul luogo chiamato "studio", il
   secondo quando clicca su "sala", il terzo quando decide di tornare a "casa", il quarto su
   "stacca la spina", il quinto su "registra un pezzo".

6. quando skippi tante ore ci mette troppo a simulare

7. togli il parametro «lucidità» e tutto ciò che ne consegue

8. aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

9.

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
