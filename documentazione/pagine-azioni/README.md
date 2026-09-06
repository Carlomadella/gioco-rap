# Una pagina per ogni azione

> «voglio creare una pagina per praticamente ogni azione, con interfaccia e bottoni
> cliccabili a schermo (anche trasparenti ma non per forza), secondo te ha senso questa
> cosa? crea un README che analizzi e progetti tutto ciò, segna anche i pro e i contro
> e come vorresti sviluppare ogni pagina.»
>
> — punto 2 di [`implementazioni.md`](../../implementazioni/implementazioni.md)

Questo è quel README. Tre parti:

- **[Parte 1 — L'analisi](#parte-1--lanalisi)**: cosa c'è già, i pro, i contro coi numeri
  veri, e il criterio per decidere quanto pesa una schermata.
- **[Parte 2 — Il telaio](#parte-2--il-telaio)**: quello che serve **prima**, e che tutte
  le pagine si dividono — il registro unico, lo scheletro comune, le regole del disegno,
  i bottoni trasparenti, i video.
- **[Parte 3 — Il progetto di ogni pagina](#parte-3--il-progetto-di-ogni-pagina)**: tutte
  e tredici le mosse e tutti i posti, uno per uno, col disegno della schermata, cosa si
  decide dentro, cosa serve e quanto costa.

In fondo c'è la **[tabella di tutto](#la-tabella-di-tutto)** e
**[l'ordine in cui le farei](#lordine-in-cui-le-farei)**.

---

# PARTE 1 — L'analisi

## La risposta in breve

**L'idea è giusta, la parola «ogni» no.** Una pagina non si dà a un'**azione**: si dà a
un **posto**, e dentro al posto si gioca una **decisione**. In Parte 3 c'è comunque il
progetto di **tutte**, anche di quelle che io lascerei più leggere: così la scelta è tua
e non mia, e se un giorno cambi idea il disegno è già pronto.

Due cose da sapere prima di cominciare, e sono le più importanti di tutto il foglio:

1. **Le pagine che già esistono sono mezze vuote.** Al banco dello Studio il pezzo da
   mixare **lo sceglie il codice**, non tu (`unmixed().sort()[0]`). Riempire quelle è più
   gioco guadagnato che aprirne di nuove.
2. **Oggi una schermata nuova va iscritta a mano in sette elenchi in sette file.** Chi ne
   dimentica uno rompe qualcosa in silenzio, ed è già successo tre volte. Quella è la
   spesa vera, non il CSS.

## Cosa c'è già

Il gioco ha **tredici mosse** (`frontend/js/game/actions.js`, `ACTIONS`) e **dieci
luoghi** sulla mappa (`frontend/js/game/hub.js`, `HUB_LUOGHI`).

Senza averlo mai chiamato così, il gioco usa già **quattro pesi** di presentazione. Sono
la scala su cui ragionare, e in Parte 3 ogni pagina dice a quale peso sta:

| peso | cos'è | quanto costa | dove si usa oggi |
| --- | --- | --- | --- |
| **1 · riga** | una riga di esito nel diario | niente | gli effetti collaterali |
| **2 · scena** | pagina piena con l'illustrazione grande e l'esito sopra, un tasto «Continua». Si guarda, non si tocca | ~20 righe: l'id dentro a `SCENA_PIENA` in `ui.js` | mixa, pubblica, promo, live, turno, stacca, pesi, cardio |
| **3 · finestra** | una domanda con due o tre risposte | ~30 righe (`showEvent`) | Casa, Palestra, Live Club, i colloqui, il titolo del pezzo |
| **4 · pagina** | una schermata sua, con dentro gente, stati e scelte. Si gioca | **350–1.400 righe di JS più il foglio di stile** | Studio, La Sala, il foglio, la piazza, Attività criminali, il carcere |

E questo è dove sta ogni mossa **oggi**:

| mossa | dove sta adesso | ha una decisione dentro? |
| --- | --- | --- |
| Scrivi barre | **pagina** — il foglio (`writer.js`), o veloce | sì: la scrivi tu, riga per riga |
| Cerca un beat | riga: «tre beat sul tavolo, si comprano allo Shop» | **no** — te li dà e basta |
| Registra il pezzo | finestra (il titolo) + stanza dello Studio | in parte: scegli il fonico, non la take |
| Mixa il pezzo | scena + stanza dello Studio | **no** — `unmixed().sort()[0]` |
| Pubblica il pezzo | scena + stanza dello Studio | **no** — `ready().sort()[0]` |
| Promo sui social | scena + un tasto in «Fuori» | **no** — un numero |
| Freestyle in piazza | **pagina** — la piazza (`piazza.js`), o veloce | sì: vai a tempo e rispondi |
| Serata open mic | scena, dal Live Club | **no** — un numero |
| Vai al turno | scena | **no** |
| Cerca lavoro | finestra (due colloqui) | sì |
| Stacca la spina | scena, da Casa | no |
| Pesi / Cardio | scena, dalla Palestra | la scelta è prima, nel cartello |

Vale la pena fermarsi sulla colonna di destra: **le due mosse che hanno già una pagina
sono le due che hanno una scelta dentro.** Non è un caso ed è successo da solo.

## I pro

**È la regola scritta della ROADMAP, non un'idea nuova.** Lì c'è già: «*Tutto dev'essere
interattivo — nessuna riga da database, solo scene e card da gioco*» e «*Si sblocca un
mondo, non un menu*». Una mossa che finisce in un numero tradisce tutt'e due.

**Il gioco diventa un mestiere invece che un foglio di calcolo.** «Mixa → +6 qualità» è
una formula. «Scegli quale pezzo, chiami Sara al banco, decidi se spingere la voce o
lasciare aria» è un mestiere.

**Dà una stanza alle idee che sono ferme.** Metà dei punti aperti in `implementazioni/`
sono fermi perché non hanno un posto in cui stare: le take in cabina, il rapporto col
fonico che si vede mentre lavora, i prezzi dei beat, le remaster. Quando la stanza c'è, si
aggiungono una alla volta.

**Le pagine che ci sono funzionano.** Studio, Sala, piazza, foglio, Strada sono la parte
del gioco che ci si ricorda. La prova che l'idea è giusta è già in casa.

**I video sono già girati.** In `frontend/media/video/Transizioni di scena/` ce ne sono
**undici**, ed è il punto 5. Notare a cosa sono intitolati: quasi tutti a un **posto**,
non a un'azione. Chi li ha pensati stava già ragionando così.

**L'audio è pronto.** `beatplay.js` suona i beat davvero — bpm, cassa e scala dal genere,
il giro preciso dal seme. «Ascolta il beat prima di comprarlo» costa quasi zero.

## I contro, coi numeri

**Una pagina costa cento volte una scena.** Aggiungere una mossa a `SCENA_PIENA` è una
riga. Le pagine vere pesano: `posto.js` 973 righe, `strada-crimine.js` 1.209 più
`strada-crimine-ui.js` 462, `studio.js` 424, `writer.js` 374, `piazza.js` 349. E i fogli
di stile: `strada-crimine-v2.css` da solo è **2.412 righe**, un terzo di tutto il CSS del
gioco. Tredici pagine così non sono tredici volte il lavoro di una: sono tredici volte
anche la **manutenzione**, per sempre.

**Ogni pagina si rompe da sola quando cambi qualcos'altro.** Non è teoria: la pagina delle
Attività criminali tagliava «Molla il giro» e metà del TRAPHONE a **tutte** le
risoluzioni, perché un ritocco ai caratteri aveva alzato i corpi e nessuno aveva
rimisurato. Sul telefono in verticale, dove il gioco deve uscire, il margine è ancora più
stretto.

**Rallenta il gioco.** Il gioco è a giornate, e in una giornata ci stanno più mosse. Le
mosse ripetibili — la promo, il turno, la palestra — sono ripetibili **apposta**: una
pagina addosso a una cosa che fai dieci volte diventa un pedaggio, e la prima cosa che il
giocatore cerca è come saltarla.

**Le pagine finte sono peggio del niente.** Una schermata che si apre, dice un numero e si
chiude ha tutti i costi di una pagina e nessuno dei vantaggi.

**Se tutto pesa uguale, niente pesa.** Il turno in fabbrica deve essere veloce **perché**
il concerto è una pagina. È la stessa ragione per cui in un film non ci sono solo primi
piani.

## Il criterio

Una domanda sola, prima di aprire qualunque schermata:

> **Dentro c'è qualcosa da decidere che cambia come va a finire?**

- **Sì → pagina.** Scegli fra cose diverse, e la scelta si vede nel risultato.
- **No, ma c'è un bivio → finestra.**
- **No, ma vale la pena guardarla → scena.** È il peso giusto per le mosse che si ripetono.
- **No e non vale nemmeno guardarla → riga.**

E la regola che ne discende:

> **Una pagina non si apre per far vedere un esito. Si apre per restituire al giocatore
> una decisione che oggi il codice prende da solo.**

Ogni `sort()[0]` dentro a un'azione è una decisione che il gioco si è preso al posto tuo.
Quelli sono l'elenco delle pagine che si ripagano da sole.

---

# PARTE 2 — Il telaio

Tutto quello che le pagine si dividono. Farlo prima vuol dire che ogni pagina dopo costa
la metà; non farlo vuol dire rifare tredici volte gli stessi errori.

## 1. Il registro unico delle schermate

Quando si aggiunge una schermata, per funzionare davvero va **iscritta a mano in sette
elenchi, in sette file diversi**:

| dove | a cosa serve | se te ne dimentichi |
| --- | --- | --- |
| `uscita.js` → `USCITE` | ✕, ESC, clic fuori, e il rimborso dell'energia | non si chiude, o l'energia non torna |
| `uscita.js` → `scenaAperta()` | dire «il conto resta aperto» | l'azione si chiude due volte |
| `tempo-controlli.js` → `blockingOverlay()` | quali finestre fermano l'orologio | il tempo scorre mentre decidi |
| `tempo-controlli.js` → `refreshOtherViews()` | chi si ridisegna quando passa il tempo | numeri vecchi a schermo |
| `eventi-v2.js:195` | cosa chiudere prima di un evento | l'evento esce sopra la tua pagina |
| `trasferte.js:705` | cosa impedisce di partire | parti con una pagina aperta |
| `menu-sistema.js:38` | capire dove sei | il menu di sistema si comporta male |

**È già andata storta tre volte**, tutte e tre in silenzio, tutte e tre per lo stesso
motivo — la stessa lista scritta a mano in posti diversi:

1. Studio e Strada usavano tutt'e due il prefisso `st-`, e la ✕ dello Studio chiamava la
   funzione della Strada: sembrava un pulsante morto (punto 15).
2. `refreshOtherViews()` chiamava `renderNegozio()`, **che non esiste**: guardaroba e
   vetrina non si sono mai riaggiornati col tempo. Sistemato il 06/09/2026.
3. **Ancora aperta:** `eventi-v2.js:195` e `trasferte.js:705` nominano l'elemento
   `strada-crimine`, che *non esiste* — l'id vero è `strada`. Quelle due guardie saltano
   la pagina delle Attività criminali da sempre. Segnata in
   [`problemi-riscontrati.md`](../problemi-riscontrati.md).

**La cura.** Un file nuovo, `js/game/pagine.js`, dove una pagina si dichiara una volta
sola:

```js
registraPagina({
  id: "banco",          // l'id dell'elemento nella pagina
  ferma: true,          // ferma l'orologio finché è aperta
  fondale: true,        // il clic fuori chiude (false dove dentro c'è lavoro da perdere)
  scena: true,          // conta come "azione in corso": il conto resta aperto
  video: "01_studio",   // la transizione da far partire entrando, se ce n'è una
  chiudi(){ ... },      // come si chiude
  ridisegna(){ ... }    // cosa fare quando passa il tempo
});
```

Poi `uscita.js`, `tempo-controlli.js`, `eventi-v2.js`, `trasferte.js` e `menu-sistema.js`
smettono di avere il loro elenco e **chiedono al registro**. E una prova in
`audit-regressioni.js` che **fallisce se un elemento `.on` non è registrato**, così la
pagina dimenticata si scopre subito e non giocando.

**Due giorni. Non si vede. Dimezza tutto il resto.**

## 2. Lo scheletro comune di una pagina

Tutte le pagine del gioco hanno già, di fatto, la stessa forma. Scriverla una volta come
telaio (`css/pagina.css` più quattro funzioni) evita di rifarla ogni volta e —
soprattutto — di rifare ogni volta gli errori di misura:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← TORNA        NOME DEL POSTO            energia · soldi · ora      │  fascia 72px
├────────────┬─────────────────────────────────────┬───────────────────┤
│            │                                     │                   │
│  A SINISTRA│           IN MEZZO                  │   A DESTRA        │
│  chi sei   │       quello che stai facendo       │   chi c'è /       │
│  e cos'hai │       — la scelta vera —            │   cosa puoi       │
│  addosso   │                                     │   prendere        │
│            │                                     │                   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│  la riga che dice com'è andata l'ultima cosa che hai toccato          │
└──────────────────────────────────────────────────────────────────────┘
```

Le regole del telaio, tutte pagate in anticipo da guai già successi:

- **Le colonne scorrono.** Sempre, anche quando sembra che ci stia tutto: è quello che ha
  salvato le Attività criminali. Se il contenuto cresce, non sparisce.
- **Niente altezze fisse per righe di contenuto.** I `66px` della riga delle città sono
  esattamente il motivo per cui le città erano tagliate.
- **Si misura nel browser, a quattro misure**: 1280×720, 1366×768, 1440×900, 1920×1080.
  Più il telefono in verticale.
- **I bersagli a 44 punti** (`css/tocco.css`), e per allargarli si usa l'imbottitura, mai
  `min-width`, che dentro a un flex fa il contrario di quello che sembra.
- **Una via d'uscita sola e sempre nello stesso posto**: «Torna alla mappa» in basso a
  sinistra. La ✕ in alto la si è già tolta dallo Studio apposta.

## 3. I bottoni trasparenti sopra la foto

Sulla parte specifica della domanda — «*anche trasparenti ma non per forza*».

**Li usiamo già** e sono la cosa migliore della mappa: le dieci zone di `HUB_LUOGHI` sono
rettangoli invisibili sopra alla foto, coi cartelli disegnati dentro all'immagine.
Funziona, e va usato ancora. Tre avvertimenti, scritti in `hub.js` da chi ci ha già
sbattuto:

1. **Le percentuali sono giuste, la foto si stira.** Quando la finestra è bassa e larga la
   foto viene schiacciata: un centimetro in verticale non vale più uno in orizzontale, e
   due pulsanti «lontani» sul file si toccano a schermo. **Si misura nel browser.**
2. **Tutte della stessa misura.** Prima ognuna aveva la sua e la Fabbrica prendeva quasi
   il quadruplo dello Studio: mezzo quartiere si accendeva per un edificio. Adesso sono
   tutte `10.50 × 12.50`: si sposta `x`/`y`, non si allarga.
3. **Un bottone invisibile deve dire che c'è.** Se non si illumina passandoci sopra e non
   ha un nome, sul telefono — dove il passaggio del dito non esiste — è una caccia al
   tesoro.

**La regola:** trasparente sopra la foto per **andare in un posto** (è una porta, e le
porte stanno dove sono nel mondo); bottone che si vede per **fare una cosa** che costa
energia e soldi.

## 4. I video, e dove vanno

Gli undici già girati, e a quale porta attaccarli. È il punto 5, e col registro del §1
diventa un campo solo (`video:`) invece di undici innesti a mano:

| video | dove parte |
| --- | --- |
| `01_studio` | la card Studio sulla mappa |
| `02_ingresso_sala` | la card La Sala |
| `03_ritorno_casa` | la card Casa |
| `04_stacca_la_spina` | la mossa «Stacca la spina» dentro a Casa |
| `05_registra_pezzo` | la Cabina, quando parte la registrazione |
| `06_palestra_boxe` | la card Palestra |
| `07_partenza_milano` | il trasferimento di città |
| `08_ingresso_club` | il Live Club |
| `09_shop` | la card Shop |
| `10_trasferta` | le trasferte (`trasferte.js`) |
| `11_live` | l'inizio della serata al Live Club |

Regola: **il video si salta al tocco e si vede una volta sola per posto**, poi si riattiva
dalle impostazioni. Una transizione bella la seconda volta è bella; la ventesima è un
pedaggio.

---

# PARTE 3 — Il progetto di ogni pagina

Una scheda per ognuna. Ogni scheda dice: **dov'è oggi**, **il disegno**, **cosa si decide
dentro** (che è il cuore), **cosa serve**, **quanto costa** e **cosa ne penso** — perché
la decisione su cosa costruire resta tua.

---

## LO STUDIO — quattro stanze, cinque mosse

`js/game/studio.js` · `css/studio.css` · **la pagina c'è già.** Ha già le quattro stanze
giuste: **Il beat**, **La cabina**, **Il banco**, **Fuori**. Non manca la stanza: manca
**la scelta dentro**. Sono le pagine che si ripagano meglio di tutte.

### 1 · Il beat — *«Cerca un beat»*

**Oggi:** una riga di testo. «Tre beat sul tavolo, si comprano allo Shop». È la mossa col
divario più grande fra quanto è importante e quanto è niente.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← STUDIO    IL BEAT · da chi te lo fa    energia 74 · 320 € · 21:10  │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ CHI TE LI  │  ┌───────────────────────────────┐  │  QUELLO CHE       │
│ FA         │  │ ▶  «Vetro Rotto»   trap cupa  │  │  HAI IN CARTELLA  │
│            │  │ ▰▰▰▰▰▰▱▱▱▱  87 bpm  ·  q68    │  │                   │
│ ○ Gigi     │  │ 240 €                         │  │  «Neve Sporca»    │
│   amico    │  └───────────────────────────────┘  │   q54 · drill     │
│   −20%     │  ┌───────────────────────────────┐  │                   │
│            │  │ ▶  «Ore Piccole»   boom bap   │  │  «Sottopasso»     │
│ ○ Nico     │  │ ▰▰▰▰▱▱▱▱▱▱  92 bpm  ·  q51    │  │   q61 · trap      │
│   conosc.  │  │ 160 €                         │  │                   │
│            │  └───────────────────────────────┘  │                   │
│ ○ Fede     │  ┌───────────────────────────────┐  │                   │
│   partner  │  │ ▶  «Terzo Piano»   drill      │  │                   │
│   gratis   │  │ ▰▰▰▰▰▰▰▰▱▱  140 bpm ·  q79    │  │                   │
│            │  │ 620 €    « troppo caro »      │  │                   │
│            │  └───────────────────────────────┘  │                   │
│            │  [ COMPRALO ]  [ TIRA SUL PREZZO ]  │                   │
│            │  [ CHIEDIGLI DI CAMBIARLO ]         │                   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ Gigi ha alzato le spalle: «Quello lo tengo per me». Ci sei andato giù │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa si decide.** Da **chi** vai (a sinistra la gente conosciuta alla Sala, col rapporto
che avete — e il rapporto cambia prezzo e qualità); **quale** dei tre giri prendi, dopo
averlo **ascoltato davvero**; e **come** lo prendi — lo compri, **tiri sul prezzo**
(risparmi ma rischi di stargli antipatico, e il rapporto scende), o **gli chiedi di
cambiarci qualcosa** e torni domani (costa un giorno, il beat migliora).

**Cosa serve.** `beatplay.js` per l'ascolto (c'è già). `G.gente` da `posto.js` per chi te
li fa (c'è già). I prezzi realistici del punto 4 di ALE — 100–250 emergenti, 300–1000
affermati, 1000–2000 famosissimi — trovano qui la loro casa. Il carattere del produttore
(punto 20) decide come reagisce a chi tira sul prezzo.

**Costo:** ~350 righe di JS, ~150 di CSS. **Chiude i punti 4 e 20.**

**Cosa ne penso:** la più bella delle cinque e quella che sblocca più punti fermi. La farei
dopo le due sotto, che costano meno.

### 2 · La cabina — *«Registra il pezzo»*

**Oggi:** scegli il fonico, premi un tasto, ti chiede il titolo, esce una traccia. La
strofa e il beat li sceglie il codice (`bestBar()`, `bestBeat()`).

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← STUDIO   LA CABINA · dove si incide   energia 61 · 320 € · 22:40   │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ DIETRO AL  │        ┌─────────────────┐          │  CHE COSA INCIDI  │
│ VETRO      │        │   [ la cabina ] │          │                   │
│            │        │    tu al micro  │          │  STROFA           │
│ ● Sara     │        └─────────────────┘          │  ○ «Ore piccole»  │
│   amica    │                                     │    scritta da te  │
│   +6 qual. │  TAKE 1  ▰▰▰▰▰▰▱▱▱▱   q64           │  ● «Sottopasso»   │
│            │  TAKE 2  ▰▰▰▰▰▰▰▱▱▱   q71  ← buona  │    veloce         │
│ ○ da solo  │  TAKE 3  ▰▰▰▰▰▰▰▰▱▱   q74           │                   │
│            │                                     │  BEAT             │
│            │  Sara: «La seconda era quella.      │  ● «Vetro Rotto»  │
│            │  Se ne fai un'altra ti si chiude    │    trap · q68     │
│            │  la voce.»                          │  ○ «Neve Sporca»  │
│            │                                     │                   │
│            │  [ UN'ALTRA TAKE · 12 energia ]     │                   │
│            │  [ TIENI LA MIGLIORE E CHIUDI ]     │                   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ Take 3: la voce comincia a graffiare. Sara non lo dice ma si vede.    │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa si decide.** **Quale strofa** e **quale beat** (oggi decide il codice); il
**fonico**; e **quante take** — ognuna costa energia e alza un po' la qualità, ma dopo la
terza la voce si chiude e la qualità **scende**. Il fonico bravo te lo dice, quello che
non ti conosce no. Sapersi fermare è la decisione.

**Cosa serve.** Niente di nuovo: `songQ()`, `studioBonus()` e `studioAiuto()` ci sono già.
La curva delle take è una funzione di dieci righe. Qui va il **video 05**.

**Costo:** ~200 righe di JS, ~80 di CSS.

**Cosa ne penso:** il modo più economico di far sentire che in studio ci sei tu. Terza in
ordine.

### 3 · Il banco — *«Mixa il pezzo»*

**Oggi:** `unmixed().sort()[0]`, più un +6 fisso. Il pezzo lo sceglie il codice.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← STUDIO   IL BANCO · dove il provino diventa pezzo   energia 58 · … │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ AL BANCO   │  MIXI: «Sottopasso»   q71           │  DA MIXARE        │
│            │                                     │                   │
│ ● Sara     │   VOCE     ▁▂▃▅▆▇█▇▆   ●────────    │  ● «Sottopasso»   │
│   amica    │   BASSI    ▁▂▃▅▆▇█▇▆   ────●────    │    q71 · grezzo   │
│   +6 qual. │   ARIA     ▁▂▃▅▆▇█▇▆   ──●──────    │                   │
│            │                                     │  ○ «Terzo piano»  │
│ ○ da solo  │   Voce avanti: si capiscono le      │    q54 · grezzo   │
│   +2       │   barre, il beat resta indietro.    │                   │
│            │   Bassi al centro. Poca aria:       │  ○ «Neve sporca»  │
│            │   suona vicino, suona piccolo.      │    q66 · grezzo   │
│            │                                     │                   │
│            │   → q78 · carattere: SECCO          │                   │
│            │                                     │                   │
│            │   [ ASCOLTA ]   [ CHIUDI IL MIX ]   │                   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ Sara ha spinto la voce mezzo punto senza dirtelo. Sa quello che fa.   │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa si decide.** **Quale** provino mixare (a destra, la lista vera). Il **fonico**. E
**tre manopole con un compromesso vero**, non tre cursori che salgono e basta:

- **più voce** = si capiscono le barre, il beat resta indietro → aiuta i pezzi scritti bene
- **più bassi** = spacca in macchina e nei locali, si perde in cuffia → aiuta hype e live
- **più aria** = suona grande e lontano, meno immediato → aiuta le classifiche, non la strada

Il pezzo così non ha più solo una **qualità**: ha una qualità **e un carattere**, e il
carattere cambia dove quel pezzo va forte. Un fonico in confidenza corregge da solo le tue
esagerazioni; uno che ti conosce poco ti lascia sbagliare.

**Cosa serve.** `mixGain()` diventa una funzione delle tre manopole più il fonico. Il campo
`carattere` sul pezzo, letto poi da streams e classifiche. L'ascolto è `beatplay.js` con i
livelli applicati.

**Costo:** ~250 righe di JS, ~120 di CSS.

**Cosa ne penso:** **la prima che farei di tutte.** La stanza c'è, la gente c'è, e in
cambio di un pomeriggio di lavoro il mix smette di essere un numero.

### 4 · Fuori — *«Pubblica il pezzo»*

**Oggi:** `ready().sort()[0]`, esce il migliore, +6 hype.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← STUDIO   FUORI · da qui in poi corre da solo      … · gio 22:40   │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ QUANDO     │   ┌────────┐                        │  PRONTI           │
│            │   │ COPER- │  «SOTTOPASSO»          │                   │
│ ○ stanotte │   │  TINA  │  q78 · mixato · secco  │  ● «Sottopasso»   │
│   subito   │   └────────┘  [ cambia copertina ]  │    q78 · mixato   │
│            │                                     │                   │
│ ● venerdì  │   Esce venerdì alle 00:00.          │  ○ «Terzo piano»  │
│   fra 1 g  │   Sono passate 3 settimane          │    q54 · grezzo   │
│   +hype    │   dall'ultimo: la gente ha          │    −8 se esce     │
│            │   avuto tempo di aspettarti.        │      così         │
│ ○ tienilo  │                                     │                   │
│   nel      │   ~ 12.000 – 19.000 stream          │  IN CASSAFORTE    │
│   cassetto │                                     │  «Ferro vecchio»  │
│            │   [ MANDALO FUORI ]                 │   q81 · tenuto    │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ Tenuto da parte. Quando ne avrai altri tre, è un disco.               │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa si decide.** **Quale** pezzo. **Quando** — stanotte, oppure aspettare il venerdì
(più hype, ma un giorno perso), oppure **tenerlo nel cassetto** per un progetto più avanti.
La **copertina**. E il gioco ti dice quello che sa: da quanto non esci, e che differenza fa.

**Cosa serve.** Un campo `uscitaProgrammata` sul pezzo e un gancio nell'orologio — c'è già,
`game-time:advanced`, quello che usa l'agenda. La cassaforte è una lista.

**Costo:** ~200 righe di JS, ~100 di CSS. Apre la porta ad **album e progetti**.

**Cosa ne penso:** la seconda. Insieme al banco è mezza giornata di lavoro e cambia il
finale di ogni pezzo.

### 5 · La promo — *non una pagina: un'app*

**Oggi:** un tasto in «Fuori» e una scena con un numero.

La promo non merita una pagina, merita **un'app del telefono**. Il telefono c'è già
(`telefono.js`, `traphone16.js`) e LaFamegram pure (`HUB_APP`).

```
        ┌──────────────────┐
        │ ◉  LaFamegram    │   Scegli il pezzo:  «Sottopasso»
        │                  │
        │ ┌──────────────┐ │   Che post fai?
        │ │  [copertina] │ │   ○ la clip del ritornello   sicuro
        │ └──────────────┘ │   ● la provocazione          rischia
        │  @tuonome        │   ○ il dietro le quinte      lento
        │  ♥ 1.204   ↻ 88  │
        │                  │   Hai già postato 2 volte oggi:
        │ ┌──────────────┐ │   la gente comincia a scorrere oltre.
        │ │  [ POSTA ]   │ │
        │ └──────────────┘ │   [ POSTA ]
        └──────────────────┘
```

**Cosa si decide.** Quale pezzo spingere e **con che taglio**: la clip fa numeri sicuri e
piccoli; la provocazione può far esplodere o farti odiare (e può creare una rivalità vera,
`rivals.js` c'è); il dietro le quinte non fa numeri subito ma affeziona.

**Perché nel telefono e non in una pagina.** Perché è dove si fa davvero, e perché risolve
da solo il problema del «la faccio dieci volte»: nel feed **vedi** che stai postando
troppo. Un contatore non lo spiega, il feed sì.

**Costo:** ~250 righe dentro all'app che esiste. Da fare **dopo** il telefono nuovo
(punto 3).

---

## LA CASA — due mosse

`hub.js`, card `vita`. Oggi è una finestra con due risposte. **Video 03.**

### 6 · Scrivi barre — *il foglio*

**Oggi: già una pagina** (`writer.js`, 374 righe), con la stanza disegnata, il tema, le
rime e la scelta «veloce o la scrivi tu ×1,5». **Funziona: non la toccherei.**

Le uniche due cose che ci aggiungerei, se un giorno si torna qui:

- **Il tema lo scegli tu** invece di riceverlo: scrivere di quello che ti è appena successo
  (un colpo andato male, una rivalità) dovrebbe valere di più.
- **La stanza cambia con la casa**: il colore del muro cambia già con `G.life.casa` — ci
  starebbero la finestra, il rumore fuori, chi c'è di là.

**Costo:** ~80 righe. **Cosa ne penso:** rimandabile, sta bene com'è.

### 7 · Stacca la spina

**Oggi:** una scena con l'illustrazione e l'esito. **Video 04 già girato.**

**Se la si vuole fare pagina**, questo è il disegno onesto: una scena senza scelte, che si
guarda. Cioè **quello che c'è già**, col video davanti.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    [ il video 04, o l'illustrazione ]                │
│                                                                      │
│                        STACCA LA SPINA                               │
│              Dormi, mangi, vedi gente normale.                       │
│                                                                      │
│              Benessere +12. Rete +0,4: hai rivisto                   │
│              gente che non c'entra niente con la musica.             │
│                                                                      │
│                          [ CONTINUA ]                                │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa ne penso:** **la lascerei scena.** Dentro non c'è niente da decidere — è una pausa,
e una pausa che chiede tre clic non è più una pausa. Attaccarle il video 04 costa dieci
minuti ed è tutto il guadagno che c'è da fare qui.

---

## LA PIAZZA — una mossa

### 8 · Freestyle in piazza

**Oggi: già una pagina** (`piazza.js`, 349 righe): fondale animato, la folla che cresce o
se ne va, sei situazioni con tre risposte pesate, il conto alla rovescia.

**È il modello a cui guardare per tutte le altre**, ed è la ragione per cui il Live Club
costerà meno di quanto sembra: metà del meccanismo è già scritto qui.

Cosa ci aggiungerei, e solo dopo il Live Club:

- **Chi c'è cambia la piazza**: se in giro c'è un tuo rivale (`rivals.js`) la situazione
  diventa una sfida vera, non un passante generico.
- **L'ora conta**: alle 18:00 c'è la gente della spesa, alle 23:00 quella dei bar. L'ora il
  gioco ce l'ha già (`orari.js`).

**Costo:** ~120 righe. **Cosa ne penso:** rimandabile, funziona.

---

## IL LIVE CLUB — una mossa

`hub.js`, card `concerti`. Oggi: una finestra che chiede «palco o piazza?», e se scegli il
palco è **una scena con un numero**. **Video 08 e 11 già girati.**

### 9 · Serata open mic — *la pagina nuova che vale di più*

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← MAPPA       LIVE CLUB · giovedì, 22:00       energia 66 · 320 €   │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ LA         │      ░░░░▓▓▓▓████▓▓▓▓░░░░           │  STASERA          │
│ SCALETTA   │     ░░▓▓████████████▓▓░░            │                   │
│            │      [ il locale, la gente ]        │  40 posti         │
│ 1 «Sotto-  │                                     │  28 dentro        │
│    passo»  │  ┌──────────────────────────────┐   │                   │
│    q78     │  │ Al terzo pezzo uno in fondo  │   │  Chi c'è:         │
│            │  │ comincia a parlare sopra.    │   │  · Gigi (Sala)    │
│ 2 «Terzo   │  └──────────────────────────────┘   │  · un giornalista │
│    piano»  │                                     │  · Marra? no.     │
│    q54     │  ○ «Se hai da dire sali qui»        │                   │
│            │  ● «Vado avanti, tanto perdi tu»    │  INCASSO          │
│ 3 «Neve    │  ○ Ti fermi e aspetti che smetta    │  ~ 40 €           │
│    sporca» │                                     │                   │
│    q66     │  La gente: ▰▰▰▰▰▰▰▱▱▱  28 → 31      │                   │
│            │                                     │                   │
│ [ CAMBIA   │  [ VAI AVANTI ]                     │                   │
│   ORDINE ] │                                     │                   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ Quello in fondo si è zittito. Due si sono avvicinati al palco.        │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa si decide.** **La scaletta**: quali pezzi e in che ordine — aprire col migliore
riempie subito ma lascia la coda vuota, tenerlo per ultimo rischia che la gente se ne vada
prima. E **due o tre momenti da giocare** durante la serata, con lo stesso meccanismo della
piazza: quello che parla sopra, la traccia che parte storta, quello che ti chiede il
freestyle, il giornalista in fondo che prende appunti.

**Cosa cambia il risultato:** i pezzi che hai — qualità **e carattere** dal banco, perché
un pezzo coi bassi spinti spacca dal vivo — la presenza, l'hype, e chi c'è in sala. E chi
c'è in sala dipende da chi hai conosciuto alla Sala: il cerchio si chiude.

**Cosa serve.** `piazza.js` come modello (metà del lavoro è già lì). `G.songs` per la
scaletta. `G.gente` per chi c'è. **Video 08** entrando, **video 11** quando parte.

**Costo:** ~450 righe di JS, ~200 di CSS — la più cara di tutte, ma è il posto verso cui
tutto il gioco tende.

**Cosa ne penso:** **la prima pagina davvero nuova da fare.** Oggi il momento più
importante della carriera di un rapper, nel gioco, è un numero.

---

## LA PALESTRA — due mosse

`hub.js`, card `palestra`. Oggi: una finestra con due risposte, poi una scena. **Video 06
già girato.**

### 10 · Pesi   ·   11 · Cardio leggero

**Se le si vuole fare pagina**, il disegno onesto è questo:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    [ il video 06, o l'illustrazione ]                │
│                                                                      │
│                              PESI                                    │
│              Ferro pesante, poche ripetizioni.                       │
│                                                                      │
│              Benessere +14 · presenza +0,7 · −18 €                   │
│              Terza settimana di fila: il fisico si vede.             │
│              In sala pesi c'era gente del giro. Rete +0,8.           │
│                                                                      │
│                          [ CONTINUA ]                                │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa ne penso:** **le lascerei scena.** La decisione c'è già ed è **prima**, nel
cartello: pesi o cardio. Dentro non resta niente da scegliere, e la palestra si ripete ogni
settimana: è esattamente il caso in cui una pagina diventa un pedaggio. Il guadagno vero
qui è il **video 06** davanti alla scena e la **striscia delle settimane di fila**
(`palestraMoltiplicatore()` esiste già ma non si vede): dieci minuti, non una pagina.

---

## IL LAVORO — due mosse, tre posti

`hub.js`, card `pizzeria` (lavapiatti), `fabbrica` (operaio), `impiego` (tutti i lavori).

### 12 · Vai al turno

**Oggi:** una scena con l'illustrazione e i soldi.

**Se lo si vuole fare pagina:** un turno con dei minigiochi dentro. Piatti da lavare,
bancali da spostare.

**Cosa ne penso: no, ed è la raccomandazione più netta del foglio.** Il turno è la parte
noiosa **apposta**: è quello che fai quando la musica non paga ancora, ed è il metro con
cui misuri quanto vuoi smettere di farlo. Se diventa divertente, il gioco perde il suo
motore. Se diventa lungo, diventa una tassa. **Deve restare un clic.**

L'unica cosa che ci metterei — e non è una pagina — è **una riga che cambia col numero di
turni**: al decimo turno da lavapiatti il proprietario può chiederti se vuoi più ore. Venti
righe dentro a `JOBS[].extra()`, che esiste già.

### 13 · Cerca lavoro

**Oggi:** una finestra con **due offerte** pescate a caso (`offerJobs()`). Una decisione
c'è già.

**Se la si vuole fare pagina — il Centro per l'impiego:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← MAPPA       CENTRO PER L'IMPIEGO · lun 10:00       energia 88 · …  │
├──────────────────────────────────────────────────────────────────────┤
│  BACHECA                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐              │
│  │ LAVAPIATTI      100 €  │  │ BUTTAFUORI      210 €  │              │
│  │ 18 energia · serale    │  │ 32 energia · notturno  │              │
│  │ Turni serali, cucina   │  │ Notti in piedi sulla   │              │
│  │ bollente.              │  │ porta di un locale.    │              │
│  │ ✔ ti prendono          │  │ ✘ serve presenza 16    │              │
│  │      [ COLLOQUIO ]     │  │      (tu ne hai 11)    │              │
│  └────────────────────────┘  └────────────────────────┘              │
│  ┌────────────────────────┐  ┌────────────────────────┐              │
│  │ FONICO JUNIOR   180 €  │  │ OPERAIO         220 €  │              │
│  │ 32 energia · in studio │  │ 40 energia · full time │              │
│  │ Impari guardando.      │  │ Ti mangia il giorno.   │              │
│  │ ✘ serve flow 20        │  │ ✔ ti prendono          │              │
│  └────────────────────────┘  └────────────────────────┘              │
├──────────────────────────────────────────────────────────────────────┤
│ Il fonico junior è quello che ti servirebbe. Ti mancano 4 di flow.    │
└──────────────────────────────────────────────────────────────────────┘
```

**Cosa si decide.** Oggi il gioco te ne pesca **due a caso** fra quelli che puoi fare. Una
bacheca li mostra **tutti e otto** e, soprattutto, mostra **quelli che non puoi ancora fare
e cosa ti manca**: il fonico junior a flow 20 diventa un obiettivo invece di una sorpresa.
È la stessa cosa che fa la mappa coi luoghi chiusi, ed è una regola della ROADMAP.

**Costo:** ~150 righe di JS, ~80 di CSS. Il posto sulla mappa c'è già.

**Cosa ne penso:** **piccola e utile.** Non è una pagina «giocabile», è una bacheca che
mostra la strada. La farei con calma, dopo lo Studio.

---

## GLI ALTRI POSTI — pagine che ci sono già

Non sono mosse di `ACTIONS`, ma sono le altre schermate del gioco, e il progetto sarebbe
incompleto senza.

**LA SALA** (`posto.js`, 973 righe) — **c'è già, ed è la pagina più ricca del gioco**: le
persone, i caratteri, i gradini di confidenza, le rivalità che nascono. **Video 02.** Quello
che manca è a valle, non qui: chi conosci alla Sala deve **servire** nello Studio (il beat,
il fonico: c'è già) e al Live Club (chi viene a vederti: da fare).

**LE ATTIVITÀ CRIMINALI** (`strada-crimine.js`, 1.209 + 462 righe) — **c'è già.** Appena
sistemata perché tagliava i contenuti. Restano il bilanciamento (la reputazione sale di
quasi 4 a colpo contro i 2 di progetto) e le trenta immagini di fondo che arrivano ancora
da un CDN.

**LO SHOP** (`negozio.js`, dentro a `apriPannello`) — **c'è già**, ma come **pannello**,
cioè una lista: attrezzatura, beat, vestiti. **Video 09.** È l'unico posto dove una lista è
ancora la cosa giusta, perché comprare è confrontare e per confrontare serve una lista. Le
due cose che ci metterei: **provarsi i vestiti addosso** (il ritratto c'è,
`ARTIST_PORTRAIT()`) e **sentire i beat prima di comprarli** — di nuovo `beatplay.js`. Poi
c'è il punto 2 di ALE: lo shop aperto già in provincia, con meno roba.

**IL CARCERE** (dentro a `strada-crimine-ui.js`) — **c'è già**, ed è l'esempio giusto di
una pagina che non deve essere divertente: dentro non c'è niente da fare, e quello è il
punto.

---

## La tabella di tutto

| # | mossa / posto | oggi | come la svilupperei | costo | quando |
| --- | --- | --- | --- | --- | --- |
| 1 | Cerca un beat | riga | **pagina** — la stanza del beat: si ascolta e si tratta | ~500 righe | 5° |
| 2 | Registra il pezzo | finestra | **stanza piena** — le take, il fonico, video 05 | ~280 righe | 3° |
| 3 | Mixa il pezzo | scena | **stanza piena** — quale pezzo, tre manopole, il carattere | ~370 righe | **1°** |
| 4 | Pubblica il pezzo | scena | **stanza piena** — quale, quando, copertina, cassetto | ~300 righe | **2°** |
| 5 | Promo sui social | scena | **app del telefono** — il taglio del post, e il feed che ti frena | ~250 righe | 6° |
| 6 | Scrivi barre | **pagina** | resta com'è (+ tema a scelta, un giorno) | ~80 righe | dopo |
| 7 | Freestyle in piazza | **pagina** | resta com'è (+ i rivali, l'ora) | ~120 righe | dopo |
| 8 | Serata open mic | scena | **pagina nuova** — scaletta, folla, momenti giocati | ~650 righe | **4°** |
| 9 | Vai al turno | scena | **resta scena** — deve restare un clic | ~20 righe | quando capita |
| 10 | Cerca lavoro | finestra | **bacheca** — tutti e otto, e cosa ti manca | ~230 righe | dopo lo Studio |
| 11 | Stacca la spina | scena | **resta scena** + video 04 | 10 min | subito, gratis |
| 12 | Pesi | scena | **resta scena** + video 06 + la striscia | 10 min | subito, gratis |
| 13 | Cardio leggero | scena | **resta scena** + video 06 | 10 min | subito, gratis |
| — | La Sala | **pagina** | c'è già · + video 02 | — | — |
| — | Attività criminali | **pagina** | c'è già · bilanciamento e foto locali | — | — |
| — | Lo Shop | pannello | resta lista · + provarsi addosso, + sentire i beat | ~200 righe | dopo |
| — | Il carcere | **pagina** | c'è già | — | — |
| — | *il telaio* | — | **il registro unico + lo scheletro comune** | ~2 giorni | **prima di tutto** |

## L'ordine in cui le farei

0. **Il telaio** — il registro unico delle schermate (Parte 2 §1) e lo scheletro comune.
   Non si vede, chiude una classe di bug che è già costata tre volte, e dimezza il costo di
   tutto quello che viene dopo.
1. **I dieci minuti gratis** — i video 03/04/06 attaccati alle scene che ci sono già, e la
   striscia della palestra. Zero rischio, si vede subito.
2. **Il banco e Fuori** — togliere due `sort()[0]` e restituire la scelta. Il rapporto
   migliore fra fatica e gioco guadagnato di tutto il foglio.
3. **La cabina con le take** — stessa stanza, e il video 05 trova la sua porta.
4. **Il Live Club** — la prima pagina davvero nuova. Il modello è la piazza.
5. **La stanza del beat** — la più bella e la più cara. Chiude i punti 4 e 20.
6. **La promo nel telefono** — quando il telefono nuovo è dentro (punto 3).
7. **La bacheca del lavoro, lo Shop, i ritocchi al foglio e alla piazza.**

Ogni gradino sta in piedi da solo: se ci si ferma al 3, il gioco è comunque migliore di
adesso e niente resta a metà.

---

## Cosa lascerei com'è, e perché è una scelta

Il turno di lavoro, staccare la spina, la palestra, il cardio.

Non perché non meritino attenzione, ma **perché un gioco in cui tutto pesa uguale non ha
ritmo.** Il turno in fabbrica deve essere un clic proprio perché il concerto è una pagina.
Se anche il turno diventa una scena da trenta secondi, il concerto smette di sembrare un
evento e diventa un'altra cosa da sbrigare.

La scena con l'illustrazione grande, che c'è già, per quelle mosse è il peso giusto: si
vede che è successo qualcosa, e in due secondi sei di nuovo sulla mappa. Con un video
davanti, lo è ancora di più.
