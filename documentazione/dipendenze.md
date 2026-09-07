# Le dipendenze

Il principio **«zero dipendenze» non c'è più** _(tolto il 07/09/2026)_. Al suo posto c'è
una regola, ed è una cosa diversa: lo slogan rispondeva prima di sentire la domanda, la
regola la domanda la fa — e qualche volta risponde ancora di no.

> **Le dipendenze si possono usare. Ognuna si sceglie, si motiva in una riga e si può
> togliere.** Non è «meno pacchetti possibile»: è «nessun pacchetto per caso».

Questo foglio è **il posto da guardare prima di installare qualcosa**. Il ragionamento per
esteso — i pro, i contro, e l'elenco commentato di tutto quello che si potrebbe installare,
un centinaio di pacchetti — sta nel punto **«togli il principio zero-dipendenze»** di
[`../implementazioni/implementazioni.md`](../implementazioni/implementazioni.md).

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
- `npm audit` gira dentro `npm run verifica` del frontend, in fondo, dopo il build;
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

---

## Se un giorno la tabella si svuota

Togliere una dipendenza è una riga in meno qui e una modifica al file che le sta davanti.
Se il file davanti non c'è, la dipendenza è entrata male: prima si costruisce il file, poi
si toglie il pacchetto.
