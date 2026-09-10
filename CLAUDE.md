# Anni di Fame — le regole di casa

Gioco di carriera rap, in uscita su Steam e sugli store. `frontend/` è il gioco,
`backend/` è il server. Si scrive e si parla **in italiano**, anche nei commit e nei
documenti.

Queste sono le regole secche. Il perché di ognuna sta in
[`documentazione/come-si-lavora.md`](documentazione/come-si-lavora.md): se cambi una regola
qui, cambiala anche lì.

## Prima di toccare i file

1. **Mai lavorare su `main`.** Un branch per ogni lavoro, `task/qualcosa`, creato *prima*
   di aprire il primo file — non dopo, quando le modifiche sono già in giro.
2. `git fetch` e guarda cos'è arrivato: Carletto pusha mentre lavori, ed è normale.
3. Fai girare `cd frontend && npm run verifica` **sulla base pulita**. `main` può essere
   rosso: se lo scopri alla fine, cerchi dentro al tuo lavoro una rottura che non è tua.

## Mentre lavori

<!-- ADF-AUTO-RULES -->
> **Stato automatico implementazioni:** `ROADMAP.md` resta la roadmap ufficiale. Il bot può **migliorarla e completarla** quando trova buchi minori verificabili e coerenti con la direzione già approvata; non può cancellare macro-fasi, ribaltare decisioni o trasformare una proposta strutturale in decisione senza revisione. Le nuove richieste possono essere messe nell'Inbox automatica di `implementazioni/implementazioni.md`. Prima di creare una task, il sistema cerca duplicati, sovrapposizioni e funzionalità già implementate. `scripts/roadmap-auto.js` importa anche tutte le voci già presenti in `implementazioni/README.md`, conserva il loro stato storico e aggiunge in `implementazioni/auto/` un audit separato contro il codice reale. Una differenza tra stato storico e audit va segnalata, non nascosta.

- **I punti nuovi si scrivono in `implementazioni/implementazioni.md`.** Quando sono
  chiusi si spostano nel file del loro argomento, con sotto **cosa è stato fatto e
  quando**: `**FATTO (gg/mm/aaaa)** — in una frase`. A metà si scrive `FATTO in parte` e
  cosa manca; se se n'è solo discusso, `RISPOSTA` e il ragionamento.
- **I numeri dei punti si spostano.** Cita sempre il **testo** del punto, non il numero da
  solo — né nei commit né nei rimandi fra documenti.
- **`registro-modifiche/` non si scrive a mano**: lo rifà un bot dai merge
  (`scripts/genera-registro-modifiche.js`). Quello che ci metti a mano sparisce.
- Le dipendenze si possono usare: ognuna si sceglie, si motiva in una riga e si può
  togliere. Le regole e il registro stanno in `documentazione/dipendenze.md`.

## Prima di chiudere

1. `cd frontend && npm run verifica` — **non basta `npm run prova`**: la verifica fa girare
   anche `audit-regressioni.js`, che è quello che si accorge se hai tolto qualcosa. Se una
   cosa è stata tolta apposta, togli anche il suo controllo, nello stesso commit.
2. Committa citando il testo del punto.
3. **Il giro di fine task**, prima del push: lancia insieme gli agenti `segnala-problemi` e
   `backend-allineato` (quest'ultimo conta davvero se la task ha toccato `backend/`).
   Quello che trovano si sistema adesso, non dopo il push. Dopo il commit un hook te lo
   ricorda da solo.
4. Poi push, e il merge in `main`.

`prova-sul-telefono` è il terzo agente: non è da ogni task, si lancia quando si sono
toccate schermate, CSS o card.
