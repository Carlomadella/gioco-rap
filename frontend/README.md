# Anni di Fame — il gioco (frontend)

Il gioco vero e proprio: tutto quello che gira sullo schermo di chi gioca.
HTML, CSS e JavaScript. L'unica dipendenza è esbuild, e serve solo al build: dentro al
gioco non entra niente.

Il server della classifica sta in `../backend/` e ha il suo README: da qui si parla solo
del gioco. Il gioco funziona anche senza server.

## Dove esce il gioco

**Steam** (Windows, macOS, Linux, Steam Deck) e gli **store del telefono** (App Store e
Google Play). Non è un gioco da browser e non è una demo: è un prodotto che si scarica, si
installa e si paga. Tutto quello che c'è scritto qui sotto discende da questa frase.

## Come si avvia

```bash
cd frontend
npm install          # una volta sola: serve solo esbuild, e solo per il build
npm run dev          # → http://localhost:8000, con la ricarica automatica
```

Salvi un file e la pagina si rifà da sola: non c'è da andare a schiacciare F5.

Gli altri comandi:

| comando | cosa fa |
| --- | --- |
| `npm run dev` | il gioco dai sorgenti, con la ricarica automatica |
| `npm run build` | `dist/`: la cartella pronta per Electron e Capacitor |
| `npm run demo` | `dist/anni-di-fame.html`: il gioco in un file solo, da far provare a qualcuno |
| `npm run prova` | i controlli che si possono fare senza browser (vedi in fondo) |
| `npm run dev -- --dist` | serve la cartella `dist/`, per provare il build vero |

Serve un server locale e non il doppio clic sul file: con `file://` il `localStorage` è
legato al percorso e le chiamate alla classifica non partono.

## Perché il gioco è scritto in HTML, CSS e JavaScript

**È la tecnologia giusta per questo gioco, e per gli store non è un ostacolo.**

Anni di Fame è un gestionale: schermate, liste, carte, testo, numeri che cambiano. Niente
fisica, niente 3D, niente sessanta fotogrammi al secondo da tenere. È esattamente quello
per cui il DOM e i CSS sono fatti — e infatti costruire questa roba con un motore di gioco
(Godot, Unity) vorrebbe dire rifare a mano bottoni, liste che scorrono, campi di testo e
tipografia, cioè le uniche cose che qui contano davvero. Su Steam ci sono decine di giochi
gestionali fatti così: si impacchettano in un eseguibile e nessuno se ne accorge.

E soprattutto: **il gioco esiste già**. Diecimila righe che funzionano, con dentro anni di
scelte di bilanciamento. Riscriverle in un'altra tecnologia sono mesi di lavoro e di
regressioni, per un giocatore che non vedrebbe niente di diverso.

Quello che **cambia** rispetto a com'è oggi, e cambia sul serio, sta qui sotto.

## Cosa serve per uscire su Steam e sugli store

In ordine di quanto pesa. Nessuna di queste è opzionale.

### 1. Un build vero — **FATTO (31/08/2026)**

Prima: trenta `<script>` in un ordine fisso, tutti serviti singolarmente, e la cache
aggirata alzando a mano un `?v=8`. Per un sito nostro si regge; per un prodotto in vendita
no.

Adesso c'è `npm run build`, ottanta righe in `strumenti/build.js`:

- mette insieme i 13 fogli di stile e i 36 file di codice in **due file soli**, nell'ordine
  in cui stanno in `index.html`;
- li **minifica** con esbuild — da 450 a **291 KB** di codice, da 110 a **77 KB** di stile;
- dà a ognuno un nome con dentro **l'impronta del contenuto** (`gioco-20eefd0e.js`): la
  cache si sistema da sé e il `?v=` a mano **sparisce dal prodotto**;
- riscrive `index.html` con due tag al posto di quarantatré e copia le immagini;
- tiene **tutti i percorsi relativi**, perché è così che la cartella viene aperta da
  Electron e da Capacitor (`file://`).

Più `npm run dev` (server con ricarica automatica, zero dipendenze) e `npm run prova`, che
prende gli errori scemi e costosi: un file aggiunto e mai messo in `index.html`, un tag che
punta a un file che non c'è più, un'immagine sparita da sotto a un CSS, un file che non
compila. Provato: il build minificato apre il menu e la plancia intera — mappa, profilo,
telefono, eventi — senza un errore in console.

**Perché esbuild e non Vite, e perché i moduli ES non ci sono.** Vite serve a chi ha i
moduli ES; noi non ce li abbiamo, e convertirli tutti in una notte sarebbe stata una
macchina da regressioni. Il motivo è preciso: questi 36 file **non sono indipendenti** —
condividono lo stesso scope (`G`, `PHASES`, `pick`, `$`…) e diversi fanno cose al momento
del caricamento, in un ordine che conta. Coi moduli ES l'ordine di esecuzione lo decide il
grafo degli import, non più la fila dei tag: basta un file che al caricamento tocca una
cosa non ancora pronta e il gioco si rompe **in silenzio**, magari solo in una schermata su
venti. Con la concatenazione l'ordine resta identico a quello che gira oggi: il build non
può cambiare il comportamento del gioco, può solo impacchettarlo.

I moduli ES restano una cosa buona da fare — **una cartella alla volta, con il gioco
giocabile a ogni passo**, non tutti in una sera. E non sono un requisito per uscire: il
requisito era avere un pacchetto minificato, con la cache a posto, che Electron e Capacitor
sanno aprire. Quello c'è.

### 2. L'impacchettamento

Il codice è uno solo; cambia il guscio che ci sta intorno.

| dove | con cosa | note |
| --- | --- | --- |
| Steam (Windows, macOS, Linux, Deck) | **Electron** | la strada battuta: Steamworks (traguardi, Cloud, overlay) ha collegamenti già pronti e provati |
| iOS e Android | **Capacitor** | mette il gioco dentro a un'app nativa vera, con accesso a salvataggi, acquisti e notifiche |
| _alternativa per tutti e quattro_ | **Tauri v2** | eseguibili molto più piccoli (una decina di MB contro un centinaio), ma il lato Steam e il lato mobile sono più giovani |

La scelta che consiglio: **Electron per Steam, Capacitor per il telefono**. Sono due gusci
sopra allo stesso gioco, non due giochi. Su Steam il peso dell'eseguibile non interessa a
nessuno; quello che interessa è che l'overlay funzioni e che i traguardi arrivino.

### 3. I salvataggi non possono più stare nel `localStorage`

Oggi la carriera vive nel `localStorage` del browser. Su uno store è inaccettabile: la
gente reinstalla, cambia telefono, gioca sul PC e poi sul cellulare, e una carriera da
quaranta ore che sparisce è una recensione negativa che resta lì per sempre.

Serve uno **strato di salvataggio** con tre gradini: un file vero nella cartella dati
dell'app (desktop) o nello spazio dell'app (telefono); **Steam Cloud** dove c'è;
e il **salvataggio in cloud nostro**, legato all'account, che è quello che fa passare una
carriera dal PC al telefono. Il modello dei dati è già disegnato:
`../backend/database/schema.md`, tabella `carriera`.

### 4. L'account al posto della chiave nel browser

Stessa storia dal lato classifica: oggi sei un `id` e una chiave nel `localStorage`. Con
gli store si entra con **Steam**, **Sign in with Apple**, **Google Play Games** o una mail,
e l'artista sta attaccato a quell'account. Apple e Google pretendono anche che dal gioco si
possa **cancellare** il proprio account: c'è già la procedura scritta, in `schema.md`.

### 5. L'interfaccia sul telefono — il lavoro più grosso

La plancia è disegnata alla misura del concept (1536×1024) e rimpicciolita tutta insieme.
Su un monitor va benissimo, su un telefono in verticale no: serve una disposizione sua
(profilo, mappa e telefono uno sotto l'altro invece che affiancati), aree da toccare di
almeno 44 punti, niente `hover`, e i testi che restano leggibili senza zoom.

Non è una riscrittura: sono i CSS e qualche pezzo di `hub.js`. Ma è il lavoro più lungo di
tutta la lista, ed è quello da provare su un telefono vero il prima possibile.

### 6. Le cose che si notano solo quando è tardi

- **Prestazioni**: `renderGioco()` ridisegna tutta la schermata a ogni cambiamento. Su un
  computer non si vede; su un telefono di quattro anni fa sì. Si ridisegna solo il pezzo
  che cambia, quando comincerà a sentirsi.
- **Comandi**: sullo Steam Deck si gioca col pad. Serve almeno la navigazione fra i
  bottoni con la croce direzionale e i due tasti principali.
- **Audio**: sui telefoni il suono parte solo dopo che l'utente ha toccato qualcosa
  (`AudioContext` sospeso). Vale già la pena tenerne conto.
- **Requisiti degli store**: informativa sulla privacy (raccogliamo nome d'arte, città e
  identificativo: sono dati personali), classificazione per età, e su iOS nessun rimando a
  pagamenti fuori dall'app.

### L'ordine con cui li farei

1. ~~Il build~~ **fatto**.
2. Lo strato di salvataggio (file vero + cloud nostro), perché cambia il modo in cui il
   gioco parla con i dati e prima si fa, meno codice tocca.
3. Electron e una build che si apre davvero, così si prova su una macchina vera.
4. L'interfaccia per il telefono, provata su un telefono.
5. Account, traguardi, Steam Cloud.
6. Capacitor e la build mobile.

## Struttura

```
index.html            solo il markup + i collegamenti a CSS e JS
css/                  i fogli di stile, nell'ordine in cui vanno caricati
js/core.js            $ e pick, usati da tutto il resto
js/impostazioni.js    impostazioni e slot, caricato subito dopo core
js/lingua.js          vocabolario e traduttore dell'interfaccia
js/net/online.js      il ponte con la classifica online (non parte da solo)
js/creator/           creazione dell'artista
js/game/              la partita
media/photo/          concept art delle città e avatar di riferimento
strumenti/build.js    il build: bundle minificato con l'impronta nel nome
strumenti/dev.js      il server di sviluppo con la ricarica automatica
strumenti/prova.js    i controlli che si fanno senza browser
package.json          gli script (dev, build, demo, prova) e l'unica dipendenza: esbuild
dist/                 quello che esce dal build (fuori da git)
```

### CSS — l'ordine dei `<link>` in `index.html` conta

| file | contenuto |
| --- | --- |
| `base.css` | variabili, reset, tipografia, fondale |
| `preview.css` | anteprima dell'artista (palco, ritratto, targhetta) |
| `shell.css` | schermate, barra in alto, menu principale |
| `game.css` | schermata di gioco: statistiche, azioni, liste, fase |
| `overlays.css` | piazza, foglio di scrittura, diario, modale |
| `effects.css` | notifiche, rapporto settimanale, lampo, animazioni |
| `hud.css` | testata artista, risorse, navigazione, lifestyle |
| `forms.css` | pannelli e campi del creatore |
| `creator.css` | sezione avatar: galleria degli otto, categorie, fondali |
| `actionbar.css` | barra fissa in basso e bottoni |
| `posto.css` | La Sala: la scena del posto e le schede della gente |
| `hub.css` | la plancia: testata, profilo, mappa, eventi, telefono |
| `impostazioni.css` | pannello impostazioni, temi, densità |

### JS — anche qui l'ordine dei `<script>` conta

I file sono script classici che condividono lo scope globale: ognuno dà per scontato che
quelli caricati prima abbiano già dichiarato le loro funzioni e costanti. **È la cosa che
Vite viene a sistemare** (punto 1 qui sopra): fino ad allora, l'ordine è legge.

**Prima di tutto**

| file | contenuto |
| --- | --- |
| `js/core.js` | `$` e `pick` |
| `js/impostazioni.js` | stato `SET`, slot partita (`slotKey`), preset di difficoltà |
| `js/lingua.js` | italiano/inglese dell'interfaccia |
| `js/net/online.js` | `ONLINE`: iscrizione, invio del punteggio, lettura della classifica |

**Creatore** (`js/creator/`)

| file | contenuto |
| --- | --- |
| `data.js` | scene, generi, vestiti, colori, tratti del viso |
| `state.js` | stato `A`, default, salvataggio (`ART_KEY`) |
| `portrait.js` | ritratto parametrico 3/4 in SVG e silhouette |
| `avatar-presets.js` | gli otto avatar pronti e i fondali |
| `options.js` | barra delle categorie: ogni opzione è il tuo volto ritagliato |
| `render.js` | `renderArtista()` |
| `events.js` | campi, slider, chip, salvataggio, casuale |
| `nav.js` | navigazione, menu principale, `window.ARTIST_BODY` |

**Partita** (`js/game/`)

| file | contenuto |
| --- | --- |
| `state.js` | stato `G`, valori iniziali, `save()` (`SAVE_KEY` + slot) |
| `content.js` | titoli generati, attrezzatura, contratti, traguardi |
| `beats.js` | i generi dei beat: suono, nome, prezzo |
| `covers.js` | copertine generate da un seed |
| `rivals.js` | rivali: generazione, volto, crescita |
| `actions.js` | azioni della settimana e lavoretti |
| `events.js` | eventi casuali |
| `phases.js` | fasi della carriera e prove di passaggio |
| `sim.js` | chiusura settimana, stream, spese, classifica |
| `writer.js` | il foglio: rime, metrica, punteggio |
| `versi.js` | generatore di barre per completare una strofa |
| `piazza.js` | freestyle in piazza |
| `copertine.js` | copertina caricata dall'utente e titolo del pezzo |
| `modal.js` | finestra modale degli eventi |
| `scene-art.js` | illustrazioni SVG delle azioni |
| `beatplay.js` | ascolto dei beat: bpm, cassa, scala dal seme |
| `ui.js` | `renderGioco()`: HUD, pannelli, liste, comandi |
| `lifestyle.js` | spese fisse e livelli di lifestyle |
| `fx.js` | suono, notifiche, rapporto, avvio (`window.GAME`) |
| `skip.js` | salta un giorno, una settimana, un mese |
| `uscita.js` | uscire da un'azione (✕, ESC, clic fuori) rimettendo a posto il conto |
| `posto.js` | La Sala: la gente del giro, i rapporti che ci costruisci |
| `hub.js` | la plancia: testata, profilo, mappa, eventi di oggi, telefono |

**Per ultimo**

| file | contenuto |
| --- | --- |
| `js/impostazioni-ui.js` | il pannello delle impostazioni (tocca audio, stato e interfaccia) |

### Il ponte fra creatore e partita

Si parlano tramite poche cose su `window`: `ARTIST`, `ARTIST_PORTRAIT`, `ARTIST_BODY`,
`GO`, `GAME`, `__POSE`, `__MOOD`.

### Il ponte con la classifica online

`js/net/online.js` mette in giro un oggetto solo, `ONLINE`:

| funzione | cosa fa |
| --- | --- |
| `ONLINE.assicura(nome, citta, genere)` | iscrive l'artista se non è già iscritto |
| `ONLINE.invia()` | manda il punteggio della settimana appena chiusa (lo prende da `G`) |
| `ONLINE.classifica(da, quanti)` | una fetta: top 10, top 100, top 1000 |
| `ONLINE.intorno(raggio)` | chi hai davanti e chi hai dietro |
| `ONLINE.notizie(n)` | chi è uscito, chi ha firmato, chi è sparito |
| `ONLINE.collega(url)` | punta a un altro server (di suo: `http://localhost:8787`) |

**Regola**: se il server non c'è, ogni funzione torna `null` e il gioco tira dritto sulla
classifica locale. Nessuna schermata deve aspettare la rete per disegnarsi — vale anche da
installato, perché la gente gioca in aereo e in metropolitana.

## Salvataggi

Oggi tutto in `localStorage`, sul dispositivo di chi gioca (vedi il punto 3 qui sopra: è
una delle cose che devono cambiare prima di uscire).

- `anni-di-fame-artista` — l'aspetto e l'identità dell'artista
- `anni-di-fame-partita-v2` — la partita in corso
- `adf-impostazioni-v1` — impostazioni, lingua, slot scelto
- `adf-online-id` / `adf-online-chiave` — chi sei nella classifica online (uno per slot)
- `adf-online-url` — l'indirizzo del server della classifica, se non è quello di casa

Gli slot sono tre (impostazioni → Partite). Lo slot 1 usa le chiavi storiche qui sopra,
gli altri aggiungono il suffisso `-s2` / `-s3`: chi giocava prima ritrova la sua carriera
dov'era. Da lì si esporta e si importa una carriera come codice.

## Il gioco in un file solo

```bash
npm run demo          # → dist/anni-di-fame.html (631 KB, immagini comprese)
```

Il gioco intero in un file: si apre con un doppio clic, dappertutto, senza installare
niente. **Non è il modo in cui il gioco esce** — quello sono gli eseguibili di Steam e le
app degli store. È lo strumento per **farlo provare**: si manda il file a qualcuno e gioca,
senza spiegazioni. Comodo per un playtest o per farlo vedere a un editore.

## Quando si tocca l'interfaccia

- **Aggiungi un file JS o CSS?** Va messo in `index.html` nel punto giusto della catena: i
  file contano sull'ordine, non c'è nessun import a rimettere le cose a posto. `npm run
  prova` se ne accorge se te lo dimentichi.
- **Il `?v=` nei tag** serve solo mentre si sviluppa senza `npm run dev`: nel build i nomi
  hanno già l'impronta dentro e la cache si sistema da sola.
- **Prima di impacchettare**: `npm run build && npm run prova`.
- **Riferimento visivo**: `../stili interfaccia schermata di gioco.md` e le foto in
  `media/photo/`.
