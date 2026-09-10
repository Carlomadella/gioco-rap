Una cosa che ho notato ma non ho toccato, perché è una scelta tua e non un bug:
js/game/crime-caption.js contiene 118 citazioni testuali di brani rap con autore e titolo. Se il gioco esce su Steam e sugli store, quelle sono liriche protette da copyright e vanno valutate prima della pubblicazione.

**RISOLTO (05/09/2026)** — branch `task/problemi-riscontrati`. Le 118 citazioni
sono uscite tutte: una frase di una canzone non diventa libera perché è corta e
perché citi chi l'ha scritta, e quella era la strada più corta per una
segnalazione a Steam e per doverle togliere di corsa il giorno dell'uscita. Al
loro posto ci sono **64 modi di dire nostri**, scritti per la provincia di Anni
di Fame. La firma sotto non è più un artista con un disco: è il posto da cui la
frase arriva — il muro del sottopasso, il vecchio del bar, uno appena uscito.
Il motore è lo stesso di prima (tag, pesi, cooldown): cambiano solo le frasi e
il campo `by`/`track`, diventato `da`.

DA RIVEDERE

fix: togliere che quando sei in carcere ti vengono fuori le notifiche di lafamegram

**RISOLTO (05/09/2026)** — branch `task/problemi-riscontrati`. Il catalogo già
sapeva di doversi fermare in carcere (`showCatalog`, `emitHook`, `tryNormal`),
ma un post poteva nascere **dalla scelta che ti ci ha portato**: l'evento si
apre da libero, la scelta ti fa arrestare, e la notifica di LaFamegram arriva
addosso a uno che sta già in cella. Peggio: quella fascia conta come finestra
aperta per `tempo-controlli.js`, quindi restava lì a bloccare i comandi del
tempo mentre scontavi la pena — e il tempo è l'unica cosa che ti fa uscire.
Adesso `adfRenderSocialBanner()` non disegna niente se sei dentro, e se la
fascia era già a schermo quando ti prendono se ne va all'apertura del carcere.
Il post **resta nel feed**: il mondo fuori continua a parlare di te, lo trovi
quando esci. È solo la notifica che non arriva, perché il telefono non ce l'hai.

---

DA RIVEDERE

fix: `renderNegozio` non è mai esistita — il guardaroba e la vetrina non si
riaggiornavano quando passa il tempo

**RISOLTO (06/09/2026)** — branch `task/fix-render-e-agenti`, recuperato da
`task/simulazione-carriera`, che era rimasto fuori da `main`. Dentro a
`refreshOtherViews()` (`frontend/js/game/tempo-controlli.js`) — la funzione che
quando il tempo avanza ridisegna le schermate aperte perché non mostrino numeri
vecchi — c'era scritto `renderNegozio()`. **Quella funzione non esiste**: si
chiamano `renderArmadio` (il guardaroba) e `renderAbbigliamento` (la vetrina
dentro allo Shop). Il `typeof` davanti teneva nascosto lo sbaglio: la chiamata
non esplodeva, semplicemente non faceva niente. Controllato nel browser —
`typeof renderNegozio` risponde `undefined` — quindi da sempre quelle due viste
non si sono mai riaggiornate col tempo. Nello stesso elenco **mancava anche lo
Studio**, che in testata dice energia, soldi e lucidità: le tre cose che il tempo
cambia. Adesso ci sono tutte e tre.

Insieme è uscita `.telslot`, che stava **dichiarata in due fogli** (`css/game.css`
e `css/telefono.css`). Nessun danno — le due righe erano identiche — ma è
esattamente la forma del guaio che qui è già costato caro una volta: due classi
con lo stesso nome in due fogli diversi si rompono in silenzio. Tolta da
`game.css`, dove il resto della vestizione dello slot non c'è.

---

DA RIVEDERE

`strada-crimine` non è l'id di niente: due guardie saltano la pagina delle
Attività criminali

**RISOLTO (07/09/2026)** — branch `task/id-strada-morto`. Venuto fuori mentre si contavano
i posti in cui va iscritta una schermata nuova (il conto sta in
[`pagine-azioni/README.md`](pagine-azioni/README.md)). Due elenchi scritti a mano
nominano l'elemento **`strada-crimine`**:

- `frontend/js/game/eventi-v2.js:195` — cosa chiudere prima di far uscire un evento
- `frontend/js/game/trasferte.js:705` — cosa impedisce di partire per un'altra città

**Quell'id non esiste in nessun file**: l'elemento vero è `id="strada"`
(`frontend/pagine/gioco.html:430`). `getElementById("strada-crimine")` risponde
`null`, quindi tutt'e due le guardie **saltano la pagina delle Attività criminali**
da sempre. Cosa vuol dire giocando: con la Strada aperta un evento può uscirti
sopra, e una trasferta può partire.

Le due righe adesso dicono `"strada"`, che è l'id vero. Non è una scelta a caso:
`strada` è già il nome che usano il registro delle uscite (`uscita.js`, la lista
`USCITE` da cui dipendono ESC e il clic fuori) e il widget del tempo
(`tempo-controlli.js`, che si aggancia a `#strada.on`). Le due guardie erano le
uniche due copie rimaste indietro.

**Cosa cambia giocando**, e va detto perché è un cambio di comportamento vero, non
solo una riga più pulita: con le Attività criminali aperte adesso un evento della
settimana **aspetta** invece di uscirti sopra, e una trasferta **non parte**. È
quello che le due guardie volevano fare dal primo giorno — semplicemente non lo
facevano. Chi giocava prima poteva vedersi arrivare un evento in mezzo a un colpo:
non succede più.

Era il **terzo** guaio della stessa famiglia: la stessa lista di schermate scritta a
mano in posti diversi, e una copia che resta indietro. Gli altri due erano la ✕
dello Studio (punto 15) e `renderNegozio` qui sopra. Il guaio è chiuso, ma **la
famiglia no**: la cura vera, invece delle pezze, resta il registro unico proposto in
[`pagine-azioni/README.md`](pagine-azioni/README.md). Finché una pagina va iscritta a
mano in sette elenchi, il quarto caso è solo questione di tempo.

Cercati tutti gli altri id morti prima di chiudere, con una passata su ogni
`getElementById` e `querySelector("#…")` del frontend confrontato con gli id
davvero dichiarati (nelle pagine e in quelli creati a runtime dal JS). Ne restano
tre, e **nessuno dei tre è un guaio**: `g-meta` (`tempo.js`) è dichiarato morto in
un commento — la riga della testata del quaderno non c'è più e la funzione esce
subito; `labCaption` (`crime-caption.js`) e `adf-build-badge` (`eventi-v2.js`) sono
agganci facoltativi a elementi che non esistono più, tutti e due dietro a un
`if(...)` che regge. Sono codice morto, non guardie che saltano: la differenza è
che questi non fanno niente, quello di sopra faceva la cosa sbagliata.

---

DA RIVEDERE

il dataset degli avatar finiva nel pacchetto per gli store: 2,8 GB che nessuno
carica

**RISOLTO (07/09/2026)** — branch `task/id-strada-morto`. Non l'ha segnalato
nessuno: è saltato fuori facendo girare `npm run verifica` su `main`, che era
**rosso** e non se n'era accorto nessuno. La prova che cadeva era «in media/ non
restano immagini che nessuna riga di codice carica», con **1.717 immagini
orfane** — tutte dentro a `frontend/media/makehuman-editor-v1`, arrivate col
commit `34aa515` («feat(makehuman): aggiunge dataset e asset validati»).

Le 1.717 immagini non sono un errore: sono il dataset da cui si pescano i pezzi
dell'avatar, e i loro nomi stanno nei cataloghi JSON del dataset, non nel codice
del gioco — quindi una prova che cerca in `js/css/html` non poteva che chiamarle
orfane tutte quante.

**Il guaio vero era l'altro, e la prova rossa lo stava indicando davvero.**
`media/` la copia intera `strumenti/build.js` dentro al pacchetto per gli store.
Quel dataset pesa **2,8 GB** — più di tutto il resto del gioco messo insieme — e
**nessuna riga di codice lo nomina**. Sarebbe finito addosso a chi installa il
gioco senza che nessuno l'avesse chiesto: esattamente la cosa che quella prova è
lì per impedire.

Cosa si è fatto. Il dataset non parte col pacchetto — lo salta `build.js`
(`FUORI_DAL_PACCHETTO`), e l'audit smette di guardarci dentro _perché_ il build lo
salta. Le due cose sono legate da una prova apposta («il dataset degli avatar
resta fuori dal pacchetto per gli store»): se un giorno qualcuno toglie il salto
dal build, l'audit se ne accorge invece di lasciar tornare 2,8 GB nel pacchetto in
silenzio. Il pacchetto per gli store è passato da **3,0 GB a 194 MB**.

Restava però una cosa fuori posto, ed era una scelta rimandata: quei 2,8 GB
stavano anche nella **storia di git**, e ogni `git clone` se li portava dietro.

---

e stavano pure nella storia di git: ogni clone si portava dietro 2,8 GB

**RISOLTO (07/09/2026)** — Mycol, history riscritta e `main` force-pushed. Il
dataset è uscito anche da lì. Nel repo restano i cataloghi JSON, il manifest e i
crediti; il dataset vero sta nella release GitHub **`makehuman-v29`**, spezzato in
35 pezzi da 64 MB, e se lo tira giù chi gli serve con:

```
cd frontend && npm run setup:makehuman
```

Lo script (`frontend/strumenti/setup-makehuman.js`) controlla lo sha256 di ogni
pezzo, poi dell'archivio ricostruito, poi di `targets.bin` estratto, e mette da
parte il vecchio `data/` prima di sostituirlo: se qualcosa non torna si ferma
senza aver toccato niente. `.gitignore` tiene fuori
`frontend/media/makehuman-editor-v1/data/`, così non ci ricasca nessuno.

**Attenzione a due cose.** La prima: su una macchina appena clonata il dataset
**non c'è**, e finché non lanci il setup l'editor degli avatar non ha da dove
pescare. La seconda: un branch nato prima della riscrittura può ancora portarsi
dentro i 2,8 GB — prima di mergiarlo o pusharlo si controlla con
`git ls-tree -r <branch> -- frontend/media/makehuman-editor-v1/data`.

---

## Giro del 08/09/2026

Giro di fine task sul lavoro degli **elementi HTML delle otto sezioni dello Studio**
(branch `task/studio-elementi-html`, commit `83ab4c5`, nel frattempo già finito in
`main` col merge `1196778`).

Prima le cose che ho fatto girare e che sono **a posto**: `npm run prova` (79 su 79),
`node strumenti/audit-regressioni.js` (280 su 280) e `npm run verifica:build` (33 su 33) passano tutti e tre. Poi ho provato a mano, fuori dal browser, le cose nuove:
i tre cursori del banco lasciati al centro valgono **esattamente zero** (il mix resta
quello di prima, 6 punti su una partita nuova) e in tutte le 125 posizioni non danno
mai più di tre punti in su o in giù; un pezzo messo in cassaforte **non esce** né da
solo né dalla plancia; un pezzo messo in coda per venerdì esce **una volta sola**, il
giorno giusto, e poi il segno della coda sparisce; comprare un beat funziona uguale
dalla Sala e dallo Studio; una partita vecchia senza le voci nuove nel salvataggio non
fa esplodere nessuna delle otto sezioni. Gli attributi `data-` nuovi dello Studio non
si pestano i piedi con nessun altro pezzo del gioco: ho guardato tutti e quindici, uno
per uno, e anche i quattro ascoltatori che stanno su tutto il documento.

Quello che non va è qui sotto.

### Il gioco si spegne appena arrivi a 1500 fan senza contratto

- **dove** — `frontend/js/game/ui.js:482`
- **cosa succede** — la riga che stima quanto rende il primo anno di contratto usa un
  numero, `my`, che in quel punto **non esiste** (esiste solo dentro a un'altra
  funzione, più in basso). Appena arrivi a 1500 fan e non hai firmato con nessuno, la
  prima offerta compare e quella riga esplode: si ferma tutto il disegno della
  plancia, non solo il riquadro dei contratti. Non c'entra con lo Studio: era identico
  su `main` da prima.
- **come si vede** — porta i fan a 1500 senza firmare un contratto e fai passare un
  giorno.
- **quanto pesa** — blocca la partita.

**RISOLTO (08/09/2026)** — sistemato mentre facevo il giro, sul branch
`task/my-non-definito` e già in `main` col merge `6ecd52f`: al posto di `my` adesso
c'è `streamSettimana()`, che il conto se lo fa da sé.

### La take che paghi in cabina può finire sul pezzo sbagliato

- **dove** — `frontend/js/game/studio-elementi.js:364` (`studioTakePresa`), e la
  targhetta che dovrebbe legarla al pezzo giusto sta a riga 279 (`studioTakeChiave`).
- **cosa succede** — ogni take si porta dietro una targhetta che dice a quale strofa e
  a quale beat appartiene, e finché stai dentro alla cabina funziona: cambi strofa e
  le take si buttano da sole. Ma **al momento di registrare quella targhetta non la
  guarda nessuno**: si prende quello che c'è e basta. Così se paghi le take con la
  strofa che hai adesso, poi vai a scriverne una migliore e registri dalla plancia
  senza ripassare dalla cabina, sul pezzo nuovo finisce la take pagata sul vecchio —
  in regalo se era buona, in faccia se era venuta male. C'è anche una seconda strada
  per lo stesso guaio: la targhetta è fatta col tema e la qualità della strofa, quindi
  **due strofe sullo stesso tema e con la stessa qualità sono la stessa cosa** per
  lei, e le take pagate su una valgono anche sull'altra.
- **come si vede** — in cabina paga due o tre take finché ne esce una buona, non
  registrare, vai nel Testo e scrivi una strofa migliore, poi registra dalla plancia:
  il pezzo esce con il punteggio della take di prima.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — la targhetta adesso la guarda anche `studioTakePresa()`, non
solo la cabina: se non combacia la take si butta e si tira il dado di sempre. Ed è
fatta con i **numeri di serie** della strofa e del beat, non col tema e il voto, così
due strofe gemelle non sono più la stessa cosa.

### I cursori del banco si spostano di una tacca sola per volta

- **dove** — `frontend/js/game/studio-elementi.js:456` (`studioBancoMuovi`) con
  `frontend/js/game/studio.js:1152`
- **cosa succede** — appena il cursore si muove di una tacca, il gioco ridisegna tutto
  il pannello di mezzo: il cursore che stavi trascinando **viene buttato via e rifatto
  da capo**, e il dito resta a trascinare una cosa che non c'è più. Per spostarlo di
  due tacche devi staccare il dito e ripartire. Con la tastiera è peggio: dopo una
  freccia il cursore perde il fuoco e le altre frecce non fanno più niente — e alla
  tastiera il gioco ci tiene, tanto che sotto c'è una riga apposta per far vedere il
  cursore a chi ci arriva col tab.
- **come si vede** — apri lo Studio, sezione del banco, e prova a trascinare «Voce» da
  un capo all'altro con un dito solo.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — muovere un cursore non ridisegna più il pannello: cambiano a
mano solo la parte piena, il nodo, la frase sotto e il riquadro del risultato, e
l'`input` che ha il dito sopra resta lo stesso. Il fuoco della tastiera resta dov'è.
Per strada è saltato fuori un secondo buco nella stessa riga: il riquadro guardava
`studioDaMixare()`, che torna `null` finché non scegli un provino a mano, quindi non
si aggiornava mai — adesso ripiega sul migliore come fa la sezione
(`studioProvino()`).

### Dopo che metti un pezzo nel cassetto, il tasto grande resta «Tienilo da parte»

- **dove** — `frontend/js/game/studio-elementi.js:564` (`studioMandaFuori`) e
  `frontend/js/game/studio.js:1013`
- **cosa succede** — la scelta del «quando» non torna su «stanotte» dopo che l'hai
  usata. Metti un pezzo in cassaforte e la schermata passa da sola al pezzo dopo, ma
  il tasto d'oro in mezzo allo schermo continua a dire «Tienilo da parte»: un secondo
  tocco nello stesso punto mette via anche quello, e poi il terzo, senza che niente
  cambi a schermo tranne il titolo. Provato: tre pezzi pronti, due tocchi sullo stesso
  tasto, due pezzi in cassaforte. Si rimedia — dalla cassaforte si ritirano — ma è la
  faccia del tasto che non dice quello che sta per fare.
- **come si vede** — sezione Fuori con due o più pezzi pronti: scegli «tienilo nel
  cassetto», premi, e premi di nuovo senza toccare altro.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — dopo il cassetto la scelta torna su «stanotte», e il tasto
d'oro torna a dire «Mandalo fuori».

### Un pezzo di una partita vecchissima, messo in cassaforte, non si ritira più

- **dove** — `frontend/js/game/studio-elementi.js:594` (`studioRiprendi`)
- **cosa succede** — la cassaforte riconosce i pezzi dal loro numero di serie. I pezzi
  registrati da quando il gioco si è diviso in `frontend/` e `backend/` ce l'hanno
  tutti; un salvataggio più vecchio di così può avere pezzi senza. Quel pezzo lo puoi
  mettere in cassaforte, si vede nell'elenco, ma il tasto «ritira» non risponde — e
  intanto è sparito da quelli che possono uscire, quindi non lo pubblichi più né dallo
  Studio né dalla plancia. Provato: il pezzo resta segnato «tenuto» anche dopo aver
  premuto. Stessa storia per «cambia copertina» sullo stesso pezzo.
- **come si vede** — solo con un salvataggio molto vecchio: pezzo in cassaforte, poi
  «ritira».
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — `studioPezzoSeme()` gliene dà uno la prima volta che serve,
come si fa da sempre con i beat e adesso anche con le strofe. Vale per «ritira» e per
«cambia copertina».

### Il tasto tondo per ascoltare è più piccolo di un dito

- **dove** — `frontend/css/studio-elementi.css:42` (e `:169` per «cambia copertina»)
- **cosa succede** — il tondo con il triangolo è 34 punti, e «cambia copertina» pure:
  la regola del progetto, quella scritta in `css/tocco.css`, dice **44** perché sotto
  quella misura il dito sbaglia bersaglio. Qui conta più del solito, perché il tondo
  sta dentro alla riga della take e la riga fa un'altra cosa: se lo manchi non è che
  non succede niente, è che **scegli quella take** invece di ascoltarla. Il commento
  nel codice dice che il bersaglio buono è la riga, ma la riga è di un altro tasto.
  `tocco.css` non lo tira su perché queste classi sono nuove e lì dentro non ci sono.
- **come si vede** — sul telefono, in cabina, prova ad ascoltare le take una dopo
  l'altra.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — il cerchio **si vede** ancora da 34 punti, come nella foto, ma
quello che si tocca è 44: un `::before` che sborda. «Cambia copertina» è passato a
`min-height:44px`.

### L'uscita di venerdì non costa niente, quella a mano sì

- **dove** — `frontend/js/game/studio-elementi.js:608` (`studioUscitePronte`) contro
  `frontend/js/game/actions.js:356` (la mossa «Pubblica il pezzo»)
- **cosa succede** — se mandi fuori un pezzo a mano spendi una mossa della giornata e
  un punto di lucidità; se lo metti in coda per venerdì esce **da solo** e non paghi
  né l'una né l'altro, più i 4 punti di hype in più. Il commento nel codice dice che
  l'hype «lo paghi aspettando», ma nel conto vero l'attesa ti fa anche risparmiare:
  così aspettare non è mai una scelta, è sempre la scelta giusta. Non è rotto, è un
  bilanciamento da guardare: o venerdì costa anche lui, o il vantaggio è doppio.
- **come si vede** — metti un pezzo in coda per venerdì e guarda la lucidità prima e
  dopo che esce.
- **quanto pesa** — da sistemare con calma.

**RISOLTO in parte (08/09/2026)** — l'uscita in coda adesso costa il punto di lucidità
come quella a mano. La **mossa della giornata** no, e quella resta com'era: il pezzo
esce di notte mentre dormi, e far pagare una mossa a chi non è sveglio non si può
scrivere in modo onesto. Quindi un piccolo vantaggio venerdì ce l'ha ancora — ma
adesso è il vantaggio di aspettare, non uno sconto.

### La stima degli stream promette più di quello che arriva

- **dove** — `frontend/js/game/studio-elementi.js:538` (`studioStreamStima`) con
  `frontend/js/game/sim.js:65`
- **cosa succede** — il «~ 1.200 – 2.900 stream» della sezione Fuori è la formula vera
  di `sim.js`, presa ai due capi dei suoi tiri di dado: fin qui giusto. Solo che il
  lunedì, prima di darti i numeri, la simulazione passa il totale sotto a un **tetto**
  che dipende dalla fase della carriera, e sopra a quel tetto tiene solo un quinto di
  quello che avanza. La stima quel tetto non lo guarda, quindi più il tuo catalogo
  tira, più il numero scritto sta sopra a quello che poi leggi davvero.
- **come si vede** — con parecchi pezzi già fuori, segnati la stima di venerdì e
  confrontala col lunedì.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — la stima applica lo stesso tetto di `advanceWeek()`, contando
anche quello che il resto del catalogo ha già occupato.

### La scheda del beat che scegli si perde se ricarichi

- **dove** — `frontend/js/game/studio-elementi.js:207` (`studioBeatSegna`)
- **cosa succede** — tutte le altre scelte dello Studio (la strofa, il beat su cui
  incidi, il tema, il quando, i cursori) vengono salvate appena le fai. La scheda del
  beat sul banco no: si ridisegna e basta. Chiudi e riapri il gioco e ti ritrovi
  segnata la prima delle tre, che non è quella che stavi per comprare.
- **come si vede** — sezione Beat, scegli la terza scheda, ricarica la pagina.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — `studioBeatSegna()` salva, come tutte le altre scelte dello
Studio.

### Chi compra un beat dallo Studio o dalla Sala non lo racconta al motore degli eventi

- **dove** — `frontend/js/game/studio-elementi.js:141` (`prendiBeatDalBanco`),
  `frontend/js/game/eventi-v2.js:2567`, `frontend/js/game/ui.js:380`
- **cosa succede** — il motore degli eventi si accorge che hai comprato un beat solo
  se lo compri **dallo Shop**: sta in ascolto su quel tasto lì e su nessun altro.
  Comprarlo dalla Sala non ha mai fatto scattare niente, e adesso che si compra anche
  dalla schermata dei beat dello Studio i posti muti sono due su tre. Non si rompe
  niente: semplicemente gli eventi che dovrebbero venirti dietro dopo un acquisto non
  arrivano. Nella stessa fila ci sono «ascolta» e «lascialo lì», che il motore ascolta
  con dei nomi che nella Sala non si usano. Non è di questa task, ma questa task la
  allarga.
- **come si vede** — si vede solo dai file: sono tre tasti che fanno la stessa cosa e
  uno solo parla col motore.
- **quanto pesa** — da sistemare con calma.

**LASCIATO (08/09/2026)** — non è di questa task e non si sistema in una riga: vuol dire
decidere che nomi deve ascoltare `eventi-v2.js` per i tre tasti, ed è una cosa che
tocca il motore degli eventi, non lo Studio. Segnato qui perché adesso i posti muti
sono due su tre invece di uno su due.

### Sul telefono i colori del «passaggio del mouse» restano accesi dopo il tocco

- **dove** — `frontend/css/studio-elementi.css:46, 65, 99, 173` (e in tutto il resto
  del gioco: **nessun** foglio di stile fa la distinzione)
- **cosa succede** — le schede dei beat, le righe delle take, il tondo di ascolto e
  «cambia copertina» si schiariscono quando ci passi sopra col mouse. Sul telefono il
  passaggio del mouse non esiste, e quello che succede è che il colore si accende al
  tocco e **ci resta**, come se quella cosa fosse ancora scelta, finché non tocchi
  altrove. Non è roba di questa task — è così in tutto il gioco, ed è già fra le cose
  lasciate indietro sulla responsività — ma qui si aggiungono altre quattro righe alla
  lista.
- **come si vede** — su un telefono vero, tocca una scheda di beat e guarda dove
  rimane il chiarore.
- **quanto pesa** — da sistemare con calma.

**LASCIATO (08/09/2026)** — è così in tutto il gioco, nessun foglio di stile fa la
distinzione, ed è già nell'elenco delle cose lasciate indietro sulla responsività.
Va fatto in un giro solo su tutti i CSS: farlo qui e basta vorrebbe dire quattro
righe diverse dalle altre trecento.

### Nota, non è un errore: in cabina il tasto d'oro è quello che spende

- **dove** — `frontend/js/game/studio.js:726`
- Nelle altre schermate dello Studio il tasto d'oro — quello grosso, uno per pagina —
  è la mossa che fa succedere la cosa. In cabina l'oro ce l'ha **«Un'altra take · 12
  energia»**, e «Tieni questa e chiudi», che è la mossa vera, è il tasto di contorno.
  Chi va di fretta preme l'oro e spende energia senza volerlo. Funziona tutto: è una
  scelta su come sono messi i tasti, non un guasto, e cambiarla o no lo decidi tu.

  **LASCIATA COM'È (08/09/2026), ma è una domanda aperta.** Nella foto di riferimento
  `registrazione_pezzo` l'oro ce l'ha «UN'ALTRA TAKE», ed è quella la foto a cui la task
  doveva arrivare uguale. La regola scritta in `css/studio.css` dice però che l'oro va alla
  mossa che fa succedere la cosa, ed è per quella regola che nella sezione Beat «Compralo»
  è d'oro e «Fattelo fare» no. Le due cose qui non vanno d'accordo: ha vinto la foto,
  perché era la richiesta. Basta dirlo e si gira.

---

## Giro del 08/09/2026 (secondo giro: responsività)

Controllato: `npm run prova` e `node strumenti/audit-regressioni.js` (294 ok, 0
falliti), le graffe di tutti e 27 i fogli di stile in `frontend/css/` (tutte in
pari), la passata degli `:hover` file per file, la riga muta dello Studio in
`tempo-controlli.js`, e i blocchi nuovi in fondo a `strada-crimine-v2.css` e
`effects.css` selettore per selettore contro il vero markup (`frontend/pagine/gioco.html`).

Il grosso è a posto: nessuna graffa storta, nessuna gabbia annidata male,
nessuna regola `:hover` rimasta fuori e nessun pezzo non-hover finito dentro
alla gabbia per sbaglio. La riga muta dello Studio pulisce bene: quando lo
Studio si apre il gioco chiude il pannello, rimette a posto i vecchi orologi
che aveva nascosto e sparisce la pastiglia; quando si chiude, torna da sola
sull'hub. Sotto ci sono cinque cose che restano.

### La passata degli hover ha saltato quello che è scritto dentro al JavaScript

- **dove** — `frontend/js/game/tempo-controlli.js:303, 347, 348`,
  `frontend/js/game/eventi-v2.js:2612, 2805`,
  `frontend/js/game/strada-crimine-ui.js:195`
- **cosa succede** — sei pezzi di grafica non stanno nei fogli di stile ma sono
  scritti dentro al codice, e la passata non li ha toccati: la pastiglia del
  tempo, i tasti «+» e «−» e i tasti del pannello del tempo, i tasti del
  calendario, i tasti dei post di LaFamegram e i tasti del carcere. Su quelli,
  sul telefono, il colore si accende al tocco e ci resta — che è esattamente la
  cosa che questo giro doveva togliere. Peggio: il controllo automatico nuovo
  guarda solo dentro a `frontend/css/`, quindi dice «tutto a posto» e continuerà
  a dirlo anche se se ne aggiungono altri lì dentro.
- **come si vede** — su un telefono vero: tocca la pastiglia dell'ora e guarda
  dove rimane il chiarore; stessa cosa sui tasti di un post di LaFamegram.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — branch `task/responsivita`. I sei pezzi adesso stanno
nella gabbia come quelli dei fogli di stile. E il controllo in
`audit-regressioni.js` non guarda più solo `frontend/css/`: legge anche i file
di codice che si portano dentro un foglio di stile, quindi da adesso se ne
sfugge uno lì dentro la prova diventa rossa. Provato togliendo apposta una
gabbia: la prova fallisce.

### Nella Strada c'è una riga nuova che non tocca niente: quei pannelli si

### chiamano in un altro modo

- **dove** — `frontend/css/strada-crimine-v2.css:2448`
- **cosa succede** — la riga dice «i pannelli non si tagliano più il contenuto»
  e li chiama `panel`. Nella pagina vera (`frontend/pagine/gioco.html:497, 520, 530`)
  quei tre pannelli si chiamano `stpan`, non `panel`: la riga non trova nessuno
  e non fa niente. Il taglio del contenuto continua ad arrivare da
  `frontend/css/strada-crimine.css:115`, che è rimasto com'era. Non è colpa di
  questo giro: lo stesso nome sbagliato era già lì tre volte da prima
  (righe 69, 307, 434 dello stesso file), adesso sono quattro.
- **come si vede** — si vede solo dai file: quel nome non esiste nella pagina.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — la riga adesso dice `stpan`, che è il nome vero, ed è
in `frontend/css/stretto.css`. Le altre tre occorrenze sbagliate erano già lì
da prima e non sono state toccate: non è roba di questo giro.

### Sul telefono la pastiglia del tempo si tiene 222 punti anche quando si è

### rimpicciolita

- **dove** — `frontend/js/game/tempo-controlli.js:290` contro `:351`
- **cosa succede** — c'è una riga che dice «sotto i 620 punti la pastiglia si
  stringe a 176», e ce n'è un'altra, scritta più precisa, che per la Strada (e
  per l'hub, il carcere, il Posto e il negozio) dice 222. Vince la più precisa,
  sempre, anche sul telefono: quindi l'orologio disegnato si rimpicciolisce
  davvero ma la casella che se lo tiene resta larga come su un monitor. Su uno
  schermo da 360 punti quella casella più la crocetta per chiudere si mangiano
  quasi tutta la seconda riga della fascia, e al titolo della schermata
  restano una sessantina di punti. Non è di questo giro — quelle righe non sono
  state toccate — ma è proprio la riga che il blocco nuovo a 620 doveva far
  entrare.
- **come si vede** — apri la Strada su uno schermo stretto e guarda quanto
  spazio vuoto c'è intorno all'orologio, e quanto ne resta al titolo.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — le due righe responsive adesso dicono
`#adf-time-dock[data-host]`: stessa precisione delle righe per singolo posto, e
vengono dopo, quindi sul telefono vince la misura stretta.

### Nella Strada stretta il menu in alto e il titolo sotto non partono

### dallo stesso punto

- **dove** — `frontend/css/strada-crimine-v2.css:2456` e `:2472`, contro
  `frontend/css/menu-sistema.css:447`
- **cosa succede** — i blocchi nuovi portano il margine sinistro della fascia
  della Strada da 30 punti a 12. Il menu in alto (quello con la corona e
  «MAPPA») però è inchiodato a 30 punti da un'altra regola, scritta con la
  parola che vince su tutto, e per la Strada non c'è nessuna eccezione per gli
  schermi stretti. Risultato: su un telefono il menu parte 18 punti più a
  destra del titolo e della riga sotto. Non rompe niente, si vede e basta.
- **come si vede** — apri la Strada su uno schermo da 360 punti e guarda il
  bordo sinistro: il menu è rientrato, quello che c'è sotto no.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — in `frontend/css/menu-sistema.css`, sotto i 620 punti
il menu della Strada rientra a 12 come la fascia, e scende a 52 di altezza.

### Nota, non è un errore: adesso sul telefono toccare un tasto non fa più

### vedere niente

- **dove** — tutto `frontend/css/`, per esempio `.stbcard` e `.sttakeriga` in
  `studio-elementi.css:71, 105`, `#strada .crime` in `strada-crimine-v2.css:119`,
  `.ptab` e `.pev` in `hub.css:545, 909`
- Chiudere gli `:hover` nella gabbia era giusto e toglie il chiarore che
  rimaneva acceso dopo il tocco. Il rovescio della medaglia è che su 138 cose
  che si accendevano col mouse, **123 non hanno nessun'altra risposta al
  tocco**: né un colore che si abbassa mentre premi, né altro. Prima almeno
  lampeggiavano storto; adesso premi e, finché la schermata non cambia, non
  succede niente a vedersi. Dove il tocco sceglie qualcosa (le schede dei beat,
  le linguette) il colore da «scelto» arriva lo stesso, quindi lì si capisce;
  dove il tocco fa partire un'azione — un colpo nella Strada, un evento
  sull'hub — no. Funziona tutto: è una scelta su quanto risponde il gioco al
  dito, e va decisa, non è un guasto. Se si vuole si mette una risposta al
  «mentre premo» in un giro solo, come è stato fatto per la gabbia.

### Nota, non è un errore: nello Studio i due blocchi per gli schermi stretti

### sono scritti in ordine inverso

- **dove** — `frontend/css/studio.css:354` e `:364`
- Il blocco «sotto i 480» sta **prima** del blocco «sotto i 520». Su un telefono
  da 360 valgono tutti e due, e a parità di regola vince quello scritto dopo —
  cioè il più largo, che è il contrario di quello che ci si aspetta. Oggi non
  fa danni perché i due blocchi non si contendono niente: uno sposta la fascia
  in alto, l'altro le linguette in basso. Ma è una trappola: chi domani
  aggiunge una riga a quello da 480 può vedersela mangiare da quello da 520
  senza capire perché. Basta scambiarli di posto, e non è urgente.

**RISOLTO (08/09/2026)** — scambiati. Adesso stanno in `frontend/css/stretto.css`,
nella sezione STUDIO, in ordine dal più largo al più stretto: 900, 620, 520, 480.

## Giro del 08/09/2026

Giro di fine task sul branch `task/beat-e-tasto-oro`, commit `7dc2d70`: il tasto d'oro
in cabina e il motore degli eventi che adesso sente i beat comprati dallo Studio.

**Quello che ho controllato e che è a posto.** I controlli automatici: l'audit delle
regressioni dà 296 a posto e 0 falliti, il build ne dà 33 a posto. Sullo scambio dei due
tasti in cabina va tutto bene: lo «spento» quando hai poca energia è rimasto attaccato a
«Un'altra take» e non a «Tieni questa e chiudi», quindi con poca energia chiudi la
registrazione lo stesso; `stSecondo()` accetta lo spento esattamente come `stPrimo()`
(`frontend/js/game/studio.js:484` e `:488`); il foglio di stile spegne tutti e due i tipi
di tasto (`frontend/css/studio.css:236`); le icone sono rimaste sul tasto giusto, la
spunta con «Tieni questa e chiudi» e il microfono con «Un'altra take». Sul motore degli
eventi: i due file che servono si caricano prima (`beatplay.js` e `studio-elementi.js`
stanno sopra a `eventi-v2.js` in `frontend/pagine/gioco.html`) e comunque il codice
controlla prima di chiamarli. La cosa che più mi preoccupava — che il conteggio «i beat
sono aumentati?» venisse fatto quando l'acquisto era già avvenuto, e quindi non partisse
mai nessun evento — **non** succede: quell'ascoltatore è agganciato in modo da passare
per primo (`frontend/js/game/eventi-v2.js:2626`, la riga si chiude con `},true)`), prima
di quello dello Studio. Quindi il conto di partenza è quello giusto e anche il nome del
beat è quello giusto. Il filtro sui beat già in cartella tiene: i beat li fa `creaBeat()`
con un numero a caso e con un nome che non ripete quelli che hai già
(`frontend/js/game/beats.js:99` e `:109`), quindi un beat della cartella non può essere
scambiato per uno ancora in vendita. `beatSeed()` chiamato dal motore non combina guai:
al massimo scrive un numero che sarebbe stato calcolato uguale un attimo dopo, e non fa
salvare niente da solo. Un click solo non fa partire due eventi: i tasti in questione non
sono uno dentro l'altro. Ho guardato tutti i punti in cui un beat finisce in cartella
(sei) e gli altri quattro non passano dal banco dei beat, quindi il loro silenzio è
coerente con la scelta già scritta nel commit. Anche il test aggiornato sui nomi rubati
tiene: gli altri tredici nomi dello Studio restano protetti come prima, e in più adesso
la prova cade anche se qualcuno smette di ascoltare i due nomi voluti.

### Se compri un'attività nella Strada, il gioco crede che tu abbia comprato un beat

- **dove** — `frontend/js/game/eventi-v2.js:2566`, contro
  `frontend/js/game/strada-crimine-ui.js:412`
- **cosa succede** — il motore degli eventi ascolta tutti i tasti che si chiamano
  `data-buy` e ogni volta racconta «hai comprato un beat». Ma con quel nome lì c'è anche
  il tasto «Rileva» delle tre attività della Strada (lavanderia, autolavaggio,
  minimarket). Così quando ti compri una lavanderia il motore registra un acquisto di
  beat, per giunta senza nome del beat, e può farti uscire l'evento del mercato dei beat
  mentre sei nel bel mezzo della Strada. È esattamente lo stesso guaio che il commento
  nello Studio racconta di aver evitato chiamando il suo tasto `data-stcompra` invece che
  `data-compra` — solo che qui nessuno se n'era accorto. Non è di questo giro: c'era già
  prima, il commit non l'ha creato. Vale la pena dirlo adesso perché la prova che
  controlla i nomi rubati (`frontend/strumenti/audit-regressioni.js:577`) guarda solo i
  nomi inventati dallo Studio, e questo le passa sotto il naso.
- **come si vede** — vai nella Strada, compra una delle tre attività, e guarda se ti
  spunta un evento sul mercato dei beat nei momenti dopo.
- **quanto pesa** — si vede ma si gira intorno.

### Due prove automatiche sono rosse, ma non per colpa di questo lavoro

- **dove** — `frontend/js/avatar/makehuman/` (per esempio `adapter.js` e `contract.js`)
- **cosa succede** — `npm run prova` chiude con «77 a posto, 2 no». Le due che non
  passano sono «nessun file sul disco è rimasto fuori dalle pagine» e «ogni file di
  codice compila», e le righe vere che stampa sono
  `js/avatar/makehuman/adapter.js — Cannot use import statement outside a module` e
  `js/avatar/makehuman/contract.js — Unexpected token 'export'`. Sono file scritti in un
  modo che il controllo non sa leggere e che nessuna pagina richiama. Ho controllato che
  su `main` sia già così: non le ha rotte questo lavoro. La segnalo lo stesso perché
  finché sono rosse, `npm run verifica` non arriva mai in fondo, e quindi la prima cosa
  che facciamo prima di chiudere una task si ferma sempre lì.
- **come si vede** — da `frontend/`, `npm run prova`.
- **quanto pesa** — da sistemare con calma.

## Giro del 10/09/2026

Giro fatto sul branch `task/beat-energia-e-barre-senza-malus`, dopo le modifiche a
`studio.js` (tolto il costo di 20 energia per farsi fare un beat su misura), `writer.js`
(tolto il calo di benessere quando chiudi una strofa) e `actions.js` (costo di «Scrivi
barre» sceso da 28 a 15 di energia).

- `npm run prova`: 89 a posto, 0 no — tutto verde.
- `node strumenti/audit-regressioni.js`: 298 a posto, 3 no. I tre falliti sono quelli già
  noti da prima (lo shop a linguette per Attrezzatura/Beat/Vestiti e i nomi dei file delle
  pagine sparsi in più punti) — li ho controllati uno per uno e non c'entrano con questo
  lavoro.
- `npm run verifica:build`: 33 a posto, 0 no — build e file unico a posto.
- Cercato in tutto `frontend/js/` un residuo di `STUDIO_BEAT_ENERGIA` o del vecchio testo
  «20 energia» nello Studio: non ne è rimasto nessuno. La card «Fattelo fare» adesso mostra
  solo prezzo e tempo, senza il pezzo di energia che c'era prima.
- Cercato in tutto `frontend/js/game/` un altro punto che levasse benessere quando si
  scrivono le barre (eventi, achievement, dialoghi): non ne ho trovato. C'è un evento di
  prova finale (`js/game/phases.js:143`, «Lo scrivi da solo, tutto») che toglie 25 di
  benessere per scrivere da soli l'ultimo disco della carriera, ma è una scena a sé, non
  legata a `chiudiStrofa()`, e non l'ha toccata questo lavoro — la segnalo solo perché
  Carletto sappia che esiste, non perché sia da correggere.
- Il costo in energia di «Scrivi barre» in `actions.js:266` è letto dalla plancia in modo
  automatico (`hub.js:509`, `const e = a.dyn ? a.dyn() : a.e`), quindi il numero mostrato
  nella card è già 15 senza bisogno di toccare altro testo.
- Il test aggiornato in `strumenti/prova.js:1057-1064` controlla adesso che l'energia non
  scenda comprando o facendosi fare un beat, coerente col codice.

Non ho trovato problemi nuovi da questa task. Tutto il resto (JavaScript che si rompe
all'avvio, collegamenti fra schermate, telefono) non è stato toccato da queste modifiche,
quindi non l'ho ricontrollato punto per punto oltre ai controlli automatici sopra.

### Nota, non è un errore: il beat «Esclusiva» comprato dall'evento resta muto

- **dove** — `frontend/js/game/events.js:10`
- Il commit spiega bene perché «Fattelo fare» non racconta niente al motore: il beat non
  viene dal banco, se lo fa il gioco. Girando fra tutti i punti in cui un beat finisce in
  cartella ne ho trovato un altro che è un po' diverso dagli altri: nel vecchio evento
  «Un beat che spacca» paghi **250 €** per un beat e resta muto anche lui. Non viene dal
  banco, quindi con la regola scritta nel commit è giusto così — ma è l'unico caso in cui
  tiri fuori dei soldi per un beat e il motore non lo sa. È una scelta da confermare, non
  un guasto: oggi non rompe niente.

---

## Giro del 10/09/2026

Giro di fine task sul branch `task/turno-fabbrica-8-ore-e-mute-musica`, due commit:
`531df10` (il turno in fabbrica durava 60 minuti fissi invece della durata vera, per
qualunque azione avviata da un luogo della mappa) e `9536374` (pulsante muta/smuta la
musica dal menu principale, `pagine/landing.html` + `js/landing.js` + `css/shell.css`).

**Controlli automatici**: `npm run prova` dà 94 a posto e 0 no (compreso il nuovo blocco
che controlla i minuti veri per turno). `npm run verifica:build` dà 33 a posto e 0 no.
`node strumenti/audit-regressioni.js` dà 298 a posto e **3 no** — ma ho controllato con
un worktree sul commit `3d32737` (l'ultimo prima di questa task) e gli stessi 3 fallivano
già lì: non li ha rotti questo lavoro, ma restano rossi adesso e li segno sotto perché non
risultavano ancora scritti in questo file.

**Sul fix del turno**: ho riletto `avviaAzioneDiretta()` (`ui.js`) e `GAME_TIME.captureAction`
(`tempo.js`), e seguito tutte le strade che ci passano — Fabbrica e Pizzeria (`assumitiCome`),
Palestra (`hub.js:146,148`), «Stacca la spina» e Live Club (`hub.js:102,107,123`), più il
centro per l'impiego. Tutte chiamano `captureAction` col vero id prima di `iniziaAzione()`, e
`DURATE_LAVORO` ha i minuti giusti per ogni lavoro (`lavapiatti:300`, `operaio:480`, eccetera).
Non ho trovato altre strade che avviano un'azione senza passare né dal click sulla tile né da
`avviaAzioneDiretta()`.

**Sul pulsante muta/smuta**: il bottone è un fratello di `.brand` dentro `.navleft`, quindi
resta visibile anche quando `body.su-menu` nasconde il marchio — coerente con «un pulsantino
in parte a sx». `SET.audio.on` arriva davvero al motore audio (`js/audio/engine.js`, `livelli()`
azzera il gain master quando è spento), quindi il tasto non è solo cosmetico. Ho anche caricato
`pagine/landing.html` con Chrome in modalità headless: la pagina arriva fino in fondo a
`js/landing.js` senza eccezioni bloccanti (il bottone compare nel DOM con `aria-pressed="false"`
di default) e nessun file JS del progetto ha errori di sintassi.

Un problema trovato, sotto. Poi tre cose vecchie (non di questa task) mai segnate qui prima.

### Il pulsante muta/smuta rischia di restare senza stile o senza funzione dopo un aggiornamento

- **dove** — `frontend/pagine/landing.html:26` (`css/shell.css?v=12`) e `:277`
  (`js/landing.js?v=2`)
- **cosa succede** — il commit `9536374` cambia sia `css/shell.css` (le regole del nuovo
  bottone tondo) sia `js/landing.js` (il click che lo fa funzionare), ma il numero dopo
  `?v=` nei due `<script>`/`<link>` di `pagine/landing.html` è rimasto lo stesso di prima.
  In questo stesso progetto, quando si tocca `js/game/ui.js` o `js/game/tempo.js` quel
  numero si alza sempre (l'altro commit di questa stessa task lo fa, `ui.js?v=19→20` e
  `tempo.js?v=11→12`): qui non è successo. Chi ha ancora in cache la vecchia copia di
  `shell.css` o di `landing.js` — il browser di chi prova il gioco, o un giorno un CDN in
  produzione — continua a vedere la pagina vecchia finché non fa un refresh forzato: il
  bottone può comparire senza stile (un cerchio senza il suo aspetto) o comparire ma non
  rispondere al click, a seconda di quale dei due file è rimasto vecchio.
- **come si vede** — si vede dai file: `git show 9536374 --stat` cambia `css/shell.css` e
  `js/landing.js`, ma `git show 9536374 -- pagine/landing.html` non tocca le righe con
  `?v=`.
- **quanto pesa** — si vede ma si gira intorno (basta un refresh forzato una volta).

**RISOLTO (10/09/2026)** — il commit `5dcdfec` ha alzato `css/shell.css?v=12→13` e
`js/landing.js?v=2→3` in `pagine/landing.html`. Lo racconta anche il giro successivo qui
sotto, che però ha trovato lo stesso guaio ripresentarsi su un terzo commit.

### Lo Shop promette tre reparti a schede, ce ne sono solo due

- **dove** — `frontend/pagine/gioco.html:281-288` e `frontend/js/game/negozio.js`
- **cosa succede** — non è di questa task: l'ho trovato perché uno dei 3 controlli
  automatici rossi lo riguarda. Le schede dello Shop sono due sole, Attrezzatura e Beat
  (`data-sh="gear"` e `data-sh="beat"` in `gioco.html`); un terzo reparto per i Vestiti,
  con la sua scheda e la sua griglia riscritta, non esiste — quello che c'è di Vestiti è
  ancora la vecchia griglia impilata (`<div class="nggrid" id="g-fit">`), non dietro a
  nessuna linguetta.
- **come si vede** — apri lo Shop dalla mappa: le linguette in alto sono solo due.
- **quanto pesa** — da sistemare con calma.

### Un file fuori da `js/pagine.js` si tiene scritto a mano il nome di una pagina

- **dove** — `frontend/js/creator/rpg-v24-bridge.js:158`
- **cosa succede** — non è di questa task. La regola del progetto è che i nomi dei tre
  file delle pagine (`landing.html`, `accesso.html`, `gioco.html`) stanno scritti in un
  posto solo, `js/pagine.js`, così il giorno che cambiano nome si riscrive un file e
  basta. `rpg-v24-bridge.js` ha una riga (`location.href="pagine/landing.html"`) che se lo
  costruisce da sé, fuori da quella regola.
- **come si vede** — si vede solo dai file: è l'unica riga fuori da `js/pagine.js` che
  nomina una delle tre pagine per intero.
- **quanto pesa** — da sistemare con calma.

---

## Giro del 10/09/2026 (controllo mirato sul commit in più, `346c955`)

Sopra ai due commit già controllati in questo stesso giro (`0f7b4a4` e `5dcdfec`) è
arrivato un terzo commit, `346c955` — dodici righe in più nel click del pulsante
muta/smuta della landing, per far ripartire davvero la musica (contesto audio e traccia)
quando prima si era fermata da sola. Ho riletto il diff, seguito a mano dove portano
`ADF_AUDIO.unlock()`, `ADF_AUDIO.music.playing` ed `ensureMenu()` (sia nella versione vera
in `js/audio/music.js`, sia in quella "a ponte" usata quando la pagina sta dentro alla
cornice del gioco), e rifatto girare `npm run prova` (94/94 a posto). Il codice aggiunto di
per sé non rompe niente e non introduce comportamenti strani nel motore audio.

Un problema trovato, legato proprio a questo commit — lo stesso già segnato e sistemato
una volta per il commit precedente, ripresentato qui. Poi una nota, non un errore.

### Il numero di cache-busting di `landing.js` non si è alzato neanche questa volta

- **dove** — `frontend/pagine/landing.html:277` (`js/landing.js?v=3`)
- **cosa succede** — il commit `346c955` cambia il contenuto di `js/landing.js` (il click
  del pulsante muta/smuta) ma il numero dopo `?v=` in `landing.html` resta `3`, lo stesso
  di prima. È lo stesso identico problema segnato in questo file per il commit precedente
  (`0f7b4a4`) e poi sistemato dal commit `5dcdfec` alzando quel numero a `v=3` — solo che
  adesso il contenuto del file è cambiato di nuovo e il numero no. Chi ha già in cache la
  vecchia copia di `landing.js` (presa dopo `5dcdfec` e prima di `346c955`) continua a
  vedere il pulsante muta/smuta col comportamento vecchio, senza la nuova correzione,
  finché non fa un refresh forzato.
- **come si vede** — si vede dai file: `git show 346c955 --stat` cambia solo
  `frontend/js/landing.js`, e `landing.html` non è nel diff.
- **quanto pesa** — si vede ma si gira intorno (basta un refresh forzato una volta).

**RISOLTO (10/09/2026)** — il commit `1d0f737` ha alzato `js/landing.js?v=3→4`. Verificato
adesso in `frontend/pagine/landing.html:277`: dice `v=4`.

### Nota, non un errore: la stessa correzione non è arrivata al pulsante gemello nelle Impostazioni

- **dove** — `frontend/js/impostazioni-ui.js:312-319` (l'interruttore `sw("audio.on")`,
  che chiama `dopoModifica()` a riga 260-265)
- **cosa succede** — non è un guasto di questo commit, è una scelta che vale la pena
  segnare: il pannello Impostazioni (raggiungibile sia da `landing.html` sia da
  `gioco.html`) ha un secondo interruttore che fa esattamente la stessa cosa del
  pulsante muta/smuta della landing — scrive su `SET.audio.on` e chiama
  `applicaImpostazioni()`. Il commit `346c955` ha aggiunto `ADF_AUDIO.unlock()` e
  `ADF_AUDIO.music.ensureMenu()` solo al pulsante della landing, non a questo secondo
  interruttore: se il sintomo descritto nel commit (si smuta ma la musica resta ferma)
  capita di nuovo, può ancora capitare passando dalle Impostazioni invece che dal
  pulsantino in alto a sinistra.
- **come si vede** — non l'ho provato dal vivo (il commit dice di non essere riuscito a
  riprodurre il sintomo neanche lui): è una lettura del codice, da tenere d'occhio.
- **quanto pesa** — da sistemare con calma.

---

## Giro del 10/09/2026 (terzo giro: verifica finale dopo il merge da main)

Giro di fine task sul branch `task/turno-fabbrica-8-ore-e-mute-musica`, dopo il merge da
`main` (arrivate nel frattempo le correzioni MakeHuman/Avaturn e il riallineamento di
Studio/Shop/navigazione — non toccate da questo giro).

**Controlli automatici, tutti verdi**: `npm run prova` dà 96 a posto e 0 no, `node
strumenti/audit-regressioni.js` dà 301 a posto e 0 no (i 3 che fallivano nel giro
precedente — Shop a linguette e nomi dei file di pagina — sono arrivati sistemati col
merge da main), `npm run verifica:build` dà 33 a posto e 0 no.

**Sul turno in fabbrica**: riletto `avviaAzioneDiretta()` in `frontend/js/game/ui.js:128`
e `GAME_TIME.captureAction()` in `frontend/js/game/tempo.js:477`. La cattura dell'id
avviene subito prima di `iniziaAzione()`, dentro alla stessa funzione sincrona `esegui()`
— anche passando dalla conferma («Confermi?» quando costa soldi) non c'è modo che un altro
clic su una tile la sporchi nel mezzo. Il controllo vero e proprio se c'è abbastanza
giornata per iniziare un turno (`actionAccess()` in `frontend/js/game/spostamenti.js:190`)
non passava mai dall'id catturato — usa sempre l'id esplicito — quindi su quel fronte non
c'era mai stato il bug: il numero sbagliato usciva solo nel conteggio del tempo "occupato"
dopo l'avvio, come dice giustamente il commit.

**Sul pulsante muta/smuta**: confermato che i due file (`css/shell.css`, `js/landing.js`)
sono richiamati con lo stesso `?v=` del loro contenuto — vedi le due righe RISOLTO qui
sopra. `ADF_AUDIO.unlock()` e `ADF_AUDIO.music.ensureMenu()` esistono davvero con quei nomi
sia nel motore vero (`js/audio/music.js:217,71`) sia nel ponte usato dentro alla cornice
del gioco (`js/audio/music.js:70-99`), quindi le chiamate del fix non puntano a funzioni
inventate.

Due problemi trovati, nessuno dei due blocca la partita.

### L'icona del pulsante muta/smuta non si aggiorna se spegni l'audio dalle Impostazioni

- **dove** — `frontend/js/impostazioni-ui.js:260-265` (`dopoModifica()`), contro
  `frontend/js/landing.js:98-103` (`aggiornaMuteLanding()`)
- **cosa succede** — sulla landing ci sono **due** interruttori per lo stesso
  `SET.audio.on`: il pulsante tondo in alto a sinistra, e l'interruttore «Audio» dentro al
  pannello Impostazioni (si apre dal bottone `m-setts` della landing stessa). Quando tocchi
  quello delle Impostazioni, `dopoModifica()` salva, applica i volumi e richiama
  `renderMenu()` — ma non richiama `aggiornaMuteLanding()`. Il pulsante tondo in alto
  resta con l'icona di prima: se l'audio era acceso e lo spegni dalle Impostazioni, il
  pulsante in alto continua a mostrare l'altoparlante «acceso». Chi a quel punto ci clicca
  sopra pensando di spegnerlo lo **riaccende** invece, perché il pulsante parte dal suo
  stato vecchio, non da quello vero.
- **come si vede** — sulla landing apri le Impostazioni (l'ingranaggio), spegni «Audio»,
  chiudi il pannello: il pulsantino in alto a sinistra resta con l'icona dell'altoparlante
  acceso invece di quella barrata.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (10/09/2026)** — `dopoModifica()` (`frontend/js/impostazioni-ui.js:260`) adesso
richiama anche `aggiornaMuteLanding()`, se esiste, subito dopo `renderMenu()`. Il pulsante
tondo in alto si allinea da solo ogni volta che l'interruttore «Audio» delle Impostazioni
cambia, senza bisogno di ricaricare la pagina.

### Il pulsante muta/smuta è più piccolo di un dito, sul telefono

- **dove** — `frontend/css/shell.css:44` (`.brand-mute`), contro
  `frontend/css/tocco.css:40-42`
- **cosa succede** — il progetto ha una regola scritta apposta per il telefono: sotto i
  900 punti o dove si tocca con un dito, ogni bottone della barra in alto sale a 44×44,
  perché sotto quella misura il dito sbaglia bersaglio — la regola lo dice esplicitamente
  per `.brand` e per `.avatarbtn`, che stanno proprio accanto a questo nuovo pulsante.
  Il pulsante muta/smuta però è rimasto a **36×36** in `shell.css` e non è mai stato
  aggiunto all'elenco di `tocco.css`, quindi su un telefono resta piccolo mentre i suoi
  vicini nella stessa barra crescono.
- **come si vede** — apri la landing su uno schermo stretto (o con `tocco.css` attivo,
  sotto i 900 punti): il pulsante muta/smuta è visibilmente più piccolo del marchio e
  dell'avatar accanto a lui.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (10/09/2026)** — aggiunta `.brand-mute{width:44px;height:44px}` in
`frontend/css/tocco.css:43`, accanto ad `.avatarbtn`. Sotto i 900 punti o col dito cresce
alla misura giusta come i suoi vicini nella barra; l'icona SVG dentro resta 18×18 e
centrata, quindi non cambia aspetto.

---

## Giro del 10/09/2026 (quarto giro: controllo del commit `35db690`)

Giro di fine task, sempre su `task/turno-fabbrica-8-ore-e-mute-musica`, solo per
controllare che il commit `35db690` (le due correzioni annotate qui sopra) non abbia
portato dentro qualcos'altro di rotto. Non ho riaperto il resto del giro precedente, già
fatto.

**Controlli automatici, tutti verdi**: `npm run prova` 96 a posto e 0 no, `node
strumenti/audit-regressioni.js` 301 a posto e 0 no, `npm run verifica:build` 33 a posto e
0 no.

**`dopoModifica()`** (`frontend/js/impostazioni-ui.js:267`) — la chiamata a
`aggiornaMuteLanding()` è protetta da `typeof ... === "function"`, la stessa guardia già
usata due righe sopra per `renderMenu()`. Serve perché `impostazioni-ui.js` è caricato sia
in `landing.html` che in `gioco.html`, ma `aggiornaMuteLanding()` esiste solo in
`js/landing.js`, che sta solo sulla landing: dentro alla partita la funzione non c'è, e la
guardia evita che il pannello Impostazioni si rompa lì. Controllato anche `js/landing.js:98`:
`aggiornaMuteLanding()` esiste davvero con quel nome, non è un richiamo a vuoto.

**`.brand-mute{width:44px;height:44px}`** (`frontend/css/tocco.css:43`) — la regola gemella
in `frontend/css/shell.css:44` fissa il pulsante a 36×36 con `display:grid;place-items:center`,
e l'icona SVG dentro (`shell.css:52`) resta a 18×18 per conto suo: la regola nuova cambia solo
la scatola esterna, non l'icona, quindi non la deforma. `tocco.css` è caricato per ultimo sia
in `landing.html:35` che in `gioco.html:53` (dopo `shell.css`), quindi vince lui come deve
essere.

**I numeri `?v=`** — cercato `tocco.css` e `impostazioni-ui.js` in tutte le pagine del
progetto: solo `landing.html` e `gioco.html` li caricano, ed entrambe sono state alzate allo
stesso numero (`tocco.css?v=13`, `impostazioni-ui.js?v=15`). Non è rimasta nessuna pagina
indietro.

Niente di nuovo trovato: le due correzioni fanno quello che dicono e non hanno smosso altro.

---

## Giro del 10/09/2026 (quinto giro: dopo il merge da main, commit `1cccf23`)

Giro mirato su `fix/durata-azioni-e-orari-fabbrica`, appena tornato da un merge di `main`
che ha portato dentro il riallineamento di Studio/Shop (`2f05b11`) e le correzioni
MakeHuman/Avaturn (`4427e77` e dintorni). Ho guardato tre cose: se la logica nuova di
`assumitiCome()`/`schedaLavoro()` (in `hub.js`) si scontra con qualcosa toccato da quei due
branch, se `GAME_HOURS.jobStatus/jobDuration/placeJobStatus` (`orari.js`) sono coerenti con
com'è usato `orari.js` altrove, e se la doppia cattura dell'id (il wrapper di `tempo.js` +
la chiamata esplicita in `ui.js:128`) crea problemi.

**Controlli automatici, tutti verdi**: `npm run prova` 96 a posto e 0 no, `node
strumenti/audit-regressioni.js` 301 a posto e 0 no, `npm run verifica:build` 33 a posto e
0 no.

**Sul riallineamento di Studio/Shop e MakeHuman**: il commit `2f05b11` non tocca
`hub.js`, `orari.js`, `tempo.js` né `spostamenti.js` — cambia solo `css/game.css` (le
linguette dello Shop) e `pagine/gioco.html`. I commit MakeHuman (`4427e77`, `4eabf0b`,
`d9bc704`, `d75b15b`) toccano `hub.js` ma solo `vistaProfilo()`/il ritratto e la lista
delle linguette del profilo (tolta «Vestiti»): non toccano `assumitiCome()`,
`schedaLavoro()` né i punti dove entra `GAME_HOURS`. Confrontato riga per riga il diff di
`34a45f8` (il commit che ha introdotto `jobStatus`/`jobDuration`/`placeJobStatus`) con lo
stato attuale di `orari.js`: è arrivato intatto, `GAME_HOURS.showClosed` è esportato (prima
non lo era, ed `assumitiCome()` lo chiama) e i nomi dei lavori in `JOB_HOURS` combaciano
uno a uno con `JOBS` in `actions.js` e con `DURATE_LAVORO` in `tempo.js`. Nessuno scontro
trovato con quello che è arrivato dagli altri due branch.

**Sulla doppia cattura dell'id**: confermato che sono ridondanti ma non in conflitto, come
già scritto nel commit. Il wrapper di `tempo.js:323` cattura l'id appena parte
`avviaAzioneDiretta(id)`; la chiamata esplicita di `ui.js:128` lo ricattura, con lo stesso
valore, appena prima di `iniziaAzione()` dentro `esegui()`. Anche quando l'azione passa
dalla finestra «Confermi?» (costa soldi veri) l'id resta lo stesso finché non si conferma:
non c'è un punto in cui la mossa cambia proprietario a metà.

Un problema serio, trovato leggendo il codice (non l'ho cliccato dal vivo nel browser: qui
non ho un browser da aprire, quindi questa è una lettura, da confermare a mano prima di
fidarsene del tutto — ma ho seguito ogni singolo punto del codice che tocca
`G.currentPlace` e non ce n'è uno che manca).

### Il gioco chiede di essere «al posto giusto» per registrare, mixare, fare live, palestra e i turni in Fabbrica/Pizzeria — ma non ti ci porta mai

- **dove** — `frontend/js/game/spostamenti.js:190-226` (`actionAccess`, il controllo
  «sei nel posto giusto?») contro `frontend/js/game/hub.js:833-845` (il click sui cartelli
  della mappa) e `frontend/js/game/state.js:13-47` (`START()`, la partita nuova)
- **cosa succede** — dal commit `dc49c91` (3/09) ogni mossa che passa da
  `avviaAzioneDiretta()` (quindi anche «Cerca un beat», «Registra il pezzo», «Mixa il
  pezzo» dentro lo Studio, «Fai la serata» al Live Club, le due mosse della Palestra, e
  «Fai il turno» in Fabbrica/Pizzeria — è la stessa mossa che questo branch ha appena
  sistemato per la durata) controlla anche `G.currentPlace`: se non sei fisicamente nel
  posto richiesto (`studio`, `concerti`, `palestra`, `fabbrica`, `pizzeria`) la mossa viene
  rifiutata con «Per fare questa mossa devi prima raggiungere X sulla mappa», prima ancora
  di toccare energia o soldi. Il problema è che **niente, in tutto il codice, sposta
  `G.currentPlace` quando clicchi un cartello della mappa**: `START()` (partita nuova) non
  lo mette nello stato iniziale, e l'unico punto che lo scrive davvero è `esegui(toId)` in
  `spostamenti.js:297` (`GAME_TRAVEL.go`) — che ho cercato in tutto `frontend/js/` e non è
  chiamato da nessuna parte: non dal click sui cartelli (`hub.js:833`, che chiama solo
  `l.vai()`, cioè apre direttamente lo Studio/la Pizzeria/eccetera), non da `apriStudio()`,
  non da `schedaLavoro()`. Quindi `G.currentPlace` resta sempre `"vita"` (Casa) per tutta
  la partita, tranne quando vai in carcere. Il risultato: **«Cerca un beat», «Registra il
  pezzo», «Mixa il pezzo», «Fai la serata», le due mosse della Palestra e «Fai il turno» in
  Fabbrica/Pizzeria falliscono sempre**, con l'avviso che ti manda a un posto in cui sei
  già entrato (lo Studio, per dire) senza mai spendere energia, soldi o tempo. Per il
  lavoro di questo branch nello specifico: `assumitiCome()` ti assume regolarmente (quel
  controllo guarda solo l'orario), ma la riga subito dopo che chiama `hubAzione("turno")`
  per farti davvero lavorare va a sbattere su questo stesso muro — la paga non arriva mai.
  Lo stesso identico scenario è già scritto, come test isolato, dentro
  `strumenti/audit-regressioni.js:1163-1194` (`currentPlace:"vita"` → `wrong-place`): il
  test conferma che il blocco funziona come progettato, ma nessun test verifica che il
  gioco vero porti mai `currentPlace` fuori da `"vita"`.
- **come si vede** — non l'ho provato in un browser vero (qui non ne ho uno). Da
  controllare a mano: partita nuova, vai in Studio dalla mappa, prova «Cerca un beat» (o
  in Fabbrica, fatti assumere e prova «Fai il turno»); se il sospetto è giusto, esce
  l'avviso «devi prima raggiungere Studio/Fabbrica sulla mappa» anche stando già lì dentro.
- **quanto pesa** — blocca la partita (se confermato: tutta la produzione musicale, la
  palestra e i due lavori con un edificio fisico diventerebbero impossibili da usare).
  Non è nato con questo branch — il controllo sul luogo è del 3/09 (`dc49c91`), prima che
  `fix/durata-azioni-e-orari-fabbrica` esistesse — ma il pezzo che questo branch ha appena
  sistemato (il turno in Fabbrica) ci sbatte contro in pieno, e vale la pena controllarlo
  subito insieme.

**RISPOSTA (10/09/2026)** — falso allarme, controllato a mano in `frontend/js/game/spostamenti.js`.
`esegui(toId)` **è chiamato**: riga 347, dentro `mostraConferma()`, quando si clicca «Vai»
nella finestra di conferma dello spostamento. Quella finestra si apre dal click su un pin
della mappa (`#hb-pins`, listener a riga 413-435): click su `.pspot[data-l]` → `piano(id)` →
se il tragitto è valido e non sei già lì, `mostraConferma(p, onArrive)` → sull'opzione «Vai»
(riga 346-350) chiama `esegui(p.toId)`, che scrive `G.currentPlace = toId` (riga 297) e
salva. Il giro precedente ha cercato la stringa letterale `GAME_TRAVEL.go(...)` (il nome con
cui la funzione è esposta all'esterno, riga 482: `go:esegui`) e non l'ha trovata in giro per
`frontend/js/`, senza accorgersi che dentro allo stesso modulo la funzione si richiama per
il suo nome locale, `esegui(...)`, non tramite l'alias pubblico. `G.currentPlace` si muove
davvero quando ci si sposta sulla mappa: «Cerca un beat», «Fai il turno» in Fabbrica e le
altre mosse legate al luogo non sono bloccate in modo strutturale.

---

## Giro del 10/09/2026 (sesto giro: controllo mirato del commit `c6d44df`)

Controllati lo stop dei provini in Shop, La Sala e Studio e la ricarica fino al massimo dinamico a ogni nuovo giorno, sia con «Fine giornata» sia con gli skip: tutto a posto. Anche i controlli automatici sono verdi (`npm run prova`: 99 a posto, `audit-regressioni`: 301 a posto, `verifica:build`: 33 a posto).
