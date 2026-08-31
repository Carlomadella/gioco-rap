# Anni di Fame — il gioco (frontend)

Il gioco vero e proprio: tutto quello che gira nel browser di chi gioca.
HTML, CSS e JavaScript. **Nessuna dipendenza, nessun passaggio di build.**

Il server della classifica sta in `../backend/` e ha il suo README: da qui si parla
solo del gioco. Il gioco funziona anche senza server.

## Come si avvia

```bash
# dalla cartella frontend/
python -m http.server 8000
# oppure
npx serve .
```

Poi apri <http://localhost:8000>.

Gli script sono classici, non moduli ES, quindi non c'è il blocco CORS che i moduli
hanno su `file://`: il doppio clic su `index.html` funziona comunque. Il server locale
resta la via consigliata (è quella verificata), e serve per forza se vuoi anche la
classifica online, perché una pagina aperta da `file://` non può chiamare l'API.

## Perché è ancora vanilla, e perché ci resta

Non è pigrizia, è un vincolo di prodotto: **il gioco deve poter essere un file solo**
(`dist/anni-di-fame.html`) che gira dentro a un artifact di Claude, senza rete e senza
niente da installare. Oggi ci arriviamo con uno script Python di 60 righe che rimette
dentro CSS, JS e immagini. Con React o Vue servirebbe un bundler, un `node_modules`, un
passaggio di build per ogni modifica — e soprattutto la riscrittura di tutto il gioco:
settimane di lavoro per un giocatore che non vedrebbe **niente** di diverso.

Le cose che un framework porta davvero — componenti riusabili, stato reattivo, routing —
qui sono già risolte in piccolo: le schermate sono `<section>` che si accendono e si
spengono, lo stato è un oggetto solo (`G`) che si salva nel `localStorage`, e ogni
schermata si ridisegna con la sua funzione (`renderGioco()`, `renderArtista()`).

Quello su cui vale la pena spendere è l'ordine: cartelle chiare, un file per argomento,
niente logica di gioco dentro alla grafica. Quello sì, e si fa senza cambiare linguaggio.

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
strumenti/            build-artifact.py: rifà il gioco in un file solo
dist/                 anni-di-fame.html, il file unico per l'artifact
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

I file sono script classici che condividono lo scope globale: ognuno dà per scontato
che quelli caricati prima abbiano già dichiarato le loro funzioni e costanti.

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
classifica locale. Nessuna schermata deve aspettare la rete per disegnarsi. Da solo questo
file non fa niente: nessuna chiamata parte se non la chiedi.

## Salvataggi

Tutto in `localStorage`, sul dispositivo di chi gioca:

- `anni-di-fame-artista` — l'aspetto e l'identità dell'artista
- `anni-di-fame-partita-v2` — la partita in corso
- `adf-impostazioni-v1` — impostazioni, lingua, slot scelto
- `adf-online-id` / `adf-online-chiave` — chi sei nella classifica online (uno per slot)
- `adf-online-url` — l'indirizzo del server della classifica, se non è quello di casa

Gli slot sono tre (impostazioni → Partite). Lo slot 1 usa le chiavi storiche qui sopra,
gli altri aggiungono il suffisso `-s2` / `-s3`: chi giocava prima ritrova la sua carriera
dov'era. Da lì si esporta e si importa una carriera come codice.

## Un file solo, per l'artifact

```bash
python3 strumenti/build-artifact.py
```

Rimette dentro `index.html` tutti i CSS e i JS nell'ordine in cui compaiono e scrive
`dist/anni-di-fame.html`, senza doctype/head/body: lo scheletro lo mette l'artifact.
Anche le immagini richiamate dai CSS finiscono dentro, come data URI: nell'artifact non
c'è nessuna cartella `media/` da cui pescarle.

Nel file unico la classifica online non parte: `ONLINE` c'è ma punta a `localhost`, e
`localhost` dentro a un artifact non è nessuno. Il multiplayer è per il gioco servito da
un sito vero, e l'artifact resta quello che è sempre stato — la demo che gira dappertutto.

## Quando si tocca l'interfaccia

- **Cambi un CSS o un JS?** Alza il `?v=` nei tag di `index.html`, se no il browser di
  chi gioca continua a servire il vecchio.
- **Aggiungi un file JS?** Va messo in `index.html` nel punto giusto della catena: i file
  contano sull'ordine, non c'è nessun import a rimettere le cose a posto.
- **Riferimento visivo**: `../stili interfaccia schermata di gioco.md` e le foto in
  `media/photo/`.
