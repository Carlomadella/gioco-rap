# Comandi da terminale (punto 49)

Un solo posto con tutti i comandi che servono per lavorarci sopra — così io, Carletto e
chiunque altro apriamo il terminale e sappiamo cosa scrivere, senza andarcelo a cercare
nei file uno per uno. Tutti i comandi partono dalla cartella del repo (`gioco-rap/`),
salvo dove è scritto diversamente.

## Prima di tutto: allinearsi col repo

Carletto (e a volte anche Claude) committa in continuazione: prima di mettersi a
lavorare, sempre un giro di aggiornamento.

```bash
git status              # cosa hai di tuo, non salvato
git pull                # porta a casa gli ultimi commit
```

Se `git status` mostra file modificati che non ricordi di aver toccato tu, non
cancellare niente alla cieca — guarda cosa dice `git diff <file>` prima.

Per mandare su un lavoro finito:

```bash
git add -A
git commit -m "descrizione breve di cosa hai fatto, col punto del file"
git push
```

Se `git push` viene rifiutato («non-fast-forward»), qualcuno ha pushato nel frattempo:

```bash
git pull        # (senza --rebase: qui si fa merge, non si riscrive la storia)
git push
```

## Il gioco (frontend)

Tutti i comandi qui sotto vanno lanciati dentro `frontend/`:

```bash
cd frontend
```

```bash
npm run dev
```
Il gioco dai sorgenti, con ricarica automatica: apri `http://localhost:8000`, salvi un
file e la pagina si rifà da sola. È il comando che si usa il 90% del tempo mentre si
lavora.

```bash
npm run build
```
Il pacchetto vero per gli store: tutto il codice e lo stile diventano due file soli,
minificati, dentro `frontend/dist/`. `dist/` non va mai toccato a mano — lo riscrive
ogni volta il comando.

```bash
npm run demo
```
Il gioco intero (immagini comprese) in **un file HTML solo**, `dist/anni-di-fame.html`:
si manda a chiunque per un playtest veloce, non serve un server.

```bash
npm run prova
```
Dodici controlli senza aprire un browser: file dimenticati fuori da `index.html`,
immagini sparite da sotto a un CSS, codice che non compila, build senza l'impronta nel
nome. **Va lanciato prima di ogni commit** che tocca `frontend/`.

## Il server (backend)

Serve **Node 22.5 o più nuovo** (per via di `node:sqlite`, che è dentro Node senza
installare niente). Comandi da lanciare dentro `backend/`:

```bash
cd backend
```

```bash
npm start
```
Accende il server su `http://localhost:8787`. La prima volta crea da solo il database
(`backend/database/dati/classifica.db`), applica le migrazioni e ci mette dentro 140
bot finti in scala. Il gioco (`frontend`) lo trova da solo: `js/net/online.js` punta a
`localhost:8787` di suo, non c'è niente da configurare per lavorarci in locale.

```bash
npm run prova
```
Le prove del server (143 controlli, in crescita): account, sessioni, classifica,
salvataggi in cloud, accessi Steam/Apple/Google, moderazione, sospetti. **Va lanciato
prima di ogni commit** che tocca `backend/`.

```bash
npm run postman
```
Le 34 rotte provate da fuori, con la collezione Postman: 91 richieste e 498 controlli,
nove secondi. Si tira su un server suo con un database usa e getta, quindi non tocca
niente di tuo e si può lanciare anche col server acceso. La prima volta si scarica
`newman` (Postman da riga di comando), poi se lo tiene.

```bash
npm run copia
```
Copia di sicurezza del database, anche a server acceso. Tiene le ultime trenta e
controlla che quella appena fatta si apra davvero. Da lanciare ogni tanto quando il
database ha dentro roba vera (account, salvataggi) — non è automatico.

```bash
npm run travaso
```
Porta i dati dal vecchio archivio JSON dentro al database SQLite. Serve una volta sola,
già fatto: non lanciarlo di nuovo se il database esiste già.

## Lavorarci sopra insieme (frontend + backend)

Per provare il gioco con la classifica vera, gli account e il salvataggio in cloud,
servono **due terminali aperti insieme**:

```bash
# terminale 1
cd backend && npm start

# terminale 2
cd frontend && npm run dev
```

Poi apri `http://localhost:8000` nel browser: il gioco parla da solo con il server su
`:8787`. Se il server non è acceso, il gioco continua a funzionare lo stesso (classifica
e cloud spariscono, tutto il resto no) — è voluto, non un errore.

## Problemi comuni

**«address already in use» quando fai `npm run dev` o `npm start`** — c'è già un
processo acceso su quella porta (magari un terminale che avevi dimenticato aperto).
Per vedere chi occupa la porta 8000 o 8787:

```bash
lsof -i :8000
lsof -i :8787
```

Se è un tuo vecchio processo morto a metà, chiudilo (`kill <pid>`) e riprova; se invece
sta già girando bene, usa quello — non serve riaccenderlo.

**Node troppo vecchio per il backend** (`node:sqlite` non c'è) — controlla la versione:

```bash
node --version     # deve essere 22.5 o più
```

**`npm run prova` del frontend segnala il build mancante** — è normale se non hai mai
lanciato `npm run build` in quella copia del repo: lancialo una volta, poi la prova
passa anche sul build.
