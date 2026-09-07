# Le dipendenze

Il principio **«zero dipendenze» non c'è più** _(tolto il 07/09/2026)_. Al suo posto c'è
una regola, ed è una cosa diversa: lo slogan rispondeva prima di sentire la domanda, la
regola la domanda la fa — e qualche volta risponde ancora di no.

> **Le dipendenze si possono usare. Ognuna si sceglie, si motiva in una riga e si può
> togliere.** Non è «meno pacchetti possibile»: è «nessun pacchetto per caso».

Questo foglio è **il posto da guardare prima di installare qualcosa**: la regola, il prezzo,
il registro di quello che c'è, il ragionamento che ha fatto cadere il principio e l'elenco
commentato di tutto quello che si potrebbe installare.

| se cerchi | vai a |
| --- | --- |
| posso installare questa cosa? | [Le cinque domande](#le-cinque-domande) |
| cosa devo fare il giorno che la installo | [Il prezzo](#il-prezzo-che-si-paga-sempre) |
| cosa c'è dentro oggi, e come si toglie | [Il registro](#quello-che-cè-installato-oggi) |
| perché il principio è caduto | [Il ragionamento](#perché-il-principio-è-caduto) |
| cosa esiste là fuori e cosa fa | [L'elenco](#lelenco-tutto-quello-che-si-potrebbe-installare) |

---

## Le cinque domande

Prima di installare. Se una risposta è storta, non si installa.

1. **Entra nel gioco o resta fuori?** Se resta negli strumenti (build, prove, immagini, CI)
   la soglia è bassa: sbagli, la togli, il giocatore non se n'è accorto. Se entra in
   `gioco-*.js` la soglia è alta: si misura il peso col build prima e dopo, **e il numero si
   scrive qui sotto**.
2. **La cosa che fa è difficile, e la difficoltà è di qualcun altro?** Crittografia,
   protocolli, formati di immagine, audio sui browser veri: sì. Cinque funzioni di comodo e
   un router: no, quelli li scriviamo meglio noi e in italiano.
3. **Quanti pacchetti si porta dietro?** Si guarda l'albero, non la scheda: `npm ls --all`
   dopo l'installazione. Uno che ne tira quaranta è quaranta, non uno.
4. **Si può togliere in un giorno?** Ogni dipendenza sta **dietro a un file nostro**. Se
   domani muore, si cambia un file solo — ed è la colonna «come si toglie» della tabella.
5. **È viva, e la licenza va bene per un gioco venduto?** Ultimo rilascio, quanti la
   mantengono. MIT/Apache/BSD sì, GPL/AGPL no, «gratis finché non guadagni» no.

## Il prezzo, che si paga sempre

- il **lockfile si committa** (`frontend/package-lock.json`, `backend/package-lock.json`), e
  in CI si usa `npm ci`, mai `npm install`;
- **una dipendenza per commit**, col perché nel messaggio;
- `npm audit` gira dentro `npm run verifica` del frontend, in fondo, dopo il build
  (`npm run verifica:dipendenze` da solo);
- dove si può, si installa con `--ignore-scripts`;
- **una riga in questa tabella.** Se non si riesce a scrivere, quella dipendenza non doveva
  entrare.

---

## Quello che c'è installato oggi

Sono due. **[dentro]** vuol dire che finisce nel prodotto e pesa; **[fuori]** che resta
negli strumenti e al giocatore costa zero.

| pacchetto | dove | dentro/fuori | a cosa serve | perché non è scritta a mano | come si toglie |
| --- | --- | --- | --- | --- | --- |
| [`esbuild`](https://esbuild.github.io/) `^0.25.0` (MIT) | `frontend/package.json`, `devDependencies` | **fuori** | mette insieme e minifica i 13 CSS e i 72 JS in due file soli: è il motore di `npm run build`, cioè del pacchetto che va sugli store | un minificatore JavaScript corretto è un parser completo del linguaggio: si sbaglia in silenzio e si scopre in produzione | sta dietro alla funzione `esbuild()` di [`../frontend/strumenti/build.js`](../frontend/strumenti/build.js): un file solo, e il build senza minificazione continua a girare |
| [`pg`](https://node-postgres.com/) `^8.23.0` (MIT) | `backend/package.json`, `dependencies` | **fuori** (server) | il client PostgreSQL: SCRAM-SHA-256, TLS, decodifica dei tipi, riconnessioni. Serve solo con `ADF_PG` acceso; di suo il server va a SQLite dentro a Node | è il file che tiene le carriere della gente: quattro punti dove un errore sottile non si vede subito e si paga sui dati veri. Il perché per esteso in [`../backend/database/README.md`](../backend/database/README.md) | sta dietro a [`../backend/database/postgres.js`](../backend/database/postgres.js): senza `ADF_PG` non viene nemmeno caricato |

## Quello che entrerebbe per prime, e non è ancora entrato

Nessuna delle tre entra nel gioco: al giocatore costano zero KB. Non sono installate: sono
la decisione già presa su cosa viene dopo.

| pacchetto | a cosa servirebbe | perché prima delle altre |
| --- | --- | --- |
| `jose` | verifica dei token Apple e Google al posto di quella scritta a mano in `backend/accessi.js` | è il posto peggiore del progetto dove risparmiare: un errore lì non lo prende nessun test e si scopre quando qualcuno entra nell'account di un altro |
| `eslint` (+ `globals`) | trova variabili mai dichiarate, roba assegnata e mai usata, `==` al posto di `===` | 72 file senza moduli che condividono lo stesso scope e non hanno **nessuna** rete: oggi un nome storto lo trova un giocatore |
| `vitest` + `jsdom` | provare **il comportamento** invece di cercare stringhe dentro ai file | `strumenti/audit-regressioni.js` sono 260 grep: il giorno che sposti una cosa si spegne o urla a vuoto, ed è già successo |

## Se un giorno la tabella si svuota

Togliere una dipendenza è una riga in meno qui e una modifica al file che le sta davanti.
Se il file davanti non c'è, la dipendenza è entrata male: prima si costruisce il file, poi
si toglie il pacchetto.

---

# Perché il principio è caduto

Il ragionamento, per chi ci torna fra un mese e vuole sapere se la decisione reggeva.

## Prima cosa: era già caduto da solo

Non l'abbiamo abbattuto noi. Guarda cosa c'era installato il giorno in cui è stato tolto:

- `frontend/package.json` → **esbuild**, e senza quello non esiste `npm run build`, cioè non
  esiste il prodotto che si mette su Steam;
- `backend/package.json` → **pg**, e il perché è già scritto per esteso in
  [`../backend/database/README.md`](../backend/database/README.md).

Quindi la frase vera non era «zero dipendenze»: era «zero dipendenze tranne le due che ci
servono davvero, e non abbiamo mai scritto il criterio per la terza». Il criterio è quello
che mancava, ed è quello che c'è qui sopra.

## I pro — cosa si guadagna a togliere il principio

1. **Si sblocca l'uscita sugli store**, cioè il punto 32 di
   [`../implementazioni/08-uscita-sugli-store.md`](../implementazioni/08-uscita-sugli-store.md).
   Electron, Capacitor e le API di Steamworks non si riscrivono a mano: sono il guscio
   nativo, la firma dei pacchetti, gli aggiornamenti, i traguardi, Steam Cloud. Con «zero
   dipendenze» il gioco resta un `index.html` per sempre. Questa da sola vale il cambio di
   regola.
2. **La sicurezza smette di essere roba nostra.** `backend/accessi.js` verifica a mano i JWT
   di Apple e Google: base64url, firma RS256, JWKS, rotazione delle chiavi, `iss`/`aud`/`exp`.
   È scritto bene, ma è **il posto peggiore del progetto dove risparmiare**: un errore lì non
   lo prende nessun test e si scopre quando qualcuno entra nell'account di un altro. `jose`
   fa esattamente quello, lo fa da anni e lo leggono in tanti.
3. **Prove vere al posto dei grep.** `strumenti/audit-regressioni.js` sono 260 controlli che
   leggono i file come testo e ci cercano dentro delle stringhe. Funziona finché nessuno
   rinomina niente: il giorno che togli o sposti una cosa l'audit si spegne o urla a vuoto, e
   ci è già successo. Con `vitest` + `jsdom` si prova **il comportamento** (l'energia scende,
   il giorno dopo la chat si riapre, il salvataggio regge il giro), non la presenza di una
   parola in un file.
4. **Un linter su 27.000 righe che condividono lo stesso scope.** 72 file senza moduli, tutti
   che si passano `G`, `PHASES`, `pick`, `$`. Un nome scritto storto oggi non lo prende
   nessuno finché non ci passa sopra un giocatore. ESLint lo prende in due secondi.
5. **Il tempo torna sul gioco.** Ogni ora spesa a riscrivere un dev server, un watcher, un
   runner di prove o un ridimensionatore di immagini è un'ora non spesa su beat, eventi e
   bilanciamento — che è l'unica cosa che il giocatore vede.
6. **Cose che oggi non facciamo proprio.** Comprimere e convertire le immagini (`sharp`), un
   service worker fatto come si deve (`workbox`), lo sblocco dell'audio su iOS, i grafici
   dell'app «come vanno le canzoni», gli errori dal campo dopo l'uscita.
7. **Chi arriva dopo trova strumenti che conosce.** Se un domani qui ci lavora qualcun altro,
   `vitest` e `eslint` li sa già; `strumenti/prova.js` glielo devi spiegare.

## I contro — e non sono piccoli

1. **La catena di fornitura.** Il gioco si firma col nostro nome e si vende. Un pacchetto
   compromesso non è un fastidio: è codice nostro che ruba roba a chi ci ha pagato. E il
   rischio vero non è il pacchetto che scegli, sono i **quaranta che si tira dietro** e gli
   script `postinstall` che girano sulla tua macchina.
2. **Il peso, ma solo dentro al gioco.** Ogni KB che entra in `gioco-*.js` è avvio più lento
   su un telefono scarso — che è mezzo pubblico degli store. Le dipendenze che restano negli
   strumenti non pesano niente; quelle che entrano nel prodotto si misurano col build, una
   per una.
3. **La manutenzione non finisce mai.** Un pacchetto è per sempre: versioni maggiori, cose
   deprecate, la libreria abbandonata dopo due anni. Prima il progetto questo lavoro non ce
   l'aveva; da adesso sì, e va messo in conto.
4. **Si perde leggibilità.** Oggi quasi ogni riga che gira è nostra, in italiano, con un
   README che dice perché. Una dipendenza è codice che nessuno leggerà mai: quando si rompe
   non si aggiusta, si aspetta.
5. **Le licenze diventano un problema vero.** In un gioco _venduto_ una GPL/AGPL non ci può
   stare, e certe cose «gratis» sono gratis finché non incassi. Si guarda prima, non dopo.
6. **Node ha già dentro mezzo elenco.** `node:sqlite`, `node:test`, `fetch`, `crypto`,
   `zlib`, `AsyncLocalStorage`: se la cosa c'è già, installarla è solo un pacchetto in più da
   aggiornare.
7. **Il rischio più concreto: la porta aperta.** Tolto il principio, la tentazione è
   installare per abitudine e ritrovarsi con 400 pacchetti in tre mesi senza che nessuno
   abbia deciso niente. È esattamente per questo che al posto del principio c'è una regola, e
   non il vuoto.

## Cosa cambia nel progetto, in ordine di quanto conta

1. **Il guscio nativo** (Electron + electron-builder, Capacitor, steamworks.js). È il punto
   32 di
   [`../implementazioni/08-uscita-sugli-store.md`](../implementazioni/08-uscita-sugli-store.md),
   e senza dipendenze non parte proprio.
2. **`accessi.js` passa a `jose`**, e la validazione dei corpi delle rotte passa a `zod`
   (oggi è a mano, rotta per rotta). Meno codice nostro nel punto più delicato.
3. **Le prove diventano prove**: `vitest` + `jsdom` per la logica, `playwright` per il giro
   sul telefono (che oggi è a mano, e in [`problemi-riscontrati.md`](problemi-riscontrati.md)
   si vede quanto è lungo). `audit-regressioni.js` non si butta: si converte un blocco alla
   volta, e finché non è convertito resta dov'è.
4. **ESLint più `// @ts-check` con TypeScript usato solo come controllore** — niente
   riscrittura, niente file `.ts`: i tipi si scrivono nei commenti dove servono. Sui 72 file a
   scope condiviso è la rete che oggi manca del tutto.
5. **Le immagini**: `sharp` e `svgo` dentro al build, WebP/AVIF e le icone degli store
   generate invece che fatte a mano. Il `demo` in un file solo pesa 631 KB, quasi tutti di
   immagini.
6. **I salvataggi**, cioè il punto 34 di
   [`../implementazioni/08-uscita-sugli-store.md`](../implementazioni/08-uscita-sugli-store.md):
   `idb-keyval` per uscire dal `localStorage` e `fflate` per comprimere prima di mandarli al
   server, dove il tetto è 2 MB.
7. **Dopo l'uscita**: Sentry per gli errori veri dei giocatori veri, e `pino` sul server per
   avere log che si possono leggere.
8. **Solo se serve davvero**: audio (`howler`/`tone`), transizioni (`motion`), grafici
   (`uplot`) — tutte legate a punti ancora aperti in
   [`../implementazioni/implementazioni.md`](../implementazioni/implementazioni.md), non prima.

---

# L'elenco: tutto quello che si potrebbe installare

Le taglie sono indicative, quelle vere si misurano col build. **[dentro]** vuol dire che
finisce nel gioco e pesa; **[fuori]** che resta negli strumenti e non pesa niente.

## Strumenti del gioco — build e qualità _(fuori)_

- **esbuild** — _già installata._ Mette insieme e minifica i 13 CSS e i 72 JS in due file
  soli. È il motore di `npm run build`.
- **vitest** — il runner di prove: guarda i file e rilancia da solo, dice cosa non è coperto,
  e sa far finta di essere un browser. È il pezzo che manca per provare la logica del gioco
  senza aprire Chrome. _(Alternativa senza installare niente: `node:test`, che Node ha già
  dentro — meno comodo, zero pacchetti.)_
- **jsdom** / **happy-dom** — un DOM finto dentro Node: `document`, `localStorage`, eventi.
  Serve a `vitest` per provare le schermate. `happy-dom` è più veloce e meno completo.
- **@playwright/test** — Chrome, Firefox e Safari veri, senza finestra: apre il gioco, ci
  clicca, fa gli screenshot, fa finta di essere un iPhone 13. È il giro dell'agente
  `prova-sul-telefono`, ma automatico e dentro alla CI. _Costo: si scarica qualche centinaio
  di MB di browser._
- **eslint** (+ **globals**) — legge il codice e trova gli errori scemi: variabili mai
  dichiarate, roba assegnata e mai usata, `==` dove ci voleva `===`. Con 72 file che
  condividono lo scope è quella che rende di più.
- **prettier** — riformatta da solo, così le virgole non diventano un argomento.
- **typescript** — non per riscrivere in `.ts`: solo `// @ts-check` più i tipi nei commenti
  JSDoc. Ti dice che `G.energa` non esiste **mentre stai scrivendo**.
- **knip** / **depcheck** — trovano i file che non chiama più nessuno e i pacchetti
  installati e mai usati.
- **sharp** — il coltellino delle immagini: ridimensiona, converte in WebP/AVIF, comprime,
  genera icone e screenshot per gli store. Da sola taglia il peso del pacchetto più di
  qualunque altra cosa. _Costo: è codice nativo (libvips), si scarica un binario
  all'installazione._
- **svgo** — ripulisce gli SVG dai metadati di Illustrator e dai decimali inutili.
- **postcss** + **autoprefixer** + **cssnano** — i prefissi che servono al WebView di Android
  e al Safari di iOS, più la minificazione del CSS.
- **lightningcss** — le stesse tre cose in un pacchetto solo, e molto più veloce.
- **chokidar** — guarda i file e avvisa quando cambiano, meglio di `fs.watch`, che su Windows
  e su macOS si comporta in modo diverso. Sta sotto a `npm run dev`.
- **ws** — WebSocket per la ricarica automatica del dev server (oggi fatta a mano).
- **workbox-build** — genera il service worker: cosa si tiene in cache, cosa si aggiorna,
  come si esce dalla cache vecchia. Oggi `js/servizio.js` è a mano, ed è il tipo di file dove
  l'errore si vede solo dopo un aggiornamento.
- **pa11y** / **@axe-core/cli** — passano il gioco al setaccio dell'accessibilità: contrasti,
  bottoni senza nome, cose che da tastiera non si raggiungono.
- **lighthouse** — misura avvio e prestazioni, con un numero che si può confrontare fra due
  build.
- **husky** + **lint-staged** — fanno girare linter e prove **prima** del commit, e solo sui
  file toccati. _(In `.githooks/` c'è già qualcosa: forse basta quello.)_
- **npm-run-all** / **concurrently** — far partire più script insieme (server + watcher) con
  un comando solo.

## Dentro al gioco — queste pesano _(dentro)_

- **howler** — l'audio come si deve: sprite di suoni, volumi, dissolvenze, e soprattutto **lo
  sblocco dell'audio su iOS**, che è la cosa che fa impazzire tutti. ~10 KB compressa.
- **tone** — un piano sopra: sequencer, tempo, sintesi, effetti. Ha senso solo se il beat si
  costruisce davvero dentro al gioco (`js/audio/beat-project.js` va in quella direzione).
  Grossa, oltre i 150 KB: da valutare col build in mano.
- **idb-keyval** — `localStorage` ma su IndexedDB: asincrono, senza il tetto dei 5 MB, e non
  sparisce quando il sistema fa pulizia. È il punto 34 di
  [`../implementazioni/08-uscita-sugli-store.md`](../implementazioni/08-uscita-sugli-store.md).
  ~1 KB.
- **fflate** — zip e gzip in JavaScript, veloce e piccola (~8 KB): comprime il salvataggio
  prima di mandarlo al server, dove il tetto è 2 MB.
- **lz-string** — più semplice e più piccola di `fflate` (~3 KB), fatta apposta per comprimere
  stringhe da mettere nel `localStorage`.
- **dompurify** — ripulisce l'HTML da quello che può far danni. Serve nel momento in cui il
  nome dell'artista, un testo scritto dal giocatore o un nome che arriva dal server finiscono
  dentro a un `innerHTML`. ~20 KB.
- **seedrandom** — numeri a caso ma **ripetibili**: dallo stesso seme esce sempre la stessa
  partita. Vuol dire poter riprodurre un bug di bilanciamento, e poter far girare mille
  partite finte per vedere se i numeri tengono. ~2 KB, e per un gestionale è la più
  sottovalutata dell'elenco.
- **motion** (Motion One) — animazioni e transizioni appoggiate a quelle del browser, ~5 KB.
  È l'aggancio naturale del punto sulle transizioni fra studio, sala e casa.
- **gsap** — la stessa cosa ma di lusso: timeline complicate, sequenze, controllo su tutto.
  Più grossa, e la licenza va ricontrollata prima di metterla in un gioco venduto.
- **uplot** — grafici piccoli e velocissimi (~45 KB): è l'app «come stanno andando le canzoni
  nel tempo» del punto sulla TRACK.
- **chart.js** — grafici più belli e più facili, ma ~200 KB: per due grafici non vale.
- **sortablejs** — trascinare per riordinare: la scaletta di un album, l'inventario, le
  priorità della settimana. ~10 KB.
- **swiper** — caroselli che scorrono col dito come su un telefono vero (le copertine, il
  negozio). Grossina, ~40 KB.
- **fuse.js** — ricerca che perdona i refusi: contatti del telefono, beat, negozio. ~12 KB.
- **canvas-confetti** — i coriandoli. Sembra una scemenza: è il disco d'oro, il primo posto in
  classifica, il contratto firmato. ~3 KB.
- **mitt** / **nanoevents** — un bus di eventi in meno di un KB, per smettere di chiamarsi a
  mano fra un file e l'altro.
- **nanostores** — stato reattivo minimo (~1 KB): quando `G` cambia, la schermata si rifà da
  sola. Da guardare solo se un giorno si passa ai moduli ES.
- **i18next** — traduzioni per davvero: plurali, formati, lingua di riserva. Serve il giorno
  che il gioco esce in inglese; oggi `js/lingua.js` fa il suo.
- **zod** — descrive la forma di un dato e la controlla. Dentro al gioco serve a una cosa sola
  ma importante: **aprire un salvataggio vecchio o rotto senza esplodere**, dicendo
  esattamente cosa non torna. ~14 KB.
- **ajv** — la stessa idea con JSON Schema: buona per validare
  `eventi-master-1000-v1.2.13.json`, che è grosso e scritto a mano. Può girare anche solo
  negli strumenti, e allora non pesa niente.

## Il guscio per gli store

- **electron** — mette il gioco dentro a un'applicazione desktop vera per Windows, macOS e
  Linux. È il modo in cui si va su Steam.
- **electron-builder** — dall'applicazione al pacchetto: `.exe`, `.dmg`, `.AppImage`, firma
  del codice, notarizzazione Apple, aggiornamenti automatici.
- **electron-store** — le impostazioni salvate su un file vero invece che nel browser.
- **steamworks.js** — le API di Steam da Node: traguardi, statistiche, **Steam Cloud**,
  l'overlay, «ci sto giocando ora». Senza questa, su Steam sei un `.exe` e basta.
- **@capacitor/core**, **@capacitor/cli**, **@capacitor/ios**, **@capacitor/android** — lo
  stesso guscio per iPhone e Android: il gioco gira dentro a un'app vera, con la sua icona e
  la sua pagina sullo store.
- **@capacitor/preferences** — le impostazioni tenute dal sistema e non dal browser (il
  `localStorage` di un WebView si perde).
- **@capacitor/filesystem** — i file veri sul telefono: i salvataggi del punto 34.
- **@capacitor/haptics** — la vibrazione: il telefono che trema quando dentro al gioco arriva
  un messaggio.
- **@capacitor/splash-screen**, **@capacitor/status-bar**, **@capacitor/app** — la schermata
  d'avvio, la barra in alto, e sapere quando il giocatore esce e torna, che è il momento in
  cui si salva.
- **@capacitor/share** — il tasto «condividi»: la classifica, la copertina, il traguardo.

## Il server

- **pg** — _già installata._ Il client PostgreSQL: SCRAM-SHA-256, TLS, tipi, riconnessioni.
  Il perché sta in [`../backend/database/README.md`](../backend/database/README.md).
- **jose** — JWT e JWE fatti bene: verifica la firma, scarica e tiene da conto le chiavi
  pubbliche (JWKS), controlla emittente, destinatario e scadenza. **Sostituisce la parte più
  delicata di `accessi.js`.** È la prima che installerei.
- **zod** — controlla il corpo di ogni richiesta prima che tocchi il database, e risponde
  dicendo quale campo è sbagliato. Oggi è a mano, rotta per rotta, e le rotte crescono.
- **pino** — log strutturati in JSON, velocissimi: si filtrano, si contano, si mandano da
  qualche parte. Con **pino-pretty** restano leggibili mentre sviluppi.
- **rate-limiter-flexible** — limiti di richieste che funzionano anche con più processi
  (memoria condivisa o Redis). Oggi `ADF_BUSSATE` conta in RAM: con due server non conta più
  niente.
- **ioredis** — Redis, cioè memoria condivisa fra processi: sessioni, limiti, cache. Serve
  solo dal giorno in cui i server sono più di uno.
- **hono** / **fastify** — router HTTP piccoli e moderni. Adesso non servono: il routing a
  mano regge. Da riguardare se arrivano upload, sessioni o WebSocket.
- **helmet** — le intestazioni di sicurezza standard. Ha senso solo con Express dietro.
- **nodemailer** — mandare mail: conferma dell'iscrizione, recupero della password. Il giorno
  che gli account con la mail diventano una cosa seria, serve.
- **argon2** / **bcrypt** — hash delle password. Lo `scrypt` di Node fa già il suo lavoro: si
  cambia solo per avere lo standard più recente.
- **@sentry/node** e **@sentry/browser** — raccolgono gli errori dei giocatori veri, con lo
  stack e cosa stavano facendo. Dopo l'uscita è la differenza fra sapere che una cosa si rompe
  e leggerlo in una recensione a una stella.
- **undici** — client HTTP veloce. _Non serve:_ Node 22 ha già `fetch` dentro.
- **better-sqlite3** — _non serve:_ `node:sqlite` fa già quello che ci occorre.
- **dotenv** — _non serve:_ `backend/ambiente.js` legge già `.env.local`.
- **node-cron** — _non serve:_ il giro di settimana parte da sé alla prima richiesta utile,
  ed è meglio così.
- **supertest** — _non serve:_ `backend/prova.js` parla HTTP vero, che è più onesto.

## Intorno al repo

- **Renovate** o **Dependabot** — aprono loro le richieste di aggiornamento, una per
  pacchetto, con le note di versione allegate. Senza uno dei due, avere dipendenze diventa
  debito.
- **lockfile-lint** — controlla che nel lockfile non si siano infilati indirizzi strani al
  posto del registro ufficiale.
- **`npm audit`** — è già dentro npm, e adesso è dentro anche a `npm run verifica`.
- **license-checker** — elenca le licenze di tutto l'albero: in un gioco venduto si guardano
  **prima**.

---

## Dove è stata tolta la frase

`README.md`, `ROADMAP.md`, `frontend/README.md`, `backend/README.md`,
`backend/database/README.md`, `backend/database/postgres.js`, `backend.md` e
[`../implementazioni/00-come-si-lavora.md`](../implementazioni/00-come-si-lavora.md): dove
«zero dipendenze» era una _regola_ adesso c'è la regola nuova; dove era la _descrizione di
com'è fatto oggi_ è rimasta, corretta (il backend una dipendenza ce l'ha, `pg`, e il gioco ha
esbuild).
