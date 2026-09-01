# La carriera e il tempo

Energia, giornate, settimane, livelli, salvataggi: il ritmo con cui si gioca.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 1 · Cosa si può simulare

1. Si può simulare:
   Un giorno: ti riposi e ricarichi l'energia
   Una settimana: ti riposi, ricarichi l'energia ma perdi lucidità
   Un mese: ti riposi, ricarichi l'energia, perdi lucidità e perdi hype

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
