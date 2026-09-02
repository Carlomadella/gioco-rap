# La musica, la scrittura e i suoni

Il mestiere vero: scrivere barre, cercare beat, registrare, il freestyle,
e come suona tutto quanto.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 2 · Ascoltare un beat prima di comprarlo

2. nei beat in vendita ci deve essere l'opzione di ascoltare il beat, poterlo comprare

**Risulta già fatto.** Ogni beat in «Beat in vendita» (catalogo → materiale) ha tre
comandi affiancati: ✕ (scarta), ▶ (ascolta) e il prezzo (compra). L'ascolto
(`beatSuona()`, `frontend/js/game/beatplay.js`) non è un campione registrato: è un
motore che sintetizza al volo quattro battute vere del beat — cassa, rullante,
charleston, basso ed eventuale melodia — usando il genere e il seme del beat, così
quello che senti prima di comprare è la stessa qualità che poi finisce nel pezzo.
Provato in Chrome (01/09/2026): generati tre beat, aperta la vetrina, `▶` avvia
davvero l'`AudioContext` e schedula 148 eventi sonori per un beat trap a 148 bpm; ri-
cliccando sopra si ferma, come dice il codice.

---

## 6 · L'autocompletamento della canzone

6. Nella sezione scrivi barre -> Giocala tu, fai in modo che ci sia l'autocompletamento della canzone ( intanto per principianti), se io scrivo 5 o 6 barre e clicca su completa canzone mi deve uscire la canzone intera e io posso revisionarla e cambiarla a mio piacimento o tenerla così com'è. Mentre se clicco su falla veloce la crei direttamente tu ma devi mostrami cosa hai scritto, e l'utente può modificarla a suo piacimento oppure tenerla così com'è

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `a02c9ad` del 30/08/2026 — «feat: autocompletamento della strofa nel foglio (punto 6)».

---


## 8 · La scena del produttore quando cerchi un beat

8. Quando clicchi su "cerca un beat", parte una scena del personaggio dell'utente (stile preso dall'avatar) che incontra un produttore, l'utente può decidere che genere scegliere tra quelli impostati, specializzato in quel genere. Se il produttore collabora spesso con uno degli opps, non ti fa il beat.

---

## 13 · Suoni e beat più vari

13. cambia i suoni di gioco e varia i beat, te l'ho già detto una volta, non farmi incazzare.

> **Risulta chiuso in un commit**, ma qui non era mai stato scritto: `7c3f9ec` del 30/08/2026 — «feat: menu impostazioni e banco suoni nuovo (punti 23, 13, meta del 15)».

---


## 14 · Il freestyle in piazza, con la folla

14. Nell'azione "Freestyle in piazza", come per "cerca un beat", crea una scena del personaggio dell'utente che canta barre, o prese dalle canzoni scritte o inventate e la folla applaude e urla o fischia in base alla qualità della barra detta. Inoltre fai in modo che si possa fare gara di freestyle, contro il computer o contro un amico.

---

## 19 · «Completa la canzone» deve costare qualcosa

19. il tasto completa la canzone ti dà svantaggi

---

## 25 · Il banco dei suoni rifatto

25. ~~Suoni di gioco nuovi e beat più vari~~ **FATTO in parte (30/08/2026)** — i suoni.
    Rifatto il banco audio: compressore e riverbero corto su tutto, niente più onde quadre.
    Click dei pulsanti d'aria (uno solo per tutta l'app, più pieno sui bottoni grossi), penna sul foglio,
    celesta per i soldi, tonfo di sala per il rec, fader per il mix, accordo caldo per l'uscita,
    folla che respira, traguardo lungo, metronomo e giudizio della piazza rifatti.
    In impostazioni → Audio: carattere dei suoni (morbido / retrò), interruttore per i click, otto bottoni di prova.
    Resta da fare la seconda metà del punto: variare di più i beat.

---

## 44 · La soundboard è ancora poca

44. La suondboard del gioco è davvero ancora poco 

   **FATTO in parte (01/09/2026)** — tre suoni nuovi in `frontend/js/game/fx.js`
   (`SUONI`, sia morbido che retrò): **promo** (un ting che sale, non più il
   click generico di tutti i bottoni), **palestra** (un tonfo di peso e un
   fiato, non il tap di tutti gli altri — prima non aveva nessun suono suo),
   **giorno** (più leggero della settimana, per «Fine giornata» quando la
   settimana non si chiude — la settimana vera resta il suono grosso).
   `skip.js` adesso sceglie fra i due giusti a seconda che il salto abbia
   chiuso una settimana o no.
   **In parte** perché il punto vero, quello lasciato aperto anche dal
   punto 25 («resta da fare... variare di più i beat»), è che i dodici
   generi di `beats.js` suonano diversi per **giro e scala** ma usano tutti
   lo **stesso timbro** — la stessa cassa, lo stesso rullante, lo stesso
   basso a dente di sega (`beatplay.js`). Dare a ogni genere il suo
   strumento vero (un 808 per la trap, una cassa più secca per il boom
   bap, un pad per la cloud) è un lavoro sul motore di sintesi che **non
   ho toccato**: qui non ho un modo per ascoltare quello che scrivo, e
   dato che è già tarato e funzionante, cambiarlo alla cieca rischiava di
   romperlo invece di migliorarlo. I tre suoni nuovi sopra, invece, sono
   costruiti con gli stessi mattoncini (`nota`, `fruscio`) di quelli già
   in gioco, a basso rischio. `npm run prova` (12/12) e `npm run build`
   puliti; **da provare con l'audio acceso**, qui non l'ho potuto sentire.

---

## 46 · Le abilità sono troppe: i mix li fanno i fonici

46. Le abilità sono troppe e da rivedere, NON DOBBIAMO FARE NOI I MIX MA I FONICI, quindi a cosa serve la skill mixing? come quella beatmaking.

   **FATTO (01/09/2026).** Hai ragione: non erano abilità tue, erano
   l'attrezzatura travestita da barra. Tolte «Produzione» e «Mixing» dalla
   scheda Abilità (`frontend/js/game/hub.js`, `skillRighe()` e
   `vistaAbilita()`) — restano le quattro vere: Rap, Scrittura, Carisma,
   Networking. Le formule sotto (`gearBonus()`, `mixGain()`) restano intatte:
   contano ancora nella qualità del pezzo quando registri o mixi, sono solo
   sparite come «barra personale» — quel mestiere lì è del beatmaker e del
   fonico alla Sala, non tuo. `npm run prova` (12/12) e `npm run build`
   puliti.

---

---

## 20 e 22 · «Fatti sentire un beat» non faceva niente, e i beat non si vedevano

20. se clicco sull'opzione di conversazione "fatti sentire un beat" non fa niente

22. non si riescono a vedere i beat

    **FATTO (02/09/2026)** — branch `task/20-22-beat-si-vedono`. Sono lo stesso problema visto da
    due lati, e la causa era una sola.

    **La causa.** Il tasto funzionava eccome: creava il beat, lo metteva nel mercato, scriveva nel
    diario e faceva partire la conferma a schermo. Solo che la conferma — il `.toast` di
    `css/effects.css` — stava a `z-index: 70`, e La Sala sta a `93`. La Strada pure, la piazza a
    `92`, il foglio di scrittura a `90`, il rapporto di fine settimana a `80`. **Ogni conferma
    partita da dentro a uno di quei posti finiva dietro al fondale e non si vedeva.** Si premeva il
    tasto e sembrava non succedesse niente. Il beat intanto era finito nel catalogo, che però è
    un'altra schermata: da La Sala non si vedeva nemmeno quello.

    Verificato nel browser vero, non a occhio: aperta la pagina in Chrome via CDP, cliccato il
    tasto e letto lo stato del DOM — `toast z=70`, `posto z=93`. Adesso il toast sta a `130`,
    sopra a tutto, e non dà fastidio a nessuno perché è `pointer-events: none`.

    **Il beat resta sul tavolo.** Sistemata la conferma restava il fatto che il beat spariva in
    un'altra schermata. Adesso il beat che il beatmaker ti fa sentire resta segnato sulla persona
    (`p.beatOff`) finché sta nel mercato, e nella sua scheda compare per davvero: copertina del suo
    genere, nome, qualità, bpm, il tasto **▶** per ascoltarlo, il prezzo per prenderlo e la **✕**
    per lasciarlo lì. Comprarlo da qui è comprarlo per davvero — esce dal mercato ed entra nella
    tua cartella — e prenderglielo gli fa piacere: un punto di rapporto.

    **E non se ne fa sentire un altro finché quello è ancora lì.** Prima si poteva premere il tasto
    all'infinito e riempire il catalogo di beat gratis. Adesso finché ce n'è uno sul tavolo il
    tasto lo dice e resta spento: ascolti, prendi o lasci, e poi se ne parla.

    File toccati: `js/game/posto.js`, `css/posto.css`, `css/effects.css`, `index.html`.

---

## 19 · La discografia

19. Aggiungere sezione "Discografia"

    **FATTO (02/09/2026)** — branch `task/19-discografia`.

    Il catalogo dice cosa hai **in cartella**: strofe scritte, beat comprati, pezzi registrati,
    attrezzatura. La discografia dice un'altra cosa: cosa è **uscito**, e come sta andando. La
    differenza che conta è il tempo. Un pezzo pubblicato non è un numero fermo: sale, tiene, poi
    scende — e finché l'unica cosa che si vedeva era «12.400 stream» quella storia non si vedeva
    per niente.

    Nuova linguetta **Discografia** nella barra della partita, fra Catalogo e Classifica. Dentro:

    - **In cima i quattro numeri che riassumono tutto**: quanti pezzi hai fuori, quanti stream in
      tutto, quanti questa settimana, e qual è il più ascoltato.
    - **Una riga per pezzo**, dal più recente: copertina, quando è uscito (anno e settimana),
      qualità, e se ci hanno girato sopra un video.
    - **La curva delle ultime settimane**, disegnata piccola accanto al titolo. È lì che si legge
      se un pezzo sta invecchiando bene o male.
    - **Come sta andando adesso, detto a parole**: sta risalendo, tiene, sta calando, sta
      sparendo, non lo ascolta più nessuno — con la variazione vera rispetto alla settimana
      prima. Il colore della riga segue quel verso.
    - **Quanto ha fatto in tutto e quanto questa settimana.**

    **Perché ci voleva una memoria.** Il gioco teneva `s.streams` (il totale) e `s.last` (l'ultima
    settimana): con due numeri non si disegna nessuna curva. Adesso `advanceWeek()` in
    `js/game/sim.js` accoda gli ascolti della settimana in `s.storia`, e tiene le ultime
    ventisei — sei mesi, più indietro non guarda nessuno. È una riga nel salvataggio, e le
    carriere già in corso partono semplicemente da zero settimane di storia: la sezione lo dice
    («prima settimana») invece di inventarsi una curva che non c'è.

    In fondo una riga che vale più di un grafico: un pezzo che scende non è un pezzo brutto, è un
    pezzo vecchio. Quello che lo rimette in piedi è quello che gli succede intorno — un video, un
    feat, un palco, un altro pezzo che tira su tutto il resto.

    **Provata nel browser vero**, con tre pezzi dalle storie diverse: la curva si disegna, le
    etichette cambiano verso, `advanceWeek()` accoda davvero e dopo trenta settimane la storia si
    ferma a ventisei come deve.

    File toccati: `js/game/ui.js`, `js/game/sim.js`, `css/game.css`, `index.html`.
