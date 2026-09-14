# Lo Studio senza Cover, Feat e Marketing — un brainstorming

Scritto il 14/09/2026, dopo il giro dei sette ritocchi sul foglio «LUOGO: STUDIO». Non
è una decisione: è il foglio su cui decidere. Ogni idea ha il suo pro, il suo contro e
cosa tocca nel codice, così si sceglie sapendo il prezzo.

> **Deciso e fatto (15/09/2026): B + D3 + F2 + E**, nell'ordine di lavoro scritto in
> fondo. Cosa è venuto fuori sta in `implementazioni/02-interfaccia-e-telefono.md`, «Lo
> Studio a cinque linguette». Delle domande in coda: togliere = **B**; il feat = **D3** e
> pesa su ascolti e hype; ad ogni pezzo = **F2**; la Cover pesa sugli stream (**E**); la
> «terza strada» della copertina (l'emblema a livelli) resta in lista, non è stata toccata.
> Una cosa che il foglio non aveva pesato: sotto i 1180px il telefono della plancia non
> c'è, e lì la promo parte dallo Studio senza la scelta del pezzo.

Due cose nuove che arrivano da Carletto e che qui si tengono ferme:

1. **«Sto pensando di voler togliere le sezioni Cover, Feat, Marketing.»**
2. **Il punto 10 dello Studio («prima Beat, Testo e Cabina, poi il resto») va letto
   «ad ogni pezzo»**, non «solo la prima volta» com'è stato fatto il 14/09.

Le due cose si tengono per mano: con la lettura «ad ogni pezzo» il problema delle tre
sezioni si vede meglio, ed è scritto sotto in *Cosa c'è che non va*.

---

## Cosa fanno oggi le tre sezioni, in una riga l'una

| linguetta | cosa fa davvero | dove sta nel codice |
| --- | --- | --- |
| **Cover** | mostra i pezzi registrati, propone una copertina generata o una foto caricata, la si conferma. «Sulla qualità pesa poco, su chi ti clicca pesa tutto» — ma nei numeri **non pesa da nessuna parte**: `sim.js` la copertina non la legge | `studioSezCover()`, `studioCover*()` in `frontend/js/game/studio.js`; `copertine.js` |
| **Feat** | elenca i rapper **che conosci** (`G.gente`, ruolo `rapper`), ne metti uno «in sessione», la **prossima** registrazione vale `+ rel×1,2 + fama×0,12` di qualità, il nome resta sul pezzo (`s.feat`) e poi il posto torna libero | `studioSezFeat()`, `studioFeat()`, `studioConsumaFeat()`; letto da `actions.js` in `registra` |
| **Marketing** | scegli quale pezzo uscito spingere e «Posta» (è la mossa `promo` della settimana, con la spinta `s.spinta`); di un pezzo non uscito fai uscire un'anteprima (max 3) | `studioSezMarketing()`, `studioDaSpingere()`, `studioDaAnticipare()`; mosse `promo` e `anteprima` in `actions.js` |

Tre fatti che pesano sulla scelta:

- **La Cover non entra nell'economia.** È un pannello per scegliere un'immagine. Le
  copertine si generano già da sole alla registrazione (`copertine.js`), quindi senza la
  sezione non si perde un pezzo senza faccia: si perde solo il *cambiarla*.
- **Il feat esiste due volte, e nessuna delle due è intera.** Nello Studio è un
  *ingrediente* (+qualità, nome sul pezzo, niente hype). Alla Sala «Proponi un pezzo
  insieme» (`posto.js`, tipo `feat`) è un *evento* (+hype, +fan, +rete, **nessun pezzo
  in cartella**). Il foglio dell'hype dice che il feat con «nomi più grandi» deve muovere
  l'hype quando il pezzo va bene: oggi non lo fa né l'uno né l'altro, perché il feat sul
  pezzo `sim.js` non lo guarda.
- **Il Marketing è già una pagina del telefono.** Il riferimento
  `studio_promo_su_lafamegram` ha in cima «TELEFONO · LAFAMEGRAM», non «STUDIO», e la
  sezione stessa lo dice nel codice. Delle tre strade del punto 4 (app Discografia,
  sezione in studio, terza) ne è stata fatta una; l'esito «le altre due strade non sono
  ancora collegate qui» è scritto in chiaro dentro la sezione.

---

## Cosa c'è che non va (il problema, detto tutto)

1. **Otto linguette per fare un pezzo sono tante**, e sul telefono si vede: a 360px la
   prova del 14/09 ha trovato le linguette chiuse attaccate al bordo e il Beat che si
   perdeva (`documentazione/prove-telefono/2026-09-14/linguette-chiuse-*.jpg`). Con cinque
   ci stanno senza scorrere.
2. **Tre delle otto sono sale d'attesa.** Cover e Feat a inizio partita sono vuote o
   inutili («Non conosci ancora nessun altro rapper»; «Non hai pezzi a cui cambiare la
   copertina»), e il Marketing prima del primo pezzo uscito ha il tasto spento.
3. **Il Feat sta nel posto sbagliato della catena.** È una linguetta *dopo* la Cabina,
   chiusa finché non c'è un pezzo, ma agisce sulla registrazione *successiva*: si chiude
   il cancello dopo che i buoi sono usciti. Con la lettura «ad ogni pezzo» diventa
   proprio contraddittorio — il feat andrebbe scelto *prima* di incidere, cioè in Cabina,
   accanto al fonico.
4. **Il Marketing lavora su pezzi già usciti**, cioè su cose che non stanno più «sul
   banco». Con la lettura «ad ogni pezzo» (Mix e Uscita si chiudono quando il pezzo è
   fuori) il Marketing sarebbe l'unica linguetta a dover restare aperta a vuoto — un altro
   segno che non è dello Studio.
5. **La domanda aperta sui feat** — da chi si sceglie — non si risolve con una lista più
   spiegata: si risolve decidendo *che cosa è* un feat nel gioco (idee D).

---

## Le idee

### A · Togliere le tre linguette e basta

Le sezioni spariscono; quello che facevano va dove esiste già o si perde di proposito.

- **Cover** → la copertina la genera la registrazione (già così). Per cambiarla: dal
  **Catalogo** (la riga del pezzo ha già la copertina) o dalla **Discografia**, con «Carica
  una foto» e «Generane un'altra» spostati lì. La proposta-con-conferma resta com'è, solo
  in un altro posto.
- **Feat** → resta solo quello della Sala. Perché non sia un evento a vuoto, il feat della
  Sala **lascia un pezzo in cartella** (una traccia registrata insieme, col suo nome in
  `s.feat`, qualità = tua + la sua parte) invece di dare solo hype e fan. Così il feat
  diventa un pezzo vero senza passare dallo Studio.
- **Marketing** → tutto sul telefono, LaFamegram: la lista «Cosa spingi» diventa la
  scelta del pezzo sotto a «CHE POST FAI?», l'anteprima diventa un tipo di post
  («15 secondi»), l'avviso della saturazione torna a casa sua. Lo Studio, dopo l'uscita,
  dice «Adesso fallo sapere» con un tasto che apre il telefono.

**Pro:** cinque linguette, tutte piene dal primo giorno (Beat · Testo · Cabina · Mix ·
Timing). Nessuna schermata vuota. La lettura «ad ogni pezzo» torna pulita. Le foto di
riferimento non perdono niente: Cover e Feat una foto loro non ce l'hanno.
**Contro:** si perde il *confronto* «prima/dopo» della copertina se lo si mette in una
riga di catalogo; il feat della Sala oggi non chiede *quale* pezzo, e farglielo fare vuol
dire disegnare lì un piccolo pezzo di Studio.
**Costo:** medio. `studio.js` (togliere tre voci di `STUDIO_SEZIONI` e tre renderer),
`telefono.js` (la promo con la scelta del pezzo + l'anteprima), `posto.js` (il feat che
lascia un pezzo), `ui.js` (cover dal catalogo), e le prove di `strumenti/prova.js` che
oggi controllano le tre sezioni — `audit-regressioni.js` se ne accorge, e i controlli
tolti vanno tolti nello stesso commit.

### B · Non toglierle: fonderle dove hanno senso

Le tre *linguette* spariscono, ma quello che fanno resta nello Studio, dentro alle
stanze giuste.

- **Feat → in Cabina.** Sotto al fonico, una seconda riga: «Con chi: da solo · Kobra ·
  Sara Sette». Stesso disegno delle caselle `data-fonico`, stesso «da solo» che si
  clicca. La lista vuota non è più una schermata vuota: è una riga sola, «con nessuno —
  i rapper si incontrano alla Sala».
- **Cover → in Timing**, che si chiama **Uscita**: «com'è vestito, e quando esce». Sopra
  al QUANDO la copertina grande con «Cambia» (proposta → conferma, com'è oggi), sotto le
  tre scelte stanotte / venerdì / cassaforte. È il momento in cui uno *guarda* la
  copertina davvero: prima che esca.
- **Marketing → sul telefono** (come in A).

**Pro:** è la stessa catena del punto 4 — beat, testo, cabina, mix, uscita — con gli
ingredienti nel punto della catena in cui si decidono. Il feat si sceglie *prima* di
incidere, che è l'unico posto in cui ha senso. Cinque linguette.
**Contro:** la Cabina e l'Uscita diventano più piene, e sul telefono vanno riprovate
(`prova-sul-telefono`). La Cover perde il pannello suo, e la «terza strada» (l'emblema a
livelli) resta dove sta: non c'è.
**Costo:** medio-basso. Quasi tutto in `studio.js` (spostare due renderer dentro ad altri
due), `telefono.js` per la promo, CSS per la Cabina a due righe, prove.

### C · Il feat come invito, non come lista

Variante di B, più radicale: **non c'è nessuna lista di rapper nello Studio**. Quando
registri, se hai almeno un rapper con cui il rapporto è a «collaboratore», la Cabina
chiede «da solo, o con X?». Se non ce n'è, non chiede niente. Il feat è una *possibilità
che compare*, come un'occasione, non un menù.

**Pro:** zero schermate vuote, zero spiegazioni della lista vuota. Il gioco parla solo
quando ha qualcosa da dire.
**Contro:** chi ha cinque collaboratori vuole *scegliere*, e allora torna la lista (in
Cabina, come in B). C è la versione per l'inizio della partita; B quella per dopo. Si può
fare C che diventa B da solo quando i rapper sono più di uno.

### D · Da chi si sceglie il feat (la domanda rimasta aperta)

È la domanda sotto al punto «non posso scegliere i feat». Quattro risposte, dalla più
piccola alla più grande; **si sommano a A, B o C**, non le sostituiscono.

- **D1 · Solo chi conosci, spiegato meglio.** Com'è ora, più un tasto «Vai alla Sala» nel
  vuoto e la soglia scritta: «serve che siate collaboratori». È la risposta da un'ora.
  Non risolve niente della domanda di design, ma toglie il «non posso scegliere».
- **D2 · Tutti i rapper della città, con costo e rifiuto.** I rivali della classifica
  (`rivals.js`, `RIV_NOMI`, hanno già fama, città, genere e faccia) si possono chiamare
  anche mai visti. Prezzo in € che sale con la sua fama; probabilità di sì che dipende dal
  rapporto fra la tua fama+hype e la sua (uno più grosso di te dice no quasi sempre, uno
  della tua misura sì spesso, uno più piccolo sempre e per poco). Il no costa poco (un po'
  di energia e una giornata), il sì di uno grosso vale molto — ed è esattamente il
  «feat con nomi più grandi» del foglio dell'hype.
- **D3 · Le due porte insieme.** Chi conosci accetta sempre e costa poco o niente (il
  rapporto è già il prezzo pagato); i rivali si pagano e possono dire di no; **se
  accettano entrano in `G.gente` come «contatto»**. Il feat diventa una porta d'ingresso
  alla rete, non solo un numero: hai pagato un pezzo, ti resta un conoscente. È la risposta
  che tiene insieme Sala e Studio invece di farli concorrere.
- **D4 · Il feat passa dal telefono.** Si scrive al rapper in Chat/Contatti («ho un pezzo,
  ci stai?»), lui risponde sì, no, o «quanto mi dai». La trattativa sta dove starebbe
  nella vita — sul telefono — e lo Studio fa solo incidere. È la più bella da raccontare
  e la più cara da fare: chat con risposte, stati, tempi.

**Cosa cambia sul pezzo, qualunque D si scelga:** oggi il feat vale solo qualità alla
registrazione. Per contare davvero, `songWeekly()` in `sim.js` dovrebbe leggere `s.feat`
(o meglio la *fama* di chi c'è) e darne una parte agli ascolti — la sua gente che ascolta
il pezzo — e un pezzo con un nome grosso che va bene dovrebbe muovere l'hype. Senza
questo, il feat resta un +8 di qualità con un nome scritto sotto.

### E · I numeri per elemento, e cosa succede togliendo le sezioni

Il foglio dice *Beat 82 / Testo 76 / Mix 68 / Feature 85 / Marketing 53 → QUALITÀ tot*,
e la roadmap segna che questo riquadro manca ancora. Togliere le sezioni **non** vuol
dire togliere le voci — ma è l'occasione per rimetterle nel posto giusto:

- **Qualità** = Beat, Testo, Mix, Feat (la persona in cabina). Sono le cose che rendono il
  pezzo *buono*.
- **Ascolti** = Qualità × Cover × Timing × Marketing, × hype/fama/network. Sono le cose
  che rendono il pezzo *sentito*.

Una cover non fa un pezzo migliore, fa cliccare di più; il marketing idem. Metterle nella
qualità (come nel foglio) le rende uguali al mix, e non lo sono. Con questa divisione la
Cover torna a pesare *davvero* (oggi non pesa), sugli stream della prima settimana, e il
Marketing pesa dove già pesa (`s.spinta`). Il riquadro dei numeri lo si mostra
nell'Uscita: «Beat 82 · Testo 76 · Mix 68 · con Kobra +9 → q 79».

### F · Il punto 10 letto «ad ogni pezzo»: cosa vuol dire di preciso

Tre modi di farlo, dal più piccolo:

- **F1 · Una riga.** `studioSbloccato()` non guarda più «esiste almeno un pezzo» ma
  «esiste almeno un pezzo **registrato e non ancora uscito**» (`ready()` o `unmixed()` non
  vuoti). Quando tutto è fuori, Mix e Timing si richiudono fino alla prossima
  registrazione. Con Marketing ancora dentro non funziona (lavora sui pezzi usciti): è la
  ragione in più per portarlo sul telefono prima.
- **F2 · Il pezzo sul banco.** Lo Studio ha *un* pezzo in lavorazione (`G.studio.banco` =
  seed): Beat/Testo/Cabina lo fanno nascere, appena registrato Mix e Uscita si aprono *su
  quello*, quando esce (o va in cassaforte) il banco si svuota e si richiudono. I pezzi in
  cassaforte o registrati prima si «rimettono sul banco» da una riga in Cabina. Risolve
  l'obiezione scritta il 14/09 («mixare il pezzo di ieri mentre scrivi quello di oggi»):
  lo si fa scegliendo cosa c'è sul banco, uno alla volta, che è anche più leggibile di tre
  elenchi «I tuoi pezzi» ripetuti in tre sezioni.
- **F3 · La catena stretta.** Come F2, ma le linguette *dopo* non si possono saltare:
  Mix prima di Uscita, sempre. Più guidato, più rigido; per un giocatore che ha capito il
  gioco è un freno. Sconsigliato, ma è la lettura più letterale del punto.

F2 è quella che va d'accordo con A e B: le tre liste «I tuoi pezzi» di Mix, Cover e
Timing diventano una scelta sola, e le sezioni dopo la Cabina parlano tutte dello stesso
pezzo.

---

## Quello che non toglierei, in ogni caso

- **L'anteprima.** Misurata il 14/09: +63 % la prima settimana, +25 % su sei. Funziona
  ed è una scelta vera (tre volte al massimo, poi deve uscire). Cambia solo casa: un tipo
  di post su LaFamegram.
- **La spinta sul pezzo scelto** (`s.spinta`), che è quello che rende la promo una scelta
  invece di un tasto.
- **La proposta con conferma della copertina.** Il pannello può sparire, il gesto no:
  nessuno vuole una copertina cambiata senza averla vista.
- **Il fonico dietro al vetro e il feat in sessione** come *persone* con un rapporto:
  è il loop della roadmap (conosco → lavoro insieme → si vede nel pezzo).

## Quello che si perde, detto onesto

- Il **confronto prima/dopo** della copertina, grande al centro, se finisce in una riga
  di catalogo (in B non si perde: sta nell'Uscita).
- La riga «+9 qual.» accanto a ogni rapper nella lista Feat, se il feat diventa un invito
  (C) invece di una lista.
- Tre delle otto **linguette**, cioè tre schermate che sul telefono erano già un
  problema. Questa non è una perdita.

---

## La mia proposta, se dovessi scegliere io

**B + D3 + F2 + E**, in quest'ordine di lavoro:

1. **Marketing sul telefono** (chiude una linguetta, sistema F prima di farlo): la promo
   di LaFamegram sceglie il pezzo, l'anteprima è un post, lo Studio dopo l'uscita rimanda
   lì. Una task da sola.
2. **Feat in Cabina, accanto al fonico**, con D3 (chi conosci gratis, i rivali a pagamento
   e con rifiuto, e chi accetta entra fra i contatti). Chiude la linguetta e la domanda
   aperta insieme. Una task.
3. **Cover dentro all'Uscita**, e la qualità/ascolti divisi come in E, col riquadro dei
   numeri. Chiude l'ultima linguetta e il «manca» della roadmap. Una task.
4. **Il pezzo sul banco** (F2): a quel punto le sezioni dopo la Cabina sono due, Mix e
   Uscita, e chiuderle «ad ogni pezzo» è naturale. Piccola.

Alla fine: **Beat · Testo · Cabina · Mix · Uscita**, cinque linguette, nessuna vuota, e la
catena del punto 4 tutta intera.

## Le domande a cui rispondere prima di cominciare

- [ ] Togliere = **A** (via, quello che fanno va altrove) o **B** (fondere nelle stanze)?
- [ ] Il feat: solo chi conosci (**D1**), tutti con costo e rifiuto (**D2**), le due porte
      (**D3**), o dal telefono (**D4**)?
- [ ] Il feat deve pesare sugli **ascolti e sull'hype** (la sua gente che ascolta), o
      resta solo qualità?
- [ ] «Ad ogni pezzo» = **F1** (si richiudono quando tutto è fuori) o **F2** (un pezzo
      sul banco)?
- [ ] La Cover pesa sugli stream (**E**) o resta estetica?
- [ ] La «terza strada» della copertina (l'emblema a livelli) si tiene in lista o si
      lascia cadere?
