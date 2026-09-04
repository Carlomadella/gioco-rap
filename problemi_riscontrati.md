# Problemi riscontrati

Quello che salta fuori provando il gioco. Ogni voce dice **cos'è**, **come si vede**
e **quanto è sicura**: se una cosa non l'ho potuta riprodurre fino in fondo, è
scritto, invece di farla passare per un bug accertato.

---

## Da valutare prima di uscire sugli store

**Citazioni di brani veri.** `frontend/js/game/crime-caption.js` contiene 118
citazioni testuali di brani rap con autore e titolo. Se il gioco esce su Steam e
sugli store, quelle sono liriche protette da copyright e vanno valutate prima
della pubblicazione. Non l'ho toccato: è una scelta tua, non un bug.

---

## Trovati e sistemati (04/09/2026)

### `renderNegozio` non è mai esistita

`frontend/js/game/tempo-controlli.js`, dentro a `refreshOtherViews()` — la funzione
che, quando il tempo avanza, ridisegna tutte le schermate aperte perché non
mostrino numeri vecchi.

```js
try{ if(typeof renderNegozio==="function") renderNegozio(); }catch(_){}
```

**Quella funzione non esiste**: si chiamano `renderArmadio` (il guardaroba) e
`renderAbbigliamento` (la vetrina dentro allo Shop). Il `typeof` teneva nascosto lo
sbaglio — la chiamata non esplodeva, semplicemente non faceva niente. Risultato: da
sempre, quelle due viste non si sono mai riaggiornate quando passa il tempo.

Nello stesso elenco **mancava anche lo Studio**, che pure ha in testata energia,
soldi e lucidità: cioè esattamente le tre cose che il tempo cambia.

**Sistemato**: le due funzioni giuste al posto di quella inventata, più
`renderStudio`.

**Onestà su quanto è grave**: che la chiamata sia sbagliata è certo, si vede
leggendo. Quanto sia *visibile* giocando dipende da quali finestre lascino passare
il tempo, e questo non sono riuscito a dimostrarlo in Chrome: ogni volta che ho
provato ad avanzare col pannello aperto, il tempo era bloccato per un altro motivo
legittimo. Quindi: difetto reale e corretto, impatto non misurato.

### `.telslot` dichiarata in due fogli di stile

Stava sia in `css/game.css` sia in `css/telefono.css`. È roba mia, del lavoro con
cui il quaderno è stato sciolto. Nessun danno (le due dichiarazioni erano identiche),
ma è **esattamente la forma** del guaio che in questo progetto è già costato caro
una volta: due classi con lo stesso nome in due fogli diversi si rompono in
silenzio. Tolta da `game.css`, dove il resto della vestizione dello slot non c'è.

**Come si ricontrolla** (vale la pena rifarlo ogni tanto): si cercano le classi
dichiarate *nude* — cioè come selettore intero, `.foo{...}`, non `.qualcosa .foo` —
in più di un foglio. Oggi ne restano 20, e sono quasi tutte volute: `tocco.css`
ridichiara apposta i bersagli per portarli a 44 punti. Le uniche due che meritano
un'occhiata quando si ha tempo sono `.bigport` (`effects.css` + `hud.css`) e
`.land-dock` / `.land-*` (`avvio.css` + `landing.css`), dove però `avvio.css`
aggiunge solo la transizione dell'entrata: sembra stratificazione voluta, non
collisione.

---

## Controllati e risultati sani

Roba che sembrava un bug e non lo era. Scritto qui perché il prossimo non ci
ripassi sopra.

- **Annullare il titolo del pezzo** (`chiediTitolo`, la finestra «Come lo chiami»):
  la X restituisce l'energia già scalata (visto: 55 → 100), non consuma né la strofa
  né il beat, e sblocca il cancello dei luoghi. Il meccanismo
  `iniziaAzione`/`azioneFatta`/`annullaAzione` in `uscita.js` è corretto.
- **Il banco dello Studio senza niente da mixare** non è un vicolo cieco: lo dice
  («Non c'è niente da mixare. Prima si registra»).
- **Le mosse rifiutate quando non sei nel posto giusto** non sprecano niente e lo
  spiegano: «Per fare questa mossa devi prima raggiungere Palestra sulla mappa. Non
  hai speso energia né tempo».
- **Gli eventi ALTO non hanno la X**, e devono essere risposti: è voluto. Se la
  finestra sparisce senza risposta, il tempo si blocca con «Prima devi chiudere la
  decisione o l'azione in corso» mentre a schermo non c'è niente — ma **a quello
  stato ci sono arrivato solo forzando la chiusura da console** (`classList.remove`),
  cosa che un giocatore non può fare. Ricaricando la pagina l'evento viene
  riproposto e tutto riparte. Non lo conto come bug finché non si trova una strada
  che ci arrivi giocando.
- **Il giro completo dello Studio** funziona: scrivi → cerca un beat → registra →
  mixa → pubblica → promo. Verificato che il pezzo nasce col titolo e la copertina,
  che strofa e beat vengono consumati, che il mix alza la qualità (63 → 69) e che la
  promo muove hype e follower.

---

## Nota di metodo, per la prossima volta

Simulare una carriera con uno script che clicca alla cieca **produce quasi solo
falsi allarmi**. Tre volte ho creduto di aver trovato un bug e tre volte era il mio
harness: chiudeva i dialoghi con la X (annullando la mossa), forzava `HUB_QUI` senza
spostare davvero il personaggio, o rimuoveva a mano la classe `on` da una finestra.
Le mosse del gioco passano quasi tutte da una finestra di conferma, da un chooser
(«veloce o giocala») o da un prompt (il titolo del pezzo): uno script che non
risponde *a quella specifica finestra* non sta giocando, sta annullando.

Quello che invece ha reso: **leggere il codice cercando classi precise di errore**.
Il `renderNegozio` morto è uscito da una scansione dei nomi chiamati e mai definiti
in tutto `js/` — quaranta risultati, trentanove falsi positivi (nomi di funzioni CSS
dentro alle stringhe: `rgba(`, `scale(`, `blur(`), e uno vero.
