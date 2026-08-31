# Anni di Fame

Gioco di carriera rap, in uscita su **Steam** e sugli **store del telefono**.
Il progetto è diviso in due metà che non si mescolano:

| dove | cos'è | come si avvia |
| --- | --- | --- |
| [`frontend/`](frontend/README.md) | il gioco: HTML, CSS, JavaScript, dentro a un guscio nativo per gli store | `python -m http.server 8000` |
| [`backend/`](backend/README.md) | il server della classifica: Node, nessuna dipendenza | `npm start` |
| [`backend/database/`](backend/database/README.md) | i dati: com'è messo adesso e dove va (lo schema completo in `schema.md`) | — |

**Il gioco funziona da solo.** Il backend serve alla classifica multiplayer: se non è
acceso, la partita gira come ha sempre girato, con la classifica in locale.

```bash
# il gioco
cd frontend && python -m http.server 8000      # → http://localhost:8000

# la classifica online, in un altro terminale (facoltativa)
cd backend && npm start                        # → http://localhost:8787
```

## Dove esce il gioco

**Steam** (Windows, macOS, Linux, Steam Deck) e gli **store del telefono** (App Store e
Google Play). Non è un gioco da browser: è un prodotto che si scarica, si installa e si
paga. Il codice resta HTML, CSS e JavaScript — è la tecnologia giusta per un gestionale a
schermate, e su Steam mezzo genere è fatto così — ma ci va intorno un guscio:
**Electron** per il desktop, **Capacitor** per il telefono.

Da qui discendono cinque lavori che prima non servivano: un build vero (Vite e i moduli ES
al posto di trenta `<script>` in ordine fisso), i **salvataggi su file e in cloud** al
posto del `localStorage`, gli **account** (Steam, Apple, Google) al posto della chiave nel
browser, l'**interfaccia per il telefono** in verticale e a tocchi, e i requisiti degli
store (privacy, età, cancellazione dell'account). L'elenco completo, con l'ordine con cui
farli, sta in [`frontend/README.md`](frontend/README.md).

Intanto il gioco si mette in un file solo per farlo provare a qualcuno:

```bash
python3 frontend/strumenti/build-artifact.py     # → frontend/dist/anni-di-fame.html
```

Non è il modo in cui il gioco esce: è lo strumento per una demo o un playtest — si manda il
file e la gente gioca, senza installare niente.

I documenti di progetto stanno qui in radice: `ROADMAP.md` (il disegno d'insieme),
`implementazioni.md` (i punti da fare, spuntati uno a uno),
`stili interfaccia schermata di gioco.md` (il riferimento visivo).

## Dove sta andando: l'hub è una mappa

**L'hub del gioco è una plancia con la mappa al centro** (punto 26 di
`implementazioni.md`, dettagli in `ROADMAP.md`). Non sblocchi funzioni sparse in un menu,
sblocchi un mondo più grande. La prima città c'è già: «Inizia la carriera» apre la plancia
— profilo a sinistra, città al centro, telefono a destra, eventi di oggi in basso — i
luoghi aprono la partita sulla sezione giusta e dalla partita si torna indietro col tasto
«Mappa».

Tre città, in quest'ordine:

| | città | come ci arrivi | cosa ci trovi |
| --- | --- | --- | --- |
| ![provincia](frontend/media/photo/schermata_di_gioco_città_iniziale.png) | **Città di provincia** — il nome lo scrive il giocatore _(fatta)_ | si parte da qui | studio, beat maker, vita quotidiana, attività criminali |
| ![Milano](frontend/media/photo/schermata_di_gioco_città_di_mezzo.png) | **Milano** | livello ≥ 10, fama ≥ 50, hype ≥ 40 | studi di registrazione, manager, club, concerti, sponsor, business, shop, criminalità grossa |
| ![Los Angeles](frontend/media/photo/schermata_di_gioco_città_finale.png) | **Los Angeles** | livello ≥ 30, fama ≥ 90, hype ≥ 85, reputazione ≥ 80 | studi top tier, label & A&R, eventi VIP, sponsor HQ, casinò, shop luxury, business district |

La schermata resta sempre la stessa — cambia il mondo in mezzo, non l'interfaccia:
testata con logo, nome, livello e le quattro risorse (energia, soldi, hype, seguito);
al centro la mappa con i punti cliccabili e quelli ancora chiusi; in basso le linguette
(Mappa, Contatti, Inventario, Obiettivi, Statistiche), la riga dell'obiettivo attuale, le
notizie della città e il telefono con la chat.

Due regole che vengono da lì e toccano tutto il resto:

- **Niente studio personale.** Per registrare devi andare negli studi degli altri, e ogni
  studio ha una qualità che entra nel calcolo del pezzo (provincia ~40, Milano ~75,
  leggendario ~95 su 100).
- **I contatti sono una risorsa.** Producer, rapper, fonici, manager, organizzatori, brand,
  gente di strada: ognuno ha un grado (conoscenza → contatto → amico → collaboratore →
  fidato → partner) e i migliori chiedono fama, hype e conoscenze in comune. Farmare la
  rete è gameplay, non un menu.

La provincia è costruita (`frontend/js/game/hub.js` + `frontend/css/hub.css`); **la mappa è
la foto stessa** (`frontend/media/photo/mappa_citta.jpg`, il concept ritagliato a 830×677:
spilli e targhette sono dentro all'immagine, sopra ci stanno solo le zone da toccare).
Milano e Los Angeles per adesso sono ancora solo concept art.

## Multiplayer: la classifica è una sola

**Punto 30 di `implementazioni.md`.** La classifica non è più una faccenda privata fra te
e i rivali generati sul tuo computer: ce n'è una sola, uguale per tutti, e ci stanno dentro
i giocatori veri. Finché i giocatori veri sono pochi il numero lo fanno i bot — e i bot
**non si riconoscono**: nomi da rapper veri (`Nino Vento`, `Marco T.`, `Young Ferro`), una
città, un genere, una storia, uscite che escono e contratti che firmano. Il server non dice
mai a nessuno chi è un bot: è una regola di gioco, non una dimenticanza.

La classifica si muove anche quando nessuno gioca: ogni 24 ore vere il server fa un giro di
settimana, e chi sparisce scende. Rotte, manopole e freni contro l'imbroglio stanno in
[`backend/README.md`](backend/README.md); il modello dei dati in
[`backend/database/README.md`](backend/database/README.md).

**La schermata classifica non è ancora agganciata**: il ponte c'è
(`frontend/js/net/online.js`), la lista in schermo disegna ancora i rivali locali. È il
prossimo pezzo, l'ordine di lavoro sta in `ROADMAP.md`.

## Team

Alessio (La Fame Studio), Claude, Carletto.
