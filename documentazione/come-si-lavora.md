# Come si lavora

Le regole di lavoro, che valgono per tutti e per tutto: il gioco, il server, i documenti.
Erano le prime righe del vecchio `implementazioni.md`, poi sono state per qualche giorno in
`implementazioni/00-come-si-lavora.md`. Stanno qui perché non riguardano solo i punti da
fare: riguardano il progetto.

**La versione corta sta in [`../CLAUDE.md`](../CLAUDE.md)**, in radice. Quello è il file
che ogni sessione di Claude si legge da sola prima di toccare qualcosa; questo è quello che
racconta il perché. Se una regola cambia qui, va cambiata anche lì — sono dieci righe, non
è un lavoro.

---

## La regola di partenza (parole di Carletto)

> quando finisci una task committa e pusha e nel committ fai riferimento al punto del file
> completato. Se vedi che viene modificato il file non preoccuparti, sono io, tu continua
> con quello che stai facendo, ogni volta che finisci un task segnalo come completato

---

## Come sono organizzati i punti

Era un file solo, ed era diventato lungo come un libro: mille righe in cui per ritrovare
una cosa bisognava sapere già dov'era. Adesso è una cartella,
[`implementazioni/`](../implementazioni/README.md), **un file per argomento**, e l'indice
sta nel suo README.

**I punti nuovi si scrivono in
[`implementazioni/implementazioni.md`](../implementazioni/implementazioni.md)**, che è
rimasto lì apposta: è il foglio dove si butta l'idea appena viene, senza pensare a dove va.
Quando un punto è chiuso — o anche solo quando si capisce di che argomento è — si sposta
nel file giusto, con dentro scritto **cosa è stato fatto e quando**.

Perché sia questo il verso e non il contrario: chi ha l'idea non deve fermarsi a decidere
in quale file va. Quello è lavoro di dopo, e lo fa chi mette a posto.

**Se un punto è chiuso ma non si sa in che argomento metterlo**, o è già raccontato per
esteso da un'altra parte, va in [`implementazioni/fatte.md`](../implementazioni/fatte.md) e
basta: meglio lì che lasciato nel foglio dei punti nuovi a farlo diventare lungo un'altra
volta.

## Come si segna un punto chiuso

Sotto al punto, indentato, una riga che dice cosa è stato fatto:

```
   **FATTO (01/09/2026)** — cosa c'è adesso, in una frase.
   - i dettagli che servono a chi ci torna fra un mese
   - e i file toccati, se aiutano
```

Se è fatto a metà si scrive **FATTO in parte** e cosa manca. Se non è stato fatto ma se
n'è discusso, si scrive **RISPOSTA** e il ragionamento: serve a non rifare due volte la
stessa discussione fra tre settimane.

Vale la pena scriverlo bene: sette punti di quella cartella risultavano chiusi solo dai
messaggi dei commit, e nessuno se lo ricordava più. Adesso hanno una riga che lo dice, ma
è roba recuperata dalla storia di git — meglio non doverlo rifare.

## I numeri dei punti si spostano

**Nei commit e nei rimandi si cita il testo del punto, non solo il numero.**

I numeri non sono fissi. Carletto rinumera le liste mentre si lavora, i punti chiusi
vengono spostati nel file del loro argomento, e nelle liste restano i buchi — voluti, per
non rinumerare tutto un'altra volta. Risultato: il «punto 24» di stamattina può essere il
«punto 22» di stasera, e un commit che dice solo «punto 24 fatto» fra un mese non si sa
più a cosa si riferisse. Peggio ancora se si sta scrivendo dentro a un punto mentre lui lo
sposta: si finisce per segnare come chiuso quello sbagliato.

Quindi:

- nel messaggio del commit va **il testo**, non il numero da solo: `feat: la palestra
  diventa un posto suo (punto 61)` e non `feat: punto 61`;
- quando un documento rimanda a un altro punto, si scrive **come si chiama**: «vedi *Il
  telefono nuovo, quello della foto*», non «vedi il punto 68»;
- il numero si può mettere lo stesso, ma sempre **dopo** il testo, come aiuto e non come
  nome.

L'indice in [`implementazioni/README.md`](../implementazioni/README.md) si ritrova per
titolo, non per numero: è fatto apposta.

## Come si controlla il lavoro prima di chiuderlo

**Il comando è `npm run verifica`, dal frontend.** Non `npm run prova`.

```bash
cd frontend
npm run verifica
```

`npm run prova` fa girare solo i test. `verifica` fa quattro cose, una dietro l'altra:

| | cosa controlla |
| --- | --- |
| `npm run prova` | i test del gioco |
| `strumenti/audit-regressioni.js` | **che quello che c'era ci sia ancora**: più di 260 controlli sulle cose già fatte |
| `npm run verifica:build` | che il build e il file unico della demo escano ancora |
| `npm run verifica:dipendenze` | `npm audit` sul frontend e sul backend |

Quello che conta è il secondo. **Togliere una cosa dal gioco rompe l'audit**, ed è il suo
mestiere: l'audit sa che una funzione, una schermata o un file dovevano esserci, e se
spariscono lo dice. Chi lancia solo `npm run prova` non se ne accorge, perché i test
passano lo stesso. Se una cosa è stata tolta apposta, si toglie **anche il controllo che la
cercava**, nello stesso commit, e nel messaggio si scrive perché.

**E si fa girare `verifica` anche prima di cominciare**, sulla base pulita. `main` non è
sempre verde: se era già rosso e te ne accorgi solo alla fine, passi la serata a cercare
dentro al tuo lavoro una rottura che non è tua. Due minuti prima ne risparmiano due ore
dopo.

Il backend ha i suoi: `cd backend && npm run prova`, e `npm run postman` per le rotte.

## Il giro di fine task

Committata la task, **prima di pushare** si fa un giro di controllo con i due agenti che lo
sanno fare. Non sono un lusso di fine settimana: sono la rete sotto al filo.

| agente | cosa fa |
| --- | --- |
| `segnala-problemi` | gira il gioco, trova le cose rotte o storte e le scrive in [`problemi-riscontrati.md`](problemi-riscontrati.md). Non sistema niente |
| `backend-allineato` | controlla che le due metà del server non abbiano preso strade diverse: le rotte vere contro `README-API.md`, le migrazioni SQLite contro quelle PostgreSQL, `schema.md` contro le tabelle che esistono |

Si lanciano **insieme**, non uno alla volta, e quello che trovano si sistema subito: un
problema trovato prima del push costa un commit, dopo il push costa una discussione.
`backend-allineato` serve davvero quando la task ha toccato `backend/` — se il backend non
l'ha visto nessuno e il giro precedente era pulito, si può dire in una riga e saltarlo.

Non serve ricordarselo: dopo ogni `git commit` c'è un hook che lo chiede
(`scripts/dopo-la-task.js`, qui sotto). Se però il commit è fatto a mano da un terminale
qualsiasi, l'hook non c'è — lì tocca ricordarselo.

C'è anche un terzo agente, `prova-sul-telefono`, che apre il gioco a misura di telefono e
ci gioca davvero. Quello **non** è da ogni task: il giro dura, e si fa quando si sono
toccate schermate, CSS o card. Se ne occupa un promemoria suo, all'inizio della sessione.

## Quello che gira da solo

<!-- ADF-AUTO-WORKFLOW -->
### Stato automatico delle implementazioni

`ROADMAP.md` rimane **la roadmap ufficiale**. L'automazione la legge e può anche mantenerla: se dall'audit emerge un **buco minore** (un passaggio mancante, un prerequisito, una dipendenza, un chiarimento coerente con una decisione già presa), un passaggio dedicato può aggiornare `ROADMAP.md`. Le modifiche strutturali (`major`) non vengono applicate automaticamente: restano evidenziate nel cruscotto finché non vengono revisionate.

Il bootstrap importa **tutte le righe già presenti** in `implementazioni/README.md` dentro `implementazioni/auto/tasks/`, mantenendo titolo, file sorgente e stato storico. I file storici in `implementazioni/*.md` non vengono riscritti. Le task vengono poi auditate contro il repository a piccoli batch: prima quelle nuove, a metà o da fare, poi quelle già segnate come fatte. Lo stato storico e lo stato verificato restano separati, così il sistema non cancella lavoro precedente e non finge che una verifica sia avvenuta quando non è avvenuta.

Per le nuove idee basta una checkbox nell'Inbox automatica di `implementazioni/implementazioni.md`. Prima di trasformarla in lavoro, il sistema la confronta con tutte le task, la roadmap e il codice: può classificarla come nuova, duplicata, estensione di una task esistente o già implementata. I duplicati non vengono conteggiati come nuove task. Se l'audit AI non è disponibile, la richiesta resta pendente e lo storico rimane intatto. I criteri di UI, bilanciamento e gameplay non possono chiudersi automaticamente senza una prova manuale.

Nel progetto ci sono cose che si muovono senza che nessuno le lanci. Conviene sapere quali
sono, se non altro per non rifarle a mano:

| cosa | quando parte | dove sta |
| --- | --- | --- |
| il controllo che il backend sia allineato | a ogni messaggio | `scripts/controlla-backend.js`, acceso da `.claude/settings.json` |
| il promemoria del giro sul telefono | all'inizio della sessione, e non più di una volta al giorno | `scripts/promemoria-telefono.js` |
| la richiesta del giro di fine task | dopo ogni `git commit` | `scripts/dopo-la-task.js` |
| **il registro delle modifiche** | dai merge in `main` | `scripts/genera-registro-modifiche.js` |
| i tre agenti (`segnala-problemi`, `backend-allineato`, `prova-sul-telefono`) | a richiesta, o quando lo chiedono gli hook qui sopra | `.claude/agents/` |

Due cose da sapere. **[`registro-modifiche/`](../registro-modifiche) non si scrive a
mano**: è un bot che lo rifà leggendo i merge, diviso per argomento, e quello che ci metti
a mano al giro dopo non c'è più. Se una cosa deve restare scritta, va in `implementazioni/`
o in un README, non lì. E gli hook **parlano solo dentro a una sessione di Claude**: un
commit fatto da un altro terminale non sveglia nessuno.

Quando si tocca uno di questi script si prova prima a mano — girano tutti anche senza
`--hook`, e in quel caso dicono cosa direbbero senza segnare niente:

```bash
node scripts/controlla-backend.js
node scripts/promemoria-telefono.js
node scripts/dopo-la-task.js
```

## Le dipendenze

**Si possono usare.** Il principio «zero dipendenze» è caduto il 07/09/2026. La regola che
c'è al suo posto è una riga:

> Ognuna si sceglie, si motiva in una riga e si può togliere.

Come si sceglie — le cinque domande da farsi prima di installare, il ragionamento per
esteso, **il registro di quello che è installato** e l'elenco commentato di quello che si
potrebbe installare — sta tutto in [`dipendenze.md`](dipendenze.md). Il punto da cui è nato
è in [`implementazioni/fatte.md`](../implementazioni/fatte.md).

Qui resta **il prezzo**, che si paga a ogni commit e non una volta sola: lockfile
committato e `npm ci` in CI, una dipendenza per commit col perché nel messaggio, `npm
audit` dentro alla verifica, aggiornamenti automatici accesi, e una riga nel registro delle
dipendenze. Se quella riga non si riesce a scrivere, quella dipendenza non doveva entrare.

## Dove sta il resto

La mappa dei documenti — quali sono, dove stanno, cosa ci si trova dentro — è la tabella in
cima al **[README di radice](../README.md)**. È l'unica: quando la stessa mappa stava
scritta in tre posti, due erano sempre indietro.
