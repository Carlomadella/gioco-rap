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
(`FUORI_DAL_PACCHETTO`), e l'audit smette di guardarci dentro *perché* il build lo
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
