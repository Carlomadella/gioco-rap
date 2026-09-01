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

---

## 15 · I progressi si salvano, tre slot

15. fai in modo che i progressi di gioco vengano salvati, dalla schermata di avvio posso decidere se caricare una partita o crearne una nuova, max 3 slot partita disponibili.

---

## 22 · L'energia cresce col livello, e i livelli devono avere un senso

22. l'energià più si sale di livello più aumenta, come poi per tutto, i livelli dovranno avere un senso, puntiamo ad un gioco in cui farmare non fa stufare l'utente che gioca

---

## 24 · Gli slot anche nella schermata di avvio

24. Gli slot ci sono (impostazioni → Partite): restano da mettere anche nella schermata di avvio, come scelta prima di giocare.

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
