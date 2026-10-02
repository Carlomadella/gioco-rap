# La carriera e il tempo

Energia, giornate, settimane, livelli, salvataggi: il ritmo con cui si gioca.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 1 · Cosa si può simulare

1. Si può simulare:
   Un giorno: ti riposi e ricarichi l'energia
   Una settimana: ti riposi, ricarichi l'energia ma perdi lucidità
   Un mese: ti riposi, ricarichi l'energia, perdi lucidità e perdi hype

**Risulta già fatto**, dal lavoro sui punti 40/41: «Salta il tempo» (`saltaTempo()`,
`frontend/js/game/skip.js`) chiede esattamente questa scelta — 1 giorno, 2 giorni, una
settimana, un mese — con le stesse conseguenze a scalare: 1-2 giorni ricaricano solo
energia, una settimana lascia che i suoi costi e la sua lucidità la tocchino da sola
chiudendosi, un mese («28 giorni di silenzio») fa sentire lucidità e hype per davvero.
Non serve una tabella di penalità scritta a mano: `avanzaGiorno()`/`advanceWeek()`
(`sim.js`) le danno già, vivendo quei giorni senza fare niente.
Provato in Chrome (01/09/2026): saltato un mese da 100 di lucidità e ~20 di hype, arrivati
a 84 di lucidità e ~12 di hype, settimana avanzata di 4, energia tornata a 100.

---

## 12 · Le classifiche ogni settimana, con le frecce

12. Aggiorna le classifiche ogni settimana, metti quante posizioni ha scalato/è retrocesso l'artista rispetto alla settimana precedente. Fai in modo che si veda la top 10, poi se espandi in basso alla classifca ti fa vedere la top 100 (in futuro top 1000) e chiaramente fai in modo che l'utente possa vedere la sua posizione in classifica.

   **FATTO (03/09/2026)** — insieme al punto 30, di cui era la metà mancante. Il server
   sapeva già fare tutto — chiude il giro di settimana, fotografa la posizione di tutti
   prima di chiuderlo e da lì tira fuori le frecce ▲▼ — e la schermata continuava a
   disegnare i rivali finti di casa: il multiplayer c'era e non si vedeva.

   Adesso `js/game/ui.js` disegna la classifica **vera** quando il server risponde, e
   quella locale quando non risponde, senza che si veda la giuntura: stessa riga, stesso
   vestito. La top 10 si allarga alla top 100 con un bottone in fondo, e la tua posizione
   si vede sempre — se sei fuori dalla fetta, in fondo compare la tua riga staccata con
   scritto a che numero sei («sei 428°»). Le frecce sono quelle del server: chi non ha una
   posizione della settimana prima ha un punto, non uno zero verde, perché «non lo
   sappiamo» e «non si è mosso» sono due cose diverse.

   Iscrizione: **niente da compilare**. Parte da sola a settimana chiusa (`advanceWeek` in
   `js/game/sim.js`) col nome e la città del creatore, e se il server non c'è la partita va
   avanti identica. Per la strada è saltato fuori che i generi del creatore sono dodici e
   quelli della classifica sei: il server non riconosceva «boombap» o «rnb» e ne pescava
   **uno a caso**, così in classifica ti trovavi accanto un genere mai scelto. La
   corrispondenza sta in `js/net/online.js`. E i nomi degli altri giocatori adesso passano
   da un filtro che disinnesca l'HTML: il server li tiene corti ma non li ripulisce dai
   tag, e il posto dove quella roba va spenta è chi disegna. C'è una prova apposta.

---

## 15 · I progressi si salvano, tre slot

15. fai in modo che i progressi di gioco vengano salvati, dalla schermata di avvio posso decidere se caricare una partita o crearne una nuova, max 3 slot partita disponibili.

   **FATTO (02/09/2026)** — `js/avvio.js`: la schermata di avvio ha i tre slot espliciti,
   con dentro a che punto è ogni carriera; da lì si carica, si comincia una partita nuova o
   si elimina uno slot. Il pulsante grosso cambia da solo — INIZIA se non c'è niente,
   CONTINUA sull'ultima carriera usata — e l'avvio rapido prende il primo slot libero.
   Ogni slot ha il suo artista e il suo salvataggio (`slotKey`, `js/impostazioni.js`), e da
   qui in poi anche il suo posto in classifica.

---

## 22 · L'energia cresce col livello, e i livelli devono avere un senso

22. l'energià più si sale di livello più aumenta, come poi per tutto, i livelli dovranno avere un senso, puntiamo ad un gioco in cui farmare non fa stufare l'utente che gioca

---

## 24 · Gli slot anche nella schermata di avvio

24. Gli slot ci sono (impostazioni → Partite): restano da mettere anche nella schermata di avvio, come scelta prima di giocare.

   **FATTO (02/09/2026)** — col punto 15: i tre slot si scelgono nella schermata di avvio,
   prima di giocare, e non solo dalle impostazioni. Nello stesso passaggio è arrivata la
   **difficoltà** — «strada aperta», «anni di fame», «niente sconti» — che si sceglie
   quando si comincia una carriera e resta attaccata allo slot. Per adesso è nominale: il
   bilanciamento è lo stesso per tutte e tre, e lo dice invece di far finta. Il server però
   se la scrive già accanto all'artista (vedi
   [multiplayer-e-backend](07-multiplayer-e-backend.md)), perché il giorno che i tre
   livelli peseranno davvero, con quali regole è stato fatto un punteggio non si recupera
   più a posteriori.

---

## 14 · Il turno in fabbrica dura 8 ore, non 1

14. Il turno in fabbrica dura un'ora. ERRORE ASSURDO. Dev'essere di 8 ore sempre il turno in fabbrica. modifica questo, assicurandoti che non rovini assolutamente niente per quanto riguarda gli orari e tocchi solo questa piccolezza.

   **FATTO (10/09/2026)** — la durata giusta (480 minuti, 8 ore) c'era già in
   `DURATE_LAVORO.operaio` (`frontend/js/game/tempo.js`): non era quello il numero
   sbagliato. Il bug stava un passo prima. `tempo.js` sa che azione è appena partita
   solo intercettando il click su una tile con `data-id` (`.tile[data-id]`); ma le
   azioni avviate da un luogo della mappa — Fabbrica, Pizzeria, Palestra, Casa
   («Stacca la spina»), Live Club, e le stesse mosse dal telefono — passano tutte da
   `avviaAzioneDiretta()` (`frontend/js/game/ui.js`), che apre l'azione **senza**
   simulare quel click, com'è scritto nel suo stesso commento. Risultato: l'id vero
   non arrivava mai a `tempo.js`, che quindi non sapeva più durataAzione() di quale
   lavoro si trattasse e tornava sul fallback generico da **60 minuti fissi** —
   sempre, per qualunque azione diretta, non solo per la Fabbrica.

   La correzione tocca un solo punto d'innesto: `GAME_TIME.captureAction(id)`, una
   funzione nuova esposta da `tempo.js` che imposta l'id catturato allo stesso modo
   del listener sulle tile, e una riga in `avviaAzioneDiretta()` che la chiama con
   l'id vero dell'azione appena prima di `iniziaAzione()`. Non tocca `DURATE`,
   `DURATE_LAVORO` né `orari.js`: gli orari di apertura restano quelli di sempre
   (Fabbrica 08:00-19:00), e nessun altro numero è stato cambiato.

   **Effetto collaterale voluto, non un rischio**: lo stesso bug affliggeva
   identico anche Pizzeria (300 min invece di 60), Palestra (75/45), «Stacca la
   spina» (180), Live Club/freestyle (180/120) e il Centro per l'impiego — tutte le
   azioni dirette avevano la stessa durata farlocca da un'ora. La correzione le
   sistema tutte insieme perché condividono lo stesso codice, non perché si sia
   allargato il punto.

   **Verificato**: `npm run prova` (94/94), con un blocco di prova dedicato che
   carica `core.js`/`state.js`/`uscita.js`/`tempo.js` fuori dal browser e controlla
   che un turno da operaio duri davvero 480 minuti, uno da lavapiatti 300, che
   «stacca la spina» resti a 180 (non toccata), e che senza la cattura dell'id si
   torni al vecchio fallback da 60 — la controprova che il bug esisteva davvero.

---

## Il gioco alla giornata invece che alla settimana

Stiamo inoltre pensando di mettere il gioco alla giornata. Cioè si skippa di 1 gg alla volta. Così che magari negli eventi della giornata ci sia : 12 palestra con CHARLIE (fidanzata storicaa ad esempio), alle 19 vado in studio e alle 23 vado a fare un colpo con la banda. Che ne pensi?

**RISPOSTA — sì, ma il giorno dentro la settimana, non al posto della settimana.**
Il giorno è dove si gioca: tre fasce (pomeriggio, sera, notte) con l'ora scritta, esattamente come la
riga «Eventi e attività di oggi» che c'è già. La settimana resta il battito che chiude i conti:
stream, spese, classifica, rapporto. Se simuliamo tutto giorno per giorno, il rapporto settimanale
perde senso e il gioco diventa sette volte più lento per raccontare la stessa cosa.
In pratica: 7 giorni × 3 fasce = 21 mosse a settimana (adesso sono 3), e poi la settimana si chiude
come oggi. E la domenica la Sala è chiusa: si vede subito che i giorni non sono tutti uguali.

---

## L'energia a 100 (il ragionamento sui costi)

L'energia stiam pensando di metterla a 100 al giorno. Ovviamente riproporzioneremo tutto ma lo facciamo per non aumentar etorppo la velocità di gioco. SOPRATTUTO CONSIGLIACI QUALCOSA CHE DEV'ESSERE BEN PROPOPRZIONATO .

**RISPOSTA — 100 va bene come scala, quello che conta sono i costi.** Proposta:

- piccole (due parole alla Sala, un post, palestra leggera): **10-15**
- medie (scrivi barre, cerca un beat, mixa): **25-30**
- grosse (registra, sessione in studio, live, colpo): **40-50**
  Cioè tre mosse grosse al giorno, oppure sei piccole. La notte ridà **+60 fisso** più **+30 se il
  benessere sta sopra 60**: chi si spreme non torna mai a 100, e il bruciarsi diventa una cosa che si
  sente, non un numero scritto.
  **Il conto da non sbagliare**: 21 mosse a settimana contro le 3 di adesso sono sette volte il gioco.
  Se non tocchiamo il resto, fan e soldi esplodono. Quindi insieme all'energia: guadagni per mossa
  **×0,4**, spese fisse invariate, soglie delle fasi **×2**. Una settimana piena vale più o meno quello
  che vale oggi, ma dentro c'è da giocare per davvero.

---

## 39, 40, 41 · Energia a 100, giornate, e skip di quanto vuoi

39. L'energia portiamola a 100

   **FATTO (01/09/2026)** — insieme al 40 e al 41, sono un sistema solo: non
   avrebbe senso mettere l'energia a 100 senza cambiare anche quando si
   ricarica. Dettagli sotto, al punto 41.

40. Facciamolo diventare alla giornata lo skip, non più alla settimana

   **FATTO (01/09/2026)** — vedi il punto 41: stessa consegna, un sistema
   solo.

41. Ma se una persona vuole skippa 1 giorno, 2 giorni, 1 settimana, 1 mese... quanti giorni vuole skippare lui li salta, ovviamente il gameplay che avrà sarà condizionato da tutto questo

   **FATTO (01/09/2026) — i punti 39, 40 e 41 insieme: l'energia è a 100 e
   si vive a giornate, non più a settimane intere.**

   - **Stato**: `G.day` (1-7) accanto a `G.week`. La settimana resta il
     battito che chiude i conti — stream, spese, classifica, rapporto —
     ma scatta da sola ogni 7 giorni chiusi, non più a bottone.
   - **Il bottone «Fine giornata»** (era «Chiudi la settimana»,
     `frontend/index.html`) chiama `avanzaGiorno()` (nuova, `sim.js`): la
     notte ricarica **+60 energia, +30 in più se il benessere sta sopra
     60** (chi si spreme non torna mai a 100), il giorno avanza, e solo
     al settimo la settimana si chiude per davvero — con lo stesso
     rapporto di sempre, non uno che compare ogni notte.
   - **`js/game/skip.js` riscritto**: non più tre taglie fisse con «un
     giorno» limitato a una volta a settimana — adesso è **1, 2 giorni,
     una settimana o un mese**, tutti la stessa funzione (`saltaGiorni(n)`)
     che chiama `avanzaGiorno()` n volte di fila, un solo rapporto alla
     fine anche se dentro ci sono state più settimane. Le penalità non
     sono più inventate a mano: **vengono da sole** — niente scrivere/
     registrare/esibirsi per n giorni vuol dire niente lucidità guadagnata,
     e la settimana ne toglie comunque un po' da sé; è già il conto giusto
     senza bisogno di una tabella a parte.
   - **Ogni mossa costa di più, in proporzione** (`ACTIONS`/`JOBS` in
     `actions.js`, i costi della Sala in `posto.js`): piccole 10-14
     (palestra, promo, cercare lavoro, «due parole» alla Sala, un
     intervista), medie 18-28 (scrivi, cerca un beat, mixa, un turno di
     lavoro semplice), grosse 32-45 (registra, freestyle, live, sessione
     in studio, un feat, un turno pesante). Con l'energia intorno a
     100-140 al giorno (dipende da lifestyle e difficoltà, la proporzione
     di prima è la stessa: `ENERGIA_K` in `lifestyle.js` moltiplica quello
     che già c'era, non lo riscrive), tornano i «tre mosse grosse o sei
     piccole» del piano.
   - **`RITMO = 0.4`** (`actions.js`): con sette volte i turni di prima,
     le mosse che si possono ripetere senza limite — promo, live, il
     freestyle veloce — danno il 40% di quello che davano, se no farle
     dieci volte in un giorno varrebbe dieci volte una sola. I pezzi non
     ne hanno bisogno: il tetto settimanale della fase (`PHASES.cap`) li
     tiene già a bada da solo, farne di più non fa guadagnare di più.
   - **Cosa NON ho toccato, di proposito**: le soglie di fama/fan delle
     fasi e delle prove (`phases.js`) restano quelle di sempre. La
     crescita dei fan viene dagli stream, e quella corre ancora una volta
     a settimana, uguale a prima — raddoppiarle alla cieca rischiava di
     rendere la scalata più lenta invece che uguale, ed è il contrario di
     quello che si vuole. Meglio deciderlo dopo aver visto come gira.
     Non ho nemmeno chiuso la Sala di domenica (era nel piano originale):
     è rifinitura, non il cuore della richiesta.
   - **I salvataggi vecchi non si rompono**: `syncEnergy()` (già
     esisteva, serviva per il lifestyle) vede che l'energia salvata è
     fuori scala e la riporta al nuovo massimo da sola, alla prima
     apertura — l'ho verificato leggendo il codice, non serviva scriverne
     di nuovo.
   - **Verificato**: `npm run prova` (12/12) e `npm run build` puliti.
     **Non verificato**: non ho potuto aprire il gioco in un browser vero
     in questa sessione (l'estensione Chrome non era connessa). Questo è
     il cambiamento più grosso e più rischioso di tutta la lista — tocca
     praticamente ogni file di `js/game/` — e i numeri (i costi, `RITMO`,
     quanto rende la notte) sono un primo tentativo ragionato, non un
     bilanciamento provato. Vanno giocati prima di fidarsi.

---

## La richiesta finale sull'energia

cambia l'energia a 100 e anche tutto ciò ce ne deriva da questo cambiamento, tu prova a farlo al meglio poi ti dico io testando come mi pare.

**FATTO (10/09/2026)** — Ogni nuovo giorno riparte con l'energia piena.
`avanzaGiorno()` richiama prima `syncEnergy()` e poi assegna direttamente
`G.energy = G.maxEnergy`: nella scala base significa **100/100**.

La regola vale sia per **Fine giornata** sia per **Salta il tempo**, perché
entrambi passano dallo stesso motore. Il massimo dinamico resta intatto: se
una progressione o un bonus porta `G.maxEnergy` sopra 100, il giorno riparte
comunque pieno.

Questa decisione sostituisce la vecchia ricarica notturna parziale +60/+90.
Aggiunte due prove automatiche in `frontend/strumenti/prova.js`, una sul
massimo base e una su un massimo aumentato.

---

## Una gerarchia per gli incontri mentre si salta il tempo

Da smistare, punto 4 (01/09/2026): "Vai ad agire sul sistema del scorrimento del tempo, andando
a creare una gerarchia di importanza degli eventi in base alla rarità, anche in base alla città,
in base al progresso del gioco. Dividi la gerarchia in 3 categorie (basso medio e alto) dove basso
non ferma lo scorrere del tempo con penalità bassissime, medio non ferma lo scorrere del tempo con
penalità medio bassa, e alto ferma lo scorrere del tempo e obbliga il giocatore a prendere una
decisione."

**FATTO.** Prima, "Salta il tempo" (`skip.js`, punti 40/41) tagliava fuori *tutto* — incontri per
strada, prove di passaggio, eventi — per l'intera durata del salto, tranne l'ultimissimo giorno:
un salto di un mese poteva far sparire una prova di passaggio o un bivio con un contratto di mezzo
semplicemente perché capitava nel giorno sbagliato. Adesso ogni incontro/evento ha un **livello**:

- **`basso`** (`js/game/strada.js`, `INCONTRI`) — un fan, gentile o cafone: capita spesso (è il
  `peso` più alto) e le sue conseguenze sono già minime per come è scritto. Durante un salto si
  risolve da solo (`risolviIncontroAuto()`): sceglie la prima opzione — la più prudente, per come
  sono scritte tutte — e finisce nel diario come se l'avessi scelta tu al volo. Il tempo non si
  ferma.
- **`medio`** (hater, una vecchia amicizia, il manager) — meno comuni, pesano un po' di più, ma
  restano cose che non cambiano la partita. Stesso trattamento del basso: si risolvono da soli,
  senza fermare niente — la differenza fra i due livelli è nella severità che l'incontro porta già
  di suo (l'hater rischia benessere vero, un fan quasi nulla), non in una scala applicata a mano.
- **`alto`** — un opp (serve fama vera e rivali in giro), chi ti sei giocato alla Sala, **qualunque
  prova di passaggio** (`pendingTrial()`, sempre alta: decide la fase della carriera) e **qualunque
  evento** del pool generale (`EVENTS`, `events.js`: sempre alto, sono tutti bivi con soldi,
  contratti o salute di mezzo). Questi fermano il salto sul serio: `SALTO_STOP` (`sim.js`) porta
  l'evento fuori dal ciclo, `saltaGiorni()` (`skip.js`) interrompe il `for`, salva quanti giorni
  restavano, e mostra la scena vera con le scelte vere — non una versione ridotta. Scelta fatta (o
  chiusa con ESC, dove è concesso), `mostraEventoConRipresa()` richiama `saltaGiorni()` sui giorni
  rimasti: il salto riprende esattamente da dove si era fermato, e se un altro "alto" capita nei
  giorni restanti si ferma di nuovo, a catena, senza perdere il conto.

  **Sulla "città"**: la gerarchia è pensata per reggere quando Milano e Los Angeles esisteranno
  (punto 26) — ma oggi c'è solo la provincia, quindi quella variabile non pesa ancora su niente per
  davvero. **Sul "progresso del gioco"**: già dentro ai `req()` di ogni incontro (l'opp vuole 300
  fan e rivali, l'hater vuole hype, gli amici vogliono 8 settimane) — non serviva un numero a parte,
  la gerarchia legge la stessa eleggibilità che decide già se un incontro può capitare.

  Provato in Chrome: un incontro basso (fan) e uno medio (hater) forzati durante `SALTO=true` si
  risolvono in silenzio, un rigo nel diario, zero modali aperte. Un salto di 20 giorni con un opp
  reso sempre eleggibile (rivali finti + 400 fan) si ferma al primo giorno utile, il rapporto di
  settimana e la scena si accavallano senza rompersi (il rapporto ha z-index più alto, si chiude
  prima e poi si vede la scena sotto), e chiudendo la scena il salto riprende — verificato fino
  alla fine, anche con più interruzioni di fila nello stesso salto. Un salto di 7 giorni senza
  condizioni rare si conclude come sempre, un solo rapporto, nessuna interruzione di troppo.

---

---

## 13 · L'albero delle abilità

> **FATTO** — commit `297022f` (la schermata) e `a3e530a` (dentro ci finisce la
> tua carriera). File: `frontend/js/game/abilita.js`, `frontend/css/abilita.css`,
> e come strato visivo il disegno del concept
> (`media/photo/pagina_skill_tree/albero-abilita.png`, 1672×793).
>
> La richiesta era «una sezione delle skill, sbloccabili con i soldi o con
> un'altra valuta — per esempio penna d'oro: +1 alla scrittura». Adesso è una
> schermata a tutto schermo con **trentadue nodi**, che si apre dalla linguetta
> **Abilità** della plancia.
>
> **Il disegno è il disegno, non una sua imitazione.** Sopra alla foto del
> concept ci stanno solo le cose che si muovono: i nodi, la colonna di destra e
> due pezze che coprono i comandi finti dipinti dentro all'immagine. Il foglio
> di stile sta tutto sotto `#abilita`: il mock era una pagina a sé e si prendeva
> `*`, `html,body` e un `:root` coi nomi che in `base.css` esistono già — messo
> com'era avrebbe ridipinto tutto il gioco.
>
> **Quello che la seconda passata ha sistemato**, provandolo:
> - copre tutta la finestra (prima restavano due bande nere sopra e sotto);
> - la linguetta «Abilità» apre l'albero e basta, senza una vista in mezzo con
>   dentro un tasto per aprirlo;
> - il tasto per tornare alla mappa è un tasto vero e scritto, non un rettangolo
>   invisibile da indovinare;
> - la colonna di sinistra dice **la tua** partita e non più i numeri finti
>   dipinti nella foto (un artista di nome ALBERO, livello 50, Los Angeles):
>   faccia, nome, livello vero con la barra dell'XP, e le quattro abilità come
>   le conta il gioco, con lo stesso fondoscala dell'hub — se le due schermate
>   dicessero numeri diversi sarebbe peggio che non dirli;
> - anche la fase richiesta dai nodi è `G.phase`, quella vera.

---

## Si parte con tutti i parametri a 1

> **FATTO (20/09/2026)** — branch `task/piccole-agenda-beat-parametri-licenziarsi`, una
> delle quattro piccole chiuse insieme. File: `frontend/js/game/state.js`, una riga.

Il punto di ALE: *«Il giocatore parte con tutti i parametri a 1»*. In `START()` le quattro
abilità — scrittura, flow, presenza, rete — partivano a 0; adesso a 1. È l'unico posto che
le assegna: gli altri (`gain`, `chRete`, `chPalco`) sommano.

Guardato `livello()`, che le somma: quattro punti fanno 88 di esperienza su 300, quindi si
resta al **livello 1** e nessuna soglia si sposta. Cambia solo che la scheda non parte più
con quattro barre vuote. Le partite salvate prima restano coi loro numeri: non si rileggono.

---

## Dimissioni e licenziamento nei lavori strutturati

> **AGGIORNATO (02/10/2026)** — la vecchia regola del 20/09/2026
> *«da un lavoro non ci si può licenziare»* è stata superata dal gameplay attuale.
> La fonte di verità è il contratto per luogo in `frontend/js/game/actions.js` e
> la UI dei luoghi in `frontend/js/game/luoghi-foto.js`.

La decisione storica del 20/09 impediva di lasciare volontariamente un lavoro e faceva
dipendere l'uscita dal posto soltanto dal licenziamento. **Non è più il comportamento del
gioco.**

**Com'è adesso.** Fabbrica e Pizzeria, i due lavori strutturati attualmente giocabili,
mostrano nella loro schermata il tasto **«Dai le dimissioni»**. La scelta apre una conferma;
se il giocatore accetta:

- `lavoroTerminaContratto(luogo, "dimissioni")` chiude il contratto corrente e lo archivia
  in `contractHistory` con giorno e motivo della chiusura;
- `G.job` torna `null`, quindi da quel momento non arrivano più paga e turni di quel posto;
- eventuali straordinari già accettati o ancora pendenti vengono cancellati insieme al
  contratto;
- il rapporto appena chiuso viene archiviato in `contractHistory`, insieme a una fotografia
  della carriera raggiunta al momento dell'uscita;
- **presenze e progressione corrente vengono azzerate**: affidabilità torna a 50, ruolo,
  cicli, aumenti e richiami ripartono da zero;
- le dimissioni non applicano il blocco di riassunzione previsto per un licenziamento.

Il **licenziamento** resta una conseguenza diversa. Passa da `lavoroLicenzia()`: registra
un licenziamento nello storico, chiude il contratto con motivo `licenziamento` e applica
il blocco di riassunzione definito dalla disciplina del luogo (**8 settimane in Fabbrica,
4 in Pizzeria**). Anche il licenziamento azzera subito la progressione corrente; resta
soltanto il blocco temporaneo necessario a impedire il rientro immediato. Scaduto il blocco,
una nuova assunzione riparte dalla mansione e dalla paga iniziali.

Quindi la regola corrente è: **dimissioni e licenziamento chiudono la carriera interna e
un'eventuale riassunzione riparte da zero; il licenziamento aggiunge anche il blocco di
riassunzione**. I testi e la documentazione non devono più
riproporre la vecchia frase *«da un lavoro non ci si licenzia»*.

## Ferie in Fabbrica

**FATTO (02/10/2026)** — il contratto Fabbrica prevede **2 giorni di ferie ogni ciclo di
4 settimane**. La richiesta deve essere registrata **almeno il giorno prima**: non esiste
una giustificazione retroattiva il giorno stesso per salvare un evento concomitante.

Le ferie approvate:

- liberano davvero quel giorno dal turno: la Fabbrica risulta non lavorabile e non viene
  generata paga;
- coprono la quota contrattuale della settimana senza trasformarsi in una presenza finta
  (es. 4 turni + 1 ferie = 5/5 coperti);
- non producono malus di affidabilità, assenze o richiami;
- possono mantenere perfetto un ciclo quando il resto delle presenze è completo;
- non possono sovrapporsi a uno straordinario già accettato o pendente, e una richiesta
  straordinaria non viene proposta su un giorno già segnato come ferie;
- vengono azzerate insieme al rapporto di lavoro in caso di dimissioni o licenziamento.

La schermata Fabbrica mostra i giorni approvati con **F** nel cartellino e un pannello
**Ferie** per richiedere i giorni futuri disponibili.

## L'attesa lunga non si trascina

CARLO, «quando skippi tante ore ci mette troppo a simulare».

**FATTO (28/09/2026)** — branch `task/skip-lento`. Prima misurato, nel browser a 1440 × 900:

| cosa | prima | dopo |
|---|---|---|
| «Attendi» 8 ore | 11,8 s | 2,2 s |
| «Attendi» 1 ora | 1,5 s | 1,5 s |
| un passo da 15 minuti, senza pause | 14 ms | 12 ms |
| +7 giorni | 0,2 s | 0,2 s |

Il tempo non se ne andava nel calcolo ma nell'attesa voluta: `waitTo()` in
`tempo-controlli.js` fa un passo da 15 minuti e poi dorme 350 ms, per far vedere il cielo e
la luce della mappa che cambiano. Otto ore sono 32 passi, cioè 11,2 secondi di sonno. I
passi restano da 15 minuti — eventi dell'orologio, orari e agenda li contano uno a uno —
ma le pause di un'attesa intera stanno in 1,6 secondi (`pausaPasso()`: fra 25 e 350 ms a
passo). Fino a un'ora e un quarto non cambia niente; la luce della mappa dura almeno 380 ms e
i cambi si fondono. L'audit controlla che la pausa non torni fissa.


## Eventi Fabbrica per ruolo e straordinari contestuali

**FATTO (02/10/2026)** — gli eventi della Fabbrica distinguono davvero la mansione del
giocatore invece di limitarsi a cambiare il titolo del popup.

- Operaio, Operaio esperto, Capolinea e Capoturno hanno **5 eventi di ruolo ciascuno**;
- l'anti-ripetizione conserva gli ultimi **4 eventi di ruolo**, così un ruolo non alterna
  continuamente le stesse due scene;
- gli eventi di reparto chiaramente legati al lavoro operativo di linea vengono esclusi
  dai ruoli per cui non avrebbero senso;
- gli effetti continuano a usare le statistiche reali (affidabilità, benessere, lucidità,
  rete) e il profilo fisico/mentale già previsto per ogni ruolo;
- gli straordinari continuano a usare lo stesso motore economico e disciplinare, ma la
  richiesta ora cambia interlocutore e responsabilità: Capolinea per gli operativi,
  Capoturno per il Capolinea, Responsabile di produzione per il Capoturno;
- il motivo dello straordinario resta persistente dopo l'accettazione e ora registra
  anche il ruolo con cui l'offerta è stata generata.

Le probabilità globali degli eventi non sono state aumentate: la modifica amplia varietà
e coerenza, senza trasformare il lavoro in una sequenza più frequente di popup.

## Maggiorazioni esplicite nel contratto Fabbrica

**FATTO (02/10/2026)** — il testo del contratto Fabbrica dichiara ora anche le
maggiorazioni già applicate dal motore economico:

- **+30%** sul **6° giorno distinto** lavorato nella stessa settimana;
- **+75%** sulla **domenica straordinaria** proposta e autorizzata dall'azienda.

La UI non duplica questi numeri: legge `bonusSestoGiornoPct` e `bonusDomenicaPct`
da `ADF_LAVORO_CONTRATTI.fabbrica`, la stessa configurazione usata da
`lavoroPagaTurno()`. La regola resta visibile anche dopo la firma del contratto.

## Stress test Fabbrica operativo

**FATTO (02/10/2026)** — lo stress test Fabbrica non controlla più soltanto
fatica globale, paga e progressione ideale. `npm run bilanciamento:fabbrica`
esegue anche una suite deterministica sulle funzioni reali di `actions.js` e
`lavoro-eventi.js`.

La suite copre:

- il carico dei quattro ruoli, verificando il passaggio da lavoro più fisico a
  pressione mentale crescente;
- la disciplina settimanale: 5/5, una assenza, richiami formali ripetuti e
  licenziamento con blocco di riassunzione;
- i cinque eventi specifici di ciascun ruolo, attraversati senza ripetizioni
  nelle prime cinque finestre utili;
- il conflitto musica/lavoro, distinguendo una scelta musicale ancora
  recuperabile da una che rende inevitabile un'assenza, e verificando anche
  il caso opposto in cui il giocatore lavora e perde l'appuntamento.

Il vecchio stress test annuale resta invariato: questa suite lo completa invece
di sostituirlo. In questo modo una regressione economica e una regressione di
gameplay vengono segnalate separatamente.

## Playtest doppia vita: Fabbrica + musica

**FATTO (02/10/2026)** — il bilanciamento della Fabbrica include ora un playtest
deterministico dedicato alla convivenza fra contratto 5/5 e carriera musicale.

Il test non introduce malus nuovi. Legge direttamente da `tempo.js`, `orari.js`
e `agenda.js` la durata del turno, le durate delle azioni musicali, gli orari
della Fabbrica e gli appuntamenti settimanali.

I guardrail sono:

- con il turno fatto presto, **5 giorni di Fabbrica + musica serale restano
  compatibili** e rimane anche un giorno lavorativo di margine;
- una mattina piena di musica (`scrivi` + `beat`, 4 ore) rende impossibile
  infilare dopo un turno da 8 ore prima della chiusura, ma il **sabato può
  ancora recuperare** il 5/5;
- due mattine così nella stessa settimana lasciano solo 4 giorni lavorabili
  su 6: a quel punto il giocatore deve scegliere davvero fra contratto e musica;
- una sessione da 3 ore prima del turno sposta il lavoro alle 11:00–19:00 e
  può trasformare un appuntamento serale in un conflitto reale di Agenda.

La pressione quindi nasce dal **tempo occupato dalla musica** e dagli appuntamenti,
non da una penalità astratta per il solo fatto di avere un lavoro.

## Pacing degli eventi Fabbrica

**FATTO (02/10/2026)** — la revisione del sistema eventi Fabbrica interviene
anche sull'arbitro, non soltanto sul numero di scene.

- gli eventi automatici incidentali (`factory`, `colleague`, `role`, `music`,
  `physical`, `crime`) condividono un **gap globale di 3 giorni**;
- con un normale 5/5 questo limita il ritmo a circa **1–2 popup incidentali
  per settimana**, invece di permettere a famiglie diverse di alternarsi a
  ogni turno;
- l'ordine delle famiglie **ruota** dopo ogni tentativo/evento: musica e ruolo
  non hanno più una priorità fissa sui colleghi o sulla stanchezza;
- carriera, disciplina, straordinari e conflitti Agenda non sono sottoposti a
  questo freno, perché derivano da una conseguenza o scelta concreta del giocatore;
- i cooldown specifici per famiglia restano attivi sopra il pacing globale.

Il test automatico simula 20 turni su quattro settimane con tutte le famiglie
abilitate: verifica massimo due eventi incidentali a settimana e almeno cinque
famiglie diverse effettivamente raggiunte.

## Capoturno come grado terminale della Fabbrica attuale

**FATTO (02/10/2026)** — la carriera Fabbrica resta volutamente chiusa a
**Capoturno**. Non viene introdotto un quinto ruolo finché non esiste un
percorso verificato per la città/trasferimento successivo.

Il comportamento attuale è protetto da test:

- `lavoroProgressoCarriera("fabbrica")` restituisce `prossimo: null` a Capoturno;
- `promozione.massimo` resta `true`;
- `lavoroPromozioneDisponibile("fabbrica")` resta `false` anche con requisiti
  ampiamente superati;
- la UI continua a mostrare **Grado massimo raggiunto**.

Questa è una decisione di perimetro, non il disegno definitivo della carriera:
l'estensione oltre Capoturno va progettata insieme alla progressione geografica,
non aggiunta come ruolo isolato dentro la Fabbrica attuale.

---

## Il recap di fine giornata

> «mettere un recap giornaliero con in aggiunta gli highlights di cosa è successo durante
> il giorno» — CARLO, «Da fare»

**FATTO (02/10/2026)** — branch `task/recap-giornaliero`. Quando chiudi la giornata col
«+1 giorno» esce una finestra, «Giornata chiusa · Martedì · Settimana 4», con:

- **i numeri del giorno**: soldi, fan, hype e benessere rispetto a stamattina, e l'energia
  spesa (la lucidità, se si è mossa, in una riga);
- **le mosse** fatte, contate («Scrivi barre ×2 · Registra il pezzo»);
- **gli highlights**: le righe del diario scritte da stamattina, compresa la notte appena
  passata. Se sono più di cinque si scelgono per peso — prima quelle grosse (un disco
  d'oro), poi le belle e le brutte, poi il resto — e si leggono in ordine di tempo, con un
  pallino che dice di che tipo sono; le altre si contano («e 2 altre cose, nel diario»).
  Una giornata senza mosse e senza niente nel diario lo dice in una riga.

Non esce il settimo giorno (c'è il rapporto della settimana, e due finestre una
sull'altra sono un fastidio), sui salti lunghi (+7, +28), quando la notte si ferma su un
evento, né in carcere. Finché è aperto gli eventi aspettano, e si chiude con «Domani», con
ESC o con un clic fuori. Si spegne con «Non mostrarlo più» o dalle Impostazioni, in Gioco
(«Recap di fine giornata», `SET.gioco.recap`), per chi salta i giorni uno alla volta.

Il codice sta in un file nuovo, `frontend/js/game/recap-giornata.js`, con
`css/recap-giornata.css` (la finestra è quella del rapporto della settimana; a 390 punti
d'altezza si stringe e il tasto resta in vista). Gli agganci: `pushLog` in `sim.js` conta le
righe del diario (`G.logN`, il diario ne tiene solo 80 e scrive in testa), `avviaAzioneDiretta`
in `ui.js` conta le mosse, `saltaGiorni` in `eventi-v2.js` prende i numeri prima del cambio
giorno e apre il recap dopo, `uscita.js` lo registra fra le finestre. Cinque prove in
`frontend/test/unit/recap-giornata.test.js`, due e2e in `test/e2e/recap-giornata.spec.js`
(anche a 844 × 390); le due e2e che premono «+1 giorno» in fila adesso chiudono anche il recap.

Le mosse fatte fuori dalla plancia — i turni dentro la pagina della Fabbrica, la serata al
Circolo — non passano da `avviaAzioneDiretta`: nel recap compaiono come righe del diario,
non nel conto delle mosse.
