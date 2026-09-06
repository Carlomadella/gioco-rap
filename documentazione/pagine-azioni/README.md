# Una pagina per ogni azione?

> «voglio creare una pagina per praticamente ogni azione, con interfaccia e bottoni
> cliccabili a schermo (anche trasparenti ma non per forza), secondo te ha senso questa
> cosa?»
>
> — punto 2 di [`implementazioni.md`](../../implementazioni/implementazioni.md)

Questo foglio risponde a quella domanda. Non è una promessa di lavoro: è l'analisi,
i pro, i contro, e un progetto pagina per pagina da cui poi si spuntano i punti.

---

## La risposta in due righe

**Sì all'idea, no al «per ogni azione».** Una pagina non si dà a un'**azione**: si dà
a un **posto**, e dentro al posto si gioca una **decisione**. Le azioni che una
decisione non ce l'hanno — il turno di lavoro, la corsa in palestra — con una pagina
diventano più lente e non più belle.

E prima di aprirne di nuove c'è una cosa da sistemare: **oggi ogni pagina costa sette
registrazioni sparse in sette file**, e chi ne dimentica una rompe qualcosa in
silenzio. È già successo tre volte. Quella è la spesa vera, non il CSS.

---

## 1. Cosa c'è già

Prima di progettare conviene contare. Il gioco ha **tredici azioni**
(`frontend/js/game/actions.js`, `ACTIONS`) e **dieci luoghi** sulla mappa
(`frontend/js/game/hub.js`, `HUB_LUOGHI`).

Senza averlo mai chiamato così, il gioco usa già **quattro gradini** di
presentazione. Sono la scala su cui ragionare:

| gradino | cos'è | quanto costa | esempi di oggi |
| --- | --- | --- | --- |
| **1 · riga** | una riga di esito nel diario | niente | gli effetti collaterali |
| **2 · scena** | pagina piena con l'illustrazione grande e l'esito scritto sopra, un tasto «Continua». Si guarda, non si tocca | ~20 righe: basta aggiungere l'id a `SCENA_PIENA` in `ui.js` | mixa, pubblica, promo, live, turno, stacca, pesi, cardio |
| **3 · finestra** | una domanda vera con due o tre risposte | ~30 righe (`showEvent`) | Casa, Palestra, Live Club, i colloqui, il titolo del pezzo |
| **4 · pagina** | una schermata sua, con dentro gente, stati e scelte. Si gioca | **da 350 a 1.400 righe di JS più il foglio di stile** | Studio, La Sala, il foglio, la piazza, Attività criminali, il carcere, lo Shop |

E questo è dove sta ogni azione **oggi**:

| azione | dove sta adesso | ha una decisione dentro? |
| --- | --- | --- |
| Scrivi barre | **pagina** — il foglio (`writer.js`), o veloce | sì: la scrivi tu, riga per riga |
| Cerca un beat | riga: «tre beat sul tavolo, si comprano allo Shop» | **no** — te li dà e basta |
| Registra il pezzo | finestra (il titolo) + stanza dello Studio | in parte: scegli il fonico, non la take |
| Mixa il pezzo | scena + stanza dello Studio | **no** — `unmixed().sort()[0]`: sceglie lui |
| Pubblica il pezzo | scena + stanza dello Studio | **no** — `ready().sort()[0]`: sceglie lui |
| Promo sui social | scena + un tasto in «Fuori» | **no** — un numero |
| Freestyle in piazza | **pagina** — la piazza (`piazza.js`), o veloce | sì: vai a tempo e rispondi |
| Serata open mic | scena, dal Live Club | **no** — un numero |
| Vai al turno | scena | **no**, ed è giusto così |
| Cerca lavoro | finestra (due colloqui) | sì |
| Stacca la spina | scena, da Casa | no |
| Pesi / Cardio | scena, dalla Palestra | la scelta è prima, nel cartello |
| *(i colpi della Strada)* | **pagina** — Attività criminali | sì: quattro colpi × tre approcci |
| *(la gente)* | **pagina** — La Sala | sì: le conversazioni |

Vale la pena fermarsi sulla colonna di destra, perché è già tutta la risposta:
**le due azioni che hanno una pagina sono le due che hanno una decisione dentro.**
Non è un caso, ed è successo da solo.

---

## 2. I pro

**È la regola scritta della ROADMAP, non un'idea nuova.** Lì c'è già: «*Tutto
dev'essere interattivo — nessuna riga da database, solo scene e card da gioco*» e
«*Si sblocca un mondo, non un menu*». Una mossa che finisce in un numero tradisce
tutt'e due.

**Il gioco si sente più simulatore e meno foglio di calcolo.** «Mixa il pezzo → +6
qualità» è una formula. «Scegli quale pezzo, chiami Sara al banco, decidi se
spingere la voce o lasciare aria» è un mestiere. È la differenza fra leggere un
risultato e prendere una decisione.

**Dà un posto dove far succedere le cose.** Metà delle idee ferme in
`implementazioni/` sono ferme perché non hanno una stanza in cui stare: le take in
cabina, il rapporto col fonico che si vede mentre lavora, le remaster. Quando la
stanza c'è, si aggiungono una alla volta.

**Le pagine ci sono già e funzionano.** Studio, Sala, piazza, foglio, Strada: sono
la parte del gioco che ci si ricorda. La prova che l'idea è giusta è già in casa.

**I video ci sono già.** In `frontend/media/video/Transizioni di scena/` ci sono
**undici transizioni girate** — studio, sala, ritorno a casa, stacca la spina,
registra un pezzo, palestra, partenza per Milano, club, shop, trasferta, live — ed è
il punto 5 delle cose da fare. Notare **a cosa** sono intitolate: quasi tutte a un
**posto**, non a un'azione. Chi le ha pensate stava già ragionando così.

**L'audio è pronto.** `beatplay.js` suona i beat davvero (bpm, cassa e scala dal
genere, il giro preciso dal seme). «Ascolta il beat prima di comprarlo» costa quasi
zero.

---

## 3. I contro, coi numeri

**Una pagina costa cento volte una scena.** Aggiungere una mossa a `SCENA_PIENA` è
una riga. Le pagine vere del gioco pesano: `posto.js` 973 righe,
`strada-crimine.js` 1.209 più `strada-crimine-ui.js` 462, `studio.js` 424,
`writer.js` 374, `piazza.js` 349. E i fogli di stile: `strada-crimine-v2.css` da
solo è **2.412 righe**, un terzo di tutto il CSS del gioco. Tredici pagine così non
sono tredici volte il lavoro di una: sono tredici volte anche la manutenzione, per
sempre.

**Ogni pagina va tenuta in piedi a ogni misura di schermo, e si rompe da sola.** Non
è teoria: la pagina delle Attività criminali ha appena passato mesi a tagliare
«Molla il giro» e metà del TRAPHONE, a **tutte** le risoluzioni, perché un ritocco
ai caratteri aveva alzato i corpi e nessuno aveva rimisurato (l'elenco delle misure
sta in [`06-mondo-e-personaggi.md`](../../implementazioni/06-mondo-e-personaggi.md)).
Ogni pagina in più è un altro posto dove quel guaio può ricapitare — e sul telefono
in verticale, dove il gioco deve uscire, il margine è ancora più stretto.

**Rallenta il gioco.** Il gioco è a giornate, e in una giornata ci stanno più mosse.
Se ognuna vuole trenta secondi di scena, la settimana non si chiude più. Le mosse
ripetibili — la promo, il turno, la palestra — sono ripetibili **apposta**: una
pagina addosso a una cosa che fai dieci volte diventa un pedaggio, e la prima cosa
che il giocatore cerca è come saltarla.

**Le pagine finte sono peggio del niente.** Una schermata che si apre, dice un
numero e si chiude ha tutti i costi di una pagina e nessuno dei vantaggi. È
esattamente il rischio del «per praticamente ogni azione».

**C'è un ordine da rispettare.** Le pagine che ci sono non sono ancora piene: al
banco il pezzo da mixare **lo sceglie il codice** (`unmixed().sort()[0]`), in
«Fuori» pure. Aprire pagine nuove mentre quelle aperte sono mezze vuote è il modo
più veloce per avere tante stanze e poco gioco.

---

## 4. Il criterio: la pagina si guadagna con una decisione

Una domanda sola, da farsi prima di aprire qualunque schermata:

> **Dentro c'è qualcosa da decidere che cambia come va a finire?**

- **Sì → pagina.** Scegli fra cose diverse, e la scelta si vede nel risultato.
- **No, ma c'è un bivio → finestra.** Due o tre risposte e via (Casa, Palestra).
- **No, ma vale la pena guardarla → scena.** L'illustrazione, l'esito, «Continua».
  È il gradino giusto per le mosse che si ripetono.
- **No e non vale nemmeno guardarla → riga.**

E la regola che ne discende, da tenere in mente più di tutte:

> **Una pagina non si apre per far vedere un esito. Si apre per restituire al
> giocatore una decisione che oggi il codice prende da solo.**

Ogni `sort()[0]` dentro a un'azione è una decisione che il gioco si è preso al posto
tuo. Quelli sono l'elenco delle pagine che vale la pena fare.

---

## 5. Il problema vero: oggi una pagina costa sette registrazioni

Questo è il pezzo che conta più di tutto il resto, e non si vede giocando.

Quando si aggiunge una schermata, per funzionare davvero va **iscritta a mano in
sette elenchi, in sette file diversi**:

| dove | a cosa serve | se te ne dimentichi |
| --- | --- | --- |
| `uscita.js` → `USCITE` | ✕, ESC, clic fuori, e il rimborso dell'energia | non si chiude, o l'energia non torna |
| `uscita.js` → `scenaAperta()` | dire «il conto resta aperto» | l'azione si chiude due volte |
| `tempo-controlli.js` → `blockingOverlay()` | quali finestre fermano l'orologio | il tempo scorre mentre decidi |
| `tempo-controlli.js` → `refreshOtherViews()` | chi si ridisegna quando passa il tempo | numeri vecchi a schermo |
| `eventi-v2.js:195` | cosa chiudere prima di un evento | l'evento esce sopra la tua pagina |
| `trasferte.js:705` | cosa impedisce di partire | parti con una pagina aperta |
| `menu-sistema.js:38` | capire dove sei | il menu di sistema si comporta male |

Non sono ipotesi: **è già andata storta tre volte.**

1. Studio e Strada usavano tutt'e due il prefisso `st-`, e la ✕ dello Studio
   chiamava la funzione della Strada: sembrava un pulsante morto (punto 15).
2. `refreshOtherViews()` chiamava `renderNegozio()`, **che non esiste**: il
   guardaroba e la vetrina non si sono mai riaggiornati col tempo. Sistemato il
   06/09/2026.
3. **E ce n'è ancora una aperta**, trovata scrivendo questo foglio:
   `eventi-v2.js:195` e `trasferte.js:705` chiudono l'elemento **`strada-crimine`**,
   che *non esiste* — l'id vero è `strada`. Quelle due guardie saltano la pagina
   delle Attività criminali da sempre. Segnata in
   [`problemi-riscontrati.md`](../problemi-riscontrati.md).

Tre volte, tutte e tre in silenzio, tutte e tre dallo stesso identico difetto: **la
stessa lista scritta a mano in posti diversi.** Con sette pagine si convive. Con
tredici, no.

### Il telaio: cosa fare prima delle pagine

Un solo registro, e le sette liste che lo leggono invece di ripetersi. Nell'ordine in
cui lo scriverei, in un file nuovo `js/game/pagine.js`:

```js
/* una pagina si dichiara qui, una volta sola */
registraPagina({
  id: "banco",          // l'id dell'elemento nella pagina
  ferma: true,          // ferma l'orologio finché è aperta
  fondale: true,        // il clic fuori chiude
  scena: true,          // conta come "azione in corso"
  chiudi(){ ... },      // come si chiude
  ridisegna(){ ... }    // cosa fare quando passa il tempo
});
```

Poi `uscita.js`, `tempo-controlli.js`, `eventi-v2.js`, `trasferte.js` e
`menu-sistema.js` smettono di avere il loro elenco e chiedono al registro. E una
prova in `audit-regressioni.js` che **fallisce se un elemento `.on` non è
registrato**, così la pagina dimenticata si scopre subito, e non giocando.

È un paio di giorni di lavoro, non tocca niente di quello che si vede, e **dimezza il
costo di ogni pagina fatta da lì in avanti.** Senza, ogni schermata nuova aggiunge
sette occasioni di sbagliare.

---

## 6. Il progetto, pagina per pagina

Applicando il criterio del punto 4 a tutte e tredici le azioni:

| azione | oggi | dove la metterei | perché |
| --- | --- | --- | --- |
| Scrivi barre | pagina | **resta** | c'è già, ed è giusta |
| Freestyle in piazza | pagina | **resta** | c'è già, ed è giusta |
| Cerca un beat | riga | **pagina** — la scena del produttore | l'audio c'è, la trattativa manca |
| Mixa il pezzo | scena | **stanza piena** — Il banco | oggi il pezzo lo sceglie il codice |
| Pubblica il pezzo | scena | **stanza piena** — Fuori | idem, più il quando e la copertina |
| Registra il pezzo | finestra | **stanza piena** — La cabina | le take, il fonico che lavora |
| Serata open mic | scena | **pagina** — il Live Club | è un palco: la cosa più giocabile che c'è |
| Promo sui social | scena | **app del telefono**, non una pagina | la promo si fa col telefono in mano |
| Cerca lavoro | finestra | **resta** | due colloqui sono già una scelta |
| Vai al turno | scena | **resta scena** | è la parte noiosa apposta: va veloce |
| Stacca la spina | scena | **resta scena** (col video 04) | è una pausa, non una decisione |
| Pesi / Cardio | scena | **resta scena** (col video 06) | la scelta è già nel cartello |

**Cinque pagine nuove in tutto — e tre delle cinque sono stanze che esistono già e
vanno solo riempite.** Non tredici.

### Le tre stanze da riempire — dentro allo Studio

Lo Studio ha già le quattro stanze giuste (`STUDIO_SEZIONI`): il beat, la cabina, il
banco, fuori. Quello che manca non è la stanza: è **la scelta dentro**.

**La cabina — registrare.** *Oggi:* scegli il fonico, premi, esce una traccia.
*Domani:* scegli **quale strofa** e **quale beat** (adesso `bestBar()` e
`bestBeat()` decidono loro), poi **le take** — una take costa energia, tre take
alzano la qualità ma ti spengono, e il fonico ti dice quando è buona. Un tasto per
fermarsi prima, perché sapersi accontentare è una scelta. È qui che va il video 05.

**Il banco — mixare.** *Oggi:* `unmixed().sort()[0]`, più sei fissi. *Domani:* **la
lista dei provini** e scegli quale, il fonico al banco (c'è già), e **tre manopole
con un compromesso vero**: più voce = si capiscono le barre ma il beat sparisce; più
bassi = spacca in macchina, si perde in cuffia; più aria = suona grande, suona
lontano. Il pezzo così non ha più solo una qualità: ha una qualità **e un carattere**,
e il carattere si sente nelle classifiche.

**Fuori — pubblicare.** *Oggi:* `ready().sort()[0]`, esce il migliore. *Domani:*
scegli **quale** far uscire e **quando** — uscire di venerdì non è come uscire di
martedì, e uscire due settimane dopo l'ultimo non è come uscirgli addosso — la
copertina, e la possibilità di **tenerlo nel cassetto** per un progetto più avanti.

### Le due pagine davvero nuove

**La scena del produttore** (`beat`). Oggi «tre beat sul tavolo» è una riga di testo:
è l'azione col divario più grande fra quanto è importante e quanto è niente. Dentro:
sei in casa di qualcuno, ti fa sentire tre giri — **si ascoltano davvero**,
`beatplay.js` c'è già — e su ognuno decidi: lo compri, tiri sul prezzo (e rischi di
stargli antipatico), o gli chiedi di cambiarci qualcosa e torni domani. Chi è, quanto
vi conoscete e quanto è famoso cambiano prezzo e disponibilità: sono i punti 4 e 20
di `implementazioni.md`, che aspettano solo una stanza.

**Il Live Club** (`live`). È il palco: il posto verso cui tutto il gioco dovrebbe
tendere, e oggi è un numero. Dentro: **la scaletta** (quali pezzi e in che ordine —
aprire col migliore o tenerlo per ultimo), il pubblico che si vede riempirsi o
svuotarsi, e **due o tre momenti da giocare** durante la serata, come già succede in
piazza: il tipo che parla sopra, la traccia che parte storta, quello che ti chiede il
freestyle. Il modello è `piazza.js`, che funziona già: la seconda pagina di questo
tipo costa molto meno della prima. Video 11.

### E la promo va nel telefono

La promo non merita una pagina: merita **un'app**. Il telefono c'è già
(`telefono.js`, `traphone16.js`) e LaFamegram pure. Aprire l'app, scegliere il pezzo,
scegliere il taglio del post — la clip, la provocazione, il dietro le quinte — e
vedere i numeri salire nell'app stessa è la cosa più vicina a come funziona davvero.
E risolve da solo il problema del «la faccio dieci volte»: sul telefono si **vede**
che stai postando troppo, perché lo vedi nel feed.

---

## 7. I bottoni trasparenti sopra la foto

Sulla parte specifica della domanda — «*anche trasparenti ma non per forza*».

**Li usiamo già**, e sono la cosa migliore della mappa: le dieci zone di `HUB_LUOGHI`
sono rettangoli invisibili sopra alla foto, coi cartelli disegnati dentro
all'immagine. Funziona, e va usato ancora. Ma con tre avvertimenti pagati in
anticipo, scritti in `hub.js` da chi ci ha già sbattuto:

1. **Le zone si misurano in percentuale, e la foto si stira.** Quando la finestra è
   bassa e larga la foto viene schiacciata: le percentuali restano giuste, ma un
   centimetro in verticale non vale più uno in orizzontale, e due pulsanti «lontani»
   sul file si toccano a schermo. **Si misura sempre nel browser, mai sul file.**
2. **Tutte della stessa misura.** Prima ogni zona aveva la sua e la Fabbrica prendeva
   quasi il quadruplo dello Studio: mezzo quartiere si accendeva per un edificio.
   Adesso sono tutte `10.50 × 12.50`: si sposta `x`/`y`, non si allarga.
3. **Un bottone invisibile deve dire che c'è.** Se non si illumina passandoci sopra e
   non ha un nome, sul telefono — dove il passaggio del dito non esiste — diventa una
   caccia al tesoro. E i bersagli restano a 44 punti (`css/tocco.css`).

**Quando sì e quando no.** Trasparente sopra la foto va bene per **andare in un
posto**: è una porta, e le porte stanno dove sono nel mondo. Per **fare una cosa** —
mixa, pubblica, compra — ci vuole un bottone che si vede, perché una scelta che costa
energia e soldi non si nasconde dentro a un'immagine.

---

## 8. L'ordine in cui le farei

1. **Il telaio** (§5). Non si vede, dimezza tutto il resto, e chiude una classe di
   bug che è già costata tre volte.
2. **Il banco e Fuori.** Le stanze ci sono: si tratta di togliere due `sort()[0]` e
   restituire la scelta. È il rapporto migliore fra fatica e gioco guadagnato.
3. **La cabina con le take.** Stessa stanza, un pezzo di gioco in più, e il video 05
   trova la sua porta.
4. **Il Live Club.** La prima pagina davvero nuova. Il modello è la piazza.
5. **La scena del produttore.** La più bella e la più cara: apre i punti 4 e 20.
6. **La promo nel telefono.** Quando il telefono nuovo è dentro (punto 3).

Ogni gradino sta in piedi da solo: se ci si ferma al 3, il gioco è comunque migliore
di adesso e niente resta a metà.

---

## 9. Cosa lascerei com'è, e perché è una scelta

Il turno di lavoro, staccare la spina, la palestra, il cardio, i due colloqui, le
mosse veloci di scrivi e freestyle.

Non perché non meritino attenzione: **perché un gioco in cui tutto pesa uguale non ha
ritmo.** Il turno in fabbrica deve essere un clic proprio perché il concerto è una
pagina. Se anche il turno diventa una scena da trenta secondi, il concerto smette di
sembrare un evento e diventa un'altra cosa da sbrigare.

La scena con l'illustrazione grande, che c'è già, per quelle mosse è il gradino
giusto: si vede che è successo qualcosa, e in due secondi sei di nuovo sulla mappa.
