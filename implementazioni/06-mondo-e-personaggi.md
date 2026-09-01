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
